import Notification from "../models/notification.model.js";
export const sendNotification = async ({
    recipientUserId,
    senderId = null,
    entityType,
    entityId,
    notificationType,
    title,
    message
}) => {
    try {
        const notification = await Notification.create({
            user_id: recipientUserId,
            sender_id: senderId,
            entity_type: entityType,
            entity_id: entityId,
            notification_type: notificationType,
            title,
            message,
        });
        // No real-time emission—client will poll the API.
        return notification;
    } catch (error) {
        console.error("Error sending notification:", error);
        throw error;
    }
};
