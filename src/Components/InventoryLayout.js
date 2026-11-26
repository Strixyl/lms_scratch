import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { THEME } from '../constants/themeTokens';

export const INVENTORY_FONT = THEME.font.family;
export const INVENTORY_MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const INVENTORY_COLORS = {
  primary: THEME.brand.primary,           // #16324f deep institutional navy
  primaryHover: THEME.brand.primaryHover, // #0f243a
  primaryTint: THEME.brand.blueLight,     // #edf4fa
  primaryBorder: THEME.brand.blueBorder,  // #cbdbe9
  canvas: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  rowHover: '#F1F5F9',
  rowZebra: '#FAFBFD',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textStrong: '#0F172A',
  textBody: '#334155',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  successBg: '#ECFDF5',
  successText: '#047857',
  successBorder: '#A7F3D0',
  warningBg: '#FFFBEB',
  warningText: '#B45309',
  warningBorder: '#FDE68A',
  dangerBg: '#FFF1F2',
  dangerText: '#BE123C',
  dangerHover: '#9F1239',
  dangerBorder: '#FECDD3',
};

export const INVENTORY_CONTAINER_MAX_WIDTH = 1320;

export const inventoryContainerSx = {
  width: '100%',
  maxWidth: INVENTORY_CONTAINER_MAX_WIDTH,
  mx: 'auto',
  px: { xs: 2, sm: 3, md: 4 },
  boxSizing: 'border-box',
};

export const inventoryCardSx = {
  backgroundColor: INVENTORY_COLORS.surface,
  border: `1px solid ${INVENTORY_COLORS.border}`,
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(22, 50, 79, 0.03)',
  overflow: 'hidden',
};

export const inventoryCardHeaderSx = {
  px: { xs: 2, sm: 3 },
  py: 2,
  borderBottom: `1px solid ${INVENTORY_COLORS.border}`,
  backgroundColor: INVENTORY_COLORS.surface,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 2,
};

export const inventoryFieldSx = {
  '& .MuiOutlinedInput-root': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    borderRadius: '8px',
    backgroundColor: INVENTORY_COLORS.surface,
    color: INVENTORY_COLORS.textStrong,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    '& fieldset': {
      borderColor: INVENTORY_COLORS.borderStrong,
    },
    '&:hover fieldset': {
      borderColor: INVENTORY_COLORS.primary,
    },
    '&.Mui-focused fieldset': {
      borderColor: INVENTORY_COLORS.primary,
      borderWidth: '1.5px',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(22, 50, 79, 0.08)',
    },
    '&.Mui-error fieldset': {
      borderColor: INVENTORY_COLORS.dangerText,
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    color: INVENTORY_COLORS.textStrong,
    '&::placeholder': {
      fontFamily: INVENTORY_FONT,
      color: INVENTORY_COLORS.textMuted,
      opacity: 1,
    },
  },
  '& .MuiSelect-select': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    color: INVENTORY_COLORS.textStrong,
  },
  '& .MuiInputLabel-root': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    color: INVENTORY_COLORS.textSecondary,
    '&.Mui-focused': {
      color: INVENTORY_COLORS.primary,
      fontWeight: 600,
    },
    '&.Mui-error': {
      color: INVENTORY_COLORS.dangerText,
    },
  },
  '& .MuiFormHelperText-root': {
    fontFamily: INVENTORY_FONT,
    fontSize: 11.5,
    mx: 0.5,
    mt: 0.5,
  },
};

export const inventoryReadOnlyFieldSx = {
  ...inventoryFieldSx,
  '& .MuiOutlinedInput-root': {
    ...inventoryFieldSx['& .MuiOutlinedInput-root'],
    backgroundColor: INVENTORY_COLORS.surfaceMuted,
    '& fieldset': {
      borderColor: INVENTORY_COLORS.border,
    },
    '&:hover fieldset': {
      borderColor: INVENTORY_COLORS.border,
    },
    '&.Mui-disabled': {
      backgroundColor: INVENTORY_COLORS.surfaceMuted,
    },
    '&.Mui-disabled fieldset': {
      borderColor: INVENTORY_COLORS.border,
    },
  },
  '& .MuiInputBase-input.Mui-disabled': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    WebkitTextFillColor: INVENTORY_COLORS.textBody,
    color: INVENTORY_COLORS.textBody,
    cursor: 'default',
  },
  '& .MuiInputLabel-root.Mui-disabled': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    color: INVENTORY_COLORS.textSecondary,
  },
};

