# KẾ HOẠCH KIỂM THỬ HỆ THỐNG CINEMALUMI (TEST PLAN)

## I. MỤC TIÊU KIỂM THỬ (TEST OBJECTIVES)

Kế hoạch kiểm thử này nhằm đảm bảo hệ thống quản lý bán vé và vận hành rạp chiếu phim **CinemaLUMI** đáp ứng 100% các tiêu chí chất lượng, nghiệp vụ theo tài liệu SRS đã phê duyệt, và các tiêu chuẩn bảo mật hệ thống thanh toán:
1. **Tính chính xác của nghiệp vụ (Business Integrity)**:
   - Quy tắc tính giá vé phân cấp đối tượng và ghế (`calculateTicketPrice`).
   - Giữ ghế 10 phút đếm ngược (`HOLD_MINUTES = 10`), tự động giải phóng ghế khi hết hạn.
   - Cơ chế hủy vé của khách hàng trước giờ chiếu ít nhất 2 giờ, cấp voucher giảm giá 50% có hạn 30 ngày.
   - Nhân viên quầy xử lý sự cố rạp chiếu, ép hủy vé và hoàn tiền 100% bằng voucher đền bù theo quy chuẩn UC-15.
   - Chặn quét vé check-in trùng lặp (chỉ vé trạng thái `Valid` mới được chuyển sang `Used`).
   - Đánh giá phim chỉ áp dụng cho khách hàng đã từng xem phim (có vé `Used`).
2. **An toàn & Bảo mật ứng dụng (Security & Access Control)**:
   - Xóa bỏ 100% lỗ hổng leo thang đặc quyền qua query parameter (`?role=`) và custom headers (`x-user-role`).
   - Bắt buộc kiểm tra phiên đăng nhập JSON Web Token (NextAuth Session) phía Server.
   - Chống tấn công giả mạo đối tượng (IDOR) trên API vé (`/api/tickets`).
   - Chống tấn công sửa đổi tham số (Parameter Tampering) trên luồng thanh toán VNPay.
   - Xác thực chữ ký số HMAC-SHA512 chuẩn VNPay (`vnp_SecureHash`) trên Webhook IPN và Return URL.
   - Kiểm tra tính nguyên tử (Database Transaction) và xử lý trùng lặp (Idempotency) khi nhận callback.
   - Chống Race Condition khi nhiều khách hàng cùng chọn giữ 1 ghế đồng thời qua điều kiện nguyên tử `status: 'EMPTY'`.
3. **Tính sẵn sàng của giao diện & Hệ thống (UI & Production Build)**:
   - Giao diện Admin Console (`/admin`, `/admin/dashboard`, `/admin/reports`).
   - Giao diện Nhân viên quầy (`/staff`, `/staff/lookup`).
   - Giao diện Khách hàng (`/movies/[id]`, `/screenings/[id]/seats`, `/tickets`).
   - Hệ thống bắt lỗi toàn cục và cơ chế E-04 (HTTP 503 khi cơ sở dữ liệu ngắt kết nối).

---

## II. PHẠM VI KIỂM THỬ (TEST SCOPE)

### 1. Phân hệ Khách hàng (Customer)
- Đăng ký, đăng nhập tài khoản.
- Xem danh sách phim, chi tiết phim, lịch chiếu phim.
- Chọn suất chiếu, xem sơ đồ 50 ghế (A1 - E10).
- Giữ ghế trong 10 phút với khóa nguyên tử.
- Chọn loại vé (Thường 100%, Trẻ em 50%, Sinh viên 80%, Cao tuổi 70%).
- Chọn combo bắp nước và số lượng (ràng buộc tồn kho).
- Áp dụng mã giảm giá / Voucher bồi hoàn (tối đa 1 voucher / đơn).
- Khởi tạo thanh toán VNPay và chuyển hướng sandbox an toàn.
- Xem danh sách vé đã đặt và chi tiết vé điện tử kèm mã QR chứa chữ ký số.
- Đánh giá phim sau khi xem (vé trạng thái `Used`).

