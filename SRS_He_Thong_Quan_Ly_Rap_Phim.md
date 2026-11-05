# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS - SOFTWARE REQUIREMENTS SPECIFICATION)
## HỆ THỐNG QUẢN LÝ BÁN VÉ VÀ VẬN HÀNH RẠP PHIM (LUMI CINEMA)

---

### BẢNG THEO DÕI THAY ĐỔI TÀI LIỆU (DOCUMENT REVISION HISTORY)

| Phiên bản (Version) | Ngày (Date) | Tác giả (Author) | Mô tả thay đổi (Description) | Trạng thái (Status) |
| :--- | :--- | :--- | :--- | :--- |
| **1.0** | 11/10/2026 | Nhóm phát triển sinh viên | Soạn thảo tài liệu đặc tả chuẩn IEEE 830 dựa trên Problem Statement và quy chế vận hành thực tế | Phê duyệt (Approved) |
| **2.0** | 05/11/2026 | Nhóm phát triển sinh viên | Cập nhật kiến trúc Docker PostgreSQL 5434, cổng thanh toán ZaloPay Sandbox v2, Partial Unique Index, và bổ sung đặc tả chi tiết luồng sự kiện, bảng chuyển trạng thái State Machine, ánh xạ lớp Class Diagram phục vụ vẽ sơ đồ UML | Phê duyệt (Approved) |

---

## MỤC LỤC (TABLE OF CONTENTS)
1. **GIỚI THIỆU (INTRODUCTION)**
   - 1.1 Mục đích tài liệu (Purpose)
   - 1.2 Phạm vi sản phẩm (Product Scope)
   - 1.3 Định nghĩa, thuật ngữ và từ viết tắt (Definitions, Acronyms, and Abbreviations)
   - 1.4 Tài liệu tham khảo (References)
   - 1.5 Cấu trúc tài liệu (Document Overview)
2. **MÔ TẢ TỔNG QUAN (OVERALL DESCRIPTION)**
   - 2.1 Bối cảnh sản phẩm (Product Perspective)
   - 2.2 Các chức năng chính của sản phẩm (Product Functions)
   - 2.3 Các nhóm người dùng và đặc điểm (User Classes and Characteristics)
   - 2.4 Môi trường vận hành (Operating Environment)
   - 2.5 Ràng buộc thiết kế và triển khai (Design and Implementation Constraints)
   - 2.6 Giả định và phụ thuộc (Assumptions and Dependencies)
3. **CÁC YÊU CẦU GIAO DIỆN BÊN NGOÀI (EXTERNAL INTERFACE REQUIREMENTS)**
   - 3.1 Giao diện người dùng (User Interfaces - UI)
   - 3.2 Giao diện phần cứng (Hardware Interfaces)
   - 3.3 Giao diện phần mềm & Dịch vụ bên ngoài (Software Interfaces & Third-Party APIs)
   - 3.4 Giao diện truyền thông mạng (Communications Interfaces)
4. **CÁC TÍNH NĂNG HỆ THỐNG VÀ YÊU CẦU CHỨC NĂNG (SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS)**
   - 4.1 Phân hệ Xác thực & Phân quyền (Authentication & Authorization)
   - 4.2 Phân hệ Đánh giá Phim (Movie Reviews)
   - 4.3 Phân hệ Đặt vé & Mua Combo Trực tuyến (Online Ticket & Combo Booking)
   - 4.4 Phân hệ Bán vé & Bán Combo Tại Quầy (POS Ticket & Standalone Combo Sales)
   - 4.5 Phân hệ Soát vé & Giao nhận Combo (Ticket Check-in & Combo Fulfillment)
   - 4.6 Phân hệ Hủy vé & Đền bù / Hoàn tiền (Ticket Cancellation & Compensation/Refund)
   - 4.7 Phân hệ Quản lý Voucher & Khuyến mãi (Voucher & Discount Engine)
   - 4.8 Phân hệ Quản trị Vận hành (Admin Operations & Incident Handling)
   - 4.9 Phân hệ Báo cáo & Thống kê Doanh thu (Reports & Financial Auditing)
5. **CÁC YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)**
   - 5.1 Yêu cầu hiệu năng (Performance Requirements)
   - 5.2 Yêu cầu an toàn và xử lý đồng thời (Safety & Concurrency Requirements)
   - 5.3 Yêu cầu bảo mật (Security Requirements)
   - 5.4 Yêu cầu tính toàn vẹn dữ liệu và kiểm toán (Data Integrity & Audit Logging)
   - 5.5 Yêu cầu sao lưu và phục hồi (Backup & Recovery)
6. **MÔ HÌNH VÀ SƠ ĐỒ ĐẶC TẢ HỆ THỐNG (SYSTEM MODELS & DIAGRAMS)**
   - 6.1 Sơ đồ Use Case tổng quát (Overall Use Case Diagram)
   - 6.2 Sơ đồ tuần tự: Giữ ghế & Thanh toán trực tuyến (Sequence Diagram: Hold Seat & Payment)
   - 6.3 Sơ đồ tuần tự: Hủy vé do sự cố rạp & Hoàn tiền mặt (Sequence Diagram: Incident Refund)
   - 6.4 Sơ đồ hoạt động: Luồng giao nhận combo tại quầy (Activity Diagram: Combo Fulfillment)
   - 6.5 Sơ đồ dữ liệu thực thể quan hệ (ERD - Entity Relationship Diagram)
   - 6.6 Đặc tả Vòng đời Trạng thái của các Thực thể (State Machine Specifications)
   - 6.7 Đặc tả Kiến trúc Lớp & Ánh xạ API (Class & Controller Specifications)
7. **PHỤ LỤC & MA TRẬN TRUY XUẤT YÊU CẦU (APPENDIX & TRACEABILITY MATRIX)**

---

## 1. GIỚI THIỆU (INTRODUCTION)

### 1.1 Mục đích tài liệu (Purpose)
Tài liệu này đặc tả chi tiết toàn bộ các yêu cầu phần mềm cho **Hệ thống Quản lý Bán vé và Vận hành Rạp phim (Lumi Cinema)** theo chuẩn IEEE 830 kết hợp đặc tả hướng đối tượng UML 2.5. Tài liệu phục vụ cho:
- **Hội đồng chấm đồ án / Giảng viên:** Căn cứ đánh giá tính hoàn thiện, tính học thuật và mức độ đáp ứng chuẩn mực phân tích thiết kế hệ thống thông tin.
- **Nhóm phát triển phần mềm (Software Development Team):** Cẩm nang kỹ thuật trực tiếp để hiện thực hóa kiến trúc cơ sở dữ liệu (Database Schema), xây dựng các API Endpoints, giao diện tương tác người dùng (Frontend/Backend) và vẽ trọn bộ sơ đồ UML (Use Case, Activity, Sequence, State Machine, Class, ERD).
- **Bộ phận Vận hành / Kế toán (Stakeholders):** Đối soát quy trình nghiệp vụ (Business Rules), quy chế đền bù vé và kiểm soát tài chính.

### 1.2 Phạm vi sản phẩm (Product Scope)
- Hệ thống áp dụng cho một rạp chiếu phim duy nhất với quy mô:
  - **Số phòng chiếu:** 5 phòng chiếu tiêu chuẩn (`Cinema 01` đến `Cinema 05`).
  - **Sơ đồ chỗ ngồi:** 50 ghế/phòng (Tổng cộng 250 ghế). Toàn bộ ghế thuộc cùng một loại chuẩn (`STANDARD`), bố trí theo ma trận 5 hàng dọc (`A` đến `E`) × 10 cột ngang (`1` đến `10`), định danh từ `A1` đến `E10`.
  - **Hai kênh phân phối:**
    1. Kênh trực tuyến (Website/Mobile Web): Dành riêng cho khách hàng có tài khoản định danh (`CUSTOMER`), thanh toán qua cổng ZaloPay Sandbox v2.
    2. Kênh tại quầy (POS - Point of Sale): Dành cho nhân viên quầy (`STAFF`) phục vụ cả khách định danh lẫn khách vãng lai (Walk-in Guest), thu tiền mặt hoặc chuyển khoản QR tại quầy.
  - **Hàng hóa kinh doanh:**
    - Vé xem phim theo suất chiếu, phân loại giá vé theo độ tuổi đối tượng khán giả: **Vé Thường / Người lớn** (`Normal` - hưởng `100%` giá gốc của suất chiếu) và **Vé Trẻ em** (`Child` - hưởng `50%` giá gốc của suất chiếu, tự động khóa lựa chọn đối với phim có nhãn phân loại độ tuổi `T18`).
    - Các gói bắp nước (`Combo`) đóng gói sẵn có quản lý tồn kho (`stock`) và giữ hàng tạm thời (`ComboReservation`).
  - **Xử lý sự cố và đền bù:** Tự động hóa cấp mã Voucher bồi hoàn giảm 50% (`COMP50_...`, hạn dùng 30 ngày) khi khách chủ động hủy vé hợp lệ trước giờ chiếu tối thiểu 2 giờ; quy trình đối soát thủ công hoàn tiền mặt 100% tại quầy khi rạp gặp sự cố bất khả kháng (mất điện, hỏng máy chiếu, hủy suất chiếu khẩn cấp).

### 1.3 Định nghĩa, thuật ngữ và từ viết tắt (Definitions, Acronyms, and Abbreviations)

| Thuật ngữ / Viết tắt | Tên đầy đủ (Tiếng Anh) | Định nghĩa chi tiết |
| :--- | :--- | :--- |
| **SRS** | Software Requirements Specification | Tài liệu đặc tả yêu cầu phần mềm theo chuẩn IEEE Std 830-1998. |
| **POS** | Point of Sale | Điểm bán vé và bắp nước trực tiếp tại quầy giao dịch của rạp phim. |
| **BR** | Business Rule | Quy tắc nghiệp vụ bắt buộc hệ thống phải tuân thủ nghiêm ngặt. |
| **FR** | Functional Requirement | Yêu cầu chức năng của hệ thống. |
| **NFR** | Non-Functional Requirement | Yêu cầu phi chức năng (hiệu năng, bảo mật, xử lý đồng thời, toàn vẹn dữ liệu). |
| **HMAC-SHA256** | Hash-based Message Authentication Code (SHA-256) | Mã xác thực thông điệp dựa trên hàm băm mật mã học SHA-256 (dùng ký số vé điện tử QR và ký xác thực giao dịch ZaloPay). |
| **JWT** | JSON Web Token | Chuỗi mã hóa dùng xác thực phiên làm việc người dùng không lưu trạng thái (Stateless Session) qua NextAuth.js. |
| **ZaloPay Sandbox v2** | ZaloPay Open API v2 (Sandbox Environment) | Cổng thanh toán trực tuyến tích hợp trong hệ thống (`app_id = 2553`), hỗ trợ tạo đơn hàng QR/Web-to-App, nhận thông báo IPN Callback và điều hướng Return URL. |
| **MAC / Callback IPN** | Message Authentication Code / Instant Payment Notification | Cơ chế thông báo kết quả thanh toán tức thời từ máy chủ ZaloPay gọi ngầm (Server-to-Server Webhook) về hệ thống kèm chữ ký `mac` kiểm chứng bằng khóa `ZALOPAY_KEY2`. |
| **Partial Unique Index** | PostgreSQL Conditional Unique Index | Chỉ mục duy nhất có điều kiện vật lý trên PostgreSQL (`WHERE status != 'Cancelled'`), chặn tuyệt đối việc phát sinh 2 vé hợp lệ cho cùng một ghế trong cùng một suất chiếu. |
| **Voucher bồi hoàn** | Compensation Voucher (`COMP50`) | Mã giảm giá 50% có thời hạn 30 ngày tự động phát sinh cấp cho khách hàng khi chủ động hủy vé hợp lệ trước giờ chiếu tối thiểu 2 tiếng. |
| **Chờ hoàn tiền** | Pending Cash Refund | Trạng thái ghi nhận công nợ của rạp đối với khách hàng khi vé bị hủy do sự cố rạp, chờ khách đến quầy nhận lại 100% tiền mặt thực trả trong vòng 30 ngày. |

### 1.4 Tài liệu tham khảo (References)
- Chuẩn IEEE Std 830-1998 (*IEEE Recommended Practice for Software Requirements Specifications*).
- Chuẩn đặc tả ngôn ngữ mô hình hóa thống nhất OMG UML 2.5 (*Unified Modeling Language Specification*).
- Tài liệu quy chế đặc tả nghiệp vụ dự án Lumi Cinema (Bản cập nhật phiên bản 2.0 ngày 05/11/2026).
- Tài liệu tích hợp cổng thanh toán trực tuyến **ZaloPay Sandbox API v2** (AppID `2553`, chuẩn xác thực chữ ký điện tử `HMAC-SHA256` với `key1` và `key2`).
- Tài liệu kỹ thuật hệ quản trị cơ sở dữ liệu **PostgreSQL 16** và **Prisma ORM v5**.

### 1.5 Cấu trúc tài liệu (Document Overview)
Tài liệu được phân chia thành 7 chương chính, đi từ tổng quan bối cảnh hệ thống, đặc tả giao diện kết nối bên ngoài, mô tả chi tiết 9 phân hệ chức năng theo chuẩn luồng sự kiện (phục vụ vẽ Activity & Sequence Diagram), các yêu cầu phi chức năng về bảo mật và xử lý đồng thời, đến hệ thống sơ đồ kỹ thuật UML (Use Case, Sequence, Activity, ERD, State Machine, Class Diagram) và ma trận truy xuất yêu cầu toàn diện.

---

## 2. MÔ TẢ TỔNG QUAN (OVERALL DESCRIPTION)

### 2.1 Bối cảnh sản phẩm (Product Perspective)
Hệ thống Lumi Cinema là một ứng dụng Web Fullstack độc lập khép kín (*Self-contained Web Application*) được xây dựng trên nền tảng **Next.js App Router**, bao gồm 3 phân khu giao diện tích hợp chung trên một nền tảng thống nhất:
1. **Cổng thông tin khách hàng (Customer Portal):** Tra cứu lịch chiếu, chọn ghế, mua combo, thanh toán trực tuyến qua ZaloPay, quản lý ví vé điện tử QR và đánh giá phim.
2. **Cổng nghiệp vụ quầy (Staff POS & Operations Portal):** Bán vé và combo tại quầy, quét mã QR soát vé vào rạp, giao nhận bắp nước và xử lý hoàn tiền sự cố.
3. **Bảng điều khiển quản trị (Admin Dashboard):** Quản trị danh mục phim, xếp lịch chiếu tự động kiểm tra xung đột phòng, cấu hình bảng giá, phát hành chiến dịch voucher, kích hoạt hủy suất chiếu khẩn cấp và theo dõi báo cáo tài chính.

Hệ thống kết nối trực tiếp với cơ sở dữ liệu quan hệ **PostgreSQL 16** đóng gói trên môi trường **Docker Container** và giao tiếp hai chiều với cổng thanh toán **ZaloPay Sandbox v2** cùng dịch vụ gửi thư điện tử **SMTP Email Service**.

### 2.2 Các chức năng chính của sản phẩm (Product Functions)
1. Quản lý xác thực tài khoản (`NextAuth.js`) và kiểm soát quyền truy cập dựa trên vai trò **RBAC** (`CUSTOMER`, `STAFF`, `ADMIN`).
2. Tra cứu lịch chiếu đa điều kiện, chọn ghế trực quan trên sơ đồ ma trận `5×10` (`A1` đến `E10`) và cơ chế khóa giữ chỗ tạm thời (`RESERVED`) kèm tồn kho combo trong đúng **10 phút**.
3. Tính toán giá vé tự động theo phân loại độ tuổi (Vé Thường 100%, Vé Trẻ em 50% có kiểm tra chặn nhãn phim `T18`), áp dụng mã giảm giá Voucher và thanh toán trực tuyến qua **ZaloPay Sandbox v2** hoặc thanh toán trực tiếp tại quầy **POS**.
4. Cấp phát vé điện tử chống giả mạo bằng chữ ký số **HMAC-SHA256** hiển thị dưới dạng mã **QR Code SVG**, tách biệt độc lập giữa quy trình soát vé vào phòng chiếu và quy trình xuất kho giao nhận combo bắp nước tại quầy.
5. Xử lý hủy vé linh hoạt theo từng vé lẻ trong đơn hàng: Tự động cấp mã Voucher bồi hoàn 50% (`COMP50_...`) khi khách tự hủy trước giờ chiếu `>= 2 giờ`; hoặc ghi nhận công nợ `Chờ hoàn tiền` và đối soát chi trả `100%` tiền mặt tại quầy khi hủy do sự cố rạp.
6. Quản trị danh mục phim (hỗ trợ xóa mềm `Soft Delete` bảo toàn lịch sử), điều phối lịch chiếu chống trùng giờ theo từng phòng, tự động khởi tạo 50 ghế chuẩn cho mỗi suất chiếu mới.
7. Báo cáo và đối soát doanh thu đa chiều, bóc tách minh bạch giữa doanh thu vé thực thu, doanh thu bắp nước, công nợ tiền chờ hoàn và số tiền thực tế đã xuất quỹ hoàn trả.

### 2.3 Các nhóm người dùng và đặc điểm (User Classes and Characteristics)
Bảng dưới đây định nghĩa đầy đủ các **Tác nhân chính (Primary Human Actors)** và **Tác nhân hệ thống phụ (Secondary / System Actors)** làm cơ sở trực tiếp để xác định biên hệ thống trong **Use Case Diagram** và các đường đời (Lifelines) trong **Sequence Diagram**:

| Phân loại Actor | Tên Actor (Ký hiệu UML) | Đặc điểm & Giao thức tương tác | Quyền hạn và Trách nhiệm nghiệp vụ chính |
| :--- | :--- | :--- | :--- |
| **Tác nhân chính (Primary Actor)** | **Khách hàng (`Customer`)** | Người dùng đại chúng sử dụng trình duyệt Web/Mobile Web; bắt buộc đăng ký và đăng nhập tài khoản định danh. | Tra cứu lịch chiếu; giữ ghế & đặt vé/combo online; thanh toán qua ZaloPay; xem mã QR vé điện tử; gửi đánh giá & bình luận phim; chủ động hủy vé hợp lệ (trước giờ chiếu `>= 2h`) để nhận Voucher 50%; quản lý danh sách voucher cá nhân. |
| **Tác nhân chính (Primary Actor)** | **Nhân viên quầy (`Staff`)** | Nhân viên thu ngân, soát vé và quầy bắp nước tại rạp; được cấp tài khoản nội bộ role `STAFF`. | Sử dụng phân hệ POS: Bán vé & combo trực tiếp tại quầy (cho khách định danh hoặc khách vãng lai); bán combo bắp nước độc lập; quét QR soát vé (`Check-in`); xác nhận giao combo (`Fulfill`); hủy vé do sự cố rạp và xác nhận chi trả tiền mặt hoàn vé tại quầy. |
| **Tác nhân chính (Primary Actor)** | **Quản trị viên (`Admin`)** | Ban quản lý vận hành rạp phim; nắm toàn quyền điều hành hệ thống với tài khoản role `ADMIN`. | Toàn quyền quản lý phim (thêm/sửa/xóa mềm), xếp lịch suất chiếu, cấu hình giá vé & bắp nước, tạo chiến dịch Voucher khuyến mãi, kích hoạt hủy toàn bộ suất chiếu khẩn cấp khi gặp sự cố phòng chiếu, xem báo cáo doanh thu và nhật ký kiểm toán (`Audit Log`). |
| **Tác nhân hệ thống phụ (Secondary Actor)** | **Cổng thanh toán (`ZaloPay Gateway`)** | Hệ thống thanh toán bên thứ ba (`sb-openapi.zalopay.vn/v2`), giao tiếp qua HTTPS REST API & Webhook. | Tiếp nhận yêu cầu khởi tạo đơn hàng (`app_id = 2553`), cung cấp giao diện thanh toán QR/Cổng thẻ, gửi thông báo ngầm **IPN Callback** (`POST /api/payments/zalopay/callback`) kèm chữ ký `mac` (`ZALOPAY_KEY2`) và điều hướng trình duyệt người dùng qua **Return URL**. |
| **Tác nhân hệ thống phụ (Secondary Actor)** | **Dịch vụ Email (`SMTP Email Service`)** | Máy chủ chuyển tiếp thư điện tử (Nodemailer / SMTP Server) kết nối từ Backend. | Tự động gửi email xác nhận đặt vé thành công kèm mã vé điện tử, gửi thông báo mã Voucher bồi hoàn `COMP50` khi khách hủy vé, và gửi thông báo hướng dẫn nhận tiền hoàn khi suất chiếu bị hủy do sự cố. |
| **Tác nhân hệ thống phụ (Secondary Actor)** | **Bộ giải phóng quá hạn (`Cron / Lazy Expiration Engine`)** | Tiến trình tự động nội bộ kích hoạt định kỳ hoặc thực thi tức thời (*Lazy Evaluation*) trước mỗi truy vấn ghế/kho. | Tự động quét các ghế đang giữ (`status = 'RESERVED'`) và các bản ghi giữ kho bắp nước (`ComboReservation`) đã vượt quá mốc `reservedUntil` (10 phút) mà đơn hàng `Payment` vẫn ở trạng thái `Pending` để giải phóng ghế về `EMPTY`, hoàn trả tồn kho combo, hoàn lượt dùng coupon và chuyển đơn sang `Failed`. |

### 2.4 Môi trường vận hành (Operating Environment)
- **Môi trường Máy chủ & Đóng gói (Server & Containerization):** Hệ điều hành Linux / Windows / macOS vận hành thông qua **Docker Engine** và **Docker Compose**.
- **Hệ quản trị Cơ sở dữ liệu (Database Infrastructure):**
  - **PostgreSQL 16 Alpine** chạy trên container Docker cục bộ định danh `lumicinema_db`, ánh xạ cổng vật lý **`5434:5432`** (Database: `lumicinema`), lưu trữ dữ liệu bền vững trên Docker Volume `lumicinema_pgdata` và tích hợp cơ chế tự động kiểm tra sức khỏe (`healthcheck: pg_isready`).
  - **Adminer** chạy trên container Docker định danh `lumicinema_adminer` tại cổng **`8080:8080`**, cung cấp giao diện Web trực quan để quản trị bảng và kiểm tra dữ liệu trực tiếp.
- **Nền tảng Ứng dụng (Application Runtime):** Next.js (App Router), React 19, TypeScript, Node.js Runtime LTS, kết nối CSDL thông qua **Prisma ORM**.
- **Trình duyệt Máy khách (Client Browsers):** Google Chrome (v110+), Mozilla Firefox, Apple Safari, Microsoft Edge trên cả máy tính để bàn (Desktop) và thiết bị di động (Mobile Responsive).

### 2.5 Ràng buộc thiết kế và triển khai (Design and Implementation Constraints)
- **Quy mô rạp cố định:** Hệ thống thiết kế chuẩn hóa cho mô hình 5 phòng chiếu, mỗi phòng 50 ghế chuẩn (`STANDARD`, từ `A1` đến `E10`), tổng 250 ghế; giao diện ma trận ghế và thuật toán khởi tạo suất chiếu được tối ưu hóa cho cấu hình này.
- **Không hỗ trợ mua vé online vãng lai:** Mọi giao dịch đặt vé trực tuyến bắt buộc người dùng phải đăng nhập tài khoản định danh nhằm ngăn chặn hành vi giữ ghế ảo (*Seat Squatting*) và đảm bảo định danh tài khoản nhận mã Voucher bồi hoàn hoặc thông báo hoàn tiền sự cố.
- **Chính sách hoàn tiền mặt có kiểm soát (Phase 1):** Khi hủy vé do sự cố rạp, hệ thống không tự động gọi API hoàn tiền qua cổng thanh toán mà thực hiện quy trình đối soát hoàn tiền mặt trực tiếp tại quầy trong vòng 30 ngày kèm lưu vết kiểm toán (`Audit Log`) nhằm đảm bảo an toàn quỹ tiền mặt tại rạp.
- **Bảo toàn dữ liệu lịch sử:** Các bản ghi Phim (`Movie`), Suất chiếu (`Screening`), Hóa đơn thanh toán (`Payment`) và Vé (`Ticket`) đã phát sinh giao dịch tuyệt đối không được xóa vật lý (`Hard Delete`) khỏi CSDL.

### 2.6 Giả định và phụ thuộc (Assumptions and Dependencies)
- Cổng thanh toán đối tác **ZaloPay Sandbox v2** hoạt động ổn định, phản hồi đúng chuẩn chữ ký mật mã học `HMAC-SHA256` qua cả hai luồng: Server-to-Server IPN Callback và Client Return Redirect.
- Trong trường hợp môi trường phát triển cục bộ (Localhost) không mở cổng Public Tunnel cho ZaloPay gọi Webhook IPN, luồng **Return URL** (`GET /api/payments/zalopay/return`) đóng vai trò cơ chế dự phòng an toàn (Fallback) tự động xác thực checksum và đồng bộ trạng thái đơn hàng thành công.
- Nếu dịch vụ gửi Email SMTP gặp sự cố gián đoạn mạng tạm thời, giao dịch đặt vé/hủy vé trong cơ sở dữ liệu vẫn được cam kết hoàn tất (`Commit Transaction`); vé điện tử QR và mã Voucher bồi hoàn luôn hiển thị trực tiếp trong mục "Vé của tôi / Kho Voucher" trên tài khoản khách hàng.

---

## 3. CÁC YÊU CẦU GIAO DIỆN BÊN NGOÀI (EXTERNAL INTERFACE REQUIREMENTS)

### 3.1 Giao diện người dùng (User Interfaces - UI)
Hệ thống cung cấp giao diện người dùng hiện đại (Dark Mode Cinema Theme), tối ưu hóa trải nghiệm thị giác và phản hồi tức thời:

- **Màn hình Đăng nhập / Đăng ký (`/login`, `/register`):**
  - Chứa các trường nhập liệu có kiểm tra hợp lệ (Validation): Email, Mật khẩu (tối thiểu 6 ký tự), Họ và tên, Số điện thoại.
  - Hiển thị thông báo lỗi trực quan ngay trên form nếu email đã tồn tại, định dạng số điện thoại không hợp lệ hoặc sai thông tin xác thực.
- **Màn hình Trang chủ, Danh sách phim & Lịch chiếu (`/`, `/movies/[id]`):**
  - Bộ lọc linh hoạt theo Ngày chiếu, Thể loại phim và Trạng thái phim (`SHOWING` - Đang chiếu, `UPCOMING` - Sắp chiếu).
  - Hiển thị Poster độ phân giải cao, Thời lượng (phút), Nhãn độ tuổi (`P`, `C13`, `C16`, `T18` với huy hiệu cảnh báo màu sắc riêng biệt) và Điểm đánh giá trung bình (1 chữ số thập phân kèm tổng số lượt đánh giá).
- **Màn hình Chọn ghế trực quan (`SeatMap.tsx`):**
  - Hiển thị màn hình chiếu cong định hướng phía trên và lưới ma trận ghế 5 hàng (`A` -> `E`) × 10 cột (`1` -> `10`).
  - **Quy chuẩn mã màu trạng thái ghế thực tế trên UI (`SeatMap.tsx`):**
    - **Ghế trống (`EMPTY`):** Mã màu nền `#404040` (Xám tối), viền `#525252`, cho phép nhấp chuột chọn.
    - **Ghế đang chọn bởi người dùng hiện tại (`Selected`):** Mã màu nền `#FFB703` (Vàng hổ phách nổi bật), chữ đen đậm, hiệu ứng phóng nhẹ thông báo ghế đang nằm trong giỏ.
    - **Ghế đã bán (`OCCUPIED`):** Mã màu nền `#E63946` (Đỏ tươi), khóa hoàn toàn thao tác nhấp chuột (`cursor-not-allowed`).
    - **Ghế đang giữ chỗ tạm thời bởi giao dịch khác (`RESERVED`):** Mã màu nền `#802229` (Đỏ sẫm tối), khóa thao tác chọn cho đến khi hết hạn 10 phút giữ chỗ.
  - **Đồng hồ đếm ngược 10 phút (`Countdown Timer`):** Hiển thị cố định trên thanh trạng thái đặt vé ngay khi ghế được khóa `RESERVED`. Khi thời gian đếm về `00:00`, hệ thống tự động hủy phiên giữ chỗ, giải phóng ghế và điều hướng người dùng về trang lịch chiếu kèm thông báo hết hạn.
- **Màn hình Chọn loại vé & Combo bắp nước:**
  - Cho phép gán từng ghế đã chọn với loại **Vé Thường / Người lớn (100% giá gốc)** hoặc **Vé Trẻ em (50% giá gốc)**. Nếu bộ phim có nhãn độ tuổi `T18`, tùy chọn Vé Trẻ em tự động bị vô hiệu hóa kèm chú thích quy định độ tuổi.
  - Danh sách các gói Combo bắp nước hiển thị hình ảnh, mô tả, đơn giá, số lượng tồn kho khả dụng thực tế và nút tăng/giảm số lượng.
- **Màn hình Thanh toán (`Checkout`):**
  - Tóm tắt chi tiết đơn hàng: Thông tin phim, phòng chiếu, suất chiếu, danh sách mã ghế kèm loại vé, danh sách combo, ô nhập và kiểm tra mã giảm giá (`Coupon / Voucher`), bảng tính chi tiết (Tổng tiền vé, Số tiền giảm giá voucher, Tổng tiền combo, Tổng thanh toán cuối cùng) và nút thanh toán qua cổng **ZaloPay**.
- **Màn hình Chi tiết vé điện tử (`Ticket Detail` & `My Tickets`):**
  - Hiển thị mã định danh vé chuẩn `#LMC-XXXXXX`, thông tin phòng chiếu, vị trí ghế, trạng thái vé (`Valid`, `Used`, `Cancelled`) và trạng thái nhận bắp nước.
  - **Hiển thị mã QR SVG trực tiếp:** Tích hợp thành phần `<QRCodeSVG />` từ thư viện `qrcode.react` để kết xuất trực tiếp chuỗi payload vé điện tử kèm chữ ký số `HMAC-SHA256` thành đồ họa vector sắc nét ngay trên trình duyệt mà không cần tải file ảnh tĩnh từ máy chủ.
  - Nút **"Hủy vé"** chỉ hiển thị và cho phép kích hoạt khi vé có trạng thái `Valid` và thời điểm hiện tại cách giờ bắt đầu suất chiếu tối thiểu **2 giờ** (`>= 120 phút`).
- **Màn hình Nghiệp vụ Quầy (`Staff POS & Lookup Dashboard`):**
  - Giao diện bán hàng nhanh POS tại quầy (chọn suất chiếu -> chọn ghế -> chọn combo -> chọn phương thức Tiền mặt / QR Quầy -> Xuất vé tức thì).
  - Ô tìm kiếm đa năng tra cứu theo Mã vé, Mã đơn hàng, Số điện thoại hoặc Email khách hàng; tích hợp các nút hành động chuyên biệt: **Soát vé (`Check-in`)**, **Xác nhận giao Combo (`Fulfill Combo`)**, **Hủy vé sự cố rạp (`Incident Cancel`)** và **Xác nhận đã hoàn tiền mặt (`Confirm Cash Refund`)**.

### 3.2 Giao diện phần cứng (Hardware Interfaces)
- **Máy in hóa đơn nhiệt (Thermal Receipt Printer):** Kết nối với máy tính quầy thu ngân qua cổng USB hoặc mạng LAN (chuẩn ESC/POS) thông qua hộp thoại in trình duyệt (`window.print()`) để in vé xem phim vật lý, hóa đơn bắp nước và phiếu mã Voucher bồi hoàn cho khách vãng lai.
- **Đầu đọc mã vạch / Máy quét QR 2D (2D Barcode Scanner):** Kết nối qua cổng USB ở chế độ giả lập bàn phím (*HID Keyboard Emulation*) hoặc sử dụng Camera thiết bị di động/webcam tại cổng kiểm soát vé để đọc nhanh chuỗi dữ liệu từ `<QRCodeSVG />` trên điện thoại của khách hàng.

### 3.3 Giao diện phần mềm & Dịch vụ bên ngoài (Software Interfaces & Third-Party APIs)

