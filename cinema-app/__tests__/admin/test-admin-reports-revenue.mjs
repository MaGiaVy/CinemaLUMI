// __tests__/admin/test-admin-reports-revenue.mjs
const BASE_URL = 'http://localhost:3000';

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🚀 === BẮT ĐẦU KIỂM THỬ API ADMIN BÁO CÁO DOANH THU CHI TIẾT (UC-19) ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Kiểm tra 401 khi chưa đăng nhập
    console.log('--- Test 1: Bắt lỗi 401 UNAUTHENTICATED khi chưa đăng nhập ---');
    const res1 = await fetchJson('/api/admin/reports/revenue');
    assert(
      res1.status === 401 && res1.data.code === 'UNAUTHENTICATED',
      `Từ chối truy cập chưa xác thực (Status: ${res1.status}, Code: ${res1.data.code})`
    );

    // 2. Kiểm tra 403 khi role là CUSTOMER
    console.log('\n--- Test 2: Bắt lỗi 403 FORBIDDEN khi người dùng là CUSTOMER ---');
    const res2 = await fetchJson('/api/admin/reports/revenue?role=CUSTOMER');
    assert(
      res2.status === 403 && res2.data.code === 'FORBIDDEN',
      `Chặn tài khoản CUSTOMER xem báo cáo doanh thu (Status: ${res2.status}, Code: ${res2.data.code})`
    );

    // 3. Kiểm tra 403 khi role là STAFF
    console.log('\n--- Test 3: Bắt lỗi 403 FORBIDDEN khi người dùng là STAFF ---');
    const res3 = await fetchJson('/api/admin/reports/revenue?role=STAFF');
    assert(
      res3.status === 403 && res3.data.code === 'FORBIDDEN',
      `Chặn tài khoản STAFF xem báo cáo doanh thu quản trị (Status: ${res3.status}, Code: ${res3.data.code})`
    );

    // 4. Cho phép ADMIN truy cập thành công và trả về mảng dữ liệu báo cáo
    console.log('\n--- Test 4: Quản trị viên ADMIN truy cập thành công ---');
    const res4 = await fetchJson('/api/admin/reports/revenue?role=ADMIN');
    assert(
      res4.status === 200 && res4.data.success === true && Array.isArray(res4.data.data),
      `ADMIN truy cập thành công, dữ liệu trả về là một MẢNG (${res4.data.data?.length} suất chiếu)`
    );

    // 5. Kiểm tra chi tiết từng trường trong bản ghi báo cáo
    console.log('\n--- Test 5: Kiểm tra tính đầy đủ của bản ghi báo cáo chi tiết ---');
    if (res4.data.data.length > 0) {
      const item = res4.data.data[0];
      assert(
        Boolean(item.screening_id && item.movie && item.room),
        `Có thông tin suất chiếu #${item.screening_id}, phòng ${item.room}, phim "${item.movie?.title}"`
      );
      assert(
        typeof item.total_revenue === 'number',
        `Có doanh thu riêng của suất chiếu: ${item.total_revenue.toLocaleString('vi-VN')} đ`
      );
      assert(
        typeof item.tickets_sold === 'number' && typeof item.total_seats === 'number',
        `Có số lượng ghế đã bán (${item.tickets_sold}) và tổng số ghế (${item.total_seats})`
      );
      assert(
        typeof item.fill_rate === 'number' && Boolean(item.fill_rate_percentage),
        `Tính toán tỷ lệ lấp đầy chính xác: ${item.fill_rate}% (${item.fill_rate_percentage})`
      );
    }

    // 6. Lọc theo movie_id=3
    console.log('\n--- Test 6: Lọc báo cáo theo movie_id=3 ---');
    const res6 = await fetchJson('/api/admin/reports/revenue?role=ADMIN&movie_id=3');
    assert(
      res6.status === 200 && res6.data.success === true,
      `Lọc theo phim ID=3 thành công (Tìm thấy ${res6.data.data?.length} suất chiếu)`
    );
    if (res6.data.data.length > 0) {
      const allMatchMovie = res6.data.data.every(sc => sc.movie.id === 3);
      assert(allMatchMovie, 'Tất cả các suất chiếu trả về đều thuộc phim ID=3');
    }

    // 7. Lọc theo phòng chiếu room_number=1
    console.log('\n--- Test 7: Lọc báo cáo theo room_number=1 ---');
    const res7 = await fetchJson('/api/admin/reports/revenue?role=ADMIN&room_number=1');
    assert(
      res7.status === 200 && res7.data.success === true,
      `Lọc theo phòng số 1 thành công (Tìm thấy ${res7.data.data?.length} suất chiếu)`
    );

    // 8. Lọc theo khoảng thời gian from_date & to_date
    console.log('\n--- Test 8: Lọc báo cáo theo khoảng thời gian from_date & to_date ---');
    const res8 = await fetchJson('/api/admin/reports/revenue?role=ADMIN&from_date=2026-09-01&to_date=2026-10-31');
    assert(
      res8.status === 200 && res8.data.success === true,
      `Lọc theo khoảng ngày 2026-09-01 đến 2026-10-31 thành công (${res8.data.data?.length} suất chiếu)`
    );

  } catch (err) {
    console.error('Lỗi kiểm thử báo cáo doanh thu:', err);
    failed++;
  }

  console.log(`\n=============================================`);
  console.log(`KẾT QUẢ: ${passed} PASS, ${failed} FAIL`);
  console.log(`=============================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
