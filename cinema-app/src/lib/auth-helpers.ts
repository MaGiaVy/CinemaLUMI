import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/error';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

/**
 * Lấy thông tin người dùng từ NextAuth session. Trả về null nếu chưa đăng nhập.
 */
export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as { id?: string | number; email?: string; name?: string; role?: string };
  if (!user.id) return null;

  return {
    id: Number(user.id),
    email: user.email || '',
    name: user.name || '',
    role: (user.role as 'CUSTOMER' | 'STAFF' | 'ADMIN') || 'CUSTOMER',
  };
}

/**
 * Bắt buộc người dùng phải đăng nhập, và tùy chọn kiểm tra vai trò (Role).
 * Ném AppError 401 nếu chưa đăng nhập.
 * Ném AppError 403 nếu vai trò không nằm trong danh sách cho phép.
 */
export async function requireAuth(allowedRoles?: ('CUSTOMER' | 'STAFF' | 'ADMIN')[]): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(
      401,
      'Yêu cầu xác thực. Vui lòng đăng nhập để thực hiện hành động này.',
      'UNAUTHORIZED'
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new AppError(
      403,
      `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}.`,
      'FORBIDDEN'
    );
  }

  return user;
}
