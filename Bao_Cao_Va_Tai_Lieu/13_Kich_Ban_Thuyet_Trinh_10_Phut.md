# KỊCH BẢN THUYẾT TRÌNH ĐỒ ÁN LUMICINEMA (~10 PHÚT)

> **Cấu trúc trình bày:**
> - **Giai đoạn 1 (0:00 – 4:00):** Mở trình duyệt tại `http://localhost:3000` — Demo trực tiếp giao diện & các chức năng của **Khách hàng $\rightarrow$ Nhân viên $\rightarrow$ Admin**.
> - **Giai đoạn 2 (4:00 – 10:00):** Mở file báo cáo `BaoCao_LumiCinema_Nhom10.docx` — Trình bày mạch lạc từng bộ sơ đồ từ **BFD $\rightarrow$ Use Case $\rightarrow$ Sequence $\rightarrow$ Activity $\rightarrow$ State $\rightarrow$ ERD/RDM $\rightarrow$ Class Diagram $\rightarrow$ Kết luận**.

---

## GIAI ĐOẠN 1: DEMO GIAO DIỆN & CHỨC NĂNG TRÊN `http://localhost:3000` (0:00 – 4:00)

### 0:00 – 0:40 | Mở đầu & Giới thiệu tổng quan
> *[Mở sẵn trình duyệt ở trang chủ `http://localhost:3000`]*
>
> "Em xin chào thầy/cô và các bạn. Em đại diện Nhóm 10 trình bày đồ án môn Phân tích và Thiết kế Hướng đối tượng với đề tài **Hệ thống quản lý bán vé xem phim LumiCinema**.
>
> Hệ thống được xây dựng bằng **Next.js, React 19, TypeScript**, cơ sở dữ liệu **PostgreSQL 16** quản lý qua **Prisma ORM** và đóng gói bằng **Docker Compose** (3 container: web, db, adminer).
>
> LumiCinema phục vụ **3 nhóm người dùng** là **Khách hàng, Nhân viên quầy và Admin** cho rạp có **5 phòng chiếu**, mỗi phòng **50 ghế từ A1 đến E10**. Trước tiên, em xin phép demo nhanh các giao diện và chức năng đang chạy thực tế trên hệ thống."

---

### 0:40 – 2:20 | Phân hệ Khách hàng (Đặt vé online, Combo, Voucher, Thanh toán, Hủy vé)
1. **Trang chủ (`/`) & Chi tiết phim (`/movies/[id]`):**
   > *[Cuộn trang chủ giới thiệu Banner, Bộ lọc phim, sau đó bấm vào 1 phim bất kỳ để vào trang Chi tiết phim]*
   >
   > "Đây là **Trang chủ** hiển thị danh sách phim Đang chiếu / Sắp chiếu, thanh tìm kiếm và lọc thể loại. Khi chọn vào một bộ phim, hệ thống hiển thị thông tin chi tiết, phần đánh giá 1–5 sao của khán giả và lịch suất chiếu theo từng ngày."

2. **Chọn ghế & Loại vé (`/screenings/[id]/seats`):**
   > *[Bấm vào 1 suất chiếu để mở sơ đồ 50 ghế `A1–E10`, chọn thử 1–2 ghế]*
   >
   > "Ở màn hình **Chọn ghế**, sơ đồ 50 ghế hiển thị rõ trạng thái Trống, Đang chọn, Đang giữ và Đã bán. Khách hàng được chọn tối đa **8 ghế/giao dịch**, giữ chỗ tạm thời trong **10 phút** (có đồng hồ đếm ngược ở góc phải). Tại đây khách chọn loại vé **Thường (100%)** hoặc **Trẻ em (50%)** — riêng phim nhãn **T18**, hệ thống tự động khóa lựa chọn vé Trẻ em theo đúng quy tắc nghiệp vụ."

