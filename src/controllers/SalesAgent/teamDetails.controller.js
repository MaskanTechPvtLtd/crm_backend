import Employee from "../../models/employee.model.js";
import Properties from "../../models/properties.model.js";
import PropertyMedia from "../../models/propertymedia.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import Leads from "../../models/leads.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js"
import { ApiResponse } from "../../utils/ApiResponse.utils.js"
import { Op } from "sequelize";

export const GetTeamDetailsofAgent = asyncHandler(async (req, res, next) => {
    try {
        const { agent_id } = req.params;

        // Validate agent_id
        if (!agent_id || isNaN(agent_id)) {
            return next(new ApiError(400, "Invalid agent ID."));
        }

        // Fetch the agent and their manager ID
        const agent = await Employee.findOne({
            where: { employee_id: agent_id, is_active: true },
            attributes: ["employee_id", "manager_id"]
        });

        if (!agent) {
            return next(new ApiError(404, "Agent not found."));
        }

        // Fetch employees under the agent's manager
        const employees = await Employee.findAll({
            where: { manager_id: agent.manager_id, is_active: true },
            attributes: ["employee_id", "first_name", "last_name", "email", "phone", "role"]
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
            manager_id: agent.manager_id, // Include the manager's ID
            employees,
            properties,
            leads
        }, "Employees, properties, and leads retrieved successfully."));
    } catch (error) {
        console.error("Error fetching employees details:", error);
        return next(new ApiError(500, "Something went wrong while fetching employee details."));
    }
});
