# Sentiment Analysis Dashboard — System Flow & Technical Guide

This document provides a comprehensive technical overview of the **Sentiment Analysis Dashboard** (`SentimentDashboard.js`) in the Henry Luce III Library Management & CSAT System.

---

## 📐 High-Level Architecture & Data Flow

```mermaid
graph TD
    A["Database / Express API"] -->|"GET /api/surveys"| B["SentimentDashboard React Component"]
    B --> C["State Initialization & Raw Surveys Array"]
    C --> D["Active Filtering Pipeline"]
    
    subgraph Filtering Pipeline
        D -->|"Date, Clientele, College, Category, Sentiment, Search"| E["Filtered Surveys Dataset"]
    end

    subgraph Analytical & TF-IDF Engines
        E --> F["CSAT Satisfaction & Hybrid Score Engine"]
        E --> G["Bilingual Preprocessing & Stemming Engine"]
        E --> H["TF-IDF Relevance Engine (calculateTFIDFRelevance)"]
        E --> I["12-Month Trend Aggregator"]
        E --> J["Category Concern & Recommendation Engine"]
    end

    subgraph Top Comments Selection
        H --> K["Normalized TF-IDF & Magnitude Score"]
        K --> L["Small Pool Fallback Guard (< 5 comments)"]
        L --> M["Topic Diversity Filter (max 2/topic)"]
        M --> N["Top 5 Positive & Top 5 Negative Comments"]
    end

    subgraph Visual Renderers
        F --> O["KPI Summary Cards"]
        I --> P["12-Month Bar Chart"]
        E --> Q["Donut & Pie Charts"]
        G --> R["React WordCloud"]
        N --> S["Top Comments Cards with Keyword Chips"]
        J --> T["Service Recommendations Cards"]
        E --> U["Paginated & Sortable Data Table"]
    end
```

---

## 🔄 Step-by-Step Page Operational Flow

### 1. Authentication & Security Layer
* **Modal Trigger**: Upon rendering, the dashboard checks `localStorage` for `loggedInUser`.
* **Access Barrier**: If unauthenticated, a login modal overlays the dashboard requiring credentials (`admin` / `admin`).
* **Session Persistence**: Successful login stores `loggedInUser` in `localStorage`, unlocking dashboard controls.

---

### 2. Data Retrieval & State Pipeline
1. **API Call**: On initial load (and date preset changes), `fetchSurveys()` issues an HTTP GET request to `http://localhost:5000/api/surveys` with `startDate` and `endDate` query parameters.
2. **State Updates**:
   * `surveys`: Holds all raw response records from the database.
   * `page`: Resets to `0`.
   * `selectedRowIds`: Resets to `[]` for batch actions.

---

### 3. Dynamic Multi-Parametric Filter Pipeline
The `filtered` array applies active user filters sequentially:
* **Date Presets**: `Today`, `This Week`, `This Month`, `All Time`.
* **Date Range**: Custom `Start Date` and `End Date` selectors.
* **Clientele Filter**: Student, Faculty, Staff, Researcher, CPU Admin, Alumnus/Alumni.
* **College Filter**: CARES, CAS, CBA, CCS, COED, COE, CHM, COL, CMLS, COM, CON, COP, COT, SGS, SHS, JHS, ELEM, KINDER.
* **Sentiment Filter**: Positive, Neutral, Negative.
* **Category Filter**: Facilities, Staff, Collection, Other/Uncategorized.
* **Year Selector**: Filters 12-Month trend chart metrics by academic/calendar year.

---

## 🧮 Core Analytical & Scoring Calculations

### A. CSAT Satisfaction Average (1–5 Scale)
Maps 5-point survey response strings to numeric scores:
$$\text{Satisfaction Scale} = \{ \text{Very Satisfied}: 5, \text{Satisfied}: 4, \text{Neutral}: 3, \text{Dissatisfied}: 2, \text{Very Dissatisfied}: 1 \}$$
$$\text{Avg Satisfaction} = \frac{\sum_{i=1}^{10} \text{Scale}(Q_i)}{N_{\text{valid questions}}}$$

---

### B. English Text Preprocessing & Stemming (`stemWord`)
1. **Scope Limitation**: The NLP sentiment pipeline is strictly scoped and optimized for **English patron comments**.
2. **Punctuation & URL Stripping**: Converts text to lowercase and removes web URLs and special characters.
3. **English Stopwords & Filler Filtering**: Filters generic English grammar words, quantifiers, and filler degree words (*the, a, and, is, to, in, lot, lots, many, much, quality, bad, good, great, poor*, etc.) so that core subject nouns (*tables, chairs, aircon, wifi, staff, books*) are prioritized as top terms.
4. **Word Stemming (`stemWord`)**: Normalizes plurals and common suffixes (`staffs` $\rightarrow$ `staff`, `books` $\rightarrow$ `book`, `tables` $\rightarrow$ `table`).
5. **Display Mapping**: Maps stemmed roots back to their most frequent natural word variant.

