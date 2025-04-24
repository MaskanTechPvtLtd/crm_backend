import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

const PropertyStatus = sequelize.define(
  "PropertyStatus",
  {
    property_status_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status_name: {
      type: DataTypes.STRING(100), // E.g., "Available", "Sold", "Under Contract"
      allowNull: false,
    },
  },
  {
    tableName: "property_statuses",
    timestamps: false, // Assuming you don't need createdAt/updatedAt fields
  }
);

export default PropertyStatus;