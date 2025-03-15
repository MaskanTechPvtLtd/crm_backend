import Tasks from "../models/task.model.js";
import Employee from "../models/employee.model.js";
import Statuses from "../models/statuses.model.js";

export const TasksAssociation = () => {
  Tasks.belongsTo(Employee, { as: "Creator", foreignKey: "created_by", onDelete: "CASCADE" });
  Tasks.belongsTo(Statuses, { foreignKey: "status_id", onDelete: "SET NULL" });

};