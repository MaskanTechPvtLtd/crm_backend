import Properties from "../../models/properties.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import PropertyMedia from "../../models/propertymedia.model.js";
import Employee from "../../models/employee.model.js";
import UserAuth from "../../models/userauth.model.js";
import Status from "../../models/statuses.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { sendNotification } from "../../utils/sendNotification.utils.js";

// Get all properties assigned to the agent with optional filters
export const getPropertiesByAgent = asyncHandler(async (req, res, next) => {
    try {
        const { agent_id } = req.params; // Extract agent ID from request params

        // Validate that agent_id is a number
        if (!agent_id || isNaN(agent_id)) {
            return next(new ApiError(400, "Invalid agent ID."));
        }

        const { status_id, property_type_id } = req.query;

        // Build dynamic filters
        let filters = { assign_to: agent_id };
        if (status_id) filters.status_id = status_id;
        if (property_type_id) filters.property_type_id = property_type_id;

        // Fetch properties assigned to the given agent with applied filters
        const properties = await Properties.findAll({
            where: filters, // Apply filters dynamically
            include: [
                {
                    model: PropertyType,
                    as: "PropertyType",
                    attributes: ["property_type_id", "type_name"]
                },
                {
                    model: Employee,
                    as: "listedBy",
                    attributes: ["employee_id", "first_name", "last_name", "role"]
                },
                {
                    model: PropertyMedia,
                    as: "propertyMedia",
                    attributes: ["media_type", "file_url"]
                },
                {
                    model: Status,
                    as: "status",
                    attributes: ["status_id", "status_name"]
                }
            ]
        });

        // If no properties are found, return an empty array with a message
        if (!properties.length) {
            return res.status(200).json(new ApiResponse(200, [], "No properties found for this agent."));
        }

        return res.status(200).json(new ApiResponse(200, properties, "Properties assigned to the agent retrieved successfully."));
    } catch (error) {
        console.error("Error fetching properties for agent:", error);
        return next(new ApiError(500, "Something went wrong while fetching properties for the agent."));
    }
});

export const UpdatePropertyStatus = asyncHandler(async (req, res, next) => {
    try {
        const { property_id } = req.params;
        const { status_id } = req.body;

        // Validate input
        if (!property_id || isNaN(property_id)) {
            return next(new ApiError(400, "Invalid property ID."));
        }
        if (!status_id || isNaN(status_id)) {
            return next(new ApiError(400, "Invalid status ID."));
        }

        // Find the property and check if it exists
        const property = await Properties.findOne({
            where: { property_id },
            include: [{ model: Status, as: "status", attributes: ["status_name"] }]
        });

        if (!property) {
            return next(new ApiError(404, "Properties not found."));
        }

        // Update the property status
        await property.update({ status_id });

        // Get the updated status name
        const updatedStatus = await Status.findOne({
            where: { status_id },
            attributes: ["status_name"]
        });

        // Fetch the logged-in user's employee details
        const loggedInUserId = req.user.user_id;
        const userRecord = await UserAuth.findOne({
            where: { user_id: loggedInUserId },
            attributes: ["employee_id"]
        });

        if (!userRecord || !userRecord.employee_id) {
            return next(new ApiError(404, "Employee record not found for this user."));
        }

        const loggedInEmployeeId = userRecord.employee_id;
        const loggedInEmployee = await Employee.findOne({
            where: { employee_id: loggedInEmployeeId },
            attributes: ["first_name", "role"]
        });

        // Find the admin user to notify
        const admin = await Employee.findOne({ where: { role: "Admin" }, attributes: ["employee_id"] });

        if (!admin) {
            return next(new ApiError(404, "Admin user not found."));
        }

        // Construct the notification message dynamically
        const notificationMessage = `Property (ID: ${property_id}) status has been updated to "${updatedStatus.status_name}" by ${loggedInEmployee.first_name}. Please review the changes.`;

        // Send notification to the admin
        await sendNotification({
            recipientUserId: admin.employee_id,
            senderId: loggedInEmployeeId,
            entityType: "Properties",
            entityId: property_id,
            notificationType: "Status Update",
            title: "Property Status Updated",
            message: notificationMessage
        });

        return res.status(200).json(new ApiResponse(200, property, `Properties status updated to "${updatedStatus.status_name}" successfully.`));
    } catch (error) {
        console.error("Error updating property status:", error);
        return next(new ApiError(500, "Something went wrong while updating property status."));
    }
});

