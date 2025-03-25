import Employee from "../../../models/employee.model.js";
import Properties from "../../../models/properties.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import PropertyMedia from "../../../models/propertymedia.model.js";
import Statuses from "../../../models/statuses.model.js";
import UserAuth from "../../../models/userauth.model.js";
import { uploadOnCloudinary } from "../../../utils/Cloudinary.utils.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"
import { convertUTCToLocal } from "../../../utils/DateHelper.utils.js";
import { sequelize } from "../../../db/index.js";
import { sendNotification } from "../../../utils/sendNotification.utils.js";


// Add a new property
export const addProperty = asyncHandler(async (req, res, next) => {
    try {
        // Ensure req.body is correctly parsed
        const {
            title,
            address,
            owner_name,
            owner_phone,
            city,
            state,
            zip_code,
            property_type_id,
            price,
            bedrooms,
            bathrooms,
            square_feet,
            status_id,
            listed_by,
            listed_date,
            description,
        } = req.body;

        // Validate required fields
        if (!title || !address || !city || !state || !zip_code || !property_type_id || !price || !status_id || !listed_by) {
            return next(new ApiError(400, "Missing required fields."));
        }

        // Create new property in database
        const newProperty = await Properties.create({
            title,
            address,
            owner_name,
            owner_phone,
            city,
            state,
            zip_code,
            property_type_id,
            price,
            bedrooms: bedrooms ? parseInt(bedrooms) : null,
            bathrooms: bathrooms ? parseInt(bathrooms) : null,
            square_feet: square_feet ? parseInt(square_feet) : null,
            status_id,
            listed_by,
            listed_date: listed_date ? convertUTCToLocal(listed_date) : convertUTCToLocal(new Date()),
            description,
            created_at: convertUTCToLocal(new Date()),
        });

        // Handle file uploads (images/videos)
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
                })
            );

            // Save uploaded media in database
            await PropertyMedia.bulkCreate(uploadedMedia.filter((media) => media !== undefined));
        }

        // Send success response
        res.status(201).json(new ApiResponse(201, newProperty, "Property added successfully"));
    } catch (error) {
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
        property_type_id,
        price,
        bedrooms,
        bathrooms,
        square_feet,
        status_id,
        listed_by,
        listed_date,
        description,
    } = req.body;

    if (!title || !address || !city || !state || !zip_code || !property_type_id || !price || !status_id || !listed_by) {
        return next(new ApiError(400, "Missing required fields."));
    }

    // Start transaction
    const transaction = await sequelize.transaction();
    try {
        // Check if property exists
        const existingProperty = await Properties.findOne({ where: { property_id }, transaction });
        if (!existingProperty) {
            await transaction.rollback();
            return next(new ApiError(404, "Property not found."));
        }


        // Update property
        const [updatedRows] = await Properties.update(
            {
                title,
                address,
                owner_name,
                owner_phone,
                city,
                state,
                zip_code,
                property_type_id,
                price,
                bedrooms,
                bathrooms,
                square_feet,
                status_id,
                listed_by,
                listed_date: listed_date ? convertUTCToLocal(listed_date) : convertUTCToLocal(new Date()),
                description,
            },
            { where: { property_id }, transaction }
        );

        if (updatedRows === 0) {
            await transaction.rollback();
            return next(new ApiError(500, "Failed to update property."));
        }


        // Handle media files
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
        const alreadyAssigned = properties.filter(prop => prop.assign_to);
        if (alreadyAssigned.length > 0) {
            const alreadyAssignedDetails = alreadyAssigned.map(prop =>
                `${prop.title} (ID: ${prop.property_id}) to agent ID ${prop.assign_to}`
            );
            return next(new ApiError(400, `Some properties are already assigned: ${alreadyAssignedDetails.join(', ')}`));
        }

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