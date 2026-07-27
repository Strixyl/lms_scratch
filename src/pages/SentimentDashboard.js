import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend as BarLegend } from 'recharts';
import ReactWordcloud from 'react-wordcloud';
import * as XLSX from 'xlsx'; // Import SheetJS
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

// ── Sentiment & Category helpers ──────────────────────────────────────
const SENTIMENT_COLORS = {
  Positive: { bg: '#1b5e20', light: '#e8f5e9', text: '#1b5e20', dot: '#2e7d32' },
  Neutral: { bg: '#e65100', light: '#fff3e0', text: '#e65100', dot: '#f57c00' },
  Negative: { bg: '#b71c1c', light: '#ffebee', text: '#b71c1c', dot: '#c62828' },
};

const CATEGORY_COLORS = {
  Facilities: { bg: '#0288d1', light: '#e1f5fe', text: '#0288d1', dot: '#039be5' },
  Staff: { bg: '#7b1fa2', light: '#f3e5f5', text: '#7b1fa2', dot: '#8e24aa' },
  Collection: { bg: '#ed6c02', light: '#fff3e0', text: '#ed6c02', dot: '#f57c00' },
  'Other/Uncategorized': { bg: '#616161', light: '#f5f5f5', text: '#616161', dot: '#757575' },
};

const CHART_COLORS = ['#2e7d32', '#f57c00', '#c62828'];

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

const TopCommentsCard = ({ title, rows, accent }) => (
  <Card elevation={0} sx={{ border: `1.5px solid ${accent}`, borderRadius: 3, backgroundColor: 'white', flex: 1, minWidth: 300 }}>
    <CardContent sx={{ p: 2.5 }}>
      <Typography sx={{
        fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: accent,
        letterSpacing: 1, textTransform: 'uppercase', mb: 1.5
      }}>
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', fontSize: 13 }}>No comments yet.</Typography>
      ) : rows.map((row, i) => (
        <Box key={i} sx={{ py: 1, borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#333' }}>
            "{row.Message}"
          </Typography>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: '#999', mt: 0.5 }}>
            {row.Clientele} - {row.College} - score {getSurveyScore(row).toFixed(2)}
          </Typography>
        </Box>
      ))}
    </CardContent>
  </Card>
);

const selectSx = {
  backgroundColor: 'white',
  borderRadius: 1,
  minWidth: 150,
  '& .MuiInputBase-root': { height: 40 },
};

