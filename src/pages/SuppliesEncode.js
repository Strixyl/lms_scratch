import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Typography, Box, Grid, MenuItem, Snackbar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, InputAdornment,
  TablePagination, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import {
  LOCATION_OPTIONS, THEME, getStockStatus, statusColor,
} from '../constants/equipmentConstants';
import {
  getSupplies, createSupply, updateSupply, deleteSupply, addStockToLocation, transferSupply,
  getBrands, createBrand, getSuppliesDashboardSummary as getDashboardSummary,
} from '../api/suppliesApi';

const emptySupplyForm = {
  itemName: '',
  brand: '',
  brandOption: '',
  quantity: '',
  location: '',
  description: '',
  specifications: '',
};

const NEW_BRAND_VALUE = '__new__';
const font = THEME.font;


const SuppliesEncode = () => {
  const navigate = useNavigate();

  // ---- auth (unchanged from existing app) ----
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  // ---- data ----
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [summary, setSummary] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ---- add asset form ----
  const [formData, setFormData] = useState(emptySupplyForm);
  const [formErrors, setFormErrors] = useState({});

  // ---- edit / delete ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState(emptySupplyForm);

  // ---- add stock ----
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [stockError, setStockError] = useState('');
  const [stockLocation, setStockLocation] = useState('');

  // ---- expandable rows ----
  const [expandedRows, setExpandedRows] = useState(new Set());
  const toggleExpand = (profileKey) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(profileKey) ? next.delete(profileKey) : next.add(profileKey);
      return next;
    });

  // ---- transfer modal ----
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferSourceLocation, setTransferSourceLocation] = useState('');
  const [transferDestLocation, setTransferDestLocation] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');

  // ---- search / filter / pagination ----
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const savedUser = localStorage.getItem('suppliesUser');
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
      fetchSummary();
    }
  }, [showLoginModal]);

  const fetchItems = async () => {
    try {
      const data = await getSupplies();
      setItems(data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setSnackbar({ open: true, message: 'Failed to load equipment records.', severity: 'error' });
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      // Fall back to client-side computation below if the endpoint isn't ready yet
      console.error('Error fetching dashboard summary:', err);
    }
  };

  // ---------------- auth handlers ----------------
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'office' && password === '!HLL2025*') {
      localStorage.setItem('suppliesUser', username);
      setLoggedInUser(username);
      setShowLoginModal(false);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('suppliesUser');
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

  const validateAssetForm = (data) => {
    const errors = {};
    if (!data.itemName.trim()) errors.itemName = 'Item name is required.';
    if (brands.length > 0 && !data.brandOption) errors.brand = 'Please select a brand.';
    if (brands.length > 0 && data.brandOption === NEW_BRAND_VALUE && !data.brand.trim()) {
      errors.brand = 'Please enter the new brand name.';
    }
    if (brands.length === 0 && !data.brand.trim()) errors.brand = 'Brand name is required.';
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
      // If the admin typed a brand new brand name, register it first so it's
      // immediately available in future dropdowns (also fine if the backend
      // upserts brands itself — this just guarantees it either way).
      const brandName = formData.brand.trim();
      if (brandName && !brands.some((b) => b.brand_name.toLowerCase() === brandName.toLowerCase())) {
        await createBrand(brandName);
      }

      const quantity = Number(formData.quantity);
      await createSupply({
        itemName: formData.itemName.trim(),
        brand: brandName,
        quantity,
        status: getStockStatus(quantity),
        location: formData.location,
        description: formData.description.trim(),
        specifications: formData.specifications.trim(),
        user: loggedInUser,
      });

      setSnackbar({ open: true, message: 'Supply saved successfully!', severity: 'success' });
      setFormData(emptySupplyForm);
      setFormErrors({});
      fetchItems();
      fetchBrands();
      fetchSummary();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to save supply.';
      setSnackbar({ open: true, message: apiMessage, severity: 'error' });
    }
  };

  // ---------------- edit ----------------
  const handleEditChange = (e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setEditForm({
      itemName: item.ItemName || '',
      brand: item.Brand || '',
      brandOption: item.Brand || '',
      quantity: item.Quantity ?? '',
      location: item.Location || '',
      description: item.Description || '',
      specifications: item.Specifications || '',
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
      await updateSupply(selectedItem.Id, {
        itemName: editForm.itemName.trim(),
        brand: editForm.brand.trim(),
        quantity,
        status: getStockStatus(quantity),
        location: editForm.location,
        description: editForm.description.trim(),
        specifications: editForm.specifications.trim(),
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Supply updated successfully!', severity: 'success' });
      setEditDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to save supply.';
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
      await deleteSupply(selectedItem.Id);
      setSnackbar({ open: true, message: 'Supply deleted successfully!', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to delete supply.';
      setSnackbar({ open: true, message: apiMessage, severity: 'error' });
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
      setStockError('Quantity modifier must be at least 1.');
      return;
    }
    try {
      const existingLoc = stockTarget.location_balances.find((l) => l.LocationName === stockLocation);
      const supplyId = existingLoc ? existingLoc.Id : (stockTarget.location_balances[0]?.Id || null);

      await addStockToLocation({
        supplyId,
        itemName: stockTarget.ItemName,
        brand: stockTarget.Brand,
        location: stockLocation,
        quantity: qty,
        user: loggedInUser,
      });
      setSnackbar({
        open: true,
        message: `Successfully added ${qty} to ${stockLocation}.`,
        severity: 'success',
      });
      setStockDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to add stock.';
      setStockError(apiMessage);
    }
  };

  // ---------------- transfer ----------------
  const handleOpenTransfer = (profile, sourceLocationId = '') => {
    setTransferTarget(profile);
    setTransferSourceId(sourceLocationId);
    if (sourceLocationId) {
      const loc = profile.location_balances.find((l) => l.Id === sourceLocationId);
      setTransferSourceLocation(loc ? loc.LocationName : '');
    } else {
      setTransferSourceLocation(profile.location_balances[0]?.LocationName || '');
    }
    setTransferDestLocation('');
    setTransferAmount('');
    setTransferError('');
    setTransferDialogOpen(true);
  };

  const handleConfirmTransfer = async () => {
    const sourceLoc = transferTarget.location_balances.find((l) => l.LocationName === transferSourceLocation);
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

    try {
      await transferSupply(sourceLoc.Id, {
        destinationLocation: transferDestLocation,
        quantity: qty,
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: `Successfully transferred ${qty} to ${transferDestLocation}.`, severity: 'success' });
      setTransferDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      setTransferError(err.response?.data?.message || 'Failed to transfer supply.');
    }
  };

  const currentSourceBalance = useMemo(() => {
    if (!transferTarget || !transferSourceLocation) return 0;
    const loc = transferTarget.location_balances.find((l) => l.LocationName === transferSourceLocation);
    return loc ? loc.Quantity : 0;
  }, [transferTarget, transferSourceLocation]);

  const isTransferInvalid = useMemo(() => {
    const qty = Number(transferAmount);
    return !transferAmount || Number.isNaN(qty) || qty < 1 || qty > currentSourceBalance || !transferDestLocation;
  }, [transferAmount, currentSourceBalance, transferDestLocation]);

  // ---------------- derived data ----------------
  const filteredItems = useMemo(() => {
    return items.filter((profile) => {
      const status = getStockStatus(profile.TotalQuantity);
      const matchesStatus = statusFilter === 'All' || status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [
        profile.ItemName, profile.Brand,
        ...(profile.location_balances || []).map((l) => l.LocationName),
      ].some((f) => (f || '').toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  const pagedItems = filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const localSummary = useMemo(() => {
    const totalItems = items.length;
    const totalInventory = items.reduce((sum, p) => sum + p.TotalQuantity, 0);
    const lowStock = items.filter((p) => getStockStatus(p.TotalQuantity) === 'Low Stock').length;
    return { totalItems, totalInventory, lowStock };
  }, [items]);

  // ---------------- shared form fields renderer ----------------
  const brandField = (data, handler, brandSelectHandler, errors) => {
    if (brands.length === 0) {
      // No brands exist yet -> plain text input, first save seeds the master list
      return (
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth label="Brand Name *" name="brand" value={data.brand}
            onChange={handler} error={!!errors.brand} helperText={errors.brand}
            inputProps={{ style: { fontFamily: font } }}
          />
        </Grid>
      );
    }
    return (
      <>
        <Grid item xs={12} sm={6} md={4}>
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
        {data.brandOption === NEW_BRAND_VALUE && (
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth label="Enter New Brand *" name="brand" value={data.brand}
              onChange={handler} error={!!errors.brand} helperText={errors.brand}
              inputProps={{ style: { fontFamily: font } }}
            />
          </Grid>
        )}
      </>
    );
  };

  const formFields = (data, handler, brandSelectHandler, errors = {}) => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth label="Item Name *" name="itemName" value={data.itemName} onChange={handler}
          error={!!errors.itemName} helperText={errors.itemName}
          inputProps={{ style: { fontFamily: font } }}
        />
      </Grid>
      {brandField(data, handler, brandSelectHandler, errors)}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth label="Quantity *" name="quantity" value={data.quantity} onChange={handler}
          type="number" error={!!errors.quantity} helperText={errors.quantity}
          inputProps={{ style: { fontFamily: font }, min: 1 }}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth select label="Location" name="location" value={data.location} onChange={handler}>
          <MenuItem value="">Select location</MenuItem>
          {LOCATION_OPTIONS.map((l) => (
            <MenuItem key={l} value={l} sx={{ fontFamily: font }}>{l}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth label="Description" name="description" value={data.description} onChange={handler}
          inputProps={{ style: { fontFamily: font } }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth label="Specifications" name="specifications" value={data.specifications} onChange={handler}
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
            <TopBar title="Equipment Encoding" onMenuClick={toggleDrawer} subtitle="OFFICE SUPPLIES ENCODING" />
            {!showLoginModal && (
              <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontFamily: font, fontSize: 14, color: '#555' }}>
                  Logged in as <strong>{loggedInUser}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined" size="small"
                    onClick={() => navigate('/send-supply')}
                    sx={{ fontFamily: font, textTransform: 'none', borderColor: THEME.navy, color: THEME.navy }}
                  >
                    Send Asset
                  </Button>
                  <Button
                    variant="outlined" size="small"
                    onClick={() => navigate('/supply-transactions')}
                    sx={{ fontFamily: font, textTransform: 'none', borderColor: THEME.navy, color: THEME.navy }}
                  >
                    Transaction History
                  </Button>
                  <Button variant="outlined" size="small" color="secondary" onClick={handleLogout} sx={{ fontFamily: font, textTransform: 'none' }}>
                    Logout
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Header>

      {/* Login Dialog — conditionally rendered so it fully unmounts when logged in */}
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
      )}      {!showLoginModal && (
        <Box sx={{ p: 3, maxWidth: 1300, margin: '0 auto' }}>

          <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 20, mb: 3, mt: 1, color: THEME.navy }}>
            Encode New Supply Item
          </Typography>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, mb: 4 }}>
            {formFields(formData, handleChange, handleBrandSelect, formErrors)}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => { setFormData(emptySupplyForm); setFormErrors({}); }} sx={{ fontFamily: font, textTransform: 'none', px: 4 }}>Clear</Button>
              <Button variant="contained" onClick={handleSubmit} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 4 }}>Save Supply</Button>
            </Box>
          </Paper>

          {/* ---- Records header: search + filter ---- */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mt: 5, mb: 2 }}>
            <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: THEME.navy }}>
              Supplies Records
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                size="small" placeholder="Search item, brand, location"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                sx={{ minWidth: 280 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  style: { fontFamily: font },
                }}
              />
              <TextField
                size="small" select value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                sx={{ minWidth: 160, fontFamily: font }}
              >
                {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontFamily: font }}>{s}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#fafafa' }}>
                    {['', 'Item Name', 'Brand', 'Total Qty', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontFamily: font, fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedItems.map((profile) => {
                    const status = getStockStatus(profile.TotalQuantity);
                    const sc = statusColor(status);
                    const isOpen = expandedRows.has(profile.ProfileKey);
                    return (
                      <React.Fragment key={profile.ProfileKey}>
                        <TableRow sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ width: 32 }}>
                            <IconButton size="small" onClick={() => toggleExpand(profile.ProfileKey)}>
                              {isOpen ? '▼' : '►'}
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{profile.ItemName}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>
                            {profile.Brand && profile.Brand !== 'N/A' ? profile.Brand : <span style={{ color: '#aaa', fontStyle: 'italic' }}>N/A</span>}
                          </TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{profile.TotalQuantity}</TableCell>
                          <TableCell>
                            <Chip label={status} size="small" sx={{ fontFamily: font, fontWeight: 600, fontSize: 11, backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }} />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Add Stock">
                              <IconButton size="small" onClick={() => handleOpenStock(profile)} sx={{ color: '#2e7d32' }}>
                                <AddCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Transfer Location">
                              <IconButton size="small" onClick={() => handleOpenTransfer(profile)} sx={{ color: THEME.gold }}>
                                🔄
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {isOpen && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ backgroundColor: '#fafcff', py: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    {['Location', 'Qty', 'Status', 'Actions'].map((h) => (
                                      <TableCell key={h} sx={{ fontFamily: font, fontWeight: 700, fontSize: 10, color: '#888', textTransform: 'uppercase' }}>{h}</TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {profile.location_balances.map((loc) => {
                                    const locSc = statusColor(loc.Status);
                                    return (
                                      <TableRow key={loc.Id}>
                                        <TableCell sx={{ fontFamily: font, fontSize: 12 }}>
                                          {loc.LocationName && loc.LocationName !== 'N/A' ? loc.LocationName : <span style={{ color: '#aaa', fontStyle: 'italic' }}>N/A</span>}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: font, fontSize: 12 }}>{loc.Quantity}</TableCell>
                                        <TableCell>
                                          <Chip label={loc.Status} size="small" sx={{ fontFamily: font, fontSize: 10, backgroundColor: locSc.bg, color: locSc.text }} />
                                        </TableCell>
                                        <TableCell>
                                          <Tooltip title="Transfer Location">
                                            <IconButton size="small" onClick={() => handleOpenTransfer(profile, loc.Id)} sx={{ color: THEME.gold }}>
                                              🔄
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleOpenEdit({ ...profile, ...loc, Id: loc.Id, Location: loc.LocationName, Quantity: loc.Quantity })} sx={{ color: THEME.navy }}>
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => handleOpenDelete({ Id: loc.Id, ItemName: profile.ItemName, LocationName: loc.LocationName })} sx={{ color: '#c62828' }}>
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {pagedItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ fontFamily: font, py: 4, color: '#888' }}>
                        No supply records match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredItems.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ fontFamily: font }}
            />
          </Paper>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Edit Supply Details</DialogTitle>
        <DialogContent dividers>{formFields(editForm, handleEditChange, (e) => setEditForm((p) => ({ ...p, brandOption: e.target.value, brand: e.target.value === NEW_BRAND_VALUE ? '' : e.target.value })))}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Delete Supply</DialogTitle>
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
            fullWidth select label="Source Location *" value={transferSourceLocation}
            onChange={(e) => { setTransferSourceLocation(e.target.value); setTransferError(''); }}
            sx={{ mb: 2 }}
          >
            {transferTarget?.location_balances.map((l) => (
              <MenuItem key={l.Id} value={l.LocationName} sx={{ fontFamily: font }}>
                {l.LocationName} ({l.Quantity} available)
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth select label="Destination Location *" value={transferDestLocation}
            onChange={(e) => { setTransferDestLocation(e.target.value); setTransferError(''); }}
            sx={{ mb: 2 }}
          >
            {LOCATION_OPTIONS.filter((l) => l !== transferSourceLocation).map((l) => (
              <MenuItem key={l} value={l} sx={{ fontFamily: font }}>{l}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth autoFocus type="number" label="Transfer Quantity *"
            value={transferAmount} onChange={(e) => { setTransferAmount(e.target.value); setTransferError(''); }}
            error={!!transferError || (transferAmount && Number(transferAmount) > currentSourceBalance)}
            helperText={transferError || (transferAmount && Number(transferAmount) > currentSourceBalance ? `Transfer quantity cannot exceed source balance of ${currentSourceBalance}` : '')}
            inputProps={{ min: 1, style: { fontFamily: font } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmTransfer} disabled={isTransferInvalid} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Transfer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ fontFamily: font }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default SuppliesEncode;