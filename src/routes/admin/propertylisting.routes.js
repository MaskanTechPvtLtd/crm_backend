import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { addProperty, GetAllProperties, GetPropertyById, UpdateProperty, DeleteProperty } from "../../controllers/admin/PropertyListingController/propertylisting.controller.js";

const router = express.Router();

router.post("/addproperty", verifyJWT, upload.array("media", 10), addProperty);
router.get("/getallproperties", verifyJWT, GetAllProperties);
router.get("/getproperty/:property_id", verifyJWT, GetPropertyById);
router.put("/updateproperty/:id", verifyJWT, UpdateProperty);
// router.put("/updateEmployee/:id", verifyJWT, upload.fields([{ name: "profile_picture", maxCount: 1 }]), UpdateEmployee);
router.delete("/deleteproperty/:id", verifyJWT, DeleteProperty);

export default router;