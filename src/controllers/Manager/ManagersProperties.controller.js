import Property from "../../models/properties.model.js";
import PropertyMedia from "../../models/propertymedia.model.js";
import PropertyType from "../../models/propertytypes.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import Status from "../../models/statuses.model.js";
import Employee from "../../models/employee.model.js";
import UserAuth from "../../models/userauth.model.js";
import { sendNotification } from "../../utils/sendNotification.utils.js";

export const getPropertiesByManager = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id } = req.params; // Extract agent ID from request params

        // Validate that agent_id is a number
        if (!manager_id || isNaN(manager_id)) {
            return next(new ApiError(400, "Invalid agent ID."));
        }

        const { status_id, property_type_id } = req.query;

        // Build dynamic filters
        let filters = { assign_to: manager_id };
        if (status_id) filters.status_id = status_id;
        if (property_type_id) filters.property_type_id = property_type_id;

        // Fetch properties assigned to the given agent with applied filters
        const properties = await Property.findAll({
            where: filters, // Apply filters dynamically
            include: [
                {
                    model: PropertyType,
                    as: "propertyType",
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
            return res.status(200).json(new ApiResponse(200, [], "No properties found for this manager."));
        }

        return res.status(200).json(new ApiResponse(200, properties, "Properties assigned to the manager retrieved successfully."));
    } catch (error) {
        console.error("Error fetching properties for agent:", error);
        return next(new ApiError(500, "Something went wrong while fetching properties for the manager."));
    }
});

export const AssignPropertyToEmployee = asyncHandler(async (req, res, next) => {
    try {
        const { agent_id, property_id } = req.body;

        // 🔹 Validate input
        if (!property_id || !agent_id) {
            return next(new ApiError(400, "Missing required fields (property_id, agent_id)."));
        }

        // 🔹 Find the property
        const property = await Property.findByPk(property_id, {
            attributes: ["property_id", "title", "assign_to"],
        });

        if (!property) {
            return next(new ApiError(404, "Property not found."));
        }

        // 🔹 Get the logged-in user's ID from JWT
        const loggedInUserId = req.user?.user_id;
        if (!loggedInUserId) {
            return next(new ApiError(401, "Unauthorized. User ID is missing."));
        }

        // 🔹 Retrieve the logged-in employee's ID
        const userRecord = await UserAuth.findOne({
            where: { user_id: loggedInUserId },
            attributes: ["employee_id"],
        });

        if (!userRecord?.employee_id) {
            return next(new ApiError(404, "Employee record not found for this user."));
        }

        const loggedInEmployeeId = userRecord.employee_id;

        // 🔹 Ensure the logged-in user is a Manager
        const manager = await Employee.findOne({
            where: { employee_id: loggedInEmployeeId, role: "Manager" },
            attributes: ["employee_id", "first_name"],
        });

        if (!manager) {
            return next(new ApiError(403, "You are not authorized to assign properties."));
        }

        // 🔹 Check if the property is assigned to the Manager
        if (property.assign_to !== loggedInEmployeeId) {
            return next(new ApiError(403, `You can only assign properties assigned to you.`));
        }

        // 🔹 Find the Sales Agent
        const agent = await Employee.findOne({
            where: { employee_id: agent_id, role: "Sales Agent" }, // Ensure the role is "Sales Agent"
            attributes: ["employee_id", "first_name", "last_name"],
        });

        if (!agent) {
            return next(new ApiError(404, "Agent not found or not a Sales Agent."));
        }

        // 🔹 Assign the property to the Sales Agent
        await Property.update(
            { assign_to: agent_id },
            { where: { property_id } }
        );

        // 🔹 Send notification
        await sendNotification({
            recipientUserId: agent_id,
            senderId: manager.employee_id,
            entityType: "Property",
            entityId: property_id,
            notificationType: "Assignment",
            title: "New Property Assignment",
            message: `You have been assigned a new property "${property.title}". Please review the details.`,
        });

        // 🔹 Return success response
        return res.status(200).json(
            new ApiResponse(200, {
                property_id: property.property_id,
                property_title: property.title,
                assigned_to: {
                    agent_id: agent.employee_id,
                    agent_name: `${agent.first_name} ${agent.last_name}`,
                },
            }, "Property assigned to agent successfully.")
        );
    } catch (error) {
        console.error("Error assigning property to agent:", error);
        return next(new ApiError(500, "Something went wrong while assigning the property."));
    }
});
