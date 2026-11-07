import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });
dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env") });

const testAutoGenerate = async () => {
  try {
    await connectDB();

    console.log("🔍 Checking active courses, venues, and time slots...");
    const courses = await Course.find({ isActive: true });
    const venues = await Venue.find({ isActive: true });
    const slots = await TimeSlot.find({ isActive: true });

    console.log(`  Courses: ${courses.length}`);
    console.log(`  Venues: ${venues.length}`);
    console.log(`  TimeSlots: ${slots.length}`);

    const existing = await CourseToVenueTimeAssignment.find({ isScheduled: true });
    console.log(`  Currently Scheduled Assignments: ${existing.length}`);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

testAutoGenerate();
