import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as XLSX from 'xlsx';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { COLLEGE_OPTIONS, SECTION_OPTIONS, getCollegeGroup, formatDate } from '../constants/collegeMap';

const LoginData = () => {
  const [logins, setLogins] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedCollege, setSelectedCollege] = useState('All');
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
      if (selectedCollege && selectedCollege !== 'All') {
        params.college = selectedCollege;
      }

      const response = await axios.get('http://localhost:5000/api/logins', { params });

      let formatted = response.data.map((row, index) => ({
        id: index + 1,
        ...row,
        displayCollege: getCollegeGroup(row.studCollege, row.studCourse),
      }));

      if (selectedCollege && selectedCollege !== 'All') {
        formatted = formatted.filter((row) => row.displayCollege === selectedCollege);
      }
      if (selectedSection && selectedSection !== 'All') {
        formatted = formatted.filter((row) => row.Section === selectedSection);
      }

      setLogins(formatted);
    } catch (error) {
      console.error('Error fetching logins:', error);
    }
  };

  const handleClear = async () => {
    setStartDate('');
    setEndDate('');
    setSelectedCollege('All');
    setSelectedSection('All');
    try {
      const response = await axios.get('http://localhost:5000/api/logins');
      const formatted = response.data.map((row, index) => ({
        id: index + 1,
        ...row,
        displayCollege: getCollegeGroup(row.studCollege, row.studCourse),
      }));
      setLogins(formatted);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportExcel = () => {
    if (logins.length === 0) {
      alert('No data available to export for the selected filter.');
      return;
    }

    const excelData = logins.map((row) => ({
      'ID Number': row.studIDnumber || 'N/A',
      'Last Name': row.studLname || '',
      'First Name': row.studFname || '',
      'Course': row.studCourse || 'N/A',
      'Year': row.studYear || 'N/A',
      'College/Department': row.displayCollege || getCollegeGroup(row.studCollege, row.studCourse),
      'Section': row.Section || 'N/A',
      'Time Logged': formatDate(row.TimeLogged),
      'Log Type': row.studLogType || '',
      'Gender': row.studGender || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Login Records');

    const objectMaxWidth = [];
    excelData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const value = row[key] ? row[key].toString() : '';
        if (!objectMaxWidth[key] || value.length > objectMaxWidth[key]) {
          objectMaxWidth[key] = Math.max(value.length, key.length);
        }
      });
    });
    worksheet['!cols'] = Object.keys(objectMaxWidth).map((key) => ({
      wch: objectMaxWidth[key] + 3,
    }));

    const collegeName = selectedCollege !== 'All' ? `_${selectedCollege}` : '';
    const sectionName = selectedSection !== 'All' ? `_${selectedSection}` : '';
    const dateStamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `HLL_Logins${collegeName}${sectionName}_${dateStamp}.xlsx`);
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
    {
      field: 'displayCollege',
      headerName: 'College/Department',
      flex: 1,
      renderCell: (params) => params.row?.displayCollege || getCollegeGroup(params.row?.studCollege, params.row?.studCourse),
    },
    { field: 'Section', headerName: 'Section', flex: 1 },
    {
      field: 'TimeLogged',
      headerName: 'Time Logged',
      flex: 1.5,
      renderCell: (params) => (params.value ? formatDate(params.value) : ''),
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
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>College/Department</InputLabel>
                <Select
                  value={selectedCollege}
                  label="College/Department"
                  onChange={(e) => setSelectedCollege(e.target.value)}
                >
                  {COLLEGE_OPTIONS.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Section"
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  {SECTION_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={fetchLogins}>
                Apply Filter
              </Button>
              <Button variant="outlined" color="inherit" onClick={handleClear}>
                Clear
              </Button>
              <Button variant="outlined" color="secondary" onClick={handlePrint}>
                🖨️ Print / Save as PDF
              </Button>
              <Button variant="outlined" color="success" onClick={handleExportExcel}>
                📥 Export to Excel
              </Button>
            </Box>

            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={logins}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50]}
                disableColumnFilter={false}
                disableColumnMenu={false}
                getRowId={(row) => row.LogID}
                initialState={{ filter: { filterModel: { items: [] } } }}
              />
            </Box>
          </Box>

          <div ref={printRef} style={{ display: 'none' }}>
            <h1>Henry Luce III Library</h1>
            <h2>Library Login Records Report</h2>
            <p className="daterange">
              {startDate && endDate ? `Date Range: ${startDate} to ${endDate}` : 'All Records'}
              {selectedCollege !== 'All' ? ` | College: ${selectedCollege}` : ''}
              {selectedSection !== 'All' ? ` | Section: ${selectedSection}` : ''}
            </p>

            <div className="summary">
              <div className="summary-box">
                <div className="value">{logins.length}</div>
                <div className="label">Total Visits</div>
              </div>
            </div>

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
                    <td>{row.displayCollege}</td>
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