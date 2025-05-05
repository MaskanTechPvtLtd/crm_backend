import Employee from "../../../models/employee.model.js";
import Properties from "../../../models/properties.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import PropertyMedia from "../../../models/propertymedia.model.js";
import Statuses from "../../../models/statuses.model.js";
import UserAuth from "../../../models/userauth.model.js";
import PropertyAmenities from "../../../models/propertyAmenities.model.js";
import Amenity from "../../../models/amenities.model.js";
import PropertyStatus from "../../../models/propertystatus.model.js";
import { uploadOnCloudinary } from "../../../utils/Cloudinary.utils.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"
import { convertUTCToLocal } from "../../../utils/DateHelper.utils.js";
import { sequelize } from "../../../db/index.js";
import { sendNotification } from "../../../utils/sendNotification.utils.js";
import { Op } from "sequelize";
import Lead from "../../../models/leads.model.js";

// Add a new property
export const addProperty = asyncHandler(async (req, res, next) => {
    const t = await sequelize.transaction(); // 🔥 start transaction
    try {
        const {
            title,
            address,
            owner_name,
            owner_phone,
            city,
            state,
            zip_code,
            latitude,
            longitude,
            property_type_id,
            price,
            bedrooms,
            bathrooms,
            square_feet,
            furnishing,
            floor_number,
            project_name,
            possession_date,
            status_id,
            property_status_id,
            listed_by,
            assign_to,
            listed_date,
            description,
        } = req.body;

        // Validate required fields
        if (!title || !address || !city || !state || !zip_code || !property_type_id || !price || !status_id || !listed_by) {
            return next(new ApiError(400, "Missing required fields."));
        }

        // Step 1: Create property
        const newProperty = await Properties.create({
            title,
            address,
            owner_name: owner_name || null,
            owner_phone: owner_phone || null,
            city,
            state,
            zip_code,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            property_type_id,
            price: parseFloat(price),
            bedrooms: bedrooms ? parseInt(bedrooms) : null,
            bathrooms: bathrooms ? parseInt(bathrooms) : null,
            square_feet: square_feet ? parseInt(square_feet) : null,
            furnishing: furnishing || "unfurnished",
            floor_number: floor_number ? parseInt(floor_number) : null,
            project_name: project_name || null,
            possession_date: possession_date || null,
            status_id,
            property_status_id: property_status_id || null,
            listed_by,
            assign_to: assign_to || null,
            listed_date: listed_date ? convertUTCToLocal(listed_date) : convertUTCToLocal(new Date()),
            description: description || null,
            created_at: convertUTCToLocal(new Date()),
        }, { transaction: t });

        // Step 2: Add amenities if provided

        // Convert comma-separated string to array if needed
        let amenities = req.body.amenities;
        if (typeof amenities === "string") {
            try {
                // Case 1: Sent as "[2,4,5]" => parse JSON string
                amenities = JSON.parse(amenities);
            } catch {
                // Case 2: Sent as "2,4,5" => split manually
                amenities = amenities.split(",").map((id) => parseInt(id));
            }
        }
        if (amenities && Array.isArray(amenities) && amenities.length > 0) {
            const amenityEntries = amenities.map((amenityId) => ({
                property_id: newProperty.property_id,
                amenity_id: amenityId,
            }));

            await PropertyAmenities.bulkCreate(amenityEntries, { transaction: t });
        }

        // Step 3: Handle file uploads (optional)
        if (req.files && req.files.length > 0) {
            const uploadedMedia = await Promise.all(
                req.files.map(async (file) => {
                    const cloudinaryResponse = await uploadOnCloudinary(file.path);
                    if (cloudinaryResponse) {
                        return {
                            property_id: newProperty.property_id,
                            file_url: cloudinaryResponse.secure_url,
                            media_type: file.mimetype.startsWith("image") ? "Image" : "Video",
                            uploaded_at: new Date(),
                        };
                    }
                    return null;
                })
            );

            const validMedia = uploadedMedia.filter((media) => media !== null);
            if (validMedia.length > 0) {
                await PropertyMedia.bulkCreate(validMedia, { transaction: t });
            }
        }

        await t.commit(); // 🔥 commit if everything successful

        res.status(201).json(new ApiResponse(201, newProperty, "Property added successfully with amenities and media."));
    } catch (error) {
        await t.rollback(); // 🔥 rollback if any error
        console.error("Error adding property:", error);
        next(new ApiError(500, "Something went wrong while adding the property."));
    }
});

