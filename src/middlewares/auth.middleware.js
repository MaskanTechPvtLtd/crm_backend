import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../constants.js";
import UserAuth from "../models/userauth.model.js";

// Authentication middleware for verifying the user JWT token
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Get the token from cookies or Authorization header
    const tokenFromCookies = req?.cookies?.accessToken;
    const authHeader = req?.header("Authorization");

    // Extract token: prioritize cookies, then header
    let token = tokenFromCookies;
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }

    // If no token is found, throw an error
    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    // 2. Decode and verify the token
    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);

    // Ensure the decoded token has the required 'user_id' field
    if (!decodedToken?.user_id) {
      throw new ApiError(401, "Unauthorized request: Invalid token structure");
    }

    // 3. Find the user using the decoded token ID
    const user = await UserAuth.findOne({ where: { user_id: decodedToken.user_id } });

    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    // 4. Attach the user data to the request object
    req.user = user;

    // 5. Continue to the next middleware
    next();
  } catch (err) {
    // 6. Catch errors and handle them accordingly
    throw new ApiError(401, err?.message || "Invalid access token");
  }
});