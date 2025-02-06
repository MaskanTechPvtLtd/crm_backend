import State from "../../../models/admin/locationModel/state.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";

export const getStatesByCountry = asyncHandler(async (req, res) => {
  const { countryId } = req.params;

  // Validate countryId
  if (!countryId || isNaN(Number(countryId))) {
    throw new ApiError(400, "Invalid country ID provided");
  }

  const states = await State.findAll({
    where: { country_id: countryId },
    attributes: ["id", "state", "state_code"],
    order: [["state", "ASC"]],
  });

  if (!states || states.length === 0) {
    throw new ApiError(404, "No states found for this country");
  }

  res.status(200).json({
    success: true,
    data: states,
  });
});