//get property list based on filter by status or property type
export const GetAllProperties = asyncHandler(async (req, res, next) => {
    try {
        const { status_id, property_type_id } = req.query;

        // Build dynamic where condition
        const whereCondition = {};
        if (status_id) whereCondition.status_id = status_id;
        if (property_type_id) whereCondition.property_type_id = property_type_id;

        const properties = await Properties.findAll({
            where: whereCondition, // Apply filters dynamically
            include: [
                {
                    model: PropertyType,
                    as: "propertyType",
                    attributes: ["property_type_id", "type_name"],
                },
                {
                    model: Statuses,
                    as: "status",
                    attributes: ["status_id", "status_name"],
                },
                {
                    model: PropertyMedia,
                    as: "propertyMedia",
                    attributes: ["media_type", "file_url"],
                },
                {
                    model: Amenity,  //  Include Amenity here
                    attributes: ["amenity_id", "name"],
                    through: { attributes: [] }, // don't show PropertyAmenities join table data
                },
                {
                    model: PropertyStatus,
                    as: "propertyStatus",
                    attributes: ["property_status_id", "status_name"],
                }
            ],
        });
        if (!properties || properties.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No properties found.",
                data: null
            });
        }

        res.status(200).json(
            new ApiResponse(200, properties, "Properties retrieved successfully.")
        );
    } catch (error) {
        console.error("Error fetching properties:", error);
        next(new ApiError(500, "An error occurred while fetching properties."));
    }
});

//get single property
export const GetPropertyById = asyncHandler(async (req, res, next) => {
    const property_id = (req.params.property_id); // Convert to integer

    if (isNaN(property_id)) {
        return next(new ApiError(400, "Invalid property ID.")); // Handle non-numeric values
    }

    const property = await Properties.findOne({
        where: { property_id },
        include: [
            {
                model: PropertyType,
                as: "propertyType",
                attributes: ["property_type_id", "type_name"],
            },
            {
                model: Statuses,
                as: "status",
                attributes: ["status_id", "status_name"],
            },
            {
                model: PropertyMedia,
                as: "propertyMedia",
                attributes: ["media_type", "file_url"]

            },
            {
                model: Amenity,  //  Include Amenity here
                attributes: ["amenity_id", "name"],
                through: { attributes: [] }, // don't show PropertyAmenities join table data
            },
            {
                model: PropertyStatus,
                as: "propertyStatus",
                attributes: ["property_status_id", "status_name"],
            }
        ],
    });

    if (!property) {
        return next(new ApiError(404, "Property not found."));
    }

    res.status(200).json(new ApiResponse(200, { property }));
});

