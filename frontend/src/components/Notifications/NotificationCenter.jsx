// frontend/src/components/Notifications/NotificationCenter.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { 
  Bell, 
  X, 
  Clock, 
  CheckCircle, 
  Award,
  AlertCircle,
  Calendar,
  TrendingUp,
  Flame,
  Heart,
  Zap
} from "lucide-react";

const NotificationCenter = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const subscription = setupRealtime();
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [user]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtime = () => {
    try {
      const subscription = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return subscription;
    } catch (error) {
      console.error("Error setting up realtime:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in('id', unreadIds)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('goal') || lowerMessage.includes('achievement')) {
      return Award;
    }
    if (lowerMessage.includes('alert') || lowerMessage.includes('warning')) {
      return AlertCircle;
    }
    if (lowerMessage.includes('reminder') || lowerMessage.includes('schedule')) {
      return Calendar;
    }
    if (lowerMessage.includes('step') || lowerMessage.includes('progress')) {
      return TrendingUp;
    }
    if (lowerMessage.includes('calorie') || lowerMessage.includes('burn')) {
      return Flame;
    }
    if (lowerMessage.includes('heart') || lowerMessage.includes('health')) {
      return Heart;
    }
    return Zap;
  };

  const getNotificationColor = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('goal') || lowerMessage.includes('achievement')) {
      return "text-green-500 bg-green-100 dark:bg-green-900/20";
    }
    if (lowerMessage.includes('alert') || lowerMessage.includes('warning')) {
      return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20";
    }
    if (lowerMessage.includes('reminder') || lowerMessage.includes('schedule')) {
      return "text-blue-500 bg-blue-100 dark:bg-blue-900/20";
    }
    return "text-purple-500 bg-purple-100 dark:bg-purple-900/20";
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMs = now - notificationTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 w-full max-h-screen md:max-h-96 bg-white dark:bg-gray-800 md:rounded-xl rounded-none shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto h-full">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No notifications yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.message);
                const colorClass = getNotificationColor(notification.message);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${
                      !notification.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2">
                          <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Read status indicator */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;