export const inventoryMenuItemSx = {
  fontFamily: INVENTORY_FONT,
  fontSize: 13.5,
};

export const inventoryPrimaryBtnSx = {
  fontFamily: INVENTORY_FONT,
  fontWeight: 600,
  fontSize: 13.5,
  textTransform: 'none',
  borderRadius: '8px',
  backgroundColor: INVENTORY_COLORS.primary,
  color: '#FFFFFF',
  boxShadow: '0 1px 2px rgba(22, 50, 79, 0.18)',
  px: 3,
  minHeight: 40,
  '&:hover': {
    backgroundColor: INVENTORY_COLORS.primaryHover,
    boxShadow: '0 3px 8px rgba(22, 50, 79, 0.22)',
  },
  '&.Mui-disabled': {
    backgroundColor: '#CBD5E1',
    color: '#64748B',
    boxShadow: 'none',
  },
};

export const inventorySecondaryBtnSx = {
  fontFamily: INVENTORY_FONT,
  fontWeight: 600,
  fontSize: 13.5,
  textTransform: 'none',
  borderRadius: '8px',
  borderColor: INVENTORY_COLORS.borderStrong,
  color: INVENTORY_COLORS.primary,
  backgroundColor: INVENTORY_COLORS.surface,
  px: 2.5,
  minHeight: 40,
  '&:hover': {
    borderColor: INVENTORY_COLORS.primary,
    backgroundColor: INVENTORY_COLORS.primaryTint,
  },
};

export const inventoryNavBtnSx = {
  fontFamily: INVENTORY_FONT,
  fontWeight: 600,
  fontSize: 13,
  textTransform: 'none',
  borderRadius: '8px',
  borderColor: INVENTORY_COLORS.primaryBorder,
  color: INVENTORY_COLORS.primary,
  backgroundColor: INVENTORY_COLORS.surface,
  px: 2,
  height: 36,
  whiteSpace: 'nowrap',
  '&:hover': {
    borderColor: INVENTORY_COLORS.primary,
    backgroundColor: INVENTORY_COLORS.primaryTint,
  },
};

export const inventoryLogoutBtnSx = {
  fontFamily: INVENTORY_FONT,
  fontWeight: 600,
  fontSize: 13,
  textTransform: 'none',
  borderRadius: '8px',
  borderColor: INVENTORY_COLORS.dangerBorder,
  color: INVENTORY_COLORS.dangerText,
  backgroundColor: INVENTORY_COLORS.surface,
  px: 2,
  height: 36,
  whiteSpace: 'nowrap',
  '&:hover': {
    borderColor: '#FDA4AF',
    backgroundColor: INVENTORY_COLORS.dangerBg,
  },
};

export const inventoryTableHeadRowSx = {
  backgroundColor: INVENTORY_COLORS.surfaceMuted,
  '& th': {
    fontFamily: INVENTORY_FONT,
    fontWeight: 700,
    fontSize: 11.5,
    color: INVENTORY_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    py: 1.5,
    px: 2,
    borderBottom: `1px solid ${INVENTORY_COLORS.border}`,
  },
};

export const inventoryTableRowSx = {
  transition: 'background-color 0.12s ease',
  '&:nth-of-type(even)': {
    backgroundColor: INVENTORY_COLORS.rowZebra,
  },
  '&:hover': {
    backgroundColor: `${INVENTORY_COLORS.rowHover} !important`,
  },
  '& td': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    color: INVENTORY_COLORS.textBody,
    py: 1.45,
    px: 2,
    borderBottom: `1px solid #F1F5F9`,
  },
  '&:last-of-type td': {
    borderBottom: 'none',
  },
};

