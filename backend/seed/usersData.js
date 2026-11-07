// backend/seed/usersData.js
// Single source of truth for the demo user accounts.
// Used by backend/seed/seedUsers.js and the server's first-run auto-seed
// (backend/server.js) so login works immediately on a fresh local database.
//
// The demo passwords are not stored in the code. Set them in .env.local:
//   SEED_ADMIN_PASSWORD - password for the Admin account
//   SEED_USER_PASSWORD  - password for every other demo account

export const usersToSeed = [
  // Admin (institution-wide — no school/department)
  { fullName: "Admin User", email: "admin@futminna.edu.ng", role: "Admin", department: "" },
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

// Returns the seed password for a demo account. It is read when called, not
// when this file is imported, because the seed scripts load .env.local after
// their imports have run.
export function seedPasswordFor(user) {
  const setting = user.role === "Admin" ? "SEED_ADMIN_PASSWORD" : "SEED_USER_PASSWORD";
  const password = process.env[setting];
  if (!password) {
    throw new Error(`${setting} is not set in .env.local. Add it, then run this again.`);
  }
  return password;
}
