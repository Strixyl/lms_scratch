// equipment api endpoints
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const client = axios.create({ baseURL: BASE_URL });

// assets
export const getAssets = () => client.get('/equipment/grouped').then((r) => r.data);

export const getFlatAssets = () => client.get('/equipment').then((r) => r.data);

export const createAsset = (payload) =>
  client.post('/equipment', payload).then((r) => r.data);

export const updateAsset = (id, payload) =>
  client.put(`/equipment/${id}`, payload).then((r) => r.data);

export const deleteAsset = (id) =>
  client.delete(`/equipment/${id}`).then((r) => r.data);

export const sendAsset = (id, payload) =>
  client.post(`/equipment/${id}/send`, payload).then((r) => r.data);

// add stock for a location
export const addStockToLocation = (payload) =>
  client.post('/equipment/stock-to-location', payload).then((r) => r.data);

export const addStock = (payload) =>
  client.post('/equipment/add-stock', payload).then((r) => r.data);

// transfer stock between locations
export const transferAsset = (sourceRowId, { destinationLocation, quantity, user, takenBy }) =>
  client.post(`/equipment/${sourceRowId}/transfer`, { destinationLocation, quantity, user, takenBy }).then((r) => r.data);

// brands
export const getBrands = () => client.get('/equipment/brands').then((r) => r.data);
export const getEquipmentItemNames = () => client.get('/equipment/item-names').then((r) => r.data);

export const createBrand = (brandName) =>
  client.post('/brands', { brandName }).then((r) => r.data);

// sections
export const getSections = () => client.get('/sections').then((r) => r.data);

// transactions
export const getTransactions = (params = {}) =>
  client.get('/transactions', { params }).then((r) => r.data);

// dashboard stats
export const getDashboardSummary = () =>
  client.get('/dashboard/summary').then((r) => r.data);

export default client;