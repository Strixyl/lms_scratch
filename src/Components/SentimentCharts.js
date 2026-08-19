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
} from '@mui/icons-material';
import { THEME, cardShellSx, sectionHeaderSx } from '../constants/themeTokens';

const T = THEME;

// ── Sentiment Status Chip ───────────────────────────────────────────────────
export const SentimentChip = ({ label }) => {
  const cfg = T.sentiment[label] || T.sentiment.Neutral;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.8,
      px: 1.5, py: 0.4, borderRadius: T.radius.chip,
      backgroundColor: cfg.light, border: `1.5px solid ${cfg.dot}`,
      boxShadow: `0 2px 6px ${cfg.dot}30`
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot }} />
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cfg.text, fontFamily: T.font.family }}>
        {label}
      </Typography>
    </Box>
  );
};

// ── Category Status Chip ────────────────────────────────────────────────────
export const CategoryChip = ({ label }) => {
  const norm = label || 'Other/Uncategorized';
  const cfg = T.category[norm] || T.category['Other/Uncategorized'];
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.8,
      px: 1.5, py: 0.4, borderRadius: T.radius.chip,
      backgroundColor: cfg.light, border: `1.5px solid ${cfg.dot}`,
      boxShadow: `0 2px 6px ${cfg.dot}30`
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot }} />
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: cfg.text, fontFamily: T.font.family }}>
        {norm}
      </Typography>
    </Box>
  );
};

