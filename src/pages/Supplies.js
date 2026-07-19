import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import axios from 'axios';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, MenuItem,
  InputAdornment, CircularProgress, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'];

const statusColor = (status) => {
  if (status === 'In Stock') return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
  if (status === 'Low Stock') return { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' };
  return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' };
};

const deriveMasterStatus = (quantity) => {
  const qty = Number(quantity) || 0;
  if (qty <= 0) return 'Out of Stock';
  if (qty < 5) return 'Low Stock';
  return 'In Stock';
};



const Supplies = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Expandable Rows State
  const [expandedRows, setExpandedRows] = useState(new Set());
  const toggleExpand = (profileKey) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(profileKey) ? next.delete(profileKey) : next.add(profileKey);
      return next;
    });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/supplies/grouped');
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching supplies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(item => {
    const matchSearch =
      item.ItemName?.toLowerCase().includes(search.toLowerCase()) ||
      item.Brand?.toLowerCase().includes(search.toLowerCase()) ||
      (item.location_balances || []).some(loc => 
        loc.LocationName?.toLowerCase().includes(search.toLowerCase())
      );
    const matchStatus = filterStatus ? deriveMasterStatus(item.TotalQuantity) === filterStatus : true;
    return matchSearch && matchStatus;
  });

  // Flatten all location balances to count per-location statuses
  const allLocations = items.flatMap(i => i.location_balances || []);
  const counts = {
    total: allLocations.reduce((sum, loc) => sum + (Number(loc.Quantity) || 0), 0),
    inStock: allLocations.filter(loc => loc.Status === 'In Stock').length,
    lowStock: allLocations.filter(loc => loc.Status === 'Low Stock').length,
    outOfStock: allLocations.filter(loc => loc.Status === 'Out of Stock').length,
  };

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Office Supplies" onMenuClick={toggleDrawer} subtitle="OFFICE SUPPLIES INVENTORY" />
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
              <TextField size="small" placeholder="Search by name, brand, control no., location..."
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
                  <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999' }}>No supplies found.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        {['', 'Item Name', 'Brand', 'Stock Level', 'Description', 'Specifications', 'Status'].map(h => (
                          <TableCell key={h} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((item) => {
                        const status = deriveMasterStatus(item.TotalQuantity);
                        const sc = statusColor(status);
                        const isOpen = expandedRows.has(item.ProfileKey);
                        
                        // Read UOM, description, and specifications from the first location balance directly
                        const unit = item.location_balances[0]?.Unit || 'Pieces';
                        const desc = item.location_balances[0]?.Description;
                        const specs = item.location_balances[0]?.Specifications;

                        return (
                          <React.Fragment key={item.ProfileKey}>
                            <TableRow sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                              <TableCell sx={{ width: 32 }}>
                                <IconButton size="small" onClick={() => toggleExpand(item.ProfileKey)}>
                                  {isOpen ? '▼' : '►'}
                                </IconButton>
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600 }}>{item.ItemName}</TableCell>
                              <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>
                                {item.Brand && item.Brand !== 'N/A' ? item.Brand : <span style={{ color: '#aaa', fontStyle: 'italic' }}>N/A</span>}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600 }}>{`${item.TotalQuantity} ${unit}`}</TableCell>
                              <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', maxWidth: 150 }}>
                                {desc && desc !== 'N/A' ? desc : <span style={{ color: '#aaa', fontStyle: 'italic' }}>N/A</span>}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#666', maxWidth: 150 }}>
                                {specs && specs !== 'N/A' ? specs : <span style={{ color: '#aaa', fontStyle: 'italic' }}>N/A</span>}
                              </TableCell>
                              <TableCell>
                                <Chip label={status} size="small" sx={{
                                  backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                                  fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600
                                }} />
                              </TableCell>
                            </TableRow>

                            {/* Dropdown Locations Table */}
                            {isOpen && (
                              <TableRow>
                                <TableCell colSpan={7} sx={{ backgroundColor: '#fafcff', py: 2 }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        {['Location', 'Qty', 'Status'].map((h) => (
                                          <TableCell key={h} sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 10, color: '#888', textTransform: 'uppercase' }}>{h}</TableCell>
                                        ))}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {item.location_balances.map((loc) => {
                                        const locSc = statusColor(loc.Status);
                                        return (
                                          <TableRow key={loc.Id}>
                                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>
                                              {loc.LocationName && loc.LocationName !== 'N/A' ? loc.LocationName : <span style={{ color: '#aaa', fontStyle: 'italic' }}>N/A</span>}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 12 }}>{`${loc.Quantity} ${loc.Unit || 'Pieces'}`}</TableCell>
                                            <TableCell>
                                              <Chip label={loc.Status} size="small" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, backgroundColor: locSc.bg, color: locSc.text }} />
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
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

export default Supplies;