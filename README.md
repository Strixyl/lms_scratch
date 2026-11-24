# Henry Luce III Library Management System (HLL System)

**Central Philippine University — College of Computer Studies (BSCS Capstone Thesis)**  
Full-stack academic library operations platform with a **Dual-Engine NLP Pipeline** (CardiffNLP RoBERTa sentiment analysis + Multinomial Naïve Bayes category classification) and an interactive **AI Model Explainer Studio**.

---

## Overview

The **HLL System** centralizes daily operations for Central Philippine University's Henry Luce III Library—patron sign-in tracking, book card and packet cataloging, unified catalog search, office supplies and computer equipment inventory, and patron satisfaction surveys—backed by Microsoft SQL Server and a Python NLP microservice.

Open-ended patron feedback is processed concurrently through two specialized models:
1. **Sentiment Polarity (`POST /analyze`):** CardiffNLP RoBERTa (`cardiffnlp/twitter-roberta-base-sentiment-latest`) with contrastive clause splitting and Most-Negative-Wins arbitration.
2. **Department Routing (`POST /categorize`):** Scikit-Learn `TfidfVectorizer` + `MultinomialNB` with NLTK `PorterStemmer`, Laplace additive smoothing, confidence-threshold fallback, and winning-negative-clause binding across 4 classes (`Facilities`, `Staff`, `Collection`, `Other/Uncategorized`).

All scoring mechanics are inspectable in real time through the refactored **AI Model Explainer Studio** (`/model-explainer`, `/score-computation`).

---

## Features

### AI Model Explainer Studio (`/model-explainer`, `/score-computation`)
* **Modular 2-Column Workbench (`src/Components/ModelExplainer/`):** Refactored from a single-file page into 6 dedicated modules (`FeedbackDirectory`, `ExecutiveVerdict`, `SentimentSynthesisTab`, `CategoryClassificationTab`, `ReferenceGuideDrawer`, and `explainerUtils`).
* **Live SQL Survey Directory (`FeedbackDirectory.js`):** Searchable, paginated directory of submitted comments from `dbo.SatisfactionSurveys` with filters for category, sentiment, college, and date range presets.
* **Unified Statement & Verdict (`ExecutiveVerdict.js`):** Inline highlighting of domain keywords and contrast pivot words, live quote editing with reset-to-original snapshots, stored-vs-live drift detection, and 5 interactive edge-case presets (*Contrast Split*, *Rating vs. Text Conflict*, *Collection Praise*, *Low-Confidence Fallback*, *Likert Only*).
* **Two Progressive-Disclosure Breakdown Tabs:**
  * **Sentiment Breakdown (`SentimentSynthesisTab.js`):** Visualizes 50/50 hybrid synthesis (`R_avg` + RoBERTa), clause-level Most-Negative-Wins arbitration, and a collapsible 10-question Likert simulator.
  * **Category & Tokens (`CategoryClassificationTab.js`):** Displays Naïve Bayes posterior probability bars, an interactive confidence threshold slider (`τ ∈ [0.10, 0.90]`, default `0.45`), Porter-stemmed preprocessing preview, and ranked TF-IDF token weights.
* **Slide-Over Reference Guide (`ReferenceGuideDrawer.js`):** Concise mathematical specification drawer covering Likert normalization (`[-1.0, +1.0]`), RoBERTa clause splitting, hybrid formulas, and threshold gating.
* **Resilient Offline Fallback:** Connects to Flask (`:5001`) with Express gateway fallback (`:5000`); automatically switches to a local client-side mathematical simulation (`explainerUtils.js`) with a live connection status badge if backend services are offline.

