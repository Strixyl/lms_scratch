import {
  Grid,Box,Typography,TextField,Button,Dialog,DialogTitle,DialogContent,DialogActions,List,ListItem,ListItemText,Modal,
  Container,
} from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';
import { Autocomplete } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where, doc, getFirestore, Timestamp, updateDoc } from "firebase/firestore";
import { eventWrapper } from "@testing-library/user-event/dist/utils";
import { CenterFocusStrong } from "@mui/icons-material";


//Display combobox values
const libraries1 = ["Elementary School Library", "Henry Luce III Library", "Kindergarten Library", "Junior High School Library", "Law Library", "Senior High School Library", "Theology Library"];
const libraries2 = ["Elementary School Library", "Henry Luce III Library", "Kindergarten Library", "Junior High School Library", "Law Library", "Senior High School Library", "Theology Library"];
const libraries3 = ["Elementary School Library", "Henry Luce III Library", "Kindergarten Library", "Junior High School Library", "Law Library", "Senior High School Library", "Theology Library"];
const libraries4 = ["Elementary School Library", "Henry Luce III Library", "Kindergarten Library", "Junior High School Library", "Law Library", "Senior High School Library", "Theology Library"];
const sections = ["American Corner", "Archives", "Circulation", "Elementary", "Filipiniana", "General Library", "Graduate Studies Library", "Junior High School", "Kindergarten", "Medicine", "Meyer Asian Collection", "Law", "Library Science Collection", "Periodicals", 
                  "Rare Filipiniana", "Reference", "Senior High School", "Serials", "Theology Library", "Thesis Collection"];
const copyNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

