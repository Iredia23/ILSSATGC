import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateToken } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";
import { createNotification } from "./notificationController.js";

/**
 * @desc    Register a new user (Admin only)
 * @route   POST /api/auth/register
 */
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, role, school, department, phone, officeLocation, staffId } = req.body;

    const validRoles = ["Admin", "HOD", "Exam Officer", "Timetable Officer", "Lecturer"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Must be one of: " + validRoles.join(", "),
      });
    }

    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User with this email already exists" });
    }

    // Enforce role uniqueness for singleton roles (Admin is institution-wide;
    // HOD / Exam Officer / Timetable Officer are unique per department)
    const SINGLETON_ROLES = ["Admin", "HOD", "Exam Officer", "Timetable Officer"];
    if (role && SINGLETON_ROLES.includes(role)) {
      const roleQuery =
        role === "Admin"
          ? { role }
          : { role, department: department || "Computer Science" };
      const holder = await User.findOne(roleQuery);
      if (holder) {
        return res.status(400).json({
          success: false,
          message:
            `Role '${role}' is already held by ${holder.fullName} (${holder.email})${role === "Admin" ? "" : " for this department"}. Roles must be unique.`,
        });
      }
    }

    // Default password - user must change on first login
    const defaultPassword = "password";
    const hashed = await bcrypt.hash(defaultPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);

    const user = await User.create({
      staffId: staffId || undefined,
      fullName,
      email: email.toLowerCase(),
      password: hashed,
      role: role || "Lecturer",
      school: school || "SICT",
      department: department || "Computer Science",
      phone,
      officeLocation,
      mustChangePassword: true,
      createdBy: req.user?._id,
    });

    // Log audit
    await logAudit({
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      actionType: "Create",
      entityType: "User",
      entityId: user._id,
      details: { fullName, email, role, department },
      ipAddress: req.ip,
    });

    // Store notification for admin polling
    createNotification({
      type: "new-user",
      message: `${user.fullName} (${user.email}) registered as ${user.role}`,
      userData: { fullName: user.fullName, email: user.email, role: user.role },
      targetRole: "Admin",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully. Default password: password",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: true,
        createdAt: user.createdAt,
      },
      temporaryPassword: defaultPassword,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Login user and return JWT
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const normalizedEmail = email?.toLowerCase();

    if (!email || !password) {
      console.warn("[AUTH][LOGIN] Missing credentials", {
        emailProvided: !!email,
        passwordProvided: !!password,
        ip: req.ip,
      });
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      console.warn("[AUTH][LOGIN] User not found", {
        email: normalizedEmail,
        ip: req.ip,
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.max(1, Math.ceil((user.lockUntil - Date.now()) / 60000));
      console.warn("[AUTH][LOGIN] Account locked", {
        email: user.email,
        lockUntil: user.lockUntil,
        minutesLeft,
        ip: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: `Account is locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} or contact your administrator.`,
      });
    }

    // Check if account is deactivated
    if (user.status === "Inactive") {
      console.warn("[AUTH][LOGIN] Inactive account", {
        email: user.email,
        ip: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Please contact the administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;

      const maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      const lockoutMinutes = parseInt(process.env.LOGIN_LOCKOUT_MINUTES) || 15;

      if (user.loginAttempts >= maxLoginAttempts) {
        user.lockUntil = Date.now() + lockoutMinutes * 60 * 1000;
      }

      await user.save();

      const attemptsRemaining = Math.max(0, maxLoginAttempts - user.loginAttempts);
      const message =
        attemptsRemaining > 0
          ? `Invalid email or password. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining before your account is locked.`
          : `Account is locked for ${lockoutMinutes} minutes due to too many failed attempts.`;

      console.warn("[AUTH][LOGIN] Invalid password", {
        email: user.email,
        loginAttempts: user.loginAttempts,
        maxLoginAttempts,
        attemptsRemaining,
        locked: !!(user.lockUntil && user.lockUntil > Date.now()),
        lockUntil: user.lockUntil || null,
        ip: req.ip,
      });

      return res.status(401).json({ success: false, message });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user, rememberMe);

    console.info("[AUTH][LOGIN] Login successful", {
      email: user.email,
      role: user.role,
      rememberMe: !!rememberMe,
      ip: req.ip,
    });

    // Log audit
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      actionType: "Login",
      entityType: "User",
      entityId: user._id,
      details: { email, rememberMe },
      ipAddress: req.ip,
    });

    const expiresIn = rememberMe ? 2592000 : 43200;

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        level: user.level,
        department: user.department,
        mustChangePassword: user.mustChangePassword,
      },
      expiresIn,
    });
  } catch (err) {
    console.error("[AUTH][LOGIN] Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Request password reset token
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    // In production, send email with reset link
    // For now, return the token (remove in production)
    res.json({
      success: true,
      message: "Password reset link has been sent to your email.",
      // Remove this in production:
      resetToken,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // Set new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Log audit
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      actionType: "Password Reset",
      entityType: "User",
      entityId: user._id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Password has been reset successfully. Please login.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        level: user.level,
        department: user.department,
        status: user.status,
        phone: user.phone,
        officeLocation: user.officeLocation,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Change password (first login or self-service)
 * @route   POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const wasForced = user.mustChangePassword;
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    // Log audit
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      actionType: "Password Change",
      entityType: "User",
      entityId: user._id,
      details: { forced: wasForced },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mustChangePassword: false,
      },
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update user profile (self)
 * @route   PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { phone, officeLocation, fullName } = req.body;

    const user = await User.findById(req.user._id);
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (officeLocation !== undefined) user.officeLocation = officeLocation;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        officeLocation: user.officeLocation,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
