import React, { useState, useRef } from 'react';
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
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  ViewCarousel as WizardIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  CheckCircle as CheckIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import axios from 'axios';

// ── Rating Options (Clean Number-Based) ──────────────────────────────────────
const RATING_OPTIONS = [
  { id: 'very_dissatisfied', label: 'Very Dissatisfied', ciscoLabel: '1' },
  { id: 'dissatisfied', label: 'Dissatisfied', ciscoLabel: '2' },
  { id: 'neutral', label: 'Neutral', ciscoLabel: '3' },
  { id: 'satisfied', label: 'Satisfied', ciscoLabel: '4' },
  { id: 'very_satisfied', label: 'Very Satisfied', ciscoLabel: '5' },
  { id: 'na', label: 'N/A', ciscoLabel: 'N/A' },
];

// ── College Courses Lookup ──────────────────────────────────────────────────
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
  SGS: ['Doctor of Education major in Curriculum and Instruction', 'Doctor of Education major in Educational Administration and Supervision', 'Doctor of Education major in Guidance and Counseling', 'Doctor of Management major in Business Management', 'Doctor of Management major in Public Management', 'Doctor of Management major in Development Management', 'Doctor of Management major in Tourism and Hospitality Management', 'Doctor of Ministry major in Pastoral Counseling & Pastoral Supervision', 'Doctor of Ministry major in Church Management and Practical Ministries', 'Master of Divinity', 'Master of Theology', 'Master of Ministry', 'Master of Arts in Pastoral Counseling', 'Master of Arts in Education major in Educational Administration and Supervision', 'Master of Arts in Education major in Guidance and Counseling', 'Master of Arts in Education major in Mathematics', 'Master of Arts in Education major in Filipino', 'Master of Arts in Education major in English Language and Literature', 'Master of Science in Agriculture', 'Master in Business Administration with Thesis', 'Master in Business Administration major in Tourism and Hospitality Management', 'Master of Arts in Nursing major in Nursing Service Administration', 'Master of Arts in Nursing major in Adult Health Nursing', 'Master of Arts in Nursing major in Women and Child Health Nursing', 'Master in Public Administration', 'Master of Science in Guidance and Counseling', 'Master of Science in Teaching Biology'],
  SHS: ['ABM', 'HUMSS', 'STEM'],
  JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  ELEM: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  KINDER: ['Kinder', 'Pre Kinder', 'Junior Kinder'],
};

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

// ── Cisco CSAT Style Rating Component (Minimalist Pure White Theme) ─────────
const CiscoQuestionItem = ({ qIdx, question, selectedId, onSelect }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const activeId = hoveredId || selectedId;
  const activeOpt = RATING_OPTIONS.find((o) => o.id === activeId);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '16px',
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
        width: '100%',
        minWidth: 0,
        height: '154px',
        minHeight: '154px',
        maxHeight: '154px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Header Box */}
      <Box sx={{ height: '48px', minHeight: '48px', maxHeight: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, overflow: 'hidden' }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            color: '#0f172a',
            fontSize: { xs: '13.5px', sm: '14.5px' },
            lineHeight: 1.35,
            flex: 1,
            minWidth: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {qIdx + 1}. {question}
        </Typography>

        <Chip
          label={activeOpt ? `${activeOpt.ciscoLabel} – ${activeOpt.label}` : 'Select rating'}
          size="small"
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '10.5px',
            bgcolor: '#f1f5f9',
            color: activeOpt ? '#0f172a' : '#64748b',
            border: '1px solid #cbd5e1',
            height: '22px',
            px: 0.5,
            flexShrink: 0,
          }}
        />
      </Box>

      {/* Radio Buttons Rating Row */}
      <Box sx={{ display: 'flex', width: '100%', gap: 0.5, mt: 'auto' }}>
        {RATING_OPTIONS.map((opt) => {
          const isSelected = selectedId === opt.id;

          return (
            <Box
              key={opt.id}
              onClick={() => onSelect(qIdx, opt.id)}
              onMouseEnter={() => setHoveredId(opt.id)}
              onMouseLeave={() => setHoveredId(null)}
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                py: 0.5,
                px: 0.2,
                borderRadius: '8px',
                bgcolor: '#ffffff',
                border: '1px solid transparent',
                boxSizing: 'border-box',
              }}
            >
              {/* Fixed 26px Height Text Label Box */}
              <Typography
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: { xs: '9px', sm: '10px' },
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#0f172a' : '#475569',
                  lineHeight: 1.1,
                  textAlign: 'center',
                  height: '26px',
                  minHeight: '26px',
                  maxHeight: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  wordBreak: 'break-word',
                }}
              >
                {opt.label}
              </Typography>
              <Radio
                checked={isSelected}
                value={opt.id}
                name={`cisco-question-${qIdx}`}
                sx={{
                  color: '#94a3b8',
                  p: 0.2,
                  '&.Mui-checked': { color: '#00bceb' },
                  '& .MuiSvgIcon-root': { fontSize: 21 },
                  pointerEvents: 'none',
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? '#0f172a' : '#334155',
                  lineHeight: 1,
                  mt: 0.1,
                }}
              >
                {opt.ciscoLabel}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};


