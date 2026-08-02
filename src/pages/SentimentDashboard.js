import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, Avatar, Chip
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  FilterAlt as FilterAltIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  Assessment as AssessmentIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend as BarLegend } from 'recharts';
import ReactWordcloud from 'react-wordcloud';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

// ── Easy on the eyes, soft light pastel palette ──────────────────────────────
const SENTIMENT_COLORS = {
  Positive: { bg: '#10b981', light: '#ecfdf5', text: '#047857', dot: '#34d399' },
  Neutral: { bg: '#f59e0b', light: '#fffbeb', text: '#b45309', dot: '#fbbf24' },
  Negative: { bg: '#f43f5e', light: '#fff1f2', text: '#be123c', dot: '#f87171' },
};

const CATEGORY_COLORS = {
  Facilities: { bg: '#0288d1', light: '#e0f2fe', text: '#0369a1', dot: '#38bdf8' },
  Staff: { bg: '#8b5cf6', light: '#f3e8ff', text: '#6b21a8', dot: '#c084fc' },
  Collection: { bg: '#f97316', light: '#fff7ed', text: '#c2410c', dot: '#fb923c' },
  'Other/Uncategorized': { bg: '#64748b', light: '#f8fafc', text: '#475569', dot: '#94a3b8' },
};

const CHART_COLORS = ['#34d399', '#fbbf24', '#f87171'];

const CLIENTELE_OPTIONS = ['Student', 'Faculty', 'Staff', 'Researcher', 'CPU Admin', 'Alumnus/Alumni'];

const COLLEGE_OPTIONS = [
  'CARES', 'CAS', 'CBA', 'CCS', 'COED', 'COE', 'CHM',
  'COL', 'CMLS', 'COM', 'CON', 'COP', 'COT', 'SGS',
  'SHS', 'JHS', 'ELEM', 'KINDER'
];

const CATEGORY_OPTIONS = ['Facilities', 'Staff', 'Collection', 'Other/Uncategorized'];

const RATING_SCORES = {
  very_satisfied: 1.0, satisfied: 0.5, neutral: 0.0,
  dissatisfied: -0.5, very_dissatisfied: -1.0, na: 0.0,
};

const getSurveyScore = (s) => {
  if (typeof s.SentimentScore === 'number' && !isNaN(s.SentimentScore)) {
    return s.SentimentScore;
  }

  const qList = [
    s.Question1, s.Question2, s.Question3, s.Question4, s.Question5,
    s.Question6, s.Question7, s.Question8, s.Question9, s.Question10
  ].filter(q => q != null && q !== 'na');

  const ratingAvg = qList.length > 0
    ? qList.reduce((sum, q) => sum + (RATING_SCORES[q] ?? 0), 0) / qList.length
    : 0;

  if (!s.Message || !s.Message.trim()) {
    return ratingAvg;
  }

  const bertScore = s.SentimentResult === 'Positive' ? 1 : s.SentimentResult === 'Negative' ? -1 : 0;
  return ratingAvg * 0.5 + bertScore * 0.5;
};

const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on',
  'for', 'it', 'this', 'that', 'i', 'we', 'you', 'my', 'our', 'with', 'be', 'have', 'has', 'very', 'so', 'too']);

const RECOMMENDATIONS = {
  Facilities: {
    moderate: 'Consider a facilities walkthrough to address recurring comfort/accessibility complaints (lighting, seating, temperature, cleanliness).',
    high: 'Facilities feedback is predominantly negative — prioritize an infrastructure audit and budget request for repairs/upgrades this term.',
  },
  Staff: {
    moderate: 'Some patrons report friction with staff interactions — a refresher on frontline service standards may help.',
    high: 'Staff-related complaints are high — recommend a service-quality review with librarians and targeted retraining.',
  },
  Collection: {
    moderate: 'Patrons are flagging gaps in available materials — review acquisition requests for undersupplied subject areas.',
    high: 'Collection dissatisfaction is high — conduct a collection audit and prioritize acquisitions for the most-requested subjects.',
  },
};

const CATEGORY_KEYWORDS = {
  Facilities: {
    aircon: 'poor air conditioning/temperature control',
    ac: 'air conditioning issues',
    temperature: 'temperature control issues',
    temp: 'temperature issues',
    lighting: 'insufficient lighting',
    light: 'lighting issues',
    wifi: 'unreliable wifi/internet connection',
    internet: 'unreliable internet connection',
    seating: 'insufficient or uncomfortable seating',
    seat: 'seating issues',
    chair: 'uncomfortable seating/chairs',
    table: 'workspace/table issues',
    cleanliness: 'cleanliness/sanitation concerns',
    clean: 'cleanliness concerns',
    restroom: 'restroom cleanliness/maintenance',
    toilet: 'restroom issues',
    noise: 'high noise levels affecting study',
    loud: 'noise levels',
  },
  Staff: {
    rude: 'patron friction with staff courtesy/attitude',
    slow: 'slow service response times',
    unhelpful: 'unhelpful staff assistance',
    attitude: 'staff attitude concerns',
    service: 'frontline service quality',
    retraining: 'staff retraining needs',
  },
  Collection: {
    outdated: 'outdated books/materials',
    old: 'outdated materials',
    missing: 'missing or unlocatable books',
    textbook: 'insufficient textbook copies',
    book: 'missing/unavailable books',
    journal: 'lack of recent research journals/e-resources',
    database: 'digital database access issues',
  },
};

