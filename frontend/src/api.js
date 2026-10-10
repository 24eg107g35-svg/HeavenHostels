import axios from 'axios';

// Ternary-based environment detection: local vs production
const isLocal = typeof window !== 'undefined'
  ? ['localhost', '127.0.0.1'].includes(window.location.hostname)
  : import.meta.env.DEV;

const defaultUrl = isLocal 
  ? 'http://localhost:8080' 
  : 'https://heavenhostels.onrender.com';

const rawApi = import.meta.env.VITE_API_URL || defaultUrl;
const api = rawApi.replace(/\/+$/, '');

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