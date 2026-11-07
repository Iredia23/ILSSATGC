import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
    },
    userRole: {
      type: String,
      index: true,
    },
    actionType: {
      type: String,
      required: [true, "Action type is required"],
      enum: [
        "Create",
        "Read",
        "Update",
        "Delete",
        "Login",
        "Logout",
        "Download",
        "Password Reset",
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: [true, "Entity type is required"],
      enum: ["User", "Course", "Venue", "TimeSlot", "Assignment", "System"],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    statusCode: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index for efficient audit queries
auditLogSchema.index({ timestamp: 1, actionType: 1, entityType: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
