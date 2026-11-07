import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import User from "../models/User.js";
import TimeSlot from "../models/TimeSlot.js";
import CourseToLecturerAssignment from "../models/CourseToLecturerAssignment.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";

/**
 * @desc    Get aggregated dashboard stats for all roles
 * @route   GET /api/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;

    // Common stats
    const [totalCourses, totalVenues, totalTimeSlots] = await Promise.all([
      Course.countDocuments({ isActive: true }),
      Venue.countDocuments({ isActive: true }),
      TimeSlot.countDocuments({ isActive: true }),
    ]);

    const baseStats = {
      totalCourses,
      totalVenues,
      totalTimeSlots,
    };

    // Admin-specific stats
    if (role === "Admin") {
      const [totalUsers, activeUsers, scheduledCount, unscheduledCount] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: "Active" }),
        CourseToVenueTimeAssignment.countDocuments({ isScheduled: true }),
        getUnscheduledCount(),
      ]);

      return res.json({
        success: true,
        stats: {
          ...baseStats,
          totalUsers,
          activeUsers,
          scheduledCourses: scheduledCount,
          unscheduledCourses: unscheduledCount,
        },
      });
    }

    // HOD-specific stats
    if (role === "HOD") {
      const [totalAllocations, scheduledCount, unscheduledCount] = await Promise.all([
        CourseToLecturerAssignment.countDocuments(),
        CourseToVenueTimeAssignment.countDocuments({ isScheduled: true }),
        getUnscheduledCount(),
      ]);

      return res.json({
        success: true,
        stats: {
          ...baseStats,
          totalAllocations,
          scheduledCourses: scheduledCount,
          unscheduledCourses: unscheduledCount,
        },
      });
    }

    // Exam Officer stats
    if (role === "Exam Officer") {
      const coursesByLevel = await Course.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      const levelBreakdown = {};
      coursesByLevel.forEach((l) => {
        levelBreakdown[`${l._id} Level`] = l.count;
      });

      return res.json({
        success: true,
        stats: {
          ...baseStats,
          levelBreakdown,
        },
      });
    }

    // Timetable Officer stats
    if (role === "Timetable Officer") {
      const [scheduledCount, unscheduledCount, venuesUsed, assignedIds] = await Promise.all([
        CourseToVenueTimeAssignment.countDocuments({ isScheduled: true }),
        getUnscheduledCount(),
        CourseToVenueTimeAssignment.distinct("venueId", { isScheduled: true }),
        CourseToLecturerAssignment.distinct("courseId"),
      ]);

      // Courses without any lecturer assignment
      const unassignedCount = await Course.countDocuments({ _id: { $nin: assignedIds } });

      return res.json({
        success: true,
        stats: {
          ...baseStats,
          scheduledCourses: scheduledCount,
          unscheduledCourses: unscheduledCount,
          unassignedCourses: unassignedCount,
          venuesUsed: venuesUsed.length,
        },
      });
    }

    // Lecturer or fallback
    return res.json({
      success: true,
      stats: baseStats,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Count active courses not yet scheduled on the timetable
 */
async function getUnscheduledCount() {
  const scheduled = await CourseToVenueTimeAssignment.find({
    isScheduled: true,
  }).select("courseId");
  const scheduledIds = scheduled.filter((s) => s.courseId).map((s) => s.courseId);
  return await Course.countDocuments({
    _id: { $nin: scheduledIds },
    isActive: true,
  });
}
