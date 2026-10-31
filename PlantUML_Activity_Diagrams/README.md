# BỘ SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAMS) - HỆ THỐNG LUMI CINEMA

Tài liệu này tổng hợp và giải thích 17 sơ đồ hoạt động (Activity Diagrams) chuẩn UML cho Hệ thống Quản lý Bán vé và Vận hành Rạp phim Lumi Cinema, được thiết kế theo đúng đặc tả yêu cầu phần mềm (**SRS**) và đặc tả kiến trúc kỹ thuật (**tech_spec.md**).

---

## 1. QUY ƯỚC THIẾT KẾ (DESIGN CONVENTIONS)

1. **Phân làn (Swimlanes / Partitions):** Các sơ đồ kỹ thuật (đăng nhập, đăng ký, đăng xuất, báo cáo) có 4 làn kiến trúc độc lập; các sơ đồ nghiệp vụ còn lại dùng làn theo người và bên tham gia. 4 làn kiến trúc gồm:
   - `Người dùng (Actor)`: Khách hàng (Customer), Nhân viên quầy (Staff), hoặc Quản trị viên (Admin).
   - `Giao diện (Frontend Next.js)`: Tầng Client Component, Validation, State Management và Toast Notification.
   - `Máy chủ xử lý (Backend API / NextAuth)`: Tầng API Route Handlers, CredentialsProvider, Zod Validation, Hash Bcrypt và Business Logic.
   - `Cơ sở dữ liệu (PostgreSQL)`: Tầng lưu trữ Prisma ORM, ACID Transactions và quan hệ bảng dữ liệu.

2. **Điểm rẽ nhánh điều kiện (Decision / Branching Node):**
   - Áp dụng cấu hình `skinparam conditionStyle insideDiamond`.
   - Nội dung câu hỏi điều kiện bên trong được tinh chỉnh siêu ngắn gọn (1 - 2 từ, ví dụ: `Hợp lệ?`, `Đã tồn tại?`, `Khớp pass?`, `Role?`, `Admin?`).
   - Kỹ thuật này giúp PlantUML **vẽ đúng 100% hình thoi chuẩn 4 đỉnh nhọn (Rhombus / Diamond)**, triệt tiêu hoàn toàn hiện tượng PlantUML tự động kéo giãn vát ngang đỉnh tạo thành hình lục giác (Hexagon).
   - Toàn bộ thông tin chi tiết điều kiện được đưa lên các nhãn nhánh rẽ (ví dụ: `[Hợp lệ: Email chuẩn RFC 5322, pass >= 6 ký tự]` / `[Không hợp lệ: Sai regex email, pass < 6 ký tự]`).

3. **Phong cách hiển thị (Styling):**
   - Thiết lập `skinparam monochrome true`.
   - Toàn bộ sơ đồ hiển thị đơn sắc (trắng - đen thuần túy), không tô màu nền cho phân làn hay các khối hoạt động, đáp ứng hoàn hảo tiêu chuẩn in ấn và nộp báo cáo học thuật.

---

## 2. DANH MỤC CÁC SƠ ĐỒ (DIAGRAM INDEX)

Tổng cộng **17 sơ đồ**, sắp xếp theo thứ tự phân hệ trong SRS. Số làn tùy theo sơ đồ: luồng kỹ thuật dùng 4 làn kiến trúc, luồng nghiệp vụ dùng làn theo người và bên tham gia.

