# Integration Testing

Scope: integration points across frontend React components, API routes, database operations, CSP scheduling solver, and real-time conflict checking.

| Integration Point Tested | Expected Result | Actual Result |
|---|---|---|
| Login page form -> POST /api/auth/login -> JWT generation -> AuthContext/localStorage | Valid credentials should authenticate user and persist token/user state | Valid credentials return success true and token; frontend AuthContext stores token and user in localStorage |
| Login failure path -> backend lockout logic -> frontend error handling | Invalid credentials should return clear error; locks after 5 attempts | Backend returns 401/403 and frontend surfaces error toast/attempts warning |
| HOD Course Allocation -> POST /api/assignments/course-to-lecturer -> DB sync | Valid allocation creates record and syncs denormalized timetable lecturer fields | Controller updates assignment and runs updateMany on timetable records for same course |
| Workload limit enforcement -> 409 conflict -> HOD override prompt | 5th course triggers workload warning modal; HOD can override with reason | Backend returns WORKLOAD_EXCEEDED; frontend provides override confirmation workflow |
| Timetable Officer slot click -> Multi-course slot modal -> GET slot assignments | Opens modal listing all concurrent classes in that specific slot (up to 5) | Cell click filters schedule for selected day & hour and renders interactive modal with lecture list |
| Slot Modal "+ Add Course" -> POST /api/assignments/course-to-venue-time -> Live conflict check | Pre-validates venue/lecturer/cohort clashes before submission; enforces slot cap (max 5) | Backend checkConflictInternal rejects conflicts with clear message; successful creation updates grid |
| Course Move/Reschedule -> PUT /api/assignments/course-to-venue-time/:id -> Target slot check | Reassigns day/slot/venue without false-positive self-conflict; updates grid in real time | Controller excludes current assignment ID and commits updated slot parameters |
| Course Quota Tracking -> GET /api/assignments/unscheduled -> Allocation status drawer | Displays accurate slot counts (e.g. 1/3 slots) and groups completed vs pending courses | Course allocation drawer displays progress chips and filters full courses from assign picker |
| Auto-Timetable Generator -> POST /api/assignments/auto-generate -> Post-run diagnostics modal | Generates conflict-free timetable and surfaces unplaced courses with detailed reasons in summary dialog | Solver schedules 2-hour blocks + extra slots; frontend displays rich summary dialog with unplaced course breakdown |
| Lecturer Dashboard -> GET /api/assignments/lecturer/:id/schedule -> Timetable view & CSV export | Displays all scheduled teaching sessions (direct or course-allocated) with credits summary | Returns unified schedule for lecturer; exportToCSV downloads formatted file |
| Role notification creation -> Notification model write -> Frontend polling feed | New user registrations and system alerts are surfaced in navigation badge | Backend writes Notification; frontend poll every 30s updates unread badge |

## Integration Verification Summary
- **Total Integration Points Tested**: 11
- **Status**: All integration flows verified and fully operational
- **Last Updated**: August 2026
