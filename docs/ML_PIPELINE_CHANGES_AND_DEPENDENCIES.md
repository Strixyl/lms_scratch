# Machine Learning Pipeline Improvements & System Dependencies Documentation
### Henry Luce III Library Management System — Central Philippine University

---

## 📌 Executive Summary

This document records technical enhancements made to the **Dual-Engine NLP Categorization and Sentiment Pipeline** within the Henry Luce III Library Management System (`hllsystem`). It details the root cause analysis, algorithm refinements, directory restructuring, and complete software dependency manifests required for deployment.

---

## 🔍 Root Cause Analysis & Recent Improvements

### 1. Singular vs. Plural Inflection Normalization (NLTK `PorterStemmer`)
- **Problem**: Previously, `preprocess()` in `naive_bayes.py` stripped non-alphabetic characters and lowercased input text without word stemming. Consequently, plural variations like `"librarians"` were treated as completely distinct TF-IDF features from `"librarian"`. If the training dataset predominantly contained `"librarian"`, `"librarians"` received zero feature weight, causing feedback like *"The librarians in charge are not helpful"* to lose key domain signals.
- **Fix**: Integrated NLTK `PorterStemmer` into `naive_bayes.py`:
  ```python
  from nltk.stem import PorterStemmer

  _stemmer = PorterStemmer()

  def preprocess(text: str) -> str:
      if text is None:
          return ""
      text = str(text).lower()
      text = re.sub(r"http\S+|www\.\S+", " ", text)
      text = re.sub(r"[^a-z\s]", " ", text)
      tokens = text.split()
      stemmed = [_stemmer.stem(w) for w in tokens]
      return " ".join(stemmed)
  ```

### 2. Domain Keyword Fallback Rules
- **Problem**: When a patron's comment contained strong domain terms (e.g., `"librarian"`, `"wifi"`, `"aircon"`, `"textbook"`) but also generic noise words, the Naïve Bayes probability distribution across 4 classes could dip below the fallback threshold, incorrectly assigning the comment to `Other/Uncategorized`.
- **Fix**: Implemented a domain-specific dictionary (`DOMAIN_KEYWORDS`) within `predict_with_fallback()`. If model confidence falls below threshold $\tau = 0.40$, text is checked against domain keyword sets before defaulting to `Other/Uncategorized`:
  - **Staff**: `librarian`, `librarians`, `staff`, `personnel`, `guard`, `guards`, `assistant`, `attendant`, `cashier`, `admin`
  - **Facilities**: `wifi`, `aircon`, `ac`, `restroom`, `restrooms`, `toilet`, `toilets`, `elevator`, `socket`, `outlet`, `lighting`, `ventilation`
  - **Collection**: `book`, `books`, `textbook`, `textbooks`, `journal`, `journals`, `thesis`, `catalog`, `ebook`, `periodical`

### 3. Training Directory & Dataset Path Alignment
- **Problem**: Originally, `clean_dataset.py` exported the cleaned CSV to `data/train/clean_category_dataset.csv`, while `train_category_model.py` attempted to load `manual_boundary_cases.csv` from missing nested directories.
- **Fix**: Consolidated all dataset paths:
  - Cleaned dataset exported directly to: `backend/ml/data/clean_category_dataset.csv`
  - Boundary cases loaded from: `backend/ml/manual_boundary_cases.csv` (116 hand-curated edge cases)
  - Removed legacy nested `backend/ml/data/train/` directory.

### 4. Calibrated Confidence Fallback Threshold
- **Adjustment**: Tuned default confidence threshold $\tau$ from `0.45` to `0.40`. For a 4-class classification problem (Facilities, Staff, Collection, Other/Uncategorized), 25% represents uniform chance. A 40% threshold provides optimal precision while preventing legitimate domain comments from falling into `Other/Uncategorized`.

---

## 🛠️ Complete Installation & Dependency Guide

### 1. Python Environment Dependencies (`backend/ml/` & `backend/sentiment_service.py`)

#### Installation Command:
```bash
pip install flask transformers torch scikit-learn pandas joblib openpyxl nltk clean-text pyspellchecker matplotlib
```

#### Detailed Package Roles:
| Package Name | Purpose / Function |
|---|---|
| `flask` | Lightweight REST API framework running the sentiment & categorization microservice on Port 5001. |
| `transformers` | Hugging Face Transformers library loading pre-trained BERT models. |
| `torch` | PyTorch deep learning backend executing `cardiffnlp/twitter-roberta-base-sentiment-latest`. |
| `scikit-learn` | Implements `TfidfVectorizer`, `MultinomialNB`, `Pipeline`, and cross-validation grid search. |
| `pandas` | Ingests, manipulates, and exports tabular survey dataset files (`.xlsx` and `.csv`). |
| `joblib` | Serializes and deserializes the trained classifier model (`category_model.pkl`). |
| `nltk` | Provides `PorterStemmer` for stemming words to their canonical root forms. |
| `clean-text` | Normalizes text noise, fixes mojibake, strips URLs, emails, phone numbers, and emojis. |
| `pyspellchecker` | Identifies gibberish, typos, and keyboard mashing during dataset sanitization. |
| `openpyxl` | Enables `pandas` to read raw Excel workbook files (`5kcatdataset.xlsx`). |

---

### 2. Express Backend Dependencies (`backend/package.json`)

#### Installation Command:
```bash
cd backend
npm install express cors mssql msnodesqlv8 tedious multer axios moment-timezone natural vader-sentiment afinn-165
```

#### Detailed Package Roles:
| Package Name | Purpose / Function |
|---|---|
| `express` | Main web server framework running on Port 5000. |
| `cors` | Enables Cross-Origin Resource Sharing for React frontend client requests. |
| `mssql` / `msnodesqlv8` / `tedious` | Microsoft SQL Server database drivers and connection pooling. |
| `multer` | Handles file uploads and multipart form data encoding. |
| `axios` | Performs HTTP calls to the Python Flask microservice on Port 5001. |
| `moment-timezone` | Formats and converts dates/timestamps in Philippine Standard Time (PST). |
| `natural` / `vader-sentiment` / `afinn-165` | Node.js text processing and secondary sentiment utilities. |

---

### 3. React Frontend Dependencies (Root `package.json`)

#### Installation Command:
```bash
npm install react react-dom react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled @mui/x-data-grid @fontsource/poppins recharts axios moment-timezone xlsx vader-sentiment natural afinn-165 ajv web-vitals
npm install react-wordcloud --legacy-peer-deps
```

---

## 🚀 Execution & Verification Workflow

1. **Clean Raw Dataset**:
   ```bash
   python backend/ml/clean_dataset.py
   ```
   *Output*: Generates cleaned dataset at `backend/ml/data/clean_category_dataset.csv`.

2. **Train Category Classifier**:
   ```bash
   python backend/ml/train_category_model.py
   ```
   *Output*: Merges 116 manual boundary cases, performs grid search over 56 combinations, and saves model to `backend/ml/category_model.pkl`.

3. **Launch Python NLP Microservice**:
   ```bash
   python backend/sentiment_service.py
   ```
   *Output*: Service listening on `http://127.0.0.1:5001`.

4. **Verify Category Prediction**:
   ```bash
   curl -X POST http://localhost:5001/categorize -H "Content-Type: application/json" -d "{\"text\": \"The librarians in charge are not helpful\"}"
   ```
   *Expected Response*:
   ```json
   {
     "category": "Staff",
     "confidence": 0.6833567820379158
   }
   ```
