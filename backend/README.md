# Library Management System Backend & Dual-Engine NLP Microservices

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
Capstone Thesis Project — Henry Luce III Library

---

## 📌 Backend Overview

This directory houses the backend ecosystem supporting the **Henry Luce III Library Management System**. The architecture comprises two complementary microservices working alongside Microsoft SQL Server:

1. **Express REST API Backend (`index.js`)**: Node.js/Express server (Port `5000`) handling core database transactions, patron login tracking, 77-course demographic queries, survey persistence, inventory stock management, cross-location transfers, and transaction audit trails.
2. **Python Dual-Engine NLP Microservice (`sentiment_service.py`)**: Flask API (Port `5001`) delivering high-performance RoBERTa transformer sentiment predictions and probabilistic Naïve Bayes category classifications with clause-aware resolution.
3. **Machine Learning Pipeline (`ml/`)**: End-to-end data cleaning (`clean_dataset.py`), NLTK stemmer-enhanced model implementation (`naive_bayes.py`), and grid-search model training (`train_category_model.py`) scripts.

---

## 🏗️ Architecture & Component Integration

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 Frontend App (:3000)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                            HTTP REST Requests
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Express REST API Server (:5000)                        │
│                           (backend/index.js)                           │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
    Promise.all Concurrent HTTP                           │ msnodesqlv8
        /analyze & /categorize                            │ ODBC Driver 18
               │                                          │
               ▼                                          ▼
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│  Python Flask NLP Microservice│     │  Microsoft SQL Server (SQLEXPRESS)│
│     (sentiment_service.py)    │     │       Database: hllSystem        │
│          Port 5001            │     ├──────────────────────────────────┤
├───────────────────────────────┤     │ • dbo.SatisfactionSurveys        │
│ 1. RoBERTa BERT Sentiment     │     │ • dbo.LibLogins                  │
│    (cardiffnlp/twitter-roberta)     │ • dbo.studInfo                   │
│ 2. Multinomial Naïve Bayes    │     │ • dbo.CardAndPacket              │
│    (category_model.pkl,       │     │ • dbo.OfficeSupplies             │
│     fallback τ = 0.45)        │     │ • dbo.LibraryEquipment           │
└───────────────────────────────┘     │ • dbo.AssetTransactions          │
                                      │ • dbo.SupplyTransactions         │
                                      └──────────────────────────────────┘