### Patron Satisfaction Survey & Sentiment Analytics (`/satisfaction-survey`, `/surveys`, `/sentiment-dashboard`)
* **10-Item Likert Survey (`SatisfactionSurvey.js`):** Single-question focus animations, clientele flows (`STUDENT`, `FACULTY`, `ALUMNI`, etc.), 5-point emoji ratings (`+1.0` to `-1.0` plus `N/A`), and open-ended commentary.
* **Option A (Comment-First) Production Scoring (`backend/index.js`):** When a written comment is submitted, overall sentiment and `SentimentScore` are derived **100% from RoBERTa** (signed Softmax confidence) so polite emoji ratings never mask specific complaints. Blank comments fall back to the 10-item Likert mean (`R_avg`).
* **Executive Sentiment Dashboard (`SentimentDashboard.js`, `SentimentCharts.js`):** Admin-protected analytics dashboard featuring KPI cards (`ModernKpiCard`), source breakdown (`SourceSentimentBreakdownCard`), diverging sentiment trends (`RevenueStyleSentimentChart`), multi-color keyword cloud (`WordCloudSection` via `react-wordcloud`), confidence-ranked top positive/negative comments (`TopCommentsCard`), domain recommendations (`RecommendationCard`), and `.xlsx` export.

### Patron Access Monitoring & Foot Traffic Analytics (`/login`, `/logindata`, `/login-dashboard`)
* **Student & Guest Sign-In Kiosk (`Login.js`):** Real-time patron lookup against `dbo.studInfo` with automatic fallback to `dbo.GuestPatrons` (visitors/researchers), automatic `Time In` / `Time Out` toggling per section/day, Philippine Standard Time (`Asia/Manila`, UTC+8) timestamps, and Multer photo display.
* **Access Logs & Foot Traffic Dashboard (`LoginData.js`, `LoginDashboard.js`):** Date/section/college filtering, single and batch deletion, 77 degree program codes normalized into 18 college/department groups (`collegeMap.js`), guest breakdown, admin authentication modal, and Excel (`.xlsx`) export.

### Book Card & Packet Management & Unified Catalog (`/card-and-packet`, `/book-catalogue`)
* **4-Slot Technical Encoding (`CardAndPacket.js`):** Encodes up to 4 books per record in `dbo.CardAndPacket` with cross-slot duplicate accession validation, accession/barcode search, record editing, and individual slot clearing.
* **Unified Book Catalogue (`BookCatalogue.js`):** Flattened, searchable view of all cataloged book slots with batch slot deletion and Excel (`.xlsx`) export.

### Office Supplies & Library Equipment Inventory (`/supplies*`, `/equipment*`, `/send-*`, `/transactions`, `/supply-transactions`)
* **Supplies Management:** Flat and grouped inventory views, auto-generated SKUs (`SKU-001`), unit-of-measure tracking, restocking, inter-section atomic SQL transfers, staff disbursements (`POST /api/supplies/disburse`), and `dbo.SupplyTransactions` audit history.
* **Equipment Asset Management:** Flat and grouped asset views, unique `ControlNumber` tracking, brand catalog (`dbo.Brands`), stock-to-location additions, inter-section transfers, dashboard summaries, and `dbo.AssetTransactions` audit history.

### Frontend Route Map

Routing uses React Router `HashRouter` (`http://localhost:3000/#/<route>`).

| Route Path | Page Component | Module / Description |
|---|---|---|
| `/` | [`Home.js`](src/pages/Home.js) | Main landing portal and navigation hub |
| `/login` | [`Login.js`](src/pages/Login.js) | Patron Time-In / Time-Out kiosk (students & guests) |
| `/logindata` | [`LoginData.js`](src/pages/LoginData.js) | Historical sign-in logs with filters and batch delete |
| `/login-dashboard` | [`LoginDashboard.js`](src/pages/LoginDashboard.js) | Admin foot-traffic analytics dashboard with Excel export |
| `/satisfaction-survey` | [`SatisfactionSurvey.js`](src/pages/SatisfactionSurvey.js) | 10-question Likert & open-text feedback form |
| `/surveys` | [`SatisfactionSurveyData.js`](src/pages/SatisfactionSurveyData.js) | Survey records grid with sentiment & category badges |
| `/sentiment-dashboard` | [`SentimentDashboard.js`](src/pages/SentimentDashboard.js) | Admin NLP analytics dashboard (links to Model Explainer) |
| `/model-explainer`, `/score-computation` | [`ModelExplainer.js`](src/pages/ModelExplainer.js) | Interactive AI Model Explainer Studio |
| `/card-and-packet` | [`CardAndPacket.js`](src/pages/CardAndPacket.js) | 4-book card & packet technical encoding form |
| `/book-catalogue` | [`BookCatalogue.js`](src/pages/BookCatalogue.js) | Flattened catalog search table with Excel export (aliases: `/bookcatalogue`, `/BookCatalogue`) |
| `/supplies` | [`Supplies.js`](src/pages/Supplies.js) | Office supplies inventory view |
| `/supplies-encoding` | [`SuppliesEncode.js`](src/pages/SuppliesEncode.js) | Supplies encoding, restocking, and disbursement |
| `/send-supply` | [`SendSupply.js`](src/pages/SendSupply.js) | Inter-section supply transfer form |
| `/supply-transactions` | [`SupplyTransactionHistory.js`](src/pages/SupplyTransactionHistory.js) | Supplies audit transaction trail |
| `/equipment` | [`Equipment.js`](src/pages/Equipment.js) | Library equipment inventory view (flat/grouped) |
| `/equipment-encoding` | [`EquipmentEncode.js`](src/pages/EquipmentEncode.js) | Equipment encoding, control numbers, and restocking |
| `/send-asset` | [`Sendasset.js`](src/pages/Sendasset.js) | Inter-section equipment transfer form |
| `/transactions` | [`Transactionhistory.js`](src/pages/Transactionhistory.js) | Equipment audit transaction trail |

