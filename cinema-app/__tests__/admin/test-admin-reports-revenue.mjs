// __tests__/admin/test-admin-reports-revenue.mjs
import { getAdminCookie, getStaffCookie, getCustomerCookie } from '../helpers/auth-helper.mjs';

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
    const adminCookie = await getAdminCookie();
    const staffCookie = await getStaffCookie();
    const customerCookie = await getCustomerCookie();

    // 1. Kiểm tra 401 khi chưa đăng nhập
    console.log('--- Test 1: Bắt lỗi 401 UNAUTHENTICATED khi chưa đăng nhập ---');
    const res1 = await fetchJson('/api/admin/reports/revenue');
    assert(
      res1.status === 401 && res1.data.code === 'UNAUTHENTICATED',
      `Từ chối truy cập chưa xác thực (Status: ${res1.status}, Code: ${res1.data.code})`
    );

    // 1b. Bảo mật: Chặn bypass query parameter
    console.log('--- Test 1b: Kiểm tra chống backdoor query parameter ?role=ADMIN ---');
    const resBypass = await fetchJson('/api/admin/reports/revenue?role=ADMIN');
    assert(
      resBypass.status === 401,
      `Chặn thành công nỗ lực bypass bằng query param giả mạo (Status: ${resBypass.status})`
    );

    // 2. Kiểm tra 403 khi role là CUSTOMER
    console.log('\n--- Test 2: Bắt lỗi 403 FORBIDDEN khi người dùng là CUSTOMER ---');
    const res2 = await fetchJson('/api/admin/reports/revenue', {
      headers: { Cookie: customerCookie },
    });
    assert(
      res2.status === 403 && res2.data.code === 'FORBIDDEN',
      `Chặn tài khoản CUSTOMER xem báo cáo doanh thu (Status: ${res2.status}, Code: ${res2.data.code})`
    );

    // 3. Kiểm tra 403 khi role là STAFF
    console.log('\n--- Test 3: Bắt lỗi 403 FORBIDDEN khi người dùng là STAFF ---');
    const res3 = await fetchJson('/api/admin/reports/revenue', {
      headers: { Cookie: staffCookie },
    });
    assert(
      res3.status === 403 && res3.data.code === 'FORBIDDEN',
      `Chặn tài khoản STAFF xem báo cáo doanh thu quản trị (Status: ${res3.status}, Code: ${res3.data.code})`
    );

    // 4. Cho phép ADMIN truy cập thành công và trả về mảng dữ liệu báo cáo
    console.log('\n--- Test 4: Quản trị viên ADMIN truy cập thành công ---');
    const res4 = await fetchJson('/api/admin/reports/revenue', {
      headers: { Cookie: adminCookie },
    });
    assert(
      res4.status === 200 && res4.data.success === true && Array.isArray(res4.data.data),
      `ADMIN truy cập thành công, dữ liệu trả về là một MẢNG (${res4.data.data?.length} suất chiếu)`
    );

    // 5. Kiểm tra chi tiết từng trường trong bản ghi báo cáo
    console.log('\n--- Test 5: Kiểm tra cấu trúc bản ghi báo cáo (Record Structure) ---');
    if (res4.data.data.length > 0) {
      const item = res4.data.data[0];
      assert(typeof item.screening_id === 'number', `screening_id là number: ${item.screening_id}`);
      assert(typeof item.movie_title === 'string', `movie_title là string: "${item.movie_title}"`);
      assert(typeof item.room_name === 'string', `room_name là string: "${item.room_name}"`);
      assert(typeof item.start_time === 'string', `start_time là ISO string: ${item.start_time}`);
      assert(typeof item.tickets_sold === 'number', `tickets_sold là number: ${item.tickets_sold} vé`);
      assert(typeof item.total_seats === 'number', `total_seats là number: ${item.total_seats} ghế`);
      assert(typeof item.fill_rate === 'number', `fill_rate là number: ${item.fill_rate}% (${item.fill_rate_percentage})`);
      assert(typeof item.ticket_revenue === 'number', `ticket_revenue là number: ${item.ticket_revenue.toLocaleString('vi-VN')} đ`);
      assert(typeof item.combo_revenue === 'number', `combo_revenue là number: ${item.combo_revenue.toLocaleString('vi-VN')} đ`);
      assert(typeof item.total_revenue === 'number', `total_revenue là number: ${item.total_revenue.toLocaleString('vi-VN')} đ`);
    }

    // 6. Kiểm tra bộ lọc theo movie_id
    console.log('\n--- Test 6: Kiểm tra lọc theo movie_id ---');
    const resFilterMovie = await fetchJson('/api/admin/reports/revenue?movie_id=1', {
      headers: { Cookie: adminCookie },
    });
    assert(
      resFilterMovie.status === 200 && Array.isArray(resFilterMovie.data.data),
      `Lọc theo movie_id=1 thành công (${resFilterMovie.data.data.length} suất chiếu)`
    );

    // 7. Kiểm tra bộ lọc theo khoảng thời gian from_date và to_date
    console.log('\n--- Test 7: Kiểm tra lọc theo khoảng thời gian (from_date & to_date) ---');
    const resFilterDate = await fetchJson('/api/admin/reports/revenue?from_date=2026-01-01&to_date=2026-12-31', {
      headers: { Cookie: adminCookie },
    });
    assert(
      resFilterDate.status === 200 && Array.isArray(resFilterDate.data.data),
      `Lọc theo khoảng ngày thành công (${resFilterDate.data.data.length} suất chiếu)`
    );

  } catch (err) {
    console.error('Lỗi kiểm thử Admin Reports Revenue:', err);
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
