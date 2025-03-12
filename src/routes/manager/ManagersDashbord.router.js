import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { GetManagerDailyDetailedReport } from "../../controllers/Manager/ManagersDashbord.controller.js";

const router = express.Router();

router.get("/dashbord-details/:manager_id", verifyJWT, GetManagerDailyDetailedReport);


export default router;
