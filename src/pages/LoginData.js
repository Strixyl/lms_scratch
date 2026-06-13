import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, TextField, Button, Grid, Table, TableHead, TableRow, TableCell, TableBody, Paper, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const sections = [
  'All', 'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
];

const LoginData = () => {
  const [logins, setLogins] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const printRef = useRef();

  const fetchLogins = async () => {
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (selectedSection && selectedSection !== 'All') {
        params.section = selectedSection;
      }

      const response = await axios.get('http://localhost:5000/api/logins', { params });

      const formatted = response.data.map((row, index) => ({
        id: index + 1,
        ...row,
      }));

      setLogins(formatted);
    } catch (error) {
      console.error('Error fetching logins:', error);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, []);

  const totalVisits = logins.length;
  const totalTimeIn = logins.filter((login) => login.studLogType === 'Time In').length;
  const totalTimeOut = logins.filter((login) => login.studLogType === 'Time Out').length;
  const uniqueStudents = new Set(logins.map((login) => login.studIDnumber)).size;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [datePart, timePart] = String(dateStr).split(' ');
    if (!datePart || !timePart) return dateStr;
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    const d = new Date(year, month - 1, day, hour, minute, second);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
      hour12: true,
    });
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
          <title>Library Login Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #000; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
            h2 { text-align: center; font-size: 15px; font-weight: normal; margin-bottom: 4px; color: #444; }
            p.daterange { text-align: center; font-size: 13px; color: #666; margin-bottom: 20px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 24px; }
            .summary-box { border: 1px solid #ccc; border-radius: 8px; padding: 12px 24px; text-align: center; }
            .summary-box .value { font-size: 28px; font-weight: bold; color: #1a237e; }
            .summary-box .label { font-size: 12px; color: #555; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #1a237e; color: white; padding: 8px; text-align: left; }
            td { padding: 6px 8px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #999; }
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

  const columns = [
    { field: 'studIDnumber', headerName: 'ID Number', flex: 1 },
    { field: 'studLname', headerName: 'Last Name', flex: 1 },
    { field: 'studFname', headerName: 'First Name', flex: 1 },
    { field: 'studCourse', headerName: 'Course', flex: 1 },
    { field: 'studYear', headerName: 'Year', flex: 1 },
    { field: 'studCollege', headerName: 'College/Department', flex: 1 },
    { field: 'Section', headerName: 'Section', flex: 1 },
    {
      field: 'TimeLogged',
      headerName: 'Time Logged',
      flex: 1.5,
      renderCell: (params) => {
        if (!params.value) return '';
        return formatDate(params.value);
      },
    },
    { field: 'studLogType', headerName: 'Log Type', flex: 1 },
    { field: 'studGender', headerName: 'Gender', flex: 1 },
  ];

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Login Data" onMenuClick={toggleDrawer} subtitle="LIBRARY LOGIN RECORDS" />

          <Box sx={{ p: 3 }}>
            {/* Date Filter + Section Filter + Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {/* ✅ Section Filter */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Section"
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  {sections.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={fetchLogins}>
                Apply Filter
              </Button>
              <Button variant="outlined" color="secondary" onClick={handlePrint}>
                🖨️ Print / Save as PDF
              </Button>
            </Box>

            {/* DataGrid */}
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={logins}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50]}
                disableColumnFilter={false}
                disableColumnMenu={false}
                getRowId={(row) => row.LogID}
                initialState={{
                  filter: {
                    filterModel: { items: [] },
                  },
                }}
              />
            </Box>
          </Box>

          {/* Hidden Printable Report */}
          <div ref={printRef} style={{ display: 'none' }}>
            <h1>Henry Luce III Library</h1>
            <h2>Library Login Records Report</h2>
            <p className="daterange">
              {startDate && endDate
                ? `Date Range: ${startDate} to ${endDate}`
                : 'All Records'}
              {selectedSection !== 'All' ? ` | Section: ${selectedSection}` : ''}
            </p>

            {/* Summary Boxes */}
            <div className="summary">
              <div className="summary-box">
                <div className="value">{totalVisits}</div>
                <div className="label">Total Visits</div>
              </div>
              <div className="summary-box">
                <div className="value">{uniqueStudents}</div>
                <div className="label">Unique Students</div>
              </div>
              <div className="summary-box">
                <div className="value">{totalTimeIn}</div>
                <div className="label">Time Ins</div>
              </div>
              <div className="summary-box">
                <div className="value">{totalTimeOut}</div>
                <div className="label">Time Outs</div>
              </div>
            </div>

            {/* Records Table */}
            <table>
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>College/Dept</th>
                  <th>Section</th>
                  <th>Time Logged</th>
                  <th>Log Type</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                {logins.map((row, i) => (
                  <tr key={i}>
                    <td>{row.studIDnumber}</td>
                    <td>{row.studLname}</td>
                    <td>{row.studFname}</td>
                    <td>{row.studCourse}</td>
                    <td>{row.studYear}</td>
                    <td>{row.studCollege}</td>
                    <td>{row.Section}</td>
                    <td>{formatDate(row.TimeLogged)}</td>
                    <td>{row.studLogType}</td>
                    <td>{row.studGender}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="footer">
              Generated on {new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} — Henry Luce III Library System
            </div>
          </div>
        </>
      )}
    </Header>
  );
};

export default LoginData;