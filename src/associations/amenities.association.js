import Properties from "../models/properties.model.js";
import Amenity from "../models/amenities.model.js";
import PropertyAmenities from "../models/propertyAmenities.model.js";

export const AmenitiesAssociation = () => {
  // Amenity to Property
  Amenity.belongsToMany(Properties, {
    through: PropertyAmenities,
    foreignKey: "amenity_id",
    otherKey: "property_id",
  });
};
