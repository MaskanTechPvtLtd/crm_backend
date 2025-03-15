import TaskComments from "../models/taskcomments.model.js";
import Tasks from "../models/task.model.js";
import Employee from "../models/employee.model.js";

export const TaskCommentsAssociation = () => {
  TaskComments.belongsTo(Tasks, { foreignKey: "task_id" });
  TaskComments.belongsTo(Employee, { foreignKey: "employee_id" });
};