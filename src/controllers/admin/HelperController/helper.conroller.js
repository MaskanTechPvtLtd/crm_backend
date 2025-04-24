import Employee from "../../../models/employee.model.js";
import Properties from "../../../models/properties.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import PropertyMedia from "../../../models/propertymedia.model.js";
import Statuses from "../../../models/statuses.model.js";
import Leadsources from "../../../models/leadsources.model.js"
import LeadStatus from "../../../models/leadstatus.model.js";
import Amenity from "../../../models/amenities.model.js";
import PropertyStatus from "../../../models/propertystatus.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"
import { predefinedStatuses, predefinedLeadSources, predefinedPropertyTypes, predefinedLeadStatuses, predefinedPropertyAmenities,predefinepropertyStatuses } from "../../../constants.js";


export const GetStatus = asyncHandler(async (req, res, next) => {
    const statuses = await Statuses.findAll()
    if (!statuses || statuses.length === 0) {
        return res.status(404).json(new ApiError(404, [], "No statuses found."));
    }

    res.status(200).json(new ApiResponse(200, statuses, "Statuses retrieved successfully."));

})


export const GetLeadSource = asyncHandler(async (req, res, next) => {
    const leadsources = await Leadsources.findAll()
    if (!leadsources || leadsources.length === 0) {
        return res.status(404).json(new ApiError(404, [], "No leadsource found."));
    }

    res.status(200).json(new ApiResponse(200, leadsources, "Statuses retrieved successfully."));

})


export const GetPropertyType = asyncHandler(async (req, res, next) => {
    const propertytype = await PropertyType.findAll()
    if (!propertytype || propertytype.length === 0) {
        return res.status(404).json(new ApiError(404, [], "No statuses found."));
    }

    res.status(200).json(new ApiResponse(200, propertytype, "Statuses retrieved successfully."));

})

export const GetPropertyAmenities = asyncHandler(async (req, res, next) => {
    const amenity = await Amenity.findAll()
    if (!amenity || amenity.length === 0) {
        return res.status(404).json(new ApiError(404, [], "No Lead Status found."));
    }

    res.status(200).json(new ApiResponse(200, amenity, "Amenities retrieved successfully."));

})
export const GetpropertyStatus = asyncHandler(async (req, res, next) => {
    const propertystatus = await PropertyStatus.findAll()
    if (!propertystatus || propertystatus.length === 0) {
        return res.status(404).json(new ApiError(404, [], "No Lead Status found."));
    }

    res.status(200).json(new ApiResponse(200, propertystatus, "Amenities retrieved successfully."));

})

export const GetLeadStatus = asyncHandler(async (req, res, next) => {
    const statuses = await LeadStatus.findAll()
    if (!statuses || statuses.length === 0) {
        return res.status(404).json(new ApiError(404, [], "No Lead Status found."));
    }

    res.status(200).json(new ApiResponse(200, statuses, "Statuses retrieved successfully."));

})

export const SeedStatuses = asyncHandler(async (req, res, next) => {
    try {
        const insertResults = [];

        for (const status of predefinedStatuses) {
            const [entry, created] = await Statuses.findOrCreate({
                where: { status_name: status.status_name },
                defaults: { status_id: status.status_id },
            });

            insertResults.push({
                status_name: status.status_name,
                created,
            });
        }

        res.status(201).json(
            new ApiResponse(201, insertResults, "Statuses seeded successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, [], "Failed to seed statuses."));
    }
});

export const SeedLeadSources = asyncHandler(async (req, res, next) => {
    try {
        const insertResults = [];

        for (const source of predefinedLeadSources) {
            const [entry, created] = await Leadsources.findOrCreate({
                where: { source_name: source.source_name },
                defaults: { source_id: source.source_id },
            });

            insertResults.push({
                source_name: source.source_name,
                created,
            });
        }

        res.status(201).json(
            new ApiResponse(201, insertResults, "Lead sources seeded successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, [], "Failed to seed lead sources."));
    }
});

export const SeedPropertyTypes = asyncHandler(async (req, res, next) => {
    try {
        const insertResults = [];

        for (const type of predefinedPropertyTypes) {
            const [entry, created] = await PropertyType.findOrCreate({
                where: { type_name: type.type_name },
                defaults: { property_type_id: type.property_type_id },
            });

            insertResults.push({
                type_name: type.type_name,
                created,
            });
        }

        res.status(201).json(
            new ApiResponse(201, insertResults, "Property types seeded successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, [], "Failed to seed property types."));
    }
});

export const SeedLeadStatuses = asyncHandler(async (req, res, next) => {
    try {
        const insertResults = [];

        for (const status of predefinedLeadStatuses) {
            const [entry, created] = await LeadStatus.findOrCreate({
                where: { status_name: status.status_name },
                defaults: { status_id: status.status_id },
            });

            insertResults.push({
                status_name: status.status_name,
                created,
            });
        }

        res.status(201).json(
            new ApiResponse(201, insertResults, "Lead statuses seeded successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, [], "Failed to seed lead statuses."));
    }
});


export const SeedPropertyAmenities = asyncHandler(async (req, res, next) => {
    try {
        const insertResults = [];

        for (const amenity of predefinedPropertyAmenities) {
            const [entry, created] = await Amenity.findOrCreate({
                where: { name: amenity.amenity_name },
                defaults: { amenity_id: amenity.amenity_id },
            });

            insertResults.push({
                amenity_name: amenity.amenity_name,
                created,
            });
        }

        res.status(201).json(
            new ApiResponse(201, insertResults, "Property amenities seeded successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, [], "Failed to seed Amenity types."));
    }
});

export const SeedPropertyStatus = asyncHandler(async (req, res, next) => {
    try {
        const insertResults = [];

        for (const status of predefinepropertyStatuses) {
            const [entry, created] = await PropertyStatus.findOrCreate({
                where: { status_name: status.status_name },
                defaults: { property_status_id: status.property_status_id },
            });

            insertResults.push({
                status_name: status.status_name,
                created,
            });
        }

        res.status(201).json(
            new ApiResponse(201, insertResults, "Property statuses seeded successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, [], "Failed to seed property statuses."));
    }
});