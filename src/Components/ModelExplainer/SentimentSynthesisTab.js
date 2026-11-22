import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Tooltip,
  Divider,
  Collapse,
  ButtonBase,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';
import { THEME } from '../../constants/themeTokens';
import {
  SURVEY_QUESTIONS,
  RATING_LEVELS,
  getSentimentStyle,
  formatSigned,
} from './explainerUtils';

// Minimal diverging bar showing each layer's pull from 0
function ContributionRow({ label, sublabel, contribution, maxMagnitude = 0.5, barColor }) {
  const pct = Math.min(50, (Math.abs(contribution) / maxMagnitude) * 50);
  const isPositive = contribution >= 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.6 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: THEME.text.primary }}>
          {label}
          <Box component="span" sx={{ fontWeight: 400, color: THEME.text.secondary, ml: 0.7, fontSize: '0.74rem' }}>
            {sublabel}
          </Box>
        </Typography>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            fontWeight: 700,
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

      <Box sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1.5,
            bgcolor: '#cbd5e1',
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
              bgcolor: barColor,
              borderRadius: isPositive ? '0 4px 4px 0' : '4px 0 0 4px',
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
  // Progressive disclosure: keep the 10-question / 60-button matrix collapsed until requested
  const [likertExpanded, setLikertExpanded] = useState(false);

  const rAvg = diagnosticResult?.likert_simulation?.r_avg ?? 0.0;
  const validCount = diagnosticResult?.likert_simulation?.valid_count ?? 10;
  const bertScore = diagnosticResult?.hybrid_synthesis?.bert_score ?? 0.0;
  const hasComment = diagnosticResult?.hybrid_synthesis?.has_comment ?? true;
  const combinedScore = diagnosticResult?.hybrid_synthesis?.combined_score ?? 0.0;
  const finalSentiment = diagnosticResult?.hybrid_synthesis?.final_sentiment ?? 'Neutral';
  const clauses = diagnosticResult?.clauses ?? [];
  const splitTriggered = Boolean(diagnosticResult?.split_triggered);

  const rContribution = hasComment ? rAvg * 0.5 : rAvg;
  const bertContribution = hasComment ? bertScore * 0.5 : 0;

  return (
    <Stack spacing={3} divider={<Divider sx={{ borderColor: '#f1f5f9' }} />}>
      {/* Section 1: 50/50 Contribution Formula */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1, mb: 1.8 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
            {hasComment ? '50 / 50 Hybrid Score Synthesis' : 'Standalone Likert Calculation'}
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.76rem', color: THEME.text.secondary }}>
            {diagnosticResult?.hybrid_synthesis?.arithmetic_substitution ||
              `(${rAvg.toFixed(2)} × 0.50) + (${formatSigned(bertScore)} × 0.50) = ${formatSigned(combinedScore)}`}
          </Typography>
        </Box>

        <Stack spacing={1.8}>
          <ContributionRow
            label="Likert Survey Mean"
            sublabel={hasComment ? `${formatSigned(rAvg)} × 0.50` : '100% weight'}
            contribution={rContribution}
            maxMagnitude={hasComment ? 0.5 : 1.0}
            barColor={rContribution >= 0 ? THEME.status.success : THEME.status.error}
          />

          <ContributionRow
            label="RoBERTa Text Polarity"
            sublabel={hasComment ? `${formatSigned(bertScore, 1)} × 0.50` : 'Skipped (no text)'}
            contribution={bertContribution}
            maxMagnitude={0.5}
            barColor={
              bertContribution > 0
                ? THEME.brand.primary
                : bertContribution < 0
                  ? THEME.status.error
                  : '#94a3b8'
            }
          />
        </Stack>

        <Typography sx={{ fontSize: '0.74rem', color: THEME.text.secondary, mt: 1.6 }}>
          Result <strong style={{ color: THEME.text.primary }}>{formatSigned(combinedScore)}</strong>{' '}
          {combinedScore > 0.15
            ? 'is above +0.15, classifying as '
            : combinedScore < -0.15
              ? 'is below -0.15, classifying as '
              : 'falls inside the [-0.15, +0.15] equilibrium zone, classifying as '}
          <strong style={{ color: getSentimentStyle(finalSentiment).text }}>{finalSentiment}</strong>.
        </Typography>
      </Box>

      {/* Section 2: RoBERTa Clause Polarity Breakdown */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
            RoBERTa Clause Analysis
          </Typography>
          <Typography sx={{ fontSize: '0.73rem', fontWeight: 600, color: splitTriggered ? '#b45309' : THEME.text.secondary }}>
            {splitTriggered
              ? 'Contrast split · Most-Negative-Wins'
              : hasComment
                ? 'Single clause'
                : 'No comment'}
          </Typography>
        </Box>

        {clauses.length > 0 ? (
          <Stack spacing={1}>
            {clauses.map((cl, idx) => {
              const clSent = getSentimentStyle(cl.sentiment);
              const topCatProb = cl.category_probabilities?.[cl.category];
              const isDriver = splitTriggered && cl.sentiment === 'Negative';

              return (
                <Box
                  key={idx}
                  sx={{
                    py: 1.2,
                    px: 1.6,
                    borderRadius: '10px',
                    bgcolor: THEME.surface.cardAlt,
                    borderLeft: `3px solid ${clSent.solid}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: THEME.text.primary, fontWeight: 500 }}>
                      &ldquo;{cl.clause}&rdquo;
                    </Typography>
                    {isDriver && (
                      <Typography sx={{ fontSize: '0.68rem', color: THEME.status.errorText, fontWeight: 600, mt: 0.25 }}>
                        Negative priority driver
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1.2} alignItems="center">
                    {cl.category && (
                      <Typography sx={{ fontSize: '0.72rem', color: THEME.text.secondary, fontWeight: 500 }}>
                        {cl.category === 'Other/Uncategorized' ? 'Other' : cl.category}
                        {topCatProb !== undefined ? ` (${(topCatProb * 100).toFixed(0)}%)` : ''}
                      </Typography>
                    )}
                    <Chip
                      label={`${cl.sentiment} · ${((cl.confidence || 0) * 100).toFixed(0)}%`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: clSent.bg,
                        color: clSent.text,
                        border: `1px solid ${clSent.border}`,
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: '0.78rem', color: THEME.text.secondary }}>
            Add a written comment above to inspect RoBERTa clause sentiment.
          </Typography>
        )}
      </Box>

      {/* Section 3: Collapsible 10-Question Likert Editor (Progressive Disclosure) */}
      <Box>
        <ButtonBase
          onClick={() => setLikertExpanded((prev) => !prev)}
          aria-expanded={likertExpanded}
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
              Adjust 10 Likert Ratings
            </Typography>
            <Typography sx={{ fontSize: '0.74rem', color: THEME.text.secondary }}>
              Mean {formatSigned(rAvg)} across {validCount} of 10 rated items · Click to simulate rating changes
            </Typography>
          </Box>

          <ExpandMoreIcon
            sx={{
              color: THEME.text.secondary,
              transform: likertExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </ButtonBase>

        <Collapse in={likertExpanded} unmountOnExit>
          <Box sx={{ pt: 1.8 }}>
            {/* Quick Bulk Presets */}
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mb: 1.6 }}>
              <Typography sx={{ fontSize: '0.72rem', color: THEME.text.secondary, mr: 0.4 }}>
                Quick fill:
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onBulkRatingsChange('very_satisfied')}
                sx={{ height: 26, px: 1.1, fontSize: '0.7rem', borderRadius: '7px', borderColor: '#cbd5e1', color: THEME.text.primary }}
              >
                All 5s
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onBulkRatingsChange('neutral')}
                sx={{ height: 26, px: 1.1, fontSize: '0.7rem', borderRadius: '7px', borderColor: '#cbd5e1', color: THEME.text.primary }}
              >
                All 3s
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onBulkRatingsChange('very_dissatisfied')}
                sx={{ height: 26, px: 1.1, fontSize: '0.7rem', borderRadius: '7px', borderColor: '#cbd5e1', color: THEME.text.primary }}
              >
                All 1s
              </Button>
              {canResetRatings && (
                <Button
                  size="small"
                  startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                  onClick={onResetRatings}
                  sx={{ height: 26, px: 1, fontSize: '0.7rem', color: '#b45309' }}
                >
                  Reset to record
                </Button>
              )}
            </Stack>

            {/* Clean 2-Column Matrix */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, 1fr)' },
                gap: 1.2,
              }}
            >
              {SURVEY_QUESTIONS.map((q, qIdx) => {
                const currentRatingId = ratings[qIdx] || 'neutral';
                const activeOpt =
                  RATING_LEVELS.find((lvl) => lvl.id === currentRatingId) || RATING_LEVELS[2];

                return (
                  <Box
                    key={q.id}
                    sx={{
                      p: 1.2,
                      borderRadius: '10px',
                      bgcolor: THEME.surface.cardAlt,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.85,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Tooltip title={q.text} arrow placement="top-start">
                        <Typography sx={{ fontWeight: 600, fontSize: '0.76rem', color: THEME.text.primary, cursor: 'help' }}>
                          Q{q.id}. {q.title}
                        </Typography>
                      </Tooltip>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: activeOpt.color, flexShrink: 0 }}>
                        {activeOpt.code === 'N/A' ? 'N/A' : `${activeOpt.code} · ${activeOpt.shortLabel}`}
                      </Typography>
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
                          border: '1px solid #e2e8f0 !important',
                          borderRadius: '7px !important',
                          marginLeft: '0 !important',
                          py: 0.35,
                          px: 0.5,
                          fontSize: '0.74rem',
                          fontWeight: 700,
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
                            title={`${lvl.label}${lvl.score !== null ? ` (${formatSigned(lvl.score, 1)})` : ' (Excluded)'}`}
                            arrow
                          >
                            <ToggleButton
                              value={lvl.id}
                              aria-label={`Q${q.id} ${lvl.label}`}
                              sx={{
                                fontSize: lvl.code === 'N/A' ? '0.62rem !important' : '0.74rem !important',
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
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Stack>
  );
}
