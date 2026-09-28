import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runReviewTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ API PHASE 11: ĐÁNH GIÁ PHIM (REVIEWS API)');
  console.log('================================================================');

  // TEST 1: GET /api/reviews - Thiếu tham số movie_id
  console.log('\n--- TEST 1: GET /api/reviews bắt lỗi khi thiếu movie_id ---');
  const res1 = await fetch(`${BASE_URL}/api/reviews`);
  const data1 = await res1.json();
  assert.strictEqual(res1.status, 400, 'Phải trả về mã lỗi 400');
  assert.strictEqual(data1.success, false, 'success phải là false');
  assert.strictEqual(data1.code, 'MISSING_MOVIE_ID', 'code phải là MISSING_MOVIE_ID');
  console.log(`✓ TEST 1 Passed: Bắt lỗi 400 thành công: ${data1.error}`);

  // TEST 2: GET /api/reviews?movie_id=abc - movie_id không hợp lệ
  console.log('\n--- TEST 2: GET /api/reviews bắt lỗi khi movie_id không phải số nguyên dương ---');
  const res2 = await fetch(`${BASE_URL}/api/reviews?movie_id=abc`);
  const data2 = await res2.json();
  assert.strictEqual(res2.status, 400, 'Phải trả về mã lỗi 400');
  assert.strictEqual(data2.code, 'INVALID_MOVIE_ID', 'code phải là INVALID_MOVIE_ID');
  console.log(`✓ TEST 2 Passed: Bắt lỗi 400 thành công: ${data2.error}`);

  // TEST 3: GET /api/reviews?movie_id=999999 - Phim không tồn tại
  console.log('\n--- TEST 3: GET /api/reviews bắt lỗi khi phim không tồn tại ---');
  const res3 = await fetch(`${BASE_URL}/api/reviews?movie_id=999999`);
  const data3 = await res3.json();
  assert.strictEqual(res3.status, 404, 'Phải trả về mã lỗi 404');
  assert.strictEqual(data3.code, 'MOVIE_NOT_FOUND', 'code phải là MOVIE_NOT_FOUND');
  console.log(`✓ TEST 3 Passed: Bắt lỗi 404 thành công: ${data3.error}`);

  // TEST 4: POST /api/reviews - Yêu cầu đăng nhập (401)
  console.log('\n--- TEST 4: POST /api/reviews bắt lỗi khi chưa đăng nhập ---');
  const res4 = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      movie_id: 3,
      rating: 5,
      comment: 'Phim quá đỉnh!',
    }),
  });
  const data4 = await res4.json();
  assert.strictEqual(res4.status, 401, 'Phải trả về mã lỗi 401 khi chưa đăng nhập');
  assert.strictEqual(data4.code, 'UNAUTHENTICATED');
  console.log(`✓ TEST 4 Passed: Bắt lỗi 401 thành công: ${data4.error}`);

  // TEST 5: POST /api/reviews - Validate điểm rating không hợp lệ (1-5)
  console.log('\n--- TEST 5: POST /api/reviews validate điểm đánh giá ngoài phạm vi 1-5 ---');
  const res5 = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1,
      movie_id: 3,
      rating: 6, // Vượt quá 5 sao
      comment: 'Đánh giá lố sao',
    }),
  });
  const data5 = await res5.json();
  assert.strictEqual(res5.status, 400, 'Phải trả về mã lỗi 400 khi rating > 5');
  assert.strictEqual(data5.code, 'VALIDATION_ERROR');
  console.log(`✓ TEST 5 Passed: Bắt lỗi 400 thành công: ${data5.error}`);

  // TEST 6: POST /api/reviews - Validation Nghiệp vụ Cốt lõi (Khách chưa từng xem phim)
  console.log('\n--- TEST 6: Validation Nghiệp vụ Cốt lõi: Người dùng chưa xem phim (chưa có vé USED) ---');
  // Giả sử user_id=999 chưa từng có vé xem phim movie_id=3
  const res6 = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 999, // User không có vé USED
      movie_id: 3,
      rating: 5,
      comment: 'Bình luận thử khi chưa xem phim',
    }),
  });
  const data6 = await res6.json();
  assert.strictEqual(res6.status, 403, 'Phải trả về mã lỗi 403 FORBIDDEN');
  assert.strictEqual(
    data6.error,
    'Bạn chỉ được đánh giá phim sau khi đã xem',
    'Thông báo lỗi phải chính xác theo yêu cầu'
  );
  console.log(`✓ TEST 6 Passed: Chặn đánh giá thành công khi chưa xem phim: "${data6.error}"`);

  // TEST 7: POST /api/reviews - Đánh giá hợp lệ (User 1 đã có vé USED cho phim 3)
  console.log('\n--- TEST 7: Khách hàng đã xem phim (có vé USED) gửi đánh giá thành công ---');
  const res7 = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1, // User 1 có vé #8 và #10 với trạng thái 'Used' cho Movie 3
      movie_id: 3,
      rating: 5,
      comment: 'Kỹ xảo hình ảnh và cốt truyện đa vũ trụ của Spider-Verse quá xuất sắc!',
    }),
  });
  const data7 = await res7.json();
  assert.ok(res7.status === 201 || res7.status === 200, 'Phải trả về mã 201 Created hoặc 200 OK');
  assert.strictEqual(data7.success, true);
  assert.strictEqual(data7.data.rating, 5);
  assert.strictEqual(data7.data.movie_id, 3);
  assert.ok(data7.data.full_name, 'Phải có full_name của người đánh giá');
  console.log(`✓ TEST 7 Passed: Thêm đánh giá thành công!`);
  console.log(`  - Người đánh giá: ${data7.data.full_name}`);
  console.log(`  - Điểm rating: ${data7.data.rating}/5 sao`);
  console.log(`  - Bình luận: "${data7.data.comment}"`);

  // TEST 8: GET /api/reviews?movie_id=3 - Đọc danh sách đánh giá của phim
  console.log('\n--- TEST 8: GET /api/reviews?movie_id=3 lấy danh sách đánh giá kèm full_name ---');
  const res8 = await fetch(`${BASE_URL}/api/reviews?movie_id=3`);
  const data8 = await res8.json();
  assert.strictEqual(res8.status, 200, 'Phải trả về mã 200 OK');
  assert.strictEqual(data8.success, true);
  assert.ok(Array.isArray(data8.data), 'data phải là mảng');
  assert.ok(data8.data.length > 0, 'Phải có ít nhất 1 đánh giá vừa thêm');

  const reviewedItem = data8.data.find(r => r.user_id === 1);
  assert.ok(reviewedItem, 'Phải tìm thấy đánh giá của user 1');
  assert.ok(reviewedItem.full_name, 'Review phải include full_name của User');
  assert.strictEqual(reviewedItem.rating, 5);
  console.log(`✓ TEST 8 Passed: Lấy danh sách thành công (${data8.data.length} đánh giá)!`);
  console.log(`  - Tên người bình luận (full_name): ${reviewedItem.full_name}`);
  console.log(`  - User object: id=${reviewedItem.user.id}, name=${reviewedItem.user.name}`);

  // TEST 9: POST /api/reviews - Cập nhật lại đánh giá nếu cùng user đánh giá lại
  console.log('\n--- TEST 9: Cập nhật lại đánh giá khi user gửi lại cho cùng phim ---');
  const res9 = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1,
      movie_id: 3,
      rating: 4,
      comment: 'Cập nhật lại: Xem lại lần 2 thấy đoạn kết hơi nhanh, cho 4 sao!',
    }),
  });
  const data9 = await res9.json();
  assert.strictEqual(res9.status, 200, 'Cập nhật review phải trả về mã 200 OK');
  assert.strictEqual(data9.data.rating, 4);
  console.log(`✓ TEST 9 Passed: Cập nhật đánh giá thành công (điểm mới: ${data9.data.rating}/5 sao)!`);

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ 9/9 TEST CASES CHO PHASE 11: REVIEWS API ĐỀU PASSED 100%!');
  console.log('================================================================');
}

runReviewTests().catch(err => {
  console.error('\n❌ TEST THẤT BẠI:', err);
  process.exit(1);
});
