# Hệ Thống Lumi Cinema - Kế Hoạch Vá Lỗ Hổng Toàn Diện & Tích Hợp ZaloPay Sandbox

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vá triệt để 6 lỗ hổng bảo mật Backend, khắc phục lỗi Double Booking & Double Decrement kho Combo bắp nước, tích hợp cổng thanh toán ZaloPay Sandbox (kèm mã QR thanh toán động và mã QR vé điện tử thật `<QRCodeSVG />`), chuẩn hóa múi giờ Việt Nam và dọn dẹp mã nguồn thừa Frontend.

**Architecture:** 
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
- Prisma ORM 6.19 + PostgreSQL 16 (Docker Local trên port 5434).
- ZaloPay Sandbox API v2 (AppID: 2553, HMAC-SHA256 Order Signature & Callback Verification).
- Atomic Conditional Database Transactions (`prisma.$transaction`) + Partial Unique Index chống xung đột giữ chỗ.

**Tech Stack:** Next.js 16, TypeScript, Prisma, PostgreSQL 16, Docker, ZaloPay Sandbox API, `qrcode.react`, NextAuth.js.

**Spec:** Quyết định kiến trúc từ phiên phỏng vấn `/grill-me` (2026-11-02).

## Global Constraints
- Tất cả API routes nhạy cảm phải bắt buộc xác thực qua `requireAuth` hoặc `getServerSession(authOptions)`.
- Không sử dụng hardcode fallback `user_id` từ body/query params trong bất kỳ API nào.
- Đảm bảo tính tương thích ngược với dữ liệu đã seed trong Docker DB (`lumicinema` trên cổng `5434`).
- Tuyệt đối không để lộ mật khẩu, secret key thô trên client.

## Review Focus
1. Double Booking: Đảm bảo không thể tạo 2 vé hợp lệ cho cùng 1 ghế trong cùng 1 suất chiếu.
2. Double Inventory Decrement: Đảm bảo tồn kho combo chỉ bị trừ đúng 1 lần (tạm giữ tại reserve, chốt tại IPN/payment).
3. Review Security: Bắt buộc đăng nhập để đánh giá phim; chặn request nặc danh mạo danh user khác.
4. ZaloPay Callback: HMAC-SHA256 signature verification bằng `crypto.timingSafeEqual`.
5. Frontend QR & Timezone: Hiển thị đúng mã QR SVG và phân loại đúng ngày chiếu theo giờ `Asia/Ho_Chi_Minh`.

---

### Task 1: Backend Security Hardening (Auth & RBAC Guards)

**Files:**
- Modify: `cinema-app/src/app/api/pricing/surcharges/route.ts`
- Modify: `cinema-app/src/app/api/movies/upload/route.ts`
- Modify: `cinema-app/src/app/api/reviews/route.ts`
- Modify: `cinema-app/src/app/api/cron/release-seats/route.ts`
- Modify: `cinema-app/src/app/api/cron/release-combos/route.ts`

**Steps:**
- [x] Bổ sung `await requireAuth(['ADMIN'])` vào `POST /api/pricing/surcharges` để chỉ Admin mới có quyền cập nhật phụ thu.
- [x] Bổ sung `await requireAuth(['ADMIN', 'STAFF'])` vào `POST /api/movies/upload` để ngăn chặn upload tràn lan lên Cloudinary.
- [x] Cập nhật `POST /api/reviews`:
  - Loại bỏ hoàn toàn fallback `body.user_id` và `searchParams.get('user_id')`.
  - Lấy `currentUserId` từ `session.user.id`. Nếu không có session, trả về HTTP 401 `UNAUTHENTICATED`.
  - Cho phép mọi người dùng đã đăng nhập được gửi đánh giá phim (theo quyết định trong `/grill-me`).
- [x] Cập nhật `release-seats` và `release-combos` để từ chối ngay lập tức nếu `CRON_SECRET` chưa được cấu hình hoặc Authorization header không khớp `Bearer ${CRON_SECRET}`.
- [x] Kiểm tra lại các route bằng lệnh test HTTP trực tiếp.

---

### Task 2: Database Concurrency & Inventory Fixes (Double Booking & Combo Inventory)

**Files:**
- Modify: `cinema-app/prisma/schema.prisma`
- Modify: `cinema-app/src/app/api/combos/reserve/route.ts`
- Modify: `cinema-app/src/app/api/combos/release/route.ts`
- Modify: `cinema-app/src/app/api/staff/pos/combos/route.ts`
- Modify: `cinema-app/src/app/api/seats/reserve/route.ts`

**Steps:**
- [x] Cập nhật `prisma/schema.prisma`:
  - Thêm `ZaloPay` vào `enum PaymentMethod`.
  - Thêm Index cho Foreign Keys: `Payment(userId, status)`, `Ticket(userId, paymentId, screeningId)`, `Screening(movieId)`, `OrderCombo(paymentId, comboId)`.
- [x] Chạy `npx prisma db push` để đồng bộ bảng vào Docker PostgreSQL `localhost:5434`.
- [x] Tạo Partial Unique Index trong PostgreSQL qua Prisma `$executeRawUnsafe`:
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled';`
- [x] Sửa lỗi Double Inventory Decrement:
  - Trong `combos/reserve`: trừ tồn kho tạm thời và tạo bản ghi `combo_reservations` với trạng thái `RESERVED`.
  - Trong `combos/release`: bắt buộc người dùng đăng nhập; chỉ hoàn kho đối với các bản ghi `combo_reservations` có `status = 'RESERVED'` thuộc phiên của người dùng hoặc do cron dọn dẹp xử lý (tuyệt đối không nhận số lượng khống từ body).
