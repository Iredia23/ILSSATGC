# Software Requirements Document (SRD)
## FUT Minna Staff Dashboard - RBAC-Enabled Lecture Scheduling System

**Project:** Role-Based Access Control (RBAC) Staff Dashboard for Computer Science Department  
**Institution:** Federal University of Technology, Minna  
**Tech Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  
**Date Prepared:** June 2026  
**Status:** Ready for Development  

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Overview

The FUT Minna Staff Dashboard is a web-based, Role-Based Access Control (RBAC) system designed to centralize and automate lecture scheduling workflows in the Computer Science Department. The system replaces manual, meeting-driven processes with a unified digital platform accessible to five distinct user roles: **Admin**, **Head of Department (HOD)**, **Exam Officer**, **Timetable Officer**, and **Lecturer**.

### 1.2 Business Objectives

- **Eliminate manual scheduling inefficiencies** - Reduce administrative overhead by up to 50%
- **Prevent venue conflicts** - Implement real-time conflict checking during course-to-venue-time assignment
- **Centralize information flow** - Provide a single source of truth for all scheduling data
- **Ensure data security** - Enforce role-based access with JWT authentication and bcrypt password hashing
- **Improve lecturer preparedness** - Enable lecturers to access personalized schedules in real-time
- **Create a replicable model** - Design architecture scalable to other departments and faculties

### 1.3 Key Features at a Glance

| Feature | Responsible Role(s) | Outcome |
|---------|-------------------|---------|
| User Registration & Role Assignment | Admin | Secure, role-based system access |
| Course Management | Exam Officer | Course catalog per level/semester |
| Venue Management | Admin, Timetable Officer | Available rooms/lecture halls |
| Time Slot Management | Admin, Timetable Officer | Available time slots per semester |
| Course-to-Lecturer Assignment | HOD | Lecturer allocations with no overlaps |
| Course-to-Venue-Time Assignment | Timetable Officer | Schedule generation with conflict detection |
| Personalized Lecturer Dashboard | Lecturer | View own teaching hours, venues, departments |
| Administrative Dashboard | Admin, HOD, Exam Officer, Timetable Officer | System-wide oversight, data management |

---

## 2. FUNCTIONAL REQUIREMENTS BY FEATURE MODULE

### 2.1 User Management Module

#### 2.1.1 User Registration & Account Creation

**FR-UM-001: Admin User Registration**

- The system shall allow the **Admin role** to register new users by capturing: full name, email address, assigned role, and department (Computer Science).
- Email validation shall occur before account creation.
- A temporary password shall be generated and communicated to the new user.
- The system shall enforce bcrypt hashing on all passwords before storage.

**FR-UM-002: Self-Service Password Reset**

- All users shall be able to reset their password via email-based token verification.
- Password reset tokens shall expire after 24 hours.
- New passwords must meet minimum security requirements: at least 8 characters, including uppercase, lowercase, and numeric characters.

**FR-UM-003: User Profile Management**

- Each user shall have a profile containing: full name, email, phone number (optional), office location (optional), and assigned role.
- Users shall be able to update their profile information except their assigned role and email address.
- Profile updates shall be immediately reflected in the system.

#### 2.1.2 Authentication & Authorization

**FR-UM-004: JWT-Based Authentication**

- The system shall issue a JWT upon successful login.
- The JWT shall contain: user ID, email, assigned role, and token expiration time (12-hour default).
- All API requests to protected endpoints shall require a valid, non-expired JWT in the `Authorization` header.
- Expired tokens shall be rejected, and the user shall be redirected to the login page.

**FR-UM-005: Role-Based Access Control (RBAC)**

- The system shall enforce five distinct roles with non-overlapping permission sets:
  - **Admin:** Full system access, user management, venue/time slot creation
  - **HOD:** Course allocation, lecturer assignment, system oversight
  - **Exam Officer:** Course management (add, edit, delete), course offerings per level
  - **Timetable Officer:** Course-to-venue-time assignment, schedule generation
  - **Lecturer:** View personal schedule only, view course and venue details

- Every API endpoint shall validate the requesting user's role against required permissions before processing.
- Unauthorized role access shall return a 403 Forbidden response with a descriptive error message.

**FR-UM-006: Session Management**

- Sessions shall remain active for 12 hours of last user activity.
- Sessions shall expire automatically after 24 hours regardless of activity.
- The system shall provide a "Remember Me" option that extends session duration to 30 days.
- Users shall be able to manually log out, which invalidates their current JWT.

#### 2.1.3 User Listing & Administration

**FR-UM-007: User Directory**

- The **Admin role** shall be able to view a paginated list of all system users.
- The user list shall display: full name, email, role, status (active/inactive), and date joined.
- The Admin shall be able to search users by name or email.
- The Admin shall be able to filter users by role.

**FR-UM-008: User Status Management**

- The **Admin role** shall be able to deactivate a user account, preventing login.
- Deactivated users shall retain their historical data but cannot access the system.
- The Admin shall be able to reactivate a deactivated user.
- Account deactivation shall be logged with timestamp and deactivating admin's ID.

---

### 2.2 Course Management Module

#### 2.2.1 Course Creation & Maintenance

**FR-CM-001: Course Creation**

- The **Exam Officer** shall be able to add a new course by specifying:
  - Course code (e.g., CSC 411)
  - Course title (e.g., Mobile App Development)
  - Credit units (numeric)
  - Level (100, 200, 300, 400)
  - Department(s) offering the course (Multi-select)
  - Semester offering (1st Semester, 2nd Semester, Full Year)

- Course codes shall be unique within the system.
- All required fields shall be validated before saving.

**FR-CM-002: Course Editing & Deletion**

- The **Exam Officer** shall be able to edit any course except its code.
- The **Admin role** shall have authority to delete a course.
- When a course is deleted, all associated assignments (course-to-lecturer, course-to-venue-time) shall be removed and logged.
- Deletion of a course with active assignments shall trigger a warning and confirmation dialog.

**FR-CM-003: Course Listing & Search**

- All authorized users (except pure Lecturer role) shall be able to view a paginated list of all courses.
- The course list shall display: code, title, credit units, level, departments, and semester.
- Users shall be able to filter courses by level, department, and semester.
- Users shall be able to search courses by code or title.

**FR-CM-004: Course Details View**

- Users shall be able to click on a course to view full details including:
  - Course metadata (code, title, credits, level, departments)
  - Assigned lecturer(s)
  - Assigned venue and time slot(s)
  - Enrolled student count (if available)

---

### 2.3 Venue Management Module

#### 2.3.1 Venue Creation & Maintenance

**FR-VM-001: Venue Registration**

- The **Admin role** shall be able to add a new venue by specifying:
  - Venue name/code (e.g., CSC-Lab-01, Lecture Hall A)
  - Building name (optional)
  - Capacity (maximum number of students)
  - Venue type (Lecture Hall, Laboratory, Seminar Room, Auditorium)
  - Equipment available (projector, whiteboard, computer lab facilities, etc. — checkboxes)

- Venue names shall be unique within the system.
- All required fields shall be validated before saving.

**FR-VM-002: Venue Editing & Deletion**

- The **Admin** and **Timetable Officer** roles shall be able to edit venue details.
- The **Admin role** shall have authority to delete a venue.
- When a venue is deleted, all associated schedule assignments shall be removed and logged.
- Deletion of a venue with active assignments shall trigger a warning and confirmation dialog.

**FR-VM-003: Venue Listing & Availability**

- All users shall be able to view a paginated list of all venues.
- The venue list shall display: name, building, capacity, type, and availability status.
- Users shall be able to search venues by name or code.
- Users shall be able to filter venues by type and minimum capacity.

**FR-VM-004: Venue Schedule Visualization**

- The **Timetable Officer** shall be able to view a venue's weekly schedule, showing all courses assigned to that venue by day and time slot.
- The visualization shall highlight available and occupied time slots.
- The visualization shall prevent assignment of conflicting courses to the same venue.

---

### 2.4 Time Slot Management Module

#### 2.4.1 Time Slot Setup

**FR-TM-001: Time Slot Creation**

- The **Admin role** shall be able to define available time slots for the semester by specifying:
  - Start time (e.g., 08:00 AM)
  - End time (e.g., 10:00 AM)
  - Duration in hours (auto-calculated from start/end times)
  - Days of the week the slot is available (checkboxes: Mon–Fri)
  - Applicable semester(s) (1st, 2nd, Full Year)

- Time slots shall be defined in hourly increments (e.g., 08:00-09:00, 09:00-10:00, etc.).
- Overlapping time slot definitions shall be flagged with a warning but allowed (as overlaps may be intentional).

**FR-TM-002: Time Slot Editing & Deletion**

- The **Admin role** shall be able to edit time slot definitions.
- The **Admin role** shall be able to delete a time slot.
- Deletion of a time slot with active schedule assignments shall trigger a warning.
- Existing assignments to a deleted time slot shall be flagged for reassignment.

**FR-TM-003: Time Slot Listing**

- All users shall be able to view the semester's available time slots.
- The list shall display: start time, end time, duration, available days, and applicable semesters.
- Users shall be able to filter by semester and available days.

**FR-TM-004: Weekly Time Slot View**

- The **Timetable Officer** shall be able to view a weekly grid of available time slots.
- The grid shall show all time slots by day and time, with visual indicators of occupancy across all venues.

---

### 2.5 Course-to-Lecturer Assignment Module

#### 2.5.1 Course Allocation

**FR-LA-001: Lecturer Course Assignment**

- The **HOD role** shall assign courses to lecturers by specifying:
  - Course (dropdown from course list)
  - Lecturer (dropdown from lecturer list)
  - Semester (1st, 2nd, or Full Year)

- A single course may be assigned to multiple lecturers (course repeats).
- A single lecturer may teach multiple courses.
- The system shall not allow duplicate assignments (same course + same lecturer + same semester).

**FR-LA-002: Assignment Validation**

- Before confirming an assignment, the system shall check:
  - The lecturer exists and is active
  - The course exists and is active
  - No duplicate assignment already exists
  - The course's affiliated department(s) match the lecturer's department

- If validation fails, a descriptive error message shall be displayed.

**FR-LA-003: Assignment Listing & Management**

- The **HOD role** shall be able to view all course-to-lecturer assignments for a given semester.
- The list shall display: course code, course title, assigned lecturer(s), and semester.
- The HOD shall be able to search assignments by course code or lecturer name.
- The HOD shall be able to edit an assignment (change lecturer).
- The HOD shall be able to delete an assignment.

**FR-LA-004: Conflict Detection**

- The system shall prevent a single lecturer from being assigned more than a defined maximum number of courses per semester (e.g., 4 courses max).
- If a lecturer is assigned above this threshold, a warning shall be displayed, but the assignment may proceed with HOD confirmation.

