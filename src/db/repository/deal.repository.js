const { models } = require("../../db");

async function getDealById(id) {
  try {
    const deal = await models.deal.findByPk(id);

    if (!deal) {
      return null;
    }

    return deal;
  } catch (error) {
    console.error("Error fetching deal details:", error);
    throw error;
  }
}
async function createDeal(params) {
  const fields = [
    "client_id",
    "handling_by",
    "status",
    "is_successful",
    "created_by",
    "updated_by",
  ];

  const data = {};

  fields.forEach((field) => {
    if (params[field]) {
      data[field] = params[field];
    }
  });

  data.status = data.status ? data.status : "pending";

  return await models.deal.create(data);
}

async function updateDeal(id, params) {
  try {
    // Fetch the existing deal
    const deal = await models.deal.findByPk(id);

    if (!deal) {
      // Deal not found
      return null;
    }

    // Define the fields that can be updated
    const updatableFields = [
      "client_id",
      "handling_by",
      "status",
      "is_successful",
      "updated_by",
    ];

    // Update only the allowed fields
    updatableFields.forEach((field) => {
      if (params[field] !== undefined) {
        deal[field] = params[field];
      }
    });

    // Save the updated deal to the database
    await deal.save();

    return deal;
  } catch (error) {
    console.error("Error updating deal:", error);
    throw error;
  }
}

module.exports = {
  getDealById,
  createDeal,
  updateDeal,
};
