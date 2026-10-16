import { encode } from 'next-auth/jwt';

export const SECRET = process.env.NEXTAUTH_SECRET || 'your_nextauth_secret_key_here_super_secret_123';

/**
 * Tạo Cookie JWT Session của NextAuth phục vụ kiểm thử tự động API
 */
export async function createSessionCookie(user) {
  const token = {
    id: String(user.id || 1),
    name: user.name || 'Test User',
    email: user.email || 'user@cinemalumi.vn',
    role: user.role || 'CUSTOMER',
  };
  const jwt = await encode({
    token,
    secret: SECRET,
  });
  return `next-auth.session-token=${jwt}`;
}

export async function getAdminCookie() {
  return createSessionCookie({ id: 1, name: 'Admin Lumi', email: 'admin@cinemalumi.vn', role: 'ADMIN' });
}

export async function getStaffCookie() {
  return createSessionCookie({ id: 2, name: 'Staff Lumi', email: 'staff@cinemalumi.vn', role: 'STAFF' });
}

export async function getCustomerCookie(id = 3) {
  return createSessionCookie({ id, name: 'Customer Lumi', email: `customer${id}@cinemalumi.vn`, role: 'CUSTOMER' });
}
