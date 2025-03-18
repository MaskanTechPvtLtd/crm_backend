import UserAuth from "../../../models/userauth.model.js";
import Employee from "../../../models/employee.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // Use bcryptjs for better compatibility
import { Sequelize } from "sequelize";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import { sendEmail } from '../../../utils/emailService.utils.js'; // Adjust path as needed
import crypto from 'crypto';
import {
  validateEmail,
  validateMobile,
  validatePassword,
} from "../../../utils/validation.utils.js";
import { getVerificationEmailTemplate, getForgotPasswordTemplate } from "../../../constants.js";

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

// Function to generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

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

  // Generate OTP and expiry
  const otp = generateOTP();
  const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create employee record with unverified status
  const newEmployee = await Employee.create({
    first_name,
    last_name,
    role,
    phone,
    email,
    isVerified: false, // Ensure this field exists in your Employee model
  });

  const newUser = await UserAuth.create({
    employee_id: newEmployee.employee_id,
    username,
    password_hash: hashedPassword,
    otp,
    otpExpiry,
  });

  // Prepare email content
  const subject = 'Email Verification OTP';
  const text = `Your OTP for email verification is: ${otp}. It will expire in 15 minutes.`;
  const html = getVerificationEmailTemplate(otp); // Get HTML with OTP inserted

  try {
    // Use your sendEmail function
    await sendEmail(email, subject, text, html);

    return res
      .status(201)
      .json(
        createResponse(
          201,
          { employee_id: newEmployee.employee_id, email },
          "Registration successful. Please verify your email with the OTP sent."
        )
      );
  } catch (error) {
    // Cleanup on email sending failure
    await newUser.destroy();
    await newEmployee.destroy();
    throw new ApiError(500, "Failed to send verification email");
  }
});

// Endpoint to verify OTP
export const verifyEmail = asyncHandler(async (req, res) => {
  const { employee_id, otp } = req.body;

  const user = await UserAuth.findOne({
    where: { employee_id },
    include: [{ model: Employee }]
  });

  if (!user) throw new ApiError(404, "User not found");
  if (!user.Employee) throw new ApiError(400, "Employee record not found"); // ✅ Handle missing Employee

  if (user.Employee.isVerified) throw new ApiError(400, "Email already verified");
  if (Date.now() > user.otpExpiry) throw new ApiError(400, "OTP expired");
  if (user.otp !== otp) throw new ApiError(400, "Invalid OTP");

  // Update verification status
  await Employee.update(
    { isVerified: true },
    { where: { employee_id } }
  );

  // Clear OTP fields
  await UserAuth.update(
    { otp: null, otpExpiry: null },
    { where: { employee_id } }
  );

  // Generate JWT token
  const token = jwt.sign(
    { user_id: user.user_id, username: user.username, role: user.Employee.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "7d" }
  );

  return res
    .status(200)
    .json(
      createResponse(
        200,
        { ...formatEmployeeResponse(user.Employee), token },
        "Email verified successfully"
      )
    );
});


export const resendOTP = asyncHandler(async (req, res) => {
  const { employee_id } = req.body;

  const user = await UserAuth.findOne({
    where: { employee_id },
    include: [{ model: Employee }]
  });

  if (!user) throw new ApiError(404, "User not found");
  if (user.Employee.isVerified) throw new ApiError(400, "Email already verified");

  // Check if last OTP was sent less than 2 minutes ago
  const timeSinceLastOTP = Date.now() - (user.otpExpiry - (15 * 60 * 1000));
  if (timeSinceLastOTP < 2 * 60 * 1000) {
    throw new ApiError(429, "Please wait 2 minutes before requesting a new OTP");
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiry = Date.now() + 15 * 60 * 1000;

  // Update user with new OTP
  await UserAuth.update(
    { otp, otpExpiry },
    { where: { employee_id } }
  );

  // Send email
  const subject = 'New Email Verification OTP';
  const text = `Your new OTP for email verification is: ${otp}. It will expire in 15 minutes.`;
  const html = getVerificationEmailTemplate(otp); // Get HTML with OTP inserted


  await sendEmail(user.Employee.email, subject, text, html);

  return res
    .status(200)
    .json(
      createResponse(
        200,
        { employee_id },
        "New OTP sent successfully"
      )
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

// 1. Forgot Password Request
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!validateEmail(email)) throw new ApiError(400, "Invalid email");

  const employee = await Employee.findOne({ where: { email } });
  if (!employee) throw new ApiError(404, "No user found with this email");

  const user = await UserAuth.findOne({ where: { employee_id: employee.employee_id } });
  if (!user) throw new ApiError(404, "User authentication data not found");

  // Generate OTP and expiry
  const otp = generateOTP();
  const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

  // Update user with OTP
  await UserAuth.update(
    { otp, otpExpiry },
    { where: { employee_id: employee.employee_id } }
  );

  // Prepare email content
  const subject = 'Password Reset OTP';
  const text = `Your OTP for password reset is: ${otp}. It will expire in 15 minutes.`;
  const html = getForgotPasswordTemplate({
    otp,
    heading: 'Password Reset OTP',
    companyName: 'Your Company Name',
    supportEmail: 'support@yourcompany.com',
    website: 'https://yourcompany.com',
    email,
  });

  try {
    await sendEmail(email, subject, text, html);
    return res
      .status(200)
      .json(
        createResponse(
          200,
          { employee_id: employee.employee_id, email },
          "Password reset OTP sent successfully. Please check your email."
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to send password reset email");
  }
});

// 2. Verify OTP for Password Reset
export const verifyResetOTP = asyncHandler(async (req, res) => {
  const { employee_id, otp } = req.body;

  const user = await UserAuth.findOne({
    where: { employee_id },
    include: [{ model: Employee }]
  });

  if (!user) throw new ApiError(404, "User not found");
  if (Date.now() > user.otpExpiry) throw new ApiError(400, "OTP expired");
  if (user.otp !== otp) throw new ApiError(400, "Invalid OTP");

  // Generate a reset token (optional, for additional security)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  // Store reset token and clear OTP
  await UserAuth.update(
    {
      otp: null,
      otpExpiry: null,
      resetToken,
      resetTokenExpiry
    },
    { where: { employee_id } }
  );

  return res
    .status(200)
    .json(
      createResponse(
        200,
        { employee_id, resetToken },
        "OTP verified successfully. You can now reset your password."
      )
    );
});

// 3. Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const { employee_id, resetToken, newPassword } = req.body;

  if (!validatePassword(newPassword)) throw new ApiError(400, "Weak password");

  const user = await UserAuth.findOne({ where: { employee_id } });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.resetToken || user.resetToken !== resetToken) throw new ApiError(400, "Invalid reset token");
  if (Date.now() > user.resetTokenExpiry) throw new ApiError(400, "Reset token expired");

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await UserAuth.update(
    {
      password_hash: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    },
    { where: { employee_id } }
  );

  return res
    .status(200)
    .json(
      createResponse(
        200,
        { employee_id },
        "Password reset successfully"
      )
    );
});