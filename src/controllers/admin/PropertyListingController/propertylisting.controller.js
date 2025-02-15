import Employee from "../../../models/employee.model.js";
import Attendance from "../../../models/attendance.model.js";
import Properties from "../../../models/properties.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import PropertyMedia from "../../../models/propertymedia.model.js";
import Statuses from "../../../models/statuses.model.js";
import { Op } from "sequelize";
import UserAuth from "../../../models/userauth.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // Use bcryptjs for better compatibility
import { uploadOnCloudinary } from "../../../utils/Cloudinary.utils.js";
import { Sequelize } from "sequelize";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"
import { convertUTCToLocal } from "../../../utils/DateHelper.utils.js";


// Add a new property
export const addProperty = asyncHandler(async (req, res, next) => {
    try {
        console.log("Received request body:", req.body);
        console.log("Received files:", req.files);

        // Ensure req.body is correctly parsed
        const {
            title,
            address,
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

export const GetAllProperties = asyncHandler(async (req, res, next) => {
    const properties = await Properties.findAll({
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
        ],
    });

    if (!properties) {
        return next(new ApiError(404, "No properties found."));
    }

    res.status(200).json(
        new ApiResponse(200, {
            properties,
        })
    );
});

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

    // Update property
    const updatedProperty = await Properties.update(
        {
            title,
            address,
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
        {
            where: { property_id },
        }
    );

    if (!updatedProperty) {
        return next(new ApiError(500, "Error updating property."));
    }

    res.status(200).json(new ApiResponse(200, {}, "Property updated successfully"));
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

