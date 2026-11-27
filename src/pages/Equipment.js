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
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { useNavigate } from 'react-router-dom';
import { getTransactions } from '../api/equipmentApi';
import {
  InventoryPageShell,
  InventoryKpiStrip,
  ModernTablePagination,
  HeroTableTitle,
  CoralSwitch,
  ArchivedItemCell,
  INVENTORY_FONT,
  INVENTORY_MONO_FONT,
  INVENTORY_COLORS,
  inventoryHeroTableCardSx,
  inventoryHeroTableHeaderSx,
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
        subtext: 'Matched in view',
        badge: `${filtered.length} shown`,
        tone: 'indigo',
        hint: 'Recorded equipment transfers and asset releases',
      },
      {
        label: 'Units Released',
        value: totalUnits.toLocaleString(),
        subtext: 'Current view total',
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
            {/* Compact Top Utility Row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontFamily: INVENTORY_FONT,
                    fontSize: 13,
                    fontWeight: 500,
                    color: INVENTORY_COLORS.textSecondary,
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

              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 17 }} />}
                onClick={() => navigate('/equipment-encoding')}
                sx={inventoryPrimaryBtnSx}
              >
                Encode Equipment
              </Button>
            </Box>

            {/* Compact Supporting 4-Column KPI Strip */}
            <Collapse in={showStats}>
              <InventoryKpiStrip stats={kpiStats} />
            </Collapse>

            {/* HERO SPOTLIGHT: Equipment Acquisition & Release Table Card */}
            <Paper elevation={0} sx={inventoryHeroTableCardSx}>
              <Box sx={inventoryHeroTableHeaderSx}>
                <HeroTableTitle
                  icon={AssignmentOutlinedIcon}
                  title="Records of Acquisition"
                  subtitle="Equipment releases, control numbers, and destination tracking"
                  countLabel={
                    hasActiveFilters
                      ? `${filtered.length} of ${records.length} records`
                      : `${records.length} ${records.length === 1 ? 'record' : 'records'}`
                  }
                />

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    width: { xs: '100%', xl: 'auto' },
                  }}
                >
                  <TextField
                    size="small"
                    placeholder="Search item, control #, destination, staff..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{
                      ...inventoryFieldSx,
                      minWidth: { xs: '100%', sm: 330, md: 370 },
                      flex: { xs: '1 1 100%', sm: '1 1 330px', xl: '0 0 auto' },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: INVENTORY_COLORS.textMuted }} />
                        </InputAdornment>
                      ),
                      endAdornment: search && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Clear search"
                            onClick={() => { setSearch(''); setPage(0); }}
                          >
                            <ClearIcon sx={{ fontSize: 16, color: INVENTORY_COLORS.textMuted }} />
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
                      minWidth: { xs: '100%', sm: 205 },
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
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 9 }}>
                  <CircularProgress size={34} sx={{ color: INVENTORY_COLORS.accent }} />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ py: 9, px: 3, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontWeight: 600,
                      fontSize: 15,
                      color: INVENTORY_COLORS.textStrong,
                    }}
                  >
                    {hasActiveFilters ? 'No matching release records found' : 'No release records found'}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontSize: 13.5,
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
                  <Table>
                    <TableHead>
                      <TableRow sx={inventoryTableHeadRowSx}>
                        <TableCell sx={{ width: 160 }}>Date Released</TableCell>
                        <TableCell sx={{ width: 170 }}>Control Number</TableCell>
                        <TableCell align="center" sx={{ width: 90 }}>Qty</TableCell>
                        <TableCell>Item/s</TableCell>
                        <TableCell sx={{ width: 190 }}>Destination</TableCell>
                        <TableCell sx={{ width: 165 }}>Taken By</TableCell>
                        <TableCell sx={{ width: 160 }}>Released By</TableCell>
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
                                  fontSize: 14.5,
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
                                    fontSize: 12,
                                    color: INVENTORY_COLORS.textSecondary,
                                    lineHeight: 1.3,
                                    mt: 0.2,
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
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    color: INVENTORY_COLORS.textStrong,
                                    backgroundColor: INVENTORY_COLORS.neutralBg,
                                    borderRadius: '6px',
                                    px: 1.15,
                                    py: 0.35,
                                    letterSpacing: '0.01em',
                                  }}
                                >
                                  {r.control_number}
                                </Box>
                              ) : (
                                <Typography
                                  component="span"
                                  sx={{ fontFamily: INVENTORY_FONT, fontSize: 14, color: INVENTORY_COLORS.textMuted }}
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                fontSize: '15px !important',
                                fontWeight: 700,
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
                                    fontSize: 15,
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
                                    height: 26,
                                    borderRadius: '6px',
                                    fontFamily: INVENTORY_FONT,
                                    fontSize: 12.5,
                                    fontWeight: 500,
                                    backgroundColor: INVENTORY_COLORS.inStockBg,
                                    color: INVENTORY_COLORS.inStockText,
                                    '& .MuiChip-label': { px: 1.2 },
                                  }}
                                />
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{r.taken_by || '—'}</TableCell>
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
