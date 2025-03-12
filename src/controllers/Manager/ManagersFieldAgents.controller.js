import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import Employee from "../../models/employee.model.js";
import EmployeeLocation from "../../models/employeelocations.model.js";

export const getManagersAllEmployeeLocations = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id } = req.params;

        if (!manager_id) {
            return next(new ApiError(400, "Manager ID is required."));
        }

        const locations = await EmployeeLocation.findAll({
            include: [
                {
                    model: Employee,
                    attributes: ["first_name", "last_name", "role"],
                    where: { manager_id }, // 🔹 Filter by manager_id
                },
            ],
        });

        if (!locations || locations.length === 0) {
            return next(new ApiError(404, "No employee locations found for this manager."));
        }

        return res.status(200).json(new ApiResponse(200, locations, "Employee locations retrieved successfully."));
    } catch (error) {
        return next(new ApiError(500, "Something went wrong while fetching employee locations.", error));
    }
});

export const getManagersEmployeeLocationById = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id, employee_id } = req.params;

        if (!manager_id || !employee_id) {
            return next(new ApiError(400, "Manager ID and Employee ID are required."));
        }

        if (isNaN(employee_id) || isNaN(manager_id)) {
            return next(new ApiError(400, "Invalid Manager ID or Employee ID format."));
        }

        const location = await EmployeeLocation.findAll({
            include: [
                {
                    model: Employee,
                    attributes: ["first_name", "last_name", "role"],
                    where: { manager_id, employee_id }, // 🔹 Filter by manager_id and employee_id
                },
            ],
        });

        if (!location) {
            return next(new ApiError(404, "Employee location not found."));
        }

        return res.status(200).json(new ApiResponse(200, location, "Employee location retrieved successfully."));
    } catch (error) {
        return next(new ApiError(500, "Something went wrong while fetching employee location.", error));
    }
});
