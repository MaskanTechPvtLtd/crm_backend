import UserAuth from "../../../models/userauth.model.js";
import Employee from "../../../models/employee.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // Use bcryptjs for better compatibility
import { uploadOnCloudinary } from "../../../utils/cloudinary.utils.js";
import { Sequelize } from "sequelize";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import {
  validateEmail,
  validateMobile,
  validatePassword,
} from "../../../utils/validation.utils.js";

// Utility function for consistent response formatting
const createResponse = (statusCode, data, message) => ({
  statusCode,
  data,
  message,
});

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    // Fetch the user from the database
    const user = await UserAuth.findOne({ where: { user_id: userId } });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken(Employee); // Assuming you have this method in the model
    const refreshToken = user.generateRefreshToken(); // Assuming you have this method in the model

    // Save the refresh token in the database
    await UserAuth.update(
      { refresh_token: refreshToken },
      { where: { user_id: userId } }
    );

    return { accessToken, refreshToken };
  } catch (err) {
    console.error("Error generating tokens:", err);
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens."
    );
  }
};


// Utility function to format employee data for responses
const formatEmployeeResponse = (employee) => ({
  employee_id: employee.employee_id,
  first_name: employee.first_name,
  last_name: employee.last_name,
  role: employee.role,
  phone: employee.phone,
  email: employee.email,
});

// Employee registration
export const register = asyncHandler(async (req, res) => {
  const {
    first_name,
    last_name,
    role,
    username,
    phone,
    email,
    password,
  } = req.body;

  // Input validations
  if (!validateEmail(email)) throw new ApiError(400, "Invalid email");
  if (!validateMobile(phone)) throw new ApiError(400, "Invalid mobile number");
  if (!validatePassword(password)) throw new ApiError(400, "Weak password");

  const existingEmployee = await Employee.findOne({
    where: { [Sequelize.Op.or]: [{ email }, { phone }] },
  });

  if (existingEmployee) throw new ApiError(400, "Employee already exists");

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin record
  const newEmployee = await Employee.create({
    first_name,
    last_name,
    role,
    phone,
    email,
  });

  const newUser = await UserAuth.create({
    employee_id: newEmployee.employee_id,
    username,
    password_hash: hashedPassword,
  });
  const token = jwt.sign(
    { user_id: newUser.user_id, username, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "7d" }
  );

  return res
    .status(201)
    .json(
      createResponse(201, { ...formatEmployeeResponse(newEmployee), token }, "Employee registered successfully")
    );
});

// Login API
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email, phone, or username

  if (!identifier || !password) throw new ApiError(400, "Email/Phone/Username and password are required");

  // Find user by email, phone, or username
  const user = await UserAuth.findOne({
    where: { username: identifier },
    include: [{ model: Employee, as: "Employee" }],
  }) || await UserAuth.findOne({
    where: {},
    include: [{
      model: Employee,
      as: "Employee",
      where: { [Sequelize.Op.or]: [{ email: identifier }, { phone: identifier }] },
    }],
  });

  if (!user) throw new ApiError(401, "Invalid credentials");

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  // Generate JWT Token

  const accessToken = user.generateAccessToken(Employee);
  const refreshToken = user.generateRefreshToken();

  await user.update({ refresh_token: refreshToken });
  await user.update({ last_login: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) });


  const options = {
    httpOnly: true,
    secure: true,
  };

  return res.status(200).cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options).json(
      createResponse(200, { accessToken, refreshToken, ...user.Employee.toJSON() }, "Login successful")
    );
});

//logout API
export const logout = asyncHandler(async (req, res) => {
  // console.log("Request User:", req.user); // Debugging line
  // Ensure req.user exists
  if (!req.user || !req.user.user_id) {
    throw new ApiError(401, "Unauthorized");
  }

  // Update the refresh token to null for the logged-in user
  await UserAuth.update(
    { refresh_token: null },  // Setting refreshToken to null
    { where: { user_id: req.user.user_id } } // Filtering by logged-in user
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      createResponse(200, {}, "User Logged Out successful")
    );
});

// Refresh token API
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  // const incomingRefreshToken = req.body.refreshToken;
  console.log("incomingRefreshToken :", incomingRefreshToken)
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    console.log("this is the decodede token : ", decodedToken?.user_id)

    const user = await UserAuth.findOne({ where: { user_id: decodedToken.user_id } });

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refresh_token) {
      throw new ApiError(401, "Refresh token is expires");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessTokenAndRefreshToken(user.user_id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        createResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "access token refreshed"
        )
      );
  } catch (err) {
    throw new ApiError(401, err?.message || "invalid refresh token")
  }
});