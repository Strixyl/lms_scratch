// ── Sentiment Dashboard — Reusable Sub-Components ───────────────────────────
// Chart components, chips, tooltips, and cards extracted from SentimentDashboard.

import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Paper,
  Tooltip, Chip, Button, Select, MenuItem,
  FormControl, ToggleButton, ToggleButtonGroup,
  IconButton,
} from '@mui/material';
import {
  ArrowDropUp as ArrowDropUpIcon,
  ArrowDropDown as ArrowDropDownIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  LocalOffer as LocalOfferIcon,
  FormatQuote as FormatQuoteIcon,
  Bolt as BoltIcon,
  Assessment as AssessmentIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import ReactWordcloud from 'react-wordcloud';
import {
  THEME,
  sectionHeaderSx,
  cardShellSx,
  sectionTitleSx,
  sectionSubtitleSx,
} from '../constants/themeTokens';

const T = THEME;

// ── Sentiment Status Pill Chip (Soft Rounded Badge with Indicator Icon) ───
export const SentimentChip = ({ label }) => {
  const norm = label || 'Neutral';
  const isPos = norm === 'Positive';
  const isNeg = norm === 'Negative';

  const config = isPos
    ? {
        bg: '#eafaf1',
        border: '#b7ebc9',
        text: '#107c41',
        icon: <ArrowDropUpIcon sx={{ fontSize: 20, my: -0.4, ml: -0.3, mr: 0.1, color: '#107c41' }} />
      }
    : isNeg
      ? {
          bg: '#fff1f2',
          border: '#fecdd3',
          text: '#be123c',
          icon: <ArrowDropDownIcon sx={{ fontSize: 20, my: -0.4, ml: -0.3, mr: 0.1, color: '#e11d48' }} />
        }
      : {
          bg: '#f1f5f9',
          border: '#cbd5e1',
          text: '#475569',
          icon: <FiberManualRecordIcon sx={{ fontSize: 8, mr: 0.4, color: '#94a3b8' }} />
        };

  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.3,
      bgcolor: config.bg,
      border: `1.5px solid ${config.border}`,
      borderRadius: '9999px',
      px: 1.4,
      py: 0.35,
      lineHeight: 1,
    }}>
      {config.icon}
      <Typography sx={{
        fontSize: 12.5,
        fontWeight: 700,
        color: config.text,
        fontFamily: T.font.family,
        lineHeight: 1.2,
      }}>
        {norm}
      </Typography>
    </Box>
  );
};


