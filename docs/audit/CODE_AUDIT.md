# BÁO CÁO KIỂM TOÁN MÃ NGUỒN (CODE AUDIT) - CINEMALUMI

> Thời điểm kiểm toán: 2026-10-16
> Vai trò: Senior Full-Stack Engineer & Software Architect

---

## 1. TỔNG QUAN HỆ THỐNG & CẤU TRÚC REPOSITORY

### 1.1 Cấu trúc mã nguồn hiện có
- `cinema-app/`: Ứng dụng Full-stack Next.js (App Router), Prisma Client v6.19.3, NextAuth.js v4, cơ sở dữ liệu PostgreSQL. Chứa toàn bộ API Endpoints nghiệp vụ, schema Prisma, hệ thống test và các giao diện cho 3 phân hệ: Customer, Staff, Admin.
- `frontend/`: Dự án thiết kế giao diện ban đầu theo bản vẽ Figma (Vite / Next.js layout), chủ yếu sử dụng `mockData.ts` độc lập.
- `docs/`: Tài liệu kiểm toán, ma trận yêu cầu và báo cáo kiểm thử.

### 1.2 Quyết định kiến trúc (Architectural Decision)
- **Giữ `cinema-app/` làm ứng dụng duy nhất (Single Unified Full-Stack Application)**.
- Không vận hành 2 frontend độc lập. Toàn bộ giao diện người dùng, component và CSS đẹp từ `frontend/` được đối chiếu, chuẩn hóa và đưa vào `cinema-app/`.
- Loại bỏ hoàn toàn việc sử dụng `mockData` trên tất cả các luồng hoạt động thực tế. Dữ liệu chỉ truy xuất duy nhất từ PostgreSQL thông qua Prisma ORM và API Server.

---

## 2. PHÂN TÍCH CHẤT LƯỢNG MÃ NGUỒN (CODE QUALITY ANALYSIS)

### 2.1 Backend & API Layer (`cinema-app/src/app/api`)
- **Điểm mạnh**:
  - Đã có cấu trúc thư mục App Router rõ ràng theo từng phân hệ.
  - Sử dụng `prisma.$transaction` cho các luồng thanh toán và hủy vé.
  - Định dạng phản hồi API nhất quán thông qua `apiResponse` (`{ success, data, message, code }`).
  - Đã triển khai Centralized Error Handling với `AppError` và `handleError`.
- **Hạn chế & Lỗ hổng cần khắc phục**:
  - Lỗ hổng Privilege Escalation: Nhiều API (`admin/dashboard`, `admin/reports`, `staff/tickets/search`, `tickets/[id]/mark-used`, `staff/tickets/[id]/cancel-with-voucher`, `combos/route.ts`) chấp nhận role từ query param `?role=...` hoặc HTTP header `x-user-role`.
  - Lỗ hổng IDOR: `GET /api/tickets?user_id=...` cho phép người dùng xem vé của bất kỳ ai mà không kiểm tra session.
  - Thanh toán: Thiếu kiểm tra chữ ký số HMAC-SHA512 `vnp_SecureHash` trong `vnpay-ipn` và `vnpay-return`. Cho phép client gửi override parameters (`seat_ids`, `screening_id`).
  - Suất chiếu: `POST /api/screenings` chưa kiểm tra khoảng cách an toàn (cleaning time tối thiểu 15 phút) giữa các suất chiếu trong cùng phòng.
  - Thiếu Server-side Validation & Auth trên các endpoint CRUD: `POST /api/movies`, `PUT /api/movies/[id]`, `DELETE /api/movies/[id]`, `POST /api/screenings`.

### 2.2 Database Layer (`cinema-app/prisma/schema.prisma`)
- 11 Models hoàn chỉnh: `User`, `Movie`, `Screening`, `Seat`, `Pricing`, `Coupon`, `Combo`, `ComboReservation`, `Payment`, `Ticket`, `OrderCombo`, `Review`.
- Có đầy đủ quan hệ Cascade, Restrict, SetNull phù hợp với logic nghiệp vụ bán vé.
- Các bảng đều có `createdAt`, `updatedAt`.
- Khóa duy nhất (Unique constraints):
  - `@@unique([screeningId, code])` trên bảng `Seat` chống tạo trùng ghế cùng mã trong một suất.
  - `@@unique([ticketType])` trên `Pricing`.
  - `@@unique([code])` trên `Coupon`.
  - `@@index([screeningId, seatId])` trên `Ticket`.

