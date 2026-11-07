import express from "express";
import {
  getNotifications,
  markAllRead,
  clearNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markAllRead);
router.delete("/", protect, clearNotifications);

export default router;
