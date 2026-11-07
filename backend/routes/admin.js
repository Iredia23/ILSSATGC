import express from "express";
import {
  getSystemHealth,
  getAuditLog,
  getWorkloadReport,
  getVenueUtilization,
} from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and Admin role
router.use(protect);
router.use(authorizeRoles("Admin"));

router.get("/system-health", getSystemHealth);
router.get("/audit-log", getAuditLog);
router.get("/workload-report", getWorkloadReport);
router.get("/venue-utilization", getVenueUtilization);

export default router;
