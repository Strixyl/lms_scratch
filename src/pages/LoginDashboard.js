import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, CircularProgress,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, LinearProgress, Checkbox, IconButton, Snackbar, Alert, Tooltip, Chip,
  InputAdornment, TableSortLabel
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  FilterAlt as FilterAltIcon,
  Group as GroupIcon,
  AccountBalance as AccountBalanceIcon,
  LocationOn as LocationOnIcon,
  School as SchoolIcon,
  Delete as DeleteIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  WarningAmber as WarningAmberIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Lock as LockIcon,
  CalendarToday as CalendarTodayIcon,
  RestartAlt as RestartAltIcon,
  Inbox as InboxIcon
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Scatter
} from 'recharts';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { COLLEGE_OPTIONS, SECTION_OPTIONS, getCollegeGroup, formatDate } from '../constants/collegeMap';

const DONUT_GRADIENT_CSS = [
  'linear-gradient(135deg, #1a237e 0%, #0288d1 100%)',
  'linear-gradient(135deg, #2e7d32 0%, #81c784 100%)',
  'linear-gradient(135deg, #ed6c02 0%, #ffb74d 100%)',
  'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
  'linear-gradient(135deg, #c62828 0%, #ff8a80 100%)',
  'linear-gradient(135deg, #00796b 0%, #4db6ac 100%)',
  'linear-gradient(135deg, #192a96ff 0%, #7986cb 100%)',
  'linear-gradient(135deg, #e65100 0%, #ff9800 100%)',
];

const ALL_COLLEGES = COLLEGE_OPTIONS.filter(c => c !== 'All');

const COURSE_COLORS = [
  '#0288d1',
  '#2e7d32',
  '#ed6c02',
  '#7b1fa2',
  '#c62828',
  '#00796b',
  '#303f9f',
  '#d81b60',
  '#e65100',
  '#00897b',
  '#5c6bc0',
  '#26a69a',
  '#ff7043',
  '#ab47bc',
  '#42a5f5',
  '#66bb6a',
  '#ffa726',
  '#ec407a',
  '#78909c',
  '#0097a7'
];

const COURSE_LIGHT_COLORS = [
  '#38bdf8',
  '#4ade80',
  '#fb923c',
  '#c084fc',
  '#f87171',
  '#2dd4bf',
  '#818cf8',
  '#f472b6',
  '#ffb74d',
  '#5eead4',
  '#9fa8da',
  '#80cbc4',
  '#ffab91',
  '#e879f9',
  '#90caf9',
  '#a5d6a7',
  '#fde047',
  '#f48fb1',
  '#cbd5e1',
  '#67e8f9'
];

const selectSx = {
  backgroundColor: '#ffffff',
  borderRadius: 2.5,
  minWidth: 175,
  '& .MuiInputBase-root': {
    height: 46,
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    color: '#0f172a',
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    color: '#334155',
    '&.Mui-focused': {
      color: '#1a237e',
      fontWeight: 800,
    }
  },
  '& .MuiSelect-select': {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: 15,
  }
};

// ── Hover Tooltip Component listing all departments by library activity ─────────
const DepartmentsHoverList = ({ sortedColleges = [], totalEntries = 0 }) => {
  const activeColleges = sortedColleges.filter(c => c.total > 0);
  const inactiveColleges = sortedColleges.filter(c => c.total === 0);

  return (
    <Paper
      elevation={8}
      sx={{
        p: 2.2,
        bgcolor: '#ffffff',
        color: '#0f172a',
        borderRadius: 3.5,
        maxWidth: 340,
        width: 320,
        boxShadow: '0 20px 40px -10px rgba(26, 35, 126, 0.25)',
        border: '2px solid #1a237e'
      }}
    >
      <Box sx={{ pb: 1.2, mb: 1.5, borderBottom: '2px solid #e8eaf6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13.5, color: '#1a237e' }}>
          🏛️ Department Library Activity
        </Typography>
        <Chip
          label={`${activeColleges.length} Active`}
          size="small"
          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 11, bgcolor: '#1a237e15', color: '#1a237e', height: 22 }}
        />
      </Box>

      <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {activeColleges.length === 0 ? (
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#64748b' }}>
            No recorded department visits yet.
          </Typography>
        ) : (
          activeColleges.map((col, idx) => {
            const pct = totalEntries > 0 ? ((col.total / totalEntries) * 100).toFixed(1) : '0.0';
            return (
              <Box
                key={col.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  p: 1.2,
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#e8eaf6',
                    borderColor: '#1a237e'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 900, color: '#1a237e', width: 22 }}>
                    #{idx + 1}
                  </Typography>
                  <Typography noWrap sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                    {col.name}
                  </Typography>
                </Box>
                <Chip
                  label={`${col.total} (${pct}%)`}
                  size="small"
                  sx={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    bgcolor: '#1a237e',
                    color: '#ffffff',
                    height: 20,
                    flexShrink: 0,
                    ml: 1
                  }}
                />
              </Box>
            );
          })
        )}

        {inactiveColleges.length > 0 && (
          <Box sx={{ mt: 1, pt: 1.2, borderTop: '1.5px dashed #cbd5e1' }}>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: '#64748b', fontWeight: 700, mb: 0.5 }}>
              Inactive Departments (0 Visits):
            </Typography>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: '#94a3b8', lineHeight: 1.4, fontWeight: 500 }}>
              {inactiveColleges.map(c => c.name).join(', ')}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// ── Summary KPI Card (Styled matching reference dashboard design) ───────
const SummaryCard = ({ title, value, subtitle, icon, color = '#1a237e', tooltipContent = null }) => {
  const cardContent = (
    <Card elevation={0} sx={{
      borderRadius: 3.5,
      backgroundColor: '#ffffff',
      border: '1.5px solid #e2e8f0',
      flex: 1, minWidth: 180,
      p: 2.5,
      cursor: tooltipContent ? 'pointer' : 'default',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
        ...(tooltipContent && { borderColor: color })
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 50, height: 50, fontSize: 24 }}>
          {icon}
        </Avatar>
      </Box>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 34, color: '#0f172a', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#334155', mt: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, color: '#64748b', mt: 0.5, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );

  if (tooltipContent) {
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Box sx={{ flex: 1, minWidth: 180, display: 'flex' }}>
          {cardContent}
        </Box>
      </Tooltip>
    );
  }

  return cardContent;
};