---

## Tech Stack

| Layer | Technologies & Libraries |
|---|---|
| **Frontend (`:3000`)** | React `19.1`, Create React App (`react-scripts` `5.0.1`), React Router `7.5` (`HashRouter`), Material UI `7.0` (`@mui/material`, `@mui/icons-material`), MUI X Data Grid `8.11`, Recharts `3.8`, `react-wordcloud` `1.2`, SheetJS `xlsx` `0.18`, Axios `1.9`, `@fontsource/poppins` |
| **Backend Gateway (`:5000`)** | Node.js, Express `4.17`, `mssql` `11.0` + `msnodesqlv8` `4.5` (ODBC Driver 18), `multer` `2.2`, `moment-timezone` `0.6`, `axios` `1.6`, `cors` `2.8` |
| **NLP & ML Microservice (`:5001`)** | Python `3.13`, Flask, PyTorch, Hugging Face `transformers` (`cardiffnlp/twitter-roberta-base-sentiment-latest`), `scikit-learn` (`TfidfVectorizer`, `MultinomialNB`), `nltk` (`PorterStemmer`), `joblib`, `pandas`, `numpy` |
| **Offline ML Tooling** | `clean-text`, `pyspellchecker`, `openpyxl`, `matplotlib` |
| **Database** | Microsoft SQL Server Express (`SQLEXPRESS`, database: `hllSystem`) with Windows Authentication |

---

## System Architecture & NLP Pipeline

```text
┌──────────────────────────────────────────────────────────┐
│               React 19 Frontend Client                   │
│         (MUI v7, Recharts, DataGrid, WordCloud)          │
│                        Port 3000                         │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP / REST
                             ▼
┌──────────────────────────────────────────────────────────┐
│           Node.js / Express Backend Gateway              │
│                   (backend/index.js)                     │
│                        Port 5000                         │
└──────────────┬───────────────────────────┬───────────────┘
               │ HTTP (/analyze,           │ msnodesqlv8
               │ /categorize,              │ ODBC Driver 18
               │ /api/debug/explain-scores)│
               ▼                           ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│  Python Flask NLP Microservice    │ │  Microsoft SQL Server Express     │
│    (backend/sentiment_service.py) │ │        Database: hllSystem        │
│             Port 5001             │ ├───────────────────────────────────┤
├───────────────────────────────────┤ │ • dbo.SatisfactionSurveys         │
│ • CardiffNLP RoBERTa Sentiment    │ │ • dbo.LibLogins                   │
│ • Multinomial NB (category_model) │ │ • dbo.studInfo                    │
│ • Contrast Clause Splitting       │ │ • dbo.GuestPatrons                │
│ • Most-Negative-Wins Arbitration  │ │ • dbo.CardAndPacket               │
│ • Diagnostic Score Explainer      │ │ • dbo.OfficeSupplies              │
└───────────────────────────────────┘ │ • dbo.LibraryEquipment            │
                                      │ • dbo.SupplyTransactions          │
                                      │ • dbo.AssetTransactions           │
                                      │ • dbo.Brands                      │
                                      │ • dbo.Sections                    │
                                      └───────────────────────────────────┘
```

