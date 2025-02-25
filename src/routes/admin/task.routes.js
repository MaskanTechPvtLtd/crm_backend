import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { createTask, getTasks, deleteTask, updateTask } from "../../controllers/admin/TaskController/task.controller.js";

const router = express.Router();

router.post("/addtask", verifyJWT, createTask);
router.get("/gettask", verifyJWT, getTasks);
router.delete("/deletetask/:task_id", verifyJWT, deleteTask);
router.put("/updatetask/:task_id", verifyJWT, updateTask);



export default router; 