import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { managersAllLeads, ManagerAssignLeadstoAgent } from "../../controllers/Manager/managersAllLeads.controller.js";

const router = express.Router();

router.get("/:manager_id", verifyJWT, managersAllLeads);
router.post("/:manager_id/assign-lead", verifyJWT, ManagerAssignLeadstoAgent);

export default router;
