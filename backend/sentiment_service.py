import os
import sys

from flask import Flask, request, jsonify
from transformers import pipeline
import joblib

# category_model.pkl was trained by train_category_model.py, which is run
# FROM INSIDE backend/ml/ and imports `naive_bayes` as a top-level module.
# joblib pickles the class reference as "naive_bayes.CategoryClassifier",
# so we must add ml/ to sys.path and import it the same way here -
# `from ml.naive_bayes import ...` would break unpickling.
ML_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml")
sys.path.insert(0, ML_DIR)
from naive_bayes import CategoryClassifier  # noqa: F401 (needed for unpickling)

app = Flask(__name__)

# load the pre-trained BERT sentiment model
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

# load the trained Naive Bayes category classifier (Facilities/Staff/Collection)
CATEGORY_MODEL_PATH = os.path.join(ML_DIR, "category_model.pkl")
category_model = joblib.load(CATEGORY_MODEL_PATH)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data.get('text', '')
    
    if not text.strip():
        return jsonify({ 'sentiment': 'Neutral', 'score': 0 })
    
    result = sentiment_pipeline(text[:512])[0]  
    
    # Map labels to Positive/Neutral/Negative
    label_map = {
        'positive': 'Positive',
        'neutral': 'Neutral', 
        'negative': 'Negative',
        'LABEL_0': 'Negative',
        'LABEL_1': 'Neutral',
        'LABEL_2': 'Positive',
    }
    
    sentiment = label_map.get(result['label'].lower(), 'Neutral')
    return jsonify({ 'sentiment': sentiment, 'score': result['score'] })

@app.route('/categorize', methods=['POST'])
def categorize():
    data = request.json
    text = data.get('text', '')

    if not text.strip():
        return jsonify({ 'category': 'Other/Uncategorized', 'confidence': 0 })

    category = category_model.predict_with_fallback(text)

    # also return the raw confidence for the winning class, useful for
    # logging/debugging and for the dashboard to optionally show certainty
    probs = category_model.predict_proba(text)
    confidence = float(probs.max())

    return jsonify({ 'category': category, 'confidence': confidence })

if __name__ == '__main__':
    app.run(port=5001)