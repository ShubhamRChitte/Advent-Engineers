/**
 * Centralized API Route Definitions
 * Single source of truth for all API endpoints.
 */

export const API_ROUTES = {
    // Base API Prefix can be handled in axios baseURL, but we can also be explicit here
    // BASE: '/api', 

    HEALTH: '/health',

    // Core Testing & Failures
    FAILED_CORES: '/failed-cores',
    FAILED_CORES_COUNT: '/failed-cores/count',
    FAILED_CORE_BY_ORDER: (orderId: string) => `/failed-cores/order/${orderId}`,

    // Orders
    CREATE_ORDER: '/create-order',
    APPROVE_ORDER: (orderId: string) => `/orders/${orderId}/approve`,
    REASSIGN_ORDER: (orderId: string) => `/orders/${orderId}/reassign`,
    UPDATE_ORDER: (orderId: string) => `/orders/${orderId}`,
    GET_ORDER_BY_ID: (orderId: string) => `/orders/${orderId}`, // Assumed generic get

    // Transformers
    TRANSFORMERS: '/transformers',

    // Auth
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
};
