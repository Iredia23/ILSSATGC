import Course from "../models/Course.js";
import CourseToLecturerAssignment from "../models/CourseToLecturerAssignment.js";
import CourseToVenueTimeAssignment from "../models/CourseToVenueTimeAssignment.js";
import { logAudit } from "../middleware/audit.js";

/**
 * @desc    Get all courses with pagination, search, and filters
 * @route   GET /api/courses
 */
export const getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      level,
      semester,
      department,
      search,
    } = req.query;

    const query = { isActive: true };

    if (level) query.level = parseInt(level);
    if (semester) query.semester = semester;
    if (department) query.departments = { $in: [department] };
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .sort({ level: 1, code: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get courses error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get single course by ID
 * @route   GET /api/courses/:id
 */
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Get lecturer assignments
    const assignments = await CourseToLecturerAssignment.find({
      courseId: course._id,
    }).populate("lecturerId", "fullName email");

    res.json({
      success: true,
      course,
      assignments,
    });
  } catch (err) {
    console.error("Get course error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create a new course (Exam Officer only)
 * @route   POST /api/courses
 */
export const createCourse = async (req, res) => {
  try {
    const { code, title, creditUnits, level, departments, semester, description } =
      req.body;

    // Check for duplicate code
    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Course with code ${code} already exists`,
      });
    }

    const course = await Course.create({
      code: code.toUpperCase(),
      title,
      creditUnits,
      level,
      departments,
      semester,
      description,
      createdBy: req.user._id,
    });

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "Course",
      entityId: course._id,
      details: { code: course.code, title: course.title },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, course });
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a course (Exam Officer only, code not editable)
 * @route   PUT /api/courses/:id
 */
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const { title, creditUnits, level, departments, semester, description, isActive } =
      req.body;

    // Don't allow code changes
    if (req.body.code && req.body.code !== course.code) {
      return res.status(400).json({
        success: false,
        message: "Course code cannot be changed",
      });
    }

    if (title) course.title = title;
    if (creditUnits) course.creditUnits = creditUnits;
    if (level) course.level = level;
    if (departments) course.departments = departments;
    if (semester) course.semester = semester;
    if (description !== undefined) course.description = description;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Update",
      entityType: "Course",
      entityId: course._id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.json({ success: true, course });
  } catch (err) {
    console.error("Update course error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a course and its assignments
 * @route   DELETE /api/courses/:id
 */
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Check for active assignments
    const lecturerAssignments = await CourseToLecturerAssignment.countDocuments({
      courseId: course._id,
    });
    const venueAssignments = await CourseToVenueTimeAssignment.countDocuments({
      courseId: course._id,
    });

    if (lecturerAssignments > 0 || venueAssignments > 0) {
      // Delete all associated assignments
      await CourseToLecturerAssignment.deleteMany({ courseId: course._id });
      await CourseToVenueTimeAssignment.deleteMany({ courseId: course._id });
    }

    await Course.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Delete",
      entityType: "Course",
      entityId: req.params.id,
      details: {
        code: course.code,
        title: course.title,
        removedLecturerAssignments: lecturerAssignments,
        removedVenueAssignments: venueAssignments,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Course ${course.code} deleted successfully`,
    });
  } catch (err) {
    console.error("Delete course error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