### Production Scoring vs. Model Explainer Scoring

| Context | Formula / Decision Rule |
|---|---|
| **Production Survey Submission** (`POST /api/survey` in `backend/index.js`) | **Option A (Comment-First):** If a written comment is present, `SentimentResult` = RoBERTa label and `SentimentScore` = signed Softmax confidence (`+score` Positive, `-score` Negative, `0.0` Neutral). If the comment is blank, falls back to the 10-item Likert mean `R_avg` (`> +0.15` Positive, `< -0.15` Negative, else Neutral). |
| **Model Explainer Diagnostic View** (`POST /api/debug/explain-scores` in `sentiment_service.py`) | Evaluates the 50/50 hybrid diagnostic breakdown: `Final Score = (R_avg × 0.50) + (BERT Score × 0.50)` where discrete `BERT Score ∈ {-1.0, 0.0, +1.0}` (falls back to `R_avg` when no comment is entered). |

### NLP Model Specifications
* **Contrast Clause Splitting (`split_clauses`):** Splits compound comments on `although`, `though`, `however`, `but`, `while`, `except`, `on the other hand`, and `yet` (minimum 12 chars per clause), or sentence punctuation. If any clause evaluates as `Negative`, Most-Negative-Wins selects the highest-confidence negative clause and binds the category to that negative clause (`get_clause_category`).
* **Naïve Bayes Pipeline (`backend/ml/naive_bayes.py` & `category_model.pkl`):**
  * Preprocessing: Lowercasing, URL/`@`/`#`/non-alpha stripping, and NLTK `PorterStemmer`.
  * Training corpus: `10,836` cleaned comments (`backend/ml/data/clean_category_dataset.csv`, sourced from `11k_ds_updated.xlsx`) merged with `163` curated edge cases (`manual_boundary_cases.csv`) and `6%` simulated annotator ambiguity (`HUMAN_AMBIGUITY_RATE = 0.06`).
  * Grid search (`train_category_model.py`): Evaluates 56 configurations over `alpha ∈ [0.01, 0.1, 0.5, 1.0, 1.5, 2.0, 5.0]`, `ngram_range ∈ [(1,1), (1,2)]`, `min_df ∈ [1, 2, 3, 5]`. Current serialized `category_model.pkl` uses `alpha = 0.01`, `ngram_range = (1, 2)`, `min_df = 1`, `3,209` TF-IDF features.
  * Confidence & Off-Topic Guard: Drops off-topic personal chatter without library domain keywords, enforces confidence threshold fallback (`DEFAULT_CONFIDENCE_THRESHOLD = 0.40` in `naive_bayes.py`; interactive default `0.45` in Model Explainer), and applies domain keyword recovery before defaulting to `Other/Uncategorized`.

---

## Getting Started

### Prerequisites

| Requirement | Minimum / Tested Version | Notes |
|---|---|---|
| **Operating System** | Windows 10 / 11 (x64) | Required for `msnodesqlv8` + Windows Authentication |
| **Node.js & npm** | Node.js `>= 18.0.0` (tested `v22.13.0`), npm `>= 9.0.0` | Uses `npm` + `package-lock.json` |
| **Python** | Python `3.10 – 3.13` (tested `3.13.1`) | Runs Flask NLP service and ML scripts |
| **Microsoft SQL Server** | SQL Server Express `2019` or `2022` | Named instance (e.g., `SQLEXPRESS`) with Windows Auth |
| **ODBC Driver** | Microsoft ODBC Driver 18 for SQL Server | Required by `backend/index.js` connection string |
| **SSMS (Recommended)** | SQL Server Management Studio `19+` | Used to restore `.bak` and execute SQL migrations |
| **Git** | `>= 2.30` | For cloning the repository |

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

> **Branch Note:** The latest post-defense updates (including the modularized Model Explainer Studio) live on the `preoral_updates` branch. If your default clone checks out `main`, switch branches:
> ```bash
> git checkout preoral_updates
> ```

