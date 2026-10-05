import { useState, useRef, useEffect } from "react";
import PropTypes from 'prop-types';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

const academicFont = 'Tajawal';

/**
 * Where a notification should take the user when clicked.
 */
const defaultNavigate = (notification, role, navigate) => {
  const { type, orderId } = notification;

  if (type === 'new_service') {
    navigate(role === 'student' ? '/services' : '/dashboard');
    return;
  }
  if (role === 'provider' && type === 'new_order') {
    navigate('/dashboard');
    return;
  }
  if (role === 'admin' && (type === 'order_submitted' || type === 'new_user')) {
    navigate('/admin');
    return;
  }
  if (orderId) {
    navigate('/chat', { state: { orderId } });
  }
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return new Date(iso).toLocaleDateString('ar-EG');
};

/**
 * Notification bell with unread badge + dropdown list.
 * `onSelect(notification)` can override the default navigation (used by the admin panel
 * to switch tabs instead of changing the route).
 */
const NotificationBell = ({ onSelect, align = 'left', iconClassName = 'text-academic-blue hover:text-academic-gold' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleClick = (notification) => {
    if (!notification.read) markAsRead(notification.id);
    setIsOpen(false);
    if (onSelect) {
      onSelect(notification);
    } else {
      defaultNavigate(notification, user?.role, navigate);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`relative transition-colors duration-300 focus:outline-none ${iconClassName}`}
        aria-label="الإشعارات"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-right`} dir="rtl">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-academic-blue" style={{ fontFamily: academicFont }}>الإشعارات</h3>
            {notifications.length > 0 && (
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-academic-blue hover:text-academic-gold transition-colors">
                    تحديد الكل كمقروء
                  </button>
                )}
                <button onClick={clearAllNotifications} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                  مسح الكل
                </button>
              </div>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">لا توجد إشعارات</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0"></span>}
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-semibold mb-1">{notification.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{notification.message}</p>
                      <span className="text-xs text-academic-gold mt-2 block">{timeAgo(notification.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

NotificationBell.propTypes = {
  onSelect: PropTypes.func,
  align: PropTypes.oneOf(['left', 'right']),
  iconClassName: PropTypes.string,
};

export default NotificationBell;
