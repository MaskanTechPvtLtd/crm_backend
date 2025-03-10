import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { managersAllLeads } from "../../controllers/Manager/managersAllLeads.controller.js";

const router = express.Router();

router.get("/:manager_id", verifyJWT, managersAllLeads);

export default router;
