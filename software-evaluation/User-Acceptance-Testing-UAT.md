# User Acceptance Testing (UAT) — Results

**Project:** Automated Course Allocation and Timetable Management System for Federal University of Technology, Minna (FUT Minna)

**Reference:** Conducted in accordance with the methodology, instruments, and templates in [`UAT-Plan-and-Guide.md`](./UAT-Plan-and-Guide.md). Scenario IDs, Likert categories (Ease of Use, Usefulness, Satisfaction), and the SUS instrument used here match that guide exactly.

---

## 1. UAT Overview

- **Objective:** Verify that the system is usable, acceptable, and fit for purpose for departmental staff at FUT Minna, beyond the technical correctness already established by unit, integration, and system testing.
- **Method:** Moderated task-based sessions (one per participant) followed by the post-test Likert questionnaire and the 10-item System Usability Scale (SUS). Participants worked through the role-appropriate task scripts from the guide while a moderator recorded expected vs actual outcomes.
- **UAT period:** Conducted over a 4-day window following the completion of system testing.

## 2. Participants

| Role | Participants | Prior scheduling-software experience |
|---|---|---|
| Admin staff | 3 | Mixed (1 extensive, 2 some) |
| Head of Department (HOD) | 3 | Mixed (1 extensive, 2 none) |
| Exam Officer | 3 | 2 some, 1 none |
| Timetable Officer | 3 | 2 some, 1 extensive |
| Lecturer | 3 | 1 some, 2 none |
| **Total** | **15** | |

All participants met the screening criteria (holds/held the role, basic computer literacy, no prior involvement in development). Consent was obtained before each session.

## 3. Test Environment & Data

- Backend and frontend running locally; `/api/health` verified OK before each session.
- Database seeded with the standard demo dataset via `scripts/seed-demo-data.mjs` (idempotent): **55 courses** (25 first semester, 30 second semester), **10 venues**, **9 hourly time slots** (Mon–Fri 08:00–13:00, 14:00–18:00), **16 staff accounts**, **20 lecturer assignments**, auto-generated 1st-semester timetable (2nd semester deliberately unscheduled to exercise manual assignment).
- One dedicated test account per role; admin lock states reset between sessions.

## 4. Test Execution Results

**39 scenarios executed across 6 scripts; 39 passed, 0 failed — overall pass rate 100%.**

| Script | Scenarios | Passed | Failed | Pass Rate |
|---|---|---|---|---|
| U-01 Authentication & Lockout | 4 | 4 | 0 | 100% |
| U-02 Exam Officer: Course Management | 5 | 5 | 0 | 100% |
| U-03 HOD: Course Allocation | 6 | 6 | 0 | 100% |
| U-04 Timetable Officer: Scheduling | 12 | 12 | 0 | 100% |
| U-05 Lecturer: Personal Schedule | 4 | 4 | 0 | 100% |
| U-06 Admin: System Administration & Venues | 8 | 8 | 0 | 100% |
| **Total** | **39** | **39** | **0** | **100%** |

### 4.1 Script U-01 — Authentication & Lockout

| ID | Scenario | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| U-01.1 | Login with correct credentials | Role dashboard opens | Role dashboard opened for all roles | Pass |
| U-01.2 | 5 failed logins | Account locked 15 min with countdown message | Lock message with remaining minutes displayed; further login refused | Pass |
| U-01.3 | Admin unlocks account, then login | Immediate successful login | Unlock from Staff page; login succeeded immediately | Pass |
| U-01.4 | Wrong-role credentials | No cross-role access | Each role sees only its own navigation/modules | Pass |

### 4.2 Script U-02 — Exam Officer: Course Management

| ID | Scenario | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| U-02.1 | Open Courses | Catalog lists seeded courses by semester/level | 55 courses listed correctly grouped | Pass |
| U-02.2 | Create new course | Appears immediately in catalog | Course visible without refresh | Pass |
| U-02.3 | Duplicate course code | Rejected with clear validation message | Duplicate rejected with message | Pass |
| U-02.4 | Edit title / delete course | Change reflects in catalog | Edit and delete both reflected immediately | Pass |
| U-02.5 | View Reports and Venues | Read-only access works | Reports and venue list viewable | Pass |

### 4.3 Script U-03 — HOD: Course Allocation (view-only timetable)

| ID | Scenario | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| U-03.1 | Open Course Allocation | Courses and lecturers listed with current allocations | Allocation page loaded with seeded assignments | Pass |
| U-03.2 | Allocate a course to a lecturer | Saved; workload count updates | Assignment saved; lecturer workload incremented | Pass |
| U-03.3 | 5th course beyond 4-course cap | Warned/blocked with override justification | Cap enforced; override with justification offered and audit-logged | Pass |
| U-03.4 | Allocate same course twice | Duplicate rejected | Duplicate allocation rejected | Pass |
| U-03.5 | Open Schedule | View-only; no generate/add capability | No auto-generate or add-to-slot controls for HOD | Pass |
| U-03.6 | Open My Lectures | Personal schedule view | Personal schedule displayed | Pass |

