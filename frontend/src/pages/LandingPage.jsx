import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { showSuccess, showError } from "../utils/toast.js";
import logo from "../futminna logo.png";
import "./LandingPage.css";

const initialForm = {
  fullName: "",
  email: "",
  role: "",
  message: "",
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.role || !form.message) {
      showError("Please complete all feedback fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        submittedAt: new Date().toISOString(),
      };
      const current = JSON.parse(localStorage.getItem("publicFeedback") || "[]");
      localStorage.setItem("publicFeedback", JSON.stringify([payload, ...current]));
      showSuccess("Thank you. Your feedback has been recorded.");
      setForm(initialForm);
    } catch (err) {
      console.error("Feedback submit error:", err);
      showError("Unable to save feedback right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-overlay" />

      <section className="landing-hero">
        <img src={logo} alt="FUT Minna Logo" className="landing-logo" />
        <h1>FUT Minna Staff Dashboard</h1>
        <p className="landing-institution">Federal University of Technology, Minna</p>
        <p>
          A centralized scheduling platform for departments to allocate courses,
          coordinate lecturers, manage venues and time slots, and generate reliable
          reports with fewer conflicts.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-login-btn"
            onClick={() => navigate(isAuthenticated ? "/app" : "/login")}
          >
            {isAuthenticated ? "Go to Dashboard" : "Login"}
          </button>
        </div>
      </section>

      <section className="landing-feedback-card">
        <h2>User Feedback Form</h2>
        <p className="landing-feedback-note">
          Share your experience to help improve timetable planning and staff workflow.
        </p>

        <form onSubmit={handleSubmit} className="landing-feedback-form">
          <label>
            Full Name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your name"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your.email@futminna.edu.ng"
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="">Select role</option>
              <option value="Admin">Admin</option>
              <option value="HOD">HOD</option>
              <option value="Exam Officer">Exam Officer</option>
              <option value="Timetable Officer">Timetable Officer</option>
              <option value="Lecturer">Lecturer</option>
            </select>
          </label>

          <label>
            Feedback
            <textarea
              name="message"
              rows="4"
              value={form.message}
              onChange={handleChange}
              placeholder="What is working well, and what should improve?"
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default LandingPage;