3. **Chọn Combo (`/screenings/[id]/checkout/combo`) & Thanh toán (`/screenings/[id]/checkout`):**
   > *[Bấm Tiếp tục sang Combo, chọn thử 1 combo $\rightarrow$ bấm Tiếp tục sang trang Checkout]*
   >
   > "Bước tiếp theo là **Chọn Combo bắp nước**, hệ thống tạm giữ tồn kho combo đồng bộ 10 phút để tránh bán vượt tồn kho. Sang trang **Checkout**, khách có thể nhập mã **Voucher** (chỉ giảm trên tiền vé, không giảm trên combo) và chọn cổng thanh toán **ZaloPay** hoặc **VNPay**."

4. **Cổng thanh toán nội bộ (`/payments/...`) & Vé của tôi (`/tickets`):**
   > *[Bấm Thanh toán để mở cổng Sandbox, chỉ vào 3 tài khoản ví & nút Nạp tiền/Thanh toán $\rightarrow$ quay lại hoặc mở tab `/tickets`]*
   >
   > "Cổng thanh toán nội bộ mô phỏng kiểm tra số dư ví bên thứ 3: nếu thiếu số dư có thể nạp thêm ngay tại cổng; thanh toán thành công sẽ trả về **vé điện tử kèm mã QR** và gửi email xác nhận. Tại mục **Vé của tôi (`/tickets`)**, khách xem lại mã QR và có thể **tự hủy vé** trước giờ chiếu tối thiểu **2 giờ** để nhận voucher bồi hoàn 50%."

---

### 2:20 – 3:10 | Phân hệ Nhân viên quầy (`/staff`, `/staff/pos`, `/staff/combos`)
> *[Chuyển sang tài khoản Nhân viên hoặc mở tab `/staff`]*
>
> "Tiếp theo là giao diện **Nhân viên quầy (`/staff`)** gồm 4 nghiệp vụ chính:
> - **Bán vé & Combo tại quầy POS (`/staff/pos`)**: Chọn ghế, gắn tài khoản khách theo SĐT/Email hoặc bán cho khách vãng lai, thu tiền mặt/chuyển khoản và xuất vé ngay.
> - **Trạm Soát vé QR**: Quét hoặc nhập mã vé để check-in vào rạp (`Valid` $\rightarrow$ `Used`), chống quét trùng lần 2.
> - **Xử lý hủy vé sự cố rạp 1 bước**: Cho phép chọn **hoàn 100% tiền mặt** hoặc **cấp voucher 100%**, tự động nhả ghế, ghi AuditLog và gửi email thông báo.
> - **Kệ giao Bắp Nước (`/staff/combos`)**: Xác nhận giao combo cho các đơn khách đã đặt online."

---

### 3:10 – 4:00 | Phân hệ Quản trị viên (`/admin/dashboard`, `/admin/...`)
> *[Mở tab `/admin/dashboard`, sau đó lướt nhanh menu bên trái]*
>
> "Cuối cùng là phân hệ **Admin (`/admin/dashboard`)**:
> - Màn hình Dashboard giám sát trạng thái **5 phòng chiếu theo thời gian thực**, theo dõi tổng doanh thu, tỷ lệ lấp đầy và biểu đồ doanh thu **Streamgraph**.
> - Menu bên trái quản lý toàn bộ danh mục: **Phim** (xóa mềm nếu đã có vé), **Suất chiếu** (tự động kiểm tra chống trùng lịch phòng chiếu cộng **15 phút dọn phòng** và khởi tạo sẵn 50 ghế), **Combo & tồn kho**, **Bảng giá vé**, **Voucher**, **Báo cáo doanh thu (xuất CSV)** và **Kiểm duyệt đánh giá**."

---

## GIAI ĐOẠN 2: TRÌNH BÀY CÁC SƠ ĐỒ TRONG BÁO CÁO (4:00 – 10:00)

> *[Chuyển từ trình duyệt sang mở file báo cáo `BaoCao_LumiCinema_Nhom10.docx`]*
>
> "Vừa rồi là toàn bộ phần chạy thực tế. Sau đây em xin trình bày hệ thống các sơ đồ phân tích và thiết kế trong báo cáo để thấy rõ cách nhóm mô hình hóa từng chức năng vừa demo."

---

