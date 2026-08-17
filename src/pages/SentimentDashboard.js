import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip,
  TableSortLabel, Snackbar, Alert,
  Checkbox, ToggleButton, ToggleButtonGroup
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
  CalendarToday as CalendarTodayIcon,
  RestartAlt as RestartAltIcon,
  Inbox as InboxIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  Lightbulb as LightbulbIcon,
  RateReview as RateReviewIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ReactWordcloud from 'react-wordcloud';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

// ── Centralized imports from extracted modules ──────────────────────────────
import {
  THEME,
  sectionHeaderSx,
  cardShellSx,
  sectionTitleSx,
  sectionSubtitleSx,
  sectionIconSx,
  selectSx,
  menuItemSx,
  datePresetBtnSx,
  paginationBtnSx,
  tableHeaderRowSx,
  tableSortLabelSx,
} from '../constants/themeTokens';

import {
  CLIENTELE_OPTIONS,
  COLLEGE_OPTIONS,
  CATEGORY_OPTIONS,
  MONTH_NAMES,
  ROWS_PER_PAGE,
  RECOMMENDATIONS,
  CATEGORY_KEYWORDS,
} from '../constants/sentimentConstants';

import {
  formatRatingShort,
  getSatisfactionAverage,
  getSurveyScore,
  stemWord,
  buildTermFrequencies,
  scoreCommentsWithLexicon,
  selectDiverseTopComments,
} from '../constants/sentimentUtils';

import {
  SentimentChip,
  CategoryChip,
  SummaryCard,
  TopCommentsCard,
  CustomSentimentStackedTooltip,
  CustomDonutGaugeTooltip,
} from '../Components/SentimentCharts';

// Re-export for external consumers (e.g. other pages importing CONTROLLED_LEXICON)
export { CONTROLLED_LEXICON } from '../constants/sentimentConstants';

const T = THEME;