### 2. Phân hệ Nhân viên quầy (Staff Counter)
- Đăng nhập tài khoản nhân viên quầy (`STAFF`).
- Bán vé trực tiếp tại quầy và in vé/xuất vé điện tử.
- Tra cứu vé theo Số điện thoại, Email, Mã vé (#LMC-XXXXXX), Số ghế.
- Quét mã QR soát vé check-in khách vào rạp (chuyển trạng thái sang `Used`).
- Chống check-in vé đã dùng hoặc vé đã bị hủy.
- Xử lý sự cố rạp chiếu: ép hủy vé khẩn cấp và cấp voucher bồi hoàn 100% (UC-15).

### 3. Phân hệ Quản trị viên (Admin)
- Dashboard thống kê tổng quan doanh thu hôm nay, số vé, doanh thu bắp nước, tỷ lệ lấp đầy.
- Thống kê Top 5 phim doanh thu cao nhất mọi thời đại.
- Báo cáo doanh thu chi tiết theo từng suất chiếu (UC-19), hỗ trợ lọc theo phim, ngày, phòng chiếu.
- Quản lý danh mục phim, suất chiếu (đảm bảo 15 phút giãn cách vệ sinh giữa 2 suất trong cùng phòng).
- Quản lý giá vé, phụ thu, mã khuyến mãi.
- Kiểm duyệt và xóa các bình luận tiêu cực / vi phạm.

---

## III. CHIẾN LƯỢC KIỂM THỬ (TEST STRATEGY & SUITES)

Hệ thống được kiểm thử thông qua 19 bộ kiểm thử tự động độc lập:

| STT | Suite File | Nội dung kiểm thử |
|---|---|---|
| 1 | `__tests__/lib/runner.mjs` | Kiểm thử hàm nghiệp vụ `calculateTicketPrice` và resolver `resolveMovieId` |
| 2 | `__tests__/security/test-middleware.mjs` | Kiểm thử Middleware phân quyền tĩnh 3 vai trò CUSTOMER, STAFF, ADMIN |
| 3 | `__tests__/security/test-error-boundaries.mjs` | Kiểm thử cơ chế bắt lỗi toàn cục E-04 (HTTP 503 khi DB mất kết nối) |
| 4 | `__tests__/payments/test-payment-initiate.mjs` | Kiểm thử khởi tạo thanh toán, tính giá server-side, khóa ghế tạm |
| 5 | `__tests__/payments/test-payment-callbacks.mjs` | Kiểm thử Webhook VNPay IPN, Return URL, chữ ký HMAC-SHA512, Idempotency |
| 6 | `__tests__/tickets/test-tickets-api.mjs` | Kiểm thử bảo mật IDOR vé, lấy danh sách vé cá nhân, QR Code Payload |
| 7 | `__tests__/tickets/test-ticket-status.mjs` | Kiểm thử khách hủy vé BR-03 (Voucher 50%), Staff soát vé, chống check-in trùng |
| 8 | `__tests__/tickets/test-tickets-ui.mjs` | Kiểm thử tích hợp UI vé, hiển thị QR và nút hủy vé có điều kiện |
| 9 | `__tests__/staff/test-staff-ticket-search.mjs` | Kiểm thử API tra cứu vé đa tiêu chí (Phone, Email, Mã vé, Ghế) |
| 10 | `__tests__/staff/test-staff-cancel-with-voucher.mjs` | Kiểm thử Staff ép hủy vé sự cố rạp bồi hoàn 100% (UC-15) và ghi Audit Log |
| 11 | `__tests__/staff/test-staff-ui.mjs` | Kiểm thử giao diện quầy nhân viên `/staff` và `/staff/lookup` |
| 12 | `__tests__/admin/test-admin-dashboard.mjs` | Kiểm thử API thống kê Dashboard Admin hôm nay và mọi thời đại |
| 13 | `__tests__/admin/test-admin-reports-revenue.mjs` | Kiểm thử API báo cáo doanh thu chi tiết suất chiếu (UC-19) |
| 14 | `__tests__/admin/test-admin-ui.mjs` | Kiểm thử giao diện Admin Console, Dashboard và Báo cáo doanh thu |
| 15 | `__tests__/reviews/test-reviews-api.mjs` | Kiểm thử quy tắc đánh giá (chỉ vé Used mới được review), tính rating trung bình |
| 16 | `__tests__/reviews/test-review-delete-api.mjs` | Kiểm thử Admin kiểm duyệt xóa bình luận và cập nhật lại điểm phim |
| 17 | `__tests__/reviews/test-reviews-ui.mjs` | Kiểm thử giao diện đánh giá phim và trang kiểm duyệt bình luận |
| 18 | `__tests__/email/test-email-service.mjs` | Kiểm thử gửi email xác nhận vé kèm QR Code và email voucher đền bù |
| 19 | `__tests__/email/test-email-integration.mjs` | Kiểm thử tích hợp trigger gửi email tự động khi hủy vé và thanh toán |
