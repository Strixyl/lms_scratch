import React, { useState, useEffect, useRef } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, TextField, Typography, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, Select, FormControl, InputLabel, Paper, Avatar, Divider, Chip
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlaceIcon from '@mui/icons-material/Place';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';
import loginpic from '../assets/login-pic.png';

const sections = [
  'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
];

// Fixed height so neither container shifts/grows as data populates
const PANEL_MIN_HEIGHT = 460;

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

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          {/* Section Selector Dialog */}
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
                sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 600, bgcolor: '#0f172a' }}
              >
                Confirm Station
              </Button>
            </DialogActions>
          </Dialog>

          <Box sx={{ flex: '0 0 auto' }}>
            <TopBar title="Sign In Portal" onMenuClick={toggleDrawer} subtitle="HENRY LUCE III LIBRARY SIGN IN PORTAL" />
          </Box>

          {sectionConfirmed && (
            <Box sx={{ minHeight: 'calc(100vh - 90px)', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

              {/* MAIN CONTENT WORKSPACE CONTAINER */}
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, width: '100%', minWidth: 0 }}>

                  {/* LEFT CONTAINER: Verification, Input & Scanner Access (fixed width) */}
                  <Box sx={{ width: { xs: '100%', md: 380 }, flexShrink: 0, display: 'flex' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        textAlign: 'center',
                        bgcolor: '#fff',
                        width: '100%',
                        minHeight: PANEL_MIN_HEIGHT,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >

                      {/* Real-time Clock Header View */}
                      <Box>
                        <Typography sx={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', mb: 0.5 }}>
                          Current
                        </Typography>
                        <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                          {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                          {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                      </Box>

                      {/* Photo Display Module */}
                      <Box sx={{
                        width: 200, height: 200, border: '1px dashed #cbd5e1', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', my: 3,
                        overflow: 'hidden', position: 'relative', bgcolor: '#f1f5f9',
                        boxShadow: 'inset 0px 2px 4px rgba(0,0,0,0.06)'
                      }}>
                        {formData.idNumber ? (
                          <Avatar
                            src={`http://localhost:5000/api/photos/${formData.idNumber}`}
                            alt="Student"
                            sx={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <Box sx={{ textAlign: 'center', color: '#94a3b8' }}>
                            <BadgeIcon sx={{ fontSize: 44, mb: 1, opacity: 0.7 }} />
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, lineHeight: 1.2 }}>
                              AWAITING<br />SCAN
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Interactive Field */}
                      <Box>
                        <Typography variant="body2" sx={{ textAlign: 'left', fontWeight: 600, color: '#475569', mb: 1, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          Scan or Type ID Number
                        </Typography>
                        <TextField
                          autoFocus
                          variant="outlined"
                          placeholder="Place card near scanner..."
                          value={idInput}
                          onChange={handleIdInput}
                          fullWidth
                          InputProps={{
                            sx: {
                              height: 52,
                              borderRadius: 3,
                              fontFamily: 'monospace',
                              fontSize: '1.2rem',
                              letterSpacing: 2
                            }
                          }}
                          sx={{
                            backgroundColor: '#fff',
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#cbd5e1' },
                              '&:hover fieldset': { borderColor: '#94a3b8' },
                            }
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>

                  {/* RIGHT CONTAINER: Profile Metadata Information Panel (fills remaining space) */}
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        bgcolor: '#fff',
                        width: '100%',
                        minHeight: PANEL_MIN_HEIGHT,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >

                      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Section Station Badge (Always visible at the top) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                              <BadgeIcon sx={{ color: '#475569' }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#0f172a' }}>
                              Patron Information
                            </Typography>
                          </Box>

                          {/* Station Monitor Placement Tag */}
                          <Chip
                            icon={<PlaceIcon sx={{ fontSize: '1rem !important', color: '#0369a1 !important' }} />}
                            label={selectedSection.toUpperCase()}
                            sx={{ fontWeight: 800, fontSize: '0.75rem', bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
                          />
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Name area — always the same box/shape, whether idle or populated,
                            so the panel never changes size or shifts when a card is scanned. */}
                        <Box sx={{
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: formData.idNumber ? 'flex-start' : 'center',
                          textAlign: formData.idNumber ? 'left' : 'center',
                          border: formData.idNumber ? 'none' : '2px dashed #f1f5f9',
                          borderRadius: 3,
                          py: formData.idNumber ? 0 : 5,
                          color: formData.idNumber ? 'inherit' : '#94a3b8',
                        }}>
                          {formData.idNumber ? (
                            <>
                              <Typography variant="caption" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#94a3b8', mb: 0.5 }}>
                                Full Registered Name
                              </Typography>
                              <Typography variant="h5" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#0f172a' }}>
                                {formData.name}
                              </Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155', mt: 0.5 }}>
                                ID: {formData.idNumber}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <ArrowForwardIcon sx={{ fontSize: 36, mb: 1, transform: 'rotate(90deg)', opacity: 0.5 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                                Ready for Entry Scan
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8', px: 2, display: 'block', mt: 0.5 }}>
                                Please scan your ID using the bar code scanner
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>

                      {/* DETAILS + LOG TRAFFIC STRIP — Timestamp In, Timestamp Out, College,
                          Course, Year Level, all rendered as equal-sized, consistently styled
                          stat boxes using the same Poppins/bold styling as the "Patron
                          Information" header. Always shows the same five boxes (with
                          placeholders when empty) so the panel never resizes or shifts. */}
                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, width: '100%' }}>
                          {[
                            { label: 'Timestamp In', value: timeIn, active: !!timeIn, activeBg: '#f0fdf4', activeBorder: '#86efac', activeColor: '#15803d', icon: true },
                            { label: 'Timestamp Out', value: timeOut, active: !!timeOut, activeBg: '#fef2f2', activeBorder: '#fca5a5', activeColor: '#b91c1c', icon: true },
                            { label: 'College', value: formData.college, active: !!formData.college },
                            { label: 'Course', value: formData.course, active: !!formData.course },
                            { label: 'Year Level', value: formData.year, active: !!formData.year },
                          ].map((stat) => (
                            <Box
                              key={stat.label}
                              sx={{
                                flex: '1 1 0',
                                minWidth: 0,
                                p: 1.5,
                                borderRadius: 3,
                                bgcolor: stat.active ? (stat.activeBg || '#f8fafc') : '#f8fafc',
                                border: stat.active ? `1px solid ${stat.activeBorder}` : '1px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {stat.icon && (
                                <ScheduleIcon sx={{ color: stat.active ? stat.activeColor : '#94a3b8', fontSize: '1.1rem', flexShrink: 0 }} />
                              )}
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ display: 'block', fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: 0.5 }}>
                                  {stat.label}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: 'Poppins, sans-serif',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    color: stat.active ? (stat.activeColor || '#0f172a') : '#94a3b8',
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {stat.value || '—'}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                    </Paper>
                  </Box>
                </Box>
              </Box>

              {/* FOOTER ARTWORK BANNER: Stretches edge-to-edge seamlessly at the bottom */}
              <Box sx={{ width: '100%', mt: 'auto', display: 'block', lineHeight: 0 }}>
                <img
                  src={loginpic}
                  alt="Bahandian Banner"
                  style={{ width: '100%', height: '90', objectFit: 'fill' }}
                />
              </Box>

            </Box>
          )}
        </>
      )}
    </Header>
  );
};

export default Login;