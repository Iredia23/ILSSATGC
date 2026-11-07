// backend/seed/courses.js
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import Course from "../models/Course.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });

const coursesByLevel = {
  100: [
    { code: "CSC 101", title: "Introduction to Computer Science", creditUnits: 3 },
    { code: "CSC 103", title: "Introduction to Programming", creditUnits: 3 },
    { code: "CSC 105", title: "Introduction to Information Technology", creditUnits: 2 },
    { code: "MTH 101", title: "Elementary Mathematics I", creditUnits: 3 },
    { code: "GST 101", title: "Communication in English", creditUnits: 2 },
  ],
  200: [
    { code: "CSC 201", title: "Object-Oriented Programming", creditUnits: 3 },
    { code: "CSC 203", title: "Data Structures and Algorithms", creditUnits: 3 },
    { code: "CSC 205", title: "Computer Organization and Architecture", creditUnits: 3 },
    { code: "MTH 201", title: "Linear Algebra", creditUnits: 2 },
    { code: "CSC 207", title: "Database Systems", creditUnits: 3 },
  ],
  300: [
    { code: "CSC 301", title: "Software Engineering", creditUnits: 3 },
    { code: "CSC 303", title: "Operating Systems", creditUnits: 3 },
    { code: "CSC 305", title: "Computer Networks", creditUnits: 3 },
    { code: "CSC 307", title: "Web Technologies", creditUnits: 3 },
    { code: "CSC 309", title: "Artificial Intelligence", creditUnits: 3 },
  ],
  400: [
    { code: "CSC 401", title: "Compiler Construction", creditUnits: 3 },
    { code: "CSC 403", title: "Computer Graphics", creditUnits: 3 },
    { code: "CSC 405", title: "Cyber Security", creditUnits: 3 },
    { code: "CSC 407", title: "Machine Learning", creditUnits: 3 },
    { code: "CSC 409", title: "Human-Computer Interaction", creditUnits: 2 },
  ],
  500: [
    { code: "CSC 501", title: "Advanced Software Engineering", creditUnits: 3 },
    { code: "CSC 503", title: "Distributed Systems", creditUnits: 3 },
    { code: "CSC 505", title: "Cloud Computing", creditUnits: 3 },
    { code: "CSC 507", title: "Data Science and Analytics", creditUnits: 3 },
    { code: "CSC 509", title: "Research Methodology", creditUnits: 2 },
  ],
};

const seedCourses = async () => {
  await connectDB();

  let totalCreated = 0;
  let totalExisting = 0;

  for (const [level, courses] of Object.entries(coursesByLevel)) {
    for (const course of courses) {
      const existing = await Course.findOne({ code: course.code });
      if (existing) {
        console.log(`  ⏭ ${course.code} already exists`);
        totalExisting++;
        continue;
      }

      await Course.create({
        code: course.code,
        title: course.title,
        creditUnits: course.creditUnits,
        level: parseInt(level),
        departments: ["Computer Science"],
        semester: "1st Semester",
      });

      console.log(`  ✅ ${course.code} - ${course.title}`);
      totalCreated++;
    }
  }

  console.log(`\n📊 Summary: ${totalCreated} created, ${totalExisting} already exist`);
  process.exit(0);
};

seedCourses().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
