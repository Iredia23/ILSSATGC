// backend/seed/students.js
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { seedPasswordFor } from "./usersData.js";

// Load environment variables (project root .env.local)
dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });

const studentList = [
  { fullName: "Alice Johnson", email: "alice.student1@futminna.edu.ng", role: "Student", department: "Computer Science", level: 100 },
  { fullName: "Bob Smith", email: "bob.student2@futminna.edu.ng", role: "Student", department: "Computer Science", level: 200 },
  { fullName: "Charlie Brown", email: "charlie.student3@futminna.edu.ng", role: "Student", department: "Computer Science", level: 300 },
  { fullName: "Diana Prince", email: "diana.student4@futminna.edu.ng", role: "Student", department: "Computer Science", level: 400 },
  { fullName: "Ethan Hunt", email: "ethan.student5@futminna.edu.ng", role: "Student", department: "Computer Science", level: 500 },
];

const seedStudents = async () => {
  await connectDB();
  let created = 0;
  let skipped = 0;

  for (const s of studentList) {
    const existing = await User.findOne({ email: s.email });
    if (existing) {
      console.log(`  ⏭ Skipped ${s.fullName} (already exists)`);
      skipped++;
      continue;
    }

    // Password comes from SEED_USER_PASSWORD in .env.local
    const password = seedPasswordFor(s);
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    const hashed = await bcrypt.hash(password, salt);

    await User.create({
      fullName: s.fullName,
      email: s.email,
      password: hashed,
      role: s.role,
      department: s.department,
      level: s.level,
      status: "Active",
      mustChangePassword: false,
    });

    console.log(`  ✅ Student: ${s.fullName} (${s.email})`);
    created++;
  }

  console.log(`\n🎉 Done! ${created} created, ${skipped} skipped.`);
  process.exit(0);
};

seedStudents().catch((err) => { console.error(err); process.exit(1); });
