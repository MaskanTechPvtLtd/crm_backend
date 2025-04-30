import Leads from "../models/leads.model.js";
import Employee from "../models/employee.model.js";
import LeadSources from "../models/leadsources.model.js";
import PropertyTypes from "../models/propertytypes.model.js";
import LeadStatus from "../models/leadstatus.model.js";
import Amenity from "../models/amenities.model.js";
import LeadAmenities from "../models/leadAmenities.model.js";

export const LeadsAssociation = () => {
  Leads.belongsTo(Employee, { foreignKey: "assigned_to_fk" });
  Leads.belongsTo(LeadSources, { foreignKey: "source_id_fk" });
  Leads.belongsTo(PropertyTypes, { foreignKey: "preferred_type_id_fk" });
  Leads.belongsTo(LeadStatus, { foreignKey: "status_id_fk" });
  Leads.belongsToMany(Amenity, {
    through: LeadAmenities,
    foreignKey: "lead_id",
    otherKey: "amenity_id",
  });
  
};