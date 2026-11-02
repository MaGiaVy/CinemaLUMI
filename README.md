# 🎬 Lumi Cinema Project

Dự án Hệ thống Đặt vé & Quản lý Rạp chiếu phim Lumi Cinema.

## 📂 Các Thư Mục Trong Dự Án:
- **`cinema-app/`**: Ứng dụng chính Full-stack (Next.js 16 + Prisma + PostgreSQL + Tailwind CSS + NextAuth). Xem hướng dẫn chi tiết tại [`cinema-app/README.md`](./cinema-app/README.md).
- **`frontend/`**: Bản mockup giao diện mẫu (Figma Prototype / Vite).

## 🚀 Cách Chạy Nhanh Ứng Dụng (100% Docker Local Offline):
```bash
# 1. Khởi động PostgreSQL và Web UI Adminer bằng Docker
docker compose up -d

# 2. Chạy ứng dụng Next.js
cd cinema-app
npm run dev
```

- 🌐 **Web Ứng Dụng Lumi Cinema**: [http://localhost:3000](http://localhost:3000)
- 🗄️ **Giao diện Quản trị CSDL (Adminer)**: [http://localhost:8080](http://localhost:8080)
  - Hệ quản trị: `PostgreSQL`
  - Máy chủ (Server): `postgres` (hoặc `localhost:5434`)
  - Tài khoản: `postgres`
  - Mật khẩu: `postgrespassword`
  - Cơ sở dữ liệu: `lumicinema`