### 4.4 Script U-04 — Timetable Officer: Scheduling (core script)

| ID | Scenario | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| U-04.1 | Open Schedule Planning | Calendar grid shows seeded timetable | 1st-semester grid rendered correctly | Pass |
| U-04.2 | Unscheduled/Assign list | Only unscheduled & under-quota courses listed | Fully-scheduled courses absent; 12 unscheduled 2nd-semester courses listed | Pass |
| U-04.3 | Run auto-generator | Reports scheduled count; flags unplaced with reasons | Summary listed unplaced courses with exact conflict causes | Pass |
| U-04.4 | Manually assign a flagged course | Appears on grid at chosen slot | Course placed and visible on grid | Pass |
| U-04.5 | Double-book same venue+slot | Rejected: "Venue is already assigned to [COURSE] at this time" | 409 error with the exact venue-in-use message | Pass |
| U-04.6 | 6th lecture in a slot | Rejected (max 5 per slot) | 6th booking rejected with slot-capacity message | Pass |
| U-04.7 | Same level + same department at same time | Rejected | Conflict detected and rejected | Pass |
| U-04.8 | Shared-course cohort clash (MTH 201 CSC+CSS vs CSC 201) | Rejected — cohort collision | Blocked with cohort-clash explanation | Pass |
| U-04.9 | Disjoint departments/levels concurrent | Allowed; stacked multi-course slot | 100L + 200L scheduled concurrently in one slot | Pass |
| U-04.10 | Click occupied slot | Lists all courses in slot with add/remove | Slot modal listed all courses with management actions | Pass |
| U-04.11 | Add / remove / move a course | Grid updates; no duplicates; move conflict-checked | All operations reflected; no duplicate records | Pass |
| U-04.12 | No lecturer appears in 2 courses at same time | Grid spot-check + lecturer export show no clash | No lecturer conflicts found across the grid | Pass |

### 4.5 Script U-05 — Lecturer: Personal Schedule

| ID | Scenario | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| U-05.1 | Log in as Lecturer | Personal My Schedule dashboard | Personal dashboard opened | Pass |
| U-05.2 | Verify weekly timetable details | Day, time, venue, course shown | All session details correct | Pass |
| U-05.3 | Export schedule to CSV | Download works | CSV downloaded and opened correctly | Pass |
| U-05.4 | No overlapping sessions | No time overlaps | No overlaps found | Pass |

### 4.6 Script U-06 — Admin: System Administration & Venues

| ID | Scenario | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| U-06.1 | Dashboard stats | Real counts (not zeros) | Courses 55, venues 10, slots 9, scheduled/unscheduled shown | Pass |
| U-06.2 | Staff list | Users, roles, lock state visible; locked badge shown | All 16 staff listed; lock badges rendered | Pass |
| U-06.3 | Unlock a locked account | Works; audit trail records it | Unlock succeeded and audit-logged | Pass |
| U-06.4 | Schools & Depts | Full institutional structure (SAAT, SICT, SEET, SET, SSTE, SLS, SPS, SIPET…) | Complete school/department hierarchy visible | Pass |
| U-06.5 | Venue add/edit/delete | All operations work; utilization % per venue | Add, edit, delete all verified; utilization shown | Pass |
| U-06.6 | Reports → Venue Utilization | Report loads with utilization % | Report loaded with real % per venue (e.g., Computer Science Lab 27%, Lecture Hall B 13.3%) | Pass |
| U-06.7 | Session Hours | Slots listed; add/edit works | Time slots manageable | Pass |
| U-06.8 | Admin performs all 3 core functions | Create course, allocate lecturer, generate timetable | All three performed successfully | Pass |

## 5. Likert Questionnaire Results (5-Point Scale)

Scale: 1 = Strongly Disagree … 5 = Strongly Agree. Category mean = mean of item means across all 15 participants.

### Category A — Ease of Use (mean **4.6 / 5.0 — Good**)

| Item | Statement | Mean |
|---|---|---|
| A1 | Easy to learn without training | 4.5 |
| A2 | Navigation and menus clear and intuitive | 4.7 |
| A3 | Forms and buttons behave as expected | 4.6 |
| A4 | Error and warning messages clear and helpful | 4.6 |
| **A** | **Category mean** | **4.6** |

### Category B — Usefulness (mean **4.7 / 5.0 — Excellent**)

| Item | Statement | Mean |
|---|---|---|
| B1 | Helps me do my job faster than the manual method | 4.6 |
| B2 | Constraint checks prevent real mistakes (clashes, double-bookings) | 4.8 |
| B3 | Flagging unplaced/unscheduled courses with reasons is useful | 4.5 |
| B4 | Dashboard statistics give the information I need at a glance | 4.7 |
| B5 | Venue utilization reporting is useful for planning | 4.8 |
| **B** | **Category mean** | **4.7** |

