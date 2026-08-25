# Library Management System with Patron Satisfaction Survey
### Powered by Dual-Engine NLP (RoBERTa BERT Sentiment Analysis & Naïve Bayes Category Classification)

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
**Capstone Thesis Project — Henry Luce III Library**

---

## 📌 Overview

This is an enterprise-grade, web-based **Library Management System** developed for the **Henry Luce III Library** at Central Philippine University. The system unifies core library operations — patron sign-in access monitoring, book card & packet encoding, unified book cataloging, and office supplies & library equipment inventory tracking — with an automated feedback analytics module powered by a **Dual-Engine NLP Pipeline** (RoBERTa BERT Sentiment Analysis + Naïve Bayes Category Classification).

---

## 🏗️ System Architecture & Workflow

```
                        ┌─────────────────────────────────────────┐
                        │      React 19 Frontend Dashboard        │
                        │        (Port 3000 / HashRouter)         │
                        └────────────────────┬────────────────────┘
                                             │ HTTP REST API
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │     Express Backend Server (index.js)   │
                        │               (Port 5000)               │
                        └─────────┬─────────────────────┬─────────┘
                                  │                     │
                POST /analyze &   │                     │ ODBC Driver 18
                /categorize       │                     │ SQL Connection
                                  ▼                     ▼
┌──────────────────────────────────────────┐   ┌────────────────────────────────┐
│   Python Flask NLP Microservice          │   │  Microsoft SQL Server DB       │
│      (sentiment_service.py :5001)        │   │          (hllSystem)           │
├──────────────────────────────────────────┤   ├─────────────�## 🚀 Key Modules & Capabilities

### 1. HLL Patron Sign-in Portal & Traffic Analytics (`/login`, `/logindata`, `/login-dashboard`)
- **Student ID Lookup**: Real-time retrieval of student records (`studInfo`) by ID number, auto-populating student profile and gender details.
- **Section Traffic Tracking**: Monitors daily entry (`Time In`) and exit (`Time Out`) events across library sections (e.g., Knowledge Center, American Corner, Graduate Studies Section).
- **Dedicated Admin Login Analytics Dashboard (`/login-dashboard`)**:
  - **Admin Authentication Guard**: Secure modal dialog requiring admin credentials (`admin` / `admin`).
  - **KPI Summary Cards**: Real-time summary metric cards tracking **Total Library Visits**, **Top Visiting College/Department**, **Peak Library Section**, and **Active Departments Count**.
  - **Recharts Visual Analytics**: Interactive Bar Charts for college/department foot traffic distributions and responsive Pie Charts for section utilization shares.
  - **77-Course to 18-Department Normalization**: Standardizes all 77 academic degree program codes into 18 parent college/department groups via centralized [`src/constants/collegeMap.js`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/constants/collegeMap.js).
  - **Interactive Filtering & Zero-Match Handling**: Date range filters, college selectors, and library section filters with "Apply Filter" execution, "Clear" reset, and graceful zero-row states.
  - **Export & Print**: Multi-sheet SheetJS Excel export (`.xlsx`) with auto-sized columns and printable PDF report templates.

### 2. Patron Satisfaction Survey & Sentiment Microservice (`/satisfaction-survey`, `/surveys`, `/sentiment-dashboard`)
- **10-Question Emoji Likert Survey**: Collects structured patron feedback rated from Very Satisfied to Very Dissatisfied. Modernized with elevated card components, smooth step transitions, and simplified faculty flow (optional college/course for `FACULTY` and `ALUMNI`).
- **Open-Ended Text Feedback**: Accepts open text commentary processed simultaneously by RoBERTa BERT and Naïve Bayes models.
- **Dual-Engine Sentiment Analysis (Option A: Comment-First Sentiment)**:
  - **Engine 1 (RoBERTa BERT)**: Predicts fine-grained text sentiment (`Positive`, `Neutral`, `Negative`). When a patron writes a comment, overall sentiment is **100% determined by BERT text sentiment**, ensuring written feedback is never diluted by emoji scores.
  - **Engine 2 (Naïve Bayes)**: Assigns feedback to domain categories (`Facilities`, `Staff`, `Collection`, `Other/Uncategorized`) with confidence gating ($\tau = 0.45$), NLTK `PorterStemmer`, and domain keyword overrides.
  - **Clause-Aware Mixed Sentiment (`get_clause_category`)**: Splits compound feedback on contrast conjunctions (`but`, `however`, `although`, `though`), scores each clause, and dynamically binds overall category and negative sentiment to the **winning negative complaint clause**.
  - **Emoji Fallback**: If the comment field is blank, sentiment falls back to the 10-question emoji average rating score. All 10 Likert responses (`Question1`–`Question10`) continue to be stored in SQL Server for 1–5 scale CSAT analytics.
- **Analytics & Recommendation Engine (`SentimentDashboard.js`)**:
  - **Custom Donut Chart Visualization**: Re-engineered Recharts Donut Chart (`innerRadius={75}`, `outerRadius={105}`) with centered metric overlays, styled percentage indicator badges, and responsive slice interactions.
  - **Philippine Timezone Alignment (`Asia/Manila` / UTC+8)**: SQL date bounds and date picker presets (**Today**, **Last 7 Days**, **Last 30 Days**, **This Month**, **Custom**) strictly aligned to local Philippine Standard Time (`00:00:00` to `23:59:59.997`).
  - **KPI Score Cards**: Average satisfaction score scaled from `-1.0` to `+1.0`, 1–5 CSAT scale averages, and Net Sentiment Score (NSS = `% Positive - % Negative`).
  - **Controlled Domain Lexicon Keyword Ranking**: Ranks top 5 positive and negative comments by matching feedback against a canonical **Controlled Domain Lexicon** across Facilities, Staff, and Collection.
  - **Blended Score Ranking & Topic Diversity**: Ranks comments by blending pool topic relevance ($70\%$) with sentiment magnitude ($30\%$), enforcing a 2-comment cap per topic for balanced feedback diversity.
  - **Deterministic Word Cloud**: Top 60 comment keywords rendered via `ReactWordcloud` with fixed seed for stable layout presentation.
  - **Service Improvement Recommendations**: Rule-based action recommendations triggered when category negative response ratios hit $\ge 30\%$ (Moderate Concern) or $\ge 50\%$ (High Concern).

### 3. Technical Services: Book Card & Packet Encoding (`/card-and-packet`, `/book-catalogue`)
- **Multi-Book Packet Encoding**: Encodes up to 4 book records simultaneously within a single physical packet.
- **Accession & Barcode Dup-Check**: Validates accession number uniqueness across all 4 book slots prior to persistence.
- **Unified Book Catalog**: Flattened grid view aggregating all individual books across packet records, featuring searching, sorting, and Excel exports (`xlsx`).
- **Standardized Call Number & Print Layouts**: Standardized Henry Luce (`HL`) call number formatting in `BookCatalogue.js` and fixed 4-slot book packet print alignment in `CardAndPacket.js`.

### 4. Property & Inventory Management (`/supplies`, `/equipment`, `/supplies-encoding`, `/equipment-encoding`)
- **Office Supplies Inventory**: Manages stock items, specifications, units of measure, location balances, and low-stock alerts.
- **Library Equipment Inventory**: Tracks library hardware assets, serial numbers, brands, specifications, and current placement locations.
- **Stock Adjustment & Restocking**: Dedicated endpoints (`/add-stock`) to update quantity balances at specific locations without creating duplicate entries.
- **Location Transfers (`/send-supply`, `/send-asset`)**: Atomic SQL transaction endpoints allowing cross-section transfer of stock with quantity validation.
- **Transaction History Audit Logs (`/supply-transactions`, `/transactions`)**: Comprehensive audit trail capturing action types (`Added`, `Updated`, `Deleted`, `Added Stock`, `LOCATION_TRANSFER`), quantity changes, previous/new balances, timestamp, and user.

---

## 📍 Client Routes Mapping

| Route | Page Component | Purpose / Description |
|---|---|---|
| `/` | [`Home.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/Home.js) | Main landing page & navigation hub |
| `/login` | [`Login.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/Login.js) | Patron Sign-in portal for time-in / time-out lookup |
| `/logindata` | [`LoginData.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/LoginData.js) | Raw sign-in logs table with batch delete and filters |
| `/login-dashboard` | [`LoginDashboard.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/LoginDashboard.js) | Admin visual analytics dashboard for patron foot traffic & demographics |
| `/satisfaction-survey` | [`SatisfactionSurvey.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/SatisfactionSurvey.js) | 10-question patron feedback survey form |
| `/surveys` | [`SatisfactionSurveyData.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/SatisfactionSurveyData.js) | View and delete survey submissions and sentiment labels |
| `/sentiment-dashboard` | [`SentimentDashboard.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/SentimentDashboard.js) | Dual-Engine Sentiment & Category Analysis Dashboard |
| `/card-and-packet` | [`CardAndPacket.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/CardAndPacket.js) | Book Card and Packet Encoding Form (up to 4 books/record) |
| `/book-catalogue` | [`BookCatalogue.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/BookCatalogue.js) | Unified book catalog flattened list view with Excel exports |
| `/supplies` | [`Supplies.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/Supplies.js) | View-only Office Supplies Inventory catalog |
| `/equipment` | [`Equipment.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/Equipment.js) | View-only Library Equipment Inventory catalog |
| `/supplies-encoding` | [`SuppliesEncode.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/SuppliesEncode.js) | Office Supplies Encoding Panel (Add, Edit, Delete, Restock) |
| `/equipment-encoding` | [`EquipmentEncode.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/EquipmentEncode.js) | Library Equipment Encoding Panel (Add, Edit, Delete, Restock) |
| `/send-supply` | [`SendSupply.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/SendSupply.js) | Office Supplies location transfer form |
| `/send-asset` | [`Sendasset.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/Sendasset.js) | Library Equipment location transfer form |
| `/supply-transactions` | [`SupplyTransactionHistory.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/SupplyTransactionHistory.js) | Audit log for supply stock adjustments and transfers |
| `/transactions` | [`Transactionhistory.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/Transactionhistory.js) | Audit log for equipment stock adjustments and transfers |

