import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FiAlertTriangle } from "react-icons/fi";
import logo from "../futminna logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password, rememberMe });
    if (result.success) {
      navigate("/app");
    }
  };

  return (
    <div style={styles.page}>
      <div className="login-card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}><img src={logo} alt="FUT Minna Logo" style={{ width: 72, height: 72, objectFit: "contain" }} /></div>
          <h1 style={styles.title}>FUT Minna</h1>
          <p style={styles.subtitle}>Federal University of Technology, Minna</p>
          <p style={styles.subtitle2}>Staff Dashboard — Lecture Scheduling System</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="your.email@futminna.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" style={styles.link}>
              Forgot Password?
            </a>
          </div>

          {error && (
            <div style={styles.error}>
              <FiAlertTriangle size={14} style={{ marginRight: 6 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    padding: "40px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    marginBottom: "12px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a2e",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },
  subtitle2: {
    fontSize: "13px",
    color: "#888",
    margin: "4px 0 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
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
    padding: "12px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "2px solid #e0e0e0",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#555",
    cursor: "pointer",
  },
  link: {
    fontSize: "14px",
    color: "#0f3460",
    textDecoration: "none",
    fontWeight: "500",
  },
  error: {
    padding: "10px",
    borderRadius: "8px",
    background: "#fff5f5",
    border: "1px solid #ffcdd2",
    color: "#c62828",
    fontSize: "14px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    padding: "14px",
    fontSize: "16px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #0f3460, #1a1a2e)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.1s, box-shadow 0.2s",
  },
};

export default Login;
