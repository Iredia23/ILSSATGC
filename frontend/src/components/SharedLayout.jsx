import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import AiAssistant from "./AiAssistant.jsx";
import logo from "../futminna logo.png";
import {
  FiHome, FiUsers, FiBookOpen, FiMapPin, FiClock, FiFileText,
  FiEdit3, FiCalendar, FiBell, FiLogOut, FiGrid,
  FiMenu, FiX,
} from "react-icons/fi";

const formatTime = (timestamp) => {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const navByRole = {
  Admin: [
    { to: "/app", label: "Dashboard", icon: <FiHome size={20} /> },
    { to: "/app/users", label: "Staff", icon: <FiUsers size={20} /> },
    { to: "/app/schools-departments", label: "Schools & Depts", icon: <FiGrid size={20} /> },
    { to: "/app/courses", label: "Courses", icon: <FiBookOpen size={20} /> },
    { to: "/app/venues", label: "Venues", icon: <FiMapPin size={20} /> },
    { to: "/app/timeslots", label: "Session Hours", icon: <FiClock size={20} /> },
    { to: "/app/reports", label: "Reports", icon: <FiFileText size={20} /> },
  ],
  HOD: [
    { to: "/app", label: "Dashboard", icon: <FiHome size={20} /> },
    { to: "/app/allocation", label: "Course Allocation", icon: <FiEdit3 size={20} /> },
    { to: "/app/courses", label: "Courses", icon: <FiBookOpen size={20} /> },
    { to: "/app/schedule", label: "Schedule", icon: <FiCalendar size={20} /> },
    { to: "/app/reports", label: "Reports", icon: <FiFileText size={20} /> },
    { to: "/app/lecturer-dashboard", label: "My Lectures", icon: <FiCalendar size={20} /> },
  ],
  "Exam Officer": [
    { to: "/app", label: "Dashboard", icon: <FiHome size={20} /> },
    { to: "/app/courses", label: "Courses", icon: <FiBookOpen size={20} /> },
    { to: "/app/venues", label: "Venues", icon: <FiMapPin size={20} /> },
    { to: "/app/reports", label: "Reports", icon: <FiFileText size={20} /> },
    { to: "/app/lecturer-dashboard", label: "My Lectures", icon: <FiCalendar size={20} /> },
  ],
  "Timetable Officer": [
    { to: "/app", label: "Dashboard", icon: <FiHome size={20} /> },
    { to: "/app/schedule", label: "Schedule Planning", icon: <FiCalendar size={20} /> },
    { to: "/app/timeslots", label: "Session Hours", icon: <FiClock size={20} /> },
    { to: "/app/courses", label: "Courses", icon: <FiBookOpen size={20} /> },
    { to: "/app/venues", label: "Venues", icon: <FiMapPin size={20} /> },
    { to: "/app/reports", label: "Reports", icon: <FiFileText size={20} /> },
    { to: "/app/lecturer-dashboard", label: "My Lectures", icon: <FiCalendar size={20} /> },
  ],
  Lecturer: [
    { to: "/app", label: "My Schedule", icon: <FiCalendar size={20} /> },
  ],
};

const SharedLayout = () => {
  const { user, logout } = useAuth();
  const { connected, notifications, unreadCount, markAllRead, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifRef = useRef(null);
  const navItems = navByRole[user?.role] || [];

  const closeSidebar = () => setSidebarOpen(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-layout" style={styles.layout}>
      {/* Hamburger toggle — visible only on mobile */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={styles.hamburger}
        aria-label="Toggle sidebar"
      >
        <span style={styles.hamburgerIcon}>{sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}</span>
      </button>

      {/* Sidebar overlay — visible on mobile when open */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        style={styles.overlay}
        onClick={closeSidebar}
      />

      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`} style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <img src={logo} alt="FUT Minna Logo" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }} />
          <div>
            <div style={styles.logoText}>FUT Minna</div>
            <div style={styles.logoSub}>Staff Dashboard</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              onClick={closeSidebar}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Notification Bell */}
        <div ref={notifRef} style={styles.notifContainer}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) markAllRead();
            }}
            style={styles.notifBell}
            title={connected ? "Connected" : "Disconnected"}
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span style={styles.notifBadge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <span
              style={{
                ...styles.connectionDot,
                background: connected ? "#10b981" : "#ef4444",
              }}
            />
          </button>

          {showNotifications && (
            <div style={styles.notifDropdown}>
              <div style={styles.notifHeader}>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} style={styles.clearBtn}>
                    Clear all
                  </button>
                )}
              </div>
              <div style={styles.notifList}>
                {notifications.length === 0 ? (
                  <div style={styles.notifEmpty}>No notifications yet</div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        ...styles.notifItem,
                        background: n.read ? "transparent" : "rgba(16, 185, 129, 0.08)",
                      }}
                    >
                      <div style={styles.notifDot} />
                      <div style={{ flex: 1 }}>
                        <div style={styles.notifMessage}>{n.message}</div>
                        <div style={styles.notifTime}>{formatTime(n.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.fullName?.charAt(0) || "U"}</div>
            <div>
              <div style={styles.userName}>{user?.fullName}</div>
              <div style={styles.userRole}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}><FiLogOut size={14} style={{ marginRight: 6 }} /> Logout</button>
        </div>
      </aside>

      <main className="app-main" style={styles.main}>
        <Outlet />
      </main>

      {/* AI Assistant — floating chatbot on every page */}
      <AiAssistant />
    </div>
  );
};

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#f5f6fa" },
  sidebar: {
    width: "260px",
    background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },

  logoText: { fontSize: "18px", fontWeight: "700" },
  logoSub: { fontSize: "11px", opacity: 0.6 },
  nav: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.15s",
  },
  navLinkActive: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: "600",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  userInfo: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  userName: { fontSize: "14px", fontWeight: "600" },
  userRole: { fontSize: "11px", opacity: 0.6 },
  logoutBtn: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  main: { marginLeft: "260px", flex: 1, minHeight: "100vh" },
  hamburger: {
    display: "none",
    position: "fixed",
    top: "12px",
    right: "12px",
    zIndex: 200,
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    border: "none",
    background: "#1a1a2e",
    color: "#fff",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
  },
  hamburgerIcon: { fontSize: "20px" },
  overlay: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 99,
  },
  notifContainer: {
    position: "relative",
    padding: "8px 20px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  notifBell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.15s",
  },
  notifBadge: {
    position: "absolute",
    top: "2px",
    right: "4px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "700",
    minWidth: "18px",
    height: "18px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  connectionDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginLeft: "auto",
  },
  notifDropdown: {
    position: "absolute",
    bottom: "100%",
    left: "12px",
    right: "12px",
    background: "#1e293b",
    borderRadius: "10px",
    boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
    maxHeight: "320px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 200,
    marginBottom: "8px",
  },
  notifHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "12px",
    cursor: "pointer",
  },
  notifList: {
    overflowY: "auto",
    maxHeight: "260px",
  },
  notifEmpty: {
    padding: "24px 14px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
  },
  notifItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    cursor: "default",
  },
  notifDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    marginTop: "5px",
    flexShrink: 0,
  },
  notifMessage: {
    fontSize: "13px",
    color: "#e2e8f0",
    lineHeight: "1.4",
  },
  notifTime: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "3px",
  },
};

export default SharedLayout;
