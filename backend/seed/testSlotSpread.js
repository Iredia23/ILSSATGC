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

const testSpread = async () => {
  try {
    await connectDB();

    console.log("🧹 Clearing old assignments for test...");
    await CourseToVenueTimeAssignment.deleteMany({});

    const allCourses = await Course.find({ isActive: true });
    const venues = await Venue.find({ isActive: true }).sort({ capacity: -1 });
    const timeSlots = await TimeSlot.find({ isActive: true }).sort({ startTime: 1 });
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    const clAssignments = await CourseToLecturerAssignment.find().populate("lecturerId", "fullName");
    const clMap = new Map();
    clAssignments.forEach((cl) => clMap.set(cl.courseId.toString(), cl));

    const occupiedVenues = new Set();
    const occupiedLecturers = new Set();
    const occupiedLevels = new Set();
    const slotUsage = {};
    const levelDayCounts = {};

    const newAssignments = [];

    for (const course of allCourses) {
      const cl = clMap.get(course._id.toString());
      const lecturerId = cl?.lecturerId?._id?.toString();
      const lecturerName = cl?.lecturerId?.fullName || "Unassigned";

      let bestSlot = null;
      let minPenalty = Infinity;

      for (const day of DAYS) {
        for (const slot of timeSlots) {
          if (slot.startTime === "13:00") continue;

          for (const venue of venues) {
            const vKey = `${venue._id.toString()}-${day}-${slot._id.toString()}`;
            const lKey = lecturerId ? `${lecturerId}-${day}-${slot._id.toString()}` : null;
            const lvlKey = course.level ? `${course.level}-${day}-${slot._id.toString()}` : null;

            if (occupiedVenues.has(vKey)) continue;
            if (lKey && occupiedLecturers.has(lKey)) continue;

            let penalty = 0;
            const daySlotKey = `${day}-${slot._id.toString()}`;
            const globalSlotLoad = slotUsage[daySlotKey] || 0;

            penalty += globalSlotLoad * 100;

            if (lvlKey && occupiedLevels.has(lvlKey)) {
              penalty += 500;
            }

            const dayLevelKey = `${course.level}-${day}`;
            const currentDayCount = levelDayCounts[dayLevelKey] || 0;
            penalty += currentDayCount * 30;

            penalty += Math.random() * 2;

            if (penalty < minPenalty) {
              minPenalty = penalty;
              bestSlot = {
                venue,
                timeSlot: slot,
                dayOfWeek: day,
                vKey,
                lKey,
                lvlKey,
                dayLevelKey,
                daySlotKey,
              };
            }
          }
        }
      }

      if (bestSlot) {
        occupiedVenues.add(bestSlot.vKey);
        if (bestSlot.lKey) occupiedLecturers.add(bestSlot.lKey);
        if (bestSlot.lvlKey) occupiedLevels.add(bestSlot.lvlKey);
        levelDayCounts[bestSlot.dayLevelKey] = (levelDayCounts[bestSlot.dayLevelKey] || 0) + 1;
        slotUsage[bestSlot.daySlotKey] = (slotUsage[bestSlot.daySlotKey] || 0) + 1;

        newAssignments.push({
          courseCode: course.code,
          day: bestSlot.dayOfWeek,
          startTime: bestSlot.timeSlot.startTime,
          venue: bestSlot.venue.name,
        });
      }
    }

    console.log(`✅ Placed ${newAssignments.length} / ${allCourses.length} courses`);
    console.log("\n📊 Time Slot Distribution:");
    const slotCounts = {};
    newAssignments.forEach((a) => {
      slotCounts[a.startTime] = (slotCounts[a.startTime] || 0) + 1;
    });
    console.table(slotCounts);

    console.log("\n📅 Day Distribution:");
    const dayCounts = {};
    newAssignments.forEach((a) => {
      dayCounts[a.day] = (dayCounts[a.day] || 0) + 1;
    });
    console.table(dayCounts);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

testSpread();
