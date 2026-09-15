import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  InputAdornment, CircularProgress, TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getTransactions } from '../api/equipmentApi';

const font = 'Poppins, sans-serif';
const navy = '#1b0892';
const RELEASE_ACTION_TYPES = ['LOCATION_TRANSFER', 'Sent Asset'];

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleString();
};

const Equipment = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      const releases = (Array.isArray(data) ? data : []).filter((t) => RELEASE_ACTION_TYPES.includes(t.action_type));
      setRecords(releases);
    } catch (err) {
      console.error('Error fetching equipment release records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      (r.asset_name || '').toLowerCase().includes(q) ||
      (r.control_number || '').toLowerCase().includes(q) ||
      (r.taken_by || '').toLowerCase().includes(q) ||
      (r.created_by || '').toLowerCase().includes(q)
    );
  }, [records, search]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Library Equipment" onMenuClick={toggleDrawer} subtitle="RECORDS OF ACQUISITION" />
          <Box sx={{ p: 3, backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField size="small" placeholder="Search by item, control number, taken by, released by..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                sx={{ backgroundColor: 'white', borderRadius: 1, minWidth: 320 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            </Box>
            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: navy }} />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: font, color: '#999' }}>No release records found.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        {/* Added Control Number to headers */}
                        {['Date Released', 'Control Number', 'Qty', 'Item/s', 'Taken By', 'Released By'].map(h => (
                          <TableCell key={h} sx={{ fontFamily: font, fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.map((r) => (
                        <TableRow key={r.transaction_id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{formatDate(r.created_at)}</TableCell>
                          {/* Added Control Number to body */}
                          <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{r.control_number || '—'}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{Math.abs(Number(r.quantity_changed) || 0)}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13, fontWeight: 600 }}>{r.asset_name}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{r.taken_by || '—'}</TableCell>
                          <TableCell sx={{ fontFamily: font, fontSize: 13 }}>{r.created_by || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
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
      )}
    </Header>
  );
};

export default Equipment;