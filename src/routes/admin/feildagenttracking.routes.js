import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getEmployeeLocationsById, addEmployeeLocation, getAllEmployeeLocations} from "../../controllers/admin/FieldAgentTrackingController/fieldagenttracking.controller.js"

const router = express.Router();

router.get("/getEmployeeLocation/:employee_id", verifyJWT, getEmployeeLocationsById)
router.post("/addEmployeeLocation", verifyJWT, addEmployeeLocation)
router.get("/getAllEmployeeLocations", verifyJWT, getAllEmployeeLocations)


export default router;