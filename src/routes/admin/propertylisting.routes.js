import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { addProperty, GetAllProperties, GetPropertyById, UpdateProperty, DeleteProperty, AssignPropertyToAgent, toggleArchiveProperty, suggestLeads } from "../../controllers/admin/PropertyListingController/propertylisting.controller.js";

const router = express.Router();

router.post("/addproperty", verifyJWT, upload.array("media", 5), addProperty);
router.get("/getallproperties", verifyJWT, GetAllProperties);
router.get("/getproperty/:property_id", verifyJWT, GetPropertyById);
router.put("/updateproperty/:property_id", verifyJWT, upload.array("media", 5), UpdateProperty);
router.put("/toggle-archive/:property_id", verifyJWT, toggleArchiveProperty);
router.delete("/deleteproperty/:property_id", verifyJWT, DeleteProperty);
router.post("/assign-property", verifyJWT, AssignPropertyToAgent);
router.get("/suggest-leads/:property_id", verifyJWT, suggestLeads)



export default router;