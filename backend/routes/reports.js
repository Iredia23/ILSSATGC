import express from "express";
import {
  getSemesterScheduleReport,
  getConflictReport,
} from "../controllers/reportController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All report routes require authentication
router.use(protect);

router.post(
  "/semester-schedule",
  authorizeRoles("Admin", "HOD", "Exam Officer", "Timetable Officer"),
  getSemesterScheduleReport
);

router.get(
  "/conflicts",
  authorizeRoles("Admin", "HOD", "Timetable Officer"),
  getConflictReport
);

export default router;
