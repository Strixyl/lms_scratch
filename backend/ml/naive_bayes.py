import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

DEFAULT_CATEGORIES = ["Facilities", "Staff", "Collection", "Other/Uncategorized"]
DEFAULT_CONFIDENCE_THRESHOLD = 0.45
FALLBACK_LABEL = "Other/Uncategorized"

def preprocess(text: str) -> str:

    if text is None:
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)    
    text = re.sub(r"@\w+", " ", text)               
    text = re.sub(r"#\w+", " ", text)               
    text = re.sub(r"[^a-z\s]", " ", text)                
    text = re.sub(r"\s+", " ", text).strip()          
    return text

class CategoryClassifier:
    def __init__(self, alpha: float = 1.0, ngram_range=(1, 1), min_df: int = 1):
        self.alpha = alpha
        self.ngram_range = ngram_range
        self.min_df = min_df
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(         # conmverts words to score for conf lvl
                preprocessor=preprocess,
                ngram_range=self.ngram_range,
                min_df=self.min_df,
            )),
            ("nb", MultinomialNB(alpha=self.alpha)),  
        ])
        self.classes_ = None

    def fit(self, X, y):
        self.pipeline.fit(X, y)
        self.classes_ = self.pipeline.named_steps["nb"].classes_
        return self

    def predict(self, texts):

        single_input = isinstance(texts, str)
        X = [texts] if single_input else list(texts)
        preds = self.pipeline.predict(X)
        return preds[0] if single_input else list(preds)

    def predict_proba(self, texts):
        single_input = isinstance(texts, str)
        X = [texts] if single_input else list(texts)
        probs = self.pipeline.predict_proba(X)
        return probs[0] if single_input else probs

    def predict_with_fallback(self, text: str, threshold: float = DEFAULT_CONFIDENCE_THRESHOLD) -> str:
   
        if not text or not str(text).strip():
            return FALLBACK_LABEL

        probs = self.predict_proba(text)
        top_idx = probs.argmax()
        top_label = self.classes_[top_idx]
        top_confidence = probs[top_idx]

        if top_confidence < threshold:
            return FALLBACK_LABEL
        return top_label

    def score(self, X, y) -> float:
        return self.pipeline.score(X, y)