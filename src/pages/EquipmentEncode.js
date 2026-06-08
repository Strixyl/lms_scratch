import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Typography, Box, Grid, MenuItem, Snackbar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'];
const CONDITION_OPTIONS = ['New', 'Good', 'Fair', 'Poor'];
const LOCATION_OPTIONS = [
  'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
  'Office', 'Storage Room',
];

const statusColor = (status) => {
  if (status === 'In Stock') return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
  if (status === 'Low Stock') return { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' };
  return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' };
};

const emptyForm = {
  itemName: '', description: '', brand: '', quantity: '',
  status: 'In Stock', serialNumber: '', condition: 'Good',
  location: '', specifications: '',
};

const EquipmentEncode = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    const savedUser = localStorage.getItem('equipmentUser');
    if (savedUser) {
      // Preserve the saved user but require an explicit login step
      setLoggedInUser(savedUser);
      setUsername(savedUser);
      // keep `showLoginModal` true so the login dialog is shown
    }
  }, []);

  useEffect(() => {
    if (!showLoginModal) fetchItems();
  }, [showLoginModal]);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/equipment');
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

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

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.itemName.trim()) {
      setSnackbar({ open: true, message: 'Item name is required.', severity: 'error' });
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/equipment', formData);
      setSnackbar({ open: true, message: 'Equipment saved successfully!', severity: 'success' });
      setFormData(emptyForm);
      fetchItems();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save equipment.', severity: 'error' });
    }
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setEditForm({
      itemName: item.ItemName || '', description: item.Description || '',
      brand: item.Brand || '', quantity: item.Quantity || '',
      status: item.Status || 'In Stock', serialNumber: item.SerialNumber || '',
      condition: item.Condition || 'Good', location: item.Location || '',
      specifications: item.Specifications || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/equipment/${selectedItem.Id}`, editForm);
      setSnackbar({ open: true, message: 'Equipment updated successfully!', severity: 'success' });
      setEditDialogOpen(false);
      fetchItems();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update equipment.', severity: 'error' });
    }
  };

  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/equipment/${selectedItem.Id}`);
      setSnackbar({ open: true, message: 'Equipment deleted successfully!', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchItems();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete equipment.', severity: 'error' });
    }
  };

  const formFields = (data, handler) => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth label="Item Name *" name="itemName" value={data.itemName} onChange={handler}
          inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth label="Brand" name="brand" value={data.brand} onChange={handler}
          inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth label="Quantity" name="quantity" value={data.quantity} onChange={handler}
          type="number" inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth select label="Status" name="status" value={data.status} onChange={handler}>
          {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ fontFamily: 'Poppins, sans-serif' }}>{s}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth select label="Condition" name="condition" value={data.condition} onChange={handler}>
          {CONDITION_OPTIONS.map(c => <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif' }}>{c}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth label="Serial Number" name="serialNumber" value={data.serialNumber} onChange={handler}
          inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth select label="Location" name="location" value={data.location} onChange={handler}>
          <MenuItem value="">Select location</MenuItem>
          {LOCATION_OPTIONS.map(l => <MenuItem key={l} value={l} sx={{ fontFamily: 'Poppins, sans-serif' }}>{l}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth label="Description" name="description" value={data.description} onChange={handler}
          inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField fullWidth label="Specifications" name="specifications" value={data.specifications} onChange={handler}
          inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
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
                <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#555' }}>
                  Logged in as <strong>{loggedInUser}</strong>
                </Typography>
                <Button variant="outlined" size="small" color="secondary" onClick={handleLogout}
                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>
                  Logout
                </Button>
              </Box>
            )}
          </>
        )}
      </Header>

      {/* Login Dialog */}
      <Dialog open={showLoginModal} disableEscapeKeyDown>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Login Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#666', mb: 2 }}>
            You need to login to access equipment encoding.
          </Typography>
          <TextField fullWidth margin="dense" label="Username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
          <TextField fullWidth margin="dense" label="Password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
          {loginError && (
            <Typography color="error" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, mt: 1 }}>{loginError}</Typography>
          )}
          <Button variant="contained" fullWidth sx={{ mt: 2, backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}
            onClick={handleLogin}>Login</Button>
          <Button variant="outlined" fullWidth sx={{ mt: 1, fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}
            onClick={() => navigate('/')}>Back to Home</Button>
        </DialogContent>
      </Dialog>

      {!showLoginModal && (
        <Box sx={{ px: { xs: 2, sm: 4, md: 6 }, pb: 6 }}>

          {/* Encode Form */}
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, mb: 2, mt: 3, color: '#1b0892' }}>
            Encode New Equipment
          </Typography>
          {formFields(formData, handleChange)}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit}
              sx={{ backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 4 }}>
              Save Equipment
            </Button>
            <Button variant="outlined" onClick={() => setFormData(emptyForm)}
              sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 4 }}>
              Clear
            </Button>
          </Box>

          {/* Records Table */}
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, mt: 5, mb: 2, color: '#1b0892' }}>
            Equipment Records
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#fafafa' }}>
                    {['Item Name', 'Brand', 'Qty', 'Status', 'Serial No.', 'Condition', 'Location', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const sc = statusColor(item.Status);
                    return (
                      <TableRow key={item.Id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600 }}>{item.ItemName}</TableCell>
                        <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>{item.Brand}</TableCell>
                        <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600 }}>{item.Quantity}</TableCell>
                        <TableCell>
                          <Chip label={item.Status} size="small" sx={{
                            backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                            fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600
                          }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.SerialNumber}</TableCell>
                        <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.Condition}</TableCell>
                        <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.Location}</TableCell>
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
          </Paper>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>Edit Equipment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>{formFields(editForm, handleEditChange)}</Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}
            sx={{ backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 3 }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
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

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ fontFamily: 'Poppins, sans-serif' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EquipmentEncode;