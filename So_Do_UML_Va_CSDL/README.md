# 📊 Hệ Thống Sơ Đồ UML, CSDL (ERD/RDM) & Giao Diện — Lumi Cinema

Thư mục này tập hợp đầy đủ và chuẩn hóa toàn bộ sơ đồ phân tích thiết kế hệ thống **Lumi Cinema** (mỗi sơ đồ đều có đủ file mã nguồn PlantUML `.puml`, ảnh vector `.svg` và ảnh độ phân giải cao `.png`).

---

## 🗂️ Tổng Quan 7 Phân Khu Sơ Đồ

| Phân Khu | Thư Mục | Số Lượng | Mô Tả |
| :---: | :--- | :---: | :--- |
| **01** | [`01_UseCase_Diagrams/`](./01_UseCase_Diagrams/) | **10 sơ đồ** | Sơ đồ Use Case tổng quát & 9 sơ đồ phân rã theo từng phân hệ chức năng (kèm file `.drawio`). |
| **02** | [`02_Activity_Diagrams/`](./02_Activity_Diagrams/) | **17 sơ đồ** | Sơ đồ Hoạt động (Activity Diagram) chuẩn hóa 2 Swimlane (*Tác nhân* & *Hệ thống*). |
| **03** | [`03_Sequence_Diagrams/`](./03_Sequence_Diagrams/) | **38 sơ đồ** | Sơ đồ Tuần tự (Sequence Diagram) chi tiết hóa toàn bộ luồng tương tác UI ↔ Controller ↔ Service ↔ DB. |
| **04** | [`04_State_Diagrams/`](./04_State_Diagrams/) | **06 sơ đồ** | Sơ đồ Trạng thái (State Machine Diagram) thuần Việt cho 6 thực thể cốt lõi. |
| **05** | [`05_Class_Diagram/`](./05_Class_Diagram/) | **01 sơ đồ** | Sơ đồ Lớp tổng thể (Class Diagram) kèm tài liệu hướng dẫn bảo vệ. |
| **06** | [`06_Database_ERD_RDM/`](./06_Database_ERD_RDM/) | **02 sơ đồ** | Sơ đồ Thực thể Kết hợp (**ERD**) và Lược đồ Quan hệ CSDL (**RDM**). |
| **07** | [`07_Giao_Dien_He_Thong_UI/`](./07_Giao_Dien_He_Thong_UI/) | **13 ảnh** | Bộ ảnh chụp màn hình giao diện thực tế (1440×900) của cả 3 phân hệ Khách hàng, Nhân viên, Quản trị viên. |

---

## 1️⃣ Sơ Đồ Use Case ([`01_UseCase_Diagrams/`](./01_UseCase_Diagrams/))
1. `01_usecase_tong_quat` — Sơ đồ Use Case Tổng quát toàn hệ thống
2. `02_usecase_mua_ve_dat_combo_online` — Phân hệ Mua vé & Đặt combo trực tuyến
3. `03_usecase_quan_ly_ve_va_danh_gia` — Phân hệ Quản lý vé cá nhân & Đánh giá phim
4. `04_usecase_ban_ve_soat_ve_tai_quay` — Phân hệ Bán vé POS & Soát vé QR tại quầy
5. `05_usecase_huy_ve_va_boi_hoan` — Phân hệ Hủy vé & Bồi hoàn voucher/tiền mặt
6. `06_usecase_bao_cao_doanh_thu` — Phân hệ Thống kê & Báo cáo doanh thu
7. `07_usecase_quan_ly_phim` — Phân hệ Quản lý danh mục phim
8. `08_usecase_quan_ly_suat_chieu` — Phân hệ Lập lịch & Quản lý suất chiếu
9. `09_usecase_quan_ly_combo` — Phân hệ Quản lý combo bắp nước & Tồn kho
10. `10_usecase_quan_ly_voucher` — Phân hệ Quản lý mã giảm giá & Voucher

---

## 2️⃣ Sơ Đồ Hoạt Động — Activity ([`02_Activity_Diagrams/`](./02_Activity_Diagrams/))
- `01_dang_nhap` · `02_dang_ky` · `03_dang_xuat` · `04_danh_gia_phim`
- `05_dat_ve_combo_online` · `06_ban_ve_tai_quay` · `07_ban_combo_tai_quay` · `08_soat_ve` · `09_giao_nhan_combo`
- `10_khach_huy_ve` · `11_rap_huy_ve_hoan_tien` · `15_huy_suat_chieu_khan_cap`
- `12_quan_ly_voucher` · `13_quan_ly_phim` · `14_quan_ly_suat_chieu` · `16_quan_ly_combo` · `17_bao_cao_doanh_thu`

---

## 3️⃣ Sơ Đồ Tuần Tự — Sequence ([`03_Sequence_Diagrams/`](./03_Sequence_Diagrams/))
- **Xác thực (`01` – `03`):** Đăng ký, Đăng nhập, Đăng xuất
- **Đặt vé & Thanh toán Online (`04` – `11`):** Tổng quan đặt vé, Xem phim & suất chiếu, Chọn ghế & giữ chỗ 10 phút, Chọn loại vé, Thêm combo, Áp dụng voucher, Thanh toán Online, Cổng thanh toán ZaloPay/VNPay
- **Nghiệp vụ Quầy Nhân viên POS (`12` – `15`):** Bán vé POS, Bán lẻ combo POS, Soát vé QR vào rạp, Giao nhận combo online
- **Tra cứu, Hủy vé & Đánh giá (`16` – `20`):** Tra cứu vé, Khách hủy vé nhận voucher, Rạp hủy vé sự cố hoàn tiền, Khách đánh giá phim, Admin kiểm duyệt đánh giá
- **Quản trị Phim, Combo, Voucher, Suất chiếu & Doanh thu (`21` – `38`):** Đầy đủ các luồng Tổng quan, Thêm, Sửa, Ngừng phục vụ, Kiểm tra xung đột lịch chiếu và Báo cáo doanh thu tài chính

---

## 4️⃣ Sơ Đồ Trạng Thái — State Machine ([`04_State_Diagrams/`](./04_State_Diagrams/))
- `state_movie` (Trạng thái Phim) · `state_screening` (Trạng thái Suất chiếu) · `state_seat` (Trạng thái Ghế ngồi)
- `state_ticket` (Trạng thái Vé) · `state_payment` (Trạng thái Giao dịch Thanh toán) · `state_combo` (Trạng thái Combo bắp nước)

---

## 5️⃣ Sơ Đồ Lớp (`05_Class_Diagram/`) & 6️⃣ Cơ Sở Dữ Liệu (`06_Database_ERD_RDM/`)
- [`05_Class_Diagram/class_diagram_lumicinema.png`](./05_Class_Diagram/class_diagram_lumicinema.png) — Sơ đồ Lớp tổng thể toàn hệ thống
- [`06_Database_ERD_RDM/ERD_LumiCinema.png`](./06_Database_ERD_RDM/ERD_LumiCinema.png) — Sơ đồ Thực thể Kết hợp (ERD)
- [`06_Database_ERD_RDM/RDM_LumiCinema.png`](./06_Database_ERD_RDM/RDM_LumiCinema.png) — Lược đồ Quan hệ CSDL (RDM)
