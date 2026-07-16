import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Chip, TablePagination, Button,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const font = 'Poppins, sans-serif';
const navy = '#1b0892';

const ACTION_OPTIONS = ['All', 'Transferred', 'Added', 'Added Stock', 'Updated', 'Deleted'];

const actionColor = (action) => {
  if (action === 'Transferred') return { bg: '#fff3e0', text: '#e65100' };
  if (action === 'Added') return { bg: '#e3f2fd', text: '#1565c0' };
  if (action === 'Added Stock') return { bg: '#e8f5e9', text: '#2e7d32' };
  if (action === 'Updated') return { bg: '#ede7f6', text: '#5e35b1' };
  if (action === 'Deleted') return { bg: '#ffebee', text: '#c62828' };
  return { bg: '#f5f5f5', text: '#555' };
};

const SupplyTransactionHistory = () => {
  const navigate = useNavigate();
  const loggedInUser = localStorage.getItem('suppliesUser') || '';

  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    if (!loggedInUser) {
      navigate('/supplies-encoding');
      return;
    }
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/supply-transactions');
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load supply transaction history:', err);
      setTransactions([]);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesAction = actionFilter === 'All' || t.action_type === actionFilter;
      const matchesSearch = !q
        || (t.supply_name || '').toLowerCase().includes(q)
        || (t.created_by || '').toLowerCase().includes(q)
        || (t.destination_section || '').toLowerCase().includes(q);
      return matchesAction && matchesSearch;
    });
  }, [transactions, search, actionFilter]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? d : date.toLocaleString();
  };

  const formatDelta = (t) => {
    const val = Number(t.quantity_changed);
    if (Number.isNaN(val)) return t.quantity_changed;
    return val > 0 ? `+${val}` : `${val}`;
  };

  return (
    <>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Supply Transaction History" onMenuClick={toggleDrawer} subtitle="OFFICE SUPPLIES ENCODING" />
            <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontFamily: font, fontSize: 14, color: '#555' }}>
                Logged in as <strong>{loggedInUser}</strong>
              </Typography>
              <Button
                variant="outlined" size="small"
                onClick={() => navigate('/supplies-encoding')}
                sx={{ fontFamily: font, textTransform: 'none', borderColor: navy, color: navy }}
              >
                Back to Supplies Records
              </Button>
            </Box>
          </>
        )}
      </Header>

      <Box sx={{ p: 3, maxWidth: 1300, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: navy }}>
            Supply Transfer History
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small" placeholder="Search supply, user, destination"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ minWidth: 280 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
            />
            <TextField
              size="small" select value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 160 }}
            >
              {ACTION_OPTIONS.map((a) => (
                <MenuItem key={a} value={a} sx={{ fontFamily: font }}>{a === 'All' ? 'All Actions' : a}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fafafa' }}>
                  {['Date', 'Supply Item', 'Action', 'Qty Change', 'Previous Qty', 'New Qty', 'Destination', 'User'].map((h) => (
                    <TableCell key={h} sx={{ fontFamily: font, fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((t) => {
                  const ac = actionColor(t.action_type);
                  return (
                    <TableRow key={t.transaction_id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                      <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{formatDate(t.created_at)}</TableCell>
                      <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{t.supply_name}</TableCell>
                      <TableCell>
                        <Chip label={t.action_type} size="small" sx={{ fontFamily: font, fontWeight: 600, fontSize: 11, backgroundColor: ac.bg, color: ac.text }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{formatDelta(t)}</TableCell>
                      <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{t.previous_quantity}</TableCell>
                      <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{t.new_quantity}</TableCell>
                      <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{t.destination_section || '—'}</TableCell>
                      <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{t.created_by || '—'}</TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ fontFamily: font, py: 4, color: '#888' }}>
                      No supply transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[15, 25, 50]}
          />
        </Paper>
      </Box>
    </>
  );
};

export default SupplyTransactionHistory;