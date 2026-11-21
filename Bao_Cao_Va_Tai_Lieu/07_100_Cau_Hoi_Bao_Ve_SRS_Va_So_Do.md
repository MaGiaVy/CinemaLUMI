# TỔNG HỢP 100 CÂU HỎI BẢO VỆ GIỮA KỲ: NGHIỆP VỤ HỆ THỐNG, SRS & HỆ THỐNG SƠ ĐỒ UML (LUMI CINEMA)

> **Tài liệu ôn tập và phản biện chuyên sâu dành cho Đợt Báo cáo Giữa kỳ (Midterm Defense / Progress Review)**  
> **Đặc thù giai đoạn Giữa kỳ:** Hội đồng Giảng viên **KHÔNG CHẤM CODE**, tập trung 100% vào:
> 1. Tính đúng đắn, chặt chẽ của **Tài liệu Đặc tả Yêu cầu Phần mềm (SRS IEEE 830)** và 10 Quy chế nghiệp vụ (`BR-01` -> `BR-10`).
> 2. Tính chuẩn mực, nhất quán của **Hệ thống 55 Sơ đồ UML**:
>    - **Sơ đồ Use Case** tổng quát và phân rã các phân hệ.
>    - **17 Sơ đồ Hoạt động (Activity Diagrams)** trong thư mục `PlantUML_Activity_Diagrams/`.
>    - **38 Sơ đồ Tuần tự (Sequence Diagrams)** trong thư mục `Sequence/`.
>    - **6 Sơ đồ Trạng thái (State Machine Diagrams)** trong thư mục `PlantUML_State_Diagrams/`.
>    - **Sơ đồ Thực thể Quan hệ (ERD - Entity Relationship Diagram)** và Ma trận truy xuất (Traceability Matrix).  
> **Trọng tâm ưu tiên:** Phân hệ **Báo cáo Doanh thu Admin & Đối soát Tài chính** (20 câu) và Phân hệ **Xác thực, Đăng nhập, Đăng ký, Đăng xuất & RBAC** (18 câu).

---

## BẢNG MA TRẬN 100 CÂU HỎI THEO PHÂN HỆ & SƠ ĐỒ ĐỐI CHIẾU

| STT | Phân hệ Nghiệp vụ | Số câu | Mức độ ưu tiên | Sơ đồ & Tài liệu đối chiếu chính |
| :---: | :--- | :---: | :---: | :--- |
| **Phần 1** | **Xác thực, Đăng ký, Đăng nhập, Đăng xuất & RBAC** | **18 câu** *(Câu 1 - 18)* | 🔴 Rất cao | Use Case tổng quát, Activity 01, 02, 03; Sequence 01, 02, 03; Thực thể `Users`, `FR-AUTH-01 -> 04` |
| **Phần 2** | **Báo cáo Doanh thu, Đối soát Tài chính & Dashboard Admin** | **20 câu** *(Câu 19 - 38)* | 🔴 Cao nhất | Use Case `UC_Report`; Activity 17; Sequence 38; ERD quan hệ `Tickets - Payments - OrderCombos`; `FR-REP-01 -> 03`, `BR-10` |
| **Phần 3** | **Đặt vé & Giữ ghế 10 phút Trực tuyến** | **12 câu** *(Câu 39 - 50)* | 🟡 Cao | Use Case `UC_BookOnline`; Activity 05; Sequence 04 -> 07; State `state_seat.puml`; `BR-01`, `BR-02`, `FR-BOK-01 -> 03`, `NFR-SAFE-01` |
| **Phần 4** | **Cổng thanh toán Trực tuyến VNPay** | **08 câu** *(Câu 51 - 58)* | 🟡 Cao | Sequence 10, 11; Activity 05; State `state_payment.puml`; Thực thể `Payments`; `FR-BOK-05`, `NFR-INT-01` (Idempotency) |
| **Phần 5** | **Bán vé & Bán Combo tại Quầy POS** | **08 câu** *(Câu 59 - 66)* | 🟢 Trung bình | Use Case `UC_POS`; Activity 06, 07; Sequence 12, 13; Khách vãng lai trên ERD; `FR-POS-01 -> 04` |
| **Phần 6** | **Soát vé (QR HMAC-SHA256) & Giao nhận Combo độc lập** | **08 câu** *(Câu 67 - 74)* | 🟡 Cao | Use Case `UC_CheckIn`, `UC_FulfillCombo`; Activity 08, 09; Sequence 14, 15; State `state_ticket.puml` (`Used`); `BR-05`, `BR-09`, `FR-CHK-01 -> 02` |
| **Phần 7** | **Hủy vé & Đền bù / Hoàn tiền mặt** | **10 câu** *(Câu 75 - 84)* | 🔴 Rất cao | Use Case `UC_CancelSelf`, `UC_StaffCancel`; Activity 10, 11; Sequence 17, 18; State `state_ticket.puml` (`Cancelled`, `RefundedCash`); `BR-03`, `BR-04`, `FR-CAN-01 -> 03` |
| **Phần 8** | **Quản lý Voucher & Chiến dịch Giảm giá** | **06 câu** *(Câu 85 - 90)* | 🟢 Trung bình | Use Case `UC_VoucherMgmt`; Activity 12; Sequence 09, 30 -> 33; Thực thể `Coupons`; `BR-07`, `FR-VOU-01 -> 03` |
| **Phần 9** | **Quản trị Phim & Điều phối Suất chiếu** | **06 câu** *(Câu 91 - 96)* | 🟢 Trung bình | Use Case `UC_MovieMgmt`, `UC_ScreeningMgmt`, `UC_CancelScreening`; Activity 13, 14, 15; Sequence 21 -> 24, 34 -> 37; State `state_movie`, `state_screening`; `BR-08`, `FR-ADM-01 -> 04` |
| **Phần 10** | **Đánh giá Phim & Quản lý Kho Combo** | **04 câu** *(Câu 97 - 100)* | 🟢 Trung bình | Use Case `UC_Review`, `UC_ComboMgmt`; Activity 04, 16; Sequence 19, 20, 25 -> 29; State `state_combo.puml`; Thực thể `Reviews`, `Combos`; `BR-06`, `FR-REV-01 -> 03` |
| **TỔNG** | **Toàn bộ hệ thống Lumi Cinema** | **100 CÂU** | - | **Bao phủ 100% yêu cầu bảo vệ báo cáo giữa kỳ** |

---

## PHẦN 1: PHÂN HỆ XÁC THỰC, ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT & PHÂN QUYỀN RBAC (18 CÂU)
*(Tập trung vào Sơ đồ Use Case tổng quát, Activity Diagrams 01, 02, 03; Sequence Diagrams 01, 02, 03; Thực thể Users trên ERD & Ràng buộc FR-AUTH-01 -> 04)*

---

### Câu 1: Trên Sơ đồ Use Case tổng quát (SRS Mục 6.1), tại sao Use Case "Đăng ký / Đăng nhập" lại được nối tới cả 3 Actor (Customer, Staff, Admin)? Nhân viên và Quản trị viên có màn hình đăng ký riêng không?
- **Trọng tâm soi lỗi của Giảng viên:** Kiểm tra tính nhất quán giữa ranh giới hệ thống (System Boundary), các tác nhân (Actors) và quy định nghiệp vụ về tạo tài khoản nội bộ trong SRS.
- **Câu trả lời chuẩn phản biện:**
  - **Lý do nối tới cả 3 Actor:**
    - Cả 3 tác nhân (`Customer`, `Staff`, `Admin`) đều là người dùng có định danh trong hệ thống và bắt buộc phải trải qua bước **Đăng nhập (Authentication)** để hệ thống xác định danh tính và cấp quyền truy cập RBAC tương ứng.
  - **Nhân viên và Admin có màn hình đăng ký riêng không?**
    - **HOÀN TOÀN KHÔNG CÓ FORM ĐĂNG KÝ**.
    - Theo quy chế đặc tả tại mục **FR-AUTH-04** của SRS: Chỉ có `Customer` mới được phép sử dụng form đăng ký công khai trên web. Tài khoản `Staff` và `Admin` là tài khoản nội bộ rạp, được seed sẵn trong CSDL ban đầu hoặc do Giám đốc rạp cấp trực tiếp, tuyệt đối không mở chức năng tự đăng ký để ngăn chặn việc người ngoài tự tạo tài khoản chiếm quyền điều hành rạp.

---

### Câu 2: Trong Sơ đồ Hoạt động Đăng nhập (`01_dang_nhap.puml`), hãy chỉ ra luồng xử lý khi người dùng nhập sai mật khẩu? Biểu tượng hình thoi (Decision Diamond) thể hiện điều kiện rẽ nhánh như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng đọc hiểu ký hiệu chuẩn UML của Activity Diagram (Decision Node, Guard Conditions, và luồng lặp / kết thúc sớm).
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `01_dang_nhap.puml`:**
    - Sau hành động *"Kiểm tra mật khẩu đã mã hóa"* tại làn (Swimlane) `Máy chủ xử lý (Backend API)`:
    - Xuất hiện hình thoi quyết định với điều kiện canh gác (Guard Condition): `if (Mật khẩu chính xác?)`.
  - **Luồng xử lý khi nhập sai mật khẩu (Nhánh `then (Không)`):**
    1. Máy chủ xử lý chuyển sang trạng thái: *"Sinh thông báo lỗi: Mật khẩu không chính xác"*.
    2. Chuyển tiếp sang làn `Giao diện (Frontend Next.js)`: *"Hiển thị Toast cảnh báo lỗi đăng nhập"*.
    3. Luồng hoạt động dẫn về làn `Người dùng`: Người dùng nhận thông báo lỗi, giữ nguyên giao diện đăng nhập để nhập lại mật khẩu, hoặc kết thúc luồng tại điểm kết thúc luồng (Flow Final Node).

---

### Câu 3: Trong Sơ đồ Tuần tự Đăng nhập (`02_dang_nhap_he_thong.puml`), tại sao lại có phân chia 4 đối tượng theo chuẩn BCE (Boundary, Control, Entity)? Đường truyền tin nhắn nét liền và nét đứt khác nhau ở điểm nào?
- **Trọng tâm soi lỗi của Giảng viên:** Kiến thức nền tảng về mẫu kiến trúc phân tích BCE (Boundary - Control - Entity pattern) trong UML 2.5 và quy ước vẽ Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa 4 đối tượng trong sơ đồ:**
    1. `Actor (Người dùng)`: Tác nhân thực tế tương tác với hệ thống.
    2. `Boundary (Giao diện Đăng nhập)`: Tầng biên giao tiếp, nơi thu nhận dữ liệu form và hiển thị kết quả cho người dùng.
    3. `Control (API / Controller NextAuth)`: Tầng điều khiển tiếp nhận request, điều phối logic kiểm tra và cấp phát JWT token.
    4. `Entity (Cơ sở dữ liệu PostgreSQL)`: Thực thể dữ liệu lưu trữ thông tin bảng `users`.
  - **Sự khác biệt giữa mũi tên nét liền và nét đứt:**
    - *Mũi tên nét liền đầu tam giác đặc (`->`):* Biểu diễn **Thông điệp đồng bộ (Synchronous Call)** - bên gửi gửi yêu cầu và tạm dừng chờ bên nhận phản hồi (Ví dụ: UI gọi sang API gửi thông tin đăng nhập).
    - *Mũi tên nét đứt (`-->`):* Biểu diễn **Thông điệp trả lời / Phản hồi (Return Message)** mang theo kết quả dữ liệu quay lại đối tượng gọi (Ví dụ: DB trả về kết quả tìm thấy user, API trả về mã JWT token cho UI).

---

### Câu 4: Trong Sơ đồ Hoạt động Đăng xuất (`03_dang_xuat.puml`), sau khi người dùng bấm "Đăng xuất", hệ thống thực hiện hủy phiên làm việc ở đâu (Client hay Server) và luồng điều hướng kết thúc tại trang nào?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ quy trình kết thúc phiên làm việc của người dùng trong tài liệu SRS và sơ đồ hoạt động.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `03_dang_xuat.puml`:**
    1. *Tại làn Người dùng:* Bấm nút "Đăng xuất" trên thanh điều hướng.
    2. *Tại làn Giao diện (Frontend):* Gửi yêu cầu đăng xuất tới máy chủ xác thực.
    3. *Tại làn Máy chủ xử lý:* Xóa bỏ Cookie phiên làm việc (`next-auth.session-token`), làm mất hiệu lực phiên JWT trên hệ thống.
    4. *Điều hướng kết thúc:* Giao diện cập nhật thanh trạng thái về dạng khách vãng lai (Guest Mode) và tự động điều hướng người dùng quay trở về **Trang chủ (`/`)** hoặc trang Đăng nhập (`/login`).

---

### Câu 5: Trong Sơ đồ Tuần tự Đăng xuất (`03_dang_xuat_he_thong.puml`), tại sao lại có bước ghi nhật ký kiểm toán (Audit Trail) trong Entity DB? SRS quy định yêu cầu này ở mục nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng liên kết giữa Yêu cầu phi chức năng trong SRS với từng bước cụ thể trong Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Căn cứ trong SRS:** Quy định tại **Mục 5.4 (NFR-INT-02: Nhật ký kiểm toán Audit Trail)**.
  - **Ý nghĩa nghiệp vụ:**
    - Đối với nhân viên thu ngân quầy (`STAFF`), hành động Đăng xuất gắn liền với thời điểm **kết thúc ca làm việc (End of Shift)**.
    - Bước lưu vết trong Database ghi nhận chính xác: `userId`, thời gian đăng xuất `logoutAt`, và địa chỉ IP. Dữ liệu này dùng để chốt sổ đối soát doanh thu tiền mặt mà nhân viên đã thu trong ca trực, phòng chống việc nhân viên bỏ ca sớm hoặc chối bỏ trách nhiệm khi két tiền bị thất thoát.

---

### Câu 6: Trên Sơ đồ Use Case tổng quát, sự khác nhau về quyền hạn giữa Actor Customer và Actor Staff là gì? Tại sao Customer không được nối tới Use Case "Bán vé tại quầy (POS)"?
- **Trọng tâm soi lỗi của Giảng viên:** Kiểm tra việc phân định ranh giới tác nhân (Actor Boundary) và mô hình phân quyền RBAC trong SRS Mục 2.3.
- **Câu trả lời chuẩn phản biện:**
  - **Sự khác biệt cốt lõi:**
    - `Customer`: Là người dùng đại chúng, chỉ tương tác với giao diện bên ngoài của rạp thông qua Website/Mobile. Quyền hạn giới hạn trong: xem lịch chiếu, đặt vé & mua combo online của chính mình, tự hủy vé trước 2h, đánh giá phim và quản lý voucher cá nhân.
    - `Staff`: Là nhân viên nội bộ của rạp, sử dụng máy trạm quầy POS (`Staff Portal`). Quyền hạn bao gồm: Bán vé và bán combo cho khách tại quầy, Soát vé vào cửa phòng chiếu (Check-in), Giao nhận combo bắp nước, và Tra cứu/xử lý hủy vé sự cố rạp.
  - **Tại sao Customer không được nối tới Use Case POS:**
    - POS (Point of Sale) là công cụ nội bộ yêu cầu thu tiền mặt, in hóa đơn nhiệt và quét mã vạch vật lý. Khách hàng không thể tự thao tác trên thiết bị thu ngân của rạp, do đó việc không nối Customer tới POS là hoàn toàn chuẩn xác theo nghiệp vụ rạp chiếu phim thực tế.

---

### Câu 7: Trong Sơ đồ Hoạt động Đăng ký tài khoản (`02_dang_ky.puml`), hệ thống kiểm tra trùng lặp email ở làn (Swimlane) nào? Nếu email đã tồn tại thì luồng quay lại bước nào?
- **Trọng tâm soi lỗi của Giảng viên:** Kiểm tra khả năng theo dõi luồng điều khiển (Control Flow) và phân tách trách nhiệm giữa Frontend và Database trong Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Làn kiểm tra trùng lặp email:**
    - Việc kiểm tra trùng lặp diễn ra tại **Làn Máy chủ xử lý (Backend API)** phối hợp với **Làn Cơ sở dữ liệu (PostgreSQL)** thông qua truy vấn tìm kiếm người dùng theo email.
  - **Xử lý khi email đã tồn tại (Nhánh `then (Có)`):**
    - Máy chủ sinh mã lỗi `HTTP 409 Conflict` kèm thông báo: *"Email này đã được đăng ký trong hệ thống"*.
    - Luồng điều khiển chuyển ngược lại làn `Giao diện (Frontend)` để tắt hiệu ứng Loading và bật cảnh báo lỗi màu đỏ ngay dưới ô nhập Email.
    - Luồng quay trở lại bước người dùng chỉnh sửa thông tin form đăng ký (không bắt người dùng phải nhập lại từ đầu họ tên hay mật khẩu).

---

### Câu 8: Trong bảng thực thể `Users` trên ERD (SRS Mục 6.5), trường `role` có các giá trị nào? Tại sao nhóm không tách thành một bảng `Roles` riêng biệt mà lại dùng thuộc tính ENUM?
- **Trọng tâm soi lỗi của Giảng viên:** Thiết kế cơ sở dữ liệu (Database Normalization vs Simplicity) và quyết định mô hình hóa quan hệ người dùng - vai trò.
- **Câu trả lời chuẩn phản biện:**
  - **Các giá trị của thuộc tính `role`:** Gồm 3 giá trị cố định: `CUSTOMER`, `STAFF`, `ADMIN`.
  - **Lý giải thiết kế không tách bảng `Roles` riêng:**
    1. *Số lượng vai trò cố định và hữu hạn:* Hệ thống quản lý rạp phim Lumi Cinema có quy mô rạp đơn lẻ (5 phòng chiếu), cấu trúc phân quyền đóng gói cố định 3 nhóm người dùng rõ ràng, không có nhu cầu tạo thêm vai trò tùy biến động trong thời gian chạy.
    2. *Tối ưu hóa hiệu năng truy vấn:* Việc dùng kiểu dữ liệu `ENUM` trong PostgreSQL giúp lưu trữ trực tiếp mã định danh vai trò vào bản ghi `users`, loại bỏ hoàn toàn một phép nối bảng (`JOIN users_roles JOIN roles`) trên mọi câu lệnh kiểm tra quyền. Điều này giúp các truy vấn xác thực diễn ra nhanh hơn và giảm tải cho CSDL.

---

### Câu 9: Trong Sơ đồ Tuần tự Đăng ký (`01_dang_ky_tai_khoan.puml`), mật khẩu người dùng trước khi lưu vào Entity DB được xử lý qua bước nào? Thuật toán băm Bcrypt salt round 12 được đặc tả ở yêu cầu phi chức năng (NFR) nào trong SRS?
- **Trọng tâm soi lỗi của Giảng viên:** Tính bảo mật thông tin tài khoản người dùng và đối chiếu với tài liệu SRS IEEE 830.
- **Câu trả lời chuẩn phản biện:**
  - **Bước xử lý mật khẩu trong sơ đồ:**
    - Tại thông điệp nội bộ (Self-message) của `Control (Auth Controller)`: Hệ thống thực hiện hàm băm mật khẩu một chiều: *"Mã hóa mật khẩu bằng thuật toán Bcrypt (salt round = 12)"*. Chuỗi băm ngẫu nhiên sau đó mới được truyền sang `Entity DB` để thực thi câu lệnh `INSERT`.
  - **Căn cứ trong SRS:** Quy định tại **Mục 5.3 (NFR-SEC-01: Yêu cầu mã hóa mật khẩu)**: *"Mật khẩu người dùng bắt buộc phải được băm bảo mật bằng thuật toán Bcrypt với số vòng muối tối thiểu là 12 trước khi ghi vào cơ sở dữ liệu. Tuyệt đối không lưu trữ mật khẩu dạng bản rõ (plain text)"*.

