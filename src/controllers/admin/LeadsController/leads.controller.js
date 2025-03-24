import { uploadOnCloudinary } from "../../../utils/Cloudinary.utils.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"
import { Op } from "sequelize";
import LeadSource from "../../../models/leadsources.model.js";
import Lead from "../../../models/leads.model.js"
import Employee from "../../../models/employee.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import LeadStatus from "../../../models/leadstatus.model.js";
import UserAuth from "../../../models/userauth.model.js";
import Interaction from "../../../models/interactions.model.js";
import { sendNotification } from "../../../utils/sendNotification.utils.js";


export const AddNewLead = asyncHandler(async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      source_id_fk,
      status_id_fk,
      budget_min,
      budget_max,
      preferred_type_id_fk,
    } = req.body;

    // Check if the email or phone already exists
    const existingLead = await Lead.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });

    if (existingLead) {
      return next(new ApiError(400, "Lead with this email or phone already exists."));
    }

    // Create a new lead
    const newLead = await Lead.create({
      first_name,
      last_name,
      email,
      phone,
      source_id_fk,
      status_id_fk,
      budget_min,
      budget_max,
      preferred_type_id_fk,

    });

    // Fetch related data (agent name, property type, etc.)
    const leadWithDetails = await Lead.findByPk(newLead.lead_id, {
      include: [
        { model: PropertyType, attributes: ["property_type_id", "type_name"] },
        { model: LeadSource, attributes: ["source_id", "source_name"] },
        { model: LeadStatus, attributes: ["status_id", "status_name"] },
      ],
    });

    res.status(201).json(new ApiResponse(201, leadWithDetails, "Lead created successfully."));
  } catch (error) {
    console.error("Error creating lead:", error);
    next(new ApiError(500, "Something went wrong while creating the lead."));
  }
});

export const EditLead = asyncHandler(async (req, res, next) => {
  try {
    const { lead_id } = req.params; // Extract lead ID from request parameters
    const {
      first_name,
      last_name,
      email,
      phone,
      source_id_fk,
      status_id_fk,
      budget_min,
      budget_max,
      preferred_type_id_fk,
    } = req.body;

    // Check if the lead exists
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      return next(new ApiError(404, "Lead not found."));
    }

    // Check if the email or phone already exists for another lead
    const existingLead = await Lead.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
        lead_id: { [Op.ne]: lead_id }, // Ensure it's not the same lead
      },
    });

    if (existingLead) {
      return next(new ApiError(400, "Another lead with this email or phone already exists."));
    }

    // Update the lead
    await lead.update({
      first_name,
      last_name,
      email,
      phone,
      source_id_fk,
      status_id_fk,
      budget_min,
      budget_max,
      preferred_type_id_fk,
    });

    // Fetch updated lead details
    const updatedLead = await Lead.findByPk(lead_id, {
      include: [
        { model: PropertyType, attributes: ["property_type_id", "type_name"] },
        { model: LeadSource, attributes: ["source_id", "source_name"] },
        { model: LeadStatus, attributes: ["status_id", "status_name"] },
      ],
    });

    res.status(200).json(new ApiResponse(200, updatedLead, "Lead updated successfully."));
  } catch (error) {
    console.error("Error updating lead:", error);
    next(new ApiError(500, "Something went wrong while updating the lead."));
  }
});


export const GetLeadById = asyncHandler(async (req, res, next) => {
  try {
    const { lead_id } = req.params;

    // Fetch lead by ID along with related details
    const lead = await Lead.findByPk(lead_id, {
      include: [
        { model: Employee, attributes: ["employee_id", "first_name", "last_name"] },
        { model: PropertyType, attributes: ["property_type_id", "type_name"] },
        { model: LeadSource, attributes: ["source_id", "source_name"] },
        { model: LeadStatus, attributes: ["status_id", "status_name"] },
      ],
    });

    if (!lead) {
      return next(new ApiError(404, "Lead not found."));
    }

    res.status(200).json(new ApiResponse(200, lead, "Lead details fetched successfully."));
  } catch (error) {
    console.error("Error fetching lead:", error);
    next(new ApiError(500, "Something went wrong while fetching lead details."));
  }
});

