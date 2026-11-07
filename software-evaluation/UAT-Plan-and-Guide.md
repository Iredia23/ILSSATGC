# User Acceptance Testing (UAT) — Plan & Conduct Guide

**Project:** Automated Course Allocation and Timetable Management System for Federal University of Technology, Minna (FUT Minna)

**Document purpose:** This document is the complete kit needed to *plan, conduct, score, and report* a User Acceptance Test for the system. It contains participant selection criteria, a test environment checklist, role-by-role test scripts with acceptance criteria, pre/post-test questionnaires, a System Usability Scale (SUS) instrument, scoring and analysis methodology, a defect log template, and sign-off forms — everything needed to reproduce the UAT and present the results in a final year project report.

---

## 1. UAT Overview

### 1.1 Objective

To verify that the system meets the operational needs of its real end-users (departmental staff of FUT Minna) — not just that it works technically (which unit/integration/system testing already establish), but that it is **usable, acceptable, and fit for purpose** in a real university department.

### 1.2 UAT Goals

1. Confirm each of the 5 roles (Admin, HOD, Exam Officer, Timetable Officer, Lecturer) can complete their real daily workflows end-to-end.
2. Confirm the timetable constraint rules behave as agreed with users (venue conflict rejection, lecturer clash prevention, max 5 lectures per slot, multi-department cohort clash prevention, unplaced-course flagging).
3. Measure user-perceived usability (ease of use, usefulness, satisfaction) via Likert-scale questionnaires and the System Usability Scale (SUS).
4. Capture defects and enhancement requests from real users and prioritize them.
5. Produce an auditable pass/fail record per test scenario and a final acceptance decision.

### 1.3 Scope

**In scope:**
- All role-scoped modules: authentication, dashboards, course management, course-to-lecturer allocation, timetable scheduling (auto + manual), venue management & utilization, session hours, reports, user/account management (incl. lockout & unlock), lecturer personal schedule & CSV export.
- All documented scheduling constraints (see §3.3).
- Usability measurement (Likert + SUS) and qualitative feedback.

**Out of scope:**
- Performance/load testing (covered separately by non-functional testing).
- Security penetration testing beyond the authentication/lockout behaviors exercised here.
- Hardware, network, or infrastructure acceptance.
- Changes to business rules discovered during UAT (these become change requests, not test failures).

### 1.4 System Under Test (SUT)

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, React Router 7, react-hot-toast, react-icons |
| Backend | Node.js + Express 5, JWT auth (bcrypt password hashing) |
| Database | MongoDB (Mongoose ODM) |
| Real-time | HTTP polling for notifications (replaced Socket.IO for serverless/Atlas compatibility) |
| AI assistant | Gemini-powered schedule-assistance chat (optional module) |

---

## 2. Participants

### 2.1 Sample Size & Role Breakdown

UAT should involve real (or realistic) users from each target role. A minimum of **3 participants per role** (15 total) is recommended so results are meaningful; more is better where available.

| Role | Recommended Min. | Suggested Participants |
|---|---|---|
| Admin staff | 3 | Departmental admin / system administrators |
| Head of Department (HOD) | 3 | HODs or academic coordinators |
| Exam Officer | 3 | Exam officers / course coordinators |
| Timetable Officer | 3 | Timetable/registers officers |
| Lecturer | 3 | Lecturers (various levels/depts) |
| **Total** | **15** | |

### 2.2 Inclusion Criteria (participant screening)

- Currently holds (or recently held) the role being tested, or performs equivalent duties.
- Basic computer literacy (can use a web browser and log in).
- Willing to complete all assigned tasks and both questionnaires.
- No prior involvement in the system's development (to avoid bias).

### 2.3 Participant Briefing (read to each participant before testing)

> "You are testing a web application for planning course allocation and timetables at FUT Minna. It is the software itself being tested, not you. There are no wrong answers — if something is confusing, that is valuable feedback. Please work through the tasks as you naturally would, think aloud where possible, and tell me when you finish each task or get stuck. After the tasks you will complete a short questionnaire. All responses are anonymous and will be reported only as grouped statistics."

