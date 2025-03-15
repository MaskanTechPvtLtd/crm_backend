import PropertyMedia from "../models/propertymedia.model.js";
import Properties from "../models/properties.model.js";

export const PropertyMediaAssociation = () => {
  PropertyMedia.belongsTo(Properties, { foreignKey: "property_id" });
};