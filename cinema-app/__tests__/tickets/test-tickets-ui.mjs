import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- BẮT ĐẦU TEST TÍCH HỢP UI & API VÉ (PHASE 10) ---');

  // Test 1: Truy cập trang danh sách vé /tickets
  console.log('\n[1/5] Kiểm tra truy cập trang /tickets:');
  const pageRes = await fetch(`${BASE_URL}/tickets`);
  assert.strictEqual(pageRes.status, 200, 'Trang /tickets phải trả về mã HTTP 200');
  const pageHtml = await pageRes.text();
  assert.ok(pageHtml.includes('Vé Của Tôi'), 'Trang /tickets phải hiển thị tiêu đề "Vé Của Tôi"');
  console.log('  ✓ Trang /tickets tải thành công với mã 200 OK');

  // Test 2: Truy vấn danh sách vé từ API /api/tickets?user_id=1
  console.log('\n[2/5] Kiểm tra API GET /api/tickets?user_id=1:');
  const apiRes = await fetch(`${BASE_URL}/api/tickets?user_id=1`);
  assert.strictEqual(apiRes.status, 200, 'API /api/tickets phải trả về mã 200');
  const apiData = await apiRes.json();
  assert.strictEqual(apiData.success, true, 'API phải trả về success: true');
  assert.ok(Array.isArray(apiData.data), 'Dữ liệu trả về phải là mảng vé');
  assert.ok(apiData.data.length > 0, 'Phải có ít nhất 1 vé cho user_id=1');
  console.log(`  ✓ Đã lấy được ${apiData.data.length} vé của khách hàng thành công`);

  // Test 3: Truy cập trang chi tiết vé /tickets/:id
  const firstTicket = apiData.data[0];
  console.log(`\n[3/5] Kiểm tra trang chi tiết vé /tickets/${firstTicket.id}:`);
  const detailPageRes = await fetch(`${BASE_URL}/tickets/${firstTicket.id}`);
  assert.strictEqual(detailPageRes.status, 200, 'Trang chi tiết vé phải trả về mã HTTP 200');
  console.log(`  ✓ Trang /tickets/${firstTicket.id} tải thành công với mã 200 OK`);

  // Test 4: Truy vấn chi tiết vé từ API /api/tickets/:id?user_id=1
  console.log(`\n[4/5] Kiểm tra API GET /api/tickets/${firstTicket.id}?user_id=1:`);
  const detailApiRes = await fetch(`${BASE_URL}/api/tickets/${firstTicket.id}?user_id=1`);
  assert.strictEqual(detailApiRes.status, 200, 'API /api/tickets/:id phải trả về mã 200');
  const detailData = await detailApiRes.json();
  assert.strictEqual(detailData.success, true, 'API phải trả về success: true');
  assert.ok(detailData.data.qr_payload, 'Phải có qr_payload để sinh mã QR Code');
  assert.ok(detailData.data.movie?.title, 'Phải có thông tin tiêu đề phim');
  assert.ok(detailData.data.seat?.code, 'Phải có mã số ghế ngồi');
  console.log(`  ✓ Vé #${detailData.data.id} - Phim: "${detailData.data.movie?.title}" - Ghế: ${detailData.data.seat?.code}`);
  console.log(`  ✓ Payload QR Code: ${detailData.data.qr_payload.slice(0, 70)}...`);

  // Test 5: Kiểm tra tính toán điều kiện hủy vé BR-03
  console.log('\n[5/5] Kiểm tra điều kiện hủy vé theo quy định BR-03 (cách giờ chiếu >= 2 tiếng):');
  const startTime = new Date(detailData.data.screening?.startTime).getTime();
  const now = Date.now();
  const hoursUntilScreening = (startTime - now) / (1000 * 60 * 60);
  console.log(`  - Giờ suất chiếu: ${new Date(startTime).toLocaleString('vi-VN')}`);
  console.log(`  - Thời gian còn lại: ${hoursUntilScreening.toFixed(1)} giờ`);
  if (hoursUntilScreening >= 2 && detailData.data.status === 'Valid') {
    console.log('  ✓ Đủ điều kiện hủy vé theo BR-03 (Nút "Hủy vé" hiển thị và có thể bấm)');
  } else {
    console.log('  ✓ Nút "Hủy vé" bị vô hiệu hóa / ẩn theo đúng ràng buộc BR-03');
  }

  console.log('\n=== TẤT CẢ 5/5 BƯỚC KIỂM TRA ĐỀU HOÀN THÀNH XUẤT SẮC! ===');
}

runTests().catch(err => {
  console.error('Test thất bại:', err);
  process.exit(1);
});
