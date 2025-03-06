import Leads from "../../models/leads.model.js";
import LeadSource from "../../models/leadsources.model.js";
import LeadStatus from "../../models/leadstatus.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import Employee from "../../models/employee.model.js";
import UserAuth from "../../models/userauth.model.js";
import Interaction from "../../models/interactions.model.js";
import { sendNotification } from "../../utils/sendNotification.utils.js";

export const getLeadsByAgent = asyncHandler(async (req, res, next) => {
    try {
        const { agent_id } = req.params; // Extract agent ID from request params

        // Validate that agent_id is a number
        if (!agent_id || isNaN(agent_id)) {
            return next(new ApiError(400, "Invalid agent ID."));
        }
        const { status_id, employee_id, property_type_id, source_id } = req.query;

        // Build dynamic filter object
        let filters = {};
        if (status_id) filters.status_id_fk = status_id;
        if (property_type_id) filters.preferred_type_id_fk = property_type_id;
        if (source_id) filters.source_id_fk = source_id;

        // Fetch leads assigned to the given agent with the applied filters
        const leads = await Leads.findAll({
            where: filters,
            include: [
                {
                    model: Employee,
                    attributes: ["employee_id", "first_name", "last_name", "role"],
                    where: { role: "Sales Agent" }, // Ensures that the assigned person is an agent
                    required: true, // Ensures only leads assigned to a valid agent are fetched
                },
                { model: PropertyType, attributes: ["property_type_id", "type_name"] },
                { model: LeadSource, attributes: ["source_name"] },
                { model: LeadStatus, attributes: ["status_name"] },
            ],
        });
        // Fetch leads assigned to the given agent


        // If no leads are found, return an empty array with a message
        if (!leads.length) {
            return res.status(200).json(new ApiResponse(200, [], "No leads found for this agent."));
        }

        return res.status(200).json(new ApiResponse(200, leads, "Leads assigned to the agent retrieved successfully."));
    } catch (error) {
        console.error("Error fetching leads for agent:", error);
        return next(new ApiError(500, "Something went wrong while fetching leads for the agent."));
    }
});

// Create an interaction entry this willdone by sale agent only
export const logInteraction = asyncHandler(async (req, res, next) => {
    try {
        const { lead_id, type, notes, followup_date, lead_status_id } = req.body;
        const loggedInUserId = req.user.user_id; // Ensure `req.user` contains `user_id`

        // Step 1: Retrieve employee_id from user_id
        const userRecord = await UserAuth.findOne({
            where: { user_id: loggedInUserId },
            attributes: ["employee_id"],
        });

        if (!userRecord || !userRecord.employee_id) {
            return next(new ApiError(404, "Employee record not found for this user."));
        }

        const loggedInEmployeeId = userRecord.employee_id;
        const loggedInEmployee = await Employee.findOne({
            where: { employee_id: loggedInEmployeeId },
            attributes: ["employee_id", "first_name", "role"],
        });

        if (!loggedInEmployee) {
            return next(new ApiError(404, "Employee not found in records."));
        }

        // Step 2: Ensure only agents can log interactions  
        if (loggedInEmployee.role !== "Sales Agent") {
            return next(new ApiError(403, "Only agents can log lead interactions."));
        }

        // Step 3: Check if the lead exists
        const lead = await Leads.findByPk(lead_id);
        if (!lead) {
            return next(new ApiError(404, "Lead not found."));
        }

        // Step 4: Check if the agent is assigned to the lead
        if (lead.assigned_to_fk !== loggedInEmployee.employee_id) {
            return next(new ApiError(403, "You are not assigned to this lead."));
        }

        // Step 5: Validate that the provided lead_status_id exists
        const statusExists = await LeadStatus.findByPk(lead_status_id);
        if (!statusExists) {
            return next(new ApiError(404, "Invalid lead status."));
        }

        // Step 6: Create an interaction record
        const interaction = await Interaction.create({
            lead_id, // Lead for which the interaction is logged
            employee_id: loggedInEmployee.employee_id, // Agent who logged the interaction
            type, // Interaction type (Call, Email, Meeting, Follow-up)
            notes, // Notes for the interaction
            followup_date, // Date for follow-up
        });

        // Step 7: Update the lead's status
        await lead.update({ status_id_fk: lead_status_id });

        // Step 8: Notify Admin about the interaction
        const admin = await Employee.findOne({ where: { role: "Admin" } });
        if (admin) {
            await sendNotification({
                recipientUserId: admin.employee_id,
                senderId: loggedInEmployee.employee_id,
                entityType: "Interaction",
                entityId: lead_id,
                notificationType: "Interaction Update",
                title: "New Interaction Added",
                message: `A Sales Agent has added an interaction on a lead '${lead.first_name}'and updated the status to '${statusExists.status_name}'. Please review the details.`,
            });
        }
        // res.status(201).json(
        //     new ApiResponse(201, { status: statusExists.status_name, interaction }, "Interaction logged successfully and lead status updated.")
        //   );

        res.status(201).json(new ApiResponse(201, interaction, "Interaction logged successfully and lead status updated."));
    } catch (error) {
        console.error("Error logging interaction:", error);
        next(new ApiError(500, "Something went wrong while logging the interaction."));
    }
});

