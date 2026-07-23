# Library Management System Backend & Sentiment Service

**Central Philippine University — College of Computer Studies**  
**Bachelor of Science in Computer Science**  
Capstone Thesis Project — Henry Luce III Library

---

## Overview

This directory contains the backend services for the **Henry Luce III Library Management System**, comprising:
1. **Node.js Express Server (`index.js`)**: Main REST API server on port `5000` connected to SQL Server (`hllSystem`).
2. **Python BERT Sentiment Microservice (`sentiment_service.py`)**: Flask API service on port `5001` running Hugging Face Transformers.

---

## Sentiment Analysis Architecture (`sentiment_service.py`)

The system utilizes a hybrid sentiment classification pipeline combining structured emoji scores and deep learning transformer embeddings:

### Microservice Details
- **File Path**: `backend/sentiment_service.py`
- **Framework**: Python Flask
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest` (Pre-trained BERT / RoBERTa Model)
- **Port**: `5001`
- **Endpoint**: `POST /analyze`
- **Input Payload**: `{ "text": "Library staff are very accommodating" }`
- **Response Payload**: `{ "sentiment": "Positive", "score": 0.982 }`

### Node.js Integration & Fallback (`index.js`)
- `index.js` sends text feedback to `http://localhost:5001/analyze` using `axios`.
- Computes overall sentiment score combining Emoji rating averages ($50\%$) and BERT text sentiment ($50\%$).
- If the Python microservice is offline, the backend catches the error and defaults text sentiment to `Neutral` to keep survey logging active.

---

## Prerequisites & Installation

### 1. Python Environment Setup
Install Python 3.9+ and required machine learning packages:
```bash
pip install flask transformers torch
```

### 2. Node.js Dependencies
Install backend Node packages:
```bash
npm install
```

### 3. Database Connection
Ensure Microsoft SQL Server (`SQLEXPRESS`) is running and update `config` in `index.js`:
```js
connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=YOUR_PC\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
```

---

## Running the Backend Services

1. **Start Python Sentiment Microservice**:
   ```bash
   python sentiment_service.py
   ```
   *Runs on port 5001*

2. **Start Express Node Backend**:
   ```bash
   npm start
   ```
   *Runs on port 5000*
