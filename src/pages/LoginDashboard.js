import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { COLLEGE_OPTIONS, SECTION_OPTIONS, getCollegeGroup, formatDate } from '../constants/collegeMap';

const CHART_COLORS = ['#1b5e20', '#0288d1', '#7b1fa2', '#ed6c02', '#c62828', '#00796b', '#303f9f', '#5d4037', '#e65100'];

const selectSx = {
  backgroundColor: 'white',
  borderRadius: 1,
  minWidth: 160,
  '& .MuiInputBase-root': { height: 40 },
};

const SummaryCard = ({ title, value, subtitle, color = '#1a237e', bgGradient = 'linear-gradient(135deg, #e8eaf6 0%, #ffffff 100%)' }) => {
  return (
    <Card elevation={0} sx={{
      border: `1.5px solid ${color}`, borderRadius: 3,
      background: bgGradient,
      flex: 1, minWidth: 180,
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 30, color: color, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#333', mt: 0.8 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', mt: 0.4 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ROWS_PER_PAGE = 10;

const LoginDashboard = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [page, setPage] = useState(0);

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

      let data = response.data;
      if (selectedCollege && selectedCollege !== 'All') {
        data = data.filter(
          (item) => getCollegeGroup(item.studCollege, item.studCourse) === selectedCollege
        );
      }
      if (selectedSection && selectedSection !== 'All') {
        data = data.filter((item) => item.Section === selectedSection);
      }

      setLogins(data);
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
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/logins');
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

  // ── Computations for KPI Cards & Visual Charts ───────────────────────
  const totalEntries = logins.length;

  // College distribution
  const collegeCounts = {};
  logins.forEach((item) => {
    const col = getCollegeGroup(item.studCollege, item.studCourse);
    collegeCounts[col] = (collegeCounts[col] || 0) + 1;
  });

  const collegeChartData = Object.keys(collegeCounts)
    .map(col => ({ name: col, entries: collegeCounts[col] }))
    .sort((a, b) => b.entries - a.entries);

  const topCollege = collegeChartData.length > 0 ? collegeChartData[0].name : 'N/A';
  const topCollegeCount = collegeChartData.length > 0 ? collegeChartData[0].entries : 0;

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

  // Pagination
  const totalPages = Math.ceil(logins.length / ROWS_PER_PAGE);
  const pageRows = logins.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

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
              <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
                {/* Header Logout & User status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 500, color: '#555' }}>
                    Authenticated as Admin: <strong style={{ color: '#1a237e' }}>{loggedInUser}</strong>
                  </Typography>
                  <Button variant="outlined" size="small" color="error" onClick={handleLogout}>
                    Logout
                  </Button>
                </Box>

                {/* ── Filters Bar ─────────────────────────────────────────── */}
                <Paper elevation={1} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
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
                          <MenuItem key={c} value={c}>{c}</MenuItem>
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
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button variant="contained" onClick={fetchLogins} sx={{ bgcolor: '#1a237e', px: 3, height: 40 }}>
                      Apply Filters
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={handleClearFilters} sx={{ height: 40 }}>
                      Clear
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={handlePrint} sx={{ height: 40 }}>
                      🖨️ Print / Save PDF
                    </Button>
                    <Button variant="outlined" color="success" onClick={handleExportExcel} sx={{ height: 40 }}>
                      📥 Export to Excel
                    </Button>
                  </Box>
                </Paper>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <>
                    {/* ── Summary KPI Cards ────────────────────────────────────── */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      <SummaryCard
                        title="Total Library Visits"
                        value={totalEntries}
                        subtitle={selectedCollege !== 'All' ? `Filtered by ${selectedCollege}` : 'All departments included'}
                        color="#1a237e"
                        bgGradient="linear-gradient(135deg, #e8eaf6 0%, #ffffff 100%)"
                      />
                      <SummaryCard
                        title="Top Visiting College"
                        value={topCollege}
                        subtitle={`${topCollegeCount} Total Entrance Entries`}
                        color="#2e7d32"
                        bgGradient="linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)"
                      />
                      <SummaryCard
                        title="Peak Library Section"
                        value={peakSection}
                        subtitle="Highest Traffic Location"
                        color="#ed6c02"
                        bgGradient="linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)"
                      />
                      <SummaryCard
                        title="Active Departments"
                        value={collegeChartData.length}
                        subtitle="Different Colleges Tracked"
                        color="#0288d1"
                        bgGradient="linear-gradient(135deg, #e1f5fe 0%, #ffffff 100%)"
                      />
                    </Box>

                    {/* ── Charts Section ───────────────────────────────────────── */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                      {/* College / Department Entries Bar Chart */}
                      <Paper elevation={1} sx={{ p: 3, borderRadius: 3, flex: 2, minWidth: 320 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 16, mb: 2, color: '#1a237e' }}>
                          Library Visits by College / Department
                        </Typography>
                        {collegeChartData.length === 0 ? (
                          <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>No log entries match your selected criteria.</Typography>
                        ) : (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={collegeChartData.slice(0, 10)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="entries" fill="#1a237e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Paper>

                      {/* Section Distribution Pie Chart */}
                      <Paper elevation={1} sx={{ p: 3, borderRadius: 3, flex: 1, minWidth: 280 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 16, mb: 2, color: '#ed6c02' }}>
                          Traffic by Library Section
                        </Typography>
                        {sectionChartData.length === 0 ? (
                          <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>No section data available.</Typography>
                        ) : (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={sectionChartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              >
                                {sectionChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </Paper>
                    </Box>

                    {/* ── Filtered Visitor Logs Table ───────────────────────────── */}
                    <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 16, mb: 2, color: '#333' }}>
                        📋 Detailed Visitor Entry Records ({logins.length} Total Matches)
                      </Typography>

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#1a237e' }}>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID Number</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Course & Year</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>College / Dept</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Section</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Time Logged</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Gender</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pageRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                  No entrance login records found matching your filters.
                                </TableCell>
                              </TableRow>
                            ) : (
                              pageRows.map((row, i) => (
                                <TableRow key={row.LogID || i} hover>
                                  <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>{row.studIDnumber || 'N/A'}</TableCell>
                                  <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500 }}>
                                    {`${row.studLname || ''}, ${row.studFname || ''}`}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>
                                    {`${row.studCourse || 'N/A'} - ${row.studYear || ''}`}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: '#1a237e' }}>
                                    {row.studCollege || 'N/A'}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>{row.Section || 'N/A'}</TableCell>
                                  <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>{formatDate(row.TimeLogged)}</TableCell>
                                  <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>{row.studGender || ''}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography sx={{ fontSize: 13, color: '#666' }}>
                            Showing Page {page + 1} of {totalPages}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={page === 0}
                              onClick={() => setPage(p => p - 1)}
                            >
                              Previous
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={page >= totalPages - 1}
                              onClick={() => setPage(p => p + 1)}
                            >
                              Next
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Paper>

                    {/* Hidden Container for Printing */}
                    <div ref={printRef} style={{ display: 'none' }}>
                      <h1>Henry Luce III Library</h1>
                      <h2>Official Library Entry Analytics Report</h2>
                      <p className="daterange">
                        {startDate && endDate ? `Date Range: ${startDate} to ${endDate}` : 'All Logged Dates'}
                        {selectedCollege !== 'All' ? ` | College Filter: ${selectedCollege}` : ' | All Colleges'}
                        {selectedSection !== 'All' ? ` | Section Filter: ${selectedSection}` : ''}
                      </p>

                      <div className="summary">
                        <div className="summary-box">
                          <div className="value">{totalEntries}</div>
                          <div className="label">Total Library Visits</div>
                        </div>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>ID Number</th>
                            <th>Full Name</th>
                            <th>Course & Year</th>
                            <th>College/Dept</th>
                            <th>Section</th>
                            <th>Time Logged</th>
                            <th>Gender</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logins.map((row, i) => (
                            <tr key={i}>
                              <td>{row.studIDnumber}</td>
                              <td>{`${row.studLname || ''}, ${row.studFname || ''}`}</td>
                              <td>{`${row.studCourse || ''} ${row.studYear || ''}`}</td>
                              <td>{getCollegeGroup(row.studCollege, row.studCourse)}</td>
                              <td>{row.Section}</td>
                              <td>{formatDate(row.TimeLogged)}</td>
                              <td>{row.studGender}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="footer">
                        Generated on {new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} — Henry Luce III Library System (Admin Entry Analytics)
                      </div>
                    </div>
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Header>

      {/* 👇 Login Popup (identical styling to Sentiment Dashboard) */}
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
