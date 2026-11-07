import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";

// Load .env if not already loaded (for standalone use like seed scripts)
if (!process.env.DB_URL) {
  dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });
}

const connectDB = async () => {
  if (!process.env.DB_URL) {
    throw new Error("DB_URL is not set in .env.local — add the MongoDB connection string");
  }

  await mongoose.connect(process.env.DB_URL);
  // Verify connection with ping
  await mongoose.connection.db.admin().command({ ping: 1 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  console.log("Pinged deployment — connection verified.");
};

export default connectDB;
