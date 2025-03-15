import Tasks from "../models/task.model.js";
import Employee from "../models/employee.model.js";
import Statuses from "../models/statuses.model.js";

export const TasksAssociation = () => {
  Tasks.belongsTo(Employee, { foreignKey: "assigned_to" });
  Tasks.belongsTo(Employee, { foreignKey: "created_by" });
  Tasks.belongsTo(Statuses, { foreignKey: "status_id" });
};