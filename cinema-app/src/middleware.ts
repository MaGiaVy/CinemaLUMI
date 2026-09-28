import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Next.js Middleware - Lumi Cinema (Phase 15: Bảo mật hệ thống)
 * 
 * Tuân thủ CODE_STANDARDS_BEST_PRACTICES.md:
 * 1. Trích xuất và xác thực JSON Web Token (JWT) từ NextAuth.
 * 2. Phân quyền truy cập tĩnh:
 *    - Khu vực Quản trị viên (/(admin)/*, /admin/*, /dashboard, /reports): Bắt buộc role === 'ADMIN'.
 *    - Khu vực Nhân viên (/(staff)/*, /staff/*): Dành riêng cho 'STAFF' và 'ADMIN'.
 *    - Khu vực Khách hàng được bảo vệ (/(customer)/tickets, /tickets/*, luồng thanh toán /payments/*, /checkout/*):
 *      Bắt buộc người dùng đã đăng nhập (bất kỳ role nào).
 * 3. Tự động điều hướng (Redirect) về trang /login kèm theo tham số ?callbackUrl nếu vi phạm đặc quyền
 *    hoặc chưa đăng nhập.
 */

// Danh sách các đường dẫn Admin cần quyền ADMIN
const ADMIN_PATHS = [
  '/admin',
  '/dashboard',
  '/reports',
];

// Danh sách các đường dẫn Staff dành cho STAFF và ADMIN
const STAFF_PATHS = [
  '/staff',
];

// Danh sách các đường dẫn Khách hàng bắt buộc phải đăng nhập
const PROTECTED_CUSTOMER_PATHS = [
  '/tickets',
  '/my-tickets',
  '/payments',
  '/checkout',
  '/payment-result',
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bỏ qua các tài nguyên tĩnh, nội bộ Next.js và API routes
  // (API routes tự quản lý xác thực và trả về JSON 401/403 theo chuẩn REST API)
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Trích xuất và giải mã JWT token từ request qua NextAuth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userRole = token?.role as string | undefined;
  const isAuthenticated = Boolean(token);
  const currentPath = pathname.toLowerCase();

  // Hàm tiện ích tạo URL redirect về /login kèm callbackUrl
  const redirectToLogin = (reason?: string) => {
    const loginUrl = new URL('/login', request.url);
    const callbackUrl = pathname + search;
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    if (reason) {
      loginUrl.searchParams.set('error', reason);
    }
    return NextResponse.redirect(loginUrl);
  };

  // 3. Phân quyền tĩnh: Tuyến đường Quản trị viên (ADMIN ONLY)
  const isAdminRoute = ADMIN_PATHS.some(
    (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
  );

  if (isAdminRoute) {
    if (!isAuthenticated) {
      return redirectToLogin('Unauthenticated');
    }
    if (userRole !== 'ADMIN') {
      // Đã đăng nhập nhưng không có quyền ADMIN -> Chặn và chuyển về login
      return redirectToLogin('AccessDenied');
    }
    return NextResponse.next();
  }

  // 4. Phân quyền tĩnh: Tuyến đường Nhân viên (STAFF & ADMIN)
  const isStaffRoute = STAFF_PATHS.some(
    (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
  );

  if (isStaffRoute) {
    if (!isAuthenticated) {
      return redirectToLogin('Unauthenticated');
    }
    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      // Khách hàng thông thường không được phép truy cập công cụ quầy
      return redirectToLogin('AccessDenied');
    }
    return NextResponse.next();
  }

  // 5. Phân quyền tĩnh: Tuyến đường Khách hàng bảo vệ (Vé & Luồng thanh toán)
  const isProtectedCustomerRoute = PROTECTED_CUSTOMER_PATHS.some(
    (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
  );

  if (isProtectedCustomerRoute) {
    if (!isAuthenticated) {
      return redirectToLogin('Unauthenticated');
    }
    return NextResponse.next();
  }

  // 6. Cho phép tiếp tục nếu là các trang công khai (Home, Chi tiết phim, Đăng nhập, Đăng ký...)
  return NextResponse.next();
}

/**
 * Cấu hình matcher để tối ưu hiệu năng:
 * Chỉ áp dụng middleware cho các request trang thực tế, loại trừ static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
