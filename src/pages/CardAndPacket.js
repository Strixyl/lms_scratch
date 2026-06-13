import {
  Grid, Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Modal,
} from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { Autocomplete } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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
  const [authorLastName1, setAuthorLastName] = useState(''); const [authorFirstName1, setAuthorFirstName] = useState(''); const [authorMiddleInitial1, setAuthorMiddleInitial] = useState(''); const [publisherAuthor1, setPublisherAuthor] = useState('');
  const [authorLastName2, setAuthorLastName2] = useState(''); const [authorFirstName2, setAuthorFirstName2] = useState(''); const [authorMiddleInitial2, setAuthorMiddleInitial2] = useState(''); const [publisherAuthor2, setPublisherAuthor2] = useState('');
  const [authorLastName3, setAuthorLastName3] = useState(''); const [authorFirstName3, setAuthorFirstName3] = useState(''); const [authorMiddleInitial3, setAuthorMiddleInitial3] = useState(''); const [publisherAuthor3, setPublisherAuthor3] = useState('');
  const [authorLastName4, setAuthorLastName4] = useState(''); const [authorFirstName4, setAuthorFirstName4] = useState(''); const [authorMiddleInitial4, setAuthorMiddleInitial4] = useState(''); const [publisherAuthor4, setPublisherAuthor4] = useState('');
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

  // ✅ Save with duplicate check
  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5000/api/card-and-packet', {
        selectedLibrary1, section1, selectedLibrary2, section2, selectedLibrary3, section3, selectedLibrary4, section4,
        authorLastName1, authorFirstName1, authorMiddleInitial1: authorMiddleInitial1 ? `${authorMiddleInitial1}.` : '', publisherAuthor1,
        authorLastName2, authorFirstName2, authorMiddleInitial2: authorMiddleInitial2 ? `${authorMiddleInitial2}.` : '', publisherAuthor2,
        authorLastName3, authorFirstName3, authorMiddleInitial3: authorMiddleInitial3 ? `${authorMiddleInitial3}.` : '', publisherAuthor3,
        authorLastName4, authorFirstName4, authorMiddleInitial4: authorMiddleInitial4 ? `${authorMiddleInitial4}.` : '', publisherAuthor4,
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
      setSearchResults(response.data);
      setOpenModal(true);
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
    setAuthorLastName(entry.authorLastName1); setAuthorLastName2(entry.authorLastName2); setAuthorLastName3(entry.authorLastName3); setAuthorLastName4(entry.authorLastName4);
    setAuthorFirstName(entry.authorFirstName1); setAuthorFirstName2(entry.authorFirstName2); setAuthorFirstName3(entry.authorFirstName3); setAuthorFirstName4(entry.authorFirstName4);
    setAuthorMiddleInitial(entry.authorMiddleInitial1); setAuthorMiddleInitial2(entry.authorMiddleInitial2); setAuthorMiddleInitial3(entry.authorMiddleInitial3); setAuthorMiddleInitial4(entry.authorMiddleInitial4);
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
        authorLastName1, authorFirstName1, authorMiddleInitial1, publisherAuthor1,
        authorLastName2, authorFirstName2, authorMiddleInitial2, publisherAuthor2,
        authorLastName3, authorFirstName3, authorMiddleInitial3, publisherAuthor3,
        authorLastName4, authorFirstName4, authorMiddleInitial4, publisherAuthor4,
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
    setSelectedLibrary1(''); setSelectedLibrary2(''); setSelectedLibrary3(''); setSelectedLibrary4('');
    setSection1(''); setSection2(''); setSection3(''); setSection4('');
    setAuthorLastName(''); setAuthorLastName2(''); setAuthorLastName3(''); setAuthorLastName4('');
    setAuthorFirstName(''); setAuthorFirstName2(''); setAuthorFirstName3(''); setAuthorFirstName4('');
    setAuthorMiddleInitial(''); setAuthorMiddleInitial2(''); setAuthorMiddleInitial3(''); setAuthorMiddleInitial4('');
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
      { library: selectedLibrary1, section: section1, author: publisherAuthor1 || `${authorLastName1}, ${authorFirstName1} ${authorMiddleInitial1}`, title: bookTitle1, accession: accessionNumber1, barcode: barcodeValue1, callNum: callNumber1, isoCode: isoCodeValue1 },
      { library: selectedLibrary2, section: section2, author: publisherAuthor2 || `${authorLastName2}, ${authorFirstName2} ${authorMiddleInitial2}`, title: bookTitle2, accession: accessionNumber2, barcode: barcodeValue2, callNum: callNumber2, isoCode: isoCodeValue2 },
      { library: selectedLibrary3, section: section3, author: publisherAuthor3 || `${authorLastName3}, ${authorFirstName3} ${authorMiddleInitial3}`, title: bookTitle3, accession: accessionNumber3, barcode: barcodeValue3, callNum: callNumber3, isoCode: isoCodeValue3 },
      { library: selectedLibrary4, section: section4, author: publisherAuthor4 || `${authorLastName4}, ${authorFirstName4} ${authorMiddleInitial4}`, title: bookTitle4, accession: accessionNumber4, barcode: barcodeValue4, callNum: callNumber4, isoCode: isoCodeValue4 },
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
  const handleAccessionNumberChange4 = (e) => { const v = e.target.value; setAccessionNumber4(v); setBarcodeValue4(`${getBarcodePrefix(selectedLibrary4)}${v}`); };

  const columns = [
    {
      label: 'First Column',
      library: selectedLibrary1, setLibrary: handleLibraryChange,
      section: section1, setSection: (e, v) => setSection1(v),
      lastName: authorLastName1, setLastName: (e) => setAuthorLastName(e.target.value),
      firstName: authorFirstName1, setFirstName: (e) => setAuthorFirstName(e.target.value),
      middleInitial: authorMiddleInitial1, setMiddleInitial: (e) => setAuthorMiddleInitial(e.target.value),
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
      lastName: authorLastName2, setLastName: (e) => setAuthorLastName2(e.target.value),
      firstName: authorFirstName2, setFirstName: (e) => setAuthorFirstName2(e.target.value),
      middleInitial: authorMiddleInitial2, setMiddleInitial: (e) => setAuthorMiddleInitial2(e.target.value),
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
      lastName: authorLastName3, setLastName: (e) => setAuthorLastName3(e.target.value),
      firstName: authorFirstName3, setFirstName: (e) => setAuthorFirstName3(e.target.value),
      middleInitial: authorMiddleInitial3, setMiddleInitial: (e) => setAuthorMiddleInitial3(e.target.value),
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
      lastName: authorLastName4, setLastName: (e) => setAuthorLastName4(e.target.value),
      firstName: authorFirstName4, setFirstName: (e) => setAuthorFirstName4(e.target.value),
      middleInitial: authorMiddleInitial4, setMiddleInitial: (e) => setAuthorMiddleInitial4(e.target.value),
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
                        <Typography fontSize="8.5pt" fontWeight="bold" sx={{ flexGrow: 1 }}>{col.publisher || `${col.lastName}, ${col.firstName} ${col.middleInitial}`}</Typography>
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

      <Grid container spacing={2} sx={{ px: 3, pt: 3 }}>
        {columns.map((col, i) => (
          <Grid item xs={3} key={i}>
            <Typography sx={{ fontWeight: 'light', fontStyle: 'italic', pb: 2 }}>{col.label}</Typography>

            <Typography fontWeight="bold">Library</Typography>
            <Autocomplete options={libraries} freeSolo value={col.library} onChange={col.setLibrary}
              renderInput={(params) => <TextField {...params} label="Choose library" margin="dense" variant="outlined" fullWidth sx={{ mb: 3 }} />} />

            <Typography fontWeight="bold">Section</Typography>
            <Autocomplete options={sections} freeSolo value={col.section} onChange={col.setSection}
              renderInput={(params) => <TextField {...params} label="Choose section" margin="dense" variant="outlined" fullWidth sx={{ mb: 3 }} />} />

            <Typography fontWeight="bold">Author</Typography>
            <TextField value={col.lastName} onChange={col.setLastName} fullWidth label="Last Name" margin="dense" variant="outlined" disabled={col.publisher.trim() !== ''} />
            <TextField value={col.firstName} onChange={col.setFirstName} fullWidth label="First Name" margin="dense" variant="outlined" disabled={col.publisher.trim() !== ''} />
            <TextField value={col.middleInitial} onChange={col.setMiddleInitial} fullWidth label="Middle Initial" margin="dense" variant="outlined" disabled={col.publisher.trim() !== ''} />
            <TextField value={col.publisher} onChange={col.setPublisher} fullWidth placeholder="Type here if the Author is a Publisher" margin="dense" variant="outlined" helperText="*Type here if the Author is a Publisher."
              disabled={col.lastName.trim() !== '' || col.firstName.trim() !== '' || col.middleInitial.trim() !== ''} sx={{ mb: 3 }} />

            <Typography fontWeight="bold">Title</Typography>
            <TextField value={col.title} onChange={col.setTitle} fullWidth multiline minRows={3} margin="dense" variant="outlined" sx={{ mb: 3 }} />

            <Typography fontWeight="bold">Accession Number</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={col.accession} onChange={col.setAccession} />

            <Typography fontWeight="bold">Call Number</Typography>
            <TextField value={col.callNum} onChange={col.setCallNum} fullWidth multiline minRows={6} margin="dense" variant="outlined" sx={{ mb: 3 }} />

            <Typography fontWeight="bold">Barcode</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={col.barcode} label="Auto-generated" onChange={col.setBarcode} />

            <Typography fontWeight="bold">ISO Code</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={col.isoCode} label="Auto-generated" onChange={col.setIsoCode} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ px: { xs: 2, sm: 4, md: 8, lg: 10 }, pb: { xs: 4, sm: 6, md: 10, lg: 20 }, pt: { xs: 2, sm: 3 } }} justifyContent="center" alignItems="center">
        <Button variant="contained" color="primary" onClick={handleSave} sx={{ mr: 1 }}>Save Entry</Button>
        <Button variant="contained" color="primary" onClick={handleUpdate} sx={{ mr: 1 }}>Update Entry</Button>
        <Button variant="contained" color="primary" onClick={handleClear} sx={{ mr: 1 }}>Clear Entry</Button>
        <Button variant="contained" color="primary" onClick={handleOpenPrint}>Print Entry</Button>
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