### 2.3 Frontend Layer (`cinema-app/src/app`)
- Giao diện Dark Theme hiện đại, tông màu đỏ (#E63946) và vàng gold (#FFB703) điện ảnh.
- Phân hệ Customer:
  - Trang chủ & Lịch chiếu: Hiển thị phim đang chiếu/sắp chiếu từ DB.
  - Chi tiết phim: Đã loại bỏ fallback mockData, tích hợp `resolveMovieId` an toàn.
  - Chọn ghế (`screenings/[id]/seats`): Sơ đồ ghế 50 ghế (A1 - E10), hiển thị Empty/Reserved/Occupied thời gian thực, có đồng hồ đếm ngược giữ ghế.
  - Chọn combo: Danh sách combo từ DB, cập nhật tổng tiền.
  - Thanh toán & Xem vé: Hiển thị mã QR và thông tin suất chiếu.
- Phân hệ Staff:
  - Dashboard nhân viên: Thống kê trong ngày.
  - Tra cứu vé: Tìm theo SĐT, email, mã vé.
  - Soát vé: Check-in, đổi trạng thái vé Valid -> Used, chống quét trùng.
  - Hủy vé khẩn cấp sự cố: Bồi hoàn voucher 100% hoặc hoàn tiền mặt.
- Phân hệ Admin:
  - Dashboard & Thống kê doanh thu, tỷ lệ lấp đầy rạp.
  - Quản lý phim, phòng/suất chiếu, giá vé, combo, voucher.

---

## 3. TÌNH TRẠNG KIỂM THỬ BAN ĐẦU (BASELINE TEST RESULTS)

| Test Suite | File | Kết quả ban đầu | Nguyên nhân chính |
|---|---|---|---|
| Pricing & Movie ID | `__tests__/lib/runner.mjs` | **PASS (7/7)** | Đã bổ sung `lib/movie-id.ts` giải quyết lỗi thiếu module |
| TypeScript Check | `npx tsc --noEmit` | **PASS** | 0 lỗi cú pháp hoặc type mismatch |
| Error Handling & Boundaries | `__tests__/security/test-error-boundaries.mjs` | **PASS** | Bắt lỗi E-04 và xử lý database maintenance chuẩn xác |
| Staff Ticket Search | `__tests__/staff/test-staff-ticket-search.mjs` | **PASS** | Tìm kiếm theo email, số điện thoại |
| Staff Ticket Force Cancel | `__tests__/staff/test-staff-cancel-with-voucher.mjs` | **PASS** | Hủy vé sự cố rạp & cấp voucher 100% |
| Tickets API | `__tests__/tickets/test-tickets-api.mjs` | **PASS** | Lấy danh sách vé |
| Middleware Security | `__tests__/security/test-middleware.mjs` | **FAIL (1 test)** | Route `/dashboard` chưa có rewrite trỏ về `/admin/dashboard` dẫn tới 404 |
| Ticket Cancellation BR-03 | `__tests__/tickets/test-ticket-status.mjs` | **FAIL (1 test)** | Vé mẫu test có suất chiếu trong quá khứ (< 2h) nên bị hệ thống từ chối hủy hợp lệ |
| Admin / Staff UI Tests | `test-admin-ui.mjs`, `test-staff-ui.mjs`, `test-tickets-ui.mjs` | **FAIL (Assertion)** | Client components render nội dung sau khi load, chuỗi text tiêu đề cần khớp chính xác |

---

## 4. KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC
1. Sửa toàn bộ các lỗ hổng bảo mật nghiêm trọng trong Giai đoạn 2.
2. Hoàn thiện các điều kiện nghiệp vụ phòng chiếu và concurrency lock trong Giai đoạn 3.
3. Đồng bộ UI và loại bỏ mọi mockData trong Giai đoạn 4.
4. Cập nhật và bổ sung test suite toàn diện trong Giai đoạn 6.
