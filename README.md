# Library Management System with Patron Satisfaction Survey
### Using Sentiment Analysis with BERT Transformer Model

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
Capstone Thesis Project — Henry Luce III Library

---

## Overview

This is an enhanced web-based Library Management System developed for the **Henry Luce III Library** of Central Philippine University. The system was originally built as a Library Management System by a former IT student and has been improved by integrating additional modules and a **Patron Satisfaction Survey** with automated feedback analysis using a pre-trained **BERT (RoBERTa)** model via a Python Flask microservice combined with structured emoji ratings.

The system unifies all core library operations — sign-in monitoring, book management, inventory tracking, and patron satisfaction analysis — into a single centralized platform.

---

## System Modules

| Module | Description | Pages / Files |
|---|---|---|
| **HLL Sign-in Portal** | Tracks patron logins/logouts using student ID lookup, displaying patron info, and logs activity. | `Login.js`, `LoginData.js` |
| **Patron Satisfaction Survey** | A 10-question survey featuring emoji-based ratings and an open-ended feedback comments box. | `SatisfactionSurvey.js`, `SatisfactionSurveyData.js` |
| **Sentiment Analysis Dashboard** | Analyzes survey comments using a hybrid NLP approach (50% Emoji Rating + 50% BERT Transformer model) with emoji metrics. | `SentimentDashboard.js`, `sentiment_service.py` |
| **Book Card & Book Packet** | Encodes, saves, searches, and prints book card packets (supports up to 4 books per record). | `CardAndPacket.js` |
| **Book Catalog** | A flat-list catalog viewer aggregating book data from all card-and-packet records with Excel export. | `BookCatalogue.js` |
| **Supplies Inventory Encoding** | Manages office supplies records (add, update, delete, pagination, and search filter). | `SuppliesEncode.js`, `Supplies.js` |
| **Equipment Inventory Encoding** | Manages library equipment records (add, update, delete, pagination, and search filter). | `EquipmentEncode.js`, `Equipment.js` |
| **Office Supplies Transfer** | Safe transaction-based stock transfer to library sections with remaining stock limits. | `SendSupply.js`, `SupplyTransactionHistory.js` |
| **Library Equipment Transfer** | Safe transaction-based stock transfer to library sections with remaining stock limits. | `Sendasset.js`, `Transactionhistory.js` |
| **Admin Dashboard** | Handles user role credentials and session management. | Not built (RBAC in localStorage) |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full control — all modules including Admin Dashboard and Account Management |
| **Librarian** | Book Card and Packet encoding, inventory editing and viewing, report generation |
| **Standard User** | HLL Sign-in Portal, Patron Satisfaction Survey, inventory viewing only |

---

## Sentiment Analysis Approach

The sentiment analysis module processes the open-ended feedback submitted through the Patron Satisfaction Survey using a **Hybrid NLP Architecture**:

### 1. Python BERT Microservice (`backend/sentiment_service.py`)
- **Model**: Pre-trained Hugging Face transformer model `cardiffnlp/twitter-roberta-base-sentiment-latest`.
- **Framework**: Python Flask API running on port `5001`.
- **Process**:
  1. Accepts open-ended survey text via POST request `/analyze`.
  2. Truncates input text to a maximum of 512 tokens.
  3. Classifies text into `Positive`, `Neutral`, or `Negative` sentiment based on transformer embeddings and classification heads.
  4. Express backend calls this endpoint via `axios` in `backend/index.js`.

### 2. Emoji Rating Scoring
The 10 emoji survey responses are mapped to numeric scores and averaged for the structured rating component:

| Emoji | Label | Score |
|---|---|---|
| 🤩 | Very Satisfied | +1.0 |
| 😍 | Satisfied | +0.5 |
| 😐 | Neutral | 0.0 |
| 😠 | Dissatisfied | -0.5 |
| 😡 | Very Dissatisfied | -1.0 |
| ❌ | N/A | Excluded |

### 3. Hybrid Combined Output & Resilience
- **Combined Score Formula**:  
  $$\text{Score} = (\text{Emoji Rating Avg} \times 0.50) + (\text{BERT Sentiment Score} \times 0.50)$$
