# Henry Luce III Library Management System
### with Patron Satisfaction Survey using Sentiment Analysis and Naïve Bayes Algorithm

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
Capstone Thesis Project

---

## Overview

This is an enhanced Library Management System developed for the **Henry Luce III Library** of Central Philippine University. The system was originally built as a Library Management System and has been enhanced by integrating a **Patron Satisfaction Survey module** with **Sentiment Analysis** using **VADER**, **Naïve Bayes classification**, and **AFINN** word-level scoring.

---

## Features

- **Library Login Monitoring** — Tracks patron time-in and time-out using student ID lookup
- **Patron Satisfaction Survey** — 10-question survey with emoji-based ratings and open-ended feedback
- **Sentiment Analysis** — Automatically classifies survey responses as Positive, Neutral, or Negative using three combined algorithms:
  - **VADER** — sentence-level sentiment scoring
  - **Naïve Bayes** — text classification based on trained examples
  - **AFINN** — word-level sentiment scoring
- **Separate Sentiment Measures** — Emoji ratings and text comments are analyzed independently then combined equally (50/50)
- **Sentiment Dashboard** — Visual dashboard with summary cards, donut chart distribution, and paginated response review table
- **Survey Data Page** — View and filter all submitted survey records
- **Role-based Access Control** — Admin, Librarian, and Standard User roles

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js v19, Material UI v7 |
| Backend | Node.js, Express.js |
| Database | Microsoft SQL Server (SQLEXPRESS) |
| Sentiment Analysis | VADER + Naïve Bayes + AFINN |
| Charts | Recharts |
| DB Driver | `mssql`, `msnodesqlv8` |

---

## Sentiment Analysis Approach

The sentiment analysis module uses three combined signals split into two independent measures:

### Measure 1 — Emoji Ratings
The 10 emoji responses (Very Satisfied → Very Dissatisfied) are mapped to numeric scores and averaged:
- Very Satisfied = +1.0
- Satisfied = +0.5
- Neutral = 0.0
- Dissatisfied = -0.5
- Very Dissatisfied = -1.0

### Measure 2 — Text Comment (VADER + Naïve Bayes + AFINN)
The open-ended message is analyzed using three algorithms:
- **VADER (40%)** — analyzes sentiment polarity of the full sentence
- **Naïve Bayes (35%)** — classifies text based on trained labeled examples
- **AFINN (25%)** — assigns numeric scores to individual words

### Final Overall Sentiment
Both measures are combined with **equal weight (50/50)**:
> Overall = Emoji Score (50%) + Text Score (50%)

**Final Labels:** `Positive` | `Neutral` | `Negative`

---

## Database Setup

1. Restore the provided `.bak` file using SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance (e.g. `YOUR_PC\SQLEXPRESS`)
3. Run the following in SSMS to add the required sentiment column:

```sql
ALTER TABLE SatisfactionSurveys
ADD SentimentResult NVARCHAR(50)
```

---

## Installation & Setup

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
npm install afinn-165
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
| `/login` | Library Login / Logout |
| `/logindata` | Login Records |
| `/satisfaction-survey` | Patron Satisfaction Survey Form |
| `/surveys` | Survey Data Records |
| `/sentiment-dashboard` | Sentiment Analysis Dashboard |

---

## Notes

- Always run VS Code as **Administrator** to allow SQL Server connections
- Use `--legacy-peer-deps` when installing new npm packages to avoid dependency conflicts
- Both terminals (frontend + backend) must be running at the same time for the system to work

---

## Thesis Information

- **Title:** An Enhanced Library Management System with Patron Satisfaction Survey using Sentiment Analysis and Naïve Bayes Algorithm
- **Institution:** Central Philippine University
- **Library:** Henry Luce III Library
- **Degree:** Bachelor of Science in Computer Science

---
