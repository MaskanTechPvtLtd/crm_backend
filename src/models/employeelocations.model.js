import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Employee from "./employee.model.js";

const EmployeeLocation = sequelize.define(
  "EmployeeLocation",
  {
    location_id: {
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
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "employeelocations",
    timestamps: false, // Change to true if you need created_at/updated_at
  }
);

// Define associations
EmployeeLocation.belongsTo(Employee, { foreignKey: "employee_id", onDelete: "CASCADE" });

export default EmployeeLocation;
