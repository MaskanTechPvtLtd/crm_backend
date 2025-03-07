import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getPropertiesByAgent, UpdatePropertyStatus } from "../../controllers/SalesAgent/agentproperties.controller.js";

const router = express.Router();

router.get("/agent/:agent_id", verifyJWT, getPropertiesByAgent);
router.put("/updatestatus/:property_id", verifyJWT, UpdatePropertyStatus);

export default router;
