# BỘ SƠ ĐỒ TUẦN TỰ TOÀN DIỆN (38 SEQUENCE DIAGRAMS) - HỆ THỐNG LUMICINEMA

Tài liệu này tổng hợp và giải thích chi tiết **38 sơ đồ tuần tự (Sequence Diagrams)** chuẩn UML 2.5 cho Hệ thống Quản lý Bán vé và Vận hành Rạp phim LumiCinema. Bộ sơ đồ được quy hoạch khoa học, thống nhất 100% phong cách hiển thị **đơn sắc đen - trắng (`skinparam monochrome true`)**, đầy đủ thanh kích hoạt (`activate`/`deactivate`), và đối chiếu đồng bộ hoàn toàn với **Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)** cùng **Đặc tả Kỹ thuật (Tech Spec)**.

---

## 1. QUY ƯỚC THIẾT KẾ THỐNG NHẤT (UNIFIED DESIGN CONVENTIONS)

1. **Kiến trúc phân tầng chuẩn mực (Tiered Architecture):**
   - 👤 `Actor`: Tác nhân người dùng (`Khách hàng (Customer)`, `Nhân viên quầy (Staff)`, hoặc `Quản trị viên (Admin)`).
   - 💻 `Boundary`: Tầng giao diện (`Giao diện ... (Frontend Next.js)`).
   - ⚙️ `Control`: Tầng điều khiển máy chủ (`API / Controller (Next.js App Router)`).
   - 💼 `Service / Manager`: Tầng xử lý logic nghiệp vụ.
   - 🗄️ `Entity / Database`: Tầng cơ sở dữ liệu quan hệ (`PostgreSQL / Prisma ORM`).
   - 🔌 `External Participant` *(nếu có)*: `Cổng thanh toán VNPay / MoMo`, `Dịch vụ Email SMTP`, `Quỹ tiền mặt quầy`.
2. **Chuẩn hiển thị đồ họa học thuật:**
   - `hide footbox`: Ẩn thanh chân trang lặp lại.
   - `autonumber`: Đánh số thứ tự từng bước tương tác.
   - `skinparam style strictuml`: Chuẩn hóa nét vẽ UML.
   - `skinparam monochrome true`: Phong cách đơn sắc đen - trắng in ấn chuẩn mực, không bao giờ bị vỡ màu hay lem khi xuất sang tài liệu Word.

---

## 2. BẢNG MỤC LỤC & ĐỐI CHIẾU SRS (38 SƠ ĐỒ TUẦN TỰ)

### Nhóm 1: Xác thực & Quản lý phiên (Authentication & Session)
| STT | File PUML | Tên sơ đồ tuần tự | Tác nhân chính | Đáp ứng SRS / Tech Spec |
| :---: | :--- | :--- | :--- | :--- |
| **01** | [`01_dang_ky_tai_khoan.puml`](./01_dang_ky_tai_khoan.puml) | Đăng ký tài khoản khách hàng | Khách hàng | `FR-AUTH-01`, `FR-AUTH-04`, `NFR-SEC-01` |
| **02** | [`02_dang_nhap_he_thong.puml`](./02_dang_nhap_he_thong.puml) | Đăng nhập hệ thống & Phân quyền RBAC | Tất cả Actor | `FR-AUTH-02`, `FR-AUTH-03`, NextAuth JWT |
| **03** | [`03_dang_xuat_he_thong.puml`](./03_dang_xuat_he_thong.puml) | Đăng xuất hệ thống | Tất cả Actor | `FR-AUTH-02`, `NFR-INT-02` (Audit Trail) |