// ── Single-Question Focus Wizard Rating Component (Minimalist Pure White Theme) ───
const WizardQuestionItem = ({ qIdx, question, selectedId, onSelect }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const activeId = hoveredId || selectedId;
  const activeOpt = RATING_OPTIONS.find((o) => o.id === activeId);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '16px',
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#0f172a', fontSize: '15px', lineHeight: 1.45, flex: 1 }}
        >
          {qIdx + 1}. {question}
        </Typography>

        <Chip
          label={activeOpt ? `${activeOpt.ciscoLabel} – ${activeOpt.label}` : 'Select rating (1-5)'}
          size="small"
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '11px',
            bgcolor: '#f1f5f9',
            color: activeOpt ? '#0f172a' : '#64748b',
            border: '1px solid #cbd5e1',
            height: '26px',
            px: 0.5,
          }}
        />
      </Box>

      {/* Radio Buttons Rating Row */}
      <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
        {RATING_OPTIONS.map((opt) => {
          const isSelected = selectedId === opt.id;

          return (
            <Box
              key={opt.id}
              onClick={() => onSelect(qIdx, opt.id)}
              onMouseEnter={() => setHoveredId(opt.id)}
              onMouseLeave={() => setHoveredId(null)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                py: 1.2,
                px: 0.5,
                borderRadius: '10px',
                bgcolor: '#ffffff',
                border: '1px solid transparent',
                boxSizing: 'border-box',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: { xs: '10px', sm: '11px' },
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#0f172a' : '#475569',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  mb: 0.5,
                }}
              >
                {opt.label}
              </Typography>
              <Radio
                checked={isSelected}
                value={opt.id}
                name={`wizard-question-${qIdx}`}
                sx={{
                  color: '#94a3b8',
                  p: 0.5,
                  '&.Mui-checked': { color: '#00bceb' },
                  '& .MuiSvgIcon-root': { fontSize: 24 },
                  pointerEvents: 'none',
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? '#0f172a' : '#334155',
                  lineHeight: 1,
                  mt: 0.3,
                }}
              >
                {opt.ciscoLabel}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};





// ── Main Satisfaction Survey Page ───────────────────────────────────────────
const SatisfactionSurvey = () => {
  const [currentTime] = useState(new Date());
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [clientele, setClientele] = useState('');
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  const [viewMode, setViewMode] = useState('wizard');
  const [wizardIndex, setWizardIndex] = useState(0);
  const [responses, setResponses] = useState(Array(10).fill(null));
  const [slideDirection, setSlideDirection] = useState('next');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [justSelectedId, setJustSelectedId] = useState(null);

  const autoAdvanceTimerRef = useRef(null);

  const handleRatingSelect = (index, optionId) => {
    const updated = [...responses];
    updated[index] = optionId;
    setResponses(updated);
  };

  const changeWizardIndex = (target) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    setIsAdvancing(false);
    setJustSelectedId(null);
    setSlideDirection(target >= wizardIndex ? 'next' : 'prev');
    setWizardIndex(target);
  };

  const handleWizardSelect = (idx, id) => {
    handleRatingSelect(idx, id);
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    setIsAdvancing(true);
    setJustSelectedId(id);

    autoAdvanceTimerRef.current = setTimeout(() => {
      setSlideDirection('next');
      setIsAdvancing(false);
      setJustSelectedId(null);
      setWizardIndex((prev) => (prev < 9 ? prev + 1 : prev));
    }, 420);
  };

  const completedCount = responses.filter((r) => r !== null).length;
  const progressPercent = (completedCount / 10) * 100;

  const handleCollegeChange = (e) => {
    const college = e.target.value;
    setSelectedCollege(college);
    setSelectedCourse('');
    setAvailableCourses(COLLEGE_COURSES[college] || []);
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (!clientele) {
      setSubmitError('Please select a clientele type in the left sidebar.');
      return;
    }
    if ((clientele === 'student' || clientele === 'faculty') && (!selectedCollege || !selectedCourse)) {
      setSubmitError('College and Course are required for Student and Faculty.');
      return;
    }
    if (!responses.every((r) => r !== null)) {
      setSubmitError('Please answer all 10 survey questions before submitting.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/survey', {
        clientele,
        college: selectedCollege,
        course: selectedCourse,
        responses,
        message,
      });

      setShowSuccessSnackbar(true);
      setClientele('');
      setSelectedCollege('');
      setSelectedCourse('');
      setResponses(Array(10).fill(null));
      setMessage('');
      setWizardIndex(0);
    } catch (error) {
      setSubmitError('Something went wrong. Please try again.');
      console.error(error);
    }
  };

  return (
    <Header>
      {(toggleDrawer) => (
        <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#1b0892' }}>
          <Box sx={{ flex: '0 0 auto' }}>
            <TopBar title="Satisfaction Survey" onMenuClick={toggleDrawer} subtitle="HENRY LUCE III LIBRARY SATISFACTION SURVEY" />
          </Box>

          <Box sx={{ flex: '1 1 auto', overflow: 'hidden', display: 'flex', bgcolor: '#1b0892', fontFamily: 'Poppins, sans-serif' }}>
            <Grid container spacing={0} sx={{ height: '100%', width: '100%', m: 0 }}>

              {/* Left Sidebar (Compact Container Width) */}
              <Grid item xs={12} md={2.5} sx={{ bgcolor: '#000d3a', color: 'white', p: { xs: 2, sm: 2.5 }, height: '100%', overflowY: 'auto', width: { xs: '100%', md: '22%' }, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
                  Clientele Profile:
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup name="clientele" value={clientele} onChange={(e) => setClientele(e.target.value)}>
                    <FormControlLabel value="student" control={<Radio size="small" sx={{ color: 'white' }} />} label="Student" />
                    <FormControlLabel value="faculty" control={<Radio size="small" sx={{ color: 'white' }} />} label="Faculty" />
                    <FormControlLabel value="staff" control={<Radio size="small" sx={{ color: 'white' }} />} label="Staff" />
                    <FormControlLabel value="researcher" control={<Radio size="small" sx={{ color: 'white' }} />} label="Researcher" />
                    <FormControlLabel value="admin" control={<Radio size="small" sx={{ color: 'white' }} />} label="CPU Admin" />
                    <FormControlLabel value="alumni" control={<Radio size="small" sx={{ color: 'white' }} />} label="Alumnus/Alumni" />
                  </RadioGroup>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
                  <InputLabel sx={{ color: 'white' }}>College</InputLabel>
                  <Select
                    label="College"
                    value={selectedCollege}
                    onChange={handleCollegeChange}
                    sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {Object.keys(COLLEGE_COURSES).map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
                  <InputLabel sx={{ color: 'white' }}>Course</InputLabel>
                  <Select
                    label="Course"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    disabled={availableCourses.length === 0}
                    sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {availableCourses.map((crs, i) => (
                      <MenuItem key={i} value={crs}>{crs}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                    *Required for Student and Faculty only.
                  </Typography>
                </FormControl>

                <Box sx={{ mt: 'auto', pt: 3 }}>
                  <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                    {currentTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} –{' '}
                    {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                  </Typography>
                </Box>
              </Grid>

              {/* Right Content Panel (Expanded Horizontal Area) */}
              <Grid item xs={12} md={9.5} sx={{ bgcolor: '#f8fafc', p: { xs: 2, md: 3 }, height: '100%', overflowY: 'auto', width: { xs: '100%', md: '78%' }, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ maxWidth: '1400px', width: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                  {/* Header Progress Banner */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      maxWidth: viewMode === 'wizard' ? '850px' : '100%',
                      mx: 'auto',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a', fontFamily: 'Poppins, sans-serif' }}>
                        Library Experience Rating ({completedCount}/10 Answered)
                      </Typography>
                      <Chip
                        icon={<CheckIcon sx={{ fontSize: '16px !important' }} />}
                        label={`${Math.round(progressPercent)}% Complete`}
                        color={progressPercent === 100 ? 'success' : 'primary'}
                        size="small"
                        sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: progressPercent === 100 ? '#43a047' : '#00bceb',
                        },
                      }}
                    />
                  </Paper>

                  {/* View Mode Controls Bar */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      pb: 0.5,
                      maxWidth: viewMode === 'wizard' ? '850px' : '100%',
                      mx: 'auto',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', color: '#64748b', fontWeight: 500 }}>
                      Select Rating View Style:
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        icon={<WizardIcon sx={{ fontSize: '18px !important' }} />}
                        label="Single-Question Focus Wizard"
                        clickable
                        onClick={() => setViewMode('wizard')}
                        sx={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 600,
                          bgcolor: viewMode === 'wizard' ? '#1b0892' : '#ffffff',
                          color: viewMode === 'wizard' ? '#ffffff' : '#475569',
                          border: '1px solid #cbd5e1',
                          '&:hover': { bgcolor: viewMode === 'wizard' ? '#120569' : '#f1f5f9' },
                        }}
                      />
                      <Chip
                        icon={<SpeedIcon sx={{ fontSize: '18px !important' }} />}
                        label="Cisco CSAT Style"
                        clickable
                        onClick={() => setViewMode('cisco')}
                        sx={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 600,
                          bgcolor: viewMode === 'cisco' ? '#00bceb' : '#ffffff',
                          color: viewMode === 'cisco' ? '#ffffff' : '#475569',
                          border: '1px solid #cbd5e1',
                          '&:hover': { bgcolor: viewMode === 'cisco' ? '#0096c7' : '#f1f5f9' },
                        }}
                      />

                    </Box>
                  </Box>

                  {/* Cisco CSAT Style Renderer (100% Guaranteed 2 Equal Columns Per Row CSS Grid Layout) */}
                  {viewMode === 'cisco' && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2.5,
                        width: '100%',
                      }}
                    >
                      {surveyQuestions.map((qText, idx) => (
                        <CiscoQuestionItem
                          key={idx}
                          qIdx={idx}
                          question={qText}
                          selectedId={responses[idx]}
                          onSelect={handleRatingSelect}
                        />
                      ))}
                    </Box>
                  )}



                  {viewMode === 'wizard' && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 2, md: 3 },
                        borderRadius: '16px',
                        bgcolor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        overflow: 'hidden',
                        maxWidth: '850px',
                        mx: 'auto',
                        width: '100%',
                      }}
                    >
                      {/* Wizard Header Bar */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Chip
                            label={`Question ${wizardIndex + 1} of 10`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', bgcolor: '#1b0892', fontSize: '11.5px' }}
                          />
                          <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', color: '#64748b', fontSize: '12px', fontWeight: 500 }}>
                            Single-Question Focus Mode
                          </Typography>
                        </Box>

                        {/* Animated Selection / Progress Feedback Badge */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isAdvancing ? (
                            <Chip
                              icon={<CheckIcon sx={{ fontSize: '16px !important', color: '#ffffff !important' }} />}
                              label="Saved! Moving to Next Question..."
                              size="small"
                              sx={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 600,
                                fontSize: '11px',
                                bgcolor: '#16a34a',
                                color: '#ffffff',
                                animation: 'pulseBadge 0.4s ease-in-out infinite alternate',
                                '@keyframes pulseBadge': {
                                  '0%': { transform: 'scale(0.96)', opacity: 0.85 },
                                  '100%': { transform: 'scale(1.03)', opacity: 1 },
                                },
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ fontFamily: 'Poppins, sans-serif', color: '#64748b', fontWeight: 600 }}>
                              {completedCount}/10 Answered
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Mini Step Progress Bar */}
                      <LinearProgress
                        variant="determinate"
                        value={((wizardIndex + 1) / 10) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: '#0066ff',
                            transition: 'transform 0.4s ease-out',
                          },
                        }}
                      />

                      {/* Animated Question Card Container */}
                      <Box
                        key={wizardIndex}
                        sx={{
                          animation:
                            slideDirection === 'next'
                              ? 'wizardSlideNext 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                              : 'wizardSlidePrev 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                          '@keyframes wizardSlideNext': {
                            '0%': { opacity: 0, transform: 'translateX(40px) scale(0.98)' },
                            '100%': { opacity: 1, transform: 'translateX(0) scale(1)' },
                          },
                          '@keyframes wizardSlidePrev': {
                            '0%': { opacity: 0, transform: 'translateX(-40px) scale(0.98)' },
                            '100%': { opacity: 1, transform: 'translateX(0) scale(1)' },
                          },
                        }}
                      >
                        <WizardQuestionItem
                          qIdx={wizardIndex}
                          question={surveyQuestions[wizardIndex]}
                          selectedId={responses[wizardIndex]}
                          onSelect={handleWizardSelect}
                          isAdvancing={isAdvancing}
                          justSelectedId={justSelectedId}
                        />
                      </Box>

                      {/* Wizard Controls Navigation Footer */}
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                        <Button
                          disabled={wizardIndex === 0}
                          onClick={() => changeWizardIndex(wizardIndex - 1)}
                          startIcon={<BackIcon />}
                          sx={{
                            textTransform: 'none',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'translateX(-3px)' },
                          }}
                        >
                          Previous
                        </Button>

                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                          {surveyQuestions.map((_, idx) => {
                            const isCurrent = idx === wizardIndex;
                            const isAnswered = responses[idx] !== null;

                            return (
                              <Box
                                key={idx}
                                onClick={() => changeWizardIndex(idx)}
                                sx={{
                                  width: isCurrent ? 26 : 10,
                                  height: isCurrent ? 10 : 8,
                                  borderRadius: '5px',
                                  bgcolor: isCurrent ? '#0066ff' : isAnswered ? '#43a047' : '#cbd5e1',
                                  cursor: 'pointer',
                                  boxShadow: isCurrent ? '0 0 8px rgba(0, 102, 255, 0.4)' : 'none',
                                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                  '&:hover': {
                                    transform: 'scale(1.25)',
                                    bgcolor: isCurrent ? '#0052cc' : isAnswered ? '#2e7d32' : '#94a3b8',
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>

                        <Button
                          disabled={wizardIndex === 9}
                          onClick={() => changeWizardIndex(wizardIndex + 1)}
                          endIcon={<NextIcon />}
                          sx={{
                            textTransform: 'none',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'translateX(3px)' },
                          }}
                        >
                          Next
                        </Button>
                      </Box>
                    </Paper>
                  )}

                  {/* Feedback Message Box Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      mt: 1,
                      maxWidth: viewMode === 'wizard' ? '850px' : '100%',
                      mx: 'auto',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Typography fontWeight="bold" fontFamily="Poppins, sans-serif" fontSize="13px" mb={1} color="#1e293b">
                      We'd love to hear your thoughts!
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2.5}
                      placeholder="Let us know your thoughts, suggestions, or anything else you'd like to share..."
                      variant="outlined"
                      size="small"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      inputProps={{ style: { fontFamily: 'Poppins, sans-serif', fontSize: '12.5px' } }}
                    />
                  </Paper>

                  {/* SUBMIT SURVEY BUTTON SECTION */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      mb: 4,
                      maxWidth: viewMode === 'wizard' ? '850px' : '100%',
                      mx: 'auto',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      startIcon={<SendIcon />}
                      sx={{
                        py: 1.5,
                        px: 6,
                        borderRadius: '30px',
                        backgroundColor: '#1b0892',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        fontFamily: 'Poppins, sans-serif',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 14px rgba(27, 8, 146, 0.3)',
                        '&:hover': {
                          backgroundColor: '#120569',
                          boxShadow: '0 6px 18px rgba(27, 8, 146, 0.4)',
                        },
                      }}
                    >
                      SUBMIT SURVEY
                    </Button>

                    {submitError && (
                      <Typography color="error" sx={{ mt: 1.5, fontWeight: 600, fontFamily: 'Poppins, sans-serif', fontSize: '13px' }}>
                        {submitError}
                      </Typography>
                    )}

                    <Typography variant="caption" sx={{ mt: 1, color: '#64748b', fontFamily: 'Poppins, sans-serif' }}>
                      *Please select a rating for all 10 questions and fill in your clientele info before submitting.
                    </Typography>
                  </Paper>

                </Box>
              </Grid>
            </Grid>
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
        </Box>
      )}
    </Header>
  );
};

export default SatisfactionSurvey;