const {
  getDealById,
  createDeal,
  updateDeal,
} = require("../../db/repository/deal.repository");
const { models } = require("../../db");

jest.mock("../../db", () => ({
  models: {
    deal: {
      findByPk: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Deal Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console.error
  });

  afterAll(() => {
    console.error.mockRestore(); // Restore console.error after tests
  });

  describe("getDealById", () => {
    it("should return a deal if it exists", async () => {
      const mockDeal = { id: 1, client_id: 123 };
      models.deal.findByPk.mockResolvedValue(mockDeal);

      const result = await getDealById(1);

      expect(models.deal.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeal);
    });

    it("should return null if deal does not exist", async () => {
      models.deal.findByPk.mockResolvedValue(null);

      const result = await getDealById(1);

      expect(models.deal.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBeNull();
    });

    it("should throw an error if database call fails", async () => {
      const mockError = new Error("Database error");
      models.deal.findByPk.mockRejectedValue(mockError);

      await expect(getDealById(1)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching deal details:",
        mockError
      );
    });
  });

  describe("createDeal", () => {
    it("should create a deal with valid params", async () => {
      const params = {
        client_id: 123,
        handling_by: "Agent A",
        status: "pending",
        is_successful: true,
        created_by: "user1",
        updated_by: "user1",
      };

      const mockDeal = { id: 1, ...params };
      models.deal.create.mockResolvedValue(mockDeal);

      const result = await createDeal(params);

      expect(models.deal.create).toHaveBeenCalledWith({
        client_id: 123,
        handling_by: "Agent A",
        status: "pending",
        is_successful: true,
        created_by: "user1",
        updated_by: "user1",
      });
      expect(result).toEqual(mockDeal);
    });

    it("should set status to 'pending' if not provided", async () => {
      const params = {
        client_id: 123,
        handling_by: "Agent A",
        is_successful: true,
        created_by: "user1",
        updated_by: "user1",
      };

      const mockDeal = { id: 1, ...params, status: "pending" };
      models.deal.create.mockResolvedValue(mockDeal);

      const result = await createDeal(params);

      expect(models.deal.create).toHaveBeenCalledWith({
        client_id: 123,
        handling_by: "Agent A",
        status: "pending",
        is_successful: true,
        created_by: "user1",
        updated_by: "user1",
      });
      expect(result).toEqual(mockDeal);
    });
  });

  describe("updateDeal", () => {
    it("should update a deal with valid params", async () => {
      const mockDeal = {
        id: 1,
        client_id: 123,
        save: jest.fn().mockResolvedValue(),
      };

      const params = {
        client_id: 456,
        handling_by: "Agent B",
        status: "completed",
        updated_by: "user2",
      };

      models.deal.findByPk.mockResolvedValue(mockDeal);

      const result = await updateDeal(1, params);

      expect(models.deal.findByPk).toHaveBeenCalledWith(1);
      expect(mockDeal.client_id).toBe(456);
      expect(mockDeal.handling_by).toBe("Agent B");
      expect(mockDeal.status).toBe("completed");
      expect(mockDeal.updated_by).toBe("user2");
      expect(mockDeal.save).toHaveBeenCalled();
      expect(result).toEqual(mockDeal);
    });

    it("should return null if deal is not found", async () => {
      models.deal.findByPk.mockResolvedValue(null);

      const params = { client_id: 456 };
      const result = await updateDeal(1, params);

      expect(models.deal.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBeNull();
    });

    it("should throw an error if database call fails", async () => {
      const mockError = new Error("Database error");
      models.deal.findByPk.mockRejectedValue(mockError);

      const params = { client_id: 456 };

      await expect(updateDeal(1, params)).rejects.toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(
        "Error updating deal:",
        mockError
      );
    });
  });
});
