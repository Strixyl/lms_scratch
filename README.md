# Library Management System with Patron Satisfaction Survey
### Powered by Dual-Engine NLP (RoBERTa BERT Sentiment Analysis & Naïve Bayes Category Classification)

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
**Capstone Thesis Project — Henry Luce III Library**

---

## Overview

This is an enhanced web-based Library Management System developed for the **Henry Luce III Library** of Central Philippine University. The system unifies core library operations — sign-in access monitoring, book card & packet encoding, inventory tracking for supplies and equipment — with an automated feedback analysis module powered by a **Dual-Engine NLP Pipeline** (RoBERTa BERT Sentiment Analysis + Naïve Bayes Category Classification).

---

## 📌 Recent Updates (July 2026)

- **Dual-Engine NLP Architecture**:
  - Combined **RoBERTa BERT** transformer model (`cardiffnlp/twitter-roberta-base-sentiment-latest`) for fine-grained sentiment analysis (`POST /analyze`) with a **Multinomial Naïve Bayes** classifier for category prediction (`POST /categorize`).
  - Implemented confidence threshold fallback ($\tau = 0.45$) for Naïve Bayes categorization to tag low-confidence inputs as `Other/Uncategorized`.
- **Machine Learning Preprocessing & Training (`backend/ml/`)**:
  - `clean_dataset.py`: Cleans raw spreadsheets, dynamically maps text/category/sentiment columns, filters noise/ultra-short responses.
  - `naive_bayes.py`: Encapsulates TF-IDF vectorization and confidence-thresholded classification.
  - `train_category_model.py`: 80/20 stratified split, hyperparameter tuning (`alpha`, `ngram_range`, `min_df`), exports `category_model.pkl` and confusion matrices.
- **Express Backend Parallel Execution**: Updated `backend/index.js` to execute BERT sentiment and Naïve Bayes category calls concurrently using `Promise.all`.
- **SQL Server Database Migration**: Created migration `query/addc_category.sql` adding `Category NVARCHAR(50) NULL` to `dbo.SatisfactionSurveys`.
- **Frontend UI & Dashboard**: Enhanced `SentimentDashboard.js` and `SatisfactionSurveyData.js` with domain filtering, MUI color-coded `CategoryChip` badges (Facilities, Staff, Collection, Other/Uncategorized), Excel exports, and PDF print reports.

---

## System Modules

| Module | Description | Key Files |
|---|---|---|
| **HLL Sign-in Portal** | Tracks patron logins/logouts using student ID lookup, displaying patron info, and logs activity. | `Login.js`, `LoginData.js` |
| **Patron Satisfaction Survey** | A 10-question survey featuring emoji-based ratings and an open-ended feedback comments box. | `SatisfactionSurvey.js`, `SatisfactionSurveyData.js` |
| **Sentiment & Category Dashboard** | Analyzes survey comments using a hybrid dual-engine NLP approach (Emoji Rating + BERT + Naïve Bayes Category Classification). | `SentimentDashboard.js`, `sentiment_service.py` |
| **Book Card & Book Packet** | Encodes, saves, searches, and prints book card packets (supports up to 4 books per record). | `CardAndPacket.js` |
| **Book Catalog** | A flat-list catalog viewer aggregating book data from all card-and-packet records with Excel export. | `BookCatalogue.js` |
| **Supplies Inventory Encoding** | Manages office supplies records (add, update, delete, stock adjustments, section transfers). | `SuppliesEncode.js`, `Supplies.js`, `SendSupply.js` |
| **Equipment Inventory Encoding** | Manages library equipment records (add, update, delete, stock adjustments, section transfers). | `EquipmentEncode.js`, `Equipment.js`, `Sendasset.js` |
| **Transaction History** | Audit log for supply and equipment stock adjustments and transfers. | `SupplyTransactionHistory.js`, `Transactionhistory.js` |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full control — all modules including inventory management and analytics dashboard |
| **Librarian** | Book Card and Packet encoding, inventory editing and viewing, report generation |
| **Standard User** | HLL Sign-in Portal, Patron Satisfaction Survey, inventory viewing only |

---

## Dual-Engine NLP Analysis Approach

The feedback management module processes open-ended responses using a **Dual-Engine NLP Architecture**:

### 1. Python BERT Microservice (`backend/sentiment_service.py`)
- **Model**: Pre-trained Hugging Face transformer model `cardiffnlp/twitter-roberta-base-sentiment-latest`.
- **Process**:
  1. Accepts open-ended survey text via POST request `/analyze`.
  2. Truncates input text to a maximum of 512 tokens.
  3. Classifies text into `Positive`, `Neutral`, or `Negative` sentiment.

