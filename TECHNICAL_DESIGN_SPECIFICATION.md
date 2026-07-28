# SYSTEM TECHNICAL DESIGN SPECIFICATION & THESIS METHODOLOGY DOCUMENTATION
**Project Title**: Library Management System with Patron Satisfaction Survey Using Dual-Engine Sentiment Analysis and Naïve Bayes Algorithm  
**Institution**: Central Philippine University — College of Computer Studies  
**Degree Program**: Bachelor of Science in Computer Science  
**Target Organization**: Henry Luce III Library  
**Target Environment**: NotebookLM Technical Knowledge Base & Capstone Defense Specification  
**System Architecture**: React.js (Frontend), Node.js/Express (Backend), Python Flask (NLP Microservice), MS SQL Server (Database)

---

## SECTION 1: PURPOSE & OVERVIEW

### 1.1 Module Inventory & Target File Paths
The system's feedback analysis and machine learning infrastructure consists of the following core modules:

1. **Dataset Cleaning & Preprocessing Pipeline**: `backend/ml/clean_dataset.py`
2. **Naïve Bayes Algorithm & Classifier Class**: `backend/ml/naive_bayes.py`
3. **Model Hyperparameter Tuning & Training Pipeline**: `backend/ml/train_category_model.py`
4. **Exported Model Binary**: `backend/ml/category_model.pkl`
5. **Python NLP REST Microservice**: `backend/sentiment_service.py` (Port 5001)
6. **Express API Backend Service**: `backend/index.js` (Port 5000)
7. **Frontend Sentiment & Category Analytics Dashboard**: `src/pages/SentimentDashboard.js` (Port 3000)

### 1.2 High-Level System Purpose & Problem Solved
Traditional library satisfaction surveys rely strictly on Likert-scale emoji ratings, which offer quantitative averages but fail to explain **why** patrons are satisfied or dissatisfied. Conversely, open-ended text feedback yields rich qualitative insights but is time-consuming for library administrators to read, categorize, and quantify manually.

This system solves these issues by establishing an automated **Dual-Engine NLP Pipeline**. The architecture combines:
- Quantitative Likert Emoji Ratings ($50\%$ weight).
- Fine-grained transformer-based sentiment analysis using **RoBERTa BERT** ($50\%$ weight).
- Domain-specific topic classification via **Multinomial Naïve Bayes** to automatically categorize open feedback into **Facilities**, **Staff**, **Collection**, or **Other/Uncategorized**.

### 1.3 Primary System Objectives & Design Principles
1. **Hybrid Sentiment Scoring**: Fuses Likert emoji averages with BERT text sentiment to compute a unified numeric sentiment score $\in [-1.0, +1.0]$.
2. **Confidence-Gated Categorization**: Employs a strict confidence threshold ($\tau = 0.45$) on Naïve Bayes predictions. Any text input producing top-class probability below $45\%$ is routed to `Other/Uncategorized` to prevent false positive domain assignments.
3. **Deterministic & Auditable Recommendations**: Replaces unpredictable LLM text generation with an explainable, rule-based recommendation engine tied directly to category dissatisfaction thresholds ($\ge 30\%$ moderate concern, $\ge 50\%$ high concern).
4. **Empirical Evidence Anchoring**: Pairs rule-based recommendation texts with **Option A (Keyword Frequency Signals)** and **Option B (Raw Patron Supporting Evidence)**.

---

## SECTION 2: HOW THE SYSTEM WORKS (STEP-BY-STEP WORKFLOW)

