import Lead from "../../models/leads.model.js";
import LeadSource from "../../models/leadsources.model.js";
import LeadStatus from "../../models/leadstatus.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import Employee from "../../models/employee.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js"
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { Op } from "sequelize";
import { sendNotification } from "../../utils/sendNotification.utils.js";

export const managersAllLeads = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id } = req.params;

        // Validate manager_id
        if (!manager_id || isNaN(manager_id)) {
            return next(new ApiError(400, "Invalid manager ID."));
        }

        const { status_id, property_type_id, source_id, page = 1, limit = 10 } = req.query;

        // Convert page & limit to numbers
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum; // Calculate offset

        // 🔹 Fetch all sales agents under this manager
        const salesAgents = await Employee.findAll({
            where: { manager_id, role: "Sales Agent", is_active: true },
            attributes: ["employee_id"],
        });

        // Extract agent IDs
        const salesAgentIds = salesAgents.map(agent => agent.employee_id);
        const allAssignedIds = [...salesAgentIds, Number(manager_id)];

        if (!allAssignedIds.length) {
            return res.status(200).json(new ApiResponse(200, [], "No sales agents found under this manager."));
        }

        // 🔹 Build dynamic lead filters
        let filters = { assigned_to_fk: { [Op.in]: allAssignedIds } };
        if (status_id) filters.status_id_fk = status_id;
        if (property_type_id) filters.preferred_type_id_fk = property_type_id;
        if (source_id) filters.source_id_fk = source_id;

        // 🔹 Fetch paginated leads assigned to sales agents under this manager
        const { count, rows: leads } = await Lead.findAndCountAll({
            where: filters,
            include: [
                {
                    model: Employee,
                    attributes: ["employee_id", "first_name", "last_name", "role"],
                },
                { model: PropertyType, attributes: ["property_type_id", "type_name"] },
                { model: LeadSource, attributes: ["source_name"] },
                { model: LeadStatus, attributes: ["status_name"] },
            ],
            limit: limitNum,
            offset: offset,
            order: [["created_at", "DESC"]], // Sort by latest leads
        });

        // Pagination meta data
        const totalPages = Math.ceil(count / limitNum);
        const pagination = {
            totalRecords: count,
            totalPages: totalPages,
            currentPage: pageNum,
            limit: limitNum,
        };

        return res.status(200).json(
            new ApiResponse(200, leads, "Leads assigned to the sales agents retrieved successfully.", pagination)
        );
    } catch (error) {
        console.error("Error fetching leads for manager:", error);
        return next(new ApiError(500, "Something went wrong while fetching leads for the manager."));
    }
});


export const ManagerAssignLeadstoAgent = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id } = req.params;
        const { agent_id, lead_id } = req.body;

        // Validate IDs
        if (!manager_id || isNaN(manager_id)) {
            return next(new ApiError(400, "Invalid manager ID."));
        }
        if (!agent_id || isNaN(agent_id)) {
            return next(new ApiError(400, "Invalid agent ID."));
        }
        if (!lead_id || isNaN(lead_id)) {
            return next(new ApiError(400, "Invalid lead ID."));
        }

        // 🔹 Check if the agent is under this manager
        const agent = await Employee.findOne({
            where: { employee_id: agent_id, manager_id, role: "Sales Agent", is_active: true },
        });

        if (!agent) {
            return next(new ApiError(403, "The agent is not under this manager or is inactive."));
        }

        // 🔹 Check if the lead exists
        const lead = await Lead.findOne({ where: { lead_id } });
        if (!lead) {
            return next(new ApiError(404, "Lead not found."));
        }

        // 🔹 Check if the lead is already assigned to this agent
        if (lead.assigned_to_fk === agent_id) {
            return next(new ApiError(400, "Lead is already assigned to this agent."));
        }

        // 🔹 Assign lead to agent
        const [updatedCount] = await Lead.update(
            { assigned_to_fk: agent_id },
            { where: { lead_id, assigned_to_fk: manager_id } } // Ensuring only leads assigned to this manager get updated
        );
        await sendNotification({
            recipientUserId: agent_id,
            senderId: manager_id,
            entityType: "Lead",
            entityId: lead_id,
            notificationType: "Assignment",
            title: "New Lead Assignment",
            message: `You have been assigned a new Lead ${lead.first_name}. Please review the details.`,
        });
        if (updatedCount === 0) {
            return next(new ApiError(500, "Failed to assign the lead to the agent."));
        }

        // Fetch updated lead data
        const updatedLead = await Lead.findOne({ where: { lead_id } });

        return res.status(200).json(new ApiResponse(200, updatedLead, "Lead assigned to the agent successfully."));
    } catch (error) {
        logger.error("Error assigning lead to agent", { error: error.message });

        if (error instanceof ApiError) {
            return next(error);
        }

        if (error.name === "SequelizeValidationError") {
            return next(new ApiError(400, "Validation error", error.errors));
        }

        return next(new ApiError(500, "Internal Server Error"));
    }
});