### Nhóm 2: Mua vé & Đặt combo trực tuyến (Online Booking & Payment)
| STT | File PUML | Tên sơ đồ tuần tự | Tác nhân chính | Đáp ứng SRS / Tech Spec |
| :---: | :--- | :--- | :--- | :--- |
| **04** | [`04_mua_ve_va_dat_combo_online_tong_quan.puml`](./04_mua_ve_va_dat_combo_online_tong_quan.puml) | Mua vé và đặt combo online (Tổng quan) | Khách hàng | `FR-BOK-01`, `FR-BOK-02`, `FR-BOK-03` |
| **05** | [`05_xem_phim_va_suat_chieu.puml`](./05_xem_phim_va_suat_chieu.puml) | Xem danh sách phim và chọn suất chiếu | Khách hàng | `FR-MOV-01`, `FR-SCH-01` |
| **06** | [`06_chon_ghe_va_giu_cho.puml`](./06_chon_ghe_va_giu_cho.puml) | Chọn ghế và giữ chỗ tạm thời (Seat Hold) | Khách hàng | `FR-BOK-02`, `BR-01` (Khóa giữ chỗ) |
| **07** | [`07_chon_loai_ve.puml`](./07_chon_loai_ve.puml) | Chọn loại vé và áp dụng bảng giá | Khách hàng | `FR-BOK-02`, `BR-02` (Độ tuổi & Phụ thu) |
| **08** | [`08_them_combo_vao_don_hang.puml`](./08_them_combo_vao_don_hang.puml) | Thêm combo bắp nước vào đơn hàng | Khách hàng | `FR-CMB-01`, `FR-BOK-03` |
| **09** | [`09_ap_dung_voucher.puml`](./09_ap_dung_voucher.puml) | Kiểm tra và áp dụng mã voucher khuyến mãi | Khách hàng | `FR-VOU-01`, `BR-07`, `BR-08` |
| **10** | [`10_thanh_toan_online.puml`](./10_thanh_toan_online.puml) | Xử lý thanh toán đơn hàng online | Khách hàng | `FR-PAY-01`, `FR-BOK-04` |
| **11** | [`11_thanh_toan_vnpay_momo.puml`](./11_thanh_toan_vnpay_momo.puml) | Thanh toán qua cổng VNPay / MoMo & IPN | Khách & VNPay | `FR-PAY-01`, `NFR-SEC-02` (Chữ ký số) |

### Nhóm 3: Nghiệp vụ Quầy & Soát vé (POS & Operations)
| STT | File PUML | Tên sơ đồ tuần tự | Tác nhân chính | Đáp ứng SRS / Tech Spec |
| :---: | :--- | :--- | :--- | :--- |
| **12** | [`12_ban_ve_tai_quay_pos.puml`](./12_ban_ve_tai_quay_pos.puml) | Bán vé xem phim trực tiếp tại quầy POS | Nhân viên quầy | `FR-POS-01`, `FR-BOK-02`, `BR-01`, `BR-02` |
| **13** | [`13_ban_combo_tai_quay_pos.puml`](./13_ban_combo_tai_quay_pos.puml) | Bán combo bắp nước trực tiếp tại quầy POS | Nhân viên quầy | `FR-POS-03`, `FR-CMB-01`, In hóa đơn lẻ |
| **14** | [`14_soat_ve_vao_rap.puml`](./14_soat_ve_vao_rap.puml) | Soát vé vào phòng chiếu bằng mã QR/Mã vé | Nhân viên soát vé | `FR-CHK-01`, `BR-04`, `NFR-SEC-02` |
| **15** | [`15_giao_nhan_combo_online.puml`](./15_giao_nhan_combo_online.puml) | Giao nhận combo đã đặt online tại quầy | Nhân viên quầy | `FR-CHK-02`, `BR-05` (Chặn nhận trùng) |
| **16** | [`16_tra_cuu_quan_ly_ve.puml`](./16_tra_cuu_quan_ly_ve.puml) | Tra cứu thông tin vé và lịch sử đặt vé | Nhân viên / Admin | `FR-STAFF-01`, `FR-ADM-01` |

