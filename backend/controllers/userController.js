import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { logAudit } from "../middleware/audit.js";

/**
 * @desc    Get all users with pagination, search, and filters
 * @route   GET /api/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      status,
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      users: users.map((u) => ({
        id: u._id,
        staffId: u.staffId,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        level: u.level,
        school: u.school,
        department: u.department,
        status: u.status,
        phone: u.phone,
        officeLocation: u.officeLocation,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        mustChangePassword: u.mustChangePassword,
        loginAttempts: u.loginAttempts,
        lockUntil: u.lockUntil || null,
        isLocked: !!(u.lockUntil && u.lockUntil > Date.now()),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 */
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        staffId: user.staffId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        level: user.level,
        school: user.school,
        department: user.department,
        status: user.status,
        phone: user.phone,
        officeLocation: user.officeLocation,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        mustChangePassword: user.mustChangePassword,
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil || null,
        isLocked: !!(user.lockUntil && user.lockUntil > Date.now()),
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update user (Admin only - can change role, status)
 * @route   PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { fullName, email, role, school, department, phone, officeLocation, status, staffId, level } =
      req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Enforce role uniqueness when the role changes (Admin is institution-wide;
    // HOD / Exam Officer / Timetable Officer are unique per department)
    const SINGLETON_ROLES = ["Admin", "HOD", "Exam Officer", "Timetable Officer"];
    if (role && role !== user.role && SINGLETON_ROLES.includes(role)) {
      const roleQuery =
        role === "Admin"
          ? { role, _id: { $ne: user._id } }
          : { role, department: user.department, _id: { $ne: user._id } };
      const holder = await User.findOne(roleQuery);
      if (holder) {
        return res.status(400).json({
          success: false,
          message: `Role '${role}' is already held by ${holder.fullName} (${holder.email}). Roles must be unique.`,
        });
      }
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (staffId !== undefined) user.staffId = staffId;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (level !== undefined) user.level = level;
    if (school) user.school = school;
    if (department) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (officeLocation !== undefined) user.officeLocation = officeLocation;
    if (status) user.status = status;

    await user.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "User",
      entityId: user._id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        staffId: user.staffId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        level: user.level,
        department: user.department,
        status: user.status,
        phone: user.phone,
        officeLocation: user.officeLocation,
      },
    });
      } catch (err) {
        console.error("Update user error:", err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    };/**
 * @desc    Unlock a locked user account (Admin only)
 * @route   PATCH /api/users/:id/unlock
 */
export const unlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const wasLocked = !!(user.lockUntil && user.lockUntil > Date.now());

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "User",
      entityId: user._id,
      details: { action: "unlocked", targetUser: user.email, wasLocked },
      ipAddress: req.ip,
    });

    console.info("[AUTH][UNLOCK] Account unlocked", {
      targetUser: user.email,
      by: req.user.email,
    });

    res.json({
      success: true,
      message: wasLocked
        ? `Account for ${user.fullName} has been unlocked.`
        : `Account for ${user.fullName} is not locked, but login attempts were reset.`,
    });
  } catch (err) {
    console.error("Unlock user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Deactivate a user account
 * @route   PATCH /api/users/:id/deactivate
 */
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "Admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot deactivate admin accounts" });
    }

    user.status = "Inactive";
    await user.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "User",
      entityId: user._id,
      details: { action: "deactivated", targetUser: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User ${user.fullName} has been deactivated.`,
    });
  } catch (err) {
    console.error("Deactivate user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Activate a user account
 * @route   PATCH /api/users/:id/activate
 */
export const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.status = "Active";
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "User",
      entityId: user._id,
      details: { action: "activated", targetUser: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User ${user.fullName} has been activated.`,
    });
  } catch (err) {
    console.error("Activate user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Delete",
      entityType: "User",
      entityId: req.params.id,
      details: { deletedUser: user.email },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get current role assignments (who holds special roles)
 * @route   GET /api/users/role-assignments
 */
export const getRoleAssignments = async (req, res) => {
  try {
    const { department } = req.query;
    const specialRoles = ["HOD", "Exam Officer", "Timetable Officer"];

    const query = { role: { $in: specialRoles } };
    if (department) query.department = department;

    const assignments = await User.find(query).select("fullName email role school department");

    // Group assignments by department
    const departmentAssignments = {};
    const roleMap = {};
    for (const role of specialRoles) {
      roleMap[role] = null;
    }

    assignments.forEach((u) => {
      const dKey = u.department || "Computer Science";
      if (!departmentAssignments[dKey]) departmentAssignments[dKey] = {};
      departmentAssignments[dKey][u.role] = {
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        school: u.school,
        department: u.department,
      };

      // Set first matching role in flat roleMap for backward compatibility
      if (!roleMap[u.role]) {
        roleMap[u.role] = {
          id: u._id,
          fullName: u.fullName,
          email: u.email,
          school: u.school,
          department: u.department,
        };
      }
    });

    res.json({
      success: true,
      assignments: roleMap,
      departmentAssignments,
    });
  } catch (err) {
    console.error("Get role assignments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Assign a special role to a user (single occupant per role PER DEPARTMENT)
 * @route   POST /api/users/assign-role
 */
export const assignRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    const validSpecialRoles = ["HOD", "Exam Officer", "Timetable Officer"];
    if (!validSpecialRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validSpecialRoles.join(", ")}`,
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (targetUser.role === "Admin") {
      return res.status(400).json({ success: false, message: "Cannot reassign an admin account" });
    }

    // Revoke the role from the current occupant IN THE SAME DEPARTMENT ONLY
    const currentOccupant = await User.findOne({
      role: newRole,
      department: targetUser.department,
      _id: { $ne: userId },
    });

    if (currentOccupant) {
      const previousOccupantName = currentOccupant.fullName;
      currentOccupant.role = "Lecturer";
      await currentOccupant.save();
      console.log(`  ↩ Revoked ${newRole} from ${previousOccupantName} in ${targetUser.department}`);
    }

    const previousRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Role Assignment",
      entityType: "User",
      entityId: targetUser._id,
      details: {
        targetUser: targetUser.email,
        department: targetUser.department,
        previousRole,
        newRole,
        revokedFrom: currentOccupant?.email || null,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `${targetUser.fullName} is now the ${newRole} for ${targetUser.department || "their department"}`,
      user: {
        id: targetUser._id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department,
      },
    });
  } catch (err) {
    console.error("Assign role error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all teaching staff (for dropdowns)
 *          Includes HOD, Exam Officer, Timetable Officer, and Lecturers
 * @route   GET /api/users/lecturers
 */
export const getLecturers = async (req, res) => {
  try {
    const teachingRoles = ["Lecturer", "HOD", "Exam Officer", "Timetable Officer"];
    const query = {
      role: { $in: teachingRoles },
      status: "Active",
    };

    if (req.query.department) {
      query.department = req.query.department;
    }

    const lecturers = await User.find(query).select("fullName email school department role");

    res.json({
      success: true,
      lecturers,
    });
  } catch (err) {
    console.error("Get lecturers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