---

## 👥 User Roles & Access Control Matrix

| System Capability | Admin | Librarian | Standard User |
|---|:---:|:---:|:---:|
| HLL Sign-in & Patron Logins | ✅ | ✅ | ✅ |
| Submit Patron Satisfaction Survey | ✅ | ✅ | ✅ |
| View Inventory Catalogs (`/supplies`, `/equipment`) | ✅ | ✅ | ✅ |
| View Unified Book Catalog (`/book-catalogue`) | ✅ | ✅ | ✅ |
| Encode Book Cards & Packets (`/card-and-packet`) | ✅ | ✅ | ❌ |
| Encode & Restock Inventory (`/supplies-encoding`, `/equipment-encoding`) | ✅ | ✅ | ❌ |
| Transfer Inventory Items (`/send-supply`, `/send-asset`) | ✅ | ✅ | ❌ |
| View Login Analytics Dashboard (`/login-dashboard`) | ✅ | ❌ | ❌ |
| View Sentiment Analytics Dashboard (`/sentiment-dashboard`) | ✅ | ❌ | ❌ |
| Delete Logins, Surveys, or Inventory Records | ✅ | ❌ | ❌ |

---

## 🤖 Dual-Engine NLP Pipeline Architecture

```
Open-Ended Patron Feedback Text
               │
               ├──────────────────────────────────────────┐
               ▼                                          ▼
   [RoBERTa BERT Model Engine]              [Multinomial Naïve Bayes Engine]
cardiffnlp/twitter-roberta-base-sentiment   TfidfVectorizer + MultinomialNB
               │                            (with NLTK Stemmer & Fallback τ=0.45)
               ▼                                          │
   Predicted Text Sentiment                               ▼
 (Positive / Neutral / Negative)               Predicted Category Domain
               │                           (Facilities / Staff / Collection / Other)
               │                                          │
               └────────────────────┬─────────────────────┘
                                    ▼
                Option A: Comment-First Sentiment Determination
    • If Written Comment is Present: Overall Sentiment = 100% BERT Text Sentiment
    • If Written Comment is Blank:   Overall Sentiment = 10-Question Emoji Rating Average
```

