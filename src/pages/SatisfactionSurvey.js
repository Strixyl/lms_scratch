import React, { useState, useRef, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Paper,
  Chip,
  LinearProgress,
  Collapse,
  Radio,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  ViewCarousel as WizardIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  CheckCircle as CheckIcon,
  Send as SendIcon,
  School as SchoolIcon,
  CastForEducation as FacultyIcon,
  Badge as StaffIcon,
  Science as ResearcherIcon,
  AdminPanelSettings as AdminIcon,
  WorkspacePremium as AlumniIcon,
  AccessTime as ClockIcon,
  Check as CheckMarkIcon,
  RadioButtonUnchecked as UncheckedIcon,
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

// ── Patron Types with Icons (Modern Left Sidebar) ───────────────────────────
const PATRON_TYPES = [
  { id: 'student', label: 'Student', icon: SchoolIcon, desc: 'College & Course req.' },
  { id: 'faculty', label: 'Faculty', icon: FacultyIcon, desc: 'College req.' },
  { id: 'staff', label: 'Staff', icon: StaffIcon, desc: 'University Staff' },
  { id: 'researcher', label: 'Researcher', icon: ResearcherIcon, desc: 'Visiting Scholar' },
  { id: 'admin', label: 'CPU Admin', icon: AdminIcon, desc: 'Administration' },
  { id: 'alumni', label: 'Alumnus/Alumni', icon: AlumniIcon, desc: 'CPU Graduate' },
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

// ── Cisco CSAT Style Rating Component (Original Minimalist Pure White Theme) ─
const CiscoQuestionItem = ({ qIdx, question, selectedId, onSelect }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const activeId = hoveredId || selectedId;
  const activeOpt = RATING_OPTIONS.find((o) => o.id === activeId);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        bgcolor: '#ffffff',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        width: '100%',
        minWidth: 0,
        height: '182px',
        minHeight: '182px',
        maxHeight: '182px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Header Box (Fixed height for longest question) */}
      <Box sx={{ height: '56px', minHeight: '56px', maxHeight: '56px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, overflow: 'hidden' }}>
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
            fontSize: '11px',
            bgcolor: '#f1f5f9',
            color: activeOpt ? '#0f172a' : '#64748b',
            border: '1px solid #cbd5e1',
            height: '24px',
            px: 0.6,
            flexShrink: 0,
          }}
        />
      </Box>

      {/* Symmetrical 6-Column Radio Buttons Rating Row */}
      <Box sx={{ display: 'flex', width: '100%', gap: 0.8, mt: 'auto', alignItems: 'stretch' }}>
        {RATING_OPTIONS.map((opt) => {
          const isSelected = selectedId === opt.id;

          return (
            <Box
              key={opt.id}
              onClick={() => onSelect(qIdx, opt.id)}
              onMouseEnter={() => setHoveredId(opt.id)}
              onMouseLeave={() => setHoveredId(null)}
              sx={{
                flex: '1 1 0',
                width: 0,
                height: '84px',
                minHeight: '84px',
                maxHeight: '84px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                py: 0.8,
                px: 0.2,
                borderRadius: '10px',
                bgcolor: isSelected ? '#f0f9ff' : '#ffffff',
                border: '1.5px solid',
                borderColor: isSelected ? '#00bceb' : '#e2e8f0',
                boxSizing: 'border-box',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                '&:hover': {
                  bgcolor: isSelected ? '#e0f2fe' : '#f8fafc',
                  borderColor: isSelected ? '#00bceb' : '#38bdf8',
                },
              }}
            >
              {/* Fixed Height Text Label Box */}
              <Box
                sx={{
                  height: '28px',
                  minHeight: '28px',
                  maxHeight: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: { xs: '9.5px', sm: '10.5px' },
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0369a1' : '#475569',
                    lineHeight: 1.15,
                    textAlign: 'center',
                    wordBreak: 'break-word',
                  }}
                >
                  {opt.label}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 'auto' }}>
                <Radio
                  checked={isSelected}
                  value={opt.id}
                  name={`cisco-question-${qIdx}`}
                  sx={{
                    color: '#94a3b8',
                    p: 0,
                    '&.Mui-checked': { color: '#00bceb' },
                    '& .MuiSvgIcon-root': { fontSize: 22 },
                    pointerEvents: 'none',
                  }}
                />
              </Box>

              <Box sx={{ height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Typography
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 600,
                    color: isSelected ? '#0284c7' : '#334155',
                    lineHeight: 1,
                  }}
                >
                  {opt.ciscoLabel}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

// ── Single-Question Focus Wizard Rating Component (Symmetrical & Clean) ─
const WizardQuestionItem = ({ qIdx, question, selectedId, onSelect, isAdvancing, justSelectedId }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const activeId = hoveredId || selectedId;
  const activeOpt = RATING_OPTIONS.find((o) => o.id === activeId);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: { xs: '250px', sm: '235px' },
        gap: 2.5,
        py: 0.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Question Header Row: Fixed minHeight based on the longest question */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          minHeight: { xs: '84px', sm: '68px' },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            color: '#0f172a',
            fontSize: { xs: '17.5px', sm: '20.5px' },
            lineHeight: 1.45,
            flex: 1,
          }}
        >
          {qIdx + 1}. {question}
        </Typography>

        <Chip
          label={activeOpt ? `${activeOpt.ciscoLabel} – ${activeOpt.label}` : 'Select rating (1-5)'}
          size="medium"
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            bgcolor: activeOpt ? 'rgba(0, 188, 235, 0.12)' : '#f1f5f9',
            color: activeOpt ? '#0284c7' : '#64748b',
            border: activeOpt ? '1.5px solid rgba(0, 188, 235, 0.4)' : '1px solid #cbd5e1',
            height: '32px',
            px: 1,
            flexShrink: 0,
          }}
        />
      </Box>

      {/* Symmetrical 6-Column Radio Buttons Rating Row (Zero Jitter / Steady Boundaries) */}
      <Box sx={{ display: 'flex', width: '100%', gap: { xs: 1, sm: 1.5 }, alignItems: 'stretch' }}>
        {RATING_OPTIONS.map((opt) => {
          const isSelected = selectedId === opt.id;

          return (
            <Box
              key={opt.id}
              onClick={() => onSelect(qIdx, opt.id)}
              onMouseEnter={() => setHoveredId(opt.id)}
              onMouseLeave={() => setHoveredId(null)}
              sx={{
                flex: '1 1 0',
                width: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                py: { xs: 1.6, sm: 2.2 },
                px: { xs: 0.5, sm: 1 },
                height: { xs: '124px', sm: '138px' },
                minHeight: { xs: '124px', sm: '138px' },
                maxHeight: { xs: '124px', sm: '138px' },
                borderRadius: '14px',
                bgcolor: isSelected ? '#f0f9ff' : '#ffffff',
                border: '2px solid',
                borderColor: isSelected ? '#00bceb' : '#e2e8f0',
                boxShadow: isSelected ? '0 4px 14px rgba(0, 188, 235, 0.25)' : 'none',
                boxSizing: 'border-box',
                transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                '&:hover': {
                  bgcolor: isSelected ? '#e0f2fe' : '#f8fafc',
                  borderColor: isSelected ? '#00bceb' : '#38bdf8',
                  boxShadow: '0 4px 12px rgba(0, 188, 235, 0.15)',
                },
              }}
            >
              {/* Top: Fixed 38px Text Label Box for Perfect Alignment */}
              <Box
                sx={{
                  height: '38px',
                  minHeight: '38px',
                  maxHeight: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  px: 0.2,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: { xs: '10.5px', sm: '12.5px' },
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0369a1' : '#475569',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    wordBreak: 'break-word',
                  }}
                >
                  {opt.label}
                </Typography>
              </Box>

              {/* Middle: Centered Radio Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 'auto' }}>
                <Radio
                  checked={isSelected}
                  value={opt.id}
                  name={`wizard-question-${qIdx}`}
                  sx={{
                    color: '#94a3b8',
                    p: 0,
                    '&.Mui-checked': { color: '#00bceb' },
                    '& .MuiSvgIcon-root': { fontSize: { xs: 24, sm: 28 } },
                    pointerEvents: 'none',
                  }}
                />
              </Box>

              {/* Bottom: Number Label (1, 2, 3, 4, 5, N/A) */}
              <Box sx={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Typography
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: { xs: '14.5px', sm: '17px' },
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? '#0284c7' : '#1e293b',
                    lineHeight: 1,
                  }}
                >
                  {opt.ciscoLabel}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// ── Main Satisfaction Survey Page ───────────────────────────────────────────
const SatisfactionSurvey = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Validation state for Patron Profile
  const isStudent = clientele === 'student';
  const isFaculty = clientele === 'faculty';
  const isCollegeRequired = isStudent || isFaculty;
  const isCourseRequired = isStudent;

  const isPatronProfileValid = Boolean(
    clientele &&
    (!isCollegeRequired || selectedCollege) &&
    (!isCourseRequired || selectedCourse)
  );

  const handleCollegeChange = (e) => {
    const college = (typeof e === 'object' && e !== null && 'target' in e) ? e.target.value : (e || '');
    setSelectedCollege(college);
    setSelectedCourse('');
    setAvailableCourses(COLLEGE_COURSES[college] || []);
  };

  const handlePatronSelect = (patronId) => {
    setClientele(patronId);
    if (patronId !== 'student' && patronId !== 'faculty') {
      setSelectedCollege('');
      setSelectedCourse('');
      setAvailableCourses([]);
    } else if (patronId === 'faculty') {
      setSelectedCourse('');
    }
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (!clientele) {
      setSubmitError('Please select a clientele type in the left sidebar.');
      return;
    }
    if (isStudent && (!selectedCollege || !selectedCourse)) {
      setSubmitError('College and Course are required for Students.');
      return;
    }
    if (isFaculty && !selectedCollege) {
      setSubmitError('College is required for Faculty.');
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

          <Box sx={{ flex: '1 1 auto', overflow: 'hidden', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, bgcolor: '#f8fafc', fontFamily: 'Poppins, sans-serif' }}>

            {/* ── Left Sidebar (Modern Elevated Patron Dock with Divider Glow) ── */}
            <Box
              sx={{
                width: { xs: '100%', md: '350px', lg: '375px' },
                minWidth: { md: '330px', lg: '360px' },
                maxWidth: { md: '400px' },
                flexShrink: 0,
                background: 'linear-gradient(180deg, #091230 0%, #03081a 100%)',
                color: 'white',
                p: { xs: 2.2, sm: 2.6 },
                pb: 4,
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '6px 0 24px rgba(0, 0, 0, 0.35)',
                zIndex: 10,
                position: 'relative',
              }}
            >
              {/* Section Header */}
              <Box sx={{ mb: 1.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 700,
                      color: '#ffffff',
                      fontSize: { xs: '19px', sm: '20.5px' },
                      letterSpacing: '0.2px',
                    }}
                  >
                    Clientele Profile:
                  </Typography>

                  {/* Live Profile Readiness Chip */}
                  <Chip
                    icon={isPatronProfileValid ? <CheckMarkIcon sx={{ fontSize: '14px !important', color: '#ffffff !important' }} /> : <UncheckedIcon sx={{ fontSize: '13px !important', color: '#94a3b8 !important' }} />}
                    label={isPatronProfileValid ? 'Ready' : 'Incomplete'}
                    size="small"
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      height: '26px',
                      px: 0.6,
                      bgcolor: isPatronProfileValid ? 'rgba(34, 197, 94, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                      color: isPatronProfileValid ? '#4ade80' : '#94a3b8',
                      border: isPatronProfileValid ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  />
                </Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '12.5px', lineHeight: 1.4, display: 'block', fontFamily: 'Poppins, sans-serif' }}>
                  Select your patron role to personalize your feedback.
                </Typography>
              </Box>

              {/* Moved UP: Live System Time & Date Card */}
              <Box
                sx={{
                  p: 1.3,
                  mb: 2,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(56, 189, 248, 0.15)',
                      flexShrink: 0,
                    }}
                  >
                    <ClockIcon sx={{ fontSize: 20, color: '#38bdf8' }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: '#ffffff',
                        lineHeight: 1.2,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.65)',
                        lineHeight: 1.2,
                        mt: 0.2,
                      }}
                    >
                      {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>

                {/* Pulsing Live Dot */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#22c55e',
                      boxShadow: '0 0 6px #22c55e',
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#4ade80',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    LIVE
                  </Typography>
                </Box>
              </Box>

              {/* Interactive Patron Category List (Enlarged 1-to-6 Vertical Stack) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
                {PATRON_TYPES.map((type, index) => {
                  const isSelected = clientele === type.id;
                  const IconComp = type.icon;

                  return (
                    <Box
                      key={type.id}
                      onClick={() => handlePatronSelect(type.id)}
                      sx={{
                        p: { xs: 1.3, sm: 1.5 },
                        borderRadius: '14px',
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'rgba(0, 188, 235, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1.5px solid',
                        borderColor: isSelected ? '#00bceb' : 'rgba(255, 255, 255, 0.12)',
                        boxShadow: isSelected ? '0 0 16px rgba(0, 188, 235, 0.3)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.4,
                        transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(0, 188, 235, 0.26)' : 'rgba(255, 255, 255, 0.09)',
                          borderColor: isSelected ? '#00bceb' : 'rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 0 12px rgba(0, 188, 235, 0.2)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, minWidth: 0, flex: 1 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isSelected ? 'rgba(0, 188, 235, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.18s',
                            flexShrink: 0,
                          }}
                        >
                          <IconComp sx={{ fontSize: 25, color: isSelected ? '#00bceb' : '#cbd5e1' }} />
                        </Box>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: isSelected ? 700 : 600,
                              fontSize: '15.5px',
                              color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
                              lineHeight: 1.25,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {type.label}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              fontSize: '11.5px',
                              color: isSelected ? '#7dd3fc' : 'rgba(255, 255, 255, 0.55)',
                              lineHeight: 1.15,
                              mt: 0.3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {type.desc}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Number Badge (1 to 6) / Selected Check Indicator */}
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isSelected ? '#00bceb' : 'rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#091230' : 'rgba(255, 255, 255, 0.65)',
                          border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                          fontSize: '13px',
                          fontWeight: 700,
                          flexShrink: 0,
                          transition: 'all 0.18s',
                        }}
                      >
                        {isSelected ? <CheckMarkIcon sx={{ fontSize: 17, fontWeight: 'bold' }} /> : index + 1}
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              {/* College & Course Dropdowns (Smoothly Expands for Student & Faculty) */}
              <Collapse in={isCollegeRequired} timeout={300} sx={{ width: '100%' }}>
                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: '12px',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontFamily: 'Poppins, sans-serif',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: 700,
                      mb: 1.2,
                      fontSize: '11.5px',
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Academic Affiliation {isStudent ? '(College & Course)' : '(College Required)'}
                  </Typography>

                  <FormControl fullWidth size="small" sx={{ mb: isStudent ? 1.3 : 0 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px' }}>College / Unit *</InputLabel>
                    <Select
                      label="College / Unit *"
                      value={selectedCollege}
                      onChange={handleCollegeChange}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontFamily: 'Poppins, sans-serif',
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00bceb' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.45)' },
                        '.MuiSvgIcon-root': { color: '#00bceb' },
                      }}
                    >
                      <MenuItem value="" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '12.5px' }}>
                        <em>Select College</em>
                      </MenuItem>
                      {Object.keys(COLLEGE_COURSES).map((c) => (
                        <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '12.5px' }}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {isStudent && (
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px' }}>Course / Program *</InputLabel>
                      <Select
                        label="Course / Program *"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={availableCourses.length === 0}
                        sx={{
                          color: 'white',
                          bgcolor: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontFamily: 'Poppins, sans-serif',
                          '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00bceb' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.45)' },
                          '.MuiSvgIcon-root': { color: '#00bceb' },
                        }}
                      >
                        <MenuItem value="" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '12.5px' }}>
                          <em>Select Course</em>
                        </MenuItem>
                        {availableCourses.map((crs, i) => (
                          <MenuItem key={i} value={crs} sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '12.5px' }}>
                            {crs}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              </Collapse>
            </Box>

            {/* ── Right Content Panel (Symmetrical & Spacious Satisfaction Survey Questionnaire) ── */}
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                width: '100%',
                bgcolor: '#f8fafc',
                p: { xs: 2, sm: 3, md: 4 },
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ maxWidth: '1400px', width: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Header Progress Banner (Symmetrical) */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.2, sm: 2.8 },
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    maxWidth: viewMode === 'wizard' ? '960px' : '100%',
                    mx: 'auto',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        color: '#0f172a',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: { xs: '16px', sm: '18.5px' },
                      }}
                    >
                      Library Experience Rating ({completedCount}/10 Answered)
                    </Typography>
                    <Chip
                      icon={<CheckIcon sx={{ fontSize: '18px !important' }} />}
                      label={`${Math.round(progressPercent)}% Complete`}
                      color={progressPercent === 100 ? 'success' : 'primary'}
                      size="medium"
                      sx={{
                        fontWeight: 700,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '12.5px',
                        height: '30px',
                        px: 0.8,
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
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
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    pb: 0.2,
                    maxWidth: viewMode === 'wizard' ? '960px' : '100%',
                    mx: 'auto',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', color: '#64748b', fontWeight: 600, fontSize: '13.5px' }}>
                    Select Rating View Style:
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.2 }}>
                    <Chip
                      icon={<WizardIcon sx={{ fontSize: '20px !important' }} />}
                      label="Single-Question Focus Wizard"
                      clickable
                      onClick={() => setViewMode('wizard')}
                      sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '13px',
                        height: '36px',
                        px: 1,
                        bgcolor: viewMode === 'wizard' ? '#1b0892' : '#ffffff',
                        color: viewMode === 'wizard' ? '#ffffff' : '#475569',
                        border: '1.5px solid #cbd5e1',
                        '&:hover': { bgcolor: viewMode === 'wizard' ? '#120569' : '#f1f5f9' },
                      }}
                    />
                    <Chip
                      icon={<SpeedIcon sx={{ fontSize: '20px !important' }} />}
                      label="Cisco CSAT Style"
                      clickable
                      onClick={() => setViewMode('cisco')}
                      sx={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        fontSize: '13px',
                        height: '36px',
                        px: 1,
                        bgcolor: viewMode === 'cisco' ? '#00bceb' : '#ffffff',
                        color: viewMode === 'cisco' ? '#ffffff' : '#475569',
                        border: '1.5px solid #cbd5e1',
                        '&:hover': { bgcolor: viewMode === 'cisco' ? '#0096c7' : '#f1f5f9' },
                      }}
                    />
                  </Box>
                </Box>

                {/* Cisco CSAT Style Renderer (2 Equal Columns Grid) */}
                {viewMode === 'cisco' && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
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

                {/* Single-Question Focus Wizard Renderer (Symmetrical Fixed Size Card) */}
                {viewMode === 'wizard' && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2.5, sm: 3.5 },
                      borderRadius: '16px',
                      bgcolor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: { xs: '420px', sm: '385px' },
                      gap: 2,
                      overflow: 'hidden',
                      maxWidth: '960px',
                      mx: 'auto',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Wizard Header Bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.2, borderBottom: '1px solid #f1f5f9' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                          label={`Question ${wizardIndex + 1} of 10`}
                          size="medium"
                          color="primary"
                          sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', bgcolor: '#1b0892', fontSize: '13px', height: '30px' }}
                        />
                        <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                          Single-Question Focus Mode
                        </Typography>
                      </Box>

                      {/* Animated Selection Feedback Badge */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {isAdvancing ? (
                          <Chip
                            icon={<CheckIcon sx={{ fontSize: '17px !important', color: '#ffffff !important' }} />}
                            label="Saved! Moving to Next Question..."
                            size="small"
                            sx={{
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: 700,
                              fontSize: '12px',
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
                          <Typography variant="caption" sx={{ fontFamily: 'Poppins, sans-serif', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
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
                        height: 7,
                        borderRadius: 4,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: '#0066ff',
                          transition: 'transform 0.4s ease-out',
                        },
                      }}
                    />

                    {/* Question Card Container */}
                    <Box
                      key={wizardIndex}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
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

                    {/* Wizard Controls Navigation Footer (Steady Non-Jitter Buttons) */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                      <Button
                        size="large"
                        disabled={wizardIndex === 0}
                        onClick={() => changeWizardIndex(wizardIndex - 1)}
                        startIcon={<BackIcon />}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 700,
                          fontSize: '14px',
                          py: 0.8,
                          px: 2,
                          color: '#334155',
                          borderRadius: '10px',
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                          '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                          '&.Mui-disabled': { color: '#cbd5e1' },
                        }}
                      >
                        Previous
                      </Button>

                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {surveyQuestions.map((_, idx) => {
                          const isCurrent = idx === wizardIndex;
                          const isAnswered = responses[idx] !== null;

                          return (
                            <Box
                              key={idx}
                              onClick={() => changeWizardIndex(idx)}
                              sx={{
                                width: isCurrent ? 30 : 12,
                                height: isCurrent ? 11 : 9,
                                borderRadius: '6px',
                                bgcolor: isCurrent ? '#0066ff' : isAnswered ? '#43a047' : '#cbd5e1',
                                cursor: 'pointer',
                                boxShadow: isCurrent ? '0 0 10px rgba(0, 102, 255, 0.45)' : 'none',
                                transition: 'background-color 0.2s ease, width 0.2s ease',
                                '&:hover': {
                                  bgcolor: isCurrent ? '#0052cc' : isAnswered ? '#2e7d32' : '#94a3b8',
                                },
                              }}
                            />
                          );
                        })}
                      </Box>

                      <Button
                        size="large"
                        disabled={wizardIndex === 9}
                        onClick={() => changeWizardIndex(wizardIndex + 1)}
                        endIcon={<NextIcon />}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 700,
                          fontSize: '14px',
                          py: 0.8,
                          px: 2,
                          color: '#0066ff',
                          borderRadius: '10px',
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                          '&:hover': { bgcolor: '#eff6ff', color: '#0052cc' },
                          '&.Mui-disabled': { color: '#cbd5e1' },
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                  </Paper>
                )}

                {/* Feedback Message Box Section (Symmetrical) */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3.2 },
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    maxWidth: viewMode === 'wizard' ? '960px' : '100%',
                    mx: 'auto',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Typography fontWeight="bold" fontFamily="Poppins, sans-serif" fontSize="15px" mb={1.2} color="#0f172a">
                    We'd love to hear your thoughts! (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Let us know your thoughts, suggestions, or anything else you'd like to share..."
                    variant="outlined"
                    size="medium"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    inputProps={{ style: { fontFamily: 'Poppins, sans-serif', fontSize: '14px', lineHeight: 1.5 } }}
                  />
                </Paper>

                {/* SUBMIT SURVEY BUTTON SECTION (Symmetrical) */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 3.5 },
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4,
                    maxWidth: viewMode === 'wizard' ? '960px' : '100%',
                    mx: 'auto',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    startIcon={<SendIcon sx={{ fontSize: '22px !important' }} />}
                    sx={{
                      py: 1.6,
                      px: 7,
                      borderRadius: '35px',
                      backgroundColor: '#1b0892',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '16px',
                      fontFamily: 'Poppins, sans-serif',
                      letterSpacing: '0.8px',
                      boxShadow: '0 6px 18px rgba(27, 8, 146, 0.35)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        backgroundColor: '#120569',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(27, 8, 146, 0.45)',
                      },
                    }}
                  >
                    SUBMIT SURVEY
                  </Button>

                  {submitError && (
                    <Typography color="error" sx={{ mt: 2, fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: '13.5px' }}>
                      {submitError}
                    </Typography>
                  )}

                  <Typography variant="caption" sx={{ mt: 1.5, color: '#64748b', fontFamily: 'Poppins, sans-serif', fontSize: '12.5px' }}>
                    *Please select a rating for all 10 questions and fill in your clientele info before submitting.
                  </Typography>
                </Paper>

              </Box>
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
        </Box>
      )}
    </Header>
  );
};

export default SatisfactionSurvey;