import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { GetTeamDetailsofAgent, GetAgentsDashbordCounts } from "../../controllers/SalesAgent/teamDetails.controller.js";

const router = express.Router();

router.get("/getTeam/:agent_id", verifyJWT, GetTeamDetailsofAgent);
router.get("/getcount/:agent_id", verifyJWT, GetAgentsDashbordCounts);

export default router;