---

### Câu 10: Trên Sơ đồ Hoạt động Đăng nhập (`01_dang_nhap.puml`), nếu người dùng đăng nhập thành công với vai trò ADMIN thì luồng điều hướng rẽ về đâu, và nếu là STAFF thì rẽ về đâu?
- **Trọng tâm soi lỗi của Giảng viên:** Tính rẽ nhánh đa luồng theo vai trò (Role-based Dynamic Redirection) trong sơ đồ hoạt động nghiệp vụ.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `01_dang_nhap.puml`:**
    - Sau khi xác thực thông tin thành công và cấp JWT token:
    - Xuất hiện khối rẽ nhánh kiểm tra vai trò:
      1. Nếu `role == 'ADMIN'`: Luồng điều khiển chuyển hướng người dùng tới **Trang Bảng điều khiển Quản trị (`/admin/dashboard`)**.
      2. Nếu `role == 'STAFF'`: Luồng điều khiển chuyển hướng người dùng tới **Trang Bán vé quầy POS (`/staff/pos`)**.
      3. Nếu `role == 'CUSTOMER'`: Luồng điều khiển chuyển hướng người dùng quay trở lại **Trang chủ (`/`)** hoặc trang đặt vé mà khách đang xem dở trước đó.

---

### Câu 11: Trong SRS mục 4.1 (FR-AUTH-04), hệ thống quy định tài khoản Staff và Admin được tạo như thế nào? Tại sao trên sơ đồ Use Case lại không có Use Case "Đăng ký tài khoản Admin"?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ các nguyên tắc an ninh phần mềm về việc ngăn chặn lỗ hổng tự cấp quyền (Self-privilege Escalation).
- **Câu trả lời chuẩn phản biện:**
  - **Căn cứ SRS Mục 4.1 (FR-AUTH-04):** *"Tài khoản Nhân viên và Quản trị viên được khởi tạo sẵn trong cơ sở dữ liệu ban đầu (Database Seeding) hoặc do Quản trị viên tối cao cấp phát trực tiếp trong nội bộ, không mở form đăng ký công khai trên giao diện người dùng"*.
  - **Tại sao không có Use Case "Đăng ký Admin":**
    - Nếu đưa Use Case "Đăng ký Admin" lên sơ đồ Use Case, điều đó có nghĩa là bất kỳ ai truy cập hệ thống cũng nhìn thấy chức năng tự đăng ký làm Quản trị viên -> Vi phạm nghiêm trọng tiêu chuẩn bảo mật hệ thống thông tin. Vì vậy sơ đồ Use Case không được phép vẽ chức năng này.

---

### Câu 12: Trong Sơ đồ Tuần tự Đăng nhập (`02_dang_nhap_he_thong.puml`), thông điệp trả về số 13 chứa JWT token. Token này lưu những thông tin gì? Tại sao trên sơ đồ không truyền mật khẩu về phía Boundary?
- **Trọng tâm soi lỗi của Giảng viên:** Kiến thức về nguyên tắc an toàn dữ liệu trong thông điệp phản hồi (Response Payload Sanitization).
- **Câu trả lời chuẩn phản biện:**
  - **Thông tin lưu trong JWT Token:** Chỉ chứa các thông tin định danh tối thiểu không nhạy cảm: `id` (Mã người dùng), `email`, `name` (Họ và tên), và `role` (Vai trò).
  - **Tại sao không truyền mật khẩu về Boundary:**
    - Mật khẩu (kể cả mật khẩu đã băm Bcrypt) là bí mật cấp cao nhất của người dùng. Tầng Boundary (Trình duyệt) chỉ cần biết danh tính và quyền hạn để hiển thị menu phù hợp.
    - Nếu truyền mật khẩu về client, kẻ tấn công có thể nghe lén gói tin hoặc đọc bộ nhớ trình duyệt để lấy chuỗi băm và dùng các siêu máy tính dò tìm mật khẩu gốc.

---

### Câu 13: Trên ERD, quan hệ giữa bảng `Users` và bảng `Tickets` là 1-N. Một user có bắt buộc phải có vé không (bản số 0..* hay 1..*)? Ý nghĩa nghiệp vụ là gì?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng giải thích bản số quan hệ (Cardinality / Modality) trong Sơ đồ Thực thể Quan hệ (ERD).
- **Câu trả lời chuẩn phản biện:**
  - **Bản số quan hệ:** Bản số chính xác là **0..*** (Một người dùng có thể sở hữu từ 0 đến nhiều chiếc vé).
  - **Ý nghĩa nghiệp vụ:**
    - Khi một khách hàng vừa tạo tài khoản mới trên website Lumi Cinema, họ chưa thực hiện bất kỳ giao dịch đặt chỗ nào, số lượng vé liên kết với họ bằng 0. Nếu đặt bản số bắt buộc là `1..*`, hệ thống sẽ không thể tạo được tài khoản người dùng mới vì vi phạm ràng buộc toàn vẹn khóa ngoại (bắt buộc phải có vé trước khi có tài khoản).
    - Ngược lại, một chiếc vé trong bảng `Tickets` luôn luôn thuộc về một người dùng duy nhất (Bản số `1..1`).

---

### Câu 14: Trong Sơ đồ Hoạt động Đăng nhập, nếu người dùng cố tình truy cập vào trang Admin khi chưa đăng nhập, luồng hoạt động bắt giữ và chuyển hướng ra sao?
- **Trọng tâm soi lỗi của Giảng viên:** Cơ chế bảo vệ đường dẫn (Route Guarding / Middleware Protection) thể hiện trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `01_dang_nhap.puml` và `17_bao_cao_doanh_thu.puml`:**
    1. Khi người dùng gửi yêu cầu truy cập URL `/admin/*`:
    2. Tầng lọc bảo vệ (Middleware) kiểm tra trạng thái đăng nhập.
    3. Nhận thấy chưa có phiên làm việc (`isAuthenticated == false`):
       - Hệ thống tự động chặn luồng, ghi nhận tham số `callbackUrl = /admin/*`.
       - Lập tức điều hướng người dùng về trang `/login`.
    4. Sau khi người dùng đăng nhập bằng tài khoản có quyền `ADMIN` thành công, hệ thống dựa vào `callbackUrl` để tự động trả người dùng về đúng trang quản trị ban đầu.

---

### Câu 15: Tại sao trong Sơ đồ Tuần tự Đăng ký tài khoản (`01_dang_ky_tai_khoan.puml`), bước kiểm tra định dạng email và mật khẩu lại diễn ra tại tầng Boundary trước khi gửi sang Control?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ nguyên lý giảm tải cho máy chủ (Client-side Pre-validation) trong sơ đồ tuần tự.
- **Câu trả lời chuẩn phản biện:**
  - **Mục đích của việc kiểm tra tại Boundary (Giao diện):**
    - Kiểm tra xem người dùng có gõ thiếu ký tự `@`, để trống họ tên hoặc nhập mật khẩu ngắn hơn 6 ký tự hay không.
    - *Lợi ích:* Giúp phản hồi ngay lập tức cho người dùng trong vòng 0 giây mà không cần gửi gói tin qua mạng Internet, giúp giảm thiểu các request rác gửi lên máy chủ API Server, tối ưu băng thông và tài nguyên cho rạp.
  - Tuy nhiên, sau bước này, khi request sang `Control`, tầng Control vẫn kiểm tra lại một lần nữa (Server-side validation) để đảm bảo an toàn tuyệt đối.

---

### Câu 16: Trong SRS mục 2.3, bảng mô tả các nhóm người dùng (User Classes), tại sao lại phân chia 3 vai trò Customer, Staff, Admin? Nhân viên quầy có quyền truy cập vào cấu hình bảng giá vé không?
- **Trọng tâm soi lỗi của Giảng viên:** Tính phân quyền nhiệm sở (Separation of Duty) và quản trị rủi ro vận hành rạp.
- **Câu trả lời chuẩn phản biện:**
  - **Lý do phân chia 3 nhóm người dùng:**
    - Đảm bảo tính chuyên môn hóa và kiểm soát rủi ro: Khách hàng chỉ quan tâm đến trải nghiệm xem phim; Nhân viên tập trung vào thao tác nghiệp vụ tại quầy nhanh chóng; Quản trị viên chịu trách nhiệm về chiến lược giá, lịch chiếu và an toàn tài chính.
  - **Nhân viên quầy có được sửa giá vé không?**
    - **TUYỆT ĐỐI KHÔNG**.
    - Theo quy chế SRS: Bảng giá vé (`pricing`), các khoản phụ thu cuối tuần/lễ và giá bán combo thuộc thẩm quyền duy nhất của `ADMIN` (Use Case `UC_Pricing`). Nhân viên quầy chỉ có quyền áp dụng bảng giá đã cấu hình sẵn để thu tiền của khách, không có quyền can thiệp vào đơn giá nhằm triệt tiêu nguy cơ tiêu cực, tự ý giảm giá để trục lợi cá nhân.

---

### Câu 17: Khách hàng vãng lai mua vé tại quầy POS không có tài khoản thì trên ERD liên kết khóa ngoại `user_id` trong bảng `Tickets` được xử lý như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Xử lý bài toán Khách vãng lai (Anonymous / Walk-in Customer) trong thiết kế lược đồ thực thể quan hệ ERD.
- **Câu trả lời chuẩn phản biện:**
  - **Giải pháp trên ERD (SRS Mục 6.5):**
    - Trong bảng `Tickets`, cột `user_id` có ràng buộc khóa ngoại tham chiếu tới `Users(id)`.
    - Để không vi phạm tính toàn vẹn tham chiếu (Referential Integrity): Hệ thống thiết kế một bản ghi người dùng hệ thống mặc định đại diện cho khách vãng lai (Ví dụ: `id = 999999`, `name = "Khách vãng lai POS"`, `role = CUSTOMER`).
    - Khi nhân viên bán vé cho khách không có tài khoản và không muốn đăng ký thành viên, hệ thống tự động gán `user_id` này vào chiếc vé. Vé giấy in ra vẫn có đầy đủ thông tin phòng chiếu và mã QR để khách vào rạp bình thường.

---

### Câu 18: Nếu tài khoản người dùng bị khóa hoặc đổi quyền, sự không đồng bộ giữa Token phiên làm việc và CSDL được phản ánh thế nào trong các sơ đồ hoạt động và tuần tự?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ giới hạn của JWT vô trạng thái và cách các sơ đồ UML thể hiện bước kiểm tra cơ sở dữ liệu thời gian thực.
- **Câu trả lời chuẩn phản biện:**
  - **Phản ánh trên Sơ đồ Tuần tự:**
    - Trong các sơ đồ nghiệp vụ quan trọng (như Sequence 38: Xem báo cáo tài chính, Sequence 18: Hủy vé sự cố hoàn tiền mặt):
    - Sau bước nhận Token từ Boundary, đối tượng `Control (API)` luôn có một thông điệp đồng bộ gửi sang `Entity DB`: *"Truy vấn kiểm tra trạng thái và vai trò tài khoản thời gian thực"*.
    - Nếu DB phản hồi tài khoản đã bị khóa hoặc vai trò không còn là ADMIN/STAFF, sơ đồ rẽ nhánh vào khối `alt (Không hợp lệ)`: Trả về mã lỗi `403 Forbidden` và kết thúc luồng ngay lập tức.
  - Sơ đồ thể hiện rõ nguyên tắc: Không phụ thuộc hoàn toàn vào token tĩnh mà luôn đối chiếu trạng thái sống trong CSDL tại các điểm chốt nhạy cảm.

---

## PHẦN 2: PHÂN HỆ BÁO CÁO DOANH THU, ĐỐI SOÁT TÀI CHÍNH & DASHBOARD ADMIN (20 CÂU)
*(Tập trung vào Sơ đồ Use Case UC_Report; Activity Diagram 17; Sequence Diagram 38; Lược đồ ERD Tickets - Payments - OrderCombos; Quy chế BR-10 & Yêu cầu FR-REP-01 -> 03)*

---

### Câu 19: Trên Sơ đồ Use Case tổng quát (SRS Mục 6.1), Use Case "Xem báo cáo doanh thu & Đối soát tài chính" chỉ được nối tới duy nhất Actor Admin. Tại sao Staff không được xem báo cáo doanh thu toàn rạp?
- **Trọng tâm soi lỗi của Giảng viên:** Tính bảo mật thông tin kinh doanh chiến lược và nguyên tắc phân quyền đặc quyền tối thiểu (Principle of Least Privilege).
- **Câu trả lời chuẩn phản biện:**
  - **Căn cứ trên Sơ đồ Use Case (SRS Mục 6.1):**
    - Đường liên kết tác nhân chỉ đi từ `Quản trị viên (Admin)` tới Use Case `UC_Report`.
  - **Lý giải nghiệp vụ:**
    - Báo cáo doanh thu toàn rạp chứa các số liệu tài chính sống còn: Doanh thu thực thu theo tháng/năm, doanh thu từng bộ phim bom tấn, chi phí đền bù bồi hoàn và biên lợi nhuận của rạp. Đây là dữ liệu chiến lược nội bộ của Ban Giám đốc và bộ phận Kế toán trưởng.
    - Nhân viên quầy (`STAFF`) là lao động thời vụ hoặc nhân viên trực quầy theo ca, chỉ có trách nhiệm đối soát két tiền mặt trong phạm vi ca trực của chính mình, không có thẩm quyền nắm bắt toàn bộ bức tranh tài chính kinh doanh của rạp nhằm phòng ngừa rủi ro rò rỉ bí mật thương mại sang các cụm rạp đối thủ.

---

### Câu 20: Trong Sơ đồ Hoạt động Báo cáo Doanh thu (`17_bao_cao_doanh_thu.puml`), hãy phân tích luồng xử lý của khối rẽ nhánh "Bộ lọc hợp lệ?". Trường hợp ngày bắt đầu lớn hơn ngày kết thúc (`fromDate > toDate`) được xử lý như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng bắt lỗi điều kiện biên (Boundary Condition Validation) và thể hiện luồng ngoại lệ (Exception Flow) trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `17_bao_cao_doanh_thu.puml`:**
    - Tại làn `Máy chủ xử lý (Backend API / NextAuth)`, sau khi tiếp nhận Query Parameters từ Frontend, hệ thống thực hiện kiểm tra tính hợp lệ của khoảng thời gian lọc:
  - **Luồng xử lý khi `fromDate > toDate` (Nhánh `Không`):**
    1. Máy chủ sinh mã lỗi `HTTP 400 Bad Request` kèm thông báo: *"Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc"*.
    2. Chuyển sang làn `Giao diện (Frontend Next.js)`: Tắt biểu tượng xoay Loading và kích hoạt cửa sổ Toast thông báo lỗi màu đỏ.
    3. Chuyển sang làn `Người dùng (Admin)`: Giữ nguyên các bộ lọc đã chọn, cho phép Admin chỉnh lại ngày trên lịch mà không làm mất các lựa chọn phim hay phòng chiếu trước đó, sau đó dừng luồng (Flow Final).

---

### Câu 21: Trong Sơ đồ Tuần tự 38 (`38_bao_cao_doanh_thu_tai_chinh.puml`), bước số 35 thực hiện "Truy vấn cơ sở dữ liệu song song (Parallel Database Query)". Hãy liệt kê 5 chỉ số tài chính được truy vấn từ Entity DB theo quy định của SRS (FR-REP-02)?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng kết nối giữa Yêu cầu chức năng báo cáo trong SRS và luồng thông điệp truy vấn trong Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **5 chỉ số tài chính cốt lõi theo bước 35 của Sequence Diagram 38 & FR-REP-02:**
    1. **Doanh thu vé thực thu (Net Ticket Revenue):** `SUM(price)` của tất cả các vé có `status IN ('Valid', 'Used')` trong khoảng thời gian lọc.
    2. **Doanh thu bắp nước (Combo Revenue):** `SUM(price * quantity)` từ bảng `order_combos` thuộc các đơn hàng thanh toán thành công.
    3. **Tổng tiền công nợ chờ hoàn (Pending Refund Amount):** `SUM(refundAmount)` của các vé có `refundStatus = 'PENDING_CASH_REFUND'` (do sự cố rạp nhưng khách chưa đến nhận tiền mặt).
    4. **Tổng tiền thực tế đã xuất quỹ hoàn trả (Actual Refunded Amount):** `SUM(refundAmount)` của các vé có `refundStatus = 'REFUNDED_CASH'` (nhân viên quầy đã xuất tiền mặt trao cho khách).
    5. **Tỷ lệ lấp đầy phòng chiếu trung bình (Fill Rate %):** Tỷ lệ giữa tổng số ghế đã bán thành công trên tổng sức chứa 50 ghế của mỗi phòng chiếu.

---

### Câu 22: Trong Sơ đồ Tuần tự 38, bước số 40 ghi chú "Chuẩn hóa số liệu kế toán (BR-10)". Quy tắc BR-10 trong SRS quy định thế nào về việc không ghi giảm doanh thu hai lần cho cùng một vé bị hủy?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ nguyên tắc toàn vẹn kế toán (Double-deduction Prevention) và quy chế nghiệp vụ số 10 trong SRS.
- **Câu trả lời chuẩn phản biện:**
  - **Nội dung quy chế BR-10 (SRS Mục 7):**
    - Khi một chiếc vé bị hủy do sự cố rạp, hệ thống ghi nhận vé vào trạng thái công nợ `PENDING_CASH_REFUND` và trừ vé đó ra khỏi Doanh thu thực thu (`Net Revenue`).
    - Khi khách hàng đến quầy và nhân viên bấm "Xác nhận đã trả tiền mặt", hệ thống chỉ chuyển trạng thái công nợ từ `PENDING_CASH_REFUND` sang `REFUNDED_CASH` và ghi giảm sổ quỹ tiền mặt tại quầy.
    - **Ràng buộc:** Thao tác trả tiền mặt **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP TRỪ LẦN THỨ HAI VÀO DOANH THU THỰC THU NỮA**. Nếu trừ thêm một lần nữa, doanh thu rạp sẽ bị ghi giảm kép (Double Deduction), gây thất thoát số liệu kế toán trên báo cáo tài chính. Bước 40 trên Sequence Diagram 38 chính là bước máy chủ áp dụng thuật toán chuẩn hóa này.

---

