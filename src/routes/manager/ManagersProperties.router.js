import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getPropertiesByManager, AssignPropertyToEmployee } from "../../controllers/Manager/ManagersProperties.controller.js";

const router = express.Router();

router.get("/properties/:manager_id", verifyJWT, getPropertiesByManager);
router.post("/properties/assignto-agent", verifyJWT, AssignPropertyToEmployee);


export default router;
