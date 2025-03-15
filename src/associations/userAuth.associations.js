import UserAuth from "../models/userauth.model.js";
import Employee from "../models/employee.model.js";

export const UserAuthAssociation = () => {
  UserAuth.belongsTo(Employee, { foreignKey: "employee_id" });
};