### Sentiment Score Calculation Specifications (Option A)
1. **Comment-First Rule**: When patron commentary is submitted, `overallSentiment` is derived **strictly from RoBERTa BERT text analysis** (`Positive` $= +1.0$, `Neutral` $= 0.0$, `Negative` $= -1.0$).
2. **Emoji Fallback Rule**: If no comment is provided, `overallSentiment` calculates the average across the 10 Likert emoji responses:
   $$\text{Very Satisfied} = +1.0 \quad \text{Satisfied} = +0.5 \quad \text{Neutral} = 0.0 \quad \text{Dissatisfied} = -0.5 \quad \text{Very Dissatisfied} = -1.0$$
3. **Continuous Decision Boundary (for fallback or continuous tracking)**:
   $$\text{SentimentResult} = \begin{cases} \text{Positive} & \text{if } \text{SentimentScore} > +0.15 \\ \text{Negative} & \text{if } \text{SentimentScore} < -0.15 \\ \text{Neutral} & \text{otherwise} \end{cases}$$

---

## ⚡ Recent System Updates & Enhancements (August 2026)

Below is a summary of major updates implemented in the system:

1. **Admin Login Analytics Dashboard & 77-Course Normalization (`LoginDashboard.js`, `collegeMap.js`)**:
   - **Dedicated Admin Portal**: Added route `/login-dashboard` guarded by an admin modal login dialog (`admin` / `admin`).
   - **KPI Summary Cards**: Real-time metric cards for Total Visits, Top College, Peak Section, and Active Departments.
   - **Recharts Visualizations**: Dynamic Bar Chart (Visits by College) and Pie Chart (Section Distribution).
   - **77-Course Mapping Dictionary**: Mapped all 77 degree program codes to their 18 parent college/department groups (`CARES`, `CAS`, `CBA`, `CCS`, `COED`, `COE`, `CHM`, `CMLS`, `CON`, `COP`, `COL`, `COM`, `COT`, `SGS`, `KINDER`, `ELEM`, `JHS`, `SHS`) in centralized [`src/constants/collegeMap.js`](file:///c:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/constants/collegeMap.js).
   - **Backend SQL Search Enhancement**: Updated `GET /api/logins` to search across both `studCollege` and `studCourse`.
   - **Zero-Match & Filter Trigger**: "Apply Filter" execution triggers, "Clear" filter reset, and clean zero-row displays for empty selections.
   - **Multi-Sheet Excel & PDF Reports**: Export complete datasets with auto-sized column widths or print formatted PDF summaries.

2. **Sentiment & Category Analytics Dashboard Redesign (`SentimentDashboard.js`)**:
   - **Custom Donut Chart**: Re-architected category distribution into an interactive Donut Chart with centered metric volume displays and custom category legend pills.
   - **Philippine Standard Time (`Asia/Manila`, UTC+8) Synchronization**: Aligned SQL date bounds and UI date pickers (`00:00:00` to `23:59:59.997`) with preset buttons (**Today**, **Last 7 Days**, **Last 30 Days**, **This Month**, **Custom**).
   - **KPI Metrics Overhaul**: Average CSAT (1–5 scale), Net Sentiment Score (NSS = `% Positive - % Negative`), and Top 5 Priority Positive/Negative actionable feedback cards.

3. **Machine Learning Pipeline & Model Retraining (`backend/ml/`)**:
   - **Dataset Scaling (13,800+ Samples)**: Scaled category classification training data from `dataset_10k.xlsx` / `dataset_11k.xlsx` to over 13,800+ clean samples in `data/clean_category_dataset.csv`.
   - **Multi-Stage Preprocessing & Tagalog Whitelist (`clean_dataset.py`)**: Integrated `clean-text` normalization, character run reduction, single-token keyboard mashing detector ($\ge 20$ chars), multi-token gibberish filter ($\ge 60\%$ unknown words), static filler removal (`"none"`, `"n/a"`, `"ok"`, `<3` chars), and `LOCAL_DOMAIN_WHITELIST` (`wala`, `sana`, `meron`, `aircon`, `cr`, `wifi`, `mabait`, etc.) ensuring valid Taglish/local terms are preserved.
   - **Tuple-Based Deduplication**: Deduplicated by `(comment, category)` tuples, preserving genuine cross-category linguistic overlap.
   - **163+ Manual Boundary Cases & NLTK Stemmer**: Merged `manual_boundary_cases.csv` and integrated NLTK `PorterStemmer` into `naive_bayes.py` for morphological unification.
   - **Realistic 93.0%–95.6% Accuracy Benchmark**: Injected 6% simulated human annotator ambiguity (`apply_annotator_ambiguity`) and ~10% context-free comments into training to eliminate artificial ~99.9% certainty, establishing an honest, defensible empirical benchmark.
   - **Collocation Bias Analysis & Mitigations**: Analyzed and mitigated single-word training corpus bias (e.g. `"bad"` co-occurring with `Collection`) through 3-tier guards (Cleaner filler drop, Domain Keyword Guards in `naive_bayes.py`, and Sentiment Engine Independence).
   - **Live Pilot Survey Ingestion**: Processed and validated the first **60 real patron pilot survey submissions** (August 14–15, 2026: 28 Positive, 26 Negative, 6 Neutral; 18 Collection, 15 Facilities, 14 Other, 13 Staff).
   - **Clause-Aware Mixed Sentiment & Dynamic Category Binding (`get_clause_category`)**: Splits compound feedback on contrast conjunctions (`but`, `however`, `although`, `though`), scores each clause, and dynamically binds overall category and negative sentiment to the **winning negative complaint clause**.

4. **Patron Satisfaction Survey Form Refinements (`SatisfactionSurvey.js`)**:
   - **Faculty Patron Flow Simplification**: Removed mandatory College/Course validation for patrons selecting `FACULTY` or `ALUMNI`.
   - **Interactive Card Layout**: Upgraded 10 survey rating questions with elevated card components and 5-point emoji rating selectors.

5. **Technical Services & Catalog Encoding (`BookCatalogue.js` & `CardAndPacket.js`)**:
   - **Standardized Call Numbers**: Standardized Henry Luce (`HL`) call number formatting in `BookCatalogue.js`.
   - **Print Alignment**: Fixed print layout alignment for 4-slot book packet printouts in `CardAndPacket.js`.
   - **Sign-in Modal Exit Flow**: Added close/exit functionality on the patron login portal (`Login.js`).

---

## 💻 Dependencies & Required Packages

### 1. Frontend Dependencies (React 19 Client)
- **Core Framework**: `react` (v19.1+), `react-dom` (v19.1+), `react-router-dom` (v7.5+)
- **UI Components & Icons**: `@mui/material` (v7.0+), `@mui/icons-material` (v7.0+), `@mui/x-data-grid` (v8.11+), `@emotion/react`, `@emotion/styled`, `@fontsource/poppins`, `lucide-react`
- **Data Visualization**: `recharts` (v3.8+), `react-wordcloud` (v1.2+)
- **HTTP & Utilities**: `axios`, `moment-timezone`, `xlsx`, `web-vitals`
- **Client Sentiment Libraries**: `vader-sentiment`, `natural`, `afinn-165`, `ajv`

### 2. Express REST API Backend Dependencies (`backend/package.json`)
- **Web Framework & Middleware**: `express` (v4/v5), `cors`, `multer` (v2.2+)
- **SQL Server Database Drivers**: `mssql` (v11.0+), `msnodesqlv8` (v4.5+), `tedious` (v19.2+)
- **HTTP & NLP Utilities**: `axios`, `moment-timezone`, `natural` (v8.1+), `vader-sentiment`, `afinn-165`

### 3. Python NLP Microservice & ML Dependencies (`backend/sentiment_service.py` & `backend/ml/`)
- **Flask Framework**: `flask`
- **Transformers & Deep Learning**: `transformers`, `torch` (PyTorch for `cardiffnlp/twitter-roberta-base-sentiment-latest`)
- **Machine Learning & Text Processing**: `scikit-learn`, `pandas`, `joblib`, `nltk` (PorterStemmer), `clean-text`, `pyspellchecker`, `openpyxl` (for reading `.xlsx` datasets), `matplotlib`

---

## 🗄️ Database Schema & DDL Migration Scripts

Run the following SQL queries in SQL Server Management Studio (SSMS) on database `hllSystem`:

```sql
USE hllSystem;
GO

-- 1. Ensure SatisfactionSurveys table has Category and SentimentScore columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SatisfactionSurveys') AND name = 'Category')
    ALTER TABLE SatisfactionSurveys ADD Category NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SatisfactionSurveys') AND name = 'SentimentScore')
    ALTER TABLE SatisfactionSurveys ADD SentimentScore FLOAT NULL;
GO

-- 2. Audit Trail Table for Equipment Inventory Transactions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AssetTransactions')
BEGIN
    CREATE TABLE AssetTransactions (
        TransactionId INT IDENTITY(1,1) PRIMARY KEY,
        AssetId INT NULL,
        ActionType NVARCHAR(50) NOT NULL,
        QuantityChanged INT NOT NULL,
        PreviousQuantity INT NOT NULL,
        NewQuantity INT NOT NULL,
        DestinationSection NVARCHAR(100) NULL,
        Remarks NVARCHAR(255) NULL,
        CreatedBy NVARCHAR(100) NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END;
GO

-- 3. Audit Trail Table for Office Supplies Transactions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SupplyTransactions')
BEGIN
    CREATE TABLE SupplyTransactions (
        TransactionId INT IDENTITY(1,1) PRIMARY KEY,
        SupplyId INT NULL,
        ActionType NVARCHAR(50) NOT NULL,
        QuantityChanged INT NOT NULL,
        PreviousQuantity INT NOT NULL,
        NewQuantity INT NOT NULL,
        DestinationSection NVARCHAR(100) NULL,
        Remarks NVARCHAR(255) NULL,
        CreatedBy NVARCHAR(100) NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END;
GO
```

---

## ⚙️ Complete Terminal Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **Python**: v3.9 or higher with `pip` (`python --version`)
- **SQL Server**: Microsoft SQL Server Express (`SQLEXPRESS`)
- **ODBC Driver**: ODBC Driver 18 for SQL Server

---

### Step-by-Step Terminal Commands

#### Step 1: Clone Repository & Navigate to Project Root
```bash
git clone https://github.com/Strixyl/lms_scratch.git
cd hllsystem
```

#### Step 2: Install All Frontend React Dependencies (Terminal)
Run the following terminal commands in the root directory to install React 19, Material UI, Recharts, and utility packages:
```bash
# Install core frontend packages
npm install react react-dom react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled @mui/x-data-grid @fontsource/poppins recharts axios moment-timezone xlsx vader-sentiment natural afinn-165 ajv web-vitals firebase lucide-react

# Install react-wordcloud with legacy peer dependency flag for React 19 compatibility
npm install react-wordcloud --legacy-peer-deps

# Verify installation or install all packages from package.json
npm install
```

#### Step 3: Install All Express REST API Backend Dependencies (Terminal)
Open your terminal, navigate to the `backend` folder, and run:
```bash
# Navigate to backend directory
cd backend

# Install Express API & SQL Server driver dependencies
npm install express cors mssql msnodesqlv8 tedious multer axios moment-timezone natural vader-sentiment afinn-165

# Return to root directory
cd ..
```

#### Step 4: Install All Python NLP Microservice & ML Dependencies (Terminal)
Install all Python libraries for Flask microservice, RoBERTa BERT sentiment analysis, and Naïve Bayes model training:
```bash
# (Optional) Create and activate Python virtual environment
python -m venv venv

# Windows (PowerShell / Command Prompt):
.\venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate

# Install required Python packages via pip
pip install flask transformers torch scikit-learn pandas joblib nltk clean-text pyspellchecker openpyxl matplotlib
```

#### Step 5: (Optional) Retrain ML Category Classifier via Terminal
If expanding survey datasets or manual boundary cases:
```bash
# Navigate to ML pipeline folder
cd backend/ml

# Step 5a: Clean raw Excel dataset (dataset_10k.xlsx -> clean_category_dataset.csv, 13,800+ rows)
python clean_dataset.py --role=train

# Step 5b: Execute hyperparameter grid search and export serialized category_model.pkl
python train_category_model.py

# Return to project root directory
cd ../..
```

---

### 🚀 Complete Service Launch Sequence (3 Terminal Windows)

To run the full multi-service application, launch 3 separate terminal sessions:

#### **Terminal 1: Start Python NLP Microservice (Port 5001)**
```bash
# Terminal 1: From project root folder
python backend/sentiment_service.py
```
*Expected Output:*
```text
 * Serving Flask app 'sentiment_service'
 * Running on http://127.0.0.1:5001
```

#### **Terminal 2: Start Express Backend REST API (Port 5000)**
```bash
# Terminal 2: Navigate to backend folder and start server
cd backend
npm start
```
*Expected Output:*
```text
Server running on http://localhost:5000
Connected to SQL Server database hllSystem
```

#### **Terminal 3: Start React Frontend Application (Port 3000)**
```bash
# Terminal 3: From project root folder
npm start
```
*Expected Output:*
```text
Compiled successfully!
You can now view hllsystem in the browser.
Local: http://localhost:3000
```

---

## 🎓 Capstone Thesis Information

| Field | Details |
|---|---|
| **Thesis Title** | Library Management System with Patron Satisfaction Survey Using Sentiment Analysis and Naïve Bayes Algorithm |
| **Institution** | Central Philippine University |
| **College** | College of Computer Studies |
| **Target Organization** | Henry Luce III Library |
| **Degree Program** | Bachelor of Science in Computer Science |
| **Year** | 2026 |ions:

#### **Terminal 1: Start Python NLP Microservice (Port 5001)**
```bash
# Terminal 1: From project root folder
python backend/sentiment_service.py
```
*Expected Output:*
```text
 * Serving Flask app 'sentiment_service'
 * Running on http://127.0.0.1:5001
```

#### **Terminal 2: Start Express Backend REST API (Port 5000)**
```bash
# Terminal 2: Navigate to backend folder and start server
cd backend
npm start
```
*Expected Output:*
```text
Server running on http://localhost:5000
Connected to SQL Server database hllSystem
```

#### **Terminal 3: Start React Frontend Application (Port 3000)**
```bash
# Terminal 3: From project root folder
npm start
```
*Expected Output:*
```text
Compiled successfully!
You can now view hllsystem in the browser.
Local: http://localhost:3000
```

---

## 🎓 Capstone Thesis Information

| Field | Details |
|---|---|
| **Thesis Title** | Library Management System with Patron Satisfaction Survey Using Sentiment Analysis and Naïve Bayes Algorithm |
| **Institution** | Central Philippine University |
| **College** | College of Computer Studies |
| **Target Organization** | Henry Luce III Library |
| **Degree Program** | Bachelor of Science in Computer Science |
| **Year** | 2026 |

