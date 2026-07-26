# Library Management System Backend & Dual-Engine NLP Microservices

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
Capstone Thesis Project — Henry Luce III Library

---

## Overview

This directory contains the backend infrastructure for the **Henry Luce III Library Management System**, comprising:
1. **Node.js Express Server (`index.js`)**: Main REST API server running on port `5000` connected to Microsoft SQL Server (`hllSystem`).
2. **Python Dual-Engine NLP Microservice (`sentiment_service.py`)**: Flask API microservice on port `5001` providing RoBERTa BERT Sentiment Analysis & Naïve Bayes Category Classification.
3. **Machine Learning Pipeline (`ml/`)**: Preprocessing, model training, and artifact generation scripts for survey comment categorization.

---

## Dual-Engine NLP Architecture (`sentiment_service.py`)

The system utilizes a hybrid dual-engine NLP classification pipeline combining transformer deep learning with scikit-learn probabilistic classification:

### 1. Sentiment Analysis Engine (`POST /analyze`)
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest` (Pre-trained BERT / RoBERTa Model)
- **Port**: `5001`
- **Endpoint**: `POST /analyze`
- **Payload**: `{ "text": "Library staff are very accommodating" }`
- **Response**: `{ "sentiment": "Positive", "score": 0.982 }`

### 2. Category Classification Engine (`POST /categorize`)
- **Model**: Scikit-Learn `TfidfVectorizer` + `MultinomialNB` pipeline with confidence threshold fallback ($\tau = 0.45$).
- **Port**: `5001`
- **Endpoint**: `POST /categorize`
- **Payload**: `{ "text": "The aircon in the 2nd floor is warm" }`
- **Response**: `{ "category": "Facilities", "confidence": 0.894 }`
- **Categories**: `Facilities`, `Staff`, `Collection`, `Other/Uncategorized` (Fallback).

### Node.js Express Concurrent Integration (`index.js`)
- Express invokes both microservice endpoints concurrently via `Promise.all` (`http://localhost:5001/analyze` and `http://localhost:5001/categorize`).
- Overall sentiment combines Emoji survey scores ($50\%$) and BERT text sentiment ($50\%$).
- Persists sentiment ratings and category domains into `dbo.SatisfactionSurveys`.
- Includes graceful fallback: defaults to `Neutral` sentiment and `Other/Uncategorized` category if the Python microservice is unavailable.

---

## 🧠 Machine Learning & Category Classification Pipeline (`ml/`)

Designed and implemented in accordance with [`CATEGORY_CLASSIFICATION_FILE_PLAN.md`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/CATEGORY_CLASSIFICATION_FILE_PLAN.md):

```
backend/
├── index.js                     # Node.js Express server & DB controller
├── sentiment_service.py          # Dual-Engine Flask microservice (Port 5001)
└── ml/                           # Machine learning pipeline directory
    ├── data/
    │   └── clean_category_dataset.csv  # Preprocessed training dataset
    ├── clean_dataset.py         # Step 1: Data cleaning & noise filtering script
    ├── naive_bayes.py           # Step 2: CategoryClassifier pipeline class
    ├── train_category_model.py  # Step 3: Stratified split & hyperparameter grid search
    ├── category_model.pkl       # Serialized Naïve Bayes model artifact
    └── alpha_search_category.png# Accuracy-vs-Alpha hyperparameter plot
```

### Python ML File Responsibilities

| Step | File / Artifact | Type | Function & Description |
|---|---|---|---|
| **Step 1** | [`clean_dataset.py`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/clean_dataset.py) | Python Script | Loads raw XLSX/CSV datasets (`3000withnoise.xlsx`, `category_training_dataset.xlsx`, or `sat-survey.xlsx`), maps column candidates dynamically, strips non-informative noise (`"none"`, `"n/a"`, `"ok"`, `"asdf"`, `"wala"`), numeric strings, and short texts $<3$ chars, normalizes label casing, deduplicates, and saves `data/clean_category_dataset.csv`. |
| **Output** | `data/clean_category_dataset.csv` | Clean CSV | Standardized 3-column CSV (`comment, category, sentiment`) for model training. |
| **Step 2** | [`naive_bayes.py`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/naive_bayes.py) | Python Class | Defines `CategoryClassifier` wrapping `Pipeline([TfidfVectorizer, MultinomialNB])`. Implements lightweight text normalization (`preprocess`: lowercasing, URL/mention/hashtag stripping, regex `[^a-z\s]`) and confidence-gated predictions (`predict_with_fallback()`, $\tau = 0.45$). |
| **Step 3** | [`train_category_model.py`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/train_category_model.py) | Python Script | Loads cleaned CSV, performs an 80/20 stratified split (`random_state=42`), grid searches hyperparameter space (`alpha` $[0.01..5.0]$, `ngram_range` $(1,1)$ vs $(1,2)$, `min_df` $1$ vs $2$), outputs classification reports and confusion matrices, and dumps `category_model.pkl`. |
| **Output** | [`category_model.pkl`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/category_model.pkl) | Model Artifact | Binary joblib model artifact loaded by `sentiment_service.py` at service initialization. |
| **Output** | [`alpha_search_category.png`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/alpha_search_category.png) | Plot | Accuracy vs alpha hyperparameter sweep plot generated during training. |

