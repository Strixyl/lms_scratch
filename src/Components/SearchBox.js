import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

function SearchComponent() {
  // eslint-disable-next-line no-unused-vars
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [searchResults, setSearchResults] = useState([]);

  // eslint-disable-next-line no-unused-vars
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