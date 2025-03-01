import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getAdminDailyDetailedReport } from "../../controllers/admin/DailyDashbordController/DailyDashbord.controller.js";

const router = express.Router();

router.get("/daily-detailed-report", verifyJWT, getAdminDailyDetailedReport);




export default router; 