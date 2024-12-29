const { handler } = require("../../functions/deal/dealSave");
const {
  createDeal,
  updateDeal,
} = require("../../db/repository/deal.repository");
const { successResponse, errorResponse } = require("../../utils/response");
const {
  createDealSchema,
  updateDealSchema,
} = require("../../validation/dealValidation");

jest.mock("../../db/repository/deal.repository");
jest.mock("../../utils/response");
jest.mock("../../validation/dealValidation");

describe("dealSave Lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console.error
  });

  afterAll(() => {
    console.error.mockRestore(); // Restore console.error after tests
  });

  it("should return 400 for invalid JSON", async () => {
    const event = { body: "invalid-json" };
    errorResponse.mockReturnValue({
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON format" }),
    });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON format" }),
    });
    expect(errorResponse).toHaveBeenCalledWith(400, "Invalid JSON format");
  });

  it("should create a deal successfully", async () => {
    const event = {
      body: JSON.stringify({ client_id: 123, travel_date: "2024-05-15" }),
    };
    const mockDeal = { id: 1, client_id: 123, travel_date: "2024-05-15" };

    createDealSchema.validate.mockResolvedValue(JSON.parse(event.body));
    createDeal.mockResolvedValue(mockDeal);
    successResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ message: "success", data: mockDeal }),
    });

    const result = await handler(event);

    expect(createDealSchema.validate).toHaveBeenCalledWith(
      JSON.parse(event.body),
      { abortEarly: false }
    );
    expect(createDeal).toHaveBeenCalledWith(JSON.parse(event.body));
    expect(successResponse).toHaveBeenCalledWith({
      message: "success",
      data: mockDeal,
    });
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: "success", data: mockDeal }),
    });
  });

  it("should update a deal successfully", async () => {
    const event = {
      body: JSON.stringify({
        id: 1,
        client_id: 123,
        travel_date: "2024-05-15",
      }),
    };
    const mockDeal = { id: 1, client_id: 123, travel_date: "2024-05-15" };

    updateDealSchema.validate.mockResolvedValue(JSON.parse(event.body));
    updateDeal.mockResolvedValue(mockDeal);
    successResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ message: "success", data: mockDeal }),
    });

    const result = await handler(event);

    expect(updateDealSchema.validate).toHaveBeenCalledWith(
      JSON.parse(event.body),
      { abortEarly: false }
    );
    expect(updateDeal).toHaveBeenCalledWith(1, JSON.parse(event.body));
    expect(successResponse).toHaveBeenCalledWith({
      message: "success",
      data: mockDeal,
    });
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: "success", data: mockDeal }),
    });
  });

  it("should return 404 if deal to update is not found", async () => {
    const event = {
      body: JSON.stringify({ id: 1, client_id: 123 }),
    };

    updateDealSchema.validate.mockResolvedValue(JSON.parse(event.body));
    updateDeal.mockResolvedValue(null);
    errorResponse.mockReturnValue({
      statusCode: 404,
      body: JSON.stringify({ message: "Deal not found" }),
    });

    const result = await handler(event);

    expect(updateDeal).toHaveBeenCalledWith(1, JSON.parse(event.body));
    expect(errorResponse).toHaveBeenCalledWith(404, "Deal not found");
    expect(result).toEqual({
      statusCode: 404,
      body: JSON.stringify({ message: "Deal not found" }),
    });
  });

  it("should handle unexpected errors gracefully", async () => {
    const event = {
      body: JSON.stringify({ client_id: 123 }),
    };

    createDealSchema.validate.mockRejectedValue(new Error("Validation error"));
    errorResponse.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    });

    const result = await handler(event);

    expect(createDealSchema.validate).toHaveBeenCalled();
    expect(errorResponse).toHaveBeenCalledWith(500, "Internal Server Error");
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    });
  });
});