const SentimentDashboard = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [, setLoggedInUser] = useState('');

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
  const [allSurveys, setAllSurveys] = useState([]);
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
  const [, setWcSearch] = useState('');
  const [, setWcSentimentFilter] = useState('All');
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

  const printRef = useRef();

  const fetchSurveys = async (sDate = startDate, eDate = endDate) => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/surveys', {
        params: { startDate: sDate, endDate: eDate },
      });
      setSurveys(response.data);
      if (!sDate && !eDate) {
        setAllSurveys(response.data);
      }
      setPage(0);
      setSelectedRowIds([]);
    } catch (err) {
      console.error('Error fetching surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
    // Pre-fetch all surveys to guarantee stable, fixed Top 5 comments regardless of active date filters
    axios.get('http://localhost:5000/api/surveys')
      .then(res => setAllSurveys(res.data))
      .catch(err => console.error('Error prefetching all surveys:', err));
  }, []); // eslint-disable-line

  const handleDatePreset = (presetKey) => {
    const today = new Date();
    const formatISO = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let newStart = '';
    let newEnd = '';

    if (presetKey === 'today') {
      const dateStr = formatISO(today);
      newStart = dateStr;
      newEnd = dateStr;
    } else if (presetKey === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
      newStart = formatISO(startOfWeek);
      newEnd = formatISO(new Date());
    } else if (presetKey === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      newStart = formatISO(startOfMonth);
      newEnd = formatISO(new Date());
    } else if (presetKey === 'all') {
      newStart = '';
      newEnd = '';
    }
    setStartDate(newStart);
    setEndDate(newEnd);
    setPage(0);
    fetchSurveys(newStart, newEnd);
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
          setAllSurveys(prev => prev.filter(s => s.Id !== recordToDelete.Id));
          setSelectedRowIds(prev => prev.filter(id => id !== recordToDelete.Id));
          setSnackbarMsg('Review entry deleted successfully.');
        }
      } else if (selectedRowIds.length > 0) {
        const deletePromises = selectedRowIds.map(id => axios.delete(`http://localhost:5000/api/surveys/${id}`));
        await Promise.all(deletePromises);
        setSurveys(prev => prev.filter(s => !selectedRowIds.includes(s.Id)));
        setAllSurveys(prev => prev.filter(s => !selectedRowIds.includes(s.Id)));
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
      fetchSurveys('', '');
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
    fetchSurveys('', '');
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


  // ── Sentiment Distribution by Category (Multi-Donut Rings) ────────────────
  const categoryDonutData = useMemo(() => {
    const categories = ['Facilities', 'Staff', 'Collection'];
    return categories.map(cat => {
      const items = filtered.filter(s => (s.Category || 'Other/Uncategorized') === cat);
      const pos = items.filter(s => s.SentimentResult === 'Positive').length;
      const neu = items.filter(s => s.SentimentResult === 'Neutral').length;
      const neg = items.filter(s => s.SentimentResult === 'Negative').length;
      const tot = items.length;

      const posPct = tot > 0 ? Math.round((pos / tot) * 100) : 0;
      const neuPct = tot > 0 ? Math.round((neu / tot) * 100) : 0;
      const negPct = tot > 0 ? Math.max(0, 100 - posPct - neuPct) : 0;

      const slices = tot > 0 ? [
        { name: 'Positive', value: posPct, count: pos, color: 'url(#sentDonutPosGrad)', solidColor: T.chart.donutGradients.positive.start },
        { name: 'Neutral', value: neuPct, count: neu, color: 'url(#sentDonutNeuGrad)', solidColor: T.chart.donutGradients.neutral.start },
        { name: 'Negative', value: negPct, count: neg, color: 'url(#sentDonutNegGrad)', solidColor: T.chart.donutGradients.negative.start },
      ].filter(s => s.value > 0) : [
        { name: 'No Data', value: 100, count: 0, color: T.surface.borderLight, solidColor: T.surface.borderLight }
      ];

      return {
        name: cat,
        total: tot,
        posPct,
        slices
      };
    });
  }, [filtered]);

  // ── Word/Term Frequency for Word Cloud ────────────────────────────────────
  const { freq: termFrequencies = {}, displayMap: stemToOriginalMap = {} } = useMemo(() => {
    return buildTermFrequencies(filtered.length > 0 ? filtered : surveys);
  }, [filtered, surveys]);

  const commentsMasterPool = allSurveys.length > 0 ? allSurveys : surveys;

  const positivePool = commentsMasterPool.filter(s => {
    if (s.SentimentResult !== 'Positive' || !s.Message?.trim()) return false;
    return true;
  });
  const negativePool = commentsMasterPool.filter(s => {
    if (s.SentimentResult !== 'Negative' || !s.Message?.trim()) return false;
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
    fontFamily: T.font.family,
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
        return T.status.wordHighlight;
      }
      const charCodeSum = (word.text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return T.wordCloudColors[charCodeSum % T.wordCloudColors.length];
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
      'Course': row.Course || 'N/A',
      'Text Response Inputted': row.Message || '',
      'Q1': formatRatingShort(row.Question1),
      'Q2': formatRatingShort(row.Question2),
      'Q3': formatRatingShort(row.Question3),
      'Q4': formatRatingShort(row.Question4),
      'Q5': formatRatingShort(row.Question5),
      'Q6': formatRatingShort(row.Question6),
      'Q7': formatRatingShort(row.Question7),
      'Q8': formatRatingShort(row.Question8),
      'Q9': formatRatingShort(row.Question9),
      'Q10': formatRatingShort(row.Question10),
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
            @page { size: landscape; margin: 8mm; }
            body { font-family: Arial, sans-serif; padding: 15px; color: #000; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
            h2 { text-align: center; font-size: 13px; font-weight: normal; margin-bottom: 4px; color: #444; }
            p.daterange { text-align: center; font-size: 12px; color: #666; margin-bottom: 15px; }
            .summary { display: flex; justify-content: space-around; gap: 10px; margin-bottom: 15px; }
            .summary-box { border: 1px solid #ccc; border-radius: 6px; padding: 8px; text-align: center; flex: 1; }
            .summary-box .value { font-size: 20px; font-weight: bold; }
            .summary-box.pos .value { color: ${T.sentiment.Positive.text}; }
            .summary-box.neu .value { color: ${T.sentiment.Neutral.text}; }
            .summary-box.neg .value { color: ${T.sentiment.Negative.text}; }
            .summary-box.tot .value { color: #1e3a8a; }
            .summary-box .label { font-size: 11px; color: #555; margin-top: 2px; font-weight: bold; }
            .scale-legend { font-size: 10.5px; color: ${T.text.secondary}; background: ${T.surface.cardAlt}; border: 1px solid ${T.surface.border}; padding: 6px 10px; border-radius: 4px; margin-bottom: 12px; text-align: center; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
            th { background-color: #334155; color: white; padding: 6px 4px; text-align: left; font-size: 10px; }
            td { padding: 5px 4px; border-bottom: 1px solid #eee; word-break: break-word; font-size: 9.5px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .q-cell { text-align: center; font-weight: bold; }
            .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #999; }
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

  // ── Gradient defs for charts ──────────────────────────────────────────────
  const gP = T.chart.gradients.positive;
  const gN = T.chart.gradients.neutral;
  const gNe = T.chart.gradients.negative;
  const dP = T.chart.donutGradients.positive;
  const dNu = T.chart.donutGradients.neutral;
  const dNe = T.chart.donutGradients.negative;

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
              <Box sx={{ p: { xs: 2, md: 3 }, background: T.surface.backgroundGrad, minHeight: '100vh' }}>
                {/* ── Modern Header Action Bar Banner ───── */}
                <Paper elevation={0} sx={{
                  p: 2.5, mb: 3, borderRadius: T.radius.card,
                  bgcolor: T.surface.card,
                  border: `1.5px solid ${T.surface.border}`,
                  borderLeft: `6px solid ${T.brand.accent}`,
                  boxShadow: T.shadow.card,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2
                }}>
                  <Box>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: T.text.primary }}>
                      Henry Luce III Library Sentiment Analysis Dashboard
                    </Typography>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: 13.5, color: T.text.secondary, fontWeight: 500, mt: 0.5 }}>
                      Patron feedback sentiment breakdown, category distribution, and satisfaction analytics
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handlePrint}
                      startIcon={<PrintIcon />}
                      sx={{
                        borderRadius: T.radius.button, height: 44, px: 3,
                        fontFamily: T.font.family, fontSize: 14, fontWeight: 700, textTransform: 'none',
                        borderColor: T.surface.border, color: T.text.body, bgcolor: T.surface.card, borderWidth: '1.5px',
                        '&:hover': { borderColor: T.surface.borderHover, bgcolor: T.surface.cardAlt, borderWidth: '1.5px' }
                      }}
                    >
                      Print / Save PDF
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleExportExcel}
                      startIcon={<FileDownloadIcon />}
                      sx={{
                        borderRadius: T.radius.button, height: 44, px: 3,
                        fontFamily: T.font.family, fontSize: 14, fontWeight: 700, textTransform: 'none',
                        bgcolor: T.status.success,
                        boxShadow: `0 4px 12px ${T.status.successShadow}`,
                        '&:hover': { bgcolor: T.status.successHover }
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
                        borderRadius: T.radius.button, height: 44, px: 2.5,
                        fontFamily: T.font.family, fontSize: 14, fontWeight: 700, textTransform: 'none',
                        borderColor: T.status.errorBorder, color: T.status.errorText,
                        bgcolor: T.surface.card, borderWidth: '1.5px',
                        '&:hover': { bgcolor: T.status.errorLight, borderColor: T.sentiment.Negative.dot, borderWidth: '1.5px' }
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                </Paper>

                {/* ── Filter Controls Container ───── */}
                <Paper elevation={0} sx={{
                  mb: 3, ...cardShellSx,
                }}>
                  <Box sx={{ ...sectionHeaderSx }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <FilterAltIcon sx={sectionIconSx} />
                      <Typography sx={{ ...sectionTitleSx }}>
                        Filter & Analytics Controls
                      </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: T.sentiment.Neutral.dot, fontWeight: 700, bgcolor: 'rgba(255,255,255,0.1)', px: 1.5, py: 0.3, borderRadius: 2 }}>
                      {filtered.length} matching response{filtered.length === 1 ? '' : 's'}
                    </Typography>
                  </Box>

                  {/* ── Quick Date Presets Row ───── */}
                  <Box sx={{ px: 3, pt: 2, pb: 1.5, bgcolor: T.surface.cardAlt, borderBottom: `1.5px solid ${T.surface.borderLight}`, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 700, color: T.text.secondary, mr: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: T.brand.indigo }} /> Quick Date Range:
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('today')} sx={datePresetBtnSx}>Today</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('week')} sx={datePresetBtnSx}>This Week</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('month')} sx={datePresetBtnSx}>This Month</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('all')} sx={datePresetBtnSx}>All Time</Button>
                  </Box>

                  <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={selectSx} />
                    <TextField type="date" label="End Date" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={selectSx} />
                    <FormControl sx={selectSx}>
                      <InputLabel>Clientele</InputLabel>
                      <Select value={filterClientele} label="Clientele" onChange={(e) => { setFilterClientele(e.target.value); setPage(0); }}>
                        <MenuItem value="" sx={menuItemSx}>All</MenuItem>
                        {CLIENTELE_OPTIONS.map(c => (<MenuItem key={c} value={c.toLowerCase()} sx={menuItemSx}>{c}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>College</InputLabel>
                      <Select value={filterCollege} label="College" onChange={(e) => { setFilterCollege(e.target.value); setPage(0); }}>
                        <MenuItem value="" sx={menuItemSx}>All</MenuItem>
                        {COLLEGE_OPTIONS.map(c => (<MenuItem key={c} value={c} sx={menuItemSx}>{c}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Sentiment</InputLabel>
                      <Select value={filterSentiment} label="Sentiment" onChange={(e) => { setFilterSentiment(e.target.value); setPage(0); }}>
                        <MenuItem value="" sx={menuItemSx}>All</MenuItem>
                        <MenuItem value="Positive" sx={menuItemSx}>Positive</MenuItem>
                        <MenuItem value="Neutral" sx={menuItemSx}>Neutral</MenuItem>
                        <MenuItem value="Negative" sx={menuItemSx}>Negative</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Category</InputLabel>
                      <Select value={filterCategory} label="Category" onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}>
                        <MenuItem value="" sx={menuItemSx}>All</MenuItem>
                        {CATEGORY_OPTIONS.map(c => (<MenuItem key={c} value={c} sx={menuItemSx}>{c}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Year</InputLabel>
                      <Select value={filterYear} label="Year" onChange={(e) => { setFilterYear(e.target.value); setPage(0); }}>
                        <MenuItem value="All" sx={menuItemSx}>All Years</MenuItem>
                        {availableYears.map(yr => (<MenuItem key={yr} value={yr} sx={menuItemSx}>{yr}</MenuItem>))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      onClick={fetchSurveys}
                      sx={{
                        bgcolor: T.brand.indigo, px: 3.5, height: 46, borderRadius: T.radius.button,
                        textTransform: 'none', fontFamily: T.font.family, fontWeight: 700, fontSize: 15,
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.25)',
                        '&:hover': { bgcolor: T.brand.indigoHover }
                      }}
                    >
                      Apply Filters
                    </Button>
                    {hasActiveFilter && (
                      <Button
                        variant="outlined" color="inherit" onClick={handleClear}
                        sx={{
                          height: 46, px: 3, borderRadius: T.radius.button, textTransform: 'none',
                          fontFamily: T.font.family, fontWeight: 700, fontSize: 15,
                          borderColor: T.surface.border, borderWidth: '1.5px',
                          '&:hover': { borderWidth: '1.5px', borderColor: T.surface.borderHover }
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </Box>

                  {/* ── Active Filter Chips Row ───── */}
                  {hasActiveFilter && (
                    <Box sx={{ px: 3, pb: 2, pt: 1.5, bgcolor: T.surface.cardAlt, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', borderTop: `1.5px solid ${T.surface.borderLight}` }}>
                      <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, fontWeight: 700, color: T.text.secondary }}>
                        Active Filters:
                      </Typography>
                      {(startDate || endDate) && (
                        <Chip label={`Date: ${startDate || 'Start'} to ${endDate || 'End'}`} onDelete={() => handleRemoveFilter('date')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: T.filterChips.date.bg, color: T.filterChips.date.color, border: `1.5px solid ${T.filterChips.date.border}` }} />
                      )}
                      {filterClientele && (
                        <Chip label={`Clientele: ${filterClientele}`} onDelete={() => handleRemoveFilter('clientele')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: T.filterChips.clientele.bg, color: T.filterChips.clientele.color, border: `1.5px solid ${T.filterChips.clientele.border}` }} />
                      )}
                      {filterCollege && (
                        <Chip label={`College: ${filterCollege}`} onDelete={() => handleRemoveFilter('college')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: T.filterChips.college.bg, color: T.filterChips.college.color, border: `1.5px solid ${T.filterChips.college.border}` }} />
                      )}
                      {filterSentiment && (
                        <Chip label={`Sentiment: ${filterSentiment}`} onDelete={() => handleRemoveFilter('sentiment')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: T.filterChips.sentiment.bg, color: T.filterChips.sentiment.color, border: `1.5px solid ${T.filterChips.sentiment.border}` }} />
                      )}
                      {filterCategory && (
                        <Chip label={`Category: ${filterCategory}`} onDelete={() => handleRemoveFilter('category')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: T.filterChips.category.bg, color: T.filterChips.category.color, border: `1.5px solid ${T.filterChips.category.border}` }} />
                      )}
                      <Button size="small" onClick={handleClear} startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
                        sx={{ fontFamily: T.font.family, textTransform: 'none', fontWeight: 700, fontSize: 12, color: '#ef4444', ml: 'auto' }}>
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
                    {/* ── Top Metric KPI Cards Grid ───── */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2.5, mb: 3 }}>
                      <SummaryCard title="Avg Satisfaction" value={avgSatisfaction.toFixed(2)} subtitle="Scale: 1.0 to 5.0" icon={<StarIcon />} color="#8b5cf6" tooltipContent="Average patron score across satisfaction survey questions (1.0 to 5.0 scale)" />
                      <SummaryCard title="Positive" value={counts.Positive} subtitle={`${total > 0 ? Math.round((counts.Positive / total) * 100) : 0}% of responses`} icon={<ThumbUpIcon />} color={T.sentiment.Positive.bg} tooltipContent={`Positive Sentiments: ${counts.Positive} responses (${total > 0 ? Math.round((counts.Positive / total) * 100) : 0}% of total)`} />
                      <SummaryCard title="Neutral" value={counts.Neutral} subtitle={`${total > 0 ? Math.round((counts.Neutral / total) * 100) : 0}% of responses`} icon={<SentimentSatisfiedIcon />} color={T.sentiment.Neutral.bg} tooltipContent={`Neutral Sentiments: ${counts.Neutral} responses (${total > 0 ? Math.round((counts.Neutral / total) * 100) : 0}% of total)`} />
                      <SummaryCard title="Negative" value={counts.Negative} subtitle={`${total > 0 ? Math.round((counts.Negative / total) * 100) : 0}% of responses`} icon={<ThumbDownIcon />} color={T.sentiment.Negative.bg} tooltipContent={`Negative Sentiments: ${counts.Negative} responses (${total > 0 ? Math.round((counts.Negative / total) * 100) : 0}% of total)`} />
                      <SummaryCard title="Total Analyzed" value={total} subtitle="Survey responses" icon={<AssessmentIcon />} color={T.brand.indigo} tooltipContent={`Total Filtered Surveys: ${total} responses matching current filters`} />
                    </Box>

                    {/* ── 12-Month Sentiment Trend Bar Graph ───── */}
                    <Card elevation={0} sx={{ ...cardShellSx, mb: 3 }}>
                      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <TrendingUpIcon sx={sectionIconSx} />
                          <Box>
                            <Typography sx={sectionTitleSx}>
                              Sentiment Trend (12-Month {barChartMode === 'stacked' ? 'Stacked Bar' : 'Side-by-Side'} View) — {filterYear === 'All' ? 'All Batched Years' : `Year ${filterYear}`}
                            </Typography>
                            <Typography sx={sectionSubtitleSx}>
                              {barChartMode === 'stacked'
                                ? 'Stacked breakdown of Positive, Neutral, and Negative responses per month'
                                : 'Side-by-Side comparison of Positive, Neutral, and Negative responses per month'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <ToggleButtonGroup
                            value={barChartMode} exclusive
                            onChange={(e, newMode) => { if (newMode) setBarChartMode(newMode); }}
                            size="small"
                            sx={{
                              height: 38, borderRadius: T.radius.input, bgcolor: T.surface.card,
                              '& .MuiToggleButton-root': {
                                fontFamily: T.font.family, fontSize: 12, fontWeight: 700, textTransform: 'none', px: 1.5,
                                color: T.brand.primary,
                                '&.Mui-selected': { bgcolor: T.brand.accent, color: T.brand.primary, fontWeight: 800, '&:hover': { bgcolor: T.brand.accentHover } }
                              }
                            }}
                          >
                            <ToggleButton value="stacked">Stacked Bar</ToggleButton>
                            <ToggleButton value="grouped">Side-by-Side</ToggleButton>
                          </ToggleButtonGroup>

                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: T.text.white }}>Year</InputLabel>
                            <Select
                              value={filterYear} label="Year" onChange={(e) => setFilterYear(e.target.value)}
                              sx={{ height: 38, borderRadius: T.radius.input, fontFamily: T.font.family, fontWeight: 700, fontSize: 13, bgcolor: T.surface.card, color: T.text.primary }}
                            >
                              <MenuItem value="All" sx={{ fontFamily: T.font.family, fontWeight: 600, fontSize: 13 }}>All Years</MenuItem>
                              {availableYears.map(yr => (<MenuItem key={yr} value={yr} sx={{ fontFamily: T.font.family, fontWeight: 600, fontSize: 13 }}>{yr}</MenuItem>))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={monthly12MonthData} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
                            <defs>
                              <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={gP.start} />
                                <stop offset="100%" stopColor={gP.end} />
                              </linearGradient>
                              <linearGradient id="neuGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={gN.start} />
                                <stop offset="100%" stopColor={gN.end} />
                              </linearGradient>
                              <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={gNe.start} />
                                <stop offset="100%" stopColor={gNe.end} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface.borderLight} />
                            <XAxis dataKey="month" tick={{ fontFamily: T.font.family, fontSize: 12, fill: T.text.secondary, fontWeight: 600 }} />
                            <YAxis allowDecimals={false} tick={{ fontFamily: T.font.family, fontSize: 12, fill: T.text.secondary }} />
                            <RechartsTooltip content={<CustomSentimentStackedTooltip />} />
                            <Legend wrapperStyle={{ fontFamily: T.font.family, fontSize: 13, paddingTop: 12 }} />
                            <Bar dataKey="Positive" stackId={barChartMode === 'stacked' ? 'monthlyStack' : undefined} fill="url(#posGrad)" radius={barChartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]} maxBarSize={barChartMode === 'stacked' ? 36 : 28} />
                            <Bar dataKey="Neutral" stackId={barChartMode === 'stacked' ? 'monthlyStack' : undefined} fill="url(#neuGrad)" radius={barChartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]} maxBarSize={barChartMode === 'stacked' ? 36 : 28} />
                            <Bar dataKey="Negative" stackId={barChartMode === 'stacked' ? 'monthlyStack' : undefined} fill="url(#negGrad)" radius={[6, 6, 0, 0]} maxBarSize={barChartMode === 'stacked' ? 36 : 28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* ── Sentiment Distribution by Category (Donut Rings) ───── */}
                    <Card elevation={0} sx={{ ...cardShellSx, mb: 3 }}>
                      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <PieChartIcon sx={sectionIconSx} />
                          <Box>
                            <Typography sx={sectionTitleSx}>Sentiment Distribution by Category</Typography>
                            <Typography sx={sectionSubtitleSx}>Categorical satisfaction distribution across library key service areas</Typography>
                          </Box>
                        </Box>

                        {/* Legend Indicators */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          {[
                            { label: 'Positive', grad: `linear-gradient(135deg, ${dP.start} 0%, ${dP.end} 100%)` },
                            { label: 'Neutral', grad: `linear-gradient(135deg, ${dNu.start} 0%, ${dNu.end} 100%)` },
                            { label: 'Negative', grad: `linear-gradient(135deg, ${dNe.start} 0%, ${dNe.end} 100%)` },
                          ].map(item => (
                            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.4, py: 0.4, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)' }}>
                              <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: item.grad }} />
                              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, color: T.text.white, fontWeight: 700 }}>{item.label}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, alignItems: 'stretch', pt: 0.5 }}>
                          {categoryDonutData.map((donut) => {
                            const catColor = T.categoryDonut[donut.name] || T.brand.indigo;
                            return (
                              <Box key={donut.name} sx={{
                                position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                bgcolor: T.surface.cardAlt, border: `1.5px solid ${T.surface.borderLight}`, borderTop: `3.5px solid ${catColor}`,
                                borderRadius: 3, p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                              }}>
                                <Chip label={donut.name} size="small" sx={{ fontWeight: 800, fontFamily: T.font.family, bgcolor: `${catColor}15`, color: catColor, border: `1.5px solid ${catColor}35`, mb: 0.5 }} />
                                <ResponsiveContainer width="100%" height={210}>
                                  <PieChart>
                                    <defs>
                                      <linearGradient id="sentDonutPosGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={dP.start} />
                                        <stop offset="100%" stopColor={dP.end} />
                                      </linearGradient>
                                      <linearGradient id="sentDonutNeuGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={dNu.start} />
                                        <stop offset="100%" stopColor={dNu.end} />
                                      </linearGradient>
                                      <linearGradient id="sentDonutNegGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={dNe.start} />
                                        <stop offset="100%" stopColor={dNe.end} />
                                      </linearGradient>
                                    </defs>
                                    <Pie data={donut.slices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={donut.slices.length > 1 ? 4 : 0} cornerRadius={donut.slices.length > 1 ? 4 : 0} startAngle={90} endAngle={-270} stroke={T.surface.card} strokeWidth={2}>
                                      {donut.slices.map((entry, i) => (<Cell key={`cell-${donut.name}-${i}`} fill={entry.color} />))}
                                    </Pie>
                                    {donut.total > 0 && <RechartsTooltip content={<CustomDonutGaugeTooltip />} />}
                                  </PieChart>
                                </ResponsiveContainer>
                                {/* Centered Label inside the Donut Hole */}
                                <Box sx={{ position: 'absolute', top: '56%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                                  <Typography sx={{ fontFamily: T.font.family, fontWeight: 800, fontSize: 18, color: T.text.heading, lineHeight: 1.1 }}>{donut.posPct}%</Typography>
                                  <Typography sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 11, color: dP.start }}>Positive</Typography>
                                  <Typography sx={{ fontFamily: T.font.family, fontWeight: 500, fontSize: 10, color: T.text.muted, mt: 0.2 }}>{donut.total} responses</Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </CardContent>
                    </Card>

                    {/* ── Top Positive & Negative Comments Grid ───── */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                      <TopCommentsCard title="Top 5 Positive Comments" rows={topPositive} type="positive" icon={<ThumbUpIcon />} />
                      <TopCommentsCard title="Top 5 Negative Comments" rows={topNegative} type="negative" icon={<ThumbDownIcon />} />
                    </Box>

                    {/* ── Service Improvement Recommendations ───── */}
                    <Card elevation={0} sx={{ ...cardShellSx, mb: 3 }}>
                      <Box sx={{ ...sectionHeaderSx, justifyContent: 'flex-start', gap: 1.2 }}>
                        <LightbulbIcon sx={sectionIconSx} />
                        <Box>
                          <Typography sx={sectionTitleSx}>Service Improvement Recommendations</Typography>
                          <Typography sx={sectionSubtitleSx}>Actionable priority insights derived from negative patron sentiment signals</Typography>
                        </Box>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        {categoryStats.length === 0 ? (
                          <Typography sx={{ fontFamily: T.font.family, color: T.text.faint, textAlign: 'center', py: 6 }}>
                            No category is currently above the concern threshold.
                          </Typography>
                        ) : categoryStats.map(c => (
                          <Box key={c.category} sx={{
                            mb: 2.5, p: 2.5,
                            bgcolor: c.severity === 'high' ? T.status.errorLight : T.status.warningLight,
                            border: `1.5px solid ${c.severity === 'high' ? T.status.errorBorder : T.status.warningBorder}`,
                            borderLeft: `5px solid ${c.severity === 'high' ? T.status.errorText : T.status.warningText}`,
                            borderRadius: 3
                          }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap' }}>
                              <Box sx={{
                                px: 1.8, py: 0.5, borderRadius: T.radius.chip, flexShrink: 0,
                                backgroundColor: T.surface.card,
                                border: `1.5px solid ${c.severity === 'high' ? T.sentiment.Negative.dot : T.sentiment.Neutral.dot}`,
                              }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: c.severity === 'high' ? T.sentiment.Negative.text : T.sentiment.Neutral.text, fontFamily: T.font.family }}>
                                  {c.category} — {c.pct}% negative — {c.severity.toUpperCase()}
                                </Typography>
                              </Box>
                              <Typography sx={{ fontFamily: T.font.family, fontSize: 14, color: T.text.heading, fontWeight: 600, mt: 0.2 }}>
                                {RECOMMENDATIONS[c.category][c.severity]}
                              </Typography>
                            </Box>

                            {c.matchedKeywords.length > 0 && (
                              <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, color: T.text.secondary, fontStyle: 'italic', ml: 0.5, mb: 1.5 }}>
                                <strong>Frequent Category Issue Signals:</strong> {c.matchedKeywords.join('; ')}
                              </Typography>
                            )}

                            {c.topEvidences.length > 0 && (
                              <Box sx={{ mt: 1.5, p: 2, backgroundColor: T.surface.card, borderRadius: T.radius.input, border: `1px solid ${T.surface.borderLight}`, borderLeft: `4px solid ${T.status.info}` }}>
                                <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 800, color: T.status.info, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                                  Supporting Patron Feedback Evidence {c.primaryKw ? `— Top Issue Keyword: "${c.primaryKw}"` : ''} ({c.topEvidences.length})
                                </Typography>
                                {c.topEvidences.map((ev, idx) => (
                                  <Box key={idx} sx={{ py: 0.8, borderBottom: idx < c.topEvidences.length - 1 ? `1px dashed ${T.surface.borderLight}` : 'none' }}>
                                    <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: T.text.heading, fontWeight: 500 }}>
                                      "{ev.Message}"
                                    </Typography>
                                    <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, color: T.text.muted, mt: 0.3, fontWeight: 500 }}>
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
                    <Card elevation={0} sx={{ ...cardShellSx, mb: 3 }}>
                      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <AssessmentIcon sx={sectionIconSx} />
                          <Box>
                            <Typography sx={sectionTitleSx}>Frequently Used Words</Typography>
                            <Typography sx={sectionSubtitleSx}>Interactive keyword frequency cloud across patron feedback submissions</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip label={`${wordCloudWords.length} Words`} size="small"
                            sx={{ fontWeight: 700, fontFamily: T.font.family, bgcolor: 'rgba(255,255,255,0.15)', color: T.text.white, border: '1px solid rgba(255,255,255,0.3)', borderRadius: T.radius.pill }} />
                          {selectedWordFilter && (
                            <Chip label={`Filter: "${selectedWordFilter}"`} color="warning" size="small" onDelete={() => setSelectedWordFilter('')}
                              sx={{ fontWeight: 700, fontFamily: T.font.family, borderRadius: T.radius.pill, bgcolor: T.status.wordHighlight, color: 'white' }} />
                          )}
                        </Box>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        {wordCloudWords.length === 0 ? (
                          <Typography sx={{ fontFamily: T.font.family, color: T.text.faint, textAlign: 'center', py: 6 }}>
                            No comment text available for the selected filters.
                          </Typography>
                        ) : (
                          <Box sx={{
                            height: 350, borderRadius: 3, p: 2, bgcolor: T.surface.wordCloudBg,
                            border: `1.5px solid ${T.surface.borderLight}`, position: 'relative',
                            '& svg text': { cursor: 'pointer', fontFamily: `${T.font.family} !important`, transition: 'none !important' },
                            '& svg text:hover': { opacity: '0.8 !important' }
                          }}>
                            <ReactWordcloud words={wordCloudWords} options={wordCloudOptions} minSize={[300, 300]} callbacks={wordCloudCallbacks} />
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    {/* ── Survey Response Review Table ───── */}
                    <Paper elevation={0} sx={{ ...cardShellSx }}>
                      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <RateReviewIcon sx={sectionIconSx} />
                          <Box>
                            <Typography sx={sectionTitleSx}>Survey Response Review ({reviewRows.length} Matches)</Typography>
                            <Typography sx={sectionSubtitleSx}>Detailed row-by-row inspection with rating scores and NLP classifications</Typography>
                          </Box>
                          {selectedWordFilter && (
                            <Chip label={`Word Filter: "${selectedWordFilter}"`} color="warning" size="small" onDelete={() => setSelectedWordFilter('')}
                              sx={{ fontWeight: 700, fontFamily: T.font.family, borderRadius: T.radius.pill, bgcolor: T.status.wordHighlight, color: 'white', ml: 1 }} />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                          {selectedRowIds.length > 0 && (
                            <Button variant="contained" color="error" size="small" onClick={() => openDeleteModal(null)} startIcon={<DeleteIcon />}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontFamily: T.font.family, height: 38 }}>
                              Delete Selected ({selectedRowIds.length})
                            </Button>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ p: 3 }}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: `1.5px solid ${T.surface.border}`, borderRadius: T.radius.input, overflow: 'hidden' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={tableHeaderRowSx}>
                                <TableCell padding="checkbox">
                                  <Checkbox size="small" checked={isAllPageSelected} indeterminate={isSomePageSelected} onChange={handleSelectAllOnPage}
                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' } }} />
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel active={sortField === 'Clientele'} direction={sortField === 'Clientele' ? sortOrder : 'asc'} onClick={() => handleRequestSort('Clientele')} sx={tableSortLabelSx}>Clientele</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel active={sortField === 'College'} direction={sortField === 'College' ? sortOrder : 'asc'} onClick={() => handleRequestSort('College')} sx={tableSortLabelSx}>College / Dept</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel active={sortField === 'Message'} direction={sortField === 'Message' ? sortOrder : 'asc'} onClick={() => handleRequestSort('Message')} sx={tableSortLabelSx}>Patron Feedback Response</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel active={sortField === 'SentimentResult'} direction={sortField === 'SentimentResult' ? sortOrder : 'asc'} onClick={() => handleRequestSort('SentimentResult')} sx={tableSortLabelSx}>Sentiment</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel active={sortField === 'Category'} direction={sortField === 'Category' ? sortOrder : 'asc'} onClick={() => handleRequestSort('Category')} sx={tableSortLabelSx}>Category</TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel active={sortField === 'DateSubmitted'} direction={sortField === 'DateSubmitted' ? sortOrder : 'asc'} onClick={() => handleRequestSort('DateSubmitted')} sx={tableSortLabelSx}>Date Submitted</TableSortLabel>
                                </TableCell>
                                <TableCell align="center" sx={{ color: 'white' }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pageRows.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                      <Avatar sx={{ bgcolor: T.surface.cardAltHover, color: T.text.faint, width: 54, height: 54, border: `1.5px solid ${T.surface.border}` }}>
                                        <InboxIcon sx={{ fontSize: 32 }} />
                                      </Avatar>
                                      <Typography sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 16, color: T.text.body, mt: 1 }}>
                                        No survey responses found
                                      </Typography>
                                      <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: T.text.muted, maxWidth: 360 }}>
                                        Try adjusting your date range or filter selections to view sentiment feedback.
                                      </Typography>
                                      <Button size="small" variant="outlined" onClick={handleClear} startIcon={<RestartAltIcon />}
                                        sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontFamily: T.font.family, fontWeight: 600, borderColor: T.surface.border }}>
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
                                    <TableRow key={row.Id || i} hover selected={isSelected}
                                      sx={{
                                        bgcolor: i % 2 === 0 ? T.surface.card : T.surface.cardAlt,
                                        '&:hover': { bgcolor: 'rgba(26, 35, 126, 0.04) !important' },
                                        '&:last-child td, &:last-child th': { border: 0 }
                                      }}>
                                      <TableCell padding="checkbox">
                                        <Checkbox size="small" checked={isSelected} onChange={() => handleToggleSelectRow(row.Id)} />
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: T.font.family, fontSize: 13, color: T.text.body, fontWeight: 600, textTransform: 'capitalize' }}>
                                        {row.Clientele || 'N/A'}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 700, color: T.brand.indigo }}>
                                        <div>{row.College || 'N/A'}</div>
                                        {row.Course && (<div style={{ fontSize: '11.5px', color: T.text.muted, fontWeight: 500 }}>{row.Course}</div>)}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 600, color: T.text.heading, py: 1.5, pr: 3, lineHeight: 1.4 }}>
                                        {row.Message && row.Message.trim().length > 0 ? (
                                          row.Message
                                        ) : (
                                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                            <Typography component="span" sx={{ fontFamily: T.font.family, fontSize: 12.5, color: T.text.faint, fontStyle: 'italic' }}>
                                              (No written comment)
                                            </Typography>
                                            <Box sx={{ px: 1, py: 0.2, borderRadius: '12px', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', display: 'inline-block' }}>
                                              <Typography component="span" sx={{ fontSize: 10.5, fontWeight: 700, color: '#3730a3', fontFamily: T.font.family }}>
                                                Rating Only
                                              </Typography>
                                            </Box>
                                          </Box>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5 }}><SentimentChip label={row.SentimentResult} /></TableCell>
                                      <TableCell sx={{ py: 1.5 }}><CategoryChip label={row.Category} /></TableCell>
                                      <TableCell sx={{ fontFamily: T.font.family, fontSize: 12.5, color: T.text.muted, fontWeight: 500, py: 1.5 }}>{submittedDateStr}</TableCell>
                                      <TableCell align="center" sx={{ py: 1.5 }}>
                                        <Button variant="contained" size="small" onClick={() => openDeleteModal(row)} startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                                          sx={{
                                            borderRadius: 2, fontFamily: T.font.family, fontSize: '11px', fontWeight: 700, textTransform: 'none',
                                            px: 1.5, py: 0.5, bgcolor: T.status.error, '&:hover': { bgcolor: T.status.errorText }
                                          }}>
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
                          <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: T.text.muted, fontWeight: 600 }}>
                            Showing {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, reviewRows.length)} of {reviewRows.length} responses
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" disabled={page === 0} onClick={() => setPage(p => p - 1)} sx={paginationBtnSx}>&larr; Previous</Button>
                            <Button size="small" variant="outlined" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} sx={paginationBtnSx}>Next &rarr;</Button>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </>
                )}
              </Box>
            )}

            {/* ── Custom Deletion Confirmation Dialog ───── */}
            <Dialog open={deleteConfirmOpen} onClose={() => !deleting && setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: T.radius.card, p: 1, maxWidth: 440 } }}>
              <DialogTitle sx={{ fontFamily: T.font.family, fontWeight: 800, fontSize: 18, color: T.text.primary }}>
                {recordToDelete ? 'Confirm Review Deletion' : `Confirm Batch Deletion (${selectedRowIds.length} Records)`}
              </DialogTitle>
              <DialogContent>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 14, color: T.text.secondary, lineHeight: 1.5 }}>
                  {recordToDelete
                    ? 'Are you sure you want to delete this sentiment review from the dashboard? This action cannot be undone.'
                    : `Are you sure you want to delete ${selectedRowIds.length} selected review entries? This action cannot be undone.`}
                </Typography>
                {recordToDelete && recordToDelete.Message && (
                  <Box sx={{ mt: 2, p: 1.8, bgcolor: T.surface.cardAlt, borderRadius: T.radius.input, border: `1px solid ${T.surface.borderLight}` }}>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, fontStyle: 'italic', color: T.text.heading }}>
                      "{recordToDelete.Message}"
                    </Typography>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: 11, color: T.text.muted, mt: 0.5, fontWeight: 600 }}>
                      {recordToDelete.Clientele} • {recordToDelete.College}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting} sx={{ fontFamily: T.font.family, textTransform: 'none', fontWeight: 700, color: T.text.muted }}>
                  Cancel
                </Button>
                <Button onClick={confirmDeleteRecord} disabled={deleting} variant="contained" color="error" sx={{ fontFamily: T.font.family, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                  {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Review'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* ── Snackbar Alert Toasts ───── */}
            <Snackbar open={Boolean(snackbarMsg)} autoHideDuration={4000} onClose={() => setSnackbarMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Alert onClose={() => setSnackbarMsg('')} severity="info" sx={{ width: '100%', fontFamily: T.font.family, fontWeight: 600, borderRadius: 3 }}>
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

              <div className="scale-legend">
                CSAT Rating Scale: 5 = Very Satisfied | 4 = Satisfied | 3 = Neutral | 2 = Dissatisfied | 1 = Very Dissatisfied | N/A = Not Applicable
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Clientele</th>
                    <th>College/Dept</th>
                    <th>Course</th>
                    <th>Patron Feedback Message</th>
                    <th style={{ textAlign: 'center' }}>Q1</th>
                    <th style={{ textAlign: 'center' }}>Q2</th>
                    <th style={{ textAlign: 'center' }}>Q3</th>
                    <th style={{ textAlign: 'center' }}>Q4</th>
                    <th style={{ textAlign: 'center' }}>Q5</th>
                    <th style={{ textAlign: 'center' }}>Q6</th>
                    <th style={{ textAlign: 'center' }}>Q7</th>
                    <th style={{ textAlign: 'center' }}>Q8</th>
                    <th style={{ textAlign: 'center' }}>Q9</th>
                    <th style={{ textAlign: 'center' }}>Q10</th>
                    <th>Sentiment Result</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewRows.map((row) => (
                    <tr key={row.Id}>
                      <td style={{ textTransform: 'capitalize' }}>{row.Clientele}</td>
                      <td>{row.College || 'N/A'}</td>
                      <td>{row.Course || 'N/A'}</td>
                      <td>{row.Message}</td>
                      <td className="q-cell">{formatRatingShort(row.Question1)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question2)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question3)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question4)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question5)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question6)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question7)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question8)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question9)}</td>
                      <td className="q-cell">{formatRatingShort(row.Question10)}</td>
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
        <Dialog open={true} PaperProps={{ sx: { borderRadius: 4, p: 1.5, maxWidth: 420, border: `1.5px solid ${T.surface.borderLight}` } }}>
          <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
            <Avatar sx={{ bgcolor: T.brand.violet, color: T.text.white, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
              <AdminIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography sx={{ fontFamily: T.font.family, fontWeight: 800, fontSize: 20, color: T.text.primary }}>
              Admin Access Required
            </Typography>
            <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: T.text.muted, mt: 0.5 }}>
              Please login with administrative credentials to access Sentiment Dashboard
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pb: 3 }}>
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)}
                sx={{ '& .MuiInputBase-root': { height: 48, borderRadius: T.radius.input, fontFamily: T.font.family, fontWeight: 600 } }} />
              <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                sx={{ '& .MuiInputBase-root': { height: 48, borderRadius: T.radius.input, fontFamily: T.font.family, fontWeight: 600 } }} />
              {loginError && (
                <Typography color="error" fontSize={13} sx={{ fontFamily: T.font.family, fontWeight: 600, textAlign: 'center' }}>
                  {loginError}
                </Typography>
              )}
              <Button type="submit" variant="contained" fullWidth
                sx={{ mt: 1, height: 48, borderRadius: T.radius.input, bgcolor: T.brand.violet, fontFamily: T.font.family, fontWeight: 700, fontSize: 15, textTransform: 'none', '&:hover': { bgcolor: T.brand.violetHover } }}>
                Login
              </Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/')}
                sx={{ height: 44, borderRadius: T.radius.input, borderColor: T.surface.border, color: T.text.secondary, fontFamily: T.font.family, fontWeight: 700, fontSize: 14, textTransform: 'none' }}>
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