---

### 2.6 Course-to-Venue-Time Assignment Module

#### 2.6.1 Schedule Generation & Assignment

**FR-ST-001: Schedule Assignment & Multi-Course Slot Interface**

- The **Timetable Officer** shall use an interactive timetable grid interface to assign courses to venues and time slots.
- The interface shall support **up to 5 concurrent lectures per time slot**, allowing different levels or disjoint student cohorts to hold classes simultaneously in separate venues.
- The interface shall provide an interactive **Slot Management Modal** when clicking any cell, displaying:
  - All classes currently running in that slot with course, level badge, venue, lecturer, and session notes
  - Current slot capacity meter (e.g. `3/5 classes`)
  - Sub-actions to **+ Add Course to Slot**, **🔁 Move / Reschedule**, **✏️ Edit Details**, and **🗑️ Remove**
- The system shall provide an **Unscheduled Courses Drawer** filterable by level with credit-unit quota tracking indicators and 1-click **"Assign to Slot"** actions.

**FR-ST-002: Advanced Conflict Detection & Multi-Department Cohort Integrity**

- Before confirming a course-to-venue-time assignment or move operation, the system shall check:
  - **Venue Conflict (`VENUE_CONFLICT`)**: Venue is not already booked at the selected time slot.
  - **Lecturer Conflict (`LECTURER_CONFLICT`)**: Assigned lecturer is not teaching another course at the selected time slot.
  - **Multi-Department Cohort Conflict (`COHORT_CONFLICT`)**: No two courses at the same academic level sharing enrolled departments (e.g., `MTH 201` taken by CSC and CSS at 200L) are scheduled at the same time. Courses at different levels or for disjoint departments are allowed.
  - **Time Slot Capacity (`SLOT_CAPACITY_EXCEEDED`)**: The slot does not exceed the maximum cap of 5 concurrent lectures.
- If a conflict is detected, the system shall display descriptive conflict details and block assignment unless an authorized override is confirmed for non-capacity conflicts.

**FR-ST-003: Weekly Credit Unit Quota Tracking**

- The system shall compute weekly required time slots based on course credit units ($1\text{ Credit Unit} = 1\text{ Time Slot}$ per week).
- Courses shall track status: `unscheduled` (0 slots), `partial` ($0 < \text{allocated} < \text{creditUnits}$), and `completed` ($\ge \text{creditUnits}$).
- Completed courses shall be hidden from assignment pickers by default, with an override toggle (`showFullQuotaCourses`) for extra lab/tutorial allocations.

**FR-ST-004: Course Move / Rescheduling Workflow**

- The **Timetable Officer** shall be able to reschedule an existing class to a new Day, Time Slot, and Venue via the slot modal.
- The move operation shall pre-validate conflicts against target parameters while excluding the current assignment ID (`excludeAssignmentId`) to prevent false-positive self-collisions.

**FR-ST-005: Automatic Timetable Generator & Diagnostic Reporting**

- The system shall provide an automated Constraint Satisfaction Problem (CSP) solver that schedules all courses across conflict-free slots.
- Upon completion, the system shall display a **Post-Generation Diagnostics Modal** summarizing:
  - Total scheduled courses and slot allocations
  - Detailed table of unplaced courses with exact bottleneck causes (e.g. venue saturation, capacity limits, cohort collisions)
  - Count and list of scheduled courses with unassigned lecturers

---

### 2.7 Lecturer Dashboard Module

#### 2.7.1 Personalized Schedule View

**FR-LD-001: Lecturer Personal Schedule (Tabular View)**

- Each **Lecturer** shall have access to a personalized dashboard displaying:
  - **Course Code** - The code of each assigned course
  - **Course Title** - The title of each assigned course
  - **Venue** - The assigned lecture hall or lab
  - **Day of Week** - E.g., Monday, Tuesday, etc.
  - **Time** - Start and end times (e.g., 08:00 AM - 10:00 AM)
  - **Enrolled Departments** - Departments/levels that will attend the course

- The schedule shall be filterable by semester.
- The schedule shall show only courses assigned to the logged-in lecturer.
- The schedule shall be sorted by day of week and start time.

**FR-LD-002: Lecturer Personal Schedule (Calendar View)**

- The **Lecturer** shall have the option to view their schedule in a calendar view (weekly or monthly).
- The calendar shall display each assigned course as an event with:
  - Course code and title
  - Venue
  - Start and end times
  - Color-coded by department or course level

- The lecturer shall be able to navigate between weeks/months.
- The lecturer shall be able to click on an event to see full course details.

**FR-LD-003: Course Details from Lecturer Dashboard**

- When a lecturer clicks on a course in their schedule, they shall see:
  - Course code, title, and credit units
  - Assigned venue with capacity and available equipment
  - Day(s) and time(s) the course is taught
  - All departments and levels enrolled in the course
  - List of any co-instructors (if applicable)

**FR-LD-004: Schedule Download**

- The **Lecturer** shall be able to download their personal schedule in PDF or CSV format.
- The PDF shall be printer-friendly with a clear layout.
- The CSV shall include all schedule details for import into calendar applications.

**FR-LD-005: Schedule Notifications (Future Enhancement)**

- The **Lecturer** shall receive a notification when:
  - A new course is assigned to them
  - An assigned course's venue or time is changed
  - A schedule conflict is detected

- Notifications shall be sent via email and displayed in-app.

---

### 2.8 Administrative Dashboard Module

#### 2.8.1 System-Wide Views & Controls

**FR-AD-001: Admin Dashboard Overview**

- The **Admin role** shall have a dashboard displaying:
  - Total number of registered users by role
  - Total number of courses in the system
  - Total number of venues
  - Number of scheduled courses (with venue and time assigned)
  - Number of unscheduled courses (allocated to lecturers but not to venue/time)
  - Any system alerts or conflicts

- Each section shall be clickable to drill down into detailed data.

**FR-AD-002: System Health Monitoring**

- The Admin dashboard shall include:
  - Last system backup timestamp
  - Current database storage usage
  - API response time metrics (average, p95, p99)
  - Error rate in the last 24 hours

- Alerts shall be triggered if response time exceeds 2 seconds or error rate exceeds 1%.

**FR-AD-003: User Activity Audit Log**

- The **Admin role** shall access an audit log displaying:
  - User ID and name
  - Action performed (Create, Read, Update, Delete)
  - Entity affected (User, Course, Venue, Assignment, etc.)
  - Timestamp
  - IP address (if logged)

- The Admin shall be able to filter by user, action, entity type, and date range.
- The audit log shall be exportable as CSV.

**FR-AD-004: Data Backup & Recovery**

- The **Admin role** shall be able to trigger a full system backup on demand.
- Automatic backups shall occur daily at a configured time (default: 02:00 AM).
- The Admin shall be able to view backup history and restore from a previous backup (with warning).

---

### 2.9 Reporting Module

#### 2.9.1 Standard Reports

**FR-RP-001: Semester Schedule Report**

- All administrative roles (Admin, HOD, Exam Officer, Timetable Officer) shall be able to generate a comprehensive semester schedule report showing:
  - All courses
  - Assigned lecturer(s)
  - Venue
  - Time slot
  - Enrolled departments

- The report shall be exportable as PDF and Excel.

**FR-RP-002: Lecturer Workload Report**

- The **HOD** shall be able to generate a report showing:
  - Each lecturer's name
  - Number of courses assigned
  - Total credit units taught
  - Average class size (if enrollment data available)

- The report shall highlight lecturers exceeding a defined workload threshold.

**FR-RP-003: Venue Utilization Report**

- The **Timetable Officer** and **Admin** shall be able to generate a report showing:
  - Each venue's capacity and current utilization percentage
  - Scheduled courses per venue
  - Available time slots per venue

- The report shall identify underutilized venues.

**FR-RP-004: Conflict Report**

- The **Timetable Officer** shall be able to generate a report of all detected scheduling conflicts:
  - Venue conflicts (same venue, overlapping times)
  - Lecturer conflicts (same lecturer, overlapping times)
  - Level conflicts (same level, overlapping times in same venue)

- The report shall include suggested resolutions.

---

## 3. FUNCTIONAL REQUIREMENTS BY USER ROLE

### 3.1 Admin Role

| Requirement ID | Requirement Description | Access |
|---|---|---|
| FR-UM-001 | Register new users and assign roles | ✓ |
| FR-UM-005 | View and enforce RBAC | ✓ |
| FR-UM-007 | View user directory and search users | ✓ |
| FR-UM-008 | Activate/deactivate user accounts | ✓ |
| FR-VM-001 | Create and edit venues | ✓ |
| FR-VM-002 | Delete venues and manage venue data | ✓ |
| FR-VM-003 | View all venues | ✓ |
| FR-TM-001 | Define and edit time slots | ✓ |
| FR-TM-002 | Delete time slots | ✓ |
| FR-TM-003 | View all time slots | ✓ |
| FR-AD-001 | Access admin dashboard with system overview | ✓ |
| FR-AD-002 | Monitor system health and metrics | ✓ |
| FR-AD-003 | Access audit log | ✓ |
| FR-AD-004 | Trigger and manage backups | ✓ |
| FR-RP-001 | Generate semester schedule report | ✓ |
| FR-RP-003 | Generate venue utilization report | ✓ |

---

### 3.2 Head of Department (HOD) Role

| Requirement ID | Requirement Description | Access |
|---|---|---|
| FR-CM-003 | View all courses | ✓ |
| FR-VM-003 | View all venues | ✓ |
| FR-TM-003 | View all time slots | ✓ |
| FR-LA-001 | Assign courses to lecturers | ✓ |
| FR-LA-003 | Manage course-to-lecturer assignments | ✓ |
| FR-LA-004 | Detect lecturer workload conflicts | ✓ |
| FR-ST-002 | Approve overrides for schedule conflicts | ✓ |
| FR-RP-001 | Generate semester schedule report | ✓ |
| FR-RP-002 | Generate lecturer workload report | ✓ |

---

### 3.3 Exam Officer Role

| Requirement ID | Requirement Description | Access |
|---|---|---|
| FR-CM-001 | Create new courses | ✓ |
| FR-CM-002 | Edit and delete courses | ✓ |
| FR-CM-003 | View and search all courses | ✓ |
| FR-CM-004 | View course details | ✓ |
| FR-VM-003 | View all venues | ✓ |
| FR-TM-003 | View all time slots | ✓ |
| FR-RP-001 | Generate semester schedule report | ✓ |

---

### 3.4 Timetable Officer Role

