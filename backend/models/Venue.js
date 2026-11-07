import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    building: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: 1,
    },
    type: {
      type: String,
      required: [true, "Venue type is required"],
      enum: ["Lecture Hall", "Laboratory", "Seminar Room", "Auditorium"],
      index: true,
    },
    equipment: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

const Venue = mongoose.model("Venue", venueSchema);

export default Venue;
