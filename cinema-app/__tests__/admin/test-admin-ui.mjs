// __tests__/admin/test-admin-ui.mjs
import { getAdminCookie } from '../helpers/auth-helper.mjs';

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
  console.log('🚀 === BẮT ĐẦU KIỂM THỬ GIAO DIỆN ADMIN DASHBOARD & REPORTS ===\n');

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

    // 1. Kiểm tra trang Admin Dashboard (/dashboard)
    console.log('--- Test 1: Render trang Admin Dashboard (/dashboard) với quyền ADMIN ---');
    const res1 = await fetchPage('/dashboard', adminCookie);
    assert(res1.status === 200, `Trang /dashboard trả về HTTP 200 OK (Status: ${res1.status})`);
    assert(
      res1.html.includes('Dashboard Quản Trị Hệ Thống') || res1.html.includes('ADMIN CONSOLE') || res1.html.includes('Quản lý'),
      'HTML chứa nội dung Dashboard Quản Trị'
    );

    // 2. Kiểm tra trang Báo Cáo Doanh Thu (/reports)
    console.log('\n--- Test 2: Render trang Báo Cáo Doanh Thu (/reports) với quyền ADMIN ---');
    const res2 = await fetchPage('/reports', adminCookie);
    assert(res2.status === 200, `Trang /reports trả về HTTP 200 OK (Status: ${res2.status})`);
    assert(
      res2.html.includes('Báo Cáo Doanh Thu') || res2.html.includes('UC-19') || res2.html.includes('Doanh thu'),
      'HTML chứa nội dung Báo Cáo Doanh Thu'
    );

    // 3. Kiểm tra route rewrite /admin -> /admin/dashboard
    console.log('\n--- Test 3: Kiểm tra route rewrite /admin ---');
    const res3 = await fetchPage('/admin', adminCookie);
    assert(res3.status === 200, `Đường dẫn /admin rewrite thành công (Status: ${res3.status})`);

    // 4. Kiểm tra route /admin/reports
    console.log('\n--- Test 4: Kiểm tra route /admin/reports ---');
    const res4 = await fetchPage('/admin/reports', adminCookie);
    assert(res4.status === 200, `Đường dẫn /admin/reports tải thành công (Status: ${res4.status})`);

    // 5. Kiểm tra route rewrite /admin-dashboard
    console.log('\n--- Test 5: Kiểm tra route rewrite /admin-dashboard ---');
    const res5 = await fetchPage('/admin-dashboard', adminCookie);
    assert(res5.status === 200, `Đường dẫn /admin-dashboard rewrite thành công (Status: ${res5.status})`);

    // 6. Kiểm tra các thành phần chức năng của Dashboard
    console.log('\n--- Test 6: Kiểm tra các khối giao diện quan trọng ---');
    assert(
      res1.html.includes('Doanh Thu') || res1.html.includes('Vé Bán') || res1.html.includes('doanh thu'),
      'Giao diện Dashboard hiển thị đầy đủ thẻ thống kê chỉ số'
    );

  } catch (err) {
    console.error('Lỗi kiểm thử giao diện:', err);
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
