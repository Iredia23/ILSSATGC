import express from "express";
import {
  createCourseToLecturer,
  getCourseToLecturerAssignments,
  deleteCourseToLecturer,
  checkConflict,
  createCourseToVenueTime,
  getSchedule,
  getUnscheduledCourses,
  deleteCourseToVenueTime,
  updateCourseToVenueTime,
  getLecturerSchedule,
  autoGenerateSchedule,
} from "../controllers/assignmentController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All assignment routes require authentication
router.use(protect);

// Course-to-Lecturer assignments (HOD only)
router.get(
  "/course-to-lecturer",
  authorizeRoles("Admin", "HOD"),
  getCourseToLecturerAssignments
);
router.post(
  "/course-to-lecturer",
  authorizeRoles("Admin", "HOD"),
  createCourseToLecturer
);
router.delete(
  "/course-to-lecturer/:id",
  authorizeRoles("Admin", "HOD"),
  deleteCourseToLecturer
);

// Course-to-Venue-Time assignments (Timetable Officer + Admin only; HOD can view but not modify)
router.post(
  "/check-conflict",
  authorizeRoles("Admin", "Timetable Officer"),
  checkConflict
);
router.post(
  "/course-to-venue-time",
  authorizeRoles("Admin", "Timetable Officer"),
  createCourseToVenueTime
);
router.put(
  "/course-to-venue-time/:id",
  authorizeRoles("Admin", "Timetable Officer"),
  updateCourseToVenueTime
);
router.post(
  "/auto-generate",
  authorizeRoles("Admin", "Timetable Officer"),
  autoGenerateSchedule
);
router.delete(
  "/course-to-venue-time/:id",
  authorizeRoles("Admin", "Timetable Officer"),
  deleteCourseToVenueTime
);

// Schedule views
router.get("/schedule", getSchedule);
router.get("/unscheduled", authorizeRoles("Admin", "HOD", "Timetable Officer"), getUnscheduledCourses);

// Lecturer schedule
router.get("/lecturer/:lecturerId/schedule", getLecturerSchedule);

export default router;
