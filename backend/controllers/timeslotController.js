import TimeSlot from "../models/TimeSlot.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import { logAudit } from "../middleware/audit.js";

/**
 * @desc    Get all time slots with filters
 * @route   GET /api/timeslots
 */
export const getTimeslots = async (req, res) => {
  try {
    const { semester, day } = req.query;

    const query = { isActive: true };
    if (semester) query.applicableSemesters = { $in: [semester] };
    if (day) query.daysAvailable = { $in: [day] };

    const slots = await TimeSlot.find(query).sort({ startTime: 1 });

    res.json({ success: true, timeSlots: slots });
  } catch (err) {
    console.error("Get timeslots error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get single time slot by ID
 * @route   GET /api/timeslots/:id
 */
export const getTimeslot = async (req, res) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res
        .status(404)
        .json({ success: false, message: "Timeslot not found" });
    }
    res.json({ success: true, timeSlot: slot });
  } catch (err) {
    console.error("Get timeslot error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create a single time slot
 * @route   POST /api/timeslots
 */
export const createTimeslot = async (req, res) => {
  try {
    const { startTime, endTime, duration, daysAvailable, applicableSemesters } =
      req.body;

    // Auto-calculate duration if not provided
    const calculatedDuration =
      duration ||
      (parseTime(endTime) - parseTime(startTime)) / 60;

    const slot = await TimeSlot.create({
      startTime,
      endTime,
      duration: calculatedDuration,
      daysAvailable,
      applicableSemesters,
    });

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "TimeSlot",
      entityId: slot._id,
      details: { startTime, endTime, daysAvailable, applicableSemesters },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, timeSlot: slot });
  } catch (err) {
    console.error("Create timeslot error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create multiple time slots in batch
 * @route   POST /api/timeslots/batch
 */
export const createTimeslotBatch = async (req, res) => {
  try {
    const { timeSlots } = req.body;

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of time slots",
      });
    }

    const created = [];
    for (const ts of timeSlots) {
      const calculatedDuration =
        ts.duration ||
        (parseTime(ts.endTime) - parseTime(ts.startTime)) / 60;

      const slot = await TimeSlot.create({
        startTime: ts.startTime,
        endTime: ts.endTime,
        duration: calculatedDuration,
        daysAvailable: ts.daysAvailable,
        applicableSemesters: ts.applicableSemesters,
      });
      created.push(slot);
    }

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "TimeSlot",
      details: { batch: true, count: created.length },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      created: created.length,
      timeSlots: created,
    });
  } catch (err) {
    console.error("Create timeslot batch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a time slot
 * @route   PUT /api/timeslots/:id
 */
export const updateTimeslot = async (req, res) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res
        .status(404)
        .json({ success: false, message: "Timeslot not found" });
    }

    const { startTime, endTime, duration, daysAvailable, applicableSemesters, isActive } =
      req.body;

    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (duration) slot.duration = duration;
    if (daysAvailable) slot.daysAvailable = daysAvailable;
    if (applicableSemesters) slot.applicableSemesters = applicableSemesters;
    if (isActive !== undefined) slot.isActive = isActive;

    await slot.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "TimeSlot",
      entityId: slot._id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.json({ success: true, timeSlot: slot });
  } catch (err) {
    console.error("Update timeslot error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a time slot
 * @route   DELETE /api/timeslots/:id
 */
export const deleteTimeslot = async (req, res) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res
        .status(404)
        .json({ success: false, message: "Timeslot not found" });
    }

    // Check for active assignments
    const assignments = await CourseToVenueTimeAssignment.countDocuments({
      timeSlotId: slot._id,
    });

    await TimeSlot.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Delete",
      entityType: "TimeSlot",
      entityId: req.params.id,
      details: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        affectedAssignments: assignments,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Timeslot deleted successfully",
      affectedAssignments: assignments,
    });
  } catch (err) {
    console.error("Delete timeslot error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Helper to parse HH:MM time string to minutes
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}
