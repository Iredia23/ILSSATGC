import express from "express";
import {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", protect, authorizeRoles("Admin"), registerUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);

export default router;
