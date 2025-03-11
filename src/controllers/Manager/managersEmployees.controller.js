import Employee from "../../models/employee.model.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { ApiError } from "../../utils/ApiError.utils";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";


export const GetManagersEmployees = asyncHandler(async (req, res, next) => {
    try {
      const { manager_id } = req.params; // Change manager_id to id
  
      // Find the manager
      const manager = await Employee.findByPk(manager_id);
      if (!manager || manager.role !== "Manager") {
        return next(new ApiError(404, "Manager not found."));
      }
  
      // Find all agents assigned to this manager
      const agents = await Employee.findAll({
        where: { manager_id: manager_id },
        attributes: ["employee_id", "first_name", "last_name", "profile_picture", "phone", "role"],
      });
  
      // Send the response
      res.json(new ApiResponse(200, agents, "Success"));
    } catch (err) {
      console.error("Error fetching agents by manager:", err);
      next(new ApiError(500, "Something went wrong while fetching agents by manager."));
    }
  });
  
export const GetEmployeebyId = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        // 🔹 Validate ID
        if (!id || isNaN(id)) {
            return next(new ApiError(400, "Invalid employee ID."));
        }

        // 🔹 Find Employee by ID
        const employee = await Employee.findByPk(id);

        // 🔹 Check if Employee Exists
        if (!employee) {
            return next(new ApiError(404, "Employee not found."));
        }

        // 🔹 Return Success Response
        return res.status(200).json(new ApiResponse(200, employee, "Employee fetched successfully."));
    } catch (err) {
        console.error("Error fetching employee by ID:", err);
        return next(new ApiError(500, "Something went wrong while fetching employee by ID."));
    }
});

