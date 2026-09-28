import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runDeleteTests() {
  console.log('================================================================');
  console.log('🚀 KIỂM THỬ API DELETE /api/reviews/[id]: ADMIN KIỂM DUYỆT BÌNH LUẬN');
  console.log('================================================================');

  // TEST 1: Bắt lỗi 401 khi chưa đăng nhập và không có role
  console.log('\n--- TEST 1: DELETE /api/reviews/1 bắt lỗi khi chưa đăng nhập ---');
  const res1 = await fetch(`${BASE_URL}/api/reviews/1`, {
    method: 'DELETE',
  });
  const data1 = await res1.json();
  assert.strictEqual(res1.status, 401, 'Phải trả về mã lỗi 401');
  assert.strictEqual(data1.code, 'UNAUTHENTICATED');
  console.log(`✓ TEST 1 Passed: Bắt lỗi 401 thành công: ${data1.error}`);

  // TEST 2: Bắt lỗi 403 khi người dùng không phải ADMIN
  console.log('\n--- TEST 2: DELETE /api/reviews/1 bắt lỗi khi user không phải ADMIN ---');
  const res2 = await fetch(`${BASE_URL}/api/reviews/1`, {
    method: 'DELETE',
    headers: {
      'x-user-role': 'CUSTOMER',
    },
  });
  const data2 = await res2.json();
  assert.strictEqual(res2.status, 403, 'Phải trả về mã lỗi 403 FORBIDDEN');
  assert.strictEqual(data2.code, 'FORBIDDEN');
  console.log(`✓ TEST 2 Passed: Bắt lỗi 403 thành công: ${data2.error}`);

  // TEST 3: Bắt lỗi 400 khi ID không hợp lệ
  console.log('\n--- TEST 3: DELETE /api/reviews/abc bắt lỗi khi ID không phải số nguyên dương ---');
  const res3 = await fetch(`${BASE_URL}/api/reviews/abc`, {
    method: 'DELETE',
    headers: {
      'x-user-role': 'ADMIN',
    },
  });
  const data3 = await res3.json();
  assert.strictEqual(res3.status, 400, 'Phải trả về mã lỗi 400');
  assert.strictEqual(data3.code, 'INVALID_REVIEW_ID');
  console.log(`✓ TEST 3 Passed: Bắt lỗi 400 thành công: ${data3.error}`);

  // TEST 4: Bắt lỗi 404 khi ID bình luận không tồn tại
  console.log('\n--- TEST 4: DELETE /api/reviews/999999 bắt lỗi khi ID không tồn tại ---');
  const res4 = await fetch(`${BASE_URL}/api/reviews/999999`, {
    method: 'DELETE',
    headers: {
      'x-user-role': 'ADMIN',
    },
  });
  const data4 = await res4.json();
  assert.strictEqual(res4.status, 404, 'Phải trả về mã lỗi 404 NOT_FOUND');
  assert.strictEqual(data4.code, 'NOT_FOUND');
  assert.strictEqual(data4.error, 'Không tìm thấy bình luận cần xóa');
  console.log(`✓ TEST 4 Passed: Bắt lỗi 404 chuẩn mực: "${data4.error}"`);

  // Chuẩn bị một bình luận mẫu để thực hiện xóa
  console.log('\n--- CHUẨN BỊ: Tạo một bình luận mẫu để kiểm thử xóa ---');
  const createRes = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1,
      movie_id: 3,
      rating: 1,
      comment: 'Bình luận chứa nội dung tiêu cực cần admin xóa kiểm duyệt',
    }),
  });
  const createdReview = await createRes.json();
  assert.strictEqual(createRes.ok, true);
  const targetReviewId = createdReview.data.id;
  console.log(`✓ Đã tạo bình luận mẫu #${targetReviewId} để kiểm duyệt`);

  // TEST 5: Admin xóa bình luận thành công
  console.log(`\n--- TEST 5: Admin thực hiện xóa bình luận #${targetReviewId} ---`);
  const res5 = await fetch(`${BASE_URL}/api/reviews/${targetReviewId}`, {
    method: 'DELETE',
    headers: {
      'x-user-role': 'ADMIN',
    },
  });
  const data5 = await res5.json();
  assert.strictEqual(res5.status, 200, 'Phải trả về mã HTTP 200');
  assert.strictEqual(data5.success, true, 'success phải là true');
  assert.strictEqual(data5.message, 'Đã xóa bình luận', 'message phải là "Đã xóa bình luận"');
  console.log(`✓ TEST 5 Passed: Trả về chuẩn cấu trúc:`, JSON.stringify(data5));

  // TEST 6: Xác nhận bình luận đã biến mất hoàn toàn (404 khi truy vấn lại)
  console.log(`\n--- TEST 6: Xác nhận bình luận #${targetReviewId} đã bị xóa vĩnh viễn ---`);
  const verifyRes = await fetch(`${BASE_URL}/api/reviews/${targetReviewId}`);
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyRes.status, 404, 'Bình luận đã xóa phải trả về 404');
  assert.strictEqual(verifyData.code, 'NOT_FOUND');
  console.log(`✓ TEST 6 Passed: Bình luận #${targetReviewId} không còn tồn tại`);

  // TEST 7: Xóa lại lần nữa phải trả về 404
  console.log(`\n--- TEST 7: Thử xóa lại bình luận đã xóa trước đó ---`);
  const res7 = await fetch(`${BASE_URL}/api/reviews/${targetReviewId}`, {
    method: 'DELETE',
    headers: {
      'x-user-role': 'ADMIN',
    },
  });
  const data7 = await res7.json();
  assert.strictEqual(res7.status, 404);
  assert.strictEqual(data7.error, 'Không tìm thấy bình luận cần xóa');
  console.log(`✓ TEST 7 Passed: Bắt lỗi 404 khi xóa lại thành công: "${data7.error}"`);

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ 7/7 TEST CASES KIỂM DUYỆT BÌNH LUẬN ĐỀU PASSED 100%!');
  console.log('================================================================');
}

runDeleteTests().catch(err => {
  console.error('\n❌ TEST THẤT BẠI:', err);
  process.exit(1);
});
