import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDrivers: () => api.get('/admin/drivers'),
  getDriverDetail: (id) => api.get(`/admin/drivers/${id}`),
  getAlerts: (params) => api.get('/admin/alerts', { params }),
  acknowledgeAlert: (id) => api.put(`/admin/alerts/${id}/acknowledge`),
  getReportSummary: (params) => api.get('/reports/summary', { params }),
  getDriverReport: (id) => api.get(`/reports/driver/${id}`),
};

export default api;
