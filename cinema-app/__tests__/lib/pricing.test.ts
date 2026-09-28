// __tests__/lib/pricing.test.ts
import { calculateTicketPrice } from "@/lib/pricing";

describe("calculateTicketPrice", () => {
  // Test cases theo mục 15 của CODE_STANDARDS_BEST_PRACTICES.md
  it("should calculate regular ticket price", () => {
    const price = calculateTicketPrice(100000, "Thường", 1);
    expect(price).toBe(100000);
  });

  it("should calculate child ticket price (50%)", () => {
    const price = calculateTicketPrice(100000, "Trẻ em", 1);
    expect(price).toBe(50000);
  });

  it("should calculate multiple tickets", () => {
    const price = calculateTicketPrice(100000, "Thường", 2);
    expect(price).toBe(200000);
  });

  // Test cases với tỷ lệ số (number)
  it("should calculate ticket price with numeric percentage", () => {
    const priceSingle = calculateTicketPrice(120000, 100, 1);
    expect(priceSingle).toBe(120000);

    const priceChild = calculateTicketPrice(120000, 50, 2);
    expect(priceChild).toBe(120000);

    const priceVip = calculateTicketPrice(100000, 120, 1);
    expect(priceVip).toBe(120000);

    const priceCouple = calculateTicketPrice(100000, 180, 1);
    expect(priceCouple).toBe(180000);
  });

  // Test cases kiểm tra validation
  it("should throw error for negative basePrice", () => {
    expect(() => calculateTicketPrice(-100000, 100, 1)).toThrow(
      "Giá gốc của suất chiếu (basePrice) không được là số âm"
    );
  });

  it("should throw error for negative quantity", () => {
    expect(() => calculateTicketPrice(100000, 100, -1)).toThrow(
      "Số lượng vé (quantity) không được là số âm"
    );
  });
});
