import axios from 'axios';

// Global Axios Configuration
axios.defaults.withCredentials = true;

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
      // Check if we are already on the login page to avoid infinite reloads
      const isAuthPath = window.location.pathname === '/' || error.config.url?.includes('/auth/login');
      
      if (!isAuthPath) {
        console.warn("Unauthorized request detected. Clearing session and redirecting to login.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
