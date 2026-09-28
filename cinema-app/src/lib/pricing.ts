/**
 * Helper tính toán giá vé cho hệ thống Lumi Cinema
 * Tuân thủ CODE_STANDARDS_BEST_PRACTICES.md
 */

/**
 * Bảng tỷ lệ phần trăm mặc định theo loại vé
 */
export const DEFAULT_TICKET_PERCENTAGES: Record<string, number> = {
  'thường': 100,
  'vé thường': 100,
  'normal': 100,
  'standard': 100,
  'trẻ em': 50,
  'vé trẻ em': 50,
  'child': 50,
  'học sinh': 80,
  'sinh viên': 80,
  'học sinh - sinh viên': 80,
  'vé học sinh - sinh viên': 80,
  'student': 80,
  'vip': 120,
  'vé vip': 120,
  'ghế đôi': 180,
  'vé ghế đôi': 180,
  'couple': 180,
  'sweetbox': 180,
};

/**
 * Hàm calculateTicketPrice:
 * Tính ra số tiền cuối cùng khách phải trả dựa trên:
 * - basePrice: Giá gốc của suất chiếu (base_price)
 * - pricePercentageOrType: Tỷ lệ phần trăm (số, ví dụ: 100, 50, 180) HOẶC tên loại vé (ví dụ: 'Thường', 'Trẻ em', 'VIP')
 * - quantity: Số lượng vé mua (mặc định = 1)
 * 
 * Công thức:
 * pricePerTicket = Math.round((basePrice * pricePercentage) / 100)
 * total = pricePerTicket * quantity
 * 
 * @param basePrice Giá gốc của suất chiếu (VNĐ)
 * @param pricePercentageOrType Tỷ lệ phần trăm giá vé (number) hoặc tên loại vé (string)
 * @param quantity Số lượng vé cần mua (mặc định là 1)
 * @returns Tổng số tiền khách phải trả (VNĐ)
 */
export function calculateTicketPrice(
  basePrice: number,
  pricePercentageOrType: number | string,
  quantity: number = 1
): number {
  if (basePrice < 0) {
    throw new Error('Giá gốc của suất chiếu (basePrice) không được là số âm');
  }

  if (quantity < 0) {
    throw new Error('Số lượng vé (quantity) không được là số âm');
  }

  let percentage = 100;

  if (typeof pricePercentageOrType === 'number') {
    if (pricePercentageOrType < 0) {
      throw new Error('Tỷ lệ giá vé (pricePercentage) không được là số âm');
    }
    percentage = pricePercentageOrType;
  } else if (typeof pricePercentageOrType === 'string') {
    const normalizedKey = pricePercentageOrType.trim().toLowerCase();
    const mapped = DEFAULT_TICKET_PERCENTAGES[normalizedKey];

    if (mapped !== undefined) {
      percentage = mapped;
    } else {
      const parsedNum = parseFloat(pricePercentageOrType);
      if (!isNaN(parsedNum) && parsedNum >= 0) {
        percentage = parsedNum;
      }
    }
  }

  const pricePerTicket = Math.round((basePrice * percentage) / 100);
  return pricePerTicket * quantity;
}

export default calculateTicketPrice;
