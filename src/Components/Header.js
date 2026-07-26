import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Header = ({ children }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => setOpen(!open);

  const menuItems = [
    { text: 'HOME', path: '/' },
    { text: 'HLL LOGIN', path: '/login' },
    { text: 'LOGIN RECORDS', path: '/logindata' },
    { text: 'LOGIN DASHBOARD', path: '/login-dashboard' },
    { text: 'SATISFACTION SURVEY', path: '/satisfaction-survey' },
    { text: 'SURVEY RECORDS', path: '/surveys' },
    { text: 'SENTIMENT DASHBOARD', path: '/sentiment-dashboard' },
    { text: 'CARD AND PACKET', path: '/card-and-packet' },
    { text: 'BOOK CATALOGUE', path: '/book-catalogue' },
    { text: 'SUPPLIES', path: '/supplies' },
    { text: 'SUPPLIES ENCODING', path: '/supplies-encoding' },
    { text: 'EQUIPMENT', path: '/equipment' },
    { text: 'EQUIPMENT ENCODING', path: '/equipment-encoding' },
  ];

  return (
    <>
      {/* 🚀 HYBRID SAFE CHECK: 
        If children is a function, execute it with toggleDrawer.
        Otherwise, just render the children normally. 
      */}
      {typeof children === 'function' ? children(toggleDrawer) : children}

      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List>
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                >
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;