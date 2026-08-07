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
├──────────────────────────────────────────┤   ├────────────────────────────────┤
│ 1. RoBERTa BERT Sentiment Engine         │   │ • dbo.SatisfactionSurveys      │
│    (cardiffnlp/twitter-roberta-base)     │   │ • dbo.LibLogins & studInfo     │
│ 2. Multinomial Naïve Bayes Classifier    │   │ • dbo.CardAndPacket            │
│    (category_model.pkl, τ = 0.45)        │   │ • dbo.OfficeSupplies           │
└──────────────────────────────────────────┘   │ • dbo.LibraryEquipment         │
                                               │ • dbo.AssetTransactions        │
                                               │ • dbo.SupplyTransactions       │
                                               └────────────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. HLL Patron Sign-in Portal & Traffic Analytics (`/login`, `/logindata`, `/login-dashboard`)
- **Student ID Lookup**: Real-time retrieval of student records (`studInfo`) by ID number, auto-populating student profile and gender details.
- **Section Traffic Tracking**: Monitors daily entry (`Time In`) and exit (`Time Out`) events across library sections (e.g., Knowledge Center, American Corner, Graduate Studies Section).
- **Logins Dashboard**: Interactive analytics visualization showing total patron foot traffic, peak usage hours, department/college demographic distributions, and section utilization rates.

### 2. Patron Satisfaction Survey & Sentiment Microservice (`/satisfaction-survey`, `/surveys`, `/sentiment-dashboard`)
- **10-Question Emoji Likert Survey**: Collects structured patron feedback rated from Very Satisfied to Very Dissatisfied.
- **Open-Ended Text Feedback**: Accepts open text commentary processed simultaneously by RoBERTa BERT and Naïve Bayes models.
- **Dual-Engine Sentiment Analysis**:
  - **BERT Text Sentiment**: Predicts fine-grained text sentiment (`Positive`, `Neutral`, `Negative`).
  - **Naïve Bayes Category Classification**: Assigns feedback to domain categories (`Facilities`, `Staff`, `Collection`, `Other/Uncategorized`) with confidence gating ($\tau = 0.45$).
  - **Blended Sentiment Score**: Combines quantitative emoji rating ($50\%$) with text BERT sentiment ($50\%$) into a unified continuous score $\text{SentimentScore} \in [-1.0, +1.0]$.
- **Analytics & Recommendation Engine (`SentimentDashboard.js`)**:
  - **KPI Score Cards**: Average satisfaction score scaled from `-1.0` to `+1.0` and 1-5 CSAT scale averages.
  - **12-Month Sentiment Trends**: Side-by-side bar chart showing monthly positive, neutral, and negative response distributions.
  - **Controlled Domain Lexicon Keyword Ranking**: Ranks top 5 positive and negative comments by matching feedback against a canonical **Controlled Domain Lexicon** across Facilities (`Restroom & Hygiene`, `Air Conditioning`, `Tables, Seating & Space`, `Wi-Fi & Power Outlets`, `Noise Level & Ambience`, `Lighting & Cleanliness`), Staff (`Librarians & Staffs`, `Security`, `Service Quality & Attitude`), and Collection (`Books & Reference Materials`, `Catalogue, OPAC & Search`, `Borrowing & Circulation`, `Computers`).
  - **Blended Score Ranking & Topic Diversity**: Ranks comments by blending pool topic relevance ($70\%$) with sentiment magnitude ($30\%$), enforcing a 2-comment cap per topic for balanced feedback diversity.
  - **Small-Pool Fallback Guard**: Bypasses frequency scoring when a sentiment pool has $< 5$ comments, sorting directly by sentiment score magnitude.
  - **Deterministic Word Cloud**: Top 60 comment keywords rendered via `ReactWordcloud` with fixed seed for stable layout presentation.
  - **Service Improvement Recommendations**: Rule-based action recommendations triggered when category negative response ratios hit $\ge 30\%$ (Moderate Concern) or $\ge 50\%$ (High Concern). Offers **Option A (Keyword Signals)** and **Option B (Raw Supporting Evidence)**.

