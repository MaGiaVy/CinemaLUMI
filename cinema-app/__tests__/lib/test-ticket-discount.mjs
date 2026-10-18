import assert from 'node:assert/strict';
import { allocateTicketDiscount } from '../../src/lib/ticket-discount.ts';

console.log('=== CHẠY BỘ KIỂM THỬ: allocateTicketDiscount ===');

// 1. Phân bổ giảm giá theo tỷ lệ giữa 2 vé thường
const tickets1 = [
  { seatId: 101, type: 'Thường', originalPrice: 100000 },
  { seatId: 102, type: 'Thường', originalPrice: 100000 },
];
const res1 = allocateTicketDiscount(tickets1, 40000);
assert.equal(res1.length, 2);
assert.equal(res1[0].discountAmount + res1[1].discountAmount, 40000);
assert.equal(res1[0].paidPrice + res1[1].paidPrice, 160000);
assert.equal(res1[0].discountAmount, 20000);
assert.equal(res1[1].discountAmount, 20000);
console.log('✓ Test 1 Passed: Phân bổ tỷ lệ đều giữa các vé');

// 2. Phân bổ giảm giá với phần dư lẻ (đảm bảo tổng discount luôn khớp)
const tickets2 = [
  { seatId: 201, type: 'Thường', originalPrice: 100000 },
  { seatId: 202, type: 'Trẻ em', originalPrice: 50000 },
  { seatId: 203, type: 'Thường', originalPrice: 100000 },
];
const res2 = allocateTicketDiscount(tickets2, 50000);
const totalDiscountAllocated = res2.reduce((s, t) => s + t.discountAmount, 0);
assert.equal(totalDiscountAllocated, 50000, 'Tổng tiền giảm phân bổ phải chính xác bằng discountAmount');
assert.equal(res2.reduce((s, t) => s + t.paidPrice, 0), 200000);
console.log('✓ Test 2 Passed: Phân bổ không bị lệch số học do phần dư làm tròn');

// 3. Voucher bồi hoàn 50%: chỉ giảm đúng 1 vé được chọn (SRS BR)
const tickets3 = [
  { seatId: 301, type: 'Thường', originalPrice: 100000 },
  { seatId: 302, type: 'Trẻ em', originalPrice: 50000 },
];
const res3 = allocateTicketDiscount(tickets3, 50000, 301);
assert.equal(res3[0].seatId, 301);
assert.equal(res3[0].discountAmount, 50000);
assert.equal(res3[0].paidPrice, 50000);
assert.equal(res3[1].seatId, 302);
assert.equal(res3[1].discountAmount, 0);
assert.equal(res3[1].paidPrice, 50000);
console.log('✓ Test 3 Passed: Voucher 50% chỉ giảm duy nhất trên ghế 301 đã chọn');

// 4. Bắt lỗi khi ghế chọn không tồn tại trong đơn
assert.throws(() => allocateTicketDiscount(tickets3, 50000, 999), /Ghế áp dụng voucher không thuộc đơn/);
console.log('✓ Test 4 Passed: Bắt lỗi ghế chọn không thuộc đơn');

// 5. Bắt lỗi số tiền giảm vượt quá tổng tiền vé
assert.throws(() => allocateTicketDiscount(tickets1, 300000), /Số tiền giảm không hợp lệ/);
console.log('✓ Test 5 Passed: Bắt lỗi số tiền giảm vượt quá tổng tiền vé');

console.log('>>> KẾT QUẢ: TẤT CẢ TEST ALLOCATE TICKET DISCOUNT ĐẠT CHUẨN! <<<\n');
