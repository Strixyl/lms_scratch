import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, TextField } from '@mui/material';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const SatisfactionSurveyData = () => {
  const [surveys, setSurveys] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/surveys', {
        params: { startDate, endDate }
      });

      const formatted = response.data.map((row, index) => ({
        id: row.Id || index + 1,   // ✅ Prefer SQL Id
        ...row,
      }));

      console.log("API Response:", response.data);
      console.log("Formatted Surveys:", formatted);

      setSurveys(formatted);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  useEffect(() => {
    fetchSurveys(); // Load initial data
  }, []);

  const columns = [
    { field: 'Clientele', headerName: 'Clientele', width: 150 },
    { field: 'College', headerName: 'College', width: 180 },
    { field: 'Course', headerName: 'Course', width: 180 },
    { field: 'Message', headerName: 'Message', width: 250 },
    { field: 'Question1', headerName: 'Q1', width: 100 },
    { field: 'Question2', headerName: 'Q2', width: 100 },
    { field: 'Question3', headerName: 'Q3', width: 100 },
    { field: 'Question4', headerName: 'Q4', width: 100 },
    { field: 'Question5', headerName: 'Q5', width: 100 },
    { field: 'Question6', headerName: 'Q6', width: 100 },
    { field: 'Question7', headerName: 'Q7', width: 100 },
    { field: 'Question8', headerName: 'Q8', width: 100 },
    { field: 'Question9', headerName: 'Q9', width: 100 },
    { field: 'Question10', headerName: 'Q10', width: 100 },
    {
      field: 'DateSubmitted',
      headerName: 'Date Submitted',
      flex: 1.5,
      renderCell: (params) => {
        if (!params.value) return '';

        // ✅ params.value is already "yyyy-MM-dd HH:mm:ss" in PH time
        return new Date(params.value.replace(' ', 'T')).toLocaleString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
      },
    }
  ];

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Survey Data" onMenuClick={toggleDrawer} subtitle="SATISFACTION SURVEY RECORDS" />
          
          <Box sx={{ p: 3 }}>

        <Box sx={{ height: 600, width: '100%' }}>
        {/* Filter Controls */}
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
            <Button
            variant="contained"
            onClick={fetchSurveys}
            >
            Apply Filter
            </Button>
        </Box>

        {/* DataGrid */}
        <DataGrid
            rows={surveys}
            columns={columns}
            getRowId={(row) => row.Id || row.id}
            pageSize={10}
            rowsPerPageOptions={[10, 20, 50]}
            />
        </Box>
      </Box>
        </>
      )}
    </Header>
  );
};

export default SatisfactionSurveyData;