export const inventoryPaginationSx = {
  borderTop: `1px solid ${INVENTORY_COLORS.border}`,
  backgroundColor: INVENTORY_COLORS.surface,
  fontFamily: INVENTORY_FONT,
  color: INVENTORY_COLORS.textSecondary,
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select': {
    fontFamily: INVENTORY_FONT,
    fontSize: 13,
    color: INVENTORY_COLORS.textSecondary,
  },
  '& .MuiTablePagination-select': {
    color: INVENTORY_COLORS.textStrong,
    fontWeight: 600,
  },
};

export const isDeletedItemName = (name) => {
  if (!name) return true;
  return name.trim().toLowerCase() === '(deleted item)';
};

export const formatUnitShort = (unit, quantity = 2) => {
  const normalized = (unit || '').trim().toLowerCase();
  const isSingular = Math.abs(Number(quantity)) === 1;
  switch (normalized) {
    case 'pieces':
    case 'piece':
    case 'pcs':
    case 'pc':
      return isSingular ? 'pc' : 'pcs';
    case 'boxes':
    case 'box':
      return isSingular ? 'box' : 'boxes';
    case 'reams':
    case 'ream':
      return isSingular ? 'ream' : 'reams';
    case 'packs':
    case 'pack':
      return isSingular ? 'pack' : 'packs';
    case '':
      return '';
    default:
      return normalized;
  }
};

export const formatDateParts = (rawDate) => {
  if (!rawDate) return { date: '—', time: '' };
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return { date: String(rawDate), time: '' };
  }
  return {
    date: parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

export const ArchivedItemCell = ({ label = 'Deleted item' }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
    <Typography
      component="span"
      sx={{
        fontFamily: INVENTORY_FONT,
        fontSize: 13.5,
        fontStyle: 'italic',
        fontWeight: 400,
        color: INVENTORY_COLORS.textSecondary,
      }}
    >
      {label}
    </Typography>
    <Chip
      label="Archived"
      size="small"
      sx={{
        height: 20,
        fontFamily: INVENTORY_FONT,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: '#F1F5F9',
        color: INVENTORY_COLORS.textSecondary,
        border: `1px solid ${INVENTORY_COLORS.borderStrong}`,
        '& .MuiChip-label': { px: 0.9 },
      }}
    />
  </Box>
);

export const InventoryPageShell = ({
  breadcrumb,
  title,
  userLabel,
  actions,
  hideCanvas = false,
  children,
}) => (
  <>
    <Box
      sx={{
        backgroundColor: INVENTORY_COLORS.surface,
        borderBottom: `1px solid ${INVENTORY_COLORS.border}`,
      }}
    >
      <Box
        sx={{
          ...inventoryContainerSx,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {breadcrumb && (
            <Typography
              sx={{
                fontFamily: INVENTORY_FONT,
                fontSize: 11.5,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: INVENTORY_COLORS.textSecondary,
                mb: 0.25,
              }}
            >
              {breadcrumb}
            </Typography>
          )}
          <Typography
            component="h1"
            sx={{
              fontFamily: INVENTORY_FONT,
              fontWeight: 700,
              fontSize: { xs: 18, sm: 21 },
              color: INVENTORY_COLORS.primary,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
        </Box>

        {(userLabel || actions) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexWrap: 'wrap',
            }}
          >
            {userLabel && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  height: 36,
                  borderRadius: '8px',
                  backgroundColor: INVENTORY_COLORS.surfaceMuted,
                  border: `1px solid ${INVENTORY_COLORS.border}`,
                }}
              >
                <PersonOutlineIcon sx={{ fontSize: 16, color: INVENTORY_COLORS.textSecondary }} />
                <Typography
                  sx={{
                    fontFamily: INVENTORY_FONT,
                    fontSize: 12.5,
                    color: INVENTORY_COLORS.textSecondary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Signed in as{' '}
                  <Box component="span" sx={{ fontWeight: 600, color: INVENTORY_COLORS.textStrong }}>
                    {userLabel}
                  </Box>
                </Typography>
              </Box>
            )}
            {actions}
          </Box>
        )}
      </Box>
    </Box>

    {!hideCanvas && (
      <Box
        sx={{
          backgroundColor: INVENTORY_COLORS.canvas,
          minHeight: 'calc(100vh - 156px)',
          py: { xs: 2.5, md: 3.5 },
        }}
      >
        <Box sx={inventoryContainerSx}>{children}</Box>
      </Box>
    )}
  </>
);
