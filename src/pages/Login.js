import React, { useState, useEffect, useRef } from 'react';
import Header from '../Components/Header';
import {
  Box, TextField, Typography, Paper, Avatar, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BadgeIcon from '@mui/icons-material/Badge';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ApartmentIcon from '@mui/icons-material/Apartment';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
// TODO: point this at the actual Henry Luce III library logo asset.
import henryLuceLogo from '../assets/henryluce.png';
// TODO: point this at the footer banner (institutional repository / QR code) asset.
import footerBanner from '../assets/login-pic.png';

const sections = [
  'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
];

// CPU school color palette — adjust these two hexes to match the exact
// gold/yellow used elsewhere in the system if this isn't quite right.
const GOLD = '#c99a2e';
const GOLD_DARK = '#a67c1e';
const NAVY = '#0f172a';

const Login = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [sectionConfirmed, setSectionConfirmed] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [formData, setFormData] = useState({
    name: '', idNumber: '', course: '', year: '', college: ''
  });

  const timeoutRef = useRef(null);

  const formatPHTime = (dateStr) => {
    if (!dateStr) return '';
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    const d = new Date(year, month - 1, day, hour, minute, second);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirmSection = () => {
    if (selectedSection) setSectionConfirmed(true);
  };

  const handleIdInput = async (e) => {
    const input = e.target.value;
    setIdInput(input);

    if (input.length !== 10) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIdInput(''), 10000);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    try {
      const response = await axios.post('http://localhost:5000/api/student-lookup', {
        idNumber: input,
        section: selectedSection,
      });

      const student = response.data;

      if (student) {
        setFormData({
          idNumber: student.studIDnumber,
          name: `${student.studLname}, ${student.studFname}`,
          course: student.studCourse,
          year: student.studYear,
          college: student.studCollege,
        });

        if (student.studLogType === 'Time In') {
          setTimeIn(formatPHTime(student.timeLogged));
          setTimeOut('');
        } else if (student.studLogType === 'Time Out') {
          setTimeOut(formatPHTime(student.timeLogged));
        }

        setTimeout(() => {
          setFormData({ idNumber: '', name: '', course: '', year: '', college: '' });
          setTimeIn('');
          setTimeOut('');
        }, 5000);

        setTimeout(() => setIdInput(''), 1000);
      } else {
        alert('Student not found');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const isScanned = !!formData.idNumber;

  // Icon-badge stat boxes — arranged 2 per row like the reference design.
  const statRows = [
    [
      { label: 'Time In', value: timeIn, active: !!timeIn, icon: ScheduleIcon, color: '#16a34a', bg: '#dcfce7' },
      { label: 'Time Out', value: timeOut, active: !!timeOut, icon: ScheduleIcon, color: '#dc2626', bg: '#fee2e2' },
    ],
    [
      { label: 'College', value: formData.college, active: !!formData.college, icon: ApartmentIcon, color: '#7c3aed', bg: '#ede9fe' },
      { label: 'Course', value: formData.course, active: !!formData.course, icon: SchoolIcon, color: '#0d9488', bg: '#ccfbf1' },
    ],
    [
      { label: 'Year Level', value: formData.year, active: !!formData.year, icon: WorkspacePremiumIcon, color: '#ea580c', bg: '#ffedd5' },
      { label: 'Date', value: currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), active: true, icon: CalendarMonthIcon, color: '#2563eb', bg: '#dbeafe' },
    ],
  ];

  return (
    <Header>
      {(toggleDrawer) => (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>

          {/* ── Section Selector Dialog ── */}
          <Dialog open={!sectionConfirmed} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
            <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Select Library Station</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 1, minWidth: 320 }}>
                <InputLabel>Station Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Station Section"
                  onChange={(e) => setSelectedSection(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {sections.map((section) => (
                    <MenuItem key={section} value={section}>{section}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={handleConfirmSection}
                variant="contained"
                disabled={!selectedSection}
                fullWidth
                sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 700, bgcolor: GOLD_DARK, '&:hover': { bgcolor: GOLD } }}
              >
                Confirm Station
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── CUSTOM TOP BAR (gold, hamburger + date/time + logo) ── */}
          <Box
            sx={{
              bgcolor: GOLD,
              px: { xs: 2, md: 4 },
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            {/* Left: hamburger + logo + title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton onClick={toggleDrawer} sx={{ color: '#fff' }}>
                <MenuIcon />
              </IconButton>

              {/* Henry Luce III logo — CPU logo intentionally removed */}
              <Box
                component="img"
                src={henryLuceLogo}
                alt="Henry Luce III Library"
                sx={{
                  height: { xs: 40, md: 52 },
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />

              <Box>
                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: { xs: 13, md: 15 }, color: '#fff', lineHeight: 1.2 }}>
                  HENRY LUCE III LIBRARY
                </Typography>
                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: { xs: 10, md: 11 }, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 }}>
                  SIGN IN PORTAL
                </Typography>
              </Box>
            </Box>

            {/* Right: live date + time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 } }}>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon sx={{ color: '#fff', fontSize: 20 }} />
                <Box>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', lineHeight: 1.1 }}>
                    {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ color: '#fff', fontSize: 20 }} />
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ── MAIN CONTENT ── */}
          {sectionConfirmed && (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 3 } }}>
              <Paper
                elevation={0}
                sx={{
                  width: '100%',
                  maxWidth: 1500,
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  bgcolor: '#fff',
                  p: { xs: 3, md: 5 },
                }}
              >
                {/* Title block */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: { xs: 24, md: 30 }, color: NAVY, letterSpacing: 1 }}>
                    LIBRARY SIGN IN
                  </Typography>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#64748b', mt: 0.5 }}>
                    Please scan your ID or enter your ID number to log in.
                  </Typography>
                  <Box sx={{ width: 60, height: 3, bgcolor: GOLD, borderRadius: 2, mx: 'auto', mt: 2 }} />
                </Box>

                {/* Two-column workspace */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>

                  {/* LEFT: Photo + ID input */}
                  <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f8fafc',
                      }}
                    >
                      {isScanned ? (
                        <Avatar
                          src={`http://localhost:5000/api/photos/${formData.idNumber}`}
                          alt="Patron"
                          variant="square"
                          sx={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Box sx={{ textAlign: 'center', color: '#94a3b8' }}>
                          <BadgeIcon sx={{ fontSize: 48, mb: 1, opacity: 0.6 }} />
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
                            AWAITING SCAN
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: NAVY, minHeight: 24 }}>
                        {formData.name || '—'}
                      </Typography>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#94a3b8', mb: 1 }}>
                        {formData.idNumber ? `ID: ${formData.idNumber}` : 'No ID scanned'}
                      </Typography>
                      <Chip
                        icon={isScanned ? <CheckCircleIcon sx={{ fontSize: '16px !important', color: '#16a34a !important' }} /> : undefined}
                        label={isScanned ? 'ID Verified' : 'Not Scanned'}
                        size="small"
                        sx={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 700,
                          fontSize: 12,
                          bgcolor: isScanned ? '#dcfce7' : '#f1f5f9',
                          color: isScanned ? '#16a34a' : '#94a3b8',
                          border: `1px solid ${isScanned ? '#86efac' : '#e2e8f0'}`,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* RIGHT: ID input + info stat grid */}
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>

                    {/* ID Entry field */}
                    <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: NAVY, mb: 1 }}>
                        Enter or Scan ID Number
                      </Typography>
                      <TextField
                        autoFocus
                        fullWidth
                        variant="outlined"
                        placeholder="Place card near scanner..."
                        value={idInput}
                        onChange={handleIdInput}
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ color: '#94a3b8', mr: 1 }} />,
                          endAdornment: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: GOLD_DARK, color: '#fff', px: 1.5, py: 0.7, borderRadius: 2, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12 }}>
                              <CreditCardIcon sx={{ fontSize: 16 }} /> SCAN
                            </Box>
                          ),
                          sx: { height: 52, borderRadius: 2.5, fontFamily: 'monospace', fontSize: '1rem', bgcolor: '#fff' },
                        }}
                      />
                    </Box>

                    {/* Employee/Patron information header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BadgeIcon sx={{ color: GOLD_DARK, fontSize: 20 }} />
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Patron Information
                      </Typography>
                    </Box>

                    {/* Stat grid — 2 columns, matching reference layout */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {statRows.map((row, rowIdx) => (
                        <Box key={rowIdx} sx={{ display: 'flex', gap: 1.5 }}>
                          {row.map((stat) => {
                            const Icon = stat.icon;
                            return (
                              <Box
                                key={stat.label}
                                sx={{
                                  flex: '1 1 0',
                                  minWidth: 0,
                                  p: 1.75,
                                  borderRadius: 3,
                                  border: '1px solid #cbd5e1',
                                  bgcolor: '#f8fafc',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                }}
                              >
                                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Icon sx={{ color: stat.color, fontSize: 20 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {stat.label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: 'Poppins, sans-serif',
                                      fontWeight: 700,
                                      fontSize: '0.85rem',
                                      color: stat.active ? NAVY : '#94a3b8',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {stat.value || '—'}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )},
          {sectionConfirmed && (
            <Box
              component="footer"
              sx={{
                width: '100%',
                mt: 'auto',
                flexShrink: 0,
                display: 'block',
                lineHeight: 0
              }}
            >
              <img
                src={footerBanner}
                alt="Bahandian Banner"
                style={{
                  width: '100%',
                  height: 'auto', // Forces the container height to perfectly follow the image ratio
                  display: 'block'
                }}
              />
            </Box>
          )}
        </Box>
      )}
    </Header>
  );
};

export default Login;