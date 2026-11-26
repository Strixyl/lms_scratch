import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Typography, Box, MenuItem, Snackbar, Alert,
  Accordion, AccordionSummary, AccordionDetails, Paper, Chip,
  InputAdornment, IconButton, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LogoutIcon from '@mui/icons-material/Logout';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useNavigate } from 'react-router-dom';
import { LOW_STOCK_THRESHOLD, getStockStatus } from '../constants/equipmentConstants';
import {
  getSupplies, createSupply, updateSupply, deleteSupply,
  getBrands, createBrand, getSuppliesItemNames,
} from '../api/suppliesApi';
import {
  InventoryPageShell,
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
  formatUnitShort,
} from '../Components/InventoryLayout';

const UNIT_OPTIONS = ['Pieces', 'Boxes', 'Reams', 'Packs'];
const emptySupplyForm = {
  itemName: '',
  itemNameOption: '',
  brand: '',
  brandOption: '',
  quantity: '',
  unit: 'Pieces',
  specifications: '',
};
const NEW_BRAND_VALUE = 'new';
const NEW_ITEM_VALUE = 'NEW_ITEM';

const SuppliesEncode = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemNames, setItemNames] = useState([]);
  const [brands, setBrands] = useState([]);
  const [recordSearch, setRecordSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState(emptySupplyForm);
  const [formErrors, setFormErrors] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState(emptySupplyForm);
  const [editErrors, setEditErrors] = useState({});

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
      fetchItemNames();
    }
  }, [showLoginModal]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const data = await getSupplies();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load.', severity: 'error' });
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await getBrands();
      setBrands((Array.isArray(data) ? data : []).map((b, idx) => ({ brand_id: String(idx), brand_name: b })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItemNames = async () => {
    try {
      const data = await getSuppliesItemNames();
      setItemNames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

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
    if (itemNames.length > 0 && !data.itemNameOption) errors.itemName = 'Please select an item name.';
    if (itemNames.length > 0 && data.itemNameOption === NEW_ITEM_VALUE && !data.itemName.trim()) {
      errors.itemName = 'Please enter the item name.';
    }
    if (itemNames.length === 0 && !data.itemName.trim()) errors.itemName = 'Item name is required.';
    if (brands.length > 0 && !data.brandOption) errors.brand = 'Please select a brand.';
    if (brands.length > 0 && data.brandOption === NEW_BRAND_VALUE && !data.brand.trim()) {
      errors.brand = 'Please enter the new brand name.';
    }
    if (brands.length === 0 && !data.brand.trim()) errors.brand = 'Brand name is required.';
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

      await createSupply({
        itemName: formData.itemName.trim(),
        brand: brandName,
        quantity: Number(formData.quantity),
        status: getStockStatus(Number(formData.quantity)),
        specifications: formData.specifications.trim() || 'N/A',
        unit: formData.unit,
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Supply saved successfully!', severity: 'success' });
      setFormData(emptySupplyForm);
      setFormErrors({});
      fetchItems();
      fetchBrands();
      fetchItemNames();
    } catch (err) {
      const apiMessage = err?.response?.data?.message || 'Failed to save supply.';
      setSnackbar({ open: true, message: apiMessage, severity: 'error' });
    }
  };

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
      unit: item.Unit || 'Pieces',
      specifications: item.Specifications === 'N/A' ? '' : item.Specifications || '',
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
      await updateSupply(selectedItem.Id, {
        itemName: editForm.itemName.trim(),
        brand: editForm.brand.trim(),
        quantity: Number(editForm.quantity),
        status: getStockStatus(Number(editForm.quantity)),
        specifications: editForm.specifications.trim() || 'N/A',
        unit: editForm.unit,
        user: loggedInUser,
      });
      setSnackbar({ open: true, message: 'Supply updated successfully!', severity: 'success' });
      setEditDialogOpen(false);
      fetchItems();
      fetchBrands();
      fetchItemNames();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Failed to update.',
        severity: 'error',
      });
    }
  };

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
      fetchItemNames();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete.', severity: 'error' });
    }
  };

  // Group supply records by ItemName so collapsed accordion headers summarize variants & stock cleanly
  const groupedItems = useMemo(() => {
    const groupsMap = new Map();
    items.forEach((item) => {
      const displayName = (item.ItemName || 'Unnamed Item').trim();
      const key = displayName.toLowerCase();
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          itemName: displayName,
          variants: [],
          totalQuantity: 0,
          units: new Set(),
        });
      }
      const group = groupsMap.get(key);
      const qty = Number(item.TotalQuantity ?? item.Quantity ?? 0) || 0;
      group.variants.push(item);
      group.totalQuantity += qty;
      if (item.Unit) group.units.add(item.Unit.trim());
    });

    return Array.from(groupsMap.values())
      .map((g) => {
        const distinctUnits = Array.from(g.units);
        const unitLabel =
          distinctUnits.length === 1
            ? formatUnitShort(distinctUnits[0], g.totalQuantity)
            : g.totalQuantity === 1
              ? 'unit'
              : 'units';
        const isOutOfStock = g.totalQuantity <= 0;
        const hasLowStock =
          !isOutOfStock &&
          (g.totalQuantity <= LOW_STOCK_THRESHOLD ||
            g.variants.some((v) => (Number(v.TotalQuantity ?? v.Quantity ?? 0) || 0) <= LOW_STOCK_THRESHOLD));
        return {
          ...g,
          variantCount: g.variants.length,
          unitLabel,
          isOutOfStock,
          hasLowStock,
        };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [items]);

  const filteredGroups = useMemo(() => {
    const q = recordSearch.trim().toLowerCase();
    if (!q) return groupedItems;
    return groupedItems.filter((group) => {
      if (group.itemName.toLowerCase().includes(q)) return true;
      return group.variants.some(
        (v) =>
          (v.Brand || '').toLowerCase().includes(q) ||
          (v.ItemCode || '').toLowerCase().includes(q) ||
          (v.Specifications || '').toLowerCase().includes(q) ||
          (v.Unit || '').toLowerCase().includes(q)
      );
    });
  }, [groupedItems, recordSearch]);

  const renderFormFields = (data, handler, itemNameSelectHandler, brandSelectHandler, errors = {}) => (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        alignItems: 'start',
      }}
    >
      {/* Row 1, Col 1: Item Name * */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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

      {/* Row 1, Col 3: Unit * */}
      <TextField
        fullWidth
        size="small"
        select
        label="Unit *"
        name="unit"
        value={data.unit}
        onChange={handler}
        sx={inventoryFieldSx}
      >
        {UNIT_OPTIONS.map((u) => (
          <MenuItem key={u} value={u} sx={inventoryMenuItemSx}>
            {u}
          </MenuItem>
        ))}
      </TextField>

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

      {/* Row 2, Col 2-3 (spans 2 columns on md+): Specifications * */}
      <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 2' } }}>
        <TextField
          fullWidth
          size="small"
          label="Specifications *"
          name="specifications"
          value={data.specifications}
          onChange={handler}
          error={!!errors.specifications}
          helperText={errors.specifications}
          placeholder="e.g., Size: A4, 80gsm"
          sx={inventoryFieldSx}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Supplies Encoding" onMenuClick={toggleDrawer} subtitle="OFFICE SUPPLIES ENCODING" />
            <InventoryPageShell
              breadcrumb="Inventory / Office Supplies"
              title="Office Supplies Encoding"
              userLabel={!showLoginModal ? loggedInUser : ''}
              hideCanvas={showLoginModal}
              actions={
                !showLoginModal && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<ListAltOutlinedIcon sx={{ fontSize: 17 }} />}
                      onClick={() => navigate('/supplies')}
                      sx={inventoryNavBtnSx}
                    >
                      Supplies Inventory
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                      onClick={handleLogout}
                      sx={inventoryLogoutBtnSx}
                    >
                      Logout
                    </Button>
                  </>
                )
              }
            >
              {/* Encode New Supply Item Card */}
              <Paper elevation={0} sx={{ ...inventoryCardSx, mb: 3.5 }}>
                <Box sx={inventoryCardHeaderSx}>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontWeight: 700,
                        fontSize: 16,
                        color: INVENTORY_COLORS.primary,
                      }}
                    >
                      Encode New Supply Item
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: INVENTORY_FONT,
                        fontSize: 12.5,
                        color: INVENTORY_COLORS.textSecondary,
                        mt: 0.2,
                      }}
                    >
                      Register a new office supply item or add a variant with brand and specifications.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  {renderFormFields(
                    formData,
                    handleChange,
                    handleItemNameSelect,
                    handleBrandSelect,
                    formErrors
                  )}
                  <Box
                    sx={{
                      mt: 3,
                      pt: 2,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      gap: 1.5,
                      justifyContent: 'flex-end',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => { setFormData(emptySupplyForm); setFormErrors({}); }}
                      sx={{ ...inventorySecondaryBtnSx, minWidth: 110 }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      sx={{ ...inventoryPrimaryBtnSx, minWidth: 136 }}
                    >
                      Save Supply
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Encoded Records Section */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontWeight: 700,
                      fontSize: 16.5,
                      color: INVENTORY_COLORS.primary,
                    }}
                  >
                    Encoded Records
                  </Typography>
                  <Chip
                    label={`${filteredGroups.length} ${filteredGroups.length === 1 ? 'item' : 'items'} · ${items.length} ${items.length === 1 ? 'variant' : 'variants'}`}
                    size="small"
                    sx={{
                      height: 24,
                      fontFamily: INVENTORY_FONT,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: INVENTORY_COLORS.surface,
                      color: INVENTORY_COLORS.textSecondary,
                      border: `1px solid ${INVENTORY_COLORS.border}`,
                    }}
                  />
                </Box>

                <TextField
                  size="small"
                  placeholder="Filter by item, brand, SKU, or specs..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  sx={{ ...inventoryFieldSx, minWidth: { xs: '100%', sm: 320, md: 360 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18, color: INVENTORY_COLORS.textMuted }} />
                      </InputAdornment>
                    ),
                    endAdornment: recordSearch && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="Clear filter"
                          onClick={() => setRecordSearch('')}
                        >
                          <ClearIcon sx={{ fontSize: 16, color: INVENTORY_COLORS.textMuted }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {loadingItems ? (
                <Paper elevation={0} sx={{ ...inventoryCardSx, py: 7, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={32} sx={{ color: INVENTORY_COLORS.primary }} />
                </Paper>
              ) : filteredGroups.length === 0 ? (
                <Paper elevation={0} sx={{ ...inventoryCardSx, py: 7, px: 3, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontWeight: 600,
                      fontSize: 14.5,
                      color: INVENTORY_COLORS.textBody,
                    }}
                  >
                    {recordSearch.trim() ? 'No matching supply records' : 'No encoded records yet'}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: INVENTORY_FONT,
                      fontSize: 13,
                      color: INVENTORY_COLORS.textSecondary,
                      mt: 0.5,
                    }}
                  >
                    {recordSearch.trim()
                      ? 'Try searching by another item name, brand, or specification.'
                      : 'Use the form above to encode your first office supply item.'}
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {filteredGroups.map((group) => (
                    <Accordion
                      key={group.key}
                      disableGutters
                      elevation={0}
                      sx={{
                        backgroundColor: INVENTORY_COLORS.surface,
                        border: `1px solid ${INVENTORY_COLORS.border}`,
                        borderRadius: '10px !important',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                        overflow: 'hidden',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                        '&::before': { display: 'none' },
                        '&:hover': {
                          borderColor: INVENTORY_COLORS.borderStrong,
                          boxShadow: '0 3px 10px rgba(22, 50, 79, 0.06)',
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: INVENTORY_COLORS.textSecondary }} />}
                        sx={{
                          px: { xs: 2, sm: 2.5 },
                          py: 0.5,
                          minHeight: 56,
                          backgroundColor: INVENTORY_COLORS.surface,
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: INVENTORY_COLORS.surfaceMuted },
                          '& .MuiAccordionSummary-content': {
                            my: 1.25,
                            mr: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1.5,
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: INVENTORY_FONT,
                            fontWeight: 600,
                            fontSize: 14.5,
                            color: INVENTORY_COLORS.textStrong,
                          }}
                        >
                          {group.itemName}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {group.isOutOfStock && (
                            <Chip
                              icon={
                                <ErrorOutlineRoundedIcon
                                  sx={{ fontSize: '15px !important', color: `${INVENTORY_COLORS.dangerText} !important` }}
                                />
                              }
                              label="Out of Stock"
                              size="small"
                              sx={{
                                height: 24,
                                fontFamily: INVENTORY_FONT,
                                fontSize: 11.5,
                                fontWeight: 600,
                                backgroundColor: INVENTORY_COLORS.dangerBg,
                                color: INVENTORY_COLORS.dangerText,
                                border: `1px solid ${INVENTORY_COLORS.dangerBorder}`,
                              }}
                            />
                          )}
                          {group.hasLowStock && (
                            <Chip
                              icon={
                                <WarningAmberRoundedIcon
                                  sx={{ fontSize: '15px !important', color: `${INVENTORY_COLORS.warningText} !important` }}
                                />
                              }
                              label="Low Stock"
                              size="small"
                              sx={{
                                height: 24,
                                fontFamily: INVENTORY_FONT,
                                fontSize: 11.5,
                                fontWeight: 600,
                                backgroundColor: INVENTORY_COLORS.warningBg,
                                color: INVENTORY_COLORS.warningText,
                                border: `1px solid ${INVENTORY_COLORS.warningBorder}`,
                              }}
                            />
                          )}
                          <Chip
                            label={`${group.variantCount} ${group.variantCount === 1 ? 'variant' : 'variants'}`}
                            size="small"
                            sx={{
                              height: 24,
                              fontFamily: INVENTORY_FONT,
                              fontSize: 11.5,
                              fontWeight: 500,
                              backgroundColor: '#F1F5F9',
                              color: INVENTORY_COLORS.textSecondary,
                              border: `1px solid ${INVENTORY_COLORS.border}`,
                            }}
                          />
                          <Chip
                            label={`Total: ${group.totalQuantity} ${group.unitLabel}`}
                            size="small"
                            sx={{
                              height: 24,
                              fontFamily: INVENTORY_FONT,
                              fontSize: 11.5,
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                              backgroundColor: INVENTORY_COLORS.primaryTint,
                              color: INVENTORY_COLORS.primary,
                              border: `1px solid ${INVENTORY_COLORS.primaryBorder}`,
                            }}
                          />
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ p: 0, borderTop: `1px solid ${INVENTORY_COLORS.border}` }}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={inventoryTableHeadRowSx}>
                                <TableCell sx={{ width: 130 }}>Item Code</TableCell>
                                <TableCell>Brand</TableCell>
                                <TableCell>Specifications</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell align="right" sx={{ width: 150 }}>Stock</TableCell>
                                <TableCell align="right" sx={{ width: 170 }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {group.variants.map((item) => {
                                const qty = Number(item.TotalQuantity ?? item.Quantity ?? 0) || 0;
                                const unitShort = formatUnitShort(item.Unit || 'Pieces', qty);
                                const variantOut = qty <= 0;
                                const variantLow = qty > 0 && qty <= LOW_STOCK_THRESHOLD;

                                return (
                                  <TableRow
                                    key={item.Id || item.ProfileKey}
                                    sx={{
                                      '&:hover': { backgroundColor: INVENTORY_COLORS.surfaceMuted },
                                      '& td': {
                                        fontFamily: INVENTORY_FONT,
                                        fontSize: 13.5,
                                        color: INVENTORY_COLORS.textBody,
                                        py: 1.35,
                                        px: 2,
                                        borderBottom: '1px solid #F1F5F9',
                                      },
                                      '&:last-of-type td': { borderBottom: 'none' },
                                    }}
                                  >
                                    <TableCell>
                                      {item.ItemCode ? (
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
                                            px: 1,
                                            py: 0.25,
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {item.ItemCode}
                                        </Box>
                                      ) : (
                                        'N/A'
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: INVENTORY_COLORS.textStrong }}>
                                      {item.Brand || 'N/A'}
                                    </TableCell>
                                    <TableCell>{item.Specifications || 'N/A'}</TableCell>
                                    <TableCell>{item.Unit || 'Pieces'}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                      <Box
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'flex-end',
                                          gap: 1,
                                        }}
                                      >
                                        {(variantOut || variantLow) && (
                                          <Chip
                                            label={variantOut ? 'Out' : 'Low'}
                                            size="small"
                                            sx={{
                                              height: 20,
                                              fontFamily: INVENTORY_FONT,
                                              fontSize: 10.5,
                                              fontWeight: 700,
                                              backgroundColor: variantOut
                                                ? INVENTORY_COLORS.dangerBg
                                                : INVENTORY_COLORS.warningBg,
                                              color: variantOut
                                                ? INVENTORY_COLORS.dangerText
                                                : INVENTORY_COLORS.warningText,
                                              border: `1px solid ${
                                                variantOut
                                                  ? INVENTORY_COLORS.dangerBorder
                                                  : INVENTORY_COLORS.warningBorder
                                              }`,
                                              '& .MuiChip-label': { px: 0.8 },
                                            }}
                                          />
                                        )}
                                        <Box
                                          component="span"
                                          sx={{
                                            fontWeight: 600,
                                            color: INVENTORY_COLORS.textStrong,
                                            fontVariantNumeric: 'tabular-nums',
                                          }}
                                        >
                                          {qty}{' '}
                                          <Box
                                            component="span"
                                            sx={{
                                              fontWeight: 500,
                                              fontSize: 12.5,
                                              color: INVENTORY_COLORS.textSecondary,
                                            }}
                                          >
                                            {unitShort}
                                          </Box>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                      <Box sx={{ display: 'inline-flex', gap: 0.75 }}>
                                        <Button
                                          size="small"
                                          startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                                          onClick={() => handleOpenEdit(item)}
                                          sx={{
                                            fontFamily: INVENTORY_FONT,
                                            fontWeight: 600,
                                            fontSize: 12.5,
                                            textTransform: 'none',
                                            borderRadius: '6px',
                                            color: INVENTORY_COLORS.primary,
                                            px: 1.25,
                                            '&:hover': { backgroundColor: INVENTORY_COLORS.primaryTint },
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="small"
                                          startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                                          onClick={() => handleOpenDelete(item)}
                                          sx={{
                                            fontFamily: INVENTORY_FONT,
                                            fontWeight: 600,
                                            fontSize: 12.5,
                                            textTransform: 'none',
                                            borderRadius: '6px',
                                            color: INVENTORY_COLORS.dangerText,
                                            px: 1.25,
                                            '&:hover': { backgroundColor: INVENTORY_COLORS.dangerBg },
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </InventoryPageShell>
          </>
        )}
      </Header>

      {showLoginModal && (
        <Dialog
          open
          disableEscapeKeyDown
          PaperProps={{ sx: { borderRadius: '12px', p: 0.5 } }}
        >
          <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.primary }}>
            Login Required
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 13, color: INVENTORY_COLORS.textSecondary, mb: 2 }}>
              You need to login to access supplies encoding.
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

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.primary }}>
          Edit Supply Details
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontFamily: INVENTORY_FONT, fontWeight: 700, color: INVENTORY_COLORS.textStrong }}>
          Delete Supply
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: INVENTORY_FONT, fontSize: 14, color: INVENTORY_COLORS.textBody }}>
            Are you sure you want to delete <strong>{selectedItem?.ItemName}</strong>
            {selectedItem?.Brand && selectedItem.Brand !== 'N/A' ? ` (${selectedItem.Brand})` : ''}?
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
              fontSize: 13.5,
              textTransform: 'none',
              borderRadius: '8px',
              backgroundColor: INVENTORY_COLORS.dangerText,
              px: 3,
              minHeight: 38,
              '&:hover': { backgroundColor: INVENTORY_COLORS.dangerHover },
            }}
          >
            Delete
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

export default SuppliesEncode;
