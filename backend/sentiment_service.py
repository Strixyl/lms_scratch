import os
import re
import sys

from flask import Flask, request, jsonify
from transformers import pipeline
import joblib

ML_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml")
sys.path.insert(0, ML_DIR)
from naive_bayes import (
    CategoryClassifier,
    preprocess,
    DOMAIN_KEYWORDS,
    DEFAULT_CONFIDENCE_THRESHOLD,
    FALLBACK_LABEL,
    OFF_TOPIC_PATTERNS
)

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

CATEGORY_MODEL_PATH = os.path.join(ML_DIR, "category_model.pkl")
category_model = joblib.load(CATEGORY_MODEL_PATH)
vec_step = category_model.pipeline.named_steps.get("tfidf")
nb_step = category_model.pipeline.named_steps.get("nb")
feature_names = vec_step.get_feature_names_out() if vec_step is not None else []

LABEL_MAP = {
    'positive': 'Positive',
    'neutral': 'Neutral',
    'negative': 'Negative',
    'LABEL_0': 'Negative',
    'LABEL_1': 'Neutral',
    'LABEL_2': 'Positive',
}

# split compound sentences by contrast words (e.g. "staff was nice but ac was broken")
# prioritize negative comments for sentiment analysis
CONTRAST_WORDS = [
    "although", "though", "however", "but", "while", "except",
    "on the other hand", "yet",
]
MIN_CLAUSE_LENGTH = 12  # min chars to avoid tiny fragments


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
    # run roberta on a single clause
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

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json(silent=True) or {}
    text = data.get('text', '')
    
    if not text.strip():
        return jsonify({ 'sentiment': 'Neutral', 'score': 0 })

    clauses = split_clauses(text)
    clause_results = [bert_sentiment(c) for c in clauses]
    sentiment, score = aggregate_most_negative_wins(clause_results)

    return jsonify({ 'sentiment': sentiment, 'score': score })

def get_clause_category(text: str):
    text = text.strip()
    if not text:
        return 'Other/Uncategorized', 0.0

    clauses = split_clauses(text)
    if len(clauses) <= 1:
        cat = category_model.predict_with_fallback(text)
        probs = category_model.predict_proba(text)
        return cat, float(probs.max())

    neg_clause_cats = []
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


@app.route('/categorize', methods=['POST', 'OPTIONS'])
def categorize():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json(silent=True) or {}
    text = data.get('text', '')

    if not text.strip():
        return jsonify({ 'category': 'Other/Uncategorized', 'confidence': 0 })

    category, confidence = get_clause_category(text)

    return jsonify({ 'category': category, 'confidence': confidence })


# =========================================================================
# DIAGNOSTIC EXPLAINABILITY ENDPOINT (Academic Validation Sandbox)
# =========================================================================

