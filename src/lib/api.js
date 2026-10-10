import axios from 'axios';
import { clearAuthSession, getToken } from './authStorage.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap & error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401 || (status === 403 && data?.error?.code === 'ACCOUNT_RESTRICTED')) {
        const requestUrl = String(error.config?.url || '');
        const isLoginOrRegister =
          requestUrl.includes('/api/auth/login') ||
          requestUrl.includes('/api/auth/register') ||
          requestUrl.includes('/api/auth/google');

        if (!isLoginOrRegister) {
          clearAuthSession();
          if (status === 403 && data?.error?.message) {
            sessionStorage.setItem('authError', data.error.message);
          }
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
        }
      }

      const apiError = new Error(
        data?.error?.message || data?.message || 'An error occurred'
      );
      apiError.code = data?.error?.code || 'UNKNOWN_ERROR';
      apiError.status = status;
      apiError.data = data;
      return Promise.reject(apiError);
    }

    const networkError = new Error('Network error — please check your connection');
    networkError.code = 'NETWORK_ERROR';
    return Promise.reject(networkError);
  }
);

// ─── Auth API ───────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  google: (data) => api.post('/api/auth/google', data),
  getMe: () => api.get('/api/auth/me'),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  verifyResetToken: (token) =>
    api.get('/api/auth/reset-password/verify', { params: { token } }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
};

// ─── User API ───────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.patch('/api/user/profile', data),
  getPublicProfile: (userId) => api.get(`/api/user/${userId}/public`),
  upgradeSubscription: (subscriptionType) =>
    api.post('/api/user/upgrade', { subscriptionType }),
  updatePublicKey: (publicKey) =>
    api.post('/api/user/public-key', { publicKey }),
  getPublicKey: (userId) => api.get(`/api/user/${userId}/public-key`),
  // Admin endpoints
  getAllUsers: (params) => api.get('/api/user', { params }),
  deleteUser: (userId) => api.delete(`/api/user/${userId}`),
};

// ─── Orders API ─────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/api/orders', data),
  getAll: (params) => api.get('/api/orders', { params }),
  getById: (id) => api.get(`/api/orders/${id}`),
  // Provider takes an incoming (pending, unassigned) order
  accept: (id) => api.post(`/api/orders/${id}/accept`),
  updateStatus: (id, status, note) =>
    api.patch(`/api/orders/${id}/status`, note ? { status, note } : { status }),
  assignProvider: (id, providerId) =>
    api.patch(`/api/orders/${id}/assign`, { providerId }),
};

// ─── Services (catalog) API ─────────────────────────────
export const servicesAPI = {
  // Public: active services
  getAll: () => api.get('/api/services'),
  // Admin
  getAllAdmin: () => api.get('/api/services/all'),
  create: (data) => api.post('/api/services', data),
  update: (id, data) => api.patch(`/api/services/${id}`, data),
  remove: (id) => api.delete(`/api/services/${id}`),
};

// ─── Notifications API ──────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get('/api/notifications'),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
  remove: (id) => api.delete(`/api/notifications/${id}`),
  clearAll: () => api.delete('/api/notifications'),
};

// ─── Chat API ───────────────────────────────────────────
export const chatAPI = {
  // Admin public keys — every message's AES key is also wrapped for them (safety review)
  getAdminKeys: () => api.get('/api/chat/admin-keys'),
  getMessages: (orderId, params) =>
    api.get(`/api/chat/rooms/${orderId}`, { params }),
  sendMessage: (orderId, data) =>
    api.post(`/api/chat/rooms/${orderId}/messages`, data),
};

// ─── Files API ──────────────────────────────────────────
export const filesAPI = {
  upload: (orderId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/files/upload/${orderId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },
  download: (fileId) =>
    api.get(`/api/files/${fileId}/download`, { responseType: 'blob' }),
  getOrderFiles: (orderId) => api.get(`/api/files/order/${orderId}`),
};

/**
 * Download an order file (authenticated) and hand it to the browser as a save-as.
 */
export const downloadOrderFile = async (file) => {
  const blob = await filesAPI.download(file.id);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.originalName || 'file';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Admin API ───────────────────────────────────────────
export const adminAPI = {
  // Dashboard counters (students, providers, completed orders, awaiting review, ...)
  getStats: () => api.get('/api/admin/stats'),
  // Users
  getUsers: (params) => api.get('/api/admin/users', { params }),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  createProvider: (data) => api.post('/api/admin/providers', data),
  // Orders (admin view). `status` can be a comma-separated list, e.g. "completed,delivered"
  getAllOrders: (params) => api.get('/api/admin/orders', { params }),
  // Conversations (admin view)
  getConversations: () => api.get('/api/admin/conversations'),
  // Read-only messages of one conversation (still encrypted; decrypted in the admin's browser)
  getConversationMessages: (orderId) => api.get(`/api/admin/conversations/${orderId}/messages`),
  // Review a submitted order: approve → delivered, or send back → in_progress (with a note)
  reviewOrder: (orderId, status, note) =>
    api.patch(`/api/orders/${orderId}/status`, note ? { status, note } : { status }),
  // Permanently delete an order (with its messages and files)
  deleteOrder: (orderId) => api.delete(`/api/admin/orders/${orderId}`),
  // Student reports from providers
  getReports: (params) => api.get('/api/admin/reports', { params }),
  reviewReport: (reportId, data) => api.patch(`/api/admin/reports/${reportId}`, data),
  // Restrict / unrestrict a student
  restrictUser: (userId, data) => api.patch(`/api/admin/users/${userId}/restrict`, data),
  unrestrictUser: (userId) => api.patch(`/api/admin/users/${userId}/unrestrict`),
  updateUser: (userId, data) => api.patch(`/api/admin/users/${userId}`, data),
  getProfileChanges: (params) => api.get('/api/admin/profile-changes', { params }),
  reviewProfileChange: (id, data) => api.patch(`/api/admin/profile-changes/${id}`, data),
  getFinance: () => api.get('/api/wallet/admin'),
  updateCommission: (commissionPercent) =>
    api.patch('/api/wallet/admin/commission', { commissionPercent }),
  reviewWithdrawal: (id, data) => api.patch(`/api/wallet/admin/withdrawals/${id}`, data),
  revealWithdrawalCard: (id) => api.get(`/api/wallet/admin/withdrawals/${id}/card`),
};

export const walletAPI = {
  getMine: () => api.get('/api/wallet/me'),
  requestWithdrawal: (data) => api.post('/api/wallet/withdrawals', data),
};

export const profileChangesAPI = {
  create: (formData) =>
    api.post('/api/profile-changes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  mine: () => api.get('/api/profile-changes/mine'),
  downloadDocument: (requestId, index) =>
    api.get(`/api/profile-changes/${requestId}/documents/${index}`, { responseType: 'blob' }),
};

// ─── Reports API (providers) ─────────────────────────────────
export const reportsAPI = {
  create: (data) => api.post('/api/reports', data),
  getForOrder: (orderId) => api.get(`/api/reports/order/${orderId}`),
};

export default api;
