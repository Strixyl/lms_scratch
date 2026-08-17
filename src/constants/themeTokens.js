// ── HLL Library System — Centralized Design Tokens ─────────────────────────
// Single source of truth for all colors, fonts, and reusable MUI sx presets.
// Import this file instead of hardcoding hex values in page components.

export const THEME = {
  // ── Brand Colors (CPU / HLL Library) ──────────────────────────────────────
  brand: {
    primary: '#1d0a61',       // Deep purple — section headers, table heads
    primaryHover: '#0d47a1',  // Hover state for primary buttons
    accent: '#d49f1e',        // Gold — border accents, highlights
    accentHover: '#c49015',   // Hover state for accent
    indigo: '#1a237e',        // Deep indigo — apply filter button, focused input
    indigoHover: '#0d47a1',   // Hover state for indigo
    violet: '#4f46e5',        // Violet — login button
    violetHover: '#4338ca',   // Hover state for violet
  },

  // ── Sentiment Palette ─────────────────────────────────────────────────────
  sentiment: {
    Positive: { bg: '#10b981', light: '#ecfdf5', text: '#047857', dot: '#34d399' },
    Neutral:  { bg: '#f59e0b', light: '#fffbeb', text: '#b45309', dot: '#fbbf24' },
    Negative: { bg: '#f43f5e', light: '#fff1f2', text: '#be123c', dot: '#f87171' },
  },

  // ── Category Palette ──────────────────────────────────────────────────────
  category: {
    Facilities:           { bg: '#0288d1', light: '#e0f2fe', text: '#0369a1', dot: '#38bdf8' },
    Staff:                { bg: '#8b5cf6', light: '#f3e8ff', text: '#6b21a8', dot: '#c084fc' },
    Collection:           { bg: '#f97316', light: '#fff7ed', text: '#c2410c', dot: '#fb923c' },
    'Other/Uncategorized':{ bg: '#64748b', light: '#f8fafc', text: '#475569', dot: '#94a3b8' },
  },

  // ── Category Donut Ring Colors ────────────────────────────────────────────
  categoryDonut: {
    Facilities: '#0288d1',
    Staff: '#7b1fa2',
    Collection: '#ed6c02',
  },

  // ── Chart Colors ──────────────────────────────────────────────────────────
  chart: {
    colors: ['#34d399', '#fbbf24', '#f87171'],
    gradients: {
      positive: { start: '#34d399', end: '#059669' },
      neutral:  { start: '#fbbf24', end: '#d97706' },
      negative: { start: '#f87171', end: '#dc2626' },
    },
    donutGradients: {
      positive: { start: '#2e7d32', end: '#81c784' },
      neutral:  { start: '#ed6c02', end: '#ffb74d' },
      negative: { start: '#c62828', end: '#ff8a80' },
    },
  },

  // ── Word Cloud Colors ─────────────────────────────────────────────────────
  wordCloudColors: [
    '#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4',
    '#ec4899', '#6366f1', '#f97316', '#14b8a6', '#d946ef', '#0288d1',
  ],

  // ── Surface / UI Neutral Palette ──────────────────────────────────────────
  surface: {
    background: '#f0f4f8',
    backgroundGrad: 'linear-gradient(180deg, #f0f4f8 0%, #e6edf5 100%)',
    card: '#ffffff',
    cardAlt: '#f8fafc',
    cardAltHover: '#f1f5f9',
    border: '#cbd5e1',
    borderLight: '#e2e8f0',
    borderHover: '#94a3b8',
    wordCloudBg: '#fcfdff',
  },

  // ── Text Palette ──────────────────────────────────────────────────────────
  text: {
    primary: '#0f172a',
    heading: '#1e293b',
    body: '#334155',
    secondary: '#475569',
    muted: '#64748b',
    faint: '#94a3b8',
    white: '#ffffff',
    link: '#90caf9',
  },

  // ── Status / Feedback Colors ──────────────────────────────────────────────
  status: {
    success:       '#059669',
    successHover:  '#047857',
    successShadow: 'rgba(5, 150, 105, 0.25)',
    error:         '#f43f5e',
    errorHover:    '#e11d48',
    errorLight:    '#fff1f2',
    errorBorder:   '#fecdd3',
    errorText:     '#e11d48',
    warningLight:  '#fffbeb',
    warningBorder: '#fde68a',
    warningText:   '#d97706',
    warningBold:   '#b45309',
    info:          '#0288d1',
    wordHighlight: '#f57c00',
  },

  // ── Filter Chip Colors (Active filter badges) ─────────────────────────────
  filterChips: {
    date:       { bg: '#ffffff', color: '#1e293b', border: '#cbd5e1' },
    clientele:  { bg: '#f3e8ff', color: '#6b21a8', border: '#c084fc' },
    college:    { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
    sentiment:  { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' },
    category:   { bg: '#fffbeb', color: '#b45309', border: '#fcd34d' },
  },

  // ── Typography ────────────────────────────────────────────────────────────
  font: {
    family: 'Poppins, sans-serif',
  },

  // ── Common Radii ──────────────────────────────────────────────────────────
  radius: {
    card: 3.5,
    input: 2.5,
    chip: '20px',
    button: 2.5,
    inner: 2,
    pill: 1.5,
  },

  // ── Shadows ───────────────────────────────────────────────────────────────
  shadow: {
    card: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
    cardHover: '0 8px 24px -4px rgba(29, 10, 97, 0.15)',
    elevated: '0 10px 25px -5px rgba(0,0,0,0.1)',
  },
};

// ── Reusable MUI sx Presets ─────────────────────────────────────────────────

/** Standard section header bar (dark purple with gold border-bottom) */
export const sectionHeaderSx = {
  bgcolor: THEME.brand.primary,
  px: 3,
  py: 1.8,
  borderBottom: `3px solid ${THEME.brand.accent}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

/** Standard card shell (white card with gray border and subtle shadow) */
export const cardShellSx = {
  border: `1.5px solid ${THEME.surface.border}`,
  borderRadius: THEME.radius.card,
  backgroundColor: THEME.surface.card,
  boxShadow: THEME.shadow.card,
  overflow: 'hidden',
};

/** Section header title text */
export const sectionTitleSx = {
  fontFamily: THEME.font.family,
  fontWeight: 800,
  fontSize: 16,
  color: THEME.text.white,
  letterSpacing: 0.3,
};

/** Section header subtitle text */
export const sectionSubtitleSx = {
  fontFamily: THEME.font.family,
  fontSize: 12.5,
  color: THEME.text.link,
  fontWeight: 500,
  mt: 0.2,
};

/** Section header icon style */
export const sectionIconSx = {
  fontSize: 22,
  color: '#f59e0b',
};

/** Standard select/text field styling */
export const selectSx = {
  backgroundColor: THEME.surface.card,
  borderRadius: THEME.radius.input,
  minWidth: 165,
  '& .MuiOutlinedInput-root': {
    borderRadius: THEME.radius.input,
    backgroundColor: THEME.surface.card,
    '& fieldset': {
      borderColor: THEME.surface.border,
      borderWidth: '1.5px',
    },
    '&:hover fieldset': {
      borderColor: THEME.brand.indigo,
    },
    '&.Mui-focused fieldset': {
      borderColor: THEME.brand.accent,
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-root': {
    height: 46,
    fontFamily: THEME.font.family,
    fontWeight: 600,
    fontSize: 14,
    color: THEME.text.heading,
  },
  '& .MuiInputLabel-root': {
    fontFamily: THEME.font.family,
    fontWeight: 600,
    fontSize: 14,
    color: THEME.text.secondary,
    '&.Mui-focused': {
      color: THEME.brand.indigo,
      fontWeight: 700,
    },
  },
  '& .MuiSelect-select': {
    fontFamily: THEME.font.family,
    fontWeight: 600,
    fontSize: 14,
  },
};

/** Menu item sx for dropdown selects */
export const menuItemSx = {
  fontFamily: THEME.font.family,
  fontWeight: 600,
  fontSize: 14,
};

/** Standard date preset / quick-action button style */
export const datePresetBtnSx = {
  borderRadius: 2,
  textTransform: 'none',
  fontFamily: THEME.font.family,
  fontWeight: 700,
  fontSize: 12,
  borderColor: THEME.surface.border,
  color: THEME.text.heading,
  bgcolor: THEME.surface.card,
  '&:hover': {
    bgcolor: THEME.surface.cardAltHover,
    borderColor: THEME.brand.indigo,
  },
};

/** Standard pagination button sx */
export const paginationBtnSx = {
  fontFamily: THEME.font.family,
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 2,
  borderColor: THEME.surface.border,
  color: THEME.text.secondary,
  bgcolor: THEME.surface.card,
  '&:hover': { bgcolor: THEME.surface.cardAlt },
};

/** Table header row sx */
export const tableHeaderRowSx = {
  backgroundColor: THEME.brand.primary,
  borderBottom: `3px solid ${THEME.brand.accent}`,
  '& th': {
    color: 'white',
    fontWeight: 700,
    fontFamily: THEME.font.family,
    fontSize: 13,
    py: 1.5,
    borderRight: '1px solid rgba(255, 255, 255, 0.25)',
    '&:last-child': { borderRight: 'none' },
  },
};

/** Table sort label on white-on-dark header */
export const tableSortLabelSx = {
  color: 'white !important',
  '& .MuiTableSortLabel-icon': { color: 'white !important' },
};
