// server.js - entry point for local development
// For Vercel, the app is exported from app.js and wired through api/index.js
import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env.local") });

// Validate critical env vars
if (!process.env.JWT_SECRET) {
  console.error("\n❌ FATAL: JWT_SECRET is not set in .env.local\n");
  process.exit(1);
}
if (!process.env.DB_URL) {
  console.error("\n❌ FATAL: DB_URL is not set in .env.local (MongoDB connection string)\n");
  process.exit(1);
}
if (!process.env.GOOGLE_API_KEY) {
  console.warn("\n⚠️  WARNING: GOOGLE_API_KEY not set — AI features will not work.\n");
}

const PORT = process.env.PORT || 5000;
const PROJECT_ROOT = path.join(import.meta.dirname, "..");

// First-run auto-seed: create the demo user accounts when the database is
// empty so login works immediately (no manual seeding needed).
async function ensureBaseUsers() {
  const { default: User } = await import("./models/User.js");
  const count = await User.countDocuments();
  if (count > 0) return false;

  const { usersToSeed, seedPasswordFor } = await import("./seed/usersData.js");
  const bcrypt = (await import("bcryptjs")).default;
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const salt = await bcrypt.genSalt(saltRounds);

  // Read every password first, so a missing setting stops the seed before
  // any account is created.
  const passwords = usersToSeed.map((u) => seedPasswordFor(u));

  for (const [i, u] of usersToSeed.entries()) {
    await User.create({
      fullName: u.fullName,
      email: u.email,
      password: await bcrypt.hash(passwords[i], salt),
      role: u.role,
      department: u.department,
      status: "Active",
      mustChangePassword: false,
    });
  }
  console.log(`\n✅ Seeded ${usersToSeed.length} demo users`);
  console.log(`   Admin login → admin@futminna.edu.ng (password: SEED_ADMIN_PASSWORD in .env.local)`);
  return true;
}

// First-run auto-seed: populate the demo dataset (courses, venues, time
// slots, lecturer assignments, auto-generated timetable) through the app's
// own API once the server is listening. Idempotent — only runs when the
// courses collection is empty. Disable with AUTO_SEED_DEMO=false.
async function maybeSeedDemoData() {
  if (process.env.AUTO_SEED_DEMO === "false") return;
  const { default: Course } = await import("./models/Course.js");
  const count = await Course.countDocuments();
  if (count > 0) return;

  console.log("\n🌱 First run detected — seeding demo data (courses, venues, timetable)...");
  const seedScript = path.join(PROJECT_ROOT, "scripts", "seed-demo-data.mjs");
  const child = spawn(process.execPath, [seedScript], {
    stdio: "inherit",
    cwd: PROJECT_ROOT,
  });
  child.on("error", (err) => console.warn("⚠️ Demo-data seeding could not start:", err.message));
}

async function shutdown() {
  console.log("\nShutting down…");
  try {
    const { default: mongoose } = await import("mongoose");
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(0);
}

const main = async () => {
  await connectDB();

  // Auto-seed only ever acts on an empty database, so a fresh database gets
  // users + demo data automatically; existing data is never touched.
  await ensureBaseUsers();

  const httpServer = http.createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server listening on http://localhost:${PORT}`);
    maybeSeedDemoData(); // fire-and-forget; streams progress to this console
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

main().catch((err) => {
  console.error("\n❌ Failed to start server:", err.message);
  process.exit(1);
});
