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
} from '@mui/material';
import {
  Comment as CommentIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
  Refresh as RefreshIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { THEME, cardShellSx } from '../../constants/themeTokens';
import { COLLEGE_OPTIONS } from '../../constants/sentimentConstants';
import {
  DATE_PRESETS,
  CATEGORY_FILTER_OPTIONS,
  getSentimentStyle,
  getCategoryStyle,
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
      label: `Cat: ${filterCategory}`,
      onDelete: () => onCategoryChange('All'),
    });
  }
  if (filterSentiment !== 'All') {
    activeChips.push({
      key: 'sentiment',
      label: `Sent: ${filterSentiment}`,
      onDelete: () => onSentimentChange('All'),
    });
  }
  if (filterCollege !== 'All') {
    activeChips.push({
      key: 'college',
      label: `College: ${filterCollege}`,
      onDelete: () => onCollegeChange('All'),
    });
  }
  if (customStartDate || customEndDate) {
    activeChips.push({
      key: 'customDate',
      label: `${customStartDate || '...'} → ${customEndDate || '...'}`,
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
          ...cardShellSx,
          p: { xs: 1.8, md: 2 },
          display: 'flex',
          flexDirection: 'column',
          maxHeight: { md: 'calc(100vh - 124px)' },
        }}
      >
        {/* Directory Title & Record Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
            <CommentIcon aria-hidden="true" sx={{ color: THEME.brand.primary, fontSize: 19 }} />
            <Typography sx={{ fontWeight: 800, fontSize: 14.5, color: THEME.text.primary }}>
              Patron Feedback
            </Typography>
          </Box>
          <Chip
            label={
              hasAnyFilter
                ? `${filteredComments.length} / ${totalCommentsCount}`
                : `${filteredComments.length} Records`
            }
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
              bgcolor: THEME.brand.blueLight,
              color: THEME.brand.primary,
              border: `1px solid ${THEME.brand.blueBorder}`,
            }}
          />
        </Box>

        {/* Always-visible Search + Compact Filter Popover Trigger */}
        <Box sx={{ display: 'flex', gap: 0.9, mb: activeChips.length > 0 ? 1 : 1.4 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search text, college, or #ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            inputProps={{ 'aria-label': 'Search patron feedback records' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon aria-hidden="true" sx={{ color: THEME.text.faint, fontSize: 18 }} />
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
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: THEME.surface.cardAlt,
                fontSize: '0.8rem',
                '& fieldset': { borderColor: THEME.surface.borderLight },
                '&:hover fieldset': { borderColor: THEME.surface.borderHover },
                '&.Mui-focused fieldset': { borderColor: THEME.brand.primary, borderWidth: '1.5px' },
              },
            }}
          />

          <Button
            variant="outlined"
            size="small"
            aria-label="Open record filters"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            sx={{
              minWidth: 44,
              px: 1.3,
              borderRadius: '10px',
              borderColor: secondaryFilterCount > 0 ? THEME.brand.primary : THEME.surface.borderLight,
              borderWidth: '1.5px',
              bgcolor: secondaryFilterCount > 0 ? THEME.brand.blueLight : THEME.surface.cardAlt,
              color: THEME.brand.primary,
              flexShrink: 0,
              '&:hover': {
                borderColor: THEME.brand.primary,
                borderWidth: '1.5px',
                bgcolor: THEME.brand.blueLight,
              },
            }}
          >
            <Badge
              badgeContent={secondaryFilterCount}
              color="secondary"
              sx={{
                '& .MuiBadge-badge': {
                  fontWeight: 800,
                  fontSize: '0.62rem',
                  color: '#ffffff',
                },
              }}
            >
              <TuneIcon sx={{ fontSize: 18 }} />
            </Badge>
          </Button>
        </Box>

        {/* Visible Active Filter Chips */}
        {activeChips.length > 0 && (
          <Stack
            direction="row"
            spacing={0.6}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
            sx={{ mb: 1.3 }}
          >
            {activeChips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                size="small"
                onDelete={chip.onDelete}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: THEME.brand.blueLight,
                  color: THEME.brand.primary,
                  border: `1px solid ${THEME.brand.blueBorder}`,
                  '& .MuiChip-deleteIcon': { fontSize: 14, color: THEME.text.secondary },
                }}
              />
            ))}
            <Button
              size="small"
              onClick={onClearAllFilters}
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: THEME.status.errorText,
                minWidth: 0,
                px: 0.6,
                py: 0.2,
              }}
            >
              Clear all
            </Button>
          </Stack>
        )}

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
                borderRadius: '14px',
                border: `1.5px solid ${THEME.surface.border}`,
                boxShadow: THEME.shadow.elevated,
                width: { xs: 300, sm: 340 },
                p: 2,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.4 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: THEME.text.primary }}>
              Filter Directory
            </Typography>
            {hasAnyFilter && (
              <Button
                size="small"
                onClick={onClearAllFilters}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: THEME.status.errorText,
                  minWidth: 0,
                  p: 0,
                }}
              >
                Reset filters
              </Button>
            )}
          </Box>

          {/* Category filter chips (now includes Other/Uncategorized) */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: THEME.text.secondary,
                textTransform: 'uppercase',
                mb: 0.6,
                letterSpacing: 0.4,
              }}
            >
              Stored Category
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
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: active ? THEME.brand.primary : 'transparent',
                      color: active ? '#ffffff' : THEME.text.body,
                      borderColor: active ? THEME.brand.primary : '#cbd5e1',
                      '&:hover': {
                        bgcolor: active ? THEME.brand.primaryHover : THEME.surface.cardAlt,
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Sentiment filter chips */}
          <Box sx={{ mb: 1.6 }}>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: THEME.text.secondary,
                textTransform: 'uppercase',
                mb: 0.6,
                letterSpacing: 0.4,
              }}
            >
              Stored Sentiment
            </Typography>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              {['All', 'Positive', 'Neutral', 'Negative'].map((s) => {
                const active = filterSentiment === s;
                const activeBg =
                  s === 'Positive'
                    ? THEME.status.success
                    : s === 'Negative'
                      ? THEME.status.errorHover
                      : THEME.brand.primary;
                return (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    clickable
                    onClick={() => onSentimentChange(s)}
                    variant={active ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: active ? activeBg : 'transparent',
                      color: active ? '#ffffff' : THEME.text.body,
                      borderColor: active ? activeBg : '#cbd5e1',
                      '&:hover': {
                        bgcolor: active ? activeBg : THEME.surface.cardAlt,
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Divider sx={{ my: 1.4 }} />

          {/* College & Date preset */}
          <Box sx={{ mb: 1.4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="explainer-college-label" sx={{ fontSize: '0.78rem' }}>
                College
              </InputLabel>
              <Select
                labelId="explainer-college-label"
                label="College"
                value={filterCollege}
                onChange={(e) => onCollegeChange(e.target.value)}
                sx={{ fontSize: '0.78rem', bgcolor: THEME.surface.cardAlt, borderRadius: '10px' }}
              >
                {ALL_COLLEGES.map((c) => (
                  <MenuItem key={c} value={c} sx={{ fontSize: '0.8rem' }}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="explainer-date-label" sx={{ fontSize: '0.78rem' }}>
                Date Range
              </InputLabel>
              <Select
                labelId="explainer-date-label"
                label="Date Range"
                value={datePreset}
                onChange={(e) => {
                  onDatePresetChange(e.target.value);
                  onCustomStartDateChange('');
                  onCustomEndDateChange('');
                }}
                sx={{ fontSize: '0.78rem', bgcolor: THEME.surface.cardAlt, borderRadius: '10px' }}
              >
                {DATE_PRESETS.map((p) => (
                  <MenuItem key={p} value={p} sx={{ fontSize: '0.8rem' }}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Custom Date Range Override */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              InputLabelProps={{ shrink: true, sx: { fontSize: '0.76rem' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.76rem',
                  bgcolor: THEME.surface.cardAlt,
                  borderRadius: '10px',
                },
              }}
            />
            <TextField
              size="small"
              type="date"
              label="End Date"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              InputLabelProps={{ shrink: true, sx: { fontSize: '0.76rem' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.76rem',
                  bgcolor: THEME.surface.cardAlt,
                  borderRadius: '10px',
                },
              }}
            />
          </Box>
        </Popover>

        {/* Scrollable Record List */}
        <Box
          sx={{
            flex: 1,
            minHeight: 280,
            maxHeight: { xs: 420, md: 'calc(100vh - 285px)' },
            overflowY: 'auto',
            pr: 0.4,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: '#f1f5f9', borderRadius: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '6px',
              '&:hover': { background: '#94a3b8' },
            },
          }}
        >
          {isFetchingSurveys ? (
            <Stack spacing={1.1}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{ p: 1.4, borderRadius: '12px', borderColor: THEME.surface.borderLight }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Skeleton variant="text" width="48%" height={18} />
                    <Skeleton variant="rounded" width={46} height={18} />
                  </Box>
                  <Skeleton variant="text" width="95%" height={16} />
                  <Skeleton variant="text" width="72%" height={16} sx={{ mb: 0.8 }} />
                  <Box sx={{ display: 'flex', gap: 0.8 }}>
                    <Skeleton variant="rounded" width={64} height={20} />
                    <Skeleton variant="rounded" width={64} height={20} />
                  </Box>
                </Paper>
              ))}
            </Stack>
          ) : fetchError ? (
            <Alert
              severity="warning"
              sx={{ borderRadius: '12px', fontSize: '0.76rem', alignItems: 'center' }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
                  onClick={onRetryFetch}
                  sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Retry
                </Button>
              }
            >
              {fetchError} You can still test custom statements using the What-If editor.
            </Alert>
          ) : paginatedComments.length > 0 ? (
            <Stack spacing={1}>
              {paginatedComments.map((survey) => {
                const sId = survey.Id || survey.id;
                const isSelected = selectedSurveyId === sId;
                const sentStyle = getSentimentStyle(survey.SentimentResult);
                const catStyle = getCategoryStyle(survey.Category);

                return (
                  <ButtonBase
                    key={sId}
                    onClick={() => onSelectSurvey(survey)}
                    aria-pressed={isSelected}
                    sx={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'block',
                      p: 1.35,
                      borderRadius: '12px',
                      bgcolor: isSelected ? THEME.brand.blueLight : THEME.surface.card,
                      border: '1.5px solid',
                      borderColor: isSelected ? THEME.brand.primary : THEME.surface.borderLight,
                      borderLeft: isSelected
                        ? `4px solid ${THEME.brand.primary}`
                        : `4px solid transparent`,
                      boxShadow: isSelected ? '0 3px 10px rgba(22, 50, 79, 0.1)' : 'none',
                      transition: 'background-color 0.15s ease, border-color 0.15s ease',
                      '&:hover': {
                        borderColor: isSelected ? THEME.brand.primary : THEME.surface.borderHover,
                        bgcolor: isSelected ? '#e3eef8' : THEME.surface.cardAlt,
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${THEME.brand.accent}`,
                        outlineOffset: '1px',
                      },
                    }}
                  >
                    {/* Header row */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 0.8,
                        mb: 0.55,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.76rem',
                            color: THEME.brand.primary,
                            flexShrink: 0,
                          }}
                        >
                          #{sId}
                        </Typography>
                        <Chip
                          label={survey.Clientele || 'Patron'}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            bgcolor: isSelected ? '#ffffff' : '#f1f5f9',
                            color: THEME.text.body,
                            border: `1px solid ${THEME.surface.borderLight}`,
                          }}
                        />
                        <Typography
                          sx={{ fontSize: '0.68rem', color: THEME.text.secondary, fontWeight: 500 }}
                          noWrap
                        >
                          {survey.College || 'General'}
                        </Typography>
                      </Box>

                      {isSelected && (
                        <Chip
                          label="Inspecting"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            bgcolor: THEME.brand.primary,
                            color: '#ffffff',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>

                    {/* Message preview */}
                    <Typography
                      sx={{
                        fontSize: '0.79rem',
                        color: '#1e293b',
                        fontWeight: isSelected ? 600 : 400,
                        lineHeight: 1.4,
                        mb: 0.75,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      &ldquo;{survey.Message}&rdquo;
                    </Typography>

                    {/* Footer tags & date */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 0.8,
                      }}
                    >
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        <Chip
                          label={
                            survey.Category === 'Other/Uncategorized'
                              ? 'Other'
                              : survey.Category || 'Other'
                          }
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.63rem',
                            fontWeight: 700,
                            bgcolor: catStyle.bg,
                            color: catStyle.text,
                            border: `1px solid ${catStyle.border}`,
                          }}
                        />
                        <Chip
                          label={survey.SentimentResult || 'Neutral'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.63rem',
                            fontWeight: 700,
                            bgcolor: sentStyle.bg,
                            color: sentStyle.text,
                            border: `1px solid ${sentStyle.border}`,
                          }}
                        />
                      </Stack>

                      <Typography sx={{ fontSize: '0.64rem', color: THEME.text.faint, flexShrink: 0 }}>
                        {survey.DateSubmitted
                          ? new Date(survey.DateSubmitted).toLocaleDateString()
                          : ''}
                      </Typography>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ py: 5, px: 2, textAlign: 'center' }}>
              <InboxIcon aria-hidden="true" sx={{ fontSize: 34, color: '#cbd5e1', mb: 0.8 }} />
              <Typography sx={{ color: THEME.text.secondary, fontSize: '0.82rem', fontWeight: 600 }}>
                No patron comments matched.
              </Typography>
              {hasAnyFilter && (
                <Button
                  size="small"
                  onClick={onClearAllFilters}
                  sx={{ mt: 1, fontSize: '0.74rem', fontWeight: 700, color: THEME.brand.primary }}
                >
                  Clear active filters
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Pagination */}
        {filteredComments.length > rowsPerPage && (
          <Box
            sx={{
              pt: 1.4,
              mt: 1,
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
                '& .MuiPaginationItem-root': {
                  fontSize: '0.74rem',
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
