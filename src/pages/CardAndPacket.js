import {
  Grid, Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, Modal, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import React, { useState, useRef } from "react";
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { Autocomplete } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
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
  const [previewSide, setPreviewSide] = useState('front');
  const printRef = useRef();

  const formatAuthorName = (last, first, mi) => {
    if (!last && !first && !mi) return '';
    if (!first && !mi) return last || '';
    return `${last || ''}${last && first ? ', ' : ''}${first || ''}${mi ? ' ' + mi : ''}`.trim();
  };

  const preparePayload = () => {
    const lib1 = selectedLibrary1 || '';
    const sec1 = section1 || '';
    const acc1 = accessionNumber1 || '';

    const getLib = (lib, acc, title) => lib || ((acc || title) ? lib1 : '');
    const getSec = (sec, acc, title) => sec || ((acc || title) ? sec1 : '');
    const getAcc = (acc, title) => acc || (title ? acc1 : '');

    const l1 = lib1;
    const l2 = getLib(selectedLibrary2, accessionNumber2, bookTitle2);
    const l3 = getLib(selectedLibrary3, accessionNumber3, bookTitle3);
    const l4 = getLib(selectedLibrary4, accessionNumber4, bookTitle4);

    const s1 = sec1;
    const s2 = getSec(section2, accessionNumber2, bookTitle2);
    const s3 = getSec(section3, accessionNumber3, bookTitle3);
    const s4 = getSec(section4, accessionNumber4, bookTitle4);

    const a1 = acc1;
    const a2 = getAcc(accessionNumber2, bookTitle2);
    const a3 = getAcc(accessionNumber3, bookTitle3);
    const a4 = getAcc(accessionNumber4, bookTitle4);

    const b1 = barcodeValue1 || (a1 ? `${getBarcodePrefix(l1)}${a1}` : '');
    const b2 = barcodeValue2 || (a2 ? `${getBarcodePrefix(l2)}${a2}` : '');
    const b3 = barcodeValue3 || (a3 ? `${getBarcodePrefix(l3)}${a3}` : '');
    const b4 = barcodeValue4 || (a4 ? `${getBarcodePrefix(l4)}${a4}` : '');

    const iso1 = isoCodeValue1 || (l1 ? getIsoCode(l1) : '');
    const iso2 = isoCodeValue2 || (l2 ? getIsoCode(l2) : '');
    const iso3 = isoCodeValue3 || (l3 ? getIsoCode(l3) : '');
    const iso4 = isoCodeValue4 || (l4 ? getIsoCode(l4) : '');

    return {
      selectedLibrary1: l1, section1: s1,
      selectedLibrary2: l2, section2: s2,
      selectedLibrary3: l3, section3: s3,
      selectedLibrary4: l4, section4: s4,
      authorName1: authorLastName1, publisherAuthor1,
      authorName2: authorLastName2, publisherAuthor2,
      authorName3: authorLastName3, publisherAuthor3,
      authorName4: authorLastName4, publisherAuthor4,
      bookTitle1, bookTitle2, bookTitle3, bookTitle4,
      accessionNumber1: a1, accessionNumber2: a2, accessionNumber3: a3, accessionNumber4: a4,
      callNumber1, callNumber2, callNumber3, callNumber4,
      copyNumber1: '', copyNumber2: '', copyNumber3: '', copyNumber4: '',
      barcodeValue1: b1, barcodeValue2: b2, barcodeValue3: b3, barcodeValue4: b4,
      isoCodeValue1: iso1, isoCodeValue2: iso2, isoCodeValue3: iso3, isoCodeValue4: iso4,
    };
  };

  // ✅ Save with duplicate check
  const handleSave = async () => {
    try {
      const payload = preparePayload();
      await axios.post('http://localhost:5000/api/card-and-packet', payload);
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
      const payload = preparePayload();
      await axios.put(`http://localhost:5000/api/card-and-packet/${selectedDocId}`, payload);
      alert('Entry updated successfully.');
      setSelectedLibrary1(payload.selectedLibrary1); setSection1(payload.section1); setAccessionNumber(payload.accessionNumber1); setBarcodeValue(payload.barcodeValue1); setIsoCodeValue(payload.isoCodeValue1);
      setSelectedLibrary2(payload.selectedLibrary2); setSection2(payload.section2); setAccessionNumber2(payload.accessionNumber2); setBarcodeValue2(payload.barcodeValue2); setIsoCodeValue2(payload.isoCodeValue2);
      setSelectedLibrary3(payload.selectedLibrary3); setSection3(payload.section3); setAccessionNumber3(payload.accessionNumber3); setBarcodeValue3(payload.barcodeValue3); setIsoCodeValue3(payload.isoCodeValue3);
      setSelectedLibrary4(payload.selectedLibrary4); setSection4(payload.section4); setAccessionNumber4(payload.accessionNumber4); setBarcodeValue4(payload.barcodeValue4); setIsoCodeValue4(payload.isoCodeValue4);
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.message);
      } else {
        console.error('Error updating:', error);
        alert('Failed to update entry.');
      }
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
    const rawCardData = [
      { library: selectedLibrary1, section: section1, author: publisherAuthor1 || authorLastName1, title: bookTitle1, accession: accessionNumber1, barcode: barcodeValue1, callNum: callNumber1, isoCode: isoCodeValue1 },
      { library: selectedLibrary2, section: section2, author: publisherAuthor2 || authorLastName2, title: bookTitle2, accession: accessionNumber2, barcode: barcodeValue2, callNum: callNumber2, isoCode: isoCodeValue2 },
      { library: selectedLibrary3, section: section3, author: publisherAuthor3 || authorLastName3, title: bookTitle3, accession: accessionNumber3, barcode: barcodeValue3, callNum: callNumber3, isoCode: isoCodeValue3 },
      { library: selectedLibrary4, section: section4, author: publisherAuthor4 || authorLastName4, title: bookTitle4, accession: accessionNumber4, barcode: barcodeValue4, callNum: callNumber4, isoCode: isoCodeValue4 },
    ];

    const activeBooks = rawCardData.filter(b => b.title || b.accession || b.author || b.callNum);
    const cardData = Array(4).fill(null).map((_, idx) => {
      if (activeBooks.length === 0) return rawCardData[idx];
      return activeBooks[idx % activeBooks.length];
    });

    const frontEmptyRows = Array(12).fill('<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('');
    const backEmptyRows = Array(20).fill('<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('');

    const frontCardsHTML = cardData.map((card, idx) => {
      const libPrefix = card.library ? (card.library.includes('Henry Luce') ? 'HL' : '') : '';
      return `
      <div class="card">
        <div class="card-header">
          <div class="uni-title">Central Philippine University</div>
          ${(card.isoCode && idx === 0) ? `<div class="iso-code">${card.isoCode.replace('REV.', '<br>REV.').replace('April', '<br>April')}</div>` : ''}
        </div>
        <div class="field-container">
          <div class="field-line">
            <span class="field-label">Author</span>
            <span class="field-value underline">${card.author || ''}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Title</span>
            <span class="field-value underline">${card.title || ''}</span>
          </div>
          <div class="field-row">
            <div class="field-item">
              <span class="field-label">Acc. No.</span>
              <span class="field-value underline">${card.accession || ''}</span>
            </div>
            <div class="field-item">
              <span class="field-label">Barcode</span>
              <span class="field-value underline">${card.barcode || ''}</span>
            </div>
            ${libPrefix ? `
            <div class="field-item prefix-item">
              <span class="field-value underline center-text">${libPrefix}</span>
            </div>` : ''}
          </div>
        </div>
        <table class="borrow-table">
          <thead>
            <tr>
              <th style="width: 32%;">Date Borrowed/<br>Due Date</th>
              <th style="width: 43%;">Borrower's Name</th>
              <th style="width: 25%;">Borrower's<br>ID Number</th>
            </tr>
          </thead>
          <tbody>${frontEmptyRows}</tbody>
        </table>
      </div>
    `;
    }).join('');

    const backCardsHTML = Array(4).fill(0).map(() => `
      <div class="card back-card">
        <table class="borrow-table">
          <thead>
            <tr>
              <th style="width: 32%;">Date Borrowed/<br>Due Date</th>
              <th style="width: 43%;">Borrower's Name</th>
              <th style="width: 25%;">Borrower's<br>ID Number</th>
            </tr>
          </thead>
          <tbody>${backEmptyRows}</tbody>
        </table>
      </div>
    `).join('');

    const packetsHTML = cardData.map((card, idx) => {
      const libPrefix = card.library ? (card.library.includes('Henry Luce') ? 'HL' : '') : '';
      return `
      <div class="packet">
        <div class="packet-header">
          <div class="packet-uni">CENTRAL PHILIPPINE UNIVERSITY</div>
        </div>
        <div class="packet-fields">
          <div class="packet-row-split">
            <div class="packet-field-item">
              <span class="packet-label">CALL No.</span>
              <span class="packet-val underline">${card.callNum || ''}</span>
            </div>
            <div class="packet-field-item">
              <span class="packet-label">ACC. No.</span>
              <span class="packet-val underline">${card.accession || ''}</span>
            </div>
          </div>
        </div>
        <div class="packet-fold-box"></div>
        <div class="packet-bottom-row">
          <span class="packet-prefix-label">${libPrefix}</span>
          ${(card.isoCode && idx === 0) ? `<div class="packet-iso">${card.isoCode.replace('REV.', '<br>REV.').replace('April', '<br>April')}</div>` : ''}
        </div>
      </div>
    `;
    }).join('');

    const printWindow = window.open('', '', 'width=1100,height=850');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Book Card & Packet Print (3 Papers / 4 Pages)</title>
        <style>
          @page { size: Letter; margin: 0.35in; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Times New Roman', serif; font-size: 10pt; color: #000; }
          .print-page {
            width: 100%;
            height: 100vh;
            page-break-after: always;
            break-after: page;
          }
          .print-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          .card-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            width: 100%;
            height: 100%;
            border: 1px solid #000;
          }
          .card {
            border: 1px solid #000;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }
          .card-header {
            position: relative;
            text-align: center;
            margin-bottom: 24px;
          }
          .uni-title {
            font-weight: bold;
            font-size: 11pt;
            text-align: center;
          }
          .iso-code {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 6pt;
            text-align: right;
            line-height: 1.2;
          }
          .field-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 8px;
          }
          .field-line {
            display: flex;
            align-items: flex-end;
          }
          .field-row {
            display: flex;
            gap: 12px;
            align-items: flex-end;
          }
          .field-item {
            display: flex;
            align-items: flex-end;
            flex: 1;
          }
          .prefix-item {
            flex: 0 0 40px;
          }
          .center-text {
            text-align: center;
          }
          .field-label {
            font-size: 9.5pt;
            white-space: nowrap;
            margin-right: 6px;
          }
          .field-value {
            font-size: 9.5pt;
            font-weight: bold;
            flex-grow: 1;
          }
          .underline {
            border-bottom: 1px solid #000;
            min-height: 16px;
            display: inline-block;
            width: 100%;
            padding-left: 4px;
          }
          .borrow-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            flex-grow: 1;
          }
          .borrow-table thead tr {
            border-top: 2.5px solid #000;
            border-bottom: 1.5px solid #000;
          }
          .borrow-table th, .borrow-table td {
            border: 1px solid #000;
            padding: 2px 4px;
            font-size: 8.5pt;
            text-align: center;
          }
          .borrow-table th {
            font-weight: bold;
            vertical-align: middle;
          }
          .borrow-table td {
            height: 19px;
          }
          .back-card {
            padding: 10px;
          }
          .back-card .borrow-table {
            height: 100%;
            margin-top: 0;
          }

          /* Book Packet Styles */
          .packet-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            width: 100%;
            height: 100%;
            border: 1px solid #000;
          }
          .packet {
            border: 1px solid #000;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }
          .packet-header {
            position: relative;
            text-align: center;
            margin-bottom: 28px;
          }
          .packet-uni {
            font-weight: bold;
            font-size: 11pt;
            text-align: center;
          }
          .packet-iso {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 6pt;
            text-align: right;
            line-height: 1.2;
          }
          .packet-fields {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
          }
          .packet-row-split {
            display: flex;
            gap: 16px;
            align-items: flex-end;
          }
          .packet-field-item {
            display: flex;
            align-items: flex-end;
            flex: 1;
          }
          .packet-bottom-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
            margin-bottom: 4px;
          }
          .packet-label {
            font-size: 9.5pt;
            font-weight: bold;
            white-space: nowrap;
            margin-right: 6px;
          }
          .packet-val {
            font-size: 9.5pt;
            font-weight: bold;
            flex-grow: 1;
          }
          .packet-prefix-label {
            font-size: 9.5pt;
            font-weight: bold;
          }
          .packet-fold-box {
            border-top: 1px solid #000;
            margin-top: 4px;
            flex-grow: 1;
          }
        </style>
      </head>
      <body>
        <!-- Page 1: 4 Book Cards Front -->
        <div class="print-page">
          <div class="card-grid">${frontCardsHTML}</div>
        </div>
        <!-- Page 2: 4 Book Cards Back (Back-to-Back with Page 1) -->
        <div class="print-page">
          <div class="card-grid">${backCardsHTML}</div>
        </div>
        <!-- Page 3: 4 Book Packets (Paper 2) -->
        <div class="print-page">
          <div class="packet-grid">${packetsHTML}</div>
        </div>
        <!-- Page 4: 4 Book Packets Duplicate (Paper 3) -->
        <div class="print-page">
          <div class="packet-grid">${packetsHTML}</div>
        </div>
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
  const handleAccessionNumberChange2 = (e) => { const v = e.target.value; setAccessionNumber2(v); setBarcodeValue2(`${getBarcodePrefix(selectedLibrary2 || selectedLibrary1)}${v}`); };
  const handleAccessionNumberChange3 = (e) => { const v = e.target.value; setAccessionNumber3(v); setBarcodeValue3(`${getBarcodePrefix(selectedLibrary3 || selectedLibrary1)}${v}`); };
  const handleAccessionNumberChange4 = (e) => { const v = e.target.value; setAccessionNumber4(v); setBarcodeValue4(`${getBarcodePrefix(selectedLibrary4 || selectedLibrary1)}${v}`); }; const columns = [
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

  const activeCols = columns.filter(c => c.title || c.accession || c.publisher || c.authorName || c.callNum);
  const previewColumns = Array(4).fill(null).map((_, i) => {
    if (activeCols.length === 0) return columns[i];
    return activeCols[i % activeCols.length];
  });

  return (
    <Box>
      <Header>
        {(toggleDrawer) => (
          <>
            <TopBar title="Book Card and Book Packet" onMenuClick={toggleDrawer} subtitle="BOOK CARD AND BOOK PACKET" />

            <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">Print Preview (3 Papers / 4 Pages)</Typography>
                <ToggleButtonGroup
                  value={previewSide}
                  exclusive
                  onChange={(e, val) => { if (val) setPreviewSide(val); }}
                  size="small"
                >
                  <ToggleButton value="front" sx={{ fontWeight: 'bold' }}>Page 1: Front Cards</ToggleButton>
                  <ToggleButton value="back" sx={{ fontWeight: 'bold' }}>Page 2: Back Cards</ToggleButton>
                  <ToggleButton value="packet" sx={{ fontWeight: 'bold' }}>Page 3 & 4: Packets (2 Papers)</ToggleButton>
                </ToggleButtonGroup>
              </DialogTitle>
              <DialogContent>
                {previewSide === 'front' ? (
                  <Box ref={printRef} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0px', height: '700px', fontFamily: 'Times New Roman, serif', fontSize: '9pt', border: '1px solid #000' }}>
                    {previewColumns.map((col, i) => {
                      const libPrefix = col.library ? (col.library.includes('Henry Luce') ? 'HL' : '') : '';
                      return (
                        <Box key={i} sx={{ border: '1px solid #000', padding: '12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
                          <Box sx={{ position: 'relative', textAlign: 'center', mb: 2 }}>
                            <Typography fontSize="10.5pt" fontWeight="bold">Central Philippine University</Typography>
                            {(col.isoCode && i === 0) && (
                              <Typography fontSize="5.5pt" sx={{ position: 'absolute', top: 0, right: 0, textAlign: 'right', lineHeight: 1.2 }}>
                                {col.isoCode.replace('REV.', '\nREV.').replace('April', '\nApril')}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                              <Typography fontSize="9pt" sx={{ whiteSpace: 'nowrap', mr: 0.75 }}>Author</Typography>
                              <Box sx={{ flexGrow: 1, borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', pl: 0.5, minHeight: '18px' }}>
                                {col.publisher || col.authorName}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                              <Typography fontSize="9pt" sx={{ whiteSpace: 'nowrap', mr: 0.75 }}>Title</Typography>
                              <Box sx={{ flexGrow: 1, borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', pl: 0.5, minHeight: '18px' }}>
                                {col.title}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography fontSize="9pt" sx={{ whiteSpace: 'nowrap', mr: 0.5 }}>Acc. No.</Typography>
                                <Box sx={{ flexGrow: 1, borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', pl: 0.5, minHeight: '18px' }}>
                                  {col.accession}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography fontSize="9pt" sx={{ whiteSpace: 'nowrap', mr: 0.5 }}>Barcode</Typography>
                                <Box sx={{ flexGrow: 1, borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', pl: 0.5, minHeight: '18px' }}>
                                  {col.barcode}
                                </Box>
                              </Box>
                              {libPrefix && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', width: '35px' }}>
                                  <Box sx={{ flexGrow: 1, borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', minHeight: '18px' }}>
                                    {libPrefix}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ mt: 0.5, flexGrow: 1 }}>
                            <table width="100%" border="1" cellPadding="2" cellSpacing="0" style={{ borderCollapse: 'collapse', fontSize: '7.5pt' }}>
                              <thead>
                                <tr style={{ borderTop: '2.5px solid black', borderBottom: '1.5px solid black' }}>
                                  <th style={{ width: '32%', fontWeight: 'bold', textAlign: 'center' }}>Date Borrowed /<br />Due Date</th>
                                  <th style={{ width: '43%', fontWeight: 'bold', textAlign: 'center' }}>Borrower's Name</th>
                                  <th style={{ width: '25%', fontWeight: 'bold', textAlign: 'center' }}>Borrower's<br />ID Number</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...Array(12)].map((_, rowIdx) => (
                                  <tr key={rowIdx}><td style={{ height: '18px' }}></td><td></td><td></td></tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : previewSide === 'back' ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0px', height: '700px', fontFamily: 'Times New Roman, serif', fontSize: '9pt', border: '1px solid #000' }}>
                    {[...Array(4)].map((_, i) => (
                      <Box key={i} sx={{ border: '1px solid #000', padding: '10px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
                        <table width="100%" border="1" cellPadding="2" cellSpacing="0" style={{ borderCollapse: 'collapse', fontSize: '7.5pt', height: '100%' }}>
                          <thead>
                            <tr style={{ borderTop: '2.5px solid black', borderBottom: '1.5px solid black' }}>
                              <th style={{ width: '32%', fontWeight: 'bold', textAlign: 'center' }}>Date Borrowed /<br />Due Date</th>
                              <th style={{ width: '43%', fontWeight: 'bold', textAlign: 'center' }}>Borrower's Name</th>
                              <th style={{ width: '25%', fontWeight: 'bold', textAlign: 'center' }}>Borrower's<br />ID Number</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...Array(20)].map((_, rowIdx) => (
                              <tr key={rowIdx}><td style={{ height: '18px' }}></td><td></td><td></td></tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0px', height: '700px', fontFamily: 'Times New Roman, serif', fontSize: '9pt', border: '1px solid #000' }}>
                    {previewColumns.map((col, i) => {
                      const libPrefix = col.library ? (col.library.includes('Henry Luce') ? 'HL' : '') : '';
                      return (
                        <Box key={i} sx={{ border: '1px solid #000', padding: '14px 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
                          <Box sx={{ position: 'relative', textAlign: 'center', mb: 2 }}>
                            <Typography fontSize="10.5pt" fontWeight="bold">CENTRAL PHILIPPINE UNIVERSITY</Typography>
                            {(col.isoCode && i === 0) && (
                              <Typography fontSize="5.5pt" sx={{ position: 'absolute', top: 0, right: 0, textAlign: 'right', lineHeight: 1.2 }}>
                                {col.isoCode.replace('REV.', '\nREV.').replace('April', '\nApril')}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography fontSize="9pt" fontWeight="bold" sx={{ whiteSpace: 'nowrap', mr: 0.75 }}>CALL No.</Typography>
                                <Box sx={{ flexGrow: 1, borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', pl: 0.5, minHeight: '18px' }}>
                                  {col.callNum}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography fontSize="9pt" fontWeight="bold" sx={{ whiteSpace: 'nowrap', mr: 0.75 }}>ACC. No.</Typography>
                                <Box sx={{ flexGrow: 1, borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', pl: 0.5, minHeight: '18px' }}>
                                  {col.accession}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                           <Box sx={{ borderTop: '1px solid black', flexGrow: 1, mt: 1, mb: 0.5 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 'auto' }}>
                            <Typography fontSize="9pt" fontWeight="bold">{libPrefix}</Typography>
                            {(col.isoCode && i === 0) && (
                              <Typography fontSize="5.5pt" sx={{ textAlign: 'right', lineHeight: 1.2 }}>
                                {col.isoCode.replace('REV.', '\nREV.').replace('April', '\nApril')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="contained" onClick={handlePrint}>🖨️ Print (Page 1 Front & Page 2 Back)</Button>
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
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 450, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, borderRadius: 2 }}>
          <Typography variant="h6" mb={2}>Search Results</Typography>
          {searchResults.map((result) => {
            const accs = [result.accessionNumber1, result.accessionNumber2, result.accessionNumber3, result.accessionNumber4].filter(Boolean).join(', ');
            const title = result.bookTitle1 || result.bookTitle2 || result.bookTitle3 || result.bookTitle4 || `Entry #${result.CardID}`;
            return (
              <Box key={result.CardID} sx={{ p: 1.5, border: '1px solid #cbd5e1', borderRadius: 2, mb: 1.5, cursor: 'pointer', '&:hover': { backgroundColor: '#f1f5f9' } }} onClick={() => loadSelectedEntry(result)}>
                <Typography variant="subtitle2" fontWeight="700" color="#1b365d">{title}</Typography>
                <Typography variant="body2" color="text.secondary">Acc No(s): {accs || 'N/A'}</Typography>
              </Box>
            );
          })}
          <Button variant="contained" onClick={handleClose} sx={{ mt: 1 }}>Close</Button>
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
    </Box>
  );
}