// ── Item Chips Breakdown Component (UX alternative for low-density / 2-4 course filtering) ───────
const ItemChipsView = ({ data = [], totalVisits = 0, isCollegeLevel = false, selectedCollege = 'All' }) => {
  const maxVal = useMemo(() => Math.max(...data.map(d => d.total || 0), 1), [data]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, height: 340, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="textSecondary" sx={{ fontFamily: 'Poppins, sans-serif' }}>
          No data available for Item Chips view.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1, minHeight: 340 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Chip
          label={isCollegeLevel ? "Colleges Breakdown (Item Chips View)" : `Courses in ${selectedCollege} (Item Chips)`}
          size="small"
          sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', bgcolor: '#1d0a61', color: '#ffffff' }}
        />
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          Total Visits: <strong style={{ color: '#1a237e' }}>{totalVisits}</strong>
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {data.map((item, idx) => {
          const itemTotal = item.total || 0;
          const percentage = totalVisits > 0 ? ((itemTotal / totalVisits) * 100).toFixed(1) : '0.0';
          const progressVal = maxVal > 0 ? (itemTotal / maxVal) * 100 : 0;
          const color = COURSE_COLORS[idx % COURSE_COLORS.length];
          const lightColor = COURSE_LIGHT_COLORS[idx % COURSE_LIGHT_COLORS.length] || color;
          const title = item.fullName || item.name || `Item ${idx + 1}`;

          return (
            <Paper
              key={title + idx}
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 3,
                border: '1.5px solid #e2e8f0',
                bgcolor: '#ffffff',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  borderColor: color,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 20px -6px ${color}33`
                }
              }}
            >
              {/* Color accent bar on left */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 6, bgcolor: color }} />

              <Box sx={{ pl: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#0f172a', pr: 1, lineHeight: 1.3 }}>
                    {title}
                  </Typography>
                  <Chip
                    label={`${itemTotal} visits`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontFamily: 'Poppins, sans-serif',
                      bgcolor: `${color}15`,
                      color: color,
                      border: `1px solid ${color}40`,
                      fontSize: 12,
                      height: 24
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    Share of Foot Traffic
                  </Typography>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                    {percentage}%
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={progressVal}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${color} 0%, ${lightColor} 100%)`
                    }
                  }}
                />
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

// ── Suggestion 2: Lollipop / Dot Plot View ───────
const LollipopChartView = ({ data = [], selectedCollege = 'All' }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 4, height: 340, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="textSecondary" sx={{ fontFamily: 'Poppins, sans-serif' }}>
          No data available for Lollipop Chart view.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1, height: 340 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Chip
          label={selectedCollege === 'All' ? "Colleges Stem Dot Plot" : `Courses in ${selectedCollege} (Lollipop Chart)`}
          size="small"
          sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', bgcolor: '#ed6c02', color: '#ffffff' }}
        />
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" height={65} />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
          <RechartsTooltip content={<CustomBarTooltip />} />
          <Bar dataKey="total" barSize={4} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-lolly-${index}`} fill={COURSE_COLORS[index % COURSE_COLORS.length]} />
            ))}
          </Bar>
          <Scatter dataKey="total" fill="#f57c00" shape="circle" />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

// ── Dynamic Custom Tooltip for Stacked Bar Chart ──────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const activeItems = payload.filter(p => p.value > 0);
    const total = activeItems.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <Paper elevation={4} sx={{ p: 2, bgcolor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: 3, maxWidth: 360, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, color: '#1a237e', mb: 1.5, borderBottom: '1px solid #e2e8f0', pb: 1, fontSize: 14 }}>
          {label} — {total} Total Patron Visit{total > 1 ? 's' : ''}
        </Typography>

        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748b', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Course Breakdown & Color Key:
        </Typography>

        {activeItems.length === 0 ? (
          <Typography variant="body2" sx={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
            No visits recorded for this department.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 240, overflowY: 'auto' }}>
            {activeItems.map((item, idx) => {
              const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              const swatchColor = COURSE_COLORS[idx % COURSE_COLORS.length];
              const lightColor = COURSE_LIGHT_COLORS[idx % COURSE_LIGHT_COLORS.length];

              return (
                <Box key={idx} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #f1f5f9'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{
                      width: 14, height: 14, borderRadius: '4px',
                      background: `linear-gradient(135deg, ${swatchColor} 0%, ${lightColor} 100%)`,
                      boxShadow: `0 2px 6px ${swatchColor}60`,
                      flexShrink: 0
                    }} />
                    <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 800, color: swatchColor, ml: 2, flexShrink: 0 }}>
                    {item.value} ({percent}%)
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
    );
  }
  return null;
};

const ROWS_PER_PAGE = 10;

const COURSE_ACRONYMS_MAP = {
  'BSCS': ['bscs', 'bs cs', 'computer science', 'bs computer science', 'bachelor of science in computer science'],
  'BSIT': ['bsit', 'bs it', 'information technology', 'bs information technology', 'bachelor of science in information technology'],
  'BSDMIA': ['bsdmia', 'bs dmia', 'digital media', 'interactive arts', 'digital media and interactive arts'],
  'BLIS': ['blis', 'library science', 'library and information science'],
  'BSCE': ['bsce', 'civil engineering', 'civil'],
  'BSCHE': ['bsche', 'chemical engineering', 'chemical'],
  'BSEE': ['bsee', 'electrical engineering', 'electrical'],
  'BSECE': ['bsece', 'electronics engineering', 'electronics'],
  'BSME': ['bsme', 'mechanical engineering', 'mechanical'],
  'BSPKGE': ['bspkge', 'packaging engineering', 'packaging'],
  'BSSE': ['bsse', 'software engineering'],
  'BSA': ['bsa', 'bsacty', 'accountancy', 'agriculture'],
  'BSMA': ['bsma', 'management accounting'],
  'BSBA-HRM': ['bsbahrm', 'bsba-hrm', 'human resource'],
  'BSBA-FM': ['bsba-fm', 'bsbafm', 'financial management'],
  'BSBA-MM': ['bsbamm', 'bsba-mm', 'marketing management'],
  'BSENT': ['bsent', 'entrepreneurship'],
  'BSABE': ['bsabe', 'agricultural and biosystems'],
  'BSEM': ['bsem', 'environmental management'],
  'BSN': ['bsn', 'bsn - nursing', 'nursing'],
  'BSPHAR': ['bsphar', 'pharmacy'],
  'BSMLS': ['bsmls', 'medical laboratory', 'medical technology'],
  'JD': ['jd', 'juris doctor'],
  'BSRT': ['bsrt', 'respiratory therapy'],
  'MD': ['md', 'doctor of medicine'],
  'BTh': ['bth', 'theology'],
  'BSHM': ['bshm', 'bshrm', 'hospitality management'],
  'BSTM': ['bstm', 'tourism management']
};

const COLLEGE_COURSES_SURVEY_MAP = {
  'Faculty / Staff': ['Faculty Member', 'Staff Member'],
  CARES: ['BSA', 'BSABE', 'BSEM'],
  CAS: ['BAELS', 'BSBIO', 'BSCHEM', 'BSPSYC', 'BSSW'],
  CBA: ['BSA', 'BSMA', 'BSBA-HRM', 'BSBA-FM', 'BSBA-MM', 'BSENT'],
  CCS: ['BSCS', 'BSIT', 'BSDMIA', 'BLIS'],
  COED: ['BECED', 'BEED', 'BPED', 'BSED'],
  COE: ['BSCE', 'BSCHE', 'BSEE', 'BSECE', 'BSME', 'BSPKGE', 'BSSE'],
  CHM: ['BSHM', 'BSTM'],
  CMLS: ['BSMLS'],
  CON: ['BSN'],
  COP: ['BSPHAR'],
  COL: ['JD'],
  COM: ['BSRT', 'MD'],
  COT: ['BTh'],
  SGS: ['EdD', 'DM', 'DMin', 'MDiv', 'MBA', 'MPA', 'MAN', 'MSAgri'],
  SHS: ['STEM', 'ABM', 'HUMSS', 'GAS'],
  JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  ELEM: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  KINDER: ['Kinder', 'Pre Kinder', 'Junior Kinder']
};

const isCourseMatch = (studCourse, targetOption) => {
  if (!studCourse || !targetOption || targetOption === 'All') return true;

  const c = studCourse.trim().toLowerCase();
  const target = targetOption.trim().toLowerCase();

  // 1. Direct equality or substring match
  if (c === target || c.includes(target) || target.includes(c)) return true;

  // 2. Remove non-alphanumeric (e.g. "bs cs" vs "bscs")
  const cleanC = c.replace(/[^a-z0-9]/g, '');
  const cleanTarget = target.replace(/[^a-z0-9]/g, '');
  if (cleanC && cleanTarget && (cleanC.includes(cleanTarget) || cleanTarget.includes(cleanC))) return true;

  // 3. Check ACRONYMS map
  for (const [fullTitle, aliases] of Object.entries(COURSE_ACRONYMS_MAP)) {
    const titleLower = fullTitle.toLowerCase();
    const allMatches = [titleLower, ...aliases];

    const targetMatches = allMatches.some(m => target.includes(m) || m.includes(target));
    const studentMatches = allMatches.some(m => c === m || c.includes(m) || cleanC.includes(m.replace(/[^a-z0-9]/g, '')));

    if (targetMatches && studentMatches) return true;
  }

  return false;
};

// ── Strict College Course Isolation Helper ─────────────────────────────────
const getCoursesForCollege = (collegeCode, loginItems) => {
  if (!collegeCode || collegeCode === 'All') return [];
  const surveyCourses = COLLEGE_COURSES_SURVEY_MAP[collegeCode] || [];
  const normalizedSet = new Set(surveyCourses);

  loginItems.forEach(item => {
    const colGroup = getCollegeGroup(item.studCollege, item.studCourse, item.studLogType);
    if (colGroup === collegeCode && item.studCourse && item.studCourse.trim()) {
      const rawC = item.studCourse.trim();
      const isFaculty = rawC.toLowerCase().includes('faculty') || rawC.toLowerCase().includes('staff') || ((item.studLogType || '').toLowerCase().includes('faculty'));

      if (collegeCode !== 'Faculty / Staff' && isFaculty) return;

      let matchedAcronym = null;
      for (const acronym of surveyCourses) {
        if (isCourseMatch(rawC, acronym)) {
          matchedAcronym = acronym;
          break;
        }
      }

      if (matchedAcronym) {
        normalizedSet.add(matchedAcronym);
      } else {
        const rawGroup = getCollegeGroup('', rawC, item.studLogType);
        if (rawGroup === collegeCode || rawGroup === 'N/A') {
          normalizedSet.add(rawC);
        }
      }
    }
  });

  return Array.from(normalizedSet);
};

// Deduplicates logins so multiple logins by the same patron on the same day count as ONE entrance visit (100% Entrance).
// Includes all libraries (Senior High, Junior High, Elementary, Kindergarten, and Main Library).
const deduplicateLogins = (loginList) => {
  if (!loginList || !Array.isArray(loginList)) return [];

  const seenVisits = new Set();
  const result = [];

  loginList.forEach(item => {
    const datePart = item.TimeLogged ? String(item.TimeLogged).split(' ')[0] : 'nodate';
    const idNum = item.studIDnumber || item.studLname || 'noid';
    const visitKey = `${idNum}_${datePart}`;

    if (!seenVisits.has(visitKey)) {
      seenVisits.add(visitKey);
      result.push(item);
    }
  });

  return result;
};

const LoginDashboard = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [, setLoggedInUser] = useState('');

  const [rawLogins, setRawLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [page, setPage] = useState(0);
  const [hoveredCollege, setHoveredCollege] = useState(null);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [visualizerMode, setVisualizerMode] = useState('auto');

  // Live Search & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('TimeLogged');
  const [sortOrder, setSortOrder] = useState('desc');

  const printRef = useRef();

  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
      setLoggedInUser(savedUser);
      setShowLoginModal(false);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('loggedInUser', username);
      setLoggedInUser(username);
      setShowLoginModal(false);
      setLoginError('');
    } else {
      setLoginError('Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser('');
    setShowLoginModal(true);
    setUsername('');
    setPassword('');
  };

  const handleDatePreset = (presetKey) => {
    const today = new Date();
    const formatISO = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (presetKey === 'today') {
      const dateStr = formatISO(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (presetKey === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(today.setDate(diff));
      setStartDate(formatISO(startOfWeek));
      setEndDate(formatISO(new Date()));
    } else if (presetKey === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatISO(startOfMonth));
      setEndDate(formatISO(new Date()));
    } else if (presetKey === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleRemoveFilter = (key) => {
    if (key === 'date') {
      setStartDate('');
      setEndDate('');
    } else if (key === 'college') {
      setSelectedCollege('All');
    } else if (key === 'course') {
      setSelectedCourse('All');
    } else if (key === 'section') {
      setSelectedSection('All');
    } else if (key === 'search') {
      setSearchTerm('');
    }
  };

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const fetchLogins = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/logins');
      let data = response.data || [];

      data = data.filter(item => {
        const type = (item.studLogType || '').toLowerCase();
        return !type.includes('out');
      });

      setRawLogins(data);
    } catch (err) {
      console.error('Error fetching login analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setStartDate('');
    setEndDate('');
    setSelectedCollege('All');
    setSelectedSection('All');
    setSelectedCourse('All');
    setSearchTerm('');
    fetchLogins();
  };

  useEffect(() => {
    fetchLogins();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reactive Logins List (Dynamically Filtered & Deduplicated) ─────────
  const logins = useMemo(() => {
    let filtered = rawLogins;

    // Filter by Date Range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((item) => {
        if (!item.TimeLogged) return false;
        const [datePart] = String(item.TimeLogged).split(' ');
        const itemDate = new Date(datePart);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Filter by College
    if (selectedCollege && selectedCollege !== 'All') {
      filtered = filtered.filter(
        (item) => getCollegeGroup(item.studCollege, item.studCourse, item.studLogType) === selectedCollege
      );
    }

    // Filter by Section
    if (selectedSection && selectedSection !== 'All') {
      filtered = filtered.filter((item) => item.Section === selectedSection);
    }

    // Filter by Course
    if (selectedCourse && selectedCourse !== 'All') {
      filtered = filtered.filter((item) => isCourseMatch(item.studCourse, selectedCourse));
    }

    // Apply Henry Luce III Main Library entrance & section deduplication
    return deduplicateLogins(filtered);
  }, [rawLogins, startDate, endDate, selectedCollege, selectedSection, selectedCourse]);

  // Reset pagination to Page 1 when any filter or search changes
  useEffect(() => {
    setPage(0);
  }, [startDate, endDate, selectedCollege, selectedSection, selectedCourse, searchTerm]);

  // ── Dynamic Available Courses Options (Strict College Isolation) ─────────
  const availableCourses = useMemo(() => {
    if (!selectedCollege || selectedCollege === 'All') {
      return ['All'];
    }
    const courses = getCoursesForCollege(selectedCollege, rawLogins);
    return ['All', ...courses.sort()];
  }, [selectedCollege, rawLogins]);

  useEffect(() => {
    if (selectedCollege === 'All') {
      setSelectedCourse('All');
    } else if (selectedCourse !== 'All' && !availableCourses.includes(selectedCourse)) {
      setSelectedCourse('All');
    }
  }, [selectedCollege, availableCourses, selectedCourse]);

  // ── Computations for KPI Cards & Visual Charts ───────────────────────
  const totalEntries = logins.length;

  const { mainChartData, activeChartSeries, collegeChartData } = useMemo(() => {
    const collegeMap = {};
    ALL_COLLEGES.forEach(col => {
      collegeMap[col] = { total: 0 };
    });

    const coursesSet = new Set();
    logins.forEach((item) => {
      const col = getCollegeGroup(item.studCollege, item.studCourse, item.studLogType);
      const crs = item.studCourse && item.studCourse.trim() ? item.studCourse.trim() : 'Unspecified';
      coursesSet.add(crs);

      if (!collegeMap[col]) collegeMap[col] = { total: 0 };
      collegeMap[col][crs] = (collegeMap[col][crs] || 0) + 1;
      collegeMap[col].total += 1;
    });

    const colChartData = ALL_COLLEGES.map((col) => ({
      name: col,
      ...collegeMap[col],
    }));

    if (!selectedCollege || selectedCollege === 'All') {
      return {
        mainChartData: colChartData,
        activeChartSeries: Array.from(coursesSet),
        collegeChartData: colChartData
      };
    } else {
      // Specific College Selected -> Strictly get courses for this college ONLY!
      const allCourses = getCoursesForCollege(selectedCollege, logins);

      const courseCounts = {};
      allCourses.forEach(c => { courseCounts[c] = 0; });

      logins.forEach(item => {
        const itemGroup = getCollegeGroup(item.studCollege, item.studCourse, item.studLogType);
        if (itemGroup === selectedCollege) {
          const crs = item.studCourse ? item.studCourse.trim() : 'Unspecified';

          let matched = false;
          for (const target of allCourses) {
            if (isCourseMatch(crs, target)) {
              courseCounts[target] = (courseCounts[target] || 0) + 1;
              matched = true;
              break;
            }
          }
          if (!matched && allCourses.includes(crs)) {
            courseCounts[crs] = (courseCounts[crs] || 0) + 1;
          }
        }
      });

      const courseChartData = allCourses.map(crs => ({
        name: crs.length > 24 ? crs.substring(0, 22) + '...' : crs,
        fullName: crs,
        total: courseCounts[crs] || 0
      }));

      return {
        mainChartData: courseChartData,
        activeChartSeries: ['total'],
        collegeChartData: colChartData
      };
    }
  }, [selectedCollege, logins]);

  const sortedColleges = useMemo(() => {
    return [...collegeChartData].sort((a, b) => b.total - a.total);
  }, [collegeChartData]);

  const topCollege = sortedColleges.length > 0 && sortedColleges[0].total > 0 ? sortedColleges[0].name : 'N/A';
  const topCollegeCount = sortedColleges.length > 0 ? sortedColleges[0].total : 0;

  const effectiveMode = useMemo(() => {
    if (visualizerMode !== 'auto') return visualizerMode;
    if (selectedCollege !== 'All' && mainChartData.length >= 2 && mainChartData.length <= 4) {
      return 'chips';
    }
    return 'bar';
  }, [visualizerMode, selectedCollege, mainChartData.length]);

  // Section distribution for Section Pie Chart & Donut Visualizer (Filtered strictly by selected College, Course, Date Range)
  const { sectionChartData, donutSlices, collegeSectionTotal } = useMemo(() => {
    const sectionCounts = {};

    let listToCount = rawLogins;

    // Apply Date Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      listToCount = listToCount.filter((item) => {
        if (!item.TimeLogged) return false;
        const [datePart] = String(item.TimeLogged).split(' ');
        const itemDate = new Date(datePart);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Apply College Filter
    if (selectedCollege && selectedCollege !== 'All') {
      listToCount = listToCount.filter(
        (item) => getCollegeGroup(item.studCollege, item.studCourse, item.studLogType) === selectedCollege
      );
    }

    // Apply Course Filter
    if (selectedCourse && selectedCourse !== 'All') {
      listToCount = listToCount.filter((item) => isCourseMatch(item.studCourse, selectedCourse));
    }

    // Deduplicate logins for entrance & section accuracy
    const deduplicatedList = deduplicateLogins(listToCount);
    const collegeTotal = deduplicatedList.length;

    let internalSum = 0;
    deduplicatedList.forEach((item) => {
      const sec = item.Section ? item.Section.trim() : 'Entrance';
      if (sec.toLowerCase() !== 'entrance' && sec.toLowerCase() !== 'entrance only') {
        sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
        internalSum += 1;
      }
    });

    const entranceOnly = Math.max(0, collegeTotal - internalSum);

    const slices = [];
    if (entranceOnly > 0 || Object.keys(sectionCounts).length === 0) {
      slices.push({
        name: 'Entrance Only (No Section)',
        value: entranceOnly > 0 ? entranceOnly : (collegeTotal || 1),
        isEntranceOnly: true
      });
    }

    const internalList = Object.keys(sectionCounts)
      .map(sec => ({ name: sec, value: sectionCounts[sec] }))
      .filter(sec => sec.value > 0)
      .sort((a, b) => b.value - a.value);

    slices.push(...internalList);

    const fullList = [
      { name: 'Entrance ', value: collegeTotal, isBaseline: true },
      ...slices
    ];

    return { sectionChartData: fullList, donutSlices: slices, collegeSectionTotal: collegeTotal };
  }, [rawLogins, startDate, endDate, selectedCollege, selectedCourse]);

  const peakSection = sectionChartData.length > 0 ? sectionChartData[0].name : 'N/A';

  // Gender Distribution for Sidebar Widget
  const genderCounts = useMemo(() => {
    const counts = { Male: 0, Female: 0, Other: 0 };
    logins.forEach(item => {
      const g = (item.studGender || '').toLowerCase();
      if (g.includes('m')) counts.Male += 1;
      else if (g.includes('f')) counts.Female += 1;
      else counts.Other += 1;
    });
    return counts;
  }, [logins]);

  // Live Search & Table Column Sorting
  const processedLogins = useMemo(() => {
    let result = [...logins];

    // Live Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(item => {
        const id = String(item.studIDnumber || '').toLowerCase();
        const fname = String(item.studFname || '').toLowerCase();
        const lname = String(item.studLname || '').toLowerCase();
        const fullname = `${lname}, ${fname}`.toLowerCase();
        const course = String(item.studCourse || '').toLowerCase();
        const college = String(item.studCollege || '').toLowerCase();
        const section = String(item.Section || '').toLowerCase();
        return id.includes(q) || fname.includes(q) || lname.includes(q) || fullname.includes(q) || course.includes(q) || college.includes(q) || section.includes(q);
      });
    }

    // Column Sorting
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'TimeLogged') {
        valA = a.TimeLogged ? new Date(a.TimeLogged).getTime() : 0;
        valB = b.TimeLogged ? new Date(b.TimeLogged).getTime() : 0;
      } else if (sortField === 'name') {
        valA = `${a.studLname || ''}, ${a.studFname || ''}`.toLowerCase();
        valB = `${b.studLname || ''}, ${b.studFname || ''}`.toLowerCase();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [logins, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedLogins.length / ROWS_PER_PAGE);
  const pageRows = processedLogins.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // ── Record Selection & Delete Handlers ─────────────────────────────
  const pageIds = useMemo(() => pageRows.map(row => row.LogID).filter(Boolean), [pageRows]);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every(id => selectedLogIds.includes(id));
  const isSomePageSelected = pageIds.some(id => selectedLogIds.includes(id)) && !isAllPageSelected;

  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      setSelectedLogIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedLogIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleToggleSelectRow = (id) => {
    if (!id) return;
    setSelectedLogIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openDeleteSingleDialog = (row) => {
    setRecordToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const openDeleteBatchDialog = () => {
    setRecordToDelete(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (recordToDelete) {
        await axios.delete(`http://localhost:5000/api/logins/${recordToDelete.LogID}`);
        setSnackbarMsg('Login record deleted successfully.');
        setSelectedLogIds(prev => prev.filter(id => id !== recordToDelete.LogID));
      } else if (selectedLogIds.length > 0) {
        await axios.post('http://localhost:5000/api/logins/delete-batch', { ids: selectedLogIds });
        setSnackbarMsg(`${selectedLogIds.length} login records deleted successfully.`);
        setSelectedLogIds([]);
      }
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      fetchLogins();
    } catch (err) {
      console.error('Error deleting login record:', err);
      if (recordToDelete) {
        setRawLogins(prev => prev.filter(r => r.LogID !== recordToDelete.LogID));
        setSnackbarMsg('Record removed locally.');
      } else if (selectedLogIds.length > 0) {
        setRawLogins(prev => prev.filter(r => !selectedLogIds.includes(r.LogID)));
        setSelectedLogIds([]);
        setSnackbarMsg('Selected records removed locally.');
      }
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Excel Export Handler ──────────────────────────────────────────────
  const handleExportExcel = () => {
    if (logins.length === 0) {
      alert('No entry data available to export for the selected criteria.');
      return;
    }

    const summaryKPIs = [
      { 'Analytics Metric': 'Total Filtered Library Visits', 'Count': totalEntries },
      { 'Analytics Metric': 'Top Visiting College / Dept', 'Count': `${topCollege} (${topCollegeCount} entries)` },
      { 'Analytics Metric': 'Peak Visited Library Section', 'Count': peakSection },
      { 'Analytics Metric': 'Date Range Filter Applied', 'Count': startDate && endDate ? `${startDate} to ${endDate}` : 'All Dates' },
      { 'Analytics Metric': 'College Filter Applied', 'Count': selectedCollege },
      { 'Analytics Metric': 'Course Filter Applied', 'Count': selectedCourse },
      { 'Analytics Metric': 'Section Filter Applied', 'Count': selectedSection }
    ];

    const detailedLogs = logins.map((row, idx) => ({
      'No.': idx + 1,
      'ID Number': row.studIDnumber || 'N/A',
      'Last Name': row.studLname || '',
      'First Name': row.studFname || '',
      'Course': row.studCourse || 'N/A',
      'Year': row.studYear || 'N/A',
      'College/Department': row.studCollege || 'N/A',
      'Library Section': row.Section || 'N/A',
      'Time Logged': formatDate(row.TimeLogged),
      'Log Type': row.studLogType || 'In',
      'Gender': row.studGender || ''
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryKPIs);
    const wsLogs = XLSX.utils.json_to_sheet(detailedLogs);

    const adjustWidths = (ws, data) => {
      const colWidths = [];
      data.forEach(row => {
        Object.keys(row).forEach((key, colIdx) => {
          const valStr = row[key] ? row[key].toString() : '';
          const maxLen = Math.max(valStr.length, key.length);
          if (!colWidths[colIdx] || maxLen > colWidths[colIdx]) {
            colWidths[colIdx] = maxLen;
          }
        });
      });
      ws['!cols'] = colWidths.map(w => ({ wch: w + 4 }));
    };

    adjustWidths(wsSummary, summaryKPIs);
    adjustWidths(wsLogs, detailedLogs);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Analytics Summary');
    XLSX.utils.book_append_sheet(workbook, wsLogs, 'Visitor Log Records');

    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `HLL_Entry_Analytics_${selectedCollege}_${dateStamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // ── Print Handler ────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!printRef.current) return;
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
          <title>Library Entry Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #000; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 4px; color: #1a237e; }
            h2 { text-align: center; font-size: 15px; font-weight: normal; margin-bottom: 6px; color: #444; }
            p.daterange { text-align: center; font-size: 13px; color: #666; margin-bottom: 20px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 24px; gap: 12px; }
            .summary-box { border: 1px solid #1a237e; border-radius: 8px; padding: 12px 20px; text-align: center; flex: 1; background-color: #f8f9fa; }
            .summary-box .value { font-size: 24px; font-weight: bold; color: #1a237e; }
            .summary-box .label { font-size: 11px; color: #555; margin-top: 4px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background-color: #1a237e; color: white; padding: 8px; text-align: left; }
            td { padding: 6px 8px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .footer { margin-top: 25px; text-align: center; font-size: 11px; color: #888; }
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

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Entry Analytics Dashboard" onMenuClick={toggleDrawer} subtitle="DEPARTMENTAL & ENTRY VISITOR ANALYTICS" />

            {!showLoginModal && (
              <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                {/* ── Welcome Header Bar (Reflects modern dashboard banner) ───── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                      Henry Luce III Library Log-In Dashboard
                    </Typography>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#475569', fontWeight: 500, mt: 0.5 }}>
                      Departmental foot traffic, section distribution, and patron entry analytics
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handlePrint}
                      startIcon={<PrintIcon />}
                      sx={{
                        borderRadius: 2.5,
                        height: 48,
                        px: 3.5,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 15,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 }
                      }}
                    >
                      Print / Save PDF
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleExportExcel}
                      startIcon={<FileDownloadIcon />}
                      sx={{
                        borderRadius: 2.5,
                        height: 48,
                        px: 3.5,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 15,
                        fontWeight: 700,
                        textTransform: 'none',
                        bgcolor: '#1b5e20',
                        boxShadow: '0 4px 14px rgba(27, 94, 32, 0.3)',
                        '&:hover': { bgcolor: '#144617' }
                      }}
                    >
                      Export to Excel
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleLogout}
                      startIcon={<LogoutIcon />}
                      sx={{
                        borderRadius: 2.5,
                        height: 48,
                        px: 3,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 14,
                        fontWeight: 700,
                        textTransform: 'none'
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                </Box>

                {/* ── Filter Controls Container (Styled matching Book Catalogue page header) ───── */}
                <Paper elevation={0} sx={{ mb: 3, borderRadius: 3.5, border: '1.5px solid #cbd5e1', bgcolor: '#ffffff', overflow: 'hidden' }}>
                  <Box sx={{
                    bgcolor: '#1d0a61',
                    px: 3, py: 1.8,
                    borderBottom: '3px solid #f57c00',
                    display: 'flex', alignItems: 'center', gap: 1.2
                  }}>
                    <FilterAltIcon sx={{ fontSize: 22, color: '#ffffff' }} />
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: 0.3 }}>
                      Filter & Analytics Controls
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      sx={selectSx}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      sx={selectSx}
                    />
                    <FormControl sx={selectSx}>
                      <InputLabel>College/Dept</InputLabel>
                      <Select
                        value={selectedCollege}
                        label="College/Dept"
                        onChange={(e) => setSelectedCollege(e.target.value)}
                      >
                        {COLLEGE_OPTIONS.map((c) => (
                          <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx} disabled={selectedCollege === 'All'}>
                      <InputLabel>
                        {selectedCollege === 'All' ? 'Course (Select College)' : 'Course'}
                      </InputLabel>
                      <Select
                        value={selectedCourse}
                        label={selectedCollege === 'All' ? 'Course (Select College)' : 'Course'}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={selectedCollege === 'All'}
                      >
                        {availableCourses.map((crs) => (
                          <MenuItem key={crs} value={crs} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{crs}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={selectSx}>
                      <InputLabel>Library Section</InputLabel>
                      <Select
                        value={selectedSection}
                        label="Library Section"
                        onChange={(e) => setSelectedSection(e.target.value)}
                      >
                        {SECTION_OPTIONS.map((s) => (
                          <MenuItem key={s} value={s} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14 }}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button variant="contained" onClick={fetchLogins} sx={{ bgcolor: '#1a237e', px: 3.5, height: 46, borderRadius: 2.5, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15 }}>
                      Apply Filters
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={handleClearFilters} startIcon={<RestartAltIcon />} sx={{ height: 46, px: 3, borderRadius: 2.5, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, borderColor: '#cbd5e1' }}>
                      Reset
                    </Button>
                  </Box>

                  {/* ── Quick Date Range Presets Bar ───── */}
                  <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#64748b', mr: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: '#1a237e' }} /> Quick Date Presets:
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('today')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#1e293b' }}>
                      Today
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('week')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#1e293b' }}>
                      This Week
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('month')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#1e293b' }}>
                      This Month
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleDatePreset('all')} sx={{ borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, borderColor: '#cbd5e1', color: '#1e293b' }}>
                      All Dates
                    </Button>
                  </Box>

                  {/* ── Active Filter Badges Bar (Removable Tags) ───── */}
                  {(startDate || endDate || selectedCollege !== 'All' || selectedCourse !== 'All' || selectedSection !== 'All' || searchTerm) && (
                    <Box sx={{ px: 3, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                        Active Filters:
                      </Typography>
                      {(startDate || endDate) && (
                        <Chip
                          label={`Date: ${startDate || 'Start'} to ${endDate || 'Now'}`}
                          onDelete={() => handleRemoveFilter('date')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, bgcolor: '#e0e7ff', color: '#3730a3', fontSize: 12 }}
                        />
                      )}
                      {selectedCollege !== 'All' && (
                        <Chip
                          label={`College: ${selectedCollege}`}
                          onDelete={() => handleRemoveFilter('college')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, bgcolor: '#dcfce7', color: '#166534', fontSize: 12 }}
                        />
                      )}
                      {selectedCourse !== 'All' && (
                        <Chip
                          label={`Course: ${selectedCourse}`}
                          onDelete={() => handleRemoveFilter('course')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, bgcolor: '#fef3c7', color: '#92400e', fontSize: 12 }}
                        />
                      )}
                      {selectedSection !== 'All' && (
                        <Chip
                          label={`Section: ${selectedSection}`}
                          onDelete={() => handleRemoveFilter('section')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, bgcolor: '#f3e8ff', color: '#6b21a8', fontSize: 12 }}
                        />
                      )}
                      {searchTerm && (
                        <Chip
                          label={`Search: "${searchTerm}"`}
                          onDelete={() => handleRemoveFilter('search')}
                          size="small"
                          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, bgcolor: '#e0f2fe', color: '#075985', fontSize: 12 }}
                        />
                      )}
                      <Button size="small" onClick={handleClearFilters} sx={{ textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: '#dc2626', ml: 'auto' }}>
                        Clear All
                      </Button>
                    </Box>
                  )}
                </Paper>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <>
                    {/* ── Top Metric Cards Grid (Matching reference layout) ───── */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      <SummaryCard
                        title="Total Patron Visits"
                        value={totalEntries}
                        subtitle={selectedCollege !== 'All' ? `Filtered by ${selectedCollege}` : 'All departments included'}
                        icon={<GroupIcon sx={{ fontSize: 28 }} />}
                        color="#1a237e"
                      />
                      <SummaryCard
                        title="Top Visiting College/Department"
                        value={topCollege}
                        subtitle={`${topCollegeCount} Total Logged Entries`}
                        icon={<AccountBalanceIcon sx={{ fontSize: 28 }} />}
                        color="#2e7d32"
                      />
                      <SummaryCard
                        title="Peak Library Section"
                        value={peakSection}
                        subtitle="Highest Foot Traffic Location"
                        icon={<LocationOnIcon sx={{ fontSize: 28 }} />}
                        color="#ed6c02"
                      />
                      <SummaryCard
                        title="Active Departments"
                        value={collegeChartData.filter(c => c.total > 0).length}
                        subtitle="Hover to view all department activity"
                        icon={<SchoolIcon sx={{ fontSize: 28 }} />}
                        color="#0288d1"
                        tooltipContent={<DepartmentsHoverList sortedColleges={sortedColleges} totalEntries={totalEntries} />}
                      />
                    </Box>

                    {/* ── Middle Visualizer Section (Layout matching reference image: Main Chart + Side Donut) ── */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                      {/* Left: Main Visualizer Bar Chart (~70% width) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 3, minWidth: 480 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#1e293b' }}>
                              {selectedCollege === 'All'
                                ? 'Visits by College & Course Breakdown'
                                : `Available Course Foot Traffic (${selectedCollege})`}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#94a3b8' }}>
                              {selectedCollege === 'All'
                                ? 'Hover over any bar or switch view modes'
                                : `Comparing student foot traffic across available courses in ${selectedCollege}`}
                            </Typography>
                          </Box>

                          {/* Visualizer Mode Select Dropdown (All 4 Suggestions) */}
                          <FormControl size="small" sx={{ minWidth: 210 }}>
                            <InputLabel id="visualizer-mode-select-label" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#1a237e' }}>
                              Visualization View
                            </InputLabel>
                            <Select
                              labelId="visualizer-mode-select-label"
                              value={effectiveMode}
                              label="Visualization View"
                              onChange={(e) => setVisualizerMode(e.target.value)}
                              sx={{
                                height: 40,
                                borderRadius: 2.5,
                                bgcolor: '#ffffff',
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 700,
                                fontSize: 13,
                                color: '#0f172a',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1', borderWidth: 1.5 },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1a237e' }
                              }}
                            >
                              <MenuItem value="bar" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>
                                📊 Standard Bar Chart
                              </MenuItem>
                              <MenuItem value="chips" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>
                                🏷️ Item Chips View
                              </MenuItem>
                              <MenuItem value="lollipop" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13 }}>
                                🍭 Lollipop View
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        {effectiveMode === 'chips' ? (
                          <ItemChipsView
                            data={mainChartData}
                            totalVisits={totalEntries}
                            isCollegeLevel={selectedCollege === 'All'}
                            selectedCollege={selectedCollege}
                          />
                        ) : effectiveMode === 'lollipop' ? (
                          <LollipopChartView
                            data={mainChartData}
                            selectedCollege={selectedCollege}
                          />
                        ) : (
                          <ResponsiveContainer width="100%" height={360}>
                            <BarChart
                              data={mainChartData}
                              maxBarSize={45}
                              onMouseMove={(state) => {
                                if (state && state.activeLabel) {
                                  setHoveredCollege(state.activeLabel);
                                } else {
                                  setHoveredCollege(null);
                                }
                              }}
                              onMouseLeave={() => setHoveredCollege(null)}
                            >
                              <defs>
                                <linearGradient id="barDefaultGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#1a237e" />
                                  <stop offset="100%" stopColor="#0288d1" />
                                </linearGradient>

                                {COURSE_COLORS.map((col, idx) => (
                                  <linearGradient key={`barCourseGrad_${idx}`} id={`barCourseGrad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={col} />
                                    <stop offset="100%" stopColor={COURSE_LIGHT_COLORS[idx % COURSE_LIGHT_COLORS.length] || col} />
                                  </linearGradient>
                                ))}
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" height={65} />
                              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                              <RechartsTooltip content={<CustomBarTooltip />} />
                              {activeChartSeries.map((course, courseIndex) => {
                                const isTopCourse = courseIndex === activeChartSeries.length - 1;
                                return (
                                  <Bar
                                    key={course}
                                    dataKey={selectedCollege === 'All' ? course : 'total'}
                                    stackId={selectedCollege === 'All' ? 'a' : undefined}
                                    maxBarSize={45}
                                    radius={isTopCourse ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                                  >
                                    {mainChartData.map((entry, index) => {
                                      const isHovered = hoveredCollege === entry.name;
                                      const fillColor = isHovered
                                        ? `url(#barCourseGrad_${courseIndex % COURSE_COLORS.length})`
                                        : '#5542f6';
                                      return <Cell key={`cell-${index}`} fill={fillColor} stroke="none" strokeWidth={0} />;
                                    })}
                                  </Bar>
                                );
                              })}
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Paper>

                      {/* Right: Section Donut Chart + Side Legends (~30% width matching reference card) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 1.4, minWidth: 280, display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, mb: 1, color: '#1e293b' }}>
                          Traffic by Library Section {selectedCollege !== 'All' ? `(${selectedCollege})` : ''}
                        </Typography>
                        {sectionChartData.length === 0 ? (
                          <Typography color="textSecondary" sx={{ py: 6, textAlign: 'center' }}>No section data available.</Typography>
                        ) : (
                          <>
                            <Box sx={{ position: 'relative', height: 220 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <defs>
                                    <linearGradient id="donutGrad0" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#1a237e" />
                                      <stop offset="100%" stopColor="#0288d1" />
                                    </linearGradient>
                                    <linearGradient id="donutGrad1" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#2e7d32" />
                                      <stop offset="100%" stopColor="#81c784" />
                                    </linearGradient>
                                    <linearGradient id="donutGrad2" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#ed6c02" />
                                      <stop offset="100%" stopColor="#ffb74d" />
                                    </linearGradient>
                                    <linearGradient id="donutGrad3" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#7b1fa2" />
                                      <stop offset="100%" stopColor="#ba68c8" />
                                    </linearGradient>
                                    <linearGradient id="donutGrad4" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#c62828" />
                                      <stop offset="100%" stopColor="#ff8a80" />
                                    </linearGradient>
                                    <linearGradient id="donutGrad5" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#00796b" />
                                      <stop offset="100%" stopColor="#4db6ac" />
                                    </linearGradient>
                                    <linearGradient id="donutGrad6" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#303f9f" />
                                      <stop offset="100%" stopColor="#7986cb" />
                                    </linearGradient>
                                    <linearGradient id="donutGrad7" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor="#e65100" />
                                      <stop offset="100%" stopColor="#ff9800" />
                                    </linearGradient>
                                  </defs>
                                  <Pie
                                    data={donutSlices}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    dataKey="value"
                                    paddingAngle={4}
                                    cornerRadius={4}
                                  >
                                    {donutSlices.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#donutGrad${index % DONUT_GRADIENT_CSS.length})`}
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                      />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                              {/* Center Donut Label */}
                              <Box sx={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)', textAlign: 'center'
                              }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 22, color: '#1e293b', lineHeight: 1 }}>
                                  {collegeSectionTotal}
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                                  {selectedCollege !== 'All' ? `${selectedCollege} Visits` : 'Total Visits'}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Custom Legend Pill List matching reference image */}
                            <Box sx={{
                              mt: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 170, overflowY: 'auto', pr: 1.5,
                              '&::-webkit-scrollbar': { width: '5px' },
                              '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9', borderRadius: '4px' },
                              '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px', '&:hover': { backgroundColor: '#94a3b8' } }
                            }}>
                              {sectionChartData.map((sec, idx) => {
                                const isBaseline = sec.isBaseline;
                                const isEntranceOnly = sec.isEntranceOnly;
                                const pct = isBaseline
                                  ? '100.0'
                                  : collegeSectionTotal > 0
                                    ? ((sec.value / collegeSectionTotal) * 100).toFixed(1)
                                    : '0.0';

                                return (
                                  <Box key={sec.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                      <Box sx={{
                                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                        background: isBaseline ? '#1a237e' : DONUT_GRADIENT_CSS[(idx - 1) % DONUT_GRADIENT_CSS.length]
                                      }} />
                                      <Typography noWrap sx={{
                                        fontFamily: 'Poppins, sans-serif', fontSize: 12,
                                        fontWeight: isBaseline ? 800 : (isEntranceOnly ? 700 : 500),
                                        color: isBaseline ? '#1a237e' : (isEntranceOnly ? '#0288d1' : '#334155')
                                      }}>
                                        {sec.name}
                                      </Typography>
                                    </Box>
                                    <Typography sx={{
                                      fontFamily: 'Poppins, sans-serif', fontSize: 12,
                                      fontWeight: 700, flexShrink: 0,
                                      color: isBaseline ? '#1a237e' : (isEntranceOnly ? '#0288d1' : '#64748b')
                                    }}>
                                      {pct}% ({sec.value})
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          </>
                        )}
                      </Paper>
                    </Box>

                    {/* ── Bottom Section (Layout matching reference image: Table + Sidebar Breakdown) ────── */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {/* Left: Detailed Visitor Entry Records Table (~70% width) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 3, minWidth: 480 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#1e293b' }}>
                            Detailed Visitor Entry Records ({processedLogins.length} Matches)
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* 🔍 Live Search Input */}
                            <TextField
                              size="small"
                              placeholder="Search name, ID, course, section..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(0);
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
                                  </InputAdornment>
                                ),
                                endAdornment: searchTerm ? (
                                  <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                      <ClearIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </InputAdornment>
                                ) : null,
                              }}
                              sx={{
                                minWidth: 260,
                                bgcolor: '#f8fafc',
                                borderRadius: 2.5,
                                '& .MuiOutlinedInput-root': {
                                  height: 40,
                                  fontFamily: 'Poppins, sans-serif',
                                  fontSize: 13,
                                  borderRadius: 2.5,
                                }
                              }}
                            />
                            {selectedLogIds.length > 0 && (
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={openDeleteBatchDialog}
                                startIcon={<DeleteIcon />}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontFamily: 'Poppins, sans-serif', height: 40 }}
                              >
                                Delete Selected ({selectedLogIds.length})
                              </Button>
                            )}
                          </Box>
                        </Box>

                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{
                                backgroundColor: '#1d0a61',
                                borderBottom: '3px solid #f57c00',
                                '& th': {
                                  color: 'white',
                                  fontWeight: 700,
                                  fontFamily: 'Poppins, sans-serif',
                                  fontSize: 13,
                                  py: 1.5,
                                  borderRight: '1px solid rgba(255, 255, 255, 0.25)',
                                  '&:last-child': { borderRight: 'none' }
                                }
                              }}>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    size="small"
                                    checked={isAllPageSelected}
                                    indeterminate={isSomePageSelected}
                                    onChange={handleSelectAllOnPage}
                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' } }}
                                  />
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel
                                    active={sortField === 'studIDnumber'}
                                    direction={sortField === 'studIDnumber' ? sortOrder : 'asc'}
                                    onClick={() => handleRequestSort('studIDnumber')}
                                    sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                  >
                                    ID Number
                                  </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel
                                    active={sortField === 'name'}
                                    direction={sortField === 'name' ? sortOrder : 'asc'}
                                    onClick={() => handleRequestSort('name')}
                                    sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                  >
                                    Name
                                  </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel
                                    active={sortField === 'studCourse'}
                                    direction={sortField === 'studCourse' ? sortOrder : 'asc'}
                                    onClick={() => handleRequestSort('studCourse')}
                                    sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                  >
                                    Course & Year
                                  </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel
                                    active={sortField === 'studCollege'}
                                    direction={sortField === 'studCollege' ? sortOrder : 'asc'}
                                    onClick={() => handleRequestSort('studCollege')}
                                    sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                  >
                                    College / Dept
                                  </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>Section</TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  <TableSortLabel
                                    active={sortField === 'TimeLogged'}
                                    direction={sortField === 'TimeLogged' ? sortOrder : 'asc'}
                                    onClick={() => handleRequestSort('TimeLogged')}
                                    sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                  >
                                    Time Logged
                                  </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>Gender</TableCell>
                                <TableCell sx={{ textAlign: 'center', color: 'white' }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pageRows.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                      <Avatar sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', width: 54, height: 54 }}>
                                        <InboxIcon sx={{ fontSize: 32 }} />
                                      </Avatar>
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: '#334155', mt: 1 }}>
                                        No entrance login records found
                                      </Typography>
                                      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b', maxWidth: 360 }}>
                                        {searchTerm
                                          ? `No patron records matching search "${searchTerm}".`
                                          : 'Try adjusting your date range or filter selections to view visitor entry data.'}
                                      </Typography>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={handleClearFilters}
                                        startIcon={<RestartAltIcon />}
                                        sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}
                                      >
                                        Clear All Filters
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                pageRows.map((row, i) => {
                                  const isSelected = selectedLogIds.includes(row.LogID);
                                  const genderStr = (row.studGender || '').toLowerCase();
                                  const isMale = genderStr.includes('m') && !genderStr.includes('fe');
                                  const isFemale = genderStr.includes('f');

                                  return (
                                    <TableRow
                                      key={row.LogID || i}
                                      hover
                                      selected={isSelected}
                                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                      <TableCell padding="checkbox">
                                        <Checkbox
                                          size="small"
                                          checked={isSelected}
                                          onChange={() => handleToggleSelectRow(row.LogID)}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#334155', fontWeight: 600 }}>{row.studIDnumber || 'N/A'}</TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                        {`${row.studLname || ''}, ${row.studFname || ''}`}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#475569' }}>
                                        {`${row.studCourse || 'N/A'} - ${row.studYear || ''}`}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#1a237e' }}>
                                        {row.studCollege || 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={row.Section || 'Entrance'}
                                          size="small"
                                          sx={{
                                            fontFamily: 'Poppins, sans-serif',
                                            fontWeight: 700,
                                            fontSize: 11,
                                            bgcolor: '#e0f2fe',
                                            color: '#0369a1',
                                            height: 22
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b' }}>{formatDate(row.TimeLogged)}</TableCell>
                                      <TableCell>
                                        {isMale ? (
                                          <Chip
                                            icon={<MaleIcon sx={{ fontSize: '16px !important', color: '#0288d1 !important' }} />}
                                            label="Male"
                                            size="small"
                                            sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, bgcolor: '#e0f2fe', color: '#0288d1', height: 22 }}
                                          />
                                        ) : isFemale ? (
                                          <Chip
                                            icon={<FemaleIcon sx={{ fontSize: '16px !important', color: '#7b1fa2 !important' }} />}
                                            label="Female"
                                            size="small"
                                            sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, bgcolor: '#fdf4ff', color: '#7b1fa2', height: 22 }}
                                          />
                                        ) : (
                                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#94a3b8' }}>
                                            {row.studGender || 'N/A'}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Tooltip title="Delete Record">
                                          <IconButton size="small" color="error" onClick={() => openDeleteSingleDialog(row)}>
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5 }}>
                            <Typography sx={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                              Showing Page {page + 1} of {totalPages} ({processedLogins.length} Total Records)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                sx={{ borderRadius: 1.5, textTransform: 'none' }}
                              >
                                Previous
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                sx={{ borderRadius: 1.5, textTransform: 'none' }}
                              >
                                Next
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Paper>

                      {/* Right: Demographic Breakdown Widget (~30% width matching reference image) */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', flex: 1.4, minWidth: 280 }}>
                        <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, mb: 2, color: '#1e293b' }}>
                          Top Departments & Gender Breakdown
                        </Typography>

                        {/* Top Colleges Progress List */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Top Department Traffic (Top 5)
                            </Typography>
                            <Tooltip title={<DepartmentsHoverList sortedColleges={sortedColleges} totalEntries={totalEntries} />} arrow placement="left">
                              <Chip
                                label="View All Activity"
                                size="small"
                                sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 10, bgcolor: '#e0f2fe', color: '#0369a1', cursor: 'pointer', height: 20 }}
                              />
                            </Tooltip>
                          </Box>

                          {sortedColleges.slice(0, 5).map((col, idx) => {
                            const pct = totalEntries > 0 ? (col.total / totalEntries) * 100 : 0;
                            return (
                              <Box key={col.name} sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                    #{idx + 1} {col.name}
                                  </Typography>
                                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                                    {col.total} visits ({pct.toFixed(0)}%)
                                  </Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#1a237e', borderRadius: 3 } }} />
                              </Box>
                            );
                          })}

                          {/* Others Hover Trigger Badge */}
                          {sortedColleges.length > 5 && (
                            <Tooltip title={<DepartmentsHoverList sortedColleges={sortedColleges} totalEntries={totalEntries} />} arrow placement="top">
                              <Box sx={{
                                mt: 1.5, p: 1.2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1.5px dashed #cbd5e1',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                                transition: 'all 0.2s ease', '&:hover': { bgcolor: '#e0f2fe', borderColor: '#0288d1' }
                              }}>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: '#1a237e' }}>
                                  + {sortedColleges.length - 5} Other Departments
                                </Typography>
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                                  Hover for full list ➔
                                </Typography>
                              </Box>
                            </Tooltip>
                          )}
                        </Box>

                        {/* Gender Demographics List */}
                        <Box>
                          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, color: '#64748b', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Patron Gender Split
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2.5, bgcolor: '#f0f9ff', border: '1.5px solid #bae6fd' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                <MaleIcon sx={{ fontSize: 24, color: '#0288d1' }} />
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Male Visitors</Typography>
                              </Box>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 900, color: '#0288d1' }}>{genderCounts.Male}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2.5, bgcolor: '#fdf4ff', border: '1.5px solid #f5d0fe' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                <FemaleIcon sx={{ fontSize: 24, color: '#7b1fa2' }} />
                                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Female Visitors</Typography>
                              </Box>
                              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 900, color: '#7b1fa2' }}>{genderCounts.Female}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Header>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#c62828' }}>
          Confirm Record Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#334155' }}>
            {recordToDelete ? (
              <>Are you sure you want to delete the visitor entry for <strong>{recordToDelete.studLname}, {recordToDelete.studFname}</strong> (ID: {recordToDelete.studIDnumber || 'N/A'})?</>
            ) : (
              <>Are you sure you want to delete <strong>{selectedLogIds.length}</strong> selected login record(s)?</>
            )}
          </Typography>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#dc2626', mt: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 18 }} /> This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Record(s)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Toast Feedback */}
      <Snackbar
        open={Boolean(snackbarMsg)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSnackbarMsg('')} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>

      {/* 👇 Admin Login Dialog (Polished Glassmorphism & Branding) */}
      {showLoginModal && (
        <Dialog
          open={true}
          PaperProps={{
            sx: {
              borderRadius: 4,
              p: 1,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              border: '1.5px solid #cbd5e1',
              bgcolor: '#ffffff'
            }
          }}
          slotProps={{
            backdrop: {
              sx: {
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(15, 23, 42, 0.65)'
              }
            }
          }}
        >
          <Box sx={{ textAlign: 'center', pt: 3, px: 3 }}>
            <Avatar sx={{ bgcolor: '#1d0a61', color: '#f57c00', width: 56, height: 56, mx: 'auto', mb: 1.5, boxShadow: '0 8px 20px rgba(29, 10, 97, 0.3)' }}>
              <LockIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#0f172a' }}>
              Admin Verification
            </Typography>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b', mt: 0.5 }}>
              Please enter your administrator credentials to access the Henry Luce III Library Analytics Dashboard.
            </Typography>
          </Box>
          <DialogContent sx={{ p: 3 }}>
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                margin="dense"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontFamily: 'Poppins, sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: 'Poppins, sans-serif' }
                }}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontFamily: 'Poppins, sans-serif' },
                  '& .MuiInputLabel-root': { fontFamily: 'Poppins, sans-serif' }
                }}
              />
              {loginError && (
                <Typography color="error" fontSize={13} fontWeight={600} mt={1} textAlign="center" sx={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loginError}
                </Typography>
              )}
              <Button
                variant="contained"
                fullWidth
                type="submit"
                sx={{
                  mt: 2.5,
                  height: 46,
                  borderRadius: 2.5,
                  bgcolor: '#1d0a61',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(29, 10, 97, 0.3)',
                  '&:hover': { bgcolor: '#140647' }
                }}
              >
                Login to Dashboard
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  mt: 1.5,
                  height: 44,
                  borderRadius: 2.5,
                  color: '#475569',
                  borderColor: '#cbd5e1',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: 'none'
                }}
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 🖨️ Hidden Printable Section bound to printRef */}
      <div ref={printRef} style={{ display: 'none' }}>
        <h1>Henry Luce III Library</h1>
        <h2>Library Entry Visitor Analytics & Detailed Records Report</h2>
        <p className="daterange">
          {startDate && endDate ? `Date Range: ${startDate} to ${endDate}` : 'All Recorded Dates'}
          {selectedCollege !== 'All' ? ` | College: ${selectedCollege}` : ''}
          {selectedCourse !== 'All' ? ` | Course: ${selectedCourse}` : ''}
          {selectedSection !== 'All' ? ` | Section: ${selectedSection}` : ''}
        </p>

        <div className="summary">
          <div className="summary-box">
            <div className="value">{totalEntries}</div>
            <div className="label">Total Visitor Entries</div>
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
              <th>Gender</th>
            </tr>
          </thead>
          <tbody>
            {logins.map((row, i) => (
              <tr key={i}>
                <td>{row.studIDnumber || 'N/A'}</td>
                <td>{row.studLname || ''}</td>
                <td>{row.studFname || ''}</td>
                <td>{row.studCourse || 'N/A'}</td>
                <td>{row.studYear || 'N/A'}</td>
                <td>{row.studCollege || 'N/A'}</td>
                <td>{row.Section || 'N/A'}</td>
                <td>{formatDate(row.TimeLogged)}</td>
                <td>{row.studGender || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer">
          Generated on {new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} — Henry Luce III Library Entry Analytics System
        </div>
      </div>
    </>
  );
};

export default LoginDashboard;