### 2. Install Dependencies

#### A. Frontend (React 19)
Run from the repository root:

```bash
npm install --legacy-peer-deps
```

> Always include `--legacy-peer-deps` due to React 19 peer dependency ranges on `react-scripts` / `react-wordcloud`.

#### B. Express Backend (`backend/`)

```bash
cd backend
npm install
```

> **Note:** If a fresh clone reports a missing local path for unused legacy entry `afinn-165` (`file:1.0.2`), install the active backend runtime packages directly:
> ```bash
> npm install express cors mssql msnodesqlv8 tedious multer axios moment-timezone
> ```

#### C. Python NLP Microservice & ML Tooling
Create and activate a virtual environment (recommended), then install dependencies:

```bash
# From the backend/ directory (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Core runtime dependencies for sentiment_service.py
pip install flask transformers torch scikit-learn joblib nltk numpy

# Optional: offline data cleaning, retraining, and plotting dependencies
pip install pandas openpyxl clean-text pyspellchecker matplotlib
```

> On the first launch of `sentiment_service.py`, Hugging Face automatically downloads and caches `cardiffnlp/twitter-roberta-base-sentiment-latest` (~500 MB; internet connection required once).

### 3. Environment & Connection Configuration

This repository does not ship a `.env.example` template. Configure the frontend `.env` file and backend SQL connection as follows:

#### A. Frontend `.env`
Create (or verify) `.env` at the repository root:

```env
# Speed up React startup and prevent auto-opening browser
BROWSER=none
FAST_REFRESH=true
# Optional: override default CRA port
# PORT=3000
```

| Variable | File | Default / Placeholder | Purpose |
|---|---|---|---|
| `BROWSER` | `.env` | `none` | Prevents Create React App from spawning a browser tab automatically |
| `FAST_REFRESH` | `.env` | `true` | Enables React Fast Refresh during local development |
| `PORT` | `.env` (optional) | `3000` | Port for the React development server |

#### B. Backend SQL Server Connection String
`backend/index.js` reads its SQL Server connection string directly from `config` (line 22–24; no `.env` loader is wired in `backend/`). Update `Server=` to match your machine's SQL Server Express instance (and optionally update `backend/test-connection.js`):

```javascript
// backend/index.js
const config = {
  connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=YOUR_PC_NAME\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
};
```

| Setting | Location | Default Value | Description |
|---|---|---|---|
| `Server` | `backend/index.js` | `YOUR_PC_NAME\SQLEXPRESS` (or `localhost\SQLEXPRESS`) | Local MS SQL Server Express instance name |
| `Database` | `backend/index.js` | `hllSystem` | Target SQL Server database name |
| Express API Port | `backend/index.js` | `5000` (`http://localhost:5000`) | Hardcoded in frontend API calls & `app.listen(5000)` |
| Flask NLP Port | `backend/sentiment_service.py` | `5001` (`http://localhost:5001`) | Called by `backend/index.js` & `ModelExplainer.js` |

### 4. Database Setup & SQL Migrations

1. **Restore the Database Backup (SSMS):**
   * Open SQL Server Management Studio and connect to your local `SQLEXPRESS` instance.
   * Right-click **Databases → Restore Database → Device** and restore the `hllSystem-clean-2.bak` archive (provided with the thesis distribution) as database **`hllSystem`**.