- [x] Trong `staff/pos/combos`: bổ sung điều kiện nguyên tử `where: { id: comboId, stock: { gte: quantity } }` để chống âm kho.
- [x] Trong `seats/reserve`: đảm bảo kiểm tra nguyên tử: chỉ chuyển ghế sang `RESERVED` nếu ghế chưa bị `OCCUPIED` hoặc đang bị người khác giữ chỗ còn hiệu lực.

---

### Task 3: ZaloPay Sandbox Integration (Thay thế VNPay)

**Files:**
- Create: `cinema-app/src/lib/zalopay.ts`
- Modify: `cinema-app/src/app/api/payments/initiate/route.ts`
- Create: `cinema-app/src/app/api/payments/zalopay-ipn/route.ts`
- Create: `cinema-app/src/app/api/payments/zalopay-return/route.ts`
- Modify: `cinema-app/.env` & `cinema-app/.env.local`

**Steps:**
- [x] Thêm biến môi trường ZaloPay Sandbox vào `.env` và `.env.local`:
  ```env
  ZALOPAY_APP_ID=2553
  ZALOPAY_KEY1=PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL
  ZALOPAY_KEY2=kLtgPl8HHhfvMuD2wKfgccZZv0vugTZe
  ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
  ```
- [x] Tạo `src/lib/zalopay.ts`:
  - Hàm `createZaloPayOrder(params)`: tính `mac = CryptoJS.HmacSHA256(data, KEY1)` và gọi API ZaloPay Sandbox tạo đơn hàng, trả về `order_url` và `zp_trans_token`.
  - Hàm `verifyZaloPayCallback(dataStr, reqMac)`: tính `mac = CryptoJS.HmacSHA256(dataStr, KEY2)` và so sánh an toàn bằng `crypto.timingSafeEqual`.
- [x] Nâng cấp `api/payments/initiate`:
  - Khi phương thức thanh toán là `ZaloPay` (hoặc mặc định cho online), gọi `createZaloPayOrder`.
  - Lưu mã giao dịch ZaloPay `app_trans_id` vào trường `transactionCode` của `payments`.
  - Áp dụng Atomic Conditional Update: chỉ chuyển ghế sang `RESERVED` nếu ghế chưa bị `OCCUPIED`.
- [x] Xây dựng `api/payments/zalopay-ipn`:
  - Kiểm tra chữ ký số `verifyZaloPayCallback`.
  - Idempotency check: nếu đơn đã `Success` thì bỏ qua.
  - Cập nhật ghế sang `OCCUPIED` có kiểm tra nguyên tử.
  - Tạo vé `Ticket` với trạng thái `Valid`.
  - Cập nhật `combo_reservations` sang `COMPLETED` (không trừ tồn kho lần 2).
- [x] Xây dựng `api/payments/zalopay-return`: Xử lý điều hướng khách hàng sau khi thanh toán về trang `/payment-result`.

---

### Task 4: Frontend UI Enhancements & Cleanup

**Files:**
- Create: `cinema-app/src/lib/date-utils.ts`
- Modify: `cinema-app/src/app/page.tsx`
- Modify: `cinema-app/src/app/(customer)/screenings/[id]/checkout/page.tsx`
- Modify: `cinema-app/src/app/(customer)/payment-result/page.tsx`
- Modify: `cinema-app/src/app/(customer)/movies/[id]/page.tsx`
- Delete: `cinema-app/src/app/(customer)/payments/result/page.tsx`
- Delete: `cinema-app/src/app/(customer)/screenings/[id]/checkout/payment/page.tsx`

**Steps:**
- [ ] Tạo `src/lib/date-utils.ts` chứa hàm `getLocalDateString(date)` sử dụng `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })`.
- [ ] Áp dụng `getLocalDateString` vào trang chi tiết phim và lọc suất chiếu để tránh lệch ngày do múi giờ UTC.
- [ ] Trong `src/app/page.tsx`: kiểm tra định dạng hình ảnh trước khi đưa vào CSS `background-image` của Hero Banner; nếu trailer là link YouTube/video thì sử dụng fallback poster sắc nét.
- [ ] Thay thế khối CSS bàn cờ 25 `div` trong `checkout/page.tsx` và `payment-result/page.tsx` bằng component `<QRCodeSVG />` từ thư viện `qrcode.react`, hiển thị mã QR vé điện tử sắc nét.
- [ ] Xóa bỏ file mồ côi `src/app/(customer)/payments/result/page.tsx` và file dead code `src/app/(customer)/screenings/[id]/checkout/payment/page.tsx` (747 dòng).

---

### Task 5: End-to-End Verification & Final Review

**Steps:**
- [ ] Chạy `npx prisma generate` & `npx prisma db push`.
- [ ] Chạy `npm test` để xác minh tất cả unit tests đạt 100%.
- [ ] Chạy `npm run build` để xác minh toàn bộ ứng dụng Next.js biên dịch hoàn hảo (exit code 0).
- [ ] Kiểm tra trực tiếp các luồng giao diện:
  - Trang chủ hiển thị danh sách phim và banner mượt mà.
  - Tạo đơn đặt vé ZaloPay và hiển thị mã QR thành công.
  - Đánh giá phim khi đăng nhập thành công.
- [ ] Chạy Whole-branch Final Code Review bằng Subagent trước khi bàn giao.
