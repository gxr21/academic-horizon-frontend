import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "./AuthContext";
import { notificationsAPI } from "../lib/api";
import { connectSocket } from "../lib/socket";
import { getToken } from "../lib/authStorage";

const NotificationContext = createContext(null);

// Data that may have changed when something happens on the server.
// Invalidating these makes every open page (dashboards, admin panel, chat, services)
// refresh itself right away instead of waiting for a manual reload.
const LIVE_QUERY_KEYS = [
  'orders',
  'orderFiles',
  'adminStats',
  'adminUsers',
  'adminOrders',
  'adminConversations',
  'adminServices',
  'adminReports',
  'adminProfileChanges',
  'adminFinance',
  'providerWallet',
  'services',
];

const TOAST_DURATION_MS = 6000;
const FALLBACK_REFRESH_MS = 60 * 1000;

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const seenIds = useRef(new Set());

  const refreshLiveData = useCallback(() => {
    LIVE_QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  }, [queryClient]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      const list = res.data?.notifications || [];
      list.forEach((n) => seenIds.current.add(n.id));
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load notifications + listen for real-time pushes while logged in
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setToasts([]);
      seenIds.current = new Set();
      return undefined;
    }

    const token = getToken();
    if (!token) return undefined;

    loadNotifications();

    const socket = connectSocket(token);

    const handleNotification = (notification) => {
      if (seenIds.current.has(notification.id)) return;
      seenIds.current.add(notification.id);

      setNotifications((prev) => [notification, ...prev]);
      setToasts((prev) => [...prev, notification].slice(-4));
      setTimeout(() => dismissToast(notification.id), TOAST_DURATION_MS);
      refreshLiveData();
    };

    // After a reconnect we may have missed pushes — resync
    const handleConnect = () => {
      loadNotifications();
      refreshLiveData();
    };

    socket.on('notification', handleNotification);
    socket.on('connect', handleConnect);

    // Safety net in case the socket is blocked/unavailable
    const interval = setInterval(() => {
      loadNotifications();
    }, FALLBACK_REFRESH_MS);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('connect', handleConnect);
      clearInterval(interval);
    };
  }, [isAuthenticated, user?.id, loadNotifications, refreshLiveData, dismissToast]);

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    try {
      await notificationsAPI.markRead(notificationId);
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsAPI.markAllRead();
    } catch (err) {
      console.warn('Failed to mark notifications as read:', err.message);
    }
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      await notificationsAPI.remove(notificationId);
    } catch (err) {
      console.warn('Failed to delete notification:', err.message);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await notificationsAPI.clearAll();
    } catch (err) {
      console.warn('Failed to clear notifications:', err.message);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    // Notifications are per-user on the server, so these ignore the id they receive
    // (kept so existing components keep working).
    getUserNotifications: () => notifications,
    getUnreadCount: () => unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refresh: loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Pop-up toasts for new real-time notifications */}
      <div className="fixed top-4 left-4 z-[100] flex flex-col gap-3 w-80 max-w-[90vw]" dir="rtl">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white border-r-4 border-academic-gold shadow-2xl rounded-xl p-4 cursor-pointer"
            onClick={() => dismissToast(toast.id)}
            role="status"
          >
            <p className="font-bold text-academic-blue text-sm mb-1">{toast.title}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export default NotificationContext;
