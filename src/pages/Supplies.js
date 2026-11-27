import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, MenuItem,
  InputAdornment, CircularProgress, Snackbar, Alert,
  IconButton, Chip, Divider, Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useNavigate } from 'react-router-dom';
import { LOW_STOCK_THRESHOLD } from '../constants/equipmentConstants';
import { getSupplies, getSupplyTransactions, disburseSupply } from '../api/suppliesApi';
import {
  InventoryPageShell,
  InventoryKpiStrip,
  ModernTablePagination,
  CoralSwitch,
  ArchivedItemCell,
  INVENTORY_FONT,
  INVENTORY_COLORS,
  inventoryCardSx,
  inventoryCardHeaderSx,
  inventoryFieldSx,
  inventoryReadOnlyFieldSx,
  inventoryMenuItemSx,
  inventoryPrimaryBtnSx,
  inventorySecondaryBtnSx,
  inventoryNavBtnSx,
  inventoryTableHeadRowSx,
  inventoryTableRowSx,
  formatUnitShort,
  formatDateParts,
  isDeletedItemName,
} from '../Components/InventoryLayout';

const SECTION_OPTIONS = [
  'Library Office', 'Technical', 'Reference', 'KDC', 'Circulation',
  'Theology', 'Filipiniana', 'American Corner', 'Law', 'Archives',
  'Graduate Studies', 'Cyber'
];

const createEmptyDisbursementForm = (releasedByDefault = '') => ({
  section: '',
  itemName: '',
  quantity: '',
  brand: '',
  unit: '',
  specifications: '',
  dateDisbursed: new Date().toISOString().split('T')[0],
  recipient: '',
  releasedBy: releasedByDefault,
});

