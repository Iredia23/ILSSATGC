// backend/seed/admin.js
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });

const seedAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ email: "admin@futminna.edu.ng" });
  if (existing) {
    console.log("Admin user already exists.");
    process.exit(0);
  }

  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    console.error("❌ SEED_ADMIN_PASSWORD is not set in .env.local. Add it, then run this again.");
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
  const hashed = await bcrypt.hash(password, salt);

  await User.create({
    fullName: "Admin User",
    email: "admin@futminna.edu.ng",
    password: hashed,
    role: "Admin",
    // Admin is institution-wide: no school/department (overrides schema defaults)
    school: "",
    department: "",
    status: "Active",
    mustChangePassword: false,
  });

  console.log("✅ Admin user created (admin@futminna.edu.ng, password from SEED_ADMIN_PASSWORD in .env.local)");
  process.exit(0);
};

seedAdmin().catch((err) => { console.error(err); process.exit(1); });
