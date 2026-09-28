import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTicketStatusTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ PHASE 10: XỬ LÝ TRẠNG THÁI VÉ (DELETE & PATCH)');
  console.log('================================================================\n');

  // Bước 1: Lấy danh sách vé hiện tại của User 1
  const listRes = await fetch(`${BASE_URL}/api/tickets?user_id=1&status=Valid`);
  const listJson = await listRes.json();
  assert.strictEqual(listRes.status, 200);

  let validTickets = listJson.data || [];

  // Nếu không đủ vé Valid, khởi tạo và thanh toán 2 vé mới
  if (validTickets.length < 2) {
    console.log('[INFO] Đang tạo vé thử nghiệm mới qua cổng thanh toán...');
    const screeningRes = await fetch(`${BASE_URL}/api/screenings/2`);
    const screeningJson = await screeningRes.json();
    const availableSeats = (screeningJson.data?.seats || []).filter(s => s.status !== 'OCCUPIED');

    const initRes = await fetch(`${BASE_URL}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screening_id: 2,
        seat_ids: [availableSeats[0].id, availableSeats[1].id],
        payment_method: 'VNPay',
      }),
    });
    const initJson = await initRes.json();
    const pid = initJson.data.payment_id;

    // Kích hoạt IPN thành công để sinh vé
    await fetch(`${BASE_URL}/api/payments/vnpay-ipn?payment_id=${pid}&status=success&vnp_ResponseCode=00`);

    const refreshedList = await fetch(`${BASE_URL}/api/tickets?user_id=1&status=Valid`);
    const refreshedJson = await refreshedList.json();
    validTickets = refreshedJson.data;
  }

  const cancelTestTicket = validTickets[0];
  const staffTestTicket = validTickets[1];

  console.log(`[INFO] Vé dùng để test HỦY (BR-03): #${cancelTestTicket.id} (Ghế: ${cancelTestTicket.seat?.code})`);
  console.log(`[INFO] Vé dùng để test SOÁT VÉ (STAFF): #${staffTestTicket.id} (Ghế: ${staffTestTicket.seat?.code})\n`);

  // =========================================================================
  // TEST 1: DELETE /api/tickets/[id] - Bắt lỗi xác thực & quyền sở hữu
  // =========================================================================
  console.log('--- TEST 1: Kiểm tra quyền truy cập khi hủy vé ---');
  // 1.1 Chưa đăng nhập
  const delRes1 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}`, { method: 'DELETE' });
  const delJson1 = await delRes1.json();
  assert.strictEqual(delRes1.status, 401);
  console.log('✓ 1.1 Bắt lỗi 401 UNAUTHENTICATED thành công');

  // 1.2 User khác cố tình hủy vé (User 999 hủy vé của User 1)
  const delRes2 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}?user_id=999`, { method: 'DELETE' });
  const delJson2 = await delRes2.json();
  assert.strictEqual(delRes2.status, 403);
  console.log('✓ 1.2 Bắt lỗi 403 FORBIDDEN khi hủy vé của người khác thành công:', delJson2.message || delJson2.error);

  // =========================================================================
  // TEST 2: DELETE /api/tickets/[id] - Thực hiện Hủy vé theo ràng buộc BR-03
  // Giải phóng ghế & Nhận Voucher bồi hoàn 50%
  // =========================================================================
  console.log('\n--- TEST 2: Khách hàng tự hủy vé hợp lệ theo quy định BR-03 ---');
  const delRes3 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}?user_id=1`, { method: 'DELETE' });
  const delJson3 = await delRes3.json();

  assert.strictEqual(delRes3.status, 200, 'Hủy vé hợp lệ phải trả về HTTP 200');
  assert.strictEqual(delJson3.success, true);
  assert.strictEqual(delJson3.data.status, 'Cancelled', 'Trạng thái vé phải là Cancelled');
  assert.ok(delJson3.data.compensation_coupon, 'Phải có thông tin voucher bồi thường');
  assert.strictEqual(delJson3.data.compensation_coupon.discount_value, 50, 'Voucher bồi thường phải là 50%');

  console.log('✓ TEST 2 Passed: Hủy vé thành công!');
  console.log(`  - Vé #${delJson3.data.ticket_id} chuyển sang trạng thái: ${delJson3.data.status}`);
  console.log(`  - Đã giải phóng ghế: ${delJson3.data.released_seat}`);
  console.log(`  - Mã Voucher 50% bồi hoàn: ${delJson3.data.compensation_coupon.code} (Hạn 30 ngày)`);

  // =========================================================================
  // TEST 3: Bắt lỗi khi cố tình hủy lại vé đã bị hủy (Already Cancelled)
  // =========================================================================
  console.log('\n--- TEST 3: Bắt lỗi khi hủy lại vé đã CANCELLED ---');
  const delRes4 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}?user_id=1`, { method: 'DELETE' });
  const delJson4 = await delRes4.json();
  assert.strictEqual(delRes4.status, 400);
  assert.strictEqual(delJson4.code, 'TICKET_ALREADY_CANCELLED');
  console.log('✓ TEST 3 Passed: Bắt lỗi TICKET_ALREADY_CANCELLED thành công:', delJson4.message || delJson4.error);

  // =========================================================================
  // TEST 4: PATCH /api/tickets/[id]/mark-used - Phân quyền STAFF / ADMIN
  // =========================================================================
  console.log('\n--- TEST 4: Kiểm tra quyền STAFF khi soát vé ---');
  // 4.1 Khách hàng thông thường (hoặc không truyền role STAFF)
  const patchRes1 = await fetch(`${BASE_URL}/api/tickets/${staffTestTicket.id}/mark-used`, { method: 'PATCH' });
  const patchJson1 = await patchRes1.json();
  assert.strictEqual(patchRes1.status, 403);
  console.log('✓ 4.1 Chặn thành công người dùng không phải STAFF/ADMIN:', patchJson1.message || patchJson1.error);

  // =========================================================================
  // TEST 5: PATCH /api/tickets/[id]/mark-used - Nhân viên soát vé thành công
  // =========================================================================
  console.log('\n--- TEST 5: Nhân viên STAFF soát vé (VALID -> USED) ---');
  const patchRes2 = await fetch(`${BASE_URL}/api/tickets/${staffTestTicket.id}/mark-used?role=STAFF`, {
    method: 'PATCH',
  });
  const patchJson2 = await patchRes2.json();

  assert.strictEqual(patchRes2.status, 200, 'Soát vé thành công phải là HTTP 200');
  assert.strictEqual(patchJson2.success, true);
  assert.strictEqual(patchJson2.data.status, 'Used', 'Trạng thái vé phải chuyển thành Used');

  console.log('✓ TEST 5 Passed: Soát vé thành công!');
  console.log(`  - Vé #${patchJson2.data.ticket_id} (Ghế ${patchJson2.data.seat_code}) đã chuyển sang: ${patchJson2.data.status}`);
  console.log(`  - Khách hàng: ${patchJson2.data.customer_name}`);
  console.log(`  - Thời điểm check-in: ${patchJson2.data.checked_in_at}`);

  // =========================================================================
  // TEST 6: Bắt lỗi khi soát lại vé đã USED (Chống gian lận vé vào rạp 2 lần)
  // =========================================================================
  console.log('\n--- TEST 6: Bắt lỗi khi quét lại vé đã qua sử dụng ---');
  const patchRes3 = await fetch(`${BASE_URL}/api/tickets/${staffTestTicket.id}/mark-used?role=STAFF`, {
    method: 'PATCH',
  });
  const patchJson3 = await patchRes3.json();
  assert.strictEqual(patchRes3.status, 400);
  assert.strictEqual(patchJson3.code, 'TICKET_ALREADY_USED');
  console.log('✓ TEST 6 Passed: Chống quét vé trùng lặp thành công:', patchJson3.message || patchJson3.error);

  // =========================================================================
  // TEST 7: Bắt lỗi khi cố tình soát vé đã bị HỦY (Cancelled)
  // =========================================================================
  console.log('\n--- TEST 7: Chặn check-in vé đã bị hủy ---');
  const patchRes4 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}/mark-used?role=STAFF`, {
    method: 'PATCH',
  });
  const patchJson4 = await patchRes4.json();
  assert.strictEqual(patchRes4.status, 400);
  assert.strictEqual(patchJson4.code, 'TICKET_CANCELLED');
  console.log('✓ TEST 7 Passed: Chặn vé đã hủy thành công:', patchJson4.message || patchJson4.error);

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ 7 TEST CASES CHO CÁC THAO TÁC TRẠNG THÁI VÉ ĐỀU PASSED!');
  console.log('================================================================\n');
}

runTicketStatusTests().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
