import axios from 'axios';
import { API_ROUTES } from '../config/apiRoutes';

// Create a configured axios instance
// Base URL handles both local dev and potential production relative paths
const apiClient = axios.create({
    baseURL: 'http://localhost:3002/api', // Hardcoded for dev environment safety as per current codebase
    timeout: 10000, // 10s timeout
    withCredentials: true, // Maintain cookie support for backward compatibility
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token & Log
apiClient.interceptors.request.use(
    (config) => {
        // Log request for debugging
        console.log(`[API Req] ${config.method?.toUpperCase()} ${config.url}`);

        const token = localStorage.getItem('authToken'); // We will ensure Login saves this

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        console.error("[API Req Error]", error);
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 & Errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Log detailed error for debugging
        if (error.response) {
            console.error(`[API Res Error] ${error.response.status} - ${error.config.url}`, error.response.data);

            if (error.response.status === 401) {
                console.error("Unauthorized access - Session expired or invalid token");
                // window.location.href = '/login'; // Optional: Redirect to login
            }
            if (error.response.status === 404) {
                console.error(`[API 404] Route not found: ${error.config.url}`);
            }
        } else if (error.request) {
            console.error("[API No Response]", error.request);
        } else {
            console.error("[API Setup Error]", error.message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
