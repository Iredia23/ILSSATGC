import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["Admin", "HOD", "Exam Officer", "Timetable Officer", "Lecturer"],
      index: true,
    },
    level: {
      type: Number,
      enum: [100, 200, 300, 400, 500],
    },
    school: {
      type: String,
      default: "SICT",
    },
    department: {
      type: String,
      default: "Computer Science",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    officeLocation: {
      type: String,
      trim: true,
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    passwordResetToken: String,
    passwordResetExpire: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for common queries
userSchema.index({ role: 1, status: 1 });
userSchema.index({ fullName: "text", email: "text" });

const User = mongoose.model("User", userSchema);

export default User;
