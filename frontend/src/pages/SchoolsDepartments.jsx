import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { showSuccess, showError } from "../utils/toast.js";
import { FiGrid, FiPlus, FiTrash2, FiEdit2, FiBriefcase } from "react-icons/fi";

const SchoolsDepartments = () => {
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  // Forms
  const [schoolForm, setSchoolForm] = useState({ name: "", code: "", description: "" });
  const [deptForm, setDeptForm] = useState({ name: "", code: "", schoolId: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, dRes] = await Promise.all([
        api.get("/schools"),
        api.get("/departments"),
      ]);
      setSchools(sRes.data.schools || []);
      setDepartments(dRes.data.departments || []);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch schools and departments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post("/schools", schoolForm);
      if (res.data.success) {
        showSuccess(`School '${res.data.school.name}' created!`);
        setShowSchoolModal(false);
        setSchoolForm({ name: "", code: "", description: "" });
        fetchData();
      }
    } catch (err) {
      showError(err.response?.data?.message || "Failed to create school");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post("/departments", deptForm);
      if (res.data.success) {
        showSuccess(`Department '${res.data.department.name}' created!`);
        setShowDeptModal(false);
        setDeptForm({ name: "", code: "", schoolId: "" });
        fetchData();
      }
    } catch (err) {
      showError(err.response?.data?.message || "Failed to create department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchool = async (id, name) => {
    if (!window.confirm(`Delete school '${name}' and all its departments?`)) return;
    try {
      await api.delete(`/schools/${id}`);
      showSuccess("School deleted successfully");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete school");
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Delete department '${name}'?`)) return;
    try {
      await api.delete(`/departments/${id}`);
      showSuccess("Department deleted successfully");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete department");
    }
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Schools & Departments</h1>
          <p style={styles.subtitle}>Manage academic faculties and departmental structures</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setShowSchoolModal(true)} style={styles.primaryBtn}>
            <FiPlus size={16} /> + New School
          </button>
          <button onClick={() => setShowDeptModal(true)} style={styles.secondaryBtn}>
            <FiPlus size={16} /> + New Department
          </button>
        </div>
      </div>

      {/* School Creation Modal */}
      {showSchoolModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: "0 0 16px", color: "#1a1a2e" }}>Create New School / Faculty</h3>
            <form onSubmit={handleCreateSchool} style={styles.form}>
              <div>
                <label style={styles.label}>School Name</label>
                <input
                  style={styles.input}
                  placeholder="e.g. School of Information & Communication Tech"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>School Code</label>
                <input
                  style={styles.input}
                  placeholder="e.g. SICT"
                  value={schoolForm.code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Description (Optional)</label>
                <input
                  style={styles.input}
                  placeholder="Short description"
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowSchoolModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={styles.primaryBtn}>
                  {submitting ? "Creating..." : "Create School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Creation Modal */}
      {showDeptModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: "0 0 16px", color: "#1a1a2e" }}>Create New Department</h3>
            <form onSubmit={handleCreateDepartment} style={styles.form}>
              <div>
                <label style={styles.label}>School / Faculty</label>
                <select
                  style={styles.select}
                  value={deptForm.schoolId}
                  onChange={(e) => setDeptForm({ ...deptForm, schoolId: e.target.value })}
                  required
                >
                  <option value="">Select a School</option>
                  {schools.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>Department Name</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Computer Science"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Department Code</label>
                <input
                  style={styles.input}
                  placeholder="e.g. CSC"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowDeptModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={styles.primaryBtn}>
                  {submitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading schools and departments...</div>
      ) : schools.length === 0 ? (
        <div style={styles.emptyState}>
          <FiGrid size={48} color="#94a3b8" />
          <h3>No Schools Registered</h3>
          <p>Click '+ New School' above to create your first academic faculty.</p>
        </div>
      ) : (
        <div style={styles.schoolGrid}>
          {schools.map((school) => {
            const schoolDepts = departments.filter((d) => (d.schoolId?._id || d.schoolId) === school._id);
            return (
              <div key={school._id} style={styles.schoolCard}>
                <div style={styles.schoolHeader}>
                  <div>
                    <div style={styles.schoolCode}>{school.code}</div>
                    <h3 style={styles.schoolTitle}>{school.name}</h3>
                    {school.description && <p style={styles.schoolDesc}>{school.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteSchool(school._id, school.name)}
                    style={styles.deleteIconBtn}
                    title="Delete School"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                <div style={styles.deptSection}>
                  <div style={styles.deptHeader}>
                    <span style={styles.deptTitle}><FiBriefcase size={14} style={{ marginRight: 6 }} /> Departments ({schoolDepts.length})</span>
                    <button
                      onClick={() => {
                        setDeptForm({ name: "", code: "", schoolId: school._id });
                        setShowDeptModal(true);
                      }}
                      style={styles.addDeptBtn}
                    >
                      + Add Dept
                    </button>
                  </div>

                  {schoolDepts.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", padding: "8px 0" }}>
                      No departments created under this school yet.
                    </div>
                  ) : (
                    <div style={styles.deptList}>
                      {schoolDepts.map((d) => (
                        <div key={d._id} style={styles.deptItem}>
                          <div>
                            <span style={styles.deptTag}>{d.code}</span>
                            <span style={styles.deptName}>{d.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteDepartment(d._id, d.name)}
                            style={styles.smallDeleteBtn}
                            title="Delete Department"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
  primaryBtn: { padding: "10px 18px", borderRadius: "8px", border: "none", background: "#0f3460", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" },
  secondaryBtn: { padding: "10px 18px", borderRadius: "8px", border: "2px solid #0f3460", background: "#fff", color: "#0f3460", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" },
  cancelBtn: { padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  schoolGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "24px" },
  schoolCard: { background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  schoolHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" },
  schoolCode: { display: "inline-block", background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", marginBottom: "6px" },
  schoolTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" },
  schoolDesc: { fontSize: "13px", color: "#64748b", margin: 0 },
  deleteIconBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" },
  deptSection: { background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #f1f5f9" },
  deptHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  deptTitle: { fontSize: "13px", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center" },
  addDeptBtn: { background: "#fff", border: "1px solid #cbd5e1", color: "#0f3460", borderRadius: "6px", fontSize: "11px", fontWeight: "600", padding: "3px 8px", cursor: "pointer" },
  deptList: { display: "flex", flexDirection: "column", gap: "6px" },
  deptItem: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" },
  deptTag: { fontWeight: "700", fontSize: "12px", color: "#0f3460", marginRight: "8px" },
  deptName: { fontSize: "13px", color: "#334155" },
  smallDeleteBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px border #e2e8f0" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { background: "#fff", width: "100%", maxWidth: "480px", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", border: "1px solid #e2e8f0" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px", display: "block" },
  input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" },
};

export default SchoolsDepartments;