### Nhóm 4: Hủy vé & Hoàn tiền (Ticket Cancellation & Refund)
| STT | File PUML | Tên sơ đồ tuần tự | Tác nhân chính | Đáp ứng SRS / Tech Spec |
| :---: | :--- | :--- | :--- | :--- |
| **17** | [`17_khach_huy_ve_nhan_voucher.puml`](./17_khach_huy_ve_nhan_voucher.puml) | Khách tự hủy vé online nhận voucher 50% | Khách hàng | `FR-CAN-01`, `FR-VOU-01`, `BR-03` |
| **18** | [`18_huy_ve_su_co_hoan_tien_mat.puml`](./18_huy_ve_su_co_hoan_tien_mat.puml) | Rạp hủy vé sự cố và hoàn tiền mặt 100% | Nhân viên & Admin | `FR-CAN-02`, `FR-CAN-03`, `BR-04`, `BR-10` |

### Nhóm 5: Đánh giá & Phản hồi phim (Movie Reviews)
| STT | File PUML | Tên sơ đồ tuần tự | Tác nhân chính | Đáp ứng SRS / Tech Spec |
| :---: | :--- | :--- | :--- | :--- |
| **19** | [`19_khach_danh_gia_phim.puml`](./19_khach_danh_gia_phim.puml) | Khách hàng gửi đánh giá và nhận xét phim | Khách hàng | `FR-REV-01`, `FR-REV-02`, `BR-06` |
| **20** | [`20_admin_quan_ly_danh_gia.puml`](./20_admin_quan_ly_danh_gia.puml) | Quản trị viên duyệt hoặc ẩn bình luận vi phạm | Quản trị viên | `FR-ADM-01`, `FR-REV-01`, `NFR-INT-02` |

### Nhóm 6: Quản trị Phim, Combo, Voucher, Suất chiếu (Admin Management)
| STT | File PUML | Tên sơ đồ tuần tự | Tác nhân chính | Đáp ứng SRS / Tech Spec |
| :---: | :--- | :--- | :--- | :--- |
| **21** | [`21_quan_ly_phim_tong_quan.puml`](./21_quan_ly_phim_tong_quan.puml) | Quản trị danh mục phim (Tổng quan) | Quản trị viên | `FR-ADM-01`, `FR-MOV-01` |
| **22** | [`22_them_phim.puml`](./22_them_phim.puml) | Thêm mới thông tin phim vào hệ thống | Quản trị viên | `FR-ADM-01`, `FR-MOV-02` |
| **23** | [`23_sua_phim.puml`](./23_sua_phim.puml) | Cập nhật thông tin chi tiết phim | Quản trị viên | `FR-ADM-01`, `FR-MOV-03` |
| **24** | [`24_ngung_chieu_phim.puml`](./24_ngung_chieu_phim.puml) | Ngừng chiếu phim trên toàn hệ thống | Quản trị viên | `FR-ADM-01`, `FR-MOV-04` |
| **25** | [`25_quan_ly_combo_tong_quan.puml`](./25_quan_ly_combo_tong_quan.puml) | Quản trị danh mục combo bắp nước (Tổng quan) | Quản trị viên | `FR-ADM-01`, `FR-CMB-01` |
| **26** | [`26_them_combo_moi.puml`](./26_them_combo_moi.puml) | Thêm mới combo bắp nước và cấu hình sản phẩm | Quản trị viên | `FR-ADM-01`, `FR-CMB-02` |
| **27** | [`27_sua_combo.puml`](./27_sua_combo.puml) | Cập nhật thông tin và đơn giá combo | Quản trị viên | `FR-ADM-01`, `FR-CMB-03` |
| **28** | [`28_ngung_ban_combo.puml`](./28_ngung_ban_combo.puml) | Ngừng bán combo bắp nước | Quản trị viên | `FR-ADM-01`, `FR-CMB-04` |
| **29** | [`29_cap_nhat_ton_kho_combo.puml`](./29_cap_nhat_ton_kho_combo.puml) | Cập nhật số lượng tồn kho nguyên vật liệu/combo | Quản trị viên | `FR-ADM-01`, `FR-CMB-05` |
| **30** | [`30_quan_ly_voucher_tong_quan.puml`](./30_quan_ly_voucher_tong_quan.puml) | Quản trị voucher khuyến mãi (Tổng quan) | Quản trị viên | `FR-ADM-01`, `FR-VOU-01` |
| **31** | [`31_them_voucher.puml`](./31_them_voucher.puml) | Thêm mới mã voucher và quy định điều kiện | Quản trị viên | `FR-ADM-01`, `FR-VOU-02` |
| **32** | [`32_sua_voucher.puml`](./32_sua_voucher.puml) | Cập nhật điều kiện và thời hạn voucher | Quản trị viên | `FR-ADM-01`, `FR-VOU-03` |
| **33** | [`33_ngung_su_dung_voucher.puml`](./33_ngung_su_dung_voucher.puml) | Tạm dừng hoặc thu hồi mã voucher trước hạn | Quản trị viên | `FR-ADM-01`, `FR-VOU-04` |
| **34** | [`34_quan_ly_suat_chieu_tong_quan.puml`](./34_quan_ly_suat_chieu_tong_quan.puml) | Quản trị lịch chiếu và suất chiếu (Tổng quan) | Quản trị viên | `FR-ADM-01`, `FR-SCH-01` |
| **35** | [`35_them_suat_chieu.puml`](./35_them_suat_chieu.puml) | Lên lịch tạo mới suất chiếu cho phim | Quản trị viên | `FR-ADM-01`, `FR-SCH-02` |
| **36** | [`36_kiem_tra_do_phu_hop_suat_chieu.puml`](./36_kiem_tra_do_phu_hop_suat_chieu.puml) | Kiểm tra xung đột phòng chiếu & dọn dẹp | Quản trị viên | `FR-SCH-03`, `BR-09` (Giờ dọn dẹp) |
| **37** | [`37_sua_suat_chieu.puml`](./37_sua_suat_chieu.puml) | Cập nhật phòng chiếu, khung giờ suất chiếu | Quản trị viên | `FR-ADM-01`, `FR-SCH-04` |