export const CategoryChip = ({ label }) => {
  const norm = label || 'Other/Uncategorized';

  const catStyles = {
    Staff: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', dot: '#ea580c' },
    Facilities: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#2563eb' },
    Collection: { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', dot: '#9333ea' },
    Environment: { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', dot: '#059669' },
    Services: { bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e', dot: '#0d9488' },
    Technology: { bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d', dot: '#db2777' },
    'Other/Uncategorized': { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', dot: '#64748b' },
    Other: { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', dot: '#64748b' },
  };

  const config = catStyles[norm] || {
    bg: '#f8fafc',
    border: '#cbd5e1',
    text: '#475569',
    dot: '#64748b',
  };

  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.7,
      bgcolor: config.bg,
      border: `1.5px solid ${config.border}`,
      borderRadius: '9999px',
      px: 1.3,
      py: 0.35,
      lineHeight: 1,
    }}>
      <Box sx={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        bgcolor: config.dot,
        flexShrink: 0,
      }} />
      <Typography sx={{
        fontSize: 12,
        fontWeight: 700,
        color: config.text,
        fontFamily: T.font.family,
        lineHeight: 1.2,
      }}>
        {norm}
      </Typography>
    </Box>
  );
};

// ── Summary KPI Card ────────────────────────────────────────────────────────
export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  color = '#16324f',
  tooltipContent = null,
  isFeatured = false,
  footnote = null,
}) => {
  if (isFeatured) {
    const cardContent = (
      <Card elevation={0} sx={{
        borderRadius: 3.5,
        bgcolor: '#16324f',
        background: 'linear-gradient(145deg, #16324f 0%, #0e2237 100%)',
        flex: 1,
        minWidth: 180,
        p: 2.2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: tooltipContent ? 'pointer' : 'default',
        boxShadow: '0 4px 16px -2px rgba(22, 50, 79, 0.35)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px -4px rgba(22, 50, 79, 0.45)',
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 11,
            fontWeight: 800,
            color: '#cbdbe9',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}>
            {title || 'TOTAL SURVEYS'}
          </Typography>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.12)',
            color: '#ffd580',
            width: 32,
            height: 32,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 18 }
          }}>
            {icon}
          </Box>
        </Box>

        <Box sx={{ mt: 1.5 }}>
          <Typography sx={{
            fontFamily: T.font.family,
            fontWeight: 800,
            fontSize: 32,
            color: '#ffffff',
            lineHeight: 1.1,
          }}>
            {value}
          </Typography>
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 12,
            color: '#cbdbe9',
            fontWeight: 500,
            mt: 0.3,
          }}>
            {subtitle || 'total responses'}
          </Typography>
          {footnote && (
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 11,
              color: '#ffd580',
              fontWeight: 600,
              mt: 0.8,
            }}>
              {footnote}
            </Typography>
          )}
        </Box>
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
  }

  // Normal white cards
  const cardContent = (
    <Card elevation={0} sx={{
      borderRadius: 3.5,
      bgcolor: '#ffffff',
      background: `linear-gradient(150deg, #ffffff 0%, ${color}0d 100%)`,
      border: `1.5px solid ${color}30`,
      borderTop: `3.5px solid ${color}`,
      flex: 1, minWidth: 180,
      p: 2.2,
      cursor: tooltipContent ? 'pointer' : 'default',
      boxShadow: `0 2px 10px -2px ${color}18`,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `0 8px 20px -4px ${color}30`,
        borderColor: color
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
        <Avatar sx={{
          bgcolor: `${color}15`,
          color: color,
          width: 42, height: 42,
          fontSize: 20,
          border: `1px solid ${color}30`,
          boxShadow: `0 2px 8px ${color}15`,
          '& svg': { fontSize: 20 }
        }}>
          {icon}
        </Avatar>
      </Box>
      <Typography sx={{ fontFamily: T.font.family, fontWeight: 800, fontSize: 28, color: '#16324f', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 13, color: '#334155', mt: 0.8 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, color: '#64748b', mt: 0.3, fontWeight: 500 }}>
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

// ── Shared String Formatters for Comments & Recommendations ─────────────────
const cleanQuote = (msg) => {
  if (!msg) return '';
  let str = typeof msg === 'string' ? msg.trim() : (msg.Message || '').trim();
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1).trim();
  }
  return str;
};

const formatCollege = (college) => {
  if (!college) return '';
  const upper = college.toUpperCase().trim();
  const map = {
    'BUSINESS & ACCOUNTANCY': 'CBA',
    'BUSINESS AND ACCOUNTANCY': 'CBA',
    'COMPUTER STUDIES': 'CCS',
    'ENGINEERING': 'COE',
    'ARTS & SCIENCES': 'CAS',
    'ARTS AND SCIENCES': 'CAS',
    'EDUCATION': 'COED',
    'HOSPITALITY MANAGEMENT': 'CHM',
    'GRADUATE STUDIES': 'SGS',
    'THEOLOGY': 'COT',
    'LAW': 'COL',
    'MEDICINE': 'COM',
    'NURSING': 'CON',
    'PHARMACY': 'COP',
    'AGRICULTURE': 'CAG',
  };
  return map[upper] || (upper.length > 9 ? `${upper.slice(0, 8)}.` : upper);
};

// ── Top Comments Card (Positive / Negative — Clean & Focused) ───────────────
export const TopCommentsCard = ({ title, rows = [], type = 'positive' }) => {
  const isPositive = type === 'positive';
  const borderColor = isPositive ? '#107c41' : '#e11d48';
  const badgeBg = isPositive ? '#eafaf1' : '#fff1f2';
  const badgeBorder = isPositive ? '#b7ebc9' : '#fecdd3';
  const badgeColor = isPositive ? '#107c41' : '#be123c';

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: 3,
        border: '1.5px solid #e2e8f0',
        borderTop: `4px solid ${borderColor}`,
        p: { xs: 1.8, sm: 2.2 },
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 10px rgba(22, 50, 79, 0.02)',
        overflow: 'hidden',
      }}
    >
      {/* Header Container */}
      <Box sx={{
        background: isPositive
          ? 'linear-gradient(135deg, #eafaf1 0%, #dcfce7 100%)'
          : 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
        borderRadius: 2.5,
        p: { xs: 1.3, sm: 1.5 },
        mb: 2,
        border: isPositive ? '1.5px solid #b7ebc9' : '1.5px solid #fecdd3',
        borderLeft: isPositive ? '5px solid #107c41' : '5px solid #e11d48',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{
            bgcolor: borderColor,
            color: '#ffffff',
            p: 0.55,
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            '& svg': { fontSize: 16 }
          }}>
            {isPositive ? <ThumbUpIcon /> : <ThumbDownIcon />}
          </Box>
          <Typography sx={{
            fontFamily: T.font.family,
            fontWeight: 800,
            fontSize: { xs: 14, sm: 15 },
            color: badgeColor,
            letterSpacing: '-0.2px',
          }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{
          fontFamily: T.font.family,
          fontSize: 11,
          fontWeight: 700,
          color: badgeColor,
          bgcolor: '#ffffff',
          border: `1.5px solid ${badgeBorder}`,
          px: 1.2,
          py: 0.25,
          borderRadius: '9999px',
          flexShrink: 0,
        }}>
          {rows.length} {rows.length === 1 ? 'Comment' : 'Comments'}
        </Typography>
      </Box>

      {/* Comments List */}
      {rows.length === 0 ? (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
          bgcolor: '#f8fafc',
          borderRadius: 2.5,
          border: `1.5px dashed ${T.surface.borderLight}`,
        }}>
          <Typography sx={{
            fontFamily: T.font.family,
            fontWeight: 600,
            color: T.text.secondary,
            fontSize: 13,
          }}>
            No {isPositive ? 'positive' : 'negative'} comments recorded.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {rows.map((row, i) => {
            const rawCollege = row.College || '';
            const collegeAbbr = formatCollege(rawCollege);
            const category = row.Category || 'General';
            const catToken = T.category[category] || T.category['Other/Uncategorized'];
            const rawQuote = cleanQuote(row.Message);

            return (
              <Box
                key={i}
                sx={{
                  bgcolor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderLeft: `4px solid ${borderColor}`,
                  borderRadius: '8px',
                  p: { xs: 1.2, sm: 1.4 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.7,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 3px 12px rgba(22, 50, 79, 0.05)',
                    borderColor: '#cbd5e1',
                    borderLeftColor: borderColor,
                  }
                }}
              >
                {/* Clean, Pleasing Metadata Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                  {/* Number Badge */}
                  <Box sx={{
                    width: 22,
                    height: 22,
                    minWidth: 22,
                    borderRadius: '50%',
                    bgcolor: borderColor,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: T.font.family,
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}>
                    {i + 1}
                  </Box>

                  {/* College Badge */}
                  {rawCollege && (
                    <Tooltip title={rawCollege} arrow>
                      <Box sx={{
                        px: 0.85,
                        py: 0.2,
                        borderRadius: '4px',
                        bgcolor: '#edf4fa',
                        color: '#16324f',
                        border: '1px solid #cbdbe9',
                        fontFamily: T.font.family,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1.2,
                        cursor: 'help',
                      }}>
                        {collegeAbbr}
                      </Box>
                    </Tooltip>
                  )}

                  {/* Category Pill (Aligned to Right — Clean & Eye-Pleasing) */}
                  <Box sx={{
                    ml: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.6,
                    px: 1.2,
                    py: 0.3,
                    borderRadius: '9999px',
                    bgcolor: catToken.light,
                    color: catToken.text,
                    border: `1px solid ${catToken.border}`,
                    fontFamily: T.font.family,
                    fontSize: 10.5,
                    fontWeight: 700,
                    lineHeight: 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: catToken.dot }} />
                    <span>{category}</span>
                  </Box>
                </Box>

                {/* Verbatim Comment — Clean Normal Text */}
                <Typography sx={{
                  fontFamily: T.font.family,
                  fontSize: 13,
                  color: '#1e293b',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  lineHeight: 1.55,
                  wordBreak: 'break-word',
                  pl: 0.2,
                }}>
                  "{rawQuote}"
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
};

// ── Recommendation Card for a specific flagged category / topic ───────────
// ── Recommendation Card for a specific flagged category / topic ───────────
export const RecommendationCard = ({ stat, onFilterCategory }) => {
  if (!stat) return null;
  const isHigh = (stat.severity || '').toUpperCase() === 'HIGH';
  const category = stat.category || 'Other/Uncategorized';

  // Category Color Theme Alignment (Fresh Teal for Facilities, Warm Amber for Staff, Royal Indigo for Collection)
  const categoryThemeMap = {
    Facilities: {
      primary: '#0284c7', // Sky / Cyan
      dark: '#0369a1',
      light: '#f0f9ff',
      border: '#bae6fd',
      gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      badgeBg: '#e0f2fe',
      icon: ApartmentIcon,
    },
    Staff: {
      primary: '#d97706', // Amber / Gold
      dark: '#b45309',
      light: '#fffbeb',
      border: '#fde68a',
      gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      badgeBg: '#fef3c7',
      icon: PeopleIcon,
    },
    Collection: {
      primary: '#4f46e5', // Indigo
      dark: '#4338ca',
      light: '#eef2ff',
      border: '#c7d2fe',
      gradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      badgeBg: '#e0e7ff',
      icon: MenuBookIcon,
    },
  };

  const theme = categoryThemeMap[category] || {
    primary: '#64748b',
    dark: '#475569',
    light: '#f8fafc',
    border: '#cbd5e1',
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    badgeBg: '#f1f5f9',
    icon: BoltIcon,
  };

  const CategoryIconComponent = theme.icon;
  const keywords = stat.keywords || [];
  const evidences = stat.evidences || stat.topEvidences || [];
  const totalSignals = stat.matchCount || evidences.length;

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: 3.5,
        border: '1.5px solid #e2e8f0',
        borderTop: `4px solid ${isHigh ? '#be123c' : theme.primary}`,
        p: { xs: 2, sm: 2.3 },
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 12px rgba(22, 50, 79, 0.03)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 6px 22px rgba(22, 50, 79, 0.07)',
          borderColor: '#cbd5e1',
          borderTopColor: isHigh ? '#be123c' : theme.primary,
        }
      }}
    >
      {/* Header Bar: Severity Badge + Category Pill + Signal Volume */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.4, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          {/* Severity Badge */}
          <Box sx={{
            bgcolor: isHigh ? '#be123c' : '#d97706',
            color: '#ffffff',
            px: 1,
            py: 0.25,
            borderRadius: '5px',
            fontFamily: T.font.family,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}>
            {isHigh ? 'HIGH PRIORITY' : 'MODERATE'}
          </Box>

          {/* Category Pill with Icon */}
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.4,
            px: 0.9,
            py: 0.25,
            borderRadius: '9999px',
            bgcolor: theme.badgeBg,
            color: theme.dark,
            border: `1px solid ${theme.border}`,
            fontFamily: T.font.family,
            fontSize: 10.5,
            fontWeight: 700,
          }}>
            <CategoryIconComponent sx={{ fontSize: 13 }} />
            <span>{category}</span>
          </Box>
        </Box>

        {/* Signal Volume Indicator */}
        <Tooltip title={`Identified from ${totalSignals} negative feedback entries`} arrow>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.4,
            px: 0.9,
            py: 0.25,
            borderRadius: '9999px',
            bgcolor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            fontFamily: T.font.family,
            fontSize: 10.5,
            fontWeight: 700,
            cursor: 'help',
          }}>
            <span>{totalSignals} Negative {totalSignals === 1 ? 'Signal' : 'Signals'}</span>
          </Box>
        </Tooltip>
      </Box>

      {/* Topic Title */}
      <Typography sx={{
        fontFamily: T.font.family,
        fontWeight: 800,
        fontSize: { xs: 15, sm: 16 },
        color: '#16324f',
        letterSpacing: '-0.3px',
        lineHeight: 1.3,
        mb: 1.6,
      }}>
        {stat.title}
      </Typography>

      {/* Priority Action Callout Banner */}
      <Box sx={{
        background: theme.gradient,
        borderRadius: 2.5,
        p: { xs: 1.5, sm: 1.8 },
        mb: 2,
        border: `1.5px solid ${theme.border}`,
        borderLeft: `5px solid ${theme.primary}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.6 }}>
          <BoltIcon sx={{ fontSize: 14, color: theme.dark }} />
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 10.5,
            fontWeight: 900,
            color: theme.dark,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            RECOMMENDED INTERVENTION
          </Typography>
        </Box>
        <Typography sx={{
          fontFamily: T.font.family,
          fontSize: 13,
          fontWeight: 700,
          color: '#16324f',
          lineHeight: 1.5,
        }}>
          {stat.action}
        </Typography>
      </Box>

      {/* Pain-Point Keywords */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
          <LocalOfferIcon sx={{ fontSize: 12.5, color: '#64748b' }} />
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 10.5,
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}>
            PAIN-POINT KEYWORDS
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
          {keywords.map((kw, i) => (
            <Box
              key={i}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: '#ffffff',
                border: `1px solid ${theme.border}`,
                borderRadius: '9999px',
                px: 1.1,
                py: 0.25,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              <Typography sx={{
                fontFamily: T.font.family,
                fontSize: 11.5,
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2,
              }}>
                {kw.word}
              </Typography>
              <Box sx={{
                bgcolor: theme.primary,
                color: '#ffffff',
                borderRadius: '9999px',
                px: 0.55,
                py: 0.1,
                fontSize: 9.5,
                fontWeight: 800,
                lineHeight: 1,
              }}>
                {kw.count}x
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Patron Supporting Evidence Section */}
      <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FormatQuoteIcon sx={{ fontSize: 15, color: theme.dark }} />
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 10.5,
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}>
              PATRON EVIDENCE ({evidences.length})
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {evidences.slice(0, 3).map((ev, idx) => {
            const rawQuote = typeof ev === 'string' ? ev : (ev.Message || '');
            const cleaned = cleanQuote(rawQuote);
            const college = ev.College ? formatCollege(ev.College) : '';

            return (
              <Box
                key={idx}
                sx={{
                  p: 1.1,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderLeft: `3px solid ${theme.primary}`,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.4 }}>
                  <Box sx={{
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    bgcolor: '#edf4fa',
                    color: '#16324f',
                    fontFamily: T.font.family,
                    fontSize: 9.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {idx + 1}
                  </Box>
                  {college && (
                    <Box sx={{
                      px: 0.6,
                      py: 0.1,
                      borderRadius: '3px',
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      fontFamily: T.font.family,
                      fontSize: 9.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}>
                      {college}
                    </Box>
                  )}
                </Box>

                <Typography sx={{
                  fontFamily: T.font.family,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#334155',
                  fontStyle: 'italic',
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                }}>
                  "{cleaned}"
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Filter Reviews Link */}
        {onFilterCategory && (
          <Box sx={{ mt: 1.2, textAlign: 'right' }}>
            <Typography
              onClick={() => onFilterCategory(category)}
              sx={{
                fontFamily: T.font.family,
                fontSize: 11,
                fontWeight: 700,
                color: theme.dark,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                transition: 'all 0.15s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  gap: 0.7,
                }
              }}
            >
              Filter {category} in Table →
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

// ── Custom Tooltip for Sentiment Stacked Bar Chart ──────────────────────────
export const CustomSentimentStackedTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    return (
      <Paper elevation={4} sx={{ p: 2, bgcolor: T.surface.card, border: `1.5px solid ${T.surface.border}`, borderRadius: 3, maxWidth: 320, boxShadow: T.shadow.elevated }}>
        <Typography variant="subtitle2" sx={{ fontFamily: T.font.family, fontWeight: 800, color: T.text.heading, mb: 1, borderBottom: `1px solid ${T.surface.borderLight}`, pb: 0.8, fontSize: 13.5 }}>
          {label} — {total} Total Response{total !== 1 ? 's' : ''}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {payload.map((item, idx) => {
            const val = Number(item.value) || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            const colorObj = T.sentiment[item.name] || { bg: item.color || '#64748b', text: T.text.heading, light: T.surface.cardAlt, dot: item.color || '#64748b' };
            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.8, px: 1.2, borderRadius: 2, bgcolor: colorObj.light || T.surface.cardAlt, border: `1px solid ${colorObj.dot}40` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: colorObj.bg, flexShrink: 0 }} />
                  <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: colorObj.text || T.text.heading }}>
                    {item.name}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 800, color: colorObj.text || T.text.heading }}>
                  {val} ({pct}%)
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  }
  return null;
};

// ── Custom Tooltip for Category Donut Gauge ─────────────────────────────────
export const CustomDonutGaugeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const isNoData = item.name === 'No Data';
    if (isNoData) return null;
    return (
      <Paper elevation={4} sx={{ p: 1.5, bgcolor: T.surface.card, border: `1.5px solid ${T.surface.borderLight}`, borderRadius: T.radius.input, boxShadow: T.shadow.elevated, minWidth: 120 }}>
        <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, color: T.text.muted, fontWeight: 600 }}>
          {item.name} Sentiment
        </Typography>
        <Typography sx={{ fontFamily: T.font.family, fontSize: 18, fontWeight: 800, color: T.text.heading, my: 0.2 }}>
          {item.value}%
        </Typography>
        {item.payload.count !== undefined && (
          <Typography sx={{ fontFamily: T.font.family, fontSize: 11, color: T.text.faint, fontWeight: 500 }}>
            {item.payload.count} response{item.payload.count !== 1 ? 's' : ''}
          </Typography>
        )}
      </Paper>
    );
  }
  return null;
};

// ── Pie Chart Custom Label Renderer ─────────────────────────────────────────
const RADIAN = Math.PI / 180;
export const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={T.text.heading} textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 700, fontFamily: T.font.family }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Custom Tooltip for Diverging Sentiment Balance Trend Chart ─────────────
export const CustomDivergingTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataObj = payload[0]?.payload || {};
    const pos = Number(dataObj.Positive) || 0;
    const rawNeg = Number(dataObj.rawNegative) !== undefined && dataObj.rawNegative !== null
      ? Number(dataObj.rawNegative)
      : Math.abs(Number(dataObj.Negative) || 0);
    const neu = Number(dataObj.Neutral) || 0;
    const total = Number(dataObj.Total) || (pos + rawNeg + neu);
    const avgScore = dataObj.avgSatisfaction !== null && dataObj.avgSatisfaction !== undefined
      ? Number(dataObj.avgSatisfaction)
      : null;
    const posPct = total > 0 ? ((pos / total) * 100).toFixed(1) : '0.0';
    const negPct = total > 0 ? ((rawNeg / total) * 100).toFixed(1) : '0.0';

    return (
      <Paper elevation={4} sx={{ p: 2, bgcolor: T.surface.card, border: `1.5px solid ${T.surface.borderLight}`, borderRadius: 3, maxWidth: 320, boxShadow: T.shadow.elevated }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.surface.borderLight}`, pb: 1, mb: 1.2 }}>
          <Typography sx={{ fontFamily: T.font.family, fontWeight: 800, color: T.text.heading, fontSize: 14 }}>
            {label} Sentiment Summary
          </Typography>
          <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, fontWeight: 700, color: T.text.muted }}>
            {total} {total === 1 ? 'Response' : 'Responses'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {/* Positive Balance Inflow */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.8, px: 1.2, borderRadius: 2, bgcolor: T.sentiment.Positive.light, border: `1px solid ${T.sentiment.Positive.dot}60` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <ArrowDropUpIcon sx={{ fontSize: 18, color: T.sentiment.Positive.text, ml: -0.3, mr: -0.2 }} />
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: T.sentiment.Positive.text }}>
                Positive
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 800, color: T.sentiment.Positive.text }}>
              +{pos} ({posPct}%)
            </Typography>
          </Box>

          {/* Negative Balance Outflow */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.8, px: 1.2, borderRadius: 2, bgcolor: T.sentiment.Negative.light, border: `1px solid ${T.sentiment.Negative.dot}60` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <ArrowDropDownIcon sx={{ fontSize: 18, color: T.sentiment.Negative.text, ml: -0.3, mr: -0.2 }} />
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: T.sentiment.Negative.text }}>
                Negative
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 800, color: T.sentiment.Negative.text }}>
              -{rawNeg} ({negPct}%)
            </Typography>
          </Box>

          {/* Neutral count if any */}
          {neu > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.6, px: 1.2, borderRadius: 2, bgcolor: T.sentiment.Neutral.light, border: `1px solid ${T.sentiment.Neutral.dot}40` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <FiberManualRecordIcon sx={{ fontSize: 7, color: T.sentiment.Neutral.text }} />
                <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, fontWeight: 700, color: T.sentiment.Neutral.text }}>
                  Neutral
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, fontWeight: 800, color: T.sentiment.Neutral.text }}>
                {neu}
              </Typography>
            </Box>
          )}

          {/* Average Satisfaction Score */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, pt: 0.8, borderTop: `1px dashed ${T.surface.borderLight}` }}>
            <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, color: T.text.secondary, fontWeight: 600 }}>
              Avg Satisfaction Score:
            </Typography>
            <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: '#6d28d9', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.4 }}>
              {avgScore !== null && avgScore > 0 ? (
                <>
                  <StarIcon sx={{ fontSize: 15, color: '#f59e0b' }} />
                  {avgScore.toFixed(1)} / 5.0
                </>
              ) : 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }
  return null;
};

