import Employee from "../../../models/employee.model.js";
import Attendance from "../../../models/attendance.model.js";
import Properties from "../../../models/properties.model.js";
import PropertyType from "../../../models/propertytypes.model.js";
import PropertyMedia from "../../../models/propertymedia.model.js";
import Statuses from "../../../models/statuses.model.js";
import Leads from "../../../models/leads.model.js"
import { Op } from "sequelize";
import UserAuth from "../../../models/userauth.model.js";
import bcrypt from "bcrypt"; // Use bcryptjs for better compatibility
import { uploadOnCloudinary } from "../../../utils/Cloudinary.utils.js";
import { Sequelize } from "sequelize";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js";
import dayjs from "dayjs";
import { sendNotification } from "../../../utils/sendNotification.utils.js";
import { getLoggedInUserRole } from "../../../utils/LoggedInUser.utils.js";


export const GetAllEmployees = asyncHandler(async (req, res, next) => {
  try {
    // Extract `role` query parameter (optional)
    const { role } = req.query;

    // Define filter object to exclude Admin
    const whereCondition = {
      role: role ? role : { [Op.ne]: "Admin" }, // Exclude "Admin" if no role filter is provided
    };

    // Fetch employees based on filter
    const employees = await Employee.findAll({ where: whereCondition });

    // Check if employees exist
    if (!employees || employees.length === 0) {
      return next(new ApiError(404, "No employees found."));
    }

    // Send response
    res.status(200).json(new ApiResponse(200, employees, "Employees retrieved successfully."));
  } catch (err) {
    console.error("Error fetching employees:", err);
    next(new ApiError(500, "Something went wrong while fetching employees."));
  }
});

export const GetEmployeebyId = asyncHandler(async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    res.json(new ApiResponse(200, employee, "Success"))
  } catch (err) {
    console.error("Error fetching employee by id:", err)
    next(new ApiError(500, "something went wrong while fetching employee by id"))
  }
});

export const CreateEmployee = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role, department, designation, phone, address, dob, doj, salary, profilePic } = req.body;
    // Check if the email already exists
    const employee = await Employee.findOne({ where: { email } });
    if (employee) {
      return next(new ApiError(400, "Employee with this email already exists."));
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the employee
    const newEmployee = await Employee.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      designation,
      phone,
      address,
      dob,
      doj,
      salary,
      profilePic,
    });
    // Send the response
    res.json(new ApiResponse(201, newEmployee, "Employee created successfully."));
  } catch (err) {
    console.error("Error creating employee:", err);
    next(new ApiError(500, "Something went wrong while creating employee."));
  }
});

export const UpdateEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the employee by ID
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return next(new ApiError(404, "Employee not found."));
    }

    // Extract request body
    const { first_name, last_name, email, phone, role, manager_id } = req.body;

    // If updating email, ensure it's not already taken
    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ where: { email } });
      if (existingEmployee) {
        return next(new ApiError(400, "Email is already in use."));
      }
    }

    let avatar = employee.profile_picture; // Keep existing profile picture by default

    // ✅ Check if file was uploaded before accessing it
    if (req.files && req.files.profile_picture && req.files.profile_picture.length > 0) {
      const profilePicPath = req.files.profile_picture[0].path;
      console.log("profilePicPath", profilePicPath)
      avatar = await uploadOnCloudinary(profilePicPath);
    }

    // Update employee details
    await employee.update({
      first_name: first_name ?? employee.first_name,
      last_name: last_name ?? employee.last_name,
      email: email ?? employee.email,
      phone: phone ?? employee.phone,
      role: role ?? employee.role,
      profile_picture: avatar.secure_url, // Keep existing if no new one is uploaded
      manager_id: manager_id ?? employee.manager_id,
    });

    // Send success response
    res.json(new ApiResponse(200, employee, "Employee updated successfully."));
  } catch (err) {
    console.error("Error updating employee:", err);
    next(new ApiError(500, "Something went wrong while updating the employee."));
  }
});

export const DeleteEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return next(new ApiError(404, "Employee not found."));
    }
    await employee.destroy();
    res.json(new ApiResponse(200, null, "Employee deleted successfully."));
  } catch (err) {
    console.error("Error deleting employee:", err);
    next(new ApiError(500, "Something went wrong while deleting the employee."));
  }
});

export const SearchEmployee = asyncHandler(async (req, res, next) => {
  try {
    const { name } = req.query;
    const employees = await Employee.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            first_name: {
              [Sequelize.Op.like]: `%${name}%`,
            },
          },
          {
            last_name: {
              [Sequelize.Op.like]: `%${name}%`,
            },
          },
        ],
      },
    });
    res.json(new ApiResponse(200, employees, "Success"));
  } catch (err) {
    console.error("Error searching employees:", err);
    next(new ApiError(500, "Something went wrong while searching employees."));
  }
});

