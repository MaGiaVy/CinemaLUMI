# Lumi Cinema 63 UML Diagrams Comprehensive Synchronization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chỉnh sửa và đồng bộ hóa toàn bộ 51/63 file sơ đồ PlantUML (`.puml`) đang có điểm lệch trong cả 4 thư mục (`PlantUML_Activity_Diagrams/`, `PlantUML_State_Diagrams/`, `PlantUML_Class_Diagram/`, `Sequence/`) cùng bản sao trong `cinema-app/` để khớp 100% với tài liệu `SRS_He_Thong_Quan_Ly_Rap_Phim.md` (Phiên bản 2.0) và mã nguồn thực tế (`cinema-app/`).

**Architecture:** Chia công việc chỉnh sửa theo 4 nhóm miền sơ đồ độc lập (Task 1: Activity Diagrams, Task 2: State & Class Diagrams, Task 3: Sequence Diagrams 01–19, Task 4: Sequence Diagrams 20–38) để các Subagents thực thi song song (`dispatching-parallel-agents`) mà không xung đột file. Sau khi cập nhật toàn bộ `.puml` ở thư mục gốc `d:/cinema_project/`, đồng bộ tự động 100% sang `d:/cinema_project/cinema-app/` và dọn dẹp các file nháp dư thừa (`test_05.puml`).

**Tech Stack:** PlantUML (`.puml`), Prisma Schema (`cinema-app/prisma/schema.prisma`), Next.js 15 App Router REST APIs, ZaloPay Sandbox v2 (`app_id: 2553`, `HMAC-SHA256`), Docker PostgreSQL 16 (`localhost:5434`).

**Spec:**
- Tài liệu đặc tả: `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md`
- Báo cáo kiểm toán chi tiết: `d:/cinema_project/BAO_CAO_RA_SOAT_TOAN_BO_63_SO_DO_UML.md`

## Global Constraints

- **Cổng thanh toán:** Thay thế toàn bộ `VNPay`, `MoMo`, `vnp_ResponseCode == "00"`, `HMAC-SHA512` thành **ZaloPay Sandbox v2** (`app_id: 2553`, `POST /api/payments/zalopay/create` / `POST /api/payments/initiate`, Webhook IPN `POST /api/payments/zalopay/callback` / `POST /api/payments/zalopay-ipn` với `return_code == 1`, Return URL `GET /api/payments/zalopay/return` / `GET /api/payments/zalopay-return`, chữ ký `HMAC-SHA256` với `ZALOPAY_KEY1` & `ZALOPAY_KEY2`).
- **Hạ tầng Cơ sở dữ liệu:** Thay thế mọi tham chiếu `Supabase` bằng **Docker PostgreSQL 16 (Port 5434) / Prisma ORM**.
- **Thời gian giữ chỗ & Timeout giao dịch:** Chuẩn hóa thống nhất là **10 phút (`HOLD_MINUTES = 10`, `reservedUntil = NOW() + 10 phút`)**; xóa bỏ mọi chỗ ghi nhầm `15 phút`.
- **Quy mô ghế & Phân loại giá vé (`BR-01`, `BR-02`):** 5 phòng chiếu × 50 ghế chuẩn `STANDARD` (`A1`–`E10`), giữ tối đa 8 ghế/giao dịch; Vé Thường (`100%`) và Vé Trẻ em (`50%`, tự động khóa đối với phim nhãn `T18`); nhãn độ tuổi chuẩn: `P`, `C13`, `T18`.
- **Tên bảng & Enum chuẩn `schema.prisma`:**
  - `SeatStatus`: `EMPTY`, `RESERVED`, `OCCUPIED` (không dùng `BOOKED`).
  - `PaymentStatus`: `Pending`, `Success`, `Failed`, `Refunded` (không dùng `PAID`).
  - `TicketStatus`: `Valid`, `Used`, `Cancelled` (kèm trạng thái hoàn tiền trong SRS: `NONE`, `PENDING_CASH_REFUND`, `REFUNDED_CASH`).
  - `OrderCombo`: Dùng trường `isDelivered: Boolean` (`false` = Chưa nhận, `true` = Đã nhận) và `deliveredAt: DateTime?` trên bảng `order_combos` gắn với `payments` (không bịa bảng `Order` riêng).
  - `ComboReservation`: Giữ kho tạm 10 phút với `status`: `RESERVED`, `COMPLETED`/`CONFIRMED`, `RELEASED`/`EXPIRED`.
  - `MovieStatus`: `SHOWING`, `UPCOMING`, `ENDED` kèm cờ xóa mềm `isDeleted: Boolean` (`BR-07`, không dùng `ACTIVE`/`INACTIVE`).
  - `ScreeningStatus`: `UPCOMING`, `SHOWING`, `ENDED`, `CANCELLED`; công thức chống trùng lịch phòng chiếu: `endTime = startTime + duration + 15 phút dọn phòng` (`BR-08`).
