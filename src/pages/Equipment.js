import React from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const Equipment = () => {
    return (
        <Header>
          {(toggleDrawer) => (
            <>
              <TopBar title="Library Equipment" onMenuClick={toggleDrawer} subtitle="LIBRARY EQUIPMENT"/>
              <div style={{ padding: '20px' }}>
                {/* Page content here */}
              </div>
            </>
          )}
        </Header>
      );
};

export default Equipment;
