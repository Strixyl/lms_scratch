import React from 'react';

const PageHeader = ({ title }) => {
  return (
    <h1 style={{
      color: '#1b0892',
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '20px'
    }}>
      {title}
    </h1>
  );
};

export default PageHeader;