- **Đồng bộ thư mục:** Mọi thay đổi trên `d:/cinema_project/<Folder>` phải được copy đồng bộ 100% sang `d:/cinema_project/cinema-app/<Folder>`.

## Review Focus

- Không còn bất kỳ từ khóa `VNPay`, `MoMo`, `Supabase`, `15 phút`, `BOOKED`, `PAID`, `/api/auth/register`, hay bảng `Order` giả định nào trong toàn bộ các file `.puml`.
- Mọi file `.puml` phải bắt đầu bằng `@startuml` và kết thúc bằng `@enduml` hợp lệ, không lỗi cú pháp PlantUML.
- Các mã yêu cầu (`FR-xxx`, `BR-01` -> `BR-10`) trong chú thích của sơ đồ phải khớp chính xác với Chương 4 và Chương 7 của `SRS_He_Thong_Quan_Ly_Rap_Phim.md` v2.0.
- Các đường dẫn API Endpoint trên Sequence và Activity Diagrams phải khớp với danh mục API thực tế của `cinema-app`.
- Hai bộ thư mục ở gốc (`d:/cinema_project/`) và trong `cinema-app/` phải có mã băm SHA-256 giống hệt nhau sau khi hoàn tất.

---

### Task 1: Chỉnh sửa & Đồng bộ bộ Sơ đồ Hoạt động (`PlantUML_Activity_Diagrams/`)

