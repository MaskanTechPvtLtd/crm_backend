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
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // comment: 'Preferred number of bedrooms'
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true, //      comment: 'Preferred number of bathrooms'

    },
    furnished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, //      comment: 'Whether the property should be furnished'
    },
    preferredLocation: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Preferred city or neighborhood'
    },
    preferredCity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
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
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

export default Lead;
