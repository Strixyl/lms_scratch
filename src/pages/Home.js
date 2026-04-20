import React from "react";
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const Home = () => {

  return (
    <Header>
          {(toggleDrawer) => (
            <>
              <TopBar title="Home" onMenuClick={toggleDrawer} subtitle={"HENRY LUCE III LIBRARY MANAGEMENT APP"}/>
              <div style={{
                padding: '20px',
                minHeight: 'calc(80vh - 64px)'
              }}>
                {/* Welcome message or content goes here */}
                <h2>Welcome to the Henry Luce III Library Management App</h2>
                <p>This is your dashboard. Use the menu to navigate.</p>
              </div>
            </>
          )}
    </Header>
  );
};

export default Home;
