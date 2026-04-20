import React from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const Bibliography = () => {
    return (
        <Header>
          {(toggleDrawer) => (
            <>
              <TopBar title="Bibliography" onMenuClick={toggleDrawer} subtitle="BIBLIOGRAPHY"/>
              <div style={{ padding: '20px' }}>
                {/* Page content here */}
              </div>
            </>
          )}
        </Header>
      );
};
export default Bibliography;
