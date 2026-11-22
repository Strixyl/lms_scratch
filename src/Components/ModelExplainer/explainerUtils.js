import { createTheme } from '@mui/material/styles';
import { THEME } from '../../constants/themeTokens';

// Scoped MUI theme so portaled tooltips, selects, tabs, and inputs all use Poppins
// instead of inheriting Times New Roman from src/App.js.
export const explainerTheme = createTheme({
  palette: {
    primary: {
      main: THEME.brand.primary,
      dark: THEME.brand.primaryHover,
    },
    secondary: {
      main: THEME.brand.accent,
      dark: THEME.brand.accentHover,
    },
    success: {
      main: THEME.status.success,
    },
    error: {
      main: THEME.status.error,
    },
    text: {
      primary: THEME.text.primary,
      secondary: THEME.text.secondary,
    },
    background: {
      default: THEME.surface.background,
      paper: THEME.surface.card,
    },
  },
  typography: {
    fontFamily: THEME.font.family,
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: { fontFamily: THEME.font.family },
        input: { fontFamily: THEME.font.family },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontFamily: THEME.font.family },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontFamily: THEME.font.family },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: THEME.font.family,
          fontSize: '0.72rem',
          fontWeight: 500,
          backgroundColor: THEME.brand.primary,
          borderRadius: 8,
          padding: '6px 10px',
        },
        arrow: {
          color: THEME.brand.primary,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: THEME.font.family },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: THEME.font.family,
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
  },
});

// 10 satisfaction survey questions
export const SURVEY_QUESTIONS = [
  { id: 1, title: 'Service Delivery', text: 'The efficiency of library service delivery meets your expectations.' },
  { id: 2, title: 'Guidelines & Manual', text: "The clarity and usefulness of the library's guidelines and manual for users." },
  { id: 3, title: 'Staff Professionalism', text: 'The professionalism and helpfulness of librarians and library staff in assisting patrons.' },
  { id: 4, title: 'Communication Updates', text: 'The effectiveness of communication regarding library updates and changes.' },
  { id: 5, title: 'Physical Environment', text: "The comfort and accessibility of the library's physical environment." },
  { id: 6, title: 'Resources & Materials', text: 'The availability of resources and materials to support your academic needs.' },
  { id: 7, title: 'Timeliness & Reliability', text: 'The timeliness and reliability of services provided by the library.' },
  { id: 8, title: 'Navigation Ease', text: 'The ease of navigating both physical and digital library resources.' },
  { id: 9, title: 'Management & Organization', text: 'The overall organization and management of library services.' },
  { id: 10, title: 'General Satisfaction', text: 'Your general satisfaction with your experience at the library.' },
];

// Likert rating options (scale 5 to 1, and N/A)
export const RATING_LEVELS = [
  {
    id: 'very_satisfied',
    label: 'Very Satisfied',
    shortLabel: 'Very Sat.',
    code: '5',
    score: 1.0,
    color: '#107c41',
    bg: '#eafaf1',
    border: '#b7ebc9',
  },
  {
    id: 'satisfied',
    label: 'Satisfied',
    shortLabel: 'Satisfied',
    code: '4',
    score: 0.5,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    shortLabel: 'Neutral',
    code: '3',
    score: 0.0,
    color: '#475569',
    bg: '#f1f5f9',
    border: '#cbd5e1',
  },
  {
    id: 'dissatisfied',
    label: 'Dissatisfied',
    shortLabel: 'Dissat.',
    code: '2',
    score: -0.5,
    color: '#e11d48',
    bg: '#fff1f2',
    border: '#fecdd3',
  },
  {
    id: 'very_dissatisfied',
    label: 'Very Dissatisfied',
    shortLabel: 'Very Dissat.',
    code: '1',
    score: -1.0,
    color: '#be123c',
    bg: '#ffe4e6',
    border: '#fda4af',
  },
  {
    id: 'na',
    label: 'Not Applicable',
    shortLabel: 'N/A',
    code: 'N/A',
    score: null,
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
  },
];

export const DEFAULT_RATINGS = [
  'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied',
  'satisfied', 'satisfied', 'satisfied', 'satisfied', 'very_satisfied',
];

export const DATE_PRESETS = ['Today', 'This Week', 'This Month', 'All Time'];

export const CATEGORY_FILTER_OPTIONS = [
  'All',
  'Facilities',
  'Staff',
  'Collection',
  'Other/Uncategorized',
];

