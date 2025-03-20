import Employee from "../models/employee.model.js";
import CustomerFeedback from "../models/customerfeedback.model.js";

// // Define relationships
// CustomerFeedback.belongsTo(sequelize.models.Properties, {
//   foreignKey: 'property_id',
//   as: 'property',
// });
// CustomerFeedback.belongsTo(sequelize.models.Employee, {
//   foreignKey: 'agent_id',
//   as: 'agent',
// });


export const CustomerFeedbackAssociations = () => {
    CustomerFeedback.belongsTo(Employee, { foreignKey: "agent_id", as: 'agent', });

  };