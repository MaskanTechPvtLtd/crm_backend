import Employee from "../../models/employee.model.js";
import Properties from "../../models/properties.model.js";
import PropertyMedia from "../../models/propertymedia.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import Leads from "../../models/leads.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { Op } from "sequelize";

export const GetTeamDetailsofAgent = asyncHandler(async (req, res, next) => {
    try {
        // Check authentication
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized access."));
        }

        const { agent_id } = req.params;

        // Validate agent_id
        if (!agent_id || isNaN(agent_id) || parseInt(agent_id) <= 0) {
            return next(new ApiError(400, "Invalid agent ID."));
        }

        const agentIdNum = parseInt(agent_id);

        // Check authorization (assuming req.user has employee_id and role)
        if (req.user.employee_id !== agentIdNum && req.user.role !== 'manager') {
            return next(new ApiError(403, "Forbidden: You do not have access to this resource."));
        }

        // Fetch the agent and their manager ID
        const agent = await Employee.findOne({
            where: { 
                employee_id: agentIdNum, 
                is_active: true 
            },
            attributes: ["employee_id", "manager_id"]
        }).catch(error => {
            throw new ApiError(500, "Database error while fetching agent");
        });

        if (!agent) {
            return next(new ApiError(404, "Agent not found."));
        }

        // Check if manager_id is null (data corruption case)
        if (!agent.manager_id) {
            return next(new ApiError(404, "Agent does not have a valid manager assigned."));
        }

        // Fetch employees under the agent's manager
        const employees = await Employee.findAll({
            where: { 
                manager_id: agent.manager_id, 
                is_active: true 
            },
            attributes: ["employee_id", "first_name", "last_name", "email", "phone", "role"]
        }).catch(error => {
            throw new ApiError(500, "Database error while fetching employees");
        });

        if (!employees || employees.length === 0) {
            return next(new ApiError(404, "No employees found under this manager."));
        }

        // Extract employee IDs
        const employeeIds = employees.map(emp => emp.employee_id);

        let properties = [];
        let leads = [];

        if (employeeIds.length > 0) {
            // Fetch properties listed by those employees
            properties = await Properties.findAll({
                where: { assign_to: { [Op.in]: employeeIds } },
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
            }).catch(error => {
                throw new ApiError(500, "Database error while fetching properties");
            });

            // Fetch leads assigned to those employees
            leads = await Leads.findAll({
                where: { assigned_to_fk: { [Op.in]: employeeIds } },
                attributes: ["lead_id", "first_name", "last_name", "email", "phone", "budget_min", "budget_max", "status_id_fk", "assigned_to_fk"]
            }).catch(error => {
                throw new ApiError(500, "Database error while fetching leads");
            });
        }

        return res.status(200).json(new ApiResponse(200, {
            manager_id: agent.manager_id,
            employees,
            properties,
            leads
        }, "Employees, properties, and leads retrieved successfully."));

    } catch (error) {
        // If error is already an ApiError, pass it through
        if (error instanceof ApiError) {
            return next(error);
        }
        console.error("Error fetching team details:", error);
        return next(new ApiError(500, "Something went wrong while fetching employee details."));
    }
});