### 2. Naïve Bayes Category Classifier (`backend/ml/naive_bayes.py`)
- **Model**: `TfidfVectorizer` + `MultinomialNB` trained pipeline.
- **Process**:
  1. Accepts survey text via POST request `/categorize`.
  2. Calculates class probability distribution across domains (**Facilities**, **Staff**, **Collection**).
  3. Applies confidence threshold fallback ($\tau = 0.45$). Inputs below $\tau$ are categorized as `Other/Uncategorized`.

### 3. Emoji Rating Scoring
- Structured emoji ratings are mapped: Very Satisfied (+1.0), Satisfied (+0.5), Neutral (0.0), Dissatisfied (-0.5), Very Dissatisfied (-1.0).
- Combined score formula:  
  $$\text{Final Score} = (\text{Emoji Rating Avg} \times 0.50) + (\text{BERT Sentiment Score} \times 0.50)$$
- Thresholds: Score $> +0.15 \Rightarrow$ `Positive` | Score $< -0.15 \Rightarrow$ `Negative` | Otherwise $\Rightarrow$ `Neutral`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js v19, Material UI v7 |
| Express Backend | Node.js, Express.js (Port 5000) |
| Sentiment & Categorization Microservice | Python 3.9+, Flask, Hugging Face Transformers, Scikit-learn (Port 5001) |
| Database | Microsoft SQL Server (SQLEXPRESS) |
| Pre-trained NLP Models | `cardiffnlp/twitter-roberta-base-sentiment-latest`, Naïve Bayes Classifier (`category_model.pkl`) |
| Charts & Exports | Recharts, `jspdf`, `xlsx` |
| DB Driver | `mssql`, `msnodesqlv8` |

---

## Database Setup

1. Restore the database from `hllSystem-clean-2.bak` using SQL Server Management Studio (SSMS).
2. Run database migration `query/addc_category.sql` to add the `Category` column:
```sql
USE hllSystem;
GO
ALTER TABLE SatisfactionSurveys ADD Category NVARCHAR(50) NULL;
GO
```

---

## Installation and Setup

### Prerequisites
- Node.js v18+
- Python 3.9+ (with `pip`)
- SQL Server Express (`SQLEXPRESS`)
- ODBC Driver 18 for SQL Server

### Steps

**1. Install frontend dependencies**
```bash
npm install --legacy-peer-deps
```

**2. Install backend Node.js dependencies**
```bash
cd backend
npm install
```

**3. Install Python microservice dependencies**
```bash
pip install flask transformers torch scikit-learn pandas joblib
```

**4. Start the Python ML Microservice (Terminal 1):**
```bash
python backend/sentiment_service.py
```
*Output:* Running on `http://127.0.0.1:5001`

**5. Start the Express Backend (Terminal 2 — inside `backend` folder):**
```bash
cd backend
npm start
```
*Output:* Server running on `http://localhost:5000`

**6. Start the React Frontend (Terminal 3 — root folder):**
```bash
npm start
```
*Output:* React application running on `http://localhost:3000`

---

## Available Routes

| Route | Description |
|---|---|
| `/` | Home / Main Landing Page |
| `/login` | HLL Sign-in Portal (Time In & Time Out Lookup) |
| `/logindata` | Sign-in Records, traffic monitoring logs, and analytics |
| `/satisfaction-survey` | Patron Satisfaction Survey Form |
| `/surveys` | Survey Data Records (All survey submissions and sentiment/category labels) |
| `/sentiment-dashboard` | Dual-Engine Sentiment & Category Analysis Dashboard |
| `/card-and-packet` | Book Card and Packet Encoding Form |
| `/book-catalogue` | Unified Book Catalog flattened list view with Excel exports |
| `/supplies` | View-only Office Supplies Inventory |
| `/equipment` | View-only Library Equipment Inventory |
| `/supplies-encoding` | Office Supplies Encoding Panel (Add/Edit/Delete/Restock) |
| `/equipment-encoding` | Library Equipment Encoding Panel (Add/Edit/Delete/Restock) |
| `/send-supply` | Transfer/Send Office Supplies to specific library sections |
| `/send-asset` | Transfer/Send Library Equipment to specific library sections |
| `/supply-transactions` | Supplies transaction history logs |
| `/transactions` | Equipment transaction history logs |

---

## Thesis Information

| Field | Details |
|---|---|
| **Title** | Library Management System with Patron Satisfaction Survey Using Sentiment Analysis and Naïve Bayes Algorithm |
| **Institution** | Central Philippine University |
| **College** | College of Computer Studies |
| **Library** | Henry Luce III Library |
| **Degree** | Bachelor of Science in Computer Science |
| **Year** | 2026 |

---
