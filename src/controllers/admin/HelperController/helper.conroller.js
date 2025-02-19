import Employee from "../../../models/employee.model.js";
import Properties from "../../../models/properties.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import PropertyMedia from "../../../models/propertymedia.model.js";
import Statuses from "../../../models/statuses.model.js";
import Leadsources from "../../../models/leadsources.model.js"
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"


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