// ── Summary KPI Card ────────────────────────────────────────────────────────
export const SummaryCard = ({ title, value, subtitle, icon, color = '#3b82f6', tooltipContent = null }) => {
  const cardContent = (
    <Card elevation={0} sx={{
      borderRadius: T.radius.card,
      background: `linear-gradient(150deg, ${T.surface.card} 0%, ${color}0d 100%)`,
      border: `1.5px solid ${color}35`,
      borderTop: `4px solid ${color}`,
      flex: 1, minWidth: 180,
      p: 2.5,
      cursor: tooltipContent ? 'pointer' : 'default',
      boxShadow: `0 4px 16px -2px ${color}18`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px -6px ${color}30`,
        borderColor: color
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Avatar sx={{
          bgcolor: `${color}18`,
          color: color,
          width: 48, height: 48,
          fontSize: 24,
          border: `1.5px solid ${color}35`,
          boxShadow: `0 2px 10px ${color}20`
        }}>
          {icon}
        </Avatar>
      </Box>
      <Typography sx={{ fontFamily: T.font.family, fontWeight: 800, fontSize: 32, color: T.text.primary, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontFamily: T.font.family, fontWeight: 700, fontSize: 14, color: T.text.body, mt: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontFamily: T.font.family, fontSize: 12, color: T.text.muted, mt: 0.5, fontWeight: 500 }}>
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
    iconColor: '#10b981',
    badgeBg: '#10b981',
    badgeText: '#ffffff',
    borderLeft: '#10b981',
    rankBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    rankText: '#ffffff',
    cardHoverBorder: '#34d399',
    itemBorder: '#d1fae5',
    chipBg: '#ecfdf5',
    chipBorder: '#6ee7b7',
    chipText: '#047857',
  } : {
    iconColor: '#f43f5e',
    badgeBg: '#f43f5e',
    badgeText: '#ffffff',
    borderLeft: '#f43f5e',
    rankBg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    rankText: '#ffffff',
    cardHoverBorder: '#fb7185',
    itemBorder: '#ffe4e6',
    chipBg: '#fff1f2',
    chipBorder: '#fecdd3',
    chipText: '#be123c',
  };

  return (
    <Card
      elevation={0}
      sx={{
        ...cardShellSx,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.25s ease',
        border: `1.5px solid ${T.surface.border}`,
        '&:hover': {
          boxShadow: T.shadow.cardHover,
          borderColor: theme.cardHoverBorder,
        }
      }}
    >
      {/* Card Header */}
      <Box sx={{
        ...sectionHeaderSx,
        py: 1.8,
        px: { xs: 2, md: 2.8 },
        background: THEME.brand.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
          <Box sx={{
            color: '#ffffff',
            bgcolor: theme.iconColor,
            p: 0.8,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${theme.iconColor}45`,
            '& svg': { fontSize: 20 }
          }}>
            {icon}
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: T.font.family,
              fontWeight: 800,
              fontSize: { xs: 15, md: 16.5 },
              color: T.text.white,
              letterSpacing: '-0.2px',
              lineHeight: 1.2,
            }}>
              {title}
            </Typography>
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 12,
              color: T.text.link,
              fontWeight: 500,
              mt: 0.2,
            }}>
              Ranked by domain lexicon relevance & impact score
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: 11.5,
            color: '#ffffff',
            bgcolor: 'rgba(255,255,255,0.18)',
            fontWeight: 800,
            px: 1.6,
            py: 0.45,
            borderRadius: T.radius.pill,
            border: '1px solid rgba(255,255,255,0.3)',
            letterSpacing: '0.3px',
          }}>
            {rows.length} of 5 Comments
          </Typography>
        </Box>
      </Box>

      {/* Card Content - NOT SCROLLABLE, larger, symmetrical */}
      <CardContent sx={{
        p: { xs: 2, sm: 2.5, md: 2.8 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.8,
        flex: 1,
        bgcolor: '#fafcff',
      }}>
        {rows.length === 0 ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            px: 2,
            bgcolor: T.surface.cardAlt,
            borderRadius: 3,
            border: `1.5px dashed ${T.surface.border}`,
          }}>
            <Typography sx={{
              fontFamily: T.font.family,
              fontWeight: 700,
              color: T.text.secondary,
              fontSize: 14,
              textAlign: 'center',
            }}>
              No {isPositive ? 'positive' : 'negative'} comments recorded for current filters.
            </Typography>
            <Typography sx={{
              fontFamily: T.font.family,
              color: T.text.muted,
              fontSize: 12,
              mt: 0.5,
              textAlign: 'center',
            }}>
              Adjust date ranges or filters to inspect other patron sentiments.
            </Typography>
          </Box>
        ) : (
          rows.map((row, i) => (
            <Box
              key={i}
              sx={{
                p: { xs: 1.8, md: 2.2 },
                bgcolor: '#ffffff',
                border: `1.5px solid ${theme.itemBorder}`,
                borderLeft: `5px solid ${theme.borderLeft}`,
                borderRadius: '12px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 1.4,
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.07)',
                  transform: 'translateY(-2px)',
                  borderColor: theme.cardHoverBorder,
                }
              }}
            >
              {/* Comment Header: Rank & Keyword Badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    background: theme.rankBg,
                    color: theme.rankText,
                    px: 1.2,
                    py: 0.3,
                    borderRadius: '6px',
                    fontFamily: T.font.family,
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: '0.4px',
                    boxShadow: `0 2px 4px ${theme.iconColor}30`,
                  }}>
                    #{i + 1}
                  </Box>
                  <Typography sx={{
                    fontFamily: T.font.family,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: T.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Patron Feedback
                  </Typography>
                </Box>

                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.2,
                  py: 0.35,
                  borderRadius: T.radius.pill,
                  fontSize: 11.5,
                  fontWeight: 700,
                  fontFamily: T.font.family,
                  bgcolor: theme.chipBg,
                  color: theme.chipText,
                  border: `1px solid ${theme.chipBorder}`,
                }}>
                  {row.topTerm ? `Keyword: "${row.topTerm}" (${row.maxTermFreq || row.termScore}x)` : `Impact Score: ${Math.round(row.blendedScore || 0)}`}
                </Box>
              </Box>

              {/* Verbatim Comment Text */}
              <Typography sx={{
                fontFamily: T.font.family,
                fontSize: { xs: 14, md: 15 },
                color: '#0f172a',
                fontWeight: 500,
                lineHeight: 1.6,
                fontStyle: 'normal',
                position: 'relative',
              }}>
                "{row.Message}"
              </Typography>

              {/* Patron Metadata Footer */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pt: 1.2,
                borderTop: `1px dashed #e2e8f0`,
                flexWrap: 'wrap',
                gap: 0.8,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.8 }}>
                  <Box sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: '4px',
                    bgcolor: '#f1f5f9',
                    fontFamily: T.font.family,
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {row.Clientele || 'STUDENT'}
                  </Box>
                  {row.College && (
                    <Box sx={{
                      px: 1,
                      py: 0.2,
                      borderRadius: '4px',
                      bgcolor: '#e0e7ff',
                      fontFamily: T.font.family,
                      fontSize: 11,
                      fontWeight: 800,
                      color: T.brand.indigo,
                    }}>
                      {row.College}
                    </Box>
                  )}
                  {row.Course && (
                    <Typography sx={{
                      fontFamily: T.font.family,
                      fontSize: 11.5,
                      color: '#64748b',
                      fontWeight: 500,
                    }}>
                      {row.Course}
                    </Typography>
                  )}
                </Box>

                {row.DateSubmitted && (
                  <Typography sx={{
                    fontFamily: T.font.family,
                    fontSize: 11.5,
                    color: '#94a3b8',
                    fontWeight: 500,
                  }}>
                    {row.DateSubmitted.slice(0, 10)}
                  </Typography>
                )}
              </Box>
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
      icon: <ApartmentIcon sx={{ fontSize: 22 }} />,
    },
    Staff: {
      accent: isHigh ? '#dc2626' : '#7c3aed',
      badgeBg: isHigh ? '#7f1d1d' : '#f3e8ff',
      badgeColor: isHigh ? '#ffffff' : '#6b21a8',
      icon: <PeopleIcon sx={{ fontSize: 22 }} />,
    },
    Collection: {
      accent: isHigh ? '#dc2626' : '#ea580c',
      badgeBg: isHigh ? '#7f1d1d' : '#ffedd5',
      badgeColor: isHigh ? '#ffffff' : '#c2410c',
      icon: <MenuBookIcon sx={{ fontSize: 22 }} />,
    },
    'Other/Uncategorized': {
      accent: isHigh ? '#dc2626' : '#475569',
      badgeBg: isHigh ? '#7f1d1d' : '#f1f5f9',
      badgeColor: isHigh ? '#ffffff' : '#475569',
      icon: <LightbulbIcon sx={{ fontSize: 22 }} />,
    }
  }[stat.category] || {
    accent: isHigh ? '#dc2626' : '#f59e0b',
    badgeBg: isHigh ? '#7f1d1d' : '#fffbeb',
    badgeColor: isHigh ? '#ffffff' : '#b45309',
    icon: <LightbulbIcon sx={{ fontSize: 22 }} />,
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
        borderRadius: 3.5,
        border: `1.5px solid ${T.surface.border}`,
        borderTop: `4px solid ${catTheme.accent}`,
        transition: 'all 0.25s ease',
        '&:hover': {
          boxShadow: T.shadow.cardHover,
          borderColor: catTheme.accent,
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Category Header Bar */}
      <Box sx={{
        p: { xs: 2, md: 2.5 },
        bgcolor: '#ffffff',
        borderBottom: `1px solid ${T.surface.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
      }}>
        {/* Category Identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
          <Box sx={{
            bgcolor: `${catTheme.accent}15`,
            color: catTheme.accent,
            p: 1,
            borderRadius: '10px',
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
              fontSize: { xs: 16, md: 17 },
              color: '#0f172a',
              letterSpacing: '-0.2px',
            }}>
              {stat.category} Service
            </Typography>
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 12.5,
              fontWeight: 700,
              color: isHigh ? '#dc2626' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              mt: 0.2,
            }}>
              <span>●</span> {stat.pct}% Negative Sentiment ({stat.negative} of {stat.total} responses)
            </Typography>
          </Box>
        </Box>

        {/* Priority Badge */}
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          px: 1.5,
          py: 0.5,
          borderRadius: T.radius.pill,
          bgcolor: severityBadge.bg,
          color: severityBadge.text,
          border: `1px solid ${severityBadge.border}`,
          fontFamily: T.font.family,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          boxShadow: isHigh ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
        }}>
          {severityBadge.label}
        </Box>
      </Box>

      {/* Card Body - NOT SCROLLABLE, displays all recommendations & evidence */}
      <CardContent sx={{
        p: { xs: 2.2, md: 2.8 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2.2,
        flex: 1,
        bgcolor: '#fafcff',
      }}>
        {/* Actionable Recommendation Box */}
        <Box sx={{
          p: { xs: 2, md: 2.4 },
          bgcolor: '#ffffff',
          borderRadius: '12px',
          border: `1.5px solid ${isHigh ? '#fecdd3' : '#fed7aa'}`,
          borderLeft: `5px solid ${isHigh ? '#dc2626' : '#f59e0b'}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LightbulbIcon sx={{ fontSize: 18, color: isHigh ? '#dc2626' : '#d97706' }} />
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 11.5,
              fontWeight: 800,
              color: isHigh ? '#be123c' : '#b45309',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}>
              Strategic Recommendation Action
            </Typography>
          </Box>
          <Typography sx={{
            fontFamily: T.font.family,
            fontSize: { xs: 14.5, md: 15 },
            fontWeight: 600,
            color: '#1e293b',
            lineHeight: 1.6,
          }}>
            {recommendationText || 'Review patron feedback and assess operational adjustments.'}
          </Typography>
        </Box>

        {/* Supporting Patron Feedback Evidence Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2,
          flex: 1,
          justifyContent: 'flex-start',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.8 }}>
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 12,
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}>
              Supporting Patron Evidence
            </Typography>
            <Box sx={{
              px: 1.2,
              py: 0.3,
              borderRadius: '6px',
              bgcolor: '#e2e8f0',
              color: '#334155',
              fontFamily: T.font.family,
              fontSize: 11,
              fontWeight: 700,
            }}>
              Top Keyword: "{(stat.primaryKw || 'General').toUpperCase()}"
            </Box>
          </Box>

          {/* Evidence Quotes */}
          {stat.topEvidences && stat.topEvidences.length > 0 ? (
            stat.topEvidences.slice(0, 3).map((ev, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.8,
                  bgcolor: '#ffffff',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <Typography sx={{
                  fontFamily: T.font.family,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: '#0f172a',
                  lineHeight: 1.55,
                  fontStyle: 'normal',
                }}>
                  "{ev.Message}"
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pt: 0.8,
                  borderTop: '1px dashed #f1f5f9',
                  flexWrap: 'wrap',
                  gap: 0.6,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Typography sx={{
                      fontFamily: T.font.family,
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#475569',
                      textTransform: 'uppercase',
                    }}>
                      {ev.Clientele || 'STUDENT'}
                    </Typography>
                    {ev.College && (
                      <Typography sx={{
                        fontFamily: T.font.family,
                        fontSize: 11,
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
                      fontSize: 10.5,
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
              fontSize: 12.5,
              color: T.text.faint,
              fontStyle: 'italic',
              p: 2,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: T.sentiment.Positive.bg }} />
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: T.sentiment.Positive.text }}>
                Positive (▲)
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 800, color: T.sentiment.Positive.text }}>
              +{pos} ({posPct}%)
            </Typography>
          </Box>

          {/* Negative Balance Outflow */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.8, px: 1.2, borderRadius: 2, bgcolor: T.sentiment.Negative.light, border: `1px solid ${T.sentiment.Negative.dot}60` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: T.sentiment.Negative.bg }} />
              <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 700, color: T.sentiment.Negative.text }}>
                Negative (▼)
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: T.font.family, fontSize: 12, fontWeight: 800, color: T.sentiment.Negative.text }}>
              -{rawNeg} ({negPct}%)
            </Typography>
          </Box>

          {/* Neutral count if any */}
          {neu > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.6, px: 1.2, borderRadius: 2, bgcolor: T.sentiment.Neutral.light, border: `1px solid ${T.sentiment.Neutral.dot}40` }}>
              <Typography sx={{ fontFamily: T.font.family, fontSize: 11.5, fontWeight: 700, color: T.sentiment.Neutral.text }}>
                Neutral
              </Typography>
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
            <Typography sx={{ fontFamily: T.font.family, fontSize: 13, color: '#6d28d9', fontWeight: 800 }}>
              {avgScore !== null && avgScore > 0 ? `⭐ ${avgScore.toFixed(1)} / 5.0` : 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }
  return null;
};