### 4:00 – 5:00 | Sơ đồ BFD (`Hình 2.1`) & Use Case (`Hình 2.2 – 2.11`)
> *[Cuộn tới `Hình 2.1`]*
>
> "**Đầu tiên là Sơ đồ phân rã chức năng BFD (`Hình 2.1`)**:
> Hệ thống được phân rã thành **6 nhóm chức năng cấp 1**: Quản lý tài khoản, Quản lý bán vé, Quản lý vận hành & dịch vụ, Quản lý hủy vé & bồi hoàn, Quản trị danh mục và Báo cáo thống kê."
>
> *[Cuộn tới `Hình 2.2` và lướt nhanh `2.3 – 2.11`]*
>
> "**Tiếp theo là Sơ đồ Use Case Tổng Quát (`Hình 2.2`)**:
> Sơ đồ thể hiện rõ 3 tác nhân (**Khách hàng, Nhân viên, Admin**) và 11 Use Case cốt lõi. Trong đó nhóm **Đăng ký / Đăng nhập / Đăng xuất** làm nền tảng xác thực, và tất cả 8 Use Case nghiệp vụ đều có quan hệ `<<include>>` tới **Đăng nhập** để kiểm soát phân quyền RBAC.
>
> Từ tổng quát, nhóm tách thành **9 sơ đồ Use Case chi tiết (`Hình 2.3 – 2.11`)** cho từng phân hệ như Đặt vé online, Bán & soát vé POS, Hủy vé bồi hoàn, Báo cáo và quản trị 4 danh mục."

---

### 5:00 – 6:15 | Sơ đồ Tuần tự – Sequence Diagram (`Hình 2.12 – 2.49`)
> *[Cuộn tới mục 2.4, dừng ở `Hình 2.15` (Đặt vé tổng quan) và `2.17` / `2.21`]*
>
> "**Tiếp theo là 38 Sơ đồ tuần tự – Sequence Diagram (`Hình 2.12 – 2.49`)**, mô tả sự tương tác giữa Actor, Giao diện, API Controller, Database và dịch vụ ngoài.
>
> Em xin lấy cụm **Đặt vé & mua combo online (`2.15 – 2.22`)** làm trọng tâm:
> - Sơ đồ thể hiện rõ việc **giữ ghế nguyên tử trong 10 phút** bằng Database Transaction để chống **Race Condition** khi hai người cùng bấm 1 ghế.
> - Khi thanh toán qua cổng ZaloPay/VNPay (`2.21–2.22`), hệ thống kiểm tra thời hạn giữ chỗ 10 phút trước khi chốt đơn; nếu quá hạn hoặc xung đột ghế sau khi đã trừ tiền ví, hệ thống tự động gọi hoàn tiền và giải phóng ghế/combo."

---

### 6:15 – 7:15 | Sơ đồ Hoạt động – Activity Diagram (`Hình 2.50 – 2.66`)
> *[Cuộn tới mục 2.5, dừng ở `Hình 2.54` (Đặt vé & mua combo online)]*
>
> "**Về Sơ đồ hoạt động – Activity Diagram (`Hình 2.50 – 2.66`)**, nhóm xây dựng **17 lược đồ** chia theo 3 làn trách nhiệm (Swimlane: Khách hàng, Hệ thống, Cổng thanh toán/Nhân viên).
>
> Chẳng hạn ở **`Hình 2.54` – Đặt vé và mua combo online**, luồng đi mạch lạc qua các điểm rẽ nhánh chính xác như code:
> Chọn phim/suất chiếu $\rightarrow$ chọn tối đa 8 ghế & loại vé (tự khóa vé Trẻ em nếu phim **T18**) $\rightarrow$ khóa giữ ghế 10 phút $\rightarrow$ chọn combo & giữ tồn kho $\rightarrow$ áp voucher $\rightarrow$ thanh toán ZaloPay/VNPay.
> Tại bước xác nhận cuối: nếu **thành công & còn hạn 10 phút** thì chốt vé `Valid`, ghế `OCCUPIED`, xuất mã QR; nếu **thất bại hoặc quá hạn** thì hủy giao dịch, giải phóng ghế và hoàn tồn kho combo."

---

