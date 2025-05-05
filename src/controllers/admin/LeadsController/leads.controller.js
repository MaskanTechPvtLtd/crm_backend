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
import Properties from "../../../models/properties.model.js";
import PropertyMedia from "../../../models/propertymedia.model.js";
import LeadAmenities from "../../../models/leadAmenities.model.js";
import Amenity from "../../../models/amenities.model.js";
import PropertyAmenities from "../../../models/propertyAmenities.model.js";
import { sendNotification } from "../../../utils/sendNotification.utils.js";
import { sequelize } from "../../../db/index.js";


export const AddNewLead = asyncHandler(async (req, res, next) => {
  const t = await sequelize.transaction(); // Start transaction
  try {
    let {
      first_name,
      last_name,
      email,
      phone,
      source_id_fk,
      status_id_fk,
      budget_min,
      budget_max,
      bedrooms,
      bathrooms,
      furnished,
      preferredLocation,
      preferredCity,
      priority,
      preferred_type_id_fk,
      amenities, // <-- Accept amenities from request
    } = req.body;

    // Basic required fields check
    if (!first_name || !last_name || !email || !phone || !source_id_fk || !status_id_fk) {
      return next(new ApiError(400, "Missing required fields."));
    }

    // Check for duplicate lead
    const existingLead = await Lead.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });

    if (existingLead) {
      return next(new ApiError(400, "Lead with this email or phone already exists."));
    }

    // Create lead
    const newLead = await Lead.create(
      {
        first_name,
        last_name,
        email,
        phone,
        source_id_fk,
        status_id_fk,
        budget_min,
        budget_max,
        bedrooms,
        bathrooms,
        furnished,
        preferredLocation,
        preferredCity,
        priority,
        preferred_type_id_fk,
      },
      { transaction: t }
    );

    // Parse and attach amenities (if any)
    if (typeof amenities === "string") {
      try {
        amenities = JSON.parse(amenities);
      } catch {
        amenities = amenities.split(",").map((id) => parseInt(id));
      }
    }

    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      const amenityEntries = amenities.map((amenityId) => ({
        lead_id: newLead.lead_id,
        amenity_id: amenityId,
      }));

      await LeadAmenities.bulkCreate(amenityEntries, { transaction: t });
    }

    // Fetch full lead with details
    const leadWithDetails = await Lead.findByPk(newLead.lead_id, {
      include: [
        { model: PropertyType, attributes: ["property_type_id", "type_name"] },
        { model: LeadSource, attributes: ["source_id", "source_name"] },
        { model: LeadStatus, attributes: ["status_id", "status_name"] },
        {
          model: Amenity,
          attributes: ["amenity_id", "name"], // assuming 'name' is an amenity field
          through: { attributes: [] }, // omit junction table details
        },
      ],
      transaction: t,
    });

    await t.commit();
    res.status(201).json(new ApiResponse(201, leadWithDetails, "Lead created successfully."));
  } catch (error) {
    await t.rollback();
    console.error("Error creating lead:", error);
    next(new ApiError(500, "Something went wrong while creating the lead."));
  }
});


