import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Typography, Box, Grid, MenuItem, Snackbar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, InputAdornment,
  TablePagination, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useNavigate } from 'react-router-dom';
import {
  LOCATION_OPTIONS, THEME, emptyAssetForm, getStockStatus,
} from '../constants/equipmentConstants';
import {
  getAssets, createAsset, updateAsset, deleteAsset, addStock, transferAsset,
  getBrands, createBrand, getDashboardSummary, getEquipmentItemNames, getTransactions,
} from '../api/equipmentApi';

const NEW_BRAND_VALUE = 'new';
const NEW_ITEM_VALUE = 'NEW_ITEM';
const font = THEME.font;

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

  // ---- add asset form (Added controlNumber) ----
  const [formData, setFormData] = useState({ ...emptyAssetForm, controlNumber: '' });
  const [formErrors, setFormErrors] = useState({});

  // ---- edit / delete ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyAssetForm, controlNumber: '' });

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

  useEffect(() => {
    if (!showLoginModal) {
      fetchItems();
      fetchBrands();
      fetchItemNames();
      fetchSummary();
      fetchReleaseRecords();
    }
  }, [showLoginModal]);

  const fetchItems = async () => {
    try {
      const data = await getAssets();
      setItems(data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setSnackbar({ open: true, message: 'Failed to load equipment records.', severity: 'error' });
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await getBrands();
      const mappedBrands = data.map((b, idx) => ({ brand_id: String(idx), brand_name: b }));
      setBrands(mappedBrands);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const fetchItemNames = async () => {
    try {
      const data = await getEquipmentItemNames();
      setItemNames(data);
    } catch (err) {
      console.error('Error fetching item names:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      await getDashboardSummary();
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  };

  const RELEASE_ACTION_TYPES = ['LOCATION_TRANSFER', 'Sent Asset'];
  const fetchReleaseRecords = async () => {
    setReleaseLoading(true);
    try {
      const data = await getTransactions();
      const releases = (Array.isArray(data) ? data : [])
        .filter((t) => RELEASE_ACTION_TYPES.includes(t.action_type));
      setReleaseRecords(releases);
    } catch (err) {
      console.error('Error fetching release records:', err);
    } finally {
      setReleaseLoading(false);
    }
  };

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
  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleBrandSelect = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      brandOption: value,
      brand: value === NEW_BRAND_VALUE ? '' : value,
    }));
  };

  const handleItemNameSelect = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      itemNameOption: value,
      itemName: value === NEW_ITEM_VALUE ? '' : value,
    }));
  };

  const handleEditItemNameSelect = (e) => {
    const value = e.target.value;
    setEditForm((prev) => ({
      ...prev,
      itemNameOption: value,
      itemName: value === NEW_ITEM_VALUE ? '' : value,
    }));
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
    
    // ADDED: Control Number Validation
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
        controlNumber: formData.controlNumber.trim(), // ADDED
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Equipment saved successfully!', severity: 'success' });
      setFormData({ ...emptyAssetForm, controlNumber: '' });
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
  const handleEditChange = (e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  
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
      specifications: item.Specifications || '',
      controlNumber: item.ControlNumber || '', // ADDED
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    const errors = validateAssetForm(editForm);
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
        controlNumber: editForm.controlNumber.trim(), // ADDED
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
    return !transferAmount || Number.isNaN(qty) || qty < 1 || qty > currentSourceBalance || !transferDestLocation || !transferTakenBy.trim();
  }, [transferAmount, currentSourceBalance, transferDestLocation, transferTakenBy]);

  // ---------------- derived data ----------------
  const manageProfile = items.find((i) => i.ProfileKey === manageProfileKey);
  const manageLocation = manageProfile?.location_balances.find((l) => String(l.Id) === String(manageLocationId));
  const openManageDialog = () => {
    setManageProfileKey('');
    setManageLocationId('');
    setManageDialogOpen(true);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? d : date.toLocaleString();
  };

  const filteredReleaseRecords = useMemo(() => {
    const q = releaseSearch.trim().toLowerCase();
    if (!q) return releaseRecords;
    return releaseRecords.filter((r) =>
      (r.asset_name || '').toLowerCase().includes(q) ||
      (r.taken_by || '').toLowerCase().includes(q) ||
      (r.created_by || '').toLowerCase().includes(q)
    );
  }, [releaseRecords, releaseSearch]);

  const pagedReleaseRecords = filteredReleaseRecords.slice(
    releasePage * releaseRowsPerPage, releasePage * releaseRowsPerPage + releaseRowsPerPage
  );

  // ---------------- shared form fields renderer ----------------
  const formFields = (data, handler, itemNameSelectHandler, brandSelectHandler, errors = {}) => (
    <Grid container spacing={2}>
      {/* Item Name Field - Select */}
      {itemNames.length > 0 && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth select label="Item Name *" name="itemNameOption" value={data.itemNameOption || ''}
            onChange={itemNameSelectHandler} error={!!errors.itemName}
            helperText={!data.itemNameOption ? errors.itemName : ''}
          >
            <MenuItem value=" " disabled sx={{ fontFamily: font }}>Select Item Name</MenuItem>
            {itemNames.map((name) => (
              <MenuItem key={name} value={name} sx={{ fontFamily: font }}>
                {name}
              </MenuItem>
            ))}
            <MenuItem value={NEW_ITEM_VALUE} sx={{ fontFamily: font, fontStyle: 'italic' }}>
              Others (Input Manually)
            </MenuItem>
          </TextField>
        </Grid>
      )}
      {/* Item Name Field - Manual Entry */}
      {(itemNames.length === 0 || data.itemNameOption === NEW_ITEM_VALUE) && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth label={itemNames.length === 0 ? "Item Name *" : "Enter New Item Name *"}
            name="itemName" value={data.itemName}
            onChange={handler} error={!!errors.itemName} helperText={errors.itemName}
            inputProps={{ style: { fontFamily: font } }}
          />
        </Grid>
      )}
      {/* Brand Field - Select */}
      {brands.length > 0 && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth select label="Brand *" name="brandOption" value={data.brandOption}
            onChange={brandSelectHandler} error={!!errors.brand}
            helperText={!data.brandOption ? errors.brand : ''}
          >
            <MenuItem value="" disabled sx={{ fontFamily: font }}>Select Brand</MenuItem>
            {brands.map((b) => (
              <MenuItem key={b.brand_id} value={b.brand_name} sx={{ fontFamily: font }}>
                {b.brand_name}
              </MenuItem>
            ))}
            <MenuItem value={NEW_BRAND_VALUE} sx={{ fontFamily: font, fontStyle: 'italic' }}>
              Others (Input Manually)
            </MenuItem>
          </TextField>
        </Grid>
      )}
      {/* Brand Field - Manual Entry */}
      {(brands.length === 0 || data.brandOption === NEW_BRAND_VALUE) && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth label={brands.length === 0 ? "Brand Name *" : "Enter New Brand *"}
            name="brand" value={data.brand}
            onChange={handler} error={!!errors.brand} helperText={errors.brand}
            inputProps={{ style: { fontFamily: font } }}
          />
        </Grid>
      )}
      
      {/* ADDED: Control Number Field */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth label="Control Number *" name="controlNumber" value={data.controlNumber || ''}
          onChange={handler} error={!!errors.controlNumber} helperText={errors.controlNumber}
          inputProps={{ style: { fontFamily: font } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth label="Quantity *" name="quantity" value={data.quantity} onChange={handler}
          type="number" error={!!errors.quantity} helperText={errors.quantity}
          inputProps={{ style: { fontFamily: font }, min: 1 }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField fullWidth select label="Location" name="location" value={data.location} onChange={handler}>
          <MenuItem value="">Select location</MenuItem>
          {LOCATION_OPTIONS.map((l) => (
            <MenuItem key={l} value={l} sx={{ fontFamily: font }}>{l}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          fullWidth label="Specifications *" name="specifications" value={data.specifications} onChange={handler}
          error={!!errors.specifications} helperText={errors.specifications}
          inputProps={{ style: { fontFamily: font } }}
        />
      </Grid>
    </Grid>
  );

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Equipment Encoding" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT ENCODING" />
            {!showLoginModal && (
              <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontFamily: font, fontSize: 14, color: '#555' }}>
                  Logged in as <strong>{loggedInUser}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="outlined" size="small" onClick={() => navigate('/send-asset')} sx={{ fontFamily: font, textTransform: 'none', borderColor: THEME.navy, color: THEME.navy }}>Send Asset</Button>
                  <Button variant="outlined" size="small" onClick={() => navigate('/transactions')} sx={{ fontFamily: font, textTransform: 'none', borderColor: THEME.navy, color: THEME.navy }}>Transaction History</Button>
                  <Button variant="outlined" size="small" color="secondary" onClick={handleLogout} sx={{ fontFamily: font, textTransform: 'none' }}>Logout</Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Header>

      {showLoginModal && (
        <Dialog open disableEscapeKeyDown>
          <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Login Required</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontFamily: font, fontSize: 13, color: '#666', mb: 2 }}>
              You need to login to access equipment encoding.
            </Typography>
            <TextField fullWidth margin="dense" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)} inputProps={{ style: { fontFamily: font } }} />
            <TextField fullWidth margin="dense" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)} inputProps={{ style: { fontFamily: font } }} />
            {loginError && <Typography color="error" sx={{ fontFamily: font, fontSize: 12, mt: 1 }}>{loginError}</Typography>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => navigate('/')} sx={{ fontFamily: font, textTransform: 'none' }}>Back to Home</Button>
            <Button variant="contained" onClick={handleLogin} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Login</Button>
          </DialogActions>
        </Dialog>
      )}

      {!showLoginModal && (
        <Box sx={{ p: 3, maxWidth: 1300, margin: '0 auto' }}>
          <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 20, mb: 3, mt: 1, color: THEME.navy }}>
            Encode New Equipment Asset
          </Typography>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, mb: 4 }}>
            {formFields(formData, handleChange, handleItemNameSelect, handleBrandSelect, formErrors)}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => { setFormData({ ...emptyAssetForm, controlNumber: '' }); setFormErrors({}); }} sx={{ fontFamily: font, textTransform: 'none', px: 4 }}>Clear</Button>
              <Button variant="contained" onClick={handleSubmit} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 4 }}>Save Asset</Button>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 5, mb: 2 }}>
            <Button variant="contained" onClick={openManageDialog} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>
              Manage Items
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: THEME.navy }}>
              Release Records
            </Typography>
            <TextField
              size="small" placeholder="Search item, taken by, released by"
              value={releaseSearch} onChange={(e) => { setReleaseSearch(e.target.value); setReleasePage(0); }}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                style: { fontFamily: font },
              }}
            />
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            {releaseLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: THEME.navy }} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      {['Date Released', 'Qty', 'Item/s', 'Taken By', 'Released By'].map((h) => (
                        <TableCell key={h} sx={{ fontFamily: font, fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedReleaseRecords.map((r) => (
                      <TableRow key={r.transaction_id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{formatDate(r.created_at)}</TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{Math.abs(Number(r.quantity_changed) || 0)}</TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{r.asset_name}</TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{r.taken_by || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{r.created_by || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {filteredReleaseRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ fontFamily: font, py: 4, color: '#888' }}>
                          No release records match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <TablePagination
              component="div"
              count={filteredReleaseRecords.length}
              page={releasePage}
              onPageChange={(_, p) => setReleasePage(p)}
              rowsPerPage={releaseRowsPerPage}
              onRowsPerPageChange={(e) => { setReleaseRowsPerPage(parseInt(e.target.value, 10)); setReleasePage(0); }}
              rowsPerPageOptions={[15, 25, 50]}
              sx={{ fontFamily: font }}
            />
          </Paper>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Edit Equipment Asset Details</DialogTitle>
        <DialogContent dividers>
          {formFields(
            editForm,
            handleEditChange,
            handleEditItemNameSelect,
            (e) => setEditForm((p) => ({ ...p, brandOption: e.target.value, brand: e.target.value === NEW_BRAND_VALUE ? '' : e.target.value })),
            {}
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Delete Equipment</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: font, fontSize: 14 }}>
            Are you sure you want to delete <strong>{selectedItem?.ItemName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} sx={{ backgroundColor: '#c62828', fontFamily: font, textTransform: 'none', px: 3 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Add Stock</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: font, fontSize: 13, color: '#666', mb: 2 }}>
            Asset: <strong>{stockTarget?.ItemName}</strong> — Total Current Stock: <strong>{stockTarget?.TotalQuantity || 0}</strong>
          </Typography>
          <TextField
            fullWidth select label="Location *" value={stockLocation}
            onChange={(e) => { setStockLocation(e.target.value); setStockError(''); }}
            sx={{ mb: 2 }}
          >
            {LOCATION_OPTIONS.map((l) => (
              <MenuItem key={l} value={l} sx={{ fontFamily: font }}>{l}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth autoFocus type="number" label="Additional Quantity *"
            value={stockAmount} onChange={(e) => { setStockAmount(e.target.value); setStockError(''); }}
            error={!!stockError} helperText={stockError}
            inputProps={{ min: 1, style: { fontFamily: font } }}
          />
          {stockAmount && !stockError && Number(stockAmount) > 0 && (
            <Typography sx={{ fontFamily: font, fontSize: 12, color: '#2e7d32', mt: 1 }}>
              New total quantity will be {Number(stockTarget?.TotalQuantity || 0) + Number(stockAmount)}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStockDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmStock} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Location Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Transfer Location</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: font, fontSize: 13, color: '#666', mb: 2 }}>
            Asset: <strong>{transferTarget?.ItemName}</strong> — Brand: <strong>{transferTarget?.Brand || 'N/A'}</strong>
          </Typography>
          <TextField
            fullWidth select label="Source Location *" value={transferSourceId}
            onChange={(e) => { setTransferSourceId(e.target.value); setTransferError(''); }}
            sx={{ mb: 2 }}
          >
            {transferTarget?.location_balances.map((l) => (
              <MenuItem key={l.Id} value={String(l.Id)} sx={{ fontFamily: font }}>
                {l.LocationName} {l.SerialNumber && l.SerialNumber !== 'N/A' && l.SerialNumber !== 'None' ? `[S/N: ${l.SerialNumber}]` : ''} ({l.Quantity} available)
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth select label="Destination Location *" value={transferDestLocation}
            onChange={(e) => { setTransferDestLocation(e.target.value); setTransferError(''); }}
            sx={{ mb: 2 }}
          >
            {LOCATION_OPTIONS.filter((l) => {
              const currentSource = transferTarget?.location_balances.find((x) => String(x.Id) === String(transferSourceId));
              return l !== currentSource?.LocationName;
            }).map((l) => (
              <MenuItem key={l} value={l} sx={{ fontFamily: font }}>{l}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth type="number" label="Transfer Quantity *"
            value={transferAmount} onChange={(e) => { setTransferAmount(e.target.value); setTransferError(''); }}
            error={!!transferError || (transferAmount && Number(transferAmount) > currentSourceBalance)}
            helperText={transferError || (transferAmount && Number(transferAmount) > currentSourceBalance ? `Transfer quantity cannot exceed source balance of ${currentSourceBalance}` : '')}
            inputProps={{ min: 1, style: { fontFamily: font } }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label="Taken By *" placeholder="Name of person taking the item"
            value={transferTakenBy} onChange={(e) => { setTransferTakenBy(e.target.value); setTransferError(''); }}
            inputProps={{ style: { fontFamily: font } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmTransfer} disabled={isTransferInvalid} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Transfer</Button>
        </DialogActions>
      </Dialog>

      {/* Manage Item Dialog */}
      <Dialog open={manageDialogOpen} onClose={() => setManageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Manage Item</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth select label="Select Item *" value={manageProfileKey}
            onChange={(e) => { setManageProfileKey(e.target.value); setManageLocationId(''); }}
            sx={{ mb: 2, mt: 1 }}
          >
            <MenuItem value="" disabled sx={{ fontFamily: font }}>Select an item</MenuItem>
            {items.map((i) => (
              <MenuItem key={i.ProfileKey} value={i.ProfileKey} sx={{ fontFamily: font }}>
                {i.ItemName} {i.Brand && i.Brand !== 'N/A' ? `(${i.Brand})` : ''} — Total Stock: {i.TotalQuantity}
              </MenuItem>
            ))}
          </TextField>
          {manageProfile && (
            <TextField
              fullWidth select label="Select Location *" value={manageLocationId}
              onChange={(e) => setManageLocationId(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled sx={{ fontFamily: font }}>Select a location</MenuItem>
              {manageProfile.location_balances.map((l) => (
                <MenuItem key={l.Id} value={String(l.Id)} sx={{ fontFamily: font }}>
                  {l.LocationName || 'Storage'} — {l.Quantity} {l.Unit || 'Pieces'}
                  {l.SerialNumber && l.SerialNumber !== 'N/A' && l.SerialNumber !== 'None' ? ` [S/N: ${l.SerialNumber}]` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
          {manageLocation && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => { setManageDialogOpen(false); handleOpenStock(manageProfile); }} sx={{ fontFamily: font, textTransform: 'none', color: '#2e7d32', borderColor: '#2e7d32' }}>Add Stock</Button>
              <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={() => { setManageDialogOpen(false); handleOpenTransfer(manageProfile, manageLocation.Id); }} sx={{ fontFamily: font, textTransform: 'none', color: THEME.gold, borderColor: THEME.gold }}>Transfer</Button>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setManageDialogOpen(false); handleOpenEdit({ ...manageProfile, ...manageLocation, Id: manageLocation.Id, Location: manageLocation.LocationName, Quantity: manageLocation.Quantity }); }} sx={{ fontFamily: font, textTransform: 'none', color: THEME.navy, borderColor: THEME.navy }}>Edit</Button>
              <Button variant="outlined" startIcon={<DeleteIcon />} onClick={() => { setManageDialogOpen(false); handleOpenDelete({ Id: manageLocation.Id, ItemName: manageProfile.ItemName, LocationName: manageLocation.LocationName }); }} sx={{ fontFamily: font, textTransform: 'none', color: '#c62828', borderColor: '#c62828' }}>Delete</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setManageDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ fontFamily: font }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default EquipmentEncode;