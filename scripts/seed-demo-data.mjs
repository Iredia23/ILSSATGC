// scripts/seed-demo-data.mjs
// Seeds demo data through the app's own API (uses the running server's stable DB connection).
// Idempotent — safe to re-run; skips anything that already exists.
//
// Usage:  node scripts/seed-demo-data.mjs
// Env:    API_URL (default http://localhost:5000/api)
//         SEED_ADMIN_PASSWORD (the Admin password, from .env.local)
//
// Seeds:
//   - 10 venues, 9 hourly time slots (Mon–Fri)
//   - 55 courses (25 × 1st Semester, 30 × 2nd Semester)
//   - Lecturer assignments for 20 of the 1st-semester courses (5 left unassigned)
//   - Auto-generated 1st-semester timetable
import dotenv from "dotenv";
import { join } from "node:path";

dotenv.config({ path: join(import.meta.dirname, "..", ".env.local") });

const BASE = process.env.API_URL || "http://localhost:5000/api";

const ADMIN_EMAIL = "admin@futminna.edu.ng";
const ADMIN_PASS = process.env.SEED_ADMIN_PASSWORD;
if (!ADMIN_PASS) {
  console.error("❌ SEED_ADMIN_PASSWORD is not set in .env.local. Add it, then run this again.");
  process.exit(1);
}

let token = null;
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login() {
  const { data } = await req("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    rememberMe: false,
  });
  if (!data.token) throw new Error("Admin login failed: " + JSON.stringify(data));
  token = data.token;
  console.log(`✔ Logged in as ${ADMIN_EMAIL}`);
}

// ── Venues (from backend/seed/venues.js) ──────────────────────────────────
const VENUES = [
  { name: "Lecture Hall A", building: "Main Academic Building", capacity: 200, type: "Lecture Hall", equipment: ["Projector", "Whiteboard", "Microphone", "Speaker System"] },
  { name: "Lecture Hall B", building: "Main Academic Building", capacity: 150, type: "Lecture Hall", equipment: ["Projector", "Whiteboard", "Microphone"] },
  { name: "Science Laboratory 1", building: "Science Complex", capacity: 60, type: "Laboratory", equipment: ["Computer Lab", "Whiteboard", "WiFi"] },
  { name: "Science Laboratory 2", building: "Science Complex", capacity: 50, type: "Laboratory", equipment: ["Computer Lab", "WiFi", "Smart Board"] },
  { name: "Engineering Laboratory", building: "Engineering Block", capacity: 45, type: "Laboratory", equipment: ["Computer Lab", "Whiteboard", "Projector", "WiFi"] },
  { name: "Seminar Room 1", building: "Administrative Block", capacity: 40, type: "Seminar Room", equipment: ["Projector", "Whiteboard", "WiFi", "Speaker System"] },
  { name: "Seminar Room 2", building: "Library Complex", capacity: 35, type: "Seminar Room", equipment: ["Projector", "Whiteboard", "WiFi"] },
  { name: "Main Auditorium", building: "Student Centre", capacity: 500, type: "Auditorium", equipment: ["Projector", "Microphone", "Speaker System", "Smart Board"] },
  { name: "Lecture Hall C", building: "New Academic Building", capacity: 120, type: "Lecture Hall", equipment: ["Projector", "Whiteboard", "Speaker System", "WiFi"] },
  { name: "Computer Science Lab", building: "ICT Building", capacity: 80, type: "Laboratory", equipment: ["Computer Lab", "Projector", "Whiteboard", "WiFi"] },
];

