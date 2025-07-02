// src/services/axiosInstance.js
import axios from 'axios';
import { refreshToken } from './authService';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// ✅ Export đúng hàm setupInterceptors
export const setupInterceptors = (getAccessToken, setAccessToken) => {
  axiosInstance.interceptors.request.use(config => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    res => res,
    async err => {
      const originalRequest = err.config;
      if (err.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const data = await refreshToken();
          setAccessToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return axiosInstance(originalRequest);
        } catch {
          setAccessToken(null);
          window.location.href = '/login';
        }
      }
      return Promise.reject(err);
    }
  );
};

export default axiosInstance;