// Curated edge-case presets for interactive testing & thesis/OJT demonstrations
export const DEMO_SCENARIOS = [
  {
    id: 'contrast',
    label: 'Contrast Split',
    description: 'Tests "Most-Negative-Wins" clause splitting across "but"',
    text: 'The librarians are very helpful and courteous, but the aircon on the third floor is broken and noisy.',
    ratings: [
      'satisfied', 'satisfied', 'very_satisfied', 'satisfied', 'dissatisfied',
      'satisfied', 'satisfied', 'satisfied', 'satisfied', 'neutral',
    ],
  },
  {
    id: 'conflict',
    label: 'Rating vs. Text Conflict',
    description: 'High Likert ratings paired with a negative text comment -> Neutral buffer',
    text: 'The wifi disconnects constantly and power outlets at the study tables are broken.',
    ratings: [
      'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'satisfied',
      'very_satisfied', 'very_satisfied', 'satisfied', 'satisfied', 'very_satisfied',
    ],
  },
  {
    id: 'collection',
    label: 'Collection Praise',
    description: 'Clear positive review with strong Collection domain tokens',
    text: 'Updated textbooks, thesis manuscripts, and online journals are easy to find through the OPAC catalog.',
    ratings: [
      'very_satisfied', 'satisfied', 'very_satisfied', 'satisfied', 'satisfied',
      'very_satisfied', 'satisfied', 'very_satisfied', 'satisfied', 'very_satisfied',
    ],
  },
  {
    id: 'fallback',
    label: 'Low-Confidence Fallback',
    description: 'Vague statement with no strong domain keywords -> Other/Uncategorized',
    text: 'Thank you very much for everything today, keep up the good work.',
    ratings: [
      'satisfied', 'satisfied', 'satisfied', 'satisfied', 'satisfied',
      'satisfied', 'satisfied', 'satisfied', 'satisfied', 'satisfied',
    ],
  },
  {
    id: 'likert_only',
    label: 'Likert Only (No Text)',
    description: 'Empty comment -> Final Score equals R_avg directly (no 50/50 split)',
    text: '',
    ratings: [
      'satisfied', 'satisfied', 'very_satisfied', 'neutral', 'satisfied',
      'satisfied', 'neutral', 'satisfied', 'satisfied', 'satisfied',
    ],
  },
];

export const DOMAIN_KEYWORDS = {
  Facilities: [
    'wifi', 'aircon', 'ac', 'restroom', 'toilet', 'elevator', 'lift', 'socket',
    'outlet', 'outlets', 'plug', 'charging', 'lighting', 'lights', 'ventilation', 'temperature',
    'terminal', 'printer', 'printing', 'photocopier', 'scanner', 'computer',
    'computers', 'desktop', 'station', 'hardware', 'monitor', 'keyboard', 'mouse',
    'desk', 'chair', 'table', 'tables', 'cubicle', 'carrel', 'bench', 'seat', 'kiosk',
    'elibrary', 'cyberlib', 'cyber', 'equipment', 'tissue', 'pillow', 'study room', 'quiet',
  ],
  Staff: [
    'librarian', 'librarians', 'staff', 'personnel', 'guard', 'assistant',
    'attendant', 'cashier', 'admin', 'professors', 'teacher', 'courteous', 'accommodating', 'helpful',
  ],
  Collection: [
    'book', 'books', 'textbook', 'textbooks', 'journal', 'journals', 'thesis',
    'catalog', 'catalogue', 'ebook', 'periodical', 'novel', 'literature', 'author',
    'reference', 'bestseller', 'reviewer', 'dictionary', 'encyclopedia', 'magazine',
    'opac', 'manuscript', 'manuscripts', 'accession',
  ],
};

export const CONTRAST_WORDS = [
  'on the other hand',
  'although',
  'however',
  'though',
  'except',
  'while',
  'but',
  'yet',
];

