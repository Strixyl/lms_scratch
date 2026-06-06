import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, TextField, Button,
  Typography, Box, Grid, MenuItem, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'];
const CONDITION_OPTIONS = ['New', 'Good', 'Fair', 'Poor'];

const EquipmentEncode = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    brand: '',
    quantity: '',
    status: 'In Stock',
    serialNumber: '',
    condition: 'Good',
    location: '',
    specifications: '',
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('equipmentUser');
    if (savedUser) {
      setLoggedInUser(savedUser);
      setShowLoginModal(false);
    }
  }, []);

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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.itemName.trim()) {
      setSnackbar({ open: true, message: 'Item name is required.', severity: 'error' });
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/equipment', formData);
      setSnackbar({ open: true, message: 'Equipment saved successfully!', severity: 'success' });
      setFormData({
        itemName: '', description: '', brand: '', quantity: '',
        status: 'In Stock', serialNumber: '', condition: 'Good',
        location: '', specifications: '',
      });
    } catch (err) {
      console.error('Error saving equipment:', err);
      setSnackbar({ open: true, message: 'Failed to save equipment.', severity: 'error' });
    }
  };

  const handleClear = () => {
    setFormData({
      itemName: '', description: '', brand: '', quantity: '',
      status: 'In Stock', serialNumber: '', condition: 'Good',
      location: '', specifications: '',
    });
  };

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Equipment Encoding" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT ENCODING" />
            <Box sx={{ p: 3 }}>
              {!showLoginModal && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: '#555' }}>
                    Logged in as <strong>{loggedInUser}</strong>
                  </Typography>
                  <Button variant="outlined" size="small" color="secondary" onClick={handleLogout}
                    sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>
                    Logout
                  </Button>
                </Box>
              )}
            </Box>
          </>
        )}
      </Header>

      {/* Login Dialog */}
      <Dialog open={showLoginModal} disableEscapeKeyDown>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
          Login Required
        </DialogTitle>
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
            <Typography color="error" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, mt: 1 }}>
              {loginError}
            </Typography>
          )}
          <Button variant="contained" fullWidth sx={{ mt: 2, backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}
            onClick={handleLogin}>
            Login
          </Button>
          <Button variant="outlined" fullWidth sx={{ mt: 1, fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}
            onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </DialogContent>
      </Dialog>

      {/* Encoding Form */}
      {!showLoginModal && (
        <Box sx={{ px: { xs: 2, sm: 4, md: 6 }, pb: 6 }}>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, mb: 3, color: '#1b0892' }}>
            Encode New Equipment
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Item Name *" name="itemName" value={formData.itemName}
                onChange={handleChange} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Brand" name="brand" value={formData.brand}
                onChange={handleChange} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Quantity" name="quantity" value={formData.quantity}
                onChange={handleChange} type="number" inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => (
                  <MenuItem key={s} value={s} sx={{ fontFamily: 'Poppins, sans-serif' }}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Condition" name="condition" value={formData.condition} onChange={handleChange}>
                {CONDITION_OPTIONS.map(c => (
                  <MenuItem key={c} value={c} sx={{ fontFamily: 'Poppins, sans-serif' }}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Serial Number" name="serialNumber" value={formData.serialNumber}
                onChange={handleChange} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Location" name="location" value={formData.location}
                onChange={handleChange} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Description" name="description" value={formData.description}
                onChange={handleChange} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Specifications" name="specifications" value={formData.specifications}
                onChange={handleChange} inputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button variant="contained" onClick={handleSubmit}
                  sx={{ backgroundColor: '#1b0892', fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 4 }}>
                  Save Equipment
                </Button>
                <Button variant="outlined" onClick={handleClear}
                  sx={{ fontFamily: 'Poppins, sans-serif', textTransform: 'none', px: 4 }}>
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

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