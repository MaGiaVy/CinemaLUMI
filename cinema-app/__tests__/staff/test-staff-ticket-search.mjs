// __tests__/staff/test-staff-ticket-search.mjs
import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🚀 === BẮT ĐẦU KIỂM THỬ API STAFF TICKETS SEARCH ===\n');

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
    // 1. Kiểm tra 401 khi không có Session / Quyền
    console.log('--- Test 1: Kiểm tra 401 UNAUTHENTICATED khi chưa đăng nhập ---');
    const res1 = await fetchJson('/api/staff/tickets/search');
    assert(
      res1.status === 401 && res1.data.success === false && res1.data.code === 'UNAUTHENTICATED',
      `Từ chối truy cập khi chưa đăng nhập (Status: ${res1.status}, Code: ${res1.data.code})`
    );

    // 2. Kiểm tra 403 FORBIDDEN khi người dùng là CUSTOMER
    console.log('\n--- Test 2: Kiểm tra 403 FORBIDDEN khi người dùng là CUSTOMER ---');
    const res2 = await fetchJson('/api/staff/tickets/search?role=CUSTOMER');
    assert(
      res2.status === 403 && res2.data.success === false && res2.data.code === 'FORBIDDEN',
      `Khách hàng thông thường (CUSTOMER) bị từ chối truy cập (Status: ${res2.status}, Code: ${res2.data.code})`
    );

    // 3. Cho phép STAFF truy cập lấy danh sách gần đây
    console.log('\n--- Test 3: Cho phép STAFF truy cập và lấy danh sách vé gần đây ---');
    const res3 = await fetchJson('/api/staff/tickets/search?role=STAFF');
    assert(
      res3.status === 200 && res3.data.success === true && Array.isArray(res3.data.data),
      `Nhân viên STAFF truy cập thành công, nhận được danh sách vé (Status: ${res3.status}, Số vé: ${res3.data.data?.length})`
    );

    if (res3.data.data && res3.data.data.length > 0) {
      const sample = res3.data.data[0];
      assert(
        Boolean(sample.ticket_code && sample.customer && sample.screening && sample.seat),
        `Vé có đầy đủ cấu trúc: ticket_code (${sample.ticket_code}), customer (${sample.customer?.name}), screening (${sample.screening?.room}), seat (${sample.seat?.code})`
      );
      assert(
        sample.seat && 'seat_status' in sample.seat,
        `Ghế chứa trạng thái trực tiếp của hệ thống: seat_status = ${sample.seat?.seat_status}`
      );
      assert(
        sample.screening && typeof sample.screening.total_seats === 'number',
        `Suất chiếu chứa thông tin tổng số ghế phòng chiếu: total_seats = ${sample.screening?.total_seats}, occupied = ${sample.screening?.occupied_seats}`
      );
    }

    // 4. Tìm kiếm theo Số điện thoại
    console.log('\n--- Test 4: Tìm kiếm theo số điện thoại (phone=0901234567) ---');
    const res4 = await fetchJson('/api/staff/tickets/search?role=STAFF&phone=0901234567');
    assert(
      res4.status === 200 && res4.data.success === true && res4.data.data.length > 0,
      `Tìm thấy vé của khách hàng có SĐT 0901234567 (Tìm thấy ${res4.data.data?.length} vé)`
    );
    if (res4.data.data.length > 0) {
      const match = res4.data.data.every(t => t.customer.phone === '0901234567');
      assert(match, 'Tất cả các vé tìm được đều khớp chính xác SĐT khách hàng');
    }

    // 5. Tìm kiếm theo Email
    console.log('\n--- Test 5: Tìm kiếm theo email (email=khachhang@lumi.vn) ---');
    const res5 = await fetchJson('/api/staff/tickets/search?role=STAFF&email=khachhang@lumi.vn');
    assert(
      res5.status === 200 && res5.data.success === true && res5.data.data.length > 0,
      `Tìm thấy vé của email khachhang@lumi.vn (Tìm thấy ${res5.data.data?.length} vé)`
    );

    // 6. Tìm kiếm theo Mã vé (ticket_id dạng số hoặc mã định dạng #LMC-000003)
    console.log('\n--- Test 6: Tìm kiếm theo mã vé (ticket_id=#LMC-000003) ---');
    const res6 = await fetchJson('/api/staff/tickets/search?role=STAFF&ticket_id=%23LMC-000003');
    assert(
      res6.status === 200 && res6.data.success === true,
      `Tìm kiếm theo mã vé #LMC-000003 thành công`
    );
    if (res6.data.data.length > 0) {
      assert(res6.data.data[0].id === 3, `Đúng vé id=3 khớp mã #LMC-000003`);
    }

    // 7. Tìm kiếm theo từ khóa tổng quát (q=A1)
    console.log('\n--- Test 7: Tìm kiếm theo từ khóa ghế (q=A1) ---');
    const res7 = await fetchJson('/api/staff/tickets/search?role=STAFF&q=A1');
    assert(
      res7.status === 200 && res7.data.success === true,
      `Tìm kiếm từ khóa ghế A1 thành công (Tìm thấy ${res7.data.data?.length} vé)`
    );

    // 8. Kiểm tra Quản trị viên (ADMIN) cũng có quyền truy cập
    console.log('\n--- Test 8: Kiểm tra vai trò ADMIN truy cập ---');
    const res8 = await fetchJson('/api/staff/tickets/search?role=ADMIN');
    assert(
      res8.status === 200 && res8.data.success === true,
      `ADMIN truy cập thành công API tìm kiếm của nhân viên`
    );

  } catch (err) {
    console.error('Lỗi khi chạy bài test:', err);
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