const TopCommentsCard = ({ title, rows, accent, icon, lightBorder }) => (
  <Card elevation={0} sx={{
    borderRadius: 3.5,
    backgroundColor: '#ffffff',
    border: `1.5px solid ${lightBorder}`,
    flex: 1, minWidth: 300,
    transition: 'all 0.25s ease',
    '&:hover': {
      boxShadow: `0 8px 20px -6px ${accent}25`
    }
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
        <Avatar sx={{ bgcolor: `${accent}15`, color: accent, width: 34, height: 34, fontSize: 20 }}>
          {icon}
        </Avatar>
        <Typography sx={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: accent,
          letterSpacing: 0.5, textTransform: 'uppercase'
        }}>
          {title}
        </Typography>
      </Box>
      {rows.length === 0 ? (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', fontSize: 13, py: 2 }}>No comments yet.</Typography>
      ) : rows.map((row, i) => (
        <Box key={i} sx={{ py: 1.2, borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#1e293b', fontWeight: 500, lineHeight: 1.4 }}>
            "{row.Message}"
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.8 }}>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
              {row.Clientele} • {row.College}
            </Typography>
            <Chip
              label={row.topTerm ? `Word Freq: ${row.termScore} (${row.topTerm})` : `Word Freq: ${row.termScore || 0}`}
              size="small"
              sx={{
                height: 22, fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
                bgcolor: `${accent}15`, color: accent, border: `1px solid ${accent}30`
              }}
            />
          </Box>
        </Box>
      ))}
    </CardContent>
  </Card>
);

const selectSx = {
  backgroundColor: '#ffffff',
  borderRadius: 2.5,
  minWidth: 165,
  '& .MuiInputBase-root': {
    height: 46,
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    fontSize: 14,
    color: '#1e293b',
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    fontSize: 14,
    color: '#475569',
    '&.Mui-focused': {
      color: '#2563eb',
      fontWeight: 700,
    }
  },
  '& .MuiSelect-select': {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    fontSize: 14,
  }
};

const SentimentChip = ({ label }) => {
  const cfg = SENTIMENT_COLORS[label] || SENTIMENT_COLORS.Neutral;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.8,
      px: 1.5, py: 0.4, borderRadius: '20px',
      backgroundColor: cfg.light, border: `1.5px solid ${cfg.dot}60`,
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot }} />
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cfg.text, fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </Typography>
    </Box>
  );
};

