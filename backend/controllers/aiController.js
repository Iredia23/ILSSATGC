// backend/controllers/aiController.js
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import User from "../models/User.js";
import CourseToLecturerAssignment from "../models/CourseToLecturerAssignment.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import {
  suggestSchedule,
  resolveConflict,
  analyzeWorkload,
  chatWithSchedule,
} from "../services/aiService.js";

/**
 * @desc    1. SMART SCHEDULE SUGGESTIONS
 * @route   POST /api/ai/suggest
 */
export const getScheduleSuggestions = async (req, res) => {
  try {
    const { semester } = req.body;

    // Gather all context data
    const query = semester ? { semester } : {};

    const unscheduledRes = await getUnscheduledData(query);
    const timeSlots = await TimeSlot.find({ isActive: true }).sort({ startTime: 1 });
    const venues = await Venue.find({ isActive: true }).sort({ name: 1 });

    const scheduleQuery = semester
      ? { isScheduled: true, courseId: { $in: (await Course.find({ semester }).select("_id")).map((c) => c._id) } }
      : { isScheduled: true };

    const existingSchedule = await CourseToVenueTimeAssignment.find(scheduleQuery)
      .populate("courseId", "code title level")
      .populate("venueId", "name")
      .populate("lecturerId", "fullName")
      .populate("timeSlotId", "startTime endTime")
      .limit(100);

    const context = {
      unscheduled: unscheduledRes.unscheduled.map((u) => ({
        courseCode: u.courseId?.code,
        courseTitle: u.courseId?.title,
        level: u.courseId?.level,
        lecturer: u.lecturerId?.fullName,
      })),
      timeSlots: timeSlots.map((ts) => ({
        startTime: ts.startTime,
        endTime: ts.endTime,
        days: ts.daysAvailable,
      })),
      venues: venues.map((v) => ({ name: v.name, type: v.type, capacity: v.capacity })),
      existingSchedule: existingSchedule.map((s) => ({
        course: `${s.courseId?.code} - ${s.courseId?.title}`,
        venue: s.venueId?.name,
        lecturer: s.lecturerId?.fullName,
        day: s.dayOfWeek,
        time: `${s.timeSlotId?.startTime}–${s.timeSlotId?.endTime}`,
      })),
      semester: semester || "Not specified",
    };

    const result = await suggestSchedule(context);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("AI suggest error:", err);
    res.status(500).json({ success: false, message: "AI suggestion failed", error: err.message });
  }
};

/**
 * @desc    2. CONFLICT RESOLUTION
 * @route   POST /api/ai/resolve
 */
export const getConflictResolution = async (req, res) => {
  try {
    const { conflicts, courseId, venueId, dayOfWeek, timeSlotId } = req.body;

    const course = courseId ? await Course.findById(courseId).select("code title level") : null;
    const currentVenue = venueId ? (await Venue.findById(venueId).select("name"))?.name : "Unknown";
    const timeSlot = timeSlotId ? await TimeSlot.findById(timeSlotId) : null;

    const availableSlots = await TimeSlot.find({ isActive: true }).sort({ startTime: 1 });
    const venues = await Venue.find({ isActive: true }).sort({ name: 1 });

    const context = {
      conflicts: conflicts || [],
      course: course ? { code: course.code, title: course.title, level: course.level } : {},
      currentVenue,
      currentDay: dayOfWeek || "Unknown",
      currentTime: timeSlot ? `${timeSlot.startTime}–${timeSlot.endTime}` : "Unknown",
      availableSlots: availableSlots.map((ts) => ({
        _id: ts._id,
        startTime: ts.startTime,
        endTime: ts.endTime,
        days: ts.daysAvailable,
      })),
      venues: venues.map((v) => ({
        _id: v._id,
        name: v.name,
        type: v.type,
        capacity: v.capacity,
      })),
    };

    const result = await resolveConflict(context);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("AI resolve error:", err);
    res.status(500).json({ success: false, message: "AI resolution failed", error: err.message });
  }
};

/**
 * @desc    3. WORKLOAD BALANCING
 * @route   GET /api/ai/workload
 */