| Requirement ID | Requirement Description | Access |
|---|---|---|
| FR-CM-003 | View all courses | ✓ |
| FR-VM-002 | Edit venue details | ✓ |
| FR-VM-003 | View all venues and schedule | ✓ |
| FR-VM-004 | View venue schedule visualization | ✓ |
| FR-TM-003 | View all time slots | ✓ |
| FR-TM-004 | View weekly time slot grid | ✓ |
| FR-ST-001 | Assign courses to venues and times | ✓ |
| FR-ST-002 | Detect and handle schedule conflicts | ✓ |
| FR-ST-003 | Bulk upload schedule assignments (optional) | ✓ |
| FR-ST-004 | Edit and delete schedule assignments | ✓ |
| FR-ST-005 | View complete semester schedule in multiple formats | ✓ |
| FR-RP-001 | Generate semester schedule report | ✓ |
| FR-RP-003 | Generate venue utilization report | ✓ |
| FR-RP-004 | Generate conflict report | ✓ |

---

### 3.5 Lecturer Role

| Requirement ID | Requirement Description | Access |
|---|---|---|
| FR-CM-004 | View course details | ✓ |
| FR-VM-003 | View venue information | ✓ |
| FR-LD-001 | View personalized schedule (tabular) | ✓ |
| FR-LD-002 | View personalized schedule (calendar) | ✓ |
| FR-LD-003 | View full course details from dashboard | ✓ |
| FR-LD-004 | Download personal schedule (PDF/CSV) | ✓ |

---

## 4. DETAILED USER STORIES WITH ACCEPTANCE CRITERIA

### 4.1 User Management & Authentication

#### User Story 1.1: Admin Registers a New Timetable Officer

**As an** Admin  
**I want to** register a new Timetable Officer into the system  
**So that** they can begin managing lecture schedule assignments

**Acceptance Criteria:**

- [ ] Admin navigates to the User Management section
- [ ] Admin clicks "Add New User"
- [ ] A form appears with fields: Full Name, Email, Role (dropdown), Department (pre-filled: Computer Science)
- [ ] Admin enters all required information and submits
- [ ] System validates email format (valid RFC 5322 compliant email)
- [ ] Email must be unique; duplicate emails are rejected with error message
- [ ] A temporary password is generated and displayed
- [ ] System sends email to new user with temporary password and login instructions
- [ ] New user is created with status "Active"
- [ ] Audit log records: [timestamp, Admin ID, "User Created", new user details]
- [ ] Success message confirms: "Timetable Officer [name] registered successfully"

**API Endpoint:** `POST /api/v1/users`

---

#### User Story 1.2: User Resets Forgotten Password

**As a** Lecturer  
**I want to** reset my password if I forget it  
**So that** I can regain access to my account

**Acceptance Criteria:**

- [ ] User navigates to login page and clicks "Forgot Password?"
- [ ] A form requests the user's email address
- [ ] User enters email and clicks "Send Reset Link"
- [ ] System verifies email exists in database
- [ ] System generates a unique, time-limited token (24-hour expiry)
- [ ] System sends email with reset link: `https://dashboard.fut-minna.edu.ng/reset-password?token=[token]`
- [ ] User clicks link within 24 hours
- [ ] Reset form appears with fields: New Password, Confirm Password
- [ ] Passwords must meet requirements: ≥8 chars, 1 uppercase, 1 lowercase, 1 number
- [ ] User submits new password
- [ ] System validates password format
- [ ] Password is hashed with bcrypt (salt rounds: 10)
- [ ] JWT session is invalidated; user must login again
- [ ] Success message: "Password updated successfully. Please login with your new password."
- [ ] Audit log records: [timestamp, User ID, "Password Reset"]

**API Endpoints:**
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

---

#### User Story 1.3: Lecturer Logs In and Accesses Dashboard

**As a** Lecturer  
**I want to** log in with my email and password  
**So that** I can access my teaching schedule

**Acceptance Criteria:**

- [ ] User navigates to login page
- [ ] Form has fields: Email, Password, checkbox "Remember Me"
- [ ] User enters valid credentials
- [ ] System checks if account is active (not deactivated)
- [ ] System validates password against bcrypt hash
- [ ] If credentials are invalid, error: "Invalid email or password"
- [ ] If credentials are valid, system generates JWT with:
  - User ID
  - Email
  - Role (e.g., "Lecturer")
  - Expiration: 12 hours from login (if "Remember Me" unchecked)
  - Expiration: 30 days from login (if "Remember Me" checked)
- [ ] JWT is stored in secure HTTP-only cookie and localStorage
- [ ] User is redirected to dashboard (role-specific landing page)
- [ ] Dashboard displays personalized greeting: "Welcome, [Full Name]"
- [ ] Audit log records: [timestamp, User ID, "Login", IP address]
- [ ] API returns: `{ success: true, token: "[JWT]", user: { id, email, role, name } }`

**API Endpoint:** `POST /api/v1/auth/login`

---

#### User Story 1.4: Admin Views All Users and Filters by Role

**As an** Admin  
**I want to** view a list of all registered users and filter by role  
**So that** I can manage user accounts and verify proper role assignments

**Acceptance Criteria:**

- [ ] Admin navigates to User Management → Users List
- [ ] Page displays paginated table with columns: Full Name, Email, Role, Status (Active/Inactive), Date Joined
- [ ] Table shows 10 users per page by default; pagination controls available
- [ ] Filter dropdown shows options: All Roles, Admin, HOD, Exam Officer, Timetable Officer, Lecturer
- [ ] Admin selects a role, table updates in real-time showing only that role
- [ ] Search box allows filtering by full name or email (case-insensitive)
- [ ] Search and filter can be combined
- [ ] Each row has action buttons: View, Edit, Deactivate (if active) / Activate (if inactive)
- [ ] Results show total count: "Showing [X] of [Y] users"
- [ ] Sorting available on: Full Name, Email, Date Joined (ascending/descending)

**API Endpoint:** `GET /api/v1/users?role=[role]&search=[term]&page=[n]&limit=10`

---

#### User Story 1.5: Admin Deactivates a User Account

**As an** Admin  
**I want to** deactivate a user account (e.g., if a staff member leaves)  
**So that** they cannot access the system anymore

**Acceptance Criteria:**

- [ ] Admin navigates to Users List and finds the target user
- [ ] Admin clicks "Deactivate" button next to the user
- [ ] Confirmation dialog appears: "Are you sure you want to deactivate [User Name]? They will not be able to login."
- [ ] Admin confirms by clicking "Deactivate"
- [ ] System sets user's status to "Inactive"
- [ ] User's active sessions are invalidated (all JWTs expire immediately)
- [ ] Any subsequent login attempt by deactivated user fails with: "This account has been deactivated. Please contact the administrator."
- [ ] User's historical data (courses assigned, schedules, etc.) is retained
- [ ] Success message: "[User Name] has been deactivated"
- [ ] Audit log records: [timestamp, Admin ID, "User Deactivated", deactivated user ID]
- [ ] Admin can reactivate user later by clicking "Activate" button

**API Endpoints:**
- `PATCH /api/v1/users/[userId]/deactivate`
- `PATCH /api/v1/users/[userId]/activate`

---

### 4.2 Course Management

#### User Story 2.1: Exam Officer Adds a New Course for 200-Level Students

**As an** Exam Officer  
**I want to** add a new course to the system for 200-level students  
**So that** the HOD can allocate it to lecturers and the Timetable Officer can schedule it

**Acceptance Criteria:**

- [ ] Exam Officer navigates to Course Management → Add Course
- [ ] Form appears with fields:
  - Course Code (e.g., CSC 211)
  - Course Title (e.g., Object-Oriented Programming)
  - Credit Units (numeric, 1-6)
  - Level (dropdown: 100, 200, 300, 400)
  - Department(s) (multi-select checkboxes: Computer Science, Software Engineering, etc.)
  - Semester (dropdown: 1st Semester, 2nd Semester, Full Year)
  - Course Description (textarea, optional)

- [ ] Exam Officer enters all required fields and clicks "Save"
- [ ] System validates:
  - Course Code is unique (no duplicates allowed)
  - Course Title is not empty
  - Credit Units is numeric and between 1-6
  - At least one department is selected
  - All fields follow formatting rules

- [ ] If validation fails, errors are displayed inline (red text under field)
- [ ] If validation passes, course is saved to database
- [ ] Success message: "Course [Code] - [Title] added successfully"
- [ ] New course appears in course list
- [ ] Audit log records: [timestamp, Exam Officer ID, "Course Created", course details]
- [ ] API returns: `{ success: true, course: { id, code, title, creditUnits, level, departments, semester, createdAt } }`

**API Endpoint:** `POST /api/v1/courses`

**Request Body:**
```json
{
  "code": "CSC 211",
  "title": "Object-Oriented Programming",
  "creditUnits": 3,
  "level": 200,
  "departments": ["Computer Science"],
  "semester": "1st Semester",
  "description": "Introduction to OOP principles..."
}
```

**Response:**
```json
{
  "success": true,
  "course": {
    "id": "6123abc456def789ghi012jk",
    "code": "CSC 211",
    "title": "Object-Oriented Programming",
    "creditUnits": 3,
    "level": 200,
    "departments": ["Computer Science"],
    "semester": "1st Semester",
    "createdAt": "2026-06-09T10:30:00Z"
  }
}
```

---

#### User Story 2.2: Exam Officer Edits a Course's Credit Units

**As an** Exam Officer  
**I want to** edit a course's credit units if there's a mistake  
**So that** the scheduling reflects accurate course information

**Acceptance Criteria:**

- [ ] Exam Officer navigates to Course Management → View All Courses
- [ ] Exam Officer finds the course (search or scroll) and clicks "Edit"
- [ ] Edit form appears with all course fields pre-populated
- [ ] Exam Officer changes the Credit Units field
- [ ] All other fields (Code, Title, etc.) remain read-only or editable based on business rules
- [ ] Exam Officer clicks "Save Changes"
- [ ] System validates the new value
- [ ] If valid, course is updated and success message displays
- [ ] If invalid, error message displays and changes are not saved
- [ ] Audit log records the change: [timestamp, Exam Officer ID, "Course Updated", old value, new value]
- [ ] Change propagates to any already-scheduled instances of the course (informational only, no schedule auto-adjustment)

**API Endpoint:** `PUT /api/v1/courses/[courseId]`

---

#### User Story 2.3: Exam Officer Deletes a Course

**As an** Exam Officer (or **Admin** with explicit permission)  
**I want to** delete a course that is no longer offered  
**So that** it doesn't clutter the system

**Acceptance Criteria:**

