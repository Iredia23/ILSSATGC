import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleBadgeStyle, getRoleColor, USER_ROLES, formatDate } from "../utils/helpers.js";
import { showSuccess, showError } from "../utils/toast.js";
import {
  FiUserCheck, FiEdit3, FiCalendar, FiUser, FiPlus, FiLock
} from "react-icons/fi";

const SPECIAL_ROLES = [
  { role: "HOD", icon: <FiUserCheck size={24} />, desc: "Head of Department" },
  { role: "Exam Officer", icon: <FiEdit3 size={24} />, desc: "Examination Officer" },
  { role: "Timetable Officer", icon: <FiCalendar size={24} />, desc: "Timetable & Schedule Officer" },
];

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", role: "", school: "", department: "", staffId: "" });
  const [form, setForm] = useState({ fullName: "", email: "", staffId: "", role: "Lecturer", school: "", department: "" });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [roleAssignments, setRoleAssignments] = useState({});
  const [deptRoleAssignments, setDeptRoleAssignments] = useState({});
  const [selectedDeptForRoles, setSelectedDeptForRoles] = useState("Computer Science");
  const [showRoleAssign, setShowRoleAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: "", newRole: "HOD" });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoleAssignments();
    fetchSchoolsAndDepts();
  }, [page, roleFilter, statusFilter, search, selectedDeptForRoles]);

  const fetchSchoolsAndDepts = async () => {
    try {
      const [sRes, dRes] = await Promise.all([
        api.get("/schools"),
        api.get("/departments"),
      ]);
      setSchools(sRes.data.schools || []);
      setDepartments(dRes.data.departments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/users", { params });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/auth/register", form);
      showSuccess(`User created! Temporary password: ${res.data.temporaryPassword || "password"}`);
      setShowCreate(false);
      setForm({ fullName: "", email: "", staffId: "", role: "Lecturer", department: "Computer Science", level: 100 });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create user";
      setError(msg);
      showError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      showSuccess("User updated successfully");
      setShowEdit(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update user";
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({ fullName: u.fullName, email: u.email, role: u.role, department: u.department || "", staffId: u.staffId || "", level: u.level || 100 });
    setShowEdit(true);
  };

  const fetchRoleAssignments = async () => {
    try {
      const res = await api.get("/users/role-assignments", {
        params: { department: selectedDeptForRoles },
      });
      setRoleAssignments(res.data.assignments || {});
      setDeptRoleAssignments(res.data.departmentAssignments || {});
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      const res = await api.post("/users/assign-role", assignForm);
      showSuccess(res.data.message);
      setShowRoleAssign(false);
      setAssignForm({ userId: "", newRole: "HOD" });
      fetchRoleAssignments();
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const action = currentStatus === "Active" ? "deactivate" : "activate";
      await api.patch(`/users/${userId}/${action}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlock = async (userId, fullName) => {
    try {
      await api.patch(`/users/${userId}/unlock`);
      showSuccess(`${fullName}'s account has been unlocked`);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to unlock account";
      showError(msg);
      console.error(err);
    }
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Staff Management</h1>
          <p style={styles.subtitle}>Manage staff and their roles</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setShowRoleAssign(!showRoleAssign)} style={styles.assignBtn}>
            <FiUserCheck size={14} style={{ marginRight: 6 }} /> Assign Role
          </button>
          <button onClick={() => setShowCreate(!showCreate)} style={styles.primaryBtn}>
            <FiPlus size={14} style={{ marginRight: 6 }} /> Add User
          </button>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEdit && editingUser && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Edit User — {editingUser.fullName}</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleEditUser} style={styles.form}>
            <div className="form-row" style={styles.formRow}>
              <input style={styles.input} placeholder="Full Name" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
              <input style={styles.input} placeholder="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
            </div>
            <div className="form-row" style={styles.formRow}>
              <input style={styles.input} placeholder="Staff ID" value={editForm.staffId} onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value })} />
              <select style={styles.select} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-row" style={styles.formRow}>
              <select style={styles.select} value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}>
                <option value="">Select School / Faculty</option>
                {schools.map((s) => <option key={s._id} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
              <select style={styles.select} value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>
                <option value="">Select Department</option>
                {departments
                  .filter((d) => !editForm.school || d.schoolId?.code === editForm.school || d.schoolName === editForm.school)
                  .map((d) => <option key={d._id} value={d.name}>{d.name} ({d.code})</option>)}
              </select>
            </div>
            <div style={styles.formActions}>
              <button type="button" onClick={() => { setShowEdit(false); setEditingUser(null); }} style={styles.secondaryBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={styles.primaryBtn}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </div>
      )}

      {showRoleAssign && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Assign Special Role</h3>
          <form onSubmit={handleAssignRole} style={styles.form}>
            <div className="form-row" style={styles.formRow}>
              <div>
                <label style={styles.label}>Lecturer</label>
                <select style={styles.select} value={assignForm.userId} onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })} required>
                  <option value="">Select a lecturer</option>
                  {users.filter((u) => u.role === "Lecturer" || SPECIAL_ROLES.some((sr) => sr.role === u.role)).map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>Assign As</label>
                <select style={styles.select} value={assignForm.newRole} onChange={(e) => setAssignForm({ ...assignForm, newRole: e.target.value })}>
                  {SPECIAL_ROLES.map((sr) => <option key={sr.role} value={sr.role}>{sr.role}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowRoleAssign(false)} style={styles.secondaryBtn}>Cancel</button>
              <button type="submit" disabled={assigning} style={styles.primaryBtn}>{assigning ? "Assigning..." : "Assign Role"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Current Role Assignments Cards */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>
            Departmental Leadership ({selectedDeptForRoles})
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Select Department:</span>
            <select
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              value={selectedDeptForRoles}
              onChange={(e) => setSelectedDeptForRoles(e.target.value)}
            >
              {departments.length === 0 ? (
                <option value="Computer Science">Computer Science</option>
              ) : (
                departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name} ({d.code})</option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="role-cards" style={styles.roleCards}>
          {SPECIAL_ROLES.map((sr) => {
            const currentDeptMap = deptRoleAssignments[selectedDeptForRoles] || {};
            const occupant = currentDeptMap[sr.role] || roleAssignments[sr.role];
            return (
              <div key={sr.role} style={{ ...styles.roleCard, borderLeft: `4px solid ${getRoleColor(sr.role)}` }}>
                <div style={styles.roleCardHeader}>
                  <span style={{ display: "flex", alignItems: "center" }}>{sr.icon}</span>
                  <div>
                    <div style={styles.roleCardTitle}>{sr.role}</div>
                    <div style={styles.roleCardDesc}>{sr.desc}</div>
                  </div>
                </div>
                {occupant && (occupant.department === selectedDeptForRoles || !occupant.department) ? (
                  <div style={styles.occupantInfo}>
                    <span style={styles.occupantName}>{occupant.fullName}</span>
                    <span style={styles.occupantEmail}>{occupant.email}</span>
                  </div>
                ) : (
                  <div style={styles.occupantEmpty}>
                    <span style={{ color: "#94a3b8" }}>Not assigned for {selectedDeptForRoles}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New User</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleCreateUser} style={styles.form}>
            <div className="form-row" style={styles.formRow}>
              <input style={styles.input} placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              <input style={styles.input} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-row" style={styles.formRow}>
              <input style={styles.input} placeholder="Staff ID" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} />
              <select style={styles.select} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-row" style={styles.formRow}>
              <select style={styles.select} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })}>
                <option value="">Select School / Faculty</option>
                {schools.map((s) => <option key={s._id} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
              <select style={styles.select} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Select Department</option>
                {departments
                  .filter((d) => !form.school || d.schoolId?.code === form.school || d.schoolName === form.school)
                  .map((d) => <option key={d._id} value={d.name}>{d.name} ({d.code})</option>)}
              </select>
            </div>
            <div style={styles.formActions}>
              <button type="button" onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
              <button type="submit" disabled={creating} style={styles.primaryBtn}>{creating ? "Creating..." : "Create User"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar" style={styles.toolbar}>
        <input style={styles.searchInput} placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select style={styles.select} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={styles.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Full Name</th>
              <th style={styles.th}>Staff ID</th>
              <th style={styles.th}>School & Dept</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Last Sign-In</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ ...styles.td, textAlign: "center" }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="9" style={{ ...styles.td, textAlign: "center" }}>No staff found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} style={styles.tr}>
                <td style={styles.td}>{u.fullName}</td>
                <td style={styles.td}>{u.staffId || "—"}</td>
                <td style={styles.td}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#0f3460" }}>{u.school || "SICT"}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{u.department || "Computer Science"}</div>
                </td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}><span style={getRoleBadgeStyle(u.role)}>{u.role}</span></td>
                <td style={styles.td}>
                  <span style={u.status === "Active" ? styles.statusActive : styles.statusInactive}>{u.status}</span>
                  {u.isLocked && (
                    <span style={styles.lockedBadge} title={u.lockUntil ? `Locked until ${formatDate(u.lockUntil)}` : "Locked"}>
                      <FiLock size={10} style={{ marginRight: 3 }} /> Locked
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  {u.lastLogin ? (
                    <span style={styles.lastLogin}>{formatDate(u.lastLogin)}</span>
                  ) : (
                    <span style={styles.pendingBadge}>Pending</span>
                  )}
                </td>
                <td style={styles.td}>{formatDate(u.createdAt)}</td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {u.id !== currentUser?.id && (
                      <>
                        <button onClick={() => openEdit(u)} style={styles.editBtn}>Edit</button>
                        {u.isLocked && (
                          <button onClick={() => handleUnlock(u.id, u.fullName)} style={styles.unlockBtn}>
                            Unlock
                          </button>
                        )}
                        <button onClick={() => handleToggleStatus(u.id, u.status)} style={u.status === "Active" ? styles.dangerBtn : styles.successBtnSmall}>
                          {u.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} style={styles.pageBtn}>← Prev</button>
          <span style={styles.pageInfo}>Page {pagination.page} of {pagination.pages} ({pagination.total} users)</span>
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
  primaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0f3460", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" },
  secondaryBtn: { padding: "10px 20px", borderRadius: "8px", border: "2px solid #ddd", background: "#fff", color: "#333", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  dangerBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#e74c3c", color: "#fff", fontSize: "12px", cursor: "pointer" },
  successBtnSmall: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#2ecc71", color: "#fff", fontSize: "12px", cursor: "pointer" },
  formCard: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee", marginBottom: "24px" },
  formTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  error: { padding: "10px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "250px", padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  tableContainer: { borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "14px 16px", textAlign: "left", fontWeight: "600", fontSize: "13px", color: "#666", borderBottom: "2px solid #eee", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#333" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  statusActive: { color: "#27ae60", fontWeight: "600", fontSize: "13px" },
  statusInactive: { color: "#e74c3c", fontWeight: "600", fontSize: "13px" },
  lockedBadge: { marginLeft: "8px", display: "inline-flex", alignItems: "center", fontSize: "11px", fontWeight: "700", color: "#b45309", background: "#fef3cd", padding: "2px 8px", borderRadius: "4px" },
  unlockBtn: { padding: "5px 10px", borderRadius: "4px", border: "none", background: "#f59e0b", color: "#fff", fontSize: "12px", cursor: "pointer" },
  lastLogin: { fontSize: "13px", color: "#333" },
  pendingBadge: { fontSize: "12px", fontWeight: "600", color: "#e67e22", background: "#fef3cd", padding: "2px 8px", borderRadius: "4px" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "24px" },
  pageBtn: { padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" },
  pageInfo: { fontSize: "14px", color: "#666" },
  assignBtn: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#10b981", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" },
  roleCards: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" },
  roleCard: { padding: "16px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee" },
  roleCardHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  roleCardTitle: { fontSize: "16px", fontWeight: "700", color: "#1a1a2e" },
  roleCardDesc: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  occupantInfo: { display: "flex", flexDirection: "column", gap: "2px", padding: "8px 12px", borderRadius: "8px", background: "#f8fafc" },
  occupantName: { fontSize: "14px", fontWeight: "600", color: "#333" },
  occupantEmail: { fontSize: "12px", color: "#64748b" },
  occupantEmpty: { padding: "8px 12px", borderRadius: "8px", background: "#f8fafc", fontSize: "13px", textAlign: "center" },
  label: { fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "6px", display: "block" },
  editBtn: { padding: "5px 10px", borderRadius: "4px", border: "none", background: "#3498db", color: "#fff", fontSize: "12px", cursor: "pointer" },
};

export default UserManagement;
