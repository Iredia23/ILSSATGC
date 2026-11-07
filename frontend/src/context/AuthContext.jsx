import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api.js";
import { showError } from "../utils/toast.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount if token exists
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to load user:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password, rememberMe = false }) => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.post("/auth/login", { email, password, rememberMe });
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      return { success: true, mustChangePassword: userData.mustChangePassword };
    } catch (err) {
      const message = err.response
        ? err.response?.data?.message || "Login failed"
        : "Cannot reach API server. Ensure backend is running on http://localhost:5000.";
      showError(message);
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const res = await api.post("/auth/register", userData);
      return { success: true, data: res.data };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const res = await api.put("/auth/profile", profileData);
      setUser((prev) => ({ ...prev, ...res.data.user }));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Update failed";
      setError(message);
      return { success: false, message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      const res = await api.post("/auth/forgot-password", { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Request failed";
      setError(message);
      return { success: false, message };
    }
  };

  const resetPassword = async (token, newPassword, confirmPassword) => {
    try {
      setError(null);
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Reset failed";
      setError(message);
      return { success: false, message };
    }
  };

  const isAuthenticated = !!token && !!user;

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      setError(null);
      const res = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setUser((prev) => ({ ...prev, mustChangePassword: false }));
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Password change failed";
      setError(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    loadUser,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
