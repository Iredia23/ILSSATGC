// api/index.js - Vercel serverless function entry point
// Connects to MongoDB on each request (Mongoose caches the connection internally)

import app from "../backend/app.js";
import connectDB from "../backend/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed. Check DB_URL environment variable.",
    });
    return;
  }

  return app(req, res);
}
