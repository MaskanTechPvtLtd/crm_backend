import UserAuth from "../models/userauth.model.js";
import Employee from "../models/employee.model.js";

export const getLoggedInUserRole = async (userId) => {
    if (!userId) {
        throw new Error("Unauthorized: User not logged in.");
    }
    // Fetch the `employee_id` and `role` in a single query
    const loggedInEmployee = await UserAuth.findOne({
        where: { user_id: userId },
        attributes: ["employee_id"],
        include: [
            {
                model: Employee,
                attributes: ["employee_id", "first_name", "role"],
            },
        ],
    });

    if (!loggedInEmployee || !loggedInEmployee.Employee) {
        throw new Error("Employee record not found for this user.");
    }

    return loggedInEmployee.Employee; // Returns `{ employee_id, first_name, role }`
};