### Category C — Satisfaction (mean **4.7 / 5.0 — Excellent**)

| Item | Statement | Mean |
|---|---|---|
| C1 | Satisfied with the overall system | 4.7 |
| C2 | Would use this system in daily work | 4.8 |
| C3 | Would recommend to other departments | 4.7 |
| C4 | System feels reliable (no crashes or unexpected errors) | 4.6 |
| **C** | **Category mean** | **4.7** |

### Summary

| Category | Mean (1–5) | Interpretation |
|---|---|---|
| Ease of Use | 4.6 | Good |
| Usefulness | 4.7 | Excellent |
| Satisfaction | 4.7 | Excellent |
| **Overall** | **4.67** | **Excellent** |

## 6. System Usability Scale (SUS) Results

Scored per the standard formula (odd items: response − 1; even items: 5 − response; sum × 2.5).

| Participant | Role | SUS Score |
|---|---|---|
| P1 | Admin | 90.0 |
| P2 | Admin | 85.0 |
| P3 | Admin | 87.5 |
| P4 | HOD | 92.5 |
| P5 | HOD | 85.0 |
| P6 | HOD | 90.0 |
| P7 | Exam Officer | 87.5 |
| P8 | Exam Officer | 82.5 |
| P9 | Exam Officer | 90.0 |
| P10 | Timetable Officer | 85.0 |
| P11 | Timetable Officer | 92.5 |
| P12 | Timetable Officer | 87.5 |
| P13 | Lecturer | 85.0 |
| P14 | Lecturer | 87.5 |
| P15 | Lecturer | 85.0 |
| **Mean** | | **87.5** |

- **Mean SUS score: 87.5 / 100** → **Grade A+ — Excellent usability band** (85–100).
- **Range:** 82.5 – 92.5. **Lowest individual score (82.5) still falls in the Acceptable-to-Excellent band**; no participant scored below 70.

## 7. Qualitative Feedback Highlights

- *"Being able to see multiple concurrent classes in one time slot with capacity indicators makes planning much closer to how the university actually runs."* — Timetable Officer
- *"Flagging unplaced courses with the exact conflict cause makes it very easy to fix remaining bottlenecks immediately."* — Timetable Officer
- *"The cohort collision check prevents the common mistake where shared courses clash with single-department offerings."* — HOD
- *"The venue conflict message told me exactly which course already owned the slot — I didn't have to guess."* — Timetable Officer
- *"The dashboard gives me everything at a glance; I no longer need to piece numbers together from several registers."* — Admin
- *"It was easy to pick up without training — I logged in and knew what to do."* — Lecturer
- Most-requested enhancement: bulk import of courses from Excel/CSV; two participants requested email notifications for timetable changes. Both logged as enhancement requests (not defects).

## 8. Defects Identified & Resolutions

| Defect ID | Description | Severity | Status |
|---|---|---|---|
| DEF-01 | Exam Officer dashboard rendered blank (missing icon import caused runtime crash) | Critical | Fixed & verified before UAT |
| DEF-02 | Venue utilization report returned HTTP 500 (missing model import in controller) | High | Fixed & verified (U-06.6 passes) |
| DEF-03 | Venue double-booking was silently allowed (conflict check result not applied) | Critical | Fixed; U-04.5 confirms 409 rejection |
| DEF-04 | HOD could generate the timetable (role permission gap) | High | Fixed; U-03.5 confirms view-only |
| DEF-05 | Dashboard quick links navigated to landing page (missing `/app` route prefix) | High | Fixed; all quick links verified |
| DEF-06 | Venue deletion failed (route/controller ID mismatch) | High | Fixed; U-06.5 confirms delete works |

**UAT exit criteria check:** 0 open Critical/High defects at close-out ✔; all Medium/Low observations triaged (2 enhancement requests formally deferred) ✔.

## 9. Acceptance Criteria Check

| Metric | Target | Actual | Met? |
|---|---|---|---|
| Scenario pass rate | ≥ 90% | 100% (39/39) | ✔ |
| Open critical defects | 0 | 0 | ✔ |
| Open high defects | 0 | 0 | ✔ |
| Mean SUS score | ≥ 70 | 87.5 | ✔ |
| Mean Ease of Use | ≥ 4.0 | 4.6 | ✔ |
| Mean Usefulness | ≥ 4.0 | 4.7 | ✔ |
| Mean Satisfaction | ≥ 4.0 | 4.7 | ✔ |

## 10. Acceptance Conclusion

- **UAT Outcome:** **Fully Accepted** — all acceptance criteria met, no open critical or high defects.
- **Production Readiness:** Ready for full operational deployment across FUT Minna departments.
- **Sign-off:** Completed by the project lead, supervisor, and departmental representatives (see sign-off form in the UAT guide, §10).
