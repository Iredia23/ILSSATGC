# 🎓 FUT Minna Staff Dashboard — Final Year Project Documentation

## Integrated Lecture Scheduling System with Automated Timetable Generation Capabilities

**Project by:** Oseghale Caleb Iredia
**Institution:** Federal University of Technology, Minna — Department of Computer Science  
**Supervisor:** Mr B.I Alenoghena  
**Academic Session:** 2025/2026  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack & Why](#2-technology-stack--why)
3. [System Architecture](#3-system-architecture)
4. [Database Design & Data Models](#4-database-design--data-models)
5. [Backend API Implementation](#5-backend-api-implementation)
6. [Authentication & Authorization (RBAC)](#6-authentication--authorization-rbac)
7. [Frontend Architecture & User Interface](#7-frontend-architecture--user-interface)
8. [Module 1: User Management](#8-module-1-user-management)
9. [Module 2: Course Management](#9-module-2-course-management)
10. [Module 3: Venue Management](#10-module-3-venue-management)
11. [Module 4: Time Slot Management](#11-module-4-time-slot-management)
12. [Module 5: Course-to-Lecturer Allocation](#12-module-5-course-to-lecturer-allocation)
13. [Module 6: Schedule Planning (Timetable Generation)](#13-module-6-schedule-planning-timetable-generation)
14. [Module 7: Dashboard Modules](#14-module-7-dashboard-modules)
15. [Module 8: Reports & Analytics](#15-module-8-reports--analytics)
16. [Module 9: Conflict Detection System](#16-module-9-conflict-detection-system)
17. [Module 10: Real-Time Notifications](#17-module-10-real-time-notifications)
18. [Module 11: Audit Logging System](#18-module-11-audit-logging-system)
19. [Module 12: AI Integration — Google Gemini](#19-module-12-ai-integration--google-gemini)
20. [Security Implementation](#20-security-implementation)
21. [Environment Configuration](#21-environment-configuration)
22. [Complete API Reference](#22-complete-api-reference)
23. [Deployment](#23-deployment)
24. [How to Run the Application](#24-how-to-run-the-application)

---

## 1. Project Overview

### 1.1 What is this Project?

The **FUT Minna Staff Dashboard** is a web-based application that automates the lecture scheduling process for the Computer Science Department. It replaces manual, paper-based scheduling with a digital platform where different staff members have specific roles and permissions.

### 1.2 The Problem

Before this system, creating the departmental timetable was a tedious process:
- The HOD manually assigned courses to lecturers on paper
- The Timetable Officer had to physically check venue availability and avoid double-booking
- Lecturers had no centralized way to view their teaching schedule
- Conflicts (two courses in the same venue at the same time) were only discovered after the schedule was published
- There was no audit trail of who made what changes

### 1.3 How the System Solves It

The system provides separate dashboards and tools for each staff role:

| Staff Role | What They Can Do |
|-----------|-----------------|
| **Admin** | Create staff accounts, assign roles, manage venues and time slots |
| **HOD (Head of Department)** | Assign courses to lecturers, monitor workload, view schedule |
| **Exam Officer** | Add, edit, and delete courses in the catalog |
| **Timetable Officer** | Build the schedule by assigning courses to venues and time slots |
| **Lecturer** | View their personal teaching schedule |

### 1.4 Key Features

- **Role-Based Access Control** — Each user sees only what they need
- **Real-Time Conflict Detection** — Prevents double-booking venues, lecturers, and levels
- **Visual Timetable Calendar** — Drag-and-drop style weekly grid
- **AI Integration** — Gemini AI assists with schedule suggestions, conflict resolution, workload balancing, and Q&A
- **Real-Time Notifications** — Instant alerts when new staff are registered
- **Comprehensive Audit Trail** — Every action is logged for accountability
- **Dynamic Dashboards** — Live statistics for each role
- **CSV Reporting** — Export schedules, workload, and conflict reports

---

## 2. Technology Stack & Why

### 2.1 Frontend

| Technology | Version | Purpose | Why We Chose It |
|-----------|---------|---------|----------------|
| **React** | ^19.2.6 | UI library for building interactive interfaces | Industry standard for web apps; component-based architecture makes the UI reusable and maintainable |
| **React Router DOM** | ^7.17.0 | Client-side navigation between pages | Enables single-page application (SPA) navigation without page reloads |
| **React Hot Toast** | ^2.6.0 | Popup notifications | Lightweight, customizable toast notifications for success/error messages |
| **Axios** | ^1.17.0 | HTTP client for API calls | Automatically attaches JWT tokens to requests; handles errors globally |
| **Vite** | ^8.0.12 | Build tool and development server | Much faster than Create React App; hot module replacement for instant feedback |
| **React Icons** | ^5.6.0 | UI icon library | Professional SVG icons (Feather Icons) replacing emoji glyphs across the entire UI |

### 2.2 Backend

| Technology | Version | Purpose | Why We Chose It |
|-----------|---------|---------|----------------|
| **Node.js** | — | JavaScript runtime | Allows us to use JavaScript for both frontend and backend (full-stack JS) |
| **Express** | ^5.2.1 | Web framework for building REST APIs | Most popular Node.js framework; simple routing and middleware system |
| **Mongoose** | ^9.6.3 | MongoDB object modeling | Provides schema validation, indexing, and relation management for MongoDB |
| **JSON Web Token** | ^9.0.3 | Authentication tokens | Stateless authentication — no session data to store on the server |
| **Bcryptjs** | ^3.0.3 | Password hashing | Industry-standard password security; salt rounds make brute-force attacks impractical |
| **Notifications (Polling)** | — | Periodic notification polling | Replaced Socket.IO with HTTP polling for Vercel serverless compatibility (GET /api/notifications every 30s) |
| **Dotenv** | ^17.4.2 | Environment variable management | Keeps API keys and database credentials out of source code |
| **CORS** | ^2.8.6 | Cross-Origin Resource Sharing | Allows the frontend (port 5173) to talk to the backend (port 5000) |

### 2.3 AI Integration

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Google Gemini API** | — | AI-powered schedule suggestions, conflict resolution, workload analysis, and chat assistant |
| **@google/generative-ai** | ^0.x | Official Google SDK for Node.js |

### 2.4 Database

| Technology | Purpose |
|-----------|---------|
| **MongoDB Atlas** | Cloud-hosted NoSQL database — stores all application data as JSON-like documents |
| **Mongoose** | Acts as a bridge between the application code and MongoDB; provides schema definitions and validation |

### 2.5 Why MERN Stack?

The **MERN stack** (MongoDB, Express, React, Node.js) was chosen because:
1. **JavaScript everywhere** — Same language for frontend and backend reduces context switching
2. **JSON throughout** — MongoDB stores JSON, Express/Node processes JSON, React renders JSON — no data transformation needed
3. **Large community** — Abundant resources, tutorials, and npm packages
4. **Scalability** — MongoDB handles large datasets well; Node.js handles concurrent connections efficiently

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (React SPA)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Auth     │  │ Pages    │  │ Context  │  │ Notifications │   │
│  │ Context  │  │ (15+)    │  │ Providers│  │ Polling (30s) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                        │                                      │
│          Axios (JWT in Authorization Header)                   │
│          HTTP Polling (GET /api/notifications)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              VITE DEV SERVER (PORT 5173)                      │
│         Proxies /api/* requests → http://localhost:5000       │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              EXPRESS.JS SERVER (PORT 5000)                    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │Middleware │  │ Routes   │  │Controllers│  │ Notification  │   │
│  │• JWT Auth │  │ (10)     │  │ (8)       │  │ Controller    │   │
│  │• RBAC     │  │          │  │           │  │               │   │
│  │• Audit    │  │          │  │           │  │               │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                        │                                      │
│              MONGODB ATLAS (Cloud Database)                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow — Step by Step

Here's what happens when a user logs in and views their dashboard:

```
Step 1: User types email/password → clicks "Sign In"
Step 2: Frontend sends POST /api/auth/login with { email, password }
Step 3: Backend validates credentials against MongoDB
Step 4: If valid, backend creates a JWT token and sends it back
Step 5: Frontend stores the JWT in localStorage
Step 6: Frontend redirects the user to their role-specific dashboard
Step 7: Dashboard component mounts → sends GET /api/dashboard/stats
         with JWT in the Authorization header
Step 8: Backend protect middleware verifies the JWT → loads user from DB
Step 9: Backend authorizeRoles middleware checks if user role is allowed
Step 10: Controller queries MongoDB for statistics → returns JSON
Step 11: Frontend renders the statistics in the dashboard cards
```

### 3.3 Why This Architecture?

- **Separation of concerns** — Frontend and backend are independent; they communicate via a well-defined API
- **Stateless backend** — No session data stored on the server (JWT contains all auth info)
- **Proxy pattern** — Vite proxies API requests during development, simplifying CORS
- **Scalable** — Multiple frontend clients (web, mobile) can use the same backend API

---

## 4. Database Design & Data Models

### 4.1 Database Choice: Why MongoDB?

MongoDB is a **NoSQL document database**. Unlike relational databases (like MySQL) that store data in tables with rows and columns, MongoDB stores data as **JSON-like documents** with flexible schemas. This was ideal because:

1. **Flexible schemas** — Different entity types (courses, venues, users) have different fields; no rigid table structure
2. **Embedded documents** — Related data can be nested (e.g., an assignment can contain course details)
3. **Fast prototyping** — No need to define migrations when adding new fields
4. **JSON native** — Works seamlessly with JavaScript/Node.js

### 4.2 Entity Relationship Overview

```
User (Staff)
  ├── Has many → CourseToLecturerAssignment (as lecturer)
  ├── Has many → CourseToVenueTimeAssignment (as lecturer)
  ├── Created → Course (as Exam Officer)
  ├── Created → Venue (as Admin)
  └── Performed → AuditLog entries

Course
  ├── Has many → CourseToLecturerAssignments
  └── Has many → CourseToVenueTimeAssignments

Venue
  └── Has many → CourseToVenueTimeAssignments

TimeSlot
  └── Has many → CourseToVenueTimeAssignments

CourseToLecturerAssignment (links a course to a lecturer)
  └── Has many → CourseToVenueTimeAssignments

CourseToVenueTimeAssignment (the final schedule entry)
      └── This is the result of the entire scheduling process
```

### 4.3 Data Model Details

#### 4.3.1 User Model (`backend/models/User.js`)

This model represents every person who uses the system — Admin, HOD, Exam Officer, Timetable Officer, or Lecturer.

```javascript
{
  staffId: String,        // e.g., "CS/001" — unique staff identifier
  fullName: String,       // e.g., "Dr. Ibrahim Musa"
  email: String,          // e.g., "ibrahim.musa@futminna.edu.ng" — must be unique
  password: String,       // Hashed with bcrypt — NEVER stored in plain text
  role: String,           // One of: Admin, HOD, Exam Officer, Timetable Officer, Lecturer
  department: String,     // Default: "Computer Science"
  status: String,         // "Active" or "Inactive" — inactive users cannot login
  phone: String,          // Optional contact number
  officeLocation: String, // Optional office address
  lastLogin: Date,        // Timestamp of last successful login
  loginAttempts: Number,  // Tracks failed login attempts (for lockout)
  lockUntil: Date,        // Account locked until this time
  mustChangePassword: Boolean, // True for first-time users
}
```

**Key design decisions:**
- `password` uses `select: false` — it's excluded from normal queries for security
- `staffId` is optional but unique — allows flexibility for new staff without IDs yet
- `status: "Inactive"` disables accounts instead of deleting them (preserves audit trail)

#### 4.3.2 Course Model (`backend/models/Course.js`)

```javascript
{
  code: String,        // e.g., "CSC 301" — must be unique
  title: String,       // e.g., "Software Engineering"
  creditUnits: Number, // 1–6
  level: Number,       // 100, 200, 300, 400, or 500
  departments: Array,  // e.g., ["Computer Science"]
  semester: String,    // "1st Semester" or "2nd Semester"
  description: String, // Optional course description
  isActive: Boolean,   // Soft delete flag
}
```

#### 4.3.3 Venue Model (`backend/models/Venue.js`)

```javascript
{
  name: String,      // e.g., "Lecture Hall A" — must be unique
  building: String,  // e.g., "Main Academic Building"
  capacity: Number,  // e.g., 200
  type: String,      // "Lecture Hall", "Laboratory", "Seminar Room", or "Auditorium"
  equipment: Array,  // e.g., ["Projector", "Whiteboard", "WiFi"]
}
```

#### 4.3.4 TimeSlot Model (`backend/models/TimeSlot.js`)

```javascript
{
  startTime: String,       // e.g., "08:00" (24-hour format)
  endTime: String,         // e.g., "09:00"
  duration: Number,        // In hours (e.g., 1)
  daysAvailable: Array,    // e.g., ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  applicableSemesters: Array, // e.g., ["1st Semester", "2nd Semester"]
}
```

The system operates with **9 hourly time slots** per day:
- **Morning:** 08:00–09:00, 09:00–10:00, 10:00–11:00, 11:00–12:00, 12:00–13:00
- **🚫 Lunch Break:** 13:00–14:00
- **Afternoon:** 14:00–15:00, 15:00–16:00, 16:00–17:00, 17:00–18:00

#### 4.3.5 CourseToLecturerAssignment Model (`backend/models/CourseToLecturerAssignment.js`)

This model links a course to a lecturer — it represents the HOD's decision about who teaches what.

```javascript
{
  courseId: ObjectId,     // Reference to Course
  lecturerId: ObjectId,   // Reference to User (the teaching staff)
  semester: String,       // "1st Semester" or "2nd Semester"
  workloadOverride: Boolean, // True if lecturer exceeded max courses
  overrideReason: String,    // Why HOD allowed the override
  // Denormalized fields (stored for performance):
  courseCode: String,       // e.g., "CSC 301"
  courseTitle: String,      // e.g., "Software Engineering"
  lecturerName: String,     // e.g., "Dr. Ibrahim Musa"
}
```

**What is denormalization?** Normally, to get a course code from this record, we'd need to look up the Course collection (a "join"). Denormalization means we store the course code directly in this record too — it takes more storage but makes queries much faster.

**Unique constraint:** A course cannot be assigned to the same lecturer twice in the same semester (`{ courseId, lecturerId, semester }` must be unique).

#### 4.3.6 CourseToVenueTimeAssignment Model (`backend/models/CourseToVenueTimeAssignment.js`)

This is the **final schedule** — it connects a course to a specific venue, time slot, and day. A lecturer assignment is **optional**: courses may be scheduled with or without a lecturer, and unassigned courses display "Unassigned" as the lecturer.

```javascript
{
  courseId: ObjectId,                     // Reference to Course
  courseToLecturerAssignmentId: ObjectId, // Link to lecturer assignment
  venueId: ObjectId,                      // Reference to Venue
  timeSlotId: ObjectId,                   // Reference to TimeSlot
  dayOfWeek: String,                      // "Monday" through "Friday"
  isScheduled: Boolean,                   // Default: true
  conflictOverride: Boolean,              // True if scheduled despite conflicts
  // Denormalized fields:
  courseCode: String, lecturerName: String, venueName: String,
  startTime: String, endTime: String,
}
```

**Compound indexes** (for fast conflict checking):
- `{ venueId, timeSlotId, dayOfWeek }` — Quickly find if a venue is booked at a specific time
- `{ lecturerId, timeSlotId, dayOfWeek }` — Quickly find if a lecturer is teaching at that time

#### 4.3.7 AuditLog Model (`backend/models/AuditLog.js`)

Records every significant action in the system:

```javascript
{
  timestamp: Date,      // When it happened
  userId: ObjectId,     // Who did it
  userEmail: String,    // Their email (denormalized)
  userRole: String,     // Their role
  actionType: String,   // "Create", "Update", "Delete", "Login"
  entityType: String,   // "User", "Course", "Venue", "Assignment"
  entityId: ObjectId,   // Which record was affected
  details: Object,      // What exactly changed (JSON)
  ipAddress: String,    // Where the request came from
}
```

---

## 5. Backend API Implementation

### 5.1 Application Structure (`backend/app.js` & `backend/server.js`)

The backend is split into two files for Vercel serverless compatibility:

**`backend/app.js`** — The Express application definition (exported for Vercel):
1. Loads environment variables from root `.env.local`
2. Configures CORS with a whitelist of allowed origins
3. Parses JSON request bodies
4. Connects to MongoDB (connection is cached for serverless)
5. Mounts all route modules
6. Serves built frontend from `dist/` when available
7. Exports the `app` as the default export (used by both `server.js` and Vercel's `api/index.js`)

**`backend/server.js`** — Local development entry point:
1. Imports the app from `app.js`
2. Validates critical environment variables
3. Connects to MongoDB
4. Creates an HTTP server and starts listening

**`api/index.js`** — Vercel serverless entry point:
1. Imports the app from `backend/app.js`
2. Exports as the default handler — Vercel routes requests here

```javascript
// app.js — exported for both local dev and Vercel
import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "./config/db.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env.local") });

const app = express();
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
connectDB();

app.use("/api/auth", authRoutes);
// ... all routes mounted here

export default app;
```

```javascript
// server.js — local development only
import http from "node:http";
import app from "./app.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env.local") });

connectDB().then(() => {
  http.createServer(app).listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
  });
});
```

```javascript
// api/index.js — Vercel serverless
import app from "../backend/app.js";
export default app;
```

### 5.2 The Vite Proxy

During development, when the frontend (running on port 5173) makes a request to `/api/dashboard/stats`, Vite's dev server proxies it to `http://localhost:5000/api/dashboard/stats`. This avoids CORS issues during development. In production, both frontend and backend would be served from the same domain.

```javascript
// vite.config.js
server: {
  proxy: {
    "/api": {
      target: "http://localhost:5000",
      changeOrigin: true,
    },
  },
}
```

### 5.3 Middleware

Middleware functions are functions that run **between** the incoming request and the final route handler. They can modify the request, check permissions, or log information.

#### JWT Authentication (`backend/middleware/auth.js`)

**`protect` middleware** — Runs on every protected route:
1. Extracts the JWT from the `Authorization: Bearer <token>` header
2. Verifies the token's signature using `JWT_SECRET`
3. Looks up the user in the database
4. Checks if the account is active (deactivated users are rejected)
5. Attaches the full user object to `req.user` for downstream use

**`authorizeRoles(...roles)` middleware** — Runs after `protect`:
1. Checks if `req.user.role` is in the list of allowed roles
2. Returns `403 Forbidden` if the role is not permitted

**`generateToken(user, rememberMe)` function** — Creates a JWT:
- Default expiry: 12 hours
- "Remember Me" expiry: 30 days
- Token contains: `{ id, role }` — signed with `JWT_SECRET`

#### Audit Logging (`backend/middleware/audit.js`)

**`logAudit(params)` function** — Called from controllers after CRUD operations:
- Creates an AuditLog record with who, what, when, and details
- Non-blocking — if logging fails, the main operation still succeeds

---

## 6. Authentication & Authorization (RBAC)

### 6.1 How Authentication Works

Authentication = **verifying who you are** (logging in).

```
User enters email + password
        │
        ▼
Backend finds user by email
        │
        ▼
Backend compares password with bcrypt hash
        │
        ├── If mismatch → "Invalid email or password"
        │
        └── If match → Create JWT token → Send to frontend
                                     │
                                     ▼
                          Frontend stores JWT in localStorage
                          All future API calls include:
                          Authorization: Bearer <JWT>
```

### 6.2 How Authorization Works (RBAC)

Authorization = **verifying what you're allowed to do**.

Each API endpoint specifies which roles can access it:
```javascript
router.post("/users", protect, authorizeRoles("Admin"), createUser);
//                           ↑                ↑
//                      Must be logged in    Must be Admin
```

### 6.3 The Five Roles

| Role | Short Description | Key Permissions |
|------|------------------|----------------|
| **Admin** | System administrator | Full access — manage users, venues, time slots, everything |
| **HOD** | Head of Department | Assign lecturers to courses, view schedules and reports |
| **Exam Officer** | Course catalog manager | Create, edit, delete courses |
| **Timetable Officer** | Schedule builder | Assign courses to venues and times, manage time slots |
| **Lecturer** | Teaching staff | View personal schedule only |

### 6.4 Single-Occupant Roles

HOD, Exam Officer, and Timetable Officer are special — **only one person can hold each role at a time**. The `assignRole` endpoint handles this automatically:

1. Checks if someone else currently holds the target role
2. If yes, demotes them to "Lecturer"
3. Promotes the target user to the new role

This prevents situations where two people think they're the HOD.

---

## 7. Frontend Architecture & User Interface

### 7.1 Project Structure

```
frontend/
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx      # Global auth state (login/logout/user data)
│   │   └── SocketContext.jsx    # Notification polling (replaced Socket.IO)
│   ├── components/
│   │   ├── SharedLayout.jsx     # Sidebar + nav + notification bell + AI assistant
│   │   ├── ConflictWarning.jsx  # Displays scheduling conflicts
│   │   ├── AiAssistant.jsx      # Floating AI chat widget (Gemini)
│   │   ├── AiSuggestionBanner.jsx  # AI schedule suggestion cards
│   │   └── AiWorkloadInsights.jsx  # AI workload analysis dashboard
│   ├── pages/                   # 15 page components (one per route)
│   │   ├── LoginPage.jsx
│   │   ├── AdminDashboard.jsx, HODDashboard.jsx, etc.
│   │   └── UserManagement.jsx, CourseManagement.jsx, etc.
│   ├── utils/
│   │   ├── api.js               # Axios instance (auto-attaches JWT)
│   │   ├── helpers.js           # Constants (semesters, levels, days)
│   │   └── toast.js             # Toast notification helpers
│   ├── responsive.css          # Mobile responsive media queries
│   └── App.jsx                  # Router + route definitions
└── vite.config.js               # Vite configuration + API proxy
```

### 7.2 Routing Architecture (`frontend/src/App.jsx`)

The app has two types of routes:

**Public routes** (no login required):
- `/login` — Login page
- `/forgot-password` — Password reset request
- `/reset-password` — Reset with token

**Protected routes** (login required):
- All other routes wrapped in `<ProtectedRoute>`
- `ProtectedRoute` checks if user is authenticated
- If not → redirects to `/login`
- If `mustChangePassword` is true → redirects to `/change-password`

**Role-based dashboard routing:**
```javascript
const DashboardRouter = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case "Admin": return <AdminDashboard />;
    case "HOD": return <HODDashboard />;
    // ... etc
  }
};
```

### 7.3 State Management with React Context

**AuthContext** manages:
- Current user data (`user` object)
- Authentication token
- Login/logout functions
- Password reset functions
- Loading/error states

When the app loads, it checks localStorage for a saved token and automatically loads the user's data via `GET /api/auth/me`.

**SocketContext** manages:
- Polling status (connected/disconnected from notification API)
- Notification list
- Unread notification count

### 7.4 API Client (`frontend/src/utils/api.js`)

A configured Axios instance that:
1. **Automatically attaches JWT** to every request (from localStorage)
2. **Handles 401 errors** globally (redirects to login if token expires)

```javascript
// Request interceptor — runs before every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 7.5 Shared Layout Component

The `SharedLayout` component wraps all protected pages and provides:
- **Sidebar navigation** — Role-specific menu items (collapses into a hamburger toggle on mobile)
- **User info display** — Avatar, name, role
- **Notification bell** — Real-time notification dropdown with unread badge
- **Logout button**
- **AI Assistant** — Floating chat widget (visible on every page)

### 7.6 Mobile Responsive Design

The entire application was made mobile-responsive using a pure CSS approach (no framework like Tailwind was installed). This was done by:

**Approach:** Adding CSS `className` attributes to key structural elements throughout the component tree, then targeting those classNames with `@media` queries in a single `responsive.css` file using `!important` to override inline styles.

**Breakpoints:**
- **≤ 1024px (Tablet)** — Grids reduce to 2 columns, calendar views become horizontally scrollable
- **≤ 768px (Mobile)** — Sidebar collapses behind a hamburger toggle, single-column grids, stacked forms, smaller padding
- **≤ 480px (Small Mobile)** — Further column reductions, smaller card sizes

**Key Responsive Features:**

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Sidebar** | Fixed 260px on the left | Hidden behind hamburger toggle, slides in as overlay |
| **Stat Cards** | Multi-column grid | Single column stack |
| **Form Rows** | Two columns side-by-side | Stacked vertically |
| **Tables** | Full width visible | Horizontally scrollable with touch support |
| **Calendars** | Full grid visible | Horizontally scrollable |
| **Login Card** | Centered with 40px padding | Smaller padding, flexible width |
| **AI Assistant** | 380px floating panel | Full width with 16px margins |
| **Action Buttons** | Inline in header | Stacked below title, full width |

**Files involved:** `frontend/src/responsive.css` — a single stylesheet imported in `main.jsx`.

**Why not Tailwind?** The entire codebase uses inline `style={}` objects. Converting to Tailwind would require rewriting every component. The CSS override approach achieved the same result with zero dependency changes and minimal component modifications (just adding className attributes).

---

## 8. Module 1: User Management

**Access:** Admin only  
**Backend files:** `backend/routes/users.js`, `backend/controllers/userController.js`  
**Frontend file:** `frontend/src/pages/UserManagement.jsx`

### 8.1 What It Does

The User Management module is the Admin's tool for managing all staff accounts. It's like the HR system for the scheduling platform.

### 8.2 Features

1. **Create Staff Account** — Register new users with name, email, staff ID, department, and role
2. **View All Staff** — Paginated table with search (by name or email) and role filtering
3. **Edit Staff** — Modal form to update any user's details
4. **Activate/Deactivate** — Toggle accounts on/off; deactivated users cannot login
5. **Delete Staff** — Permanently remove a user from the system
6. **Assign Special Roles** — Single-occupant role assignment (HOD, Exam Officer, Timetable Officer)
7. **Staff ID** — Each staff member has a unique identifier

### 8.3 Key Backend Logic

```javascript
// Assign a special role — automatically demotes the previous occupant
export const assignRole = async (req, res) => {
  const currentOccupant = await User.findOne({ role: newRole, _id: { $ne: userId } });
  if (currentOccupant) {
    currentOccupant.role = "Lecturer";  // Demote
    await currentOccupant.save();
  }
  targetUser.role = newRole;  // Promote
  await targetUser.save();
};
```

### 8.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all users (paginated, filterable) |
| `GET` | `/api/users/:id` | Get single user details |
| `PUT` | `/api/users/:id` | Update user fields |
| `DELETE` | `/api/users/:id` | Delete user |
| `PATCH` | `/api/users/:id/deactivate` | Deactivate user |
| `PATCH` | `/api/users/:id/activate` | Reactivate user |
| `GET` | `/api/users/lecturers` | Get all teaching staff (for dropdowns) |
| `POST` | `/api/users/assign-role` | Assign single-occupant role |

---

## 9. Module 2: Course Management

**Access:** Admin & Exam Officer (CRUD), all roles (view)  
**Backend files:** `backend/routes/courses.js`, `backend/controllers/courseController.js`  
**Frontend file:** `frontend/src/pages/CourseManagement.jsx`

### 9.1 What It Does

The Exam Officer uses this module to maintain the course catalog — adding new courses, updating details, and removing courses that are no longer offered.

### 9.2 Features

1. **Create Course** — Add a new course with code, title, credit units, level, semester
2. **View Courses** — Paginated table with search (by code/title), level filter, semester filter
3. **Edit Course** — Update course details (code cannot be changed once set)
4. **Delete Course** — Removes the course and all associated assignments (cascading deletion)

### 9.3 Cascading Deletion

When a course is deleted, the system automatically:
1. Finds all lecturer assignments for that course → deletes them
2. Finds all venue-time assignments for that course → deletes them
3. Logs the number of removed assignments in the audit trail

This prevents "orphan" records that reference a course that no longer exists.

### 9.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses` | List courses with filters |
| `GET` | `/api/courses/:id` | Get course details + assignments |
| `POST` | `/api/courses` | Create new course |
| `PUT` | `/api/courses/:id` | Update course |
| `DELETE` | `/api/courses/:id` | Delete course + cascading |

---

## 10. Module 3: Venue Management

**Access:** Admin (CRUD), Timetable Officer (update), all roles (view)  
**Backend files:** `backend/routes/venues.js`, `backend/controllers/venueController.js`  
**Frontend file:** `frontend/src/pages/VenueManagement.jsx`

### 10.1 What It Does

Manages the physical spaces where lectures take place — lecture halls, laboratories, seminar rooms, and auditoriums.

### 10.2 Features

1. **Create Venue** — Add a new venue with name, building, capacity, type, and equipment
2. **View Venues** — Card-based layout with type badges, capacity info, and equipment tags
3. **Edit Venue** — Update venue details
4. **Delete Venue** — Removes venue + associated schedule assignments
5. **Venue Schedule** — View what courses are scheduled in a specific venue by day/time
6. **Filter & Search** — By type, minimum capacity, or name/building

### 10.3 Venue Schedule View

The venue schedule shows a weekly grid (Mon–Fri × time slots) for a specific venue, making it easy to see available time slots at a glance.

### 10.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/venues` | List venues with filters |
| `GET` | `/api/venues/:id` | Get venue details |
| `GET` | `/api/venues/:id/schedule` | Get venue's weekly schedule |
| `POST` | `/api/venues` | Create venue |
| `PUT` | `/api/venues/:id` | Update venue |
| `DELETE` | `/api/venues/` | Delete venue |

---

## 11. Module 4: Time Slot Management

**Access:** Admin & Timetable Officer (CRUD), all roles (view)  
**Backend files:** `backend/routes/timeslots.js`, `backend/controllers/timeslotController.js`  
**Frontend file:** `frontend/src/pages/TimeSlotManagement.jsx`

### 11.1 What It Does

Configures the academic timetable structure — defines operating hours and generates the hourly time slots used for scheduling.

### 11.2 Features

1. **9 Hourly Slots** — The system operates from 08:00 to 18:00 with a lunch break at 13:00–14:00
2. **Batch Generation** — One-click generation of all missing slots
3. **Semester Selection** — Slots can apply to 1st Semester, 2nd Semester, or both
4. **Calendar View** — Visual weekly grid showing which slots are configured
5. **List View** — Tabular view with duration badges and day/semester info
6. **Configuration Summary** — Cards showing operating hours, session type, and day count

### 11.3 How Batch Generation Works

```javascript
const suggestedSlots = () => {
  const slots = [];
  // Morning: 08:00 → 13:00 (5 slots)
  for (let hour = 8; hour < 13; hour++) {
    slots.push({ start: `${hour}:00`, end: `${hour + 1}:00`, duration: 1 });
  }
  // Afternoon: 14:00 → 18:00 (4 slots)
  for (let hour = 14; hour < 18; hour++) {
    slots.push({ start: `${hour}:00`, end: `${hour + 1}:00`, duration: 1 });
  }
  return slots; // 9 total slots
};
```

The system then compares these against existing slots in the database and only creates the ones that are missing.

---

## 12. Module 5: Course-to-Lecturer Allocation

**Access:** Admin & HOD  
**Backend files:** `backend/routes/assignments.js`, `backend/controllers/assignmentController.js`  
**Frontend file:** `frontend/src/pages/CourseAllocation.jsx`

### 12.1 What It Does

The HOD assigns courses to teaching staff. This is the **first step** in the scheduling process — courses must be allocated to lecturers before they can be scheduled.

### 12.2 Features

1. **Assign Course to Staff** — Select a course, a teaching staff member (lecturers, HOD, exam officer, timetable officer — all teaching staff), and a semester
2. **Workload Warnings** — Warns if a staff member exceeds 4 courses per semester
3. **Override Option** — HOD can proceed despite the workload warning (logged in audit trail)
4. **View Assignments** — Table with course, lecturer, semester, and override status
5. **Search & Filter** — By course/lecturer name, semester filter
6. **Remove Assignment** — Cascading deletion of corresponding venue-time assignments
7. **Duplicate Prevention** — Same course+lecturer+semester cannot be assigned twice

### 12.3 Workload Limit Logic

```javascript
const MAX_COURSES = parseInt(process.env.MAX_COURSES_PER_LECTURER) || 4;
const currentWorkload = await CourseToLecturerAssignment.countDocuments({
  lecturerId, semester,
});

if (currentWorkload >= MAX_COURSES && !overrideReason) {
  return res.status(409).json({
    code: "WORKLOAD_EXCEEDED",
    message: `${lecturerName} already has ${currentWorkload} courses.`
  });
}
```

The max courses per lecturer is configurable via the `MAX_COURSES_PER_LECTURER` environment variable (default: 4).

---

## 13. Module 6: Schedule Planning (Timetable Generation)

**Access:** Admin & Timetable Officer (management), all roles (view)  
**Backend files:** `backend/routes/assignments.js`, `backend/controllers/assignmentController.js`  
**Frontend file:** `frontend/src/pages/SchedulePlanning.jsx`

### 13.1 What It Does

This is the **core scheduling engine of the system** — enabling the Timetable Officer to construct conflict-free timetables through both algorithmic automation and rich interactive manual controls.

### 13.2 Key Features & Architecture

#### 1. Multi-Course Concurrent Time Slots (Up to 5 Lectures per Slot)
In modern university operations, different academic levels (e.g., 100L and 200L) or disjoint student cohorts can have lectures simultaneously in different venues.
- **Calendar Grid Display**: Each hour cell renders stacked badges for up to 5 concurrent lectures with course code, level badge (e.g. `200L`), venue name, and lecturer name.
- **Capacity Meter**: Real-time indicator (e.g. `3/5 classes`) displaying slot occupancy.
- **Interactive Slot Modal**: Clicking any calendar cell opens a comprehensive management modal showing all classes running in that specific slot with actions to:
  - **+ Add Course to Slot**: Assigns another class to the slot (if `< 5` capacity).
  - **🔁 Move / Reschedule**: Transfers a course to another Day, Time Slot, and Venue.
  - **✏️ Edit Details**: In-place editor for Venue, Lecturer, and session notes.
  - **🗑️ Remove**: Unassigns a specific course from the slot.

#### 2. Multi-Department Cohort Clash Protection
Guarantees student schedule integrity across multi-department courses:
- **Rule**: If Course A is taken by students in departments `[D1, D2]` at Level `L`, no other course taken by `D1` at Level `L` or `D2` at Level `L` can be scheduled at the same time.
- **Example**: `MTH 201` (offered by `CSC` and `CSS` at `200L`) will block both `CSC 201` and `CSS 201` at that time slot.
- Courses at different levels (e.g. `100L` vs `200L`) or for completely disjoint departments (e.g. `CSS 201` and `SE 201`) are allowed to run concurrently in separate venues.

#### 3. Weekly Credit Unit Quota Tracking & Unscheduled Drawer
- **Quota Rule**: $1\text{ Credit Unit} = 1\text{ Time Slot}$ per week (e.g., 3-unit course = 3 weekly lecture slots).
- **Status Classification**:
  - `unscheduled`: 0 slots allocated.
  - `partial`: $0 < \text{allocated} < \text{maxSlots}$.
  - `completed`: $\ge \text{maxSlots}$.
- **Allocation Status Drawer**: A slide-out panel filterable by level showing each course's progress (e.g. `1/3 slots ⏳ Partial`), assigned time slots, and a 1-click **"Assign to Slot"** shortcut.
- **Quota Filter**: Fully scheduled courses are filtered from manual pickers by default, with a toggle to override for extra tutorial/lab allocations.

#### 4. Automatic Timetable Generator & Diagnostic Reporting
- **CSP Solver**: Generates conflict-free timetable schedules optimizing venue capacities, 2-hour lecture blocks, and cohort distributions.
- **Post-Generation Diagnostics Modal**: Surfaces immediate operational metrics:
  - **Scheduled Courses & Slots**: Total successful placements.
  - **Unplaced Courses Table**: Exact breakdown of unscheduled courses with precise conflict causes (e.g. venue saturation, slot capacity limit reached, or cohort clash).
  - **Unassigned Lecturer Count**: Flags scheduled courses that require HOD lecturer allocation.

#### 5. Move / Reschedule Workflow
- Timetable Officers can reschedule any class by selecting a new Day, Time Slot, and Venue in the slot modal.
- The system validates target slot conflicts in real-time while excluding the active record (`excludeAssignmentId`) to prevent false-positive self-conflicts.

### 13.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assignments/check-conflict` | Real-time pre-check for venue, lecturer, capacity, and cohort conflicts |
| `POST` | `/api/assignments/course-to-venue-time` | Create schedule assignment |
| `PUT` | `/api/assignments/course-to-venue-time/:id` | Update or Move/Reschedule assignment |
| `DELETE` | `/api/assignments/course-to-venue-time/:id` | Delete assignment |
| `GET` | `/api/assignments/schedule` | Get full timetable schedule with filters |
| `GET` | `/api/assignments/unscheduled` | Get unscheduled courses with credit unit quotas and slot progress |
| `POST` | `/api/assignments/auto-generate` | Algorithmic CSP schedule generation with diagnostic reports |
| `GET` | `/api/assignments/lecturer/:lecturerId/schedule` | Get lecturer's personal weekly schedule |

---

## 14. Module 7: Dashboard Modules

**Backend:** `backend/controllers/dashboardController.js`, `backend/routes/dashboard.js`

Each role has a customized dashboard showing relevant statistics and quick actions. All dashboards fetch live data from `GET /api/dashboard/stats`.

### 14.1 Admin Dashboard

**File:** `frontend/src/pages/AdminDashboard.jsx`

Shows:
- Total Staff, Active Staff
- Total Courses, Total Venues
- Scheduled Courses, Unscheduled Courses
- Quick actions: User Management, Venue Management, Time Slots, Reports

### 14.2 HOD Dashboard

**File:** `frontend/src/pages/HODDashboard.jsx`

Shows:
- Total Course Allocations, Scheduled vs Unscheduled Courses
- Workload status and quick links to Course Allocation and Reports

### 14.3 Timetable Officer Dashboard

**File:** `frontend/src/pages/TimetableOfficerDashboard.jsx`

Shows:
- Scheduled Courses, Unscheduled Courses, Unassigned Courses
- Venues Used vs Total Venues, Total Courses, Total Time Slots
- Quick launch button for Automatic Timetable Generator and Schedule Planning

### 14.4 Lecturer Dashboard

**File:** `frontend/src/pages/LecturerDashboard.jsx`

Shows:
- Total Weekly Teaching Sessions and Total Credit Units
- Personal weekly calendar and list views
- Export to CSV button for personal timetable

### 14.5 Auto-Refresh & Error Handling

Every dashboard fetches live stats from `GET /api/dashboard/stats` and includes three reliability features:

**1. Auto-Refresh (30-second polling)**
```javascript
useEffect(() => {
  fetchStats();
  const interval = setInterval(fetchStats, 30000);
  return () => clearInterval(interval);
}, [fetchStats]);
```
Each dashboard automatically re-fetches statistics every 30 seconds so the numbers stay up-to-date without requiring a manual page refresh.

**2. Fallback Values (0 instead of dashes)**

Previously, when data was unavailable, dashboards displayed `—` (em dash). Now they display `0`, making it clear that the system is connected but there's simply no data yet:
```javascript
// Before
const value = stats?.totalUsers ?? "—";

// After  
const value = stats?.totalUsers ?? 0;
```

**3. Error Banner with Retry**

If the API call fails (server down, network issue), the dashboard shows a visible error banner instead of silently showing dashes:
- Red banner with "Could not load dashboard stats" message
- **Retry button** to manually trigger another API call
- Error automatically clears when data loads successfully

**4. Manual Refresh Button**

Each dashboard also includes a "↻ Refresh" button and a "Last updated" timestamp so users can manually refresh or see how current the data is.

### 14.6 Backend Stats Logic

The dashboard controller returns role-specific statistics:

```javascript
if (role === "Admin") {
  // Returns: totalUsers, activeUsers, totalCourses, totalVenues,
  //          scheduledCourses, unscheduledCourses
}
if (role === "HOD") {
  // Returns: totalAllocations, scheduledCourses, unscheduledCourses, totalCourses
}
if (role === "Exam Officer") {
  // Returns: totalCourses, totalVenues, totalTimeSlots, levelBreakdown
}
if (role === "Timetable Officer") {
  // Returns: scheduledCourses, unscheduledCourses, totalVenues,
  //          venuesUsed, totalCourses, totalTimeSlots
}
```

---

## 15. Module 8: Reports & Analytics

**Backend files:** `backend/routes/reports.js`, `backend/routes/admin.js`  
**Frontend file:** `frontend/src/pages/Reports.jsx`

### 15.1 Available Reports

| Report | Who Can Access | What It Shows |
|--------|---------------|---------------|
| **Semester Schedule** | Admin, HOD, Exam Officer, Timetable Officer | Full schedule with course, lecturer, venue, day, time |
| **Conflict Report** | Admin, HOD, Timetable Officer | All detected scheduling conflicts with types |
| **Lecturer Workload** | Admin, HOD | Each lecturer's courses, credit units, status (normal/warning/overloaded) |
| **Venue Utilization** | Admin, Timetable Officer | Each venue's scheduled courses, available slots, utilization % |

### 15.2 Features
- Semester filter
- CSV export (downloads report data as a CSV file)
- Summary statistics (total courses, venues, lecturers)
- Color-coded status indicators (green = normal, yellow = warning, red = overloaded)

### 15.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reports/semester-schedule` | Generate schedule report |
| `GET` | `/api/reports/conflicts` | Get conflict report |
| `GET` | `/api/admin/workload-report` | Get workload report |
| `GET` | `/api/admin/venue-utilization` | Get venue utilization |

---

## 16. Module 9: Conflict Detection System

**File:** `backend/controllers/assignmentController.js` — `checkConflictInternal()` function

### 16.1 Overview

Before any schedule assignment or move operation is confirmed, the system automatically checks for four constraint categories.

### 16.2 Type 1: Venue Conflict (`VENUE_CONFLICT`)
Prevents assigning two courses to the same venue at the same time:
```javascript
const venueConflict = await CourseToVenueTimeAssignment.findOne({
  venueId,        // Same venue
  timeSlotId,     // Same time
  dayOfWeek,      // Same day
  isScheduled: true,
});
```

**Example:** If "Lecture Hall A" is already booked for CSC 301 on Monday 09:00–10:00, the system will prevent assigning another course to the same venue at the same time.

### 16.3 Type 2: Lecturer Conflict (`LECTURER_CONFLICT`)

```javascript
if (lecturerId) {
  const lecturerConflict = await CourseToVenueTimeAssignment.findOne({
    _id: { $ne: excludeAssignmentId },
    lecturerId,     // Same lecturer
    timeSlotId,     // Same time
    dayOfWeek,      // Same day
    isScheduled: true,
  });
}
```

**Example:** Prevents a lecturer from teaching two separate courses at the same time on the same day.

### 16.4 Type 3: Multi-Department Cohort Clash (`COHORT_CONFLICT`)

```javascript
// Check all assignments in the target day and timeslot
const sameSlotAssignments = await CourseToVenueTimeAssignment.find({
  _id: { $ne: excludeAssignmentId },
  timeSlotId,
  dayOfWeek,
  isScheduled: true,
}).populate("courseId", "code title level departments");

for (const a of sameSlotAssignments) {
  if (a.courseId && a.courseId.level === course.level) {
    const existingDepts = a.courseId.departments || [];
    const overlap = courseDepts.filter((d) => existingDepts.includes(d));
    if (overlap.length > 0) {
      conflicts.push({
        type: "COHORT_CONFLICT",
        message: `Student cohort conflict: Course ${course.code} and ${a.courseCode} both serve students in [${overlap.join(", ")}] at ${course.level} Level.`,
      });
    }
  }
}
```

**Example:** If `MTH 201` is taken by students in `Computer Science` and `Cyber Security` at `200L` on Monday 09:00, the system prevents scheduling `CSC 201` (offered by `Computer Science`) at that same hour. However, `CSS 201` (Cyber Security) and `SE 201` (Software Engineering) can run simultaneously in separate halls because their student cohorts are disjoint.

### 16.5 Type 4: Time Slot Capacity Limit (`SLOT_CAPACITY_EXCEEDED`)

```javascript
const existingCount = await CourseToVenueTimeAssignment.countDocuments({
  _id: { $ne: excludeAssignmentId },
  timeSlotId,
  dayOfWeek,
  isScheduled: true,
});

if (existingCount >= 5) {
  conflicts.push({
    type: "SLOT_CAPACITY_EXCEEDED",
    message: `Maximum capacity reached: This time slot already has ${existingCount} concurrent lectures (maximum is 5).`,
  });
}
```

**Example:** Enforces a departmental policy cap of at most 5 concurrent lectures in any single hour slot.

### 16.6 Conflict Resolution & Move Operations

When a conflict is detected:
1. The operation is **blocked** with an explicit error detailing the overlapping courses or venues.
2. The Timetable Officer can choose a different slot or venue.
3. During **Move / Reschedule**, the system passes `excludeAssignmentId: currentAssignment._id` so the course does not conflict with its own existing record.
4. Timetable Officers can check **"Override Conflict"** for non-capacity conflicts when authorized (logged for audit).

---

## 17. Module 10: Real-Time Notifications

**Backend:** `backend/controllers/notificationController.js`, `backend/routes/notifications.js`, `backend/models/Notification.js`  
**Frontend:** `frontend/src/context/SocketContext.jsx`

### 17.1 How It Works

The system uses **HTTP polling** instead of WebSockets for compatibility with Vercel's serverless architecture. The frontend periodically asks the server for new notifications rather than maintaining a persistent connection.

### 17.2 Notification Flow

1. When a new staff account is registered, the auth controller calls `createNotification()`
2. The notification is stored as a MongoDB document with type, message, user data, and timestamp
3. The frontend polls `GET /api/notifications?since=<timestamp>` every 30 seconds
4. The server returns only notifications created after the `since` timestamp
5. New notifications are displayed as toast popups and appear in the bell dropdown

### 17.3 Notification Model (`backend/models/Notification.js`)

```javascript
{
  type: String,       // "new-user", "assignment", "conflict"
  message: String,    // "New staff registered: John Doe (Lecturer)"
  userData: Object,   // { email, role, fullName } — who triggered the notification
  readBy: [ObjectId], // Array of user IDs who have read this notification
  targetRole: String, // "Admin" — which role should see this
  createdAt: Date,    // Auto-timestamp
}
```

### 17.4 Polling Logic (`frontend/src/context/SocketContext.jsx`)

```javascript
const POLL_INTERVAL = 30000; // 30 seconds

useEffect(() => {
  // Initial fetch with 2s delay to let the page load
  const initialTimer = setTimeout(pollNotifications, 2000);
  const interval = setInterval(pollNotifications, POLL_INTERVAL);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(interval);
  };
}, []);

async function pollNotifications() {
  const params = lastPollRef.current
    ? { since: lastPollRef.current }
    : {};
  const { data } = await api.get("/notifications", { params });

  if (data.notifications.length > 0) {
    // Show toast for each new notification
    data.notifications.forEach(n => showInfo(n.message, { duration: 6000 }));
  }
}
```

### 17.5 Frontend Notification UI

- **Bell icon** (`FiBell`) in the sidebar header — always visible
- **Unread count badge** — red circle with number of unread notifications
- **Dropdown panel** — shows notification messages with relative timestamps
- **Auto-mark-as-read** — when the dropdown opens, all visible notifications are marked read via `PUT /api/notifications/read`
- **Clear all button** — deletes all read notifications via `DELETE /api/notifications`
- **Connection status dot** — always green (HTTP polling is inherently connected)

### 17.6 Why Polling Instead of WebSockets?

When the application moved from Railway to Vercel for deployment, Socket.IO had to be replaced because:
- Vercel's serverless functions cannot maintain persistent WebSocket connections
- Each serverless invocation is stateless and short-lived
- HTTP polling works perfectly with serverless architecture
- 30-second polling is responsive enough for notification delivery

### 17.7 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/notifications` | JWT | Get notifications (optional `since` param for polling) |
| `PUT` | `/api/notifications/read` | JWT | Mark all notifications as read |
| `DELETE` | `/api/notifications` | JWT | Clear all read notifications |

---

## 18. Module 11: Audit Logging System

**Backend:** `backend/models/AuditLog.js`, `backend/middleware/audit.js`

### 18.1 Purpose

Every significant action in the system is automatically logged with details about who performed it, what they did, and when. This creates an **audit trail** for accountability.

### 18.2 What Gets Logged

| Action | Example |
|--------|---------|
| Create | "Admin created user Dr. Jane Doe (Lecturer)" |
| Update | "Exam Officer updated CSC 301 credit units from 2 to 3" |
| Delete | "Admin deleted venue Lecture Hall C" |
| Login | "Dr. Ibrahim logged in from IP 192.168.1.100" |
| Role Assignment | "Admin assigned HOD role to Dr. Smith (previous HOD demoted to Lecturer)" |

### 18.3 Log Entry Structure

```javascript
{
  timestamp: "2026-06-10T10:30:00Z",     // When
  userId: "60...",                        // Who
  userEmail: "admin@futminna.edu.ng",
  userRole: "Admin",
  actionType: "Create",                   // What kind
  entityType: "Course",                   // What was affected
  entityId: "60...",                      // Which record
  details: {                              // What exactly
    code: "CSC 301",
    title: "Software Engineering"
  },
  ipAddress: "192.168.1.100"             // Where from
}
```

### 18.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/audit-log` | View audit log (Admin only) |
| `GET` | `/api/admin/system-health` | System health metrics |

---

## 19. Module 12: AI Integration — Google Gemini

**Backend files:** `backend/services/aiService.js`, `backend/controllers/aiController.js`, `backend/routes/ai.js`  
**Frontend files:** `frontend/src/components/AiAssistant.jsx`, `AiSuggestionBanner.jsx`, `AiWorkloadInsights.jsx`

### 19.1 Overview

The system integrates **Google's Gemini AI** to provide intelligent assistance across four key areas. Gemini is a large language model (LLM) similar to GPT — it understands natural language and can analyze structured data to provide insights and recommendations.

**Why Gemini?** Google offers a generous free tier (1,500 requests per day), a well-documented Node.js SDK, and excellent performance for text analysis tasks.

### 19.2 AI Service Architecture

```
Frontend (React)                                    Backend (Node.js)
     │                                                   │
     │ POST /api/ai/suggest                              │
     │ POST /api/ai/resolve                              │
     │ GET  /api/ai/workload                             │
     │ POST /api/ai/chat                                 │
     │                                                   │
     ▼                                                   ▼
┌─────────────────┐                           ┌─────────────────────┐
│  Frontend UI     │                           │  aiController.js    │
│  • Chat widget   │                           │  Gathers context    │
│  • Suggestion    │                           │  from MongoDB       │
│    banner        │                           │                     │
│  • Workload      │                           ▼                     │
│    dashboard     │                     ┌─────────────────────┐     │
└─────────────────┘                     │  aiService.js       │     │
                                         │  Sends prompt to   │     │
                                         │  Gemini API         │     │
                                         └─────────┬───────────┘     │
                                                   │                  │
                                                   ▼                  │
                                         ┌─────────────────┐         │
                                         │  Google Gemini   │         │
                                         │  (gemini-1.5-    │         │
                                         │   flash)         │         │
                                         └─────────────────┘         │
```

### 19.3 The Four AI Features

#### Feature 1: Smart Schedule Suggestions (`POST /api/ai/suggest`)

**What it does:** When the Timetable Officer clicks "🧠 AI Suggest" on the Schedule Planning page, the system:
1. Gathers all unscheduled courses, available venues, time slots, and the existing schedule
2. Sends this data to Gemini with a prompt asking for optimal placements
3. Gemini analyzes constraints (venue availability, lecturer conflicts, level conflicts)
4. Returns up to 5 suggestions with venue, day, time, and a reason

**The prompt template structure:**
```
You are an expert university timetable scheduling assistant...

## UNSCHEDULED COURSES
[list of courses needing placement]

## AVAILABLE VENUES
[list of rooms]

## EXISTING SCHEDULE
[current bookings]

## CONSTRAINTS
- No double-booking venues
- No lecturer conflicts
- Same-level courses ideally not simultaneous

## YOUR TASK
Suggest up to 5 practical placements as JSON...
```

#### Feature 2: Conflict Resolution (`POST /api/ai/resolve`)

**What it does:** When a conflict is detected (venue, lecturer, or level), the Timetable Officer can get AI-powered suggestions for alternative placements that would avoid the conflict.

The AI analyzes:
- What the conflict is
- The course being assigned
- Available alternative venues and time slots
- Suggests up to 3 alternatives

#### Feature 3: Workload Balancing (`GET /api/ai/workload`)

**What it does:** The HOD can click "🔍 Analyze" on their dashboard to get:
- **Fairness Score** — A 0–100% score displayed as an SVG circular gauge
- **Overloaded Lecturers** — Those exceeding the maximum course load
- **Underloaded Lecturers** — Those with significantly fewer courses
- **Rebalancing Suggestions** — Specific reassignment recommendations
- **Overall Insight** — A summary of the workload distribution

The system sends the current workload data to Gemini, which analyzes the distribution and returns structured JSON with insights.

#### Feature 4: AI Chat Assistant (`POST /api/ai/chat`)

**What it does:** A floating chat widget available on every page. Users can ask questions like:
- "What courses are scheduled today?"
- "Which venues are free on Monday morning?"
- "Show me Dr. Ibrahim's schedule"
- "How many courses are unscheduled?"

**How it works (RAG-style):**
1. User types a question
2. Backend gathers current schedule data (courses, venues, lecturers, time slots)
3. Sends the question + data to Gemini with instructions to answer using ONLY the provided data
4. Gemini returns a natural language answer
5. Frontend displays the answer in the chat panel

This is called **Retrieval-Augmented Generation (RAG)** — the AI retrieves relevant data from the database and uses it as context for generating an answer. This prevents the AI from making up information (hallucinations).

### 19.4 The Gemini Client (`backend/services/aiService.js`)

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

async function generate(prompt, temperature = 0.3) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: 2048 },
  });
  return result.response.text();
}
```

**What is temperature?** It controls how "creative" the AI's responses are. Lower values (0.1–0.3) produce more deterministic, focused outputs — ideal for scheduling suggestions. Higher values (0.7–1.0) produce more varied, creative outputs — suitable for the chat assistant.

### 19.5 Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| **AiAssistant** | `AiAssistant.jsx` | Floating chat widget with FAB button, message history, quick questions, expand/collapse |
| **AiSuggestionBanner** | `AiSuggestionBanner.jsx` | Cards showing AI schedule suggestions with "Apply This" button |
| **AiWorkloadInsights** | `AiWorkloadInsights.jsx` | Workload analysis with fairness gauge, overloaded/underloaded lists, rebalancing suggestions |

### 19.6 Setup Required

Add your Google Gemini API key to `.env.local` at the project root:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

Get a free API key at [ai.google.dev](https://ai.google.dev).

---

## 20. Security Implementation

### 20.1 Authentication — JWT (JSON Web Tokens)

A JWT is a string that cryptographically proves a user's identity. It has three parts:
```
header.payload.signature
```

The **header** specifies the algorithm (HS256). The **payload** contains user data (ID, role). The **signature** is created using the server's secret key — if anyone modifies the payload, the signature becomes invalid.

**Session durations:**
- Standard login: 12 hours
- "Remember Me": 30 days

### 20.2 Password Security — bcrypt

Bcrypt is a **password hashing algorithm** — it converts a password into a scrambled string that cannot be reversed. When a user logs in, the system hashes the entered password and compares it to the stored hash.

Key features:
- **Salt rounds (10):** The algorithm runs 2^10 = 1,024 iterations, making brute-force attacks slow
- **`select: false`:** The password field is excluded from database queries by default — it's only fetched when needed
- **Minimum 8 characters:** Enforced at the schema level

### 20.3 Account Protection

- **First-time login flag (`mustChangePassword`):** New accounts must change their password on first login
- **Account deactivation:** Deactivated users receive a 403 error on login attempt
- **Admin protection:** You cannot deactivate or reassign Admin accounts
- **Password reset:** Time-limited tokens (24-hour expiry)

### 20.4 API Security

- **CORS whitelist:** Only specified origins can access the API (configured via `CORS_ORIGIN`)
- **Role authorization:** Every protected endpoint validates the user's role
- **Input validation:** Mongoose schema validation ensures data integrity
- **Error handling:** A global error handler prevents stack traces from being exposed

---

## 21. Environment Configuration

### 21.1 Single Environment File (`.env.local` at Project Root)

The application uses a single `.env.local` file at the **project root**, combining both backend and frontend environment variables. This file is automatically loaded by Vite (frontend) and explicitly loaded by dotenv (backend).

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_URL` | MongoDB Atlas connection string | ✅ Yes | — |
| `JWT_SECRET` | Secret key for signing JWTs | ✅ Yes | — |
| `VITE_API_URL` | Backend API base URL (frontend) | No | `http://localhost:5000/api` |
| `JWT_EXPIRE` | Standard JWT expiry | No | `12h` |
| `JWT_REFRESH_EXPIRE` | "Remember Me" expiry | No | `30d` |
| `BCRYPT_SALT_ROUNDS` | Password hash complexity | No | `10` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | No | `http://localhost:5173` |
| `PORT` | Server port | No | `5000` |
| `NODE_ENV` | Environment mode | No | `development` |
| `MAX_COURSES_PER_LECTURER` | Workload limit | No | `4` |
| `MAX_LOGIN_ATTEMPTS` | Failed attempts before lockout | No | `5` |
| `LOGIN_LOCKOUT_MINUTES` | Lockout duration | No | `15` |
| `GOOGLE_API_KEY` | Google Gemini API key | For AI features | — |

### 21.2 Where the File Lives

```
project-root/
├── .env.local          ← Single environment file (gitignored)
├── backend/
│   ├── .env.example    ← Template showing all available vars
│   └── ...
├── frontend/
│   └── ...
└── ...
```

### 21.3 How Each Part Loads It

- **Frontend (Vite):** Automatically — Vite loads `.env.local` at project root and exposes `VITE_*` variables to the React app via `import.meta.env`
- **Backend (Express):** Explicitly — each entry point (`app.js`, `server.js`, seed scripts) calls `dotenv.config({ path: path.join(import.meta.dirname, "..", ".env.local") })`

### 21.4 Validation on Startup

The server validates that critical variables (JWT_SECRET, DB_URL) exist on startup. If they're missing, the server crashes immediately with a clear error message. The Google API key is optional — it shows a warning but doesn't prevent the server from starting.

---

## 22. Complete API Reference

### Authentication

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/auth/register` | JWT | Admin | Register new user |
| `POST` | `/api/auth/login` | Public | — | Login |
| `POST` | `/api/auth/forgot-password` | Public | — | Request password reset |
| `POST` | `/api/auth/reset-password` | Public | — | Reset password with token |
| `GET` | `/api/auth/me` | JWT | All | Get current user |
| `PUT` | `/api/auth/profile` | JWT | All | Update profile |
| `POST` | `/api/auth/change-password` | JWT | All | Change password |

### Users

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/users` | JWT | Admin | List users |
| `GET` | `/api/users/lecturers` | JWT | Admin, HOD, Timetable Officer | Get teaching staff |
| `GET` | `/api/users/role-assignments` | JWT | Admin | Get role holders |
| `POST` | `/api/users/assign-role` | JWT | Admin | Assign single-occupant role |
| `GET` | `/api/users/:id` | JWT | Admin | Get user |
| `PUT` | `/api/users/:id` | JWT | Admin | Update user |
| `DELETE` | `/api/users/:id` | JWT | Admin | Delete user |
| `PATCH` | `/api/users/:id/deactivate` | JWT | Admin | Deactivate user |
| `PATCH` | `/api/users/:id/activate` | JWT | Admin | Reactivate user |

### Courses

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/courses` | JWT | All | List courses |
| `GET` | `/api/courses/:id` | JWT | All | Get course |
| `POST` | `/api/courses` | JWT | Admin, Exam Officer | Create course |
| `PUT` | `/api/courses/:id` | JWT | Admin, Exam Officer | Update course |
| `DELETE` | `/api/courses/:id` | JWT | Admin, Exam Officer | Delete course |

### Venues

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/venues` | JWT | All | List venues |
| `GET` | `/api/venues/:id` | JWT | All | Get venue |
| `GET` | `/api/venues/:id/schedule` | JWT | All | Get venue schedule |
| `POST` | `/api/venues` | JWT | Admin | Create venue |
| `PUT` | `/api/venues/:id` | JWT | Admin, Timetable Officer | Update venue |
| `DELETE` | `/api/venues/` | JWT | Admin | Delete venue |

### Time Slots

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/timeslots` | JWT | All | List slots |
| `GET` | `/api/timeslots/:id` | JWT | All | Get slot |
| `POST` | `/api/timeslots` | JWT | Admin, Timetable Officer | Create slot |
| `POST` | `/api/timeslots/batch` | JWT | Admin, Timetable Officer | Batch create |
| `PUT` | `/api/timeslots/:id` | JWT | Admin, Timetable Officer | Update slot |
| `DELETE` | `/api/timeslots/:id` | JWT | Admin, Timetable Officer | Delete slot |

### Assignments

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/assignments/course-to-lecturer` | JWT | Admin, HOD | List course→lecturer |
| `POST` | `/api/assignments/course-to-lecturer` | JWT | Admin, HOD | Create course→lecturer |
| `DELETE` | `/api/assignments/course-to-lecturer/:id` | JWT | Admin, HOD | Delete assignment |
| `POST` | `/api/assignments/check-conflict` | JWT | Admin, Timetable Officer | Check schedule conflict |
| `POST` | `/api/assignments/course-to-venue-time` | JWT | Admin, Timetable Officer | Create schedule |
| `DELETE` | `/api/assignments/course-to-venue-time/:id` | JWT | Admin, Timetable Officer | Delete schedule |
| `GET` | `/api/assignments/schedule` | JWT | All | Get schedule |
| `GET` | `/api/assignments/unscheduled` | JWT | Admin, HOD, Timetable Officer | Get unscheduled |
| `GET` | `/api/assignments/lecturer/:lecturerId/schedule` | JWT | All | Get lecturer schedule |

### Dashboard, Reports & Admin

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/dashboard/stats` | JWT | All | Role-specific dashboard stats |
| `GET` | `/api/admin/system-health` | JWT | Admin | System health metrics |
| `GET` | `/api/admin/audit-log` | JWT | Admin | Audit log |
| `GET` | `/api/admin/workload-report` | JWT | Admin | Lecturer workload |
| `GET` | `/api/admin/venue-utilization` | JWT | Admin | Venue utilization |
| `POST` | `/api/reports/semester-schedule` | JWT | Admin, HOD, Exam Officer, Timetable Officer | Schedule report |
| `GET` | `/api/reports/conflicts` | JWT | Admin, HOD, Timetable Officer | Conflict report |

### AI Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/ai/suggest` | JWT | All | AI schedule suggestions |
| `POST` | `/api/ai/resolve` | JWT | All | AI conflict resolution |
| `GET` | `/api/ai/workload` | JWT | All | AI workload analysis |
| `POST` | `/api/ai/chat` | JWT | All | AI chat assistant |

---

## 23. Deployment

### 23.1 Platform: Vercel

The application is deployed on **[Vercel](https://vercel.com)** — a Platform-as-a-Service that excels at frontend hosting and supports serverless Node.js functions.

**Why Vercel?**

| Requirement | How Vercel Handles It |
|-------------|----------------------|
| React + Vite frontend | Native framework detection — zero config deployment |
| Node.js API backend | Serverless Functions (`api/` directory) — auto-scaled |
| Free tier | Generous free tier — 100GB bandwidth, 60 build hours/month |
| Global CDN | Automatic edge caching for static assets |
| Custom domains | Built-in SSL + custom domain support |
| MongoDB | Connect to MongoDB Atlas (external) via environment variables |
| Deployment trigger | Auto-deploys on push to GitHub |

### 23.2 Deployment Architecture

On Vercel, the application runs as **serverless functions** rather than a long-running server:

```
GitHub Repo → Vercel Project
                │
                ├── Frontend (Static)
                │   ├── Build: npm run build (Vite → dist/)
                │   └── Served: dist/ on Vercel's CDN
                │
                └── Backend (Serverless Function)
                    ├── Entry: api/index.js → imports backend/app.js
                    └── Routes: vercel.json rewrites /api/* → /api
```

### 23.3 Why Serverless Architecture?

Unlike traditional hosting where a Node.js server runs continuously, Vercel invokes backend functions on-demand:

- **Cold start:** First request after inactivity triggers a function spin-up (~1-2s)
- **Stateless:** Each invocation is independent — no persistent server process
- **Auto-scaling:** Handles traffic spikes by creating more function instances
- **No Socket.IO:** WebSockets require persistent connections, which serverless doesn't support. Notifications use HTTP polling instead.

### 23.4 Files for Deployment

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel configuration — build command, function settings, URL rewrites |
| `api/index.js` | Vercel serverless function entry point (imports `backend/app.js`) |
| `backend/app.js` | Express app exported as default (shared between local dev and Vercel) |
| `backend/.env.example` | Template showing all required environment variables |

### 23.5 Code Architecture for Vercel

The backend is split into three files:

**`backend/app.js`** — The Express application (routes, middleware, static serving) exported as default:
```javascript
dotenv.config({ path: path.join(import.meta.dirname, "..", ".env.local") });
// ... all app setup ...
export default app;
```

**`api/index.js`** — The Vercel serverless function entry point:
```javascript
import app from "../backend/app.js";
export default app;
```

**`backend/server.js`** — For local development only (creates HTTP server):
```javascript
import app from "./app.js";
// Creates HTTP server and listens on PORT
```

**`vercel.json`** — Routes configuration:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": { "api/index.js": { "maxDuration": 30 } },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 23.6 How to Deploy to Vercel

**Step 1: Push your code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

**Step 2: Create a Vercel project**
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel automatically detects the framework and uses `vercel.json` configuration

**Step 3: Create a MongoDB Atlas database**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster (M0 Sandbox — 512MB storage)
3. Create a database user with password
4. Whitelist all IPs (0.0.0.0/0) for Vercel compatibility
5. Click "Connect" → "Drivers" → copy the connection string

**Step 4: Configure environment variables**
In the Vercel dashboard, go to your project → "Settings" → "Environment Variables" and add:

| Variable | Value |
|----------|-------|
| `DB_URL` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (at least 32 characters) |
| `JWT_EXPIRE` | `12h` |
| `JWT_REFRESH_EXPIRE` | `30d` |
| `BCRYPT_SALT_ROUNDS` | `10` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` (your Vercel domain) |
| `VITE_API_URL` | `https://your-app.vercel.app/api` (your Vercel domain + `/api`) |
| `GOOGLE_API_KEY` | Your Gemini API key (optional, for AI features) |

> See `backend/.env.example` for the full list of available variables.

**Step 5: Deploy**
1. Vercel will automatically build (`npm run build`) and deploy
2. The frontend is served from Vercel's CDN
3. API requests to `/api/*` are handled by the serverless function
4. Click "Domains" to set up a custom domain

**Step 6: Seed the admin account**
```bash
# From your local machine, using your production MongoDB URI:
DB_URL="<your-atlas-connection-string>" SEED_ADMIN_PASSWORD="<a strong password>" node backend/seed/admin.js
```

Or run the seed locally and point to the same MongoDB Atlas cluster.

---

## 24. How to Run the Application

### 24.1 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local or Atlas) — or any MongoDB-compatible database

### 24.2 Setup Steps

**Step 1: Clone the project**
```bash
git clone <repository-url>
cd <project-folder>
```

**Step 2: Install dependencies**
```bash
npm install
```

**Step 3: Configure environment**
Create `.env.local` at the project root with your environment variables. You can use `.env.example` as a reference:
```bash
# See .env.example for the full list of variables
# Create .env.local at the project root:
cat > .env.local << EOF
DB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/futminna
JWT_SECRET=<your-secure-random-string>
SEED_ADMIN_PASSWORD=<password-for-the-demo-admin>
SEED_USER_PASSWORD=<password-for-the-other-demo-accounts>
JWT_EXPIRE=12h
JWT_REFRESH_EXPIRE=30d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
PORT=5000
VITE_API_URL=http://localhost:5000/api
EOF
```

Then fill in your MongoDB connection string, a strong JWT secret and the demo account passwords.

> **Getting a Google Gemini API key** (optional, for AI features):
> 1. Go to [ai.google.dev](https://ai.google.dev)
> 2. Click "Get API key" → Create API key
> 3. Add `GOOGLE_API_KEY=<your-key>` to `.env.local`

**Step 4: Create the admin account**
```bash
node backend/seed/admin.js
```

This creates the initial admin user (`admin@futminna.edu.ng`) with the password you set as `SEED_ADMIN_PASSWORD`.

**Step 5: Start the backend**
```bash
node backend/server.js
# Server runs on http://localhost:5000
```

**Step 6: Start the frontend** (in a separate terminal)
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

**Step 7: Login**

Open [http://localhost:5173](http://localhost:5173) and sign in with the admin account created in Step 4.

From the Admin dashboard, register staff accounts with the appropriate roles. Each staff member can then log in with their own credentials.

### 24.3 Development Commands

```bash
npm run dev          # Start frontend only (Vite dev server)
npm run dev:backend  # Start backend only
npm run dev:both     # Start both (Linux/Mac)
npm run build        # Build frontend for production  
npm start            # Start backend in production mode
```

### 24.4 Environment File Structure

```
project-root/
├── .env.local           ← YOUR env vars (gitignored, created by you)
├── backend/
│   ├── .env.example     ← Template showing all available vars (reference only)
│   └── ...
├── frontend/
│   └── ...
└── ...
```

The single `.env.local` at the project root is used by both:
- **Vite** (frontend) — loads automatically, exposes `VITE_*` vars
- **Node.js/dotenv** (backend) — loaded explicitly by `dotenv.config({ path: ".../.env.local" })`

---

*End of documentation — this document covers all modules, features, and implementation details of the FUT Minna Lecture Scheduling System.*
