import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";
import Properties from "./properties.model.js";
import Amenity from "./amenities.model.js";


const PropertyAmenities = sequelize.define(
    "PropertyAmenities",
    {
        property_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: Properties, key: "property_id" },
        },
        amenity_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: Amenity, key: "amenity_id" },
        },
    },
    {
        tableName: "property_amenities",
        timestamps: false, // Assuming you don't need createdAt/updatedAt fields
        id: false,
    });

export default PropertyAmenities;