import os, joblib, numpy as np

model_path = os.path.join(os.path.dirname(__file__), "category_model.pkl")
model = joblib.load(model_path)
vec = model.pipeline.named_steps["tfidf"]
nb = model.pipeline.named_steps["nb"]

print("alpha:", nb.alpha, "| ngram_range:", vec.ngram_range)

text = "Good collection of books on reference"   # manually enter hthe text comment to show confidence for categoriztiaon
X = vec.transform([text])
print("nonzero features:", X.nnz)
feat_names = vec.get_feature_names_out()
for idx in X.nonzero()[1]:
    print(" feature:", feat_names[idx])

probs = model.predict_proba(text)
for cls, p in zip(nb.classes_, probs):
    print(cls, round(p, 4))

print("predict_with_fallback:", model.predict_with_fallback(text))