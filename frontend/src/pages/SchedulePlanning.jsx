import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { SEMESTERS, DAY_ORDER, exportToCSV } from "../utils/helpers.js";
import { showSuccess, showError, showWarning } from "../utils/toast.js";
import AiSuggestionBanner from "../components/AiSuggestionBanner.jsx";
import {
  FiList,
  FiCalendar,
  FiZap,
  FiAlertTriangle,
  FiSlash,
  FiDownload,
  FiPrinter,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiMove,
  FiCheckCircle,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiCheck,
  FiClock,
  FiLayers,
} from "react-icons/fi";

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const SchedulePlanning = () => {
  const { user } = useAuth();
  const canManageSchedule = user?.role === "Admin" || user?.role === "Timetable Officer";

  // Data states
  const [coursesWithQuota, setCoursesWithQuota] = useState([]);
  const [unscheduled, setUnscheduled] = useState([]);
  const [quotaSummary, setQuotaSummary] = useState({ totalCourses: 0, unscheduledCount: 0, partialCount: 0, completedCount: 0 });
  const [venues, setVenues] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [semester, setSemester] = useState("1st Semester");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [view, setView] = useState("calendar");
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState(false);
  const [unscheduledFilterLevel, setUnscheduledFilterLevel] = useState("All");

  // Top Assign Form Modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({
    courseId: "",
    venueId: "",
    timeSlotId: "",
    dayOfWeek: "Monday",
    description: "",
    conflictOverride: false,
  });
  const [assignConflicts, setAssignConflicts] = useState([]);

  // Auto-Gen Modal & Diagnostics State
  const [showAutoGenModal, setShowAutoGenModal] = useState(false);
  const [autoGenOverwrite, setAutoGenOverwrite] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenResult, setAutoGenResult] = useState(null);
  const [showAutoGenResultModal, setShowAutoGenResultModal] = useState(false);

  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Interactive Slot Details Modal State
  const [selectedSlotDetail, setSelectedSlotDetail] = useState(null);
  const [slotModalTab, setSlotModalTab] = useState("list"); // 'list' | 'add' | 'move' | 'edit'
  const [showFullQuotaCourses, setShowFullQuotaCourses] = useState(false);
  const [updatingSlot, setUpdatingSlot] = useState(false);

  // Add course to slot sub-form
  const [slotAddForm, setSlotAddForm] = useState({
    courseId: "",
    venueId: "",
    description: "",
    conflictOverride: false,
  });
  const [slotAddConflicts, setSlotAddConflicts] = useState([]);

  // Move course sub-form
  const [movingAssignment, setMovingAssignment] = useState(null);
  const [moveForm, setMoveForm] = useState({
    dayOfWeek: "Monday",
    timeSlotId: "",
    venueId: "",
    conflictOverride: false,
  });
  const [moveConflicts, setMoveConflicts] = useState([]);

  // Edit course details sub-form
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editForm, setEditForm] = useState({
    venueId: "",
    lecturerId: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, [semester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = semester ? { semester } : {};
      const [unscheduledRes, venuesRes, tsRes, scheduleRes, lecturersRes, coursesRes] =
        await Promise.all([
          api.get("/assignments/unscheduled", { params }),
          api.get("/venues", { params: { limit: 100 } }),
          api.get("/timeslots", { params: semester ? { semester } : {} }),
          api.get("/assignments/schedule", { params }),
          api.get("/users/lecturers"),
          api.get("/courses", { params: { semester, limit: 200 } }),
        ]);

      setCoursesWithQuota(unscheduledRes.data.courses || []);
      setUnscheduled(unscheduledRes.data.unscheduled || []);
      setQuotaSummary(unscheduledRes.data.summary || { totalCourses: 0, unscheduledCount: 0, partialCount: 0, completedCount: 0 });
      setVenues(venuesRes.data.venues || []);
      setTimeSlots(tsRes.data.timeSlots || []);
      setSchedule(scheduleRes.data.schedule || []);
      setLecturers(lecturersRes.data.lecturers || []);
      setAllCourses(coursesRes.data.courses || []);
    } catch (err) {
      console.error(err);
      showError("Failed to load scheduling data");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // AUTO-GENERATION
  // ═══════════════════════════════════════════════════════════

  const handleAutoGenerate = async () => {
    if (!semester) {
      showError("Please select a specific semester for auto-generation");
      return;
    }
    setAutoGenLoading(true);
    try {
      const res = await api.post("/assignments/auto-generate", {
        semester,
        overwrite: autoGenOverwrite,
      });
      if (res.data.success) {
        setAutoGenResult(res.data);
        setShowAutoGenModal(false);
        setShowAutoGenResultModal(true);
        fetchData();
      }
    } catch (err) {
      showError(err.response?.data?.message || "Auto-generation failed");
    } finally {
      setAutoGenLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // AI SUGGESTIONS
  // ═══════════════════════════════════════════════════════════

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const res = await api.post("/ai/suggest", { semester: semester || undefined });
      setAiSuggestions(res.data);
    } catch (err) {
      showError("AI suggestion failed: " + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = async (suggestion) => {
    const targetCourse = allCourses.find((c) => c.code === suggestion.courseCode);
    const venueItem = venues.find((v) => v.name === suggestion.venue);
    const timeSlotItem = timeSlots.find((ts) => ts.startTime === suggestion.time);

    if (!targetCourse || !venueItem || !timeSlotItem) {
      showError("Could not match IDs for this AI suggestion");
      return;
    }

    try {
      const res = await api.post("/assignments/course-to-venue-time", {
        courseId: targetCourse._id,
        venueId: venueItem._id,
        timeSlotId: timeSlotItem._id,
        dayOfWeek: suggestion.day,
      });
      if (res.data.success) {
        showSuccess(`Applied: ${suggestion.courseCode} → ${suggestion.venue} on ${suggestion.day} at ${suggestion.time}`);
        setAiSuggestions(null);
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to apply suggestion";
      showError(msg);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SLOT CELL CLICK & MODAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  const handleCellClick = (day, hourNum) => {
    if (hourNum === 13) return; // Lunch Break

    const matchingSlot = timeSlots.find(
      (ts) => ts.startTime === `${String(hourNum).padStart(2, "0")}:00`
    );

    // Get all assignments for this slot
    const slotKey = `${day}-${String(hourNum).padStart(2, "0")}:00`;
    const slotAssignments = schedule.filter((s) => {
      const startTime = s.timeSlotId?.startTime || s.startTime;
      return s.dayOfWeek === day && startTime === `${String(hourNum).padStart(2, "0")}:00`;
    });

    setSelectedSlotDetail({
      dayOfWeek: day,
      hourNum,
      startTime: `${String(hourNum).padStart(2, "0")}:00`,
      endTime: matchingSlot?.endTime || `${String(hourNum + 1).padStart(2, "0")}:00`,
      timeSlotId: matchingSlot?._id,
      assignments: slotAssignments,
    });

    setSlotModalTab("list");
    setMovingAssignment(null);
    setEditingAssignment(null);
    setSlotAddConflicts([]);
    setMoveConflicts([]);

    // Initialize Add form with first unallocated course & venue
    const firstUnallocated = coursesWithQuota.find((c) => c.status !== "completed");
    setSlotAddForm({
      courseId: firstUnallocated?.courseId?._id || allCourses[0]?._id || "",
      venueId: venues[0]?._id || "",
      description: "",
      conflictOverride: false,
    });
  };

  // Refresh current open slot assignments after a change
  const refreshSlotDetail = (updatedSchedule, day, startTime) => {
    const updatedAssignments = updatedSchedule.filter((s) => {
      const st = s.timeSlotId?.startTime || s.startTime;
      return s.dayOfWeek === day && st === startTime;
    });

    setSelectedSlotDetail((prev) =>
      prev ? { ...prev, assignments: updatedAssignments } : null
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ADD COURSE TO SLOT (INSIDE MODAL)
  // ═══════════════════════════════════════════════════════════

  const checkSlotAddConflicts = async (courseId, venueId) => {
    if (!selectedSlotDetail?.timeSlotId || !courseId || !venueId) return [];
    try {
      const res = await api.post("/assignments/check-conflict", {
        courseId,
        venueId,
        timeSlotId: selectedSlotDetail.timeSlotId,
        dayOfWeek: selectedSlotDetail.dayOfWeek,
      });
      return res.data.conflicts || [];
    } catch (err) {
      return [];
    }
  };

  const handleSlotAddCourseChange = async (courseId) => {
    setSlotAddForm((prev) => ({ ...prev, courseId }));
    const detected = await checkSlotAddConflicts(courseId, slotAddForm.venueId);
    setSlotAddConflicts(detected);
  };

  const handleSlotAddVenueChange = async (venueId) => {
    setSlotAddForm((prev) => ({ ...prev, venueId }));
    const detected = await checkSlotAddConflicts(slotAddForm.courseId, venueId);
    setSlotAddConflicts(detected);
  };

  const handleAddCourseToSlotSubmit = async (e) => {
    e.preventDefault();
    if (!slotAddForm.courseId || !slotAddForm.venueId || !selectedSlotDetail?.timeSlotId) {
      showError("Please select both a course and venue");
      return;
    }

    setUpdatingSlot(true);
    try {
      const res = await api.post("/assignments/course-to-venue-time", {
        courseId: slotAddForm.courseId,
        venueId: slotAddForm.venueId,
        timeSlotId: selectedSlotDetail.timeSlotId,
        dayOfWeek: selectedSlotDetail.dayOfWeek,
        description: slotAddForm.description,
        conflictOverride: slotAddForm.conflictOverride,
      });

      if (res.data.success) {
        showSuccess("Course added to slot successfully!");
        setSlotModalTab("list");
        setSlotAddConflicts([]);
        await fetchData();

        // Update selectedSlotDetail assignments array
        const newSched = [...schedule, res.data.assignment];
        refreshSlotDetail(newSched, selectedSlotDetail.dayOfWeek, selectedSlotDetail.startTime);
      }
    } catch (err) {
      if (err.response?.data?.conflicts) {
        setSlotAddConflicts(err.response.data.conflicts);
        showError(err.response.data.message || "Scheduling conflict detected");
      } else {
        showError(err.response?.data?.message || "Failed to add course to slot");
      }
    } finally {
      setUpdatingSlot(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // MOVE / RESCHEDULE COURSE
  // ═══════════════════════════════════════════════════════════

  const handleStartMove = (assignment) => {
    setMovingAssignment(assignment);
    setMoveForm({
      dayOfWeek: assignment.dayOfWeek,
      timeSlotId: assignment.timeSlotId?._id || assignment.timeSlotId || timeSlots[0]?._id || "",
      venueId: assignment.venueId?._id || assignment.venueId || venues[0]?._id || "",
      conflictOverride: false,
    });
    setMoveConflicts([]);
    setSlotModalTab("move");
  };

  const checkMoveConflicts = async (targetDay, targetSlotId, targetVenueId) => {
    if (!movingAssignment || !targetSlotId || !targetVenueId) return [];
    try {
      const res = await api.post("/assignments/check-conflict", {
        courseId: movingAssignment.courseId?._id || movingAssignment.courseId,
        venueId: targetVenueId,
        timeSlotId: targetSlotId,
        dayOfWeek: targetDay,
        excludeAssignmentId: movingAssignment._id,
      });
      return res.data.conflicts || [];
    } catch (err) {
      return [];
    }
  };

  const handleMoveParamChange = async (field, value) => {
    const updated = { ...moveForm, [field]: value };
    setMoveForm(updated);
    const conflicts = await checkMoveConflicts(updated.dayOfWeek, updated.timeSlotId, updated.venueId);
    setMoveConflicts(conflicts);
  };

  const handleExecuteMove = async (e) => {
    e.preventDefault();
    if (!movingAssignment || !moveForm.timeSlotId || !moveForm.venueId) {
      showError("Please specify a valid day, time slot, and venue");
      return;
    }

    setUpdatingSlot(true);
    try {
      const res = await api.put(`/assignments/course-to-venue-time/${movingAssignment._id}`, {
        dayOfWeek: moveForm.dayOfWeek,
        timeSlotId: moveForm.timeSlotId,
        venueId: moveForm.venueId,
        conflictOverride: moveForm.conflictOverride,
      });

      if (res.data.success) {
        showSuccess(`Moved ${movingAssignment.courseCode} to ${moveForm.dayOfWeek}!`);
        setSlotModalTab("list");
        setMovingAssignment(null);
        setMoveConflicts([]);
        await fetchData();

        // Update selectedSlotDetail if still viewing
        const updatedSched = schedule.map((s) => (s._id === movingAssignment._id ? res.data.assignment : s));
        refreshSlotDetail(updatedSched, selectedSlotDetail.dayOfWeek, selectedSlotDetail.startTime);
      }
    } catch (err) {
      if (err.response?.data?.conflicts) {
        setMoveConflicts(err.response.data.conflicts);
        showError(err.response.data.message || "Conflict detected during move");
      } else {
        showError(err.response?.data?.message || "Failed to move course");
      }
    } finally {
      setUpdatingSlot(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // EDIT COURSE DETAILS (VENUE, LECTURER, NOTES)
  // ═══════════════════════════════════════════════════════════

  const handleStartEdit = (assignment) => {
    setEditingAssignment(assignment);
    setEditForm({
      venueId: assignment.venueId?._id || assignment.venueId || "",
      lecturerId: assignment.lecturerId?._id || assignment.lecturerId || "",
      description: assignment.description || "",
    });
    setSlotModalTab("edit");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAssignment) return;

    setUpdatingSlot(true);
    try {
      const res = await api.put(`/assignments/course-to-venue-time/${editingAssignment._id}`, {
        venueId: editForm.venueId,
        lecturerId: editForm.lecturerId || null,
        description: editForm.description,
      });

      if (res.data.success) {
        showSuccess("Course details updated!");
        setSlotModalTab("list");
        setEditingAssignment(null);
        await fetchData();

        const updatedSched = schedule.map((s) => (s._id === editingAssignment._id ? res.data.assignment : s));
        refreshSlotDetail(updatedSched, selectedSlotDetail.dayOfWeek, selectedSlotDetail.startTime);
      }
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update course details");
    } finally {
      setUpdatingSlot(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // REMOVE COURSE FROM SLOT
  // ═══════════════════════════════════════════════════════════

  const handleRemoveCourseFromSlot = async (assignmentId, courseCode) => {
    if (!window.confirm(`Are you sure you want to remove ${courseCode} from this slot?`)) return;

    setUpdatingSlot(true);
    try {
      await api.delete(`/assignments/course-to-venue-time/${assignmentId}`);
      showSuccess(`Removed ${courseCode} from slot`);
      await fetchData();

      const updatedSched = schedule.filter((s) => s._id !== assignmentId);
      refreshSlotDetail(updatedSched, selectedSlotDetail.dayOfWeek, selectedSlotDetail.startTime);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to remove course");
    } finally {
      setUpdatingSlot(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // QUICK ASSIGN FROM TOP FORM / DRAWER
  // ═══════════════════════════════════════════════════════════

  const handleQuickAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignConflicts([]);

    try {
      const res = await api.post("/assignments/course-to-venue-time", assignForm);
      if (res.data.success) {
        showSuccess("Course assigned to schedule!");
        setShowAssign(false);
        setAssignForm({
          courseId: "",
          venueId: "",
          timeSlotId: "",
          dayOfWeek: "Monday",
          description: "",
          conflictOverride: false,
        });
        fetchData();
      }
    } catch (err) {
      if (err.response?.data?.conflicts) {
        setAssignConflicts(err.response.data.conflicts);
        showError(err.response.data.message || "Conflict detected");
      } else {
        showError(err.response?.data?.message || "Failed to assign course");
      }
    }
  };

  const openAssignForCourse = (course) => {
    setAssignForm({
      courseId: course.courseId?._id || course._id,
      venueId: venues[0]?._id || "",
      timeSlotId: timeSlots[0]?._id || "",
      dayOfWeek: "Monday",
      description: "",
      conflictOverride: false,
    });
    setAssignConflicts([]);
    setShowAssign(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ═══════════════════════════════════════════════════════════
  // EXPORT CSV
  // ═══════════════════════════════════════════════════════════

  const handleExportCSV = () => {
    if (filteredSchedule.length === 0) {
      showWarning("No timetable entries to export");
      return;
    }

    const exportData = filteredSchedule.map((s) => ({
      "Course Code": s.courseCode,
      "Course Title": s.courseTitle,
      "Level": s.courseId?.level ? `${s.courseId.level}L` : "N/A",
      "Departments": (s.courseId?.departments || []).join("; "),
      "Day": s.dayOfWeek,
      "Start Time": s.startTime,
      "End Time": s.endTime,
      "Venue": s.venueId?.name || s.venueName,
      "Lecturer": s.lecturerId?.fullName || s.lecturerName || "Unassigned",
      "Semester": semester,
      "Session Description": s.description || "",
    }));

    exportToCSV(exportData, `FUTMinna_Timetable_${user?.department || "Dept"}_${semester}_${selectedLevel}L.csv`);
    showSuccess("Timetable exported to CSV!");
  };

  // ═══════════════════════════════════════════════════════════
  // COMPUTED / FILTERED SCHEDULE
  // ═══════════════════════════════════════════════════════════

  const filteredSchedule = selectedLevel === "All"
    ? schedule
    : schedule.filter((s) => (s.courseId?.level === parseInt(selectedLevel)) || (s.level === parseInt(selectedLevel)));

  // Map: key `${day}-${startTime}` -> array of assignments
  const multiScheduleMap = {};
  filteredSchedule.forEach((s) => {
    const startTime = s.timeSlotId?.startTime || s.startTime;
    const day = s.dayOfWeek;
    if (day && startTime) {
      const key = `${day}-${startTime}`;
      if (!multiScheduleMap[key]) {
        multiScheduleMap[key] = [];
      }
      multiScheduleMap[key].push(s);
    }
  });

  const slotsByDay = {};
  DAY_ORDER.forEach((day) => {
    slotsByDay[day] = filteredSchedule.filter((s) => s.dayOfWeek === day);
  });

  const getSlotKey = (day, hour) => `${day}-${String(hour).padStart(2, "0")}:00`;

  // Courses filtered for unassigned drawer
  const filteredUnscheduledCourses = coursesWithQuota.filter((c) => {
    if (unscheduledFilterLevel !== "All" && c.courseId?.level !== parseInt(unscheduledFilterLevel)) {
      return false;
    }
    return true;
  });

  return (
    <div className="page" style={styles.page}>
      {/* Page Header */}
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Schedule Planning</h1>
          <p style={styles.subtitle}>
            Multi-lecture timetable scheduling & conflict management {user?.role !== "Admin" ? `for ${user?.department || "Department"}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <select style={styles.select} value={semester} onChange={(e) => setSemester(e.target.value)}>
            {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <button
            onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
            style={{
              ...styles.secondaryBtn,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: showUnscheduledDrawer ? "#e0f2fe" : "#fff",
              borderColor: showUnscheduledDrawer ? "#0284c7" : "#cbd5e1",
              color: showUnscheduledDrawer ? "#0369a1" : "#334155",
            }}
          >
            <FiLayers size={14} />
            Course Allocation ({quotaSummary.unscheduledCount + quotaSummary.partialCount} pending)
          </button>

          {canManageSchedule && (
            <button
              onClick={() => setShowAutoGenModal(true)}
              disabled={autoGenLoading}
              style={{
                ...styles.primaryBtn,
                background: "linear-gradient(135deg, #0f3460, #16213e)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiZap size={16} /> Auto-Generate Timetable
            </button>
          )}

          {canManageSchedule && (
            <button onClick={() => setShowAssign(!showAssign)} style={styles.primaryBtn}>
              + Quick Assign
            </button>
          )}

          <button onClick={handleAiSuggest} disabled={aiLoading} style={{ ...styles.aiBtn, opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? <><FiZap size={14} style={{ marginRight: 4 }} /> Analyzing...</> : <><FiZap size={14} style={{ marginRight: 4 }} /> AI Suggest</>}
          </button>
        </div>
      </div>

      {/* AI Suggestion Banner */}
      <AiSuggestionBanner
        suggestions={aiSuggestions?.suggestions || []}
        loading={aiLoading}
        summary={aiSuggestions?.summary}
        onDismiss={() => setAiSuggestions(null)}
        onApply={handleApplyAiSuggestion}
      />

      {/* Collapsible Unscheduled / Incomplete Courses Progress Drawer */}
      {showUnscheduledDrawer && (
        <div style={styles.drawerCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "#0f3460", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiLayers /> Course Slot Allocation Status ({semester})
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Track weekly credit unit hours scheduled per course. 1 Credit Unit = 1 Time Slot.
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Level:</span>
              {["All", 100, 200, 300, 400, 500].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setUnscheduledFilterLevel(lvl)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "14px",
                    border: unscheduledFilterLevel === lvl ? "none" : "1px solid #cbd5e1",
                    background: unscheduledFilterLevel === lvl ? "#0f3460" : "#fff",
                    color: unscheduledFilterLevel === lvl ? "#fff" : "#475569",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {lvl === "All" ? "All" : `${lvl}L`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {filteredUnscheduledCourses.map((c) => {
              const isFull = c.status === "completed";
              const isPartial = c.status === "partial";
              return (
                <div
                  key={c.courseId._id}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: isFull ? "1px solid #bbf7d0" : isPartial ? "1px solid #fed7aa" : "1px solid #fecaca",
                    background: isFull ? "#f0fdf4" : isPartial ? "#fffbeb" : "#fef2f2",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>{c.courseId.code}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: isFull ? "#dcfce7" : isPartial ? "#ffedd5" : "#fee2e2",
                          color: isFull ? "#15803d" : isPartial ? "#c2410c" : "#b91c1c",
                        }}
                      >
                        {c.allocatedSlots} / {c.maxSlots} slots {isFull ? "✓ Full" : isPartial ? "⏳ Partial" : "⚪ Unscheduled"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#475569", marginBottom: "4px" }}>{c.courseId.title}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "11px", color: "#64748b" }}>
                      <span>Level: <strong>{c.courseId.level}L</strong></span>
                      <span>•</span>
                      <span>Depts: <strong>{(c.courseId.departments || []).join(", ")}</strong></span>
                      <span>•</span>
                      <span>Lecturer: <strong>{c.lecturerId?.fullName || "Unassigned"}</strong></span>
                    </div>
                  </div>

                  {c.slots && c.slots.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#0369a1", background: "#e0f2fe", padding: "4px 8px", borderRadius: "6px" }}>
                      🕒 Assigned: {c.slots.map((s) => `${s.dayOfWeek.slice(0, 3)} ${s.startTime} (${s.venueName})`).join(", ")}
                    </div>
                  )}

                  {canManageSchedule && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                      <button
                        onClick={() => openAssignForCourse(c)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "none",
                          background: isFull ? "#64748b" : "#0f3460",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        {isFull ? "+ Extra Slot" : "Assign to Slot"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-Gen Prompt Modal */}
      {showAutoGenModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: "0 0 12px", color: "#1a1a2e", fontSize: "18px", fontWeight: "700" }}>
              ⚡ Automatic Timetable Generator
            </h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: "0 0 16px" }}>
              The constraint solver algorithmically schedules all unscheduled courses in 2-hour minimum consecutive blocks into optimal conflict-free venues and time slots across Monday to Friday. Multi-department cohort clashes are protected and concurrent lectures (up to 5 per slot) are supported.
            </p>

            <div style={{ margin: "0 0 20px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#334155", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoGenOverwrite}
                  onChange={(e) => setAutoGenOverwrite(e.target.checked)}
                />
                Clear existing timetable & regenerate everything from scratch
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => setShowAutoGenModal(false)}
                disabled={autoGenLoading}
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={autoGenLoading}
                style={{
                  ...styles.primaryBtn,
                  background: "linear-gradient(135deg, #0f3460, #1e3a8a)",
                  opacity: autoGenLoading ? 0.7 : 1,
                }}
              >
                {autoGenLoading ? "Generating Schedule..." : "Run Auto-Generator"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Gen Post-Run Diagnostics Modal */}
      {showAutoGenResultModal && autoGenResult && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: "620px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#0f3460", fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheckCircle color="#10b981" /> Timetable Generation Summary
              </h3>
              <button onClick={() => setShowAutoGenResultModal(false)} style={styles.closeIconBtn}>
                <FiX size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#16a34a" }}>{autoGenResult.scheduledCoursesCount || 0}</div>
                <div style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>Courses Scheduled</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>({autoGenResult.scheduledCount} total slots)</div>
              </div>

              <div style={{ background: autoGenResult.unplacedCount > 0 ? "#fef2f2" : "#f8fafc", border: autoGenResult.unplacedCount > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "800", color: autoGenResult.unplacedCount > 0 ? "#dc2626" : "#64748b" }}>{autoGenResult.unplacedCount || 0}</div>
                <div style={{ fontSize: "12px", color: autoGenResult.unplacedCount > 0 ? "#b91c1c" : "#64748b", fontWeight: "600" }}>Unplaced Courses</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Flagged for review</div>
              </div>

              <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#ca8a04" }}>{autoGenResult.unassignedLecturerCount || 0}</div>
                <div style={{ fontSize: "12px", color: "#a16207", fontWeight: "600" }}>Without Lecturer</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Set to "Unassigned"</div>
              </div>
            </div>

            {/* Unplaced Courses Detailed Table */}
            {autoGenResult.unplacedCourses && autoGenResult.unplacedCourses.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: "700", fontSize: "13px", color: "#dc2626" }}>
                  <FiAlertTriangle /> Flagged Unplaced Courses ({autoGenResult.unplacedCourses.length}):
                </div>
                <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid #fee2e2", borderRadius: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead style={{ background: "#fef2f2", color: "#991b1b" }}>
                      <tr>
                        <th style={{ padding: "8px", textAlign: "left" }}>Course</th>
                        <th style={{ padding: "8px", textAlign: "left" }}>Level</th>
                        <th style={{ padding: "8px", textAlign: "left" }}>Conflict Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {autoGenResult.unplacedCourses.map((uc, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #fee2e2", background: idx % 2 === 0 ? "#fff" : "#fffbfa" }}>
                          <td style={{ padding: "8px", fontWeight: "700" }}>{uc.courseCode}</td>
                          <td style={{ padding: "8px" }}>{uc.level}L</td>
                          <td style={{ padding: "8px", color: "#b91c1c" }}>{uc.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                  💡 <em>Tip: You can manually place these courses into the timetable by clicking on any available time slot.</em>
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAutoGenResultModal(false)} style={styles.primaryBtn}>
                View Timetable Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Slot Management Modal (Multi-Course Slot Manager) */}
      {selectedSlotDetail && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: "650px", maxHeight: "90vh", overflowY: "auto" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: "0 0 2px", color: "#0f3460", fontSize: "18px", fontWeight: "700" }}>
                  {selectedSlotDetail.dayOfWeek}, {selectedSlotDetail.startTime} – {selectedSlotDetail.endTime}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Capacity: <strong>{selectedSlotDetail.assignments.length} / 5 concurrent lectures</strong>
                </span>
              </div>
              <button onClick={() => setSelectedSlotDetail(null)} style={styles.closeIconBtn}>
                <FiX size={20} />
              </button>
            </div>

            {/* Tab: LIST OF ASSIGNED COURSES */}
            {slotModalTab === "list" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                    Scheduled Classes ({selectedSlotDetail.assignments.length})
                  </span>
                  {canManageSchedule && selectedSlotDetail.assignments.length < 5 && (
                    <button
                      onClick={() => setSlotModalTab("add")}
                      style={{
                        ...styles.primaryBtn,
                        padding: "6px 12px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiPlus size={14} /> Add Course to this Slot
                    </button>
                  )}
                </div>

                {selectedSlotDetail.assignments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                    <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#64748b" }}>
                      No classes are currently scheduled for <strong>{selectedSlotDetail.dayOfWeek}</strong> at <strong>{selectedSlotDetail.startTime}</strong>.
                    </p>
                    {canManageSchedule && (
                      <button onClick={() => setSlotModalTab("add")} style={styles.primaryBtn}>
                        + Add First Class to Slot
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {selectedSlotDetail.assignments.map((assignment) => (
                      <div
                        key={assignment._id}
                        style={{
                          padding: "14px",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          background: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "800", fontSize: "15px", color: "#0f3460" }}>
                              {assignment.courseCode}
                            </span>
                            {assignment.courseId?.level && (
                              <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                                {assignment.courseId.level}L
                              </span>
                            )}
                            {assignment.courseId?.departments && (
                              <span style={{ fontSize: "10px", background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "6px" }}>
                                {assignment.courseId.departments.join(", ")}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: "500", color: "#334155", marginBottom: "4px" }}>
                            {assignment.courseTitle}
                          </div>
                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "#64748b" }}>
                            <span>📍 Venue: <strong>{assignment.venueId?.name || assignment.venueName}</strong></span>
                            <span>👤 Lecturer: <strong>{assignment.lecturerId?.fullName || assignment.lecturerName || "Unassigned"}</strong></span>
                          </div>
                          {assignment.description && (
                            <div style={{ fontSize: "11px", color: "#2563eb", fontStyle: "italic", marginTop: "4px" }}>
                              📝 {assignment.description}
                            </div>
                          )}
                        </div>

                        {canManageSchedule && (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              onClick={() => handleStartMove(assignment)}
                              title="Move / Reschedule this course to another slot"
                              style={{ ...styles.actionIconBtn, background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}
                            >
                              <FiMove size={14} /> Move
                            </button>
                            <button
                              onClick={() => handleStartEdit(assignment)}
                              title="Edit venue, lecturer, or description"
                              style={{ ...styles.actionIconBtn, background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                            >
                              <FiEdit2 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleRemoveCourseFromSlot(assignment._id, assignment.courseCode)}
                              title="Remove course from this slot"
                              style={{ ...styles.actionIconBtn, background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}
                            >
                              <FiTrash2 size={14} /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: ADD COURSE TO THIS SLOT */}
            {slotModalTab === "add" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f3460" }}>
                    + Add Course to {selectedSlotDetail.dayOfWeek} at {selectedSlotDetail.startTime}
                  </h4>
                  <button onClick={() => setSlotModalTab("list")} style={styles.secondaryBtn}>
                    Back to List
                  </button>
                </div>

                {slotAddConflicts.length > 0 && (
                  <div style={styles.conflictCard}>
                    <h5 style={{ margin: "0 0 6px", color: "#c62828", fontSize: "13px" }}>⚠️ Conflict Detected:</h5>
                    {slotAddConflicts.map((c, i) => (
                      <div key={i} style={{ fontSize: "12px", color: "#b91c1c", marginBottom: "2px" }}>
                        • {c.message}
                      </div>
                    ))}
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#991b1b", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={slotAddForm.conflictOverride}
                        onChange={(e) => setSlotAddForm({ ...slotAddForm, conflictOverride: e.target.checked })}
                      />
                      <strong>Override Conflict</strong> (I confirm this assignment)
                    </label>
                  </div>
                )}

                <form onSubmit={handleAddCourseToSlotSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <label style={styles.label}>Select Course</label>
                      <label style={{ fontSize: "11px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="checkbox"
                          checked={showFullQuotaCourses}
                          onChange={(e) => setShowFullQuotaCourses(e.target.checked)}
                        />
                        Show courses that reached credit unit quota
                      </label>
                    </div>
                    <select
                      style={styles.select}
                      value={slotAddForm.courseId}
                      onChange={(e) => handleSlotAddCourseChange(e.target.value)}
                      required
                    >
                      <option value="">-- Choose a course --</option>
                      <optgroup label="Pending / Incomplete Allocation">
                        {coursesWithQuota
                          .filter((c) => c.status !== "completed")
                          .map((c) => (
                            <option key={c.courseId._id} value={c.courseId._id}>
                              {c.courseId.code} - {c.courseId.title} ({c.courseId.level}L) [{c.allocatedSlots}/{c.maxSlots} slots]
                            </option>
                          ))}
                      </optgroup>
                      {showFullQuotaCourses && (
                        <optgroup label="Fully Allocated (Max Quota Reached)">
                          {coursesWithQuota
                            .filter((c) => c.status === "completed")
                            .map((c) => (
                              <option key={c.courseId._id} value={c.courseId._id}>
                                {c.courseId.code} - {c.courseId.title} ({c.courseId.level}L) [✓ {c.allocatedSlots}/{c.maxSlots} slots]
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Select Venue</label>
                    <select
                      style={styles.select}
                      value={slotAddForm.venueId}
                      onChange={(e) => handleSlotAddVenueChange(e.target.value)}
                      required
                    >
                      <option value="">-- Choose venue --</option>
                      {venues.map((v) => {
                        const isVenueBookedInSlot = selectedSlotDetail.assignments.some(
                          (a) => (a.venueId?._id || a.venueId)?.toString() === v._id.toString()
                        );
                        return (
                          <option key={v._id} value={v._id}>
                            {v.name} ({v.building} - Capacity: {v.capacity}) {isVenueBookedInSlot ? "⚠️ [Occupied in this slot]" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Session Description / Instructions (Optional)</label>
                    <textarea
                      rows={2}
                      style={{ ...styles.select, width: "100%", fontFamily: "inherit", resize: "vertical" }}
                      placeholder="Add session notes, quiz announcement, or lab instructions..."
                      value={slotAddForm.description}
                      onChange={(e) => setSlotAddForm({ ...slotAddForm, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button type="button" onClick={() => setSlotModalTab("list")} style={styles.secondaryBtn}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingSlot || (slotAddConflicts.length > 0 && !slotAddForm.conflictOverride)}
                      style={{
                        ...styles.primaryBtn,
                        opacity: updatingSlot || (slotAddConflicts.length > 0 && !slotAddForm.conflictOverride) ? 0.6 : 1,
                      }}
                    >
                      {updatingSlot ? "Adding..." : "Add to Slot"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: MOVE / RESCHEDULE COURSE */}
            {slotModalTab === "move" && movingAssignment && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f3460", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FiMove /> Move {movingAssignment.courseCode} ({movingAssignment.courseTitle})
                  </h4>
                  <button onClick={() => setSlotModalTab("list")} style={styles.secondaryBtn}>
                    Back to List
                  </button>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", color: "#475569" }}>
                  Currently Scheduled: <strong>{movingAssignment.dayOfWeek}</strong> at <strong>{movingAssignment.startTime} – {movingAssignment.endTime}</strong> in <strong>{movingAssignment.venueName || movingAssignment.venueId?.name}</strong>
                </div>

                {moveConflicts.length > 0 && (
                  <div style={styles.conflictCard}>
                    <h5 style={{ margin: "0 0 6px", color: "#c62828", fontSize: "13px" }}>⚠️ Conflict Detected in Target Slot:</h5>
                    {moveConflicts.map((c, i) => (
                      <div key={i} style={{ fontSize: "12px", color: "#b91c1c", marginBottom: "2px" }}>
                        • {c.message}
                      </div>
                    ))}
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#991b1b", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={moveForm.conflictOverride}
                        onChange={(e) => setMoveForm({ ...moveForm, conflictOverride: e.target.checked })}
                      />
                      <strong>Override Conflict</strong>
                    </label>
                  </div>
                )}

                <form onSubmit={handleExecuteMove} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={styles.label}>Target Day of Week</label>
                      <select
                        style={styles.select}
                        value={moveForm.dayOfWeek}
                        onChange={(e) => handleMoveParamChange("dayOfWeek", e.target.value)}
                      >
                        {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={styles.label}>Target Time Slot</label>
                      <select
                        style={styles.select}
                        value={moveForm.timeSlotId}
                        onChange={(e) => handleMoveParamChange("timeSlotId", e.target.value)}
                        required
                      >
                        {timeSlots.map((ts) => (
                          <option key={ts._id} value={ts._id}>{ts.startTime} - {ts.endTime}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Target Venue</label>
                    <select
                      style={styles.select}
                      value={moveForm.venueId}
                      onChange={(e) => handleMoveParamChange("venueId", e.target.value)}
                      required
                    >
                      {venues.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.building} - Capacity: {v.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button type="button" onClick={() => setSlotModalTab("list")} style={styles.secondaryBtn}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingSlot || (moveConflicts.length > 0 && !moveForm.conflictOverride)}
                      style={{
                        ...styles.primaryBtn,
                        background: "#16a34a",
                        opacity: updatingSlot || (moveConflicts.length > 0 && !moveForm.conflictOverride) ? 0.6 : 1,
                      }}
                    >
                      {updatingSlot ? "Moving..." : "Confirm & Move Slot"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: EDIT COURSE DETAILS */}
            {slotModalTab === "edit" && editingAssignment && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f3460" }}>
                    ✏️ Edit {editingAssignment.courseCode} Details
                  </h4>
                  <button onClick={() => setSlotModalTab("list")} style={styles.secondaryBtn}>
                    Back to List
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={styles.label}>Venue</label>
                    <select
                      style={styles.select}
                      value={editForm.venueId}
                      onChange={(e) => setEditForm({ ...editForm, venueId: e.target.value })}
                      required
                    >
                      {venues.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.building} - Capacity: {v.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Assigned Lecturer</label>
                    <select
                      style={styles.select}
                      value={editForm.lecturerId}
                      onChange={(e) => setEditForm({ ...editForm, lecturerId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {lecturers.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.fullName} ({l.department || "Lecturer"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Session Description / Instructions</label>
                    <textarea
                      rows={3}
                      style={{ ...styles.select, width: "100%", fontFamily: "inherit", resize: "vertical" }}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button type="button" onClick={() => setSlotModalTab("list")} style={styles.secondaryBtn}>
                      Cancel
                    </button>
                    <button type="submit" disabled={updatingSlot} style={styles.primaryBtn}>
                      {updatingSlot ? "Saving..." : "Save Details"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Assign Form Card (Top Form) */}
      {showAssign && (
        <div style={styles.formCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={styles.formTitle}>Quick Assign Course to Venue & Time</h3>
            <button onClick={() => setShowAssign(false)} style={styles.closeIconBtn}><FiX size={18} /></button>
          </div>

          {assignConflicts.length > 0 && (
            <div style={styles.conflictCard}>
              <h4 style={{ margin: "0 0 8px", color: "#c62828" }}>Conflicts Detected</h4>
              {assignConflicts.map((c, i) => (
                <div key={i} style={{ fontSize: "13px", color: "#c62828", marginBottom: "4px" }}>
                  • {c.message}
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#991b1b", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={assignForm.conflictOverride}
                  onChange={(e) => setAssignForm({ ...assignForm, conflictOverride: e.target.checked })}
                />
                <strong>Override Conflict</strong>
              </label>
            </div>
          )}

          <form onSubmit={handleQuickAssignSubmit} style={styles.form}>
            <div className="form-row" style={styles.formRow}>
              <div>
                <label style={styles.label}>Course</label>
                <select
                  style={styles.select}
                  value={assignForm.courseId}
                  onChange={(e) => setAssignForm({ ...assignForm, courseId: e.target.value })}
                  required
                >
                  <option value="">Select course to schedule</option>
                  <optgroup label="Unscheduled & Incomplete">
                    {coursesWithQuota
                      .filter((c) => c.status !== "completed")
                      .map((c) => (
                        <option key={c.courseId._id} value={c.courseId._id}>
                          {c.courseId.code} - {c.courseId.title} ({c.courseId.level}L) [{c.allocatedSlots}/{c.maxSlots} slots]
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="All Active Courses">
                    {allCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} - {c.title} ({c.level}L)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label style={styles.label}>Venue</label>
                <select
                  style={styles.select}
                  value={assignForm.venueId}
                  onChange={(e) => setAssignForm({ ...assignForm, venueId: e.target.value })}
                  required
                >
                  <option value="">Select a venue</option>
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>{v.name} (Cap: {v.capacity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Day of Week</label>
                <select
                  style={styles.select}
                  value={assignForm.dayOfWeek}
                  onChange={(e) => setAssignForm({ ...assignForm, dayOfWeek: e.target.value })}
                >
                  {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={styles.label}>Time Slot</label>
                <select
                  style={styles.select}
                  value={assignForm.timeSlotId}
                  onChange={(e) => setAssignForm({ ...assignForm, timeSlotId: e.target.value })}
                  required
                >
                  <option value="">Select a time slot</option>
                  {timeSlots.map((ts) => (
                    <option key={ts._id} value={ts._id}>{ts.startTime} - {ts.endTime}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowAssign(false)} style={styles.secondaryBtn}>Cancel</button>
              <button type="submit" style={styles.primaryBtn}>Assign Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & View Mode Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginRight: "4px" }}>Filter Level:</span>
          {["All", 100, 200, 300, 400, 500].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: selectedLevel === lvl ? "none" : "1px solid #cbd5e1",
                background: selectedLevel === lvl ? "#0f3460" : "#fff",
                color: selectedLevel === lvl ? "#fff" : "#475569",
                fontWeight: "600",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {lvl === "All" ? "All Levels" : `${lvl}L`}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={styles.viewToggle}>
            <button onClick={() => setView("calendar")} style={{ ...styles.viewBtn, ...(view === "calendar" ? styles.viewBtnActive : {}) }}>
              <FiCalendar size={14} style={{ marginRight: 6 }} /> Calendar Grid
            </button>
            <button onClick={() => setView("list")} style={{ ...styles.viewBtn, ...(view === "list" ? styles.viewBtnActive : {}) }}>
              <FiList size={14} style={{ marginRight: 6 }} /> List View
            </button>
          </div>
          <button onClick={handleExportCSV} style={{ ...styles.secondaryBtn, display: "flex", alignItems: "center", gap: "6px" }}>
            <FiDownload size={14} /> Export CSV
          </button>
          <button onClick={() => window.print()} style={{ ...styles.secondaryBtn, display: "flex", alignItems: "center", gap: "6px" }}>
            <FiPrinter size={14} /> Print
          </button>
        </div>
      </div>

      {/* Main Schedule Display: List or Multi-Course Calendar Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading schedule...</div>
      ) : view === "list" ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Course</th>
                <th style={styles.th}>Level</th>
                <th style={styles.th}>Departments</th>
                <th style={styles.th}>Lecturer</th>
                <th style={styles.th}>Venue</th>
                <th style={styles.th}>Day</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedule.length === 0 ? (
                <tr><td colSpan="9" style={{ ...styles.td, textAlign: "center" }}>No scheduled courses for level {selectedLevel}</td></tr>
              ) : filteredSchedule.map((s) => (
                <tr key={s._id} style={{ ...styles.tr, cursor: "pointer" }} onClick={() => handleCellClick(s.dayOfWeek, parseInt(s.startTime?.split(":")[0]))}>
                  <td style={styles.td}><strong>{s.courseCode}</strong> - {s.courseTitle}</td>
                  <td style={styles.td}>{s.courseId?.level ? `${s.courseId.level}L` : "N/A"}</td>
                  <td style={styles.td}>{(s.courseId?.departments || []).join(", ") || "All"}</td>
                  <td style={styles.td}>{s.lecturerId?.fullName || s.lecturerName || "Unassigned"}</td>
                  <td style={styles.td}>{s.venueId?.name || s.venueName}</td>
                  <td style={styles.td}>{s.dayOfWeek}</td>
                  <td style={styles.td}>{s.timeSlotId?.startTime || s.startTime} – {s.timeSlotId?.endTime || s.endTime}</td>
                  <td style={styles.td}>{s.description ? <em>{s.description}</em> : <span style={{ color: "#aaa" }}>None</span>}</td>
                  <td style={styles.td}>
                    {canManageSchedule && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCourseFromSlot(s._id, s.courseCode);
                        }}
                        style={styles.deleteBtn}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cal-wrapper" style={styles.calendarWrapper}>
          <div style={styles.calendarHeader}>
            <div style={styles.timeColumn}></div>
            {DAY_ORDER.map((day) => (
              <div key={day} style={styles.dayColumnHeader}>
                <div style={styles.dayName}>{day}</div>
                <div style={styles.dayCount}>{slotsByDay?.[day]?.length || 0} classes</div>
              </div>
            ))}
          </div>

          <div style={styles.calendarBody}>
            {HOURS.map((hour) => {
              const hourNum = parseInt(hour);
              const isBreak = hourNum === 13;

              return (
                <div key={hour} style={styles.calendarRow}>
                  <div style={{
                    ...styles.timeLabel,
                    color: isBreak ? "#dc2626" : "#333",
                    fontWeight: isBreak ? "600" : "400",
                  }}>
                    {isBreak ? <FiSlash size={14} /> : hour}
                  </div>

                  {DAY_ORDER.map((day) => {
                    const key = getSlotKey(day, hourNum);
                    const slotAssignments = multiScheduleMap[key] || [];

                    if (isBreak) {
                      return (
                        <div key={day} style={styles.breakCell}>
                          <span style={{ fontSize: "11px", color: "#999" }}>LUNCH BREAK</span>
                        </div>
                      );
                    }

                    if (slotAssignments.length > 0) {
                      return (
                        <div
                          key={day}
                          style={styles.assignmentCell}
                          title={`Click to view/manage all ${slotAssignments.length} lectures in this slot (${day} at ${hour}:00)`}
                          onClick={() => handleCellClick(day, hourNum)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              padding: "1px 6px",
                              borderRadius: "8px",
                              background: slotAssignments.length >= 5 ? "#fee2e2" : "#e0f2fe",
                              color: slotAssignments.length >= 5 ? "#b91c1c" : "#0369a1",
                            }}>
                              {slotAssignments.length}/5 classes
                            </span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {slotAssignments.slice(0, 3).map((assignment) => (
                              <div
                                key={assignment._id}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "6px",
                                  padding: "4px 6px",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={styles.cellCourseCode}>{assignment.courseCode}</span>
                                  {assignment.courseId?.level && (
                                    <span style={{ fontSize: "9px", background: "#f1f5f9", color: "#475569", padding: "1px 4px", borderRadius: "4px", fontWeight: "700" }}>
                                      {assignment.courseId.level}L
                                    </span>
                                  )}
                                </div>
                                <div style={styles.cellVenue}>📍 {assignment.venueId?.name || assignment.venueName}</div>
                                <div style={styles.cellLecturer}>👤 {assignment.lecturerId?.fullName || assignment.lecturerName || "Unassigned"}</div>
                              </div>
                            ))}
                            {slotAssignments.length > 3 && (
                              <div style={{ fontSize: "10px", color: "#0f3460", fontWeight: "700", textAlign: "center", background: "#f1f5f9", borderRadius: "4px", padding: "2px" }}>
                                + {slotAssignments.length - 3} more class{slotAssignments.length - 3 > 1 ? "es" : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={day}
                        style={styles.emptyCell}
                        title={`Click to assign course to ${day} at ${hour}:00`}
                        onClick={() => handleCellClick(day, hourNum)}
                      >
                        <span style={{ fontSize: "11px", color: "#94a3b8", opacity: 0.6 }}>+ click slot</span>
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
  page: { padding: "32px", maxWidth: "1300px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "15px", color: "#666", margin: 0 },
  primaryBtn: { padding: "10px 18px", borderRadius: "8px", border: "none", background: "#0f3460", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  secondaryBtn: { padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" },
  aiBtn: { padding: "10px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #4285f4, #34a853)", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "13px", outline: "none" },
  drawerCard: { padding: "20px", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", marginBottom: "20px" },
  formCard: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: "1px solid #eee", marginBottom: "24px" },
  formTitle: { fontSize: "18px", fontWeight: "600", color: "#333", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "4px", display: "block" },
  conflictCard: { padding: "12px 16px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", marginBottom: "14px" },
  viewToggle: { display: "flex", gap: "4px" },
  viewBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center" },
  viewBtnActive: { background: "#0f3460", color: "#fff", borderColor: "#0f3460" },
  tableContainer: { borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "14px 16px", textAlign: "left", fontWeight: "600", fontSize: "13px", color: "#666", borderBottom: "2px solid #eee", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "12px 16px", fontSize: "13px", color: "#333" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  deleteBtn: { padding: "5px 10px", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  actionIconBtn: { padding: "5px 9px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
  closeIconBtn: { background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", padding: "4px", borderRadius: "6px" },
  calendarWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
  calendarHeader: { display: "grid", gridTemplateColumns: "70px repeat(5, 1fr)", borderBottom: "2px solid #0f3460", background: "#f8fafc" },
  timeColumn: { padding: "12px 8px" },
  dayColumnHeader: { padding: "12px 8px", textAlign: "center", borderLeft: "1px solid #e2e8f0" },
  dayName: { fontWeight: "700", fontSize: "14px", color: "#0f3460" },
  dayCount: { fontSize: "11px", color: "#94a3b8", marginTop: "2px" },
  calendarBody: {},
  calendarRow: { display: "grid", gridTemplateColumns: "70px repeat(5, 1fr)", borderBottom: "1px solid #f1f5f9" },
  timeLabel: { padding: "8px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #e2e8f0", background: "#f8fafc" },
  breakCell: { display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", borderLeft: "1px solid #fecaca", minHeight: "68px" },
  assignmentCell: { padding: "6px", minHeight: "76px", cursor: "pointer", borderLeft: "1px solid #e2e8f0", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "4px", background: "#f8fafc" },
  emptyCell: { borderLeft: "1px solid #e2e8f0", minHeight: "76px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" },
  cellCourseCode: { fontWeight: "700", fontSize: "12px", color: "#1a1a2e" },
  cellVenue: { fontSize: "10px", color: "#475569" },
  cellLecturer: { fontSize: "10px", color: "#64748b" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" },
  modalCard: { background: "#fff", width: "100%", maxWidth: "560px", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", border: "1px solid #e2e8f0" },
};

export default SchedulePlanning;
