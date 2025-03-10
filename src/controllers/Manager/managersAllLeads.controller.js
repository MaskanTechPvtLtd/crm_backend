import Lead from "../../models/leads.model.js";
import LeadSource from "../../models/leadsources.model.js";
import LeadStatus from "../../models/leadstatus.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import Employee from "../../models/employee.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js"
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { Op } from "sequelize";

export const managersAllLeads = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id } = req.params;

        // Validate manager_id
        if (!manager_id || isNaN(manager_id)) {
            return next(new ApiError(400, "Invalid manager ID."));
        }

        const { status_id, property_type_id, source_id } = req.query;

        // 🔹 Fetch all sales agents under this manager
        const salesAgents = await Employee.findAll({
            where: { manager_id, role: "Sales Agent", is_active: true },
            attributes: ["employee_id"],
        });

        // Extract agent IDs
        const salesAgentIds = salesAgents.map(agent => agent.employee_id);
        console.log(salesAgentIds);

        const allAssignedIds = [...salesAgentIds, Number(manager_id)];

        if (!allAssignedIds.length) {
            return res.status(200).json(new ApiResponse(200, [], "No sales agents found under this manager."));
        }

        // 🔹 Build dynamic lead filters
        let filters = { assigned_to_fk: { [Op.in]: allAssignedIds } };
        if (status_id) filters.status_id_fk = status_id;
        if (property_type_id) filters.preferred_type_id_fk = property_type_id;
        if (source_id) filters.source_id_fk = source_id;

        // 🔹 Fetch leads assigned to the sales agents under this manager
        const leads = await Lead.findAll({
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
        });

        return res.status(200).json(new ApiResponse(200, leads, "Leads assigned to the sales agents retrieved successfully."));
    } catch (error) {
        console.error("Error fetching leads for manager:", error);
        return next(new ApiError(500, "Something went wrong while fetching leads for the manager."));
    }
});

