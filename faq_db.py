import sqlite3
import json

def get_connection():
    return sqlite3.connect('faqs.db')

def get_all_faqs():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT question, answer, tags, category FROM faqs')
    rows = cursor.fetchall()
    conn.close()
    faqs_by_category = {}
    for question, answer, tags, category in rows:
        faq = {
            'question': question,
            'answer': answer,
            'tags': json.loads(tags) if tags else [],
            'category': category
        }
        faqs_by_category.setdefault(category, []).append(faq)
    return faqs_by_category

def get_faqs_by_category(category):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT question, answer, tags, category FROM faqs WHERE category = ?', (category,))
    rows = cursor.fetchall()
    conn.close()
    faqs = []
    for question, answer, tags, category in rows:
        faqs.append({
            'question': question,
            'answer': answer,
            'tags': json.loads(tags) if tags else [],
            'category': category
        })
    return faqs

def get_all_questions_for_embeddings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT question, answer, tags, category FROM faqs')
    rows = cursor.fetchall()
    conn.close()
    faqs = []
    for question, answer, tags, category in rows:
        faqs.append({
            'question': question,
            'answer': answer,
            'tags': json.loads(tags) if tags else [],
            'category': category
        })
    return faqs

def add_faq(question, answer, tags, category):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO faqs (question, answer, tags, category) VALUES (?, ?, ?, ?)',
                   (question, answer, json.dumps(tags), category))
    conn.commit()
    conn.close()

def update_faq(question, answer, tags, category):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE faqs SET answer=?, tags=?, category=? WHERE question=?',
                   (answer, json.dumps(tags), category, question))
    conn.commit()
    conn.close()

def delete_faq(question):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM faqs WHERE question=?', (question,))
    conn.commit()
    conn.close()