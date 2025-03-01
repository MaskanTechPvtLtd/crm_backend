import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Employee from "./employee.model.js";
import PropertyType from "./propertytypes.model.js";
import LeadSource from "./leadsources.model.js";
import Status from "./leadstatus.model.js";

const Lead = sequelize.define(
  "Lead",
  {
    lead_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    source_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: LeadSource,
        key: "source_id",
      },
      onDelete: "SET NULL",
    },
    status_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Status,
        key: "status_id",
      },
      onDelete: "SET NULL",
    },
    budget_min: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    budget_max: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    preferred_type_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: PropertyType,
        key: "property_type_id",
      },
      onDelete: "SET NULL",
    },
    assigned_to_fk: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Employee,
        key: "employee_id",
      },
      onDelete: "SET NULL",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "leads",
    timestamps: false, // Set to true if you need `createdAt` and `updatedAt`
  }
);

// Define associations
Lead.belongsTo(Employee, { foreignKey: "assigned_to_fk", onDelete: "SET NULL" });
Lead.belongsTo(PropertyType, { foreignKey: "preferred_type_id_fk", onDelete: "SET NULL" });
Lead.belongsTo(LeadSource, { foreignKey: "source_id_fk", onDelete: "SET NULL" });
Lead.belongsTo(Status, { foreignKey: "status_id_fk", onDelete: "SET NULL" });

export default Lead;
