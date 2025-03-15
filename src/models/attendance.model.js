import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Employee from "./employee.model.js";

const Attendance = sequelize.define(
  "Attendance",
  {
    attendance_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    attendance_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    check_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_out: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hours_worked: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Present", "Absent", "Late", "On Leave"),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "attendance",
    timestamps: false, // Set to true if you add `created_at` or `updated_at`
  }
);

// Define associations
// Attendance.belongsTo(Employee, { foreignKey: "employee_id", onDelete: "CASCADE" });

export default Attendance;