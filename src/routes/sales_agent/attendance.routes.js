import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { checkInEmployee, checkOutEmployee } from "../../controllers/SalesAgent/attendance.controller.js";

const router = express.Router();

router.post("/checkin", verifyJWT, checkInEmployee);
router.post("/checkout", verifyJWT, checkOutEmployee);

export default router;
