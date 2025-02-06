import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../constants.js";
import UserAuth from "../models/userauth.model.js";

// Authentication middleware for verifying the user JWT token
export const verifyJWT = asyncHandler(async (req, res, next) => {
  let token = await req?.header("Authorization")?.replace("Bearer ", "");
  // console.log("this is the access token : ", token);
  try {
    // 1. Try to get the token from cookies or Authorization header
    const token =
      req?.cookies?.accessToken ||
      req?.header("Authorization")?.replace("Bearer ", "");

    // If token is not found, send an error response
    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    // 2. Decode and verify the token
    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    // console.log("this is the decoded : ", decodedToken);
    // console.log("this is the decoded user id : ", decodedToken?.user_id);
    // Ensure the decoded token has the required 'id' field (for user verification)
    if (!decodedToken?.user_id) {
      throw new ApiError(401, "Unauthorized request: Invalid token structure");
    }

    // 3. Find the user using the decoded token ID
    const user = await UserAuth.findOne({ where: { user_id: decodedToken.user_id } });
    if (!user) throw new ApiError(401, "User not found.");
    // If the user is not found, throw an error
    if (!user) {
      throw new ApiError(401, "Invalid access token: user not found");
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

