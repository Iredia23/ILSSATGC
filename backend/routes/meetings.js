import express from "express";
import {
  bookMeeting,
  getStudentMeetings,
  getLecturerMeetings,
  updateMeetingStatus,
  getLecturerScheduleWithMeetings,
  getAvailableTimeslots,
} from "../controllers/meetingController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/book", authorizeRoles("Student"), bookMeeting);
router.get("/student", authorizeRoles("Student"), getStudentMeetings);
router.get("/lecturer", authorizeRoles("Lecturer", "HOD", "Exam Officer", "Timetable Officer"), getLecturerMeetings);
router.patch("/:id/status", updateMeetingStatus);
router.get("/lecturer/:lecturerId/schedule", getLecturerScheduleWithMeetings);
router.get("/available-slots", getAvailableTimeslots);

export default router;
