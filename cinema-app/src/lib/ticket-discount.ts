export interface TicketPriceSnapshot {
  seatId: number;
  type: string;
  originalPrice: number;
  discountAmount: number;
  paidPrice: number;
}

/** Phân bổ theo tỷ lệ, phần dư được gán tuần tự để tổng luôn khớp số tiền giảm. */
export function allocateTicketDiscount(
  tickets: Array<{ seatId: number; type: string; originalPrice: number }>,
  discountAmount: number,
  selectedSeatId?: number
): TicketPriceSnapshot[] {
  const total = tickets.reduce((sum, ticket) => sum + ticket.originalPrice, 0);
  if (!Number.isSafeInteger(discountAmount) || discountAmount < 0 || discountAmount > total) {
    throw new Error('Số tiền giảm không hợp lệ');
  }
  if (selectedSeatId !== undefined && !tickets.some(ticket => ticket.seatId === selectedSeatId)) {
    throw new Error('Ghế áp dụng voucher không thuộc đơn');
  }
  let remaining = discountAmount;
  const allocations = tickets.map((ticket, index) => {
    const allocated = selectedSeatId !== undefined
      ? (ticket.seatId === selectedSeatId ? discountAmount : 0)
      : index === tickets.length - 1
        ? remaining
        : Math.min(ticket.originalPrice, Math.floor(discountAmount * ticket.originalPrice / total));
    remaining -= allocated;
    return {
      ...ticket,
      discountAmount: allocated,
      paidPrice: ticket.originalPrice - allocated,
    };
  });
  if (allocations.some(ticket => ticket.paidPrice < 0) || remaining !== 0) {
    throw new Error('Không thể phân bổ giảm giá');
  }
  return allocations;
}