#### 1. Cổng thanh toán trực tuyến ZaloPay Sandbox API v2
Hệ thống tích hợp trực tiếp với cổng thanh toán **ZaloPay Sandbox v2** theo chuẩn giao thức RESTful JSON và xác thực chữ ký điện tử **HMAC-SHA256**:
- **Cấu hình định danh ứng dụng:** `app_id = 2553`, sử dụng cặp khóa bảo mật độc lập gồm `ZALOPAY_KEY1` (dùng tạo chữ ký khởi tạo đơn hàng) và `ZALOPAY_KEY2` (dùng kiểm tra chữ ký Webhook IPN Callback và Return URL).
- **Giao diện Tạo đơn thanh toán (`Create Order API`):**
  - **Endpoint đối tác:** `POST https://sb-openapi.zalopay.vn/v2/create` (được gọi từ API nội bộ `POST /api/payments/zalopay/create`).
  - **Định dạng mã giao dịch (`app_trans_id`):** Sinh theo chuẩn bắt buộc của ZaloPay `YYMMDD_<paymentId>_<randomSuffix>` (ví dụ: `261105_104_8921`) và lưu vào trường `Payment.transactionCode`.
  - **Quy tắc tạo chữ ký số (`mac`):** Nối chuỗi dữ liệu theo đúng thứ tự chuẩn:
    ```text
    data = app_id + "|" + app_trans_id + "|" + app_user + "|" + amount + "|" + app_time + "|" + embed_data + "|" + item
    mac  = HMAC_SHA256(ZALOPAY_KEY1, data)
    ```
  - **Dữ liệu phản hồi:** ZaloPay trả về `return_code = 1` kèm đường dẫn `order_url` để hệ thống chuyển hướng trình duyệt của khách hàng sang giao diện thanh toán ZaloPay.
- **Giao diện Nhận thông báo thanh toán tức thời (`Webhook IPN Callback`):**
  - **Endpoint tiếp nhận nội bộ:** `POST /api/payments/zalopay/callback`
  - **Cơ chế xác thực bảo mật:** Khi khách hàng hoàn tất thanh toán, máy chủ ZaloPay gửi gói tin JSON chứa `{ data, mac }` tới Callback URL. Hệ thống tính toán lại `expectedMac = HMAC_SHA256(ZALOPAY_KEY2, data)` và thực hiện so sánh chống tấn công định thời gian bằng hàm **`crypto.timingSafeEqual`**.
  - **Xử lý giao dịch:** Nếu chữ ký hợp lệ, hệ thống giải mã `data`, trích xuất `app_trans_id`, thực thi `prisma.$transaction` để cập nhật `Payment.status = 'Success'`, chuyển ghế sang `'OCCUPIED'`, tạo các bản ghi `Ticket` (`status = 'Valid'`), trừ tồn kho `Combo` chính thức và phản hồi `{ return_code: 1, return_message: "success" }` cho ZaloPay.
- **Giao diện Điều hướng hoàn tất thanh toán (`Return Redirect URL`):**
  - **Endpoint tiếp nhận nội bộ:** `GET /api/payments/zalopay/return`
  - **Cơ chế kiểm tra & đồng bộ:** Tiếp nhận các tham số truy vấn (`appid`, `apptransid`, `pmcid`, `bankcode`, `amount`, `discountamount`, `status`, `checksum`) khi trình duyệt người dùng được ZaloPay chuyển hướng về. Hệ thống kiểm tra chữ ký `checksum` bằng `ZALOPAY_KEY2` (nối chuỗi `appid|apptransid|pmcid|bankcode|amount|discountamount|status`), đồng bộ trạng thái đơn hàng (đảm bảo tính lũy đẳng *Idempotency* nếu Callback IPN đã xử lý trước đó) và chuyển hướng người dùng tới trang kết quả vé điện tử.

#### 2. Hệ quản trị Cơ sở dữ liệu Docker PostgreSQL 16 & Prisma ORM
- **Chuỗi kết nối vật lý (`DATABASE_URL`):** `postgresql://postgres:postgrespassword@localhost:5434/lumicinema?schema=public`.
- **Giao thức giao tiếp:** Ứng dụng Next.js giao tiếp với container `lumicinema_db` (PostgreSQL 16 Alpine) thông qua **Prisma Client ORM** sử dụng giao thức nhị phân TCP/IP trên cổng `5434`, hỗ trợ quản lý kết nối (Connection Pooling) và thực thi các giao dịch nguyên tử (`prisma.$transaction`) đảm bảo tính toàn vẹn ACID.

#### 3. Dịch vụ Gửi thư điện tử (SMTP Email Notification Service)
- Kết nối qua giao thức `SMTP/TLS` (cổng `587` hoặc `465`) để gửi email định dạng HTML thông báo thông tin vé điện tử sau khi thanh toán thành công, gửi mã Voucher bồi hoàn `COMP50` khi khách hủy vé và thông báo hướng dẫn nhận tiền hoàn khi suất chiếu gặp sự cố.

### 3.4 Giao diện truyền thông mạng (Communications Interfaces)
- **Giao thức truyền tải:** Toàn bộ giao tiếp giữa trình duyệt máy khách (Client), máy chủ ứng dụng (Next.js Server) và cổng thanh toán ZaloPay sử dụng giao thức **HTTP/1.1 và HTTP/2 trên nền mã hóa TLS 1.3 (HTTPS)**.
- **Định dạng trao đổi dữ liệu:** Các API nội bộ (`/api/*`) tuân thủ kiến trúc **RESTful API**, đóng gói dữ liệu yêu cầu và phản hồi theo định dạng chuẩn `application/json; charset=utf-8`.
- **Cơ chế duy trì trạng thái phiên làm việc:** Sử dụng `HTTP-Only Secure Cookie` lưu trữ chuỗi token phiên làm việc **NextAuth JWT** nhằm ngăn chặn tấn công đánh cắp token qua kịch bản độc hại (XSS).

---

## 4. CÁC TÍNH NĂNG HỆ THỐNG VÀ YÊU CẦU CHỨC NĂNG (SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS)

> **Hướng dẫn chuyển đổi sang sơ đồ UML (Diagram-Ready Specification):**
> Mỗi phân hệ từ **4.1 đến 4.9** dưới đây được đặc tả theo cấu trúc chuẩn hóa phục vụ trực tiếp cho việc thiết kế các sơ đồ:
> - **Use Case Diagram:** Xác định trực tiếp từ mục *Tác nhân (Primary & Secondary Actors)* và các mã chức năng `FR-xxx`.
> - **Sequence Diagram:** Ánh xạ tuần tự theo các bước trong *Luồng sự kiện chính (Main / Basic Flow)* với cú pháp `[Lifeline Nguồn] -> [Lifeline Đích]: Thông điệp / Lời gọi hàm / Truy vấn SQL` cùng các khung `alt / else` từ *Luồng rẽ nhánh & Ngoại lệ*.
> - **Activity Diagram:** Mỗi bước đánh số là một `Action Node`, các điều kiện đặt trong ngoặc vuông `[Điều kiện Guard]` là các nút hình thoi (`Decision / Merge Node`) phân chia rõ theo từng làn bơi (`Swimlane`: Actor / UI / API Server / Database / External Gateway).

---

### 4.1 Phân hệ Xác thực & Phân quyền (Authentication & Authorization)

#### 4.1.1 Danh mục Yêu cầu Chức năng
- **FR-AUTH-01 (Đăng ký tài khoản - Customer Sign-up):** Cho phép khách vãng lai đăng ký tài khoản vai trò Khách hàng (`CUSTOMER`) qua endpoint `POST /api/auth/signup` với các trường bắt buộc: Email (duy nhất, chuẩn hóa chữ thường `toLowerCase().trim()`, đúng định dạng RFC 5322), Mật khẩu (`>= 6` ký tự, băm bằng `bcryptjs` với `saltRounds = 12`), Họ tên (`full_name`), và Số điện thoại (`phone` - tùy chọn).
- **FR-AUTH-02 (Đăng nhập hệ thống & Quản lý phiên JWT):** Xác thực tài khoản qua `NextAuth.js` (`CredentialsProvider` tại `POST /api/auth/[...nextauth]`) bằng Email và Mật khẩu. Khi khớp băm `bcrypt.compare()`, hệ thống cấp phát JSON Web Token (`JWT`) lưu trong `HttpOnly Cookie` với thời hạn phiên làm việc `maxAge = 86400s` (24 giờ), đính kèm `token.id` và `token.role` vào `session.user`.
- **FR-AUTH-03 (Phân quyền truy cập dựa trên vai trò - RBAC):** Kiểm soát truy cập nghiêm ngặt tại cả tầng Edge Middleware (`middleware.ts`) và tầng API Server (`getServerSession(authOptions)` / `requireAuth(allowedRoles)`):
  - Role `CUSTOMER`: Chỉ truy cập các trang đặt vé cá nhân, lịch sử vé (`/profile`), thanh toán và gửi đánh giá phim.
  - Role `STAFF`: Truy cập Dashboard nhân viên (`/staff`), màn hình bán vé & combo tại quầy POS, tra cứu vé, soát vé QR và bàn giao combo bắp nước.
  - Role `ADMIN`: Toàn quyền quản trị hệ thống (`/admin`), quản lý danh mục phim, phòng chiếu, suất chiếu, cấu hình giá vé, chiến dịch voucher, báo cáo đối soát tài chính và hủy suất chiếu khẩn cấp.
- **FR-AUTH-04 (Quản lý tài khoản nội bộ):** Tài khoản Nhân viên (`STAFF`) và Quản trị viên (`ADMIN`) được khởi tạo trực tiếp trong cơ sở dữ liệu (`seed.ts` hoặc cấp bởi Admin), tuyệt đối không mở form đăng ký công khai cho hai vai trò này để ngăn chặn tấn công leo thang đặc quyền (Privilege Escalation).

#### 4.1.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actors:** Khách vãng lai (Guest), Khách hàng (`CUSTOMER`), Nhân viên (`STAFF`), Quản trị viên (`ADMIN`).<br>- **Secondary Actors:** Hệ thống quản lý phiên `NextAuth.js JWT Engine`, Cơ sở dữ liệu `PostgreSQL (Bảng users)`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Đối với Đăng ký: Người dùng chưa có tài khoản hoặc đang ở trạng thái chưa đăng nhập.<br>- Đối với Đăng nhập: Tài khoản đã tồn tại trong bảng `users`.<br>- Đối với Kiểm tra RBAC: Người dùng gửi HTTP Request truy cập trang bảo vệ hoặc gọi API yêu cầu xác thực. |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Thành công:** Bản ghi mới được tạo trong bảng `users` với `role = 'CUSTOMER'` (khi đăng ký); Cookie chứa `next-auth.session-token` hợp lệ được thiết lập trên trình duyệt (khi đăng nhập); Cho phép thực thi controller đích (khi thỏa mãn RBAC).<br>- **Thất bại:** Không có thay đổi CSDL; trả về mã lỗi HTTP `400`, `401`, `403`, hoặc `409` tương ứng. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `POST /api/auth/signup` (Đăng ký tài khoản khách hàng).<br>  + `POST /api/auth/[...nextauth]` (Đăng nhập `CredentialsProvider`, khởi tạo/hủy phiên JWT).<br>  + `GET /api/auth/session` (Lấy thông tin phiên đăng nhập hiện tại).<br>- **Bảng CSDL:** `users` (`user_id`, `email`, `password`, `name`, `phone`, `role`, `created_at`, `updated_at`). |

##### A. Luồng sự kiện chính (Main / Basic Flow)

**Luồng 4.1A - Đăng ký tài khoản Khách hàng (`POST /api/auth/signup`):**
1. `[Guest]` -> `[Giao diện UI (/register)]`: Nhập `email`, `password`, `full_name`, `phone` và nhấn nút **"Đăng ký"**.
2. `[Giao diện UI]` -> `[Next.js API Server (POST /api/auth/signup)]`: Gửi HTTP POST kèm JSON Payload `{ email, password, full_name, phone }`.
3. `[Next.js API Server]` -> `[Next.js API Server]`: Kiểm tra tính hợp lệ dữ liệu đầu vào (`!email || !password || !full_name`, kiểm tra `emailRegex`, kiểm tra `password.length >= 6`) và chuẩn hóa `normalizedEmail = email.toLowerCase().trim()`.
4. `[Next.js API Server]` -> `[PostgreSQL DB (users)]`: Thực thi truy vấn `prisma.user.findUnique({ where: { email: normalizedEmail } })` để kiểm tra trùng lặp.
5. `[PostgreSQL DB]` -> `[Next.js API Server]`: Trả về `null` (Email chưa tồn tại).
6. `[Next.js API Server]` -> `[Bcrypt Engine]`: Băm mật khẩu `hashedPassword = await bcrypt.hash(password, 12)`.
7. `[Next.js API Server]` -> `[PostgreSQL DB (users)]`: Thực thi `prisma.user.create()` lưu người dùng mới với `role: 'CUSTOMER'`.
8. `[PostgreSQL DB]` -> `[Next.js API Server]`: Trả về thông tin bản ghi `newUser` (`id`, `email`, `name`, `phone`, `role`, `createdAt`).
9. `[Next.js API Server]` -> `[Giao diện UI]`: Trả về HTTP `201 Created` kèm JSON `{ success: true, data: { user: newUser }, message: "Đăng ký tài khoản thành công!" }`.
10. `[Giao diện UI]` -> `[Guest]`: Hiển thị thông báo thành công và chuyển hướng sang trang `/login`.

**Luồng 4.1B - Đăng nhập & Phân quyền RBAC (`POST /api/auth/[...nextauth]`):**
1. `[Actor (Customer/Staff/Admin)]` -> `[Giao diện UI (/login)]`: Nhập `email`, `password` và nhấn **"Đăng nhập"**.
2. `[Giao diện UI]` -> `[NextAuth CredentialsProvider]`: Gọi hàm `signIn('credentials', { email, password, redirect: false })`.
3. `[NextAuth CredentialsProvider]` -> `[PostgreSQL DB (users)]`: Truy vấn `prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })`.
4. `[PostgreSQL DB]` -> `[NextAuth CredentialsProvider]`: Trả về bản ghi `user` (bao gồm chuỗi băm `user.password` và `user.role`).
5. `[NextAuth CredentialsProvider]` -> `[Bcrypt Engine]`: Đối chiếu mật khẩu qua `bcrypt.compare(credentials.password, user.password)`.
6. `[Bcrypt Engine]` -> `[NextAuth CredentialsProvider]`: Trả về `true` (Mật khẩu khớp).
7. `[NextAuth CredentialsProvider]` -> `[NextAuth JWT Callback]`: Đóng gói payload `{ id: String(user.id), email: user.email, name: user.name, role: user.role }` và ký số bằng khóa bí mật `NEXTAUTH_SECRET` (hạn 24 giờ).
8. `[NextAuth JWT Callback]` -> `[Giao diện UI]`: Trả về HTTP `200 OK` kèm Header `Set-Cookie: next-auth.session-token=<JWT>; HttpOnly; Path=/`.
9. `[Giao diện UI]` -> `[Actor]`: Điều hướng người dùng theo vai trò (`ADMIN` -> `/admin`, `STAFF` -> `/staff`, `CUSTOMER` -> `/`).

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **3a. Dữ liệu đăng ký thiếu hoặc sai định dạng:**
  - *Decision Guard:* `[!email || !password || !full_name || !emailRegex.test(email) || password.length < 6]`
  - *Xử lý:* `[Next.js API Server]` dừng luồng, trả về HTTP `400 Bad Request` với thông báo lỗi chi tiết (`"Vui lòng nhập đầy đủ email, mật khẩu và họ tên"` hoặc `"Mật khẩu phải có tối thiểu 6 ký tự"`).
- **5a. Email đăng ký đã tồn tại trong hệ thống:**
  - *Decision Guard:* `[existingUser !== null]`
  - *Xử lý:* `[Next.js API Server]` từ chối tạo mới, trả về HTTP `409 Conflict` kèm thông báo `"Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập."`.
- **4b / 6b. Email không tồn tại hoặc Mật khẩu đăng nhập sai:**
  - *Decision Guard:* `[!user || !isPasswordValid]`
  - *Xử lý:* `authorize()` ném ngoại lệ `Error("Email không tồn tại trong hệ thống")` hoặc `Error("Mật khẩu không chính xác")`. `NextAuth` trả về HTTP `401 Unauthorized` cho `[Giao diện UI]` hiển thị cảnh báo đỏ.
- **9a. Vi phạm phân quyền truy cập (Unauthorized / Forbidden RBAC):**
  - *Decision Guard 1 (Chưa đăng nhập):* `[!session || !session.user?.id]` -> API trả về HTTP `401 Unauthorized` (`code: 'UNAUTHENTICATED'`).
  - *Decision Guard 2 (Sai vai trò, ví dụ CUSTOMER gọi API của STAFF/ADMIN):* `[!allowedRoles.includes(session.user.role)]` -> API trả về HTTP `403 Forbidden` (`code: 'FORBIDDEN'`, message: `"Bạn không có quyền truy cập chức năng này"`).

---

### 4.2 Phân hệ Đánh giá Phim (Movie Reviews)

#### 4.2.1 Danh mục Yêu cầu Chức năng
- **FR-REV-01 (Điều kiện đánh giá mở - Open Authenticated Review - BR-06):** Mọi tài khoản đã đăng nhập hợp lệ (`Authenticated` qua phiên JWT của NextAuth) đều có quyền gửi điểm đánh giá (`rating` nguyên từ `1` đến `5` sao) và nội dung bình luận (`comment` tối đa `1000` ký tự) cho bất kỳ bộ phim nào qua `POST /api/reviews`. Hệ thống lấy `userId` trực tiếp từ `session.user.id` trên Server (tuyệt đối bỏ qua mọi trường `user_id` gửi từ body để chống giả mạo danh tính). Không bắt buộc khách hàng phải có lịch sử mua vé xem phim trước đó.
- **FR-REV-02 (Cập nhật đánh giá duy nhất - Idempotent Upsert):** Mỗi tài khoản người dùng chỉ tồn tại tối đa **01 bản ghi đánh giá** cho mỗi bộ phim (`userId + movieId`). Nếu người dùng đã từng đánh giá phim đó và gửi lại, hệ thống tự động thực hiện cập nhật (`UPDATE`) số sao và bình luận mới lên bản ghi cũ thay vì tạo bản ghi trùng lặp.
- **FR-REV-03 (Tự động tính lại điểm trung bình - Real-time Rating Aggregation):** Ngay sau khi thêm mới hoặc cập nhật đánh giá thành công, hệ thống tự động truy vấn toàn bộ điểm `rating` của bộ phim đó trong bảng `reviews`, tính trung bình cộng làm tròn 1 chữ số thập phân (`Number(avgRating.toFixed(1))`) và cập nhật trực tiếp vào trường `movies.rating`.

#### 4.2.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actor:** Người dùng đã đăng nhập (`CUSTOMER`, `STAFF`, `ADMIN`).<br>- **Secondary Actors:** `NextAuth Session Service`, Cơ sở dữ liệu `PostgreSQL (Bảng reviews, movies)`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Người dùng đã đăng nhập hợp lệ (`session.user.id` tồn tại).<br>- Bộ phim (`movie_id`) đang tồn tại trong bảng `movies`. |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Thành công:** Bản ghi trong bảng `reviews` được tạo mới (`201 Created`) hoặc cập nhật (`200 OK`); trường `rating` trong bảng `movies` được đồng bộ tức thì theo giá trị trung bình mới.<br>- **Thất bại:** Bảng `reviews` và `movies` giữ nguyên trạng thái cũ; trả về mã lỗi HTTP `400`, `401`, hoặc `404`. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `GET /api/reviews?movie_id={id}` (Lấy danh sách đánh giá của phim kèm thông tin người dùng).<br>  + `POST /api/reviews` (Gửi mới hoặc cập nhật đánh giá phim).<br>  + `DELETE /api/reviews/[id]` (Xóa đánh giá vi phạm - dành cho Admin hoặc chính chủ).<br>- **Bảng CSDL:** `reviews` (`review_id`, `user_id`, `movie_id`, `rating`, `comment`, `created_at`, `updated_at`), `movies` (`movie_id`, `rating`), `users` (`user_id`, `name`, `email`). |

##### A. Luồng sự kiện chính (Main / Basic Flow - `POST /api/reviews`)
1. `[Authenticated User]` -> `[Giao diện UI (/movies/[id])]`: Chọn số sao (`1..5`), nhập nội dung nhận xét (`<= 1000` ký tự) và nhấn **"Gửi đánh giá"**.
2. `[Giao diện UI]` -> `[Next.js API Server (POST /api/reviews)]`: Gửi HTTP POST kèm JSON `{ movie_id, rating, comment }` và Cookie phiên đăng nhập.
3. `[Next.js API Server]` -> `[NextAuth Session]`: Gọi `getServerSession(authOptions)` để trích xuất `currentUserId = Number(session.user.id)`.
4. `[Next.js API Server]` -> `[Zod Validator]`: Kiểm tra schema `createReviewSchema` (`movie_id` nguyên dương, `rating` nguyên từ `1..5`, `comment` chuỗi tối đa `1000` ký tự).
5. `[Next.js API Server]` -> `[PostgreSQL DB (movies)]`: Truy vấn `prisma.movie.findUnique({ where: { id: movie_id } })` để kiểm tra sự tồn tại của phim.
6. `[PostgreSQL DB]` -> `[Next.js API Server]`: Trả về thông tin bộ phim hợp lệ.
7. `[Next.js API Server]` -> `[PostgreSQL DB (reviews)]`: Truy vấn `prisma.review.findFirst({ where: { userId: currentUserId, movieId: movie_id } })` kiểm tra lịch sử đánh giá.
8. `[Next.js API Server]` -> `[PostgreSQL DB (reviews)]`:
   - **[Nhánh 8.1 - Chưa có đánh giá (`existingReview === null`)]:** Gọi `prisma.review.create({ data: { userId: currentUserId, movieId: movie_id, rating, comment } })`.
   - **[Nhánh 8.2 - Đã có đánh giá (`existingReview !== null`)]:** Gọi `prisma.review.update({ where: { id: existingReview.id }, data: { rating, comment } })`.
9. `[Next.js API Server]` -> `[PostgreSQL DB (reviews & movies)]`: Truy vấn toàn bộ ` prisma.review.findMany({ where: { movieId: movie_id }, select: { rating: true } })`, tính `avgRating = sum / length`, sau đó gọi `prisma.movie.update({ where: { id: movie_id }, data: { rating: Number(avgRating.toFixed(1)) } })`.
10. `[Next.js API Server]` -> `[Giao diện UI]`: Trả về HTTP `201 Created` (nếu tạo mới) hoặc `200 OK` (nếu cập nhật) kèm đối tượng `ReviewResponseItem`.
11. `[Giao diện UI]` -> `[Authenticated User]`: Cập nhật danh sách bình luận và điểm sao trung bình mới của phim trên màn hình.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **3a. Người dùng chưa đăng nhập hoặc phiên hết hạn:**
  - *Decision Guard:* `[!session?.user?.id || isNaN(Number(session.user.id))]`
  - *Xử lý:* Trả về HTTP `401 Unauthorized` (`code: 'UNAUTHENTICATED'`, message: `"Vui lòng đăng nhập để gửi đánh giá phim"`).
- **4a. Điểm sao ngoài khoảng 1-5 hoặc bình luận vượt 1000 ký tự:**
  - *Decision Guard:* `[!validationResult.success]` (Ví dụ: `rating < 1 || rating > 5 || comment.length > 1000`)
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`code: 'VALIDATION_ERROR'`) kèm thông báo lỗi từ Zod.
- **6a. Mã bộ phim không tồn tại trong CSDL:**
  - *Decision Guard:* `[!movie]`
  - *Xử lý:* Trả về HTTP `404 Not Found` (`code: 'MOVIE_NOT_FOUND'`, message: `"Không tìm thấy phim với mã định danh #..."`).

---

### 4.3 Phân hệ Đặt vé & Mua Combo Trực tuyến (Online Ticket & Combo Booking)

#### 4.3.1 Danh mục Yêu cầu Chức năng
- **FR-BOK-01 (Xem & Lọc lịch chiếu):** Cho phép khách hàng duyệt danh sách phim (`GET /api/movies`) và lọc danh sách suất chiếu (`GET /api/screenings`) theo mã phim (`movie_id`), ngày chiếu (`date` định dạng `YYYY-MM-DD`) và phòng chiếu (`room_number` từ `1` đến `5`). Khi chọn một suất chiếu (`GET /api/screenings/[id]`), hiển thị sơ đồ 50 ghế (`A1` đến `E10`) với trạng thái thời gian thực (`EMPTY`, `RESERVED`, `OCCUPIED`).
- **FR-BOK-02 (Giữ ghế nguyên tử 10 phút & Tự động giải phóng - Seat Locking):**
  - Khách hàng được chọn tối đa **08 ghế** (`MAX_SEATS_PER_HOLD = 8`) trong một lần giao dịch qua `POST /api/seats/reserve`.
  - Hệ thống sử dụng giao dịch nguyên tử `prisma.$transaction` kết hợp cập nhật có điều kiện `updateMany` (`where: { id: { in: seat_ids }, screeningId, status: 'EMPTY' }`) để chuyển trạng thái ghế sang `RESERVED` và thiết lập `reservedUntil = NOW() + 10 phút`. Nếu số dòng cập nhật `count !== seat_ids.length`, toàn bộ transaction bị rollback ngay lập tức để chống tranh chấp đồng thời (Race Condition).
  - **Cơ chế giải phóng tự động (Lazy Evaluation + Cron Job):** Trước mỗi lần giữ ghế mới VÀ định kỳ qua `GET /api/cron/release-seats` (xác thực bằng `Bearer ${CRON_SECRET}`), hệ thống tự động quét các ghế có `status === 'RESERVED'` và `reservedUntil < NOW()` để trả về `status = 'EMPTY'`, `reservedUntil = null`.
- **FR-BOK-03 (Phân loại giá vé theo độ tuổi & Chặn phim T18 - BR-02):**
  - Khách hàng chọn số lượng từng loại vé khớp với tổng số ghế đã chọn: **Vé Thường / Người lớn** (`100%` giá cơ bản `screening.price`) hoặc **Vé Trẻ em** (`50%` giá cơ bản `screening.price`).
  - **Ràng buộc độ tuổi nghiêm ngặt:** Nếu bộ phim có nhãn độ tuổi `T18` / `C18` (`/18/i.test(movie.ageRating)`), giao diện khóa lựa chọn vé Trẻ em và API Server (`POST /api/payments/initiate`) chặn tuyệt đối với lỗi `400 Bad Request` (`code: 'CHILD_TICKET_NOT_ALLOWED'`).
- **FR-BOK-04 (Mua kèm Combo & Giữ kho tạm 10 phút - Inventory Hold):**
  - Hiển thị các gói Combo bắp nước đang hoạt động (`status === 'ACTIVE'` và `stock > 0`).
  - Khi khách chọn combo (`POST /api/combos/reserve`), hệ thống thực hiện **Lazy Release** hoàn kho các bản ghi giữ chỗ quá hạn trước, sau đó trừ tạm tồn kho nguyên tử (`stock: { decrement: qty }` với điều kiện `stock >= qty`) và tạo bản ghi `ComboReservation` trạng thái `RESERVED` với `reservedUntil = NOW() + 10 phút`.
  - Nếu hết 10 phút không thanh toán, Cron Job `GET /api/cron/release-combos` hoặc API `POST /api/combos/release` tự động cộng trả lại `stock` vào bảng `combos` và đổi trạng thái `ComboReservation` sang `RELEASED`.
- **FR-BOK-05 (Thanh toán trực tuyến qua ZaloPay Sandbox v2 & Xuất vé QR):**
  - Khởi tạo đơn hàng qua `POST /api/payments/initiate` (tích hợp hàm tạo đơn `createZaloPayOrder` gọi tới cổng `https://sb-openapi.zalopay.vn/v2/create` với `app_id = 2553` và chữ ký `HMAC-SHA256` tạo bằng `ZALOPAY_KEY1`), lưu bản ghi `Payment` (`status = 'Pending'`, mã `app_trans_id` định dạng `YYMMDD_LMC...`) và `OrderCombo` (`isDelivered = false` / `Chưa nhận`).
  - Sau khi khách thanh toán trên cổng ZaloPay, hệ thống xử lý đồng bộ qua **Webhook IPN** (`POST /api/payments/zalopay-ipn` / `/api/payments/zalopay/callback` xác thực `mac` bằng `ZALOPAY_KEY2`) và **Return Redirect** (`GET /api/payments/zalopay-return` / `/api/payments/zalopay/return`) theo cơ chế **Idempotent Transaction**:
    1. Chuyển trạng thái `Payment` sang `Success` (`Completed`).
    2. Chuyển toàn bộ ghế trong đơn sang `OCCUPIED` (`reservedUntil = null`).
    3. Sinh các bản ghi `Ticket` ở trạng thái `Valid`.
    4. Chuyển trạng thái `ComboReservation` từ `RESERVED` sang `COMPLETED` (giữ nguyên `OrderCombo.isDelivered = false` tương ứng trạng thái `Chưa nhận`).
    5. Tăng lượt sử dụng voucher `Coupon.usedCount` thêm `1` (nếu đơn có áp dụng mã).
    6. Sinh chữ ký điện tử `HMAC-SHA256` định danh vé, gửi email xác nhận bất đồng bộ và hiển thị mã QR SVG trực tiếp trên giao diện thông qua `<QRCodeSVG />`.

#### 4.3.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actor:** Khách hàng đã đăng nhập (`CUSTOMER`).<br>- **Secondary Actors:** Cổng thanh toán `ZaloPay Sandbox v2 Server`, Hệ thống chạy nền `Cron Scheduler`, Dịch vụ gửi thư `SMTP Email Service`, Cơ sở dữ liệu `PostgreSQL`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Khách hàng đã đăng nhập hợp lệ (`session.user.id`).<br>- Suất chiếu đang ở trạng thái `UPCOMING` và các ghế lựa chọn đang ở trạng thái `EMPTY` (hoặc `RESERVED` đã quá hạn 10 phút). |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Khi giữ chỗ:** Ghế chuyển sang `RESERVED` (10 phút); Tồn kho Combo giảm tạm thời kèm bản ghi `ComboReservation (RESERVED)`; Bản ghi `Payment (Pending)` được khởi tạo.<br>- **Khi thanh toán ZaloPay thành công:** `Payment` -> `Success`; `Seat` -> `OCCUPIED`; `Ticket` -> `Valid`; `ComboReservation` -> `COMPLETED`; `OrderCombo` -> `isDelivered: false` (`Chưa nhận`); `Coupon.usedCount` tăng 1; Mã QR vé được sinh và hiển thị.<br>- **Khi hủy hoặc hết hạn 10 phút:** Ghế trở về `EMPTY`; Tồn kho `Combo.stock` được hoàn trả; `ComboReservation` -> `RELEASED`; Lượt dùng `Coupon` được bảo toàn. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `GET /api/screenings` & `GET /api/screenings/[id]` (Truy vấn lịch chiếu & sơ đồ 50 ghế).<br>  + `POST /api/seats/reserve` & `POST /api/seats/release` (Giữ ghế 10 phút & nhả ghế).<br>  + `POST /api/combos/reserve` & `POST /api/combos/release` (Giữ kho combo 10 phút & hoàn kho).<br>  + `POST /api/coupons/validate` (Kiểm tra và tính chiết khấu voucher).<br>  + `POST /api/payments/initiate` (Khởi tạo đơn hàng & gọi ZaloPay `/v2/create`).<br>  + `POST /api/payments/zalopay-ipn` *(alias: `/api/payments/zalopay/callback`)* (Webhook IPN từ ZaloPay).<br>  + `GET /api/payments/zalopay-return` *(alias: `/api/payments/zalopay/return`)* (Redirect Return URL).<br>  + `GET /api/cron/release-seats` & `GET /api/cron/release-combos` (Cron giải phóng tài nguyên quá hạn).<br>- **Bảng CSDL:** `screenings`, `movies`, `seats`, `pricing`, `combos`, `combo_reservations`, `coupons`, `payments`, `order_combos`, `tickets`. |

##### A. Luồng sự kiện chính (Main / Basic Flow)

