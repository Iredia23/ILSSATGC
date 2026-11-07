import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import CourseToLecturerAssignment from "../models/CourseToLecturerAssignment.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });
dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env") });

const testSemesterAutoGenerate = async () => {
  try {
    await connectDB();

    console.log("🔍 Checking courses per semester in DB...");
    const sem1Courses = await Course.find({ semester: "1st Semester", isActive: true });
    const sem2Courses = await Course.find({ semester: "2nd Semester", isActive: true });

    console.log(`  1st Semester Courses: ${sem1Courses.length}`);
    console.log(`  2nd Semester Courses: ${sem2Courses.length}`);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

testSemesterAutoGenerate();
