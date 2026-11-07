import express from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/academicController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getDepartments);
router.post("/", authorizeRoles("Admin"), createDepartment);
router.put("/:id", authorizeRoles("Admin"), updateDepartment);
router.delete("/:id", authorizeRoles("Admin"), deleteDepartment);

export default router;