// Update property
export const UpdateProperty = asyncHandler(async (req, res, next) => {
    const property_id = req.params.property_id;
    const {
        title,
        address,
        owner_name,
        owner_phone,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        property_type_id,
        price,
        bedrooms,
        bathrooms,
        square_feet,
        furnishing,
        floor_number,
        project_name,
        possession_date,
        status_id,
        property_status_id,
        listed_by,
        assign_to,
        listed_date,
        description,
        amenities, // 👈 receive amenities here
    } = req.body;

    if (!title || !address || !city || !state || !zip_code || !property_type_id || !price || !status_id || !listed_by) {
        return next(new ApiError(400, "Missing required fields."));
    }

    const transaction = await sequelize.transaction();
    try {
        // Check if property exists
        const existingProperty = await Properties.findOne({ where: { property_id }, transaction });
        if (!existingProperty) {
            await transaction.rollback();
            return next(new ApiError(404, "Property not found."));
        }

        // Update property details
        const [updatedRows] = await Properties.update(
            {
                title,
                address,
                owner_name: owner_name || null,
                owner_phone: owner_phone || null,
                city,
                state,
                zip_code,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                property_type_id,
                price: parseFloat(price),
                bedrooms: bedrooms ? parseInt(bedrooms) : null,
                bathrooms: bathrooms ? parseInt(bathrooms) : null,
                square_feet: square_feet ? parseInt(square_feet) : null,
                furnishing: furnishing || "unfurnished",
                floor_number: floor_number ? parseInt(floor_number) : null,
                project_name: project_name || null,
                possession_date: possession_date || null,
                status_id,
                property_status_id: property_status_id || null,
                listed_by,
                assign_to: assign_to || null,
                listed_date: listed_date ? convertUTCToLocal(listed_date) : convertUTCToLocal(new Date()),
                description: description || null,
            },
            { where: { property_id }, transaction }
        );

        if (updatedRows === 0) {
            await transaction.rollback();
            return next(new ApiError(500, "Failed to update property."));
        }

        // 🔥 Handle amenities update
        if (amenities) {
            let parsedAmenities = amenities;

            if (typeof amenities === "string") {
                try {
                    parsedAmenities = JSON.parse(amenities);
                } catch {
                    parsedAmenities = amenities.split(",").map((id) => parseInt(id));
                }
            }

            if (Array.isArray(parsedAmenities)) {
                // First, delete old amenities for this property
                await PropertyAmenities.destroy({ where: { property_id }, transaction });

                // Then, insert new amenities
                const amenityEntries = parsedAmenities.map((amenityId) => ({
                    property_id,
                    amenity_id: amenityId,
                }));

                if (amenityEntries.length > 0) {
                    await PropertyAmenities.bulkCreate(amenityEntries, { transaction });
                }
            }
        }

        // 🔥 Handle media files update
        if (req.files && req.files.length > 0) {
            // Delete existing media
            await PropertyMedia.destroy({ where: { property_id }, transaction });

            // Upload new media
            const uploadedMedia = await Promise.all(
                req.files.map(async (file) => {
                    try {
                        const cloudinaryResponse = await uploadOnCloudinary(file.path);
                        return cloudinaryResponse
                            ? {
                                property_id,
                                file_url: cloudinaryResponse.secure_url,
                                media_type: file.mimetype.startsWith("image") ? "Image" : "Video",
                                uploaded_at: new Date(),
                            }
                            : null;
                    } catch (error) {
                        console.error("❌ Cloudinary upload failed:", error);
                        return null;
                    }
                })
            );

            const validMedia = uploadedMedia.filter((media) => media !== null);
            if (validMedia.length > 0) {
                await PropertyMedia.bulkCreate(validMedia, { transaction });
            }
        }

        // Commit transaction
        await transaction.commit();

        res.status(200).json(new ApiResponse(200, updatedRows, "Property updated successfully"));
    } catch (error) {
        await transaction.rollback();
        console.error("Error updating property:", error);
        next(new ApiError(500, "Error updating property."));
    }
});

// Delete property
export const DeleteProperty = asyncHandler(async (req, res, next) => {
    // Convert property_id to an integer
    const property_id = (req.params.property_id);

    // Validate property_id
    if (isNaN(property_id)) {
        return next(new ApiError(400, "Invalid property ID."));
    }

    // Check if property exists
    const property = await Properties.findOne({ where: { property_id } });
    if (!property) {
        return next(new ApiError(404, "Property not found."));
    }

    // Delete property
    await Properties.destroy({ where: { property_id } });

    res.status(200).json(new ApiResponse(200, {}, "Property deleted successfully"));
});

