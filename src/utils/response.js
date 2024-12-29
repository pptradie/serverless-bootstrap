"use strict";

module.exports.successResponse = (body) => ({
  statusCode: 200,
  body: JSON.stringify(body),
  headers: {
    "Content-Type": "application/json",
  },
});

module.exports.errorResponse = (statusCode, message) => ({
  statusCode,
  body: JSON.stringify({ error: message }),
  headers: {
    "Content-Type": "application/json",
  },
});
