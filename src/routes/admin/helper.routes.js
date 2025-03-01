import express from "express";
import { GetStatus, GetLeadSource, GetPropertyType, GetLeadStatus } from "../../controllers/admin/HelperController/helper.conroller.js";

const router = express.Router();

router.get("/statuses", GetStatus);
router.get("/leadsources", GetLeadSource);
router.get("/propertytype", GetPropertyType);
router.get("/leadstatus", GetLeadStatus);

export default router;