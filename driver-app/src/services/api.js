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
let wakePromise = null;

const wakeUp = async () => {
  if (waking) return wakePromise;
  waking = true;
  wakePromise = axios.get(`${BASE_URL}/wake-up`, { timeout: 55000 })
    .then(() => { waking = false; })
    .catch(() => { waking = false; });
  return wakePromise;
};

api.interceptors.request.use(async (config) => {
  if (activeRequests === 0) {
    notifyLoading(true);
    await wakeUp();
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
