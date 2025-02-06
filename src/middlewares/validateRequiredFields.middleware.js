import { ApiError } from "../utils/ApiError.utils.js";

// Middleware to validate required fields
export const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(
      (field) =>
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
    );

    if (missingFields.length > 0) {
      throw new ApiError(
        400,
        "Validation Error",
        missingFields.map((field) => `${field} is required and cannot be empty`)
      );
    }

    next();
  };
};
