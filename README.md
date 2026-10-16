# 🎬 CINEMALUMI – HỆ THỐNG QUẢN LÝ BÁN VÉ VÀ VẬN HÀNH RẠP CHIẾU PHIM

> Đồ án phân tích, thiết kế hướng đối tượng (OOAD) & phát triển ứng dụng Full-stack toàn diện cho hệ thống rạp chiếu phim hiện đại.

---

## I. TỔNG QUAN HỆ THỐNG

**CinemaLUMI** là nền tảng quản lý bán vé và vận hành rạp chiếu phim tích hợp, kết nối xuyên suốt ba phân hệ đối tượng người dùng:
1. **Khách hàng (Customer)**: Đặt vé xem phim trực tuyến, chọn ghế theo thời gian thực (giữ ghế 10 phút), mua combo bắp nước, áp dụng mã giảm giá/voucher bồi hoàn, thanh toán VNPay QR sandbox, nhận vé điện tử kèm mã QR bảo mật và gửi đánh giá phim sau khi xem.
2. **Nhân viên quầy (Staff Counter)**: Bán vé trực tiếp tại quầy POS, tra cứu thông tin vé khách hàng đa tiêu chí (SĐT, Email, Mã vé, Ghế), quét mã QR soát vé check-in vào rạp (chống check-in trùng lặp), xử lý sự cố hủy vé khẩn cấp và bồi hoàn voucher 100% (UC-15) có ghi nhận nhật ký kiểm toán (Audit Log).
3. **Quản trị viên (Admin)**: Dashboard thống kê doanh thu theo ngày và mọi thời đại, số lượng vé bán, doanh thu bắp nước, tỷ lệ lấp đầy rạp, Top 5 phim doanh thu cao nhất; Báo cáo doanh thu chi tiết từng suất chiếu (UC-19) có bộ lọc theo phim, ngày, phòng; Quản lý danh mục phim, suất chiếu (đảm bảo 15 phút giãn cách vệ sinh phòng chiếu), bảng giá, phụ thu, mã khuyến mãi và kiểm duyệt bình luận.

---

## II. KIẾN TRÚC & CÔNG NGHỆ

