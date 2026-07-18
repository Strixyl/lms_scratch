import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Snackbar, Alert, Chip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

import { THEME, LOCATION_OPTIONS, SECTION_OPTIONS } from '../constants/equipmentConstants';
import { getAssets, transferAsset } from '../api/equipmentApi';

const font = THEME.font;

// Combine and deduplicate physical locations and school libraries/sections
const DESTINATION_OPTIONS = Array.from(new Set([...LOCATION_OPTIONS, ...SECTION_OPTIONS])).sort();

const SendAsset = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const loggedInUser = localStorage.getItem('equipmentUser') || '';

  const [items, setItems] = useState([]);
  const [selectedProfileKey, setSelectedProfileKey] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Read Router state passed from the Equipment Records accordion
  const { preselectedProfileKey, preselectedSourceLocationId } = routerLocation.state || {};

  useEffect(() => {
    if (!loggedInUser) {
      navigate('/equipment-encoding');
      return;
    }
    const fetchItems = async () => {
      try {
        const data = await getAssets();
        setItems(data);

        if (preselectedProfileKey) {
          setSelectedProfileKey(preselectedProfileKey);
          if (preselectedSourceLocationId) {
            setSourceLocationId(String(preselectedSourceLocationId));
          }
        }
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to load asset list.', severity: 'error' });
      }
    };
    fetchItems();
  }, [loggedInUser, navigate, preselectedProfileKey, preselectedSourceLocationId]);

  const selectedProfile = items.find((i) => i.ProfileKey === selectedProfileKey);
  const selectedSource = selectedProfile?.Locations.find((l) => String(l.Id) === String(sourceLocationId));

  // Reset dependent fields when the profile selection changes (unless using preselected query state)
  useEffect(() => {
    if (selectedProfileKey && selectedProfileKey !== preselectedProfileKey) {
      setSourceLocationId('');
      setTransferQty('');
    }
  }, [selectedProfileKey, preselectedProfileKey]);

  const validate = () => {
    const errs = {};
    if (!selectedProfileKey) errs.selectedProfileKey = 'Please select an asset.';
    if (!sourceLocationId) errs.sourceLocationId = 'Please select a source location.';
    if (!destinationLocation) errs.destinationLocation = 'Please select a destination.';

    if (selectedSource && destinationLocation === selectedSource.LocationName) {
      errs.destinationLocation = 'Destination cannot be the same as the source location.';
    }

    const qty = Number(transferQty);
    if (!transferQty || Number.isNaN(qty) || qty < 1) {
      errs.transferQty = 'Quantity must be at least 1.';
    } else if (selectedSource && qty > Number(selectedSource.Quantity)) {
      errs.transferQty = `Insufficient stock available. Available: ${selectedSource.Quantity}.`;
    }
    return errs;
  };

  const resetForm = () => {
    setSelectedProfileKey('');
    setSourceLocationId('');
    setDestinationLocation('');
    setTransferQty('');
    setRemarks('');
    setErrors({});
  };

  const handleConfirm = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const qty = Number(transferQty);
      await transferAsset(Number(sourceLocationId), {
        destinationLocation: destinationLocation.trim(),
        quantity: qty,
        user: loggedInUser,
      });

      setSnackbar({
        open: true,
        message: `Transferred ${qty} unit(s) of "${selectedProfile.ItemName}" to ${destinationLocation}.`,
        severity: 'success',
      });

      setTimeout(() => {
        navigate('/equipment-encoding');
      }, 1500);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setSnackbar({ open: true, message: apiMessage || 'Failed to transfer asset.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Send / Transfer Asset" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT ENCODING" />
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
          Send / Transfer Asset Location
        </Typography>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <Grid container spacing={2}>
            {/* 1. Select Asset Profile */}
            <Grid item xs={12}>
              <TextField
                fullWidth select label="Select Asset Profile *" value={selectedProfileKey}
                onChange={(e) => setSelectedProfileKey(e.target.value)}
                error={!!errors.selectedProfileKey} helperText={errors.selectedProfileKey}
              >
                <MenuItem value="" disabled sx={{ fontFamily: font }}>Select an asset</MenuItem>
                {items.map((i) => (
                  <MenuItem key={i.ProfileKey} value={i.ProfileKey} sx={{ fontFamily: font }}>
                    {i.ItemName} {i.Brand ? `(${i.Brand})` : ''} {i.SerialNumber ? `[S/N: ${i.SerialNumber}]` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* 2. Select Source Location */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select label="Source Location *" value={sourceLocationId}
                onChange={(e) => { setSourceLocationId(e.target.value); setTransferQty(''); }}
                error={!!errors.sourceLocationId} helperText={errors.sourceLocationId}
                disabled={!selectedProfileKey}
              >
                <MenuItem value="" disabled sx={{ fontFamily: font }}>Select source location</MenuItem>
                {selectedProfile?.Locations.map((l) => (
                  <MenuItem key={l.Id} value={String(l.Id)} sx={{ fontFamily: font }}>
                    {l.LocationName || 'Storage'} — Available: {l.Quantity}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* 3. Destination Location / Section */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select label="Destination Location / Section *" value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                error={!!errors.destinationLocation} helperText={errors.destinationLocation}
                disabled={!sourceLocationId}
              >
                <MenuItem value="" disabled sx={{ fontFamily: font }}>Select destination</MenuItem>
                {DESTINATION_OPTIONS.filter((d) => d !== selectedSource?.LocationName).map((d) => (
                  <MenuItem key={d} value={d} sx={{ fontFamily: font }}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Current details chip if source is selected */}
            {selectedSource && (
              <Grid item xs={12}>
                <Chip
                  label={`Current Location Stock: ${selectedSource.Quantity} unit(s) at ${selectedSource.LocationName || 'Storage'}`}
                  sx={{ fontFamily: font, fontWeight: 600, backgroundColor: '#eef0ff', color: THEME.navy }}
                />
              </Grid>
            )}

            {/* 4. Quantity to Send */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="number" label="Quantity to Transfer *" value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                error={!!errors.transferQty} helperText={errors.transferQty}
                disabled={!sourceLocationId}
                inputProps={{ min: 1, max: selectedSource?.Quantity }}
              />
            </Grid>

            {/* 5. Remarks */}
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