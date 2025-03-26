import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { AddNewLead,EditLead, GetLeadById, GetAllLeads, AssignLeadToAgent,  getLeadInteractions, DeleteLead, AssignLeadsToAgent, toggleArchiveLead } from "../../controllers/admin/LeadsController/leads.controller.js";

const router = express.Router();

router.post("/AddnewLead", verifyJWT, AddNewLead);
router.put("/EditLead/:lead_id", verifyJWT, EditLead);
router.get("/getLeadByid/:lead_id", verifyJWT, GetLeadById)
router.get("/getallLeads", verifyJWT, GetAllLeads)
router.post("/assignleadtoagent", verifyJWT, AssignLeadsToAgent)
router.get("/getlogofintertaction/:lead_id", verifyJWT, getLeadInteractions)
router.delete("/deletelead/:lead_id", verifyJWT, DeleteLead)
router.put("/:lead_id/toggle-archive", verifyJWT, toggleArchiveLead)


export default router; 