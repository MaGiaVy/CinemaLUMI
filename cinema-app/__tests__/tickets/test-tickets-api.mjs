import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTicketApiTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ API PHASE 10: TICKET MANAGEMENT');
  console.log('================================================================\n');

  // =========================================================================
  // TEST 1: GET /api/tickets - Bắt lỗi 401 khi chưa xác thực
  // =========================================================================
  console.log('--- TEST 1: GET /api/tickets bắt lỗi khi chưa đăng nhập ---');
  const res1 = await fetch(`${BASE_URL}/api/tickets`);
  const json1 = await res1.json();
  assert.strictEqual(res1.status, 401, 'Chưa đăng nhập phải trả về HTTP 401');
  assert.strictEqual(json1.success, false);
  console.log('✓ TEST 1 Passed: Bắt lỗi 401 UNAUTHENTICATED thành công:', json1.message || json1.error);

  // =========================================================================
  // TEST 2: GET /api/tickets?user_id=1 - Lấy danh sách toàn bộ vé của User 1
  // =========================================================================
  console.log('\n--- TEST 2: GET /api/tickets?user_id=1 lấy danh sách vé thành công ---');
  const res2 = await fetch(`${BASE_URL}/api/tickets?user_id=1`);
  const json2 = await res2.json();
  assert.strictEqual(res2.status, 200, 'Lấy danh sách vé thành công phải là HTTP 200');
  assert.strictEqual(json2.success, true);
  assert.ok(Array.isArray(json2.data), 'data phải là một mảng vé');
  assert.ok(json2.data.length > 0, 'User 1 phải có vé đã đặt từ Phase 9');

  const sampleTicket = json2.data[0];
  console.log(`✓ TEST 2 Passed: Lấy thành công ${json2.data.length} vé của User 1.`);
  console.log(`  - Vé mẫu ID: #${sampleTicket.id}`);
  console.log(`  - Phim: ${sampleTicket.movie?.title}`);
  console.log(`  - Ghế: ${sampleTicket.seat?.code} (${sampleTicket.seat?.type})`);
  console.log(`  - Suất chiếu: ${sampleTicket.screening?.room}`);
  console.log(`  - Giá vé: ${sampleTicket.price.toLocaleString('vi-VN')} đ`);
  console.log(`  - Trạng thái: ${sampleTicket.status}`);

  // Kiểm tra độ đầy đủ của các trường liên kết
  assert.ok(sampleTicket.movie && sampleTicket.movie.title, 'Vé phải có thông tin phim');
  assert.ok(sampleTicket.screening && sampleTicket.screening.room, 'Vé phải có thông tin suất chiếu');
  assert.ok(sampleTicket.seat && sampleTicket.seat.code, 'Vé phải có thông tin ghế ngồi');
  assert.ok(sampleTicket.payment && sampleTicket.payment.status, 'Vé phải có thông tin đơn thanh toán');

  // =========================================================================
  // TEST 3: GET /api/tickets/[id] - Bắt lỗi 401 khi chưa đăng nhập
  // =========================================================================
  console.log('\n--- TEST 3: GET /api/tickets/[id] bắt lỗi khi chưa đăng nhập ---');
  const res3 = await fetch(`${BASE_URL}/api/tickets/${sampleTicket.id}`);
  const json3 = await res3.json();
  assert.strictEqual(res3.status, 401, 'HTTP 401');
  assert.strictEqual(json3.success, false);
  console.log('✓ TEST 3 Passed: Bắt lỗi 401 thành công:', json3.message || json3.error);

  // =========================================================================
  // TEST 4: GET /api/tickets/[id] - Bắt lỗi 400 khi ID không hợp lệ
  // =========================================================================
  console.log('\n--- TEST 4: Bắt lỗi khi ID vé không phải số nguyên dương ---');
  const res4 = await fetch(`${BASE_URL}/api/tickets/abc?user_id=1`);
  const json4 = await res4.json();
  assert.strictEqual(res4.status, 400, 'HTTP 400');
  assert.strictEqual(json4.success, false);
  console.log('✓ TEST 4 Passed: Bắt lỗi INVALID_TICKET_ID thành công:', json4.message || json4.error);

  // =========================================================================
  // TEST 5: GET /api/tickets/[id] - Bắt lỗi 404 khi vé không tồn tại
  // =========================================================================
  console.log('\n--- TEST 5: Bắt lỗi khi mã vé không tồn tại trong hệ thống ---');
  const res5 = await fetch(`${BASE_URL}/api/tickets/999999?user_id=1`);
  const json5 = await res5.json();
  assert.strictEqual(res5.status, 404, 'HTTP 404');
  assert.strictEqual(json5.success, false);
  console.log('✓ TEST 5 Passed: Bắt lỗi TICKET_NOT_FOUND thành công:', json5.message || json5.error);

  // =========================================================================
  // TEST 6: GET /api/tickets/[id] - Bắt lỗi 403 khi truy cập vé của người khác
  // =========================================================================
  console.log('\n--- TEST 6: Kiểm tra quyền sở hữu (Vé thuộc về user khác) ---');
  const res6 = await fetch(`${BASE_URL}/api/tickets/${sampleTicket.id}?user_id=999`);
  const json6 = await res6.json();
  assert.strictEqual(res6.status, 403, 'Không phải chủ vé phải trả về HTTP 403 FORBIDDEN');
  assert.strictEqual(json6.success, false);
  console.log('✓ TEST 6 Passed: Bắt lỗi FORBIDDEN thành công:', json6.message || json6.error);

  // =========================================================================
  // TEST 7: GET /api/tickets/[id] - Lấy chi tiết vé thành công & kiểm tra QR Payload
  // =========================================================================
  console.log('\n--- TEST 7: Lấy chi tiết vé thành công và kiểm tra chuỗi QR Payload ---');
  const res7 = await fetch(`${BASE_URL}/api/tickets/${sampleTicket.id}?user_id=1`);
  const json7 = await res7.json();
  assert.strictEqual(res7.status, 200, 'HTTP 200');
  assert.strictEqual(json7.success, true);

  const detail = json7.data;
  assert.strictEqual(detail.id, sampleTicket.id);
  assert.ok(detail.qr_payload, 'Dữ liệu trả về bắt buộc phải có qr_payload');

  // Thử parse qr_payload
  const parsedQr = JSON.parse(detail.qr_payload);
  assert.strictEqual(parsedQr.ticket_id, sampleTicket.id, 'QR Payload phải chứa ticket_id');
  assert.strictEqual(parsedQr.seat_code, detail.seat?.code, 'QR Payload phải chứa đúng seat_code');
  assert.ok(parsedQr.sig, 'QR Payload phải có chữ ký số xác thực (sig)');

  console.log('✓ TEST 7 Passed: Chi tiết vé trả về đầy đủ!');
  console.log(`  - Khách hàng: ${detail.user?.name} (${detail.user?.email})`);
  console.log(`  - Tên phim: ${detail.movie?.title}`);
  console.log(`  - Ghế: ${detail.seat?.code}`);
  console.log(`  - Chuỗi QR Payload: ${detail.qr_payload}`);

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ 7 TEST CASES CHO PHASE 10 TICKETS API ĐỀU PASSED 100%!');
  console.log('================================================================\n');
}

runTicketApiTests().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
