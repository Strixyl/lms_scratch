// src/api/equipmentApi.js
//
// Single place for every HTTP call the Equipment module makes.
// If your backend already exists under a different base path, just
// change BASE_URL below — nothing else needs to change.

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const client = axios.create({ baseURL: BASE_URL });

// ---------- Assets ----------
export const getAssets = () => client.get('/equipment').then((r) => r.data);

export const createAsset = (payload) =>
  client.post('/equipment', payload).then((r) => r.data);

export const updateAsset = (id, payload) =>
  client.put(`/equipment/${id}`, payload).then((r) => r.data);

export const deleteAsset = (id) =>
  client.delete(`/equipment/${id}`).then((r) => r.data);

// Adds quantity to an existing asset instead of creating a duplicate row
export const addStock = (id, additionalQuantity, user) =>
  client
    .post(`/equipment/${id}/add-stock`, { additionalQuantity, user })
    .then((r) => r.data);

// Deducts quantity from an asset and transfers it to a destination section
export const sendAsset = (id, payload) =>
  client.post(`/equipment/${id}/send`, payload).then((r) => r.data);

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