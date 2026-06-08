import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import axios from 'axios';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, MenuItem,
  InputAdornment, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'];

const statusColor = (status) => {
  if (status === 'In Stock') return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
  if (status === 'Low Stock') return { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' };
  return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' };
};

const Equipment = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/equipment');
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(item => {
    const matchSearch =
      item.ItemName?.toLowerCase().includes(search.toLowerCase()) ||
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
              <TextField size="small" placeholder="Search by name, brand, serial no., location..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                sx={{ backgroundColor: 'white', borderRadius: 1, minWidth: 300 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
              <TextField select size="small" label="Filter by Status" value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ backgroundColor: 'white', borderRadius: 1, minWidth: 160 }}>
                <MenuItem value="">All</MenuItem>
                {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#1b0892' }} />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999' }}>No equipment found.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        {['Item Name', 'Description', 'Brand', 'Qty', 'Status', 'Serial No.', 'Condition', 'Location', 'Specifications'].map(h => (
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
                                backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                                fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600
                              }} />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.SerialNumber}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.Condition}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{item.Location}</TableCell>
                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', maxWidth: 150 }}>{item.Specifications}</TableCell>
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
        </>
      )}
    </Header>
  );
};

export default Equipment;