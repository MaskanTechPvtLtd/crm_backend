import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Employee from "./employee.model.js";
import PropertyType from "./propertytypes.model.js";
import Status from "./statuses.model.js";
import PropertyMedia from "./propertymedia.model.js";

const Property = sequelize.define(
  "Property",
  {
    property_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    zip_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    property_type_id: {
      type: DataTypes.INTEGER,
      references: {
        model: PropertyType,
        key: "property_type_id",
      },
      onDelete: "CASCADE",
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    square_feet: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Status,
        key: "status_id",
      },
      onDelete: "SET NULL",
    },
    listed_by: {
      type: DataTypes.INTEGER,
      references: {
        model: Employee,
        key: "employee_id",
      },
      onDelete: "SET NULL",
    },
    listed_date: {
      type: DataTypes.DATEONLY,
    },
    description: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    assign_to: {
      type: DataTypes.INTEGER,
      references: {
        model: Employee,
        key: "employee_id",
      },
      onDelete: "SET NULL",
    },
  },
  {
    tableName: "properties",
    timestamps: false, // No updatedAt needed based on schema
  }
);

// Associations
Property.hasMany(PropertyMedia, { foreignKey: "property_id", as: "propertyMedia" });
Property.belongsTo(Employee, { foreignKey: "listed_by", as: "listedBy" });
Property.belongsTo(PropertyType, { foreignKey: "property_type_id", as: "propertyType" });
Property.belongsTo(Status, { foreignKey: "status_id", as: "status" });
 
export default Property;
