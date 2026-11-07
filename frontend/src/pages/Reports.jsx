import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import { SEMESTERS, LEVELS } from "../utils/helpers.js";
import {
  FiCalendar, FiAlertTriangle, FiBarChart2, FiMapPin, FiDownload,
  FiCheckCircle
} from "react-icons/fi";

const Reports = () => {
  const { user } = useAuth();
  const [semester, setSemester] = useState("1st Semester");
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState("");

  const reports = [
    { id: "schedule", label: "Semester Schedule", icon: <FiCalendar size={28} />, roles: ["Admin", "HOD", "Exam Officer", "Timetable Officer"] },
    { id: "conflicts", label: "Conflict Report", icon: <FiAlertTriangle size={28} />, roles: ["Admin", "HOD", "Timetable Officer"] },
    { id: "workload", label: "Lecturer Workload", icon: <FiBarChart2 size={28} />, roles: ["Admin", "HOD"] },
    { id: "venue-util", label: "Venue Utilization", icon: <FiMapPin size={28} />, roles: ["Admin", "Timetable Officer"] },
  ];

  const availableReports = reports.filter((r) => r.roles.includes(user?.role));

  const generateReport = async (reportId) => {
    setLoading(true);
    setError("");
    setReportData(null);
    setActiveReport(reportId);

    try {
      let res;
      switch (reportId) {
        case "schedule":
          res = await api.post("/reports/semester-schedule", { semester });
          setReportData(res.data.report);
          break;
        case "conflicts":
          res = await api.get("/reports/conflicts", { params: { semester } });
          setReportData(res.data);
          break;
        case "workload":
          res = await api.get("/admin/workload-report", { params: { semester } });
          setReportData(res.data);
          break;
        case "venue-util":
          res = await api.get("/admin/venue-utilization");
          setReportData(res.data);
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    const data = reportData.schedule || reportData.report || reportData.logs || [];
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${activeReport}-${semester || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <h1 style={styles.title}>Reports</h1>
        <p style={styles.subtitle}>Generate and view scheduling reports</p>
      </div>

      <div className="report-cards-grid" style={styles.grid}>
        {availableReports.map((r) => (
          <button
            key={r.id}
            onClick={() => generateReport(r.id)}
            style={{
              ...styles.reportCard,
              ...(activeReport === r.id ? styles.reportCardActive : {}),
            }}
          >
            <span style={styles.reportIcon}>{r.icon}</span>
            <span style={styles.reportLabel}>{r.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar" style={styles.toolbar}>
        <select style={styles.select} value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {reportData && (
          <button onClick={exportCSV} style={styles.exportBtn}>
            <FiDownload size={14} style={{ marginRight: 6 }} /> Export CSV
          </button>
        )}
      </div>

      {loading && <div style={styles.loading}>Generating report...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {reportData && !loading && (
        <div style={styles.reportCard}>
          {activeReport === "schedule" && reportData.schedule && (
            <div>
              <h3 style={styles.reportTitle}>{reportData.title}</h3>
              <div style={styles.summaryRow}>
                <span>Courses: {reportData.summary.totalCourses}</span>
                <span>Venues: {reportData.summary.totalVenuesUsed}</span>
                <span>Lecturers: {reportData.summary.totalLecturers}</span>
              </div>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Code</th>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>Lecturer</th>
                      <th style={styles.th}>Venue</th>
                      <th style={styles.th}>Day</th>
                      <th style={styles.th}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.schedule.map((s, i) => (
                      <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.td}>{s.courseCode}</td>
                        <td style={styles.td}>{s.courseTitle}</td>
                        <td style={styles.td}>{s.lecturer}</td>
                        <td style={styles.td}>{s.venue}</td>
                        <td style={styles.td}>{s.dayOfWeek}</td>
                        <td style={styles.td}>{s.startTime} – {s.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === "conflicts" && reportData.conflicts && (
            <div>
              <h3 style={styles.reportTitle}>Conflict Report</h3>
              <div style={styles.summaryRow}>
                <span>Total Checked: {reportData.summary.totalChecked}</span>
                <span>Conflicts: {reportData.summary.totalConflicts}</span>
                <span>Venue: {reportData.summary.venueConflicts}</span>
                <span>Lecturer: {reportData.summary.lecturerConflicts}</span>
              </div>
              {reportData.conflicts.length === 0 ? (
                <p style={{ padding: "20px", textAlign: "center", color: "#27ae60", fontWeight: "600" }}>
                  <FiCheckCircle size={16} style={{ marginRight: 6 }} /> No conflicts found!
                </p>
              ) : (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Courses</th>
                        <th style={styles.th}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.conflicts.map((c, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}><span style={{ color: c.type === "VENUE_CONFLICT" ? "#e74c3c" : "#e67e22", fontWeight: "600" }}>{c.type}</span></td>
                          <td style={styles.td}>{c.message}</td>
                          <td style={styles.td}>{c.courses?.join(", ")}</td>
                          <td style={styles.td}>{c.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeReport === "workload" && reportData.report && (
            <div>
              <h3 style={styles.reportTitle}>Lecturer Workload Report</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Lecturer</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Courses</th>
                      <th style={styles.th}>Credit Units</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.report.map((w, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{w.lecturerName}</td>
                        <td style={styles.td}>{w.email}</td>
                        <td style={styles.td}>{w.totalCourses}</td>
                        <td style={styles.td}>{w.totalCreditUnits}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
                            background: w.status === "normal" ? "#d4edda" : w.status === "warning" ? "#fff3cd" : "#f8d7da",
                            color: w.status === "normal" ? "#155724" : w.status === "warning" ? "#856404" : "#721c24",
                          }}>
                            {w.status === "normal" ? "Normal" : w.status === "warning" ? "Warning" : "Overloaded"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === "venue-util" && reportData.report && (
            <div>
              <h3 style={styles.reportTitle}>Venue Utilization Report</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Venue</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Capacity</th>
                      <th style={styles.th}>Scheduled</th>
                      <th style={styles.th}>Available</th>
                      <th style={styles.th}>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.report.map((v, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{v.venueName}</td>
                        <td style={styles.td}>{v.venueType}</td>
                        <td style={styles.td}>{v.capacity}</td>
                        <td style={styles.td}>{v.scheduledCourses}</td>
                        <td style={styles.td}>{v.availableSlots}</td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "60px", height: "8px", background: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(v.utilization, 100)}%`, height: "100%", background: v.utilization > 80 ? "#27ae60" : v.utilization > 50 ? "#f39c12" : "#e74c3c", borderRadius: "4px" }} />
                            </div>
                            <span>{v.utilization}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
  header: { marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "16px", color: "#666", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" },
  reportCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "20px 16px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "2px solid #eee", cursor: "pointer", transition: "border-color 0.2s" },
  reportCardActive: { borderColor: "#0f3460" },
  reportIcon: { display: "flex", alignItems: "center" },
  reportLabel: { fontSize: "14px", fontWeight: "600", color: "#333" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  exportBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#27ae60", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" },
  loading: { textAlign: "center", padding: "40px", color: "#888" },
  error: { padding: "12px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px", marginBottom: "16px" },
  reportTitle: { fontSize: "20px", fontWeight: "600", color: "#333", marginBottom: "16px" },
  summaryRow: { display: "flex", gap: "24px", marginBottom: "20px", flexWrap: "wrap" },
  tableContainer: { borderRadius: "8px", border: "1px solid #eee", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "13px", color: "#666", borderBottom: "2px solid #eee", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "10px 16px", fontSize: "14px", color: "#333" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  trEven: { background: "#f9f9f9" },
  trOdd: { background: "#fff" },
};

export default Reports;
