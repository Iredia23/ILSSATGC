import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const ConflictWarning = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;
  return (
    <div className="conflict-warning" style={styles.container}>
      <h3><FiAlertTriangle size={16} style={{ marginRight: 8 }} /> Scheduling Conflicts</h3>
      <ul>
        {conflicts.map((c, i) => (
          <li key={i} style={styles.item}>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  container: {
    background: "rgba(255,0,0,0.1)",
    border: "1px solid #ff4d4f",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "1rem",
  },
  item: {
    marginBottom: "0.5rem",
  },
};

export default ConflictWarning;
