import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Employee from "./employee.model.js";
import Status from "./statuses.model.js"; // Assuming there's a Status model for the statuses table

const Task = sequelize.define(
  "Task",
  {
    task_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Status,
        key: "status_id",
      },
      onDelete: "SET NULL",
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Employee,
        key: "employee_id",
      },
      onDelete: "SET NULL",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Employee,
        key: "employee_id",
      },
      onDelete: "SET NULL",
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tasks",
    timestamps: false, // Set to true if you add `updated_at`
  }
);

// Define associations
Task.belongsTo(Employee, { as: "Assignee", foreignKey: "assigned_to", onDelete: "SET NULL" });
Task.belongsTo(Employee, { as: "Creator", foreignKey: "created_by", onDelete: "SET NULL" });
Task.belongsTo(Status, { foreignKey: "status_id", onDelete: "SET NULL" });

export default Task;