### Câu 23: Trên ERD (SRS Mục 6.5), để tính được Doanh thu thực thu (Net Ticket Revenue) và Tiền hoàn (Refunded Amount), hệ thống phải đọc những trường nào trong bảng `Tickets` và bảng `Payments`?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng đọc hiểu chi tiết cấu trúc thuộc tính thực thể trong Sơ đồ Thực thể Quan hệ (ERD).
- **Câu trả lời chuẩn phản biện:**
  - **Các trường cần đọc trong bảng `Tickets`:**
    - `price` (Decimal): Đơn giá thực trả của từng chiếc vé lẻ sau khi đã phân bổ chiết khấu voucher.
    - `status` (Enum: `Valid`, `Used`, `Cancelled`): Trạng thái chiếc vé (Vé hợp lệ, đã soát vào rạp, hay đã hủy).
    - `refundStatus` (Enum: `NONE`, `PENDING_CASH_REFUND`, `REFUNDED_CASH`): Trạng thái giải quyết bồi hoàn tiền mặt.
    - `refundAmount` (Decimal): Số tiền chính xác cần hoàn lại cho khách hàng.
  - **Các trường cần đọc trong bảng `Payments`:**
    - `status` (Enum: `Pending`, `Success`, `Failed`, `Refunded`): Bắt buộc `status == Success` để khẳng định đơn hàng đã được cổng thanh toán hoặc quầy thu ngân xác nhận thu tiền thành công.
    - `createdAt` (DateTime): Mốc thời gian giao dịch phát sinh để đối chiếu với bộ lọc từ ngày - đến ngày.

---

### Câu 24: Trong Sơ đồ Hoạt động 17, tại sao ở làn CSDL lại có hành động "Truy vấn tỷ lệ lấp đầy ghế theo suất chiếu"? Tỷ lệ này được tính toán dựa trên những thực thể nào trong ERD?
- **Trọng tâm soi lỗi của Giảng viên:** Mối liên kết giữa các bảng trong cơ sở dữ liệu quan hệ phục vụ tính toán các chỉ số kinh doanh.
- **Câu trả lời chuẩn phản biện:**
  - **Mục đích của việc tính tỷ lệ lấp đầy:** Giúp Admin đánh giá mức độ hấp dẫn của từng bộ phim và hiệu quả sử dụng công suất phòng chiếu (50 ghế/phòng) để lên kế hoạch tăng hoặc giảm số suất chiếu.
  - **Các thực thể ERD tham gia tính toán:**
    1. Thực thể `Screenings` (Suất chiếu): Cung cấp mã suất chiếu và liên kết với phòng chiếu.
    2. Thực thể `Seats` (Ghế ngồi): Đếm tổng số ghế vật lý thuộc suất chiếu đó (`COUNT(seats)` = 50 ghế).
    3. Thực thể `Tickets` (Vé xem phim): Đếm số lượng vé đã bán có `status IN ('Valid', 'Used')`.
  - **Công thức tích hợp:**
    $$	ext{Fill Rate (\%)} = \left(rac{	ext{Tickets(Valid + Used)}}{	ext{Total Seats}}
ight) 	imes 100$$

---

### Câu 25: Trong Sơ đồ Tuần tự 38, khối `alt (Không có dữ liệu giao dịch phát sinh trong kỳ)` và `else (Có dữ liệu)` thể hiện trải nghiệm giao diện người dùng như thế nào khi Admin chọn khoảng ngày rỗng?
- **Trọng tâm soi lỗi của Giảng viên:** Cách thể hiện kịch bản biên không có dữ liệu (Empty State UX) trên Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Khối `alt (Không có dữ liệu)`:**
    - Khi Admin chọn một khoảng thời gian trong quá khứ chưa mở bán vé hoặc một ngày trong tương lai chưa có ai đặt:
    - Máy chủ trả về mảng rỗng `[]` kèm HTTP 200 OK.
    - Boundary UI không để trang web trắng trơn hoặc bị vỡ layout, mà hiển thị trạng thái rỗng đồ họa (Empty State Illustration): *"Không có giao dịch nào phát sinh trong khoảng thời gian đã chọn. Vui lòng thử lại với bộ lọc khác!"*.
  - **Khối `else (Có dữ liệu)`:**
    - Boundary UI kích hoạt render đầy đủ: 4 thẻ KPI tài chính lớn ở đầu trang, biểu đồ đường biểu diễn xu hướng doanh thu qua từng ngày, và bảng dữ liệu thống kê chi tiết từng suất chiếu.

---

### Câu 26: Trong Sơ đồ Tuần tự 38, khối `opt (Quản trị viên xuất file báo cáo)` biểu diễn tính năng gì? Tại sao tính năng này dùng khối `opt` (Optional) mà không dùng khối `alt` (Alternative)?
- **Trọng tâm soi lỗi của Giảng viên:** Phân biệt chính xác giữa 2 cấu trúc điều khiển cơ bản trong UML Sequence Diagram: `opt` (Tùy chọn) và `alt` (Rẽ nhánh loại trừ).
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa tính năng:** Biểu diễn chức năng Quản trị viên tải tệp báo cáo tài chính định dạng Excel (`.xlsx`) hoặc CSV (`.csv`) về máy tính để lưu trữ hoặc gửi cho cơ quan thuế.
  - **Tại sao dùng `opt` mà không dùng `alt`:**
    - Khối `alt` (Alternative) đại diện cho mệnh đề `if-else` (chỉ được xảy ra MỘT TRONG HAI nhánh loại trừ nhau).
    - Khối `opt` (Option) đại diện cho một hành vi **tùy chọn (Optional Step)** - chỉ xảy ra khi người dùng có nhu cầu nhấn nút. Quản trị viên vào xem báo cáo có thể chỉ xem trên màn hình rồi tắt đi, hoặc có thể tùy ý bấm nút "Xuất file". Thao tác xuất file không loại trừ việc xem báo cáo, do đó dùng khối `opt` là hoàn toàn chính xác theo chuẩn UML 2.5.

---

### Câu 27: Trên ERD, bảng `OrderCombos` liên kết với bảng `Payments` qua khóa ngoại `payment_id`. Tại sao trong Sơ đồ Tuần tự 38, doanh thu combo lại được tính từ `OrderCombos` mà không lấy trực tiếp từ `Payments`?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ tính chuẩn hóa dữ liệu (Database Normalization) và mục đích phân rã hóa đơn chi tiết trên ERD.
- **Câu trả lời chuẩn phản biện:**
  - **Lý do thiết kế:**
    - Bảng `Payments` chỉ lưu tổng số tiền thanh toán của cả đơn hàng (`amount`). Trong một đơn hàng có thể bao gồm: Tiền 3 vé phim + Tiền 2 combo bắp nước - Tiền voucher giảm giá.
    - Bảng `Payments` không phân tách được bao nhiêu tiền là của vé, bao nhiêu tiền là của bắp nước, và bắp nước gồm những món nào (bắp ngọt hay nước ngọt).
    - Để báo cáo tài chính có thể bóc tách độc lập: **"Doanh thu Bắp nước là bao nhiêu?"** và **"Doanh thu Vé phim là bao nhiêu?"**, hệ thống bắt buộc phải truy vấn vào bảng chi tiết `OrderCombos` (lấy `quantity * price`) để tính toán chính xác nguồn thu từng mảng dịch vụ.

---

### Câu 28: Trong SRS Mục 4.9 (FR-REP-01), bộ lọc báo cáo hỗ trợ lọc theo những tiêu chí nào? Hãy chỉ ra vị trí các tham số này được truyền từ Boundary UI sang Control API trong Sequence Diagram 38?
- **Trọng tâm soi lỗi của Giảng viên:** Tính khớp nối (Traceability) giữa Yêu cầu đặc tả giao diện người dùng và giao thức truyền tin nhắn trong sơ đồ kỹ thuật.
- **Câu trả lời chuẩn phản biện:**
  - **Các tiêu chí lọc theo FR-REP-01:**
    1. Khoảng thời gian: Từ ngày (`fromDate`) đến ngày (`toDate`).
    2. Phim: Tất cả các phim hoặc một bộ phim cụ thể (`movieId`).
    3. Phòng chiếu: Phòng 1 đến Phòng 5 (`roomNumber`).
    4. Kênh bán vé: Tất cả / Trực tuyến (Website) / Bán tại quầy (POS).
  - **Vị trí trên Sequence Diagram 38:**
    - Nằm tại **Thông điệp số 22**:
      `UI -> API: GET /api/admin/reports/revenue?fromDate=...&toDate=...&movieId=...&channel=... (Admin Session Token)`.
    - Thông điệp này thể hiện việc tầng Giao diện đóng gói toàn bộ các lựa chọn của Admin vào Query Parameters gửi kèm phiên xác thực tới API Control.

---

### Câu 29: Trên Sơ đồ Trạng thái của Vé (`state_ticket.puml`), vé bị hủy do sự cố rạp chuyển sang trạng thái `PENDING_CASH_REFUND`. Khoản tiền này được hiển thị như thế nào trên Sơ đồ Tuần tự Báo cáo tài chính?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng đồng bộ hóa giữa Sơ đồ Trạng thái (State Diagram) và Sơ đồ Tuần tự (Sequence Diagram).
- **Câu trả lời chuẩn phản biện:**
  - **Trên Sơ đồ Trạng thái `state_ticket.puml`:**
    - Khi rạp gặp sự cố máy chiếu, vé từ `Valid` chuyển sang `Cancelled` với trạng thái con: `state "PENDING_CASH_REFUND (Chờ hoàn tiền mặt 100%)"`.
  - **Hiển thị trên Sơ đồ Tuần tự Sequence 38:**
    - Tại bước số 35: Entity DB tính toán `SUM(refundAmount) với refundStatus = 'PENDING_CASH_REFUND'`.
    - Tại thông điệp số 42: API trả về trường `pendingRefundAmount`.
    - Tại thông điệp số 48: Boundary UI hiển thị riêng biệt một thẻ KPI mang tên: **"Tiền chờ hoàn sự cố: X.XXX.XXX VNĐ"**.
    - Việc này giúp kế toán nhìn vào là biết rạp đang có nghĩa vụ phải chuẩn bị sẵn bao nhiêu tiền mặt trong két để trả lại cho khách trong vòng 30 ngày.

---

### Câu 30: Trong Sơ đồ Hoạt động Báo cáo Doanh thu, nếu một người dùng có vai trò là STAFF hoặc CUSTOMER cố tình truy cập vào URL `/admin/reports`, sơ đồ thể hiện luồng chặn và mã lỗi HTTP nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng kiểm tra cơ chế kiểm soát truy cập vai trò (RBAC Guard) trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `17_bao_cao_doanh_thu.puml`:**
    - Ngay sau bước truy cập, hệ thống chuyển sang làn `Máy chủ xử lý (Backend API / NextAuth)`.
    - Xuất hiện khối điều kiện rẽ nhánh: `if (Admin?)`.
  - **Luồng chặn (Nhánh `then (Không: HTTP 403)`):**
    1. Máy chủ lập tức sinh mã lỗi **HTTP 403 Forbidden**.
    2. Chuyển sang làn `Giao diện (Frontend Next.js)`: Hiển thị thông báo *"Truy cập bị từ chối: Bạn không có quyền truy cập khu vực Báo cáo Quản trị!"*.
    3. Tự động chuyển hướng người dùng quay trở lại Trang chủ (`/`).
    4. Chuyển sang làn `Người dùng`: Kết thúc luồng hoạt động tại điểm dừng (Stop Node).

---

### Câu 31: Trên ERD, nếu một suất chiếu có 50 ghế nhưng chỉ bán được 30 vé và có 5 vé bị hủy, thì khi Admin xem báo cáo doanh thu theo suất chiếu, hệ thống tính `seats_sold`, `empty_seats`, và `fill_rate` như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Kiểm tra độ chính xác của logic toán học kế toán dựa trên dữ liệu bảng thực thể ERD.
- **Câu trả lời chuẩn phản biện:**
  - **Phân tích dữ liệu thực thể:**
    - Tổng sức chứa của phòng chiếu: $	ext{Total Seats} = 50$.
    - Tổng vé phát hành ban đầu: $30$ vé.
    - Số vé bị hủy (`status = Cancelled`): $5$ vé.
  - **Kết quả tính toán trên báo cáo:**
    1. **Số vé hợp lệ thực tế (`seats_sold` / `tickets_sold`):** $30 - 5 = \mathbf{25	ext{ vé}}$ (Chỉ tính vé `Valid` và `Used`).
    2. **Số ghế trống thực tế (`empty_seats`):** $50 - 25 = \mathbf{25	ext{ ghế}}$ (Vì 5 chiếc vé bị hủy thì ghế đã được giải phóng về `EMPTY` để bán tiếp).
    3. **Tỷ lệ lấp đầy phòng chiếu (`fill_rate`):**
       $$	ext{Fill Rate} = \left(rac{25}{50}
ight) 	imes 100 = \mathbf{50.0\%}$$
    - Không tính 5 chiếc vé hủy vào số ghế đã bán để phản ánh đúng thực tế phục vụ của phòng chiếu.

---

### Câu 32: Trong Sơ đồ Tuần tự 38, tại sao đối tượng Boundary UI lại hiển thị đồng thời cả 4 thẻ chỉ số KPI tài chính nổi bật và biểu đồ xu hướng? Các thẻ KPI đó là gì theo đặc tả SRS?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ thiết kế Bảng điều khiển tài chính (Financial Executive Dashboard) theo chuẩn SRS IEEE 830.
- **Câu trả lời chuẩn phản biện:**
  - **Mục đích hiển thị đa chiều:** Cung cấp cả góc nhìn tổng quan nhanh (High-level Snapshot qua các thẻ KPI) lẫn góc nhìn phân tích xu hướng (Trend Analysis qua biểu đồ) để Giám đốc rạp có thể ra quyết định điều hành chỉ trong 30 giây.
  - **4 thẻ KPI tài chính theo đặc tả SRS (FR-REP-02):**
    1. **Doanh thu thuần (Net Revenue):** Tổng tiền vé thực thu + Tiền combo bắp nước đã bán.
    2. **Tổng số vé đã bán (Total Tickets Sold):** Số lượng vé hợp lệ đã phục vụ khán giả.
    3. **Tổng tiền công nợ chờ hoàn (Pending Refunds):** Số tiền cần trả khách do hủy sự cố.
    4. **Tỷ lệ lấp đầy rạp trung bình (Average Fill Rate):** Hiệu suất khai thác ghế toàn rạp.

---

### Câu 33: Khi rạp gặp sự cố mất điện khiến cả suất chiếu bị hủy (`ScreeningStatus.CANCELLED`), sơ đồ trạng thái suất chiếu (`state_screening.puml`) chuyển trạng thái ra sao và ảnh hưởng thế nào đến Sequence Diagram 38?
- **Trọng tâm soi lỗi của Giảng viên:** Tác động dây chuyền giữa các máy trạng thái (Cascading State Transitions) lên báo cáo tài chính.
- **Câu trả lời chuẩn phản biện:**
  - **Trên `state_screening.puml`:** Suất chiếu lập tức chuyển trạng thái sang `CANCELLED`. Toàn bộ các vé liên kết tự động chuyển sang `Cancelled` với `refundStatus = PENDING_CASH_REFUND`.
  - **Ảnh hưởng đến Sequence Diagram 38:**
    - Khi Admin mở báo cáo doanh thu, tại bước 35, câu lệnh truy vấn lọc suất chiếu bị hủy:
      - Cột Doanh thu thực thu `netRevenue` của suất chiếu này bằng **0 VNĐ**.
      - Cột Số vé bán `ticketsSold` bằng **0 vé**.
      - Cột Tiền hoàn `refundedAmount` ghi nhận toàn bộ số tiền vé ban đầu.
      - Ghi chú trạng thái hiển thị màu đỏ: `"ĐÃ HỦY DO SỰ CỐ"`.

---

### Câu 34: Tại sao trong ERD không có bảng `Daily_Revenue` mà hệ thống lại tính toán động từ bảng `Tickets` và `OrderCombos`? Ưu điểm của thiết kế này đối với tính trung thực của dữ liệu là gì?
- **Trọng tâm soi lỗi của Giảng viên:** Kiến thức về chuẩn hóa cơ sở dữ liệu và phòng chống dư thừa dữ liệu (Data Redundancy / Single Source of Truth).
- **Câu trả lời chuẩn phản biện:**
  - **Nguyên lý Single Source of Truth (Nguồn chân lý duy nhất):**
    - Nếu tạo thêm bảng `Daily_Revenue` và lưu một con số tổng tĩnh vào đó: Khi có một chiếc vé bị hủy sau đó 2 ngày hoặc nhân viên quầy hoàn tiền mặt, số liệu trong bảng `Daily_Revenue` sẽ bị sai lệch (Out of sync) nếu lập trình viên quên cập nhật ngược lại.
  - **Ưu điểm của việc tính toán động từ bảng gốc `Tickets` và `OrderCombos`:**
    - Đảm bảo tính trung thực tuyệt đối (100% Data Integrity): Mỗi con số hiển thị trên báo cáo luôn là kết quả phản ánh chính xác từng dòng giao dịch vé có thật trong database, hoàn toàn triệt tiêu nguy cơ sai lệch số liệu giữa bảng tổng hợp và bảng chi tiết khi kiểm toán.

---

### Câu 35: Trong Sơ đồ Hoạt động 17, nếu xảy ra lỗi kết nối Database (ví dụ timeout mạng với Supabase), sơ đồ xử lý hiển thị thông báo lỗi tới người dùng như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng dự phòng sự cố hạ tầng (Fault Tolerance) trong sơ đồ hoạt động.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `17_bao_cao_doanh_thu.puml`:**
    - Tại làn `Cơ sở dữ liệu (PostgreSQL)`: Nếu xảy ra timeout hoặc đứt kết nối mạng:
    - Làn `Máy chủ xử lý` bắt ngoại lệ và sinh mã lỗi `HTTP 500 Internal Server Error` (Database Connection Error).
    - Làn `Giao diện (Frontend)` tắt biểu tượng Loading và kích hoạt thông báo Toast lỗi hệ thống: *"Không thể tải dữ liệu báo cáo tài chính. Vui lòng kiểm tra lại kết nối máy chủ!"*.
    - Giao diện cung cấp nút bấm "Tải lại (Retry)" để người dùng thử lại mà không phải gõ lại bộ lọc.

---

### Câu 36: Trên ERD, bảng `Payments` có trường `paymentMethod` (VNPay, Momo, Cash, BankCard). Bộ lọc kênh bán (Online vs Quầy POS) trong Sequence Diagram 38 sử dụng trường này như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Ánh xạ từ tiêu chí nghiệp vụ trừu tượng xuống trường dữ liệu cụ thể trong ERD.
- **Câu trả lời chuẩn phản biện:**
  - **Ánh xạ nghiệp vụ:**
    - Kênh bán **Trực tuyến (Online Channel)**: Ứng với các bản ghi `Payments` có `paymentMethod IN ('VNPay', 'Momo')`.
    - Kênh bán **Tại quầy rạp (POS Channel)**: Ứng với các bản ghi `Payments` có `paymentMethod IN ('Cash', 'BankCard')`.
  - Khi Admin chọn bộ lọc Kênh bán trong Sequence Diagram 38 (Thông điệp 22), Control API sẽ tự động bổ sung điều kiện lọc `WHERE paymentMethod = ...` vào câu truy vấn CSDL để phân tách rạch ròi doanh thu thu qua ngân hàng và doanh thu tiền mặt tại quầy.

