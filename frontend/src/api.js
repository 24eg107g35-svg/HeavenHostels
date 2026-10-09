import axios from 'axios';

const api = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined'
    ? ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? `${window.location.protocol}//${window.location.hostname}:8080`
      : window.location.origin
    : 'http://localhost:8080'
);

axios.interceptors.request.use((config) => {
  const publicRoute = /\/api\/(auth\/(login|register|refresh|send-otp|verify-otp|reset-password)|students\/(studentlogin|studentregistration))$/.test(config.url || '');
  if (publicRoute) return config;
  const token = localStorage.getItem('Token');
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

export default api;