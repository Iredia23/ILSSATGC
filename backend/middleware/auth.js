import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect routes - verify JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (req.user.status === "Inactive") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Please contact the administrator.",
      });
    }

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token invalid" });
  }
};

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @param {boolean} rememberMe - Whether to extend expiration
 * @returns {string} JWT token
 */
export const generateToken = (user, rememberMe = false) => {
  const expiresIn = rememberMe
    ? process.env.JWT_REFRESH_EXPIRE
    : process.env.JWT_EXPIRE;
  return jwt.sign(
    { id: user._id || user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};
