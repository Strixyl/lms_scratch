import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

// ── Sentiment helpers ────────────────────────────────────────────────
const SENTIMENT_COLORS = {
  Positive: { bg: '#1b5e20', light: '#e8f5e9', text: '#1b5e20', dot: '#2e7d32' },
  Neutral:  { bg: '#e65100', light: '#fff3e0', text: '#e65100', dot: '#f57c00' },
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
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterClientele, setFilterClientele] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [page, setPage] = useState(0);

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

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setFilterClientele('');
    setFilterCollege('');
    setFilterSentiment('');
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
    { name: 'Neutral',  value: counts.Neutral },
    { name: 'Negative', value: counts.Negative },
  ].filter(d => d.value > 0);

  const reviewRows = filtered.filter(s => s.Message && s.Message.trim().length > 0);
  const totalPages = Math.ceil(reviewRows.length / ROWS_PER_PAGE);
  const pageRows = reviewRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const hasActiveFilter = startDate || endDate || filterClientele || filterCollege || filterSentiment;

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar
            title="Sentiment Dashboard"
            onMenuClick={toggleDrawer}
            subtitle="PATRON SATISFACTION — SENTIMENT ANALYSIS"
          />

          <Box sx={{ p: 3, backgroundColor: '#f5f6fa', minHeight: '100vh' }}>

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

              <Button variant="contained" onClick={fetchSurveys}
                sx={{ backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 3 }}>
                Apply Filter
              </Button>

              {hasActiveFilter && (
                <Button variant="outlined" size="small" onClick={handleClear}
                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>
                  Clear
                </Button>
              )}
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
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '30%' }}>
                                  Clientele
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '15%' }}>
                                  College
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase', width: '40%' }}>
                                  Response
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
                                  Sentiment
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pageRows.map((row, idx) => (
                                <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#fafafa' }, borderBottom: '1px solid #f5f5f5' }}>
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
                              ← Prev
                            </Button>
                            <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                              sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', color: '#1b0892' }}>
                              Next →
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
        </>
      )}
    </Header>
  );
};

export default SentimentDashboard;