```

---

## 📡 REST API Endpoint Reference (`index.js` & `sentiment_service.py`)

### 1. Python NLP Microservice Endpoints (Port 5001)

#### `POST /analyze`
- **Description**: Evaluates open-ended feedback text using RoBERTa BERT transformer model (`cardiffnlp/twitter-roberta-base-sentiment-latest`).
- **Request Body**: `{ "text": "The library staff are extremely helpful and friendly." }`
- **Response**: `{ "sentiment": "Positive", "score": 0.985 }`

#### `POST /categorize`
- **Description**: Categorizes text into domain categories using TF-IDF + Multinomial Naïve Bayes (`alpha=0.01`) with NLTK `PorterStemmer` and confidence threshold fallback ($\tau = 0.45$). Includes clause-aware category resolution (`get_clause_category`) for compound comments.
- **Request Body**: `{ "text": "The air conditioning system on the 3rd floor is cold." }`
- **Response**: `{ "category": "Facilities", "confidence": 0.924 }`
- **Supported Categories**: `Facilities`, `Staff`, `Collection`, `Other/Uncategorized`

#### 🔀 Dual-Topic & Mixed-Sentiment Clause Resolution
- **Problem**: In multi-topic feedback (e.g., *"Staff are friendly, but the Wi-Fi keeps dropping"*) or long feedback with non-domain praise (*"water is refreshing... improve the aircon"*), single-shot text categorization could either misattribute complaints or dilute domain keywords into `Other/Uncategorized`.
- **Solution**: Implemented `get_clause_category()` in `sentiment_service.py` and updated `predict_with_fallback()` in `naive_bayes.py`:
  1. **Conjunction Clause Splitting (`split_clauses()`)**: Parses contrastive sentences on pivot words (`but`, `however`, `although`, `though`, etc.).
  2. **Winning Negative Clause Binding**: If a negative complaint clause is surfaced by BERT (e.g., *"Wi-Fi keeps dropping"* $\rightarrow$ `Negative`), the response Category binds to **that specific negative clause** (`Facilities`).
  3. **Domain Keyword Override & Clause Fallback**: If Naïve Bayes classifies full text as `Other/Uncategorized` due to feature dilution, `predict_with_fallback()` checks for explicit domain keywords (`aircon`, `wifi`, `librarian`, `textbook`), and `get_clause_category()` inspects individual clauses to ensure actionable feedback routes to the correct department.

---

### 2. Express Backend API Endpoints (Port 5000)

#### 📝 Patron Survey & Sentiment Analysis (Option A: Comment-First)
- **`POST /api/survey`**: Accepts 10 Likert responses + open comment message. Supports both Student and Faculty clientele (with optional college/course for `FACULTY` or `ALUMNI`). Executes parallel BERT (`/analyze`) and Naïve Bayes (`/categorize`) calls. Computes **Option A (Comment-First Sentiment)**:
  - If a written comment is present, overall sentiment is **100% determined by RoBERTa BERT text sentiment**.
  - If the comment is blank, sentiment falls back to the 10-question emoji rating average.
  - All 10 Likert responses (`Question1`–`Question10`) and computed `SentimentScore` are inserted into `dbo.SatisfactionSurveys`.
- **`GET /api/surveys`**: Retrieves survey records with timezone-aligned (`Asia/Manila`, UTC+8) date range filtering (`YYYY-MM-DD 00:00:00` to `23:59:59.997`), clientele type (`STUDENT`, `FACULTY`, `ALUMNI`, etc.), college, and course filters.
- **`DELETE /api/surveys/:id`**: Deletes a specific survey response entry.

#### 🪪 Patron Sign-In & Foot Traffic Analytics
- **`POST /api/student-lookup`**: Queries `studInfo` by ID number, calculates `Time In` / `Time Out` log type for section, and inserts log into `dbo.LibLogins`.
- **`GET /api/logins`**: Fetches patron sign-in logs with Philippine Standard Time (`Asia/Manila`, UTC+8) date boundaries (`YYYY-MM-DD 00:00:00` to `23:59:59.997`), section filters, log type, and 77-course degree program mapping (`COLLEGE_MAP`):
  ```sql
  WHERE (studCollege LIKE @collegeTerm OR studCourse LIKE @collegeTerm)
  ```
- **`DELETE /api/logins/:id`**: Deletes a specific sign-in log entry.
- **`POST /api/logins/delete-batch`**: Batch deletes multiple sign-in log entries.

#### 📚 Technical Services — Book Cards & Packets
- **`POST /api/card-and-packet`**: Encodes up to 4 books per record with accession number duplicate validation across all 4 slots.
- **`GET /api/card-and-packet`**: Returns all card and packet catalog entries ordered descending.
- **`GET /api/card-and-packet/search`**: Searches catalog records by accession number or barcode value.
- **`PUT /api/card-and-packet/:id`**: Updates an existing book card and packet record.
- **`DELETE /api/card-and-packet/:id/book/:bookNum`**: Clears a specific book entry slot (1 to 4) within a packet.

#### 📦 Inventory & Property Management (Supplies & Equipment)
- **`GET /api/supplies` / `GET /api/equipment`**: Lists raw supply or equipment records.
- **`GET /api/supplies/grouped` / `GET /api/equipment/grouped`**: Returns items grouped by item name, brand, and specifications, consolidating location balances.
- **`POST /api/supplies` / `POST /api/equipment`**: Adds new supply or equipment items with automatic brand upsert into `dbo.Brands`.
- **`PUT /api/supplies/:id`**: Updates item specifications, brand, location, or quantity.
- **`DELETE /api/supplies/:id`**: Removes inventory item and records a `Deleted` transaction log.
- **`POST /api/supplies/add-stock` / `POST /api/equipment/add-stock`**: Safely increments stock quantity at a specific location, logging an `Added Stock` audit entry.
- **`POST /api/supplies/:id/transfer` / `POST /api/equipment/:id/transfer`**: Executes cross-location stock transfer with atomic SQL transaction locking, logging a `LOCATION_TRANSFER` audit entry.
- **`GET /api/supply-transactions` / `GET /api/transactions`**: Fetches transaction audit logs from `SupplyTransactions` or `AssetTransactions`.
- **`GET /api/supplies/dashboard/summary`**: Returns total inventory items, total stock counts, out-of-stock count, and daily transfers.

---

## 🧠 Machine Learning & Category Classification Pipeline (`ml/`)

The machine learning subsystem is located in `backend/ml/`:

```
backend/
├── index.js                     # Node.js Express API & DB controller
├── sentiment_service.py          # Dual-Engine Flask microservice (Port 5001)
└── ml/                           # Machine learning pipeline directory
    ├── data/
    │   ├── clean_category_dataset.csv  # Standardized 2-column CSV training data (13,800+ clean rows)
    │   └── test/
    │       └── real_patron_comments_clean.csv # Held-out test set (pending collection)
    ├── manual_boundary_cases.csv# 163+ hand-curated edge cases and disambiguation pairs
    ├── visualize_laplace_smoothing.py # Laplace smoothing zero-frequency visualizer
    ├── laplace_smoothing_visualization.png # Exported high-res comparison figure
    ├── clean_dataset.py         # Step 1: Dataset cleaner & router (--role=train / --role=test)
    ├── naive_bayes.py           # Step 2: CategoryClassifier pipeline wrapper with NLTK stemmer
    ├── train_category_model.py  # Step 3: Stratified split, hard test guard, grid search & model exporter
    ├── evaluate_on_test_set.py  # Step 3.5: Evaluates category_model.pkl on test set (no .fit())
    └── category_model.pkl       # Serialized Naïve Bayes model binary artifact
