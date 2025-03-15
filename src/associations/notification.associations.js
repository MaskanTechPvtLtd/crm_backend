import Notification from "../models/notification.model.js";
import Employee from "../models/employee.model.js";

export const NotificationAssociation = () => {
Notification.belongsTo(Employee, { foreignKey: "user_id", as: "recipient" });
Notification.belongsTo(Employee, { foreignKey: "sender_id", as: "sender" });;

};