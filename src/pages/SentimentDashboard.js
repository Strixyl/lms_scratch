import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip,
  TableSortLabel, Snackbar, Alert,
  Checkbox, ToggleButton, ToggleButtonGroup, IconButton
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  FilterAlt as FilterAltIcon,
  Logout as LogoutIcon,
  DeleteOutline as DeleteOutlineIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  RateReview as RateReviewIcon,
  Lightbulb as LightbulbIcon,
  AdminPanelSettings as AdminIcon,
  CalendarToday as CalendarTodayIcon,
  RestartAlt as RestartAltIcon,
  Inbox as InboxIcon,
  PersonOutline as PersonOutlineIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Category as CategoryIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
  Tooltip as RechartsTooltip,
} from 'recharts';
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
  selectSx,
  menuItemSx,
  datePresetBtnSx,
} from '../constants/themeTokens';

import {
  CLIENTELE_OPTIONS,
  COLLEGE_OPTIONS,
  COLLEGE_COURSES,
  CATEGORY_OPTIONS,
  MONTH_NAMES,
  QUARTER_OPTIONS,
  ROWS_PER_PAGE,
  CONTROLLED_LEXICON,
  LEXICON_TOPIC_ACTIONS,
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
  ModernKpiCard,
  SourceSentimentBreakdownCard,
  TopCommentsCard,
  RecommendationCard,
  CustomDivergingTrendTooltip,
  WordCloudSection,
} from '../Components/SentimentCharts';

const MONTH_CODE_MAP = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

const T = THEME;

