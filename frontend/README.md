# Figma Design Prototype & Frontend Workspace - CinemaLUMI

Thư mục này chứa các thiết kế giao diện Figma ban đầu được xuất qua Figma Make (`figma-make-app`).

## 1. Thống nhất kiến trúc dự án
Toàn bộ mã nguồn, giao diện hoàn chỉnh, hệ thống Backend API, xác thực NextAuth, PostgreSQL và Prisma ORM đã được tích hợp và vận hành chính thức tại:
👉 `../cinema-app`

## 2. Khắc phục broken reference `/src/main.tsx`
Trước đây, file `index.html` tham chiếu đến `/src/main.tsx` nhưng file này chưa tồn tại trong source code.
Hiện tại file `src/main.tsx` đã được bổ sung, khởi tạo `LandingPage` và mount vào `#root`.

## 3. Khởi chạy ứng dụng chính thức
Để khởi chạy hệ thống CinemaLUMI hoàn chỉnh với đầy đủ database, API và xác thực:
```bash
cd ../cinema-app
npm install
npm run dev
```
Truy cập: http://localhost:3000
