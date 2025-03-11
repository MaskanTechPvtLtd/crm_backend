import Employee from "../../models/employee.model.js";
import Properties from "../../models/properties.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import PropertyMedia from "../../models/propertymedia.model.js";
import Leads from "../../models/leads.model.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { Op } from "sequelize";

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

export const DeleteAgent = asyncHandler(async (req, res, next) => {
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

        // 🔹 Delete Employee
        await employee.destroy();

        // 🔹 Return Success Response
        return res.status(200).json(new ApiResponse(200, null, "Employee deleted successfully."));
    } catch (err) {
        console.error("Error deleting employee:", err);
        return next(new ApiError(500, "Something went wrong while deleting employee."));
    }
});

export const SearchEmployee = asyncHandler(async (req, res, next) => {
    try {
        const { query } = req.query;
        const { manager_id } = req.params;

        // 🔹 Validate Query
        if (!query) {
            return next(new ApiError(400, "Search query is required."));
        }

        // 🔹 Validate Manager ID
        if (!manager_id || isNaN(manager_id)) {
            return next(new ApiError(400, "Invalid manager ID."));
        }

        // 🔹 Search Employees (Only Sales Agents Under This Manager)
        const employees = await Employee.findAll({
            where: {
                manager_id,
                role: "Sales Agent",
                is_active: true,
                [Op.or]: [
                    { first_name: { [Op.like]: `%${query}%` } },
                    { last_name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                ],
            },
        });

        // 🔹 Return Success Response
        return res.status(200).json(new ApiResponse(200, employees, "Sales agents fetched successfully."));
    } catch (err) {
        console.error("Error searching employees:", err);
        return next(new ApiError(500, "Something went wrong while searching employees."));
    }
});

export const GetManagersTeam = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id } = req.params;

        // Validate agent_id
        if (!manager_id || isNaN(manager_id)) {
            return next(new ApiError(400, "Invalid agent ID."));
        }

        // Fetch employees under the agent's manager
        const employees = await Employee.findAll({
            where: { manager_id: manager_id, is_active: true },
            attributes: ["employee_id", "first_name", "last_name", "email", "phone", "profile_picture", "role"]
        });

        if (!employees || employees.length === 0) {
            return next(new ApiError(404, "No employees found under this manager."));
        }

        // Extract employee IDs
        const employeeIds = employees.map(emp => emp.employee_id);

        // Fetch properties listed by those employees
        const properties = await Properties.findAll({
            where: { assign_to: { [Op.in]: employeeIds } },  // Use Op.in for array
            include: [
                {
                    model: PropertyType,
                    as: "propertyType",
                    attributes: ["property_type_id", "type_name"]
                },
                {
                    model: PropertyMedia,
                    as: "propertyMedia",
                    attributes: ["media_type", "file_url"]
                },
            ],
        });

        // Fetch leads assigned to those employees
        const leads = await Leads.findAll({
            where: { assigned_to_fk: { [Op.in]: employeeIds } }, // Use Op.in for array
            attributes: ["lead_id", "first_name", "last_name", "email", "phone", "budget_min", "budget_max", "status_id_fk", "assigned_to_fk"]
        });

        // Construct response
        return res.status(200).json(new ApiResponse(200, {
            manager_id: manager_id, // Include the manager's ID
            employees,
            properties,
            leads
        }, "Employees, properties, and leads retrieved successfully."));
    } catch (error) {
        console.error("Error fetching employees details:", error);
        return next(new ApiError(500, "Something went wrong while fetching employee details."));
    }
});