**Files:**
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/01_dang_nhap.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/02_dang_ky.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/05_dat_ve_combo_online.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/06_ban_ve_tai_quay.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/07_ban_combo_tai_quay.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/08_soat_ve.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/10_khach_huy_ve.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/13_quan_ly_phim.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/14_quan_ly_suat_chieu.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/15_huy_suat_chieu_khan_cap.puml`
- Modify: `d:/cinema_project/PlantUML_Activity_Diagrams/README.md`
- Delete: `d:/cinema_project/PlantUML_Activity_Diagrams/test_05.puml` (và file nháp tương ứng trong `cinema-app/`)
- Sync: `d:/cinema_project/cinema-app/PlantUML_Activity_Diagrams/*`

**Interfaces:**
- Consumes: Chi tiết lỗi từ Mục 1 của `d:/cinema_project/BAO_CAO_RA_SOAT_TOAN_BO_63_SO_DO_UML.md` và Chương 4 của `SRS_He_Thong_Quan_Ly_Rap_Phim.md`.
- Produces: 17 file `.puml` chuẩn (`01` -> `17`) + `README.md` đồng bộ ở cả thư mục gốc và `cinema-app/`.

- [x] **Step 1: Cập nhật nhóm Auth & Đặt vé Online (`01`, `02`, `05`, xóa `test_05.puml`)**
  - `01_dang_nhap.puml`: Sửa điều hướng Admin thành `/admin (Admin Dashboard)`.
  - `02_dang_ky.puml`: Sửa endpoint từ `POST /api/auth/register` thành `POST /api/auth/signup`, bổ sung bước chuẩn hóa `email.toLowerCase().trim()`.
  - `05_dat_ve_combo_online.puml`:
    - Đổi Swimlane `|Cổng thanh toán VNPay|` thành `|Cổng ZaloPay Sandbox v2|`.
    - Bổ sung giới hạn chọn tối đa 08 ghế/giao dịch (`MAX_SEATS = 8`), khóa lựa chọn vé Trẻ em (50%) nếu phim có nhãn `T18` (`BR-02`), và ghi chú Partial Unique Index `unique_active_ticket`.
    - Thay toàn bộ bước gọi/nhận `VNPay` bằng `ZaloPay Sandbox v2 (app_id: 2553, HMAC-SHA256 ZALOPAY_KEY1/KEY2, Callback IPN & Return URL)` và hiển thị mã QR bằng `<QRCodeSVG />`.
  - Xóa file nháp `test_05.puml` ở cả 2 thư mục.

- [x] **Step 2: Cập nhật nhóm Nghiệp vụ Quầy POS, Soát vé & Khách hủy vé (`06`, `07`, `08`, `10`)**
  - `06_ban_ve_tai_quay.puml`: Bổ sung kiểm tra khóa vé Trẻ em với phim `T18` (`BR-02`), thêm bước tùy chọn chọn kèm Combo bắp nước tại quầy (`OrderCombo.isDelivered = true`).
  - `07_ban_combo_tai_quay.puml`: Ghi rõ khi thanh toán POS thành công (`Payment.status = 'Success'`), thiết lập `OrderCombo.isDelivered = true` (`Đã nhận`) và `deliveredAt = NOW()` ngay lập tức.
  - `08_soat_ve.puml`: Ghi rõ điều kiện khung giờ hợp lệ: `Từ 30 phút trước giờ bắt đầu chiếu (startTime - 30p) đến thời điểm kết thúc suất chiếu (endTime)` (`FR-CHK-01`).
  - `10_khach_huy_ve.puml`: Đồng bộ theo chuẩn `BR-03` & `FR-CAN-01` (Khách hàng đã đăng nhập hủy vé online trước `>= 2 giờ` qua `POST /api/tickets/[id]/cancel` -> Giải phóng ghế `EMPTY`, sinh mã `COMP50_[TicketID]_[Random]` hạn 30 ngày gắn với `userId`, gửi Email thông báo, giữ nguyên hiệu lực Combo).

- [x] **Step 3: Cập nhật nhóm Quản trị Admin (`13`, `14`, `15`) & `README.md`**
  - `13_quan_ly_phim.puml`: Sửa luồng nhánh `Xóa / Ngừng chiếu phim (DELETE /api/movies/[id])`: Kiểm tra nếu có suất chiếu `UPCOMING`/`SHOWING` thì chặn xóa (`400 Bad Request`); nếu đã có vé lịch sử thì thực hiện Soft Delete (`status = 'ENDED'`, `isDeleted = true` theo `BR-07`), kết thúc tại `stop` (không nối nhầm vào bước nhập form).
  - `14_quan_ly_suat_chieu.puml`: Sửa công thức tính giờ kết thúc: `endTime = startTime + Thời lượng phim (duration) + 15 phút dọn vệ sinh phòng chiếu` (`BR-08`).
  - `15_huy_suat_chieu_khan_cap.puml`: Ghi rõ chuyển trạng thái suất chiếu sang `CANCELLED / ENDED`, hủy toàn bộ vé `Valid` -> `Cancelled` (`PENDING_CASH_REFUND` 100%), giải phóng ghế `EMPTY`, hoàn kho `Combo.stock` cho các combo chưa nhận (`isDelivered = false`), và ghi `AuditLog`.
  - `README.md`: Thay `VNPay` bằng `ZaloPay Sandbox v2`.

- [x] **Step 4: Đồng bộ sang `cinema-app/PlantUML_Activity_Diagrams/` và kiểm tra**
  - Run: `Copy-Item -Path "d:/cinema_project/PlantUML_Activity_Diagrams/*" -Destination "d:/cinema_project/cinema-app/PlantUML_Activity_Diagrams/" -Force ; Select-String -Path "d:/cinema_project/PlantUML_Activity_Diagrams/*.puml" -Pattern "VNPay|api/auth/register"`
  - Expected: Không còn kết quả khớp lỗi cũ.

---

### Task 2: Chỉnh sửa & Đồng bộ bộ Sơ đồ Trạng thái (`PlantUML_State_Diagrams/`) và Sơ đồ Lớp (`PlantUML_Class_Diagram/`)

**Files:**
- Modify: `d:/cinema_project/PlantUML_State_Diagrams/state_seat.puml`
- Modify: `d:/cinema_project/PlantUML_State_Diagrams/state_ticket.puml`
- Modify: `d:/cinema_project/PlantUML_State_Diagrams/state_payment.puml`
- Modify: `d:/cinema_project/PlantUML_State_Diagrams/state_combo.puml`
- Modify: `d:/cinema_project/PlantUML_State_Diagrams/state_screening.puml`
- Modify: `d:/cinema_project/PlantUML_State_Diagrams/state_movie.puml`
- Modify: `d:/cinema_project/PlantUML_Class_Diagram/class_diagram_lumicinema.puml`
- Modify: `d:/cinema_project/PlantUML_Class_Diagram/README.md`
- Sync: `d:/cinema_project/cinema-app/PlantUML_State_Diagrams/*` & `d:/cinema_project/cinema-app/PlantUML_Class_Diagram/*`

**Interfaces:**
- Consumes: Chi tiết lỗi từ Mục 2 của `d:/cinema_project/BAO_CAO_RA_SOAT_TOAN_BO_63_SO_DO_UML.md` và Mục 6.5, 6.6, 6.7 của `SRS_He_Thong_Quan_Ly_Rap_Phim.md`.
- Produces: 6 file State Diagrams và 1 file Master Class Diagram + `README.md` khớp 100% với Bảng chuyển trạng thái Mục 6.6 và Kiến trúc Lớp Mục 6.7 trong SRS v2.0.

- [x] **Step 1: Cập nhật 6 file State Diagrams (`state_seat`, `state_ticket`, `state_payment`, `state_combo`, `state_screening`, `state_movie`)**
  - `state_seat.puml`: Đổi `FR-SEL-01` -> `FR-BOK-02` (tối đa 8 ghế/lần), đổi `VNPay` -> `ZaloPay Sandbox v2`, bổ sung ghi chú Partial Unique Index `unique_active_ticket` và nhánh `EMPTY --> [*] : Suất chiếu kết thúc / Bị hủy`.
  - `state_ticket.puml`: Sửa `15 phút` -> `10 phút`, đổi `VNPay IPN` -> `ZaloPay Sandbox v2`, sửa khung giờ soát vé `[startTime - 30p <= NOW() <= endTime]`, chuẩn hóa 3 trạng thái con bên trong `Cancelled` gồm `NONE (Đã cấp Voucher COMP50_ 50%)`, `PENDING_CASH_REFUND (Chờ hoàn tiền mặt 100%)` --> `REFUNDED_CASH (Đã hoàn tiền mặt 100% & lưu AuditLog)`.
  - `state_payment.puml`: Sửa toàn bộ `VNPay`, `vnp_ResponseCode == "00"`, `SHA512`, `15 phút` thành `ZaloPay Sandbox v2 (app_id: 2553)`, `return_code == 1`, `HMAC-SHA256 (ZALOPAY_KEY1 / ZALOPAY_KEY2)`, timeout `10 phút`.
  - `state_combo.puml`: Bổ sung đầy đủ 2 giai đoạn khớp với SRS Mục 6.6.4:
    1. Giai đoạn giữ kho tạm (`ComboReservation`): `[*] --> RESERVED` (trừ tạm `Combo.stock`, giữ 10 phút) -> `EXPIRED / RELEASED` (hoàn lại `Combo.stock`) hoặc `CONFIRMED` (khi thanh toán thành công).
    2. Giai đoạn thực hiện đơn (`OrderCombo`): `PENDING_PICKUP (Chưa nhận, isDelivered = false)` -> `PICKED_UP (Đã nhận, isDelivered = true, deliveredAt = NOW())` hoặc `CANCELLED (Hủy sự cố rạp trước khi nhận -> hoàn lại Combo.stock)`.
  - `state_screening.puml`: Sửa `FR-ADM-04` -> `FR-ADM-03` ở bước tạo suất chiếu, bổ sung điều kiện `[Không giao cắt giờ chiếu + 15p dọn phòng (BR-08)]`, tự sinh 50 ghế `A1..E10` (`BR-01`) và ghi `AuditLog` khi `CANCELLED`.
  - `state_movie.puml`: Bổ sung chuyển trạng thái `ENDED --> SHOWING : Admin mở chiếu lại phim (Re-release) [isDeleted = false]`.

- [x] **Step 2: Cập nhật Master Class Diagram (`class_diagram_lumicinema.puml` & `README.md`)**
  - Thêm `ZaloPay` vào `enum PaymentMethod`.
  - Bổ sung các thuộc tính còn thiếu trong `Movie` (`- isDeleted: Boolean`, `- director: String`, `- cast: String`) và `Combo` (`- reservedUntil: DateTime`).
  - Bổ sung lớp thực thể `AuditLog` (nhật ký kiểm toán) và 3 lớp Dịch vụ hạ tầng (`ZaloPayService`, `QRSignatureService`, `SeatExpirationService`) theo đúng Mục 6.7 của SRS.
  - Cập nhật các khối `note` trên sơ đồ và nội dung `README.md`: Thay `VNPay / Momo (SHA512)` bằng `ZaloPay Sandbox v2 (app_id: 2553, HMAC-SHA256 KEY1/KEY2)` và bổ sung ghi chú về Partial Unique Index `unique_active_ticket`.

- [x] **Step 3: Đồng bộ sang `cinema-app/` và kiểm tra**
  - Run: `Copy-Item -Path "d:/cinema_project/PlantUML_State_Diagrams/*" -Destination "d:/cinema_project/cinema-app/PlantUML_State_Diagrams/" -Force ; Copy-Item -Path "d:/cinema_project/PlantUML_Class_Diagram/*" -Destination "d:/cinema_project/cinema-app/PlantUML_Class_Diagram/" -Force ; Select-String -Path "d:/cinema_project/PlantUML_State_Diagrams/*.puml", "d:/cinema_project/PlantUML_Class_Diagram/*.puml" -Pattern "VNPay|15 phút"`
  - Expected: Không còn kết quả khớp lỗi cũ.

---

### Task 3: Chỉnh sửa & Đồng bộ bộ Sơ đồ Tuần tự Phần 1 (`Sequence/01..19`)

**Files:**
- Modify: Các file cần cập nhật trong `d:/cinema_project/Sequence/` từ `01` đến `18`:
  - `01_dang_ky_tai_khoan.puml`
  - `04_mua_ve_va_dat_combo_online_tong_quan.puml`
  - `05_xem_phim_va_suat_chieu.puml`
  - `06_chon_ghe_va_giu_cho.puml`
  - `07_chon_loai_ve.puml`
  - `08_them_combo_vao_don_hang.puml`
  - `09_ap_dung_voucher.puml`
  - `10_thanh_toan_online.puml`
  - `11_thanh_toan_vnpay_momo.puml`
  - `12_ban_ve_tai_quay_pos.puml`
  - `13_ban_combo_tai_quay_pos.puml`
  - `14_soat_ve_vao_rap.puml`
  - `15_giao_nhan_combo_online.puml`
  - `18_huy_ve_su_co_hoan_tien_mat.puml`
- Sync: `d:/cinema_project/cinema-app/Sequence/`

**Interfaces:**
- Consumes: Chi tiết lỗi từng dòng từ Mục 3 của `d:/cinema_project/BAO_CAO_RA_SOAT_TOAN_BO_63_SO_DO_UML.md` và Mục 4.1 -> 4.6, 6.2, 6.3 của `SRS_He_Thong_Quan_Ly_Rap_Phim.md`.
- Produces: 19 file Sequence đầu tiên (`01` -> `19`) chuẩn hóa Lifeline, API Endpoint, Prisma Schema và ZaloPay Sandbox v2.

- [x] **Step 1: Cập nhật nhóm Đăng ký & Đặt vé Online (`01`, `04`, `05`, `06`, `07`, `08`, `09`)**
  - `01_dang_ky_tai_khoan.puml`: Sửa `/api/auth/register` -> `POST /api/auth/signup`, payload `{ email, password, full_name, phone }`, chuẩn hóa `email.toLowerCase().trim()`.
  - `04_mua_ve_va_dat_combo_online_tong_quan.puml`: Đổi `VNPay / MoMo` -> `ZaloPay Sandbox v2`, thêm bước giữ ghế (`POST /api/seats/reserve`) & giữ combo 10 phút (`POST /api/combos/reserve`), sửa trạng thái đơn `PAID` -> `Success`, thêm ký QR `HMAC-SHA256` & `<QRCodeSVG />`.
  - `05_xem_phim_va_suat_chieu.puml`: Ghi rõ API `GET /api/movies`, `GET /api/screenings`, `GET /api/screenings/[id]` và `GET /api/seats?screening_id=[id]` (sơ đồ 50 ghế `A1..E10`).
  - `06_chon_ghe_va_giu_cho.puml`: Đổi `BOOKED` -> `OCCUPIED`, thêm kiểm tra tối đa 8 ghế/lần (`MAX_SEATS = 8`), Lazy Release giải phóng ghế quá hạn 10 phút, và ghi rõ `POST /api/seats/reserve` (Atomic `updateMany WHERE status='EMPTY'`) & `POST /api/seats/release`.
  - `07_chon_loai_ve.puml`: Chuẩn hóa nhãn tuổi `P, C13, T18` (`BR-02`: khóa vé Trẻ em 50% khi phim `T18`), gọi `GET /api/pricing` và kiểm tra tổng số vé bằng tổng số ghế đang giữ.
  - `08_them_combo_vao_don_hang.puml`: Bổ sung luồng `POST /api/combos/reserve` trong `prisma.$transaction`: Lazy Release các `ComboReservation` quá hạn 10 phút, trừ tạm `Combo.stock`, tạo `ComboReservation (status='RESERVED', reservedUntil=NOW()+10m)`.
  - `09_ap_dung_voucher.puml`: Gọi `POST /api/coupons/validate`, kiểm tra 5 điều kiện Guard (`code` tồn tại, `expiryDate >= NOW()`, `usedCount < maxUsage`, kiểm tra `userId` nếu là voucher cá nhân `COMP50_`, kiểm tra `movieId`), sửa mã quy tắc thành `FR-VOU-01`, `FR-VOU-02`, `BR-03` (bỏ cột `INACTIVE` không tồn tại).

- [x] **Step 2: Cập nhật nhóm Thanh toán ZaloPay, POS, Soát vé, Giao Combo & Hủy sự cố (`10`, `11`, `12`, `13`, `14`, `15`, `18`)**
  - `10_thanh_toan_online.puml` & `11_thanh_toan_vnpay_momo.puml`: Chuẩn hóa hoàn toàn sang **ZaloPay Sandbox v2** (`POST /api/payments/initiate` -> `POST https://sb-openapi.zalopay.vn/v2/create` với `app_id=2553`, `ZALOPAY_KEY1`; xử lý Webhook IPN `POST /api/payments/zalopay-ipn` với `ZALOPAY_KEY2` + `crypto.timingSafeEqual` và Return URL `GET /api/payments/zalopay-return`; kiểm tra Idempotency; cập nhật `Payment.status = 'Success'`, `Ticket.status = 'Valid'`, `Seat.status = 'OCCUPIED'`, `ComboReservation.status = 'COMPLETED'`, tạo `OrderCombo (isDelivered = false)`, tăng `Coupon.usedCount`, kiểm tra Partial Unique Index `unique_active_ticket`). *(Lưu ý: Giữ nguyên tên file `11_thanh_toan_vnpay_momo.puml` để không làm gãy liên kết file hiện có, nhưng cập nhật tiêu đề và nội dung bên trong sang ZaloPay Sandbox v2).*
  - `12_ban_ve_tai_quay_pos.puml`: Sửa endpoint thành `POST /api/staff/pos/tickets`, bổ sung `resolveCustomer()` (gắn khách thành viên hoặc khách vãng lai), hỗ trợ mua kèm Combo tại quầy (`OrderCombo.isDelivered = true`).
  - `13_ban_combo_tai_quay_pos.puml`: Sửa endpoint thành `POST /api/staff/pos/combos`, bỏ bảng `Order` giả định và bỏ bước "tích điểm", sử dụng đúng bảng `Payment (status='Success')` và `OrderCombo (isDelivered=true, deliveredAt=NOW())`.
  - `14_soat_ve_vao_rap.puml`: Bổ sung nhánh `else` từ chối khi sai khung giờ soát vé (`NOW < startTime - 30p` hoặc `NOW > endTime` -> `400 OUTSIDE_CHECKIN_WINDOW`) hoặc không tìm thấy vé (`404`), dùng đúng endpoint `GET /api/staff/tickets/search` và `PATCH /api/tickets/[id]/mark-used` (`Ticket.status = 'Used'`).
  - `15_giao_nhan_combo_online.puml`: Thay bảng `prisma.order` bằng `prisma.payment` & `prisma.orderCombo`, dùng đúng trường `isDelivered = false -> true`, `deliveredAt = NOW()`, và đúng endpoint `GET /api/staff/combos/orders` & `POST /api/staff/combos/deliver`.
  - `18_huy_ve_su_co_hoan_tien_mat.puml`: Sửa bước hủy vé/suất chiếu sự cố: giải phóng ghế về `Seat.status = 'EMPTY'`, hoàn lại `Combo.stock` cho các combo chưa nhận (`isDelivered = false`), ghi công nợ `PENDING_CASH_REFUND`, và khi xác nhận chi tiền mặt tại quầy trong 30 ngày thì cập nhật `Payment.status = 'Refunded'` + ghi `AuditLog`.

- [x] **Step 3: Đồng bộ 19 file đầu sang `cinema-app/Sequence/` và kiểm tra**
  - Run: `Copy-Item -Path "d:/cinema_project/Sequence/0*.puml", "d:/cinema_project/Sequence/1*.puml" -Destination "d:/cinema_project/cinema-app/Sequence/" -Force ; Select-String -Path "d:/cinema_project/Sequence/0*.puml", "d:/cinema_project/Sequence/1*.puml" -Pattern "VNPay|BOOKED|api/auth/register|prisma\.order\b"`
  - Expected: Không còn kết quả khớp lỗi cũ.

---

### Task 4: Chỉnh sửa & Đồng bộ bộ Sơ đồ Tuần tự Phần 2 (`Sequence/20..38`)

**Files:**
- Modify: Các file từ `20_admin_quan_ly_danh_gia.puml` đến `38_bao_cao_doanh_thu_tai_chinh.puml` trong `d:/cinema_project/Sequence/`
- Sync: `d:/cinema_project/cinema-app/Sequence/`

**Interfaces:**
- Consumes: Chi tiết lỗi từng file từ Mục 4 của `d:/cinema_project/BAO_CAO_RA_SOAT_TOAN_BO_63_SO_DO_UML.md` và Mục 4.2, 4.7, 4.8, 4.9 của `SRS_He_Thong_Quan_Ly_Rap_Phim.md`.
- Produces: 19 file Sequence (`20` -> `38`) đồng bộ chuẩn Lifeline (`Frontend Next.js`, `Next.js App Router API`, `Docker PostgreSQL / Prisma`), đúng REST API Endpoints, đúng Enum `schema.prisma` và đúng mã `BR-01` -> `BR-10`.

- [x] **Step 1: Chuẩn hóa nhóm Quản lý Đánh giá, Phim & Giá vé (`20` -> `25`)**
  - `20_admin_quan_ly_danh_gia.puml`: Bổ sung nhánh `else [Không tìm thấy đánh giá -> 404 Not Found]` trước khi xóa (`DELETE /api/reviews/[id]`) và tính lại `movies.rating`.
  - `21_quan_ly_phim_tong_quan.puml`, `22_them_phim_moi.puml`, `23_cap_nhat_phim.puml`, `24_xoa_phim.puml`:
    - Chuẩn hóa Lifeline (`Admin`, `Frontend Next.js (/admin/movies)`, `Next.js API (/api/movies)`, `Docker PostgreSQL (Prisma)`), bổ sung bước kiểm tra `requireAuth(['ADMIN'])`.
    - Thay toàn bộ `status = 'ACTIVE' / 'INACTIVE'` thành `MovieStatus` chuẩn: `SHOWING`, `UPCOMING`, `ENDED` kèm cờ `isDeleted`.
    - Trong `21` và `24`: Bổ sung kiểm tra nếu phim đang có suất chiếu `UPCOMING`/`SHOWING` thì chặn xóa (`400 Bad Request`); nếu đã có vé lịch sử thì thực hiện Soft Delete (`status = 'ENDED'`, `isDeleted = true` theo `FR-ADM-02`, `BR-07`).
  - `25_quan_ly_gia_ve.puml`: Bổ sung đường dẫn API `GET /api/pricing`, `PUT /api/pricing/[type]`, `PUT /api/pricing/surcharges` và lưu vết `AuditLog`.

- [x] **Step 2: Chuẩn hóa nhóm Quản lý Combo & Voucher (`26` -> `33`)**
  - `26_quan_ly_combo_tong_quan.puml`, `27_them_combo_moi.puml`, `28_cap_nhat_combo.puml`, `29_xoa_ngung_ban_combo.puml`:
    - Bổ sung đường dẫn REST API (`GET/POST /api/combos`, `PUT/DELETE /api/combos/[id]`) và kiểm tra `requireAuth(['ADMIN'])`.
    - Sử dụng đúng `ComboStatus`: `ACTIVE`, `INACTIVE` và kiểm tra `orderCombos` trước khi xóa cứng hoặc chuyển sang `INACTIVE` (Soft Delete).
  - `30_quan_ly_voucher_tong_quan.puml`, `31_them_voucher_moi.puml`, `32_cap_nhat_voucher.puml`, `33_xoa_vo_hieu_hoa_voucher.puml`:
    - Bổ sung đường dẫn REST API (`GET/POST /api/coupons`, `PUT/DELETE /api/coupons/[id]`) và kiểm tra `requireAuth(['ADMIN'])`.
    - Loại bỏ cột `status = 'ACTIVE' / 'INACTIVE'` không có trong bảng `coupons`; thay bằng kiểm tra `expiryDate`, `usedCount`, `maxUsage`, phân biệt rõ Voucher chiến dịch (`Admin Campaign`) và Voucher bồi hoàn (`COMP50_` gắn `userId`).

- [x] **Step 3: Chuẩn hóa nhóm Quản lý Suất chiếu & Báo cáo Doanh thu (`34` -> `38`)**
  - `34_quan_ly_suat_chieu_tong_quan.puml`, `35_them_suat_chieu_moi.puml`, `36_kiem_tra_trung_lich_chieu.puml`, `37_cap_nhat_suat_chieu.puml`:
    - Sửa toàn bộ trích dẫn nhầm `BR-09` thành **`BR-08`** (chống trùng lịch phòng chiếu + 15 phút dọn phòng).
    - Bổ sung đường dẫn REST API (`GET/POST /api/screenings`, `PUT/DELETE /api/screenings/[id]`) và `requireAuth(['ADMIN'])`.
    - Trong `34`: Bổ sung nhánh **Hủy suất chiếu khẩn cấp do sự cố rạp (`FR-ADM-04`, `BR-04`)** (hủy toàn bộ vé `Valid` -> `Cancelled`, hoàn kho combo chưa nhận, giải phóng ghế `EMPTY`, ghi `AuditLog`).
    - Trong `35`: Ghi rõ `prisma.$transaction` vừa tạo `Screening` vừa `tx.seat.createMany` khởi tạo 50 ghế chuẩn `A1..E10` (`type = 'STANDARD'`, `status = 'EMPTY'` theo `BR-01`).
    - Trong `37`: Đồng bộ điều kiện chặn sửa khi suất chiếu đã bắt đầu/kết thúc (`startTime <= NOW()`) hoặc đang có vé hiệu lực.
  - `38_bao_cao_doanh_thu_tai_chinh.puml`: Đồng bộ tham số truy vấn thực tế của `GET /api/admin/reports/revenue` và `GET /api/admin/dashboard`, bóc tách rõ 4 chỉ số tài chính theo `BR-10` (`Net Ticket Revenue`, `Combo Revenue`, `Pending Refund Amount`, `Actual Refunded Amount`) và tỷ lệ lấp đầy ghế (`Fill Rate %`).

- [x] **Step 4: Đồng bộ 19 file cuối sang `cinema-app/Sequence/` và kiểm tra**
  - Run: `Copy-Item -Path "d:/cinema_project/Sequence/2*.puml", "d:/cinema_project/Sequence/3*.puml" -Destination "d:/cinema_project/cinema-app/Sequence/" -Force ; Select-String -Path "d:/cinema_project/Sequence/3*.puml" -Pattern "BR-09"`
  - Expected: Không còn file nào trong nhóm `34..37` ghi nhầm `BR-09`.
