import React, { useState } from 'react';
import {
  Box, Typography, Chip, Button, IconButton, MenuItem, Select,
  Switch, Tooltip, Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { THEME } from '../constants/themeTokens';

export const INVENTORY_FONT = THEME.font.family;
export const INVENTORY_MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

// Minimalist SaaS palette (charcoal black primary + coral-orange accent + pastel status pills)
export const INVENTORY_COLORS = {
  primary: '#111827',
  primaryHover: '#1F2937',
  primaryTint: '#F3F4F6',
  primaryBorder: '#D1D5DB',
  accent: '#E95D2A',
  accentHover: '#D44D1C',
  accentTint: '#FFF4F0',
  accentBorder: '#FBD5C5',
  canvas: '#F5F6F8',
  sidebarBg: '#FAFAFB',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FAFB',
  tableHeaderBg: '#F3F4F6',
  rowHover: '#FFF7F4',
  rowZebra: '#FFFFFF',
  border: '#EAECF0',
  borderStrong: '#D1D5DB',
  gridLine: '#F2F4F7',
  textStrong: '#111827',
  textBody: '#374151',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  inStockBg: '#EEF2FF',
  inStockText: '#4338CA',
  inStockBorder: '#E0E7FF',
  successBg: '#DCFCE7',
  successText: '#15803D',
  successBorder: '#BBF7D0',
  warningBg: '#FEF9C3',
  warningText: '#A16207',
  warningBorder: '#FDE68A',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
  dangerHover: '#B91C1C',
  dangerBorder: '#FECACA',
  neutralBg: '#F3F4F6',
  neutralText: '#4B5563',
};

// Wider outer shell so equipment & inventory tables expand generously on desktop monitors
export const INVENTORY_CONTAINER_MAX_WIDTH = 1600;

// Quiet secondary card surface (used for collapsible input forms so the data table takes center stage)
export const inventoryCardSx = {
  backgroundColor: INVENTORY_COLORS.surfaceMuted,
  border: `1px solid ${INVENTORY_COLORS.border}`,
  borderRadius: '12px',
  boxShadow: 'none',
  overflow: 'hidden',
};

export const inventoryCardHeaderSx = {
  px: { xs: 2, sm: 2.5 },
  py: 1.5,
  borderBottom: `1px solid ${INVENTORY_COLORS.border}`,
  backgroundColor: INVENTORY_COLORS.surfaceMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 1.5,
};

// Highlighted hero table card (crisp white, coral top accent bar, stronger border, noticeable elevation)
export const inventoryHeroTableCardSx = {
  backgroundColor: INVENTORY_COLORS.surface,
  border: `1.5px solid ${INVENTORY_COLORS.borderStrong}`,
  borderTop: `3.5px solid ${INVENTORY_COLORS.accent}`,
  borderRadius: '14px',
  boxShadow: '0 8px 24px -6px rgba(17, 24, 39, 0.09), 0 2px 6px rgba(17, 24, 39, 0.04)',
  overflow: 'hidden',
};

export const inventoryHeroTableHeaderSx = {
  px: { xs: 2.5, sm: 3 },
  py: 2.15,
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
      borderColor: INVENTORY_COLORS.border,
    },
    '&:hover fieldset': {
      borderColor: INVENTORY_COLORS.borderStrong,
    },
    '&.Mui-focused fieldset': {
      borderColor: INVENTORY_COLORS.primary,
      borderWidth: '1.5px',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(17, 24, 39, 0.06)',
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
    backgroundColor: '#F3F4F6',
    '& fieldset': {
      borderColor: INVENTORY_COLORS.border,
    },
    '&:hover fieldset': {
      borderColor: INVENTORY_COLORS.border,
    },
    '&.Mui-disabled': {
      backgroundColor: '#F3F4F6',
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
  fontSize: 13,
  textTransform: 'none',
  borderRadius: '8px',
  backgroundColor: INVENTORY_COLORS.primary,
  color: '#FFFFFF',
  boxShadow: '0 1px 2px rgba(17, 24, 39, 0.14)',
  px: 2.25,
  minHeight: 38,
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: INVENTORY_COLORS.primaryHover,
    boxShadow: '0 2px 6px rgba(17, 24, 39, 0.2)',
  },
  '&.Mui-disabled': {
    backgroundColor: '#E5E7EB',
    color: '#9CA3AF',
    boxShadow: 'none',
  },
};

export const inventorySecondaryBtnSx = {
  fontFamily: INVENTORY_FONT,
  fontWeight: 500,
  fontSize: 13,
  textTransform: 'none',
  borderRadius: '8px',
  borderColor: INVENTORY_COLORS.border,
  color: INVENTORY_COLORS.textStrong,
  backgroundColor: INVENTORY_COLORS.surface,
  px: 2,
  minHeight: 38,
  whiteSpace: 'nowrap',
  '&:hover': {
    borderColor: INVENTORY_COLORS.borderStrong,
    backgroundColor: INVENTORY_COLORS.surfaceMuted,
  },
};

export const inventoryNavBtnSx = {
  ...inventorySecondaryBtnSx,
  minHeight: 36,
  height: 36,
  px: 1.75,
};

export const inventoryLogoutBtnSx = {
  fontFamily: INVENTORY_FONT,
  fontWeight: 500,
  fontSize: 13,
  textTransform: 'none',
  borderRadius: '8px',
  borderColor: INVENTORY_COLORS.dangerBorder,
  color: INVENTORY_COLORS.dangerText,
  backgroundColor: INVENTORY_COLORS.surface,
  px: 1.75,
  height: 36,
  whiteSpace: 'nowrap',
  '&:hover': {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
};

// Larger, higher-contrast table header row for the spotlight data tables
export const inventoryTableHeadRowSx = {
  backgroundColor: INVENTORY_COLORS.tableHeaderBg,
  '& th': {
    fontFamily: INVENTORY_FONT,
    fontWeight: 600,
    fontSize: 13,
    color: INVENTORY_COLORS.textBody,
    whiteSpace: 'nowrap',
    py: 1.8,
    px: 2.5,
    borderBottom: `1.5px solid #E5E7EB`,
    borderRight: `1px solid ${INVENTORY_COLORS.border}`,
    '&:last-of-type': { borderRight: 'none' },
  },
};

// Roomier, larger table body rows with warm coral hover + bold left accent stripe
export const inventoryTableRowSx = {
  backgroundColor: INVENTORY_COLORS.surface,
  transition: 'background-color 0.12s ease',
  '&:hover': {
    backgroundColor: `${INVENTORY_COLORS.rowHover} !important`,
    '& td:first-of-type': {
      boxShadow: `inset 4px 0 0 ${INVENTORY_COLORS.accent}`,
    },
  },
  '& td': {
    fontFamily: INVENTORY_FONT,
    fontSize: 14.5,
    color: INVENTORY_COLORS.textBody,
    py: 1.95,
    px: 2.5,
    borderBottom: `1px solid ${INVENTORY_COLORS.border}`,
    borderRight: `1px solid ${INVENTORY_COLORS.gridLine}`,
    '&:last-of-type': { borderRight: 'none' },
  },
  '&:last-of-type td': {
    borderBottom: 'none',
  },
};

export const CoralSwitch = styled(Switch)(() => ({
  width: 38,
  height: 22,
  padding: 0,
  display: 'flex',
  '&:active .MuiSwitch-thumb': {
    width: 18,
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#FFFFFF',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: INVENTORY_COLORS.accent,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    width: 18,
    height: 18,
    borderRadius: 9,
    transition: 'width 0.15s ease',
  },
  '& .MuiSwitch-track': {
    borderRadius: 11,
    opacity: 1,
    backgroundColor: '#D1D5DB',
    boxSizing: 'border-box',
  },
}));

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
        fontSize: 14.5,
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
        height: 24,
        borderRadius: '6px',
        fontFamily: INVENTORY_FONT,
        fontSize: 11.5,
        fontWeight: 600,
        backgroundColor: INVENTORY_COLORS.neutralBg,
        color: INVENTORY_COLORS.neutralText,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  </Box>
);

// Prominent hero title block for highlighted Equipment & Inventory data tables
export const HeroTableTitle = ({ icon: Icon, title, subtitle, countLabel }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
    {Icon && (
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: '10px',
          backgroundColor: INVENTORY_COLORS.accentTint,
          border: `1px solid ${INVENTORY_COLORS.accentBorder}`,
          color: INVENTORY_COLORS.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
    )}
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
        <Typography
          sx={{
            fontFamily: INVENTORY_FONT,
            fontWeight: 700,
            fontSize: { xs: 16.5, sm: 18 },
            color: INVENTORY_COLORS.textStrong,
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {countLabel && (
          <Chip
            label={countLabel}
            size="small"
            sx={{
              height: 24,
              borderRadius: '6px',
              fontFamily: INVENTORY_FONT,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: INVENTORY_COLORS.accentTint,
              color: INVENTORY_COLORS.accent,
              border: `1px solid ${INVENTORY_COLORS.accentBorder}`,
              '& .MuiChip-label': { px: 1.1 },
            }}
          />
        )}
      </Box>
      {subtitle && (
        <Typography
          sx={{
            fontFamily: INVENTORY_FONT,
            fontSize: 12.5,
            color: INVENTORY_COLORS.textSecondary,
            mt: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

// Compact supporting 4-column KPI strip so the primary table commands the spotlight
export const InventoryKpiStrip = ({ stats = [] }) => {
  if (!stats.length) return null;

  const badgeTone = (tone) => {
    switch (tone) {
      case 'positive':
        return { bg: INVENTORY_COLORS.successBg, color: INVENTORY_COLORS.successText };
      case 'indigo':
        return { bg: INVENTORY_COLORS.inStockBg, color: INVENTORY_COLORS.inStockText };
      case 'warning':
        return { bg: INVENTORY_COLORS.warningBg, color: INVENTORY_COLORS.warningText };
      case 'danger':
        return { bg: INVENTORY_COLORS.dangerBg, color: INVENTORY_COLORS.dangerText };
      default:
        return { bg: INVENTORY_COLORS.neutralBg, color: INVENTORY_COLORS.neutralText };
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: INVENTORY_COLORS.surfaceMuted,
        border: `1px solid ${INVENTORY_COLORS.border}`,
        borderRadius: '10px',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${stats.length}, 1fr)` },
        overflow: 'hidden',
        mb: 2,
      }}
    >
      {stats.map((stat, idx) => {
        const badge = badgeTone(stat.tone);
        return (
          <Box
            key={stat.label}
            sx={{
              px: 2.25,
              py: 1.5,
              borderRight: {
                xs: 'none',
                sm: idx % 2 === 0 ? `1px solid ${INVENTORY_COLORS.border}` : 'none',
                md: idx < stats.length - 1 ? `1px solid ${INVENTORY_COLORS.border}` : 'none',
              },
              borderBottom: {
                xs: idx < stats.length - 1 ? `1px solid ${INVENTORY_COLORS.border}` : 'none',
                sm: idx < stats.length - 2 ? `1px solid ${INVENTORY_COLORS.border}` : 'none',
                md: 'none',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.45 }}>
              <Typography
                sx={{
                  fontFamily: INVENTORY_FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: INVENTORY_COLORS.textSecondary,
                }}
              >
                {stat.label}
              </Typography>
              {stat.hint && (
                <Tooltip title={stat.hint} arrow placement="top">
                  <InfoOutlinedIcon sx={{ fontSize: 13.5, color: INVENTORY_COLORS.textMuted, cursor: 'help' }} />
                </Tooltip>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontFamily: INVENTORY_FONT,
                  fontSize: 21,
                  fontWeight: 700,
                  color: INVENTORY_COLORS.textStrong,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stat.value}
              </Typography>

              {stat.badge && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 0.85,
                    py: 0.15,
                    borderRadius: '6px',
                    fontFamily: INVENTORY_FONT,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: badge.bg,
                    color: badge.color,
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stat.badge}
                </Box>
              )}
            </Box>

            {stat.subtext && (
              <Typography
                sx={{
                  fontFamily: INVENTORY_FONT,
                  fontSize: 11.5,
                  color: INVENTORY_COLORS.textMuted,
                  mt: 0.35,
                }}
              >
                {stat.subtext}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// Numbered pagination footer ("Showing per page" | coral active page pill | "Go to page")
export const ModernTablePagination = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [15, 25, 50],
}) => {
  const [goInput, setGoInput] = useState('');
  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
  const currentPage = Math.min(page, totalPages - 1);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages = [0];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);
    if (start > 1) pages.push('left-ellipsis');
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (end < totalPages - 2) pages.push('right-ellipsis');
    pages.push(totalPages - 1);
    return pages;
  };

  const handleGoToPage = (e) => {
    if (e) e.preventDefault();
    const parsed = parseInt(goInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(null, parsed - 1);
      setGoInput('');
    }
  };

  const pageBtnSx = (isActive) => ({
    minWidth: 34,
    height: 34,
    px: 0.75,
    borderRadius: '8px',
    fontFamily: INVENTORY_FONT,
    fontSize: 13.5,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#FFFFFF' : INVENTORY_COLORS.textBody,
    backgroundColor: isActive ? INVENTORY_COLORS.accent : 'transparent',
    border: isActive ? `1px solid ${INVENTORY_COLORS.accent}` : '1px solid transparent',
    '&:hover': {
      backgroundColor: isActive ? INVENTORY_COLORS.accentHover : INVENTORY_COLORS.neutralBg,
    },
  });

  const navIconBtnSx = {
    width: 34,
    height: 34,
    borderRadius: '8px',
    border: `1px solid ${INVENTORY_COLORS.border}`,
    color: INVENTORY_COLORS.textBody,
    '&:hover': { backgroundColor: INVENTORY_COLORS.surfaceMuted },
    '&.Mui-disabled': { color: '#D1D5DB', borderColor: '#F3F4F6' },
  };

  return (
    <Box
      sx={{
        px: { xs: 2.5, sm: 3 },
        py: 1.75,
        borderTop: `1px solid ${INVENTORY_COLORS.border}`,
        backgroundColor: INVENTORY_COLORS.surfaceMuted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      {/* Left: Showing per page */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 13.5, color: INVENTORY_COLORS.textSecondary }}>
          Showing per page
        </Typography>
        <Select
          size="small"
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          sx={{
            height: 34,
            borderRadius: '8px',
            backgroundColor: INVENTORY_COLORS.surface,
            fontFamily: INVENTORY_FONT,
            fontSize: 13.5,
            fontWeight: 600,
            color: INVENTORY_COLORS.textStrong,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: INVENTORY_COLORS.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: INVENTORY_COLORS.borderStrong },
            '& .MuiSelect-select': { py: 0.4, pl: 1.25, pr: 3 },
          }}
        >
          {rowsPerPageOptions.map((opt) => (
            <MenuItem key={opt} value={opt} sx={inventoryMenuItemSx}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Center: Numbered page pills with coral-orange active state */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
        <IconButton
          size="small"
          aria-label="First page"
          disabled={currentPage === 0}
          onClick={() => onPageChange(null, 0)}
          sx={navIconBtnSx}
        >
          <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Previous page"
          disabled={currentPage === 0}
          onClick={() => onPageChange(null, Math.max(0, currentPage - 1))}
          sx={navIconBtnSx}
        >
          <ChevronLeftIcon sx={{ fontSize: 17 }} />
        </IconButton>

        {getPageNumbers().map((p) =>
          typeof p === 'string' ? (
            <Typography
              key={p}
              sx={{
                fontFamily: INVENTORY_FONT,
                fontSize: 13.5,
                color: INVENTORY_COLORS.textMuted,
                px: 0.6,
                userSelect: 'none',
              }}
            >
              …
            </Typography>
          ) : (
            <Button
              key={p}
              size="small"
              onClick={() => onPageChange(null, p)}
              sx={pageBtnSx(p === currentPage)}
            >
              {p + 1}
            </Button>
          )
        )}

        <IconButton
          size="small"
          aria-label="Next page"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(null, Math.min(totalPages - 1, currentPage + 1))}
          sx={navIconBtnSx}
        >
          <ChevronRightIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Last page"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(null, totalPages - 1)}
          sx={navIconBtnSx}
        >
          <KeyboardDoubleArrowRightIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Right: Go to page (native number spinner hidden cleanly) */}
      <Box
        component="form"
        onSubmit={handleGoToPage}
        sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}
      >
        <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 13.5, color: INVENTORY_COLORS.textSecondary }}>
          Go to page
        </Typography>
        <Box
          component="input"
          type="number"
          min={1}
          max={totalPages}
          value={goInput}
          placeholder={String(currentPage + 1)}
          onChange={(e) => setGoInput(e.target.value)}
          aria-label="Go to page number"
          sx={{
            width: 54,
            height: 34,
            px: 1,
            borderRadius: '8px',
            border: `1px solid ${INVENTORY_COLORS.border}`,
            backgroundColor: INVENTORY_COLORS.surface,
            fontFamily: INVENTORY_FONT,
            fontSize: 13.5,
            color: INVENTORY_COLORS.textStrong,
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&:focus': { borderColor: INVENTORY_COLORS.primary },
          }}
        />
        <Button
          type="submit"
          size="small"
          sx={{
            fontFamily: INVENTORY_FONT,
            fontSize: 13.5,
            fontWeight: 600,
            textTransform: 'none',
            color: INVENTORY_COLORS.textStrong,
            minWidth: 'auto',
            px: 1.1,
            borderRadius: '8px',
            '&:hover': { backgroundColor: INVENTORY_COLORS.neutralBg },
          }}
        >
          Go ›
        </Button>
      </Box>
    </Box>
  );
};

const SIDEBAR_GROUPS = [
  {
    heading: 'OFFICE SUPPLIES',
    items: [
      { label: 'Disbursements', path: '/supplies', icon: LocalShippingOutlinedIcon },
      { label: 'Supplies Encoding', path: '/supplies-encoding', icon: EditNoteOutlinedIcon },
    ],
  },
  {
    heading: 'LIBRARY EQUIPMENT',
    items: [
      { label: 'Acquisitions', path: '/equipment', icon: AssignmentOutlinedIcon },
      { label: 'Equipment Encoding', path: '/equipment-encoding', icon: DevicesOutlinedIcon },
    ],
  },
  {
    heading: 'OPERATIONS',
    items: [
      { label: 'Send Asset', path: '/send-asset', icon: SendOutlinedIcon },
      { label: 'Asset History', path: '/transactions', icon: HistoryOutlinedIcon },
    ],
  },
];

export const InventoryPageShell = ({
  title,
  userLabel,
  onLogout,
  actions,
  hideCanvas = false,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const userInitial = (userLabel || 'U').trim().charAt(0).toUpperCase();

  return (
    <Box
      sx={{
        backgroundColor: INVENTORY_COLORS.canvas,
        minHeight: 'calc(100vh - 92px)',
        py: { xs: 1.5, md: 2 },
        px: { xs: 1.5, sm: 2, md: 2.25 },
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: INVENTORY_CONTAINER_MAX_WIDTH,
          mx: 'auto',
          display: 'flex',
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        {/* Compact Left Navigation Rail (204px on lg+ to maximize table width) */}
        <Box
          component="aside"
          sx={{
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            width: 204,
            flexShrink: 0,
            backgroundColor: INVENTORY_COLORS.sidebarBg,
            border: `1px solid ${INVENTORY_COLORS.border}`,
            borderRadius: '14px',
            p: 1.25,
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.15,
              px: 0.75,
              py: 1,
              mb: 1.5,
              borderBottom: `1px solid ${INVENTORY_COLORS.border}`,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: INVENTORY_COLORS.primary,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Inventory2OutlinedIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: INVENTORY_FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  color: INVENTORY_COLORS.textStrong,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                HLL Inventory
              </Typography>
              <Typography
                sx={{
                  fontFamily: INVENTORY_FONT,
                  fontSize: 10.5,
                  color: INVENTORY_COLORS.textMuted,
                  lineHeight: 1.2,
                }}
              >
                Asset Workspace
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {SIDEBAR_GROUPS.map((group) => (
              <Box key={group.heading}>
                <Typography
                  sx={{
                    fontFamily: INVENTORY_FONT,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.07em',
                    color: INVENTORY_COLORS.textMuted,
                    px: 1,
                    mb: 0.65,
                  }}
                >
                  {group.heading}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname.toLowerCase() === item.path.toLowerCase();
                    return (
                      <Button
                        key={item.path}
                        fullWidth
                        onClick={() => navigate(item.path)}
                        startIcon={
                          <Icon
                            sx={{
                              fontSize: '17px !important',
                              color: active ? INVENTORY_COLORS.textStrong : INVENTORY_COLORS.textSecondary,
                            }}
                          />
                        }
                        sx={{
                          justifyContent: 'flex-start',
                          fontFamily: INVENTORY_FONT,
                          fontSize: 12.5,
                          fontWeight: active ? 600 : 500,
                          textTransform: 'none',
                          px: 1.1,
                          py: 0.8,
                          borderRadius: '8px',
                          color: active ? INVENTORY_COLORS.textStrong : INVENTORY_COLORS.textBody,
                          backgroundColor: active ? INVENTORY_COLORS.surface : 'transparent',
                          border: active ? `1px solid ${INVENTORY_COLORS.border}` : '1px solid transparent',
                          boxShadow: active ? '0 1px 2px rgba(16, 24, 40, 0.05)' : 'none',
                          '&:hover': {
                            backgroundColor: active ? INVENTORY_COLORS.surface : '#F1F3F5',
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>

          {userLabel && (
            <Box
              sx={{
                mt: 2,
                pt: 1.25,
                borderTop: `1px solid ${INVENTORY_COLORS.border}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 0.75,
                  p: 0.9,
                  borderRadius: '10px',
                  backgroundColor: INVENTORY_COLORS.surface,
                  border: `1px solid ${INVENTORY_COLORS.border}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, minWidth: 0 }}>
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontFamily: INVENTORY_FONT,
                      backgroundColor: INVENTORY_COLORS.accentTint,
                      color: INVENTORY_COLORS.accent,
                      border: `1px solid ${INVENTORY_COLORS.accentBorder}`,
                    }}
                  >
                    {userInitial}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontSize: 12,
                        fontWeight: 600,
                        color: INVENTORY_COLORS.textStrong,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {userLabel}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontSize: 10.5,
                        color: INVENTORY_COLORS.textMuted,
                        lineHeight: 1.2,
                      }}
                    >
                      Signed in
                    </Typography>
                  </Box>
                </Box>
                {onLogout && (
                  <Tooltip title="Logout" arrow>
                    <IconButton
                      size="small"
                      aria-label="Logout"
                      onClick={onLogout}
                      sx={{
                        color: INVENTORY_COLORS.textSecondary,
                        '&:hover': {
                          color: INVENTORY_COLORS.dangerText,
                          backgroundColor: '#FEF2F2',
                        },
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Main Workspace Panel (soft neutral canvas inside so the hero pure-white table card pops) */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            backgroundColor: INVENTORY_COLORS.surface,
            border: `1px solid ${INVENTORY_COLORS.border}`,
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 2.75 },
              py: 1.75,
              borderBottom: `1px solid ${INVENTORY_COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontFamily: INVENTORY_FONT,
                fontWeight: 700,
                fontSize: { xs: 18.5, sm: 21 },
                color: INVENTORY_COLORS.textStrong,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {userLabel && (
                <Box
                  sx={{
                    display: { xs: 'inline-flex', lg: 'none' },
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    height: 36,
                    borderRadius: '8px',
                    backgroundColor: INVENTORY_COLORS.surfaceMuted,
                    border: `1px solid ${INVENTORY_COLORS.border}`,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: INVENTORY_FONT,
                      backgroundColor: INVENTORY_COLORS.accentTint,
                      color: INVENTORY_COLORS.accent,
                    }}
                  >
                    {userInitial}
                  </Avatar>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: INVENTORY_COLORS.textStrong,
                    }}
                  >
                    {userLabel}
                  </Typography>
                </Box>
              )}
              {actions}
            </Box>
          </Box>

          {!hideCanvas && (
            <Box sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
              {children}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