export const getDatePresetRange = (preset) => {
  const now = new Date();
  const startOfDay = (d) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  if (preset === 'Today') {
    return { start: startOfDay(now), end: now };
  }
  if (preset === 'This Week') {
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = startOfDay(new Date(now));
    monday.setDate(monday.getDate() + diffToMonday);
    return { start: monday, end: now };
  }
  if (preset === 'This Month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
  return { start: null, end: null };
};

export const getSentimentStyle = (sentiment) => {
  const norm = sentiment || 'Neutral';
  const entry = THEME.sentiment[norm] || THEME.sentiment.Neutral;
  return {
    solid: entry.bg,
    bg: entry.light,
    text: entry.text,
    border: entry.border,
    dot: entry.dot,
  };
};

export const getCategoryStyle = (category) => {
  const norm = category || 'Other/Uncategorized';
  const entry = THEME.category[norm] || THEME.category['Other/Uncategorized'];
  return {
    solid: entry.bg,
    bg: entry.light,
    text: entry.text,
    border: entry.border,
    dot: entry.dot,
  };
};

export const formatSigned = (num, digits = 2) => {
  const n = Number(num || 0);
  if (n > 0) return `+${n.toFixed(digits)}`;
  return n.toFixed(digits);
};

// Lightweight client-side text preprocessing & stemming mirror
export const clientPreprocess = (str) => {
  if (!str) return '';
  let cleaned = String(str).toLowerCase();
  cleaned = cleaned.replace(/http\S+|www\.\S+/g, ' ');
  cleaned = cleaned.replace(/@\w+/g, ' ');
  cleaned = cleaned.replace(/#\w+/g, ' ');
  cleaned = cleaned.replace(/[^a-z\s]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const stemmed = tokens.map((w) => {
    if (w.length <= 3) return w;
    return w.replace(/(?:ies)$/i, 'y').replace(/(?:s|es|ing|ed)$/i, '');
  });
  return stemmed.join(' ');
};

// Fallback client-side mathematical simulation when Python/Node API is unreachable
export const runClientSimulation = (text, currentRatings, threshold = 0.45) => {
  const rawText = (text || '').trim();
  const preprocessed = clientPreprocess(rawText);
  const words = preprocessed.split(/\s+/).filter(Boolean);

  // Clause splitting on contrast conjunctions
  let clauses = rawText ? [rawText] : [];
  if (rawText.length >= 24) {
    for (const cw of CONTRAST_WORDS) {
      const regex = new RegExp(`\\b${cw}\\b`, 'i');
      const match = rawText.match(regex);
      if (match) {
        const idx = match.index;
        const before = rawText.substring(0, idx).trim();
        const after = rawText.substring(idx + match[0].length).trim();
        if (before.length >= 10 && after.length >= 10) {
          clauses = [before, after];
          break;
        }
      }
    }
  }

  const positiveWords = [
    'accommodat', 'helpful', 'courte', 'nice', 'good', 'great', 'friend', 'fast',
    'comfort', 'clean', 'quiet', 'avail', 'satisfi', 'convenient', 'straightforward',
    'updated', 'organized', 'easy', 'thank',
  ];
  const negativeWords = [
    'leak', 'broken', 'hot', 'cold', 'slow', 'nois', 'disconnect', 'mismatch', 'lag',
    'uncomfort', 'bad', 'rude', 'miss', 'poor', 'fail', 'dissatisfi', 'delay', 'dark',
    'freez', 'distract', 'difficult', 'cramp', 'dirty', 'outdated',
  ];

  const scoreCategoryForWords = (tokenList) => {
    let fac = 0.01;
    let stf = 0.01;
    let col = 0.01;
    tokenList.forEach((w) => {
      if (DOMAIN_KEYWORDS.Facilities.some((kw) => kw.startsWith(w) || w.startsWith(kw))) fac += 2.0;
      if (DOMAIN_KEYWORDS.Staff.some((kw) => kw.startsWith(w) || w.startsWith(kw))) stf += 2.0;
      if (DOMAIN_KEYWORDS.Collection.some((kw) => kw.startsWith(w) || w.startsWith(kw))) col += 2.0;
    });
    const sum = fac + stf + col + 0.05;
    const probs = {
      Facilities: Number((fac / sum).toFixed(4)),
      Staff: Number((stf / sum).toFixed(4)),
      Collection: Number((col / sum).toFixed(4)),
      'Other/Uncategorized': Number((0.05 / sum).toFixed(4)),
    };
    let winner = 'Other/Uncategorized';
    let conf = probs['Other/Uncategorized'];
    Object.entries(probs).forEach(([k, v]) => {
      if (v > conf) {
        winner = k;
        conf = v;
      }
    });
    const finalCat = conf < threshold ? 'Other/Uncategorized' : winner;
    return { probs, winner, conf, finalCat };
  };

  const clauseDetails = clauses.map((c) => {
    const cWords = clientPreprocess(c).split(/\s+/).filter(Boolean);
    let negCount = 0;
    let posCount = 0;
    cWords.forEach((w) => {
      if (negativeWords.some((nw) => w.startsWith(nw) || nw.startsWith(w))) negCount += 2;
      if (positiveWords.some((pw) => w.startsWith(pw) || pw.startsWith(w))) posCount += 2;
    });

    let sent = 'Neutral';
    let conf = 0.85;
    if (negCount > posCount) {
      sent = 'Negative';
      conf = Math.min(0.99, 0.70 + negCount * 0.1);
    } else if (posCount > negCount) {
      sent = 'Positive';
      conf = Math.min(0.99, 0.70 + posCount * 0.1);
    }

    const catInfo = scoreCategoryForWords(cWords);
    return {
      clause: c,
      sentiment: sent,
      confidence: Number(conf.toFixed(4)),
      category: catInfo.finalCat,
      category_probabilities: catInfo.probs,
    };
  });

  let aggSentiment = 'Neutral';
  let aggConfidence = rawText ? 0.75 : 0.0;
  const negClauses = clauseDetails.filter((cd) => cd.sentiment === 'Negative');
  if (negClauses.length > 0) {
    const worst = negClauses.reduce((a, b) => (b.confidence > a.confidence ? b : a));
    aggSentiment = 'Negative';
    aggConfidence = worst.confidence;
  } else {
    const posClauses = clauseDetails.filter((cd) => cd.sentiment === 'Positive');
    if (posClauses.length > 0) {
      const best = posClauses.reduce((a, b) => (b.confidence > a.confidence ? b : a));
      aggSentiment = 'Positive';
      aggConfidence = best.confidence;
    }
  }

  const bertScore = aggSentiment === 'Positive' ? 1.0 : aggSentiment === 'Negative' ? -1.0 : 0.0;

  // Feature extraction & Naive Bayes approximation
  const extractedFeatures = [];
  const seenTokens = new Set();
  const domainKeywordMatches = { Facilities: [], Staff: [], Collection: [] };

  words.forEach((w) => {
    let matchedCat = null;
    if (DOMAIN_KEYWORDS.Facilities.some((kw) => kw.startsWith(w) || w.startsWith(kw))) {
      matchedCat = 'Facilities';
      domainKeywordMatches.Facilities.push(w);
    } else if (DOMAIN_KEYWORDS.Staff.some((kw) => kw.startsWith(w) || w.startsWith(kw))) {
      matchedCat = 'Staff';
      domainKeywordMatches.Staff.push(w);
    } else if (DOMAIN_KEYWORDS.Collection.some((kw) => kw.startsWith(w) || w.startsWith(kw))) {
      matchedCat = 'Collection';
      domainKeywordMatches.Collection.push(w);
    }

    if ((matchedCat || w.length > 3) && !seenTokens.has(w)) {
      seenTokens.add(w);
      extractedFeatures.push({
        token: w,
        tfidf: Number((0.28 + Math.min(0.62, w.length * 0.07)).toFixed(4)),
        domain_category: matchedCat,
      });
    }
  });
  extractedFeatures.sort((a, b) => b.tfidf - a.tfidf);

  const fullCat = rawText
    ? scoreCategoryForWords(words)
    : {
        probs: { Facilities: 0, Staff: 0, Collection: 0, 'Other/Uncategorized': 0 },
        winner: 'Other/Uncategorized',
        conf: 0,
        finalCat: 'Other/Uncategorized',
      };

  const fallbackApplied = fullCat.conf < threshold && fullCat.winner !== 'Other/Uncategorized';

  // Likert ratings calculation
  const ratingMap = {
    very_satisfied: 1.0,
    satisfied: 0.5,
    neutral: 0.0,
    dissatisfied: -0.5,
    very_dissatisfied: -1.0,
    na: null,
  };
  const validRatings = [];
  const detailedRatings = (currentRatings || []).map((r, idx) => {
    const val = ratingMap[r];
    if (val !== null && val !== undefined) validRatings.push(val);
    return { question_index: idx + 1, key: r, numeric_score: val };
  });

  const validCount = validRatings.length;
  const rawSum = Number(validRatings.reduce((a, b) => a + b, 0).toFixed(4));
  const rAvg = validCount > 0 ? Number((rawSum / validCount).toFixed(4)) : 0.0;
  const emojiSentiment = rAvg > 0.15 ? 'Positive' : rAvg < -0.15 ? 'Negative' : 'Neutral';

  // 50/50 Hybrid Synthesis
  const hasComment = Boolean(rawText.length > 0);
  let combinedScore;
  let arithmeticSubstitution;
  if (hasComment) {
    combinedScore = Number(((rAvg * 0.50) + (bertScore * 0.50)).toFixed(4));
    arithmeticSubstitution = `(${rAvg.toFixed(2)} × 0.50) + (${formatSigned(bertScore, 2)} × 0.50) = ${(rAvg * 0.5).toFixed(2)} + ${formatSigned(bertScore * 0.5, 2)} = ${formatSigned(combinedScore, 2)}`;
  } else {
    combinedScore = rAvg;
    arithmeticSubstitution = `R_avg = ${formatSigned(rAvg, 2)} (No feedback text; Final Score = R_avg)`;
  }

  const finalSentiment = combinedScore > 0.15 ? 'Positive' : combinedScore < -0.15 ? 'Negative' : 'Neutral';

  return {
    source: 'simulation',
    text: rawText,
    preprocessed_text: preprocessed,
    clauses: clauseDetails,
    split_triggered: clauseDetails.length > 1,
    roberta: {
      sentiment: aggSentiment,
      confidence: aggConfidence,
      bert_score: bertScore,
      aggregation_strategy: clauseDetails.length > 1 ? 'Most-Negative-Wins (Clause Splitting)' : 'Single Clause Analysis',
    },
    naive_bayes: {
      alpha: 0.01,
      classes: ['Collection', 'Facilities', 'Other/Uncategorized', 'Staff'],
      probabilities: fullCat.probs,
      raw_winner: fullCat.winner,
      raw_confidence: fullCat.conf,
      confidence_threshold: threshold,
      threshold_met: fullCat.conf >= threshold,
      extracted_features: extractedFeatures,
      domain_keyword_matches: domainKeywordMatches,
      final_category: fullCat.finalCat,
      final_confidence: fullCat.conf,
      fallback_applied: fallbackApplied,
    },
    likert_simulation: {
      valid_count: validCount,
      raw_sum: rawSum,
      r_avg: rAvg,
      emoji_sentiment: emojiSentiment,
      detailed_ratings: detailedRatings,
    },
    hybrid_synthesis: {
      r_avg: rAvg,
      bert_score: bertScore,
      has_comment: hasComment,
      combined_score: combinedScore,
      final_sentiment: finalSentiment,
      arithmetic_substitution: arithmeticSubstitution,
    },
  };
};

// Annotates feedback text into segments for inline highlighting of domain keywords and contrast words
export const annotateFeedbackTokens = (text, extractedFeatures = []) => {
  if (!text) return [];

  const featureByToken = new Map();
  extractedFeatures.forEach((f) => {
    if (f?.token) {
      featureByToken.set(f.token.toLowerCase(), f);
    }
  });

  const segments = text.split(/(on the other hand|\b[a-zA-Z0-9']+\b)/gi).filter((part) => part !== '');
  const contrastSet = new Set(CONTRAST_WORDS.map((w) => w.toLowerCase()));

  return segments.map((segment, index) => {
    const lower = segment.toLowerCase();

    if (contrastSet.has(lower)) {
      return {
        key: `${index}-${segment}`,
        text: segment,
        type: 'contrast',
      };
    }

    if (/^[a-zA-Z0-9']+$/.test(segment)) {
      const stemmed = clientPreprocess(lower);
      let matchedFeature = featureByToken.get(lower) || featureByToken.get(stemmed);

      if (!matchedFeature && stemmed.length >= 4) {
        for (const [tok, feat] of featureByToken.entries()) {
          if (tok.startsWith(stemmed) || stemmed.startsWith(tok)) {
            matchedFeature = feat;
            break;
          }
        }
      }

      let domainCategory = matchedFeature?.domain_category || null;
      if (!domainCategory) {
        for (const [cat, kws] of Object.entries(DOMAIN_KEYWORDS)) {
          if (kws.includes(lower) || (stemmed.length >= 4 && kws.some((kw) => kw === stemmed))) {
            domainCategory = cat;
            break;
          }
        }
      }

      if (domainCategory) {
        return {
          key: `${index}-${segment}`,
          text: segment,
          type: 'domain',
          domainCategory,
          tfidf: matchedFeature?.tfidf ?? null,
          matchedToken: matchedFeature?.token ?? stemmed,
        };
      }
    }

    return {
      key: `${index}-${segment}`,
      text: segment,
      type: 'plain',
    };
  });
};
