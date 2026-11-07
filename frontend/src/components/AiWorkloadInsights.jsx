import React, { useState } from "react";
import api from "../utils/api.js";
import { FiSearch, FiAlertTriangle, FiTrendingDown, FiRefreshCw, FiMessageSquare, FiCpu, FiSliders } from "react-icons/fi";

const AiWorkloadInsights = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [semester, setSemester] = useState("");
  const [error, setError] = useState("");

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const params = semester ? { semester } : {};
      const res = await api.get("/ai/workload", { params });
      setAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#27ae60";
    if (score >= 60) return "#f39c12";
    return "#e74c3c";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Well Balanced";
    if (score >= 60) return "Slightly Imbalanced";
    return "Needs Attention";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}><FiSliders size={20} style={{ marginRight: 8 }} /> AI Workload Analysis</h3>
          <p style={styles.subtitle}>
            AI-powered analysis of lecturer workload distribution and fairness
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            style={styles.select}
          >
            <option value="">All Semesters</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
          </select>
          <button
            onClick={runAnalysis}
            disabled={loading}
            style={{
              ...styles.analyzeBtn,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Analyzing..." : <><FiSearch size={14} style={{ marginRight: 4 }} /> Analyze</>}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          <FiAlertTriangle size={14} style={{ marginRight: 6 }} /> {error}
        </div>
      )}

      {loading && (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>AI is analyzing lecturer workload distribution...</p>
        </div>
      )}

      {analysis && !loading && (
        <div style={styles.content}>
          {/* Fairness Score */}
          <div style={styles.scoreCard}>
            <div style={styles.scoreCircle}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#eee" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={getScoreColor(analysis.fairnessScore)}
                  strokeWidth="6"
                  strokeDasharray={`${(analysis.fairnessScore / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div style={styles.scoreValue}>{analysis.fairnessScore}%</div>
            </div>
            <div>
              <div style={styles.scoreLabel}>{getScoreLabel(analysis.fairnessScore)}</div>
              <div style={styles.scoreStatus}>{analysis.status}</div>
            </div>
          </div>

          {/* Overloaded */}
          {analysis.overloaded?.length > 0 && (
            <div style={styles.section}>
              <h4 style={{ ...styles.sectionTitle, color: "#e74c3c" }}><FiAlertTriangle size={16} style={{ marginRight: 6 }} /> Overloaded Lecturers</h4>
              {analysis.overloaded.map((o, i) => (
                <div key={i} style={styles.personCard}>
                  <span style={styles.personName}>{o.name}</span>
                  <span style={{ color: "#e74c3c", fontWeight: "600" }}>
                    {o.currentCourses} courses
                    {o.recommendedReduction && (
                      <span style={{ fontSize: "12px", color: "#888", marginLeft: "8px" }}>
                        (reduce by {o.recommendedReduction})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Underloaded */}
          {analysis.underloaded?.length > 0 && (
            <div style={styles.section}>
              <h4 style={{ ...styles.sectionTitle, color: "#3498db" }}><FiTrendingDown size={16} style={{ marginRight: 6 }} /> Underloaded Lecturers</h4>
              {analysis.underloaded.map((u, i) => (
                <div key={i} style={styles.personCard}>
                  <span style={styles.personName}>{u.name}</span>
                  <span style={{ color: "#3498db", fontWeight: "600" }}>
                    {u.currentCourses} courses
                    {u.canTakeMore && (
                      <span style={{ fontSize: "12px", color: "#888", marginLeft: "8px" }}>
                        (can take {u.canTakeMore} more)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}><FiRefreshCw size={16} style={{ marginRight: 6 }} /> Rebalancing Suggestions</h4>
              {analysis.suggestions.map((s, i) => (
                <div key={i} style={styles.suggestionCard}>
                  <div style={styles.suggestionArrow}><FiRefreshCw size={18} /></div>
                  <div>
                    <p style={styles.suggestionText}>
                      <strong>{s.from}</strong> → <strong>{s.to}</strong>
                    </p>
                    <p style={styles.suggestionCourse}>Course: {s.course}</p>
                    <p style={styles.suggestionReason}>{s.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Insight */}
          {analysis.insight && (
            <div style={styles.insightCard}>
              <FiMessageSquare size={16} style={{ marginRight: 8, flexShrink: 0 }} />
              {analysis.insight}
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}><FiCpu size={36} /></p>
          <p style={styles.emptyText}>
            Click <strong>"Analyze"</strong> to get AI-powered workload insights and rebalancing suggestions.
          </p>
        </div>
      )}

      <style>{`@keyframes aiSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const styles = {
  container: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #eee",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: { fontSize: "18px", fontWeight: "600", color: "#1a1a2e", margin: "0 0 4px" },
  subtitle: { fontSize: "13px", color: "#888", margin: 0 },
  select: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "2px solid #e0e0e0",
    fontSize: "13px",
    outline: "none",
  },
  analyzeBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: "#0f3460",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    padding: "10px",
    borderRadius: "8px",
    background: "#fff5f5",
    border: "1px solid #ffcdd2",
    color: "#c62828",
    fontSize: "14px",
    marginBottom: "16px",
  },
  content: { display: "flex", flexDirection: "column", gap: "20px" },
  scoreCard: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "16px",
    borderRadius: "10px",
    background: "#f8fafc",
  },
  scoreCircle: {
    position: "relative",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scoreValue: {
    position: "absolute",
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a1a2e",
  },
  scoreLabel: { fontSize: "16px", fontWeight: "600", color: "#333" },
  scoreStatus: { fontSize: "13px", color: "#888", marginTop: "2px" },
  section: {},
  sectionTitle: { fontSize: "15px", fontWeight: "600", marginBottom: "10px" },
  personCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "6px",
    background: "#f9f9f9",
    marginBottom: "6px",
  },
  personName: { fontSize: "14px", fontWeight: "500", color: "#333" },
  suggestionCard: {
    display: "flex",
    gap: "12px",
    padding: "12px",
    borderRadius: "8px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    marginBottom: "8px",
  },
  suggestionArrow: { fontSize: "20px", marginTop: "2px" },
  suggestionText: { margin: "0 0 4px", fontSize: "14px", color: "#333" },
  suggestionCourse: { margin: "0 0 4px", fontSize: "12px", color: "#666" },
  suggestionReason: { margin: 0, fontSize: "12px", color: "#888", fontStyle: "italic" },
  insightCard: {
    padding: "14px 16px",
    borderRadius: "8px",
    background: "#f0f4ff",
    border: "1px solid #dbeafe",
    fontSize: "13px",
    color: "#333",
    lineHeight: "1.5",
    display: "flex",
    alignItems: "flex-start",
  },
  loadingState: {
    textAlign: "center",
    padding: "40px",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #e0e0e0",
    borderTop: "3px solid #4285f4",
    borderRadius: "50%",
    margin: "0 auto 12px",
    animation: "aiSpin 0.8s linear infinite",
  },
  loadingText: { fontSize: "14px", color: "#888", margin: 0 },
  emptyState: {
    textAlign: "center",
    padding: "32px",
  },
  emptyIcon: { fontSize: "36px", margin: "0 0 8px" },
  emptyText: { fontSize: "14px", color: "#888", margin: 0, lineHeight: "1.5" },
};

export default AiWorkloadInsights;
