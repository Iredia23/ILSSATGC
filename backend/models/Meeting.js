import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
      index: true,
    },
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lecturer is required"],
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: [true, "Day of week is required"],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: [true, "Time slot is required"],
      index: true,
    },
    purpose: {
      type: String,
      required: [true, "Purpose of meeting is required"],
      trim: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Pending", "Approved", "Cancelled", "Rescheduled"],
      default: "Pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up lookups and prevent overlaps
meetingSchema.index({ studentId: 1, dayOfWeek: 1, timeSlotId: 1 });
meetingSchema.index({ lecturerId: 1, dayOfWeek: 1, timeSlotId: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
