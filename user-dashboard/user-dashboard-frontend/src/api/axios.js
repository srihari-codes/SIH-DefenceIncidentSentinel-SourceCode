/**
 * Axios Instance Configuration
 * Uses HttpOnly cookies for authentication (set by Auth Service)
 */

import axios from 'axios';
import { API_CONFIG, HTTP_STATUS } from '../utils/constants';

// Create axios instance with base URL from environment
export const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true, // CRITICAL: Send cookies with every request
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Response Interceptor - Handle errors and redirect on auth failure
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized - Session expired, cookies invalid
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      // Redirect to Auth Service login
      window.location.href = `${API_CONFIG.AUTH_SERVICE_URL}/login`;
      return Promise.reject(error);
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

export default axiosInstance;