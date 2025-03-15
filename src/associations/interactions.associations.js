import Interactions from "../models/interactions.model.js";
import Leads from "../models/leads.model.js";
import Employee from "../models/employee.model.js";
import LeadStatus from "../models/leadstatus.model.js";

export const InteractionsAssociation = () => {
  Interactions.belongsTo(Leads, { foreignKey: "lead_id" });
  Interactions.belongsTo(Employee, { foreignKey: "employee_id" });
  Interactions.belongsTo(LeadStatus, { foreignKey: "interaction_status_id", as: "status" });

};