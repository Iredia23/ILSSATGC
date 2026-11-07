import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { SEMESTERS, DAY_ORDER } from "../utils/helpers.js";
import { showSuccess, showError } from "../utils/toast.js";
import { FiSettings, FiClock, FiCalendar, FiList, FiSlash } from "react-icons/fi";

const OPERATING_START = 8;
const MORNING_END = 13;
const AFTERNOON_START = 14;
const OPERATING_END = 18;

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00",
  "14:00", "15:00", "16:00", "17:00",
];

const TimeSlotManagement = () => {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState([...SEMESTERS]);
  const [view, setView] = useState("calendar");

  const canManage = user?.role === "Admin" || user?.role === "Timetable Officer";

  useEffect(() => { fetchTimeSlots(); }, [semesterFilter]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const params = {};
      if (semesterFilter) params.semester = semesterFilter;
      const res = await api.get("/timeslots", { params });
      setTimeSlots(res.data.timeSlots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const suggestedSlots = () => {
    const slots = [];
    for (let hour = OPERATING_START; hour < MORNING_END; hour++) {
      const start = `${String(hour).padStart(2, "0")}:00`;
      const end = `${String(hour + 1).padStart(2, "0")}:00`;
      slots.push({ startTime: start, endTime: end, duration: 1, label: `${start}–${end}` });
    }
    for (let hour = AFTERNOON_START; hour < OPERATING_END; hour++) {
      const start = `${String(hour).padStart(2, "0")}:00`;
      const end = `${String(hour + 1).padStart(2, "0")}:00`;
      slots.push({ startTime: start, endTime: end, duration: 1, label: `${start}–${end}` });
    }
    return slots;
  };

  const handleGenerateSlots = async () => {
    try {
      const slots = suggestedSlots().map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        daysAvailable: [...DAY_ORDER],
        applicableSemesters: selectedSemesters,
      }));

      const existingSlots = new Set(
        timeSlots.map((ts) => `${ts.startTime}-${ts.endTime}-${ts.duration}`)
      );

      const newSlots = slots.filter(
        (s) => !existingSlots.has(`${s.startTime}-${s.endTime}-${s.duration}`)
      );

      if (newSlots.length === 0) {
        showSuccess("All slots already exist!");
        setShowConfig(false);
        return;
      }

      await api.post("/timeslots/batch", { timeSlots: newSlots });
      showSuccess(`${newSlots.length} time slots generated successfully!`);
      setShowConfig(false);
      fetchTimeSlots();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to generate time slots");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this timeslot?")) return;
    try {
      await api.delete(`/timeslots/${id}`);
      showSuccess("Time slot deleted");
      fetchTimeSlots();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Operating Hours Setup</h1>
          <p style={styles.subtitle}>Configure the daily timetable schedule — set session hours, break times, and generate time slots for the semester</p>
        </div>
        {canManage && (
          <button onClick={() => setShowConfig(!showConfig)} style={styles.primaryBtn}>
            <FiSettings size={14} style={{ marginRight: 6 }} /> Configure Hours
          </button>
        )}
      </div>

      {/* Link to Schedule Planning */}
      <div style={{ ...styles.configCard, marginBottom: "20px", borderLeft: "4px solid #0f3460", background: "#f0f4ff" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a2e", marginBottom: "4px" }}>
            Ready to build your timetable?
          </div>
          <div style={{ fontSize: "13px", color: "#555" }}>
            After configuring session hours, go to <strong>Schedule Planning</strong> in the sidebar to assign courses to venues and time slots, then view the weekly timetable grid.
          </div>
        </div>
      </div>

      {/* Configuration Summary Cards */}
      <div className="config-cards" style={styles.configCards}>
        <div style={styles.configCard}>
          <span style={styles.configIcon}><FiClock size={28} /></span>
          <div>
            <div style={styles.configValue}>{`${String(OPERATING_START).padStart(2, "0")}:00 – ${String(OPERATING_END).padStart(2, "0")}:00`}</div>
            <div style={styles.configLabel}>Operating Hours</div>
          </div>
        </div>
        <div style={styles.configCard}>
          <span style={styles.configIcon}><FiClock size={28} /></span>
          <div>
            <div style={styles.configValue}>1h Slots</div>
            <div style={styles.configLabel}>All Sessions</div>
          </div>
        </div>
        <div style={styles.configCard}>
          <span style={styles.configIcon}><FiCalendar size={28} /></span>
          <div>
            <div style={styles.configValue}>{DAY_ORDER.length} Days</div>
            <div style={styles.configLabel}>Mon – Fri</div>
          </div>
        </div>
      </div>          {showConfig && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Generate Time Slots</h3>
          <div style={styles.configDetails}>
            <p style={styles.configDesc}>
              Based on the operating hours below, the system will generate
              <strong> {suggestedSlots().length} time slots</strong> that define when courses can be scheduled:
            </p>
            <div style={styles.slotPreview}>
              <div style={styles.slotGroup}>
                <h4 style={styles.slotGroupTitle}>Time Slots ({suggestedSlots().length} slots)</h4>
                <div style={styles.slotGrid}>
                  {suggestedSlots().map((s, i) => {
                    const exists = timeSlots.some(ts => ts.startTime === s.startTime && ts.endTime === s.endTime);
                    return (
                      <div key={i} style={{ ...styles.slotChip, background: exists ? "#d4edda" : "#f0f4f8", border: exists ? "1px solid #c3e6cb" : "1px solid #e0e0e0" }}>
                        {s.label}
                        {exists && <span style={{ marginLeft: "4px", color: "#10b981" }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={styles.semesterSelector}>
              <label style={styles.configLabel}>Apply to semesters:</label>
              <div style={styles.checkboxRow}>
                {SEMESTERS.map((s) => (
                  <label key={s} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedSemesters.includes(s)}
                      onChange={() =>
                        setSelectedSemesters((prev) =>
                          prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                        )
                      }
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setShowConfig(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={handleGenerateSlots} style={styles.primaryBtn}>
                Generate Missing Slots
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toolbar" style={styles.toolbar}>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setView("calendar")} style={{ ...styles.viewBtn, ...(view === "calendar" ? styles.viewBtnActive : {}) }}>
            <FiCalendar size={14} style={{ marginRight: 6 }} /> Calendar
          </button>
          <button onClick={() => setView("list")} style={{ ...styles.viewBtn, ...(view === "list" ? styles.viewBtnActive : {}) }}>
            <FiList size={14} style={{ marginRight: 6 }} /> List
          </button>
        </div>
        <select style={styles.select} value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: "14px", color: "#666", alignSelf: "center" }}>
          {timeSlots.length} slots configured
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading...</div>
      ) : timeSlots.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>No time slots configured yet</p>
          <p style={{ fontSize: "14px", color: "#666" }}>Click "Configure Timetable" to auto-generate slots</p>
        </div>
      ) : view === "list" ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Available Days</th>
                <th style={styles.th}>Semesters</th>
                {canManage && <th style={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {[...timeSlots]
                .sort((a, b) => {
                  const aMin = parseInt(a.startTime.split(":")[0]) * 60 + parseInt(a.startTime.split(":")[1]);
                  const bMin = parseInt(b.startTime.split(":")[0]) * 60 + parseInt(b.startTime.split(":")[1]);
                  return aMin - bMin;
                })
                .map((ts) => (
                <tr key={ts._id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{ts.startTime}</strong> – <strong>{ts.endTime}</strong>
                  </td>
                  <td style={styles.td}>
                    <span style={ts.duration === 2 ? styles.badgeLarge : styles.badgeSmall}>
                      {ts.duration}h
                    </span>
                  </td>
                  <td style={styles.td}>{ts.daysAvailable?.join(", ")}</td>
                  <td style={styles.td}>{ts.applicableSemesters?.join(", ")}</td>
                  {canManage && (
                    <td style={styles.td}>
                      <button onClick={() => handleDelete(ts._id)} style={styles.deleteBtn}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cal-wrapper" style={styles.calendarWrapper}>
          <div style={styles.calendarHeader}>
            <div style={styles.calTimeCol}></div>
            {DAY_ORDER.map((day) => (
              <div key={day} style={styles.calDayHeader}>
                <div style={styles.calDayName}>{day.slice(0, 3)}</div>
              </div>
            ))}
          </div>

          <div style={styles.calendarBody}>
            {HOURS.map((hour) => {
              const hourNum = parseInt(hour);
              const isBreak = hourNum === 13;

              return (
                <div key={hour} style={styles.calRow}>
                  <div style={{
                    ...styles.calTimeLabel,
                    color: isBreak ? "#dc2626" : "#333",
                    fontWeight: isBreak ? "600" : "400",
                  }}>
                    {isBreak ? <FiSlash size={14} /> : hour}
                  </div>

                  {DAY_ORDER.map((day) => {
                    if (isBreak) {
                      return (
                        <div key={day} style={styles.calBreakCell}>
                          <span style={{ fontSize: "10px", color: "#999" }}>BREAK</span>
                        </div>
                      );
                    }

                    const slot = timeSlots.find(
                      (ts) => ts.startTime === `${String(hourNum).padStart(2, "0")}:00`
                    );
                    const exists = slot && slot.daysAvailable?.includes(day);

                    if (exists) {
                      return (
                        <div key={day} style={styles.calSlotCell}>
                          <div style={styles.calSlotTime}>{slot.startTime}–{slot.endTime}</div>
                          <div style={styles.calSlotMeta}>
                            {slot.applicableSemesters?.length === 2 ? "Both" : slot.applicableSemesters?.[0]}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={day} style={styles.calEmptyCell}>
                        <span style={{ fontSize: "10px", color: "#ccc" }}>—</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "16px", color: "#666", margin: 0 },
  primaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0f3460", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" },
  secondaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "2px solid #ddd", background: "#fff", color: "#333", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  configCards: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" },
  configCard: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee" },
  configIcon: { display: "flex", alignItems: "center" },
  configValue: { fontSize: "16px", fontWeight: "700", color: "#1a1a2e" },
  configLabel: { fontSize: "12px", color: "#666", marginTop: "2px" },
  formCard: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee", marginBottom: "24px" },
  formTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#333" },
  configDetails: { display: "flex", flexDirection: "column", gap: "16px" },
  configDesc: { fontSize: "14px", color: "#555", margin: 0, lineHeight: "1.5" },
  slotPreview: { display: "flex", flexDirection: "column", gap: "12px" },
  slotGroup: {},
  slotGroupTitle: { fontSize: "14px", fontWeight: "600", color: "#333", margin: "0 0 8px" },
  slotGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  slotChip: { padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#333" },
  semesterSelector: { display: "flex", flexDirection: "column", gap: "8px" },
  checkboxRow: { display: "flex", gap: "16px" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#555", cursor: "pointer" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  tableContainer: { borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "14px 16px", textAlign: "left", fontWeight: "600", fontSize: "13px", color: "#666", borderBottom: "2px solid #eee", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#333" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  badgeLarge: { display: "inline-block", padding: "2px 8px", borderRadius: "4px", background: "#fff3e0", color: "#e65100", fontWeight: "600", fontSize: "12px" },
  badgeSmall: { display: "inline-block", padding: "2px 8px", borderRadius: "4px", background: "#e8f5e9", color: "#2e7d32", fontWeight: "600", fontSize: "12px" },
  viewBtn: { padding: "8px 16px", borderRadius: "8px", border: "2px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center" },
  viewBtnActive: { background: "#0f3460", color: "#fff", borderColor: "#0f3460" },
  calendarWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
  calendarHeader: { display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", borderBottom: "2px solid #0f3460", background: "#f8fafc", position: "sticky", top: 0, zIndex: 2 },
  calTimeCol: { padding: "10px 4px" },
  calDayHeader: { padding: "10px 4px", textAlign: "center", borderLeft: "1px solid #e2e8f0" },
  calDayName: { fontWeight: "700", fontSize: "13px", color: "#0f3460", textTransform: "uppercase", letterSpacing: "0.5px" },
  calendarBody: {},
  calRow: { display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", borderBottom: "1px solid #f1f5f9" },
  calTimeLabel: { padding: "8px 4px", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #e2e8f0", background: "#f8fafc" },
  calBreakCell: { display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", borderLeft: "1px solid #fecaca", minHeight: "44px" },
  calSlotCell: { padding: "6px", minHeight: "44px", borderLeft: "1px solid #e2e8f0", background: "#f0f9ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" },
  calSlotTime: { fontWeight: "600", fontSize: "11px", color: "#0f3460" },
  calSlotMeta: { fontSize: "9px", color: "#64748b" },
  calEmptyCell: { borderLeft: "1px solid #e2e8f0", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyState: { textAlign: "center", padding: "40px" },
  deleteBtn: { padding: "5px 10px", borderRadius: "4px", border: "none", background: "#e74c3c", color: "#fff", fontSize: "12px", cursor: "pointer" },
};

export default TimeSlotManagement;
