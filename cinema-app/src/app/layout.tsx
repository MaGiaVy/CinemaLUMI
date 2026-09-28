import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'LUMI CINEMA - Trải Nghiệm Điện Ảnh Đỉnh Cao',
  description: 'Hệ thống rạp chiếu phim hiện đại nhất Việt Nam. Đặt vé xem phim nhanh chóng, tiện lợi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#1A1A1A] text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
