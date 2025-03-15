import Attendance from "../models/attendance.model.js";
import Employee from "../models/employee.model.js";

export const AttendanceAssociation = () => {
  Attendance.belongsTo(Employee, { foreignKey: "employee_id" });
};