2. **Verify Required Columns & Audit Tables:**
   Run the following idempotent SQL script in SSMS against `hllSystem`:

   ```sql
   USE hllSystem;
   GO

   -- Ensure SatisfactionSurveys has NLP category and confidence score columns
   IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SatisfactionSurveys') AND name = 'Category')
       ALTER TABLE dbo.SatisfactionSurveys ADD Category NVARCHAR(50) NULL;

   IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SatisfactionSurveys') AND name = 'SentimentScore')
       ALTER TABLE dbo.SatisfactionSurveys ADD SentimentScore FLOAT NULL;
   GO

   -- Ensure SupplyTransactions table exists
   IF OBJECT_ID('dbo.SupplyTransactions', 'U') IS NULL
   BEGIN
       CREATE TABLE dbo.SupplyTransactions (
           TransactionId INT IDENTITY(1,1) PRIMARY KEY,
           SupplyId INT NULL,
           ActionType NVARCHAR(50) NOT NULL,
           QuantityChanged INT NOT NULL,
           PreviousQuantity INT NOT NULL,
           NewQuantity INT NOT NULL,
           DestinationSection NVARCHAR(100) NULL,
           Remarks NVARCHAR(500) NULL,
           CreatedBy NVARCHAR(100) NULL,
           TakenBy NVARCHAR(100) NULL,
           CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
       );
   END
   GO

   -- Ensure AssetTransactions table exists
   IF OBJECT_ID('dbo.AssetTransactions', 'U') IS NULL
   BEGIN
       CREATE TABLE dbo.AssetTransactions (
           TransactionId INT IDENTITY(1,1) PRIMARY KEY,
           AssetId INT NOT NULL,
           ActionType NVARCHAR(50) NOT NULL,
           QuantityChanged INT NOT NULL,
           PreviousQuantity INT NOT NULL,
           NewQuantity INT NOT NULL,
           DestinationSection NVARCHAR(100) NULL,
           Remarks NVARCHAR(255) NULL,
           CreatedBy NVARCHAR(100) NULL,
           TakenBy NVARCHAR(100) NULL,
           CreatedAt DATETIME DEFAULT GETDATE()
       );
   END
   GO
   ```

3. **Verify SQL Server Connectivity:**
   ```bash
   cd backend
   node test-connection.js
   ```
   Expected output: `✅ Connected!` and `Query Result: [ { test: 1 } ]`.

### 5. Run Locally (3 Concurrent Terminals)

Start services in this order so the Express gateway can reach the NLP microservice immediately:

#### Terminal 1 — Python Flask NLP Microservice (Port `5001`)
```bash
cd backend
python sentiment_service.py
```
Verify: console prints `Running on http://127.0.0.1:5001`.

#### Terminal 2 — Node.js / Express API Server (Port `5000`)
```bash
cd backend
npm start
```
Verify: console prints `🚀 Server running on http://0.0.0.0:5000` and `✅ Connected to SQL Server`.

#### Terminal 3 — React 19 Frontend Client (Port `3000`)
```bash
# From the repository root
npm start
```
Open **`http://localhost:3000`** in your browser.

| Verification URL | Expected Result |
|---|---|
| `http://localhost:3000/#/` | HLL Library Management landing page |
| `http://localhost:3000/#/sentiment-dashboard` | Admin modal (`admin` / `admin`) → Executive Sentiment Dashboard |
| `http://localhost:3000/#/login-dashboard` | Admin modal (`admin` / `admin`) → Foot Traffic Dashboard |
| `http://localhost:3000/#/model-explainer` | Model Explainer Studio showing green **`Live ML (Port 5001)`** status pill |

### 6. Optional: Clean Data & Retrain the Naïve Bayes Model

```bash
cd backend/ml

# 1. Clean raw Excel corpus (11k_ds_updated.xlsx -> data/clean_category_dataset.csv)
python clean_dataset.py --role=train

# 2. Grid-search and serialize category_model.pkl
python train_category_model.py

# 3. Quick CLI prediction & TF-IDF feature check
python ins_pred.py

# 4. Regenerate Laplace smoothing comparison figure (laplace_smoothing_visualization.png)
python visualize_laplace_smoothing.py
```

---

## REST API Reference

