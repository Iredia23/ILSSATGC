import mongoose from "mongoose";

const courseToVenueTimeAssignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
      index: true,
    },
    courseToLecturerAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseToLecturerAssignment",
      required: false,
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue is required"],
      index: true,
    },
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: [true, "Time slot is required"],
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: [true, "Day of week is required"],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    isScheduled: {
      type: Boolean,
      default: true,
      index: true,
    },
    conflictOverride: {
      type: Boolean,
      default: false,
    },
    conflictOverrideReason: {
      type: String,
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Denormalized fields for performance
    courseCode: String,
    courseTitle: String,
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lecturerName: String,
    venueName: String,
    startTime: String,
    endTime: String,
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for conflict checking
courseToVenueTimeAssignmentSchema.index({
  venueId: 1,
  timeSlotId: 1,
  dayOfWeek: 1,
});

courseToVenueTimeAssignmentSchema.index({
  lecturerId: 1,
  timeSlotId: 1,
  dayOfWeek: 1,
});

const CourseToVenueTimeAssignment = mongoose.model(
  "CourseToVenueTimeAssignment",
  courseToVenueTimeAssignmentSchema
);

export default CourseToVenueTimeAssignment;
