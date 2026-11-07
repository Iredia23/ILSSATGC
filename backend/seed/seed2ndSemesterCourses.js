import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import Course from "../models/Course.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });
dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env") });

const secondSemesterCourses = [
  // 100 Level (2nd Semester)
  { code: "CSC 102", title: "Introduction to Computer Hardware & Software", creditUnits: 3, level: 100, departments: ["Computer Science", "Cybersecurity"], semester: "2nd Semester" },
  { code: "CYB 102", title: "Fundamentals of Cyber Systems", creditUnits: 2, level: 100, departments: ["Cybersecurity"], semester: "2nd Semester" },
  { code: "IFT 102", title: "Information Technology Fundamentals II", creditUnits: 3, level: 100, departments: ["Information Technology"], semester: "2nd Semester" },
  { code: "MAT 102", title: "Calculus & Analytical Geometry II", creditUnits: 3, level: 100, departments: ["Computer Science", "Cybersecurity", "Electrical & Electronics Engineering"], semester: "2nd Semester" },
  { code: "PHY 102", title: "General Physics II (Electricity & Magnetism)", creditUnits: 3, level: 100, departments: ["Computer Science", "Electrical & Electronics Engineering"], semester: "2nd Semester" },
  { code: "GST 102", title: "Communication in English II", creditUnits: 2, level: 100, departments: ["Computer Science", "Cybersecurity", "Information Technology", "Architecture"], semester: "2nd Semester" },

  // 200 Level (2nd Semester)
  { code: "CSC 202", title: "Data Structures & Algorithms", creditUnits: 3, level: 200, departments: ["Computer Science", "Software Engineering"], semester: "2nd Semester" },
  { code: "CSC 204", title: "Object-Oriented Programming (Java/C++)", creditUnits: 3, level: 200, departments: ["Computer Science"], semester: "2nd Semester" },
  { code: "CYB 202", title: "Cryptography & Data Protection", creditUnits: 3, level: 200, departments: ["Cybersecurity"], semester: "2nd Semester" },
  { code: "IFT 202", title: "Database Management Systems I", creditUnits: 3, level: 200, departments: ["Information Technology", "Computer Science"], semester: "2nd Semester" },
  { code: "EEE 202", title: "Circuit Theory II", creditUnits: 3, level: 200, departments: ["Electrical & Electronics Engineering"], semester: "2nd Semester" },
  { code: "MEE 202", title: "Engineering Thermodynamics", creditUnits: 3, level: 200, departments: ["Mechanical Engineering"], semester: "2nd Semester" },

  // 300 Level (2nd Semester)
  { code: "CSC 302", title: "Operating Systems II", creditUnits: 3, level: 300, departments: ["Computer Science"], semester: "2nd Semester" },
  { code: "CSC 304", title: "Computer Networks II", creditUnits: 3, level: 300, departments: ["Computer Science", "Cybersecurity"], semester: "2nd Semester" },
  { code: "CYB 302", title: "Network Security & Firewalls", creditUnits: 3, level: 300, departments: ["Cybersecurity"], semester: "2nd Semester" },
  { code: "CYB 304", title: "Digital Forensics & Incident Response", creditUnits: 3, level: 300, departments: ["Cybersecurity"], semester: "2nd Semester" },
  { code: "IFT 302", title: "Web Systems & Cloud Architecture", creditUnits: 3, level: 300, departments: ["Information Technology"], semester: "2nd Semester" },
  { code: "EEE 302", title: "Electromagnetic Fields & Waves", creditUnits: 3, level: 300, departments: ["Electrical & Electronics Engineering"], semester: "2nd Semester" },
  { code: "MEE 302", title: "Fluid Mechanics II", creditUnits: 3, level: 300, departments: ["Mechanical Engineering"], semester: "2nd Semester" },
  { code: "ARC 302", title: "Architectural Design Studio II", creditUnits: 4, level: 300, departments: ["Architecture"], semester: "2nd Semester" },

  // 400 Level (2nd Semester)
  { code: "CSC 402", title: "Compiler Construction", creditUnits: 3, level: 400, departments: ["Computer Science"], semester: "2nd Semester" },
  { code: "CSC 404", title: "Distributed & Cloud Systems", creditUnits: 3, level: 400, departments: ["Computer Science"], semester: "2nd Semester" },
  { code: "CYB 402", title: "Ethical Hacking & Penetration Testing", creditUnits: 3, level: 400, departments: ["Cybersecurity"], semester: "2nd Semester" },
  { code: "CYB 404", title: "Cyber Governance, Ethics & Law", creditUnits: 2, level: 400, departments: ["Cybersecurity"], semester: "2nd Semester" },
  { code: "IFT 402", title: "Enterprise Systems & Integration", creditUnits: 3, level: 400, departments: ["Information Technology"], semester: "2nd Semester" },
  { code: "EEE 402", title: "Power Electronics & Electrical Drives", creditUnits: 3, level: 400, departments: ["Electrical & Electronics Engineering"], semester: "2nd Semester" },
  { code: "MEE 402", title: "Machine Component Design II", creditUnits: 3, level: 400, departments: ["Mechanical Engineering"], semester: "2nd Semester" },
  { code: "BLD 402", title: "Building Services & Sanitation", creditUnits: 3, level: 400, departments: ["Building Technology"], semester: "2nd Semester" },

  // 500 Level (2nd Semester)
  { code: "CSC 502", title: "Artificial Intelligence & Neural Networks", creditUnits: 3, level: 500, departments: ["Computer Science"], semester: "2nd Semester" },
  { code: "CYB 502", title: "Advanced Cyber Threat Intelligence", creditUnits: 3, level: 500, departments: ["Cybersecurity"], semester: "2nd Semester" },
];

const seed2ndSemester = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding 30 2nd Semester Courses...");

    let count = 0;
    for (const cData of secondSemesterCourses) {
      let existing = await Course.findOne({ code: cData.code });
      if (!existing) {
        await Course.create(cData);
        console.log(`  + Created 2nd Semester Course: ${cData.code} - ${cData.title}`);
        count++;
      } else {
        existing.semester = "2nd Semester";
        await existing.save();
        console.log(`  = Updated to 2nd Semester: ${cData.code}`);
      }
    }

    console.log(`✅ Successfully seeded 30 2nd Semester Courses (Created/Updated: ${count})`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding 2nd semester courses failed:", err);
    process.exit(1);
  }
};

seed2ndSemester();