### 2.4 Informed Consent & Data Use

- Obtain written/verbal consent before testing.
- State that responses are anonymized and used only for the project evaluation.
- Obtain permission to record (screen capture) if recording; offer non-recorded sessions.

> **Online-form mode (§5.4):** the briefing text above becomes the welcome message at the top of the form (shortened to 2–3 sentences), and the consent checkbox in Section 1 replaces the signed consent form. The task scripts from §4 are still handed to participants (as a PDF attachment) so they work through the same tasks before answering the form.

---

## 3. Test Environment & Data

### 3.1 Environment Checklist (before starting)

- [ ] Backend running (`npm run dev:backend` or `npm start`) and `/api/health` returns OK.
- [ ] Frontend running (`npm run dev` — Vite) and reachable in the test browser.
- [ ] Database seeded with demo data: run `node scripts/seed-demo-data.mjs` (idempotent — safe to re-run) so every participant starts from a known dataset:
  - 55 courses (25 first semester, 30 second semester, across departments/schools)
  - 10 venues, 9 hourly time slots (Mon–Fri, 08:00–13:00, 14:00–18:00)
  - 16 staff accounts, 20 lecturer assignments
  - Auto-generated 1st-semester timetable; 2nd semester intentionally unscheduled
- [ ] Test accounts for each role available (see §3.2). Reset passwords if the participant list changed.
- [ ] Any account locked during earlier sessions is unlocked (Admin → Staff → Unlock) so sessions start clean.
- [ ] Print/PDF copies of the test scripts, task sheets, questionnaires, and defect log ready.
- [ ] A stopwatch/clock for optional task-time recording.

### 3.2 Demo Accounts (seeded)

| Role | Email (demo) | Notes |
|---|---|---|
| Admin | `admin@futminna.edu.ng` | Full system control; can perform all 3 core functions |
| HOD | seeded staff accounts | Course allocation, schedule *view* (cannot generate) |
| Exam Officer | seeded staff accounts | Creates courses, views venues/reports |
| Timetable Officer | seeded staff accounts | Auto-generate + manual schedule + move classes |
| Lecturer | seeded staff accounts | Personal schedule + CSV export |

> Provide each participant a dedicated account in their role (or reset shared ones between sessions). Never test multiple participants on the same account without resetting state.

### 3.3 Scheduling Constraint Rules Under Test (reference for expected results)

These are the business rules the system enforces — every UAT scenario that touches scheduling must be checked against them:

1. **Venue exclusivity:** a venue cannot host two different courses in the same time slot → error: *"Venue is already assigned to [COURSE] at this time"* (HTTP 409).
2. **Lecturer exclusivity:** a single lecturer cannot teach two courses at the same time.
3. **Slot capacity:** maximum **5 lectures per time slot** (across all venues) — a 6th is rejected.
4. **Level/department exclusivity:** a given level within a department cannot have two of its courses at the same time.
5. **Multi-department cohort clash (the "shared course" rule):** if two departments share a common course (e.g., CSC and CSS both take MTH 201 on Mon 09:00), then no *other* course taken by either of those departments may be scheduled at Mon 09:00 (e.g., CSC 201 must never fall on Mon 09:00 if it clashes with the shared MTH 201 cohort).
6. **Disjoint cohorts may run concurrently:** two different levels or fully disjoint departments *may* hold classes in the same slot (that is what makes multi-lecture slots valid).
7. **Unplaced-course flagging:** after auto-generation, any course the solver cannot place is flagged with its reason and listed in the results summary; it remains in the Unscheduled list for manual resolution.
8. **Manual assignment inputs:** the manual-assign list shows only courses that (a) have no assigned time slot yet, and (b) have not reached their maximum weekly slot allocation — fully-scheduled courses disappear from the picker.
9. **Move/reschedule:** a scheduled course can be moved to another day/time/venue from its slot; the move is re-checked against all constraints.
10. **Role permissions:** only Timetable Officer and Admin may create/generate the timetable (HOD may only *view*); Exam Officer creates courses; HOD allocates lecturers; Admin may do all three. Roles are unique (one Admin, one HOD, one Exam Officer, one Timetable Officer).
11. **Lockout:** after 5 failed login attempts an account locks for 15 minutes with a countdown message; successful login clears the counter; Admin can unlock accounts from Staff management.

