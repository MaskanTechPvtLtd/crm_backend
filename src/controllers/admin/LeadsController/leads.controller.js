import { uploadOnCloudinary } from "../../../utils/Cloudinary.utils.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"
import { convertUTCToLocal } from "../../../utils/DateHelper.utils.js";
import { sequelize } from "../../../db/index.js";
import { Op } from "sequelize";
import LeadSource from "../../../models/leadsources.model.js";
import Lead from "../../../models/leads.model.js"
import Employee from "../../../models/employee.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import Status from "../../../models/leadstatus.model.js";
import UserAuth from "../../../models/userauth.model.js";
import Interaction from "../../../models/interactions.model.js";


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
        { model: Status, attributes: ["status_id", "status_name"] },
      ],
    });

    res.status(201).json(new ApiResponse(201, leadWithDetails, "Lead created successfully."));
  } catch (error) {
    console.error("Error creating lead:", error);
    next(new ApiError(500, "Something went wrong while creating the lead."));
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
        { model: Status, attributes: ["status_id", "status_name"] },
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
        { model: Status, attributes: ["status_id", "status_name"] },
      ],
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

// Create an interaction entry
export const logInteraction = asyncHandler(async (req, res, next) => {
  try {
    const { lead_id, type, notes, followup_date } = req.body;
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
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      return next(new ApiError(404, "Lead not found."));
    }

    // Step 4: Check if the agent is assigned to the lead
    if (lead.assigned_to_fk !== loggedInEmployee.employee_id) {
      return next(new ApiError(403, "You are not assigned to this lead."));
    }

    // Step 5: Create an interaction record
    const interaction = await Interaction.create({
      lead_id, // Lead for which the interaction is logged
      employee_id: loggedInEmployee.employee_id, // Agent who logged the interaction
      type, //intreraction type like call emailed meeting followed up etc pass using a droupdown
      notes, // Notes for the interaction
      followup_date, // Date for follow-up
    });

    res.status(201).json(new ApiResponse(201, interaction, "Interaction logged successfully."));
  } catch (error) {
    console.error("Error logging interaction:", error);
    next(new ApiError(500, "Something went wrong while logging the interaction."));
  }
});

// Get interactions for a lead
export const getLeadInteractions = asyncHandler(async (req, res, next) => {
  try {
    const { lead_id } = req.params;

    // Step 1: Check if the lead exists
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      return next(new ApiError(404, "Lead not found."));
    }

    // Step 2: Fetch interactions for the lead
    const interactions = await Interaction.findAll({
      where: { lead_id },
      include: [
        {
          model: Employee,
          attributes: ["employee_id", "first_name", "last_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(new ApiResponse(200, interactions, "Lead interactions retrieved successfully."));
  } catch (error) {
    console.error("Error fetching interactions:", error);
    next(new ApiError(500, "Something went wrong while fetching interactions."));
  }
});
