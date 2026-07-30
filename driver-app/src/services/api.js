import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const driverAPI = {
  getDashboard: () => api.get('/driver/dashboard'),
  sendDetection: (data) => api.post('/driver/detection', data),
  startSession: () => api.post('/driver/session/start'),
  endSession: () => api.post('/driver/session/end'),
  getSessions: () => api.get('/driver/sessions'),
};

export const alertAPI = {
  getAlerts: () => api.get('/alerts'),
  acknowledgeAlert: (id) => api.put(`/alerts/${id}/acknowledge`),
};

export default api;
