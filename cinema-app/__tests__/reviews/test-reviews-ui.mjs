import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runUITests() {
  console.log('================================================================');
  console.log('🚀 KIỂM THỬ TÍCH HỢP UI PHASE 11: ĐÁNH GIÁ & KIỂM DUYỆT BÌNH LUẬN');
  console.log('================================================================');

  // TEST 1: Kiểm tra trang chi tiết phim /movies/3 (Customer)
  console.log('\n[1/4] Kiểm tra trang chi tiết phim /movies/3:');
  const moviePageRes = await fetch(`${BASE_URL}/movies/3`);
  assert.strictEqual(moviePageRes.status, 200, 'Trang /movies/3 phải trả về mã HTTP 200');
  const movieHtml = await moviePageRes.text();
  assert.ok(
    movieHtml.includes('Đang tải thông tin phim') || movieHtml.includes('LUMI CINEMA'),
    'Trang chi tiết phim phải render thành công khung HTML'
  );
  console.log('  ✓ Trang /movies/3 render thành công với mã 200 OK');

  // TEST 2: Kiểm tra trang kiểm duyệt bình luận /admin/reviews (Admin)
  console.log('\n[2/4] Kiểm tra trang kiểm duyệt bình luận /admin/reviews:');
  const adminPageRes = await fetch(`${BASE_URL}/admin/reviews`);
  assert.strictEqual(adminPageRes.status, 200, 'Trang /admin/reviews phải trả về mã HTTP 200');
  const adminHtml = await adminPageRes.text();
  assert.ok(
    adminHtml.includes('Quản Lý Đánh Giá'),
    'Trang Admin phải hiển thị tiêu đề "Quản Lý Đánh Giá"'
  );
  console.log('  ✓ Trang /admin/reviews render thành công với mã 200 OK');

  // TEST 3: Kiểm tra API fetch toàn bộ đánh giá hệ thống (GET /api/reviews?all=true)
  console.log('\n[3/4] Kiểm tra Admin fetch toàn bộ đánh giá của hệ thống:');
  const allReviewsRes = await fetch(`${BASE_URL}/api/reviews?all=true`, {
    headers: { 'x-user-role': 'ADMIN' },
  });
  assert.strictEqual(allReviewsRes.status, 200, 'API phải trả về mã 200');
  const allReviewsData = await allReviewsRes.json();
  assert.strictEqual(allReviewsData.success, true);
  assert.ok(Array.isArray(allReviewsData.data), 'Dữ liệu trả về phải là mảng');
  console.log(`  ✓ Đã lấy được ${allReviewsData.data.length} đánh giá toàn hệ thống`);

  // TEST 4: Kiểm thử luồng Form Submit & Bắt lỗi 403 khi chưa xem phim
  console.log('\n[4/4] Kiểm tra Form Submit bắt lỗi 403 khi khách chưa xem phim:');
  const postRes = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 9999, // Khách hàng chưa từng xem phim
      movie_id: 3,
      rating: 5,
      comment: 'Cố tình đánh giá khi chưa xem phim',
    }),
  });
  const postData = await postRes.json();
  assert.strictEqual(postRes.status, 403, 'Phải trả về mã lỗi 403');
  assert.strictEqual(
    postData.error,
    'Bạn chỉ được đánh giá phim sau khi đã xem',
    'Thông báo lỗi phải hiển thị chính xác cho khách'
  );
  console.log(`  ✓ Bắt lỗi 403 thành công: "${postData.error}"`);

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ 4/4 BƯỚC KIỂM THỬ UI & TÍCH HỢP ĐỀU HOÀN THÀNH XUẤT SẮC!');
  console.log('================================================================');
}

runUITests().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
