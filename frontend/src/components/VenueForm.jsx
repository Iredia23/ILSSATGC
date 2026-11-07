// src/components/VenueForm.jsx
import React, { useState } from "react";
import { useForm } from "../hooks/useForm";
import api from "../utils/api";
import { FiAlertTriangle } from "react-icons/fi";

const VenueForm = () => {
  const { values, handleChange, reset } = useForm({ name: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/venues", values);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="venue-form" style={styles.container}>
      <h2>Venue Form</h2>
      {error && <p style={styles.error}><FiAlertTriangle size={14} style={{ marginRight: 6 }} /> {error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          name="name"
          placeholder="Venue Name"
          value={values.name}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          name="location"
          placeholder="Location"
          value={values.location}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Saving..." : "Save Venue"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "500px",
    margin: "2rem auto",
    padding: "2rem",
    background: "rgba(255,255,255,0.9)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: { padding: "0.75rem", fontSize: "1rem", borderRadius: "4px", border: "1px solid #ccc" },
  button: { padding: "0.75rem", fontSize: "1rem", background: "#0066ff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  error: { color: "#c00" },
};

export default VenueForm;
