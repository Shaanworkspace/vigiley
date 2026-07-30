import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 75000,
});

let loadingCallbacks = [];
export const onLoadingChange = (cb) => { loadingCallbacks.push(cb); return () => { loadingCallbacks = loadingCallbacks.filter(c => c !== cb); }; };
const notifyLoading = (val) => loadingCallbacks.forEach(cb => cb(val));

let activeRequests = 0;
let hideTimer = null;

api.interceptors.request.use((config) => {
  if (!config._noLoading && activeRequests === 0) notifyLoading(true);
  activeRequests++;
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => notifyLoading(false), 300);
    }
    return response;
  },
  (error) => {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => notifyLoading(false), 300);
    }
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
  getDashboard: () => api.get('/driver/dashboard', { _noLoading: true }),
  sendDetection: (data) => api.post('/driver/detection', data, { _noLoading: true }),
  startSession: () => api.post('/driver/session/start'),
  endSession: () => api.post('/driver/session/end'),
  getSessions: () => api.get('/driver/sessions', { _noLoading: true }),
};

export const alertAPI = {
  getAlerts: () => api.get('/alerts', { _noLoading: true }),
  acknowledgeAlert: (id) => api.put(`/alerts/${id}/acknowledge`, null, { _noLoading: true }),
};

export default api;
