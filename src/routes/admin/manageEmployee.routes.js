import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import {
    GetAllEmployees,
    GetEmployeebyId,
    UpdateEmployee,
    DeleteEmployee,
    SearchEmployee,
    assignAgentToManager,
    GetEmployeeByManager,
    getEmployeeWithAttendance,
    GetTeamByManagers,
    GetTeamDetailsByManager,
    GetUnassignedEmployees,
    GetUnassignedProperties,
    GetUnassignedLeads,
    toggleEmployeeStatus,
    GetInactiveEmployees, CreateEmployee,
} from "../../controllers/admin/ManageEmployeeController/manageEmployee.controller.js";

const router = express.Router();

router.get("/getAllEmployees", verifyJWT, GetAllEmployees);
router.get("/getEmployees/:id", verifyJWT, GetEmployeebyId);
// router.post("/createEmployee", verifyJWT, upload.single("profile_picture"), CreateEmployee);
router.put("/updateEmployee/:id", verifyJWT, upload.fields([{ name: "profile_picture", maxCount: 1 }]), UpdateEmployee);
router.delete("/deleteEmployee/:id", verifyJWT, DeleteEmployee);
router.get("/SearchEmployee", verifyJWT, SearchEmployee);
router.post("/assignAgentToManager", verifyJWT, assignAgentToManager);
router.get("/getEmployeeByManager/:id", verifyJWT, GetEmployeeByManager);
router.get("/employees/:id/attendance", verifyJWT, getEmployeeWithAttendance);
router.get("/getTeams", verifyJWT, GetTeamByManagers);
router.get("/getTeamDetails/:manager_id", verifyJWT, GetTeamDetailsByManager);
router.get("/get-unassign-employees", verifyJWT, GetUnassignedEmployees);
router.get("/get-unassign-leads", verifyJWT, GetUnassignedLeads);
router.get("/get-unassign-properties", verifyJWT, GetUnassignedProperties);
router.patch("/block-unblockEmployee/:employee_id", verifyJWT, toggleEmployeeStatus);
router.get("/getAllblockemployee", verifyJWT, GetInactiveEmployees);
router.post("/createEmployee", verifyJWT, upload.fields([{ name: "profile_picture", maxCount: 1 }]), CreateEmployee);


export default router; 