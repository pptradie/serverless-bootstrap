"use strict";

const {
  createDeal,
  updateDeal,
} = require("../../db/repository/deal.repository");
const { successResponse, errorResponse } = require("../../utils/response");
const {
  createDealSchema,
  updateDealSchema,
} = require("../../validation/dealValidation");

/**
 * Lambda handler to create or update a deal.
 * @param {Object} event - The Lambda event object.
 * @returns {Object} The HTTP response object.
 */
module.exports.handler = async (event) => {
  try {
    // Parse the request body
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Invalid JSON format:", parseError);
      return errorResponse(400, "Invalid JSON format");
    }

    let validatedData;
    let deal;

    if (data.id) {
      // Validate input for updating a deal
      validatedData = await updateDealSchema.validate(data, {
        abortEarly: false,
      });

      // Update existing deal
      deal = await updateDeal(validatedData.id, validatedData);

      if (!deal) {
        return errorResponse(404, "Deal not found");
      }
    } else {
      // Validate input for creating a new deal
      validatedData = await createDealSchema.validate(data, {
        abortEarly: false,
      });

      // Create new deal
      deal = await createDeal(validatedData);
    }

    return successResponse({
      message: "success",
      data: deal,
    });
  } catch (error) {
    console.error("Error in dealSave handler:", error);
    return errorResponse(500, "Internal Server Error");
  }
};
