import axios from 'axios';
import { getToken, removeToken } from './utils';

// REACT_APP_API_URL is baked at build time with the correct http/https URL
// based on USE_HTTPS in .env — no runtime transformation needed.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4040/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
