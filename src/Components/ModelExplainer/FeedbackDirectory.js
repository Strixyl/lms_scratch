import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  ButtonBase,
  TextField,
  Chip,
  IconButton,
  Stack,
  Pagination,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Popover,
  Badge,
  InputAdornment,
  Skeleton,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
  Refresh as RefreshIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { THEME } from '../../constants/themeTokens';
import { COLLEGE_OPTIONS } from '../../constants/sentimentConstants';
import {
  DATE_PRESETS,
  CATEGORY_FILTER_OPTIONS,
  getSentimentStyle,
} from './explainerUtils';

const ALL_COLLEGES = ['All', ...COLLEGE_OPTIONS];

export default function FeedbackDirectory({
  filteredComments,
  paginatedComments,
  totalCommentsCount,
  isFetchingSurveys,
  fetchError,
  onRetryFetch,
  selectedSurveyId,
  onSelectSurvey,
  searchTerm,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterSentiment,
  onSentimentChange,
  filterCollege,
  onCollegeChange,
  datePreset,
  onDatePresetChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  onClearAllFilters,
  tablePage,
  rowsPerPage,
  onPageChange,
}) {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const secondaryFilterCount =
    (filterCategory !== 'All' ? 1 : 0) +
    (filterSentiment !== 'All' ? 1 : 0) +
    (filterCollege !== 'All' ? 1 : 0) +
    (datePreset !== 'All Time' || customStartDate || customEndDate ? 1 : 0);

  const hasAnyFilter = Boolean(searchTerm.trim()) || secondaryFilterCount > 0;

  const activeChips = [];
  if (filterCategory !== 'All') {
    activeChips.push({
      key: 'category',
      label: filterCategory === 'Other/Uncategorized' ? 'Other' : filterCategory,
      onDelete: () => onCategoryChange('All'),
    });
  }
  if (filterSentiment !== 'All') {
    activeChips.push({
      key: 'sentiment',
      label: filterSentiment,
      onDelete: () => onSentimentChange('All'),
    });
  }
  if (filterCollege !== 'All') {
    activeChips.push({
      key: 'college',
      label: filterCollege,
      onDelete: () => onCollegeChange('All'),
    });
  }
  if (customStartDate || customEndDate) {
    activeChips.push({
      key: 'customDate',
      label: `${customStartDate || '…'}–${customEndDate || '…'}`,
      onDelete: () => {
        onCustomStartDateChange('');
        onCustomEndDateChange('');
      },
    });
  } else if (datePreset !== 'All Time') {
    activeChips.push({
      key: 'datePreset',
      label: datePreset,
      onDelete: () => onDatePresetChange('All Time'),
    });
  }

  return (
    <Box
      sx={{
        width: '100%',
        position: { md: 'sticky' },
        top: { md: 104 },
        alignSelf: 'start',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          bgcolor: THEME.surface.card,
          border: `1px solid ${THEME.surface.borderLight}`,
          borderRadius: '14px',
          boxShadow: '0 1px 4px rgba(22, 50, 79, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: { md: 'calc(100vh - 124px)' },
        }}
      >
        {/* Minimal Header + Search Controls */}
        <Box sx={{ p: 1.8, pb: 1.4, borderBottom: `1px solid ${THEME.surface.borderLight}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: THEME.text.primary }}>
                Feedback Records
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: THEME.text.faint }}>
                {hasAnyFilter ? `${filteredComments.length} of ${totalCommentsCount}` : filteredComments.length}
              </Typography>
            </Box>

            <Tooltip title="Reload records from database" arrow>
              <span>
                <IconButton
                  size="small"
                  aria-label="Reload patron feedback records"
                  onClick={onRetryFetch}
                  disabled={isFetchingSurveys}
                  sx={{ color: THEME.text.secondary, '&:hover': { color: THEME.brand.primary } }}
                >
                  <RefreshIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Search + Filter Popover Trigger */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search comments or #ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              inputProps={{ 'aria-label': 'Search patron feedback records' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon aria-hidden="true" sx={{ color: THEME.text.faint, fontSize: 17 }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search query"
                      onClick={() => onSearchChange('')}
                      edge="end"
                    >
                      <ClearIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 36,
                  borderRadius: '9px',
                  bgcolor: THEME.surface.cardAlt,
                  fontSize: '0.78rem',
                  '& fieldset': { borderColor: THEME.surface.borderLight },
                  '&:hover fieldset': { borderColor: THEME.surface.borderHover },
                  '&.Mui-focused fieldset': { borderColor: THEME.brand.primary, borderWidth: '1.5px' },
                },
              }}
            />

            <Tooltip title="Filter records" arrow>
              <IconButton
                size="small"
                aria-label="Open record filters"
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '9px',
                  border: '1px solid',
                  borderColor: secondaryFilterCount > 0 ? THEME.brand.primary : THEME.surface.borderLight,
                  bgcolor: secondaryFilterCount > 0 ? THEME.brand.blueLight : THEME.surface.cardAlt,
                  color: secondaryFilterCount > 0 ? THEME.brand.primary : THEME.text.secondary,
                  flexShrink: 0,
                  '&:hover': { borderColor: THEME.brand.primary, color: THEME.brand.primary },
                }}
              >
                <Badge
                  badgeContent={secondaryFilterCount}
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 15, height: 15 } }}
                >
                  <TuneIcon sx={{ fontSize: 17 }} />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>

          {/* Compact Active Filter Chips (only visible when filters are active) */}
          {activeChips.length > 0 && (
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              useFlexGap
              alignItems="center"
              sx={{ mt: 1 }}
            >
              {activeChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  size="small"
                  onDelete={chip.onDelete}
                  sx={{
                    height: 21,
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    bgcolor: THEME.brand.blueLight,
                    color: THEME.brand.primary,
                    '& .MuiChip-deleteIcon': { fontSize: 13 },
                  }}
                />
              ))}
              <Button
                size="small"
                onClick={onClearAllFilters}
                sx={{ fontSize: '0.67rem', color: THEME.text.secondary, minWidth: 0, px: 0.5 }}
              >
                Clear
              </Button>
            </Stack>
          )}
        </Box>

        {/* Secondary Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.8,
                borderRadius: '12px',
                border: `1px solid ${THEME.surface.border}`,
                boxShadow: THEME.shadow.elevated,
                width: { xs: 290, sm: 320 },
                p: 2,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.4 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: THEME.text.primary }}>
              Filter Records
            </Typography>
            {hasAnyFilter && (
              <Button
                size="small"
                onClick={onClearAllFilters}
                sx={{ fontSize: '0.7rem', color: THEME.status.errorText, minWidth: 0, p: 0 }}
              >
                Reset all
              </Button>
            )}
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: THEME.text.secondary, textTransform: 'uppercase', mb: 0.6 }}>
              Category
            </Typography>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              {CATEGORY_FILTER_OPTIONS.map((cat) => {
                const active = filterCategory === cat;
                return (
                  <Chip
                    key={cat}
                    label={cat === 'Other/Uncategorized' ? 'Other' : cat}
                    size="small"
                    clickable
                    onClick={() => onCategoryChange(cat)}
                    variant={active ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: active ? THEME.brand.primary : 'transparent',
                      color: active ? '#ffffff' : THEME.text.body,
                      borderColor: active ? THEME.brand.primary : '#cbd5e1',
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: THEME.text.secondary, textTransform: 'uppercase', mb: 0.6 }}>
              Sentiment
            </Typography>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              {['All', 'Positive', 'Neutral', 'Negative'].map((s) => {
                const active = filterSentiment === s;
                return (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    clickable
                    onClick={() => onSentimentChange(s)}
                    variant={active ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: active ? THEME.brand.primary : 'transparent',
                      color: active ? '#ffffff' : THEME.text.body,
                      borderColor: active ? THEME.brand.primary : '#cbd5e1',
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Divider sx={{ my: 1.4 }} />

          <Box sx={{ mb: 1.3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="explainer-college-label" sx={{ fontSize: '0.76rem' }}>
                College
              </InputLabel>
              <Select
                labelId="explainer-college-label"
                label="College"
                value={filterCollege}
                onChange={(e) => onCollegeChange(e.target.value)}
                sx={{ fontSize: '0.76rem', borderRadius: '8px' }}
              >
                {ALL_COLLEGES.map((c) => (
                  <MenuItem key={c} value={c} sx={{ fontSize: '0.78rem' }}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="explainer-date-label" sx={{ fontSize: '0.76rem' }}>
                Period
              </InputLabel>
              <Select
                labelId="explainer-date-label"
                label="Period"
                value={datePreset}
                onChange={(e) => {
                  onDatePresetChange(e.target.value);
                  onCustomStartDateChange('');
                  onCustomEndDateChange('');
                }}
                sx={{ fontSize: '0.76rem', borderRadius: '8px' }}
              >
                {DATE_PRESETS.map((p) => (
                  <MenuItem key={p} value={p} sx={{ fontSize: '0.78rem' }}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <TextField
              size="small"
              type="date"
              label="From"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              InputLabelProps={{ shrink: true, sx: { fontSize: '0.74rem' } }}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.74rem', borderRadius: '8px' } }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              InputLabelProps={{ shrink: true, sx: { fontSize: '0.74rem' } }}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.74rem', borderRadius: '8px' } }}
            />
          </Box>
        </Popover>

        {/* Calm Inbox-Style Scrollable List (Hairline Dividers, Minimal Color Dots) */}
        <Box
          sx={{
            flex: 1,
            minHeight: 240,
            maxHeight: { xs: 360, md: 'calc(100vh - 280px)' },
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '5px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '6px',
            },
          }}
        >
          {isFetchingSurveys ? (
            <Stack divider={<Divider />}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ px: 1.8, py: 1.5 }}>
                  <Skeleton variant="text" width="42%" height={15} sx={{ mb: 0.4 }} />
                  <Skeleton variant="text" width="94%" height={16} />
                  <Skeleton variant="text" width="68%" height={16} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="50%" height={14} />
                </Box>
              ))}
            </Stack>
          ) : fetchError ? (
            <Box sx={{ p: 1.8 }}>
              <Alert
                severity="warning"
                sx={{ borderRadius: '10px', fontSize: '0.74rem' }}
                action={
                  <Button color="inherit" size="small" onClick={onRetryFetch} sx={{ fontSize: '0.7rem' }}>
                    Retry
                  </Button>
                }
              >
                {fetchError}
              </Alert>
            </Box>
          ) : paginatedComments.length > 0 ? (
            <Stack divider={<Divider sx={{ borderColor: '#f1f5f9' }} />}>
              {paginatedComments.map((survey) => {
                const sId = survey.Id || survey.id;
                const isSelected = selectedSurveyId === sId;
                const sentStyle = getSentimentStyle(survey.SentimentResult);
                const catLabel =
                  survey.Category === 'Other/Uncategorized'
                    ? 'Other'
                    : survey.Category || 'Other';

                return (
                  <ButtonBase
                    key={sId}
                    onClick={() => onSelectSurvey(survey)}
                    aria-pressed={isSelected}
                    sx={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'block',
                      px: 1.8,
                      py: 1.45,
                      bgcolor: isSelected ? THEME.brand.blueLight : 'transparent',
                      borderLeft: isSelected
                        ? `3px solid ${THEME.brand.primary}`
                        : '3px solid transparent',
                      transition: 'background-color 0.14s ease',
                      '&:hover': {
                        bgcolor: isSelected ? '#e3eef8' : THEME.surface.cardAlt,
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${THEME.brand.primary}`,
                        outlineOffset: '-2px',
                      },
                    }}
                  >
                    {/* Top muted metadata */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.45,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? THEME.brand.primary : THEME.text.secondary,
                        }}
                        noWrap
                      >
                        #{sId} · {survey.College || 'General'}
                      </Typography>

                      <Typography sx={{ fontSize: '0.65rem', color: THEME.text.faint, flexShrink: 0 }}>
                        {survey.DateSubmitted
                          ? new Date(survey.DateSubmitted).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </Typography>
                    </Box>

                    {/* Primary 2-line quote preview */}
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        color: isSelected ? THEME.text.primary : '#334155',
                        fontWeight: isSelected ? 600 : 400,
                        lineHeight: 1.45,
                        mb: 0.7,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {survey.Message}
                    </Typography>

                    {/* Quiet footer: semantic dot + muted category */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: sentStyle.solid,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.69rem',
                            fontWeight: 600,
                            color: THEME.text.body,
                          }}
                        >
                          {survey.SentimentResult || 'Neutral'}
                        </Typography>
                      </Box>

                      <Typography sx={{ fontSize: '0.68rem', color: '#cbd5e1' }}>·</Typography>

                      <Typography sx={{ fontSize: '0.69rem', fontWeight: 500, color: THEME.text.secondary }} noWrap>
                        {catLabel}
                      </Typography>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ py: 5, px: 2, textAlign: 'center' }}>
              <InboxIcon aria-hidden="true" sx={{ fontSize: 28, color: '#cbd5e1', mb: 0.6 }} />
              <Typography sx={{ color: THEME.text.secondary, fontSize: '0.78rem', fontWeight: 500 }}>
                No matching comments
              </Typography>
              {hasAnyFilter && (
                <Button
                  size="small"
                  onClick={onClearAllFilters}
                  sx={{ mt: 0.8, fontSize: '0.72rem', color: THEME.brand.primary }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Minimal Footer Pagination */}
        {filteredComments.length > rowsPerPage && (
          <Box
            sx={{
              py: 1.1,
              px: 1.5,
              borderTop: `1px solid ${THEME.surface.borderLight}`,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Pagination
              count={Math.ceil(filteredComments.length / rowsPerPage)}
              page={tablePage}
              onChange={(e, p) => onPageChange(p)}
              size="small"
              color="primary"
              siblingCount={0}
              sx={{
                '& .MuiPaginationItem-root': { fontSize: '0.72rem', fontWeight: 600 },
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