---

## 4. UAT Test Scripts (by Role)

> **How to run:** each scenario is a task sheet. Hand the participant the task steps (not the expected results — those are for the moderator/observer). Record **Expected vs Actual** and **Pass/Fail** on the summary log (§7). A scenario passes only if the *outcome* the participant experiences matches the expected result.

### 4.1 Script U-01 — Authentication & Lockout (all roles)

| # | Task | Expected Result |
|---|---|---|
| 1 | Log in with correct credentials | Dashboard for the user's role opens; no error |
| 2 | Log out, then log in with a wrong password 5 times | After 5 failures the account is locked for 15 minutes and a clear lock message with countdown is shown |
| 3 | (Admin session) Unlock the locked account from Staff management, then log in with correct password | Unlock succeeds; login immediately works |
| 4 | Log in with the wrong role's credentials | Access denied / routed to that role's own dashboard only (no cross-role pages) |

**Acceptance:** All 4 tasks behave as expected; lock/unlock cycle works end-to-end.

### 4.2 Script U-02 — Exam Officer: Course Management

| # | Task | Expected Result |
|---|---|---|
| 1 | Log in as Exam Officer; open **Courses** | Course catalog lists seeded courses by semester/level |
| 2 | Create a new course (code, title, credit units, level, semester, department) | Course appears immediately in the catalog |
| 3 | Try to create a duplicate course code | Duplicate is rejected with a clear validation message |
| 4 | Edit the course title; delete a course (or mark inactive) | Change reflects in catalog; the course disappears from active lists |
| 5 | Open **Reports** and **Venues** | Exam Officer can view reports and venue list (read-only) |

**Acceptance:** Tasks 1–4 work; the Exam Officer can fully manage the course catalog.

### 4.3 Script U-03 — HOD: Course Allocation (cannot generate timetable)

| # | Task | Expected Result |
|---|---|---|
| 1 | Log in as HOD; open **Course Allocation** | List of courses and lecturers; current allocations visible |
| 2 | Allocate a course to a lecturer | Allocation saved; lecturer workload count updates |
| 3 | Allocate courses until a lecturer reaches the 4-course workload cap, then try to add a 5th | System warns/blocks; override justification option is offered (audit-logged) |
| 4 | Try to allocate the same course twice (to two lecturers) | Duplicate allocation rejected |
| 5 | Open **Schedule** | HOD can *view* the timetable but there is **no** Generate/auto-generate or add-to-slot button |
| 6 | Open **My Lectures** | HOD sees the personal schedule view of their own allocation |

**Acceptance:** Allocation + workload cap work; HOD has no timetable-generation capability.

### 4.4 Script U-04 — Timetable Officer: Scheduling (the core UAT)

