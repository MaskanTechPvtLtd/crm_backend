import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { AddNewLead, GetLeadById, GetAllLeads, AssignLeadToAgent, logInteraction, getLeadInteractions } from "../../controllers/admin/LeadsController/leads.controller.js";

const router = express.Router();

router.post("/AddnewLead", verifyJWT, AddNewLead);
router.get("/getLeadByid/:lead_id", verifyJWT, GetLeadById)
router.get("/getallLeads", verifyJWT, GetAllLeads)
router.post("/assignleadtoagent", verifyJWT, AssignLeadToAgent)
router.post("/loginteraction", verifyJWT, logInteraction)
router.get("/getlogofintertaction/:lead_id", verifyJWT, getLeadInteractions)



export default router; 