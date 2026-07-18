// src/api/suppliesApi.js
//
// Brands are shared/centralized with Equipment — getBrands/createBrand here
// just call the same /api/brands endpoint, so a brand added from either
// module shows up in both dropdowns.

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const client = axios.create({ baseURL: BASE_URL });

export const getSupplies = () => client.get('/supplies/grouped').then((r) => r.data);

export const createSupply = (payload) =>
  client.post('/supplies', payload).then((r) => r.data);

export const updateSupply = (id, payload) =>
  client.put(`/supplies/${id}`, payload).then((r) => r.data);

export const deleteSupply = (id, user) =>
  client.delete(`/supplies/${id}`, { data: { user } }).then((r) => r.data);

// Named `addStock` (not `addSupplyStock`) to match SuppliesEncode.js's import.
export const addStock = (id, additionalQuantity, user) =>
  client
    .post(`/supplies/${id}/add-stock`, { additionalQuantity, user })
    .then((r) => r.data);

export const addStockToLocation = (payload) =>
  client.post('/supplies/add-stock', payload).then((r) => r.data);

export const transferSupply = (sourceRowId, { destinationLocation, quantity, user }) =>
  client.post(`/supplies/${sourceRowId}/transfer`, { destinationLocation, quantity, user }).then((r) => r.data);

export const sendSupply = (id, payload) =>
  client.post(`/supplies/${id}/send`, payload).then((r) => r.data);

export const getSupplyTransactions = () =>
  client.get('/supply-transactions').then((r) => r.data);

export const getSuppliesDashboardSummary = () =>
  client.get('/supplies/dashboard/summary').then((r) => r.data);

// Shared/centralized with Equipment (same /api/brands endpoint).
export const getBrands = () => client.get('/brands').then((r) => r.data);

export const createBrand = (brandName) =>
  client.post('/brands', { brandName }).then((r) => r.data);

export default client;