| # | Task | Expected Result |
|---|---|---|
| 1 | Log in as Timetable Officer; open **Schedule Planning** | Calendar grid (day × time slot) shows the seeded 1st-semester timetable |
| 2 | Open the **Unscheduled / Assign** list | Shows only courses with **no** time slot assigned; courses already at their max weekly slot allocation do **not** appear |
| 3 | Run the **Automatic Timetable Generator** | Results summary reports scheduled count **and flags unplaced courses with their exact reasons**; flagged courses remain in the Unscheduled list |
| 4 | Manually assign a flagged/unscheduled course to an empty slot | Course appears on the grid at the chosen day/time/venue |
| 5 | Book a course into a venue/slot, then try to book a *different* course into the **same venue at the same slot** | Clear error: *"Venue is already assigned to [COURSE] at this time"* — booking rejected |
| 6 | Try to schedule a 6th lecture into a slot that already has 5 | Rejected with a slot-capacity message (max 5 per slot) |
| 7 | Try to schedule two courses of the **same level in the same department** at the same time | Rejected (level/department exclusivity) |
| 8 | Schedule a shared course for two departments (e.g., MTH 201 for CSC & CSS at Mon 09:00), then try to schedule CSC 201 at Mon 09:00 | Rejected — cohort clash (CSC 201 must not clash with the shared MTH 201 cohort) |
| 9 | Schedule two courses for **disjoint** departments/levels in the same slot (e.g., 100L in Hall A + 200L in Hall B at Mon 09:00) | Both are allowed; slot shows **multiple stacked lectures** |
| 10 | Click an occupied time slot | Slot modal lists **all** courses in that slot with add/remove options |
| 11 | Remove a course from a slot, then add a different one; also **move** a course to a new day/time/venue | Grid updates; no duplicates; move is conflict-checked |
| 12 | Check that a lecturer does not appear in two courses at the same time anywhere on the grid | No lecturer has a clash (can be spot-checked via the Lecturer schedule export) |

**Acceptance:** Tasks 1–12 all behave as expected; this script is the heart of the UAT because it exercises every scheduling constraint the users care about.

### 4.5 Script U-05 — Lecturer: Personal Schedule

| # | Task | Expected Result |
|---|---|---|
| 1 | Log in as a Lecturer | Personal **My Schedule** dashboard opens with only their assigned courses |
| 2 | Verify the weekly timetable shows day, time, venue, course | Each row shows correct session details |
| 3 | Export the schedule to CSV | CSV downloads and opens correctly |
| 4 | Confirm the schedule contains no two sessions at the same time | No time overlaps (cross-check against the grid) |

**Acceptance:** All 4 tasks pass; the lecturer sees an accurate, clash-free personal timetable.

### 4.6 Script U-06 — Admin: System Administration & Venues

| # | Task | Expected Result |
|---|---|---|
| 1 | Log in as Admin; open **Dashboard** | Stats show real counts (courses, venues, slots, scheduled/unscheduled) — not zeros |
| 2 | Open **Staff** | Staff list shows all users, roles, and lock state; locked accounts show a badge |
| 3 | Unlock a locked account | Unlock works; audit trail records it |
| 4 | Open **Schools & Depts** | Full FUT Minna institutional structure visible (SAAT, SICT, SEET, SET, SSTE, SLS, SPS, SIPET, …) |
| 5 | Open **Venues** | Add a new venue, edit, and delete one | Add/edit/delete work; utilization % visible per venue |
| 6 | Open **Reports → Venue Utilization** | Report loads (no server error) and shows utilization % per venue |
| 7 | Open **Session Hours** | Weekly time slots listed; a slot can be added/edited |
| 8 | Confirm Admin can create a course, allocate a lecturer, and generate the timetable | Admin can perform all 3 core functions (course mgmt, allocation, scheduling) |

**Acceptance:** All 8 tasks pass, including venue utilization (previously a 500 error — now fixed).

---

## 5. Questionnaires

### 5.1 Pre-Test Questionnaire (participant background)

| # | Question | Response Options |
|---|---|---|
| 1 | Role in the department | Admin / HOD / Exam Officer / Timetable Officer / Lecturer |
| 2 | Years of experience in this role | <1 / 1–3 / 4–7 / 8+ |
| 3 | Frequency of timetable/allocation work | Daily / Weekly / Monthly / Rarely |
| 4 | Prior experience with scheduling software | None / Some / Extensive |
| 5 | Computer literacy self-rating | 1 (beginner) – 5 (expert) |

### 5.2 Post-Test Questionnaire (custom Likert, 5-point)

Scale: **1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree**

**Category A — Ease of Use**
| # | Statement |
|---|---|
| A1 | I found the system easy to learn without training |
| A2 | Navigation and menus are clear and intuitive |
| A3 | Forms and buttons behave as I expect |
| A4 | Error and warning messages are clear and helpful |

