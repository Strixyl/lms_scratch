import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Grid, MenuItem,
  InputAdornment, CircularProgress, TablePagination, Snackbar, Alert,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useNavigate } from 'react-router-dom';
import { getSupplies, getSupplyTransactions, disburseSupply } from '../api/suppliesApi';
import { THEME } from '../constants/equipmentConstants';

const font = 'Poppins, sans-serif';
const navy = '#1b0892';

const SECTION_OPTIONS = [
  'Library Office', 'Technical', 'Reference', 'KDC', 'Circulation',
  'Theology', 'Filipiniana', 'American Corner', 'Law', 'Archives',
  'Graduate Studies', 'Cyber'
];

const emptyDisbursementForm = {
  section: '',
  itemName: '',
  quantity: '',
  brand: '',
  unit: '',
  specifications: '',
  dateDisbursed: new Date().toISOString().split('T')[0],
  recipient: '',
  releasedBy: '',
};

const Supplies = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [suppliesList, setSuppliesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const [disburseForm, setDisburseForm] = useState(emptyDisbursementForm);
  const [disburseErrors, setDisburseErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loggedInUser] = useState(localStorage.getItem('suppliesUser') || 'Admin');
  const [availableQuantity, setAvailableQuantity] = useState(0);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [transactions, supplies] = await Promise.all([
        getSupplyTransactions(),
        getSupplies()
      ]);
      const disbursed = (Array.isArray(transactions) ? transactions : [])
        .filter((t) => t.action_type === 'Disbursed');
      setRecords(disbursed);
      setSuppliesList(supplies);
    } catch (err) {
      console.error('Error fetching supply records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleDisburseChange = (e) => {
    const { name, value } = e.target;
    setDisburseForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'itemName') {
        const selected = suppliesList.find(s => s.ItemName === value);
        if (selected) {
          updated.brand = selected.Brand || '';
          updated.unit = selected.Unit || 'Pieces';
          updated.specifications = selected.Specifications || '';
          setAvailableQuantity(selected.Quantity || 0);
        } else {
          updated.brand = '';
          updated.unit = '';
          updated.specifications = '';
          setAvailableQuantity(0);
        }
        updated.quantity = '';
      }

      return updated;
    });
  };

  const handleSetMaxQuantity = () => {
    if (availableQuantity > 0) {
      setDisburseForm(prev => ({ ...prev, quantity: availableQuantity.toString() }));
    }
  };

  const validateDisburseForm = () => {
    const errors = {};
    if (!disburseForm.section) errors.section = 'Section is required.';
    if (!disburseForm.itemName) errors.itemName = 'Item name is required.';
    if (!disburseForm.quantity || Number(disburseForm.quantity) < 1) {
      errors.quantity = 'Quantity must be at least 1.';
    } else if (Number(disburseForm.quantity) > availableQuantity) {
      errors.quantity = `Quantity cannot exceed available stock (${availableQuantity} ${disburseForm.unit || 'Pieces'}).`;
    }
    if (!disburseForm.recipient) errors.recipient = 'Recipient is required.';
    if (!disburseForm.releasedBy) errors.releasedBy = 'Released by is required.';
    return errors;
  };

  const handleDisburseSubmit = async () => {
    const errors = validateDisburseForm();
    setDisburseErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await disburseSupply({ ...disburseForm, user: loggedInUser });
      setSnackbar({ open: true, message: 'Disbursement recorded successfully!', severity: 'success' });
      setDisburseForm(emptyDisbursementForm);
      setDisburseErrors({});
      setAvailableQuantity(0);
      fetchRecords();
    } catch (err) {
      setSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to disburse.', severity: 'error' });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      (r.supply_name || '').toLowerCase().includes(q) ||
      (r.taken_by || '').toLowerCase().includes(q) ||
      (r.destination_section || '').toLowerCase().includes(q)
    );
  }, [records, search]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const formatDate = (d) => !d ? '—' : new Date(d).toLocaleDateString();

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Office Supplies" onMenuClick={toggleDrawer} subtitle="SUPPLIES INVENTORY & DISBURSEMENTS" />
          <Box sx={{ p: 3, backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/supplies-encoding')} sx={{ fontFamily: font, textTransform: 'none', borderColor: navy, color: navy }}>Back to Encoding</Button>
            </Box>

            {/* disbursement form */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3, mb: 4 }}>
              <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: navy, mb: 2 }}>New Disbursement</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField fullWidth select label="Section *" name="section" value={disburseForm.section} onChange={handleDisburseChange} error={!!disburseErrors.section} helperText={disburseErrors.section}>
                    <MenuItem value="" disabled sx={{ fontFamily: font }}>Select Section</MenuItem>
                    {SECTION_OPTIONS.map((s) => (<MenuItem key={s} value={s} sx={{ fontFamily: font }}>{s}</MenuItem>))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField fullWidth select label="Item Name *" name="itemName" value={disburseForm.itemName} onChange={handleDisburseChange} error={!!disburseErrors.itemName} helperText={disburseErrors.itemName}>
                    <MenuItem value="" disabled sx={{ fontFamily: font }}>Select Item</MenuItem>
                    {suppliesList.map((s) => (
                      <MenuItem key={s.Id} value={s.ItemName} sx={{ fontFamily: font }}>
                        {s.ItemName} {s.Brand && s.Brand !== 'N/A' ? `(${s.Brand})` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    label="Quantity *"
                    name="quantity"
                    type="number"
                    value={disburseForm.quantity}
                    onChange={handleDisburseChange}
                    error={!!disburseErrors.quantity}
                    helperText={disburseErrors.quantity}
                    inputProps={{
                      style: { fontFamily: font },
                      min: 1,
                      max: availableQuantity
                    }}
                    InputProps={{
                      endAdornment: availableQuantity > 0 && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={handleSetMaxQuantity}
                            title={`Set to max (${availableQuantity})`}
                            sx={{
                              color: navy,
                              '&:hover': { backgroundColor: 'rgba(27, 8, 146, 0.04)' }
                            }}
                          >
                            <ArrowDropDownIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {availableQuantity > 0 && (
                    <Typography sx={{ fontFamily: font, fontSize: 11, color: '#666', mt: 0.5 }}>
                      Available: {availableQuantity} {disburseForm.unit || 'Pieces'}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField fullWidth label="Brand" name="brand" value={disburseForm.brand} disabled inputProps={{ style: { fontFamily: font } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField fullWidth label="Unit" name="unit" value={disburseForm.unit} disabled inputProps={{ style: { fontFamily: font } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField fullWidth label="Specifications" name="specifications" value={disburseForm.specifications} disabled inputProps={{ style: { fontFamily: font } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField fullWidth label="Date Disbursed" name="dateDisbursed" type="date" value={disburseForm.dateDisbursed} onChange={handleDisburseChange} InputLabelProps={{ shrink: true }} inputProps={{ style: { fontFamily: font } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField fullWidth label="Recipient *" name="recipient" value={disburseForm.recipient} onChange={handleDisburseChange} error={!!disburseErrors.recipient} helperText={disburseErrors.recipient} inputProps={{ style: { fontFamily: font } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField fullWidth label="Released By *" name="releasedBy" value={disburseForm.releasedBy} onChange={handleDisburseChange} error={!!disburseErrors.releasedBy} helperText={disburseErrors.releasedBy} inputProps={{ style: { fontFamily: font } }} />
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={handleDisburseSubmit} sx={{ backgroundColor: navy, fontFamily: font, textTransform: 'none', px: 4 }}>Submit Disbursement</Button>
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: navy }}>Disbursed Items</Typography>
              <TextField size="small" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ backgroundColor: 'white', borderRadius: 1, minWidth: 320 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            </Box>

            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
              {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: navy }} /></Box> : filtered.length === 0 ? <Box sx={{ py: 6, textAlign: 'center' }}><Typography sx={{ fontFamily: font, color: '#999' }}>No disbursed records found.</Typography></Box> : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        {['Date Disbursed', 'Section', 'Item/s', 'Qty', 'Recipient', 'Released By'].map(h => (<TableCell key={h} sx={{ fontFamily: font, fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{h}</TableCell>))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.map((r) => (
                        <TableRow key={r.transaction_id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{formatDate(r.created_at)}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{r.destination_section || '—'}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{r.supply_name}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{Math.abs(Number(r.quantity_changed) || 0)}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{r.taken_by || '—'}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{r.created_by || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[15, 25, 50]} />
            </Paper>
          </Box>
          <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert severity={snackbar.severity} sx={{ fontFamily: font }}>{snackbar.message}</Alert>
          </Snackbar>
        </>
      )}
    </Header>
  );
};

export default Supplies;