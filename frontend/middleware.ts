import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware: Bảo vệ route và phân quyền (RBAC)
 * Bảo vệ các route:
 * - /(admin)/* và /admin/* : Chỉ dành cho Role 'admin'
 * - /(staff)/* và /staff/* : Chỉ dành cho Role 'staff' hoặc 'admin'
 * 
 * Tự động chuyển hướng về /login nếu:
 * 1. Chưa đăng nhập (chưa có session/cookie)
 * 2. Sai Role (không đủ quyền hạn)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Nhận diện các route cần được bảo vệ
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/(admin)');
  const isStaffRoute = pathname.startsWith('/staff') || pathname.startsWith('/(staff)');

  if (isAdminRoute || isStaffRoute) {
    // 2. Lấy thông tin Role và Trạng thái đăng nhập từ Cookies hoặc Headers
    const roleCookie = (
      request.cookies.get('user_role')?.value ||
      request.cookies.get('role')?.value ||
      ''
    ).toLowerCase();

    const authToken = (
      request.cookies.get('auth_token')?.value ||
      request.cookies.get('token')?.value ||
      ''
    );

    const isLoggedInCookie = request.cookies.get('is_logged_in')?.value === 'true';
    const isLoggedIn = Boolean(roleCookie || authToken || isLoggedInCookie);

    // 3. Trường hợp chưa đăng nhập -> Redirect về /login
    if (!isLoggedIn || !roleCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('reason', 'unauthenticated');
      return NextResponse.redirect(loginUrl);
    }

    // 4. Trường hợp truy cập khu vực Admin: Yêu cầu Role phải là 'admin'
    if (isAdminRoute && roleCookie !== 'admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('reason', 'unauthorized_role');
      return NextResponse.redirect(loginUrl);
    }

    // 5. Trường hợp truy cập khu vực Staff: Yêu cầu Role là 'staff' hoặc 'admin'
    if (isStaffRoute && roleCookie !== 'staff' && roleCookie !== 'admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('reason', 'unauthorized_role');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * Cấu hình matcher cho middleware
 * Áp dụng cho toàn bộ đường dẫn admin và staff
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/(admin)/:path*',
    '/(staff)/:path*',
  ],
};
