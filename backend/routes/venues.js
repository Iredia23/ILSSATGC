import express from "express";
import {
  getVenues,
  getVenue,
  getVenueUtilization,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueSchedule,
} from "../controllers/venueController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All venue routes require authentication
router.use(protect);

router.get("/", getVenues);
// Utilization must be declared before /:id so "utilization" isn't treated as an id
router.get("/utilization", getVenueUtilization);
router.get("/:id", getVenue);
router.get("/:id/schedule", getVenueSchedule);

// Admin can create venues
router.post("/", authorizeRoles("Admin"), createVenue);

// Admin and Timetable Officer can update venues
router.put(
  "/:id",
  authorizeRoles("Admin", "Timetable Officer"),
  updateVenue
);

// Admin can delete venues
router.delete("/:id", authorizeRoles("Admin"), deleteVenue);

export default router;
