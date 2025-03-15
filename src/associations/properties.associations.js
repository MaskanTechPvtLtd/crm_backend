import Properties from "../models/properties.model.js";
import Employee from "../models/employee.model.js";
import PropertyTypes from "../models/propertytypes.model.js";
import Statuses from "../models/statuses.model.js";
import PropertyMedia from "../models/propertymedia.model.js";

export const PropertiesAssociation = () => {
  Properties.belongsTo(Employee, { foreignKey: "listed_by", as: "listedBy" });
  Properties.belongsTo(PropertyTypes, { foreignKey: "property_type_id" });
  Properties.belongsTo(Statuses, { foreignKey: "status_id", as: "status" });
  Properties.hasMany(PropertyMedia, { foreignKey: "property_id", as: "propertyMedia" });

};