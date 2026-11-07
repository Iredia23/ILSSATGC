import express from "express";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  unlockUser,
  getLecturers,
  getRoleAssignments,
  assignRole,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Get lecturers (for dropdowns) - must be before /:id
router.get("/lecturers", authorizeRoles("Admin", "HOD", "Timetable Officer", "Lecturer"), getLecturers);

// Admin-only routes
router.get("/", authorizeRoles("Admin"), getAllUsers);
router.get("/role-assignments", authorizeRoles("Admin"), getRoleAssignments);
router.get("/:id", getUser);
router.put("/:id", authorizeRoles("Admin"), updateUser);
router.delete("/:id", authorizeRoles("Admin"), deleteUser);
router.patch("/:id/deactivate", authorizeRoles("Admin"), deactivateUser);
router.patch("/:id/activate", authorizeRoles("Admin"), activateUser);
router.patch("/:id/unlock", authorizeRoles("Admin"), unlockUser);
router.post("/assign-role", authorizeRoles("Admin"), assignRole);

export default router;