export const assignAgentToManager = asyncHandler(async (req, res, next) => {
  try {
    const { agent_ids, manager_id } = req.body;

    // Validate input
    if (!Array.isArray(agent_ids) || agent_ids.length === 0) {
      return next(new ApiError(400, "agent_ids must be a non-empty array"));
    }
    if (!manager_id) {
      return next(new ApiError(400, "manager_id is required"));
    }

    // Ensure all agent_ids are valid (not undefined, null, or non-numeric)
    const validAgentIds = agent_ids.filter(id => id !== undefined && id !== null && !isNaN(id));
    if (validAgentIds.length !== agent_ids.length) {
      const invalidIds = agent_ids.filter(id => !validAgentIds.includes(id));
      return next(new ApiError(400, `Invalid agent_ids provided: ${invalidIds.join(', ')}`));
    }

    // Get the user ID from the request (from `verifyJWT` middleware)
    const loggedInUserId = req.user.user_id;
    if (!loggedInUserId) {
      return next(new ApiError(401, "User not authenticated"));
    }

    // Step 1: Retrieve the `employee_id` from the `user_id` table
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
      return next(new ApiError(404, "Employee not found in Employee records."));
    }

    // Ensure only Admins can assign agents
    if (loggedInEmployee.role !== "Admin") {
      return next(new ApiError(403, "You are not authorized to perform this action."));
    }

    // Validate manager
    const manager = await Employee.findOne({
      where: { employee_id: manager_id },
      attributes: ["employee_id", "first_name", "role"],
    });

    if (!manager || manager.role !== "Manager") {
      return next(new ApiError(404, "Manager not found or invalid role."));
    }

    // Validate and process all agents
    const agents = await Employee.findAll({
      where: { 
        employee_id: validAgentIds, // Use filtered valid IDs
        role: "Sales Agent"
      },
      attributes: ["employee_id", "first_name", "role", "manager_id"],
    });

    // Check if all requested agents were found and are valid
    if (agents.length !== validAgentIds.length) {
      const foundAgentIds = agents.map(agent => agent.employee_id);
      const missingAgentIds = validAgentIds.filter(id => !foundAgentIds.includes(id));
      return next(new ApiError(404, `Some agents not found or not Sales Agents: ${missingAgentIds.join(', ')}`));
    }

    // Check for agents already assigned to this manager
    const alreadyAssigned = agents.filter(agent => agent.manager_id === manager_id);
    if (alreadyAssigned.length > 0) {
      const alreadyAssignedIds = alreadyAssigned.map(agent => agent.employee_id);
      return next(new ApiError(400, `Agents already assigned to this manager: ${alreadyAssignedIds.join(', ')}`));
    }

    // Update all agents to be assigned to the manager
    await Employee.update(
      { manager_id },
      { where: { employee_id: validAgentIds } }
    );

    // Send notification to the manager
    const agentNames = agents.map(agent => agent.first_name).join(', ');
    await sendNotification({
      recipientUserId: manager_id,
      senderId: loggedInEmployeeId,
      entityType: "Employee",
      entityId: validAgentIds[0],
      notificationType: "Assignment",
      title: "New Agent Assignment",
      message: `You have been assigned new Sales Agents: ${agentNames}`,
    });

    // Success response with details of assigned agents
    const assignedAgents = agents.map(agent => ({
      agent_id: agent.employee_id,
      agent_name: agent.first_name,
    }));

    res.json(
      new ApiResponse(
        200,
        {
          assigned_agents: assignedAgents,
          manager_id: manager.employee_id,
          manager_name: manager.first_name,
          assigned_by_admin_id: loggedInEmployee.employee_id,
          assigned_by_admin_name: loggedInEmployee.first_name,
        },
        "Sales agents assigned to the manager successfully."
      )
    );
  } catch (err) {
    console.error("Error assigning agents:", err);
    next(new ApiError(500, "Something went wrong while assigning the agents."));
  }
});

export const GetEmployeeByManager = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params; // Change manager_id to id

    // Find the manager
    const manager = await Employee.findByPk(id);
    if (!manager || manager.role !== "Manager") {
      return next(new ApiError(404, "Manager not found."));
    }

    // Find all agents assigned to this manager
    const agents = await Employee.findAll({
      where: { manager_id: id },
      attributes: ["employee_id", "first_name", "last_name", "profile_picture", "phone", "role"],
    });

    // Send the response
    res.json(new ApiResponse(200, agents, "Success"));
  } catch (err) {
    console.error("Error fetching agents by manager:", err);
    next(new ApiError(500, "Something went wrong while fetching agents by manager."));
  }
});

