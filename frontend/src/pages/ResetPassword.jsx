import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FiCheckCircle } from "react-icons/fi";
import logo from "../futminna logo.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPassword(token, newPassword, confirmPassword);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ marginBottom: "16px" }}>
          <img src={logo} alt="FUT Minna Logo" style={{ width: 64, height: 64, objectFit: "contain" }} />
        </div>
        <h2 style={styles.title}>Invalid Reset Link</h2>
          <p style={styles.subtitle}>This password reset link is invalid or missing.</p>
          <Link to="/forgot-password" style={styles.link}>Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ marginBottom: "16px" }}>
          <img src={logo} alt="FUT Minna Logo" style={{ width: 64, height: 64, objectFit: "contain" }} />
        </div>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Enter your new password</p>

        {success ? (
          <div style={styles.success}>
            <p><FiCheckCircle size={16} style={{ marginRight: 6 }} /> Password updated! Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.error}>{error}</div>}
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={styles.input} />
            <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
            <button type="submit" disabled={loading} style={styles.button}>{loading ? "Resetting..." : "Reset Password"}</button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding: "20px" },
  card: { width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: "40px", textAlign: "center" },
  title: { fontSize: "24px", fontWeight: "700", color: "#1a1a2e", margin: "0 0 8px" },
  subtitle: { fontSize: "14px", color: "#666", margin: "0 0 24px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: { padding: "12px 16px", fontSize: "15px", borderRadius: "8px", border: "2px solid #e0e0e0", outline: "none", boxSizing: "border-box" },
  button: { padding: "14px", fontSize: "16px", fontWeight: "600", background: "linear-gradient(135deg, #0f3460, #1a1a2e)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  error: { padding: "10px", borderRadius: "8px", background: "#fff5f5", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px" },
  success: { padding: "20px", borderRadius: "8px", background: "#d4edda", border: "1px solid #c3e6cb" },
  link: { color: "#0f3460", textDecoration: "none", fontSize: "14px", fontWeight: "500", display: "inline-block", marginTop: "16px" },
};

export default ResetPassword;
