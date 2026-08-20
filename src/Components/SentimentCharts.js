// ── Sentiment Dashboard — Reusable Sub-Components ───────────────────────────
// Chart components, chips, tooltips, and cards extracted from SentimentDashboard.

import React from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Paper,
  Tooltip,
} from '@mui/material';
import {
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  ArrowDropUp as ArrowDropUpIcon,
  ArrowDropDown as ArrowDropDownIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { THEME, cardShellSx, sectionHeaderSx } from '../constants/themeTokens';

const T = THEME;

// ── Sentiment Status Chip (Plain Colored Text with Indicator Icon) ──────────
export const SentimentChip = ({ label }) => {
  const norm = label || 'Neutral';
  const isPos = norm === 'Positive';
  const isNeg = norm === 'Negative';

  const config = isPos
    ? { text: '#16a34a', icon: <ArrowDropUpIcon sx={{ fontSize: 20, my: -0.4, ml: -0.3, mr: -0.2 }} /> }
    : isNeg
      ? { text: '#dc2626', icon: <ArrowDropDownIcon sx={{ fontSize: 20, my: -0.4, ml: -0.3, mr: -0.2 }} /> }
      : { text: '#d97706', icon: <FiberManualRecordIcon sx={{ fontSize: 8, mr: 0.3 }} /> };

  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.4,
      color: config.text,
    }}>
      {config.icon}
      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: config.text, fontFamily: T.font.family, lineHeight: 1.2 }}>
        {norm}
      </Typography>
    </Box>
  );
};

