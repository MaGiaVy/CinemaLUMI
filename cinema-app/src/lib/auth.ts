import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * Cấu hình NextAuth.js cho hệ thống Lumi Cinema
 *
 * - CredentialsProvider: Xác thực bằng email + password
 * - JWT Strategy: Token lưu id, email, name, role
 * - Session callback: Đính kèm id và role vào session để Frontend sử dụng
 */
export const authOptions: NextAuthOptions = {
  // -------------------------------------------------------
  // 1. Providers: Đăng nhập bằng Email/Password
  // -------------------------------------------------------
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        // Kiểm tra đầu vào
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
        }

        // Tìm user theo email trong DB
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error('Email không tồn tại trong hệ thống');
        }

        // So sánh mật khẩu đã mã hóa
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Mật khẩu không chính xác');
        }

        // Trả về object user (NextAuth sẽ lưu vào JWT)
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  // -------------------------------------------------------
  // 2. Session strategy: JWT (không dùng database session)
  // -------------------------------------------------------
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 giờ
  },

  // -------------------------------------------------------
  // 3. JWT callback: Đính kèm id và role vào token
  // -------------------------------------------------------
  callbacks: {
    async jwt({ token, user }) {
      // Lần đầu đăng nhập: user object có dữ liệu từ authorize()
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // Session callback: Đính kèm id và role vào session cho Frontend
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: unknown; role?: unknown };
        u.id = token.id;
        u.role = token.role;
      }
      return session;
    },
  },

  // -------------------------------------------------------
  // 4. Cấu hình trang và bảo mật
  // -------------------------------------------------------
  pages: {
    signIn: '/login',   // Trang đăng nhập tùy chỉnh
    error: '/login',    // Redirect về login khi lỗi xác thực
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