const SentimentChip = ({ label }) => {
  const cfg = SENTIMENT_COLORS[label] || SENTIMENT_COLORS.Neutral;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.5, py: 0.4, borderRadius: '20px',
      backgroundColor: cfg.light, border: `1px solid ${cfg.dot}`,
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot }} />
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: cfg.text, fontFamily: 'Poppins, sans-serif' }}>
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
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.5, py: 0.4, borderRadius: '20px',
      backgroundColor: cfg.light, border: `1px solid ${cfg.dot}`,
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot }} />
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: cfg.text, fontFamily: 'Poppins, sans-serif' }}>
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
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SummaryCard = ({ label, count, total }) => {
  const cfg = SENTIMENT_COLORS[label] || SENTIMENT_COLORS.Neutral;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <Card elevation={0} sx={{
      border: `1.5px solid ${cfg.dot}`, borderRadius: 3,
      background: `linear-gradient(135deg, ${cfg.light} 0%, #ffffff 100%)`,
      flex: 1, minWidth: 160,
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 32, color: cfg.text, lineHeight: 1 }}>
          {count}
        </Typography>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: cfg.text, mt: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', mt: 0.5 }}>
          {pct}% of total responses
        </Typography>
      </CardContent>
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
  const printRef = useRef(); // Added printable container reference

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

  // ── Delete Handler ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review from the dashboard? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/surveys/${id}`);
        if (response.data.success) {
          // Instantly remove from UI client-side state
          setSurveys(prev => prev.filter(survey => survey.Id !== id));
          // If we delete the last item on a page, adjust pagination back
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

  // ── Client-side filtering ────────────────────────────────────────
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

  const reviewRows = filtered
    .filter(s => s.Message && s.Message.trim().length > 0)
    .sort((a, b) => {
      const dateA = new Date(a.DateSubmitted);
      const dateB = new Date(b.DateSubmitted);
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
  const totalPages = Math.ceil(reviewRows.length / ROWS_PER_PAGE);
  const pageRows = reviewRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const hasActiveFilter = startDate || endDate || filterClientele || filterCollege || filterSentiment || filterCategory;

  // ── Requirement #2 — Average Satisfaction Score ──
  const avgScore = filtered.length
    ? filtered.reduce((sum, s) => sum + getSurveyScore(s), 0) / filtered.length
    : 0;

  // ── Requirement #4 — Sentiment Trend by Month (stacked bar) ──
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

  // ── Requirements #5 & #6 — Top 5 Positive / Negative Comments ──
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
  const topPositive = [...positivePool].sort((a, b) => getSurveyScore(b) - getSurveyScore(a)).slice(0, 5);
  const topNegative = [...negativePool].sort((a, b) => getSurveyScore(a) - getSurveyScore(b)).slice(0, 5);

  // ── Requirement #7 — Word Cloud (Constant & Based on All Survey Responses) ──
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
    rotations: 2, rotationAngles: [0, 90], fontFamily: 'Poppins, sans-serif',
    fontSizes: [14, 48], padding: 2,
    colors: ['#1b0892', '#2e7d32', '#f57c00', '#c62828', '#6a1b9a'],
  };

  // ── Requirement #8 — Service Improvement Recommendations (Option A + Option B) ──
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

      // Option A: Keyword-driven sub-rules count
      const kwCounts = {};
      const dict = CATEGORY_KEYWORDS[category] || {};
      negativeItems.forEach(s => {
        if (!s.Message) return;
        const msgLower = s.Message.toLowerCase();
        Object.entries(dict).forEach(([kw, phrase]) => {
          if (msgLower.includes(kw)) {
            kwCounts[phrase] = (kwCounts[phrase] || 0) + 1;
          }
        });
      });
      const matchedKeywords = Object.entries(kwCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([phrase, count]) => `${phrase} (${count} mention${count > 1 ? 's' : ''})`);

      // Option B: Surface raw supporting evidence (top 2-3 most severe negative comments)
      const topEvidences = [...negativeItems]
        .filter(s => s.Message && s.Message.trim().length > 0)
        .sort((a, b) => getSurveyScore(a) - getSurveyScore(b))
        .slice(0, 3);

      return { category, total, negative, pct, severity, matchedKeywords, topEvidences };
    }).filter(Boolean);
  })();

  // ── Excel Export Handler ──────────────────────────────────────────
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert("No sentiment metrics data available to export.");
      return;
    }

    // Tab 1: High-level KPI summary cards
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

    // Tab 2: Detailed Text Classifications
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

    // Auto-adjust column width calculations for clean cell spacing
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

  // ── Print PDF Report Handler ──────────────────────────────────────
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
            .summary-box.pos .value { color: #1b5e20; }
            .summary-box.neu .value { color: #e65100; }
            .summary-box.neg .value { color: #b71c1c; }
            .summary-box.tot .value { color: #1b0892; }
            .summary-box .label { font-size: 12px; color: #555; margin-top: 4px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
            th { background-color: #1b0892; color: white; padding: 8px; text-align: left; }
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
              <Box sx={{ p: 3, backgroundColor: '#f5f6fa', minHeight: '100vh' }}>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#555', mr: 2, alignSelf: 'center' }}>
                    Logged in as <strong>{loggedInUser}</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={handleLogout}
                    sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}
                  >
                    Logout
                  </Button>
                </Box>

                {/* ── Filter Bar ── */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>

                  {/* Date filters */}
                  <TextField type="date" label="Start Date" size="small"
                    InputLabelProps={{ shrink: true }} value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{ backgroundColor: 'white', borderRadius: 1 }} />
                  <TextField type="date" label="End Date" size="small"
                    InputLabelProps={{ shrink: true }} value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    sx={{ backgroundColor: 'white', borderRadius: 1 }} />

                  {/* Clientele filter */}
                  <FormControl size="small" sx={selectSx}>
                    <InputLabel>Clientele</InputLabel>
                    <Select value={filterClientele} label="Clientele"
                      onChange={(e) => { setFilterClientele(e.target.value); setPage(0); }}>
                      <MenuItem value="">All</MenuItem>
                      {CLIENTELE_OPTIONS.map(c => (
                        <MenuItem key={c} value={c.toLowerCase()}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* College filter */}
                  <FormControl size="small" sx={selectSx}>
                    <InputLabel>College</InputLabel>
                    <Select value={filterCollege} label="College"
                      onChange={(e) => { setFilterCollege(e.target.value); setPage(0); }}>
                      <MenuItem value="">All</MenuItem>
                      {COLLEGE_OPTIONS.map(c => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Sentiment filter */}
                  <FormControl size="small" sx={selectSx}>
                    <InputLabel>Sentiment</InputLabel>
                    <Select value={filterSentiment} label="Sentiment"
                      onChange={(e) => { setFilterSentiment(e.target.value); setPage(0); }}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Positive">Positive</MenuItem>
                      <MenuItem value="Neutral">Neutral</MenuItem>
                      <MenuItem value="Negative">Negative</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Category filter */}
                  <FormControl size="small" sx={selectSx}>
                    <InputLabel>Category</InputLabel>
                    <Select value={filterCategory} label="Category"
                      onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}>
                      <MenuItem value="">All</MenuItem>
                      {CATEGORY_OPTIONS.map(c => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Sort Order */}
                  <FormControl size="small" sx={selectSx}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortOrder}
                      label="Sort By"
                      onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="latest">Latest to Oldest</MenuItem>
                      <MenuItem value="oldest">Oldest to Latest</MenuItem>
                    </Select>
                  </FormControl>

                  <Button variant="contained" onClick={fetchSurveys}
                    sx={{ backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 3, height: 40 }}>
                    Apply Filter
                  </Button>

                  {hasActiveFilter && (
                    <Button variant="outlined" size="small" onClick={handleClear}
                      sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', height: 40 }}>
                      Clear
                    </Button>
                  )}

                  {/* 🖨️ PDF Print Button */}
                  <Button variant="outlined" color="secondary" onClick={handlePrint}
                    sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', height: 40 }}>
                    🖨️ Print / Save as PDF
                  </Button>

                  {/* 📥 Excel Export Button */}
                  <Button variant="outlined" color="success" onClick={handleExportExcel}
                    sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', height: 40 }}>
                    📥 Export to Excel
                  </Button>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress sx={{ color: '#1b0892' }} />
                  </Box>
                ) : (
                  <>
                    {/* ── Summary Cards ── */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                      <Card elevation={0} sx={{ border: '1.5px solid #6a1b9a', borderRadius: 3, background: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)', flex: 1, minWidth: 160 }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 32, color: '#6a1b9a', lineHeight: 1 }}>
                            {avgScore.toFixed(2)}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#6a1b9a', mt: 0.5 }}>
                            Avg. Satisfaction Score
                          </Typography>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', mt: 0.5 }}>
                            scale: -1.0 to +1.0
                          </Typography>
                        </CardContent>
                      </Card>
                      {['Positive', 'Neutral', 'Negative'].map(label => (
                        <SummaryCard key={label} label={label} count={counts[label]} total={total} />
                      ))}
                      <Card elevation={0} sx={{ border: '1.5px solid #1b0892', borderRadius: 3, background: 'linear-gradient(135deg, #e8eaf6 0%, #ffffff 100%)', flex: 1, minWidth: 160 }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Typography sx={{ fontSize: 28, mb: 0.5 }}>📋</Typography>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 32, color: '#1b0892', lineHeight: 1 }}>
                            {total}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#1b0892', mt: 0.5 }}>
                            Total Analyzed
                          </Typography>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', mt: 0.5 }}>
                            survey responses
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    {/* ── Requirements #5 & #6 — Top Comments Row ── */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                      <TopCommentsCard title="Top 5 Positive Comments" rows={topPositive} accent="#2e7d32" />
                      <TopCommentsCard title="Top 5 Negative Comments" rows={topNegative} accent="#c62828" />
                    </Box>
                    {/* ── Charts Section: Sentiment Distribution & Category Breakdown ── */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                      {/* ── Sentiment Donut Chart ── */}
                      <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, backgroundColor: 'white', flex: 1, minWidth: 320 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#666', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                            Sentiment Distribution
                          </Typography>
                          {total === 0 ? (
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', textAlign: 'center', py: 4 }}>
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
                                <Tooltip formatter={(value, name) => [`${value} responses`, name]}
                                  contentStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }} />
                                <Legend formatter={(value, entry) => {
                                  const pct = total > 0 ? Math.round((entry.payload.value / total) * 100) : 0;
                                  return <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#333' }}>{value} {pct}%</span>;
                                }} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>

                      {/* ── Category Breakdown Chart ── */}
                      <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, backgroundColor: 'white', flex: 1, minWidth: 320 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#666', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                            Category Breakdown
                          </Typography>
                          {total === 0 || categoryChartData.length === 0 ? (
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', textAlign: 'center', py: 4 }}>
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
                                <Tooltip formatter={(value, name) => [`${value} responses`, name]}
                                  contentStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }} />
                                <Legend formatter={(value, entry) => {
                                  const pct = total > 0 ? Math.round((entry.payload.value / total) * 100) : 0;
                                  return <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#333' }}>{value} {pct}%</span>;
                                }} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>
                    </Box>

                    {/* ── Requirement #4 — Sentiment Trend by Month (stacked bar) ── */}
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#666', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                          Sentiment Trend by Month
                        </Typography>
                        {monthlyData.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', textAlign: 'center', py: 4 }}>
                            No dated responses available for the selected filters.
                          </Typography>
                        ) : (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={monthlyData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="month" tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }} />
                              <Tooltip contentStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }} />
                              <BarLegend wrapperStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }} />
                              <Bar dataKey="Positive" stackId="a" fill="#2e7d32" />
                              <Bar dataKey="Neutral" stackId="a" fill="#f57c00" />
                              <Bar dataKey="Negative" stackId="a" fill="#c62828" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* ── Requirement #8 — Service Improvement Recommendations ── */}
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#666', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                          Service Improvement Recommendations
                        </Typography>
                        {categoryStats.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', textAlign: 'center', py: 4 }}>
                            No category is currently above the concern threshold.
                          </Typography>
                        ) : categoryStats.map(c => (
                          <Box key={c.category} sx={{ py: 2, borderBottom: '1px solid #f0f0f0' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{
                                px: 1.5, py: 0.4, borderRadius: '20px', flexShrink: 0,
                                backgroundColor: c.severity === 'high' ? '#ffebee' : '#fff3e0',
                                border: `1px solid ${c.severity === 'high' ? '#c62828' : '#f57c00'}`,
                              }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: c.severity === 'high' ? '#c62828' : '#f57c00', fontFamily: 'Poppins, sans-serif' }}>
                                  {c.category} - {c.pct}% negative - {c.severity}
                                </Typography>
                              </Box>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#333', fontWeight: 600 }}>
                                {RECOMMENDATIONS[c.category][c.severity]}
                              </Typography>
                            </Box>

                            {/* Option A: Keyword Sub-insights */}
                            {c.matchedKeywords.length > 0 && (
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', fontStyle: 'italic', ml: 0.5, mb: 1 }}>
                                🔍 <strong>Frequent Category Issue Signals:</strong> {c.matchedKeywords.join('; ')}
                              </Typography>
                            )}

                            {/* Option B: Raw Supporting Evidence (Top Negative Comments per Category) */}
                            {c.topEvidences.length > 0 && (
                              <Box sx={{ mt: 1.5, p: 2, backgroundColor: '#fcfcfc', borderRadius: 2, border: '1px solid #eeeeee' }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700, color: '#777', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                                  💬 Supporting Patron Feedback Evidence ({c.topEvidences.length})
                                </Typography>
                                {c.topEvidences.map((ev, idx) => (
                                  <Box key={idx} sx={{ py: 0.5, borderBottom: idx < c.topEvidences.length - 1 ? '1px dashed #e0e0e0' : 'none' }}>
                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, color: '#333' }}>
                                      "{ev.Message}"
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: '#888', mt: 0.2 }}>
                                      {ev.Clientele} - {ev.College} · score {getSurveyScore(ev).toFixed(2)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </CardContent>
                    </Card>

                    {/* ── Requirement #7 — Word Cloud ── */}
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#666', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                          Frequently Used Words
                        </Typography>
                        {wordCloudWords.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', textAlign: 'center', py: 4 }}>
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

                    {/* ── Survey Response Review Table ── */}
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>
                            Survey Response Review
                          </Typography>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#888' }}>
                            {reviewRows.length} responses · page {page + 1} of {totalPages || 1}
                          </Typography>
                        </Box>

                        {reviewRows.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', py: 3, textAlign: 'center' }}>
                            No text responses found for the selected filters.
                          </Typography>
                        ) : (
                          <>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '20%' }}>
                                      Clientele
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '12%' }}>
                                      College
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '30%' }}>
                                      Response
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '14%' }}>
                                      Sentiment
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '14%' }}>
                                      Category
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '10%' }}>
                                      Actions
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {pageRows.map((row) => (
                                    <TableRow key={row.Id} sx={{ '&:hover': { backgroundColor: '#fafafa' }, borderBottom: '1px solid #f5f5f5' }}>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#333', py: 1.5, textTransform: 'capitalize' }}>
                                        {row.Clientele}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#333', py: 1.5 }}>
                                        {row.College}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#333', py: 1.5, pr: 3 }}>
                                        {row.Message}
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5 }}>
                                        <SentimentChip label={row.SentimentResult} />
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5 }}>
                                        <CategoryChip label={row.Category} />
                                      </TableCell>
                                      <TableCell align="center" sx={{ py: 1.5 }}>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          onClick={() => handleDelete(row.Id)}
                                          sx={{
                                            backgroundColor: '#d32f2f',
                                            '&:hover': { backgroundColor: '#b71c1c' },
                                            fontFamily: 'Poppins, sans-serif',
                                            fontSize: '11px',
                                            textTransform: 'none',
                                            minWidth: '65px',
                                            py: 0.3
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

                            {/* Pagination */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#888' }}>
                                Showing {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, reviewRows.length)} of {reviewRows.length}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" disabled={page === 0} onClick={() => setPage(p => p - 1)}
                                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', color: '#1b0892' }}>
                                  &larr; Prev
                                </Button>
                                <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', color: '#1b0892' }}>
                                  Next &rarr;
                                </Button>
                              </Box>
                            </Box>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </Box>
            )}

            {/* Hidden Printable HTML Template */}
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

      {/* 👇 Login Popup (only mounted when user is not logged in) */}
      {showLoginModal && (
        <Dialog open={true}>
          <DialogTitle>You need to login as an Admin to view this page</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {loginError && (
              <Typography color="error" fontSize={14} mt={1}>
                {loginError}
              </Typography>
            )}
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => navigate('/')}
            >
              Home
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SentimentDashboard;