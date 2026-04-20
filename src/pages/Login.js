import React, { useState, useEffect, useRef } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, TextField, Typography, Divider, Grid, Paper, 
  Dialog, DialogTitle, DialogContent,DialogActions, 
  Button,MenuItem,Select,FormControl,InputLabel,
} from '@mui/material';
import axios from 'axios';
import loginpic from '../assets/login-pic.png';

const sections = [
  'Entrance',
  'Reference',
  'Circulation',
  'Theology',
  'Filipiniana',
  'Serials',
  'Law',
  'American Corner',
  'Graduate Studies',
  'Cyber Library',
  'Senior High School',
  'Junior High School',
  'Elementary',
  'Kindergarten',
];

const Login = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [sectionConfirmed, setSectionConfirmed] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    course: '', 
    year: '', 
    college: ''
    // Add other fields if needed
  });
  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} – ${d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })}`;
  };
  const timeoutRef = useRef(null);



  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirmSection = () => {
    if (selectedSection) {
      setSectionConfirmed(true);
    }
  };

  const handleIdInput = async (e) => {
  const input = e.target.value;
  setIdInput(input);

  // Reset timer if input is not 10 digits
  if (input.length !== 10) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIdInput('');
    }, 10000);
    return;
  }

  // Cancel reset timer once we reach 10 digits
  if (timeoutRef.current) clearTimeout(timeoutRef.current);

  try {
    const response = await axios.post('http://172.31.12.239:5000/api/student-lookup', {
      idNumber: input,
      section: selectedSection,
    });

    const student = response.data;

    if (student) {
      // Update student info
      setFormData({
        idNumber: student.studIDnumber,
        name: `${student.studLname}, ${student.studFname}`,
        course: student.studCourse,
        year: student.studYear,
        college: student.studCollege,
      });

      // Use backend's studLogType to decide what to show
      if (student.studLogType === 'Time In') {
        setTimeIn(new Date(student.timeLogged).toLocaleString());
        setTimeOut('');
      } else if (student.studLogType === 'Time Out') {
        setTimeOut(new Date(student.timeLogged).toLocaleString());
      }

      // Clear everything after 5 seconds
      setTimeout(() => {
        setFormData({ idNumber: '', name: '', course: '', year: '', college: '' });
        setTimeIn('');
        setTimeOut('');
      }, 5000);

      setTimeout(() => {
        setIdInput('');
      }, 1000);
    } else {
      alert('Student not found');
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
  }
};

    return (
        <Header>
          {(toggleDrawer) => (
            <>
             {/* Section Selector Dialog */}
              <Dialog open={!sectionConfirmed} disableEscapeKeyDown>
                <DialogTitle>Choose Section</DialogTitle>
                <DialogContent>
                  <FormControl fullWidth sx={{ mt: 1, minWidth: 300 }}>
                    <InputLabel>Section</InputLabel>
                    <Select
                      value={selectedSection}
                      label="Section"
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      {sections.map((section) => (
                        <MenuItem key={section} value={section}>
                          {section}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={handleConfirmSection}
                    variant="contained"
                    disabled={!selectedSection}
                  >
                    OK
                  </Button>
                </DialogActions>
              </Dialog>

            <Box sx={{ flex: '0 0 auto' }}>
                  <TopBar title="Sign In Portal" onMenuClick={toggleDrawer} subtitle="HENRY LUCE III LIBRARY SIGN IN PORTAL" />
            </Box>

             {sectionConfirmed && (
        <Box sx={{ minHeight: '70vh', bgcolor: '#fff', display: 'flex', flexDirection: 'column'}}>
          <Grid container spacing={2} sx={{
                  p: 2, // Padding around content
                  pb: 10,
                  pt: 5,
                  width: '100%',
                  margin: 0, // remove any outer margin
                }}>
            {/* Column 1: Photo + ID Input */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pl: 5, mb: 5 }}>
              <Box
                sx={{
                    width: 270,
                    height: 270,
                    border: '2px solid gray',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
              >
                <Typography align="center" variant="body2">
                  NO IMAGE<br />AVAILABLE
                </Typography>
              </Box>
              <TextField
                variant="outlined"
                placeholder="Scan or Enter ID"
                value={idInput}
                onChange={handleIdInput}
                sx={{
                    backgroundColor: '#fff',
                    input: {
                      textAlign: 'center',
                      height: '17px',
                      padding: '4px 8px',
                    },
                    width: 270,
                  }}
                InputProps={{ sx: { height: 37 } }}
              />
            </Grid>

            {/* Column 2: Labels + TextFields */}
          <Grid
            item
            xs={12}
            md={8}
            sx={{
              width: '80%',
              height: 310,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pl: 5
            }}
          >
          <Grid container spacing={2} alignItems="center">
            {/* Time In */}
            <Box sx={{ width: '40%'}}>
              <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} sx={{ pb: 5  }}textAlign={'left'}>Time In: {formatDateTime(timeIn)}</Typography></Grid>
            </Box>

            {/* Time Out */}
            <Box sx={{ width: '40%'}}>
              <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} sx={{ pb: 5  }} textAlign={'left'}>Time Out: {formatDateTime(timeOut)}</Typography></Grid>
            </Box>
            
            {/* Section */}
            <Box sx={{ width: '40%'}}>
              <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} sx={{ pb: 5  }} >Section: {selectedSection.toUpperCase()}</Typography></Grid>
            </Box>
            {/* Date & Time */}           
            <Box>
              <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} sx={{ pb: 5  }} >Date & Time: {currentTime.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} – {currentTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}</Typography></Grid>
            </Box>

            {/* Name */}
            <Box sx={{ width: '40%'}}>
              <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} sx={{ pb: 5 }}>Name: {formData.name}</Typography></Grid>
            </Box>               

            {/* ID Number */}
            <Box sx={{ width: '40%'}}>
              <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} sx={{ pb: 5 }}>ID Number: {formData.idNumber}</Typography></Grid>
            </Box>
                        
            {/* Course & Year */}
            <Box sx={{ width: '40%'}}>
              <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} >Course & Year: {formData.course} {formData.year}</Typography></Grid>
            </Box>
            
            {/* College/Department */}
            <Box sx={{ width: '40%'}}>
                <Grid item xs={4}><Typography fontWeight="bold" fontFamily={'Poppins, sans serif'} >College/Department: {formData.college}</Typography></Grid>
            </Box>            
          </Grid>
        </Grid>
      </Grid>

          {/* Footer */}
            <img src={loginpic} alt="Bahandian" style={{ width: '100%', height:'100%', objectFit: 'contain' }} />
        </Box>
      )}
            </>
          )}
        </Header>
      );
};
export default Login;
