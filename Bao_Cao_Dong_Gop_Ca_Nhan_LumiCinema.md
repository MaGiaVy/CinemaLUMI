# BÁO CÁO TỔNG HỢP ĐÓNG GÓP CÁ NHÂN & THÁCH THỨC KỸ THUẬT
## HỆ THỐNG QUẢN LÝ VÀ ĐẶT VÉ RẠP CHIẾU PHIM LUMICINEMA

---

* **Dự án:** Hệ thống Quản lý và Đặt vé Rạp chiếu phim LumiCinema
* **Kiến trúc công nghệ:** Next.js (App Router), PostgreSQL, Prisma ORM, NextAuth (JWT Session), Tailwind CSS, PlantUML.
* **Người thực hiện:** Thành viên phụ trách Kiến trúc Hệ thống, Cơ sở Dữ liệu & Full-stack Development.

---

## MỤC LỤC TỔNG QUAN

1. [Tổng quan Phạm vi Phụ trách](#1-tổng-quan-phạm-vi-phụ-trách)
2. [Chi tiết Đóng góp & Khó khăn theo từng Mảng Công việc](#2-chi-tiết-đóng-góp--khó-khăn-theo-từng-mảng-công-việc)
   * [2.1. Use Case Tổng quát & Rà soát Toàn bộ Use Case](#21-use-case-tổng-quát--rà-soát-toàn-bộ-use-case)
   * [2.2. Sơ đồ Activity & Sequence: Nhóm Xác thực (Đăng ký - Đăng nhập - Đăng xuất)](#22-sơ-đồ-activity--sequence-nhóm-xác-thực-đăng-ký---đăng-nhập---đăng-xuất)
   * [2.3. Sơ đồ Activity & Sequence: Báo cáo Thống kê & Đối soát Tài chính](#23-sơ-đồ-activity--sequence-báo-cáo-thống-kê--đối-soát-tài-chính)
   * [2.4. Thiết kế & Hiện thực hóa Cơ sở Dữ liệu (Database Design & Prisma ORM)](#24-thiết-kế--hiện-thực-hóa-cơ-sở-dữ-liệu-database-design--prisma-orm)
   * [2.5. Xây dựng Ứng dụng Full-stack (Next.js App Development)](#25-xây-dựng-ứng-dụng-full-stack-nextjs-app-development)
   * [2.6. Thiết kế Sơ đồ Lớp Toàn hệ thống (Class Diagram)](#26-thiết-kế-sơ-đồ-lớp-toàn-hệ-thống-class-diagram)
3. [Đặc tả Chi tiết 12 Lớp Thực thể trong Class Diagram](#3-đặc-tả-chi-tiết-12-lớp-thực-thể-trong-class-diagram)
4. [Kịch bản Trả lời Phỏng vấn Bảo vệ Đồ án (Q&A Defense)](#4-kịch-bản-trả-lời-phỏng-vấn-bảo-vệ-đồ-án-qa-defense)
5. [Bảng Đánh giá & Tự chấm điểm Mức độ Hoàn thành](#5-bảng-đánh-giá--tự-chấm-điểm-mức-độ-hoàn-thành)

---

## 1. TỔNG QUAN PHẠM VI PHỤ TRÁCH

Trong đồ án LumiCinema, cá nhân đảm nhiệm vai trò hạt nhân bao quát toàn diện từ **Mô hình hóa Nghiệp vụ $\rightarrow$ Thiết kế Kiến trúc $\rightarrow$ Thiết kế CSDL $\rightarrow$ Lập trình Ứng dụng $\rightarrow$ Kiểm chuẩn Đóng gói Tài liệu**:

| Mảng công việc | Trọng tâm đảm nhiệm | Kết quả chuyển giao |
| :--- | :--- | :--- |
| **Use Case System** | Xây dựng Use Case tổng quát; Rà soát tính đầy đủ toàn bộ Use Case hệ thống. | Sơ đồ Use Case tổng quan 7 phân hệ; Ma trận truy vết SRS. |
| **UML Modeling (Auth)** | Thiết kế Activity & Sequence Diagram cho Đăng ký, Đăng nhập, Đăng xuất. | 3 sơ đồ Activity + 3 sơ đồ Sequence chuẩn UML 2.5 có đủ Lifeline. |
| **UML Modeling (Report)** | Thiết kế Activity & Sequence Diagram cho Báo cáo Thống kê & Đối soát. | 1 sơ đồ Activity + 1 sơ đồ Sequence xử lý đối soát công nợ (`BR-10`). |
| **Database Architecture** | Thiết kế ERD, xây dựng Schema Prisma, Migration PostgreSQL, Indexing, ACID. | 11 models, 10 enums, quan hệ toàn vẹn, xử lý giữ ghế chống xung đột. |
| **App Development** | Xây dựng Full-stack Next.js: Middleware RBAC, Auth API, Dashboard Admin. | Ứng dụng Next.js hoàn chỉnh; Tự động hóa xuất tài liệu Word 55 sơ đồ. |
| **Class Diagram** | Thiết kế bao quát toàn bộ Sơ đồ Lớp (Class Diagram) của hệ thống rạp phim. | 12 Entity Classes + Lớp kế thừa người dùng + Service Classes. |

---

## 2. CHI TIẾT ĐÓNG GÓP & KHÓ KHĂN THEO TỪNG MẢNG CÔNG VIỆC

### 2.1. Use Case Tổng quát & Rà soát Toàn bộ Use Case

#### 🎯 Đóng góp chi tiết:
* **Xác định System Boundary và 3 Actor phân quyền độc lập:**
  * 👤 **Khách hàng (Customer):** Tra cứu phim/suất chiếu, chọn ghế, đặt combo, áp mã giảm giá, thanh toán trực tuyến, tự hủy vé nhận voucher bồi hoàn 50%, gửi đánh giá phim.
  * 👤 **Nhân viên quầy (Staff):** Đăng nhập ca làm, bán vé tại quầy POS, bán combo bắp nước trực tiếp, quét mã QR soát vé vào rạp, giao nhận combo bắp nước đã đặt online, tra cứu thông tin vé.
  * 👤 **Quản trị viên (Admin):** Quản lý danh mục phim, lịch chiếu/suất chiếu, cấu hình giá vé, quản lý combo & tồn kho, quản lý voucher, kiểm duyệt đánh giá, tra cứu báo cáo doanh thu & đối soát công nợ hoàn tiền.
* **Xây dựng Sơ đồ Use Case Tổng quát:** Thể hiện đầy đủ 7 phân hệ nghiệp vụ, phân định chuẩn mực các mối quan hệ:
  * `<<include>>`: Luồng *Đặt vé* bắt buộc bao gồm *Chọn ghế* và *Thanh toán*; Luồng *Bán vé quầy* bắt buộc bao gồm *Kiểm tra trạng thái ghế*.
  * `<<extend>>`: Luồng *Mua vé* mở rộng thêm *Đặt combo bắp nước*, *Áp dụng voucher*; Luồng *Soát vé* mở rộng *Cảnh báo vé không hợp lệ/vé đã quét*.
* **Rà soát ma trận truy vết (Traceability Matrix):** Đối chiếu từng Use Case với tài liệu SRS; bổ sung các Use Case quầy thường bị thiếu: *Bán combo tại quầy POS (`FR-POS-03`)*, *Giao nhận combo online tại quầy (`FR-CHK-02`)*, *Hủy vé sự cố rạp bồi hoàn 100% tiền mặt (`FR-CAN-02`)*.

#### ⚠️ Khó khăn & Thách thức kỹ thuật:
* **Ranh giới phân quyền chồng lấn:** Dễ nhầm lẫn giữa phạm vi quyền hạn của Staff và Admin (ví dụ: Staff chỉ tra cứu vé trong phạm vi rạp/ca trực để hỗ trợ khách; Admin có quyền can thiệp hủy vé sự cố và xuất báo cáo tài chính toàn rạp).
* **Kiểm soát độ mịn (Granularity):** Cân bằng giữa mức độ bao quát tổng thể và mức độ chi tiết kỹ thuật để các thành viên khác nhìn vào là vẽ được Sequence và lập trình được ngay.

---

### 2.2. Sơ đồ Activity & Sequence: Nhóm Xác thực (Đăng ký - Đăng nhập - Đăng xuất)

#### 🎯 Đóng góp chi tiết:
* **Đăng ký tài khoản (Sign Up):**
  * Mô hình hóa luồng kiểm tra dữ liệu đầu vào bằng Zod Schema (định dạng email RFC 5322, mật khẩu $\ge$ 6 ký tự).
  * Xử lý mã lỗi HTTP chuẩn: Email đã tồn tại trả về `409 Conflict`, sai định dạng trả về `400 Bad Request`.
  * Đưa cơ chế băm mật khẩu bảo mật **Bcrypt với Salt rounds = 12** vào sơ đồ theo chuẩn `NFR-SEC-01`.
* **Đăng nhập & Phân quyền điều hướng (Login & RBAC):**
  * Mô hình hóa cơ chế xác thực danh tính tích hợp **NextAuth.js (JWT Session 24h)**.
  * Phân nhánh điều hướng giao diện tự động theo Role: `CUSTOMER` về Trang chủ (`/`), `STAFF` về POS quầy vé (`/staff/pos`), `ADMIN` về Bảng điều khiển (`/admin/dashboard`).
* **Đăng xuất (Logout):**
  * Mô hình hóa việc thu hồi session/cookie và ghi nhận nhật ký hệ thống (**Audit Trail** theo `NFR-INT-02`).
* **Chuẩn hóa kỹ thuật UML:**
  * Activity Diagram: Thiết kế đầy đủ các làn bơi nghiệp vụ (**Swimlanes**): Khách hàng, Giao diện Next.js, Next.js App Router API, Prisma ORM, PostgreSQL.
  * Sequence Diagram: Thiết kế đầy đủ thanh kích hoạt vòng đời (**Lifeline Activation Bars**), kiểm soát đóng mở `activate` / `deactivate` chuẩn xác, không để tình trạng lifeline đứt nét nhàn rỗi.

#### ⚠️ Khó khăn & Thách thức kỹ thuật:
* **Mô hình hóa cơ chế JWT Stateless Session:** Thể hiện rõ việc Client gửi cookie ngầm định, Server verify chữ ký số của token mà không cần truy vấn DB liên tục, đảm bảo tính bảo mật và hiệu năng.
* **Cân bằng luồng phân nhánh điều hướng:** Sắp xếp các khối `alt/else` sao cho luồng xử lý lỗi (sai mật khẩu, tài khoản không tồn tại, truy cập trái phép) rõ ràng mà không làm rối mắt người đọc.

---

### 2.3. Sơ đồ Activity & Sequence: Báo cáo Thống kê & Đối soát Tài chính

#### 🎯 Đóng góp chi tiết:
* **Báo cáo Doanh thu Đa chiều (`FR-REP-01`):**
  * Thiết kế luồng lọc tham số theo thời gian (Hôm nay, 7 ngày qua, Tháng này, hoặc khoảng ngày tùy chọn $[FromDate, ToDate]$).
  * Bóc tách doanh thu thành 3 nguồn độc lập: **Doanh thu Vé xem phim**, **Doanh thu Combo bắp nước**, và **Doanh thu Tổng hợp**.
  * Phân loại dữ liệu theo Tựa phim (Top phim ăn khách), Phòng chiếu và Hình thức thanh toán (VNPay / Tiền mặt).
* **Mô hình hóa bài toán Đối soát & Bóc tách Công nợ Hoàn tiền (`BR-10`):**
  * Tách biệt rõ ràng giữa **Doanh thu gộp (Gross Revenue)** và **Doanh thu thuần thực tế (Net Revenue)**.
  * Xử lý nghiệp vụ sự cố kỹ thuật rạp (`FR-CAN-02`): Phân tách giữa trạng thái công nợ `PENDING_CASH_REFUND` (rạp nợ tiền khách chưa đến nhận) và `REFUNDED_CASH` (tiền mặt thực tế đã xuất quỹ hoàn trả khách tại quầy).
* **Sơ đồ hóa tương tác kỹ thuật:** Thể hiện rõ việc API gọi các hàm tổng hợp Prisma Aggregation (`_sum`, `_count`, `groupBy`), kết hợp xuất file Excel / PDF.

#### ⚠️ Khó khăn & Thách thức kỹ thuật:
* **Phức tạp trong bản chất dòng tiền:** Khách tự hủy vé online thì nhận Voucher 50% (`BR-03`, không xuất tiền mặt). Rạp hủy suất chiếu sự cố thì bồi hoàn 100% tiền mặt (`BR-04`). Việc thể hiện luồng bóc tách 2 dòng tiền này đòi hỏi am hiểu sâu sắc về kế toán vận hành rạp chiếu.
* **Tổng hợp dữ liệu đa bảng:** Thể hiện sự phối hợp dữ liệu của 4 bảng quan hệ lớn (`Order`, `Ticket`, `OrderCombo`, `Payment`) trong một luồng tuần tự mà vẫn giữ được tính trực quan.

---

### 2.4. Thiết kế & Hiện thực hóa Cơ sở Dữ liệu (Database Design & Prisma ORM)

#### 🎯 Đóng góp chi tiết:
* **Xây dựng Mô hình Thực thể - Quan hệ (ERD) đạt chuẩn 3NF:**
  * Thiết kế hoàn chỉnh **11 Bảng dữ liệu** và **10 Kiểu liệt kê Enums** trong `schema.prisma`.
  * Các bảng hạt nhân: `User`, `Movie`, `Screening`, `Seat`, `Pricing`, `Coupon`, `Combo`, `ComboReservation`, `Payment`, `Ticket`, `OrderCombo`, `Review`.
* **Thiết lập Ràng buộc Toàn vẹn & Hiệu năng cao:**
  * Định nghĩa khóa ngoại (`Foreign Keys`), các quy tắc xóa an toàn: `onDelete: Cascade` (xóa Phim xóa Suất chiếu; xóa Payment xóa OrderCombo), `onDelete: Restrict` (không cho xóa User nếu đã có vé/hóa đơn thanh toán), `onDelete: SetNull`.
  * Đánh chỉ mục hiệu năng (**Database Indexes**) trên các cột truy vấn thường xuyên: `@@index([screeningId, seatId])`, `@@unique([screeningId, code])`.
* **Đảm bảo tính Toàn vẹn Giao dịch (ACID Transactions):**
  * Sử dụng `prisma.$transaction` để xử lý các nghiệp vụ đa bước: Khóa giữ ghế 10 phút, đặt vé kèm trừ kho combo bắp nước, bồi hoàn tiền mặt và chuyển trạng thái vé.

#### ⚠️ Khó khăn & Thách thức kỹ thuật:
* **Bài toán Tranh chấp Ghế (Race Condition & Concurrency):**
  * *Vấn đề:* Nhiều khách hàng cùng bấm chọn một ghế trong cùng một giây.
  * *Giải pháp:* Thiết kế cơ chế khóa giữ chỗ tạm thời 10 phút (`RESERVED`) có gắn cờ thời gian (`reservedUntil`), kết hợp giao dịch ACID để khóa dữ liệu ngay lập tức.
* **Quản lý trạng thái ghế độc lập theo từng suất chiếu:** Ghế vật lý trong phòng là cố định (50 ghế), nhưng trạng thái ghế lại thay đổi theo từng suất chiếu. Cần thiết kế cấu trúc sao cho vừa phản ánh đúng sơ đồ ghế, vừa tối ưu dung lượng lưu trữ trên PostgreSQL.

---

### 2.5. Xây dựng Ứng dụng Full-stack (Next.js App Development)

#### 🎯 Đóng góp chi tiết:
* **Tầng Backend (Next.js Server Actions & Route Handlers):**
  * Lập trình các API xác thực `/api/auth/register`, `/api/auth/login`, tích hợp NextAuth Session Provider.
  * Xây dựng **Middleware bảo vệ tuyến đường (RBAC Route Protection)**: Tự động chặn và chuyển hướng người dùng khi chưa đăng nhập hoặc truy cập sai phân vùng quyền hạn.
  * Lập trình API Báo cáo & Thống kê: Sử dụng câu lệnh gom nhóm (`groupBy`) và tính tổng trực tiếp từ PostgreSQL thông qua Prisma.
* **Tầng Frontend & UI/UX (Tailwind CSS):**
  * Xây dựng màn hình Đăng ký, Đăng nhập với phản hồi lỗi tức thì (Inline validation & Toast).
  * Xây dựng **Dashboard Báo cáo Admin**: Tích hợp các thẻ KPI tổng quan, bảng dữ liệu phân trang và bộ lọc khoảng ngày linh hoạt.
* **Đóng gói & Xuất bản Tài liệu Master Word:**
  * Tự động hóa quá trình xuất bản và nhúng toàn bộ **55 sơ đồ UML (17 Activity + 38 Sequence)** vào tài liệu Word chính thức.
  * Lập trình thuật toán khóa tỷ lệ kích thước tự động ($max\_w \le 16.5\text{ cm}, max\_h \le 22.0\text{ cm}$), giải quyết dứt điểm lỗi tràn trang và mất cụt chân sơ đồ.

#### ⚠️ Khó khăn & Thách thức kỹ thuật:
* **Ranh giới Server vs Client Components trong Next.js App Router:** Phân tách rành mạch giữa các thành phần chạy trên máy chủ (để bảo mật secret key, query trực tiếp DB) và thành phần tương tác trên trình duyệt (form đăng nhập, bộ lọc ngày).
* **Tối ưu hóa hiệu năng truy vấn (N+1 Query Problem):** Tối ưu hóa các truy vấn báo cáo tài chính bằng cách gom nhóm trực tiếp dưới cơ sở dữ liệu thay vì kéo toàn bộ dữ liệu thô về xử lý trên Javascript.

---

### 2.6. Thiết kế Sơ đồ Lớp Toàn hệ thống (Class Diagram)

#### 🎯 Đóng góp chi tiết:
* **Xây dựng Sơ đồ Lớp Thực thể Giàu nghiệp vụ (Rich Domain Class Diagram):**
  * Mô hình hóa trọn vẹn **12 Lớp Thực thể cốt lõi**, 1 Lớp cơ sở trừu tượng (`User`), 3 Lớp con chuyên biệt hóa (`Customer`, `Staff`, `Admin`) và 10 Enums trạng thái.
  * Định nghĩa đầy đủ thuộc tính, kiểu dữ liệu, phạm vi truy cập (public/private/protected) và các phương thức nghiệp vụ thực tế bóc tách từ 38 sơ đồ Sequence.
* **Thiết lập chuẩn xác các mối quan hệ Hướng đối tượng:**
  * Kế thừa (Generalization `^--`): `Customer`, `Staff`, `Admin` kế thừa từ `User`.
  * Hợp thành (Composition `*--`): `Screening` sở hữu `Seat`; `Payment` sở hữu `OrderCombo`.
  * Kết tập (Aggregation `o--`): `Screening` kết tập `Movie`; `Ticket` liên kết với `Screening` và `Seat`.
  * Bội số (Multiplicity): Ghi chú rõ ràng tỷ lệ liên kết ($1..1, 1..*, 0..1, 0..*$).

#### ⚠️ Khó khăn & Thách thức kỹ thuật:
* **Sự lệch pha giữa Lập trình Hướng đối tượng và Cơ sở Dữ liệu Quan hệ (Object-Relational Impedance Mismatch):** CSDL dùng khóa ngoại số nguyên (`movieId`, `paymentId`), trong khi UML OOP phải dùng con trỏ/tập hợp đối tượng (`List<Ticket>`, `List<OrderCombo>`). Đã loại bỏ hoàn toàn khóa ngoại thô trên sơ đồ lớp để tuân thủ chuẩn OOP thuần túy.
* **Phân định ranh giới giữa Composition và Aggregation:** Phải bảo vệ lập luận chặt chẽ: Suất chiếu sở hữu Ghế (xóa suất chiếu thì 50 bản ghi ghế suất đó bị hủy $\rightarrow$ Composition); Suất chiếu gắn với Phim (xóa suất chiếu thì Phim vẫn tồn tại $\rightarrow$ Aggregation).
* **Tránh lỗi Mô hình Lớp thiếu sức sống (Anemic Domain Model):** Không để các lớp chỉ chứa thuộc tính và getter/setter thụ động; đã bổ sung đầy đủ các phương thức nghiệp vụ thực tế như `verifyQRCode()`, `checkRoomConflict()`, `holdSeat()`, `validateCoupon()`, `deductStock()`.

---

## 3. ĐẶC TẢ CHI TIẾT 12 LỚP THỰC THỂ TRONG CLASS DIAGRAM

```
========================================================================================
                          DANH MỤC LỚP THỰC THỂ (CORE ENTITY CLASSES)
========================================================================================
```

### 1. `User` (Abstract Base Class) & Chuyên biệt hóa
* **Thuộc tính:** `- id: Int`, `- email: String`, `- passwordHash: String`, `- name: String`, `- phone: String`, `- role: Role`, `- createdAt: DateTime`
* **Phương thức:** `+ register(): Boolean`, `+ login(): String`, `+ updateProfile(): Boolean`, `+ changePassword(): Boolean`
* **Lớp con kế thừa:**
  * `Customer`: `+ bookTicket()`, `+ selectCombo()`, `+ applyCoupon()`, `+ cancelTicket()`, `+ writeReview()`
  * `Staff`: `+ sellTicketAtPOS()`, `+ sellComboAtPOS()`, `+ checkInTicket()`, `+ deliverCombo()`
  * `Admin`: `+ createMovie()`, `+ scheduleScreening()`, `+ manageCombo()`, `+ issueCoupon()`, `+ viewReports()`

### 2. `Movie` (Danh mục Phim)
* **Thuộc tính:** `- id: Int`, `- title: String`, `- duration: Int`, `- releaseDate: Date`, `- ageRating: String`, `- poster: String`, `- genre: String`, `- rating: Decimal`, `- status: MovieStatus`
* **Phương thức:** `+ getActiveScreenings(): List<Screening>`, `+ calculateAverageRating(): Decimal`, `+ updateStatus(newStatus): Void`

### 3. `Screening` (Suất chiếu / Lịch chiếu)
* **Thuộc tính:** `- id: Int`, `- movieId: Int`, `- room: String`, `- roomNumber: Int`, `- startTime: DateTime`, `- endTime: DateTime`, `- date: Date`, `- price: Decimal`, `- status: ScreeningStatus`
* **Phương thức:** `+ checkRoomConflict(startTime, endTime): Boolean`, `+ generateSeats(): Void`, `+ cancelScreening(reason): Boolean`

### 4. `Seat` (Ghế ngồi trong phòng chiếu)
* **Thuộc tính:** `- id: Int`, `- screeningId: Int`, `- room: String`, `- row: String`, `- number: Int`, `- code: String`, `- type: SeatType`, `- status: SeatStatus`, `- reservedUntil: DateTime`
* **Phương thức:** `+ holdSeat(durationMinutes: Int): Boolean`, `+ releaseSeat(): Void`, `+ markAsOccupied(): Void`

### 5. `Pricing` (Cấu hình Bảng giá vé)
* **Thuộc tính:** `- id: Int`, `- ticketType: String`, `- label: String`, `- percentage: Int`, `- basePrice: Decimal`, `- description: String`
* **Phương thức:** `+ calculateFinalPrice(basePrice: Decimal, seatType: SeatType): Decimal`

### 6. `Ticket` (Vé xem phim điện tử)
* **Thuộc tính:** `- id: Int`, `- userId: Int`, `- screeningId: Int`, `- seatId: Int`, `- paymentId: Int`, `- ticketType: String`, `- price: Decimal`, `- purchaseDate: DateTime`, `- status: TicketStatus`, `- cancellationReason: String`
* **Phương thức:** `+ generateQRCode(): String`, `+ verifyQRCode(signature: String): Boolean`, `+ checkIn(): Boolean`, `+ cancelTicket(reason): Boolean`

### 7. `Combo` (Bắp nước & Đồ ăn kèm)
* **Thuộc tính:** `- id: Int`, `- name: String`, `- description: String`, `- price: Decimal`, `- stock: Int`, `- status: ComboStatus`, `- image: String`
* **Phương thức:** `+ checkStockAvailability(quantity: Int): Boolean`, `+ deductStock(quantity: Int): Void`, `+ restock(quantity: Int): Void`

### 8. `OrderCombo` (Chi tiết Đặt combo theo Hóa đơn)
* **Thuộc tính:** `- id: Int`, `- paymentId: Int`, `- comboId: Int`, `- quantity: Int`, `- price: Decimal`, `- isDelivered: Boolean`, `- deliveredAt: DateTime`
* **Phương thức:** `+ markAsDelivered(): Void`, `+ getSubtotal(): Decimal`

### 9. `Payment` (Hóa đơn Thanh toán Hợp nhất)
* **Thuộc tính:** `- id: Int`, `- userId: Int`, `- amount: Decimal`, `- paymentMethod: PaymentMethod`, `- transactionCode: String`, `- status: PaymentStatus`, `- createdAt: DateTime`
* **Phương thức:** `+ calculateTotal(tickets, combos, coupon): Decimal`, `+ createPaymentUrl(gateway): String`, `+ processIPNCallback(data): Boolean`, `+ issueRefund(amount, method): Boolean`

### 10. `Coupon` / `Voucher` (Mã giảm giá & Bồi hoàn)
* **Thuộc tính:** `- id: Int`, `- code: String`, `- discountType: DiscountType`, `- discountValue: Decimal`, `- minAmount: Decimal`, `- maxUsage: Int`, `- usedCount: Int`, `- expiryDate: Date`, `- userId: Int`
* **Phương thức:** `+ validateCoupon(orderAmount: Decimal, movieId: Int): Boolean`, `+ calculateDiscount(ticketAmount: Decimal): Decimal`, `+ markAsUsed(): Void`

### 11. `Review` (Đánh giá & Bình luận Phim)
* **Thuộc tính:** `- id: Int`, `- userId: Int`, `- movieId: Int`, `- rating: Int`, `- comment: String`, `- createdAt: DateTime`
* **Phương thức:** `+ createReview(): Boolean`, `+ hideReview(): Void`

### 12. `ComboReservation` (Giữ chỗ Tạm thời Combo)
* **Thuộc tính:** `- id: Int`, `- comboId: Int`, `- quantity: Int`, `- status: String`, `- reservedUntil: DateTime`
* **Phương thức:** `+ checkExpiry(): Boolean`, `+ release(): Void`

---

## 4. KỊCH BẢN TRẢ LỜI PHỎNG VẤN BẢO VỆ ĐỒ ÁN (Q&A DEFENSE)

Dưới đây là các câu hỏi "điểm huyệt" mà Hội đồng chấm thi rất hay hỏi và câu trả lời chuẩn xác nhất dành cho bạn:

#### ❓ Câu hỏi 1: "Tại sao trong Class Diagram em lại dùng quan hệ Hợp thành (Composition) giữa Screening và Seat, mà giữa Screening và Movie lại là Kết tập (Aggregation)?"
> **Trả lời:** *"Dạ thưa Thầy/Cô, điều này dựa trên tính phụ thuộc vòng đời (Lifecycle Coupling) của dữ liệu rạp chiếu thực tế:*
> * *Giữa `Screening` và `Seat`: Ghế ngồi trong hệ thống được quản lý trạng thái động (`EMPTY`, `RESERVED`, `OCCUPIED`) theo từng suất chiếu. Nếu một suất chiếu bị xóa hoặc hủy bỏ, toàn bộ 50 bản ghi trạng thái ghế gắn với suất chiếu đó không còn lý do tồn tại và phải bị tiêu hủy theo. Do đó, đây là quan hệ **Hợp thành (Composition - Kim cương đen)**.*
> * *Giữa `Screening` và `Movie`: Một suất chiếu phục vụ trình chiếu một bộ phim. Tuy nhiên, nếu suất chiếu kết thúc hoặc bị hủy, bản ghi Phim vẫn tồn tại độc lập trong danh mục rạp để tiếp tục lên lịch cho các suất chiếu khác. Do đó, đây là quan hệ **Kết tập (Aggregation - Kim cương trắng)**."*

#### ❓ Câu hỏi 2: "Tại sao em lại tách lớp User thành Customer, Staff và Admin trên sơ đồ lớp trong khi dưới Database em chỉ có 1 bảng `users`?"
> **Trả lời:** *"Dạ thưa Thầy/Cô, đây là mẫu thiết kế **Single Table Inheritance (Kế thừa bảng đơn)**:*
> * *Ở mức mô hình hóa Hướng đối tượng (UML OOP): Ba đối tượng này có hành vi (Business Methods) hoàn toàn khác biệt. Khách hàng thực hiện đặt vé online, nhân viên thực hiện bán vé tại quầy và soát vé, quản trị viên điều hành danh mục và xem báo cáo tài chính. Việc tách thành 3 lớp con kế thừa từ lớp cha `User` đảm bảo tính đóng gói và tuân thủ nguyên tắc trách nhiệm đơn lẻ (SRP).*
> * *Ở mức lưu trữ Cơ sở dữ liệu: Cả 3 vai trò chia sẻ chung các trường cốt lõi như email, passwordHash, name, phone. Gom chung vào một bảng `users` kèm cột phân loại `role: Role` giúp tối ưu hóa hiệu năng, giảm thiểu chi phí join bảng và tận dụng được cơ chế xác thực JWT session của NextAuth.js."*

#### ❓ Câu hỏi 3: "Khi thiết kế Class Diagram và CSDL, em giải quyết bài toán hai khách hàng cùng chọn một ghế trong cùng một giây (Race Condition) như thế nào?"
> **Trả lời:** *"Dạ thưa Thầy/Cô, em giải quyết bằng sự kết hợp giữa thiết kế Class và Giao dịch CSDL:*
> * *Trong Class `Seat`: Em thiết kế thuộc tính `reservedUntil: DateTime` và phương thức `holdSeat(duration: 10m)`. Khi khách chọn ghế, hệ thống ngay lập tức chuyển trạng thái sang `RESERVED` và gán mốc thời gian giữ chỗ tạm thời 10 phút (`BR-01`).*
> * *Dưới Cơ sở dữ liệu: Em áp dụng giao dịch **ACID (`prisma.$transaction`)** kèm điều kiện kiểm tra nguyên tử: Chỉ cho phép giữ chỗ nếu ghế đang ở trạng thái `EMPTY` hoặc đã quá hạn `reservedUntil < NOW()`. Nhờ đó, yêu cầu đầu tiên đến sẽ thành công, yêu cầu đến sau vài mili-giây sẽ lập tức nhận thông báo ghế không khả dụng mà không bao giờ xảy ra lỗi đặt trùng ghế."*

---

## 5. BẢNG ĐÁNH GIÁ & TỰ CHẤM ĐIỂM MỨC ĐỘ HOÀN THÀNH

| STT | Hạng mục nhiệm vụ đảm nhiệm | Khối lượng & Kết quả thực tế | Mức độ hoàn thành | Tự đánh giá |
| :---: | :--- | :--- | :---: | :---: |
| **1** | **Use Case Tổng quát & Rà soát hệ thống** | 1 Sơ đồ Use Case tổng quan 7 phân hệ; Bổ sung các use case POS và nghiệp vụ quầy; Ma trận truy vết SRS. | **100%** | **Xuất sắc (A+)** |
| **2** | **Sơ đồ Activity & Sequence (Xác thực)** | 3 Activity Diagrams + 3 Sequence Diagrams (Đăng ký, Đăng nhập RBAC, Đăng xuất) có đầy đủ swimlanes và lifelines. | **100%** | **Xuất sắc (A+)** |
| **3** | **Sơ đồ Activity & Sequence (Báo cáo)** | 1 Activity Diagram + 1 Sequence Diagram Báo cáo Doanh thu đa chiều & Bóc tách công nợ hoàn tiền (`BR-10`). | **100%** | **Xuất sắc (A+)** |
| **4** | **Thiết kế & Triển khai Cơ sở Dữ liệu** | 11 Models, 10 Enums trong Prisma Schema; PostgreSQL Migrations; Ràng buộc toàn vẹn; Indexing; ACID Transactions. | **100%** | **Xuất sắc (A+)** |
| **5** | **Xây dựng Ứng dụng Full-stack (Next.js)** | Middleware phân quyền RBAC; Màn hình Auth; Dashboard Báo cáo Admin; Tự động hóa đóng gói 55 sơ đồ vào file Word. | **100%** | **Xuất sắc (A+)** |
| **6** | **Thiết kế Sơ đồ Lớp (Class Diagram)** | 12 Lớp Thực thể nghiệp vụ giàu tính năng (Rich Domain Model); Chuẩn hóa kế thừa và quan hệ Composition/Aggregation. | **100%** | **Xuất sắc (A+)** |

---
*Tài liệu được tổng hợp và chuẩn hóa phục vụ Báo cáo Đồ án Tốt nghiệp & Bảo vệ Học phần Phân tích Thiết kế Hệ thống Thông tin.*