---

### Câu 37: Trong SRS Mục 5.4 (NFR-INT-02), yêu cầu kiểm toán kế toán đối với việc xuất quỹ chi trả tiền mặt cho khách hủy vé sự cố được đối chiếu như thế nào trên Sơ đồ Tuần tự 38?
- **Trọng tâm soi lỗi của Giảng viên:** Tính truy vết kiểm toán (Auditability) của các dòng tiền xuất quỹ trên báo cáo tài chính.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu:**
    - Báo cáo Sequence Diagram 38 không chỉ hiển thị một con số tổng tiền đã hoàn `actualRefundedAmount`, mà khi Admin bấm vào chi tiết, hệ thống cung cấp danh sách chứng từ kiểm toán (Audit Trail Log):
      - Mã vé được hoàn (`ticket_id`).
      - Tên nhân viên thu ngân xuất tiền mặt (`staff_id`).
      - Mốc thời gian chính xác chi tiền (`refundedAt`).
      - Lý do hủy vé do sự cố kỹ thuật.
    - Điều này đáp ứng 100% yêu cầu NFR-INT-02 trong SRS, đảm bảo kế toán trưởng có thể đối soát từng đồng tiền mặt xuất ra khỏi két quầy rạp.

---

### Câu 38: Hãy giải thích sự khác biệt giữa Sơ đồ Hoạt động (Activity Diagram 17) và Sơ đồ Tuần tự (Sequence Diagram 38) cho cùng một chức năng Báo cáo Doanh thu? Giảng viên nên nhìn vào sơ đồ nào để thấy luồng dữ liệu thời gian, và sơ đồ nào để thấy luồng điều khiển nghiệp vụ?
- **Trọng tâm soi lỗi của Giảng viên:** Phân biệt bản chất của các loại sơ đồ UML (Behavioral vs Interaction Diagrams) và năng lực mô hình hóa hệ thống.
- **Câu trả lời chuẩn phản biện:**
  - **Sự khác biệt cốt lõi:**
    - **Sơ đồ Hoạt động (Activity Diagram 17):** Thuộc nhóm Sơ đồ Hành vi (Behavioral Diagram). Mô hình hóa **Luồng điều khiển nghiệp vụ (Business Control Flow)** theo các bước tuần tự và rẽ nhánh logic (`if-else`, phân làn trách nhiệm Swimlanes). *Giảng viên nhìn vào sơ đồ này để nắm bắt quy trình vận hành từ góc nhìn người dùng và các điều kiện rẽ nhánh.*
    - **Sơ đồ Tuần tự (Sequence Diagram 38):** Thuộc nhóm Sơ đồ Tương tác (Interaction Diagram). Mô hình hóa **Trật tự trao đổi thông điệp theo thời gian (Time-ordered Message Sequence)** giữa các đối tượng BCE (`Actor -> Boundary -> Control -> Entity`). *Giảng viên nhìn vào sơ đồ này để thấy rõ luồng dữ liệu, tham số API, câu truy vấn database và mã trạng thái HTTP trả về theo trục thời gian từ trên xuống dưới.*

---

## PHẦN 3: PHÂN HỆ ĐẶT VÉ & GIỮ GHẾ 10 PHÚT TRỰC TUYẾN (CONCURRENCY & BOOKING) (12 CÂU)
*(Tập trung vào Use Case UC_BookOnline, Activity Diagram 05; Sequence Diagrams 04 -> 07; State Diagram state_seat.puml; Ràng buộc BR-01, BR-02 & NFR-SAFE-01)*

---

### Câu 39: Trên Sơ đồ Use Case phân rã Đặt vé trực tuyến, quan hệ giữa Use Case "Đặt vé Online" và Use Case "Chọn ghế ngồi" là `<<include>>` hay `<<extend>>`? Tại sao?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng phân biệt chính xác giữa quan hệ `<<include>>` (Bắt buộc) và `<<extend>>` (Mở rộng tùy chọn) trong sơ đồ Use Case.
- **Câu trả lời chuẩn phản biện:**
  - **Quan hệ chuẩn mực:** Quan hệ giữa Use Case "Đặt vé Online" và Use Case "Chọn ghế ngồi" là **`<<include>>` (Bao hàm / Bắt buộc)**.
  - **Lý giải nghiệp vụ:**
    - Trong quy trình mua vé xem phim tại rạp, không thể có chuyện mua một chiếc vé mà không xác định vị trí ghế ngồi cụ thể trong phòng chiếu (A1 đến E10). Việc chọn ghế là một bước bắt buộc không thể tách rời để hoàn thành luồng sự kiện cơ bản của Use Case đặt vé.
    - Ngược lại, quan hệ giữa "Đặt vé Online" và "Chọn Combo bắp nước" hoặc "Áp dụng Voucher" mới là quan hệ **`<<extend>>`** (vì khách hàng có thể mua vé xem phim mà không bắt buộc phải mua bắp nước hay dùng voucher).

---

### Câu 40: Trong Sơ đồ Hoạt động Đặt vé & Combo Online (`05_dat_ve_combo_online.puml`), bước chọn ghế và khóa giữ chỗ 10 phút được biểu diễn ở làn nào? Nếu ghế đã có người giữ thì luồng hoạt động rẽ nhánh như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Đọc hiểu luồng xử lý đồng thời và kiểm soát giao dịch trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Phân làn trách nhiệm trong sơ đồ `05_dat_ve_combo_online.puml`:**
    - *Làn Người dùng:* Chọn các vị trí ghế trên sơ đồ 50 ghế (A1 - E10).
    - *Làn Giao diện:* Gửi request khóa ghế lên máy chủ.
    - *Làn Máy chủ xử lý & CSDL:* Bắt đầu giao dịch kiểm tra trạng thái ghế trong database.
  - **Luồng rẽ nhánh khi ghế đã có người giữ (Guard: `[Ghế không khả dụng]`):**
    1. Máy chủ sinh phản hồi lỗi `HTTP 409 Conflict: Ghế đã có người giữ chỗ`.
    2. Giao diện nhận thông báo lỗi, đổi màu ghế đó sang màu xám/vàng mờ (Ghế bị khóa).
    3. Luồng điều khiển quay trở lại làn Người dùng: Yêu cầu khách hàng chọn lại ghế khác, không cho phép đi tiếp sang bước chọn bắp nước hay thanh toán.

---

### Câu 41: Trong Sơ đồ Trạng thái Ghế ngồi (`state_seat.puml`), hãy phân tích các sự kiện (Events/Triggers) làm chuyển đổi trạng thái giữa `EMPTY`, `RESERVED`, và `OCCUPIED`?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ Máy trạng thái (Finite State Machine) của thực thể Ghế ngồi trong hệ thống rạp phim.
- **Câu trả lời chuẩn phản biện:**
  - **Phân tích 3 bước chuyển trạng thái trên `state_seat.puml`:**
    1. `[*] --> EMPTY`: Khi Quản trị viên khởi tạo một suất chiếu mới, hệ thống tự động sinh ra 50 bản ghi ghế ở trạng thái `EMPTY` (Ghế trống).
    2. `EMPTY --> RESERVED`: Sự kiện kích hoạt khi khách hàng bấm chọn ghế và gửi request giữ chỗ hợp lệ. Trạng thái chuyển sang `RESERVED` kèm thời hạn `reserved_until = NOW() + 10 phút`.
    3. `RESERVED --> OCCUPIED`: Sự kiện kích hoạt khi nhận được thông báo thanh toán thành công (Webhook IPN từ VNPay hoặc nhân viên quầy thu tiền mặt). Ghế được chốt bán chính thức.

---

### Câu 42: Trên Sơ đồ Trạng thái Ghế (`state_seat.puml`), mũi tên từ `RESERVED` quay ngược về `EMPTY` có kèm theo điều kiện canh gác (Guard Condition) gì? SRS quy định thời gian timeout này là bao nhiêu phút?
- **Trọng tâm soi lỗi của Giảng viên:** Kiểm tra việc định nghĩa điều kiện bảo vệ (Guard Conditions) trên đường chuyển tiếp (State Transition).
- **Câu trả lời chuẩn phản biện:**
  - **Điều kiện canh gác (Guard Condition) trên sơ đồ:**
    `[Timeout 10 phút không thanh toán HOẶC Khách bấm hủy chọn ghế] / Giải phóng ghế`
  - **Quy định trong SRS (Mục 4.3, FR-BOK-02 & BR-01):**
    - Thời gian khóa giữ chỗ tạm thời được quy định cố định là **10 phút**.
    - Nếu quá 10 phút mà đơn hàng chưa hoàn tất thanh toán, hệ thống tự động kích hoạt bộ dọn dẹp chuyển ghế từ `RESERVED` quay trở lại `EMPTY` và xóa mốc `reserved_until`, mở quyền chọn ghế cho các khách hàng khác.

---

### Câu 43: Trong Sơ đồ Tuần tự 06 (`06_chon_ghe_va_giu_cho.puml`), cơ chế xử lý tranh chấp giữ ghế đồng thời (Concurrency Control / Race Condition) được đối tượng Control và Entity thể hiện qua các thông điệp nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng mô hình hóa bài toán kiểm soát tranh chấp đồng thời trên Sequence Diagram theo chuẩn NFR-SAFE-01.
- **Câu trả lời chuẩn phản biện:**
  - **Thể hiện trên Sequence Diagram 06:**
    1. Thông điệp số 4: `UI -> API: POST /api/seats/reserve (screeningId, seatCodes)`.
    2. Thông điệp số 5: `API -> DB: Bắt đầu giao dịch nguyên tử (Transaction Isolation Level)`.
    3. Thông điệp số 6: `API -> DB: SELECT status, reserved_until FROM seats WHERE code IN (...) FOR UPDATE`.
    4. Nhờ câu lệnh khóa dòng `FOR UPDATE` trong giao dịch, Entity DB đảm bảo chỉ có 1 request được phép thao tác trên bản ghi ghế đó tại một thời điểm, loại bỏ hoàn toàn hiện tượng 2 người cùng giữ 1 ghế.

---

### Câu 44: Tại sao trong Sequence Diagram 06 lại có khối `alt (Ghế đã bị người khác chọn/đang giữ)` trả về mã lỗi HTTP 409 Conflict? Mã 409 trong chuẩn RFC có ý nghĩa gì đối với bài toán giữ ghế?
- **Trọng tâm soi lỗi của Giảng viên:** Kiến thức chuẩn hóa mã trạng thái HTTP (RFC 7231) trong sơ đồ tương tác hệ thống.
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa mã HTTP 409 Conflict:**
    - Theo chuẩn RFC 7231, mã `409 Conflict` chỉ ra rằng yêu cầu gửi lên không thể hoàn thành do có sự **xung đột về trạng thái hiện tại của tài nguyên đích** (Resource State Conflict).
  - **Ứng dụng vào bài toán giữ ghế:**
    - Ghế A5 tại thời điểm request thứ hai gửi tới không còn ở trạng thái `EMPTY` nữa mà đã là `RESERVED` bởi người thứ nhất.
    - Việc trả về mã 409 là chuẩn mực hơn rất nhiều so với mã 400 (Bad Request - lỗi cú pháp) hay 500 (Server Error - lỗi máy chủ), giúp tầng Boundary UI nhận biết chính xác đây là lỗi xung đột ghế để hiển thị thông báo hướng dẫn khách chọn vị trí khác.

---

### Câu 45: Trên ERD (SRS Mục 6.5), bảng `Seats` có ràng buộc duy nhất `UNIQUE(screening_id, code)` và trường `reserved_until`. Hai thuộc tính này đóng vai trò gì trong việc hiện thực quy tắc nghiệp vụ BR-01?
- **Trọng tâm soi lỗi của Giảng viên:** Mối quan hệ giữa Ràng buộc mô hình dữ liệu trên ERD và Quy chế vận hành phòng vé trong SRS.
- **Câu trả lời chuẩn phản biện:**
  - **Thuộc tính `UNIQUE(screening_id, code)`:**
    - Đảm bảo tính toàn vẹn vật lý: Trong cùng một suất chiếu, một mã ghế (ví dụ: `A1`) chỉ tồn tại duy nhất một bản ghi trong CSDL. Tuyệt đối không bao giờ xảy ra tình trạng trùng lặp ghế do lỗi hệ thống.
  - **Thuộc tính `reserved_until` (Timestamp):**
    - Đóng vai trò là mốc thời gian hết hạn của phiên giữ ghế. Mỗi khi có request chọn ghế, hệ thống so sánh `NOW() < reserved_until`. Nhờ thuộc tính này, rạp dễ dàng xác định ghế nào đang bị giam hợp lệ và ghế nào đã hết hạn 10 phút để giải phóng tự động.

---

### Câu 46: Trong Sơ đồ Hoạt động 05, bộ đếm ngược thời gian (Countdown Timer 10:00) bắt đầu chạy tại thời điểm nào và kết thúc tại đâu?
- **Trọng tâm soi lỗi của Giảng viên:** Điểm bắt đầu và kết thúc của một luồng trạng thái phụ thuộc thời gian (Time-dependent Sub-flow).
- **Câu trả lời chuẩn phản biện:**
  - **Điểm bắt đầu:** Countdown Timer 10:00 bắt đầu kích hoạt tại làn `Giao diện (Frontend)` ngay tại thời điểm nhận được thông điệp `HTTP 200 OK: Khóa ghế 10 phút thành công` từ máy chủ.
  - **Điểm kết thúc:** Đồng hồ dừng chạy trong 2 trường hợp:
    1. *Thành công:* Khi khách hàng hoàn tất thanh toán và nhận được thông báo đặt vé thành công.
    2. *Hết giờ (Timeout):* Khi đồng hồ đếm về `00:00`, giao diện tự động xóa phiên chọn ghế và chuyển hướng người dùng về trang chủ kèm thông báo hết thời gian đặt vé.

---

### Câu 47: Trong Sơ đồ Tuần tự 07 (`07_chon_loai_ve.puml`), việc chọn loại vé "Trẻ em (Child - 50%)" cho phim nhãn T18 được kiểm tra và chặn lại như thế nào theo quy chế BR-02?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng thể hiện các quy tắc kiểm soát pháp luật điện ảnh trên Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Thể hiện trên Sequence Diagram 07:**
    1. Khách hàng gửi yêu cầu chọn loại vé: `UI -> API: POST /api/tickets/pricing-check (ticketType='Child', movieId=...)`.
    2. `API -> DB: Lấy ageRating của bộ phim`.
    3. `API` kiểm tra điều kiện:
       - Nếu `movie.ageRating === 'T18'` hoặc `'C13'`:
       - Rẽ nhánh vào khối `alt (Vi phạm nhãn tuổi)`: `API --> UI: 400 Bad Request { message: "Phim nhãn T18 không áp dụng vé Trẻ em theo quy chế pháp luật" }`.
       - `UI` tự động khóa lựa chọn vé Trẻ em và hiển thị thông báo giải thích cho khách hàng.

---

### Câu 48: Trên Sơ đồ Use Case, một khách hàng có thể chọn tối đa bao nhiêu ghế trong một lượt giao dịch? Quy định này nằm ở mục nào trong SRS và bảo vệ hệ thống trước nguy cơ gì?
- **Trọng tâm soi lỗi của Giảng viên:** Tính kiểm soát số lượng đặt chỗ (Quota Limitation) trong tài liệu đặc tả yêu cầu.
- **Câu trả lời chuẩn phản biện:**
  - **Giới hạn số ghế:** Tối đa **8 ghế / 1 lượt giao dịch**.
  - **Căn cứ trong SRS:** Quy định tại **Mục 4.3 (FR-BOK-02)** và **Tech Spec Mục 4.4**.
  - **Bảo vệ hệ thống trước nguy cơ gì:**
    - Phòng chống hành vi đầu cơ phe vé (Ticket Scalpers) ôm sạch các hàng ghế VIP của suất chiếu sớm bom tấn.
    - Ngăn chặn các cuộc tấn công từ chối dịch vụ nghiệp vụ (Denial of Service - DoS) bằng cách dùng tài khoản ảo khóa toàn bộ 50 ghế của phòng chiếu rồi bỏ thanh toán.

---

### Câu 49: Trên Sơ đồ Trạng thái Ghế, khi nào một ghế ở trạng thái `OCCUPIED` có thể chuyển ngược lại thành `EMPTY`? Có sự kiện nào chuyển trực tiếp từ `OCCUPIED` về `RESERVED` không?
- **Trọng tâm soi lỗi của Giảng viên:** Tính chặt chẽ của các bước chuyển trạng thái (State Transition Invariants).
- **Câu trả lời chuẩn phản biện:**
  - **Khi nào chuyển từ `OCCUPIED` về `EMPTY`:**
    - Chỉ xảy ra khi có sự kiện **HỦY VÉ HỢP LỆ**:
      1. Khách hàng chủ động tự hủy vé trước giờ chiếu $\ge 2$ tiếng (BR-03).
      2. Rạp gặp sự cố kỹ thuật bất khả kháng (mất điện, hỏng máy chiếu) hủy vé bồi hoàn (BR-04).
  - **Có chuyển từ `OCCUPIED` về `RESERVED` không?**
    - **TUYỆT ĐỐI KHÔNG CÓ ĐƯỜNG NÀY**.
    - Ghế đã bán thành công (`OCCUPIED`) khi hủy thì phải trở thành ghế trống hoàn toàn (`EMPTY`) để tất cả mọi người cùng có quyền chọn mua công bằng. Tuyệt đối không thể chuyển ngược thành `RESERVED` (giữ chỗ riêng cho ai).

---

### Câu 50: Trong Sơ đồ Tuần tự Đặt vé tổng quan (Sequence 04), mối liên kết giữa việc chọn ghế và chọn combo bắp nước được phối hợp theo trật tự thời gian ra sao?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ trật tự logic (Temporal Logic) trong luồng tuần tự nghiệp vụ bán vé rạp phim.
- **Câu trả lời chuẩn phản biện:**
  - **Trật tự thời gian trên Sequence Diagram 04:**
    1. *Bước 1: Chọn Suất chiếu & Khóa giữ ghế 10 phút thành công.* (Bắt buộc phải có ghế giữ chỗ trước thì phiên đặt hàng mới được khởi tạo).
    2. *Bước 2: Gợi ý chọn Combo bắp nước.* (Hệ thống dựa trên mã đơn hàng vừa sinh để cho phép thêm các gói combo và khóa tồn kho combo tạm thời đồng bộ với 10 phút của ghế).
    3. *Bước 3: Nhập mã Voucher khuyến mãi.* (Hệ thống tính toán chiết khấu trên tiền vé).
    4. *Bước 4: Chuyển hướng thanh toán VNPay.*
  - Trật tự này đảm bảo chiếc ghế - tài sản có tính cạnh tranh cao nhất - được bảo vệ trước tiên, sau đó mới đến các sản phẩm gia tăng (bắp nước, voucher).

---

## PHẦN 4: PHÂN HỆ CỔNG THANH TOÁN TRỰC TUYẾN VNPAY (08 CÂU)
*(Tập trung vào Sequence Diagrams 10, 11; Activity Diagram 05; State Diagram state_payment.puml; Thực thể Payments trên ERD & Ràng buộc NFR-INT-01)*

