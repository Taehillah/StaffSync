import api from './api';

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