// ── Full institutional structure — FUT Minna schools & departments ────────
// The system is built for the entire institution; Computer Science (SICT) is
// the case study used for the demo users and assignments.
const SCHOOLS = [
  { name: "School of Information and Communication Technology", code: "SICT", description: "Computing, IT, Cybersecurity and Telecommunications" },
  { name: "School of Engineering and Engineering Technology", code: "SEET", description: "Electrical, Mechanical, Mechatronics and Computer Engineering" },
  { name: "School of Science and Technology Education", code: "SSTE", description: "Science Education and Educational Technology" },
  { name: "School of Environmental Technology", code: "SET", description: "Architecture, Building, Quantity Surveying and Urban Planning" },
  { name: "School of Agriculture and Agricultural Technology", code: "SAAT", description: "Crop & Animal Production, Agricultural Economics, Food Science and Water Resources" },
  { name: "School of Life Sciences", code: "SLS", description: "Biochemistry, Biology, Microbiology, Plant and Zoological Sciences" },
  { name: "School of Physical Sciences", code: "SPS", description: "Chemistry, Mathematics, Physics, Statistics, Geology and Geography" },
  { name: "School of Infrastructure, Process Engineering and Technology", code: "SIPET", description: "Chemical, Civil, Materials and Petroleum Engineering" },
];

const DEPARTMENTS_BY_SCHOOL = {
  SICT: [
    { name: "Computer Science", code: "CSC" },
    { name: "Cybersecurity", code: "CYB" },
    { name: "Information Technology", code: "IFT" },
    { name: "Telecommunication Engineering", code: "TCE" },
  ],
  SEET: [
    { name: "Electrical & Electronics Engineering", code: "EEE" },
    { name: "Mechanical Engineering", code: "MEE" },
    { name: "Mechatronics Engineering", code: "MTE" },
    { name: "Computer Engineering", code: "CPE" },
  ],
  SSTE: [
    { name: "Educational Technology", code: "EDT" },
    { name: "Science Education", code: "SED" },
  ],
  SET: [
    { name: "Architecture", code: "ARC" },
    { name: "Building Technology", code: "BLD" },
    { name: "Quantity Surveying", code: "QSV" },
    { name: "Urban & Regional Planning", code: "URP" },
    { name: "Estate Management", code: "ESM" },
  ],
  SAAT: [
    { name: "Agricultural Economics & Farm Management", code: "AEM" },
    { name: "Crop Production", code: "CPR" },
    { name: "Animal Production", code: "APR" },
    { name: "Soil Science", code: "SSC" },
    { name: "Food Science & Technology", code: "FST" },
    { name: "Water Resources, Aquaculture & Fisheries", code: "WAF" },
  ],
  SLS: [
    { name: "Biochemistry", code: "BCH" },
    { name: "Biology", code: "BIO" },
    { name: "Microbiology", code: "MCB" },
    { name: "Plant Biology", code: "PLB" },
    { name: "Zoology", code: "ZOO" },
  ],
  SPS: [
    { name: "Chemistry", code: "CHM" },
    { name: "Mathematics", code: "MTH" },
    { name: "Physics", code: "PHY" },
    { name: "Statistics", code: "STA" },
    { name: "Geology", code: "GLY" },
    { name: "Geography", code: "GEO" },
    { name: "Remote Sensing & GIS", code: "RSG" },
  ],
  SIPET: [
    { name: "Chemical Engineering", code: "CHE" },
    { name: "Civil Engineering", code: "CVE" },
    { name: "Materials & Metallurgical Engineering", code: "MME" },
    { name: "Petroleum & Gas Engineering", code: "PGE" },
  ],
};

// ── Time slots (from backend/seed/timeslots.js) ───────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SEMESTERS = ["1st Semester", "2nd Semester"];
function makeSlots() {
  const slots = [];
  for (let hour = 8; hour < 13; hour++) {
    slots.push({ startTime: `${String(hour).padStart(2, "0")}:00`, endTime: `${String(hour + 1).padStart(2, "0")}:00`, duration: 1, daysAvailable: [...DAYS], applicableSemesters: [...SEMESTERS] });
  }
  for (let hour = 14; hour < 18; hour++) {
    slots.push({ startTime: `${String(hour).padStart(2, "0")}:00`, endTime: `${String(hour + 1).padStart(2, "0")}:00`, duration: 1, daysAvailable: [...DAYS], applicableSemesters: [...SEMESTERS] });
  }
  return slots;
}