**Giai đoạn 1 - Chọn ghế & Giữ chỗ nguyên tử 10 phút (`POST /api/seats/reserve`):**
1. `[Customer]` -> `[Giao diện UI (SeatMap.tsx)]`: Chọn suất chiếu, chọn từ 1 đến 8 ghế trống (`#404040`) và nhấn **"Tiếp tục"**.
2. `[Giao diện UI]` -> `[Next.js API Server (POST /api/seats/reserve)]`: Gửi `{ screening_id, seat_ids: [...] }`.
3. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`: Bắt đầu giao dịch nguyên tử:
   - **Bước 3.1 (Lazy Release):** Thực thi `tx.seat.updateMany` chuyển các ghế trong `seat_ids` đang `RESERVED` nhưng có `reservedUntil < NOW()` về `EMPTY`.
   - **Bước 3.2 (Kiểm tra trạng thái):** Truy vấn `tx.seat.findMany` và `tx.ticket.findMany` (`status != 'Cancelled'`) để xác minh không có ghế nào đã bán (`OCCUPIED`) hoặc đang được giữ hợp lệ bởi người khác.
   - **Bước 3.3 (Khóa nguyên tử):** Thực thi `tx.seat.updateMany({ where: { id: { in: seat_ids }, screeningId: screening_id, status: 'EMPTY' }, data: { status: 'RESERVED', reservedUntil: NOW + 10m } })`.
   - **Bước 3.4 (Xác nhận số lượng khóa):** Kiểm tra `updateResult.count === seat_ids.length`.
4. `[PostgreSQL DB]` -> `[Next.js API Server]`: Commit transaction và trả về danh sách ghế kèm mốc `reserved_until`.
5. `[Next.js API Server]` -> `[Giao diện UI]`: Trả về HTTP `200 OK`; Giao diện kích hoạt đồng hồ đếm ngược `10:00`.

**Giai đoạn 2 - Chọn loại vé, Giữ kho Combo & Khởi tạo thanh toán ZaloPay (`POST /api/combos/reserve` & `POST /api/payments/initiate`):**
6. `[Customer]` -> `[Giao diện UI]`: Chọn phân loại vé (`Thường` 100%, `Trẻ em` 50%), chọn gói Combo bắp nước, nhập mã Voucher (nếu có) và nhấn **"Thanh toán ZaloPay"**.
7. `[Giao diện UI]` -> `[Next.js API Server (POST /api/combos/reserve)]`: (Nếu có chọn combo) Gửi `{ combo_items: [{ combo_id, quantity }] }`. Server thực hiện Lazy Release các `ComboReservation` hết hạn, kiểm tra `combo.stock >= quantity`, trừ `combo.stock` và tạo bản ghi `ComboReservation (status = 'RESERVED', reservedUntil = NOW + 10m)`.
8. `[Giao diện UI]` -> `[Next.js API Server (POST /api/payments/initiate)]`: Gửi `{ screening_id, seat_ids, ticket_items, combo_items, coupon_code, payment_method: 'ZaloPay' }`.
9. `[Next.js API Server]` -> `[Next.js API Server]`:
   - Kiểm tra nhãn độ tuổi phim (`BR-02`): Nếu phim là `T18` mà có vé `Trẻ em` -> Từ chối.
   - Tính lại toàn bộ tiền vé (`ticketTotal`), tiền combo (`comboTotal`), tiền giảm giá voucher (`discountAmount` chỉ tính trên `ticketTotal`) hoàn toàn ở Server-side: `finalAmount = Math.max(0, (ticketTotal - discountAmount) + comboTotal)`.
10. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`:
    - Tạo bản ghi `Payment` (`status = 'Pending'`, `transactionCode = YYMMDD_LMC...`, lưu `seatIds`, `ticketItems`, `couponCode`).
    - Tạo các bản ghi `OrderCombo` (`isDelivered = false`).
    - Gia hạn `Seat.reservedUntil = NOW + 10m`.
11. `[Next.js API Server]` -> `[ZaloPay Sandbox v2 (POST /v2/create)]`: Tạo chuỗi HMAC input `app_id|app_trans_id|app_user|amount|app_time|embed_data|item`, ký `mac` bằng `ZALOPAY_KEY1` (`HMAC-SHA256`) và gửi yêu cầu tạo đơn.
12. `[ZaloPay Sandbox v2]` -> `[Next.js API Server]`: Trả về `{ return_code: 1, order_url, zp_trans_token, qr_code }`.
13. `[Next.js API Server]` -> `[Giao diện UI]`: Trả về HTTP `201 Created` kèm `payment_url` (`order_url`). Giao diện chuyển hướng khách hàng sang cổng thanh toán ZaloPay.

**Giai đoạn 3 - Xử lý kết quả thanh toán ZaloPay IPN & Return (`POST /api/payments/zalopay-ipn` & `GET /api/payments/zalopay-return`):**
14. `[Customer]` -> `[ZaloPay Sandbox v2]`: Quét mã QR hoặc xác nhận thanh toán trên cổng ZaloPay.
15. `[ZaloPay Sandbox v2]` -> `[Next.js API Server (POST /api/payments/zalopay-ipn)]`: Gọi bất đồng bộ Webhook IPN gửi `{ data, mac, type }`. (Song song đó, trình duyệt khách hàng được Redirect về `GET /api/payments/zalopay-return?apptransid=...&status=1`).
16. `[Next.js API Server]` -> `[Next.js API Server]`: Tính `expectedMac = HMAC_SHA256(ZALOPAY_KEY2, data)` và so sánh an toàn hằng thời gian qua `crypto.timingSafeEqual` để chống Timing Attack.
17. `[Next.js API Server]` -> `[PostgreSQL DB (processZaloPayPaymentSuccess - Prisma $transaction)]`:
    - Kiểm tra **Idempotency**: Nếu `payment.status === 'Success'` thì dừng và trả về `{ return_code: 1, already_processed: true }`.
    - Cập nhật `Payment.status = 'Success'`.
    - Cập nhật `Seat.status = 'OCCUPIED'`, `reservedUntil = null`.
    - Tạo các bản ghi `Ticket` (`status = 'Valid'`) cho từng ghế trong đơn.
    - Cập nhật `ComboReservation.status = 'COMPLETED'` (đơn `OrderCombo` giữ trạng thái `isDelivered = false` / `Chưa nhận`).
    - Tăng `Coupon.usedCount` thêm `1` (nếu có `payment.couponCode`).
18. `[Next.js API Server]` -> `[SMTP Email Service]`: Kích hoạt tiến trình nền gửi email xác nhận kèm mã vé và thông tin QR Code.
19. `[Next.js API Server]` -> `[Giao diện UI (/payment-result?status=success)]`: Hiển thị hóa đơn điện tử và render mã QR SVG (`<QRCodeSVG />`) chứa payload đã ký `HMAC-SHA256`.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **3a. Vượt quá số ghế tối đa cho phép trong 1 giao dịch:**
  - *Decision Guard:* `[seat_ids.length > 8]`
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`code: 'MAX_SEATS_EXCEEDED'`, message: `"Bạn chỉ có thể giữ chỗ tối đa 8 ghế trong một lần đặt"`).
- **3b. Xung đột giữ ghế đồng thời (Race Condition / Double Booking):**
  - *Decision Guard:* `[activeTickets.length > 0 || occupiedSeats.length > 0 || activeReservedSeats.length > 0 || updateResult.count !== seat_ids.length]`
  - *Xử lý:* Rollback toàn bộ `prisma.$transaction`, trả về HTTP `400 Bad Request` (`code: 'SEAT_ALREADY_RESERVED'`, message: `"[E-03] Ghế [...] hiện đang có người khác giữ chỗ hoặc đã bán. Vui lòng chọn ghế khác!"`). Ngoài ra, nếu có 2 tiến trình lọt qua tầng kiểm tra cùng lúc khi tạo vé, **Partial Unique Index** `unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled'` tại PostgreSQL sẽ chặn đứng việc ghi trùng ghế.
- **7a. Combo bắp nước hết hàng hoặc ngừng kinh doanh:**
  - *Decision Guard:* `[combo.status !== 'ACTIVE' || combo.stock < requestedQty || updateResult.count === 0]`
  - *Xử lý:* Rollback transaction giữ combo, trả về HTTP `400 Bad Request` (`code: 'INSUFFICIENT_STOCK'` hoặc `'COMBO_INACTIVE'`).
- **9a. Chọn vé Trẻ em cho phim gắn nhãn độ tuổi T18 (Vi phạm BR-02):**
  - *Decision Guard:* `[isAdultOnly && hasChildTicket]`
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`code: 'CHILD_TICKET_NOT_ALLOWED'`, message: `"Phim có nhãn phân loại độ tuổi T18, tuyệt đối không áp dụng vé Trẻ em theo quy chế BR-02"`).
- **9b.Tổng số lượng loại vé không khớp tổng số ghế:**
  - *Decision Guard:* `[totalTicketCount !== finalSeatIds.length]`
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`code: 'TICKET_SEAT_COUNT_MISMATCH'`).
- **16a. Chữ ký MAC từ ZaloPay Callback không hợp lệ:**
  - *Decision Guard:* `[!isSignatureValid]`
  - *Xử lý:* Không cập nhật DB, trả về JSON `{ return_code: -1, return_message: "mac not equal" }`.
- **16b. Khách hàng hủy thanh toán hoặc hết hạn 10 phút giữ chỗ (Timeout):**
  - *Decision Guard:* `[rawStatus !== '1' || NOW() > reservedUntil]`
  - *Xử lý:* Trình duyệt được điều hướng về `/payment-result?status=failed`; Tiến trình Cron (`release-seats`, `release-combos`) hoặc Lazy Release tự động chuyển ghế về `EMPTY`, cộng lại `Combo.stock`, chuyển `ComboReservation` sang `RELEASED`, và **không tăng** `Coupon.usedCount`.

---

### 4.4 Phân hệ Bán vé & Bán Combo Tại Quầy (POS Sales)

#### 4.4.1 Danh mục Yêu cầu Chức năng
- **FR-POS-01 (Bán vé trực tiếp tại quầy - POS Ticket Sales):** Nhân viên (`STAFF` / `ADMIN`) chọn suất chiếu, chọn ghế trống trên sơ đồ, phân loại vé (`Thường` 100% / `Trẻ em` 50% sau khi kiểm tra trực tiếp độ tuổi của khách) và chọn kèm combo bắp nước (nếu có) qua endpoint `POST /api/staff/pos/tickets`. Hệ thống áp dụng cùng quy tắc chặn vé Trẻ em đối với phim `T18` (`BR-02`).
- **FR-POS-02 (Gắn định danh thành viên hoặc Khách vãng lai):** Cho phép nhân viên nhập Số điện thoại, Email hoặc Họ tên khách hàng. Hệ thống tự động tra cứu trong bảng `users` để gắn vé vào tài khoản thành viên; nếu khách chưa có tài khoản hoặc là khách vãng lai, hàm `resolveCustomer()` tự động khởi tạo/ánh xạ hồ sơ khách vãng lai (`@guest.lumicinema.vn` hoặc `@lumicinema.vn`) để đảm bảo ràng buộc khóa ngoại toàn vẹn.
- **FR-POS-03 (Bán Combo bắp nước độc lập - Standalone Concession POS):** Cho phép nhân viên bán lẻ các gói combo bắp nước trực tiếp tại quầy qua `POST /api/staff/pos/combos` mà không cần chọn phim hay suất chiếu (phục vụ khách vãng lai hoặc khách đã mua vé online muốn mua thêm tại rạp). Hệ thống trừ tồn kho nguyên tử (`where: { id, stock: { gte: quantity } }`) và đánh dấu `OrderCombo.isDelivered = true` ngay lập tức vì nhân viên trao tận tay tại quầy.
- **FR-POS-04 (Xác nhận thu tiền & Xuất vé tức thì):** Hỗ trợ phương thức thanh toán Tiền mặt (`Cash`) hoặc Chuyển khoản/Thẻ tại quầy (`BankCard` / `VNPay` / `POS_QR`). Ngay khi nhân viên nhấn **"Xác nhận đã thu tiền"**, hệ thống thực thi một giao dịch nguyên tử duy nhất chuyển `Payment` sang `Success`, `Seat` sang `OCCUPIED`, `Ticket` sang `Valid`, sinh chữ ký `HMAC-SHA256` và trả về dữ liệu biên lai (`REC-POS-...` / `REC-COMBO-...`) để in phiếu/vé tại chỗ.

#### 4.4.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actor:** Nhân viên quầy vé (`STAFF`), Quản trị viên (`ADMIN`).<br>- **Secondary Actors:** Khách hàng tại quầy (Walk-in Customer), Cơ sở dữ liệu `PostgreSQL`, Máy in hóa đơn/vé nhiệt POS. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Nhân viên đã đăng nhập với vai trò `STAFF` hoặc `ADMIN`.<br>- Ghế được chọn (nếu bán vé) đang ở trạng thái `EMPTY`; số lượng tồn kho Combo (`Combo.stock`) đủ đáp ứng số lượng yêu cầu. |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Thành công:** Tạo bản ghi `Payment (status = 'Success')`; Ghế chuyển thẳng sang `OCCUPIED`; Vé được tạo với `status = 'Valid'` kèm chữ ký QR `sig`; Tồn kho `Combo.stock` giảm tương ứng; Bản ghi `OrderCombo` được tạo với `isDelivered = true` và `deliveredAt = NOW()`; Xuất biên lai in vé.<br>- **Thất bại:** Rollback toàn bộ thay đổi; trả về lỗi HTTP `400`, `401`, `403`, hoặc `404`. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `POST /api/staff/pos/tickets` *(alias thiết kế: `POST /api/staff/pos`)* (Bán vé kèm combo tại quầy).<br>  + `POST /api/staff/pos/combos` *(alias thiết kế: `POST /api/staff/combos/sell`)* (Bán lẻ combo bắp nước độc lập tại quầy).<br>- **Bảng CSDL:** `users`, `screenings`, `movies`, `seats`, `combos`, `payments`, `tickets`, `order_combos`. |

##### A. Luồng sự kiện chính (Main / Basic Flow)

**Luồng 4.4A - Bán vé kèm Combo tại quầy (`POST /api/staff/pos/tickets`):**
1. `[Staff]` -> `[Giao diện POS (/staff)]`: Chọn suất chiếu, chọn ghế trống trên sơ đồ, chọn số lượng vé `Thường` / `Trẻ em`, chọn Combo bắp nước, nhập thông tin khách (`customer_name`, `customer_phone`, `customer_email` nếu có), chọn phương thức thu tiền (`Cash` / `BankCard`) và nhấn **"Xác nhận thu tiền & Xuất vé"**.
2. `[Giao diện POS]` -> `[Next.js API Server (POST /api/staff/pos/tickets)]`: Gửi HTTP POST kèm JSON Payload.
3. `[Next.js API Server]` -> `[Auth Helper]`: Gọi `requireAuth(['STAFF', 'ADMIN'])` xác thực quyền nhân viên.
4. `[Next.js API Server]` -> `[PostgreSQL DB (screenings, seats, combos)]`:
   - Kiểm tra suất chiếu tồn tại và kiểm tra quy tắc độ tuổi `BR-02` (chặn vé `Trẻ em` nếu phim `T18`).
   - Kiểm tra toàn bộ ghế trong `seat_ids` thuộc suất chiếu và chưa bị bán (`status !== 'OCCUPIED'`).
   - Kiểm tra tồn kho `combo.stock >= item.quantity` cho từng món bắp nước.
   - Tính tổng tiền `finalAmount = ticketTotal + comboTotal`.
5. `[Next.js API Server]` -> `[PostgreSQL DB (users)]`: Gọi `resolveCustomer(customer_name, customer_phone, customer_email)` tìm khách hàng hiện hữu hoặc `upsert` hồ sơ khách vãng lai.
6. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`: Thực thi giao dịch nguyên tử:
   - **Bước 6.1:** Tạo `Payment` (`status = 'Success'`, `transactionCode = 'POS_...'`, `amount = finalAmount`).
   - **Bước 6.2:** Cập nhật `Seat.updateMany` chuyển các ghế sang `status = 'OCCUPIED'`, `reservedUntil = null`.
   - **Bước 6.3:** Giảm tồn kho `Combo.update({ data: { stock: { decrement: quantity } } })` và tạo `OrderCombo` với `isDelivered = true`, `deliveredAt = NOW()`.
   - **Bước 6.4:** Tạo từng bản ghi `Ticket` (`status = 'Valid'`) và gọi `generateTicketSignature(ticket.id, customer.id, seatId, 'Valid')` băm `HMAC-SHA256` tạo chuỗi `qr_payload`.
7. `[Next.js API Server]` -> `[Giao diện POS]`: Trả về HTTP `201 Created` kèm đối tượng biên lai `receipt` (`receipt_no: 'REC-POS-...'`, danh sách vé kèm `qr_payload`).
8. `[Giao diện POS]` -> `[Staff]`: Hiển thị biên lai vé kèm mã QR để in trực tiếp cho khách hàng.

**Luồng 4.4B - Bán lẻ Combo bắp nước độc lập tại quầy (`POST /api/staff/pos/combos`):**
1. `[Staff]` -> `[Giao diện POS (/staff)]`: Chuyển sang tab **"Bán Bắp Nước Lẻ"**, chọn danh sách `items: [{ combo_id, quantity }]`, chọn hình thức thanh toán và nhấn **"Thanh toán & Giao hàng"**.
2. `[Giao diện POS]` -> `[Next.js API Server (POST /api/staff/pos/combos)]`: Gửi HTTP POST.
3. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`:
   - Xác thực `requireAuth(['STAFF', 'ADMIN'])` và định danh khách qua `resolveCustomer()`.
   - Tạo `Payment` (`status = 'Success'`, `transactionCode = 'POS_COMBO_...'`).
   - Duyệt từng món combo, thực thi cập nhật có điều kiện nguyên tử `tx.combo.updateMany({ where: { id: item.combo_id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })`.
   - Tạo các bản ghi `OrderCombo` với `isDelivered = true`, `deliveredAt = NOW()`.
4. `[Next.js API Server]` -> `[Giao diện POS]`: Trả về HTTP `201 Created` kèm biên lai `REC-COMBO-...`.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **3a. Người gọi không phải STAFF hoặc ADMIN:**
  - *Decision Guard:* `[!session || !['STAFF', 'ADMIN'].includes(session.user.role)]`
  - *Xử lý:* Trả về HTTP `401 Unauthorized` hoặc `403 Forbidden`.
- **4a. Ghế đã có người mua trước đó:**
  - *Decision Guard:* `[occupiedSeats.length > 0]`
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`code: 'SEATS_OCCUPIED'`, message: `"Ghế [...] đã được bán trước đó. Vui lòng chọn ghế khác!"`).
- **4b. Bán vé Trẻ em cho phim T18 tại quầy:**
  - *Decision Guard:* `[isChild && isAdultOnlyMovie]`
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`code: 'CHILD_TICKET_NOT_ALLOWED'`).
- **4c / 3b (Luồng Combo). Hết tồn kho bắp nước tại thời điểm bấm nút:**
  - *Decision Guard:* `[combo.stock < item.quantity || updateResult.count === 0]`
  - *Xử lý:* Rollback transaction, trả về HTTP `400 Bad Request` (`code: 'COMBO_OUT_OF_STOCK'` / `'OUT_OF_STOCK'`).

---

### 4.5 Phân hệ Soát vé & Giao nhận Combo (Ticket Check-in & Combo Fulfillment)

#### 4.5.1 Danh mục Yêu cầu Chức năng
- **FR-CHK-01 (Soát vé vào rạp bằng QR / Mã vé - Ticket Check-in):**
  - Nhân viên soát vé (`STAFF` / `ADMIN`) quét mã QR trên vé của khách hoặc tra cứu/nhập mã vé (`#LMC-XXXXXX` qua `GET /api/staff/tickets/search`) và kích hoạt soát vé qua `PATCH /api/tickets/[id]/mark-used`.
  - Hệ thống kiểm tra tính hợp lệ của chữ ký điện tử `HMAC-SHA256` (nếu quét từ QR payload), kiểm tra trạng thái vé bắt buộc là `Valid`, đúng phòng chiếu và nằm trong khung giờ cho phép soát vé (từ **30 phút trước `startTime`** đến thời điểm kết thúc suất chiếu `endTime`).
  - Khi hợp lệ: Hệ thống chuyển trạng thái vé từ `Valid` sang `Used` và ghi nhận thời điểm `checked_in_at`. Nếu vé đã ở trạng thái `Used` hoặc `Cancelled`, hệ thống chặn tuyệt đối và phát cảnh báo đỏ ngay trên màn hình soát vé.
- **FR-CHK-02 (Giao nhận Combo bắp nước độc lập & Chặn nhận trùng - BR-05):**
  - Quy trình giao nhận bắp nước hoàn toàn độc lập với trạng thái soát vé (khách có thể nhận bắp nước trước khi vào rạp hoặc ngược lại).
  - Nhân viên quầy bắp nước tra cứu đơn hàng qua `GET /api/staff/combos/orders?q={code/phone}&status=pending` bằng mã giao dịch (`transactionCode`), mã thanh toán (`paymentId`), mã vé hoặc số điện thoại khách hàng.
  - Khi nhân viên nhấn **"Xác nhận giao combo"** (`POST /api/staff/combos/deliver`), hệ thống kiểm tra đơn hàng phải có `Payment.status === 'Success'` và các gói combo được chọn phải đang ở trạng thái `isDelivered === false` (`Chưa nhận`), sau đó cập nhật đồng loạt sang `isDelivered = true` (`Đã nhận`) kèm mốc thời gian `deliveredAt = NOW()`.
  - **Chặn nhận lần hai (Anti-Double Claim):** Nếu bất kỳ gói combo nào trong yêu cầu đã có `isDelivered === true`, hệ thống ném lỗi HTTP `409 Conflict` (`code: 'COMBO_ALREADY_DELIVERED'`) kèm thời gian đã nhận trước đó.

#### 4.5.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actor:** Nhân viên soát vé / Nhân viên quầy bắp nước (`STAFF`), Quản trị viên (`ADMIN`).<br>- **Secondary Actors:** Khách hàng (`CUSTOMER` xuất trình mã QR / mã đơn), Thiết bị Camera/Scanner QR, Cơ sở dữ liệu `PostgreSQL`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Nhân viên đã đăng nhập với vai trò `STAFF` hoặc `ADMIN`.<br>- Đối với Soát vé: Vé tồn tại trong bảng `tickets`, thuộc đơn hàng đã thanh toán thành công.<br>- Đối với Giao Combo: Hóa đơn `Payment` ở trạng thái `Success` và có bản ghi trong bảng `order_combos`. |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Soát vé thành công:** Bản ghi `Ticket.status` chuyển từ `Valid` sang `Used`; trả về thông tin ghế, phòng chiếu và thời gian check-in.<br>- **Giao Combo thành công:** Bản ghi `OrderCombo.isDelivered` chuyển từ `false` (`Chưa nhận`) sang `true` (`Đã nhận`), lưu `deliveredAt = NOW()`.<br>- **Thất bại (Quét trùng / Vé hủy):** Giữ nguyên trạng thái DB, trả về mã lỗi HTTP `400`, `404`, hoặc `409`. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `GET /api/staff/tickets/search` (Tra cứu vé theo mã `#LMC-XXXXXX`, SĐT, Email, mã giao dịch).<br>  + `PATCH /api/tickets/[id]/mark-used` *(alias thiết kế: `POST /api/staff/checkin`)* (Xác nhận soát vé vào phòng chiếu).<br>  + `GET /api/staff/combos/orders` *(alias thiết kế: `GET /api/staff/combos`)* (Tra cứu danh sách đơn hàng combo tại quầy bắp nước).<br>  + `POST /api/staff/combos/deliver` *(alias thiết kế: `POST /api/staff/combos/fulfill`)* (Xác nhận bàn giao combo và khóa chống nhận trùng).<br>- **Bảng CSDL:** `tickets`, `screenings`, `movies`, `seats`, `payments`, `order_combos`, `combos`, `users`. |

##### A. Luồng sự kiện chính (Main / Basic Flow)

**Luồng 4.5A - Soát vé QR vào phòng chiếu (`GET /api/staff/tickets/search` & `PATCH /api/tickets/[id]/mark-used`):**
1. `[Customer]` -> `[Staff]`: Xuất trình mã QR vé điện tử hoặc đọc mã vé `#LMC-XXXXXX` tại cổng kiểm soát.
2. `[Staff]` -> `[Giao diện Soát vé (/staff)]`: Quét mã QR hoặc nhập mã vé vào ô tra cứu.
3. `[Giao diện Soát vé]` -> `[Next.js API Server (GET /api/staff/tickets/search?code=...)]`: Truy vấn thông tin chi tiết của vé, suất chiếu, phòng chiếu và ghế ngồi.
4. `[Next.js API Server]` -> `[Giao diện Soát vé]`: Trả về thông tin vé (`status`, `movie.title`, `screening.room`, `screening.startTime`, `seat.code`).
5. `[Staff]` -> `[Giao diện Soát vé]`: Kiểm tra đối chiếu phòng chiếu/khung giờ và nhấn nút **"Xác nhận Check-in (Soát vé)"**.
6. `[Giao diện Soát vé]` -> `[Next.js API Server (PATCH /api/tickets/[id]/mark-used)]`: Gửi yêu cầu đánh dấu vé đã sử dụng.
7. `[Next.js API Server]` -> `[PostgreSQL DB (tickets)]`:
   - Kiểm tra quyền `session.user.role` thuộc `['STAFF', 'ADMIN']`.
   - Truy vấn `prisma.ticket.findUnique({ where: { id: ticketId }, include: { screening, seat, user } })`.
   - Kiểm tra điều kiện hợp lệ: `ticket.status === 'Valid'` và nằm trong khung giờ soát vé hợp lệ (`NOW >= startTime - 30 phút` và `NOW <= endTime`).
   - Thực thi `prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'Used' } })`.
8. `[Next.js API Server]` -> `[Giao diện Soát vé]`: Trả về HTTP `200 OK` kèm `{ ticket_id, status: 'Used', seat_code, checked_in_at }`.
9. `[Giao diện Soát vé]` -> `[Staff]`: Hiển thị thông báo xanh `"Soát vé thành công! Ghế [Mã ghế] đã chuyển sang ĐÃ SỬ DỤNG"`.

**Luồng 4.5B - Giao nhận Combo độc lập tại quầy bắp nước (`GET /api/staff/combos/orders` & `POST /api/staff/combos/deliver`):**
1. `[Customer]` -> `[Staff (Quầy Bắp Nước)]`: Cung cấp mã đơn hàng (`transactionCode` / `paymentId`) hoặc Số điện thoại.
2. `[Staff]` -> `[Giao diện Quầy Combo (/staff)]`: Nhập từ khóa tìm kiếm vào ô tra cứu đơn bắp nước.
3. `[Giao diện Quầy Combo]` -> `[Next.js API Server (GET /api/staff/combos/orders?q=...&status=pending)]`: Truy vấn các đơn hàng có `Payment.status === 'Success'` kèm danh sách `orderCombos`.
4. `[Next.js API Server]` -> `[Giao diện Quầy Combo]`: Trả về danh sách các món combo trong đơn cùng trạng thái `isDelivered` (`false`: Chưa nhận / `true`: Đã nhận).
5. `[Staff]` -> `[Giao diện Quầy Combo]`: Chuẩn bị bắp nước theo số lượng, chọn các món cần giao (hoặc chọn toàn bộ đơn) và nhấn **"Xác nhận đã giao combo"**.
6. `[Giao diện Quầy Combo]` -> `[Next.js API Server (POST /api/staff/combos/deliver)]`: Gửi `{ orderComboIds: [...] }` hoặc `{ paymentId }`.
7. `[Next.js API Server]` -> `[PostgreSQL DB (order_combos)]`:
   - Truy vấn `prisma.orderCombo.findMany({ where: { id: { in: targetIds } }, include: { combo, payment } })`.
   - Kiểm tra quy tắc **BR-05 (Anti-Double Claim)**: Đảm bảo không có bản ghi nào trong `targetIds` có `isDelivered === true`.
   - Kiểm tra `payment.status === 'Success'`.
   - Thực thi `prisma.orderCombo.updateMany({ where: { id: { in: targetIds } }, data: { isDelivered: true, deliveredAt: new Date() } })`.
8. `[Next.js API Server]` -> `[Giao diện Quầy Combo]`: Trả về HTTP `200 OK` kèm `{ deliveredCount, deliveredAt, deliveredBy, combos }`.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **7a (Luồng Soát vé). Vé đã được sử dụng trước đó (Quét QR lần 2):**
  - *Decision Guard:* `[ticket.status === 'Used']`
  - *Xử lý:* Từ chối check-in, trả về HTTP `400 Bad Request` (`code: 'TICKET_ALREADY_USED'`, message: `"Vé #... đã được quét check-in trước đó"`).
- **7b (Luồng Soát vé). Vé đã bị hủy:**
  - *Decision Guard:* `[ticket.status === 'Cancelled']`
  - *Xử lý:* Từ chối check-in, trả về HTTP `400 Bad Request` (`code: 'TICKET_CANCELLED'`, message: `"Vé #... đã bị hủy, không được phép vào phòng chiếu"`).
- **7c (Luồng Soát vé). Sai khung giờ soát vé hoặc không tìm thấy vé:**
  - *Decision Guard:* `[!ticket]` -> Trả về HTTP `404 Not Found` (`code: 'TICKET_NOT_FOUND'`).
  - *Decision Guard:* `[NOW < startTime - 30m || NOW > endTime]` -> Cảnh báo vé chưa đến giờ mở cửa phòng chiếu hoặc suất chiếu đã kết thúc (`400 Bad Request`).
- **7a (Luồng Giao Combo). Khách hàng yêu cầu nhận lại Combo đã giao (Vi phạm BR-05):**
  - *Decision Guard:* `[alreadyDelivered.length > 0]` (`c.isDelivered === true`)
  - *Xử lý:* Chặn đứng giao dịch, trả về HTTP `409 Conflict` (`code: 'COMBO_ALREADY_DELIVERED'`, message: `"CẢNH BÁO TRÙNG LẶP: Combo [...] đã được nhận lúc [HH:mm DD/MM/YYYY]. Hệ thống nghiêm cấm giao nhận lần 2!"`).
- **7b (Luồng Giao Combo). Đơn hàng chưa thanh toán thành công:**
  - *Decision Guard:* `[c.payment.status !== 'Success']`
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`code: 'PAYMENT_NOT_SUCCESS'`).

---

### 4.6 Phân hệ Hủy vé & Đền bù / Hoàn tiền (Ticket Cancellation & Compensation/Refund)

#### 4.6.1 Bảng Đối chiếu Chính sách Hủy vé & Bồi hoàn (BR-03 vs Sự cố Rạp)

| Tiêu chí đối chiếu | Luồng 1: Khách hàng chủ động tự hủy vé (`BR-03`) | Luồng 2: Hủy vé do sự cố rạp & Hoàn tiền mặt (`UC-15`) |
| :--- | :--- | :--- |
| **Tác nhân thực hiện** | Khách hàng (`CUSTOMER` - chính chủ vé) hoặc `ADMIN` hỗ trợ. | Nhân viên (`STAFF`) hoặc Quản trị viên (`ADMIN`). |
| **API Endpoint** | `POST /api/tickets/[id]/cancel` (hoặc `DELETE /api/tickets/[id]/cancel`). | `POST /api/staff/tickets/[id]/cancel-with-voucher` *(alias: `/api/staff/tickets/[id]/cancel` & `/refund`)*. |
| **Điều kiện trạng thái vé** | Vé phải ở trạng thái `Valid` (Tuyệt đối chặn vé `Used` hoặc `Cancelled`). | Vé phải ở trạng thái `Valid` (Tuyệt đối chặn vé `Used` hoặc `Cancelled`). |
| **Điều kiện thời gian** | Bắt buộc cách giờ khởi chiếu **>= 2 giờ** (`startTime - NOW() >= 7,200,000 ms`). | **Không giới hạn 2 giờ** (Áp dụng ngay cả sát giờ chiếu khi xảy ra sự cố kỹ thuật). |
| **Hình thức bồi hoàn** | **Cấp tự động Voucher giảm 50%** (`COMP50_[TicketID]_[Random]`, hạn dùng 30 ngày, `maxUsage = 1`). **Không hoàn tiền mặt.** | **Hoàn 100% tiền mặt (`CASH`)** theo giá thực trả của vé (hoặc tùy chọn cấp Voucher đền bù 100% `COMP100_...` nếu khách yêu cầu). |
| **Tác động tới Ghế ngồi** | Giải phóng ghế (`Seat.status = 'EMPTY'`, `reservedUntil = null`) ngay lập tức để bán cho khách khác. | Giải phóng ghế (`Seat.status = 'EMPTY'`, `reservedUntil = null`). Nếu hủy cả suất chiếu thì khóa suất chiếu (`ENDED`/`CANCELLED`). |
| **Tác động tới Combo** | **Giữ nguyên hiệu lực Combo** theo mã đơn hàng; khách vẫn đến quầy nhận bắp nước bình thường. | Nếu hủy toàn bộ đơn/suất chiếu: Combo `Chưa nhận` (`isDelivered = false`) được hoàn tiền mặt 100% và cộng lại tồn kho `Combo.stock`. |

