import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";
import Employee from "./employee.model.js";

const Notification = sequelize.define(
    "Notification",
    {
        notification_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Employee, // Foreign key reference
                key: "employee_id",
            },
            onDelete: "CASCADE",
        },
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: Employee,
                key: "employee_id",
            },
            onDelete: "SET NULL",
        },
        entity_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        entity_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        notification_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, 
    {
        tableName: "notifications",
        timestamps: false, // Automatically manages createdAt and updatedAt
    }
);

// Associations
// Notification.belongsTo(Employee, { foreignKey: "user_id", as: "recipient" });
// Notification.belongsTo(Employee, { foreignKey: "sender_id", as: "sender" });

export default Notification;