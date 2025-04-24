import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";


const Amenity = sequelize.define(
    "Amenity",
    {
        amenity_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100), // E.g., "Swimming Pool", "Gym"
            allowNull: false,
        },
    },
    {
        tableName: "amenities",
        timestamps: false, // Assuming you don't need createdAt/updatedAt fields
    }
);

export default Amenity;
