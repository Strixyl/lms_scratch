// ── Sentiment Dashboard — Reusable Sub-Components ───────────────────────────
// Chart components, chips, tooltips, and cards extracted from SentimentDashboard.

import React, { useState } from 'react';
import {
  Box, Typography, Card, Avatar, Paper,
  Tooltip, ButtonBase,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { THEME } from '../constants/themeTokens';

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
export const TopCommentsCard = ({ title, rows = [], type = 'positive' }) => {
  const isPositive = type === 'positive';
  const borderColor = isPositive ? '#10b981' : '#ef4444';

  const cleanQuote = (msg) => {
    if (!msg) return '';
    let str = msg.trim();
    if (str.startsWith('"') && str.endsWith('"')) {
      str = str.slice(1, -1).trim();
    }
    return str;
  };

  const getKeywordBadgeText = (row) => {
    if (row.topTerm && /\(\d+x\)/.test(row.topTerm)) {
      return row.topTerm;
    }
    let term = row.topTerm || (row.Category ? row.Category.toLowerCase() : 'general');
    term = term.replace(/^"|"$/g, '').trim();
    if (term) {
      term = term.charAt(0).toUpperCase() + term.slice(1);
    }
    const freq = row.maxTermFreq || 1;
    return `"${term}" (${freq}x)`;
  };

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: 3.5,
        border: '1.5px solid #e2e8f0',
        borderTop: `4px solid ${borderColor}`,
        p: { xs: 2, sm: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
          borderColor: '#cbd5e1',
          borderTopColor: borderColor,
        }
      }}
    >
      {/* Card Header: Icon + Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
        {isPositive ? (
          <ThumbUpIcon sx={{ fontSize: 22, color: '#10b981' }} />
        ) : (
          <ThumbDownIcon sx={{ fontSize: 22, color: '#ef4444' }} />
        )}
        <Typography sx={{
          fontFamily: T.font.family,
          fontWeight: 800,
          fontSize: { xs: 15, sm: 16 },
          color: '#0f172a',
          letterSpacing: '-0.2px',
          lineHeight: 1.2,
        }}>
          {title}
        </Typography>
      </Box>

      {/* Card Content */}
      {rows.length === 0 ? (
        <Box sx={{
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3 }}>
          {rows.map((row, i) => {
            const clientele = (row.Clientele || 'STUDENT').toUpperCase();
            const isFacultyOrStaff = clientele === 'FACULTY' || clientele === 'STAFF' || clientele === 'ADMIN' || clientele === 'CPU ADMIN';
            const college = (row.College || 'CCS').toUpperCase();

            return (
              <Box
                key={i}
                sx={{
                  bgcolor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderLeft: `4px solid ${borderColor}`,
                  borderRadius: '8px',
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.8,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    borderColor: '#cbd5e1',
                    borderLeftColor: borderColor,
                  }
                }}
              >
                {/* Badge Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, flexWrap: 'wrap' }}>
                  {/* Dark Circular Number Badge */}
                  <Box sx={{
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    borderRadius: '50%',
                    bgcolor: '#0f172a',
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

                  {/* Clientele Role Badge */}
                  <Box sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: '4px',
                    bgcolor: isFacultyOrStaff ? '#0f172a' : '#ede9fe',
                    color: isFacultyOrStaff ? '#ffffff' : '#4f46e5',
                    fontFamily: T.font.family,
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    lineHeight: 1.2,
                  }}>
                    {clientele}
                  </Box>

                  {/* College Badge */}
                  {college && (
                    <Box sx={{
                      px: 1,
                      py: 0.2,
                      borderRadius: '4px',
                      bgcolor: '#ede9fe',
                      color: '#4f46e5',
                      fontFamily: T.font.family,
                      fontSize: 10.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      lineHeight: 1.2,
                    }}>
                      {college}
                    </Box>
                  )}

                  {/* Keyword & Frequency Badge */}
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.1,
                    py: 0.2,
                    borderRadius: '9999px',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: T.font.family,
                    bgcolor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    lineHeight: 1.2,
                  }}>
                    {getKeywordBadgeText(row)}
                  </Box>
                </Box>

                {/* Verbatim Comment Text */}
                <Typography sx={{
                  fontFamily: T.font.family,
                  fontSize: 13,
                  color: '#334155',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  "{cleanQuote(row.Message)}"
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
export const RecommendationCard = ({ stat }) => {
  const [expandedQuotes, setExpandedQuotes] = useState({});

  if (!stat) return null;
  const isHigh = (stat.severity || '').toUpperCase() === 'HIGH';
  const accentColor = isHigh ? '#ef4444' : '#f59e0b';

  const cleanQuote = (msg) => {
    if (!msg) return '';
    let str = typeof msg === 'string' ? msg.trim() : (msg.Message || '').trim();
    if (str.startsWith('"') && str.endsWith('"')) {
      str = str.slice(1, -1).trim();
    }
    return str;
  };

  const toggleQuoteExpand = (idx) => {
    setExpandedQuotes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const keywords = stat.keywords || [];
  const evidences = stat.evidences || stat.topEvidences || [];

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderRadius: 3.5,
        border: '1.5px solid #e2e8f0',
        borderTop: `4px solid ${accentColor}`,
        p: { xs: 2, sm: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
          borderColor: '#cbd5e1',
          borderTopColor: accentColor,
        }
      }}
    >
      {/* Header: Severity Badge + Topic Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2, mb: 1.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
          <Box sx={{
            bgcolor: isHigh ? '#ef4444' : '#f59e0b',
            color: '#ffffff',
            px: 1.2,
            py: 0.35,
            borderRadius: '5px',
            fontFamily: T.font.family,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            lineHeight: 1.2,
            flexShrink: 0,
          }}>
            {isHigh ? 'HIGH' : 'MODERATE'}
          </Box>
          <Typography sx={{
            fontFamily: T.font.family,
            fontWeight: 800,
            fontSize: { xs: 14, sm: 15 },
            color: '#0f172a',
            letterSpacing: '-0.2px',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {stat.title}
          </Typography>
        </Box>
        {stat.category && (
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 11.5,
            fontWeight: 700,
            color: '#64748b',
            bgcolor: '#f1f5f9',
            px: 1.2,
            py: 0.3,
            borderRadius: '9999px',
            flexShrink: 0,
          }}>
            {stat.category}
          </Typography>
        )}
      </Box>

      {/* Priority Action Box (Hero High-Contrast Callout) */}
      <Box sx={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
        borderRadius: 2.5,
        p: { xs: 1.8, sm: 2 },
        mb: 2.4,
        border: '1.5px solid #c7d2fe',
        borderLeft: '5px solid #4f46e5',
        boxShadow: '0 3px 12px rgba(79, 70, 229, 0.08)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.8 }}>
          <Box sx={{
            bgcolor: '#4338ca',
            color: '#ffffff',
            px: 1,
            py: 0.3,
            borderRadius: '5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.4,
          }}>
            <BoltIcon sx={{ fontSize: 13 }} />
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 10.5,
              fontWeight: 900,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              PRIORITY ACTION
            </Typography>
          </Box>
        </Box>
        <Typography sx={{
          fontFamily: T.font.family,
          fontSize: { xs: 13.5, sm: 14.5 },
          fontWeight: 800,
          color: '#1e1b4b',
          lineHeight: 1.5,
          letterSpacing: '-0.1px',
        }}>
          {stat.action}
        </Typography>
      </Box>

      {/* Pain-Point Keywords Section */}
      <Box sx={{ mb: 2.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 1 }}>
          <LocalOfferIcon sx={{ fontSize: 13, color: '#64748b' }} />
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 11,
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            PAIN-POINT KEYWORDS
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          {keywords.map((kw, i) => (
            <Box
              key={i}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.7,
                bgcolor: '#ffffff',
                border: isHigh ? '1.5px solid #fecaca' : '1.5px solid #fed7aa',
                borderRadius: '9999px',
                px: 1.4,
                py: 0.45,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <Typography sx={{
                fontFamily: T.font.family,
                fontSize: 12.5,
                fontWeight: 700,
                color: isHigh ? '#991b1b' : '#9a3412',
                lineHeight: 1.2,
                textTransform: 'capitalize',
              }}>
                {kw.word}
              </Typography>
              <Box sx={{
                bgcolor: isHigh ? '#ef4444' : '#ea580c',
                color: '#ffffff',
                borderRadius: '9999px',
                px: 0.8,
                py: 0.15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Typography sx={{
                  fontFamily: T.font.family,
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1,
                }}>
                  {kw.count}x
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Patron Evidence Section (Clean Supporting Quotes) */}
      <Box sx={{ mt: 'auto', pt: 1.8, borderTop: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <FormatQuoteIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 11,
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              PATRON EVIDENCE
            </Typography>
          </Box>
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 11,
            fontWeight: 700,
            color: '#64748b',
            bgcolor: '#f1f5f9',
            px: 0.9,
            py: 0.2,
            borderRadius: '9999px',
          }}>
            {evidences.length} {evidences.length === 1 ? 'quote' : 'quotes'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {evidences.slice(0, 3).map((ev, idx) => {
            const rawQuote = typeof ev === 'string' ? ev : (ev.Message || '');
            const cleaned = cleanQuote(rawQuote);
            const isExpanded = !!expandedQuotes[idx];
            const isLong = cleaned.length > 95;

            return (
              <Box
                key={idx}
                sx={{
                  p: 1.3,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#e2e8f0',
                    color: '#64748b',
                    fontFamily: T.font.family,
                    fontSize: 10.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.15,
                  }}>
                    #{idx + 1}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: T.font.family,
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: '#334155',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        display: isExpanded || !isLong ? 'block' : '-webkit-box',
                        WebkitLineClamp: isExpanded || !isLong ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: isExpanded || !isLong ? 'visible' : 'hidden',
                      }}
                    >
                      "{cleaned}"
                    </Typography>

                    {isLong && (
                      <ButtonBase
                        onClick={() => toggleQuoteExpand(idx)}
                        sx={{
                          mt: 0.4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.2,
                          color: '#4f46e5',
                          fontFamily: T.font.family,
                          fontSize: 11.5,
                          fontWeight: 700,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        <span>{isExpanded ? 'Show less' : 'View full quote'}</span>
                        {isExpanded ? (
                          <ExpandLessIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <ExpandMoreIcon sx={{ fontSize: 14 }} />
                        )}
                      </ButtonBase>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
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


