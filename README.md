# Integrated Lecture Scheduling System with Automated Timetable Generation Capabilities

A web application for **Federal University of Technology, Minna (FUT Minna)** that automates course allocation and timetable generation across all schools and departments. Built as a final-year project with Computer Science (School of Information and Communication Technology, SICT) as the case study, the system is designed for the full institution.

**Core workflow:** Exam Officer creates courses → HOD allocates lecturers → Timetable Officer generates the timetable (auto or manual) → Lecturers see their personal schedules.

## ✨ Key Features

- **Role-based access** — Admin, HOD, Exam Officer, Timetable Officer, Lecturer. Roles are unique, and Admin can perform all core functions.
- **Automatic timetable solver** — places courses into conflict-free slots and **flags unplaced courses with the exact reason** for manual resolution.
- **Constraint enforcement** — a venue cannot host two courses at the same time, one lecturer cannot teach two courses at once, max 5 lectures per time slot, and multi-department shared-course cohort clashes are prevented.
- **Manual scheduling** — the Timetable Officer can assign, move, add, or remove courses per time slot; unscheduled/under-quota courses are always visible.
- **Venue management & utilization reports**, session hours, course management, staff management with account **lock/unlock**, dashboards per role, and CSV export of lecturer schedules.
- **Locally deployed** — runs entirely on your machine (no hosting needed). Uses the cloud MongoDB by default; an optional **offline mode** embeds a local database with no MongoDB install.

## 🚀 Quick Start

> The app runs locally and connects to the cloud MongoDB database set in your `.env.local` — **no database install and no large download**. Internet is needed to log in. (An optional fully-offline mode exists — see below.)

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Create your settings file, then fill in your own MongoDB URL,
#    JWT secret and Gemini API key (never commit .env.local)
cp .env.example .env.local

# 3. Start everything — backend API + frontend
npm run dev:both
```

Then open **http://localhost:5173** and log in.


### What happens on the first run

1. The app connects to the MongoDB Atlas database configured in `.env.local` (`DB_URL`).
2. If the database is **empty**, demo users and demo data are seeded automatically — 8 schools, all departments, **55 courses**, **10 venues**, **9 time slots**, lecturer assignments, and an auto-generated 1st-semester timetable — so dashboards show real numbers. (Existing databases are never touched.)

### Offline mode (no internet, embedded database)

If the app must work with **no internet at all**, run it with an embedded local database — no MongoDB install required:

```bash
DB_PROVIDER=local npm run dev:both
```

- On the **very first offline run**, the MongoDB binary is downloaded once (~780 MB) and cached; after that it is fully offline.
- Data persists in the project's `.localdb/` folder (auto-created, git-ignored).
- Demo users + demo data are auto-seeded on a fresh database, just like cloud mode.

### Useful commands

```bash
npm run dev:both     # backend (:5000) + frontend (:5173) together
npm run dev:backend  # backend only
npm run dev          # frontend only
npm run seed:demo    # (re)seed demo courses/venues/timetable (idempotent)
npm run seed:users   # wipe & reseed user accounts
npm run build        # production build (served by the backend at :5000)
```

### Resetting the database

- **Cloud mode:** run `npm run seed:users` to wipe and reseed the user accounts; `npm run seed:demo` re-seeds courses/venues/timetable (idempotent).
- **Offline mode:** stop the app, delete the `.localdb/` folder, and run again — everything is re-created fresh.

### Environment notes


- **Default = cloud (Atlas):** `DB_URL` points at the hosted MongoDB; deploy to Vercel (which sets the `VERCEL` env var) and it uses the same `DB_URL` automatically.
- **Offline:** set `DB_PROVIDER=local` (or remove `DB_URL`) to use the embedded local database instead.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, react-hot-toast, react-icons |
| Backend | Node.js, Express 5, JWT auth, bcrypt |
| Database | MongoDB (Mongoose ODM) — cloud Atlas by default, or embedded locally via `mongodb-memory-server` for offline mode |
| Real-time | HTTP polling for notifications (replaced Socket.IO for serverless compatibility) |
| AI | Gemini-powered scheduling assistant (optional) |

## 📁 Project Structure

```
backend/
  config/db.js          # DB connection — cloud Atlas (default) or embedded local (offline)
  controllers/          # auth, courses, venues, assignments, reports, …
  models/               # Mongoose schemas
  routes/               # REST API routes
  seed/                 # demo users & admin seeding
frontend/src/           # React app (pages, components, context)
scripts/                # seed-demo-data.mjs (idempotent demo seeding)
software-evaluation/    # unit/integration/system testing + UAT plan & results
```
