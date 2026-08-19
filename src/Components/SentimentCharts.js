// ── Sentiment Dashboard — Reusable Sub-Components ───────────────────────────
// Chart components, chips, tooltips, and cards extracted from SentimentDashboard.

import React from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Paper,
  Tooltip,
} from '@mui/material';
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
export const TopCommentsCard = ({ title, rows, type = 'positive', icon }) => {
  const isPositive = type === 'positive';
  const theme = isPositive ? {
    iconColor: '#10b981',
    badgeBg: '#10b981',
    badgeText: '#ffffff',
    borderLeft: '#10b981',
    chipBg: '#ecfdf5',
    chipBorder: '#6ee7b7',
    chipText: '#047857',
  } : {
    iconColor: '#f43f5e',
    badgeBg: '#f43f5e',
    badgeText: '#ffffff',
    borderLeft: '#f43f5e',
    chipBg: '#fff1f2',
    chipBorder: '#fecdd3',
    chipText: '#be123c',
  };

  return (
    <Card elevation={0} sx={{
      ...cardShellSx,
      flex: 1,
      minWidth: 300,
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.25s ease',
      '&:hover': {
        boxShadow: T.shadow.cardHover
      }
    }}>
      <Box sx={{
        ...sectionHeaderSx,
        py: 1.6, px: 2.2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{
            color: '#ffffff',
            bgcolor: theme.iconColor,
            p: 0.6,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 6px ${theme.iconColor}35`,
            '& svg': { fontSize: 18 }
          }}>
            {icon}
          </Box>
          <Typography sx={{
            fontFamily: T.font.family,
            fontWeight: 800,
            fontSize: 15,
            color: T.text.white,
            letterSpacing: '-0.2px'
          }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{
          fontFamily: T.font.family,
          fontSize: 11.5,
          color: theme.badgeText,
          bgcolor: 'rgba(255,255,255,0.2)',
          fontWeight: 800,
          px: 1.4, py: 0.35, borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          {rows.length} {rows.length === 1 ? 'Comment' : 'Comments'}
        </Typography>
      </Box>
      <CardContent sx={{
        p: 2,
        maxHeight: 330,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-track': { background: '#f8fafc' },
        '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' }
      }}>
        {rows.length === 0 ? (
          <Typography sx={{ fontFamily: T.font.family, color: T.text.faint, fontSize: 13, py: 3, textAlign: 'center' }}>
            No comments available for the active filter selection.
          </Typography>
        ) : rows.map((row, i) => (
          <Box
            key={i}
            sx={{
              p: 1.5,
              bgcolor: T.surface.card,
              border: `1px solid ${T.surface.borderLight}`,
              borderLeft: `4px solid ${theme.borderLeft}`,
              borderRadius: '8px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.15s ease',
              '&:hover': {
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <Typography sx={{
              fontFamily: T.font.family,
              fontSize: 13.5,
              color: '#0f172a',
              fontWeight: 500,
              lineHeight: 1.45,
              mb: 0.8
            }}>
              "{row.Message}"
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 0.8,
              borderTop: `1px dashed ${T.surface.borderLight}`,
              flexWrap: 'wrap',
              gap: 0.6
            }}>
              <Typography sx={{
                fontFamily: T.font.family,
                fontSize: 11.5,
                color: '#64748b',
                fontWeight: 500
              }}>
                <span style={{ textTransform: 'uppercase', color: '#0f172a', fontWeight: 700 }}>
                  {row.Clientele || 'STUDENT'}
                </span>
                {row.College ? (
                  <>
                    {' • '}
                    <span style={{ color: T.brand.indigo, fontWeight: 700 }}>
                      {row.College}
                    </span>
                  </>
                ) : ''}
                {row.Course ? (
                  <span style={{ color: '#64748b', fontWeight: 500 }}>
                    {` (${row.Course})`}
                  </span>
                ) : ''}
                {row.DateSubmitted ? (
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>
                    {` • ${row.DateSubmitted.slice(0, 10)}`}
                  </span>
                ) : ''}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.1,
                  py: 0.25,
                  borderRadius: T.radius.pill,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: T.font.family,
                  bgcolor: theme.chipBg,
                  color: theme.chipText,
                  border: `1px solid ${theme.chipBorder}`
                }}
              >
                {row.topTerm ? `Keyword: "${row.topTerm}" (${row.maxTermFreq || row.termScore}x)` : `Freq: ${row.termScore || 0}`}
              </Box>
            </Box>
          </Box>
        ))}
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