const Supplies = () => {
  const navigate = useNavigate();
  const [loggedInUser] = useState(() => localStorage.getItem('suppliesUser') || 'Admin');
  const [records, setRecords] = useState([]);
  const [suppliesList, setSuppliesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [showStats, setShowStats] = useState(true);
  const [showForm, setShowForm] = useState(true);

  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [disburseForm, setDisburseForm] = useState(() => createEmptyDisbursementForm(loggedInUser));
  const [disburseErrors, setDisburseErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableQuantity, setAvailableQuantity] = useState(0);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [transactions, supplies] = await Promise.all([
        getSupplyTransactions(),
        getSupplies(),
      ]);
      const disbursed = (Array.isArray(transactions) ? transactions : [])
        .filter((t) => t.action_type === 'Disbursed');
      setRecords(disbursed);
      setSuppliesList(Array.isArray(supplies) ? supplies : []);
    } catch (err) {
      console.error('Error fetching supply records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const selectedSupply = useMemo(
    () => suppliesList.find((s) => String(s.Id) === String(selectedSupplyId)) || null,
    [suppliesList, selectedSupplyId]
  );

  // Lookup unit for disbursed rows when backend transactions do not include unit directly
  const unitBySupplyName = useMemo(() => {
    const unitSets = {};
    suppliesList.forEach((s) => {
      const key = (s.ItemName || '').trim().toLowerCase();
      if (!key) return;
      if (!unitSets[key]) unitSets[key] = new Set();
      if (s.Unit) unitSets[key].add(s.Unit.trim());
    });
    const resolved = {};
    Object.entries(unitSets).forEach(([key, set]) => {
      if (set.size === 1) resolved[key] = Array.from(set)[0];
    });
    return resolved;
  }, [suppliesList]);

  const kpiStats = useMemo(() => {
    const totalStockUnits = suppliesList.reduce((acc, s) => acc + (Number(s.Quantity) || 0), 0);
    const totalDisbursedQty = records.reduce((acc, r) => acc + Math.abs(Number(r.quantity_changed) || 0), 0);
    const uniqueSections = new Set(records.map((r) => (r.destination_section || '').trim()).filter(Boolean)).size;
    const lowStockCount = suppliesList.filter((s) => (Number(s.Quantity) || 0) <= LOW_STOCK_THRESHOLD).length;

    return [
      {
        label: 'Encoded Supplies',
        value: suppliesList.length.toLocaleString(),
        subtext: 'Current stock',
        badge: `${totalStockUnits.toLocaleString()} units`,
        tone: 'indigo',
        hint: 'Active supply SKUs available for disbursement',
      },
      {
        label: 'Disbursements',
        value: records.length.toLocaleString(),
        subtext: 'Total released',
        badge: `${totalDisbursedQty.toLocaleString()} units`,
        tone: 'positive',
        hint: 'Recorded office supply disbursement transactions',
      },
      {
        label: 'Sections Served',
        value: uniqueSections.toLocaleString(),
        subtext: 'Departments',
        badge: 'Active',
        tone: 'neutral',
        hint: 'Distinct library sections that received supplies',
      },
      {
        label: 'Low / Out of Stock',
        value: lowStockCount.toLocaleString(),
        subtext: `Threshold ≤ ${LOW_STOCK_THRESHOLD}`,
        badge: lowStockCount > 0 ? 'Restock' : 'Healthy',
        tone: lowStockCount > 0 ? 'warning' : 'positive',
        hint: 'Items requiring replenishment soon',
      },
    ];
  }, [suppliesList, records]);

  const handleSelectItem = (e) => {
    const idVal = e.target.value;
    setSelectedSupplyId(idVal);
    const chosen = suppliesList.find((s) => String(s.Id) === String(idVal));
    if (chosen) {
      setDisburseForm((prev) => ({
        ...prev,
        itemName: chosen.ItemName || '',
        brand: chosen.Brand || '',
        unit: chosen.Unit || 'Pieces',
        specifications: chosen.Specifications || '',
        quantity: '',
      }));
      setAvailableQuantity(Number(chosen.Quantity) || 0);
    } else {
      setDisburseForm((prev) => ({
        ...prev,
        itemName: '',
        brand: '',
        unit: '',
        specifications: '',
        quantity: '',
      }));
      setAvailableQuantity(0);
    }
    setDisburseErrors((prev) => ({ ...prev, itemName: '', quantity: '' }));
  };

  const handleDisburseChange = (e) => {
    const { name, value } = e.target;
    setDisburseForm((prev) => ({ ...prev, [name]: value }));
    if (disburseErrors[name]) {
      setDisburseErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSetMaxQuantity = () => {
    if (availableQuantity > 0) {
      setDisburseForm((prev) => ({ ...prev, quantity: String(availableQuantity) }));
      setDisburseErrors((prev) => ({ ...prev, quantity: '' }));
    }
  };

  const handleClearForm = () => {
    setSelectedSupplyId('');
    setAvailableQuantity(0);
    setDisburseForm(createEmptyDisbursementForm(loggedInUser));
    setDisburseErrors({});
  };

  const qtyNumber = Number(disburseForm.quantity);
  const exceedsStock = Boolean(
    selectedSupply &&
    disburseForm.quantity !== '' &&
    !Number.isNaN(qtyNumber) &&
    qtyNumber > availableQuantity
  );
  const isOutOfStock = Boolean(selectedSupply && availableQuantity <= 0);
  const isLowStock = Boolean(
    selectedSupply && availableQuantity > 0 && availableQuantity <= LOW_STOCK_THRESHOLD
  );
  const availableUnitShort = formatUnitShort(disburseForm.unit || 'Pieces', availableQuantity);

  const validateDisburseForm = () => {
    const errors = {};
    if (!disburseForm.section) errors.section = 'Section is required.';
    if (!disburseForm.itemName) errors.itemName = 'Item name is required.';
    if (selectedSupply && availableQuantity <= 0) {
      errors.quantity = 'Selected item is currently out of stock.';
    } else if (!disburseForm.quantity || Number(disburseForm.quantity) < 1) {
      errors.quantity = 'Quantity must be at least 1.';
    } else if (Number(disburseForm.quantity) > availableQuantity) {
      errors.quantity = `Exceeds available stock (${availableQuantity} ${availableUnitShort}).`;
    }
    if (!disburseForm.recipient.trim()) errors.recipient = 'Recipient is required.';
    if (!disburseForm.releasedBy.trim()) errors.releasedBy = 'Released by is required.';
    return errors;
  };

  const handleDisburseSubmit = async () => {
    const errors = validateDisburseForm();
    setDisburseErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await disburseSupply({ ...disburseForm, user: loggedInUser });
      setSnackbar({ open: true, message: 'Disbursement recorded successfully!', severity: 'success' });
      handleClearForm();
      fetchRecords();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Failed to disburse.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const archivedMatch = isDeletedItemName(r.supply_name) && 'archived deleted'.includes(q);
      return (
        archivedMatch ||
        (r.supply_name || '').toLowerCase().includes(q) ||
        (r.taken_by || '').toLowerCase().includes(q) ||
        (r.destination_section || '').toLowerCase().includes(q) ||
        (r.created_by || '').toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const quantityHelperText = (() => {
    if (exceedsStock) {
      return `Exceeds available stock (${availableQuantity} ${availableUnitShort})`;
    }
    if (disburseErrors.quantity) return disburseErrors.quantity;
    if (isOutOfStock) return 'No available stock for this item.';
    if (selectedSupply) {
      return `Available: ${availableQuantity} ${availableUnitShort}`;
    }
    return '';
  })();

  const stockBadge = (() => {
    if (!selectedSupply) return null;
    if (isOutOfStock) {
      return (
        <Chip
          icon={<ErrorOutlineRoundedIcon sx={{ fontSize: '15px !important', color: `${INVENTORY_COLORS.dangerText} !important` }} />}
          label={`Out of Stock (0 ${availableUnitShort})`}
          size="small"
          sx={{
            borderRadius: '6px',
            fontFamily: INVENTORY_FONT,
            fontWeight: 600,
            fontSize: 12,
            height: 26,
            backgroundColor: INVENTORY_COLORS.dangerBg,
            color: INVENTORY_COLORS.dangerText,
          }}
        />
      );
    }
    if (isLowStock) {
      return (
        <Chip
          icon={<WarningAmberRoundedIcon sx={{ fontSize: '15px !important', color: `${INVENTORY_COLORS.warningText} !important` }} />}
          label={`Restock · Available: ${availableQuantity} ${availableUnitShort}`}
          size="small"
          sx={{
            borderRadius: '6px',
            fontFamily: INVENTORY_FONT,
            fontWeight: 600,
            fontSize: 12,
            height: 26,
            backgroundColor: INVENTORY_COLORS.warningBg,
            color: INVENTORY_COLORS.warningText,
          }}
        />
      );
    }
    return (
      <Chip
        icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '15px !important', color: `${INVENTORY_COLORS.inStockText} !important` }} />}
        label={`Available: ${availableQuantity} ${availableUnitShort}`}
        size="small"
        sx={{
          borderRadius: '6px',
          fontFamily: INVENTORY_FONT,
          fontWeight: 600,
          fontSize: 12,
          height: 26,
          backgroundColor: INVENTORY_COLORS.inStockBg,
          color: INVENTORY_COLORS.inStockText,
        }}
      />
    );
  })();

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Office Supplies" onMenuClick={toggleDrawer} subtitle="SUPPLIES INVENTORY & DISBURSEMENTS" />
          <InventoryPageShell
            title="Supplies Inventory & Disbursements"
            userLabel={loggedInUser}
            actions={
              <Button
                variant="outlined"
                startIcon={<EditNoteOutlinedIcon sx={{ fontSize: 17 }} />}
                onClick={() => navigate('/supplies-encoding')}
                sx={inventoryNavBtnSx}
              >
                Supplies Encoding
              </Button>
            }
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search item, section, recipient, staff..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  sx={{ ...inventoryFieldSx, minWidth: { xs: '100%', sm: 310, md: 340 } }}
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
                onClick={() => setShowForm((prev) => !prev)}
                sx={inventoryPrimaryBtnSx}
              >
                {showForm ? 'Hide Disbursement Form' : 'New Disbursement'}
              </Button>
            </Box>

            {/* Collapsible 4-Column KPI Stat Strip */}
            <Collapse in={showStats}>
              <InventoryKpiStrip stats={kpiStats} />
            </Collapse>

            {/* New Disbursement Form Card */}
            <Collapse in={showForm}>
              <Paper elevation={0} sx={{ ...inventoryCardSx, mb: 2.5 }}>
                <Box sx={inventoryCardHeaderSx}>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontWeight: 600,
                        fontSize: 15,
                        color: INVENTORY_COLORS.textStrong,
                      }}
                    >
                      New Disbursement
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontSize: 12,
                        color: INVENTORY_COLORS.textSecondary,
                        mt: 0.15,
                      }}
                    >
                      Select an encoded supply item and record its release to a library section.
                    </Typography>
                  </Box>
                  {stockBadge}
                </Box>

                <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                  {/* Row 1: Item Details */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontSize: 11.5,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: INVENTORY_COLORS.textSecondary,
                      }}
                    >
                      Item Details
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontSize: 11.5,
                        color: INVENTORY_COLORS.textMuted,
                      }}
                    >
                      Brand, Unit, and Specifications auto-fill from inventory
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.75,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: '3.2fr 2fr 1.4fr 3.4fr',
                      },
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Item Name *"
                      name="itemName"
                      value={selectedSupplyId}
                      onChange={handleSelectItem}
                      error={!!disburseErrors.itemName}
                      helperText={disburseErrors.itemName}
                      sx={inventoryFieldSx}
                      SelectProps={{
                        renderValue: (selected) => {
                          const chosen = suppliesList.find((s) => String(s.Id) === String(selected));
                          if (!chosen) return '';
                          const brandTag = chosen.Brand && chosen.Brand !== 'N/A' ? ` (${chosen.Brand})` : '';
                          return `${chosen.ItemName}${brandTag}`;
                        },
                      }}
                    >
                      <MenuItem value="" disabled sx={inventoryMenuItemSx}>
                        Select Item
                      </MenuItem>
                      {suppliesList.map((s) => {
                        const itemQty = Number(s.Quantity) || 0;
                        const unitShort = formatUnitShort(s.Unit || 'Pieces', itemQty);
                        const brandTag = s.Brand && s.Brand !== 'N/A' ? ` (${s.Brand})` : '';
                        const specsTag =
                          s.Specifications && s.Specifications !== 'N/A' ? ` · ${s.Specifications}` : '';
                        return (
                          <MenuItem
                            key={s.Id}
                            value={String(s.Id)}
                            sx={{
                              ...inventoryMenuItemSx,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 340,
                              }}
                            >
                              {s.ItemName}{brandTag}
                              {specsTag && (
                                <Box
                                  component="span"
                                  sx={{ fontSize: 12, color: INVENTORY_COLORS.textSecondary }}
                                >
                                  {specsTag}
                                </Box>
                              )}
                            </Box>
                            <Box
                              component="span"
                              sx={{
                                fontSize: 12,
                                fontWeight: 600,
                                color:
                                  itemQty <= 0
                                    ? INVENTORY_COLORS.dangerText
                                    : itemQty <= LOW_STOCK_THRESHOLD
                                      ? INVENTORY_COLORS.warningText
                                      : INVENTORY_COLORS.textSecondary,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {itemQty} {unitShort}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </TextField>

                    <TextField
                      fullWidth
                      size="small"
                      label="Brand"
                      name="brand"
                      value={selectedSupply ? (disburseForm.brand || '—') : ''}
                      disabled
                      sx={inventoryReadOnlyFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Unit"
                      name="unit"
                      value={selectedSupply ? (disburseForm.unit || '—') : ''}
                      disabled
                      sx={inventoryReadOnlyFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Specifications"
                      name="specifications"
                      value={selectedSupply ? (disburseForm.specifications || '—') : ''}
                      disabled
                      sx={inventoryReadOnlyFieldSx}
                    />
                  </Box>

                  <Divider sx={{ my: 2.25, borderColor: INVENTORY_COLORS.gridLine }} />

                  {/* Row 2: Release Details */}
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: INVENTORY_COLORS.textSecondary,
                      mb: 1.5,
                    }}
                  >
                    Release Details
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: '2.05fr 1.65fr 1.9fr 2.2fr 2.2fr',
                      },
                      alignItems: 'start',
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Section *"
                      name="section"
                      value={disburseForm.section}
                      onChange={handleDisburseChange}
                      error={!!disburseErrors.section}
                      helperText={disburseErrors.section}
                      sx={inventoryFieldSx}
                    >
                      <MenuItem value="" disabled sx={inventoryMenuItemSx}>
                        Select Section
                      </MenuItem>
                      {SECTION_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s} sx={inventoryMenuItemSx}>
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      size="small"
                      label="Quantity *"
                      name="quantity"
                      type="number"
                      value={disburseForm.quantity}
                      onChange={handleDisburseChange}
                      error={Boolean(exceedsStock || disburseErrors.quantity || isOutOfStock)}
                      helperText={quantityHelperText}
                      sx={inventoryFieldSx}
                      inputProps={{
                        min: 1,
                        max: availableQuantity > 0 ? availableQuantity : undefined,
                      }}
                      InputProps={{
                        endAdornment: availableQuantity > 0 && (
                          <InputAdornment position="end">
                            <Button
                              size="small"
                              onClick={handleSetMaxQuantity}
                              title={`Set to available max (${availableQuantity})`}
                              sx={{
                                fontFamily: INVENTORY_FONT,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'none',
                                minWidth: 'auto',
                                px: 0.9,
                                py: 0.2,
                                borderRadius: '6px',
                                color: INVENTORY_COLORS.accent,
                                backgroundColor: INVENTORY_COLORS.accentTint,
                                '&:hover': { backgroundColor: '#FDE6DC' },
                              }}
                            >
                              Max
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Date Disbursed"
                      name="dateDisbursed"
                      type="date"
                      value={disburseForm.dateDisbursed}
                      onChange={handleDisburseChange}
                      InputLabelProps={{ shrink: true }}
                      sx={inventoryFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Recipient *"
                      name="recipient"
                      placeholder="Full name"
                      value={disburseForm.recipient}
                      onChange={handleDisburseChange}
                      error={!!disburseErrors.recipient}
                      helperText={disburseErrors.recipient}
                      sx={inventoryFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Released By *"
                      name="releasedBy"
                      value={disburseForm.releasedBy}
                      onChange={handleDisburseChange}
                      error={!!disburseErrors.releasedBy}
                      helperText={disburseErrors.releasedBy}
                      sx={inventoryFieldSx}
                    />
                  </Box>

                  {/* Actions */}
                  <Box
                    sx={{
                      mt: 2.5,
                      pt: 2,
                      borderTop: `1px solid ${INVENTORY_COLORS.gridLine}`,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1.25,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={handleClearForm}
                      sx={{ ...inventorySecondaryBtnSx, minWidth: 100 }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleDisburseSubmit}
                      disabled={submitting || exceedsStock || isOutOfStock}
                      sx={inventoryPrimaryBtnSx}
                    >
                      {submitting ? 'Submitting...' : 'Submit Disbursement'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Collapse>

            {/* Disbursed Items Table Card */}
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
                    Disbursed Items
                  </Typography>
                  <Chip
                    label={`${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}`}
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
                    {search.trim() ? 'No matching disbursements found' : 'No disbursed records yet'}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontSize: 13,
                      color: INVENTORY_COLORS.textSecondary,
                      mt: 0.5,
                    }}
                  >
                    {search.trim()
                      ? 'Try adjusting or clearing your search query.'
                      : 'Recorded supply releases will appear here.'}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={inventoryTableHeadRowSx}>
                        <TableCell>Date Disbursed</TableCell>
                        <TableCell>Section</TableCell>
                        <TableCell>Item/s</TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>Qty</TableCell>
                        <TableCell>Recipient</TableCell>
                        <TableCell>Released By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.map((r) => {
                        const qty = Math.abs(Number(r.quantity_changed) || 0);
                        const deleted = isDeletedItemName(r.supply_name);
                        const resolvedUnit =
                          r.unit ||
                          r.Unit ||
                          (!deleted ? unitBySupplyName[(r.supply_name || '').trim().toLowerCase()] : '');
                        const unitSuffix = resolvedUnit ? ` ${formatUnitShort(resolvedUnit, qty)}` : '';
                        const dateParts = formatDateParts(r.created_at);

                        return (
                          <TableRow key={r.transaction_id} sx={inventoryTableRowSx}>
                            <TableCell sx={{ whiteSpace: 'nowrap', color: INVENTORY_COLORS.textBody }}>
                              {dateParts.date}
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
                                  {r.supply_name}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 600,
                                color: INVENTORY_COLORS.textStrong,
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {qty}
                              {unitSuffix && (
                                <Box
                                  component="span"
                                  sx={{
                                    fontWeight: 400,
                                    fontSize: 12.5,
                                    color: INVENTORY_COLORS.textSecondary,
                                  }}
                                >
                                  {unitSuffix}
                                </Box>
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

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity={snackbar.severity} sx={{ fontFamily: INVENTORY_FONT }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Header>
  );
};

export default Supplies;