- [ ] Exam Officer (or Admin) navigates to Course Management
- [ ] Clicks "Delete" button next to a course
- [ ] System checks if course has active assignments (course-to-lecturer or course-to-venue-time)
- [ ] If no active assignments, confirmation dialog: "Are you sure you want to delete [Course Code]? This cannot be undone."
- [ ] If there ARE active assignments, warning dialog: "This course has [N] active assignments. Deleting it will remove all assignments. Are you sure?"
- [ ] User clicks "Delete" to confirm
- [ ] Course is removed from database
- [ ] All associated assignments are deleted and logged separately
- [ ] Success message: "Course [Code] deleted successfully"
- [ ] Audit log records: [timestamp, User ID, "Course Deleted", course ID, associated assignments removed]

**API Endpoint:** `DELETE /api/v1/courses/[courseId]`

---

#### User Story 2.4: View All Courses with Filter and Search

**As a** Timetable Officer  
**I want to** view all available courses and filter by level and semester  
**So that** I can find the courses to schedule

**Acceptance Criteria:**

- [ ] Timetable Officer navigates to Course Management → View All Courses
- [ ] Page displays paginated table with columns: Code, Title, Level, Credit Units, Departments, Semester
- [ ] Filter options available:
  - By Level (100, 200, 300, 400)
  - By Semester (1st Semester, 2nd Semester, Full Year)
  - By Department (multi-select)

- [ ] Search box filters by Course Code or Title (real-time, case-insensitive)
- [ ] Filters and search can be combined
- [ ] Table shows 15 courses per page; pagination available
- [ ] Each course row is clickable to view full details
- [ ] Results show total count: "Showing [X] of [Y] courses"
- [ ] Sorting available on: Code, Title, Level, Credit Units

**API Endpoint:** `GET /api/v1/courses?level=[level]&semester=[semester]&department=[dept]&search=[term]&page=[n]&limit=15`

---

### 4.3 Venue Management

#### User Story 3.1: Admin Creates a New Lecture Hall

**As an** Admin  
**I want to** register a new lecture hall in the system  
**So that** it can be used for course scheduling

**Acceptance Criteria:**

- [ ] Admin navigates to Venue Management → Add Venue
- [ ] Form appears with fields:
  - Venue Name/Code (e.g., "CSC Lecture Hall A")
  - Building Name (optional, e.g., "Computer Science Building")
  - Capacity (numeric: max students, e.g., 150)
  - Venue Type (dropdown: Lecture Hall, Laboratory, Seminar Room, Auditorium)
  - Equipment Available (multi-select checkboxes: Projector, Whiteboard, Computer Lab, WiFi, etc.)

- [ ] Admin enters all required fields and clicks "Save"
- [ ] System validates:
  - Venue Name is unique (no duplicates)
  - Capacity is numeric and positive
  - At least the required fields are filled

- [ ] If validation passes, venue is saved
- [ ] Success message: "Venue [Name] added successfully"
- [ ] New venue appears in venue list
- [ ] Audit log records: [timestamp, Admin ID, "Venue Created", venue details]

**API Endpoint:** `POST /api/v1/venues`

---

#### User Story 3.2: Timetable Officer Views a Venue's Weekly Schedule

**As a** Timetable Officer  
**I want to** see the weekly schedule for a specific venue (which courses are assigned to it, and when)  
**So that** I can identify available time slots and avoid conflicts

**Acceptance Criteria:**

- [ ] Timetable Officer navigates to Venue Management or Schedule Planning
- [ ] Selects a venue from a dropdown or list
- [ ] A weekly grid appears showing:
  - Days of week (Mon–Fri) as columns
  - Time slots (e.g., 08:00, 09:00, 10:00, etc.) as rows
  - Each cell shows the course assigned (if any), e.g., "CSC 211 (Lecturer Name)" in green (occupied), or empty/light gray (available)
  - Cell background color indicates occupied (dark) vs. available (light)

- [ ] Timetable Officer can see at a glance which slots are free
- [ ] Clicking on an occupied cell shows course details (code, title, lecturer, departments)
- [ ] If the venue has multiple courses in overlapping times (conflict), the cell shows a red highlight with conflict indicator
- [ ] User can filter by semester (1st Semester, 2nd Semester)
- [ ] User can print the schedule or export as PDF

**API Endpoint:** `GET /api/v1/venues/[venueId]/schedule?semester=[semester]`

---

### 4.4 Time Slot Management

#### User Story 4.1: Admin Defines Available Time Slots for the Semester

**As an** Admin  
**I want to** define the available time slots for the semester  
**So that** the Timetable Officer can assign courses to specific times

**Acceptance Criteria:**

- [ ] Admin navigates to Time Slot Management → Define Time Slots
- [ ] Interface shows a form or grid to add multiple time slots
- [ ] For each time slot, Admin specifies:
  - Start Time (picker or text, e.g., "08:00")
  - End Time (picker or text, e.g., "09:00")
  - Duration (auto-calculated, e.g., "1 hour")
  - Days Available (multi-select: Mon, Tue, Wed, Thu, Fri)
  - Applicable Semesters (multi-select: 1st, 2nd, Full Year)

- [ ] Admin can add multiple time slots in bulk (e.g., 08:00-09:00, 09:00-10:00, ..., 17:00-18:00)
- [ ] System validates:
  - Start time < End time
  - Duration is positive
  - At least one day selected
  - At least one semester selected

- [ ] If valid, time slots are saved
- [ ] Success message: "[N] time slots added successfully"
- [ ] Time slots appear in a list view for verification
- [ ] Admin can edit or delete time slots if needed
- [ ] Audit log records: [timestamp, Admin ID, "Time Slots Created/Updated", slot details]

**API Endpoint:** `POST /api/v1/time-slots/batch`

**Request Body:**
```json
{
  "timeSlots": [
    {
      "startTime": "08:00",
      "endTime": "09:00",
      "duration": 1,
      "daysAvailable": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "applicableSemesters": ["1st Semester", "2nd Semester"]
    },
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "duration": 1,
      "daysAvailable": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "applicableSemesters": ["1st Semester", "2nd Semester"]
    }
  ]
}
```

---

### 4.5 Course-to-Lecturer Assignment

#### User Story 5.1: HOD Assigns a Course to a Lecturer

**As the** Head of Department  
**I want to** assign a course (e.g., CSC 211) to a lecturer (e.g., Dr. Smith)  
**So that** the lecturer is responsible for teaching that course

**Acceptance Criteria:**

- [ ] HOD navigates to Course Allocation → Assign Course to Lecturer
- [ ] Form appears with dropdowns/selectors:
  - Course (searchable dropdown with all active courses)
  - Lecturer (searchable dropdown with all active lecturers in Computer Science dept)
  - Semester (1st Semester, 2nd Semester, Full Year)

- [ ] HOD selects course "CSC 211", lecturer "Dr. James Smith", semester "1st Semester"
- [ ] HOD clicks "Assign"
- [ ] System validates:
  - Course exists and is active
  - Lecturer exists and is active
  - No duplicate assignment (same course + lecturer + semester)
  - Lecturer's department matches course's affiliated department(s)

- [ ] If validation fails, error message displays specific issue
- [ ] If validation passes:
  - Assignment is created
  - Success message: "CSC 211 assigned to Dr. James Smith for 1st Semester"
  - Assignment appears in "Course Allocations" list

- [ ] Audit log records: [timestamp, HOD ID, "Course Assigned", course + lecturer details]
- [ ] API returns: `{ success: true, assignment: { id, courseId, lecturerId, semester, createdAt } }`

**API Endpoint:** `POST /api/v1/assignments/course-to-lecturer`

---

#### User Story 5.2: HOD Views All Course Allocations and Filters by Semester

**As the** Head of Department  
**I want to** view all course-to-lecturer assignments and filter by semester  
**So that** I can oversee teaching allocations

**Acceptance Criteria:**

- [ ] HOD navigates to Course Allocation → View All Allocations
- [ ] Table displays with columns: Course Code, Course Title, Assigned Lecturer, Semester, Actions
- [ ] Filter by Semester dropdown: 1st Semester, 2nd Semester, Full Year, All Semesters
- [ ] HOD selects semester; table updates to show only allocations for that semester
- [ ] Search box filters by course code, course title, or lecturer name
- [ ] Each row has action buttons: View Details, Edit (change lecturer), Delete
- [ ] Results show count: "Showing [X] allocations"
- [ ] Table is sortable by course code, lecturer name, semester
- [ ] Pagination available (10 per page)

**API Endpoint:** `GET /api/v1/assignments/course-to-lecturer?semester=[semester]&search=[term]&page=[n]`

---

#### User Story 5.3: HOD Detects Lecturer Workload (Over-Assignment Warning)

**As the** Head of Department  
**I want to** be warned if I assign too many courses to a single lecturer  
**So that** I can maintain balanced workload distribution

**Acceptance Criteria:**

- [ ] System defines a maximum course load: 4 courses per lecturer per semester
- [ ] When HOD attempts to assign a 5th course to a lecturer in a semester:
  - System displays warning: "[Lecturer Name] is already assigned [4] courses in [Semester]. Assigning this course will exceed the recommended workload."
  - A checkbox appears: "I acknowledge this exceeds the workload recommendation. Proceed anyway?"

- [ ] HOD can check the box to proceed, or cancel
- [ ] If HOD proceeds, assignment is created with a flag: `workloadOverride: true`
- [ ] Audit log records the override: [timestamp, HOD ID, "Course Assigned (Override)", details, reason]
- [ ] HOD can view a Workload Report showing:
  - Each lecturer's name
  - Number of courses assigned (color-coded: green ≤4, yellow 5, red ≥6)
  - Total credit units taught
  - Recommendations for rebalancing

**API Response (on assignment with warning):**
```json
{
  "success": false,
  "code": "WORKLOAD_EXCEEDED",
  "message": "Dr. James Smith is already assigned 4 courses. Proceed?",
  "currentWorkload": 4,
  "lecturerId": "...",
  "lecturerName": "Dr. James Smith"
}
```

---

### 4.6 Course-to-Venue-Time Assignment & Scheduling

#### User Story 6.1: Timetable Officer Assigns a Course to a Venue and Time Slot

**As the** Timetable Officer  
**I want to** assign a course to a specific venue and time slot  
**So that** the course has a confirmed location and time in the semester schedule

**Acceptance Criteria:**

- [ ] Timetable Officer navigates to Schedule Planning → Assign Course to Venue/Time
- [ ] System displays:
  - Left panel: List of unassigned courses (not yet assigned a venue/time; lecturer assignment optional — courses can be scheduled with or without a lecturer)
  - Center: Available venues (searchable/filterable)
  - Right panel: Available time slots (searchable/filterable by day and time)
  - Bottom: Summary of already-scheduled courses

- [ ] Timetable Officer:
  1. Searches and selects a course, e.g., "CSC 211 (Dr. James Smith)"
  2. Selects a venue, e.g., "CSC Lecture Hall A"
  3. Selects a time slot, e.g., "Monday 08:00–09:00"
  4. Clicks "Confirm Assignment"

