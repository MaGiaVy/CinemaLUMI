import os

assets_dir = "/C:/Users/Giavy/.gemini/antigravity/brain/b9db38ea-788a-4998-b033-b7bc1f6ac3d1/report_assets"

md = f"""# BÁO CÁO TIẾN ĐỘ ĐỒ ÁN MÔN HỌC: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG THÔNG TIN
## HỆ THỐNG QUẢN LÝ VÀ ĐẶT VÉ RẠP CHIẾU PHIM LUMICINEMA

> **Đơn vị:** Khoa Công nghệ Thông tin – Trường Đại học Sài Gòn (SGU)  
> **Sinh viên thực hiện:** Mã Gia Vỹ  
> **Tài liệu đính kèm chính:** [`Bao_Cao_Tien_Do_LumiCinema.docx`](file:///d:/cinema_project/Bao_Cao_Tien_Do_LumiCinema.docx)  
> **Nội dung tổng hợp:** Mô hình Dữ liệu Quan hệ (RDM) • Sơ đồ Lớp (Class Diagram) • 6 Sơ đồ Máy Trạng thái (State Machine Diagrams) • Thiết kế Giao diện (UI Design) kèm Bảng Biến Cố.

---

## PHẦN I: MÔ HÌNH DỮ LIỆU QUAN HỆ (RELATIONAL DATA MODEL – RDM)

Mô hình dữ liệu quan hệ (RDM) của hệ thống LumiCinema được chuẩn hóa đạt Dạng chuẩn 3 (3NF), bao gồm **12 bảng thực thể** và **16 mối quan hệ khóa ngoại (1 - N)**. Mô hình đảm bảo tính toàn vẹn dữ liệu, tối ưu hóa cho bài toán đặt vé đồng thời cao (concurrency) và chống xung đột giữ chỗ (double-booking).

### 1. Quy ước Ký hiệu
* **thuộc_tính (PK):** Khóa chính (Primary Key).
* ***thuộc_tính (FK):*** Khóa ngoại (Foreign Key).
* **NN:** Ràng buộc Not Null (không được để trống).
* **UQ:** Ràng buộc Unique (duy nhất trên toàn bảng).

### 2. Lược đồ Quan hệ RDM Trực quan

![Lược đồ Quan hệ RDM LumiCinema]({assets_dir}/rdm_diagram.png)
*Hình 1.1: Lược đồ Mô hình Dữ liệu Quan hệ (RDM) Hệ thống Đặt vé Xem phim LumiCinema*

---

### 3. Lược đồ Quan hệ Tổng quát (Relational Schema)
1. `users` (**user_id**, email, password, name, phone, role, created_at)
2. `movies` (**movie_id**, title, duration, release_date, age_rating, poster, rating, genre, ticket_price, status)
3. `pricing` (**pricing_id**, *ticket_type*, label, percentage, base_price)
4. `combos` (**combo_id**, name, price, image, stock, status)
5. `screenings` (**screening_id**, *movie_id*, room, room_number, start_time, end_time, date, price, status)
6. `seats` (**seat_id**, *screening_id*, row, number, code, type, status, reserved_until)
7. `coupons` (**coupon_id**, code, discount_type, discount_value, min_amount, max_usage, used_count, expiry_date, *applicable_movie_id*, *user_id*)
8. `reviews` (**review_id**, *user_id*, *movie_id*, rating, comment, created_at)
9. `combo_reservations` (**reservation_id**, *combo_id*, *user_id*, quantity, status, reserved_until)
10. `payments` (**payment_id**, *user_id*, *screening_id*, amount, payment_method, transaction_code, status, created_at)
11. `tickets` (**ticket_id**, *user_id*, *screening_id*, *seat_id*, *payment_id*, ticket_type, price, status, purchase_date)
12. `order_combos` (**order_combo_id**, *payment_id*, *combo_id*, quantity, price, is_delivered)

---

### 4. Từ điển Dữ liệu Chi tiết (Data Dictionary)

#### Nhóm 1: Danh mục Nền tảng (users, movies, pricing, combos)

**1. Bảng `users` (Tài khoản người dùng & Phân quyền):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `user_id` | INT | PK, Auto | Mã định danh duy nhất của người dùng |
| `email` | VARCHAR(255) | NN, UQ | Địa chỉ email đăng nhập hệ thống |
| `password` | VARCHAR(255) | NN | Mật khẩu băm an toàn Bcrypt |
| `name` | VARCHAR(100) | NN | Họ và tên đầy đủ |
| `phone` | VARCHAR(20) | — | Số điện thoại liên lạc |
| `role` | VARCHAR(20) | NN | Vai trò: 'ADMIN', 'STAFF', 'CUSTOMER' |
| `created_at` | TIMESTAMP | Default Now | Thời điểm đăng ký tài khoản |

**2. Bảng `movies` (Phim công chiếu):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `movie_id` | INT | PK, Auto | Mã định danh duy nhất của phim |
| `title` | VARCHAR(255) | NN | Tiêu đề phim công chiếu |
| `duration` | INT | NN | Thời lượng phim tính bằng phút (> 0) |
| `release_date` | DATE | NN | Ngày khởi chiếu chính thức |
| `age_rating` | VARCHAR(20) | NN | Phân loại độ tuổi: P, C13, C16, C18 |
| `poster` | VARCHAR(500) | NN | Đường dẫn URL ảnh poster phim |
| `rating` | DECIMAL(3,1) | Default 0.0 | Điểm đánh giá trung bình (1.0 -> 5.0) |
| `genre` | VARCHAR(100) | NN | Thể loại phim (Hành động, Viễn tưởng...) |
| `ticket_price`| DECIMAL(10,2)| NN | Giá vé cơ sở niêm yết của phim |
| `status` | VARCHAR(20) | NN | Trạng thái: SHOWING, UPCOMING, ENDED |

**3. Bảng `pricing` (Cấu hình giá vé):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `pricing_id` | INT | PK, Auto | Mã định danh cấu hình giá vé |
| `ticket_type` | VARCHAR(50) | UQ, NN | Mã loại vé: NORMAL, STUDENT, VIP, COUPLE |
| `label` | VARCHAR(100) | NN | Tên hiển thị: Vé Thường, Vé HSSV, Vé VIP... |
| `percentage` | INT | Default 100 | Tỷ lệ % áp dụng so với giá gốc |
| `base_price` | DECIMAL(10,2)| NN | Đơn giá cố định hoặc phụ thu |

**4. Bảng `combos` (Combo bắp nước):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `combo_id` | INT | PK, Auto | Mã định danh combo bắp nước |
| `name` | VARCHAR(100) | NN | Tên combo (Combo Solo, Combo Đôi...) |
| `price` | DECIMAL(10,2)| NN | Đơn giá niêm yết combo |
| `image` | VARCHAR(500) | NN | Đường dẫn URL hình ảnh sản phẩm |
| `stock` | INT | NN, >= 0 | Số lượng tồn kho khả dụng hiện tại |
| `status` | VARCHAR(20) | NN | Trạng thái: ACTIVE, INACTIVE |

---

#### Nhóm 2: Lịch chiếu & Ghế ngồi (screenings, seats)

**5. Bảng `screenings` (Suất chiếu):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `screening_id`| INT | PK, Auto | Mã định danh duy nhất của suất chiếu |
| `movie_id` | INT | FK, NN | Tham chiếu `movies(movie_id)` |
| `room` | VARCHAR(50) | NN | Tên phòng chiếu (Cinema 01 -> Cinema 04) |
| `room_number` | INT | NN | Số phòng chiếu (1 -> 4) |
| `start_time` | TIMESTAMP | NN | Thời gian bắt đầu chiếu |
| `end_time` | TIMESTAMP | NN | Thời gian kết thúc (start_time + duration) |
| `date` | DATE | NN | Ngày diễn ra suất chiếu |
| `price` | DECIMAL(10,2)| NN | Giá vé cơ sở áp dụng cho suất chiếu |
| `status` | VARCHAR(20) | NN | Trạng thái: UPCOMING, SHOWING, ENDED, CANCELLED |

**6. Bảng `seats` (Ghế ngồi & Khóa giữ chỗ 10 phút):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `seat_id` | INT | PK, Auto | Mã định danh duy nhất của ghế ngồi |
| `screening_id`| INT | FK, NN | Tham chiếu `screenings(screening_id)` |
| `row` | VARCHAR(5) | NN | Hàng ghế (A, B, C, D, E) |
| `number` | INT | NN | Số thứ tự ghế trong hàng (1 -> 10) |
| `code` | VARCHAR(10) | NN | Mã hiển thị trực quan (A1, B5, E10...) |
| `type` | VARCHAR(20) | NN | Loại ghế: STANDARD, VIP, COUPLE |
| `status` | VARCHAR(20) | NN | Trạng thái: EMPTY, RESERVED, OCCUPIED |
| `reserved_until`| TIMESTAMP | — | Thời hạn hết hạn giữ chỗ (10 phút) |

---

#### Nhóm 3: Khách hàng & Tương tác (coupons, reviews)

**7. Bảng `coupons` (Voucher khuyến mãi):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `coupon_id` | INT | PK, Auto | Mã định danh voucher |
| `code` | VARCHAR(50) | NN, UQ | Mã code nhập (VD: LUMI20, COMP50_...) |
| `discount_type`| VARCHAR(20) | NN | Loại giảm giá: Percentage hoặc FixedAmount |
| `discount_value`| DECIMAL(10,2)| NN | Giá trị giảm (VD: 20% hoặc 50.000 VNĐ) |
| `min_amount` | DECIMAL(10,2)| Default 0 | Giá trị đơn hàng tối thiểu áp dụng |
| `max_usage` | INT | Default 1 | Số lượt sử dụng tối đa của voucher |
| `used_count` | INT | Default 0 | Số lượt đã được sử dụng thực tế |
| `expiry_date` | DATE | NN | Hạn chót có hiệu lực của voucher |
| `applicable_movie_id`| INT | FK | Tham chiếu `movies(movie_id)` |
| `user_id` | INT | FK | Tham chiếu `users(user_id)` |

**8. Bảng `reviews` (Đánh giá phim):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `review_id` | INT | PK, Auto | Mã định danh duy nhất của đánh giá |
| `user_id` | INT | FK, NN | Tham chiếu `users(user_id)` |
| `movie_id` | INT | FK, NN | Tham chiếu `movies(movie_id)` |
| `rating` | INT | NN, 1->5 | Số sao đánh giá (1 đến 5 sao) |
| `comment` | TEXT | — | Nội dung nhận xét đánh giá phim |
| `created_at` | TIMESTAMP | Default Now | Thời điểm đăng bài đánh giá |

---

#### Nhóm 4: Giao dịch & Đơn vé (combo_reservations, payments, tickets, order_combos)

**9. Bảng `combo_reservations` (Giữ kho combo tạm 10 phút):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `reservation_id`| INT | PK, Auto | Mã giữ chỗ bắp nước tạm thời |
| `combo_id` | INT | FK, NN | Tham chiếu `combos(combo_id)` |
| `user_id` | INT | FK, NN | Tham chiếu `users(user_id)` |
| `quantity` | INT | NN, > 0 | Số lượng combo giữ chỗ |
| `status` | VARCHAR(20) | NN | Trạng thái: RESERVED, RELEASED, CONFIRMED |
| `reserved_until`| TIMESTAMP | NN | Thời hạn hết hạn giữ kho (10 phút) |

**10. Bảng `payments` (Hóa đơn thanh toán ZaloPay/Tiền mặt):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `payment_id` | INT | PK, Auto | Mã định danh hóa đơn thanh toán |
| `user_id` | INT | FK, NN | Tham chiếu `users(user_id)` |
| `screening_id`| INT | FK, NN | Tham chiếu `screenings(screening_id)` |
| `amount` | DECIMAL(10,2)| NN | Tổng số tiền thanh toán thực tế |
| `payment_method`| VARCHAR(50) | NN | Phương thức: ZaloPay, Cash, BankCard |
| `transaction_code`| VARCHAR(100)| UQ | Mã giao dịch cổng ZaloPay / Ngân hàng |
| `status` | VARCHAR(20) | NN | Trạng thái: Pending, Success, Failed, Refunded |
| `created_at` | TIMESTAMP | Default Now | Thời điểm khởi tạo đơn hàng |

**11. Bảng `tickets` (Vé xem phim & Mã QR):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `ticket_id` | INT | PK, Auto | Mã định danh vé xem phim |
| `user_id` | INT | FK, NN | Tham chiếu `users(user_id)` |
| `screening_id`| INT | FK, NN | Tham chiếu `screenings(screening_id)` |
| `seat_id` | INT | FK, NN, UQ | Tham chiếu `seats(seat_id)` (1 ghế duy nhất 1 vé) |
| `payment_id` | INT | FK, NN | Tham chiếu `payments(payment_id)` |
| `ticket_type` | VARCHAR(50) | NN | Loại vé: NORMAL, STUDENT, VIP, COUPLE |
| `price` | DECIMAL(10,2)| NN | Giá vé tính theo loại vé và phụ thu |
| `status` | VARCHAR(20) | NN | Trạng thái: Valid, Used, Cancelled |
| `purchase_date`| TIMESTAMP | Default Now | Thời điểm xuất vé thành công |

**12. Bảng `order_combos` (Chi tiết combo đã mua):**
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả / Tham chiếu |
| :--- | :--- | :--- | :--- |
| `order_combo_id`| INT | PK, Auto | Mã định danh combo trong đơn hàng |
| `payment_id` | INT | FK, NN | Tham chiếu `payments(payment_id)` |
| `combo_id` | INT | FK, NN | Tham chiếu `combos(combo_id)` |
| `quantity` | INT | NN, > 0 | Số lượng combo đã mua |
| `price` | DECIMAL(10,2)| NN | Đơn giá combo tại thời điểm thanh toán |
| `is_delivered` | BOOLEAN | Default False| Đã nhận tại quầy chưa (False: Chưa, True: Rồi) |

---

## PHẦN II: SƠ ĐỒ LỚP CHI TIẾT (CLASS DIAGRAM)

![Sơ đồ Lớp LumiCinema]({assets_dir}/class_diagram.png)
*Hình 2.1: Sơ đồ Lớp Toàn diện (UML Class Diagram) Hệ thống Rạp chiếu phim LumiCinema*

### 1. Phân Tích Kiến Trúc 3 Phân Tầng
* **Tầng Thực thể (Domain Entities):** `User`, `Movie`, `Screening`, `Seat`, `Ticket`, `Payment`, `Combo`, `Coupon`, `Review`. Đại diện cho các thực thể dữ liệu trong cơ sở dữ liệu với đầy đủ quan hệ ràng buộc và phương thức kiểm tra toàn vẹn.
* **Tầng Dịch vụ Nghiệp vụ (Service Layer):**
  * `AuthService`: Xác thực NextAuth JWT, phân quyền RBAC.
  * `BookingService`: Điều phối luồng chọn vé, tính tiền và áp mã voucher.
  * `SeatConcurrencyService`: Kiểm soát đồng thời với khóa giữ chỗ 10 phút, ngăn chặn xung đột ghế.
  * `PaymentService`: Giao tiếp cổng ZaloPay Sandbox v2 (HMAC-SHA256) và xử lý IPN Webhook.
  * `TicketService`: Quản lý xuất vé, quét mã QR soát vé và xử lý chính sách hủy vé.
  * `EmailNotificationService`: Gửi vé kèm QR code qua giao thức SMTP an toàn.
* **Tầng Tích hợp Cổng ngoài (External Adapters):** `ZaloPayGateway`, `CloudinaryStorage`, `NodemailerSmtp`.

### 2. Bảng Phân Tích Quan Hệ Giữa Các Lớp
| Lớp nguồn | Lớp đích | Loại quan hệ | Bội số | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :---: | :--- |
| `Movie` | `Screening` | Composition | 1 —— 0..* | Phim sở hữu các suất chiếu; xóa phim thì suất chiếu bị vô hiệu. |
| `Screening` | `Seat` | Composition | 1 —— 50 | Mỗi suất chiếu khởi tạo chính xác 50 ghế (A -> E). |
| `Screening` | `Ticket` | Association | 1 —— 0..* | Suất chiếu bán ra tối đa 50 vé xem phim. |
| `Seat` | `Ticket` | Association (1-1)| 1 —— 0..1 | Một ghế tại một suất chiếu chỉ gắn với tối đa 1 vé hợp lệ. |
| `User` | `Ticket` | Association | 1 —— 0..* | Người dùng sở hữu lịch sử các vé đã đặt. |
| `Payment` | `Ticket` | Aggregation | 1 —— 1..8 | Một hóa đơn thanh toán chứa từ 1 đến 8 vé xem phim. |
| `Payment` | `OrderCombo`| Aggregation | 1 —— 0..* | Một hóa đơn có thể mua kèm 0 hoặc nhiều combo bắp nước. |

---

## PHẦN III: SƠ ĐỒ MÁY TRẠNG THÁI (STATE MACHINE DIAGRAMS)

### 1. Sơ đồ Máy Trạng thái Ghế ngồi (Seat Lifecycle)

![Sơ đồ Trạng thái Ghế ngồi]({assets_dir}/state_seat.png)
*Hình 3.1: Sơ đồ Trạng thái Vòng đời Ghế ngồi (Seat State Machine)*

**Bảng Danh sách Biến cố Chuyển Trạng thái Ghế:**
| STT | Trạng thái nguồn | Sự kiện kích hoạt | Điều kiện bảo vệ (Guard) | Hành động thực thi (Action) | Trạng thái đích |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `[*]` | Khởi tạo suất chiếu | Phòng chiếu hợp lệ | Tạo 50 ghế trống (A -> E) | `EMPTY` (Ghế trống) |
| 2 | `EMPTY` | Khách chọn ghế | `[Ghế đang trống]` | Cấp khóa giữ chỗ 10 phút | `RESERVED` (Đang giữ chỗ) |
| 3 | `RESERVED` | Hết hạn 10 phút (TTL)| `[Chưa thanh toán]` | Tự động giải phóng ghế | `EMPTY` (Ghế trống) |
| 4 | `RESERVED` | Khách bỏ chọn ghế | `[Thao tác bởi chính User]` | Xóa khóa giữ chỗ | `EMPTY` (Ghế trống) |
| 5 | `RESERVED` | Thanh toán ZaloPay | `[Giao dịch thành công]` | Chốt ghế, xuất vé điện tử | `OCCUPIED` (Đã bán) |
| 6 | `OCCUPIED` | Rạp hủy suất sự cố | `[Sự cố phòng chiếu]` | Hoàn tiền 100%, mở lại ghế | `EMPTY` (Ghế trống) |

---

### 2. Sơ đồ Máy Trạng thái Vé xem phim (Ticket Lifecycle)

![Sơ đồ Trạng thái Vé xem phim]({assets_dir}/state_ticket.png)
*Hình 3.2: Sơ đồ Trạng thái Vòng đời Vé xem phim (Ticket State Machine)*

**Bảng Danh sách Biến cố Chuyển Trạng thái Vé:**
| STT | Trạng thái nguồn | Sự kiện kích hoạt | Điều kiện bảo vệ (Guard) | Hành động thực thi (Action) | Trạng thái đích |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `[*]` | Thanh toán thành công | `[Thanh toán hợp lệ]` | Sinh mã vé & QR code | `Valid` (Hợp lệ) |
| 2 | `Valid` | Nhân viên quét mã QR | `[Đúng phòng & đúng suất]` | Đóng dấu soát vé, cho vào rạp| `Used` (Đã sử dụng) |
| 3 | `Valid` | Khách tự hủy vé online | `[Trước giờ chiếu >= 60 phút]` | Cấp voucher bồi hoàn 50% | `Cancelled` (Đã hủy) |
| 4 | `Valid` | Rạp hủy vé do sự cố | `[Suất chiếu gặp sự cố]` | Hoàn tiền mặt 100% tại quầy | `Cancelled` (Đã hủy) |

---

### 3. Sơ đồ Máy Trạng thái Giao dịch Thanh toán (Payment Lifecycle)

![Sơ đồ Trạng thái Giao dịch Thanh toán]({assets_dir}/state_payment.png)
*Hình 3.3: Sơ đồ Trạng thái Giao dịch Thanh toán (Payment State Machine)*

**Bảng Danh sách Biến cố Chuyển Trạng thái Thanh toán:**
| STT | Trạng thái nguồn | Sự kiện kích hoạt | Điều kiện bảo vệ (Guard) | Hành động thực thi (Action) | Trạng thái đích |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `[*]` | Nhấn 'Thanh Toán' | `[Tổng tiền > 0]` | Sinh order_url ZaloPay Sandbox| `Pending` (Chờ TT) |
| 2 | `Pending` | ZaloPay gửi Webhook IPN | `[Xác thực HMAC-SHA256 đúng]` | Xác nhận tiền về, chốt vé | `Success` (Thành công) |
| 3 | `Pending` | Khách hủy / Quá hạn 15p | `[Hết hạn hoặc người dùng hủy]`| Hủy giao dịch, nhả ghế | `Failed` (Thất bại) |
| 4 | `Success` | Duyệt hoàn tiền sự cố | `[Admin duyệt sự cố rạp]` | Thực hiện Refund | `Refunded` (Đã hoàn tiền) |

---

### 4. Sơ đồ Máy Trạng thái Combo Bắp Nước (Combo Lifecycle)

![Sơ đồ Trạng thái Combo Bắp Nước]({assets_dir}/state_combo.png)
*Hình 3.4: Sơ đồ Trạng thái Vòng đời Combo Bắp Nước (2 Giai đoạn)*

**Bảng Danh sách Biến cố Chuyển Trạng thái Combo:**
| STT | Phân đoạn | Trạng thái nguồn | Sự kiện kích hoạt | Điều kiện bảo vệ (Guard) | Trạng thái đích |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | Giữ kho tạm | Chưa giữ kho | Chọn combo vào đơn | `[Tồn kho >= Số lượng]` | `RESERVED` (Giữ kho 10p) |
| 2 | Giữ kho tạm | `RESERVED` | Thanh toán đơn thành công | `[Payment Success]` | `CONFIRMED` (Trừ kho chính thức)|
| 3 | Giữ kho tạm | `RESERVED` | Hết hạn thanh toán / Hủy | `[Quá hạn 10 phút]` | `RELEASED` (Hoàn trả kho) |
| 4 | Nhận hàng | Chờ nhận hàng | Đơn vé thanh toán xong | `[isDelivered = false]` | Chờ nhận bắp nước tại quầy |
| 5 | Nhận hàng | Chờ nhận hàng | Nhân viên quầy bàn giao | `[Khách xuất trình hóa đơn]` | `ĐÃ NHẬN` (`isDelivered = true`) |

---

### 5. Sơ đồ Máy Trạng thái Suất chiếu (Screening Lifecycle)

![Sơ đồ Trạng thái Suất chiếu]({assets_dir}/state_screening.png)
*Hình 3.5: Sơ đồ Trạng thái Vòng đời Suất chiếu (Screening State Machine)*

**Bảng Danh sách Biến cố Chuyển Trạng thái Suất Chiếu:**
| STT | Trạng thái nguồn | Sự kiện kích hoạt | Điều kiện bảo vệ (Guard) | Hành động thực thi (Action) | Trạng thái đích |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `[*]` | Admin xếp lịch chiếu | `[Phòng & giờ không trùng]` | Tạo 50 ghế trống | `UPCOMING` (Sắp chiếu) |
| 2 | `UPCOMING` | Đến giờ chiếu (T_start) | `[Hiện tại >= start_time]` | Đóng đặt vé online | `SHOWING` (Đang chiếu) |
| 3 | `SHOWING` | Hết phim (T_end) | `[Hiện tại >= end_time]` | Dọn phòng cho suất sau | `ENDED` (Đã kết thúc) |
| 4 | `UPCOMING/SHOWING`| Hủy khẩn cấp sự cố | `[Sự cố kỹ thuật rạp]` | Hủy suất, hoàn tiền 100% | `CANCELLED` (Đã hủy) |

---

### 6. Sơ đồ Máy Trạng thái Phim (Movie Lifecycle)

![Sơ đồ Trạng thái Phim]({assets_dir}/state_movie.png)
*Hình 3.6: Sơ đồ Trạng thái Vòng đời Phim (Movie State Machine)*

**Bảng Danh sách Biến cố Chuyển Trạng thái Phim:**
| STT | Trạng thái nguồn | Sự kiện kích hoạt | Điều kiện bảo vệ (Guard) | Hành động thực thi (Action) | Trạng thái đích |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `[*]` | Admin tạo phim mới | `[Hồ sơ bản quyền hợp lệ]` | Cập nhật poster, trailer | `UPCOMING` (Sắp chiếu) |
| 2 | `UPCOMING` | Đến ngày khởi chiếu | `[Hiện tại >= release_date]` | Mở xếp suất chiếu chính thức | `SHOWING` (Đang chiếu) |
| 3 | `SHOWING` | Hết hạn công chiếu | `[Hiện tại >= end_date]` | Dừng xếp suất, đóng đặt vé | `ENDED` (Ngừng chiếu) |

---

## PHẦN IV: THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG (USER INTERFACE DESIGN)

> **Mô tả chi tiết cách thức giao tiếp giữa người sử dụng và phần mềm:**  
> Hệ thống giao tiếp qua nền tảng Web tương tác trực quan (Next.js 16 + TailwindCSS v4), định hình theo phong cách **Rạp Chiếu Phim Vũ Trụ (Cosmic Galaxy Cinema)**. Tỷ lệ thị giác vàng **60 - 30 - 10**: Không gian nền đen OLED `#050508` (60%), Bề mặt kính mờ tinh vân Nebula Glass (30%), Điểm nhấn thương hiệu đỏ nhung điện ảnh Velvet Red `#E11D48` & ánh sao tím `#C084FC` (10%). Triệt tiêu 100% emoji hoạt hình rườm rà.

---

### Màn hình Giao diện 1: Trang chủ & Cockpit Đặt vé nhanh (Homepage)

![Màn hình Trang chủ]({assets_dir}/ui_01_trang_chu.png)
*Hình 4.1: Màn hình Trang chủ LumiCinema & Buồng lái Đặt vé nhanh*

* **Nội dung:**
  * Thanh điều hướng vũ trụ (Cosmic Glass Navbar) cố định trên cùng: Logo Lumi Cinema, menu (Lịch chiếu, Phim, Bắp nước, Vé của tôi) và nút Đăng nhập / Đăng ký.
  * Banner tiêu điểm phim bom tấn: Tiêu đề cỡ lớn, nhãn công nghệ `✦ CÔNG NGHỆ CHIẾU VŨ TRỤ 4K · DOLBY ATMOS`, huy hiệu tuổi và nút CTA Đặt Vé.
  * Buồng lái đặt vé nhanh (Cockpit Quick Booking Bar): 3 bước chọn Phim -> Chọn Ngày -> Chọn Suất chiếu trong 1 click.
  * Danh mục phim đang khởi chiếu dạng lưới (Cosmic Film Cards) kèm điểm đánh giá sao vàng.
* **Hình thức trình bày:**
  * Bố cục Hero Asymmetric Grid (1.25 : 0.75), nền đen không gian OLED `#050508` kết hợp vệt tinh vân mờ ảo `blur: 40px`.
  * Khối buồng lái Cockpit nổi dạng kính mờ bán trong suốt `rgba(18, 14, 28, 0.75)`, viền sáng ánh sao mỏng. Nút CTA Đặt vé chuyển màu Velvet Red phát sáng.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Khách truy cập trang chủ (`/`) | Tải danh sách phim đang chiếu từ DB; render Banner tiêu điểm và thanh buồng lái Cockpit. | Hiển thị mặc định phim bom tấn có rating cao nhất. |
| 2 | Khách chọn Phim trong thanh Cockpit | Tự động lọc danh sách ngày chiếu và suất chiếu khả dụng tương ứng với phim đã chọn. | Bất đồng bộ, không tải lại trang. |
| 3 | Khách bấm nút 'Đặt Vé' trên buồng lái | Kiểm tra tính hợp lệ của suất chiếu; điều hướng người dùng tới màn hình sơ đồ ghế (`/screenings/[id]/seats`). | Nếu chưa chọn suất chiếu, nhắc nhở chọn đủ thông tin. |
| 4 | Khách bấm vào thẻ phim bất kỳ | Điều hướng đến trang Chi tiết phim (`/movies/[id]`) để xem trailer và lịch chiếu. | Chuyển trang mượt mà. |

---

### Màn hình Giao diện 2: Đăng nhập Phân quyền (Login & 1-Click Demo RBAC)

![Màn hình Đăng nhập]({assets_dir}/ui_02_dang_nhap.png)
*Hình 4.2: Màn hình Đăng nhập phân quyền với Bảng điền nhanh tài khoản 1-Click Demo*

* **Nội dung:**
  * Khung đăng nhập kính mờ trung tâm với 2 ô nhập liệu Email và Mật khẩu, nút ẩn/hiện mật khẩu, liên kết Đăng ký tài khoản mới.
  * BẢNG ĐIỀN NHANH TÀI KHOẢN PHÂN QUYỀN (1-CLICK FILL DEMO) tích hợp sẵn:
    * **Admin (Mã Gia Vỹ):** `giavyma265@gmail.com` · mật khẩu: `123456`
    * **Nhân Viên (Gia Vỹ):** `magiavy265@gmail.com` · mật khẩu: `123456`
    * **Khách Hàng Demo:** `khachhang@lumi.vn` · mật khẩu: `123456`
    * Danh sách nhân viên ca làm: Quách Kỳ Minh, Nguyễn Thị Ý, Vũ Châu M. Khôi, Huỳnh Tuấn Kiệt.
* **Hình thức trình bày:**
  * Bố cục 2 cột: Cột trái ảnh nghệ thuật điện ảnh, cột phải khung form kính mờ Glassmorphism (`backdrop-blur: 24px`).
  * Các nút 1-click fill demo dạng thẻ con nhộng bo tròn góc kèm viền phát sáng tương ứng với từng vai trò.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Khách bấm vào thẻ tài khoản Demo bất kỳ | Tự động điền chính xác Email và Mật khẩu tương ứng vào form; hiển thị Toast màu xanh. | Tiết kiệm 100% thời gian gõ tài khoản. |
| 2 | Khách bấm nút 'Đăng nhập' | Xác thực dữ liệu form; gọi NextAuth Credentials Provider so khớp mật khẩu Bcrypt. | Chặn gửi dữ liệu nếu để trống Email hoặc Mật khẩu. |
| 3 | Xác thực thành công | Cấp JWT chứa role; tự động điều hướng: Admin -> `/admin/dashboard`, Staff -> `/staff`, Khách -> `/`. | Thời gian chuyển hướng 500ms kèm Toast thành công. |
| 4 | Sai tài khoản hoặc mật khẩu | Hiển thị Toast cảnh báo đỏ 'Email hoặc mật khẩu không chính xác'; xóa trường mật khẩu. | Giữ nguyên Email đã nhập. |

---

### Màn hình Giao diện 3: Đăng ký Tài khoản Thành viên (Customer Sign Up)

![Màn hình Đăng ký]({assets_dir}/ui_03_dang_ky.png)
*Hình 4.3: Màn hình Đăng ký Thành viên Khách hàng Mới*

* **Nội dung:**
  * Form đăng ký tài khoản khách hàng mới: Họ và tên, Địa chỉ Email, Số điện thoại liên lạc, Mật khẩu và Xác nhận mật khẩu.
  * Điều khoản sử dụng và chính sách bảo mật Lumi Cinema, cùng liên kết chuyển hướng sang trang Đăng nhập.
* **Hình thức trình bày:**
  * Khối thẻ kính mờ đặt giữa màn hình với phông nền bụi sao li ti (Stardust), hiệu ứng phản chiếu ánh sáng khi hover.
  * Các ô nhập liệu có viền sáng chuyển màu khi focus và chỉ báo validation thời gian thực.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Người dùng nhập liệu các trường | Kiểm tra định dạng email hợp lệ, độ dài mật khẩu >= 6 ký tự, số điện thoại đúng chuẩn. | Validation thời gian thực ngay khi gõ. |
| 2 | Khách nhấn 'Đăng ký Tài khoản' | Kiểm tra trùng khớp mật khẩu; gọi API POST `/api/auth/register` kiểm tra tính duy nhất của Email. | Ngăn chặn tạo tài khoản trùng email. |
| 3 | Đăng ký thành công | Tạo bản ghi User mới với `role = 'CUSTOMER'`; hiển thị Toast thành công và chuyển sang trang Đăng nhập. | Khách hàng có thể đăng nhập ngay. |
| 4 | Email đã tồn tại | Hiển thị Toast cảnh báo lỗi 'Email này đã được đăng ký, vui lòng sử dụng email khác'. | Báo lỗi màu đỏ. |

---

### Màn hình Giao diện 4: Chi tiết Phim & Lịch chiếu (Movie Details & Showtimes)

![Màn hình Chi tiết Phim]({assets_dir}/ui_04_chi_tiet_phim.png)
*Hình 4.4: Màn hình Chi tiết Phim, Trailer & Lịch chiếu Suất chiếu*

* **Nội dung:**
  * Ảnh Backdrop khổ lớn, Poster tỷ lệ 2:3, Tiêu đề phim, Huy hiệu độ tuổi (C13, C16, C18, P), Thể loại, Thời lượng, Đạo diễn, Diễn viên, Đoạn tóm tắt nội dung.
  * Khung phát Trailer phim chất lượng cao.
  * Bộ lọc ngày xem phim và danh sách suất chiếu phân theo phòng chiếu (Cinema 01 - Cinema 04).
  * Khu vực Đánh giá & Bình luận của khán giả kèm hệ thống chấm điểm sao (Star Rating).
* **Hình thức trình bày:**
  * Bố cục điện ảnh Panorama với hình nền Backdrop mờ ảo phía sau, lớp phủ gradient tối đảm bảo độ tương phản hoàn hảo cho chữ trắng ngà.
  * Các khung giờ chiếu dạng thẻ con nhộng phát sáng viền tím khi hover, hiển thị rõ giờ bắt đầu, giờ kết thúc và định dạng phòng chiếu.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Truy cập đường dẫn `/movies/[id]` | Gọi API tải chi tiết phim, danh sách suất chiếu còn hiệu lực và đánh giá gần nhất. | Xử lý trạng thái tải nhẹ nhàng. |
| 2 | Khách chọn chuyển đổi ngày chiếu | Cập nhật danh sách khung giờ chiếu tương ứng với ngày được chọn mà không cần tải lại trang. | Lọc các suất chiếu chưa quá giờ chiếu. |
| 3 | Khách bấm vào một khung giờ chiếu | Điều hướng thẳng đến Màn hình Sơ đồ Ghế ngồi của suất chiếu đó (`/screenings/[id]/seats`). | Kiểm tra suất chiếu còn ghế trống hay không. |
| 4 | Khách gửi đánh giá & bình luận | Kiểm tra đăng nhập; gửi dữ liệu lên POST `/api/reviews`; cập nhật điểm trung bình của phim. | Chỉ người đã đăng nhập mới được đánh giá. |

---

### Màn hình Giao diện 5: Sơ đồ Chọn ghế Trực quan (Seat Map Selection)

![Màn hình Chọn ghế]({assets_dir}/ui_05_chon_ghe.png)
*Hình 4.5: Màn hình Sơ đồ Chọn ghế 50 Ghế & Đồng hồ Đếm ngược 10 Phút*

* **Nội dung:**
  * Thanh tiến trình 4 bước: [1. Chọn ghế -> 2. Loại vé -> 3. Combo & Thanh toán -> 4. Xác nhận].
  * Hộp đếm ngược thời gian giữ chỗ 10:00 phút với biểu tượng xoay vũ trụ `⏳`.
  * Màn hình chiếu phim uốn cong phát sáng (Curved Cinema Screen).
  * Ma trận 50 ghế ngồi (5 hàng A - E, mỗi hàng 10 ghế) phân theo màu sắc và loại ghế (Ghế thường, Ghế VIP, Ghế Đôi Sweetbox).
  * Khung tóm tắt danh sách ghế đã chọn, loại vé áp dụng và tổng tiền tạm tính.
* **Hình thức trình bày:**
  * Mô phỏng góc nhìn rạp phim từ trên cao hướng về màn hình cong rực rỡ. Ghế ngồi bo góc mềm mại, hiển thị rõ mã ghế (A1, C5, E10).
  * Hiệu ứng hào quang viền sáng khi ghế được chọn.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Khách nhấp vào ghế đang trống | Kiểm tra giới hạn <= 8 ghế; đổi màu ghế sang trạng thái Đang chọn; tính toán lại tổng tiền tạm tính. | Chặn không cho chọn quá 8 ghế trong 1 đơn. |
| 2 | Khách nhấp vào ghế đang chọn | Bỏ chọn ghế; trừ ghế khỏi danh sách đã chọn; cập nhật lại tổng tiền. | Cập nhật tức thời trên giao diện. |
| 3 | Khách bấm vào ghế đã bán | Hiển thị thông báo 'Ghế này đã có người đặt, vui lòng chọn ghế khác'; không cho phép chọn. | Ngăn chặn xung đột đặt vé. |
| 4 | Khách bấm nút 'Tiếp Tục Đặt Vé' | Gọi API POST `/api/screenings/[id]/reserve` để tạo khóa giữ chỗ 10 phút trong DB; chuyển sang bước chọn Combo. | Kích hoạt đồng hồ đếm ngược 10 phút. |
| 5 | Đồng hồ đếm ngược chạm mốc 00:00 | Khóa giữ chỗ hết hạn; hệ thống tự động giải phóng ghế về EMPTY và hiển thị Modal thông báo. | Bảo đảm quyền lợi cho khách hàng khác. |

---

### Màn hình Giao diện 6: Chọn Combo Bắp Nước & Thanh toán (Combo & Checkout)

![Màn hình Chọn Combo]({assets_dir}/ui_06_chon_combo.png)
*Hình 4.6: Màn hình Chọn Combo Bắp Nước Khuyến Mãi & Tóm tắt Thanh toán*

* **Nội dung:**
  * Danh mục các gói combo bắp nước cao cấp: Combo Solo, Combo Đôi, Combo Gia đình VIP, Bắp Caramel.
  * Bộ nút tăng giảm số lượng (+ / -) cho từng combo.
  * Ô nhập mã giảm giá Voucher khuyến mãi kèm nút Áp Dụng.
  * Bảng hóa đơn tổng kết: Tiền vé, Tiền combo, Số tiền giảm giá voucher và Tổng tiền thanh toán cuối cùng.
  * Nút bấm kích hoạt cổng thanh toán ZaloPay.
* **Hình thức trình bày:**
  * Bố cục 2 phần: Bên trái lưới hiển thị sản phẩm với hình ảnh chụp thực tế sắc nét; bên phải Hóa đơn Kính mờ (Glass Receipt) cố định theo màn hình khi cuộn.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Khách nhấn nút '+' hoặc '-' combo | Kiểm tra tồn kho khả dụng; cập nhật số lượng và tự động cộng dồn chi phí vào hóa đơn tổng. | Không cho phép chọn vượt quá tồn kho. |
| 2 | Khách nhập mã Voucher & nhấn 'Áp Dụng' | Kiểm tra điều kiện áp dụng, hạn dùng và số tiền tối thiểu; tính toán chiết khấu giảm giá vào tổng tiền. | Hiển thị số tiền tiết kiệm được màu xanh lá. |
| 3 | Nhập mã Voucher không hợp lệ | Hiển thị Toast cảnh báo lỗi 'Mã voucher không hợp lệ hoặc đã hết lượt dùng'. | Không áp dụng giảm giá. |
| 4 | Khách nhấn 'Thanh Toán Qua ZaloPay' | Gọi API POST `/api/payments/create-zalopay`; tạo đơn hàng bảo mật và điều hướng sang cổng ZaloPay Sandbox. | Khóa giữ chỗ combo 10 phút tương ứng. |

---

### Màn hình Giao diện 7: Bảng Điều Khiển Quản Trị Hệ Thống (Admin Bento Dashboard)

![Màn hình Quản trị Admin]({assets_dir}/ui_07_admin_dashboard.png)
*Hình 4.7: Màn hình Bảng điều khiển Quản trị Bento Grid Admin Dashboard*

* **Nội dung:**
  * Bảng chỉ số KPI thời gian thực: Tổng doanh thu hôm nay, Số lượng vé bán ra, Doanh thu bắp nước, Tỷ lệ lấp đầy rạp chiếu (Fill Rate %).
  * Biểu đồ cột trực quan thống kê doanh thu 7 ngày và 30 ngày gần nhất.
  * Giám sát trạng thái 4 phòng chiếu trực tiếp (Live Room Monitor): Đang chiếu phim gì, tiến độ thời lượng (%), số ghế đã bán / tổng 50 ghế.
  * Bảng xếp hạng Top phim ăn khách có doanh thu cao nhất.
  * Nút chức năng 'Hủy Suất Chiếu Khẩn Cấp' dành cho phòng gặp sự cố kỹ thuật.
* **Hình thức trình bày:**
  * Xu hướng Bento Grid hiện đại, chia các khối thông tin thành các ô kính mờ bo tròn góc mềm mại với viền mỏng ánh sao tím.
  * Số liệu quan trọng được in đậm cỡ lớn, các thanh tiến trình phòng chiếu dùng dải màu gradient sinh động.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Admin truy cập `/admin/dashboard` | Kiểm tra quyền `role === 'ADMIN'`; gọi API tải tổng hợp doanh thu, tỷ lệ lấp đầy và tình trạng phòng chiếu. | Chặn truy cập trái phép. |
| 2 | Bấm chuyển đổi mốc thời gian biểu đồ | Cập nhật dữ liệu biểu đồ doanh thu 7 ngày hoặc 30 ngày tương ứng kèm animation mượt mà. | Truy vấn bất đồng bộ tối ưu RAM. |
| 3 | Admin nhấn 'Hủy Khẩn Cấp Suất Chiếu' | Mở hộp thoại Modal xác nhận nguyên nhân sự cố (mất điện, hỏng máy chiếu, lỗi âm thanh). | Yêu cầu xác nhận cẩn trọng. |
| 4 | Admin xác nhận Hủy Khẩn Cấp | Gọi API chuyển suất chiếu sang CANCELLED; vô hiệu hóa vé; ghi nhận danh sách hoàn tiền mặt 100% cho khách tại quầy. | Ghi nhật ký kiểm toán hệ thống. |

---

### Màn hình Giao diện 8: Phân Hệ Quầy Dịch Vụ & Soát Vé Nhân Viên (Staff Portal)

![Màn hình Phân hệ Nhân viên]({assets_dir}/ui_08_nhan_vien_staff.png)
*Hình 4.8: Màn hình Phân hệ Quầy Dịch vụ & Soát vé Dành cho Nhân viên*

* **Nội dung:**
  * Cổng điều phối công việc dành riêng cho nhân viên rạp:
    1. **Quầy Bán Vé Nhanh POS tại chỗ:** Bán vé bằng tiền mặt / thẻ ngân hàng.
    2. **Soát vé vào phòng chiếu:** Quét mã QR hoặc nhập mã vé.
    3. **Quầy Giao nhận Combo bắp nước:** Bàn giao bắp nước đã đặt trước cho khách.
    4. **Xử lý hoàn tiền vé trực tiếp:** Bồi hoàn khi khách có yêu cầu hợp lệ.
* **Hình thức trình bày:**
  * Giao diện tối ưu hóa cho thao tác chạm trên màn hình cảm ứng POS tại quầy. Nút bấm cỡ lớn, phân màu rõ rệt giúp nhân viên thao tác nhanh trong giờ cao điểm mà không bị nhầm lẫn.
* **Biến cố phải xử lý:**
| STT | Điều kiện kích hoạt | Xử lý | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Nhân viên truy cập `/staff` | Kiểm tra quyền `role === 'STAFF'` hoặc `ADMIN`; hiển thị bảng điều khiển tác vụ quầy. | Bảo vệ tuyến đường bằng NextAuth Middleware. |
| 2 | Nhân viên chọn chức năng 'Soát Vé' | Mở camera quét mã QR hoặc form nhập mã vé; kiểm tra vé hợp lệ, đúng phòng chiếu và chưa qua sử dụng. | Đổi trạng thái vé sang 'Used' khi hợp lệ. |
| 3 | Nhân viên chọn 'Giao Nhận Combo' | Nhập mã hóa đơn đơn hàng của khách; hiển thị danh sách combo cần bàn giao; nhấn 'Xác Nhận Đã Giao'. | Đổi trạng thái `isDelivered = true`. |
| 4 | Nhân viên bấm 'Bán Vé Tại Quầy POS' | Chuyển sang giao diện POS chọn suất chiếu và in vé thanh toán tiền mặt tức thì. | Quy trình bán vé tại chỗ trong 30 giây. |

---

## KẾT LUẬN & ĐÁNH GIÁ TIẾN ĐỘ DỰ ÁN

Dự án Hệ thống Quản lý và Đặt vé Rạp chiếu phim LumiCinema đã hoàn thành xuất sắc các mục tiêu nghiên cứu và thiết kế đã đề ra, tuân thủ 100% chuẩn mực học thuật của Đồ án Môn học Phân tích & Thiết kế Hệ thống Thông tin (Trường Đại học Sài Gòn - SGU):
1. **Mô hình Dữ liệu Quan hệ (RDM):** Chuẩn hóa hoàn chỉnh 12 bảng thực thể và 16 mối quan hệ khóa ngoại đạt Dạng chuẩn 3 (3NF), đảm bảo tính toàn vẹn và triệt tiêu dư thừa dữ liệu.
2. **Sơ đồ Lớp (Class Diagram):** Thiết kế phân tầng 3 lớp (Entities, Services, Adapters) minh bạch, kiểm soát chặt chẽ nghiệp vụ rạp chiếu phim, giải quyết triệt để bài toán Concurrency và Double Booking.
3. **Sơ đồ Máy Trạng thái (State Diagrams):** Chuẩn hóa 6 sơ đồ trạng thái thuần Việt đạt chuẩn StrictUML, phản ánh chính xác từng chuyển biến của Ghế, Vé, Thanh toán, Combo, Suất chiếu và Phim.
4. **Thiết kế Giao diện (UI Design):** Đột phá với phong cách Vũ trụ Điện ảnh Cosmic Galaxy Cinema (tỷ lệ 60-30-10, OLED Deep Space, Kính mờ Nebula Glass, Velvet Red CTA), mang lại trải nghiệm xem phim và đặt vé đỉnh cao cho khán giả.
"""

with open(r'C:\Users\Giavy\.gemini\antigravity\brain\b9db38ea-788a-4998-b033-b7bc1f6ac3d1\bao_cao_tien_do_lumicinema.md', 'w', encoding='utf-8') as f:
    f.write(md)

with open(r'D:\cinema_project\docs\BAO_CAO_TIEN_DO_LUMICINEMA.md', 'w', encoding='utf-8') as f:
    f.write(md)

print("Markdown report created in both artifact directory and project docs!")