---

### Câu 51: Trong Sơ đồ Tuần tự 11 (`11_thanh_toan_vnpay_momo.puml`), đối tượng Cổng thanh toán VNPay được mô hình hóa là một Actor hay một Participant? Tại sao?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ các thành phần tham gia (Lifeline Participants) trong Sơ đồ Tuần tự và phân biệt Tác nhân con người (Human Actor) với Hệ thống dịch vụ ngoại vi (External System).
- **Câu trả lời chuẩn phản biện:**
  - **Mô hình hóa trên sơ đồ:** Cổng thanh toán VNPay được khai báo là một **External Participant / Boundary Lifeline** (với biểu tượng hệ thống bên ngoài: `participant "Cổng thanh toán
VNPay / MoMo" as Pay`).
  - **Lý giải chuẩn UML:**
    - Mặc dù VNPay nằm ngoài phạm vi phần mềm Lumi Cinema, nhưng trong sơ đồ tương tác kỹ thuật, VNPay đóng vai trò là một dịch vụ phần mềm tự động (Service Endpoint) trao đổi dữ liệu qua giao thức HTTP/REST API (gửi và nhận Webhook).
    - Việc mô hình hóa thành một Lifeline độc lập giúp sơ đồ thể hiện rõ nét các thông điệp bất đồng bộ (Server-to-Server Asynchronous Messages) giữa hai hệ thống máy chủ mà không bị nhầm lẫn với hành động thủ công của con người.

---

### Câu 52: Hãy chỉ ra sự khác biệt giữa hai luồng thông điệp trả về trên Sequence Diagram 11: Thông điệp số 8 (Redirect URL) và Thông điệp số 12 (Webhook IPN)? Tại sao thông điệp 12 lại có tính quyết định đến trạng thái đơn hàng?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng phân biệt giữa Kênh chuyển hướng trình duyệt (Front-channel Redirect) và Kênh giao tiếp máy chủ ngầm (Back-channel IPN).
- **Câu trả lời chuẩn phản biện:**
  - **Sự khác biệt bản chất:**
    - *Thông điệp số 8 (Redirect `vnpay-return`):* Là kênh truyền Front-channel qua trình duyệt của người dùng. Trình duyệt nhận URL chuyển hướng từ VNPay và hiển thị giao diện kết quả. Kênh này không an toàn vì người dùng có thể can thiệp sửa tham số hoặc bị rớt mạng giữa chừng.
    - *Thông điệp số 12 (Webhook `vnpay-ipn`):* Là kênh truyền Back-channel trực tiếp giữa máy chủ VNPay và máy chủ Lumi Cinema, có ký băm bảo mật HMAC-SHA512.
  - **Tại sao thông điệp 12 có tính quyết định:**
    - Theo quy chuẩn an toàn tài chính trong SRS (Mục 3.3 & NFR-INT-01): Hệ thống chỉ chính thức ghi nhận `Payment.status = Success`, phát hành vé và trừ kho combo khi và chỉ khi nhận được thông điệp Webhook IPN số 12. Điều này triệt tiêu hoàn toàn nguy cơ gian lận sửa URL trên trình duyệt.

---

### Câu 53: Trong Sơ đồ Trạng thái Thanh toán (`state_payment.puml`), hãy phân tích các trạng thái `Pending`, `Success`, `Failed`, và `Refunded`? Khi nào xảy ra chuyển tiếp từ `Pending` sang `Failed`?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ vòng đời của thực thể Thanh toán (Payment State Machine) trong hệ thống rạp phim.
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa 4 trạng thái trên `state_payment.puml`:**
    1. `Pending` (Chờ thanh toán): Trạng thái khởi tạo khi khách bấm xác nhận đặt vé, đang trong thời gian 10 phút giữ chỗ.
    2. `Success` (Thành công): Nhận được xác thực thanh toán hợp lệ từ cổng thanh toán hoặc quầy thu tiền mặt.
    3. `Failed` (Thất bại): Giao dịch không thể hoàn thành.
    4. `Refunded` (Đã hoàn tiền): Giao dịch ban đầu thành công nhưng sau đó toàn bộ đơn hàng bị hủy do sự cố rạp.
  - **Khi nào chuyển từ `Pending` sang `Failed`:**
    - Khách hàng bấm nút "Hủy giao dịch" trên giao diện ngân hàng.
    - Tài khoản ngân hàng không đủ số dư hoặc nhập sai OTP quá số lần quy định.
    - Hết thời gian 10 phút giữ ghế mà cổng thanh toán phản hồi mã lỗi `vnp_ResponseCode !== '00'`.

---

### Câu 54: Yêu cầu phi chức năng NFR-INT-01 (Tính lũy đẳng Idempotency) trong SRS được thể hiện như thế nào trong Sơ đồ Tuần tự 11 khi cổng VNPay gửi Webhook IPN lặp lại nhiều lần?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng mô hình hóa cơ chế phòng chống xử lý trùng lặp giao dịch (Duplicate Transaction Prevention) trên Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Thể hiện trên Sequence Diagram 11:**
    - Tại bước số 13, khi nhận Webhook IPN: Đối tượng `Control (API)` thực hiện một câu lệnh kiểm tra trạng thái hiện tại trong `Entity DB`:
      `API -> DB: SELECT status FROM payments WHERE transactionCode = ...`
    - Khối rẽ nhánh `alt (Đơn hàng đã được xác nhận thành công trước đó)`:
      - Nếu `status === 'Success'`: Hệ thống lập tức bỏ qua toàn bộ các bước tạo vé và trừ kho, trả về ngay cho VNPay mã phản hồi: `{"RspCode": "02", "Message": "Order already confirmed"}`.
    - Nhờ khối `alt` này, dù VNPay có gửi lại tín hiệu IPN 3 hay 5 lần do mạng chập chờn thì hệ thống vẫn đảm bảo chỉ xuất vé duy nhất 1 lần, bảo vệ tính toàn vẹn dữ liệu.

---

### Câu 55: Trên ERD (SRS Mục 6.5), bảng `Payments` có các trường `transaction_code` và `payment_method`. Trường `transaction_code` có bắt buộc phải duy nhất (UNIQUE) không? Tại sao?
- **Trọng tâm soi lỗi của Giảng viên:** Ràng buộc toàn vẹn cơ sở dữ liệu đối với mã giao dịch ngân hàng trên ERD.
- **Câu trả lời chuẩn phản biện:**
  - **Ràng buộc:** Trường `transaction_code` **BẮT BUỘC PHẢI CÓ RÀNG BUỘC DUY NHẤT (UNIQUE INDEX)**.
  - **Lý giải nghiệp vụ:**
    - Mỗi giao dịch thanh toán trực tuyến qua VNPay hoặc chuyển khoản ngân hàng đều được gán một mã giao dịch duy nhất trên toàn quốc.
    - Ràng buộc `UNIQUE` ở tầng CSDL ngăn chặn tuyệt đối lỗi hệ thống vô tình tạo ra hai đơn hàng khác nhau có cùng một mã giao dịch ngân hàng, đồng thời hỗ trợ tra cứu và đối soát chéo cực nhanh khi có tranh chấp khiếu nại tài chính.

---

### Câu 56: Trong Sơ đồ Hoạt động Đặt vé 05, nếu khách hàng bấm "Hủy giao dịch" trên màn hình cổng thanh toán VNPay, luồng hoạt động giải phóng ghế và voucher như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng xử lý hoàn trả tài nguyên (Resource Rollback) khi luồng nghiệp vụ bị hủy ngang trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `05_dat_ve_combo_online.puml`:**
    - Khi nhận được tín hiệu hủy giao dịch từ cổng thanh toán:
    - Luồng hoạt động chuyển tiếp sang nhánh xử lý hủy bỏ:
      1. Ghế đang ở `RESERVED` lập tức được kích hoạt hành động: *"Cập nhật trạng thái ghế về EMPTY và xóa reservedUntil"*.
      2. Nếu đơn hàng có áp dụng Voucher: Thực hiện hành động: *"Giảm usedCount của Voucher xuống 1 đơn vị"* để trả lại lượt dùng cho khách.
      3. Nếu có combo: Kích hoạt hành động: *"Giải phóng kho combo khả dụng"*.
      4. Giao diện thông báo: *"Giao dịch đã bị hủy. Ghế của bạn đã được mở lại cho người khác"*.

---

### Câu 57: Tại sao trên Sơ đồ Tuần tự 11, bước sinh mã vé QR ký số HMAC-SHA256 chỉ được thực hiện SAU KHI nhận được Webhook IPN thành công từ VNPay?
- **Trọng tâm soi lỗi của Giảng viên:** Trật tự nhân quả (Causality Order) trong quy trình phát hành chứng từ có giá trị pháp lý.
- **Câu trả lời chuẩn phản biện:**
  - **Lý do trật tự:**
    - Mã QR có chữ ký số HMAC-SHA256 là **chứng từ xem phim chính thức (Digital Entrance Pass)** có giá trị tương đương một tờ séc cho phép bước qua cửa phòng chiếu.
    - Nếu sinh mã QR trước khi tiền thực sự đổ vào tài khoản rạp, khách hàng có thể chụp lại mã QR đó rồi đóng trình duyệt không trả tiền, sau đó dùng ảnh chụp QR để vào rạp xem phim chùa.
    - Vì vậy, trên Sequence Diagram 11, bước ký số sinh mã QR luôn được đặt bên trong khối giao dịch nguyên tử chỉ được kích hoạt sau khi Webhook IPN xác nhận tiền đã vào tài khoản rạp thành công.

---

### Câu 58: Trong SRS Mục 3.3 (Software Interfaces), giao thức chữ ký số HMAC-SHA512 đối soát giữa máy chủ Lumi Cinema và cổng VNPay đóng vai trò gì trong việc phòng chống gian lận đơn hàng?
- **Trọng tâm soi lỗi của Giảng viên:** Tính toàn vẹn và chống giả mạo thông tin giao dịch tài chính trong tài liệu đặc tả SRS.
- **Câu trả lời chuẩn phản biện:**
  - **Vai trò của HMAC-SHA512 trong SRS Mục 3.3:**
    - Khi máy chủ Lumi Cinema gửi dữ liệu sang VNPay, toàn bộ thông tin đơn hàng (số tiền, mã đơn, nội dung) được băm cùng chuỗi khóa bí mật `VNPAY_HASH_SECRET` tạo ra chuỗi `vnp_SecureHash`.
    - Khi VNPay phản hồi Webhook IPN về, VNPay cũng ký băm tương tự.
    - Máy chủ Lumi Cinema dùng hàm băm kiểm tra lại: Nếu một hacker đứng giữa cố tình chỉnh sửa số tiền từ 200.000đ xuống 2.000đ, chữ ký số sẽ không khớp và giao dịch lập tức bị từ chối. Điều này bảo vệ rạp không bị thất thoát doanh thu trước các cuộc tấn công thay đổi dữ liệu gói tin (Man-in-the-Middle Attack).

---

## PHẦN 5: PHÂN HỆ BÁN VÉ & BÁN COMBO TẠI QUẦY POS (STAFF OPERATIONS) (08 CÂU)
*(Tập trung vào Use Case UC_POS; Activity Diagrams 06, 07; Sequence Diagrams 12, 13; Khách vãng lai trên ERD & Yêu cầu FR-POS-01 -> 04)*

---

### Câu 59: Trên Sơ đồ Use Case tổng quát, Use Case "Bán vé & Bán combo tại quầy (POS)" được nối tới Actor Staff. Nhân viên có cần nhập tài khoản của khách hàng khi bán vé tại quầy không? Khách vãng lai được xử lý ra sao trong SRS (FR-POS-02)?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ đối tượng phục vụ tại điểm bán trực tiếp (POS Walk-in Customers) và sự linh hoạt trong tài liệu đặc tả SRS.
- **Câu trả lời chuẩn phản biện:**
  - **Căn cứ SRS Mục 4.4 (FR-POS-02: Gắn định danh hoặc Khách vãng lai):**
    - Hệ thống cho phép nhân viên thực hiện 2 kịch bản:
      1. *Khách hàng thành viên:* Nhân viên nhập Số điện thoại hoặc Email của khách để hệ thống gắn vé vào tài khoản, phục vụ việc tích điểm và lưu vé điện tử.
      2. *Khách hàng vãng lai (Không có tài khoản):* Nhân viên được phép bấm hoàn tất giao dịch mà **KHÔNG BẮT BUỘC KHÁCH PHẢI ĐĂNG KÝ TÀI KHOẢN**.
  - **Lý giải nghiệp vụ rạp:** Khách xếp hàng mua vé tại quầy vào giờ cao điểm rất vội. Nếu ép buộc từng người phải đứng kê khai thông tin để tạo tài khoản mới bán vé thì sẽ làm tắc nghẽn toàn bộ sảnh rạp, gây bức xúc cho khách hàng.

---

### Câu 60: Trong Sơ đồ Hoạt động Bán vé tại quầy (`06_ban_ve_tai_quay.puml`), hãy chỉ ra luồng xử lý phương thức thanh toán? Tiền mặt (Cash) và Quét mã POS QR được phân biệt như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng đọc hiểu khối rẽ nhánh điều kiện thanh toán trực tiếp trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `06_ban_ve_tai_quay.puml`:**
    - Sau bước chọn ghế và xác định tổng tiền, tại làn `Giao diện POS (Frontend)` xuất hiện khối rẽ nhánh: `if (Phương thức thanh toán?)`.
    - *Nhánh 1: Tiền mặt (`Cash`):*
      - Nhân viên thu tiền mặt từ khách -> Nhập số tiền khách đưa -> Giao diện tự động tính tiền thối -> Nhân viên bấm nút "Đã thu đủ tiền mặt".
    - *Nhánh 2: Quét mã QR tại quầy (`POS_QR / BankCard`):*
      - Màn hình phụ hướng về phía khách hiển thị mã VietQR động -> Khách mở app ngân hàng quét mã chuyển khoản -> Khi điện thoại/máy POS báo ting ting nhận tiền thành công -> Nhân viên bấm "Xác nhận chuyển khoản".
  - Cả 2 nhánh sau đó cùng hợp dòng vào hành động: *"Tạo đơn hàng thanh toán thành công và kích hoạt in vé"*.

---

### Câu 61: Trong Sơ đồ Tuần tự 12 (`12_ban_ve_tai_quay_pos.puml`), tại sao lại có thông điệp in vé giấy vật lý? Thiết bị máy in nhiệt được biểu diễn là một đối tượng nào trong sơ đồ tuần tự?
- **Trọng tâm soi lỗi của Giảng viên:** Tích hợp thiết bị phần cứng ngoại vi (Hardware Peripheral Integration) trong mô hình tương tác UML.
- **Câu trả lời chuẩn phản biện:**
  - **Mô hình hóa trên Sequence Diagram 12:**
    - Máy in nhiệt được mô hình hóa là một đối tượng **Boundary / Device Lifeline** (Ký hiệu: `boundary "Máy in nhiệt POS
(Thermal Printer)" as Printer`).
  - **Ý nghĩa thông điệp in vé:**
    - Khách mua vé tại quầy không dùng điện thoại để mở app, do đó chiếc vé giấy in nhiệt có chứa mã QR là phương tiện duy nhất để khách cầm qua cửa soát vé vào phòng chiếu.
    - Thông điệp gọi từ Boundary UI sang Printer (`UI -> Printer: Gửi lệnh in vé xem phim kèm mã QR ký số`) thể hiện việc phần mềm điều khiển thiết bị phần cứng xuất bản vé giấy hoàn tất giao dịch.

---

### Câu 62: Trong Sơ đồ Hoạt động Bán combo độc lập tại quầy (`07_ban_combo_tai_quay.puml`), tại sao không có bước chọn phim hay suất chiếu? Nghiệp vụ bán combo độc lập này được đặc tả ở mục nào trong SRS?
- **Trọng tâm soi lỗi của Giảng viên:** Tính độc lập của luồng nghiệp vụ kinh doanh F&B và căn cứ trong tài liệu yêu cầu SRS.
- **Câu trả lời chuẩn phản biện:**
  - **Căn cứ SRS Mục 4.4 (FR-POS-03: Bán Combo độc lập):**
    - SRS quy định: *"Cho phép nhân viên bán trực tiếp bắp nước tại quầy mà không cần chọn phim hay suất chiếu (phục vụ khách vãng lai hoặc khách đã mua vé online từ trước muốn mua thêm bắp nước)"*.
  - **Lý giải trên sơ đồ `07_ban_combo_tai_quay.puml`:**
    - Quy trình chỉ gồm các bước: Nhân viên mở danh mục Combo -> Chọn món bắp nước -> Nhập số lượng -> Thu tiền -> In hóa đơn nhận đồ.
    - Việc loại bỏ bước chọn suất chiếu giúp nhân viên thao tác cực nhanh (chỉ mất 5 - 10 giây cho một đơn bắp nước), tối đa hóa năng suất phục vụ của quầy bar trong rạp.

---

### Câu 63: Trên ERD, một bản ghi trong bảng `Payments` phát sinh từ quầy POS có gì khác so với một bản ghi phát sinh từ kênh Online? Thuộc tính `paymentMethod` và `user_id` lưu thông tin của ai?
- **Trọng tâm soi lỗi của Giảng viên:** So sánh cấu trúc dữ liệu phát sinh giữa hai kênh bán hàng trên Sơ đồ Thực thể Quan hệ.
- **Câu trả lời chuẩn phản biện:**
  - **Sự khác biệt trên ERD:**

| Trường dữ liệu | Giao dịch phát sinh từ Kênh Online | Giao dịch phát sinh từ Quầy POS |
| :--- | :--- | :--- |
| `paymentMethod` | Lưu `VNPay` hoặc `Momo` | Lưu `Cash` (Tiền mặt) hoặc `BankCard` (Quẹt thẻ/QR) |
| `status` | Bắt đầu bằng `Pending`, chờ IPN mới sang `Success` | Chuyển thẳng sang `Success` ngay khi nhân viên bấm thu tiền |
| `user_id` | Luôn lưu ID của chính Khách hàng đăng nhập | Nếu khách có tài khoản: lưu ID khách. Nếu khách vãng lai: lưu ID tài khoản Guest POS |
| `staff_id` (Log) | Bằng `NULL` (Tự động hóa hoàn toàn) | Lưu ID của Nhân viên thu ngân trực tiếp thực hiện ca trực |

---

### Câu 64: Trong Sơ đồ Tuần tự 13 (`13_ban_combo_tai_quay_pos.puml`), sau khi nhân viên bấm "Xác nhận thu tiền", hệ thống cập nhật những thực thể nào trong CSDL (Combos, OrderCombos, Payments)?
- **Trọng tâm soi lỗi của Giảng viên:** Tính toàn vẹn giao dịch nguyên tử khi bán hàng hóa vật lý trên Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **3 thực thể CSDL được cập nhật đồng thời:**
    1. **Thực thể `Payments`:** Tạo bản ghi thanh toán mới với `status = Success`, phương thức thanh toán tiền mặt/quẹt thẻ, tổng số tiền thu được.
    2. **Thực thể `OrderCombos`:** Tạo các bản ghi chi tiết gói bắp nước kèm số lượng và đơn giá, trạng thái được đánh dấu là `Đã nhận (isDelivered = true)` ngay lập tức vì nhân viên đã trao bắp nước tận tay cho khách tại quầy.
    3. **Thực thể `Combos`:** Thực hiện lệnh trừ trực tiếp số lượng tồn kho: `stock = stock - quantity` để phản ánh đúng lượng nguyên vật liệu còn lại trong kho quầy bar.

