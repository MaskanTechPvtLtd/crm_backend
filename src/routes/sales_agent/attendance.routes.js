import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { checkInEmployee, checkOutEmployee, CheckAttendanceStatus } from "../../controllers/SalesAgent/attendance.controller.js";

const router = express.Router();

router.post("/checkin", verifyJWT, checkInEmployee);
router.post("/checkout", verifyJWT, checkOutEmployee);
router.get("/attendance/status/:employee_id", verifyJWT, CheckAttendanceStatus);

export default router;
