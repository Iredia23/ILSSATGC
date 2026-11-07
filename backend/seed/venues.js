// backend/seed/venues.js
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "../config/db.js";
import Venue from "../models/Venue.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", "..", ".env.local") });

const venues = [
  {
    name: "Lecture Hall A",
    building: "Main Academic Building",
    capacity: 200,
    type: "Lecture Hall",
    equipment: ["Projector", "Whiteboard", "Microphone", "Speaker System"],
  },
  {
    name: "Lecture Hall B",
    building: "Main Academic Building",
    capacity: 150,
    type: "Lecture Hall",
    equipment: ["Projector", "Whiteboard", "Microphone"],
  },
  {
    name: "Science Laboratory 1",
    building: "Science Complex",
    capacity: 60,
    type: "Laboratory",
    equipment: ["Computer Lab", "Whiteboard", "WiFi"],
  },
  {
    name: "Science Laboratory 2",
    building: "Science Complex",
    capacity: 50,
    type: "Laboratory",
    equipment: ["Computer Lab", "WiFi", "Smart Board"],
  },
  {
    name: "Engineering Laboratory",
    building: "Engineering Block",
    capacity: 45,
    type: "Laboratory",
    equipment: ["Computer Lab", "Whiteboard", "Projector", "WiFi"],
  },
  {
    name: "Seminar Room 1",
    building: "Administrative Block",
    capacity: 40,
    type: "Seminar Room",
    equipment: ["Projector", "Whiteboard", "WiFi", "Speaker System"],
  },
  {
    name: "Seminar Room 2",
    building: "Library Complex",
    capacity: 35,
    type: "Seminar Room",
    equipment: ["Projector", "Whiteboard", "WiFi"],
  },
  {
    name: "Main Auditorium",
    building: "Student Centre",
    capacity: 500,
    type: "Auditorium",
    equipment: ["Projector", "Microphone", "Speaker System", "Smart Board"],
  },
  {
    name: "Lecture Hall C",
    building: "New Academic Building",
    capacity: 120,
    type: "Lecture Hall",
    equipment: ["Projector", "Whiteboard", "Speaker System", "WiFi"],
  },
  {
    name: "Computer Science Lab",
    building: "ICT Building",
    capacity: 80,
    type: "Laboratory",
    equipment: ["Computer Lab", "Projector", "Whiteboard", "WiFi"],
  },
];

const seedVenues = async () => {
  await connectDB();

  let created = 0;
  let existing = 0;

  for (const venue of venues) {
    const exists = await Venue.findOne({ name: venue.name });
    if (exists) {
      console.log(`  ⏭ ${venue.name} already exists`);
      existing++;
      continue;
    }

    await Venue.create(venue);
    console.log(`  ✅ ${venue.name} (${venue.type}, capacity: ${venue.capacity})`);
    created++;
  }

  console.log(`\n📊 Summary: ${created} created, ${existing} already exist`);
  process.exit(0);
};

seedVenues().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
