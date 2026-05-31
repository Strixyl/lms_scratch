# Library Management System with Patron Satisfaction Survey
### Using Sentiment Analysis and Naïve Bayes Algorithm

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
Capstone Thesis Project — Henry Luce III Library

---

## Overview

This is an enhanced web-based Library Management System developed for the **Henry Luce III Library** of Central Philippine University. The system was originally built as a Library Management System by a former IT student and has been improved by integrating additional modules and a **Patron Satisfaction Survey** with automated feedback analysis using **VADER Sentiment Analysis** and **Naïve Bayes classification** through a **TF-IDF-based NLP pipeline**.

The system unifies all core library operations — sign-in monitoring, book management, inventory tracking, and patron satisfaction analysis — into a single centralized platform.

---

## System Modules

| Module | Description |
|---|---|
| **HLL Sign-in Portal** | Tracks patron login and logout using student ID lookup, displays patron image, activity logs, traffic monitoring, and report generation |
| **Patron Satisfaction Survey** | 10-question survey with emoji-based ratings and open-ended feedback text box |
| **Sentiment Analysis Dashboard** | Automatically classifies open-ended feedback as Positive, Neutral, or Negative using VADER and Naïve Bayes |
| **Book Card and Book Packet** | Encodes, stores, and retrieves book details with a centralized database; supports save, update, clear, search, and print |
| **Inventory Module** | Two separate inventories for office supplies and library equipment with full item details |
| **Report Generation** | Generates real-time and operational reports for sign-in records and survey results, exportable as PDF or Excel |
| **Admin Dashboard** | Account management for role-based user accounts (Admin, Librarian, Standard User) |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full control — all modules including Admin Dashboard and Account Management |
| **Librarian** | Book Card and Packet encoding, inventory editing and viewing, report generation |
| **Standard User** | HLL Sign-in Portal, Patron Satisfaction Survey, inventory viewing only |

---

## Sentiment Analysis Approach

The sentiment analysis module processes the open-ended feedback submitted through the Patron Satisfaction Survey using a two-layer NLP pipeline:

### Layer 1 — VADER Sentiment Analysis
VADER (Valence Aware Dictionary and sEntiment Reasoner) is a lexicon-based tool that assigns a compound sentiment score to each feedback entry and classifies it as **Positive**, **Negative**, or **Neutral**. It requires no training data and handles informal text well, making it suitable for short survey responses.

### Layer 2 — Naïve Bayes Classification
The Naïve Bayes classifier is trained on a labeled dataset of patron feedback comments to classify each response as **Positive**, **Negative**, or **Neutral** based on learned word patterns. TF-IDF (Term Frequency-Inverse Document Frequency) vectorization is applied to convert the raw text into numerical representations before classification.

### Combined Output
Both VADER and Naïve Bayes are applied to the same open-ended comment. Their outputs are displayed on the Sentiment Dashboard alongside word frequency analysis showing the most commonly mentioned topics across all patron responses.

**Final Labels:** `Positive` | `Neutral` | `Negative`

---

## Emoji Rating Scoring

The 10 emoji survey responses are mapped to numeric scores and averaged for the structured rating component:

| Emoji | Label | Score |
|---|---|---|
| 🤩 | Very Satisfied | +1.0 |
| 😍 | Satisfied | +0.5 |
| 😐 | Neutral | 0.0 |
| 😠 | Dissatisfied | -0.5 |
| 😡 | Very Dissatisfied | -1.0 |
| ❌ | N/A | excluded |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js v19, Material UI v7 |
| Backend | Node.js, Express.js |
| Database | Microsoft SQL Server (SQLEXPRESS) |
| Sentiment Analysis | VADER + Naïve Bayes + TF-IDF |
| Charts | Recharts |
| DB Driver | `mssql`, `msnodesqlv8` |
| ML Library | `natural`, `vader-sentiment` |

---

## Database Setup

1. Restore the provided `.bak` file using SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance (e.g. `YOUR_PC\SQLEXPRESS`)
3. Run the following in SSMS to ensure the required columns exist:

```sql
ALTER TABLE SatisfactionSurveys
ADD SentimentResult NVARCHAR(50)
```

---

## Installation and Setup

### Prerequisites
- Node.js
- SQL Server Express (SQLEXPRESS)
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

**3. Install backend dependencies**
```bash
cd backend
npm install
```

**4. Install sentiment analysis packages (inside backend folder)**
```bash
npm install natural
npm install vader-sentiment
```

**5. Update the database connection string in `backend/index.js`:**
```js
connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=YOUR_PC\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
```

**6. Run the backend (Terminal 1 — inside backend folder):**
```bash
npm start
```
You should see:
```
🚀 Server running on http://0.0.0.0:5000
✅ Connected to SQL Server
```

**7. Run the frontend (Terminal 2 — root folder):**
```bash
npm start
```

**8. Open your browser:**
```
http://localhost:3000
```

---

## Available Routes

| Route | Description |
|---|---|
| `/` | Home |
| `/login` | HLL Sign-in Portal |
| `/logindata` | Sign-in Records and Report Generation |
| `/satisfaction-survey` | Patron Satisfaction Survey Form |
| `/surveys` | Survey Data Records |
| `/sentiment-dashboard` | Sentiment Analysis Dashboard |
| `/book-card` | Book Card and Book Packet |
| `/inventory` | Office Supplies and Equipment Inventory |
| `/admin` | Admin Dashboard and Account Management |

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
- Sentiment analysis supports **English-language feedback only** — local languages are not supported
- The accuracy of the Naïve Bayes classifier depends on the quality and volume of the labeled training data collected during development
- The system does not cover financial transactions, procurement, or operations outside of library management

---

## Notes

- Always run VS Code as **Administrator** to allow SQL Server connections
- Use `--legacy-peer-deps` when installing new npm packages to avoid dependency conflicts
- Both terminals (frontend + backend) must be running at the same time for the system to work
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`

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

