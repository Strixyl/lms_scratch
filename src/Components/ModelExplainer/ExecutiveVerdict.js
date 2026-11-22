import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  TextField,
  Tooltip,
  LinearProgress,
  Divider,
  Menu,
  MenuItem,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Done as DoneIcon,
  RestartAlt as RestartAltIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Highlight as HighlightIcon,
  CompareArrows as CompareArrowsIcon,
} from '@mui/icons-material';
import { THEME } from '../../constants/themeTokens';
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
  isLoading,
  diagnosticResult,
  confidenceThreshold,
}) {
  const [examplesAnchorEl, setExamplesAnchorEl] = useState(null);
  const [showHighlights, setShowHighlights] = useState(true);

  const rAvg = diagnosticResult?.likert_simulation?.r_avg ?? 0.0;
  const bertScore = diagnosticResult?.hybrid_synthesis?.bert_score ?? 0.0;
  const robertaConf = diagnosticResult?.roberta?.confidence ?? 0.0;
  const combinedScore = diagnosticResult?.hybrid_synthesis?.combined_score ?? 0.0;
  const finalSentiment = diagnosticResult?.hybrid_synthesis?.final_sentiment ?? 'Neutral';
  const hasComment = diagnosticResult?.hybrid_synthesis?.has_comment ?? Boolean(inputText.trim());

  const nb = diagnosticResult?.naive_bayes;
  const categoryProbs = useMemo(() => nb?.probabilities || EMPTY_PROBS, [nb]);
  const extractedFeatures = useMemo(() => nb?.extracted_features || EMPTY_FEATURES, [nb]);
  const serverCategory = nb?.final_category || 'Other/Uncategorized';
  const serverFallback = Boolean(nb?.fallback_applied);
  const rawWinner = nb?.raw_winner || 'Other/Uncategorized';
  const rawConf = nb?.raw_confidence ?? nb?.final_confidence ?? 0;

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

  const hasAnySignal = useMemo(
    () => annotatedTokens.some((seg) => seg.type === 'domain' || seg.type === 'contrast'),
    [annotatedTokens]
  );

  const hasDrift =
    Boolean(selectedMeta) &&
    !isModified &&
    (selectedMeta.storedCategory !== displayCategory ||
      selectedMeta.storedSentiment !== finalSentiment);

  const gaugePercent = Math.max(0, Math.min(100, ((combinedScore + 1.0) / 2.0) * 100));
  const topProbPct = useMemo(() => {
    const ranked = Object.values(categoryProbs).sort((a, b) => b - a);
    return Math.min(100, Math.max(0, (ranked[0] || 0) * 100));
  }, [categoryProbs]);
  const thresholdPct = Math.round(confidenceThreshold * 100);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: THEME.surface.card,
        border: `1px solid ${THEME.surface.borderLight}`,
        borderRadius: '14px',
        boxShadow: '0 1px 4px rgba(22, 50, 79, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Subtle 2px top progress bar during recomputation */}
      <Box sx={{ height: 2.5, width: '100%' }}>
        {isLoading && (
          <LinearProgress
            sx={{
              height: 2.5,
              bgcolor: THEME.brand.blueLight,
              '& .MuiLinearProgress-bar': { bgcolor: THEME.brand.primary },
            }}
          />
        )}
      </Box>

      {/* Part 1: Focal Point — The Patron Statement */}
      <Box sx={{ p: { xs: 2.2, md: 2.8 }, pb: { xs: 2, md: 2.4 } }}>
        {/* Quiet Context Bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.6,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: THEME.text.secondary }}>
              {selectedMeta
                ? `Record #${selectedMeta.id} · ${selectedMeta.clientele || 'Patron'} · ${selectedMeta.college || 'General'}`
                : 'Custom Sandbox Statement'}
            </Typography>

            {isModified && selectedMeta && (
              <Chip
                label="Edited"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: THEME.brand.goldLight,
                  color: '#b45309',
                  border: `1px solid ${THEME.brand.goldBorder}`,
                }}
              />
            )}

            {hasDrift && (
              <Tooltip
                title={`Stored in DB: ${selectedMeta.storedCategory} · ${selectedMeta.storedSentiment}`}
                arrow
              >
                <Chip
                  icon={<CompareArrowsIcon sx={{ fontSize: '13px !important', color: '#b45309 !important' }} />}
                  label="Differs from stored"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    bgcolor: THEME.brand.goldLight,
                    color: '#b45309',
                    border: `1px solid ${THEME.brand.goldBorder}`,
                  }}
                />
              </Tooltip>
            )}
          </Box>

          {/* Minimal Action Controls (Hick's Law: only 2-3 calm controls) */}
          <Stack direction="row" spacing={0.8} alignItems="center">
            {!isEditingQuote && hasAnySignal && (
              <Tooltip
                title={
                  showHighlights
                    ? 'Hide inline domain & contrast highlights'
                    : 'Highlight matched keywords & contrast words in text'
                }
                arrow
              >
                <Button
                  size="small"
                  aria-pressed={showHighlights}
                  startIcon={<HighlightIcon sx={{ fontSize: 15 }} />}
                  onClick={() => setShowHighlights((prev) => !prev)}
                  sx={{
                    height: 29,
                    px: 1.1,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    color: showHighlights ? THEME.brand.primary : THEME.text.secondary,
                    bgcolor: showHighlights ? THEME.brand.blueLight : 'transparent',
                    '&:hover': { bgcolor: showHighlights ? '#dbe7f3' : THEME.surface.cardAlt },
                  }}
                >
                  Signals
                </Button>
              </Tooltip>
            )}

            <Button
              size="small"
              endIcon={<ArrowDownIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => setExamplesAnchorEl(e.currentTarget)}
              sx={{
                height: 29,
                px: 1.1,
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '8px',
                color: THEME.text.secondary,
                '&:hover': { bgcolor: THEME.surface.cardAlt, color: THEME.brand.primary },
              }}
            >
              Examples
            </Button>

            {isModified && selectedMeta && (
              <Button
                size="small"
                startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
                onClick={onResetToOriginal}
                sx={{
                  height: 29,
                  px: 1.1,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  color: '#b45309',
                  '&:hover': { bgcolor: THEME.brand.goldLight },
                }}
              >
                Reset
              </Button>
            )}

            <Button
              size="small"
              variant={isEditingQuote ? 'contained' : 'outlined'}
              startIcon={
                isEditingQuote ? <DoneIcon sx={{ fontSize: 15 }} /> : <EditIcon sx={{ fontSize: 14 }} />
              }
              onClick={onToggleEditQuote}
              sx={{
                height: 29,
                px: 1.3,
                fontSize: '0.72rem',
                borderRadius: '8px',
                ...(isEditingQuote
                  ? {
                      bgcolor: THEME.brand.primary,
                      color: '#ffffff',
                      '&:hover': { bgcolor: THEME.brand.primaryHover },
                    }
                  : {
                      borderColor: THEME.surface.border,
                      color: THEME.brand.primary,
                      '&:hover': { borderColor: THEME.brand.primary, bgcolor: THEME.brand.blueLight },
                    }),
              }}
            >
              {isEditingQuote ? 'Done' : 'Edit text'}
            </Button>
          </Stack>
        </Box>

        {/* Demo Scenarios Dropdown Menu (keeps hero surface serene) */}
        <Menu
          anchorEl={examplesAnchorEl}
          open={Boolean(examplesAnchorEl)}
          onClose={() => setExamplesAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: 0.6,
              borderRadius: '12px',
              border: `1px solid ${THEME.surface.border}`,
              boxShadow: THEME.shadow.elevated,
              minWidth: 270,
            },
          }}
        >
          {DEMO_SCENARIOS.map((sc) => (
            <MenuItem
              key={sc.id}
              onClick={() => {
                onLoadScenario(sc);
                setExamplesAnchorEl(null);
              }}
              sx={{ py: 1, px: 1.8 }}
            >
              <ListItemText
                primary={sc.label}
                secondary={sc.description}
                primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: 700, color: THEME.text.primary }}
                secondaryTypographyProps={{ fontSize: '0.69rem', color: THEME.text.secondary }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Clean Editorial Statement (or Inline Editor) */}
        {isEditingQuote ? (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={5}
              autoFocus
              value={inputText}
              onChange={(e) => onInputTextChange(e.target.value)}
              placeholder="Type or paste a patron comment to test how the models respond..."
              inputProps={{ 'aria-label': 'Custom patron feedback statement' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: THEME.surface.cardAlt,
                  fontSize: '0.94rem',
                  lineHeight: 1.6,
                  '& fieldset': { borderColor: THEME.brand.primary, borderWidth: '1.5px' },
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.9 }}>
              <Typography sx={{ fontSize: '0.7rem', color: THEME.text.secondary }}>
                Updates automatically as you type.
              </Typography>
              {inputText && (
                <Button
                  size="small"
                  onClick={() => onInputTextChange('')}
                  sx={{ fontSize: '0.7rem', color: THEME.text.secondary, minWidth: 0 }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>
        ) : inputText.trim() ? (
          <Typography
            component="blockquote"
            sx={{
              m: 0,
              fontSize: { xs: '0.96rem', md: '1.06rem' },
              fontWeight: 500,
              color: THEME.text.primary,
              lineHeight: 1.65,
              maxWidth: '72ch',
              wordBreak: 'break-word',
            }}
          >
            &ldquo;
            {showHighlights
              ? annotatedTokens.map((seg) => {
                  if (seg.type === 'contrast') {
                    return (
                      <Tooltip
                        key={seg.key}
                        title="Contrast conjunction — splits statement into clauses"
                        arrow
                      >
                        <Box
                          component="span"
                          sx={{
                            px: 0.45,
                            borderRadius: '4px',
                            bgcolor: THEME.brand.goldLight,
                            color: '#b45309',
                            borderBottom: `2px solid ${THEME.brand.accent}`,
                            fontWeight: 600,
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
                    const tip =
                      seg.tfidf !== null
                        ? `${seg.domainCategory} signal · TF-IDF ${seg.tfidf.toFixed(3)}`
                        : `${seg.domainCategory} keyword`;
                    return (
                      <Tooltip key={seg.key} title={tip} arrow>
                        <Box
                          component="span"
                          sx={{
                            px: 0.45,
                            borderRadius: '4px',
                            bgcolor: catSt.bg,
                            color: catSt.text,
                            borderBottom: `2px solid ${catSt.solid}`,
                            fontWeight: 600,
                            cursor: 'help',
                          }}
                        >
                          {seg.text}
                        </Box>
                      </Tooltip>
                    );
                  }
                  return <React.Fragment key={seg.key}>{seg.text}</React.Fragment>;
                })
              : inputText}
            &rdquo;
          </Typography>
        ) : (
          <Typography sx={{ fontSize: '0.92rem', fontStyle: 'italic', color: THEME.text.secondary }}>
            No written comment — sentiment is computed solely from the 10 Likert ratings.
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: THEME.surface.borderLight }} />

      {/* Part 2: Unified 2-Column Verdict Strip (Clean, Zero Nested Boxes) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          opacity: isLoading ? 0.6 : 1,
          transition: 'opacity 0.18s ease',
        }}
      >
        {/* Left Verdict: Sentiment */}
        <Box
          sx={{
            p: { xs: 2.2, md: 2.6 },
            borderRight: { sm: `1px solid ${THEME.surface.borderLight}` },
            borderBottom: { xs: `1px solid ${THEME.surface.borderLight}`, sm: 'none' },
          }}
        >
          <Typography
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: THEME.text.faint,
              textTransform: 'uppercase',
              letterSpacing: 0.7,
              mb: 0.8,
            }}
          >
            Sentiment Verdict
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, mb: 0.7, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: THEME.text.primary,
                lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatSigned(combinedScore, 2)}
            </Typography>
            <Chip
              label={finalSentiment}
              size="small"
              sx={{
                height: 23,
                fontWeight: 700,
                fontSize: '0.72rem',
                bgcolor: sStyle.bg,
                color: sStyle.text,
                border: `1px solid ${sStyle.border}`,
              }}
            />
          </Box>

          <Typography sx={{ fontSize: '0.75rem', color: THEME.text.secondary, mb: 1.4 }}>
            {hasComment
              ? `Likert ${formatSigned(rAvg)} · RoBERTa ${formatSigned(bertScore, 1)} (${(robertaConf * 100).toFixed(0)}%)`
              : `Likert mean ${formatSigned(rAvg)} (standalone)`}
          </Typography>

          {/* Ultra-clean minimal continuum bar */}
          <Box sx={{ position: 'relative', pt: 0.4 }}>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                display: 'flex',
                bgcolor: '#e2e8f0',
                position: 'relative',
              }}
            >
              <Box sx={{ width: '42.5%', height: '100%', bgcolor: '#fecdd3', borderRadius: '3px 0 0 3px' }} />
              <Box sx={{ width: '15%', height: '100%', bgcolor: '#cbd5e1' }} />
              <Box sx={{ width: '42.5%', height: '100%', bgcolor: '#bbf7d0', borderRadius: '0 3px 3px 0' }} />

              <Box
                sx={{
                  position: 'absolute',
                  left: `${Math.max(2, Math.min(98, gaugePercent))}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  border: `3px solid ${sStyle.solid}`,
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.25)',
                  transition: 'left 0.25s ease-out',
                }}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.6,
                fontSize: '0.64rem',
                color: THEME.text.faint,
              }}
            >
              <span>-1.0</span>
              <span>Neutral ±0.15</span>
              <span>+1.0</span>
            </Box>
          </Box>
        </Box>

        {/* Right Verdict: Category */}
        <Box sx={{ p: { xs: 2.2, md: 2.6 } }}>
          <Typography
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: THEME.text.faint,
              textTransform: 'uppercase',
              letterSpacing: 0.7,
              mb: 0.8,
            }}
          >
            Category Classification
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.7, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: cStyle.solid,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: THEME.text.primary,
                lineHeight: 1.2,
              }}
              noWrap
            >
              {displayCategory}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: '0.75rem', color: THEME.text.secondary, mb: 1.4 }}>
            {!hasComment
              ? 'No comment text to classify'
              : displayFallback
                ? `${(rawConf * 100).toFixed(1)}% top prob · Below ${thresholdPct}% guard`
                : `${(rawConf * 100).toFixed(1)}% confidence · Clears ${thresholdPct}% guard`}
          </Typography>

          {/* Ultra-clean minimal confidence bar with threshold tick */}
          <Box sx={{ position: 'relative', pt: 0.4 }}>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#e2e8f0',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  width: `${hasComment ? topProbPct : 0}%`,
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: cStyle.solid,
                  transition: 'width 0.25s ease-out',
                }}
              />
              {/* Guard threshold vertical marker */}
              <Tooltip title={`Guard threshold τ = ${thresholdPct}%`} arrow>
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${thresholdPct}%`,
                    top: -3,
                    bottom: -3,
                    width: 2,
                    bgcolor: THEME.brand.primary,
                    borderRadius: 1,
                  }}
                />
              </Tooltip>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.6,
                fontSize: '0.64rem',
                color: THEME.text.faint,
              }}
            >
              <span>0%</span>
              <span>Guard τ = {thresholdPct}%</span>
              <span>100%</span>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