// Get employee details along with attendance records and count of present/absent days
export const getEmployeeWithAttendance = asyncHandler(async (req, res, next) => {
  try {
    const { id: employee_id } = req.params; // Extract employee ID from route
    let { month } = req.query; // Get month from query params

    // If month is not provided, use the current month
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      month = dayjs().format("YYYY-MM");
    }

    // Convert month to start and end date range
    const startDate = dayjs(`${month}-01`).startOf("month").toDate();
    const endDate = dayjs(startDate).endOf("month").toDate();

    // Validate employee existence
    const employee = await Employee.findByPk(employee_id, {
      attributes: [
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "profile_picture",
        "role",
        "hire_date",
        "manager_id",
        "is_active"
      ]
    });

    if (!employee) {
      return next(new ApiError(404, "Employee not found."));
    }

    // Fetch attendance records for the given month
    const attendanceRecords = await Attendance.findAll({
      where: {
        employee_id,
        attendance_date: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        "attendance_id",
        "attendance_date",
        "check_in",
        "check_out",
        "hours_worked",
        "status",
        "notes",
      ],
      order: [["attendance_date", "ASC"]],
    });

    // Check if records exist for the provided month
    const presentDays = attendanceRecords.length > 0
      ? attendanceRecords.filter(att => att.status === "Present" || att.status === "Late").length
      : 0;

    const absentDays = attendanceRecords.length > 0
      ? attendanceRecords.filter(att => att.status === "Absent").length
      : 0;
    const LateDays = attendanceRecords.length > 0
      ? attendanceRecords.filter(att => att.status === "Late").length
      : 0;

    let responseData = {
      employee,
      presentDays,
      absentDays,
      LateDays,
      attendanceRecords
    };

    // Only include properties and soldCount if the employee is a Sales Agent
    if (employee.role === "Sales Agent") {
      const properties = await Properties.findAll({
        where: { listed_by: employee_id },
        include: [
          { model: PropertyType, as: "propertyType", attributes: ["type_name"] },
          { model: Statuses, as: "status", attributes: ["status_name"] },
        ],
        attributes: ["property_id", "title", "address", "city", "state", "price", "bedrooms", "bathrooms"]
      });

      // Count properties marked as 'Sold'
      const soldCount = await Properties.count({
        where: { listed_by: employee_id },
        include: [{ model: Statuses, as: "status", where: { status_name: "Sold" } }]
      });

      responseData.properties = properties;
      responseData.soldCount = soldCount;
    }

    res.json(new ApiResponse(200, responseData, "Success"));
  } catch (err) {
    console.error("Error fetching attendance records:", err);
    next(new ApiError(500, "Something went wrong while fetching attendance records."));
  }
});

export const GetTeamByManagers = asyncHandler(async (req, res, next) => {
  try {
    // Fetch all managers
    const managers = await Employee.findAll({
      where: { role: "Manager" },
      attributes: ["employee_id", "first_name", "last_name", "profile_picture", "phone", "role"],
    });

    if (!managers || managers.length === 0) {
      return next(new ApiError(404, "No managers found."));
    }

    // Extract manager IDs
    const managerIds = managers.map(manager => manager.employee_id);

    // Fetch all agents (employees assigned to these managers)
    const agents = await Employee.findAll({
      where: { manager_id: managerIds },
      attributes: ["employee_id", "first_name", "last_name", "profile_picture", "phone", "role", "manager_id"],
    });

    // Structure response: Add agents under their respective manager
    const response = managers.map(manager => ({
      ...manager.toJSON(),
      agents: agents.filter(agent => agent.manager_id === manager.employee_id),
    }));

    res.json(new ApiResponse(200, response, "Success"));
  } catch (err) {
    console.error("Error fetching employees by managers:", err);
    next(new ApiError(500, "Something went wrong while fetching employees by managers."));
  }
});


export const GetTeamDetailsByManager = asyncHandler(async (req, res, next) => {
  try {
    const { manager_id } = req.params;

    // Validate manager_id
    if (!manager_id || isNaN(manager_id)) {
      return next(new ApiError(400, "Invalid manager ID."));
    }

    // Fetch employees under the given manager
    const employees = await Employee.findAll({
      where: { manager_id, is_active: true },
      attributes: ["employee_id", "first_name", "last_name", "email", "phone", "profile_picture", "role"]
    });

    if (!employees || employees.length === 0) {
      return next(new ApiError(404, "No employees found under this manager."));
    }

    // Extract employee IDs
    const employeeIds = employees.map(emp => emp.employee_id);

    // Fetch properties listed by those employees
    const properties = await Properties.findAll({
      where: { assign_to: employeeIds },
      include: [
        {
          model: PropertyType,
          as: "propertyType",
          attributes: ["property_type_id", "type_name"]
        },
        {
          model: PropertyMedia,
          as: "propertyMedia",
          attributes: ["media_type", "file_url"]
        },
      ],
    });

    // Fetch leads assigned to those employees
    const leads = await Leads.findAll({
      where: { assigned_to_fk: employeeIds },
      attributes: ["lead_id", "first_name", "last_name", "email", "phone", "budget_min", "budget_max", "status_id_fk", "assigned_to_fk"]
    });

    // Construct response
    return res.status(200).json(new ApiResponse(200, {
      employees,
      properties,
      leads
    }, "Employees, properties, and leads retrieved successfully."));
  } catch (error) {
    console.error("Error fetching employees details:", error);
    return next(new ApiError(500, "Something went wrong while fetching employee details."));
  }
});

