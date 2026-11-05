# Lumi Cinema SRS Comprehensive Upgrade & Diagram-Ready Specification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Nâng cấp toàn diện tài liệu `SRS_He_Thong_Quan_Ly_Rap_Phim.md` lên phiên bản 2.0 đồng bộ 100% với mã nguồn thực tế (ZaloPay Sandbox v2, Docker PostgreSQL 5434, Ghế Standard A1-E10 với giá vé Người lớn/Trẻ em, Partial Unique Index) và bổ sung chi tiết các luồng sự kiện (Main/Alternative Flows), bảng chuyển trạng thái (State Transition Tables), ánh xạ lớp (Class Mapping) giúp người đọc dễ dàng vẽ mọi loại sơ đồ UML (Use Case, Activity, Sequence, State, Class, ERD).

**Architecture:** Tài liệu SRS được cấu trúc theo chuẩn IEEE Std 830-1998 kết hợp mô hình đặc tả hướng đối tượng UML 2.5. Mỗi phân hệ trong Chương 4 sẽ có bảng đặc tả Use Case chi tiết (Actors, Pre/Post-conditions, Step-by-step Main Flow giữa Actor - UI - API - DB, và Exception Flows kèm mã lỗi). Chương 6 được mở rộng thêm bảng đặc tả State Machine (6 thực thể) và Class/API Mapping cùng sơ đồ Mermaid chuẩn xác.

**Tech Stack:** Markdown (GitHub Flavored Markdown), Mermaid.js Diagrams, Prisma Schema Mapping, Next.js 15 App Router API Specifications, ZaloPay Sandbox v2 API, Docker PostgreSQL 16.

**Spec:** `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md`

## Global Constraints

- Giữ nguyên quy mô rạp chuẩn của dự án: 5 phòng chiếu, mỗi phòng 50 ghế chuẩn (`STANDARD`, hàng `A` đến `E`, cột `1` đến `10`, mã `A1` đến `E10`), tổng 250 ghế.
- Phân loại giá vé theo đối tượng khán giả: Vé Thường / Người lớn (`100%` giá gốc) và Vé Trẻ em (`50%` giá gốc, khóa đối với phim nhãn `T18`).
- Cổng thanh toán trực tuyến chuẩn hóa thành **ZaloPay Sandbox v2** (`app_id: 2553`, thuật toán ký `HMAC-SHA256` với `key1` tạo đơn và `key2` xác thực IPN Callback).
- Hạ tầng CSDL chuẩn hóa thành **Docker PostgreSQL 16 Alpine** (`lumicinema_db`, cổng `5434`) và **Adminer** (`lumicinema_adminer`, cổng `8080`).
- Quy tắc đánh giá phim (`BR-06`): Mọi tài khoản đã đăng nhập (`Authenticated`) đều được phép gửi đánh giá 1-5 sao và bình luận, mỗi user 1 đánh giá/phim (hỗ trợ cập nhật lại).
- Bảo toàn 100% tính đúng đắn cú pháp của tất cả các khối sơ đồ `mermaid` trong tài liệu.

## Review Focus

- Tính đầy đủ để vẽ **Sequence Diagram**: Mỗi chức năng trong Chương 4 phải ghi rõ tên Endpoint API thực tế (ví dụ: `POST /api/seats/reserve`, `POST /api/payments/zalopay/create`), tham số đầu vào (Request Payload), truy vấn DB (Prisma Transaction) và phản hồi (HTTP Status Code + JSON Response).
- Tính đầy đủ để vẽ **Activity Diagram**: Mỗi quy trình phải tách bạch các bước hành động của Actor, bước xử lý của Hệ thống, và các điểm rẽ nhánh điều kiện (Decision Nodes: `[Ghế đã có người giữ]`, `[Cách giờ chiếu < 2 tiếng]`, `[Phim nhãn T18]`).
- Tính đầy đủ để vẽ **State Diagram**: Bảng chuyển trạng thái trong Mục 6.6 phải liệt kê đầy đủ `Trạng thái đầu (Source State)` -> `Sự kiện (Trigger)` -> `Điều kiện (Guard)` -> `Trạng thái đích (Target State)` -> `Hành động (Action)` cho cả 6 đối tượng: `Seat`, `Ticket`, `Payment`, `OrderCombo`, `Screening`, `Movie`.
- Tính đầy đủ để vẽ **Class Diagram & ERD**: Mục 6.5 và 6.7 phải mô tả rõ các thuộc tính, kiểu dữ liệu, khóa chính (`PK`), khóa ngoại (`FK`), các phương thức xử lý chính và quan hệ (`1-1`, `1-N`, `Composition`, `Dependency`).
- Đồng bộ hoàn toàn với kho 62 sơ đồ PlantUML hiện có của nhóm trong các thư mục `PlantUML_Activity_Diagrams/`, `Sequence/`, `PlantUML_State_Diagrams/`, `PlantUML_Class_Diagram/`.

