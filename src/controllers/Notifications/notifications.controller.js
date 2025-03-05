import Notification from "../../models/notification.model.js";
import Employee from "../../models/employee.model.js";
import UserAuth from "../../models/userauth.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";


export const getNotifications = asyncHandler(async (req, res, next) => {
    // Fetch employee_id of the logged-in user
    const userAuth = await UserAuth.findOne({
        where: { user_id: req.user.user_id },
        include: [{ model: Employee, attributes: ["employee_id"] }]
    });

    if (!userAuth || !userAuth.Employee) {
        return next(new ApiError(404, "Employee not found for this user"));
    }

    const employeeId = userAuth.Employee.employee_id;

    // Fetch notifications for the employee
    const notifications = await Notification.findAll({
        where: {
            user_id: employeeId, 
            is_read: false, // Only fetch unread notifications
        },
        include: [
            {
                model: Employee,
                as: "sender",
                attributes: ["employee_id", "first_name", "last_name"],
            },
        ],
        order: [["created_at", "DESC"]],
    });

    if (!notifications.length) {
        return next(new ApiError(404, "No notifications found"));
    }

    res.status(200).json(new ApiResponse(200, {
        count: notifications.length,
        notifications,
    }));
});


export const markNotificationAsRead = asyncHandler(async (req, res, next) => {
    const id = (req.params.notificationId); // Convert to integer
    const updated = await Notification.update(
        { is_read: true },
        {
            where: {
                notification_id: id,
                is_read: false,
            },
            returning: true,
        }
    );
    res.status(200).json(new ApiResponse(200,
        [], "Notification marked as read",))
});


export const markAllNotificationsAsRead = asyncHandler(async (req, res, next) => {
    const userAuth = await UserAuth.findOne({
        where: { user_id: req.user.user_id },
        include: [{ model: Employee, attributes: ["employee_id"] }]
    });

    if (!userAuth || !userAuth.Employee) {
        return next(new ApiError(404, "Employee not found for this user"));
    }

    const employeeId = userAuth.Employee.employee_id;
    const updated = await Notification.update(
        { is_read: true },
        {
            where: {
                user_id: employeeId,
                is_read: false,
            },
            returning: true,
        }
    );
    res.status(200).json(new ApiResponse(200, null, `${updated[0]} notifications marked as read`));

});


export const deleteNotification = asyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;

    // Find the notification before deleting
    const notification = await Notification.findOne({
        where: { notification_id: notificationId },
    });

    if (!notification) {
        return next(new ApiError(404, "Notification not found"));
    }

    // Delete the notification
    await notification.destroy();

    res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
});
