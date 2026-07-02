// src/api/axiosInstance.js
import axios from 'axios';
import Swal from 'sweetalert2';


// Base URL setup
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || 
                  sessionStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add custom headers if needed
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // For multipart/form-data requests
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    console.log(`API Call: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Success: ${response.config.url}`, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error
    console.error(`API Error: ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token') || 
                           sessionStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (response.data.access) {
            // Store new tokens
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh || refreshToken);
            
            // Update authorization header
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            
            // Retry original request
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session=expired';
        }
      }
    }
    
    // Handle 403 Forbidden - Vendor not allowed
    if (error.response?.status === 403) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to access this resource.',
        timer: 3000
      });
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('Resource not found:', error.config.url);
    }
    
    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'Something went wrong on our server. Please try again later.',
        timer: 3000
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;