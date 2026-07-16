import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Snackbar, Alert, Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { THEME, SECTION_OPTIONS } from '../constants/equipmentConstants';
import { getAssets, sendAsset } from '../api/equipmentApi';

const font = THEME.font;

const SendAsset = () => {
  const navigate = useNavigate();
  const loggedInUser = localStorage.getItem('equipmentUser') || '';

  const [items, setItems] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [destination, setDestination] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!loggedInUser) {
      navigate('/equipment-encoding');
      return;
    }
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await getAssets();
      setItems(data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load asset list.', severity: 'error' });
    }
  };

  const selectedAsset = items.find((i) => String(i.Id) === String(assetId));

  const validate = () => {
    const errs = {};
    if (!assetId) errs.assetId = 'Please select an asset.';
    if (!destination) errs.destination = 'Please select a destination section.';

    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty) || qty < 1) {
      errs.quantity = 'Quantity must be at least 1.';
    } else if (selectedAsset && qty > Number(selectedAsset.Quantity)) {
      errs.quantity = `Insufficient stock available. Available Quantity: ${selectedAsset.Quantity}. Requested Quantity: ${qty}.`;
    }
    return errs;
  };

  const resetForm = () => {
    setAssetId('');
    setDestination('');
    setQuantity('');
    setRemarks('');
    setErrors({});
  };

  const handleConfirm = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const qty = Number(quantity);
      await sendAsset(selectedAsset.Id, {
        quantity: qty,
        destination,
        remarks: remarks.trim(),
        user: loggedInUser,
      });
      setSnackbar({
        open: true,
        message: `Sent ${qty} unit(s) of "${selectedAsset.ItemName}" to ${destination}. Remaining stock: ${Number(selectedAsset.Quantity) - qty}.`,
        severity: 'success',
      });
      resetForm();
      fetchItems();
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setSnackbar({ open: true, message: apiMessage || 'Failed to send asset.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Send Asset" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT ENCODING" />
            <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontFamily: font, fontSize: 14, color: '#555' }}>
                Logged in as <strong>{loggedInUser}</strong>
              </Typography>
              <Button
                variant="outlined" size="small"
                onClick={() => navigate('/equipment-encoding')}
                sx={{ fontFamily: font, textTransform: 'none', borderColor: THEME.navy, color: THEME.navy }}
              >
                Back to Equipment Records
              </Button>
            </Box>
          </>
        )}
      </Header>

      <Box sx={{ p: 3, maxWidth: 760, margin: '0 auto' }}>
        <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 20, mb: 3, color: THEME.navy }}>
          Send Asset to Section / Department
        </Typography>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth select label="Select Asset *" value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                error={!!errors.assetId} helperText={errors.assetId}
              >
                <MenuItem value="" disabled sx={{ fontFamily: font }}>Select an asset</MenuItem>
                {items.map((i) => (
                  <MenuItem key={i.Id} value={i.Id} sx={{ fontFamily: font }}>
                    {i.ItemName} {i.Brand ? `(${i.Brand})` : ''} — Stock: {i.Quantity}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {selectedAsset && (
              <Grid item xs={12}>
                <Chip
                  label={`Current Stock: ${selectedAsset.Quantity}`}
                  sx={{ fontFamily: font, fontWeight: 600, backgroundColor: '#eef0ff', color: THEME.navy }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select label="Destination Section *" value={destination}
                onChange={(e) => setDestination(e.target.value)}
                error={!!errors.destination} helperText={errors.destination}
              >
                <MenuItem value="" disabled sx={{ fontFamily: font }}>Select destination</MenuItem>
                {SECTION_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontFamily: font }}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="number" label="Quantity to Send *" value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                error={!!errors.quantity} helperText={errors.quantity}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth multiline minRows={2} label="Remarks (optional)" value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                inputProps={{ style: { fontFamily: font } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={resetForm} sx={{ fontFamily: font, textTransform: 'none', px: 4 }}>
              Clear
            </Button>
            <Button
              variant="contained" onClick={handleConfirm} disabled={submitting}
              sx={{ backgroundColor: THEME.navy, fontFamily: font, textTransform: 'none', px: 4 }}
            >
              Confirm Transfer
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ fontFamily: font }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default SendAsset;