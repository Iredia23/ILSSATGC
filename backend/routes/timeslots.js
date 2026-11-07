import express from "express";
import {
  getTimeslots,
  getTimeslot,
  createTimeslot,
  createTimeslotBatch,
  updateTimeslot,
  deleteTimeslot,
} from "../controllers/timeslotController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All timeslot routes require authentication
router.use(protect);

router.get("/", getTimeslots);
router.get("/:id", getTimeslot);

// Admin and Timetable Officer can create time slots
router.post("/", authorizeRoles("Admin", "Timetable Officer"), createTimeslot);
router.post("/batch", authorizeRoles("Admin", "Timetable Officer"), createTimeslotBatch);

// Admin and Timetable Officer can update time slots
router.put("/:id", authorizeRoles("Admin", "Timetable Officer"), updateTimeslot);

// Admin and Timetable Officer can delete time slots
router.delete("/:id", authorizeRoles("Admin", "Timetable Officer"), deleteTimeslot);

export default router;