---

### Câu 65: Trên Sơ đồ Use Case, tại sao Admin lại có đường kế thừa hoặc có quyền truy cập vào các chức năng của Staff (như POS, Soát vé)? Khái niệm Generalization giữa Actor Admin và Actor Staff có áp dụng ở đây không?
- **Trọng tâm soi lỗi của Giảng viên:** Kiến thức về Quan hệ Tổng quát hóa giữa các Tác nhân (Actor Generalization / Inheritance) trong UML.
- **Câu trả lời chuẩn phản biện:**
  - **Mô hình hóa quan hệ Tác nhân:**
    - Trong Sơ đồ Use Case tổng quát: Tác nhân `Admin` có quan hệ Tổng quát hóa (Generalization - mũi tên tam giác rỗng) trỏ tới tác nhân `Staff` (`Admin --|> Staff`).
  - **Ý nghĩa nghiệp vụ:**
    - `Admin` kế thừa toàn bộ quyền hạn của `Staff`. Trong các tình huống thực tế khi rạp quá tải hoặc giờ cao điểm, Quản lý rạp (Admin) có thể trực tiếp đứng vào quầy thu ngân để bán vé (POS) hoặc đứng tại cửa phòng chiếu để quét vé (Check-in) hỗ trợ nhân viên.
    - Việc sử dụng quan hệ Generalization giúp sơ đồ Use Case không phải vẽ thêm các đường mũi tên trùng lặp từ Admin tới các Use Case của Staff, giúp sơ đồ mạch lạc và đúng chuẩn kỹ thuật UML.

---

### Câu 66: Trong Sơ đồ Hoạt động 06, nếu khách hàng yêu cầu áp dụng loại vé Trẻ em (Child - giảm 50%), nhân viên thực hiện bước kiểm tra điều kiện gì tại quầy theo quy định của SRS?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng kết hợp giữa Quy tắc nghiệp vụ rạp chiếu phim và kiểm tra điều kiện trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `06_ban_ve_tai_quay.puml`:**
    - Khi khách yêu cầu mua vé Trẻ em:
    - *Lớp kiểm tra 1 (Hệ thống phần mềm):* Kiểm tra xem phim có nhãn `C13` hoặc `T18` hay không. Nếu có, phần mềm tự động chặn nút chọn vé Trẻ em.
    - *Lớp kiểm tra 2 (Nghiệp vụ thực tế tại quầy):* Xuất hiện hành động tại làn `Nhân viên quầy`: *"Kiểm tra chiều cao trẻ em qua thước đo (dưới 1m3) hoặc kiểm tra giấy khai sinh/thẻ học sinh (dưới 12 tuổi)"*.
    - Sau khi xác minh hợp lệ, nhân viên mới bấm chọn loại vé Child để giảm 50% tiền vé cho khách, đảm bảo tính tuân thủ pháp luật và không làm thất thoát doanh thu của rạp.

---

## PHẦN 6: PHÂN HỆ SOÁT VÉ (QR HMAC-SHA256) & GIAO NHẬN COMBO ĐỘC LẬP (08 CÂU)
*(Tập trung vào Use Case UC_CheckIn, UC_FulfillCombo; Activity Diagrams 08, 09; Sequence Diagrams 14, 15; State state_ticket.puml (Used); Ràng buộc BR-05, BR-09 & FR-CHK-01 -> 02)*

---

### Câu 67: Trên Sơ đồ Use Case tổng quát, Use Case "Soát vé vào rạp" và "Xác nhận giao nhận combo tại quầy" là 2 Use Case tách rời nhau. Tại sao không gộp chung thành một Use Case duy nhất? Cơ sở thực tế là gì?
- **Trọng tâm soi lỗi của Giảng viên:** Tính phân tách trách nhiệm (Separation of Concerns) và hiểu rõ thực tế bố trí mặt bằng không gian của rạp chiếu phim.
- **Câu trả lời chuẩn phản biện:**
  - **Lý do tách rời 2 Use Case:**
    1. *Khác biệt về Địa điểm vật lý (Physical Location):* Quầy Bắp nước (Concession) nằm tại sảnh chờ trung tâm, trong khi Cửa soát vé (Ticket Gate) nằm tại lối vào hành lang các phòng chiếu. Khách nhận bắp nước từ nhân viên quầy bar, sau đó mới di chuyển lại cửa để nhân viên soát vé quét mã QR.
    2. *Khác biệt về Nhân sự phụ trách (Actor Roles):* Nhân viên phục vụ bắp nước và nhân viên kiểm soát cửa phòng chiếu là hai nhân sự khác nhau trong ca trực của rạp.
    3. *Khác biệt về Thời điểm thực hiện (Timing Asynchrony - BR-05):* Khách có thể đến nhận bắp nước trước giờ chiếu 30 phút để ngồi ăn ở sảnh, hoặc vào xem phim trước rồi giữa giờ mới ra lấy nước ngọt. Việc gộp chung làm một sẽ làm tê liệt quy trình nếu khách muốn lấy bắp nước mà chưa đến giờ soát vé vào phòng.

---

### Câu 68: Trong Sơ đồ Hoạt động Soát vé (`08_soat_ve.puml`), hãy phân tích các điều kiện canh gác (Guard Conditions) để một chiếc vé được xem là hợp lệ qua cửa phòng chiếu?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng đọc hiểu chi tiết các điều kiện kiểm tra nghiệp vụ trên Activity Diagram theo chuẩn FR-CHK-01.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `08_soat_ve.puml`:**
    - Sau khi nhân viên quét mã QR hoặc nhập mã vé `#LMC-XXXXXX`:
    - Hệ thống kiểm tra đồng thời **3 điều kiện canh gác**:
      1. `Trạng thái vé == 'Valid'` (Vé hợp lệ, chưa từng quét qua cửa trước đó và chưa bị hủy).
      2. `Đúng phòng chiếu` (Mã phòng trên vé trùng khớp với phòng chiếu tại cửa kiểm soát).
      3. `Khung thời gian hợp lệ:` $[	ext{startTime} - 30	ext{ phút} \le 	ext{Thời gian hiện tại} \le 	ext{endTime}]$.
    - Nếu thỏa mãn cả 3 điều kiện: Hệ thống chuyển vé sang `Used` và báo đèn xanh hợp lệ.
    - Nếu vi phạm bất kỳ điều kiện nào: Hệ thống chuyển sang luồng từ chối và hiển thị lý do cụ thể (Vé đã dùng, sai phòng, hoặc chưa tới giờ chiếu).

---

### Câu 69: Trong Sơ đồ Trạng thái của Vé (`state_ticket.puml`), trạng thái `Used` có những đường chuyển tiếp nào đi ra? Tại sao ghi chú (Note) trên sơ đồ lại khẳng định đây là "Ràng buộc bất biến (FR-CAN-03)"?
- **Trọng tâm soi lỗi của Giảng viên:** Khái niệm Trạng thái kết thúc (Terminal State) và tính bất biến của dữ liệu kiểm toán rạp phim.
- **Câu trả lời chuẩn phản biện:**
  - **Đường chuyển tiếp đi ra từ `Used` trên `state_ticket.puml`:**
    - Chỉ có **DUY NHẤT 1 ĐƯỜNG ĐI RA**: `Used --> [*] : Suất chiếu hoàn tất`.
    - **TUYỆT ĐỐI KHÔNG CÓ MŨI TÊN NÀO** đi từ `Used` sang `Cancelled` hay `REFUNDED_CASH`.
  - **Ý nghĩa của Ràng buộc bất biến (FR-CAN-03):**
    - Quy chế SRS khẳng định: *"Vé đã có trạng thái Used tuyệt đối không được phép hủy hoặc hoàn tiền dưới bất kỳ hình thức nào"*.
    - Đây là chốt chặn an ninh tối cao chống gian lận: Ngăn chặn nhân viên soát vé thông đồng cho người quen vào xem phim xong, sau đó ra quầy báo hệ thống bấm hủy vé để lấy lại tiền chia nhau. Một khi khách đã bước qua cửa phòng chiếu, dịch vụ xem phim được coi là đã hoàn tất và tiền vé vĩnh viễn thuộc về rạp.

---

### Câu 70: Trong Sơ đồ Tuần tự 14 (`14_soat_ve_vao_rap.puml`), bước kiểm tra chữ ký số HMAC-SHA256 được đối tượng Control thực hiện như thế nào để phát hiện vé bị làm giả?
- **Trọng tâm soi lỗi của Giảng viên:** Cơ chế xác thực chữ ký mật mã học (Signature Verification Workflow) thể hiện trên Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Quy trình xác thực tại bước 5 của Sequence Diagram 14:**
    1. Đầu đọc mã vạch quét mã QR, gửi toàn bộ payload JSON (chứa `ticket_id`, `user_id`, `seat_code`, `status`, `sig`) lên API Control.
    2. Tầng Control tách chuỗi chữ ký `sig` của vé ra.
    3. Control lấy dữ liệu gốc của vé và chuỗi khóa bí mật `NEXTAUTH_SECRET` để băm lại theo thuật toán HMAC-SHA256:
       $$	ext{calculated\_sig} = 	ext{HMAC-SHA256}(	ext{TicketData}, 	ext{SECRET})$$
    4. So sánh: `if (calculated_sig !== sig)` -> Rẽ nhánh vào khối `alt (Chữ ký không khớp)`:
       - Control trả về `400 Bad Request: CẢNH BÁO VÉ GIẢ MẠO!`.
       - Boundary UI phát chuông báo động đỏ cho nhân viên soát vé giữ khách lại để kiểm tra an ninh.

---

### Câu 71: Trong Sơ đồ Hoạt động Giao nhận Combo (`09_giao_nhan_combo.puml`), hệ thống xử lý thế nào nếu một khách hàng đã nhận hết combo rồi lại tiếp tục đưa mã đơn hàng ra nhận lần thứ hai?
- **Trọng tâm soi lỗi của Giảng viên:** Phòng chống gian lận nhận trùng lặp sản phẩm (Double Dipping / Duplicate Fulfillment) trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `09_giao_nhan_combo.puml`:**
    - Sau khi nhân viên quầy bắp nước nhập Mã đơn hàng (`order_code`):
    - Hệ thống chuyển sang kiểm tra trạng thái các gói combo trong CSDL:
      `CheckStatus: Kiểm tra trạng thái combo trong đơn`.
    - Nhánh rẽ điều kiện: `Tất cả combo đã có trạng thái 'Đã nhận'`:
      1. Hệ thống lập tức chuyển sang hành động cảnh báo: *"Hiển thị cảnh báo: Đơn hàng này đã nhận hết combo lúc 19:10 bởi nhân viên A!"*.
      2. Nút "Xác nhận giao hàng" bị ẩn hoặc vô hiệu hóa (disabled).
      3. Luồng hoạt động dẫn thẳng tới điểm kết thúc (`Stop Node`): Từ chối giao thêm bắp nước, triệt tiêu nguy cơ thất thoát hàng hóa của quầy bar.

---

### Câu 72: Trên ERD (SRS Mục 6.5), thuộc tính `isDelivered` và `deliveredAt` nằm trong bảng nào? Tại sao không nằm trong bảng `Combos` mà lại nằm trong bảng `OrderCombos`?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ bản chất giữa Thực thể Danh mục (Catalog Entity) và Thực thể Chi tiết Giao dịch (Transactional Line-item Entity).
- **Câu trả lời chuẩn phản biện:**
  - **Vị trí của 2 thuộc tính:** Nằm trong bảng **`OrderCombos`** (Chi tiết mua bắp nước theo đơn hàng).
  - **Tại sao không nằm trong bảng `Combos`:**
    - Bảng `Combos` là bảng danh mục sản phẩm chung của rạp (Ví dụ: Combo Solo giá 85k, Combo Couple giá 120k). Đây là định nghĩa sản phẩm tĩnh, không gắn liền với bất kỳ một khách hàng cụ thể nào.
    - Bảng `OrderCombos` mới là nơi lưu vết từng gói combo thực tế mà khách hàng đã trả tiền mua trong đơn hàng `#LMC-123`.
    - Trạng thái đã nhận hay chưa nhận (`isDelivered`) và thời điểm nhận (`deliveredAt`) là thuộc tính của từng gói hàng cụ thể trong đơn, do đó bắt buộc phải đặt tại `OrderCombos` để theo dõi chính xác từng giao dịch.

---

### Câu 73: Trong Sơ đồ Tuần tự 15 (`15_giao_nhan_combo_online.puml`), việc giao nhận combo có cần thông tin về vị trí ghế ngồi hay giờ chiếu của bộ phim không? Quy chế BR-05 trong SRS khẳng định điều gì?
- **Trọng tâm soi lỗi của Giảng viên:** Tính độc lập của dữ liệu (Data Decoupling) giữa Dịch vụ F&B và Dịch vụ Phòng chiếu.
- **Câu trả lời chuẩn phản biện:**
  - **Câu trả lời:** **HOÀN TOÀN KHÔNG CẦN THÔNG TIN GHẾ HAY GIỜ CHIẾU**.
  - **Căn cứ trên Sequence Diagram 15 & Quy chế BR-05:**
    - Nhân viên quầy bắp nước chỉ cần duy nhất **Mã đơn hàng (Order Code)** để tra cứu danh sách các món cần chuẩn bị (Ví dụ: 1 bắp phô mai lớn + 2 ly Coca).
    - Quy chế BR-05 khẳng định: *"Nhận combo độc lập hoàn toàn với việc soát vé vào rạp; không giao trùng combo"*.
    - Thiết kế này giúp quầy bắp nước vận hành đơn giản, tập trung vào tốc độ pha chế đồ uống mà không cần quan tâm khách ngồi ghế nào hay xem phim gì.

---

### Câu 74: Nếu một khách hàng đến rạp đúng vào thời điểm phim đã chiếu được 20 phút, Sơ đồ Hoạt động 08 sẽ dẫn luồng điều khiển qua nhánh hợp lệ hay nhánh từ chối? Tại sao?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng tính toán thời gian thực tế dựa trên điều kiện của Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Luồng điều khiển:** Dẫn qua **NHÁNH HỢP LỆ (HỢP THỨC HÓA CHECK-IN THÀNH CÔNG)**.
  - **Lý giải dựa trên điều kiện sơ đồ `08_soat_ve.puml`:**
    - Điều kiện canh gác thời gian là:
      $$	ext{startTime} - 30	ext{ phút} \le 	ext{Thời gian quét} \le 	ext{endTime}$$
    - Thời điểm khách đến là $	ext{startTime} + 20	ext{ phút}$.
    - Vì một bộ phim chiếu rạp thông thường kéo dài từ 90 đến 150 phút, nên thời điểm sau 20 phút vẫn nằm trọn vẹn trong khoảng thời gian diễn ra suất chiếu ($	ext{startTime} + 20	ext{ phút} < 	ext{endTime}$).
    - Hệ thống chuyển vé sang `Used` và chúc khách hàng xem phim vui vẻ, đảm bảo quyền lợi của khách hàng đã trả tiền mua vé trọn gói.

---

## PHẦN 7: PHÂN HỆ HỦY VÉ & ĐỀN BÙ / HOÀN TIỀN MẶT (CANCELLATION & REFUND) (10 CÂU)
*(Tập trung vào Use Case UC_CancelSelf, UC_StaffCancel; Activity Diagrams 10, 11; Sequence Diagrams 17, 18; State state_ticket.puml; Quy chế BR-03, BR-04 & Yêu cầu FR-CAN-01 -> 03)*

---

### Câu 75: Trên Sơ đồ Use Case tổng quát, Use Case "Tự hủy vé online" và Use Case "Hủy vé sự cố quầy & Hoàn tiền mặt" do 2 Actor khác nhau thực hiện. Tại sao khách hàng không được tự hủy vé do sự cố trên giao diện Web?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ thẩm quyền xác nhận sự cố (Incident Verification Authority) và phân định quyền hạn tác nhân trong SRS.
- **Câu trả lời chuẩn phản biện:**
  - **Phân định quyền hạn trên Sơ đồ Use Case:**
    - Use Case `Tự hủy vé online`: Do `Customer` thực hiện (áp dụng khi khách đổi kế hoạch cá nhân, bồi hoàn voucher 50%).
    - Use Case `Hủy vé sự cố rạp & Hoàn tiền mặt`: Chỉ do `Staff` hoặc `Admin` thực hiện (hoàn 100% tiền mặt).
  - **Tại sao khách không được tự bấm hủy do sự cố:**
    - "Sự cố rạp" (mất điện, cháy bóng đèn máy chiếu, ngập nước) là sự cố khách quan xuất phát từ phía cơ sở vật chất của rạp. Chỉ có Ban quản trị hoặc Nhân viên kỹ thuật tại rạp mới có thẩm quyền xác minh và công bố sự cố này.
    - Nếu cho phép khách hàng tự chọn lý do "Hủy do sự cố rạp" trên web, bất kỳ khách hàng nào muốn hủy vé sát giờ cũng sẽ tích chọn lý do này để đòi hoàn 100% tiền mặt thay vì chịu mất 50% theo quy chế, dẫn đến việc rạp bị trục lợi nghiêm trọng.

---

### Câu 76: Trong Sơ đồ Trạng thái của Vé (`state_ticket.puml`), hãy phân tích hai trạng thái con của trạng thái `Cancelled`: `PendingRefund` (Chờ hoàn tiền mặt 100%) và `ClientCancelled` (Đã cấp Voucher 50%)? Chúng khác nhau về mặt tài chính như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng mô hình hóa Trạng thái phức hợp (Composite State / Substates) và bản chất dòng tiền tài chính trên State Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Phân tích 2 trạng thái con trên `state_ticket.puml`:**
    1. Trạng thái con `ClientCancelled (HUY_BOI_KHACH)`:
       - *Kích hoạt khi:* Khách tự hủy vé trước giờ chiếu $\ge 2$ tiếng.
       - *Bản chất tài chính:* **Không phát sinh dòng tiền chi trả**. Hệ thống chỉ sinh mã Voucher 50% lưu vào bảng `coupons`. Toàn bộ số tiền khách đã trả trước đó vẫn nằm nguyên trong tài khoản rạp. Trạng thái kết thúc ngay lập tức (`ClientCancelled --> [*]`).
    2. Trạng thái con `PendingRefund (PENDING_CASH_REFUND)`:
       - *Kích hoạt khi:* Rạp gặp sự cố kỹ thuật hủy vé của khách.
       - *Bản chất tài chính:* **Ghi nhận một khoản nợ phải trả ngắn hạn (Công nợ 100%)**. Rạp có nghĩa vụ xuất quỹ tiền mặt trả lại cho khách khi khách xuất trình mã vé tại quầy trong vòng 30 ngày.

