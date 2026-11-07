// backend/seed/timeslots.js
// Generates hourly time slots: 08:00-13:00 (5 slots) + 14:00-18:00 (4 slots)
// 13:00-14:00 is lunch break - no classes
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import TimeSlot from "../models/TimeSlot.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SEMESTERS = ["1st Semester", "2nd Semester"];

// Only 1-hour slots (no 2-hour slots)
// Morning: 08:00-09:00, 09:00-10:00, 10:00-11:00, 11:00-12:00, 12:00-13:00
// Break:   13:00-14:00 (lunch)
// Afternoon: 14:00-15:00, 15:00-16:00, 16:00-17:00, 17:00-18:00
const generateSlots = () => {
  const slots = [];

  // Morning: 08:00 - 13:00
  for (let hour = 8; hour < 13; hour++) {
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(hour + 1).padStart(2, "0")}:00`;
    slots.push({
      startTime: start,
      endTime: end,
      duration: 1,
      daysAvailable: [...DAYS],
      applicableSemesters: [...SEMESTERS],
    });
  }

  // Afternoon: 14:00 - 18:00 (skip 13:00-14:00 break)
  for (let hour = 14; hour < 18; hour++) {
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(hour + 1).padStart(2, "0")}:00`;
    slots.push({
      startTime: start,
      endTime: end,
      duration: 1,
      daysAvailable: [...DAYS],
      applicableSemesters: [...SEMESTERS],
    });
  }

  return slots;
};

const seedTimeSlots = async () => {
  await connectDB();

  const slots = generateSlots();
  let created = 0;
  let existing = 0;

  console.log("⏰ Generating 1-hour time slots (Mon-Fri):");
  console.log("   Morning: 08:00–13:00 (5 slots)");
  console.log("   Break:   13:00–14:00 (🚫 lunch)");
  console.log("   Afternoon: 14:00–18:00 (4 slots)\n");

  for (const slot of slots) {
    const exists = await TimeSlot.findOne({
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
    });

    if (exists) {
      console.log(`  ⏭ ${slot.startTime}-${slot.endTime} already exists`);
      existing++;
      continue;
    }

    await TimeSlot.create(slot);
    console.log(`  ✅ ${slot.startTime}-${slot.endTime}`);
    created++;
  }

  console.log(`\n📊 Summary: ${created} created, ${existing} already exist`);
  console.log(`   ${slots.length} hourly slots × ${DAYS.length} days = ${slots.length * DAYS.length} total weekly slots`);
  process.exit(0);
};

seedTimeSlots().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
