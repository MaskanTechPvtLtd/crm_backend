import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../../controllers/Notifications/notifications.controller.js";
import { addCustomerFeedback, getFeedback } from "../../controllers/CustomerFeedback/customerfeedback.controller.js";


const router = express.Router();

router.get("/getnotification", verifyJWT, getNotifications);
router.put("/markasread/:notificationId", verifyJWT, markNotificationAsRead);
router.put("/markall", verifyJWT, markAllNotificationsAsRead);
router.delete("/delete/:notificationId", verifyJWT, deleteNotification);
router.post("/addfeedback", verifyJWT, addCustomerFeedback);
router.get("/feedback", verifyJWT, getFeedback);


export default router;