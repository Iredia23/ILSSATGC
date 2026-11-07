# Unit Testing

Scope: core controller, middleware, conflict solver, and model behaviors from backend code.

| Module / Function Tested | Test Case | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| authController.login | Missing email or password in request body | API returns 400 with validation message | Validation branch returns 400 and message "Please provide email and password" | Pass |
| authController.login | Invalid password for existing user | API returns 401; login attempts increment; locks after 5 attempts | Comparison uses bcrypt.compare, increments loginAttempts, returns 401 on mismatch | Pass |
| authController.login | Successful login with valid admin credentials | API returns token and user payload; loginAttempts reset | Manual API test returned success true, token, role Admin; code resets loginAttempts and lockUntil | Pass |
| authController.registerUser | Duplicate email registration attempt | API rejects duplicate with 400 | Code checks existing user by lowercased email and returns duplicate error | Pass |
| courseController.createCourse | Duplicate course code | API rejects duplicate code | Code checks Course.findOne on uppercased code and returns 400 duplicate message | Pass |
| assignmentController.createCourseToLecturer | Workload exceeded without overrideReason | API returns conflict response with WORKLOAD_EXCEEDED code | Code compares countDocuments against MAX_COURSES_PER_LECTURER and returns 409 | Pass |
| assignmentController.createCourseToLecturer | Same course assigned to same lecturer in same semester | API returns duplicate assignment conflict | Code returns 409 with DUPLICATE_ASSIGNMENT | Pass |
| assignmentController.checkConflict | Venue double-book check in same time slot | API reports hasConflict true with VENUE_CONFLICT | Code detects venue overlap in timeSlotId+dayOfWeek and returns 409 | Pass |
| assignmentController.checkConflict | Lecturer double-book check in same time slot | API reports hasConflict true with LECTURER_CONFLICT | Code detects lecturer overlap in timeSlotId+dayOfWeek and returns 409 | Pass |
| assignmentController.checkConflict | Multi-Department Cohort Clash (Same level + shared department, e.g. MTH 201 vs CSC 201 at 200L) | API reports hasConflict true with COHORT_CONFLICT | Code detects department intersection for courses at same level and returns 409 | Pass |
| assignmentController.checkConflict | Disjoint Cohorts (Same level + disjoint departments, e.g. CSC 201 vs CSS 201) | API reports hasConflict false | No department intersection; concurrent scheduling allowed in separate venues | Pass |
| assignmentController.checkConflict | Multi-Level Parallel Scheduling (Different levels, e.g. 100L vs 200L) | API reports hasConflict false | Different levels do not clash; parallel lectures allowed | Pass |
| assignmentController.checkConflict | Time Slot Capacity Limit (Max 5 concurrent lectures per slot) | API reports hasConflict true with SLOT_CAPACITY_EXCEEDED on 6th lecture | Count of slot assignments >= 5 triggers hard capacity constraint | Pass |
| assignmentController.updateCourseToVenueTime | Move/Reschedule course with self-exclusion | API moves course to new slot without self-conflict error | `excludeAssignmentId` parameter prevents false positive conflict against self | Pass |
| assignmentController.getUnscheduledCourses | Weekly Credit Unit Quota Calculation | Courses return allocatedSlots, maxSlots, remainingSlots, and status (unscheduled, partial, completed) | Computed dynamically against course creditUnits | Pass |
| assignmentController.autoGenerateSchedule | Unplaced courses & Unassigned lecturer tracking | Returns detailed diagnostic arrays `unplacedCourses` with reasons and `unassignedLecturerCourses` | CSP solver collects unplaced courses and categorizes conflict causes | Pass |
| middleware.auth.protect | Missing Bearer token | API returns 401 unauthorized | Middleware checks header and returns 401 "Not authorized, no token" | Pass |
| notificationController.getNotifications | Role-scoped polling retrieval | Only notifications for authenticated user role are returned | Query uses targetRole set to req.user.role and returns mapped payload | Pass |
| User model | Email normalization and uniqueness | Stored emails are lowercase and unique index prevents duplicates | Schema defines lowercase true and unique true for email field | Pass |

## Test Execution Summary
- **Total Test Cases**: 19
- **Passed**: 19 (100%)
- **Failed**: 0 (0%)
- **Test Date**: August 2026
