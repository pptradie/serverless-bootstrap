"use strict";

const { getDealById } = require("../../db/repository/deal.repository");
const { successResponse, errorResponse } = require("../../utils/response");

module.exports.handler = async (event) => {
  const dealId =
    event.queryStringParameters && event.queryStringParameters.deal_id;

  if (!dealId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required parameter: deal_id" }),
    };
  }

  // Validate deal_id format
  if (!/^\d+$/.test(dealId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid deal_id format" }),
    };
  }

  try {
    const deal = await getDealById(dealId);

    if (!deal) {
      return errorResponse(404, "Deal not found");
    }

    return successResponse({ message: "success", data: deal });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return errorResponse(500, "Internal Server Error");
  }
};
