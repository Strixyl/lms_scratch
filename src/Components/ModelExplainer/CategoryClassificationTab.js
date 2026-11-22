import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Slider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  Code as CodeIcon,
  Analytics as AnalyticsIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
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
import { THEME, tableHeaderRowSx } from '../../constants/themeTokens';
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
        border: `1.5px solid ${st.border}`,
        bgcolor: '#ffffff',
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: st.text }}>
        {item.key}
      </Typography>
      <Typography sx={{ fontSize: '0.74rem', color: THEME.text.primary, fontWeight: 700, mt: 0.2 }}>
        Posterior Probability: {item.percent.toFixed(1)}%
      </Typography>
      <Typography sx={{ fontSize: '0.68rem', color: THEME.text.secondary, mt: 0.2 }}>
        {item.meetsThreshold
          ? `Meets guard threshold (≥ ${item.thresholdPct}%)`
          : `Below guard threshold (< ${item.thresholdPct}%)`}
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
        name: catKey === 'Other/Uncategorized' ? 'Other / Uncat.' : catKey,
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
  const topName = ranked[0]?.[0] || 'Other/Uncategorized';
  const topProb = ranked[0]?.[1] || 0;
  const secondName = ranked[1]?.[0] || '—';
  const secondProb = ranked[1]?.[1] || 0;
  const leadMargin = Math.max(0, (topProb - secondProb) * 100);

  const maxTfidf = useMemo(
    () => extractedFeatures.reduce((m, f) => Math.max(m, f.tfidf || 0), 0.01),
    [extractedFeatures]
  );

  return (
    <Stack spacing={2.4}>
      {/* Step 1: Posterior Probability Bar Chart + Interactive Guard Threshold */}
      <Box
        sx={{
          p: 2,
          bgcolor: THEME.surface.card,
          borderRadius: '12px',
          border: `1.5px solid ${THEME.surface.borderLight}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <BarChartIcon aria-hidden="true" sx={{ fontSize: 19, color: THEME.brand.primary }} />
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
              Posterior Probability Distribution P(Category | Tokens)
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Chip
              label={`Laplace α = ${alpha}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: THEME.surface.cardAlt,
                color: THEME.text.secondary,
                border: `1px solid ${THEME.surface.borderLight}`,
              }}
            />
            <Chip
              label={`Verdict: ${effectiveCategory}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 800,
                bgcolor: getCategoryStyle(effectiveCategory).bg,
                color: getCategoryStyle(effectiveCategory).text,
                border: `1px solid ${getCategoryStyle(effectiveCategory).border}`,
              }}
            />
          </Stack>
        </Box>

        {/* Chart + Live Threshold Controls side by side on wide screens */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.45fr 1fr' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          {/* Recharts Horizontal Bar Chart with Live τ Reference Line */}
          <Box sx={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 18, right: 44, left: 8, bottom: 6 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: THEME.text.secondary, fontFamily: THEME.font.family }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={108}
                  tick={{ fontSize: 11.5, fontWeight: 700, fill: THEME.text.primary, fontFamily: THEME.font.family }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<CustomProbTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <ReferenceLine
                  x={thresholdPct}
                  stroke={THEME.brand.primary}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  label={{
                    value: `τ = ${thresholdPct}%`,
                    position: 'top',
                    fill: THEME.brand.primary,
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: THEME.font.family,
                  }}
                />
                <Bar dataKey="percent" radius={[0, 6, 6, 0]} maxBarSize={26} isAnimationActive={false}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.color}
                      fillOpacity={entry.isWinner ? 1 : 0.45}
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

          {/* Threshold Slider & Decision Summary Box */}
          <Box
            sx={{
              p: 1.8,
              borderRadius: '12px',
              bgcolor: THEME.surface.cardAlt,
              border: `1px solid ${THEME.surface.borderLight}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: THEME.text.primary }}>
                Confidence Guard (τ)
              </Typography>
              <Chip
                label={`${thresholdPct}% (${confidenceThreshold.toFixed(2)})`}
                size="small"
                sx={{
                  height: 21,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  bgcolor: THEME.brand.primary,
                  color: '#ffffff',
                }}
              />
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
              sx={{
                color: THEME.brand.primary,
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 6px rgba(22, 50, 79, 0.16)',
                  },
                },
              }}
            />

            <Stack spacing={0.55} sx={{ mt: 0.6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem' }}>
                <Typography sx={{ fontSize: '0.73rem', color: THEME.text.secondary }}>Top class</Typography>
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: THEME.text.primary }}>
                  {topName} ({(topProb * 100).toFixed(1)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.73rem', color: THEME.text.secondary }}>Runner-up</Typography>
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: THEME.text.body }}>
                  {secondName} ({(secondProb * 100).toFixed(1)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.73rem', color: THEME.text.secondary }}>Lead margin</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: 700, color: THEME.brand.primary }}>
                  +{leadMargin.toFixed(1)} pts
                </Typography>
              </Box>
            </Stack>

            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                mt: 1.2,
                pt: 1,
                borderTop: `1px dashed ${THEME.surface.borderLight}`,
                color: effectiveFallback ? THEME.status.errorText : THEME.status.success,
              }}
            >
              {!hasText
                ? 'Provide feedback text to evaluate Naïve Bayes confidence.'
                : effectiveFallback
                  ? `${(rawConf * 100).toFixed(1)}% < ${thresholdPct}% guard -> routed to Other/Uncategorized.`
                  : `${(rawConf * 100).toFixed(1)}% clears the ${thresholdPct}% guard -> ${effectiveCategory} confirmed.`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Step 2: Preprocessing & Porter Stemming */}
      <Box
        sx={{
          p: 2,
          bgcolor: THEME.surface.cardAlt,
          borderRadius: '12px',
          border: `1px solid ${THEME.surface.borderLight}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <CodeIcon aria-hidden="true" sx={{ fontSize: 18, color: THEME.brand.primary }} />
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
              Text Preprocessing &amp; Porter Stemming
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.7rem', color: THEME.text.secondary, fontWeight: 600 }}>
            {stemmedTokens.length} stemmed {stemmedTokens.length === 1 ? 'token' : 'tokens'}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.4 }}>
          <Box>
            <Typography sx={{ fontSize: '0.69rem', fontWeight: 700, color: THEME.text.secondary, mb: 0.5, textTransform: 'uppercase' }}>
              Raw Input
            </Typography>
            <Box
              sx={{
                p: 1.25,
                bgcolor: THEME.surface.card,
                borderRadius: '9px',
                border: `1px solid ${THEME.surface.borderLight}`,
                fontFamily: 'monospace',
                fontSize: '0.76rem',
                color: THEME.text.body,
                wordBreak: 'break-word',
                minHeight: 54,
              }}
            >
              {hasText ? `"${inputText}"` : '(Empty input)'}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.69rem', fontWeight: 700, color: THEME.status.success, mb: 0.5, textTransform: 'uppercase' }}>
              Normalized &amp; Stemmed Tokens
            </Typography>
            <Box
              sx={{
                p: 1.1,
                bgcolor: THEME.status.successLight,
                borderRadius: '9px',
                border: `1px solid ${THEME.status.successBorder}`,
                minHeight: 54,
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                gap: 0.5,
              }}
            >
              {stemmedTokens.length > 0 ? (
                stemmedTokens.map((tok, i) => (
                  <Chip
                    key={`${tok}-${i}`}
                    label={tok}
                    size="small"
                    sx={{
                      height: 21,
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: '#ffffff',
                      color: '#0b5a2f',
                      border: `1px solid ${THEME.status.successBorder}`,
                    }}
                  />
                ))
              ) : (
                <Typography sx={{ fontSize: '0.75rem', color: THEME.text.secondary, p: 0.3 }}>
                  (No alphanumeric tokens)
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Step 3: TF-IDF Feature Weights Table */}
      <Box
        sx={{
          p: 2,
          bgcolor: THEME.surface.card,
          borderRadius: '12px',
          border: `1.5px solid ${THEME.surface.borderLight}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <AnalyticsIcon aria-hidden="true" sx={{ fontSize: 18, color: THEME.brand.primary }} />
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
              Matched TF-IDF Features &amp; Domain Vocabulary
            </Typography>
          </Box>
          <Chip
            label={`${extractedFeatures.length} features`}
            size="small"
            sx={{
              height: 21,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: THEME.brand.blueLight,
              color: THEME.brand.primary,
            }}
          />
        </Box>

        {extractedFeatures.length > 0 ? (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: '10px',
              borderColor: THEME.surface.borderLight,
              maxHeight: 260,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={tableHeaderRowSx}>
                  <TableCell>Token / N-gram</TableCell>
                  <TableCell sx={{ width: '38%' }}>Relative TF-IDF Strength</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell align="center">Domain Signal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {extractedFeatures.map((feat, idx) => {
                  const catSt = feat.domain_category ? getCategoryStyle(feat.domain_category) : null;
                  const barPct = Math.min(100, ((feat.tfidf || 0) / maxTfidf) * 100);
                  return (
                    <TableRow
                      key={`${feat.token}-${idx}`}
                      sx={{ '&:hover': { bgcolor: THEME.surface.cardAlt } }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: THEME.text.primary }}>
                        {feat.token}
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={barPct}
                          sx={{
                            height: 7,
                            borderRadius: 4,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: catSt ? catSt.solid : THEME.brand.primary,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: 700, color: THEME.brand.primary }}>
                        {Number(feat.tfidf || 0).toFixed(4)}
                      </TableCell>
                      <TableCell align="center">
                        {feat.domain_category ? (
                          <Chip
                            label={feat.domain_category}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              bgcolor: catSt.bg,
                              color: catSt.text,
                              border: `1px solid ${catSt.border}`,
                            }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '0.72rem', color: THEME.text.faint }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info" sx={{ borderRadius: '10px', fontSize: '0.78rem' }}>
            No non-zero TF-IDF vocabulary tokens were matched for this statement.
          </Alert>
        )}
      </Box>
    </Stack>
  );
}
