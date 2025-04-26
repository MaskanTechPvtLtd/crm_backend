import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup

const PropertyType = sequelize.define(
  "PropertyType",
  {
    property_type_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.ENUM("Residential", "Commercial"),
      allowNull: false,
      },
  },
  {
    tableName: "propertytypes",
    timestamps: false, // No createdAt or updatedAt based on schema
  }
);

export default PropertyType;
