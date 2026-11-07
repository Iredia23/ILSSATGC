import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { showSuccess, showError } from "../utils/toast.js";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiUser, FiInfo, FiChevronLeft } from "react-icons/fi";

const BookMeeting = () => {
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState("");
  const [lecturerInfo, setLecturerInfo] = useState(null);
  const [lecturerSchedule, setLecturerSchedule] = useState({ classes: [], meetings: [] });
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState("");
  
  const [loadingLecturers, setLoadingLecturers] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    try {
      setLoadingLecturers(true);
      const res = await api.get("/users/lecturers");
      setLecturers(res.data.lecturers || []);
    } catch (err) {
      showError("Failed to fetch lecturers");
      console.error(err);
    } finally {
      setLoadingLecturers(false);
    }
  };

  const handleLecturerChange = async (lecturerId) => {
    setSelectedLecturerId(lecturerId);
    setSelectedSlot(null);
    if (!lecturerId) {
      setLecturerInfo(null);
      setLecturerSchedule({ classes: [], meetings: [] });
      setAvailableSlots([]);
      return;
    }

    try {
      setLoadingSchedule(true);
      
      // Fetch combined public schedule
      const schedRes = await api.get(`/meetings/lecturer/${lecturerId}/schedule`);
      setLecturerInfo(schedRes.data.lecturer);
      setLecturerSchedule({
        classes: schedRes.data.classes || [],
        meetings: schedRes.data.meetings || [],
      });

      // Fetch mutually available slots
      const slotsRes = await api.get(`/meetings/available-slots`, { params: { lecturerId } });
      setAvailableSlots(slotsRes.data.slots || []);
    } catch (err) {
      showError("Failed to fetch lecturer schedule");
      console.error(err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleBookMeeting = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      showError("Please select a timeslot");
      return;
    }
    if (!purpose.trim()) {
      showError("Please enter the purpose of the meeting");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/meetings/book", {
        lecturerId: selectedLecturerId,
        dayOfWeek: selectedSlot.dayOfWeek,
        timeSlotId: selectedSlot.timeSlotId,
        purpose: purpose.trim(),
      });
      showSuccess("Meeting request submitted successfully");
      navigate("/app");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to book meeting");
    } finally {
      setSubmitting(false);
    }
  };

  // Group slots by Day of Week
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="page" style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate("/app")} style={styles.backBtn}>
          <FiChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1 style={styles.title}>Book a Meeting</h1>
        <p style={styles.subtitle}>Select a lecturer to view their schedule and request a meeting during mutual free hours.</p>
      </div>

      <div style={styles.container}>
        {/* Left column: Selection and Form */}
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}><FiUser style={{ marginRight: 8, verticalAlign: "middle" }} /> 1. Select Lecturer</h2>
            <div style={styles.formGroup}>
              {loadingLecturers ? (
                <div>Loading lecturers...</div>
              ) : (
                <select
                  value={selectedLecturerId}
                  onChange={(e) => handleLecturerChange(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Choose a Lecturer --</option>
                  {lecturers.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.fullName} ({l.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {lecturerInfo && (
              <div style={styles.infoBox}>
                <p><strong>Name:</strong> {lecturerInfo.fullName}</p>
                <p><strong>Department:</strong> {lecturerInfo.department}</p>
                {lecturerInfo.officeLocation && <p><strong>Office Location:</strong> {lecturerInfo.officeLocation}</p>}
                <p><strong>Email:</strong> {lecturerInfo.email}</p>
              </div>
            )}
          </div>

          {selectedLecturerId && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><FiInfo style={{ marginRight: 8, verticalAlign: "middle" }} /> 3. Meeting Details</h2>
              <form onSubmit={handleBookMeeting} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Selected Slot:</label>
                  {selectedSlot ? (
                    <div style={styles.selectedSlotDisplay}>
                      <strong>{selectedSlot.dayOfWeek}</strong> | {selectedSlot.startTime} - {selectedSlot.endTime}
                    </div>
                  ) : (
                    <div style={styles.noSlotWarning}>No slot selected. Click an available (green) slot on the right.</div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Purpose of Meeting:</label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Briefly describe what you'd like to discuss (e.g., project review, course doubts)..."
                    style={styles.textarea}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedSlot || !purpose.trim()}
                  style={{
                    ...styles.submitBtn,
                    opacity: (submitting || !selectedSlot || !purpose.trim()) ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Booking..." : "Submit Meeting Request"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Timetable Schedule & Available slots */}
        <div style={styles.rightCol}>
          {selectedLecturerId ? (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><FiCalendar style={{ marginRight: 8, verticalAlign: "middle" }} /> 2. Lecturer Schedule & Free Slots</h2>
              {loadingSchedule ? (
                <div style={styles.loading}>Loading schedule and availability...</div>
              ) : (
                <div style={styles.scheduleGridContainer}>
                  <p style={styles.gridLegend}>
                    <span style={{ ...styles.legendDot, backgroundColor: "#2ecc71" }} /> Available (Click to select)
                    <span style={{ ...styles.legendDot, backgroundColor: "#e74c3c", marginLeft: 15 }} /> Lecturer Class/Busy
                    <span style={{ ...styles.legendDot, backgroundColor: "#95a5a6", marginLeft: 15 }} /> Student Busy (Your Class)
                  </p>
                  
                  <div style={styles.gridContainer}>
                    {days.map((day) => {
                      const daySlots = availableSlots.filter(s => s.dayOfWeek === day);
                      return (
                        <div key={day} style={styles.dayCol}>
                          <div style={styles.dayHeader}>{day}</div>
                          <div style={styles.slotsList}>
                            {daySlots.length === 0 ? (
                              <div style={styles.noSlotsText}>No slots</div>
                            ) : (
                              daySlots.map((slot) => {
                                const isSelected = selectedSlot && selectedSlot.dayOfWeek === day && selectedSlot.timeSlotId === slot.timeSlotId;
                                
                                let slotBg = "#2ecc71"; // Available
                                let tooltip = "Available";
                                let clickable = true;

                                if (!slot.isAvailable) {
                                  clickable = false;
                                  if (slot.studentBusyReason) {
                                    slotBg = "#95a5a6"; // Student is busy
                                    tooltip = slot.studentBusyReason;
                                  } else {
                                    slotBg = "#e74c3c"; // Lecturer is busy
                                    tooltip = slot.lecturerBusyReason;
                                  }
                                }

                                return (
                                  <button
                                    key={slot.timeSlotId}
                                    type="button"
                                    onClick={() => clickable && setSelectedSlot(slot)}
                                    title={tooltip}
                                    style={{
                                      ...styles.slotBtn,
                                      backgroundColor: isSelected ? "#0f3460" : slotBg,
                                      color: isSelected ? "#fff" : "#fff",
                                      cursor: clickable ? "pointer" : "not-allowed",
                                      border: isSelected ? "2px solid #1abc9c" : "none",
                                      transform: isSelected ? "scale(1.05)" : "scale(1)",
                                    }}
                                  >
                                    <div style={{ fontSize: "11px", fontWeight: "700" }}>{slot.startTime} - {slot.endTime}</div>
                                    <div style={{ fontSize: "9px", opacity: 0.8 }}>{clickable ? (isSelected ? "Selected" : "Free") : "Busy"}</div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.noLecturerSelectedCard}>
              <FiCalendar size={48} style={{ color: "#bdc3c7", marginBottom: 12 }} />
              <h3>No Lecturer Selected</h3>
              <p>Please select a lecturer from the dropdown to check their weekly timetable and book free slots.</p>
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
  backBtn: { background: "none", border: "none", color: "#3498db", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "600", padding: 0, marginBottom: "12px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "15px", color: "#666", margin: 0 },
  container: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: "24px" },
  rightCol: {},
  card: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" },
  cardTitle: { fontSize: "17px", fontWeight: "700", color: "#0f3460", margin: "0 0 16px" },
  formGroup: { marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", fontWeight: "600", color: "#333" },
  select: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  textarea: { width: "100%", height: "100px", padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box" },
  infoBox: { padding: "12px 16px", borderRadius: "8px", backgroundColor: "#f8fafc", marginTop: "16px", fontSize: "13px", color: "#475569", display: "flex", flexDirection: "column", gap: "6px" },
  selectedSlotDisplay: { padding: "10px 14px", borderRadius: "8px", backgroundColor: "#e8f8f5", border: "1px solid #1abc9c", color: "#16a085", fontSize: "14px" },
  noSlotWarning: { padding: "10px 14px", borderRadius: "8px", backgroundColor: "#fef9e7", border: "1px solid #f39c12", color: "#d35400", fontSize: "13px" },
  submitBtn: { padding: "12px", borderRadius: "8px", background: "#10b981", color: "#fff", fontWeight: "600", fontSize: "15px", cursor: "pointer", border: "none", width: "100%", transition: "background 0.2s" },
  noLecturerSelectedCard: { padding: "80px 24px", borderRadius: "12px", background: "#fff", border: "2px dashed #bdc3c7", textAlign: "center", color: "#7f8c8d" },
  loading: { padding: "40px", textAlign: "center", color: "#888" },
  scheduleGridContainer: { marginTop: "10px" },
  gridLegend: { fontSize: "12px", color: "#7f8c8d", marginBottom: "16px", display: "flex", alignItems: "center", flexWrap: "wrap" },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%", display: "inline-block", marginRight: "6px" },
  gridContainer: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" },
  dayCol: { backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "8px" },
  dayHeader: { fontSize: "13px", fontWeight: "700", color: "#2c3e50", textAlign: "center", paddingBottom: "6px", marginBottom: "8px", borderBottom: "1px solid #ddd" },
  slotsList: { display: "flex", flexDirection: "column", gap: "8px" },
  slotBtn: { border: "none", borderRadius: "6px", padding: "8px 4px", textAlign: "center", transition: "all 0.2s" },
  noSlotsText: { fontSize: "11px", color: "#aaa", textAlign: "center", padding: "10px 0" }
};

export default BookMeeting;