// ── Courses ───────────────────────────────────────────────────────────────
const S1_COURSES = {
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

// 1st-semester courses for other departments (institutional scope beyond the
// Computer Science case study). These are left WITHOUT lecturer assignments so
// they demonstrate that courses can be scheduled even when not assigned.
const S1_OTHER_COURSES = [
  // SEET
  { code: "EEE 201", title: "Circuit Theory I", creditUnits: 3, level: 200, departments: ["Electrical & Electronics Engineering"] },
  { code: "MEE 201", title: "Engineering Mechanics I", creditUnits: 3, level: 200, departments: ["Mechanical Engineering"] },
  // SPS
  { code: "CHM 101", title: "General Chemistry I", creditUnits: 3, level: 100, departments: ["Chemistry", "Biochemistry", "Microbiology"] },
  { code: "PHY 101", title: "General Physics I (Mechanics)", creditUnits: 3, level: 100, departments: ["Physics", "Computer Science", "Electrical & Electronics Engineering"] },
  { code: "MTH 103", title: "Elementary Mathematics III", creditUnits: 3, level: 100, departments: ["Mathematics", "Physics", "Statistics"] },
  // SLS
  { code: "BIO 101", title: "General Biology I", creditUnits: 3, level: 100, departments: ["Biology", "Biochemistry", "Microbiology"] },
  { code: "BCH 201", title: "General Biochemistry I", creditUnits: 3, level: 200, departments: ["Biochemistry"] },
  { code: "MCB 201", title: "General Microbiology I", creditUnits: 3, level: 200, departments: ["Microbiology", "Biology"] },
  // SAAT
  { code: "AEM 201", title: "Principles of Agricultural Economics", creditUnits: 2, level: 200, departments: ["Agricultural Economics & Farm Management"] },
  { code: "FST 201", title: "Introduction to Food Science & Technology", creditUnits: 2, level: 200, departments: ["Food Science & Technology"] },
  // SIPET
  { code: "CHE 201", title: "Chemical Engineering Principles I", creditUnits: 3, level: 200, departments: ["Chemical Engineering"] },
  { code: "CVE 201", title: "Engineering Materials", creditUnits: 3, level: 200, departments: ["Civil Engineering", "Materials & Metallurgical Engineering"] },
];

const S2_COURSES = [
  { code: "CSC 102", title: "Introduction to Computer Hardware & Software", creditUnits: 3, level: 100, departments: ["Computer Science", "Cybersecurity"] },
  { code: "CYB 102", title: "Fundamentals of Cyber Systems", creditUnits: 2, level: 100, departments: ["Cybersecurity"] },
  { code: "IFT 102", title: "Information Technology Fundamentals II", creditUnits: 3, level: 100, departments: ["Information Technology"] },
  { code: "MAT 102", title: "Calculus & Analytical Geometry II", creditUnits: 3, level: 100, departments: ["Computer Science", "Cybersecurity", "Electrical & Electronics Engineering"] },
  { code: "PHY 102", title: "General Physics II (Electricity & Magnetism)", creditUnits: 3, level: 100, departments: ["Computer Science", "Electrical & Electronics Engineering"] },
  { code: "GST 102", title: "Communication in English II", creditUnits: 2, level: 100, departments: ["Computer Science", "Cybersecurity", "Information Technology", "Architecture"] },
  { code: "CSC 202", title: "Data Structures & Algorithms", creditUnits: 3, level: 200, departments: ["Computer Science", "Software Engineering"] },
  { code: "CSC 204", title: "Object-Oriented Programming (Java/C++)", creditUnits: 3, level: 200, departments: ["Computer Science"] },
  { code: "CYB 202", title: "Cryptography & Data Protection", creditUnits: 3, level: 200, departments: ["Cybersecurity"] },
  { code: "IFT 202", title: "Database Management Systems I", creditUnits: 3, level: 200, departments: ["Information Technology", "Computer Science"] },
  { code: "EEE 202", title: "Circuit Theory II", creditUnits: 3, level: 200, departments: ["Electrical & Electronics Engineering"] },
  { code: "MEE 202", title: "Engineering Thermodynamics", creditUnits: 3, level: 200, departments: ["Mechanical Engineering"] },
  { code: "CSC 302", title: "Operating Systems II", creditUnits: 3, level: 300, departments: ["Computer Science"] },
  { code: "CSC 304", title: "Computer Networks II", creditUnits: 3, level: 300, departments: ["Computer Science", "Cybersecurity"] },
  { code: "CYB 302", title: "Network Security & Firewalls", creditUnits: 3, level: 300, departments: ["Cybersecurity"] },
  { code: "CYB 304", title: "Digital Forensics & Incident Response", creditUnits: 3, level: 300, departments: ["Cybersecurity"] },
  { code: "IFT 302", title: "Web Systems & Cloud Architecture", creditUnits: 3, level: 300, departments: ["Information Technology"] },
  { code: "EEE 302", title: "Electromagnetic Fields & Waves", creditUnits: 3, level: 300, departments: ["Electrical & Electronics Engineering"] },
  { code: "MEE 302", title: "Fluid Mechanics II", creditUnits: 3, level: 300, departments: ["Mechanical Engineering"] },
  { code: "ARC 302", title: "Architectural Design Studio II", creditUnits: 4, level: 300, departments: ["Architecture"] },
  { code: "CSC 402", title: "Compiler Construction", creditUnits: 3, level: 400, departments: ["Computer Science"] },
  { code: "CSC 404", title: "Distributed & Cloud Systems", creditUnits: 3, level: 400, departments: ["Computer Science"] },
  { code: "CYB 402", title: "Ethical Hacking & Penetration Testing", creditUnits: 3, level: 400, departments: ["Cybersecurity"] },
  { code: "CYB 404", title: "Cyber Governance, Ethics & Law", creditUnits: 2, level: 400, departments: ["Cybersecurity"] },
  { code: "IFT 402", title: "Enterprise Systems & Integration", creditUnits: 3, level: 400, departments: ["Information Technology"] },
  { code: "EEE 402", title: "Power Electronics & Electrical Drives", creditUnits: 3, level: 400, departments: ["Electrical & Electronics Engineering"] },
  { code: "MEE 402", title: "Machine Component Design II", creditUnits: 3, level: 400, departments: ["Mechanical Engineering"] },
  { code: "BLD 402", title: "Building Services & Sanitation", creditUnits: 3, level: 400, departments: ["Building Technology"] },
  { code: "CSC 502", title: "Artificial Intelligence & Neural Networks", creditUnits: 3, level: 500, departments: ["Computer Science"] },
  { code: "CYB 502", title: "Advanced Cyber Threat Intelligence", creditUnits: 3, level: 500, departments: ["Cybersecurity"] },
];

// Courses left WITHOUT a lecturer assignment so the Timetable Officer
// "Unassigned" stat is non-zero.
const UNASSIGNED_CODES = new Set(["GST 101", "MTH 101", "CSC 105", "CSC 205", "CSC 409"]);

async function fetchAll(path) {
  const all = [];
  let page = 1;
  for (;;) {
    const { data } = await req("GET", `${path}${path.includes("?") ? "&" : "?"}limit=100&page=${page}`);
    const list = data.courses || data.venues || data.timeSlots || data.lecturers || [];
    all.push(...list);
    if (list.length === 0 || page >= (data.pagination?.pages || 1)) break;
    page++;
  }
  return all;
}

async function seedVenues(existingNames) {
  let created = 0;
  for (const v of VENUES) {
    if (existingNames.has(v.name)) continue;
    const { status, data } = await req("POST", "/venues", v);
    if (status < 300) { created++; console.log(`  ✔ venue: ${v.name}`); }
    else console.warn(`  ✖ venue ${v.name}: ${data.message || status}`);
  }
  return created;
}

async function seedTimeSlots(existingKeys) {
  const slots = makeSlots().filter((s) => !existingKeys.has(`${s.startTime}-${s.endTime}`));
  if (slots.length === 0) { console.log("  ⏭ time slots: all exist"); return 0; }
  const { status, data } = await req("POST", "/timeslots/batch", { timeSlots: slots });
  if (status < 300) { console.log(`  ✔ time slots: created ${data.created || slots.length}`); return data.created || slots.length; }
  console.warn(`  ✖ time slots: ${data.message || status}`);
  return 0;
}

async function seedAcademicStructure() {
  const { data: schoolData } = await req("GET", "/schools");
  const { data: deptData } = await req("GET", "/departments");
  const existingSchools = new Set((schoolData.schools || []).map((s) => s.code));
  const existingDeptNames = new Set((deptData.departments || []).map((d) => d.name));

  let created = 0;
  for (const s of SCHOOLS) {
    let school = (schoolData.schools || []).find((x) => x.code === s.code);
    if (!school) {
      const { status, data } = await req("POST", "/schools", s);
      if (status < 300) { school = data.school; created++; console.log(`  ✔ school: ${s.code} — ${s.name}`); }
      else { console.warn(`  ✖ school ${s.code}: ${data.message || status}`); continue; }
    }
    for (const d of DEPARTMENTS_BY_SCHOOL[s.code] || []) {
      if (existingDeptNames.has(d.name)) continue;
      const { status, data } = await req("POST", "/departments", { name: d.name, code: d.code, schoolId: school._id });
      if (status < 300) { created++; console.log(`  ✔ dept: ${d.name} (${s.code})`); }
      else console.warn(`  ✖ dept ${d.name}: ${data.message || status}`);
    }
  }
  return created;
}

async function seedCourses(existingCodes) {
  const all = [];
  for (const [level, courses] of Object.entries(S1_COURSES)) {
    for (const c of courses) all.push({ ...c, level: parseInt(level), departments: ["Computer Science"], semester: "1st Semester" });
  }
  for (const c of S1_OTHER_COURSES) all.push({ ...c, semester: "1st Semester" });
  for (const c of S2_COURSES) all.push({ ...c, semester: "2nd Semester" });

  let created = 0;
  for (const c of all) {
    if (existingCodes.has(c.code)) continue;
    const { status, data } = await req("POST", "/courses", c);
    if (status < 300) { created++; console.log(`  ✔ course: ${c.code} (${c.semester})`); }
    else console.warn(`  ✖ course ${c.code}: ${data.message || status}`);
  }
  return created;
}

async function seedLecturerAssignments(courses, lecturers) {
  // Only the Computer Science case-study courses get lecturer assignments;
  // courses from other departments stay unassigned to demonstrate that
  // courses can be scheduled even without a lecturer assignment.
  const assignable = courses.filter(
    (c) => c.semester === "1st Semester" && (c.departments || []).includes("Computer Science") && !UNASSIGNED_CODES.has(c.code)
  );
  let created = 0;
  let i = 0;
  for (const course of assignable) {
    const lecturer = lecturers[i % lecturers.length];
    i++;
    const { status, data } = await req("POST", "/assignments/course-to-lecturer", {
      courseId: course._id,
      lecturerId: lecturer._id,
      semester: "1st Semester",
    });
    if (status < 300 || status === 409) { created++; console.log(`  ✔ assigned ${course.code} → ${lecturer.fullName}`); }
    else console.warn(`  ✖ assign ${course.code}: ${data.message || status}`);
  }
  return created;
}

async function main() {
  await login();

  const venues = await fetchAll("/venues");
  const slots = await fetchAll("/timeslots");
  const courses = await fetchAll("/courses");
  const lecturers = await fetchAll("/users/lecturers");

  console.log("\n🏫 Seeding schools & departments (full FUT Minna structure)...");
  await seedAcademicStructure();

  console.log("\n🌱 Seeding venues...");
  await seedVenues(new Set(venues.map((v) => v.name)));
  console.log("⏰ Seeding time slots...");
  await seedTimeSlots(new Set(slots.map((s) => `${s.startTime}-${s.endTime}`)));
  console.log("📚 Seeding courses...");
  await seedCourses(new Set(courses.map((c) => c.code)));

  const freshCourses = await fetchAll("/courses");
  console.log("\n👥 Assigning lecturers (1st semester)...");
  if (lecturers.length > 0) await seedLecturerAssignments(freshCourses, lecturers);
  else console.warn("  ⚠ No lecturers found — skipping assignments");

  console.log("\n⚡ Auto-generating 1st semester timetable...");
  const gen = await req("POST", "/assignments/auto-generate", { semester: "1st Semester" });
  if (gen.status < 300) {
    console.log(`  ✔ ${gen.data.message || `scheduled: ${gen.data.scheduledCount}`}`);
  } else {
    console.warn(`  ✖ auto-generate: ${gen.data.message || gen.status}`);
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