export const EditLead = asyncHandler(async (req, res, next) => {
  const t = await sequelize.transaction(); // Start transaction
  try {
    const { lead_id } = req.params;
    let {
      first_name,
      last_name,
      email,
      phone,
      source_id_fk,
      status_id_fk,
      budget_min,
      budget_max,
      bedrooms,
      bathrooms,
      furnished,
      preferredLocation,
      preferredCity,
      priority,
      preferred_type_id_fk,
      amenities,
    } = req.body;

    // Check if lead exists
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      await t.rollback();
      return next(new ApiError(404, "Lead not found."));
    }

    // Check if the email or phone already exists for another lead
    const existingLead = await Lead.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
        lead_id: { [Op.ne]: lead_id },
      },
    });

    if (existingLead) {
      await t.rollback();
      return next(new ApiError(400, "Another lead with this email or phone already exists."));
    }

    // Update lead data
    await lead.update(
      {
        first_name,
        last_name,
        email,
        phone,
        source_id_fk,
        status_id_fk,
        budget_min,
        budget_max,
        bedrooms,
        bathrooms,
        furnished,
        preferredLocation,
        preferredCity,
        priority,
        preferred_type_id_fk,
      },
      { transaction: t }
    );

    // Process amenities
    if (typeof amenities === "string") {
      try {
        amenities = JSON.parse(amenities);
      } catch {
        amenities = amenities.split(",").map((id) => parseInt(id));
      }
    }

    if (Array.isArray(amenities)) {
      // Delete old amenities
      await LeadAmenities.destroy({
        where: { lead_id },
        transaction: t,
      });

      // Insert new amenities
      if (amenities.length > 0) {
        const amenityEntries = amenities.map((amenityId) => ({
          lead_id,
          amenity_id: amenityId,
        }));

        await LeadAmenities.bulkCreate(amenityEntries, { transaction: t });
      }
    }

    // Fetch updated lead with associations
    const updatedLead = await Lead.findByPk(lead_id, {
      include: [
        { model: PropertyType, attributes: ["property_type_id", "type_name"] },
        { model: LeadSource, attributes: ["source_id", "source_name"] },
        { model: LeadStatus, attributes: ["status_id", "status_name"] },
        {
          model: Amenity,
          attributes: ["amenity_id", "name"],
          through: { attributes: [] },
        },
      ],
      transaction: t,
    });

    await t.commit();
    res.status(200).json(new ApiResponse(200, updatedLead, "Lead updated successfully."));
  } catch (error) {
    await t.rollback();
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
        {
          model: Amenity,
          attributes: ["amenity_id", "name"], // assuming 'name' is an amenity field
          through: { attributes: [] }, // omit junction table details
        },
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
    const { status_id, employee_id, property_type_id, source_id, priority, amenities } = req.query;

    // Build dynamic filter object
    const filters = {};
    if (status_id) filters.status_id_fk = status_id;
    if (employee_id) filters.assigned_to_fk = employee_id;
    if (property_type_id) filters.preferred_type_id_fk = property_type_id;
    if (source_id) filters.source_id_fk = source_id;
    if (priority) filters.priority = priority;

    // Parse amenities filter (can be array, JSON string, or comma-separated)
    let amenitiesArray = [];
    if (amenities) {
      if (typeof amenities === "string") {
        try {
          amenitiesArray = JSON.parse(amenities);
        } catch {
          amenitiesArray = amenities.split(",").map((id) => parseInt(id));
        }
      } else if (Array.isArray(amenities)) {
        amenitiesArray = amenities.map((id) => parseInt(id));
      }
    }

    // Set up include array for associations
    const include = [
      { model: Employee, attributes: ["employee_id", "first_name", "last_name"] },
      { model: PropertyType, attributes: ["property_type_id", "type_name"] },
      { model: LeadSource, attributes: ["source_id", "source_name"] },
      { model: LeadStatus, attributes: ["status_id", "status_name"] },
      {
        model: Amenity,
        attributes: ["amenity_id", "name"],
        through: { attributes: [] },
        ...(amenitiesArray.length > 0 && {
          where: { amenity_id: amenitiesArray },
          required: true, // Ensures leads must have these amenities
        }),
      },
    ];

    // Fetch leads
    const leads = await Lead.findAll({
      where: filters,
      include,
      order: [["created_at", "DESC"]],
      distinct: true, // Important when joining many-to-many
    });

    if (!leads || leads.length === 0) {
      return next(new ApiError(404, "No leads found with the given filters."));
    }

    res.status(200).json(new ApiResponse(200, leads, "Leads fetched successfully."));
  } catch (error) {
    console.error("Error fetching leads:", error);

    if (error.name === "SequelizeDatabaseError") {
      return next(new ApiError(400, "Invalid filter parameters provided."));
    }

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
      message: `You have been assigned a new Lead ${lead.first_name} ${lead.last_name}. Please review the details.`,
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
    const leadDetails = leads.map(lead => `${lead.first_name} ${lead.last_name}`).join(', ');
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

export const toggleArchiveLead = asyncHandler(async (req, res, next) => {
  const { lead_id } = req.params;

  // Find the lead by primary key
  const lead = await Lead.findByPk(lead_id);

  // If lead is not found, return 404 error
  if (!lead) {
    return next(new ApiError(404, "Lead not found."));
  }

  // Toggle archive status
  const newStatus = !lead.isArchived;
  await lead.update({ isArchived: newStatus });

  const message = newStatus
    ? "Lead archived successfully."
    : "Lead unarchived successfully.";

  res.status(200).json(new ApiResponse(200, { lead_id, isArchived: newStatus }, message));
});


// export const suggestProperties = asyncHandler(async (req, res) => {
//   const { leadId } = req.params;

//   if (!leadId) throw new ApiError(400, "Lead ID is required");

//   const lead = await Lead.findOne({
//     where: { lead_id: leadId },
//     attributes: [
//       "budget_min",
//       "budget_max",
//       "preferred_type_id_fk",
//       "bedrooms",
//       "bathrooms",
//       "furnished",
//       "preferredCity",
//       "preferredLocation",
//     ],
//   });

//   if (!lead) throw new ApiError(404, "Lead not found");

//   const {
//     budget_min,
//     budget_max,
//     preferred_type_id_fk,
//     bedrooms,
//     bathrooms,
//     furnished,
//     preferredCity,
//     preferredLocation,
//   } = lead;

//   // Furnishing match logic
//   const furnishingMatch = furnished
//     ? ["fully-furnished", "semi-furnished"] // If lead wants furnished, allow both
//     : ["unfurnished", "semi-furnished", "fully-furnished"]; // Otherwise, no strict filter

//   const whereClause = {
//     isArchived: false,
//     price: {
//       [Op.between]: [budget_min || 0, budget_max || Number.MAX_VALUE],
//     },
//     property_type_id: preferred_type_id_fk || { [Op.not]: null },
//     ...(bedrooms && { bedrooms }),
//     ...(bathrooms && { bathrooms }),
//     ...(preferredCity && { city: preferredCity }),
//     ...(preferredLocation && { address: { [Op.iLike]: `%${preferredLocation}%` } }),
//     furnishing: { [Op.in]: furnishingMatch },
//   };

//   const properties = await Properties.findAll({
//     where: whereClause,
//     include: [
//       {
//         model: PropertyMedia,
//         as: "propertyMedia",
//         attributes: ["media_id", "media_type", "file_url"],
//       },
//     ],
//   });

//   if (!properties.length) {
//     throw new ApiError(404, "No matching properties found");
//   }

//   res.status(200).json(new ApiResponse(200, properties, "Properties suggested successfully"));
// });

export const suggestProperties = asyncHandler(async (req, res) => {
  const { leadId } = req.params;

  if (!leadId) throw new ApiError(400, "Lead ID is required");

  const lead = await Lead.findOne({
    where: { lead_id: leadId },
    include: [{ model: Amenity }], // assuming a junction table for lead_amenities
  });

  if (!lead) throw new ApiError(404, "Lead not found");

  const {
    budget_min,
    budget_max,
    preferred_type_id_fk,
    bedrooms,
    bathrooms,
    furnished,
    preferredCity,
    preferredLocation,
    LeadAmenities = [],
  } = lead;

  const amenityIds = LeadAmenities.map(a => a.amenity_id); // array of lead's preferred amenities

  const properties = await Properties.findAll({
    where: {
      isArchived: false,
      price: {
        [Op.between]: [budget_min || 0, budget_max || Number.MAX_VALUE],
      },
    },
    include: [
      {
        model: PropertyMedia,
        as: "propertyMedia",
        attributes: ["media_id", "media_type", "file_url"],
      },
      {
        model: Amenity,
        attributes: ["amenity_id", "name"], // assuming 'name' is an amenity field
        through: { attributes: [] }, // omit junction table details
      },
    ],
  });

  if (!properties.length) throw new ApiError(404, "No matching properties found");

  // Scoring logic
  const scored = properties.map((property) => {
    let score = 0;

    if (preferred_type_id_fk && property.property_type_id === preferred_type_id_fk) score += 15;
    if (bedrooms && property.bedrooms === bedrooms) score += 10;
    if (bathrooms && property.bathrooms === bathrooms) score += 10;
    if (preferredCity && property.city.toLowerCase() === preferredCity.toLowerCase()) score += 10;
    if (
      preferredLocation &&
      property.address.toLowerCase().includes(preferredLocation.toLowerCase())
    ) score += 5;

    if (
      furnished &&
      (property.furnishing === "fully-furnished" || property.furnishing === "semi-furnished")
    ) score += 10;

    // Amenity match
    const propertyAmenityIds = property.Amenities.map(a => a.amenity_id);
    const matchedAmenities = propertyAmenityIds.filter(id => amenityIds.includes(id));
    score += matchedAmenities.length * 3;

    return {
      ...property.toJSON(),
      match_score: score,
    };
  })
  .filter(property => property.match_score >= 37) // Only include matches with score ≥ 50
  .sort((a, b) => b.match_score - a.match_score);

  res.status(200).json(new ApiResponse(200, scored, "Properties ranked and suggested successfully"));
});
