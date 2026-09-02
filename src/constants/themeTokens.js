// ── HLL Library System — Centralized Design Tokens ─────────────────────────
// Single source of truth for all colors, fonts, and reusable MUI sx presets.
// Palette inspired by Modern Executive Analytics Dashboard: Deep Navy (#16324f),
// Vibrant Warm Golden-Orange (#f69d1b), Clean Slate Grey, and Soft Cool-Grey Surface (#eef1f6).

export const THEME = {
  // ── Brand Colors (Deep Executive Navy & Vibrant Golden Orange) ───────────
  brand: {
    primary: '#16324f',       // Deep Navy — headers, primary buttons, table heads, container outlines
    primaryHover: '#0f243a',  // Hover state for primary
    accent: '#f69d1b',        // Vibrant Warm Golden Orange — highlights, gold badges
    accentHover: '#df8208',   // Hover state for orange accent
    excel: '#107c41',         // Microsoft Excel Forest Green
    excelHover: '#0b5a2f',    // Excel Green Hover
    excelShadow: 'rgba(16, 124, 65, 0.28)',
    indigo: '#1b3a5b',        // Sapphire Navy
    indigoHover: '#10253d',   // Darker Navy Hover
    goldLight: '#fff8eb',     // Soft Gold/Orange Tint
    goldBorder: '#fed7aa',    // Gold/Orange Border
    blueLight: '#edf4fa',     // Soft Navy/Blue Tint
    blueBorder: '#cbdbe9',    // Blue Border
    violet: '#16324f',        // Primary Deep Navy
    violetHover: '#0f243a',
  },

  // ── Sentiment Palette (Excel Green, Slate Grey, and Red for all Sentiment Signals)
  sentiment: {
    Positive: { bg: '#107c41', light: '#eafaf1', text: '#107c41', dot: '#107c41', border: '#b7ebc9' },
    Neutral:  { bg: '#64748b', light: '#f1f5f9', text: '#475569', dot: '#94a3b8', border: '#cbd5e1' },
    Negative: { bg: '#e11d48', light: '#fff1f2', text: '#be123c', dot: '#f43f5e', border: '#fecdd3' },
  },

  // ── Category Palette (CPU Service Areas — Deep Navy, Warm Orange & Slate) ───
  category: {
    Facilities:           { bg: '#16324f', light: '#edf4fa', text: '#16324f', dot: '#254b73', border: '#cbdbe9' },
    Staff:                { bg: '#f69d1b', light: '#fff7ed', text: '#c2410c', dot: '#ea580c', border: '#fed7aa' },
    Collection:           { bg: '#254b73', light: '#f0f4f9', text: '#16324f', dot: '#486581', border: '#cbdbe9' },
    'Other/Uncategorized':{ bg: '#64748b', light: '#f8fafc', text: '#475569', dot: '#94a3b8', border: '#e2e8f0' },
  },

  // ── Category Donut Ring Colors ────────────────────────────────────────────
  categoryDonut: {
    Facilities: '#16324f',
    Staff: '#f69d1b',
    Collection: '#254b73',
  },

  // ── Chart Colors (Green = Positive, Slate = Neutral, Red = Negative) ──────
  chart: {
    colors: ['#107c41', '#64748b', '#e11d48'],
    gradients: {
      positive: { start: '#107c41', end: '#16a34a' },
      neutral:  { start: '#64748b', end: '#94a3b8' },
      negative: { start: '#f43f5e', end: '#fb7185' },
    },
    donutGradients: {
      positive: { start: '#107c41', end: '#16a34a' },
      neutral:  { start: '#64748b', end: '#cbd5e1' },
      negative: { start: '#f43f5e', end: '#fecdd3' },
    },
  },

  // ── Word Cloud Colors (Vibrant, Colorful & Modern Palette) ───────────────
  wordCloudColors: [
    '#0284c7', // Sky Blue
    '#7c3aed', // Royal Purple
    '#f59e0b', // Amber Gold
    '#10b981', // Emerald Green
    '#e11d48', // Crimson Rose
    '#4f46e5', // Electric Indigo
    '#ea580c', // Vibrant Orange
    '#0d9488', // Teal
    '#9333ea', // Bright Purple
    '#2563eb', // Sapphire Blue
    '#ec4899', // Pink
    '#059669', // Forest Mint
    '#d97706', // Warm Amber
    '#0891b2', // Ocean Cyan
    '#be123c', // Deep Crimson
    '#6366f1', // Indigo
    '#16324f', // Deep Navy
  ],

  // ── Surface / UI Neutral Palette ──────────────────────────────────────────
  surface: {
    background: '#eef1f6',
    backgroundGrad: 'linear-gradient(180deg, #eef1f6 0%, #e5e9f0 100%)',
    card: '#ffffff',
    cardAlt: '#f8fafc',
    cardAltHover: '#f1f5f9',
    border: '#d9e2ec',
    borderLight: '#e2e8f0',
    borderHover: '#94a3b8',
    wordCloudBg: '#ffffff', // Clean crisp white background
  },

  // ── Text Palette ──────────────────────────────────────────────────────────
  text: {
    primary: '#16324f',
    heading: '#16324f',
    body: '#334155',
    secondary: '#64748b',
    muted: '#8da2b5',
    faint: '#94a3b8',
    white: '#ffffff',
    link: '#16324f',
  },

  // ── Status / Feedback Colors ──────────────────────────────────────────────
  status: {
    success:       '#107c41',
    successHover:  '#0b5a2f',
    successLight:  '#eafaf1',
    successBorder: '#b7ebc9',
    successShadow: 'rgba(16, 124, 65, 0.25)',
    error:         '#e11d48',
    errorHover:    '#be123c',
    errorLight:    '#fff1f2',
    errorBorder:   '#fecdd3',
    errorText:     '#be123c',
    warningLight:  '#fff8eb',
    warningBorder: '#fed7aa',
    warningText:   '#d97706',
    warningBold:   '#b45309',
    info:          '#16324f',
    wordHighlight: '#f69d1b',
  },

  // ── Filter Chip Colors (Active filter badges) ─────────────────────────────
  filterChips: {
    date:       { bg: '#ffffff', color: '#16324f', border: '#d9e2ec' },
    clientele:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    college:    { bg: '#edf4fa', color: '#16324f', border: '#cbdbe9' },
    course:     { bg: '#edf4fa', color: '#254b73', border: '#cbdbe9' },
    sentimentPos:{ bg: '#eafaf1', color: '#107c41', border: '#b7ebc9' },
    sentimentNeu:{ bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    sentimentNeg:{ bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
    category:   { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
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
    card: '0 2px 10px rgba(22, 50, 79, 0.04)',
    cardHover: '0 8px 24px -4px rgba(22, 50, 79, 0.12)',
    elevated: '0 10px 25px -5px rgba(22, 50, 79, 0.1)',
  },
};

// ── Reusable MUI sx Presets ─────────────────────────────────────────────────

/** Standard clean minimalist section header bar */
export const sectionHeaderSx = {
  bgcolor: '#ffffff',
  px: { xs: 2, md: 3 },
  py: 1.6,
  borderBottom: `1px solid ${THEME.surface.borderLight}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

/** Standard card shell (white card with subtle light border and soft shadow) */
export const cardShellSx = {
  border: `1.5px solid ${THEME.surface.borderLight}`,
  borderRadius: THEME.radius.card,
  backgroundColor: THEME.surface.card,
  boxShadow: '0 2px 10px rgba(22, 50, 79, 0.03)',
  overflow: 'hidden',
};

/** Section header title text */
export const sectionTitleSx = {
  fontFamily: THEME.font.family,
  fontWeight: 800,
  fontSize: 16,
  color: THEME.text.primary,
  letterSpacing: '-0.2px',
};

/** Section header subtitle text */
export const sectionSubtitleSx = {
  fontFamily: THEME.font.family,
  fontSize: 12.5,
  color: THEME.text.secondary,
  fontWeight: 500,
  mt: 0.2,
};

/** Section header icon style */
export const sectionIconSx = {
  fontSize: 20,
  color: '#16324f',
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
      borderColor: THEME.surface.borderLight,
      borderWidth: '1.5px',
    },
    '&:hover fieldset': {
      borderColor: '#16324f',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#16324f',
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-root': {
    height: 44,
    fontFamily: THEME.font.family,
    fontWeight: 600,
    fontSize: 13.5,
    color: THEME.text.heading,
  },
  '& .MuiInputLabel-root': {
    fontFamily: THEME.font.family,
    fontWeight: 600,
    fontSize: 13.5,
    color: THEME.text.secondary,
    '&.Mui-focused': {
      color: '#16324f',
      fontWeight: 700,
    },
  },
  '& .MuiSelect-select': {
    fontFamily: THEME.font.family,
    fontWeight: 600,
    fontSize: 13.5,
  },
};

/** Menu item sx for dropdown selects */
export const menuItemSx = {
  fontFamily: THEME.font.family,
  fontWeight: 600,
  fontSize: 13.5,
};

/** Standard date preset / quick-action button style (soft pill) */
export const datePresetBtnSx = {
  borderRadius: '9999px',
  textTransform: 'none',
  fontFamily: THEME.font.family,
  fontWeight: 700,
  fontSize: 12,
  borderColor: 'transparent',
  color: '#16324f',
  bgcolor: '#edf4fa',
  boxShadow: 'none',
  px: 1.6,
  py: 0.35,
  minWidth: 'auto',
  height: 28,
  '&:hover': {
    bgcolor: '#dbe7f3',
    borderColor: 'transparent',
  },
};

/** Standard pagination button sx */
export const paginationBtnSx = {
  fontFamily: THEME.font.family,
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: '8px',
  borderColor: '#e2e8f0',
  color: THEME.text.secondary,
  bgcolor: 'transparent',
  fontSize: 12,
  px: 1.5,
  py: 0.35,
  '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
};

/** Table header row sx */
export const tableHeaderRowSx = {
  backgroundColor: '#ffffff',
  borderBottom: `1px solid ${THEME.surface.borderLight}`,
  '& th': {
    color: THEME.text.secondary,
    fontWeight: 700,
    fontFamily: THEME.font.family,
    fontSize: 11,
    py: 1.4,
    px: 1.5,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    borderBottom: `1px solid ${THEME.surface.borderLight}`,
  },
};

/** Table sort label on light header */
export const tableSortLabelSx = {
  color: `${THEME.text.secondary} !important`,
  '& .MuiTableSortLabel-icon': { color: `${THEME.text.faint} !important` },
};