- **Thresholds**: Score $> +0.15$ ➔ `Positive` | Score $< -0.15$ ➔ `Negative` | Otherwise ➔ `Neutral`.
- **Fallback Guard**: If the Python sentiment service is offline or unreachable, the system gracefully defaults text sentiment to `Neutral` without disrupting survey submissions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js v19, Material UI v7 |
| Express Backend | Node.js, Express.js (Port 5000) |
| Sentiment Service | Python 3.9+, Flask, Hugging Face Transformers (Port 5001) |
| Database | Microsoft SQL Server (SQLEXPRESS) |
| Pre-trained NLP Model | `cardiffnlp/twitter-roberta-base-sentiment-latest` (BERT/RoBERTa) |
| Charts | Recharts |
| DB Driver | `mssql`, `msnodesqlv8` |
| HTTP Client | `axios` |

---

## Database Setup

1. Restore the database from the provided backup file `hllSystem-clean-2.bak` using SQL Server Management Studio (SSMS) to initialize the core tables (`studInfo`, `studCollege`, `studCourse`, `courseToCollege`).
2. Run the following queries in SSMS against the `hllSystem` database to ensure the required columns and new tables exist:

```sql
-- 1. Alter SatisfactionSurveys table to include SentimentResult column
ALTER TABLE SatisfactionSurveys
ADD SentimentResult NVARCHAR(50);

-- 2. Create OfficeSupplies Table (ControlNumber dropped per instructions)
CREATE TABLE OfficeSupplies (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  ItemName NVARCHAR(200) NOT NULL,
  Description NVARCHAR(500),
  Brand NVARCHAR(100),
  Quantity INT DEFAULT 0,
  Status NVARCHAR(50),
  Condition NVARCHAR(100),
  Location NVARCHAR(200),
  Specifications NVARCHAR(500),
  DateAdded DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME
);

-- 3. Create LibraryEquipment Table
CREATE TABLE LibraryEquipment (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  ItemName NVARCHAR(200) NOT NULL,
  Description NVARCHAR(500),
  Brand NVARCHAR(100),
  Quantity INT DEFAULT 0,
  Status NVARCHAR(50),
  SerialNumber NVARCHAR(100),
  Condition NVARCHAR(100),
  Location NVARCHAR(200),
  Specifications NVARCHAR(500),
  DateAdded DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME
);

-- 4. Create CardAndPacket Table for Book Cards & Packets
CREATE TABLE CardAndPacket (
  CardID INT IDENTITY(1,1) PRIMARY KEY,
  selectedLibrary1 NVARCHAR(100), section1 NVARCHAR(100),
  selectedLibrary2 NVARCHAR(100), section2 NVARCHAR(100),
  selectedLibrary3 NVARCHAR(100), section3 NVARCHAR(100),
  selectedLibrary4 NVARCHAR(100), section4 NVARCHAR(100),
  authorName1 NVARCHAR(250), publisherAuthor1 NVARCHAR(200),
  authorName2 NVARCHAR(250), publisherAuthor2 NVARCHAR(200),
  authorName3 NVARCHAR(250), publisherAuthor3 NVARCHAR(200),
  authorName4 NVARCHAR(250), publisherAuthor4 NVARCHAR(200),
  bookTitle1 NVARCHAR(500), bookTitle2 NVARCHAR(500), bookTitle3 NVARCHAR(500), bookTitle4 NVARCHAR(500),
  accessionNumber1 NVARCHAR(100), accessionNumber2 NVARCHAR(100), accessionNumber3 NVARCHAR(100), accessionNumber4 NVARCHAR(100),
  callNumber1 NVARCHAR(100), callNumber2 NVARCHAR(100), callNumber3 NVARCHAR(100), callNumber4 NVARCHAR(100),
  copyNumber1 NVARCHAR(10), copyNumber2 NVARCHAR(10), copyNumber3 NVARCHAR(10), copyNumber4 NVARCHAR(10),
  barcodeValue1 NVARCHAR(100), barcodeValue2 NVARCHAR(100), barcodeValue3 NVARCHAR(100), barcodeValue4 NVARCHAR(100),
  isoCodeValue1 NVARCHAR(200), isoCodeValue2 NVARCHAR(200), isoCodeValue3 NVARCHAR(200), isoCodeValue4 NVARCHAR(200),
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME
);

-- 5. Create SupplyTransactions Table for office supply transaction logging
CREATE TABLE SupplyTransactions (
  TransactionId     INT IDENTITY(1,1) PRIMARY KEY,
  SupplyId          INT NULL,                          -- Soft reference to OfficeSupplies.Id
  ActionType        NVARCHAR(50)  NOT NULL,            -- e.g., 'ADD', 'SEND', 'DELETE', 'UPDATE'
  QuantityChanged   INT           NOT NULL,
  PreviousQuantity  INT           NOT NULL,
  NewQuantity       INT           NOT NULL,
  DestinationSection NVARCHAR(100) NULL,             -- Library section where supply was transferred
  Remarks           NVARCHAR(500) NULL,
  CreatedBy         NVARCHAR(100) NULL,
  CreatedAt         DATETIME      NOT NULL DEFAULT GETDATE()
);

-- 6. Create AssetTransactions Table for library equipment transaction logging
CREATE TABLE AssetTransactions (
  TransactionId     INT IDENTITY(1,1) PRIMARY KEY,
  AssetId           INT NULL,                          -- Soft reference to LibraryEquipment.Id
  ActionType        NVARCHAR(50)  NOT NULL,            -- e.g., 'ADD', 'SEND', 'DELETE', 'UPDATE'
  QuantityChanged   INT           NOT NULL,
  PreviousQuantity  INT           NOT NULL,
  NewQuantity       INT           NOT NULL,
  DestinationSection NVARCHAR(100) NULL,             -- Library section where asset was transferred
  Remarks           NVARCHAR(500) NULL,
  CreatedBy         NVARCHAR(100) NULL,
  CreatedAt         DATETIME      NOT NULL DEFAULT GETDATE()
);

-- 7. Create Brands Master Table
CREATE TABLE Brands (
  BrandId INT IDENTITY(1,1) PRIMARY KEY,
  BrandName NVARCHAR(150) NOT NULL UNIQUE
);

-- 8. Create Sections Master Table
CREATE TABLE Sections (
  SectionId INT IDENTITY(1,1) PRIMARY KEY,
  SectionName NVARCHAR(150) NOT NULL UNIQUE
);
```

