import React from "react";

const MasterScheduleGrid = () => {
  return (
    <div className="master-schedule-grid" style={styles.container}>
      <h2>Master Schedule</h2>
      {/* TODO: Render schedule data in a grid/table */}
    </div>
  );
};

const styles = {
  container: {
    padding: "1rem",
    background: "rgba(255,255,255,0.9)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  }
};

export default MasterScheduleGrid;
