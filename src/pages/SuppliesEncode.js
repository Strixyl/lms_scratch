import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Typography, Box, Grid, MenuItem, Snackbar, Alert,
  Accordion, AccordionSummary, AccordionDetails, Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { THEME, getStockStatus } from '../constants/equipmentConstants';
import {
  getSupplies, createSupply, updateSupply, deleteSupply,
  getBrands, createBrand, getSuppliesItemNames,
} from '../api/suppliesApi';

const UNIT_OPTIONS = ['Pieces', 'Boxes', 'Reams', 'Packs'];
const emptySupplyForm = { itemName: '', itemNameOption: '', brand: '', brandOption: '', quantity: '', unit: 'Pieces', specifications: '' };
const NEW_BRAND_VALUE = 'new';
const NEW_ITEM_VALUE = 'NEW_ITEM';
const font = THEME.font;

const SuppliesEncode = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  const [items, setItems] = useState([]);
  const [itemNames, setItemNames] = useState([]);
  const [brands, setBrands] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState(emptySupplyForm);
  const [formErrors, setFormErrors] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState(emptySupplyForm);

  useEffect(() => {
    const savedUser = localStorage.getItem('suppliesUser');
    if (savedUser) { setLoggedInUser(savedUser); setUsername(savedUser); setShowLoginModal(false); }
  }, []);

  useEffect(() => {
    if (!showLoginModal) { fetchItems(); fetchBrands(); fetchItemNames(); }
  }, [showLoginModal]);

  const fetchItems = async () => { try { setItems(await getSupplies()); } catch (err) { setSnackbar({ open: true, message: 'Failed to load.', severity: 'error' }); } };
  const fetchBrands = async () => { try { const data = await getBrands(); setBrands(data.map((b, idx) => ({ brand_id: String(idx), brand_name: b }))); } catch (err) { console.error(err); } };
  const fetchItemNames = async () => { try { setItemNames(await getSuppliesItemNames()); } catch (err) { console.error(err); } };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'office' && password === '!HLL2025*') {
      localStorage.setItem('suppliesUser', username);
      setLoggedInUser(username); setShowLoginModal(false); setLoginError('');
    } else { setLoginError('Invalid credentials.'); }
  };

  const handleLogout = () => { localStorage.removeItem('suppliesUser'); setLoggedInUser(''); setShowLoginModal(true); setUsername(''); setPassword(''); };
  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBrandSelect = (e) => setFormData((prev) => ({ ...prev, brandOption: e.target.value, brand: e.target.value === NEW_BRAND_VALUE ? '' : e.target.value }));
  const handleItemNameSelect = (e) => setFormData((prev) => ({ ...prev, itemNameOption: e.target.value, itemName: e.target.value === NEW_ITEM_VALUE ? '' : e.target.value }));
  const handleEditItemNameSelect = (e) => setEditForm((prev) => ({ ...prev, itemNameOption: e.target.value, itemName: e.target.value === NEW_ITEM_VALUE ? '' : e.target.value }));

  const validateAssetForm = (data) => {
    const errors = {};
    if (itemNames.length > 0 && !data.itemNameOption) errors.itemName = 'Please select an item name.';
    if (itemNames.length > 0 && data.itemNameOption === NEW_ITEM_VALUE && !data.itemName.trim()) errors.itemName = 'Please enter the item name.';
    if (itemNames.length === 0 && !data.itemName.trim()) errors.itemName = 'Item name is required.';
    if (brands.length > 0 && !data.brandOption) errors.brand = 'Please select a brand.';
    if (brands.length > 0 && data.brandOption === NEW_BRAND_VALUE && !data.brand.trim()) errors.brand = 'Please enter the new brand name.';
    if (brands.length === 0 && !data.brand.trim()) errors.brand = 'Brand name is required.';
    if (!data.specifications || !data.specifications.trim() || data.specifications.trim().toUpperCase() === 'N/A') errors.specifications = 'Specifications are required.';
    const qty = Number(data.quantity);
    if (data.quantity === '' || Number.isNaN(qty) || qty < 1) errors.quantity = 'Quantity must be at least 1.';
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateAssetForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const brandName = formData.brand.trim();
      if (brandName && !brands.some((b) => b.brand_name.toLowerCase() === brandName.toLowerCase())) await createBrand(brandName);
      
      await createSupply({
        itemName: formData.itemName.trim(), brand: brandName, quantity: Number(formData.quantity),
        status: getStockStatus(Number(formData.quantity)), specifications: formData.specifications.trim() || 'N/A',
        unit: formData.unit, user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Supply saved successfully!', severity: 'success' });
      setFormData(emptySupplyForm); setFormErrors({});
      fetchItems(); fetchBrands(); fetchItemNames();
    } catch (err) {
      const apiMessage = err?.response?.data?.message || 'Failed to save supply.';
      setSnackbar({ open: true, message: apiMessage, severity: 'error' });
    }
  };

  const handleEditChange = (e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    const existingBrand = brands.some((b) => b.brand_name.toLowerCase() === (item.Brand || '').toLowerCase());
    const existingItemName = itemNames.some((n) => n.toLowerCase() === (item.ItemName || '').toLowerCase());
    setEditForm({
      itemName: item.ItemName || '', itemNameOption: existingItemName ? item.ItemName : NEW_ITEM_VALUE,
      brand: item.Brand || '', brandOption: existingBrand ? item.Brand : NEW_BRAND_VALUE,
      quantity: item.Quantity ?? '', unit: item.Unit || 'Pieces',
      specifications: item.Specifications === 'N/A' ? '' : item.Specifications || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    const errors = validateAssetForm(editForm);
    if (Object.keys(errors).length > 0) { setSnackbar({ open: true, message: 'Please fix the highlighted fields.', severity: 'error' }); return; }
    try {
      await updateSupply(selectedItem.Id, {
        itemName: editForm.itemName.trim(), brand: editForm.brand.trim(), quantity: Number(editForm.quantity),
        status: getStockStatus(Number(editForm.quantity)), specifications: editForm.specifications.trim() || 'N/A',
        unit: editForm.unit, user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Supply updated successfully!', severity: 'success' });
      setEditDialogOpen(false); fetchItems();
    } catch (err) { setSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to update.', severity: 'error' }); }
  };

  const handleOpenDelete = (item) => { setSelectedItem(item); setDeleteDialogOpen(true); };
  const handleDelete = async () => {
    try { await deleteSupply(selectedItem.Id); setSnackbar({ open: true, message: 'Supply deleted successfully!', severity: 'success' }); setDeleteDialogOpen(false); fetchItems(); } 
    catch (err) { setSnackbar({ open: true, message: 'Failed to delete.', severity: 'error' }); }
  };

  const formFields = (data, handler, itemNameSelectHandler, brandSelectHandler, errors = {}) => (
    <Grid container spacing={2}>
      {itemNames.length > 0 && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField fullWidth select label="Item Name *" name="itemNameOption" value={data.itemNameOption || ''} onChange={itemNameSelectHandler} error={!!errors.itemName} helperText={!data.itemNameOption ? errors.itemName : ''}>
            <MenuItem value=" " disabled sx={{ fontFamily: font }}>Select Item Name</MenuItem>
            {itemNames.map((name) => (<MenuItem key={name} value={name} sx={{ fontFamily: font }}>{name}</MenuItem>))}
            <MenuItem value={NEW_ITEM_VALUE} sx={{ fontFamily: font, fontStyle: 'italic' }}>Others (Input Manually)</MenuItem>
          </TextField>
        </Grid>
      )}
      {(itemNames.length === 0 || data.itemNameOption === NEW_ITEM_VALUE) && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField fullWidth label={itemNames.length === 0 ? "Item Name *" : "Enter New Item Name *"} name="itemName" value={data.itemName} onChange={handler} error={!!errors.itemName} helperText={errors.itemName} inputProps={{ style: { fontFamily: font } }} />
        </Grid>
      )}
      {brands.length > 0 && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField fullWidth select label="Brand *" name="brandOption" value={data.brandOption} onChange={brandSelectHandler} error={!!errors.brand} helperText={!data.brandOption ? errors.brand : ''}>
            <MenuItem value="" disabled sx={{ fontFamily: font }}>Select Brand</MenuItem>
            {brands.map((b) => (<MenuItem key={b.brand_id} value={b.brand_name} sx={{ fontFamily: font }}>{b.brand_name}</MenuItem>))}
            <MenuItem value={NEW_BRAND_VALUE} sx={{ fontFamily: font, fontStyle: 'italic' }}>Others (Input Manually)</MenuItem>
          </TextField>
        </Grid>
      )}
      {(brands.length === 0 || data.brandOption === NEW_BRAND_VALUE) && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField fullWidth label={brands.length === 0 ? "Brand Name *" : "Enter New Brand *"} name="brand" value={data.brand} onChange={handler} error={!!errors.brand} helperText={errors.brand} inputProps={{ style: { fontFamily: font } }} />
        </Grid>
      )}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField fullWidth select label="Unit *" name="unit" value={data.unit} onChange={handler}>
          {UNIT_OPTIONS.map((u) => (<MenuItem key={u} value={u} sx={{ fontFamily: font }}>{u}</MenuItem>))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField fullWidth label="Quantity *" name="quantity" value={data.quantity} onChange={handler} type="number" error={!!errors.quantity} helperText={errors.quantity} inputProps={{ style: { fontFamily: font }, min: 1 }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField fullWidth label="Specifications *" name="specifications" value={data.specifications} onChange={handler} error={!!errors.specifications} helperText={errors.specifications} placeholder="e.g., Size: A4, 80gsm" inputProps={{ style: { fontFamily: font } }} />
      </Grid>
    </Grid>
  );

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Supplies Encoding" onMenuClick={toggleDrawer} subtitle="OFFICE SUPPLIES ENCODING" />
            {!showLoginModal && (
              <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontFamily: font, fontSize: 14, color: '#555' }}>Logged in as <strong>{loggedInUser}</strong></Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="outlined" size="small" onClick={() => navigate('/supplies')} sx={{ fontFamily: font, textTransform: 'none', borderColor: THEME.navy, color: THEME.navy }}>Supplies Inventory</Button>
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
            <Typography sx={{ fontFamily: font, fontSize: 13, color: '#666', mb: 2 }}>You need to login to access supplies encoding.</Typography>
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
          <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 20, mb: 3, mt: 1, color: THEME.navy }}>Encode New Supply Item</Typography>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, mb: 4 }}>
            {formFields(formData, handleChange, handleItemNameSelect, handleBrandSelect, formErrors)}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => { setFormData(emptySupplyForm); setFormErrors({}); }} sx={{ fontFamily: font, textTransform: 'none', px: 4 }}>Clear</Button>
              <Button variant="contained" onClick={handleSubmit} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 4 }}>Save Supply</Button>
            </Box>
          </Paper>

          <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: THEME.navy, mb: 2 }}>Encoded Records</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {items.length === 0 ? (
              <Typography sx={{ fontFamily: font, color: '#888', textAlign: 'center', py: 4 }}>No records found.</Typography>
            ) : (
              items.map((item) => (
                <Accordion key={item.Id || item.ProfileKey} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px !important', mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#fafafa' }}>
                    <Typography sx={{ fontFamily: font, fontWeight: 600, fontSize: 14 }}>{item.ItemName}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}><Typography sx={{ fontFamily: font, fontSize: 13, color: '#555' }}><strong>Item Code:</strong> {item.ItemCode || 'N/A'}</Typography></Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}><Typography sx={{ fontFamily: font, fontSize: 13, color: '#555' }}><strong>Brand:</strong> {item.Brand || 'N/A'}</Typography></Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}><Typography sx={{ fontFamily: font, fontSize: 13, color: '#555' }}><strong>Unit:</strong> {item.Unit || 'Pieces'}</Typography></Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}><Typography sx={{ fontFamily: font, fontSize: 13, color: '#555' }}><strong>Quantity:</strong> {item.TotalQuantity || item.Quantity || 0}</Typography></Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}><Typography sx={{ fontFamily: font, fontSize: 13, color: '#555' }}><strong>Specifications:</strong> {item.Specifications || 'N/A'}</Typography></Grid>
                      <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEdit(item)} sx={{ fontFamily: font, textTransform: 'none', color: THEME.navy }}>Edit</Button>
                        <Button size="small" startIcon={<DeleteIcon />} onClick={() => handleOpenDelete(item)} sx={{ fontFamily: font, textTransform: 'none', color: '#c62828' }}>Delete</Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        </Box>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Edit Supply Details</DialogTitle>
        <DialogContent dividers>
          {formFields(editForm, handleEditChange, handleEditItemNameSelect, (e) => setEditForm((p) => ({ ...p, brandOption: e.target.value, brand: e.target.value === NEW_BRAND_VALUE ? '' : e.target.value })), {})}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 3 }}>Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: font, fontWeight: 700 }}>Delete Supply</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: font, fontSize: 14 }}>Are you sure you want to delete <strong>{selectedItem?.ItemName}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontFamily: font, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} sx={{ backgroundColor: '#c62828', fontFamily: font, textTransform: 'none', px: 3 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ fontFamily: font }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default SuppliesEncode;