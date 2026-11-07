import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import { showSuccess, showError } from "../utils/toast.js";
import { FiCalendar, FiClock, FiBookmark, FiPlus, FiTrash2 } from "react-icons/fi";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [semester, setSemester] = useState("1st Semester");
  const [schedule, setSchedule] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  useEffect(() => {
    fetchClassSchedule();
    fetchMeetings();
  }, [semester]);

  const fetchClassSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await api.get("/assignments/schedule", { params: { semester } });
      // Filter classes that match student's level and department
      const studentClasses = (res.data.schedule || []).filter(
        (item) =>
          item.courseId?.level === user.level &&
          item.courseId?.departments?.includes(user.department)
      );
      setSchedule(studentClasses);
    } catch (err) {
      console.error("Failed to load class schedule:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoadingMeetings(true);
      const res = await api.get("/meetings/student");
      setMeetings(res.data.meetings || []);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to cancel this meeting request?")) return;
    try {
      await api.patch(`/meetings/${meetingId}/status`, { status: "Cancelled" });
      showSuccess("Meeting request cancelled successfully");
      fetchMeetings();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to cancel meeting");
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Approved":
        return { backgroundColor: "#e8f8f5", color: "#1abc9c", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" };
      case "Cancelled":
        return { backgroundColor: "#fdedec", color: "#e74c3c", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" };
      default:
        return { backgroundColor: "#fef9e7", color: "#f39c12", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" };
    }
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Student Portal Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.fullName} | {user?.department} - {user?.level} Level</p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Timetable Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}><FiCalendar style={{ marginRight: 8, verticalAlign: "middle" }} /> Class Timetable</h2>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              style={styles.select}
            >
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
            </select>
          </div>

          {loadingSchedule ? (
            <div style={styles.loading}>Loading timetable...</div>
          ) : schedule.length === 0 ? (
            <div style={styles.empty}>No classes scheduled for your level/department in {semester}.</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course Code</th>
                    <th style={styles.th}>Course Title</th>
                    <th style={styles.th}>Lecturer</th>
                    <th style={styles.th}>Venue</th>
                    <th style={styles.th}>Day</th>
                    <th style={styles.th}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item, i) => (
                    <tr key={item._id || i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td style={styles.td}><strong>{item.courseCode}</strong></td>
                      <td style={styles.td}>{item.courseTitle}</td>
                      <td style={styles.td}>{item.lecturerName || "TBD"}</td>
                      <td style={styles.td}>{item.venueName}</td>
                      <td style={styles.td}>{item.dayOfWeek}</td>
                      <td style={styles.td}>{item.startTime} - {item.endTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Meetings Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}><FiClock style={{ marginRight: 8, verticalAlign: "middle" }} /> Meeting Bookings</h2>
            <a href="/book-meeting" style={styles.bookBtn}>
              <FiPlus size={14} style={{ marginRight: 6 }} /> Request Meeting
            </a>
          </div>

          {loadingMeetings ? (
            <div style={styles.loading}>Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div style={styles.empty}>You haven't requested any meetings yet.</div>
          ) : (
            <div style={styles.meetingList}>
              {meetings.map((meeting) => (
                <div key={meeting._id} style={styles.meetingItem}>
                  <div style={styles.meetingMeta}>
                    <span style={styles.lecturerName}>{meeting.lecturerId?.fullName}</span>
                    <span style={styles.meetingTime}>
                      {meeting.dayOfWeek} | {meeting.timeSlotId?.startTime} - {meeting.timeSlotId?.endTime}
                    </span>
                    <p style={styles.purposeText}><strong>Purpose:</strong> {meeting.purpose}</p>
                    {meeting.lecturerId?.officeLocation && (
                      <p style={styles.officeText}><strong>Office:</strong> {meeting.lecturerId.officeLocation}</p>
                    )}
                  </div>
                  <div style={styles.meetingActions}>
                    <span style={getStatusBadgeStyle(meeting.status)}>{meeting.status}</span>
                    {meeting.status !== "Cancelled" && (
                      <button
                        onClick={() => handleCancelMeeting(meeting._id)}
                        style={styles.cancelBtn}
                        title="Cancel Meeting"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
  header: { marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "16px", color: "#666", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: "24px" },
  card: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f0f0f0", paddingBottom: "12px" },
  cardTitle: { fontSize: "18px", fontWeight: "700", color: "#0f3460", margin: 0, display: "flex", alignItems: "center" },
  select: { padding: "8px 12px", borderRadius: "6px", border: "1px solid #dcdde1", outline: "none", fontSize: "14px" },
  bookBtn: { padding: "8px 16px", borderRadius: "8px", background: "#10b981", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", cursor: "pointer", border: "none" },
  loading: { padding: "40px", textAlign: "center", color: "#888" },
  empty: { padding: "40px", textAlign: "center", color: "#888", fontStyle: "italic" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", textAlign: "left", color: "#2f3640", fontWeight: "600", fontSize: "13px", borderBottom: "2px solid #f0f0f0" },
  td: { padding: "12px 16px", color: "#353b48", fontSize: "14px" },
  trEven: { backgroundColor: "#fafbfc" },
  trOdd: { backgroundColor: "#ffffff" },
  meetingList: { display: "flex", flexDirection: "column", gap: "12px" },
  meetingItem: { padding: "16px", borderRadius: "8px", border: "1px solid #e1e8ed", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fcfdfe", transition: "all 0.2s" },
  meetingMeta: { display: "flex", flexDirection: "column", gap: "4px" },
  lecturerName: { fontSize: "15px", fontWeight: "700", color: "#2c3e50" },
  meetingTime: { fontSize: "13px", color: "#7f8c8d" },
  purposeText: { fontSize: "13px", color: "#555", margin: "4px 0 0" },
  officeText: { fontSize: "12px", color: "#888", margin: "2px 0 0" },
  meetingActions: { display: "flex", alignItems: "center", gap: "12px" },
  cancelBtn: { border: "none", background: "transparent", color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px", transition: "background 0.2s", ":hover": { backgroundColor: "#fdedec" } }
};

export default StudentDashboard;
