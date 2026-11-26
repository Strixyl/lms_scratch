import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, MenuItem, Button,
  InputAdornment, CircularProgress, TablePagination, Chip, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import { useNavigate } from 'react-router-dom';
import { getTransactions } from '../api/equipmentApi';
import {
  InventoryPageShell,
  ArchivedItemCell,
  INVENTORY_FONT,
  INVENTORY_MONO_FONT,
  INVENTORY_COLORS,
  inventoryCardSx,
  inventoryCardHeaderSx,
  inventoryFieldSx,
  inventoryMenuItemSx,
  inventoryNavBtnSx,
  inventoryTableHeadRowSx,
  inventoryTableRowSx,
  inventoryPaginationSx,
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

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const hasActiveFilters = Boolean(search.trim()) || destinationFilter !== 'All';

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Library Equipment" onMenuClick={toggleDrawer} subtitle="RECORDS OF ACQUISITION" />
          <InventoryPageShell
            breadcrumb="Inventory / Library Equipment"
            title="Library Equipment"
            userLabel={loggedInUser}
            actions={
              <Button
                variant="outlined"
                startIcon={<DevicesOutlinedIcon sx={{ fontSize: 17 }} />}
                onClick={() => navigate('/equipment-encoding')}
                sx={inventoryNavBtnSx}
              >
                Equipment Encoding
              </Button>
            }
          >
            <Paper elevation={0} sx={inventoryCardSx}>
              {/* Card Toolbar Header */}
              <Box sx={inventoryCardHeaderSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontWeight: 700,
                      fontSize: 16,
                      color: INVENTORY_COLORS.primary,
                    }}
                  >
                    Records of Acquisition
                  </Typography>
                  <Chip
                    label={
                      hasActiveFilters
                        ? `${filtered.length} of ${records.length} records`
                        : `${records.length} ${records.length === 1 ? 'record' : 'records'}`
                    }
                    size="small"
                    sx={{
                      height: 24,
                      fontFamily: INVENTORY_FONT,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: INVENTORY_COLORS.primaryTint,
                      color: INVENTORY_COLORS.primary,
                      border: `1px solid ${INVENTORY_COLORS.primaryBorder}`,
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    width: { xs: '100%', md: 'auto' },
                  }}
                >
                  <TextField
                    size="small"
                    placeholder="Search item, control #, destination, staff..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{
                      ...inventoryFieldSx,
                      minWidth: { xs: '100%', sm: 350, md: 390 },
                      flex: { xs: '1 1 100%', sm: '1 1 350px', md: '0 0 auto' },
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
                      minWidth: { xs: '100%', sm: 210 },
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
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
                  <CircularProgress size={32} sx={{ color: INVENTORY_COLORS.primary }} />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ py: 7, px: 3, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontWeight: 600,
                      fontSize: 14.5,
                      color: INVENTORY_COLORS.textBody,
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
                        <TableCell sx={{ width: 150 }}>Date Released</TableCell>
                        <TableCell sx={{ width: 160 }}>Control Number</TableCell>
                        <TableCell align="center" sx={{ width: 84 }}>Qty</TableCell>
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
                                    color: INVENTORY_COLORS.primary,
                                    backgroundColor: '#F1F5F9',
                                    border: `1px solid ${INVENTORY_COLORS.border}`,
                                    borderRadius: '6px',
                                    px: 1.1,
                                    py: 0.3,
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

                            <TableCell>{r.destination_section || '—'}</TableCell>
                            <TableCell>{r.taken_by || '—'}</TableCell>
                            <TableCell>{r.created_by || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[15, 25, 50]}
                sx={inventoryPaginationSx}
              />
            </Paper>
          </InventoryPageShell>
        </>
      )}
    </Header>
  );
};

export default Equipment;
