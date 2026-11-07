import express from "express";
import {
  getScheduleSuggestions,
  getConflictResolution,
  getWorkloadAnalysis,
  getChatResponse,
} from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// 1. Smart Schedule Suggestions
router.post("/suggest", getScheduleSuggestions);

// 2. Conflict Resolution
router.post("/resolve", getConflictResolution);

// 3. Workload Balancing Analysis
router.get("/workload", getWorkloadAnalysis);

// 4. Chat Assistant
router.post("/chat", getChatResponse);

export default router;
