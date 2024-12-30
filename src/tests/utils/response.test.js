const { successResponse, errorResponse } = require("../../utils/response");

describe("Response Utility Functions", () => {
  describe("successResponse", () => {
    it("should return a success response with the correct structure", () => {
      const body = { message: "Operation successful", data: { id: 1 } };
      const result = successResponse(body);

      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should handle an empty body gracefully", () => {
      const result = successResponse({});
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });

  describe("errorResponse", () => {
    it("should return an error response with the correct structure", () => {
      const statusCode = 400;
      const message = "Invalid request";
      const result = errorResponse(statusCode, message);

      expect(result).toEqual({
        statusCode,
        body: JSON.stringify({ error: message }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should handle an empty message gracefully", () => {
      const statusCode = 500;
      const message = "";
      const result = errorResponse(statusCode, message);

      expect(result).toEqual({
        statusCode,
        body: JSON.stringify({ error: "" }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });
});
