import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, LinearProgress, Checkbox, IconButton, Snackbar, Alert, Tooltip
} from '@mui/material';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { COLLEGE_OPTIONS, SECTION_OPTIONS, getCollegeGroup, formatDate } from '../constants/collegeMap';

const CHART_COLORS = ['#1b5e20', '#0288d1', '#7b1fa2', '#ed6c02', '#c62828', '#00796b', '#303f9f', '#5d4037', '#e65100'];

const ALL_COLLEGES = COLLEGE_OPTIONS.filter(c => c !== 'All');

const COURSE_COLORS = [
  '#0288d1', '#2e7d32', '#ed6c02', '#7b1fa2', '#c62828',
  '#00796b', '#303f9f', '#e65100', '#00897b', '#5c6bc0',
  '#26a69a', '#ff7043', '#ab47bc', '#42a5f5', '#66bb6a',
  '#ffa726', '#8d6e63', '#ec407a', '#78909c', '#0097a7'
];

const selectSx = {
  backgroundColor: '#ffffff',
  borderRadius: 2.5,
  minWidth: 175,
  '& .MuiInputBase-root': {
    height: 46,
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    color: '#0f172a',
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    color: '#334155',
    '&.Mui-focused': {
      color: '#1a237e',
      fontWeight: 800,
    }
  },
  '& .MuiSelect-select': {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: 15,
  }
};

// ── Summary KPI Card (Styled matching reference dashboard design) ───────
const SummaryCard = ({ title, value, subtitle, icon, color = '#1a237e' }) => {
  return (
    <Card elevation={0} sx={{
      borderRadius: 3.5,
      backgroundColor: '#ffffff',
      border: '1.5px solid #e2e8f0',
      flex: 1, minWidth: 180,
      p: 2.5,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 50, height: 50, fontSize: 24 }}>
          {icon}
        </Avatar>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.6, fontSize: 11 }}>METRIC</Typography>
      </Box>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 34, color: '#0f172a', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#334155', mt: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, color: '#64748b', mt: 0.5, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

// ── Dynamic Custom Tooltip for Stacked Bar Chart ──────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const activeItems = payload.filter(p => p.value > 0);
    const total = activeItems.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <Paper elevation={4} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 2, maxWidth: 320 }}>
        <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#1a237e', mb: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>
          {label} — {total} Total Visit{total > 1 ? 's' : ''}
        </Typography>
        {activeItems.length === 0 ? (
          <Typography variant="body2" sx={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
            No visits recorded for this department.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, maxHeight: 220, overflowY: 'auto' }}>
            {activeItems.map((item, idx) => {
              const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.fill }} />
                    <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 500 }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600, color: '#444', ml: 2 }}>
                    {item.value} ({percent}%)
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
    );
  }
  return null;
};

const ROWS_PER_PAGE = 10;

const COURSE_ACRONYMS_MAP = {
  'Civil Engineering': ['bsce', 'civil'],
  'Chemical Engineering': ['bsche', 'chemical'],
  'Electrical Engineering': ['bsee', 'electrical'],
  'Electronics Engineering': ['bsece', 'electronics'],
  'Mechanical Engineering': ['bsme', 'mechanical'],
  'Packaging Engineering': ['bspkge', 'packaging'],
  'Software Engineering': ['bsse', 'software engineering'],
  'Diploma in Packaging Technology': ['diploma in packaging'],
  'Computer Science': ['bscs', 'computer science'],
  'Information Technology': ['bsit', 'information technology'],
  'Digital Media and Interactive Arts': ['bsdmia', 'digital media'],
  'Library and Information Science': ['blis', 'library'],
  'Accountancy': ['bsacty', 'accountancy'],
  'Management Accounting': ['management accounting'],
  'Business Administration major in Human Resource Management': ['bsbahrm', 'human resource'],
  'Business Administration major in Financial Management': ['bsba-fm', 'bscafm', 'financial management'],
  'Business Administration major in Marketing Management': ['bsbamm', 'marketing management'],
  'Entrepreneurship': ['bsent', 'entrepreneurship'],
  'Agriculture': ['bsa', 'agriculture'],
  'Agricultural and Biosystems Engineering': ['bsabe'],
  'Environmental Management': ['bsem'],
  'Nursing': ['bsn', 'nursing'],
  'Pharmacy': ['bsphar', 'pharmacy'],
  'Medical Laboratory Science': ['bsmls', 'medical laboratory'],
  'Juris Doctor': ['jd', 'juris doctor'],
  'Respiratory Therapy': ['bsrt', 'respiratory'],
  'Doctor of Medicine': ['md', 'doctor of medicine'],
  'Theology': ['bth', 'theology'],
};