def explain_pipeline(text: str, ratings=None, custom_threshold=None):
    raw_text = (text or "").strip()
    threshold = float(custom_threshold) if custom_threshold is not None else 0.45
    cleaned_preprocessed = preprocess(raw_text) if raw_text else ""

    # 1. Clause splitting & RoBERTa sentiment
    clauses = split_clauses(raw_text) if raw_text else []
    clause_details = []
    for c in clauses:
        c_label, c_conf = bert_sentiment(c)
        c_cat = category_model.predict_with_fallback(c, threshold=threshold)
        c_probs = category_model.predict_proba(c)
        c_probs_dict = {str(cls): round(float(p), 4) for cls, p in zip(nb_step.classes_, c_probs)}
        clause_details.append({
            "clause": c,
            "sentiment": c_label,
            "confidence": round(float(c_conf), 4),
            "category": c_cat,
            "category_probabilities": c_probs_dict
        })

    if clauses:
        clause_results = [(d["sentiment"], d["confidence"]) for d in clause_details]
        agg_sentiment, agg_score = aggregate_most_negative_wins(clause_results)
    else:
        agg_sentiment, agg_score = ("Neutral", 0.0)

    bert_score = 1.0 if agg_sentiment == "Positive" else (-1.0 if agg_sentiment == "Negative" else 0.0)

    # 2. Tokenization, TF-IDF, and Naive Bayes
    extracted_tokens = []
    text_words = set(re.findall(r"\b\w+\b", raw_text.lower()))
    domain_matches = {}
    for cat_name, kws in DOMAIN_KEYWORDS.items():
        matched = list(text_words.intersection(kws))
        if matched:
            domain_matches[cat_name] = matched

    if raw_text and vec_step is not None:
        X = vec_step.transform([raw_text])
        nonzero_indices = X.nonzero()[1]
        for idx in nonzero_indices:
            fname = str(feature_names[idx])
            tfidf_val = round(float(X[0, idx]), 4)
            kw_match = None
            for cat_name, kws in DOMAIN_KEYWORDS.items():
                if any(kw in fname for kw in kws):
                    kw_match = cat_name
                    break
            extracted_tokens.append({
                "token": fname,
                "tfidf": tfidf_val,
                "domain_category": kw_match
            })
        extracted_tokens.sort(key=lambda x: x["tfidf"], reverse=True)

        full_probs = category_model.predict_proba(raw_text)
        probs_dict = {str(cls): round(float(p), 4) for cls, p in zip(nb_step.classes_, full_probs)}
        raw_winner_idx = full_probs.argmax()
        raw_winner_label = str(nb_step.classes_[raw_winner_idx])
        raw_winner_conf = round(float(full_probs[raw_winner_idx]), 4)
        final_category, final_conf = get_clause_category(raw_text)
    else:
        probs_dict = {str(cls): 0.0 for cls in nb_step.classes_} if nb_step is not None else {}
        raw_winner_label = "Other/Uncategorized"
        raw_winner_conf = 0.0
        final_category = "Other/Uncategorized"
        final_conf = 0.0

    # 3. Rating calculations
    rating_map = {
        'very_satisfied': 1.0,
        'satisfied': 0.5,
        'neutral': 0.0,
        'dissatisfied': -0.5,
        'very_dissatisfied': -1.0,
        'na': None
    }

    valid_ratings = []
    detailed_ratings = []
    if isinstance(ratings, list):
        for idx, r in enumerate(ratings):
            val = rating_map.get(r, None)
            detailed_ratings.append({
                "question_index": idx + 1,
                "key": r,
                "numeric_score": val
            })
            if val is not None:
                valid_ratings.append(val)
    elif isinstance(ratings, dict):
        for k, r in ratings.items():
            val = rating_map.get(r, None)
            detailed_ratings.append({
                "question": k,
                "key": r,
                "numeric_score": val
            })
            if val is not None:
                valid_ratings.append(val)

    valid_count = len(valid_ratings)
    raw_sum = round(sum(valid_ratings), 4) if valid_count > 0 else 0.0
    r_avg = round(raw_sum / valid_count, 4) if valid_count > 0 else 0.0
    emoji_sentiment = "Positive" if r_avg > 0.15 else ("Negative" if r_avg < -0.15 else "Neutral")

    # 4. Hybrid formula computation
    has_comment = bool(raw_text)
    if has_comment:
        combined_score = round((r_avg * 0.50) + (bert_score * 0.50), 4)
        substitution_text = f"({r_avg:.2f} × 0.50) + ({bert_score:+.2f} × 0.50) = {r_avg * 0.50:.2f} + {bert_score * 0.50:+.2f} = {combined_score:.2f}"
    else:
        combined_score = r_avg
        substitution_text = f"R_avg = {r_avg:.2f} (No text comment provided, overall score = R_avg)"

    if combined_score > 0.15:
        final_sentiment = "Positive"
    elif combined_score < -0.15:
        final_sentiment = "Negative"
    else:
        final_sentiment = "Neutral"

    return {
        "text": raw_text,
        "preprocessed_text": cleaned_preprocessed,
        "clauses": clause_details,
        "split_triggered": len(clause_details) > 1,
        "roberta": {
            "sentiment": agg_sentiment,
            "confidence": round(float(agg_score), 4),
            "bert_score": bert_score,
            "aggregation_strategy": "Most-Negative-Wins (Clause Splitting)" if len(clause_details) > 1 else "Single Clause Analysis"
        },
        "naive_bayes": {
            "alpha": getattr(nb_step, "alpha", 0.01) if nb_step else 0.01,
            "classes": list(nb_step.classes_) if nb_step else [],
            "probabilities": probs_dict,
            "raw_winner": raw_winner_label,
            "raw_confidence": raw_winner_conf,
            "confidence_threshold": threshold,
            "threshold_met": raw_winner_conf >= threshold,
            "extracted_features": extracted_tokens,
            "domain_keyword_matches": domain_matches,
            "final_category": final_category,
            "final_confidence": round(float(final_conf), 4),
            "fallback_applied": final_category == "Other/Uncategorized" and raw_winner_label != "Other/Uncategorized"
        },
        "likert_simulation": {
            "valid_count": valid_count,
            "raw_sum": raw_sum,
            "r_avg": r_avg,
            "emoji_sentiment": emoji_sentiment,
            "detailed_ratings": detailed_ratings
        },
        "hybrid_synthesis": {
            "r_avg": r_avg,
            "bert_score": bert_score,
            "has_comment": has_comment,
            "combined_score": combined_score,
            "final_sentiment": final_sentiment,
            "formula_latex": "\\text{Final Score} = (R_{avg} \\times 0.50) + (\\text{BERT Score} \\times 0.50)",
            "arithmetic_substitution": substitution_text,
            "thresholds": {
                "positive_threshold": 0.15,
                "negative_threshold": -0.15,
                "neutral_buffer": [-0.15, 0.15]
            }
        }
    }


@app.route('/api/debug/explain-scores', methods=['POST', 'OPTIONS'])
@app.route('/explain', methods=['POST', 'OPTIONS'])
def explain_scores_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json(silent=True) or {}
    text = data.get('text', '')
    ratings = data.get('ratings', None)
    threshold = data.get('threshold', 0.45)

    result = explain_pipeline(text=text, ratings=ratings, custom_threshold=threshold)
    return jsonify(result)


if __name__ == '__main__':
    app.run(port=5001)