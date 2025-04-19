import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

export const logAction = async (action, payload) => {
  return api.post('/audit-logs', {
    action,
    ...payload,
    timestamp: new Date().toISOString()
  });
};

export const getLogs = async (params) => {
  return api.get('/audit-logs', { params });
};