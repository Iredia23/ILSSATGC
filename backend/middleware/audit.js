import AuditLog from "../models/AuditLog.js";

/**
 * Log an action to the audit trail
 * @param {Object} params - Log parameters
 */
export const logAudit = async ({
  userId,
  userEmail,
  userRole,
  actionType,
  entityType,
  entityId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
  statusCode = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      userEmail,
      userRole,
      actionType,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
      statusCode,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

/**
 * Middleware to auto-log requests (attach to routes that need logging)
 */
export const auditMiddleware = (actionType, entityType) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (data) {
      // Log after response
      logAudit({
        userId: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        actionType,
        entityType,
        entityId: req.params?.id || data?._id || null,
        details: {
          method: req.method,
          path: req.originalUrl,
          body: req.method !== "GET" ? req.body : undefined,
          responseStatus: res.statusCode,
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        statusCode: res.statusCode,
      });

      return originalJson(data);
    };

    next();
  };
};