#### 4.6.2 Danh mục Yêu cầu Chức năng
- **FR-CAN-01 (Hủy từng vé lẻ độc lập & Cấp Voucher bồi hoàn 50% - BR-03):** Trong một đơn hàng gồm nhiều ghế, khách hàng được phép chọn hủy từng vé lẻ (`Ticket`) qua `POST /api/tickets/[id]/cancel` mà không làm ảnh hưởng đến các vé còn lại trong cùng hóa đơn. Nếu thỏa mãn điều kiện `status === 'Valid'` và trước giờ chiếu `>= 2 tiếng`, hệ thống thực thi giao dịch nguyên tử: chuyển vé sang `Cancelled`, giải phóng ghế về `EMPTY`, sinh mã `Coupon` định dạng `COMP50_[TicketID]_[4_Digits]` (`discountType = 'Percentage'`, `discountValue = 50`, hạn 30 ngày, gắn riêng cho `userId` của khách) và gửi email thông báo bất đồng bộ.
- **FR-CAN-02 (Quy trình hủy vé sự cố rạp & Đối soát hoàn tiền mặt 100% - UC-15):**
  - Khi rạp gặp sự cố kỹ thuật (mất điện, hỏng máy chiếu) hoặc xử lý ngoại lệ tại quầy, Nhân viên (`STAFF`) hoặc `ADMIN` thực hiện hủy vé qua `POST /api/staff/tickets/[id]/cancel-with-voucher` (hoặc khi Admin hủy suất chiếu khẩn cấp).
  - Hệ thống chuyển trạng thái vé sang `Cancelled` kèm lý do chi tiết trong `cancellationReason`, giải phóng ghế về `EMPTY`. Nếu toàn bộ vé trong đơn `Payment` đều đã hủy, trạng thái `Payment.status` tự động chuyển sang `Refunded`.
  - Đối với khách mua online bị hủy do sự cố suất chiếu (ghi nhận công nợ chờ hoàn `PENDING_CASH_REFUND`), khách có thời hạn **30 ngày** để đến quầy xuất trình mã vé nhận lại 100% tiền mặt. Khi nhân viên xác nhận chi quỹ hoàn tiền tại quầy, hệ thống xuất phiếu chi điện tử (`cash_receipt: REF-CASH-...` / trạng thái `REFUNDED_CASH` / `COMPLETED_CASH_REFUND`) và ghi nhận nhật ký kiểm toán (`audit_log`) gồm `staff_id`, `staff_role`, `ticket_id`, `refund_amount`, `reason` và `timestamp`.
- **FR-CAN-03 (Chặn tuyệt đối hủy vé đã sử dụng):** Bất kỳ vé nào đã chuyển sang trạng thái `Used` (đã quét QR check-in vào phòng chiếu) đều bị khóa cứng, không được phép hủy hoặc hoàn tiền dưới mọi hình thức.

#### 4.6.3 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Luồng 1 (Khách tự hủy):** Khách hàng (`CUSTOMER`).<br>- **Luồng 2 (Sự cố rạp & Hoàn tiền):** Nhân viên (`STAFF`), Quản trị viên (`ADMIN`).<br>- **Secondary Actors:** Dịch vụ gửi thư `SMTP Email Service`, Cơ sở dữ liệu `PostgreSQL`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Vé (`ticket_id`) tồn tại trong bảng `tickets` và đang ở trạng thái `Valid`.<br>- Đối với Luồng 1: Người gọi là chủ sở hữu vé (`ticket.userId === session.user.id`) và `screening.startTime - NOW() >= 2 giờ`.<br>- Đối với Luồng 2: Người gọi có vai trò `STAFF` hoặc `ADMIN`. |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Luồng 1:** `Ticket.status` -> `Cancelled`; `Seat.status` -> `EMPTY`; Tạo mới 1 bản ghi `Coupon` (`COMP50_...`, giảm 50%, hạn 30 ngày); Gửi email thông báo mã voucher.<br>- **Luồng 2:** `Ticket.status` -> `Cancelled`; `Seat.status` -> `EMPTY`; `Payment.status` -> `Refunded` (nếu hết vé active trong đơn); Xuất biên lai hoàn tiền mặt `REF-CASH-...` (hoặc voucher `COMP100_...`) và trả về cấu trúc `audit_log` đối soát kế toán. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `POST /api/tickets/[id]/cancel` & `DELETE /api/tickets/[id]/cancel` (Khách hàng chủ động hủy vé trước 2 giờ).<br>  + `POST /api/staff/tickets/[id]/cancel-with-voucher` *(alias thiết kế: `POST /api/staff/tickets/[id]/cancel` & `POST /api/staff/tickets/[id]/refund`)* (Nhân viên/Admin hủy vé sự cố & xác nhận hoàn tiền mặt 100%).<br>- **Bảng CSDL:** `tickets`, `seats`, `coupons`, `payments`, `screenings`, `order_combos`, `combos`, `users`. |

##### A. Luồng sự kiện chính (Main / Basic Flow)

**Luồng 4.6A - Khách hàng chủ động tự hủy vé & Nhận Voucher 50% (`POST /api/tickets/[id]/cancel`):**
1. `[Customer]` -> `[Giao diện Lịch sử vé (/profile)]`: Chọn một vé đang ở trạng thái `Valid` và nhấn nút **"Hủy vé"**.
2. `[Giao diện UI]` -> `[Next.js API Server (POST /api/tickets/[id]/cancel)]`: Gửi yêu cầu hủy vé kèm Cookie phiên đăng nhập.
3. `[Next.js API Server]` -> `[NextAuth Session]`: Xác thực `session.user.id` và lấy `currentUserId`.
4. `[Next.js API Server]` -> `[PostgreSQL DB (tickets)]`: Truy vấn `prisma.ticket.findUnique({ where: { id: ticketId }, include: { user, screening, seat } })`.
5. `[Next.js API Server]` -> `[Next.js API Server]`:
   - Kiểm tra quyền sở hữu: `ticket.userId === currentUserId || currentUserRole === 'ADMIN'`.
   - Kiểm tra trạng thái vé: `ticket.status === 'Valid'`.
   - Kiểm tra quy tắc thời gian **BR-03**: Tính `timeDiffMs = new Date(ticket.screening.startTime).getTime() - Date.now()`. Xác nhận `timeDiffMs >= 2 * 60 * 60 * 1000` (2 tiếng).
6. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`: Thực thi giao dịch nguyên tử:
   - **Bước 6.1:** Cập nhật `tx.ticket.update({ where: { id: ticket.id }, data: { status: 'Cancelled', cancellationReason: 'Khách hàng chủ động hủy vé trước giờ chiếu ít nhất 2 tiếng theo quy chế BR-03' } })`.
   - **Bước 6.2:** Giải phóng ghế `tx.seat.update({ where: { id: ticket.seatId }, data: { status: 'EMPTY', reservedUntil: null } })`.
   - **Bước 6.3:** Sinh mã `couponCode = COMP50_${ticket.id}_${random4Digits}` có `expiryDate = NOW + 30 ngày` và lưu vào bảng `coupons` (`discountType = 'Percentage'`, `discountValue = 50`, `maxUsage = 1`, `userId = ticket.userId`).
7. `[Next.js API Server]` -> `[SMTP Email Service]`: Gọi hàm bất đồng bộ `sendVoucherIssued()` gửi mã `COMP50_...` tới email khách hàng.
8. `[Next.js API Server]` -> `[Giao diện UI]`: Trả về HTTP `200 OK` kèm `{ ticket_id, status: 'Cancelled', released_seat, compensation_coupon }`.

**Luồng 4.6B - Hủy vé do sự cố rạp & Hoàn tiền mặt 100% tại quầy (`POST /api/staff/tickets/[id]/cancel-with-voucher`):**
1. `[Staff / Admin]` -> `[Giao diện Tra cứu vé (/staff)]`: Tra cứu vé của khách hàng gặp sự cố, chọn phương thức hoàn trả `refund_method: 'CASH'`, nhập lý do `reason` / `notes` và nhấn **"Xác nhận Hủy & Hoàn tiền 100%"**.
2. `[Giao diện Staff]` -> `[Next.js API Server (POST /api/staff/tickets/[id]/cancel-with-voucher)]`: Gửi `{ reason, refund_method: 'CASH', notes }`.
3. `[Next.js API Server]` -> `[NextAuth Session]`: Xác thực `userRole` thuộc `['STAFF', 'ADMIN']` và trích xuất `staffId = session.user.id`.
4. `[Next.js API Server]` -> `[PostgreSQL DB (tickets)]`: Truy vấn `prisma.ticket.findUnique` kèm `user`, `seat`, `screening.movie`, `payment`. Kiểm tra `ticket.status !== 'Cancelled'` và `ticket.status !== 'Used'`.
5. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`: Thực thi giao dịch nguyên tử:
   - **Bước 5.1:** Cập nhật `Ticket` sang `status = 'Cancelled'`, ghi nhận `cancellationReason`.
   - **Bước 5.2:** Giải phóng ghế `Seat` về `status = 'EMPTY'`, `reservedUntil = null`.
   - **Bước 5.3:** Đếm số vé còn hiệu lực trong cùng `paymentId` (`remainingActiveTickets`). Nếu `remainingActiveTickets === 0`, cập nhật `Payment.status = 'Refunded'`.
   - **Bước 5.4:** Khởi tạo biên lai hoàn tiền mặt `cash_receipt` (`receipt_no: 'REF-CASH-...'`, `refund_amount: Number(ticket.price)`, `status: 'COMPLETED_CASH_REFUND'`) và cấu trúc đối soát `audit_log` lưu vết nhân viên thực hiện.
6. `[Next.js API Server]` -> `[Giao diện Staff]`: Trả về HTTP `200 OK` kèm `cash_receipt` và `audit_log` để nhân viên xuất quỹ chi tiền mặt cho khách và lưu chứng từ kế toán.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **4a. Mã vé không tồn tại:**
  - *Decision Guard:* `[!ticket]` -> Trả về HTTP `404 Not Found` (`code: 'TICKET_NOT_FOUND'`).
- **5a (Luồng 4.6A). Khách hàng cố tình hủy vé của người khác:**
  - *Decision Guard:* `[ticket.userId !== currentUserId && currentUserRole !== 'ADMIN']`
  - *Xử lý:* Trả về HTTP `403 Forbidden` (`code: 'FORBIDDEN'`, message: `"Bạn không có quyền hủy vé của người dùng khác"`).
- **5b (Cả 2 luồng). Vé đã được check-in (`Used`) hoặc đã hủy (`Cancelled`) trước đó:**
  - *Decision Guard:* `[ticket.status === 'Used']` -> Trả về HTTP `400 Bad Request` (`code: 'TICKET_ALREADY_USED'`).
  - *Decision Guard:* `[ticket.status === 'Cancelled']` -> Trả về HTTP `400 Bad Request` (`code: 'TICKET_ALREADY_CANCELLED'`).
- **5c (Luồng 4.6A). Thời điểm khách bấm hủy còn dưới 2 tiếng trước giờ chiếu (Vi phạm BR-03):**
  - *Decision Guard:* `[timeDiffMs < 2 * 60 * 60 * 1000]`
  - *Xử lý:* Chặn hủy vé, trả về HTTP `400 Bad Request` (`code: 'CANCELLATION_TIME_LIMIT_EXCEEDED'`, message: `"Theo quy định BR-03, vé chỉ có thể hủy trước giờ chiếu ít nhất 2 tiếng. Hiện chỉ còn X giờ trước khi suất chiếu bắt đầu."`).

---

### 4.7 Phân hệ Quản lý Voucher & Khuyến mãi (Voucher & Discount Engine)

#### 4.7.1 Danh mục Yêu cầu Chức năng
- **FR-VOU-01 (Phân loại hai nhóm Voucher trong hệ thống):**
  1. *Voucher Chiến dịch Khuyến mãi (Admin Campaign Coupons):* Do Quản trị viên (`ADMIN`) khởi tạo qua `POST /api/coupons` với mã tùy chỉnh (ví dụ: `LUMI2026`, `SUMMER50K`), loại giảm giá theo Phần trăm (`Percentage`) hoặc Số tiền cố định (`FixedAmount`), áp dụng công khai (`userId = null`), có thể giới hạn theo giá trị đơn tối thiểu (`minAmount`), số lượt dùng tối đa (`maxUsage`), ngày hết hạn (`expiryDate`) và bộ phim cụ thể (`applicableMovieId`).
  2. *Voucher Bồi hoàn Tự động (System Compensation Vouchers):* Do hệ thống tự động sinh khi khách hủy vé hợp lệ (`COMP50_[TicketID]_[Random]`) hoặc nhân viên đền bù sự cố (`COMP100_[TicketID]_[Random]`), có `maxUsage = 1`, thời hạn 30 ngày và gắn chặt với định danh cá nhân `userId` của khách hàng đó.
- **FR-VOU-02 (Quy tắc kiểm tra & Công thức tính giảm giá):**
  - Mỗi đơn hàng (`Payment`) chỉ được áp dụng tối đa **01 mã voucher**.
  - **Nguyên tắc tính toán cốt lõi:** Giảm giá của Voucher chỉ được tính trên **Tổng tiền vé xem phim (`ticketTotal`)**, tuyệt đối không giảm trừ vào tiền mua Combo bắp nước (`comboTotal`).
  - Công thức tổng quát:
    $$\text{Tổng thanh toán} = \max\left(0,\ \text{Tổng tiền vé sau hệ số loại vé} - \text{Tiền giảm Voucher}\right) + \text{Tổng tiền Combo}$$
  - Đối với Voucher bồi hoàn `COMP50_`: Giảm 50% giá trị vé theo quy định; số tiền giảm không bao giờ vượt quá `ticketTotal` (`discountAmount = Math.min(discountAmount, ticketTotal)`).
- **FR-VOU-03 (Cơ chế bảo toàn & Hoàn trả lượt dùng khi giao dịch hết hạn 10 phút):**
  - Khi khách hàng kiểm tra mã (`POST /api/coupons/validate`) hoặc khởi tạo đơn (`POST /api/payments/initiate`), hệ thống chỉ ghi nhận `couponCode` vào bản ghi `Payment (Pending)` chứ **chưa cộng** `usedCount` ngay.
  - Chỉ khi giao dịch thanh toán thành công tại Webhook IPN / Return (`processZaloPayPaymentSuccess`), hệ thống mới thực thi `Coupon.updateMany({ data: { usedCount: { increment: 1 } } })`. Nhờ đó, nếu khách hủy ngang trên cổng ZaloPay hoặc để hết hạn 10 phút giữ ghế, lượt sử dụng của Voucher được bảo toàn 100% để khách dùng lại ngay lập tức.
  - Ngược lại, nếu đơn hàng đã thanh toán thành công mà sau đó khách chủ động hủy vé, lượt dùng của voucher đã áp dụng ở đơn cũ không được hoàn lại.

#### 4.7.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actors:** Khách hàng (`CUSTOMER` - kiểm tra & áp dụng mã), Quản trị viên (`ADMIN` - tạo/sửa/xóa chiến dịch mã).<br>- **Secondary Actors:** Cơ sở dữ liệu `PostgreSQL (Bảng coupons, movies, payments)`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Đối với Admin tạo mã: Đăng nhập với vai trò `ADMIN`.<br>- Đối với Khách hàng áp dụng mã: Đang trong luồng thanh toán đơn đặt vé, có `total_amount` (`ticketTotal`) và `movie_id`. |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Khi Validate thành công:** Trả về chi tiết `discount_amount` và `final_amount` để hiển thị trên UI.<br>- **Khi Thanh toán hoàn tất:** Trường `coupons.used_count` tăng thêm `1`. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `POST /api/coupons/validate` (Kiểm tra điều kiện & tính số tiền chiết khấu của mã giảm giá).<br>  + `GET /api/coupons` & `POST /api/coupons` (Liệt kê danh sách & Tạo mới mã khuyến mãi).<br>  + `PUT /api/coupons/[id]` & `DELETE /api/coupons/[id]` (Cập nhật & Xóa mã khuyến mãi).<br>- **Bảng CSDL:** `coupons` (`coupon_id`, `code`, `discount_type`, `discount_value`, `min_amount`, `max_usage`, `used_count`, `expiry_date`, `applicable_movie_id`, `user_id`), `movies`, `payments`. |

##### A. Luồng sự kiện chính (Main / Basic Flow - `POST /api/coupons/validate`)
1. `[Customer]` -> `[Giao diện Thanh toán]`: Nhập mã voucher vào ô **"Mã giảm giá"** và nhấn **"Áp dụng"**.
2. `[Giao diện Thanh toán]` -> `[Next.js API Server (POST /api/coupons/validate)]`: Gửi `{ coupon_code, total_amount: ticketTotal, movie_id }`.
3. `[Next.js API Server]` -> `[Zod Validator]`: Chuẩn hóa `normalizedCode = rawCode.trim().toUpperCase()` và kiểm tra dữ liệu đầu vào.
4. `[Next.js API Server]` -> `[PostgreSQL DB (coupons)]`: Truy vấn `prisma.coupon.findUnique({ where: { code: normalizedCode }, include: { movie: true } })`.
5. `[Next.js API Server]` -> `[Next.js API Server]`: Kiểm tra tuần tự 5 điều kiện biên (Guards):
   - **Guard 5.1 (Hạn dùng):** `expiryEndOfDay (23:59:59.999) >= NOW()`.
   - **Guard 5.2 (Số lượt dùng):** `coupon.usedCount < coupon.maxUsage`.
   - **Guard 5.3 (Giá trị đơn tối thiểu):** `finalTotalAmount >= Number(coupon.minAmount)`.
   - **Guard 5.4 (Phim áp dụng):** `coupon.applicableMovieId === null || coupon.applicableMovieId === finalMovieId`.
   - **Guard 5.5 (Định danh cá nhân):** Nếu `coupon.userId !== null`, kiểm tra `session.user.id === coupon.userId`.
6. `[Next.js API Server]` -> `[Next.js API Server]`: Tính toán số tiền giảm:
   - Nếu `discountType === 'Percentage'`: `discountAmount = Math.round((finalTotalAmount * discountValue) / 100)`.
   - Nếu `discountType === 'FixedAmount'`: `discountAmount = discountValue`.
   - Giới hạn trần: `discountAmount = Math.min(discountAmount, finalTotalAmount)` và `finalAmount = Math.max(0, finalTotalAmount - discountAmount)`.
7. `[Next.js API Server]` -> `[Giao diện Thanh toán]`: Trả về HTTP `200 OK` kèm `{ coupon_id, code, discount_type, discount_value, discount_amount, original_amount, final_amount }`.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **4a. Mã giảm giá không tồn tại:**
  - *Decision Guard:* `[!coupon]` -> Trả về HTTP `404 Not Found` (`code: 'COUPON_NOT_FOUND'`).
- **5a. Mã giảm giá đã hết hạn hoặc hết lượt sử dụng:**
  - *Decision Guard 1:* `[expiryEndOfDay < now]` -> Trả về HTTP `400 Bad Request` (`code: 'COUPON_EXPIRED'`).
  - *Decision Guard 2:* `[coupon.usedCount >= coupon.maxUsage]` -> Trả về HTTP `400 Bad Request` (`code: 'COUPON_USAGE_LIMIT_EXCEEDED'`).
- **5b. Đơn hàng chưa đạt mức tối thiểu hoặc sai bộ phim áp dụng:**
  - *Decision Guard 1:* `[finalTotalAmount < minAmount]` -> Trả về HTTP `400 Bad Request` (`code: 'MIN_AMOUNT_NOT_REACHED'`).
  - *Decision Guard 2:* `[coupon.applicableMovieId !== null && coupon.applicableMovieId !== finalMovieId]` -> Trả về HTTP `400 Bad Request` (`code: 'COUPON_NOT_APPLICABLE_TO_MOVIE'`).
- **5c. Sử dụng trái phép Voucher cá nhân (`COMP50_` / `COMP100_`) của tài khoản khác:**
  - *Decision Guard:* `[coupon.userId !== null && coupon.userId !== currentUserId]`
  - *Xử lý:* Trả về HTTP `403 Forbidden` (`code: 'COUPON_USER_RESTRICTED'`, message: `"Mã giảm giá này chỉ dành riêng cho tài khoản được cấp"`).

---

### 4.8 Phân hệ Quản trị Vận hành (Admin Operations & Incident Handling)

#### 4.8.1 Danh mục Yêu cầu Chức năng
- **FR-ADM-01 (Quản lý danh mục Phim & Nhãn độ tuổi):** Cho phép Quản trị viên (`ADMIN`) thêm mới (`POST /api/movies`), cập nhật (`PUT /api/movies/[id]`) và tải ảnh poster (`POST /api/movies/upload`). Hỗ trợ thiết lập trạng thái phim (`UPCOMING`, `SHOWING`, `ENDED`) và nhãn phân loại độ tuổi chuẩn (`P`: Phổ biến mọi lứa tuổi, `C13` / `T13`: Cấm khán giả dưới 13 tuổi, `T18` / `C18`: Cấm khán giả dưới 18 tuổi - kích hoạt khóa vé Trẻ em).
- **FR-ADM-02 (Xóa mềm phim & Bảo toàn lịch sử giao dịch - Soft Delete):**
  - Khi Admin yêu cầu xóa phim (`DELETE /api/movies/[id]`):
    1. Nếu phim đang có suất chiếu ở trạng thái `UPCOMING` hoặc `SHOWING`, hệ thống **chặn xóa** và trả về lỗi `400 Bad Request`.
    2. Nếu phim không còn suất chiếu sắp tới nhưng **đã từng có vé bán ra trong lịch sử** (`hasTickets`), hệ thống tuyệt đối không xóa vật lý (Hard Delete) mà tự động thực hiện **Xóa mềm / Lưu trữ (Soft Delete)** bằng cách chuyển trạng thái sang `status = 'ENDED'` (hoặc bật cờ `isDeleted = true`) để bảo toàn tính toàn vẹn khóa ngoại cho báo cáo doanh thu.
    3. Chỉ thực hiện xóa vật lý khỏi bảng `movies` khi bộ phim chưa từng phát sinh bất kỳ giao dịch vé nào.
- **FR-ADM-03 (Lên lịch suất chiếu, Chống trùng phòng & Tự sinh 50 ghế chuẩn):**
  - Khi Admin tạo suất chiếu mới (`POST /api/screenings` với `room_number` từ `1..5`), hệ thống tự động tính `endTime = startTime + (movie.duration + 15 phút dọn vệ sinh)`.
  - **Thuật toán chống trùng lịch chiếu trong cùng phòng (`BR-07`):** Hệ thống kiểm tra không tồn tại suất chiếu nào trong cùng `roomNumber` thỏa mãn bất đẳng thức giao nhau:
    $$(\text{existing.startTime} < \text{newEndTime}) \land (\text{existing.endTime} > \text{newStartTime})$$
  - **Khởi tạo sơ đồ ghế tự động:** Ngay trong cùng `prisma.$transaction` tạo suất chiếu, hệ thống tự động chạy vòng lặp sinh đủ **50 bản ghi ghế chuẩn** (5 hàng `A, B, C, D, E` $\times$ 10 cột `1..10`, mã từ `A1` đến `E10`, `type = 'STANDARD'`, `status = 'EMPTY'`).
- **FR-ADM-04 (Hủy suất chiếu khẩn cấp do sự cố rạp - Emergency Screening Cancellation):**
  - Khi phòng chiếu gặp sự cố nghiêm trọng, Admin kích hoạt hủy/đóng suất chiếu qua `DELETE /api/screenings/[id]` (hoặc `POST /api/admin/screenings/[id]/cancel`):
    - Nếu suất chiếu chưa bán vé nào: Xóa suất chiếu kèm 50 ghế trống.
    - Nếu suất chiếu đã có vé bán ra: Trong một `prisma.$transaction`, hệ thống tự động:
      1. Chuyển toàn bộ các vé đang ở trạng thái `Valid` (chưa check-in) sang `Cancelled` để đưa vào diện hoàn tiền 100% (Bảo toàn nguyên vẹn các vé đã `Used`).
      2. Giải phóng toàn bộ ghế của suất chiếu về `EMPTY` (`reservedUntil = null`).
      3. Chuyển trạng thái suất chiếu sang `ENDED` / `CANCELLED` để ngừng bán vé mới và bảo toàn liên kết khóa ngoại.
      4. Tổng hợp danh sách khách hàng bị ảnh hưởng (`affected_users`) kèm tổng số tiền cần hoàn (`total_refund_amount`) để bộ phận CSKH/Quầy vé thực hiện chi trả.

#### 4.8.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actor:** Quản trị viên hệ thống (`ADMIN`).<br>- **Secondary Actors:** Cơ sở dữ liệu `PostgreSQL (Bảng movies, screenings, seats, tickets, payments)`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Người dùng đã đăng nhập với vai trò `ADMIN` (`requireAuth(['ADMIN'])`). |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Tạo suất chiếu:** 01 bản ghi `Screening (UPCOMING)` và 50 bản ghi `Seat (A1..E10, EMPTY)` được lưu vào DB.<br>- **Xóa phim đã có vé:** Bản ghi `Movie` được giữ lại và chuyển `status = 'ENDED'` (`archived: true`).<br>- **Hủy suất chiếu khẩn cấp:** `Screening` -> `ENDED`/`CANCELLED`; Toàn bộ vé `Valid` -> `Cancelled`; Xuất danh sách khách hàng cần hoàn tiền 100%. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `GET /api/movies`, `POST /api/movies`, `PUT /api/movies/[id]`, `DELETE /api/movies/[id]` (Quản lý vòng đời phim & Xóa mềm).<br>  + `GET /api/screenings`, `POST /api/screenings`, `PUT /api/screenings/[id]`, `DELETE /api/screenings/[id]` *(alias: `/api/admin/screenings`)* (Quản lý suất chiếu, chống trùng lịch & xử lý sự cố).<br>  + `GET /api/pricing` & `PUT /api/pricing/[type]` (Cấu hình bảng giá vé).<br>- **Bảng CSDL:** `movies`, `screenings`, `seats`, `tickets`, `payments`, `pricing`. |

##### A. Luồng sự kiện chính (Main / Basic Flow)

**Luồng 4.8A - Lên lịch suất chiếu mới & Tự động sinh 50 ghế (`POST /api/screenings`):**
1. `[Admin]` -> `[Giao diện Quản trị (/admin)]`: Chọn phim (`movie_id`), chọn phòng chiếu (`room_number` từ `1..5`), chọn ngày chiếu (`screening_date`), giờ bắt đầu (`screening_time`), nhập giá vé cơ bản (`base_price`) và nhấn **"Tạo suất chiếu"**.
2. `[Giao diện Quản trị]` -> `[Next.js API Server (POST /api/screenings)]`: Gửi HTTP POST kèm JSON Payload.
3. `[Next.js API Server]` -> `[Auth Helper]`: Gọi `requireAuth(['ADMIN'])` xác thực quyền Quản trị viên.
4. `[Next.js API Server]` -> `[PostgreSQL DB (movies)]`: Truy vấn `prisma.movie.findUnique({ where: { id: parsedMovieId } })` lấy thời lượng `movie.duration`.
5. `[Next.js API Server]` -> `[Next.js API Server]`: Tính `startTime = new Date(dateStr + 'T' + timeStr)` và `endTime = startTime + (movie.duration + 15) * 60000` (cộng 15 phút nghỉ dọn phòng).
6. `[Next.js API Server]` -> `[PostgreSQL DB (screenings)]`: Truy vấn kiểm tra giao nhau thời gian trong cùng phòng chiếu:
   `prisma.screening.findFirst({ where: { roomNumber: parsedRoomNumber, AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }] } })`.