//assign property to agent by admin(only admin can assign)
// export const AssignPropertyToAgent = asyncHandler(async (req, res, next) => {
//     const { agent_id, property_id } = req.body;

//     // Validate input
//     if (!property_id || !agent_id) {
//         return next(new ApiError(400, "Missing required fields (property_id, agent_id)."));
//     }

//     // Find the property
//     const property = await Properties.findByPk(property_id, {
//         attributes: ["property_id", "title", "assign_to"], // Include title
//     });

//     if (!property) {
//         return next(new ApiError(404, "Property not found."));
//     }

//     // 🔹 Check if the property is already assigned
//     if (property.assign_to) {
//         return next(new ApiError(400 , `Property ${property.title} is already assigned to agent ID ${property.assign_to}.`));
//     }

//     // Get the logged-in user's ID from the JWT middleware
//     const loggedInUserId = req.user.user_id; // Ensure `req.user` contains `user_id`

//     // Step 1: Retrieve the `employee_id` from `user_id`
//     const userRecord = await UserAuth.findOne({
//         where: { user_id: loggedInUserId },
//         attributes: ["employee_id"], // Fetch `employee_id`
//     });

//     if (!userRecord || !userRecord.employee_id) {
//         return next(new ApiError(404, "Employee record not found for this user."));
//     }

//     const loggedInEmployeeId = userRecord.employee_id;

//     // Step 2: Find the logged-in employee (Admin)
//     const loggedInEmployee = await Employee.findOne({
//         where: { employee_id: loggedInEmployeeId },
//         attributes: ["employee_id", "first_name", "role"],
//     });

//     if (!loggedInEmployee) {
//         return next(new ApiError(404, "Employee not found in records."));
//     }

//     // Ensure only Admins can assign an agent to a property
//     if (loggedInEmployee.role !== "Admin") {
//         return next(new ApiError(403, "You are not authorized to assign properties."));
//     }
//     const adminId = loggedInEmployee.employee_id;

//     // Step 3: Find the Agent’s Name
//     const agent = await Employee.findOne({
//         where: { employee_id: agent_id },
//         attributes: ["employee_id", "first_name", "last_name"],
//     });

//     if (!agent) {
//         return next(new ApiError(404, "Agent not found."));
//     }

//     // Step 4: Assign the property to the agent
//     property.assign_to = agent_id;
//     await property.save();

//     await sendNotification({
//         recipientUserId: agent_id,
//         senderId: adminId,
//         entityType: "Property",
//         entityId: property_id,
//         notificationType: "Assignment",
//         title: "New Property Assignment",
//         message: "You have been assigned a new property. Please review the details.",
//     });


//     // Step 5: Return agent name & property title
//     res.status(200).json(
//         new ApiResponse(200, {
//             property_id: property.property_id,
//             property_title: property.title,
//             assigned_to: {
//                 agent_id: agent.employee_id,
//                 agent_name: `${agent.first_name} ${agent.last_name}`,
//             },
//         }, "Property assigned to agent successfully.")
//     );
// });

