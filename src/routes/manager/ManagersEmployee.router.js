import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { GetManagersEmployees, GetEmployeebyId, DeleteAgent, SearchEmployee, GetManagersTeam } from "../../controllers/Manager/managersEmployees.controller.js";

const router = express.Router();

router.get("/employees/:manager_id", verifyJWT, GetManagersEmployees);
router.get("/managers-agents/:id", verifyJWT, GetEmployeebyId);
router.delete("/managers-agents/:id", verifyJWT, DeleteAgent);
router.get("/search-agents/:manager_id", verifyJWT, SearchEmployee);
router.get("/getmanagers-team/:manager_id", verifyJWT, GetManagersTeam);


export default router;
