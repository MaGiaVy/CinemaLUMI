# 🎬 LUMI CINEMA - Hệ Thống Đặt Vé & Quản Lý Rạp Chiếu Phim

Hệ thống Full-stack hoàn chỉnh dành cho rạp chiếu phim hiện đại **Lumi Cinema**, xây dựng trên nền tảng **Next.js 16 (App Router + Turbopack)**, **PostgreSQL** kết hợp cùng **Prisma ORM**, **Tailwind CSS** và **NextAuth.js**.

---

## 📋 Mục Lục
- [1. Yêu Cầu Môi Trường (Prerequisites)](#1-yêu-cầu-môi-trường-prerequisites)
- [2. Hướng Dẫn Cài Đặt (Installation)](#2-hướng-dẫn-cài-đặt-installation)
- [3. Cấu Hình Biến Môi Trường (.env)](#3-cấu-hình-biến-môi-trường-env)
- [4. Khởi Tạo Cơ Sở Dữ Liệu (Database Setup)](#4-khởi-tạo-cơ-sở-dữ-liệu-database-setup)
- [5. Hướng Dẫn Chạy Dự Án (Running the App)](#5-hướng-dẫn-chạy-dự-án-running-the-app)
- [6. Tài Khoản Mẫu Trải Nghiệm (Demo Accounts)](#6-tài-khoản-mẫu-trải-nghiệm-demo-accounts)
- [7. Cấu Trúc Dự Án (Project Structure)](#7-cấu-trúc-dự-án-project-structure)
- [8. Các Tính Năng Nổi Bật](#8-các-tính-năng-nổi-bật)
- [9. Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#9-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

| Công cụ | Phiên bản khuyến nghị | Ghi chú |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.x` (hỗ trợ cả v22, v24) | [Tải Node.js](https://nodejs.org/) |
| **PostgreSQL** | `>= 14.x` | Cài đặt cục bộ (Postgres App / pgAdmin) hoặc dùng Cloud DB (Supabase, Neon, Railway) |
| **npm / pnpm / yarn** | Mặc định đi kèm Node.js | Trình quản lý gói thư viện |
| **Git** | Mới nhất | Dùng để clone mã nguồn |

---

## 2. Hướng Dẫn Cài Đặt (Installation)

### Bước 1: Mở terminal tại thư mục dự án
```bash
cd cinema-app
```

### Bước 2: Cài đặt các thư viện phụ thuộc (Dependencies)
```bash
npm install
```

---

## 3. Cấu Hình Biến Môi Trường (.env)

Sao chép file `.env.example` thành file `.env.local` (hoặc `.env`):

```bash
# Trên Windows PowerShell:
Copy-Item .env.example .env

# Trên macOS/Linux:
cp .env.example .env
```

Mở file `.env` và điền thông tin kết nối cơ sở dữ liệu của bạn:

```env
# 1. DATABASE (Thay user, password, port và db_name của máy bạn)
DATABASE_URL="postgresql://postgres:mat_khau_cua_ban@localhost:5432/lumi_cinema?schema=public"

# 2. NEXTAUTH (Chuỗi bí mật ngẫu nhiên cho JWT)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key_random_string_here_123"

# 3. CLOUDINARY (Tùy chọn: dùng khi upload ảnh poster phim lên Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# 4. SMTP / EMAIL (Tùy chọn: gửi vé qua Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"
EMAIL_FROM="LUMI CINEMA <no-reply@lumicinema.vn>"
```

> **Mẹo:** Nếu bạn chưa có sẵn PostgreSQL cục bộ, bạn có thể tạo một Database miễn phí trên [Supabase](https://supabase.com/) hoặc [Neon.tech](https://neon.tech/) rồi dán chuỗi kết nối vào `DATABASE_URL`.

---

## 4. Khởi Tạo Cơ Sở Dữ Liệu (Database Setup)

Sau khi đã cấu hình `DATABASE_URL`:

### Bước 1: Sinh Prisma Client
```bash
npx prisma generate
```

### Bước 2: Đồng bộ cấu trúc bảng vào Database
```bash
npx prisma db push
# hoặc chạy migration nếu muốn:
# npx prisma migrate deploy
```

### Bước 3: Đồng bộ và bù đủ 50 ghế (A1 - E10) cho các suất chiếu
Hệ thống có sẵn script kiểm tra tự động và tạo đủ 50 ghế chuẩn cho toàn bộ các phòng chiếu:
```bash
node scripts/heal-all-screening-seats.mjs
```

---

## 5. Hướng Dẫn Chạy Dự Án (Running the App)

### Chế độ phát triển (Development):
```bash
npm run dev
```
Mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**

### Chế độ đóng gói triển khai (Production Build):
```bash
npm run build
npm run start
```

---

## 6. Tài Khoản Mẫu Trải Nghiệm (Demo Accounts)

Hệ thống phân quyền 3 cấp độ: **Khách hàng (CUSTOMER)**, **Nhân viên (STAFF)**, **Quản trị viên (ADMIN)**.

| Phân quyền | Email đăng nhập | Mật khẩu mặc định | Trang truy cập chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@lumi.vn` | `123456` | `/admin/dashboard`, `/admin/movies`, `/admin/pricing` |
| **Nhân viên (STAFF)** | `staff@lumi.vn` | `123456` | `/staff`, `/staff/lookup` (Soát vé & Check-in) |
| **Khách hàng (CUSTOMER)** | `customer@gmail.com` | `123456` | `/`, `/movies/[id]`, `/tickets` |

*(Bạn cũng có thể tự tạo tài khoản mới ngay trên giao diện Đăng Ký `/signup`)*.

---

## 7. Cấu Trúc Dự Án (Project Structure)

```text
cinema-app/
├── prisma/
│   └── schema.prisma        # 11 Models dữ liệu (Movies, Screenings, Seats, Pricing, Orders...)
├── public/                  # Tài nguyên tĩnh, icon, poster
├── scripts/
│   └── heal-all-screening-seats.mjs # Script kiểm tra & bù đủ 50 ghế tự động
├── src/
│   ├── app/
│   │   ├── (customer)/      # Giao diện đặt vé dành cho Khách hàng
│   │   │   ├── movies/[id]/ # Chi tiết phim & chọn suất chiếu
│   │   │   └── screenings/  # Chọn ghế, combo bắp nước & thanh toán
│   │   ├── admin/           # Phân hệ Quản trị viên (ADMIN)
│   │   │   ├── dashboard/   # Báo cáo doanh thu & biểu đồ thời gian thực
│   │   │   ├── movies/      # Quản lý danh mục phim & chỉnh sửa phim
│   │   │   ├── screenings/  # Lập lịch chiếu phòng 1 - 5 (chống trùng giờ)
│   │   │   ├── pricing/     # Cấu hình giá vé & phụ thu linh hoạt
│   │   │   ├── combos/      # Quản lý đồ ăn bắp nước & tồn kho
│   │   │   └── coupons/     # Quản lý mã giảm giá & voucher bồi hoàn
│   │   ├── staff/           # Phân hệ Nhân viên quầy (Soát vé, Check-in mã QR)
│   │   ├── api/             # RESTful API Backend routes
│   │   └── login/ & signup/ # Trang đăng nhập & đăng ký NextAuth
│   ├── components/          # UI Components dùng chung (Button, Modal, Toast, Badge...)
│   └── lib/                 # Prisma instance, AuthOptions, Error handlers...
├── next.config.ts           # Cấu hình Next.js, image domain và URL rewrites
└── package.json
```

---

## 8. Các Tính Năng Nổi Bật

1. **Đặt vé xem phim trực tuyến:**
   - Sơ đồ ghế trực quan theo thời gian thực (Ghế Standard, Ghế VIP, Ghế Đôi Sweetbox).
   - Cơ chế khóa giữ chỗ tạm thời (Hold seat) trong 10 phút chống xung đột đặt trùng.
   - Tự động giải phóng ghế hết hạn qua cơ chế *Lazy Evaluation* & Cron jobs.
2. **Quản trị phim & Lập lịch chiếu thông minh:**
   - Thêm mới, chỉnh sửa thông tin phim, poster và giá vé cơ bản.
   - Thuật toán kiểm tra xung đột khung giờ chiếu trong cùng phòng chiếu kèm 15 phút dọn dẹp phòng.
   - Tự động sinh 50 ghế (A1 - E10) ngay khi tạo suất chiếu mới.
3. **Quản lý giá vé & Phụ thu động:**
   - Chỉnh sửa linh hoạt giá vé cơ bản theo từng đối tượng khán giả.
   - Bật/tắt và tùy chỉnh mức phụ thu (cuối tuần, suất chiếu muộn, ngày lễ tết).
4. **Tích hợp thanh toán & Quét vé QR Code:**
   - Hỗ trợ luồng thanh toán VNPay và tiền mặt tại quầy.
   - Sinh vé điện tử kèm mã QR bảo mật cao cho nhân viên quét check-in.

---

## 9. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### ❓ Lỗi: `Port 3000 is in use`
Cổng 3000 đang bị chiếm dụng bởi một tiến trình khác. Bạn có thể tắt nó bằng cách:
* **Trên Windows PowerShell:**
  ```powershell
  # Tìm và tắt tiến trình cổng 3000
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  ```

### ❓ Lỗi: `Can't reach database server at localhost:5432`
* Hãy đảm bảo dịch vụ PostgreSQL đang chạy:
  ```powershell
  Get-Service -Name postgresql* | Start-Service
  ```
* Kiểm tra lại thông tin mật khẩu và tên database trong file `.env`.

### ❓ Lỗi: Ghế trong suất chiếu bị thiếu
Chỉ cần chạy lệnh sau để tự động bổ sung đầy đủ 50 ghế cho toàn bộ hệ thống:
```bash
node scripts/heal-all-screening-seats.mjs
```

---

*Chúc bạn có trải nghiệm phát triển tuyệt vời cùng **Lumi Cinema**! 🍿🎥*