// Stable minSize array so reference never changes across re-renders
const WORD_CLOUD_MIN_SIZE = [300, 300];

// ── Memoized Word Cloud Section Component ──────────────────────────────────
export const WordCloudSection = React.memo(({
  words = [],
  selectedWordFilter = '',
  onSelectWord,
  onClearWordFilter,
}) => {
  const wordCloudOptions = useMemo(() => ({
    deterministic: true,
    randomSeed: 'hll-library-wordcloud-poster-v1',
    rotations: 1,
    rotationAngles: [0, 0], // Strictly horizontal words only, no vertical rotation
    fontFamily: '"Arial Black", Impact, "Trebuchet MS", "Poppins", sans-serif',
    fontSizes: [16, 76],
    fontStyle: 'normal',
    fontWeight: '900',
    padding: 3,
    enableTooltip: true,
    transitionDuration: 650, // Fluid, smooth layout transition duration for d3-cloud
    scale: 'sqrt',
    spiral: 'archimedean',
  }), []);

  const wordCloudCallbacks = useMemo(() => ({
    getWordColor: (word) => {
      if (selectedWordFilter && word.text.toLowerCase() === selectedWordFilter.toLowerCase()) {
        return '#ea580c';
      }
      if (words.length > 0 && word.text === words[0]?.text) {
        return '#ea580c'; // Vibrant warm orange for the #1 prominent word
      }
      const charCodeSum = (word.text || '').split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
      return T.wordCloudColors[charCodeSum % T.wordCloudColors.length];
    },
    getWordTooltip: (word) => `"${word.text}" — ${word.value} ${word.value === 1 ? 'mention' : 'mentions'}`,
    onWordClick: (word) => {
      if (onSelectWord) {
        onSelectWord(word.text);
      }
    },
  }), [selectedWordFilter, words, onSelectWord]);

  return (
    <Card elevation={0} sx={{
      ...cardShellSx,
      mb: 3.5,
      border: '1.5px solid #cbdbe9',
      borderTop: '3.5px solid #16324f',
      boxShadow: '0 2px 12px rgba(22, 50, 79, 0.04)',
      transition: 'box-shadow 0.3s ease',
    }}>
      <Box sx={{ ...sectionHeaderSx, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{
            bgcolor: '#edf4fa',
            color: '#16324f',
            p: 0.55,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 18 }
          }}>
            <AssessmentIcon />
          </Box>
          <Box>
            <Typography sx={sectionTitleSx}>Frequently Used Words</Typography>
            <Typography sx={sectionSubtitleSx}>Interactive keyword frequency cloud across patron feedback submissions</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={`${words.length} Words`}
            size="small"
            sx={{ fontWeight: 700, fontFamily: T.font.family, bgcolor: '#f1f5f9', color: '#475569', borderRadius: '9999px' }}
          />
          {selectedWordFilter && (
            <Chip
              label={`Filter: "${selectedWordFilter}"`}
              size="small"
              onDelete={onClearWordFilter}
              sx={{
                fontWeight: 700,
                fontFamily: T.font.family,
                borderRadius: '9999px',
                bgcolor: '#fff7ed',
                color: '#c2410c',
                border: '1px solid #fed7aa',
                animation: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '@keyframes popIn': {
                  '0%': { transform: 'scale(0.85)', opacity: 0 },
                  '100%': { transform: 'scale(1)', opacity: 1 }
                }
              }}
            />
          )}
        </Box>
      </Box>

      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {words.length === 0 ? (
          <Typography sx={{ fontFamily: T.font.family, color: T.text.faint, textAlign: 'center', py: 6 }}>
            No comment text available for the selected filters.
          </Typography>
        ) : (
          <Box sx={{
            height: 380,
            borderRadius: 3.5,
            p: 2.5,
            bgcolor: '#ffffff',
            border: '1.5px solid #cbdbe9',
            position: 'relative',
            overflow: 'hidden',
            animation: 'wordCloudContainerFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            '@keyframes wordCloudContainerFade': {
              '0%': {
                opacity: 0,
                transform: 'scale(0.985)',
              },
              '100%': {
                opacity: 1,
                transform: 'scale(1)',
              },
            },
            '& svg': {
              width: '100% !important',
              height: '100% !important',
            },
            '& svg text': {
              cursor: 'pointer',
              fontFamily: '"Arial Black", Impact, "Trebuchet MS", "Poppins", sans-serif !important',
              fontWeight: '900 !important',
              userSelect: 'none',
              transition: 'fill 0.3s ease, opacity 0.25s ease, filter 0.25s ease !important',
            },
            '& svg text:hover': {
              opacity: '0.85 !important',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
            }
          }}>
            <ReactWordcloud
              words={words}
              options={wordCloudOptions}
              minSize={WORD_CLOUD_MIN_SIZE}
              callbacks={wordCloudCallbacks}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// ── Modern KPI Metric Card (Matching Reference Design with Top-Right Pill Badge) ─────
export const ModernKpiCard = ({
  title,
  value,
  badgeText,
  badgeType = 'positive', // 'positive' | 'negative' | 'neutral' | 'purple' | 'blue'
  subtitle,
  highlighted = false,
  borderColorTheme = 'gold', // 'gold' | 'blue'
}) => {
  const badgeConfig = {
    positive: { bg: '#eafaf1', text: '#107c41', border: '#b7ebc9' },
    negative: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
    neutral:  { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    purple:   { bg: '#fff8eb', text: '#d97706', border: '#fed7aa' },
    blue:     { bg: '#edf4fa', text: '#16324f', border: '#cbdbe9' },
  }[badgeType] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };

  if (highlighted) {
    return (
      <Card
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #16324f 0%, #0e2237 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #f69d1b',
          p: { xs: 2, sm: 2.2 },
          boxShadow: '0 4px 18px rgba(22, 50, 79, 0.28), 0 0 0 1px rgba(246, 157, 27, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minWidth: 0,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(22, 50, 79, 0.38), 0 0 0 1.5px #f69d1b',
            borderColor: '#f69d1b',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
          <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
            {title}
          </Typography>
          {badgeText && (
            <Box sx={{
              bgcolor: 'rgba(246, 157, 27, 0.25)',
              color: '#ffd580',
              border: '1px solid rgba(254, 215, 170, 0.5)',
              backdropFilter: 'blur(4px)',
              borderRadius: '9999px',
              px: 1.1,
              py: 0.2,
              fontSize: 11.5,
              fontWeight: 800,
              fontFamily: T.font.family,
              lineHeight: 1.2,
            }}>
              {badgeText}
            </Box>
          )}
        </Box>

        <Typography sx={{ fontFamily: T.font.family, fontSize: { xs: 24, sm: 28, md: 30 }, fontWeight: 800, color: '#ffffff', lineHeight: 1.1, mb: 0.6 }}>
          {value}
        </Typography>

        {subtitle && (
          <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 500, color: 'rgba(255, 255, 255, 0.82)' }}>
            {subtitle}
          </Typography>
        )}
      </Card>
    );
  }

  const isBlue = borderColorTheme === 'blue';
  const borderCol = isBlue ? '#cbdbe9' : '#fed7aa';
  const borderTopCol = isBlue ? '#16324f' : '#f69d1b';
  const shadowColor = isBlue ? 'rgba(22, 50, 79, 0.04)' : 'rgba(246, 157, 27, 0.04)';
  const hoverShadowColor = isBlue ? 'rgba(22, 50, 79, 0.1)' : 'rgba(246, 157, 27, 0.1)';

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '16px',
        border: `1.5px solid ${borderCol}`,
        borderTop: `3.5px solid ${borderTopCol}`,
        p: { xs: 2, sm: 2.2 },
        boxShadow: `0 2px 8px ${shadowColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        minWidth: 0,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 20px ${hoverShadowColor}`,
          borderColor: borderTopCol,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
        <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
          {title}
        </Typography>
        {badgeText && (
          <Box sx={{
            bgcolor: badgeConfig.bg,
            color: badgeConfig.text,
            border: `1px solid ${badgeConfig.border}`,
            borderRadius: '9999px',
            px: 1.1,
            py: 0.2,
            fontSize: 11.5,
            fontWeight: 700,
            fontFamily: T.font.family,
            lineHeight: 1.2,
          }}>
            {badgeText}
          </Box>
        )}
      </Box>

      <Typography sx={{ fontFamily: T.font.family, fontSize: { xs: 24, sm: 28, md: 30 }, fontWeight: 800, color: '#16324f', lineHeight: 1.1, mb: 0.6 }}>
        {value}
      </Typography>

      {subtitle && (
        <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

// ── Custom Tooltip for Revenue-Style Sentiment Trend Area Chart ────────────
export const CustomRevenueTooltip = ({ active, payload, label, metricMode = 'percent' }) => {
  if (active && payload && payload.length) {
    const dataObj = payload[0]?.payload || {};
    const pos = Number(dataObj.Positive) || 0;
    const total = Number(dataObj.Total) || 0;
    const posPct = Number(dataObj.posPct) || 0;
    const year = dataObj.year || '2026';

    return (
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          bgcolor: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          minWidth: 150,
        }}
      >
        <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: '#16324f', mb: 0.5 }}>
          {label} {year}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#107c41' }} />
          <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 800, color: '#16324f' }}>
            {metricMode === 'percent'
              ? `Positive: ${posPct}%`
              : `Positive: ${pos} surveys`}
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: T.font.family, fontSize: 11, color: '#94a3b8', mt: 0.4 }}>
          {total} total responses ({pos} pos, {dataObj.rawNegative || dataObj.Negative || 0} neg)
        </Typography>
      </Paper>
    );
  }
  return null;
};

