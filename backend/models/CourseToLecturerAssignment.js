import mongoose from "mongoose";

const courseToLecturerAssignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
      index: true,
    },
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lecturer is required"],
      index: true,
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: ["1st Semester", "2nd Semester"],
      index: true,
    },
    workloadOverride: {
      type: Boolean,
      default: false,
    },
    overrideReason: {
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
    lecturerName: String,
  },
  {
    timestamps: true,
  }
);

// Compound unique index
courseToLecturerAssignmentSchema.index(
  { courseId: 1, lecturerId: 1, semester: 1 },
  { unique: true }
);

// Index for workload queries
courseToLecturerAssignmentSchema.index({ lecturerId: 1, semester: 1 });

const CourseToLecturerAssignment = mongoose.model(
  "CourseToLecturerAssignment",
  courseToLecturerAssignmentSchema
);

export default CourseToLecturerAssignment;