| STT | Tên file | Chức năng | Làn | Yêu cầu liên quan |
| :---: | :--- | :--- | :--- | :--- |
| 1 | [`01_dang_nhap.puml`](./01_dang_nhap.puml) | Đăng nhập và phân quyền điều hướng | 4 làn kiến trúc | `FR-AUTH-02`, `FR-AUTH-03` |
| 2 | [`02_dang_ky.puml`](./02_dang_ky.puml) | Đăng ký tài khoản khách hàng | 4 làn kiến trúc | `FR-AUTH-01`, `FR-AUTH-04` |
| 3 | [`03_dang_xuat.puml`](./03_dang_xuat.puml) | Đăng xuất hệ thống | 4 làn kiến trúc | `FR-AUTH-02`, `NFR-INT-02` |
| 4 | [`04_danh_gia_phim.puml`](./04_danh_gia_phim.puml) | Đánh giá phim | Khách hàng, Admin, Hệ thống | `FR-REV-01/02/03`, `BR-06` |
| 5 | [`05_dat_ve_combo_online.puml`](./05_dat_ve_combo_online.puml) | Đặt vé và mua combo online (VNPay) | Khách hàng, Hệ thống, Cổng VNPay | `FR-BOK-01..05`, `FR-VOU-02/03` |
| 6 | [`06_ban_ve_tai_quay.puml`](./06_ban_ve_tai_quay.puml) | Bán vé tại quầy | Nhân viên, Hệ thống | `FR-POS-01/02/04` |
| 7 | [`07_ban_combo_tai_quay.puml`](./07_ban_combo_tai_quay.puml) | Bán combo tại quầy | Nhân viên, Hệ thống | `FR-POS-03/04` |
| 8 | [`08_soat_ve.puml`](./08_soat_ve.puml) | Soát vé vào rạp | Nhân viên, Hệ thống | `FR-CHK-01`, `BR-09` |
| 9 | [`09_giao_nhan_combo.puml`](./09_giao_nhan_combo.puml) | Giao nhận combo đã đặt online | Nhân viên, Hệ thống | `FR-CHK-02`, `BR-05` |
| 10 | [`10_khach_huy_ve.puml`](./10_khach_huy_ve.puml) | Khách hủy vé, cấp voucher 50% | Khách hàng, Nhân viên, Hệ thống | `FR-CAN-01`, `BR-03` |
| 11 | [`11_rap_huy_ve_hoan_tien.puml`](./11_rap_huy_ve_hoan_tien.puml) | Rạp hủy vé do sự cố, hoàn tiền mặt | Khách hàng, Nhân viên, Hệ thống | `FR-CAN-02/03`, `BR-04` |
| 12 | [`12_quan_ly_voucher.puml`](./12_quan_ly_voucher.puml) | Quản lý voucher khuyến mãi | Admin, Hệ thống | `FR-VOU-01/02` |
| 13 | [`13_quan_ly_phim.puml`](./13_quan_ly_phim.puml) | Quản lý danh mục phim | Admin, Hệ thống | `FR-ADM-01/02`, `BR-07` |
| 14 | [`14_quan_ly_suat_chieu.puml`](./14_quan_ly_suat_chieu.puml) | Lên lịch và quản lý suất chiếu | Admin, Hệ thống | `FR-ADM-03`, `BR-08` |
| 15 | [`15_huy_suat_chieu_khan_cap.puml`](./15_huy_suat_chieu_khan_cap.puml) | Hủy suất chiếu khẩn cấp do sự cố | Admin, Hệ thống | `FR-ADM-04`, `BR-04` |
| 16 | [`16_quan_ly_combo.puml`](./16_quan_ly_combo.puml) | Quản lý combo bắp nước | Admin, Hệ thống | tech_spec mục 4.5 (SRS không có FR riêng) |
| 17 | [`17_bao_cao_doanh_thu.puml`](./17_bao_cao_doanh_thu.puml) | Báo cáo doanh thu và đối soát tài chính | 4 làn kiến trúc | `FR-REP-01/02/03`, `BR-10` |

---
## 3. TÓM TẮT LUỒNG NGHIỆP VỤ CỐT LÕI

