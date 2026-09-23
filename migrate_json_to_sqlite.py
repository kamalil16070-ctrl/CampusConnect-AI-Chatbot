import json
import sqlite3

with open('faqs.json', 'r') as f:
    nested_faqs = json.load(f)

conn = sqlite3.connect('faqs.db')
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT,
    tags TEXT,
    category TEXT
)''')

for category, faqs in nested_faqs.items():
    for faq in faqs:
        question = faq['question']
        answer = faq['answer']
        tags = json.dumps(faq.get('tags', []))  # Store as JSON array string
        c.execute('INSERT INTO faqs (question, answer, tags, category) VALUES (?, ?, ?, ?)',
                  (question, answer, tags, category))
conn.commit()
conn.close()