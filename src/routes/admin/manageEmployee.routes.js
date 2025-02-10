import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { GetAllEmployees, GetEmployeebyId, UpdateEmployee, DeleteEmployee, SearchEmployee, assignAgentToManager } from "../../controllers/admin/ManageEmployeeController/manageEmployee.controller.js";

const router = express.Router();

router.get("/getAllEmployees", verifyJWT, GetAllEmployees);
router.get("/getEmployees/:id", verifyJWT, GetEmployeebyId);
// router.post("/createEmployee", verifyJWT, upload.single("profile_picture"), CreateEmployee);
router.put("/updateEmployee/:id", verifyJWT, upload.fields([{ name: "profile_picture", maxCount: 1 }]), UpdateEmployee);
router.delete("/deleteEmployee/:id", verifyJWT, DeleteEmployee);
router.get("/SearchEmployee", verifyJWT, SearchEmployee);
router.post("/assignAgentToManager", verifyJWT, assignAgentToManager);

export default router; 