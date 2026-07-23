import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const CLIENTELE_OPTIONS = [
  { label: 'Student', value: 'student' },
  { label: 'Faculty', value: 'faculty' },
  { label: 'Staff', value: 'staff' },
  { label: 'Researcher', value: 'researcher' },
  { label: 'CPU Admin', value: 'admin' },
  { label: 'Alumnus/Alumni', value: 'alumni' }
];

const COLLEGE_COURSES = {
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
  SGS: [
    'Doctor of Education major in Curriculum and Instruction',
    'Doctor of Education major in Educational Administration and Supervision',
    'Doctor of Education major in Guidance and Counseling',
    'Doctor of Management major in Business Management',
    'Doctor of Management major in Public Management',
    'Doctor of Management major in Development Management',
    'Doctor of Management major in Tourism and Hospitality Management',
    'Doctor of Ministry major in Pastoral Counseling & Pastoral Supervision',
    'Doctor of Ministry major in Church Management and Practical Ministries',
    'Master of Divinity',
    'Master of Theology',
    'Master of Ministry',
    'Master of Arts in Pastoral Counseling',
    'Master of Arts in Education major in Educational Administration and Supervision',
    'Master of Arts in Education major in Guidance and Counseling',
    'Master of Arts in Education major in Mathematics',
    'Master of Arts in Education major in Filipino',
    'Master of Arts in Education major in English Language and Literature',
    'Master of Science in Agriculture',
    'Master in Business Administration with Thesis',
    'Master in Business Administration major in Tourism and Hospitality Management',
    'Master of Arts in Nursing major in Nursing Service Administration',
    'Master of Arts in Nursing major in Adult Health Nursing',
    'Master of Arts in Nursing major in Women and Child Health Nursing',
    'Master in Public Administration',
    'Master of Science in Guidance and Counseling',
    'Master of Science in Teaching Biology'
  ],
  SHS: ['ABM', 'HUMSS', 'STEM'],
  JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  ELEM: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  KINDER: ['Kinder', 'Pre Kinder', 'Junior Kinder']
};

const SatisfactionSurveyData = () => {
  const [surveys, setSurveys] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientele, setClientele] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);

  useEffect(() => {
    // Populate default list of all courses across colleges
    const allCourses = Object.values(COLLEGE_COURSES).flat();
    setAvailableCourses(Array.from(new Set(allCourses)).sort());
  }, []);

  const handleCollegeChange = (e) => {
    const selectedCollege = e.target.value;
    setCollege(selectedCollege);
    setCourse(''); // Reset course when college changes

    if (selectedCollege && COLLEGE_COURSES[selectedCollege]) {
      setAvailableCourses(COLLEGE_COURSES[selectedCollege]);
    } else {
      const allCourses = Object.values(COLLEGE_COURSES).flat();
      setAvailableCourses(Array.from(new Set(allCourses)).sort());
    }
  };

  const fetchSurveys = async (overrideParams = {}) => {
    try {
      const params = {
        startDate,
        endDate,
        clientele,
        college,
        course,
        ...overrideParams
      };

      const response = await axios.get('http://localhost:5000/api/surveys', { params });

      const formatted = response.data.map((row, index) => ({
        id: row.Id || index + 1, // ✅ Prefer SQL Id
        ...row,
      }));

      setSurveys(formatted);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  useEffect(() => {
    fetchSurveys(); // Load initial data
  }, []);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setClientele('');
    setCollege('');
    setCourse('');
    const allCourses = Object.values(COLLEGE_COURSES).flat();
    setAvailableCourses(Array.from(new Set(allCourses)).sort());
    fetchSurveys({ startDate: '', endDate: '', clientele: '', college: '', course: '' });
  };

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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
                <TextField
                  type="date"
                  label="Start Date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  type="date"
                  label="End Date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{ minWidth: 150 }}
                />

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Clientele</InputLabel>
                  <Select
                    label="Clientele"
                    value={clientele}
                    onChange={(e) => setClientele(e.target.value)}
                  >
                    <MenuItem value=""><em>All Clientele</em></MenuItem>
                    {CLIENTELE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>College</InputLabel>
                  <Select
                    label="College"
                    value={college}
                    onChange={handleCollegeChange}
                  >
                    <MenuItem value=""><em>All Colleges</em></MenuItem>
                    {Object.keys(COLLEGE_COURSES).map((colKey) => (
                      <MenuItem key={colKey} value={colKey}>{colKey}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Course</InputLabel>
                  <Select
                    label="Course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    <MenuItem value=""><em>All Courses</em></MenuItem>
                    {availableCourses.map((crs, idx) => (
                      <MenuItem key={idx} value={crs}>{crs}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  onClick={() => fetchSurveys()}
                  sx={{ height: 40 }}
                >
                  Apply Filter
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{ height: 40 }}
                >
                  Reset
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