export const GetUnassignedEmployees = asyncHandler(async (req, res, next) => {
  try {
    // Fetch employees without a manager, excluding admins
    const employees = await Employee.findAll({
      where: { manager_id: null, role: { [Op.not]: "Admin" } }, // Exclude admins
      attributes: ["employee_id", "first_name", "last_name", "profile_picture", "phone", "role"],
    });

    if (!employees || employees.length === 0) {
      return next(new ApiError(404, "No unassigned employees found."));
    }

    // Group employees by role
    const groupedEmployees = employees.reduce((acc, employee) => {
      const { role } = employee;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(employee);
      return acc;
    }, {});

    res.json(new ApiResponse(200, groupedEmployees, "Success"));
  } catch (err) {
    console.error("Error fetching unassigned employees:", err);
    next(new ApiError(500, "Something went wrong while fetching unassigned employees."));
  }
});

export const GetUnassignedLeads = asyncHandler(async (req, res, next) => {
  try {
    const leads = await Leads.findAll({
      where: { assigned_to_fk: null },
      attributes: ["lead_id", "first_name", "last_name", "email", "phone", "budget_min", "budget_max", "status_id_fk"],
    });

    if (!leads || leads.length === 0) {
      return next(new ApiError(404, "No unassigned leads found."));
    }

    res.json(new ApiResponse(200, leads, "Success"));
  } catch (err) {
    console.error("Error fetching unassigned leads:", err);
    next(new ApiError(500, "Something went wrong while fetching unassigned leads."));
  }
});

export const GetUnassignedProperties = asyncHandler(async (req, res, next) => {
  try {
    const properties = await Properties.findAll({
      where: { assign_to: null },
      include: [
        { model: PropertyType, as: "propertyType", attributes: ["type_name"] },
        { model: PropertyMedia, as: "propertyMedia", attributes: ["media_type", "file_url"] },
      ],
      attributes: ["property_id", "title", "address", "city", "state", "price", "bedrooms", "bathrooms"],
    });

    if (!properties || properties.length === 0) {
      return next(new ApiError(404, "No unassigned properties found."));
    }

    res.json(new ApiResponse(200, properties, "Success"));
  } catch (err) {
    console.error("Error fetching unassigned properties:", err);
    next(new ApiError(500, "Something went wrong while fetching unassigned properties."));
  }
}
);

// Block Employee API
export const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  try {
    const { employee_id } = req.params; // Using path params
    const { admin_id, role } = await getLoggedInUserRole(req.user?.user_id); // Assuming this function exists

    if (employee_id === admin_id) {
      return res.status(400).json(new ApiResponse(400, null, "Admins cannot block themselves"));
    }
    // Check if the requester is an admin
    if (role !== "Admin") {
      return res.status(403).json(new ApiResponse(403, null, "Only admins can modify employee status"));
    }

    // Find the employee
    const employee = await Employee.findOne({ where: { employee_id } });
    if (!employee) {
      return res.status(404).json(new ApiResponse(404, null, "Employee not found"));
    }

    // Toggle logic based on current is_active status
    if (employee.is_active) {
      // Employee is active, so block them
      // Check if the employee is a manager or sales agent (only for blocking)
      if (!["Manager", "Sales Agent"].includes(employee.role)) {
        return res.status(400).json(new ApiResponse(400, null, "Can only block managers or sales agents"));
      }
      await Employee.update({ is_active: false }, { where: { employee_id } });
      return res.status(200).json(new ApiResponse(200, { employee_id }, "Employee blocked successfully"));
    } else {
      // Employee is inactive, so unblock them
      await Employee.update({ is_active: true }, { where: { employee_id } });
      return res.status(200).json(new ApiResponse(200, { employee_id }, "Employee unblocked successfully"));
    }
  } catch (error) {
    console.error(`Error toggling employee status:`, error);
    return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

export const GetInactiveEmployees = asyncHandler(async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { is_active: false },
      attributes: ["employee_id", "first_name", "last_name", "email", "phone", "role", "is_active"],
    });

    res.json(new ApiResponse(200, employees, "Inactive employee records retrieved successfully."));
  } catch (err) {
    console.error("Error fetching inactive employees:", err);
    next(new ApiError(500, "Something went wrong while fetching inactive employees."));
  }
});