import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

// Pages
import Login from "./pages/LoginPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import HODDashboard from "./pages/HODDashboard.jsx";
import ExamOfficerDashboard from "./pages/ExamOfficerDashboard.jsx";
import TimetableOfficerDashboard from "./pages/TimetableOfficerDashboard.jsx";
import LecturerDashboard from "./pages/LecturerDashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import SchoolsDepartments from "./pages/SchoolsDepartments.jsx";
import CourseManagement from "./pages/CourseManagement.jsx";
import VenueManagement from "./pages/VenueManagement.jsx";
import TimeSlotManagement from "./pages/TimeSlotManagement.jsx";
import CourseAllocation from "./pages/CourseAllocation.jsx";
import SchedulePlanning from "./pages/SchedulePlanning.jsx";
import Reports from "./pages/Reports.jsx";

// Layout
import SharedLayout from "./components/SharedLayout.jsx";

// Auth guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888" }}>
        Loading...
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Avoid redirect loop — if already on /change-password, let the page render
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return children;
};

// Role-based dashboard
const DashboardRouter = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case "Admin":
      return <AdminDashboard />;
    case "HOD":
      return <HODDashboard />;
    case "Exam Officer":
      return <ExamOfficerDashboard />;
    case "Timetable Officer":
      return <TimetableOfficerDashboard />;
    case "Lecturer":
      return <LecturerDashboard />;
    default:
      return <LecturerDashboard />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "14px",
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

          {/* Protected routes with sidebar layout */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <SharedLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRouter />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="schools-departments" element={<SchoolsDepartments />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="venues" element={<VenueManagement />} />
            <Route path="timeslots" element={<TimeSlotManagement />} />
            <Route path="allocation" element={<CourseAllocation />} />
            <Route path="schedule" element={<SchedulePlanning />} />
            <Route path="reports" element={<Reports />} />
            <Route path="lecturer-dashboard" element={<LecturerDashboard />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
