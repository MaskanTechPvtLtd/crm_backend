import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";
import Amenity from "./amenities.model.js";
import Lead from "./leads.model.js";    


const LeadAmenities = sequelize.define(
    "LeadAmenities",
    {
        lead_id: {
            type: DataTypes.INTEGER,
            references: { model: Lead, key: "lead_id" },
        },
        amenity_id: {
            type: DataTypes.INTEGER,
            references: { model: Amenity, key: "amenity_id" },
        },
    },
    {
        tableName: "lead_amenities",
        timestamps: false, // Assuming you don't need createdAt/updatedAt fields
    });


export default LeadAmenities;