```
[Raw Excel Dataset: dataset_5k_wnoise.xlsx (5,000 samples)]
                          │
                          ▼
              [clean_dataset.py Pipeline]
   (Column Detection -> Noise Removal -> Character Length Filter)
                          │
                          ▼
            [clean_category_dataset.csv (~4,800 samples)]
                          │
                          ▼
          [train_category_model.py Pipeline]
   (80/20 Stratified Split -> Grid Search -> TF-IDF Vectorizer)
                          │
                          ▼
                [category_model.pkl]
                          │
                          ▼
      [sentiment_service.py Startup (Flask Port 5001)]
 (Loads HuggingFace RoBERTa BERT + category_model.pkl into Memory)
                          │
                          ▼
 [Patron Survey Submitted on React Frontend (SatisfactionSurvey.js)]
                          │
                          ▼
  [Express API: POST /api/survey (backend/index.js Port 5000)]
                          │
                          ▼
    ┌─────────────────────┴─────────────────────┐
    ▼                                           ▼
[POST http://localhost:5001/analyze]   [POST http://localhost:5001/categorize]
(RoBERTa BERT Sentiment: Pos/Neu/Neg)  (Naïve Bayes Category with Fallback τ=0.45)
    │                                           │
    └─────────────────────┬─────────────────────┘
                          ▼
      [Calculates Blended Score: SentimentScore]
                          │
                          ▼
   [Persists to MSSQL Table: dbo.SatisfactionSurveys]
 (SentimentResult, Category, SentimentScore, Questions 1..10)
                          │
                          ▼
     [React Dashboard: SentimentDashboard.js (Port 3000)]
  (Computes 8 Panelist Requirements & Visualizes Real-time Analytics)
```

### 2.1 Machine Learning Data Preparation (`clean_dataset.py`)
1. **Ingestion**: Reads the 5,000-sample raw spreadsheet `dataset_5k_wnoise.xlsx` using `pandas`.
2. **Dynamic Column Normalization**: Automatically detects comment text, category labels, and sentiment ratings across varying column header naming schemes using regular expression candidate matching.
3. **Non-Informative Noise Filtering**: Removes uninformative, single-word, or garbage survey responses (e.g., `"none"`, `"n/a"`, `"ok"`, `"good"`, `"asdf"`, `"wala"`, `"test"`).
4. **Length Validation**: Filters out any response with length $< 3$ characters.
5. **Output**: Writes sanitized training data to `backend/ml/data/clean_category_dataset.csv`.

### 2.2 Model Training & Optimization (`train_category_model.py`)
1. **Stratified Split**: Divides the cleaned dataset into an $80\%$ Training Set and $20\%$ Validation Set while maintaining target class distributions.
2. **Hyperparameter Grid Search**: Sweeps hyperparameter combinations:
   - Smoothing parameter $\alpha \in \{0.01, 0.1, 0.5, 1.0, 1.5, 2.0, 5.0\}$
   - N-gram range $\in \{(1, 1), (1, 2)\}$ (unigrams and bigrams)
   - Minimum document frequency $\text{min\_df} \in \{1, 2\}$
3. **Model Fit & Evaluation**: Fits `CategoryClassifier` (`TfidfVectorizer` + `MultinomialNB`), evaluates validation accuracy, and generates confusion matrix reports.
4. **Artifact Serialization**: Exports the optimized pipeline object to `backend/ml/category_model.pkl`.

### 2.3 Microservice Initialization (`sentiment_service.py`)
On startup, the Flask microservice running on port 5001 initializes two parallel engines:
1. **BERT Sentiment Engine**: Loads the Hugging Face transformer model `cardiffnlp/twitter-roberta-base-sentiment-latest` via `pipeline("sentiment-analysis")`.
2. **Naïve Bayes Category Engine**: Unpickles `category_model.pkl` using `joblib.load()`.
3. **Endpoint Routing**:
   - `POST /analyze`: Accepts text payload `{"text": "..."}`, truncates input to 512 tokens, and returns predicted BERT sentiment (`Positive`, `Neutral`, `Negative`) with confidence.
   - `POST /categorize`: Accepts text payload `{"text": "..."}`, executes `predict_with_fallback(text, threshold=0.45)`, and returns category (`Facilities`, `Staff`, `Collection`, or `Other/Uncategorized`).

