import { query, validationResult } from 'express-validator';

/**
 * Middleware to validate and sanitize query parameters
 */
const validateAndSanitize = [
  // Validate and sanitize 'page' query parameter
  query('page')
    .optional()
    .trim()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer greater than 0')
    .toInt(),

  // Validate and sanitize 'limit' query parameter
  query('limit')
    .optional()
    .trim()
    .isInt({ min: 1, max: 30 })
    .withMessage('Limit must be an integer between 1 and 30')
    .toInt(),

  // Middleware to check for validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails,
      });
    }
    next();
  },
];

export default validateAndSanitize;

/**
 * Middleware to validate and sanitize query parameters for the API.
 *
 * Validates the following query parameters:
 * - 'page': Ensures it is a positive integer greater than 0.
 * - 'limit': Ensures it is an integer between 1 and 100.
 *
 * Sanitizes inputs by:
 * - Trimming whitespace.
 * - Converting valid inputs to integers.
 *
 * On validation failure:
 * - Returns a 400 Bad Request response with structured error details.
 *
 * On success:
 * - Proceeds to the next middleware or route handler with sanitized query parameters.
 */
