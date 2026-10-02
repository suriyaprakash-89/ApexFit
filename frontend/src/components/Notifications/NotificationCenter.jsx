// frontend/src/components/Notifications/NotificationCenter.jsx
// Mounted exactly once (in the top bar); data + realtime come from notificationStore.
import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { formatRelativeTime } from "../../utils/date";
import {
  Bell,
  X,
  Clock,
  Award,
  AlertCircle,
  Calendar,
  TrendingUp,
  Flame,
  Heart,
  Zap,
} from "lucide-react";

const getNotificationStyle = (message = "") => {
  const m = message.toLowerCase();
  if (m.includes("goal") || m.includes("achievement"))
    return { Icon: Award, color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20" };
  if (m.includes("alert") || m.includes("warning"))
    return { Icon: AlertCircle, color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20" };
  if (m.includes("reminder") || m.includes("schedule"))
    return { Icon: Calendar, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20" };
  if (m.includes("step") || m.includes("progress"))
    return { Icon: TrendingUp, color: "text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20" };
  if (m.includes("calorie") || m.includes("burn"))
    return { Icon: Flame, color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20" };
  if (m.includes("heart") || m.includes("health"))
    return { Icon: Heart, color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20" };
  return { Icon: Zap, color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20" };
};

const NotificationCenter = () => {
  const { user } = useAuthStore();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-btn relative"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-0 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 md:max-h-[28rem] flex flex-col bg-white dark:bg-gray-800 md:rounded-2xl shadow-2xl md:border border-gray-200 dark:border-gray-700 z-50 overflow-hidden safe-top md:pt-0 animate-fade-in"
        >
          <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead(user?.id)}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="icon-btn" aria-label="Close notifications">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="p-4 space-y-4" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-full" />
                      <div className="skeleton h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" aria-hidden="true" />
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">You're all caught up</p>
                <p className="text-muted text-xs mt-1">We'll let you know when something important happens.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  const { Icon, color } = getNotificationStyle(notification.message);
                  return (
                    <li key={notification.id}>
                      <button
                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                        className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          !notification.is_read ? "bg-primary-50/60 dark:bg-primary-900/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                              {notification.message}
                            </p>
                            <p className="flex items-center mt-1.5 text-xs text-muted">
                              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <span className="shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2">
                              <span className="sr-only">Unread</span>
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
