# Library Management System Backend & Dual-Engine NLP Microservices

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
Capstone Thesis Project — Henry Luce III Library

---

## 📌 Backend Overview

This directory houses the backend ecosystem supporting the **Henry Luce III Library Management System**. The architecture comprises two complementary microservices working alongside Microsoft SQL Server:

1. **Express REST API Backend (`index.js`)**: Node.js/Express server (Port `5000`) handling core database transactions, patron login tracking, survey persistence, inventory stock management, cross-location transfers, and transaction audit trails.
2. **Python Dual-Engine NLP Microservice (`sentiment_service.py`)**: Flask API (Port `5001`) delivering high-performance transformer sentiment predictions and probabilistic Naïve Bayes category classifications.
3. **Machine Learning Pipeline (`ml/`)**: End-to-end data cleaning (`clean_dataset.py`), model implementation (`naive_bayes.py`), and grid-search model training (`train_category_model.py`) scripts.

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
- **Description**: Categorizes text into domain categories using TF-IDF + Multinomial Naïve Bayes with confidence threshold fallback ($\tau = 0.45$). Includes clause-aware category resolution (`get_clause_category`) for dual-topic comments.
- **Request Body**: `{ "text": "The air conditioning system on the 3rd floor is cold." }`
- **Response**: `{ "category": "Facilities", "confidence": 0.924 }`
- **Supported Categories**: `Facilities`, `Staff`, `Collection`, `Other/Uncategorized`

#### 🔀 Dual-Topic & Mixed-Sentiment Clause Resolution
- **Problem**: In multi-topic feedback (e.g., *"Staff are friendly, but the Wi-Fi keeps dropping"*), single-shot text categorization could assign the overall response to `Staff` while sentiment analysis flagged `Negative` based on the Wi-Fi clause, misattributing negative complaints to staff.
- **Solution**: Implemented `get_clause_category()` in `sentiment_service.py`:
  1. Conjunction-based clause splitting (`split_clauses()`) parses contrastive sentences on pivot words (`but`, `however`, `although`, etc.).
  2. Each clause is evaluated independently for sentiment (BERT) and category (Naïve Bayes).
  3. If a negative complaint clause is surfaced by the sentiment engine (e.g., *"Wi-Fi keeps dropping"* $\rightarrow$ `Negative`), the system binds the overall response Category to **that specific winning negative clause** (`Facilities`), ensuring accurate dashboard feedback routing.

---

### 2. Express Backend API Endpoints (Port 5000)

#### 📝 Patron Survey & Sentiment Analysis
- **`POST /api/survey`**: Accepts 10 Likert responses + open comment message. Triggers parallel BERT + Naïve Bayes microservice calls, computes blended `SentimentScore`, and inserts into `dbo.SatisfactionSurveys`.
- **`GET /api/surveys`**: Retrieves survey records with optional filtering by date range, clientele type, college, and course.
- **`DELETE /api/surveys/:id`**: Deletes a specific survey response entry.

#### 🪪 Patron Sign-In & Foot Traffic
- **`POST /api/student-lookup`**: Queries `studInfo` by ID number, calculates `Time In` / `Time Out` log type for section, and inserts log into `dbo.LibLogins`.
- **`GET /api/logins`**: Fetches patron sign-in logs with filtering by section, college mapping (`COLLEGE_MAP`), date range, and log type.
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
    │   ├── clean_category_dataset.csv  # Standardized 2-column CSV training data (comment, category)
    │   └── test/
    │       └── real_patron_comments_clean.csv # Held-out test set (pending collection)
    ├── clean_dataset.py         # Step 1: Dataset cleaner & router (--role=train / --role=test)
    ├── naive_bayes.py           # Step 2: CategoryClassifier pipeline wrapper class
    ├── train_category_model.py  # Step 3: Stratified split, hard test guard, grid search & model exporter
    ├── evaluate_on_test_set.py  # Step 3.5: Evaluates category_model.pkl on test set (no .fit())
    └── category_model.pkl       # Serialized Naïve Bayes model binary artifact
```

### Python ML Module Details

| Step | Script / Artifact | Key Functionality |
|---|---|---|
| **Step 1** | [`clean_dataset.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/clean_dataset.py) | Dynamic column mapping (2-column output: `comment`, `category`), `clean-text` normalization, noise & gibberish filtering ($\ge 20$-char mashing, $\ge 60\%$ spellcheck unknown ratio for English scope), deduplication by `(comment, category)`, and routing via `--role=train` or `--role=test`. |
| **Step 2** | [`naive_bayes.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/naive_bayes.py) | Implements `CategoryClassifier` class wrapping `TfidfVectorizer` + `MultinomialNB`. Includes regex text preprocessor (`preprocess`) and confidence threshold fallback method (`predict_with_fallback`, $\tau = 0.45$). |
| **Step 3** | [`train_category_model.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/train_category_model.py) | Enforces hard test-isolation assertions, merges `manual_boundary_cases.csv`, executes 80/20 stratified train/validation split, grid searches hyperparameters ($\alpha \in [0.01..5.0]$, unigrams/bigrams, $\text{min\_df} \in [1, 2, 3, 5]$), logs classification metrics, and serializes best model to `category_model.pkl`. |
| **Step 3.5** | [`evaluate_on_test_set.py`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/evaluate_on_test_set.py) | Scores `category_model.pkl` against `data/test/real_patron_comments_clean.csv` (contains no `.fit()` call; execution pending real data collection). |
| **Artifact** | [`category_model.pkl`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/backend/ml/category_model.pkl) | Binary model artifact unpickled by `sentiment_service.py` at microservice initialization. |

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
pip install flask transformers torch scikit-learn pandas joblib openpyxl matplotlib
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

To retrain the Naïve Bayes category classifier using updated survey datasets (`5kwithnoise.xlsx` & `manual_boundary_cases.csv`):

```bash
cd backend/ml

# 1. Clean raw dataset (5kwithnoise.xlsx -> data/clean_category_dataset.csv)
python clean_dataset.py

# 2. Train model, merge manual boundary cases & generate updated category_model.pkl
python train_category_model.py
```


