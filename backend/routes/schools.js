import express from "express";
import {
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from "../controllers/academicController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getSchools);
router.post("/", authorizeRoles("Admin"), createSchool);
router.put("/:id", authorizeRoles("Admin"), updateSchool);
router.delete("/:id", authorizeRoles("Admin"), deleteSchool);

export default router;
