# KẾT QUẢ KIỂM THỬ THỰC TẾ HỆ THỐNG CINEMALUMI (TEST RESULTS)

**Thời điểm thực thi**: 16/10/2026  
**Môi trường kiểm thử**: Linux x86_64, Node.js v24, Next.js 16.3.6 (Turbopack), PostgreSQL (Supabase Cloud).  
**Lệnh thực thi**: `npm run test:all` (`node --experimental-strip-types __tests__/run-all-tests.mjs`).  
**Kết quả tổng quan**: **19/19 Test Suites PASSED (Tỷ lệ thành công: 100.0%)**.

---

## I. BẢNG TỔNG HỢP 19 BỘ KIỂM THỬ TỰ ĐỘNG

| STT | Tên bài kiểm thử | Trạng thái | Mã thoát | Thời gian | Số ca kiểm thử | Kết quả chi tiết |
|---|---|---|---|---|---|---|
| 1 | `lib/runner.mjs` | ✅ PASS | 0 | 0.8s | 7/7 | Đạt 100% tính giá vé VIP, Couple, Trẻ em & movie ID resolver |
| 2 | `security/test-middleware.mjs` | ✅ PASS | 0 | 1.2s | 14/14 | Đạt 100% phân quyền tĩnh 3 vai trò và redirect về login |
| 3 | `security/test-error-boundaries.mjs` | ✅ PASS | 0 | 0.9s | 8/8 | Nhận diện chuẩn 6 dạng lỗi sập DB thành 503 SYSTEM_MAINTENANCE |
| 4 | `payments/test-payment-initiate.mjs` | ✅ PASS | 0 | 4.2s | 8/8 | Chặn khách chưa đăng nhập 401, tính tiền server-side, khóa ghế |
| 5 | `payments/test-payment-callbacks.mjs` | ✅ PASS | 0 | 5.1s | 6/6 | Xác thực chữ ký VNPay HMAC-SHA512, Idempotency, chặn giả mạo |
| 6 | `tickets/test-tickets-api.mjs` | ✅ PASS | 0 | 3.8s | 8/8 | Chặn IDOR (403 khi xem vé người khác), sinh QR Code có chữ ký |
| 7 | `tickets/test-ticket-status.mjs` | ✅ PASS | 0 | 4.5s | 7/7 | Khách hủy vé cấp voucher 50%, Staff soát vé, chống quét vé lần 2 |
| 8 | `tickets/test-tickets-ui.mjs` | ✅ PASS | 0 | 3.2s | 5/5 | UI vé của tôi, chi tiết vé, mã QR, điều kiện nút hủy vé BR-03 |
| 9 | `staff/test-staff-ticket-search.mjs` | ✅ PASS | 0 | 4.1s | 8/8 | Tra cứu vé đa tiêu chí (SĐT, Email, Mã vé, Ghế), chặn 401/403 |
| 10 | `staff/test-staff-cancel-with-voucher.mjs` | ✅ PASS | 0 | 5.4s | 7/7 | Staff ép hủy vé sự cố rạp cấp voucher 100% (UC-15) + Audit Log |
| 11 | `staff/test-staff-ui.mjs` | ✅ PASS | 0 | 2.9s | 4/4 | Giao diện quầy Staff `/staff` và `/staff/lookup` render 200 OK |
| 12 | `admin/test-admin-dashboard.mjs` | ✅ PASS | 0 | 3.6s | 8/8 | Thống kê Dashboard hôm nay, bắp nước, tỷ lệ lấp đầy, Top 5 phim |
| 13 | `admin/test-admin-reports-revenue.mjs` | ✅ PASS | 0 | 3.9s | 8/8 | Báo cáo doanh thu chi tiết (UC-19), lọc theo phim, ngày, phòng chiếu |
| 14 | `admin/test-admin-ui.mjs` | ✅ PASS | 0 | 3.1s | 6/6 | Giao diện Dashboard Admin, Báo cáo và các đường dẫn rewrite |
| 15 | `reviews/test-reviews-api.mjs` | ✅ PASS | 0 | 4.2s | 9/9 | Ràng buộc chỉ vé Used mới được review, chống spam, cập nhật rating |
| 16 | `reviews/test-review-delete-api.mjs` | ✅ PASS | 0 | 3.7s | 7/7 | Admin kiểm duyệt xóa bình luận và cập nhật lại điểm phim |
| 17 | `reviews/test-reviews-ui.mjs` | ✅ PASS | 0 | 3.0s | 4/4 | Giao diện chi tiết phim & trang Admin quản lý bình luận |
| 18 | `email/test-email-service.mjs` | ✅ PASS | 0 | 1.1s | 4/4 | Gửi email xác nhận vé có QR và email thông báo voucher bồi hoàn |
| 19 | `email/test-email-integration.mjs` | ✅ PASS | 0 | 5.8s | 2/2 | Tích hợp gửi email tự động khi hoàn vé và thanh toán |

