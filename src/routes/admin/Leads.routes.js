import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { AddNewLead, GetLeadById, GetAllLeads, AssignLeadToAgent,  getLeadInteractions, DeleteLead } from "../../controllers/admin/LeadsController/leads.controller.js";

const router = express.Router();

router.post("/AddnewLead", verifyJWT, AddNewLead);
router.get("/getLeadByid/:lead_id", verifyJWT, GetLeadById)
router.get("/getallLeads", verifyJWT, GetAllLeads)
router.post("/assignleadtoagent", verifyJWT, AssignLeadToAgent)
router.get("/getlogofintertaction/:lead_id", verifyJWT, getLeadInteractions)
router.delete("/deletelead/:lead_id", verifyJWT, DeleteLead)


export default router; 