import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { showSuccess, showError } from "../utils/toast.js";
import logo from "../futminna logo.png";

const ChangePassword = () => {
  const { changePassword, loadUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(form.newPassword) || !/[a-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      showError("Password must contain uppercase, lowercase, and a number");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(
        form.currentPassword,
        form.newPassword,
        form.confirmPassword
      );

      if (!result.success) {
        showError(result.message || "Failed to change password");
        return;
      }

      showSuccess("Password changed successfully!");
      await loadUser();
      setTimeout(() => navigate("/app"), 1500);
    } catch (err) {
      showError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}><img src={logo} alt="FUT Minna Logo" style={{ width: 64, height: 64, objectFit: "contain" }} /></div>
        <h1 style={styles.title}>Change Your Password</h1>
        <p style={styles.subtitle}>
          You must change your password before continuing. Please enter your current password and choose a new one.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter current password (default: password)"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter new password"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                style={styles.input}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Changing Password..." : "Change Password"}
            </button>
          </form>

        <div style={styles.requirements}>
          <h4 style={styles.reqTitle}>Password Requirements:</h4>
          <ul style={styles.reqList}>
            <li>At least 8 characters long</li>
            <li>Contains uppercase letter (A-Z)</li>
            <li>Contains lowercase letter (a-z)</li>
            <li>Contains a number (0-9)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  icon: {
    textAlign: "center",
    marginBottom: "16px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    textAlign: "center",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "2px solid #e0e0e0",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #0f3460 0%, #16213e 100%)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  requirements: {
    marginTop: "24px",
    padding: "16px",
    borderRadius: "8px",
    background: "#f8f9fa",
    border: "1px solid #e9ecef",
  },
  reqTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "8px",
  },
  reqList: {
    margin: "0",
    paddingLeft: "20px",
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.8",
  },
};

export default ChangePassword;
