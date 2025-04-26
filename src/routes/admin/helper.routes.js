import express from "express";
import {
    GetStatus,
    GetLeadSource,
    GetPropertyType,
    GetLeadStatus,
    SeedStatuses,
    SeedPropertyAmenities,
    SeedLeadSources,
    SeedPropertyTypes,
    SeedLeadStatuses,
    SeedPropertyStatus,
    GetPropertyAmenities,
    GetpropertyStatus
} from "../../controllers/admin/HelperController/helper.conroller.js";

const router = express.Router();

router.get("/statuses", GetStatus);
router.get("/leadsources", GetLeadSource);
router.get("/propertytype", GetPropertyType);
router.get("/leadstatus", GetLeadStatus);
router.get("/amenities", GetPropertyAmenities);
router.get("/propertystatus", GetpropertyStatus);

router.post("/seed-statuses", SeedStatuses);
router.post("/seed-leadsources", SeedLeadSources);
router.post("/seed-propertytypes", SeedPropertyTypes);
router.post("/seed-leadstatuses", SeedLeadStatuses);
router.post("/seed-Amenities", SeedPropertyAmenities);
router.post("/seed-propetyStatus", SeedPropertyStatus);


export default router;