export const GetAllLeads = asyncHandler(async (req, res, next) => {
  try {
    const { status_id, employee_id, property_type_id, source_id } = req.query;

    // Build dynamic filter object
    let filters = {};
    if (status_id) filters.status_id_fk = status_id;
    if (employee_id) filters.assigned_to_fk = employee_id;
    if (property_type_id) filters.preferred_type_id_fk = property_type_id;
    if (source_id) filters.source_id_fk = source_id;

    // Fetch leads with optional filters
    const leads = await Lead.findAll({
      where: filters,
      include: [
        { model: Employee, attributes: ["employee_id", "first_name", "last_name"] },
        { model: PropertyType, attributes: ["property_type_id", "type_name"] },
        { model: LeadSource, attributes: ["source_id", "source_name"] },
        { model: LeadStatus, attributes: ["status_id", "status_name"] },
      ],
      order: [["created_at", "DESC"]], // Order by newest leads first
    });

    // Handle case when no leads are found
    if (!leads || leads.length === 0) {
      return next(new ApiError(404, "No leads found with the given filters."));
    }

    res.status(200).json(new ApiResponse(200, leads, "Leads fetched successfully."));
  } catch (error) {
    console.error("Error fetching leads:", error);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeDatabaseError") {
      return next(new ApiError(400, "Invalid filter parameters provided."));
    }

    // Handle unexpected errors
    next(new ApiError(500, "Something went wrong while fetching leads."));
  }
});

export const AssignLeadToAgent = asyncHandler(async (req, res, next) => {
  try {
    const { lead_id, employee_id } = req.body;

    // Validate required fields
    if (!lead_id || !employee_id) {
      return next(new ApiError(400, "Lead ID and Employee ID are required."));
    }

    // Ensure `req.user` exists and contains `user_id`
    if (!req.user || !req.user.user_id) {
      return next(new ApiError(401, "Unauthorized: User authentication required."));
    }

    const loggedInUserId = req.user.user_id;

    // Step 1: Retrieve the `employee_id` from `user_id`
    const userRecord = await UserAuth.findOne({
      where: { user_id: loggedInUserId },
      attributes: ["employee_id"], // Fetch `employee_id`
    });

    if (!userRecord || !userRecord.employee_id) {
      return next(new ApiError(404, "Employee record not found for this user."));
    }

    const loggedInEmployeeId = userRecord.employee_id;

    // Step 2: Find the logged-in employee (Admin)
    const loggedInEmployee = await Employee.findOne({
      where: { employee_id: loggedInEmployeeId },
      attributes: ["employee_id", "first_name", "role"],
    });

    if (!loggedInEmployee) {
      return next(new ApiError(404, "Employee not found in records."));
    }

    // Ensure only Admins can assign leads
    if (loggedInEmployee.role.toLowerCase() !== "admin") {
      return next(new ApiError(403, "Forbidden: You are not authorized to assign leads."));
    }
    const adminId = loggedInEmployee.employee_id;


    // Step 3: Check if the lead exists
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      return next(new ApiError(404, "Lead not found."));
    }

    // Step 4: Check if the employee (agent) exists
    const agent = await Employee.findByPk(employee_id);
    if (!agent) {
      return next(new ApiError(404, "Agent not found."));
    }

    // Step 5: Assign the lead to the agent
    lead.assigned_to_fk = employee_id;
    await lead.save();

    await sendNotification({
      recipientUserId: employee_id,
      senderId: adminId,
      entityType: "Lead",
      entityId: lead_id,
      notificationType: "Assignment",
      title: "New Lead Assignment",
      message: "You have been assigned a new Lead. Please review the details.",
    });

    res.status(200).json(new ApiResponse(200, lead, "Lead successfully assigned to the agent."));
  } catch (error) {
    console.error("Error assigning lead:", error);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeDatabaseError") {
      return next(new ApiError(400, "Invalid data provided."));
    }

    next(new ApiError(500, "Something went wrong while assigning the lead."));
  }
});

// Get interactions logs for a lead
export const getLeadInteractions = asyncHandler(async (req, res, next) => {
  try {
    const { lead_id } = req.params;

    // Check if the lead exists
    const lead = await Lead.findByPk(lead_id, {
      include: [
        {
          model: LeadStatus, // Assuming this is correct
          attributes: ["status_id", "status_name"],
        },
      ],
    });

    if (!lead) {
      return next(new ApiError(404, "Lead not found."));
    }

    // Fetch interactions
    const interactions = await Interaction.findAll({
      where: { lead_id },
      attributes: { exclude: ["interaction_status_id"] },
      include: [
        {
          model: Employee,
          attributes: ["employee_id", "first_name", "last_name"],
        },
        {
          model: LeadStatus,
          attributes: ["status_name"],
          as: "status",
        },
      ],
      order: [["created_at", "DESC"]],
      raw: true, // ✅ Returns flat JSON data instead of nested objects
      nest: true, // ✅ Ensures Employee object remains intact
    });
    
    // ✅ Move status_name from status object to the main object
    const formattedInteractions = interactions.map(interaction => ({
      ...interaction,
      status_name: interaction["status.status_name"], // Move status_name to main object
    }));
    
    res.status(200).json(
      new ApiResponse(200, { lead_status: lead.LeadStatus.status_name, interactions: formattedInteractions }, "Lead interactions and status retrieved successfully.")
    );
    
  } catch (error) {
    console.error("Error fetching interactions:", error);
    next(new ApiError(500, "Something went wrong while fetching interactions."));
  }
});


