import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Dialog, DialogTitle, DialogContent, TextField, Button, Typography, Box, Grid, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const SuppliesEncode = () => {
    const navigate = useNavigate();
    const [showLoginModal, setShowLoginModal] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loggedInUser, setLoggedInUser] = useState('');
    const location = useLocation();

    useEffect(() => {
        const savedUser = localStorage.getItem('loggedInUser');
        if (savedUser) {
          setLoggedInUser(savedUser);
          setShowLoginModal(false);
        }
      }, []);
    
      useEffect(() => {
        return () => {
          // Run this when navigating away (component unmount)
          localStorage.removeItem('loggedInUser');
          setLoggedInUser(null);
          setShowLoginModal(true);
        };
      }, [location.pathname]);

      const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'office' && password === '!HLL2025*') {
          localStorage.setItem('loggedInUser', username);
          setLoggedInUser(username);
          setShowLoginModal(false);
          setLoginError(''); 
        } else {
          setLoginError('Invalid credentials');
        }
      };
    
      const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        setLoggedInUser('');
        setShowLoginModal(true);
        setUsername('');
        setPassword('');
      };
    
      const [formData, setFormData] = useState({
        productName: '',
        productBrand: '',
        quantity: '',
        stockStatus: '',
      });
    
      const handleChange = (e) => {
        setFormData((prev) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
      };
    
      const handleSubmit = () => {
        // Add Firebase submission logic here
        console.log('Submitted data:', formData);
      };

      return (
        <>
          <Header>
            {(toggleDrawer) => (
              <>
                <TopBar
                  title="SuppliesEncode"
                  onMenuClick={toggleDrawer}
                  subtitle="SUPPLIES ENCODING"
                />
                <div style={{ padding: '20px' }}>
                  {!showLoginModal && (
                    <Box>
                      {/* 👇 Secure page content */}
                      <Typography>Welcome, <strong>{loggedInUser}</strong>!</Typography>
    
                      {/* 👇 Logout Button */}
                      <Button
                        variant="outlined"
                        color="secondary"
                        sx={{ mt: 2 }}
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </Box>
                  )}
                </div>
              </>
            )}
          </Header>
    
          {/* 👇 Login Popup */}
          <Dialog open={showLoginModal}>
            <DialogTitle>You need to login to edit this page</DialogTitle>
                <DialogContent>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {loginError && (
                    <Typography color="error" fontSize={14} mt={1}>
                      {loginError}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleLogin}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={() => navigate('/')}
                  >
                    Home
                  </Button>
                </DialogContent>      
          </Dialog>
    
          <Grid container spacing={2} sx={{ px: { xs: 2, sm: 4, md: 6 }, pt: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Product Name"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Product Brand"
              name="productBrand"
              value={formData.productBrand}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Stock Status"
              name="stockStatus"
              value={formData.stockStatus}
              onChange={handleChange}
            >
              <MenuItem value="in">In Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Save Equipment
            </Button>
          </Grid>
        </Grid>
    
        </>
      );
};
export default SuppliesEncode;