---

### C. TF-IDF Keyword Scoring Engine (`calculateTFIDFRelevance`)
Ranks written English comments by informative keyword relevance within their sentiment pools:

1. **Preprocessing & English Stopwords**: Converts text to lowercase, strips URLs/punctuation, and removes English stop-words.
2. **Inverse Document Frequency (IDF)**: Measures term rarity across pool $D$ ($N = |D|$):
   $$\text{IDF}(t) = \ln\left(\frac{N}{|\{d \in D : t \in d\}| + 1}\right) + 1$$
3. **Normalized TF-IDF Score**: Sums TF-IDF weights and normalizes by square root of unique key terms:
   $$\text{tfidfScore} = \frac{\sum_{t \in d} \text{TF}(t,d) \times \text{IDF}(t)}{\sqrt{\text{Count}(\text{unique stems in } d)}}$$
4. **Blended Score**: Combines TF-IDF relevance ($70\%$) with sentiment magnitude ($30\%$):
   $$\text{blendedScore} = (0.7 \times \text{tfidfScore}) + (0.3 \times |\text{SurveyScore}| \times 10)$$

---

### D. Sorting, Tie-Breakers & Small Pool Guard
1. **Primary Sort**: Comments in `topPositive` and `topNegative` are sorted descending by `tfidfScore`.
2. **Tie-Breaker**: Identical TF-IDF scores are broken using sentiment magnitude `Math.abs(getSurveyScore(comment))`.
3. **Small Pool Guard**: If a pool has $< 5$ comments (where IDF values become near-uniform), TF-IDF is bypassed and comments are sorted directly by $|\text{getSurveyScore}|$.

---

### E. Topic Diversity Filter (`selectDiverseTopComments`)
Ensures top 5 comment cards cover varied topics rather than repeating the same theme:
* Iterates over sorted comments.
* Limits selection to **at most 2 comments per top keyword**.
* Fills remaining slots if fewer than 5 unique topics exist.

---

### F. 12-Month Side-by-Side Trend Aggregator
* Groups filtered responses by calendar month (`Jan` – `Dec`) for the selected `filterYear`.
* Computes side-by-side counts for **Positive**, **Neutral**, and **Negative** sentiments, along with monthly average CSAT satisfaction.

---

### G. Service Improvement Recommendations Engine
1. Calculates negative sentiment percentage per category (`Facilities`, `Staff`, `Collection`).
2. Triggers severity thresholds:
   * **Moderate Severity**: Negative percentage $\ge 30\%$.
   * **High Severity**: Negative percentage $\ge 50\%$.
3. Extracts primary keywords from negative feedback and scores evidence comments using `calculateTFIDFRelevance`.

---

## 📊 Dashboard Visual Components

| Component | Description | Data Source |
| :--- | :--- | :--- |
| **KPI Summary Cards** | Total responses, Avg CSAT, Positive/Neutral/Negative totals | `filtered` statistics |
| **Top 5 Comments Cards** | Top positive and negative patron comments with keyword chips | `topPositive` / `topNegative` |
| **12-Month Trend Chart** | Side-by-side bar chart of monthly sentiment distribution | `monthly12MonthData` |
| **Sentiment Donut Chart** | Proportion of Positive, Neutral, and Negative responses | `chartData` |
| **Category Breakdown** | Proportion of feedback across Facilities, Staff, Collection | `categoryChartData` |
| **Recommendations** | Actionable advice based on negative sentiment spikes | `categoryStats` |
| **Interactive Word Cloud** | Visual representation of top 60 frequent terms | `wordCloudWords` |
| **Paginated Data Table** | Sortable table with individual/bulk deletion capabilities | `reviewRows` & `pageRows` |

---

## 📥 Export & Management Features

### 1. Excel Export (`handleExportExcel`)
Generates a formatted multi-sheet Excel file via the `XLSX` library containing:
* `Sentiment_Summary_KPIs`: High-level metrics.
* `Top_Positive_Comments`: Top 5 positive entries.
* `Top_Negative_Comments`: Top 5 negative entries.
* `Detailed_Review_Entries`: Full filtered dataset with CSAT scores and timestamps.

### 2. Print Report Generation
Hides interactive controls (`Header`, `TopBar`, buttons) via `@media print` CSS rules, producing a clean paper audit report.

### 3. Record Management & Deletion
* **Individual Delete**: Clicking the trash icon opens a confirmation modal and deletes `http://localhost:5000/api/surveys/:id`.
* **Bulk Delete**: Checkbox selection allows batch deletion of multiple records simultaneously.
