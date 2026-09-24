import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Chip,
  Divider,
  LinearProgress,
  Slider,
  Tooltip,
  IconButton,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Pagination,
  Card,
  CardContent,
  Radio,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Calculate as CalculateIcon,
  Tune as TuneIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Science as ScienceIcon,
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Search as SearchIcon,
  RateReview as RateReviewIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  Comment as CommentIcon,
  FormatQuote as QuoteIcon,
  AutoAwesome as AutoAwesomeIcon,
  Clear as ClearIcon,
  ArrowForward as ArrowForwardIcon,
  Functions as FunctionsIcon,
  Layers as LayersIcon,
  Speed as SpeedIcon,
  HelpOutline as HelpOutlineIcon,
  School as SchoolIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { THEME } from '../constants/themeTokens';

// 10 satisfaction survey questions
const SURVEY_QUESTIONS = [
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

// likert rating options (scale 5 to 1, and n/a)
const RATING_LEVELS = [
  { id: 'very_satisfied', label: 'Very Satisfied', ciscoLabel: '5', score: 1.0, color: '#107c41', bg: '#eafaf1', border: '#b7ebc9' },
  { id: 'satisfied', label: 'Satisfied', ciscoLabel: '4', score: 0.5, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'neutral', label: 'Neutral', ciscoLabel: '3', score: 0.0, color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  { id: 'dissatisfied', label: 'Dissatisfied', ciscoLabel: '2', score: -0.5, color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  { id: 'very_dissatisfied', label: 'Very Dissatisfied', ciscoLabel: '1', score: -1.0, color: '#be123c', bg: '#ffe4e6', border: '#fda4af' },
  { id: 'na', label: 'N/A', ciscoLabel: 'N/A', score: null, color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
];

// preset test cases
const QUICK_PRESETS = [
  {
    id: 'preset-1',
    title: 'Facilities (HVAC Issue)',
    category: 'Facilities',
    text: 'Aircon leaking in study room and the temperature was uncomfortably hot',
    ratings: ['satisfied', 'satisfied', 'satisfied', 'satisfied', 'very_dissatisfied', 'satisfied', 'neutral', 'satisfied', 'neutral', 'dissatisfied'],
  },
  {
    id: 'preset-2',
    title: 'Staff Commendation',
    category: 'Staff',
    text: 'The reference librarian was very accommodating, courteous, and assisted me in locating hard-to-find journals',
    ratings: ['very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied'],
  },
  {
    id: 'preset-3',
    title: 'Collection Accession Mismatch',
    category: 'Collection',
    text: 'OPAC book catalog accession number mismatch for the nursing textbooks and medical journals',
    ratings: ['neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'dissatisfied', 'dissatisfied', 'dissatisfied', 'neutral', 'neutral'],
  },
  {
    id: 'preset-4',
    title: 'Compound Pivot (Most-Negative-Wins)',
    category: 'Facilities',
    text: 'The library staff were very accommodating, but the cyber library computer wifi was disconnected',
    ratings: ['satisfied', 'satisfied', 'very_satisfied', 'satisfied', 'dissatisfied', 'satisfied', 'satisfied', 'satisfied', 'satisfied', 'satisfied'],
  },
  {
    id: 'preset-5',
    title: 'Off-Topic / Ambiguous',
    category: 'Other/Uncategorized',
    text: 'None / NA. I miss my home and friends.',
    ratings: ['neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral'],
  },
];

// domain keywords for category matching
const DOMAIN_KEYWORDS = {
  Facilities: [
    'wifi', 'aircon', 'ac', 'restroom', 'toilet', 'elevator', 'lift', 'socket',
    'outlet', 'plug', 'charging', 'lighting', 'lights', 'ventilation', 'temperature',
    'terminal', 'printer', 'printing', 'photocopier', 'scanner', 'computer',
    'computers', 'desktop', 'station', 'hardware', 'monitor', 'keyboard', 'mouse',
    'desk', 'chair', 'table', 'cubicle', 'carrel', 'bench', 'seat', 'kiosk',
    'elibrary', 'cyberlib', 'cyber', 'equipment', 'tissue', 'pillow', 'study room', 'quiet'
  ],
  Staff: [
    'librarian', 'librarians', 'staff', 'personnel', 'guard', 'assistant',
    'attendant', 'cashier', 'admin', 'professors', 'teacher', 'courteous', 'accommodating', 'helpful'
  ],
  Collection: [
    'book', 'books', 'textbook', 'textbooks', 'journal', 'journals', 'thesis',
    'catalog', 'catalogue', 'ebook', 'periodical', 'novel', 'literature', 'author',
    'reference', 'bestseller', 'reviewer', 'dictionary', 'encyclopedia', 'magazine',
    'opac', 'manuscript', 'accession'
  ],
};

const CONTRAST_WORDS = ['although', 'though', 'however', 'but', 'while', 'except', 'on the other hand', 'yet'];

export default function ModelExplainer() {
  const navigate = useNavigate();

  // view mode: database or presets
  const [corpusMode, setCorpusMode] = useState('database');

  // active tab: 0 = sentiment, 1 = category, 2 = sandbox
  const [studioTab, setStudioTab] = useState(0);

  // surveys data
  const [submittedSurveys, setSubmittedSurveys] = useState([]);
  const [isFetchingSurveys, setIsFetchingSurveys] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);

  // filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [tablePage, setTablePage] = useState(1);
  const rowsPerPage = 6;

  // computation inputs
  const [inputText, setInputText] = useState('The power outlets at the collaborative tables are very convenient for charging laptops.');
  const [ratings, setRatings] = useState([
    'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied', 'very_satisfied',
    'satisfied', 'satisfied', 'satisfied', 'satisfied', 'very_satisfied'
  ]);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45);
  const [autoCalculate, setAutoCalculate] = useState(true);

  // diagnostic state
  const [isLiveConnected, setIsLiveConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  // fetch surveys
  const loadSubmittedSurveys = useCallback(async () => {
    setIsFetchingSurveys(true);
    try {
      const res = await axios.get('http://localhost:5000/api/surveys');
      const data = res.data || [];
      setSubmittedSurveys(data);

      // default select first non-empty review
      const withComments = data.filter(s => s.Message && s.Message.trim().length > 0);
      if (withComments.length > 0 && selectedSurveyId === null) {
        handleSelectSubmittedComment(withComments[0]);
      }
    } catch (err) {
      console.error('Failed to fetch submitted surveys:', err);
    } finally {
      setIsFetchingSurveys(false);
    }
  }, [selectedSurveyId]);

  useEffect(() => {
    loadSubmittedSurveys();
  }, [loadSubmittedSurveys]);

  // text cleaning and tokenization
  const clientPreprocess = useCallback((str) => {
    if (!str) return '';
    let cleaned = String(str).toLowerCase();
    cleaned = cleaned.replace(/http\S+|www\.\S+/g, ' ');
    cleaned = cleaned.replace(/@\w+/g, ' ');
    cleaned = cleaned.replace(/#\w+/g, ' ');
    cleaned = cleaned.replace(/[^a-z\s]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const stemmed = tokens.map(w => {
      if (w.length <= 3) return w;
      return w.replace(/(?:ies)$/i, 'y').replace(/(?:s|es|ing|ed)$/i, '');
    });
    return stemmed.join(' ');
  }, []);

  // fallback simulation engine
  const runClientSimulation = useCallback((text, currentRatings, threshold) => {
    const rawText = (text || '').trim();
    const preprocessed = clientPreprocess(rawText);
    const words = preprocessed.split(/\s+/).filter(Boolean);

    // clause splitting: splits compound text on contrast words (e.g. 'but', 'however')
    let clauses = [rawText];
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

    // computation: roberta polarity score per clause (pos = +1.0, neu = 0.0, neg = -1.0), conf = min(0.99, 0.70 + count * 0.1)
    const positiveWords = ['accommodat', 'helpful', 'courte', 'nice', 'good', 'great', 'friend', 'fast', 'comfort', 'clean', 'quiet', 'avail', 'satisfi', 'convenient', 'straightforward', 'updated', 'organized'];
    const negativeWords = ['leak', 'broken', 'hot', 'cold', 'slow', 'nois', 'disconnect', 'mismatch', 'lag', 'uncomfort', 'bad', 'rude', 'miss', 'poor', 'fail', 'dissatisfi', 'delay', 'dark', 'freez', 'distract', 'difficult'];

    const clauseDetails = clauses.map(c => {
      const cLower = clientPreprocess(c);
      const cWords = cLower.split(/\s+/).filter(Boolean);
      let negCount = 0;
      let posCount = 0;
      cWords.forEach(w => {
        if (negativeWords.some(nw => w.startsWith(nw) || nw.startsWith(w))) negCount += 2;
        if (positiveWords.some(pw => w.startsWith(pw) || pw.startsWith(w))) posCount += 2;
      });

      let sent = 'Neutral';
      let conf = 0.85;
      if (negCount > posCount) {
        sent = 'Negative';
        conf = Math.min(0.99, 0.70 + (negCount * 0.1));
      } else if (posCount > negCount) {
        sent = 'Positive';
        conf = Math.min(0.99, 0.70 + (posCount * 0.1));
      }

      return {
        clause: c,
        sentiment: sent,
        confidence: Number(conf.toFixed(4)),
        category: 'Facilities',
        category_probabilities: { Facilities: 0.85, Staff: 0.10, Collection: 0.04, 'Other/Uncategorized': 0.01 }
      };
    });

    let aggSentiment = 'Neutral';
    let aggConfidence = 0.75;
    const hasNegClause = clauseDetails.find(cd => cd.sentiment === 'Negative');
    if (hasNegClause) {
      aggSentiment = 'Negative';
      aggConfidence = hasNegClause.confidence;
    } else {
      const hasPosClause = clauseDetails.find(cd => cd.sentiment === 'Positive');
      if (hasPosClause) {
        aggSentiment = 'Positive';
        aggConfidence = hasPosClause.confidence;
      }
    }
    const bertScore = aggSentiment === 'Positive' ? 1.0 : (aggSentiment === 'Negative' ? -1.0 : 0.0);

    // computation: feature weights tfidf = 0.28 + min(0.62, len * 0.07), posterior = cat_score / sum_scores
    const extractedFeatures = [];
    const domainKeywordMatches = { Facilities: [], Staff: [], Collection: [] };
    let facScore = 0.01;
    let staffScore = 0.01;
    let collScore = 0.01;

    words.forEach(w => {
      let matchedCat = null;
      if (DOMAIN_KEYWORDS.Facilities.some(kw => kw.startsWith(w) || w.startsWith(kw))) {
        matchedCat = 'Facilities';
        facScore += 2.0;
        domainKeywordMatches.Facilities.push(w);
      }
      if (DOMAIN_KEYWORDS.Staff.some(kw => kw.startsWith(w) || w.startsWith(kw))) {
        matchedCat = 'Staff';
        staffScore += 2.0;
        domainKeywordMatches.Staff.push(w);
      }
      if (DOMAIN_KEYWORDS.Collection.some(kw => kw.startsWith(w) || w.startsWith(kw))) {
        matchedCat = 'Collection';
        collScore += 2.0;
        domainKeywordMatches.Collection.push(w);
      }

      if (matchedCat || w.length > 3) {
        extractedFeatures.push({
          token: w,
          tfidf: Number((0.28 + Math.min(0.62, w.length * 0.07)).toFixed(4)),
          domain_category: matchedCat
        });
      }
    });

    const sumCat = facScore + staffScore + collScore + 0.05;
    const probFacilities = Number((facScore / sumCat).toFixed(4));
    const probStaff = Number((staffScore / sumCat).toFixed(4));
    const probCollection = Number((collScore / sumCat).toFixed(4));
    const probOther = Number((0.05 / sumCat).toFixed(4));

    const probabilities = {
      Facilities: probFacilities,
      Staff: probStaff,
      Collection: probCollection,
      'Other/Uncategorized': probOther
    };

    let rawWinner = 'Other/Uncategorized';
    let rawConf = probOther;
    if (probFacilities >= probStaff && probFacilities >= probCollection && probFacilities >= probOther) {
      rawWinner = 'Facilities';
      rawConf = probFacilities;
    } else if (probStaff >= probFacilities && probStaff >= probCollection && probStaff >= probOther) {
      rawWinner = 'Staff';
      rawConf = probStaff;
    } else if (probCollection >= probFacilities && probCollection >= probStaff && probCollection >= probOther) {
      rawWinner = 'Collection';
      rawConf = probCollection;
    }

    let finalCategory = rawWinner;
    let fallbackApplied = false;
    if (rawConf < threshold && rawWinner !== 'Other/Uncategorized') {
      finalCategory = 'Other/Uncategorized';
      fallbackApplied = true;
    }

    // formula: likert average r_avg = sum(valid_ratings) / valid_count (range -1.0 to +1.0)
    const ratingMap = {
      very_satisfied: 1.0, satisfied: 0.5, neutral: 0.0,
      dissatisfied: -0.5, very_dissatisfied: -1.0, na: null
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
    const emojiSentiment = rAvg > 0.15 ? 'Positive' : (rAvg < -0.15 ? 'Negative' : 'Neutral');

    // formula: combined_score = (r_avg * 0.50) + (roberta_score * 0.50)
    // decision threshold: score > 0.15 = positive, < -0.15 = negative, else neutral
    const hasComment = Boolean(rawText.length > 0);
    let combinedScore;
    let arithmeticSubstitution;
    if (hasComment) {
      combinedScore = Number(((rAvg * 0.50) + (bertScore * 0.50)).toFixed(4));
      const rPart = (rAvg * 0.5).toFixed(2);
      const bPart = (bertScore * 0.5).toFixed(2);
      arithmeticSubstitution = `(${rAvg.toFixed(2)} × 0.50) + (${bertScore.toFixed(2)} × 0.50) = ${rPart} + ${bPart} = ${combinedScore > 0 ? `+${combinedScore.toFixed(2)}` : combinedScore.toFixed(2)}`;
    } else {
      combinedScore = rAvg;
      arithmeticSubstitution = `R_avg = ${rAvg.toFixed(2)} (No feedback text; Final Score = R_avg)`;
    }

    const finalSentiment = combinedScore > 0.15 ? 'Positive' : (combinedScore < -0.15 ? 'Negative' : 'Neutral');

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
        aggregation_strategy: clauseDetails.length > 1 ? 'Most-Negative-Wins (Clause Splitting)' : 'Single Clause Analysis'
      },
      naive_bayes: {
        alpha: 0.01,
        classes: ['Collection', 'Facilities', 'Other/Uncategorized', 'Staff'],
        probabilities,
        raw_winner: rawWinner,
        raw_confidence: rawConf,
        confidence_threshold: threshold,
        threshold_met: rawConf >= threshold,
        extracted_features: extractedFeatures,
        domain_keyword_matches: domainKeywordMatches,
        final_category: finalCategory,
        final_confidence: rawConf,
        fallback_applied: fallbackApplied
      },
      likert_simulation: {
        valid_count: validCount,
        raw_sum: rawSum,
        r_avg: rAvg,
        emoji_sentiment: emojiSentiment,
        detailed_ratings: detailedRatings
      },
      hybrid_synthesis: {
        r_avg: rAvg,
        bert_score: bertScore,
        has_comment: hasComment,
        combined_score: combinedScore,
        final_sentiment: finalSentiment,
        arithmetic_substitution: arithmeticSubstitution,
      }
    };
  }, [clientPreprocess]);

  // pipeline execution
  const executeExplainPipeline = useCallback(async (text, currentRatings, threshold) => {
    setIsLoading(true);

    const payload = {
      text: text || '',
      ratings: currentRatings,
      threshold: threshold || 0.45
    };

    try {
      let response;
      try {
        response = await axios.post('http://localhost:5001/api/debug/explain-scores', payload, { timeout: 3500 });
        setIsLiveConnected(true);
      } catch (errDirect) {
        try {
          response = await axios.post('http://localhost:5000/api/debug/explain-scores', payload, { timeout: 3500 });
          setIsLiveConnected(true);
        } catch (errGateway) {
          throw new Error('Both Python (5001) and Node Gateway (5000) are offline.');
        }
      }

      if (response && response.data) {
        setDiagnosticResult({ ...response.data, source: 'live_backend' });
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      setIsLiveConnected(false);
      const simulated = runClientSimulation(text, currentRatings, threshold);
      setDiagnosticResult(simulated);
    } finally {
      setIsLoading(false);
    }
  }, [runClientSimulation]);

  // recalculate on input change
  useEffect(() => {
    if (autoCalculate) {
      const timer = setTimeout(() => {
        executeExplainPipeline(inputText, ratings, confidenceThreshold);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [inputText, ratings, confidenceThreshold, autoCalculate, executeExplainPipeline]);

  // load selected survey
  const handleSelectSubmittedComment = (survey) => {
    setSelectedSurveyId(survey.Id || survey.id);
    setSelectedMeta({
      id: survey.Id || survey.id,
      clientele: survey.Clientele || 'Patron',
      college: survey.College || 'General',
      course: survey.Course || '',
      dateSubmitted: survey.DateSubmitted || '',
      storedCategory: survey.Category || 'Other/Uncategorized',
      storedSentiment: survey.SentimentResult || 'Neutral',
      storedScore: survey.SentimentScore || 0.0,
    });

    setInputText(survey.Message || '');

    const surveyRatings = [
      survey.Question1 || 'neutral',
      survey.Question2 || 'neutral',
      survey.Question3 || 'neutral',
      survey.Question4 || 'neutral',
      survey.Question5 || 'neutral',
      survey.Question6 || 'neutral',
      survey.Question7 || 'neutral',
      survey.Question8 || 'neutral',
      survey.Question9 || 'neutral',
      survey.Question10 || 'neutral',
    ];
    setRatings(surveyRatings);

    if (!autoCalculate) {
      executeExplainPipeline(survey.Message || '', surveyRatings, confidenceThreshold);
    }
  };

  // load preset
  const handleSelectPreset = (preset) => {
    setSelectedSurveyId(preset.id);
    setSelectedMeta({
      id: preset.id,
      clientele: 'Academic Demo',
      college: 'Defense Benchmark',
      course: preset.title,
      dateSubmitted: 'Live Simulation',
      storedCategory: preset.category,
      storedSentiment: 'Simulated',
      storedScore: 0.0,
    });
    setInputText(preset.text);
    setRatings([...preset.ratings]);

    if (!autoCalculate) {
      executeExplainPipeline(preset.text, preset.ratings, confidenceThreshold);
    }
  };

  // update question rating
  const handleRatingChange = (qIdx, newRatingId) => {
    const next = [...ratings];
    next[qIdx] = newRatingId;
    setRatings(next);
  };

  // filter comments
  const filteredComments = useMemo(() => {
    return submittedSurveys
      .filter(s => s.Message && s.Message.trim().length > 0)
      .filter(s => {
        if (searchTerm.trim()) {
          const lower = searchTerm.toLowerCase();
          const matchMsg = (s.Message || '').toLowerCase().includes(lower);
          const matchColl = (s.College || '').toLowerCase().includes(lower);
          const matchClient = (s.Clientele || '').toLowerCase().includes(lower);
          const matchId = String(s.Id || s.id || '').includes(lower);
          if (!matchMsg && !matchColl && !matchClient && !matchId) return false;
        }
        if (filterCategory !== 'All' && s.Category !== filterCategory) return false;
        if (filterSentiment !== 'All' && s.SentimentResult !== filterSentiment) return false;
        return true;
      });
  }, [submittedSurveys, searchTerm, filterCategory, filterSentiment]);

  // pagination: slice by rows per page
  const paginatedComments = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage;
    return filteredComments.slice(start, start + rowsPerPage);
  }, [filteredComments, tablePage]);

  // diagnostic getters
  const rAvg = diagnosticResult?.likert_simulation?.r_avg ?? 0.0;
  const bertScore = diagnosticResult?.hybrid_synthesis?.bert_score ?? 0.0;
  const combinedScore = diagnosticResult?.hybrid_synthesis?.combined_score ?? 0.0;
  const finalSentiment = diagnosticResult?.hybrid_synthesis?.final_sentiment ?? 'Neutral';
  const categoryProbs = diagnosticResult?.naive_bayes?.probabilities ?? { Facilities: 0, Staff: 0, Collection: 0, 'Other/Uncategorized': 0 };
  const finalCategory = diagnosticResult?.naive_bayes?.final_category ?? 'Other/Uncategorized';
  const rawWinner = diagnosticResult?.naive_bayes?.raw_winner ?? 'Other/Uncategorized';
  const fallbackApplied = diagnosticResult?.naive_bayes?.fallback_applied ?? false;
  const extractedFeatures = diagnosticResult?.naive_bayes?.extracted_features ?? [];
  const clauses = diagnosticResult?.clauses ?? [];

  // formula: gauge position % = Math.max(0, Math.min(100, ((score + 1.0) / 2.0) * 100))
  const gaugePercent = Math.max(0, Math.min(100, ((combinedScore + 1.0) / 2.0) * 100));

  const getSentimentTheme = (s) => {
    if (s === 'Positive') return { text: '#107c41', bg: '#eafaf1', border: '#b7ebc9' };
    if (s === 'Negative') return { text: '#be123c', bg: '#fff1f2', border: '#fecdd3' };
    return { text: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
  };

  const getCategoryColor = (c) => {
    if (c === 'Facilities') return '#2563eb';
    if (c === 'Staff') return '#ea580c';
    if (c === 'Collection') return '#9333ea';
    return '#64748b';
  };

  return (
    <Header>
      {(toggleDrawer) => (
        <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
          <TopBar
            title="Henry Luce III Library"
            onMenuClick={toggleDrawer}
            subtitle="AI MODEL EXPLAINER & SCORE COMPUTATION"
          />

          <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#eef1f6', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
            {/* navigation bar */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 2.2 },
                mb: 2.5,
                borderRadius: '16px',
                bgcolor: '#ffffff',
                border: '1.5px solid #d9e2ec',
                borderTop: '3.5px solid #f69d1b',
                boxShadow: '0 2px 10px rgba(22, 50, 79, 0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: { xs: 19, md: 22 },
                      fontWeight: 800,
                      color: '#16324f',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    AI Model Explainer & Mathematical Computation Studio
                  </Typography>
                  <Chip
                    label="Academic Defense Validation"
                    size="small"
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      backgroundColor: '#fff8eb',
                      color: '#c2410c',
                      fontWeight: 700,
                      border: '1px solid #fed7aa',
                      fontSize: '0.72rem',
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 13,
                    color: '#64748b',
                    fontWeight: 500,
                    mt: 0.3,
                  }}
                >
                  Interactive two-track diagnostic workbench for CardiffNLP Twitter-RoBERTa sentiment fusion and Multinomial Naïve Bayes classification
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                <Tooltip title={isLiveConnected ? 'Connected directly to Flask ML service (Port 5001)' : 'Running client-side mathematical simulation fallback'}>
                  <Chip
                    icon={isLiveConnected ? <CheckCircleIcon sx={{ fontSize: '1rem !important', color: '#107c41 !important' }} /> : <WarningIcon sx={{ fontSize: '1rem !important', color: '#f69d1b !important' }} />}
                    label={isLiveConnected ? 'Live ML Model (Port 5001)' : 'Simulation Engine Active'}
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      backgroundColor: isLiveConnected ? '#eafaf1' : '#fff8eb',
                      color: isLiveConnected ? '#107c41' : '#c2410c',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      border: `1px solid ${isLiveConnected ? '#b7ebc9' : '#fed7aa'}`,
                    }}
                  />
                </Tooltip>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon sx={{ fontSize: 17 }} />}
                  onClick={loadSubmittedSurveys}
                  disabled={isFetchingSurveys}
                  sx={{
                    borderRadius: '10px',
                    height: 38,
                    px: 1.8,
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    borderColor: '#d9e2ec',
                    color: '#16324f',
                    bgcolor: '#ffffff',
                    borderWidth: '1.5px',
                    '&:hover': { borderColor: '#16324f', bgcolor: '#edf4fa', borderWidth: '1.5px' },
                  }}
                >
                  {isFetchingSurveys ? 'Refreshing...' : 'Refresh Corpus'}
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DashboardIcon sx={{ fontSize: 17 }} />}
                  onClick={() => navigate('/sentiment-dashboard')}
                  sx={{
                    borderRadius: '10px',
                    height: 38,
                    px: 2,
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: '#16324f',
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(22, 50, 79, 0.2)',
                    '&:hover': { bgcolor: '#0f243a' },
                  }}
                >
                  Sentiment Dashboard
                </Button>
              </Stack>
            </Paper>

            {/* workbench layout */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '380px 1fr',
                  lg: '420px 1fr',
                  xl: '450px 1fr',
                },
                gap: 2.5,
                width: '100%',
                alignItems: 'start',
              }}
            >
              {/* comments directory */}
              <Box sx={{ width: '100%' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 2.2 },
                    borderRadius: '16px',
                    bgcolor: '#ffffff',
                    border: '1.5px solid #d9e2ec',
                    boxShadow: '0 2px 10px rgba(22, 50, 79, 0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* mode switcher */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CommentIcon sx={{ color: '#16324f', fontSize: 20 }} />
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: '#16324f' }}>
                          Patron Feedback Directory
                        </Typography>
                      </Box>
                      <Chip
                        label={`${filteredComments.length} Records`}
                        size="small"
                        sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', bgcolor: '#edf4fa', color: '#16324f' }}
                      />
                    </Box>

                    {/* view toggle */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                      <Button
                        size="small"
                        variant={corpusMode === 'database' ? 'contained' : 'outlined'}
                        onClick={() => setCorpusMode('database')}
                        sx={{
                          flex: 1,
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: '8px',
                          py: 0.6,
                          bgcolor: corpusMode === 'database' ? '#16324f' : '#ffffff',
                          color: corpusMode === 'database' ? '#ffffff' : '#475569',
                          borderColor: '#cbd5e1',
                          '&:hover': { bgcolor: corpusMode === 'database' ? '#0f243a' : '#f8fafc' },
                        }}
                      >
                        Database Corpus
                      </Button>
                      <Button
                        size="small"
                        variant={corpusMode === 'presets' ? 'contained' : 'outlined'}
                        onClick={() => setCorpusMode('presets')}
                        sx={{
                          flex: 1,
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: '8px',
                          py: 0.6,
                          bgcolor: corpusMode === 'presets' ? '#f69d1b' : '#ffffff',
                          color: corpusMode === 'presets' ? '#ffffff' : '#475569',
                          borderColor: '#fed7aa',
                          '&:hover': { bgcolor: corpusMode === 'presets' ? '#df8208' : '#fff8eb' },
                        }}
                      >
                        Defense Presets
                      </Button>
                    </Stack>
                  </Box>

                  {/* database surveys view */}
                  {corpusMode === 'database' && (
                    <>
                      {/* search input */}
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Search feedback text, college, or ID..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setTablePage(1); }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          endAdornment: searchTerm ? (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setSearchTerm('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          mb: 1.5,
                          bgcolor: '#f8fafc',
                          borderRadius: '10px',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.82rem',
                          },
                        }}
                      />

                      {/* category chips */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.6, letterSpacing: 0.4 }}>
                          Category Filter:
                        </Typography>
                        <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                          {['All', 'Facilities', 'Staff', 'Collection'].map((cat) => (
                            <Chip
                              key={cat}
                              label={cat}
                              size="small"
                              clickable
                              onClick={() => { setFilterCategory(cat); setTablePage(1); }}
                              variant={filterCategory === cat ? 'filled' : 'outlined'}
                              sx={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 24,
                                backgroundColor: filterCategory === cat ? '#16324f' : 'transparent',
                                color: filterCategory === cat ? '#ffffff' : '#475569',
                                borderColor: '#cbd5e1',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>

                      {/* sentiment chips */}
                      <Box sx={{ mb: 1.8 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.6, letterSpacing: 0.4 }}>
                          Sentiment Filter:
                        </Typography>
                        <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                          {['All', 'Positive', 'Neutral', 'Negative'].map((s) => (
                            <Chip
                              key={s}
                              label={s}
                              size="small"
                              clickable
                              onClick={() => { setFilterSentiment(s); setTablePage(1); }}
                              variant={filterSentiment === s ? 'filled' : 'outlined'}
                              sx={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 24,
                                backgroundColor: filterSentiment === s ? (s === 'Positive' ? '#107c41' : s === 'Negative' ? '#be123c' : '#16324f') : 'transparent',
                                color: filterSentiment === s ? '#ffffff' : '#475569',
                                borderColor: '#cbd5e1',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>

                      <Divider sx={{ mb: 1.5 }} />

                      {/* feedback list */}
                      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, maxHeight: { xs: 420, lg: 'calc(100vh - 430px)' } }}>
                        {paginatedComments.length > 0 ? (
                          <Stack spacing={1.2}>
                            {paginatedComments.map((survey) => {
                              const sId = survey.Id || survey.id;
                              const isSelected = selectedSurveyId === sId;
                              const sentStyle = getSentimentTheme(survey.SentimentResult);
                              const catColor = getCategoryColor(survey.Category);

                              return (
                                <Paper
                                  key={sId}
                                  variant="outlined"
                                  onClick={() => handleSelectSubmittedComment(survey)}
                                  sx={{
                                    p: 1.4,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    bgcolor: isSelected ? 'rgba(246, 157, 27, 0.08)' : '#ffffff',
                                    borderColor: isSelected ? '#f69d1b' : '#e2e8f0',
                                    borderWidth: isSelected ? '1.8px' : '1px',
                                    borderLeft: isSelected ? '4px solid #f69d1b' : '4px solid transparent',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 3px 10px rgba(246, 157, 27, 0.12)' : 'none',
                                    '&:hover': {
                                      borderColor: isSelected ? '#f69d1b' : '#94a3b8',
                                      bgcolor: isSelected ? 'rgba(246, 157, 27, 0.12)' : '#f8fafc',
                                    },
                                  }}
                                >
                                  {/* header row */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.78rem', color: '#16324f' }}>
                                        #{sId}
                                      </Typography>
                                      <Chip
                                        label={survey.Clientele || 'Patron'}
                                        size="small"
                                        sx={{ fontFamily: 'Poppins, sans-serif', height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#334155' }}
                                      />
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: '#64748b' }} noWrap>
                                        {survey.College || 'General'}
                                      </Typography>
                                    </Box>

                                    {isSelected && (
                                      <Chip
                                        label="Active"
                                        size="small"
                                        sx={{
                                          fontFamily: 'Poppins, sans-serif',
                                          height: 18,
                                          fontSize: '0.62rem',
                                          fontWeight: 800,
                                          bgcolor: '#f69d1b',
                                          color: '#ffffff',
                                        }}
                                      />
                                    )}
                                  </Box>

                                  {/* message preview */}
                                  <Typography
                                    sx={{
                                      fontFamily: 'Poppins, sans-serif',
                                      fontSize: '0.8rem',
                                      color: '#1e293b',
                                      fontWeight: isSelected ? 600 : 400,
                                      lineHeight: 1.35,
                                      mb: 0.8,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    "{survey.Message}"
                                  </Typography>

                                  {/* category and sentiment tags */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                    <Stack direction="row" spacing={0.6}>
                                      <Chip
                                        label={survey.Category || 'Other'}
                                        size="small"
                                        sx={{
                                          fontFamily: 'Poppins, sans-serif',
                                          height: 20,
                                          fontSize: '0.64rem',
                                          fontWeight: 700,
                                          bgcolor: `${catColor}15`,
                                          color: catColor,
                                          border: `1px solid ${catColor}30`,
                                        }}
                                      />
                                      <Chip
                                        label={survey.SentimentResult || 'Neutral'}
                                        size="small"
                                        sx={{
                                          fontFamily: 'Poppins, sans-serif',
                                          height: 20,
                                          fontSize: '0.64rem',
                                          fontWeight: 700,
                                          bgcolor: sentStyle.bg,
                                          color: sentStyle.text,
                                          border: `1px solid ${sentStyle.border}`,
                                        }}
                                      />
                                    </Stack>

                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.64rem', color: '#94a3b8' }}>
                                      {survey.DateSubmitted ? String(survey.DateSubmitted).substring(0, 10) : ''}
                                    </Typography>
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#64748b', fontSize: '0.82rem' }}>
                              No comments matched your filter.
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* pagination */}
                      {filteredComments.length > rowsPerPage && (
                        <Box sx={{ pt: 1.5, mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                          <Pagination
                            count={Math.ceil(filteredComments.length / rowsPerPage)}
                            page={tablePage}
                            onChange={(e, p) => setTablePage(p)}
                            size="small"
                            color="primary"
                            sx={{
                              '& .MuiPaginationItem-root': {
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: '0.75rem',
                              },
                            }}
                          />
                        </Box>
                      )}
                    </>
                  )}

                  {/* presets view */}
                  {corpusMode === 'presets' && (
                    <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#64748b', mb: 1.5 }}>
                        Click any benchmark case to test how the pipeline handles edge cases (e.g. HVAC complaints, compound conjunction pivots, accession mismatches).
                      </Typography>

                      <Stack spacing={1.2}>
                        {QUICK_PRESETS.map((preset) => {
                          const isSelected = selectedSurveyId === preset.id;
                          const catColor = getCategoryColor(preset.category);

                          return (
                            <Paper
                              key={preset.id}
                              variant="outlined"
                              onClick={() => handleSelectPreset(preset)}
                              sx={{
                                p: 1.5,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                bgcolor: isSelected ? 'rgba(246, 157, 27, 0.08)' : '#ffffff',
                                borderColor: isSelected ? '#f69d1b' : '#e2e8f0',
                                borderWidth: isSelected ? '1.8px' : '1px',
                                borderLeft: isSelected ? '4px solid #f69d1b' : '4px solid transparent',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  borderColor: isSelected ? '#f69d1b' : '#94a3b8',
                                  bgcolor: isSelected ? 'rgba(246, 157, 27, 0.12)' : '#f8fafc',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.82rem', color: '#16324f' }}>
                                  {preset.title}
                                </Typography>
                                <Chip
                                  label={preset.category}
                                  size="small"
                                  sx={{
                                    fontFamily: 'Poppins, sans-serif',
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    bgcolor: `${catColor}15`,
                                    color: catColor,
                                  }}
                                />
                              </Box>

                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#334155', fontStyle: 'italic', mb: 0.8 }}>
                                "{preset.text}"
                              </Typography>

                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: '#94a3b8' }}>
                                Benchmark 10 Likert ratings preset applied
                              </Typography>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* diagnostic studio */}
              <Box sx={{ width: '100%', minWidth: 0 }}>
                <Stack spacing={2.5} sx={{ width: '100%' }}>
                  {/* active feedback header */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 2.2 },
                      borderRadius: '16px',
                      bgcolor: '#ffffff',
                      border: '1.5px solid #d9e2ec',
                      boxShadow: '0 2px 10px rgba(22, 50, 79, 0.04)',
                    }}
                  >
                    {/* header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RateReviewIcon sx={{ color: '#f69d1b', fontSize: 24 }} />
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: '#16324f' }}>
                          {selectedMeta ? `Selected Feedback: Record #${selectedMeta.id}` : 'Active Patron Statement'}
                        </Typography>
                        {selectedMeta && (
                          <Chip
                            label={`${selectedMeta.clientele || 'Patron'} • ${selectedMeta.college || 'General'}`}
                            size="small"
                            sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', bgcolor: '#edf4fa', color: '#16324f' }}
                          />
                        )}
                      </Box>

                      {/* recalculate controls */}
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={autoCalculate}
                              onChange={(e) => setAutoCalculate(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                              Auto-Recalculate
                            </Typography>
                          }
                        />

                        <Button
                          variant="contained"
                          size="small"
                          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                          onClick={() => executeExplainPipeline(inputText, ratings, confidenceThreshold)}
                          disabled={isLoading}
                          sx={{
                            fontFamily: 'Poppins, sans-serif',
                            bgcolor: '#16324f',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 1.8,
                            py: 0.5,
                            borderRadius: '8px',
                            '&:hover': { bgcolor: '#0f243a' },
                          }}
                        >
                          {isLoading ? 'Computing...' : 'Re-Run'}
                        </Button>
                      </Stack>
                    </Box>

                    {/* feedback quote */}
                    <Box
                      sx={{
                        p: 1.8,
                        borderRadius: '12px',
                        bgcolor: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                        <QuoteIcon sx={{ color: '#f69d1b', fontSize: 26, mt: 0.1, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: 600,
                              color: '#1e293b',
                              fontStyle: 'italic',
                              fontSize: '0.92rem',
                              lineHeight: 1.5,
                            }}
                          >
                            "{inputText || '(No feedback message provided)'}"
                          </Typography>

                          {/* metadata tags */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.2, flexWrap: 'wrap' }}>
                            {selectedMeta?.storedCategory && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Database Stored: ${selectedMeta.storedCategory} • ${selectedMeta.storedSentiment}`}
                                sx={{
                                  fontFamily: 'Poppins, sans-serif',
                                  fontWeight: 600,
                                  fontSize: '0.68rem',
                                  color: '#64748b',
                                  borderColor: '#cbd5e1',
                                }}
                              />
                            )}

                            <Chip
                              size="small"
                              label={`Live Computed: ${finalCategory} • ${finalSentiment} (${combinedScore > 0 ? `+${combinedScore.toFixed(2)}` : combinedScore.toFixed(2)})`}
                              sx={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                bgcolor: getSentimentTheme(finalSentiment).bg,
                                color: getSentimentTheme(finalSentiment).text,
                                border: `1px solid ${getSentimentTheme(finalSentiment).border}`,
                              }}
                            />

                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: '#94a3b8' }}>
                              Word Count: {inputText.trim().split(/\s+/).filter(Boolean).length} | Clauses: {clauses.length}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  {/* kpi summary cards */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                      },
                      gap: 2,
                      width: '100%',
                      mb: 0.5,
                    }}
                  >
                    {/* formula: final score = (r_avg * 0.5) + (roberta * 0.5) */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: '14px',
                        bgcolor: '#ffffff',
                        border: '1.5px solid #d9e2ec',
                        borderTop: `3.5px solid ${getSentimentTheme(finalSentiment).text}`,
                        boxShadow: '0 2px 8px rgba(22, 50, 79, 0.03)',
                        minHeight: 145,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                            Final Hybrid Score
                          </Typography>
                          <CalculateIcon sx={{ fontSize: 18, color: getSentimentTheme(finalSentiment).text }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.8 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: getSentimentTheme(finalSentiment).text }}>
                            {combinedScore > 0 ? `+${combinedScore.toFixed(2)}` : combinedScore.toFixed(2)}
                          </Typography>
                          <Chip
                            label={finalSentiment.toUpperCase()}
                            size="small"
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              height: 20,
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              bgcolor: getSentimentTheme(finalSentiment).bg,
                              color: getSentimentTheme(finalSentiment).text,
                              border: `1px solid ${getSentimentTheme(finalSentiment).border}`,
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: '#64748b', mt: 1 }}>
                        S = (R_avg × 0.5) + (BERT × 0.5)
                      </Typography>
                    </Paper>

                    {/* formula: r_avg = sum / count */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: '14px',
                        bgcolor: '#ffffff',
                        border: '1.5px solid #d9e2ec',
                        borderTop: '3.5px solid #f69d1b',
                        boxShadow: '0 2px 8px rgba(22, 50, 79, 0.03)',
                        minHeight: 145,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                            Likert Survey Mean
                          </Typography>
                          <ThumbUpIcon sx={{ fontSize: 18, color: '#f69d1b' }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.8 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: rAvg > 0 ? '#107c41' : rAvg < 0 ? '#be123c' : '#f69d1b' }}>
                            {rAvg > 0 ? `+${rAvg.toFixed(2)}` : rAvg.toFixed(2)}
                          </Typography>
                          <Chip
                            label={diagnosticResult?.likert_simulation?.emoji_sentiment || 'Neutral'}
                            size="small"
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              height: 20,
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              bgcolor: '#fff8eb',
                              color: '#c2410c',
                              border: '1px solid #fed7aa',
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: '#64748b', mt: 1 }}>
                        From 10 patron Likert responses
                      </Typography>
                    </Paper>

                    {/* roberta polarity score */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: '14px',
                        bgcolor: '#ffffff',
                        border: '1.5px solid #d9e2ec',
                        borderTop: '3.5px solid #16324f',
                        boxShadow: '0 2px 8px rgba(22, 50, 79, 0.03)',
                        minHeight: 145,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                            RoBERTa AI Polarity
                          </Typography>
                          <PsychologyIcon sx={{ fontSize: 18, color: '#16324f' }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.8 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: bertScore > 0 ? '#107c41' : bertScore < 0 ? '#be123c' : '#16324f' }}>
                            {bertScore > 0 ? `+${bertScore.toFixed(1)}` : bertScore.toFixed(1)}
                          </Typography>
                          <Chip
                            label={`${diagnosticResult?.roberta?.sentiment || 'Neutral'} (${((diagnosticResult?.roberta?.confidence || 0) * 100).toFixed(0)}%)`}
                            size="small"
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              height: 20,
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              bgcolor: '#edf4fa',
                              color: '#16324f',
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: '#64748b', mt: 1 }}>
                        {diagnosticResult?.roberta?.aggregation_strategy || 'CardiffNLP Model'}
                      </Typography>
                    </Paper>

                    {/* predicted category */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: '14px',
                        bgcolor: '#ffffff',
                        border: '1.5px solid #d9e2ec',
                        borderTop: `3.5px solid ${getCategoryColor(finalCategory)}`,
                        boxShadow: '0 2px 8px rgba(22, 50, 79, 0.03)',
                        minHeight: 145,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                            Naïve Bayes Category
                          </Typography>
                          <CategoryIcon sx={{ fontSize: 18, color: getCategoryColor(finalCategory) }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.8 }}>
                          <Typography
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              fontSize: '1.4rem',
                              fontWeight: 800,
                              color: getCategoryColor(finalCategory),
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {finalCategory}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: fallbackApplied ? '#be123c' : '#107c41', fontWeight: 600, mt: 1 }}>
                        {fallbackApplied ? 'Fallback Applied (< 0.45)' : `${((diagnosticResult?.naive_bayes?.final_confidence || 0) * 100).toFixed(1)}% Confirmed`}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* score breakdown: why this sentiment / category */}
                  {(() => {
                    const hasComment = diagnosticResult?.hybrid_synthesis?.has_comment ?? true;
                    const fmt = (n) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

                    // sentiment points
                    const rPts = hasComment ? rAvg * 0.5 : rAvg;
                    const bPts = hasComment ? bertScore * 0.5 : 0;
                    const sTheme = getSentimentTheme(finalSentiment);
                    const sentimentReason =
                      combinedScore > 0.15 ? `${fmt(combinedScore)} is above +0.15, so Positive`
                        : combinedScore < -0.15 ? `${fmt(combinedScore)} is below -0.15, so Negative`
                          : `${fmt(combinedScore)} is between -0.15 and +0.15, so Neutral`;

                    // category points
                    const catColor = getCategoryColor(finalCategory);
                    const ranked = Object.entries(categoryProbs).sort((a, b) => b[1] - a[1]);
                    const [topName, topProb] = ranked[0] || ['-', 0];
                    const [secondName, secondProb] = ranked[1] || ['-', 0];
                    const margin = (topProb - secondProb) * 100;

                    const Row = ({ label, value, bold }) => (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: bold ? 'none' : '1px dashed #e2e8f0' }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#475569', fontWeight: bold ? 800 : 500 }}>{label}</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#16324f', fontWeight: bold ? 800 : 600 }}>{value}</Typography>
                      </Box>
                    );

                    return (
                      <Paper elevation={0} sx={{ p: 2.2, borderRadius: '16px', bgcolor: '#ffffff', border: '1.5px solid #d9e2ec', borderTop: '3.5px solid #16324f', boxShadow: '0 2px 10px rgba(22, 50, 79, 0.04)' }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#16324f', mb: 1.5 }}>
                          Score Breakdown: Why this result?
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                          {/* sentiment side */}
                          <Box>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>
                              Sentiment Points
                            </Typography>
                            <Row label={hasComment ? 'Likert mean (R_avg × 0.50)' : 'Likert mean (R_avg)'} value={fmt(rPts)} />
                            <Row label={`RoBERTa ${diagnosticResult?.roberta?.sentiment || 'Neutral'} (${((diagnosticResult?.roberta?.confidence || 0) * 100).toFixed(0)}% confidence, × 0.50)`} value={fmt(bPts)} />
                            <Row label="Final score" value={fmt(combinedScore)} bold />

                            {/* -1 to +1 scale with the ±0.15 neutral band */}
                            <Box sx={{ position: 'relative', height: 10, mt: 1.5, borderRadius: 5, bgcolor: '#e2e8f0', overflow: 'hidden' }}>
                              <Box sx={{ position: 'absolute', left: 0, width: '42.5%', height: '100%', bgcolor: '#fecdd3' }} />
                              <Box sx={{ position: 'absolute', left: '42.5%', width: '15%', height: '100%', bgcolor: '#cbd5e1' }} />
                              <Box sx={{ position: 'absolute', right: 0, width: '42.5%', height: '100%', bgcolor: '#b7ebc9' }} />
                            </Box>
                            <Box sx={{ position: 'relative', height: 14 }}>
                              <Box sx={{ position: 'absolute', left: `${gaugePercent}%`, transform: 'translateX(-50%)', top: -14, width: 4, height: 18, borderRadius: 2, bgcolor: sTheme.text }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'Poppins, sans-serif' }}>
                              <span>-1.0 Negative</span><span>Neutral</span><span>Positive +1.0</span>
                            </Box>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: sTheme.text, fontWeight: 700, mt: 1 }}>
                              {sentimentReason}
                            </Typography>
                          </Box>

                          {/* category side */}
                          <Box>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>
                              Category Confidence
                            </Typography>
                            <Row label={`Top class: ${topName}`} value={`${(topProb * 100).toFixed(1)}%`} />
                            <Row label={`Runner-up: ${secondName}`} value={`${(secondProb * 100).toFixed(1)}%`} />
                            <Row label="Lead over runner-up" value={`${margin.toFixed(1)} pts`} />
                            <Row label="Threshold (τ)" value={`${(confidenceThreshold * 100).toFixed(0)}%`} />

                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, topProb * 100)}
                              sx={{ height: 10, mt: 1.5, borderRadius: 5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: catColor } }}
                            />
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', fontWeight: 700, mt: 1, color: fallbackApplied ? '#be123c' : '#107c41' }}>
                              {fallbackApplied
                                ? `${(topProb * 100).toFixed(1)}% is below ${(confidenceThreshold * 100).toFixed(0)}%, so Other/Uncategorized`
                                : `${(topProb * 100).toFixed(1)}% meets the ${(confidenceThreshold * 100).toFixed(0)}% threshold, so ${finalCategory}`}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })()}

                  {/* diagnostic tabs */}
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: '16px',
                      bgcolor: '#ffffff',
                      border: '1.5px solid #d9e2ec',
                      boxShadow: '0 2px 10px rgba(22, 50, 79, 0.04)',
                      overflow: 'hidden',
                    }}
                  >
                    <Tabs
                      value={studioTab}
                      onChange={(e, val) => setStudioTab(val)}
                      textColor="primary"
                      indicatorColor="primary"
                      sx={{
                        px: 2,
                        borderBottom: '1px solid #e2e8f0',
                        '& .MuiTab-root': {
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '0.85rem',
                          py: 1.6,
                        },
                      }}
                    >
                      <Tab icon={<CalculateIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Hybrid Sentiment Synthesis (Track 2)" />
                      <Tab icon={<ScienceIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Category Naïve Bayes (Track 1)" />
                      <Tab icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Interactive What-If Sandbox" />
                    </Tabs>

                    <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                      {/* sentiment synthesis tab */}
                      {studioTab === 0 && (
                        <Stack spacing={2.8}>
                          {/* formula: 50/50 fusion steps */}
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#16324f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FunctionsIcon sx={{ fontSize: 18, color: '#f69d1b' }} /> Mathematical 50/50 Hybrid Formula Synthesis:
                            </Typography>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#64748b', mb: 1.5 }}>
                              Combines the patron's 10 Likert responses with the transformer AI text polarity using equal weighting:
                            </Typography>

                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  sm: '1fr auto 1fr auto 1fr',
                                },
                                alignItems: 'center',
                                gap: 1.5,
                                width: '100%',
                              }}
                            >
                              {/* survey mean */}
                              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: '10px', bgcolor: '#ffffff', borderColor: '#d9e2ec' }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                  Likert Mean (R_avg)
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: '#f69d1b', my: 0.2 }}>
                                  {rAvg > 0 ? `+${rAvg.toFixed(2)}` : rAvg.toFixed(2)}
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#475569' }}>
                                  Weight: 50% (× 0.50)
                                </Typography>
                              </Paper>

                              <Box sx={{ textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#64748b' }}>+</Typography>
                              </Box>

                              {/* roberta score */}
                              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: '10px', bgcolor: '#ffffff', borderColor: '#d9e2ec' }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                  RoBERTa Score (BERT)
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: '#16324f', my: 0.2 }}>
                                  {bertScore > 0 ? `+${bertScore.toFixed(1)}` : bertScore.toFixed(1)}
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#475569' }}>
                                  Weight: 50% (× 0.50)
                                </Typography>
                              </Paper>

                              <Box sx={{ textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#64748b' }}>=</Typography>
                              </Box>

                              {/* final score */}
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  textAlign: 'center',
                                  borderRadius: '10px',
                                  bgcolor: getSentimentTheme(finalSentiment).bg,
                                  borderColor: getSentimentTheme(finalSentiment).border,
                                  borderWidth: '1.5px',
                                }}
                              >
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', fontWeight: 800, color: getSentimentTheme(finalSentiment).text, textTransform: 'uppercase' }}>
                                  Final Score (S)
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: getSentimentTheme(finalSentiment).text, my: 0.2 }}>
                                  {combinedScore > 0 ? `+${combinedScore.toFixed(2)}` : combinedScore.toFixed(2)}
                                </Typography>
                                <Chip
                                  label={finalSentiment}
                                  size="small"
                                  sx={{
                                    fontFamily: 'Poppins, sans-serif',
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    bgcolor: getSentimentTheme(finalSentiment).text,
                                    color: '#ffffff',
                                  }}
                                />
                              </Paper>
                            </Box>

                            {/* formula: arithmetic substitution */}
                            <Box sx={{ mt: 1.5, p: 1, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.74rem', color: '#334155', fontWeight: 600 }}>
                                Arithmetic Calculation: {diagnosticResult?.hybrid_synthesis?.arithmetic_substitution || `(${rAvg.toFixed(2)} × 0.50) + (${bertScore.toFixed(2)} × 0.50) = ${combinedScore.toFixed(2)}`}
                              </Typography>
                            </Box>
                          </Box>

                          {/* gauge: decision boundary [-0.15, +0.15] */}
                          <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13.5, color: '#16324f', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SpeedIcon sx={{ fontSize: 18, color: '#16324f' }} /> Decision Boundary Continuum & Zone Classification:
                              </Typography>
                              <Chip
                                label={`Score: ${combinedScore > 0 ? `+${combinedScore.toFixed(2)}` : combinedScore.toFixed(2)} → ${finalSentiment}`}
                                size="small"
                                sx={{
                                  fontFamily: 'Poppins, sans-serif',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  bgcolor: getSentimentTheme(finalSentiment).bg,
                                  color: getSentimentTheme(finalSentiment).text,
                                  border: `1px solid ${getSentimentTheme(finalSentiment).border}`,
                                }}
                              />
                            </Box>

                            {/* spectrum bar */}
                            <Box sx={{ position: 'relative', pt: 3.5, pb: 2.5, px: 3.5 }}>
                              <Box
                                sx={{
                                  height: 14,
                                  borderRadius: 7,
                                  background: 'linear-gradient(to right, #e11d48 0%, #fb7185 42.5%, #f69d1b 42.5%, #fed7aa 50%, #f69d1b 57.5%, #34d399 57.5%, #107c41 100%)',
                                  position: 'relative',
                                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
                                }}
                              >
                                {/* decision boundaries (-0.15 and +0.15) */}
                                <Box sx={{ position: 'absolute', left: '42.5%', top: -6, bottom: -6, width: 2, bgcolor: '#16324f' }} />
                                <Box sx={{ position: 'absolute', left: '57.5%', top: -6, bottom: -6, width: 2, bgcolor: '#16324f' }} />
                                <Box sx={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, bgcolor: '#64748b', opacity: 0.5 }} />

                                {/* gauge needle */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: `${Math.max(2, Math.min(98, gaugePercent))}%`,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: '#ffffff',
                                    border: `3.5px solid ${getSentimentTheme(finalSentiment).text}`,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    transition: 'left 0.3s ease-out',
                                    zIndex: 4,
                                  }}
                                />
                              </Box>

                              {/* score tag */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: `${Math.max(6, Math.min(94, gaugePercent))}%`,
                                  top: 6,
                                  transform: 'translateX(-50%)',
                                  transition: 'left 0.3s ease-out',
                                  zIndex: 5,
                                }}
                              >
                                <Paper
                                  elevation={2}
                                  sx={{
                                    px: 0.8,
                                    py: 0.2,
                                    bgcolor: '#16324f',
                                    color: '#ffffff',
                                    borderRadius: '4px',
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 700,
                                    fontSize: '0.68rem',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {combinedScore > 0 ? `+${combinedScore.toFixed(2)}` : combinedScore.toFixed(2)}
                                </Paper>
                              </Box>

                              {/* zone legend */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.8, px: 0.5 }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#be123c', fontWeight: 700, fontSize: '0.7rem' }}>
                                  -1.00 (Negative Zone)
                                </Typography>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography
                                    sx={{
                                      fontFamily: 'Poppins, sans-serif',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      color: '#c2410c',
                                      bgcolor: '#fff8eb',
                                      px: 1,
                                      py: 0.2,
                                      borderRadius: '6px',
                                      border: '1px solid #fed7aa',
                                    }}
                                  >
                                    Neutral Buffer [-0.15 to +0.15]
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#107c41', fontWeight: 700, fontSize: '0.7rem' }}>
                                  +1.00 (Positive Zone)
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* 10 likert questions */}
                          <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1.5px solid #d9e2ec' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                              <Box>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#16324f' }}>
                                  10-Question Patron Survey Ratings (Layer 1)
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: '#64748b' }}>
                                  Rated using standard numeric Likert scale (5 to 1, or N/A to exclude). Click numbers to test live:
                                </Typography>
                              </Box>
                              <Chip
                                label={`Survey Mean: R_avg = ${rAvg > 0 ? `+${rAvg.toFixed(2)}` : rAvg.toFixed(2)} (${diagnosticResult?.likert_simulation?.valid_count ?? 10} Valid)`}
                                size="small"
                                sx={{
                                  fontFamily: 'Poppins, sans-serif',
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  bgcolor: '#fff8eb',
                                  color: '#c2410c',
                                  border: '1px solid #fed7aa',
                                }}
                              />
                            </Box>

                            <Stack spacing={1.2}>
                              {SURVEY_QUESTIONS.map((q, qIdx) => {
                                const currentRatingId = ratings[qIdx] || 'neutral';
                                const activeOpt = RATING_LEVELS.find(lvl => lvl.id === currentRatingId) || RATING_LEVELS[2];

                                return (
                                  <Paper
                                    key={q.id}
                                    variant="outlined"
                                    sx={{
                                      p: 1.2,
                                      borderRadius: '10px',
                                      bgcolor: '#f8fafc',
                                      borderColor: '#e2e8f0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      flexWrap: 'wrap',
                                      gap: 1.2,
                                    }}
                                  >
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#1e293b' }}>
                                        Q{q.id}. {q.title}
                                      </Typography>
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', color: '#64748b' }}>
                                        {q.text}
                                      </Typography>
                                    </Box>

                                    {/* rating selector */}
                                    <Stack direction="row" spacing={0.6} alignItems="center">
                                      {RATING_LEVELS.map((lvl) => {
                                        const isSelected = currentRatingId === lvl.id;

                                        return (
                                          <Tooltip
                                            key={lvl.id}
                                            title={`${lvl.label} (${lvl.ciscoLabel})${lvl.score !== null ? ` → ${lvl.score > 0 ? `+${lvl.score}` : lvl.score}` : ' → Excluded'}`}
                                          >
                                            <Box
                                              onClick={() => handleRatingChange(qIdx, lvl.id)}
                                              sx={{
                                                cursor: 'pointer',
                                                width: 32,
                                                height: 32,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontFamily: 'Poppins, sans-serif',
                                                fontWeight: 800,
                                                fontSize: lvl.ciscoLabel === 'N/A' ? '0.62rem' : '0.85rem',
                                                bgcolor: isSelected ? lvl.color : '#ffffff',
                                                color: isSelected ? '#ffffff' : '#334155',
                                                border: '1.5px solid',
                                                borderColor: isSelected ? lvl.color : '#cbd5e1',
                                                boxShadow: isSelected ? `0 2px 5px ${lvl.color}40` : 'none',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                  borderColor: lvl.color,
                                                  bgcolor: isSelected ? lvl.color : lvl.bg,
                                                },
                                              }}
                                            >
                                              {lvl.ciscoLabel}
                                            </Box>
                                          </Tooltip>
                                        );
                                      })}

                                      {/* selected rating label */}
                                      <Box sx={{ ml: 0.5, width: 85, textAlign: 'right' }}>
                                        <Chip
                                          label={activeOpt.ciscoLabel === 'N/A' ? 'N/A' : `${activeOpt.ciscoLabel} - ${activeOpt.label.split(' ')[0]}`}
                                          size="small"
                                          sx={{
                                            fontFamily: 'Poppins, sans-serif',
                                            height: 20,
                                            fontSize: '0.64rem',
                                            fontWeight: 700,
                                            bgcolor: activeOpt.bg,
                                            color: activeOpt.color,
                                            border: `1px solid ${activeOpt.border}`,
                                          }}
                                        />
                                      </Box>
                                    </Stack>
                                  </Paper>
                                );
                              })}
                            </Stack>
                          </Box>

                          {/* clause sentiment breakdown */}
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13.5, color: '#16324f', mb: 1 }}>
                              RoBERTa Transformer Text Polarity Breakdown (Layer 2):
                            </Typography>

                            {diagnosticResult?.split_triggered ? (
                              <Box sx={{ p: 1.5, bgcolor: '#fff8eb', borderRadius: '10px', border: '1px solid #fed7aa', mb: 1.5 }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#c2410c', mb: 0.6 }}>
                                  Contrast Conjunction Detected → "Most-Negative-Wins" Priority Rule Applied:
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.72rem', color: '#64748b', mb: 1 }}>
                                  When a patron statement presents conflicting sentiments across contrast words like <em>"however"</em>, <em>"but"</em>, or <em>"although"</em>, the library prioritization engine elevates negative clauses for immediate administrative remediation.
                                </Typography>

                                <Stack spacing={0.8}>
                                  {clauses.map((cl, cIdx) => (
                                    <Box
                                      key={cIdx}
                                      sx={{
                                        p: 1,
                                        bgcolor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #fed7aa',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: '#1e293b' }}>
                                        Clause {cIdx + 1}: "{cl.clause}"
                                      </Typography>
                                      <Chip
                                        label={`${cl.sentiment} (${(cl.confidence * 100).toFixed(0)}%)`}
                                        size="small"
                                        sx={{
                                          fontFamily: 'Poppins, sans-serif',
                                          height: 20,
                                          fontSize: '0.64rem',
                                          fontWeight: 700,
                                          bgcolor: cl.sentiment === 'Negative' ? '#fff1f2' : cl.sentiment === 'Positive' ? '#eafaf1' : '#f1f5f9',
                                          color: cl.sentiment === 'Negative' ? '#be123c' : cl.sentiment === 'Positive' ? '#107c41' : '#475569',
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            ) : (
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: '#64748b' }}>
                                Single clause statement analyzed directly without conjunction splitting. Strategy: Single Clause Analysis.
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      )}

                      {/* category classification tab */}
                      {studioTab === 1 && (
                        <Stack spacing={2.5}>
                          {/* step 1: text preprocessing and stemming */}
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13.5, color: '#16324f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CodeIcon sx={{ fontSize: 18, color: '#16324f' }} /> Step 1: Text Preprocessing & Porter Stemming
                            </Typography>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: '#64748b', mb: 1.5 }}>
                              Standardizes input text by removing URLs, handles, and punctuation before stemming word suffixes:
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, width: '100%' }}>
                              <Box>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', mb: 0.4 }}>
                                  Raw Input Text:
                                </Typography>
                                <Box sx={{ p: 1.2, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155', wordBreak: 'break-word' }}>
                                  "{inputText || '(Empty text)'}"
                                </Box>
                              </Box>

                              <Box>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#107c41', mb: 0.4 }}>
                                  Cleaned & Stemmed Tokens:
                                </Typography>
                                <Box sx={{ p: 1.2, bgcolor: '#eafaf1', borderRadius: '8px', border: '1px solid #b7ebc9', fontFamily: 'monospace', fontSize: '0.78rem', color: '#0b5a2f', wordBreak: 'break-word' }}>
                                  {diagnosticResult?.preprocessed_text ? `"${diagnosticResult.preprocessed_text}"` : '(No alphanumeric tokens)'}
                                </Box>
                              </Box>
                            </Box>
                          </Box>

                          {/* step 2: feature extraction and tf-idf weights */}
                          <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1.5px solid #d9e2ec' }}>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13.5, color: '#16324f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AnalyticsIcon sx={{ fontSize: 18, color: '#16324f' }} /> Step 2: Matched TF-IDF Features & Domain Vocabulary
                            </Typography>

                            {extractedFeatures.length > 0 ? (
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', maxHeight: 180 }}>
                                <Table size="small" stickyHeader>
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', py: 0.8 }}>Matched Token</TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', py: 0.8 }} align="right">TF-IDF Weight</TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.72rem', py: 0.8 }} align="center">Target Domain</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {extractedFeatures.map((feat, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>
                                          {feat.token}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#16324f', fontWeight: 700 }}>
                                          {feat.tfidf.toFixed(4)}
                                        </TableCell>
                                        <TableCell align="center">
                                          {feat.domain_category ? (
                                            <Chip
                                              label={feat.domain_category}
                                              size="small"
                                              sx={{
                                                fontFamily: 'Poppins, sans-serif',
                                                height: 18,
                                                fontSize: '0.62rem',
                                                fontWeight: 700,
                                                bgcolor: `${getCategoryColor(feat.domain_category)}15`,
                                                color: getCategoryColor(feat.domain_category),
                                              }}
                                            />
                                          ) : (
                                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.7rem', color: '#94a3b8' }}>—</Typography>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '0.78rem', fontFamily: 'Poppins, sans-serif' }}>
                                No non-zero TF-IDF vocabulary tokens detected in this statement.
                              </Alert>
                            )}
                          </Box>

                          {/* computation: posterior probability distribution */}
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13.5, color: '#16324f' }}>
                                Step 3: Posterior Probability Distribution P(C_k | X):
                              </Typography>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.72rem', color: '#64748b' }}>
                                Laplace Smoothing α = {diagnosticResult?.naive_bayes?.alpha ?? 1.0}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  sm: 'repeat(2, 1fr)',
                                  md: 'repeat(4, 1fr)',
                                },
                                gap: 1.5,
                                width: '100%',
                              }}
                            >
                              {['Facilities', 'Staff', 'Collection', 'Other/Uncategorized'].map((catKey) => {
                                const prob = categoryProbs[catKey] || 0.0;
                                const percent = Math.min(100, Math.max(0, prob * 100));
                                const isFinal = finalCategory === catKey;
                                const color = getCategoryColor(catKey);

                                return (
                                  <Paper
                                    key={catKey}
                                    variant="outlined"
                                    sx={{
                                      p: 1.5,
                                      borderRadius: '10px',
                                      borderColor: isFinal ? color : '#e2e8f0',
                                      bgcolor: isFinal ? `${color}08` : '#ffffff',
                                      borderWidth: isFinal ? '2px' : '1px',
                                      minHeight: 110,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#16324f' }}>
                                        {catKey}
                                      </Typography>
                                      {isFinal && (
                                        <Chip
                                          label="WINNER"
                                          size="small"
                                          sx={{ fontFamily: 'Poppins, sans-serif', height: 16, fontSize: '0.58rem', fontWeight: 800, bgcolor: color, color: '#ffffff' }}
                                        />
                                      )}
                                    </Box>

                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color, mb: 0.8 }}>
                                      {(prob * 100).toFixed(1)}%
                                    </Typography>

                                    <LinearProgress
                                      variant="determinate"
                                      value={percent}
                                      sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: '#e2e8f0',
                                        '& .MuiLinearProgress-bar': { bgcolor: color },
                                      }}
                                    />
                                  </Paper>
                                );
                              })}
                            </Box>

                            {/* fallback threshold */}
                            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#1e293b' }}>
                                  Fallback Guard Threshold (τ):
                                </Typography>
                                <Chip
                                  label={`${(confidenceThreshold * 100).toFixed(0)}% (0.${Math.round(confidenceThreshold * 100)})`}
                                  size="small"
                                  sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, bgcolor: '#16324f', color: '#ffffff', height: 20 }}
                                />
                              </Box>
                              <Slider
                                value={confidenceThreshold}
                                min={0.20}
                                max={0.80}
                                step={0.05}
                                onChange={(e, val) => setConfidenceThreshold(val)}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                                sx={{ color: '#16324f' }}
                              />
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', color: '#64748b' }}>
                                Rule: If winning class probability &lt; {(confidenceThreshold * 100).toFixed(0)}%, classify as <strong>Other/Uncategorized</strong> to prevent false positives.
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      )}

                      {/* what-if sandbox */}
                      {studioTab === 2 && (
                        <Stack spacing={2}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#16324f' }}>
                            Simulate Any Hypothetical Patron Feedback Message:
                          </Typography>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.78rem', color: '#64748b' }}>
                            Type or paste custom feedback to observe how CardiffNLP RoBERTa and Naïve Bayes evaluate the statement in real-time:
                          </Typography>

                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type any test patron feedback statement here..."
                            sx={{
                              bgcolor: '#f8fafc',
                              borderRadius: '10px',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: '0.88rem',
                              },
                            }}
                          />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setInputText('')}
                              sx={{
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: '8px',
                              }}
                            >
                              Clear Text
                            </Button>

                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => executeExplainPipeline(inputText, ratings, confidenceThreshold)}
                              disabled={isLoading}
                              sx={{
                                fontFamily: 'Poppins, sans-serif',
                                bgcolor: '#16324f',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: '8px',
                                px: 2,
                                '&:hover': { bgcolor: '#0f243a' },
                              }}
                            >
                              {isLoading ? 'Computing Pipeline...' : 'Run Pipeline'}
                            </Button>
                          </Box>
                        </Stack>
                      )}
                    </Box>
                  </Paper>
                </Stack>
              </Box>
            </Box>

            {/* footer */}
            <Box sx={{ mt: 4, mb: 1, textAlign: 'center', color: '#64748b' }}>
              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.72rem', fontWeight: 600 }}>
                Central Philippine University — Henry Luce III Library Management System
              </Typography>
              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.68rem', mt: 0.2 }}>
                Academic Examination Model Explainer & Mathematical Computation Studio | Cisco-Style Likert Integration
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Header>
  );
}