const { handler } = require("../../functions/deal/dealFind");
const { getDealById } = require("../../db/repository/deal.repository");
const { successResponse, errorResponse } = require("../../utils/response");

jest.mock("../../db/repository/deal.repository");
jest.mock("../../utils/response");

describe("dealFind Lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console.error
  });

  afterAll(() => {
    console.error.mockRestore(); // Restore console.error after all tests
  });

  it("should return 400 if deal_id is missing", async () => {
    const event = { queryStringParameters: null };
    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required parameter: deal_id" }),
    });
  });

  it("should return 400 if deal_id is invalid", async () => {
    const event = { queryStringParameters: { deal_id: "invalid" } };

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid deal_id format" }),
    });
  });

  it("should return a successful response with deal data", async () => {
    const mockDeal = { id: 1, name: "Test Deal" };
    const event = { queryStringParameters: { deal_id: "1" } };

    getDealById.mockResolvedValue(mockDeal);
    successResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ message: "success", data: mockDeal }),
    });

    const result = await handler(event);

    expect(getDealById).toHaveBeenCalledWith("1");
    expect(successResponse).toHaveBeenCalledWith({
      message: "success",
      data: mockDeal,
    });
    expect(result.statusCode).toBe(200);
  });

  it("should handle errors gracefully", async () => {
    const event = { queryStringParameters: { deal_id: "1" } };

    getDealById.mockRejectedValue(new Error("Database error"));
    errorResponse.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    });

    const result = await handler(event);

    expect(getDealById).toHaveBeenCalledWith("1");
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching deal:",
      expect.any(Error)
    );
    expect(errorResponse).toHaveBeenCalledWith(500, "Internal Server Error");
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    });
  });

  it("should return 404 if deal is not found", async () => {
    const event = { queryStringParameters: { deal_id: "2" } };

    getDealById.mockResolvedValue(null);
    errorResponse.mockReturnValue({
      statusCode: 404,
      body: JSON.stringify({ error: "Deal not found" }),
    });

    const result = await handler(event);

    expect(getDealById).toHaveBeenCalledWith("2");
    expect(errorResponse).toHaveBeenCalledWith(404, "Deal not found");
    expect(result).toEqual({
      statusCode: 404,
      body: JSON.stringify({ error: "Deal not found" }),
    });
  });
});