### Nhóm 7: Báo cáo Doanh thu & Đối soát (Reporting & Auditing)
| STT | File PUML | Tên sơ đồ tuần tự | Tác nhân chính | Đáp ứng SRS / Tech Spec |
| :---: | :--- | :--- | :--- | :--- |
| **38** | [`38_bao_cao_doanh_thu_tai_chinh.puml`](./38_bao_cao_doanh_thu_tai_chinh.puml) | Báo cáo doanh thu và đối soát tài chính | Quản trị viên | `FR-REP-01`, `FR-REP-02`, `BR-10` |

---

## 3. TÀI LIỆU WORD ĐÃ XUẤT BẢN

Toàn bộ 38 sơ đồ Sequence Diagram (kết hợp với 17 sơ đồ Activity Diagram) đã được biên dịch thành hình ảnh chất lượng cao và tích hợp vào các tài liệu Word:
- 📄 **File Master Đồ án (55 sơ đồ):** [`D:\cinema_project\PlantUML_Activity_Diagrams\Activity_Diagrams_LumiCinema.docx`](file:///d:/cinema_project/PlantUML_Activity_Diagrams/Activity_Diagrams_LumiCinema.docx)
- 📄 **File Tổng hợp sao lưu:** [`D:\cinema_project\Tong_Hop_So_Do_LumiCinema.docx`](file:///d:/cinema_project/Tong_Hop_So_Do_LumiCinema.docx)
- 📄 **File Sơ đồ tuần tự riêng biệt (38 sơ đồ):** [`D:\cinema_project\Sequence\Sequence_Diagrams_LumiCinema.docx`](file:///d:/cinema_project/Sequence/Sequence_Diagrams_LumiCinema.docx)

*Tất cả hình ảnh đều được khóa tỷ lệ $max\_h \le 22.0\text{ cm}$ và $max\_w \le 16.5\text{ cm}$, đảm bảo 100% hình hiển thị trọn vẹn trong 1 trang A4, không bao giờ bị cắt đáy hay tràn trang.*