### 2.4 Survey Ingestion & Blended Scoring (`backend/index.js`)
When a patron completes a survey form:
1. Express backend receives the 10 Likert responses ($Q_1 \dots Q_{10}$) and open text `Message`.
2. If `Message` is non-empty, Express issues concurrent POST calls to `/analyze` and `/categorize` using `Promise.all()`.
3. Computes `RatingAvg` from Likert answers and combines it with `BERTScore` ($50\% / 50\%$).
4. Determines final `SentimentResult` (`Positive`, `Neutral`, `Negative`) and saves `Category`, `SentimentResult`, and numeric `SentimentScore` into MSSQL table `SatisfactionSurveys`.

---

## SECTION 3: MATHEMATICAL FORMULATIONS & EQUATIONS FOR THESIS PAPER

### 3.1 TF-IDF Feature Extraction Math
For a given comment document $d$ within the corpus dataset $D$:

$$\text{TF}(t, d) = \frac{f_{t,d}}{\sum_{t' \in d} f_{t',d}}$$

$$\text{IDF}(t, D) = \log\left(\frac{|D|}{|\{d \in D : t \in d\}|}\right) + 1$$

$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)$$

*Where $f_{t,d}$ represents the raw frequency count of term $t$ in comment $d$, and $|D|$ represents the total number of documents in the dataset.*

---

### 3.2 Multinomial Naïve Bayes Classification with Laplace Smoothing
Given a TF-IDF feature vector $\mathbf{x} = (x_1, x_2, \dots, x_n)$ representing normalized word weights:

$$P(C_k \mid \mathbf{x}) \propto P(C_k) \prod_{i=1}^{n} P(x_i \mid C_k)$$

Applying Laplace additive smoothing ($\alpha$) to handle unseen vocabulary terms:

$$P(x_i \mid C_k) = \frac{N_{C_k, x_i} + \alpha}{N_{C_k} + \alpha \cdot |V|}$$

*Where:*
- $N_{C_k, x_i}$ is the total sum of TF-IDF weights for word $x_i$ in category $C_k$.
- $N_{C_k}$ is the total sum of TF-IDF weights of all words in category $C_k$.
- $\alpha$ is the Laplace smoothing parameter ($\alpha > 0$).
- $|V|$ is the total unique vocabulary size across all categories.

---

### 3.3 Confidence Threshold Fallback Formulation ($\tau = 0.45$)
To ensure classification integrity when encountering out-of-domain feedback:

$$\hat{C}(\mathbf{x}) = \begin{cases} \arg\max_{C_k \in \{\text{Facilities, Staff, Collection}\}} P(C_k \mid \mathbf{x}) & \text{if } \max_{C_k} P(C_k \mid \mathbf{x}) \ge 0.45 \\ \text{"Other/Uncategorized"} & \text{if } \max_{C_k} P(C_k \mid \mathbf{x}) < 0.45 \end{cases}$$

---

### 3.4 Likert Emoji Rating Average Formula
Each Likert question rating $q \in \{Q_1, Q_2, \dots, Q_{10}\}$ is mapped to a weight $w(q)$:

$$w(q) = \begin{cases} +1.0 & \text{if } q = \text{'very\_satisfied'} \\ +0.5 & \text{if } q = \text{'satisfied'} \\ 0.0 & \text{if } q = \text{'neutral'} \\ -0.5 & \text{if } q = \text{'dissatisfied'} \\ -1.0 & \text{if } q = \text{'very\_dissatisfied'} \end{cases}$$

$$\text{RatingAvg} = \frac{1}{|Q_{\text{valid}}|} \sum_{q \in Q_{\text{valid}}} w(q)$$

*Where $Q_{\text{valid}}$ includes all questions where $q \neq \text{'na'}$ and $q \neq \text{null}$.*

---

### 3.5 Dual-Engine Blended Sentiment Score & Classification Rule
BERT transformer outputs are mapped to discrete numerical values:

$$\text{BERTScore} = \begin{cases} +1.0 & \text{if BERT Sentiment} = \text{'Positive'} \\ 0.0 & \text{if BERT Sentiment} = \text{'Neutral'} \\ -1.0 & \text{if BERT Sentiment} = \text{'Negative'} \end{cases}$$

