import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  RateReview as RateReviewIcon,
  FormatQuote as QuoteIcon,
  Edit as EditIcon,
  Done as DoneIcon,
  RestartAlt as RestartAltIcon,
  PlayArrow as PlayArrowIcon,
  Calculate as CalculateIcon,
  ThumbUp as ThumbUpIcon,
  Psychology as PsychologyIcon,
  Category as CategoryIcon,
  CompareArrows as CompareArrowsIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { THEME, cardShellSx } from '../../constants/themeTokens';
import {
  DEMO_SCENARIOS,
  annotateFeedbackTokens,
  getSentimentStyle,
  getCategoryStyle,
  formatSigned,
} from './explainerUtils';

const EMPTY_PROBS = {
  Facilities: 0,
  Staff: 0,
  Collection: 0,
  'Other/Uncategorized': 0,
};
const EMPTY_FEATURES = [];

export default function ExecutiveVerdict({
  inputText,
  onInputTextChange,
  isEditingQuote,
  onToggleEditQuote,
  selectedMeta,
  isModified,
  onResetToOriginal,
  onLoadScenario,
  autoCalculate,
  onAutoCalculateChange,
  onRunPipeline,
  isLoading,
  diagnosticResult,
  confidenceThreshold,
}) {
  const rAvg = diagnosticResult?.likert_simulation?.r_avg ?? 0.0;
  const validCount = diagnosticResult?.likert_simulation?.valid_count ?? 0;
  const emojiSentiment = diagnosticResult?.likert_simulation?.emoji_sentiment ?? 'Neutral';
  const bertScore = diagnosticResult?.hybrid_synthesis?.bert_score ?? 0.0;
  const robertaSentiment = diagnosticResult?.roberta?.sentiment ?? 'Neutral';
  const robertaConf = diagnosticResult?.roberta?.confidence ?? 0.0;
  const aggStrategy = diagnosticResult?.roberta?.aggregation_strategy ?? 'Single Clause Analysis';
  const combinedScore = diagnosticResult?.hybrid_synthesis?.combined_score ?? 0.0;
  const finalSentiment = diagnosticResult?.hybrid_synthesis?.final_sentiment ?? 'Neutral';
  const hasComment = diagnosticResult?.hybrid_synthesis?.has_comment ?? Boolean(inputText.trim());
  const clauses = diagnosticResult?.clauses ?? [];

  const nb = diagnosticResult?.naive_bayes;
  const categoryProbs = nb?.probabilities || EMPTY_PROBS;
  const extractedFeatures = nb?.extracted_features || EMPTY_FEATURES;
  const serverCategory = nb?.final_category || 'Other/Uncategorized';
  const serverFallback = Boolean(nb?.fallback_applied);
  const rawWinner = nb?.raw_winner || 'Other/Uncategorized';
  const rawConf = nb?.raw_confidence ?? nb?.final_confidence ?? 0;

  // Reflect threshold preview cleanly even when live backend runs with default 0.45 in get_clause_category
  const thresholdTriggeredPreview =
    hasComment && rawWinner !== 'Other/Uncategorized' && rawConf < confidenceThreshold;
  const displayCategory =
    diagnosticResult?.source === 'simulation'
      ? serverCategory
      : Math.abs(confidenceThreshold - 0.45) > 0.001 && thresholdTriggeredPreview
        ? 'Other/Uncategorized'
        : serverCategory;
  const displayFallback =
    diagnosticResult?.source === 'simulation'
      ? serverFallback
      : serverFallback || (Math.abs(confidenceThreshold - 0.45) > 0.001 && thresholdTriggeredPreview);

  const sStyle = getSentimentStyle(finalSentiment);
  const cStyle = getCategoryStyle(displayCategory);

  const annotatedTokens = useMemo(
    () => annotateFeedbackTokens(inputText, extractedFeatures),
    [inputText, extractedFeatures]
  );

  const highlightSummary = useMemo(() => {
    const domains = new Set();
    let hasContrast = false;
    annotatedTokens.forEach((seg) => {
      if (seg.type === 'domain') domains.add(seg.domainCategory);
      if (seg.type === 'contrast') hasContrast = true;
    });
    return { domains: Array.from(domains), hasContrast };
  }, [annotatedTokens]);

  const wordCount = useMemo(
    () => inputText.trim().split(/\s+/).filter(Boolean).length,
    [inputText]
  );

  const hasDrift =
    Boolean(selectedMeta) &&
    !isModified &&
    (selectedMeta.storedCategory !== displayCategory ||
      selectedMeta.storedSentiment !== finalSentiment);

  const rankedProbs = useMemo(
    () => Object.entries(categoryProbs).sort((a, b) => b[1] - a[1]),
    [categoryProbs]
  );
  const topProb = rankedProbs[0]?.[1] ?? 0;
  const secondProb = rankedProbs[1]?.[1] ?? 0;
  const leadMargin = Math.max(0, (topProb - secondProb) * 100);

  return (
    <Stack spacing={2}>
      {/* Active Statement & Inline What-If Workspace Card */}
      <Paper
        elevation={0}
        sx={{
          ...cardShellSx,
          position: 'relative',
        }}
      >
        {/* Subtle live computation progress bar */}
        <Box sx={{ height: 3, width: '100%', bgcolor: 'transparent' }}>
          {isLoading && (
            <LinearProgress
              sx={{
                height: 3,
                bgcolor: THEME.brand.blueLight,
                '& .MuiLinearProgress-bar': { bgcolor: THEME.brand.accent },
              }}
            />
          )}
        </Box>

        <Box sx={{ p: { xs: 1.8, md: 2.2 } }}>
          {/* Header Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.2,
              mb: 1.4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, flexWrap: 'wrap' }}>
              <RateReviewIcon aria-hidden="true" sx={{ color: THEME.brand.accent, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: THEME.text.primary }}>
                {selectedMeta
                  ? isModified
                    ? `Sandbox (Modified from #${selectedMeta.id})`
                    : `Record #${selectedMeta.id}`
                  : 'Custom What-If Sandbox'}
              </Typography>

              {selectedMeta && (
                <Chip
                  label={`${selectedMeta.clientele || 'Patron'} · ${selectedMeta.college || 'General'}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    bgcolor: THEME.brand.blueLight,
                    color: THEME.brand.primary,
                    border: `1px solid ${THEME.brand.blueBorder}`,
                  }}
                />
              )}

              {isModified && selectedMeta && (
                <Chip
                  label="Modified"
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    bgcolor: THEME.brand.goldLight,
                    color: '#c2410c',
                    border: `1px solid ${THEME.brand.goldBorder}`,
                  }}
                />
              )}

              {hasDrift && (
                <Tooltip
                  title={`Database stored ${selectedMeta.storedCategory} · ${selectedMeta.storedSentiment}, while current pipeline computes ${displayCategory} · ${finalSentiment}`}
                  arrow
                >
                  <Chip
                    icon={<CompareArrowsIcon sx={{ fontSize: '14px !important', color: '#b45309 !important' }} />}
                    label="Differs from Stored"
                    size="small"
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      bgcolor: THEME.status.warningLight,
                      color: THEME.status.warningBold,
                      border: `1px solid ${THEME.status.warningBorder}`,
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {isModified && selectedMeta && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
                  onClick={onResetToOriginal}
                  sx={{
                    height: 30,
                    fontSize: '0.72rem',
                    borderRadius: '8px',
                    borderColor: THEME.brand.goldBorder,
                    color: '#c2410c',
                    bgcolor: THEME.brand.goldLight,
                    '&:hover': { bgcolor: '#ffedd5', borderColor: THEME.brand.accent },
                  }}
                >
                  Reset
                </Button>
              )}

              <Button
                size="small"
                variant={isEditingQuote ? 'contained' : 'outlined'}
                startIcon={
                  isEditingQuote ? <DoneIcon sx={{ fontSize: 15 }} /> : <EditIcon sx={{ fontSize: 15 }} />
                }
                onClick={onToggleEditQuote}
                sx={{
                  height: 30,
                  fontSize: '0.72rem',
                  borderRadius: '8px',
                  ...(isEditingQuote
                    ? {
                        bgcolor: THEME.brand.accent,
                        color: '#ffffff',
                        '&:hover': { bgcolor: THEME.brand.accentHover },
                      }
                    : {
                        borderColor: THEME.surface.border,
                        color: THEME.brand.primary,
                        '&:hover': { borderColor: THEME.brand.primary, bgcolor: THEME.brand.blueLight },
                      }),
                }}
              >
                {isEditingQuote ? 'Done Editing' : 'Edit / What-If'}
              </Button>

              <FormControlLabel
                sx={{ mr: 0, ml: 0.4 }}
                control={
                  <Switch
                    size="small"
                    checked={autoCalculate}
                    onChange={(e) => onAutoCalculateChange(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: THEME.text.secondary }}>
                    Auto
                  </Typography>
                }
              />

              <Button
                variant="contained"
                size="small"
                startIcon={
                  isLoading ? (
                    <CircularProgress size={13} color="inherit" />
                  ) : (
                    <PlayArrowIcon sx={{ fontSize: 16 }} />
                  )
                }
                onClick={onRunPipeline}
                disabled={isLoading}
                sx={{
                  height: 30,
                  px: 1.5,
                  fontSize: '0.72rem',
                  borderRadius: '8px',
                  bgcolor: THEME.brand.primary,
                  '&:hover': { bgcolor: THEME.brand.primaryHover },
                }}
              >
                {isLoading ? 'Running' : 'Run'}
              </Button>
            </Stack>
          </Box>

          {/* Statement Body: Inline Highlighted Quote OR What-If Editor */}
          {isEditingQuote ? (
            <Box>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                autoFocus
                value={inputText}
                onChange={(e) => onInputTextChange(e.target.value)}
                placeholder="Type or paste any patron feedback statement to see live RoBERTa & Naïve Bayes scoring..."
                inputProps={{ 'aria-label': 'Custom patron feedback statement' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: THEME.surface.cardAlt,
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    '& fieldset': { borderColor: THEME.brand.primary, borderWidth: '1.5px' },
                  },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: 1,
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: THEME.text.secondary }}>
                  Tip: Try adding a contrast conjunction like <strong>&ldquo;but&rdquo;</strong> or{' '}
                  <strong>&ldquo;however&rdquo;</strong> to trigger clause splitting.
                </Typography>
                <Button
                  size="small"
                  onClick={() => onInputTextChange('')}
                  disabled={!inputText}
                  sx={{ fontSize: '0.7rem', color: THEME.text.secondary }}
                >
                  Clear text
                </Button>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                p: 1.7,
                borderRadius: '12px',
                bgcolor: THEME.surface.cardAlt,
                border: `1.5px solid ${THEME.surface.borderLight}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                <QuoteIcon
                  aria-hidden="true"
                  sx={{ color: THEME.brand.accent, fontSize: 24, mt: 0.1, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {inputText.trim() ? (
                    <Typography
                      component="div"
                      sx={{
                        fontWeight: 500,
                        color: '#1e293b',
                        fontSize: '0.92rem',
                        lineHeight: 1.65,
                        wordBreak: 'break-word',
                      }}
                    >
                      &ldquo;
                      {annotatedTokens.map((seg) => {
                        if (seg.type === 'contrast') {
                          return (
                            <Tooltip
                              key={seg.key}
                              title="Contrast conjunction — triggers clause splitting & Most-Negative-Wins rule"
                              arrow
                            >
                              <Box
                                component="span"
                                sx={{
                                  px: 0.55,
                                  py: 0.1,
                                  mx: 0.15,
                                  borderRadius: '5px',
                                  bgcolor: THEME.brand.goldLight,
                                  color: '#b45309',
                                  borderBottom: `2px solid ${THEME.brand.accent}`,
                                  fontWeight: 700,
                                  cursor: 'help',
                                }}
                              >
                                {seg.text}
                              </Box>
                            </Tooltip>
                          );
                        }
                        if (seg.type === 'domain') {
                          const catSt = getCategoryStyle(seg.domainCategory);
                          const tipText =
                            seg.tfidf !== null
                              ? `${seg.domainCategory} keyword · Stem: "${seg.matchedToken}" · TF-IDF: ${seg.tfidf.toFixed(4)}`
                              : `${seg.domainCategory} domain keyword`;
                          return (
                            <Tooltip key={seg.key} title={tipText} arrow>
                              <Box
                                component="span"
                                sx={{
                                  px: 0.55,
                                  py: 0.1,
                                  mx: 0.1,
                                  borderRadius: '5px',
                                  bgcolor: catSt.bg,
                                  color: catSt.text,
                                  borderBottom: `2px solid ${catSt.solid}`,
                                  fontWeight: 700,
                                  cursor: 'help',
                                }}
                              >
                                {seg.text}
                              </Box>
                            </Tooltip>
                          );
                        }
                        return <React.Fragment key={seg.key}>{seg.text}</React.Fragment>;
                      })}
                      &rdquo;
                    </Typography>
                  ) : (
                    <Typography
                      sx={{
                        fontSize: '0.86rem',
                        fontStyle: 'italic',
                        color: THEME.text.secondary,
                      }}
                    >
                      (No written comment — Sentiment relies 100% on the 10 Likert ratings)
                    </Typography>
                  )}

                  {/* Highlight Legend & Metadata Row */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                      mt: 1.2,
                      pt: 1,
                      borderTop: `1px dashed ${THEME.surface.borderLight}`,
                    }}
                  >
                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap alignItems="center">
                      {selectedMeta?.storedCategory && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Stored: ${selectedMeta.storedCategory} · ${selectedMeta.storedSentiment}`}
                          sx={{
                            height: 21,
                            fontWeight: 600,
                            fontSize: '0.67rem',
                            color: THEME.text.secondary,
                            borderColor: '#cbd5e1',
                          }}
                        />
                      )}

                      {highlightSummary.domains.map((dom) => {
                        const st = getCategoryStyle(dom);
                        return (
                          <Box
                            key={dom}
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.45 }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: st.solid,
                              }}
                            />
                            <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: st.text }}>
                              {dom}
                            </Typography>
                          </Box>
                        );
                      })}

                      {highlightSummary.hasContrast && (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.45 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: THEME.brand.accent,
                            }}
                          />
                          <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#b45309' }}>
                            Contrast Split
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Typography sx={{ fontSize: '0.68rem', color: THEME.text.faint, fontWeight: 500 }}>
                      {wordCount} {wordCount === 1 ? 'word' : 'words'} · {clauses.length}{' '}
                      {clauses.length === 1 ? 'clause' : 'clauses'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* 1-Click Demo Scenarios for Rapid Edge-Case Testing */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.7,
              mt: 1.3,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, mr: 0.3 }}>
              <AutoAwesomeIcon aria-hidden="true" sx={{ fontSize: 14, color: THEME.brand.accent }} />
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: THEME.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                Try scenario:
              </Typography>
            </Box>

            {DEMO_SCENARIOS.map((sc) => (
              <Tooltip key={sc.id} title={sc.description} arrow>
                <Chip
                  label={sc.label}
                  size="small"
                  clickable
                  variant="outlined"
                  onClick={() => onLoadScenario(sc)}
                  sx={{
                    height: 23,
                    fontSize: '0.69rem',
                    fontWeight: 600,
                    color: THEME.brand.primary,
                    borderColor: THEME.brand.blueBorder,
                    bgcolor: THEME.surface.card,
                    '&:hover': {
                      bgcolor: THEME.brand.blueLight,
                      borderColor: THEME.brand.primary,
                    },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Unified 4-Card Executive Verdict Strip (Responsive: 1 col xs, 2 cols sm/md/lg, 4 cols xl) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            xl: 'repeat(4, 1fr)',
          },
          gap: 1.8,
          width: '100%',
          opacity: isLoading ? 0.65 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {/* 1. Final Hybrid Score */}
        <Paper
          elevation={0}
          sx={{
            ...cardShellSx,
            p: 2,
            borderTop: `3.5px solid ${sStyle.solid}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 132,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: THEME.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Final Hybrid Score
              </Typography>
              <CalculateIcon aria-hidden="true" sx={{ fontSize: 18, color: sStyle.text }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mt: 0.9, flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontSize: '1.7rem',
                  fontWeight: 800,
                  color: sStyle.text,
                  lineHeight: 1.1,
                }}
              >
                {formatSigned(combinedScore, 2)}
              </Typography>
              <Chip
                label={finalSentiment}
                size="small"
                sx={{
                  height: 21,
                  fontWeight: 800,
                  fontSize: '0.66rem',
                  bgcolor: sStyle.bg,
                  color: sStyle.text,
                  border: `1px solid ${sStyle.border}`,
                }}
              />
            </Box>
          </Box>

          <Typography sx={{ fontSize: '0.68rem', color: THEME.text.secondary, mt: 1 }}>
            {hasComment
              ? `50% Likert (${formatSigned(rAvg * 0.5)}) + 50% AI (${formatSigned(bertScore * 0.5)})`
              : 'Likert-only mode (no comment text)'}
          </Typography>
        </Paper>

        {/* 2. Likert Survey Mean */}
        <Paper
          elevation={0}
          sx={{
            ...cardShellSx,
            p: 2,
            borderTop: `3.5px solid ${THEME.brand.accent}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 132,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: THEME.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Likert Survey Mean
              </Typography>
              <ThumbUpIcon aria-hidden="true" sx={{ fontSize: 17, color: THEME.brand.accent }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mt: 0.9, flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontSize: '1.7rem',
                  fontWeight: 800,
                  color: getSentimentStyle(emojiSentiment).text,
                  lineHeight: 1.1,
                }}
              >
                {formatSigned(rAvg, 2)}
              </Typography>
              <Chip
                label={emojiSentiment}
                size="small"
                sx={{
                  height: 21,
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  bgcolor: getSentimentStyle(emojiSentiment).bg,
                  color: getSentimentStyle(emojiSentiment).text,
                  border: `1px solid ${getSentimentStyle(emojiSentiment).border}`,
                }}
              />
            </Box>
          </Box>

          <Typography sx={{ fontSize: '0.68rem', color: THEME.text.secondary, mt: 1 }}>
            Mean across {validCount} of 10 valid Likert items
          </Typography>
        </Paper>

        {/* 3. RoBERTa Polarity */}
        <Paper
          elevation={0}
          sx={{
            ...cardShellSx,
            p: 2,
            borderTop: `3.5px solid ${THEME.brand.primary}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 132,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: THEME.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                RoBERTa Polarity
              </Typography>
              <PsychologyIcon aria-hidden="true" sx={{ fontSize: 18, color: THEME.brand.primary }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mt: 0.9, flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontSize: '1.7rem',
                  fontWeight: 800,
                  color: hasComment ? getSentimentStyle(robertaSentiment).text : THEME.text.faint,
                  lineHeight: 1.1,
                }}
              >
                {hasComment ? formatSigned(bertScore, 1) : '—'}
              </Typography>
              <Chip
                label={
                  hasComment
                    ? `${robertaSentiment} (${(robertaConf * 100).toFixed(0)}%)`
                    : 'Skipped'
                }
                size="small"
                sx={{
                  height: 21,
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  bgcolor: THEME.brand.blueLight,
                  color: THEME.brand.primary,
                  border: `1px solid ${THEME.brand.blueBorder}`,
                }}
              />
            </Box>
          </Box>

          <Typography sx={{ fontSize: '0.68rem', color: THEME.text.secondary, mt: 1 }} noWrap>
            {hasComment ? aggStrategy : 'No text comment provided'}
          </Typography>
        </Paper>

        {/* 4. Naïve Bayes Category */}
        <Paper
          elevation={0}
          sx={{
            ...cardShellSx,
            p: 2,
            borderTop: `3.5px solid ${cStyle.solid}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 132,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: THEME.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Naïve Bayes Category
              </Typography>
              <CategoryIcon aria-hidden="true" sx={{ fontSize: 17, color: cStyle.solid }} />
            </Box>

            <Box sx={{ mt: 0.9 }}>
              <Tooltip title={displayCategory} arrow>
                <Typography
                  sx={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: cStyle.text,
                    lineHeight: 1.2,
                  }}
                  noWrap
                >
                  {displayCategory}
                </Typography>
              </Tooltip>
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: displayFallback ? THEME.status.errorText : THEME.status.success,
              mt: 1,
            }}
          >
            {!hasComment
              ? 'No text to classify'
              : displayFallback
                ? `Fallback (< ${(confidenceThreshold * 100).toFixed(0)}% guard τ)`
                : `${(rawConf * 100).toFixed(1)}% conf · +${leadMargin.toFixed(1)} pts lead`}
          </Typography>
        </Paper>
      </Box>
    </Stack>
  );
}
