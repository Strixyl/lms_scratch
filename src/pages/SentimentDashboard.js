import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip,
  InputAdornment, TableSortLabel, Tooltip, Snackbar, Alert,
  Checkbox, IconButton, ToggleButton, ToggleButtonGroup
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
  AdminPanelSettings as AdminIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarTodayIcon,
  RestartAlt as RestartAltIcon,
  Inbox as InboxIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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

const VIBRANT_WORD_COLORS = [
  '#2563eb', // Sapphire Blue
  '#10b981', // Rich Emerald Green
  '#8b5cf6', // Electric Purple
  '#f59e0b', // Amber Gold
  '#ef4444', // Coral Red
  '#06b6d4', // Vivid Cyan
  '#ec4899', // Hot Pink
  '#6366f1', // Deep Indigo
  '#f97316', // Bright Orange
  '#14b8a6', // Dark Teal
  '#d946ef', // Fuchsia Magenta
  '#0288d1', // Sky Blue
];

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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Plain 1-5 Satisfaction Scale (matches CSAT survey scale) ─────────────────
const SATISFACTION_SCALE = {
  very_satisfied: 5, satisfied: 4, neutral: 3,
  dissatisfied: 2, very_dissatisfied: 1, na: null,
};

const getSatisfactionAverage = (s) => {
  const qList = [
    s.Question1, s.Question2, s.Question3, s.Question4, s.Question5,
    s.Question6, s.Question7, s.Question8, s.Question9, s.Question10
  ].map(q => SATISFACTION_SCALE[q]).filter(v => v != null);
  return qList.length > 0 ? qList.reduce((a, b) => a + b, 0) / qList.length : 0;
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

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on',
  'for', 'it', 'this', 'that', 'i', 'we', 'you', 'my', 'our', 'with', 'be', 'have', 'has',
  'very', 'so', 'too', 'library', 'cpu', 'student', 'students', 'just', 'also', 'can', 'will',
  'more', 'get', 'make', 'please', 'really', 'there', 'they', 'their', 'them', 'from', 'all',
  'would', 'could', 'should', 'about', 'out', 'up', 'been', 'when', 'what', 'which', 'than',
  // Quantifiers, degree words & generic English fillers (prevents terms like "lot" or "quality" from overriding subject nouns)
  'lot', 'lots', 'many', 'much', 'few', 'some', 'several', 'every', 'each', 'huge', 'lack',
  'bad', 'good', 'nice', 'great', 'better', 'best', 'worst', 'poor', 'quality', 'high', 'low',
  'one', 'two', 'new', 'old', 'big', 'small', 'thing', 'things', 'way', 'ways', 'kind', 'kinds'
]);

export const CONTROLLED_LEXICON = {
  Facilities: {
    'Restroom & Hygiene': [
      'restroom', 'comfort room', 'toilet', 'washroom', 'lavatory',
      'dirty restroom', 'smelly restroom', 'unclean', 'foul odor',
      'soap', 'tissue', 'paper towel', 'water', 'faucet', 'flush', 'sink'
    ],
    'Air Conditioning': [
      'aircon', 'air conditioning', 'ac', 'temperature', 'hot', 'warm', 'cold',
      'cooling', 'fan', 'humid', 'ventilation', 'climate control'
    ],
    'Tables, Seating & Space': [
      'table', 'tables', 'chair', 'chairs', 'seat', 'seating', 'bench', 'desk',
      'space', 'crowded', 'full', 'overcrowded', 'cubicle', 'study hall', 'carrel'
    ],
    'Wi-Fi & Power Outlets': [
      'wifi', 'wi-fi', 'internet', 'connection', 'network', 'signal', 'disconnecting',
      'slow internet', 'fast internet', 'outlet', 'outlets', 'plug', 'socket',
      'charging', 'extension cord'
    ],
    'Noise Level & Ambience': [
      'noise', 'noisy', 'loud', 'quiet', 'silent', 'talking', 'chitchat',
      'distracting', 'peaceful', 'concentration', 'study zone', 'chaotic'
    ],
    'Lighting & Cleanliness': [
      'light', 'lighting', 'dark', 'dim', 'bright', 'clean', 'cleanliness',
      'dust', 'dusty', 'trash', 'garbage', 'litter', 'maintenance'
    ]
  },
  Staff: {
    'Librarians & Staffs': [
      'librarian', 'librarians', 'staff', 'assistant', 'assistants',
      'student assistant', 'desk staff', 'counter', 'personnel'
    ],
    'Security': [
      'guard', 'guards', 'security', 'entrance guard', 'bag check', 'sign in'
    ],
    'Service Quality & Attitude': [
      'attitude', 'polite', 'rude', 'helpful', 'unhelpful', 'approachable',
      'unapproachable', 'accommodating', 'kind', 'attentive', 'ignoring',
      'slow service', 'fast service', 'snobbish', 'friendly', 'courteous'
    ]
  },
  Collection: {
    'Books & Reference Materials': [
      'book', 'books', 'reference', 'textbook', 'journal', 'reading material',
      'thesis', 'manuscript', 'periodical', 'magazine', 'dictionary', 'encyclopedia',
      'outdated', 'old books', 'updated', 'edition'
    ],
    'Catalogue, OPAC & Search': [
      'catalogue', 'catalog', 'opac', 'online catalog', 'system', 'search',
      'index', 'accession number', 'call number', 'location', 'shelf', 'shelving'
    ],
    'Borrowing & Circulation': [
      'borrow', 'borrowing', 'return', 'returning', 'due date', 'fine', 'fines',
      'penalty', 'renewal', 'renew', 'library card', 'checkout', 'check out'
    ],
    'Computers': [
      'pc', 'computer', 'computers', 'desktop', 'computer lab', 'mouse',
      'keyboard', 'monitor', 'screen', 'printer', 'printing', 'print',
      'photocopy', 'photocopier', 'scanner', 'scanning'
    ]
  }
};

