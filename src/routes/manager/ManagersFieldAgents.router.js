import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getManagersAllEmployeeLocations } from "../../controllers/Manager/ManagersFieldAgents.controller.js";

const router = express.Router();

router.get("/feild-agents/:manager_id", verifyJWT, getManagersAllEmployeeLocations);


export default router;
