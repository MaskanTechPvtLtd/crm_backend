import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js"; // Adjust the path based on your setup
import Property from "./properties.model.js";

const PropertyMedia = sequelize.define(
  "PropertyMedia",
  {
    media_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    property_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Property,
        key: "property_id",
      },
      onDelete: "CASCADE",
    },
    media_type: {
      type: DataTypes.ENUM("Image", "Video"),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "propertymedia",
    timestamps: false, // No updatedAt based on schema
  }
);

// Associations
PropertyMedia.belongsTo(Property, { foreignKey: "property_id", as: "property" });

export default PropertyMedia;