The combined continuous sentiment score $\text{SentimentScore} \in [-1.0, +1.0]$ is computed as:

$$\text{SentimentScore} = \left(\text{RatingAvg} \times 0.50\right) + \left(\text{BERTScore} \times 0.50\right)$$

The overall survey sentiment label is determined by:

$$\text{SentimentResult} = \begin{cases} \text{Positive} & \text{if } \text{SentimentScore} > +0.15 \\ \text{Negative} & \text{if } \text{SentimentScore} < -0.15 \\ \text{Neutral} & \text{otherwise } (-0.15 \le \text{SentimentScore} \le +0.15) \end{cases}$$

---

### 3.6 Complete Worked Numerical Example for Thesis Defense
Assume a student patron submits the following survey:
1. **Likert Emoji Answers**:
   - 6 questions marked `very_satisfied` ($+1.0$)
   - 4 questions marked `satisfied` ($+0.5$)
   $$\text{RatingAvg} = \frac{(6 \times 1.0) + (4 \times 0.5)}{10} = \frac{6.0 + 2.0}{10} = +0.80$$

2. **Open-Ended Text Feedback**:
   `"Staffs are approachable and security guard is friendly"`

3. **Naïve Bayes Categorization**:
   - TF-IDF processes terms: `staffs`, `approachable`, `security`, `guard`, `friendly`.
   - Category probabilities computed: $P(\text{Staff} \mid \mathbf{x}) = 0.9995$, $P(\text{Facilities} \mid \mathbf{x}) = 0.0003$, $P(\text{Collection} \mid \mathbf{x}) = 0.0002$.
   - Since $\max P = 0.9995 \ge 0.45$, assigned $\text{Category} = \text{"Staff"}$.

4. **RoBERTa BERT Sentiment Analysis**:
   - Hugging Face model evaluates text $\rightarrow$ Predicted `Positive` ($\text{BERTScore} = +1.0$).

5. **Blended Score Computation**:
   $$\text{SentimentScore} = (0.80 \times 0.50) + (1.00 \times 0.50) = 0.40 + 0.50 = +0.90$$

6. **Final Persisted Record**:
   - $\text{SentimentScore} = +0.90$
   - $\text{SentimentResult} = \text{"Positive"}$ (since $+0.90 > +0.15$)
   - $\text{Category} = \text{"Staff"}$

---

## SECTION 4: THE 8 PANELIST DASHBOARD REQUIREMENTS IMPLEMENTATION

| # | Panelist Requirement | Implementation Logic in `SentimentDashboard.js` |
|---|---|---|
| **1** | Total Survey Responses | Rendered in `Total Analyzed` KPI summary card (`surveys.length`). |
| **2** | Average Satisfaction Score | KPI card displaying average sentiment score scaled from `-1.0` to `+1.0`. Uses `getSurveyScore(s)` helper function which provides dynamic fallback calculations for pre-existing SQL records with null scores. |
| **3** | Positive / Neutral / Negative Percentages | Rendered in Summary Cards and Donut Chart legend: $\% = \frac{N_{\text{label}}}{N_{\text{total}}} \times 100\%$. |
| **4** | Sentiment Trend by Month | Stacked `BarChart` (via Recharts) displaying monthly Positive, Neutral, and Negative response distributions (`YYYY-MM`). |
| **5** | Top 5 Positive Comments | Score-ranked list of top 5 positive comments sorted in descending order of `SentimentScore`. Kept independent of Sentiment dropdown per locked-in design decisions. |
| **6** | Top 5 Negative Comments | Score-ranked list of top 5 negative comments sorted in ascending order of `SentimentScore`. |
| **7** | Word Cloud Visualization | Renders top 60 frequent comment keywords across all survey responses using `ReactWordcloud` with `rotations: 1, rotationAngles: [0, 0]` for 100% horizontal legibility. |
| **8** | Service Improvement Recommendations | Rule-based recommendation engine for operational categories triggering Moderate Concern ($\ge 30\%$ negative) or High Concern ($\ge 50\%$ negative). Incorporates **Option A (Keyword Signals)** and **Option B (Raw Supporting Evidence)**. |