---

### Câu 77: Trong Sơ đồ Hoạt động Khách hủy vé (`10_khach_huy_ve.puml`), điều kiện canh gác thời gian hủy vé được biểu diễn như thế nào? Nếu thời gian hiện tại chỉ cách giờ chiếu 1 tiếng 30 phút thì luồng hoạt động rẽ nhánh ra sao?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng bắt lỗi điều kiện thời gian (Time-based Guard Condition) trên Activity Diagram theo quy chế BR-03.
- **Câu trả lời chuẩn phản biện:**
  - **Điều kiện canh gác trên sơ đồ `10_khach_huy_ve.puml`:**
    - Tại làn `Máy chủ xử lý`, xuất hiện hình thoi quyết định:
      `if (Thời gian cách giờ chiếu >= 2 tiếng?)`
  - **Luồng xử lý khi chỉ cách giờ chiếu 1 tiếng 30 phút (Nhánh `Không`):**
    1. Máy chủ sinh mã lỗi `HTTP 400 Bad Request` kèm thông báo: *"Chính sách rạp chỉ cho phép tự hủy vé trước giờ chiếu ít nhất 2 tiếng. Hiện tại đã quá hạn hủy vé!"*.
    2. Chuyển sang làn `Giao diện`: Tắt modal xác nhận hủy và hiển thị thông báo lỗi cảnh báo màu vàng.
    3. Vé của khách vẫn giữ nguyên trạng thái `Valid`, chỗ ngồi vẫn được giữ nguyên để khách kịp đến rạp xem phim, và luồng hoạt động kết thúc tại điểm dừng (`Flow Final`).

---

### Câu 78: Trong Sơ đồ Tuần tự 17 (`17_khach_huy_ve_nhan_voucher.puml`), sau khi vé chuyển sang `Cancelled`, đối tượng Entity DB tự động sinh ra bản ghi gì trong bảng `Coupons`? Cấu trúc mã voucher và thời hạn dùng theo quy chế BR-03 là gì?
- **Trọng tâm soi lỗi của Giảng viên:** Cơ chế sinh mã tự động (Auto-generation Workflow) và tính liên kết dữ liệu giữa bảng `Tickets` và bảng `Coupons`.
- **Câu trả lời chuẩn phản biện:**
  - **Bản ghi tự sinh trong bảng `Coupons` (Bước 8 trên Sequence Diagram 17):**
    - Hệ thống tạo một bản ghi mã giảm giá mới với các thuộc tính:
      - `code`: Mã định dạng `COMP50_[ticketId]_[random6chars]` (Ví dụ: `COMP50_105_9F2B1A`).
      - `discountType`: `Percentage` (Phần trăm).
      - `discountValue`: `50` (Giảm 50% cho 1 vé mới).
      - `userId`: Gán cứng bằng `userId` của khách hàng hủy vé (khóa chính chủ).
      - `maxUsage`: `1` (Chỉ dùng được 1 lần duy nhất).
      - `expiryDate`: `NOW() + 30 ngày` (Hạn sử dụng cố định 30 ngày).
  - Dữ liệu này được gửi kèm qua email thông báo cho khách hàng qua dịch vụ Nodemailer.

---

### Câu 79: Trong Sơ đồ Hoạt động Rạp hủy vé sự cố (`11_rap_huy_ve_hoan_tien.puml`), quy trình gồm 2 giai đoạn độc lập: Giai đoạn 1 (Tiếp nhận sự cố & Ghi nhận công nợ) và Giai đoạn 2 (Chi trả tiền mặt tại quầy). Tại sao không gộp 2 giai đoạn này làm một?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ tính chất phi đồng bộ thời gian (Temporal Discontinuity) giữa thời điểm phát sinh sự cố và thời điểm đối soát chi quỹ.
- **Câu trả lời chuẩn phản biện:**
  - **Lý do bắt buộc phải tách làm 2 giai đoạn độc lập:**
    - *Giai đoạn 1 (Thời điểm xảy ra sự cố):* Diễn ra ngay khi máy chiếu hỏng hoặc rạp mất điện. Lúc này Quản lý rạp phải thao tác hủy hàng loạt vé của cả phòng chiếu trên phần mềm để dừng bán vé ngay lập tức và ghi nhận trạng thái `Chờ hoàn tiền`.
    - *Giai đoạn 2 (Thời điểm hoàn tiền):* Khách hàng không thể có mặt cùng lúc để nhận tiền ngay. Nhiều khách đặt online đang ở nhà, hoặc khách xem suất tối muộn hôm sau mới quay lại rạp nhận tiền. Khách có thời hạn tới **30 ngày** để đến rạp.
    - Việc tách thành 2 giai đoạn độc lập trên Sơ đồ Hoạt động 11 phản ánh chính xác 100% nghiệp vụ quản lý công nợ và kiểm soát quỹ tiền mặt ngoài đời thực.

---

### Câu 80: Trong Sơ đồ Tuần tự 18 (`18_huy_ve_su_co_hoan_tien_mat.puml`), tại sao lại có sự xuất hiện của đối tượng "Quỹ tiền mặt rạp (Cash Drawer)"? Khách hàng xuất trình thông tin gì để nhận lại tiền mặt 100%?
- **Trọng tâm soi lỗi của Giảng viên:** Mô hình hóa luồng vật lý (Physical Cash Handling) bên cạnh luồng phần mềm trên Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa của đối tượng `Cash Drawer (Quỹ tiền mặt rạp)`:**
    - Tiền hoàn sự cố trong Phase 1 là **tiền mặt vật lý** lấy ra từ ngăn kéo két thu ngân của rạp.
    - Đối tượng `Cash Drawer` biểu diễn hành động thực tế của nhân viên thu ngân: Xuất tiền mặt trao tận tay cho khách sau khi phần mềm đã đóng dấu chứng từ kế toán.
  - **Thông tin khách hàng xuất trình để nhận tiền:**
    - Khách hàng xuất trình: **Mã vé điện tử `#LMC-XXXXXX`** trên điện thoại kèm **CCCD/Số điện thoại** trùng khớp với thông tin đặt vé để nhân viên đối chiếu trên màn hình tra cứu trước khi xuất tiền.

---

### Câu 81: Quy định thời hạn 30 ngày để nhận tiền hoàn mặt trong SRS (BR-04) được thể hiện ở điều kiện canh gác nào trên Sơ đồ Trạng thái và Sơ đồ Tuần tự 18? Quá 30 ngày thì luồng xử lý thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Kiểm soát thời hiệu khiếu nại (Expiration of Claims) trên các sơ đồ UML.
- **Câu trả lời chuẩn phản biện:**
  - **Thể hiện trên Sơ đồ Trạng thái `state_ticket.puml`:**
    - Mũi tên: `Cancelled --> REFUNDED_CASH : [Trong vòng 30 ngày kể từ ngày hủy]`.
  - **Thể hiện trên Sequence Diagram 18:**
    - Tại bước kiểm tra điều kiện của Control API:
      `alt (Thời gian yêu cầu hoàn tiền > 30 ngày kể từ ngày hủy)`
    - Control API trả về: `400 Bad Request { message: "Đã quá thời hạn 30 ngày nhận hoàn tiền theo quy chế rạp!" }`.
    - Giao diện khóa nút "Xác nhận trả tiền mặt".
    - Khoản công nợ này được kế toán kết chuyển sang tài khoản thu nhập khác của rạp.

---

### Câu 82: Trên ERD (SRS Mục 6.5), bảng `Tickets` có trường `cancellationReason`, `refundStatus`, và `refundAmount`. Ý nghĩa của từng trường này trong việc phục vụ đối soát kế toán tài chính là gì?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng giải thích mục đích thiết kế các trường kiểm toán (Audit Fields) trong bảng thực thể vé.
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa 3 trường trên ERD:**
    1. `cancellationReason` (Text): Lưu lý do hủy vé (Ví dụ: *"Khách tự hủy trước 2h"* hoặc *"Sự cố hỏng bóng đèn máy chiếu phòng 2"*). Đây là căn cứ phân loại hình thức đền bù (cấp voucher hay trả tiền mặt).
    2. `refundStatus` (Enum: `NONE`, `PENDING_CASH_REFUND`, `REFUNDED_CASH`): Trạng thái giải quyết công nợ. Giúp kế toán lọc ra chính xác những vé nào còn đang nợ tiền khách chưa trả và vé nào đã xuất quỹ trả xong.
    3. `refundAmount` (Decimal): Lưu chính xác số tiền cần hoàn lại (đúng bằng số tiền thực trả của chiếc vé). Trường này giúp kế toán không phải tính toán lại khi xuất quỹ, tránh nhầm lẫn số liệu.

---

### Câu 83: Trong Sơ đồ Hoạt động 10, khi khách hàng tự hủy vé xem phim, các gói combo bắp nước đi kèm trong đơn hàng có bị hủy không? Ghế ngồi được giải phóng như thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Tính nhất quán giữa luồng xử lý ghế, vé và hàng hóa kèm theo trong Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `10_khach_huy_ve.puml`:**
    - Tại làn `Cơ sở dữ liệu (PostgreSQL)`:
      1. Bản ghi vé chuyển sang `status = 'Cancelled'`.
      2. Bản ghi ghế tương ứng được kích hoạt hành động: *"Cập nhật trạng thái ghế về EMPTY"* ngay lập tức để người khác có thể đặt mua.
      3. **Đối với Combo bắp nước:** Sơ đồ ghi chú rõ: *"Combo bắp nước trong đơn hàng giữ nguyên hiệu lực theo mã đơn; khách hàng vẫn có quyền đến quầy nhận bắp nước bình thường"*. Không hề có hành động hủy hay hoàn tiền combo trong luồng này.

---

### Câu 84: Nếu một khách hàng mua 4 vé trong cùng một đơn hàng, Sơ đồ Tuần tự 17 cho phép hủy từng chiếc vé lẻ hay bắt buộc phải hủy toàn bộ đơn 4 vé? Thao tác này ảnh hưởng thế nào đến bản ghi trong bảng `Payments`?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng xử lý hủy chi tiết từng dòng hàng (Line-item Cancellation) và bảo toàn bản ghi thanh toán gốc.
- **Câu trả lời chuẩn phản biện:**
  - **Khả năng đáp ứng:** Cho phép **HỦY TỪNG CHIẾC VÉ LẺ ĐỘC LẬP** (Yêu cầu FR-CAN-01).
  - **Thể hiện trên Sequence Diagram 17:**
    - Tham số truyền vào API là `ticket_id` của chiếc vé cụ thể, không phải `payment_id`.
    - Chỉ duy nhất chiếc vé có `ticket_id` đó chuyển sang `Cancelled` và chiếc ghế tương ứng chuyển về `EMPTY`. Ba chiếc vé còn lại vẫn giữ nguyên trạng thái `Valid`.
  - **Ảnh hưởng đến bảng `Payments`:**
    - Bản ghi `Payments` gốc **GIỮ NGUYÊN 100%** (không sửa đổi `amount` hay `status`) để làm chứng từ đối soát lịch sử giao dịch tiền đã thanh toán qua ngân hàng đối tác. Tính toàn vẹn của hóa đơn gốc được bảo toàn trọn vẹn.

---

## PHẦN 8: PHÂN HỆ QUẢN LÝ VOUCHER & CHIẾN DỊCH GIẢM GIÁ (06 CÂU)
*(Tập trung vào Use Case UC_VoucherMgmt; Activity Diagram 12; Sequence Diagrams 09, 30 -> 33; Thực thể Coupons trên ERD & Quy chế BR-07, BR-08, FR-VOU-01 -> 03)*

---

### Câu 85: Trên ERD (SRS Mục 6.5), bảng `Coupons` có trường `applicableMovieId` (Nullable) và trường `userId` (Nullable). Hãy giải thích sự khác biệt giữa hai trường này khi liên kết với các thực thể khác?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ thiết kế thuộc tính ngoại (Nullable Foreign Keys) để phục vụ 2 mục đích nghiệp vụ khác nhau trong cùng một thực thể Voucher.
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa trường `applicableMovieId` (Khóa ngoại tham chiếu `Movies`):**
    - Đại diện cho **Phạm vi áp dụng của Voucher theo phim**.
    - Nếu `applicableMovieId == NULL`: Voucher áp dụng cho **tất cả mọi bộ phim** đang chiếu tại rạp (Voucher toàn sàn).
    - Nếu `applicableMovieId == 12`: Voucher chỉ có giá trị khi khách mua vé của **đúng bộ phim có ID = 12** (Voucher hợp tác quảng bá cho một phim bom tấn cụ thể).
  - **Ý nghĩa trường `userId` (Khóa ngoại tham chiếu `Users`):**
    - Đại diện cho **Quyền sở hữu cá nhân của Voucher**.
    - Nếu `userId == NULL`: Là Voucher khuyến mãi công khai của Admin, bất kỳ khách hàng nào nhập mã cũng có thể sử dụng (cho đến khi hết `maxUsage`).
    - Nếu `userId == 15`: Là **Voucher bồi hoàn 50% tự sinh** khi khách hàng ID 15 hủy vé sự cố trước đó. Chỉ duy nhất tài khoản người dùng ID 15 mới có quyền áp dụng mã này khi thanh toán.

---

### Câu 86: Trong Sơ đồ Tuần tự 09 (`09_ap_dung_voucher.puml`), quy trình kiểm tra mã voucher được đối tượng Control thực hiện qua những điều kiện nào (Hạn dùng, số lượt dùng tối đa, đơn tối thiểu)?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng đọc hiểu chi tiết chuỗi kiểm tra logic (Validation Pipeline) trong Sequence Diagram 09.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu Sequence Diagram 09 (Các bước kiểm tra của Control):**
    1. *Kiểm tra tồn tại:* Mã voucher có tồn tại trong CSDL hay không (`coupon != null`).
    2. *Kiểm tra thời hạn:* `expiryDate >= NOW()` (Voucher còn trong thời gian hiệu lực).
    3. *Kiểm tra số lượt dùng:* `usedCount < maxUsage` (Voucher chưa bị sử dụng hết số lượng phát hành).
    4. *Kiểm tra giá trị đơn hàng tối thiểu:* $\sum 	ext{Tiền vé} \ge 	ext{minAmount}$.
    5. *Kiểm tra phim hợp lệ:* Nếu có `applicableMovieId`, kiểm tra đơn hàng có chứa vé của phim đó không.
    6. *Kiểm tra chính chủ:* Nếu có `userId`, kiểm tra `coupon.userId === session.user.id`.
  - Nếu thỏa mãn toàn bộ: Trả về số tiền chiết khấu hợp lệ. Nếu vi phạm bất kỳ điều kiện nào: Rẽ nhánh `alt` trả về lỗi và thông điệp giải thích tương ứng.

---

### Câu 87: Trong Sơ đồ Hoạt động 12 (`12_quan_ly_voucher.puml`), khi Admin tạo mới một chiến dịch Voucher, những trường thông tin bắt buộc nào được hệ thống kiểm tra tính hợp lệ?
- **Trọng tâm soi lỗi của Giảng viên:** Khả năng kiểm tra tính hợp thức của dữ liệu đầu vào (Input Validation) trên Activity Diagram quản trị.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `12_quan_ly_voucher.puml`:**
    - Tại làn `Máy chủ xử lý`, trước khi ghi bản ghi vào CSDL, hệ thống kiểm tra:
      1. `Mã voucher (code)`: Bắt buộc, không được trùng lặp với các mã đã có trong CSDL.
      2. `Loại giảm giá (discountType)`: Phải là `Percentage` (Phần trăm) hoặc `FixedAmount` (Số tiền cố định).
      3. `Giá trị giảm (discountValue)`: Phải $> 0$ (Nếu là phần trăm thì $1 \le 	ext{discountValue} \le 100$).
      4. `Ngày hết hạn (expiryDate)`: Phải lớn hơn ngày hiện tại (`expiryDate > NOW()`).
      5. `Số lượt dùng tối đa (maxUsage)`: Phải là số nguyên dương $\ge 1$.

---

### Câu 88: Quy tắc nghiệp vụ BR-07 trong SRS quy định: "Mỗi đơn hàng chỉ được sử dụng tối đa 1 voucher và giảm giá chỉ áp dụng trên tiền vé". Sơ đồ Hoạt động 05 và Sequence Diagram 09 thể hiện quy tắc này ở bước nào?
- **Trọng tâm soi lỗi của Giảng viên:** Tính nhất quán giữa Quy chế nghiệp vụ (Business Rule) và các bước tính toán trên sơ đồ UML.
- **Câu trả lời chuẩn phản biện:**
  - **Thể hiện trên Sequence Diagram 09 & Activity Diagram 05:**
    - Tại bước tính toán số tiền giảm giá:
      $$	ext{Số tiền giảm} = \min(	ext{Giá trị Voucher}, \sum 	ext{Tiền vé xem phim})$$
    - Hệ thống **tách riêng biệt** tổng tiền vé và tổng tiền bắp nước combo. Số tiền giảm giá chỉ được trừ thẳng vào tổng tiền vé, không bao giờ được trừ lấn sang phần tiền combo bắp nước.
    - Trên giao diện chỉ có duy nhất 1 ô nhập mã Voucher. Khi đã áp dụng thành công 1 mã, ô nhập liệu bị khóa lại và hiển thị nút "Hủy áp dụng", ngăn chặn việc người dùng nhập thêm mã thứ hai.

---

### Câu 89: Trong Sơ đồ Tuần tự 33 (`33_ngung_su_dung_voucher.puml`), khi Admin ngừng kích hoạt một mã voucher trước thời hạn, các đơn hàng đã áp dụng thành công mã này trong quá khứ có bị ảnh hưởng không? Tại sao?
- **Trọng tâm soi lỗi của Giảng viên:** Tính toàn vẹn của dữ liệu lịch sử giao dịch (Historical Transaction Integrity) khi cấu hình hệ thống thay đổi.
- **Câu trả lời chuẩn phản biện:**
  - **Câu trả lời:** Các đơn hàng trong quá khứ **HOÀN TOÀN KHÔNG BỊ ẢNH HƯỞNG**.
  - **Lý giải kỹ thuật trên Sequence Diagram 33:**
    - Thao tác ngừng sử dụng voucher chỉ cập nhật thuộc tính trong bảng `Coupons` (ví dụ gán `expiryDate = NOW()` hoặc chuyển cờ `isActive = false`).
    - Các đơn hàng đã thanh toán trong quá khứ đã được chốt sổ lưu vào bảng `Payments` và số tiền thực trả của từng chiếc vé đã được cố định trong bảng `Tickets(price)`.
    - Hệ thống không thực hiện bất kỳ câu lệnh cập nhật hồi tố (Retroactive Update) nào lên các bảng giao dịch cũ, đảm bảo số liệu báo cáo kế toán tháng trước không bị biến động.

---

