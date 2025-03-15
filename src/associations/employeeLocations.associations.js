import EmployeeLocations from "../models/employeelocations.model.js";
import Employee from "../models/employee.model.js";

export const EmployeeLocationsAssociation = () => {
  Employee.hasMany(EmployeeLocations, { foreignKey: "employee_id", as: "locations" });
  EmployeeLocations.belongsTo(Employee, { foreignKey: "employee_id" });
};