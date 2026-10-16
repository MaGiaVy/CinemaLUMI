# BÁO CÁO KIỂM TOÁN AN TOÀN THÔNG TIN (SECURITY AUDIT) - CINEMALUMI

> Thời điểm kiểm toán: 2026-10-16
> Vai trò: Application Security Engineer (AppSec) & Software Architect
> Phân loại mức độ theo CVSS v3.1 / OWASP Top 10:2021

---

## 1. TỔNG QUAN PHÁT HIỆN LỖ HỔNG

| Mã lỗ hổng | Tên lỗ hổng | Mức độ nghiêm trọng | Vị trí bị ảnh hưởng | Tình trạng ban đầu |
|---|---|---|---|---|
| **SEC-01** | Bị theo dõi file bí mật `.env.local` trong Git | **CRITICAL** (CVSS 9.1) | Repository root | ĐÃ KHẮC PHỤC (Untracked) |
| **SEC-02** | Leo thang đặc quyền qua Header / Query param | **CRITICAL** (CVSS 9.8) | `api/admin/*`, `api/staff/*`, `api/tickets/*` | CẦN SỬA GẤP |
| **SEC-03** | Giả mạo giao dịch thanh toán (Thiếu HMAC Signature) | **CRITICAL** (CVSS 9.4) | `api/payments/vnpay-ipn`, `vnpay-return` | CẦN SỬA GẤP |
| **SEC-04** | Đặt vé nặc danh gán tự động vào tài khoản người khác | **HIGH** (CVSS 8.5) | `api/payments/initiate/route.ts` | CẦN SỬA GẤP |
| **SEC-05** | Truy cập dữ liệu trái phép (IDOR - Insecure Direct Object Reference) | **HIGH** (CVSS 7.5) | `api/tickets/route.ts` | CẦN SỬA GẤP |
| **SEC-06** | Thiếu xác thực trên các API quản trị danh mục (CRUD Movies, Screenings) | **HIGH** (CVSS 8.2) | `api/movies/*`, `api/screenings/*` | CẦN SỬA GẤP |
| **SEC-07** | Tranh chấp đồng thời khi giữ ghế (Race Condition) | **MEDIUM** (CVSS 6.5) | `api/seats/reserve/route.ts` | CẦN SỬA GẤP |
| **SEC-08** | Tham số ghi đè trái phép (Parameter Tampering) trong callback thanh toán | **HIGH** (CVSS 7.8) | `api/payments/vnpay-ipn/route.ts` | CẦN SỬA GẤP |

---

## 2. CHI TIẾT CÁC LỖ HỔNG & BIỆN PHÁP KHẮC PHỤC

### SEC-01: Git Tracking file bí mật `.env.local`
- **Mô tả**: File `.env.local` ở thư mục gốc chứa các khóa truy cập cơ sở dữ liệu, NextAuth Secret, Cloudinary API keys, SMTP credentials đã bị theo dõi trong Git tracking do thiếu file `.gitignore` ở thư mục gốc.
- **Biện pháp đã thực hiện**:
  1. Loại bỏ `.env.local` khỏi git cache thông qua lệnh `git rm --cached .env.local`.
  2. Tạo file `.gitignore` ở thư mục gốc chặn triệt để `.env`, `.env.local`, `.env.*`.
  3. Tạo file mẫu an toàn `.env.example` với các giá trị placeholder chuẩn, không chứa thông tin thật.
- **Khuyến cáo bổ sung**: Chủ dự án cần xoay vòng (rotate/revoke) các secret sau trên các nền tảng thật: `DATABASE_URL`, `NEXTAUTH_SECRET`, `CLOUDINARY_API_KEY`/`SECRET`, `SMTP_PASSWORD`.

### SEC-02: Leo thang đặc quyền (Privilege Escalation via Header / Query)
- **Mô tả**: Đoạn mã kiểm tra vai trò tại nhiều API:
  ```typescript
  const userRole = session?.user?.role || request.headers.get('x-user-role') || searchParams.get('role');
  ```
  Kẻ tấn công chỉ cần thêm HTTP Header `x-user-role: ADMIN` hoặc query parameter `?role=ADMIN` vào request là có thể thực hiện mọi thao tác quản trị (xem báo cáo, soát vé, hủy vé và cấp voucher 100%).
- **Biện pháp khắc phục**:
  Xóa bỏ hoàn toàn fallback đọc role từ client request. Bắt buộc xác minh từ `session?.user?.role` giải mã từ NextAuth JWT đã ký chữ ký số phía server.