**Category B — Usefulness**
| # | Statement |
|---|---|
| B1 | The system helps me do my job faster than the old (manual) method |
| B2 | The timetable constraint checks prevent real mistakes (clashes, double-bookings) |
| B3 | Flagging unplaced/unscheduled courses with reasons is useful |
| B4 | The dashboard statistics give me the information I need at a glance |
| B5 | Venue utilization reporting is useful for planning |

**Category C — Satisfaction**
| # | Statement |
|---|---|
| C1 | I am satisfied with the overall system |
| C2 | I would use this system in my daily work |
| C3 | I would recommend this system to other departments |
| C4 | The system feels reliable (no crashes or unexpected errors) |

**Open-ended questions (post-test):**
1. What did you like most about the system?
2. What frustrated or confused you the most?
3. What is one feature you would add or change?
4. Any other comments?

### 5.3 System Usability Scale (SUS) — standard 10-item instrument

Administer after the task session. Scale: **1 = Strongly Disagree … 5 = Strongly Agree**.

| # | Item |
|---|---|
| 1 | I think that I would like to use this system frequently |
| 2 | I found the system unnecessarily complex |
| 3 | I thought the system was easy to use |
| 4 | I think that I would need the support of a technical person to be able to use this system |
| 5 | I found the various functions in this system were well integrated |
| 6 | I thought there was too much inconsistency in this system |
| 7 | I would imagine that most people would learn to use this system very quickly |
| 8 | I found the system very cumbersome to use |
| 9 | I felt very confident using the system |
| 10 | I needed to learn a lot of things before I could get going with this system |

---

## 5.4 Online Form Delivery (recommended: Google Forms)

UAT is conducted as an **online, self-administered form** rather than printed questionnaires. Recommended tool: **Google Forms** — free, no account needed for respondents, supports Likert grids, required questions, section branching, automatic response collection with timestamps, and one-click export to Google Sheets / CSV.

> **Methodology note for the report:** with an online form the tasks are **self-reported**, not moderator-observed. The participant works through the task scripts on their own and reports what they completed. State this explicitly in the project chapter (see §9.3) so the results are described honestly.

### 5.4.1 Recommended form structure (5 sections)

| Section | Content | Question type | Required? |
|---|---|---|---|
| 1. Welcome & Consent | Project title, 2–3 sentence description, consent checkbox, role dropdown, optional email | Consent checkbox + dropdown + short answer | Consent + role required |
| 2. Background | The 5 pre-test questions from §5.1 | Dropdowns / linear scale | Yes |
| 3. Task Completion (per role) | The tasks from the role's script in §4, one per row | Dropdown per task: *Completed / Completed with difficulty / Not completed / Not applicable* | Yes |
| 4. Post-Test Likert | Items A1–A4, B1–B5, C1–C4 from §5.2 | Linear scale 1–5 (or grid) | Yes |
| 5. SUS | The 10 SUS items from §5.3 | Linear scale 1–5 (or grid) | Yes |
| 6. Open Feedback | "What did you like most?", "What frustrated you?", "One thing you would change?", optional screenshot upload | Paragraph + file upload | No |

### 5.4.2 Setup tips

- **Role branching:** make the role question in Section 1 a dropdown and use *"Go to section based on answer"* so each participant only sees their own role's task checklist (Section 3), then route everyone to the shared Likert/SUS sections (4–6).
- **Consent gate:** put the consent checkbox at the very top; add *"Submit is disabled until consent is given"* if using a validator, or simply note that submission implies consent.
- **Likert grids:** use one grid question per category (A, B, C, SUS) with the statements as rows and 1–5 as columns — this makes the form much shorter to fill.
- **Per-task dropdowns:** phrase each task as "I was able to …" (e.g., *"I was able to create a new course and see it in the catalog"*), options: *Completed / Completed with difficulty / Not completed / Not applicable*. Add one follow-up paragraph: *"If any task was not completed, what happened?"*
- **Validation:** set the role question to require an exact value; keep all scoring questions required so there are no blank rows to clean later.
- **Distribution:** share the link (and a QR code) via email/WhatsApp to the recruited participants; allow a 5–7 day response window with one reminder. Aim for the §2.1 minimum of 15 responses.
- **Pilot first:** send the form to 1–2 colleagues, check the branching works, then open it to participants.

