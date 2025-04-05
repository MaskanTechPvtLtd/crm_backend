import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js";
import Employee from "../../../models/employee.model.js";
import EmployeeLocation from "../../../models/employeelocations.model.js";
import { Op } from "sequelize";
import dayjs from 'dayjs';

// ✅ Add Employee Location this will at sales agent side 
export const addEmployeeLocation = asyncHandler(async (req, res, next) => {
    const { employee_id, latitude, longitude } = req.body;

    if (!employee_id || !latitude || !longitude) {
        return next(new ApiError(400, "All fields are required"));
    }

    // Check if employee exists
    const employee = await Employee.findOne({ where: { employee_id } });
    if (!employee) {
        return next(new ApiError(404, "Employee not found"));
    }

    // Create new location record
    const newLocation = await EmployeeLocation.create({
        employee_id,
        latitude,
        longitude,
        timestamp: new Date(),
    });

    return res.status(201).json(new ApiResponse(201, newLocation, "Location added successfully"));
});

// ✅ Get All Employee Locations
// export const getAllEmployeeLocations = asyncHandler(async (req, res, next) => {
//     try {
//         const employees = await Employee.findAll({
//             where: {
//                 role: { [Op.notIn]: ["Admin", "Manager"] }, // Exclude employees with role "Admin" and "Manager"
//             },
//             include: [
//                 {
//                     model: EmployeeLocation,
//                     as: "locations", // Ensure this matches your model association
//                     attributes: ["latitude", "longitude", "timestamp"],
//                 },
//             ],
//         });

//         return res.status(200).json(new ApiResponse(200, employees));
//     } catch (error) {
//         return next(new ApiError(500, "Failed to fetch employee locations", error));
//     }
// });

export const getAllEmployeeLocations = asyncHandler(async (req, res, next) => {
    try {
      const startOfDay = dayjs().startOf('day').toDate();
      const endOfDay = dayjs().endOf('day').toDate();
  
      const employees = await Employee.findAll({
        where: {
          role: { [Op.notIn]: ["Admin", "Manager"] }, // Exclude Admin and Manager
        },
        include: [
          {
            model: EmployeeLocation,
            as: "locations",
            attributes: ["latitude", "longitude", "timestamp"],
            required: false, // still include employees even if they don't have location data today
            where: {
              timestamp: {
                [Op.between]: [startOfDay, endOfDay],
              },
            },
          },
        ],
      });
  
      return res.status(200).json(new ApiResponse(200, employees));
    } catch (error) {
      return next(new ApiError(500, "Failed to fetch employee locations", error));
    }
  });


// ✅ Get Locations for a Specific Employee
export const getEmployeeLocationsById = asyncHandler(async (req, res, next) => {
    const { employee_id } = req.params;

    // Check if employee exists
    const employee = await Employee.findOne({ where: { employee_id } });
    if (!employee) {
        return next(new ApiError(404, "Employee not found"));
    }

    const locations = await EmployeeLocation.findAll({
        where: { employee_id },
        order: [["timestamp", "DESC"]], // Get the latest location
    });

    if (locations.length === 0) {
        return next(new ApiError(404, "No locations found for this employee"));
    }

    return res.status(200).json(new ApiResponse(200, locations));
});