- [ ] System immediately performs conflict checking:
  - Is the venue already occupied Monday 08:00–09:00? YES → Conflict!
  - Is Dr. James Smith teaching another course Monday 08:00–09:00? NO
  - System detects venue conflict and displays: "Conflict detected! CSC Lecture Hall A is already assigned to [Course X] on Monday 08:00–09:00."
  - Options: "Choose Different Time Slot" or "Request Override (requires HOD approval)"

- [ ] Timetable Officer selects a different time slot, e.g., "Monday 09:00–10:00"
- [ ] System re-checks conflicts (all clear)
- [ ] Assignment is created
- [ ] Success message: "CSC 211 assigned to CSC Lecture Hall A, Monday 09:00–10:00"
- [ ] Course moves from "Unassigned" to "Scheduled" list
- [ ] Audit log records: [timestamp, Timetable Officer ID, "Schedule Assignment Created", details]

**API Endpoint:** `POST /api/v1/assignments/course-to-venue-time`

**Request Body:**
```json
{
  "courseId": "6123abc456def789ghi012jk",
  "venueId": "7234bcd567efg890hij123kl",
  "timeSlotId": "8345cde678fgh901ijk234lm",
  "dayOfWeek": "Monday"
}
```

---

#### User Story 6.2: Timetable Officer Detects and Resolves Schedule Conflicts

**As the** Timetable Officer  
**I want to** see real-time conflict warnings when assigning courses  
**So that** I can avoid double-booking venues or lecturers

**Acceptance Criteria:**

- [ ] Conflicts checked include:
  1. **Venue Conflict:** Same venue assigned to two courses at overlapping times
  2. **Lecturer Conflict:** Same lecturer teaching two courses at overlapping times
  3. **Level Conflict:** Same course level assigned to the same venue at overlapping times (optional)

- [ ] When a conflict is detected:
  - Assignment is NOT automatically created
  - Conflict details are displayed clearly: "[Conflict Type] - [Venue/Lecturer Name] is already assigned to [Course X] at [Time]"
  - Two options appear:
    a. "Choose Different Time/Venue" (takes user back to assignment form)
    b. "Request Override" (requires HOD approval; logs the request)

- [ ] If Timetable Officer clicks "Request Override":
  - Reason field appears (optional text)
  - System sends notification to HOD: "Schedule override requested for [Course Y] at [Venue/Time]"
  - HOD receives email and in-app notification

- [ ] HOD can approve or reject override:
  - Approval: Conflict is logged, assignment is created anyway
  - Rejection: Conflict remains; Timetable Officer must find different slot

- [ ] Audit log records all conflict detections and override requests:
  - [timestamp, Timetable Officer ID, "Conflict Detected", conflict details, resolution]
  - [timestamp, HOD ID, "Override Approved/Rejected", override details]

**API Endpoint:** `POST /api/v1/assignments/check-conflict`

**Request Body:**
```json
{
  "courseId": "6123abc456def789ghi012jk",
  "lecturerId": "...",
  "venueId": "7234bcd567efg890hij123kl",
  "timeSlotId": "8345cde678fgh901ijk234lm",
  "dayOfWeek": "Monday"
}
```

**Response (conflict detected):**
```json
{
  "hasConflict": true,
  "conflicts": [
    {
      "type": "VENUE_CONFLICT",
      "conflictingCourse": "CSC 210",
      "conflictingLecturer": "Dr. Jane Doe",
      "venue": "CSC Lecture Hall A",
      "timeSlot": "Monday 08:00–09:00",
      "message": "Venue CSC Lecture Hall A is already assigned to CSC 210 at this time."
    }
  ]
}
```

---

#### User Story 6.3: Timetable Officer Views Complete Semester Schedule in Multiple Formats

**As the** Timetable Officer  
**I want to** view the complete semester schedule in different formats (tabular, venue-centric, time-centric)  
**So that** I can verify all courses are scheduled and identify any gaps

**Acceptance Criteria:**

- [ ] Timetable Officer navigates to Schedule Planning → View Schedule
- [ ] Three view options available via tabs:

  **Tab 1: Tabular View**
  - Table with columns: Course Code, Course Title, Lecturer, Venue, Day, Time
  - All scheduled courses listed
  - Sortable by any column
  - Filterable by semester
  - Export to PDF/Excel available

  **Tab 2: Venue-Centric View**
  - Dropdown to select a venue
  - Weekly grid shows courses assigned to that venue
  - Days (Mon–Fri) as columns, time slots as rows
  - Each cell shows course code and lecturer
  - Color-coded by department or level

  **Tab 3: Time-Centric View**
  - Dropdown to select a time slot (e.g., Monday 08:00–09:00)
  - Shows all courses assigned to that time across all venues
  - Helps identify whether time slots are over- or under-utilized

  **Tab 4: Unscheduled Courses Report**
  - Lists all courses allocated to lecturers but NOT yet assigned venue/time
  - Helps Timetable Officer identify remaining work

- [ ] All views support semester filter
- [ ] Export functionality (PDF, CSV, Excel) available from each view
- [ ] Printing is print-friendly (landscape orientation for weekly grids)

**API Endpoints:**
- `GET /api/v1/assignments/schedule?semester=[semester]&view=tabular`
- `GET /api/v1/assignments/schedule?semester=[semester]&view=venue&venueId=[id]`
- `GET /api/v1/assignments/schedule?semester=[semester]&view=time&timeSlotId=[id]`
- `GET /api/v1/assignments/unscheduled?semester=[semester]`

---

### 4.7 Lecturer Dashboard

#### User Story 7.1: Lecturer Views Personal Schedule (Tabular View)

**As a** Lecturer  
**I want to** view my personal teaching schedule in a table  
**So that** I know when and where I'm teaching each course

**Acceptance Criteria:**

- [ ] Lecturer logs in and navigates to "My Schedule" or sees it on the dashboard home
- [ ] Table displays with columns:
  - Course Code (e.g., CSC 211)
  - Course Title (e.g., Object-Oriented Programming)
  - Venue (e.g., CSC Lecture Hall A)
  - Day of Week (e.g., Monday)
  - Time (e.g., 08:00 AM – 09:00 AM)
  - Enrolled Departments (e.g., Computer Science – 2nd Year)

- [ ] Lecturer can filter by semester (1st Semester, 2nd Semester)
- [ ] Table shows only courses assigned to the logged-in lecturer
- [ ] Rows are sorted by day of week and start time (chronological)
- [ ] If a lecture is taught multiple times (e.g., Monday and Wednesday), each occurrence is a separate row
- [ ] Clicking on a course row shows full course details in a modal/drawer:
  - Course code, title, credit units
  - Venue capacity and equipment
  - Enrolled students (if available)
  - List of co-instructors (if any)

- [ ] Schedule is responsive and readable on mobile devices
- [ ] If no courses assigned, message: "No courses assigned for [Semester]. Please contact your HOD."

**API Endpoint:** `GET /api/v1/lecturers/[lecturerId]/schedule?semester=[semester]`

**Response:**
```json
{
  "success": true,
  "lecturerId": "...",
  "lecturerName": "Dr. James Smith",
  "semester": "1st Semester",
  "schedule": [
    {
      "assignmentId": "9456def789ghi012jk123lm",
      "courseCode": "CSC 211",
      "courseTitle": "Object-Oriented Programming",
      "creditUnits": 3,
      "venue": "CSC Lecture Hall A",
      "capacity": 150,
      "dayOfWeek": "Monday",
      "startTime": "08:00",
      "endTime": "09:00",
      "enrolledDepartments": ["Computer Science – 2nd Year"]
    },
    {
      "assignmentId": "...",
      "courseCode": "CSC 211",
      "courseTitle": "Object-Oriented Programming",
      "creditUnits": 3,
      "venue": "CSC Lecture Hall B",
      "capacity": 120,
      "dayOfWeek": "Wednesday",
      "startTime": "08:00",
      "endTime": "09:00",
      "enrolledDepartments": ["Computer Science – 2nd Year"]
    }
  ]
}
```

---

#### User Story 7.2: Lecturer Views Personal Schedule (Calendar View)

**As a** Lecturer  
**I want to** see my teaching schedule on a calendar (weekly or monthly view)  
**So that** I can visually plan my week and avoid conflicts with other commitments

**Acceptance Criteria:**

- [ ] Lecturer navigates to "My Schedule" → "Calendar View"
- [ ] Two view options: Weekly or Monthly (toggle buttons)

  **Weekly View:**
  - Shows current week (Mon–Fri) by default
  - Each day is a column; time slots (08:00 onwards) are rows
  - Each assigned course is a colored block/event
  - Event shows: Course Code + Venue (e.g., "CSC 211 @ Hall A")
  - Color-coded by department or level for visual distinction
  - Lecturer can navigate to previous/next weeks
  - Time slots with no courses appear empty

  **Monthly View:**
  - Shows current month
  - Each day is a cell
  - Days with assigned courses show a small indicator (dot, badge with course count)
  - Clicking a day shows courses for that day
  - Lecturer can navigate to previous/next months

- [ ] Clicking on a course event shows full details in a popup/modal
- [ ] Semester filter available (1st Semester, 2nd Semester)
- [ ] Download options: "Download as iCal" (for import into Outlook/Google Calendar), "Download as PDF"
- [ ] Responsive and mobile-friendly layout

**API Endpoint:** `GET /api/v1/lecturers/[lecturerId]/schedule?semester=[semester]&format=calendar`

---

#### User Story 7.3: Lecturer Downloads Personal Schedule

**As a** Lecturer  
**I want to** download my schedule as PDF or CSV  
**So that** I can print it, share it, or import it into my calendar application

**Acceptance Criteria:**

- [ ] Lecturer views their schedule (tabular or calendar view)
- [ ] "Download" button is visible (top-right corner)
- [ ] Clicking "Download" shows options:
  - "PDF (Printer-Friendly)"
  - "CSV (Spreadsheet)"
  - "iCal (Calendar Import)"

- [ ] PDF Download:
  - Single-page or multi-page depending on schedule size
  - Header: Semester, Lecturer Name, Download Date
  - Table or calendar format (based on current view)
  - Print-friendly (minimal colors, clear fonts)
  - Filename: "[LastName]_Schedule_[Semester]_[Date].pdf"

- [ ] CSV Download:
  - Headers: Course Code, Course Title, Venue, Day, Time, Enrolled Departments
  - One row per course instance
  - Filename: "[LastName]_Schedule_[Semester]_[Date].csv"

- [ ] iCal Download:
  - Standard iCalendar format (.ics file)
  - Each course is an event with:
    - Title: "[Course Code] – [Course Title]"
    - Location: [Venue]
    - Time: [Recurring weekly events for all instances]
  - Filename: "[LastName]_Schedule_[Semester]_[Date].ics"

