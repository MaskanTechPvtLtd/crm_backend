import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js";
import Employee from "../../../models/employee.model.js";
import EmployeeLocation from "../../../models/employeelocations.model.js";

// @desc    Get the latest location of an employee
export const getEmployeeLocation = asyncHandler(async (req, res, next) => {
    const { employee_id } = req.params;

    // Check if employee exists
    const employee = await Employee.findOne({ where: { employee_id } });
    if (!employee) {
        return next(new ApiError(404, "Employee not found"));
    }

    // Get latest location of the employee
    const employeeLocation = await EmployeeLocation.findOne({
        where: { employee_id },
        order: [["timestamp", "DESC"]], // Get the latest location
    });

    if (!employeeLocation) {
        return next(new ApiError(404, "Employee location not found"));
    }

    return new ApiResponse(res).success(employeeLocation);
});


