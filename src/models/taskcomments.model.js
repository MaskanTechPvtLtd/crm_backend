import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Task from "./task.model.js";
import Employee from "./employee.model.js";

const TaskComment = sequelize.define(
  "TaskComment",
  {
    comment_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Task,
        key: "task_id",
      },
      onDelete: "CASCADE",
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Employee,
        key: "employee_id",
      },
      onDelete: "CASCADE",
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "taskcomments",
    timestamps: false, // No updated_at column in the table
  }
);

// Define associations
// TaskComment.belongsTo(Task, { foreignKey: "task_id", as: "task" });
// TaskComment.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });

export default TaskComment;
