import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx'; // Import SheetJS
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

// ── Sentiment helpers ────────────────────────────────────────────────
const SENTIMENT_COLORS = {
  Positive: { bg: '#1b5e20', light: '#e8f5e9', text: '#1b5e20', dot: '#2e7d32' },
  Neutral: { bg: '#e65100', light: '#fff3e0', text: '#e65100', dot: '#f57c00' },
  Negative: { bg: '#b71c1c', light: '#ffebee', text: '#b71c1c', dot: '#c62828' },
};

const CHART_COLORS = ['#2e7d32', '#f57c00', '#c62828'];

const CLIENTELE_OPTIONS = ['Student', 'Faculty', 'Staff', 'Researcher', 'CPU Admin', 'Alumnus/Alumni'];

const COLLEGE_OPTIONS = [
  'CARES', 'CAS', 'CBA', 'CCS', 'COED', 'COE', 'CHM',
  'COL', 'CMLS', 'COM', 'CON', 'COP', 'COT', 'SGS',
  'SHS', 'JHS', 'ELEM', 'KINDER'
];

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
      setShowLoginModal(true);
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
    setSortOrder('latest');
    setTimeout(fetchSurveys, 0);
  };

  // ── Client-side filtering ────────────────────────────────────────
  const filtered = surveys.filter(s => {
    if (!s.SentimentResult) return false;
    if (filterClientele && s.Clientele?.toLowerCase() !== filterClientele.toLowerCase()) return false;
    if (filterCollege && s.College !== filterCollege) return false;
    if (filterSentiment && s.SentimentResult !== filterSentiment) return false;
    return true;
  });

  const counts = { Positive: 0, Neutral: 0, Negative: 0 };
  filtered.forEach(s => { if (counts[s.SentimentResult] !== undefined) counts[s.SentimentResult]++; });
  const total = filtered.length;

  const chartData = [
    { name: 'Positive', value: counts.Positive },
    { name: 'Neutral', value: counts.Neutral },
    { name: 'Negative', value: counts.Negative },
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

  const hasActiveFilter = startDate || endDate || filterClientele || filterCollege || filterSentiment;

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
    ];

    // Tab 2: Detailed Text Classifications
    const textDetails = reviewRows.map((row, index) => ({
      'No.': index + 1,
      'Clientele Group': row.Clientele || 'N/A',
      'College': row.College || 'N/A',
      'Text Response Inputted': row.Message || '',
      'Overall Sentiment': row.SentimentResult || '',
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
                {/* ── Donut Chart ── */}
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, mb: 3, backgroundColor: 'white' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#666', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                      Dataset Distribution
                    </Typography>
                    {total === 0 ? (
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999', textAlign: 'center', py: 4 }}>
                        No sentiment data available for the selected filters.
                      </Typography>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%"
                            innerRadius={70} outerRadius={110} paddingAngle={3}
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
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '25%' }}>
                                  Clientele
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '15%' }}>
                                  College
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '35%' }}>
                                  Response
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '15%' }}>
                                  Sentiment
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
                </tr>
              </thead>
              <tbody>
                {reviewRows.map((row) => (
                  <tr key={row.Id}>
                    <td style={{ textTransform: 'capitalize' }}>{row.Clientele}</td>
                    <td>{row.College}</td>
                    <td>{row.Message}</td>
                    <td><strong>{row.SentimentResult}</strong></td>
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

      {/* 👇 Login Popup */}
      <Dialog open={showLoginModal}>
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
    </>
  );
};

export default SentimentDashboard;