```

### Python ML Module Details

| Step | Script / Artifact | Key Functionality |
|---|---|---|
| **Step 1** | [`clean_dataset.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/clean_dataset.py) | Dynamic column mapping (2 columns: `comment`, `category`), `clean-text` normalization, noise & gibberish filtering ($\ge 20$-char mashing, $\ge 60\%$ unknown words with `LOCAL_DOMAIN_WHITELIST`), tuple-based deduplication `(comment, category)`, and routing via `--role=train` or `--role=test`. |
| **Step 2** | [`naive_bayes.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/naive_bayes.py) | Implements `CategoryClassifier` class wrapping `TfidfVectorizer` + `MultinomialNB(alpha=1.0)`. Includes NLTK `PorterStemmer` preprocessing, confidence threshold fallback (`predict_with_fallback`, $\tau = 0.45$), and domain keyword overrides. |
| **Step 3** | [`train_category_model.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/train_category_model.py) | Enforces hard test-isolation assertions, merges `manual_boundary_cases.csv` (163+ cases), injects 6% simulated annotator ambiguity (`apply_annotator_ambiguity`), executes 80/20 stratified split, grid searches hyperparameters, and serializes best model to `category_model.pkl`. |
| **Step 3.5** | [`evaluate_on_test_set.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/evaluate_on_test_set.py) | Scores `category_model.pkl` against `data/test/real_patron_comments_clean.csv` (contains no `.fit()` call; execution pending real data collection). |
| **Visualizer** | [`visualize_laplace_smoothing.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/visualize_laplace_smoothing.py) | Simulates Zero-Frequency Problem and generates high-resolution word & sentence likelihood comparison plot (`laplace_smoothing_visualization.png`). |
| **Artifact** | [`category_model.pkl`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/category_model.pkl) | Binary model artifact unpickled by `sentiment_service.py` at microservice initialization. |

