import Meeting from "../models/Meeting.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import Course from "../models/Course.js";
import TimeSlot from "../models/TimeSlot.js";
import User from "../models/User.js";
import { logAudit } from "../middleware/audit.js";

// Helper to check if a student has a class or approved meeting at a given slot
const isStudentBusy = async (studentId, studentLevel, studentDept, dayOfWeek, timeSlotId) => {
  // 1. Check for classes matching student's level and department
  // We need to find courses of the student's level and department
  const studentCourses = await Course.find({
    level: studentLevel,
    departments: studentDept,
    isActive: true,
  }).select("_id");

  const courseIds = studentCourses.map((c) => c._id);

  const classConflict = await CourseToVenueTimeAssignment.findOne({
    courseId: { $in: courseIds },
    timeSlotId,
    dayOfWeek,
    isScheduled: true,
  });

  if (classConflict) {
    return {
      busy: true,
      reason: `Student has a class (${classConflict.courseCode}) scheduled at this time`,
    };
  }

  // 2. Check for approved meetings
  const meetingConflict = await Meeting.findOne({
    studentId,
    dayOfWeek,
    timeSlotId,
    status: "Approved",
  });

  if (meetingConflict) {
    return {
      busy: true,
      reason: "Student already has an approved meeting at this time",
    };
  }

  return { busy: false };
};

// Helper to check if a lecturer has a class or approved meeting at a given slot
const isLecturerBusy = async (lecturerId, dayOfWeek, timeSlotId) => {
  // 1. Check for classes taught by lecturer
  const classConflict = await CourseToVenueTimeAssignment.findOne({
    lecturerId,
    timeSlotId,
    dayOfWeek,
    isScheduled: true,
  });

  if (classConflict) {
    return {
      busy: true,
      reason: `Lecturer is teaching class (${classConflict.courseCode}) at this time`,
    };
  }

  // 2. Check for approved meetings
  const meetingConflict = await Meeting.findOne({
    lecturerId,
    dayOfWeek,
    timeSlotId,
    status: "Approved",
  });

  if (meetingConflict) {
    return {
      busy: true,
      reason: "Lecturer already has an approved meeting at this time",
    };
  }

  return { busy: false };
};

/**
 * @desc    Book a new meeting request
 * @route   POST /api/meetings/book
 */
