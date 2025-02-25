import Task from "../../../models/task.model.js";
import Status from "../../../models/statuses.model.js";
import UserAuth from "../../../models/userauth.model.js";
import Employee from "../../../models/employee.model.js"
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { Op } from "sequelize";

export const createTask = asyncHandler(async (req, res, next) => {
  try {
    const { title, description, status_id, due_date } = req.body;

    // Validate required fields
    if (!title) {
      return next(new ApiError(400, "Title is required"));
    }

    // Get logged-in user ID
    const loggedInUserId = req.user?.user_id;
    if (!loggedInUserId) {
      return next(new ApiError(401, "Unauthorized: User not found"));
    }

    // Fetch Employee ID & Role in a single query
    const userRecord = await UserAuth.findOne({
      where: { user_id: loggedInUserId },
      attributes: ["employee_id"],
      include: {
        model: Employee,
        attributes: ["employee_id", "first_name", "role"],
      },
    });

    if (!userRecord || !userRecord.Employee) {
      return next(new ApiError(404, "Employee record not found for this user."));
    }

    const loggedInEmployeeId = userRecord.Employee.employee_id;

    // Check if status_id is valid (optional but recommended)
    if (status_id) {
      const statusExists = await Status.findByPk(status_id);
      if (!statusExists) {
        return next(new ApiError(400, "Invalid status_id"));
      }
    }

    // Create Task
    const task = await Task.create({
      title,
      description,
      status_id: status_id || null, // Ensure null if not provided
      due_date,
      created_by: loggedInEmployeeId,
    });

    return res.status(201).json(new ApiResponse(201, "Task created successfully", task));
  } catch (error) {
    console.error("Error creating task:", error);
    return next(new ApiError(500, "Internal Server Error"));
  }
});

//get todo task by 
export const getTasks = asyncHandler(async (req, res, next) => {
  try {
    const { due_date, created_by } = req.query;

    if (!created_by) {
      return next(new ApiError(400, "created_by is required"));
    }

    // Build the where condition dynamically
    let whereCondition = { created_by };

    if (due_date) {
      // If due_date is in the past, fetch overdue tasks
      const today = new Date().toISOString().split("T")[0]; // Get today's date (YYYY-MM-DD)
      if (due_date < today) {
        whereCondition.due_date = { [Op.lt]: today }; // Fetch overdue tasks
      } else {
        whereCondition.due_date = due_date; // Fetch tasks for the given due date
      }
    }

    // Fetch tasks with Employee (Creator) and Status details
    const tasks = await Task.findAll({
      where: whereCondition,
      include: [
        {
          model: Employee,
          as: "Creator",
          attributes: ["employee_id", "first_name", "role"],
        },
        {
          model: Status,
          attributes: ["status_id", "status_name"],
        },
      ],
      order: [["due_date", "ASC"]], // Sort by earliest due date first
    });

    if (!tasks || tasks.length === 0) {
      return next(new ApiError(404, "No tasks found"));
    }

    return res.status(200).json(new ApiResponse(200, "Tasks fetched successfully", tasks));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return next(new ApiError(500, "Internal Server Error"));
  }
});

export const updateTask = asyncHandler(async (req, res, next) => {
  try {
    const { task_id } = req.params;
    const { title, description, status_id, due_date } = req.body;

    // Validate required fields
    if (!task_id) {
      return next(new ApiError(400, "task_id is required"));
    }

    // Check if task exists
    const task = await Task.findByPk(task_id);
    if (!task) {
      return next(new ApiError(404, "Task not found"));
    }

    // Update Task
    task.title = title || task.title;
    task.description = description || task.description;
    task.status_id = status_id || task.status_id;
    task.due_date = due_date || task.due_date;

    await task.save();

    return res.status(200).json(new ApiResponse(200, "Task updated successfully", task));
  } catch (error) {
    console.error("Error updating task:", error);
    return next(new ApiError(500, "Internal Server Error"));
  }
});

export const deleteTask = asyncHandler(async (req, res, next) => {
  try {
    const { task_id } = req.params;

    // Validate required fields
    if (!task_id) {
      return next(new ApiError(400, "task_id is required"));
    }

    // Check if task exists
    const task = await Task.findByPk(task_id);
    if (!task) {
      return next(new ApiError(404, "Task not found"));
    }

    // Delete Task
    await task.destroy();

    return res.status(200).json(new ApiResponse(200, "Task deleted successfully"));
  } catch (error) {
    console.error("Error deleting task:", error);
    return next(new ApiError(500, "Internal Server Error"));
  }
});