//Export entries to firebase
export default function CardAndPacket() {
  const [library, setLibrary] = useState(null); const [library2, setLibrary2] = useState(null); const [library3, setLibrary3] = useState(null); const [library4, setLibrary4] = useState(null);
  const [section1, setSection1] = useState(''); const [section2, setSection2] = useState(''); const [section3, setSection3] = useState(''); const [section4, setSection4] = useState('');
  const [copyNumber1, setCopyNumber] = useState(''); const [copyNumber2, setCopyNumber2] = useState(''); const [copyNumber3, setCopyNumber3] = useState(''); const [copyNumber4, setCopyNumber4] = useState('');
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

  //Save button
  const handleSave = async () => {
    const dataToSave = {
      selectedLibrary1, selectedLibrary2, selectedLibrary3, selectedLibrary4,
      section1, section2, section3, section4,
      copyNumber1, copyNumber2, copyNumber3, copyNumber4,
      barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
      isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4,
      accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
      authorLastName1, authorFirstName1, authorMiddleInitial1: authorMiddleInitial1 ? `${authorMiddleInitial1}.` : "", publisherAuthor1,
      authorLastName2, authorFirstName2, authorMiddleInitial2: authorMiddleInitial2 ? `${authorMiddleInitial2}.` : "", publisherAuthor2,
      authorLastName3, authorFirstName3, authorMiddleInitial3: authorMiddleInitial3 ? `${authorMiddleInitial3}.` : "", publisherAuthor3,
      authorLastName4, authorFirstName4, authorMiddleInitial4: authorMiddleInitial4 ? `${authorMiddleInitial4}.` : "", publisherAuthor4,
      publisherAuthor1, callNumber2, callNumber3, callNumber4,
      bookTitle1, bookTitle2, bookTitle3, bookTitle4,
      timestamp: new Date()
    };
  
    try {
      await addDoc(collection(db, "cardAndPacketData"), dataToSave);
      alert("Data saved successfully!");
      setSelectedLibrary1(""); setSelectedLibrary2(""); setSelectedLibrary3(""); setSelectedLibrary4("");
      setSection1(""); setSection2(""); setSection3(""); setSection4("");
      setAuthorLastName(""); setAuthorFirstName(""); setAuthorMiddleInitial(""); setPublisherAuthor("");
      setAuthorLastName2(""); setAuthorFirstName2(""); setAuthorMiddleInitial2(""); setPublisherAuthor2("");
      setAuthorLastName3(""); setAuthorFirstName3(""); setAuthorMiddleInitial3(""); setPublisherAuthor3("");
      setAuthorLastName4(""); setAuthorFirstName4(""); setAuthorMiddleInitial4(""); setPublisherAuthor4("");
      setBookTitle(""); setBookTitle2(""); setBookTitle3(""); setBookTitle4("");
      setAccessionNumber(""); setAccessionNumber2(""); setAccessionNumber3(""); setAccessionNumber4("");
      setCopyNumber(""); setCopyNumber2(""); setCopyNumber3(""); setCopyNumber4(""); 
      setCallNumber1(""); setCallNumber2(""); setCallNumber3(""); setCallNumber4("");
      setBarcodeValue(""); setBarcodeValue2(""); setBarcodeValue3(""); setBarcodeValue4("");
      setIsoCodeValue(""); setIsoCodeValue2(""); setIsoCodeValue3(""); setIsoCodeValue4("");
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      console.error("Error saving data: ", error);
      alert("Error saving data.");
    }
  };

  //Search button
  const db = getFirestore(); 
  const [searchQuery, setSearchQuery] = useState(""); const [searchResults, setSearchResults] = useState([]); const [openModal, setOpenModal] = useState(false);; const [selectedDocId, setSelectedDocId] = useState(null); // For tracking the Firestore doc to update

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Enter the accession number!");
      return;
    }

    try {
      const colRef = collection(db, "cardAndPacketData");  // Correct collection
      const q = query(colRef, where("accessionNumber1", "==", searchQuery.trim()));
      const querySnapshot = await getDocs(q);

      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));

      if (results.length === 0) {
        alert("No entries found.");
      }

      setSearchResults(results);
      setOpenModal(true); // <-- Open the Modal
      } catch (error) {
        console.error("Error searching:", error);
        alert("An error occurred during search.");
      }
    };
    const handleClose = () => setOpenModal(false);

    const loadSelectedEntry = (entry) => {
    const d = entry.data;
    setSelectedDocId(entry.id);
    setSelectedLibrary1(d.selectedLibrary1); setSelectedLibrary2(d.selectedLibrary2); setSelectedLibrary3(d.selectedLibrary3); setSelectedLibrary4(d.selectedLibrary4);
    setSection1(d.section1); setSection2(d.section2); setSection3(d.section3); setSection4(d.section4);
    setAuthorLastName(d.authorLastName1); setAuthorLastName2(d.authorLastName2); setAuthorLastName3(d.authorLastName3); setAuthorLastName4(d.authorLastName4);
    setAuthorFirstName(d.authorFirstName1); setAuthorFirstName2(d.authorFirstName2); setAuthorFirstName3(d.authorFirstName3); setAuthorFirstName4(d.authorFirstName4);
    setAuthorMiddleInitial(d.authorMiddleInitial1 ? d.authorMiddleInitial1.replace(/\.*$/, ".") : ""); setAuthorMiddleInitial2(d.authorMiddleInitial2 ? d.authorMiddleInitial2.replace(/\.*$/, ".") : ""); setAuthorMiddleInitial3(d.authorMiddleInitial3 ? d.authorMiddleInitial3.replace(/\.*$/, ".") : ""); setAuthorMiddleInitial4(d.authorMiddleInitial4 ? d.authorMiddleInitial4.replace(/\.*$/, ".") : "");
    setPublisherAuthor(d.publisherAuthor1); setPublisherAuthor2(d.publisherAuthor2); setPublisherAuthor3(d.publisherAuthor3); setPublisherAuthor4(d.publisherAuthor4);
    setBookTitle(d.bookTitle1); setBookTitle2(d.bookTitle2); setBookTitle3(d.bookTitle3); setBookTitle4(d.bookTitle4);
    setAccessionNumber(d.accessionNumber1); setAccessionNumber2(d.accessionNumber2); setAccessionNumber3(d.accessionNumber3); setAccessionNumber4(d.accessionNumber4);
    setCallNumber1(d.callNumber1); setCallNumber2(d.callNumber2); setCallNumber3(d.callNumber3); setCallNumber4(d.callNumber4);
    setCopyNumber(d.copyNumber1); setCopyNumber2(d.copyNumber2); setCopyNumber3(d.copyNumber3); setCopyNumber4(d.copyNumber4);  
    setBarcodeValue(d.barcodeValue1); setBarcodeValue2(d.barcodeValue2); setBarcodeValue3(d.barcodeValue3); setBarcodeValue4(d.barcodeValue4);
    setIsoCodeValue(d.isoCodeValue1); setIsoCodeValue2(d.isoCodeValue2); setIsoCodeValue3(d.isoCodeValue3); setIsoCodeValue4(d.isoCodeValue4);
    setSearchQuery(""); //clear search box

    setTimeout(() => {
      setOpenModal(false); //auto close modal
    }, 100);

  };
  
  const handleUpdate = async () => {
    if (!selectedDocId) {
      alert("No entry selected to update.");
      return;
    }
  
    const docRef = doc(db, "cardAndPacketData", selectedDocId);
  
    try {
      await updateDoc(docRef, {
        selectedLibrary1,selectedLibrary2,selectedLibrary3,selectedLibrary4,
        section1,section2,section3,section4,
        authorLastName1,authorLastName2,authorLastName3,authorLastName4,
        authorFirstName1,authorFirstName2,authorFirstName3,authorFirstName4,
        authorMiddleInitial1,authorMiddleInitial2,authorMiddleInitial3,authorMiddleInitial4,
        publisherAuthor1,publisherAuthor2,publisherAuthor3,publisherAuthor4,
        bookTitle1,bookTitle2,bookTitle3,bookTitle4,
        accessionNumber1,accessionNumber2,accessionNumber3,accessionNumber4,
        copyNumber1,copyNumber2,copyNumber3,copyNumber4,
        callNumber1,callNumber2,callNumber3,callNumber4,
        barcodeValue1,barcodeValue2,barcodeValue3,barcodeValue4,
        isoCodeValue1,isoCodeValue2,isoCodeValue3,isoCodeValue4,
        updatedAt: new Date()
      });
  
      alert("Entry updated successfully.");
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Failed to update entry.");
    }
  };

    const handleClear = () => {
      setSelectedLibrary1("");setSelectedLibrary2("");setSelectedLibrary3("");setSelectedLibrary4("");
      setSection1("");setSection2("");setSection3("");setSection4("");
      setAuthorLastName("");setAuthorLastName2("");setAuthorLastName3("");setAuthorLastName4("");
      setAuthorFirstName("");setAuthorFirstName2("");setAuthorFirstName3("");setAuthorFirstName4("");
      setAuthorMiddleInitial("");setAuthorMiddleInitial2("");setAuthorMiddleInitial3("");setAuthorMiddleInitial4("");
      setPublisherAuthor("");setPublisherAuthor2("");setPublisherAuthor3("");setPublisherAuthor4("");
      setBookTitle("");setBookTitle2("");setBookTitle3("");setBookTitle4("");
      setAccessionNumber("");setAccessionNumber2("");setAccessionNumber3("");setAccessionNumber4("");
      setCopyNumber("");setCopyNumber2("");setCopyNumber3("");setCopyNumber4("");
      setCallNumber1("");setCallNumber2("");setCallNumber3("");setCallNumber4("");
      setBarcodeValue("");setBarcodeValue2("");setBarcodeValue3("");setBarcodeValue4("");
      setIsoCodeValue("");setIsoCodeValue2("");setIsoCodeValue3("");setIsoCodeValue4("");
      setSearchQuery("");
      window.scrollTo(0, 0); // Optional: scroll to top
    };
  
      //handle print
      const printRef = useRef();
      const [cards, setCards] = useState([]);
      const [printModalOpen, setPrintModalOpen] = useState(false);
      

      const handleOpenPrint = () => {
      const cardEntries = [
        {
          callNumber1,
          selectedLibrary1,
          section1,
          isoCode: isoCodeValue1,
          accessionNumber1,
          barcode: barcodeValue1,
        },
        {
          callNumber: callNumber2,
          library: library2,
          section: section2,
          isoCode: isoCodeValue2,
          accessionNumber: accessionNumber2,
          barcode: barcodeValue2,
        },
        {
          callNumber: callNumber3,
          library: library3,
          section: section3,
          isoCode: isoCodeValue3,
          accessionNumber: accessionNumber3,
          barcode: barcodeValue3,
        },
        {
          callNumber: callNumber4,
          library: library4,
          section: section4,
          isoCode: isoCodeValue4,
          accessionNumber: accessionNumber4,
          barcode: barcodeValue4,
        }
      ];

      setCards(cardEntries);
      setPrintModalOpen(true);
    };

    const handlePrint = () => {
      const printWindow = window.open('', '', 'width=1000,height=800');
      const doc = printWindow.document;

      doc.open();
      doc.write('<!DOCTYPE html><html><head><title>Print</title>');
      doc.write(`
  <style>
    @page {
      size: Letter;
      margin: 0.5in;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
    }

    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8px;
      height: 960px; /* Full printable height for 1 page */
      outline: 1px dashed red;
    }

    .card {
      border: 1px solid black;
      padding: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
      outline: 1px solid blue;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    th, td {
      border: 1px solid black;
      padding: 4px;
      text-align: left;
    }
  </style>
`);
      doc.write('</head><body><div id="print-content"></div></body></html>');
      doc.close();

      printWindow.onload = () => {
        const content = printRef.current.cloneNode(true);
        const container = printWindow.document.getElementById('print-content');
        container.appendChild(content);

        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 300);
      };
    };




      
  const handleSectionChange1 = (event, newValue) => {
    setSection1(newValue);
  }; const handleSectionChange2 = (event, newValue) => {
    setSection2(newValue);
  }; const handleSectionChange3 = (event, newValue) => {
    setSection3(newValue);
  }; const handleSectionChange4 = (event, newValue) => {
    setSection4(newValue);
  };

  const handleCopyNumChange = (event, newValue) => {
    setCopyNumber(newValue);
  }; const handleCopyNumChange2 = (event, newValue) => {
    setCopyNumber2(newValue);
  }; const handleCopyNumChange3 = (event, newValue) => {
    setCopyNumber3(newValue);
  }; const handleCopyNumChange4 = (event, newValue) => {
    setCopyNumber4(newValue);
  };

  const handleCallNumChange = (event, newValue) => {
    setCallNumber1(newValue);
  }; const handleCallNumChange2 = (event, newValue) => {
    setCallNumber2(newValue);
  }; const handleCallNumChange3 = (event, newValue) => {
    setCallNumber3(newValue);
  }; const handleCallNumChange4 = (event, newValue) => {
    setCallNumber4(newValue);
  };

  const handleLibraryChange = (event, newValue) => {
    setSelectedLibrary1(newValue);
    if (newValue === 'Henry Luce III Library') {
      setIsoCodeValue('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue('HL00${accessionNumber1}');
    } 
    if (newValue === 'Elementary School Library') {
      setIsoCodeValue('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue('ESL00${accessionNumber1}');
    }
    if (newValue === 'Kindergarten Library') {
      setIsoCodeValue('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue('KL00${accessionNumber1}');
    }
    if (newValue === 'Junior High School Library') {
      setIsoCodeValue('CPUJHSL-2023');
      setBarcodeValue('JHSL00${accessionNumber1}');
    }
    if (newValue === 'Law Library') {
      setIsoCodeValue('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue('HL00${accessionNumber1}');
    }
    if (newValue === 'Senior High School Library') {
      setIsoCodeValue('CPUSHSL-2023');
      setBarcodeValue('SHSL00${accessionNumber1}');
    }
    if (newValue === 'Theology Library') {
      setIsoCodeValue('CPUTL-2023');
      setBarcodeValue('TL00${accessionNumber1}');
    }
  };

  const handleLibraryChange2 = (event, newValue) => {
    setSelectedLibrary2(newValue);
    if (newValue === 'Henry Luce III Library') {
      setIsoCodeValue2('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue2('HL00${accessionNumber1}');
    } 
    if (newValue === 'Elementary School Library') {
      setIsoCodeValue2('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue2('ESL00${accessionNumber1}');
    }
    if (newValue === 'Kindergarten Library') {
      setIsoCodeValue2('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue2('KL00${accessionNumber1}');
    }
    if (newValue === 'Junior High School Library') {
      setIsoCodeValue2('CPUJHSL-2023');
      setBarcodeValue2('JHSL00${accessionNumber1}');
    }
    if (newValue === 'Law Library') {
      setIsoCodeValue2('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue2('HL00${accessionNumber1}');
    }
    if (newValue === 'Senior High School Library') {
      setIsoCodeValue2('CPUSHSL-2023');
      setBarcodeValue2('SHSL00${accessionNumber1}');
    }
    if (newValue === 'Theology Library') {
      setIsoCodeValue2('CPUTL-2023');
      setBarcodeValue2('TL00${accessionNumber1}');
    }
  };

  const handleLibraryChange3 = (event, newValue) => {
    setSelectedLibrary3(newValue);
    if (newValue === 'Henry Luce III Library') {
      setIsoCodeValue3('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue3('HL00${accessionNumber1}');
    } 
    if (newValue === 'Elementary School Library') {
      setIsoCodeValue3('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue3('ESL00${accessionNumber1}');
    }
    if (newValue === 'Kindergarten Library') {
      setIsoCodeValue3('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue3('KL00${accessionNumber1}');
    }
    if (newValue === 'Junior High School Library') {
      setIsoCodeValue3('CPUJHSL-2023');
      setBarcodeValue3('JHSL00${accessionNumber1}');
    }
    if (newValue === 'Law Library') {
      setIsoCodeValue3('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue3('HL00${accessionNumber1}');
    }
    if (newValue === 'Senior High School Library') {
      setIsoCodeValue3('CPUSHSL-2023');
      setBarcodeValue3('SHSL00${accessionNumber1}');
    }
    if (newValue === 'Theology Library') {
      setIsoCodeValue3('CPUTL-2023');
      setBarcodeValue3('TL00${accessionNumber1}');
    }
  };

  const handleLibraryChange4 = (event, newValue) => {
    setSelectedLibrary4(newValue);
    if (newValue === 'Henry Luce III Library') {
      setIsoCodeValue4('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue4('HL00${accessionNumber1}');
    } 
    if (newValue === 'Elementary School Library') {
      setIsoCodeValue4('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue4('ESL00${accessionNumber1}');
    }
    if (newValue === 'Kindergarten Library') {
      setIsoCodeValue4('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue4('KL00${accessionNumber1}');
    }
    if (newValue === 'Junior High School Library') {
      setIsoCodeValue4('CPUJHSL-2023');
      setBarcodeValue4('JHSL00${accessionNumber1}');
    }
    if (newValue === 'Law Library') {
      setIsoCodeValue4('CPULRS-06 REV. 02 April 13,2023');
      setBarcodeValue4('HL00${accessionNumber1}');
    }
    if (newValue === 'Senior High School Library') {
      setIsoCodeValue4('CPUSHSL-2023');
      setBarcodeValue4('SHSL00${accessionNumber1}');
    }
    if (newValue === 'Theology Library') {
      setIsoCodeValue4('CPUTL-2023');
      setBarcodeValue4('TL00${accessionNumber1}');
    }
  };

  const handleAccessionNumberChange = (e) => {
    const value = e.target.value;
    setAccessionNumber(value);
  
    if (selectedLibrary1 === 'Henry Luce III Library') {
      setBarcodeValue(`HL00${value}`);
    }
    if (selectedLibrary1 === 'Elementary School Library') {
      setBarcodeValue(`ESL00${value}`);
    }
    if (selectedLibrary1 === 'Kindergarten Library') {
      setBarcodeValue(`KL00${value}`);
    }
    if (selectedLibrary1 === 'Junior High School Library') {
      setBarcodeValue(`JHSL00${value}`);
    }
    if (selectedLibrary1 === 'Law Library') {
      setBarcodeValue(`HL00${value}`);
    }
    if (selectedLibrary1 === 'Senior High School Library') {
      setBarcodeValue(`SHSL00${value}`);
    }
    if (selectedLibrary1 === 'Theology Library') {
      setBarcodeValue(`TL00${value}`);
    }
  };

  const handleAccessionNumberChange2 = (e) => {
    const value = e.target.value;
    setAccessionNumber2(value);
  
    if (selectedLibrary2 === 'Henry Luce III Library') {
      setBarcodeValue2(`HL00${value}`);
    }
    if (selectedLibrary2 === 'Elementary School Library') {
      setBarcodeValue2(`ESL00${value}`);
    }
    if (selectedLibrary2 === 'Kindergarten Library') {
      setBarcodeValue2(`KL00${value}`);
    }
    if (selectedLibrary2 === 'Junior High School Library') {
      setBarcodeValue2(`JHSL00${value}`);
    }
    if (selectedLibrary2 === 'Law Library') {
      setBarcodeValue2(`HL00${value}`);
    }
    if (selectedLibrary2 === 'Senior High School Library') {
      setBarcodeValue2(`SHSL00${value}`);
    }
    if (selectedLibrary2 === 'Theology Library') {
      setBarcodeValue2(`TL00${value}`);
    }
  };

  const handleAccessionNumberChange3 = (e) => {
    const value = e.target.value;
    setAccessionNumber3(value);
  
    if (selectedLibrary3 === 'Henry Luce III Library') {
      setBarcodeValue3(`HL00${value}`);
    }
    if (selectedLibrary3 === 'Elementary School Library') {
      setBarcodeValue3(`ESL00${value}`);
    }
    if (selectedLibrary3 === 'Kindergarten Library') {
      setBarcodeValue3(`KL00${value}`);
    }
    if (selectedLibrary3 === 'Junior High School Library') {
      setBarcodeValue3(`JHSL00${value}`);
    }
    if (selectedLibrary3 === 'Law Library') {
      setBarcodeValue3(`HL00${value}`);
    }
    if (selectedLibrary3 === 'Senior High School Library') {
      setBarcodeValue3(`SHSL00${value}`);
    }
    if (selectedLibrary3 === 'Theology Library') {
      setBarcodeValue3(`TL00${value}`);
    }
  };

  const handleAccessionNumberChange4 = (e) => {
    const value = e.target.value;
    setAccessionNumber4(value);
  
    if (selectedLibrary4 === 'Henry Luce III Library') {
      setBarcodeValue4(`HL00${value}`);
    }
    if (selectedLibrary4 === 'Elementary School Library') {
      setBarcodeValue4(`ESL00${value}`);
    }
    if (selectedLibrary4 === 'Kindergarten Library') {
      setBarcodeValue4(`KL00${value}`);
    }
    if (selectedLibrary4 === 'Junior High School Library') {
      setBarcodeValue4(`JHSL00${value}`);
    }
    if (selectedLibrary4 === 'Law Library') {
      setBarcodeValue4(`HL00${value}`);
    }
    if (selectedLibrary4 === 'Senior High School Library') {
      setBarcodeValue4(`SHSL00${value}`);
    }
    if (selectedLibrary4 === 'Theology Library') {
      setBarcodeValue4(`TL00${value}`);
    }
  }; 

      const [showBackToTop, setShowBackToTop] = useState(false);
      useEffect(() => {
        const handleScroll = () => {
          setShowBackToTop(window.scrollY > 500);
        };
      
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }, []);

  return (
    <Box>

      <Header>
      {(toggleDrawer) => (
        <>
          <TopBar title="Book Card and Book Packet" onMenuClick={toggleDrawer} subtitle="BOOK CARD AND BOOK PACKET"/>
          <div style={{ padding: '20px' }}>
          </div>
          <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Print Preview</DialogTitle>
            <DialogContent>
              <Box
  ref={printRef}
  className="card-grid"
  sx={{
    fontFamily: 'Poppins, sans-serif',
    fontSize: '11pt',
    padding: 0,
    margin: 0,
    height: '960px', // match total printable page height
  }}
>
  {[...Array(4)].map((_, i) => (
    <Box
      key={i}
      className="card"
      sx={{
        border: '1px solid black',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        height: '480px', // fit 2 rows per page
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Typography align="center" fontWeight="bold">
        Central Philippine University
      </Typography>

      {/* Labels */}
      <Box sx={{ mt: 1, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ whiteSpace: 'nowrap' }}>Author:</Typography>
          <Box sx={{ borderBottom: '1px solid black', flexGrow: 1, ml: 1 }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ whiteSpace: 'nowrap' }}>Title:</Typography>
          <Box sx={{ borderBottom: '1px solid black', flexGrow: 1, ml: 1 }} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '48%' }}>
            <Typography sx={{ whiteSpace: 'nowrap' }}>Acc. No.:</Typography>
            <Box sx={{ borderBottom: '1px solid black', flexGrow: 1, ml: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '48%' }}>
            <Typography sx={{ whiteSpace: 'nowrap' }}>Barcode:</Typography>
            <Box sx={{ borderBottom: '1px solid black', flexGrow: 1, ml: 1 }} />
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <Box>
        <table
          width="100%"
          border="1"
          cellPadding="4"
          cellSpacing="0"
          style={{ borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>Date Borrowed/<br />Due Date</th>
              <th>Borrower’s Name</th>
              <th>Borrower’s ID Number</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, rowIdx) => (
              <tr key={rowIdx}>
                <td style={{ height: '24px' }}></td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  ))}
</Box>


              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="contained" onClick={handlePrint}>Print</Button>
                <Button variant="outlined" onClick={() => setPrintModalOpen(false)}>Close</Button>
              </Box>
            </DialogContent>
          </Dialog>

        </>
      )}

      

    </Header>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
          <Grid item xs={12} md={8} lg={3} xl={3}>
          <TextField
            fullWidth
            placeholder="Search by Accession Number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(); // Trigger the search
              }
            }}
            variant="outlined"
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'Times New Roman, serif',
                fontSize: 18,
                height: '1.5em',
              },
              '& .MuiInputBase-root': {
                height: 56,
              },
              '& .MuiInputLabel-root': {
                fontFamily: 'Times New Roman, serif',
                fontSize: 16,
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          </Grid>   
      </Grid>

      {/* Modal for showing results */}
      <Modal open={openModal} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" component="h2" mb={2}>
            Search Results
          </Typography>

          {searchResults.map((result) => (
            <Box
              key={result.id}
              sx={{
                p: 1,
                border: "1px solid #ccc",
                borderRadius: 1,
                mb: 1,
                cursor: "pointer",
                '&:hover': { backgroundColor: '#f0f0f0' },
              }}
              onClick={() => loadSelectedEntry(result)}
            >
              <Typography variant="body1">
                {result.data.accessionNumber1}, {result.data.accessionNumber2}, {result.data.accessionNumber3}, {result.data.accessionNumber4}
              </Typography>
            </Box>
          ))}

          <Button variant="contained" color="primary" onClick={handleClose} sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>

  
    <Grid container spacing={2} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 5 },  pt: { xs: 2, sm: 3, md: 4, lg: 7 }}}>
    <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>

      {/* ---------------------------------------FIRST COLUMN------------------------------------ */}

      {/* Library */}
      <Typography sx={{fontWeight:"light", fontStyle:"italic", pb: { xs: 2, sm: 3, md: 4, lg: 3 }}}>First Column</Typography>
      <Typography fontWeight="bold">Library</Typography>
      <Autocomplete
        options={libraries1}
        freeSolo
        value={selectedLibrary1}
        onChange={handleLibraryChange}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Choose library"
            margin="dense"
            variant="outlined"
            fullWidth
            sx={{ mb: 3}}
          />
        )}
      />

          {/* Section */}
          <Typography fontWeight="bold">Section</Typography>
          <Autocomplete
            options={sections}
            freeSolo
            value={section1}
            onChange={handleSectionChange1}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose section"
                margin="dense"
                variant="outlined"
                fullWidth
                sx={{ mb: 3 }}
              />
            )}
          />

          {/* Author (Publisher) */}
          <Typography fontWeight="bold">Author</Typography>
            <TextField
                  value={authorLastName1}
                  onChange={(e) => setAuthorLastName(e.target.value)}
                  fullWidth
                  label="Last Name"
                  margin="dense"
                  variant="outlined"
                  disabled={publisherAuthor1.trim() !== ""}
                />
                <TextField
                  value={authorFirstName1}
                  onChange={(e) => setAuthorFirstName(e.target.value)}
                  fullWidth
                  label="First Name"
                  margin="dense"
                  variant="outlined"
                  disabled={publisherAuthor1.trim() !== ""}
                />
                <TextField
                  value={authorMiddleInitial1}
                  onChange={(e) => setAuthorMiddleInitial(e.target.value)}
                  fullWidth
                  label="Middle Initial - (*Do not include a dot or period after the Middle Initial letter.)"
                  margin="dense"
                  variant="outlined"
                  disabled={publisherAuthor1.trim() !== ""}
                />
              <TextField
                value={publisherAuthor1}
                onChange={(e) => setPublisherAuthor(e.target.value)}
                fullWidth
                placeholder="Type here if the Author is a Publisher"
                margin="dense"
                variant="outlined"
                helperText="*Type here if the Author is a Publisher."
                disabled={
                  authorLastName1.trim() !== "" ||
                  authorFirstName1.trim() !== "" ||
                  authorMiddleInitial1.trim() !== ""
                }
                sx={{ mb: 3 }}
              />

              {/* Title */}
            <Typography fontWeight="bold">Title</Typography>
              <TextField
                value={bookTitle1}
                onChange={(e) => setBookTitle(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                margin="dense"
                variant="outlined"
                sx={{ mb: 3 }}
              />

              {/* Accession Number */}
            <Typography fontWeight="bold">Accession Number</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }}
              value={accessionNumber1}
              onChange={handleAccessionNumberChange}/>

            {/* Call Number */}
            <Typography fontWeight="bold">Call Number</Typography>
            <TextField
              value={callNumber1}
              onChange={(e) => setCallNumber1(e.target.value)}
              fullWidth
              multiline
              minRows={6}
              margin="dense"
              variant="outlined"
              sx={{ mb: 3 }}
            />

            {/* Copy Number */}
            
            <Typography fontWeight="bold">Copy Number</Typography>
            <Autocomplete
              value={copyNumber1}
              onChange={handleCopyNumChange}
              options={copyNumbers}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 3 }}
                />
              )}
            />
            
            {/* Barcode */}
            <Typography fontWeight="bold">Barcode</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={barcodeValue1}
              label="Barcode are automatically generated"
              onChange={(e) => setBarcodeValue(e.target.value)}/>
            
            {/* ISO Code */}
            <Typography fontWeight="bold">ISO Code</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={isoCodeValue1}
              label="ISO Code are automatically generated"
              onChange={(e) => setIsoCodeValue(e.target.value)}/>                      

    </Grid>
    <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>

    {/* ---------------------------------------SECOND COLUMN------------------------------------ */}

    {/* Library */}
    <Typography sx={{fontWeight:"light", fontStyle:"italic", pb: { xs: 2, sm: 3, md: 4, lg: 3 }}}>Second Column</Typography>
    <Typography fontWeight="bold">Library</Typography>
      <Autocomplete
        options={libraries2}
        freeSolo
        value={selectedLibrary2}
        onChange={handleLibraryChange2}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Choose library"
            margin="dense"
            variant="outlined"
            fullWidth
            sx={{ mb: 3 }}
          />
        )}
      />

          {/* Section */}
          <Typography fontWeight="bold">Section</Typography>
          <Autocomplete
            options={sections}
            freeSolo
            value={section2}
            onChange={handleSectionChange2}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose section"
                margin="dense"
                variant="outlined"
                fullWidth
                sx={{ mb: 3 }}
              />
            )}
          />

          {/* Author (Publisher) */}
          <Typography fontWeight="bold">Author</Typography>
            <TextField value={authorLastName2}
                  onChange={(e) => setAuthorLastName2(e.target.value)}
                  fullWidth
                  label="Last Name"
                  margin="dense"
                  variant="outlined"
                  disabled={publisherAuthor2.trim() !== ""}
                />
                <TextField value={authorFirstName2}
                  onChange={(e) => setAuthorFirstName2(e.target.value)}
                  fullWidth
                  label="First Name"
                  margin="dense"
                  variant="outlined"
                  disabled={publisherAuthor2.trim() !== ""}
                />
                <TextField value={authorMiddleInitial2}
                  onChange={(e) => setAuthorMiddleInitial2(e.target.value)}
                  fullWidth
                  label="Middle Initial - (*Do not include a dot or period after the Middle Initial letter.)"
                  margin="dense"
                  variant="outlined"
                  disabled={publisherAuthor2.trim() !== ""}
                />
              <TextField value={publisherAuthor2}
                onChange={(e) => setPublisherAuthor2(e.target.value)}
                fullWidth
                placeholder="Type here if the Author is a Publisher"
                margin="dense"
                variant="outlined"
                helperText="*Type here if the Author is a Publisher."
                disabled={
                  authorLastName2.trim() !== "" ||
                  authorFirstName2.trim() !== "" ||
                  authorMiddleInitial2.trim() !== ""
                }
                sx={{ mb: 3 }}
              />

              {/* Title */}
            <Typography fontWeight="bold">Title</Typography>
              <TextField
                value={bookTitle2}
                onChange={(e) => setBookTitle2(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                margin="dense"
                variant="outlined"
                sx={{ mb: 3 }}
              />

              {/* Accession Number */}
            <Typography fontWeight="bold">Accession Number</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }}
              value={accessionNumber2}
              onChange={handleAccessionNumberChange2}/>

            {/* Call Number */}
            <Typography fontWeight="bold">Call Number</Typography>
            <TextField
              value={callNumber2}
              onChange={(e) => setCallNumber2(e.target.value)}
              fullWidth
              multiline
              minRows={6}
              margin="dense"
              variant="outlined"
              sx={{ mb: 3 }}
            />

            {/* Copy Number */}
            
            <Typography fontWeight="bold">Copy Number</Typography>
            <Autocomplete
              options={copyNumbers}
              value={copyNumber2}
              onChange={handleCopyNumChange2}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 3 }}
                />
              )}
            />
            
            {/* Barcode */}
            <Typography fontWeight="bold">Barcode</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={barcodeValue2}
              label="Barcode are automatically generated"
              onChange={(e) => setBarcodeValue2(e.target.value)}/>
            
            {/* ISO Code */}
            <Typography fontWeight="bold">ISO Code</Typography>
            <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={isoCodeValue2}
              label="ISO Code are automatically generated"
              onChange={(e) => setIsoCodeValue2(e.target.value)}/> 
    </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 5 },  pt: { xs: 2, sm: 3, md: 4, lg: 7}}}>
        <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
            {/* ---------------------------------------THIRD COLUMN------------------------------------ */}

            {/* Library */}
            <Typography sx={{fontWeight:"light", fontStyle:"italic", pb: { xs: 2, sm: 3, md: 4, lg: 3 }}}>Third Column</Typography>
            <Typography fontWeight="bold">Library</Typography>
            <Autocomplete
              options={libraries3}
              freeSolo
              value={selectedLibrary3}
              onChange={handleLibraryChange3}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Choose library"
                  margin="dense"
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 3 }}
                />
              )}
            />

                {/* Section */}
                <Typography fontWeight="bold">Section</Typography>
                <Autocomplete
                  options={sections}
                  freeSolo
                  value={section3}
                  onChange={handleSectionChange3}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Choose section"
                      margin="dense"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 3 }}
                    />
                  )}
                />

                {/* Author (Publisher) */}
                <Typography fontWeight="bold">Author</Typography>
                  <TextField value={authorLastName3}
                        onChange={(e) => setAuthorLastName3(e.target.value)}
                        fullWidth
                        label="Last Name"
                        margin="dense"
                        variant="outlined"
                        disabled={publisherAuthor3.trim() !== ""}
                      />
                      <TextField value={authorFirstName3}
                        onChange={(e) => setAuthorFirstName3(e.target.value)}
                        fullWidth
                        label="First Name"
                        margin="dense"
                        variant="outlined"
                        disabled={publisherAuthor3.trim() !== ""}
                      />
                      <TextField value={authorMiddleInitial3}
                        onChange={(e) => setAuthorMiddleInitial3(e.target.value)}
                        fullWidth
                        label="Middle Initial - (*Do not include a dot or period after the Middle Initial letter.)"
                        margin="dense"
                        variant="outlined"
                        disabled={publisherAuthor3.trim() !== ""}
                      />
                    <TextField value={publisherAuthor3}
                      onChange={(e) => setPublisherAuthor3(e.target.value)}
                      fullWidth
                      placeholder="Type here if the Author is a Publisher"
                      margin="dense"
                      variant="outlined"
                      helperText="*Type here if the Author is a Publisher."
                      disabled={
                        authorLastName3.trim() !== "" ||
                        authorFirstName3.trim() !== "" ||
                        authorMiddleInitial3.trim() !== ""
                      }
                      sx={{ mb: 3 }}
                    />

                    {/* Title */}
                  <Typography fontWeight="bold">Title</Typography>
                    <TextField
                      value={bookTitle3}
                      onChange={(e) => setBookTitle3(e.target.value)}
                      fullWidth
                      multiline
                      minRows={3}
                      margin="dense"
                      variant="outlined"
                      sx={{ mb: 3 }}
                    />

                    {/* Accession Number */}
                  <Typography fontWeight="bold">Accession Number</Typography>
                  <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }}
                    value={accessionNumber3}
                    onChange={handleAccessionNumberChange3}/>

                  {/* Call Number */}
                  <Typography fontWeight="bold">Call Number</Typography>
                  <TextField
                    value={callNumber3}
                    onChange={(e) => setCallNumber3(e.target.value)}
                    fullWidth
                    multiline
                    minRows={6}
                    margin="dense"
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />

                  {/* Copy Number */}
                  
                  <Typography fontWeight="bold">Copy Number</Typography>
                  <Autocomplete
                    options={copyNumbers}
                    value={copyNumber3}
                    onChange={handleCopyNumChange3}
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 3 }}
                      />
                    )}
                  />
                  
                  {/* Barcode */}
                  <Typography fontWeight="bold">Barcode</Typography>
                  <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={barcodeValue3}
                    label="Barcode are automatically generated"
                    onChange={(e) => setBarcodeValue3(e.target.value)}/>
                  
                  {/* ISO Code */}
                  <Typography fontWeight="bold">ISO Code</Typography>
                  <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={isoCodeValue3}
                    label="ISO Code are automatically generated"
                    onChange={(e) => setIsoCodeValue3(e.target.value)}/> 
        </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3} xl={3}>
          
                  {/* ---------------------------------------FOURTH COLUMN------------------------------------ */}

        {/* Library */}
        <Typography sx={{fontWeight:"light", fontStyle:"italic", pb: { xs: 2, sm: 3, md: 4, lg: 3 }}}>Fourth Column</Typography>
        <Typography fontWeight="bold">Library</Typography>
          <Autocomplete
            options={libraries4}
            freeSolo
            value={selectedLibrary4}
            onChange={handleLibraryChange4}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Choose library"
                margin="dense"
                variant="outlined"
                fullWidth
                sx={{ mb: 3 }}
              />
            )}
          />

              {/* Section */}
              <Typography fontWeight="bold">Section</Typography>
              <Autocomplete
                options={sections}
                freeSolo
                value={section4}
                onChange={handleSectionChange4}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Choose section"
                    margin="dense"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 3 }}
                  />
                )}
              />

              {/* Author (Publisher) */}
              <Typography fontWeight="bold">Author</Typography>
                <TextField value={authorLastName4}
                      onChange={(e) => setAuthorLastName4(e.target.value)}
                      fullWidth
                      label="Last Name"
                      margin="dense"
                      variant="outlined"
                      disabled={publisherAuthor4.trim() !== ""}
                    />
                    <TextField value={authorFirstName4}
                      onChange={(e) => setAuthorFirstName4(e.target.value)}
                      fullWidth
                      label="First Name"
                      margin="dense"
                      variant="outlined"
                      disabled={publisherAuthor4.trim() !== ""}
                    />
                    <TextField value={authorMiddleInitial4}
                      onChange={(e) => setAuthorMiddleInitial4(e.target.value)}
                      fullWidth
                      label="Middle Initial - (*Do not include a dot or period after the Middle Initial letter.)"
                      margin="dense"
                      variant="outlined"
                      disabled={publisherAuthor4.trim() !== ""}
                    />
                  <TextField value={publisherAuthor4}
                    onChange={(e) => setPublisherAuthor4(e.target.value)}
                    fullWidth
                    placeholder="Type here if the Author is a Publisher"
                    margin="dense"
                    variant="outlined"
                    helperText="*Type here if the Author is a Publisher."
                    disabled={
                      authorLastName4.trim() !== "" ||
                      authorFirstName4.trim() !== "" ||
                      authorMiddleInitial4.trim() !== ""
                    }
                    sx={{ mb: 3 }}
                  />

                  {/* Title */}
                <Typography fontWeight="bold">Title</Typography>
                  <TextField
                    value={bookTitle4}
                    onChange={(e) => setBookTitle4(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    margin="dense"
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />

                  {/* Accession Number */}
                <Typography fontWeight="bold">Accession Number</Typography>
                <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }}
                  value={accessionNumber4}
                  onChange={handleAccessionNumberChange4}/>

                {/* Call Number */}
                <Typography fontWeight="bold">Call Number</Typography>
                <TextField
                  value={callNumber4}
                  onChange={(e) => setCallNumber4(e.target.value)}
                  fullWidth
                  multiline
                  minRows={6}
                  margin="dense"
                  variant="outlined"
                  sx={{ mb: 3 }}
                />

                {/* Copy Number */}
                
                <Typography fontWeight="bold">Copy Number</Typography>
                <Autocomplete
                  options={copyNumbers}
                  value={copyNumber4}
                  onChange={handleCopyNumChange4}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="dense"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 3 }}
                    />
                  )}
                />
                
                {/* Barcode */}
                <Typography fontWeight="bold">Barcode</Typography>
                <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={barcodeValue4}
                  label="Barcode are automatically generated"
                  onChange={(e) => setBarcodeValue4(e.target.value)}/>
                
                {/* ISO Code */}
                <Typography fontWeight="bold">ISO Code</Typography>
                <TextField fullWidth margin="dense" variant="outlined" sx={{ mb: 3 }} value={isoCodeValue4}
                  label="ISO Code are automatically generated"
                  onChange={(e) => setIsoCodeValue4(e.target.value)}/> 
        </Grid>
      </Grid> 


      <Grid container spacing={2} 
      sx={{
          px: { xs: 2, sm: 4, md: 8, lg: 10 },  // responsive horizontal padding
          pb: { xs: 4, sm: 6, md: 10, lg: 20},         // responsive bottom padding
          pt: { xs: 2, sm: 3 }
        }}
        justifyContent="center"
        alignItems="center"
      >
        <Button marginright={10}
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          Save entry
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
        >
          Update Entry
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleClear}
        >
          Clear Entry
        </Button>
        
        <Button
        variant="contained"
        color="primary"
        onClick={handleOpenPrint}
        >
          Print Entry
        </Button>    
      </Grid>
      
      {showBackToTop && (
        <IconButton
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            bgcolor: 'primary.main',
            color: '#fff',
            '&:hover': {
              bgcolor: 'primary.dark'
            },
            zIndex: 9999
          }}
        >
          <KeyboardArrowUpIcon />
        </IconButton>
      )}

      {/*<Grid container
          direction="column" 
          alignItems="center"
          textAlign="center"
          sx={{
          px: { xs: 2, sm: 4, md: 8, lg: 10 },  // responsive left/right padding
          pb: { xs: 4, sm: 6, md: 10 },         // responsive bottom padding
          pt: { xs: 1, sm: 2, md: 3 }           // responsive top padding
        }}>
          <Typography fontWeight="bold" fontSize={20} sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }}>Notes:</Typography>
          <Typography fontSize={20} sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }}>*Do not include a dot or period after the Middle Initial letter.</Typography>
          <Typography fontSize={20} sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }}>*Barcode and ISO Code are automatically generated.</Typography>
      </Grid>*/}

      </Box>
  );
}
