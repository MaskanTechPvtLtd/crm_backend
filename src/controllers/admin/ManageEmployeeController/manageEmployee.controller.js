import Employee from "../../../models/employee.model.js";
import UserAuth from "../../../models/userauth.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // Use bcryptjs for better compatibility
import { uploadOnCloudinary } from "../../../utils/cloudinary.utils.js";
import { Sequelize } from "sequelize";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js"


export const GetAllEmployees = asyncHandler(async (req, res,) => {
    try {
        // Fetch all employees from the database
        const AllEmployee = await Employee.findAll();
        // Send the response
        res.json(new ApiResponse(200, AllEmployee, "Success"));
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
})

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
            console.log("profilePicPath",profilePicPath)
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
      const { agent_id, manager_id } = req.body;
  
      // Get the user ID from the request (from `verifyJWT` middleware)
      const loggedInUserId = req.user.user_id; // Ensure `req.user` contains `user_id`
  
      // Step 1: Retrieve the `employee_id` from the `user_id` table
      const userRecord = await UserAuth.findOne({
        where: { user_id: loggedInUserId },
        attributes: ["employee_id"], // Only fetch the `employee_id`
      });
  
      if (!userRecord || !userRecord.employee_id) {
        return next(new ApiError(404, "Employee record not found for this user."));
      }
  
      const loggedInEmployeeId = userRecord.employee_id;
  
      // Step 2: Find the logged-in employee (Admin) in the Employee table
      const loggedInEmployee = await Employee.findOne({
        where: { employee_id: loggedInEmployeeId },
        attributes: ["employee_id", "first_name", "role"], // Fetching `name`
      });
  
      if (!loggedInEmployee) {
        return next(new ApiError(404, "Employee not found in Employee records."));
      }
  
      // Ensure only Admins can assign an agent to a manager
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
  
      // Validate agent
      const agent = await Employee.findOne({
        where: { employee_id: agent_id },
        attributes: ["employee_id", "first_name", "role", "manager_id"],
      });
  
      if (!agent || agent.role !== "Sales Agent") {
        return next(new ApiError(404, "Agent not found or invalid role."));
      }
  
      // Check if the agent is already assigned to this manager
      if (agent.manager_id === manager_id) {
        return next(new ApiError(400, "Agent is already assigned to this manager."));
      }
  
      // Assign the agent to the manager
      await agent.update({ manager_id });
  
      // Success response including agent, manager, and admin names
      res.json(
        new ApiResponse(
          200,
          {
            agent_id: agent.employee_id,
            agent_name: agent.first_name,
            manager_id: manager.employee_id,
            manager_name: manager.first_name,
            assigned_by_admin_id: loggedInEmployee.employee_id,
            assigned_by_admin_name: loggedInEmployee.first_name,
          },
          "Sales agent assigned to the manager successfully."
        )
      );
    } catch (err) {
      console.error("Error assigning agent:", err);
      next(new ApiError(500, "Something went wrong while assigning the agent."));
    }
  });
  
  export const GetEmployeeByManager = asyncHandler(async (req, res, next) => {
    try {
      const { manager_id } = req.params;
  
      // Find the manager
      const manager = await Employee.findByPk(manager_id);
      if (!manager || manager.role !== "Manager") {
        return next(new ApiError(404, "Manager not found."));
      }
  
      // Find all agents assigned to this manager
      const agents = await Employee.findAll({
        where: { manager_id },
        attributes: ["employee_id", "first_name", "role"],
      });
  
      // Send the response
      res.json(new ApiResponse(200, agents, "Success"));
    } catch (err) {
      console.error("Error fetching agents by manager:", err);
      next(new ApiError(500, "Something went wrong while fetching agents by manager."));
    }
  }
  
);
