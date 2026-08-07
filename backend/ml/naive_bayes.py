import re
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

DEFAULT_CATEGORIES = ["Facilities", "Staff", "Collection", "Other/Uncategorized"]
DEFAULT_CONFIDENCE_THRESHOLD = 0.40
FALLBACK_LABEL = "Other/Uncategorized"

_stemmer = PorterStemmer()

DOMAIN_KEYWORDS = {
    "Staff": {
        "librarian", "librarians", "staff", "personnel", "guard", "guards", 
        "assistant", "assistants", "attendant", "attendants", "cashier", "admin"
    },
    "Facilities": {
        "wifi", "aircon", "ac", "restroom", "restrooms", "toilet", "toilets", 
        "elevator", "socket", "sockets", "outlet", "outlets", "lighting", "ventilation"
    },
    "Collection": {
        "book", "books", "textbook", "textbooks", "journal", "journals", 
        "thesis", "catalog", "ebook", "ebooks", "periodical", "periodicals"
    }
}

def preprocess(text: str) -> str:
    if text is None:
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)    
    text = re.sub(r"@\w+", " ", text)               
    text = re.sub(r"#\w+", " ", text)               
    text = re.sub(r"[^a-z\s]", " ", text)                
    tokens = text.split()
    stemmed = [_stemmer.stem(w) for w in tokens]
    return " ".join(stemmed)

class CategoryClassifier:
    def __init__(self, alpha: float = 1.0, ngram_range=(1, 1), min_df: int = 1):
        self.alpha = alpha
        self.ngram_range = ngram_range
        self.min_df = min_df
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
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
            # Check domain keywords before defaulting to Other/Uncategorized
            text_words = set(re.findall(r"\b\w+\b", str(text).lower()))
            for category, keywords in DOMAIN_KEYWORDS.items():
                if text_words.intersection(keywords):
                    return category
            return FALLBACK_LABEL

        return top_label

    def score(self, X, y) -> float:
        return self.pipeline.score(X, y)