---

### Task 1: Cập nhật Chương 1, 2, 3 & 5 (Hạ tầng Docker DB 5434, ZaloPay v2, Bảo mật & Concurrency)

**Files:**
- Modify: `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md:1-171`
- Modify: `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md:274-295`

**Interfaces:**
- Consumes: Cấu hình thực tế từ `docker-compose.yml`, `cinema-app/.env`, và `cinema-app/prisma/schema.prisma`.
- Produces: Chương 1 (Giới thiệu), Chương 2 (Tổng quan), Chương 3 (Giao diện bên ngoài) và Chương 5 (Yêu cầu phi chức năng) đồng bộ 100% với kiến trúc Docker PostgreSQL 16 và ZaloPay Sandbox v2.

- [x] **Step 1: Cập nhật Bảng Revision History, Mục lục và Chương 1 (Mục 1.1 - 1.5)**
  - Bổ sung phiên bản `2.0` ngày `05/11/2026`: Cập nhật kiến trúc Docker PostgreSQL 5434, cổng thanh toán ZaloPay Sandbox v2, Partial Unique Index và bổ sung đặc tả chi tiết phục vụ vẽ sơ đồ UML (Use Case, Activity, Sequence, State, Class, ERD).
  - Cập nhật Mục lục thêm mục `6.6 Đặc tả Vòng đời Trạng thái (State Machine Specifications)` và `6.7 Đặc tả Kiến trúc Lớp & Ánh xạ API (Class & Controller Specifications)`.
  - Cập nhật Mục 1.4 (Tài liệu tham khảo): Thay VNPay bằng `Tài liệu tích hợp cổng thanh toán trực tuyến ZaloPay Sandbox API v2 (AppID 2553, HMAC-SHA256)`.

- [x] **Step 2: Cập nhật Chương 2 (Mục 2.1 - 2.6: Môi trường vận hành & Giả định)**
  - Mục 2.4: Cập nhật Hệ thống CSDL sang `PostgreSQL 16 Alpine chạy trên container Docker cục bộ (lumicinema_db - cổng 5434) kèm công cụ quản trị trực quan Adminer (lumicinema_adminer - cổng 8080)`.
  - Mục 2.6: Cập nhật đối tác thanh toán sang `ZaloPay Sandbox v2` phản hồi tín hiệu Callback IPN và Return URL.

- [x] **Step 3: Cập nhật Chương 3 (Mục 3.1 - 3.4: Giao diện UI & Dịch vụ bên ngoài)**
  - Mục 3.1: Bổ sung chi tiết màu sắc chuẩn trên `SeatMap.tsx` (`#404040` Ghế trống, `#FFB703` Đang chọn, `#E63946` Đã bán, `#802229` Đang giữ chỗ) và hiển thị mã QR SVG trực tiếp bằng `<QRCodeSVG />` (`qrcode.react`).
  - Mục 3.3: Đặc tả chi tiết giao thức tích hợp **ZaloPay Sandbox API v2**:
    - Tạo đơn (`POST https://sb-openapi.zalopay.vn/v2/create`), chuỗi dữ liệu ký `app_id|app_trans_id|app_user|amount|app_time|embed_data|item` bằng `HMAC-SHA256` với `ZALOPAY_KEY1`.
    - Webhook IPN (`POST /api/payments/zalopay/callback`) kiểm tra chữ ký `mac` bằng `ZALOPAY_KEY2` (sử dụng `crypto.timingSafeEqual`).
    - Return Redirect (`GET /api/payments/zalopay/return`) xác thực checksum và đồng bộ trạng thái đơn hàng.
  - Mục 3.3 (CSDL): Mô tả kết nối Prisma ORM tới Docker PostgreSQL (`localhost:5434/lumicinema`).