// ── Revenue-Style Monthly Sentiment Trend Container ────────────────────────
export const RevenueStyleSentimentChart = ({
  data = [],
  title = "Monthly Sentiment Overview",
  primaryValue = "84.2%",
  deltaText = "+5.2% vs last month",
  deltaType = "positive",
  timeframe = "1Y",
  onTimeframeChange,
  metricMode = "percent",
  onMetricModeChange,
  availableYears = [],
  selectedYear = "2026",
  onYearChange,
}) => {
  const isPositiveDelta = deltaType === 'positive';

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #fed7aa',
        borderTop: '3.5px solid #f69d1b',
        p: { xs: 2, sm: 2.5 },
        boxShadow: '0 2px 10px rgba(246, 157, 27, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(246, 157, 27, 0.08)',
          borderColor: '#f69d1b',
        }
      }}
    >
      {/* Header Container */}
      <Box sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1.5,
        mb: 2,
      }}>
        <Box>
          <Typography sx={{ fontFamily: T.font.family, fontSize: 14, fontWeight: 700, color: '#64748b' }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.2, mt: 0.4, flexWrap: 'wrap' }}>
            <Typography sx={{ fontFamily: T.font.family, fontSize: { xs: 26, sm: 32 }, fontWeight: 800, color: '#16324f', lineHeight: 1.1 }}>
              {primaryValue}
            </Typography>
            {deltaText && (
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.3,
                color: isPositiveDelta ? '#107c41' : '#e11d48',
                fontFamily: T.font.family,
                fontSize: 12.5,
                fontWeight: 700,
              }}>
                {isPositiveDelta ? '↗' : '↘'} {deltaText}
              </Box>
            )}
          </Box>
        </Box>

        {/* Timeframe & View Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', alignSelf: { xs: 'stretch', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
          {/* 1M 3M 6M 1Y ALL Segmented Controls */}
          <ToggleButtonGroup
            value={timeframe}
            exclusive
            onChange={(e, newTf) => { if (newTf && onTimeframeChange) onTimeframeChange(newTf); }}
            size="small"
            sx={{
              height: 32,
              borderRadius: '9999px',
              bgcolor: '#edf2f7',
              p: 0.3,
              '& .MuiToggleButton-root': {
                fontFamily: T.font.family,
                fontSize: 11.5,
                fontWeight: 600,
                textTransform: 'none',
                px: 1.2,
                color: '#64748b',
                border: 'none',
                borderRadius: '9999px',
                '&.Mui-selected': {
                  bgcolor: '#ffffff',
                  color: '#16324f',
                  fontWeight: 800,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  '&:hover': { bgcolor: '#ffffff' }
                }
              }
            }}
          >
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="6M">6M</ToggleButton>
            <ToggleButton value="1Y">1Y</ToggleButton>
            <ToggleButton value="ALL">ALL</ToggleButton>
          </ToggleButtonGroup>

          {/* Optional Year Selector */}
          {availableYears.length > 0 && onYearChange && (
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                sx={{
                  height: 32,
                  borderRadius: '9999px',
                  fontFamily: T.font.family,
                  fontWeight: 700,
                  fontSize: 11.5,
                  bgcolor: '#f8fafc',
                  color: '#334155',
                  '& fieldset': { borderColor: '#e2e8f0' }
                }}
              >
                <MenuItem value="All" sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 600 }}>All Years</MenuItem>
                {availableYears.map(yr => (
                  <MenuItem key={yr} value={yr} sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 600 }}>{yr}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {/* Smooth Curved Area Chart */}
      <Box sx={{ width: '100%', height: 290, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueTealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#107c41" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#107c41" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontFamily: T.font.family, fontSize: 11.5, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={{ stroke: '#f1f5f9' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: T.font.family, fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              domain={metricMode === 'percent' ? [0, 100] : [0, 'auto']}
              tickFormatter={(v) => metricMode === 'percent' ? `${v}%` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />
            <RechartsTooltip content={<CustomRevenueTooltip metricMode={metricMode} />} />
            <Area
              type="monotone"
              dataKey={metricMode === 'percent' ? 'posPct' : 'Positive'}
              stroke="#107c41"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueTealGradient)"
              activeDot={{ r: 5, fill: '#16324f', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
};

// ── Source & Category Sentiment Breakdown Container (Right-Side Card) ────────
export const SourceSentimentBreakdownCard = ({
  totalSurveys = 0,
  positiveCount = 0,
  neutralCount = 0,
  negativeCount = 0,
  categoryBreakdown = [],
  selectedCategory = 'All Categories',
  onCategoryChange,
  categoryOptions = ['All Categories', 'Facilities', 'Staff', 'Collection'],
  onViewReportsClick,
}) => {
  const total = totalSurveys || (positiveCount + neutralCount + negativeCount);

  const posPct = total > 0 ? Math.round((positiveCount / total) * 100) : 0;
  const neuPct = total > 0 ? Math.round((neutralCount / total) * 100) : 0;
  const negPct = total > 0 ? Math.max(0, 100 - posPct - neuPct) : 0;

  // Sentiment Donut: Green for Positive, Slate Grey for Neutral, Red for Negative
  const donutData = total > 0 ? [
    { name: 'Positive', value: positiveCount, color: '#107c41' },
    { name: 'Neutral', value: neutralCount, color: '#64748b' },
    { name: 'Negative', value: negativeCount, color: '#e11d48' },
  ].filter(d => d.value > 0) : [
    { name: 'No Data', value: 1, color: '#e2e8f0' }
  ];

  const formattedTotal = total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total;

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #fed7aa',
        borderTop: '3.5px solid #f69d1b',
        p: { xs: 2, sm: 2.5 },
        boxShadow: '0 2px 10px rgba(246, 157, 27, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(246, 157, 27, 0.08)',
          borderColor: '#f69d1b',
        }
      }}
    >
      {/* Header with Title and Category Dropdown Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography sx={{ fontFamily: T.font.family, fontSize: 16.5, fontWeight: 800, color: '#16324f' }}>
            Source
          </Typography>
          <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>
            {selectedCategory === 'All Categories' ? 'All Service Areas' : selectedCategory}
          </Typography>
        </Box>

        {onCategoryChange && (
          <FormControl size="small" sx={{ minWidth: 135 }}>
            <Select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              sx={{
                height: 32,
                borderRadius: '8px',
                fontFamily: T.font.family,
                fontWeight: 700,
                fontSize: 12,
                bgcolor: '#f8fafc',
                color: '#334155',
                '& fieldset': { borderColor: '#e2e8f0' }
              }}
            >
              {categoryOptions.map(opt => (
                <MenuItem key={opt} value={opt} sx={{ fontFamily: T.font.family, fontSize: 12.5, fontWeight: 600 }}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Donut Chart with Centered Total */}
      <Box sx={{ width: '100%', position: 'relative', height: 180, my: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={74}
              paddingAngle={donutData.length > 1 ? 4 : 0}
              cornerRadius={donutData.length > 1 ? 4 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {donutData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Total Label */}
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <Typography sx={{ fontFamily: T.font.family, fontWeight: 900, fontSize: 20, color: '#16324f', lineHeight: 1.1 }}>
            {formattedTotal}
          </Typography>
          <Typography sx={{ fontFamily: T.font.family, fontWeight: 600, fontSize: 11, color: '#94a3b8' }}>
            {selectedCategory === 'All Categories' ? 'Total' : `${selectedCategory}`}
          </Typography>
        </Box>
      </Box>

      {/* Legend Indicators below Donut */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#eafaf1', border: '1px solid #b7ebc9', px: 0.8, py: 0.2, borderRadius: '9999px' }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#107c41' }} />
          <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 700, color: '#107c41' }}>
            Pos ({posPct}%)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', border: '1px solid #cbd5e1', px: 0.8, py: 0.2, borderRadius: '9999px' }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#64748b' }} />
          <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 700, color: '#475569' }}>
            Neu ({neuPct}%)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#fff1f2', border: '1px solid #fecdd3', px: 0.8, py: 0.2, borderRadius: '9999px' }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#e11d48' }} />
          <Typography sx={{ fontFamily: T.font.family, fontSize: 11, fontWeight: 700, color: '#be123c' }}>
            Neg ({negPct}%)
          </Typography>
        </Box>
      </Box>

      {/* Category or Sentiment Breakdown Details Section */}
      <Box sx={{ width: '100%', mb: 1.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {selectedCategory === 'All Categories' ? (
          <>
            {/* Table Header for All Categories Comparison */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', pb: 0.8, px: 0.5, borderBottom: '1px solid #f1f5f9' }}>
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                Category
              </Typography>
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>
                Rating
              </Typography>
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: '#94a3b8', textAlign: 'right' }}>
                Surveys
              </Typography>
            </Box>

            {/* Table Rows for All Categories */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
              {categoryBreakdown.map((item, idx) => {
                const catConfig = {
                  Facilities: { icon: <ApartmentIcon sx={{ fontSize: 17 }} />, color: '#16324f', bg: '#edf4fa', border: '#cbdbe9' },
                  Staff: { icon: <PeopleIcon sx={{ fontSize: 17 }} />, color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
                  Collection: { icon: <MenuBookIcon sx={{ fontSize: 17 }} />, color: '#254b73', bg: '#f0f4f9', border: '#cbdbe9' },
                }[item.name] || { icon: <AssessmentIcon sx={{ fontSize: 17 }} />, color: '#16324f', bg: '#f8fafc', border: '#e2e8f0' };

                return (
                  <Box
                    key={idx}
                    onClick={() => {
                      if (onCategoryChange) {
                        onCategoryChange(item.name);
                      }
                    }}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1fr 1fr',
                      alignItems: 'center',
                      py: 1,
                      px: 1,
                      borderRadius: '10px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: '#edf4fa',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        borderColor: catConfig.color,
                      }
                    }}
                  >
                    {/* Category Icon & Prominent Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
                      <Box sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        bgcolor: catConfig.bg,
                        color: catConfig.color,
                        border: `1px solid ${catConfig.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {catConfig.icon}
                      </Box>
                      <Typography sx={{ fontFamily: T.font.family, fontSize: 14.5, fontWeight: 800, color: '#16324f' }}>
                        {item.name}
                      </Typography>
                    </Box>

                    {/* Rating Metric */}
                    <Typography sx={{
                      fontFamily: T.font.family,
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#334155',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.3,
                    }}>
                      {item.metric || '4.5 ★'}
                    </Typography>

                    {/* Total Submissions Count */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        bgcolor: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #e2e8f0',
                        borderRadius: '9999px',
                        px: 1.1,
                        py: 0.25,
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: T.font.family,
                      }}>
                        {item.total} {item.total === 1 ? 'survey' : 'surveys'}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        ) : (
          <>
            {/* Table Header for Single Category Breakdown */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.8, px: 0.5, borderBottom: '1px solid #f1f5f9' }}>
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                {selectedCategory} Breakdown
              </Typography>
              <Button
                size="small"
                onClick={() => onCategoryChange && onCategoryChange('All Categories')}
                sx={{
                  fontFamily: T.font.family,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  color: '#16324f',
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                All Categories ↺
              </Button>
            </Box>

            {/* Rows for Single Category Sentiment Shares */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
              {/* Positive Row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr',
                alignItems: 'center',
                py: 0.9,
                px: 1,
                borderRadius: '10px',
                bgcolor: '#eafaf1',
                border: '1px solid #b7ebc9',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#107c41' }} />
                  <Typography sx={{ fontFamily: T.font.family, fontSize: 13.5, fontWeight: 800, color: '#107c41' }}>
                    Positive
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 700, color: '#107c41', textAlign: 'center' }}>
                  {positiveCount}
                </Typography>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 800, color: '#107c41', textAlign: 'right' }}>
                  {posPct}%
                </Typography>
              </Box>

              {/* Neutral Row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr',
                alignItems: 'center',
                py: 0.9,
                px: 1,
                borderRadius: '10px',
                bgcolor: '#f1f5f9',
                border: '1px solid #cbd5e1',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#64748b' }} />
                  <Typography sx={{ fontFamily: T.font.family, fontSize: 13.5, fontWeight: 800, color: '#475569' }}>
                    Neutral
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                  {neutralCount}
                </Typography>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 800, color: '#475569', textAlign: 'right' }}>
                  {neuPct}%
                </Typography>
              </Box>

              {/* Negative Row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr',
                alignItems: 'center',
                py: 0.9,
                px: 1,
                borderRadius: '10px',
                bgcolor: '#fff1f2',
                border: '1px solid #fecdd3',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#e11d48' }} />
                  <Typography sx={{ fontFamily: T.font.family, fontSize: 13.5, fontWeight: 800, color: '#be123c' }}>
                    Negative
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 700, color: '#be123c', textAlign: 'center' }}>
                  {negativeCount}
                </Typography>
                <Typography sx={{ fontFamily: T.font.family, fontSize: 13, fontWeight: 800, color: '#be123c', textAlign: 'right' }}>
                  {negPct}%
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Action Button at bottom */}
      <Button
        variant="outlined"
        fullWidth
        onClick={onViewReportsClick}
        sx={{
          borderRadius: '10px',
          height: 40,
          fontFamily: T.font.family,
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'none',
          borderColor: '#d9e2ec',
          color: '#16324f',
          bgcolor: '#ffffff',
          borderWidth: '1.5px',
          '&:hover': {
            borderColor: '#16324f',
            bgcolor: '#edf4fa',
            borderWidth: '1.5px',
          }
        }}
      >
        View detailed review reports →
      </Button>
    </Card>
  );
};

