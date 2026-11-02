import { calculateTicketPrice } from '../../src/lib/pricing.ts';
import { getLocalDateString } from '../../src/lib/date-utils.ts';
import {
  generateZaloPayTransId,
  calculateZaloPayOrderMac,
  verifyZaloPayCallback,
  ZALOPAY_CONFIG,
} from '../../src/lib/zalopay.ts';
import crypto from 'crypto';
import assert from 'assert';

console.log('=== CHẠY BỘ KIỂM THỬ: calculateTicketPrice ===');

// 1. Kiểm tra vé thường
const p1 = calculateTicketPrice(100000, 'Thường', 1);
assert.strictEqual(p1, 100000, 'Vé thường 100% phải có giá 100.000đ');
console.log('✓ Test 1 Passed: calculateTicketPrice(100000, "Thường", 1) =', p1);

// 2. Kiểm tra vé trẻ em (50%)
const p2 = calculateTicketPrice(100000, 'Trẻ em', 1);
assert.strictEqual(p2, 50000, 'Vé trẻ em 50% phải có giá 50.000đ');
console.log('✓ Test 2 Passed: calculateTicketPrice(100000, "Trẻ em", 1) =', p2);

// 3. Kiểm tra mua nhiều vé (quantity = 2)
const p3 = calculateTicketPrice(100000, 'Thường', 2);
assert.strictEqual(p3, 200000, '2 vé thường phải có giá 200.000đ');
console.log('✓ Test 3 Passed: calculateTicketPrice(100000, "Thường", 2) =', p3);

// 4. Kiểm tra với tỷ lệ phần trăm số (pricePercentage = 50, quantity = 3)
const p4 = calculateTicketPrice(120000, 50, 3);
assert.strictEqual(p4, 180000, '120.000 x 50% x 3 = 180.000đ');
console.log('✓ Test 4 Passed: calculateTicketPrice(120000, 50, 3) =', p4);

// 5. Kiểm tra vé VIP (120%) & Vé Ghế đôi (180%)
const pVip = calculateTicketPrice(100000, 120, 1);
assert.strictEqual(pVip, 120000, 'Vé VIP 120% = 120.000đ');
const pCouple = calculateTicketPrice(100000, 'Ghế đôi', 1);
assert.strictEqual(pCouple, 180000, 'Vé Ghế đôi 180% = 180.000đ');
console.log('✓ Test 5 Passed: VIP =', pVip, ', Couple =', pCouple);

// 6. Kiểm tra validation bắt lỗi số âm
assert.throws(() => calculateTicketPrice(-100000, 100, 1), /basePrice/);
assert.throws(() => calculateTicketPrice(100000, 100, -2), /quantity/);
assert.throws(() => calculateTicketPrice(100000, -50, 1), /pricePercentage/);
console.log('✓ Test 6 Passed: Validation bắt lỗi số âm hoạt động chính xác');

console.log('\n=== CHẠY BỘ KIỂM THỬ: getLocalDateString (Asia/Ho_Chi_Minh) ===');
// 1. 18:00 UTC = 01:00 UTC+7 next day
const d1 = getLocalDateString('2026-11-02T18:00:00.000Z');
assert.strictEqual(d1, '2026-11-03', '18:00 UTC phải chuyển thành ngày hôm sau ở VN (UTC+7)');
console.log('✓ Test 7 Passed: 2026-11-02T18:00:00.000Z ->', d1);

// 2. 01:00 UTC = 08:00 UTC+7 same day
const d2 = getLocalDateString('2026-11-02T01:00:00.000Z');
assert.strictEqual(d2, '2026-11-02', '01:00 UTC cùng ngày ở VN');
console.log('✓ Test 8 Passed: 2026-11-02T01:00:00.000Z ->', d2);

// 3. Date object
const d3 = getLocalDateString(new Date('2026-11-02T18:00:00.000Z'));
assert.strictEqual(d3, '2026-11-03');
console.log('✓ Test 9 Passed: Date object ->', d3);

// 4. Empty / invalid
assert.strictEqual(getLocalDateString(''), '');
assert.strictEqual(getLocalDateString('invalid-date'), '');
console.log('✓ Test 10 Passed: Xử lý an toàn chuỗi rỗng và invalid date');

console.log('\n=== CHẠY BỘ KIỂM THỬ: ZaloPay Integration (Task 3) ===');
// 1. Kiểm tra format app_trans_id: YYMMDD_xxxx
const transId = generateZaloPayTransId();
assert.match(transId, /^\d{6}_\d+_\d+$/, 'app_trans_id phải đúng format YYMMDD_timestamp_random');
console.log('✓ Test 11 Passed: generateZaloPayTransId format:', transId);

// 2. Kiểm tra tính MAC tạo đơn hàng (HMAC-SHA256 với key1)
const testMac = calculateZaloPayOrderMac(
  '261102_123456',
  'user1',
  50000,
  1730533600000,
  '{}',
  '[]',
  '2553',
  'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL'
);
assert.strictEqual(testMac.length, 64, 'MAC phải có độ dài 64 hex characters');
console.log('✓ Test 12 Passed: calculateZaloPayOrderMac SHA256 length 64');

// 3. Kiểm tra verifyZaloPayCallback hợp lệ với key2
const callbackData = JSON.stringify({ app_trans_id: '261102_123456', amount: 50000 });
const validMac = crypto
  .createHmac('sha256', ZALOPAY_CONFIG.key2)
  .update(callbackData)
  .digest('hex');
assert.strictEqual(verifyZaloPayCallback(callbackData, validMac), true, 'Callback hợp lệ phải trả về true');
console.log('✓ Test 13 Passed: verifyZaloPayCallback chữ ký hợp lệ -> true');

// 4. Kiểm tra verifyZaloPayCallback phát hiện chữ ký giả mạo
assert.strictEqual(verifyZaloPayCallback(callbackData, 'bad_mac_hex_1234567890abcdef'), false);
assert.strictEqual(verifyZaloPayCallback(callbackData + '_tampered', validMac), false);
console.log('✓ Test 14 Passed: verifyZaloPayCallback phát hiện can thiệp dữ liệu -> false');

console.log('\n>>> KẾT QUẢ: TẤT CẢ 14 TEST CASES ĐỀU ĐẠT CHUẨN 100%! <<<\n');
