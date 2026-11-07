// app.js - Express application (separated from server for Vercel compatibility)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import connectDB from "./config/db.js";

// Route imports
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import courseRoutes from "./routes/courses.js";
import venueRoutes from "./routes/venues.js";
import timeslotRoutes from "./routes/timeslots.js";
import assignmentRoutes from "./routes/assignments.js";
import adminRoutes from "./routes/admin.js";
import reportRoutes from "./routes/reports.js";
import dashboardRoutes from "./routes/dashboard.js";
import aiRoutes from "./routes/ai.js";
import notificationRoutes from "./routes/notifications.js";
import schoolRoutes from "./routes/schools.js";
import departmentRoutes from "./routes/departments.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env.local") });

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
const isDev = (process.env.NODE_ENV || "development") !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser and same-origin requests with no Origin header.
      if (!origin) return callback(null, true);

      // In local development, allow any frontend origin to prevent login blocks.
      if (isDev) {
        return callback(null, true);
      }

      // In production, enforce explicit origin allowlist.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("[CORS] Blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

// API routes (MongoDB connection is handled in api/index.js for Vercel, or server.js for local)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/timeslots", timeslotRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/departments", departmentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "FUT Minna Scheduling API is running" });
});

// Serve built frontend — works for both local dev and Vercel
// On Vercel, vercel.json rewrites handle SPA routing instead
const distPath = path.join(import.meta.dirname, "..", "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback for local dev
  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