export const AssignPropertyToAgent = asyncHandler(async (req, res, next) => {
    try {
        console.log("Incoming request body:", req.body); // Debug log
        const { agent_id, property_ids } = req.body;

        // Validate input
        if (!Array.isArray(property_ids) || property_ids.length === 0) {
            return next(new ApiError(400, "property_ids must be a non-empty array"));
        }
        if (!agent_id) {
            return next(new ApiError(400, "agent_id is required"));
        }

        // Ensure all property_ids are valid (not undefined, null, or non-numeric)
        const validPropertyIds = property_ids.filter(id => id !== undefined && id !== null && !isNaN(id));
        if (validPropertyIds.length !== property_ids.length) {
            const invalidIds = property_ids.filter(id => !validPropertyIds.includes(id));
            return next(new ApiError(400, `Invalid property_ids provided: ${invalidIds.join(', ')}`));
        }

        // Find all properties
        const properties = await Properties.findAll({
            where: { property_id: validPropertyIds },
            attributes: ["property_id", "title", "assign_to"],
        });

        // Check if all requested properties were found
        if (properties.length !== validPropertyIds.length) {
            const foundPropertyIds = properties.map(prop => prop.property_id);
            const missingPropertyIds = validPropertyIds.filter(id => !foundPropertyIds.includes(id));
            return next(new ApiError(404, `Some properties not found: ${missingPropertyIds.join(', ')}`));
        }

        // Check if any properties are already assigned
        // const alreadyAssigned = properties.filter(prop => prop.assign_to);
        // if (alreadyAssigned.length > 0) {
        //     const alreadyAssignedDetails = alreadyAssigned.map(prop =>
        //         `${prop.title} (ID: ${prop.property_id}) to agent ID ${prop.assign_to}`
        //     );
        //     return next(new ApiError(400, `Some properties are already assigned: ${alreadyAssignedDetails.join(', ')}`));
        // }

        // Get the logged-in user's ID from the JWT middleware
        const loggedInUserId = req.user.user_id;
        if (!loggedInUserId) {
            return next(new ApiError(401, "User not authenticated"));
        }

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

        // Ensure only Admins can assign properties
        if (loggedInEmployee.role !== "Admin") {
            return next(new ApiError(403, "You are not authorized to assign properties."));
        }
        const adminId = loggedInEmployee.employee_id;

        // Step 3: Find the Agent
        const agent = await Employee.findOne({
            where: { employee_id: agent_id },
            attributes: ["employee_id", "first_name", "last_name"],
        });

        if (!agent) {
            return next(new ApiError(404, "Agent not found."));
        }

        // Step 4: Assign all properties to the agent
        await Properties.update(
            { assign_to: agent_id },
            { where: { property_id: validPropertyIds } }
        );

        // Step 5: Send notification to the agent
        const propertyTitles = properties.map(prop => prop.title).join(', ');
        await sendNotification({
            recipientUserId: agent_id,
            senderId: adminId,
            entityType: "Property",
            entityId: validPropertyIds[0], // Use first property ID
            notificationType: "Assignment",
            title: "New Property Assignment",
            message: `You have been assigned new properties: ${propertyTitles}`,
        });

        // Step 6: Prepare response
        const assignedProperties = properties.map(prop => ({
            property_id: prop.property_id,
            property_title: prop.title,
        }));

        res.status(200).json(
            new ApiResponse(
                200,
                {
                    assigned_properties: assignedProperties,
                    assigned_to: {
                        agent_id: agent.employee_id,
                        agent_name: `${agent.first_name} ${agent.last_name}`,
                    },
                },
                "Properties assigned to agent successfully."
            )
        );
    } catch (err) {
        console.error("Error assigning properties:", err);
        next(new ApiError(500, "Something went wrong while assigning the properties."));
    }
});

export const toggleArchiveProperty = asyncHandler(async (req, res, next) => {
    const { property_id } = req.params;

    // Check if the property exists
    const property = await Properties.findOne({ where: { property_id } });

    if (!property) {
        return next(new ApiError(404, "Property not found."));
    }

    // Toggle archive status
    const newStatus = !property.isArchived;
    const updatedStatusId = newStatus ? 6 : 1; // Assuming 6 means "archived" and null means "active"

    await Properties.update(
        { status_id: updatedStatusId, isArchived: newStatus },
        { where: { property_id } }
    );

    const message = newStatus
        ? "Property archived successfully."
        : "Property unarchived successfully.";

    res.status(200).json(new ApiResponse(200, { property_id, isArchived: newStatus }, message));
});

// export const suggestLeads = asyncHandler(async (req, res) => {
//     const { property_id } = req.params;

//     if (!property_id) throw new ApiError(400, "Property ID is required");

