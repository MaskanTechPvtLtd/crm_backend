import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import Employee from "../../models/employee.model.js";
import EmployeeLocation from "../../models/employeelocations.model.js";


export const getManagersAllEmployeeLocations = asyncHandler(async (req, res, next) => {
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

    return res.status(200).json(new ApiResponse(200, locations, "Employee locations retrieved successfully."));
});
