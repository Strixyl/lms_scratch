import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import SatisfactionSurvey from './pages/SatisfactionSurvey';
import CardAndPacket from './pages/CardAndPacket';
import BookCatalogue from './pages/BookCatalogue';
import Supplies from './pages/Supplies';
import Equipment from './pages/Equipment';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import EquipmentEncode from './pages/EquipmentEncode';
import SuppliesEncode from './pages/SuppliesEncode';
import LoginData from './pages/LoginData';
import SatisfactionSurveyData from './pages/SatisfactionSurveyData';
import SentimentDashboard from './pages/SentimentDashboard';
import SendAsset from './pages/Sendasset';
import TransactionHistory from './pages/Transactionhistory';
import SendSupply from './pages/SendSupply';
import SupplyTransactionHistory from './pages/SupplyTransactionHistory';

const theme = createTheme({
  typography: {
    fontFamily: 'Times New Roman, serif',
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontFamily: 'Times New Roman, serif',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'Times New Roman, serif',
        },
      },
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logindata" element={<LoginData />} />
            <Route path="/satisfaction-survey" element={<SatisfactionSurvey />} />
            <Route path="/surveys" element={<SatisfactionSurveyData />} />
            <Route path="/card-and-packet" element={<CardAndPacket />} />
            <Route path="/book-catalogue" element={<BookCatalogue />} />
            <Route path="/bookcatalogue" element={<BookCatalogue />} />
            <Route path="/BookCatalogue" element={<BookCatalogue />} />
            <Route path="/supplies" element={<Supplies />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/equipment-encoding" element={<EquipmentEncode />} />
            <Route path="/supplies-encoding" element={<SuppliesEncode />} />
            <Route path="/sentiment-dashboard" element={<SentimentDashboard />} />
            <Route path="/send-asset" element={<SendAsset />} />
            <Route path="/transactions" element={<TransactionHistory />} />
            <Route path="/send-supply" element={<SendSupply />} />
            <Route path="/supply-transactions" element={<SupplyTransactionHistory />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;