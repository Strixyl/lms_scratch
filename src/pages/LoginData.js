import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, TextField, Button, Grid, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const LoginData = () => {
  const [logins, setLogins] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogins = async () => {
    try {
      const response = await axios.get('http://172.31.12.239:5000/api/logins', {
        params: { startDate, endDate }
      });

      // ✅ Fix date parsing
      const formatted = response.data.map((row, index) => ({
        id: index + 1, // DataGrid needs unique id
        ...row,
        TimeLogged: row.TimeLogged ? new Date(row.TimeLogged) : null,
      }));

      setLogins(formatted);
    } catch (error) {
      console.error('Error fetching logins:', error);
    }
  };

  useEffect(() => {
    fetchLogins(); // Load initial data
  }, []);

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
      const date = new Date(params.value);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila',
      });
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

      {/* Date Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
        <Button variant="contained" onClick={fetchLogins}>
          Apply Filter
        </Button>
      </Box>

      {/* DataGrid with Excel-like filter panel */}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={logins}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          disableColumnFilter={false}
          disableColumnMenu={false}
          getRowId={(row) => row.LogID}   // ✅ Use LogID as unique row id
          initialState={{
            filter: {
              filterModel: { items: [] },
            },
          }}
        />
        </Box>
      </Box>
        </>
      )}
    </Header>
  );
};

export default LoginData;