export const bookMeeting = async (req, res) => {
  try {
    const { lecturerId, dayOfWeek, timeSlotId, purpose } = req.body;
    const studentId = req.user._id;

    if (!lecturerId || !dayOfWeek || !timeSlotId || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: lecturerId, dayOfWeek, timeSlotId, purpose",
      });
    }

    // Validate lecturer is active
    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found or inactive",
      });
    }

    // Check if student is busy
    const studentCheck = await isStudentBusy(
      studentId,
      req.user.level,
      req.user.department,
      dayOfWeek,
      timeSlotId
    );

    if (studentCheck.busy) {
      return res.status(400).json({
        success: false,
        message: `Cannot book meeting: ${studentCheck.reason}`,
      });
    }

    // Check if lecturer is busy
    const lecturerCheck = await isLecturerBusy(lecturerId, dayOfWeek, timeSlotId);
    if (lecturerCheck.busy) {
      return res.status(400).json({
        success: false,
        message: `Cannot book meeting: ${lecturerCheck.reason}`,
      });
    }

    // Check if there is already a pending request for the same slot by this student
    const existingPending = await Meeting.findOne({
      studentId,
      lecturerId,
      dayOfWeek,
      timeSlotId,
      status: "Pending",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending meeting request with this lecturer at this timeslot",
      });
    }

    const meeting = await Meeting.create({
      studentId,
      lecturerId,
      dayOfWeek,
      timeSlotId,
      purpose,
      status: "Pending",
    });

    await logAudit({
      userId: studentId,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "Meeting",
      entityId: meeting._id,
      details: { lecturerName: lecturer.fullName, dayOfWeek, purpose },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Meeting request submitted successfully",
      meeting,
    });
  } catch (err) {
    console.error("Book meeting error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get student's own meeting list
 * @route   GET /api/meetings/student
 */
export const getStudentMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ studentId: req.user._id })
      .populate("lecturerId", "fullName email department officeLocation")
      .populate("timeSlotId", "startTime endTime")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      meetings,
    });
  } catch (err) {
    console.error("Get student meetings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get lecturer's meeting requests
 * @route   GET /api/meetings/lecturer
 */
export const getLecturerMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ lecturerId: req.user._id })
      .populate("studentId", "fullName email level department")
      .populate("timeSlotId", "startTime endTime")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      meetings,
    });
  } catch (err) {
    console.error("Get lecturer meetings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update meeting status (Approve, Cancel)
 * @route   PATCH /api/meetings/:id/status
 */
export const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["Approved", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'Approved' or 'Cancelled'",
      });
    }

    const meeting = await Meeting.findById(id)
      .populate("studentId", "fullName email level department")
      .populate("lecturerId", "fullName email");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting request not found",
      });
    }

    const isStudent = req.user.role === "Student" && req.user._id.toString() === meeting.studentId._id.toString();
    const isLecturer = req.user._id.toString() === meeting.lecturerId._id.toString();

    if (!isStudent && !isLecturer) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this meeting status",
      });
    }

    // Only lecturers can approve
    if (status === "Approved" && !isLecturer) {
      return res.status(403).json({
        success: false,
        message: "Only the lecturer can approve a meeting",
      });
    }

    if (status === "Approved") {
      // Re-verify conflicts for lecturer
      const lecturerCheck = await isLecturerBusy(meeting.lecturerId._id, meeting.dayOfWeek, meeting.timeSlotId);
      if (lecturerCheck.busy) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve meeting: ${lecturerCheck.reason}`,
        });
      }

      // Re-verify conflicts for student
      const studentCheck = await isStudentBusy(
        meeting.studentId._id,
        meeting.studentId.level,
        meeting.studentId.department,
        meeting.dayOfWeek,
        meeting.timeSlotId
      );
      if (studentCheck.busy) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve meeting: ${studentCheck.reason}`,
        });
      }

      // Reject all other pending meetings for either student or lecturer at this timeslot
      await Meeting.updateMany(
        {
          _id: { $ne: meeting._id },
          dayOfWeek: meeting.dayOfWeek,
          timeSlotId: meeting.timeSlotId,
          status: "Pending",
          $or: [
            { studentId: meeting.studentId._id },
            { lecturerId: meeting.lecturerId._id }
          ]
        },
        { status: "Cancelled" }
      );
    }

    meeting.status = status;
    await meeting.save();

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "Meeting",
      entityId: meeting._id,
      details: { newStatus: status },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Meeting has been ${status.toLowerCase()}`,
      meeting,
    });
  } catch (err) {
    console.error("Update meeting status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get lecturer schedule with approved meetings (combined public view)
 * @route   GET /api/meetings/lecturer/:lecturerId/schedule
 */
export const getLecturerScheduleWithMeetings = async (req, res) => {
  try {
    const { lecturerId } = req.params;

    // Get classes taught by lecturer
    const classes = await CourseToVenueTimeAssignment.find({
      lecturerId,
      isScheduled: true,
    })
      .populate("courseId", "code title creditUnits departments")
      .populate("venueId", "name building")
      .populate("timeSlotId", "startTime endTime");

    // Get approved meetings
    const meetings = await Meeting.find({
      lecturerId,
      status: "Approved",
    })
      .populate("studentId", "fullName email level department")
      .populate("timeSlotId", "startTime endTime");

    const lecturer = await User.findById(lecturerId).select("fullName email department officeLocation");

    res.json({
      success: true,
      lecturer,
      classes: classes.map((c) => ({
        type: "Class",
        courseCode: c.courseId?.code,
        courseTitle: c.courseId?.title,
        venue: c.venueId?.name,
        dayOfWeek: c.dayOfWeek,
        timeSlotId: c.timeSlotId?._id,
        startTime: c.timeSlotId?.startTime,
        endTime: c.timeSlotId?.endTime,
      })),
      meetings: meetings.map((m) => ({
        type: "Meeting",
        studentName: m.studentId?.fullName,
        studentDept: m.studentId?.department,
        studentLevel: m.studentId?.level,
        dayOfWeek: m.dayOfWeek,
        timeSlotId: m.timeSlotId?._id,
        startTime: m.timeSlotId?.startTime,
        endTime: m.timeSlotId?.endTime,
      })),
    });
  } catch (err) {
    console.error("Get lecturer public schedule error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Find all mutually available timeslots for a student and lecturer
 * @route   GET /api/meetings/available-slots
 */
export const getAvailableTimeslots = async (req, res) => {
  try {
    const { lecturerId } = req.query;
    const studentId = req.user._id;

    if (!lecturerId) {
      return res.status(400).json({ success: false, message: "lecturerId is required" });
    }

    const [lecturer, allSlots] = await Promise.all([
      User.findById(lecturerId),
      TimeSlot.find({ isActive: true }).sort({ startTime: 1 }),
    ]);

    if (!lecturer || lecturer.status !== "Active") {
      return res.status(404).json({ success: false, message: "Lecturer not found or inactive" });
    }

    // Days of the week
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const availabilityMap = [];

    for (const day of days) {
      for (const slot of allSlots) {
        // Check student
        const studentCheck = await isStudentBusy(
          studentId,
          req.user.level,
          req.user.department,
          day,
          slot._id
        );

        // Check lecturer
        const lecturerCheck = await isLecturerBusy(lecturerId, day, slot._id);

        availabilityMap.push({
          dayOfWeek: day,
          timeSlotId: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: !studentCheck.busy && !lecturerCheck.busy,
          studentBusyReason: studentCheck.busy ? studentCheck.reason : null,
          lecturerBusyReason: lecturerCheck.busy ? lecturerCheck.reason : null,
        });
      }
    }

    res.json({
      success: true,
      slots: availabilityMap,
    });
  } catch (err) {
    console.error("Get available slots error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
