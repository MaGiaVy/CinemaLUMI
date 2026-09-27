import type { Metadata } from 'next';
import { ReactNode } from 'react';
import '../index.css';

export const metadata: Metadata = {
  title: 'LUMI CINEMA - Trải Nghiệm Điện Ảnh Đỉnh Cao',
  description: 'Đặt vé xem phim trực tuyến nhanh chóng, chọn ghế linh hoạt, cập nhật lịch chiếu mới nhất tại Lumi Cinema.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-[#1A1A1A] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