- **Framework**: [Next.js 16 (App Router + Turbopack)](https://nextjs.org/)
- **Ngôn ngữ**: TypeScript 5, React 19
- **Cơ sở dữ liệu**: PostgreSQL (Supabase Cloud)
- **ORM**: [Prisma ORM 6](https://www.prisma.io/)
- **Xác thực & Phân quyền**: [NextAuth.js](https://next-auth.js.org/) (JWT Session, phân quyền nghiêm ngặt server-side)
- **Styling**: Tailwind CSS 4
- **Cổng thanh toán**: VNPay (Xác thực chữ ký số HMAC-SHA512 `vnp_SecureHash`, IPN Webhook, Idempotency)
- **Email & QR**: Nodemailer (Gửi vé QR code và voucher bồi hoàn), QRCode / qrcode.react

---

## III. CẤU TRÚC THƯ MỤC

```
CinemaLUMI/
├── cinema-app/                 # Ứng dụng Full-stack chính
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── (customer)/     # Phân hệ khách hàng (Đặt vé, Ghế, Checkout, Vé của tôi)
│   │   │   ├── (public)/       # Trang đăng nhập, đăng ký
│   │   │   ├── admin/          # Phân hệ Quản trị (Dashboard, Báo cáo UC-19, Phim, Suất chiếu)
│   │   │   ├── staff/          # Phân hệ Nhân viên quầy (POS, Tra cứu vé, Soát vé UC-15)
│   │   │   └── api/            # Hệ thống RESTful API an toàn
│   │   ├── components/         # UI Components tái sử dụng (SeatMap, Header, Footer...)
│   │   ├── lib/                # Tiện ích lõi (Prisma, Auth, VNPay HMAC, Pricing, Email...)
│   │   └── middleware.ts       # Middleware bảo mật phân quyền 3 vai trò
│   ├── prisma/
│   │   └── schema.prisma       # Schema CSDL chuẩn hóa 10 bảng quan hệ
│   └── __tests__/              # 19 bộ kiểm thử tự động toàn diện
├── docs/                       # Tài liệu kiểm toán & báo cáo
│   ├── audit/                  # Báo cáo Traceability, Code Audit, Security, Conflicts
│   └── testing/                # Test Plan & Test Results chi tiết
└── .env.example                # Mẫu biến môi trường an toàn (Không commit secrets)
```

---

## IV. HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH

### 1. Chuẩn bị môi trường
- Node.js version `>= 20.0.0`
- CSDL PostgreSQL (local hoặc Supabase)

### 2. Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env` trong thư mục `cinema-app/`:
```bash
cd cinema-app
cp .env.example .env
```
Điền các giá trị kết nối thực tế:
- `DATABASE_URL`: Connection string PostgreSQL.
- `NEXTAUTH_SECRET`: Khóa bí mật ký JWT Session.
- `NEXTAUTH_URL`: `http://localhost:3000`
- `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`: Thông tin cổng thanh toán VNPay Sandbox.

### 3. Cài đặt thư viện & Đồng bộ CSDL
```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Chạy ứng dụng Development
```bash
npm run dev
```
Truy cập: **[http://localhost:3000](http://localhost:3000)**

### 5. Build Production
```bash
npm run build
npm run start
```

---

## V. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

CinemaLUMI trang bị hệ thống kiểm thử tự động toàn diện gồm **19 bộ kiểm thử độc lập**:

```bash
cd cinema-app
# Chạy bộ test tính giá & resolver
npm test

# Chạy toàn bộ 19 test suites tự động
npm run test:all
```

**Bảng kết quả kiểm thử:**
- ✅ `lib/runner.mjs`: Quy tắc tính giá vé & resolver ID
- ✅ `security/test-middleware.mjs`: Phân quyền tĩnh & redirect login
- ✅ `security/test-error-boundaries.mjs`: Bắt lỗi toàn cục E-04 (HTTP 503 khi mất kết nối DB)
- ✅ `payments/test-payment-initiate.mjs`: Khởi tạo đơn, tính giá server-side, khóa ghế
- ✅ `payments/test-payment-callbacks.mjs`: Chữ ký số HMAC-SHA512 VNPay, Idempotency, chống tampering
- ✅ `tickets/test-tickets-api.mjs`: Chống IDOR, chi tiết vé, chuỗi QR ký số
- ✅ `tickets/test-ticket-status.mjs`: Hủy vé bồi hoàn 50% (BR-03), Staff soát vé, chống quét vé lần 2
- ✅ `tickets/test-tickets-ui.mjs`: Giao diện vé của tôi và chi tiết vé
- ✅ `staff/test-staff-ticket-search.mjs`: Tra cứu vé đa tiêu chí cho nhân viên quầy
- ✅ `staff/test-staff-cancel-with-voucher.mjs`: Hủy vé sự cố rạp bồi hoàn 100% (UC-15) + Audit Log
- ✅ `staff/test-staff-ui.mjs`: Giao diện quầy Staff `/staff` và `/staff/lookup`
- ✅ `admin/test-admin-dashboard.mjs`: Thống kê Dashboard hôm nay, bắp nước, tỷ lệ lấp đầy, Top 5 phim
- ✅ `admin/test-admin-reports-revenue.mjs`: Báo cáo doanh thu chi tiết suất chiếu (UC-19)
- ✅ `admin/test-admin-ui.mjs`: Giao diện Admin Console và Báo cáo
- ✅ `reviews/test-reviews-api.mjs`: Quy tắc chỉ vé Used mới được review, chống spam
- ✅ `reviews/test-review-delete-api.mjs`: Admin kiểm duyệt xóa bình luận và cập nhật điểm phim
- ✅ `reviews/test-reviews-ui.mjs`: Giao diện đánh giá phim và trang kiểm duyệt
- ✅ `email/test-email-service.mjs`: Gửi email xác nhận vé có QR và voucher đền bù
- ✅ `email/test-email-integration.mjs`: Tích hợp gửi email tự động khi hủy vé và thanh toán

---

## VI. TÀI LIỆU DỰ ÁN LIÊN QUAN

- [Bảng đối chiếu yêu cầu nghiệp vụ (Requirements Traceability)](./docs/audit/REQUIREMENTS_TRACEABILITY.md)
- [Báo cáo kiểm toán mã nguồn (Code Audit)](./docs/audit/CODE_AUDIT.md)
- [Báo cáo kiểm toán bảo mật (Security Audit)](./docs/audit/SECURITY_AUDIT.md)
- [Giải quyết xung đột nghiệp vụ (Business Rule Conflicts)](./docs/audit/BUSINESS_RULE_CONFLICTS.md)
- [Kế hoạch kiểm thử (Test Plan)](./docs/testing/TEST_PLAN.md)
- [Kết quả kiểm thử thực tế (Test Results)](./docs/testing/TEST_RESULTS.md)