### Express Backend Server (`http://localhost:5000`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/survey` | Runs concurrent RoBERTa (`/analyze`) + Naïve Bayes (`/categorize`) and persists 10 ratings + sentiment in `SatisfactionSurveys` |
| `GET` | `/api/surveys` | Queries surveys filtered by `startDate`, `endDate`, `clientele`, `college`, `course` |
| `DELETE` | `/api/surveys/:id` | Deletes a survey entry by `Id` |
| `POST` | `/api/debug/explain-scores` | Proxies diagnostic requests to Flask `:5001/api/debug/explain-scores` |
| `POST` | `/api/student-lookup` | Looks up `studInfo` (fallback `GuestPatrons`) and logs `Time In` / `Time Out` in `LibLogins` |
| `GET` | `/api/logins` | Fetches login records with date, `section`, `college` (77-course `COLLEGE_MAP`), and `logType` filters |
| `DELETE` | `/api/logins/:id` | Deletes a login record by `LogID` |
| `POST` | `/api/logins/delete-batch` | Batch deletes login records by `ids` array |
| `GET` / `POST` | `/api/card-and-packet` | Lists all 4-book packets or inserts a new packet with duplicate accession checks |
| `GET` | `/api/card-and-packet/search` | Searches packets by `accessionNumber` or `barcodeValue` across all 4 slots |
| `PUT` | `/api/card-and-packet/:id` | Updates a packet record with cross-record accession uniqueness checks |
| `DELETE` | `/api/card-and-packet/:id/book/:bookNum` | Clears slot `1–4` within a packet |
| `GET` / `POST` | `/api/supplies` | Lists supplies or adds a new supply item with auto-generated `SKU-###` |
| `GET` | `/api/supplies/grouped` | Returns supplies grouped by item name, brand, specs, and unit |
| `PUT` / `DELETE` | `/api/supplies/:id` | Updates or deletes a supply record and logs to `SupplyTransactions` |
| `POST` | `/api/supplies/add-stock`, `/api/supplies/:id/add-stock` | Increments supply quantity at a location and logs `Added Stock` |
| `POST` | `/api/supplies/:id/transfer`, `/api/supplies/:id/send` | Atomically transfers supply stock between locations (`LOCATION_TRANSFER`) |
| `POST` | `/api/supplies/disburse` | Records consumable supply disbursement (`Disbursed`) |
| `GET` | `/api/supply-transactions`, `/api/supplies/dashboard/summary` | Supply audit trail and dashboard summary metrics |
| `GET` | `/api/supplies/item-names`, `/api/supplies/brands` | Distinct normalized supply item names and brands |
| `GET` / `POST` | `/api/equipment` | Lists equipment or adds a new asset with unique `ControlNumber` check |
| `GET` | `/api/equipment/grouped` | Returns equipment grouped by item name, brand, and specs |
| `PUT` / `DELETE` | `/api/equipment/:id` | Updates or deletes an equipment record and logs to `AssetTransactions` |
| `POST` | `/api/equipment/add-stock`, `/api/equipment/:id/add-stock`, `/api/equipment/stock-to-location` | Adds equipment stock to a location (`Added Stock`) |
| `POST` | `/api/equipment/:id/transfer`, `/api/equipment/:id/send` | Atomically transfers equipment units between locations (`LOCATION_TRANSFER`) |
| `GET` | `/api/transactions`, `/api/dashboard/summary` | Equipment audit trail and dashboard summary metrics |
| `GET` | `/api/equipment/item-names`, `/api/equipment/brands` | Distinct normalized equipment item names and brands |
| `GET` / `POST` | `/api/brands` | Retrieves or upserts brands in `dbo.Brands` |
| `GET` | `/api/sections` | Lists library sections from `dbo.Sections` |
| `POST` / `GET` | `/api/photos/:idNumber` | Uploads (`photo` field via Multer) or serves patron ID image (`<idNumber>.png`) |

### Python NLP Microservice (`http://localhost:5001`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze` | Accepts `{ "text": "..." }`; returns `{ "sentiment", "score" }` via RoBERTa + Most-Negative-Wins clause splitting |
| `POST` | `/categorize` | Accepts `{ "text": "..." }`; returns `{ "category", "confidence" }` via Multinomial NB + negative-clause binding |
| `POST` | `/api/debug/explain-scores`, `/explain` | Accepts `{ "text", "ratings", "threshold" }`; returns clause breakdown, TF-IDF tokens, NB posteriors, Likert stats, and hybrid math |

---

## Project Structure

