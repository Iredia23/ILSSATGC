import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["new-user", "info", "warning"],
      default: "info",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    userData: {
      fullName: String,
      email: String,
      role: String,
    },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
    targetRole: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetRole: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