### Câu 90: Trên ERD, mối quan hệ giữa bảng `Coupons` và bảng `Users` khi một User bị xóa khỏi hệ thống là `ON DELETE CASCADE` hay `RESTRICT`? Điều này đảm bảo quy tắc gì cho voucher bồi hoàn?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ hành vi của Ràng buộc Khóa ngoại (Foreign Key Referential Actions) trên lược đồ quan hệ ERD.
- **Câu trả lời chuẩn phản biện:**
  - **Ràng buộc trên ERD (SRS Mục 6.5 & Prisma Schema):**
    - Mối quan hệ giữa `Coupons` và `Users` được thiết lập là **`ON DELETE CASCADE`**.
  - **Lý giải nghiệp vụ:**
    - Khóa ngoại `user_id` trong bảng `Coupons` chỉ tồn tại đối với các **Voucher bồi hoàn cá nhân**.
    - Nếu một tài khoản khách hàng bị xóa vĩnh viễn khỏi hệ thống (ví dụ khách yêu cầu xóa dữ liệu cá nhân theo luật GDPR), các voucher bồi hoàn gắn riêng cho khách hàng đó cũng không còn đối tượng sử dụng nữa, do đó việc tự động xóa theo dây chuyền (`CASCADE`) giúp giải phóng rác trong CSDL mà không làm ảnh hưởng đến các bảng dữ liệu khác.

---

## PHẦN 9: PHÂN HỆ QUẢN TRỊ PHIM & ĐIỀU PHỐI SUẤT CHIẾU (06 CÂU)
*(Tập trung vào Sơ đồ Use Case UC_MovieMgmt, UC_ScreeningMgmt; Activity Diagrams 13, 14, 15; Sequence Diagrams 21 -> 24, 34 -> 37; State state_movie, state_screening & Quy chế BR-08)*

---

### Câu 91: Trong Sơ đồ Trạng thái của Phim (`state_movie.puml`), phim có những trạng thái nào (`UPCOMING`, `SHOWING`, `ENDED`)? Tại sao không có trạng thái `DELETED`? Quy tắc nghiệp vụ BR-08 trong SRS quy định thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Mô hình hóa cơ chế Xóa mềm (Soft Delete) trên State Diagram và quy chế toàn vẹn lịch sử phim.
- **Câu trả lời chuẩn phản biện:**
  - **Các trạng thái trên `state_movie.puml`:**
    1. `UPCOMING` (Sắp chiếu): Phim đã nhập thông tin lên hệ thống, chuẩn bị mở bán vé.
    2. `SHOWING` (Đang chiếu): Phim đang có các suất chiếu phục vụ khán giả tại rạp.
    3. `ENDED` (Ngừng chiếu): Phim đã kết thúc đợt phát hành tại rạp.
  - **Tại sao không có trạng thái `DELETED` (Căn cứ BR-08):**
    - Quy chế BR-08 (SRS Mục 7) quy định: *"Phim đã từng phát sinh suất chiếu hoặc có giao dịch vé tuyệt đối không được xóa khỏi cơ sở dữ liệu. Chỉ cho phép chuyển trạng thái sang Ngừng chiếu (ENDED)"*.
    - Nếu xóa vật lý bộ phim, toàn bộ vé xem phim cũ và báo cáo doanh thu phim trong quá khứ sẽ bị mất liên kết. Do đó trạng thái kết thúc của vòng đời một bộ phim là `ENDED`, phim bị ẩn khỏi web nhưng dữ liệu lịch sử được lưu trữ vĩnh viễn.

---

### Câu 92: Trong Sơ đồ Hoạt động 14 (`14_quan_ly_suat_chieu.puml`), thuật toán kiểm tra chống trùng lịch chiếu trong cùng một phòng được biểu diễn qua điều kiện nào?
- **Trọng tâm soi lỗi của Giảng viên:** Năng lực biểu diễn thuật toán phát hiện xung đột tài nguyên (Resource Conflict Detection) trên Activity Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Đối chiếu sơ đồ `14_quan_ly_suat_chieu.puml`:**
    - Tại làn `Máy chủ xử lý`, sau khi Admin nhập giờ bắt đầu chiếu (`startTime`) và chọn phòng chiếu (`roomNumber`):
    - Máy chủ tự động tính: $	ext{endTime} = 	ext{startTime} + 	ext{Thời lượng phim} + 15	ext{ phút dọn dẹp}$.
    - Xuất hiện khối rẽ nhánh: `if (Khung giờ bị trùng lặp với suất chiếu khác trong cùng phòng?)`.
    - *Nhánh `Có`:* Sinh lỗi `HTTP 409 Conflict: Trùng lịch chiếu trong phòng`, hiển thị cảnh báo đỏ trên giao diện và yêu cầu Admin chọn lại giờ hoặc phòng khác.
    - *Nhánh `Không`:* Tiếp tục luồng tạo suất chiếu và khởi tạo 50 ghế ngồi.

---

### Câu 93: Trong Sơ đồ Tuần tự 35 (`35_them_suat_chieu.puml`), khi một suất chiếu mới được tạo thành công, đối tượng Entity DB tự động sinh ra những bản ghi nào trong bảng `Seats`? Bản số là bao nhiêu?
- **Trọng tâm soi lỗi của Giảng viên:** Mối quan hệ giữa sự kiện tạo suất chiếu và việc sinh dữ liệu ghế ngồi tự động trong CSDL.
- **Câu trả lời chuẩn phản biện:**
  - **Bản ghi tự sinh trên Sequence Diagram 35 (Bước 9):**
    - Ngay sau khi bản ghi `Screening` được tạo:
    - Đối tượng `Entity DB` thực hiện một giao dịch nguyên tử chèn đồng loạt **50 bản ghi ghế ngồi (Seats)** tương ứng với cấu hình chuẩn của rạp:
      - 5 hàng dọc: Từ `A` đến `E`.
      - 10 cột ngang: Từ `1` đến `10`.
      - Mã ghế (`code`): Từ `A1` đến `E10`.
      - Trạng thái mặc định: `status = 'EMPTY'`, `reserved_until = NULL`.
  - **Bản số (Cardinality):** Đúng **50 bản ghi** ghế cho mỗi một suất chiếu mới, đảm bảo tính sẵn sàng cho khách hàng vào chọn chỗ.

---

### Câu 94: Trong Sơ đồ Trạng thái Suất chiếu (`state_screening.puml`), khi nào một suất chiếu chuyển từ `UPCOMING` sang `CANCELLED`? Sự kiện này kích hoạt những tác động dây chuyền nào trong Sơ đồ Hoạt động 15?
- **Trọng tâm soi lỗi của Giảng viên:** Xử lý sự cố bất thường (Abnormal Incident Handling) và hiệu ứng dây chuyền giữa các thực thể trên sơ đồ.
- **Câu trả lời chuẩn phản biện:**
  - **Sự kiện kích hoạt trên `state_screening.puml`:**
    - Suất chiếu chuyển sang `CANCELLED` khi xảy ra sự cố phòng chiếu nghiêm trọng (mất điện, cháy máy chiếu) và Quản trị viên kích hoạt chức năng **"Hủy suất chiếu khẩn cấp do sự cố"**.
  - **Tác động dây chuyền trong Sơ đồ Hoạt động 15 (`15_huy_suat_chieu_khan_cap.puml`):**
    1. Đóng cổng bán vé của suất chiếu đó trên toàn hệ thống web và quầy POS.
    2. Cập nhật tất cả các vé chưa dùng của suất chiếu đó chuyển sang trạng thái `Cancelled`.
    3. Tự động thiết lập công nợ `refundStatus = PENDING_CASH_REFUND` (Hoàn 100% tiền mặt) cho từng chiếc vé.
    4. Kích hoạt dịch vụ Nodemailer gửi email thông báo sự cố và lời xin lỗi kèm hướng dẫn nhận tiền hoàn đến tất cả khách hàng đã mua vé.

---

### Câu 95: Trên ERD, tại sao bảng `Screenings` lại có trường `room` và `room_number`? Mỗi phòng chiếu trong hệ thống Lumi Cinema có sức chứa bao nhiêu ghế và ký hiệu ra sao?
- **Trọng tâm soi lỗi của Giảng viên:** Đối chiếu giữa thuộc tính mô hình dữ liệu ERD và quy mô vật lý thực tế của rạp trong SRS Mục 1.2.
- **Câu trả lời chuẩn phản biện:**
  - **Ý nghĩa trường dữ liệu:**
    - `room_number` (Int): Số thứ tự phòng (từ 1 đến 5), dùng để lập chỉ mục tìm kiếm và chạy thuật toán chống trùng phòng.
    - `room` (VarChar): Tên hiển thị thân thiện trên vé và giao diện (Ví dụ: `"Phòng 1"`, `"Phòng VIP 2"`).
  - **Quy mô và ký hiệu phòng chiếu (SRS Mục 1.2):**
    - Hệ thống phục vụ cụm rạp đơn gồm **5 phòng chiếu tiêu chuẩn**.
    - Mỗi phòng có sức chứa cố định là **50 ghế đơn**.
    - Sơ đồ ma trận 5 hàng (A -> E) và 10 cột (1 -> 10), ký hiệu từ `A1` đến `E10`.

---

### Câu 96: Trong Sơ đồ Hoạt động 13 (`13_quan_ly_phim.puml`), khi cập nhật thông tin phim, nhãn độ tuổi (P, C13, T18) được ràng buộc như thế nào để phục vụ phân loại vé?
- **Trọng tâm soi lỗi của Giảng viên:** Tính liên thông dữ liệu giữa Phân hệ Quản lý Phim và Phân hệ Bán vé trong tài liệu đặc tả.
- **Câu trả lời chuẩn phản biện:**
  - **Ràng buộc trên sơ đồ `13_quan_ly_phim.puml`:**
    - Trường `age_rating` là trường bắt buộc, chỉ nhận một trong các giá trị chuẩn quy định bởi Cục Điện ảnh: `P`, `C13`, `C16`, `T18`.
    - Thuộc tính này đóng vai trò là cờ điều khiển nghiệp vụ (Business Flag):
      - Khi một bộ phim được gán nhãn `T18` hoặc `C13`: Hệ thống tự động kích hoạt luật nghiệp vụ BR-02 khóa tính năng bán vé Trẻ em (Child) đối với tất cả các suất chiếu của bộ phim đó trên cả kênh Online lẫn quầy POS.

---

## PHẦN 10: PHÂN HỆ ĐÁNH GIÁ PHIM & QUẢN LÝ KHO COMBO (04 CÂU)
*(Tập trung vào Use Case UC_Review, UC_ComboMgmt; Activity Diagrams 04, 16; Sequence Diagrams 19, 20, 25 -> 29; State state_combo.puml; Thực thể Reviews, Combos & Quy chế BR-06)*

---

### Câu 97: Trên Sơ đồ Use Case tổng quát, Use Case "Đánh giá & Bình luận phim" chỉ nối tới Actor Customer. Khách hàng có bắt buộc phải mua vé xem phim đó trước mới được đánh giá không? Quy chế BR-06 trong SRS quy định ra sao?
- **Trọng tâm soi lỗi của Giảng viên:** Hiểu rõ quyết định nghiệp vụ mở rộng cộng đồng trong SRS và ranh giới điều kiện tiên quyết của Use Case.
- **Câu trả lời chuẩn phản biện:**
  - **Căn cứ Quy chế BR-06 (SRS Mục 7 & FR-REV-01):**
    - Khách hàng **KHÔNG BẮT BUỘC PHẢI MUA VÉ XEM PHIM TRƯỚC**.
    - Điều kiện duy nhất: Khách hàng chỉ cần có tài khoản và đăng nhập thành công vào hệ thống là có quyền gửi đánh giá (từ 1 đến 5 sao) và viết nhận xét (tối đa 1000 ký tự) cho bất kỳ bộ phim nào.
  - **Lý giải nghiệp vụ:**
    - Lumi Cinema định hướng phát triển trang web thành một cổng thông tin điện ảnh tương tác cộng đồng. Khán giả có thể đã xem phim ở rạp khác, xem qua các liên hoan phim quốc tế hoặc xem phim cũ muốn vào chia sẻ cảm nghĩ. Việc không ràng buộc vé giúp tăng lượng tương tác và nội dung thảo luận trên nền tảng.

---

### Câu 98: Trong Sơ đồ Tuần tự 19 (`19_khach_danh_gia_phim.puml`), nếu một khách hàng đã từng gửi đánh giá 4 sao cho phim "Mai", nay vào đánh giá lại 5 sao, hệ thống tạo bản ghi mới hay cập nhật bản ghi cũ? Trên ERD quan hệ giữa `Users` và `Reviews` thể hiện điều này thế nào?
- **Trọng tâm soi lỗi của Giảng viên:** Tính duy nhất của dữ liệu (Unique Constraint) và cơ chế Cập nhật đè (Upsert Logic) trên Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Cơ chế xử lý trên Sequence Diagram 19 (Bước 6):**
    - Hệ thống **CẬP NHẬT ĐÈ LÊN BẢN GHI CŨ (UPDATE)**, tuyệt đối không tạo thêm bản ghi thứ hai.
    - Control API tìm kiếm bản ghi theo cặp `(userId, movieId)`:
      - Nhận thấy đã tồn tại bản ghi đánh giá 4 sao trước đó: Thực hiện lệnh cập nhật `rating = 5` và `updatedAt = NOW()`.
  - **Thể hiện trên ERD:**
    - Mỗi cặp `(userId, movieId)` trong bảng `Reviews` là duy nhất (`UNIQUE(user_id, movie_id)`). Điều này đảm bảo mỗi khách hàng chỉ có duy nhất 1 lượt bình chọn cho một bộ phim, ngăn chặn tình trạng một người spam chấm 5 sao nhiều lần để đẩy điểm ảo cho phim.

---

### Câu 99: Trong Sơ đồ Hoạt động 04 (`04_danh_gia_phim.puml`), điểm đánh giá trung bình của phim (`rating`) được tính toán lại tại thời điểm nào và cập nhật vào thực thể nào trên ERD?
- **Trọng tâm soi lỗi của Giảng viên:** Tính đồng bộ của thuộc tính dẫn xuất (Derived Attribute Synchronization) trên Activity Diagram và ERD.
- **Câu trả lời chuẩn phản biện:**
  - **Thời điểm tính toán lại:**
    - Ngay lập tức tại thời điểm bản ghi đánh giá mới được lưu hoặc chỉnh sửa thành công trong CSDL.
  - **Cập nhật trên ERD:**
    - Máy chủ tính toán trung bình cộng số sao của toàn bộ các review thuộc bộ phim đó, làm tròn đến 1 chữ số thập phân, sau đó cập nhật trực tiếp vào thuộc tính `rating` của thực thể **`Movies`** (Kiểu dữ liệu `Decimal(3, 1)`).
    - Việc lưu điểm trung bình trực tiếp vào bảng `Movies` giúp tăng tốc độ tải trang chủ (không phải tính lại trung bình cộng mỗi khi có người mở danh sách phim).

---

### Câu 100: Trong Sơ đồ Trạng thái Combo (`state_combo.puml`) và Sơ đồ Tuần tự 08 (`08_them_combo_vao_don_hang.puml`), số lượng tồn kho khả dụng (`stock`) được kiểm tra và giữ chỗ 10 phút như thế nào để tránh tình trạng bán vượt quá số lượng thực tế?
- **Trọng tâm soi lỗi của Giảng viên:** Cơ chế giữ chỗ tồn kho (Inventory Reservation Mechanism) phối hợp giữa State Diagram và Sequence Diagram.
- **Câu trả lời chuẩn phản biện:**
  - **Cơ chế kiểm soát tồn kho khả dụng:**
    1. Khi khách chọn 2 gói Combo Solo, Control API kiểm tra trong CSDL:
       $$	ext{Stock khả dụng} = 	ext{combos.stock} - \sum 	ext{combos đang bị giữ chỗ trong các phiên chưa hết hạn}$$
    2. Nếu $	ext{Stock khả dụng} \ge 2$: Hệ thống tạo bản ghi giữ chỗ trong bảng `combo_reservations` với `status = 'RESERVED'` và `reserved_until = NOW() + 10 phút`.
    3. *Nếu thanh toán thành công:* Cập nhật trừ trực tiếp vào `combos.stock = combos.stock - 2` và chuyển trạng thái giữ chỗ sang `COMPLETED`.
    4. *Nếu hết hạn 10 phút hoặc hủy đơn:* Bản ghi giữ chỗ tự động chuyển sang `RELEASED`, số lượng 2 gói combo lập tức quay trở lại tồn kho khả dụng cho người khác mua.
  - Cơ chế này đảm bảo rạp không bao giờ rơi vào tình trạng đã thu tiền của khách nhưng lại hết bắp nước để giao tại quầy.

---

## 🎯 5 KINH NGHIỆM "VÀNG" KHI PHẢN BIỆN BÁO CÁO GIỮA KỲ TRƯỚC HỘI ĐỒNG GIẢNG VIÊN

1. **Tuyệt đối không nói về code cú pháp hay thư viện lập trình:** Khi giảng viên hỏi về luồng xử lý, hãy dùng các thuật ngữ mô hình hóa: *"Dạ thưa Thầy/Cô, trên Sơ đồ Tuần tự X, thông điệp gọi từ Boundary sang Control..."* hoặc *"Trên Sơ đồ Hoạt động Y, luồng điều khiển rẽ nhánh qua khối quyết định..."*. Điều này khẳng định bạn làm chủ tư duy thiết kế phần mềm.
2. **Luôn bảo vệ tính nhất quán giữa SRS và Sơ đồ:** Khi giảng viên chất vấn một chi tiết (ví dụ: tại sao hủy vé trước 2 tiếng chỉ hoàn voucher 50%), hãy mở ngay tài liệu SRS mục **BR-03** và đối chiếu với Sơ đồ Trạng thái `state_ticket.puml` để chứng minh sự đồng bộ 100% từ yêu cầu tới mô hình.
3. **Phân biệt rạch ròi giữa các loại Sơ đồ UML:** Nắm chắc bản chất:
   - *Use Case:* Ai làm gì (Chức năng & Tác nhân).
   - *Activity Diagram:* Quy trình làm như thế nào (Luồng công việc & Rẽ nhánh điều kiện).
   - *Sequence Diagram:* Các đối tượng tương tác với nhau ra sao theo thời gian (Thông điệp & Tham số API).
   - *State Diagram:* Thực thể biến đổi trạng thái qua các sự kiện gì (Vòng đời & Điều kiện canh gác).
   - *ERD:* Dữ liệu lưu trữ ở đâu và quan hệ bản số như thế nào.
4. **Bảo vệ tính toàn vẹn và trung thực của dữ liệu:** Nhấn mạnh rằng hệ thống áp dụng kỹ thuật Soft Delete (không xóa cứng phim hay vé), phân tách rõ ràng giữa Doanh thu thực thu và Tiền công nợ chờ hoàn, đảm bảo đáp ứng chuẩn mực kiểm toán tài chính.
5. **Thái độ tự tin, khiêm tốn và cầu thị:** Lắng nghe trọn vẹn câu hỏi của giảng viên, ghi chép lại các điểm phản biện vào sổ tay, trả lời rành mạch, dứt khoát và cảm ơn những đóng góp quý báu của Hội đồng để hoàn thiện đồ án cho giai đoạn cuối kỳ.

---
*(Hết bộ tài liệu 100 câu hỏi bảo vệ giữa kỳ - Chúc nhóm bạn bảo vệ đồ án tự tin và đạt điểm tối đa!)*