### 3. Technical Services: Book Card & Packet Encoding (`/card-and-packet`, `/book-catalogue`)
- **Multi-Book Packet Encoding**: Encodes up to 4 book records simultaneously within a single physical packet.
- **Accession & Barcode Dup-Check**: Validates accession number uniqueness across all 4 book slots prior to persistence.
- **Unified Book Catalog**: Flattened grid view aggregating all individual books across packet records, featuring searching, sorting, and Excel exports (`xlsx`).
- **Printable Card Packets**: Generates formatted printable catalog card sheets conforming to Henry Luce III Library standards.

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
| `/login-dashboard` | [`LoginDashboard.js`](file:///C:/Users/LENOVO/OneDrive/Documents/Library%20Management%20System/hllsystem%20-%20Oct10-2025/src/pages/LoginDashboard.js) | Visual analytics dashboard for patron foot traffic & demographics |
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
               │                                          │
               ▼                                          ▼
   Predicted Text Sentiment                   Predicted Category Domain
 (Positive / Neutral / Negative)            (Facilities / Staff / Collection)
               │                                   (Fallback τ=0.45)
               └────────────────────┬─────────────────────┘
                                    ▼
                Combined Blended Sentiment Score Formula
   SentimentScore = (Emoji Rating Avg × 0.50) + (BERT Sentiment Score × 0.50)
```

### Combined Sentiment Score Formula
1. **Emoji Rating Numerical Mapping**:
   $$\text{Very Satisfied} = +1.0 \quad \text{Satisfied} = +0.5 \quad \text{Neutral} = 0.0 \quad \text{Dissatisfied} = -0.5 \quad \text{Very Dissatisfied} = -1.0$$
2. **BERT Sentiment Numerical Mapping**:
   $$\text{Positive} = +1.0 \quad \text{Neutral} = 0.0 \quad \text{Negative} = -1.0$$
3. **Blended Equation**:
   $$\text{SentimentScore} = (\text{Emoji Rating Avg} \times 0.50) + (\text{BERT Score} \times 0.50)$$
4. **Classification Decision Boundary**:
   $$\text{SentimentResult} = \begin{cases} \text{Positive} & \text{if } \text{SentimentScore} > +0.15 \\ \text{Negative} & \text{if } \text{SentimentScore} < -0.15 \\ \text{Neutral} & \text{otherwise} \end{cases}$$

---

## ⚡ Recent System Updates & Enhancements

Below is a summary of major updates implemented in the system:

1. **Machine Learning Pipeline & Model Retraining (`backend/ml/`)**:
   - **Dataset Expansion & Cleaning**: Updated `clean_dataset.py` to ingest and sanitize 5,000+ raw survey feedback entries (`5kwithnoise.xlsx`), filtering noise tokens (`"none"`, `"n/a"`, `"ok"`, `"asdf"`, `"wala"`), duplicates, and short text fragments.
   - **Manual Boundary Case Integration**: Merged `manual_boundary_cases.csv` (117 hand-curated edge cases) directly into the Naïve Bayes dataset to resolve misclassifications on domain boundaries.
   - **Hyperparameter Grid Search**: Executed stratified 80/20 train-validation splits across $\alpha \in [0.01..5.0]$, unigrams/bigrams, and minimum document frequencies to yield an optimized `category_model.pkl`.
   - **Microservice Gating**: Enhanced `sentiment_service.py` with fallback confidence threshold gating ($\tau = 0.45$).

2. **Patron Satisfaction Survey UI/UX Redesign (`SatisfactionSurvey.js`)**:
   - **Radio Button Rating Controls**: Transformed CSAT rating interface from pill buttons into accessible interactive radio button components per panelist recommendations.
   - **Single-Question Animated View**: Added single-item view mode with step-by-step progress bars and smooth CSS animations.

3. **Sentiment Analytics & Controlled Lexicon Engine (`SentimentDashboard.js`)**:
   - **Controlled Domain Lexicon Keyword Ranking**: Restructured top comment keyword detection using `CONTROLLED_LEXICON`, categorizing entities across Facilities (`Restroom & Hygiene`, `Air Conditioning`, `Tables, Seating & Space`, `Wi-Fi & Power Outlets`, `Noise Level & Ambience`, `Lighting & Cleanliness`), Staff (`Librarians & Staffs`, `Security`, `Service Quality & Attitude`), and Collection (`Books & Reference Materials`, `Catalogue, OPAC & Search`, `Borrowing & Circulation`, `Computers`).
   - **Pool-Relative Topic Mentions**: Counts canonical topic occurrences separately in Positive vs. Negative comment pools to prevent cross-pool term inflation.
   - **Blended Score Ranking ($70/30$)**: Blends pool topic relevance ($70\%$) with sentiment magnitude ($30\%$) to rank top comments.
   - **Topic Diversity Filter & Small-Pool Guard**: Limits selection to 2 comments per topic to ensure feedback variety, with a magnitude fallback guard for pools with $< 5$ entries.
   - **English NLP Sentiment Scope**: Scoped preprocessing and stopword filtering strictly to English patron feedback text.
   - **Streamlined Parametric Filters**: Cleaned up dashboard filter controls to focus on structured date ranges, clientele, college, sentiment, category, and academic year.
   - **Dual-Option Recommendation Engine**: Implemented **Option A (Keyword Signals)** and **Option B (Raw Supporting Evidence)** triggered when category negative feedback reaches $\ge 30\%$ (Moderate Concern) or $\ge 50\%$ (High Concern).
   - **Stable Word Cloud**: Integrated deterministic `ReactWordcloud` rendering with a fixed random seed for layout consistency across re-renders.

4. **Patron Sign-in & Traffic Analytics (`LoginDashboard.js` & `LoginData.js`)**:
   - **College Mapping & Demographic Filtering**: Integrated department mapping (`COLLEGE_MAP`) for real-time demographic breakdowns.
   - **Chart Visualization Upgrades**: Dynamic section utilization bar charts, peak hourly entry graphs, and optimized batch log deletion.

5. **Technical Services & Catalog Encoding (`BookCatalogue.js` & `CardAndPacket.js`)**:
   - **Multi-Book Encoding**: Up to 4 book records encoded within a single packet form.
   - **Encoding & Duplicate Validation**: UTF-8 catalog encoding fixes and accession number uniqueness validation across all 4 packet slots.

---

## 💻 Dependencies & Required Packages

### 1. Frontend Dependencies (React 19 Client)
- **Core Framework**: `react` (v19.1+), `react-dom` (v19.1+), `react-router-dom` (v7.5+)
- **UI Components & Icons**: `@mui/material` (v7.0+), `@mui/icons-material` (v7.0+), `@mui/x-data-grid` (v8.11+), `@emotion/react`, `@emotion/styled`, `@fontsource/poppins`
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
- **Machine Learning & Data Processing**: `scikit-learn`, `pandas`, `joblib`, `openpyxl` (for reading `.xlsx` datasets), `matplotlib`

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
npm install react react-dom react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled @mui/x-data-grid @fontsource/poppins recharts axios moment-timezone xlsx vader-sentiment natural afinn-165 ajv web-vitals firebase

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
pip install flask transformers torch scikit-learn pandas joblib openpyxl matplotlib
```

#### Step 5: (Optional) Retrain ML Category Classifier via Terminal
If expanding survey datasets or manual boundary cases:
```bash
# Navigate to ML pipeline folder
cd backend/ml

# Step 5a: Clean raw Excel dataset (5kwithnoise.xlsx -> clean_category_dataset.csv)
python clean_dataset.py

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
| **Year** | 2026 |

