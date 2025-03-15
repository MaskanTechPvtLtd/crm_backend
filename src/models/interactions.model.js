import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Employee from "./employee.model.js";
import Lead from "./leads.model.js";
import LeadStatus from "./leadstatus.model.js";

const Interaction = sequelize.define(
  "Interaction",
  {
    interaction_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Lead,
        key: "lead_id",
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
    type: {
      type: DataTypes.ENUM("Call", "Meeting", "Email", "Follow-up"),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    followup_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    interaction_status_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: LeadStatus,
        key: "status_id",
      },
      onDelete: "SET NULL",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "interactions",
    timestamps: false, // Set to true if you need `createdAt` and `updatedAt`
  }
);

// // Define associations
// Interaction.belongsTo(Employee, { foreignKey: "employee_id", onDelete: "CASCADE" });
// Interaction.belongsTo(Lead, { foreignKey: "lead_id", onDelete: "CASCADE" });

export default Interaction;
