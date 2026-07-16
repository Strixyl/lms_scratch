import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Typography, Box, Grid, MenuItem, Snackbar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, InputAdornment, Card,
  TablePagination, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LayersIcon from '@mui/icons-material/Layers';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import OutboxIcon from '@mui/icons-material/Outbox';
import { useNavigate } from 'react-router-dom';

import {
  LOCATION_OPTIONS, THEME, emptyAssetForm, getStockStatus, statusColor,
} from '../constants/equipmentConstants';
import {
  getAssets, createAsset, updateAsset, deleteAsset, addStock,
  getBrands, createBrand, getDashboardSummary,
} from '../api/equipmentApi';

const NEW_BRAND_VALUE = '__new__';
const font = THEME.font;

const SummaryCard = ({ icon, label, value, accent }) => (
  <Card
    elevation={0}
    sx={{
      p: 2.5, borderRadius: 3, border: '1px solid #e0e0e0',
      display: 'flex', alignItems: 'center', gap: 2, height: '100%',
    }}
  >
    <Box sx={{
      width: 46, height: 46, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: `${accent}1a`, color: accent,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontFamily: font, fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
        {value}
      </Typography>
    </Box>
  </Card>
);

const EquipmentEncode = () => {
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
  const [formData, setFormData] = useState(emptyAssetForm);
  const [formErrors, setFormErrors] = useState({});

  // ---- edit / delete ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyAssetForm);

  // ---- add stock ----
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [stockError, setStockError] = useState('');

  // ---- search / filter / pagination ----
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      fetchSummary();
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
      await createAsset({
        itemName: formData.itemName.trim(),
        brand: brandName,
        quantity,
        status: getStockStatus(quantity),
        serialNumber: formData.serialNumber.trim(),
        location: formData.location,
        description: formData.description.trim(),
        specifications: formData.specifications.trim(),
        user: loggedInUser,
      });

      setSnackbar({ open: true, message: 'Equipment saved successfully!', severity: 'success' });
      setFormData(emptyAssetForm);
      setFormErrors({});
      fetchItems();
      fetchBrands();
      fetchSummary();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to save equipment.', severity: 'error' });
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
      serialNumber: item.SerialNumber || '',
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
      await updateAsset(selectedItem.Id, {
        itemName: editForm.itemName.trim(),
        brand: editForm.brand.trim(),
        quantity,
        status: getStockStatus(quantity),
        serialNumber: editForm.serialNumber.trim(),
        location: editForm.location,
        description: editForm.description.trim(),
        specifications: editForm.specifications.trim(),
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Equipment updated successfully!', severity: 'success' });
      setEditDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update equipment.', severity: 'error' });
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
  const handleOpenStock = (item) => {
    setStockTarget(item);
    setStockAmount('');
    setStockError('');
    setStockDialogOpen(true);
  };

  const handleConfirmStock = async () => {
    const qty = Number(stockAmount);
    if (!stockAmount || Number.isNaN(qty) || qty < 1) {
      setStockError('Additional quantity must be at least 1.');
      return;
    }
    try {
      await addStock(stockTarget.Id, qty, loggedInUser);
      setSnackbar({
        open: true,
        message: `Stock updated: ${stockTarget.Quantity} + ${qty} = ${Number(stockTarget.Quantity) + qty}.`,
        severity: 'success',
      });
      setStockDialogOpen(false);
      fetchItems();
      fetchSummary();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add stock.', severity: 'error' });
    }
  };

  // ---------------- derived data ----------------
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const status = getStockStatus(item.Quantity);
      const matchesStatus = statusFilter === 'All' || status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [item.ItemName, item.Brand, item.SerialNumber, item.Location]
        .some((f) => (f || '').toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  const pagedItems = filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const localSummary = useMemo(() => {
    const totalAssets = items.length;
    const totalInventory = items.reduce((sum, i) => sum + (Number(i.Quantity) || 0), 0);
    const lowStock = items.filter((i) => getStockStatus(i.Quantity) === 'Low Stock').length;
    return { totalAssets, totalInventory, lowStock };
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
        <TextField
          fullWidth label="Serial Number" name="serialNumber" value={data.serialNumber} onChange={handler}
          inputProps={{ style: { fontFamily: font } }}
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
            <TopBar title="Equipment Encoding" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT ENCODING" />
            {!showLoginModal && (
              <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontFamily: font, fontSize: 14, color: '#555' }}>
                  Logged in as <strong>{loggedInUser}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined" size="small"
                    onClick={() => navigate('/send-asset')}
                    sx={{ fontFamily: font, textTransform: 'none', borderColor: THEME.navy, color: THEME.navy }}
                  >
                    Send Asset
                  </Button>
                  <Button
                    variant="outlined" size="small"
                    onClick={() => navigate('/transactions')}
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
      )}

      {!showLoginModal && (
        <Box sx={{ p: 3, maxWidth: 1300, margin: '0 auto' }}>

          {/* ---- Dashboard summary cards ---- */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard icon={<Inventory2Icon />} label="Total Assets" value={summary?.totalAssets ?? localSummary.totalAssets} accent={THEME.navy} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard icon={<LayersIcon />} label="Total Inventory" value={summary?.totalInventory ?? localSummary.totalInventory} accent="#2e7d32" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard icon={<WarningAmberIcon />} label="Low Stock Items" value={summary?.lowStock ?? localSummary.lowStock} accent="#e65100" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard icon={<OutboxIcon />} label="Assets Sent Today" value={summary?.sentToday ?? 0} accent={THEME.gold} />
            </Grid>
          </Grid>

          <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 20, mb: 3, color: THEME.navy }}>
            Encode New Equipment Asset
          </Typography>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, mb: 4 }}>
            {formFields(formData, handleChange, handleBrandSelect, formErrors)}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => { setFormData(emptyAssetForm); setFormErrors({}); }} sx={{ fontFamily: font, textTransform: 'none', px: 4 }}>Clear</Button>
              <Button variant="contained" onClick={handleSubmit} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 4 }}>Save Asset</Button>
            </Box>
          </Paper>

          {/* ---- Records header: search + filter ---- */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mt: 5, mb: 2 }}>
            <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: THEME.navy }}>
              Equipment Records
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                size="small" placeholder="Search item, brand, serial no., location"
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
                    {['Item Name', 'Brand', 'Qty', 'Status', 'Serial No.', 'Location', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontFamily: font, fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedItems.map((item) => {
                    const status = getStockStatus(item.Quantity);
                    const sc = statusColor(status);
                    return (
                      <TableRow key={item.Id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{item.ItemName}</TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{item.Brand || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{item.Quantity}</TableCell>
                        <TableCell>
                          <Chip label={status} size="small" sx={{ fontFamily: font, fontWeight: 600, fontSize: 11, backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{item.SerialNumber || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{item.Location || '—'}</TableCell>
                        <TableCell>
                          <Tooltip title="Add Stock">
                            <IconButton size="small" onClick={() => handleOpenStock(item)} sx={{ color: '#2e7d32' }}>
                              <AddCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ color: THEME.navy }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleOpenDelete(item)} sx={{ color: '#c62828' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pagedItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ fontFamily: font, py: 4, color: '#888' }}>
                        No equipment records match your search.
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
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Edit Equipment Asset Details</DialogTitle>
        <DialogContent dividers>{formFields(editForm, handleEditChange, (e) => setEditForm((p) => ({ ...p, brandOption: e.target.value, brand: e.target.value === NEW_BRAND_VALUE ? '' : e.target.value })))}</DialogContent>
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
            Asset: <strong>{stockTarget?.ItemName}</strong> — Current Stock: <strong>{stockTarget?.Quantity}</strong>
          </Typography>
          <TextField
            fullWidth autoFocus type="number" label="Additional Quantity *"
            value={stockAmount} onChange={(e) => { setStockAmount(e.target.value); setStockError(''); }}
            error={!!stockError} helperText={stockError}
            inputProps={{ min: 1, style: { fontFamily: font } }}
          />
          {stockAmount && !stockError && Number(stockAmount) > 0 && (
            <Typography sx={{ fontFamily: font, fontSize: 12, color: '#2e7d32', mt: 1 }}>
              New quantity will be {Number(stockTarget?.Quantity || 0) + Number(stockAmount)}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStockDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmStock} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ fontFamily: font }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default EquipmentEncode;