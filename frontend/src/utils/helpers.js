/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

/**
 * Format datetime to readable string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

/**
 * Get role color for UI badges
 */
export const getRoleColor = (role) => {
  const colors = {
    Admin: "#e74c3c",
    HOD: "#3498db",
    "Exam Officer": "#2ecc71",
    "Timetable Officer": "#f39c12",
    Lecturer: "#9b59b6",
  };
  return colors[role] || "#95a5a6";
};

/**
 * Get role badge style
 */
export const getRoleBadgeStyle = (role) => ({
  backgroundColor: getRoleColor(role),
  color: "#fff",
  padding: "2px 8px",
  borderRadius: "12px",
  fontSize: "0.75rem",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Download file from blob
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Export data as CSV
 */
export const exportToCSV = (data, filename, headers) => {
  const csvHeaders = headers || Object.keys(data[0] || {});
  const csvRows = [
    csvHeaders.join(","),
    ...data.map((row) =>
      csvHeaders.map((h) => {
        const val = row[h] || "";
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    ),
  ];
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  downloadBlob(blob, filename);
};

/**
 * Day of week order for sorting
 */
export const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

/**
 * Semesters
 */
export const SEMESTERS = ["1st Semester", "2nd Semester"];

/**
 * Levels
 */
export const LEVELS = [100, 200, 300, 400, 500];

/**
 * Venue Types
 */
export const VENUE_TYPES = ["Lecture Hall", "Laboratory", "Seminar Room", "Auditorium"];

/**
 * Equipment options
 */
export const EQUIPMENT_OPTIONS = [
  "Projector",
  "Whiteboard",
  "Computer Lab",
  "WiFi",
  "Microphone",
  "Speaker System",
  "Smart Board",
];

/**
 * User Roles
 */
export const USER_ROLES = ["Admin", "HOD", "Exam Officer", "Timetable Officer", "Lecturer"];

/**
 * Departments — Federal University of Technology, Minna (full institutional scope).
 * The app is built for the whole institution; Computer Science (SICT) is the case study.
 */
export const DEPARTMENTS = [
  // SICT — School of Information & Communication Technology
  "Computer Science", "Cybersecurity", "Information Technology", "Telecommunication Engineering",
  // SEET — School of Engineering & Engineering Technology
  "Electrical & Electronics Engineering", "Mechanical Engineering", "Mechatronics Engineering", "Computer Engineering",
  // SSTE — School of Science & Technology Education
  "Educational Technology", "Science Education",
  // SET — School of Environmental Technology
  "Architecture", "Building Technology", "Quantity Surveying", "Urban & Regional Planning", "Estate Management",
  // SAAT — School of Agriculture & Agricultural Technology
  "Agricultural Economics & Farm Management", "Crop Production", "Animal Production", "Soil Science",
  "Food Science & Technology", "Water Resources, Aquaculture & Fisheries",
  // SLS — School of Life Sciences
  "Biochemistry", "Biology", "Microbiology", "Plant Biology", "Zoology",
  // SPS — School of Physical Sciences
  "Chemistry", "Mathematics", "Physics", "Statistics", "Geology", "Geography", "Remote Sensing & GIS",
  // SIPET — School of Infrastructure, Process Engineering & Technology
  "Chemical Engineering", "Civil Engineering", "Materials & Metallurgical Engineering", "Petroleum & Gas Engineering",
];