- [x] **Step 4: Cập nhật Chương 5 (Mục 5.1 - 5.5: Yêu cầu phi chức năng)**
  - Mục 5.2 (`NFR-SAFE-01`): Ghi rõ cơ chế chống Double Booking 2 lớp đang chạy trong code:
    1. Tầng ứng dụng: `prisma.$transaction` sử dụng câu lệnh cập nhật có điều kiện nguyên tử (`updateMany` với `where: { status: 'EMPTY' }`, kiểm tra `count === seatIds.length`).
    2. Tầng CSDL vật lý: Ràng buộc **Partial Unique Index** `CREATE UNIQUE INDEX unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled';` chặn tuyệt đối 2 vé hợp lệ trùng ghế trong cùng suất chiếu.
  - Mục 5.5 (`NFR-BCK-01`): Cập nhật cơ chế sao lưu qua Docker Volume `lumicinema_pgdata` bền vững và sao lưu định kỳ bằng `pg_dump`.

- [x] **Step 5: Kiểm tra kết quả cập nhật Task 1**
  - Run: `Select-String -Path "SRS_He_Thong_Quan_Ly_Rap_Phim.md" -Pattern "VNPay|Supabase"`
  - Expected: Không còn tham chiếu cũ sai lệch ở Chương 1, 2, 3, 5.

---

### Task 2: Nâng cấp Chương 4 (Mục 4.1 - 4.9) với Luồng sự kiện chi tiết để dễ dàng vẽ Activity & Sequence Diagrams

**Files:**
- Modify: `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md:172-273`

**Interfaces:**
- Consumes: Các API Routes thực tế trong `cinema-app/src/app/api/` (`auth`, `reviews`, `seats`, `bookings`, `payments/zalopay`, `staff`, `admin`, `tickets`).
- Produces: Đặc tả chi tiết 9 phân hệ (Mục 4.1 đến 4.9), mỗi phân hệ đều có cấu trúc: **Tác nhân (Actors)**, **Điều kiện tiên quyết (Pre-conditions)**, **Luồng sự kiện chính (Basic Flow - từng bước 1, 2, 3...)**, **Luồng rẽ nhánh / Ngoại lệ (Alternative / Exception Flows - kèm điều kiện nút thoi & mã lỗi HTTP)**, và **Endpoint API / Bảng DB tương ứng**.

- [x] **Step 1: Chi tiết hóa Mục 4.1 (Auth & RBAC), 4.2 (Đánh giá phim), 4.3 (Đặt vé & Thanh toán ZaloPay Online)**
  - **4.1 Xác thực & Phân quyền:** Bổ sung bảng đặc tả luồng Đăng ký (`POST /api/auth/signup`), Đăng nhập (`NextAuth CredentialsProvider`), Middleware kiểm tra session JWT & phân quyền RBAC (`CUSTOMER`, `STAFF`, `ADMIN`).
  - **4.2 Đánh giá phim:** Bổ sung luồng gửi/cập nhật đánh giá (`POST /api/reviews`, `GET /api/reviews?movie_id=...`), kiểm tra đăng nhập session, upsert đánh giá (1-5 sao, tối đa 1000 ký tự) và tính lại `movie.rating`.
  - **4.3 Đặt vé & Mua Combo Online:** Viết rõ từng bước luồng giữ ghế 10 phút (`POST /api/seats/reserve`), chọn loại vé Thường (100%) / Trẻ em (50% - chặn nếu phim `T18`), giữ tồn kho combo (`ComboReservation`), áp dụng mã giảm giá (`POST /api/coupons/validate`), khởi tạo đơn (`POST /api/bookings` -> `POST /api/payments/zalopay/create`) và xử lý IPN/Return (`Valid` ticket, `OCCUPIED` seat, sinh chữ ký `HMAC-SHA256`).