### 5.4.3 What replaces the printed kit

| Printed item (from §12) | Online equivalent |
|---|---|
| Post-test Likert + SUS forms | Sections 4–5 of the Google Form |
| Task sheets | Distributed as a PDF/email attachment alongside the link (participants work through the tasks, then report in Section 3) |
| Test summary log | The form's automatic response sheet (one row per participant) |
| Consent form | Section 1 consent checkbox |

---

## 6. Scoring & Analysis Methodology

### 6.1 Likert Scoring (custom questionnaire)

- Score each category as the **mean of its items** per participant, then average across participants.
- Present results as a **table** (category, mean, interpretation) and a **bar chart** for the report (see §9).

| Score band | Interpretation |
|---|---|
| 4.5 – 5.0 | Excellent |
| 4.0 – 4.49 | Good |
| 3.0 – 3.99 | Acceptable — improvements recommended |
| < 3.0 | Unacceptable — must improve before acceptance |

### 6.2 SUS Scoring (standard formula)

For each participant:
- **Odd-numbered items (1,3,5,7,9):** contribution = response − 1
- **Even-numbered items (2,4,6,8,10):** contribution = 5 − response
- **SUS score = (sum of contributions) × 2.5** → range 0–100.

| SUS band | Grade | Meaning |
|---|---|---|
| 85 – 100 | A+ / A | Excellent usability |
| 70 – 84 | B / C+ | Acceptable |
| 50 – 69 | C / D | Marginal — needs improvement |
| < 50 | F | Unacceptable |

**Worked example (per participant):** responses 5,1,4,2,5,1,4,2,5,1 → odd contributions (5−1)+(4−1)+(5−1)+(4−1)+(5−1) = 4+3+4+3+4 = 18; even contributions (5−1)+(5−2)+(5−1)+(5−2)+(5−1) = 4+3+4+3+4 = 18; total 36 → **36 × 2.5 = 90 / 100**.

Report **mean SUS across all participants** (with min/max) plus the category means from §6.1.

### 6.3 Pass/Fail Summary Metrics

- **Task completion rate:** % of scenarios completed successfully (pass / total).
- **Critical defect count:** number of open defects rated Critical or High at close-out (must be **0** to accept).
- **Mean task time** (optional, if timing was recorded) per scenario.
- **SUS mean** and **category means** from §6.1.

---

## 7. UAT Test Summary Log (fill in during sessions)

**Moderator:** ______________  **Date:** ______________  **Session #:** ______________  **Participant role:** ______________

| Scenario ID | Task (short) | Expected Result | Actual Result | Pass/Fail | Defect ID (if any) |
|---|---|---|---|---|---|
| U-01.1 | Login success | Role dashboard opens | | | |
| U-01.2 | 5 failed logins → lock | Locked 15 min + countdown | | | |
| U-01.3 | Admin unlock | Immediate login works | | | |
| U-02.1 | Create course | Appears in catalog | | | |
| U-02.3 | Duplicate code | Rejected with message | | | |
| U-03.2 | Allocate lecturer | Saved, workload updates | | | |
| U-03.3 | 5th course over cap | Warned/blocked + override | | | |
| U-03.5 | HOD schedule page | View-only, no generate | | | |
| U-04.2 | Unscheduled list | Only unscheduled / under-quota courses | | | |
| U-04.3 | Auto-generate | Flags unplaced w/ reasons | | | |
| U-04.5 | Venue double-book | 409 "venue already assigned" | | | |
| U-04.6 | 6th lecture in slot | Rejected (max 5) | | | |
| U-04.7 | Same level+dept same time | Rejected | | | |
| U-04.8 | Shared-course cohort clash | Rejected | | | |
| U-04.9 | Disjoint concurrent | Allowed, stacked slots | | | |
| U-04.10 | Click slot | Lists all courses in slot | | | |
| U-04.11 | Add/remove/move | Grid updates, no dupes | | | |
| U-05.3 | Export CSV | Download works | | | |
| U-06.3 | Unlock account | Works + audited | | | |
| U-06.6 | Venue utilization report | Loads with % data | | | |
| U-06.8 | Admin all 3 functions | Create, allocate, generate | | | |

