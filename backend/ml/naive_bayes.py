
import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# Categories the model was designed around. Anything predicted with low
# confidence can be remapped to "Other/Uncategorized" by the caller using
# predict_proba() — this class itself always returns one of the trained
# labels (it doesn't know about the "Other" bucket).
DEFAULT_CATEGORIES = ["Facilities", "Staff", "Collection"]

# Confidence threshold used by predict_with_fallback(). Below this, the
# prediction is considered unreliable and mapped to "Other/Uncategorized".
DEFAULT_CONFIDENCE_THRESHOLD = 0.45

FALLBACK_LABEL = "Other/Uncategorized"


def preprocess(text: str) -> str:
    """
    Lightweight text normalization applied before TF-IDF vectorization.
    Mirrors the cleaning style used in the reference notebook:
      - lowercase
      - strip URLs
      - strip @mentions
      - strip #hashtags
      - keep only letters and spaces
      - collapse repeated whitespace
    """
    if text is None:
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)      # URLs
    text = re.sub(r"@\w+", " ", text)                   # @mentions
    text = re.sub(r"#\w+", " ", text)                   # #hashtags
    text = re.sub(r"[^a-z\s]", " ", text)                # keep letters only
    text = re.sub(r"\s+", " ", text).strip()             # collapse whitespace
    return text


class CategoryClassifier:
    """
    Wraps an sklearn Pipeline(TfidfVectorizer, MultinomialNB) with the
    project's text preprocessing baked in, plus a confidence-based
    fallback for out-of-scope comments.

    Usage:
        clf = CategoryClassifier(alpha=1.0, ngram_range=(1, 2), min_df=2)
        clf.fit(X_train_texts, y_train_labels)
        clf.score(X_val_texts, y_val_labels)
        clf.predict("The librarian was very rude")
        clf.predict_with_fallback("asdkjaslkdj")  # -> "Other/Uncategorized"
    """

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
        """
        Predict category label(s). Accepts either a single string or a
        list of strings; returns a single label or list of labels to
        match.
        """
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
        """
        Predict a single comment's category, but return FALLBACK_LABEL if
        the model's top-class confidence is below `threshold`. Useful
        since the training data only covers 3 of the conceptual
        categories (Facilities/Staff/Collection) — comments about
        something else (e.g. policies) should not be forced into one of
        the three.
        """
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