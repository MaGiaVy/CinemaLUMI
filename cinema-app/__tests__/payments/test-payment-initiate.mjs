import assert from 'assert';
import { getCustomerCookie } from '../helpers/auth-helper.mjs';

const BASE_URL = 'http://localhost:3000';

async function runPaymentInitiateTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ API PHASE 9: POST /api/payments/initiate');
  console.log('===============================================================\n');

  const customerCookie = await getCustomerCookie();

  // =========================================================================
  // TEST 0: Bảo mật - Chưa đăng nhập phải trả về HTTP 401 UNAUTHENTICATED
  // =========================================================================
  console.log('--- TEST 0: Bảo mật - Bắt lỗi 401 khi chưa đăng nhập ---');
  const res0 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      screening_id: 2,
      seat_ids: [1],
    }),
  });
  const json0 = await res0.json();
  assert.strictEqual(res0.status, 401, 'Chưa đăng nhập phải trả về HTTP 401');
  assert.strictEqual(json0.success, false);
  console.log('✓ TEST 0 Passed: Chặn khách vãng lai chưa xác thực thành công (Status: 401)');

  // Bước chuẩn bị: Lấy thông tin screening và ghế ngồi
  const screeningRes = await fetch(`${BASE_URL}/api/screenings/2`);
  const screeningJson = await screeningRes.json();
  assert.strictEqual(screeningRes.ok, true, 'GET /api/screenings/2 phải thành công');
  assert.strictEqual(screeningJson.success, true, 'Screening API phải trả về success: true');

  const screeningData = screeningJson.data;
  const basePrice = Number(screeningData.price);
  const availableSeats = (screeningData.seats || []).filter(s => s.status !== 'OCCUPIED');
  assert.ok(availableSeats.length >= 2, 'Suất chiếu cần ít nhất 2 ghế trống để kiểm thử');

  const testSeat1 = availableSeats[0];
  const testSeat2 = availableSeats[1];
  console.log(`[INFO] Sử dụng Suất chiếu #${screeningData.id} ("${screeningData.movie.title}") - Giá gốc: ${basePrice.toLocaleString('vi-VN')} đ`);
  console.log(`[INFO] Ghế thử nghiệm: #${testSeat1.id} (${testSeat1.code}), #${testSeat2.id} (${testSeat2.code})\n`);

  // Lấy danh sách combos
  const combosRes = await fetch(`${BASE_URL}/api/combos`);
  const combosJson = await combosRes.json();
  const testCombo = combosJson.data?.[0];
  console.log(`[INFO] Combo thử nghiệm: #${testCombo?.id} (${testCombo?.name}) - Giá: ${testCombo?.price?.toLocaleString('vi-VN')} đ\n`);

  // =========================================================================
  // TEST 1: Validation - Thiếu dữ liệu bắt buộc (Empty body / No screening / No seats)
  // =========================================================================
  console.log('--- TEST 1: Validation bắt lỗi khi thiếu screening_id hoặc seat_ids ---');
  const res1 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({}),
  });
  const json1 = await res1.json();
  assert.strictEqual(res1.status, 400, 'Thiếu thông tin phải trả về HTTP 400');
  assert.strictEqual(json1.success, false, 'success phải là false');
  console.log('✓ TEST 1 Passed: Bắt lỗi validation thành công:', json1.message || json1.error);

  // =========================================================================
  // TEST 2: Validation - Suất chiếu không tồn tại (404)
  // =========================================================================
  console.log('\n--- TEST 2: Bắt lỗi khi screening_id không tồn tại ---');
  const res2 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: 999999,
      seat_ids: [testSeat1.id],
    }),
  });
  const json2 = await res2.json();
  assert.strictEqual(res2.status, 404, 'Screening không tồn tại phải trả về HTTP 404');
  assert.strictEqual(json2.success, false);
  console.log('✓ TEST 2 Passed: Bắt lỗi SCREENING_NOT_FOUND thành công:', json2.message || json2.error);

  // =========================================================================
  // TEST 3: Validation - Ghế không thuộc suất chiếu (400)
  // =========================================================================
  console.log('\n--- TEST 3: Bắt lỗi khi ghế không tồn tại hoặc sai suất chiếu ---');
  const res3 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: screeningData.id,
      seat_ids: [999999],
    }),
  });
  const json3 = await res3.json();
  assert.strictEqual(res3.status, 400, 'Ghế không hợp lệ phải trả về HTTP 400');
  assert.strictEqual(json3.success, false);
  console.log('✓ TEST 3 Passed: Bắt lỗi INVALID_SEATS thành công:', json3.message || json3.error);

  // =========================================================================
  // TEST 4: Validation - Số lượng vé không khớp với số ghế chọn (400)
  // =========================================================================
  console.log('\n--- TEST 4: Bắt lỗi khi số lượng vé không khớp số ghế ---');
  const res4 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: screeningData.id,
      seat_ids: [testSeat1.id, testSeat2.id], // 2 ghế
      ticket_items: [
        { type: 'Thường', quantity: 1 }, // Chỉ có 1 vé
      ],
    }),
  });
  const json4 = await res4.json();
  assert.strictEqual(res4.status, 400, 'Không khớp số ghế phải trả về HTTP 400');
  assert.strictEqual(json4.success, false);
  console.log('✓ TEST 4 Passed: Bắt lỗi TICKET_SEAT_COUNT_MISMATCH thành công:', json4.message || json4.error);

  // =========================================================================
  // TEST 5: Khởi tạo thanh toán chỉ có Vé (Tickets Only)
  // Tính giá server-side chính xác cho 2 ghế thường (100% base price)
  // =========================================================================
  console.log('\n--- TEST 5: Khởi tạo thanh toán thành công chỉ có Vé (Tickets Only) ---');
  const expectedTicketTotal = basePrice * 2;
  const res5 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: screeningData.id,
      seat_ids: [testSeat1.id, testSeat2.id],
      payment_method: 'VNPay',
    }),
  });
  const json5 = await res5.json();
  assert.strictEqual(res5.status, 201, 'Khởi tạo thành công phải trả về HTTP 201');
  assert.strictEqual(json5.success, true, 'success phải là true');
  assert.ok(json5.data.payment_id, 'Phải có payment_id');
  assert.ok(json5.data.transaction_code, 'Phải có transaction_code');
  assert.strictEqual(json5.data.status, 'Pending', 'Status khởi tạo phải là Pending');
  assert.strictEqual(json5.data.amount, expectedTicketTotal, `Tổng tiền phải bằng ${expectedTicketTotal}`);
  assert.ok(json5.data.vnpay_url.includes('/payments/vnpay-mock'), 'Phải chứa mock VNPay URL');
  assert.ok(json5.data.vnpay_url.includes(`payment_id=${json5.data.payment_id}`), 'VNPay URL phải có payment_id');
  console.log(`✓ TEST 5 Passed: Tạo Payment #${json5.data.payment_id} thành công!`);
  console.log(`  - Số tiền: ${json5.data.amount.toLocaleString('vi-VN')} đ (Server tính)`);
  console.log(`  - VNPay Mock URL: ${json5.data.vnpay_url}`);

  // =========================================================================
  // TEST 6: Khởi tạo thanh toán có Vé nhiều loại + Combo bắp nước
  // Ví dụ: 1 vé Thường (100%) + 1 vé Trẻ em (50%) + 1 Combo
  // =========================================================================
  console.log('\n--- TEST 6: Khởi tạo thanh toán có nhiều loại Vé + Combo bắp nước ---');
  const normalPrice = basePrice;
  const childPrice = Math.round((basePrice * 50) / 100);
  const comboPrice = Number(testCombo.price);
  const expectedSubtotal = normalPrice + childPrice + comboPrice;

  const res6 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: screeningData.id,
      seat_ids: [testSeat1.id, testSeat2.id],
      ticket_items: [
        { type: 'Thường', quantity: 1 },
        { type: 'Trẻ em', quantity: 1 },
      ],
      combo_items: [
        { combo_id: testCombo.id, quantity: 1 },
      ],
      payment_method: 'VNPay',
    }),
  });
  const json6 = await res6.json();
  assert.strictEqual(res6.status, 201, 'HTTP 201');
  assert.strictEqual(json6.success, true);
  assert.strictEqual(json6.data.breakdown.ticket_total, normalPrice + childPrice, 'Tiền vé phải khớp');
  assert.strictEqual(json6.data.breakdown.combo_total, comboPrice, 'Tiền combo phải khớp');
  assert.strictEqual(json6.data.amount, expectedSubtotal, `Tổng cộng server-side phải là ${expectedSubtotal}`);
  assert.strictEqual(json6.data.breakdown.combo_items.length, 1);
  console.log(`✓ TEST 6 Passed: Tính toán vé đa loại + combo hoàn hảo: ${json6.data.amount.toLocaleString('vi-VN')} đ`);

  // =========================================================================
  // TEST 7: Giữ chỗ ghế và combo tạm thời (Status = RESERVED)
  // =========================================================================
  console.log('\n--- TEST 7: Kiểm tra ghế và combo được giữ chỗ tạm thời (RESERVED) ---');
  const checkSeatsRes = await fetch(`${BASE_URL}/api/screenings/${screeningData.id}`);
  const checkSeatsJson = await checkSeatsRes.json();
  const reservedSeat1 = checkSeatsJson.data.seats.find(s => s.id === testSeat1.id);
  assert.strictEqual(reservedSeat1.status, 'RESERVED', 'Ghế 1 phải chuyển sang RESERVED');
  console.log(`✓ TEST 7 Passed: Ghế #${testSeat1.id} đã được khóa RESERVED cho đơn hàng`);

  console.log('\n===============================================================');
  console.log('🎉 TẤT CẢ TEST CASES CHO API PAYMENT INITIATE ĐÃ HOÀN TẤT!');
  console.log('===============================================================\n');
}

runPaymentInitiateTests().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
