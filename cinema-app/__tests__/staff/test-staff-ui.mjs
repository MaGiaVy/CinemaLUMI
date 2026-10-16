// __tests__/staff/test-staff-ui.mjs
import { getStaffCookie } from '../helpers/auth-helper.mjs';

const BASE_URL = 'http://localhost:3000';

async function fetchPage(path, cookie = '') {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Accept': 'text/html' };
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  const res = await fetch(url, { headers });
  const html = await res.text();
  return { status: res.status, html };
}

async function runTests() {
  console.log('🚀 === BẮT ĐẦU KIỂM THỬ GIAO DIỆN PHÂN HỆ NHÂN VIÊN (STAFF UI) ===\n');

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
    const staffCookie = await getStaffCookie();

    // 1. Kiểm tra trang Staff Dashboard (/staff)
    console.log('--- Test 1: Render trang Staff Dashboard (/staff) với quyền STAFF ---');
    const res1 = await fetchPage('/staff', staffCookie);
    assert(res1.status === 200, `Trang /staff trả về HTTP 200 OK (Status: ${res1.status})`);
    assert(
      res1.html.includes('Dashboard Nhân Viên Quầy') || res1.html.includes('STAFF COUNTER') || res1.html.includes('Staff') || res1.html.includes('Nhân viên'),
      'HTML chứa tiêu đề Dashboard Nhân Viên'
    );

    // 2. Kiểm tra trang Tra Cứu Vé (/staff/lookup)
    console.log('\n--- Test 2: Render trang Tra Cứu Vé (/staff/lookup) với quyền STAFF ---');
    const res2 = await fetchPage('/staff/lookup', staffCookie);
    assert(res2.status === 200, `Trang /staff/lookup trả về HTTP 200 OK (Status: ${res2.status})`);
    assert(
      res2.html.includes('Tra Cứu') || res2.html.includes('UC-15') || res2.html.includes('Vé') || res2.html.includes('vé'),
      'HTML chứa nội dung Tra cứu vé và xử lý sự cố'
    );

    // 3. Kiểm tra rewrite /staff-lookup
    console.log('\n--- Test 3: Kiểm tra route rewrite /staff-lookup ---');
    const res3 = await fetchPage('/staff-lookup', staffCookie);
    assert(res3.status === 200, `Đường dẫn cũ /staff-lookup được rewrite thành công (Status: ${res3.status})`);

    // 4. Kiểm tra rewrite /staff-dashboard
    console.log('\n--- Test 4: Kiểm tra route rewrite /staff-dashboard ---');
    const res4 = await fetchPage('/staff-dashboard', staffCookie);
    assert(res4.status === 200, `Đường dẫn cũ /staff-dashboard được rewrite thành công (Status: ${res4.status})`);

  } catch (err) {
    console.error('Lỗi kiểm thử UI:', err);
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