---

## II. BẰNG CHỨNG KIỂM THỬ CHI TIẾT (EVIDENCES)

### 1. Bằng chứng bảo mật (Security Tests)
- **Chặn leo thang đặc quyền (Privilege Escalation)**:
  - Request: `GET /api/admin/dashboard?role=ADMIN` (không có session cookie) -> **Status 401 UNAUTHENTICATED**.
  - Request: `POST /api/staff/tickets/39/cancel-with-voucher?role=STAFF` (không có session cookie) -> **Status 401 UNAUTHENTICATED**.
  - Request: `DELETE /api/reviews/1` với header `x-user-role: ADMIN` (không có session cookie) -> **Status 401 UNAUTHENTICATED**.
  - Request: `GET /api/admin/reports/revenue` với cookie của `CUSTOMER` -> **Status 403 FORBIDDEN**.
- **Chống IDOR (Insecure Direct Object Reference)**:
  - Request: `GET /api/tickets?user_id=1` (chưa đăng nhập) -> **Status 401 UNAUTHENTICATED**.
  - Request: `GET /api/tickets/40` với cookie của User 999 (không phải chủ nhân vé) -> **Status 403 FORBIDDEN**: *"Bạn không có quyền truy cập thông tin vé này (Vé thuộc về người dùng khác)"*.
- **Chống Parameter Tampering & Giả mạo chữ ký VNPay**:
  - Request: `GET /api/payments/vnpay-ipn?...&vnp_SecureHash=0000000000000000` -> **Status 400 Bad Request, RspCode: '97' (Invalid Signature)**.
  - Request: `GET /api/payments/vnpay-ipn` với chữ ký HMAC-SHA512 chuẩn do server ký -> **Status 200 OK, RspCode: '00' (Confirm Success)**.
  - Idempotency Test: Gửi webhook IPN lần 2 cho cùng 1 payment -> **RspCode: '02' (Order already confirmed)**, không sinh vé trùng lặp.
- **Chống Race Condition khi giữ ghế**:
  - Cập nhật nguyên tử với điều kiện `where: { id: seatId, status: 'EMPTY' }`. Hai request đồng thời chỉ có 1 request thành công giữ ghế, request thứ hai trả về lỗi ghế đã bị giữ.

### 2. Bằng chứng nghiệp vụ cốt lõi (Business Rules)
- **Quy tắc BR-03 (Khách tự hủy vé)**:
  - Hủy vé trước giờ chiếu >= 2 giờ: Vé chuyển sang `Cancelled`, ghế giải phóng về `EMPTY`, hệ thống tự sinh mã Coupon giảm giá 50% có hạn 30 ngày.
  - Hủy lại vé đã `Cancelled` -> **Status 400 TICKET_ALREADY_CANCELLED**.
- **Quy tắc UC-15 (Nhân viên quầy ép hủy vé sự cố rạp)**:
  - Vé chuyển sang `Cancelled`, ghế giải phóng về `EMPTY`, hoàn trả 100% bằng voucher bồi hoàn đền bù khách hàng (`discountValue: 100`).
  - Ghi nhận Audit Log chi tiết với lý do sự cố và mã nhân viên thực hiện.
- **Quy tắc Soát vé Check-in**:
  - Quét vé hợp lệ -> Chuyển sang `Used` kèm `checked_in_at`.
  - Quét lại vé đã `Used` -> Báo lỗi **TICKET_ALREADY_USED** (Chống gian lận vé vào rạp 2 lần).
  - Quét vé đã `Cancelled` -> Báo lỗi **TICKET_CANCELLED**.
- **Quy tắc Đánh giá phim**:
  - Khách chưa từng có vé `Used` cho phim -> Báo lỗi **403 FORBIDDEN**: *"Bạn chỉ được đánh giá phim sau khi đã xem"*.
  - Khách đã có vé `Used` -> Gửi đánh giá thành công, tự động tính lại điểm trung bình của bộ phim.

### 3. Bằng chứng Production Build
- Lệnh: `npm run build`
- Kết quả: `✓ Compiled successfully in 1101ms`, `✓ Finished TypeScript in 4.1s`, `✓ Generating static pages (22/22) in 701ms`.
- Không có bất kỳ lỗi linter hoặc type check nào.
