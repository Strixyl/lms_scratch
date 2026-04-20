import React from 'react';
import Header from '../Components/Header';
import TopBar from '../Components/TopBar';

const Supplies = () => {
    return (
        <Header>
          {(toggleDrawer) => (
            <>
              <TopBar title="Office Supplies" onMenuClick={toggleDrawer} subtitle="OFFICE SUPPLIES"/>
              <div style={{ padding: '20px' }}>
                {/* Page content here */}
              </div>
            </>
          )}
        </Header>
      );
};

export default Supplies;
