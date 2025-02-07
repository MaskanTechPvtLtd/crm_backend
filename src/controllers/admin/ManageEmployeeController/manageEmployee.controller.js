import Employee from "../../../models/employee.model.js";
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