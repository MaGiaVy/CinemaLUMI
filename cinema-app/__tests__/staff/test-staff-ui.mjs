// __tests__/staff/test-staff-ui.mjs
const BASE_URL = 'http://localhost:3000';

async function fetchPage(path) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: { 'Accept': 'text/html' } });
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
    // 1. Kiểm tra trang Staff Dashboard (/staff)
    console.log('--- Test 1: Render trang Staff Dashboard (/staff) ---');
    const res1 = await fetchPage('/staff');
    assert(res1.status === 200, `Trang /staff trả về HTTP 200 OK (Status: ${res1.status})`);
    assert(
      res1.html.includes('Dashboard Nhân Viên Quầy') || res1.html.includes('STAFF COUNTER') || res1.html.includes('Staff'),
      'HTML chứa tiêu đề Dashboard Nhân Viên'
    );

    // 2. Kiểm tra trang Tra Cứu Vé (/staff/lookup)
    console.log('\n--- Test 2: Render trang Tra Cứu Vé (/staff/lookup) ---');
    const res2 = await fetchPage('/staff/lookup');
    assert(res2.status === 200, `Trang /staff/lookup trả về HTTP 200 OK (Status: ${res2.status})`);
    assert(
      res2.html.includes('Tra Cứu') || res2.html.includes('UC-15'),
      'HTML chứa nội dung Tra cứu vé và xử lý sự cố'
    );

    // 3. Kiểm tra rewrite /staff-lookup
    console.log('\n--- Test 3: Kiểm tra route rewrite /staff-lookup ---');
    const res3 = await fetchPage('/staff-lookup');
    assert(res3.status === 200, `Đường dẫn cũ /staff-lookup được rewrite thành công (Status: ${res3.status})`);

    // 4. Kiểm tra rewrite /staff-dashboard
    console.log('\n--- Test 4: Kiểm tra route rewrite /staff-dashboard ---');
    const res4 = await fetchPage('/staff-dashboard');
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
