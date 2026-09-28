// __tests__/admin/test-admin-ui.mjs
const BASE_URL = 'http://localhost:3000';

async function fetchPage(path) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: { 'Accept': 'text/html' } });
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
    // 1. Kiểm tra trang Admin Dashboard (/dashboard)
    console.log('--- Test 1: Render trang Admin Dashboard (/dashboard) ---');
    const res1 = await fetchPage('/dashboard');
    assert(res1.status === 200, `Trang /dashboard trả về HTTP 200 OK (Status: ${res1.status})`);
    assert(
      res1.html.includes('Dashboard Quản Trị Hệ Thống') || res1.html.includes('ADMIN CONSOLE'),
      'HTML chứa tiêu đề Dashboard Quản Trị'
    );

    // 2. Kiểm tra trang Báo Cáo Doanh Thu (/reports)
    console.log('\n--- Test 2: Render trang Báo Cáo Doanh Thu (/reports) ---');
    const res2 = await fetchPage('/reports');
    assert(res2.status === 200, `Trang /reports trả về HTTP 200 OK (Status: ${res2.status})`);
    assert(
      res2.html.includes('Báo Cáo Doanh Thu') || res2.html.includes('UC-19'),
      'HTML chứa tiêu đề Báo Cáo Doanh Thu Theo Suất Chiếu'
    );

    // 3. Kiểm tra route rewrite /admin -> /dashboard
    console.log('\n--- Test 3: Kiểm tra route rewrite /admin ---');
    const res3 = await fetchPage('/admin');
    assert(res3.status === 200, `Đường dẫn /admin rewrite thành công (Status: ${res3.status})`);

    // 4. Kiểm tra route rewrite /admin/reports -> /reports
    console.log('\n--- Test 4: Kiểm tra route rewrite /admin/reports ---');
    const res4 = await fetchPage('/admin/reports');
    assert(res4.status === 200, `Đường dẫn /admin/reports rewrite thành công (Status: ${res4.status})`);

    // 5. Kiểm tra route rewrite /admin-dashboard
    console.log('\n--- Test 5: Kiểm tra route rewrite /admin-dashboard ---');
    const res5 = await fetchPage('/admin-dashboard');
    assert(res5.status === 200, `Đường dẫn /admin-dashboard rewrite thành công (Status: ${res5.status})`);

    // 6. Kiểm tra route rewrite /admin-reports
    console.log('\n--- Test 6: Kiểm tra route rewrite /admin-reports ---');
    const res6 = await fetchPage('/admin-reports');
    assert(res6.status === 200, `Đường dẫn /admin-reports rewrite thành công (Status: ${res6.status})`);

  } catch (err) {
    console.error('Lỗi kiểm thử Admin UI:', err);
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
