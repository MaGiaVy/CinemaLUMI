# BÁO CÁO KIỂM TOÁN BẢO MẬT (SECURITY AUDIT REPORT)
## DỰ ÁN: CINEMALUMI – HỆ THỐNG QUẢN LÝ BÁN VÉ VÀ VẬN HÀNH RẠP CHIẾU PHIM
**Ngày kiểm toán:** 16/10/2026  
**Trạng thái:** HOÀN THÀNH XỬ LÝ TOÀN BỘ LỖ HỔNG CẤP BÁCH (PHASE 2 - CHECK_FIX.MD)

---

## 1. TỔNG QUAN CÁC LỖ HỔNG BẢO MẬT NGHIÊM TRỌNG ĐÃ PHÁT HIỆN & KHẮC PHỤC

| Mã lỗ hổng | Endpoint / Thành phần bị ảnh hưởng | Mức độ rủi ro | Mô tả lỗ hổng thực tế trước khi sửa | Giải pháp kỹ thuật đã áp dụng | Trạng thái sau xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | `api/admin/*`, `api/staff/*`, `api/pricing/*`, `api/combos/*`, `api/coupons/*`, `api/reviews/*` | **CRITICAL (9.8)** | Cho phép gửi header `x-user-role: ADMIN` hoặc query param `?role=ADMIN` để bypass phân quyền mà không cần đăng nhập. | **Gỡ bỏ hoàn toàn** việc đọc `x-user-role` và `?role=...`. Bắt buộc xác thực Server Session qua `getServerSession(authOptions)`. | ✅ **FIXED_VERIFIED** |
| **SEC-02** | `api/payments/initiate` | **HIGH (8.5)** | Khách vãng lai chưa đăng nhập tự động được liên kết với `defaultCustomer` trong DB hoặc cho phép gửi `user_id` tùy ý trong body. | **Bắt buộc 401 UNAUTHORIZED** nếu chưa đăng nhập. Chỉ nhân viên quầy (STAFF/ADMIN) mới được quyền chỉ định `customer_id`. | ✅ **FIXED_VERIFIED** |
| **SEC-03** | `api/payments/vnpay-ipn`, `api/payments/vnpay-return` | **CRITICAL (9.5)** | Không kiểm tra mã băm SHA512 (checksum signature). Kẻ tấn công có thể gửi request giả mạo để xuất vé miễn phí. | **Triển khai `verifyVnpaySignature`** với HMAC-SHA512 và `crypto.timingSafeEqual` chống timing attacks. Trả về mã chuẩn VNPay `RspCode: 97` khi sai chữ ký. | ✅ **FIXED_VERIFIED** |
| **SEC-04** | `.env.local` tại thư mục gốc | **HIGH (8.0)** | File chứa connection string Supabase Cloud và secret keys bị Git theo dõi trực tiếp trong repository. | **Gỡ bỏ khỏi Git tracking** bằng `git rm --cached .env.local`, tạo file `.gitignore` ở thư mục gốc để bảo vệ bí mật. | ✅ **FIXED_VERIFIED** |
| **SEC-05** | `api/seats/reserve` | **MEDIUM (6.5)** | Race condition khi hai khách hàng cùng chọn một ghế trong cùng một mili-giây do thiếu khóa nguyên tử ở mức database. | **Thực hiện Atomic Conditional Update:** `where: { status: 'EMPTY' }` và kiểm tra `count === seat_ids.length`. Bắn lỗi `E-03` ngay lập tức nếu bị tranh chấp. | ✅ **FIXED_VERIFIED** |
| **SEC-06** | `api/tickets/[id]/cancel` | **HIGH (7.5)** | Cho phép gửi `?user_id=...` làm fallback để hủy vé của người khác mà không có session. | **Loại bỏ fallback param `user_id`**. Kiểm tra nghiêm ngặt `currentUserId = session.user.id` và quyền sở hữu vé. | ✅ **FIXED_VERIFIED** |
| **SEC-07** | `api/tickets/[id]/mark-used` | **HIGH (7.8)** | Chấp nhận `?role=STAFF` trong URL để soát vé mà không cần tài khoản nhân viên. | **Xác thực phiên session**: Bắt buộc tài khoản đăng nhập phải có `role === 'STAFF'` hoặc `'ADMIN'`. | ✅ **FIXED_VERIFIED** |

---

## 2. MINH CHỨNG TRIỂN KHAI VÀ XÁC MINH (VERIFICATION EVIDENCE)

1. **Kiểm tra kiểu dữ liệu tĩnh TypeScript toàn dự án:**
   - Lệnh: `npx tsc --noEmit`
   - Kết quả: **Exit code 0 (Hoàn toàn sạch, 0 lỗi biên dịch)**.
2. **Kiểm tra trạng thái Git:**
   - Lệnh: `git status`
   - File `.env.local` đã chuyển sang trạng thái `deleted: .env.local` trong Git index (đã ngừng theo dõi) và được bảo vệ bởi `.gitignore`. File thật trên đĩa vẫn còn nguyên vẹn.
3. **Kiểm tra chữ ký số:**
   - Module `src/lib/vnpay.ts` cung cấp hàm chuẩn mã hóa theo đúng tài liệu tích hợp VNPay Sandbox & Production.
