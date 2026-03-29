/**
 * API Configuration
 * Axios instance with base URL and interceptors. Error messages via getApiErrorMessage.
 */
import axios from 'axios';
import { API_BASE_URL_DEFAULT, API_TIMEOUT_MS } from '../constants';
import { getApiErrorMessage } from '../utils/apiError';

const API_BASE_URL = import.meta.env.VITE_API_URL || API_BASE_URL_DEFAULT;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: API_TIMEOUT_MS,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
            console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
            console.log('✅ API Response:', response.config.url, response.status);
        }

        return response.data;
    },
    (error) => {
        const message = getApiErrorMessage(error);
        if (import.meta.env.DEV) {
            console.error('❌ API Error:', {
                url: error.config?.url,
                status: error.response?.status,
                message,
            });
        }
        
        if (error.response?.status === 401) {
            // Graceful 401 handling:
            // Only clear auth and redirect if a token was actually sent and rejected as invalid/expired.
            const hasAuthHeader = error.config && error.config.headers && error.config.headers.Authorization;
            if (hasAuthHeader) {
                localStorage.removeItem('authToken');
                // Also remove other potential user context keys
                localStorage.removeItem('user'); 
                
                // Prevent infinite loop if already on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(new Error(message));
    }
);

export default api;
