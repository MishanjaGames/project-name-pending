import axios from 'axios';
import { getToken, removeToken } from './utils';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4040/api',
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