### SEC-03: Giả mạo giao dịch thanh toán (Missing Signature Verification)
- **Mô tả**: Endpoint `GET/POST /api/payments/vnpay-ipn` và `api/payments/vnpay-return` chấp nhận trạng thái thanh toán thành công chỉ dựa trên tham số `status=success` hoặc `vnp_ResponseCode=00` mà không hề kiểm tra chữ ký `vnp_SecureHash` với bí mật `VNP_HASH_SECRET`. Bất kỳ ai cũng có thể giả mạo yêu cầu từ VNPay để nhận vé miễn phí.
- **Biện pháp khắc phục**:
  1. Tích hợp module kiểm tra chữ ký HMAC-SHA512 chuẩn VNPay.
  2. Đối chiếu toàn bộ query parameters với `vnp_SecureHash`.
  3. Chế độ Mock Payment riêng biệt: Chỉ cho phép trong môi trường dev/test khi có cờ cấu hình rõ ràng, phân định rạch ròi với cổng thanh toán thật.

### SEC-04: Đặt vé nặc danh gán vào tài khoản người khác
- **Mô tả**: Tại `api/payments/initiate/route.ts`:
  ```typescript
  if (!effectiveUserId) {
    const defaultCustomer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    effectiveUserId = defaultCustomer.id;
  }
  ```
  Khi người dùng chưa đăng nhập gọi API khởi tạo đơn đặt vé online, hệ thống tự động gán đơn hàng vào ID của khách hàng đầu tiên trong cơ sở dữ liệu.
- **Biện pháp khắc phục**:
  Yêu cầu bắt buộc phải đăng nhập (`getServerSession`). Nếu chưa đăng nhập, trả về ngay HTTP 401 `UNAUTHENTICATED` kèm yêu cầu đăng nhập.

### SEC-05: Truy cập dữ liệu trái phép (IDOR trên API vé)
- **Mô tả**: `GET /api/tickets?user_id=1` cho phép bất kỳ ai lấy toàn bộ danh sách vé, thông tin cá nhân và lịch sử đặt vé của tài khoản mang ID tương ứng.
- **Biện pháp khắc phục**:
  Xóa bỏ việc nhận `user_id` từ query parameter. Chỉ cho phép truy vấn vé có `userId === session.user.id`.

### SEC-06: Thiếu xác thực trên các API quản trị danh mục (CRUD)
- **Mô tả**: `POST /api/movies`, `PUT /api/movies/[id]`, `DELETE /api/movies/[id]`, `POST /api/screenings`, `POST /api/combos` không có kiểm tra quyền ADMIN, ai cũng có thể gọi trực tiếp.
- **Biện pháp khắc phục**:
  Thêm middleware/helper kiểm tra quyền ADMIN trên từng endpoint, trả về 401 nếu chưa đăng nhập và 403 nếu không phải ADMIN.

### SEC-07: Tranh chấp đồng thời khi giữ ghế (Seat Reservation Race Condition)
- **Mô tả**: Khi nhiều khách hàng cùng chọn một ghế và bấm giữ chỗ cùng lúc, việc đọc trạng thái rồi cập nhật trong 2 câu lệnh riêng biệt có thể dẫn tới việc 2 người cùng giữ 1 ghế.
- **Biện pháp khắc phục**:
  Sử dụng câu lệnh cập nhật có điều kiện nguyên tử (Atomic Conditional Update):
  ```typescript
  const updated = await tx.seat.updateMany({
    where: {
      id: { in: seatIds },
      screeningId,
      status: 'EMPTY'
    },
    data: { status: 'RESERVED', reservedUntil }
  });
  if (updated.count !== seatIds.length) {
    throw new AppError(400, 'Một hoặc nhiều ghế đã được người khác giữ trước', 'SEAT_CONFLICT');
  }
  ```

### SEC-08: Tham số ghi đè trái phép (Parameter Tampering) trong Webhook
- **Mô tả**: `vnpay-ipn` chấp nhận `overrideSeatIds`, `overrideScreeningId` từ query string, cho phép kẻ xấu đổi chỗ ngồi hoặc suất chiếu sau khi thanh toán.
- **Biện pháp khắc phục**:
  Xóa hoàn toàn các tham số override. Mọi thông tin ghế, suất chiếu, số tiền phải được đọc trực tiếp từ bản ghi `Payment` đã được tạo an toàn trong cơ sở dữ liệu.