---

## Installation and Setup

### Prerequisites
- Node.js v18+
- Python 3.9+ (with `pip`)
- SQL Server Express (`SQLEXPRESS`)
- ODBC Driver 18 for SQL Server
- SQL Server Management Studio (SSMS)

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/Strixyl/lms_scratch.git
cd lms_scratch
```

**2. Install frontend dependencies**
```bash
npm install --legacy-peer-deps
```

**3. Install backend Node.js dependencies**
```bash
cd backend
npm install
```

**4. Install Python microservice dependencies**
```bash
pip install flask transformers torch
```

**5. Update the database connection string in `backend/index.js`:**
```js
connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=YOUR_PC\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
```

**6. Start the Python Sentiment Microservice (Terminal 1):**
```bash
python backend/sentiment_service.py
```
*Output:* Running on `http://127.0.0.1:5001`

**7. Start the Express Backend (Terminal 2 — inside `backend` folder):**
```bash
npm start
```
*Output:* Server running on `http://0.0.0.0:5000`

**8. Start the React Frontend (Terminal 3 — root folder):**
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
| `/surveys` | Survey Data Records (All survey submissions and sentiment labels) |
| `/sentiment-dashboard` | Sentiment Analysis Dashboard and Metrics |
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

## Specific Objectives

1. To develop a centralized library management module that integrates sign-in, book management, inventory tracking, and survey management functionalities into a unified system.
2. To design a patron access monitoring and reporting module for managing user sign-in, guest access recording, activity logs, traffic monitoring, and report generation.
3. To develop a book card and packet management module with centralized database storage to enable efficient record management, retrieval, and persistent data storage.
4. To design an inventory tracking and asset management module for monitoring office supplies and library computer equipment.
5. To develop a survey sentiment analysis and feedback management module that utilizes automated sentiment analysis for interpreting patron feedback, identifying service improvement areas, and measuring user satisfaction.
6. To develop a report generation and analytics module for generating real-time and operational reports.

---

## Scope and Limitations

- The system is limited to the library operations of **Henry Luce III Library** only
- Sentiment analysis supports **English-language feedback** processed via pre-trained BERT transformer models
- The system does not cover financial transactions, procurement, or operations outside of library management

---

## Notes

- Always run VS Code as **Administrator** to allow SQL Server connections
- Use `--legacy-peer-deps` when installing new npm packages to avoid dependency conflicts
- Three terminal instances (Python sentiment service, Express backend, React frontend) should run concurrently
- Python Sentiment Service runs on `http://localhost:5001`
- Express Backend runs on `http://localhost:5000`
- React Frontend runs on `http://localhost:3000`

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