### 3.1. Đăng nhập (01_dang_nhap.puml)
- **Input:** Email + Mật khẩu.
- **Client Validation:** Không để trống, regex email hợp lệ.
- **Server Authentication:** NextAuth `CredentialsProvider` -> Prisma `findUnique` -> `bcryptjs.compare(password, hash)`.
- **Session:** Cấp JWT phiên 24h, HttpOnly Secure Cookie `next-auth.session-token`.
- **Phân quyền điều hướng (RBAC Routing):**
  - `ADMIN` -> `/admin/dashboard`.
  - `STAFF` -> `/staff`.
  - `CUSTOMER` -> `/` hoặc quay lại `callbackUrl` nếu đang dở phiên đặt vé/giữ ghế.

### 3.2. Đăng ký (02_dang_ky.puml)
- **Input:** Họ tên, Email, Mật khẩu, Xác nhận mật khẩu, Số điện thoại.
- **Client Validation:** Regex RFC 5322, Mật khẩu $\ge 6$ ký tự, khớp xác nhận mật khẩu.
- **Server Validation & Check:** Zod Schema -> Kiểm tra trùng email trong DB (Trả về `409 Conflict` nếu trùng).
- **Mã hóa:** `bcryptjs.hash(password, 12)` (Salt rounds = 12 theo NFR-SEC-01).
- **Lưu trữ:** Tạo bản ghi bảng `users` với role mặc định `CUSTOMER`.
- **Chuyển hướng:** Tự động điều hướng về `/login`.

### 3.3. Đăng xuất (03_dang_xuat.puml)
- **Trigger:** Người dùng bấm nút "Đăng xuất" trên Header.
- **Xác nhận:** Modal hộp thoại xác nhận.
- **Hủy phiên:** Gọi NextAuth `signOut()` -> Backend thu hồi JWT và xóa cookie `Max-Age=0`.
- **Ghi log:** Lưu Audit Trail (NFR-INT-02) sự kiện đăng xuất.
- **Dọn dẹp Client:** Xóa session state, `sessionStorage` (phiên giữ ghế), cập nhật Navbar về trạng thái khách vãng lai và chuyển về `/`.

### 3.4. Báo cáo doanh thu & Đối soát tài chính (17_bao_cao_doanh_thu.puml)
- **Phân quyền:** Bắt buộc `ADMIN` (`403 Forbidden` nếu truy cập trái phép).
- **Bộ lọc đa chiều (FR-REP-01):** Khoảng thời gian (Từ ngày - Đến ngày), Phim, Phòng chiếu (1-5), Kênh bán (Online vs POS).
- **Chuẩn kế toán Lumi (BR-10 & FR-REP-02):**
  - Doanh thu bán vé thực thu (Net Ticket Revenue: vé `Valid` và `Used`).
  - Doanh thu combo bắp nước (từ `order_combos`).
  - Tổng tiền công nợ chờ hoàn (Pending Refund: vé `Cancelled` có `refundStatus = PENDING_CASH_REFUND` do sự cố rạp).
  - Tổng tiền thực tế đã xuất quỹ chi trả tiền mặt cho khách (Actual Refunded: vé có `refundStatus = REFUNDED_CASH`).
  - Tỷ lệ lấp đầy phòng chiếu (Fill Rate % = Ghế bán / Tổng 50 ghế $\times 100$).
- **Không trừ 2 lần:** Tách bạch công nợ với tiền đã chi quỹ thực tế.
- **Hành động:** Xuất file bảng tính Excel/CSV hoặc đổi bộ lọc xem các phân khúc khác.

---

## 4. HƯỚNG DẪN KẾT XUẤT ẢNH PNG / SVG BẰNG PLANTUML

Bạn có thể mở và kết xuất ảnh sơ đồ theo 2 cách:

1. **Sử dụng VS Code Extension:**
   - Cài extension `PlantUML` của tác giả *jebbs*.
   - Mở file `.puml` và bấm phím tắt `Alt + D` để xem trước trực tiếp trên VS Code.
   - Bấm chuột phải chọn `Export Current Diagram` -> chọn `png` hoặc `svg`.

2. **Sử dụng dòng lệnh PlantUML CLI:**
   ```bash
   java -jar plantuml.jar PlantUML_Activity_Diagrams/*.puml -tpng
   ```

