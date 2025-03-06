import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getLeadsByAgent, logInteraction } from "../../controllers/SalesAgent/allLeads.controller.js";

const router = express.Router();

router.get("/agent/:agent_id", verifyJWT, getLeadsByAgent);
router.post("/loginteraction", verifyJWT, logInteraction)

export default router;
