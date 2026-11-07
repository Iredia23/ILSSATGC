// scripts/run-evaluation.mjs
// Executes the software evaluation (unit / integration / system) against the live API.
// Prints structured results that are transcribed into software-evaluation/*.md.
// Creates temporary EVL-* courses and an EVAL user, then cleans them all up.
// Logs in with the demo passwords from .env.local (SEED_ADMIN_PASSWORD and
// SEED_USER_PASSWORD).
import dotenv from "dotenv";
import { join } from "node:path";

dotenv.config({ path: join(import.meta.dirname, "..", ".env.local") });

const BASE = process.env.API_URL || "http://localhost:5000/api";

const ADMIN_PASS = process.env.SEED_ADMIN_PASSWORD;
const USER_PASS = process.env.SEED_USER_PASSWORD;
if (!ADMIN_PASS || !USER_PASS) {
  console.error("❌ Set SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD in .env.local, then run this again.");
  process.exit(1);
}

let tokens = {};
const results = [];
let createdCourseIds = [];
let evalUserId = null;

async function call(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(role, email, password) {
  const { status, data } = await call("POST", "/auth/login", { email, password, rememberMe: false });
  if (!data.token) throw new Error(`${role} login failed: ${status} ${JSON.stringify(data)}`);
  tokens[role] = data.token;
  return data;
}

function record(id, module, testCase, expected, actual, pass) {
  results.push({ id, module, testCase, expected, actual, pass });
  console.log(`${pass ? "PASS" : "FAIL"} | ${id} | ${testCase} | actual: ${actual}`);
}

// Find a free (venue, day, slot) for a clean scheduling test — avoids occupied
// venues AND slots already used by another course at the same level (a real
// LEVEL_CONFLICT the solver enforces).
async function findFreeSlot(schedule, venues, timeSlots, days, excludeLevel) {
  const venueUsed = new Set((schedule || []).map((s) => `${s.venueId?._id || s.venueId}|${s.dayOfWeek}|${s.timeSlotId?._id || s.timeSlotId}`));
  const levelUsed = new Set(
    (schedule || [])
      .filter((s) => s.courseId?.level === excludeLevel)
      .map((s) => `${s.dayOfWeek}|${s.timeSlotId?._id || s.timeSlotId}`)
  );
  for (const day of days) {
    for (const ts of timeSlots) {
      for (const v of venues) {
        const vk = `${v._id}|${day}|${ts._id}`;
        const lk = `${day}|${ts._id}`;
        if (!venueUsed.has(vk) && !levelUsed.has(lk)) return { venueId: v._id, timeSlotId: ts._id, dayOfWeek: day };
      }
    }
  }
  return null;
}

async function main() {
  // ── Logins ────────────────────────────────────────────────
  await login("admin", "admin@futminna.edu.ng", ADMIN_PASS);
  await login("eo", "exam.officer@futminna.edu.ng", USER_PASS);
  await login("hod", "hod@futminna.edu.ng", USER_PASS);
  await login("tt", "timetable.officer@futminna.edu.ng", USER_PASS);
  await login("lecturer", "john.adebayo@futminna.edu.ng", USER_PASS);
  console.log("✔ All role logins succeeded\n");

  // ── Load reference data ────────────────────────────────────
  const [venuesRes, slotsRes] = await Promise.all([
    call("GET", "/venues?limit=100", null, tokens.admin),
    call("GET", "/timeslots", null, tokens.admin),
  ]);
  const venues = venuesRes.data.venues || [];
  const timeSlots = slotsRes.data.timeSlots || [];

  // ============================================================
  // UNIT TESTING
  // ============================================================
  console.log("═══ UNIT TESTS ═══");

  // UT-01 missing credentials
  {
    const { status, data } = await call("POST", "/auth/login", { email: "", password: "" });
    record("UT-01", "authController.login", "Missing email/password in request body",
      "400 + 'Please provide email and password'", `${status} + '${data.message}'`, status === 400);
  }

  // UT-02 invalid password (attempts increment)
  {
    const { status, data } = await call("POST", "/auth/login", { email: "john.adebayo@futminna.edu.ng", password: "wrongpass" });
    record("UT-02", "authController.login", "Invalid password for existing user",
      "401 + attempts-remaining message", `${status} + '${data.message}'`, status === 401);
  }

  // UT-03 valid login returns token
  record("UT-03", "authController.login", "Valid admin credentials",
    "200 + token + user payload", `200 + token(${tokens.admin.length} chars)`, !!tokens.admin);

  // UT-04 account lockout after threshold
  {
    // create temp user
    const reg = await call("POST", "/auth/register", {
      fullName: "EVAL Tester", email: "eval.user@futminna.edu.ng", role: "Lecturer",
      school: "SICT", department: "Computer Science",
    }, tokens.admin);
    if (reg.status < 300 && reg.data.user) {
      evalUserId = reg.data.user.id;
      let finalStatus = null;
      for (let i = 0; i < 5; i++) {
        const r = await call("POST", "/auth/login", { email: "eval.user@futminna.edu.ng", password: "wrong" });
        finalStatus = r.status;
      }
      const locked = await call("POST", "/auth/login", { email: "eval.user@futminna.edu.ng", password: "password" });
      const lockedOk = locked.status === 403 && /locked/i.test(locked.data.message || "");
      const unlock = await call("PATCH", `/users/${evalUserId}/unlock`, {}, tokens.admin);
      const after = await call("POST", "/auth/login", { email: "eval.user@futminna.edu.ng", password: "password" });
      record("UT-04", "authController.login + userController.unlockUser",
        "5 failed attempts lock account; correct login blocked; admin unlock restores access",
        "5th fail → lock; locked login 403; unlock 200; login success",
        `fails end ${finalStatus}; locked login ${locked.status} (${lockedOk}); unlock ${unlock.status}; after unlock ${after.status}`,
        lockedOk && unlock.status < 300 && after.status < 300);
    } else {
      record("UT-04", "authController.login + unlockUser", "Lockout + unlock cycle",
        "temp user created, lockout verified", `register failed: ${reg.status} ${JSON.stringify(reg.data).slice(0,120)}`, false);
    }
  }

  // UT-05 duplicate email registration
  {
    const { status, data } = await call("POST", "/auth/register", {
      fullName: "Dup", email: "admin@futminna.edu.ng", role: "Lecturer",
    }, tokens.admin);
    record("UT-05", "authController.registerUser", "Register with existing email",
      "400 duplicate error", `${status} + '${data.message}'`, status === 400);
  }

  // UT-06 duplicate course code
  {
    const { status, data } = await call("POST", "/courses", {
      code: "CSC 101", title: "Duplicate", creditUnits: 2, level: 100, departments: ["Computer Science"], semester: "1st Semester",
    }, tokens.eo);
    record("UT-06", "courseController.createCourse", "Create course with existing code",
      "400 duplicate error", `${status} + '${data.message}'`, status === 400);
  }

  // Create temp courses for remaining unit tests
  const tempCourses = [
    { code: "EVL 101", title: "Evaluation Test Course 101", creditUnits: 2, level: 300, departments: ["Computer Science"], semester: "1st Semester" },
    { code: "EVL 102", title: "Evaluation Test Course 102", creditUnits: 2, level: 400, departments: ["Computer Science"], semester: "1st Semester" },
    { code: "EVL 201", title: "Evaluation Test Course 201", creditUnits: 2, level: 200, departments: ["Computer Science"], semester: "1st Semester" },
    { code: "EVL 202", title: "Evaluation Test Course 202", creditUnits: 2, level: 200, departments: ["Computer Science"], semester: "1st Semester" },
    { code: "EVL 203", title: "Evaluation Test Course 203", creditUnits: 2, level: 200, departments: ["Computer Science"], semester: "1st Semester" },
    { code: "EVL 204", title: "Evaluation Test Course 204", creditUnits: 2, level: 200, departments: ["Computer Science"], semester: "1st Semester" },
    { code: "EVL 205", title: "Evaluation Test Course 205", creditUnits: 2, level: 200, departments: ["Computer Science"], semester: "1st Semester" },
    { code: "EVL 301", title: "Evaluation End-to-End Course", creditUnits: 3, level: 500, departments: ["Computer Science"], semester: "1st Semester" },
  ];
  for (const c of tempCourses) {
    const { status, data } = await call("POST", "/courses", c, tokens.eo);
    if (status < 300 && data.course) createdCourseIds.push(data.course._id);
  }
  console.log(`✔ Created ${createdCourseIds.length} temp EVL courses`);

  const idOf = (code) => createdCourseIds[tempCourses.findIndex((c) => c.code === code)];
  const lecturerId = null; // placeholder — eval.user id used below

  // UT-07 duplicate lecturer assignment
  {
    const a1 = await call("POST", "/assignments/course-to-lecturer",
      { courseId: idOf("EVL 201"), lecturerId: evalUserId, semester: "1st Semester" }, tokens.hod);
    const a2 = await call("POST", "/assignments/course-to-lecturer",
      { courseId: idOf("EVL 201"), lecturerId: evalUserId, semester: "1st Semester" }, tokens.hod);
    record("UT-07", "assignmentController.createCourseToLecturer", "Same course+lecturer+semester twice",
      "2nd attempt 409 DUPLICATE_ASSIGNMENT", `1st ${a1.status}; 2nd ${a2.status} (${a2.data.code || ""})`, a2.status === 409 && a2.data.code === "DUPLICATE_ASSIGNMENT");
  }

  // UT-08 workload exceeded (4 courses max per lecturer)
  {
    const codes = ["EVL 202", "EVL 203", "EVL 204", "EVL 205"];
    let last = null;
    for (const c of codes) {
      last = await call("POST", "/assignments/course-to-lecturer",
        { courseId: idOf(c), lecturerId: evalUserId, semester: "1st Semester" }, tokens.hod);
    }
    // now eval.user has 4 (EVL 201-204... actually 201+202+203+204 = 4); 5th should fail
    const fifth = await call("POST", "/assignments/course-to-lecturer",
      { courseId: idOf("EVL 205"), lecturerId: evalUserId, semester: "1st Semester" }, tokens.hod);
    record("UT-08", "assignmentController.createCourseToLecturer", "Assign 5th course to lecturer with 4 (max)",
      "409 WORKLOAD_EXCEEDED", `${fifth.status} (${fifth.data.code || fifth.data.message || ""})`,
      fifth.status === 409 && fifth.data.code === "WORKLOAD_EXCEEDED");
  }

  // UT-09 venue double-booking rejected
  {
    const sched = await call("GET", "/assignments/schedule?semester=1st%20Semester&limit=500", null, tokens.admin);
    const free = await findFreeSlot(sched.data.schedule, venues, timeSlots, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 300);
    if (free) {
      const first = await call("POST", "/assignments/course-to-venue-time",
        { courseId: idOf("EVL 101"), ...free }, tokens.tt);
      const second = await call("POST", "/assignments/course-to-venue-time",
        { courseId: idOf("EVL 102"), ...free }, tokens.tt);
      record("UT-09", "assignmentController.createCourseToVenueTime", "Schedule 2nd course in same venue+day+slot",
        "2nd attempt 409 SCHEDULING_CONFLICT (venue double-book)",
        `1st ${first.status}; 2nd ${second.status} (${second.data.code || second.data.message || ""})`,
        first.status < 300 && second.status === 409 && second.data.code === "SCHEDULING_CONFLICT");
    } else {
      record("UT-09", "createCourseToVenueTime", "Venue conflict detection", "found free slot", "no free slot found", false);
    }
  }

  // UT-10 protected route without token
  {
    const { status, data } = await call("GET", "/auth/me");
    record("UT-10", "middleware.auth.protect", "GET /auth/me with no token",
      "401 not authorized", `${status} + '${data.message}'`, status === 401);
  }

  // UT-11 change-password mismatch (no state change)
  {
    const { status, data } = await call("POST", "/auth/change-password",
      { currentPassword: ADMIN_PASS, newPassword: "NewPass123", confirmPassword: "Different123" }, tokens.admin);
    record("UT-11", "authController.changePassword", "New password != confirm password",
      "400 'Passwords do not match'", `${status} + '${data.message}'`, status === 400);
  }

  // UT-12 reset password with invalid token
  {
    const { status, data } = await call("POST", "/auth/reset-password",
      { token: "invalidtoken", newPassword: "NewPass123", confirmPassword: "NewPass123" });
    record("UT-12", "authController.resetPassword", "Reset with invalid/expired token",
      "401 invalid token", `${status} + '${data.message}'`, status === 401);
  }

  // UT-13 forgot password unknown email
  {
    const { status, data } = await call("POST", "/auth/forgot-password", { email: "nobody@nowhere.com" });
    record("UT-13", "authController.forgotPassword", "Request reset for unknown email",
      "404 no account found", `${status} + '${data.message}'`, status === 404);
  }

  // ============================================================
  // INTEGRATION TESTING
  // ============================================================
  console.log("\n═══ INTEGRATION TESTS ═══");

  // IT-01 login → token → /auth/me roundtrip
  {
    const me = await call("GET", "/auth/me", null, tokens.admin);
    record("IT-01", "Login → JWT → AuthContext (/auth/me)", "Token from login authorizes /auth/me",
      "200 + user payload", `${me.status} + user '${me.data.user?.email}'`, me.status === 200 && me.data.user?.email === "admin@futminna.edu.ng");
  }

  // IT-02 EO creates course → appears in DB-backed listing
  {
    const list = await call("GET", "/courses?search=EVL%20301&limit=10", null, tokens.eo);
    const found = (list.data.courses || []).some((c) => c.code === "EVL 301");
    record("IT-02", "Course form → POST /courses → DB → GET /courses", "Created EVL 301 appears in listing",
      "found in list", `GET found: ${found}`, found);
  }

  // IT-03 HOD assigns lecturer → appears in assignment list
  {
    const lecs = await call("GET", "/users/lecturers", null, tokens.hod);
    const john = (lecs.data.lecturers || []).find((l) => l.email === "john.adebayo@futminna.edu.ng");
    const assign2 = await call("POST", "/assignments/course-to-lecturer",
      { courseId: idOf("EVL 301"), lecturerId: john?._id, semester: "1st Semester" }, tokens.hod);
    const list = await call("GET", "/assignments/course-to-lecturer?semester=1st%20Semester&limit=100", null, tokens.hod);
    const found = (list.data.assignments || []).some((a) => String(a.courseId?._id || a.courseId) === String(idOf("EVL 301")));
    record("IT-03", "HOD allocation form → POST course-to-lecturer → DB → GET list",
      "EVL 301 appears in allocation list", "found in list", `assign ${assign2.status}; listed: ${found}`, assign2.status < 300 && found);
  }

  // IT-04 TT Officer schedules course → appears in schedule (API → DB → read)
  {
    const sched = await call("GET", "/assignments/schedule?semester=1st%20Semester&limit=500", null, tokens.tt);
    const free = await findFreeSlot(sched.data.schedule, venues, timeSlots, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 500);
    let ok = false;
    if (free) {
      const sch = await call("POST", "/assignments/course-to-venue-time",
        { courseId: idOf("EVL 301"), ...free }, tokens.tt);
      ok = sch.status < 300;
    }
    const after = await call("GET", "/assignments/schedule?semester=1st%20Semester&limit=500", null, tokens.tt);
    const present = (after.data.schedule || []).some((s) => (s.courseId?._id || s.courseId) === idOf("EVL 301"));
    record("IT-04", "Schedule form → POST course-to-venue-time → DB → GET /schedule",
      "EVL 301 appears in timetable", "scheduled & visible", `create ${ok}; visible: ${present}`, ok && present);
  }

  // IT-05 conflict-check endpoint reports overlap
  {
    const sched = await call("GET", "/assignments/schedule?semester=1st%20Semester&limit=500", null, tokens.tt);
    const s = (sched.data.schedule || []).find((x) => (x.courseId?._id || x.courseId) === idOf("EVL 301"));
    if (s) {
      const chk = await call("POST", "/assignments/check-conflict", {
        courseId: idOf("EVL 102"),
        venueId: s.venueId?._id || s.venueId,
        timeSlotId: s.timeSlotId?._id || s.timeSlotId,
        dayOfWeek: s.dayOfWeek,
      }, tokens.tt);
      record("IT-05", "check-conflict endpoint", "Reuse occupied venue/day/slot for another course",
        "hasConflict true", `status ${chk.status}; hasConflict ${chk.data.hasConflict}`, chk.data.hasConflict === true);
    } else {
      record("IT-05", "check-conflict", "Detect overlap", "found EVL 301 slot", "no EVL 301 slot found", false);
    }
  }

  // IT-06 notification flow: new user → admin notification polling feed
  {
    const notifs = await call("GET", "/notifications", null, tokens.admin);
    const list = notifs.data.notifications || notifs.data || [];
    const found = JSON.stringify(list).includes("eval.user@futminna.edu.ng");
    record("IT-06", "registerUser → createNotification → GET /notifications (Admin)",
      "Admin feed contains new-user notification", "notification present",
      `GET ${notifs.status}; found eval.user: ${found}`, found);
  }

  // IT-07 lecturer sees assigned course in their schedule
  {
    const lecs = await call("GET", "/users/lecturers", null, tokens.lecturer);
    const john = (lecs.data.lecturers || []).find((l) => l.email === "john.adebayo@futminna.edu.ng");
    const sch = await call("GET", `/assignments/lecturer/${john?._id}/schedule?semester=1st%20Semester`, null, tokens.lecturer);
    const found = (sch.data.schedule || []).some((s) => s.courseCode === "EVL 301");
    record("IT-07", "Lecturer dashboard → GET /assignments/lecturer/:id/schedule",
      "John Adebayo's schedule includes EVL 301", "course visible", `found: ${found}`, found);
  }

  // ============================================================
  // SYSTEM TESTING (full workflow)
  // ============================================================
  console.log("\n═══ SYSTEM TESTS (end-to-end) ═══");

  // ST-01 Exam Officer creates course (EVL 301 already created in IT-02; use fresh EVL 401)
  {
    const { status, data } = await call("POST", "/courses", {
      code: "EVL 401", title: "E2E Workflow Course", creditUnits: 3, level: 500,
      departments: ["Computer Science"], semester: "1st Semester",
    }, tokens.eo);
    if (status < 300 && data.course) createdCourseIds.push(data.course._id);
    record("ST-01", "Exam Officer creates course", "EVL 401 stored & active",
      "201 created", `${status}`, status < 300);
  }
  const e2eId = createdCourseIds[createdCourseIds.length - 1];

  // ST-02 HOD allocates lecturer
  {
    const lecs = await call("GET", "/users/lecturers", null, tokens.hod);
    const john = (lecs.data.lecturers || []).find((l) => l.email === "john.adebayo@futminna.edu.ng");
    const { status, data } = await call("POST", "/assignments/course-to-lecturer",
      { courseId: e2eId, lecturerId: john?._id, semester: "1st Semester" }, tokens.hod);
    record("ST-02", "HOD allocates lecturer to EVL 401", "Assignment saved with lecturer",
      "200/201 created", `${status} (${data.lecturerName || ""})`, status < 300);
  }

  // ST-03 Timetable Officer generates timetable (auto-generate) for the new course
  {
    const { status, data } = await call("POST", "/assignments/auto-generate", { semester: "1st Semester" }, tokens.tt);
    record("ST-03", "Timetable Officer runs auto-generator", "Solver schedules remaining unscheduled courses",
      "200 success (may be 0 new if already scheduled)", `status ${status}; ${(data.message || "").slice(0, 60)}`, status === 200);
  }

  // ST-04 Lecturer sees the scheduled course
  {
    const lecs = await call("GET", "/users/lecturers", null, tokens.lecturer);
    const john = (lecs.data.lecturers || []).find((l) => l.email === "john.adebayo@futminna.edu.ng");
    const sch = await call("GET", `/assignments/lecturer/${john?._id}/schedule?semester=1st%20Semester`, null, tokens.lecturer);
    const found = (sch.data.schedule || []).some((s) => s.courseCode === "EVL 401");
    record("ST-04", "Lecturer views dashboard", "EVL 401 visible in lecturer's timetable",
      "course visible", `found: ${found}`, found);
  }

  // ST-05 Admin dashboard reflects the added data
  {
    const stats = await call("GET", "/dashboard/stats", null, tokens.admin);
    record("ST-05", "Admin dashboard stats", "Stats endpoint returns aggregated counts",
      "200 + stats object", `200; courses=${stats.data.stats?.totalCourses}`, stats.status === 200 && typeof stats.data.stats?.totalCourses === "number");
  }

  // ============================================================
  // ROLE-BASED ACCESS CONTROL (RBAC)
  // ============================================================
  console.log("\n═══ RBAC TESTS ═══");

  // RBAC-01 HOD cannot auto-generate the timetable
  {
    const r = await call("POST", "/assignments/auto-generate", { semester: "1st Semester" }, tokens.hod);
    record("RBAC-01", "routes/assignments auto-generate", "HOD calls auto-generate",
      "403 forbidden", `${r.status} '${r.data.message || ""}'`, r.status === 403);
  }

  // RBAC-02 HOD cannot create schedule entries
  {
    const r = await call("POST", "/assignments/course-to-venue-time",
      { courseId: idOf("EVL 101"), venueId: venues[0]?._id, timeSlotId: timeSlots[0]?._id, dayOfWeek: "Monday" }, tokens.hod);
    record("RBAC-02", "routes/assignments course-to-venue-time", "HOD tries to create a schedule entry",
      "403 forbidden", `${r.status} '${r.data.message || ""}'`, r.status === 403);
  }

  // RBAC-03 Exam Officer creates a course
  {
    const r = await call("POST", "/courses", {
      code: "EVL 402", title: "RBAC Course", creditUnits: 2, level: 200,
      departments: ["Computer Science"], semester: "1st Semester",
    }, tokens.eo);
    if (r.status < 300 && r.data.course) createdCourseIds.push(r.data.course._id);
    record("RBAC-03", "routes/courses POST", "Exam Officer creates a course",
      "201 created", `${r.status}`, r.status === 201);
  }

  // RBAC-04 HOD assigns a course to a lecturer
  {
    const lecs = await call("GET", "/users/lecturers", null, tokens.hod);
    const john = (lecs.data.lecturers || []).find((l) => l.email === "john.adebayo@futminna.edu.ng");
    const r = await call("POST", "/assignments/course-to-lecturer",
      { courseId: idOf("EVL 101"), lecturerId: john?._id, semester: "1st Semester" }, tokens.hod);
    record("RBAC-04", "routes/assignments course-to-lecturer", "HOD assigns course to lecturer",
      "200/201 created", `${r.status}`, r.status === 200 || r.status === 201);
  }

  // RBAC-05 Admin can auto-generate the timetable
  {
    const r = await call("POST", "/assignments/auto-generate", { semester: "1st Semester" }, tokens.admin);
    record("RBAC-05", "routes/assignments auto-generate", "Admin calls auto-generate",
      "200 success", `status ${r.status}`, r.status === 200);
  }

  // RBAC-06 Admin can create courses + assignments (all three functions)
  {
    const c = await call("POST", "/courses", {
      code: "EVL 403", title: "RBAC Admin Course", creditUnits: 2, level: 300,
      departments: ["Computer Science"], semester: "1st Semester",
    }, tokens.admin);
    if (c.status < 300 && c.data.course) createdCourseIds.push(c.data.course._id);
    // Use a lecturer below the 4-course workload cap
    const lecs = await call("GET", "/users/lecturers", null, tokens.admin);
    const fatima = (lecs.data.lecturers || []).find((l) => l.email === "fatima.bello@futminna.edu.ng");
    const a = c.status < 300 ? await call("POST", "/assignments/course-to-lecturer",
      { courseId: c.data.course._id, lecturerId: fatima?._id, semester: "1st Semester" }, tokens.admin) : { status: 0 };
    record("RBAC-06", "Admin role", "Admin creates course AND assigns lecturer",
      "201 + 200", `course ${c.status}; assign ${a.status}`, c.status === 201 && a.status < 300);
  }

  // RBAC-07 duplicate singleton role registration rejected
  {
    const r = await call("POST", "/auth/register", {
      fullName: "Second HOD", email: "hod2@futminna.edu.ng", role: "HOD", department: "Computer Science",
    }, tokens.admin);
    record("RBAC-07", "authController.registerUser", "Register a second HOD for the same department",
      "400 role must be unique", `${r.status} '${r.data.message || ""}'`, r.status === 400 && /unique|already held/i.test(r.data.message || ""));
  }

  // RBAC-08 duplicate Admin registration rejected
  {
    const r = await call("POST", "/auth/register", {
      fullName: "Second Admin", email: "admin2@futminna.edu.ng", role: "Admin",
    }, tokens.admin);
    record("RBAC-08", "authController.registerUser", "Register a second Admin",
      "400 role must be unique", `${r.status} '${r.data.message || ""}'`, r.status === 400 && /unique|already held/i.test(r.data.message || ""));
  }

  // RBAC-09 Admin creates (sets up) a venue
  {
    const r = await call("POST", "/venues", {
      name: `EVL Venue ${Date.now()}`, building: "Evaluation Block", capacity: 60, type: "Seminar Room", equipment: ["Projector"],
    }, tokens.admin);
    if (r.status < 300 && r.data.venue) {
      const del = await call("DELETE", `/venues/${r.data.venue._id}`, {}, tokens.admin);
      record("RBAC-09", "venueController.createVenue + deleteVenue", "Admin sets up a venue then deletes it",
        "201 create + 200 delete", `create ${r.status}; delete ${del.status}`, r.status === 201 && del.status === 200);
    } else {
      record("RBAC-09", "venueController.createVenue", "Admin sets up a venue", "201 created", `create ${r.status}`, r.status === 201);
    }
  }

  // UT-14 venue utilization endpoint returns utilization data
  {
    const r = await call("GET", "/venues/utilization", null, tokens.admin);
    const list = r.data.utilization || [];
    const hasPercent = list.every((u) => typeof u.utilizationPercent === "number" && u.utilizationPercent >= 0 && u.utilizationPercent <= 100);
    record("UT-14", "venueController.getVenueUtilization", "GET /venues/utilization",
      "200 + per-venue utilization (sessions, %, days)", `status ${r.status}; ${list.length} venues; percents valid: ${hasPercent}`,
      r.status === 200 && list.length > 0 && hasPercent);
  }

  // UT-15 venue with schedule shows non-zero utilization (cross-check)
  {
    const sched = await call("GET", "/assignments/schedule?semester=1st%20Semester&limit=500", null, tokens.admin);
    const free = await findFreeSlot(sched.data.schedule, venues, timeSlots, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 400);
    if (free) {
      const c = await call("POST", "/courses", {
        code: "EVL 601", title: "Utilization Test", creditUnits: 2, level: 400,
        departments: ["Computer Science"], semester: "1st Semester",
      }, tokens.eo);
      if (c.status < 300) {
        createdCourseIds.push(c.data.course._id);
        const sch = await call("POST", "/assignments/course-to-venue-time",
          { courseId: c.data.course._id, ...free }, tokens.tt);
        const util = await call("GET", "/venues/utilization", null, tokens.admin);
        const entry = (util.data.utilization || []).find((u) => String(u.venue._id) === String(free.venueId));
        record("UT-15", "venue utilization reflects schedule", "Booking a session increases venue utilization",
          "utilization > 0 after booking", `sch ${sch.status}; venue ${entry?.venue.name || "?"} at ${entry?.utilizationPercent}% (${entry?.totalSessions} sessions)`, sch.status < 300 && (entry?.totalSessions || 0) > 0);
      } else {
        record("UT-15", "venue utilization reflects schedule", "Booking increases utilization", `course create failed ${c.status}`, false);
      }
    } else {
      record("UT-15", "venue utilization reflects schedule", "Booking increases utilization", "no free slot", "no free slot found", false);
    }
  }

  // ── Cleanup ────────────────────────────────────────────────
  console.log("\n🧹 Cleaning up evaluation data...");
  for (const id of createdCourseIds) {
    await call("DELETE", `/courses/${id}`, {}, tokens.eo).catch(() => {});
  }
  if (evalUserId) {
    await call("DELETE", `/users/${evalUserId}`, {}, tokens.admin).catch(() => {});
  }

  // ── Summary ─────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n📊 SUMMARY: ${passed} passed, ${failed} failed, ${results.length} total`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Evaluation runner error:", err.message);
  process.exit(2);
});
