import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { LEVELS, SEMESTERS, formatDate } from "../utils/helpers.js";
import { showSuccess, showError } from "../utils/toast.js";

const CourseManagement = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({
    code: "", title: "", creditUnits: 3, level: 200,
    departments: ["Computer Science"], semester: "1st Semester", description: "",
  });
  const [error, setError] = useState("");

  const canEdit = ["Admin", "Exam Officer"].includes(user?.role);

  useEffect(() => {
    fetchCourses();
    fetchAcademicData();
  }, [page, levelFilter, semesterFilter, search]);

  const fetchAcademicData = async () => {
    try {
      const [sRes, dRes] = await Promise.all([
        api.get("/schools"),
        api.get("/departments"),
      ]);
      setSchools(sRes.data.schools || []);
      setDepartments(dRes.data.departments || []);
    } catch (err) {
      console.error("Failed to fetch academic data:", err);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (levelFilter) params.level = levelFilter;
      if (semesterFilter) params.semester = semesterFilter;
      const res = await api.get("/courses", { params });
      setCourses(res.data.courses || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptName) => {
    const current = form.departments || [];
    if (current.includes(deptName)) {
      setForm({ ...form, departments: current.filter((d) => d !== deptName) });
    } else {
      setForm({ ...form, departments: [...current, deptName] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.departments || form.departments.length === 0) {
      setError("Please select at least one department");
      return;
    }
    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse._id}`, form);
        showSuccess("Course updated successfully");
      } else {
        await api.post("/courses", form);
        showSuccess("Course created successfully");
      }
      setShowForm(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save course";
      setError(msg);
      showError(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.delete(`/courses/${id}`);
      showSuccess("Course deleted successfully");
      fetchCourses();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete course");
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setForm({
      code: course.code, title: course.title, creditUnits: course.creditUnits,
      level: course.level, departments: course.departments || [], semester: course.semester,
      description: course.description || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ code: "", title: "", creditUnits: 3, level: 200, departments: ["Computer Science"], semester: "1st Semester", description: "" });
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Course Management</h1>
          <p style={styles.subtitle}>Manage courses and department enrollments across schools</p>
        </div>
        {canEdit && (
          <button onClick={() => { setShowForm(!showForm); setEditingCourse(null); resetForm(); }} style={styles.primaryBtn}>
            + Add Course
          </button>
        )}
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editingCourse ? "Edit Course" : "Create New Course"}</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-row" style={styles.formRow}>
              <input style={styles.input} placeholder="Course Code (e.g. CSC 211)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required disabled={!!editingCourse} />
              <input style={styles.input} placeholder="Course Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-row" style={styles.formRow}>
              <select style={styles.select} value={form.creditUnits} onChange={(e) => setForm({ ...form, creditUnits: parseInt(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6].map((u) => <option key={u} value={u}>{u} Credit Units</option>)}
              </select>
              <select style={styles.select} value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}>
                {LEVELS.map((l) => <option key={l} value={l}>{l} Level</option>)}
              </select>
            </div>
            <div className="form-row" style={styles.formRow}>
              <select style={styles.select} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input style={styles.input} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Multi-Department & Cross-School Selection Box */}
            <div style={styles.deptSelectorBox}>
              <div style={styles.deptSelectorHeader}>
                <strong>Enrolled Departments (Same & Cross-School)</strong>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Select all departments taking this course</span>
              </div>
              <div style={styles.schoolGroupContainer}>
                {schools.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "#64748b" }}>Loading departments...</div>
                ) : (
                  schools.map((school) => {
                    const schoolDepts = departments.filter(
                      (d) => (d.schoolId?._id || d.schoolId) === school._id || d.schoolName === school.name
                    );
                    if (schoolDepts.length === 0) return null;
                    return (
                      <div key={school._id} style={styles.schoolDeptGroup}>
                        <div style={styles.schoolBadge}>{school.code} — {school.name}</div>
                        <div style={styles.deptCheckGrid}>
                          {schoolDepts.map((d) => {
                            const isChecked = form.departments.includes(d.name);
                            return (
                              <label key={d._id} style={{ ...styles.deptCheckLabel, ...(isChecked ? styles.deptCheckActive : {}) }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleDepartment(d.name)}
                                />
                                {d.name} ({d.code})
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); }} style={styles.secondaryBtn}>Cancel</button>
              <button type="submit" style={styles.primaryBtn}>{editingCourse ? "Update" : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar" style={styles.toolbar}>
        <input style={styles.searchInput} placeholder="Search by code or title..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select style={styles.select} value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}>
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select style={styles.select} value={semesterFilter} onChange={(e) => { setSemesterFilter(e.target.value); setPage(1); }}>
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Level</th>
              <th style={styles.th}>Credits</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Enrolled Departments</th>
              {canEdit && <th style={styles.th}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canEdit ? 7 : 6} style={{ ...styles.td, textAlign: "center" }}>Loading...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={canEdit ? 7 : 6} style={{ ...styles.td, textAlign: "center" }}>No courses found</td></tr>
            ) : courses.map((c) => (
              <tr key={c._id} style={styles.tr}>
                <td style={styles.td}><strong>{c.code}</strong></td>
                <td style={styles.td}>{c.title}</td>
                <td style={styles.td}>{c.level}</td>
                <td style={styles.td}>{c.creditUnits}</td>
                <td style={styles.td}>{c.semester}</td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {c.departments && c.departments.length > 0 ? (
                      c.departments.map((dept, idx) => (
                        <span key={idx} style={styles.deptChip}>{dept}</span>
                      ))
                    ) : (
                      <span style={{ color: "#94a3b8" }}>None</span>
                    )}
                  </div>
                </td>
                {canEdit && (
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleEdit(c)} style={styles.editBtn}>Edit</button>
                      <button onClick={() => handleDelete(c._id)} style={styles.deleteBtn}>Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} style={styles.pageBtn}>← Prev</button>
          <span style={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} style={styles.pageBtn}>Next →</button>
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
  primaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0f3460", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  secondaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "2px solid #ddd", background: "#fff", color: "#333", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  editBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#0f3460", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  deleteBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  formCard: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee", marginBottom: "24px" },
  formTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  error: { padding: "10px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px", marginBottom: "12px" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "250px", padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  tableContainer: { borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "14px 16px", textAlign: "left", fontWeight: "600", fontSize: "13px", color: "#666", borderBottom: "2px solid #eee", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#333" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "24px" },
  pageBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" },
  pageInfo: { fontSize: "14px", color: "#64748b" },
  deptSelectorBox: { background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" },
  deptSelectorHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  schoolGroupContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  schoolDeptGroup: { background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #f1f5f9" },
  schoolBadge: { fontSize: "12px", fontWeight: "700", color: "#0f3460", marginBottom: "8px" },
  deptCheckGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" },
  deptCheckLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", cursor: "pointer", background: "#f8fafc", transition: "all 0.15s" },
  deptCheckActive: { background: "#eff6ff", borderColor: "#3b82f6", color: "#1d4ed8", fontWeight: "600" },
  deptChip: { display: "inline-block", padding: "2px 8px", borderRadius: "6px", background: "#eff6ff", color: "#1e40af", fontSize: "12px", fontWeight: "600", border: "1px solid #bfdbfe" },
};

export default CourseManagement;
