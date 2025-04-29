import Properties from "../models/properties.model.js";
import Employee from "../models/employee.model.js";
import PropertyTypes from "../models/propertytypes.model.js";
import Statuses from "../models/statuses.model.js";
import PropertyMedia from "../models/propertymedia.model.js";
import PropertyAmenities from "../models/propertyAmenities.model.js";
import PropertyStatus from "../models/propertystatus.model.js";
import Amenity from "../models/amenities.model.js";

export const PropertiesAssociation = () => {
    Properties.hasMany(PropertyMedia, { foreignKey: "property_id", as: "propertyMedia" });
    Properties.belongsTo(Employee, { foreignKey: "listed_by", as: "listedBy" });
    Properties.belongsTo(PropertyTypes, { foreignKey: "property_type_id", as: "propertyType" });
    Properties.belongsTo(Statuses, { foreignKey: "status_id", as: "status" });
    Properties.belongsTo(PropertyStatus, { foreignKey: "property_status_id", as: "propertyStatus" });
    Properties.belongsToMany(Amenity, {
        through: PropertyAmenities,
        foreignKey: "property_id",
        otherKey: "amenity_id",
    });
};
