from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_cors import CORS
import faiss
from sentence_transformers import SentenceTransformer
import faq_db
from fuzzywuzzy import process
import numpy as np
import random
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
import string

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('punkt_tab')

app = Flask(__name__)
app.secret_key = '404error'
CORS(app)

model = SentenceTransformer('all-MiniLM-L6-v2')

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def preprocess(text):
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    words = word_tokenize(text)
    words = [lemmatizer.lemmatize(word) for word in words if word not in stop_words]
    return " ".join(words)

intent_keywords = {
    "fees": ["fee", "fees", "payment", "pay", "tuition", "amount"],
    "library": ["library", "books", "borrow", "renew", "librarian"],
    "hostel": ["hostel", "room", "curfew", "warden", "guest"],
    "academics": ["exam", "grade", "elective", "attendance", "transcript"],
    "campus_life": ["club", "gym", "shuttle", "wifi", "campus"],
    "general": ["id", "profile", "contact", "grievance", "id card"],
    "Placement": ["placement eligibility","internship","placement cell","salary offer"],
    "Transport": ["transport","bus route","bus arrival","transportation fee","whatsapp group bus","bus safety kit"],
}

def detect_intent(query):
    query = query.lower()
    for intent, keywords in intent_keywords.items():
        for keyword in keywords:
            if keyword in query:
                return intent
    return None

def build_faiss_index(questions):
    embeddings = model.encode(questions)
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(np.array(embeddings))
    return index, embeddings

def fuzzy_match(query, faqs):
    processed_query = preprocess(query)
    questions = list(faqs.keys())
    processed_questions = [preprocess(q) for q in questions]
    match_map = dict(zip(processed_questions, questions))
    best_match, score = process.extractOne(processed_query, processed_questions)
    if score > 70:
        original_question = match_map[best_match]
        return faqs[original_question]
    return None

def faiss_match(query, index, questions, faqs, min_similarity=0.70):
    query_embedding = model.encode([preprocess(query)])
    query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
    D, I = index.search(np.array(query_embedding), k=1)
    best_question = questions[I[0][0]]
    similarity = D[0][0]
    if similarity < min_similarity:
        return None
    else:
        return faqs[best_question]

def tag_match(query, faqs):
    query_words = set(preprocess(query).split())
    best_match = None
    best_score = 0
    for question, details in faqs.items():
        tags = set(details.get("tags", []))
        tags.add(question)
        common = query_words.intersection(set(word for tag in tags for word in tag.split()))
        score = len(common)
        if score > best_score:
            best_score = score
            best_match = details
    if best_score > 0:
        return best_match["answer"]
    return None

# Remove load_faqs and flatten_nested_faqs
# Use DB-backed data everywhere

def get_best_response(query):
    intent = detect_intent(query)
    if intent:
        faqs_in_intent = faq_db.get_faqs_by_category(intent)
        flat_faqs_intent = {faq["question"].lower(): faq for faq in faqs_in_intent}
        # 2. Tag match (on intent-specific data)
        tag_response = tag_match(query, flat_faqs_intent)
        if tag_response:
            return tag_response, intent
        # 3. Fuzzy match (on intent-specific data)
        fuzzy_response = fuzzy_match(query, flat_faqs_intent)
        if fuzzy_response:
            return fuzzy_response["answer"], intent

    # 4. Tag match (on global data)
    all_faqs = faq_db.get_all_faqs()
    flat_faqs_global = {faq["question"].lower(): faq for faqs in all_faqs.values() for faq in faqs}
    tag_response_global = tag_match(query, flat_faqs_global)
    if tag_response_global:
        return tag_response_global, "global"
    # 5. Fuzzy match (on global data)
    fuzzy_response_global = fuzzy_match(query, flat_faqs_global)
    if fuzzy_response_global:
        return fuzzy_response_global["answer"], "global"
    # 6. FAISS semantic match
    questions = list(flat_faqs_global.keys())
    faiss_index, _ = build_faiss_index(questions)
    faiss_response = faiss_match(query, faiss_index, questions, flat_faqs_global, min_similarity=0.70)
    if faiss_response:
        return faiss_response["answer"], "global"
    # 7. Fallback response
    fallback = "Sorry, I don't have info on that yet. You can try contacting the admin office ."
    return fallback, "fallback"

@app.route('/')
def home():
    return render_template('RMC01.html')

@app.route('/chatbot')
def chatbot():
    return render_template('Bot.html')

@app.route('/static/<path:filename>')
def staticfiles(filename):
    return app.send_static_file(filename)

@app.route('/ask', methods=['POST','GET'])
def ask():
    if request.method == 'GET':
        return jsonify({"response": random.choice(["Hello! How can I help you?","Hi there!","Greetings!"])} )
    else:
        data = request.get_json()
        query = data.get("query", "")
        last_context = session.get('last_intent', None)
        response, new_context = get_best_response(query)
        session['last_intent'] = new_context
        return jsonify({"response": response})

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username == 'admin' and password == 'admin123':
            session['admin_logged_in'] = True
            return redirect(url_for('admin_panel'))
        else:
            error = 'Invalid username or password.'
    return render_template('Login.html', error=error)

@app.route('/admin')
def admin_panel():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    all_faqs = faq_db.get_all_faqs()
    return render_template('Admin.html', faqs=all_faqs)

@app.route('/admin/add', methods=['POST'])
def add_faq():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    data = request.form
    question = data['question']
    answer = data['answer']
    tags = [tag.strip() for tag in data['tags'].split(',')]
    category = data['category']
    faq_db.add_faq(question, answer, tags, category)
    return redirect(url_for('admin_panel'))

@app.route('/admin/update', methods=['POST'])
def update_faq():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    data = request.form
    question = data['question']
    answer = data['answer']
    tags = [tag.strip() for tag in data['tags'].split(',')]
    category = data['category']
    faq_db.update_faq(question, answer, tags, category)
    return redirect(url_for('admin_panel'))

@app.route('/admin/delete', methods=['POST'])
def delete_faq():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    question = request.form['question']
    faq_db.delete_faq(question)
    return redirect(url_for('admin_panel'))

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

if __name__ == '__main__':
    app.run(debug=True)
