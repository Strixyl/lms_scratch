// equipment constants and inventory stock thresholds

// university theme colors
export const THEME = {
  navy: '#1b0892',
  gold: '#c9a227',
  danger: '#c62828',
  font: 'Poppins, sans-serif',
};

// physical room and shelf locations
export const LOCATION_OPTIONS = [
  'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
  'Office', 'Storage Room',
];

// target library sections for asset transfer
export const SECTION_OPTIONS = [
  'General Library',
  'Elementary Library',
  'Senior High School Library',
  'Graduate Library',
];

// low stock indicator threshold
export const LOW_STOCK_THRESHOLD = 4;

// status derived from quantity count
export const getStockStatus = (quantity) => {
  const qty = Number(quantity) || 0;
  if (qty <= 0) return 'Out of Stock';
  return 'In Stock';
};

export const statusColor = (status) => {
  switch (status) {
    case 'In Stock':
      return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
    case 'Out of Stock':
    default:
      return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' };
  }
};

export const emptyAssetForm = {
  itemName: '',
  brand: '',
  brandOption: '', // custom brand input flag
  quantity: '',
  location: '',
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