export const DeleteLead = asyncHandler(async (req, res, next) => {
  try {
    const { lead_id } = req.params;

    // Fetch the lead to be deleted
    const lead = await Lead.findByPk(lead_id);

    if (!lead) {
      return next(new ApiError(404, "Lead not found."));
    }

    // Delete the lead
    await lead.destroy();

    res.status(200).json(new ApiResponse(200, null, "Lead deleted successfully."));
  } catch (error) {
    console.error("Error deleting lead:", error);
    next(new ApiError(500, "Something went wrong while deleting the lead."));
  }
});

export const AssignLeadsToAgent = asyncHandler(async (req, res, next) => {
  try {
    const { lead_ids, employee_id } = req.body;

    // Validate required fields
    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return next(new ApiError(400, "lead_ids must be a non-empty array"));
    }
    if (!employee_id) {
      return next(new ApiError(400, "employee_id is required"));
    }

    // Ensure all lead_ids are valid (not undefined, null, or non-numeric)
    const validLeadIds = lead_ids.filter(id => id !== undefined && id !== null && !isNaN(id));
    if (validLeadIds.length !== lead_ids.length) {
      const invalidIds = lead_ids.filter(id => !validLeadIds.includes(id));
      return next(new ApiError(400, `Invalid lead_ids provided: ${invalidIds.join(', ')}`));
    }

    // Ensure `req.user` exists and contains `user_id`
    if (!req.user || !req.user.user_id) {
      return next(new ApiError(401, "Unauthorized: User authentication required."));
    }

    const loggedInUserId = req.user.user_id;

    // Step 1: Retrieve the `employee_id` from `user_id`
    const userRecord = await UserAuth.findOne({
      where: { user_id: loggedInUserId },
      attributes: ["employee_id"],
    });

    if (!userRecord || !userRecord.employee_id) {
      return next(new ApiError(404, "Employee record not found for this user."));
    }

    const loggedInEmployeeId = userRecord.employee_id;

    // Step 2: Find the logged-in employee (Admin)
    const loggedInEmployee = await Employee.findOne({
      where: { employee_id: loggedInEmployeeId },
      attributes: ["employee_id", "first_name", "role"],
    });

    if (!loggedInEmployee) {
      return next(new ApiError(404, "Employee not found in records."));
    }

    // Ensure only Admins can assign leads
    if (loggedInEmployee.role.toLowerCase() !== "admin") {
      return next(new ApiError(403, "Forbidden: You are not authorized to assign leads."));
    }
    const adminId = loggedInEmployee.employee_id;

    // Step 3: Check if all leads exist
    const leads = await Lead.findAll({
      where: { lead_id: validLeadIds },
    });

    if (leads.length !== validLeadIds.length) {
      const foundLeadIds = leads.map(lead => lead.lead_id);
      const missingLeadIds = validLeadIds.filter(id => !foundLeadIds.includes(id));
      return next(new ApiError(404, `Some leads not found: ${missingLeadIds.join(', ')}`));
    }

    // Step 4: Check if the employee (agent) exists
    const agent = await Employee.findByPk(employee_id, {
      attributes: ["employee_id", "first_name", "last_name"],
    });
    if (!agent) {
      return next(new ApiError(404, "Agent not found."));
    }

    // Step 5: Assign all leads to the agent
    await Lead.update(
      { assigned_to_fk: employee_id },
      { where: { lead_id: validLeadIds } }
    );

    // Step 6: Send notification to the agent
    const leadDetails = leads.map(lead => lead.first_name).join(', '); // You can customize this based on available lead fields
    await sendNotification({
      recipientUserId: employee_id,
      senderId: adminId,
      entityType: "Lead",
      entityId: validLeadIds[0], // Use the first lead ID as a representative
      notificationType: "Assignment",
      title: "New Lead Assignment",
      message: `You have been assigned new leads Name: ${leadDetails}`,
    });

    // Step 7: Prepare response with assigned leads
    const assignedLeads = leads.map(lead => ({
      lead_id: lead.lead_id,
      // Add more lead details if available, e.g., lead.name or lead.title
    }));

    res.status(200).json(
      new ApiResponse(
        200,
        {
          assigned_leads: assignedLeads,
          assigned_to: {
            employee_id: agent.employee_id,
            agent_name: `${agent.first_name} ${agent.last_name}`,
          },
        },
        "Leads successfully assigned to the agent."
      )
    );
  } catch (error) {
    console.error("Error assigning leads:", error);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeDatabaseError") {
      return next(new ApiError(400, "Invalid data provided."));
    }

    next(new ApiError(500, "Something went wrong while assigning the leads."));
  }
});