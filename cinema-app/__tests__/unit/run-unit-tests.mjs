// cinema-app/__tests__/unit/run-unit-tests.mjs
import assert from 'assert';
import { calculateTicketPrice } from '../../src/lib/pricing.ts';
import { resolveMovieId } from '../../src/lib/movie-id.ts';
import {
  generateTicketSignature,
  verifyTicketSignature,
  validateCheckInTime,
  validateCheckInRoom,
} from '../../src/lib/ticket-verification.ts';
import { generateVnpaySignature, verifyVnpaySignature } from '../../src/lib/vnpay.ts';
import { AppError, handleError } from '../../src/lib/error.ts';

console.log('========================================================================');
console.log('🧪 CINEMALUMI - OFFICIAL UNIT TEST SUITE');
console.log('========================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// 1. UNIT TESTS: PRICING (calculateTicketPrice)
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: TICKET PRICING & TIER CALCULATIONS ---');

runTest('Vé thường (STANDARD / 100%): 100,000 * 100% * 1 = 100,000đ', () => {
  const price = calculateTicketPrice(100000, 'Thường', 1);
  assert.strictEqual(price, 100000);
});

runTest('Vé trẻ em (CHILD / 50%): 100,000 * 50% * 1 = 50,000đ', () => {
  const price = calculateTicketPrice(100000, 'Trẻ em', 1);
  assert.strictEqual(price, 50000);
});

runTest('Vé VIP (120%): 100,000 * 120% * 1 = 120,000đ', () => {
  const price = calculateTicketPrice(100000, 120, 1);
  assert.strictEqual(price, 120000);
});

runTest('Vé Ghế đôi (COUPLE / 180%): 100,000 * 180% * 1 = 180,000đ', () => {
  const price = calculateTicketPrice(100000, 'Ghế đôi', 1);
  assert.strictEqual(price, 180000);
});

runTest('Mua số lượng lớn: 120,000 * 50% * 4 vé = 240,000đ', () => {
  const price = calculateTicketPrice(120000, 50, 4);
  assert.strictEqual(price, 240000);
});

runTest('Validation bắt lỗi tham số số âm (basePrice, quantity, pricePercentage)', () => {
  assert.throws(() => calculateTicketPrice(-50000, 100, 1), /basePrice/);
  assert.throws(() => calculateTicketPrice(100000, 100, -1), /quantity/);
  assert.throws(() => calculateTicketPrice(100000, -20, 1), /pricePercentage/);
});

// -----------------------------------------------------------------------------
// 2. UNIT TESTS: MOVIE ID RESOLUTION (resolveMovieId)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: MOVIE ID RESOLUTION ---');

runTest('Parse movie id từ slug dạng "m1" -> 1', () => {
  assert.strictEqual(resolveMovieId('m1'), 1);
});

runTest('Parse movie id từ string số thuần "42" -> 42', () => {
  assert.strictEqual(resolveMovieId('42'), 42);
});

runTest('Parse movie id từ slug kết thúc bằng số "avatar-2" -> 2', () => {
  assert.strictEqual(resolveMovieId('avatar-2'), 2);
});

runTest('Xử lý tham số không hợp lệ hoặc rỗng -> null', () => {
  assert.strictEqual(resolveMovieId('invalid-slug'), null);
  assert.strictEqual(resolveMovieId(''), null);
});

// -----------------------------------------------------------------------------
// 3. UNIT TESTS: TICKET QR HMAC SIGNATURE
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: TICKET QR HMAC SIGNATURE & INTEGRITY ---');

runTest('Sinh chữ ký HMAC-SHA256 đúng cấu trúc và độ dài 16 hex chars', () => {
  const sig = generateTicketSignature(101, 5, 25, 'Valid');
  assert.ok(typeof sig === 'string');
  assert.strictEqual(sig.length, 16);
});

runTest('Xác thực chữ ký hợp lệ thành công (timingSafeEqual)', () => {
  const sig = generateTicketSignature(202, 10, 50, 'Valid');
  const isValid = verifyTicketSignature(202, 10, 50, sig, 'Valid');
  assert.strictEqual(isValid, true);
});

runTest('Phát hiện và từ chối khi chữ ký bị chỉnh sửa hoặc giả mạo', () => {
  const sig = generateTicketSignature(202, 10, 50, 'Valid');
  const tamperedSig = 'f' + sig.slice(1);
  const isValid = verifyTicketSignature(202, 10, 50, tamperedSig, 'Valid');
  assert.strictEqual(isValid, false);
});

runTest('Phát hiện khi dữ liệu vé (ticketId / userId / seatId) bị thay đổi', () => {
  const sig = generateTicketSignature(202, 10, 50, 'Valid');
  // Kẻ tấn công dùng sig của vé 202 cho vé 999
  const isValid = verifyTicketSignature(999, 10, 50, sig, 'Valid');
  assert.strictEqual(isValid, false);
});

// -----------------------------------------------------------------------------
// 4. UNIT TESTS: FR-CHK-01 CHECK-IN TIME & ROOM CONSTRAINTS
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: FR-CHK-01 CHECK-IN TIME & ROOM CONSTRAINTS ---');

const baseTime = new Date('2026-10-16T18:00:00Z');
const screeningStart = new Date(baseTime.getTime() + 60 * 60 * 1000); // 19:00
const screeningEnd = new Date(screeningStart.getTime() + 120 * 60 * 1000); // 21:00

runTest('FR-CHK-01: Chấp nhận check-in đúng khung giờ (15 phút trước giờ chiếu)', () => {
  const testNow = new Date(screeningStart.getTime() - 15 * 60 * 1000); // 18:45
  const result = validateCheckInTime(screeningStart, screeningEnd, testNow);
  assert.strictEqual(result.isValid, true);
});

runTest('FR-CHK-01: Chấp nhận check-in đúng mốc bắt đầu (chính xác 30 phút trước giờ chiếu)', () => {
  const testNow = new Date(screeningStart.getTime() - 30 * 60 * 1000); // 18:30
  const result = validateCheckInTime(screeningStart, screeningEnd, testNow);
  assert.strictEqual(result.isValid, true);
});

runTest('FR-CHK-01: Chấp nhận check-in trong lúc phim đang chiếu (30 phút sau khi bắt đầu)', () => {
  const testNow = new Date(screeningStart.getTime() + 30 * 60 * 1000); // 19:30
  const result = validateCheckInTime(screeningStart, screeningEnd, testNow);
  assert.strictEqual(result.isValid, true);
});

runTest('FR-CHK-01: Từ chối check-in quá sớm (> 30 phút trước giờ chiếu, ví dụ 45 phút)', () => {
  const testNow = new Date(screeningStart.getTime() - 45 * 60 * 1000); // 18:15
  const result = validateCheckInTime(screeningStart, screeningEnd, testNow);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.code, 'CHECKIN_TOO_EARLY');
});

