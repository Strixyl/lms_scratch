import React, { useState } from "react";
import { useLocation } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import f929 from '../assets/1f929.png';
import f60d from '../assets/1f60d.png';
import f610 from '../assets/1f610.png';
import f620 from '../assets/1f620.png';
import f621 from '../assets/1f621.png';
import f274c from '../assets/274c.png';
import axios from 'axios';

const SatisfactionSurvey = () => {
  const location = useLocation();
  const isSatisfactionPage = location.pathname === '/satisfaction-survey';
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [animatingEmoji, setAnimatingEmoji] = useState(null);
  const [clientele, setClientele] = useState('');
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [sentimentResult, setSentimentResult] = useState(null);
  const [department, setDepartment] = useState('');

  const surveyQuestions = [
    "The efficiency of library service delivery meets your expectations.",
    "The clarity and usefulness of the library's guidelines and manual for users.",
    "The professionalism and helpfulness of librarians and library staff in assisting patrons.",
    "The effectiveness of communication regarding library updates and changes.",
    "The comfort and accessibility of the library's physical environment.",
    "The availability of resources and materials to support your academic needs.",
    "The timeliness and reliability of services provided by the library.",
    "The ease of navigating both physical and digital library resources.",
    "The overall organization and management of library services.",
    "Your general satisfaction with your experience at the library.",
  ];

  const [responses, setResponses] = useState(Array(10).fill(null));
  const [animating, setAnimating] = useState(Array(10).fill(null));

  const ratingOptions = [
    {
      id: 'very_satisfied',
      label: 'Very Satisfied',
      static: f929,
      animated: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif',
    },
    {
      id: 'satisfied',
      label: 'Satisfied',
      static: f60d,
      animated: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif',
    },
    {
      id: 'neutral',
      label: 'Neutral',
      static: f610,
      animated: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f610/512.gif',
    },
    {
      id: 'dissatisfied',
      label: 'Dissatisfied',
      static: f620,
      animated: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f620/512.gif',
    },
    {
      id: 'very_dissatisfied',
      label: 'Very Dissatisfied',
      static: f621,
      animated: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.gif',
    },
    {
      id: 'na',
      label: 'NA (No engagement with Library)',
      static: f274c,
      animated: 'https://fonts.gstatic.com/s/e/notoemoji/latest/274c/512.gif',
    },
  ];

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'Positive') return '#2e7d32';
    if (sentiment === 'Negative') return '#c62828';
    return '#f57c00';
  };

  const getSentimentEmoji = (sentiment) => {
    if (sentiment === 'Positive') return '😊';
    if (sentiment === 'Negative') return '😞';
    return '😐';
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');
    setSentimentResult(null);

    if (!clientele || !selectedCollege) {
      setSubmitError('Clientele, College and Satisfaction Ratings are required.');
      return;
    }
    const allRated = responses.every((response) => response !== null);
    if (!allRated) {
      setSubmitError('Please answer all 10 survey questions.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/survey', {
        clientele,
        college: selectedCollege,
        course: selectedCourse,
        responses,
        message,
      });

      setSentimentResult(res.data.sentimentResult);
      setShowSuccessSnackbar(true);

      setClientele('');
      setSelectedCollege('');
      setSelectedCourse('');
      setResponses(Array(10).fill(null));
      setMessage('');
    } catch (error) {
      setSubmitError('Something went wrong. Please try again.');
      console.error(error);
    }
  };

  const handleCollegeChange = (event) => {
    const college = event.target.value;
    setSelectedCollege(college);
    setSelectedCourse('');

    switch (college) {
      case 'CARES':
        setAvailableCourses(['Agriculture', 'Agricultural and Biosystems Engineering', 'Environmental Management']);
        break;
      case 'CAS':
        setAvailableCourses(['English Language Studies', 'Biology with specialization in Medical Biology', 'Biology with specialization in Microbiology', 'Chemistry', 'Psychology', 'Social Work']);
        break;
      case 'CBA':
        setAvailableCourses(['Accountancy', 'Management Accounting', 'Business Administration major in Human Resource Management', 'Business Administration major in Financial Management', 'Business Administration major in Marketing Management', 'Entrepreneurship']);
        break;
      case 'CCS':
        setAvailableCourses(['Computer Science', 'Digital Media and Interactive Arts', 'Information Technology', 'Library and Information Science']);
        break;
      case 'COED':
        setAvailableCourses(['Early Childhood Education', 'Elementary Education', 'Physical Education', 'Secondary Education major in English', 'Secondary Education major in Filipino', 'Secondary Education major in Mathematics', 'Secondary Education major in Science', 'Secondary Education major in Special Needs Education']);
        break;
      case 'COE':
        setAvailableCourses(['Chemical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Mechanical Engineering', 'Packaging Engineering', 'Software Engineering', 'Diploma in Packaging Technology']);
        break;
      case 'CHM':
        setAvailableCourses(['Hospitality Management', 'Tourism Management']);
        break;
      case 'CMLS':
        setAvailableCourses(['Medical Laboratory Science']);
        break;
      case 'CON':
        setAvailableCourses(['Nursing']);
        break;
      case 'COP':
        setAvailableCourses(['Pharmacy']);
        break;
      case 'COL':
        setAvailableCourses(['Juris Doctor']);
        break;
      case 'COM':
        setAvailableCourses(['Respiratory Therapy', 'Doctor of Medicine']);
        break;
      case 'COT':
        setAvailableCourses(['Theology', 'Certificate in Christian Ministry', 'Diploma in Christian Ministry']);
        break;
      case 'SGS':
        setAvailableCourses(['Doctor of Education major in Curriculum and Instruction', 'Doctor of Education major in Educational Administration and Supervision', 'Doctor of Education major in Guidance and Counseling', 'Doctor of Management major in Business Management', 'Doctor of Management major in Public Management', 'Doctor of Management major in Development Management', 'Doctor of Management major in Tourism and Hospitality Management', 'Doctor of Ministry major in Pastoral Counseling & Pastoral Supervision', 'Doctor of Ministry major in Church Management and Practical Ministries', 'Master of Divinity', 'Master of Theology', 'Master of Ministry', 'Master of Arts in Pastoral Counseling', 'Master of Arts in Education major in Educational Administration and Supervision', 'Master of Arts in Education major in Guidance and Counseling', 'Master of Arts in Education major in Mathematics', 'Master of Arts in Education major in Filipino', 'Master of Arts in Education major in English Language and Literature', 'Master of Science in Agriculture', 'Master in Business Administration with Thesis', 'Master in Business Administration major in Tourism and Hospitality Management', 'Master of Arts in Nursing major in Nursing Service Administration', 'Master of Arts in Nursing major in Adult Health Nursing', 'Master of Arts in Nursing major in Women and Child Health Nursing', 'Master in Public Administration', 'Master of Science in Guidance and Counseling', 'Master of Science in Teaching Biology']);
        break;
      case 'SHS':
        setAvailableCourses(['ABM', 'HUMSS', 'STEM']);
        break;
      case 'JHS':
        setAvailableCourses(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']);
        break;
      case 'ELEM':
        setAvailableCourses(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
        break;
      case 'KINDER':
        setAvailableCourses(['Kinder', 'Pre Kinder', 'Junior Kinder']);
        break;
      default:
        setAvailableCourses([]);
    }
  };

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1b0892' }}>
            <Box sx={{ flex: '0 0 auto' }}>
              <TopBar title="Satisfaction Survey" onMenuClick={toggleDrawer} subtitle="HENRY LUCE III LIBRARY SATISFACTION SURVEY" />
            </Box>
            <Box sx={{ fontFamily: 'Poppins, sans-serif', width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: '#1b0892' }}>
              <Grid container spacing={0} sx={{ height: '100%', width: '100%', margin: 0, padding: 0, boxSizing: 'border-box' }}>

                {/* Left Sidebar */}
                <Grid item xs={12} md={3} sx={{ bgcolor: '#000d3a', color: 'white', p: { xs: 2, sm: 3, md: 4 }, height: '100%', boxSizing: 'border-box', overflowY: 'auto', width: '30%' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif' }}>
                    Clientele:
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup name="clientele" value={clientele}
                     onChange={(e) => setClientele(e.target.value)}>
                      <FormControlLabel value="student" control={<Radio sx={{ color: 'white' }} />} label="Student" />
                      <FormControlLabel value="faculty" control={<Radio sx={{ color: 'white' }} />} label="Faculty" />
                      <FormControlLabel value="staff" control={<Radio sx={{ color: 'white' }} />} label="Staff" />
                      <FormControlLabel value="researcher" control={<Radio sx={{ color: 'white' }} />} label="Researcher" />
                      <FormControlLabel value="admin" control={<Radio sx={{ color: 'white' }} />} label="CPU Admin" />
                      <FormControlLabel value="alumni" control={<Radio sx={{ color: 'white' }} />} label="Alumnus/Alumni" />
                    </RadioGroup>
                  </FormControl>

                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel sx={{ color: 'white' }}>College</InputLabel>
                    <Select label="College" value={selectedCollege} onChange={handleCollegeChange}
                      sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}>
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="CARES">College of Agriculture, Resources & Environmental Sciences</MenuItem>
                      <MenuItem value="CAS">College of Arts and Sciences</MenuItem>
                      <MenuItem value="CBA">College of Business & Accountancy</MenuItem>
                      <MenuItem value="CCS">College of Computer Studies</MenuItem>
                      <MenuItem value="COED">College of Education</MenuItem>
                      <MenuItem value="COE">College of Engineering</MenuItem>
                      <MenuItem value="CHM">College of Hospitality Management</MenuItem>
                      <MenuItem value="COL">College of Law</MenuItem>
                      <MenuItem value="CMLS">College of Medical Laboratory Science</MenuItem>
                      <MenuItem value="COM">College of Medicine</MenuItem>
                      <MenuItem value="CON">College of Nursing</MenuItem>
                      <MenuItem value="COP">College of Pharmacy</MenuItem>
                      <MenuItem value="COT">College of Theology</MenuItem>
                      <MenuItem value="SGS">School of Graduate Studies</MenuItem>
                      <MenuItem value="SHS">Senior High School</MenuItem>
                      <MenuItem value="JHS">Junior High School</MenuItem>
                      <MenuItem value="ELEM">Elementary</MenuItem>
                      <MenuItem value="KINDER">Kindergarten</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel sx={{ color: 'white' }}>Course</InputLabel>
                    <Select label="Course" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} disabled={availableCourses.length === 0}
                      sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}>
                      <MenuItem value="">Select</MenuItem>
                      {availableCourses.map((course, index) => (
                        <MenuItem key={index} value={course}>{course}</MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      *Can leave blank if not student.
                    </Typography>
                  </FormControl>

                  <Box sx={{ mt: 'auto', pt: 4 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ color: 'white', borderColor: 'gold', borderWidth: 2, fontWeight: 'bold', fontFamily: 'Poppins, sans serif' }}
                      onClick={handleSubmit}
                    >
                      SUBMIT SURVEY
                    </Button>

                    {submitError && (
                      <Typography color="error" sx={{ mt: 1 }}>
                        {submitError}
                      </Typography>
                    )}

                    {/* Sentiment Result Display */}
                    {sentimentResult && (
                      <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'white', fontFamily: 'Poppins, sans-serif', display: 'block', mb: 0.5 }}>
                          Sentiment Analysis Result:
                        </Typography>
                        <Chip
                          label={`${getSentimentEmoji(sentimentResult)}  ${sentimentResult}`}
                          sx={{
                            backgroundColor: getSentimentColor(sentimentResult),
                            color: 'white',
                            fontWeight: 'bold',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '0.85rem',
                            px: 1,
                          }}
                        />
                      </Box>
                    )}

                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      *Select a rating before submitting.
                    </Typography>

                    <Typography variant="caption" display="block" sx={{ mt: 4 }}>
                      {currentTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} –{' '}
                      {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                    </Typography>
                  </Box>
                </Grid>

                {/* Right Content Area */}
                <Grid sx={{ bgcolor: 'white', p: { xs: 2, sm: 4, md: 6 }, height: '100%', overflowY: 'auto', width: '70%' }}>
                  <Typography variant="body2" fontSize='15px' sx={{ mb: 5, fontFamily: 'Poppins, sans serif' }} align="center">
                    We would greatly appreciate it if you could take a few moments to complete our survey.
                    Your feedback is invaluable and will help us enhance our services to better meet your needs.
                    Thank you for your time and input — we look forward to serving you even better in the future.
                    Have a wonderful day!
                  </Typography>
                  <Grid container spacing={4}>
                    {/* Left Column - Questions 1 to 5 */}
                    <Grid item xs={12} md={6}>
                      {surveyQuestions.slice(0, 5).map((question, index) => (
                        <Box key={index} sx={{ mb: 4 }}>
                          <Typography fontWeight="bold" mb={1} sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>
                            {index + 1}. {question}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={2}>
                            {ratingOptions.map((option) => (
                              <Box
                                key={option.id}
                                onClick={() => {
                                  const updatedResponses = [...responses];
                                  updatedResponses[index] = option.id;
                                  setResponses(updatedResponses);
                                  const updatedAnimating = [...animating];
                                  updatedAnimating[index] = option.id;
                                  setAnimating(updatedAnimating);
                                }}
                                sx={{ textAlign: 'center', cursor: 'pointer', filter: responses[index] === option.id ? 'none' : 'grayscale(100%)', transition: 'filter 0.2s' }}
                              >
                                <img
                                  src={responses[index] === option.id && animating[index] === option.id ? option.animated : option.static}
                                  alt={option.label}
                                  width="40"
                                  height="40"
                                  style={{ display: 'block', margin: '0 auto', filter: responses[index] === option.id ? 'none' : 'grayscale(100%)', transition: 'filter 0.2s', cursor: 'pointer' }}
                                />
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11 }}>{option.label}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Grid>

                    {/* Right Column - Questions 6 to 10 */}
                    <Grid item xs={12} md={6}>
                      {surveyQuestions.slice(5).map((question, index) => (
                        <Box key={index + 5} sx={{ mb: 4 }}>
                          <Typography fontWeight="bold" mb={1} sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>
                            {index + 6}. {question}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={2}>
                            {ratingOptions.map((option) => (
                              <Box
                                key={option.id}
                                onClick={() => {
                                  const updatedResponses = [...responses];
                                  updatedResponses[index + 5] = option.id;
                                  setResponses(updatedResponses);
                                  const updatedAnimating = [...animating];
                                  updatedAnimating[index + 5] = option.id;
                                  setAnimating(updatedAnimating);
                                }}
                                sx={{ textAlign: 'center', cursor: 'pointer', filter: responses[index + 5] === option.id ? 'none' : 'grayscale(100%)', transition: 'filter 0.2s' }}
                              >
                                <img
                                  src={responses[index + 5] === option.id && animating[index + 5] === option.id ? option.animated : option.static}
                                  alt={option.label}
                                  width="40"
                                  height="40"
                                  style={{ display: 'block', margin: '0 auto', filter: responses[index + 5] === option.id ? 'none' : 'grayscale(100%)', transition: 'filter 0.2s', cursor: 'pointer' }}
                                />
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11 }}>{option.label}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Grid>

                    {/* Message Box */}
                    <Grid sx={{ width: '100%' }}>
                      <Typography fontWeight="normal" fontFamily="Poppins, sans-serif" mb={1}>
                        We'd love to hear your thoughts!
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        placeholder="Let us know your thoughts, suggestions, or anything else you'd like to share..."
                        variant="outlined"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Snackbar
            open={showSuccessSnackbar}
            autoHideDuration={2000}
            onClose={() => setShowSuccessSnackbar(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setShowSuccessSnackbar(false)}
              severity="success"
              sx={{ width: '100%', fontSize: '1.1rem', padding: '16px 24px', minWidth: '300px', fontFamily: 'Poppins, sans-serif' }}
            >
              Survey submitted successfully!
            </Alert>
          </Snackbar>
        </>
      )}
    </Header>
  );
};

export default SatisfactionSurvey;