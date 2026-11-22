import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Button,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Functions as FunctionsIcon,
  Speed as SpeedIcon,
  CallSplit as CallSplitIcon,
  Psychology as PsychologyIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';
import { THEME } from '../../constants/themeTokens';
import {
  SURVEY_QUESTIONS,
  RATING_LEVELS,
  getSentimentStyle,
  getCategoryStyle,
  formatSigned,
} from './explainerUtils';

// Compact diverging bar showing how Likert and RoBERTa pull the score left (Negative) or right (Positive)
function ContributionBar({ label, contribution, maxMagnitude = 0.5, accentColor, detail }) {
  const pct = Math.min(50, (Math.abs(contribution) / maxMagnitude) * 50);
  const isPositive = contribution >= 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.4 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.text.primary }}>
          {label}
          <Box component="span" sx={{ fontWeight: 500, color: THEME.text.secondary, ml: 0.6 }}>
            {detail}
          </Box>
        </Typography>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: 800,
            color:
              contribution > 0
                ? THEME.status.success
                : contribution < 0
                  ? THEME.status.errorText
                  : THEME.text.secondary,
          }}
        >
          {formatSigned(contribution, 2)}
        </Typography>
      </Box>

      {/* Center-zero diverging track */}
      <Box
        sx={{
          position: 'relative',
          height: 10,
          borderRadius: 5,
          bgcolor: '#e2e8f0',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1.5,
            bgcolor: '#94a3b8',
            zIndex: 2,
          }}
        />
        {pct > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: isPositive ? '50%' : `${50 - pct}%`,
              width: `${pct}%`,
              bgcolor: accentColor,
              borderRadius: isPositive ? '0 5px 5px 0' : '5px 0 0 5px',
              transition: 'width 0.25s ease, left 0.25s ease',
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default function SentimentSynthesisTab({
  diagnosticResult,
  ratings,
  onRatingChange,
  onBulkRatingsChange,
  canResetRatings,
  onResetRatings,
}) {
  const rAvg = diagnosticResult?.likert_simulation?.r_avg ?? 0.0;
  const validCount = diagnosticResult?.likert_simulation?.valid_count ?? 10;
  const bertScore = diagnosticResult?.hybrid_synthesis?.bert_score ?? 0.0;
  const hasComment = diagnosticResult?.hybrid_synthesis?.has_comment ?? true;
  const combinedScore = diagnosticResult?.hybrid_synthesis?.combined_score ?? 0.0;
  const finalSentiment = diagnosticResult?.hybrid_synthesis?.final_sentiment ?? 'Neutral';
  const clauses = diagnosticResult?.clauses ?? [];
  const splitTriggered = Boolean(diagnosticResult?.split_triggered);

  const sStyle = getSentimentStyle(finalSentiment);
  const gaugePercent = Math.max(0, Math.min(100, ((combinedScore + 1.0) / 2.0) * 100));

  const rContribution = hasComment ? rAvg * 0.5 : rAvg;
  const bertContribution = hasComment ? bertScore * 0.5 : 0;

  const verdictExplanation =
    combinedScore > 0.15
      ? `${formatSigned(combinedScore)} exceeds +0.15 -> classified Positive`
      : combinedScore < -0.15
        ? `${formatSigned(combinedScore)} falls below -0.15 -> classified Negative`
        : `${formatSigned(combinedScore)} sits inside the [-0.15, +0.15] buffer -> classified Neutral`;

  return (
    <Stack spacing={2.4}>
      {/* 1. 50/50 Contribution Tug-of-War & Decision Boundary Continuum */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
        }}
      >
        {/* Left: Contribution Tug-of-War */}
        <Box
          sx={{
            p: 2,
            bgcolor: THEME.surface.cardAlt,
            borderRadius: '12px',
            border: `1px solid ${THEME.surface.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.4 }}>
              <FunctionsIcon aria-hidden="true" sx={{ fontSize: 18, color: THEME.brand.accent }} />
              <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
                {hasComment ? '50 / 50 Hybrid Score Contribution' : 'Standalone Likert Scoring'}
              </Typography>
            </Box>

            <Stack spacing={1.5}>
              <ContributionBar
                label="Layer 1 · Likert Mean"
                detail={hasComment ? `(${formatSigned(rAvg)} × 0.50)` : '(100% weight)'}
                contribution={rContribution}
                maxMagnitude={hasComment ? 0.5 : 1.0}
                accentColor={
                  rContribution >= 0 ? THEME.status.success : THEME.status.error
                }
              />

              <ContributionBar
                label="Layer 2 · RoBERTa Polarity"
                detail={
                  hasComment
                    ? `(${formatSigned(bertScore, 1)} × 0.50)`
                    : '(No comment text)'
                }
                contribution={bertContribution}
                maxMagnitude={0.5}
                accentColor={
                  bertContribution > 0
                    ? THEME.brand.primary
                    : bertContribution < 0
                      ? THEME.status.error
                      : '#94a3b8'
                }
              />
            </Stack>
          </Box>

          {/* Arithmetic Equation Strip */}
          <Box
            sx={{
              mt: 1.8,
              px: 1.4,
              py: 1,
              bgcolor: THEME.surface.card,
              borderRadius: '9px',
              border: `1px solid ${THEME.surface.borderLight}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.8,
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.text.secondary }}>
              Formula:
            </Typography>
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: THEME.brand.primary,
              }}
            >
              {diagnosticResult?.hybrid_synthesis?.arithmetic_substitution ||
                `(${rAvg.toFixed(2)} × 0.50) + (${formatSigned(bertScore)} × 0.50) = ${formatSigned(combinedScore)}`}
            </Typography>
          </Box>
        </Box>

        {/* Right: Unified Decision Boundary Continuum */}
        <Box
          sx={{
            p: 2,
            bgcolor: THEME.surface.card,
            borderRadius: '12px',
            border: `1.5px solid ${THEME.surface.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <SpeedIcon aria-hidden="true" sx={{ fontSize: 18, color: THEME.brand.primary }} />
              <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
                Decision Boundary Continuum
              </Typography>
            </Box>
            <Chip
              label={`${formatSigned(combinedScore)} → ${finalSentiment}`}
              size="small"
              sx={{
                height: 22,
                fontWeight: 800,
                fontSize: '0.7rem',
                bgcolor: sStyle.bg,
                color: sStyle.text,
                border: `1px solid ${sStyle.border}`,
              }}
            />
          </Box>

          {/* Spectrum Bar with consistent Rose / Slate / Green zones */}
          <Box sx={{ position: 'relative', pt: 4, pb: 1.5, px: 1.5 }}>
            {/* Floating score badge */}
            <Box
              sx={{
                position: 'absolute',
                left: `calc(12px + (100% - 24px) * ${Math.max(0.06, Math.min(0.94, gaugePercent / 100))})`,
                top: 4,
                transform: 'translateX(-50%)',
                transition: 'left 0.25s ease-out',
                zIndex: 5,
              }}
            >
              <Box
                sx={{
                  px: 0.9,
                  py: 0.25,
                  bgcolor: THEME.brand.primary,
                  color: '#ffffff',
                  borderRadius: '5px',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(22, 50, 79, 0.22)',
                }}
              >
                {formatSigned(combinedScore)}
              </Box>
            </Box>

            <Box
              sx={{
                height: 12,
                borderRadius: 6,
                position: 'relative',
                display: 'flex',
                overflow: 'visible',
              }}
            >
              {/* Negative Zone: -1.00 to -0.15 (42.5%) */}
              <Box
                sx={{
                  width: '42.5%',
                  height: '100%',
                  borderRadius: '6px 0 0 6px',
                  background: 'linear-gradient(to right, #e11d48, #fda4af)',
                }}
              />
              {/* Neutral Buffer: -0.15 to +0.15 (15%) */}
              <Box
                sx={{
                  width: '15%',
                  height: '100%',
                  bgcolor: '#cbd5e1',
                  borderLeft: `2px solid ${THEME.brand.primary}`,
                  borderRight: `2px solid ${THEME.brand.primary}`,
                }}
              />
              {/* Positive Zone: +0.15 to +1.00 (42.5%) */}
              <Box
                sx={{
                  width: '42.5%',
                  height: '100%',
                  borderRadius: '0 6px 6px 0',
                  background: 'linear-gradient(to right, #86efac, #107c41)',
                }}
              />

              {/* Needle Marker */}
              <Box
                sx={{
                  position: 'absolute',
                  left: `${Math.max(1.5, Math.min(98.5, gaugePercent))}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  border: `3.5px solid ${sStyle.solid}`,
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.28)',
                  transition: 'left 0.25s ease-out',
                  zIndex: 4,
                }}
              />
            </Box>

            {/* Zone Labels */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1.4,
              }}
            >
              <Typography sx={{ color: THEME.status.errorText, fontWeight: 700, fontSize: '0.68rem' }}>
                -1.00 Negative
              </Typography>
              <Chip
                label="Neutral [-0.15, +0.15]"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: THEME.sentiment.Neutral.light,
                  color: THEME.sentiment.Neutral.text,
                  border: `1px solid ${THEME.sentiment.Neutral.border}`,
                }}
              />
              <Typography sx={{ color: THEME.status.success, fontWeight: 700, fontSize: '0.68rem' }}>
                +1.00 Positive
              </Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: sStyle.text,
              pt: 1,
              borderTop: `1px dashed ${THEME.surface.borderLight}`,
            }}
          >
            {verdictExplanation}
          </Typography>
        </Box>
      </Box>

      {/* 2. RoBERTa Clause-Level Inspector (Layer 2) */}
      <Box
        sx={{
          p: 2,
          bgcolor: THEME.surface.cardAlt,
          borderRadius: '12px',
          border: `1px solid ${THEME.surface.borderLight}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            {splitTriggered ? (
              <CallSplitIcon aria-hidden="true" sx={{ fontSize: 18, color: THEME.brand.accent }} />
            ) : (
              <PsychologyIcon aria-hidden="true" sx={{ fontSize: 18, color: THEME.brand.primary }} />
            )}
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
              RoBERTa Clause Breakdown (Layer 2)
            </Typography>
          </Box>

          <Chip
            label={
              splitTriggered
                ? 'Contrast Split · Most-Negative-Wins'
                : hasComment
                  ? 'Single Clause Analysis'
                  : 'No Text Input'
            }
            size="small"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: splitTriggered ? THEME.brand.goldLight : THEME.brand.blueLight,
              color: splitTriggered ? '#b45309' : THEME.brand.primary,
              border: `1px solid ${splitTriggered ? THEME.brand.goldBorder : THEME.brand.blueBorder}`,
            }}
          />
        </Box>

        {splitTriggered && (
          <Typography sx={{ fontSize: '0.73rem', color: THEME.text.secondary, mb: 1.3 }}>
            A contrast conjunction split this feedback into {clauses.length} clauses. Negative clauses take precedence so critical patron concerns are not masked by general praise.
          </Typography>
        )}

        {clauses.length > 0 ? (
          <Stack spacing={1}>
            {clauses.map((cl, idx) => {
              const clSent = getSentimentStyle(cl.sentiment);
              const clCat = getCategoryStyle(cl.category);
              const isWinnerNegative = splitTriggered && cl.sentiment === 'Negative';
              const topCatProb = cl.category_probabilities?.[cl.category];

              return (
                <Paper
                  key={idx}
                  variant="outlined"
                  sx={{
                    p: 1.3,
                    borderRadius: '10px',
                    bgcolor: THEME.surface.card,
                    borderColor: isWinnerNegative ? THEME.status.errorBorder : THEME.surface.borderLight,
                    borderLeft: `4px solid ${clSent.solid}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography
                      sx={{
                        fontSize: '0.67rem',
                        fontWeight: 700,
                        color: THEME.text.secondary,
                        textTransform: 'uppercase',
                        mb: 0.2,
                      }}
                    >
                      Clause {idx + 1}
                      {isWinnerNegative ? ' · Priority Driver' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 500 }}>
                      &ldquo;{cl.clause}&rdquo;
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.7} alignItems="center" flexWrap="wrap" useFlexGap>
                    {cl.category && (
                      <Chip
                        label={
                          topCatProb !== undefined
                            ? `${cl.category === 'Other/Uncategorized' ? 'Other' : cl.category} ${(topCatProb * 100).toFixed(0)}%`
                            : cl.category
                        }
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.67rem',
                          fontWeight: 700,
                          bgcolor: clCat.bg,
                          color: clCat.text,
                          border: `1px solid ${clCat.border}`,
                        }}
                      />
                    )}
                    <Chip
                      label={`${cl.sentiment} (${((cl.confidence || 0) * 100).toFixed(0)}%)`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.67rem',
                        fontWeight: 800,
                        bgcolor: clSent.bg,
                        color: clSent.text,
                        border: `1px solid ${clSent.border}`,
                      }}
                    />
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: '0.76rem', color: THEME.text.secondary }}>
            Enter a written comment above to inspect RoBERTa clause polarity.
          </Typography>
        )}
      </Box>

      {/* 3. Compact 2-Column 10-Question Likert Ratings Editor (Layer 1) */}
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
            gap: 1.2,
            mb: 1.6,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
              10-Question Likert Ratings (Layer 1)
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: THEME.text.secondary }}>
              Click any rating (5 to 1 or N/A) to test live sensitivity of R_avg ({validCount}/10 valid = {formatSigned(rAvg)}).
            </Typography>
          </Box>

          {/* Quick Bulk Presets */}
          <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap alignItems="center">
            <Button
              size="small"
              variant="outlined"
              onClick={() => onBulkRatingsChange('very_satisfied')}
              sx={{
                height: 26,
                px: 1.1,
                fontSize: '0.68rem',
                borderRadius: '7px',
                borderColor: THEME.status.successBorder,
                color: THEME.status.success,
                '&:hover': { bgcolor: THEME.status.successLight, borderColor: THEME.status.success },
              }}
            >
              All 5s
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onBulkRatingsChange('neutral')}
              sx={{
                height: 26,
                px: 1.1,
                fontSize: '0.68rem',
                borderRadius: '7px',
                borderColor: '#cbd5e1',
                color: THEME.text.body,
                '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
              }}
            >
              All 3s
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onBulkRatingsChange('very_dissatisfied')}
              sx={{
                height: 26,
                px: 1.1,
                fontSize: '0.68rem',
                borderRadius: '7px',
                borderColor: THEME.status.errorBorder,
                color: THEME.status.errorText,
                '&:hover': { bgcolor: THEME.status.errorLight, borderColor: THEME.status.error },
              }}
            >
              All 1s
            </Button>
            {canResetRatings && (
              <Button
                size="small"
                startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                onClick={onResetRatings}
                sx={{ height: 26, px: 1, fontSize: '0.68rem', color: '#c2410c' }}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Box>

        {/* 2-Column Dense Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, 1fr)' },
            gap: 1.1,
          }}
        >
          {SURVEY_QUESTIONS.map((q, qIdx) => {
            const currentRatingId = ratings[qIdx] || 'neutral';
            const activeOpt =
              RATING_LEVELS.find((lvl) => lvl.id === currentRatingId) || RATING_LEVELS[2];

            return (
              <Paper
                key={q.id}
                variant="outlined"
                sx={{
                  p: 1.15,
                  borderRadius: '10px',
                  bgcolor: THEME.surface.cardAlt,
                  borderColor: THEME.surface.borderLight,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.85,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <Tooltip title={q.text} arrow placement="top-start">
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        color: THEME.text.primary,
                        cursor: 'help',
                      }}
                    >
                      Q{q.id}. {q.title}
                    </Typography>
                  </Tooltip>

                  <Chip
                    label={
                      activeOpt.code === 'N/A'
                        ? 'N/A'
                        : `${activeOpt.code} · ${activeOpt.shortLabel}`
                    }
                    size="small"
                    sx={{
                      height: 19,
                      fontSize: '0.63rem',
                      fontWeight: 700,
                      bgcolor: activeOpt.bg,
                      color: activeOpt.color,
                      border: `1px solid ${activeOpt.border}`,
                      flexShrink: 0,
                    }}
                  />
                </Box>

                <ToggleButtonGroup
                  exclusive
                  size="small"
                  fullWidth
                  value={currentRatingId}
                  onChange={(e, val) => {
                    if (val !== null) onRatingChange(qIdx, val);
                  }}
                  aria-label={`Rating for Q${q.id} ${q.title}`}
                  sx={{
                    gap: 0.5,
                    '& .MuiToggleButtonGroup-grouped': {
                      border: '1px solid #cbd5e1 !important',
                      borderRadius: '7px !important',
                      marginLeft: '0 !important',
                      py: 0.35,
                      px: 0.5,
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      lineHeight: 1.2,
                      bgcolor: '#ffffff',
                      color: THEME.text.body,
                    },
                  }}
                >
                  {RATING_LEVELS.map((lvl) => {
                    const isSelected = currentRatingId === lvl.id;
                    return (
                      <Tooltip
                        key={lvl.id}
                        title={`${lvl.label} (${lvl.code})${lvl.score !== null ? ` → ${formatSigned(lvl.score, 1)}` : ' → Excluded'}`}
                        arrow
                      >
                        <ToggleButton
                          value={lvl.id}
                          aria-label={`Q${q.id} ${lvl.label}`}
                          sx={{
                            fontSize: lvl.code === 'N/A' ? '0.62rem !important' : '0.75rem !important',
                            ...(isSelected
                              ? {
                                  bgcolor: `${lvl.color} !important`,
                                  color: '#ffffff !important',
                                  borderColor: `${lvl.color} !important`,
                                }
                              : {
                                  '&:hover': {
                                    bgcolor: `${lvl.bg} !important`,
                                    borderColor: `${lvl.color} !important`,
                                  },
                                }),
                          }}
                        >
                          {lvl.code}
                        </ToggleButton>
                      </Tooltip>
                    );
                  })}
                </ToggleButtonGroup>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
}
