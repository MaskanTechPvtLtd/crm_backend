import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { GetManagersEmployees, GetEmployeebyId } from "../../controllers/Manager/managersEmployees.controller.js";

const router = express.Router();

router.get("/:manager_id", verifyJWT, GetManagersEmployees);
router.post("/managers-agents/:id", verifyJWT, GetEmployeebyId);

export default router;