// ── Category Status Chip (Plain Colored Text, No Pill Border/Background) ────
export const CategoryChip = ({ label }) => {
  const norm = label || 'Other/Uncategorized';

  const catStyles = {
    Staff: { text: '#0284c7' },
    Facilities: { text: '#7c3aed' },
    Collection: { text: '#db2777' },
    'Other/Uncategorized': { text: '#64748b' },
  };

  const config = catStyles[norm] || catStyles['Other/Uncategorized'];

  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: config.text, fontFamily: T.font.family, lineHeight: 1.2 }}>
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
  color = '#3b82f6',
  tooltipContent = null,
  isFeatured = false,
  footnote = null,
}) => {
  if (isFeatured) {
    const cardContent = (
      <Card elevation={0} sx={{
        borderRadius: 3.5,
        bgcolor: '#1d2f8a',
        background: 'linear-gradient(145deg, #1d2f8a 0%, #152266 100%)',
        flex: 1,
        minWidth: 180,
        p: 2.2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: tooltipContent ? 'pointer' : 'default',
        boxShadow: '0 4px 16px -2px rgba(29, 47, 138, 0.35)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px -4px rgba(29, 47, 138, 0.45)',
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 11,
            fontWeight: 800,
            color: '#93c5fd',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}>
            {title || 'TOTAL SURVEYS'}
          </Typography>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.12)',
            color: '#93c5fd',
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
            color: '#bfdbfe',
            fontWeight: 500,
            mt: 0.3,
          }}>
            {subtitle || 'total responses'}
          </Typography>
          {footnote && (
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 11,
              color: '#93c5fd',
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
      <Typography sx={{ fontFamily: T.font.family, fontWeight: 800, fontSize: 28, color: '#0f172a', lineHeight: 1.1 }}>
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

// ── Top Comments Card (Positive / Negative) ─────────────────────────────────
export const TopCommentsCard = ({ title, rows = [], type = 'positive', icon }) => {
  const isPositive = type === 'positive';
  const theme = isPositive ? {
    iconColor: '#15803d',
    iconBg: '#dcfce7',
    borderLeft: '#22c55e',
    rankBg: '#15803d',
    rankText: '#ffffff',
    cardHoverBorder: '#86efac',
    chipBg: '#dcfce7',
    chipColor: '#15803d',
  } : {
    iconColor: '#dc2626',
    iconBg: '#fee2e2',
    borderLeft: '#ef4444',
    rankBg: '#dc2626',
    rankText: '#ffffff',
    cardHoverBorder: '#fca5a5',
    chipBg: '#fee2e2',
    chipColor: '#dc2626',
  };

  return (
    <Card
      elevation={0}
      sx={{
        ...cardShellSx,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          borderColor: theme.cardHoverBorder,
        }
      }}
    >
      {/* Clean Card Header */}
      <Box sx={{
        py: 1.4,
        px: { xs: 1.8, md: 2.2 },
        bgcolor: '#ffffff',
        borderBottom: `1px solid ${T.surface.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            color: theme.iconColor,
            bgcolor: theme.iconBg,
            p: 0.55,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 17 }
          }}>
            {icon}
          </Box>
          <Typography sx={{
            fontFamily: T.font.family,
            fontWeight: 800,
            fontSize: 15,
            color: '#0f172a',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}>
            {title}
          </Typography>
        </Box>

        <Typography sx={{
          fontFamily: T.font.family,
          fontSize: 11.5,
          color: '#475569',
          bgcolor: '#f1f5f9',
          fontWeight: 700,
          px: 1.4,
          py: 0.35,
          borderRadius: '9999px',
          letterSpacing: '0.2px',
        }}>
          {rows.length} of 5 Comments
        </Typography>
      </Box>

      {/* Compressed Card Content */}
      <CardContent sx={{
        p: { xs: 1.2, sm: 1.6 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flex: 1,
        bgcolor: '#ffffff',
      }}>
        {rows.length === 0 ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
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
              textAlign: 'center',
            }}>
              No {isPositive ? 'positive' : 'negative'} comments recorded for current filters.
            </Typography>
          </Box>
        ) : (
          rows.map((row, i) => (
            <Box
              key={i}
              sx={{
                p: 1.2,
                px: 1.4,
                bgcolor: '#f8fafc',
                border: `1px solid ${T.surface.borderLight}`,
                borderLeft: `4px solid ${theme.borderLeft}`,
                borderRadius: '8px',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 0.6,
                '&:hover': {
                  bgcolor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  borderColor: theme.cardHoverBorder,
                }
              }}
            >
              {/* Header row: Rank + Patron tags + Keyword badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Box sx={{
                    bgcolor: theme.rankBg,
                    color: theme.rankText,
                    px: 0.7,
                    py: 0.1,
                    borderRadius: '4px',
                    fontFamily: T.font.family,
                    fontSize: 10.5,
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}>
                    #{i + 1}
                  </Box>
                  <Box sx={{
                    px: 0.7,
                    py: 0.1,
                    borderRadius: '4px',
                    bgcolor: '#e2e8f0',
                    fontFamily: T.font.family,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#334155',
                    textTransform: 'uppercase',
                  }}>
                    {row.Clientele || 'STUDENT'}
                  </Box>
                  {row.College && (
                    <Box sx={{
                      px: 0.8,
                      py: 0.1,
                      borderRadius: '9999px',
                      bgcolor: '#ede9fe',
                      fontFamily: T.font.family,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#4f46e5',
                    }}>
                      {row.College}
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1,
                    py: 0.15,
                    borderRadius: '9999px',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: T.font.family,
                    bgcolor: theme.chipBg,
                    color: theme.chipColor,
                  }}>
                    {row.topTerm ? `"${row.topTerm}" (${row.maxTermFreq || row.termScore}x)` : `Score: ${Math.round(row.blendedScore || 0)}`}
                  </Box>
                  {row.DateSubmitted && (
                    <Typography sx={{
                      fontFamily: T.font.family,
                      fontSize: 11,
                      color: '#94a3b8',
                      fontWeight: 500,
                    }}>
                      {row.DateSubmitted.slice(0, 10)}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Verbatim Comment Text */}
              <Typography sx={{
                fontFamily: T.font.family,
                fontSize: 13.5,
                color: '#1e293b',
                fontWeight: 500,
                lineHeight: 1.45,
              }}>
                "{row.Message}"
              </Typography>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// ── Recommendation Card for a specific flagged category ───────────────────
export const RecommendationCard = ({ stat, recommendationText }) => {
  const isHigh = stat.severity === 'high';

  const catTheme = {
    Facilities: {
      accent: isHigh ? '#dc2626' : '#0288d1',
      badgeBg: isHigh ? '#7f1d1d' : '#e0f2fe',
      badgeColor: isHigh ? '#ffffff' : '#0369a1',
      icon: <ApartmentIcon sx={{ fontSize: 18 }} />,
    },
    Staff: {
      accent: isHigh ? '#dc2626' : '#7c3aed',
      badgeBg: isHigh ? '#7f1d1d' : '#f3e8ff',
      badgeColor: isHigh ? '#ffffff' : '#6b21a8',
      icon: <PeopleIcon sx={{ fontSize: 18 }} />,
    },
    Collection: {
      accent: isHigh ? '#dc2626' : '#ea580c',
      badgeBg: isHigh ? '#7f1d1d' : '#ffedd5',
      badgeColor: isHigh ? '#ffffff' : '#c2410c',
      icon: <MenuBookIcon sx={{ fontSize: 18 }} />,
    },
    'Other/Uncategorized': {
      accent: isHigh ? '#dc2626' : '#475569',
      badgeBg: isHigh ? '#7f1d1d' : '#f1f5f9',
      badgeColor: isHigh ? '#ffffff' : '#475569',
      icon: <LightbulbIcon sx={{ fontSize: 18 }} />,
    }
  }[stat.category] || {
    accent: isHigh ? '#dc2626' : '#f59e0b',
    badgeBg: isHigh ? '#7f1d1d' : '#fffbeb',
    badgeColor: isHigh ? '#ffffff' : '#b45309',
    icon: <LightbulbIcon sx={{ fontSize: 18 }} />,
  };

  const severityBadge = isHigh ? {
    label: 'HIGH PRIORITY',
    bg: '#ef4444',
    text: '#ffffff',
    border: '#dc2626',
  } : {
    label: 'MODERATE PRIORITY',
    bg: '#fef3c7',
    text: '#92400e',
    border: '#fde68a',
  };

  return (
    <Card
      elevation={0}
      sx={{
        ...cardShellSx,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2.5,
        border: `1.5px solid ${T.surface.border}`,
        borderTop: `3.5px solid ${catTheme.accent}`,
        transition: 'all 0.25s ease',
        '&:hover': {
          boxShadow: T.shadow.cardHover,
          borderColor: catTheme.accent,
        }
      }}
    >
      {/* Category Header Bar - Compact */}
      <Box sx={{
        py: 1.1,
        px: { xs: 1.5, md: 2 },
        bgcolor: '#ffffff',
        borderBottom: `1px solid ${T.surface.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}>
        {/* Category Identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            bgcolor: `${catTheme.accent}15`,
            color: catTheme.accent,
            p: 0.6,
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${catTheme.accent}30`,
          }}>
            {catTheme.icon}
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: T.font.family,
              fontWeight: 800,
              fontSize: 14,
              color: '#0f172a',
              lineHeight: 1.2,
            }}>
              {stat.category} Service
            </Typography>
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 11,
              fontWeight: 700,
              color: isHigh ? '#dc2626' : '#d97706',
              mt: 0.1,
            }}>
              {stat.pct}% Negative ({stat.negative}/{stat.total})
            </Typography>
          </Box>
        </Box>

        {/* Priority Badge */}
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.1,
          py: 0.25,
          borderRadius: T.radius.pill,
          bgcolor: severityBadge.bg,
          color: severityBadge.text,
          border: `1px solid ${severityBadge.border}`,
          fontFamily: T.font.family,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
        }}>
          {severityBadge.label}
        </Box>
      </Box>

      {/* Card Body - Compressed */}
      <CardContent sx={{
        p: { xs: 1.2, sm: 1.5 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flex: 1,
        bgcolor: '#f8fafc',
      }}>
        {/* Actionable Recommendation Box */}
        <Box sx={{
          p: 1.1,
          px: 1.3,
          bgcolor: '#ffffff',
          borderRadius: '7px',
          border: `1px solid ${isHigh ? '#fecdd3' : '#fed7aa'}`,
          borderLeft: `4px solid ${isHigh ? '#dc2626' : '#f59e0b'}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.3 }}>
            <LightbulbIcon sx={{ fontSize: 14, color: isHigh ? '#dc2626' : '#d97706' }} />
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 10.5,
              fontWeight: 800,
              color: isHigh ? '#be123c' : '#b45309',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}>
              Improvement Recommendations
            </Typography>
          </Box>
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 12.6,
            fontWeight: 600,
            color: '#1e293b',
            lineHeight: 1.45,
          }}>
            {recommendationText || 'Review patron feedback and assess operational adjustments.'}
          </Typography>
        </Box>

        {/* Supporting Patron Feedback Evidence */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.6,
          flex: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.6 }}>
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 10.5,
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}>
              Patron Evidence
            </Typography>
            <Box sx={{
              px: 0.8,
              py: 0.1,
              borderRadius: '4px',
              bgcolor: '#e2e8f0',
              color: '#334155',
              fontFamily: T.font.family,
              fontSize: 9.5,
              fontWeight: 700,
            }}>
              Keyword: "{(stat.primaryKw || 'General').toUpperCase()}"
            </Box>
          </Box>

          {/* Evidence Quotes - Compressed */}
          {stat.topEvidences && stat.topEvidences.length > 0 ? (
            stat.topEvidences.slice(0, 2).map((ev, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 0.9,
                  px: 1.1,
                  bgcolor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                }}
              >
                <Typography sx={{
                  fontFamily: T.font.family,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#0f172a',
                  lineHeight: 1.4,
                }}>
                  "{ev.Message}"
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pt: 0.3,
                  borderTop: '1px dashed #f1f5f9',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{
                      fontFamily: T.font.family,
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: '#475569',
                      textTransform: 'uppercase',
                    }}>
                      {ev.Clientele || 'STUDENT'}
                    </Typography>
                    {ev.College && (
                      <Typography sx={{
                        fontFamily: T.font.family,
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: T.brand.indigo,
                      }}>
                        • {ev.College}
                      </Typography>
                    )}
                  </Box>
                  {ev.DateSubmitted && (
                    <Typography sx={{
                      fontFamily: T.font.family,
                      fontSize: 9.5,
                      color: '#94a3b8',
                      fontWeight: 500,
                    }}>
                      {ev.DateSubmitted.slice(0, 10)}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          ) : (
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 11,
              color: T.text.faint,
              fontStyle: 'italic',
              p: 1,
              textAlign: 'center',
            }}>
              No specific patron quote available for this category.
            </Typography>
          )}
        </Box>
      </CardContent>
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


