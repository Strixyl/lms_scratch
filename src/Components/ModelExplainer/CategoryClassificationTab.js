import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Slider,
  Divider,
  Button,
  ButtonBase,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { THEME } from '../../constants/themeTokens';
import { getCategoryStyle } from './explainerUtils';

const CATEGORY_ORDER = ['Facilities', 'Staff', 'Collection', 'Other/Uncategorized'];
const EMPTY_PROBS = {
  Facilities: 0,
  Staff: 0,
  Collection: 0,
  'Other/Uncategorized': 0,
};
const EMPTY_FEATURES = [];

function CustomProbTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  const st = getCategoryStyle(item.key);
  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.2,
        borderRadius: '10px',
        border: `1px solid ${st.border}`,
        bgcolor: '#ffffff',
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: st.text }}>
        {item.key}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: THEME.text.primary, fontWeight: 700, mt: 0.2 }}>
        {item.percent.toFixed(1)}% probability
      </Typography>
      <Typography sx={{ fontSize: '0.68rem', color: THEME.text.secondary, mt: 0.2 }}>
        {item.meetsThreshold
          ? `Meets ${item.thresholdPct}% guard`
          : `Below ${item.thresholdPct}% guard`}
      </Typography>
    </Paper>
  );
}

export default function CategoryClassificationTab({
  inputText,
  diagnosticResult,
  confidenceThreshold,
  onConfidenceThresholdChange,
}) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [stemmingOpen, setStemmingOpen] = useState(false);

  const nb = diagnosticResult?.naive_bayes;
  const categoryProbs = useMemo(() => nb?.probabilities || EMPTY_PROBS, [nb]);
  const extractedFeatures = useMemo(() => nb?.extracted_features || EMPTY_FEATURES, [nb]);

  const alpha = nb?.alpha ?? 0.01;
  const rawWinner = nb?.raw_winner || 'Other/Uncategorized';
  const rawConf = nb?.raw_confidence ?? nb?.final_confidence ?? 0;
  const serverCategory = nb?.final_category || 'Other/Uncategorized';
  const serverFallback = Boolean(nb?.fallback_applied);
  const preprocessedText = diagnosticResult?.preprocessed_text || '';
  const stemmedTokens = useMemo(
    () => preprocessedText.split(/\s+/).filter(Boolean),
    [preprocessedText]
  );

  const thresholdPct = Math.round(confidenceThreshold * 100);
  const hasText = Boolean((inputText || '').trim());

  const thresholdTriggeredPreview =
    hasText && rawWinner !== 'Other/Uncategorized' && rawConf < confidenceThreshold;
  const isCustomThreshold = Math.abs(confidenceThreshold - 0.45) > 0.001;
  const effectiveCategory =
    diagnosticResult?.source === 'simulation'
      ? serverCategory
      : isCustomThreshold && thresholdTriggeredPreview
        ? 'Other/Uncategorized'
        : serverCategory;
  const effectiveFallback =
    diagnosticResult?.source === 'simulation'
      ? serverFallback
      : serverFallback || (isCustomThreshold && thresholdTriggeredPreview);

  const chartData = useMemo(() => {
    return CATEGORY_ORDER.map((catKey) => {
      const prob = Number(categoryProbs[catKey] || 0);
      const percent = Number(Math.min(100, Math.max(0, prob * 100)).toFixed(1));
      const style = getCategoryStyle(catKey);
      return {
        key: catKey,
        name: catKey === 'Other/Uncategorized' ? 'Other' : catKey,
        percent,
        color: style.solid,
        isWinner: effectiveCategory === catKey,
        meetsThreshold: percent >= thresholdPct,
        thresholdPct,
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [categoryProbs, effectiveCategory, thresholdPct]);

  const ranked = useMemo(
    () => Object.entries(categoryProbs).sort((a, b) => b[1] - a[1]),
    [categoryProbs]
  );
  const topProb = ranked[0]?.[1] || 0;
  const secondName = ranked[1]?.[0] || '—';
  const secondProb = ranked[1]?.[1] || 0;
  const leadMargin = Math.max(0, (topProb - secondProb) * 100);

  const maxTfidf = useMemo(
    () => extractedFeatures.reduce((m, f) => Math.max(m, f.tfidf || 0), 0.01),
    [extractedFeatures]
  );

  const visibleFeatures = showAllFeatures ? extractedFeatures : extractedFeatures.slice(0, 6);

  return (
    <Stack spacing={3} divider={<Divider sx={{ borderColor: '#f1f5f9' }} />}>
      {/* Section 1: Posterior Probability Chart + Live Threshold Control */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
            Class Probabilities &amp; Confidence Guard
          </Typography>
          <Typography sx={{ fontSize: '0.73rem', color: THEME.text.secondary }}>
            Laplace α = {alpha} · +{leadMargin.toFixed(1)} pts ahead of {secondName === 'Other/Uncategorized' ? 'Other' : secondName}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' },
            gap: 2.5,
            alignItems: 'center',
          }}
        >
          {/* Recharts Horizontal Bar Chart with Live τ Reference Line */}
          <Box sx={{ width: '100%', height: 196 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 18, right: 42, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: THEME.text.faint, fontFamily: THEME.font.family }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={84}
                  tick={{ fontSize: 12, fontWeight: 600, fill: THEME.text.primary, fontFamily: THEME.font.family }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<CustomProbTooltip />} cursor={{ fill: '#f8fafc' }} />
                <ReferenceLine
                  x={thresholdPct}
                  stroke={THEME.brand.primary}
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  label={{
                    value: `τ ${thresholdPct}%`,
                    position: 'top',
                    fill: THEME.brand.primary,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: THEME.font.family,
                  }}
                />
                <Bar dataKey="percent" radius={[0, 6, 6, 0]} maxBarSize={22} isAnimationActive={false}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.color}
                      fillOpacity={entry.isWinner ? 1 : 0.35}
                    />
                  ))}
                  <LabelList
                    dataKey="percent"
                    position="right"
                    formatter={(v) => `${v}%`}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      fill: THEME.text.primary,
                      fontFamily: THEME.font.family,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Clean Threshold Slider Control */}
          <Box sx={{ p: 1.8, borderRadius: '10px', bgcolor: THEME.surface.cardAlt }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: THEME.text.primary }}>
                Guard Threshold (τ)
              </Typography>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: THEME.brand.primary }}>
                {thresholdPct}%
              </Typography>
            </Box>

            <Slider
              value={confidenceThreshold}
              min={0.2}
              max={0.8}
              step={0.05}
              onChange={(e, val) => onConfidenceThresholdChange(val)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
              aria-label="Category confidence fallback threshold"
              sx={{ color: THEME.brand.primary }}
            />

            <Typography
              sx={{
                fontSize: '0.73rem',
                fontWeight: 600,
                color: !hasText
                  ? THEME.text.secondary
                  : effectiveFallback
                    ? THEME.status.errorText
                    : THEME.status.success,
                mt: 0.4,
              }}
            >
              {!hasText
                ? 'Enter feedback text to test the guard.'
                : effectiveFallback
                  ? `${(rawConf * 100).toFixed(1)}% falls below ${thresholdPct}% -> routed to Other/Uncategorized.`
                  : `${(rawConf * 100).toFixed(1)}% clears ${thresholdPct}% -> ${effectiveCategory} confirmed.`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Section 2: Matched TF-IDF Vocabulary Signals */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
            Top TF-IDF Feature Signals
          </Typography>
          <Typography sx={{ fontSize: '0.73rem', color: THEME.text.secondary }}>
            {extractedFeatures.length} matched {extractedFeatures.length === 1 ? 'token' : 'tokens'}
          </Typography>
        </Box>

        {visibleFeatures.length > 0 ? (
          <Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontSize: '0.68rem', fontWeight: 700, color: THEME.text.faint, textTransform: 'uppercase', borderBottom: `1px solid ${THEME.surface.borderLight}`, py: 0.8 } }}>
                    <TableCell sx={{ pl: 0 }}>Token</TableCell>
                    <TableCell sx={{ width: '40%' }}>Relative Weight</TableCell>
                    <TableCell align="right">TF-IDF</TableCell>
                    <TableCell align="right" sx={{ pr: 0 }}>Domain</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleFeatures.map((feat, idx) => {
                    const catSt = feat.domain_category ? getCategoryStyle(feat.domain_category) : null;
                    const barPct = Math.min(100, ((feat.tfidf || 0) / maxTfidf) * 100);
                    return (
                      <TableRow
                        key={`${feat.token}-${idx}`}
                        sx={{ '& td': { borderBottom: '1px solid #f1f5f9', py: 0.9 } }}
                      >
                        <TableCell sx={{ pl: 0, fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: THEME.text.primary }}>
                          {feat.token}
                        </TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={barPct}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#f1f5f9',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: catSt ? catSt.solid : '#94a3b8',
                                borderRadius: 3,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: THEME.text.secondary }}>
                          {Number(feat.tfidf || 0).toFixed(3)}
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 0 }}>
                          {feat.domain_category ? (
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: catSt.text }}>
                              {feat.domain_category}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1' }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {extractedFeatures.length > 6 && (
              <Button
                size="small"
                onClick={() => setShowAllFeatures((prev) => !prev)}
                sx={{ mt: 1, fontSize: '0.73rem', color: THEME.brand.primary, px: 0.5 }}
              >
                {showAllFeatures ? 'Show fewer' : `Show all ${extractedFeatures.length} tokens`}
              </Button>
            )}
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.78rem', color: THEME.text.secondary }}>
            No non-zero TF-IDF vocabulary tokens matched this statement.
          </Typography>
        )}
      </Box>

      {/* Section 3: Collapsible Preprocessing & Stemming Inspector */}
      <Box>
        <ButtonBase
          onClick={() => setStemmingOpen((prev) => !prev)}
          aria-expanded={stemmingOpen}
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 0.6,
            px: 0.5,
            borderRadius: '8px',
            textAlign: 'left',
            '&:hover': { bgcolor: THEME.surface.cardAlt },
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
              Preprocessing &amp; Porter Stemming
            </Typography>
            <Typography sx={{ fontSize: '0.74rem', color: THEME.text.secondary }}>
              {stemmedTokens.length} normalized tokens passed to the TF-IDF vectorizer
            </Typography>
          </Box>

          <ExpandMoreIcon
            sx={{
              color: THEME.text.secondary,
              transform: stemmingOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </ButtonBase>

        <Collapse in={stemmingOpen} unmountOnExit>
          <Box sx={{ pt: 1.6, display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {stemmedTokens.length > 0 ? (
              stemmedTokens.map((tok, i) => (
                <Chip
                  key={`${tok}-${i}`}
                  label={tok}
                  size="small"
                  sx={{
                    height: 23,
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    bgcolor: THEME.surface.cardAlt,
                    color: THEME.text.primary,
                    border: `1px solid ${THEME.surface.borderLight}`,
                  }}
                />
              ))
            ) : (
              <Typography sx={{ fontSize: '0.76rem', color: THEME.text.secondary }}>
                No alphanumeric tokens extracted.
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>
    </Stack>
  );
}