- [ ] Download completes without errors
- [ ] Files are downloadable immediately (no email delay)

**API Endpoints:**
- `GET /api/v1/lecturers/[lecturerId]/schedule/download?format=pdf&semester=[semester]`
- `GET /api/v1/lecturers/[lecturerId]/schedule/download?format=csv&semester=[semester]`
- `GET /api/v1/lecturers/[lecturerId]/schedule/download?format=ical&semester=[semester]`

---

### 4.8 Administrative Functions

#### User Story 8.1: Admin Views System Health Dashboard

**As an** Admin  
**I want to** see a dashboard with system health metrics and alerts  
**So that** I can monitor the system's performance and address issues proactively

**Acceptance Criteria:**

- [ ] Admin navigates to Dashboard → System Health
- [ ] Dashboard displays:

  **Overview Metrics (top cards):**
  - Total Registered Users (count, color-coded by role)
  - Total Courses (count)
  - Total Venues (count)
  - Scheduled Courses (count)
  - Unscheduled Courses (count)
  - System Uptime (% in last 7 days)

  **Performance Metrics (charts/graphs):**
  - API Response Time (average, p95, p99 — line chart showing trend over last 24 hours)
  - Error Rate (% errors in API calls — line chart)
  - Database Query Performance (slow query count, average query time)
  - User Activity (login count per hour, pie chart by role)

  **System Status (status indicators):**
  - Database: Green (Connected) | Red (Disconnected)
  - API Server: Green (Healthy) | Yellow (Degraded) | Red (Down)
  - Email Service: Green (Working) | Yellow (Delayed) | Red (Failure)
  - Backup Service: Green (Recent) | Yellow (Overdue) | Red (Failed)

  **Alerts Section:**
  - Red banner if response time > 2 seconds
  - Red banner if error rate > 1%
  - Yellow banner if backup hasn't run in 24 hours
  - Any critical errors from error logs

- [ ] Clicking on a metric drills down to detailed data
- [ ] Timeframe selector (Last 24 hours, Last 7 days, Last 30 days)
- [ ] Admin can export a health report as PDF

**API Endpoint:** `GET /api/v1/admin/system-health?timeframe=24h`

---

#### User Story 8.2: Admin Views Audit Log

**As an** Admin  
**I want to** view an audit log of all system activities (create, update, delete, login, etc.)  
**So that** I can track changes and diagnose issues

**Acceptance Criteria:**

- [ ] Admin navigates to Admin Panel → Audit Log
- [ ] Table displays with columns:
  - Timestamp (sortable)
  - User ID / Email (who performed the action)
  - Role (of the user who performed the action)
  - Action Type (Create, Read, Update, Delete, Login, Logout, etc.)
  - Entity Type (User, Course, Venue, Assignment, etc.)
  - Entity ID / Details (what was affected)
  - IP Address (where the request came from, if logged)

- [ ] Filter options:
  - By User (search by name or email)
  - By Action Type (multi-select checkboxes)
  - By Entity Type (multi-select checkboxes)
  - By Date Range (calendar picker)
  - By Role (dropdown)

- [ ] Results are paginated (50 per page)
- [ ] Sorting available on: Timestamp, User, Action, Entity
- [ ] Clicking a log entry shows full details in a modal
- [ ] Export to CSV available

- [ ] Audit log retention: Minimum 1 year (configurable)

**API Endpoint:** `GET /api/v1/admin/audit-log?user=[userId]&actionType=[type]&entityType=[type]&startDate=[date]&endDate=[date]&page=[n]`

---

### 4.9 Reporting

#### User Story 9.1: Generate Semester Schedule Report

**As the** Timetable Officer  
**I want to** generate a comprehensive report of the entire semester's schedule  
**So that** I can verify completeness and share with stakeholders

**Acceptance Criteria:**

- [ ] User navigates to Reports → Semester Schedule
- [ ] Form appears:
  - Semester selector (1st Semester, 2nd Semester, Full Year)
  - Format selector (PDF, Excel, CSV)
  - Optional filters: Courses by level, venue, day

- [ ] User clicks "Generate Report"
- [ ] System compiles:
  - All courses scheduled for selected semester
  - For each: Course Code, Title, Level, Lecturer(s), Venue, Day, Time, Enrolled Departments

  **Report Layout:**
  - Header: Department Name, Semester, Generated Date
  - Grouped by: Day of Week (or by Venue, or by Time Slot — user selects)
  - Summary stats: Total courses, total venues used, capacity utilization %, unscheduled courses

  **PDF Format:**
  - Professional formatting, FUT Minna logo (if available)
  - Page numbers and date footer
  - Table with clear borders and alternating row colors
  - Print-friendly

  **Excel Format:**
  - Multiple sheets:
    - Sheet 1: Complete schedule (tabular)
    - Sheet 2: Summary statistics
    - Sheet 3: Venue utilization

  **CSV Format:**
  - Headers: Course Code, Course Title, Level, Lecturer, Venue, Day, Time, Departments
  - One row per course instance

- [ ] Report is generated within 3 seconds (non-blocking)
- [ ] Filename: "FUT_Minna_Schedule_[Semester]_[Date].[ext]"
- [ ] Report is downloadable immediately or emailed to user

**API Endpoint:** `POST /api/v1/reports/semester-schedule`

**Request Body:**
```json
{
  "semester": "1st Semester",
  "format": "pdf",
  "filters": {
    "level": [200, 300],
    "venue": null,
    "day": null
  }
}
```

---

## 5. API SPECIFICATIONS

### 5.1 Base URL & Authentication

**Base URL:** `https://api.fut-minna.edu.ng/v1`

**Authentication Header:**
```
Authorization: Bearer [JWT_TOKEN]
```

**JWT Structure:**
```json
{
  "sub": "[userId]",
  "email": "[email]",
  "role": "[role]",
  "iat": [issuedAt],
  "exp": [expiration]
}
```

---

### 5.2 User Management Endpoints

#### POST /auth/register
**Description:** Register a new user (Admin only)

**Request:**
```json
{
  "fullName": "Dr. Jane Doe",
  "email": "jane.doe@fut-minna.edu.ng",
  "role": "Lecturer",
  "department": "Computer Science"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "user": {
    "id": "...",
    "fullName": "Dr. Jane Doe",
    "email": "jane.doe@fut-minna.edu.ng",
    "role": "Lecturer",
    "status": "Active",
    "createdAt": "2026-06-09T10:30:00Z"
  },
  "temporaryPassword": "[temp-password]"
}
```

**Errors:**
- `400 Bad Request` - Invalid email or duplicate email
- `403 Forbidden` - User does not have Admin role
- `500 Internal Server Error` - Database error

---

#### POST /auth/login
**Description:** Log in and receive JWT

**Request:**
```json
{
  "email": "jane.doe@fut-minna.edu.ng",
  "password": "password123",
  "rememberMe": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "[JWT_TOKEN]",
  "user": {
    "id": "...",
    "email": "jane.doe@fut-minna.edu.ng",
    "fullName": "Dr. Jane Doe",
    "role": "Lecturer"
  },
  "expiresIn": 2592000
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account is deactivated
- `500 Internal Server Error` - Database error

---

#### POST /auth/forgot-password
**Description:** Request password reset token

**Request:**
```json
{
  "email": "jane.doe@fut-minna.edu.ng"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email."
}
```

**Errors:**
- `404 Not Found` - Email not registered
- `429 Too Many Requests` - Too many reset requests
- `500 Internal Server Error` - Email sending failed

---

#### POST /auth/reset-password
**Description:** Reset password using token

**Request:**
```json
{
  "token": "[reset-token-from-email]",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login."
}
```

**Errors:**
- `400 Bad Request` - Token expired, passwords don't match, weak password
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Database error

---

#### GET /users
**Description:** Get all users (paginated, with filters) — Admin only

**Query Parameters:**
- `page=1` (default)
- `limit=10` (default)
- `role=Lecturer` (optional)
- `search=doe` (optional, searches name and email)
- `status=Active` (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "users": [
    {
      "id": "...",
      "fullName": "Dr. Jane Doe",
      "email": "jane.doe@fut-minna.edu.ng",
      "role": "Lecturer",
      "status": "Active",
      "createdAt": "2026-06-09T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

---

#### PATCH /users/[userId]/deactivate
**Description:** Deactivate a user account — Admin only

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User [name] has been deactivated."
}
```

---

### 5.3 Course Endpoints

#### POST /courses
**Description:** Create a new course — Exam Officer only

**Request:**
```json
{
  "code": "CSC 211",
  "title": "Object-Oriented Programming",
  "creditUnits": 3,
  "level": 200,
  "departments": ["Computer Science"],
  "semester": "1st Semester",
  "description": "..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "course": {
    "id": "...",
    "code": "CSC 211",
    "title": "Object-Oriented Programming",
    "creditUnits": 3,
    "level": 200,
    "departments": ["Computer Science"],
    "semester": "1st Semester",
    "createdAt": "2026-06-09T10:30:00Z"
  }
}
```

---

#### GET /courses
**Description:** Get all courses with filters

**Query Parameters:**
- `level=200` (optional)
- `semester=1st Semester` (optional)
- `department=Computer Science` (optional)
- `search=Programming` (optional)
- `page=1`, `limit=15` (pagination)

**Response:** `200 OK`
```json
{
  "success": true,
  "courses": [/* array of course objects */],
  "pagination": { "page": 1, "limit": 15, "total": 87 }
}
```

---

#### PUT /courses/[courseId]
**Description:** Update a course — Exam Officer only

**Response:** `200 OK`
```json
{
  "success": true,
  "course": { /* updated course */ }
}
```

---

#### DELETE /courses/[courseId]
**Description:** Delete a course — Exam Officer or Admin

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Course [code] deleted successfully."
}
```

---

### 5.4 Venue Endpoints

#### POST /venues
**Description:** Create a new venue — Admin only

**Request:**
```json
{
  "name": "CSC Lecture Hall A",
  "building": "Computer Science Building",
  "capacity": 150,
  "type": "Lecture Hall",
  "equipment": ["Projector", "Whiteboard", "WiFi"]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "venue": {
    "id": "...",
    "name": "CSC Lecture Hall A",
    "building": "Computer Science Building",
    "capacity": 150,
    "type": "Lecture Hall",
    "equipment": ["Projector", "Whiteboard", "WiFi"],
    "createdAt": "2026-06-09T10:30:00Z"
  }
}
```

---

#### GET /venues/[venueId]/schedule
**Description:** Get weekly schedule for a venue

**Query Parameters:**
- `semester=1st Semester` (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "venue": { /* venue details */ },
  "schedule": [
    {
      "dayOfWeek": "Monday",
      "timeSlot": "08:00-09:00",
      "course": {
        "code": "CSC 211",
        "title": "Object-Oriented Programming",
        "lecturer": "Dr. James Smith"
      }
    }
  ]
}
```

