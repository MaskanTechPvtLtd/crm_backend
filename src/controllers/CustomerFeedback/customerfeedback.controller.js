import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import Employee from "../../models/employee.model.js";
import CustomerFeedback from "../../models/customerfeedback.model.js";

export const addCustomerFeedback = asyncHandler(async (req, res) => {
    const { customer_name, agent_id, body_text, rating } = req.body;

    // Validate input
    if (!customer_name || typeof customer_name !== "string") {
        return res.status(400).json(new ApiResponse(400, null, "Customer name is required and must be a string"));
    }
    if (!agent_id || !Number.isInteger(agent_id)) {
        return res.status(400).json(new ApiResponse(400, null, "Agent ID is required and must be an integer"));
    }
    if (!body_text || typeof body_text !== "string") {
        return res.status(400).json(new ApiResponse(400, null, "Feedback body text is required and must be a string"));
    }
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json(new ApiResponse(400, null, "Rating is required and must be an integer between 1 and 5"));
    }

    // Check if the agent exists
    const agentExists = await Employee.findByPk(agent_id);
    if (!agentExists) {
        return res.status(404).json(new ApiResponse(404, null, "Agent not found"));
    }

    // Create the feedback record
    const feedback = await CustomerFeedback.create({
        customer_name,
        agent_id,
        body_text,
        rating,
        created_at: new Date(),
    });

    // Return success response
    res.status(201).json(new ApiResponse(201, feedback, "Feedback added successfully"));
});


export const getFeedback = async (req, res) => {
  try {
    const { agent_id, rating, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.json(new ApiResponse(400, null, "Page must be a positive integer"));
    }
    if (isNaN(limitNum) || limitNum < 1) {
      return res.json(new ApiResponse(400, null, "Limit must be a positive integer"));
    }

    const where = {};
    if (agent_id) {
      const agentIdNum = parseInt(agent_id, 10);
      if (isNaN(agentIdNum)) {
        return res.json(new ApiResponse(400, null, "Agent ID must be an integer"));
      }
      where.agent_id = agentIdNum;
    }
    if (rating) {
      const ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.json(new ApiResponse(400, null, "Rating must be an integer between 1 and 5"));
      }
      where.rating = ratingNum;
    }

    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await CustomerFeedback.findAndCountAll({
      where,
      offset,
      limit: limitNum,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Employee,
          as: "agent",
          attributes: ["employee_id", "first_name", "last_name"],
        },
      ],
    });

    return res.json(
      new ApiResponse(200, {
        feedback: rows,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        },
      }, "Feedback retrieved successfully")
    );
  } catch (error) {
    console.error("Error retrieving feedback:", error);
    return res.json(new ApiResponse(500, null, "Failed to retrieve feedback"));
  }
};
