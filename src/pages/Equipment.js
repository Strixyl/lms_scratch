import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  InputAdornment, CircularProgress, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'];
const CONDITION_OPTIONS = ['New', 'Good', 'Fair', 'Poor'];

const statusColor = (status) => {
  if (status === 'In Stock') return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
  if (status === 'Low Stock') return { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' };
  return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' };
};

const emptyForm = {
  itemName: '', description: '', brand: '', quantity: '',
  status: 'In Stock', serialNumber: '', condition: 'Good',
  location: '', specifications: ''
};

const Equipment = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/equipment');
      // Defensive: accept array or common wrapper shapes (rows/data)
      const payload = res.data;
      if (Array.isArray(payload)) {
        setItems(payload);
      } else if (Array.isArray(payload?.rows)) {
        setItems(payload.rows);
      } else if (Array.isArray(payload?.data)) {
        setItems(payload.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
      showSnackbar('Failed to load equipment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      itemName: item.ItemName || '',
      description: item.Description || '',
      brand: item.Brand || '',
      quantity: item.Quantity || '',
      status: item.Status || 'In Stock',
      serialNumber: item.SerialNumber || '',
      condition: item.Condition || 'Good',
      location: item.Location || '',
      specifications: item.Specifications || '',
    });
    setSelectedItem(item);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.itemName.trim()) {
      showSnackbar('Item name is required.', 'error');
      return;
    }
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/equipment/${selectedItem.Id}`, formData);
        showSnackbar('Equipment updated successfully.');
      } else {
        await axios.post('http://localhost:5000/api/equipment', formData);
        showSnackbar('Equipment added successfully.');
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      console.error('Save error:', err);
      showSnackbar('Failed to save equipment.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/equipment/${selectedItem.Id}`);
      showSnackbar('Equipment deleted successfully.');
      setDeleteDialogOpen(false);
      fetchItems();
    } catch (err) {
      console.error('Delete error:', err);
      showSnackbar('Failed to delete equipment.', 'error');
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = item.ItemName?.toLowerCase().includes(search.toLowerCase()) ||
      item.Brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.SerialNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.Location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? item.Status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: items.length,
    inStock: items.filter(i => i.Status === 'In Stock').length,
    lowStock: items.filter(i => i.Status === 'Low Stock').length,
    outOfStock: items.filter(i => i.Status === 'Out of Stock').length,
  };

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Library Equipment" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT INVENTORY" />

          <Box sx={{ p: 3, backgroundColor: '#f5f6fa', minHeight: '100vh' }}>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Items', value: counts.total, color: '#1b0892', bg: '#e8eaf6' },
                { label: 'In Stock', value: counts.inStock, color: '#2e7d32', bg: '#e8f5e9' },
                { label: 'Low Stock', value: counts.lowStock, color: '#f57f17', bg: '#fff8e1' },
                { label: 'Out of Stock', value: counts.outOfStock, color: '#c62828', bg: '#ffebee' },
              ].map(card => (
                <Box key={card.label} sx={{
                  flex: 1, minWidth: 140, p: 2.5, borderRadius: 3,
                  backgroundColor: card.bg, border: `1.5px solid ${card.color}22`
                }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: card.color, mt: 0.5 }}>
                    {card.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Filter Bar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small" placeholder="Search by name, brand, serial no., location..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                sx={{ backgroundColor: 'white', borderRadius: 1, minWidth: 300 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
              <TextField
                select size="small" label="Filter by Status" value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ backgroundColor: 'white', borderRadius: 1, minWidth: 160 }}
              >
                <MenuItem value="">All</MenuItem>
                {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              {filterStatus && (
                <Button size="small" variant="outlined" onClick={() => setFilterStatus('')}
                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>
                  Clear
                </Button>
              )}
              <Box sx={{ ml: 'auto' }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}
                  sx={{ backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 3 }}>
                  Add Equipment
                </Button>
              </Box>
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#1b0892' }} />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999' }}>
                    No equipment found.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        {['Item Name', 'Description', 'Brand', 'Qty', 'Status', 'Serial No.', 'Condition', 'Location', 'Specifications', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((item) => {
                        const sc = statusColor(item.Status);
                        return (
                          <TableRow key={item.Id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600 }}>{item.ItemName}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', maxWidth: 150 }}>{item.Description}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>{item.Brand}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600 }}>{item.Quantity}</TableCell>
                            <TableCell>
                              <Chip label={item.Status} size="small" sx={{
                                backgroundColor: sc.bg, color: sc.text,
                                border: `1px solid ${sc.border}`,
                                fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600
                              }} />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.SerialNumber}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.Condition}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.Location}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', maxWidth: 150 }}>{item.Specifications}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton size="small" onClick={() => handleOpenEdit(item)}
                                  sx={{ color: '#1b0892', '&:hover': { backgroundColor: '#e8eaf6' } }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleOpenDelete(item)}
                                  sx={{ color: '#c62828', '&:hover': { backgroundColor: '#ffebee' } }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#999', mt: 1.5 }}>
              Showing {filtered.length} of {items.length} items
            </Typography>
          </Box>

          {/* Add / Edit Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
              {isEditing ? 'Edit Equipment' : 'Add Equipment'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField fullWidth label="Item Name *" name="itemName" value={formData.itemName} onChange={handleChange}
                  size="small" inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
                <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleChange}
                  size="small" multiline rows={2} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField fullWidth label="Brand" name="brand" value={formData.brand} onChange={handleChange}
                    size="small" inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
                  <TextField fullWidth label="Quantity" name="quantity" value={formData.quantity} onChange={handleChange}
                    size="small" type="number" inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange} size="small">
                    {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ fontFamily: 'Poppins, sans-serif' }}>{s}</MenuItem>)}
                  </TextField>
                  <TextField fullWidth select label="Condition" name="condition" value={formData.condition} onChange={handleChange} size="small">
                    {CONDITION_OPTIONS.map(c => <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif' }}>{c}</MenuItem>)}
                  </TextField>
                </Box>
                <TextField fullWidth label="Serial Number" name="serialNumber" value={formData.serialNumber} onChange={handleChange}
                  size="small" inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
                <TextField fullWidth label="Location" name="location" value={formData.location} onChange={handleChange}
                  size="small" inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
                <TextField fullWidth label="Specifications" name="specifications" value={formData.specifications} onChange={handleChange}
                  size="small" multiline rows={2} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDialogOpen(false)} sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}
                sx={{ backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 3 }}>
                {isEditing ? 'Update' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Delete Equipment</DialogTitle>
            <DialogContent>
              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
                Are you sure you want to delete <strong>{selectedItem?.ItemName}</strong>? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" onClick={handleDelete}
                sx={{ backgroundColor: '#c62828', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 3 }}>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert severity={snackbar.severity} sx={{ fontFamily: 'Poppins, sans-serif' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Header>
  );
};

export default Equipment;