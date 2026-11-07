import React from "react";
import { FiZap, FiMapPin, FiCalendar, FiClock, FiX } from "react-icons/fi";

const AiSuggestionBanner = ({ suggestions, loading, summary, onApply, onDismiss }) => {
  if (loading) {
    return (
      <div style={styles.banner}>
        <div style={styles.header}>
          <span style={styles.icon}><FiZap size={20} /></span>
          <span style={styles.title}>AI Analyzing Schedule...</span>
        </div>
        <div style={styles.body}>
          <div style={styles.loadingBar}>
            <div style={styles.loadingFill} />
          </div>
          <p style={styles.loadingText}>Analyzing unscheduled courses, available slots, and constraints...</p>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={styles.icon}><FiZap size={20} /></span>
          <span style={styles.title}>AI Schedule Suggestions</span>
        </div>
        <button onClick={onDismiss} style={styles.dismissBtn}><FiX size={14} /></button>
      </div>

      {(summary || suggestions?.summary) && (
        <p style={styles.summary}>{summary || suggestions.summary}</p>
      )}

      <div style={styles.suggestionsList}>
        {suggestions.map((s, i) => (
          <div key={i} style={styles.suggestionCard}>
            <div style={styles.suggestionHeader}>
              <span style={styles.courseCode}>{s.courseCode}</span>
              <span style={styles.badge}>Suggested</span>
            </div>
            <p style={styles.courseTitle}>{s.courseTitle}</p>
            <div style={styles.details}>
              <span style={styles.detailItem}><FiMapPin size={12} style={{ marginRight: 4 }} /> {s.venue}</span>
              <span style={styles.detailItem}><FiCalendar size={12} style={{ marginRight: 4 }} /> {s.day}</span>
              <span style={styles.detailItem}><FiClock size={12} style={{ marginRight: 4 }} /> {s.time}</span>
            </div>
            <p style={styles.reason}>{s.reason}</p>
            {onApply && (
              <button
                onClick={() => onApply(s)}
                style={styles.applyBtn}
              >
                Apply This
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  banner: {
    background: "linear-gradient(135deg, #e8f4fd, #f0fdf4)",
    borderRadius: "12px",
    border: "1px solid #bbf7d0",
    padding: "16px 20px",
    marginBottom: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  icon: { fontSize: "20px" },
  title: { fontWeight: "600", fontSize: "15px", color: "#1a1a2e" },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "#999",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
  },
  summary: {
    fontSize: "14px",
    color: "#555",
    margin: "0 0 12px",
    lineHeight: "1.5",
  },
  suggestionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  suggestionCard: {
    background: "#fff",
    borderRadius: "10px",
    padding: "14px 16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #e0e0e0",
  },
  suggestionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  courseCode: {
    fontWeight: "700",
    fontSize: "15px",
    color: "#0f3460",
  },
  badge: {
    padding: "2px 8px",
    borderRadius: "12px",
    background: "#bbf7d0",
    color: "#166534",
    fontSize: "11px",
    fontWeight: "600",
  },
  courseTitle: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 8px",
  },
  details: {
    display: "flex",
    gap: "16px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  detailItem: {
    fontSize: "12px",
    color: "#555",
  },
  reason: {
    fontSize: "12px",
    color: "#888",
    margin: "0 0 10px",
    fontStyle: "italic",
    lineHeight: "1.4",
  },
  applyBtn: {
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    background: "#0f3460",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  loadingBar: {
    height: "4px",
    background: "#e0e0e0",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  loadingFill: {
    height: "100%",
    width: "60%",
    background: "linear-gradient(90deg, #4285f4, #34a853)",
    borderRadius: "2px",
    animation: "shimmer 1.5s infinite",
  },
  loadingText: {
    fontSize: "13px",
    color: "#888",
    margin: 0,
  },
};

export default AiSuggestionBanner;
