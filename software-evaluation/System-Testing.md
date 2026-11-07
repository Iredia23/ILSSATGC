# System Testing (End-to-End)

Scope: full end-to-end workflow scenarios across all 5 system roles (Admin, HOD, Exam Officer, Timetable Officer, Lecturer).

| Scenario ID | End-to-End Scenario | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| ST-01 | Exam Officer logs in and creates new courses across 100L–500L | Courses stored in MongoDB and appear in catalog per semester/level | Course creation endpoint and listing pipeline function through protected routes | Pass |
| ST-02 | HOD allocates lecturers to active courses with workload monitoring | Assignments saved; workload cap of 4 courses enforced with override option | HOD dashboard enforces duplicate and workload limits; syncs to timetable | Pass |
| ST-03 | Timetable Officer runs Automatic Timetable Generator | System places courses in 2hr blocks + extra slots; reports scheduled vs unplaced | CSP solver schedules conflict-free slots; returns diagnostics summary | Pass |
| ST-04 | Timetable Officer reviews unplaced courses in post-generation modal | Modal lists unplaced courses with exact conflict causes (e.g. venue saturation) | Detailed diagnostics dialog displays unplaced table and allows manual slot placement | Pass |
| ST-05 | Concurrent multi-level lecture assignment (100L in Hall A, 200L in Hall B at Mon 09:00) | Both classes scheduled simultaneously in the same time slot without error | System allows multi-level concurrent classes up to 5 per slot | Pass |
| ST-06 | Multi-department shared course clash prevention (MTH 201 for CSC & CSS vs CSC 201 at Mon 09:00) | System blocks concurrent scheduling of CSC 201 with COHORT_CONFLICT error | Backend checkConflictInternal detects shared department 'Computer Science' at 200L and blocks collision | Pass |
| ST-07 | Disjoint department concurrent scheduling (CSC 201 in Hall A, CSS 201 in Hall B at Mon 09:00) | Both classes scheduled simultaneously without clash | Disjoint departments at 200L have zero student overlap and are permitted | Pass |
| ST-08 | Slot capacity limit enforcement (attempting 6th class in same time slot) | System rejects 6th class with SLOT_CAPACITY_EXCEEDED | Hard constraint of 5 concurrent lectures per slot is strictly enforced | Pass |
| ST-09 | Timetable Officer moves/reschedules a course to a new day/time/venue via slot modal | Course moved cleanly without duplicate records or self-conflict errors | Modal move form reassigns slot parameters and refreshes calendar grid | Pass |
| ST-10 | Lecturer logs in and accesses personal schedule & exports CSV | Lecturer sees unified weekly timetable with room, time, and session notes | Lecturer personal schedule route returns complete assigned timetable | Pass |
| ST-11 | Admin monitors user activity, logs, and account lockouts | Repeated failed logins lock user; admin can view audit trail and unlock account | Security lockout and audit logging pipeline operate end-to-end | Pass |

## End-to-End Scenario Narratives

1. **Course Lifecycle & Allocation**:
   - Exam Officer defines course offerings (credit units, level, semester, departments).
   - HOD allocates courses to lecturers with real-time workload limits.
2. **Timetable Scheduling & Solver**:
   - Timetable Officer launches auto-generation or manually assigns courses to calendar cells.
   - Real-time constraint engine evaluates venue, lecturer, slot capacity (max 5), and multi-department cohort overlaps.
   - Unplaced courses are surfaced with diagnostics for manual resolution.
3. **Execution & Lecturer View**:
   - Lecturers log into their personal dashboard to access customized weekly schedules and export to CSV.
   - Timetable Officer reallocates or moves slots on-demand via the interactive slot manager.
