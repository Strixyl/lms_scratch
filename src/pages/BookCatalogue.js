import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  Divider,
  Stack,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  TableChart as TableChartIcon,
  GridView as GridViewIcon,
  Visibility as VisibilityIcon,
  PostAdd as PostAddIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const initialEncodeState = {
  library: '',
  section: '',
  authorName: '',
  publisherAuthor: '',
  bookTitle: '',
  accessionNumber: '',
  callNumber: '',
  barcodeValue: '',
  isoCodeValue: '',
  copyNumber: '',
};

const librariesList = [
  "Elementary School Library",
  "Henry Luce III Library",
  "Kindergarten Library",
  "Junior High School Library",
  "Law Library",
  "Senior High School Library",
  "Theology Library"
];

const sectionsList = [
  "American Corner",
  "Archives",
  "Circulation",
  "Elementary",
  "Filipiniana",
  "General Library",
  "Graduate Studies Library",
  "Junior High School",
  "Kindergarten",
  "Medicine",
  "Meyer Asian Collection",
  "Law",
  "Library Science Collection",
  "Periodicals",
  "Rare Filipiniana",
  "Reference",
  "Senior High School",
  "Serials",
  "Theology Library",
  "Thesis Collection"
];

const BookCatalogue = () => {
  const [cardPackets, setCardPackets] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLibraryFilter, setSelectedLibraryFilter] = useState('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');

  // Preview & Delete states
  const [previewBook, setPreviewBook] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Staff Encoding Modal states
  const [encodeModalOpen, setEncodeModalOpen] = useState(false);
  const [encodeData, setEncodeData] = useState(initialEncodeState);

  const getBarcodePrefix = (lib) => {
    const map = {
      'Henry Luce III Library': 'HL00',
      'Elementary School Library': 'ESL00',
      'Kindergarten Library': 'KL00',
      'Junior High School Library': 'JHSL00',
      'Law Library': 'HL00',
      'Senior High School Library': 'SHSL00',
      'Theology Library': 'TL00',
    };
    return map[lib] || '';
  };

  const getIsoCode = (lib) => {
    const map = {
      'Henry Luce III Library': 'CPULRS-06 REV. 02 April 13,2023',
      'Elementary School Library': 'CPULRS-06 REV. 02 April 13,2023',
      'Kindergarten Library': 'CPULRS-06 REV. 02 April 13,2023',
      'Junior High School Library': 'CPUJHSL-2023',
      'Law Library': 'CPULRS-06 REV. 02 April 13,2023',
      'Senior High School Library': 'CPUSHSL-2023',
      'Theology Library': 'CPUTL-2023',
    };
    return map[lib] || '';
  };

  const handleEncodeFieldChange = (field, val) => {
    setEncodeData((prev) => ({ ...prev, [field]: val }));
  };

  const handleEncodeLibChange = (val) => {
    const lib = val || '';
    const prefix = getBarcodePrefix(lib);
    const iso = getIsoCode(lib);
    const acc = encodeData.accessionNumber || '';
    setEncodeData((prev) => ({
      ...prev,
      library: lib,
      isoCodeValue: iso,
      barcodeValue: acc ? `${prefix}${acc}` : prev.barcodeValue,
    }));
  };

  const handleEncodeAccChange = (val) => {
    const prefix = getBarcodePrefix(encodeData.library);
    setEncodeData((prev) => ({
      ...prev,
      accessionNumber: val,
      barcodeValue: `${prefix}${val}`,
    }));
  };

  const resetEncodeForm = () => {
    setEncodeData(initialEncodeState);
  };

  const handleSaveEncoding = async (shouldEncodeAnother = false) => {
    const lib = (encodeData.library || '').trim();
    const title = (encodeData.bookTitle || '').trim();
    const acc = (encodeData.accessionNumber || '').trim();

    if (!lib || !title || !acc) {
      alert('Please fill out Library, Book Title, and Accession Number!');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/card-and-packet', {
        selectedLibrary1: lib,
        section1: (encodeData.section || '').trim(),
        authorName1: (encodeData.authorName || '').trim(),
        publisherAuthor1: (encodeData.publisherAuthor || '').trim(),
        bookTitle1: title,
        accessionNumber1: acc,
        callNumber1: (encodeData.callNumber || '').trim(),
        barcodeValue1: (encodeData.barcodeValue || '').trim(),
        isoCodeValue1: (encodeData.isoCodeValue || '').trim(),
        copyNumber1: (encodeData.copyNumber || '').trim(),
        selectedLibrary2: '', section2: '', authorName2: '', publisherAuthor2: '', bookTitle2: '', accessionNumber2: '', callNumber2: '', copyNumber2: '', barcodeValue2: '', isoCodeValue2: '',
        selectedLibrary3: '', section3: '', authorName3: '', publisherAuthor3: '', bookTitle3: '', accessionNumber3: '', callNumber3: '', copyNumber3: '', barcodeValue3: '', isoCodeValue3: '',
        selectedLibrary4: '', section4: '', authorName4: '', publisherAuthor4: '', bookTitle4: '', accessionNumber4: '', callNumber4: '', copyNumber4: '', barcodeValue4: '', isoCodeValue4: '',
      });

      alert('Book card and packet entry encoded successfully!');
      fetchCardPackets();

      if (shouldEncodeAnother) {
        resetEncodeForm();
      } else {
        setEncodeModalOpen(false);
        resetEncodeForm();
      }
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.message);
      } else {
        console.error('Error encoding book:', error);
        alert('Failed to encode book entry.');
      }
    }
  };

  const fetchCardPackets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/card-and-packet');
      const formatted = res.data.map((row, index) => ({
        id: row.CardID || row.id || `card-${index}`,
        ...row,
      }));
      setCardPackets(formatted);
    } catch (error) {
      console.error('Error fetching card and packet data:', error);
    }
  };

  useEffect(() => {
    fetchCardPackets();
  }, []);

  // Helper to format full author name from record
  const getAuthorName = (record, i) => {
    const directName = record[`authorName${i}`] || '';
    if (directName && directName.trim()) return directName.trim();
    const last = record[`authorLastName${i}`] || '';
    const first = record[`authorFirstName${i}`] || '';
    const mi = record[`authorMiddleInitial${i}`] || '';
    if (!last && !first && !mi) return '';
    if (!first && !mi) return last;
    return `${last}${last && first ? ', ' : ''}${first}${mi ? ' ' + mi : ''}`.trim();
  };

  // Flatten book entries (1-4)
  const flatBookData = useMemo(() => {
    const list = [];
    cardPackets.forEach((record, recordIndex) => {
      const recId = record.CardID || record.id || record.CardId || `rec-${recordIndex}`;
      for (let i = 1; i <= 4; i++) {
        if (record[`selectedLibrary${i}`] || record[`bookTitle${i}`]) {
          list.push({
            id: `${recId}-${i}`,
            recordId: recId,
            bookNum: i,
            library: record[`selectedLibrary${i}`] || 'N/A',
            section: record[`section${i}`] || 'General',
            callNumber: record[`callNumber${i}`] || '',
            title: record[`bookTitle${i}`] || 'Untitled',
            authorName: getAuthorName(record, i),
            publisher: record[`publisherAuthor${i}`] || record[`publisher${i}`] || '',
            copyNumber: record[`copyNumber${i}`] || '',
            barcode: record[`barcodeValue${i}`] || '',
            isoCode: record[`isoCodeValue${i}`] || '',
            accessionNumber: record[`accessionNumber${i}`] || '',
          });
        }
      }
    });
    return list;
  }, [cardPackets]);

  // Unique Library and Section values matching CardAndPacket
  const availableLibraries = useMemo(() => {
    const libs = new Set([...librariesList, ...flatBookData.map((b) => b.library).filter((l) => l && l !== 'N/A')]);
    return ['ALL', ...Array.from(libs).sort()];
  }, [flatBookData]);

  const availableSections = useMemo(() => {
    const secs = new Set([...sectionsList, ...flatBookData.map((b) => b.section).filter(Boolean)]);
    return ['ALL', ...Array.from(secs).sort()];
  }, [flatBookData]);

  const modalLibrariesOptions = useMemo(() => {
    const libs = new Set([...librariesList, ...flatBookData.map((b) => b.library).filter((l) => l && l !== 'N/A')]);
    return Array.from(libs).sort();
  }, [flatBookData]);

  const modalSectionsOptions = useMemo(() => {
    const secs = new Set([...sectionsList, ...flatBookData.map((b) => b.section).filter(Boolean)]);
    return Array.from(secs).sort();
  }, [flatBookData]);

  // Selection set helper (Handles both 'include' and 'exclude' DataGrid v8 models)
  const selectedSet = useMemo(() => {
    if (!rowSelectionModel) return new Set();

    let rawIds = new Set();
    let isExclude = false;

    if (rowSelectionModel && typeof rowSelectionModel === 'object' && !Array.isArray(rowSelectionModel) && !(rowSelectionModel instanceof Set)) {
      isExclude = rowSelectionModel.type === 'exclude';
      if (rowSelectionModel.ids instanceof Set) {
        rawIds = rowSelectionModel.ids;
      } else if (Array.isArray(rowSelectionModel.ids)) {
        rawIds = new Set(rowSelectionModel.ids);
      }
    } else if (rowSelectionModel instanceof Set) {
      rawIds = rowSelectionModel;
    } else if (Array.isArray(rowSelectionModel)) {
      rawIds = new Set(rowSelectionModel);
    }

    if (isExclude) {
      const selected = new Set();
      flatBookData.forEach((b) => {
        if (!rawIds.has(b.id)) {
          selected.add(b.id);
        }
      });
      return selected;
    }

    return rawIds;
  }, [rowSelectionModel, flatBookData]);

  // Always guaranteed object with valid .ids Set for DataGrid v8
  const normalizedSelectionModel = useMemo(() => {
    if (rowSelectionModel && rowSelectionModel.ids instanceof Set) return rowSelectionModel;
    return { type: 'include', ids: selectedSet };
  }, [rowSelectionModel, selectedSet]);

  // Filtered book records (Always keeps checked/selected books visible)
  const filteredBookData = useMemo(() => {
    return flatBookData.filter((book) => {
      // Always include checked/selected books so searching does NOT filter them out
      if (selectedSet.has(book.id)) return true;

      const matchesLib = selectedLibraryFilter === 'ALL' || book.library === selectedLibraryFilter;
      const matchesSec = selectedSectionFilter === 'ALL' || book.section === selectedSectionFilter;

      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesLib && matchesSec;

      const author = (book.authorName || '').toLowerCase();
      const matchesSearch =
        book.title.toLowerCase().includes(term) ||
        author.includes(term) ||
        book.callNumber.toLowerCase().includes(term) ||
        book.accessionNumber.toLowerCase().includes(term) ||
        book.barcode.toLowerCase().includes(term) ||
        book.library.toLowerCase().includes(term);

      return matchesLib && matchesSec && matchesSearch;
    });
  }, [flatBookData, searchTerm, selectedLibraryFilter, selectedSectionFilter, selectedSet]);

  const selectedRows = useMemo(() => {
    return flatBookData.filter((row) => selectedSet.has(row.id));
  }, [flatBookData, selectedSet]);

  const isAllSelected = useMemo(() => {
    return filteredBookData.length > 0 && filteredBookData.every((b) => selectedSet.has(b.id));
  }, [filteredBookData, selectedSet]);

  const handleRowSelectionModelChange = (newModel) => {
    if (newModel && typeof newModel === 'object' && !Array.isArray(newModel)) {
      setRowSelectionModel({
        type: newModel.type || 'include',
        ids: newModel.ids instanceof Set ? newModel.ids : new Set(newModel.ids || [])
      });
    } else if (newModel instanceof Set) {
      setRowSelectionModel({ type: 'include', ids: newModel });
    } else if (Array.isArray(newModel)) {
      setRowSelectionModel({ type: 'include', ids: new Set(newModel) });
    } else {
      setRowSelectionModel({ type: 'include', ids: new Set() });
    }
  };

  const handleToggleSelectRow = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRowSelectionModel({ type: 'include', ids: next });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setRowSelectionModel({ type: 'include', ids: new Set() });
    } else {
      const next = new Set(selectedSet);
      filteredBookData.forEach((b) => next.add(b.id));
      setRowSelectionModel({ type: 'include', ids: next });
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : filteredBookData;
    if (dataToExport.length === 0) {
      alert('No data available to export.');
      return;
    }

    const excelData = dataToExport.map((row) => ({
      'Library': row.library || 'N/A',
      'Section': row.section || '',
      'Call Number': row.callNumber || '',
      'Book Title': row.title || '',
      'Author': row.authorName || row.publisher || '',
      'Publisher': row.publisher || '',
      'Copy Number': row.copyNumber || '',
      'Barcode': row.barcode || '',
      'ISO Code': row.isoCode || '',
      'Accession Number': row.accessionNumber || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Card and Packet Records');

    const dateStamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `HLL_CardAndPacket_${dateStamp}.xlsx`);
  };

  // Print selected rows as book cards
  const handlePrintSelected = () => {
    if (selectedRows.length === 0) {
      alert('Select at least one book to print.');
      return;
    }

    const printWindow = window.open('', '', 'width=1000,height=800');
    const doc = printWindow.document;

    doc.open();
    doc.write(`
      <!DOCTYPE html><html><head><title>Print Book Cards</title>
      <style>
        @page { size: Letter; margin: 0.5in; }
        html, body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; font-size: 11pt; }
        .card-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 480px; gap: 8px; }
        .card { border: 1px solid black; padding: 10px; display: flex; flex-direction: column; box-sizing: border-box; }
        .row { display: flex; align-items: center; margin-bottom: 6px; }
        .row .label { white-space: nowrap; margin-right: 6px; }
        table { border-collapse: collapse; width: 100%; margin-top: 6px; }
        th, td { border: 1px solid black; padding: 4px; text-align: left; font-size: 10pt; }
      </style>
      </head><body><div id="print-content"><div class="card-grid">
    `);

    selectedRows.forEach((row) => {
      doc.write(`
        <div class="card">
          <div style="text-align:center; font-weight:bold;">Central Philippine University</div>
          <div class="row"><span class="label">Author:</span><span>${row.authorName || row.publisher || ''}</span></div>
          <div class="row"><span class="label">Title:</span><span>${row.title}</span></div>
          <div class="row"><span class="label">Acc. No.:</span><span>${row.accessionNumber}</span></div>
          <div class="row"><span class="label">Barcode:</span><span>${row.barcode}</span></div>
          <div class="row"><span class="label">Call No.:</span><span>${row.callNumber}</span></div>
          <table>
            <thead><tr><th>Date Borrowed/Due</th><th>Borrower's Name</th><th>Borrower's ID</th></tr></thead>
            <tbody>
              ${Array.from({ length: 6 }).map(() => '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('')}
            </tbody>
          </table>
        </div>
      `);
    });

    doc.write('</div></div></body></html>');
    doc.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    };
  };

  // Delete Action
  const handleExecuteDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);

    if (target === 'BATCH') {
      try {
        await Promise.all(
          selectedRows.map((row) =>
            axios.delete(`http://localhost:5000/api/card-and-packet/${row.recordId}/book/${row.bookNum}`)
          )
        );
        setRowSelectionModel({ type: 'include', ids: new Set() });
        fetchCardPackets();
      } catch (error) {
        console.error('Error deleting entries:', error);
        alert('Failed to delete entries.');
      }
    } else if (target) {
      try {
        await axios.delete(`http://localhost:5000/api/card-and-packet/${target.recordId}/book/${target.bookNum}`);
        fetchCardPackets();
      } catch (error) {
        console.error('Error deleting book entry:', error);
        alert('Failed to delete entry.');
      }
    }
  };

  const columns = [
    {
      field: 'library',
      headerName: 'Library',
      flex: 1.2,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: params.value?.toLowerCase().includes('main') ? '#fef3c7' : '#f1f5f9',
            color: params.value?.toLowerCase().includes('main') ? '#92400e' : '#334155',
            border: '1px solid',
            borderColor: params.value?.toLowerCase().includes('main') ? '#fcd34d' : '#cbd5e1',
          }}
        />
      ),
    },
    { field: 'section', headerName: 'Section', flex: 1, minWidth: 110 },
    { field: 'callNumber', headerName: 'Call Number', flex: 1, minWidth: 110 },
    { field: 'title', headerName: 'Book Title', flex: 1.8, minWidth: 180 },
    { field: 'authorName', headerName: 'Author', flex: 1.5, minWidth: 150 },
    { field: 'publisher', headerName: 'Publisher', flex: 1, minWidth: 110 },
    { field: 'copyNumber', headerName: 'Copy #', flex: 0.6, minWidth: 70 },
    { field: 'barcode', headerName: 'Barcode', flex: 1, minWidth: 110 },
    { field: 'isoCode', headerName: 'ISO Code', flex: 1, minWidth: 100 },
    { field: 'accessionNumber', headerName: 'Accession #', flex: 1, minWidth: 110 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.9,
      minWidth: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton size="small" onClick={() => setPreviewBook(params.row)} title="View CPU Card">
            <VisibilityIcon fontSize="small" sx={{ color: '#1b365d' }} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(params.row)} title="Delete Entry">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Header>
      {(toggleDrawer) => (
        <Box sx={{ bgcolor: '#fcfbf7', minHeight: '100vh', pb: 4 }}>
          <TopBar title="Book Catalogue" onMenuClick={toggleDrawer} subtitle="BOOK CATALOGUE — CARD AND PACKET RECORDS" />

          <Box sx={{ p: { xs: 2, md: 3 } }}>

            {/* System Themed Summary Stat Cards */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={6} sm={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #d49f1e',
                    bgcolor: '#ffffff',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>
                    TOTAL BOOKS
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b365d', mt: 0.5 }}>
                    {flatBookData.length}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #1b365d',
                    bgcolor: '#ffffff',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>
                    LIBRARIES
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b365d', mt: 0.5 }}>
                    {availableLibraries.length - 1}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #475569',
                    bgcolor: '#ffffff',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>
                    SECTIONS
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1b365d', mt: 0.5 }}>
                    {availableSections.length - 1}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: selectedRows.length > 0 ? '1px solid #d49f1e' : '1px solid #e2e8f0',
                    borderLeft: selectedRows.length > 0 ? '4px solid #d49f1e' : '1px solid #e2e8f0',
                    bgcolor: selectedRows.length > 0 ? '#fffbeb' : '#ffffff',
                    transition: 'all 0.2s',
                  }}
                >
                  <Typography variant="caption" sx={{ color: selectedRows.length > 0 ? '#b45309' : '#64748b', fontWeight: 700 }}>
                    SELECTED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: selectedRows.length > 0 ? '#b45309' : '#64748b', mt: 0.5 }}>
                    {selectedRows.length}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Controls Bar: Search, Filters, View Switcher & Action Buttons */}
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                {/* Search */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search title, author, barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#d49f1e', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                </Grid>

                {/* Library Filter */}
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="library-filter-label">Library</InputLabel>
                    <Select
                      labelId="library-filter-label"
                      value={selectedLibraryFilter}
                      label="Library"
                      onChange={(e) => setSelectedLibraryFilter(e.target.value)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {availableLibraries.map((lib) => (
                        <MenuItem key={lib} value={lib}>
                          {lib === 'ALL' ? 'All Libraries' : lib}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Section Filter */}
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="section-filter-label">Section</InputLabel>
                    <Select
                      labelId="section-filter-label"
                      value={selectedSectionFilter}
                      label="Section"
                      onChange={(e) => setSelectedSectionFilter(e.target.value)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {availableSections.map((sec) => (
                        <MenuItem key={sec} value={sec}>
                          {sec === 'ALL' ? 'All Sections' : sec}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* View Mode Switcher */}
                <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, v) => v && setViewMode(v)}
                    size="small"
                    sx={{ bgcolor: '#f8fafc', p: 0.4, borderRadius: 1.5 }}
                  >
                    <ToggleButton
                      value="table"
                      sx={{
                        borderRadius: 1,
                        px: 1.5,
                        py: 0.5,
                        fontWeight: 600,
                        '&.Mui-selected': { bgcolor: '#1b365d', color: '#ffffff', '&:hover': { bgcolor: '#0f2744' } },
                      }}
                    >
                      <TableChartIcon sx={{ fontSize: 18 }} />
                    </ToggleButton>
                    <ToggleButton
                      value="card"
                      sx={{
                        borderRadius: 1,
                        px: 1.5,
                        py: 0.5,
                        fontWeight: 600,
                        '&.Mui-selected': { bgcolor: '#1b365d', color: '#ffffff', '&:hover': { bgcolor: '#0f2744' } },
                      }}
                    >
                      <GridViewIcon sx={{ fontSize: 18 }} />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PostAddIcon fontSize="small" />}
                  onClick={() => setEncodeModalOpen(true)}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: 'none',
                    bgcolor: '#1b365d',
                    color: '#ffffff',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#0f2744' },
                  }}
                >
                  + Encode Book
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon fontSize="small" />}
                  onClick={fetchCardPackets}
                  sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: '#d49f1e', color: '#b45309' }}
                >
                  Refresh
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleToggleSelectAll}
                  sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: '#1b365d', color: '#1b365d', fontWeight: 600 }}
                >
                  {isAllSelected ? 'Deselect All' : `Select All (${filteredBookData.length})`}
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PrintIcon fontSize="small" />}
                  onClick={handlePrintSelected}
                  disabled={selectedRows.length === 0}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: 'none',
                    bgcolor: '#d49f1e',
                    color: '#ffffff',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#b88814' },
                  }}
                >
                  Print Selected ({selectedRows.length})
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon fontSize="small" />}
                  onClick={handleExportExcel}
                  sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
                >
                  Export Excel
                </Button>

                {selectedRows.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon fontSize="small" />}
                    onClick={() => setDeleteTarget('BATCH')}
                    sx={{ borderRadius: 1.5, textTransform: 'none' }}
                  >
                    Delete Selected ({selectedRows.length})
                  </Button>
                )}

                <Typography variant="body2" sx={{ ml: 'auto', color: '#64748b', fontSize: '0.85rem' }}>
                  Showing {filteredBookData.length} books
                </Typography>
              </Box>
            </Paper>

            {/* CONTENT AREA: TABLE VIEW OR CARD GRID VIEW */}
            {viewMode === 'table' ? (
              <Paper elevation={0} sx={{ height: 600, width: '100%', borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <DataGrid
                  rows={filteredBookData}
                  columns={columns}
                  pageSizeOptions={[10, 25, 50, 100]}
                  checkboxSelection
                  disableColumnFilter={false}
                  disableColumnMenu={false}
                  getRowId={(row) => row.id}
                  onRowSelectionModelChange={handleRowSelectionModelChange}
                  rowSelectionModel={normalizedSelectionModel}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                      bgcolor: '#1b365d',
                      borderBottom: '3px solid #d49f1e',
                    },
                    '& .MuiDataGrid-columnHeader': {
                      bgcolor: '#1b365d !important',
                      color: '#ffffff !important',
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      color: '#ffffff !important',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    },
                    '& .MuiDataGrid-columnHeader .MuiCheckbox-root': {
                      color: '#ffffff !important',
                      '&.Mui-checked': {
                        color: '#d49f1e !important',
                      },
                    },
                    '& .MuiDataGrid-columnHeader .MuiSvgIcon-root, & .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-columnHeader .MuiDataGrid-menuIcon': {
                      color: '#ffffff !important',
                    },
                    '& .MuiDataGrid-row': {
                      '&:hover': {
                        bgcolor: '#faf8f0',
                      },
                      '&.Mui-selected': {
                        bgcolor: '#fffbeb !important',
                        '&:hover': {
                          bgcolor: '#fef3c7 !important',
                        },
                      },
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '0.85rem',
                    },
                  }}
                />
              </Paper>
            ) : (
              /* CARD VIEW */
              <Grid container spacing={2}>
                {filteredBookData.map((book) => {
                  const isSelected = selectedSet.has(book.id);
                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      key={book.id}
                      sx={{
                        maxWidth: { lg: '10% !important', md: '33.333% !important', sm: '50% !important', xs: '100% !important' },
                        flexBasis: { lg: '10% !important', md: '33.333% !important', sm: '50% !important', xs: '100% !important' },
                        minWidth: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <Card
                        elevation={0}
                        style={{
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #d49f1e' : '1px solid #e2e8f0',
                          borderTop: '3px solid #d49f1e',
                          backgroundColor: isSelected ? '#fffbeb' : '#ffffff',
                          width: '100%',
                          minWidth: 0,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box',
                        }}
                      >
                        <CardContent style={{ padding: '16px', flexGrow: 1, minWidth: 0, width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
                          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px', width: '100%', minWidth: 0 }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(book.id)}
                              size="small"
                              style={{ padding: 0, color: '#d49f1e' }}
                            />
                            <Chip
                              label={book.library}
                              size="small"
                              variant="outlined"
                              style={{
                                fontSize: '0.7rem',
                                borderColor: '#d49f1e',
                                color: '#b45309',
                                maxWidth: '75%',
                              }}
                              sx={{
                                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                              }}
                            />
                          </Box>

                          <Tooltip title={book.title}>
                            <Typography
                              variant="subtitle2"
                              style={{
                                fontWeight: 600,
                                color: '#1b365d',
                                marginBottom: '4px',
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-word',
                                minHeight: '2.6em',
                                maxHeight: '2.6em',
                                width: '100%',
                              }}
                            >
                              {book.title}
                            </Typography>
                          </Tooltip>

                          <Tooltip title={book.authorName || book.publisher || 'Unknown Author'}>
                            <Typography
                              variant="caption"
                              style={{
                                display: 'block',
                                color: '#64748b',
                                marginBottom: '8px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%',
                              }}
                            >
                              {book.authorName || book.publisher || 'Unknown Author'}
                            </Typography>
                          </Tooltip>

                          <Divider style={{ margin: '8px 0' }} />

                          <Typography variant="caption" style={{ display: 'block', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            Call #: {book.callNumber || '—'}
                          </Typography>
                          <Typography variant="caption" style={{ display: 'block', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            Acc #: {book.accessionNumber || '—'}
                          </Typography>
                          <Typography variant="caption" style={{ display: 'block', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            Barcode: {book.barcode || '—'}
                          </Typography>
                        </CardContent>

                        <CardActions style={{ padding: '8px 16px', backgroundColor: '#fafafa', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
                          <Button size="small" startIcon={<VisibilityIcon fontSize="small" />} onClick={() => setPreviewBook(book)} style={{ textTransform: 'none', color: '#1b365d', fontWeight: 600 }}>
                            CPU Card
                          </Button>
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(book)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

          </Box>

          {/* Quick CPU Card Preview Dialog */}
          <Dialog open={Boolean(previewBook)} onClose={() => setPreviewBook(null)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1b365d', color: '#ffffff', fontSize: '1rem', fontWeight: 600 }}>
              CPU Book Card Preview
            </DialogTitle>
            <DialogContent sx={{ p: 2.5, bgcolor: '#fafafa' }}>
              {previewBook && (
                <Box sx={{ p: 2, border: '2px solid #1b365d', borderRadius: 1, bgcolor: '#fff', fontFamily: 'serif' }}>
                  <Typography variant="subtitle2" align="center" sx={{ fontWeight: 700, color: '#1b365d' }}>
                    Central Philippine University
                  </Typography>
                  <Typography variant="caption" display="block" align="center" sx={{ mb: 1, color: '#64748b' }}>
                    {previewBook.library} - {previewBook.section}
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="body2"><strong>Author:</strong> {previewBook.authorName || previewBook.publisher || 'Unknown Author'}</Typography>
                  <Typography variant="body2"><strong>Title:</strong> {previewBook.title}</Typography>
                  <Typography variant="body2"><strong>Acc #:</strong> {previewBook.accessionNumber}</Typography>
                  <Typography variant="body2"><strong>Barcode:</strong> {previewBook.barcode}</Typography>
                  <Typography variant="body2"><strong>Call #:</strong> {previewBook.callNumber}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f1f5f9' }}>
              <Button size="small" onClick={() => setPreviewBook(null)} variant="outlined" sx={{ borderColor: '#cbd5e1', color: '#475569' }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444' }}>
              Confirm Delete
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {deleteTarget === 'BATCH'
                  ? `Delete ${selectedRows.length} selected book record(s)?`
                  : `Delete "${deleteTarget?.title || 'this book'}"?`}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button size="small" onClick={() => setDeleteTarget(null)} color="inherit">
                Cancel
              </Button>
              <Button size="small" onClick={handleExecuteDelete} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Staff Single Book Encoding Modal */}
          <Dialog open={encodeModalOpen} onClose={() => setEncodeModalOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1b365d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PostAddIcon sx={{ color: '#d49f1e', fontSize: 26 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
                  Encode Book Card & Packet Entry
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setEncodeModalOpen(false)} sx={{ color: '#ffffff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <ClearIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, pt: 1 }}>

                {/* Library */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Library <span style={{ color: '#ef4444' }}>*</span>
                  </Typography>
                  <Autocomplete
                    options={modalLibrariesOptions}
                    freeSolo
                    value={encodeData.library}
                    onChange={(e, val) => handleEncodeLibChange(val)}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Choose or type library..." fullWidth sx={{ bgcolor: '#ffffff' }} />}
                  />
                </Box>

                {/* Section */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Section
                  </Typography>
                  <Autocomplete
                    options={modalSectionsOptions}
                    freeSolo
                    value={encodeData.section}
                    onChange={(e, val) => handleEncodeFieldChange('section', val || '')}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Choose or type section..." fullWidth sx={{ bgcolor: '#ffffff' }} />}
                  />
                </Box>

                {/* Author */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Author (Full Name)
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="e.g. Last Name, First Name M.I."
                    value={encodeData.authorName}
                    onChange={(e) => handleEncodeFieldChange('authorName', e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Publisher */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Publisher / Corporate Author
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter publisher or institution name"
                    value={encodeData.publisherAuthor}
                    onChange={(e) => handleEncodeFieldChange('publisherAuthor', e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Book Title - Full Width */}
                <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Book Title <span style={{ color: '#ef4444' }}>*</span>
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Enter complete book title..."
                    value={encodeData.bookTitle}
                    onChange={(e) => handleEncodeFieldChange('bookTitle', e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Accession Number */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Accession Number <span style={{ color: '#ef4444' }}>*</span>
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter accession number..."
                    value={encodeData.accessionNumber}
                    onChange={(e) => handleEncodeAccChange(e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Barcode */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Barcode (Auto-generated)
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={encodeData.barcodeValue}
                    onChange={(e) => handleEncodeFieldChange('barcodeValue', e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Copy Number */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Copy Number (Optional)
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="e.g. c.1, c.2"
                    value={encodeData.copyNumber}
                    onChange={(e) => handleEncodeFieldChange('copyNumber', e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* ISO Code */}
                <Box>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    ISO Code (Auto-generated)
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={encodeData.isoCodeValue}
                    onChange={(e) => handleEncodeFieldChange('isoCodeValue', e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Call Number - Full Width */}
                <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                  <Typography fontWeight="bold" variant="body2" sx={{ mb: 0.8, color: '#0f172a' }}>
                    Call Number
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Enter call number..."
                    value={encodeData.callNumber}
                    onChange={(e) => handleEncodeFieldChange('callNumber', e.target.value)}
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Button onClick={resetEncodeForm} variant="outlined" color="error" size="medium" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                Clear Form
              </Button>

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Button onClick={() => setEncodeModalOpen(false)} variant="outlined" size="medium" sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569', fontWeight: 600 }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveEncoding(true)}
                  variant="contained"
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#d49f1e',
                    color: '#1b365d',
                    fontWeight: 700,
                    px: 2.5,
                    py: 1,
                    '&:hover': { bgcolor: '#b8860b' },
                    boxShadow: 'none',
                  }}
                >
                  Save & Encode Another
                </Button>
                <Button
                  onClick={() => handleSaveEncoding(false)}
                  variant="contained"
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#1b365d',
                    color: '#ffffff',
                    fontWeight: 700,
                    px: 2.5,
                    py: 1,
                    '&:hover': { bgcolor: '#0f2744' },
                    boxShadow: 'none',
                  }}
                >
                  Save Entry
                </Button>
              </Box>
            </DialogActions>
          </Dialog>

        </Box>
      )}
    </Header>
  );
};

export default BookCatalogue;