- [x] **Step 2: Chi tiết hóa Mục 4.4 (Bán vé & Combo POS), 4.5 (Soát vé QR & Giao nhận Combo), 4.6 (Hủy vé & Hoàn tiền)**
  - **4.4 Bán tại quầy POS:** Luồng bán vé kèm combo (`POST /api/staff/pos`) và bán combo lẻ độc lập (`POST /api/staff/combos/sell`), thu Tiền mặt (`CASH`) hoặc Chuyển khoản (`POS_QR`), tự động xuất vé `Valid` và ghế `OCCUPIED` ngay trong 1 transaction.
  - **4.5 Soát vé & Giao nhận Combo:**
    - Luồng soát vé (`POST /api/staff/checkin`): Giải mã & đối chiếu chữ ký HMAC-SHA256, kiểm tra `status === 'Valid'`, kiểm tra khung giờ hợp lệ (từ 30 phút trước `startTime` đến `endTime`), chuyển sang `Used`.
    - Luồng giao combo (`GET /api/staff/combos?code=...`, `POST /api/staff/combos/fulfill`): Kiểm tra trạng thái `OrderCombo` (`Chưa nhận` -> `Đã nhận`), chặn tuyệt đối giao trùng.
  - **4.6 Hủy vé & Đền bù / Hoàn tiền:**
    - Luồng 4.6a (Khách tự hủy online/quầy - `POST /api/tickets/[id]/cancel`): Kiểm tra `status === 'Valid'` và `startTime - NOW() >= 2 giờ` -> Hủy vé (`Cancelled`), giải phóng ghế (`EMPTY`), sinh mã Voucher bồi hoàn 50% (`COMP50_...`, hạn 30 ngày), giữ nguyên combo.
    - Luồng 4.6b (Hủy do sự cố rạp & Đối soát hoàn tiền mặt - `POST /api/staff/tickets/[id]/cancel`, `POST /api/staff/tickets/[id]/refund`): Không ràng buộc 2 giờ -> Ghi nhận `refundStatus = 'PENDING_CASH_REFUND'` (100% giá thực trả), giải phóng ghế, hoàn kho combo chưa nhận -> Khi khách đến quầy trong 30 ngày, nhân viên xác nhận chi tiền -> Chuyển `REFUNDED_CASH` và lưu `AuditLog`.

- [x] **Step 3: Chi tiết hóa Mục 4.7 (Voucher Engine), 4.8 (Quản trị Phim, Suất chiếu, Sự cố), 4.9 (Báo cáo Doanh thu)**
  - **4.7 Quản lý Voucher:** Chi tiết công thức tính tiền giảm giá (chỉ giảm trên tiền vé, không giảm tiền combo; voucher `COMP50_` chỉ giảm 50% trên 1 vé đơn lẻ), cơ chế hoàn lượt dùng (`usedCount`) khi đơn hết hạn 10 phút.
  - **4.8 Quản trị Vận hành:**
    - Quản lý phim (`POST /api/admin/movies`, `PUT /api/admin/movies/[id]`, `DELETE` xóa mềm `isDeleted = true` / `ENDED` khi đã có suất chiếu).
    - Lên lịch suất chiếu (`POST /api/admin/screenings`): Thuật toán kiểm tra giao nhau thời gian `(newStart < existingEnd) AND (newEnd > existingStart)` trong cùng `room`, tự động sinh 50 ghế `A1..E10` trạng thái `EMPTY`.
    - Hủy suất chiếu khẩn cấp (`POST /api/admin/screenings/[id]/cancel`): Chuyển suất chiếu sang `CANCELLED`, hàng loạt vé `Valid` sang `Cancelled` + `PENDING_CASH_REFUND`, hoàn kho combo chưa nhận, ghi `AuditLog`.
  - **4.9 Báo cáo & Đối soát Tài chính (`GET /api/admin/reports`):** Công thức tính chính xác từng chỉ số: `Net Ticket Revenue`, `Combo Revenue`, `Pending Refund Amount`, `Actual Refunded Amount`.

- [x] **Step 4: Kiểm tra tính đầy đủ của Chương 4**
  - Run: `Select-String -Path "SRS_He_Thong_Quan_Ly_Rap_Phim.md" -Pattern "Luồng sự kiện chính|Luồng ngoại lệ|Endpoint"`
  - Expected: Tất cả 9 phân hệ đều có đầy đủ đặc tả luồng từng bước và điều kiện rẽ nhánh.

---

### Task 3: Nâng cấp Chương 6 & 7 (Sơ đồ Mermaid, Bảng Chuyển Trạng Thái State Machine, Đặc tả Lớp Class Diagram & Danh mục 62 Sơ đồ UML)

**Files:**
- Modify: `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md:296-631`

**Interfaces:**
- Consumes: Schema từ `cinema-app/prisma/schema.prisma` và danh sách file thực tế trong `PlantUML_Activity_Diagrams/`, `Sequence/`, `PlantUML_State_Diagrams/`, `PlantUML_Class_Diagram/`.
- Produces: Chương 6 hoàn chỉnh (Use Case, Sequence ZaloPay, Sequence Refund, Activity Combo, ERD chuẩn, **Mục 6.6 State Transition Tables & Diagrams**, **Mục 6.7 Class & API Architecture Mapping**) và Chương 7 (Ma trận truy xuất BR-FR-UML).

