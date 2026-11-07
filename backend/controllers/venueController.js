import Venue from "../models/Venue.js";
import Course from "../models/Course.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import { logAudit } from "../middleware/audit.js";

/**
 * @desc    Get all venues with pagination, search, and filters
 * @route   GET /api/venues
 */
export const getVenues = async (req, res) => {
  try {
    const { page = 1, limit = 15, type, minCapacity, search } = req.query;

    const query = { isActive: true };

    if (type) query.type = type;
    if (minCapacity) query.capacity = { $gte: parseInt(minCapacity) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { building: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Venue.countDocuments(query);
    const venues = await Venue.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      venues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get venues error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get venue utilization (sessions booked, active days, utilization %)
 * @route   GET /api/venues/utilization
 */
export const getVenueUtilization = async (req, res) => {
  try {
    const { semester } = req.query;
    const venues = await Venue.find({ isActive: true }).sort({ name: 1 });

    const query = { isScheduled: true };
    if (semester) {
      const courses = await Course.find({ semester }).select("_id");
      query.courseId = { $in: courses.map((c) => c._id) };
    }
    const assignments = await CourseToVenueTimeAssignment.find(query).select("venueId dayOfWeek");

    const byVenue = {};
    assignments.forEach((a) => {
      const vid = String(a.venueId);
      if (!byVenue[vid]) byVenue[vid] = { sessions: 0, days: new Set() };
      byVenue[vid].sessions += 1;
      byVenue[vid].days.add(a.dayOfWeek);
    });

    // Weekly capacity: 9 hourly slots (08:00-13:00 + 14:00-18:00) Mon-Fri = 45
    const WEEKLY_SLOTS = 45;

    const utilization = venues.map((v) => {
      const u = byVenue[String(v._id)] || { sessions: 0, days: new Set() };
      const sessions = u.sessions || 0;
      return {
        venue: {
          _id: v._id,
          name: v.name,
          building: v.building,
          capacity: v.capacity,
          type: v.type,
        },
        totalSessions: sessions,
        activeDays: u.days.size,
        weeklyCapacity: WEEKLY_SLOTS,
        utilizationPercent: Math.min(100, Math.round((sessions / WEEKLY_SLOTS) * 100)),
      };
    });

    res.json({ success: true, utilization });
  } catch (err) {
    console.error("Get venue utilization error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get single venue by ID
 * @route   GET /api/venues/:id
 */
export const getVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res
        .status(404)
        .json({ success: false, message: "Venue not found" });
    }
    res.json({ success: true, venue });
  } catch (err) {
    console.error("Get venue error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create a new venue (Admin only)
 * @route   POST /api/venues
 */
export const createVenue = async (req, res) => {
  try {
    const { name, building, capacity, type, equipment } = req.body;

    // Check for duplicate name
    const existing = await Venue.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Venue with name "${name}" already exists`,
      });
    }

    const venue = await Venue.create({
      name,
      building,
      capacity,
      type,
      equipment,
      createdBy: req.user._id,
    });

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "Venue",
      entityId: venue._id,
      details: { name: venue.name, capacity: venue.capacity, type: venue.type },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, venue });
  } catch (err) {
    console.error("Create venue error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a venue (Admin and Timetable Officer)
 * @route   PUT /api/venues/:id
 */
export const updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res
        .status(404)
        .json({ success: false, message: "Venue not found" });
    }

    const { name, building, capacity, type, equipment, isActive } = req.body;

    if (name) venue.name = name;
    if (building !== undefined) venue.building = building;
    if (capacity) venue.capacity = capacity;
    if (type) venue.type = type;
    if (equipment) venue.equipment = equipment;
    if (isActive !== undefined) venue.isActive = isActive;

    await venue.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "Venue",
      entityId: venue._id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.json({ success: true, venue });
  } catch (err) {
    console.error("Update venue error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a venue and its assignments
 * @route   DELETE /api/venues/:id
 */
export const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res
        .status(404)
        .json({ success: false, message: "Venue not found" });
    }

    // Check for active assignments
    const assignments = await CourseToVenueTimeAssignment.countDocuments({
      venueId: venue._id,
    });

    if (assignments > 0) {
      await CourseToVenueTimeAssignment.deleteMany({ venueId: venue._id });
    }

    await Venue.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Delete",
      entityType: "Venue",
      entityId: req.params.id,
      details: { name: venue.name, removedAssignments: assignments },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Venue ${venue.name} deleted successfully`,
    });
  } catch (err) {
    console.error("Delete venue error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get venue schedule (weekly view)
 * @route   GET /api/venues/:id/schedule
 */
export const getVenueSchedule = async (req, res) => {
  try {
    const { semester } = req.query;
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res
        .status(404)
        .json({ success: false, message: "Venue not found" });
    }

    const query = { venueId: venue._id, isScheduled: true };
    if (semester) {
      // Need to filter by semester through the course
      const courses = await Course.find({ semester }).select("_id");
      query.courseId = { $in: courses.map((c) => c._id) };
    }

    const schedule = await CourseToVenueTimeAssignment.find(query)
      .populate("courseId", "code title level")
      .populate("timeSlotId", "startTime endTime")
      .populate("lecturerId", "fullName")
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({
      success: true,
      venue,
      schedule: schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        timeSlot: `${s.startTime}-${s.endTime}`,
        course: {
          code: s.courseId?.code,
          title: s.courseId?.title,
          level: s.courseId?.level,
          lecturer: s.lecturerId?.fullName,
        },
      })),
    });
  } catch (err) {
    console.error("Get venue schedule error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