---

## SECTION 5: SERVICE IMPROVEMENT RECOMMENDATIONS ENGINE (REQUIREMENT #8)

### 5.1 Category Dissatisfaction Ratio Formula
For each operational domain $C \in \{\text{Facilities}, \text{Staff}, \text{Collection}\}$:

$$\text{NegRatio}(C) = \frac{N_{\text{Negative}}(C)}{N_{\text{Total}}(C)}$$

### 5.2 Rule-Based Recommendation Output Selection
$$\text{RecommendationText}(C) = \begin{cases} \text{RECOMMENDATIONS}[C].\text{high} & \text{if } \text{NegRatio}(C) \ge 0.50 \\ \text{RECOMMENDATIONS}[C].\text{moderate} & \text{if } 0.30 \le \text{NegRatio}(C) < 0.50 \\ \text{None (Category Operating Normally)} & \text{if } \text{NegRatio}(C) < 0.30 \end{cases}$$

Where pre-configured recommendations are defined as:
```javascript
const RECOMMENDATIONS = {
  Facilities: {
    moderate: 'Consider a facilities walkthrough to address recurring comfort/accessibility complaints (lighting, seating, temperature, cleanliness).',
    high: 'Facilities feedback is predominantly negative - prioritize an infrastructure audit and budget request for repairs/upgrades this term.',
  },
  Staff: {
    moderate: 'Some patrons report friction with staff interactions - a refresher on frontline service standards may help.',
    high: 'Staff-related complaints are high - recommend a service-quality review with librarians and targeted retraining.',
  },
  Collection: {
    moderate: 'Patrons are flagging gaps in available materials - review acquisition requests for undersupplied subject areas.',
    high: 'Collection dissatisfaction is high - conduct a collection audit and prioritize acquisitions for the most-requested subjects.',
  },
};
```

### 5.3 Option A: Word-Frequency Keyword Signal Mining (`CATEGORY_KEYWORDS`)
When a category triggers a recommendation ($\text{NegRatio} \ge 0.30$), the engine scans all negative comments in category $C$ against `CATEGORY_KEYWORDS[C]`:

$$\text{Count}(k) = \sum_{d \in \text{NegComments}(C)} \mathbb{I}(k \in \text{lowercase}(d))$$

Top matching issue keywords are extracted and displayed as sub-insight badges:  
*`🔍 Frequent Category Issue Signals: poor air conditioning/temperature control (3 mentions); restroom cleanliness/maintenance (2 mentions)`*

### 5.4 Option B: Raw Patron Supporting Evidence
Directly embeds the top 2-3 most severe patron comments per category alongside sentiment scores, providing empirical proof for library administrators and thesis reviewers.

---

## SECTION 6: GUARDS, LIMITS & SYSTEM STABILITY CONTROLS

1. **SQL Null Score Fallback (`getSurveyScore`)**: For historical database rows created prior to SQL schema migrations, `getSurveyScore(s)` dynamically computes the blended score on the fly using stored Likert answers ($Q_1 \dots Q_{10}$) and `SentimentResult`.
2. **Text Truncation Guard**: Python Flask truncates inputs to 512 tokens (`text[:512]`) before passing to transformer models, preventing PyTorch out-of-memory (OOM) exceptions.
3. **Empty Feedback Handling**: Submissions without open-ended text bypass Python ML endpoints, calculating sentiment scores strictly from Likert emoji ratings.
4. **React 19 Compatibility**: Explicitly passes `minSize={[300, 300]}` to `<ReactWordcloud>` to prevent React 19 `defaultProps` deprecation crashes.
5. **Horizontal Legibility**: Configures `rotations: 1, rotationAngles: [0, 0]` in `ReactWordcloud` so all keywords render horizontally for comfortable reading.
