import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import CourseToLecturerAssignment from "../models/CourseToLecturerAssignment.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";

/**
 * @desc    Get system health metrics
 * @route   GET /api/admin/system-health
 */
export const getSystemHealth = async (req, res) => {
  try {
    const { timeframe = "24h" } = req.query;

    // Count entities
    const [
      totalUsers,
      usersByRole,
      totalCourses,
      totalVenues,
      scheduledCourses,
      unscheduledCourses,
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Course.countDocuments({ isActive: true }),
      Venue.countDocuments({ isActive: true }),
      CourseToVenueTimeAssignment.countDocuments({ isScheduled: true }),
      CourseToLecturerAssignment.countDocuments().then(async (total) => {
        const scheduled = await CourseToVenueTimeAssignment.distinct("courseId");
        const scheduledSet = new Set(scheduled.map((s) => s.toString()));
        const all = await CourseToLecturerAssignment.find().select("courseId");
        return all.filter((a) => !scheduledSet.has(a.courseId.toString())).length;
      }),
    ]);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        usersByRole: usersByRole.reduce((acc, r) => {
          acc[r._id] = r.count;
          return acc;
        }, {}),
        totalCourses,
        totalVenues,
        scheduledCourses,
        unscheduledCourses,
        uptime: 99.9,
      },
      alerts: [],
    });
  } catch (err) {
    console.error("Get system health error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get audit log entries
 * @route   GET /api/admin/audit-log
 */
export const getAuditLog = async (req, res) => {
  try {
    const {
      user: userId,
      actionType,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (actionType) query.actionType = actionType;
    if (entityType) query.entityType = entityType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate + "T23:59:59.999Z");
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get audit log error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Generate lecturer workload report
 * @route   GET /api/admin/workload-report
 */
export const getWorkloadReport = async (req, res) => {
  try {
    const { semester } = req.query;

    const query = {};
    if (semester) query.semester = semester;

    const assignments = await CourseToLecturerAssignment.find(query)
      .populate("lecturerId", "fullName email")
      .populate("courseId", "creditUnits");

    // Aggregate by lecturer
    const workload = {};
    for (const a of assignments) {
      const key = a.lecturerId?._id.toString();
      if (!key) continue;

      if (!workload[key]) {
        workload[key] = {
          lecturerId: key,
          lecturerName: a.lecturerId?.fullName,
          email: a.lecturerId?.email,
          totalCourses: 0,
          totalCreditUnits: 0,
        };
      }
      workload[key].totalCourses += 1;
      workload[key].totalCreditUnits += a.courseId?.creditUnits || 0;
    }

    const report = Object.values(workload).map((w) => ({
      ...w,
      status:
        w.totalCourses <= 4 ? "normal" : w.totalCourses === 5 ? "warning" : "critical",
    }));

    res.json({ success: true, report });
  } catch (err) {
    console.error("Get workload report error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Generate venue utilization report
 * @route   GET /api/admin/venue-utilization
 */
export const getVenueUtilization = async (req, res) => {
  try {
    const venues = await Venue.find({ isActive: true });
    const totalSlots = await TimeSlot.countDocuments({ isActive: true });
    const daysPerWeek = 5;

    const report = [];
    for (const venue of venues) {
      const scheduledCount = await CourseToVenueTimeAssignment.countDocuments({
        venueId: venue._id,
        isScheduled: true,
      });
      const maxPossible = totalSlots * daysPerWeek;
      const utilization = maxPossible > 0 ? ((scheduledCount / maxPossible) * 100).toFixed(1) : 0;

      report.push({
        venueId: venue._id,
        venueName: venue.name,
        venueType: venue.type,
        capacity: venue.capacity,
        scheduledCourses: scheduledCount,
        availableSlots: maxPossible - scheduledCount,
        utilization: parseFloat(utilization),
      });
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("Get venue utilization error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
