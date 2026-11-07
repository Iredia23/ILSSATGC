// backend/seed/staff.js
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { seedPasswordFor } from "./usersData.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });

const staffList = [
  // HOD
  { fullName: "Dr. Ibrahim Musa", email: "hod@futminna.edu.ng", role: "HOD", department: "Computer Science" },
  // Exam Officer
  { fullName: "Dr. Sarah Okafor", email: "exam.officer@futminna.edu.ng", role: "Exam Officer", department: "Computer Science" },
  // Timetable Officer
  { fullName: "Mr. Peter Adeyemi", email: "timetable.officer@futminna.edu.ng", role: "Timetable Officer", department: "Computer Science" },
  // Lecturers
  { fullName: "Prof. John Adebayo", email: "john.adebayo@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Fatima Bello", email: "fatima.bello@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Chinedu Eze", email: "chinedu.eze@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Amina Suleiman", email: "amina.suleiman@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Kunle Ogunleye", email: "kunle.ogunleye@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Grace Okonkwo", email: "grace.okonkwo@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Hassan Idris", email: "hassan.idris@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Ngozi Nwachukwu", email: "ngozi.nwachukwu@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Dr. Oluwaseun Akinlade", email: "oluwaseun.akinlade@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Mr. Tunde Bakare", email: "tunde.bakare@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Ms. Chioma Okeke", email: "chioma.okeke@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
  { fullName: "Mr. Emeka Nwosu", email: "emeka.nwosu@futminna.edu.ng", role: "Lecturer", department: "Computer Science" },
];

const seedStaff = async () => {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const s of staffList) {
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
      status: "Active",
      mustChangePassword: false,
    });

    console.log(`  ✅ ${s.role}: ${s.fullName} (${s.email})`);
    created++;
  }

  console.log(`\n🎉 Done! ${created} created, ${skipped} skipped.`);
  process.exit(0);
};

seedStaff().catch((err) => { console.error(err); process.exit(1); });