### 7:15 – 8:15 | Sơ đồ Trạng thái – State Diagram (`Hình 2.67 – 2.72`)
> *[Cuộn tới mục 2.6, lướt qua `Hình 2.67 – 2.72`]*
>
> "**Ở mục 2.6 là 6 Sơ đồ trạng thái (`Hình 2.67 – 2.72`)**, khớp 100% với các Enum trạng thái trong Prisma Schema:
> 1. **Đơn bắp nước (`2.67`)**: `ComboReservation` chuyển từ `RESERVED` $\rightarrow$ `CONFIRMED` hoặc `RELEASED`; và `OrderCombo` từ chưa giao (`false`) sang đã giao (`true`).
> 2. **Phim (`2.68`)** & **Suất chiếu (`2.70`)**: Chuyển `UPCOMING` $\rightarrow$ `SHOWING` $\rightarrow$ `ENDED`; khi xóa bản ghi đã có vé bán ra sẽ tự động lưu trữ mềm sang `ENDED` để bảo toàn báo cáo doanh thu.
> 3. **Thanh toán (`2.69`)**: `Pending` $\rightarrow$ `Success` / `Failed`, và `Success` $\rightarrow$ `Refunded` khi hủy toàn bộ vé trong đơn.
> 4. **Ghế (`2.71`)**: `EMPTY` $\leftrightarrow$ `RESERVED` (10 phút) $\rightarrow$ `OCCUPIED`, và trả về `EMPTY` khi vé bị hủy.
> 5. **Vé (`2.72`)**: Tạo ra ở trạng thái `Valid`, chuyển sang `Used` khi soát vé (bất biến, không thể hủy) hoặc `Cancelled` khi hủy hợp lệ."

---

### 8:15 – 9:30 | Cơ sở dữ liệu (ERD/RDM) & Sơ đồ Lớp (`Hình 3.1 – 3.3d`)
> *[Cuộn sang Chương 3, dừng ở `Hình 3.1`, `3.2` rồi `3.3` và `3.3a–3.3d`]*
>
> "**Sang Chương 3 – Thiết kế hệ thống**:
> - Về dữ liệu, **ERD (`Hình 3.1`)** và **RDM (`Hình 3.2`)** gồm **12 bảng**, **10 Enum** và **15 khóa ngoại vật lý** trên PostgreSQL, đảm bảo toàn vẹn tham chiếu (ví dụ không cho xóa User đã có Payment, tự động set `null` hoặc bảo toàn lịch sử khi đóng phim/suất chiếu).
> - Về hướng đối tượng, **Sơ đồ lớp tổng thể (`Hình 3.3`)** gồm **22 lớp** (kế thừa từ `User` xuống `Customer`, `Staff`, `Admin`, 13 lớp thực thể/DTO và 5 lớp dịch vụ: `ZaloPayService`, `VNPayService`, `ThirdPartyWalletService`, `EmailService`, `SeatExpirationService`).
> - Để dễ đọc chi tiết thuộc tính và phương thức trên khổ A4, nhóm đã tách thêm **4 sơ đồ lớp chi tiết (`Hình 3.3a – 3.3d`)** theo 4 cụm: **Người dùng & Đánh giá (`3.3a`)**, **Phim & Suất chiếu (`3.3b`)**, **Đặt vé & Thanh toán (`3.3c`)**, và **Dịch vụ hạ tầng (`3.3d`)**."

---

### 9:30 – 10:00 | Kết quả thử nghiệm & Kết thúc
> *[Cuộn nhanh xuống Chương 4 (`Bảng 4.2`) & Chương 5]*
>
> "Cuối cùng ở Chương 4 và Chương 5, toàn bộ **6 kịch bản kiểm thử trọng tâm (`Bảng 4.2`)** trên môi trường Docker — từ đặt vé online, chống đặt trùng ghế đồng thời, hủy vé hoàn voucher/tiền mặt đến soát vé POS và báo cáo doanh thu — đều đã chạy đạt yêu cầu. Toàn bộ bộ sơ đồ thiết kế trong báo cáo đã được kiểm tra chéo và đồng bộ 100% với mã nguồn.
>
> Phần trình bày của Nhóm 10 đến đây là hết. Em xin cảm ơn thầy/cô và các bạn đã lắng nghe!"
