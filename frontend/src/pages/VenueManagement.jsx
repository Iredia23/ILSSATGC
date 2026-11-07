import React, { useState, useEffect } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { VENUE_TYPES, EQUIPMENT_OPTIONS } from "../utils/helpers.js";

const VenueManagement = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [form, setForm] = useState({ name: "", building: "", capacity: 100, type: "Lecture Hall", equipment: [] });
  const [error, setError] = useState("");
  const [utilization, setUtilization] = useState({});

  const canEdit = ["Admin", "Timetable Officer"].includes(user?.role);

  useEffect(() => { fetchVenues(); }, [search, typeFilter]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const [res, utilRes] = await Promise.all([
        api.get("/venues", { params }),
        api.get("/venues/utilization").catch(() => null),
      ]);
      setVenues(res.data.venues || []);
      if (utilRes?.data?.utilization) {
        const map = {};
        utilRes.data.utilization.forEach((u) => { map[u.venue._id] = u; });
        setUtilization(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingVenue) {
        await api.put(`/venues/${editingVenue._id}`, form);
      } else {
        await api.post("/venues", form);
      }
      setShowForm(false);
      setEditingVenue(null);
      setForm({ name: "", building: "", capacity: 100, type: "Lecture Hall", equipment: [] });
      fetchVenues();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save venue");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? All schedule assignments for this venue will be removed.")) return;
    try {
      await api.delete(`/venues/${id}`);
      fetchVenues();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setForm({ name: venue.name, building: venue.building || "", capacity: venue.capacity, type: venue.type, equipment: venue.equipment || [] });
    setShowForm(true);
  };

  const toggleEquipment = (item) => {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((e) => e !== item)
        : [...prev.equipment, item],
    }));
  };

  return (
    <div className="page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <div>
          <h1 style={styles.title}>Venue Management</h1>
          <p style={styles.subtitle}>Manage lecture halls, labs, and seminar rooms</p>
        </div>
        {user?.role === "Admin" && (
          <button onClick={() => { setShowForm(!showForm); setEditingVenue(null); }} style={styles.primaryBtn}>+ Add Venue</button>
        )}
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editingVenue ? "Edit Venue" : "Create New Venue"}</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <input style={styles.input} placeholder="Venue Name (e.g. CSC Lecture Hall A)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input style={styles.input} placeholder="Building (optional)" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
            </div>
            <div style={styles.formRow}>
              <input style={styles.input} type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} required min="1" />
              <select style={styles.select} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Equipment Available</label>
              <div style={styles.checkboxRow}>
                {EQUIPMENT_OPTIONS.map((item) => (
                  <label key={item} style={styles.checkboxLabel}>
                    <input type="checkbox" checked={form.equipment.includes(item)} onChange={() => toggleEquipment(item)} />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div style={styles.formActions}>
              <button type="button" onClick={() => { setShowForm(false); setEditingVenue(null); }} style={styles.secondaryBtn}>Cancel</button>
              <button type="submit" style={styles.primaryBtn}>{editingVenue ? "Update" : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar" style={styles.toolbar}>
        <input style={styles.searchInput} placeholder="Search venues..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={styles.select} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="venue-grid" style={styles.grid}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading...</div>
        ) : venues.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>No venues found</div>
        ) : venues.map((v) => (
          <div key={v._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{v.name}</h3>
              <span style={styles.typeBadge}>{v.type}</span>
            </div>
            {v.building && <p style={styles.cardText}>📍 {v.building}</p>}
            <p style={styles.cardText}>👥 Capacity: {v.capacity}</p>
            {utilization[v._id] && (
              <div style={styles.utilBlock}>
                <div style={styles.utilHeader}>
                  <span style={styles.utilLabel}>Weekly Utilization</span>
                  <span style={styles.utilValue}>{utilization[v._id].utilizationPercent}%</span>
                </div>
                <div style={styles.utilBar}>
                  <div
                    style={{
                      ...styles.utilFill,
                      width: `${utilization[v._id].utilizationPercent}%`,
                      background: utilization[v._id].utilizationPercent >= 80
                        ? "#e74c3c"
                        : utilization[v._id].utilizationPercent >= 50
                          ? "#f39c12"
                          : "#2ecc71",
                    }}
                  />
                </div>
                <p style={styles.utilMeta}>
                  {utilization[v._id].totalSessions} sessions / week · {utilization[v._id].activeDays} of 5 days used
                </p>
              </div>
            )}
            {v.equipment?.length > 0 && (
              <div style={styles.equipmentList}>
                {v.equipment.map((e) => <span key={e} style={styles.equipBadge}>{e}</span>)}
              </div>
            )}
            {canEdit && (
              <div style={styles.cardActions}>
                <button onClick={() => handleEdit(v)} style={styles.editBtn}>Edit</button>
                {user?.role === "Admin" && <button onClick={() => handleDelete(v._id)} style={styles.deleteBtn}>Delete</button>}
              </div>
            )}
          </div>
        ))}
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
  formCard: { padding: "24px", borderRadius: "12px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee", marginBottom: "24px" },
  formTitle: { fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  select: { padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  label: { fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "6px", display: "block" },
  checkboxRow: { display: "flex", flexWrap: "wrap", gap: "12px" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#555", cursor: "pointer" },
  error: { padding: "10px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px", marginBottom: "12px" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "250px", padding: "10px 14px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", outline: "none" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
  card: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #eee" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  cardTitle: { fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 },
  typeBadge: { padding: "3px 10px", borderRadius: "12px", background: "#e8f4fd", color: "#0f3460", fontSize: "12px", fontWeight: "600" },
  cardText: { fontSize: "14px", color: "#666", margin: "4px 0" },
  equipmentList: { display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" },
  equipBadge: { padding: "2px 8px", borderRadius: "4px", background: "#f0f0f0", fontSize: "11px", color: "#555" },
  utilBlock: { marginTop: "12px", padding: "10px 12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" },
  utilHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  utilLabel: { fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" },
  utilValue: { fontSize: "14px", fontWeight: "700", color: "#1a1a2e" },
  utilBar: { height: "8px", borderRadius: "4px", background: "#e2e8f0", overflow: "hidden" },
  utilFill: { height: "100%", borderRadius: "4px", transition: "width 0.3s" },
  utilMeta: { fontSize: "11px", color: "#94a3b8", margin: "6px 0 0" },
  cardActions: { display: "flex", gap: "8px", marginTop: "12px" },
  editBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#3498db", color: "#fff", fontSize: "12px", cursor: "pointer" },
  deleteBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#e74c3c", color: "#fff", fontSize: "12px", cursor: "pointer" },
};

export default VenueManagement;