function SentimentDashboard() {
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
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterClientele, setFilterClientele] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('2026');
  const [filterQuarter, setFilterQuarter] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [page, setPage] = useState(0);

  const availableCourses = useMemo(() => {
    if (filterCollege && COLLEGE_COURSES[filterCollege]) {
      return COLLEGE_COURSES[filterCollege];
    }
    return [];
  }, [filterCollege]);

  const handleCollegeChange = (col) => {
    setFilterCollege(col);
    setFilterCourse('');
    setPage(0);
  };

  // Word Cloud interactive states & filters
  const [, setWcSearch] = useState('');
  const [, setWcSentimentFilter] = useState('All');
  const [selectedWordFilter, setSelectedWordFilter] = useState('');

  const handleSelectWord = useCallback((wordText) => {
    setSelectedWordFilter(prev => (prev && prev.toLowerCase() === wordText.toLowerCase() ? '' : wordText));
    setPage(0);
  }, []);

  const handleClearWordFilter = useCallback(() => {
    setSelectedWordFilter('');
    setPage(0);
  }, []);

  // Live Search & Sort states
  const [sortField, setSortField] = useState('DateSubmitted');
  const [sortOrder, setSortOrder] = useState('desc');

  // Batch Selection & Deletion states
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Trend Container Scale state ('percent' = Symmetric 100% | 'count' = Volume Counts)
  const [trendScaleMode, setTrendScaleMode] = useState('percent');

  // Upper Section Modern Layout Controls
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState('All Categories');

  const printRef = useRef();

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/surveys');
      setSurveys(response.data || []);
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
    let newQuarter = 'All';
    let newMonth = 'All';
    let newYear = filterYear === 'All' ? '2026' : (filterYear || '2026');
    const targetYear = newYear === 'All' ? '2026' : newYear;

    if (presetKey === 'today') {
      const dateStr = formatISO(today);
      newStart = dateStr;
      newEnd = dateStr;
      newQuarter = 'All';
    } else if (presetKey === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
      newStart = formatISO(startOfWeek);
      newEnd = formatISO(today);
      newQuarter = 'All';
    } else if (presetKey === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      newStart = formatISO(startOfMonth);
      newEnd = formatISO(endOfMonth);
      newQuarter = 'All';
    } else if (presetKey === 'q1') {
      newStart = `${targetYear}-01-01`;
      newEnd = `${targetYear}-03-31`;
      newQuarter = 'Q1';
    } else if (presetKey === 'q2') {
      newStart = `${targetYear}-04-01`;
      newEnd = `${targetYear}-06-30`;
      newQuarter = 'Q2';
    } else if (presetKey === 'q3') {
      newStart = `${targetYear}-07-01`;
      newEnd = `${targetYear}-09-30`;
      newQuarter = 'Q3';
    } else if (presetKey === 'q4') {
      newStart = `${targetYear}-10-01`;
      newEnd = `${targetYear}-12-31`;
      newQuarter = 'Q4';
    } else if (presetKey === 'all') {
      newStart = '';
      newEnd = '';
      newQuarter = 'All';
      newYear = 'All';
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    setFilterQuarter(newQuarter);
    setFilterMonth(newMonth);
    setFilterYear(newYear);
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
    } else if (key === 'quarter') {
      setFilterQuarter('All');
    } else if (key === 'month') {
      setFilterMonth('All');
    } else if (key === 'year') {
      setFilterYear('All');
    } else if (key === 'clientele') {
      setFilterClientele('');
    } else if (key === 'college') {
      setFilterCollege('');
      setFilterCourse('');
    } else if (key === 'course') {
      setFilterCourse('');
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
    setFilterQuarter('All');
    setFilterMonth('All');
    setFilterYear('2026');
    setFilterClientele('');
    setFilterCollege('');
    setFilterCourse('');
    setFilterSentiment('');
    setFilterCategory('');
    setSelectedWordFilter('');
    setWcSearch('');
    setWcSentimentFilter('All');
    setSortField('DateSubmitted');
    setSortOrder('desc');
    setPage(0);
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPage(0);
  };

  const filtered = useMemo(() => {
    return surveys.filter(s => {
      if (!s.SentimentResult) return false;
      if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return false;
      if (filterCollege && s.College !== filterCollege) return false;
      if (filterCourse && s.Course !== filterCourse) return false;
      if (filterSentiment && s.SentimentResult !== filterSentiment) return false;
      if (filterCategory && (s.Category || 'Other/Uncategorized') !== filterCategory) return false;

      if (!s.DateSubmitted) return false;
      const str = typeof s.DateSubmitted === 'string' ? s.DateSubmitted.trim() : '';
      const dayStr = str.slice(0, 10);
      const yr = str.slice(0, 4);
      const mo = parseInt(str.slice(5, 7), 10);
      const moStr = str.slice(5, 7);

      if (filterYear && filterYear !== 'All' && yr !== filterYear) return false;
      if (filterQuarter && filterQuarter !== 'All') {
        if (filterQuarter === 'Q1' && (mo < 1 || mo > 3)) return false;
        if (filterQuarter === 'Q2' && (mo < 4 || mo > 6)) return false;
        if (filterQuarter === 'Q3' && (mo < 7 || mo > 9)) return false;
        if (filterQuarter === 'Q4' && (mo < 10 || mo > 12)) return false;
      }
      if (filterMonth && filterMonth !== 'All' && moStr !== MONTH_CODE_MAP[filterMonth]) return false;

      if (startDate && endDate) {
        if (dayStr < startDate || dayStr > endDate) return false;
      } else if (startDate) {
        if (dayStr < startDate) return false;
      } else if (endDate) {
        if (dayStr > endDate) return false;
      }

      return true;
    });
  }, [surveys, filterClientele, filterCollege, filterCourse, filterSentiment, filterCategory, filterYear, filterQuarter, filterMonth, startDate, endDate]);

  const counts = useMemo(() => {
    const c = { Positive: 0, Neutral: 0, Negative: 0 };
    filtered.forEach(s => {
      if (c[s.SentimentResult] !== undefined) c[s.SentimentResult]++;
    });
    return c;
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const cc = { Facilities: 0, Staff: 0, Collection: 0, 'Other/Uncategorized': 0 };
    filtered.forEach(s => {
      const cat = s.Category || 'Other/Uncategorized';
      if (cc[cat] !== undefined) {
        cc[cat]++;
      } else {
        cc['Other/Uncategorized']++;
      }
    });
    return cc;
  }, [filtered]);

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

  const tableMonthCounts = useMemo(() => {
    const counts = { All: 0 };
    MONTH_NAMES.forEach(m => (counts[m] = 0));
    surveys.forEach(s => {
      if (!s.SentimentResult) return;
      if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return;
      if (filterCollege && s.College !== filterCollege) return;
      if (filterCourse && s.Course !== filterCourse) return;
      if (filterSentiment && s.SentimentResult !== filterSentiment) return;
      if (filterCategory && (s.Category || 'Other/Uncategorized') !== filterCategory) return;
      if (s.DateSubmitted && typeof s.DateSubmitted === 'string') {
        const yr = s.DateSubmitted.slice(0, 4);
        if (filterYear && filterYear !== 'All' && yr !== filterYear) return;
        const mNum = parseInt(s.DateSubmitted.slice(5, 7), 10);
        if (mNum >= 1 && mNum <= 12) {
          const mName = MONTH_NAMES[mNum - 1];
          counts[mName] = (counts[mName] || 0) + 1;
          counts.All++;
        }
      }
    });
    return counts;
  }, [surveys, filterClientele, filterCollege, filterCourse, filterSentiment, filterCategory, filterYear]);

  const reviewRows = useMemo(() => {
    return [...filteredWithWord].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'DateSubmitted') {
        const strA = a.DateSubmitted || '';
        const strB = b.DateSubmitted || '';
        if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
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
  }, [filteredWithWord, sortField, sortOrder]);
  const totalPages = Math.ceil(reviewRows.length / ROWS_PER_PAGE) || 1;
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

  const hasActiveFilter = Boolean(
    startDate ||
    endDate ||
    filterClientele ||
    filterCollege ||
    filterCourse ||
    filterSentiment ||
    filterCategory ||
    (filterQuarter && filterQuarter !== 'All') ||
    (filterMonth && filterMonth !== 'All') ||
    (filterYear && filterYear !== 'All' && filterYear !== '2026')
  );

  // Overall Satisfaction Average (plain 1-5 scale from survey questions)
  const avgSatisfaction = filtered.length
    ? filtered.reduce((sum, s) => sum + getSatisfactionAverage(s), 0) / filtered.length
    : 0;

  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    surveys.forEach(s => {
      if (s.DateSubmitted && typeof s.DateSubmitted === 'string') {
        const y = s.DateSubmitted.slice(0, 4);
        if (y && !isNaN(y)) yearsSet.add(y);
      }
    });
    const arr = Array.from(yearsSet).sort((a, b) => b - a);
    if (arr.length === 0) arr.push('2026');
    return arr;
  }, [surveys]);

  // ── Diverging Sentiment Balance & Monthly Trend Data ────────────────────────
  const divergingTrendData = useMemo(() => {
    const targetYear = filterYear === 'All' ? null : (filterYear || '2026');

    const monthsMap = {};
    MONTH_NAMES.forEach((m, idx) => {
      monthsMap[idx] = {
        month: m,
        monthIndex: idx,
        Positive: 0,
        Negative: 0,
        rawNegative: 0,
        Neutral: 0,
        Total: 0,
        scoresSum: 0,
      };
    });

    surveys.forEach(s => {
      if (!s.SentimentResult) return;
      if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return;
      if (filterCollege && s.College !== filterCollege) return;
      if (filterCourse && s.Course !== filterCourse) return;
      if (filterSentiment && s.SentimentResult !== filterSentiment) return;
      if (filterCategory && (s.Category || 'Other/Uncategorized') !== filterCategory) return;

      if (!s.DateSubmitted || typeof s.DateSubmitted !== 'string') return;
      const yr = s.DateSubmitted.slice(0, 4);
      if (targetYear && yr !== targetYear) return;

      const mNum = parseInt(s.DateSubmitted.slice(5, 7), 10);
      if (isNaN(mNum) || mNum < 1 || mNum > 12) return;
      const mIdx = mNum - 1;

      if (monthsMap[mIdx]) {
        if (s.SentimentResult === 'Positive') monthsMap[mIdx].Positive++;
        else if (s.SentimentResult === 'Neutral') monthsMap[mIdx].Neutral++;
        else if (s.SentimentResult === 'Negative') {
          monthsMap[mIdx].rawNegative++;
          monthsMap[mIdx].Negative--;
        }
        monthsMap[mIdx].Total++;
        monthsMap[mIdx].scoresSum += getSatisfactionAverage(s);
      }
    });

    return MONTH_NAMES.map((m, idx) => {
      const item = monthsMap[idx];
      const avg = item.Total > 0 ? parseFloat((item.scoresSum / item.Total).toFixed(2)) : null;
      const net = item.Positive - item.rawNegative;
      const posPct = item.Total > 0 ? Math.round((item.Positive / item.Total) * 100) : 0;
      const negPct = item.Total > 0 ? Math.round((item.rawNegative / item.Total) * 100) : 0;
      return {
        ...item,
        posPct,
        negPct,
        negPctDiverging: -negPct,
        avgSatisfaction: avg,
        netScore: net,
        isSelectedMonth: filterMonth === m,
      };
    });
  }, [surveys, filterYear, filterClientele, filterCollege, filterCourse, filterSentiment, filterCategory, filterMonth]);

  // Dynamic Y-Axis scale for balanced positive and negative headroom
  const maxVolume = useMemo(() => {
    let maxVal = 5;
    divergingTrendData.forEach(d => {
      if (d.Positive > maxVal) maxVal = d.Positive;
      if (d.rawNegative > maxVal) maxVal = d.rawNegative;
    });
    return Math.ceil(maxVal * 1.2);
  }, [divergingTrendData]);

  // Category Breakdown for the Source Card
  const categoryBreakdownData = useMemo(() => {
    const categories = ['Facilities', 'Staff', 'Collection'];
    return categories.map(cat => {
      const items = filtered.filter(s => (s.Category || 'Other/Uncategorized') === cat);
      const pos = items.filter(s => s.SentimentResult === 'Positive').length;
      const tot = items.length;
      const posPct = tot > 0 ? Math.round((pos / tot) * 100) : 0;
      const avgScore = tot > 0
        ? (items.reduce((acc, s) => acc + getSatisfactionAverage(s), 0) / tot).toFixed(1)
        : '0.0';

      return {
        name: cat,
        total: tot,
        posCount: pos,
        posPct,
        metric: `${avgScore} ★`,
      };
    });
  }, [filtered]);

  // Sentiment counts dynamically filtered by the Source card's selected category
  const sourceCardSentimentData = useMemo(() => {
    if (sourceCategoryFilter === 'All Categories' || sourceCategoryFilter === 'All') {
      return {
        total: total,
        positive: counts.Positive,
        neutral: counts.Neutral,
        negative: counts.Negative,
      };
    }
    const catItems = filtered.filter(s => (s.Category || 'Other/Uncategorized') === sourceCategoryFilter);
    const catPos = catItems.filter(s => s.SentimentResult === 'Positive').length;
    const catNeu = catItems.filter(s => s.SentimentResult === 'Neutral').length;
    const catNeg = catItems.filter(s => s.SentimentResult === 'Negative').length;
    return {
      total: catItems.length,
      positive: catPos,
      neutral: catNeu,
      negative: catNeg,
    };
  }, [sourceCategoryFilter, total, counts, filtered]);

  const handleScrollToReviewTable = () => {
    const tableEl = document.getElementById('review-table-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };




  // ── Word/Term Frequency for Word Cloud ────────────────────────────────────
  const { freq: termFrequencies = {}, displayMap: stemToOriginalMap = {} } = useMemo(() => {
    return buildTermFrequencies(filtered.length > 0 ? filtered : surveys);
  }, [filtered, surveys]);

  const commentsMasterPool = filtered;

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
      .slice(0, 65);
  }, [termFrequencies, stemToOriginalMap]);

  const categoryStats = useMemo(() => {
    const negItems = filtered.filter(s => s.SentimentResult === 'Negative' && s.Message?.trim());
    const poolNegItems = negItems.length > 0 ? negItems : surveys.filter(s => s.SentimentResult === 'Negative' && s.Message?.trim());
    const categoryFilter = filterCategory;

    const scoredTopics = [];

    Object.entries(CONTROLLED_LEXICON).forEach(([catName, categoryTopics]) => {
      if (categoryFilter && catName !== categoryFilter) return;

      Object.entries(categoryTopics).forEach(([topicName, synonyms]) => {
        const kwCounts = {};
        const matchedItems = [];

        poolNegItems.forEach(item => {
          const msgLower = (item.Message || '').toLowerCase();
          let itemMatched = false;

          synonyms.forEach(syn => {
            const synLower = syn.toLowerCase();
            const escaped = synLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
            if (regex.test(msgLower)) {
              kwCounts[synLower] = (kwCounts[synLower] || 0) + 1;
              itemMatched = true;
            }
          });

          if (itemMatched && item.Message) {
            matchedItems.push(item);
          }
        });

        const sortedKwEntries = Object.entries(kwCounts)
          .sort((a, b) => b[1] - a[1]);

        const totalMatches = sortedKwEntries.reduce((acc, [, c]) => acc + c, 0);
        if (totalMatches === 0 && poolNegItems.length > 0) return;

        const finalKeywords = sortedKwEntries.slice(0, 3).map(([word, count]) => ({
          word: word ? (word.charAt(0).toUpperCase() + word.slice(1)) : '',
          count,
        }));
        const scoredEvs = scoreCommentsWithLexicon(matchedItems);
        const topEvidences = scoredEvs
          .sort((a, b) => (b.blendedScore || 0) - (a.blendedScore || 0))
          .slice(0, 2);

        const topicActionConfig = LEXICON_TOPIC_ACTIONS[topicName] || {};
        const severity = totalMatches >= 4 || topicActionConfig.defaultSeverity === 'HIGH' ? 'HIGH' : 'MODERATE';
        const action = topicActionConfig.action || RECOMMENDATIONS[catName]?.[severity.toLowerCase()] || 'Review patron feedback and assess operational adjustments.';

        scoredTopics.push({
          id: topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: topicName,
          category: catName,
          severity,
          action,
          keywords: finalKeywords.length > 0
            ? finalKeywords
            : synonyms.slice(0, 3).map(w => ({ word: w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '', count: 1 })),
          evidences: topEvidences,
          matchCount: totalMatches,
        });
      });
    });

    scoredTopics.sort((a, b) => b.matchCount - a.matchCount);

    if (scoredTopics.length >= 3) {
      return scoredTopics.slice(0, 3);
    }

    if (scoredTopics.length === 0) {
      const fallbackCats = categoryFilter ? [categoryFilter] : ['Facilities', 'Staff', 'Collection'];
      return fallbackCats.map(cat => {
        const catItems = poolNegItems.filter(s => (s.Category || '') === cat);
        const scored = scoreCommentsWithLexicon(catItems);
        return {
          id: cat.toLowerCase(),
          title: `${cat} Service`,
          category: cat,
          severity: catItems.length >= 5 ? 'HIGH' : 'MODERATE',
          action: RECOMMENDATIONS[cat]?.high || RECOMMENDATIONS[cat]?.moderate || 'Review patron feedback and prioritize operational adjustments.',
          keywords: (CATEGORY_KEYWORDS[cat] ? Object.keys(CATEGORY_KEYWORDS[cat]).slice(0, 3) : ['Feedback']).map(w => ({
            word: w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '',
            count: 1,
          })),
          evidences: scored.slice(0, 3),
          matchCount: catItems.length,
        };
      });
    }

    return scoredTopics.slice(0, 3);
  }, [filtered, surveys, filterCategory]);

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
            .summary-box.tot .value { color: #16324f; }
            .summary-box .label { font-size: 11px; color: #555; margin-top: 2px; font-weight: bold; }
            .scale-legend { font-size: 10.5px; color: ${T.text.secondary}; background: ${T.surface.cardAlt}; border: 1px solid ${T.surface.border}; padding: 6px 10px; border-radius: 4px; margin-bottom: 12px; text-align: center; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
            th { background-color: #16324f; color: white; padding: 6px 4px; text-align: left; font-size: 10px; }
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

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar
              title="Sentiment Dashboard Analysis"
              onMenuClick={toggleDrawer}
              subtitle="PATRON SATISFACTION — SENTIMENT ANALYSIS"
            />

            {!showLoginModal && (
              <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#eef1f6', minHeight: '100vh' }}>
                {/* ── Modern Header Action Bar Banner ───── */}
                <Paper elevation={0} sx={{
                  p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 3.5,
                  bgcolor: '#ffffff',
                  border: '1.5px solid #fed7aa',
                  borderTop: '3.5px solid #f69d1b',
                  boxShadow: '0 2px 12px rgba(246, 157, 27, 0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2
                }}>
                  <Box>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: '#16324f', letterSpacing: '-0.3px' }}>
                      Henry Luce III Library Sentiment Analysis Dashboard
                    </Typography>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: 13.5, color: '#64748b', fontWeight: 500, mt: 0.3 }}>
                      Patron feedback sentiment breakdown, category distribution, and satisfaction analytics
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      onClick={handlePrint}
                      startIcon={<PrintIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: '10px', height: 42, px: 2.5,
                        fontFamily: T.font.family, fontSize: 13.5, fontWeight: 700, textTransform: 'none',
                        borderColor: '#d9e2ec', color: '#16324f', bgcolor: '#ffffff', borderWidth: '1.5px',
                        '&:hover': { borderColor: '#16324f', bgcolor: '#edf4fa', borderWidth: '1.5px' }
                      }}
                    >
                      Print / Save PDF
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleExportExcel}
                      startIcon={<FileDownloadIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: '10px', height: 42, px: 2.5,
                        fontFamily: T.font.family, fontSize: 13.5, fontWeight: 700, textTransform: 'none',
                        bgcolor: '#f69d1b',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(246, 157, 27, 0.3)',
                        '&:hover': { bgcolor: '#df8208' }
                      }}
                    >
                      Export to Excel
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleLogout}
                      startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: '10px', height: 42, px: 2.2,
                        fontFamily: T.font.family, fontSize: 13.5, fontWeight: 700, textTransform: 'none',
                        borderColor: '#fed7aa', color: '#ea580c',
                        bgcolor: '#ffffff', borderWidth: '1.5px',
                        '&:hover': { bgcolor: '#fff7ed', borderColor: '#f69d1b', borderWidth: '1.5px' }
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                </Paper>

                {/* ── Filter Controls Container ───── */}
                <Paper elevation={0} sx={{
                  mb: 3, ...cardShellSx,
                  border: '1.5px solid #cbdbe9',
                  borderTop: '3.5px solid #16324f',
                  boxShadow: '0 2px 12px rgba(22, 50, 79, 0.04)',
                }}>
                  <Box sx={{ ...sectionHeaderSx }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Box sx={{
                        bgcolor: '#edf4fa',
                        color: '#16324f',
                        p: 0.55,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& svg': { fontSize: 18 }
                      }}>
                        <FilterAltIcon />
                      </Box>
                      <Typography sx={{ ...sectionTitleSx, color: '#16324f' }}>
                        Filter & Analytics Controls
                      </Typography>
                    </Box>
                    <Typography sx={{
                      fontFamily: T.font.family,
                      fontSize: 12,
                      color: '#475569',
                      fontWeight: 700,
                      bgcolor: '#f1f5f9',
                      px: 1.5,
                      py: 0.35,
                      borderRadius: '9999px',
                    }}>
                      {filtered.length} matching response{filtered.length === 1 ? '' : 's'}
                    </Typography>
                  </Box>

                  {/* ── Quick Date Presets Row ───── */}
                  <Box sx={{ px: 3, pt: 1.8, pb: 1.5, bgcolor: '#ffffff', borderBottom: `1px solid ${T.surface.borderLight}`, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, fontWeight: 700, color: '#64748b', mr: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 15, color: '#16324f' }} /> Quick Date Range:
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('q1')} sx={datePresetBtnSx}>Q1</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('q2')} sx={datePresetBtnSx}>Q2</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('q3')} sx={datePresetBtnSx}>Q3</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('q4')} sx={datePresetBtnSx}>Q4</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('today')} sx={datePresetBtnSx}>Today</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('week')} sx={datePresetBtnSx}>This Week</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('month')} sx={datePresetBtnSx}>This Month</Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('all')} sx={datePresetBtnSx}>All Time</Button>
                  </Box>

                  <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value) setFilterQuarter('All');
                        setPage(0);
                      }}
                      sx={selectSx}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (e.target.value) setFilterQuarter('All');
                        setPage(0);
                      }}
                      sx={selectSx}
                    />
                    <FormControl sx={selectSx}>
                      <InputLabel>Clientele</InputLabel>
                      <Select value={filterClientele} label="Clientele" onChange={(e) => { setFilterClientele(e.target.value); setPage(0); }}>
                        <MenuItem value="" sx={menuItemSx}>All</MenuItem>
                        {CLIENTELE_OPTIONS.map(c => (<MenuItem key={c} value={c.toLowerCase()} sx={menuItemSx}>{c}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>College</InputLabel>
                      <Select value={filterCollege} label="College" onChange={(e) => handleCollegeChange(e.target.value)}>
                        <MenuItem value="" sx={menuItemSx}>All</MenuItem>
                        {COLLEGE_OPTIONS.map(c => (<MenuItem key={c} value={c} sx={menuItemSx}>{c}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <FormControl
                      sx={{
                        ...selectSx,
                        minWidth: 190,
                        ...(!filterCollege ? {
                          bgcolor: '#f1f5f9',
                          borderRadius: '10px',
                          cursor: 'not-allowed',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e2e8f0 !important',
                          },
                          '& .MuiInputLabel-root': {
                            color: '#94a3b8 !important',
                          },
                        } : {}),
                      }}
                      disabled={!filterCollege}
                    >
                      <InputLabel>
                        {!filterCollege ? 'Course (Select College)' : 'Course'}
                      </InputLabel>
                      <Select
                        value={filterCollege ? filterCourse : ''}
                        label={!filterCollege ? 'Course (Select College)' : 'Course'}
                        onChange={(e) => { setFilterCourse(e.target.value); setPage(0); }}
                        disabled={!filterCollege}
                        sx={!filterCollege ? {
                          bgcolor: '#f1f5f9',
                          borderRadius: '10px',
                          color: '#94a3b8',
                          '& .MuiSelect-select': { cursor: 'not-allowed' },
                          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
                        } : {}}
                      >
                        <MenuItem value="" sx={menuItemSx}>All</MenuItem>
                        {availableCourses.map(crs => (
                          <MenuItem key={crs} value={crs} sx={menuItemSx}>{crs}</MenuItem>
                        ))}
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
                      <InputLabel>Quarter</InputLabel>
                      <Select
                        value={filterQuarter}
                        label="Quarter"
                        onChange={(e) => {
                          setFilterQuarter(e.target.value);
                          if (e.target.value !== 'All') {
                            setStartDate('');
                            setEndDate('');
                          }
                          setPage(0);
                        }}
                      >
                        <MenuItem value="All" sx={menuItemSx}>All Quarters</MenuItem>
                        {QUARTER_OPTIONS.map(q => (
                          <MenuItem key={q.value} value={q.value} sx={menuItemSx}>{q.label}</MenuItem>
                        ))}
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
                      variant="outlined"
                      color="error"
                      onClick={handleClear}
                      startIcon={<RestartAltIcon />}
                      disabled={!hasActiveFilter}
                      sx={{
                        height: 44, px: 2.8, borderRadius: '10px', textTransform: 'none',
                        fontFamily: T.font.family, fontWeight: 700, fontSize: 13.5,
                        borderColor: hasActiveFilter ? '#ea580c' : '#e2e8f0',
                        color: hasActiveFilter ? '#ea580c' : '#94a3b8',
                        borderWidth: '1.5px',
                        bgcolor: hasActiveFilter ? 'rgba(234, 88, 12, 0.05)' : 'transparent',
                        '&:hover': { borderWidth: '1.5px', borderColor: '#c2410c', bgcolor: 'rgba(234, 88, 12, 0.1)' }
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Box>

                  {/* ── Active Filter Chips Row ───── */}
                  {hasActiveFilter && (
                    <Box sx={{ px: 3, pb: 2, pt: 1.5, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', borderTop: `1px solid ${T.surface.borderLight}` }}>
                      <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, fontWeight: 700, color: '#64748b' }}>
                        Active Filters:
                      </Typography>
                      {(startDate || endDate) && (
                        <Chip label={`Date: ${startDate || 'Start'} to ${endDate || 'End'}`} onDelete={() => handleRemoveFilter('date')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#ffffff', color: '#16324f', border: `1px solid ${T.surface.borderLight}`, borderRadius: '9999px' }} />
                      )}
                      {filterQuarter && filterQuarter !== 'All' && (
                        <Chip label={`Quarter: ${filterQuarter}`} onDelete={() => handleRemoveFilter('quarter')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#ffffff', color: '#16324f', border: `1px solid ${T.surface.borderLight}`, borderRadius: '9999px' }} />
                      )}
                      {filterMonth && filterMonth !== 'All' && (
                        <Chip label={`Month: ${filterMonth}`} onDelete={() => handleRemoveFilter('month')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#ffffff', color: '#16324f', border: `1px solid ${T.surface.borderLight}`, borderRadius: '9999px' }} />
                      )}
                      {filterYear && filterYear !== 'All' && filterYear !== '2026' && (
                        <Chip label={`Year: ${filterYear}`} onDelete={() => handleRemoveFilter('year')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#ffffff', color: '#16324f', border: `1px solid ${T.surface.borderLight}`, borderRadius: '9999px' }} />
                      )}
                      {filterClientele && (
                        <Chip label={`Clientele: ${filterClientele}`} onDelete={() => handleRemoveFilter('clientele')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: '9999px' }} />
                      )}
                      {filterCollege && (
                        <Chip label={`College: ${filterCollege}`} onDelete={() => handleRemoveFilter('college')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#edf4fa', color: '#16324f', border: '1px solid #cbdbe9', borderRadius: '9999px' }} />
                      )}
                      {filterCourse && (
                        <Chip label={`Course: ${filterCourse}`} onDelete={() => handleRemoveFilter('course')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#edf4fa', color: '#254b73', border: '1px solid #cbdbe9', borderRadius: '9999px' }} />
                      )}
                      {filterSentiment && (
                        <Chip label={`Sentiment: ${filterSentiment}`} onDelete={() => handleRemoveFilter('sentiment')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: filterSentiment === 'Positive' ? '#e6f4f5' : filterSentiment === 'Negative' ? '#fff1f2' : '#f1f5f9', color: filterSentiment === 'Positive' ? '#005960' : filterSentiment === 'Negative' ? '#be123c' : '#475569', border: filterSentiment === 'Positive' ? '1px solid #b3dfe2' : filterSentiment === 'Negative' ? '1px solid #fecdd3' : '1px solid #cbd5e1', borderRadius: '9999px' }} />
                      )}
                      {filterCategory && (
                        <Chip label={`Category: ${filterCategory}`} onDelete={() => handleRemoveFilter('category')} size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: '9999px' }} />
                      )}
                      <Button size="small" onClick={handleClear} startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
                        sx={{ fontFamily: T.font.family, textTransform: 'none', fontWeight: 700, fontSize: 12, color: '#ea580c', ml: 'auto' }}>
                        Clear All
                      </Button>
                    </Box>
                  )}
                </Paper>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress sx={{ color: '#16324f' }} />
                  </Box>
                ) : (
                  <>
                    {/* ── Modern Upper Section: 2-Column Revenue & Source Architecture ───── */}
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' },
                      gap: 2.5,
                      mb: 3.5,
                      alignItems: 'stretch'
                    }}>
                      {/* Left Column: Top 3 KPI Cards + Original Monthly Sentiment Bar Chart Container */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Top 3 KPI Cards */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                          <ModernKpiCard
                            title="Total Surveys"
                            value={total.toLocaleString()}
                            borderColorTheme="gold"
                            subtitle="Total survey submissions"
                          />
                          <ModernKpiCard
                            title="Positive Sentiment Rate"
                            value={`${total > 0 ? Math.round((counts.Positive / total) * 100) : 0}%`}
                            borderColorTheme="blue"
                            subtitle={`${counts.Positive} positive responses`}
                          />
                          <ModernKpiCard
                            title="Avg Satisfaction"
                            value={`${avgSatisfaction.toFixed(2)} ★`}
                            badgeText={`${Math.round((avgSatisfaction / 5) * 100)}%`}
                            highlighted={true}
                            subtitle="Scale: 1.0 to 5.0 rating"
                          />
                        </Box>

                        {/* Monthly Sentiment Balance & Bar Comparison (Original Diverging Bar Chart with Revenue Header Styling) */}
                        <Card elevation={0} sx={{
                          bgcolor: '#ffffff',
                          borderRadius: '16px',
                          border: '1.5px solid #cbdbe9',
                          borderTop: '3.5px solid #16324f',
                          p: { xs: 2, sm: 2.5 },
                          boxShadow: '0 2px 10px rgba(22, 50, 79, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: '0 6px 20px rgba(22, 50, 79, 0.08)',
                            borderColor: '#16324f',
                          }
                        }}>
                          {/* Header Container */}
                          <Box sx={{
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.5,
                            mb: 1.5,
                          }}>
                            <Box>
                              <Typography sx={{ fontFamily: T.font.family, fontSize: 14, fontWeight: 700, color: '#64748b' }}>
                                Monthly Sentiment Balance & Comparison
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.2, mt: 0.4, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontFamily: T.font.family, fontSize: { xs: 24, sm: 28 }, fontWeight: 800, color: '#16324f', lineHeight: 1.1 }}>
                                  {total > 0 ? Math.round((counts.Positive / total) * 100) : 0}% Positive Share
                                </Typography>
                              </Box>
                            </Box>

                            {/* View Controls: % Share vs Counts + Year Selector */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <ToggleButtonGroup
                                value={trendScaleMode}
                                exclusive
                                onChange={(e, newScale) => { if (newScale) setTrendScaleMode(newScale); }}
                                size="small"
                                sx={{
                                  height: 32,
                                  borderRadius: '9999px',
                                  bgcolor: '#edf2f7',
                                  p: 0.3,
                                  '& .MuiToggleButton-root': {
                                    fontFamily: T.font.family,
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    px: 1.2,
                                    color: '#64748b',
                                    border: 'none',
                                    borderRadius: '9999px',
                                    '&.Mui-selected': {
                                      bgcolor: '#ffffff',
                                      color: '#16324f',
                                      fontWeight: 800,
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                      '&:hover': { bgcolor: '#ffffff' }
                                    }
                                  }
                                }}
                              >
                                <ToggleButton value="percent">% Share</ToggleButton>
                                <ToggleButton value="count">Counts</ToggleButton>
                              </ToggleButtonGroup>

                              <FormControl size="small" sx={{ minWidth: 95 }}>
                                <Select
                                  value={filterYear}
                                  onChange={(e) => { setFilterYear(e.target.value); setPage(0); }}
                                  sx={{
                                    height: 32,
                                    borderRadius: '9999px',
                                    fontFamily: T.font.family,
                                    fontWeight: 700,
                                    fontSize: 11.5,
                                    bgcolor: '#f8fafc',
                                    color: '#334155',
                                    '& fieldset': { borderColor: '#e2e8f0' }
                                  }}
                                >
                                  <MenuItem value="All" sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 600 }}>All Years</MenuItem>
                                  {availableYears.map(yr => (
                                    <MenuItem key={yr} value={yr} sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 600 }}>{yr}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          </Box>

                          {/* Original Diverging Bar Chart */}
                          <Box sx={{ width: '100%', height: 310, mt: 0.5 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={divergingTrendData}
                                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                                stackOffset="sign"
                                style={{ cursor: 'pointer' }}
                                onClick={(state) => {
                                  if (state && state.activeLabel) {
                                    const monthName = state.activeLabel;
                                    const mIdx = MONTH_NAMES.indexOf(monthName);
                                    if (mIdx !== -1) {
                                      const targetYr = filterYear === 'All' ? '2026' : (filterYear || '2026');
                                      const mm = String(mIdx + 1).padStart(2, '0');
                                      const startD = `${targetYr}-${mm}-01`;
                                      const lastDay = new Date(parseInt(targetYr, 10), mIdx + 1, 0).getDate();
                                      const endD = `${targetYr}-${mm}-${String(lastDay).padStart(2, '0')}`;
                                      if (startDate === startD && endDate === endD) {
                                        setStartDate('');
                                        setEndDate('');
                                      } else {
                                        setStartDate(startD);
                                        setEndDate(endD);
                                        setFilterQuarter('All');
                                      }
                                      setPage(0);
                                    }
                                  }
                                }}
                              >
                                <defs>
                                  <linearGradient id="divPosGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#005960" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#137a84" stopOpacity={0.88} />
                                  </linearGradient>
                                  <linearGradient id="divNegGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fca5a5" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.95} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface.borderLight} />
                                <XAxis dataKey="month" tick={{ fontFamily: T.font.family, fontSize: 11.5, fill: T.text.secondary, fontWeight: 700 }} />

                                {trendScaleMode === 'percent' ? (
                                  <YAxis
                                    domain={[-100, 100]}
                                    ticks={[-100, -50, 0, 50, 100]}
                                    tickFormatter={(val) => `${Math.abs(val)}%`}
                                    tick={{ fontFamily: T.font.family, fontSize: 11, fill: T.text.secondary, fontWeight: 600 }}
                                    allowDecimals={false}
                                  />
                                ) : (
                                  <YAxis
                                    domain={[-maxVolume, maxVolume]}
                                    tickFormatter={(val) => Math.abs(val)}
                                    tick={{ fontFamily: T.font.family, fontSize: 11, fill: T.text.secondary, fontWeight: 600 }}
                                    allowDecimals={false}
                                  />
                                )}

                                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                                <RechartsTooltip content={<CustomDivergingTrendTooltip />} />
                                <Legend
                                  wrapperStyle={{ fontFamily: T.font.family, fontSize: 12, paddingTop: 8 }}
                                  formatter={(value) => <span style={{ color: T.text.heading, fontWeight: 600 }}>{value}</span>}
                                />

                                <Bar
                                  dataKey={trendScaleMode === 'percent' ? 'posPct' : 'Positive'}
                                  stackId="sentimentPillar"
                                  name={trendScaleMode === 'percent' ? 'Positive (%)' : 'Positive (Inflow)'}
                                  fill="url(#divPosGrad)"
                                  stroke="#005960"
                                  strokeWidth={1}
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={32}
                                />
                                <Bar
                                  dataKey={trendScaleMode === 'percent' ? 'negPctDiverging' : 'Negative'}
                                  stackId="sentimentPillar"
                                  name={trendScaleMode === 'percent' ? 'Negative (%)' : 'Negative (Outflow)'}
                                  fill="url(#divNegGrad)"
                                  stroke="#f43f5e"
                                  strokeWidth={1}
                                  radius={[0, 0, 4, 4]}
                                  maxBarSize={32}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Card>
                      </Box>

                      {/* Right Column: Source & Category Sentiment Breakdown Donut Card */}
                      <Box sx={{ height: '87%' }}>
                        <SourceSentimentBreakdownCard
                          totalSurveys={sourceCardSentimentData.total}
                          positiveCount={sourceCardSentimentData.positive}
                          neutralCount={sourceCardSentimentData.neutral}
                          negativeCount={sourceCardSentimentData.negative}
                          categoryBreakdown={categoryBreakdownData}
                          selectedCategory={sourceCategoryFilter}
                          onCategoryChange={setSourceCategoryFilter}
                          categoryOptions={['All Categories', 'Facilities', 'Staff', 'Collection']}
                          onViewReportsClick={handleScrollToReviewTable}
                        />
                      </Box>
                    </Box>


                    {/* ── Top Patron Comments Container (Bluish Shell) ───── */}
                    <Card elevation={0} sx={{
                      ...cardShellSx,
                      mb: 3,
                      border: '1.5px solid #cbdbe9',
                      borderTop: '3.5px solid #16324f',
                      boxShadow: '0 2px 12px rgba(22, 50, 79, 0.04)',
                    }}>
                      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Box sx={{
                            bgcolor: '#edf4fa',
                            color: '#16324f',
                            p: 0.55,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '& svg': { fontSize: 18 }
                          }}>
                            <RateReviewIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ ...sectionTitleSx, color: '#16324f' }}>Top Patron Comments</Typography>
                            <Typography sx={sectionSubtitleSx}>Top 5 high-impact positive commendations and critical negative feedback</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 1.2, py: 0.35, bgcolor: '#e6f4f5', border: '1px solid #b3dfe2', borderRadius: '9999px' }}>
                            <ThumbUpIcon sx={{ fontSize: 14, color: '#005960' }} />
                            <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, color: '#005960', fontWeight: 700 }}>5 Positive</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 1.2, py: 0.35, bgcolor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '9999px' }}>
                            <ThumbDownIcon sx={{ fontSize: 14, color: '#be123c' }} />
                            <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, color: '#be123c', fontWeight: 700 }}>5 Negative</Typography>
                          </Box>
                        </Box>
                      </Box>

                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                          gap: 2.5,
                          alignItems: 'stretch',
                        }}>
                          <TopCommentsCard title="Top 5 Positive Comments" rows={topPositive} type="positive" icon={<ThumbUpIcon />} />
                          <TopCommentsCard title="Top 5 Negative Comments" rows={topNegative} type="negative" icon={<ThumbDownIcon />} />
                        </Box>
                      </CardContent>
                    </Card>

                    {/* ── Service Improvement Recommendations Container (Gold Shell) ───── */}
                    <Card elevation={0} sx={{
                      ...cardShellSx,
                      mb: 3.5,
                      border: '1.5px solid #fed7aa',
                      borderTop: '3.5px solid #f69d1b',
                      boxShadow: '0 2px 12px rgba(246, 157, 27, 0.04)',
                    }}>
                      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Box sx={{
                            bgcolor: '#fff7ed',
                            color: '#ea580c',
                            p: 0.55,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '& svg': { fontSize: 18 }
                          }}>
                            <LightbulbIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ ...sectionTitleSx, color: '#16324f' }}>Service Improvement Recommendations</Typography>
                            <Typography sx={sectionSubtitleSx}>Actionable priority insights derived from negative patron sentiment signals</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{
                            fontFamily: T.font.family,
                            fontSize: 11.5,
                            color: '#475569',
                            bgcolor: '#f1f5f9',
                            fontWeight: 700,
                            px: 1.5,
                            py: 0.35,
                            borderRadius: '9999px',
                          }}>
                            {categoryStats.length} {categoryStats.length === 1 ? 'Category Flagged' : 'Categories Flagged'}
                          </Typography>
                        </Box>
                      </Box>

                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                          gap: 2.5,
                          alignItems: 'stretch',
                        }}>
                          {categoryStats.map((c, idx) => (
                            <RecommendationCard
                              key={c.id || idx}
                              stat={c}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>

                    {/* ── Frequently Used Words (Word Cloud) Container ───── */}
                    <WordCloudSection
                      words={wordCloudWords}
                      selectedWordFilter={selectedWordFilter}
                      onSelectWord={handleSelectWord}
                      onClearWordFilter={handleClearWordFilter}
                    />

                    {/* ── Granular Survey Review Table (Gold Shell) ───── */}
                    <Paper id="review-table-section" elevation={0} sx={{
                      borderRadius: 3.5,
                      bgcolor: '#ffffff',
                      border: '1.5px solid #fed7aa',
                      borderTop: '3.5px solid #f69d1b',
                      boxShadow: '0 2px 12px rgba(246, 157, 27, 0.04)',
                      overflow: 'hidden',
                      p: { xs: 2, md: 3 },
                      mb: 3,
                    }}>
                      {/* Header with Title and Month Filter Pills */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexWrap: 'wrap',
                        gap: 1.5,
                        mb: 2.5,
                      }}>
                        <Box>
                          <Typography sx={{
                            fontFamily: T.font.family,
                            fontWeight: 800,
                            fontSize: { xs: 16, md: 18 },
                            color: '#16324f',
                            letterSpacing: '-0.2px'
                          }}>
                            Patron Review Submissions Table
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mt: 1.5 }}>
                            <Button
                              size="small"
                              onClick={() => { setFilterMonth('All'); setPage(0); }}
                              sx={{
                                borderRadius: '9999px',
                                textTransform: 'none',
                                fontFamily: T.font.family,
                                fontWeight: 700,
                                fontSize: 12,
                                px: 1.8,
                                py: 0.4,
                                minWidth: 'auto',
                                height: 28,
                                boxShadow: 'none',
                                ...(filterMonth === 'All'
                                  ? { bgcolor: '#16324f', color: '#ffffff', '&:hover': { bgcolor: '#0e2237' } }
                                  : { bgcolor: '#edf2f7', color: '#475569', border: 'none', '&:hover': { bgcolor: '#e2e8f0' } }
                                )
                              }}
                            >
                              All ({tableMonthCounts.All || 0})
                            </Button>
                            {MONTH_NAMES.map(m => {
                              const c = tableMonthCounts[m] || 0;
                              const isSelected = filterMonth === m;
                              return (
                                <Button
                                  key={m}
                                  size="medium"
                                  onClick={() => { setFilterMonth(isSelected ? 'All' : m); setPage(0); }}
                                  sx={{
                                    borderRadius: '9999px',
                                    textTransform: 'none',
                                    fontFamily: T.font.family,
                                    fontWeight: isSelected ? 700 : 600,
                                    fontSize: 13,
                                    px: 1.5,
                                    py: 0.4,
                                    minWidth: 'auto',
                                    height: 28,
                                    boxShadow: 'none',
                                    ...(isSelected
                                      ? { bgcolor: '#16324f', color: '#ffffff', '&:hover': { bgcolor: '#0e2237' } }
                                      : { bgcolor: '#edf2f7', color: c > 0 ? '#334155' : '#94a3b8', border: 'none', '&:hover': { bgcolor: '#e2e8f0' } }
                                    )
                                  }}
                                >
                                  {m} ({c})
                                </Button>
                              );
                            })}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          {selectedWordFilter && (
                            <Chip
                              label={`Word: "${selectedWordFilter}"`}
                              size="small"
                              onDelete={() => setSelectedWordFilter('')}
                              sx={{
                                fontWeight: 700,
                                fontFamily: T.font.family,
                                fontSize: 11.5,
                                height: 26,
                                borderRadius: '9999px',
                                bgcolor: '#fff7ed',
                                color: '#c2410c',
                                border: '1px solid #fed7aa',
                              }}
                            />
                          )}
                          {selectedRowIds.length > 0 && (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => openDeleteModal(null)}
                              startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                borderRadius: '9999px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontFamily: T.font.family,
                                fontSize: 12,
                                height: 30,
                                px: 1.8,
                                bgcolor: '#ea580c',
                                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                                '&:hover': { bgcolor: '#c2410c' }
                              }}
                            >
                              Delete Selected ({selectedRowIds.length})
                            </Button>
                          )}
                        </Box>
                      </Box>

                      {/* ── Table Content - Modern Spreadsheet Grid with Section Highlighting ───── */}
                      <TableContainer
                        component={Box}
                        sx={{
                          overflowX: 'auto',
                          borderRadius: '12px',
                          border: '1.5px solid #cbdbe9',
                          bgcolor: '#ffffff',
                          boxShadow: '0 2px 8px rgba(22, 50, 79, 0.03)',
                        }}
                      >
                        <Table size="small" sx={{ minWidth: 920, borderCollapse: 'separate', borderSpacing: 0 }}>
                          <TableHead>
                            {/* Top Tier: Spreadsheet Section Category Headers */}
                            <TableRow sx={{
                              bgcolor: '#ffffff',
                              '& th': {
                                py: 0.9,
                                px: 1.5,
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                fontFamily: T.font.family,
                                borderBottom: '1px solid #e2e8f0',
                                bgcolor: '#ffffff',
                              }
                            }}>
                              <TableCell colSpan={3} sx={{ color: '#16324f', borderRight: '2px solid #cbdbe9 !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                  <PersonOutlineIcon sx={{ fontSize: 15, color: '#16324f' }} />
                                  <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 800, color: '#16324f', letterSpacing: '0.5px' }}>
                                    Patron Identity
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ color: '#334155', borderRight: '2px solid #cbdbe9 !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                  <ChatBubbleOutlineIcon sx={{ fontSize: 15, color: '#334155' }} />
                                  <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 800, color: '#334155', letterSpacing: '0.5px' }}>
                                    Feedback Response
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell colSpan={2} sx={{ color: '#16324f', borderRight: '2px solid #cbdbe9 !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                  <CategoryIcon sx={{ fontSize: 15, color: '#16324f' }} />
                                  <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 800, color: '#16324f', letterSpacing: '0.5px' }}>
                                    Sentiment & Classification
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell colSpan={2} sx={{ color: '#334155', borderRight: 'none !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                  <EventNoteIcon sx={{ fontSize: 15, color: '#334155' }} />
                                  <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 800, color: '#334155', letterSpacing: '0.5px' }}>
                                    Audit & Actions
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>

                            {/* Second Tier: Column Field Names with Sort Labels and Grid Dividers */}
                            <TableRow sx={{
                              bgcolor: '#fafbfc',
                              '& th': {
                                py: 1.1,
                                px: 1.5,
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#475569',
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                                borderBottom: '2px solid #cbdbe9',
                                borderRight: '1px solid #e2e8f0',
                                bgcolor: '#fafbfc',
                                fontFamily: T.font.family,
                              }
                            }}>
                              <TableCell padding="checkbox" sx={{ width: 44, py: 1, borderRight: '1px solid #e2e8f0' }}>
                                <Checkbox
                                  size="small"
                                  checked={isAllPageSelected}
                                  indeterminate={isSomePageSelected}
                                  onChange={handleSelectAllOnPage}
                                  sx={{ color: '#cbd5e1', p: 0.5, '&.Mui-checked': { color: '#16324f' }, '&.MuiCheckbox-indeterminate': { color: '#16324f' } }}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 115, borderRight: '1px solid #e2e8f0' }}>
                                <TableSortLabel active={sortField === 'Clientele'} direction={sortField === 'Clientele' ? sortOrder : 'asc'} onClick={() => handleRequestSort('Clientele')}
                                  sx={{ color: '#475569 !important', fontWeight: 800, '& .MuiTableSortLabel-icon': { color: '#94a3b8 !important' } }}>
                                  Clientele
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ width: 145, borderRight: '2px solid #cbdbe9 !important' }}>
                                <TableSortLabel active={sortField === 'College'} direction={sortField === 'College' ? sortOrder : 'asc'} onClick={() => handleRequestSort('College')}
                                  sx={{ color: '#475569 !important', fontWeight: 800, '& .MuiTableSortLabel-icon': { color: '#94a3b8 !important' } }}>
                                  College / Dept
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ minWidth: 320, borderRight: '2px solid #cbdbe9 !important' }}>
                                <TableSortLabel active={sortField === 'Message'} direction={sortField === 'Message' ? sortOrder : 'asc'} onClick={() => handleRequestSort('Message')}
                                  sx={{ color: '#475569 !important', fontWeight: 800, '& .MuiTableSortLabel-icon': { color: '#94a3b8 !important' } }}>
                                  Feedback Response
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ width: 125, borderRight: '1px solid #e2e8f0' }}>
                                <TableSortLabel active={sortField === 'SentimentResult'} direction={sortField === 'SentimentResult' ? sortOrder : 'asc'} onClick={() => handleRequestSort('SentimentResult')}
                                  sx={{ color: '#475569 !important', fontWeight: 800, '& .MuiTableSortLabel-icon': { color: '#94a3b8 !important' } }}>
                                  Sentiment
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ width: 135, borderRight: '2px solid #cbdbe9 !important' }}>
                                <TableSortLabel active={sortField === 'Category'} direction={sortField === 'Category' ? sortOrder : 'asc'} onClick={() => handleRequestSort('Category')}
                                  sx={{ color: '#475569 !important', fontWeight: 800, '& .MuiTableSortLabel-icon': { color: '#94a3b8 !important' } }}>
                                  Category
                                </TableSortLabel>
                              </TableCell>
                              <TableCell sx={{ width: 115, borderRight: '1px solid #e2e8f0' }}>
                                <TableSortLabel active={sortField === 'DateSubmitted'} direction={sortField === 'DateSubmitted' ? sortOrder : 'asc'} onClick={() => handleRequestSort('DateSubmitted')}
                                  sx={{ color: '#475569 !important', fontWeight: 800, '& .MuiTableSortLabel-icon': { color: '#94a3b8 !important' } }}>
                                  Date
                                </TableSortLabel>
                              </TableCell>
                              <TableCell align="center" sx={{ width: 75, borderRight: 'none !important', color: '#475569', fontWeight: 800 }}>
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {pageRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: '#f8fafc', color: '#94a3b8', width: 48, height: 48, border: '1px solid #e2e8f0' }}>
                                      <InboxIcon sx={{ fontSize: 26 }} />
                                    </Avatar>
                                    <Typography sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 14, color: '#334155', mt: 0.5 }}>
                                      No survey responses found
                                    </Typography>
                                    <Typography sx={{ fontFamily: T.font.family, fontSize: 12, color: '#94a3b8', maxWidth: 360 }}>
                                      Try adjusting your date range or filter selections to view sentiment feedback.
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={handleClear}
                                      startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                                      sx={{ mt: 1, borderRadius: '9999px', textTransform: 'none', fontFamily: T.font.family, fontWeight: 700, fontSize: 11.5, borderColor: '#cbd5e1', color: '#475569', px: 2, py: 0.3 }}
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
                                  ? (typeof row.DateSubmitted === 'string' && row.DateSubmitted.length >= 10
                                    ? row.DateSubmitted.slice(0, 10)
                                    : new Date(row.DateSubmitted).toISOString().slice(0, 10))
                                  : 'N/A';

                                const clientDisplay = row.Clientele
                                  ? row.Clientele.charAt(0).toUpperCase() + row.Clientele.slice(1).toLowerCase()
                                  : 'Student';

                                return (
                                  <TableRow
                                    key={row.Id || i}
                                    hover
                                    selected={isSelected}
                                    sx={{
                                      bgcolor: '#ffffff',
                                      transition: 'background-color 0.15s ease',
                                      '&:hover': { bgcolor: '#f1f5f9 !important' },
                                      '&.Mui-selected': { bgcolor: '#edf4fa !important' },
                                    }}
                                  >
                                    <TableCell padding="checkbox" sx={{ py: 1.1, px: 1, borderBottom: '1px solid #edf2f7', borderRight: '1px solid #edf2f7' }}>
                                      <Checkbox
                                        size="small"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectRow(row.Id)}
                                        sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#16324f' }, p: 0.3 }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ py: 1.1, px: 1.4, borderBottom: '1px solid #edf2f7', borderRight: '1px solid #edf2f7', fontFamily: T.font.family, fontSize: 13, color: '#16324f', fontWeight: 700 }}>
                                      {clientDisplay}
                                    </TableCell>
                                    <TableCell sx={{ py: 1.1, px: 1.4, borderBottom: '1px solid #edf2f7', borderRight: '2px solid #cbdbe9' }}>
                                      <Box sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        px: 1.3,
                                        py: 0.3,
                                        borderRadius: '9999px',
                                        bgcolor: '#ffffff',
                                        color: '#16324f',
                                        border: '1px solid #cbdbe9',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        fontFamily: T.font.family,
                                        lineHeight: 1.2,
                                      }}>
                                        {row.College || 'N/A'}
                                      </Box>
                                      {row.Course && (
                                        <Typography sx={{ fontFamily: T.font.family, fontSize: 11, color: '#64748b', fontWeight: 500, mt: 0.2 }}>
                                          {row.Course}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{
                                      fontFamily: T.font.family,
                                      fontSize: 13.5,
                                      fontWeight: 500,
                                      color: '#1e293b',
                                      py: 1.1,
                                      px: 1.6,
                                      lineHeight: 1.45,
                                      borderBottom: '1px solid #edf2f7',
                                      borderRight: '2px solid #cbdbe9',
                                    }}>
                                      {row.Message && row.Message.trim().length > 0 ? (
                                        row.Message
                                      ) : (
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                                          <Typography component="span" sx={{ fontFamily: T.font.family, fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>
                                            (No written comment)
                                          </Typography>
                                          <Box sx={{ px: 1, py: 0.2, borderRadius: '9999px', backgroundColor: '#f1f5f9', display: 'inline-block' }}>
                                            <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', fontFamily: T.font.family }}>
                                              Rating Only
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ py: 1.1, px: 1.4, borderBottom: '1px solid #edf2f7', borderRight: '1px solid #edf2f7' }}>
                                      <SentimentChip label={row.SentimentResult} />
                                    </TableCell>
                                    <TableCell sx={{ py: 1.1, px: 1.4, borderBottom: '1px solid #edf2f7', borderRight: '2px solid #cbdbe9' }}>
                                      <CategoryChip label={row.Category} />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: T.font.family, fontSize: 12.5, color: '#64748b', fontWeight: 600, py: 1.1, px: 1.4, borderBottom: '1px solid #edf2f7', borderRight: '1px solid #edf2f7' }}>
                                      {submittedDateStr}
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1.1, px: 1, borderBottom: '1px solid #edf2f7' }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => openDeleteModal(row)}
                                        sx={{
                                          color: '#f87171',
                                          p: 0.4,
                                          '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' }
                                        }}
                                      >
                                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* ── Pagination Controls ───── */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 2.5,
                        pt: 1.5,
                        borderTop: '1px solid #f1f5f9',
                        flexWrap: 'wrap',
                        gap: 1.5,
                      }}>
                        <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, color: '#94a3b8', fontWeight: 500 }}>
                          Showing {reviewRows.length === 0 ? 0 : page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, reviewRows.length)} of {reviewRows.length} comments
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            sx={{
                              textTransform: 'none',
                              fontFamily: T.font.family,
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#64748b',
                              px: 1.5,
                              py: 0.35,
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              bgcolor: 'transparent',
                              minWidth: 'auto',
                              '&:hover': { bgcolor: '#f8fafc' },
                              '&.Mui-disabled': { color: '#cbd5e1', borderColor: '#f1f5f9' }
                            }}
                          >
                            &larr; Prev
                          </Button>
                          <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: '#334155', px: 0.5 }}>
                            Page {page + 1} of {totalPages}
                          </Typography>
                          <Button
                            size="small"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            sx={{
                              textTransform: 'none',
                              fontFamily: T.font.family,
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#64748b',
                              px: 1.5,
                              py: 0.35,
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              bgcolor: 'transparent',
                              minWidth: 'auto',
                              '&:hover': { bgcolor: '#f8fafc' },
                              '&.Mui-disabled': { color: '#cbd5e1', borderColor: '#f1f5f9' }
                            }}
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