import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getManagersAllEmployeeLocations, getManagersEmployeeLocationById } from "../../controllers/Manager/ManagersFieldAgents.controller.js";

const router = express.Router();

router.get("/feild-agents/:manager_id", verifyJWT, getManagersAllEmployeeLocations);
router.get("/feild-agentby/:employee_id/:manager_id", verifyJWT, getManagersEmployeeLocationById);


export default router;