```text
<your-repo-name>/
├── .env                                       # Local React dev flags (BROWSER, FAST_REFRESH)
├── package.json                               # Frontend React 19 dependencies & CRA scripts
├── package-lock.json                          # Frontend npm lockfile
├── README.md                                  # Repository documentation (this file)
├── 11k_ds_updated.xlsx                        # Raw training dataset source
├── backend/                                   # Express API & Python NLP microservices
│   ├── index.js                               # Express server (:5000), MSSQL queries, Multer
│   ├── package.json                           # Backend Node.js dependencies
│   ├── sentiment_service.py                   # Flask NLP & XAI service (:5001)
│   ├── test-connection.js                     # SQL Server ODBC connectivity test script
│   ├── check-schema.js                        # Quick OfficeSupplies schema inspection script
│   ├── photos/                                # Uploaded patron ID images (<idNumber>.png)
│   └── ml/                                    # ML preprocessing, training & artifacts
│       ├── data/clean_category_dataset.csv    # 10,836 cleaned training comments
│       ├── manual_boundary_cases.csv          # 163 hand-curated edge-case samples
│       ├── clean_dataset.py                   # Multi-stage cleaning & English-scope filter
│       ├── naive_bayes.py                     # CategoryClassifier, PorterStemmer, fallback guard
│       ├── train_category_model.py            # 56-config grid search & model serializer
│       ├── ins_pred.py                        # CLI single-text prediction & feature inspector
│       ├── visualize_laplace_smoothing.py     # Laplace smoothing plot generator
│       ├── laplace_smoothing_visualization.png# Exported smoothing comparison chart
│       └── category_model.pkl                 # Serialized TF-IDF + MultinomialNB pipeline
└── src/                                       # React 19 frontend source
    ├── App.js                                 # HashRouter & route definitions
    ├── index.js                               # React DOM entry point
    ├── api/                                   # Centralized Axios clients
    │   ├── equipmentApi.js                    # Equipment endpoints
    │   └── suppliesApi.js                     # Supplies endpoints
    ├── Components/                            # Shared UI & modular studio components
    │   ├── Header.js                          # Left navigation drawer (13 routes)
    │   ├── TopBar.js                          # Sticky top bar with title & drawer toggle
    │   ├── PageHeader.js                      # Standardized page header
    │   ├── ScrollToTopButton.js               # Floating scroll-to-top button
    │   ├── SearchBox.js                       # Search input helper
    │   ├── SentimentCharts.js                 # Dashboard charts, KPI cards & WordCloud
    │   └── ModelExplainer/                    # Modular AI Model Explainer Studio
    │       ├── FeedbackDirectory.js           # Searchable/filterable live SQL survey list
    │       ├── ExecutiveVerdict.js            # Statement highlighter, presets & verdict card
    │       ├── SentimentSynthesisTab.js       # 50/50 hybrid math, clauses & Likert simulator
    │       ├── CategoryClassificationTab.js   # NB posteriors, τ slider & TF-IDF feature table
    │       ├── ReferenceGuideDrawer.js        # Slide-over mathematical reference guide
    │       └── explainerUtils.js              # Scoped theme, presets & offline simulation
    ├── constants/                             # Design tokens & domain dictionaries
    │   ├── collegeMap.js                      # 77-course to 18-department map & PST helpers
    │   ├── equipmentConstants.js              # Equipment defaults & status definitions
    │   ├── sentimentConstants.js              # Lexicon, stopwords, ratings & recommendations
    │   ├── sentimentUtils.js                  # NSS/CSAT math & RoBERTa top-comment ranking
    │   └── themeTokens.js                     # Unified executive palette & sx style tokens
    └── pages/                                 # Full-page views (18 routed + legacy UserLogin.js)
```

---

## Academic Thesis Context

| Field | Details |
|---|---|
| **Thesis Title** | *Library Management System with Patron Satisfaction Survey Using Sentiment Analysis and Naïve Bayes Algorithm* |
| **Institution** | Central Philippine University — College of Computer Studies (BSCS) |
| **Target Unit** | Henry Luce III Library (HLL) |
| **Researchers** | Alvarez, Nathaniel C. · Espinosa, Nap David · Rioja, Hanz · Ureta, Juster · Laman, Marc Reymon |
| **Academic Year** | 2026 |

---

## License

Developed for the **Henry Luce III Library**, Central Philippine University.  
Academic capstone software asset. All rights reserved © 2026.
