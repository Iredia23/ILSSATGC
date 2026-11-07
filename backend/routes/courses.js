import express from "express";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All course routes require authentication
router.use(protect);

router.get("/", getCourses);
router.get("/:id", getCourse);

// Exam Officer and Admin can create courses
router.post(
  "/",
  authorizeRoles("Admin", "Exam Officer"),
  createCourse
);

// Exam Officer and Admin can update courses
router.put(
  "/:id",
  authorizeRoles("Admin", "Exam Officer"),
  updateCourse
);

// Exam Officer and Admin can delete courses
router.delete(
  "/:id",
  authorizeRoles("Admin", "Exam Officer"),
  deleteCourse
);

export default router;
