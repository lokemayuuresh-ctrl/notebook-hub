export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
