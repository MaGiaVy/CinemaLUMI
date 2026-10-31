# TIẾN ĐỘ TRIỂN KHAI DỰ ÁN (IMPLEMENTATION PROGRESS)
## DỰ ÁN: CINEMALUMI – HỆ THỐNG QUẢN LÝ BÁN VÉ VÀ VẬN HÀNH RẠP CHIẾU PHIM
**Trạng thái cập nhật:** 16/10/2026

---

## BẢNG TIẾN ĐỘ CHI TIẾT THEO CÁC GIAI ĐOẠN (CHECK_FIX.MD)

| Task ID | Requirement / Mục tiêu | File thay đổi | Công việc đã thực hiện | Kết quả kiểm thử | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Bỏ `x-user-role` & `?role=...` | `api/admin/*`, `api/staff/*`, `api/pricing/*`, `api/combos/*`, `api/coupons/*`, `api/reviews/*` | Xóa bỏ hoàn toàn việc đọc role từ client request. Bắt buộc dùng `getServerSession(authOptions)`. | `npx tsc --noEmit` PASS (0 errors) | ✅ **DONE_VERIFIED** |
| **SEC-02** | Chặn đặt vé online không xác thực | `api/payments/initiate/route.ts` | Bắt buộc đăng nhập (401), loại bỏ fallback gán vào defaultCustomer và chống mạo danh userId. | `npx tsc --noEmit` PASS (0 errors) | ✅ **DONE_VERIFIED** |
| **SEC-03** | Xác thực chữ ký số VNPay | `src/lib/vnpay.ts`, `api/payments/vnpay-ipn/route.ts`, `api/payments/vnpay-return/route.ts` | Tạo module HMAC-SHA512 + timingSafeEqual, verify chữ ký số trong webhook IPN và return URL. | `npx tsc --noEmit` PASS (0 errors) | ✅ **DONE_VERIFIED** |
| **SEC-04** | Bảo mật Git secret (.env.local) | `.env.local`, `.gitignore` | `git rm --cached .env.local`, tạo `.gitignore` bảo vệ biến môi trường. | `git status` xác nhận file được untrack an toàn | ✅ **DONE_VERIFIED** |
| **SEC-05** | Chống tranh chấp giữ ghế (Race condition) | `api/seats/reserve/route.ts` | Cập nhật có điều kiện nguyên tử `where: { status: 'EMPTY' }` và kiểm tra `count`. | `npx tsc --noEmit` PASS (0 errors) | ✅ **DONE_VERIFIED** |
| **SEC-06** | Chống mạo danh hủy vé của người khác | `api/tickets/[id]/cancel/route.ts` | Xóa bỏ param fallback `user_id`, kiểm tra nghiêm ngặt `currentUserId = session.user.id`. | `npx tsc --noEmit` PASS (0 errors) | ✅ **DONE_VERIFIED** |
| **SEC-07** | Chống soát vé trái phép | `api/tickets/[id]/mark-used/route.ts` | Xóa bỏ param fallback `role=STAFF`, bắt buộc phiên đăng nhập có `role === 'STAFF' \| 'ADMIN'`. | `npx tsc --noEmit` PASS (0 errors) | ✅ **DONE_VERIFIED** |
| **BIZ-01** | Chuẩn hóa 2 loại vé (Adult 100%, Child 50%) | `src/lib/pricing.ts`, DB Supabase Cloud, `admin/pricing/page.tsx` | Dọn dẹp DB, xóa loại vé dư thừa, khóa vé Trẻ em với phim T18 (BR-02). | Đã hoàn thành và verify ở commit `b09c612` | ✅ **DONE_VERIFIED** |
| **BIZ-02** | Chuẩn hóa 50 ghế Standard (A1-E10) | DB Supabase Cloud, `seats/page.tsx` | Cập nhật toàn bộ ghế về `STANDARD`, gỡ bỏ phụ thu VIP/Couple. | Đã hoàn thành và verify ở commit `b09c612` | ✅ **DONE_VERIFIED** |
