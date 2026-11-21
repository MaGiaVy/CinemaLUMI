# BÁO CÁO TỔNG HỢP RÀ SOÁT & KIỂM TOÁN TOÀN BỘ 63 SƠ ĐỒ UML (PLANTUML)

**Dự án:** Hệ thống Quản lý Bán vé và Vận hành Rạp phim (Lumi Cinema)  
**Ngày kiểm toán:** 05/11/2026  
**Căn cứ đối chiếu:** [`SRS_He_Thong_Quan_Ly_Rap_Phim.md`](file:///d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md) (Phiên bản 2.0) & Mã nguồn thực tế (`cinema-app/`)

---

## TỔNG QUAN KẾT QUẢ RÀ SOÁT (EXECUTIVE SUMMARY)

| STT | Nhóm Sơ đồ & Thư mục | Tổng số file `.puml` | Số file `✅ Khớp 100%` | Số file `⚠️ Cần cập nhật` | Đồng bộ giữa thư mục gốc & `cinema-app/` |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **Activity Diagrams** (`PlantUML_Activity_Diagrams/`) | 18 | 7 | 11 | Giống hệt 100% (SHA-256 identical) |
| **2** | **State Diagrams** (`PlantUML_State_Diagrams/`) | 6 | 0 | 6 | Giống hệt 100% (SHA-256 identical) |
| **3** | **Master Class Diagram** (`PlantUML_Class_Diagram/`) | 1 (+ README) | 0 | 1 (+ README) | Giống hệt 100% (SHA-256 identical) |
| **4** | **Sequence Diagrams - Phần 1** (`Sequence/01..19`) | 19 | 5 | 14 | Giống hệt 100% (SHA-256 identical) |
| **5** | **Sequence Diagrams - Phần 2** (`Sequence/20..38`) | 19 | 0 | 19 | Giống hệt 100% (SHA-256 identical) |
| **TỔNG** | **Toàn bộ 4 Thư mục Sơ đồ UML** | **63 files** | **12 files** | **51 files** | **Đồng bộ 2 nơi** |

### 6 Nhóm Lỗi Lệch Pha Phổ Biến Nhất Cần Khắc Phục:
1. **Cổng thanh toán cũ (`VNPay / MoMo`):** Xuất hiện trong `05_dat_ve_combo_online.puml`, `test_05.puml`, `state_seat.puml`, `state_ticket.puml`, `state_payment.puml`, `class_diagram_lumicinema.puml`, và các Sequence `04`, `10`, `11`. Cần chuẩn hóa 100% sang **ZaloPay Sandbox API v2** (`app_id: 2553`, `HMAC-SHA256` với `ZALOPAY_KEY1` / `ZALOPAY_KEY2`, `/api/payments/zalopay/create|callback|return`).
2. **Sai thời gian giữ ghế / timeout thanh toán (`15 phút` thay vì `10 phút`):** Xuất hiện trong `state_ticket.puml` và `state_payment.puml`. Cần chuẩn hóa về **10 phút (`HOLD_MINUTES = 10`)**.
3. **Thiếu cơ chế giữ kho Combo 10 phút (`ComboReservation`):** Xuất hiện trong `state_combo.puml`, `08_them_combo_vao_don_hang.puml`. Cần bổ sung trạng thái `RESERVED -> CONFIRMED | EXPIRED | RELEASED`.
4. **Sai tên bảng / tên cột / giá trị Enum so với `schema.prisma`:**
   - Sequence `13`, `15` gọi bảng `Order` (không tồn tại) và `status = 'NOT_DELIVERED'/'DELIVERED'` thay vì bảng `payments` + `order_combos` (`isDelivered = false/true`).
   - Sequence `06` dùng `BOOKED` thay vì `OCCUPIED`; Sequence `04, 10` dùng `PAID` thay vì `Success`.
   - Sequence `21, 22, 24` dùng `ACTIVE / INACTIVE` cho `MovieStatus` thay vì `SHOWING / UPCOMING / ENDED` + `isDeleted`.
   - Sequence `09, 30, 31, 33` dùng cột `status = 'ACTIVE'/'INACTIVE'` cho `Coupon` (trong DB dùng `expiryDate`, `usedCount < maxUsage`).
5. **Lệch đường dẫn API Endpoint & Lifeline chung chung:**
   - Activity `02` & Sequence `01` gọi `/api/auth/register` thay vì `POST /api/auth/signup`.
   - Sequence `12` gọi `/api/payments/pos-checkout` thay vì `POST /api/staff/pos/tickets`.
   - Sequence `21` -> `37` chưa ghi rõ đường dẫn REST API (`/api/movies`, `/api/combos`, `/api/coupons`, `/api/screenings`) và bước kiểm tra RBAC `requireAuth(['ADMIN'])`.
6. **Thiếu chi tiết quy tắc nghiệp vụ (`BR-02`, `BR-07`, `BR-08`, `Partial Unique Index`):**
   - Thiếu kiểm tra khóa vé Trẻ em (50%) đối với phim nhãn `T18` (`BR-02`) ở Activity `05, 06`.
   - Thiếu `+ 15 phút dọn vệ sinh phòng chiếu` (`BR-08`) ở Activity `14` và ghi nhầm mã `BR-09` thay vì `BR-08` ở Sequence `35, 36, 37`.
   - Class Diagram thiếu `ZaloPay` trong `enum PaymentMethod`, thiếu lớp `AuditLog`, 3 lớp Service (`ZaloPayService`, `QRSignatureService`, `SeatExpirationService`) và ghi chú `Partial Unique Index unique_active_ticket`.

---


# BÁO CÁO KIỂM TOÁN SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAMS AUDIT REPORT)

**Đối tượng kiểm toán:**
1. Thư mục gốc: `d:/cinema_project/PlantUML_Activity_Diagrams/` (18 file `.puml`: từ `01` đến `17` và `test_05.puml`, kèm `README.md`).
2. Thư mục trong ứng dụng: `d:/cinema_project/cinema-app/PlantUML_Activity_Diagrams/`.
3. Tài liệu đối chiếu: `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md` (Phiên bản 2.0 - 05/11/2026) & Mã nguồn thực tế trong `d:/cinema_project/cinema-app/src/`.

---

## PHẦN 1: KIỂM TRA ĐỒNG BỘ GIỮA 2 THƯ MỤC (`PlantUML_Activity_Diagrams`)

- **Kết quả kiểm tra băm (SHA-256 Hash Comparison):** Toàn bộ **18/18 file `.puml`** (cùng các file `.png`, `.svg`, `README.md`) giữa `d:/cinema_project/PlantUML_Activity_Diagrams/` và `d:/cinema_project/cinema-app/PlantUML_Activity_Diagrams/` **giống hệt nhau 100% (Byte-for-byte identical)**.
- **Lưu ý về tên file:**
  - Trong thư mục thực tế có 17 file chính đánh số từ `01` đến `17` (theo đúng Bảng 7.2.1 của SRS v2.0) và 1 file nháp `test_05.puml` (không có file tên `all_activity_diagrams.puml`).
  - Một số tên file thực tế đã được gộp/đổi tên so với tên gọi cũ:
    + Soát vé (`08_soat_ve.puml`) và Giao nhận combo (`09_giao_nhan_combo.puml`) được tách thành 2 file độc lập.
    + Khách hủy vé là `10_khach_huy_ve.puml`.
    + Rạp hủy vé do sự cố & Xác nhận hoàn tiền mặt được gộp chung trong `11_rap_huy_ve_hoan_tien.puml`.
- **Quan trọng:** Khi tiến hành sửa bất kỳ file `.puml` nào, cần đồng bộ cả 2 thư mục (và xóa hoặc cập nhật `test_05.puml`, `README.md`).

---

## PHẦN 2: TỔNG HỢP NHANH KẾT QUẢ KIỂM TOÁN 18 FILE `.puml`

| STT | Tên file `.puml` | Mục SRS v2.0 tương ứng | Trạng thái | Tóm tắt ngắn gọn |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `01_dang_nhap.puml` | Mục 4.1 (`FR-AUTH-02`, `FR-AUTH-03`) | ⚠️ Cần cập nhật | Lệch nhỏ đường dẫn điều hướng Admin (`/admin/dashboard` -> `/admin`). |
| 2 | `02_dang_ky.puml` | Mục 4.1 (`FR-AUTH-01`, `FR-AUTH-04`) | ⚠️ Cần cập nhật | Ghi sai API endpoint (`POST /api/auth/register` thay vì `POST /api/auth/signup`). |
| 3 | `03_dang_xuat.puml` | Mục 4.1 (`FR-AUTH-02`, `NFR-INT-02`) | ✅ Khớp 100% | Đầy đủ luồng NextAuth `signOut`, xóa HttpOnly Cookie và dọn dẹp Client. |
| 4 | `04_danh_gia_phim.puml` | Mục 4.2 (`FR-REV-01..03`, `BR-06`) | ✅ Khớp 100% | Đã tuân thủ chuẩn `BR-06`: chỉ kiểm tra đăng nhập, không bắt buộc mua vé, hỗ trợ Upsert 1 đánh giá/user/phim và tính lại điểm trung bình làm tròn 1 chữ số thập phân. |
| 5 | `05_dat_ve_combo_online.puml` | Mục 3.3, 4.3 (`FR-BOK-01..05`, `BR-01`, `BR-02`, `BR-09`) | ⚠️ Cần cập nhật | **Lỗi nghiêm trọng:** Vẫn ghi **`Cổng thanh toán VNPay`** thay vì **`ZaloPay Sandbox v2`**; thiếu chi tiết tối đa 8 ghế, kiểm tra nhãn `T18` và bảo toàn lượt dùng voucher. |
| 6 | `06_ban_ve_tai_quay.puml` | Mục 4.4 (`FR-POS-01`, `FR-POS-02`, `FR-POS-04`, `BR-02`) | ⚠️ Cần cập nhật | Thiếu kiểm tra chặn vé Trẻ em cho phim `T18` (`BR-02`), thiếu bước chọn kèm Combo tại quầy và khác biệt cơ chế khóa ghế trực tiếp (`OCCUPIED`) trong code POS. |
| 7 | `07_ban_combo_tai_quay.puml` | Mục 4.4 (`FR-POS-03`, `FR-POS-04`, `BR-05`) | ⚠️ Cần cập nhật | Thiếu bước đánh dấu trạng thái `OrderCombo.isDelivered = true` (`Đã nhận`) ngay tại quầy. |
| 8 | `08_soat_ve.puml` | Mục 4.5 (`FR-CHK-01`, `BR-09`) | ⚠️ Cần cập nhật | Đã có `HMAC-SHA256` và chặn quét lần 2, nhưng chưa ghi rõ khung giờ mở soát vé (`30 phút trước giờ chiếu đến khi kết thúc`) và trong code `mark-used` chưa kiểm tra khung giờ này. |
| 9 | `09_giao_nhan_combo.puml` | Mục 4.5 & 6.4 (`FR-CHK-02`, `BR-05`) | ✅ Khớp 100% | Tách độc lập hoàn toàn với soát vé, kiểm tra đơn hợp lệ, chặn giao trùng (`Chưa nhận` -> `Đã nhận`) và lưu thời gian giao. |
| 10 | `10_khach_huy_ve.puml` | Mục 4.6 (`FR-CAN-01`, `BR-03`) | ⚠️ Cần cập nhật | Có nhánh "Kênh hủy: Tại quầy" và "Không có tài khoản -> In mã voucher" mâu thuẫn với SRS 4.6 (`BR-03`: Khách tự hủy vé online, gắn `userId` định danh và gửi Email). |
| 11 | `11_rap_huy_ve_hoan_tien.puml` | Mục 4.6 & 6.3 (`FR-CAN-02`, `FR-CAN-03`, `BR-04`) | ✅ Khớp 100% | Đầy đủ 2 nhánh: (1) Rạp hủy vé sự cố (không giới hạn 2h, ghi công nợ 100%, hoàn kho combo `Chưa nhận`, giữ nguyên combo `Đã nhận`) và (2) Khách nhận tiền mặt tại quầy trong 30 ngày kèm `Audit Log`. |
| 12 | `12_quan_ly_voucher.puml` | Mục 4.7 (`FR-VOU-01`, `FR-VOU-02`) | ✅ Khớp 100% | Đầy đủ luồng Admin thêm, sửa, ngừng sử dụng/xóa voucher khuyến mãi và kiểm tra hợp lệ. |
| 13 | `13_quan_ly_phim.puml` | Mục 4.8 (`FR-ADM-01`, `FR-ADM-02`, `BR-07`) | ⚠️ Cần cập nhật | Nhánh "Ngừng chiếu" vẫn đi xuyên qua bước hiển thị biểu mẫu nhập tên/thể loại/thời lượng/poster; thiếu nhánh chặn xóa khi phim đang có suất chiếu `UPCOMING`/`SHOWING`. |
| 14 | `14_quan_ly_suat_chieu.puml` | Mục 4.8 (`FR-ADM-03`, `BR-08`) | ⚠️ Cần cập nhật | Công thức tính giờ kết thúc thiếu **`+ 15 phút dọn vệ sinh phòng chiếu`** theo quy tắc `BR-08` và code thực tế (`movie.duration + 15`). |
| 15 | `15_huy_suat_chieu_khan_cap.puml` | Mục 4.8 (`FR-ADM-04`, `BR-04`) | ⚠️ Cần cập nhật | Sơ đồ ghi chuyển suất chiếu sang `Cancelled`, trong khi code `DELETE /api/screenings/[id]` chuyển sang `ENDED` và chưa có đoạn code hoàn kho combo tự động khi đóng suất chiếu. |
| 16 | `16_quan_ly_combo.puml` | Mục 4.8 & 6.1 (`UC-17`) | ✅ Khớp 100% | Đầy đủ luồng thêm, sửa, ngừng bán (`INACTIVE`) và cập nhật tồn kho (`stock`). |
| 17 | `17_bao_cao_doanh_thu.puml` | Mục 4.9 (`FR-REP-01..03`, `BR-10`) | ✅ Khớp 100% | Khớp hoàn toàn với SRS 4.9 (`FR-REP-02`, `BR-10`): kiểm tra quyền Admin `403`, lọc đa chiều, 4 chỉ số KPI tài chính & tỷ lệ lấp đầy. |
| 18 | `test_05.puml` *(và `README.md`)* | Bản sao thử nghiệm của `05_dat_ve_combo_online.puml` | ⚠️ Cần cập nhật / Xóa | File nháp trùng lặp với `05_dat_ve_combo_online.puml` và vẫn chứa `VNPay`. `README.md` dòng 37 cũng còn ghi `VNPay`. |

---

## PHẦN 3: CHI TIẾT KIỂM TOÁN TỪNG FILE (TỪ `01` ĐẾN `17` & `test_05.puml`)

### 1. File `01_dang_nhap.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.1 (`FR-AUTH-02`, `FR-AUTH-03` - Đăng nhập hệ thống, Quản lý phiên JWT & Phân quyền RBAC).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  - **Dòng 64:** Đang ghi `:Điều hướng sang /admin/dashboard;`.
    - *Đối chiếu SRS (Mục 4.1.2 - Luồng 4.1B bước 9) & Code:* Đường dẫn trang quản trị trong SRS quy định là `/admin` (`ADMIN -> /admin`, `STAFF -> /staff`, `CUSTOMER -> /`).
    - *Cần sửa thành:* `:Điều hướng sang /admin (Admin Dashboard);`.

---

### 2. File `02_dang_ky.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.1 (`FR-AUTH-01`, `FR-AUTH-04` - Đăng ký tài khoản Khách hàng).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  - **Dòng 27:** Đang ghi `:Gửi request POST /api/auth/register;`.
    - *Đối chiếu SRS (Mục 4.1.1 `FR-AUTH-01`, Mục 4.1.2 Luồng 4.1A) & Code thực tế (`src/app/api/auth/signup/route.ts`):* Endpoint thực tế trong cả SRS và mã nguồn là `POST /api/auth/signup` (không tồn tại route `/api/auth/register`).
    - *Cần sửa thành:* `:Gửi request POST /api/auth/signup;`.

---

### 3. File `03_dang_xuat.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.1 (`FR-AUTH-02`) & Chương 5 - Mục 5.4 (`NFR-INT-02`).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Luồng 4 làn (`Người dùng`, `Giao diện`, `Máy chủ xử lý`, `Cơ sở dữ liệu`) mô tả chuẩn xác quy trình gọi `signOut({ redirect: false })`, xóa `HttpOnly Cookie (Max-Age=0)`, ghi nhận nhật ký kiểm toán (`Audit Trail`) và dọn dẹp `sessionStorage` / `localStorage` trước khi điều hướng về `/`.

---

### 4. File `04_danh_gia_phim.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.2 (`FR-REV-01`, `FR-REV-02`, `FR-REV-03` & Quy tắc `BR-06` - Đánh giá Phim).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - **Quy tắc `BR-06` (Chỉ cần đăng nhập, không cần mua vé):** Dòng 25-30 kiểm tra `if (Đã đăng nhập?)` -> nếu chưa thì yêu cầu đăng nhập tại `/login`, nếu rồi thì cho phép chọn 1-5 sao và viết bình luận tối đa 1000 ký tự (Dòng 33). Hoàn toàn **không còn** điều kiện kiểm tra phải mua vé trước đó, khớp 100% với `FR-REV-01` và code `src/app/api/reviews/route.ts`.
  - **Quy tắc Upsert (`FR-REV-02`) & Tính điểm trung bình (`FR-REV-03`):** Dòng 47-53 kiểm tra `if (Đã đánh giá?)` để ghi đè hoặc tạo mới, sau đó tính lại điểm trung bình làm tròn 1 chữ số thập phân.
  - **Nhánh Admin kiểm duyệt:** Dòng 60-78 mô tả đúng chức năng Admin xóa đánh giá vi phạm (`DELETE /api/reviews/[id]`) và tính lại điểm trung bình.

---

### 5. File `05_dat_ve_combo_online.puml`
- **Mục SRS tương ứng:** Chương 3 - Mục 3.3.1, Chương 4 - Mục 4.3 (`FR-BOK-01` -> `FR-BOK-05`, `BR-01`, `BR-02`, `BR-09`), Chương 4 - Mục 4.7 (`FR-VOU-02`, `FR-VOU-03`).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  1. **Sai cổng thanh toán (`VNPay` thay vì `ZaloPay Sandbox v2`):**
     - **Dòng 11:** `|Cổng thanh toán VNPay|` -> *Cần sửa thành:* `|Cổng ZaloPay Sandbox v2|`.
     - **Dòng 79:** `:Chọn thanh toán online qua VNPay;` -> *Cần sửa thành:* `:Chọn thanh toán trực tuyến qua ZaloPay;`.
     - **Dòng 82:** `:Tạo đơn hàng trạng thái Pending\nvà sinh đường dẫn thanh toán VNPay;` -> *Cần sửa thành:* `:Tạo đơn hàng trạng thái Pending (app_trans_id)\nvà gọi API tạo đơn ZaloPay (ký HMAC-SHA256 bằng ZALOPAY_KEY1);`.
     - **Dòng 84, 88, 90:** Đang dùng làn `|Cổng thanh toán VNPay|` và `:Thực hiện thanh toán trên cổng VNPay;` -> *Cần sửa thành:* `|Cổng ZaloPay Sandbox v2|` và `:Thực hiện thanh toán trên cổng ZaloPay Sandbox v2;`.
     - **Dòng 94:** `:Xác thực chữ ký (checksum) của kết quả IPN;` -> *Cần sửa thành:* `:Xác thực chữ ký MAC (ZALOPAY_KEY2)\ncủa Webhook IPN / Checksum Return URL;`.
  2. **Thiếu chi tiết số ghế tối đa & điều kiện khóa vé Trẻ em với phim `T18`:**
     - **Dòng 27:** `:Chọn ghế (tối đa số ghế quy định);` -> *Nên ghi rõ theo `FR-BOK-02`:* `:Chọn ghế trên sơ đồ A1-E10 (tối đa 08 ghế/lần);`.
     - **Dòng 44-47:** `if (Hợp lệ?)` chưa nêu rõ điều kiện `BR-02` -> *Nên ghi rõ:* `if (Phim T18 & chọn vé Trẻ em?) then (Có - Vi phạm BR-02)` -> `:Khóa lựa chọn vé Trẻ em\nvà bắt buộc dùng vé Thường (100%);`.
  3. **Diễn đạt hoàn lượt dùng voucher khi thanh toán thất bại/hết hạn 10 phút:**
     - **Dòng 107:** `:Hoàn lại tồn kho combo\nvà hoàn lượt dùng voucher;` -> Theo SRS `FR-VOU-03` và code `zalopay-ipn/route.ts` (dòng 153), `usedCount` chỉ tăng khi thanh toán `Success`, nên khi thất bại/hết hạn 10 phút hệ thống **bảo toàn (không trừ) lượt dùng voucher** và chuyển `ComboReservation` sang `RELEASED`.

---

### 6. File `06_ban_ve_tai_quay.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.4 (`FR-POS-01`, `FR-POS-02`, `FR-POS-04`, `BR-02` - Bán vé tại quầy POS).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  1. **Thiếu kiểm tra chặn vé Trẻ em đối với phim `T18` (`BR-02`):**
     - **Dòng 39-47:** Mới chỉ kiểm tra giấy tờ độ tuổi của khách (`if (Đạt?)`), nhưng thiếu điều kiện tiên quyết của hệ thống: **Nếu phim có nhãn độ tuổi `T18` thì tự động khóa/chặn tuyệt đối vé Trẻ em** (theo SRS `FR-POS-01` và code `src/app/api/staff/pos/tickets/route.ts` dòng 158: `CHILD_TICKET_NOT_ALLOWED`).
  2. **Thiếu bước chọn kèm Combo bắp nước trong luồng bán vé tại quầy:**
     - Theo SRS المục 4.4.2 (`Luồng 4.4A` bước 1 & 6.3) và code `src/app/api/staff/pos/tickets/route.ts` (dòng 192-277), nhân viên bán vé tại quầy có thể chọn kèm Combo bắp nước trong cùng hóa đơn vé (trừ kho và đánh dấu `isDelivered = true` ngay). File `06_ban_ve_tai_quay.puml` hiện chưa thể hiện nhánh tùy chọn thêm Combo này.
  3. **Khác biệt nhỏ về bước giữ ghế `RESERVED` 10 phút so với code POS thực tế:**
     - **Dòng 36:** Ghi `:Chuyển ghế sang RESERVED\ngiữ chỗ 10 phút;`. Trong SRS Bảng 6.1 (`UC-09 <<include>> UC-05`) có cho phép giữ ghế, nhưng trong code `POST /api/staff/pos/tickets/route.ts` (dòng 247-253), khi nhân viên bấm xác nhận thu tiền tại quầy, hệ thống chuyển thẳng ghế từ `EMPTY` sang `OCCUPIED` trong 1 transaction. Cần chú thích rõ hoặc đồng bộ với luồng `4.4A` của SRS.

---

### 7. File `07_ban_combo_tai_quay.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.4 (`FR-POS-03`, `FR-POS-04`, `BR-05` - Bán lẻ Combo bắp nước độc lập tại quầy).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  - **Dòng 47-48:** Đang ghi `:Trừ kho combo chính thức;` và `:Ghi nhận đơn combo và in phiếu mua hàng;`.
    - *Đối chiếu SRS (Mục 4.4.1 `FR-POS-03`, Luồng 4.4B bước 3) & Code (`src/app/api/staff/pos/combos/route.ts` dòng 155):* Khi bán combo trực tiếp tại quầy, hệ thống bắt buộc thiết lập ngay trạng thái **`isDelivered = true` (`Đã nhận`) và `deliveredAt = NOW()`** vì nhân viên giao bắp nước trực tiếp cho khách tại chỗ.
    - *Cần sửa dòng 48 thành:* `:Tạo bản ghi OrderCombo trạng thái Đã nhận (isDelivered = true)\nvà in biên lai REC-COMBO cho khách;`.

---

### 8. File `08_soat_ve.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.5 (`FR-CHK-01`, `BR-09` - Soát vé vào rạp).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  - **Dòng 46-47:** Đang ghi `:Đối chiếu phòng chiếu và thời gian hiện tại\nvới suất chiếu của vé;` và `if (Đúng giờ?)`.
    - *Đối chiếu SRS (Mục 4.5.1 `FR-CHK-01` & Luồng 4.5A bước 7):* SRS quy định khung giờ mở soát vé cụ thể là **từ 30 phút trước giờ khởi chiếu (`startTime - 30 phút`) đến khi kết thúc suất chiếu (`endTime`)**.
    - *Cần bổ sung vào dòng 46:* `:Đối chiếu phòng chiếu và khung giờ cho phép\n(từ 30 phút trước startTime đến endTime);`.
    - *(Lưu ý thêm về Code: Trong `src/app/api/tickets/[id]/mark-used/route.ts` hiện mới kiểm tra trạng thái `Valid`/`Used`/`Cancelled` chứ chưa code câu lệnh kiểm tra `startTime - 30m` và chữ ký `HMAC-SHA256` ở backend).*

---

### 9. File `09_giao_nhan_combo.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.5 (`FR-CHK-02`, `BR-05`) & Chương 6 - Mục 6.4.
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Đã tách biệt hoàn toàn thành một quy trình độc lập với soát vé (`08_soat_ve.puml`), có ghi chú rõ tại dòng 48: `(độc lập với việc soát vé vào phòng chiếu)`.
  - Đảm bảo kiểm tra đơn hàng hợp lệ (`Payment = Success`), kiểm tra trạng thái combo `Chưa nhận` (`isDelivered = false`), chặn nhận trùng lần 2 (`BR-05`) và cập nhật sang `Đã nhận` (`isDelivered = true`, lưu `deliveredAt`).

---

### 10. File `10_khach_huy_ve.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.6 (`FR-CAN-01`, `BR-03` - Khách hàng chủ động tự hủy vé trước `>= 2 giờ` và nhận Voucher `50%`).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  1. **Thừa làn `|Nhân viên|` và nhánh hủy tại quầy cho khách vãng lai không có tài khoản:**
     - **Dòng 10, 15-20:** Có làn `|Nhân viên|` và nhánh `if (Kênh hủy?) then (Tại quầy)`.
     - **Dòng 58-62:** Có nhánh `if (Có tài khoản?) ... else (Không) :In mã voucher cho khách;`.
     - *Đối chiếu SRS (Mục 4.6.1 Bảng đối chiếu & Mục 4.6.3 Luồng 4.6A) & Code (`src/app/api/tickets/[id]/cancel/route.ts`):*
       + Trong SRS v2.0, Luồng `BR-03` (`10_khach_huy_ve.puml`) là **"Khách hàng chủ động tự hủy vé online"** trong mục Lịch sử vé (`/profile`), yêu cầu bắt buộc đăng nhập tài khoản chính chủ (`ticket.userId === currentUserId`), gắn trực tiếp mã `COMP50_[TicketID]_[Random]` vào `userId` của khách và **gửi Email thông báo mã voucher** (`sendVoucherIssued`).
       + Nhân viên tại quầy không thực hiện luồng hủy `COMP50_` cho khách vãng lai không tài khoản (vì mọi giao dịch hủy của nhân viên tại quầy thuộc luồng sự cố `UC-13`/`UC-15` ở file `11_rap_huy_ve_hoan_tien.puml`).
     - *Cần sửa:* Bỏ nhánh khách không có tài khoản (hoặc thay dòng 58-62 bằng bước `:Gắn voucher COMP50 vào tài khoản khách (userId)\nvà gửi Email thông báo mã voucher bất đồng bộ;` theo đúng bước 6.3 và 7 của Luồng 4.6A trong SRS).

---

### 11. File `11_rap_huy_ve_hoan_tien.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.6 (`FR-CAN-02`, `FR-CAN-03`, `BR-04`) & Chương 6 - Mục 6.3.
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Sơ đồ tích hợp mạch lạc cả 2 quy trình của `BR-04`:
    1. **Nhánh 1 (Dòng 15-38 - Rạp hủy vé do sự cố):** Kiểm tra vé `Valid` (chặn vé đã `Used`), không giới hạn 2 giờ, chuyển vé sang `Cancelled`, ghi nhận công nợ `Chờ hoàn tiền` 100%, giải phóng ghế về `EMPTY`, hoàn tiền 100% & cộng lại tồn kho cho combo `Chưa nhận`, giữ nguyên combo `Đã nhận`, ghi `Audit Log` và thông báo hạn 30 ngày nhận tiền mặt tại quầy.
    2. **Nhánh 2 (Dòng 40-68 - Khách nhận hoàn tiền mặt tại quầy):** Khách xuất trình mã vé trong hạn 30 ngày, nhân viên tra cứu POS, kiểm tra còn hạn 30 ngày, chi tiền mặt 100%, bấm xác nhận hoàn tiền mặt, chuyển công nợ sang `Đã hoàn tiền` (`REFUNDED_CASH`) và lưu `Audit Log` (`staffId`, thời gian, số tiền).

---

### 12. File `12_quan_ly_voucher.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.7 (`FR-VOU-01`, `FR-VOU-02` - Quản lý Voucher khuyến mãi).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Hiển thị đầy đủ danh sách cả 2 nhóm voucher (khuyến mãi do Admin tạo và bồi hoàn do hệ thống sinh), hỗ trợ thêm mới, sửa, ngừng sử dụng/xóa kèm vòng lặp kiểm tra tính hợp lệ dữ liệu (`Zod Validation`).

---

### 13. File `13_quan_ly_phim.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.8 (`FR-ADM-01`, `FR-ADM-02`, `BR-07` - Quản lý danh mục Phim & Xóa mềm).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  1. **Thiếu điều kiện chặn xóa/ngừng chiếu khi phim đang có suất chiếu `UPCOMING` hoặc `SHOWING`:**
     - *Đối chiếu SRS (Mục 4.8.1 `FR-ADM-02` & Mục 4.8.2 Nhánh 2a) & Code (`src/app/api/movies/[id]/route.ts` dòng 216-232):* Khi Admin chọn xóa/ngừng chiếu phim, nếu phim đang có suất chiếu ở trạng thái `UPCOMING` hoặc `SHOWING` thì hệ thống **chặn thao tác và báo lỗi 400** (yêu cầu kết thúc hoặc hủy suất chiếu trước). Nếu không còn suất chiếu active nhưng đã có lịch sử bán vé (`hasTickets`) thì mới thực hiện **Xóa mềm (`status = 'ENDED'` / `isDeleted = true`)**.
  2. **Lỗi nối luồng (Control Flow) ở nhánh "Ngừng chiếu?":**
     - **Dòng 34-50:** Sau khi đi vào nhánh `if (Ngừng chiếu?) then (Có)` -> `:Không xóa vĩnh viễn, chỉ chuyển trạng thái sang Ngừng chiếu (xóa mềm);` (Dòng 41), luồng không kết thúc hoặc nhảy tới bước xác nhận xóa mà lại chạy tiếp xuống **Dòng 50**: `:Nhập hoặc sửa thông tin phim (tên, thể loại, thời lượng, poster) và chọn nhãn độ tuổi P, C13 hoặc T18;`. Điều này khiến thao tác "Ngừng chiếu" bị bắt nhập lại biểu mẫu thông tin phim.
     - *Cần sửa:* Tách riêng nhánh `Ngừng chiếu / Xóa mềm` (chỉ cần xác nhận -> cập nhật trạng thái `ENDED` / `isDeleted = true`) khỏi nhánh `Thêm mới / Sửa thông tin phim` (nhập form).

---

### 14. File `14_quan_ly_suat_chieu.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.8 (`FR-ADM-03`, `BR-08` - Lên lịch suất chiếu, Chống trùng phòng & Tự sinh 50 ghế chuẩn).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch:**
  1. **Thiếu 15 phút dọn vệ sinh phòng chiếu trong công thức tính `endTime` (`BR-08`):**
     - **Dòng 45:** Đang ghi `:Tính giờ kết thúc = giờ bắt đầu + thời lượng phim;`.
     - *Đối chiếu SRS (Mục 4.8.1 `FR-ADM-03`, Luồng 4.8A bước 5, Bảng 7.1 `BR-08`) & Code (`src/app/api/screenings/route.ts` dòng 168: `const totalOccupiedMinutes = movieDurationMinutes + 15`):* Công thức bắt buộc phải cộng thêm **15 phút nghỉ dọn vệ sinh phòng chiếu**.
     - *Cần sửa dòng 45 thành:* `:Tính giờ kết thúc = giờ bắt đầu + thời lượng phim + 15 phút dọn phòng;`.
  2. **Thiếu kiểm tra điều kiện chỉ cho sửa suất chiếu chưa bắt đầu:**
     - **Dòng 22-30:** Khi chọn sửa suất chiếu (`Thêm mới? -> Không`), theo SRS Mục 4.8.2 (Nhánh 6b) và code `PUT /api/screenings/[id]` (dòng 146), cần kiểm tra `startTime > NOW()` (không cho sửa suất chiếu đã bắt đầu hoặc đã kết thúc).

---

### 15. File `15_huy_suat_chieu_khan_cap.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.8 (`FR-ADM-04`, `BR-04` - Hủy suất chiếu khẩn cấp do sự cố rạp).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch (Giữa Sơ đồ, SRS và Code thực tế):**
  - **Dòng 36-40 trong `.puml`:** Ghi `:Chuyển suất chiếu sang Cancelled và ngừng bán vé;`, `:Ghi nhận công nợ Chờ hoàn tiền 100% cho các vé bị hủy;`, `:Hoàn tiền và cộng lại tồn kho cho combo Chưa nhận;`.
  - *Đối chiếu với SRS Mục 4.8.2 (Luồng 4.8B) và Code (`src/app/api/screenings/[id]/route.ts` dòng 377-455):*
    1. Trong SRS Luồng 4.8B phân biệt rõ 2 nhánh:
       - **Nếu suất chiếu chưa bán vé nào:** Xóa vật lý suất chiếu kèm 50 ghế trống.
       - **Nếu suất chiếu đã có vé bán ra:** Hủy toàn bộ vé `Valid` sang `Cancelled` (giữ nguyên vé `Used`), giải phóng ghế về `EMPTY`, chuyển trạng thái suất chiếu sang `ENDED` / `CANCELLED` và xuất danh sách khách hàng cần hoàn tiền 100%.
    2. *(Lưu ý cho Code Auditor):* Trong code `DELETE /api/screenings/[id]/route.ts` hiện tại đang gán `status: 'ENDED'` (thay vì `'CANCELLED'`) và chưa có lệnh hoàn lại `Combo.stock` cho các `OrderCombo` chưa nhận. Trong `.puml` dòng 36 nên ghi `:Chuyển suất chiếu sang CANCELLED / ENDED và ngừng bán vé;` để khớp với cả đặc tả mục 4.8.1 và 4.8.2 của SRS.

---

### 16. File `16_quan_ly_combo.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.8 & Chương 6 - Mục 6.1 (`UC-17` - Quản lý danh mục & Tồn kho Combo).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Phản ánh đúng quy trình Admin thêm mới, chỉnh sửa thông tin/giá, cập nhật tồn kho (`stock`) và chuyển trạng thái ngừng kinh doanh (`INACTIVE`) khi combo đã có lịch sử đơn hàng (`src/app/api/combos/[id]/route.ts`).

---

### 17. File `17_bao_cao_doanh_thu.puml`
- **Mục SRS tương ứng:** Chương 4 - Mục 4.9 (`FR-REP-01`, `FR-REP-02`, `FR-REP-03`, `BR-10` - Báo cáo & Thống kê Doanh thu).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Phân làn 4 tầng kiến trúc rõ ràng, kiểm tra quyền `ADMIN` (`403 Forbidden`), lọc theo khoảng ngày / phim / phòng chiếu / kênh bán, truy vấn song song và tổng hợp đúng 4 chỉ số kế toán chuẩn `FR-REP-02` / `BR-10` (Doanh thu vé thực thu `Valid`/`Used`, Doanh thu bắp nước, Tiền chờ hoàn & Tiền đã hoàn, Tỷ lệ lấp đầy phòng chiếu).

---

### 18. File phụ `test_05.puml` (và `README.md`)
- **Mục SRS tương ứng:** Bản sao thử nghiệm của `05_dat_ve_combo_online.puml` (có thêm `skinparam ranksep 25` và `nodesep 20`).
- **Trạng thái:** `⚠️ Cần cập nhật / Xóa`
- **Chi tiết điểm lệch:**
  - `test_05.puml` (dòng 13, 81, 84, 86, 90, 92) vẫn đang ghi **`Cổng thanh toán VNPay`** giống hệt `05_dat_ve_combo_online.puml`. Khuyến nghị **xóa bỏ file nháp `test_05.puml`** ở cả 2 thư mục để tránh dư thừa, hoặc cập nhật đồng bộ sang `ZaloPay Sandbox v2`.
  - Ngoài ra, trong file `PlantUML_Activity_Diagrams/README.md` (dòng 37) vẫn ghi: `| 5 | 05_dat_ve_combo_online.puml | Đặt vé và mua combo online (VNPay) | Khách hàng, Hệ thống, Cổng VNPay |` -> Cần đổi thành **`ZaloPay Sandbox v2`**.

---

# BÁO CÁO KIỂM TOÁN CHI TIẾT: SƠ ĐỒ TRẠNG THÁI (STATE DIAGRAMS) & SƠ ĐỒ LỚP (MASTER CLASS DIAGRAM)

**Người thực hiện:** State & Class Diagrams Auditor  
**Ngày kiểm toán:** 2026-11-05  
**Tài liệu đối chiếu chuẩn:**
- Đặc tả Yêu cầu Phần mềm: [`SRS_He_Thong_Quan_Ly_Rap_Phim.md`](file:///d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md) (Mục 6.5, 6.6, 6.7)
- Lược đồ Cơ sở dữ liệu: [`cinema-app/prisma/schema.prisma`](file:///d:/cinema_project/cinema-app/prisma/schema.prisma)
- Mã nguồn thực tế: [`zalopay.ts`](file:///d:/cinema_project/cinema-app/src/lib/zalopay.ts), [`db-indexes.ts`](file:///d:/cinema_project/cinema-app/src/lib/db-indexes.ts), [`seats/reserve/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/seats/reserve/route.ts), [`combos/reserve/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/combos/reserve/route.ts), [`payments/initiate/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/payments/initiate/route.ts), [`payments/zalopay-ipn/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/payments/zalopay-ipn/route.ts)

---

## I. KIỂM TRA ĐỒNG BỘ GIỮA THƯ MỤC GỐC VÀ `cinema-app/`

Đã thực hiện băm SHA-256 (`Get-FileHash`) đối chiếu toàn bộ 8 file giữa thư mục gốc `d:/cinema_project/` và bản sao trong `d:/cinema_project/cinema-app/`:

| STT | Đường dẫn tương đối | Trạng thái đồng bộ (`Root` vs `cinema-app/`) | Ghi chú |
| :---: | :--- | :---: | :--- |
| 1 | `PlantUML_State_Diagrams/state_seat.puml` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi (kèm render lại `.png`). |
| 2 | `PlantUML_State_Diagrams/state_ticket.puml` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi (kèm render lại `.png`). |
| 3 | `PlantUML_State_Diagrams/state_payment.puml` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi (kèm render lại `.png`). |
| 4 | `PlantUML_State_Diagrams/state_combo.puml` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi (kèm render lại `.png`). |
| 5 | `PlantUML_State_Diagrams/state_screening.puml` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi (kèm render lại `.png`). |
| 6 | `PlantUML_State_Diagrams/state_movie.puml` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi (kèm render lại `.png`). |
| 7 | `PlantUML_Class_Diagram/class_diagram_lumicinema.puml` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi (kèm render lại `.svg`/`.png`). |
| 8 | `PlantUML_Class_Diagram/README.md` | ✅ Giống hệt 100% | Khi cập nhật cần sửa đồng thời cả 2 nơi. |

---

## II. KẾT QUẢ KIỂM TOÁN 06 SƠ ĐỒ TRẠNG THÁI (`PlantUML_State_Diagrams/`)

### 1. File `state_seat.puml`
- **Tên file:** [`PlantUML_State_Diagrams/state_seat.puml`](file:///d:/cinema_project/PlantUML_State_Diagrams/state_seat.puml) (và bản sao tại [`cinema-app/PlantUML_State_Diagrams/state_seat.puml`](file:///d:/cinema_project/cinema-app/PlantUML_State_Diagrams/state_seat.puml))
- **Mục SRS tương ứng:** **Mục 6.6.1** — Thực thể 1: Ghế ngồi theo suất chiếu (`Seat`) & Quy tắc **BR-01**.
- **Trạng thái:** ⚠️ **Cần cập nhật**
- **Kiểm tra các tiêu chí:**
  - Tên trạng thái (`EMPTY`, `RESERVED`, `OCCUPIED`): ✅ Khớp 100% với `enum SeatStatus` trong `schema.prisma` và Mục 6.6.1 SRS.
  - Thời gian giữ ghế (`10 phút`): ✅ Khớp 100% với `HOLD_MINUTES = 10` trong `seats/reserve/route.ts` và SRS.
  - Cổng thanh toán & Mã yêu cầu: ⚠️ Còn ghi `VNPay`, mã FR cũ `FR-SEL-01`, và thiếu nhánh kết thúc từ `EMPTY --> [*]`.
- **Danh sách chính xác từng dòng bị lệch và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.6.1 & Code) |
| :---: | :--- | :--- |
| **14** | `[*] --> EMPTY : Tạo suất chiếu mới\n/ Khởi tạo mặc định 50 ghế trống (A1-E10)` | `[*] --> EMPTY : Tạo suất chiếu mới (POST /api/admin/screenings)\n/ Khởi tạo mặc định 50 ghế STANDARD trống (A1-E10), reservedUntil = null` |
| **16** | `EMPTY --> RESERVED : Khách click chọn ghế trên sơ đồ (FR-SEL-01)\n/ Đặt khóa tạm thời: reservedUntil = NOW() + 10 phút` | `EMPTY --> RESERVED : Khách hoặc Staff chọn ghế (POST /api/seats/reserve - FR-BOK-02)\n[status == EMPTY] / Khóa nguyên tử: reservedUntil = NOW() + 10 phút` |
| **18** | `RESERVED --> EMPTY : [Quá hạn 10 phút giữ chỗ chưa thanh toán]\nhoặc Khách bỏ chọn ghế / Hủy phiên đặt vé\n/ Giải phóng ghế về trạng thái trống` | `RESERVED --> EMPTY : [Quá hạn 10 phút chưa thanh toán: NOW() > reservedUntil]\nhoặc Khách bỏ chọn ghế / Thanh toán Failed\n/ Giải phóng ghế (status = EMPTY, reservedUntil = null)` |
| **20** | `RESERVED --> OCCUPIED : Đơn hàng thanh toán thành công (VNPay / Tiền mặt POS)\n/ Xác nhận bán vé chính thức, gắn mã vé cố định` | `RESERVED --> OCCUPIED : Thanh toán thành công (ZaloPay Sandbox v2 IPN / Tiền mặt POS)\n[Payment == Success] / Xác nhận bán ghế chính thức, xóa reservedUntil = null, gắn Ticket (Valid)` |
| **24-25** | `OCCUPIED --> [*] : Suất chiếu kết thúc (Ended)\n/ Lưu trữ lịch sử ghế ngồi của suất chiếu` | `OCCUPIED --> [*] : Suất chiếu kết thúc (Screening == ENDED)\n/ Lưu trữ lịch sử ghế ngồi của suất chiếu`<br>`EMPTY --> [*] : Suất chiếu kết thúc hoặc bị hủy (ENDED / CANCELLED)` |

---

### 2. File `state_ticket.puml`
- **Tên file:** [`PlantUML_State_Diagrams/state_ticket.puml`](file:///d:/cinema_project/PlantUML_State_Diagrams/state_ticket.puml) (và bản sao tại [`cinema-app/PlantUML_State_Diagrams/state_ticket.puml`](file:///d:/cinema_project/cinema-app/PlantUML_State_Diagrams/state_ticket.puml))
- **Mục SRS tương ứng:** **Mục 6.6.2** — Thực thể 2: Vé xem phim & Trạng thái hoàn tiền (`Ticket` & `RefundStatus`) & Quy tắc **BR-03, BR-04, BR-09**.
- **Trạng thái:** ⚠️ **Cần cập nhật**
- **Kiểm tra các tiêu chí:**
  - Thời gian timeout giữ chỗ/thanh toán: ❌ **Đang ghi sai là `15 phút`** ở dòng 16 (Chuẩn SRS & Code là **10 phút**).
  - Cổng thanh toán: ❌ **Đang ghi `VNPay IPN`** ở dòng 18 (Chuẩn SRS & Code là **ZaloPay Sandbox v2 IPN**).
  - Tên trạng thái (`TicketStatus` & `RefundStatus`): ⚠️ Trong `schema.prisma`, `enum TicketStatus` chỉ có 3 giá trị: `Valid`, `Used`, `Cancelled` (vé chỉ được `INSERT` vào bảng `tickets` với trạng thái `Valid` khi `Payment == Success`, hoặc trong SRS Mục 6.6.2 sơ đồ bắt đầu từ `[*] --> Valid`). File `.puml` hiện đang vẽ trạng thái `PENDING_PAYMENT` làm trạng thái đầu, đặt tên sub-state `HUY_BOI_KHACH` thay vì `NONE`, và đặt `REFUNDED_CASH` nằm ngoài composite state `Cancelled` (trong khi theo SRS Mục 6.6.2, `REFUNDED_CASH` là sub-state của `Cancelled` ứng với `status = Cancelled` và `refundStatus = REFUNDED_CASH`).
- **Danh sách chính xác từng dòng bị lệch và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.6.2 & Schema) |
| :---: | :--- | :--- |
| **14-18** | `[*] --> PENDING_PAYMENT : Khách chọn ghế & đặt vé\n/ Tạo đơn hàng chờ thanh toán`<br>`PENDING_PAYMENT --> Cancelled : Hết 15 phút không thanh toán...`<br>`PENDING_PAYMENT --> Valid : Thanh toán thành công (VNPay IPN / Tiền mặt POS)...` | Đồng bộ theo SRS Mục 6.6.2 (hoặc nếu giữ bước tạo đơn tạm thì phải ghi rõ **10 phút** và **ZaloPay Sandbox v2**):<br>`[*] --> Valid : Thanh toán thành công (ZaloPay Sandbox v2 / POS)\n[Vượt qua kiểm tra Partial Unique Index unique_active_ticket]\n/ Kích hoạt vé Valid (refundStatus = NONE) & Sinh mã QR ký số HMAC-SHA256 (BR-09)`<br>*(Lưu ý: Nếu muốn thể hiện phiên chờ thanh toán thì phải sửa `15 phút` thành **`10 phút`** và `VNPay IPN` thành **`ZaloPay Sandbox v2 IPN / Return`**).* |
| **20-23** | `state Valid {`<br>`  [*] --> ChoSoatVe`<br>`  ChoSoatVe : Vé hợp lệ và đang chờ đến giờ chiếu`<br>`}` | `state Valid {`<br>`  [*] --> ReadyForCheckIn`<br>`  ReadyForCheckIn : Vé hợp lệ chờ soát vé (refundStatus = NONE)`<br>`}` |
| **25** | `Valid --> Used : Nhân viên quét mã QR tại cổng kiểm soát\n[Giờ chiếu - 30p <= Hiện tại <= Giờ chiếu + 45p]\n/ Đóng dấu vé đã sử dụng (FR-CHK-01)` | `Valid --> Used : Nhân viên quét QR Check-in (POST /api/staff/checkin - FR-CHK-01)\n[Chữ ký HMAC-SHA256 hợp lệ & startTime - 30p <= NOW() <= endTime]\n/ Cập nhật status = Used (refundStatus = NONE)` |
| **27** | `Valid --> Cancelled : [Khách yêu cầu hủy TRƯỚC giờ chiếu >= 2 tiếng]\n/ Hủy vé, sinh Voucher giảm 50% hạn 30 ngày (BR-03)\n[Không hoàn tiền mặt/chuyển khoản]` | `Valid --> ClientCancelled : Khách tự hủy vé (POST /api/tickets/[id]/cancel)\n[startTime - NOW() >= 2 tiếng (BR-03)]\n/ Giải phóng ghế EMPTY, cấp Voucher COMP50_XXXXX (50%, hạn 30 ngày), không hoàn tiền mặt` |
| **29** | `Valid --> Cancelled : [Rạp gặp sự cố kỹ thuật: mất điện, hỏng máy chiếu (FR-ADM-04)]\n/ Hủy vé, tự động thiết lập refundStatus = PENDING_CASH_REFUND (BR-04)` | `Valid --> PendingRefund : Hủy vé do sự cố rạp / Hủy suất chiếu khẩn cấp (BR-04)\n[Không giới hạn 2 tiếng]\n/ Giải phóng ghế EMPTY, hoàn kho Combo chưa nhận, ghi AuditLog` |
| **31-36** | `state Cancelled {`<br>`  state "PENDING_CASH_REFUND..." as PendingRefund`<br>`  state "HUY_BOI_KHACH..." as ClientCancelled`<br>`}`<br>`Cancelled --> REFUNDED_CASH : Khách xuất trình mã vé tại quầy rạp...` | Đưa cả 3 trạng thái `RefundStatus` (`NONE`, `PENDING_CASH_REFUND`, `REFUNDED_CASH`) vào bên trong composite state `Cancelled` đúng chuẩn Mục 6.6.2 SRS:<br>`state "Cancelled (status = Cancelled)" as Cancelled {`<br>`  state "NONE\n(Khách tự hủy - Đã nhận Voucher COMP50_ 50%)" as ClientCancelled`<br>`  state "PENDING_CASH_REFUND\n(Sự cố rạp - Chờ hoàn 100% tiền mặt)" as PendingRefund`<br>`  state "REFUNDED_CASH\n(Đã chi trả 100% tiền mặt tại quầy)" as RefundedCash`<br>`  PendingRefund --> RefundedCash : Khách đến quầy trong vòng 30 ngày\n& Nhân viên xác nhận chi quỹ (POST /api/staff/tickets/[id]/refund)\n/ Cập nhật Payment = Refunded & Ghi AuditLog kế toán (BR-10)`<br>`}` |
| **46-47** | `REFUNDED_CASH --> [*] : Hoàn tất chi trả tiền mặt`<br>`ClientCancelled --> [*] : Kết thúc quy trình hủy do khách` | `RefundedCash --> [*] : Tất toán hoàn tất công nợ tiền mặt`<br>`ClientCancelled --> [*] : Kết thúc (Đã đền bù bằng Voucher 50%)` |

---

### 3. File `state_payment.puml`
- **Tên file:** [`PlantUML_State_Diagrams/state_payment.puml`](file:///d:/cinema_project/PlantUML_State_Diagrams/state_payment.puml) (và bản sao tại [`cinema-app/PlantUML_State_Diagrams/state_payment.puml`](file:///d:/cinema_project/cinema-app/PlantUML_State_Diagrams/state_payment.puml))
- **Mục SRS tương ứng:** **Mục 6.6.3** — Thực thể 3: Giao dịch Thanh toán (`Payment`) & Quy tắc **BR-09, BR-10**.
- **Trạng thái:** ⚠️ **Cần cập nhật**
- **Kiểm tra các tiêu chí:**
  - Tên trạng thái (`Pending`, `Success`, `Failed`, `Refunded`): ✅ Khớp 100% với `enum PaymentStatus` trong `schema.prisma`.
  - Cổng thanh toán & Thuật toán băm: ❌ **Đang ghi `VNPay`, `vnp_ResponseCode == "00"`, `HMAC SHA512`** ở các dòng 14, 16, 18, 30, 31 (Chuẩn SRS & Code là **ZaloPay Sandbox v2 (`app_id: 2553`)**, `return_code == 1`, chữ ký **HMAC-SHA256** với `ZALOPAY_KEY1` khi tạo đơn và `ZALOPAY_KEY2` khi xác thực Webhook IPN Callback).
  - Thời gian timeout giữ chỗ/thanh toán: ❌ **Đang ghi `15 phút`** ở dòng 18 và dòng 28 (Chuẩn Code `HOLD_MINUTES = 10` là **10 phút**).
- **Danh sách chính xác từng dòng bị lệch và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.6.3 & Code) |
| :---: | :--- | :--- |
| **14** | `[*] --> Pending : Khách xác nhận đặt hàng\n/ Sinh URL thanh toán VNPay hoặc Tạo đơn POS tại quầy` | `[*] --> Pending : Khởi tạo đơn hàng (POST /api/payments/initiate hoặc POS)\n/ Sinh mã giao dịch app_trans_id (YYMMDD_xxxx) & Ký MAC HMAC-SHA256 bằng ZALOPAY_KEY1` |
| **16** | `Pending --> Success : Nhận IPN VNPay hợp lệ (vnp_ResponseCode == "00" && Checksum đúng)\nHOẶC Thu ngân POS xác nhận thu đủ tiền mặt (FR-POS-02)\n/ Cập nhật đơn hàng thành công, kích hoạt xuất vé & combo` | `Pending --> Success : Nhận Webhook IPN / Return ZaloPay Sandbox v2 hợp lệ\n(return_code == 1 && MAC HMAC-SHA256 với ZALOPAY_KEY2 hợp lệ)\nHOẶC Thu ngân POS xác nhận thu đủ tiền mặt/QR (FR-POS-01)\n/ Kích hoạt Ticket = Valid, Seat = OCCUPIED, ComboReservation = COMPLETED & tạo OrderCombo` |
| **18** | `Pending --> Failed : [Khách nhấn Hủy trên cổng VNPay]\nhoặc [Quá hạn phiên giao dịch 15 phút]\nhoặc [Checksum IPN không hợp lệ]\n/ Hủy đơn hàng, giải phóng các ghế đang giữ chỗ (EMPTY)` | `Pending --> Failed : [Khách hủy trên cổng ZaloPay / return_code != 1]\nhoặc [Quá hạn giữ chỗ 10 phút: NOW() > reservedUntil]\n/ Hủy đơn hàng, giải phóng ghế về EMPTY, giải phóng ComboReservation = RELEASED` |
| **20** | `Success --> Refunded : Suất chiếu bị hủy khẩn cấp do sự cố kỹ thuật của rạp (BR-04)\n& Khách xuất trình vé tại quầy trong vòng 30 ngày (FR-CAN-02)\n/ Thu ngân xuất quỹ tiền mặt hoàn 100% cho khách` | `Success --> Refunded : Vé/Suất chiếu bị hủy do sự cố kỹ thuật của rạp (BR-04)\n& Thu ngân xác nhận đã chi trả 100% tiền mặt tại quầy trong vòng 30 ngày (FR-CAN-02)\n/ Cập nhật refundStatus = REFUNDED_CASH & Ghi giảm doanh thu thực thu (BR-10)` |
| **26-32** | `note right of Pending`<br>`  <b>RÀNG BUỘC THANH TOÁN:</b>`<br>`  - Timeout tối đa 15 phút.`<br>`  - Phải xác thực chữ ký bảo mật`<br>`    (Secure Hash / Checksum HMAC SHA512)`<br>`    từ cổng VNPay trước khi chuyển sang Success.`<br>`end note` | `note right of Pending`<br>`  <b>RÀNG BUỘC THANH TOÁN (BR-09 & NFR-INT-01):</b>`<br>`  - Thời gian khóa ghế & giữ kho combo: <b>10 phút</b>.`<br>`  - Tích hợp <b>ZaloPay Sandbox v2 (app_id: 2553)</b>:`<br>`    + Tạo đơn: Ký <b>HMAC-SHA256</b> với <b>ZALOPAY_KEY1</b>.`<br>`    + Xác thực IPN Callback: Kiểm tra <b>MAC HMAC-SHA256</b>`<br>`      với <b>ZALOPAY_KEY2</b> (timingSafeEqual) & đảm bảo Idempotency.`<br>`end note` |

---

### 4. File `state_combo.puml`
- **Tên file:** [`PlantUML_State_Diagrams/state_combo.puml`](file:///d:/cinema_project/PlantUML_State_Diagrams/state_combo.puml) (và bản sao tại [`cinema-app/PlantUML_State_Diagrams/state_combo.puml`](file:///d:/cinema_project/cinema-app/PlantUML_State_Diagrams/state_combo.puml))
- **Mục SRS tương ứng:** **Mục 6.6.4** — Thực thể 4: Đơn hàng Combo Bắp nước (`ComboReservation` & `OrderCombo`) & Quy tắc **BR-05**.
- **Trạng thái:** ⚠️ **Cần cập nhật**
- **Kiểm tra các tiêu chí:**
  - Giai đoạn giữ kho tạm thời 10 phút (`ComboReservation`): ❌ File `.puml` hiện tại **bỏ sót hoàn toàn** giai đoạn `ComboReservation` (`RESERVED` trong 10 phút -> `EXPIRED`/`RELEASED` hoặc `COMPLETED`) đã được định nghĩa trong `schema.prisma` (model `ComboReservation`), code `combos/reserve/route.ts` và SRS Mục 6.6.4.
  - Thời điểm trừ tồn kho `Combos.stock`: ❌ Dòng 16 của `state_combo.puml` đang ghi sai nghiệp vụ: *"Nhân viên bấm Xác nhận đã giao bắp nước / Đánh dấu món đã nhận, trừ tồn kho Combos.stock"*. Trong thực tế (SRS Mục 6.6.4 và code `combos/reserve/route.ts` + `zalopay-ipn/route.ts`), tồn kho `Combos.stock` được khóa/trừ ngay khi giữ chỗ & thanh toán thành công (`RESERVED --> CONFIRMED`), còn khi nhân viên giao bắp nước tại quầy (`POST /api/staff/combos/deliver`) chỉ cập nhật `isDelivered = true` và `deliveredAt = NOW()`, tuyệt đối không trừ kho ở bước giao hàng.
  - Tên trạng thái: Cần thể hiện đầy đủ cả `ComboReservation` (`RESERVED`, `EXPIRED / RELEASED`) và `OrderCombo` (`CONFIRMED`: `Chưa nhận (isDelivered = false)`, `Đã nhận (isDelivered = true)`, `Đã hủy (CANCELLED)`).
- **Danh sách chính xác từng dòng bị lệch và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.6.4 & Schema/Code) |
| :---: | :--- | :--- |
| **12** | `title SƠ ĐỒ TRẠNG THÁI MÓN BẮP NƯỚC TRONG ĐƠN (ORDER COMBO STATE MACHINE)` | `title SƠ ĐỒ TRẠNG THÁI ĐƠN HÀNG BẮP NƯỚC (COMBO RESERVATION & ORDER COMBO STATE MACHINE)` |
| **14-21** | `[*] --> PENDING_PICKUP : Đơn hàng thanh toán thành công có kèm Combo...`<br>`PENDING_PICKUP --> PICKED_UP : ... / Đánh dấu món đã nhận, trừ tồn kho Combos.stock`<br>`PENDING_PICKUP --> CANCELLED : ...` | Cập nhật toàn bộ luồng trạng thái khớp 100% với SRS Mục 6.6.4:<br>`[*] --> RESERVED : Khách chọn Combo khi đặt vé (POST /api/combos/reserve)\n[combo.status == ACTIVE && stock >= quantity]\n/ Trừ tạm combos.stock, tạo ComboReservation (status = RESERVED, reservedUntil = NOW() + 10 phút)`<br><br>`RESERVED --> EXPIRED : Quá hạn 10 phút không thanh toán [NOW() > reservedUntil]\nhoặc Giao dịch Payment Failed\n/ Cập nhật ComboReservation = RELEASED, cộng hoàn lại combos.stock`<br><br>`RESERVED --> CONFIRMED : Thanh toán thành công (Payment == Success)\n/ Cập nhật ComboReservation = COMPLETED & Khởi tạo OrderCombo`<br><br>`state "CONFIRMED (OrderCombo đã thanh toán)" as CONFIRMED {`<br>`    [*] --> PENDING_PICKUP`<br>`    state "Chưa nhận (PENDING_PICKUP / isDelivered = false)" as PENDING_PICKUP`<br>`    state "Đã nhận (PICKED_UP / isDelivered = true)" as PICKED_UP`<br>`    state "Đã hủy (CANCELLED - Do sự cố rạp)" as CANCELLED`<br>`    PENDING_PICKUP --> PICKED_UP : Khách xuất trình mã đơn tại quầy Concession\n& Nhân viên xác nhận giao (POST /api/staff/combos/deliver - FR-CHK-02)\n[isDelivered == false] / Cập nhật isDelivered = true, deliveredAt = NOW() (Chặn nhận lần 2 - BR-05)`<br>`    PENDING_PICKUP --> CANCELLED : Vé/Suất chiếu bị hủy do sự cố kỹ thuật rạp (BR-04)\n[isDelivered == false] / Cộng hoàn lại số lượng vào combos.stock\n& Cộng gộp tiền combo vào công nợ hoàn tiền mặt 100%`<br>`}`<br><br>`EXPIRED --> [*] : Kết thúc giữ chỗ quá hạn`<br>`PICKED_UP --> [*] : Hoàn tất phục vụ tại quầy Concession`<br>`CANCELLED --> [*] : Hoàn tất hoàn kho & ghi nhận công nợ hoàn tiền` |

---

### 5. File `state_screening.puml`
- **Tên file:** [`PlantUML_State_Diagrams/state_screening.puml`](file:///d:/cinema_project/PlantUML_State_Diagrams/state_screening.puml) (và bản sao tại [`cinema-app/PlantUML_State_Diagrams/state_screening.puml`](file:///d:/cinema_project/cinema-app/PlantUML_State_Diagrams/state_screening.puml))
- **Mục SRS tương ứng:** **Mục 6.6.5** — Thực thể 5: Suất chiếu (`Screening`) & Quy tắc **BR-01, BR-04, BR-08**.
- **Trạng thái:** ⚠️ **Cần cập nhật (nhỏ)**
- **Kiểm tra các tiêu chí:**
  - Tên trạng thái (`UPCOMING`, `SHOWING`, `ENDED`, `CANCELLED`): ✅ Khớp 100% với `enum ScreeningStatus` trong `schema.prisma` (Lưu ý: SRS Mục 6.6.5 ghi `ONGOING (SHOWING)` trong bảng và `ONGOING` trong hình vẽ, còn `schema.prisma` dùng `SHOWING` — nên hiển thị rõ `SHOWING (ONGOING)` trong `.puml` để đồng bộ cả hai).
  - Quy tắc chống trùng lịch phòng chiếu (`BR-08` - buffer 15 phút dọn phòng) & khởi tạo 50 ghế (`BR-01`) & ghi `AuditLog` (`NFR-INT-02`): ⚠️ Trong `state_screening.puml` dòng 14 đang ghi nhầm mã yêu cầu là `FR-ADM-04` (thực tế theo SRS Mục 7.1, tạo suất chiếu & chống trùng phòng là `FR-ADM-03` và `BR-08`, còn `FR-ADM-04` là hủy suất chiếu khẩn cấp), đồng thời thiếu điều kiện biên `[Không trùng phòng chiếu + 15p buffer]` và hành động `Khởi tạo 50 ghế A1..E10` + `Ghi AuditLog`.
- **Danh sách chính xác từng dòng bị lệch và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.6.5 & Schema) |
| :---: | :--- | :--- |
| **14** | `[*] --> UPCOMING : Quản lý tạo suất chiếu mới (FR-ADM-04)\n/ Thiết lập phòng, phim, giờ chiếu & mở bán vé` | `[*] --> UPCOMING : Admin tạo suất chiếu mới (POST /api/admin/screenings - FR-ADM-03)\n[Không trùng lịch phòng chiếu: startTime..endTime + 15p buffer (BR-08)]\n/ Tự động khởi tạo 50 ghế STANDARD (A1..E10 - BR-01) & Mở bán vé` |
| **16** | `UPCOMING --> SHOWING : [Hiện tại >= startTime]\n/ Tự động đóng bán vé online, mở cổng soát vé phòng chiếu` | `UPCOMING --> SHOWING : Đến giờ bắt đầu chiếu [NOW() >= startTime]\n/ Đóng đặt vé online, duy trì cổng soát vé QR tại rạp` |
| **18** | `SHOWING --> ENDED : [Hiện tại >= startTime + duration]\n/ Kết thúc suất chiếu, chốt doanh thu phòng vé` | `SHOWING --> ENDED : Hết thời lượng chiếu phim [NOW() >= endTime]\n/ Đóng cổng soát vé, chốt thống kê doanh thu & tỷ lệ lấp đầy` |
| **20** | `UPCOMING --> CANCELLED : Quản lý kích hoạt Hủy suất chiếu khẩn cấp do sự cố\n(Mất điện, hỏng phòng chiếu, hỏng máy chiếu - FR-ADM-04)\n/ Dừng bán vé ngay lập tức,\n  Tự động chuyển toàn bộ vé đã bán sang Cancelled,\n  Thiết lập refundStatus = PENDING_CASH_REFUND (BR-04)` | `UPCOMING --> CANCELLED : Admin kích hoạt Hủy suất chiếu khẩn cấp do sự cố (FR-ADM-04)\n/ Dừng bán vé, chuyển toàn bộ vé Valid sang Cancelled (PENDING_CASH_REFUND 100% - BR-04),\n  Giải phóng ghế về EMPTY, hoàn kho Combo chưa nhận & Ghi AuditLog` |
| **32** | `  3. Combo bắp nước trong đơn -> Cancelled & hoàn kho` | `  3. Combo chưa nhận (isDelivered = false) -> Cancelled & hoàn kho combos.stock`<br>`  4. Ghi nhận nhật ký kiểm toán sự cố (AuditLog - NFR-INT-02)` |

---

### 6. File `state_movie.puml`
- **Tên file:** [`PlantUML_State_Diagrams/state_movie.puml`](file:///d:/cinema_project/PlantUML_State_Diagrams/state_movie.puml) (và bản sao tại [`cinema-app/PlantUML_State_Diagrams/state_movie.puml`](file:///d:/cinema_project/cinema-app/PlantUML_State_Diagrams/state_movie.puml))
- **Mục SRS tương ứng:** **Mục 6.6.6** — Thực thể 6: Phim (`Movie`) & Quy tắc **BR-02, BR-07**.
- **Trạng thái:** ⚠️ **Cần cập nhật (nhỏ)**
- **Kiểm tra các tiêu chí:**
  - Tên trạng thái (`UPCOMING`, `SHOWING`, `ENDED`) và cờ `isDeleted`: ✅ Khớp 100% với `enum MovieStatus` và trường `isDeleted: Boolean` trong `schema.prisma`.
  - Chuyển trạng thái khôi phục phim tái chiếu (`ENDED --> SHOWING`): ⚠️ Trong SRS Mục 6.6.6 (cả Bảng chuyển trạng thái dòng 1616 và Sơ đồ trạng thái dòng 1630) có định nghĩa luồng **Re-release**: `ENDED --> SHOWING : Admin mở chiếu lại phim (Re-release) / Cập nhật status = SHOWING, isDeleted = false`. File `state_movie.puml` hiện đang thiếu mũi tên chuyển trạng thái này.
  - Ngoài ra ở dòng 14 nên bổ sung rõ khởi tạo `isDeleted = false` và gắn nhãn độ tuổi (`P`, `C13`, `T18` - `BR-02`).
- **Danh sách chính xác từng dòng bị lệch và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.6.6) |
| :---: | :--- | :--- |
| **14** | `[*] --> UPCOMING : Admin thêm phim mới vào hệ thống (FR-ADM-01)\n/ Hiển thị banner "Sắp chiếu", poster, trailer & thông tin phim` | `[*] --> UPCOMING : Admin thêm phim mới (POST /api/admin/movies - FR-ADM-01)\n/ Thiết lập nhãn độ tuổi (P, C13, T18 - BR-02), isDeleted = false, hiển thị mục "Sắp chiếu"` |
| **16** | `UPCOMING --> SHOWING : Quản lý rạp xếp ít nhất 1 suất chiếu hoạt động\n/ Hiển thị trong mục "Đang chiếu", mở tính năng đặt vé online` | `UPCOMING --> SHOWING : Đến ngày khởi chiếu [TODAY >= releaseDate] hoặc Admin mở bán suất chiếu\n/ Cập nhật status = SHOWING (isDeleted = false), mở đặt vé & đánh giá 1-5 sao` |
| **18** | `SHOWING --> ENDED : Hết thời gian công chiếu hoặc Quản lý thực hiện Soft Delete (FR-ADM-02)\n[isDeleted = true]\n/ Ẩn khỏi trang chủ, ngừng xếp suất chiếu mới` | `SHOWING --> ENDED : Hết hạn công chiếu [TODAY > endDate] hoặc Admin Ngừng chiếu / Soft Delete (FR-ADM-02, BR-07)\n/ Cập nhật status = ENDED (kèm isDeleted = true nếu xóa mềm), ẩn khỏi danh sách đặt vé` |
| **Sau dòng 21** | *(Chưa có luồng chiếu lại `ENDED --> SHOWING`)* | Bổ sung thêm luồng tái chiếu theo đúng Mục 6.6.6 SRS:<br>`ENDED --> SHOWING : Admin khôi phục phim để tái chiếu (Re-release - PUT /api/admin/movies/[id])\n/ Cập nhật status = SHOWING, isDeleted = false` |

---

## III. KẾT QUẢ KIỂM TOÁN SƠ ĐỒ LỚP TỔNG THỂ (`PlantUML_Class_Diagram/`)

### 7. File `class_diagram_lumicinema.puml`
- **Tên file:** [`PlantUML_Class_Diagram/class_diagram_lumicinema.puml`](file:///d:/cinema_project/PlantUML_Class_Diagram/class_diagram_lumicinema.puml) (và bản sao tại [`cinema-app/PlantUML_Class_Diagram/class_diagram_lumicinema.puml`](file:///d:/cinema_project/cinema-app/PlantUML_Class_Diagram/class_diagram_lumicinema.puml))
- **Mục SRS tương ứng:** **Mục 6.5 (ERD)** & **Mục 6.7 (Đặc tả Kiến trúc Lớp & Ánh xạ Thành phần)**.
- **Trạng thái:** ⚠️ **Cần cập nhật**
- **Kiểm tra chi tiết theo các tiêu chí kiểm toán:**
  1. **Kiểm tra `enum PaymentMethod`:**
     - ❌ Trong `class_diagram_lumicinema.puml` (dòng 258-263), `enum PaymentMethod` chỉ có `VNPay`, `Momo`, `Cash`, `BankCard` — **thiếu `ZaloPay`** (trong khi `schema.prisma` dòng 51-57 đã có `ZaloPay` và đây là cổng thanh toán chính của hệ thống!).
  2. **Kiểm tra các thuộc tính Entity so với `schema.prisma` và SRS Mục 6.5 / 6.7:**
     - ⚠️ Lớp `Movie` (dòng 67-85): Thiếu thuộc tính `- isDeleted: Boolean` (cờ xóa mềm `BR-07` có trong `schema.prisma` dòng 120 và SRS Mục 6.7), thiếu `- director: String`, `- cast: String`.
     - ⚠️ Lớp `Combo` (dòng 171-182): Thiếu thuộc tính `- reservedUntil: DateTime` (có trong `schema.prisma` dòng 225 và SRS Mục 6.5).
     - ⚠️ Lớp `Ticket` (dòng 128-139): Trong SRS Mục 6.7.2 có thêm `- refundStatus: String` (`NONE | PENDING_CASH_REFUND | REFUNDED_CASH`) và các phương thức xử lý hoàn tiền sự cố.
     - ⚠️ Lớp `Payment` (dòng 141-152): Trong `schema.prisma` dòng 258-261 có các trường ngữ cảnh giao dịch `- screeningId: Int`, `- seatIds: Json`, `- couponCode: String`, `- ticketItems: Json`.
     - ✅ Lớp `ComboReservation` (dòng 194-201): Đã có mặt đầy đủ với `id`, `quantity`, `status`, `reservedUntil`.
     - ✅ `enum SeatType` (dòng 235-239): Đã có `STANDARD`, `VIP`, `COUPLE`.
  3. **Kiểm tra Lớp `AuditLog` (Nhật ký kiểm toán) và các Lớp Service / Controller:**
     - ❌ Trong SRS Mục 6.5 (dòng 1409-1417) có thực thể `AUDIT_LOGS` (`log_id`, `actor_id`, `action`, `target_entity`, `target_id`, `metadata`, `created_at`) và trong SRS Mục 6.7.1 & 6.7.2 có đầy đủ **3 lớp Service** (`ZaloPayService`, `QRSignatureService`, `SeatExpirationService`) cùng **các lớp Controller** (`BookingAndPaymentController`, `StaffOperationsController`, `AdminManagementController`). File `class_diagram_lumicinema.puml` hiện mới chỉ vẽ các lớp Domain Entity mà **chưa có** `AuditLog` cũng như các lớp Service (`ZaloPayService`, `QRSignatureService`, `SeatExpirationService`).
  4. **Kiểm tra Phần Ghi chú (Business Rule Notes) và Ràng buộc CSDL:**
     - ❌ Dòng 331 trong Note của `Payment` đang ghi: `- Tích hợp VNPay / Momo xác thực mã checksum IPN` thay vì **ZaloPay Sandbox v2 (`app_id: 2553`, xác thực `HMAC-SHA256` với `ZALOPAY_KEY1` / `ZALOPAY_KEY2`)**.
     - ❌ Trong Note của `Ticket` hoặc `Seat` (dòng 309-321) **còn thiếu ghi chú về Partial Unique Index `unique_active_ticket`** (`CREATE UNIQUE INDEX unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled'`) chống đặt trùng vé ở tầng PostgreSQL (`db-indexes.ts`).

- **Danh sách chính xác từng dòng bị lệch trong `class_diagram_lumicinema.puml` và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.5, 6.7 & `schema.prisma`) |
| :---: | :--- | :--- |
| **67-85** | Lớp `Movie` thiếu `isDeleted`, `director`, `cast` | Bổ sung vào danh sách thuộc tính của `Movie`:<br>`- director: String`<br>`- cast: String`<br>`- isDeleted: Boolean`<br>và bổ sung phương thức `+ softDelete(): Void` |
| **128-139** | Lớp `Ticket` chưa ghi rõ `refundStatus` và phương thức hoàn tiền sự cố | Bổ sung thuộc tính `- refundStatus: String` (hoặc chú thích trong `cancellationReason`) và các phương thức:<br>`+ cancelByCustomer(): Coupon`<br>`+ cancelByIncident(reason: String): Void`<br>`+ confirmCashRefund(staffId: Int): Void` |
| **149-150** | Phương thức trong `Payment`:<br>`+ createPaymentUrl(gateway: PaymentMethod): String`<br>`+ processIPNCallback(data: Map<String, String>): Boolean` | Cập nhật rõ ngữ nghĩa hỗ trợ ZaloPay Sandbox v2:<br>`+ createZaloPayOrder(): ZaloPayOrderResponse`<br>`+ processZaloPayIPN(data: String, mac: String): Boolean` |
| **171-182** | Lớp `Combo` thiếu `reservedUntil` | Bổ sung thuộc tính `- reservedUntil: DateTime` vào lớp `Combo` (khớp `schema.prisma` dòng 225). |
| **Sau dòng 210** | *(Chưa có lớp `AuditLog` và các lớp `Service`)* | Bổ sung lớp `AuditLog` (theo Mục 6.5 SRS & NFR-INT-02) và gói `Services` (theo Mục 6.7 SRS):<br>- Lớp `AuditLog`: `- id: Int`, `- actorId: Int`, `- action: String`, `- targetEntity: String`, `- targetId: Int`, `- metadata: String`, `- createdAt: DateTime`, `+ recordLog(): Void`<br>- Lớp `ZaloPayService <<service>>`: `- appId: String ("2553")`, `- key1: String`, `- key2: String`, `+ createSandboxOrder(payment: Payment): ZaloOrderResponse`, `+ verifyIPNCallback(data: String, mac: String): Boolean`, `+ verifyReturnChecksum(params: Map): Boolean`<br>- Lớp `QRSignatureService <<service>>`: `- secretKey: String`, `+ signQR(ticketId: Int, screeningId: Int, seatCode: String): String`, `+ verifyQR(payload: String, signature: String): Boolean`<br>- Lớp `SeatExpirationService <<service>>`: `- holdDurationMinutes: Int (10)`, `+ releaseExpiredSeatsAndCombos(screeningId: Int): Int`, `+ reserveSeatsAtomic(screeningId: Int, seatIds: List<Int>): Boolean`<br>Kèm các đường phụ thuộc (`..>`): `Payment ..> ZaloPayService`, `Ticket ..> QRSignatureService`, `Seat ..> SeatExpirationService`, `User "1" o-- "0..*" AuditLog : thực thi`. |
| **258-263** | `enum PaymentMethod {`<br>`    VNPay`<br>`    Momo`<br>`    Cash`<br>`    BankCard`<br>`}` | Bổ sung **`ZaloPay`** (đặt lên đầu làm phương thức mặc định):<br>`enum PaymentMethod {`<br>`    ZaloPay`<br>`    Cash`<br>`    VNPay`<br>`    Momo`<br>`    BankCard`<br>`}` |
| **309-313** | `note bottom of Seat`<br>`  **BR-01: Giữ ghế tạm thời 10 phút**`<br>`  - Chống Race Condition bằng ACID Transaction`<br>`  - Tự động hoàn lại 'EMPTY' khi quá hạn reservedUntil`<br>`end note` | Bổ sung quy chuẩn 50 ghế `STANDARD` và `Partial Unique Index`:<br>`note bottom of Seat`<br>`  **BR-01: Khởi tạo 50 ghế STANDARD & Giữ ghế 10 phút**`<br>`  - Mặc định type = STANDARD (A1..E10), khóa tạm HOLD_MINUTES = 10`<br>`  - Chống Race Condition bằng ACID Transaction & Lazy Release`<br>`  - Tự động hoàn lại 'EMPTY' khi quá hạn reservedUntil`<br>`end note` |
| **315-321** | `note right of Ticket` thiếu `unique_active_ticket` | Bổ sung dòng vào `note right of Ticket`:<br>`  - Chống đặt trùng vé bằng Partial Unique Index: unique_active_ticket (screening_id, seat_id WHERE status != 'Cancelled')`<br>`  - Sự cố rạp: PENDING_CASH_REFUND -> REFUNDED_CASH trong 30 ngày (BR-04)` |
| **329-333** | `note bottom of Payment`<br>`  **BR-08 & BR-10: Cổng thanh toán & Doanh thu**`<br>`  - Tích hợp VNPay / Momo xác thực mã checksum IPN`<br>`  - Bóc tách doanh thu thực thu và tiền hoàn vé (BR-10)`<br>`end note` | Sửa thành **BR-09 & BR-10** với **ZaloPay Sandbox v2**:<br>`note bottom of Payment`<br>`  **BR-09 & BR-10: Cổng thanh toán ZaloPay & Đối soát Doanh thu**`<br>`  - Tích hợp ZaloPay Sandbox v2 (app_id: 2553)`<br>`  - Xác thực HMAC-SHA256 hai chiều (ZALOPAY_KEY1 tạo đơn / ZALOPAY_KEY2 kiểm tra IPN)`<br>`  - Bóc tách Doanh thu thực thu, Công nợ chờ hoàn & Tiền đã hoàn (BR-10)`<br>`end note` |

---

### 8. File `PlantUML_Class_Diagram/README.md`
- **Tên file:** [`PlantUML_Class_Diagram/README.md`](file:///d:/cinema_project/PlantUML_Class_Diagram/README.md) (và bản sao tại [`cinema-app/PlantUML_Class_Diagram/README.md`](file:///d:/cinema_project/cinema-app/PlantUML_Class_Diagram/README.md))
- **Mục SRS tương ứng:** **Mục 6.5 & Mục 6.7** — Thuyết minh Kiến trúc Sơ đồ Lớp.
- **Trạng thái:** ⚠️ **Cần cập nhật**
- **Danh sách chính xác từng dòng bị lệch trong `PlantUML_Class_Diagram/README.md` và nội dung chuẩn cần sửa:**

| Dòng | Nội dung hiện tại (Bị lệch) | Nội dung chuẩn cần sửa lại (Khớp SRS Mục 6.5, 6.7 & Code) |
| :---: | :--- | :--- |
| **138-156** | Đặc tả lớp `Movie` thiếu thuộc tính `- isDeleted: Boolean`, `- director: String`, `- cast: String` | Bổ sung đặc tả thuộc tính `- isDeleted: Boolean`: Cờ xóa mềm (`Soft Delete`, mặc định `false`) theo quy tắc `BR-07`, cùng `- director: String` và `- cast: String`. |
| **182** | `- type: SeatType: Hạng ghế (STANDARD, VIP, COUPLE).` | Ghi rõ thêm: Mặc định khởi tạo 50 ghế `STANDARD` (`A1` đến `E10`) theo quy tắc `BR-01`. |
| **208-221** | Đặc tả lớp `Ticket` chưa đề cập đến `Partial Unique Index (unique_active_ticket)` và 2 bước hoàn tiền sự cố (`PENDING_CASH_REFUND` -> `REFUNDED_CASH`) | Bổ sung thuyết minh về ràng buộc `Partial Unique Index: unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled'` và quy trình 2 bước hoàn tiền mặt sự cố rạp (`PENDING_CASH_REFUND` -> `REFUNDED_CASH` trong 30 ngày). |
| **228** | `- paymentMethod: PaymentMethod: Phương thức thanh toán (VNPay, Momo, Cash, BankCard).` | Sửa thành: `- paymentMethod: PaymentMethod: Phương thức thanh toán (ZaloPay, Cash, VNPay, Momo, BankCard) — trong đó ZaloPay Sandbox v2 là cổng thanh toán trực tuyến mặc định.` |
| **234-235** | `+ createPaymentUrl(gateway: PaymentMethod): String: Khởi tạo liên kết chuyển hướng thanh toán bảo mật sang cổng VNPay hoặc MoMo Sandbox.`<br>`+ processIPNCallback(data: Map<String, String>): Boolean: Xử lý Webhook/IPN phản hồi từ cổng thanh toán, kiểm tra mã Secure Hash (Checksum SHA512).` | Sửa thành:<br>- Khởi tạo đơn hàng qua **ZaloPay Sandbox v2 (`app_id: 2553`)** sử dụng chữ ký **HMAC-SHA256 (`ZALOPAY_KEY1`)**.<br>- Xử lý Webhook IPN Callback từ ZaloPay, xác thực chữ ký `mac` bằng **HMAC-SHA256 (`ZALOPAY_KEY2`)** với `crypto.timingSafeEqual` và đảm bảo tính lũy đẳng (`Idempotency`). |
| **255-297** | Phân hệ Bắp nước & Đánh giá chưa liệt kê các lớp Dịch vụ (`ZaloPayService`, `QRSignatureService`, `SeatExpirationService`) và thực thể kiểm toán `AuditLog` | Bổ sung mục thuyết minh cho `AuditLog` (`NFR-INT-02`) và 3 lớp Dịch vụ cốt lõi (`ZaloPayService`, `QRSignatureService`, `SeatExpirationService`) đồng bộ với SRS Mục 6.7.1. |
| **322** | Bảng 2.5 (Dòng STT 8 - `PaymentMethod`): `VNPay, Momo, Cash, BankCard` | Sửa thành: `ZaloPay, Cash, VNPay, Momo, BankCard` (đồng bộ với `schema.prisma` dòng 51-57). |
| **345** | Bảng 2.6 (Dòng `Payment`): `10_thanh_toan_online, 11_vnpay_momo, 38_bao_cao` \| `BR-08, BR-10` | Sửa thành: `10_thanh_toan_online`, `11_thanh_toan_vnpay_momo` (ZaloPay Sandbox v2), `38_bao_cao` \| `BR-09, BR-10`. |
| **538** | Câu 7 Q&A: `...phương thức issueRefund() trong lớp Payment mới chính thức kích hoạt chuyển trạng thái thành RefundedCash...` | Sửa tên trạng thái chuẩn theo `schema.prisma` và SRS: `Payment.status` chuyển thành **`Refunded`** và trạng thái hoàn tiền của vé (`refundStatus`) chuyển từ **`PENDING_CASH_REFUND`** sang **`REFUNDED_CASH`**. |
| **556** | Câu 9 Q&A: `Lớp Movie chỉ cập nhật status = ENDED (Ngừng chiếu) để ẩn khỏi danh mục mở bán...` | Bổ sung rõ: Cập nhật `status = ENDED` kết hợp bật cờ **`isDeleted = true`** (`Soft Delete`). |

---

## IV. BẢNG TỔNG HỢP KẾT QUẢ KIỂM TOÁN

| STT | Tên File | Mục SRS Đối Chiếu | Trạng Thái | Tóm Tắt Các Điểm Cần Sửa Chính |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `state_seat.puml` *(Root & App)* | Mục 6.6.1 (`BR-01`) | ⚠️ Cần cập nhật | Đổi `VNPay` -> `ZaloPay Sandbox v2`; đổi `FR-SEL-01` -> `FR-BOK-02`; thêm `EMPTY --> [*]`. |
| 2 | `state_ticket.puml` *(Root & App)* | Mục 6.6.2 (`BR-03, 04, 09`) | ⚠️ Cần cập nhật | Đổi **`15 phút` -> `10 phút`**; đổi `VNPay IPN` -> `ZaloPay Sandbox v2`; chuẩn hóa 3 sub-states của `Cancelled` (`NONE`, `PENDING_CASH_REFUND` -> `REFUNDED_CASH`). |
| 3 | `state_payment.puml` *(Root & App)* | Mục 6.6.3 (`BR-09, 10`) | ⚠️ Cần cập nhật | Đổi **`15 phút` -> `10 phút`**; đổi **`VNPay` / `vnp_ResponseCode` / `SHA512`** -> **`ZaloPay Sandbox v2 (app_id: 2553)` / `return_code == 1` / `HMAC-SHA256 (ZALOPAY_KEY1 & ZALOPAY_KEY2)`**. |
| 4 | `state_combo.puml` *(Root & App)* | Mục 6.6.4 (`BR-05`) | ⚠️ Cần cập nhật | Bổ sung trạng thái giữ kho 10 phút **`ComboReservation` (`RESERVED` -> `EXPIRED`/`RELEASED` \| `CONFIRMED`)**; sửa lỗi ghi trừ kho lúc giao hàng (thực tế trừ kho lúc giữ chỗ/thanh toán, lúc giao chỉ đánh dấu `isDelivered = true`). |
| 5 | `state_screening.puml` *(Root & App)* | Mục 6.6.5 (`BR-04, 08`) | ⚠️ Cần cập nhật | Đổi `FR-ADM-04` ở bước tạo suất chiếu thành `FR-ADM-03`; bổ sung điều kiện chống trùng phòng `+ 15p buffer (BR-08)`, khởi tạo 50 ghế `A1..E10` và ghi `AuditLog` khi hủy khẩn cấp. |
| 6 | `state_movie.puml` *(Root & App)* | Mục 6.6.6 (`BR-02, 07`) | ⚠️ Cần cập nhật | Bổ sung luồng chiếu lại **`ENDED --> SHOWING` (Re-release, `isDeleted = false`)** và khởi tạo `isDeleted = false` + nhãn độ tuổi (`P, C13, T18`). |
| 7 | `class_diagram_lumicinema.puml` *(Root & App)* | Mục 6.5 & 6.7 | ⚠️ Cần cập nhật | Thêm `ZaloPay` vào `enum PaymentMethod`; thêm `Movie.isDeleted`, `Combo.reservedUntil`, lớp `AuditLog` và 3 lớp Service (`ZaloPayService`, `QRSignatureService`, `SeatExpirationService`); cập nhật Note từ `VNPay / Momo` sang `ZaloPay Sandbox v2` và bổ sung `Partial Unique Index unique_active_ticket`. |
| 8 | `PlantUML_Class_Diagram/README.md` *(Root & App)* | Mục 6.5 & 6.7 | ⚠️ Cần cập nhật | Đồng bộ thuyết minh `PaymentMethod` (thêm `ZaloPay`), thay `VNPay / SHA512` bằng `ZaloPay Sandbox v2 / HMAC-SHA256 (KEY1, KEY2)`, bổ sung `Movie.isDeleted`, `unique_active_ticket`, `AuditLog` và các lớp Service. |

---

# BÁO CÁO KIỂM TOÁN SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS AUDIT - PART 1: FILES 01 -> 19)

**Đối tượng đối chiếu:**
- **Tài liệu chuẩn:** `SRS_He_Thong_Quan_Ly_Rap_Phim.md` (Phiên bản 2.0 - Ngày 05/11/2026)
- **Các quy chuẩn cốt lõi trong SRS v2.0:**
  - Hạ tầng CSDL: Docker PostgreSQL 16 (Port `5434`), Prisma ORM, Partial Unique Index `unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled'`.
  - Cổng thanh toán trực tuyến: **ZaloPay Sandbox v2** (`app_id = 2553`, `ZALOPAY_KEY1` tạo đơn, `ZALOPAY_KEY2` xác thực IPN Callback & Return URL), tuyệt đối **không dùng VNPay / MoMo** cho luồng thanh toán online.
  - Sơ đồ ghế & Giữ chỗ: 5 phòng (`Cinema 01..05`), 50 ghế Standard (`A1` -> `E10`), giữ chỗ nguyên tử **10 phút** (`RESERVED`, tối đa 8 ghế/lần), trạng thái ghế chuẩn: `EMPTY`, `RESERVED`, `OCCUPIED`.
  - Loại vé: Vé Thường / Người lớn (`100%`) và Vé Trẻ em (`50%`, tự động khóa với phim có nhãn độ tuổi `T18` theo `BR-02`).
  - Combo bắp nước: Giữ kho tạm **10 phút** qua bảng `ComboReservation` (`RESERVED` -> `COMPLETED` / `RELEASED`), bảng `OrderCombo` lưu `isDelivered: false` (`Chưa nhận`) -> `true` (`Đã nhận`), độc lập với soát vé (`BR-05`).
  - Voucher: Tối đa 01 mã/đơn, **chỉ giảm trên tiền vé (`ticketTotal`)**, không giảm tiền combo; chỉ tăng `usedCount` khi thanh toán thành công.
  - Hủy vé:
    - Khách tự hủy (`BR-03`): Trước giờ chiếu `>= 2 giờ`, vé `Valid` -> `Cancelled`, ghế -> `EMPTY`, tự động cấp Voucher bồi hoàn `COMP50_[TicketID]_[Random]` (giảm 50%, hạn 30 ngày, `maxUsage = 1`), giữ nguyên đơn combo.
    - Rạp hủy do sự cố (`BR-04`, `UC-15`): Không giới hạn 2 giờ, hoàn `100%` tiền mặt (`PENDING_CASH_REFUND` -> `REFUNDED_CASH`) trong vòng **30 ngày** tại quầy kèm ghi nhận `AuditLog`.
  - Đánh giá phim (`BR-06`): Chỉ cần đăng nhập (`Authenticated`), không bắt buộc mua vé trước, mỗi user tối đa 1 đánh giá/phim (Idempotent Upsert), tự động tính lại `movies.rating`.

---

## BẢNG TỔNG HỢP TRẠNG THÁI 19 FILE (01 -> 19)

| STT | Tên file `.puml` | Mục SRS tương ứng | Trạng thái | Tóm tắt vấn đề chính |
| :-: | :--- | :--- | :---: | :--- |
| 01 | `01_dang_ky_tai_khoan.puml` | Mục 4.1 (`FR-AUTH-01`, Luồng 4.1A) | ⚠️ Cần cập nhật | Lệch tên endpoint `/api/auth/register` (SRS là `/api/auth/signup`) và tên trường `name` (SRS là `full_name`), thiếu chuẩn hóa `toLowerCase().trim()`. |
| 02 | `02_dang_nhap_he_thong.puml` | Mục 4.1 (`FR-AUTH-02`, `FR-AUTH-03`, Luồng 4.1B) | ✅ Khớp 100% | Khớp hoàn toàn với NextAuth CredentialsProvider, bcrypt, JWT 24h và điều hướng RBAC. |
| 03 | `03_dang_xuat_he_thong.puml` | Mục 4.1 (`FR-AUTH-02`) & Mục 7.2.2 | ✅ Khớp 100% | Khớp với luồng `NextAuth signOut()`, xóa cookie phiên làm việc và dọn bộ nhớ tạm Client. |
| 04 | `04_mua_ve_va_dat_combo_online_tong_quan.puml` | Mục 4.3 (`FR-BOK-01` -> `05`) & Mục 6.2 | ⚠️ Cần cập nhật | Đang dùng `VNPay / MoMo`, thiếu bước giữ ghế/combo 10 phút, sai trạng thái `Payment` (`PAID` thay vì `Success`), thiếu chữ ký QR `HMAC-SHA256` & `<QRCodeSVG />`. |
| 05 | `05_xem_phim_va_suat_chieu.puml` | Mục 4.3 (`FR-BOK-01`) | ⚠️ Cần cập nhật | Sơ đồ quá chung chung, thiếu tên API (`GET /api/movies`, `GET /api/screenings`), bộ lọc (`date`, `movie_id`, `room_number`) và sơ đồ 50 ghế `A1..E10`. |
| 06 | `06_chon_ghe_va_giu_cho.puml` | Mục 4.3 (`FR-BOK-02`) & Mục 6.2 | ⚠️ Cần cập nhật | Dùng sai trạng thái ghế `BOOKED` (chuẩn SRS là `OCCUPIED`), thiếu giới hạn tối đa 8 ghế, thiếu Lazy Release ghế quá hạn và thiếu tên API `/api/seats/reserve` & `/api/seats/release`. |
| 07 | `07_chon_loai_ve.puml` | Mục 4.3 (`FR-BOK-03`, `BR-02`) | ⚠️ Cần cập nhật | Nhãn độ tuổi ghi `P, K, T13, T16, T18` (SRS chuẩn là `P, C13, T18`), thiếu tên API `GET /api/pricing` và kiểm tra tổng số vé khớp tổng số ghế. |
| 08 | `08_them_combo_vao_don_hang.puml` | Mục 4.3 (`FR-BOK-04`) | ⚠️ Cần cập nhật | **Thiếu hoàn toàn cơ chế giữ kho tạm 10 phút (`ComboReservation`)**, thiếu Lazy Release combo quá hạn và thiếu tên API `POST /api/combos/reserve`. |
| 09 | `09_ap_dung_voucher.puml` | Mục 4.7 (`FR-VOU-01` -> `03`, Luồng 4.7.2) | ⚠️ Cần cập nhật | Gán sai mã quy tắc `BR-07`, `BR-08` (trong SRS v2.0 `BR-07` là xóa mềm phim, `BR-08` là chống trùng phòng), thiếu kiểm tra `usedCount < maxUsage`, thiếu kiểm tra voucher cá nhân `userId` (`COMP50_`), thiếu tên API `POST /api/coupons/validate`. |
| 10 | `10_thanh_toan_online.puml` | Mục 4.3 (`FR-BOK-05`) & Mục 6.2 | ⚠️ Cần cập nhật | Đang ghi `Cổng VNPay / MoMo` (phải đổi sang **ZaloPay Sandbox v2**), sai trạng thái đơn `PAID` (chuẩn là `Success`), thiếu `ComboReservation -> COMPLETED`, `OrderCombo (isDelivered=false)` và tăng `Coupon.usedCount`. |
| 11 | `11_thanh_toan_vnpay_momo.puml` | Mục 3.3.1, Mục 4.3 (`FR-BOK-05`) & Mục 6.2 | ⚠️ Cần cập nhật | Toàn bộ nội dung và tiêu đề đang viết cho **VNPay / MoMo** (`responseCode = 00`, `24`, OTP). Phải viết lại theo chuẩn **ZaloPay Sandbox v2** (`app_id=2553`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`, `return_code=1`, IPN Callback & Return URL). |
| 12 | `12_ban_ve_tai_quay_pos.puml` | Mục 4.4 (`FR-POS-01`, `FR-POS-02`, `FR-POS-04`, Luồng 4.4A) | ⚠️ Cần cập nhật | Lệch tên API (`/api/payments/pos-checkout` thay vì `POST /api/staff/pos/tickets` hoặc `POST /api/staff/pos`), thiếu bước `resolveCustomer()` cho khách thành viên/vãng lai, và thiếu chọn kèm Combo tại quầy (`OrderCombo.isDelivered = true`). |
| 13 | `13_ban_combo_tai_quay_pos.puml` | Mục 4.4 (`FR-POS-03`, Luồng 4.4B) | ⚠️ Cần cập nhật | Bịa ra bảng `Order` (trong ERD không có bảng `orders`, chỉ có `payments` và `order_combos`), bịa ra tính năng "Cộng điểm tích lũy thành viên", sai trạng thái `Payment` (`COMPLETED` thay vì `Success`) và sai cấu trúc `OrderCombo` (`isDelivered: true` thay vì `status: 'DELIVERED'`). |
| 14 | `14_soat_ve_vao_rap.puml` | Mục 4.5 (`FR-CHK-01`, Luồng 4.5A) | ⚠️ Cần cập nhật | Thiếu nhánh từ chối khi **sai khung giờ soát vé** (`NOW < startTime - 30p` hoặc `NOW > endTime`) ở khối `alt`, và ghi thừa trường `usedAt`, `checkedBy` không có trong bảng `tickets` của ERD. |
| 15 | `15_giao_nhan_combo_online.puml` | Mục 4.5 (`FR-CHK-02`, `BR-05`, Luồng 4.5B) & Mục 6.4 | ⚠️ Cần cập nhật | Truy vấn vào bảng `prisma.order.findUnique` (bảng `orders` không tồn tại trong SRS/ERD, phải dùng `payments` và `order_combos`), dùng `status = 'NOT_DELIVERED' / 'DELIVERED'` thay vì boolean `isDelivered = false / true`, sai tên API (`/api/staff/combos/orders` & `/api/staff/combos/deliver`). |
| 16 | `16_tra_cuu_quan_ly_ve.puml` | Mục 4.5 (`FR-CHK-01`) & Mục 4.6 | ✅ Khớp 100% | Khớp hoàn toàn với luồng tra cứu vé đa điều kiện (`GET /api/staff/tickets/search`) và xem chi tiết hồ sơ vé (`GET /api/tickets/{id}`). |
| 17 | `17_khach_huy_ve_nhan_voucher.puml` | Mục 4.6 (`FR-CAN-01`, `BR-03`, Luồng 4.6A) | ✅ Khớp 100% | Khớp đầy đủ quy tắc `BR-03`: hủy trước `>= 2 tiếng`, kiểm tra chính chủ & `Valid`, giải phóng ghế `EMPTY`, sinh mã `COMP50_`, giảm 50% hạn 30 ngày, gửi email và giữ nguyên combo. |
| 18 | `18_huy_ve_su_co_hoan_tien_mat.puml` | Mục 4.6 (`FR-CAN-02`, `BR-04`, Luồng 4.6B), Mục 4.8 (`FR-ADM-04`) & Mục 6.3 | ⚠️ Cần cập nhật | Lệch nhẹ ở dòng 56 (Giai đoạn 1 - hủy suất chiếu khẩn cấp): ghi *"Khóa toàn bộ ghế của suất chiếu không cho đặt lại"*, trong khi SRS (Mục 4.8.1, 4.8.2 & 6.3) quy định ghế phải giải phóng về `Seat.status = 'EMPTY', reservedUntil = null` còn suất chiếu mới khóa sang `ENDED` / `CANCELLED`; và dòng 97 thiếu cập nhật `Payment.status = 'Refunded'`. |
| 19 | `19_khach_danh_gia_phim.puml` | Mục 4.2 (`FR-REV-01` -> `03`, `BR-06`, Luồng 4.2.2) | ✅ Khớp 100% | Khớp hoàn toàn với quy tắc `BR-06` (chỉ cần đăng nhập, không cần mua vé), Idempotent Upsert (`FR-REV-02`) và tính lại `movie.rating` (`FR-REV-03`). |

---

## CHI TIẾT KIỂM TOÁN TỪNG FILE (01 -> 19)

### 1. File `01_dang_ky_tai_khoan.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/01_dang_ky_tai_khoan.puml` — Mục 4.1 (`FR-AUTH-01`: Đăng ký tài khoản - Customer Sign-up, Luồng 4.1A).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 23:** Đang ghi `UI -> API : POST /api/auth/register\n{ name, email, password, phone }`.
     - **Theo SRS (Mục 4.1.1 & 4.1.2 - Luồng 4.1A bước 2):** Endpoint chuẩn là `POST /api/auth/signup` và payload gửi lên là `{ email, password, full_name, phone }`.
  2. **Dòng 26 & 32:** Chưa thể hiện bước chuẩn hóa email `normalizedEmail = email.toLowerCase().trim()` trước khi truy vấn `prisma.user.findUnique({ where: { email: normalizedEmail } })` theo đúng bước 3-4 của Luồng 4.1A.

---

### 2. File `02_dang_nhap_he_thong.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/02_dang_nhap_he_thong.puml` — Mục 4.1 (`FR-AUTH-02`, `FR-AUTH-03`: Đăng nhập hệ thống, Quản lý phiên JWT & Phân quyền RBAC, Luồng 4.1B).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Sử dụng đúng `POST /api/auth/[...nextauth]` (`NextAuth CredentialsProvider`), kiểm tra mật khẩu bằng `bcryptjs.compare()`, ký JWT bằng `NEXTAUTH_SECRET` hạn 24 giờ lưu vào `HttpOnly Secure Cookie` (`next-auth.session-token`), và điều hướng chính xác theo 3 vai trò `ADMIN`, `STAFF`, `CUSTOMER`.

---

### 3. File `03_dang_xuat_he_thong.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/03_dang_xuat_he_thong.puml` — Mục 4.1 (`FR-AUTH-02`) & Mục 7.2.2 (STT 3).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Thể hiện đầy đủ luồng `POST /api/auth/signout` (`NextAuth signOut`), xóa `next-auth.session-token` (`Max-Age=0`), ghi nhận Audit Log và xóa trạng thái phiên làm việc tại Client (`SessionProvider`, `sessionStorage`).

---

### 4. File `04_mua_ve_va_dat_combo_online_tong_quan.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/04_mua_ve_va_dat_combo_online_tong_quan.puml` — Mục 4.3 (`FR-BOK-01` -> `FR-BOK-05`) & Mục 6.2 (Sơ đồ tuần tự Giữ ghế & Thanh toán trực tuyến qua ZaloPay Sandbox v2).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 14, 76, 83-85:** Đang khai báo `participant "VNPay / MoMo" as PAY` và gửi yêu cầu đến `VNPay / MoMo`.
     - **Cần sửa thành:** `participant "Cổng ZaloPay Sandbox v2" as PAY` (`app_id = 2553`, giao tiếp qua `POST /api/payments/initiate` / `POST /api/payments/zalopay/create`, nhận Webhook IPN tại `POST /api/payments/zalopay/callback` và Redirect tại `GET /api/payments/zalopay/return`).
  2. **Dòng 43-50 & 58-60:** Khi chọn ghế và chọn combo, sơ đồ chỉ ghi "Kiểm tra trạng thái ghế" và "Thêm combo vào đơn hàng" mà **thiếu bước khóa giữ ghế nguyên tử 10 phút** (`POST /api/seats/reserve` -> `Seat.status = 'RESERVED'`, `reservedUntil = NOW() + 10m`) và **giữ kho combo tạm 10 phút** (`POST /api/combos/reserve` -> tạo bản ghi `ComboReservation` trạng thái `RESERVED`).
  3. **Dòng 88:** Đang ghi `Cập nhật trạng thái Vé (Valid), Đơn hàng (PAID)`.
     - **Cần sửa thành:** Trong SRS (Mục 4.3.2 & Mục 6.5 - Bảng `PAYMENTS`), trạng thái chuẩn là `Payment.status = 'Success'`, `Seat.status = 'OCCUPIED'`, `Ticket.status = 'Valid'`, `ComboReservation.status = 'COMPLETED'`, `OrderCombo.isDelivered = false` (`Chưa nhận`), và tăng `Coupon.usedCount` thêm 1.
  4. **Dòng 92-94:** Cần ghi rõ vé điện tử được ký số bằng **`HMAC-SHA256`** và hiển thị trực tiếp bằng thành phần **`<QRCodeSVG />`** (`qrcode.react`) kèm gửi email xác nhận qua `SMTP Email Service`.

---

### 5. File `05_xem_phim_va_suat_chieu.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/05_xem_phim_va_suat_chieu.puml` — Mục 4.3.1 (`FR-BOK-01`: Xem & Lọc lịch chiếu) & Mục 7.2.2 (STT 5).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 10-13:** Các lifeline đang đặt tên chung chung (`Giao diện chọn phim`, `Điều khiển mua vé`, `Dữ liệu hệ thống`), thiếu thông tin kiến trúc thực tế trong SRS v2.0 (`Next.js Client UI`, `Next.js API Server`, `Docker PostgreSQL 5434 / Prisma`).
  2. **Dòng 18-23 & 31-35:** Chưa ghi rõ API Endpoint chuẩn theo Mục 4.3.1 và Mục 7.2.2:
     - Lấy danh sách phim: `GET /api/movies` (lọc theo trạng thái `SHOWING`, `UPCOMING`, thể loại, hiển thị nhãn tuổi `P`, `C13`, `T18` và điểm `rating`).
     - Lọc suất chiếu: `GET /api/screenings?movie_id={id}&date={YYYY-MM-DD}&room_number={1..5}`.
  3. **Dòng 54-58:** Khi chọn một suất chiếu cụ thể, cần gọi `GET /api/screenings/[id]` trả về sơ đồ 50 ghế chuẩn (`A1` đến `E10`, ma trận `5x10`) với trạng thái thời gian thực (`EMPTY`, `RESERVED`, `OCCUPIED`).

---

### 6. File `06_chon_ghe_va_giu_cho.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/06_chon_ghe_va_giu_cho.puml` — Mục 4.3.1 (`FR-BOK-02`: Giữ ghế nguyên tử 10 phút & Tự động giải phóng), Mục 4.3.2 (Giai đoạn 1) & Mục 6.2.
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 22:** Đang ghi `DB --> C: Sơ đồ ghế và trạng thái (EMPTY, RESERVED, BOOKED)`.
     - **Cần sửa thành:** Trạng thái ghế trong SRS (Mục 3.1, 4.3.1, 6.5, 6.6.1) là `(EMPTY, RESERVED, OCCUPIED)` — tuyệt đối không dùng `BOOKED`.
  2. **Dòng 29-36:** Thiếu kiểm tra giới hạn tối đa **08 ghế/lần giao dịch** (`MAX_SEATS_PER_HOLD = 8`, nếu `seat_ids.length > 8` trả về `400 Bad Request - MAX_SEATS_EXCEEDED`) và thiếu bước **Lazy Release** (giải phóng các ghế `RESERVED` đã quá hạn `reservedUntil < NOW()` về `EMPTY` ngay đầu transaction).
  3. **Dòng 31 & 44:** Cần ghi rõ API Endpoint `POST /api/seats/reserve { screening_id, seat_ids }` và cơ chế khóa nguyên tử `tx.seat.updateMany({ where: { id: { in: seat_ids }, screeningId, status: 'EMPTY' }, data: { status: 'RESERVED', reservedUntil: NOW() + 10m } })` kèm kiểm tra `updateResult.count === seat_ids.length` (`NFR-SAFE-01`).
  4. **Dòng 60-62:** Khi khách bỏ chọn ghế, cần ghi rõ gọi API `POST /api/seats/release` để giải phóng ghế về `EMPTY` (`reservedUntil = null`).

---

### 7. File `07_chon_loai_ve.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/07_chon_loai_ve.puml` — Mục 4.3.1 (`FR-BOK-03`: Phân loại giá vé theo độ tuổi & Chặn phim T18 - `BR-02`) & Mục 7.2.2 (STT 7).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 22:** Đang ghi `Danh sách loại vé và nhãn độ tuổi (P, K, T13, T16, T18)`.
     - **Cần sửa thành:** Theo SRS Mục 4.8.1 và Mục 6.5 (bảng `MOVIES`), nhãn phân loại độ tuổi chuẩn của hệ thống là `P`, `C13` (hoặc `C16`), và `T18` (`C18`).
  2. **Dòng 18-24 & 33:** Cần bổ sung tên API chuẩn `GET /api/pricing` (bảng `pricing`: `Normal` hưởng `100%` giá gốc `screening.price`, `Child` hưởng `50%` giá gốc `screening.price`) và kiểm tra tại `POST /api/payments/initiate` (hoặc `POST /api/bookings`).
  3. **Dòng 38-42:** Cần bổ sung rõ mã lỗi chuẩn trong SRS Mục 4.3.2 (nhánh `9a` và `9b`):
     - Nếu phim có nhãn `T18` mà chọn vé Trẻ em -> UI vô hiệu hóa lựa chọn và API trả về `400 Bad Request` (`code: 'CHILD_TICKET_NOT_ALLOWED'`).
     - Kiểm tra tổng số lượng loại vé phải khớp với tổng số ghế đã giữ (`totalTicketCount === seatIds.length`, nếu lệch trả về `400 Bad Request - TICKET_SEAT_COUNT_MISMATCH`).

---

### 8. File `08_them_combo_vao_don_hang.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/08_them_combo_vao_don_hang.puml` — Mục 4.3.1 (`FR-BOK-04`: Mua kèm Combo & Giữ kho tạm 10 phút - Inventory Hold) & Mục 4.3.2 (Bước 7).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 18-24:** Cần ghi rõ API `GET /api/combos` lấy danh sách gói bắp nước có `status === 'ACTIVE'` và `stock > 0`.
  2. **Dòng 31-55 (Lỗi nghiêm trọng):** Sơ đồ hiện tại chỉ kiểm tra tồn kho và cộng tiền trên bộ nhớ mà **thiếu hoàn toàn cơ chế khóa tồn kho tạm thời 10 phút (`ComboReservation`)** theo yêu cầu bắt buộc của SRS v2.0 (`FR-BOK-04` & `NFR-SAFE-02`).
     - **Cần sửa thành:** Khi khách hàng chọn combo và xác nhận giữ hàng (`POST /api/combos/reserve` với `{ combo_items: [{ combo_id, quantity }] }`), hệ thống thực hiện trong `prisma.$transaction`:
       1. **Lazy Release:** Quét các bản ghi `ComboReservation` có `status = 'RESERVED'` và `reservedUntil < NOW()` để cộng hoàn lại `Combo.stock` và đổi trạng thái sang `RELEASED`.
       2. **Trừ tạm tồn kho nguyên tử:** Cập nhật `Combo.updateMany({ where: { id: combo_id, status: 'ACTIVE', stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })`.
       3. **Tạo bản ghi giữ kho:** Khởi tạo bản ghi trong bảng `combo_reservations` với `status = 'RESERVED'` và `reservedUntil = NOW() + 10 phút`.

---

### 9. File `09_ap_dung_voucher.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/09_ap_dung_voucher.puml` — Mục 4.7 (`FR-VOU-01` -> `FR-VOU-03`: Quản lý Voucher & Khuyến mãi, Luồng 4.7.2).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 23-28:** Cần ghi rõ API Endpoint `POST /api/coupons/validate` gửi `{ coupon_code, total_amount: ticketTotal, movie_id }`, chuẩn hóa `normalizedCode = coupon_code.trim().toUpperCase()` và truy vấn bảng `coupons` (`prisma.coupon.findUnique`).
  2. **Dòng 30-44 (Thiếu các điều kiện biên Guard quan trọng của SRS Mục 4.7.2):**
     - Dòng 35 đang ghi `Voucher đã hết hạn hoặc đã ngừng sử dụng (INACTIVE)` -> Trong bảng `coupons` (Mục 6.5) **không có cột `status = INACTIVE`**, mà kiểm tra qua 5 Guards:
       - **Guard 1 (Hạn dùng):** `expiryDate (23:59:59.999) >= NOW()` (Lỗi `400 COUPON_EXPIRED`).
       - **Guard 2 (Số lượt dùng):** `coupon.usedCount < coupon.maxUsage` (Lỗi `400 COUPON_USAGE_LIMIT_EXCEEDED`).
       - **Guard 3 (Giá trị đơn tối thiểu):** `ticketTotal >= coupon.minAmount` (Lỗi `400 MIN_AMOUNT_NOT_REACHED`).
       - **Guard 4 (Phim áp dụng):** `coupon.applicableMovieId === null || coupon.applicableMovieId === movie_id` (Lỗi `400 COUPON_NOT_APPLICABLE_TO_MOVIE`).
       - **Guard 5 (Định danh cá nhân cho Voucher bồi hoàn `COMP50_` / `COMP100_`):** Nếu `coupon.userId !== null`, kiểm tra `session.user.id === coupon.userId` (Nếu sai trả về `403 Forbidden - COUPON_USER_RESTRICTED`).
  3. **Dòng 46-47:** Đang ghi chú sai mã Business Rule `(BR-07)` và `(BR-08)` (Trong SRS Mục 7.1, `BR-07` là Xóa mềm phim và `BR-08` là Chống trùng lịch phòng chiếu; yêu cầu Voucher thuộc `FR-VOU-02` và `FR-VOU-03`). Đồng thời cần ghi chú rõ: Tại bước Validate/Initiate **chưa cộng `usedCount`**, chỉ khi thanh toán ZaloPay thành công mới tăng `usedCount` thêm 1 để bảo toàn lượt dùng nếu giao dịch hết hạn 10 phút (`FR-VOU-03`).

---

### 10. File `10_thanh_toan_online.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/10_thanh_toan_online.puml` — Mục 4.3 (`FR-BOK-05`), Mục 4.3.2 (Giai đoạn 2 & 3) & Mục 6.2.
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 14, 24, 27:** Đang khai báo `participant "Cổng VNPay / MoMo" as PAY` và hiển thị màn hình chọn phương thức `(VNPay / MoMo)`.
     - **Cần sửa thành:** Cổng thanh toán trực tuyến duy nhất theo SRS v2.0 là **ZaloPay Sandbox v2 (`app_id = 2553`)**.
  2. **Dòng 29-36:** Cần cập nhật đúng API khởi tạo thanh toán (`POST /api/payments/initiate` hoặc `POST /api/bookings` + `POST /api/payments/zalopay/create`), tạo bản ghi `Payment (status = 'Pending', transactionCode = YYMMDD_...)`, tạo `OrderCombo (isDelivered = false)`, ký `mac` bằng `ZALOPAY_KEY1` (`HMAC-SHA256`) và nhận `order_url` từ `https://sb-openapi.zalopay.vn/v2/create`.
  3. **Dòng 43-53:** Khi thanh toán thành công qua Webhook IPN (`POST /api/payments/zalopay/callback`) hoặc Return URL (`GET /api/payments/zalopay/return`):
     - Đổi `Đơn hàng (PAID)` thành `Payment.status = 'Success'`.
     - Bổ sung kiểm tra chữ ký `mac` bằng `ZALOPAY_KEY2` (`crypto.timingSafeEqual`) và kiểm tra tính lũy đẳng (**Idempotency** - `NFR-INT-01`).
     - Cập nhật `Seat.status = 'OCCUPIED'` (`reservedUntil = null`), tạo `Ticket (status = 'Valid')` kèm chữ ký QR `HMAC-SHA256`, chuyển `ComboReservation.status = 'COMPLETED'`, tăng `Coupon.usedCount` thêm 1, gửi email xác nhận và hiển thị `<QRCodeSVG />`.
  4. **Dòng 54-65:** Khi thanh toán thất bại hoặc hết hạn 10 phút giữ chỗ:
     - Đổi trạng thái `Payment.status = 'Failed'`, giải phóng `Seat.status = 'EMPTY'`, hoàn trả tồn kho `Combo.stock` (`ComboReservation.status = 'RELEASED'`) và bảo toàn lượt dùng `Coupon`.

---

### 11. File `11_thanh_toan_vnpay_momo.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/11_thanh_toan_vnpay_momo.puml` — Mục 3.3.1 (Cổng thanh toán trực tuyến ZaloPay Sandbox API v2), Mục 4.3 (`FR-BOK-05`), Mục 6.2 & Mục 7.2.2 (STT 11: *"Tuần tự Tích hợp cổng thanh toán trực tuyến (Đã nâng cấp lên ZaloPay Sandbox v2)"*).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Toàn bộ file (Dòng 8, 13, 16-48):** Đang mô tả luồng thanh toán cũ của **VNPay / MoMo** (dùng `responseCode = 00`, `responseCode = 24`, trạng thái `PAID`, `CANCELLED`).
  2. **Cần cập nhật toàn diện sang ZaloPay Sandbox v2 theo Mục 3.3.1 & Mục 6.2 của SRS:**
     - **Tiêu đề (`title`):** Đổi thành `SƠ ĐỒ TUẦN TỰ: TÍCH HỢP CỔNG THANH TOÁN ZALOPAY SANDBOX V2`.
     - **Lifeline `PAY`:** Đổi thành `participant "Cổng ZaloPay Sandbox v2\n(sb-openapi.zalopay.vn)" as PAY`.
     - **Bước Tạo đơn (`POST /api/payments/zalopay/create` -> `POST https://sb-openapi.zalopay.vn/v2/create`):**
       - Sinh `app_trans_id` định dạng `YYMMDD_<paymentId>_<random>`.
       - Tạo chuỗi `data = app_id|app_trans_id|app_user|amount|app_time|embed_data|item` (`app_id = 2553`).
       - Ký `mac = HMAC_SHA256(ZALOPAY_KEY1, data)`.
       - Nhận phản hồi `{ return_code: 1, order_url, zp_trans_token }` và lưu `transactionCode = app_trans_id`.
     - **Bước Xử lý kết quả thanh toán (Song song 2 luồng hoặc `alt`):**
       - **Luồng Webhook IPN Callback (`POST /api/payments/zalopay/callback`):** Nhận `{ data, mac }`, tính `expectedMac = HMAC_SHA256(ZALOPAY_KEY2, data)`, so sánh bằng `crypto.timingSafeEqual`. Nếu khớp và `Payment.status === 'Pending'` (Idempotent), thực thi `prisma.$transaction`: cập nhật `Payment.status = 'Success'`, `Seat.status = 'OCCUPIED'`, tạo `Ticket (status = 'Valid')`, cập nhật `ComboReservation = 'COMPLETED'`, tăng `Coupon.usedCount += 1`, trả về `{ return_code: 1, return_message: "success" }`.
       - **Luồng Return Redirect URL (`GET /api/payments/zalopay/return`):** Kiểm tra `checksum` bằng `ZALOPAY_KEY2` trên chuỗi `appid|apptransid|pmcid|bankcode|amount|discountamount|status`. Nếu `status == 1`, đồng bộ đơn hàng (nếu IPN chưa xử lý) và điều hướng về trang vé điện tử `<QRCodeSVG />`.
       - **Luồng Hủy / Thất bại / Timeout 10 phút:** Chuyển `Payment.status = 'Failed'`, giải phóng ghế về `EMPTY`, hoàn trả tồn kho `Combo.stock` (`ComboReservation = 'RELEASED'`).

---

### 12. File `12_ban_ve_tai_quay_pos.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/12_ban_ve_tai_quay_pos.puml` — Mục 4.4 (`FR-POS-01`, `FR-POS-02`, `FR-POS-04`: Bán vé kèm Combo tại quầy POS, Luồng 4.4A).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 41:** Cần bổ sung kiểm tra chặn vé Trẻ em (50%) nếu phim có nhãn phân loại độ tuổi `T18` (`BR-02` - nếu vi phạm trả về `400 CHILD_TICKET_NOT_ALLOWED`) và cho phép chọn kèm Combo bắp nước + nhập thông tin khách hàng (`customer_name`, `customer_phone`, `customer_email`).
  2. **Dòng 55:** Đang gọi `POST /api/payments/pos-checkout`.
     - **Cần sửa thành:** Theo SRS Mục 4.4.2 (Luồng 4.4A bước 2) và Mục 7.2.2 (STT 12), endpoint chuẩn là `POST /api/staff/pos/tickets` *(alias: `POST /api/staff/pos`)*.
  3. **Dòng 58-63:** Thiếu bước gọi hàm `resolveCustomer(customer_name, customer_phone, customer_email)` để gắn vé vào tài khoản thành viên hoặc tự động khởi tạo/ánh xạ hồ sơ khách vãng lai (`@guest.lumicinema.vn` - `FR-POS-02`); thiếu bước trừ tồn kho `Combo.stock` và tạo bản ghi `OrderCombo` với `isDelivered = true, deliveredAt = NOW()` (nếu khách mua kèm bắp nước tại quầy); và trả về mã biên lai `REC-POS-...` (`201 Created`).

---

### 13. File `13_ban_combo_tai_quay_pos.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/13_ban_combo_tai_quay_pos.puml` — Mục 4.4 (`FR-POS-03`: Bán Combo bắp nước độc lập - Standalone Concession POS, Luồng 4.4B).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 50-61 & Dòng 71 (Mục 5):** Đang vẽ nhánh `opt Khách hàng muốn tích điểm thành viên` (`Trả về thông tin khách hàng & điểm tích lũy`, `5. Cộng điểm tích lũy thành viên`).
     - **Cần sửa thành:** Hệ thống Lumi Cinema trong SRS v2.0 **không có tính năng tích điểm thành viên** (bảng `users` không có trường điểm tích lũy). Thay vào đó, nhân viên nhập thông tin khách (nếu có) để hàm `resolveCustomer()` gắn đơn vào tài khoản thành viên hoặc hồ sơ khách vãng lai (`FR-POS-02`).
  2. **Dòng 68:** Đang gọi `POST /api/pos/orders/combos`.
     - **Cần sửa thành:** Theo SRS Mục 4.4.1 & 4.4.2 (Luồng 4.4B), API chuẩn là `POST /api/staff/pos/combos` *(alias: `POST /api/staff/combos/sell`)*.
  3. **Dòng 71:** Đang ghi:
     `1. Tạo Order (type: 'POS', status: 'COMPLETED')`
     `2. Tạo OrderCombo (status: 'DELIVERED')`
     `4. Tạo Payment (status: 'COMPLETED')`
     - **Cần sửa thành:** Trong CSDL của SRS (Mục 6.5 - ERD), **không có bảng `Order`**, mà lưu trực tiếp vào bảng `Payment` và `OrderCombo`. Cụ thể trong `Prisma Transaction`:
       1. Tạo `Payment` (`status = 'Success'`, `transactionCode = 'POS_COMBO_...'`, `paymentMethod = 'Cash' | 'POS_QR'`).
       2. Trừ tồn kho nguyên tử có điều kiện: `tx.combo.updateMany({ where: { id: item.combo_id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })` (nếu `count === 0` thì rollback báo hết hàng `400 OUT_OF_STOCK`).
       3. Tạo các bản ghi `OrderCombo` liên kết với `paymentId`, đặt `isDelivered = true` và `deliveredAt = NOW()`.
       4. Trả về `201 Created` kèm biên lai `REC-COMBO-...`.

---

### 14. File `14_soat_ve_vao_rap.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/14_soat_ve_vao_rap.puml` — Mục 4.5 (`FR-CHK-01`: Soát vé vào rạp bằng QR / Mã vé, Luồng 4.5A).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 20-23:** Theo Luồng 4.5A (Mục 4.5.2), nhân viên có thể tra cứu vé trước qua `GET /api/staff/tickets/search?code=...` rồi xác nhận soát vé qua `PATCH /api/tickets/{id}/mark-used` *(alias: `POST /api/staff/checkin`)*.
  2. **Dòng 38-58:** Mặc dù ở dòng 38 có ghi kiểm tra `Khung giờ chiếu (hiện tại trong [Giờ chiếu - 30p, Giờ kết thúc])`, nhưng trong khối `alt` (dòng 40-58) lại **thiếu nhánh `else` xử lý lỗi khi vé không tồn tại (`404 Not Found - TICKET_NOT_FOUND`) hoặc sai khung giờ soát vé (`NOW < startTime - 30p || NOW > endTime` -> `400 Bad Request`)** theo đúng Mục 4.5.2 (nhánh `7c`).
  3. **Dòng 49:** Đang ghi `data: { status: 'Used', usedAt: NOW(), checkedBy: staffId }`. Theo Mục 4.5.2 (bước 7) và Mục 6.5 (bảng `TICKETS`), câu lệnh cập nhật chuẩn là `prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'Used' } })` và phản hồi trả về kèm `checked_in_at`.

---

### 15. File `15_giao_nhan_combo_online.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/15_giao_nhan_combo_online.puml` — Mục 4.5 (`FR-CHK-02`: Giao nhận Combo bắp nước độc lập & Chặn nhận trùng - `BR-05`, Luồng 4.5B) & Mục 6.4.
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 25 & 28:** Đang gọi `GET /api/staff/orders/{code}/combos` và truy vấn `prisma.order.findUnique({ where: { code }, include: { orderCombos: ... } })`.
     - **Cần sửa thành:** Trong hệ thống **không có bảng `orders`** (`prisma.order` không tồn tại). Theo SRS Mục 4.5.1 & 4.5.2 (Luồng 4.5B bước 3), nhân viên tra cứu qua `GET /api/staff/combos/orders?q={code/phone}&status=pending` *(alias: `GET /api/staff/combos`)*, truy vấn trên bảng `payments` (`Payment.status === 'Success'`) kèm danh sách `orderCombos` (`include: { combo: true }`).
  2. **Dòng 33-36:** Cần bổ sung trường hợp đơn hàng chưa thanh toán thành công (`Payment.status !== 'Success'` -> `400 Bad Request - PAYMENT_NOT_SUCCESS`) hoặc đơn hàng bị hủy do sự cố suất chiếu.
  3. **Dòng 41 & 53:** Đang dùng thuộc tính `status == 'NOT_DELIVERED'` và cập nhật `status = 'DELIVERED'`.
     - **Cần sửa thành:** Theo ERD (Mục 6.5 - bảng `ORDER_COMBOS`) và Luồng 4.5B, trường dữ liệu chuẩn là kiểu boolean **`isDelivered = false`** (`Chưa nhận`) và khi giao hàng cập nhật **`isDelivered = true, deliveredAt = new Date()`** (`Đã nhận`).
  4. **Dòng 50:** Đang gọi `POST /api/staff/orders/{id}/fulfill-combo`.
     - **Cần sửa thành:** Endpoint chuẩn theo SRS Mục 4.5.1 & 4.5.2 là `POST /api/staff/combos/deliver` *(alias: `POST /api/staff/combos/fulfill`)* nhận payload `{ orderComboIds: [...] }` hoặc `{ paymentId }`.

---

### 16. File `16_tra_cuu_quan_ly_ve.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/16_tra_cuu_quan_ly_ve.puml` — Mục 4.5.1 (`FR-CHK-01`), Mục 4.6 & Mục 7.2.2 (STT 16).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Khớp hoàn toàn với luồng nhân viên/Admin tra cứu vé theo từ khóa đa năng (`GET /api/staff/tickets/search?q={keyword}`: mã vé `#LMC-...`, email, SĐT, tên khách) và truy vấn hồ sơ chi tiết vé (`GET /api/tickets/{id}`) hiển thị đầy đủ trạng thái vé (`Valid`/`Used`/`Cancelled`), công nợ hoàn tiền (`refundStatus`, `refundAmount`) và các nút nghiệp vụ (Soát vé, Hủy vé sự cố, Xác nhận hoàn tiền mặt).

---

### 17. File `17_khach_huy_ve_nhan_voucher.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/17_khach_huy_ve_nhan_voucher.puml` — Mục 4.6 (`FR-CAN-01`, `FR-CAN-03`, `BR-03`: Khách hàng chủ động tự hủy vé & Nhận Voucher 50%, Luồng 4.6A).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Khớp chính xác với mọi quy định của `BR-03` và Luồng 4.6A: gọi `POST /api/tickets/{id}/cancel`, kiểm tra vé chính chủ, `Ticket.status == 'Valid'`, kiểm tra `(startTime - NOW()) >= 2 tiếng (120 phút)`, thực thi `Prisma Transaction` nguyên tử chuyển `Ticket.status = 'Cancelled'`, giải phóng `Seat.status = 'EMPTY'`, tự động sinh mã Voucher `COMP50_...` (`discountType: 'Percentage'`, `discountValue: 50`, `maxUsage: 1`, `expiryDate: NOW() + 30 ngày`, gắn `userId`), gửi email qua `Nodemailer SMTP`, và ghi chú rõ giữ nguyên các vé khác cùng đơn combo.

---

### 18. File `18_huy_ve_su_co_hoan_tien_mat.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/18_huy_ve_su_co_hoan_tien_mat.puml` — Mục 4.6 (`FR-CAN-02`, `BR-04`, Luồng 4.6B), Mục 4.8 (`FR-ADM-04`) & Mục 6.3 (Sơ đồ tuần tự Hủy vé do sự cố rạp & Hoàn tiền mặt).
- **Trạng thái:** `⚠️ Cần cập nhật`
- **Chi tiết điểm lệch & Hướng dẫn sửa:**
  1. **Dòng 56 (Giai đoạn 1 - Nhánh Admin hủy khẩn cấp toàn bộ suất chiếu `FR-ADM-04`):** Đang ghi:
     `3. Khóa toàn bộ ghế của suất chiếu không cho đặt lại`
     - **Theo SRS (Mục 4.6.1, Mục 4.8.1 `FR-ADM-04`, Mục 4.8.2 Luồng 4.8B bước 4.1.2, và Mục 6.6.5 State Diagram):** Khi hủy suất chiếu khẩn cấp, hệ thống **giải phóng toàn bộ ghế của suất chiếu về `Seat.status = 'EMPTY', reservedUntil = null`** (`tx.seat.updateMany({ where: { screeningId }, data: { status: 'EMPTY', reservedUntil: null } })`), còn việc chặn đặt vé mới được thực hiện bằng cách chuyển trạng thái suất chiếu sang `Screening.status = 'CANCELLED'` (hoặc `'ENDED'`). Ngoài ra ở mục 4 dòng 56, đối với các combo chưa nhận (`OrderCombo.isDelivered == false`), cần ghi rõ thêm thao tác **cộng hoàn lại tồn kho `Combo.stock = stock + quantity`** (theo đúng Mục 4.6.1 và Mục 6.3 dòng 1146 của SRS).
  2. **Dòng 97 (Giai đoạn 2 - Xác nhận đã trả tiền mặt tại quầy):** Trong `Prisma Transaction đối soát kế toán`, cần bổ sung bước **cập nhật `Payment.status = 'Refunded'`** (khi toàn bộ vé trong đơn đã hủy/hoàn tiền) và xuất mã biên lai chi tiền mặt `cash_receipt: REF-CASH-...` theo đúng Mục 4.6.2 (`FR-CAN-02`), Mục 4.6.3 (Luồng 4.6B bước 5.3-5.4) và Mục 6.3 (dòng 1170).

---

### 19. File `19_khach_danh_gia_phim.puml`
- **Tên file & Mục SRS tương ứng:** `Sequence/19_khach_danh_gia_phim.puml` — Mục 4.2 (`FR-REV-01` -> `FR-REV-03`, `BR-06`: Phân hệ Đánh giá Phim, Luồng 4.2.2).
- **Trạng thái:** `✅ Khớp 100%`
- **Chi tiết đối chiếu:**
  - Khớp hoàn toàn với SRS Mục 4.2: Truy vấn danh sách đánh giá qua `GET /api/reviews?movie_id={id}`, gửi đánh giá qua `POST /api/reviews` kèm Session Token, kiểm tra điều kiện `BR-06` (chỉ cần đăng nhập hợp lệ, không bắt buộc phải mua vé trước đó), kiểm tra Zod (`rating` 1-5 sao, `comment <= 1000` ký tự), xử lý Idempotent Upsert (`FR-REV-02`: cập nhật nếu đã đánh giá hoặc tạo mới nếu đánh giá lần đầu), và tự động tính lại điểm trung bình `newRating = round(AVG(rating), 1)` cập nhật vào `movie.rating` (`FR-REV-03`).

---

# BÁO CÁO KIỂM TOÁN SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS AUDIT - PART 2: FILES 20 TO 38)

**Ngày kiểm toán:** 05/11/2026  
**Người thực hiện:** Sequence Diagrams Auditor (Part 2)  
**Phạm vi:** 19 file sơ đồ tuần tự từ `20_*.puml` đến `38_*.puml` trong `d:/cinema_project/Sequence/` và `d:/cinema_project/cinema-app/Sequence/`  
**Tài liệu đối chiếu:**
- Đặc tả Yêu cầu Phần mềm: `d:/cinema_project/SRS_He_Thong_Quan_Ly_Rap_Phim.md` (Phiên bản 2.0 - Chương 4, Chương 6 & Phụ lục 7.2.2)
- Mã nguồn thực tế: `d:/cinema_project/cinema-app/src/app/api/` và `d:/cinema_project/cinema-app/prisma/schema.prisma`

---

## 1. KIỂM TRA ĐỒNG BỘ THƯ MỤC & RÀ SOÁT TỪ KHÓA LỖI THỜI

### 1.1. Đồng bộ giữa `d:/cinema_project/Sequence/` và `d:/cinema_project/cinema-app/Sequence/`
- **Kết quả đối chiếu SHA-256 Hash:** Toàn bộ **19/19 file** (từ `20_admin_quan_ly_danh_gia.puml` đến `38_bao_cao_doanh_thu_tai_chinh.puml`) tại hai thư mục `d:/cinema_project/Sequence/` và `d:/cinema_project/cinema-app/Sequence/` **GIỐNG HỆT NHAU 100% (IDENTICAL)**.
- **Lưu ý quy ước đặt tên file:** Các file không đặt tên ngắn gọn là `20.puml`..`38.puml` mà được đặt tên đầy đủ có hậu tố mô tả (`20_admin_quan_ly_danh_gia.puml` .. `38_bao_cao_doanh_thu_tai_chinh.puml`), khớp 100% với bảng kê tại **Mục 7.2.2** của SRS v2.0.

### 1.2. Kiểm tra từ khóa công nghệ cũ (`VNPay`, `Supabase`)
- **Kết quả quét từ khóa:** Không có bất kỳ file nào trong nhóm `20` -> `38` còn chứa từ khóa `VNPay`, `Momo` hay `Supabase`.
- **Vấn đề đồng bộ chuẩn Lifeline (Architecture Naming):**
  - Chỉ có 2 file **`20_admin_quan_ly_danh_gia.puml`** và **`38_bao_cao_doanh_thu_tai_chinh.puml`** được viết theo chuẩn kiến trúc chi tiết của SRS v2.0 (có ghi rõ `Frontend Next.js`, `Next.js App Router`, `PostgreSQL / Prisma`, đường dẫn REST API, mã FR/BR).
  - **17 file còn lại (`21_*.puml` đến `37_*.puml`)** vẫn đang ở dạng sơ đồ khái niệm mức cao (High-level Conceptual Sequence), dùng tên Lifeline chung chung (`"Giao diện quản lý..." as UI`, `"Điều khiển..." as C`, `"Dữ liệu hệ thống" as DB`), thiếu đường dẫn API Endpoint cụ thể, thiếu bước xác thực JWT RBAC (`requireAuth(['ADMIN'])`) và dùng sai nhiều tên trạng thái Enum (`ACTIVE`/`INACTIVE` cho Phim và Voucher thay vì `SHOWING`/`UPCOMING`/`ENDED` hay xóa mềm `isDeleted`).

### 1.3. Tổng hợp trạng thái kiểm toán (Summary Table)

| STT | Tên file (`.puml`) | Mục SRS ánh xạ | Đồng bộ 2 thư mục | Trạng thái đối chiếu SRS v2.0 & Code |
| :-: | :--- | :--- | :-: | :--- |
| 20 | `20_admin_quan_ly_danh_gia.puml` | Mục 4.2 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu nhánh 404 & lệch nhẹ với code) |
| 21 | `21_quan_ly_phim_tong_quan.puml` | Mục 4.8 & 6.6.6 | ✅ Giống 100% | ⚠️ Cần cập nhật (Sai trạng thái `INACTIVE`, thiếu API/Lifeline chuẩn) |
| 22 | `22_them_phim.puml` | Mục 4.8 & 6.6.6 | ✅ Giống 100% | ⚠️ Cần cập nhật (Sai trạng thái `ACTIVE`, thiếu check trùng tên 409 & API) |
| 23 | `23_sua_phim.puml` | Mục 4.8 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu API `PUT /api/movies/[id]`, Lifeline chung chung) |
| 24 | `24_ngung_chieu_phim.puml` | Mục 4.8, 6.6.6 (BR-07) | ✅ Giống 100% | ⚠️ Cần cập nhật (Sai trạng thái `INACTIVE`, thiếu logic Soft Delete BR-07) |
| 25 | `25_quan_ly_combo_tong_quan.puml` | Mục 4.8 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Lifeline chung chung, thiếu API `/api/combos` & nhánh ngừng bán) |
| 26 | `26_them_combo_moi.puml` | Mục 4.8 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu API `POST /api/combos`, RBAC & Lifeline chuẩn) |
| 27 | `27_sua_combo.puml` | Mục 4.8 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu API `PUT /api/combos/[id]`, RBAC & Lifeline chuẩn) |
| 28 | `28_ngung_ban_combo.puml` | Mục 4.8 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu API `PUT /api/combos/[id]` / `DELETE`, Lifeline chuẩn) |
| 29 | `29_cap_nhat_ton_kho_combo.puml` | Mục 4.8 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu API `PUT /api/combos/[id]`, RBAC & Lifeline chuẩn) |
| 30 | `30_quan_ly_voucher_tong_quan.puml` | Mục 4.7 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Sai trạng thái `INACTIVE`, thiếu API `/api/coupons`) |
| 31 | `31_them_voucher.puml` | Mục 4.7 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Sai trạng thái `ACTIVE`, lệch mã lỗi trùng code 400 vs 409) |
| 32 | `32_sua_voucher.puml` | Mục 4.7 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu kiểm tra `maxUsage >= usedCount`, trùng code, API) |
| 33 | `33_ngung_su_dung_voucher.puml` | Mục 4.7 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Model `Coupon` không có cột `status = 'INACTIVE'`, code dùng `DELETE`) |
| 34 | `34_quan_ly_suat_chieu_tong_quan.puml` | Mục 4.8 & 7.2.2 | ✅ Giống 100% | ⚠️ Cần cập nhật (Thiếu nhánh Hủy suất chiếu khẩn cấp `FR-ADM-04` như bảng 7.2.2 mô tả) |
| 35 | `35_them_suat_chieu.puml` | Mục 4.8 (FR-ADM-03, BR-08) | ✅ Giống 100% | ⚠️ Cần cập nhật (Ghi nhầm `BR-09` thay vì `BR-08`, lệch mã HTTP 409 vs 400) |
| 36 | `36_kiem_tra_do_phu_hop_suat_chieu.puml` | Mục 4.8 (BR-02, BR-08) | ✅ Giống 100% | ⚠️ Cần cập nhật (Ghi nhầm `BR-09` thay vì `BR-08`, thiếu kiểm tra nhãn tuổi `BR-02`) |
| 37 | `37_sua_suat_chieu.puml` | Mục 4.8 (FR-ADM-03, BR-08) | ✅ Giống 100% | ⚠️ Cần cập nhật (Lệch điều kiện chặn sửa `tickets > 0` vs `startTime <= NOW()`, nhầm `BR-09`) |
| 38 | `38_bao_cao_doanh_thu_tai_chinh.puml` | Mục 4.9 (FR-REP-01..03, BR-10) | ✅ Giống 100% | ⚠️ Cần cập nhật (Lệch cấu trúc query/response giữa sơ đồ với code `GET /api/admin/reports/revenue`) |