const stemWord = (word) => {
  if (!word || word.length <= 3) return word;
  return word
    .replace(/(?:ies)$/i, 'y')
    .replace(/(?:s|es|ing|ed)$/i, '')
    .toLowerCase();
};

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
              label={row.topTerm ? `Keyword: "${row.topTerm}" (${row.maxTermFreq || row.termScore}×)` : `Freq Score: ${row.termScore || 0}`}
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

const SummaryCard = ({ title, value, subtitle, icon, color = '#3b82f6', tooltipContent = null }) => {
  const cardContent = (
    <Card elevation={0} sx={{
      borderRadius: 3.5,
      backgroundColor: '#ffffff',
      border: '1.5px solid #e2e8f0',
      flex: 1, minWidth: 180,
      p: 2.5,
      cursor: tooltipContent ? 'pointer' : 'default',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
        ...(tooltipContent && { borderColor: color })
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

  if (tooltipContent) {
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Box sx={{ flex: 1, minWidth: 180, display: 'flex' }}>
          {cardContent}
        </Box>
      </Tooltip>
    );
  }

  return cardContent;
};

// ── Dynamic Custom Tooltip for Sentiment Stacked Bar Chart ─────────────────────
const CustomSentimentStackedTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    return (
      <Paper elevation={4} sx={{ p: 2, bgcolor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: 3, maxWidth: 320, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, color: '#1e293b', mb: 1, borderBottom: '1px solid #e2e8f0', pb: 0.8, fontSize: 13.5 }}>
          {label} — {total} Total Response{total !== 1 ? 's' : ''}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {payload.map((item, idx) => {
            const val = Number(item.value) || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            const colorObj = SENTIMENT_COLORS[item.name] || { bg: item.color || '#64748b', text: '#1e293b', light: '#f8fafc', dot: item.color || '#64748b' };
            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.8, px: 1.2, borderRadius: 2, bgcolor: colorObj.light || '#f8fafc', border: `1px solid ${colorObj.dot}40` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: colorObj.bg, flexShrink: 0 }} />
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: colorObj.text || '#1e293b' }}>
                    {item.name}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 800, color: colorObj.text || '#1e293b' }}>
                  {val} ({pct}%)
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  }
  return null;
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
  const [filterYear, setFilterYear] = useState('2026');
  const [page, setPage] = useState(0);

  // Word Cloud interactive states & filters
  const [wcSearch, setWcSearch] = useState('');
  const [wcSentimentFilter, setWcSentimentFilter] = useState('All');
  const [wcMaxWords, setWcMaxWords] = useState(60);
  const [wcRotation, setWcRotation] = useState('horizontal');
  const [selectedWordFilter, setSelectedWordFilter] = useState('');

  // Live Search & Sort states
  const [sortField, setSortField] = useState('DateSubmitted');
  const [sortOrder, setSortOrder] = useState('desc');

  // Batch Selection & Deletion states
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Stacked Bar Chart states
  const [barChartMode, setBarChartMode] = useState('stacked'); // 'stacked' | 'grouped'
  const [stackedBreakdownDimension, setStackedBreakdownDimension] = useState('Category'); // 'Category' | 'Clientele' | 'College'
  const [stackedLayoutMode, setStackedLayoutMode] = useState('stacked'); // 'stacked' | 'grouped'
  const [stackedValueScale, setStackedValueScale] = useState('count'); // 'count' | 'percentage'

  const printRef = useRef();

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/surveys', {
        params: { startDate, endDate },
      });
      setSurveys(response.data);
      setPage(0);
      setSelectedRowIds([]);
    } catch (err) {
      console.error('Error fetching surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSurveys(); }, []); // eslint-disable-line

  const handleDatePreset = (presetKey) => {
    const today = new Date();
    const formatISO = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (presetKey === 'today') {
      const dateStr = formatISO(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (presetKey === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(today.setDate(diff));
      setStartDate(formatISO(startOfWeek));
      setEndDate(formatISO(new Date()));
    } else if (presetKey === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatISO(startOfMonth));
      setEndDate(formatISO(new Date()));
    } else if (presetKey === 'all') {
      setStartDate('');
      setEndDate('');
    }
    setPage(0);
  };

  const handleToggleSelectRow = (id) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openDeleteModal = (survey = null) => {
    setRecordToDelete(survey);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRecord = async () => {
    setDeleting(true);
    try {
      if (recordToDelete) {
        const response = await axios.delete(`http://localhost:5000/api/surveys/${recordToDelete.Id}`);
        if (response.data.success) {
          setSurveys(prev => prev.filter(s => s.Id !== recordToDelete.Id));
          setSelectedRowIds(prev => prev.filter(id => id !== recordToDelete.Id));
          setSnackbarMsg('Review entry deleted successfully.');
        }
      } else if (selectedRowIds.length > 0) {
        const deletePromises = selectedRowIds.map(id => axios.delete(`http://localhost:5000/api/surveys/${id}`));
        await Promise.all(deletePromises);
        setSurveys(prev => prev.filter(s => !selectedRowIds.includes(s.Id)));
        setSnackbarMsg(`${selectedRowIds.length} review entries deleted successfully.`);
        setSelectedRowIds([]);
      }
    } catch (err) {
      console.error('Error deleting survey:', err);
      setSnackbarMsg('An error occurred while attempting to delete entry.');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleRemoveFilter = (key) => {
    if (key === 'date') {
      setStartDate('');
      setEndDate('');
    } else if (key === 'clientele') {
      setFilterClientele('');
    } else if (key === 'college') {
      setFilterCollege('');
    } else if (key === 'sentiment') {
      setFilterSentiment('');
    } else if (key === 'category') {
      setFilterCategory('');
    }
    setPage(0);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setFilterClientele('');
    setFilterCollege('');
    setFilterSentiment('');
    setFilterCategory('');
    setSelectedWordFilter('');
    setWcSearch('');
    setWcSentimentFilter('All');
    setSortField('DateSubmitted');
    setSortOrder('desc');
    setTimeout(fetchSurveys, 0);
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPage(0);
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

  const filteredWithWord = useMemo(() => {
    if (!selectedWordFilter) return filtered;
    const wordLower = selectedWordFilter.toLowerCase();
    const stem = stemWord(wordLower);
    return filtered.filter(s => {
      if (!s.Message) return false;
      const msgLower = s.Message.toLowerCase();
      return msgLower.includes(wordLower) || msgLower.includes(stem);
    });
  }, [filtered, selectedWordFilter]);

  const reviewRows = [...filteredWithWord]
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'DateSubmitted') {
        valA = a.DateSubmitted ? new Date(a.DateSubmitted).getTime() : 0;
        valB = b.DateSubmitted ? new Date(b.DateSubmitted).getTime() : 0;
      } else if (typeof valA === 'string') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      } else if (valA == null) {
        valA = '';
        valB = valB || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  const totalPages = Math.ceil(reviewRows.length / ROWS_PER_PAGE);
  const pageRows = reviewRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const isAllPageSelected = pageRows.length > 0 && pageRows.every(r => selectedRowIds.includes(r.Id));
  const isSomePageSelected = pageRows.some(r => selectedRowIds.includes(r.Id)) && !isAllPageSelected;

  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      const pageIds = pageRows.map(r => r.Id);
      setSelectedRowIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(pageRows.map(r => r.Id));
      setSelectedRowIds(prev => prev.filter(id => !pageIds.has(id)));
    }
  };

  const hasActiveFilter = Boolean(startDate || endDate || filterClientele || filterCollege || filterSentiment || filterCategory);

  // Overall Satisfaction Average (plain 1-5 scale from survey questions)
  const avgSatisfaction = filtered.length
    ? filtered.reduce((sum, s) => sum + getSatisfactionAverage(s), 0) / filtered.length
    : 0;

  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    surveys.forEach(s => {
      if (s.DateSubmitted) {
        const d = new Date(s.DateSubmitted.replace ? s.DateSubmitted.replace(' ', 'T') : s.DateSubmitted);
        if (!isNaN(d.getFullYear())) yearsSet.add(d.getFullYear().toString());
      }
    });
    const arr = Array.from(yearsSet).sort((a, b) => b - a);
    if (arr.length === 0) arr.push('2026');
    return arr;
  }, [surveys]);

  const monthly12MonthData = useMemo(() => {
    const targetYear = filterYear === 'All' ? null : (filterYear || '2026');

    const monthsMap = {};
    MONTH_NAMES.forEach((m, idx) => {
      monthsMap[idx] = {
        month: m,
        Positive: 0,
        Neutral: 0,
        Negative: 0,
        Total: 0,
        scoresSum: 0
      };
    });

    filtered.forEach(s => {
      if (!s.DateSubmitted) return;
      const d = new Date(s.DateSubmitted.replace ? s.DateSubmitted.replace(' ', 'T') : s.DateSubmitted);
      if (isNaN(d.getTime())) return;
      const yr = d.getFullYear().toString();
      if (targetYear && yr !== targetYear) return;

      const mIdx = d.getMonth();
      if (monthsMap[mIdx]) {
        if (s.SentimentResult === 'Positive') monthsMap[mIdx].Positive++;
        else if (s.SentimentResult === 'Neutral') monthsMap[mIdx].Neutral++;
        else if (s.SentimentResult === 'Negative') monthsMap[mIdx].Negative++;
        monthsMap[mIdx].Total++;
        monthsMap[mIdx].scoresSum += getSatisfactionAverage(s);
      }
    });

    return MONTH_NAMES.map((m, idx) => {
      const item = monthsMap[idx];
      const avg = item.Total > 0 ? (item.scoresSum / item.Total).toFixed(1) : '0.0';
      return { ...item, avgSatisfaction: parseFloat(avg) };
    });
  }, [filtered, filterYear]);

  // Dynamic Stacked Bar Breakdown Data (Category, Clientele, or College)
  const stackedBreakdownData = useMemo(() => {
    const map = {};

    filtered.forEach(s => {
      let key = 'Other/Uncategorized';
      if (stackedBreakdownDimension === 'Category') {
        key = s.Category || 'Other/Uncategorized';
      } else if (stackedBreakdownDimension === 'Clientele') {
        key = s.Clientele || 'Unspecified';
      } else if (stackedBreakdownDimension === 'College') {
        key = s.College || 'N/A';
      }

      if (!map[key]) {
        map[key] = { name: key, Positive: 0, Neutral: 0, Negative: 0, total: 0 };
      }
      if (s.SentimentResult === 'Positive') map[key].Positive++;
      else if (s.SentimentResult === 'Neutral') map[key].Neutral++;
      else if (s.SentimentResult === 'Negative') map[key].Negative++;
      map[key].total++;
    });

    const keys = Object.keys(map).sort((a, b) => map[b].total - map[a].total);

    return keys.map(k => {
      const item = map[k];
      if (stackedValueScale === 'percentage' && item.total > 0) {
        return {
          name: item.name,
          Positive: parseFloat(((item.Positive / item.total) * 100).toFixed(1)),
          Neutral: parseFloat(((item.Neutral / item.total) * 100).toFixed(1)),
          Negative: parseFloat(((item.Negative / item.total) * 100).toFixed(1)),
          total: item.total
        };
      }
      return item;
    });
  }, [filtered, stackedBreakdownDimension, stackedValueScale]);

  // ── Word/Term Frequency & TF-IDF Ranking for Top Comments (Approach B) ──────
  const buildTermFrequencies = (pool) => {
    const freq = {};
    const origCounts = {};
    const sentimentCounts = {};

    pool.forEach(s => {
      if (!s.Message) return;
      const sent = s.SentimentResult || 'Neutral';
      const words = s.Message.toLowerCase().match(/[a-z']+/g) || [];
      words.forEach(rawW => {
        if (rawW.length < 3 || STOPWORDS.has(rawW)) return;
        const stem = stemWord(rawW);
        freq[stem] = (freq[stem] || 0) + 1;
        if (!origCounts[stem]) origCounts[stem] = {};
        origCounts[stem][rawW] = (origCounts[stem][rawW] || 0) + 1;

        if (!sentimentCounts[stem]) sentimentCounts[stem] = { Positive: 0, Negative: 0, Neutral: 0 };
        if (sentimentCounts[stem][sent] !== undefined) {
          sentimentCounts[stem][sent]++;
        }
      });
    });
    const displayMap = {};
    Object.keys(origCounts).forEach(stem => {
      displayMap[stem] = Object.entries(origCounts[stem]).sort((a, b) => b[1] - a[1])[0][0];
    });
    return { freq, displayMap, sentimentCounts };
  };

  // Dynamic term frequencies for word cloud visualization based on active filters
  const { freq: termFrequencies = {}, displayMap: stemToOriginalMap = {}, sentimentCounts: wordSentimentCounts = {} } = useMemo(() => {
    return buildTermFrequencies(filtered.length > 0 ? filtered : surveys);
  }, [filtered, surveys]);

  // ── Controlled Domain Lexicon Keyword Ranking Engine ────────────────────────
  const scoreCommentsWithLexicon = (commentsPool) => {
    if (!commentsPool || commentsPool.length === 0) return [];

    const topicPoolCounts = {};
    const commentTopicMatches = commentsPool.map(s => {
      if (!s.Message || !s.Message.trim()) return { matchedTopics: [] };
      const msgLower = s.Message.toLowerCase();
      const matchedTopics = new Set();

      Object.values(CONTROLLED_LEXICON).forEach(categoryTopics => {
        Object.entries(categoryTopics).forEach(([topic, synonyms]) => {
          for (const syn of synonyms) {
            const regex = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(msgLower) || msgLower.includes(syn)) {
              matchedTopics.add(topic);
              break;
            }
          }
        });
      });

      matchedTopics.forEach(topic => {
        topicPoolCounts[topic] = (topicPoolCounts[topic] || 0) + 1;
      });

      return { matchedTopics: Array.from(matchedTopics) };
    });

    return commentsPool.map((commentObj, idx) => {
      if (!commentObj || !commentObj.Message) {
        return { ...commentObj, tfidfScore: 0, termScore: 0, blendedScore: 0, topTerm: '', maxTermFreq: 0 };
      }

      const { matchedTopics } = commentTopicMatches[idx];
      let maxTopic = '';
      let maxTopicFreq = 0;
      let totalTopicScore = 0;

      matchedTopics.forEach(topic => {
        const count = topicPoolCounts[topic] || 0;
        totalTopicScore += count;
        if (count > maxTopicFreq) {
          maxTopicFreq = count;
          maxTopic = topic;
        }
      });

      const normalizedTopicScore = matchedTopics.length > 0
        ? Number((totalTopicScore / Math.sqrt(matchedTopics.length)).toFixed(2))
        : 0;

      const magnitude = Math.abs(getSurveyScore(commentObj));
      const blendedScore = Number(((0.7 * normalizedTopicScore) + (0.3 * magnitude * 10)).toFixed(2));

      return {
        ...commentObj,
        tfidfScore: normalizedTopicScore,
        termScore: normalizedTopicScore,
        blendedScore,
        topTerm: maxTopic || 'General Feedback',
        maxTermFreq: maxTopicFreq
      };
    });
  };

  const selectDiverseTopComments = (scoredList, limit = 5) => {
    const selected = [];
    const keywordCounts = {};

    for (const comment of scoredList) {
      const kw = (comment.topTerm || 'general').toLowerCase();
      if ((keywordCounts[kw] || 0) < 2) {
        selected.push(comment);
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
      if (selected.length === limit) break;
    }

    if (selected.length < limit) {
      for (const comment of scoredList) {
        if (!selected.includes(comment)) {
          selected.push(comment);
          if (selected.length === limit) break;
        }
      }
    }

    return selected;
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

  const topPositive = useMemo(() => {
    // Small pool guard: lexicon/frequency scoring is unreliable under 5 comments.
    if (positivePool.length < 5) {
      return [...positivePool]
        .sort((a, b) => Math.abs(getSurveyScore(b)) - Math.abs(getSurveyScore(a)))
        .slice(0, 5);
    }
    const scoredPool = scoreCommentsWithLexicon(positivePool);
    scoredPool.sort((a, b) => {
      if (b.blendedScore !== a.blendedScore) {
        return b.blendedScore - a.blendedScore;
      }
      return Math.abs(getSurveyScore(b)) - Math.abs(getSurveyScore(a));
    });
    return selectDiverseTopComments(scoredPool, 5);
  }, [positivePool]);

  const topNegative = useMemo(() => {
    // Small pool guard: lexicon/frequency scoring is unreliable under 5 comments.
    if (negativePool.length < 5) {
      return [...negativePool]
        .sort((a, b) => Math.abs(getSurveyScore(b)) - Math.abs(getSurveyScore(a)))
        .slice(0, 5);
    }
    const scoredPool = scoreCommentsWithLexicon(negativePool);
    scoredPool.sort((a, b) => {
      if (b.blendedScore !== a.blendedScore) {
        return b.blendedScore - a.blendedScore;
      }
      return Math.abs(getSurveyScore(b)) - Math.abs(getSurveyScore(a));
    });
    return selectDiverseTopComments(scoredPool, 5);
  }, [negativePool]);

  const wordCloudWords = useMemo(() => {
    return Object.entries(termFrequencies || {})
      .map(([stem, value]) => ({
        text: (stemToOriginalMap && stemToOriginalMap[stem]) || stem,
        value,
        stem,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 60);
  }, [termFrequencies, stemToOriginalMap]);

  const wordCloudOptions = useMemo(() => ({
    deterministic: true,
    randomSeed: 'hll-library-wordcloud-v3',
    rotations: 1,
    rotationAngles: [0, 0],
    fontFamily: 'Poppins, sans-serif',
    fontSizes: [16, 48],
    fontStyle: 'normal',
    fontWeight: '700',
    padding: 4,
    enableTooltip: true,
    transitionDuration: 0,
    scale: 'sqrt',
    spiral: 'archimedean',
  }), []);

  const wordCloudCallbacks = useMemo(() => ({
    getWordColor: (word) => {
      if (selectedWordFilter && word.text.toLowerCase() === selectedWordFilter.toLowerCase()) {
        return '#f57c00';
      }
      const charCodeSum = (word.text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return VIBRANT_WORD_COLORS[charCodeSum % VIBRANT_WORD_COLORS.length];
    },
    getWordTooltip: (word) => `"${word.text}" — ${word.value} ${word.value === 1 ? 'mention' : 'mentions'}`,
    onWordClick: (word) => {
      if (selectedWordFilter && selectedWordFilter.toLowerCase() === word.text.toLowerCase()) {
        setSelectedWordFilter('');
      } else {
        setSelectedWordFilter(word.text);
      }
    },
  }), [selectedWordFilter]);

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

      const scoredEvidences = scoreCommentsWithLexicon(matchingEvidences);
      const topEvidences = scoredEvidences
        .sort((a, b) => b.blendedScore - a.blendedScore)
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
      { 'Metric Indicator': 'Avg Satisfaction (1-5 Scale)', 'Count': avgSatisfaction.toFixed(2) },
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
                    bgcolor: '#1a237e',
                    px: 3, py: 1.8,
                    borderBottom: '3px solid #0288d1',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <FilterAltIcon sx={{ fontSize: 22, color: '#38bdf8' }} />
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: 0.3 }}>
                        Filter & Analytics Controls
                      </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#90caf9', fontWeight: 600 }}>
                      {filtered.length} matching response{filtered.length === 1 ? '' : 's'}
                    </Typography>
                  </Box>

                  {/* ── Quick Date Presets Row ───── */}
                  <Box sx={{ px: 3, pt: 2, pb: 1, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#475569', mr: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: '#1a237e' }} /> Quick Date Range:
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('today')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#334155' }}>
                      Today
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('week')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#334155' }}>
                      This Week
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('month')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#334155' }}>
                      This Month
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('all')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#334155' }}>
                      All Time
                    </Button>
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
                      <InputLabel>Year</InputLabel>
                      <Select
                        value={filterYear}
                        label="Year"
                        onChange={(e) => { setFilterYear(e.target.value); setPage(0); }}
                      >
                        <MenuItem value="All" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>All Years</MenuItem>
                        {availableYears.map(yr => (
                          <MenuItem key={yr} value={yr} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{yr}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      onClick={fetchSurveys}
                      sx={{ bgcolor: '#1a237e', px: 3.5, height: 46, borderRadius: 2.5, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, '&:hover': { bgcolor: '#0d47a1' } }}
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

                  {/* ── Active Filter Chips Row ───── */}
                  {hasActiveFilter && (
                    <Box sx={{ px: 3, pb: 2, pt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', borderTop: '1px solid #f1f5f9' }}>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#64748b' }}>
                        Active Filters:
                      </Typography>
                      {(startDate || endDate) && (
                        <Chip
                          label={`Date: ${startDate || 'Start'} to ${endDate || 'End'}`}
                          onDelete={() => handleRemoveFilter('date')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, bgcolor: '#f1f5f9', color: '#334155' }}
                        />
                      )}
                      {filterClientele && (
                        <Chip
                          label={`Clientele: ${filterClientele}`}
                          onDelete={() => handleRemoveFilter('clientele')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, bgcolor: '#f3e8ff', color: '#6b21a8' }}
                        />
                      )}
                      {filterCollege && (
                        <Chip
                          label={`College: ${filterCollege}`}
                          onDelete={() => handleRemoveFilter('college')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, bgcolor: '#e0f2fe', color: '#0369a1' }}
                        />
                      )}
                      {filterSentiment && (
                        <Chip
                          label={`Sentiment: ${filterSentiment}`}
                          onDelete={() => handleRemoveFilter('sentiment')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, bgcolor: '#ecfdf5', color: '#047857' }}
                        />
                      )}
                      {filterCategory && (
                        <Chip
                          label={`Category: ${filterCategory}`}
                          onDelete={() => handleRemoveFilter('category')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, bgcolor: '#fffbeb', color: '#b45309' }}
                        />
                      )}
                      <Button
                        size="small"
                        onClick={handleClear}
                        startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
                        sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', fontWeight: 700, fontSize: 12, color: '#ef4444', ml: 'auto' }}
                      >
                        Clear All
                      </Button>
                    </Box>
                  )}
                </Paper>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <>
                    {/* ── Top Metric KPI Cards Grid (Clean 5 Summary Cards) ───── */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2.5, mb: 3 }}>
                      <SummaryCard
                        title="Avg Satisfaction"
                        value={avgSatisfaction.toFixed(2)}
                        subtitle="Scale: 1.0 to 5.0"
                        icon={<StarIcon />}
                        color="#8b5cf6"
                        tooltipContent="Average patron score across satisfaction survey questions (1.0 to 5.0 scale)"
                      />
                      <SummaryCard
                        title="Positive"
                        value={counts.Positive}
                        subtitle={`${total > 0 ? Math.round((counts.Positive / total) * 100) : 0}% of responses`}
                        icon={<ThumbUpIcon />}
                        color="#10b981"
                        tooltipContent={`Positive Sentiments: ${counts.Positive} responses (${total > 0 ? Math.round((counts.Positive / total) * 100) : 0}% of total)`}
                      />
                      <SummaryCard
                        title="Neutral"
                        value={counts.Neutral}
                        subtitle={`${total > 0 ? Math.round((counts.Neutral / total) * 100) : 0}% of responses`}
                        icon={<SentimentSatisfiedIcon />}
                        color="#f59e0b"
                        tooltipContent={`Neutral Sentiments: ${counts.Neutral} responses (${total > 0 ? Math.round((counts.Neutral / total) * 100) : 0}% of total)`}
                      />
                      <SummaryCard
                        title="Negative"
                        value={counts.Negative}
                        subtitle={`${total > 0 ? Math.round((counts.Negative / total) * 100) : 0}% of responses`}
                        icon={<ThumbDownIcon />}
                        color="#f43f5e"
                        tooltipContent={`Negative Sentiments: ${counts.Negative} responses (${total > 0 ? Math.round((counts.Negative / total) * 100) : 0}% of total)`}
                      />
                      <SummaryCard
                        title="Total Analyzed"
                        value={total}
                        subtitle="Survey responses"
                        icon={<AssessmentIcon />}
                        color="#1a237e"
                        tooltipContent={`Total Filtered Surveys: ${total} responses matching current filters`}
                      />
                    </Box>

                    {/* ── 12-Month Calendar View Bar Graph (Stacked Bar / Side-by-Side Toggle) ───── */}
                    <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                          <Box>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                              Sentiment Trend (12-Month {barChartMode === 'stacked' ? 'Stacked Bar' : 'Side-by-Side'} View) — {filterYear === 'All' ? 'All Batched Years' : `Year ${filterYear}`}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#64748b', fontWeight: 500, mt: 0.2 }}>
                              {barChartMode === 'stacked'
                                ? 'Stacked breakdown of Positive, Neutral, and Negative responses per month'
                                : 'Side-by-Side comparison of Positive, Neutral, and Negative responses per month'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            {/* Bar Layout Mode Switch (Stacked vs Grouped) */}
                            <ToggleButtonGroup
                              value={barChartMode}
                              exclusive
                              onChange={(e, newMode) => { if (newMode) setBarChartMode(newMode); }}
                              size="small"
                              sx={{ height: 38, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}
                            >
                              <ToggleButton value="stacked" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'none', px: 1.5 }}>
                                Stacked Bar
                              </ToggleButton>
                              <ToggleButton value="grouped" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'none', px: 1.5 }}>
                                Side-by-Side
                              </ToggleButton>
                            </ToggleButtonGroup>

                            {/* Year Selector */}
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <InputLabel sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: '#1a237e' }}>Year</InputLabel>
                              <Select
                                value={filterYear}
                                label="Year"
                                onChange={(e) => setFilterYear(e.target.value)}
                                sx={{ height: 38, borderRadius: 2.5, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13 }}
                              >
                                <MenuItem value="All" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>All Years</MenuItem>
                                {availableYears.map(yr => (
                                  <MenuItem key={yr} value={yr} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>{yr}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>

                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={monthly12MonthData} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
                            <defs>
                              <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                              <linearGradient id="neuGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#d97706" />
                              </linearGradient>
                              <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f87171" />
                                <stop offset="100%" stopColor="#dc2626" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                            <YAxis allowDecimals={false} tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fill: '#64748b' }} />
                            <RechartsTooltip content={<CustomSentimentStackedTooltip />} />
                            <Legend wrapperStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, paddingTop: 12 }} />
                            <Bar
                              dataKey="Positive"
                              stackId={barChartMode === 'stacked' ? 'monthlyStack' : undefined}
                              fill="url(#posGrad)"
                              radius={barChartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                              maxBarSize={barChartMode === 'stacked' ? 36 : 28}
                            />
                            <Bar
                              dataKey="Neutral"
                              stackId={barChartMode === 'stacked' ? 'monthlyStack' : undefined}
                              fill="url(#neuGrad)"
                              radius={barChartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                              maxBarSize={barChartMode === 'stacked' ? 36 : 28}
                            />
                            <Bar
                              dataKey="Negative"
                              stackId={barChartMode === 'stacked' ? 'monthlyStack' : undefined}
                              fill="url(#negGrad)"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={barChartMode === 'stacked' ? 36 : 28}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* ── Dedicated Stacked Bar Chart: Sentiment Breakdown across Dimensions ───── */}
                    <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, mb: 3, backgroundColor: 'white' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                          <Box>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                              Sentiment Distribution Breakdown (Stacked Bar Chart)
                            </Typography>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#64748b', fontWeight: 500, mt: 0.2 }}>
                              Stacked comparison of Positive, Neutral, and Negative sentiment volumes across {stackedBreakdownDimension}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            {/* Dimension Dropdown */}
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <InputLabel sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: '#1a237e' }}>Breakdown By</InputLabel>
                              <Select
                                value={stackedBreakdownDimension}
                                label="Breakdown By"
                                onChange={(e) => setStackedBreakdownDimension(e.target.value)}
                                sx={{ height: 38, borderRadius: 2.5, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13 }}
                              >
                                <MenuItem value="Category" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>Category</MenuItem>
                                <MenuItem value="Clientele" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>Clientele Group</MenuItem>
                                <MenuItem value="College" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>College / Unit</MenuItem>
                              </Select>
                            </FormControl>

                            {/* Stacked vs Grouped Toggle */}
                            <ToggleButtonGroup
                              value={stackedLayoutMode}
                              exclusive
                              onChange={(e, mode) => { if (mode) setStackedLayoutMode(mode); }}
                              size="small"
                              sx={{ height: 38, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}
                            >
                              <ToggleButton value="stacked" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'none', px: 1.5 }}>
                                Stacked
                              </ToggleButton>
                              <ToggleButton value="grouped" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'none', px: 1.5 }}>
                                Side-by-Side
                              </ToggleButton>
                            </ToggleButtonGroup>

                            {/* Count vs Percentage Toggle */}
                            <ToggleButtonGroup
                              value={stackedValueScale}
                              exclusive
                              onChange={(e, scale) => { if (scale) setStackedValueScale(scale); }}
                              size="small"
                              sx={{ height: 38, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}
                            >
                              <ToggleButton value="count" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'none', px: 1.5 }}>
                                Counts
                              </ToggleButton>
                              <ToggleButton value="percentage" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'none', px: 1.5 }}>
                                100% %
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Box>
                        </Box>

                        {stackedBreakdownData.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', textAlign: 'center', py: 6 }}>
                            No survey response data available for {stackedBreakdownDimension} breakdown.
                          </Typography>
                        ) : (
                          <ResponsiveContainer width="100%" height={340}>
                            <BarChart data={stackedBreakdownData} margin={{ top: 15, right: 30, left: 10, bottom: stackedBreakdownDimension === 'College' ? 40 : 10 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                dataKey="name"
                                tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 11.5, fill: '#64748b', fontWeight: 600 }}
                                interval={0}
                                angle={stackedBreakdownDimension === 'College' ? -35 : 0}
                                textAnchor={stackedBreakdownDimension === 'College' ? 'end' : 'middle'}
                                height={stackedBreakdownDimension === 'College' ? 60 : 30}
                              />
                              <YAxis
                                allowDecimals={stackedValueScale === 'percentage'}
                                unit={stackedValueScale === 'percentage' ? '%' : ''}
                                domain={stackedValueScale === 'percentage' ? [0, 100] : [0, 'auto']}
                                tick={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fill: '#64748b' }}
                              />
                              <RechartsTooltip content={<CustomSentimentStackedTooltip />} />
                              <Legend wrapperStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, paddingTop: 12 }} />
                              <Bar
                                dataKey="Positive"
                                stackId={stackedLayoutMode === 'stacked' ? 'breakdownStack' : undefined}
                                fill="url(#posGrad)"
                                radius={stackedLayoutMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                                maxBarSize={stackedLayoutMode === 'stacked' ? 42 : 24}
                              />
                              <Bar
                                dataKey="Neutral"
                                stackId={stackedLayoutMode === 'stacked' ? 'breakdownStack' : undefined}
                                fill="url(#neuGrad)"
                                radius={stackedLayoutMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                                maxBarSize={stackedLayoutMode === 'stacked' ? 42 : 24}
                              />
                              <Bar
                                dataKey="Negative"
                                stackId={stackedLayoutMode === 'stacked' ? 'breakdownStack' : undefined}
                                fill="url(#negGrad)"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={stackedLayoutMode === 'stacked' ? 42 : 24}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

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
                    <Card elevation={0} sx={{ border: '1.5px solid #e2e8f0', borderRadius: 3.5, mb: 3, backgroundColor: 'white', overflow: 'hidden' }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Header Title & Badges */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <AssessmentIcon sx={{ color: '#4338ca', fontSize: 22 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                Frequently Used Words
                              </Typography>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#64748b', mt: 0.2 }}>
                                Frequently mentioned terms across patron feedback
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip
                              label={`${wordCloudWords.length} Words`}
                              size="small"
                              sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', bgcolor: '#f1f5f9', color: '#475569', borderRadius: 1.5 }}
                            />
                            {selectedWordFilter && (
                              <Chip
                                label={`Filter: "${selectedWordFilter}"`}
                                color="warning"
                                size="small"
                                onDelete={() => setSelectedWordFilter('')}
                                sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', borderRadius: 1.5, bgcolor: '#f57c00', color: 'white' }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Word Cloud Canvas */}
                        {wordCloudWords.length === 0 ? (
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#94a3b8', textAlign: 'center', py: 6 }}>
                            No comment text available for the selected filters.
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              height: 350,
                              borderRadius: 3,
                              p: 2,
                              bgcolor: '#fafafa',
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                              '& svg text': {
                                cursor: 'pointer',
                                fontFamily: 'Poppins, sans-serif !important',
                                transition: 'none !important',
                              },
                              '& svg text:hover': {
                                opacity: '0.8 !important',
                              }
                            }}
                          >
                            <ReactWordcloud
                              words={wordCloudWords}
                              options={wordCloudOptions}
                              minSize={[300, 300]}
                              callbacks={wordCloudCallbacks}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    {/* ── Survey Response Review Table (Identical Theme Design to LoginDashboard) ───── */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#1e293b' }}>
                            Survey Response Review ({reviewRows.length} Matches)
                          </Typography>
                          {selectedWordFilter && (
                            <Chip
                              label={`Word Filter: "${selectedWordFilter}"`}
                              color="warning"
                              size="small"
                              onDelete={() => setSelectedWordFilter('')}
                              sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', borderRadius: 1.5, bgcolor: '#f57c00', color: 'white' }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                          {selectedRowIds.length > 0 && (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => openDeleteModal(null)}
                              startIcon={<DeleteIcon />}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontFamily: 'Poppins, sans-serif', height: 40 }}
                            >
                              Delete Selected ({selectedRowIds.length})
                            </Button>
                          )}
                        </Box>
                      </Box>

                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{
                              backgroundColor: '#1d0a61',
                              borderBottom: '3px solid #f57c00',
                              '& th': {
                                color: 'white',
                                fontWeight: 700,
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: 13,
                                py: 1.5,
                                borderRight: '1px solid rgba(255, 255, 255, 0.25)',
                                '&:last-child': { borderRight: 'none' }
                              }
                            }}>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  size="small"
                                  checked={isAllPageSelected}
                                  indeterminate={isSomePageSelected}
                                  onChange={handleSelectAllOnPage}
                                  sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' } }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                  active={sortField === 'Clientele'}
                                  direction={sortField === 'Clientele' ? sortOrder : 'asc'}
                                  onClick={() => handleRequestSort('Clientele')}
                                  sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                  Clientele
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                  active={sortField === 'College'}
                                  direction={sortField === 'College' ? sortOrder : 'asc'}
                                  onClick={() => handleRequestSort('College')}
                                  sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                  College / Dept
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                  active={sortField === 'Message'}
                                  direction={sortField === 'Message' ? sortOrder : 'asc'}
                                  onClick={() => handleRequestSort('Message')}
                                  sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                  Patron Feedback Response
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                  active={sortField === 'SentimentResult'}
                                  direction={sortField === 'SentimentResult' ? sortOrder : 'asc'}
                                  onClick={() => handleRequestSort('SentimentResult')}
                                  sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                  Sentiment
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                  active={sortField === 'Category'}
                                  direction={sortField === 'Category' ? sortOrder : 'asc'}
                                  onClick={() => handleRequestSort('Category')}
                                  sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                  Category
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                  active={sortField === 'DateSubmitted'}
                                  direction={sortField === 'DateSubmitted' ? sortOrder : 'asc'}
                                  onClick={() => handleRequestSort('DateSubmitted')}
                                  sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                >
                                  Date Submitted
                                </TableSortLabel>
                              </TableCell>
                              <TableCell align="center" sx={{ color: 'white' }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pageRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', width: 54, height: 54 }}>
                                      <InboxIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: '#334155', mt: 1 }}>
                                      No survey responses found
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b', maxWidth: 360 }}>
                                      Try adjusting your date range or filter selections to view sentiment feedback.
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={handleClear}
                                      startIcon={<RestartAltIcon />}
                                      sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}
                                    >
                                      Clear All Filters
                                    </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ) : (
                              pageRows.map((row, i) => {
                                const isSelected = selectedRowIds.includes(row.Id);
                                const submittedDateStr = row.DateSubmitted
                                  ? new Date(row.DateSubmitted.replace ? row.DateSubmitted.replace(' ', 'T') : row.DateSubmitted).toLocaleDateString()
                                  : 'N/A';

                                return (
                                  <TableRow
                                    key={row.Id || i}
                                    hover
                                    selected={isSelected}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        size="small"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectRow(row.Id)}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>
                                      {row.Clientele || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#1a237e' }}>
                                      {row.College || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: '#1e293b', py: 1.5, pr: 3, lineHeight: 1.4 }}>
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
                                    <TableCell sx={{ py: 1.5 }}>
                                      <SentimentChip label={row.SentimentResult} />
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                      <CategoryChip label={row.Category} />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, color: '#64748b', fontWeight: 500, py: 1.5 }}>
                                      {submittedDateStr}
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => openDeleteModal(row)}
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
                                );
                              })
                            )}
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
                    </Paper>
                  </>
                )}
              </Box>
            )}

            {/* ── Custom Deletion Confirmation Dialog ───── */}
            <Dialog open={deleteConfirmOpen} onClose={() => !deleting && setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3.5, p: 1, maxWidth: 440 } }}>
              <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
                {recordToDelete ? 'Confirm Review Deletion' : `Confirm Batch Deletion (${selectedRowIds.length} Records)`}
              </DialogTitle>
              <DialogContent>
                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                  {recordToDelete
                    ? 'Are you sure you want to delete this sentiment review from the dashboard? This action cannot be undone.'
                    : `Are you sure you want to delete ${selectedRowIds.length} selected review entries? This action cannot be undone.`}
                </Typography>
                {recordToDelete && recordToDelete.Message && (
                  <Box sx={{ mt: 2, p: 1.8, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, fontStyle: 'italic', color: '#1e293b' }}>
                      "{recordToDelete.Message}"
                    </Typography>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: '#64748b', mt: 0.5, fontWeight: 600 }}>
                      {recordToDelete.Clientele} • {recordToDelete.College}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting} sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
                  Cancel
                </Button>
                <Button onClick={confirmDeleteRecord} disabled={deleting} variant="contained" color="error" sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                  {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Review'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* ── Snackbar Alert Toasts ───── */}
            <Snackbar open={Boolean(snackbarMsg)} autoHideDuration={4000} onClose={() => setSnackbarMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Alert onClose={() => setSnackbarMsg('')} severity="info" sx={{ width: '100%', fontFamily: 'Poppins, sans-serif', fontWeight: 600, borderRadius: 3 }}>
                {snackbarMsg}
              </Alert>
            </Snackbar>

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