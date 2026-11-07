import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      index: true,
    },
    creditUnits: {
      type: Number,
      required: [true, "Credit units are required"],
      min: 1,
      max: 6,
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
      enum: [100, 200, 300, 400, 500],
    },
    departments: {
      type: [String],
      required: [true, "At least one department is required"],
      default: ["Computer Science"],
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: ["1st Semester", "2nd Semester"],
      index: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
courseSchema.index({ code: 1, semester: 1 });
courseSchema.index({ level: 1, semester: 1 });

const Course = mongoose.model("Course", courseSchema);

export default Course;