7. `[PostgreSQL DB]` -> `[Next.js API Server]`: Trả về `null` (Không có suất chiếu trùng giờ).
8. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`:
   - **Bước 8.1:** Tạo bản ghi `tx.screening.create({ data: { movieId, room: 'Cinema 0X', roomNumber, date, startTime, endTime, price, status: 'UPCOMING' } })`.
   - **Bước 8.2:** Chạy 2 vòng lặp lồng nhau (`row` trong `['A','B','C','D','E']` và `num` từ `1..10`) tạo mảng 50 đối tượng ghế (`A1` đến `E10`, `type: 'STANDARD'`, `status: 'EMPTY'`).
   - **Bước 8.3:** Thực thi `tx.seat.createMany({ data: seatsToCreate })`.
9. `[Next.js API Server]` -> `[Giao diện Quản trị]`: Trả về HTTP `201 Created` kèm thông tin suất chiếu và `_count.seats = 50`.

**Luồng 4.8B - Hủy suất chiếu khẩn cấp do sự cố rạp (`DELETE /api/screenings/[id]`):**
1. `[Admin]` -> `[Giao diện Quản trị (/admin)]`: Chọn suất chiếu gặp sự cố kỹ thuật và nhấn **"Hủy / Đóng suất chiếu khẩn cấp"**.
2. `[Giao diện Quản trị]` -> `[Next.js API Server (DELETE /api/screenings/[id])]`: Gửi yêu cầu HTTP DELETE.
3. `[Next.js API Server]` -> `[PostgreSQL DB (screenings)]`: Truy vấn suất chiếu kèm danh sách `tickets` (`include: { user, payment }`).
4. `[Next.js API Server]` -> `[PostgreSQL DB (Prisma $transaction)]`:
   - **[Nhánh 4.1 - Đã có vé bán ra (`hasTicketsEverSold === true`)]:**
     1. Cập nhật toàn bộ vé chưa dùng: `tx.ticket.updateMany({ where: { screeningId, status: 'Valid' }, data: { status: 'Cancelled' } })`.
     2. Giải phóng ghế: `tx.seat.updateMany({ where: { screeningId }, data: { status: 'EMPTY', reservedUntil: null } })`.
     3. Đóng suất chiếu (Soft Delete): `tx.screening.update({ where: { id: screeningId }, data: { status: 'ENDED' } })`.
     4. Tổng hợp `total_refund_amount` và danh sách `affected_users` (những khách có vé `Valid` bị hủy để hoàn tiền 100%).
   - **[Nhánh 4.2 - Chưa có vé nào bán ra (`hasTicketsEverSold === false`)]:**
     1. Thực thi `tx.screening.delete({ where: { id: screeningId } })` (Cascade xóa kèm 50 ghế trống).
5. `[Next.js API Server]` -> `[Giao diện Quản trị]`: Trả về HTTP `200 OK` kèm báo cáo tổng số vé đã hủy và danh sách khách hàng cần hoàn tiền mặt 100%.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **6a (Luồng 4.8A). Trùng lịch chiếu trong cùng phòng (`Conflicting Screening`):**
  - *Decision Guard:* `[conflictingScreening !== null]`
  - *Xử lý:* Từ chối tạo suất chiếu, trả về HTTP `400 Bad Request` kèm thông báo rõ ràng: `"Phòng chiếu X đã có suất chiếu phim [Tên phim] từ [HH:mm] đến [HH:mm]. Vui lòng chọn khung giờ hoặc phòng khác."`.
- **6b (Cập nhật suất chiếu `PUT /api/screenings/[id]`). Sửa suất chiếu đã bắt đầu:**
  - *Decision Guard:* `[new Date(existingScreening.startTime) <= new Date()]`
  - *Xử lý:* Trả về HTTP `400 Bad Request` (`"Không thể cập nhật suất chiếu vì suất chiếu này đã bắt đầu hoặc đã kết thúc"`).
- **2a (Xóa phim `DELETE /api/movies/[id]`). Xóa phim đang có suất chiếu sắp chiếu/đang chiếu:**
  - *Decision Guard:* `[activeScreening !== null]` (`status IN ['UPCOMING', 'SHOWING']`)
  - *Xử lý:* Chặn xóa, trả về HTTP `400 Bad Request` (`"Không thể xóa phim vì đang có suất chiếu ở trạng thái UPCOMING hoặc SHOWING"`).
- **3a (Xóa phim `DELETE /api/movies/[id]`). Phim đã có lịch sử bán vé -> Chuyển sang Xóa mềm:**
  - *Decision Guard:* `[hasTickets !== null]`
  - *Xử lý:* Không gọi `prisma.movie.delete`, mà gọi `prisma.movie.update({ data: { status: 'ENDED' } })` và trả về HTTP `200 OK` (`archived: true`).

---

### 4.9 Phân hệ Báo cáo & Thống kê Doanh thu (Reports & Financial Auditing)

#### 4.9.1 Danh mục Yêu cầu Chức năng
- **FR-REP-01 (Bộ lọc báo cáo đa chiều):** Cho phép Quản trị viên (`ADMIN`) truy cập bảng điều khiển tổng quan (`GET /api/admin/dashboard`) và báo cáo đối soát chi tiết (`GET /api/admin/reports/revenue`) với các bộ lọc linh hoạt: khoảng thời gian từ ngày `from_date` đến ngày `to_date` (`YYYY-MM-DD`), lọc theo bộ phim (`movie_id`), theo phòng chiếu (`room_number` từ `1..5`) và phân tách theo nguồn thu.
- **FR-REP-02 (Hệ thống chỉ số tài chính & Công thức đối soát chuẩn):**
  1. **Tổng số vé bán ra hợp lệ (`Tickets Sold`):** Tổng số bản ghi `Ticket` có `status IN ('Valid', 'Used')`.
  2. **Tổng số vé đã hủy (`Cancelled Tickets`):** Tổng số bản ghi `Ticket` có `status === 'Cancelled'`.
  3. **Doanh thu bán vé thực thu (`Net Ticket Revenue`):**
     $$\text{Net Ticket Revenue} = \sum_{t \in \{\text{Valid}, \text{Used}\}} t.\text{price}$$
  4. **Tổng giá trị vé đã hủy / hoàn trả (`Refunded / Cancelled Ticket Amount`):**
     $$\text{Refunded Amount} = \sum_{t \in \{\text{Cancelled}\}} t.\text{price}$$
     *(Trong đó tách bạch giữa **Công nợ chờ hoàn tiền mặt - `Pending Refund Amount`** của các vé hủy do sự cố chưa chi quỹ và **Số tiền thực tế đã xuất quỹ - `Actual Refunded Amount`** khi nhân viên đã xác nhận hoàn tiền tại quầy).*
  5. **Doanh thu bán vé gộp ban đầu (`Gross Ticket Revenue`):**
     $$\text{Gross Ticket Revenue} = \text{Net Ticket Revenue} + \text{Refunded Amount}$$
  6. **Doanh thu Combo bắp nước (`Combo Revenue`):**
     $$\text{Combo Revenue} = \sum_{oc \in \text{OrderCombos (Payment = Success)}} (oc.\text{price} \times oc.\text{quantity})$$
  7. **Tỷ lệ lấp đầy phòng chiếu (`Fill Rate %`):**
     $$\text{Fill Rate (\%)} = \text{round}\left(\frac{\text{Tickets Sold}}{\text{Total Seats Capacity (50 ghế/suất)}} \times 100,\ 1\right)$$
- **FR-REP-03 (Tính nhất quán kế toán - Anti-Double Deduction):** Báo cáo đảm bảo tính chính xác tuyệt đối bằng cách tính `Net Ticket Revenue` trực tiếp trên tập vé còn hiệu lực (`status IN ('Valid', 'Used')`), hoàn toàn tách biệt với tập vé đã hủy (`status === 'Cancelled'`). Nhờ đó, hệ thống tuyệt đối không bao giờ trừ trùng doanh thu hai lần cho cùng một vé bị hủy.

#### 4.9.2 Đặc tả Chi tiết Luồng Nghiệp vụ & Kỹ thuật (Diagram-Ready Specification)

| Hạng mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **1. Tác nhân (Actors)** | - **Primary Actor:** Quản trị viên (`ADMIN`).<br>- **Secondary Actors:** Cơ sở dữ liệu `PostgreSQL (Bảng screenings, movies, tickets, seats, payments, order_combos)`. |
| **2. Điều kiện tiên quyết (Pre-conditions)** | - Người dùng đã đăng nhập với vai trò `ADMIN` (`session.user.role === 'ADMIN'`). |
| **3. Kết quả sau thực hiện (Post-conditions)** | - **Thành công:** Trả về dữ liệu thống kê tổng quan (`today`, `top_movies`, `all_time`) và danh sách báo cáo doanh thu chi tiết từng suất chiếu (`ScreeningRevenueReportItem[]`) để hiển thị bảng biểu và đồ thị.<br>- **Thất bại:** Trả về HTTP `401 Unauthorized` hoặc `403 Forbidden` nếu không phải `ADMIN`. |
| **4. API Endpoints & Bảng CSDL tham gia** | - **API Endpoints:**<br>  + `GET /api/admin/dashboard` (Thống kê KPI doanh thu hôm nay, tỷ lệ lấp đầy trung bình, Top 5 phim doanh thu cao nhất và tổng kết toàn thời gian).<br>  + `GET /api/admin/reports/revenue` (Báo cáo đối soát doanh thu, vé bán, vé hủy và tỷ lệ lấp đầy theo từng suất chiếu có bộ lọc).<br>- **Bảng CSDL:** `payments`, `tickets`, `order_combos`, `screenings`, `movies`, `seats`. |

##### A. Luồng sự kiện chính (Main / Basic Flow - `GET /api/admin/reports/revenue` & `GET /api/admin/dashboard`)
1. `[Admin]` -> `[Giao diện Báo cáo (/admin)]`: Chọn khoảng ngày (`from_date`, `to_date`), chọn phim (`movie_id`), chọn phòng chiếu (`room_number`) và nhấn **"Lọc báo cáo"**.
2. `[Giao diện Báo cáo]` -> `[Next.js API Server (GET /api/admin/reports/revenue)]`: Gửi HTTP GET kèm Query Parameters `?from_date=...&to_date=...&movie_id=...&room_number=...`.
3. `[Next.js API Server]` -> `[NextAuth Session]`: Gọi `getServerSession(authOptions)` kiểm tra `session.user.role === 'ADMIN'`.
4. `[Next.js API Server]` -> `[Next.js API Server]`: Phân tích tham số truy vấn, chuẩn hóa `fromDate` về `00:00:00.000` và `toDate` về `23:59:59.999`, xây dựng đối tượng lọc `Prisma.ScreeningWhereInput`.
5. `[Next.js API Server]` -> `[PostgreSQL DB (screenings, movies, seats, tickets)]`: Thực thi `prisma.screening.findMany({ where, include: { movie: true, seats: true, tickets: true }, orderBy: { startTime: 'desc' } })`.
6. `[PostgreSQL DB]` -> `[Next.js API Server]`: Trả về danh sách các suất chiếu kèm tập bản ghi ghế và vé.
7. `[Next.js API Server]` -> `[Next.js API Server]`: Duyệt qua từng suất chiếu `sc` để tổng hợp chỉ số kế toán:
   - Phân tách tập vé hiệu lực `validTickets = sc.tickets.filter(t => t.status === 'Valid' || t.status === 'Used')`.
   - Phân tách tập vé đã hủy `cancelledTickets = sc.tickets.filter(t => t.status === 'Cancelled')`.
   - Tính `netRevenue = sum(validTickets.price)`, `refundedAmount = sum(cancelledTickets.price)`, `grossRevenue = netRevenue + refundedAmount`.
   - Tính `ticketsSold = validTickets.length`, `emptySeats = totalSeats - ticketsSold`, và `fillRate = Number(((ticketsSold / totalSeats) * 100).toFixed(1))`.
8. `[Next.js API Server]` -> `[Giao diện Báo cáo]`: Trả về HTTP `200 OK` kèm mảng `ScreeningRevenueReportItem[]`.
9. `[Giao diện Báo cáo]` -> `[Admin]`: Hiển thị bảng đối soát chi tiết, tổng kết doanh thu thực thu, tiền hoàn trả và biểu đồ tỷ lệ lấp đầy phòng chiếu.

##### B. Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)
- **3a. Người dùng chưa đăng nhập:**
  - *Decision Guard:* `[!session || !session.user]`
  - *Xử lý:* Trả về HTTP `401 Unauthorized` (`code: 'UNAUTHENTICATED'`, message: `"Vui lòng đăng nhập với tài khoản Quản trị viên (ADMIN)"`).
- **3b. Tài khoản đăng nhập là CUSTOMER hoặc STAFF cố truy cập báo cáo doanh thu:**
  - *Decision Guard:* `[session.user.role !== 'ADMIN']`
  - *Xử lý:* Chặn truy cập, trả về HTTP `403 Forbidden` (`code: 'FORBIDDEN'`, message: `"Chỉ có quản trị viên (ADMIN) mới có quyền truy cập báo cáo doanh thu chi tiết (UC-19)"`).
- **6a. Không có suất chiếu nào khớp với bộ lọc thời gian/phòng chiếu:**
  - *Decision Guard:* `[screenings.length === 0]`
  - *Xử lý:* Trả về HTTP `200 OK` với mảng rỗng `data: []` và thông báo `"Không có suất chiếu nào phù hợp với bộ lọc đã chọn"`.

---

## 5. CÁC YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 5.1 Yêu cầu hiệu năng (Performance Requirements)
- **NFR-PERF-01 (Thời gian phản hồi giao diện trang):** Thời gian tải trang ban đầu (*First Contentful Paint - FCP*) đối với trang chủ danh sách phim, lịch chiếu và sơ đồ phòng chiếu 50 ghế (`A1` đến `E10`) không vượt quá **3.0 giây** trong điều kiện kết nối mạng tiêu chuẩn, nhờ cơ chế kết xuất phía máy chủ (*Server-Side Rendering / React Server Components*) của Next.js kết hợp truy vấn có đánh chỉ mục (`@@index`) trên PostgreSQL 16.
- **NFR-PERF-02 (Tốc độ xử lý giao dịch giữ chỗ & kiểm tra vé):**
  - Thao tác khóa giữ ghế tạm thời (`POST /api/seats/reserve`), khởi tạo đơn đặt vé (`POST /api/bookings`) và quét mã QR soát vé tại quầy (`POST /api/staff/checkin`) phải hoàn tất xử lý nội bộ tại máy chủ và cơ sở dữ liệu trong thời gian **dưới 500ms** (ở phân vị thứ 95 - p95) nhằm đảm bảo trải nghiệm mượt mà, không gây ùn tắc tại cổng soát vé giờ cao điểm.

### 5.2 Yêu cầu an toàn và xử lý đồng thời (Safety & Concurrency Requirements)
- **NFR-SAFE-01 (Chống bán trùng ghế 2 lớp - Two-Layer Double Booking Prevention):** Hệ thống bắt buộc triển khai cơ chế kiểm soát đồng thời 2 lớp độc lập để đảm bảo tuyệt đối không bao giờ xảy ra tình trạng hai khách hàng cùng giữ chỗ thành công hoặc cùng phát sinh hai vé hợp lệ cho một vị trí ghế trong cùng một suất chiếu tại cùng một thời điểm (*Race Condition*):
  1. **Lớp 1 - Giao dịch nguyên tử có điều kiện tại Tầng Ứng dụng (Application-Level Atomic Conditional Update):**
     - Toàn bộ quy trình giải phóng ghế quá hạn 10 phút, kiểm tra trạng thái ghế và khóa ghế sang `RESERVED` (hoặc `OCCUPIED` khi bán tại quầy POS) được bọc trong một giao dịch cơ sở dữ liệu nguyên tử `prisma.$transaction`.
     - Hệ thống sử dụng câu lệnh cập nhật có điều kiện nguyên tử:
       ```typescript
       const updatedSeats = await tx.seat.updateMany({
         where: {
           id: { in: seatIds },
           screeningId: screeningId,
           status: 'EMPTY'
         },
         data: {
           status: 'RESERVED',
           reservedUntil: new Date(Date.now() + 10 * 60 * 1000)
         }
       });
       if (updatedSeats.count !== seatIds.length) {
         throw new Error('CONFLICT_SEAT_ALREADY_TAKEN');
       }
       ```
     - Nếu bất kỳ ghế nào trong danh sách chọn vừa bị người dùng khác khóa trước đó dù chỉ vài mili-giây (`updatedSeats.count !== seatIds.length`), toàn bộ giao dịch lập tức bị **Rollback** và trả về mã lỗi `HTTP 409 Conflict`.
  2. **Lớp 2 - Ràng buộc Duy nhất từng phần tại Tầng Cơ sở dữ liệu Vật lý (Database-Level PostgreSQL Partial Unique Index):**
     - Tại tầng vật lý của PostgreSQL 16 (container `lumicinema_db`), bảng `tickets` được áp đặt ràng buộc **Partial Unique Index** trực tiếp trên cặp khóa `(screening_id, seat_id)` đối với mọi vé chưa bị hủy:
       ```sql
       CREATE UNIQUE INDEX unique_active_ticket
       ON tickets (screening_id, seat_id)
       WHERE status != 'Cancelled';
       ```
     - Ràng buộc vật lý này đóng vai trò chốt chặn cuối cùng: Ngay cả khi có hai luồng thanh toán đồng thời vượt qua tầng ứng dụng, PostgreSQL Engine sẽ tự động từ chối lệnh `INSERT` hoặc `UPDATE` thứ hai với lỗi vi phạm ràng buộc duy nhất (`Unique Constraint Violation - P2002`), đồng thời vẫn cho phép một vị trí ghế có lịch sử vé cũ ở trạng thái `Cancelled` được bán lại hợp lệ cho khách hàng mới.
- **NFR-SAFE-02 (Kiểm soát đồng thời tồn kho Combo bắp nước):**
  - Số lượng tồn kho khả dụng (`availableStock`) của mỗi gói Combo được tính toán động trong giao dịch `prisma.$transaction` bằng công thức: `Combo.stock - SUM(ComboReservation.quantity đang ở trạng thái 'RESERVED' và chưa hết hạn 10 phút)`.
  - Nếu tổng số lượng khách yêu cầu vượt quá tồn kho khả dụng tại thời điểm khóa đơn, giao dịch lập tức bị hủy bỏ (`Rollback`) để ngăn chặn tình trạng bán âm kho (*Overselling*).

### 5.3 Yêu cầu bảo mật (Security Requirements)
- **NFR-SEC-01 (Băm mật khẩu một chiều bằng Bcrypt):**
  - Mật khẩu của mọi tài khoản người dùng (`CUSTOMER`, `STAFF`, `ADMIN`) bắt buộc phải được băm một chiều bằng thuật toán **bcrypt** (`bcryptjs`) với hệ số chi phí (**salt rounds = 10 đến 12**) trước khi lưu vào cột `password` trong bảng `users`. Tuyệt đối không lưu trữ hoặc ghi log mật khẩu dưới dạng văn bản rõ (*Plain Text*).
- **NFR-SEC-02 (Chống giả mạo Vé điện tử bằng Chữ ký số HMAC-SHA256):**
  - Mã QR Code hiển thị trên vé điện tử (`<QRCodeSVG />`) không chỉ chứa thông tin định danh vé mà bắt buộc đính kèm chữ ký số mật mã học **HMAC-SHA256** được tính toán trên dữ liệu gốc của vé (`ticketId|screeningId|seatCode|userId`) bằng khóa bí mật phía máy chủ (`NEXTAUTH_SECRET` / `QR_SECRET_KEY`).
  - Khi nhân viên quầy quét mã QR tại phân hệ Check-in (`POST /api/staff/checkin`), máy chủ tự động tái tạo chữ ký HMAC-SHA256 và đối chiếu an toàn thời gian (`crypto.timingSafeEqual`). Nếu nội dung mã QR bị can thiệp, làm giả hoặc chỉnh sửa dù chỉ 1 ký tự, hệ thống lập tức từ chối quyền vào cửa và phát cảnh báo vé không hợp lệ.
- **NFR-SEC-03 (Bảo mật Phiên làm việc NextAuth JWT & Chống giả mạo định danh IDOR):**
  - Phiên đăng nhập được quản lý qua **NextAuth.js** sử dụng cơ chế **JSON Web Token (JWT)** ký số và lưu trữ trong `HTTP-Only Cookie` (thời hạn tối đa 24 giờ), chứa thông tin định danh `id` và vai trò `role` (`CUSTOMER`, `STAFF`, `ADMIN`).
  - **Chống leo thang đặc quyền & Giả mạo `user_id`:** Mọi API Endpoint thực hiện giao dịch của khách hàng (giữ ghế, tạo đơn đặt vé, gửi đánh giá phim, tự hủy vé) bắt buộc trích xuất định danh người dùng trực tiếp từ phiên làm việc đã xác thực phía máy chủ (`session.user.id` thông qua `getServerSession`), **tuyệt đối không tin tưởng hoặc lấy `userId` truyền từ `request.body` hay `query params`** của phía Client nhằm triệt tiêu lỗ hổng *Insecure Direct Object Reference (IDOR)*.
  - Các API thuộc không gian `/api/staff/*` và `/api/admin/*` luôn kiểm tra nghiêm ngặt `session.user.role` trước khi thực thi bất kỳ logic nghiệp vụ nào.

### 5.4 Yêu cầu tính toàn vẹn dữ liệu và kiểm toán (Data Integrity & Audit Logging)
- **NFR-INT-01 (Tính lũy đẳng trong Xử lý Thanh toán ZaloPay - Payment Idempotency):**
  - Do đặc thù mạng phân tán, một giao dịch ZaloPay có thể kích hoạt đồng thời cả luồng **Webhook IPN Callback** (`POST /api/payments/zalopay/callback`) và luồng **Return URL Redirect** (`GET /api/payments/zalopay/return`), hoặc ZaloPay có thể gọi lại IPN nhiều lần nếu chưa nhận được phản hồi kịp thời.
  - Hệ thống bắt buộc kiểm tra trạng thái hiện tại của bản ghi `Payment` bên trong giao dịch cơ sở dữ liệu: Nếu `Payment.status` đã ở trạng thái `'Success'` (hoặc vé tương ứng của `paymentId` đã được khởi tạo trong bảng `tickets`), hệ thống lập tức bỏ qua bước tạo vé/trừ kho lặp lại và trả về kết quả thành công ngay lập tức. Cơ chế này đảm bảo mỗi hóa đơn thanh toán chỉ sinh vé, trừ tồn kho combo và tăng lượt dùng coupon đúng **duy nhất 1 lần**.
- **NFR-INT-02 (Nhật ký Kiểm toán Bất biến - Financial & Operational Audit Logging):**
  - Mọi thao tác nhạy cảm tác động đến tài chính, quyền lợi khách hàng hoặc lịch vận hành rạp bao gồm: **Khách tự hủy vé nhận voucher 50%**, **Nhân viên hủy vé do sự cố rạp**, **Nhân viên xác nhận chi trả tiền mặt hoàn vé tại quầy (`Confirm Cash Refund`)**, **Admin kích hoạt hủy toàn bộ suất chiếu khẩn cấp**, và **Admin xóa mềm phim** đều phải được ghi vết đầy đủ.
  - Dữ liệu kiểm toán (lưu trữ tại bảng `audit_logs` và/hoặc chuẩn hóa có cấu trúc trong trường `Ticket.cancellationReason` kèm lịch sử giao dịch) bắt buộc ghi nhận rõ: Định danh người thực hiện (`actorId`, `role`), loại hành động (`action`), đối tượng bị tác động (`targetId`), số tiền hoàn trả hoặc mã voucher phát sinh, lý do chi tiết và dấu thời gian chuẩn ISO 8601 (`timestamp`) phục vụ công tác hậu kiểm kế toán.

### 5.5 Yêu cầu sao lưu và phục hồi (Backup & Recovery)
- **NFR-BCK-01 (Lưu trữ bền vững qua Docker Named Volume & Sao lưu định kỳ `pg_dump`):**
  - Toàn bộ dữ liệu vật lý của hệ quản trị cơ sở dữ liệu PostgreSQL 16 (container `lumicinema_db` tại cổng `5434`) được ánh xạ và lưu trữ bền vững trên **Docker Named Volume** độc lập mang tên `lumicinema_pgdata` (`/var/lib/postgresql/data`). Việc khởi động lại, cập nhật hoặc tái tạo container ứng dụng và container CSDL hoàn toàn không làm mất dữ liệu hiện có.
  - Hệ thống hỗ trợ quy trình sao lưu nóng (*Logical Hot Backup*) định kỳ hàng ngày hoặc trước mỗi đợt nâng cấp bằng tiện ích chuẩn **`pg_dump`** thực thi trực tiếp qua Docker CLI:
    ```bash
    docker exec -t lumicinema_db pg_dump -U postgres -d lumicinema -F c -f /var/lib/postgresql/data/backup_lumicinema.dump
    ```
  - Bản sao lưu cho phép phục hồi toàn vẹn 100% cấu trúc bảng, các chỉ mục (bao gồm cả `unique_active_ticket`) và dữ liệu giao dịch chỉ trong vài phút thông qua công cụ `pg_restore` hoặc `psql` khi xảy ra sự cố phần cứng máy chủ.

---

## 6. MÔ HÌNH VÀ SƠ ĐỒ ĐẶC TẢ HỆ THỐNG (SYSTEM MODELS & DIAGRAMS)

### 6.1 Sơ đồ Use Case tổng quát (Overall Use Case Diagram)

Sơ đồ dưới đây mô tả tổng quan ranh giới hệ thống (System Boundary), các tác nhân tương tác (`Customer`, `Staff`, `Admin`, `ZaloPay Gateway`) và toàn bộ 18 Use Case cốt lõi cùng các mối quan hệ phụ thuộc `<<include>>` và mở rộng `<<extend>>` trong Hệ thống Quản lý Rạp chiếu phim Lumi Cinema:

```mermaid
graph TD
    actorCustomer["Khách hàng (Customer)"]
    actorStaff["Nhân viên quầy (Staff)"]
    actorAdmin["Quản trị viên (Admin)"]
    actorZaloPay["Cổng ZaloPay Sandbox v2 (External System)"]

    subgraph "Hệ Thống Quản Lý Rạp Phim Lumi Cinema"
        UC_Auth["UC-01: Đăng ký / Đăng nhập / Đăng xuất"]
        UC_Browse["UC-02: Tra cứu phim & Xem lịch chiếu"]
        UC_Review["UC-03: Đánh giá & Bình luận phim (1-5 sao)"]
        UC_BookOnline["UC-04: Đặt vé & Mua combo Online"]
        UC_HoldSeat["UC-05: Chọn ghế & Khóa ghế tạm thời 10 phút"]
        UC_ApplyVoucher["UC-06: Áp dụng mã giảm giá / Voucher"]
        UC_PayZalo["UC-07: Thanh toán trực tuyến ZaloPay QR/Gateway"]
        UC_CancelSelf["UC-08: Tự hủy vé online (trước >= 2h, nhận Voucher 50%)"]

        UC_POS_Ticket["UC-09: Bán vé & Combo tại quầy (POS)"]
        UC_POS_Combo["UC-10: Bán lẻ bắp nước độc lập tại quầy"]
        UC_CheckIn["UC-11: Soát vé vào rạp (Quét QR HMAC-SHA256)"]
        UC_FulfillCombo["UC-12: Xác nhận giao nhận combo tại quầy"]
        UC_StaffCancel["UC-13: Hủy vé sự cố rạp & Hoàn tiền mặt 100%"]

        UC_MovieMgmt["UC-14: Quản lý danh mục Phim & Nhãn độ tuổi"]
        UC_ScreeningMgmt["UC-15: Lên lịch suất chiếu (Kiểm tra chống trùng phòng)"]
        UC_Pricing["UC-16: Thiết lập bảng giá vé (Thường 100% / Trẻ em 50%)"]
        UC_ComboMgmt["UC-17: Quản lý danh mục & Tồn kho Combo"]
        UC_VoucherMgmt["UC-18: Quản lý chiến dịch Voucher khuyến mãi"]
        UC_CancelScreening["UC-19: Hủy suất chiếu khẩn cấp do sự cố kỹ thuật"]
        UC_Report["UC-20: Xem báo cáo doanh thu & Đối soát công nợ hoàn tiền"]
    end

    %% Actor Associations
    actorCustomer --> UC_Auth
    actorCustomer --> UC_Browse
    actorCustomer --> UC_Review
    actorCustomer --> UC_BookOnline
    actorCustomer --> UC_CancelSelf

    actorStaff --> UC_Auth
    actorStaff --> UC_POS_Ticket
    actorStaff --> UC_POS_Combo
    actorStaff --> UC_CheckIn
    actorStaff --> UC_FulfillCombo
    actorStaff --> UC_StaffCancel

    actorAdmin --> UC_Auth
    actorAdmin --> UC_MovieMgmt
    actorAdmin --> UC_ScreeningMgmt
    actorAdmin --> UC_Pricing
    actorAdmin --> UC_ComboMgmt
    actorAdmin --> UC_VoucherMgmt
    actorAdmin --> UC_CancelScreening
    actorAdmin --> UC_Report
    actorAdmin --> UC_StaffCancel

    %% Include & Extend Relationships
    UC_BookOnline -. "<<include>>" .-> UC_Auth
    UC_BookOnline -. "<<include>>" .-> UC_HoldSeat
    UC_BookOnline -. "<<include>>" .-> UC_PayZalo
    UC_ApplyVoucher -. "<<extend>>" .-> UC_BookOnline

    UC_POS_Ticket -. "<<include>>" .-> UC_HoldSeat
    UC_ApplyVoucher -. "<<extend>>" .-> UC_POS_Ticket

    UC_Review -. "<<include>>" .-> UC_Auth
    UC_CancelSelf -. "<<include>>" .-> UC_Auth
    UC_CancelScreening -. "<<include>>" .-> UC_StaffCancel

    UC_PayZalo --> actorZaloPay
```

#### Bảng đặc tả chi tiết các Use Case và quan hệ `<<include>>` / `<<extend>>`

| Mã UC | Tên Use Case | Tác nhân chính (Primary Actor) | Quan hệ `<<include>>` (Bắt buộc thực thi) | Quan hệ `<<extend>>` (Mở rộng có điều kiện) | Mô tả quy tắc nghiệp vụ cốt lõi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-01** | Đăng ký / Đăng nhập / Đăng xuất | Customer, Staff, Admin | Không có | Không có | Xác thực JWT qua NextAuth, mã hóa mật khẩu `bcrypt`, phân quyền RBAC (`CUSTOMER`, `STAFF`, `ADMIN`). |
| **UC-02** | Tra cứu phim & Xem lịch chiếu | Customer (Guest/Auth) | Không có | `UC-04: Đặt vé Online` | Xem danh sách phim `SHOWING`, `UPCOMING`, lọc suất chiếu theo ngày và nhãn độ tuổi (`P`, `C13`, `T18`). |
| **UC-03** | Đánh giá & Bình luận phim | Customer | `UC-01: Đăng nhập` | Quản lý ẩn/xóa đánh giá vi phạm | Mọi tài khoản đã đăng nhập đều được đánh giá 1-5 sao (mỗi user 1 đánh giá/phim, hỗ trợ cập nhật lại - `BR-06`). |
| **UC-04** | Đặt vé & Mua combo Online | Customer | `UC-01`, `UC-05`, `UC-07` | `UC-06: Áp dụng Voucher`, Chọn thêm Combo bắp nước | Luồng đặt vé trực tuyến trọn gói: Chọn suất -> Khóa ghế 10p -> Chọn loại vé (Thường/Trẻ em) -> Chọn Combo -> Thanh toán ZaloPay. |
| **UC-05** | Chọn ghế & Khóa ghế 10 phút | Customer, Staff | Không có | Không có | Khóa ghế nguyên tử (`RESERVED`, `reservedUntil = NOW() + 10m`) chống tranh chấp đồng thời (`BR-01`, `NFR-SAFE-01`). |
| **UC-06** | Áp dụng mã giảm giá / Voucher | Customer, Staff | Không có | Mở rộng cho `UC-04` và `UC-09` | Kiểm tra hạn dùng, lượt dùng (`usedCount < maxUsage`), giá trị tối thiểu; chỉ giảm trên tiền vé, không giảm tiền combo. |
| **UC-07** | Thanh toán trực tuyến ZaloPay | Customer, ZaloPay Gateway | Không có | Không có | Sinh đơn ZaloPay Sandbox v2 (`app_id: 2553`, ký `HMAC-SHA256` với `key1`), xử lý Webhook IPN (`key2`) và hiển thị `<QRCodeSVG />`. |
| **UC-08** | Tự hủy vé online trước giờ chiếu | Customer | `UC-01: Đăng nhập` | Không có | Chỉ cho phép hủy khi `startTime - NOW() >= 2 giờ` và vé `Valid`; giải phóng ghế, tự động sinh Voucher bồi hoàn `50%` (`COMP50_`, hạn 30 ngày - `BR-03`). |
| **UC-09** | Bán vé & Combo tại quầy (POS) | Staff | `UC-05: Chọn ghế` | `UC-06: Áp dụng Voucher` | Bán vé trực tiếp cho khách vãng lai tại quầy, thu Tiền mặt (`Cash`) hoặc Chuyển khoản (`POS_QR`), xuất vé `Valid` ngay lập tức. |
| **UC-10** | Bán lẻ bắp nước độc lập tại quầy | Staff | Không có | Không có | Bán bắp nước cho khách không mua vé xem phim, trừ trực tiếp tồn kho `combos.stock` và ghi nhận doanh thu POS. |
| **UC-11** | Soát vé vào rạp (Check-in QR) | Staff | Không có | Không có | Quét mã QR vé điện tử, xác thực chữ ký số `HMAC-SHA256` (`BR-09`), kiểm tra khung giờ hợp lệ và chuyển trạng thái vé sang `Used`. |
| **UC-12** | Giao nhận combo tại quầy | Staff | Không có | Không có | Tra cứu đơn hàng combo, đối chiếu trạng thái `isDelivered = false` (`Chưa nhận`), bàn giao bắp nước và đóng dấu `Đã nhận` (`BR-05`). |
| **UC-13** | Hủy vé sự cố & Hoàn tiền mặt | Staff, Admin | Không có | Mở rộng từ `UC-19: Hủy suất chiếu khẩn cấp` | Hủy vé do lỗi kỹ thuật của rạp (không giới hạn 2h), ghi nhận `PENDING_CASH_REFUND` (100% tiền mặt) và xác nhận chi quỹ `REFUNDED_CASH` trong 30 ngày (`BR-04`). |
| **UC-14** | Quản lý danh mục Phim | Admin | `UC-01: Đăng nhập` | Xóa mềm (`Soft Delete`) khi phim đã có suất chiếu | Thêm/sửa phim, gán nhãn độ tuổi (`P`, `C13`, `T18`); phim đã phát sinh giao dịch chỉ chuyển `ENDED` / `isDeleted = true` (`BR-07`). |
| **UC-15** | Lên lịch suất chiếu | Admin | `UC-01: Đăng nhập` | Không có | Kiểm tra chống trùng lịch chiếu trong cùng phòng (`startTime` đến `endTime` + 15p dọn phòng - `BR-08`), tự động khởi tạo 50 ghế `A1..E10`. |
| **UC-16** | Thiết lập bảng giá vé (`Pricing`) | Admin | `UC-01: Đăng nhập` | Không có | Cấu hình tỷ lệ phần trăm giá vé theo đối tượng: Vé Người lớn (`100%`) và Vé Trẻ em (`50%`, tự động khóa khi phim gắn nhãn `T18` - `BR-02`). |
| **UC-17** | Quản lý danh mục & Tồn kho Combo | Admin | `UC-01: Đăng nhập` | Không có | Thêm/sửa gói bắp nước, điều chỉnh số lượng tồn kho (`stock`) và bật/tắt trạng thái kinh doanh (`ACTIVE` / `INACTIVE`). |
| **UC-18** | Quản lý chiến dịch Voucher | Admin | `UC-01: Đăng nhập` | Không có | Phát hành mã giảm giá theo `%` (`Percentage`) hoặc số tiền cố định (`FixedAmount`), cấu hình hạn sử dụng và số lượt dùng tối đa. |
| **UC-19** | Hủy suất chiếu khẩn cấp | Admin | `UC-13: Hủy vé sự cố` | Không có | Đóng suất chiếu gặp sự cố (`CANCELLED`), tự động hủy toàn bộ vé đã bán sang `PENDING_CASH_REFUND`, giải phóng ghế và hoàn kho combo chưa nhận. |
| **UC-20** | Xem báo cáo & Đối soát tài chính | Admin | `UC-01: Đăng nhập` | Xuất báo cáo chi tiết | Bóc tách minh bạch 4 chỉ số kế toán: Doanh thu vé thực thu, Doanh thu combo, Công nợ chờ hoàn (`PENDING_CASH_REFUND`) và Tiền mặt đã hoàn (`REFUNDED_CASH` - `BR-10`). |

---

### 6.2 Sơ đồ tuần tự: Giữ ghế & Thanh toán trực tuyến qua ZaloPay Sandbox v2 (Sequence Diagram: Hold Seat & ZaloPay Payment)

Sơ đồ tuần tự dưới đây đặc tả chi tiết luồng tương tác thời gian thực giữa Khách hàng, Giao diện Web (Next.js Client), API Server, Cơ sở dữ liệu **Docker PostgreSQL (Port 5434)** và **Cổng thanh toán ZaloPay Sandbox v2 (`app_id: 2553`)**, bao gồm cả cơ chế khóa ghế nguyên tử 10 phút, kiểm tra ràng buộc `Partial Unique Index`, xác thực chữ ký `HMAC-SHA256` (`key1` / `key2`) và hiển thị mã QR điện tử bằng `<QRCodeSVG />`:

```mermaid
sequenceDiagram
    autonumber
    actor C as Khách hàng (Customer)
    participant UI as Giao diện Web (Next.js Client)
    participant Server as Next.js API Server
    participant DB as Docker PostgreSQL (Port 5434)
    participant Zalo as Cổng ZaloPay Sandbox v2

    Note over C, DB: GIAI ĐOẠN 1: CHỌN GHẾ & KHÓA GHẾ TẠM THỜI 10 PHÚT (ATOMIC SEAT LOCKING)
    C->>UI: Chọn suất chiếu & Click chọn ghế trên sơ đồ (VD: A1, A2)
    UI->>Server: POST /api/seats/reserve { screeningId, seatIds: [1, 2] }
    activate Server
    Server->>DB: BEGIN TRANSACTION: Giải phóng các ghế RESERVED đã quá hạn (reservedUntil < NOW())
    Server->>DB: UPDATE seats SET status='RESERVED', reserved_until=NOW()+10m WHERE id IN (1,2) AND status='EMPTY'
    alt Số dòng cập nhật < số ghế yêu cầu (Ghế đã bị người khác giữ/mua)
        DB-->>Server: Rollback (Updated count mismatch)
        Server-->>UI: 409 Conflict { error: "Ghế đã có người đặt hoặc đang được giữ chỗ" }
        UI-->>C: Hiển thị Toast cảnh báo & Làm mới sơ đồ ghế (#802229 / #E63946)
    else Toàn bộ ghế đều trống (Updated count == seatIds.length)
        DB-->>Server: COMMIT TRANSACTION thành công
        Server-->>UI: 200 OK { reservedUntil: "NOW()+10m" }
        UI->>UI: Đổi màu ghế sang Đang chọn (#FFB703) & Bắt đầu Countdown Timer 10:00
    end
    deactivate Server

    Note over C, Zalo: GIAI ĐOẠN 2: KHỞI TẠO ĐƠN HÀNG & LIÊN KẾT CỔNG ZALOPAY SANDBOX V2
    C->>UI: Chọn loại vé (Người lớn 100% / Trẻ em 50%), chọn Combo & Nhập mã Voucher
    C->>UI: Nhấn nút "Thanh toán qua ZaloPay"
    UI->>Server: POST /api/bookings { screeningId, seatIds, ticketItems, combos, couponCode, paymentMethod: "ZaloPay" }
    activate Server
    Server->>DB: BEGIN TRANSACTION: Kiểm tra hạn giữ ghế, kiểm tra Partial Unique Index (unique_active_ticket)
    Server->>DB: Giữ chỗ tồn kho Combo (INSERT combo_reservations status='RESERVED', reserved_until=NOW()+10m)
    Server->>DB: INSERT payments (status='Pending', payment_method='ZaloPay') & INSERT tickets (status='Valid' tạm chờ)
    DB-->>Server: Trả về paymentId & thông tin đơn hàng
    Server-->>UI: 201 Created { paymentId, amount }
    deactivate Server

    UI->>Server: POST /api/payments/zalopay/create { paymentId }
    activate Server
    Server->>Server: Tạo app_trans_id (YYMMDD_paymentId) & Ký HMAC-SHA256 (data, ZALOPAY_KEY1)
    Server->>Zalo: POST https://sb-openapi.zalopay.vn/v2/create { app_id: 2553, app_trans_id, amount, mac, callback_url }
    Zalo-->>Server: 200 OK { return_code: 1, order_url, zp_trans_token }
    Server->>DB: UPDATE payments SET transaction_code = app_trans_id WHERE payment_id = paymentId
    Server-->>UI: 200 OK { order_url }
    deactivate Server

    Note over C, Zalo: GIAI ĐOẠN 3: THANH TOÁN TRÊN ZALOPAY, XỬ LÝ WEBHOOK IPN & RETURN URL
    UI->>Zalo: Chuyển hướng trình duyệt sang trang cổng thanh toán ZaloPay (order_url)
    C->>Zalo: Quét mã QR ZaloPay / Xác nhận thanh toán trên Sandbox
    par Luồng 3A: Server-to-Server Webhook IPN Callback
        Zalo->>Server: POST /api/payments/zalopay/callback { data, mac }
        activate Server
        Server->>Server: Xác thực chữ ký mac bằng HMAC-SHA256 với ZALOPAY_KEY2 (timingSafeEqual)
        alt Chữ ký MAC hợp lệ & Payment đang ở trạng thái Pending
            Server->>DB: BEGIN PRISMA TRANSACTION
            Server->>DB: UPDATE payments SET status='Success' WHERE transaction_code = app_trans_id
            Server->>DB: UPDATE seats SET status='OCCUPIED', reserved_until=NULL WHERE id IN (seatIds)
            Server->>DB: UPDATE tickets SET status='Valid' & Sinh chữ ký QR HMAC-SHA256(ticketId|screeningId|seatCode)
            Server->>DB: UPDATE combo_reservations SET status='COMPLETED' & INSERT order_combos (is_delivered=false)
            DB-->>Server: COMMIT TRANSACTION hoàn tất
            Server-->>Zalo: 200 OK { return_code: 1, return_message: "success" }
        else Chữ ký sai hoặc giao dịch đã xử lý (Idempotent)
            Server-->>Zalo: 200 OK { return_code: -1 / 2, return_message: "mac failed or already processed" }
        end
        deactivate Server
    and Luồng 3B: Client Redirect Return URL
        Zalo->>UI: GET /api/payments/zalopay/return?amount=...&apptransid=...&status=1&checksum=...
        UI->>Server: Xác thực checksum Return URL & Kiểm tra trạng thái đơn hàng
        Server->>DB: Đồng bộ trạng thái Payment='Success', Seat='OCCUPIED', Ticket='Valid' (nếu IPN chưa kịp tới)
        Server-->>UI: Redirect 302 tới /tickets/success?paymentId=...
    end
    UI-->>C: Render vé điện tử kèm mã QR sắc nét bằng <QRCodeSVG /> (qrcode.react)
```

---

### 6.3 Sơ đồ tuần tự: Hủy vé do sự cố rạp & Hoàn tiền mặt (Sequence Diagram: Incident Refund)

Sơ đồ tuần tự dưới đây mô tả quy trình xử lý sự cố kỹ thuật tại rạp (mất điện, hỏng máy chiếu) được chia làm **2 giai đoạn tách biệt rõ ràng**:
- **Giai đoạn 1:** Hủy vé sự cố trên hệ thống (không bị giới hạn bởi quy tắc trước 2 tiếng), tự động chuyển trạng thái hoàn tiền sang `PENDING_CASH_REFUND` (chờ hoàn 100% tiền mặt), giải phóng ghế về `EMPTY`, hoàn lại tồn kho cho các combo chưa nhận và ghi vết `AuditLog`.
- **Giai đoạn 2:** Đối soát và chi tiền mặt thực tế tại quầy trong vòng **30 ngày** kể từ ngày suất chiếu gặp sự cố, chuyển trạng thái công nợ sang `REFUNDED_CASH`.

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên quầy / Admin
    actor Customer as Khách hàng (Customer)
    participant UI as Giao diện Quản trị / POS
    participant API as Next.js Staff/Admin API
    participant DB as Docker PostgreSQL (Port 5434)
    participant Cash as Quỹ tiền mặt tại quầy

    Note over Staff, DB: GIAI ĐOẠN 1: KÍCH HOẠT HỦY VÉ DO SỰ CỐ RẠP & GHI NHẬN CÔNG NỢ CHỜ HOÀN (PENDING_CASH_REFUND)
    Staff->>UI: Tra cứu mã vé (#LMC-000123) hoặc Chọn suất chiếu gặp sự cố kỹ thuật
    UI->>API: GET /api/staff/tickets/search?q=123
    activate API
    API->>DB: SELECT * FROM tickets JOIN screenings JOIN payments WHERE ticket_id = 123
    DB-->>API: Trả về thông tin vé (status='Valid', price, OrderCombos đi kèm)
    API-->>UI: Hiển thị chi tiết vé & trạng thái nhận bắp nước
    deactivate API

    Staff->>UI: Chọn chức năng "Hủy vé sự cố rạp" & Nhập lý do (VD: "Hỏng máy chiếu phòng Cinema 02")
    UI->>API: POST /api/staff/tickets/123/cancel-incident { reason: "Hỏng máy chiếu phòng Cinema 02" }
    activate API
    API->>DB: BEGIN PRISMA TRANSACTION (Không áp dụng điều kiện chặn 2 tiếng trước giờ chiếu)
    API->>DB: UPDATE tickets SET status='Cancelled', cancellation_reason='INCIDENT: Hỏng máy chiếu | PENDING_CASH_REFUND'
    API->>DB: Ghi nhận công nợ hoàn tiền mặt 100% (refundStatus='PENDING_CASH_REFUND', refundAmount=100% giá thực trả)
    API->>DB: UPDATE seats SET status='EMPTY', reserved_until=NULL WHERE seat_id = ticket.seat_id (Giải phóng ghế)
    opt Đơn hàng có kèm Combo bắp nước ở trạng thái Chưa nhận (is_delivered = false)
        API->>DB: UPDATE combos SET stock = stock + order_combos.quantity (Hoàn trả tồn kho bắp nước)
        API->>DB: Cập nhật trạng thái OrderCombo sang 'Đã hủy' & Cộng gộp tiền combo vào tổng tiền chờ hoàn
    end
    API->>DB: Ghi nhật ký kiểm toán sự cố (AuditLog: action='INCIDENT_CANCEL_TICKET', actorId=staff.id, timestamp=NOW())
    DB-->>API: COMMIT TRANSACTION thành công
    API-->>UI: 200 OK { ticketStatus: "Cancelled", refundStatus: "PENDING_CASH_REFUND", refundDeadline: "+30 days" }
    deactivate API
    UI-->>Customer: Thông báo xin lỗi sự cố & Hướng dẫn khách đến quầy nhận lại 100% tiền mặt trong vòng 30 ngày

    Note over Customer, Cash: GIAI ĐOẠN 2: ĐỐI SOÁT CHỨNG TỪ & CHI TRẢ TIỀN MẶT TẠI QUẦY TRONG VÒNG 30 NGÀY (REFUNDED_CASH)
    Customer->>Staff: Đến quầy vé xuất trình mã vé #LMC-000123 / QR Code (trong thời hạn <= 30 ngày)
    Staff->>UI: Nhập mã vé #LMC-000123 trên màn hình Tra cứu & Đối soát hoàn tiền
    UI->>API: GET /api/staff/tickets/123
    API->>DB: Kiểm tra điều kiện: status=='Cancelled' AND refundStatus=='PENDING_CASH_REFUND' AND NOW() <= incidentDate + 30d
    DB-->>API: Xác nhận vé hợp lệ đang chờ chi tiền mặt
    API-->>UI: Hiển thị số tiền mặt cần hoàn trả 100% & Nút "Xác nhận đã chi tiền mặt"

    Staff->>Cash: Xuất quỹ tiền mặt đúng số tiền hiển thị trên hệ thống
    Staff->>Customer: Bàn giao 100% tiền mặt cho khách hàng & Ký xác nhận biên nhận
    Staff->>UI: Nhấn nút "Xác nhận đã hoàn tiền mặt cho khách"
    UI->>API: POST /api/staff/tickets/123/confirm-cash-refund { staffId, note: "Đã chi tiền mặt tại quầy POS 01" }
    activate API
    API->>DB: BEGIN PRISMA TRANSACTION
    API->>DB: Cập nhật trạng thái hoàn tiền vé sang refundStatus='REFUNDED_CASH', refundedAt=NOW()
    API->>DB: UPDATE payments SET status='Refunded' WHERE payment_id = ticket.payment_id
    API->>DB: Ghi nhật ký kiểm toán kế toán (AuditLog: action='CONFIRM_CASH_REFUND', staffId, amount, refundedAt)
    DB-->>API: COMMIT TRANSACTION hoàn tất
    API-->>UI: 200 OK { refundStatus: "REFUNDED_CASH" }
    deactivate API
    UI-->>Staff: Cập nhật báo cáo: Giảm "Tiền chờ hoàn" và Tăng "Tiền đã hoàn thực tế" (BR-10)
```

---

### 6.4 Sơ đồ hoạt động: Luồng giao nhận combo tại quầy (Activity Diagram: Combo Fulfillment)

Sơ đồ hoạt động dưới đây mô tả luồng kiểm tra và bàn giao bắp nước tại quầy Concession (`FR-CHK-02`, `BR-05`), đảm bảo tính độc lập hoàn toàn với việc soát vé vào phòng chiếu và ngăn chặn tuyệt đối việc giao trùng lặp:

```mermaid
graph TD
    Start(["Khách hàng đến quầy bắp nước (Concession)"]) --> PresentCode["Khách xuất trình Mã đơn hàng (Payment/Ticket Code) hoặc QR"]
    PresentCode --> StaffInput["Nhân viên nhập/quét Mã đơn trên màn hình Giao nhận Combo"]
    StaffInput --> CallAPI["Hệ thống gọi GET /api/staff/combos?code=..."]
    CallAPI --> CheckOrder{"Kiểm tra đơn hàng trong CSDL"}

    CheckOrder -- "Không tồn tại hoặc chưa thanh toán (Pending/Failed)" --> AlertInvalid["Hiển thị thông báo lỗi: Mã đơn không hợp lệ hoặc chưa thanh toán"]
    AlertInvalid --> PresentCode

    CheckOrder -- "Đơn hàng hợp lệ (Payment = Success)" --> CheckHasCombo{"Đơn hàng có chứa món OrderCombo?"}

    CheckHasCombo -- "Không có combo nào" --> AlertNoCombo["Thông báo: Đơn hàng này chỉ mua vé, không kèm bắp nước"]
    AlertNoCombo --> EndReject(["Kết thúc quy trình"])

    CheckHasCombo -- "Có danh sách OrderCombo" --> CheckComboStatus{"Kiểm tra trạng thái nhận (isDelivered / status)"}

    CheckComboStatus -- "Đã hủy do sự cố (Cancelled)" --> AlertCancelled["Cảnh báo đỏ: Đơn combo đã bị hủy do sự cố suất chiếu (Chờ hoàn tiền)"]
    AlertCancelled --> EndReject

    CheckComboStatus -- "Tất cả món đã nhận (isDelivered == true / 'Đã nhận')" --> AlertAlreadyDelivered["Cảnh báo chống gian lận: Đơn hàng đã nhận đủ combo lúc [deliveredAt]!"]
    AlertAlreadyDelivered --> EndReject

    CheckComboStatus -- "Còn món chưa nhận (isDelivered == false / 'Chưa nhận')" --> ShowPendingList["Hiển thị danh sách chi tiết các gói Combo & Số lượng cần giao"]
    ShowPendingList --> PrepareCombo["Nhân viên chuẩn bị bắp & nước ngọt đúng theo danh sách"]
    PrepareCombo --> ConfirmClick["Nhân viên nhấn nút 'Xác nhận đã giao combo' (POST /api/staff/combos/fulfill)"]
    ConfirmClick --> UpdateDB["Transaction CSDL: Cập nhật is_delivered = true ('Đã nhận') & delivered_at = NOW()"]
    UpdateDB --> Handover["Nhân viên bàn giao bắp nước cho khách hàng"]
    Handover --> EndSuccess(["Hoàn tất giao nhận combo tại quầy"])
```

---

### 6.5 Sơ đồ dữ liệu thực thể quan hệ (ERD - Entity Relationship Diagram)

Sơ đồ thực thể quan hệ (ERD) dưới đây đồng bộ 100% với cấu trúc `cinema-app/prisma/schema.prisma` đang vận hành trên Docker PostgreSQL 16 (bao gồm 11 bảng vật lý trong schema cùng các trường mở rộng phục vụ kiểm toán hoàn tiền và nhật ký hệ thống `AUDIT_LOGS`):

```mermaid
erDiagram
    USERS ||--o{ PAYMENTS : "thuc_hien"
    USERS ||--o{ TICKETS : "so_huu"
    USERS ||--o{ REVIEWS : "danh_gia"
    USERS ||--o{ COUPONS : "so_huu_voucher_boi_hoan"
    USERS ||--o{ COMBO_RESERVATIONS : "giu_kho_tam_thoi"
    USERS ||--o{ AUDIT_LOGS : "thuc_thi_hanh_dong"

    MOVIES ||--o{ SCREENINGS : "co_lich_chieu"
    MOVIES ||--o{ REVIEWS : "nhan_binh_luan"
    MOVIES ||--o{ COUPONS : "ap_dung_rieng_cho_phim"

    SCREENINGS ||--|{ SEATS : "khoi_tao_50_ghe_A1_E10"
    SCREENINGS ||--o{ TICKETS : "phat_hanh_ve"
    SCREENINGS }o--|| PRICING : "tham_chieu_ty_le_gia"

    SEATS ||--o{ TICKETS : "gan_vi_tri_ghe"

    PAYMENTS ||--|{ TICKETS : "thanh_toan_cho_ve"
    PAYMENTS ||--o{ ORDER_COMBOS : "bao_gom_bap_nuoc"

    COMBOS ||--o{ ORDER_COMBOS : "chi_tiet_mon_da_mua"
    COMBOS ||--o{ COMBO_RESERVATIONS : "khoa_ton_kho_10_phut"

    USERS {
        int user_id PK "Auto Increment"
        varchar email UK "Unique Email"
        varchar password "Bcrypt Hash"
        varchar name "Ho va ten"
        varchar phone "So dien thoai"
        enum role "CUSTOMER | STAFF | ADMIN"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    MOVIES {
        int movie_id PK "Auto Increment"
        varchar title "Ten phim"
        varchar slug UK "Duong dan SEO"
        text description "Mo ta noi dung"
        int duration "Thoi luong (phut)"
        date release_date "Ngay khoi chieu"
        date end_date "Ngay ket thuc"
        varchar age_rating "P | C13 | T18"
        varchar poster "URL anh bia"
        varchar trailer "URL video trailer"
        decimal rating "Diem trung binh (0.0 - 5.0)"
        varchar genre "The loai phim"
        varchar director "Dao dien"
        text cast "Danh sach dien vien"
        enum status "SHOWING | UPCOMING | ENDED"
        decimal ticket_price "Gia ve co ban (VND)"
        boolean is_deleted "Co xoa mem (Soft Delete)"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    SCREENINGS {
        int screening_id PK "Auto Increment"
        int movie_id FK "Tham chieu movies.movie_id"
        varchar room "Ten phong (Cinema 01 -> 05)"
        int room_number "So phong (1 -> 5)"
        datetime start_time "Thoi gian bat dau chieu"
        datetime end_time "Thoi gian ket thuc chieu"
        date date "Ngay chieu"
        decimal price "Gia co ban cua suat chieu"
        enum status "UPCOMING | SHOWING | ENDED | CANCELLED"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    SEATS {
        int seat_id PK "Auto Increment"
        int screening_id FK "Tham chieu screenings.screening_id"
        varchar room "Ten phong chieu"
        varchar row "Hang ghe (A -> E)"
        int number "So cot ghe (1 -> 10)"
        varchar code "Ma ghe (A1 -> E10) - UK(screening_id, code)"
        enum type "STANDARD | VIP | COUPLE"
        enum status "EMPTY | RESERVED | OCCUPIED"
        datetime reserved_until "Thoi diem het han giu ghe (NOW + 10m)"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    PRICING {
        int pricing_id PK "Auto Increment"
        varchar ticket_type UK "Normal | Child | VIP"
        varchar label "Nhan hien thi (Ve Thuong / Ve Tre Em)"
        int percentage "Ty le gia (100% | 50%)"
        decimal base_price "Gia goc tham chieu"
        text description "Ghi chu quy tac ap dung"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    COUPONS {
        int coupon_id PK "Auto Increment"
        varchar code UK "Ma voucher (VD: COMP50_XXXXX)"
        enum discount_type "Percentage | FixedAmount"
        decimal discount_value "Gia tri giam (% hoac VND)"
        decimal min_amount "Gia tri don toi thieu"
        int max_usage "So luot dung toi da"
        int used_count "So luot da su dung"
        date expiry_date "Ngay het han (30 ngay cho COMP50)"
        int applicable_movie_id FK "Phim ap dung (Nullable)"
        int user_id FK "User so huu rieng (Nullable)"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    COMBOS {
        int combo_id PK "Auto Increment"
        varchar name "Ten goi bap nuoc"
        text description "Mo ta chi tiet"
        decimal price "Don gia combo"
        varchar image "URL hinh anh"
        int stock "So luong ton kho hien tai"
        enum status "ACTIVE | INACTIVE"
        datetime reserved_until "Thoi gian khoa tam"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    COMBO_RESERVATIONS {
        int reservation_id PK "Auto Increment"
        int combo_id FK "Tham chieu combos.combo_id"
        int user_id FK "Tham chieu users.user_id"
        int quantity "So luong tam giu"
        varchar status "RESERVED | RELEASED | COMPLETED"
        datetime reserved_until "Het han sau 10 phut"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    PAYMENTS {
        int payment_id PK "Auto Increment"
        int user_id FK "Tham chieu users.user_id"
        int screening_id "Suat chieu thanh toan"
        json seat_ids "Danh sach ID ghe trong giao dich"
        varchar coupon_code "Ma giam gia da ap dung"
        json ticket_items "Chi tiet loai ve & gia"
        decimal amount "Tong tien thanh toan thuc te"
        enum payment_method "ZALOPAY | CASH | POS_QR | VNPay | Momo | BankCard"
        varchar transaction_code "Ma giao dich (app_trans_id ZaloPay)"
        enum status "Pending | Success | Failed | Refunded"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    TICKETS {
        int ticket_id PK "Auto Increment - Partial UK(screening_id, seat_id) WHERE status != Cancelled"
        int user_id FK "Tham chieu users.user_id"
        int screening_id FK "Tham chieu screenings.screening_id"
        int seat_id FK "Tham chieu seats.seat_id"
        int payment_id FK "Tham chieu payments.payment_id"
        varchar ticket_type "Adult (100%) | Child (50%)"
        decimal price "Gia ve thuc thu sau giam gia"
        datetime purchase_date "Thoi diem xuat ve"
        enum status "Valid | Used | Cancelled"
        text cancellation_reason "Ly do huy & Co trang thai hoan tien (NONE | PENDING_CASH_REFUND | REFUNDED_CASH)"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    ORDER_COMBOS {
        int order_combo_id PK "Auto Increment"
        int payment_id FK "Tham chieu payments.payment_id"
        int combo_id FK "Tham chieu combos.combo_id"
        int quantity "So luong mua"
        decimal price "Don gia tai thoi diem mua"
        boolean is_delivered "false (Chua nhan) | true (Da nhan)"
        datetime delivered_at "Thoi diem nhan bap nuoc tai quay"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    REVIEWS {
        int review_id PK "Auto Increment"
        int user_id FK "Tham chieu users.user_id"
        int movie_id FK "Tham chieu movies.movie_id"
        int rating "So sao danh gia (1 -> 5)"
        text comment "Noi dung binh luan"
        datetime created_at "Thoi gian tao"
        datetime updated_at "Thoi gian cap nhat"
    }

    AUDIT_LOGS {
        int log_id PK "Logical Audit Record"
        int actor_id FK "Nhan vien / Admin thuc hien"
        varchar action "INCIDENT_CANCEL | CONFIRM_CASH_REFUND | EMERGENCY_SCREENING_CANCEL"
        varchar target_entity "TICKET | SCREENING | PAYMENT"
        int target_id "ID ban ghi bi tac dong"
        text metadata "Chi tiet so tien hoan, ly do su co, chu ky"
        datetime created_at "Thoi diem ghi nhan su kien"
    }
```

---

### 6.6 Đặc tả Vòng đời Trạng thái của các Thực thể (State Machine Specifications)

Mục này đặc tả chi tiết **Bảng Chuyển Trạng Thái (State Transition Table)** và **Sơ đồ Trạng thái (`stateDiagram-v2`)** cho **6 thực thể cốt lõi** của hệ thống, đồng bộ tuyệt đối với bộ sơ đồ trong thư mục `PlantUML_State_Diagrams/` và logic xử lý trong mã nguồn Prisma/Next.js.

---

#### 6.6.1 Thực thể 1: Ghế ngồi theo suất chiếu (`Seat`)

##### Bảng chuyển trạng thái Ghế ngồi (`Seat State Transition Table`)

| Trạng thái nguồn (Source State) | Sự kiện kích hoạt (Trigger Event) | Điều kiện biên (Guard Condition) | Trạng thái đích (Target State) | Hành động hệ thống (System Action) |
| :--- | :--- | :--- | :--- | :--- |
| `[*]` (Khởi tạo) | Admin tạo suất chiếu mới (`POST /api/admin/screenings`) | Phòng chiếu không bị trùng lịch (`checkRoomConflict == false`) | `EMPTY` | Khởi tạo tự động 50 bản ghi ghế (`A1` đến `E10`), `type = 'STANDARD'`, `status = 'EMPTY'`, `reservedUntil = null`. |
| `EMPTY` | Khách hàng hoặc Nhân viên POS chọn ghế (`POST /api/seats/reserve`) | `seat.status == 'EMPTY'` hoặc (`seat.status == 'RESERVED'` và `reservedUntil < NOW()`) | `RESERVED` | Khóa ghế tạm thời trong Transaction nguyên tử: cập nhật `status = 'RESERVED'`, thiết lập `reservedUntil = NOW() + 10 phút`. |
| `RESERVED` | Hết hạn 10 phút giữ ghế hoặc Khách bỏ chọn / Thanh toán thất bại | `NOW() > seat.reservedUntil` hoặc nhận tín hiệu hủy phiên đặt vé | `EMPTY` | Giải phóng khóa ghế: cập nhật `status = 'EMPTY'`, xóa `reservedUntil = null` để khách hàng khác có thể chọn. |
| `RESERVED` | Thanh toán thành công (ZaloPay IPN Callback / Return hoặc Thu tiền POS) | `payment.status == 'Success'` và `NOW() <= seat.reservedUntil` | `OCCUPIED` | Xác nhận bán ghế chính thức: cập nhật `status = 'OCCUPIED'`, xóa `reservedUntil = null`, liên kết với bản ghi `Ticket` (`Valid`). |
| `OCCUPIED` | Hủy vé hợp lệ (Khách tự hủy trước >= 2h hoặc Rạp hủy vé/suất chiếu do sự cố) | `ticket.status` chuyển từ `'Valid'` sang `'Cancelled'` | `EMPTY` | Giải phóng ghế trở lại sơ đồ phòng chiếu (`status = 'EMPTY'`, `reservedUntil = null`) nếu suất chiếu vẫn đang mở bán. |
| `OCCUPIED` / `EMPTY` | Suất chiếu kết thúc (`Screening` chuyển sang `ENDED`) | `NOW() >= screening.endTime` | `[*]` (Kết thúc) | Đóng vòng đời giao dịch của ghế theo suất chiếu, lưu trữ dữ liệu lịch sử phục vụ thống kê tỷ lệ lấp đầy phòng chiếu. |

##### Sơ đồ trạng thái Ghế ngồi (`Seat State Diagram`)

```mermaid
stateDiagram-v2
    [*] --> EMPTY : Tạo suất chiếu mới (Khởi tạo 50 ghế A1-E10)

    EMPTY --> RESERVED : Khách chọn ghế (POST /api/seats/reserve)\n[status == EMPTY] / reservedUntil = NOW() + 10m
    RESERVED --> EMPTY : Quá hạn 10 phút chưa thanh toán [NOW() > reservedUntil]\nhoặc Khách hủy phiên / Thanh toán Failed\n/ Giải phóng ghế (reservedUntil = null)

    RESERVED --> OCCUPIED : Thanh toán thành công (ZaloPay IPN / POS Cash)\n[Payment == Success] / Gắn mã vé Valid, xóa reservedUntil

    OCCUPIED --> EMPTY : Vé bị hủy hợp lệ (Khách hủy trước >= 2h hoặc Rạp hủy sự cố)\n[Ticket -> Cancelled] / Giải phóng ghế trống để bán lại

    OCCUPIED --> [*] : Suất chiếu kết thúc (Screening == ENDED)
    EMPTY --> [*] : Suất chiếu kết thúc / Bị hủy (ENDED / CANCELLED)
```

---

#### 6.6.2 Thực thể 2: Vé xem phim & Trạng thái hoàn tiền (`Ticket` & `RefundStatus`)

##### Bảng chuyển trạng thái Vé xem phim (`Ticket State Transition Table`)

| Trạng thái nguồn (Source State) | Sự kiện kích hoạt (Trigger Event) | Điều kiện biên (Guard Condition) | Trạng thái đích (Target State) | Hành động hệ thống (System Action) |
| :--- | :--- | :--- | :--- | :--- |
| `[*]` (Khởi tạo) | Tạo đơn đặt vé (`POST /api/bookings` hoặc `POST /api/staff/pos`) | Ghế đang được khóa hợp lệ (`RESERVED`) và vượt qua kiểm tra `Partial Unique Index` | `Valid` (`refundStatus = NONE`) | Khi thanh toán hoàn tất (`Payment = Success`), kích hoạt vé `status = 'Valid'`, sinh chữ ký bảo mật `HMAC-SHA256` cho mã QR. |
| `Valid` (`NONE`) | Nhân viên quét mã QR tại cổng soát vé (`POST /api/staff/checkin`) | Chữ ký `HMAC-SHA256` hợp lệ VÀ `startTime - 30p <= NOW() <= endTime` | `Used` (`NONE`) | Cập nhật `status = 'Used'`, đóng dấu thời gian check-in. **Ràng buộc bất biến:** Vé `Used` không thể hủy hoặc hoàn tiền dưới mọi hình thức (`FR-CAN-03`). |
| `Valid` (`NONE`) | Khách hàng chủ động yêu cầu hủy vé (`POST /api/tickets/[id]/cancel`) | `screening.startTime - NOW() >= 2 giờ` (`BR-03`) | `Cancelled` (`NONE` - Đã cấp Voucher 50%) | Cập nhật `status = 'Cancelled'`, giải phóng ghế về `EMPTY`, tự động phát hành mã Voucher `COMP50_XXXXX` trị giá 50% tiền vé (hạn 30 ngày), không hoàn tiền mặt. |
| `Valid` (`NONE`) | Nhân viên/Admin hủy vé do sự cố rạp hoặc hủy suất chiếu khẩn cấp (`BR-04`) | Sự cố kỹ thuật (mất điện, hỏng máy chiếu) — **Không** kiểm tra điều kiện 2 giờ | `Cancelled` (`PENDING_CASH_REFUND`) | Cập nhật `status = 'Cancelled'`, ghi nhận công nợ `PENDING_CASH_REFUND` (100% số tiền thực trả), giải phóng ghế `EMPTY`, hoàn kho combo chưa nhận, ghi `AuditLog`. |
| `Cancelled` (`PENDING_CASH_REFUND`) | Khách đến quầy nhận tiền mặt & Nhân viên xác nhận (`POST /api/staff/tickets/[id]/refund`) | `NOW() <= incidentDate + 30 ngày` và `refundStatus == 'PENDING_CASH_REFUND'` | `Cancelled` (`REFUNDED_CASH`) | Chuyển trạng thái hoàn tiền sang `REFUNDED_CASH`, cập nhật `Payment = Refunded`, khấu trừ công nợ chờ hoàn và cộng vào chỉ số tiền đã hoàn thực tế (`BR-10`). |
| `Used` / `Cancelled` | Hoàn tất vòng đời nghiệp vụ của vé | Suất chiếu đã kết thúc hoặc đã tất toán xong công nợ hoàn tiền | `[*]` (Kết thúc) | Lưu trữ vĩnh viễn lịch sử vé trong CSDL (cấm thực hiện câu lệnh `DELETE` vật lý). |

##### Sơ đồ trạng thái Vé xem phim (`Ticket State Diagram`)

```mermaid
stateDiagram-v2
    [*] --> Valid : Thanh toán thành công (ZaloPay / POS)\n/ Sinh mã QR ký số HMAC-SHA256 (refundStatus = NONE)

    state Valid {
        [*] --> ReadyForCheckIn : Vé hợp lệ chờ soát vé (refundStatus = NONE)
    }

    Valid --> Used : Nhân viên quét QR Check-in (POST /api/staff/checkin)\n[Chữ ký HMAC đúng & Trong khung giờ chiếu]\n/ Đóng dấu đã vào rạp (Cấm hủy/hoàn tiền - FR-CAN-03)

    Valid --> Cancelled_ByCustomer : Khách tự hủy vé (POST /api/tickets/[id]/cancel)\n[Cách giờ chiếu >= 2 tiếng (BR-03)]\n/ Giải phóng ghế EMPTY & Cấp Voucher COMP50_ (50%, hạn 30 ngày)

    Valid --> Cancelled_IncidentPending : Hủy do sự cố rạp / Hủy suất chiếu khẩn cấp (BR-04)\n[Không giới hạn 2h]\n/ Giải phóng ghế EMPTY, hoàn kho Combo chưa nhận & Ghi AuditLog

    state "Cancelled (Đã hủy)" as CancelledState {
        state "NONE (Khách tự hủy - Đã nhận Voucher 50%)" as Cancelled_ByCustomer
        state "PENDING_CASH_REFUND (Chờ hoàn tiền mặt 100%)" as Cancelled_IncidentPending
        state "REFUNDED_CASH (Đã chi trả 100% tiền mặt tại quầy)" as Cancelled_RefundedCash

        Cancelled_IncidentPending --> Cancelled_RefundedCash : Khách đến quầy trong vòng 30 ngày\n& Nhân viên xác nhận chi quỹ (POST /api/staff/tickets/[id]/refund)\n/ Cập nhật Payment = Refunded & Ghi AuditLog kế toán
    }

    Used --> [*] : Suất chiếu kết thúc
    Cancelled_ByCustomer --> [*] : Kết thúc (Đã đền bù bằng Voucher)
    Cancelled_RefundedCash --> [*] : Tất toán hoàn tất công nợ tiền mặt
```

---

#### 6.6.3 Thực thể 3: Giao dịch Thanh toán (`Payment`)

##### Bảng chuyển trạng thái Giao dịch Thanh toán (`Payment State Transition Table`)

| Trạng thái nguồn (Source State) | Sự kiện kích hoạt (Trigger Event) | Điều kiện biên (Guard Condition) | Trạng thái đích (Target State) | Hành động hệ thống (System Action) |
| :--- | :--- | :--- | :--- | :--- |
| `[*]` (Khởi tạo) | Khách hàng tạo đơn đặt vé online hoặc Nhân viên tạo đơn POS | Ghế và Combo đang được giữ chỗ hợp lệ | `Pending` | Tạo bản ghi `payments` với `status = 'Pending'`, lưu `amount`, `paymentMethod` (`ZaloPay`, `Cash`, `POS_QR`) và `transactionCode` (`app_trans_id`). |
| `Pending` | Nhận Webhook IPN từ ZaloPay (`/api/payments/zalopay/callback`), Return URL hợp lệ, hoặc Thu ngân POS bấm xác nhận thu tiền | Chữ ký `mac` (`ZALOPAY_KEY2`) hợp lệ & `return_code == 1` (hoặc thu đủ tiền tại POS) | `Success` (Completed) | Cập nhật `payment.status = 'Success'`, chuyển toàn bộ ghế sang `OCCUPIED`, kích hoạt vé `Valid`, chuyển `ComboReservation` sang `COMPLETED` và tạo `OrderCombo`. |
| `Pending` | Giao dịch ZaloPay thất bại, khách hủy thanh toán, hoặc quá hạn giữ chỗ 10-15 phút | `return_code != 1` hoặc `NOW() > reservedUntil` | `Failed` | Cập nhật `payment.status = 'Failed'`, hủy các vé tạm, giải phóng ghế về `EMPTY`, giải phóng tồn kho `ComboReservation` (`RELEASED`) và hoàn lại lượt dùng `Coupon`. |
| `Success` (Completed) | Nhân viên xác nhận đã chi trả 100% tiền mặt tại quầy cho vé bị hủy do sự cố rạp | Vé thuộc đơn có `refundStatus == 'PENDING_CASH_REFUND'` và khách đến nhận tiền trong hạn 30 ngày | `Refunded` | Cập nhật `payment.status = 'Refunded'`, chuyển trạng thái hoàn tiền vé sang `REFUNDED_CASH` và ghi nhận bút toán giảm trừ doanh thu thuần (`BR-10`). |
| `Success` / `Failed` / `Refunded` | Kết thúc chu kỳ thanh toán | Đã đối soát xong tài chính | `[*]` (Kết thúc) | Đóng giao dịch, bảo toàn dữ liệu cho báo cáo doanh thu. |

##### Sơ đồ trạng thái Giao dịch Thanh toán (`Payment State Diagram`)

```mermaid
stateDiagram-v2
    [*] --> Pending : Khởi tạo đơn hàng (POST /api/bookings hoặc POS)\n/ Sinh app_trans_id & Ký MAC bằng ZALOPAY_KEY1

    Pending --> Success : ZaloPay IPN Callback / Return hợp lệ [MAC ZALOPAY_KEY2 đúng]\nhoặc Thu ngân POS xác nhận thu tiền mặt/QR\n/ Kích hoạt Ticket=Valid, Seat=OCCUPIED, tạo OrderCombo

    Pending --> Failed : Khách hủy trên cổng ZaloPay / Lỗi thanh toán\nhoặc Quá hạn giữ chỗ 10-15 phút [Timeout]\n/ Giải phóng ghế EMPTY, hoàn kho Combo & hoàn lượt dùng Voucher

    Success --> Refunded : Vé/Suất chiếu hủy sự cố rạp (BR-04)\n& Thu ngân xác nhận đã chi trả 100% tiền mặt tại quầy (trong 30 ngày)\n/ Cập nhật refundStatus = REFUNDED_CASH

    Success --> [*] : Ghi nhận doanh thu thực thu (Net Revenue)
    Failed --> [*] : Đóng giao dịch thất bại
    Refunded --> [*] : Hoàn tất đối soát hoàn tiền mặt
```

---

#### 6.6.4 Thực thể 4: Đơn hàng Combo Bắp nước (`ComboReservation` & `OrderCombo`)

##### Bảng chuyển trạng thái Đơn hàng Combo (`Combo Reservation & OrderCombo State Transition Table`)

| Trạng thái nguồn (Source State) | Sự kiện kích hoạt (Trigger Event) | Điều kiện biên (Guard Condition) | Trạng thái đích (Target State) | Hành động hệ thống (System Action) |
| :--- | :--- | :--- | :--- | :--- |
| `[*]` (Khởi tạo) | Khách chọn gói bắp nước khi đặt vé (`POST /api/bookings`) | `combo.status == 'ACTIVE'` và `combo.stock - activeReservations >= quantity` | `RESERVED` (`ComboReservation`) | Tạo bản ghi `combo_reservations` với `status = 'RESERVED'`, `reservedUntil = NOW() + 10 phút` để giữ tồn kho tạm thời. |
| `RESERVED` | Đơn hàng quá hạn 10 phút chưa thanh toán hoặc Thanh toán thất bại (`Failed`) | `NOW() > reservedUntil` hoặc `payment.status == 'Failed'` | `EXPIRED` / `RELEASED` | Cập nhật `combo_reservations.status = 'RELEASED'`, giải phóng số lượng bắp nước đang giữ về lại kho khả dụng. |
| `RESERVED` | Thanh toán đơn hàng thành công (`Payment = Success`) | Webhook ZaloPay hợp lệ hoặc hoàn tất thu tiền tại POS | `CONFIRMED` (`OrderCombo`: `Chưa nhận` / `isDelivered = false`) | Cập nhật `combo_reservations.status = 'COMPLETED'`, trừ chính thức `combos.stock`, tạo bản ghi `order_combos` với `isDelivered = false` (`Chưa nhận`). |
| `CONFIRMED` (`Chưa nhận`) | Khách xuất trình mã đơn tại quầy bắp nước & Nhân viên bấm xác nhận giao (`POST /api/staff/combos/fulfill`) | `orderCombo.isDelivered == false` (`Chưa nhận`) | `CONFIRMED` (`Đã nhận` / `isDelivered = true`) | Cập nhật `isDelivered = true` (`Đã nhận`), ghi nhận `deliveredAt = NOW()`, chặn tuyệt đối mọi yêu cầu nhận lại lần 2 (`BR-05`). |
| `CONFIRMED` (`Chưa nhận`) | Suất chiếu hoặc vé bị hủy do sự cố kỹ thuật của rạp (`BR-04`) | `orderCombo.isDelivered == false` (Khách chưa nhận bắp nước) | `CANCELLED` (`Đã hủy`) | Hủy món bắp nước trong đơn, cộng hoàn lại số lượng vào tồn kho `combos.stock = stock + quantity`, tính gộp giá trị combo vào số tiền chờ hoàn 100% cho khách. |

##### Sơ đồ trạng thái Đơn hàng Combo (`Combo State Diagram`)

```mermaid
stateDiagram-v2
    [*] --> RESERVED : Khách chọn Combo khi đặt vé\n[Tồn kho khả dụng >= quantity]\n/ Tạo ComboReservation (reservedUntil = NOW() + 10m)

    RESERVED --> EXPIRED : Quá hạn 10 phút không thanh toán hoặc Payment Failed\n/ Cập nhật ComboReservation = RELEASED (Giải phóng tồn kho)

    RESERVED --> CONFIRMED : Thanh toán thành công (Payment == Success)\n/ Trừ tồn kho combos.stock & Tạo OrderCombo

    state "CONFIRMED (OrderCombo đã thanh toán)" as CONFIRMED {
        [*] --> ChuaNhan : Khởi tạo OrderCombo (isDelivered = false)
        state "Chưa nhận (isDelivered = false)" as ChuaNhan
        state "Đã nhận (isDelivered = true)" as DaNhan
        state "Đã hủy (Hoàn kho do sự cố rạp)" as DaHuy

        ChuaNhan --> DaNhan : Khách nhận bắp nước tại quầy (POST /api/staff/combos/fulfill)\n[isDelivered == false] / Cập nhật isDelivered = true, deliveredAt = NOW()
        ChuaNhan --> DaHuy : Hủy vé/suất chiếu do sự cố rạp (BR-04)\n[isDelivered == false] / Cộng hoàn lại combos.stock & Hoàn tiền 100%
    }

    EXPIRED --> [*] : Kết thúc giữ chỗ quá hạn
    DaNhan --> [*] : Hoàn tất phục vụ tại quầy Concession
    DaHuy --> [*] : Hoàn tất hoàn kho & ghi nhận công nợ hoàn tiền
```

---

#### 6.6.5 Thực thể 5: Suất chiếu (`Screening`)

##### Bảng chuyển trạng thái Suất chiếu (`Screening State Transition Table`)

| Trạng thái nguồn (Source State) | Sự kiện kích hoạt (Trigger Event) | Điều kiện biên (Guard Condition) | Trạng thái đích (Target State) | Hành động hệ thống (System Action) |
| :--- | :--- | :--- | :--- | :--- |
| `[*]` (Khởi tạo) | Admin tạo lịch chiếu mới (`POST /api/admin/screenings`) | Phim đang `SHOWING`/`UPCOMING` VÀ không trùng giờ phòng chiếu (`[startTime, endTime + 15p]`) | `UPCOMING` | Tạo bản ghi `screenings` với `status = 'UPCOMING'`, tự động sinh 50 ghế chuẩn `A1..E10` (`EMPTY`), mở bán vé trực tuyến và tại quầy. |
| `UPCOMING` | Đến giờ bắt đầu chiếu phim (Cron/System Time Check) | `NOW() >= screening.startTime` và `screening.status != 'CANCELLED'` | `ONGOING` (`SHOWING`) | Chuyển trạng thái suất chiếu sang đang chiếu (`ONGOING` / `SHOWING`), đóng tính năng đặt vé online cho suất này, duy trì cổng soát vé QR. |
| `ONGOING` (`SHOWING`) | Hết thời lượng chiếu phim | `NOW() >= screening.endTime` | `ENDED` | Chuyển `status = 'ENDED'`, đóng cổng soát vé, chốt số liệu doanh thu và tỷ lệ lấp đầy của suất chiếu. |
| `UPCOMING` / `ONGOING` | Admin kích hoạt Hủy suất chiếu khẩn cấp do sự cố (`POST /api/admin/screenings/[id]/cancel`) | Xảy ra sự cố bất khả kháng tại rạp (mất điện, hỏng máy chiếu, sự cố an toàn) | `CANCELLED` | Chuyển `screening.status = 'CANCELLED'`; tự động chuyển toàn bộ vé `Valid` sang `Cancelled` kèm `PENDING_CASH_REFUND` (100%), giải phóng ghế về `EMPTY`, hoàn kho các combo chưa nhận và ghi `AuditLog`. |
| `ENDED` / `CANCELLED` | Kết thúc vòng đời suất chiếu | Đã lưu trữ xong dữ liệu lịch sử | `[*]` (Kết thúc) | Bảo toàn bản ghi trong CSDL phục vụ truy xuất báo cáo. |

##### Sơ đồ trạng thái Suất chiếu (`Screening State Diagram`)

```mermaid
stateDiagram-v2
    [*] --> UPCOMING : Admin tạo suất chiếu mới (POST /api/admin/screenings)\n[Không trùng phòng chiếu + 15p buffer]\n/ Tự động sinh 50 ghế A1..E10 & Mở bán vé

    UPCOMING --> ONGOING : Đến giờ bắt đầu chiếu [NOW() >= startTime]\n/ Đóng đặt vé online, tiếp tục cho phép Check-in tại rạp

    ONGOING --> ENDED : Hết giờ chiếu phim [NOW() >= endTime]\n/ Đóng soát vé & Chốt thống kê doanh thu suất chiếu

    UPCOMING --> CANCELLED : Admin bấm "Hủy suất chiếu khẩn cấp" (Sự cố kỹ thuật)\n/ Toàn bộ vé Valid -> Cancelled (PENDING_CASH_REFUND 100%),\nGiải phóng ghế EMPTY, hoàn kho Combo chưa nhận & Ghi AuditLog

    ONGOING --> CANCELLED : Sự cố nghiêm trọng làm gián đoạn buổi chiếu giữa chừng\n/ Kích hoạt quy trình hủy khẩn cấp & hoàn tiền mặt 100% (BR-04)

    ENDED --> [*] : Lưu trữ lịch sử suất chiếu
    CANCELLED --> [*] : Hoàn tất xử lý sự cố khẩn cấp
```

---

#### 6.6.6 Thực thể 6: Phim (`Movie`)

##### Bảng chuyển trạng thái Phim (`Movie State Transition Table`)

| Trạng thái nguồn (Source State) | Sự kiện kích hoạt (Trigger Event) | Điều kiện biên (Guard Condition) | Trạng thái đích (Target State) | Hành động hệ thống (System Action) |
| :--- | :--- | :--- | :--- | :--- |
| `[*]` (Khởi tạo) | Admin thêm phim mới (`POST /api/admin/movies`) | Dữ liệu hợp lệ, gắn nhãn độ tuổi (`P`, `C13`, `T18`) và `releaseDate > TODAY` | `UPCOMING` (`isDeleted = false`) | Tạo bản ghi `movies` với `status = 'UPCOMING'`, `isDeleted = false`, hiển thị trong mục "Phim Sắp Chiếu" trên trang chủ. |
| `UPCOMING` | Đến ngày khởi chiếu hoặc Admin mở bán các suất chiếu hoạt động của phim | `TODAY >= releaseDate` hoặc Admin cập nhật trạng thái sang đang chiếu | `SHOWING` (`isDeleted = false`) | Cập nhật `status = 'SHOWING'`, hiển thị nổi bật tại mục "Phim Đang Chiếu", cho phép khách đặt vé và gửi đánh giá 1-5 sao. |
| `SHOWING` | Hết đợt công chiếu hoặc Admin ngừng chiếu / xóa mềm (`DELETE /api/admin/movies/[id]`) | `TODAY > endDate` hoặc phim đã có lịch sử suất chiếu/vé bán (`BR-07`) | `ENDED` (`isDeleted = true` khi xóa mềm) | Cập nhật `status = 'ENDED'` (và đặt cờ `isDeleted = true` nếu Admin thao tác xóa); ẩn khỏi danh sách đặt vé nhưng giữ nguyên dữ liệu lịch sử doanh thu. |
| `UPCOMING` | Phim bị hủy lịch phát hành hoặc Admin xóa phim chưa có giao dịch | Admin thực hiện ngừng phát hành / xóa mềm (`FR-ADM-02`) | `ENDED` (`isDeleted = true`) | Chuyển trạng thái sang `ENDED` và bật cờ `isDeleted = true`, ngừng cho phép xếp lịch chiếu mới. |
| `ENDED` | Admin khôi phục lại phim để tái chiếu (`PUT /api/admin/movies/[id]`) | Admin cập nhật lại `status = 'SHOWING'` và `isDeleted = false` | `SHOWING` (`isDeleted = false`) | Mở lại phim trên danh sách đang chiếu để phục vụ các đợt chiếu lại (Re-release). |

##### Sơ đồ trạng thái Phim (`Movie State Diagram`)

```mermaid
stateDiagram-v2
    [*] --> UPCOMING : Admin thêm phim mới (POST /api/admin/movies)\n/ Thiết lập nhãn tuổi (P, C13, T18), isDeleted = false

    UPCOMING --> SHOWING : Đến ngày khởi chiếu [TODAY >= releaseDate]\nhoặc Admin xếp suất chiếu mở bán\n/ Hiển thị mục "Đang chiếu" & Mở đặt vé

    SHOWING --> ENDED : Hết thời hạn công chiếu [TODAY > endDate]\nhoặc Admin thực hiện Ngừng chiếu / Xóa mềm (Soft Delete - BR-07)\n/ Cập nhật status = ENDED (kèm isDeleted = true nếu xóa mềm)

    UPCOMING --> ENDED : Hủy kế hoạch phát hành / Admin xóa mềm phim sắp chiếu\n/ Cập nhật status = ENDED, isDeleted = true

    ENDED --> SHOWING : Admin mở chiếu lại phim (Re-release)\n/ Cập nhật status = SHOWING, isDeleted = false

    ENDED --> [*] : Bảo toàn dữ liệu lịch sử cho Báo cáo doanh thu (Không Hard Delete)
```

---

### 6.7 Đặc tả Kiến trúc Lớp & Ánh xạ Thành phần (Class Diagram & API Controller Specifications)

Hệ thống Lumi Cinema được thiết kế theo kiến trúc phân tầng **MVC kết hợp Service-Oriented Layer** trên nền tảng Next.js 15 App Router và Prisma ORM, chia thành 3 nhóm lớp chính:
1. **Tầng Thực thể & Mô hình miền (`Entity / Domain Model Classes`):** Ánh xạ trực tiếp với các bảng trong `schema.prisma` và đóng gói các quy tắc kiểm tra dữ liệu nội tại.
2. **Tầng Dịch vụ Nghiệp vụ & Bảo mật (`Service / Helper Classes`):** Chứa các dịch vụ lõi gồm `ZaloPayService` (tích hợp ZaloPay Sandbox v2), `QRSignatureService` (ký và xác thực chữ ký số `HMAC-SHA256`), `SeatExpirationService` (quản lý khóa ghế/combo 10 phút và giải phóng tự động), và `BookingTransactionService` (điều phối giao dịch ACID).
3. **Tầng Điều khiển API (`API Controller / Route Handler Classes`):** Tiếp nhận HTTP Request từ Client/Webhook, kiểm tra phân quyền RBAC qua JWT Session và gọi xuống tầng Service/Prisma.

---

#### 6.7.1 Bảng phân tích chi tiết các Lớp trong hệ thống (Class Specification Table)

| Phân tầng (Layer) | Tên Lớp (Class Name) | Thuộc tính chính (Key Attributes) | Phương thức chính (Methods - Tham số & Kiểu trả về) | Quan hệ với các lớp khác (Relationships) |
| :--- | :--- | :--- | :--- | :--- |
| **Entity / Domain** | `User` *( cùng các lớp con logic `Customer`, `Staff`, `Admin`)* | `- id: Int`<br>`- email: String`<br>`- password: String`<br>`- name: String`<br>`- phone: String?`<br>`- role: Role` | `+ authenticate(email: String, pass: String): Promise<JWT>`<br>`+ hasRole(requiredRole: Role): Boolean`<br>`+ updateProfile(name: String, phone: String): Promise<User>` | - Tổng quát hóa (`Generalization`) cho `Customer`, `Staff`, `Admin`<br>- `1-N` với `Ticket`, `Payment`, `Review`, `Coupon`, `ComboReservation` |
| **Entity / Domain** | `Movie` | `- id: Int`<br>`- title: String`<br>`- slug: String`<br>`- duration: Int`<br>`- ageRating: String`<br>`- rating: Decimal`<br>`- status: MovieStatus`<br>`- ticketPrice: Decimal`<br>`- isDeleted: Boolean` | `+ getActiveScreenings(date: Date): Promise<Screening[]>`<br>`+ recalculateRating(): Promise<Decimal>`<br>`+ softDelete(): Promise<Movie>` | - `1-N` (`Aggregation`) với `Screening`<br>- `1-N` với `Review` và `Coupon` |
| **Entity / Domain** | `Screening` | `- id: Int`<br>`- movieId: Int`<br>`- room: String`<br>`- roomNumber: Int`<br>`- startTime: DateTime`<br>`- endTime: DateTime`<br>`- price: Decimal`<br>`- status: ScreeningStatus` | `+ checkRoomConflict(room: String, start: DateTime, end: DateTime): Promise<Boolean>`<br>`+ initialize50Seats(): Promise<Seat[]>`<br>`+ cancelEmergency(reason: String, adminId: Int): Promise<Int>` | - `1-50` (`Composition` - hợp thành chặt) với `Seat`<br>- `N-1` với `Movie`<br>- `1-N` với `Ticket`<br>- `Dependency` với `Pricing` |
| **Entity / Domain** | `Seat` | `- id: Int`<br>`- screeningId: Int`<br>`- code: String (A1..E10)`<br>`- row: String`<br>`- number: Int`<br>`- type: SeatType`<br>`- status: SeatStatus`<br>`- reservedUntil: DateTime?` | `+ isAvailable(now: DateTime): Boolean`<br>`+ lockTemporarily(minutes: Int): Promise<Boolean>`<br>`+ releaseToEmpty(): Promise<Void>`<br>`+ markAsOccupied(): Promise<Void>` | - `N-1` (`Composition`) thuộc về `Screening`<br>- `1-N` (hoặc `1-1` active qua Partial Unique Index) với `Ticket` |
| **Entity / Domain** | `Pricing` | `- id: Int`<br>`- ticketType: String`<br>`- label: String`<br>`- percentage: Int`<br>`- basePrice: Decimal` | `+ computeTicketPrice(screeningPrice: Decimal, ticketType: String): Decimal`<br>`+ validateChildTicketAllowed(ageRating: String): Boolean` | - Được tham chiếu (`Dependency`) bởi `Screening` và `BookingController` |
| **Entity / Domain** | `Ticket` | `- id: Int`<br>`- userId: Int`<br>`- screeningId: Int`<br>`- seatId: Int`<br>`- paymentId: Int`<br>`- ticketType: String`<br>`- price: Decimal`<br>`- status: TicketStatus`<br>`- cancellationReason: String?` | `+ canCustomerCancel(now: DateTime, startTime: DateTime): Boolean`<br>`+ cancelByCustomer(): Promise<Coupon>`<br>`+ cancelByIncident(reason: String): Promise<Ticket>`<br>`+ confirmCashRefund(staffId: Int): Promise<Ticket>` | - `N-1` với `User`, `Screening`, `Seat`, `Payment`<br>- Sử dụng (`Dependency`) `QRSignatureService` |
| **Entity / Domain** | `Payment` | `- id: Int`<br>`- userId: Int`<br>`- amount: Decimal`<br>`- paymentMethod: PaymentMethod`<br>`- transactionCode: String?`<br>`- status: PaymentStatus` | `+ calculateNetAmount(tickets: List, combos: List, coupon: Coupon?): Decimal`<br>`+ markSuccess(transCode: String): Promise<Payment>`<br>`+ markFailed(): Promise<Payment>`<br>`+ markRefunded(): Promise<Payment>` | - `1-N` (`Composition`) với `OrderCombo`<br>- `1-N` với `Ticket`<br>- `N-1` với `User`<br>- `0..1` với `Coupon` |
| **Entity / Domain** | `Combo` & `OrderCombo` & `ComboReservation` | `- id: Int`<br>`- name: String`<br>`- price: Decimal`<br>`- stock: Int`<br>`- status: ComboStatus`<br>`- isDelivered: Boolean`<br>`- reservedUntil: DateTime` | `+ reserveStock(userId: Int, qty: Int): Promise<ComboReservation>`<br>`+ confirmOrderCombo(paymentId: Int): Promise<OrderCombo>`<br>`+ fulfillAtCounter(staffId: Int): Promise<OrderCombo>`<br>`+ restoreStockOnIncident(): Promise<Void>` | - `Combo` `1-N` (`Composition`) với `ComboReservation`<br>- `Combo` `1-N` với `OrderCombo`<br>- `OrderCombo` `N-1` (`Composition`) với `Payment` |
| **Entity / Domain** | `Coupon` & `Review` | `- code: String`<br>`- discountType: DiscountType`<br>`- discountValue: Decimal`<br>`- maxUsage / usedCount: Int`<br>`- rating: Int (1..5)`<br>`- comment: String` | `+ validateEligibility(userId: Int, movieId: Int, ticketTotal: Decimal): Boolean`<br>`+ computeDiscountAmount(ticketPrices: Decimal[]): Decimal`<br>`+ upsertUserReview(userId: Int, movieId: Int, rating: Int, text: String): Promise<Review>` | - `N-1` với `User` và `Movie` |
| **Service / Helper** | `ZaloPayService` | `- appId: String ("2553")`<br>`- key1: String`<br>`- key2: String`<br>`- endpoint: String` | `+ createOrder(payment: Payment, items: Json): Promise<ZaloCreateResponse>`<br>`+ generateHmacSHA256(data: String, key: String): String`<br>`+ verifyCallbackMac(data: String, receivedMac: String): Boolean`<br>`+ verifyReturnChecksum(queryParams: Map): Boolean` | - Được gọi (`Dependency`) bởi `ZaloPayController`<br>- Tác động lên thực thể `Payment`, `Ticket`, `Seat`, `OrderCombo` |
| **Service / Helper** | `QRSignatureService` | `- secretKey: String (QR_SECRET)`<br>`- algorithm: String ("sha256")` | `+ signTicketPayload(ticketId: Int, screeningId: Int, seatCode: String): String`<br>`+ verifyTicketQR(qrPayload: String, signature: String): Boolean` | - Được gọi (`Dependency`) bởi `TicketController` và `StaffCheckInController` |
| **Service / Helper** | `SeatExpirationService` | `- holdDurationMinutes: Int (10)` | `+ releaseExpiredSeatsAndCombos(screeningId?: Int): Promise<Int>`<br>`+ reserveSeatsAtomic(screeningId: Int, seatIds: Int[]): Promise<Seat[]>` | - Được gọi (`Dependency`) bởi `SeatController`, `BookingController`, `StaffPOSController` |
| **API Controller** | `BookingAndPaymentController` | `- prisma: PrismaClient`<br>`- zaloService: ZaloPayService`<br>`- seatService: SeatExpirationService` | `+ reserveSeats(req: Request): Promise<Response>` (`POST /api/seats/reserve`)<br>`+ createBooking(req: Request): Promise<Response>` (`POST /api/bookings`)<br>`+ createZaloPayUrl(req: Request): Promise<Response>` (`POST /api/payments/zalopay/create`)<br>`+ handleZaloPayIPN(req: Request): Promise<Response>` (`POST /api/payments/zalopay/callback`)<br>`+ handleZaloPayReturn(req: Request): Promise<Response>` (`GET /api/payments/zalopay/return`) | - Điều phối (`Dependency`) `ZaloPayService`, `SeatExpirationService` và các Entity `Payment`, `Ticket`, `Seat`, `ComboReservation` |
| **API Controller** | `StaffOperationsController` | `- prisma: PrismaClient`<br>`- qrService: QRSignatureService` | `+ createPOSOrder(req: Request): Promise<Response>` (`POST /api/staff/pos`)<br>`+ checkInTicket(req: Request): Promise<Response>` (`POST /api/staff/checkin`)<br>`+ fulfillCombo(req: Request): Promise<Response>` (`POST /api/staff/combos/fulfill`)<br>`+ cancelTicketIncident(req: Request): Promise<Response>` (`POST /api/staff/tickets/[id]/cancel`)<br>`+ confirmCashRefund(req: Request): Promise<Response>` (`POST /api/staff/tickets/[id]/refund`) | - Điều phối (`Dependency`) `QRSignatureService`, `Ticket`, `OrderCombo`, `Seat`, `Payment` |
| **API Controller** | `AdminManagementController` | `- prisma: PrismaClient` | `+ manageMovie(req: Request): Promise<Response>` (`/api/admin/movies`)<br>`+ scheduleScreening(req: Request): Promise<Response>` (`/api/admin/screenings`)<br>`+ cancelScreeningEmergency(req: Request): Promise<Response>` (`/api/admin/screenings/[id]/cancel`)<br>`+ getFinancialReport(req: Request): Promise<Response>` (`GET /api/admin/reports`) | - Điều phối (`Dependency`) `Movie`, `Screening`, `Pricing`, `Combo`, `Coupon`, `Payment`, `Ticket` |

---

#### 6.7.2 Sơ đồ Lớp tổng quan (Overall Architecture Class Diagram)

Sơ đồ `classDiagram` dưới đây thể hiện đầy đủ các lớp Thực thể (Domain Entities), các lớp Dịch vụ (Services) và các lớp Điều khiển (Controllers) cùng các mối quan hệ kế thừa (`<|--`), hợp thành (`*--`), kết tập (`o--`) và phụ thuộc (`..>`):

```mermaid
classDiagram
    direction TB

    %% ==========================================
    %% 1. USER HIERARCHY (RBAC)
    %% ==========================================
    class User {
        <<abstract>>
        -Int id
        -String email
        -String passwordHash
        -String name
        -String phone
        -Role role
        -DateTime createdAt
        +login(email: String, pass: String) String
        +register(email: String, pass: String, name: String, phone: String) Boolean
        +updateProfile(name: String, phone: String) Boolean
    }

    class Customer {
        +bookTicketOnline(screeningId: Int, seatIds: List~Int~, couponCode: String) Payment
        +cancelOwnTicket(ticketId: Int) Coupon
        +submitReview(movieId: Int, rating: Int, comment: String) Review
    }

    class Staff {
        +sellAtPOS(screeningId: Int, seatIds: List~Int~, method: PaymentMethod) Payment
        +sellStandaloneCombo(comboId: Int, qty: Int, method: PaymentMethod) Payment
        +checkInQR(qrToken: String) Boolean
        +fulfillComboOrder(paymentId: Int) Boolean
        +processIncidentRefund(ticketId: Int, action: String) Boolean
    }

    class Admin {
        +manageMovie(data: MovieDTO) Movie
        +scheduleScreening(data: ScreeningDTO) Screening
        +cancelScreeningEmergency(screeningId: Int, reason: String) Int
        +managePricing(type: String, percentage: Int) Pricing
        +getFinancialReports(from: Date, to: Date) ReportSummary
    }

    User <|-- Customer
    User <|-- Staff
    User <|-- Admin

    %% ==========================================
    %% 2. CORE DOMAIN ENTITIES
    %% ==========================================
    class Movie {
        -Int id
        -String title
        -String slug
        -Int duration
        -String ageRating
        -Decimal rating
        -MovieStatus status
        -Decimal ticketPrice
        -Boolean isDeleted
        +getActiveScreenings() List~Screening~
        +calculateAverageRating() Decimal
        +softDelete() Void
    }

    class Screening {
        -Int id
        -Int movieId
        -String room
        -Int roomNumber
        -DateTime startTime
        -DateTime endTime
        -Decimal price
        -ScreeningStatus status
        +checkRoomConflict(room: String, start: DateTime, end: DateTime) Boolean
        +generate50Seats() List~Seat~
        +cancelScreening(reason: String) Boolean
    }

    class Seat {
        -Int id
        -Int screeningId
        -String code
        -String row
        -Int number
        -SeatType type
        -SeatStatus status
        -DateTime reservedUntil
        +holdSeat(minutes: Int) Boolean
        +releaseSeat() Void
        +markAsOccupied() Void
    }

    class Pricing {
        -Int id
        -String ticketType
        -String label
        -Int percentage
        -Decimal basePrice
        +calculatePrice(base: Decimal, type: String) Decimal
    }

    class Ticket {
        -Int id
        -Int userId
        -Int screeningId
        -Int seatId
        -Int paymentId
        -String ticketType
        -Decimal price
        -TicketStatus status
        -String cancellationReason
        -String refundStatus
        +generateQRPayload() String
        +checkIn() Boolean
        +cancelWithVoucher() Coupon
        +markPendingCashRefund(reason: String) Void
        +confirmCashRefunded(staffId: Int) Void
    }

    class Payment {
        -Int id
        -Int userId
        -Decimal amount
        -PaymentMethod paymentMethod
        -String transactionCode
        -PaymentStatus status
        -DateTime createdAt
        +calculateTotal(tickets: List~Ticket~, combos: List~OrderCombo~, coupon: Coupon) Decimal
        +markAsSuccess(transCode: String) Void
        +markAsFailed() Void
        +markAsRefunded() Void
    }

    class Coupon {
        -Int id
        -String code
        -DiscountType discountType
        -Decimal discountValue
        -Int maxUsage
        -Int usedCount
        -Date expiryDate
        +validate(orderAmount: Decimal, movieId: Int, userId: Int) Boolean
        +calculateDiscount(ticketPrices: List~Decimal~) Decimal
    }

    class Combo {
        -Int id
        -String name
        -Decimal price
        -Int stock
        -ComboStatus status
        +checkStock(qty: Int) Boolean
        +deductStock(qty: Int) Void
        +restoreStock(qty: Int) Void
    }

    class ComboReservation {
        -Int id
        -Int comboId
        -Int userId
        -Int quantity
        -String status
        -DateTime reservedUntil
        +isExpired() Boolean
        +release() Void
    }

    class OrderCombo {
        -Int id
        -Int paymentId
        -Int comboId
        -Int quantity
        -Decimal price
        -Boolean isDelivered
        -DateTime deliveredAt
        +markAsDelivered() Void
    }

    class Review {
        -Int id
        -Int userId
        -Int movieId
        -Int rating
        -String comment
        +upsertReview(rating: Int, comment: String) Review
    }

    %% ==========================================
    %% 3. SERVICE & CONTROLLER CLASSES
    %% ==========================================
    class ZaloPayService {
        <<service>>
        -String appId
        -String key1
        -String key2
        +createSandboxOrder(payment: Payment) ZaloOrderResponse
        +verifyIPNCallback(data: String, mac: String) Boolean
        +verifyReturnChecksum(params: Map) Boolean
    }

    class QRSignatureService {
        <<service>>
        -String secretKey
        +signQR(ticketId: Int, screeningId: Int, seatCode: String) String
        +verifyQR(payload: String, signature: String) Boolean
    }

    class SeatExpirationService {
        <<service>>
        -Int timeoutMinutes
        +cleanupExpiredLocks(screeningId: Int) Int
        +atomicReserveSeats(screeningId: Int, seatIds: List~Int~) Boolean
    }

    class BookingAndPaymentController {
        <<controller>>
        +POST_reserveSeats()
        +POST_createBooking()
        +POST_createZaloPay()
        +POST_zaloPayCallback()
        +GET_zaloPayReturn()
    }

    class StaffOperationsController {
        <<controller>>
        +POST_posSell()
        +POST_checkInQR()
        +POST_fulfillCombo()
        +POST_cancelIncident()
        +POST_confirmCashRefund()
    }

    %% ==========================================
    %% 4. RELATIONSHIPS
    %% ==========================================
    Movie "1" o-- "0..*" Screening : có lịch chiếu
    Screening "1" *-- "50" Seat : sở hữu 50 ghế (A1..E10)
    Screening "0..*" ..> "1" Pricing : áp dụng tỷ lệ giá
    User "1" o-- "0..*" Ticket : sở hữu
    User "1" o-- "0..*" Payment : thanh toán
    User "1" o-- "0..*" Review : đánh giá
    Movie "1" o-- "0..*" Review : nhận đánh giá
    Screening "1" o-- "0..*" Ticket : phát hành
    Seat "1" o-- "0..*" Ticket : gắn vị trí ghế
    Payment "1" *-- "1..*" Ticket : chi trả cho
    Payment "1" *-- "0..*" OrderCombo : bao gồm
    Payment "0..*" o-- "0..1" Coupon : áp dụng mã
    Combo "1" *-- "0..*" ComboReservation : khóa tạm 10p
    Combo "1" o-- "0..*" OrderCombo : định nghĩa món

    BookingAndPaymentController ..> ZaloPayService : uses
    BookingAndPaymentController ..> SeatExpirationService : uses
    BookingAndPaymentController ..> Payment : manages
    StaffOperationsController ..> QRSignatureService : uses
    StaffOperationsController ..> Ticket : manages
    StaffOperationsController ..> OrderCombo : manages
```

---

## 7. PHỤ LỤC & MA TRẬN TRUY XUẤT YÊU CẦU TOÀN DIỆN (APPENDIX & TRACEABILITY MATRIX)

### 7.1 Ma trận truy xuất Nghiệp vụ - Chức năng - CSDL (BR to FR to DB Traceability Matrix)

Bảng dưới đây ánh xạ xuyên suốt từ 10 Quy tắc nghiệp vụ cốt lõi (`BR-01` đến `BR-10`) sang các Yêu cầu chức năng/phi chức năng (`FR`/`NFR`), Bảng cơ sở dữ liệu (`PostgreSQL Tables`), API Endpoints và các Sơ đồ UML tương ứng:

| Mã nghiệp vụ (BR ID) | Nội dung quy tắc nghiệp vụ cốt lõi | Yêu cầu chức năng / phi chức năng đáp ứng (FR / NFR ID) | Bảng CSDL liên quan (Database Tables) | Endpoint API thực thi chính | Sơ đồ UML đặc tả liên quan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BR-01** | Quy mô phòng chiếu cố định **50 ghế Standard (`A1` đến `E10`)** cho mỗi phòng trong 5 phòng chiếu; khóa ghế tạm thời **10 phút** chống đặt trùng bằng Transaction nguyên tử và `Partial Unique Index`. | `FR-BOK-01`, `FR-BOK-02`, `NFR-SAFE-01` | `screenings`, `seats`, `tickets` | `POST /api/seats/reserve`<br>`POST /api/bookings` | `05_dat_ve_combo_online.puml`<br>`06_chon_ghe_va_giu_cho.puml`<br>`state_seat.puml` |
| **BR-02** | Phân loại giá vé theo đối tượng: **Vé Người lớn (`100%`)** và **Vé Trẻ em (`50%`)**. Tự động khóa chọn Vé Trẻ em đối với phim gắn nhãn **`T18`**. | `FR-BOK-03`, `FR-ADM-01`, `FR-POS-01` | `movies`, `pricing`, `tickets` | `GET /api/pricing`<br>`POST /api/bookings`<br>`POST /api/admin/movies` | `07_chon_loai_ve.puml`<br>`36_kiem_tra_do_phu_hop_suat_chieu.puml` |
| **BR-03** | Khách hàng chủ động hủy vé online: Bắt buộc **trước giờ chiếu tối thiểu 2 tiếng (`>= 2h`)**, không hoàn tiền mặt, đền bù tự động bằng **Voucher giảm `50%` (`COMP50_`, hạn 30 ngày)**; giữ nguyên đơn combo. | `FR-CAN-01`, `FR-VOU-01`, `FR-CAN-03` | `tickets`, `seats`, `coupons` | `POST /api/tickets/[id]/cancel` | `10_khach_huy_ve.puml`<br>`17_khach_huy_ve_nhan_voucher.puml`<br>`state_ticket.puml` |
| **BR-04** | Hủy vé/suất chiếu do **sự cố kỹ thuật của rạp** (mất điện, hỏng máy chiếu): Không giới hạn 2 tiếng, ghi nhận công nợ **`PENDING_CASH_REFUND` (`100%`)**, giải phóng ghế, hoàn kho combo chưa nhận và chi trả tiền mặt tại quầy trong **30 ngày** (`REFUNDED_CASH`). | `FR-CAN-02`, `FR-ADM-04`, `NFR-AUD-01` | `tickets`, `payments`, `seats`, `combos`, `order_combos`, `audit_logs` | `POST /api/staff/tickets/[id]/cancel`<br>`POST /api/staff/tickets/[id]/refund`<br>`POST /api/admin/screenings/[id]/cancel` | `11_rap_huy_ve_hoan_tien.puml`<br>`15_huy_suat_chieu_khan_cap.puml`<br>`18_huy_ve_su_co_hoan_tien_mat.puml` |
| **BR-05** | Quy trình **giao nhận bắp nước (`OrderCombo`) độc lập hoàn toàn** với việc soát vé vào phòng chiếu; kiểm soát chặt trạng thái `Chưa nhận` -> `Đã nhận` để chống giao trùng lặp. | `FR-CHK-02`, `FR-POS-02`, `FR-POS-03` | `combos`, `combo_reservations`, `order_combos` | `GET /api/staff/combos`<br>`POST /api/staff/combos/fulfill`<br>`POST /api/staff/combos/sell` | `07_ban_combo_tai_quay.puml`<br>`09_giao_nhan_combo.puml`<br>`15_giao_nhan_combo_online.puml`<br>`state_combo.puml` |
| **BR-06** | Đánh giá và bình luận phim (1-5 sao): Mọi tài khoản **đã đăng nhập (`Authenticated`)** đều được phép gửi đánh giá mà không bắt buộc phải có vé đã mua; mỗi user tối đa 1 đánh giá/phim (cho phép cập nhật lại). | `FR-REV-01`, `FR-REV-02` | `reviews`, `movies`, `users` | `GET /api/reviews`<br>`POST /api/reviews`<br>`DELETE /api/admin/reviews/[id]` | `04_danh_gia_phim.puml`<br>`19_khach_danh_gia_phim.puml`<br>`20_admin_quan_ly_danh_gia.puml` |
| **BR-07** | Bảo toàn dữ liệu lịch sử phim: Các bộ phim đã phát sinh suất chiếu hoặc vé bán **tuyệt đối không được xóa vật lý (Hard Delete)**, chỉ được chuyển trạng thái ngừng chiếu (`ENDED`) và bật cờ xóa mềm (`isDeleted = true`). | `FR-ADM-02`, `NFR-INT-01` | `movies`, `screenings`, `tickets` | `DELETE /api/admin/movies/[id]`<br>`PUT /api/admin/movies/[id]` | `13_quan_ly_phim.puml`<br>`24_ngung_chieu_phim.puml`<br>`state_movie.puml` |
| **BR-08** | Chống trùng lịch phòng chiếu: Khi tạo hoặc sửa suất chiếu trong cùng một phòng (`Cinema 01..05`), khoảng thời gian `[startTime, endTime + 15 phút dọn phòng]` không được giao nhau với bất kỳ suất chiếu đang hoạt động nào. | `FR-ADM-03` | `screenings`, `movies`, `seats` | `POST /api/admin/screenings`<br>`PUT /api/admin/screenings/[id]` | `14_quan_ly_suat_chieu.puml`<br>`35_them_suat_chieu.puml`<br>`37_sua_suat_chieu.puml`<br>`state_screening.puml` |
| **BR-09** | Bảo mật vé điện tử và thanh toán trực tuyến: Mã QR vé xem phim được ký số bằng **`HMAC-SHA256`** chống làm giả; cổng **ZaloPay Sandbox v2 (`app_id: 2553`)** xác thực hai chiều qua `ZALOPAY_KEY1` (tạo đơn) và `ZALOPAY_KEY2` (kiểm tra IPN Callback). | `FR-BOK-05`, `FR-CHK-01`, `NFR-SEC-02`, `NFR-SEC-03` | `payments`, `tickets` | `POST /api/payments/zalopay/create`<br>`POST /api/payments/zalopay/callback`<br>`GET /api/payments/zalopay/return`<br>`POST /api/staff/checkin` | `08_soat_ve.puml`<br>`10_thanh_toan_online.puml`<br>`11_thanh_toan_vnpay_momo.puml`<br>`14_soat_ve_vao_rap.puml`<br>`state_payment.puml` |
| **BR-10** | Minh bạch kế toán & Đối soát doanh thu: Báo cáo tài chính phải bóc tách độc lập 4 khoản mục: **Doanh thu vé thực thu (`Net Ticket Revenue`)**, **Doanh thu bắp nước (`Combo Revenue`)**, **Công nợ tiền mặt chờ hoàn (`Pending Refund`)** và **Tiền mặt đã hoàn thực tế (`Actual Refunded`)**. | `FR-REP-01`, `FR-REP-02`, `FR-REP-03` | `payments`, `tickets`, `order_combos`, `audit_logs` | `GET /api/admin/reports` | `17_bao_cao_doanh_thu.puml`<br>`38_bao_cao_doanh_thu_tai_chinh.puml` |

---

### 7.2 Danh mục ánh xạ toàn bộ 62 Sơ đồ UML của dự án (UML Diagram Inventory)

Toàn bộ kho mã nguồn sơ đồ thiết kế hệ thống của dự án Lumi Cinema gồm đúng **62 sơ đồ chuẩn PlantUML (`.puml`, `.svg`, `.png`)** được phân loại thành 4 nhóm thư mục:
- **17 Sơ đồ Hoạt động (`Activity Diagrams`)** tại thư mục `PlantUML_Activity_Diagrams/`
- **38 Sơ đồ Tuần tự (`Sequence Diagrams`)** tại thư mục `Sequence/`
- **06 Sơ đồ Trạng thái (`State Machine Diagrams`)** tại thư mục `PlantUML_State_Diagrams/`
- **01 Sơ đồ Lớp tổng thể (`Master Class Diagram`)** tại thư mục `PlantUML_Class_Diagram/`

#### 7.2.1 Nhóm 1: Danh mục 17 Sơ đồ Hoạt động (`PlantUML_Activity_Diagrams/` - 17 Files)

| STT | Tên file sơ đồ (`.puml` / `.svg` / `.png`) | Tên quy trình nghiệp vụ (Activity Diagram Title) | Phân hệ SRS ánh xạ | Mã yêu cầu (FR / BR) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `01_dang_nhap.puml` | Luồng hoạt động Đăng nhập hệ thống & Phân quyền RBAC | Mục 4.1 (Xác thực & Phân quyền) | `FR-AUT-02`, `FR-AUT-03` |
| 2 | `02_dang_ky.puml` | Luồng hoạt động Đăng ký tài khoản Khách hàng mới | Mục 4.1 (Xác thực & Phân quyền) | `FR-AUT-01` |
| 3 | `03_dang_xuat.puml` | Luồng hoạt động Đăng xuất & Hủy phiên làm việc | Mục 4.1 (Xác thực & Phân quyền) | `FR-AUT-02` |
| 4 | `04_danh_gia_phim.puml` | Luồng hoạt động Đánh giá & Bình luận phim (1-5 sao) | Mục 4.2 (Đánh giá & Bình luận) | `FR-REV-01`, `BR-06` |
| 5 | `05_dat_ve_combo_online.puml` | Luồng hoạt động Đặt vé, Chọn ghế, Mua Combo & Thanh toán Online | Mục 4.3 (Đặt vé & Mua Combo Online) | `FR-BOK-01` -> `FR-BOK-05`, `BR-01`, `BR-02` |
| 6 | `06_ban_ve_tai_quay.puml` | Luồng hoạt động Bán vé kèm Combo trực tiếp tại quầy POS | Mục 4.4 (Bán vé & Combo tại quầy POS) | `FR-POS-01`, `FR-POS-02` |
| 7 | `07_ban_combo_tai_quay.puml` | Luồng hoạt động Bán lẻ bắp nước độc lập tại quầy POS | Mục 4.4 (Bán vé & Combo tại quầy POS) | `FR-POS-03`, `BR-05` |
| 8 | `08_soat_ve.puml` | Luồng hoạt động Quét mã QR & Soát vé vào phòng chiếu | Mục 4.5 (Soát vé & Giao nhận Combo) | `FR-CHK-01`, `BR-09` |
| 9 | `09_giao_nhan_combo.puml` | Luồng hoạt động Kiểm tra mã đơn & Bàn giao bắp nước tại quầy | Mục 4.5 & Mục 6.4 (Giao nhận Combo) | `FR-CHK-02`, `BR-05` |
| 10 | `10_khach_huy_ve.puml` | Luồng hoạt động Khách hàng tự hủy vé online (trước >= 2h, nhận Voucher 50%) | Mục 4.6 (Hủy vé & Đền bù) | `FR-CAN-01`, `BR-03` |
| 11 | `11_rap_huy_ve_hoan_tien.puml` | Luồng hoạt động Hủy vé do sự cố rạp & Đối soát hoàn tiền mặt 100% | Mục 4.6 & Mục 6.3 (Hoàn tiền sự cố) | `FR-CAN-02`, `BR-04` |
| 12 | `12_quan_ly_voucher.puml` | Luồng hoạt động Quản lý chiến dịch mã giảm giá & Voucher | Mục 4.7 (Quản lý Voucher) | `FR-VOU-01`, `FR-VOU-02` |
| 13 | `13_quan_ly_phim.puml` | Luồng hoạt động Thêm, Sửa, Ngừng chiếu (Soft Delete) Phim | Mục 4.8 (Quản trị Vận hành Rạp) | `FR-ADM-01`, `FR-ADM-02`, `BR-07` |
| 14 | `14_quan_ly_suat_chieu.puml` | Luồng hoạt động Lên lịch suất chiếu & Kiểm tra chống trùng phòng | Mục 4.8 (Quản trị Vận hành Rạp) | `FR-ADM-03`, `BR-08` |
| 15 | `15_huy_suat_chieu_khan_cap.puml` | Luồng hoạt động Hủy suất chiếu khẩn cấp do sự cố kỹ thuật | Mục 4.8 (Quản trị Vận hành Rạp) | `FR-ADM-04`, `BR-04` |
| 16 | `16_quan_ly_combo.puml` | Luồng hoạt động Quản lý danh mục & Cập nhật tồn kho Combo | Mục 4.8 (Quản trị Vận hành Rạp) | `FR-ADM-05` |
| 17 | `17_bao_cao_doanh_thu.puml` | Luồng hoạt động Tổng hợp Báo cáo doanh thu & Đối soát công nợ hoàn tiền | Mục 4.9 (Báo cáo & Đối soát Tài chính) | `FR-REP-01` -> `FR-REP-03`, `BR-10` |

#### 7.2.2 Nhóm 2: Danh mục 38 Sơ đồ Tuần tự (`Sequence/` - 38 Files)

| STT | Tên file sơ đồ (`.puml` / `.svg` / `.png`) | Tên kịch bản tương tác (Sequence Diagram Title) | Phân hệ SRS ánh xạ | Endpoint API / Thành phần tương tác |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `01_dang_ky_tai_khoan.puml` | Tuần tự Đăng ký tài khoản Khách hàng | Mục 4.1 | `POST /api/auth/signup` |
| 2 | `02_dang_nhap_he_thong.puml` | Tuần tự Đăng nhập & Khởi tạo JWT Session | Mục 4.1 | `POST /api/auth/[...nextauth]` |
| 3 | `03_dang_xuat_he_thong.puml` | Tuần tự Đăng xuất khỏi hệ thống | Mục 4.1 | `NextAuth signOut()` |
| 4 | `04_mua_ve_va_dat_combo_online_tong_quan.puml` | Tuần tự Tổng quan luồng Mua vé & Đặt Combo Online | Mục 4.3 & Mục 6.2 | `Seats API` -> `Bookings API` -> `ZaloPay API` |
| 5 | `05_xem_phim_va_suat_chieu.puml` | Tuần tự Tra cứu danh sách phim & Lịch chiếu theo ngày | Mục 4.3 | `GET /api/movies`, `GET /api/screenings` |
| 6 | `06_chon_ghe_va_giu_cho.puml` | Tuần tự Chọn ghế trên sơ đồ & Khóa ghế tạm thời 10 phút | Mục 4.3 & Mục 6.2 | `POST /api/seats/reserve` (`BR-01`) |
| 7 | `07_chon_loai_ve.puml` | Tuần tự Chọn loại vé (Người lớn 100% / Trẻ em 50%) & Kiểm tra nhãn tuổi `T18` | Mục 4.3 | `GET /api/pricing` (`BR-02`) |
| 8 | `08_them_combo_vao_don_hang.puml` | Tuần tự Chọn gói bắp nước & Giữ chỗ tồn kho `ComboReservation` 10 phút | Mục 4.3 | `GET /api/combos`, `POST /api/bookings` |
| 9 | `09_ap_dung_voucher.puml` | Tuần tự Kiểm tra tính hợp lệ & Tính mức giảm giá của Voucher | Mục 4.3 & Mục 4.7 | `POST /api/coupons/validate` |
| 10 | `10_thanh_toan_online.puml` | Tuần tự Khởi tạo đơn hàng & Xử lý giao dịch thanh toán trực tuyến | Mục 4.3 & Mục 6.2 | `POST /api/bookings` |
| 11 | `11_thanh_toan_vnpay_momo.puml` | Tuần tự Tích hợp cổng thanh toán trực tuyến (Đã nâng cấp lên ZaloPay Sandbox v2) | Mục 3.3, 4.3 & 6.2 | `POST /api/payments/zalopay/create`, `callback`, `return` |
| 12 | `12_ban_ve_tai_quay_pos.puml` | Tuần tự Nhân viên bán vé trực tiếp tại quầy POS (Tiền mặt / QR) | Mục 4.4 | `POST /api/staff/pos` |
| 13 | `13_ban_combo_tai_quay_pos.puml` | Tuần tự Nhân viên bán lẻ bắp nước độc lập tại quầy POS | Mục 4.4 | `POST /api/staff/combos/sell` |
| 14 | `14_soat_ve_vao_rap.puml` | Tuần tự Quét mã QR, Xác thực chữ ký `HMAC-SHA256` & Check-in vào rạp | Mục 4.5 | `POST /api/staff/checkin` (`BR-09`) |
| 15 | `15_giao_nhan_combo_online.puml` | Tuần tự Tra cứu đơn hàng & Xác nhận bàn giao bắp nước tại quầy | Mục 4.5 & Mục 6.4 | `GET /api/staff/combos`, `POST /api/staff/combos/fulfill` |
| 16 | `16_tra_cuu_quan_ly_ve.puml` | Tuần tự Tra cứu lịch sử vé & Quản lý thông tin vé | Mục 4.5 & Mục 4.6 | `GET /api/tickets`, `GET /api/staff/tickets` |
| 17 | `17_khach_huy_ve_nhan_voucher.puml` | Tuần tự Khách tự hủy vé trước >= 2h & Nhận mã Voucher bồi hoàn 50% (`COMP50_`) | Mục 4.6 | `POST /api/tickets/[id]/cancel` (`BR-03`) |
| 18 | `18_huy_ve_su_co_hoan_tien_mat.puml` | Tuần tự Hủy vé do sự cố rạp (`PENDING_CASH_REFUND`) & Chi tiền mặt (`REFUNDED_CASH`) | Mục 4.6 & Mục 6.3 | `POST /api/staff/tickets/[id]/cancel` & `refund` (`BR-04`) |
| 19 | `19_khach_danh_gia_phim.puml` | Tuần tự Khách hàng gửi/cập nhật đánh giá sao & bình luận phim | Mục 4.2 | `POST /api/reviews` (`BR-06`) |
| 20 | `20_admin_quan_ly_danh_gia.puml` | Tuần tự Quản trị viên kiểm duyệt & xóa đánh giá vi phạm | Mục 4.2 | `DELETE /api/admin/reviews/[id]` |
| 21 | `21_quan_ly_phim_tong_quan.puml` | Tuần tự Tổng quan phân hệ Quản lý danh mục Phim | Mục 4.8 | `GET /api/admin/movies` |
| 22 | `22_them_phim.puml` | Tuần tự Admin thêm bộ phim mới & Thiết lập nhãn độ tuổi | Mục 4.8 | `POST /api/admin/movies` |
| 23 | `23_sua_phim.puml` | Tuần tự Admin cập nhật thông tin chi tiết phim | Mục 4.8 | `PUT /api/admin/movies/[id]` |
| 24 | `24_ngung_chieu_phim.puml` | Tuần tự Admin ngừng chiếu phim / Xóa mềm (`isDeleted = true`) | Mục 4.8 | `DELETE /api/admin/movies/[id]` (`BR-07`) |
| 25 | `25_quan_ly_combo_tong_quan.puml` | Tuần tự Tổng quan phân hệ Quản lý Combo bắp nước | Mục 4.8 | `GET /api/admin/combos` |
| 26 | `26_them_combo_moi.puml` | Tuần tự Admin thêm gói Combo bắp nước mới | Mục 4.8 | `POST /api/admin/combos` |
| 27 | `27_sua_combo.puml` | Tuần tự Admin chỉnh sửa giá & thông tin gói Combo | Mục 4.8 | `PUT /api/admin/combos/[id]` |
| 28 | `28_ngung_ban_combo.puml` | Tuần tự Admin tạm ngừng kinh doanh gói Combo (`INACTIVE`) | Mục 4.8 | `PATCH /api/admin/combos/[id]/status` |
| 29 | `29_cap_nhat_ton_kho_combo.puml` | Tuần tự Admin nhập thêm hàng & Cập nhật số lượng tồn kho `stock` | Mục 4.8 | `PATCH /api/admin/combos/[id]/stock` |
| 30 | `30_quan_ly_voucher_tong_quan.puml` | Tuần tự Tổng quan phân hệ Quản lý chiến dịch Voucher | Mục 4.7 | `GET /api/admin/coupons` |
| 31 | `31_them_voucher.puml` | Tuần tự Admin phát hành mã giảm giá mới (`Percentage` / `FixedAmount`) | Mục 4.7 | `POST /api/admin/coupons` |
| 32 | `32_sua_voucher.puml` | Tuần tự Admin cập nhật hạn dùng & số lượt sử dụng Voucher | Mục 4.7 | `PUT /api/admin/coupons/[id]` |
| 33 | `33_ngung_su_dung_voucher.puml` | Tuần tự Admin vô hiệu hóa / đóng chiến dịch Voucher sớm | Mục 4.7 | `DELETE /api/admin/coupons/[id]` |
| 34 | `34_quan_ly_suat_chieu_tong_quan.puml` | Tuần tự Tổng quan phân hệ Quản lý lịch chiếu & Hủy suất chiếu khẩn cấp | Mục 4.8 | `GET /api/admin/screenings`, `POST .../cancel` |
| 35 | `35_them_suat_chieu.puml` | Tuần tự Admin tạo suất chiếu mới & Tự động sinh 50 ghế `A1..E10` | Mục 4.8 | `POST /api/admin/screenings` (`BR-01`, `BR-08`) |
| 36 | `36_kiem_tra_do_phu_hop_suat_chieu.puml` | Tuần tự Kiểm tra chống trùng lịch phòng chiếu & Ràng buộc độ tuổi | Mục 4.8 | `checkRoomConflict()` (`BR-02`, `BR-08`) |
| 37 | `37_sua_suat_chieu.puml` | Tuần tự Admin cập nhật giờ chiếu / giá cơ bản của suất chiếu | Mục 4.8 | `PUT /api/admin/screenings/[id]` |
| 38 | `38_bao_cao_doanh_thu_tai_chinh.puml` | Tuần tự Truy vấn Báo cáo doanh thu thuần, doanh thu Combo & Đối soát hoàn tiền | Mục 4.9 | `GET /api/admin/reports` (`BR-10`) |

#### 7.2.3 Nhóm 3: Danh mục 06 Sơ đồ Trạng thái (`PlantUML_State_Diagrams/` - 06 Files)

| STT | Tên file sơ đồ (`.puml` / `.png`) | Thực thể mô hình hóa (Target Entity) | Các trạng thái trong vòng đời (States) | Mục đặc tả trong SRS |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `state_seat.puml` | Ghế ngồi theo suất chiếu (`Seat`) | `EMPTY` <-> `RESERVED` (10 phút) -> `OCCUPIED` (-> `EMPTY` khi hủy vé) | Mục 6.6.1 (`BR-01`) |
| 2 | `state_ticket.puml` | Vé xem phim & Hoàn tiền (`Ticket` & `RefundStatus`) | `PENDING_PAYMENT` -> `Valid` -> `Used` \| `Cancelled` (`NONE` / `PENDING_CASH_REFUND` -> `REFUNDED_CASH`) | Mục 6.6.2 (`BR-03`, `BR-04`) |
| 3 | `state_payment.puml` | Giao dịch Thanh toán (`Payment`) | `Pending` -> `Success` (Completed) \| `Failed` \| `Refunded` | Mục 6.6.3 (`BR-09`, `BR-10`) |
| 4 | `state_combo.puml` | Đơn hàng Bắp nước (`ComboReservation` & `OrderCombo`) | `RESERVED` -> `CONFIRMED` (`PENDING_PICKUP` / `Chưa nhận` -> `PICKED_UP` / `Đã nhận`) \| `CANCELLED` | Mục 6.6.4 (`BR-05`) |
| 5 | `state_screening.puml` | Suất chiếu (`Screening`) | `UPCOMING` -> `SHOWING` (`ONGOING`) -> `ENDED` \| `CANCELLED` (Hủy khẩn cấp) | Mục 6.6.5 (`BR-04`, `BR-08`) |
| 6 | `state_movie.puml` | Phim (`Movie`) | `UPCOMING` -> `SHOWING` -> `ENDED` (kèm cờ xóa mềm `isDeleted = true`) | Mục 6.6.6 (`BR-07`) |

#### 7.2.4 Nhóm 4: Danh mục 01 Sơ đồ Lớp tổng thể (`PlantUML_Class_Diagram/` - 01 File)

| STT | Tên file sơ đồ (`.puml` / `.svg` / `.png`) | Tên sơ đồ (Class Diagram Title) | Nội dung kiến trúc bao phủ | Mục đặc tả trong SRS |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `class_diagram_lumicinema.puml` | Master Domain Model Class Diagram - Hệ thống Rạp chiếu phim Lumi Cinema | Mô hình hóa toàn bộ phân hệ Người dùng kế thừa RBAC (`User`, `Customer`, `Staff`, `Admin`), 11 lớp Thực thể (`Movie`, `Screening`, `Seat`, `Pricing`, `Ticket`, `Payment`, `Coupon`, `Combo`, `OrderCombo`, `ComboReservation`, `Review`), 10 kiểu `Enum` và các mối quan hệ hướng đối tượng (`Generalization`, `Composition`, `Aggregation`, `Dependency`). | Mục 6.5 & Mục 6.7 |

---
*(Hết tài liệu đặc tả Yêu cầu Phần mềm SRS Phiên bản 2.0 - Bản quyền thuộc về Nhóm phát triển Dự án Lumi Cinema)*
