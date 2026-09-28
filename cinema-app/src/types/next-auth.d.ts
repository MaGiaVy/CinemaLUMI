import { DefaultSession } from 'next-auth';

/**
 * Mở rộng kiểu dữ liệu NextAuth để TypeScript nhận diện thêm id và role
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
