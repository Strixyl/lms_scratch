// src/api/equipmentApi.js
//
// Single place for every HTTP call the Equipment module makes.
// If your backend already exists under a different base path, just
// change BASE_URL below — nothing else needs to change.

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const client = axios.create({ baseURL: BASE_URL });

// ---------- Assets ----------
// GET /api/equipment now returns grouped+nested shape (see backend below)
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

// Replaces the old row-id addStock — works at (profile, location) level, creates the row if needed
export const addStockToLocation = (payload) =>
  client.post('/equipment/stock-to-location', payload).then((r) => r.data);

export const addStock = (payload) =>
  client.post('/equipment/add-stock', payload).then((r) => r.data);

// sourceRowId = the specific Locations[].Id you're deducting from
export const transferAsset = (sourceRowId, { destinationLocation, quantity, user }) =>
  client.post(`/equipment/${sourceRowId}/transfer`, { destinationLocation, quantity, user }).then((r) => r.data);

// ---------- Brands ----------
export const getBrands = () => client.get('/brands').then((r) => r.data);

export const createBrand = (brandName) =>
  client.post('/brands', { brandName }).then((r) => r.data);

// ---------- Sections ----------
export const getSections = () => client.get('/sections').then((r) => r.data);

// ---------- Transactions ----------
export const getTransactions = (params = {}) =>
  client.get('/transactions', { params }).then((r) => r.data);

// ---------- Dashboard ----------
export const getDashboardSummary = () =>
  client.get('/dashboard/summary').then((r) => r.data);

export default client;