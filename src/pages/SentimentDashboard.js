import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip,
  TableSortLabel, Snackbar, Alert, Tooltip,
  Checkbox, ToggleButton, ToggleButtonGroup, IconButton,
  Skeleton, Collapse, InputAdornment, Badge
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
  Psychology as PsychologyIcon,
  CalendarToday as CalendarTodayIcon,
  RestartAlt as RestartAltIcon,
  Inbox as InboxIcon,
  PersonOutline as PersonOutlineIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Category as CategoryIcon,
  EventNote as EventNoteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  WarningAmber as WarningAmberIcon,
  OutlinedFlag,
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
import { getPSTDateString, getPSTDatePresets } from '../constants/collegeMap';

// ui and helper imports
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
  cleanCollegeName,
} from '../constants/sentimentConstants';

import {
  formatRatingShort,
  getSatisfactionAverage,
  stemWord,
  buildTermFrequencies,
  scoreCommentsWithRoBERTa,
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

// custom rounded bar shape for recharts
const renderPillBar = (props) => {
  const { x, y, width, height, fill, stroke, strokeWidth, payload } = props;
  if (!height || Math.abs(height) < 0.5 || !width || width <= 0) return null;

  const actualY = height < 0 ? y + height : y;
  const actualHeight = Math.abs(height);
  const r = Math.min(width / 2, actualHeight / 2);
  const isSelected = payload?.isSelectedMonth;

  return (
    <rect
      x={x}
      y={actualY}
      width={width}
      height={actualHeight}
      rx={r}
      ry={r}
      fill={fill}
      stroke={isSelected ? '#0f172a' : stroke}
      strokeWidth={isSelected ? 2 : (strokeWidth || 0)}
      style={{
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        filter: isSelected
          ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))'
          : (strokeWidth > 1 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' : 'none'),
      }}
    />
  );
};

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

  // word cloud states and filters
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

  // search and sort states
  const [sortField, setSortField] = useState('DateSubmitted');
  const [sortOrder, setSortOrder] = useState('desc');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // batch selection and deletion states
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // trend scale mode: percent (100%) or count (volume)
  const [trendScaleMode, setTrendScaleMode] = useState('percent');

  // comments section active view tab ('all', 'positive', 'neutral', 'negative')
  const [commentsView, setCommentsView] = useState('all');

  // layout controls
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
    let newStart = '';
    let newEnd = '';
    let newQuarter = 'All';
    let newMonth = 'All';
    let newYear = filterYear === 'All' ? '2026' : (filterYear || '2026');
    const targetYear = newYear === 'All' ? '2026' : newYear;
    const pstPresets = getPSTDatePresets(targetYear);

    if (presetKey === 'today') {
      newStart = pstPresets.today;
      newEnd = pstPresets.today;
      newQuarter = 'All';
    } else if (presetKey === 'week') {
      newStart = pstPresets.startOfWeek;
      newEnd = pstPresets.today;
      newQuarter = 'All';
    } else if (presetKey === 'month') {
      newStart = pstPresets.startOfMonth;
      newEnd = pstPresets.endOfMonth;
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
    setTableSearchQuery('');
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

  const cohortFiltered = useMemo(() => {
    return surveys.filter(s => {
      if (!s.SentimentResult) return false;
      if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return false;
      if (filterCollege && s.College !== filterCollege) return false;
      if (filterCourse && s.Course !== filterCourse) return false;
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
  }, [surveys, filterClientele, filterCollege, filterCourse, filterCategory, filterYear, filterQuarter, filterMonth, startDate, endDate]);

  const filtered = useMemo(() => {
    if (!filterSentiment || filterSentiment === 'All') return cohortFiltered;
    return cohortFiltered.filter(s => s.SentimentResult === filterSentiment);
  }, [cohortFiltered, filterSentiment]);

  const cohortCounts = useMemo(() => {
    const c = { Positive: 0, Neutral: 0, Negative: 0, Total: 0 };
    cohortFiltered.forEach(s => {
      if (c[s.SentimentResult] !== undefined) c[s.SentimentResult]++;
      c.Total++;
    });
    return c;
  }, [cohortFiltered]);

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

  const filteredWithWordAndSearch = useMemo(() => {
    let result = filtered;
    if (selectedWordFilter) {
      const wordLower = selectedWordFilter.toLowerCase();
      const stem = stemWord(wordLower);
      result = result.filter(s => {
        if (!s.Message) return false;
        const msgLower = s.Message.toLowerCase();
        return msgLower.includes(wordLower) || msgLower.includes(stem);
      });
    }
    if (tableSearchQuery && tableSearchQuery.trim()) {
      const q = tableSearchQuery.trim().toLowerCase();
      result = result.filter(s => {
        const msg = (s.Message || '').toLowerCase();
        const college = (s.College || '').toLowerCase();
        const course = (s.Course || '').toLowerCase();
        const clientele = (s.Clientele || '').toLowerCase();
        const category = (s.Category || '').toLowerCase();
        const sentiment = (s.SentimentResult || '').toLowerCase();
        return (
          msg.includes(q) ||
          college.includes(q) ||
          course.includes(q) ||
          clientele.includes(q) ||
          category.includes(q) ||
          sentiment.includes(q)
        );
      });
    }
    return result;
  }, [filtered, selectedWordFilter, tableSearchQuery]);

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
    return [...filteredWithWordAndSearch].sort((a, b) => {
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
  }, [filteredWithWordAndSearch, sortField, sortOrder]);
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

  const advancedFilterCount = useMemo(() => {
    let count = 0;
    if (startDate || endDate) count++;
    if (filterQuarter && filterQuarter !== 'All') count++;
    if (filterYear && filterYear !== 'All' && filterYear !== '2026') count++;
    if (filterClientele) count++;
    if (filterCollege) count++;
    if (filterCourse) count++;
    if (filterCategory) count++;
    return count;
  }, [startDate, endDate, filterQuarter, filterYear, filterClientele, filterCollege, filterCourse, filterCategory]);

  const hasActiveFilter = Boolean(
    startDate ||
    endDate ||
    filterClientele ||
    filterCollege ||
    filterCourse ||
    filterSentiment ||
    filterCategory ||
    tableSearchQuery ||
    (filterQuarter && filterQuarter !== 'All') ||
    (filterMonth && filterMonth !== 'All') ||
    (filterYear && filterYear !== 'All' && filterYear !== '2026')
  );

  // computation: avg satisfaction = sum(scores) / total
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

  // computation: monthly sentiment aggregates and percentages
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
      // computation: net = positive - negative; pos % = (positive / total) * 100
      const net = item.Positive - item.rawNegative;
      const posPct = item.Total > 0 ? Math.round((item.Positive / item.Total) * 100) : 0;
      const neuPct = item.Total > 0 ? Math.round((item.Neutral / item.Total) * 100) : 0;
      const negPct = item.Total > 0 ? Math.round((item.rawNegative / item.Total) * 100) : 0;
      return {
        ...item,
        posPct,
        neuPct,
        negPct,
        negPctDiverging: -negPct,
        avgSatisfaction: avg,
        netScore: net,
        isSelectedMonth: filterMonth === m,
      };
    });
  }, [surveys, filterYear, filterClientele, filterCollege, filterCourse, filterCategory, filterMonth]);

  // computation: dynamic max = ceil(maxVal * 1.25)
  const maxVolume = useMemo(() => {
    let maxVal = 5;
    divergingTrendData.forEach(d => {
      if (filterSentiment === 'Positive') {
        if (d.Positive > maxVal) maxVal = d.Positive;
      } else if (filterSentiment === 'Neutral') {
        if (d.Neutral > maxVal) maxVal = d.Neutral;
      } else if (filterSentiment === 'Negative') {
        if (d.rawNegative > maxVal) maxVal = d.rawNegative;
      } else {
        if (d.Positive > maxVal) maxVal = d.Positive;
        if (d.Neutral > maxVal) maxVal = d.Neutral;
        if (d.rawNegative > maxVal) maxVal = d.rawNegative;
      }
    });
    return Math.ceil(maxVal * 1.25);
  }, [divergingTrendData, filterSentiment]);

  // computation: category pos % = round((pos / total) * 100)
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

  // category sentiment counts
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




  // word frequencies
  const { freq: termFrequencies = {}, displayMap: stemToOriginalMap = {} } = useMemo(() => {
    return buildTermFrequencies(filtered.length > 0 ? filtered : surveys);
  }, [filtered, surveys]);

  const commentsMasterPool = cohortFiltered.length > 0 ? cohortFiltered : surveys;

  const positivePool = commentsMasterPool.filter(s => {
    if (s.SentimentResult !== 'Positive' || !s.Message?.trim()) return false;
    return true;
  });
  const negativePool = commentsMasterPool.filter(s => {
    if (s.SentimentResult !== 'Negative' || !s.Message?.trim()) return false;
    return true;
  });

  const topPositive = useMemo(() => {
    if (positivePool.length === 0) return [];
    const scoredPool = scoreCommentsWithRoBERTa(positivePool);
    scoredPool.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(b.DateSubmitted || 0) - new Date(a.DateSubmitted || 0);
    });
    return selectDiverseTopComments(scoredPool, 5);
  }, [positivePool]);

  const topNegative = useMemo(() => {
    if (negativePool.length === 0) return [];
    const scoredPool = scoreCommentsWithRoBERTa(negativePool);
    scoredPool.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return new Date(b.DateSubmitted || 0) - new Date(a.DateSubmitted || 0);
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
          .slice(0, 3);

        const topicActionConfig = LEXICON_TOPIC_ACTIONS[topicName] || {};
        const threshold = topicActionConfig.defaultSeverity === 'HIGH' ? 4 : 7;
        const severity = totalMatches >= threshold ? 'HIGH' : 'MODERATE';
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

  const urgentAlertTopic = useMemo(() => {
    if (counts.Negative === 0) return null;
    const highStat = categoryStats.find(c => c.severity === 'HIGH' && c.matchCount > 0);
    if (highStat) return highStat;
    const topStat = categoryStats.find(c => c.matchCount > 0);
    if (topStat) return topStat;
    if (counts.Negative >= 3) {
      return {
        id: 'general-negative-spike',
        title: 'Negative Feedback Spike',
        category: 'General',
        matchCount: counts.Negative,
        action: 'Review patron feedback responses to investigate emerging service issues.',
      };
    }
    return null;
  }, [categoryStats, counts.Negative]);

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
      'Date Submitted': row.DateSubmitted ? (typeof row.DateSubmitted === 'string' && row.DateSubmitted.length >= 10 ? row.DateSubmitted.slice(0, 10) : getPSTDateString(new Date(row.DateSubmitted))) : 'N/A'
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

    const dateStamp = getPSTDateString();
    XLSX.writeFile(workbook, `HLL_Sentiment_Analysis_${dateStamp}.xlsx`);
  };

  const handleExportTableExcel = () => {
    if (reviewRows.length === 0) {
      setSnackbarMsg("No survey responses currently matching table filters to export.");
      return;
    }

    const tableRowsData = reviewRows.map((row, index) => ({
      'No.': index + 1,
      'Clientele Group': row.Clientele ? (row.Clientele.charAt(0).toUpperCase() + row.Clientele.slice(1).toLowerCase()) : 'Student',
      'College': cleanCollegeName(row.College) || 'N/A',
      'Course': cleanCollegeName(row.Course) || 'N/A',
      'Feedback Message': row.Message || '(Rating only - no written comment)',
      'Sentiment': row.SentimentResult || 'Neutral',
      'Category': row.Category || 'Other/Uncategorized',
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
      'Date Submitted': row.DateSubmitted ? (typeof row.DateSubmitted === 'string' && row.DateSubmitted.length >= 10 ? row.DateSubmitted.slice(0, 10) : getPSTDateString(new Date(row.DateSubmitted))) : 'N/A'
    }));

    const workbook = XLSX.utils.book_new();
    const wsTable = XLSX.utils.json_to_sheet(tableRowsData);

    const colWidths = [];
    tableRowsData.forEach((row) => {
      Object.keys(row).forEach((key, colIndex) => {
        const valStr = row[key] ? row[key].toString() : '';
        const maxLen = Math.max(valStr.length, key.length);
        if (!colWidths[colIndex] || maxLen > colWidths[colIndex]) {
          colWidths[colIndex] = maxLen;
        }
      });
    });
    wsTable['!cols'] = colWidths.map(w => ({ wch: Math.min(w + 4, 60) }));

    XLSX.utils.book_append_sheet(workbook, wsTable, "Filtered Table View");
    const dateStamp = getPSTDateString();
    XLSX.writeFile(workbook, `HLL_Survey_Table_View_${dateStamp}.xlsx`);
    setSnackbarMsg(`Exported ${reviewRows.length} survey records from table view.`);
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
                {/* action bar */}
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
                        bgcolor: '#107c41',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(16, 124, 65, 0.28)',
                        '&:hover': { bgcolor: '#0b5a2f', boxShadow: '0 4px 12px rgba(16, 124, 65, 0.35)' }
                      }}
                    >
                      Export to Excel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/model-explainer')}
                      startIcon={<PsychologyIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: '10px', height: 42, px: 2.2,
                        fontFamily: T.font.family, fontSize: 13.5, fontWeight: 700, textTransform: 'none',
                        bgcolor: '#16324f',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(22, 50, 79, 0.28)',
                        '&:hover': { bgcolor: '#0f243a', boxShadow: '0 4px 12px rgba(22, 50, 79, 0.35)' }
                      }}
                    >
                      Model Explainer
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleLogout}
                      startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: '10px', height: 42, px: 2.2,
                        fontFamily: T.font.family, fontSize: 13.5, fontWeight: 700, textTransform: 'none',
                        borderColor: '#fca5a5', color: '#e11d48',
                        bgcolor: '#ffffff', borderWidth: '1.5px',
                        boxShadow: '0 1px 3px rgba(225, 29, 72, 0.05)',
                        '&:hover': { bgcolor: '#fff1f2', borderColor: '#e11d48', color: '#be123c', borderWidth: '1.5px' }
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                </Paper>

                {/* filter controls */}
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
                      <Box>
                        <Typography sx={{ ...sectionTitleSx, color: '#16324f' }}>
                          Filter & Analytics Controls
                        </Typography>
                        <Typography sx={sectionSubtitleSx}>
                          Filter by date horizon, sentiment status, or expand academic demographics
                        </Typography>
                      </Box>
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

                  {/* date and sentiment filters */}
                  <Box sx={{
                    p: { xs: 2, sm: 2.5 },
                    bgcolor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}>
                    {/* date presets */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, fontWeight: 700, color: '#64748b', mr: 0.4, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 15, color: '#16324f' }} /> Date Horizon:
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

                    {/* quick filters */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                      {/* sentiment pills */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', p: 0.4, borderRadius: '10px' }}>
                        {[
                          { val: '', label: 'All Sentiments' },
                          { val: 'Positive', label: 'Positive' },
                          { val: 'Neutral', label: 'Neutral' },
                          { val: 'Negative', label: 'Negative' }
                        ].map((s) => {
                          const isSel = filterSentiment === s.val;
                          return (
                            <Button
                              key={s.label}
                              size="small"
                              onClick={() => { setFilterSentiment(s.val); setPage(0); }}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontFamily: T.font.family,
                                fontSize: 12,
                                fontWeight: isSel ? 700 : 600,
                                px: 1.3,
                                py: 0.35,
                                minWidth: 'auto',
                                bgcolor: isSel ? '#ffffff' : 'transparent',
                                color: isSel
                                  ? (s.val === 'Positive' ? '#107c41' : s.val === 'Negative' ? '#be123c' : '#16324f')
                                  : '#64748b',
                                boxShadow: isSel ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                '&:hover': { bgcolor: isSel ? '#ffffff' : '#e2e8f0' }
                              }}
                            >
                              {s.label}
                            </Button>
                          );
                        })}
                      </Box>

                      {/* advanced filters toggle */}
                      <Button
                        variant="outlined"
                        onClick={() => setShowAdvancedFilters(prev => !prev)}
                        startIcon={<TuneIcon sx={{ fontSize: 17 }} />}
                        endIcon={showAdvancedFilters ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          borderRadius: '10px',
                          height: 38,
                          px: 2,
                          fontFamily: T.font.family,
                          fontSize: 12.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          borderColor: showAdvancedFilters || advancedFilterCount > 0 ? '#16324f' : '#cbdbe9',
                          bgcolor: showAdvancedFilters || advancedFilterCount > 0 ? '#edf4fa' : '#ffffff',
                          color: '#16324f',
                          '&:hover': { bgcolor: '#e2edf7', borderColor: '#16324f' }
                        }}
                      >
                        <Badge
                          badgeContent={advancedFilterCount}
                          color="primary"
                          sx={{ '& .MuiBadge-badge': { fontWeight: 800, fontSize: 10.5, right: -8, top: -2, bgcolor: '#f57c00' } }}
                        >
                          More Filters
                        </Badge>
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClear}
                        startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
                        disabled={!hasActiveFilter}
                        sx={{
                          height: 38, px: 2, borderRadius: '10px', textTransform: 'none',
                          fontFamily: T.font.family, fontWeight: 700, fontSize: 12.5,
                          borderColor: hasActiveFilter ? '#ea580c' : '#e2e8f0',
                          color: hasActiveFilter ? '#ea580c' : '#94a3b8',
                          borderWidth: '1.5px',
                          bgcolor: hasActiveFilter ? 'rgba(234, 88, 12, 0.05)' : 'transparent',
                          '&:hover': { borderWidth: '1.5px', borderColor: '#c2410c', bgcolor: 'rgba(234, 88, 12, 0.1)' }
                        }}
                      >
                        Reset All
                      </Button>
                    </Box>
                  </Box>

                  {/* advanced filters drawer */}
                  <Collapse in={showAdvancedFilters} timeout="auto" unmountOnExit>
                    <Box sx={{
                      p: 3,
                      bgcolor: '#f8fafc',
                      borderTop: `1px solid ${T.surface.borderLight}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}>
                      <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Demographics, Academic Units & Custom Range
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
                      </Box>
                    </Box>
                  </Collapse>

                  {/* filter chips */}
                  {hasActiveFilter && (
                    <Box sx={{ px: 3, pb: 2, pt: 1.5, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', borderTop: `1px solid ${T.surface.borderLight}` }}>
                      <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, fontWeight: 700, color: '#64748b' }}>
                        Active Filters:
                      </Typography>
                      {tableSearchQuery && (
                        <Chip
                          label={`Search: "${tableSearchQuery}"`}
                          onDelete={() => { setTableSearchQuery(''); setPage(0); }}
                          size="small"
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '9999px' }}
                        />
                      )}
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
                          sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 12, bgcolor: filterSentiment === 'Positive' ? '#eafaf1' : filterSentiment === 'Negative' ? '#fff1f2' : '#f1f5f9', color: filterSentiment === 'Positive' ? '#107c41' : filterSentiment === 'Negative' ? '#be123c' : '#475569', border: filterSentiment === 'Positive' ? '1px solid #b7ebc9' : filterSentiment === 'Negative' ? '1px solid #fecdd3' : '1px solid #cbd5e1', borderRadius: '9999px' }} />
                      )}
                      {filterCategory && (() => {
                        const catToken = T.category[filterCategory] || T.category['Other/Uncategorized'];
                        return (
                          <Chip
                            label={`Category: ${filterCategory}`}
                            onDelete={() => handleRemoveFilter('category')}
                            size="small"
                            sx={{
                              fontFamily: T.font.family,
                              fontWeight: 700,
                              fontSize: 12,
                              bgcolor: catToken.light,
                              color: catToken.text,
                              border: `1px solid ${catToken.border}`,
                              borderRadius: '9999px',
                            }}
                          />
                        );
                      })()}
                      <Button size="small" onClick={handleClear} startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
                        sx={{ fontFamily: T.font.family, textTransform: 'none', fontWeight: 700, fontSize: 12, color: '#ea580c', ml: 'auto' }}>
                        Clear All
                      </Button>
                    </Box>
                  )}
                </Paper>

                {/* priority alert */}
                {urgentAlertTopic && !loading && (
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 3,
                      p: { xs: 2, sm: 2.3 },
                      borderRadius: 3.5,
                      bgcolor: '#fff1f2',
                      border: '1.5px solid #fecdd3',
                      borderLeft: '6px solid #e11d48',
                      boxShadow: '0 4px 16px rgba(225, 29, 72, 0.07)',
                      display: 'flex',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.8 }}>
                      <Box sx={{
                        bgcolor: '#ffe4e6',
                        color: '#e11d48',
                        p: 0.9,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #fecdd3',
                        flexShrink: 0,
                      }}>
                        <WarningAmberIcon sx={{ fontSize: 26 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontFamily: T.font.family, fontWeight: 800, fontSize: 15.5, color: '#9f1239', letterSpacing: '-0.2px' }}>
                            Priority Service Attention Detected
                          </Typography>
                          <Chip
                            size="small"
                            label={`${urgentAlertTopic.matchCount} Negative Feedback`}
                            sx={{
                              fontFamily: T.font.family,
                              fontWeight: 800,
                              fontSize: 11,
                              bgcolor: '#e11d48',
                              color: '#ffffff',
                              height: 22,
                            }}
                          />
                          <Chip
                            size="small"
                            label={urgentAlertTopic.category}
                            sx={{
                              fontFamily: T.font.family,
                              fontWeight: 700,
                              fontSize: 11,
                              bgcolor: '#ffffff',
                              color: '#be123c',
                              border: '1px solid #fecdd3',
                              height: 22,
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: '#881337', mt: 0.4, lineHeight: 1.45 }}>
                          <strong>{urgentAlertTopic.title}:</strong> {urgentAlertTopic.action}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexShrink: 0, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          if (urgentAlertTopic.category && urgentAlertTopic.category !== 'General') {
                            setFilterCategory(urgentAlertTopic.category);
                          }
                          setFilterSentiment('Negative');
                          handleScrollToReviewTable();
                        }}
                        endIcon={<OutlinedFlag sx={{ fontSize: 15 }} />}
                        sx={{
                          borderRadius: '9999px',
                          bgcolor: '#e11d48',
                          color: '#ffffff',
                          fontFamily: T.font.family,
                          fontWeight: 700,
                          fontSize: 12.5,
                          textTransform: 'none',
                          px: 2.2,
                          py: 0.6,
                          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)',
                          '&:hover': { bgcolor: '#be123c' }
                        }}
                      >
                        Inspect Affected Reviews
                      </Button>
                    </Box>
                  </Paper>
                )}

                {loading ? (
                  /* skeleton loader */
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, my: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                      <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3.5, bgcolor: '#ffffff' }} />
                      <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3.5, bgcolor: '#ffffff' }} />
                      <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3.5, bgcolor: '#ffffff' }} />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' }, gap: 2.5 }}>
                      <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3.5, bgcolor: '#ffffff' }} />
                      <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3.5, bgcolor: '#ffffff' }} />
                    </Box>
                    <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3.5, bgcolor: '#ffffff' }} />
                    <Skeleton variant="rounded" height={350} sx={{ borderRadius: 3.5, bgcolor: '#ffffff' }} />
                  </Box>
                ) : (
                  <>
                    {/* kpi and source overview */}
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' },
                      gap: 2.5,
                      mb: 3.5,
                      alignItems: 'stretch'
                    }}>
                      {/* kpis and trend chart */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* kpi cards */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                          <ModernKpiCard
                            title="Total Surveys"
                            value={total.toLocaleString()}
                            borderColorTheme="gold"
                            subtitle={filterSentiment && filterSentiment !== 'All' ? `${total} ${filterSentiment.toLowerCase()} in view (of ${cohortCounts.Total})` : 'Total survey submissions'}
                          />
                          {(() => {
                            const isNeg = filterSentiment === 'Negative';
                            const isNeu = filterSentiment === 'Neutral';
                            const isFiltered = Boolean(filterSentiment && filterSentiment !== 'All');

                            const kpiTitle = isNeg
                              ? 'Negative Sentiment Rate'
                              : isNeu
                                ? 'Neutral Sentiment Rate'
                                : 'Positive Sentiment Rate';

                            const activeCount = isNeg
                              ? cohortCounts.Negative
                              : isNeu
                                ? cohortCounts.Neutral
                                : cohortCounts.Positive;

                            // computation: kpi rate % = round((active / total) * 100)
                            const kpiRate = cohortCounts.Total > 0
                              ? Math.round((activeCount / cohortCounts.Total) * 100)
                              : 0;

                            const kpiTheme = isNeg ? 'rose' : isNeu ? 'slate' : 'blue';
                            const kpiBadge = isFiltered ? `${filterSentiment} Focus` : null;
                            const kpiBadgeType = isNeg ? 'negative' : isNeu ? 'neutral' : 'positive';

                            return (
                              <ModernKpiCard
                                title={kpiTitle}
                                value={`${kpiRate}%`}
                                badgeText={kpiBadge}
                                badgeType={kpiBadgeType}
                                borderColorTheme={kpiTheme}
                                subtitle={`${activeCount} of ${cohortCounts.Total} cohort submissions`}
                              />
                            );
                          })()}
                          <ModernKpiCard
                            title={filterSentiment && filterSentiment !== 'All' ? `${filterSentiment} Avg Rating` : 'Avg Satisfaction'}
                            value={`${avgSatisfaction.toFixed(2)} ★`}
                            badgeText={`${Math.round((avgSatisfaction / 5) * 100)}%`}
                            highlighted={true}
                            subtitle={filterSentiment && filterSentiment !== 'All' ? `Rating for ${filterSentiment.toLowerCase()} reviews` : 'Scale: 1.0 to 5.0 rating'}
                          />
                        </Box>

                        {/* monthly sentiment chart */}
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
                          {/* header */}
                          <Box sx={{
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.5,
                            mb: 1.5,
                          }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontFamily: T.font.family, fontSize: 14, fontWeight: 700, color: '#64748b' }}>
                                  {filterSentiment && filterSentiment !== 'All'
                                    ? `Monthly ${filterSentiment} Sentiment Trend`
                                    : 'Monthly Sentiment Comparison'}
                                </Typography>
                                {filterSentiment && filterSentiment !== 'All' && (
                                  <Chip
                                    label={`Showing ${filterSentiment} Only`}
                                    size="small"
                                    onDelete={() => { setFilterSentiment(''); setPage(0); }}
                                    sx={{
                                      height: 22,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      fontFamily: T.font.family,
                                      bgcolor: filterSentiment === 'Positive' ? '#ecfdf5' : filterSentiment === 'Neutral' ? '#f1f5f9' : '#fff1f2',
                                      color: filterSentiment === 'Positive' ? '#065f46' : filterSentiment === 'Neutral' ? '#334155' : '#9f1239',
                                      border: `1px solid ${filterSentiment === 'Positive' ? '#a7f3d0' : filterSentiment === 'Neutral' ? '#cbd5e1' : '#fecdd3'}`,
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: 14,
                                        color: 'inherit',
                                        opacity: 0.7,
                                        '&:hover': { opacity: 1 }
                                      }
                                    }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.2, mt: 0.4, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontFamily: T.font.family, fontSize: { xs: 24, sm: 28 }, fontWeight: 800, color: '#16324f', lineHeight: 1.1 }}>
                                  {filterSentiment === 'Negative'
                                    ? `${cohortCounts.Total > 0 ? Math.round((cohortCounts.Negative / cohortCounts.Total) * 100) : 0}% Negative Share`
                                    : filterSentiment === 'Neutral'
                                      ? `${cohortCounts.Total > 0 ? Math.round((cohortCounts.Neutral / cohortCounts.Total) * 100) : 0}% Neutral Share`
                                      : `${cohortCounts.Total > 0 ? Math.round((cohortCounts.Positive / cohortCounts.Total) * 100) : 0}% Positive Share`}
                                </Typography>
                                <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
                                  {filterSentiment === 'Negative'
                                    ? `(${cohortCounts.Negative} of ${cohortCounts.Total} submissions)`
                                    : filterSentiment === 'Neutral'
                                      ? `(${cohortCounts.Neutral} of ${cohortCounts.Total} submissions)`
                                      : `(${cohortCounts.Positive} of ${cohortCounts.Total} submissions)`}
                                </Typography>
                              </Box>
                            </Box>

                            {/* percentage vs volume toggle */}
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

                          {/* monthly chart */}
                          <Box sx={{ width: '100%', height: 340, mt: 0.5 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={divergingTrendData}
                                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                                barGap={5}
                                barCategoryGap="16%"
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
                                  {/* positive gradient */}
                                  <linearGradient id="barDarkGreen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.9} />
                                  </linearGradient>
                                  {/* positive highlight */}
                                  <linearGradient id="barVibrantGreen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.95} />
                                  </linearGradient>

                                  {/* neutral gradient */}
                                  <linearGradient id="barDarkSlate" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.92} />
                                    <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.9} />
                                  </linearGradient>
                                  {/* neutral highlight */}
                                  <linearGradient id="barVibrantSlate" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#475569" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.95} />
                                  </linearGradient>

                                  {/* negative gradient */}
                                  <linearGradient id="barDarkRose" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0.9} />
                                  </linearGradient>
                                  {/* negative highlight */}
                                  <linearGradient id="barVibrantRose" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#e11d48" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.95} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.surface.borderLight} />
                                <XAxis dataKey="month" tick={{ fontFamily: T.font.family, fontSize: 12, fill: T.text.secondary, fontWeight: 700 }} />

                                {trendScaleMode === 'percent' ? (
                                  <YAxis
                                    domain={[0, 100]}
                                    ticks={[0, 25, 50, 75, 100]}
                                    tickFormatter={(val) => `${val}%`}
                                    tick={{ fontFamily: T.font.family, fontSize: 11, fill: T.text.secondary, fontWeight: 600 }}
                                    allowDecimals={false}
                                  />
                                ) : (
                                  <YAxis
                                    domain={[0, maxVolume]}
                                    tickFormatter={(val) => val}
                                    tick={{ fontFamily: T.font.family, fontSize: 11, fill: T.text.secondary, fontWeight: 600 }}
                                    allowDecimals={false}
                                  />
                                )}

                                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} />
                                <RechartsTooltip content={<CustomDivergingTrendTooltip />} />
                                <Legend
                                  iconType="circle"
                                  wrapperStyle={{ fontFamily: T.font.family, fontSize: 12, paddingTop: 8 }}
                                  formatter={(value) => <span style={{ color: T.text.heading, fontWeight: 600 }}>{value}</span>}
                                />

                                {(!filterSentiment || filterSentiment === 'All' || filterSentiment === 'Positive') && (
                                  <Bar
                                    dataKey={trendScaleMode === 'percent' ? 'posPct' : 'Positive'}
                                    name={trendScaleMode === 'percent' ? 'Positive (%)' : 'Positive'}
                                    fill={filterSentiment === 'Positive' ? 'url(#barVibrantGreen)' : 'url(#barDarkGreen)'}
                                    stroke={filterSentiment === 'Positive' ? '#047857' : '#10b981'}
                                    strokeWidth={filterSentiment === 'Positive' ? 1.5 : 1}
                                    shape={renderPillBar}
                                    barSize={filterSentiment ? 36 : 20}
                                  />
                                )}
                                {(!filterSentiment || filterSentiment === 'All' || filterSentiment === 'Neutral') && (
                                  <Bar
                                    dataKey={trendScaleMode === 'percent' ? 'neuPct' : 'Neutral'}
                                    name={trendScaleMode === 'percent' ? 'Neutral (%)' : 'Neutral'}
                                    fill={filterSentiment === 'Neutral' ? 'url(#barVibrantSlate)' : 'url(#barDarkSlate)'}
                                    stroke={filterSentiment === 'Neutral' ? '#334155' : '#94a3b8'}
                                    strokeWidth={filterSentiment === 'Neutral' ? 1.5 : 1}
                                    shape={renderPillBar}
                                    barSize={filterSentiment ? 36 : 20}
                                  />
                                )}
                                {(!filterSentiment || filterSentiment === 'All' || filterSentiment === 'Negative') && (
                                  <Bar
                                    dataKey={trendScaleMode === 'percent' ? 'negPct' : 'rawNegative'}
                                    name={trendScaleMode === 'percent' ? 'Negative (%)' : 'Negative'}
                                    fill={filterSentiment === 'Negative' ? 'url(#barVibrantRose)' : 'url(#barDarkRose)'}
                                    stroke={filterSentiment === 'Negative' ? '#be123c' : '#f43f5e'}
                                    strokeWidth={filterSentiment === 'Negative' ? 1.5 : 1}
                                    shape={renderPillBar}
                                    barSize={filterSentiment ? 36 : 20}
                                  />
                                )}
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Card>
                      </Box>

                      {/* category donut breakdown */}
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


                    {/* patron comments */}
                    <Card elevation={0} sx={{
                      ...cardShellSx,
                      mb: 3,
                      border: '1.5px solid #cbdbe9',
                      borderTop: '3.5px solid #16324f',
                      boxShadow: '0 2px 12px rgba(22, 50, 79, 0.04)',
                    }}>
                      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Box sx={{
                            bgcolor: '#edf4fa',
                            color: '#16324f',
                            p: 0.6,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '& svg': { fontSize: 19 }
                          }}>
                            <RateReviewIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ ...sectionTitleSx, color: '#16324f' }}>Top Patron Comments</Typography>
                            <Typography sx={sectionSubtitleSx}>Top 5 high-impact positive commendations and critical negative feedback</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                          <ToggleButtonGroup
                            value={(filterSentiment && (filterSentiment === 'Positive' || filterSentiment === 'Negative')) ? filterSentiment.toLowerCase() : commentsView}
                            exclusive
                            onChange={(e, val) => {
                              if (val) {
                                if (filterSentiment && (filterSentiment === 'Positive' || filterSentiment === 'Negative')) {
                                  const mapVal = val === 'all' ? '' : (val.charAt(0).toUpperCase() + val.slice(1));
                                  setFilterSentiment(mapVal);
                                  setPage(0);
                                }
                                setCommentsView(val);
                              }
                            }}
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
                                py: 0.2,
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
                            <ToggleButton value="all">
                              Both Views ({topPositive.length + topNegative.length})
                            </ToggleButton>
                            <ToggleButton value="positive">
                              <ThumbUpIcon sx={{ fontSize: 12, mr: 0.5, color: '#107c41' }} />
                              Positive ({topPositive.length})
                            </ToggleButton>
                            <ToggleButton value="negative">
                              <ThumbDownIcon sx={{ fontSize: 12, mr: 0.5, color: '#be123c' }} />
                              Negative ({topNegative.length})
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                      </Box>

                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                        {(() => {
                          const activeView = (filterSentiment && (filterSentiment === 'Positive' || filterSentiment === 'Negative'))
                            ? filterSentiment.toLowerCase()
                            : commentsView;

                          return (
                            <Box sx={{
                              display: 'grid',
                              gridTemplateColumns: activeView === 'all'
                                ? { xs: '1fr', lg: '1fr 1fr' }
                                : '1fr',
                              gap: 2.5,
                              alignItems: 'stretch',
                            }}>
                              {(activeView === 'all' || activeView === 'positive') && (
                                <TopCommentsCard
                                  title="Top 5 Positive Comments"
                                  rows={topPositive}
                                  type="positive"
                                />
                              )}
                              {(activeView === 'all' || activeView === 'negative') && (
                                <TopCommentsCard
                                  title="Top 5 Negative Comments"
                                  rows={topNegative}
                                  type="negative"
                                />
                              )}
                            </Box>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* recommendations */}
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

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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

                          {filterCategory && (
                            <Button
                              size="small"
                              onClick={() => {
                                setFilterCategory('');
                                setPage(0);
                              }}
                              startIcon={<CloseIcon sx={{ fontSize: 13 }} />}
                              sx={{
                                fontFamily: T.font.family,
                                fontSize: 11.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                color: '#be123c',
                                border: '1px solid #fecdd3',
                                bgcolor: '#fff1f2',
                                borderRadius: '9999px',
                                px: 1.4,
                                py: 0.25,
                                minHeight: 'auto',
                                '&:hover': {
                                  bgcolor: '#ffe4e6',
                                  borderColor: '#fda4af',
                                }
                              }}
                            >
                              Clear Category Filter ({filterCategory})
                            </Button>
                          )}
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
                              isFiltered={filterCategory === c.category}
                              onFilterCategory={(cat) => {
                                if (filterCategory === cat) {
                                  setFilterCategory('');
                                } else if (cat && cat !== 'Other/Uncategorized') {
                                  setFilterCategory(cat);
                                  handleScrollToReviewTable();
                                }
                                setPage(0);
                              }}
                              onClearFilter={() => {
                                setFilterCategory('');
                                setPage(0);
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>

                    {/* word cloud */}
                    <WordCloudSection
                      words={wordCloudWords}
                      selectedWordFilter={selectedWordFilter}
                      onSelectWord={handleSelectWord}
                      onClearWordFilter={handleClearWordFilter}
                    />

                    {/* survey reviews table */}
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
                      {/* table controls */}
                      <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                        {/* title and actions */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', md: 'center' },
                          flexWrap: 'wrap',
                          gap: 1.5,
                        }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                              <Typography sx={{
                                fontFamily: T.font.family,
                                fontWeight: 800,
                                fontSize: { xs: 16, md: 19 },
                                color: '#16324f',
                                letterSpacing: '-0.3px'
                              }}>
                                Patron Review Submissions Table
                              </Typography>
                              {filterCategory && (() => {
                                const catToken = T.category[filterCategory] || T.category['Other/Uncategorized'];
                                return (
                                  <Chip
                                    label={`Category: ${filterCategory}`}
                                    onDelete={() => {
                                      setFilterCategory('');
                                      setPage(0);
                                    }}
                                    size="small"
                                    sx={{
                                      fontFamily: T.font.family,
                                      fontWeight: 700,
                                      fontSize: 11.5,
                                      bgcolor: catToken.light,
                                      color: catToken.text,
                                      border: `1px solid ${catToken.border}`,
                                      borderRadius: '9999px',
                                    }}
                                  />
                                );
                              })()}
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
                              {tableSearchQuery && (
                                <Chip
                                  label={`Query: "${tableSearchQuery}"`}
                                  size="small"
                                  onDelete={() => { setTableSearchQuery(''); setPage(0); }}
                                  sx={{
                                    fontWeight: 700,
                                    fontFamily: T.font.family,
                                    fontSize: 11.5,
                                    height: 26,
                                    borderRadius: '9999px',
                                    bgcolor: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                  }}
                                />
                              )}
                            </Box>
                            <Typography sx={{ fontFamily: T.font.family, fontSize: 12.5, color: '#64748b', mt: 0.3 }}>
                              Audited survey responses, academic units, ratings, and sentiment classifications
                            </Typography>
                          </Box>

                          {/* search and export */}
                          <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                            {/* search input */}
                            <TextField
                              size="small"
                              placeholder="Search comments, course, or college..."
                              value={tableSearchQuery}
                              onChange={(e) => {
                                setTableSearchQuery(e.target.value);
                                setPage(0);
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                  </InputAdornment>
                                ),
                                endAdornment: tableSearchQuery ? (
                                  <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => { setTableSearchQuery(''); setPage(0); }} sx={{ p: 0.3 }}>
                                      <ClearIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                                    </IconButton>
                                  </InputAdornment>
                                ) : null,
                              }}
                              sx={{
                                minWidth: { xs: '100%', sm: 260, md: 300 },
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '10px',
                                  bgcolor: '#f8fafc',
                                  fontFamily: T.font.family,
                                  fontSize: 12.5,
                                  height: 36,
                                  '& fieldset': { borderColor: '#cbdbe9' },
                                  '&:hover fieldset': { borderColor: '#94a3b8' },
                                  '&.Mui-focused fieldset': { borderColor: '#16324f' }
                                }
                              }}
                            />

                            {/* export button */}
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleExportTableExcel}
                              startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontFamily: T.font.family,
                                fontWeight: 700,
                                fontSize: 12,
                                height: 36,
                                px: 1.8,
                                borderColor: '#b7ebc9',
                                bgcolor: '#eafaf1',
                                color: '#107c41',
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#d4f4e2', borderColor: '#107c41' }
                              }}
                            >
                              Export View (.xlsx)
                            </Button>

                            {selectedRowIds.length > 0 && (
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => openDeleteModal(null)}
                                startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontFamily: T.font.family,
                                  fontSize: 12,
                                  height: 36,
                                  px: 1.8,
                                  bgcolor: '#e11d48',
                                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)',
                                  whiteSpace: 'nowrap',
                                  '&:hover': { bgcolor: '#be123c' }
                                }}
                              >
                                Delete Selected ({selectedRowIds.length})
                              </Button>
                            )}
                          </Box>
                        </Box>

                        {/* month filter pills */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1,
                          pt: 1.2,
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              onClick={() => { setFilterMonth('All'); setPage(0); }}
                              sx={{
                                borderRadius: '9999px',
                                textTransform: 'none',
                                fontFamily: T.font.family,
                                fontWeight: 700,
                                fontSize: 12,
                                px: 1.6,
                                py: 0.35,
                                minWidth: 'auto',
                                height: 26,
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
                                  size="small"
                                  onClick={() => { setFilterMonth(isSelected ? 'All' : m); setPage(0); }}
                                  sx={{
                                    borderRadius: '9999px',
                                    textTransform: 'none',
                                    fontFamily: T.font.family,
                                    fontWeight: isSelected ? 700 : 600,
                                    fontSize: 12,
                                    px: 1.3,
                                    py: 0.35,
                                    minWidth: 'auto',
                                    height: 26,
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

                          <Typography sx={{ fontFamily: T.font.family, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                            Showing <strong>{reviewRows.length}</strong> matching review{reviewRows.length === 1 ? '' : 's'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* table grid */}
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
                            {/* section headers */}
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

                            {/* column headers */}
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
                                  College
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
                                    : getPSTDateString(new Date(row.DateSubmitted)))
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
                                      {row.Course && cleanCollegeName(row.Course) ? (
                                        <Tooltip title={`Program / Course: ${cleanCollegeName(row.Course)}`} arrow placement="top">
                                          <Typography component="span" sx={{
                                            fontFamily: T.font.family,
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#16324f',
                                            lineHeight: 1.35,
                                            cursor: 'default',
                                            display: 'inline-block',
                                          }}>
                                            {cleanCollegeName(row.College)}
                                          </Typography>
                                        </Tooltip>
                                      ) : (
                                        <Typography sx={{
                                          fontFamily: T.font.family,
                                          fontSize: 13,
                                          fontWeight: 700,
                                          color: '#16324f',
                                          lineHeight: 1.35,
                                        }}>
                                          {cleanCollegeName(row.College)}
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
                                    <TableCell align="center" sx={{ py: 0.8, px: 1, borderBottom: '1px solid #edf2f7' }}>
                                      <Tooltip title="Delete survey record" arrow placement="top">
                                        <IconButton
                                          size="small"
                                          onClick={() => openDeleteModal(row)}
                                          sx={{
                                            color: '#f87171',
                                            p: 0.75,
                                            borderRadius: '8px',
                                            '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' }
                                          }}
                                        >
                                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* pagination */}
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

            {/* delete dialog */}
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

            {/* feedback toasts */}
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
                Generated via Naïve Bayes Classification System on {new Date().toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })} — Central Philippine University
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