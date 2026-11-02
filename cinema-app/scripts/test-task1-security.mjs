import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3005';
const CRON_SECRET = 'lumi_cinema_cron_secret_2026_super_secure';

async function runTask1Tests() {
  console.log('================================================================');
  console.log('🔒 KIỂM THỬ TASK 1: BACKEND SECURITY HARDENING (AUTH & RBAC)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. Cron release-seats
  await test('1.1 Cron release-seats từ chối request không có Authorization header (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/release-seats`);
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'UNAUTHORIZED');
  });

  await test('1.2 Cron release-seats từ chối token sai (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/release-seats`, {
      headers: { Authorization: 'Bearer wrong_secret_key' },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.code, 'UNAUTHORIZED');
  });

  await test('1.3 Cron release-seats chấp nhận token đúng (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/release-seats`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok('released_count' in data.data);
  });

  // 2. Cron release-combos
  await test('2.1 Cron release-combos từ chối request không có Authorization header (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/release-combos`);
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'UNAUTHORIZED');
  });

  await test('2.2 Cron release-combos từ chối token sai (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/release-combos`, {
      headers: { Authorization: 'Bearer wrong_secret_key' },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.code, 'UNAUTHORIZED');
  });

  await test('2.3 Cron release-combos chấp nhận token đúng (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/release-combos`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok('released_reservations_count' in data.data);
  });

  // 3. Pricing surcharges
  await test('3.1 POST /api/pricing/surcharges từ chối khi không có phiên Admin (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/pricing/surcharges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surcharges: [] }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
  });

  // 4. Movies upload
  await test('4.1 POST /api/movies/upload từ chối khi không có phiên Admin/Staff (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/movies/upload`, {
      method: 'POST',
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
  });

  // 5. Reviews
  await test('5.1 POST /api/reviews từ chối khi chưa đăng nhập (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movie_id: 1,
        rating: 5,
        comment: 'Phim rất hay!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'UNAUTHENTICATED');
  });

  await test('5.2 POST /api/reviews chặn mạo danh qua body.user_id (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1, // Kẻ tấn công cố ý chèn user_id của nạn nhân
        movie_id: 1,
        rating: 5,
        comment: 'Hacked review!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'UNAUTHENTICATED');
  });

  await test('5.3 POST /api/reviews chặn mạo danh qua query param ?user_id=1 (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/reviews?user_id=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movie_id: 1,
        rating: 5,
        comment: 'Hacked review via query param!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'UNAUTHENTICATED');
  });

  console.log(`\n🎉 TẤT CẢ ${passed}/${total} BÀI TEST TASK 1 ĐÃ VƯỢT QUA THÀNH CÔNG!`);
}

runTask1Tests().catch(err => {
  console.error('\n❌ Test suite gặp lỗi:', err);
  process.exit(1);
});
