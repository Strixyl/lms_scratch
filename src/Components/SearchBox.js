import {
    Grid,
    Box,
    Typography,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText
  } from "@mui/material";
  import React, { useState } from "react";
  import Header from '../Components/Header';
  import TopBar from '../Components/TopBar';
  import { Autocomplete } from "@mui/material";
  import { auth, db } from "../firebase";
  import { collection, addDoc, getDocs, query, where, doc, updateDoc, getFirestore } from "firebase/firestore";
  import { eventWrapper } from "@testing-library/user-event/dist/utils";

    const db = getFirestore();

    function SearchComponent() {
        const [searchQuery, setSearchQuery] = useState("");
        const [searchResults, setSearchResults] = useState([]);
      
        const handleSearch = async () => {
          if (!searchQuery.trim()) {
            alert("Enter the accession number.");
            return;
          }
      
          try {
            const colRef = collection(db, "cardandpacket");
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
          } catch (error) {
            console.error("Search error:", error);
            alert("Something went wrong while searching!");
          }
        };
    }
        export default SearchComponent;