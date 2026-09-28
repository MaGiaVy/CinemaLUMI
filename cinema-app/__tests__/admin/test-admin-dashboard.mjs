// __tests__/admin/test-admin-dashboard.mjs
const BASE_URL = 'http://localhost:3000';

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🚀 === BẮT ĐẦU KIỂM THỬ API ADMIN DASHBOARD THỐNG KÊ (PHASE 13) ===\n');

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
    console.log('--- Test 1: Kiểm tra 401 UNAUTHENTICATED khi chưa đăng nhập ---');
    const res1 = await fetchJson('/api/admin/dashboard');
    assert(
      res1.status === 401 && res1.data.code === 'UNAUTHENTICATED',
      `Từ chối truy cập khi chưa đăng nhập (Status: ${res1.status}, Code: ${res1.data.code})`
    );

    // 2. Kiểm tra 403 khi role là CUSTOMER
    console.log('\n--- Test 2: Kiểm tra 403 FORBIDDEN khi người dùng là CUSTOMER ---');
    const res2 = await fetchJson('/api/admin/dashboard?role=CUSTOMER');
    assert(
      res2.status === 403 && res2.data.code === 'FORBIDDEN',
      `Chặn tài khoản CUSTOMER truy cập (Status: ${res2.status}, Code: ${res2.data.code})`
    );

    // 3. Kiểm tra 403 khi role là STAFF (Dashboard Admin chỉ dành riêng cho ADMIN)
    console.log('\n--- Test 3: Kiểm tra 403 FORBIDDEN khi người dùng là STAFF ---');
    const res3 = await fetchJson('/api/admin/dashboard?role=STAFF');
    assert(
      res3.status === 403 && res3.data.code === 'FORBIDDEN',
      `Chặn tài khoản STAFF truy cập Dashboard của ADMIN (Status: ${res3.status}, Code: ${res3.data.code})`
    );

    // 4. Cho phép ADMIN truy cập thành công
    console.log('\n--- Test 4: Cho phép ADMIN truy cập thành công lấy dữ liệu thống kê ---');
    const res4 = await fetchJson('/api/admin/dashboard?role=ADMIN');
    assert(
      res4.status === 200 && res4.data.success === true,
      `Quản trị viên ADMIN truy cập thành công (Status: ${res4.status})`
    );

    const data = res4.data.data;
    assert(Boolean(data && data.today), 'Payload chứa khối dữ liệu hôm nay (data.today)');

    // 5. Kiểm tra các chỉ số trong ngày hôm nay
    console.log('\n--- Test 5: Kiểm tra các chỉ số thống kê trong ngày hôm nay ---');
    assert(
      typeof data.today.total_revenue === 'number',
      `Tổng doanh thu hôm nay: ${data.today.total_revenue.toLocaleString('vi-VN')} đ`
    );
    assert(
      typeof data.today.tickets_sold === 'number',
      `Tổng số vé bán ra hôm nay: ${data.today.tickets_sold} vé`
    );
    assert(
      typeof data.today.combo_revenue === 'number',
      `Doanh thu từ bắp nước hôm nay: ${data.today.combo_revenue.toLocaleString('vi-VN')} đ`
    );
    assert(
      typeof data.today.average_fill_rate === 'number',
      `Tỷ lệ lấp đầy rạp trung bình: ${data.today.average_fill_rate}% (${data.today.fill_rate_percentage})`
    );

    // 6. Kiểm tra danh sách Top 5 bộ phim doanh thu cao nhất
    console.log('\n--- Test 6: Kiểm tra danh sách Top 5 phim doanh thu cao nhất mọi thời đại ---');
    assert(
      Array.isArray(data.top_movies) && data.top_movies.length <= 5,
      `Trả về danh sách top phim (Số lượng: ${data.top_movies.length})`
    );

    if (data.top_movies.length > 0) {
      const top1 = data.top_movies[0];
      assert(
        Boolean(top1.title && typeof top1.total_revenue === 'number' && typeof top1.tickets_sold === 'number'),
        `Phim top 1: "${top1.title}" - Doanh thu: ${top1.total_revenue.toLocaleString('vi-VN')} đ (${top1.tickets_sold} vé)`
      );

      // Kiểm tra sắp xếp giảm dần theo doanh thu
      for (let i = 0; i < data.top_movies.length - 1; i++) {
        assert(
          data.top_movies[i].total_revenue >= data.top_movies[i + 1].total_revenue,
          `Thứ tự sắp xếp giảm dần chính xác (${data.top_movies[i].total_revenue} >= ${data.top_movies[i + 1].total_revenue})`
        );
      }
    }

    // 7. Kiểm tra khối thống kê mọi thời đại (All-Time)
    console.log('\n--- Test 7: Kiểm tra tổng kết mọi thời đại (All-Time Summary) ---');
    assert(
      typeof data.all_time?.total_revenue === 'number' &&
      typeof data.all_time?.tickets_sold === 'number' &&
      typeof data.all_time?.total_movies === 'number',
      `Tổng kết mọi thời đại: Doanh thu: ${data.all_time.total_revenue.toLocaleString('vi-VN')} đ, Vé: ${data.all_time.tickets_sold}, Phim: ${data.all_time.total_movies}`
    );

  } catch (err) {
    console.error('Lỗi kiểm thử Admin Dashboard:', err);
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
