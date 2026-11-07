import toast from "react-hot-toast";

const defaultOptions = {
  duration: 4000,
  position: "top-right",
};

const successStyle = {
  background: "#10b981",
  color: "#fff",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "500",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
};

const errorStyle = {
  background: "#ef4444",
  color: "#fff",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "500",
  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
};

const infoStyle = {
  background: "#3b82f6",
  color: "#fff",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "500",
  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
};

const warningStyle = {
  background: "#f59e0b",
  color: "#fff",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "500",
  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
};

export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    ...defaultOptions,
    style: successStyle,
    icon: null,
    ...options,
  });
};

export const showError = (message, options = {}) => {
  toast.error(message, {
    ...defaultOptions,
    style: errorStyle,
    icon: null,
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  toast(message, {
    ...defaultOptions,
    style: infoStyle,
    icon: null,
    ...options,
  });
};

export const showWarning = (message, options = {}) => {
  toast(message, {
    ...defaultOptions,
    style: warningStyle,
    icon: null,
    ...options,
  });
};

export default toast;
