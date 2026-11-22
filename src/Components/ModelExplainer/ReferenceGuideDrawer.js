import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { THEME } from '../../constants/themeTokens';

function GuideSection({ number, title, accentColor, children }) {
  return (
    <Box
      sx={{
        p: 1.6,
        bgcolor: THEME.surface.cardAlt,
        borderRadius: '12px',
        border: `1px solid ${THEME.surface.borderLight}`,
        borderLeft: `3.5px solid ${accentColor}`,
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: accentColor, mb: 0.6 }}>
        {number}. {title}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: '0.76rem',
          color: THEME.text.body,
          lineHeight: 1.6,
          '& code': {
            fontFamily: 'monospace',
            fontSize: '0.73rem',
            bgcolor: '#ffffff',
            px: 0.55,
            py: 0.15,
            borderRadius: '4px',
            border: `1px solid ${THEME.surface.borderLight}`,
            color: THEME.brand.primary,
          },
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export default function ReferenceGuideDrawer({ open, onClose, alpha = 0.01, confidenceThreshold = 0.45 }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 460 },
          bgcolor: THEME.surface.card,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Sticky Drawer Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1.5px solid ${THEME.surface.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: THEME.brand.primary,
          color: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon aria-hidden="true" sx={{ color: THEME.brand.accent, fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#ffffff', lineHeight: 1.2 }}>
              Model Reference Guide
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#cbdbe9' }}>
              Confidence &amp; Grading Computation
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Close model reference guide"
          sx={{ color: '#ffffff', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Scrollable Guide Body */}
      <Box sx={{ p: 2.2, overflowY: 'auto', flex: 1 }}>
        <Stack spacing={1.8}>
          <GuideSection
            number={1}
            title="Two-Track Architecture Overview"
            accentColor={THEME.brand.primary}
          >
            The Henry Luce III Library NLP engine evaluates both numerical patron ratings and free-text comments through two independent tracks:
            <Box component="ul" sx={{ pl: 2.2, my: 0.7 }}>
              <li>
                <strong>Track 1 — Category Classification:</strong> Multinomial Naïve Bayes with Porter-stemmed TF-IDF features and Laplace Smoothing (<code>α = {alpha}</code>) routes feedback to <em>Facilities</em>, <em>Staff</em>, <em>Collection</em>, or <em>Other/Uncategorized</em>.
              </li>
              <li>
                <strong>Track 2 — Hybrid Sentiment Synthesis:</strong> Fuses the 10-item Likert survey mean (Layer 1) with CardiffNLP RoBERTa transformer text polarity (Layer 2).
              </li>
            </Box>
          </GuideSection>

          <GuideSection
            number={2}
            title="Survey Likert Mean Conversion (Layer 1)"
            accentColor={THEME.brand.accent}
          >
            Each of the 10 standardized survey questions maps from the 5-point Likert scale onto a normalized bipolar range <code>[-1.0, +1.0]</code>:
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ my: 0.8 }}>
              <Chip size="small" label="5 = +1.00" sx={{ height: 21, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#eafaf1', color: '#107c41' }} />
              <Chip size="small" label="4 = +0.50" sx={{ height: 21, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#f0fdf4', color: '#16a34a' }} />
              <Chip size="small" label="3 = 0.00" sx={{ height: 21, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }} />
              <Chip size="small" label="2 = -0.50" sx={{ height: 21, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#fff1f2', color: '#e11d48' }} />
              <Chip size="small" label="1 = -1.00" sx={{ height: 21, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#ffe4e6', color: '#be123c' }} />
              <Chip size="small" label="N/A = Excluded" sx={{ height: 21, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#f8fafc', color: '#64748b' }} />
            </Stack>
            Arithmetic mean: <code>R_avg = (Σ Valid Scores) / Valid Count</code>.
          </GuideSection>

          <GuideSection
            number={3}
            title="RoBERTa Polarity & Clause Splitting (Layer 2)"
            accentColor="#1d4ed8"
          >
            Free-text comments are evaluated with <code>cardiffnlp/twitter-roberta-base-sentiment-latest</code>:
            <Box component="ul" sx={{ pl: 2.2, my: 0.7 }}>
              <li>
                Discrete polarity mapping: <strong>Positive</strong> = <code>+1.0</code>, <strong>Neutral</strong> = <code>0.0</code>, <strong>Negative</strong> = <code>-1.0</code>.
              </li>
              <li>
                <strong>Contrast Conjunction Rule (&ldquo;Most-Negative-Wins&rdquo;):</strong> Statements containing contrast terms (<em>but</em>, <em>however</em>, <em>although</em>, <em>while</em>) are split into clauses. Any negative clause overrides positive clauses so actionable issues surface immediately.
              </li>
            </Box>
          </GuideSection>

          <GuideSection
            number={4}
            title="Final Hybrid Formula & Decision Zones"
            accentColor={THEME.status.success}
          >
            <Box sx={{ mb: 0.8 }}>
              • <strong>With comment:</strong> <code>S = (R_avg × 0.50) + (BERT × 0.50)</code>
              <br />
              • <strong>Without comment:</strong> <code>S = R_avg</code>
            </Box>
            <Divider sx={{ my: 0.8 }} />
            <Box>
              • <code>S &gt; +0.15</code> → <strong style={{ color: THEME.status.success }}>Positive</strong> (Commendation)
              <br />
              • <code>-0.15 ≤ S ≤ +0.15</code> → <strong style={{ color: THEME.sentiment.Neutral.text }}>Neutral</strong> (Equilibrium buffer)
              <br />
              • <code>S &lt; -0.15</code> → <strong style={{ color: THEME.status.errorText }}>Negative</strong> (Action required)
            </Box>
          </GuideSection>

          <GuideSection
            number={5}
            title="Category Confidence Guard (τ)"
            accentColor="#7e22ce"
          >
            Naïve Bayes computes posterior probabilities <code>P(Category | Tokens)</code> across all four service classes. If the top class falls below the guard threshold (currently <code>τ = {Math.round(confidenceThreshold * 100)}%</code>, default <code>45%</code>), the comment falls back to <strong>Other/Uncategorized</strong> to prevent low-confidence misrouting.
          </GuideSection>
        </Stack>
      </Box>
    </Drawer>
  );
}