- [x] **Step 1: Cập nhật các sơ đồ Mermaid hiện có tại Mục 6.1, 6.2, 6.3, 6.4, 6.5**
  - Mục 6.2 (Sequence Diagram Giữ ghế & Thanh toán): Đổi `Supabase PostgreSQL` thành `Docker PostgreSQL (Port 5434)` và `Cổng VNPay` thành `ZaloPay Sandbox v2`, cập nhật đúng endpoint `/api/payments/zalopay/create`, `/api/payments/zalopay/callback` và `/api/payments/zalopay/return`.
  - Mục 6.5 (ERD): Cập nhật đầy đủ các bảng và trường khớp với `schema.prisma` (`USERS`, `MOVIES`, `SCREENINGS`, `SEATS`, `TICKETS`, `PAYMENTS`, `COMBOS`, `ORDER_COMBOS`, `COMBO_RESERVATIONS`, `COUPONS`, `REVIEWS`, `PRICING`, `AUDIT_LOGS`), cập nhật `paymentMethod` thành `"ZALOPAY | CASH | POS_QR"`.

- [x] **Step 2: Bổ sung Mục 6.6 - Đặc tả Vòng đời Trạng thái (State Machine Specifications) cho 6 Thực thể**
  - Thiết lập bảng chuyển trạng thái chuẩn UML (`Trạng thái nguồn` | `Sự kiện kích hoạt (Trigger)` | `Điều kiện biên (Guard)` | `Trạng thái đích` | `Hành động hệ thống (Action)`) kèm sơ đồ `stateDiagram-v2` cho:
    1. **Ghế ngồi (`Seat`):** `EMPTY`, `RESERVED`, `OCCUPIED`.
    2. **Vé xem phim (`Ticket` & `Refund`):** `Valid`, `Used`, `Cancelled` (`NONE`, `PENDING_CASH_REFUND`, `REFUNDED_CASH`).
    3. **Giao dịch Thanh toán (`Payment`):** `Pending`, `Completed`, `Failed`, `Refunded`.
    4. **Đơn hàng Combo (`OrderCombo` & `ComboReservation`):** `RESERVED` -> `CONFIRMED` (`Chưa nhận` -> `Đã nhận`) | `EXPIRED` | `CANCELLED`.
    5. **Suất chiếu (`Screening`):** `UPCOMING`, `ONGOING`, `ENDED`, `CANCELLED`.
    6. **Phim (`Movie`):** `UPCOMING`, `SHOWING`, `ENDED` (kèm cờ `isDeleted`).

- [x] **Step 3: Bổ sung Mục 6.7 - Đặc tả Kiến trúc Lớp & Ánh xạ Thành phần (Class Diagram Specification)**
  - Cung cấp sơ đồ `classDiagram` Mermaid và bảng mô tả chi tiết:
    - Nhóm lớp Thực thể (`Entity Classes`): Thuộc tính, kiểu dữ liệu, phương thức truy vấn.
    - Nhóm lớp Dịch vụ & Bảo mật (`Service / Utility Classes`): `ZaloPayService` (tạo MAC `key1`, verify callback `key2`), `QRSignatureService` (ký và xác thực `HMAC-SHA256`), `SeatLockService` (giải phóng ghế/combo quá hạn 10 phút).
    - Nhóm lớp Điều khiển (`Controller / API Route Classes`): Danh sách đầy đủ các API Endpoints, HTTP Method, Request Body, Response DTO và mối quan hệ phụ thuộc.

- [x] **Step 4: Mở rộng Chương 7 (Ma trận Truy xuất BR - FR - Sơ đồ UML trong dự án)**
  - Cập nhật bảng Ma trận truy xuất liên kết từng `Business Rule (BR-01 -> BR-10)` với `Functional Requirement (FR)`, `Bảng CSDL`, và đường dẫn tới các file sơ đồ PlantUML tương ứng trong dự án (`PlantUML_Activity_Diagrams/`, `Sequence/`, `PlantUML_State_Diagrams/`, `PlantUML_Class_Diagram/`).

- [x] **Step 5: Kiểm tra toàn diện tài liệu SRS sau khi hoàn tất**
  - Run: `Get-Content "SRS_He_Thong_Quan_Ly_Rap_Phim.md" | Measure-Object -Line`
  - Expected: Tài liệu đầy đủ, mạch lạc, không lỗi cú pháp Markdown/Mermaid, bao phủ 100% yêu cầu.
