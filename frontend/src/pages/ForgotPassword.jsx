import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FiCheckCircle } from "react-icons/fi";
import logo from "../futminna logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await forgotPassword(email);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ marginBottom: "16px" }}>
          <img src={logo} alt="FUT Minna Logo" style={{ width: 64, height: 64, objectFit: "contain" }} />
        </div>
        <h2 style={styles.title}>Forgot Password</h2>
        <p style={styles.subtitle}>Enter your email to receive a password reset link</p>

        {success ? (
          <div style={styles.success}>
            <p><FiCheckCircle size={16} style={{ marginRight: 6 }} /> A password reset link has been sent to your email.</p>
            <Link to="/login" style={styles.link}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.error}>{error}</div>}
            <input
              type="email"
              placeholder="your.email@futminna.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <Link to="/login" style={styles.link}>Back to Login</Link>
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
  link: { color: "#0f3460", textDecoration: "none", fontSize: "14px", fontWeight: "500" },
};

export default ForgotPassword;