---

### 5.5 Time Slot Endpoints

#### POST /time-slots/batch
**Description:** Create multiple time slots — Admin only

**Request:**
```json
{
  "timeSlots": [
    {
      "startTime": "08:00",
      "endTime": "09:00",
      "duration": 1,
      "daysAvailable": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "applicableSemesters": ["1st Semester", "2nd Semester"]
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "created": 1,
  "timeSlots": [/* array of created time slots */]
}
```

---

### 5.6 Assignment Endpoints (Course to Lecturer)

#### POST /assignments/course-to-lecturer
**Description:** Assign a course to a lecturer — HOD only

**Request:**
```json
{
  "courseId": "...",
  "lecturerId": "...",
  "semester": "1st Semester"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "assignment": {
    "id": "...",
    "courseId": "...",
    "lecturerId": "...",
    "semester": "1st Semester",
    "createdAt": "2026-06-09T10:30:00Z"
  }
}
```

**Errors:**
- `409 Conflict` - Duplicate assignment or workload exceeded
- `400 Bad Request` - Invalid course or lecturer
- `403 Forbidden` - User is not HOD

---

#### GET /assignments/course-to-lecturer
**Description:** Get all course-to-lecturer assignments — HOD and higher

**Query Parameters:**
- `semester=1st Semester` (optional)
- `search=CSC` (optional)
- `page=1`, `limit=10` (pagination)

**Response:** `200 OK`
```json
{
  "success": true,
  "assignments": [
    {
      "id": "...",
      "courseCode": "CSC 211",
      "courseTitle": "Object-Oriented Programming",
      "lecturerName": "Dr. James Smith",
      "semester": "1st Semester",
      "createdAt": "2026-06-09T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 45 }
}
```

---

### 5.7 Assignment Endpoints (Course to Venue-Time)

#### POST /assignments/course-to-venue-time
**Description:** Assign a course to a venue and time slot — Timetable Officer only

**Request:**
```json
{
  "courseId": "...",
  "venueId": "...",
  "timeSlotId": "...",
  "dayOfWeek": "Monday"
}
```

**Response:** `201 Created` (or Conflict Response)
```json
{
  "success": true,
  "assignment": {
    "id": "...",
    "courseCode": "CSC 211",
    "courseTitle": "Object-Oriented Programming",
    "venue": "CSC Lecture Hall A",
    "dayOfWeek": "Monday",
    "timeSlot": "08:00-09:00",
    "createdAt": "2026-06-09T10:30:00Z"
  }
}
```

**Conflict Response:** `409 Conflict`
```json
{
  "success": false,
  "code": "SCHEDULE_CONFLICT",
  "message": "Cannot assign: scheduling conflict detected.",
  "conflicts": [
    {
      "type": "VENUE_CONFLICT",
      "conflictingCourse": "CSC 210",
      "message": "Venue is already assigned to CSC 210 on Monday 08:00–09:00."
    }
  ]
}
```

---

#### POST /assignments/check-conflict
**Description:** Pre-check for conflicts before assignment

**Request:**
```json
{
  "courseId": "...",
  "lecturerId": "...",
  "venueId": "...",
  "timeSlotId": "...",
  "dayOfWeek": "Monday"
}
```

**Response:** `200 OK`
```json
{
  "hasConflict": false,
  "conflicts": []
}
```

or

```json
{
  "hasConflict": true,
  "conflicts": [
    {
      "type": "VENUE_CONFLICT",
      "conflictingCourse": "CSC 210",
      "conflictingLecturer": "Dr. Jane Doe",
      "message": "..."
    }
  ]
}
```

---

### 5.8 Lecturer Schedule Endpoints

#### GET /lecturers/[lecturerId]/schedule
**Description:** Get lecturer's personal schedule

**Query Parameters:**
- `semester=1st Semester` (optional)
- `format=tabular|calendar` (optional, default: tabular)

**Response:** `200 OK`
```json
{
  "success": true,
  "lecturerId": "...",
  "lecturerName": "Dr. James Smith",
  "semester": "1st Semester",
  "schedule": [
    {
      "assignmentId": "...",
      "courseCode": "CSC 211",
      "courseTitle": "Object-Oriented Programming",
      "creditUnits": 3,
      "venue": "CSC Lecture Hall A",
      "capacity": 150,
      "dayOfWeek": "Monday",
      "startTime": "08:00",
      "endTime": "09:00",
      "enrolledDepartments": ["Computer Science – 2nd Year"]
    }
  ]
}
```

---

#### GET /lecturers/[lecturerId]/schedule/download
**Description:** Download lecturer's schedule in various formats

**Query Parameters:**
- `format=pdf|csv|ical` (required)
- `semester=1st Semester` (optional)

**Response:** `200 OK` (file download)
- Content-Type: `application/pdf` | `text/csv` | `text/calendar`
- Content-Disposition: `attachment; filename="..."`

---

### 5.9 Admin Dashboard Endpoints

#### GET /admin/system-health
**Description:** Get system health metrics — Admin only

**Query Parameters:**
- `timeframe=24h|7d|30d` (optional, default: 24h)

**Response:** `200 OK`
```json
{
  "success": true,
  "metrics": {
    "uptime": 99.8,
    "apiResponseTime": {
      "average": 120,
      "p95": 450,
      "p99": 850
    },
    "errorRate": 0.3,
    "activeUsers": 45,
    "databaseSize": "2.3 GB",
    "lastBackup": "2026-06-09T02:00:00Z"
  },
  "alerts": []
}
```

---

#### GET /admin/audit-log
**Description:** Get audit log entries — Admin only

**Query Parameters:**
- `user=[userId]` (optional)
- `actionType=Create|Update|Delete|Login` (optional)
- `entityType=User|Course|Venue|Assignment` (optional)
- `startDate=2026-06-01` (optional)
- `endDate=2026-06-30` (optional)
- `page=1`, `limit=50` (pagination)

**Response:** `200 OK`
```json
{
  "success": true,
  "logs": [
    {
      "id": "...",
      "timestamp": "2026-06-09T10:30:00Z",
      "userId": "...",
      "userEmail": "jane.doe@...",
      "userRole": "Exam Officer",
      "actionType": "Create",
      "entityType": "Course",
      "entityId": "...",
      "details": { /* action-specific details */ },
      "ipAddress": "192.168.1.100"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 1234 }
}
```

---

### 5.10 Reporting Endpoints

#### POST /reports/semester-schedule
**Description:** Generate semester schedule report

**Request:**
```json
{
  "semester": "1st Semester",
  "format": "pdf",
  "filters": {
    "level": [200, 300],
    "venue": null,
    "day": null
  }
}
```

**Response:** `200 OK` (file download)
- Content-Type: `application/pdf` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `text/csv`
- Content-Disposition: `attachment; filename="FUT_Minna_Schedule_[Semester]_[Date].[ext]"`

---

## 6. DATA MODEL & ENTITY-RELATIONSHIP DIAGRAM

### 6.1 Core Entities

#### User
```
{
  _id: ObjectId (Primary Key)
  fullName: String (required, indexed)
  email: String (required, unique, indexed)
  passwordHash: String (bcrypt-hashed, required)
  role: Enum ['Admin', 'HOD', 'Exam Officer', 'Timetable Officer', 'Lecturer'] (required)
  department: String (default: 'Computer Science')
  status: Enum ['Active', 'Inactive'] (default: 'Active')
  phone: String (optional)
  officeLocation: String (optional)
  profilePicture: URL (optional)
  createdAt: DateTime (server-generated)
  updatedAt: DateTime (server-generated)
  lastLogin: DateTime (optional)
  createdBy: ObjectId (references User._id, Admin who created this user)
}
```

**Indexes:**
- `email` (unique)
- `role` (for role-based queries)
- `status` (for active user queries)
- `createdAt` (for audit trails)

---

#### Course
```
{
  _id: ObjectId (Primary Key)
  code: String (required, unique, indexed, e.g., "CSC 211")
  title: String (required, indexed)
  creditUnits: Integer (required, 1-6)
  level: Integer (required, enum: [100, 200, 300, 400])
  departments: Array[String] (required, e.g., ["Computer Science"])
  semester: Enum ['1st Semester', '2nd Semester', 'Full Year'] (required, indexed)
  description: String (optional)
  isActive: Boolean (default: true)
  createdAt: DateTime (server-generated)
  updatedAt: DateTime (server-generated)
  createdBy: ObjectId (references User._id, Exam Officer who created)
}
```

**Indexes:**
- `code` + `semester` (composite, unique)
- `level`
- `semester`
- `departments`

---

#### Venue
```
{
  _id: ObjectId (Primary Key)
  name: String (required, unique, indexed, e.g., "CSC Lecture Hall A")
  building: String (optional)
  capacity: Integer (required)
  type: Enum ['Lecture Hall', 'Laboratory', 'Seminar Room', 'Auditorium'] (required)
  equipment: Array[String] (optional, e.g., ["Projector", "Whiteboard", "WiFi"])
  isActive: Boolean (default: true)
  createdAt: DateTime (server-generated)
  updatedAt: DateTime (server-generated)
  createdBy: ObjectId (references User._id, Admin who created)
}
```

**Indexes:**
- `name` (unique)
- `type`
- `isActive`

---

#### TimeSlot
```
{
  _id: ObjectId (Primary Key)
  startTime: String (required, HH:MM format, e.g., "08:00")
  endTime: String (required, HH:MM format, e.g., "09:00")
  duration: Integer (required, in hours)
  daysAvailable: Array[String] (required, e.g., ["Monday", "Tuesday", ...])
  applicableSemesters: Array[String] (required, e.g., ["1st Semester", "2nd Semester"])
  isActive: Boolean (default: true)
  createdAt: DateTime (server-generated)
  updatedAt: DateTime (server-generated)
}
```

**Indexes:**
- `startTime` + `endTime` (composite)
- `applicableSemesters`

---

#### CourseToLecturerAssignment
```
{
  _id: ObjectId (Primary Key)
  courseId: ObjectId (required, references Course._id, indexed)
  lecturerId: ObjectId (required, references User._id, indexed)
  semester: Enum ['1st Semester', '2nd Semester', 'Full Year'] (required, indexed)
  workloadOverride: Boolean (default: false, indicates if exceeded max load)
  overrideReason: String (optional, if workloadOverride is true)
  overriddenBy: ObjectId (references User._id, HOD who approved override)
  createdAt: DateTime (server-generated)
  createdBy: ObjectId (references User._id, HOD who created)
  
  // Denormalized fields for performance (optional)
  courseCode: String
  courseTitle: String
  lecturerName: String
}
```

