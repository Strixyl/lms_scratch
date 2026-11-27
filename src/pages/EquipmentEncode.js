import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Typography, Box, MenuItem, Snackbar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, InputAdornment, IconButton, Chip,
  CircularProgress, Collapse,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { useNavigate } from 'react-router-dom';
import {
  LOCATION_OPTIONS, emptyAssetForm, getStockStatus,
} from '../constants/equipmentConstants';
import {
  getAssets, createAsset, updateAsset, deleteAsset, addStock, transferAsset,
  getBrands, createBrand, getDashboardSummary, getEquipmentItemNames, getTransactions,
} from '../api/equipmentApi';
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
  inventorySecondaryBtnSx,
  inventoryNavBtnSx,
  inventoryLogoutBtnSx,
  inventoryTableHeadRowSx,
  inventoryTableRowSx,
  formatDateParts,
  isDeletedItemName,
} from '../Components/InventoryLayout';

const NEW_BRAND_VALUE = 'new';
const NEW_ITEM_VALUE = 'NEW_ITEM';
const RELEASE_ACTION_TYPES = ['LOCATION_TRANSFER', 'Sent Asset'];

const createEmptyEquipmentForm = () => ({ ...emptyAssetForm, itemNameOption: '', controlNumber: '' });

const EquipmentEncode = () => {
  const navigate = useNavigate();

  // ---- auth ----
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  // ---- data ----
  const [items, setItems] = useState([]);
  const [itemNames, setItemNames] = useState([]);
  const [brands, setBrands] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ---- UI toggles ----
  const [showStats, setShowStats] = useState(true);
  const [showForm, setShowForm] = useState(true);

  // ---- add asset form ----
  const [formData, setFormData] = useState(createEmptyEquipmentForm);
  const [formErrors, setFormErrors] = useState({});

  // ---- edit / delete ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyEquipmentForm);
  const [editErrors, setEditErrors] = useState({});

  // ---- add stock ----
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [stockError, setStockError] = useState('');
  const [stockLocation, setStockLocation] = useState('');

  // ---- transfer modal ----
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferDestLocation, setTransferDestLocation] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTakenBy, setTransferTakenBy] = useState('');
  const [transferError, setTransferError] = useState('');

  // ---- manage item picker ----
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [manageProfileKey, setManageProfileKey] = useState('');
  const [manageLocationId, setManageLocationId] = useState('');

  // ---- release records ----
  const [releaseRecords, setReleaseRecords] = useState([]);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [releaseSearch, setReleaseSearch] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('All');
  const [releasePage, setReleasePage] = useState(0);
  const [releaseRowsPerPage, setReleaseRowsPerPage] = useState(15);

  useEffect(() => {
    const savedUser = localStorage.getItem('equipmentUser');
    if (savedUser) {
      setLoggedInUser(savedUser);
      setUsername(savedUser);
      setShowLoginModal(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const data = await getAssets();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setSnackbar({ open: true, message: 'Failed to load equipment records.', severity: 'error' });
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await getBrands();
      const mappedBrands = (Array.isArray(data) ? data : []).map((b, idx) => ({
        brand_id: String(idx),
        brand_name: b,
      }));
      setBrands(mappedBrands);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  const fetchItemNames = useCallback(async () => {
    try {
      const data = await getEquipmentItemNames();
      setItemNames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching item names:', err);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      await getDashboardSummary();
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  }, []);

  const fetchReleaseRecords = useCallback(async () => {
    setReleaseLoading(true);
    try {
      const data = await getTransactions();
      const releases = (Array.isArray(data) ? data : []).filter((t) =>
        RELEASE_ACTION_TYPES.includes(t.action_type)
      );
      setReleaseRecords(releases);
    } catch (err) {
      console.error('Error fetching release records:', err);
    } finally {
      setReleaseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showLoginModal) {
      fetchItems();
      fetchBrands();
      fetchItemNames();
      fetchSummary();
      fetchReleaseRecords();
    }
  }, [showLoginModal, fetchItems, fetchBrands, fetchItemNames, fetchSummary, fetchReleaseRecords]);

  // ---------------- auth handlers ----------------
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '!HLL2025*') {
      localStorage.setItem('equipmentUser', username);
      setLoggedInUser(username);
      setShowLoginModal(false);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('equipmentUser');
    setLoggedInUser('');
    setShowLoginModal(true);
    setUsername('');
    setPassword('');
  };

  // ---------------- add asset ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBrandSelect = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      brandOption: value,
      brand: value === NEW_BRAND_VALUE ? '' : value,
    }));
    if (formErrors.brand) setFormErrors((prev) => ({ ...prev, brand: '' }));
  };

  const handleItemNameSelect = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      itemNameOption: value,
      itemName: value === NEW_ITEM_VALUE ? '' : value,
    }));
    if (formErrors.itemName) setFormErrors((prev) => ({ ...prev, itemName: '' }));
  };

  const handleEditItemNameSelect = (e) => {
    const value = e.target.value;
    setEditForm((prev) => ({
      ...prev,
      itemNameOption: value,
      itemName: value === NEW_ITEM_VALUE ? '' : value,
    }));
    if (editErrors.itemName) setEditErrors((prev) => ({ ...prev, itemName: '' }));
  };

  const handleEditBrandSelect = (e) => {
    const value = e.target.value;
    setEditForm((prev) => ({
      ...prev,
      brandOption: value,
      brand: value === NEW_BRAND_VALUE ? '' : value,
    }));
    if (editErrors.brand) setEditErrors((prev) => ({ ...prev, brand: '' }));
  };

  const validateAssetForm = (data) => {
    const errors = {};
    if (itemNames.length > 0 && !data.itemNameOption) {
      errors.itemName = 'Please select an item name.';
    }
    if (itemNames.length > 0 && data.itemNameOption === NEW_ITEM_VALUE && !data.itemName.trim()) {
      errors.itemName = 'Please enter the item name.';
    }
    if (itemNames.length === 0 && !data.itemName.trim()) {
      errors.itemName = 'Item name is required.';
    }
    if (brands.length > 0 && !data.brandOption) errors.brand = 'Please select a brand.';
    if (brands.length > 0 && data.brandOption === NEW_BRAND_VALUE && !data.brand.trim()) {
      errors.brand = 'Please enter the new brand name.';
    }
    if (brands.length === 0 && !data.brand.trim()) errors.brand = 'Brand name is required.';

    if (!data.controlNumber || !data.controlNumber.trim()) {
      errors.controlNumber = 'Control number is required.';
    }

    if (!data.specifications || !data.specifications.trim() || data.specifications.trim().toUpperCase() === 'N/A') {
      errors.specifications = 'Specifications are required.';
    }
    const qty = Number(data.quantity);
    if (data.quantity === '' || Number.isNaN(qty) || qty < 1) {
      errors.quantity = 'Quantity must be at least 1.';
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateAssetForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const brandName = formData.brand.trim();
      if (brandName && !brands.some((b) => b.brand_name.toLowerCase() === brandName.toLowerCase())) {
        await createBrand(brandName);
      }
      const quantity = Number(formData.quantity);
      await createAsset({
        itemName: formData.itemName.trim(),
        brand: brandName,
        quantity,
        status: getStockStatus(quantity),
        location: formData.location,
        specifications: formData.specifications.trim(),
        controlNumber: formData.controlNumber.trim(),
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Equipment saved successfully!', severity: 'success' });
      setFormData(createEmptyEquipmentForm());
      setFormErrors({});
      fetchItems();
      fetchBrands();
      fetchItemNames();
      fetchSummary();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to save asset.';
      setSnackbar({ open: true, message: apiMessage, severity: 'error' });
    }
  };

  // ---------------- edit ----------------
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    const existingBrand = brands.some((b) => b.brand_name.toLowerCase() === (item.Brand || '').toLowerCase());
    const existingItemName = itemNames.some((n) => n.toLowerCase() === (item.ItemName || '').toLowerCase());
    setEditForm({
      itemName: item.ItemName || '',
      itemNameOption: existingItemName ? item.ItemName : NEW_ITEM_VALUE,
      brand: item.Brand || '',
      brandOption: existingBrand ? item.Brand : NEW_BRAND_VALUE,
      quantity: item.Quantity ?? '',
      location: item.Location || '',
      specifications: item.Specifications === 'N/A' ? '' : item.Specifications || '',
      controlNumber: item.ControlNumber || '',
    });
    setEditErrors({});
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    const errors = validateAssetForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSnackbar({ open: true, message: 'Please fix the highlighted fields.', severity: 'error' });
      return;
    }
    try {
      const quantity = Number(editForm.quantity);
      await updateAsset(selectedItem.Id, {
        itemName: editForm.itemName.trim(),
        brand: editForm.brand.trim(),
        quantity,
        status: getStockStatus(quantity),
        location: editForm.location,
        specifications: editForm.specifications.trim(),
        controlNumber: editForm.controlNumber.trim(),
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Equipment updated successfully!', severity: 'success' });
      setEditDialogOpen(false);
      fetchItems();
      fetchBrands();
      fetchItemNames();
      fetchSummary();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error || 'Failed to update equipment.';
      setSnackbar({ open: true, message: apiMessage, severity: 'error' });
    }
  };

  // ---------------- delete ----------------
  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteAsset(selectedItem.Id);
      setSnackbar({ open: true, message: 'Equipment deleted successfully!', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete equipment.', severity: 'error' });
    }
  };

  // ---------------- add stock ----------------
  const handleOpenStock = (profile) => {
    setStockTarget(profile);
    setStockLocation('');
    setStockAmount('');
    setStockError('');
    setStockDialogOpen(true);
  };

  const handleConfirmStock = async () => {
    const qty = Number(stockAmount);
    if (!stockLocation) return setStockError('Select a location.');
    if (!stockAmount || Number.isNaN(qty) || qty < 1) {
      return setStockError('Additional quantity must be at least 1.');
    }
    try {
      const existingLoc = stockTarget.location_balances.find((l) => l.LocationName === stockLocation);
      const assetId = existingLoc ? existingLoc.Id : (stockTarget.location_balances[0]?.Id || null);
      await addStock({
        assetId,
        itemName: stockTarget.ItemName,
        brand: stockTarget.Brand,
        serialNumber: stockTarget.SerialNumber || '',
        location: stockLocation,
        specifications: stockTarget.location_balances[0]?.Specifications || '',
        quantity: qty,
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: `Added ${qty} to ${stockLocation}.`, severity: 'success' });
      setStockDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      setStockError(err.response?.data?.message || 'Failed to add stock.');
    }
  };

  // ---------------- transfer ----------------
  const handleOpenTransfer = (profile, sourceLocationId = '') => {
    setTransferTarget(profile);
    const resolvedId = sourceLocationId || (profile.location_balances[0]?.Id || '');
    setTransferSourceId(resolvedId);
    setTransferDestLocation('');
    setTransferAmount('');
    setTransferTakenBy('');
    setTransferError('');
    setTransferDialogOpen(true);
  };

  const handleConfirmTransfer = async () => {
    const sourceLoc = transferTarget.location_balances.find((l) => String(l.Id) === String(transferSourceId));
    if (!sourceLoc) {
      setTransferError('Invalid source location.');
      return;
    }
    const qty = Number(transferAmount);
    if (!transferDestLocation) {
      setTransferError('Select destination location.');
      return;
    }
    if (!transferAmount || Number.isNaN(qty) || qty < 1) {
      setTransferError('Quantity must be at least 1.');
      return;
    }
    if (qty > sourceLoc.Quantity) {
      setTransferError(`Transfer quantity cannot exceed source balance of ${sourceLoc.Quantity}.`);
      return;
    }
    if (!transferTakenBy.trim()) {
      setTransferError('Please enter who is taking the item.');
      return;
    }
    try {
      await transferAsset(sourceLoc.Id, {
        destinationLocation: transferDestLocation,
        quantity: qty,
        user: loggedInUser,
        takenBy: transferTakenBy.trim(),
      });
      setSnackbar({ open: true, message: `Successfully transferred ${qty} to ${transferDestLocation}.`, severity: 'success' });
      setTransferDialogOpen(false);
      fetchItems();
      fetchSummary();
      fetchReleaseRecords();
    } catch (err) {
      setTransferError(err.response?.data?.message || 'Failed to transfer asset.');
    }
  };

  const currentSourceBalance = useMemo(() => {
    if (!transferTarget || !transferSourceId) return 0;
    const loc = transferTarget.location_balances.find((l) => String(l.Id) === String(transferSourceId));
    return loc ? loc.Quantity : 0;
  }, [transferTarget, transferSourceId]);

  const isTransferInvalid = useMemo(() => {
    const qty = Number(transferAmount);
    return (
      !transferAmount ||
      Number.isNaN(qty) ||
      qty < 1 ||
      qty > currentSourceBalance ||
      !transferDestLocation ||
      !transferTakenBy.trim()
    );
  }, [transferAmount, currentSourceBalance, transferDestLocation, transferTakenBy]);

  // ---------------- derived data ----------------
  const manageProfile = items.find((i) => i.ProfileKey === manageProfileKey);
  const manageLocation = manageProfile?.location_balances.find((l) => String(l.Id) === String(manageLocationId));
  const openManageDialog = () => {
    setManageProfileKey('');
    setManageLocationId('');
    setManageDialogOpen(true);
  };

  const destinationOptions = useMemo(() => {
    const unique = new Set();
    releaseRecords.forEach((r) => {
      const dest = (r.destination_section || '').trim();
      if (dest) unique.add(dest);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [releaseRecords]);

  const kpiStats = useMemo(() => {
    const totalStock = items.reduce((acc, i) => acc + (Number(i.TotalQuantity) || 0), 0);
    const totalLocations = items.reduce((acc, i) => acc + (i.location_balances?.length || 0), 0);
    const totalReleasedUnits = releaseRecords.reduce((acc, r) => acc + Math.abs(Number(r.quantity_changed) || 0), 0);

    return [
      {
        label: 'Asset Profiles',
        value: items.length.toLocaleString(),
        subtext: 'Tracked records',
        badge: `${totalLocations} locations`,
        tone: 'indigo',
        hint: 'Distinct equipment profiles encoded',
      },
      {
        label: 'Total Inventory',
        value: totalStock.toLocaleString(),
        subtext: 'Available stock',
        badge: 'In Stock',
        tone: 'positive',
        hint: 'Total equipment units across all library locations',
      },
      {
        label: 'Release Records',
        value: releaseRecords.length.toLocaleString(),
        subtext: 'Total released',
        badge: `${totalReleasedUnits.toLocaleString()} units`,
        tone: 'neutral',
        hint: 'Logged equipment transfers and sent assets',
      },
      {
        label: 'Destinations',
        value: destinationOptions.length.toLocaleString(),
        subtext: 'Sections served',
        badge: 'Active',
        tone: 'neutral',
        hint: 'Distinct sections receiving library equipment',
      },
    ];
  }, [items, releaseRecords, destinationOptions]);

  const filteredReleaseRecords = useMemo(() => {
    const q = releaseSearch.trim().toLowerCase();
    return releaseRecords.filter((r) => {
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
  }, [releaseRecords, releaseSearch, destinationFilter]);

  const pagedReleaseRecords = filteredReleaseRecords.slice(
    releasePage * releaseRowsPerPage,
    releasePage * releaseRowsPerPage + releaseRowsPerPage
  );
  const hasActiveFilters = Boolean(releaseSearch.trim()) || destinationFilter !== 'All';

  // ---------------- shared balanced 3-column form fields renderer ----------------
  const renderFormFields = (data, handler, itemNameSelectHandler, brandSelectHandler, errors = {}) => (
    <Box
      sx={{
        display: 'grid',
        gap: 1.75,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        alignItems: 'start',
      }}
    >
      {/* Row 1, Col 1: Item Name * */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {itemNames.length > 0 && (
          <TextField
            fullWidth
            size="small"
            select
            label="Item Name *"
            name="itemNameOption"
            value={data.itemNameOption || ''}
            onChange={itemNameSelectHandler}
            error={!!errors.itemName && !data.itemNameOption}
            helperText={!data.itemNameOption ? errors.itemName : ''}
            sx={inventoryFieldSx}
          >
            <MenuItem value="" disabled sx={inventoryMenuItemSx}>
              Select Item Name
            </MenuItem>
            {itemNames.map((name) => (
              <MenuItem key={name} value={name} sx={inventoryMenuItemSx}>
                {name}
              </MenuItem>
            ))}
            <MenuItem value={NEW_ITEM_VALUE} sx={{ ...inventoryMenuItemSx, fontStyle: 'italic' }}>
              Others (Input Manually)
            </MenuItem>
          </TextField>
        )}
        {(itemNames.length === 0 || data.itemNameOption === NEW_ITEM_VALUE) && (
          <TextField
            fullWidth
            size="small"
            label={itemNames.length === 0 ? 'Item Name *' : 'Enter New Item Name *'}
            name="itemName"
            value={data.itemName}
            onChange={handler}
            error={!!errors.itemName}
            helperText={errors.itemName}
            sx={inventoryFieldSx}
          />
        )}
      </Box>

      {/* Row 1, Col 2: Brand * */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {brands.length > 0 && (
          <TextField
            fullWidth
            size="small"
            select
            label="Brand *"
            name="brandOption"
            value={data.brandOption}
            onChange={brandSelectHandler}
            error={!!errors.brand && !data.brandOption}
            helperText={!data.brandOption ? errors.brand : ''}
            sx={inventoryFieldSx}
          >
            <MenuItem value="" disabled sx={inventoryMenuItemSx}>
              Select Brand
            </MenuItem>
            {brands.map((b) => (
              <MenuItem key={b.brand_id} value={b.brand_name} sx={inventoryMenuItemSx}>
                {b.brand_name}
              </MenuItem>
            ))}
            <MenuItem value={NEW_BRAND_VALUE} sx={{ ...inventoryMenuItemSx, fontStyle: 'italic' }}>
              Others (Input Manually)
            </MenuItem>
          </TextField>
        )}
        {(brands.length === 0 || data.brandOption === NEW_BRAND_VALUE) && (
          <TextField
            fullWidth
            size="small"
            label={brands.length === 0 ? 'Brand Name *' : 'Enter New Brand *'}
            name="brand"
            value={data.brand}
            onChange={handler}
            error={!!errors.brand}
            helperText={errors.brand}
            sx={inventoryFieldSx}
          />
        )}
      </Box>

      {/* Row 1, Col 3: Control Number * */}
      <TextField
        fullWidth
        size="small"
        label="Control Number *"
        name="controlNumber"
        placeholder="e.g., EQ-2026-001"
        value={data.controlNumber || ''}
        onChange={handler}
        error={!!errors.controlNumber}
        helperText={errors.controlNumber}
        sx={inventoryFieldSx}
      />

      {/* Row 2, Col 1: Quantity * */}
      <TextField
        fullWidth
        size="small"
        label="Quantity *"
        name="quantity"
        value={data.quantity}
        onChange={handler}
        type="number"
        error={!!errors.quantity}
        helperText={errors.quantity}
        inputProps={{ min: 1 }}
        sx={inventoryFieldSx}
      />

      {/* Row 2, Col 2: Location */}
      <TextField
        fullWidth
        size="small"
        select
        label="Location"
        name="location"
        value={data.location}
        onChange={handler}
        sx={inventoryFieldSx}
      >
        <MenuItem value="" sx={inventoryMenuItemSx}>
          Select location
        </MenuItem>
        {LOCATION_OPTIONS.map((l) => (
          <MenuItem key={l} value={l} sx={inventoryMenuItemSx}>
            {l}
          </MenuItem>
        ))}
      </TextField>

      {/* Row 2, Col 3: Specifications * */}
      <TextField
        fullWidth
        size="small"
        label="Specifications *"
        name="specifications"
        placeholder="e.g., Model, specs, or serial details"
        value={data.specifications}
        onChange={handler}
        error={!!errors.specifications}
        helperText={errors.specifications}
        sx={inventoryFieldSx}
      />
    </Box>
  );

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Equipment Encoding" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT ENCODING" />
            <InventoryPageShell
              title="Equipment Encoding"
              userLabel={!showLoginModal ? loggedInUser : ''}
              onLogout={!showLoginModal ? handleLogout : undefined}
              hideCanvas={showLoginModal}
              actions={
                !showLoginModal && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<SendOutlinedIcon sx={{ fontSize: 15 }} />}
                      onClick={() => navigate('/send-asset')}
                      sx={inventoryNavBtnSx}
                    >
                      Send Asset
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<HistoryOutlinedIcon sx={{ fontSize: 16 }} />}
                      onClick={() => navigate('/transactions')}
                      sx={inventoryNavBtnSx}
                    >
                      Transaction History
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LogoutIcon sx={{ fontSize: 15 }} />}
                      onClick={handleLogout}
                      sx={inventoryLogoutBtnSx}
                    >
                      Logout
                    </Button>
                  </>
                )
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
                    placeholder="Search item, control #, destination, staff..."
                    value={releaseSearch}
                    onChange={(e) => { setReleaseSearch(e.target.value); setReleasePage(0); }}
                    sx={{
                      ...inventoryFieldSx,
                      minWidth: { xs: '100%', sm: 300, md: 330 },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 17, color: INVENTORY_COLORS.textMuted }} />
                        </InputAdornment>
                      ),
                      endAdornment: releaseSearch && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Clear search"
                            onClick={() => { setReleaseSearch(''); setReleasePage(0); }}
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
                    onChange={(e) => { setDestinationFilter(e.target.value); setReleasePage(0); }}
                    sx={{
                      ...inventoryFieldSx,
                      minWidth: { xs: '100%', sm: 185 },
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<TuneOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={openManageDialog}
                    sx={inventorySecondaryBtnSx}
                  >
                    Manage Items
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 17 }} />}
                    onClick={() => setShowForm((prev) => !prev)}
                    sx={inventoryPrimaryBtnSx}
                  >
                    {showForm ? 'Hide Encode Form' : 'Add New Asset'}
                  </Button>
                </Box>
              </Box>

              {/* Collapsible 4-Column KPI Stat Strip */}
              <Collapse in={showStats}>
                <InventoryKpiStrip stats={kpiStats} />
              </Collapse>

              {/* Encode New Equipment Asset Card */}
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
                        Encode New Equipment Asset
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: INVENTORY_FONT,
                          fontSize: 12,
                          color: INVENTORY_COLORS.textSecondary,
                          mt: 0.15,
                        }}
                      >
                        Register library equipment with its control number, stock count, location, and specifications.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                    {renderFormFields(
                      formData,
                      handleChange,
                      handleItemNameSelect,
                      handleBrandSelect,
                      formErrors
                    )}
                    <Box
                      sx={{
                        mt: 2.5,
                        pt: 2,
                        borderTop: `1px solid ${INVENTORY_COLORS.gridLine}`,
                        display: 'flex',
                        gap: 1.25,
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => { setFormData(createEmptyEquipmentForm()); setFormErrors({}); }}
                        sx={{ ...inventorySecondaryBtnSx, minWidth: 100 }}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{ ...inventoryPrimaryBtnSx, minWidth: 128 }}
                      >
                        Save Asset
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Collapse>

              {/* Release Records Table Card */}
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
                      Release Records
                    </Typography>
                    <Chip
                      label={
                        hasActiveFilters
                          ? `${filteredReleaseRecords.length} of ${releaseRecords.length} records`
                          : `${releaseRecords.length} ${releaseRecords.length === 1 ? 'record' : 'records'}`
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

                {releaseLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
                    <CircularProgress size={30} sx={{ color: INVENTORY_COLORS.accent }} />
                  </Box>
                ) : filteredReleaseRecords.length === 0 ? (
                  <Box sx={{ py: 7, px: 3, textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontWeight: 600,
                        fontSize: 14,
                        color: INVENTORY_COLORS.textStrong,
                      }}
                    >
                      {hasActiveFilters ? 'No release records match your filter' : 'No release records found'}
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
                        : 'Transferred and released equipment assets will appear here.'}
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
                        {pagedReleaseRecords.map((r) => {
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
                  count={filteredReleaseRecords.length}
                  page={releasePage}
                  onPageChange={(_, p) => setReleasePage(p)}
                  rowsPerPage={releaseRowsPerPage}
                  onRowsPerPageChange={(e) => { setReleaseRowsPerPage(parseInt(e.target.value, 10)); setReleasePage(0); }}
                  rowsPerPageOptions={[15, 25, 50]}
                />
              </Paper>
            </InventoryPageShell>
          </>
        )}
      </Header>

      {/* Login Modal */}
      {showLoginModal && (
        <Dialog
          open
          disableEscapeKeyDown
          PaperProps={{ sx: { borderRadius: '14px', p: 0.5, border: `1px solid ${INVENTORY_COLORS.border}` } }}
        >
          <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.textStrong }}>
            Login Required
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 13, color: INVENTORY_COLORS.textSecondary, mb: 2 }}>
              You need to login to access equipment encoding.
            </Typography>
            <TextField
              fullWidth
              size="small"
              margin="dense"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
              sx={{ ...inventoryFieldSx, mb: 1.5 }}
            />
            <TextField
              fullWidth
              size="small"
              margin="dense"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
              sx={inventoryFieldSx}
            />
            {loginError && (
              <Typography color="error" sx={{ fontFamily: INVENTORY_FONT, fontSize: 12, mt: 1 }}>
                {loginError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => navigate('/')} sx={{ ...inventorySecondaryBtnSx, minHeight: 36 }}>
              Back to Home
            </Button>
            <Button variant="contained" onClick={handleLogin} sx={{ ...inventoryPrimaryBtnSx, minHeight: 36 }}>
              Login
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: `1px solid ${INVENTORY_COLORS.border}` } }}
      >
        <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.textStrong }}>
          Edit Equipment Asset Details
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          {renderFormFields(
            editForm,
            handleEditChange,
            handleEditItemNameSelect,
            handleEditBrandSelect,
            editErrors
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ ...inventorySecondaryBtnSx, minHeight: 38 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdate} sx={{ ...inventoryPrimaryBtnSx, minHeight: 38 }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: `1px solid ${INVENTORY_COLORS.border}` } }}
      >
        <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.textStrong }}>
          Delete Equipment
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 14, color: INVENTORY_COLORS.textBody }}>
            Are you sure you want to delete <strong>{selectedItem?.ItemName}</strong>
            {selectedItem?.LocationName ? ` (${selectedItem.LocationName})` : ''}?
            {' '}This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ ...inventorySecondaryBtnSx, minHeight: 38 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            sx={{
              fontFamily: INVENTORY_FONT,
              fontWeight: 600,
              fontSize: 13,
              textTransform: 'none',
              borderRadius: '8px',
              backgroundColor: INVENTORY_COLORS.dangerText,
              px: 2.5,
              minHeight: 38,
              '&:hover': { backgroundColor: INVENTORY_COLORS.dangerHover },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: `1px solid ${INVENTORY_COLORS.border}` } }}
      >
        <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.textStrong }}>
          Add Stock
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 13, color: INVENTORY_COLORS.textSecondary, mb: 2 }}>
            Asset: <strong style={{ color: INVENTORY_COLORS.textStrong }}>{stockTarget?.ItemName}</strong> — Total Current Stock:{' '}
            <strong style={{ color: INVENTORY_COLORS.textStrong }}>{stockTarget?.TotalQuantity || 0}</strong>
          </Typography>
          <TextField
            fullWidth
            size="small"
            select
            label="Location *"
            value={stockLocation}
            onChange={(e) => { setStockLocation(e.target.value); setStockError(''); }}
            sx={{ ...inventoryFieldSx, mb: 2 }}
          >
            {LOCATION_OPTIONS.map((l) => (
              <MenuItem key={l} value={l} sx={inventoryMenuItemSx}>
                {l}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            size="small"
            autoFocus
            type="number"
            label="Additional Quantity *"
            value={stockAmount}
            onChange={(e) => { setStockAmount(e.target.value); setStockError(''); }}
            error={!!stockError}
            helperText={stockError}
            inputProps={{ min: 1 }}
            sx={inventoryFieldSx}
          />
          {stockAmount && !stockError && Number(stockAmount) > 0 && (
            <Box
              sx={{
                mt: 1.5,
                px: 1.5,
                py: 0.9,
                borderRadius: '8px',
                backgroundColor: INVENTORY_COLORS.successBg,
              }}
            >
              <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 12.5, fontWeight: 600, color: INVENTORY_COLORS.successText }}>
                New total quantity: {Number(stockTarget?.TotalQuantity || 0) + Number(stockAmount)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setStockDialogOpen(false)} sx={{ ...inventorySecondaryBtnSx, minHeight: 38 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmStock} sx={{ ...inventoryPrimaryBtnSx, minHeight: 38 }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Location Dialog */}
      <Dialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: `1px solid ${INVENTORY_COLORS.border}` } }}
      >
        <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.textStrong }}>
          Transfer Location
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 13, color: INVENTORY_COLORS.textSecondary }}>
              Asset: <strong style={{ color: INVENTORY_COLORS.textStrong }}>{transferTarget?.ItemName}</strong>
              {transferTarget?.Brand && transferTarget.Brand !== 'N/A' ? ` (${transferTarget.Brand})` : ''}
            </Typography>
            <Chip
              label={`Available: ${currentSourceBalance}`}
              size="small"
              sx={{
                height: 22,
                borderRadius: '6px',
                fontFamily: INVENTORY_FONT,
                fontSize: 11.5,
                fontWeight: 600,
                backgroundColor: INVENTORY_COLORS.inStockBg,
                color: INVENTORY_COLORS.inStockText,
              }}
            />
          </Box>
          <TextField
            fullWidth
            size="small"
            select
            label="Source Location *"
            value={transferSourceId}
            onChange={(e) => { setTransferSourceId(e.target.value); setTransferError(''); }}
            sx={{ ...inventoryFieldSx, mb: 2 }}
          >
            {transferTarget?.location_balances.map((l) => (
              <MenuItem key={l.Id} value={String(l.Id)} sx={inventoryMenuItemSx}>
                {l.LocationName}{' '}
                {l.SerialNumber && l.SerialNumber !== 'N/A' && l.SerialNumber !== 'None' ? `[S/N: ${l.SerialNumber}] ` : ''}
                ({l.Quantity} available)
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            size="small"
            select
            label="Destination Location *"
            value={transferDestLocation}
            onChange={(e) => { setTransferDestLocation(e.target.value); setTransferError(''); }}
            sx={{ ...inventoryFieldSx, mb: 2 }}
          >
            {LOCATION_OPTIONS.filter((l) => {
              const currentSource = transferTarget?.location_balances.find((x) => String(x.Id) === String(transferSourceId));
              return l !== currentSource?.LocationName;
            }).map((l) => (
              <MenuItem key={l} value={l} sx={inventoryMenuItemSx}>
                {l}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Transfer Quantity *"
            value={transferAmount}
            onChange={(e) => { setTransferAmount(e.target.value); setTransferError(''); }}
            error={!!transferError || (Boolean(transferAmount) && Number(transferAmount) > currentSourceBalance)}
            helperText={
              transferError ||
              (transferAmount && Number(transferAmount) > currentSourceBalance
                ? `Transfer quantity cannot exceed source balance of ${currentSourceBalance}`
                : '')
            }
            inputProps={{ min: 1, max: currentSourceBalance }}
            sx={{ ...inventoryFieldSx, mb: 2 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Taken By *"
            placeholder="Name of person taking the item"
            value={transferTakenBy}
            onChange={(e) => { setTransferTakenBy(e.target.value); setTransferError(''); }}
            sx={inventoryFieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setTransferDialogOpen(false)} sx={{ ...inventorySecondaryBtnSx, minHeight: 38 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmTransfer}
            disabled={isTransferInvalid}
            sx={{ ...inventoryPrimaryBtnSx, minHeight: 38 }}
          >
            Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Item Dialog */}
      <Dialog
        open={manageDialogOpen}
        onClose={() => setManageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', border: `1px solid ${INVENTORY_COLORS.border}` } }}
      >
        <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.textStrong }}>
          Manage Encoded Equipment
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Select Item *"
            value={manageProfileKey}
            onChange={(e) => { setManageProfileKey(e.target.value); setManageLocationId(''); }}
            sx={{ ...inventoryFieldSx, mb: 2 }}
          >
            <MenuItem value="" disabled sx={inventoryMenuItemSx}>
              Select an item
            </MenuItem>
            {items.map((i) => (
              <MenuItem key={i.ProfileKey} value={i.ProfileKey} sx={inventoryMenuItemSx}>
                {i.ItemName} {i.Brand && i.Brand !== 'N/A' ? `(${i.Brand})` : ''} — Total Stock: {i.TotalQuantity}
              </MenuItem>
            ))}
          </TextField>

          {manageProfile && (
            <TextField
              fullWidth
              size="small"
              select
              label="Select Location *"
              value={manageLocationId}
              onChange={(e) => setManageLocationId(e.target.value)}
              sx={{ ...inventoryFieldSx, mb: manageLocation ? 2 : 0 }}
            >
              <MenuItem value="" disabled sx={inventoryMenuItemSx}>
                Select a location
              </MenuItem>
              {manageProfile.location_balances.map((l) => (
                <MenuItem key={l.Id} value={String(l.Id)} sx={inventoryMenuItemSx}>
                  {l.LocationName || 'Storage'} — {l.Quantity} {l.Unit || 'Pieces'}
                  {l.SerialNumber && l.SerialNumber !== 'N/A' && l.SerialNumber !== 'None' ? ` [S/N: ${l.SerialNumber}]` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}

          {manageLocation && (
            <Box
              sx={{
                p: 2,
                borderRadius: '10px',
                backgroundColor: INVENTORY_COLORS.surfaceMuted,
                border: `1px solid ${INVENTORY_COLORS.border}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: INVENTORY_FONT,
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: INVENTORY_COLORS.textSecondary,
                  mb: 1.5,
                }}
              >
                Actions for{' '}
                <Box component="span" sx={{ fontWeight: 600, color: INVENTORY_COLORS.textStrong }}>
                  {manageProfile.ItemName}
                </Box>{' '}
                at{' '}
                <Box component="span" sx={{ fontWeight: 600, color: INVENTORY_COLORS.textStrong }}>
                  {manageLocation.LocationName || 'Storage'}
                </Box>{' '}
                ({manageLocation.Quantity} in stock)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                  onClick={() => { setManageDialogOpen(false); handleOpenStock(manageProfile); }}
                  sx={{
                    fontFamily: INVENTORY_FONT,
                    fontWeight: 600,
                    fontSize: 12.5,
                    textTransform: 'none',
                    borderRadius: '8px',
                    color: INVENTORY_COLORS.successText,
                    borderColor: INVENTORY_COLORS.successBorder,
                    backgroundColor: INVENTORY_COLORS.surface,
                    '&:hover': { backgroundColor: INVENTORY_COLORS.successBg, borderColor: INVENTORY_COLORS.successText },
                  }}
                >
                  Add Stock
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
                  onClick={() => { setManageDialogOpen(false); handleOpenTransfer(manageProfile, manageLocation.Id); }}
                  sx={{
                    fontFamily: INVENTORY_FONT,
                    fontWeight: 600,
                    fontSize: 12.5,
                    textTransform: 'none',
                    borderRadius: '8px',
                    color: INVENTORY_COLORS.accent,
                    borderColor: INVENTORY_COLORS.accentBorder,
                    backgroundColor: INVENTORY_COLORS.surface,
                    '&:hover': { backgroundColor: INVENTORY_COLORS.accentTint, borderColor: INVENTORY_COLORS.accent },
                  }}
                >
                  Transfer
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    setManageDialogOpen(false);
                    handleOpenEdit({
                      ...manageProfile,
                      ...manageLocation,
                      Id: manageLocation.Id,
                      Location: manageLocation.LocationName,
                      Quantity: manageLocation.Quantity,
                    });
                  }}
                  sx={inventoryNavBtnSx}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    setManageDialogOpen(false);
                    handleOpenDelete({
                      Id: manageLocation.Id,
                      ItemName: manageProfile.ItemName,
                      LocationName: manageLocation.LocationName,
                    });
                  }}
                  sx={inventoryLogoutBtnSx}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.75 }}>
          <Button onClick={() => setManageDialogOpen(false)} sx={{ ...inventorySecondaryBtnSx, minHeight: 36 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
  );
};

export default EquipmentEncode;
