import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true
});

// Add a request interceptor to inject the token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401s
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Clearing session...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/'; // Force redirect to login
    }
    return Promise.reject(error);
  }
);

export default instance;
