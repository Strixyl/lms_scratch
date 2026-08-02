import {
  Grid, Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Modal, Chip, Divider,
} from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { Autocomplete } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SaveIcon from '@mui/icons-material/Save';
import UpdateIcon from '@mui/icons-material/Update';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PrintIcon from '@mui/icons-material/Print';
import axios from 'axios';

const libraries = ["Elementary School Library", "Henry Luce III Library", "Kindergarten Library", "Junior High School Library", "Law Library", "Senior High School Library", "Theology Library"];
const sections = ["American Corner", "Archives", "Circulation", "Elementary", "Filipiniana", "General Library", "Graduate Studies Library", "Junior High School", "Kindergarten", "Medicine", "Meyer Asian Collection", "Law", "Library Science Collection", "Periodicals", "Rare Filipiniana", "Reference", "Senior High School", "Serials", "Theology Library", "Thesis Collection"];

export default function CardAndPacket() {
  const [section1, setSection1] = useState(''); const [section2, setSection2] = useState(''); const [section3, setSection3] = useState(''); const [section4, setSection4] = useState('');
  const [callNumber1, setCallNumber1] = useState(''); const [callNumber2, setCallNumber2] = useState(''); const [callNumber3, setCallNumber3] = useState(''); const [callNumber4, setCallNumber4] = useState('');
  const [bookTitle1, setBookTitle] = useState(''); const [bookTitle2, setBookTitle2] = useState(''); const [bookTitle3, setBookTitle3] = useState(''); const [bookTitle4, setBookTitle4] = useState('');
  const [selectedLibrary1, setSelectedLibrary1] = useState(''); const [selectedLibrary2, setSelectedLibrary2] = useState(''); const [selectedLibrary3, setSelectedLibrary3] = useState(''); const [selectedLibrary4, setSelectedLibrary4] = useState('');
  const [barcodeValue1, setBarcodeValue] = useState(''); const [barcodeValue2, setBarcodeValue2] = useState(''); const [barcodeValue3, setBarcodeValue3] = useState(''); const [barcodeValue4, setBarcodeValue4] = useState('');
  const [isoCodeValue1, setIsoCodeValue] = useState(''); const [isoCodeValue2, setIsoCodeValue2] = useState(''); const [isoCodeValue3, setIsoCodeValue3] = useState(''); const [isoCodeValue4, setIsoCodeValue4] = useState('');
  const [accessionNumber1, setAccessionNumber] = useState(''); const [accessionNumber2, setAccessionNumber2] = useState(''); const [accessionNumber3, setAccessionNumber3] = useState(''); const [accessionNumber4, setAccessionNumber4] = useState('');
  const [authorLastName1, setAuthorLastName] = useState(''); const [publisherAuthor1, setPublisherAuthor] = useState('');
  const [authorLastName2, setAuthorLastName2] = useState(''); const [publisherAuthor2, setPublisherAuthor2] = useState('');
  const [authorLastName3, setAuthorLastName3] = useState(''); const [publisherAuthor3, setPublisherAuthor3] = useState('');
  const [authorLastName4, setAuthorLastName4] = useState(''); const [publisherAuthor4, setPublisherAuthor4] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatAuthorName = (last, first, mi) => {
    if (!last && !first && !mi) return '';
    if (!first && !mi) return last || '';
    return `${last || ''}${last && first ? ', ' : ''}${first || ''}${mi ? ' ' + mi : ''}`.trim();
  };

  // ✅ Save with duplicate check
  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5000/api/card-and-packet', {
        selectedLibrary1, section1, selectedLibrary2, section2, selectedLibrary3, section3, selectedLibrary4, section4,
        authorName1: authorLastName1, publisherAuthor1,
        authorName2: authorLastName2, publisherAuthor2,
        authorName3: authorLastName3, publisherAuthor3,
        authorName4: authorLastName4, publisherAuthor4,
        bookTitle1, bookTitle2, bookTitle3, bookTitle4,
        accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
        callNumber1, callNumber2, callNumber3, callNumber4,
        copyNumber1: '', copyNumber2: '', copyNumber3: '', copyNumber4: '',
        barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
        isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4,
      });
      alert('Data saved successfully!');
      handleClear();
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.message); // ✅ shows duplicate error
      } else {
        console.error('Error saving:', error);
        alert('Error saving data.');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { alert('Enter the accession number!'); return; }
    try {
      const response = await axios.get('http://localhost:5000/api/card-and-packet/search', {
        params: { accessionNumber: searchQuery.trim() }
      });
      if (response.data.length === 0) { alert('No entries found.'); return; }
      if (response.data.length === 1) {
        loadSelectedEntry(response.data[0]);
      } else {
        setSearchResults(response.data);
        setOpenModal(true);
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('An error occurred during search.');
    }
  };

  const handleClose = () => setOpenModal(false);

  const loadSelectedEntry = (entry) => {
    setSelectedDocId(entry.CardID);
    setSelectedLibrary1(entry.selectedLibrary1); setSelectedLibrary2(entry.selectedLibrary2); setSelectedLibrary3(entry.selectedLibrary3); setSelectedLibrary4(entry.selectedLibrary4);
    setSection1(entry.section1); setSection2(entry.section2); setSection3(entry.section3); setSection4(entry.section4);
    setAuthorLastName(entry.authorName1 || formatAuthorName(entry.authorLastName1, entry.authorFirstName1, entry.authorMiddleInitial1));
    setAuthorLastName2(entry.authorName2 || formatAuthorName(entry.authorLastName2, entry.authorFirstName2, entry.authorMiddleInitial2));
    setAuthorLastName3(entry.authorName3 || formatAuthorName(entry.authorLastName3, entry.authorFirstName3, entry.authorMiddleInitial3));
    setAuthorLastName4(entry.authorName4 || formatAuthorName(entry.authorLastName4, entry.authorFirstName4, entry.authorMiddleInitial4));
    setPublisherAuthor(entry.publisherAuthor1); setPublisherAuthor2(entry.publisherAuthor2); setPublisherAuthor3(entry.publisherAuthor3); setPublisherAuthor4(entry.publisherAuthor4);
    setBookTitle(entry.bookTitle1); setBookTitle2(entry.bookTitle2); setBookTitle3(entry.bookTitle3); setBookTitle4(entry.bookTitle4);
    setAccessionNumber(entry.accessionNumber1); setAccessionNumber2(entry.accessionNumber2); setAccessionNumber3(entry.accessionNumber3); setAccessionNumber4(entry.accessionNumber4);
    setCallNumber1(entry.callNumber1); setCallNumber2(entry.callNumber2); setCallNumber3(entry.callNumber3); setCallNumber4(entry.callNumber4);
    setBarcodeValue(entry.barcodeValue1); setBarcodeValue2(entry.barcodeValue2); setBarcodeValue3(entry.barcodeValue3); setBarcodeValue4(entry.barcodeValue4);
    setIsoCodeValue(entry.isoCodeValue1); setIsoCodeValue2(entry.isoCodeValue2); setIsoCodeValue3(entry.isoCodeValue3); setIsoCodeValue4(entry.isoCodeValue4);
    setSearchQuery('');
    setTimeout(() => setOpenModal(false), 100);
  };

  const handleUpdate = async () => {
    if (!selectedDocId) { alert('No entry selected to update.'); return; }
    try {
      await axios.put(`http://localhost:5000/api/card-and-packet/${selectedDocId}`, {
        selectedLibrary1, section1, selectedLibrary2, section2, selectedLibrary3, section3, selectedLibrary4, section4,
        authorName1: authorLastName1, publisherAuthor1,
        authorName2: authorLastName2, publisherAuthor2,
        authorName3: authorLastName3, publisherAuthor3,
        authorName4: authorLastName4, publisherAuthor4,
        bookTitle1, bookTitle2, bookTitle3, bookTitle4,
        accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
        callNumber1, callNumber2, callNumber3, callNumber4,
        copyNumber1: '', copyNumber2: '', copyNumber3: '', copyNumber4: '',
        barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
        isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4,
      });
      alert('Entry updated successfully.');
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update entry.');
    }
  };

  const handleClear = () => {
    setSelectedDocId(null);
    setSelectedLibrary1(''); setSelectedLibrary2(''); setSelectedLibrary3(''); setSelectedLibrary4('');
    setSection1(''); setSection2(''); setSection3(''); setSection4('');
    setAuthorLastName(''); setAuthorLastName2(''); setAuthorLastName3(''); setAuthorLastName4('');
    setPublisherAuthor(''); setPublisherAuthor2(''); setPublisherAuthor3(''); setPublisherAuthor4('');
    setBookTitle(''); setBookTitle2(''); setBookTitle3(''); setBookTitle4('');
    setAccessionNumber(''); setAccessionNumber2(''); setAccessionNumber3(''); setAccessionNumber4('');
    setCallNumber1(''); setCallNumber2(''); setCallNumber3(''); setCallNumber4('');
    setBarcodeValue(''); setBarcodeValue2(''); setBarcodeValue3(''); setBarcodeValue4('');
    setIsoCodeValue(''); setIsoCodeValue2(''); setIsoCodeValue3(''); setIsoCodeValue4('');
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const handleOpenPrint = () => setPrintModalOpen(true);

  const handlePrint = () => {
    const cardData = [
      { library: selectedLibrary1, section: section1, author: publisherAuthor1 || authorLastName1, title: bookTitle1, accession: accessionNumber1, barcode: barcodeValue1, callNum: callNumber1, isoCode: isoCodeValue1 },
      { library: selectedLibrary2, section: section2, author: publisherAuthor2 || authorLastName2, title: bookTitle2, accession: accessionNumber2, barcode: barcodeValue2, callNum: callNumber2, isoCode: isoCodeValue2 },
      { library: selectedLibrary3, section: section3, author: publisherAuthor3 || authorLastName3, title: bookTitle3, accession: accessionNumber3, barcode: barcodeValue3, callNum: callNumber3, isoCode: isoCodeValue3 },
      { library: selectedLibrary4, section: section4, author: publisherAuthor4 || authorLastName4, title: bookTitle4, accession: accessionNumber4, barcode: barcodeValue4, callNum: callNumber4, isoCode: isoCodeValue4 },
    ];

    const emptyRows = Array(10).fill('<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('');

    const cardHTML = cardData.map(card => `
      <div class="card">
        <div class="card-top">
          <div class="call-num">${(card.callNum || '').replace(/\n/g, '<br>').replace(/ /g, '<br>')}</div>
          <div class="header">
            <div class="uni">Central Philippine University</div>
            <div class="lib">${card.library || 'Henry Luce III Library'}</div>
            <div class="section">${(card.section || '').toUpperCase()}</div>
          </div>
          <div class="iso">${(card.isoCode || '').replace('REV.', '<br>REV.').replace('April', '<br>April')}</div>
        </div>
        <div class="spacer"></div>
        <div class="field">
          <span class="label">Author</span>
          <span class="value underline">${card.author}</span>
        </div>
        <div class="field">
          <span class="label">Title</span>
          <span class="value underline">${card.title}</span>
        </div>
        <div class="field-row">
          <div class="field">
            <span class="label">Acc. No.</span>
            <span class="value underline">${card.accession}</span>
          </div>
          <div class="field">
            <span class="label">Barcode</span>
            <span class="value underline">${card.barcode}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date Borrowed/<br>Due Date</th>
              <th>Borrower's Name</th>
              <th>Borrower's<br>ID Number</th>
            </tr>
          </thead>
          <tbody>${emptyRows}</tbody>
        </table>
      </div>
    `).join('');

    const printWindow = window.open('', '', 'width=1100,height=850');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Book Card Print</title>
        <style>
          @page { size: Letter; margin: 0.4in; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Times New Roman', serif; font-size: 9pt; }
          .card-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 0px;
            width: 100%;
            height: 100vh;
          }
          .card {
            border: none;
            padding: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .call-num {
            font-size: 8.5pt;
            font-weight: bold;
            min-width: 45px;
            text-align: left;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            flex-grow: 1;
            padding: 0 4px;
          }
          .uni { font-weight: bold; font-size: 9pt; }
          .lib { font-weight: bold; font-size: 8.5pt; }
          .section { font-weight: bold; font-size: 8.5pt; }
          .iso {
            font-size: 5pt;
            text-align: right;
            min-width: 48px;
            line-height: 1.3;
            font-style: italic;
          }
          .spacer { height: 14px; }
          .field {
            display: flex;
            align-items: flex-end;
            margin-bottom: 4px;
          }
          .field-row {
            display: flex;
            gap: 8px;
            margin-bottom: 4px;
          }
          .field-row .field { flex: 1; }
          .label {
            font-size: 8.5pt;
            white-space: nowrap;
            margin-right: 4px;
          }
          .value {
            font-size: 8.5pt;
            font-weight: bold;
            flex-grow: 1;
          }
          .underline {
            border-bottom: 1.5px solid black;
            display: inline-block;
            width: 100%;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            flex-grow: 1;
          }
          th, td {
            border: 1px solid black;
            padding: 2px 3px;
            font-size: 7.5pt;
            text-align: center;
          }
          th { font-weight: bold; }
          td { height: 18px; }
        </style>
      </head>
      <body>
        <div class="card-grid">${cardHTML}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

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

  const handleLibraryChange = (event, newValue) => {
    setSelectedLibrary1(newValue);
    setIsoCodeValue(getIsoCode(newValue));
    setBarcodeValue(`${getBarcodePrefix(newValue)}${accessionNumber1}`);
  };

  const handleAccessionNumberChange = (e) => {
    const value = e.target.value;
    setAccessionNumber(value);
    setBarcodeValue(`${getBarcodePrefix(selectedLibrary1)}${value}`);
  };

  const handleLibraryChange2 = (e, v) => { setSelectedLibrary2(v); setIsoCodeValue2(getIsoCode(v)); setBarcodeValue2(`${getBarcodePrefix(v)}${accessionNumber2}`); };
  const handleLibraryChange3 = (e, v) => { setSelectedLibrary3(v); setIsoCodeValue3(getIsoCode(v)); setBarcodeValue3(`${getBarcodePrefix(v)}${accessionNumber3}`); };
  const handleLibraryChange4 = (e, v) => { setSelectedLibrary4(v); setIsoCodeValue4(getIsoCode(v)); setBarcodeValue4(`${getBarcodePrefix(v)}${accessionNumber4}`); };
  const handleAccessionNumberChange2 = (e) => { const v = e.target.value; setAccessionNumber2(v); setBarcodeValue2(`${getBarcodePrefix(selectedLibrary2)}${v}`); };
  const handleAccessionNumberChange3 = (e) => { const v = e.target.value; setAccessionNumber3(v); setBarcodeValue3(`${getBarcodePrefix(selectedLibrary3)}${v}`); };
  const handleAccessionNumberChange4 = (e) => { const v = e.target.value; setAccessionNumber4(v); setBarcodeValue4(`${getBarcodePrefix(selectedLibrary4)}${v}`); }; const columns = [
    {
      label: 'First Column',
      library: selectedLibrary1, setLibrary: handleLibraryChange,
      section: section1, setSection: (e, v) => setSection1(v),
      authorName: authorLastName1, setAuthorName: (e) => setAuthorLastName(e.target.value),
      publisher: publisherAuthor1, setPublisher: (e) => setPublisherAuthor(e.target.value),
      title: bookTitle1, setTitle: (e) => setBookTitle(e.target.value),
      accession: accessionNumber1, setAccession: handleAccessionNumberChange,
      callNum: callNumber1, setCallNum: (e) => setCallNumber1(e.target.value),
      barcode: barcodeValue1, setBarcode: (e) => setBarcodeValue(e.target.value),
      isoCode: isoCodeValue1, setIsoCode: (e) => setIsoCodeValue(e.target.value),
    },
    {
      label: 'Second Column',
      library: selectedLibrary2, setLibrary: handleLibraryChange2,
      section: section2, setSection: (e, v) => setSection2(v),
      authorName: authorLastName2, setAuthorName: (e) => setAuthorLastName2(e.target.value),
      publisher: publisherAuthor2, setPublisher: (e) => setPublisherAuthor2(e.target.value),
      title: bookTitle2, setTitle: (e) => setBookTitle2(e.target.value),
      accession: accessionNumber2, setAccession: handleAccessionNumberChange2,
      callNum: callNumber2, setCallNum: (e) => setCallNumber2(e.target.value),
      barcode: barcodeValue2, setBarcode: (e) => setBarcodeValue2(e.target.value),
      isoCode: isoCodeValue2, setIsoCode: (e) => setIsoCodeValue2(e.target.value),
    },
    {
      label: 'Third Column',
      library: selectedLibrary3, setLibrary: handleLibraryChange3,
      section: section3, setSection: (e, v) => setSection3(v),
      authorName: authorLastName3, setAuthorName: (e) => setAuthorLastName3(e.target.value),
      publisher: publisherAuthor3, setPublisher: (e) => setPublisherAuthor3(e.target.value),
      title: bookTitle3, setTitle: (e) => setBookTitle3(e.target.value),
      accession: accessionNumber3, setAccession: handleAccessionNumberChange3,
      callNum: callNumber3, setCallNum: (e) => setCallNumber3(e.target.value),
      barcode: barcodeValue3, setBarcode: (e) => setBarcodeValue3(e.target.value),
      isoCode: isoCodeValue3, setIsoCode: (e) => setIsoCodeValue3(e.target.value),
    },
    {
      label: 'Fourth Column',
      library: selectedLibrary4, setLibrary: handleLibraryChange4,
      section: section4, setSection: (e, v) => setSection4(v),
      authorName: authorLastName4, setAuthorName: (e) => setAuthorLastName4(e.target.value),
      publisher: publisherAuthor4, setPublisher: (e) => setPublisherAuthor4(e.target.value),
      title: bookTitle4, setTitle: (e) => setBookTitle4(e.target.value),
      accession: accessionNumber4, setAccession: handleAccessionNumberChange4,
      callNum: callNumber4, setCallNum: (e) => setCallNumber4(e.target.value),
      barcode: barcodeValue4, setBarcode: (e) => setBarcodeValue4(e.target.value),
      isoCode: isoCodeValue4, setIsoCode: (e) => setIsoCodeValue4(e.target.value),
    },
  ];

  return (
    <Box>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Book Card and Book Packet" onMenuClick={toggleDrawer} subtitle="BOOK CARD AND BOOK PACKET" />

            <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle>Print Preview</DialogTitle>
              <DialogContent>
                <Box ref={printRef} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0px', height: '700px', fontFamily: 'Times New Roman, serif', fontSize: '9pt' }}>
                  {columns.map((col, i) => (
                    <Box key={i} sx={{ border: 'none', padding: '8px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography fontSize="8pt" fontWeight="bold" sx={{ whiteSpace: 'pre-wrap', minWidth: '40px', wordBreak: 'break-all' }}>{col.callNum}</Typography>
                        <Box sx={{ textAlign: 'center', flexGrow: 1, px: 0.5 }}>
                          <Typography fontSize="8.5pt" fontWeight="bold">Central Philippine University</Typography>
                          <Typography fontSize="8pt" fontWeight="bold">{col.library || 'Henry Luce III Library'}</Typography>
                          <Typography fontSize="8pt" fontWeight="bold">{(col.section || '').toUpperCase()}</Typography>
                        </Box>
                        <Typography fontSize="5pt" sx={{ textAlign: 'right', minWidth: '45px', fontStyle: 'italic', lineHeight: 1.3 }}>
                          {col.isoCode}
                        </Typography>
                      </Box>
                      <Box sx={{ height: '12px' }} />
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1.5px solid black', mb: 0.5 }}>
                        <Typography fontSize="8.5pt" sx={{ whiteSpace: 'nowrap', mr: 0.5 }}>Author</Typography>
                        <Typography fontSize="8.5pt" fontWeight="bold" sx={{ flexGrow: 1 }}>{col.publisher || col.authorName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1.5px solid black', mb: 0.5 }}>
                        <Typography fontSize="8.5pt" sx={{ whiteSpace: 'nowrap', mr: 0.5 }}>Title</Typography>
                        <Typography fontSize="8.5pt" fontWeight="bold" sx={{ flexGrow: 1 }}>{col.title}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1.5px solid black', flex: 1 }}>
                          <Typography fontSize="8.5pt" sx={{ whiteSpace: 'nowrap', mr: 0.5 }}>Acc. No.</Typography>
                          <Typography fontSize="8.5pt" fontWeight="bold">{col.accession}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1.5px solid black', flex: 1 }}>
                          <Typography fontSize="8.5pt" sx={{ whiteSpace: 'nowrap', mr: 0.5 }}>Barcode</Typography>
                          <Typography fontSize="8.5pt" fontWeight="bold">{col.barcode}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 0.5, flexGrow: 1 }}>
                        <table width="100%" border="1" cellPadding="2" cellSpacing="0" style={{ borderCollapse: 'collapse', fontSize: '7pt' }}>
                          <thead>
                            <tr>
                              <th>Date Borrowed / Due Date</th>
                              <th>Borrower's Name</th>
                              <th>Borrower's ID Number</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...Array(8)].map((_, rowIdx) => (
                              <tr key={rowIdx}><td style={{ height: '18px' }}></td><td></td><td></td></tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="contained" onClick={handlePrint}>🖨️ Print</Button>
                  <Button variant="outlined" onClick={() => setPrintModalOpen(false)}>Close</Button>
                </Box>
              </DialogContent>
            </Dialog>
          </>
        )}
      </Header>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ px: { xs: 2, sm: 4, md: 6 }, pt: 2 }}>
        <Grid item xs={12} md={8} lg={3}>
          <TextField
            fullWidth
            placeholder="Search by Accession Number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch}><SearchIcon /></IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
      </Grid>

      <Modal open={openModal} onClose={handleClose}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, borderRadius: 2 }}>
          <Typography variant="h6" mb={2}>Search Results</Typography>
          {searchResults.map((result) => (
            <Box key={result.CardID} sx={{ p: 1, border: '1px solid #ccc', borderRadius: 1, mb: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }} onClick={() => loadSelectedEntry(result)}>
              {/* ✅ Show only accession number 1 */}
              <Typography variant="body1">{result.accessionNumber1}</Typography>
            </Box>
          ))}
          <Button variant="contained" onClick={handleClose} sx={{ mt: 2 }}>Close</Button>
        </Box>
      </Modal>

      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, py: 3, boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {columns.map((col, i) => (
            <Box
              key={i}
              sx={{
                flex: { xs: '1 1 100%', md: '1 1 0px' },
                minWidth: 0,
                border: '1.5px solid #cbd5e1',
                borderRadius: '16px',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#94a3b8',
                  boxShadow: '0 12px 28px rgba(27, 54, 93, 0.12)',
                  transform: 'translateY(-3px)',
                },
              }}
            >
              {/* Form Column Banner Header */}
              <Box
                sx={{
                  bgcolor: '#1b365d',
                  color: '#ffffff',
                  px: 2.5,
                  py: 1.8,
                  borderBottom: '3.5px solid #d49f1e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box
                    sx={{
                      bgcolor: '#d49f1e',
                      color: '#1b365d',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem', letterSpacing: '0.2px' }}>
                    Form {i + 1} &ndash; {col.label}
                  </Typography>
                </Box>
              </Box>

              {/* Form Body - Visual Separation for every inputting part */}
              <Box sx={{ p: { xs: 2, sm: 2.25 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                {/* Part 1: Location & Department */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #2563eb',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                    <LocationOnIcon sx={{ color: '#2563eb', fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#1e40af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        fontSize: '0.75rem',
                      }}
                    >
                      Location & Department
                    </Typography>
                  </Box>

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Library <Typography component="span" sx={{ color: '#ef4444', fontWeight: 'bold' }}>*</Typography>
                  </Typography>
                  <Autocomplete
                    options={libraries}
                    freeSolo
                    value={col.library}
                    onChange={col.setLibrary}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Choose library *"
                        size="small"
                        margin="dense"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 1.8, bgcolor: '#ffffff' }}
                      />
                    )}
                  />

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Section <Typography component="span" sx={{ color: '#ef4444', fontWeight: 'bold' }}>*</Typography>
                  </Typography>
                  <Autocomplete
                    options={sections}
                    freeSolo
                    value={col.section}
                    onChange={col.setSection}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Choose section *"
                        size="small"
                        margin="dense"
                        variant="outlined"
                        fullWidth
                        sx={{ bgcolor: '#ffffff' }}
                      />
                    )}
                  />
                </Box>

                {/* Part 2: Bibliographic Information */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #059669',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                    <MenuBookIcon sx={{ color: '#059669', fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#065f46',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        fontSize: '0.75rem',
                      }}
                    >
                      Bibliographic Details
                    </Typography>
                  </Box>

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Author (Full Name)
                  </Typography>
                  <TextField
                    value={col.authorName}
                    onChange={col.setAuthorName}
                    fullWidth
                    size="small"
                    placeholder="e.g. Last Name, First Name M.I."
                    margin="dense"
                    variant="outlined"
                    sx={{ mb: 1.8, bgcolor: '#ffffff' }}
                  />

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Publisher (Corporate / Institutional)
                  </Typography>
                  <TextField
                    value={col.publisher}
                    onChange={col.setPublisher}
                    fullWidth
                    size="small"
                    placeholder="Enter Publisher Name"
                    margin="dense"
                    variant="outlined"
                    sx={{ mb: 1.8, bgcolor: '#ffffff' }}
                  />

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Title <Typography component="span" sx={{ color: '#ef4444', fontWeight: 'bold' }}>*</Typography>
                  </Typography>
                  <TextField
                    value={col.title}
                    onChange={col.setTitle}
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    placeholder="Book Title *"
                    margin="dense"
                    variant="outlined"
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Part 3: Accession & Classification */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #d97706',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                    <LocalOfferIcon sx={{ color: '#d97706', fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#92400e',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        fontSize: '0.75rem',
                      }}
                    >
                      Accession & Call Number
                    </Typography>
                  </Box>

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Accession Number <Typography component="span" sx={{ color: '#ef4444', fontWeight: 'bold' }}>*</Typography>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    variant="outlined"
                    placeholder="Accession Number *"
                    sx={{ mb: 1.8, bgcolor: '#ffffff' }}
                    value={col.accession}
                    onChange={col.setAccession}
                  />

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Call Number
                  </Typography>
                  <TextField
                    value={col.callNum}
                    onChange={col.setCallNum}
                    fullWidth
                    size="small"
                    multiline
                    minRows={4}
                    placeholder="Call Number"
                    margin="dense"
                    variant="outlined"
                    sx={{ bgcolor: '#ffffff' }}
                  />
                </Box>

                {/* Part 4: Barcode & System Codes */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #7c3aed',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                    <QrCode2Icon sx={{ color: '#7c3aed', fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#5b21b6',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        fontSize: '0.75rem',
                      }}
                    >
                      System Barcode & ISO Code
                    </Typography>
                  </Box>

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    Barcode
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    variant="outlined"
                    sx={{ mb: 1.8, bgcolor: '#ffffff' }}
                    value={col.barcode}
                    placeholder="Auto-generated Barcode"
                    onChange={col.setBarcode}
                  />

                  <Typography fontWeight="600" fontSize="0.82rem" sx={{ color: '#0f172a', mb: 0.5 }}>
                    ISO Code
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    variant="outlined"
                    sx={{ bgcolor: '#ffffff' }}
                    value={col.isoCode}
                    placeholder="Auto-generated ISO Code"
                    onChange={col.setIsoCode}
                  />
                </Box>

              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ px: { xs: 2, sm: 4, md: 8, lg: 10 }, pb: { xs: 4, sm: 6, md: 10, lg: 20 }, pt: { xs: 2, sm: 3 } }} justifyContent="center" alignItems="center">
        {!selectedDocId ? (
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ mr: 1.5, bgcolor: '#1b365d', '&:hover': { bgcolor: '#0f2444' }, borderRadius: 2.5, px: 3.5, py: 1.2, fontWeight: 700, boxShadow: '0 4px 12px rgba(27, 54, 93, 0.25)' }}>Save Entry</Button>
        ) : (
          <Button variant="contained" startIcon={<UpdateIcon />} onClick={handleUpdate} sx={{ mr: 1.5, bgcolor: '#0288d1', '&:hover': { bgcolor: '#01579b' }, borderRadius: 2.5, px: 3.5, py: 1.2, fontWeight: 700, boxShadow: '0 4px 12px rgba(2, 136, 209, 0.25)' }}>Update Entry</Button>
        )}
        <Button variant="contained" startIcon={<ClearAllIcon />} onClick={handleClear} sx={{ mr: 1.5, bgcolor: '#64748b', '&:hover': { bgcolor: '#475569' }, borderRadius: 2.5, px: 3.5, py: 1.2, fontWeight: 700, boxShadow: '0 4px 12px rgba(100, 116, 139, 0.2)' }}>Clear Entry</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handleOpenPrint} sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, borderRadius: 2.5, px: 3.5, py: 1.2, fontWeight: 700, boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)' }}>Print Entry</Button>
      </Grid>

      {showBackToTop && (
        <IconButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{ position: 'fixed', bottom: 20, right: 20, bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, zIndex: 9999 }}>
          <KeyboardArrowUpIcon />
        </IconButton>
      )}
    </Box>
  );
}