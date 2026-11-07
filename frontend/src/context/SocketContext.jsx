import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { showInfo } from "../utils/toast.js";
import { FiUserPlus } from "react-icons/fi";
import api from "../utils/api.js";

const POLL_INTERVAL = 30000; // 30 seconds

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastPollRef = useRef(null);

  // Poll for notifications
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const since = lastPollRef.current;
        const params = since ? { since } : {};
        const res = await api.get("/notifications", { params });
        const newNotifs = res.data.notifications || [];

        if (newNotifs.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const unique = newNotifs.filter((n) => !existingIds.has(n.id));
            if (unique.length > 0) {
              setUnreadCount((prev) => prev + unique.filter((n) => !n.read).length);
              // Show toast for new user registrations
              unique.forEach((n) => {
                if (n.type === "new-user" && n.user) {
                  showInfo(`New user registered: ${n.user.fullName}`, {
                    duration: 6000,
                    icon: <FiUserPlus size={16} />,
                  });
                }
              });
            }
            return [...unique, ...prev];
          });
        }

        if (newNotifs.length > 0) {
          lastPollRef.current = new Date().toISOString();
        } else if (!lastPollRef.current) {
          lastPollRef.current = new Date().toISOString();
        }
      } catch (err) {
        // Silently handle - will retry on next poll
        console.error("Notification poll failed:", err);
      }
    };

    // Initial fetch
    const initialFetch = setTimeout(fetchNotifications, 2000);

    // Set up polling interval
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [isAuthenticated, token]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.put("/notifications/read");
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.delete("/notifications");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  }, []);

  const value = {
    socket: null,
    connected,
    notifications,
    unreadCount,
    markAllRead,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
