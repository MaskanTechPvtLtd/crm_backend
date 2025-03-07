import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { GetTeamDetailsofAgent } from "../../controllers/SalesAgent/teamDetails.controller.js";

const router = express.Router();

router.get("/getTeam/:agent_id", verifyJWT, GetTeamDetailsofAgent);

export default router;
