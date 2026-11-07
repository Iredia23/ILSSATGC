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

const testScheduler = async () => {
  try {
    await connectDB();

    console.log("🧹 Clearing old assignments for testing department scheduler...");
    await CourseToVenueTimeAssignment.deleteMany({});

    // Test auto-generating for "Computer Science" in "1st Semester"
    const targetDept = "Computer Science";
    const semester = "1st Semester";

    const allCourses = await Course.find({ semester, isActive: true, departments: targetDept });
    const venues = await Venue.find({ isActive: true }).sort({ capacity: -1 });
    const timeSlots = await TimeSlot.find({ isActive: true }).sort({ startTime: 1 });
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    console.log(`📌 Found ${allCourses.length} active 1st Semester courses for department '${targetDept}'`);

    const consecutivePairs = [];
    for (let i = 0; i < timeSlots.length - 1; i++) {
      const s1 = timeSlots[i];
      const s2 = timeSlots[i + 1];
      if (s1.startTime === "13:00" || s2.startTime === "13:00") continue;
      if (s1.endTime === s2.startTime) {
        consecutivePairs.push([s1, s2]);
      }
    }

    console.log(`⏱️ Identified ${consecutivePairs.length} consecutive 2-hour slot pairs per day`);

    const occupiedVenues = new Set();
    const occupiedDeptLevels = new Set();
    const newAssignments = [];

    for (const course of allCourses) {
      let bestBlock = null;
      let minPenalty = Infinity;

      for (const day of DAYS) {
        for (const [slot1, slot2] of consecutivePairs) {
          for (const venue of venues) {
            const vKey1 = `${venue._id.toString()}-${day}-${slot1._id.toString()}`;
            const vKey2 = `${venue._id.toString()}-${day}-${slot2._id.toString()}`;

            if (occupiedVenues.has(vKey1) || occupiedVenues.has(vKey2)) continue;

            let deptLevelClash = false;
            for (const dept of course.departments) {
              const dlKey1 = `${dept}-${course.level}-${day}-${slot1._id.toString()}`;
              const dlKey2 = `${dept}-${course.level}-${day}-${slot2._id.toString()}`;
              if (occupiedDeptLevels.has(dlKey1) || occupiedDeptLevels.has(dlKey2)) {
                deptLevelClash = true;
                break;
              }
            }
            if (deptLevelClash) continue;

            const penalty = Math.random();
            if (penalty < minPenalty) {
              minPenalty = penalty;
              bestBlock = { venue, slot1, slot2, dayOfWeek: day, vKey1, vKey2 };
            }
          }
        }
      }

      if (bestBlock) {
        occupiedVenues.add(bestBlock.vKey1);
        occupiedVenues.add(bestBlock.vKey2);
        for (const dept of course.departments) {
          occupiedDeptLevels.add(`${dept}-${course.level}-${bestBlock.dayOfWeek}-${bestBlock.slot1._id.toString()}`);
          occupiedDeptLevels.add(`${dept}-${course.level}-${bestBlock.dayOfWeek}-${bestBlock.slot2._id.toString()}`);
        }

        newAssignments.push({
          courseCode: course.code,
          day: bestBlock.dayOfWeek,
          time: `${bestBlock.slot1.startTime} - ${bestBlock.slot2.endTime}`,
          type: "2-Hour Block",
          venue: bestBlock.venue.name,
          level: course.level,
        });

        // Extra 1-hour slot if >= 3 credit units
        if (course.creditUnits >= 3) {
          let bestExtraSlot = null;
          let minExtraPenalty = Infinity;

          for (const day of DAYS) {
            if (day === bestBlock.dayOfWeek) continue;
            for (const slot of timeSlots) {
              if (slot.startTime === "13:00") continue;
              for (const venue of venues) {
                const vKey = `${venue._id.toString()}-${day}-${slot._id.toString()}`;
                if (occupiedVenues.has(vKey)) continue;

                let deptLevelClash = false;
                for (const dept of course.departments) {
                  const dlKey = `${dept}-${course.level}-${day}-${slot._id.toString()}`;
                  if (occupiedDeptLevels.has(dlKey)) {
                    deptLevelClash = true;
                    break;
                  }
                }
                if (deptLevelClash) continue;

                const penalty = Math.random();
                if (penalty < minExtraPenalty) {
                  minExtraPenalty = penalty;
                  bestExtraSlot = { venue, timeSlot: slot, dayOfWeek: day, vKey };
                }
              }
            }
          }

          if (bestExtraSlot) {
            occupiedVenues.add(bestExtraSlot.vKey);
            for (const dept of course.departments) {
              occupiedDeptLevels.add(`${dept}-${course.level}-${bestExtraSlot.dayOfWeek}-${bestExtraSlot.timeSlot._id.toString()}`);
            }

            newAssignments.push({
              courseCode: course.code,
              day: bestExtraSlot.dayOfWeek,
              time: `${bestExtraSlot.timeSlot.startTime} - ${bestExtraSlot.timeSlot.endTime}`,
              type: "1-Hour Extra Slot",
              venue: bestExtraSlot.venue.name,
              level: course.level,
            });
          }
        }
      }
    }

    console.log(`\n✅ Generated ${newAssignments.length} timetable slot entries for ${targetDept}:`);
    console.table(newAssignments);

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

testScheduler();
