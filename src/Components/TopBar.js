import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import cpulogo from '../assets/cpulogo.png';
import henryluce from '../assets/henryluce.png';

const TopBar = ({ onMenuClick, subtitle }) => {
  return (
    <AppBar position="static" style={{ backgroundColor: '#d49f1e', width: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', padding: '0 10px', margin: '15px 10px 15px'}}>
        {/* Hamburger Menu */}
        <IconButton edge="start" color="inherit" onClick={onMenuClick} sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>

        {/* CPU Logo */}
        <Box component="img" src={cpulogo} alt="CPU Logo" sx={{ height: 60, marginRight: 0 }} />

        {/* Centered Text */}
        <Box sx={{ flexGrow: 1, textAlign: 'center', color: 'black', fontWeight: 'bold'}}>
          <Typography variant="body1" fontFamily='Poppins, sans-serif' fontSize='15px'>CENTRAL PHILIPPINE UNIVERSITY</Typography>
          <Typography variant="body1" fontFamily='Poppins, sans-serif' fontSize='15px'>UNIVERSITY LIBRARIES</Typography>
          <Typography variant="body1" fontFamily='Poppins, sans-serif' fontSize='15px'>{subtitle}</Typography>
        </Box>

        {/* Henry Luce Library Logo */}
        <Box component="img" src={henryluce} alt="Library Logo" sx={{ height: 60, marginLeft: 0}} />
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
