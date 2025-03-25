import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { GetManagerDailyDetailedReport, GetManagerDashbordCounts } from "../../controllers/Manager/ManagersDashbord.controller.js";

const router = express.Router();

router.get("/dashbord-details/:manager_id", verifyJWT, GetManagerDailyDetailedReport);
router.get("/dashbord-count/:manager_id", verifyJWT, GetManagerDashbordCounts);


export default router;