**Indexes:**
- `courseId` + `lecturerId` + `semester` (composite, unique)
- `lecturerId` + `semester` (for workload queries)
- `courseId` (for course assignments)

---

#### CourseToVenueTimeAssignment
```
{
  _id: ObjectId (Primary Key)
  courseId: ObjectId (required, references Course._id, indexed)
  courseToLecturerAssignmentId: ObjectId (required, references CourseToLecturerAssignment._id)
  venueId: ObjectId (required, references Venue._id, indexed)
  timeSlotId: ObjectId (required, references TimeSlot._id, indexed)
  dayOfWeek: Enum ['Monday', 'Tuesday', ...] (required)
  isScheduled: Boolean (default: true)
  conflictOverride: Boolean (default: false)
  conflictOverrideReason: String (optional)
  overriddenBy: ObjectId (references User._id, HOD who approved)
  createdAt: DateTime (server-generated)
  createdBy: ObjectId (references User._id, Timetable Officer)
  
  // Denormalized fields for performance
  courseCode: String
  courseTi: String
  lecturerId: ObjectId
  lecturerName: String
  venueName: String
  startTime: String
  endTime: String
}
```

**Indexes:**
- `courseId` + `venueId` + `timeSlotId` + `dayOfWeek` (composite, for conflict checking)
- `venueId` + `timeSlotId` + `dayOfWeek` (composite, for venue availability)
- `lecturerId` (from denormalized) + `timeSlotId` + `dayOfWeek` (for lecturer availability)
- `courseId` (for finding all instances of a course)
- `isScheduled` (for finding unscheduled courses)

---

#### AuditLog
```
{
  _id: ObjectId (Primary Key)
  timestamp: DateTime (server-generated, indexed)
  userId: ObjectId (required, references User._id, indexed)
  userEmail: String (indexed)
  userRole: String (indexed)
  actionType: Enum ['Create', 'Read', 'Update', 'Delete', 'Login', 'Logout', 'Download', ...] (indexed)
  entityType: Enum ['User', 'Course', 'Venue', 'TimeSlot', 'Assignment', ...] (indexed)
  entityId: ObjectId (optional, indexed)
  details: Object (action-specific details, e.g., { courseCode: "CSC 211", lecturerName: "Dr. Smith" })
  ipAddress: String (optional)
  userAgent: String (optional)
  statusCode: Integer (HTTP status, if applicable)
}
```

**Indexes:**
- `timestamp` (for time-range queries)
- `userId`
- `userRole`
- `actionType`
- `entityType`
- `entityId`
- Composite: `timestamp` + `actionType` + `entityType` (for efficient audit queries)

---

#### SystemBackup (optional, for backup tracking)
```
{
  _id: ObjectId (Primary Key)
  backupId: String (unique identifier)
  backupSize: Long (bytes)
  backupLocation: String (e.g., "S3://bucket/backup-2026-06-09-02-00.tar")
  createdAt: DateTime (server-generated)
  completedAt: DateTime (when backup finished)
  status: Enum ['In Progress', 'Completed', 'Failed'] (indexed)
  errorMessage: String (optional, if status is 'Failed')
  initiatedBy: Enum ['Automatic', 'Manual'] (indexed)
  initiatedByUserId: ObjectId (optional, if manual)
}
```

**Indexes:**
- `backupId` (unique)
- `createdAt`
- `status`

---

### 6.2 Relationships Summary

```
User
  ├─ 1:N → CourseToLecturerAssignment (as lecturer)
  ├─ 1:N → Course (created by Exam Officer)
  ├─ 1:N → Venue (created by Admin)
  ├─ 1:N → AuditLog (as user performing action)
  └─ 1:N → User (creator reference)

Course
  ├─ 1:N → CourseToLecturerAssignment
  └─ 1:N → CourseToVenueTimeAssignment

TimeSlot
  └─ 1:N → CourseToVenueTimeAssignment

Venue
  └─ 1:N → CourseToVenueTimeAssignment

CourseToLecturerAssignment
  ├─ N:1 → Course
  ├─ N:1 → User (lecturer)
  └─ 1:N → CourseToVenueTimeAssignment

CourseToVenueTimeAssignment
  ├─ N:1 → Course
  ├─ N:1 → Venue
  ├─ N:1 → TimeSlot
  └─ N:1 → CourseToLecturerAssignment
```

---

## 7. NON-FUNCTIONAL REQUIREMENTS

### 7.1 Performance

**FR-NF-001: Response Time**
- API response time shall not exceed **2 seconds** for 95% of requests under normal load
- Page load time (frontend) shall not exceed **3 seconds** on a standard internet connection
- Search and filter operations shall complete in < 500ms

**FR-NF-002: Throughput**
- System shall support concurrent login of 100+ users simultaneously
- System shall handle 10+ concurrent schedule assignment operations without degradation
- Database queries shall be optimized with appropriate indexing to maintain sub-200ms query times

**FR-NF-003: Scalability**
- System architecture shall support horizontal scaling (multiple API server instances)
- MongoDB replica sets shall enable automatic failover for data redundancy
- Load balancer shall distribute requests across multiple API instances

---

### 7.2 Security

**FR-NF-004: Authentication**
- All passwords shall be hashed using bcrypt with salt rounds = 10
- JWTs shall use HS256 or RS256 encryption
- JWT expiration: 12 hours (standard), 30 days (if "Remember Me" enabled)
- Session timeout: 24 hours maximum

**FR-NF-005: Authorization**
- Role-based access control (RBAC) shall be enforced at API endpoint level
- All data queries shall be filtered by user's role and permissions
- Lecturers shall only access their own schedule; no cross-lecturer visibility

**FR-NF-006: Data Protection**
- All API communications shall use HTTPS (TLS 1.3 or higher)
- Sensitive data (passwords, tokens) shall never be logged
- Database encryption at rest (MongoDB Enterprise or similar)
- Passwords in transit shall be encrypted; never sent in plain text

**FR-NF-007: Credential Security**
- Passwords must meet minimum requirements: 8+ characters, 1 uppercase, 1 lowercase, 1 number
- Password history: Users cannot reuse last 3 passwords
- Account lockout: After 5 failed login attempts, account locked for 15 minutes
- Admin override for account unlock available

**FR-NF-008: API Security**
- CORS (Cross-Origin Resource Sharing) shall be restricted to FUT Minna domain
- Rate limiting: 100 requests per minute per IP address (adjustable)
- Input validation and sanitization on all API endpoints
- SQL injection and NoSQL injection prevention (parameterized queries, input validation)

---

### 7.3 Usability

**FR-NF-009: User Interface**
- All interfaces shall be responsive and mobile-friendly (tested on iOS and Android)
- Accessibility compliance: WCAG 2.1 Level AA (screen readers, keyboard navigation, color contrast)
- Consistent UI/UX across all modules and roles
- Help tooltips and documentation available for complex operations

**FR-NF-010: Navigation & Discoverability**
- Primary navigation (sidebar or top menu) shall be visible and intuitive
- Breadcrumb navigation for multi-level workflows
- Search functionality available on all list views
- "Back" button and confirmation dialogs for destructive actions

**FR-NF-011: Form Design**
- All required fields clearly marked
- Real-time validation feedback (as user types)
- Clear error messages (not technical jargon)
- Auto-save or explicit save button with confirmation

---

### 7.4 Reliability & Availability

**FR-NF-012: Uptime**
- System availability target: 99.5% uptime per month
- Planned maintenance windows: Sunday 02:00–04:00 AM (announced 1 week in advance)
- Automatic failover for database and API servers within 5 minutes

**FR-NF-013: Error Handling**
- All errors shall return appropriate HTTP status codes (4xx for client errors, 5xx for server errors)
- User-friendly error messages displayed in UI (not raw stack traces)
- Error rate target: < 1% of all API requests
- Automatic error logging and alerting for critical errors

**FR-NF-014: Data Backup & Recovery**
- Automated daily backups at 02:00 AM
- Backup retention: Minimum 30 days; 6-month archive backups
- Recovery Time Objective (RTO): 1 hour (restore from backup)
- Recovery Point Objective (RPO): 24 hours (latest daily backup)
- Backup integrity testing: Weekly restoration dry-run tests

---

### 7.5 Maintainability

**FR-NF-015: Code Quality**
- Code shall follow MERN stack best practices and style guidelines
- All functions shall have JSDoc comments
- Test coverage: Minimum 70% (unit + integration tests)
- Linting tools: ESLint for JavaScript, MongoDB schema validation

**FR-NF-016: Documentation**
- API documentation: OpenAPI/Swagger spec (auto-generated)
- User guide: Step-by-step instructions for each role
- System architecture documentation: Diagrams and design decisions
- Troubleshooting guide for common issues

**FR-NF-017: Monitoring & Logging**
- Centralized logging (ELK stack or similar): All API requests, errors, audits
- Monitoring dashboard: CPU, memory, disk usage, API response times
- Alerting: Email/SMS alerts for critical issues (downtime, high error rate, etc.)
- Log retention: Minimum 1 year

---

### 7.6 Compliance & Privacy

**FR-NF-018: Data Privacy**
- GDPR-compliant data handling (if applicable)
- Users can request data export (GDPR right to portability)
- Users can request account deletion (anonymization of historical data)
- Privacy policy and terms of use displayed at login

**FR-NF-019: Audit & Compliance**
- All user actions logged in audit trail (as per FR-AD-003)
- Audit logs retained for minimum 1 year
- Data integrity: Database consistency checks on backup verification

---

## 8. GLOSSARY OF TERMS

| Term | Definition |
|------|-----------|
| **RBAC** | Role-Based Access Control — Security model restricting access based on user role |
| **JWT** | JSON Web Token — Cryptographic token for stateless authentication |
| **Bcrypt** | Password hashing algorithm using salt rounds to protect credentials |
| **MERN Stack** | MongoDB, Express.js, React.js, Node.js — Full-stack JavaScript framework |
| **API Endpoint** | URL path on the server exposing a specific function (e.g., `POST /api/v1/courses`) |
| **Conflict** | Schedule overlap (same venue/lecturer assigned to multiple courses at same time) |
| **Override** | Bypassing a system rule (e.g., workload limit, scheduling conflict) with approval |
| **Denormalization** | Storing redundant data in database for performance (vs. pure relational normalization) |
| **HTTP Status Code** | Numeric response code indicating request outcome (200, 201, 400, 403, 500, etc.) |
| **CORS** | Cross-Origin Resource Sharing — Browser security allowing/blocking requests from external domains |
| **Index** | Database structure optimizing query performance on specific fields |
| **iCal / .ics** | Standard calendar format (RFC 5545) for importing events into calendar applications |

---




**End of Software Requirements Document**