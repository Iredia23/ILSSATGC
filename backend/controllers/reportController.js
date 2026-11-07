import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import Course from "../models/Course.js";

/**
 * @desc    Generate semester schedule report
 * @route   POST /api/reports/semester-schedule
 */
export const getSemesterScheduleReport = async (req, res) => {
  try {
    const { semester, format = "json", filters = {} } = req.body;

    const query = { isScheduled: true };
    if (semester) {
      const courses = await Course.find({ semester }).select("_id");
      query.courseId = { $in: courses.map((c) => c._id) };
    }

    if (filters.level) {
      const levelCourses = await Course.find({
        level: { $in: Array.isArray(filters.level) ? filters.level : [filters.level] },
      }).select("_id");
      query.courseId = {
        $in: levelCourses.map((c) => c._id),
      };
    }

    if (filters.venue) {
      query.venueId = filters.venue;
    }

    const schedule = await CourseToVenueTimeAssignment.find(query)
      .populate("courseId", "code title creditUnits level departments")
      .populate("venueId", "name building capacity")
      .populate("timeSlotId", "startTime endTime")
      .populate("lecturerId", "fullName email")
      .sort({ dayOfWeek: 1, startTime: 1 });

    const report = {
      title: `FUT Minna - ${semester || "Full"} Semester Schedule`,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.fullName || "System",
      summary: {
        totalCourses: new Set(schedule.map((s) => s.courseId?.code)).size,
        totalVenuesUsed: new Set(schedule.map((s) => s.venueId?.name)).size,
        totalLecturers: new Set(schedule.map((s) => s.lecturerId?.fullName)).size,
        totalAssignments: schedule.length,
      },
      schedule: schedule.map((s) => ({
        courseCode: s.courseId?.code,
        courseTitle: s.courseId?.title,
        creditUnits: s.courseId?.creditUnits,
        level: s.courseId?.level,
        departments: s.courseId?.departments,
        lecturer: s.lecturerId?.fullName,
        venue: s.venueId?.name,
        building: s.venueId?.building,
        dayOfWeek: s.dayOfWeek,
        startTime: s.timeSlotId?.startTime,
        endTime: s.timeSlotId?.endTime,
      })),
    };

    res.json({ success: true, report });
  } catch (err) {
    console.error("Get semester schedule report error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Generate conflict report
 * @route   GET /api/reports/conflicts
 */
export const getConflictReport = async (req, res) => {
  try {
    const { semester } = req.query;

    // Get all scheduled assignments
    const query = { isScheduled: true };
    if (semester) {
      const courses = await Course.find({ semester }).select("_id");
      query.courseId = { $in: courses.map((c) => c._id) };
    }

    const assignments = await CourseToVenueTimeAssignment.find(query)
      .populate("courseId", "code title level")
      .populate("venueId", "name")
      .populate("timeSlotId", "startTime endTime")
      .populate("lecturerId", "fullName");

    const conflicts = [];

    // Check for venue conflicts (same venue, same day, overlapping times)
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a = assignments[i];
        const b = assignments[j];

        if (
          a.venueId?.toString() === b.venueId?.toString() &&
          a.dayOfWeek === b.dayOfWeek &&
          timesOverlap(a.timeSlotId, b.timeSlotId)
        ) {
          conflicts.push({
            type: "VENUE_CONFLICT",
            message: `Venue ${a.venueId?.name} has overlapping assignments on ${a.dayOfWeek}`,
            courses: [a.courseId?.code, b.courseId?.code],
            time: `${a.timeSlotId?.startTime}-${a.timeSlotId?.endTime} / ${b.timeSlotId?.startTime}-${b.timeSlotId?.endTime}`,
          });
        }

        if (
          a.lecturerId?.toString() === b.lecturerId?.toString() &&
          a.dayOfWeek === b.dayOfWeek &&
          timesOverlap(a.timeSlotId, b.timeSlotId)
        ) {
          conflicts.push({
            type: "LECTURER_CONFLICT",
            message: `Lecturer ${a.lecturerId?.fullName} has overlapping assignments on ${a.dayOfWeek}`,
            courses: [a.courseId?.code, b.courseId?.code],
            time: `${a.timeSlotId?.startTime}-${a.timeSlotId?.endTime} / ${b.timeSlotId?.startTime}-${b.timeSlotId?.endTime}`,
          });
        }
      }
    }

    res.json({
      success: true,
      conflicts,
      summary: {
        totalChecked: assignments.length,
        totalConflicts: conflicts.length,
        venueConflicts: conflicts.filter((c) => c.type === "VENUE_CONFLICT").length,
        lecturerConflicts: conflicts.filter((c) => c.type === "LECTURER_CONFLICT").length,
      },
    });
  } catch (err) {
    console.error("Get conflict report error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

function timesOverlap(slot1, slot2) {
  if (!slot1 || !slot2) return false;
  const s1Start = timeToMinutes(slot1.startTime);
  const s1End = timeToMinutes(slot1.endTime);
  const s2Start = timeToMinutes(slot2.startTime);
  const s2End = timeToMinutes(slot2.endTime);
  return s1Start < s2End && s2Start < s1End;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
