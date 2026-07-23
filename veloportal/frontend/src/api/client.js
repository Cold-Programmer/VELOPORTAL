import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://veloportal.vercel.app',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('veloportal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surfaces 401/403 responses as a global "why can't I do this" popup instead of a
// silent failure or a raw console error. See components/PermissionModal.jsx.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message;
    const url = err.config?.url || '';
    // The login/register endpoints return 401/400 for wrong credentials —
    // that's not an expired session, it's just a failed login attempt, and
    // showing a "your session expired" popup on top of the page's own
    // "invalid email or password" message was confusing and looked like a
    // second, unrelated bug.
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 403) {
      window.dispatchEvent(new CustomEvent('veloportal:permission-denied', {
        detail: { message: message || "You don't have permission to do that with your current role." },
      }));
    } else if (status === 401 && !isAuthEndpoint && localStorage.getItem('veloportal_token')) {
      window.dispatchEvent(new CustomEvent('veloportal:permission-denied', {
        detail: { message: 'Your session has expired. Please sign in again.' },
      }));
      localStorage.removeItem('veloportal_token');
    }
    return Promise.reject(err);
  }
);

export default api;
