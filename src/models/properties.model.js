import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Employee from "./employee.model.js";
import PropertyType from "./propertytypes.model.js";
import Status from "./statuses.model.js";
import PropertyStatus from "./propertystatus.model.js";
// import PropertyMedia from "./propertymedia.model.js";

const Properties = sequelize.define(
  "Properties",
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
    owner_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    owner_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9+-\s]{10,15}$/, // Basic phone number validation
      },
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
    latitude: {
      type: DataTypes.DECIMAL(9, 6), // For geolocation
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6), // For geolocation
      allowNull: true,
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
      type: DataTypes.DECIMAL(18, 2), // Increased to support larger values
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    square_feet: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    furnishing: {
      type: DataTypes.ENUM("unfurnished", "semi-furnished", "fully-furnished"),
      allowNull: false,
      defaultValue: "unfurnished",
    },
    floor_number: {
      type: DataTypes.INTEGER,
      allowNull: true, // Not all properties have floors (e.g., plots)
      validate: {
        min: 0,
      },
    },
    project_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    possession_date: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Only for under-construction properties
    },
    status_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Status,
        key: "status_id",
      },
      onDelete: "SET NULL",
    },
    property_status_id: {
      type: DataTypes.INTEGER,
      references: {
        model: PropertyStatus,
        key: "property_status_id",
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
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
  },
  },
  {
    tableName: "properties",
    timestamps: false, // No updatedAt needed based on schema
    indexes: [
      { fields: ["city"] }, // Index for city-based searches
      { fields: ["price"] }, // Index for price-based sorting
      { fields: ["property_type_id"] }, // Index for filtering by property type
      { fields: ["status_id"] }, // Index for filtering by status
    ],
  }
);

// // Associations

 
export default Properties;
