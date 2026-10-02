# 🎬 Lumi Cinema Project

Dự án Hệ thống Đặt vé & Quản lý Rạp chiếu phim Lumi Cinema.

## 📂 Các Thư Mục Trong Dự Án:
- **`cinema-app/`**: Ứng dụng chính Full-stack (Next.js 16 + Prisma + PostgreSQL + Tailwind CSS + NextAuth). Xem hướng dẫn chi tiết tại [`cinema-app/README.md`](./cinema-app/README.md).
- **`frontend/`**: Bản mockup giao diện mẫu (Figma Prototype / Vite).

## 🚀 Cách Chạy Nhanh Ứng Dụng Chính:
```bash
cd cinema-app
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
node scripts/heal-all-screening-seats.mjs
npm run dev
```
Mở trình duyệt: **[http://localhost:3000](http://localhost:3000)**
