// ── HLL Library System — Centralized Design Tokens ─────────────────────────
// Single source of truth for all colors, fonts, and reusable MUI sx presets.
// Import this file instead of hardcoding hex values in page components.

export const THEME = {
  // ── Brand Colors (CPU Blue & Gold / Henry Luce III Library) ───────────────
  brand: {
    primary: '#0f2b5c',       // Deep CPU Navy — headers, primary buttons, table heads
    primaryHover: '#0a1c38',  // Hover state for primary
    accent: '#d49f1e',        // CPU School Gold — border accents, highlights, badges
    accentHover: '#b88612',   // Hover state for gold accent
    indigo: '#1e40af',        // Royal Sapphire Navy
    indigoHover: '#172554',   // Darker Navy Hover
    goldLight: '#fffbeb',     // Soft Gold Tint
    goldBorder: '#fde68a',    // Gold Border
    blueLight: '#eff6ff',     // Soft Blue Tint
    blueBorder: '#bfdbfe',    // Blue Border
    violet: '#d49f1e',        // Gold Accent
    violetHover: '#b88612',
  },

  // ── Sentiment Palette (Teal = Positive, Lavender/Slate = Neutral, Rosey Red = Negative)
  sentiment: {
    Positive: { bg: '#005960', light: '#e6f4f5', text: '#005960', dot: '#137a84' },
    Neutral:  { bg: '#7381cf', light: '#edf0fc', text: '#4a57a9', dot: '#8b97d8' },
    Negative: { bg: '#f43f5e', light: '#fff1f2', text: '#be123c', dot: '#f87171' },
  },

  // ── Category Palette (CPU Service Areas — Blue & Gold) ─────────────────────
  category: {
    Facilities:           { bg: '#0f2b5c', light: '#eff6ff', text: '#0f2b5c', dot: '#1e40af' },
    Staff:                { bg: '#d49f1e', light: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
    Collection:           { bg: '#1d4ed8', light: '#eff6ff', text: '#1e40af', dot: '#3b82f6' },
    'Other/Uncategorized':{ bg: '#64748b', light: '#f8fafc', text: '#475569', dot: '#94a3b8' },
  },

  // ── Category Donut Ring Colors ────────────────────────────────────────────
  categoryDonut: {
    Facilities: '#0f2b5c',
    Staff: '#d49f1e',
    Collection: '#1d4ed8',
  },

  // ── Chart Colors ──────────────────────────────────────────────────────────
  chart: {
    colors: ['#005960', '#7381cf', '#f43f5e'],
    gradients: {
      positive: { start: '#005960', end: '#137a84' },
      neutral:  { start: '#7381cf', end: '#8b97d8' },
      negative: { start: '#f87171', end: '#f43f5e' },
    },
    donutGradients: {
      positive: { start: '#005960', end: '#137a84' },
      neutral:  { start: '#7381cf', end: '#c2cbf0' },
      negative: { start: '#f43f5e', end: '#fca5a5' },
    },
  },

  // ── Word Cloud Colors ─────────────────────────────────────────────────────
  wordCloudColors: [
    '#0f2b5c', '#d49f1e', '#1d4ed8', '#005960', '#f59e0b',
    '#f43f5e', '#7381cf', '#0ea5e9', '#0d9488', '#6366f1',
  ],

  // ── Surface / UI Neutral Palette ──────────────────────────────────────────
  surface: {
    background: '#f4f6f8',
    backgroundGrad: 'linear-gradient(180deg, #f4f6f8 0%, #e8edf4 100%)',
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
    heading: '#0f2b5c',
    body: '#334155',
    secondary: '#475569',
    muted: '#64748b',
    faint: '#94a3b8',
    white: '#ffffff',
    link: '#0f2b5c',
  },

  // ── Status / Feedback Colors ──────────────────────────────────────────────
  status: {
    success:       '#005960',
    successHover:  '#004449',
    successLight:  '#e6f4f5',
    successBorder: '#b3dfe2',
    successShadow: 'rgba(0, 89, 96, 0.25)',
    error:         '#f43f5e',
    errorHover:    '#e11d48',
    errorLight:    '#fff1f2',
    errorBorder:   '#fecdd3',
    errorText:     '#e11d48',
    warningLight:  '#fffbeb',
    warningBorder: '#fde68a',
    warningText:   '#d97706',
    warningBold:   '#b45309',
    info:          '#0f2b5c',
    wordHighlight: '#d49f1e',
  },

  // ── Filter Chip Colors (Active filter badges) ─────────────────────────────
  filterChips: {
    date:       { bg: '#ffffff', color: '#0f2b5c', border: '#cbd5e1' },
    clientele:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    college:    { bg: '#eff6ff', color: '#0f2b5c', border: '#bfdbfe' },
    course:     { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    sentimentPos:{ bg: '#e6f4f5', color: '#005960', border: '#b3dfe2' },
    sentimentNeu:{ bg: '#edf0fc', color: '#4a57a9', border: '#cdd5f7' },
    sentimentNeg:{ bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
    category:   { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
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
    card: '0 4px 16px -2px rgba(15, 43, 92, 0.06)',
    cardHover: '0 8px 24px -4px rgba(15, 43, 92, 0.15)',
    elevated: '0 10px 25px -5px rgba(0,0,0,0.1)',
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
  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
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
  color: THEME.text.muted,
  fontWeight: 500,
  mt: 0.2,
};

/** Section header icon style */
export const sectionIconSx = {
  fontSize: 20,
  color: '#0f2b5c',
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
      borderColor: '#0f2b5c',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0f2b5c',
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
      color: '#0f2b5c',
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
  color: '#0f2b5c',
  bgcolor: '#eff6ff',
  boxShadow: 'none',
  px: 1.6,
  py: 0.35,
  minWidth: 'auto',
  height: 28,
  '&:hover': {
    bgcolor: '#dbeafe',
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
    color: THEME.text.muted,
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
  color: `${THEME.text.muted} !important`,
  '& .MuiTableSortLabel-icon': { color: `${THEME.text.faint} !important` },
};