const CategoryChip = ({ label }) => {
  const norm = label || 'Other/Uncategorized';
  const cfg = CATEGORY_COLORS[norm] || CATEGORY_COLORS['Other/Uncategorized'];
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.8,
      px: 1.5, py: 0.4, borderRadius: '20px',
      backgroundColor: cfg.light, border: `1.5px solid ${cfg.dot}60`,
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot }} />
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cfg.text, fontFamily: 'Poppins, sans-serif' }}>
        {norm}
      </Typography>
    </Box>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#1e293b" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SummaryCard = ({ title, value, subtitle, icon, color = '#3b82f6' }) => {
  return (
    <Card elevation={0} sx={{
      borderRadius: 3.5,
      backgroundColor: '#ffffff',
      border: '1.5px solid #e2e8f0',
      flex: 1, minWidth: 180,
      p: 2.5,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 10px 22px -8px rgba(0, 0, 0, 0.08)',
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48, fontSize: 24 }}>
          {icon}
        </Avatar>
      </Box>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 32, color: '#0f172a', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#334155', mt: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#64748b', mt: 0.5, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

const ROWS_PER_PAGE = 8;

const SentimentDashboard = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
      setLoggedInUser(savedUser);
      setShowLoginModal(false);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('loggedInUser', username);
      setLoggedInUser(username);
      setShowLoginModal(false);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser('');
    setShowLoginModal(true);
    setUsername('');
    setPassword('');
  };

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterClientele, setFilterClientele] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(0);
  const [sortOrder, setSortOrder] = useState('latest');
  const printRef = useRef();

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/surveys', {
        params: { startDate, endDate },
      });
      setSurveys(response.data);
      setPage(0);
    } catch (err) {
      console.error('Error fetching surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSurveys(); }, []); // eslint-disable-line

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review from the dashboard? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/surveys/${id}`);
        if (response.data.success) {
          setSurveys(prev => prev.filter(survey => survey.Id !== id));
          if (pageRows.length === 1 && page > 0) {
            setPage(p => p - 1);
          }
        }
      } catch (err) {
        console.error('Error deleting survey:', err);
        alert('An error occurred while attempting to delete this entry.');
      }
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setFilterClientele('');
    setFilterCollege('');
    setFilterSentiment('');
    setFilterCategory('');
    setSortOrder('latest');
    setTimeout(fetchSurveys, 0);
  };

  const filtered = surveys.filter(s => {
    if (!s.SentimentResult) return false;
    if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return false;
    if (filterCollege && s.College !== filterCollege) return false;
    if (filterSentiment && s.SentimentResult !== filterSentiment) return false;
    if (filterCategory && (s.Category || 'Other/Uncategorized') !== filterCategory) return false;
    return true;
  });

  const counts = { Positive: 0, Neutral: 0, Negative: 0 };
  const categoryCounts = { Facilities: 0, Staff: 0, Collection: 0, 'Other/Uncategorized': 0 };

  filtered.forEach(s => {
    if (counts[s.SentimentResult] !== undefined) counts[s.SentimentResult]++;
    const cat = s.Category || 'Other/Uncategorized';
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    } else {
      categoryCounts['Other/Uncategorized']++;
    }
  });
  const total = filtered.length;

  const chartData = [
    { name: 'Positive', value: counts.Positive },
    { name: 'Neutral', value: counts.Neutral },
    { name: 'Negative', value: counts.Negative },
  ].filter(d => d.value > 0);

  const categoryChartData = [
    { name: 'Facilities', value: categoryCounts.Facilities, color: CATEGORY_COLORS.Facilities.dot },
    { name: 'Staff', value: categoryCounts.Staff, color: CATEGORY_COLORS.Staff.dot },
    { name: 'Collection', value: categoryCounts.Collection, color: CATEGORY_COLORS.Collection.dot },
    { name: 'Other/Uncategorized', value: categoryCounts['Other/Uncategorized'], color: CATEGORY_COLORS['Other/Uncategorized'].dot },
  ].filter(d => d.value > 0);

  const reviewRows = [...filtered]
    .sort((a, b) => {
      const dateA = new Date(a.DateSubmitted);
      const dateB = new Date(b.DateSubmitted);
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
  const totalPages = Math.ceil(reviewRows.length / ROWS_PER_PAGE);
  const pageRows = reviewRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const hasActiveFilter = startDate || endDate || filterClientele || filterCollege || filterSentiment || filterCategory;

  const avgScore = filtered.length
    ? filtered.reduce((sum, s) => sum + getSurveyScore(s), 0) / filtered.length
    : 0;

  const monthlyData = (() => {
    const buckets = {};
    filtered.forEach(s => {
      if (!s.DateSubmitted) return;
      const d = new Date(s.DateSubmitted.replace ? s.DateSubmitted.replace(' ', 'T') : s.DateSubmitted);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!buckets[key]) buckets[key] = { month: key, Positive: 0, Neutral: 0, Negative: 0 };
      if (buckets[key][s.SentimentResult] !== undefined) buckets[key][s.SentimentResult]++;
    });
    return Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month));
  })();

  // ── Word/Term Frequency Ranking for Top Comments (Panelist Suggestion) ─────
  const termFrequencies = (() => {
    const freq = {};
    surveys.forEach(s => {
      if (!s.Message) return;
      const words = s.Message.toLowerCase().match(/[a-z']+/g) || [];
      words.forEach(w => {
        if (w.length < 3 || STOPWORDS.has(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    return freq;
  })();

  const scoreCommentByWordFrequency = (commentObj) => {
    if (!commentObj || !commentObj.Message) return { ...commentObj, termScore: 0, topTerm: '' };
    const words = commentObj.Message.toLowerCase().match(/[a-z']+/g) || [];
    const validWords = words.filter(w => w.length >= 3 && !STOPWORDS.has(w));
    const uniqueWords = Array.from(new Set(validWords));

    let totalScore = 0;
    let maxTerm = '';
    let maxTermFreq = 0;

    uniqueWords.forEach(w => {
      const f = termFrequencies[w] || 0;
      totalScore += f;
      if (f > maxTermFreq) {
        maxTermFreq = f;
        maxTerm = w;
      }
    });

    return {
      ...commentObj,
      termScore: totalScore,
      topTerm: maxTerm,
      maxTermFreq
    };
  };

  const positivePool = surveys.filter(s => {
    if (s.SentimentResult !== 'Positive' || !s.Message?.trim()) return false;
    if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return false;
    if (filterCollege && s.College !== filterCollege) return false;
    return true;
  });
  const negativePool = surveys.filter(s => {
    if (s.SentimentResult !== 'Negative' || !s.Message?.trim()) return false;
    if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return false;
    if (filterCollege && s.College !== filterCollege) return false;
    return true;
  });

  const topPositive = positivePool
    .map(scoreCommentByWordFrequency)
    .sort((a, b) => b.termScore - a.termScore)
    .slice(0, 5);

  const topNegative = negativePool
    .map(scoreCommentByWordFrequency)
    .sort((a, b) => b.termScore - a.termScore)
    .slice(0, 5);

  const wordCloudWords = (() => {
    const freq = {};
    surveys.forEach(s => {
      if (!s.Message) return;
      s.Message.toLowerCase().match(/[a-z']+/g)?.forEach(w => {
        if (w.length < 3 || STOPWORDS.has(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    return Object.entries(freq).map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value).slice(0, 60);
  })();

  const wordCloudOptions = {
    deterministic: true,
    randomSeed: 'hll-library-wordcloud',
    rotations: 1,
    rotationAngles: [0, 0],
    fontFamily: 'Poppins, sans-serif',
    fontSizes: [16, 44],
    padding: 3,
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'],
  };

  const categoryStats = (() => {
    const cats = {};
    filtered.forEach(s => {
      const cat = s.Category || 'Other/Uncategorized';
      if (!RECOMMENDATIONS[cat]) return;
      if (!cats[cat]) cats[cat] = { total: 0, negative: 0, items: [] };
      cats[cat].total++;
      cats[cat].items.push(s);
      if (s.SentimentResult === 'Negative') cats[cat].negative++;
    });

    return Object.entries(cats).map(([category, { total, negative, items }]) => {
      const pct = total ? Math.round((negative / total) * 100) : 0;
      let severity = null;
      if (pct >= 50) severity = 'high';
      else if (pct >= 30) severity = 'moderate';

      if (!severity) return null;

      const negativeItems = items.filter(s => s.SentimentResult === 'Negative');

      const kwCounts = {};
      const kwToKeyword = {};
      const dict = CATEGORY_KEYWORDS[category] || {};
      negativeItems.forEach(s => {
        if (!s.Message) return;
        const msgLower = s.Message.toLowerCase();
        Object.entries(dict).forEach(([kw, phrase]) => {
          if (msgLower.includes(kw)) {
            kwCounts[phrase] = (kwCounts[phrase] || 0) + 1;
            kwToKeyword[phrase] = kw;
          }
        });
      });

      const sortedKws = Object.entries(kwCounts).sort((a, b) => b[1] - a[1]);
      const matchedKeywords = sortedKws
        .slice(0, 3)
        .map(([phrase, count]) => `${phrase} (${count} mention${count > 1 ? 's' : ''})`);

      // Top Keyword Match (Panelist preference: base comments on top word frequency keyword)
      const primaryPhrase = sortedKws.length > 0 ? sortedKws[0][0] : '';
      const primaryKw = primaryPhrase ? (kwToKeyword[primaryPhrase] || '') : '';

      let matchingEvidences = [];
      if (primaryKw) {
        matchingEvidences = negativeItems.filter(s => s.Message && s.Message.toLowerCase().includes(primaryKw));
      }
      if (matchingEvidences.length < 3) {
        const remaining = negativeItems.filter(s => !matchingEvidences.includes(s));
        matchingEvidences = [...matchingEvidences, ...remaining];
      }

      const topEvidences = matchingEvidences
        .map(scoreCommentByWordFrequency)
        .sort((a, b) => b.termScore - a.termScore)
        .slice(0, 3);

      return { category, total, negative, pct, severity, matchedKeywords, primaryKw, topEvidences };
    }).filter(Boolean);
  })();

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert("No sentiment metrics data available to export.");
      return;
    }

    const summaryKPIs = [
      { 'Metric Indicator': 'Total Analyzed Responses', 'Count': total },
      { 'Metric Indicator': 'Positive Sentiments Count', 'Count': counts.Positive },
      { 'Metric Indicator': 'Neutral Sentiments Count', 'Count': counts.Neutral },
      { 'Metric Indicator': 'Negative Sentiments Count', 'Count': counts.Negative },
      { 'Metric Indicator': 'Facilities Category Count', 'Count': categoryCounts.Facilities },
      { 'Metric Indicator': 'Staff Category Count', 'Count': categoryCounts.Staff },
      { 'Metric Indicator': 'Collection Category Count', 'Count': categoryCounts.Collection },
      { 'Metric Indicator': 'Other/Uncategorized Count', 'Count': categoryCounts['Other/Uncategorized'] },
    ];

    const textDetails = reviewRows.map((row, index) => ({
      'No.': index + 1,
      'Clientele Group': row.Clientele || 'N/A',
      'College': row.College || 'N/A',
      'Text Response Inputted': row.Message || '',
      'Overall Sentiment': row.SentimentResult || '',
      'Category': row.Category || 'Other/Uncategorized',
      'Date Submitted': row.DateSubmitted ? new Date(row.DateSubmitted).toLocaleDateString() : 'N/A'
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryKPIs);
    const wsDetails = XLSX.utils.json_to_sheet(textDetails);

    const adjustWidths = (worksheet, data) => {
      const colWidths = [];
      data.forEach((row) => {
        Object.keys(row).forEach((key, colIndex) => {
          const valStr = row[key] ? row[key].toString() : '';
          const maxLen = Math.max(valStr.length, key.length);
          if (!colWidths[colIndex] || maxLen > colWidths[colIndex]) {
            colWidths[colIndex] = maxLen;
          }
        });
      });
      worksheet['!cols'] = colWidths.map(w => ({ wch: w + 4 }));
    };

    adjustWidths(wsSummary, summaryKPIs);
    adjustWidths(wsDetails, textDetails);

    XLSX.utils.book_append_sheet(workbook, wsSummary, "Analytics Summary");
    XLSX.utils.book_append_sheet(workbook, wsDetails, "Classified Responses Data");

    const dateStamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `HLL_Sentiment_Analysis_${dateStamp}.xlsx`);
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Sentiment Analysis Summary Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #000; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
            h2 { text-align: center; font-size: 15px; font-weight: normal; margin-bottom: 4px; color: #444; }
            p.daterange { text-align: center; font-size: 13px; color: #666; margin-bottom: 25px; }
            .summary { display: flex; justify-content: space-around; gap: 10px; margin-bottom: 25px; }
            .summary-box { border: 1px solid #ccc; border-radius: 8px; padding: 12px; text-align: center; flex: 1; }
            .summary-box .value { font-size: 24px; font-weight: bold; }
            .summary-box.pos .value { color: #047857; }
            .summary-box.neu .value { color: #b45309; }
            .summary-box.neg .value { color: #be123c; }
            .summary-box.tot .value { color: #1e3a8a; }
            .summary-box .label { font-size: 12px; color: #555; margin-top: 4px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
            th { background-color: #334155; color: white; padding: 8px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar
              title="Sentiment Dashboard"
              onMenuClick={toggleDrawer}
              subtitle="PATRON SATISFACTION — SENTIMENT ANALYSIS"
            />

            {!showLoginModal && (
              <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                {/* ── Modern Header Action Bar ───── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                      Henry Luce III Library Sentiment Analysis Dashboard
                    </Typography>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#475569', fontWeight: 500, mt: 0.5 }}>
                      Patron feedback sentiment breakdown, category distribution, and satisfaction analytics
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handlePrint}
                      startIcon={<PrintIcon />}
                      sx={{
                        borderRadius: 2.5,
                        height: 46,
                        px: 3.5,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 14,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderColor: '#cbd5e1',
                        color: '#334155',
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' }
                      }}
                    >
                      Print / Save PDF
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleExportExcel}
                      startIcon={<FileDownloadIcon />}
                      sx={{
                        borderRadius: 2.5,
                        height: 46,
                        px: 3.5,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 14,
                        fontWeight: 700,
                        textTransform: 'none',
                        bgcolor: '#059669',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                        '&:hover': { bgcolor: '#047857' }
                      }}
                    >
                      Export to Excel
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleLogout}
                      startIcon={<LogoutIcon />}
                      sx={{
                        borderRadius: 2.5,
                        height: 46,
                        px: 3,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 14,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderColor: '#fecdd3',
                        color: '#e11d48',
                        '&:hover': { bgcolor: '#fff1f2', borderColor: '#f87171' }
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                </Box>

                {/* ── Filter Controls Container ───── */}
                <Paper elevation={0} sx={{ mb: 3, borderRadius: 3.5, border: '1.5px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
                  <Box sx={{
                    bgcolor: '#334155',
                    px: 3, py: 1.8,
                    borderBottom: '3px solid #38bdf8',
                    display: 'flex', alignItems: 'center', gap: 1.2
                  }}>
                    <FilterAltIcon sx={{ fontSize: 22, color: '#38bdf8' }} />
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: 0.3 }}>
                      Filter & Analytics Controls
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      sx={selectSx}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      sx={selectSx}
                    />
                    <FormControl sx={selectSx}>
                      <InputLabel>Clientele</InputLabel>
                      <Select
                        value={filterClientele}
                        label="Clientele"
                        onChange={(e) => { setFilterClientele(e.target.value); setPage(0); }}
                      >
                        <MenuItem value="" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>All</MenuItem>
                        {CLIENTELE_OPTIONS.map(c => (
                          <MenuItem key={c} value={c.toLowerCase()} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>College</InputLabel>
                      <Select
                        value={filterCollege}
                        label="College"
                        onChange={(e) => { setFilterCollege(e.target.value); setPage(0); }}
                      >
                        <MenuItem value="" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>All</MenuItem>
                        {COLLEGE_OPTIONS.map(c => (
                          <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Sentiment</InputLabel>
                      <Select
                        value={filterSentiment}
                        label="Sentiment"
                        onChange={(e) => { setFilterSentiment(e.target.value); setPage(0); }}
                      >
                        <MenuItem value="" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>All</MenuItem>
                        <MenuItem value="Positive" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>Positive</MenuItem>
                        <MenuItem value="Neutral" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>Neutral</MenuItem>
                        <MenuItem value="Negative" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>Negative</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={filterCategory}
                        label="Category"
                        onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
                      >
                        <MenuItem value="" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>All</MenuItem>
                        {CATEGORY_OPTIONS.map(c => (
                          <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortOrder}
                        label="Sort By"
                        onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}
                      >
                        <MenuItem value="latest" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>Latest to Oldest</MenuItem>
                        <MenuItem value="oldest" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>Oldest to Latest</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      onClick={fetchSurveys}
                      sx={{ bgcolor: '#2563eb', px: 3.5, height: 46, borderRadius: 2.5, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                      Apply Filters
                    </Button>
                    {hasActiveFilter && (
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleClear}
                        sx={{ height: 46, px: 3, borderRadius: 2.5, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, borderColor: '#cbd5e1' }}
                      >
                        Reset
                      </Button>
                    )}
                  </Box>
                </Paper>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <>
                    {/* ── Top Metric KPI Cards Grid (Soft pastel avatars & clean cards) ───── */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2.5, mb: 3 }}>
                      <SummaryCard
                        title="Avg Satisfaction"
                        value={avgScore.toFixed(2)}
                        subtitle="Scale: -1.0 to +1.0"
                        icon={<StarIcon />}
                        color="#8b5cf6"
                      />
                      <SummaryCard
                        title="Positive"
                        value={counts.Positive}
                        subtitle={`${total > 0 ? Math.round((counts.Positive / total) * 100) : 0}% of responses`}
                        icon={<ThumbUpIcon />}
                        color="#10b981"
                      />
                      <SummaryCard
                        title="Neutral"
                        value={counts.Neutral}
                        subtitle={`${total > 0 ? Math.round((counts.Neutral / total) * 100) : 0}% of responses`}
                        icon={<SentimentSatisfiedIcon />}
                        color="#f59e0b"
                      />
                      <SummaryCard
                        title="Negative"
                        value={counts.Negative}
                        subtitle={`${total > 0 ? Math.round((counts.Negative / total) * 100) : 0}% of responses`}
                        icon={<ThumbDownIcon />}
                        color="#f43f5e"
                      />
                      <SummaryCard
                        title="Total Analyzed"
                        value={total}
                        subtitle="Survey responses"
                        icon={<AssessmentIcon />}
                        color="#3b82f6"
                      />
                    </Box>

                    {/* ── Top Positive & Negative Comments Grid ───── */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                      <TopCommentsCard title="Top 5 Positive Comments" rows={topPositive} accent="#059669" lightBorder="#a7f3d0" icon={<ThumbUpIcon />} />
                      <TopCommentsCard title="Top 5 Negative Comments" rows={topNegative} accent="#e11d48" lightBorder="#fecdd3" icon={<ThumbDownIcon />} />
                    </Box>

                    {/* ── Charts Grid (Sentiment Donut & Category Breakdown with soft light colors) ───── */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                      <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, backgroundColor: 'white' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase', mb: 2 }}>
                            Sentiment Distribution
                          </Typography>
                          {total === 0 ? (
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', textAlign: 'center', py: 6 }}>
                              No sentiment data available for the selected filters.
                            </Typography>
                          ) : (
                            <ResponsiveContainer width="100%" height={260}>
                              <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%"
                                  innerRadius={65} outerRadius={100} paddingAngle={3}
                                  dataKey="value" labelLine={false} label={renderCustomLabel}>
                                  {chartData.map((entry) => (
                                    <Cell key={entry.name} fill={CHART_COLORS[['Positive', 'Neutral', 'Negative'].indexOf(entry.name)]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(value, name) => [`${value} responses`, name]}
                                  contentStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, borderRadius: 10, border: '1px solid #cbd5e1' }} />
                                <Legend formatter={(value, entry) => {
                                  const pct = total > 0 ? Math.round((entry.payload.value / total) * 100) : 0;
                                  return <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: '#475569' }}>{value} {pct}%</span>;
                                }} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>

                      <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, backgroundColor: 'white' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase', mb: 2 }}>
                            Category Breakdown
                          </Typography>
                          {total === 0 || categoryChartData.length === 0 ? (
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', textAlign: 'center', py: 6 }}>
                              No category data available for the selected filters.
                            </Typography>
                          ) : (
                            <ResponsiveContainer width="100%" height={260}>
                              <PieChart>
                                <Pie data={categoryChartData} cx="50%" cy="50%"
                                  innerRadius={65} outerRadius={100} paddingAngle={3}
                                  dataKey="value" labelLine={false} label={renderCustomLabel}>
                                  {categoryChartData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(value, name) => [`${value} responses`, name]}
                                  contentStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, borderRadius: 10, border: '1px solid #cbd5e1' }} />
                                <Legend formatter={(value, entry) => {
                                  const pct = total > 0 ? Math.round((entry.payload.value / total) * 100) : 0;
                                  return <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: '#475569' }}>{value} {pct}%</span>;
                                }} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>
                    </Box>

                    {/* ── Sentiment Trend by Month (Soft pastel stacked bars) ───── */}
                    <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase', mb: 2 }}>
                          Sentiment Trend by Month
                        </Typography>
                        {monthlyData.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', textAlign: 'center', py: 6 }}>
                            No dated responses available for the selected filters.
                          </Typography>
                        ) : (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={monthlyData} barSize={32} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="month" tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fill: '#64748b' }} />
                              <YAxis allowDecimals={false} tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fill: '#64748b' }} />
                              <RechartsTooltip contentStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, borderRadius: 10, border: '1px solid #cbd5e1', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)' }} />
                              <BarLegend wrapperStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, paddingTop: 10 }} />
                              <Bar dataKey="Positive" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                              <Bar dataKey="Neutral" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                              <Bar dataKey="Negative" stackId="a" fill="#f87171" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* ── Service Improvement Recommendations ───── */}
                    <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase', mb: 2 }}>
                          Service Improvement Recommendations
                        </Typography>
                        {categoryStats.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', textAlign: 'center', py: 6 }}>
                            No category is currently above the concern threshold.
                          </Typography>
                        ) : categoryStats.map(c => (
                          <Box key={c.category} sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{
                                px: 1.8, py: 0.5, borderRadius: '20px', flexShrink: 0,
                                backgroundColor: c.severity === 'high' ? '#fff1f2' : '#fffbeb',
                                border: `1.5px solid ${c.severity === 'high' ? '#f87171' : '#fbbf24'}`,
                              }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: c.severity === 'high' ? '#be123c' : '#b45309', fontFamily: 'Poppins, sans-serif' }}>
                                  {c.category} — {c.pct}% negative — {c.severity.toUpperCase()}
                                </Typography>
                              </Box>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#1e293b', fontWeight: 600, mt: 0.2 }}>
                                {RECOMMENDATIONS[c.category][c.severity]}
                              </Typography>
                            </Box>

                            {c.matchedKeywords.length > 0 && (
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, color: '#475569', fontStyle: 'italic', ml: 0.5, mb: 1 }}>
                                <strong>Frequent Category Issue Signals:</strong> {c.matchedKeywords.join('; ')}
                              </Typography>
                            )}

                            {c.topEvidences.length > 0 && (
                              <Box sx={{ mt: 1.5, p: 2, backgroundColor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                                  Supporting Patron Feedback Evidence {c.primaryKw ? `— Top Issue Keyword: "${c.primaryKw}"` : ''} ({c.topEvidences.length})
                                </Typography>
                                {c.topEvidences.map((ev, idx) => (
                                  <Box key={idx} sx={{ py: 0.8, borderBottom: idx < c.topEvidences.length - 1 ? '1px dashed #cbd5e1' : 'none' }}>
                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#1e293b', fontWeight: 500 }}>
                                      "{ev.Message}"
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11.5, color: '#64748b', mt: 0.3 }}>
                                      {ev.Clientele} — {ev.College} · Word Freq: {ev.termScore || 0}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </CardContent>
                    </Card>

                    {/* ── Frequently Used Words (Word Cloud) ───── */}
                    <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase', mb: 2 }}>
                          Frequently Used Words
                        </Typography>
                        {wordCloudWords.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', textAlign: 'center', py: 6 }}>
                            No comment text available for the selected filters.
                          </Typography>
                        ) : (
                          <Box sx={{ height: 300 }}>
                            <ReactWordcloud
                              words={wordCloudWords}
                              options={wordCloudOptions}
                              minSize={[300, 300]}
                              callbacks={{
                                getWordTooltip: (word) => `${word.text} (${word.value})`,
                              }}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    {/* ── Survey Response Review Table (Easy on the eyes light table header) ───── */}
                    <Paper elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, bgcolor: '#ffffff', overflow: 'hidden' }}>
                      <Box sx={{
                        bgcolor: '#334155',
                        px: 3, py: 2,
                        borderBottom: '3px solid #38bdf8',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: 0.3 }}>
                          Survey Response Review
                        </Typography>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>
                          {reviewRows.length} responses · Page {page + 1} of {totalPages || 1}
                        </Typography>
                      </Box>

                      <Box sx={{ p: 3 }}>
                        {reviewRows.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', py: 6, textAlign: 'center' }}>
                            No text responses found for the selected filters.
                          </Typography>
                        ) : (
                          <>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
                              <Table size="medium">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 12, color: '#334155', letterSpacing: 0.5, textTransform: 'uppercase', width: '18%' }}>
                                      Clientele
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 12, color: '#334155', letterSpacing: 0.5, textTransform: 'uppercase', width: '12%' }}>
                                      College
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 12, color: '#334155', letterSpacing: 0.5, textTransform: 'uppercase', width: '32%' }}>
                                      Response
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 12, color: '#334155', letterSpacing: 0.5, textTransform: 'uppercase', width: '15%' }}>
                                      Sentiment
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 12, color: '#334155', letterSpacing: 0.5, textTransform: 'uppercase', width: '15%' }}>
                                      Category
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 12, color: '#334155', letterSpacing: 0.5, textTransform: 'uppercase', width: '8%' }}>
                                      Actions
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {pageRows.map((row) => (
                                    <TableRow key={row.Id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#1e293b', fontWeight: 600, py: 1.8, textTransform: 'capitalize' }}>
                                        {row.Clientele}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#475569', fontWeight: 600, py: 1.8 }}>
                                        {row.College}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#1e293b', py: 1.8, pr: 3, lineHeight: 1.4 }}>
                                        {row.Message && row.Message.trim().length > 0 ? (
                                          row.Message
                                        ) : (
                                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                            <Typography component="span" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>
                                              (No written comment)
                                            </Typography>
                                            <Box sx={{
                                              px: 1, py: 0.2, borderRadius: '12px',
                                              backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe',
                                              display: 'inline-block'
                                            }}>
                                              <Typography component="span" sx={{ fontSize: 10.5, fontWeight: 700, color: '#3730a3', fontFamily: 'Poppins, sans-serif' }}>
                                                Rating Only
                                              </Typography>
                                            </Box>
                                          </Box>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ py: 1.8 }}>
                                        <SentimentChip label={row.SentimentResult} />
                                      </TableCell>
                                      <TableCell sx={{ py: 1.8 }}>
                                        <CategoryChip label={row.Category} />
                                      </TableCell>
                                      <TableCell align="center" sx={{ py: 1.8 }}>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          onClick={() => handleDelete(row.Id)}
                                          startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                                          sx={{
                                            borderRadius: 2,
                                            fontFamily: 'Poppins, sans-serif',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            px: 1.5, py: 0.5,
                                            bgcolor: '#f43f5e',
                                            '&:hover': { bgcolor: '#e11d48' }
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5 }}>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                                Showing {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, reviewRows.length)} of {reviewRows.length} responses
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={page === 0}
                                  onClick={() => setPage(p => p - 1)}
                                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#cbd5e1', color: '#475569' }}
                                >
                                  &larr; Previous
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={page >= totalPages - 1}
                                  onClick={() => setPage(p => p + 1)}
                                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#cbd5e1', color: '#475569' }}
                                >
                                  Next &rarr;
                                </Button>
                              </Box>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Paper>
                  </>
                )}
              </Box>
            )}

            <div ref={printRef} style={{ display: 'none' }}>
              <h1>Henry Luce III Library</h1>
              <h2>Patron Satisfaction Sentiment Analysis Report</h2>
              <p className="daterange">
                {startDate && endDate ? `Date Range: ${startDate} to ${endDate}` : 'All Batched Records'}
                {filterClientele ? ` | Clientele: ${filterClientele}` : ''}
                {filterCollege ? ` | College: ${filterCollege}` : ''}
                {filterSentiment ? ` | Sentiment: ${filterSentiment}` : ''}
              </p>

              <div className="summary">
                <div className="summary-box tot"><div className="value">{total}</div><div className="label">Total Analyzed</div></div>
                <div className="summary-box pos"><div className="value">{counts.Positive}</div><div className="label">Positive</div></div>
                <div className="summary-box neu"><div className="value">{counts.Neutral}</div><div className="label">Neutral</div></div>
                <div className="summary-box neg"><div className="value">{counts.Negative}</div><div className="label">Negative</div></div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Clientele</th>
                    <th>College/Dept</th>
                    <th>Patron Feedback Message</th>
                    <th>Sentiment Result</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewRows.map((row) => (
                    <tr key={row.Id}>
                      <td style={{ textTransform: 'capitalize' }}>{row.Clientele}</td>
                      <td>{row.College}</td>
                      <td>{row.Message}</td>
                      <td><strong>{row.SentimentResult}</strong></td>
                      <td>{row.Category || 'Other/Uncategorized'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="footer">
                Generated via Naïve Bayes Classification System on {new Date().toLocaleDateString('en-PH')} — Central Philippine University
              </div>
            </div>
          </>
        )}
      </Header>

      {showLoginModal && (
        <Dialog open={true} PaperProps={{ sx: { borderRadius: 4, p: 1.5, maxWidth: 420, border: '1.5px solid #e2e8f0' } }}>
          <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
            <Avatar sx={{ bgcolor: '#4f46e5', color: '#ffffff', width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
              <AdminIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#0f172a' }}>
              Admin Access Required
            </Typography>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b', mt: 0.5 }}>
              Please login with administrative credentials to access Sentiment Dashboard
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pb: 3 }}>
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  '& .MuiInputBase-root': { height: 48, borderRadius: 2.5, fontFamily: 'Poppins, sans-serif', fontWeight: 600 }
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  '& .MuiInputBase-root': { height: 48, borderRadius: 2.5, fontFamily: 'Poppins, sans-serif', fontWeight: 600 }
                }}
              />
              {loginError && (
                <Typography color="error" fontSize={13} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, textAlign: 'center' }}>
                  {loginError}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 1, height: 48, borderRadius: 2.5, bgcolor: '#4f46e5',
                  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, textTransform: 'none',
                  '&:hover': { bgcolor: '#4338ca' }
                }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/')}
                sx={{
                  height: 44, borderRadius: 2.5, borderColor: '#cbd5e1', color: '#475569',
                  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, textTransform: 'none'
                }}
              >
                Return to Home
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SentimentDashboard;