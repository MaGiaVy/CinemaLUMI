import { strict as assert } from 'assert';
import { encode } from 'next-auth/jwt';

const BASE_URL = 'http://localhost:3000';
const SECRET = process.env.NEXTAUTH_SECRET || 'your_nextauth_secret_key_here_super_secret_123';

/**
 * Sinh cookie phiên bản JWT của NextAuth
 */
async function generateSessionCookie(user) {
  const token = {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const jwt = await encode({
    token,
    secret: SECRET,
  });
  return `next-auth.session-token=${jwt}`;
}

async function runMiddlewareTests() {
  console.log('🛡️ === BẮT ĐẦU KIỂM THỬ PHASE 15: MIDDLEWARE BẢO MẬT & PHÂN QUYỀN ===\n');

  // --- KỊCH BẢN 1: Chưa đăng nhập truy cập các tuyến đường bảo vệ ---
  console.log('--- PHẦN 1: Kiểm tra người dùng chưa đăng nhập (Unauthenticated) ---');

  const protectedPaths = [
    { path: '/admin', expectedCallback: '/admin' },
    { path: '/dashboard', expectedCallback: '/dashboard' },
    { path: '/reports', expectedCallback: '/reports' },
    { path: '/staff', expectedCallback: '/staff' },
    { path: '/staff/lookup', expectedCallback: '/staff/lookup' },
    { path: '/tickets', expectedCallback: '/tickets' },
    { path: '/payments', expectedCallback: '/payments' },
    { path: '/checkout', expectedCallback: '/checkout' },
  ];

  for (const item of protectedPaths) {
    const res = await fetch(`${BASE_URL}${item.path}`, {
      redirect: 'manual',
    });
    const location = res.headers.get('location') || '';
    console.log(`  Truy cập ${item.path} -> Status: ${res.status}, Location: ${location}`);
    assert.ok(
      res.status === 307 || res.status === 302,
      `${item.path} phải redirect (302/307) khi chưa đăng nhập, nhận được ${res.status}`
    );
    assert.ok(
      location.includes('/login'),
      `Location phải chuyển hướng về /login: ${location}`
    );
    assert.ok(
      location.includes(`callbackUrl=${encodeURIComponent(item.expectedCallback)}`) ||
      location.includes(`callbackUrl=${item.expectedCallback}`),
      `Location phải chứa callbackUrl hợp lệ: ${location}`
    );
  }
  console.log('  ✅ [PASS] Chặn toàn bộ 8 tuyến đường bảo vệ và redirect về /login kèm callbackUrl chính xác!\n');

  // --- KỊCH BẢN 2: Truy cập trang công khai (Public Routes) ---
  console.log('--- PHẦN 2: Kiểm tra trang công khai (Public routes không bị chặn) ---');
  const publicRes = await fetch(`${BASE_URL}/login`, { redirect: 'manual' });
  console.log(`  Truy cập /login -> Status: ${publicRes.status}`);
  assert.equal(publicRes.status, 200, 'Trang /login phải cho phép truy cập công khai (200 OK)');
  console.log('  ✅ [PASS] Trang công khai hoạt động bình thường, không bị redirect lặp vô hạn!\n');

  // --- KỊCH BẢN 3: Đăng nhập với quyền CUSTOMER ---
  console.log('--- PHẦN 3: Kiểm tra quyền vai trò CUSTOMER ---');
  const customerCookie = await generateSessionCookie({
    id: 1,
    name: 'Khách hàng',
    email: 'khachhang@lumi.vn',
    role: 'CUSTOMER',
  });

  // CUSTOMER được vào /tickets
  const custTicketRes = await fetch(`${BASE_URL}/tickets`, {
    headers: { Cookie: customerCookie },
    redirect: 'manual',
  });
  console.log(`  CUSTOMER vào /tickets -> Status: ${custTicketRes.status}`);
  assert.equal(custTicketRes.status, 200, 'CUSTOMER phải được phép vào /tickets');

  // CUSTOMER bị chặn khi vào /admin hoặc /dashboard
  const custAdminRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: customerCookie },
    redirect: 'manual',
  });
  console.log(`  CUSTOMER vào /dashboard -> Status: ${custAdminRes.status}, Location: ${custAdminRes.headers.get('location')}`);
  assert.ok(custAdminRes.status === 307 || custAdminRes.status === 302, 'CUSTOMER phải bị redirect khỏi /dashboard');

  // CUSTOMER bị chặn khi vào /staff
  const custStaffRes = await fetch(`${BASE_URL}/staff`, {
    headers: { Cookie: customerCookie },
    redirect: 'manual',
  });
  console.log(`  CUSTOMER vào /staff -> Status: ${custStaffRes.status}`);
  assert.ok(custStaffRes.status === 307 || custStaffRes.status === 302, 'CUSTOMER phải bị redirect khỏi /staff');
  console.log('  ✅ [PASS] Phân quyền vai trò CUSTOMER chuẩn xác!\n');

  // --- KỊCH BẢN 4: Đăng nhập với quyền STAFF ---
  console.log('--- PHẦN 4: Kiểm tra quyền vai trò STAFF ---');
  const staffCookie = await generateSessionCookie({
    id: 6,
    name: 'Nhân viên',
    email: 'magiavy265@gmail.com',
    role: 'STAFF',
  });

  // STAFF được vào /staff và /staff/lookup
  const staffRes = await fetch(`${BASE_URL}/staff`, {
    headers: { Cookie: staffCookie },
    redirect: 'manual',
  });
  console.log(`  STAFF vào /staff -> Status: ${staffRes.status}`);
  assert.equal(staffRes.status, 200, 'STAFF phải được phép vào /staff');

  // STAFF được vào /tickets
  const staffTicketRes = await fetch(`${BASE_URL}/tickets`, {
    headers: { Cookie: staffCookie },
    redirect: 'manual',
  });
  console.log(`  STAFF vào /tickets -> Status: ${staffTicketRes.status}`);
  assert.equal(staffTicketRes.status, 200, 'STAFF phải được phép vào /tickets');

  // STAFF bị chặn khi vào /dashboard (ADMIN ONLY)
  const staffAdminRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: staffCookie },
    redirect: 'manual',
  });
  console.log(`  STAFF vào /dashboard -> Status: ${staffAdminRes.status}`);
  assert.ok(staffAdminRes.status === 307 || staffAdminRes.status === 302, 'STAFF phải bị redirect khỏi /dashboard');
  console.log('  ✅ [PASS] Phân quyền vai trò STAFF chuẩn xác!\n');

  // --- KỊCH BẢN 5: Đăng nhập với quyền ADMIN ---
  console.log('--- PHẦN 5: Kiểm tra quyền vai trò ADMIN (Toàn quyền) ---');
  const adminCookie = await generateSessionCookie({
    id: 5,
    name: 'Quản trị viên',
    email: 'giavyma265@gmail.com',
    role: 'ADMIN',
  });

  // ADMIN được vào /dashboard
  const adminDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: adminCookie },
    redirect: 'manual',
  });
  console.log(`  ADMIN vào /dashboard -> Status: ${adminDashRes.status}`);
  assert.equal(adminDashRes.status, 200, 'ADMIN phải được phép vào /dashboard');

  // ADMIN được vào /staff
  const adminStaffRes = await fetch(`${BASE_URL}/staff`, {
    headers: { Cookie: adminCookie },
    redirect: 'manual',
  });
  console.log(`  ADMIN vào /staff -> Status: ${adminStaffRes.status}`);
  assert.equal(adminStaffRes.status, 200, 'ADMIN phải được phép vào /staff');

  // ADMIN được vào /tickets
  const adminTicketRes = await fetch(`${BASE_URL}/tickets`, {
    headers: { Cookie: adminCookie },
    redirect: 'manual',
  });
  console.log(`  ADMIN vào /tickets -> Status: ${adminTicketRes.status}`);
  assert.equal(adminTicketRes.status, 200, 'ADMIN phải được phép vào /tickets');
  console.log('  ✅ [PASS] Phân quyền vai trò ADMIN toàn quyền chuẩn xác!\n');

  // --- KỊCH BẢN 6: Đảm bảo API routes không bị redirect thành HTML ---
  console.log('--- PHẦN 6: Kiểm tra API routes không bị middleware chặn nhầm ---');
  const apiRes = await fetch(`${BASE_URL}/api/movies`, { redirect: 'manual' });
  console.log(`  Truy cập /api/movies -> Status: ${apiRes.status}`);
  assert.equal(apiRes.status, 200, 'API /api/movies phải trả về 200 JSON, không được redirect về /login');
  console.log('  ✅ [PASS] API routes hoạt động chuẩn REST API, không bị chuyển hướng!\n');

  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ BẢO MẬT & PHÂN QUYỀN PHASE 15 ĐỀU ĐẠT CHUẨN 100%!');
}

runMiddlewareTests().catch((err) => {
  console.error('❌ Kiểm thử middleware thất bại:', err);
  process.exit(1);
});