//     // Fetch property details
//     const property = await Properties.findOne({
//       where: { property_id },
//       attributes: [
//         "price",
//         "property_type_id",
//         "bedrooms",
//         "bathrooms",
//         "furnishing",
//         "city",
//         "address",
//       ],
//     });

//     if (!property) throw new ApiError(404, "Property not found");

//     const {
//       price,
//       property_type_id,
//       bedrooms,
//       bathrooms,
//       furnishing,
//       city,
//       address,
//     } = property;

//     // Furnishing match logic
//     const furnishingMatch =
//       furnishing === "fully-furnished" || furnishing === "semi-furnished"
//         ? [true] // Match leads who want furnished = true
//         : [true, false]; // Include all leads if property is not furnished

//     // Filter logic
//     const whereClause = {
//       isArchived: false,
//       budget_min: { [Op.lte]: price },
//       budget_max: { [Op.gte]: price },
//       preferred_type_id_fk: property_type_id || { [Op.not]: null },
//       ...(bedrooms && { bedrooms }),
//       ...(bathrooms && { bathrooms }),
//       ...(city && { preferredCity: city }),
//       ...(address && { preferredLocation: { [Op.iLike]: `%${address}%` } }),
//       furnished: { [Op.in]: furnishingMatch },
//     };

//     const leads = await Lead.findAll({
//       where: whereClause,
//     });

//     if (!leads.length) {
//       throw new ApiError(404, "No matching leads found");
//     }

//     res
//       .status(200)
//       .json(new ApiResponse(200, leads, "Leads suggested successfully"));
//   });


export const suggestLeads = asyncHandler(async (req, res) => {
    const { property_id } = req.params;

    if (!property_id) throw new ApiError(400, "Property ID is required");

    // Fetch property details with amenities
    const property = await Properties.findOne({
        where: { property_id },
        include: [
            {
                model: Amenity,
                through: { attributes: [] }, // omit junction details
                attributes: ["amenity_id", "name"],
            },
        ],
    });

    if (!property) throw new ApiError(404, "Property not found");

    const {
        price,
        property_type_id,
        bedrooms,
        bathrooms,
        furnishing,
        city,
        address,
        Amenities: PropertyAmenities = [],
    } = property;

    const propertyAmenityIds = PropertyAmenities.map(a => a.amenity_id);

    // Fetch all active leads with amenities
    const leads = await Lead.findAll({
        where: { isArchived: false },
        include: [
            {
                model: Amenity,
                through: { attributes: [] },
                attributes: ["amenity_id", "name"],
            },
        ],
    });

    if (!leads.length) throw new ApiError(404, "No leads found");

    // Score each lead
    const scoredLeads = leads
        .map((lead) => {
            let score = 0;

            if (lead.budget_min <= price && lead.budget_max >= price) score += 15;
            if (lead.preferred_type_id_fk === property_type_id) score += 15;
            if (lead.bedrooms === bedrooms) score += 10;
            if (lead.bathrooms === bathrooms) score += 10;
            if (lead.preferredCity?.toLowerCase() === city.toLowerCase()) score += 10;
            if (
                lead.preferredLocation &&
                address.toLowerCase().includes(lead.preferredLocation.toLowerCase())
            )
                score += 5;

            if (
                lead.furnished &&
                (furnishing === "fully-furnished" || furnishing === "semi-furnished")
            )
                score += 10;

            const leadAmenityIds = lead.Amenities.map(a => a.amenity_id);
            const matchedAmenities = leadAmenityIds.filter(id => propertyAmenityIds.includes(id));
            score += matchedAmenities.length * 3;

            return {
                ...lead.toJSON(),
                match_score: score,
            };
        })
        .filter(lead => lead.match_score >= 37) // Only return leads with score >= 50
        .sort((a, b) => b.match_score - a.match_score); // Highest score first

    if (!scoredLeads.length) {
        throw new ApiError(404, "No sufficiently matching leads found");
    }

    res.status(200).json(new ApiResponse(200, scoredLeads, "Leads ranked and suggested successfully"));
});