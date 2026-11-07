import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { SEMESTERS } from "../utils/helpers.js";
import { showSuccess, showError } from "../utils/toast.js";
import { FiAlertTriangle } from "react-icons/fi";

const CourseAllocation = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState("1st Semester");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: "", lecturerId: "", semester: "1st Semester" });
  const [error, setError] = useState("");
  const [workloadWarning, setWorkloadWarning] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
    fetchLecturers();
  }, [semesterFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (semesterFilter) params.semester = semesterFilter;
      if (search) params.search = search;
      if (user?.role !== "Admin" && user?.department) {
        params.department = user.department;
      }
      const res = await api.get("/assignments/course-to-lecturer", { params });
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const params = { limit: 200 };
      if (user?.role !== "Admin" && user?.department) {
        params.department = user.department;
      }
      const res = await api.get("/courses", { params });
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLecturers = async () => {
    try {
      const params = {};
      if (user?.role !== "Admin" && user?.department) {
        params.department = user.department;
      }
      const res = await api.get("/users/lecturers", { params });
      setLecturers(res.data.lecturers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWithOverride = async () => {
    try {
      const res = await api.post("/assignments/course-to-lecturer", {
        ...form,
        overrideReason: "HOD approved override",
      });
      if (res.data.success) {
        showSuccess("Course assigned successfully (override)");
        setShowForm(false);
        setForm({ courseId: "", lecturerId: "", semester: "1st Semester" });
        setWorkloadWarning(null);
        fetchAssignments();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create assignment";
      setError(msg);
      showError(msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setWorkloadWarning(null);
    try {
      const res = await api.post("/assignments/course-to-lecturer", form);
      if (res.data.success) {
        showSuccess("Course assigned successfully");
        setShowForm(false);
        setForm({ courseId: "", lecturerId: "", semester: "1st Semester" });
        fetchAssignments();
      }
    } catch (err) {
      if (err.response?.data?.code === "WORKLOAD_EXCEEDED") {
        setWorkloadWarning(err.response.data);
      } else {
        const msg = err.response?.data?.message || "Failed to create assignment";
        setError(msg);
        showError(msg);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await api.delete(`/assignments/course-to-lecturer/${id}`);
      showSuccess("Assignment removed successfully");
      fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to remove assignment");
    }
  };

  const usedCourseMap = new Map();
  assignments.forEach((a) => {
    if (a.courseId?._id) {
      usedCourseMap.set(a.courseId._id, a.lecturerId?.fullName || a.lecturerName);
    }
  });

  const handleReassign = (assignment) => {
    setForm({
      courseId: assignment.courseId?._id || "",
      lecturerId: assignment.lecturerId?._id || "",
      semester: assignment.semester || "1st Semester",
    });
    setShowForm(true);
    setError("");
    setWorkloadWarning(null);
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Course Allocation</h1>
          <p style={styles.subtitle}>Assign courses to lecturers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.primaryBtn}>+ Assign / Reassign Course</button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Assign or Reassign Course to Staff</h3>
          {error && <div style={styles.error}>{error}</div>}

          {workloadWarning && (
            <div style={styles.warningCard}>
              <p style={{ fontWeight: "600", margin: "0 0 4px" }}>
                <FiAlertTriangle size={14} style={{ marginRight: 6 }} /> Workload Exceeded
              </p>
              <p style={{ margin: "0 0 12px", fontSize: "14px" }}>
                {workloadWarning.lecturerName} already has {workloadWarning.currentWorkload} courses assigned.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleCreateWithOverride} style={styles.warningBtn}>Proceed Anyway</button>
                <button onClick={() => setWorkloadWarning(null)} style={styles.secondaryBtn}>Cancel</button>
              </div>
            </div>
          )}

          {!workloadWarning && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div className="form-row" style={styles.formRow}>
                <div>
                  <label style={styles.label}>Course</label>
                  <select style={styles.select} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
                    <option value="">Select a course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} - {c.title} {usedCourseMap.has(c._id) ? `(Currently: ${usedCourseMap.get(c._id)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Teaching Staff</label>
                  <select style={styles.select} value={form.lecturerId} onChange={(e) => setForm({ ...form, lecturerId: e.target.value })} required>
                    <option value="">Select teaching staff</option>
                    {lecturers.map((l) => (
                      <option key={l._id} value={l._id}>{l.fullName} ({l.role})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Semester</label>
                <select style={styles.select} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                  {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => { setShowForm(false); setWorkloadWarning(null); }} style={styles.secondaryBtn}>Cancel</button>
                <button type="submit" style={styles.primaryBtn}>Save Allocation</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="toolbar" style={styles.toolbar}>
        <input style={styles.searchInput} placeholder="Search courses or lecturers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={styles.select} value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
          {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Course Code</th>
              <th style={styles.th}>Course Title</th>
              <th style={styles.th}>Lecturer</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Override</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>Loading...</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>No assignments found</td></tr>
            ) : assignments.map((a) => (
              <tr key={a._id} style={styles.tr}>
                <td style={styles.td}><strong>{a.courseId?.code || a.courseCode}</strong></td>
                <td style={styles.td}>{a.courseId?.title || a.courseTitle}</td>
                <td style={styles.td}>{a.lecturerId?.fullName || a.lecturerName}</td>
                <td style={styles.td}>{a.semester}</td>
                <td style={styles.td}>
                  {a.workloadOverride ? <span style={{ color: "#e67e22", fontWeight: "600", fontSize: "12px" }}>Override</span> : "—"}
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => handleReassign(a)} style={{ ...styles.secondaryBtn, padding: "4px 8px", fontSize: "12px" }}>Reassign</button>
                    <button onClick={() => handleDelete(a._id)} style={styles.deleteBtn}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  page: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "16px", color: "#666", margin: 0 },
  primaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0f3460", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  secondaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "2px solid #ddd", background: "#fff", color: "#333", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  warningBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#e67e22", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  formCard: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee", marginBottom: "24px" },
  formTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" },
  select: { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  label: { fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "6px", display: "block" },
  error: { padding: "10px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px", marginBottom: "12px" },
  warningCard: { padding: "16px", borderRadius: "8px", background: "#fff8e1", border: "1px solid #ffe082", marginBottom: "16px" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "250px", padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  tableContainer: { borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "14px 16px", textAlign: "left", fontWeight: "600", fontSize: "13px", color: "#666", borderBottom: "2px solid #eee", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#333" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  deleteBtn: { padding: "5px 10px", borderRadius: "4px", border: "none", background: "#e74c3c", color: "#fff", fontSize: "12px", cursor: "pointer" },
};

export default CourseAllocation;
