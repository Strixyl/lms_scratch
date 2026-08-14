import os
import re
import sys

from flask import Flask, request, jsonify
from transformers import pipeline
import joblib

ML_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml")
sys.path.insert(0, ML_DIR)
from naive_bayes import CategoryClassifier  

app = Flask(__name__)


sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

CATEGORY_MODEL_PATH = os.path.join(ML_DIR, "category_model.pkl")
category_model = joblib.load(CATEGORY_MODEL_PATH)

LABEL_MAP = {
    'positive': 'Positive',
    'neutral': 'Neutral',
    'negative': 'Negative',
    'LABEL_0': 'Negative',
    'LABEL_1': 'Neutral',
    'LABEL_2': 'Positive',
}

# ---- mixed-sentiment clause splitting (most-negative-wins aggregation) ----
# Handles comments like "Staff are great, although the guard was rude" —
# a single BERT call on the whole string tends to get pulled toward
# whichever clause is lexically stronger, losing the complaint if it's
# outweighed by praise elsewhere in the same comment. This splits on the
# clearest sentiment-pivot signal (contrast conjunctions) and, if any
# resulting clause is Negative, surfaces the comment as Negative overall —
# consistent with the dashboard's purpose of catching actionable
# complaints rather than averaging them away.
CONTRAST_WORDS = [
    "although", "though", "however", "but", "while", "except",
    "on the other hand", "yet",
]
MIN_CLAUSE_LENGTH = 12  # chars; avoids splitting on trivial fragments


def split_clauses(text: str):
    text = text.strip()

    candidates = []
    for word in CONTRAST_WORDS:
        pattern = r"\b" + re.escape(word) + r"\b"
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            candidates.append(match)

    if candidates:
        match = min(candidates, key=lambda m: m.start())
        before = text[:match.start()].strip(" ,.;")
        after = text[match.end():].strip(" ,.;")
        if len(before) >= MIN_CLAUSE_LENGTH and len(after) >= MIN_CLAUSE_LENGTH:
            return [before, after]

    parts = re.split(r"(?<=[.!?])\s+", text)
    parts = [p.strip() for p in parts if len(p.strip()) >= MIN_CLAUSE_LENGTH]
    if len(parts) >= 2:
        return parts

    return [text]


def bert_sentiment(text: str):
    """Runs the existing pretrained pipeline on a single string and
    returns (label, confidence) — identical call/mapping the original
    single-shot /analyze used, just factored out so it can run per clause.
    """
    result = sentiment_pipeline(text[:512])[0]
    label = LABEL_MAP.get(result['label'].lower(), 'Neutral')
    return label, result['score']


def aggregate_most_negative_wins(clause_results):
    negatives = [(s, c) for s, c in clause_results if s == "Negative"]
    if negatives:
        return max(negatives, key=lambda x: x[1])

    positives = [(s, c) for s, c in clause_results if s == "Positive"]
    if positives:
        return max(positives, key=lambda x: x[1])

    if clause_results:
        return max(clause_results, key=lambda x: x[1])
    return "Neutral", 0.0

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data.get('text', '')
    
    if not text.strip():
        return jsonify({ 'sentiment': 'Neutral', 'score': 0 })

    clauses = split_clauses(text)
    clause_results = [bert_sentiment(c) for c in clauses]
    sentiment, score = aggregate_most_negative_wins(clause_results)   #gets the most negative clause to be prioritized for improvement

    return jsonify({ 'sentiment': sentiment, 'score': score })

def get_clause_category(text: str):      #gets the negative clause and identifies which category it falls
    text = text.strip()
    if not text:
        return 'Other/Uncategorized', 0.0

    clauses = split_clauses(text)
    if len(clauses) <= 1:
        cat = category_model.predict_with_fallback(text)
        probs = category_model.predict_proba(text)
        return cat, float(probs.max())

    neg_clause_cats = []   # assigns whcih categeryo it falls to
    for c in clauses:
        sent, score = bert_sentiment(c)
        if sent == 'Negative':
            cat = category_model.predict_with_fallback(c)
            probs = category_model.predict_proba(c)
            conf = float(probs.max())
            neg_clause_cats.append((c, cat, conf, score))

    if neg_clause_cats:
        specific_neg = [item for item in neg_clause_cats if item[1] != 'Other/Uncategorized']
        if specific_neg:
            best = max(specific_neg, key=lambda x: x[3])
            return best[1], best[2]
        else:
            best = max(neg_clause_cats, key=lambda x: x[3])
            return best[1], best[2]

    cat = category_model.predict_with_fallback(text)
    probs = category_model.predict_proba(text)
    conf = float(probs.max())

    if cat == 'Other/Uncategorized':
        for c in clauses:
            clause_cat = category_model.predict_with_fallback(c)
            if clause_cat != 'Other/Uncategorized':
                clause_conf = float(category_model.predict_proba(c).max())
                return clause_cat, clause_conf

    return cat, conf


@app.route('/categorize', methods=['POST'])
def categorize():
    data = request.json
    text = data.get('text', '')

    if not text.strip():
        return jsonify({ 'category': 'Other/Uncategorized', 'confidence': 0 })

    category, confidence = get_clause_category(text)

    return jsonify({ 'category': category, 'confidence': confidence })

if __name__ == '__main__':
    app.run(port=5001)