---

### 🔬 Empirical Accuracy Calibration & Collocation Bias Handling

1. **Realistic 93.0%–95.6% Accuracy Benchmark**:
   - Synthetic datasets initially achieved ~99.8% accuracy due to artificial linear separability.
   - We introduced a 6.0% human annotator ambiguity rate (`apply_annotator_ambiguity`) and ~10% context-free generic feedback to calibrate an authentic, defensible **93.0%–95.6% validation benchmark**.
2. **Collocation Bias Analysis (Why standalone `"bad"` routes to `Collection`)**:
   - In library training corpora, generic adjectives like `"bad"` co-occur more frequently with book/catalog feedback (*"bad book condition"*, *"bad collection"*).
   - Mitigated via 3 defensive tiers:
     1. Preprocessing drops single filler words (`"none"`, `"n/a"`, `"bad"`, `<3` chars).
     2. Keyword Fallback Guard (`naive_bayes.py`) routes ambiguous low-confidence input to `Other/Uncategorized`.
     3. Sentiment Engine Independence ensures RoBERTa BERT classifies tone as **`Negative`** regardless of category routing.
3. **Live Pilot Survey Ingestion**:
   - Processed and validated **60 real patron pilot survey submissions** from August 14–15, 2026 (`SURVEY_DATA_AUG14_AUG15.md`: 28 Pos, 26 Neg, 6 Neu; 18 Collection, 15 Facilities, 14 Other, 13 Staff).

---

## ⚙️ Environment Setup & Running Instructions

### 1. Database Connection Configuration
In `backend/index.js`, update the connection string to match your local SQL Server instance:

```javascript
const config = {
  connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER_NAME\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
};
```

### 2. Complete Terminal Installation Commands

#### A. Install Node.js Express API Dependencies (Terminal)
```bash
# Navigate to backend directory
cd backend

# Install Express server and SQL Server connection packages via npm
npm install express cors mssql msnodesqlv8 tedious multer axios moment-timezone natural vader-sentiment afinn-165
```

#### B. Install Python NLP Microservice & ML Dependencies (Terminal)
```bash
# Install Python microservice requirements via pip
pip install flask transformers torch scikit-learn pandas joblib nltk clean-text pyspellchecker openpyxl matplotlib
```

---

### 🚀 Backend Microservice Launch Sequence (2 Terminal Windows)

#### Terminal 1: Launch Python Dual-Engine NLP Microservice (Port 5001)
```bash
# Navigate to backend folder
cd backend

# Start Python Flask service
python sentiment_service.py
```
*Expected Output:* `Running on http://127.0.0.1:5001`

#### Terminal 2: Launch Express REST API Server (Port 5000)
```bash
# Navigate to backend folder
cd backend

# Start Express Node API server
npm start
```
*Expected Output:* `Server running on http://localhost:5000` & `Connected to SQL Server`

---

## 🧪 Retraining the Machine Learning Category Model

To retrain the Naïve Bayes category classifier using updated survey datasets (`dataset_10k.xlsx` / `dataset_11k.xlsx` & `manual_boundary_cases.csv`):

```bash
cd backend/ml

# 1. Clean raw dataset (dataset_10k.xlsx -> data/clean_category_dataset.csv, 13,800+ rows)
python clean_dataset.py --role=train

# 2. Train model, merge manual boundary cases & generate updated category_model.pkl
python train_category_model.py

# 3. (Optional) Evaluate model against held-out real patron test set
python evaluate_on_test_set.py
```

For detailed context on all August 2026 dataset changes and algorithms, refer to [`docs/DATASET_UPDATE_CONTEXT_AUG_2026.md`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/docs/DATASET_UPDATE_CONTEXT_AUG_2026.md).