---

## 2. CHI TIẾT KIỂM TOÁN TỪNG FILE (`20` ĐẾN `38`)

---

### File 20: `20_admin_quan_ly_danh_gia.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: QUẢN LÝ & KIỂM DUYỆT ĐÁNH GIÁ PHIM (ADMIN REVIEW MODERATION)`
- **Mục SRS tương ứng:** Mục 4.2 (`FR-REV-01`..`03`, `BR-06`), Mục 4.2.2 (Bảng API Endpoints) & Mục 7.2.2 (STT 20)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Thiếu bước kiểm tra tồn tại bình luận (`404 Not Found`) trước khi xóa (Dòng 46):** Trong code thực tế [`src/app/api/reviews/[id]/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/reviews/[id]/route.ts#L162-L177), API gọi `prisma.review.findUnique({ where: { id: reviewId } })`; nếu không tồn tại thì ném lỗi `404 Not Found` (`"Không tìm thấy bình luận cần xóa"`), sau đó mới gọi `prisma.review.delete`. Sơ đồ hiện nhảy thẳng vào `prisma.review.delete({ where: { id } })`.
  2. **Không đồng nhất đường dẫn API giữa SRS Mục 4.2.2 và Bảng 7.2.2:** Sơ đồ (dòng 37) và Mục 4.2.2 (dòng 320) ghi `DELETE /api/reviews/{id}` (khớp với code thực tế `src/app/api/reviews/[id]/route.ts`), nhưng Bảng 7.2.2 (dòng 1946 & 2007) trong SRS lại ghi `DELETE /api/admin/reviews/[id]`.
  3. **Bước ghi Audit Log & Response (Dòng 56-61):** Sơ đồ vẽ bước `Ghi Audit Log hành động kiểm duyệt của Admin (NFR-INT-02)` vào DB và trả về `{ success: true, message: "Đã xóa đánh giá vi phạm thành công", newRating }`, nhưng trong code `DELETE /api/reviews/[id]` (dòng 208-213) hiện không ghi bảng `audit_logs` và chỉ trả về `apiResponse(true, undefined, 'Đã xóa bình luận', 200)`.
- **Hướng sửa cụ thể:**
  - Bổ sung bước `prisma.review.findUnique({ where: { id } })` và nhánh `alt Không tìm thấy đánh giá -> 404 Not Found` trước khi xóa tại dòng 46.
  - Đồng bộ chú thích endpoint (`DELETE /api/reviews/{id}`) và cấu trúc JSON trả về giữa sơ đồ, code và bảng 7.2.2 SRS.

---

### File 21: `21_quan_ly_phim_tong_quan.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: QUẢN TRỊ DANH MỤC PHIM (TỔNG QUAN)`
- **Mục SRS tương ứng:** Mục 4.8 (`FR-ADM-01`, `FR-ADM-02`, `BR-07`), Mục 6.6.6 & Mục 7.2.2 (STT 21)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Sai giá trị Enum trạng thái phim (Dòng 56):** Sơ đồ ghi `C -> DB: Cập nhật status = 'INACTIVE'`. Theo `schema.prisma` (`enum MovieStatus`) và SRS Mục 4.8.1 / 6.6.6, trạng thái phim chỉ có 3 giá trị: `SHOWING`, `UPCOMING`, `ENDED` (kèm cờ `isDeleted = true` khi xóa mềm), tuyệt đối không có `INACTIVE`.
  2. **Tên Lifeline & Thông điệp quá chung chung (Dòng 10-13, 18-25):** Đang dùng `boundary "Giao diện quản lý phim"`, `control "Điều khiển phim"`, `entity "Dữ liệu hệ thống"` thay vì chuẩn kiến trúc `Frontend Next.js`, `API Quản lý Phim (GET/POST/PUT/DELETE /api/movies)`, `Docker PostgreSQL / Prisma`.
  3. **Thiếu kiểm tra ràng buộc khi ngừng chiếu/xóa phim (`BR-07`):** Nhánh `Ngừng chiếu phim` (dòng 51-63) chưa thể hiện việc kiểm tra suất chiếu `UPCOMING`/`SHOWING` hoặc chuyển `status = 'ENDED'` (`isDeleted = true`).
- **Hướng sửa cụ thể:**
  - Đổi tên Lifeline theo chuẩn Next.js App Router & Docker PostgreSQL/Prisma.
  - Sửa dòng 56 từ `status = 'INACTIVE'` thành `status = 'ENDED'` (hoặc gọi `DELETE /api/movies/{id}` / `PUT /api/movies/{id}` với `status = 'ENDED'`, `isDeleted = true` theo `BR-07`).

---

### File 22: `22_them_phim.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: THÊM PHIM MỚI`
- **Mục SRS tương ứng:** Mục 4.8.1 (`FR-ADM-01`, `BR-02`), Mục 6.6.6 & Mục 7.2.2 (STT 22)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Sai giá trị Enum trạng thái phim khi khởi tạo (Dòng 33):** Sơ đồ ghi `C -> DB: Lưu phim mới vào CSDL (status = 'ACTIVE')`. Trong `schema.prisma` và [`src/app/api/movies/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/movies/route.ts#L175-L199), `Movie.status` nhận giá trị `'SHOWING'` hoặc `'UPCOMING'` (`isDeleted = false`), không phải `'ACTIVE'`.
  2. **Thiếu bước kiểm tra trùng tiêu đề phim (`409 Conflict`) và tạo `slug`:** Trong code `POST /api/movies` (dòng 131-147), hệ thống truy vấn `prisma.movie.findFirst({ where: { title: { equals: title.trim(), mode: 'insensitive' } } })`; nếu đã tồn tại thì trả về `409 Conflict` (`"Phim với tiêu đề này đã tồn tại trong hệ thống"`). Sơ đồ hiện thiếu hoàn toàn nhánh này.
  3. **Thiếu bước xác thực quyền `ADMIN` (`requireAuth(['ADMIN'])`) và đường dẫn API:** Dòng 23 chỉ ghi chung chung `Gửi dữ liệu phim mới` mà không ghi rõ `POST /api/movies` (hoặc `/api/admin/movies`) và kiểm tra RBAC.
- **Hướng sửa cụ thể:**
  - Chuẩn hóa Lifeline và thêm thông điệp `POST /api/movies` kèm `requireAuth(['ADMIN'])`.
  - Bổ sung bước kiểm tra trùng tên phim (`409 Conflict`).
  - Sửa dòng 33 từ `status = 'ACTIVE'` thành `status = 'UPCOMING' | 'SHOWING', isDeleted = false` (mặc định `ticketPrice = 120000`, gán nhãn tuổi `ageRating: P | C13 | T18`).

---

### File 23: `23_sua_phim.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: CHỈNH SỬA THÔNG TIN PHIM`
- **Mục SRS tương ứng:** Mục 4.8.1 (`FR-ADM-01`), Mục 6.6.6 & Mục 7.2.2 (STT 23)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Lifeline và giao thức API chưa cụ thể (Dòng 10-13, 18, 38):** Chưa ghi rõ endpoint `GET /api/movies/{id}` và `PUT /api/movies/{id}` (trong [`src/app/api/movies/[id]/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/movies/[id]/route.ts#L89-L180)), cũng như tên Lifeline `Docker PostgreSQL / Prisma`.
  2. **Thiếu bước xác thực phân quyền `requireAuth(['ADMIN'])`:** Trong code `PUT /api/movies/[id]` (dòng 94), hệ thống kiểm tra quyền `ADMIN` đầu tiên trước khi tra cứu/cập nhật phim.
  3. **Thiếu chi tiết các trường nghiệp vụ quan trọng khi sửa phim:** Chưa nêu rõ việc cập nhật `ageRating` (`P`, `C13`, `T18`), `ticketPrice`, `releaseDate`, `endDate`, và `status` (`SHOWING`, `UPCOMING`, `ENDED`).
- **Hướng sửa cụ thể:**
  - Cập nhật Lifeline chuẩn (`Frontend Next.js`, `API Quản lý Phim (Next.js App Router)`, `Docker PostgreSQL / Prisma`).
  - Ghi rõ lời gọi `GET /api/movies/{id}`, `PUT /api/movies/{id}`, bước kiểm tra `requireAuth(['ADMIN'])` và lệnh `prisma.movie.update({ where: { id: movieId }, data: updateData })`.

---

### File 24: `24_ngung_chieu_phim.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: NGỪNG CHIẾU PHIM`
- **Mục SRS tương ứng:** Mục 4.8.1 (`FR-ADM-02`), Mục 4.8.2 (Nhánh 2a, 3a), Mục 6.6.6 & Quy tắc `BR-07`
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Sai giá trị Enum trạng thái phim (Dòng 29, 41, 42):** Sơ đồ dùng `status = 'ACTIVE'` và `status = 'INACTIVE'`. Trong SRS v2.0 (Mục 4.8.1, 6.6.6) và `schema.prisma`, trạng thái phim là `SHOWING` / `UPCOMING` chuyển sang `ENDED` (kèm cờ xóa mềm `isDeleted = true`).
  2. **Thiếu hoàn toàn quy tắc nghiệp vụ cốt lõi `BR-07` & `FR-ADM-02` (Xóa mềm / Ngừng chiếu bảo toàn lịch sử):** Theo SRS Mục 4.8.1 (dòng 724-728) và code [`DELETE /api/movies/[id]`](file:///d:/cinema_project/cinema-app/src/app/api/movies/[id]/route.ts#L192-L268):
     - Bước 1: Kiểm tra phim có tồn tại không (`404 Not Found`).
     - Bước 2: Kiểm tra phim có đang có suất chiếu `UPCOMING` hoặc `SHOWING` không (`prisma.screening.findFirst`). Nếu có -> **Chặn thao tác và trả về `400 Bad Request`** (`"Không thể xóa/ngừng chiếu phim vì đang có suất chiếu ở trạng thái UPCOMING hoặc SHOWING"`).
     - Bước 3: Kiểm tra phim đã từng phát sinh vé bán chưa (`prisma.ticket.findFirst`). Nếu đã có vé -> Thực hiện **Soft Delete** (`status = 'ENDED'`, `isDeleted = true`) để bảo toàn lịch sử doanh thu (`BR-07`). Nếu chưa từng có vé -> Cho phép xóa hoặc chuyển `ENDED`.
     - *(Lưu ý thêm trong code: tại `src/app/api/movies/[id]/route.ts` dòng 245-248, khi soft delete code mới chỉ cập nhật `data: { status: 'ENDED' }` mà quên chưa set `isDeleted: true` dù cột `isDeleted` đã có trong `schema.prisma` dòng 120).*
- **Hướng sửa cụ thể:**
  - Thay toàn bộ `ACTIVE` / `INACTIVE` bằng `SHOWING` / `UPCOMING` và `ENDED` (`isDeleted = true`).
  - Bổ sung bước kiểm tra suất chiếu đang hoạt động (`status IN ('UPCOMING', 'SHOWING')` -> `400 Bad Request`) và kiểm tra lịch sử vé (`hasTickets`) theo đúng đặc tả `FR-ADM-02` và `BR-07`.

---

### File 25: `25_quan_ly_combo_tong_quan.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: QUẢN TRỊ DANH MỤC COMBO BẮP NƯỚC (TỔNG QUAN)`
- **Mục SRS tương ứng:** Mục 4.8, Mục 6.1 (`UC-17`) & Mục 7.2.2 (STT 25)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Thiếu nhánh "Ngừng bán / Xóa combo" trong sơ đồ tổng quan:** Sơ đồ tổng quan hiện chỉ có 3 nhánh (`Thêm combo mới`, `Sửa thông tin combo`, `Cập nhật tồn kho`), thiếu nhánh `Ngừng bán combo (ACTIVE <-> INACTIVE)` tương ứng với file `28_ngung_ban_combo.puml`.
  2. **Tên Lifeline và thông điệp chưa theo chuẩn kỹ thuật SRS v2.0 (Dòng 10-13, 18-25):** Dùng tên chung chung (`Điều khiển combo`, `Dữ liệu hệ thống`), chưa ghi rõ endpoint `GET /api/combos` (kèm kiểm tra `isAdmin` để lấy toàn bộ cả `ACTIVE` và `INACTIVE` như trong [`src/app/api/combos/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/combos/route.ts#L98-L132)).
- **Hướng sửa cụ thể:**
  - Cập nhật Lifeline chuẩn (`Frontend Next.js`, `API Quản lý Combo (/api/combos)`, `Docker PostgreSQL / Prisma`).
  - Ghi rõ truy vấn `GET /api/combos` và bổ sung nhánh `Ngừng bán combo (status = 'INACTIVE')` vào khối `alt`.

---

### File 26: `26_them_combo_moi.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: THÊM COMBO MỚI`
- **Mục SRS tương ứng:** Mục 4.8, Mục 6.1 (`UC-17`) & Mục 7.2.2 (STT 26)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Thiếu đường dẫn API Endpoint & Kiểm tra quyền `ADMIN` (Dòng 23-25):** Chưa ghi rõ endpoint `POST /api/combos` (hoặc `/api/admin/combos` theo bảng 7.2.2) và bước `verifyAdminRole()` (`401 Unauthorized` / `403 Forbidden`) như trong [`src/app/api/combos/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/combos/route.ts#L184-L203).
  2. **Tên Lifeline chưa đồng bộ chuẩn SRS v2.0 (Dòng 10-13):** Đang dùng `Điều khiển combo` và `Dữ liệu hệ thống` thay vì `API Quản lý Combo (Next.js App Router)` và `Docker PostgreSQL / Prisma`.
- **Hướng sửa cụ thể:**
  - Chuẩn hóa tên Lifeline, bổ sung `POST /api/combos`, bước xác thực JWT `ADMIN`, kiểm tra `createComboSchema` bằng Zod (`name` 1-100 ký tự, `price > 0`, `stock >= 0`, `status: 'ACTIVE' | 'INACTIVE'`) và `prisma.combo.create()`.

---

### File 27: `27_sua_combo.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: CHỈNH SỬA THÔNG TIN COMBO`
- **Mục SRS tương ứng:** Mục 4.8, Mục 6.1 (`UC-17`) & Mục 7.2.2 (STT 27)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Thiếu đường dẫn API Endpoint & Kiểm tra quyền `ADMIN` (Dòng 18, 38):** Chưa ghi rõ `GET /api/combos/{id}` và `PUT /api/combos/{id}` (trong [`src/app/api/combos/[id]/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/combos/[id]/route.ts#L149-L235)) cùng bước `verifyAdminRole()`.
  2. **Thứ tự kiểm tra trong `PUT /api/combos/[id]` (Dòng 40-50):** Trong code thực tế, khi gửi request `PUT /api/combos/[id]`, API kiểm tra `verifyAdminRole`, validate `updateComboSchema` (Zod), kiểm tra `prisma.combo.findUnique({ where: { id: comboId } })` (`404 Not Found` nếu không tồn tại), rồi mới `prisma.combo.update`.
  3. **Tên Lifeline chưa đồng bộ chuẩn SRS v2.0 (Dòng 10-13).**
- **Hướng sửa cụ thể:**
  - Chuẩn hóa tên Lifeline, ghi rõ `GET /api/combos/{id}` và `PUT /api/combos/{id}`, bổ sung kiểm tra quyền `ADMIN` và Zod validation (`price > 0`, `stock >= 0`, `name <= 100 ký tự`).

---

### File 28: `28_ngung_ban_combo.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: NGỪNG BÁN COMBO BẮP NƯỚC`
- **Mục SRS tương ứng:** Mục 4.8, Mục 6.1 (`UC-17`) & Mục 7.2.2 (STT 28)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Lệch giữa Bảng 7.2.2 SRS, Sơ đồ và Code thực tế:**
     - Bảng 7.2.2 SRS (dòng 2015) ghi endpoint là `PATCH /api/admin/combos/[id]/status`.
     - Trong code thực tế [`src/app/api/combos/[id]/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/combos/[id]/route.ts#L149-L319), không có route `/status` riêng và không có method `PATCH`; việc đổi trạng thái sang `'INACTIVE'` được thực hiện qua `PUT /api/combos/[id]` với `{ status: 'INACTIVE' }` (ngoài ra còn có `DELETE /api/combos/[id]` chặn xóa nếu `orderComboCount > 0` và hướng dẫn chuyển sang `'INACTIVE'`).
     - Sơ đồ (dòng 36-40) vẽ nhánh `alt Combo vốn đã ngừng bán -> Báo 400 Bad Request`, trong khi `PUT /api/combos/[id]` trong code cập nhật lũy đẳng (Idempotent) sang `'INACTIVE'` và trả về `200 OK` (chỉ trả `404` nếu không tìm thấy combo).
  2. **Tên Lifeline chưa đồng bộ chuẩn SRS v2.0 (Dòng 10-13).**
- **Hướng sửa cụ thể:**
  - Chuẩn hóa Lifeline và ghi rõ API `PUT /api/combos/{id}` (payload `{ status: "INACTIVE" }`) kèm kiểm tra quyền `ADMIN` và kiểm tra tồn tại combo (`404 Not Found`).
  - Có thể bổ sung chú thích ràng buộc bảo toàn lịch sử: nếu Admin gọi `DELETE /api/combos/{id}` đối với combo đã có trong `order_combos` (`orderComboCount > 0`), hệ thống chặn xóa cứng (`400 COMBO_HAS_ORDERS`) và yêu cầu chuyển sang `status = 'INACTIVE'`.

---

### File 29: `29_cap_nhat_ton_kho_combo.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: CẬP NHẬT TỒN KHO COMBO`
- **Mục SRS tương ứng:** Mục 4.8, Mục 6.1 (`UC-17`) & Mục 7.2.2 (STT 29)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Lệch đường dẫn API giữa Bảng 7.2.2 SRS và Code thực tế:**
     - Bảng 7.2.2 SRS (dòng 2016) ghi `PATCH /api/admin/combos/[id]/stock`.
     - Code thực tế thực hiện qua `PUT /api/combos/[id]` (truyền `{ stock: newStock }` hoặc `{ stock_quantity: newStock }`) trong [`src/app/api/combos/[id]/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/combos/[id]/route.ts#L149-L235).
     - Sơ đồ hiện tại (dòng 18, 31) chỉ ghi lời gọi chung chung, chưa có đường dẫn API và bước kiểm tra quyền `ADMIN`.
  2. **Tên Lifeline chưa đồng bộ chuẩn SRS v2.0 (Dòng 10-13).**
- **Hướng sửa cụ thể:**
  - Chuẩn hóa Lifeline (`Frontend Next.js`, `API Quản lý Combo`, `Docker PostgreSQL / Prisma`).
  - Ghi rõ lời gọi `GET /api/combos/{id}` và `PUT /api/combos/{id}` với payload `{ stock: newStock }`, xác thực `verifyAdminRole()` và kiểm tra `newStock >= 0` (số nguyên) qua Zod.

---

### File 30: `30_quan_ly_voucher_tong_quan.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: QUẢN TRỊ VOUCHER KHUYẾN MÃI (TỔNG QUAN)`
- **Mục SRS tương ứng:** Mục 4.7 (`FR-VOU-01`..`03`), Mục 6.1 (`UC-18`) & Mục 7.2.2 (STT 30)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Sai cấu trúc bảng `coupons` ở nhánh Ngừng sử dụng voucher (Dòng 56):** Sơ đồ ghi `C -> DB: Cập nhật status = 'INACTIVE'`. Theo `schema.prisma` (dòng 193-214) và SRS Mục 6.5 (ERD), bảng `coupons` **không có cột `status`**. Trạng thái khả dụng của voucher được tính động từ `expiryDate >= NOW()` và `usedCount < maxUsage`, hoặc xóa mã qua `DELETE /api/coupons/[id]`.
  2. **Thiếu đường dẫn API & Kiểm tra quyền `ADMIN`:** Chưa ghi rõ `GET /api/coupons` (bắt buộc `verifyAdminRole` trong [`src/app/api/coupons/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/coupons/route.ts#L121-L182)).
  3. **Tên Lifeline chưa đồng bộ chuẩn SRS v2.0 (Dòng 10-13).**
- **Hướng sửa cụ thể:**
  - Chuẩn hóa Lifeline và ghi rõ API `GET /api/coupons` kèm kiểm tra JWT `ADMIN`.
  - Tại nhánh "Ngừng sử dụng / Xóa voucher" (dòng 51-63), sửa từ `Cập nhật status = 'INACTIVE'` sang gọi `DELETE /api/coupons/{id}` (`prisma.coupon.delete`) hoặc cập nhật `expiryDate` / `maxUsage = usedCount` theo đúng thiết kế bảng `coupons`.

---

### File 31: `31_them_voucher.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: THÊM VOUCHER MỚI`
- **Mục SRS tương ứng:** Mục 4.7 (`FR-VOU-01`), Mục 4.7.2 & Mục 7.2.2 (STT 31)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Sai cột dữ liệu khi lưu vào DB (Dòng 42):** Sơ đồ ghi `C -> DB: Lưu voucher mới vào CSDL (status = 'ACTIVE')`. Bảng `coupons` trong `schema.prisma` không có cột `status`; thay vào đó khởi tạo `usedCount = 0`, `discountType` (`'Percentage' | 'FixedAmount'`), `discountValue`, `minAmount`, `maxUsage`, `expiryDate`, `applicableMovieId`.
  2. **Lệch mã lỗi HTTP khi trùng mã voucher (Dòng 37):** Sơ đồ ghi `Báo 409 Conflict (Mã voucher đã tồn tại)`, trong khi code thực tế tại [`src/app/api/coupons/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/coupons/route.ts#L292-L298) ném `AppError(400, ..., 'COUPON_ALREADY_EXISTS')` (HTTP `400 Bad Request`).
  3. **Thiếu kiểm tra ràng buộc phần trăm (`discountValue <= 100` khi `discountType === 'Percentage'`) và kiểm tra sự tồn tại của phim áp dụng (`applicableMovieId` -> `404 MOVIE_NOT_FOUND`)** như trong code (dòng 255-286).
  4. **Tên Lifeline & API chưa cụ thể (Dòng 10-13, 23):** Chưa ghi `POST /api/coupons` và bước xác thực `verifyAdminRole()`.
- **Hướng sửa cụ thể:**
  - Chuẩn hóa Lifeline và ghi rõ `POST /api/coupons` kèm kiểm tra quyền `ADMIN`.
  - Bổ sung kiểm tra `discountType === 'Percentage' => discountValue <= 100` và kiểm tra `applicableMovieId` (nếu có).
  - Bỏ `(status = 'ACTIVE')` ở dòng 42, thay bằng `usedCount = 0, discountType, discountValue, minAmount, maxUsage, expiryDate, applicableMovieId`.

---

### File 32: `32_sua_voucher.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: CHỈNH SỬA VOUCHER`
- **Mục SRS tương ứng:** Mục 4.7 (`FR-VOU-01`), Mục 4.7.2 & Mục 7.2.2 (STT 32)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Thiếu các kiểm tra nghiệp vụ quan trọng trong code [`PUT /api/coupons/[id]`](file:///d:/cinema_project/cinema-app/src/app/api/coupons/[id]/route.ts#L224-L296):**
     - Kiểm tra trùng `code` nếu Admin đổi mã code (`code !== existingCoupon.code` -> `400 COUPON_ALREADY_EXISTS`).
     - Kiểm tra `newMaxUsage >= existingCoupon.usedCount` (không cho phép hạ số lượt dùng tối đa xuống thấp hơn số lượt đã sử dụng thực tế -> `400 INVALID_MAX_USAGE`).
     - Kiểm tra `discountValue <= 100` nếu `discountType === 'Percentage'`.
  2. **Tên Lifeline & API chưa cụ thể (Dòng 10-13, 18, 38):** Chưa ghi rõ `GET /api/coupons/{id}`, `PUT /api/coupons/{id}` và bước xác thực `verifyAdminRole()`.
- **Hướng sửa cụ thể:**
  - Chuẩn hóa Lifeline, bổ sung đường dẫn `GET /api/coupons/{id}` và `PUT /api/coupons/{id}` kèm `verifyAdminRole()`.
  - Ghi rõ các điều kiện kiểm tra dữ liệu tại dòng 40-46 (`maxUsage >= usedCount`, `discountValue <= 100` cho `Percentage`, kiểm tra trùng `code`).

---

### File 33: `33_ngung_su_dung_voucher.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: NGỪNG SỬ DỤNG VOUCHER`
- **Mục SRS tương ứng:** Mục 4.7, Mục 4.7.2 & Mục 7.2.2 (STT 33)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Lệch hoàn toàn cơ chế dữ liệu với `schema.prisma` và Code thực tế (Dòng 29-50):**
     - Sơ đồ vẽ luồng: Tra cứu trạng thái hiện tại của voucher -> Nếu đã ngừng sử dụng thì báo `400 Bad Request` -> Nếu đang `ACTIVE` thì cập nhật `status = 'INACTIVE'`.
     - Thực tế trong `schema.prisma` (dòng 193-214), bảng `coupons` **không có trường `status`**. Trong SRS Mục 4.7.2 (dòng 686), Mục 7.2.2 (dòng 2020) và code [`src/app/api/coupons/[id]/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/coupons/[id]/route.ts#L367-L412), thao tác thu hồi/xóa chiến dịch voucher được thực hiện qua endpoint **`DELETE /api/coupons/[id]`** (`prisma.coupon.delete({ where: { id: couponId } })`, trả về `404 COUPON_NOT_FOUND` nếu không tồn tại, hoặc `200 OK` khi xóa thành công).
  2. **Tên Lifeline chưa đồng bộ chuẩn SRS v2.0 (Dòng 10-13).**
- **Hướng sửa cụ thể:**
  - Cập nhật Lifeline theo chuẩn Next.js App Router & Docker PostgreSQL/Prisma.
  - Sửa luồng từ cập nhật `status = 'INACTIVE'` sang gọi `DELETE /api/coupons/{id}`: Xác thực `verifyAdminRole()` -> Kiểm tra tồn tại `prisma.coupon.findUnique` (nếu `null` trả về `404 Not Found`) -> Thực thi `prisma.coupon.delete({ where: { id: couponId } })` -> Trả về `200 OK`.

---

### File 34: `34_quan_ly_suat_chieu_tong_quan.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: QUẢN TRỊ LỊCH CHIẾU VÀ SUẤT CHIẾU (TỔNG QUAN)`
- **Mục SRS tương ứng:** Mục 4.8 (`FR-ADM-03`, `FR-ADM-04`), Mục 6.1 (`UC-15`, `UC-19`) & Mục 7.2.2 (STT 34)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Thiếu nhánh "Hủy / Đóng suất chiếu khẩn cấp do sự cố rạp (`FR-ADM-04`)" (Dòng 29-51):** Trong Bảng 7.2.2 của SRS (dòng 2021), file `34_quan_ly_suat_chieu_tong_quan.puml` được mô tả là *"Tuần tự Tổng quan phân hệ Quản lý lịch chiếu & Hủy suất chiếu khẩn cấp (`GET /api/admin/screenings`, `POST .../cancel`)"*. Tuy nhiên, trong nội dung file `34` hiện tại chỉ có 2 nhánh là `Tạo suất chiếu mới` và `Sửa suất chiếu`, hoàn toàn thiếu nhánh thứ 3 là `Xóa / Hủy suất chiếu khẩn cấp (DELETE /api/screenings/{id})`.
  2. **Tên Lifeline và API chưa cụ thể (Dòng 10-13, 18-25):** Chưa ghi rõ endpoint `GET /api/screenings?date=...&room_number=...&movie_id=...` và tên Lifeline chuẩn.
- **Hướng sửa cụ thể:**
  - Chuẩn hóa Lifeline (`Frontend Next.js`, `API Quản lý Suất chiếu (/api/screenings)`, `Docker PostgreSQL / Prisma`).
  - Bổ sung nhánh `else Quản trị viên chọn Xóa / Hủy suất chiếu khẩn cấp (FR-ADM-04, BR-04)` gọi `DELETE /api/screenings/{id}` (nếu chưa bán vé thì xóa vật lý kèm 50 ghế; nếu đã bán vé thì chuyển suất chiếu sang `ENDED`/`CANCELLED`, giải phóng ghế về `EMPTY` và chuyển các vé `Valid` sang `Cancelled` để hoàn tiền mặt 100%).

---

### File 35: `35_them_suat_chieu.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: THÊM MỚI SUẤT CHIẾU`
- **Mục SRS tương ứng:** Mục 4.8.1 (`FR-ADM-03`), Mục 4.8.2 (Luồng 4.8A), Quy tắc `BR-01`, `BR-08` & Mục 7.2.2 (STT 35)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Ghi sai mã Quy tắc nghiệp vụ `BR-09` thay vì `BR-08` (Dòng 33, 39):** Sơ đồ ghi `Thực hiện kiểm tra trùng lịch phòng chiếu & thời gian dọn dẹp (BR-09)`. Theo SRS Mục 7.1 (dòng 1948-1949) và Mục 7.2.2 (dòng 2022), quy tắc chống trùng lịch phòng chiếu + 15 phút dọn phòng là **`BR-08`** (còn `BR-09` là quy tắc bảo mật chữ ký QR HMAC-SHA256 và ZaloPay).
  2. **Lệch mã lỗi HTTP khi trùng lịch chiếu (Dòng 40):** Sơ đồ ghi `Báo 409 Conflict (Trùng lịch phòng chiếu hoặc thiếu giờ dọn dẹp)`, trong khi SRS Mục 4.8.2 (Nhánh 6a, dòng 786) và code thực tế [`POST /api/screenings`](file:///d:/cinema_project/cinema-app/src/app/api/screenings/route.ts#L200-L216) trả về **`400 Bad Request`**.
  3. **Thiếu bước kiểm tra sự tồn tại của bộ phim (`404 Not Found`) và công thức tính `endTime`:** Trong code (dòng 142-169) và SRS Luồng 4.8A (bước 4-5), hệ thống phải truy vấn `prisma.movie.findUnique` để lấy `movie.duration` (nếu không tìm thấy phim trả về `404`), sau đó tính `endTime = startTime + (movie.duration + 15) phút` rồi mới kiểm tra giao thoa `(existing.startTime < endTime) AND (existing.endTime > startTime)`.
  4. **Tên Lifeline & API chưa cụ thể (Dòng 10-13, 23):** Chưa ghi rõ `POST /api/screenings` và `requireAuth(['ADMIN'])`.
- **Hướng sửa cụ thể:**
  - Sửa mã quy tắc từ `BR-09` thành `BR-08` (và bổ sung `BR-01` cho bước tự động sinh 50 ghế `STANDARD` từ `A1` đến `E10` trong `prisma.$transaction`).
  - Bổ sung bước lấy `movie.duration` từ bảng `movies` để tính `endTime = startTime + movie.duration + 15 phút`.
  - Đồng bộ mã lỗi trùng lịch (`400 Bad Request` theo SRS 4.8.2 & code) và chuẩn hóa tên Lifeline.

---

### File 36: `36_kiem_tra_do_phu_hop_suat_chieu.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: KIỂM TRA ĐỘ PHÙ HỢP SUẤT CHIẾU`
- **Mục SRS tương ứng:** Mục 4.8 (`FR-ADM-03`), Quy tắc `BR-02`, `BR-08` & Mục 7.2.2 (STT 36)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Ghi sai mã Quy tắc nghiệp vụ `BR-09` thay vì `BR-08` (Dòng 27):** Tương tự file 35, dòng 27 ghi `Tính khoảng cách an toàn: Giờ kết thúc + 15 phút dọn dẹp (BR-09)` thay vì **`BR-08`**.
  2. **Thiếu kiểm tra/đồng bộ thông tin nhãn độ tuổi phim (`BR-02`) như mô tả tại Bảng 7.1 & 7.2.2 của SRS:** Tại Bảng 7.1 (dòng 1942) và Bảng 7.2.2 (dòng 2023), sơ đồ `36_kiem_tra_do_phu_hop_suat_chieu.puml` được gắn với cả `BR-02` và `BR-08` (*"Tuần tự Kiểm tra chống trùng lịch phòng chiếu & Ràng buộc độ tuổi"*), nhưng nội dung sơ đồ hiện mới chỉ kiểm tra thời lượng và trùng phòng chiếu, chưa đề cập đến việc lấy `movie.ageRating` (`P`, `C13`, `T18`) để thiết lập quy tắc bán vé (khóa vé Trẻ em nếu phim `T18`).
  3. **Tên Lifeline chưa đồng bộ chuẩn SRS v2.0 (Dòng 10-13).**
- **Hướng sửa cụ thể:**
  - Sửa `BR-09` thành `BR-08` tại dòng 27.
  - Tại bước 21-27, bổ sung truy vấn `duration, ageRating, status` từ bảng `movies`, kiểm tra phim đang hoạt động (`status != 'ENDED'`), kiểm tra nhãn độ tuổi `ageRating` (`BR-02`) và công thức chống trùng phòng `(existing.startTime < newEndTime) AND (existing.endTime > newStartTime)` (`BR-08`).
  - Chuẩn hóa tên Lifeline.

---

### File 37: `37_sua_suat_chieu.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: CHỈNH SỬA SUẤT CHIẾU`
- **Mục SRS tương ứng:** Mục 4.8.1 (`FR-ADM-03`), Mục 4.8.2 (Nhánh 6b), Quy tắc `BR-08` & Mục 7.2.2 (STT 37)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Ghi sai mã Quy tắc nghiệp vụ `BR-09` thay vì `BR-08` (Dòng 45):** Ghi `Kiểm tra xung đột phòng chiếu & thời gian dọn dẹp (BR-09)` thay vì **`BR-08`**.
  2. **Lệch điều kiện chặn sửa suất chiếu so với SRS Mục 4.8.2 và Code thực tế (Dòng 30-35):**
     - Sơ đồ vẽ: Kiểm tra `Đã có vé được đặt (tickets > 0)` -> Báo `400 Bad Request (Không thể sửa suất chiếu đã có khách mua vé)`.
     - Trong khi đó, SRS Mục 4.8.2 (Nhánh 6b, dòng 787-789) và code thực tế [`PUT /api/screenings/[id]`](file:///d:/cinema_project/cinema-app/src/app/api/screenings/[id]/route.ts#L145-L154) kiểm tra điều kiện: **`new Date(existingScreening.startTime) <= new Date()`** (Chỉ cho phép sửa nếu suất chiếu chưa bắt đầu; nếu đã bắt đầu hoặc kết thúc thì trả về `400 Bad Request`: *"Không thể cập nhật suất chiếu vì suất chiếu này đã bắt đầu hoặc đã kết thúc"*).
  3. **Lệch mã lỗi HTTP khi trùng lịch chiếu (Dòng 48):** Sơ đồ ghi `409 Conflict`, còn code `PUT /api/screenings/[id]` (dòng 265) trả về `400 Bad Request` (với điều kiện loại trừ chính suất chiếu đang sửa `id: { not: screeningId }`).
  4. **Tên Lifeline & API chưa cụ thể (Dòng 10-13, 18, 43):** Chưa ghi rõ `GET /api/screenings/{id}`, `PUT /api/screenings/{id}` và `requireAuth(['ADMIN'])`.
- **Hướng sửa cụ thể:**
  - Sửa `BR-09` thành `BR-08` tại dòng 45.
  - Cập nhật điều kiện chặn sửa suất chiếu tại dòng 30-35 để bao gồm kiểm tra `startTime <= NOW()` theo đúng SRS Mục 4.8.2 (Nhánh 6b) và code `PUT /api/screenings/[id]`.
  - Ghi rõ điều kiện kiểm tra trùng lịch loại trừ chính suất chiếu hiện tại (`id != screeningId`), đồng bộ mã lỗi HTTP và chuẩn hóa tên Lifeline.

---

### File 38: `38_bao_cao_doanh_thu_tai_chinh.puml`
- **Tên sơ đồ (Title):** `SƠ ĐỒ TUẦN TỰ: BÁO CÁO DOANH THU & ĐỐI SOÁT TÀI CHÍNH (REVENUE REPORTING & AUDITING)`
- **Mục SRS tương ứng:** Mục 4.9 (`FR-REP-01`..`03`, `BR-10`), Mục 6.1 (`UC-20`) & Mục 7.2.2 (STT 38)
- **Trạng thái:** ⚠️ Cần cập nhật
- **Chi tiết điểm lệch:**
  1. **Lệch tham số lọc và cấu trúc dữ liệu trả về giữa Sơ đồ với Code thực tế [`GET /api/admin/reports/revenue`](file:///d:/cinema_project/cinema-app/src/app/api/admin/reports/revenue/route.ts#L109-L288) và SRS Mục 4.9.2 (Dòng 22, 31-43):**
     - **Về kiểm tra `fromDate > toDate` (Dòng 31-33):** Sơ đồ vẽ nhánh `alt Khoảng thời gian lọc không hợp lệ (fromDate > toDate) -> 400 Bad Request`, nhưng trong code `src/app/api/admin/reports/revenue/route.ts` (dòng 119-141) và SRS Mục 4.9.2 không trả về lỗi 400 này (chỉ trả về mảng rỗng nếu không có suất chiếu thỏa mãn).
     - **Về tham số lọc `channel` (Dòng 19, 22):** Sơ đồ truyền `channel=...` vào `GET /api/admin/reports/revenue`, nhưng code thực tế chỉ nhận `from_date` (`fromDate`), `to_date` (`toDate`), `movie_id` (`movieId`), và `room_number` (`roomNumber` / `room`), không có tham số `channel`.
     - **Về truy vấn DB và cấu trúc JSON trả về (Dòng 35, 42):**
       + Sơ đồ ghi truy vấn cả `order_combos`, `refundStatus = 'PENDING_CASH_REFUND'`, `refundStatus = 'REFUNDED_CASH'` và trả về object `{ netTicketRevenue, comboRevenue, grossRevenue, pendingRefundAmount, actualRefundedAmount, fillRate, screenings: [...] }`.
       + Thực tế trong `schema.prisma`, bảng `tickets` không có cột vật lý `refundStatus` hay `refundAmount`, và route `GET /api/admin/reports/revenue` chỉ truy vấn `prisma.screening.findMany({ include: { movie, seats, tickets } })` rồi trả về mảng `ScreeningRevenueReportItem[]` (gồm `net_revenue`, `gross_revenue`, `refunded_amount`, `tickets_sold`, `cancelled_tickets`, `total_seats`, `empty_seats`, `fill_rate`), còn doanh thu combo (`combo_revenue`) nằm ở API `GET /api/admin/dashboard`.
  2. **Không đồng nhất tên đường dẫn API trong Bảng 7.1 & 7.2.2 của SRS:** Sơ đồ (dòng 22) và SRS Mục 4.9.2 ghi đúng `GET /api/admin/reports/revenue` (khớp với code thực tế), nhưng Bảng 7.1 (dòng 1950) và Bảng 7.2.2 (dòng 2025) lại ghi tắt là `GET /api/admin/reports`.
- **Hướng sửa cụ thể:**
  - Đồng bộ luồng truy vấn tại dòng 22-43 của `38_bao_cao_doanh_thu_tai_chinh.puml` với đặc tả **Mục 4.9.2 (Luồng 4.9A)** trong SRS: kết hợp gọi `GET /api/admin/dashboard` (lấy KPI tổng quan, `combo_revenue`, `top_movies`) và `GET /api/admin/reports/revenue?from_date=...&to_date=...&movie_id=...&room_number=...` (lấy báo cáo đối soát theo từng suất chiếu `ScreeningRevenueReportItem[]`).
  - Làm rõ việc bóc tách `refunded_amount` từ các vé `status == 'Cancelled'` (và phân loại `PENDING_CASH_REFUND` / `REFUNDED_CASH` qua thông tin hoàn tiền trong `cancellationReason` / đối soát tại quầy) để vừa khớp với `BR-10` trong SRS vừa phản ánh đúng schema thực tế.

---

## 3. KẾT LUẬN & KHUYẾN NGHỊ TỔNG THỂ CHO NHÓM SEQUENCE (PART 2: 20 -> 38)

1. **Về tính đồng bộ vật lý:** Cả 2 thư mục `d:/cinema_project/Sequence/` và `d:/cinema_project/cinema-app/Sequence/` đã đồng bộ tuyệt đối (19/19 file giống hệt nhau từng byte) và không còn sót từ khóa `VNPay` hay `Supabase`.
2. **Về sự đồng nhất kiến trúc (lifelines & endpoints):** Cần nâng cấp 17 file (`21` -> `37`) từ dạng sơ đồ khái niệm chung chung lên cùng chuẩn chi tiết kỹ thuật như file `20` và `38` (ghi rõ Lifeline `Frontend Next.js`, `Next.js App Router API`, `Docker PostgreSQL / Prisma`, đường dẫn REST API thực tế và bước kiểm tra quyền `ADMIN`).
3. **Về tính chính xác của Enum & Quy tắc nghiệp vụ (Business Rules):**
   - **Sửa ngay các Enum sai:** Thay `Movie.status = 'ACTIVE' / 'INACTIVE'` (ở file `21, 22, 24`) thành `'SHOWING' / 'UPCOMING' / 'ENDED'` (kèm `isDeleted = true` theo `BR-07`); bỏ `Coupon.status = 'ACTIVE' / 'INACTIVE'` (ở file `30, 31, 33`) vì bảng `coupons` không có cột `status` (dùng `DELETE /api/coupons/{id}` hoặc `expiryDate`/`maxUsage`).
   - **Sửa lỗi trích dẫn nhầm mã BR:** Ở các file `35, 36, 37`, đổi chú thích quy tắc chống trùng lịch phòng chiếu + 15 phút dọn dẹp từ `BR-09` về đúng **`BR-08`**.
   - **Bổ sung luồng thiếu:** Thêm nhánh Hủy suất chiếu khẩn cấp (`FR-ADM-04`) vào file `34`, và bổ sung logic kiểm tra suất chiếu đang hoạt động + xóa mềm (`BR-07`) vào file `24`.