*(Extend the table with every scenario from §4 that applies to the participant's role.)*

---

## 8. Defect / Issue Log Template

| Defect ID | Scenario | Severity (Critical/High/Med/Low) | Description & Steps to Reproduce | Expected vs Actual | Reported By | Status (Open/Fixed/Verified/Deferred) |
|---|---|---|---|---|---|---|
| DEF-01 | | | | | | |

**Severity definitions:**
- **Critical:** blocks the core workflow; no workaround (e.g., page crashes, timetable cannot be generated).
- **High:** major feature broken but workaround exists.
- **Medium:** minor feature degraded or confusing behavior.
- **Low:** cosmetic / wording issues.

**Exit criteria (before sign-off):** 0 open Critical/High defects; all Medium/Low defects triaged (fixed or formally deferred with reason); ≥ 90% of applicable scenarios passed.

---

## 9. Reporting Results in the Final Year Project

### 9.1 Recommended report structure

1. **UAT Overview** — objective, scope, environment (from §1 and §3).
2. **Participants** — table of roles/counts, screening criteria, consent note (§2).
3. **Test Execution** — completed test scripts per role, task completion rate.
4. **Results:**
   - Pass/fail summary table (scenario ID, expected, actual, pass/fail) — from §7.
   - **Category scores table:** | Category | Mean (1–5) | Interpretation | (from §6.1)
   - **SUS results:** | Participant | SUS Score | plus mean, min, max (from §6.2)
   - **Bar chart** of category means and, if desired, a chart of SUS scores per participant.
   - **Defect log** (from §8) with resolution status.
5. **Qualitative feedback** — representative participant quotes (anonymized) and themes.
6. **Acceptance decision & sign-off** (§10).

### 9.2 Charts to include

- Bar chart: mean score per category (Ease of Use, Usefulness, Satisfaction) — with a reference line at 4.0.
- Bar chart: SUS score per participant with the group mean.
- Pie/bar: task completion rate per role (e.g., 100% for Admin, 92% for Timetable Officer).
- Screenshots of key screens (schedule grid with stacked multi-course slots, unplaced-course flag summary, venue utilization report) as evidence.

### 9.3 Utilizing the Online-Form Data in the Chapter

When the UAT is run through the Google Form (§5.4), turn the collected responses into the project chapter as follows:

**Step 1 — Export & archive.** In Google Forms, go to *Responses → Link to Sheets* (or *Download responses (.csv)*). Keep the raw export untouched as your audit trail; work on a copy.

**Step 2 — Clean the data.** Remove test/duplicate submissions (e.g., the same email twice — keep the first), verify the response count per role against the recruitment list, and confirm no required fields are blank.

**Step 3 — Compute scores in the spreadsheet.**
- **SUS per participant** (one formula per row): odd items `=(resp1-1)+(resp3-1)+(resp5-1)+(resp7-1)+(resp9-1)`, even items `=(5-resp2)+(5-resp4)+(5-resp6)+(5-resp8)+(5-resp10)`, then `=SUM(...)*2.5`.
- **Category means:** `=AVERAGE(A1:A4)` per participant, then `=AVERAGE(...)` across participants for the category mean (Ease of Use, Usefulness, Satisfaction).
- **Task completion rate per role:** `=COUNTIF(range,"Completed")/COUNTA(range)` — report also "Completed with difficulty" separately.

**Step 4 — Build the chapter tables.**
1. Participant demographics (role × experience) — from Section 2.
2. Task completion by role (scenario, n attempted, % completed) — from Section 3.
3. Likert category means with interpretation (the §6.1 bands) — from Section 4.
4. SUS per participant with mean, min, max, and band — from Section 5.

**Step 5 — Build the chapter charts** (Google Sheets charts or redrawn for the report).
- Bar chart of the three category means with a 4.0 reference line.
- Bar chart of each participant's SUS score (sorted) with the group mean line.
- Bar chart (or pie) of task completion rate per role.
- Optional: stacked bars showing the response distribution (1–5) per Likert item.

**Step 6 — Write the chapter.** Suggested placement:
- **Methodology chapter (e.g., Ch. 3):** describe the instrument — adapted SUS plus a custom 13-item Likert questionnaire across three categories, 5-point scale, N = 15 participants (3 per role), delivered as a self-administered online form (Google Forms), distributed by email/WhatsApp with a 5–7 day window, consent obtained in-form. Explicitly state that task completion is **self-reported**.
- **Results chapter (e.g., Ch. 4):** present the four tables and charts above, one short paragraph interpreting each (e.g., "Ease of Use averaged 4.6/5, indicating the interface required minimal training"), plus 2–3 anonymized qualitative quotes from Section 6.
- **Evaluation/Discussion:** compare every result against the acceptance targets (§6.3), highlight strengths (constraint checks, unplaced-course flagging), and state limitations honestly (self-reported completion, small sample, single-institution scope).
- **Appendices:** include the full questionnaire (from §5) and the response summary export.

---

## 10. Acceptance Sign-Off Form

**Project:** Automated Course Allocation and Timetable Management System (FUT Minna)

**UAT period:** ____________ to ____________

**Participants:** ____ of ____ invited completed the UAT.

**Summary:**
| Metric | Value | Target | Met? |
|---|---|---|---|
| Scenario pass rate | ____% | ≥ 90% | ☐ Yes ☐ No |
| Open critical defects | ____ | 0 | ☐ Yes ☐ No |
| Open high defects | ____ | 0 | ☐ Yes ☐ No |
| Mean SUS score | ____ | ≥ 70 | ☐ Yes ☐ No |
| Mean Ease of Use | ____ | ≥ 4.0 | ☐ Yes ☐ No |
| Mean Usefulness | ____ | ≥ 4.0 | ☐ Yes ☐ No |
| Mean Satisfaction | ____ | ≥ 4.0 | ☐ Yes ☐ No |

**Acceptance decision:** ☐ Fully Accepted  ☐ Accepted with Conditions (list)  ☐ Not Accepted (reasons)

| Role | Name | Signature | Date |
|---|---|---|---|
| Project Lead (Student) | | | |
| Supervisor | | | |
| HOD / Departmental Representative | | | |
| Timetable Officer Representative | | | |
| Exam Officer Representative | | | |

---

## 11. Suggested UAT Timeline (template)

| Phase | Activity | Duration |
|---|---|---|
| 1 | Prepare environment, seed data, accounts, print materials | 1 day |
| 2 | Pilot run with 1–2 participants; fix material issues | 1 day |
| 3 | Full sessions per role (15+ participants) | 3–5 days |
| 4 | Collect questionnaires; score Likert + SUS | 1 day |
| 5 | Fix critical/high defects found; re-test affected scenarios | 2–3 days |
| 6 | Final summary, charts, sign-off meeting | 1 day |

---

## 12. Quick Reference — What to Prepare Before UAT Day

**Online-form mode (recommended, §5.4):**
1. Google Form built per §5.4.1 (consent, background, role-branched tasks, Likert, SUS, feedback) — test the branching with a pilot submission.
2. Task-sheet PDF per role (from §4) to attach to the invitation email.
3. Demo accounts list (§3.2) with reset instructions, sent to participants.
4. Response sheet opened in Google Sheets, ready for scoring (§9.3).

**If a printed/moderated session is also run:** briefing script (§2.3), consent form, printed Likert + SUS forms (§5.2–5.3), test summary log (§7), defect log (§8).
