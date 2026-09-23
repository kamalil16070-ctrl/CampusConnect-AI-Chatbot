# Chatbot Backend

This project is a Flask-based chatbot application that utilizes machine learning techniques to provide responses based on frequently asked questions (FAQs). The chatbot uses a combination of fuzzy matching and FAISS (Facebook AI Similarity Search) for efficient querying.

## Project Structure

```
chatbot_backend
├── app.py                # Main application code for the chatbot
├── requirements.txt      # List of dependencies required to run the application
└── README.md             # Documentation for the project
```

## Setup Instructions

1. **Clone the repository** (if applicable):
   ```
   git clone <repository-url>
   cd chatbot_backend
   ```

2. **Create a virtual environment** (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the required dependencies**:
   ```
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```
   python app.py
   ```

## Usage

To interact with the chatbot, send a POST request to the `/ask` endpoint with a JSON payload containing your query. For example:

```json
{
    "query": "What are the admission requirements?"
}
```

The chatbot will respond with the most relevant answer based on the FAQs loaded in the application.

## Dependencies

The project requires the following Python packages:

- Flask
- flask-cors
- faiss-cpu
- sentence-transformers
- fuzzywuzzy
- numpy
- random2

Make sure to install these packages using the `requirements.txt` file provided.