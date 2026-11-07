import School from "../models/School.js";
import Department from "../models/Department.js";
import { logAudit } from "../middleware/audit.js";

// ═══════════════════════════════════════════════════════════
// SCHOOL CONTROLLERS
// ═══════════════════════════════════════════════════════════

/**
 * @desc    Get all schools
 * @route   GET /api/schools
 */
export const getSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ name: 1 });
    res.json({
      success: true,
      schools,
      count: schools.length,
    });
  } catch (err) {
    console.error("Get schools error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create a new school (Admin only)
 * @route   POST /api/schools
 */
export const createSchool = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: "School name and code are required" });
    }

    const existing = await School.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "A school with this name or code already exists" });
    }

    const school = await School.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim(),
      createdBy: req.user?._id,
    });

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "School",
      entityId: school._id,
      details: { name: school.name, code: school.code },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, school });
  } catch (err) {
    console.error("Create school error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a school
 * @route   PUT /api/schools/:id
 */
export const updateSchool = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;

    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    if (name) school.name = name.trim();
    if (code) school.code = code.trim().toUpperCase();
    if (description !== undefined) school.description = description.trim();
    if (isActive !== undefined) school.isActive = isActive;

    await school.save();

    res.json({ success: true, school });
  } catch (err) {
    console.error("Update school error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a school
 * @route   DELETE /api/schools/:id
 */
export const deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    // Delete child departments as well
    await Department.deleteMany({ schoolId: school._id });
    await School.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "School and associated departments deleted" });
  } catch (err) {
    console.error("Delete school error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════
// DEPARTMENT CONTROLLERS
// ═══════════════════════════════════════════════════════════

/**
 * @desc    Get all departments (optional filter by schoolId)
 * @route   GET /api/departments
 */
export const getDepartments = async (req, res) => {
  try {
    const { schoolId } = req.query;
    const query = {};
    if (schoolId) query.schoolId = schoolId;

    const departments = await Department.find(query).populate("schoolId", "name code").sort({ name: 1 });

    res.json({
      success: true,
      departments,
      count: departments.length,
    });
  } catch (err) {
    console.error("Get departments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Create a new department under a school (Admin only)
 * @route   POST /api/departments
 */
export const createDepartment = async (req, res) => {
  try {
    const { name, code, schoolId } = req.body;

    if (!name || !code || !schoolId) {
      return res.status(400).json({ success: false, message: "Department name, code, and school are required" });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: "Associated school not found" });
    }

    const existing = await Department.findOne({
      name: name.trim(),
      schoolId,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "A department with this name already exists in this school" });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      schoolId: school._id,
      schoolName: school.name,
      createdBy: req.user?._id,
    });

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      actionType: "Create",
      entityType: "Department",
      entityId: department._id,
      details: { name: department.name, code: department.code, schoolName: school.name },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, department });
  } catch (err) {
    console.error("Create department error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update a department
 * @route   PUT /api/departments/:id
 */
export const updateDepartment = async (req, res) => {
  try {
    const { name, code, isActive } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    if (name) department.name = name.trim();
    if (code) department.code = code.trim().toUpperCase();
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    res.json({ success: true, department });
  } catch (err) {
    console.error("Update department error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete a department
 * @route   DELETE /api/departments/:id
 */
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Department deleted successfully" });
  } catch (err) {
    console.error("Delete department error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
