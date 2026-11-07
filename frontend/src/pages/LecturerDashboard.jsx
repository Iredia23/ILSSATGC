import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import { exportToCSV } from "../utils/helpers.js";
import { showSuccess, showWarning } from "../utils/toast.js";
import { FiList, FiCalendar, FiInbox, FiBookOpen, FiDownload, FiPrinter, FiClock } from "react-icons/fi";

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState("1st Semester");
  const [view, setView] = useState("table");

  useEffect(() => {
    if (user?.id) {
      fetchSchedule();
    }
  }, [user, semester]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const params = semester ? { semester } : {};
      const res = await api.get(`/assignments/lecturer/${user.id}/schedule`, { params });
      setSchedule(res.data.schedule || []);
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (schedule.length === 0) {
      showWarning("No scheduled lectures to export");
      return;
    }

    const exportData = schedule.map((s) => ({
      "Course Code": s.courseCode,
      "Course Title": s.courseTitle,
      "Day": s.dayOfWeek,
      "Start Time": s.startTime,
      "End Time": s.endTime,
      "Venue": s.venue,
      "Credits": s.creditUnits,
      "Semester": semester,
      "Session Description": s.description || "",
    }));

    exportToCSV(exportData, `FUTMinna_Lecturer_Schedule_${user?.fullName?.replace(/\s+/g, "_")}_${semester}.csv`);
    showSuccess("Lecture schedule exported to CSV!");
  };

  const totalCredits = schedule.reduce((acc, curr) => acc + (curr.creditUnits || 0), 0);
  const totalSessions = schedule.length;

  return (
    <div className="page" style={styles.page}>
      {/* Lecturer Profile Banner Header */}
      <div style={styles.profileHeaderCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={styles.badgeRow}>
              {user?.school ? <span style={styles.schoolPill}>{user.school}</span> : null}
              {user?.department ? <span style={styles.deptPill}>{user.department}</span> : null}
              <span style={styles.rolePill}>{user?.role || "Lecturer"}</span>
            </div>
            <h1 style={styles.lecturerTitle}>Welcome back, {user?.fullName || "Lecturer"}</h1>
            {user?.department || user?.school ? (
              <p style={styles.lecturerSubtitle}>
                {[user?.department ? `Department of ${user.department}` : null, user?.school || null]
                  .filter(Boolean)
                  .join(" — ")}
              </p>
            ) : null}
          </div>

          {/* Quick Workload Summary Pills */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ background: "rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#60a5fa" }}>{totalSessions}</div>
              <div style={{ fontSize: "11px", color: "#cbd5e1", textTransform: "uppercase", fontWeight: "600" }}>Weekly Sessions</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", padding: "12px 18px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#34d399" }}>{totalCredits}</div>
              <div style={{ fontSize: "11px", color: "#cbd5e1", textTransform: "uppercase", fontWeight: "600" }}>Credit Units</div>
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar" style={styles.toolbar}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            style={styles.select}
          >
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
          </select>

          <div style={styles.viewToggle}>
            <button
              onClick={() => setView("table")}
              style={{
                ...styles.viewBtn,
                ...(view === "table" ? styles.viewBtnActive : {}),
              }}
            >
              <FiList size={14} style={{ marginRight: 6 }} /> Table View
            </button>
            <button
              onClick={() => setView("calendar")}
              style={{
                ...styles.viewBtn,
                ...(view === "calendar" ? styles.viewBtnActive : {}),
              }}
            >
              <FiCalendar size={14} style={{ marginRight: 6 }} /> Calendar Grid
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleExportCSV} style={{ ...styles.secondaryBtn, display: "flex", alignItems: "center", gap: "6px" }}>
            <FiDownload size={14} /> Export CSV
          </button>
          <button onClick={() => window.print()} style={{ ...styles.secondaryBtn, display: "flex", alignItems: "center", gap: "6px" }}>
            <FiPrinter size={14} /> Print
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading your personal lecture schedule...</div>
      ) : schedule.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}><FiInbox size={48} color="#94a3b8" /></p>
          <h3 style={{ color: "#1e293b", margin: "8px 0" }}>No courses assigned for {semester}</h3>
          <p style={{ color: "#64748b" }}>Contact your Head of Department ({user?.department}) for course allocation.</p>
        </div>
      ) : view === "table" ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Course Code</th>
                <th style={styles.th}>Course Title</th>
                <th style={styles.th}>Venue</th>
                <th style={styles.th}>Day</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Credits</th>
                <th style={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s, i) => (
                <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}><strong>{s.courseCode}</strong></td>
                  <td style={styles.td}>{s.courseTitle}</td>
                  <td style={styles.td}>{s.venue}</td>
                  <td style={styles.td}>{s.dayOfWeek}</td>
                  <td style={styles.td}>{s.startTime} – {s.endTime}</td>
                  <td style={styles.td}>{s.creditUnits}</td>
                  <td style={styles.td}>{s.description ? <em>{s.description}</em> : <span style={{ color: "#aaa" }}>None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.calendarGrid}>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
            <div key={day} style={styles.dayColumn}>
              <div style={styles.dayHeader}>{day}</div>
              {schedule
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => a.startTime?.localeCompare(b.startTime))
                .map((s, i) => (
                  <div key={i} style={styles.event}>
                    <strong style={{ color: "#0f3460" }}>{s.courseCode}</strong>
                    <span style={styles.eventTime}>{s.startTime} – {s.endTime}</span>
                    <span style={styles.eventVenue}>{s.venue}</span>
                    {s.description && (
                      <span style={{ fontSize: "11px", color: "#15803d", fontStyle: "italic", marginTop: "2px" }}>
                        📝 {s.description}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
  profileHeaderCard: {
    background: "linear-gradient(135deg, #0f3460 0%, #16213e 100%)",
    color: "#fff",
    borderRadius: "16px",
    padding: "24px 32px",
    marginBottom: "24px",
    boxShadow: "0 10px 25px -5px rgba(15, 52, 96, 0.25)",
  },
  badgeRow: { display: "flex", gap: "8px", marginBottom: "12px" },
  schoolPill: { background: "rgba(255, 255, 255, 0.15)", color: "#93c5fd", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", border: "1px solid rgba(255, 255, 255, 0.2)" },
  deptPill: { background: "rgba(255, 255, 255, 0.2)", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  rolePill: { background: "#e67e22", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  lecturerTitle: { fontSize: "26px", fontWeight: "800", margin: "0 0 6px", color: "#fff" },
  lecturerSubtitle: { fontSize: "14px", color: "#cbd5e1", margin: 0 },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", background: "#fff" },
  viewToggle: { display: "flex", gap: "4px" },
  viewBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center" },
  viewBtnActive: { background: "#0f3460", color: "#fff", borderColor: "#0f3460" },
  secondaryBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  loading: { textAlign: "center", padding: "40px", color: "#64748b" },
  empty: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" },
  emptyIcon: { margin: "0 0 12px" },
  tableContainer: { borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto", background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "14px 16px", textAlign: "left", fontWeight: "700", fontSize: "12px", color: "#64748b", borderBottom: "1px solid #e2e8f0", textTransform: "uppercase", background: "#f8fafc" },
  td: { padding: "14px 16px", fontSize: "14px", color: "#334155" },
  trEven: { background: "#fff" },
  trOdd: { background: "#f8fafc" },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  dayColumn: { background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "12px" },
  dayHeader: { fontWeight: "700", fontSize: "14px", color: "#0f3460", borderBottom: "2px solid #0f3460", paddingBottom: "8px", marginBottom: "12px", textAlign: "center" },
  event: { background: "#f0fdf4", borderLeft: "4px solid #16a34a", padding: "10px", borderRadius: "6px", marginBottom: "10px", display: "flex", flexDirection: "column", gap: "2px" },
  eventTime: { fontSize: "12px", color: "#475569", fontWeight: "600" },
  eventVenue: { fontSize: "11px", color: "#64748b" },
};

export default LecturerDashboard;
