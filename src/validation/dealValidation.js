"use strict";

const yup = require("yup");

// Define the validation schema for creating a new deal
const createDealSchema = yup.object().shape({
  client_id: yup
    .number()
    .integer("Client ID must be an integer")
    .positive("Client ID must be a positive number")
    .required("Client ID is required"),
  handling_by: yup.string().trim().required("Handling By is required"),
  status: yup
    .string()
    .oneOf(
      ["pending", "completed", "cancelled"],
      "Status must be either pending, completed, or cancelled"
    )
    .required("Status is required"),
  is_successful: yup.boolean().nullable(),

  created_by: yup.string().trim().required("Created By is required"),
  updated_by: yup.string().trim().required("Updated By is required"),
});

// Define the validation schema for updating an existing deal
const updateDealSchema = yup.object().shape({
  id: yup
    .number()
    .integer("ID must be an integer")
    .positive("ID must be a positive number")
    .required("ID is required for updating a deal"),
  client_id: yup
    .number()
    .integer("Client ID must be an integer")
    .positive("Client ID must be a positive number"),

  handling_by: yup.string().trim(),
  status: yup
    .string()
    .oneOf(
      ["pending", "completed", "cancelled"],
      "Status must be either pending, completed, or cancelled"
    ),
  is_successful: yup.boolean().nullable(),
  updated_by: yup.string().trim().required("Updated By is required"),
});

module.exports = {
  createDealSchema,
  updateDealSchema,
};
