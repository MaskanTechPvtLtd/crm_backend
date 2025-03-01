import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup

const LeadStatus = sequelize.define(
  "LeadStatus",
  {
    status_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "lead_statuses",
    timestamps: false, // Enable createdAt and updatedAt
    underscored: true, // Matches column names to snake_case
  }
);

export default LeadStatus;
