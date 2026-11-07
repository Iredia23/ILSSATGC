import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import {
  FiBookOpen, FiMapPin, FiClock, FiPlus, FiAlertTriangle,
  FiRefreshCw, FiCalendar
} from "react-icons/fi";

const REFRESH_INTERVAL = 30000;
const LEVEL_COLORS = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];

const ExamOfficerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data.stats);
      setError(null);
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError("Could not load dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const levelBreakdown = stats?.levelBreakdown || {};
  const levelEntries = Object.entries(levelBreakdown);

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <h1 style={styles.title}>Exam Officer Dashboard</h1>
        <p style={styles.subtitle}>Welcome back, {user?.fullName || "Exam Officer"}</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading stats...</div>
      ) : error ? (
        <div style={styles.errorBanner}>
          <FiAlertTriangle size={16} style={{ marginRight: 8 }} />
          <span>{error}</span>
          <button onClick={fetchStats} style={styles.retryBtn}>Retry</button>
        </div>
      ) : (
        <>
          <div className="stats-grid" style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statIcon}><FiBookOpen size={32} /></span>
              <div>
                <div style={styles.statValue}>{stats?.totalCourses ?? 0}</div>
                <div style={styles.statLabel}>Total Courses</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statIcon}><FiMapPin size={32} /></span>
              <div>
                <div style={styles.statValue}>{stats?.totalVenues ?? 0}</div>
                <div style={styles.statLabel}>Venues</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statIcon}><FiClock size={32} /></span>
              <div>
                <div style={styles.statValue}>{stats?.totalTimeSlots ?? 0}</div>
                <div style={styles.statLabel}>Time Slots</div>
              </div>
            </div>
          </div>

          {levelEntries.length > 0 && (
            <div style={styles.breakdownSection}>
              <h3 style={styles.breakdownTitle}>Courses by Level</h3>
              <div className="breakdown-grid" style={styles.breakdownGrid}>
                {levelEntries.map(([level, count], i) => (
                  <div key={level} style={{ ...styles.levelCard, borderLeft: `4px solid ${LEVEL_COLORS[i % LEVEL_COLORS.length]}` }}>
                    <div style={styles.levelName}>{level}</div>
                    <div style={styles.levelCount}>{count} courses</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={styles.refreshRow}>
        <span style={styles.refreshText}>
          {stats ? `Last updated: ${new Date().toLocaleTimeString()}` : ""}
        </span>
        <button onClick={fetchStats} style={styles.refreshBtn}>
          <FiRefreshCw size={12} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      <div style={styles.welcomeCard}>
        <h2 style={styles.welcomeTitle}>Exam Officer Portal</h2>
        <p style={styles.welcomeText}>
          Manage the course catalog — create and edit courses for each level and semester.
        </p>
      </div>

      <h2 style={styles.sectionTitle}>Quick Actions</h2>
      <div className="actions-grid" style={styles.actionsGrid}>
        {[
          { label: "Create Course", icon: <FiPlus size={24} />, link: "/app/courses", color: "#2ecc71" },
          { label: "View All Courses", icon: <FiBookOpen size={24} />, link: "/app/courses", color: "#3498db" },
          { label: "My Teaching Lectures", icon: <FiCalendar size={24} />, link: "/app/lecturer-dashboard", color: "#f39c12" },
          { label: "Venues", icon: <FiMapPin size={24} />, link: "/app/venues", color: "#e74c3c" },
          { label: "Time Slots", icon: <FiClock size={24} />, link: "/app/timeslots", color: "#9b59b6" },
        ].map((action) => (
          <Link to={action.link} key={action.label} style={styles.actionCard}>
            <div style={{ ...styles.actionIcon, backgroundColor: `${action.color}15`, color: action.color }}>
              {action.icon}
            </div>
            <span style={styles.actionLabel}>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "16px", color: "#666", margin: 0 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "12px" },
  statCard: { display: "flex", alignItems: "center", gap: "16px", padding: "20px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee", textDecoration: "none", color: "inherit" },
  statIcon: { display: "flex", alignItems: "center" },
  statValue: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  statLabel: { fontSize: "13px", color: "#888" },
  errorBanner: { display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderRadius: "12px", background: "#fff5f5", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px", marginBottom: "16px" },
  retryBtn: { padding: "6px 14px", borderRadius: "6px", border: "1px solid #c62828", background: "#fff", color: "#c62828", fontSize: "12px", cursor: "pointer", fontWeight: "600" },
  refreshRow: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginBottom: "24px" },
  refreshText: { fontSize: "12px", color: "#94a3b8" },
  refreshBtn: { padding: "4px 10px", borderRadius: "6px", border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center" },
  breakdownSection: { marginBottom: "24px" },
  breakdownTitle: { fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "12px" },
  breakdownGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" },
  levelCard: { padding: "16px", borderRadius: "10px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #eee" },
  levelName: { fontSize: "14px", fontWeight: "700", color: "#1a1a2e" },
  levelCount: { fontSize: "12px", color: "#666", marginTop: "4px" },
  welcomeCard: { padding: "24px 32px", background: "linear-gradient(135deg, #27ae60, #2ecc71)", borderRadius: "12px", color: "#fff", marginBottom: "32px" },
  welcomeTitle: { fontSize: "22px", fontWeight: "600", margin: "0 0 8px" },
  welcomeText: { fontSize: "15px", opacity: 0.85, margin: 0, lineHeight: "1.5" },
  sectionTitle: { fontSize: "20px", fontWeight: "600", color: "#333", marginBottom: "16px" },
  actionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" },
  actionCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "24px 16px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee", textDecoration: "none", color: "#333", cursor: "pointer" },
  actionIcon: { width: "56px", height: "56px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: "14px", fontWeight: "600", textAlign: "center" },
};

export default ExamOfficerDashboard;
