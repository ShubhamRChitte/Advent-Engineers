import axios from 'axios';

// Global Axios Configuration
axios.defaults.withCredentials = true;
let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// In production (Electron build), use the same origin as the frontend
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  baseURL = `${window.location.origin}/api`;
}

// Auto-append /api if it's missing from the production environment variable
if (baseURL && !baseURL.endsWith('/api')) {
  baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`;
}

axios.defaults.baseURL = baseURL;


// Request Interceptor: Inject Token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthPath = error.config.url?.includes('/auth/login');

      if (!isAuthPath) {
        console.warn("Unauthorized request detected. Clearing session and redirecting to login.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('session-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
