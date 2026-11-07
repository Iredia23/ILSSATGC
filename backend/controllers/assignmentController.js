import CourseToLecturerAssignment from "../models/CourseToLecturerAssignment.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import User from "../models/User.js";
import { logAudit } from "../middleware/audit.js";

// ═══════════════════════════════════════════════════════════
// COURSE-TO-LECTURER ASSIGNMENTS
// ═══════════════════════════════════════════════════════════

/**
 * @desc    Assign a course to a lecturer (HOD only)
 * @route   POST /api/assignments/course-to-lecturer
 */
export const createCourseToLecturer = async (req, res) => {
  try {
    const { courseId, lecturerId, semester, overrideReason } = req.body;

    // Validate course exists and is active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(400).json({
        success: false,
        message: "Course not found or inactive",
      });
    }

    // Validate lecturer exists and is active
    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Lecturer not found or inactive",
      });
    }

    // Check for existing assignment for this course & semester
    let assignment = await CourseToLecturerAssignment.findOne({
      courseId,
      semester,
    });

    if (assignment && assignment.lecturerId.toString() === lecturerId) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_ASSIGNMENT",
        message: "This course is already assigned to this lecturer for this semester",
      });
    }

    // Check workload limit
    const MAX_COURSES = parseInt(process.env.MAX_COURSES_PER_LECTURER) || 4;
    const currentWorkload = await CourseToLecturerAssignment.countDocuments({
      lecturerId,
      semester,
    });

    if (currentWorkload >= MAX_COURSES && !overrideReason) {
      return res.status(409).json({
        success: false,
        code: "WORKLOAD_EXCEEDED",
        message: `${lecturer.fullName} is already assigned ${currentWorkload} courses. Assigning this will exceed the recommended workload.`,
        currentWorkload,
        lecturerId,
        lecturerName: lecturer.fullName,
      });
    }

    if (assignment) {
      // Reassign to new lecturer
      assignment.lecturerId = lecturerId;
      assignment.lecturerName = lecturer.fullName;
      assignment.workloadOverride = currentWorkload >= MAX_COURSES;
      assignment.overrideReason = overrideReason || undefined;
      assignment.overriddenBy = currentWorkload >= MAX_COURSES ? req.user._id : undefined;
      await assignment.save();
    } else {
      assignment = await CourseToLecturerAssignment.create({
        courseId,
        lecturerId,
        semester,
        workloadOverride: currentWorkload >= MAX_COURSES,
        overrideReason: overrideReason || undefined,
        overriddenBy: currentWorkload >= MAX_COURSES ? req.user._id : undefined,
        createdBy: req.user._id,
        courseCode: course.code,
        courseTitle: course.title,
        lecturerName: lecturer.fullName,
      });
    }

    // Synchronize any existing venue-time timetable entries for this course
    await CourseToVenueTimeAssignment.updateMany(
      { courseId },
      {
        $set: {
          courseToLecturerAssignmentId: assignment._id,
          lecturerId: lecturer._id,
          lecturerName: lecturer.fullName,
        },
      }
    );

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: assignment.isNew ? "Create" : "Update",
      entityType: "Assignment",
      entityId: assignment._id,
      details: {
        type: "course-to-lecturer",
        courseCode: course.code,
        lecturerName: lecturer.fullName,
        semester,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, assignment });
  } catch (err) {
    console.error("Create course-to-lecturer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all course-to-lecturer assignments
 * @route   GET /api/assignments/course-to-lecturer
 */
export const getCourseToLecturerAssignments = async (req, res) => {
  try {
    const { semester, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (semester) query.semester = semester;

    if (search) {
      const courses = await Course.find({
        $or: [
          { code: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const lecturers = await User.find({
        fullName: { $regex: search, $options: "i" },
      }).select("_id");

      query.$or = [
        { courseId: { $in: courses.map((c) => c._id) } },
        { lecturerId: { $in: lecturers.map((l) => l._id) } },
      ];
    }

    const total = await CourseToLecturerAssignment.countDocuments(query);
    const assignments = await CourseToLecturerAssignment.find(query)
      .populate("courseId", "code title creditUnits level")
      .populate("lecturerId", "fullName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get course-to-lecturer assignments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a course-to-lecturer assignment
 * @route   DELETE /api/assignments/course-to-lecturer/:id
 */
export const deleteCourseToLecturer = async (req, res) => {
  try {
    const assignment = await CourseToLecturerAssignment.findById(req.params.id);
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    // Revert any venue-time assignments linked to this course to Unassigned (keep on timetable grid)
    await CourseToVenueTimeAssignment.updateMany(
      { courseId: assignment.courseId },
      {
        $set: {
          courseToLecturerAssignmentId: null,
          lecturerId: null,
          lecturerName: "Unassigned",
        },
      }
    );

    await CourseToLecturerAssignment.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Delete",
      entityType: "Assignment",
      entityId: req.params.id,
      details: {
        type: "course-to-lecturer",
        courseCode: assignment.courseCode,
        lecturerName: assignment.lecturerName,
      },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("Delete course-to-lecturer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════
// COURSE-TO-VENUE-TIME ASSIGNMENTS
// ═══════════════════════════════════════════════════════════

/**
 * @desc    Check for scheduling conflicts
 * @route   POST /api/assignments/check-conflict
 */
export const checkConflict = async (req, res) => {
  try {
    const { courseId, lecturerId, venueId, timeSlotId, dayOfWeek, excludeAssignmentId } = req.body;
    const { conflicts } = await checkConflictInternal(
      courseId,
      lecturerId,
      venueId,
      timeSlotId,
      dayOfWeek,
      excludeAssignmentId
    );

    res.json({
      success: true,
      hasConflict: conflicts.length > 0,
      conflicts,
    });
  } catch (err) {
    console.error("Check conflict error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Assign a course to a venue and time slot (Timetable Officer only)
 * @route   POST /api/assignments/course-to-venue-time
 */
export const createCourseToVenueTime = async (req, res) => {
  try {
    const {
      courseId,
      venueId,
      timeSlotId,
      dayOfWeek,
      conflictOverride,
      description,
    } = req.body;

    // Validate all entities exist
    const [course, venue, timeSlot] = await Promise.all([
      Course.findById(courseId),
      Venue.findById(venueId),
      TimeSlot.findById(timeSlotId),
    ]);

    // Validate course exists
    if (!course || !course.isActive) {
      return res.status(400).json({
        success: false,
        message: "Course not found or inactive",
      });
    }

    // Validate venue exists
    if (!venue || !venue.isActive) {
      return res.status(400).json({
        success: false,
        message: "Venue not found or inactive",
      });
    }

    // Validate time slot exists
    if (!timeSlot || !timeSlot.isActive) {
      return res.status(400).json({
        success: false,
        message: "Time slot not found or inactive",
      });
    }

    // Get lecturer assignment if exists
    const cl = await CourseToLecturerAssignment.findOne({
      courseId,
      semester: course.semester,
    });

    const lecturerId = cl?.lecturerId;
    const lecturerName = cl?.lecturerName || "Unassigned";
    const clAssignmentId = cl?._id;

    // Check for conflicts unless override is set
    if (!conflictOverride) {
      const { conflicts } = await checkConflictInternal(
        courseId,
        lecturerId,
        venueId,
        timeSlotId,
        dayOfWeek
      );

      if (conflicts.length > 0) {
        // Surface the specific conflict(s)
        const conflictMessages = conflicts.map((c) => c.message);
        return res.status(409).json({
          success: false,
          code: "SCHEDULING_CONFLICT",
          message: conflictMessages.join(" "),
          conflicts,
        });
      }
    }

    const assignment = await CourseToVenueTimeAssignment.create({
      courseId,
      courseToLecturerAssignmentId: clAssignmentId,
      venueId,
      timeSlotId,
      dayOfWeek,
      createdBy: req.user._id,
      conflictOverride: conflictOverride || false,
      overriddenBy: conflictOverride ? req.user._id : undefined,
      description: description || "",
      // Denormalized fields
      courseCode: course.code,
      courseTitle: course.title,
      lecturerId,
      lecturerName,
      venueName: venue.name,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    });

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "Assignment",
      entityId: assignment._id,
      details: {
        type: "course-to-venue-time",
        courseCode: course.code,
        venueName: venue.name,
        dayOfWeek,
        time: `${timeSlot.startTime}-${timeSlot.endTime}`,
        conflictOverride: conflictOverride || false,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    console.error("Create course-to-venue-time error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update an existing venue-time assignment (move, description, lecturer, venue)
 * @route   PUT /api/assignments/course-to-venue-time/:id
 */
export const updateCourseToVenueTime = async (req, res) => {
  try {
    const {
      description,
      lecturerId,
      venueId,
      timeSlotId,
      dayOfWeek,
      conflictOverride,
    } = req.body;
    const assignment = await CourseToVenueTimeAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const targetDay = dayOfWeek || assignment.dayOfWeek;
    const targetSlotId = timeSlotId || assignment.timeSlotId;
    const targetVenueId = venueId || assignment.venueId;
    let targetLecturerId = lecturerId !== undefined ? lecturerId : assignment.lecturerId;
    if (targetLecturerId === "") targetLecturerId = null;

    // Check if slot, venue, lecturer, or day changed
    const isMoving =
      targetDay !== assignment.dayOfWeek ||
      targetSlotId?.toString() !== assignment.timeSlotId?.toString() ||
      targetVenueId?.toString() !== assignment.venueId?.toString() ||
      (targetLecturerId?.toString() || null) !== (assignment.lecturerId?.toString() || null);

    if (isMoving && !conflictOverride) {
      const { conflicts } = await checkConflictInternal(
        assignment.courseId,
        targetLecturerId,
        targetVenueId,
        targetSlotId,
        targetDay,
        assignment._id // Exclude self from conflict check
      );

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map((c) => c.message);
        return res.status(409).json({
          success: false,
          code: "SCHEDULING_CONFLICT",
          message: conflictMessages.join(" "),
          conflicts,
        });
      }
    }

    if (description !== undefined) {
      assignment.description = description;
    }

    if (dayOfWeek && dayOfWeek !== assignment.dayOfWeek) {
      assignment.dayOfWeek = dayOfWeek;
    }

    if (timeSlotId && timeSlotId !== assignment.timeSlotId?.toString()) {
      const timeSlot = await TimeSlot.findById(timeSlotId);
      if (timeSlot) {
        assignment.timeSlotId = timeSlot._id;
        assignment.startTime = timeSlot.startTime;
        assignment.endTime = timeSlot.endTime;
      }
    }

    if (venueId && venueId !== assignment.venueId?.toString()) {
      const venue = await Venue.findById(venueId);
      if (venue) {
        assignment.venueId = venue._id;
        assignment.venueName = venue.name;
      }
    }

    if (lecturerId !== undefined) {
      if (lecturerId) {
        const lecturer = await User.findById(lecturerId);
        if (lecturer) {
          assignment.lecturerId = lecturer._id;
          assignment.lecturerName = lecturer.fullName;
        }
      } else {
        assignment.lecturerId = null;
        assignment.lecturerName = "Unassigned";
      }
    }

    if (conflictOverride) {
      assignment.conflictOverride = true;
      assignment.overriddenBy = req.user._id;
    }

    await assignment.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "Assignment",
      entityId: assignment._id,
      details: {
        type: "course-to-venue-time",
        courseCode: assignment.courseCode,
        venueName: assignment.venueName,
        dayOfWeek: assignment.dayOfWeek,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        conflictOverride: !!conflictOverride,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Schedule slot updated successfully",
      assignment,
    });
  } catch (err) {
    console.error("Update venue-time assignment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get schedule in various views
 * @route   GET /api/assignments/schedule
 */
export const getSchedule = async (req, res) => {
  try {
    const { semester, view, venueId, timeSlotId, department } = req.query;

    const targetDept = req.user.role !== "Admin" ? req.user.department : department;

    let query = { isScheduled: true };

    const courseFilter = {};
    if (semester) courseFilter.semester = semester;
    if (targetDept) courseFilter.departments = targetDept;

    if (semester || targetDept) {
      const courses = await Course.find(courseFilter).select("_id");
      query.courseId = { $in: courses.map((c) => c._id) };
    }

    if (venueId) query.venueId = venueId;

    let assignments = await CourseToVenueTimeAssignment.find(query)
      .populate("courseId", "code title creditUnits level departments semester")
      .populate("venueId", "name building capacity type equipment")
      .populate("timeSlotId", "startTime endTime")
      .populate("lecturerId", "fullName email")
      .sort({ dayOfWeek: 1, startTime: 1 });

    if (timeSlotId) {
      assignments = assignments.filter(
        (a) => a.timeSlotId?._id.toString() === timeSlotId
      );
    }

    res.json({
      success: true,
      schedule: assignments,
      count: assignments.length,
    });
  } catch (err) {
    console.error("Get schedule error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get unscheduled and partially scheduled courses with slot quota statistics
 * @route   GET /api/assignments/unscheduled
 */
export const getUnscheduledCourses = async (req, res) => {
  try {
    const { semester, department } = req.query;

    const targetDept = req.user.role !== "Admin" ? req.user.department : department;

    const courseQuery = { isActive: true };
    if (semester) courseQuery.semester = semester;
    if (targetDept) courseQuery.departments = targetDept;

    // Get active courses matching department and semester filters
    const allCourses = await Course.find(courseQuery).sort({ level: 1, code: 1 });

    // Get all scheduled assignments for these courses
    const allScheduled = await CourseToVenueTimeAssignment.find({
      isScheduled: true,
      courseId: { $in: allCourses.map((c) => c._id) },
    })
      .populate("venueId", "name")
      .populate("timeSlotId", "startTime endTime");

    // Group scheduled assignments by courseId
    const scheduledByCourse = new Map();
    allScheduled.forEach((s) => {
      if (!s.courseId) return;
      const cid = s.courseId.toString();
      if (!scheduledByCourse.has(cid)) {
        scheduledByCourse.set(cid, []);
      }
      scheduledByCourse.get(cid).push({
        _id: s._id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.timeSlotId?.startTime || s.startTime,
        endTime: s.timeSlotId?.endTime || s.endTime,
        venueName: s.venueId?.name || s.venueName,
        lecturerName: s.lecturerName,
      });
    });

    // Get lecturer assignments for all active courses
    const clAssignments = await CourseToLecturerAssignment.find({
      courseId: { $in: allCourses.map((c) => c._id) },
    }).populate("lecturerId", "fullName email department");

    const clMap = new Map();
    clAssignments.forEach((cl) => {
      if (cl.courseId && cl.lecturerId) {
        clMap.set(cl.courseId.toString(), cl.lecturerId);
      }
    });

    const coursesWithQuota = allCourses.map((course) => {
      const cid = course._id.toString();
      const slots = scheduledByCourse.get(cid) || [];
      const allocatedSlots = slots.length;
      const maxSlots = course.creditUnits || 2;
      const remainingSlots = Math.max(0, maxSlots - allocatedSlots);
      const lecturer = clMap.get(cid) || null;

      let status = "unscheduled";
      if (allocatedSlots >= maxSlots) {
        status = "completed";
      } else if (allocatedSlots > 0) {
        status = "partial";
      }

      return {
        courseId: course,
        lecturerId: lecturer,
        allocatedSlots,
        maxSlots,
        remainingSlots,
        status,
        slots,
      };
    });

    // For backwards compatibility: unscheduled list contains courses with status !== 'completed'
    const unscheduledOnly = coursesWithQuota.filter((c) => c.status !== "completed");

    res.json({
      success: true,
      courses: coursesWithQuota,
      unscheduled: unscheduledOnly,
      count: unscheduledOnly.length,
      summary: {
        totalCourses: coursesWithQuota.length,
        unscheduledCount: coursesWithQuota.filter((c) => c.status === "unscheduled").length,
        partialCount: coursesWithQuota.filter((c) => c.status === "partial").length,
        completedCount: coursesWithQuota.filter((c) => c.status === "completed").length,
      },
    });
  } catch (err) {
    console.error("Get unscheduled error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a venue-time assignment
 * @route   DELETE /api/assignments/course-to-venue-time/:id
 */
export const deleteCourseToVenueTime = async (req, res) => {
  try {
    const assignment = await CourseToVenueTimeAssignment.findById(req.params.id);
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    await CourseToVenueTimeAssignment.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Delete",
      entityType: "Assignment",
      entityId: req.params.id,
      details: {
        type: "course-to-venue-time",
        courseCode: assignment.courseCode,
        venueName: assignment.venueName,
        dayOfWeek: assignment.dayOfWeek,
      },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Schedule assignment deleted successfully" });
  } catch (err) {
    console.error("Delete course-to-venue-time error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════
// LECTURER SCHEDULE
// ═══════════════════════════════════════════════════════════

/**
 * @desc    Get lecturer's personal schedule
 * @route   GET /api/assignments/lecturer/:lecturerId/schedule
 */
export const getLecturerSchedule = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { semester } = req.query;

    // Get course-to-lecturer assignments
    const clQuery = { lecturerId };
    if (semester) clQuery.semester = semester;

    const clAssignments = await CourseToLecturerAssignment.find(clQuery);
    const courseIds = clAssignments.map((a) => a.courseId);

    const scheduleQuery = {
      $or: [
        { lecturerId },
        { courseId: { $in: courseIds } },
      ],
      isScheduled: true,
    };

    if (semester) {
      const semesterCourses = await Course.find({ semester }).select("_id");
      scheduleQuery.courseId = { $in: semesterCourses.map((c) => c._id) };
    }

    // Get venue-time assignments for those courses
    const schedule = await CourseToVenueTimeAssignment.find(scheduleQuery)
      .populate("courseId", "code title creditUnits departments level semester")
      .populate("venueId", "name building capacity equipment")
      .populate("timeSlotId", "startTime endTime")
      .sort({ dayOfWeek: 1, startTime: 1 });

    const lecturer = await User.findById(lecturerId).select("fullName");

    res.json({
      success: true,
      lecturerId,
      lecturerName: lecturer?.fullName,
      semester: semester || "All",
      schedule: schedule.map((s) => ({
        assignmentId: s._id,
        courseCode: s.courseId?.code || s.courseCode,
        courseTitle: s.courseId?.title || s.courseTitle,
        creditUnits: s.courseId?.creditUnits,
        level: s.courseId?.level,
        venue: s.venueId?.name || s.venueName,
        capacity: s.venueId?.capacity,
        dayOfWeek: s.dayOfWeek,
        startTime: s.timeSlotId?.startTime || s.startTime,
        endTime: s.timeSlotId?.endTime || s.endTime,
        enrolledDepartments: s.courseId?.departments,
        description: s.description || "",
      })),
    });
  } catch (err) {
    console.error("Get lecturer schedule error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    AUTOMATIC TIMETABLE GENERATOR
 * @route   POST /api/assignments/auto-generate
 */
export const autoGenerateSchedule = async (req, res) => {
  try {
    const { semester, overwrite } = req.body;

    if (!semester || !["1st Semester", "2nd Semester"].includes(semester)) {
      return res.status(400).json({
        success: false,
        message: "A valid semester ('1st Semester' or '2nd Semester') is required for auto-generation",
      });
    }

    // Determine target department scope
    const targetDept = req.user.role !== "Admin" ? req.user.department : (req.body.department || null);

    const courseQuery = { semester, isActive: true };
    if (targetDept) {
      courseQuery.departments = targetDept;
    }

    // 1. If overwrite is true, delete existing assignments ONLY for courses within target department and semester
    const targetCourses = await Course.find(courseQuery).select("_id");
    const targetCourseIds = targetCourses.map((c) => c._id);

    if (overwrite && targetCourseIds.length > 0) {
      await CourseToVenueTimeAssignment.deleteMany({
        courseId: { $in: targetCourseIds },
      });
    }

    // 2. Fetch all active unscheduled courses matching department/semester
    const allCourses = await Course.find(courseQuery).sort({ level: 1, creditUnits: -1 });

    const existingAssignments = await CourseToVenueTimeAssignment.find({ isScheduled: true })
      .populate("courseId", "level departments code title");
    const scheduledCourseIds = new Set(existingAssignments.map((a) => a.courseId?._id?.toString() || a.courseId?.toString()));

    const unscheduledCourses = allCourses.filter((c) => !scheduledCourseIds.has(c._id.toString()));

    if (unscheduledCourses.length === 0) {
      return res.json({
        success: true,
        message: `No unscheduled courses to generate schedule for ${targetDept ? `in ${targetDept}` : ""} (${semester})`,
        scheduledCount: 0,
        scheduledCoursesCount: 0,
        unplacedCount: 0,
        unplacedCourses: [],
        unassignedLecturerCount: 0,
        unassignedLecturerCourses: [],
        generated: [],
      });
    }

    // 3. Fetch resources: Venues, TimeSlots, Lecturer Assignments
    const venues = await Venue.find({ isActive: true }).sort({ capacity: -1 });
    const timeSlots = await TimeSlot.find({ isActive: true }).sort({ startTime: 1 });
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    if (venues.length === 0 || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Active venues and time slots are required to generate timetable",
      });
    }

    // Find consecutive 1-hour time slot pairs (minimum 2-hour consecutive block)
    const consecutivePairs = [];
    for (let i = 0; i < timeSlots.length - 1; i++) {
      const s1 = timeSlots[i];
      const s2 = timeSlots[i + 1];
      if (s1.startTime === "13:00" || s2.startTime === "13:00") continue;
      if (s1.endTime === s2.startTime) {
        consecutivePairs.push([s1, s2]);
      }
    }

    const clAssignments = await CourseToLecturerAssignment.find({
      courseId: { $in: allCourses.map((c) => c._id) },
    }).populate("lecturerId", "fullName");

    const clMap = new Map();
    clAssignments.forEach((cl) => {
      if (cl.courseId) {
        clMap.set(cl.courseId.toString(), cl);
      }
    });

    // 4. In-Memory Constraint Matrix
    const occupiedVenues = new Set();
    const occupiedLecturers = new Set();
    const occupiedDeptLevels = new Set(); // Key: `${dept}-${level}-${day}-${slotId}`
    const slotUsage = {};
    const levelDayCounts = {};

    existingAssignments.forEach((a) => {
      const vKey = `${a.venueId.toString()}-${a.dayOfWeek}-${a.timeSlotId.toString()}`;
      occupiedVenues.add(vKey);

      if (a.lecturerId) {
        const lKey = `${a.lecturerId.toString()}-${a.dayOfWeek}-${a.timeSlotId.toString()}`;
        occupiedLecturers.add(lKey);
      }

      if (a.courseId?.level && a.courseId?.departments) {
        a.courseId.departments.forEach((d) => {
          const dlKey = `${d}-${a.courseId.level}-${a.dayOfWeek}-${a.timeSlotId.toString()}`;
          occupiedDeptLevels.add(dlKey);
        });
        const dayLevelKey = `${a.courseId.level}-${a.dayOfWeek}`;
        levelDayCounts[dayLevelKey] = (levelDayCounts[dayLevelKey] || 0) + 1;
      }

      const daySlotKey = `${a.dayOfWeek}-${a.timeSlotId.toString()}`;
      slotUsage[daySlotKey] = (slotUsage[daySlotKey] || 0) + 1;
    });

    const newAssignments = [];
    const unplacedCourses = [];
    const unassignedLecturerCourses = [];

    // 5. Algorithm: Schedule each course in a 2-hour consecutive block + optional 1-hour extra slot
    for (const course of unscheduledCourses) {
      const cl = clMap.get(course._id.toString());
      const lecturerId = cl?.lecturerId?._id?.toString();
      const lecturerName = cl?.lecturerId?.fullName || "Unassigned";
      const clAssignmentId = cl?._id;
      const courseDepts = course.departments && course.departments.length > 0 ? course.departments : [targetDept || "Computer Science"];

      if (!lecturerId) {
        unassignedLecturerCourses.push({
          courseCode: course.code,
          courseTitle: course.title,
          level: course.level,
          departments: courseDepts,
        });
      }

      // STEP 5A: Find optimal 2-HOUR CONSECUTIVE BLOCK
      let bestBlock = null;
      let minPenalty = Infinity;

      for (const day of DAYS) {
        for (const [slot1, slot2] of consecutivePairs) {
          const daySlotKey1 = `${day}-${slot1._id.toString()}`;
          const daySlotKey2 = `${day}-${slot2._id.toString()}`;

          // Enforce max 5 concurrent lectures per time slot
          if ((slotUsage[daySlotKey1] || 0) >= 5 || (slotUsage[daySlotKey2] || 0) >= 5) {
            continue;
          }

          for (const venue of venues) {
            const vKey1 = `${venue._id.toString()}-${day}-${slot1._id.toString()}`;
            const vKey2 = `${venue._id.toString()}-${day}-${slot2._id.toString()}`;

            const lKey1 = lecturerId ? `${lecturerId}-${day}-${slot1._id.toString()}` : null;
            const lKey2 = lecturerId ? `${lecturerId}-${day}-${slot2._id.toString()}` : null;

            // Check hard constraints for BOTH slots
            if (occupiedVenues.has(vKey1) || occupiedVenues.has(vKey2)) continue;
            if (lKey1 && (occupiedLecturers.has(lKey1) || occupiedLecturers.has(lKey2))) continue;

            // Check department + level clash (cohort clash for any shared department at same level)
            let deptLevelClash = false;
            for (const dept of courseDepts) {
              const dlKey1 = `${dept}-${course.level}-${day}-${slot1._id.toString()}`;
              const dlKey2 = `${dept}-${course.level}-${day}-${slot2._id.toString()}`;
              if (occupiedDeptLevels.has(dlKey1) || occupiedDeptLevels.has(dlKey2)) {
                deptLevelClash = true;
                break;
              }
            }
            if (deptLevelClash) continue;

            // Penalty calculation
            let penalty = 0;
            penalty += ((slotUsage[daySlotKey1] || 0) + (slotUsage[daySlotKey2] || 0)) * 50;

            const dayLevelKey = `${course.level}-${day}`;
            penalty += (levelDayCounts[dayLevelKey] || 0) * 20;

            penalty += Math.random() * 2;

            if (penalty < minPenalty) {
              minPenalty = penalty;
              bestBlock = {
                venue,
                slot1,
                slot2,
                dayOfWeek: day,
                vKey1,
                vKey2,
                lKey1,
                lKey2,
                dayLevelKey,
                daySlotKey1,
                daySlotKey2,
              };
            }
          }
        }
      }

      if (bestBlock) {
        // Reserve 2-hour consecutive block in matrix
        occupiedVenues.add(bestBlock.vKey1);
        occupiedVenues.add(bestBlock.vKey2);
        if (bestBlock.lKey1) {
          occupiedLecturers.add(bestBlock.lKey1);
          occupiedLecturers.add(bestBlock.lKey2);
        }
        for (const dept of courseDepts) {
          occupiedDeptLevels.add(`${dept}-${course.level}-${bestBlock.dayOfWeek}-${bestBlock.slot1._id.toString()}`);
          occupiedDeptLevels.add(`${dept}-${course.level}-${bestBlock.dayOfWeek}-${bestBlock.slot2._id.toString()}`);
        }

        levelDayCounts[bestBlock.dayLevelKey] = (levelDayCounts[bestBlock.dayLevelKey] || 0) + 2;
        slotUsage[bestBlock.daySlotKey1] = (slotUsage[bestBlock.daySlotKey1] || 0) + 1;
        slotUsage[bestBlock.daySlotKey2] = (slotUsage[bestBlock.daySlotKey2] || 0) + 1;

        // Push 2 consecutive 1-hour slot records
        newAssignments.push({
          courseId: course._id,
          courseToLecturerAssignmentId: clAssignmentId,
          venueId: bestBlock.venue._id,
          timeSlotId: bestBlock.slot1._id,
          dayOfWeek: bestBlock.dayOfWeek,
          createdBy: req.user._id,
          isScheduled: true,
          courseCode: course.code,
          courseTitle: course.title,
          lecturerId: lecturerId || undefined,
          lecturerName,
          venueName: bestBlock.venue.name,
          startTime: bestBlock.slot1.startTime,
          endTime: bestBlock.slot1.endTime,
        });

        newAssignments.push({
          courseId: course._id,
          courseToLecturerAssignmentId: clAssignmentId,
          venueId: bestBlock.venue._id,
          timeSlotId: bestBlock.slot2._id,
          dayOfWeek: bestBlock.dayOfWeek,
          createdBy: req.user._id,
          isScheduled: true,
          courseCode: course.code,
          courseTitle: course.title,
          lecturerId: lecturerId || undefined,
          lecturerName,
          venueName: bestBlock.venue.name,
          startTime: bestBlock.slot2.startTime,
          endTime: bestBlock.slot2.endTime,
        });

        // STEP 5B: Optional 1-Hour Extra Slot for courses with >= 3 Credit Units
        if (course.creditUnits >= 3) {
          let bestExtraSlot = null;
          let minExtraPenalty = Infinity;

          for (const day of DAYS) {
            // Prefer a different day for the extra 1-hour slot
            if (day === bestBlock.dayOfWeek && DAYS.length > 1) continue;

            for (const slot of timeSlots) {
              if (slot.startTime === "13:00") continue;

              const daySlotKey = `${day}-${slot._id.toString()}`;
              if ((slotUsage[daySlotKey] || 0) >= 5) continue;

              for (const venue of venues) {
                const vKey = `${venue._id.toString()}-${day}-${slot._id.toString()}`;
                const lKey = lecturerId ? `${lecturerId}-${day}-${slot._id.toString()}` : null;

                if (occupiedVenues.has(vKey)) continue;
                if (lKey && occupiedLecturers.has(lKey)) continue;

                let deptLevelClash = false;
                for (const dept of courseDepts) {
                  const dlKey = `${dept}-${course.level}-${day}-${slot._id.toString()}`;
                  if (occupiedDeptLevels.has(dlKey)) {
                    deptLevelClash = true;
                    break;
                  }
                }
                if (deptLevelClash) continue;

                let penalty = 0;
                penalty += (slotUsage[daySlotKey] || 0) * 50;
                penalty += Math.random() * 2;

                if (penalty < minExtraPenalty) {
                  minExtraPenalty = penalty;
                  bestExtraSlot = {
                    venue,
                    timeSlot: slot,
                    dayOfWeek: day,
                    vKey,
                    lKey,
                    daySlotKey,
                  };
                }
              }
            }
          }

          if (bestExtraSlot) {
            occupiedVenues.add(bestExtraSlot.vKey);
            if (bestExtraSlot.lKey) occupiedLecturers.add(bestExtraSlot.lKey);
            for (const dept of courseDepts) {
              occupiedDeptLevels.add(`${dept}-${course.level}-${bestExtraSlot.dayOfWeek}-${bestExtraSlot.timeSlot._id.toString()}`);
            }
            slotUsage[bestExtraSlot.daySlotKey] = (slotUsage[bestExtraSlot.daySlotKey] || 0) + 1;

            newAssignments.push({
              courseId: course._id,
              courseToLecturerAssignmentId: clAssignmentId,
              venueId: bestExtraSlot.venue._id,
              timeSlotId: bestExtraSlot.timeSlot._id,
              dayOfWeek: bestExtraSlot.dayOfWeek,
              createdBy: req.user._id,
              isScheduled: true,
              courseCode: course.code,
              courseTitle: course.title,
              lecturerId: lecturerId || undefined,
              lecturerName,
              venueName: bestExtraSlot.venue.name,
              startTime: bestExtraSlot.timeSlot.startTime,
              endTime: bestExtraSlot.timeSlot.endTime,
            });
          }
        }
      } else {
        unplacedCourses.push({
          courseCode: course.code,
          courseTitle: course.title,
          level: course.level,
          creditUnits: course.creditUnits,
          departments: courseDepts,
          reason: `No conflict-free 2-hour slot available (venue saturation, slot limit (max 5), or cohort clash with other ${course.level}L courses)`,
        });
      }
    }

    // 6. Bulk Insert to MongoDB
    let createdDocs = [];
    if (newAssignments.length > 0) {
      createdDocs = await CourseToVenueTimeAssignment.insertMany(newAssignments);
    }

    const distinctScheduledCourses = new Set(newAssignments.map((a) => a.courseCode)).size;

    // 7. Audit Log
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "Assignment",
      details: {
        type: "auto-generate-timetable",
        scheduledSlots: createdDocs.length,
        scheduledCoursesCount: distinctScheduledCourses,
        unplacedCount: unplacedCourses.length,
        unassignedLecturerCount: unassignedLecturerCourses.length,
        semester: semester || "All",
        overwrite: !!overwrite,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Successfully auto-generated timetable! ${distinctScheduledCourses} courses (${createdDocs.length} total lecture slots) scheduled.`,
      scheduledCount: createdDocs.length,
      scheduledCoursesCount: distinctScheduledCourses,
      unplacedCount: unplacedCourses.length,
      unplacedCourses,
      unassignedLecturerCount: unassignedLecturerCourses.length,
      unassignedLecturerCourses,
      assignments: createdDocs,
    });
  } catch (err) {
    console.error("Auto-generate timetable error:", err);
    res.status(500).json({ success: false, message: "Auto-generation failed", error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

async function checkConflictInternal(
  courseId,
  lecturerId,
  venueId,
  timeSlotId,
  dayOfWeek,
  excludeAssignmentId = null
) {
  const conflicts = [];
  const baseQuery = {
    dayOfWeek,
    timeSlotId,
    isScheduled: true,
  };
  if (excludeAssignmentId) {
    baseQuery._id = { $ne: excludeAssignmentId };
  }

  // 1. Check max 5 lectures per slot capacity
  const totalInSlot = await CourseToVenueTimeAssignment.countDocuments(baseQuery);
  if (totalInSlot >= 5) {
    conflicts.push({
      type: "SLOT_CAPACITY_EXCEEDED",
      message: `This time slot has already reached the maximum capacity of 5 concurrent lectures.`,
    });
  }

  // 2. Check venue conflict
  if (venueId) {
    const venueConflict = await CourseToVenueTimeAssignment.findOne({
      ...baseQuery,
      venueId,
    }).populate("courseId", "code title");

    if (venueConflict) {
      conflicts.push({
        type: "VENUE_CONFLICT",
        conflictingCourse: venueConflict.courseId?.code || venueConflict.courseCode,
        message: `Venue is already assigned to ${venueConflict.courseId?.code || venueConflict.courseCode} on ${dayOfWeek} at this time`,
      });
    }
  }

  // 3. Check lecturer conflict
  if (lecturerId) {
    const lecturerConflict = await CourseToVenueTimeAssignment.findOne({
      ...baseQuery,
      lecturerId,
    }).populate("courseId", "code title");

    if (lecturerConflict) {
      conflicts.push({
        type: "LECTURER_CONFLICT",
        conflictingCourse: lecturerConflict.courseId?.code || lecturerConflict.courseCode,
        message: `Lecturer is already teaching ${lecturerConflict.courseId?.code || lecturerConflict.courseCode} on ${dayOfWeek} at this time`,
      });
    }
  }

  // 4. Check Student Cohort Clash (Same Level + Overlapping Departments)
  if (courseId) {
    const targetCourse = await Course.findById(courseId).select("code title level departments");
    if (targetCourse) {
      // Find all assignments in this slot
      const slotAssignments = await CourseToVenueTimeAssignment.find(baseQuery)
        .populate("courseId", "code title level departments");

      for (const existing of slotAssignments) {
        const existingCourse = existing.courseId;
        if (!existingCourse) continue;

        if (existingCourse._id.toString() === targetCourse._id.toString()) {
          conflicts.push({
            type: "DUPLICATE_COURSE",
            conflictingCourse: targetCourse.code,
            message: `${targetCourse.code} is already scheduled in this slot on ${dayOfWeek}.`,
          });
          continue;
        }

        // Check if both courses share the same level
        if (existingCourse.level === targetCourse.level) {
          const targetDepts = Array.isArray(targetCourse.departments) ? targetCourse.departments : [];
          const existingDepts = Array.isArray(existingCourse.departments) ? existingCourse.departments : [];

          // Find intersection
          const overlapping = targetDepts.filter((dept) => existingDepts.includes(dept));

          if (overlapping.length > 0) {
            conflicts.push({
              type: "COHORT_CONFLICT",
              conflictingCourse: existingCourse.code,
              overlappingDepartments: overlapping,
              message: `Cohort clash: ${targetCourse.level}L students in [${overlapping.join(", ")}] take both ${targetCourse.code} and ${existingCourse.code}. Both cannot hold at the same time.`,
            });
          }
        }
      }
    }
  }

  return { conflicts };
}