const COLLEGE_COURSES_SURVEY_MAP = {
  CARES: ['Agriculture', 'Agricultural and Biosystems Engineering', 'Environmental Management'],
  CAS: ['English Language Studies', 'Biology with specialization in Medical Biology', 'Biology with specialization in Microbiology', 'Chemistry', 'Psychology', 'Social Work'],
  CBA: ['Accountancy', 'Management Accounting', 'Business Administration major in Human Resource Management', 'Business Administration major in Financial Management', 'Business Administration major in Marketing Management', 'Entrepreneurship'],
  CCS: ['Computer Science', 'Digital Media and Interactive Arts', 'Information Technology', 'Library and Information Science'],
  COED: ['Early Childhood Education', 'Elementary Education', 'Physical Education', 'Secondary Education major in English', 'Secondary Education major in Filipino', 'Secondary Education major in Mathematics', 'Secondary Education major in Science', 'Secondary Education major in Special Needs Education'],
  COE: ['Chemical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Mechanical Engineering', 'Packaging Engineering', 'Software Engineering', 'Diploma in Packaging Technology'],
  CHM: ['Hospitality Management', 'Tourism Management'],
  CMLS: ['Medical Laboratory Science'],
  CON: ['Nursing'],
  COP: ['Pharmacy'],
  COL: ['Juris Doctor'],
  COM: ['Respiratory Therapy', 'Doctor of Medicine'],
  COT: ['Theology', 'Certificate in Christian Ministry', 'Diploma in Christian Ministry'],
  SGS: ['Doctor of Education major in Curriculum and Instruction', 'Doctor of Education major in Educational Administration and Supervision', 'Doctor of Education major in Guidance and Counseling', 'Doctor of Management major in Business Management', 'Doctor of Management major in Public Management', 'Doctor of Management major in Development Management', 'Doctor of Management major in Tourism and Hospitality Management', 'Doctor of Ministry major in Pastoral Counseling & Pastoral Supervision', 'Doctor of Ministry major in Church Management and Practical Ministries', 'Master of Divinity', 'Master of Theology', 'Master of Ministry', 'Master of Arts in Pastoral Counseling', 'Master of Arts in Education major in Educational Administration and Supervision', 'Master of Arts in Education major in Guidance and Counseling', 'Master of Arts in Education major in Mathematics', 'Master of Arts in Education major in Filipino', 'Master of Arts in Education major in English Language and Literature', 'Master of Science in Agriculture', 'Master in Business Administration with Thesis', 'Master in Business Administration major in Tourism and Hospitality Management', 'Master of Arts in Nursing major in Nursing Service Administration', 'Master of Arts in Nursing major in Adult Health Nursing', 'Master of Arts in Nursing major in Women and Child Health Nursing', 'Master in Public Administration', 'Master of Science in Guidance and Counseling', 'Master of Science in Teaching Biology'],
  SHS: ['ABM', 'HUMSS', 'STEM'],
  JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  ELEM: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  KINDER: ['Kinder', 'Pre Kinder', 'Junior Kinder']
};

