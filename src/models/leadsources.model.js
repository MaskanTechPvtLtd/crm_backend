import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup

const LeadSource = sequelize.define(
  "LeadSource",
  {
    source_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    source_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "leadsources",
    timestamps: false, // No createdAt or updatedAt needed
  }
);

export default LeadSource;