export const getWorkloadAnalysis = async (req, res) => {
  try {
    const { semester } = req.query;

    // Get all teaching staff
    const teachingRoles = ["Lecturer", "HOD", "Exam Officer", "Timetable Officer"];
    const lecturers = await User.find({
      role: { $in: teachingRoles },
      status: "Active",
    }).select("fullName email department role");

    // Get all assignments grouped by lecturer
    const assignQuery = semester ? { semester } : {};
    const allAssignments = await CourseToLecturerAssignment.find(assignQuery)
      .populate("courseId", "code title creditUnits")
      .populate("lecturerId", "fullName email");

    // Build workload per lecturer
    const workloadMap = {};
    for (const lecturer of lecturers) {
      workloadMap[lecturer._id] = {
        name: lecturer.fullName,
        email: lecturer.email,
        role: lecturer.role,
        courses: [],
        count: 0,
        totalCredits: 0,
      };
    }

    for (const a of allAssignments) {
      const lid = a.lecturerId?._id?.toString();
      if (lid && workloadMap[lid]) {
        workloadMap[lid].courses.push({
          code: a.courseId?.code,
          title: a.courseId?.title,
          credits: a.courseId?.creditUnits,
        });
        workloadMap[lid].count += 1;
        workloadMap[lid].totalCredits += a.courseId?.creditUnits || 0;
      }
    }

    const lecturersData = Object.values(workloadMap);
    const maxWorkload = parseInt(process.env.MAX_COURSES_PER_LECTURER) || 4;

    const context = {
      lecturers: lecturersData,
      assignments: allAssignments.map((a) => ({
        course: a.courseId?.code,
        lecturer: a.lecturerId?.fullName,
        semester: a.semester,
      })),
      maxWorkload,
    };

    const result = await analyzeWorkload(context);
    res.json({ success: true, ...result, workloadData: lecturersData });
  } catch (err) {
    console.error("AI workload error:", err);
    res.status(500).json({ success: false, message: "AI workload analysis failed", error: err.message });
  }
};

/**
 * @desc    4. CHAT ASSISTANT
 * @route   POST /api/ai/chat
 */
export const getChatResponse = async (req, res) => {
  try {
    const { message, semester } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Gather current schedule data for context
    const courseQuery = semester ? { semester } : {};
    const courses = await Course.find(courseQuery).select("code title level semester creditUnits").limit(100);

    const schedule = await CourseToVenueTimeAssignment.find({ isScheduled: true })
      .populate("courseId", "code title level")
      .populate("venueId", "name")
      .populate("lecturerId", "fullName")
      .populate("timeSlotId", "startTime endTime")
      .limit(200);

    const lecturers = await User.find({
      role: { $in: ["Lecturer", "HOD", "Exam Officer", "Timetable Officer"] },
      status: "Active",
    }).select("fullName email role");

    const venues = await Venue.find({ isActive: true }).select("name type capacity").limit(50);
    const timeSlots = await TimeSlot.find({ isActive: true }).select("startTime endTime duration daysAvailable").limit(50);

    const context = {
      message,
      schedule: schedule.map((s) => ({
        course: `${s.courseId?.code} - ${s.courseId?.title}`,
        level: s.courseId?.level,
        venue: s.venueId?.name,
        lecturer: s.lecturerId?.fullName,
        day: s.dayOfWeek,
        time: `${s.timeSlotId?.startTime}–${s.timeSlotId?.endTime}`,
      })),
      courses: courses.map((c) => ({
        code: c.code,
        title: c.title,
        level: c.level,
        semester: c.semester,
        credits: c.creditUnits,
      })),
      lecturers: lecturers.map((l) => ({
        name: l.fullName,
        email: l.email,
        role: l.role,
      })),
      venues: venues.map((v) => ({
        name: v.name,
        type: v.type,
        capacity: v.capacity,
      })),
      timeSlots: timeSlots.map((ts) => ({
        startTime: ts.startTime,
        endTime: ts.endTime,
        days: ts.daysAvailable,
      })),
      semester: semester || "All Semesters",
    };

    const result = await chatWithSchedule(context);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ success: false, message: "AI chat failed", error: err.message });
  }
};

// ─── Helper ───────────────────────────────────────────────

async function getUnscheduledData(query) {
  const allAssignments = await CourseToLecturerAssignment.find(query)
    .populate("courseId", "code title level creditUnits")
    .populate("lecturerId", "fullName email");

  const scheduled = await CourseToVenueTimeAssignment.find({ isScheduled: true }).select("courseId");
  const scheduledIds = new Set(scheduled.map((s) => s.courseId.toString()));

  const unscheduled = allAssignments.filter(
    (a) => !scheduledIds.has(a.courseId?._id.toString())
  );

  return { unscheduled, count: unscheduled.length };
}
