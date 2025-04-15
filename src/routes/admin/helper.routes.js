import express from "express";
import { GetStatus, GetLeadSource, GetPropertyType, GetLeadStatus, SeedStatuses, SeedLeadSources, SeedPropertyTypes, SeedLeadStatuses } from "../../controllers/admin/HelperController/helper.conroller.js";

const router = express.Router();

router.get("/statuses", GetStatus);
router.get("/leadsources", GetLeadSource);
router.get("/propertytype", GetPropertyType);
router.get("/leadstatus", GetLeadStatus);
router.post("/seed-statuses", SeedStatuses);
router.post("/seed-leadsources", SeedLeadSources);
router.post("/seed-propertytypes", SeedPropertyTypes);
router.post("/seed-leadstatuses", SeedLeadStatuses);

export default router;