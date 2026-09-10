export const THEME = {
  // cpu color pallettte

  brand: {
    primary: '#16324f',       // deep navy for headers, buttons, borders
    primaryHover: '#0f243a',  // hover state
    accent: '#f69d1b',        // warm golden orange
    accentHover: '#df8208',   // accent hover
    excel: '#107c41',         // excel forest green
    excelHover: '#0b5a2f',    // excel hover
    excelShadow: 'rgba(16, 124, 65, 0.28)',
    indigo: '#1b3a5b',        // sapphire navy
    indigoHover: '#10253d',   // navy hover
    goldLight: '#fff8eb',     // gold tint
    goldBorder: '#fed7aa',    // gold border
    blueLight: '#edf4fa',     // blue tint
    blueBorder: '#cbdbe9',    // blue border
    violet: '#16324f',        // deep navy
    violetHover: '#0f243a',
  },

  // sentiment colors
  sentiment: {
    Positive: { bg: '#107c41', light: '#eafaf1', text: '#107c41', dot: '#107c41', border: '#b7ebc9' },
    Neutral: { bg: '#64748b', light: '#f1f5f9', text: '#475569', dot: '#94a3b8', border: '#cbd5e1' },
    Negative: { bg: '#e11d48', light: '#fff1f2', text: '#be123c', dot: '#f43f5e', border: '#fecdd3' },
  },

  // category palette matching table chips
  category: {
    Staff: { bg: '#ea580c', light: '#fff7ed', text: '#c2410c', dot: '#ea580c', border: '#fed7aa' },
    Facilities: { bg: '#2563eb', light: '#eff6ff', text: '#1d4ed8', dot: '#2563eb', border: '#bfdbfe' },
    Collection: { bg: '#9333ea', light: '#faf5ff', text: '#7e22ce', dot: '#9333ea', border: '#e9d5ff' },
    Environment: { bg: '#059669', light: '#ecfdf5', text: '#047857', dot: '#059669', border: '#a7f3d0' },
    Services: { bg: '#0d9488', light: '#f0fdfa', text: '#0f766e', dot: '#0d9488', border: '#99f6e4' },
    Technology: { bg: '#db2777', light: '#fdf2f8', text: '#be185d', dot: '#db2777', border: '#fbcfe8' },
    General: { bg: '#64748b', light: '#f8fafc', text: '#475569', dot: '#64748b', border: '#cbd5e1' },
    'Other/Uncategorized': { bg: '#64748b', light: '#f8fafc', text: '#475569', dot: '#64748b', border: '#cbd5e1' },
    Other: { bg: '#64748b', light: '#f8fafc', text: '#475569', dot: '#64748b', border: '#cbd5e1' },
  },

  // category colors for donut charts
  categoryDonut: {
    Facilities: '#2563eb',
    Staff: '#ea580c',
    Collection: '#9333ea',
  },

  // chart gradients
  chart: {
    colors: ['#107c41', '#64748b', '#e11d48'],
    gradients: {
      positive: { start: '#107c41', end: '#16a34a' },
      neutral: { start: '#64748b', end: '#94a3b8' },
      negative: { start: '#f43f5e', end: '#fb7185' },
    },
    donutGradients: {
      positive: { start: '#107c41', end: '#16a34a' },
      neutral: { start: '#64748b', end: '#cbd5e1' },
      negative: { start: '#f43f5e', end: '#fecdd3' },
    },
  },

  // word cloud color rotation
  wordCloudColors: [
    '#0284c7',
    '#7c3aed',
    '#f59e0b',
    '#10b981',
    '#e11d48',
    '#4f46e5',
    '#ea580c',
    '#0d9488',
    '#9333ea',
    '#2563eb',
    '#ec4899',
    '#059669',
    '#d97706',
    '#0891b2',
    '#be123c',
    '#6366f1',
    '#16324f',
  ],

  // border color
  surface: {
    background: '#eef1f6',
    backgroundGrad: 'linear-gradient(180deg, #eef1f6 0%, #e5e9f0 100%)',
    card: '#ffffff',
    cardAlt: '#f8fafc',
    cardAltHover: '#f1f5f9',
    border: '#d9e2ec',
    borderLight: '#e2e8f0',
    borderHover: '#94a3b8',
    wordCloudBg: '#ffffff',
  },

  // text colors
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

  // status feedback
  status: {
    success: '#107c41',
    successHover: '#0b5a2f',
    successLight: '#eafaf1',
    successBorder: '#b7ebc9',
    successShadow: 'rgba(16, 124, 65, 0.25)',
    error: '#e11d48',
    errorHover: '#be123c',
    errorLight: '#fff1f2',
    errorBorder: '#fecdd3',
    errorText: '#be123c',
    warningLight: '#fff8eb',
    warningBorder: '#fed7aa',
    warningText: '#d97706',
    warningBold: '#b45309',
    info: '#16324f',
    wordHighlight: '#f69d1b',
  },

  // active filter chips
  filterChips: {
    date: { bg: '#ffffff', color: '#16324f', border: '#d9e2ec' },
    clientele: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    college: { bg: '#edf4fa', color: '#16324f', border: '#cbdbe9' },
    course: { bg: '#edf4fa', color: '#254b73', border: '#cbdbe9' },
    sentimentPos: { bg: '#eafaf1', color: '#107c41', border: '#b7ebc9' },
    sentimentNeu: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    sentimentNeg: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
    category: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  },

  // font family
  font: {
    family: 'Poppins, sans-serif',
  },

  radius: {
    card: 3.5,
    input: 2.5,
    chip: '20px',
    button: 2.5,
    inner: 2,
    pill: 1.5,
  },

  shadow: {
    card: '0 2px 10px rgba(22, 50, 79, 0.04)',
    cardHover: '0 8px 24px -4px rgba(22, 50, 79, 0.12)',
    elevated: '0 10px 25px -5px rgba(22, 50, 79, 0.1)',
  },
};


// section header container
export const sectionHeaderSx = {
  bgcolor: '#ffffff',
  px: { xs: 2, md: 3 },
  py: 1.6,
  borderBottom: `1px solid ${THEME.surface.borderLight}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

// card shell container
export const cardShellSx = {
  border: `1.5px solid ${THEME.surface.borderLight}`,
  borderRadius: THEME.radius.card,
  backgroundColor: THEME.surface.card,
  boxShadow: '0 2px 10px rgba(22, 50, 79, 0.03)',
  overflow: 'hidden',
};

export const sectionTitleSx = {
  fontFamily: THEME.font.family,
  fontWeight: 800,
  fontSize: 16,
  color: THEME.text.primary,
  letterSpacing: '-0.2px',
};

export const sectionSubtitleSx = {
  fontFamily: THEME.font.family,
  fontSize: 12.5,
  color: THEME.text.secondary,
  fontWeight: 500,
  mt: 0.2,
};

export const sectionIconSx = {
  fontSize: 20,
  color: '#16324f',
};

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

export const menuItemSx = {
  fontFamily: THEME.font.family,
  fontWeight: 600,
  fontSize: 13.5,
};

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

// pagination button 
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

// table header 
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

// table sort header label
export const tableSortLabelSx = {
  color: `${THEME.text.secondary} !important`,
  '& .MuiTableSortLabel-icon': { color: `${THEME.text.faint} !important` },
};
