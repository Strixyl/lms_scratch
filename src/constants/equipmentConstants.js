// src/constants/equipmentConstants.js

// University theme (kept consistent with existing pages)
export const THEME = {
  navy: '#1b0892',
  gold: '#c9a227',
  danger: '#c62828',
  font: 'Poppins, sans-serif',
};

// Where an asset physically lives / can be encoded to
export const LOCATION_OPTIONS = [
  'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
  'Office', 'Storage Room',
];

// Sections/departments assets can be transferred TO (Send Asset module)
export const SECTION_OPTIONS = [
  'General Library',
  'Elementary Library',
  'Senior High School Library',
  'Graduate Library',
];

// Below this quantity (and above 0) an item is flagged "Low Stock"
export const LOW_STOCK_THRESHOLD = 4;

// Status is DERIVED from quantity, not hand-picked, so it can never
// drift out of sync with the real inventory count.
export const getStockStatus = (quantity) => {
  const qty = Number(quantity) || 0;
  if (qty <= 0) return 'Out of Stock';
  if (qty < 5) return 'Low Stock';
  return 'In Stock';
};

export const statusColor = (status) => {
  switch (status) {
    case 'In Stock':
      return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
    case 'Low Stock':
      return { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' };
    case 'Out of Stock':
    default:
      return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' };
  }
};

export const emptyAssetForm = {
  itemName: '',
  brand: '',
  brandOption: '',   // holds the <Select> value ('__new__' when "Others" chosen)
  quantity: '',
  serialNumber: '',
  location: '',
  description: '',
  specifications: '',
};

export const TRANSACTION_ACTIONS = {
  ADD_ASSET: 'Added Asset',
  ADD_STOCK: 'Added Stock',
  ADD_STOCK_NEW_LOC: 'Added Stock (New Location)',
  SEND_ASSET: 'Sent Asset',
  LOCATION_TRANSFER: 'Location Transfer',
  UPDATE_ASSET: 'Updated Asset',
  DELETE_ASSET: 'Deleted Asset',
};