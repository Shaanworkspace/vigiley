import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 65000,
});

let loadingCallbacks = [];
export const onLoadingChange = (cb) => { loadingCallbacks.push(cb); return () => { loadingCallbacks = loadingCallbacks.filter(c => c !== cb); }; };
const notifyLoading = (val) => loadingCallbacks.forEach(cb => cb(val));

let activeRequests = 0;
let waking = false;

const wakeUp = async () => {
  if (waking) return;
  waking = true;
  try {
    await axios.get(`${BASE_URL}/wake-up`, { timeout: 55000 });
  } catch (_) {}
  waking = false;
};

api.interceptors.request.use(async (config) => {
  if (activeRequests === 0) {
    notifyLoading(true);
    wakeUp();
  }
  activeRequests++;
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests <= 0) { activeRequests = 0; notifyLoading(false); }
    return response;
  },
  (error) => {
    activeRequests--;
    if (activeRequests <= 0) { activeRequests = 0; notifyLoading(false); }
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
