import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, Typography } from '@mui/material';
import * as XLSX from 'xlsx';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const BookCatalogue = () => {
  const [cardPackets, setCardPackets] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });

  const fetchCardPackets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/card-and-packet');
      const formatted = res.data.map((row) => ({
        id: row.CardID,
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

  // Flatten all book entries (1-4) from all records
  const flatBookData = [];
  cardPackets.forEach((record) => {
    for (let i = 1; i <= 4; i++) {
      const libraryField = `selectedLibrary${i}`;
      const titleField = `bookTitle${i}`;

      if (record[libraryField] || record[titleField]) {
        flatBookData.push({
          id: `${record.id}-${i}`,
          recordId: record.id,
          bookNum: i,
          library: record[`selectedLibrary${i}`] || '',
          section: record[`section${i}`] || '',
          callNumber: record[`callNumber${i}`] || '',
          title: record[`bookTitle${i}`] || '',
          authorLastName: record[`authorLastName${i}`] || '',
          authorFirstName: record[`authorFirstName${i}`] || '',
          authorMiddleInitial: record[`authorMiddleInitial${i}`] || '',
          publisher: record[`publisherAuthor${i}`] || '',
          copyNumber: record[`copyNumber${i}`] || '',
          barcode: record[`barcodeValue${i}`] || '',
          isoCode: record[`isoCodeValue${i}`] || '',
          accessionNumber: record[`accessionNumber${i}`] || '',
        });
      }
    }
  });

  const totalRecords = flatBookData.length;
  const selectedRows = flatBookData.filter((row) => rowSelectionModel.ids.has(row.id));

  // Excel Export Handler (exports selected rows if any, else all)
  const handleExportExcel = () => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : flatBookData;
    if (dataToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    const excelData = dataToExport.map((row) => ({
      'Library': row.library || 'N/A',
      'Section': row.section || '',
      'Call Number': row.callNumber || '',
      'Book Title': row.title || '',
      'Author Last Name': row.authorLastName || '',
      'Author First Name': row.authorFirstName || '',
      'Middle Initial': row.authorMiddleInitial || '',
      'Publisher': row.publisher || '',
      'Copy Number': row.copyNumber || '',
      'Barcode': row.barcode || '',
      'ISO Code': row.isoCode || '',
      'Accession Number': row.accessionNumber || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Card and Packet Records');

    const objectMaxWidth = [];
    excelData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const value = row[key] ? row[key].toString() : '';
        if (!objectMaxWidth[key] || value.length > objectMaxWidth[key]) {
          objectMaxWidth[key] = Math.max(value.length, key.length);
        }
      });
    });
    worksheet['!cols'] = Object.keys(objectMaxWidth).map((key) => ({
      wch: objectMaxWidth[key] + 3,
    }));

    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `HLL_CardAndPacket_${dateStamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Print selected rows as book cards (same layout style as CardAndPacket.js)
  const handlePrintSelected = () => {
    if (selectedRows.length === 0) {
      alert('Select at least one book to print.');
      return;
    }

    const printWindow = window.open('', '', 'width=1000,height=800');
    const doc = printWindow.document;

    doc.open();
    doc.write('<!DOCTYPE html><html><head><title>Print Book Cards</title>');
    doc.write(`
      <style>
        @page { size: Letter; margin: 0.5in; }
        html, body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; font-size: 11pt; }
        .card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-auto-rows: 480px;
          gap: 8px;
        }
        .card {
          border: 1px solid black;
          padding: 10px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .row { display: flex; align-items: center; margin-bottom: 6px; }
        .row .label { white-space: nowrap; margin-right: 6px; }
        .row .line { border-bottom: 1px solid black; flex-grow: 1; }
        table { border-collapse: collapse; width: 100%; margin-top: 6px; }
        th, td { border: 1px solid black; padding: 4px; text-align: left; font-size: 10pt; }
      </style>
    `);
    doc.write('</head><body><div id="print-content"></div></body></html>');
    doc.close();

    printWindow.onload = () => {
      const container = printWindow.document.getElementById('print-content');
      const grid = printWindow.document.createElement('div');
      grid.className = 'card-grid';

      selectedRows.forEach((row) => {
        const card = printWindow.document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div style="text-align:center; font-weight:bold;">Central Philippine University</div>
          <div class="row"><span class="label">Author:</span><span>${row.authorLastName || row.publisher}, ${row.authorFirstName || ''} ${row.authorMiddleInitial || ''}</span></div>
          <div class="row"><span class="label">Title:</span><span>${row.title}</span></div>
          <div class="row"><span class="label">Acc. No.:</span><span>${row.accessionNumber}</span></div>
          <div class="row"><span class="label">Barcode:</span><span>${row.barcode}</span></div>
          <div class="row"><span class="label">Call No.:</span><span>${row.callNumber}</span></div>
          <table>
            <thead>
              <tr><th>Date Borrowed/Due</th><th>Borrower's Name</th><th>Borrower's ID</th></tr>
            </thead>
            <tbody>
              ${Array.from({ length: 6 }).map(() => '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('')}
            </tbody>
          </table>
        `;
        grid.appendChild(card);
      });

      container.appendChild(grid);

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    };
  };

  const handleDeleteBook = async (row) => {
    if (!window.confirm(`Delete "${row.title || 'this entry'}"? This will clear this book's fields but keep the rest of the card record.`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/card-and-packet/${row.recordId}/book/${row.bookNum}`);
      fetchCardPackets();
    } catch (error) {
      console.error('Error deleting book entry:', error);
      alert('Failed to delete entry.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Delete ${selectedRows.length} selected book(s)? This clears each book's fields but keeps the rest of each card record.`)) {
      return;
    }
    try {
      await Promise.all(
        selectedRows.map((row) =>
          axios.delete(`http://localhost:5000/api/card-and-packet/${row.recordId}/book/${row.bookNum}`)
        )
      );
      setRowSelectionModel({ type: 'include', ids: new Set() });
      fetchCardPackets();
    } catch (error) {
      console.error('Error deleting selected entries:', error);
      alert('Failed to delete one or more entries.');
    }
  };

  const columns = [
    { field: 'library', headerName: 'Library', flex: 1 },
    { field: 'section', headerName: 'Section', flex: 1 },
    { field: 'callNumber', headerName: 'Call Number', flex: 1 },
    { field: 'title', headerName: 'Book Title', flex: 1.5 },
    { field: 'authorLastName', headerName: 'Last Name', flex: 0.9 },
    { field: 'authorFirstName', headerName: 'First Name', flex: 0.9 },
    { field: 'authorMiddleInitial', headerName: 'M.I.', flex: 0.6 },
    { field: 'publisher', headerName: 'Publisher', flex: 1 },
    { field: 'copyNumber', headerName: 'Copy #', flex: 0.6 },
    { field: 'barcode', headerName: 'Barcode', flex: 1 },
    { field: 'isoCode', headerName: 'ISO Code', flex: 1 },
    { field: 'accessionNumber', headerName: 'Accession #', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          color="error"
          variant="outlined"
          onClick={() => handleDeleteBook(params.row)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Book Catalogue" onMenuClick={toggleDrawer} subtitle="BOOK CATALOGUE — CARD AND PACKET RECORDS" />

          <Box sx={{ p: 3 }}>
            {/* Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="contained" onClick={fetchCardPackets}>
                🔄 Refresh Data
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handlePrintSelected}
                disabled={selectedRows.length === 0}
              >
                🖨️ Print Selected ({selectedRows.length})
              </Button>
              <Button variant="outlined" color="success" onClick={handleExportExcel}>
                📥 Export {selectedRows.length > 0 ? 'Selected' : 'All'} to Excel
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteSelected}
                disabled={selectedRows.length === 0}
              >
                🗑️ Delete Selected ({selectedRows.length})
              </Button>
              <Typography sx={{ ml: 'auto', color: '#666' }}>
                {totalRecords} total books
              </Typography>
            </Box>

            {/* DataGrid with checkboxes */}
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={flatBookData}
                columns={columns}
                pageSizeOptions={[10, 20, 50, 100]}
                checkboxSelection
                disableColumnFilter={false}
                disableColumnMenu={false}
                getRowId={(row) => row.id}
                onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
                rowSelectionModel={rowSelectionModel}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  filter: { filterModel: { items: [] } },
                }}
              />
            </Box>
          </Box>
        </>
      )}
    </Header>
  );
};

export default BookCatalogue;