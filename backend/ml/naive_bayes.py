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
        "librarian", "librarians", "staff", "staffs", "personnel", "guard", "guards", 
        "assistant", "assistants", "attendant", "attendants", "cashier", "admin",
        "professors", "teacher", "teachers", 
    },
    "Facilities": {
        "wifi", "aircon", "ac", "restroom", "restrooms", "toilet", "toilets", 
        "elevator", "elevators", "lift", "socket", "sockets", "outlet", "outlets",
        "plug", "plugs", "charging", "lighting", "lights", "ventilation", "temperature",
        "terminal", "terminals", "printer", "printers", "printing", "photocopier",
        "photocopy", "photocopying", "scanner", "scanners", "scanning",
        "computer", "computers", "desktop", "station", "stations", "hardware",
        "monitor", "monitors", "screen", "screens", "keyboard", "keyboards", "mouse",
        "desk", "desks", "chair", "chairs", "table", "tables", "cubicle", "cubicles",
        "carrel", "carrels", "bench", "benches", "seat", "seats", "seating",
        "kiosk", "kiosks", "elibrary", "cyberlib", "equipment", "equipments", "tissue","tissue paper",
        "pillow",
    },
    "Collection": {
        "book", "books", "textbook", "textbooks", "journal", "journals", 
        "thesis", "catalog", "catalogue", "ebook", "ebooks", "periodical", "periodicals",
        "novel", "novels", "fiction", "literature", "manga", "author", "authors",
        "reference", "references", "bestseller", "bestsellers", "reviewer", "reviewers",
        "dictionary", "encyclopedia", "magazine", "magazines", "opac", "manuscript", "manuscripts"
    }
}

# personal phrases that have no library relevance
# if matched and no domain keywords found, default to other/uncategorized
OFF_TOPIC_PATTERNS = [
    re.compile(r"\bi\s+miss\s+my\b", re.IGNORECASE),
    re.compile(r"\bmiss\s+ko\b", re.IGNORECASE),
    re.compile(r"\bmissing\s+my\b", re.IGNORECASE),
    re.compile(r"\bi\s+miss\s+home\b", re.IGNORECASE),
    re.compile(r"\bmiss\s+na\s+miss\b", re.IGNORECASE),
]

# flatten keywords to check if text has any library context
_ALL_DOMAIN_WORDS = set()
for _kw_set in DOMAIN_KEYWORDS.values():
    _ALL_DOMAIN_WORDS |= _kw_set

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

        text_words = set(re.findall(r"\b\w+\b", str(text).lower()))
        has_domain_context = bool(text_words & _ALL_DOMAIN_WORDS)

        # filter out off-topic personal chatter if no library keywords are present
        if not has_domain_context:
            for pat in OFF_TOPIC_PATTERNS:
                if pat.search(text):
                    return FALLBACK_LABEL

        probs = self.predict_proba(text)
        top_idx = probs.argmax()
        top_label = self.classes_[top_idx]
        top_confidence = probs[top_idx]

        # if staff was predicted but no staff words exist, check other category keywords
        if top_label == "Staff":
            has_staff_words = bool(text_words & DOMAIN_KEYWORDS["Staff"])
            if not has_staff_words:
                has_collection_words = bool(text_words & DOMAIN_KEYWORDS["Collection"])
                has_facilities_words = bool(text_words & DOMAIN_KEYWORDS["Facilities"])
                if has_collection_words:
                    top_label = "Collection"
                elif has_facilities_words:
                    top_label = "Facilities"
                elif top_confidence < 0.85:
                    # fallback if confidence is low and no keywords matched
                    top_label = FALLBACK_LABEL

        if top_label == FALLBACK_LABEL or top_confidence < threshold:
            # check domain keywords before falling back to other/uncategorized
            matching_cats = {}
            for category, keywords in DOMAIN_KEYWORDS.items():
                matches = text_words.intersection(keywords)
                if matches:
                    matching_cats[category] = len(matches)
            if matching_cats:
                classes_list = list(self.classes_) if self.classes_ is not None else []
                return max(
                    matching_cats.keys(),
                    key=lambda cat: (
                        matching_cats[cat],
                        probs[classes_list.index(cat)] if cat in classes_list else 0.0
                    )
                )
            return FALLBACK_LABEL

        return top_label

    def score(self, X, y) -> float:
        return self.pipeline.score(X, y)
