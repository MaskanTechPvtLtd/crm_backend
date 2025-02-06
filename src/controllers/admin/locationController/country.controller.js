import Country from "../../../models/admin/locationModel/country.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";

// Get all countries
export const getAllCountries = asyncHandler(async (req, res) => {
  // Fetch countries from the database
  const countries = await Country.findAll({
    attributes: ["id", "country", "country_code"], // Fetch only necessary columns
    order: [["country", "ASC"]], // Sort alphabetically by country name
  });

  // Check if no countries were found
  if (!countries || countries.length === 0) {
    throw new ApiError(404, "No countries found");
  }

  // Return success response with the list of countries
  res.status(200).json({
    success: true,
    data: countries,
  });
});