runTest('FR-CHK-01: Từ chối check-in sau khi suất chiếu đã kết thúc', () => {
  const testNow = new Date(screeningEnd.getTime() + 5 * 60 * 1000); // 21:05
  const result = validateCheckInTime(screeningStart, screeningEnd, testNow);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.code, 'CHECKIN_EXPIRED');
});

runTest('FR-CHK-01: Kiểm tra phòng chiếu - Khớp phòng thành công', () => {
  const result = validateCheckInRoom('Cinema 01', 'Cinema 01');
  assert.strictEqual(result.isValid, true);
});

runTest('FR-CHK-01: Kiểm tra phòng chiếu - Bắt lỗi khi nhầm phòng chiếu', () => {
  const result = validateCheckInRoom('Cinema 01', 'Cinema 02');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.reason.includes('Cinema 01'));
});

// -----------------------------------------------------------------------------
// 5. UNIT TESTS: VNPAY HMAC-SHA512 CHECKSUM
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: VNPAY HMAC-SHA512 SIGNATURE & TAMPERING ---');

const mockParams = {
  vnp_Amount: '12000000',
  vnp_Command: 'pay',
  vnp_CreateDate: '20261016140000',
  vnp_CurrCode: 'VND',
  vnp_IpAddr: '127.0.0.1',
  vnp_Locale: 'vn',
  vnp_OrderInfo: 'Test Lumi Cinema Payment',
  vnp_ReturnUrl: 'http://localhost:3000/api/payments/vnpay-return',
  vnp_TmnCode: 'LUMICINE',
  vnp_TxnRef: '12345',
  vnp_Version: '2.1.0',
};
const secretKey = 'TEST_VNPAY_SECRET_KEY_123456';

runTest('VNPay: Tạo chữ ký HMAC-SHA512 từ tham số đã sắp xếp', () => {
  const sig = generateVnpaySignature(mockParams, secretKey);
  assert.ok(typeof sig === 'string');
  assert.strictEqual(sig.length, 128); // 128 hex chars for SHA-512
});

runTest('VNPay: Xác thực chữ ký hợp lệ trả về true', () => {
  const sig = generateVnpaySignature(mockParams, secretKey);
  const paramsWithSig = { ...mockParams, vnp_SecureHash: sig };
  const isValid = verifyVnpaySignature(paramsWithSig, secretKey);
  assert.strictEqual(isValid, true);
});

runTest('VNPay: Phát hiện parameter tampering (sửa đổi số tiền amount)', () => {
  const sig = generateVnpaySignature(mockParams, secretKey);
  const tamperedParams = { ...mockParams, vnp_Amount: '1000', vnp_SecureHash: sig };
  const isValid = verifyVnpaySignature(tamperedParams, secretKey);
  assert.strictEqual(isValid, false);
});

// -----------------------------------------------------------------------------
// 6. UNIT TESTS: APP ERROR & ERROR BOUNDARY HANDLING
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: ERROR HANDLING & APP ERROR MAPPING ---');

runTest('AppError lưu đúng status code, message và error code', () => {
  const err = new AppError(403, 'Không có quyền truy cập', 'FORBIDDEN');
  assert.strictEqual(err.statusCode, 403);
  assert.strictEqual(err.message, 'Không có quyền truy cập');
  assert.strictEqual(err.code, 'FORBIDDEN');
});

runTest('handleError chuẩn hóa AppError thành response object chuẩn', () => {
  const err = new AppError(404, 'Không tìm thấy tài nguyên', 'NOT_FOUND');
  const res = handleError(err);
  assert.strictEqual(res.statusCode, 404);
  assert.strictEqual(res.code, 'NOT_FOUND');
  assert.strictEqual(res.error, 'Không tìm thấy tài nguyên');
});

runTest('handleError bọc các lỗi ngoại lệ không mong muốn thành 500 INTERNAL_ERROR', () => {
  const genericErr = new Error('Unexpected crash');
  const res = handleError(genericErr);
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.code, 'INTERNAL_SERVER_ERROR');
});

console.log('\n========================================================================');
console.log(`🎉 TẤT CẢ ${passedTests}/${totalTests} UNIT TEST CASES ĐỀU ĐẠT CHUẨN 100%!`);
console.log('========================================================================\n');