#### 🔬 Key Python Functions & Implementation Details

##### 1. `naive_bayes.py` ([CategoryClassifier](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/naive_bayes.py))
- **`preprocess(text: str) -> str`**: Standalone preprocessor applied before TF-IDF vectorization. Lowercases input, removes URLs (`http...`/`www...`), `@mentions`, `#hashtags`, keeps letters only (`[^a-z\s]`), and collapses whitespace.
- **`CategoryClassifier.__init__(alpha=1.0, ngram_range=(1,1), min_df=1)`**: Instantiates the scikit-learn `Pipeline` (`TfidfVectorizer(preprocessor=preprocess)` → `MultinomialNB(alpha)`).
- **`CategoryClassifier.fit(X, y)`**: Trains TF-IDF vectorizer and Multinomial Naïve Bayes on training comment corpus; saves class labels (`Facilities`, `Staff`, `Collection`).
- **`CategoryClassifier.predict(texts)`**: Returns class prediction(s) for a single comment string or list of comments.
- **`CategoryClassifier.predict_proba(texts)`**: Returns raw probability distribution array across trained classes.
- **`CategoryClassifier.predict_with_fallback(text, threshold=0.45) -> str`**: Calculates `predict_proba(text)`; if maximum class confidence level is below $\tau = 0.45$, it defaults prediction to `"Other/Uncategorized"`.
- **`CategoryClassifier.score(X, y) -> float`**: Evaluates mean accuracy score on validation datasets.

##### 2. `train_category_model.py` ([Training Script](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/train_category_model.py))
- **`load_data()`**: Reads `data/clean_category_dataset.csv`, returning comment list $X$ and category label list $y$.
- **`grid_search(X_train, y_train, X_val, y_val)`**: Sweeps hyperparameter combinations (`alpha` $[0.01, 0.1, 0.5, 1.0, 1.5, 2.0, 5.0]$, `ngram_range` $[(1,1), (1,2)]$, `min_df` $[1, 2]$) to select the model with highest validation accuracy.
- **`maybe_plot(all_results)`**: Generates a log-scale validation accuracy plot vs `alpha` curve (`alpha_search_category.png`) for thesis methodology documentation.
- **`main()`**: Executes dataset loading, 80/20 stratified split (`test_size=0.2`, `random_state=42`), baseline model evaluation, grid search execution, confusion matrix logging, and serializes best model to `category_model.pkl` via `joblib.dump()`.

##### 3. `clean_dataset.py` ([Data Cleaner](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/clean_dataset.py))
- **`load_raw(path, sheet_name="All_Data")`**: Loads raw survey/training datasets from `.xlsx` or `.csv`.
- **`clean(df)`**: Performs dynamic candidate matching for text/category/sentiment columns, filters out non-informative noise strings (`"none"`, `"n/a"`, `"ok"`, `"asdf"`, `"wala"`), numeric values, and text $<3$ characters, normalizes label casing, deduplicates, and resets index.
- **`main()`**: Controls dataset loading, cleaning pipeline invocation, and writes clean CSV to `data/clean_category_dataset.csv`.

---

## Prerequisites & Installation

### 1. Python Environment Setup
Install Python 3.9+ and required machine learning dependencies:
```bash
pip install flask transformers torch scikit-learn pandas joblib matplotlib
```

### 2. Node.js Dependencies
Install backend Node packages:
```bash
npm install
```

### 3. Database Connection
Ensure Microsoft SQL Server (`SQLEXPRESS`) is running and update connection settings in `index.js`:
```js
connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=YOUR_PC\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
```

---

## Running Backend & Retraining ML Model

### Retraining the Category Classification Model (`backend/ml`)
```bash
# 1. Open terminal in backend/ml directory
cd "hllsystem - Oct10-2025/backend/ml"

# 2. Clean raw dataset
python clean_dataset.py

# 3. Train Naïve Bayes model & export category_model.pkl
python train_category_model.py
```

### Launching Backend Microservices
1. **Start Python Dual-Engine Microservice**:
   ```bash
   python sentiment_service.py
   ```
   *Runs on `http://localhost:5001`*

2. **Start Express Node Backend**:
   ```bash
   npm start
   ```
   *Runs on `http://localhost:5000`*

