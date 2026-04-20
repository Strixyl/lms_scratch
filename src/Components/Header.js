import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemText, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Header = ({ children }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();


  const toggleDrawer = () => setOpen(!open);

  const menuItems = [
    { text: 'HOME', path: '/' },
    { text: 'HLL LOGIN', path: '/login' },
    { text: 'LOGIN RECORDS', path: '/logindata' },
    { text: 'SATISFACTION SURVEY', path: '/satisfaction-survey' },
    { text: 'SURVEY RECORDS', path: '/surveys' },
    { text: 'CARD AND PACKET', path: '/card-and-packet' },
    { text: 'BIBLIOGRAPHY', path: '/bibliography' },
    { text: 'SUPPLIES', path: '/supplies' },
    { text: 'SUPPLIES ENCODING', path: '/supplies-encoding' },
    { text: 'EQUIPMENT', path: '/equipment' },
    { text: 'EQUIPMENT ENCODING', path: '/equipment-encoding' },

  ];


  return (
    <>
      {children(toggleDrawer)}
      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List>
            {menuItems.map((item, index) => (
              <ListItem button key={index} onClick={() => { navigate(item.path); setOpen(false); }}>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
