import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: 0.5,
    },
    daysAvailable: {
      type: [String],
      required: [true, "At least one day is required"],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    applicableSemesters: {
      type: [String],
      required: [true, "At least one semester is required"],
      enum: ["1st Semester", "2nd Semester"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
timeSlotSchema.index({ startTime: 1, endTime: 1 });
timeSlotSchema.index({ applicableSemesters: 1 });

const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);

export default TimeSlot;