const LoginDashboard = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  const [rawLogins, setRawLogins] = useState([]);
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [page, setPage] = useState(0);
  const [hoveredCollege, setHoveredCollege] = useState(null);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const printRef = useRef();

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
      setLoginError('Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser('');
    setShowLoginModal(true);
    setUsername('');
    setPassword('');
  };

  const fetchLogins = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (selectedSection && selectedSection !== 'All') {
        params.section = selectedSection;
      }
      if (selectedCollege && selectedCollege !== 'All') {
        params.college = selectedCollege;
      }

      const response = await axios.get('http://localhost:5000/api/logins', { params });
      const data = response.data;
      setRawLogins(data);

      let filtered = data;
      if (selectedCollege && selectedCollege !== 'All') {
        filtered = filtered.filter(
          (item) => getCollegeGroup(item.studCollege, item.studCourse) === selectedCollege
        );
      }
      if (selectedSection && selectedSection !== 'All') {
        filtered = filtered.filter((item) => item.Section === selectedSection);
      }
      if (selectedCourse && selectedCourse !== 'All') {
        filtered = filtered.filter((item) => {
          if (!item.studCourse) return false;
          const c = item.studCourse.trim().toLowerCase();
          const target = selectedCourse.trim().toLowerCase();
          return c === target || c.includes(target) || target.includes(c);
        });
      }

      setLogins(filtered);
      setPage(0);
    } catch (err) {
      console.error('Error fetching login analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setStartDate('');
    setEndDate('');
    setSelectedCollege('All');
    setSelectedSection('All');
    setSelectedCourse('All');
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/logins');
      setRawLogins(response.data);
      setLogins(response.data);
      setPage(0);
    } catch (err) {
      console.error('Error clearing filters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dynamic Available Courses Options (Full Names Only) ─────────────────
  const availableCourses = useMemo(() => {
    if (!selectedCollege || selectedCollege === 'All') {
      return ['All'];
    }
    const surveyCourses = COLLEGE_COURSES_SURVEY_MAP[selectedCollege] || [];
    return ['All', ...[...surveyCourses].sort()];
  }, [selectedCollege]);

  useEffect(() => {
    if (selectedCollege === 'All') {
      setSelectedCourse('All');
    } else if (selectedCourse !== 'All' && !availableCourses.includes(selectedCourse)) {
      setSelectedCourse('All');
    }
  }, [selectedCollege, availableCourses, selectedCourse]);

  // ── Computations for KPI Cards & Visual Charts ───────────────────────
  const totalEntries = logins.length;

  // Stacked Bar Data: Always display all colleges constantly
  const { collegeChartData, activeCoursesInChart } = useMemo(() => {
    const collegeMap = {};
    ALL_COLLEGES.forEach(col => {
      collegeMap[col] = { total: 0 };
    });

    const coursesSet = new Set();

    logins.forEach((item) => {
      const col = getCollegeGroup(item.studCollege, item.studCourse);
      const crs = item.studCourse && item.studCourse.trim() ? item.studCourse.trim() : 'Unspecified';
      coursesSet.add(crs);

      if (!collegeMap[col]) {
        collegeMap[col] = { total: 0 };
      }
      collegeMap[col][crs] = (collegeMap[col][crs] || 0) + 1;
      collegeMap[col].total += 1;
    });

    const chartData = ALL_COLLEGES.map((col) => ({
      name: col,
      ...collegeMap[col],
    }));

    return {
      collegeChartData: chartData,
      activeCoursesInChart: Array.from(coursesSet),
    };
  }, [logins]);

  const sortedColleges = useMemo(() => {
    return [...collegeChartData].sort((a, b) => b.total - a.total);
  }, [collegeChartData]);

  const topCollege = sortedColleges.length > 0 && sortedColleges[0].total > 0 ? sortedColleges[0].name : 'N/A';
  const topCollegeCount = sortedColleges.length > 0 ? sortedColleges[0].total : 0;

  // Section distribution
  const sectionCounts = {};
  logins.forEach((item) => {
    const sec = item.Section ? item.Section.trim() : 'Entrance';
    sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
  });

  const sectionChartData = Object.keys(sectionCounts)
    .map(sec => ({ name: sec, value: sectionCounts[sec] }))
    .sort((a, b) => b.value - a.value);

  const peakSection = sectionChartData.length > 0 ? sectionChartData[0].name : 'N/A';

  // Gender Distribution for Sidebar Widget
  const genderCounts = useMemo(() => {
    const counts = { Male: 0, Female: 0, Other: 0 };
    logins.forEach(item => {
      const g = (item.studGender || '').toLowerCase();
      if (g.includes('m')) counts.Male += 1;
      else if (g.includes('f')) counts.Female += 1;
      else counts.Other += 1;
    });
    return counts;
  }, [logins]);

  // Pagination
  const totalPages = Math.ceil(logins.length / ROWS_PER_PAGE);
  const pageRows = logins.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // ── Record Selection & Delete Handlers ─────────────────────────────
  const pageIds = useMemo(() => pageRows.map(row => row.LogID).filter(Boolean), [pageRows]);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every(id => selectedLogIds.includes(id));
  const isSomePageSelected = pageIds.some(id => selectedLogIds.includes(id)) && !isAllPageSelected;

  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      setSelectedLogIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedLogIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleToggleSelectRow = (id) => {
    if (!id) return;
    setSelectedLogIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openDeleteSingleDialog = (row) => {
    setRecordToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const openDeleteBatchDialog = () => {
    setRecordToDelete(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (recordToDelete) {
        await axios.delete(`http://localhost:5000/api/logins/${recordToDelete.LogID}`);
        setSnackbarMsg('Login record deleted successfully.');
        setSelectedLogIds(prev => prev.filter(id => id !== recordToDelete.LogID));
      } else if (selectedLogIds.length > 0) {
        await axios.post('http://localhost:5000/api/logins/delete-batch', { ids: selectedLogIds });
        setSnackbarMsg(`${selectedLogIds.length} login records deleted successfully.`);
        setSelectedLogIds([]);
      }
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      fetchLogins();
    } catch (err) {
      console.error('Error deleting login record:', err);
      if (recordToDelete) {
        setLogins(prev => prev.filter(r => r.LogID !== recordToDelete.LogID));
        setRawLogins(prev => prev.filter(r => r.LogID !== recordToDelete.LogID));
        setSnackbarMsg('Record removed locally.');
      } else if (selectedLogIds.length > 0) {
        setLogins(prev => prev.filter(r => !selectedLogIds.includes(r.LogID)));
        setRawLogins(prev => prev.filter(r => !selectedLogIds.includes(r.LogID)));
        setSelectedLogIds([]);
        setSnackbarMsg('Selected records removed locally.');
      }
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Excel Export Handler ──────────────────────────────────────────────
  const handleExportExcel = () => {
    if (logins.length === 0) {
      alert('No entry data available to export for the selected criteria.');
      return;
    }

    const summaryKPIs = [
      { 'Analytics Metric': 'Total Filtered Library Visits', 'Count': totalEntries },
      { 'Analytics Metric': 'Top Visiting College / Dept', 'Count': `${topCollege} (${topCollegeCount} entries)` },
      { 'Analytics Metric': 'Peak Visited Library Section', 'Count': peakSection },
      { 'Analytics Metric': 'Date Range Filter Applied', 'Count': startDate && endDate ? `${startDate} to ${endDate}` : 'All Dates' },
      { 'Analytics Metric': 'College Filter Applied', 'Count': selectedCollege },
      { 'Analytics Metric': 'Course Filter Applied', 'Count': selectedCourse },
      { 'Analytics Metric': 'Section Filter Applied', 'Count': selectedSection }
    ];

    const detailedLogs = logins.map((row, idx) => ({
      'No.': idx + 1,
      'ID Number': row.studIDnumber || 'N/A',
      'Last Name': row.studLname || '',
      'First Name': row.studFname || '',
      'Course': row.studCourse || 'N/A',
      'Year': row.studYear || 'N/A',
      'College/Department': row.studCollege || 'N/A',
      'Library Section': row.Section || 'N/A',
      'Time Logged': formatDate(row.TimeLogged),
      'Log Type': row.studLogType || 'In',
      'Gender': row.studGender || ''
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryKPIs);
    const wsLogs = XLSX.utils.json_to_sheet(detailedLogs);

    const adjustWidths = (ws, data) => {
      const colWidths = [];
      data.forEach(row => {
        Object.keys(row).forEach((key, colIdx) => {
          const valStr = row[key] ? row[key].toString() : '';
          const maxLen = Math.max(valStr.length, key.length);
          if (!colWidths[colIdx] || maxLen > colWidths[colIdx]) {
            colWidths[colIdx] = maxLen;
          }
        });
      });
      ws['!cols'] = colWidths.map(w => ({ wch: w + 4 }));
    };

    adjustWidths(wsSummary, summaryKPIs);
    adjustWidths(wsLogs, detailedLogs);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Analytics Summary');
    XLSX.utils.book_append_sheet(workbook, wsLogs, 'Visitor Log Records');

    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `HLL_Entry_Analytics_${selectedCollege}_${dateStamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // ── Print Handler ────────────────────────────────────────────────────
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
          <title>Library Entry Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #000; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 4px; color: #1a237e; }
            h2 { text-align: center; font-size: 15px; font-weight: normal; margin-bottom: 6px; color: #444; }
            p.daterange { text-align: center; font-size: 13px; color: #666; margin-bottom: 20px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 24px; gap: 12px; }
            .summary-box { border: 1px solid #1a237e; border-radius: 8px; padding: 12px 20px; text-align: center; flex: 1; background-color: #f8f9fa; }
            .summary-box .value { font-size: 24px; font-weight: bold; color: #1a237e; }
            .summary-box .label { font-size: 11px; color: #555; margin-top: 4px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background-color: #1a237e; color: white; padding: 8px; text-align: left; }
            td { padding: 6px 8px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .footer { margin-top: 25px; text-align: center; font-size: 11px; color: #888; }
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
            <TopBar title="Entry Analytics Dashboard" onMenuClick={toggleDrawer} subtitle="DEPARTMENTAL & ENTRY VISITOR ANALYTICS" />

            {!showLoginModal && (
              <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                {/* ── Welcome Header Bar (Reflects modern dashboard banner) ───── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                      Welcome! <span style={{ color: '#1a237e' }}>{loggedInUser}</span> 👋
                    </Typography>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 15, color: '#475569', fontWeight: 500, mt: 0.5 }}>
                      Henry Luce III Library — Departmental Foot Traffic & Entry Intelligence
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handlePrint}
                      sx={{
                        borderRadius: 2.5,
                        height: 48,
                        px: 3.5,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 15,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 }
                      }}
                    >
                      🖨️ Print / Save PDF
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleExportExcel}
                      sx={{
                        borderRadius: 2.5,
                        height: 48,
                        px: 3.5,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 15,
                        fontWeight: 700,
                        textTransform: 'none',
                        bgcolor: '#1b5e20',
                        boxShadow: '0 4px 14px rgba(27, 94, 32, 0.3)',
                        '&:hover': { bgcolor: '#144617' }
                      }}
                    >
                      📥 Export to Excel
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleLogout}
                      sx={{
                        borderRadius: 2.5,
                        height: 48,
                        px: 3,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 14,
                        fontWeight: 700,
                        textTransform: 'none'
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                </Box>

                {/* ── Filter Controls Container (Bold & Larger Typography) ───── */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3.5, border: '1.5px solid #cbd5e1', bgcolor: '#ffffff' }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 17, color: '#1a237e', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🔍 Filter & Analytics Controls
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
                      <InputLabel>College/Dept</InputLabel>
                      <Select
                        value={selectedCollege}
                        label="College/Dept"
                        onChange={(e) => setSelectedCollege(e.target.value)}
                      >
                        {COLLEGE_OPTIONS.map((c) => (
                          <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx} disabled={selectedCollege === 'All'}>
                      <InputLabel>
                        {selectedCollege === 'All' ? 'Course (Select College)' : 'Course'}
                      </InputLabel>
                      <Select
                        value={selectedCourse}
                        label={selectedCollege === 'All' ? 'Course (Select College)' : 'Course'}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={selectedCollege === 'All'}
                      >
                        {availableCourses.map((crs) => (
                          <MenuItem key={crs} value={crs} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{crs}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Library Section</InputLabel>
                      <Select
                        value={selectedSection}
                        label="Library Section"
                        onChange={(e) => setSelectedSection(e.target.value)}
                      >
                        {SECTION_OPTIONS.map((s) => (
                          <MenuItem key={s} value={s} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button variant="contained" onClick={fetchLogins} sx={{ bgcolor: '#1a237e', px: 3.5, height: 46, borderRadius: 2.5, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15 }}>
                      Apply Filters
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={handleClearFilters} sx={{ height: 46, px: 3, borderRadius: 2.5, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, borderColor: '#cbd5e1' }}>
                      Reset
                    </Button>
                  </Box>
                </Paper>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <>
                    {/* ── Top Metric Cards Grid (Matching reference layout) ───── */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      <SummaryCard
                        title="Total Patron Visits"
                        value={totalEntries}
                        subtitle={selectedCollege !== 'All' ? `Filtered by ${selectedCollege}` : 'All departments included'}
                        icon="👥"
                        color="#1a237e"
                      />
                      <SummaryCard
                        title="Top Visiting College"
                        value={topCollege}
                        subtitle={`${topCollegeCount} Total Logged Entries`}
                        icon="🏛️"
                        color="#2e7d32"
                      />
                      <SummaryCard
                        title="Peak Library Section"
                        value={peakSection}
                        subtitle="Highest Foot Traffic Location"
                        icon="📍"
                        color="#ed6c02"
                      />
                      <SummaryCard
                        title="Active Departments"
                        value={collegeChartData.filter(c => c.total > 0).length}
                        subtitle="Colleges with Recorded Visits"
                        icon="🎓"
                        color="#0288d1"
                      />
                    </Box>

                    {/* ── Middle Visualizer Section (Layout matching reference image: Main Chart + Side Donut) ── */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                      {/* Left: Main Stacked Bar Chart (~70% width) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 3, minWidth: 480 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#1e293b' }}>
                              Visits by College & Course Breakdown
                            </Typography>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#94a3b8' }}>
                              Hover over any bar to inspect course breakdown
                            </Typography>
                          </Box>
                        </Box>
                        <ResponsiveContainer width="100%" height={360}>
                          <BarChart
                            data={collegeChartData}
                            maxBarSize={45}
                            onMouseMove={(state) => {
                              if (state && state.activeLabel) {
                                setHoveredCollege(state.activeLabel);
                              } else {
                                setHoveredCollege(null);
                              }
                            }}
                            onMouseLeave={() => setHoveredCollege(null)}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-30} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                            <RechartsTooltip content={<CustomBarTooltip />} />
                            {activeCoursesInChart.map((course, courseIndex) => (
                              <Bar
                                key={course}
                                dataKey={course}
                                stackId="a"
                                maxBarSize={45}
                              >
                                {collegeChartData.map((entry, index) => {
                                  const isHovered = hoveredCollege === entry.name;
                                  const fillColor = isHovered
                                    ? COURSE_COLORS[courseIndex % COURSE_COLORS.length]
                                    : '#1a237e';
                                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                                })}
                              </Bar>
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </Paper>

                      {/* Right: Section Donut Chart + Side Legends (~30% width matching reference card) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 1.4, minWidth: 280, display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, mb: 1, color: '#1e293b' }}>
                          Traffic by Library Section
                        </Typography>
                        {sectionChartData.length === 0 ? (
                          <Typography color="textSecondary" sx={{ py: 6, textAlign: 'center' }}>No section data available.</Typography>
                        ) : (
                          <>
                            <Box sx={{ position: 'relative', height: 220 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={sectionChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    dataKey="value"
                                    paddingAngle={3}
                                  >
                                    {sectionChartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                              {/* Center Donut Label */}
                              <Box sx={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)', textAlign: 'center'
                              }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: '#1e293b', lineHeight: 1 }}>
                                  {totalEntries}
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                                  Total Visits
                                </Typography>
                              </Box>
                            </Box>

                            {/* Custom Legend Pill List matching reference image */}
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 150, overflowY: 'auto' }}>
                              {sectionChartData.slice(0, 5).map((sec, idx) => {
                                const pct = totalEntries > 0 ? ((sec.value / totalEntries) * 100).toFixed(1) : 0;
                                return (
                                  <Box key={sec.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 500, color: '#334155' }}>
                                        {sec.name}
                                      </Typography>
                                    </Box>
                                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                                      {pct}% ({sec.value})
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          </>
                        )}
                      </Paper>
                    </Box>

                    {/* ── Bottom Section (Layout matching reference image: Table + Sidebar Breakdown) ────── */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {/* Left: Detailed Visitor Entry Records Table (~70% width) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 3, minWidth: 480 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#1e293b' }}>
                            Detailed Visitor Entry Records ({logins.length} Matches)
                          </Typography>
                          {selectedLogIds.length > 0 && (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={openDeleteBatchDialog}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}
                            >
                              🗑️ Delete Selected ({selectedLogIds.length})
                            </Button>
                          )}
                        </Box>

                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: '#1a237e' }}>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    size="small"
                                    checked={isAllPageSelected}
                                    indeterminate={isSomePageSelected}
                                    onChange={handleSelectAllOnPage}
                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' } }}
                                  />
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>ID Number</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Course & Year</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>College / Dept</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Section</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Time Logged</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Gender</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pageRows.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                    No entrance login records found matching your filters.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                pageRows.map((row, i) => {
                                  const isSelected = selectedLogIds.includes(row.LogID);
                                  return (
                                    <TableRow
                                      key={row.LogID || i}
                                      hover
                                      selected={isSelected}
                                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                      <TableCell padding="checkbox">
                                        <Checkbox
                                          size="small"
                                          checked={isSelected}
                                          onChange={() => handleToggleSelectRow(row.LogID)}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#334155' }}>{row.studIDnumber || 'N/A'}</TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                                        {`${row.studLname || ''}, ${row.studFname || ''}`}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#475569' }}>
                                        {`${row.studCourse || 'N/A'} - ${row.studYear || ''}`}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: '#1a237e' }}>
                                        {row.studCollege || 'N/A'}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#475569' }}>{row.Section || 'N/A'}</TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b' }}>{formatDate(row.TimeLogged)}</TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b' }}>{row.studGender || ''}</TableCell>
                                      <TableCell align="center">
                                        <Tooltip title="Delete Record">
                                          <IconButton size="small" color="error" onClick={() => openDeleteSingleDialog(row)}>
                                            🗑️
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

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5 }}>
                            <Typography sx={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                              Showing Page {page + 1} of {totalPages}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                sx={{ borderRadius: 1.5, textTransform: 'none' }}
                              >
                                Previous
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                sx={{ borderRadius: 1.5, textTransform: 'none' }}
                              >
                                Next
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Paper>

                      {/* Right: Demographic Breakdown Widget (~30% width matching reference image) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 1.4, minWidth: 280 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, mb: 2, color: '#1e293b' }}>
                          Top Departments & Gender Breakdown
                        </Typography>

                        {/* Top Colleges Progress List */}
                        <Box sx={{ mb: 3 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', mb: 1, textTransform: 'uppercase' }}>
                            Top Department Traffic
                          </Typography>
                          {sortedColleges.slice(0, 4).map((col) => {
                            const pct = totalEntries > 0 ? (col.total / totalEntries) * 100 : 0;
                            return (
                              <Box key={col.name} sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                                    {col.name}
                                  </Typography>
                                  <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                    {col.total} visits ({pct.toFixed(0)}%)
                                  </Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#1a237e', borderRadius: 3 } }} />
                              </Box>
                            );
                          })}
                        </Box>

                        {/* Gender Demographics List */}
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', mb: 1, textTransform: 'uppercase' }}>
                            Patron Gender Split
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#334155' }}> Male Visitors</Typography>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0288d1' }}>{genderCounts.Male}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#334155' }}> Female Visitors</Typography>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#7b1fa2' }}>{genderCounts.Female}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Header>

      {/* 🗑️ Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#c62828' }}>
          Confirm Record Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#334155' }}>
            {recordToDelete ? (
              <>Are you sure you want to delete the visitor entry for <strong>{recordToDelete.studLname}, {recordToDelete.studFname}</strong> (ID: {recordToDelete.studIDnumber || 'N/A'})?</>
            ) : (
              <>Are you sure you want to delete <strong>{selectedLogIds.length}</strong> selected login record(s)?</>
            )}
          </Typography>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#dc2626', mt: 1.5, fontWeight: 600 }}>
            ⚠️ This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Record(s)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Toast Feedback */}
      <Snackbar
        open={Boolean(snackbarMsg)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSnackbarMsg('')} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>

      {/* 👇 Admin Login Dialog */}
      {showLoginModal && (
        <Dialog open={true}>
          <DialogTitle>You need to login as an Admin to view this page</DialogTitle>
          <DialogContent>
            <form onSubmit={handleLogin}>
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
                type="submit"
                sx={{ mt: 2 }}
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
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default LoginDashboard;
