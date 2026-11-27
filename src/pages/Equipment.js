import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, MenuItem, Button,
  InputAdornment, CircularProgress, Chip, IconButton, Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { getTransactions } from '../api/equipmentApi';
import {
  InventoryPageShell,
  InventoryKpiStrip,
  ModernTablePagination,
  CoralSwitch,
  ArchivedItemCell,
  INVENTORY_FONT,
  INVENTORY_MONO_FONT,
  INVENTORY_COLORS,
  inventoryCardSx,
  inventoryCardHeaderSx,
  inventoryFieldSx,
  inventoryMenuItemSx,
  inventoryPrimaryBtnSx,
  inventoryTableHeadRowSx,
  inventoryTableRowSx,
  formatDateParts,
  isDeletedItemName,
} from '../Components/InventoryLayout';

const RELEASE_ACTION_TYPES = ['LOCATION_TRANSFER', 'Sent Asset'];

const Equipment = () => {
  const navigate = useNavigate();
  const [loggedInUser] = useState(() => localStorage.getItem('equipmentUser') || '');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('All');
  const [showStats, setShowStats] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      const releases = (Array.isArray(data) ? data : []).filter((t) =>
        RELEASE_ACTION_TYPES.includes(t.action_type)
      );
      setRecords(releases);
    } catch (err) {
      console.error('Error fetching equipment release records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // Populate Destination filter dynamically from existing records
  const destinationOptions = useMemo(() => {
    const unique = new Set();
    records.forEach((r) => {
      const dest = (r.destination_section || '').trim();
      if (dest) unique.add(dest);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const dest = (r.destination_section || '').trim();
      const matchesDest = destinationFilter === 'All' || dest === destinationFilter;
      if (!matchesDest) return false;
      if (!q) return true;
      const archivedMatch = isDeletedItemName(r.asset_name) && 'archived deleted'.includes(q);
      return (
        archivedMatch ||
        (r.asset_name || '').toLowerCase().includes(q) ||
        (r.control_number || '').toLowerCase().includes(q) ||
        dest.toLowerCase().includes(q) ||
        (r.taken_by || '').toLowerCase().includes(q) ||
        (r.created_by || '').toLowerCase().includes(q)
      );
    });
  }, [records, search, destinationFilter]);

  const kpiStats = useMemo(() => {
    const totalUnits = records.reduce((acc, r) => acc + Math.abs(Number(r.quantity_changed) || 0), 0);
    const filteredUnits = filtered.reduce((acc, r) => acc + Math.abs(Number(r.quantity_changed) || 0), 0);
    const uniqueAssets = new Set(
      records.map((r) => (r.asset_name || '').trim()).filter((n) => n && !isDeletedItemName(n))
    ).size;
    const latestDate = records.length > 0 ? formatDateParts(records[0].created_at).date : '—';

    return [
      {
        label: 'Total Releases',
        value: records.length.toLocaleString(),
        subtext: 'Showing',
        badge: `${filtered.length} matched`,
        tone: 'indigo',
        hint: 'Recorded equipment transfers and asset releases',
      },
      {
        label: 'Units Released',
        value: totalUnits.toLocaleString(),
        subtext: 'Current view',
        badge: `${filteredUnits.toLocaleString()} units`,
        tone: 'positive',
        hint: 'Sum of equipment units released across records',
      },
      {
        label: 'Destinations',
        value: destinationOptions.length.toLocaleString(),
        subtext: `${uniqueAssets} unique items`,
        badge: 'Active',
        tone: 'neutral',
        hint: 'Distinct library sections that received equipment',
      },
      {
        label: 'Latest Release',
        value: latestDate,
        subtext: 'Most recent log',
        badge: records[0]?.control_number || 'Recorded',
        tone: 'neutral',
        hint: 'Timestamp of the latest equipment release',
      },
    ];
  }, [records, filtered, destinationOptions]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const hasActiveFilters = Boolean(search.trim()) || destinationFilter !== 'All';

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Library Equipment" onMenuClick={toggleDrawer} subtitle="RECORDS OF ACQUISITION" />
          <InventoryPageShell
            title="Records of Acquisition"
            userLabel={loggedInUser}
          >
            {/* Reference-style Action Toolbar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: '1 1 auto' }}>
                <TextField
                  size="small"
                  placeholder="Search item, control #, destination, staff..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  sx={{
                    ...inventoryFieldSx,
                    minWidth: { xs: '100%', sm: 320, md: 350 },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 17, color: INVENTORY_COLORS.textMuted }} />
                      </InputAdornment>
                    ),
                    endAdornment: search && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="Clear search"
                          onClick={() => { setSearch(''); setPage(0); }}
                        >
                          <ClearIcon sx={{ fontSize: 15, color: INVENTORY_COLORS.textMuted }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  size="small"
                  select
                  label="Destination"
                  value={destinationFilter}
                  onChange={(e) => { setDestinationFilter(e.target.value); setPage(0); }}
                  sx={{
                    ...inventoryFieldSx,
                    minWidth: { xs: '100%', sm: 195 },
                  }}
                >
                  <MenuItem value="All" sx={inventoryMenuItemSx}>
                    All Destinations
                  </MenuItem>
                  {destinationOptions.map((dest) => (
                    <MenuItem key={dest} value={dest} sx={inventoryMenuItemSx}>
                      {dest}
                    </MenuItem>
                  ))}
                </TextField>

                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontSize: 13,
                      fontWeight: 500,
                      color: INVENTORY_COLORS.textBody,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Show Statistics
                  </Typography>
                  <CoralSwitch
                    checked={showStats}
                    onChange={(e) => setShowStats(e.target.checked)}
                    inputProps={{ 'aria-label': 'Show Statistics' }}
                  />
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 17 }} />}
                onClick={() => navigate('/equipment-encoding')}
                sx={inventoryPrimaryBtnSx}
              >
                Encode Equipment
              </Button>
            </Box>

            {/* Collapsible 4-Column KPI Stat Strip */}
            <Collapse in={showStats}>
              <InventoryKpiStrip stats={kpiStats} />
            </Collapse>

            {/* Table Card */}
            <Paper elevation={0} sx={inventoryCardSx}>
              <Box sx={inventoryCardHeaderSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontWeight: 600,
                      fontSize: 15,
                      color: INVENTORY_COLORS.textStrong,
                    }}
                  >
                    Acquisition & Release Log
                  </Typography>
                  <Chip
                    label={
                      hasActiveFilters
                        ? `${filtered.length} of ${records.length} records`
                        : `${records.length} ${records.length === 1 ? 'record' : 'records'}`
                    }
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: '6px',
                      fontFamily: INVENTORY_FONT,
                      fontSize: 11.5,
                      fontWeight: 600,
                      backgroundColor: INVENTORY_COLORS.neutralBg,
                      color: INVENTORY_COLORS.neutralText,
                    }}
                  />
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
                  <CircularProgress size={30} sx={{ color: INVENTORY_COLORS.accent }} />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ py: 7, px: 3, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontWeight: 600,
                      fontSize: 14,
                      color: INVENTORY_COLORS.textStrong,
                    }}
                  >
                    {hasActiveFilters ? 'No matching release records found' : 'No release records found'}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontSize: 13,
                      color: INVENTORY_COLORS.textSecondary,
                      mt: 0.5,
                    }}
                  >
                    {hasActiveFilters
                      ? 'Try clearing your search query or switching the destination filter.'
                      : 'Equipment releases and location transfers will appear here.'}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={inventoryTableHeadRowSx}>
                        <TableCell sx={{ width: 140 }}>Date Released</TableCell>
                        <TableCell sx={{ width: 150 }}>Control Number</TableCell>
                        <TableCell align="center" sx={{ width: 76 }}>Qty</TableCell>
                        <TableCell>Item/s</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Taken By</TableCell>
                        <TableCell>Released By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.map((r) => {
                        const dateParts = formatDateParts(r.created_at);
                        const deleted = isDeletedItemName(r.asset_name);

                        return (
                          <TableRow key={r.transaction_id} sx={inventoryTableRowSx}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography
                                sx={{
                                  fontFamily: INVENTORY_FONT,
                                  fontSize: 13.5,
                                  fontWeight: 500,
                                  color: INVENTORY_COLORS.textStrong,
                                  lineHeight: 1.3,
                                }}
                              >
                                {dateParts.date}
                              </Typography>
                              {dateParts.time && (
                                <Typography
                                  sx={{
                                    fontFamily: INVENTORY_FONT,
                                    fontSize: 11.5,
                                    color: INVENTORY_COLORS.textSecondary,
                                    lineHeight: 1.3,
                                    mt: 0.15,
                                  }}
                                >
                                  {dateParts.time}
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {r.control_number ? (
                                <Box
                                  component="span"
                                  sx={{
                                    display: 'inline-block',
                                    fontFamily: INVENTORY_MONO_FONT,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: INVENTORY_COLORS.textStrong,
                                    backgroundColor: INVENTORY_COLORS.neutralBg,
                                    borderRadius: '6px',
                                    px: 1,
                                    py: 0.25,
                                    letterSpacing: '0.01em',
                                  }}
                                >
                                  {r.control_number}
                                </Box>
                              ) : (
                                <Typography
                                  component="span"
                                  sx={{ fontFamily: INVENTORY_FONT, fontSize: 13, color: INVENTORY_COLORS.textMuted }}
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 600,
                                color: INVENTORY_COLORS.textStrong,
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {Math.abs(Number(r.quantity_changed) || 0)}
                            </TableCell>

                            <TableCell>
                              {deleted ? (
                                <ArchivedItemCell label="Deleted item" />
                              ) : (
                                <Typography
                                  component="span"
                                  sx={{
                                    fontFamily: INVENTORY_FONT,
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    color: INVENTORY_COLORS.textStrong,
                                  }}
                                >
                                  {r.asset_name}
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell>
                              {r.destination_section ? (
                                <Chip
                                  label={r.destination_section}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    borderRadius: '6px',
                                    fontFamily: INVENTORY_FONT,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    backgroundColor: INVENTORY_COLORS.inStockBg,
                                    color: INVENTORY_COLORS.inStockText,
                                    '& .MuiChip-label': { px: 1 },
                                  }}
                                />
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell>{r.taken_by || '—'}</TableCell>
                            <TableCell>{r.created_by || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <ModernTablePagination
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[15, 25, 50]}
              />
            </Paper>
          </InventoryPageShell>
        </>
      )}
    </Header>
  );
};

export default Equipment;
