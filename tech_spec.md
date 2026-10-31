# TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION - TECH SPEC)
## HỆ THỐNG QUẢN LÝ BÁN VÉ VÀ VẬN HÀNH RẠP PHIM (LUMI CINEMA)

---

### BẢNG THEO DÕI THAY ĐỔI (REVISION HISTORY)

| Phiên bản | Ngày | Tác giả | Nội dung thay đổi |
| :--- | :--- | :--- | :--- |
| **1.0** | 12/10/2026 | Nhóm Kỹ thuật Lumi Cinema | Xây dựng tài liệu đặc tả kiến trúc kỹ thuật chi tiết (Backend API, Data Model, Luồng xử lý, Bảo mật) dựa trên hệ thống thực tế |

---

## MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG & TECH STACK](#1-tổng-quan-hệ-thống--tech-stack)
2. [KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)](#2-kiến-trúc-hệ-thống-system-architecture)
3. [THIẾT KẾ CƠ SỞ DỮ LIỆU (DATA ARCHITECTURE & SCHEMA)](#3-thiết-kế-cơ-sở-dữ-liệu-data-architecture--schema)
4. [ĐẶC TẢ CHI TIẾT API BACKEND (API SPECIFICATION)](#4-đặc-tả-chi-tiết-api-backend-api-specification)
5. [CƠ CHẾ KỸ THUẬT VÀ THUẬT TOÁN CỐT LÕI (CORE ALGORITHMS & MECHANISMS)](#5-cơ-chế-kỹ-thuật-và-thuật-toán-cốt-lõi-core-algorithms--mechanisms)
6. [TÍCH HỢP HỆ THỐNG NGOẠI VI (EXTERNAL INTEGRATIONS)](#6-tích-hợp-hệ-thống-ngoại-vi-external-integrations)
7. [KIẾN TRÚC BẢO MẬT & KIỂM TOÁN (SECURITY & AUDIT)](#7-kiến-trúc-bảo-mật--kiểm-toán-security--audit)
8. [HƯỚNG DẪN MÔI TRƯỜNG & TRIỂN KHAI (ENVIRONMENT & DEPLOYMENT)](#8-hướng-dẫn-môi-trường--triển-khai-environment--deployment)

---

## 1. TỔNG QUAN HỆ THỐNG & TECH STACK

Hệ thống Quản lý Bán vé và Vận hành Rạp phim **Lumi Cinema** được xây dựng nhằm cung cấp giải pháp chuyển đổi số toàn diện cho mô hình rạp chiếu phim đơn lẻ (5 phòng chiếu, 50 ghế/phòng, tổng 250 ghế). Hệ thống xử lý đồng thời kênh bán trực tuyến (Online Customer Portal) và kênh bán trực tiếp tại rạp (POS Counter), bao gồm cả dịch vụ bắp nước (Combo) và đền bù vé.

### 1.1 Bảng công nghệ chi tiết (Technology Stack)

| Thành phần (Component) | Công nghệ / Thư viện (Tech/Lib) | Phiên bản | Vai trò & Lý do lựa chọn |
| :--- | :--- | :--- | :--- |
| **Backend Core** | Next.js App Router (Node.js runtime) | 16.3.6 | Khung ứng dụng Fullstack hiện đại, hỗ trợ Server Route Handlers tối ưu hiệu năng và dễ đóng gói. |
| **Ngôn ngữ** | TypeScript | 5.x | Kiểm soát kiểu dữ liệu tĩnh nghiêm ngặt (Strict typing), giảm thiểu lỗi runtime. |
| **ORM / Data Access** | Prisma Client | 6.19.3 | Type-safe Database Client, quản lý migration và transaction toàn vẹn cao. |
| **Database** | PostgreSQL on Supabase Cloud | 15+ | Cơ sở dữ liệu quan hệ mạnh mẽ, hỗ trợ Connection Pooling và ACID Transactions. |
| **Authentication** | NextAuth.js (Auth.js) | 4.24.15 | Cơ chế xác thực phân quyền RBAC đa vai trò (CUSTOMER, STAFF, ADMIN) với JWT session. |
| **Mật mã & Bảo mật** | `bcryptjs` + Node.js `crypto` | 3.0.3 | Mã hóa mật khẩu (salt round = 12) và sinh chữ ký số HMAC-SHA256 cho mã QR vé. |
| **Validation** | Zod | 4.6.5 | Xác thực schema dữ liệu đầu vào tại tất cả các Endpoint POST/PUT/PATCH. |
| **Thanh toán trực tuyến** | VNPay SDK / Mock IPN | v2.1.0 | Cổng thanh toán quốc gia, bảo mật chữ ký HMAC-SHA512 đối soát giao dịch. |
| **Email Service** | Nodemailer | 7.0.13 | Gửi hóa đơn vé điện tử và cấp voucher bồi hoàn qua SMTP. |
| **Media / Storage** | Cloudinary & Next-Cloudinary | 2.11.0 | Lưu trữ và phân phối hình ảnh poster phim, banner tốc độ cao qua CDN. |
| **Frontend Framework** | React 19 + Tailwind CSS | 19.x, v4 | UI Component hướng giao diện tối ưu trải nghiệm khách hàng và nhân viên. |

---

## 2. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống áp dụng mô hình kiến trúc phân tầng (Layered Architecture) linh hoạt, hỗ trợ cả 2 kịch bản vận hành:
1. **Next.js Fullstack (Mặc định trong `cinema-app`):** Frontend và Backend chạy chung trên cùng một instance Next.js thông qua Server Components và API Route Handlers.
2. **Decoupled Architecture (Tách rời Frontend & Backend):** Ứng dụng SPA riêng biệt (ví dụ thư mục `frontend` phát triển bằng Vite/React) có thể đóng vai trò Client thuần túy giao tiếp với Backend qua RESTful JSON APIs.

```mermaid
graph TD
    subgraph "Client Layer"
        WebCustomer["Khách hàng (Next.js / Vite Web)"]
        POSStaff["Nhân viên Quầy (POS Terminal)"]
        DashboardAdmin["Quản trị viên (Admin Panel)"]
    end

    subgraph "API Gateway & Application Server (Next.js App Router)"
        Middleware["Next.js Middleware (JWT RBAC Guard)"]
        
        subgraph "Route Handlers (src/app/api)"
            AuthAPI["/api/auth/*"]
            MoviesAPI["/api/movies/*"]
            ScreeningsAPI["/api/screenings/*"]
            SeatsAPI["/api/seats/*"]
            TicketsAPI["/api/tickets/*"]
            CombosAPI["/api/combos/*"]
            PaymentsAPI["/api/payments/*"]
            StaffAPI["/api/staff/*"]
            AdminAPI["/api/admin/*"]
            CronAPI["/api/cron/*"]
        end

        subgraph "Service & Helper Layer (src/lib)"
            PrismaLib["prisma.ts (DB Client Singleton)"]
            PricingLib["pricing.ts (Engine tính giá & phụ thu)"]
            EmailLib["email.ts (Nodemailer Worker)"]
            CloudinaryLib["cloudinary.ts (Asset Uploader)"]
            CryptoHelper["HMAC-SHA256 QR Generator"]
        end
    end

    subgraph "Data & External Infrastructure"
        SupabaseDB[("PostgreSQL Database (Supabase Cloud)")]
        VNPayGateway["Cổng thanh toán VNPay"]
        SMTPServer["Máy chủ Email SMTP"]
        CloudinaryCDN["Cloudinary Media Storage"]
    end

    WebCustomer -->|HTTPS / JSON| Middleware
    POSStaff -->|HTTPS / JSON| Middleware
    DashboardAdmin -->|HTTPS / JSON| Middleware

    Middleware --> Route Handlers
    Route Handlers --> Service & Helper Layer
    PrismaLib -->|Prisma Connection Pool| SupabaseDB
    PaymentsAPI -->|Redirect & Webhook IPN| VNPayGateway
    EmailLib -->|SMTP TLS| SMTPServer
    MoviesAPI -->|API v2| CloudinaryCDN
```

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATA ARCHITECTURE & SCHEMA)

Hệ thống sử dụng cơ sở dữ liệu quan hệ PostgreSQL với Prisma ORM. Toàn bộ các bảng được chuẩn hóa (3NF) để tránh dư thừa và đảm bảo tính toàn vẹn khóa ngoại.

### 3.1 Bảng định dạng Enums hệ thống

```prisma
enum Role {
  CUSTOMER
  STAFF
  ADMIN
}

enum MovieStatus {
  SHOWING   // Đang chiếu
  UPCOMING  // Sắp chiếu
  ENDED     // Ngừng chiếu (Soft delete)
}

enum ScreeningStatus {
  UPCOMING
  SHOWING
  ENDED
  CANCELLED // Đã bị hủy do sự cố
}

enum SeatType {
  STANDARD  // Ghế thường (mặc định cho phòng 50 chỗ)
  VIP       // Mở rộng tương lai
  COUPLE    // Mở rộng tương lai
}

enum SeatStatus {
  EMPTY     // Ghế trống
  RESERVED  // Ghế đang giữ tạm 10 phút
  OCCUPIED  // Ghế đã bán thành công
}

enum TicketStatus {
  Valid     // Còn hiệu lực
  Used      // Đã soát vé vào rạp
  Cancelled // Đã hủy (do khách hoặc do sự cố rạp)
}

enum DiscountType {
  Percentage   // Giảm theo % (VD: Voucher 50%)
  FixedAmount  // Giảm theo số tiền cố định
}

enum PaymentMethod {
  VNPay
  Momo
  Cash
  BankCard
}

enum PaymentStatus {
  Pending
  Success
  Failed
  Refunded
}

enum ComboStatus {
  ACTIVE
  DISABLED
}
```

### 3.2 Lược đồ các bảng dữ liệu cốt lõi (Core Tables)

#### Bảng `users` (Người dùng hệ thống)
*Khóa chính:* `user_id` (Int, Auto-increment).
*Mô tả:* Lưu thông tin người dùng. `CUSTOMER` đăng ký qua web, `STAFF` và `ADMIN` được seed sẵn.

| Cột (Column) | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `user_id` | Int | PK, Autoincrement | Mã định danh người dùng |
| `email` | VarChar(255) | Unique, Not Null | Email đăng nhập |
| `password` | VarChar(255) | Not Null | Mật khẩu băm bcrypt |
| `name` | VarChar(255) | Not Null | Họ và tên |
| `phone` | VarChar(20) | Nullable | Số điện thoại liên hệ |
| `role` | Role | Default: CUSTOMER | Vai trò trong hệ thống |
| `created_at` | DateTime | Default: NOW() | Thời điểm tạo |
| `updated_at` | DateTime | UpdatedAt | Thời điểm cập nhật cuối |

#### Bảng `movies` (Danh mục phim)
*Khóa chính:* `movie_id` (Int, Auto-increment).
*Ràng buộc nghiệp vụ:* Khi phim có phát sinh giao dịch vé, hệ thống chỉ đổi `status = ENDED`, không xóa vật lý khỏi database.

| Cột (Column) | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `movie_id` | Int | PK, Autoincrement | Mã định danh phim |
| `title` | VarChar(255) | Not Null | Tên phim |
| `slug` | VarChar(255) | Unique, Not Null | Đường dẫn thân thiện SEO |
| `description` | Text | Nullable | Tóm tắt nội dung phim |
| `duration` | Int | Not Null | Thời lượng phim (tính bằng phút) |
| `release_date`| DateTime | Not Null | Ngày khởi chiếu |
| `poster` | VarChar(500) | Nullable | Link ảnh poster Cloudinary |
| `genre` | VarChar(100) | Not Null | Thể loại phim |
| `rating` | Decimal(3,1) | Default: 0.0 | Điểm đánh giá trung bình từ khán giả |
| `age_rating` | VarChar(10) | Default: "P" | Nhãn tuổi kiểm soát vé trẻ em: P, C13, T18 |
| `status` | MovieStatus | Default: SHOWING | Trạng thái phát hành |

#### Bảng `screenings` (Suất chiếu)
*Khóa chính:* `screening_id` (Int, Auto-increment).
*Ràng buộc nghiệp vụ:* Hai suất chiếu cùng `room` không được trùng giao khoảng thời gian `[start_time, end_time]`.

| Cột (Column) | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `screening_id`| Int | PK, Autoincrement | Mã định danh suất chiếu |
| `movie_id` | Int | FK -> movies | Phim được chiếu |
| `room` | VarChar(50) | Not Null | Tên phòng chiếu ("Phòng 1" -> "Phòng 5") |
| `room_number` | Int | Nullable | Số phòng |
| `date` | DateTime | Not Null | Ngày chiếu |
| `start_time` | DateTime | Not Null | Giờ bắt đầu chiếu |
| `end_time` | DateTime | Not Null | Giờ kết thúc = start_time + duration |
| `price` | Decimal(10,2)| Not Null | Giá vé cơ bản của suất chiếu |
| `status` | ScreeningStatus | Default: UPCOMING | Trạng thái vận hành của suất chiếu |

#### Bảng `seats` (Sơ đồ ghế ngồi theo suất chiếu)
*Khóa chính:* `seat_id` (Int, Auto-increment).
*Mô tả:* Mỗi suất chiếu tự động khởi tạo 50 ghế (A1 -> E10).
*Index duy nhất:* `UNIQUE(screening_id, code)` tránh trùng lặp ghế.

| Cột (Column) | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `seat_id` | Int | PK, Autoincrement | Mã định danh vị trí ghế |
| `screening_id`| Int | FK -> screenings | Thuộc suất chiếu |
| `code` | VarChar(10) | Not Null | Mã ghế hiển thị (A1 -> E10) |
| `row` | VarChar(5) | Not Null | Hàng ghế (A, B, C, D, E) |
| `number` | Int | Not Null | Số thứ tự ghế (1 -> 10) |
| `type` | SeatType | Default: STANDARD | Phân loại ghế |
| `status` | SeatStatus | Default: EMPTY | Trạng thái (EMPTY, RESERVED, OCCUPIED) |
| `reserved_until`| DateTime | Nullable | Mốc thời gian hết hạn giữ chỗ 10 phút |

#### Bảng `tickets` (Vé đã đặt)
*Khóa chính:* `ticket_id` (Int, Auto-increment).
*Mô tả:* Lưu chi tiết từng vé lẻ. Hỗ trợ hủy độc lập từng vé trong cùng đơn hàng.

| Cột (Column) | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `ticket_id` | Int | PK, Autoincrement | Mã vé điện tử |
| `user_id` | Int | FK -> users | Chủ sở hữu vé |
| `screening_id`| Int | FK -> screenings | Thuộc suất chiếu |
| `seat_id` | Int | FK -> seats | Vị trí ghế |
| `payment_id` | Int | FK -> payments | Thuộc đơn thanh toán |
| `ticket_type` | VarChar(50) | Not Null | "Adult" (100%) hoặc "Child" (50%) |
| `price` | Decimal(10,2)| Not Null | Số tiền thực trả của vé sau giảm giá |
| `purchase_date`| DateTime | Default: NOW() | Ngày mua vé |
| `status` | TicketStatus | Default: Valid | Trạng thái vé (Valid, Used, Cancelled) |
| `cancellation_reason` | Text | Nullable | **Lý do hủy vé** (do khách tự hủy hoặc do sự cố rạp) |

#### Bảng `combos` & `order_combos` (Bắp nước & Chi tiết đặt combo)
- `combos`: `combo_id`, `name`, `description`, `price`, `stock`, `status`.
- `order_combos`: `order_combo_id`, `payment_id` (FK), `combo_id` (FK), `quantity`, `price`. Trạng thái theo dõi độc lập: `Chưa nhận` hoặc `Đã nhận`.

#### Bảng `coupons` (Mã giảm giá & Voucher bồi hoàn)
*Khóa chính:* `coupon_id` (Int, Autoincrement).
*Mô tả:* Chứa cả voucher khuyến mãi của rạp lẫn voucher bồi hoàn 50% tự sinh (`COMP50_[ticketId]_[random]`). Cột `user_id` gán riêng nếu là voucher đền bù cá nhân.

---

## 4. ĐẶC TẢ CHI TIẾT API BACKEND (API SPECIFICATION)

Toàn bộ phản hồi API của hệ thống tuân theo cấu trúc JSON quy chuẩn thông qua helper `apiResponse`:
```json
{
  "success": true,
  "data": { ... },
  "message": "Thông báo kết quả giao dịch",
  "error": null,
  "code": 200
}
```

### 4.1 Phân hệ Xác thực & Người dùng (Authentication)

#### `POST /api/auth/signup`
- **Mô tả:** Đăng ký tài khoản khách hàng mới (`Role: CUSTOMER`).
- **Phân quyền:** Public.
- **Request Body (JSON):**
  ```json
  {
    "email": "customer@example.com",
    "password": "Password123@",
    "name": "Nguyễn Văn A",
    "phone": "0901234567"
  }
  ```
- **Validation (Zod):**
  - `email`: Định dạng RFC 5322, kiểm tra trùng lặp qua `prisma.user.findUnique`.
  - `password`: Tối thiểu 6 ký tự. Hash bằng `bcryptjs.hash(password, 12)`.
  - `name`: Chuỗi không rỗng tối đa 255 ký tự.
  - `phone`: Tùy chọn, tối đa 20 ký tự.
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": { "id": 15, "email": "customer@example.com", "name": "Nguyễn Văn A", "role": "CUSTOMER" },
    "message": "Đăng ký tài khoản thành công"
  }
  ```
- **Mã lỗi:** `400` (Validation error), `409` (Email đã tồn tại).

#### `POST /api/auth/[...nextauth]`
- **Mô tả:** Endpoint NextAuth.js xử lý đăng nhập qua `CredentialsProvider`.
- **Cơ chế:** Kiểm tra email & so khớp `bcryptjs.compare`. Phiên lưu trữ bằng JWT có `maxAge: 86400` (24 giờ), chứa `{ id, email, name, role }`.

---

### 4.2 Phân hệ Phim & Upload Media (Movies & Upload)

#### `GET /api/movies`
- **Mô tả:** Lấy danh sách phim hiển thị ngoài trang chủ hoặc quản trị.
- **Query Params:**
  - `status`: `SHOWING` (mặc định), `UPCOMING`, `ENDED`, hoặc `ALL`.
  - `genre`: Lọc theo thể loại phim.
  - `search`: Tìm kiếm từ khóa theo tiêu đề phim.
- **Response `200 OK`:** Danh sách phim kèm số lượng suất chiếu đang mở.

#### `POST /api/movies`
- **Mô tả:** Thêm phim mới vào hệ thống.
- **Phân quyền:** Bắt buộc `ADMIN`.
- **Request Body (JSON):**
  ```json
  {
    "title": "Dune: Hành Tinh Cát - Phần 2",
    "description": "Hành trình báo thù của Paul Atreides...",
    "duration": 166,
    "release_date": "2026-03-01",
    "poster": "https://res.cloudinary.com/.../dune2.jpg",
    "genre": "Khoa học viễn tưởng, Hành động",
    "age_rating": "C13",
    "status": "SHOWING"
  }
  ```
- **Xử lý Backend:** Tự động sinh `slug` duy nhất từ tiêu đề phim (slugify).

#### `GET /api/movies/[id]`
- **Mô tả:** Lấy chi tiết thông tin bộ phim, bao gồm danh sách các suất chiếu sắp tới (`screenings`) và điểm đánh giá trung bình.

#### `PUT /api/movies/[id]`
- **Mô tả:** Cập nhật thông tin phim. `ADMIN` only.
- **Ràng buộc:** Cho phép cập nhật thông tin mô tả, poster, trạng thái (`SHOWING` -> `ENDED`).

#### `DELETE /api/movies/[id]`
- **Mô tả:** Xóa hoặc ngừng chiếu phim (`ADMIN` only).
- **Ràng buộc an toàn:** Nếu phim đã phát sinh suất chiếu hoặc vé trong DB, hệ thống từ chối xóa vật lý và tự động chuyển sang `status: ENDED` (Soft Delete).

#### `POST /api/movies/upload`
- **Mô tả:** Upload ảnh poster phim lên Cloudinary qua Server SDK an toàn.
- **Phân quyền:** STAFF, ADMIN.
- **Request Format:** `multipart/form-data` (field: `file`, `poster`, hoặc `image`).
- **Validation:** Giới hạn dung lượng $\le 5\text{MB}$, MIME type ảnh hợp lệ (`image/jpeg`, `image/png`, `image/webp`).
- **Response `200 OK`:** `{ "url": "https://res.cloudinary.com/.../poster.webp", "public_id": "..." }`.

---

### 4.3 Phân hệ Đánh giá Phim (Reviews)

#### `GET /api/reviews`
- **Mô tả:** Lấy danh sách đánh giá của phim.
- **Query Params:** `movie_id={id}` (bắt buộc đối với khách), hoặc `all=true` (ADMIN/kiểm toán).
- **Response `200 OK`:** Mảng review kèm tên người đánh giá, số sao, nội dung và thời điểm.

#### `POST /api/reviews`
- **Mô tả:** Đăng bài đánh giá hoặc cập nhật đánh giá phim.
- **Phân quyền:** Bắt buộc đăng nhập (`CUSTOMER`, `STAFF`, hoặc `ADMIN`). Không yêu cầu phải có vé đã xem.
- **Request Body (JSON):**
  ```json
  {
    "movie_id": 1,
    "rating": 5,
    "comment": "Kỹ xảo và âm thanh rất mãn nhãn!"
  }
  ```
- **Validation (Zod):** `rating` nguyên từ 1 đến 5 sao; `comment` tối đa 1000 ký tự.
- **Xử lý Backend:**
  - Tìm bản ghi đánh giá cũ theo `(userId, movieId)`. Nếu có -> Cập nhật; nếu chưa -> Tạo mới (`Upsert`).
  - Tự động gom nhóm toàn bộ review của phim này, tính toán điểm trung bình mới và cập nhật vào `movie.rating`.

#### `DELETE /api/reviews/[id]`
- **Mô tả:** Xóa đánh giá phim (Chính chủ xóa hoặc `ADMIN` kiểm duyệt xóa).

---

### 4.4 Phân hệ Suất chiếu & Sơ đồ Ghế (Screenings & Seats)

#### `GET /api/screenings`
- **Mô tả:** Lấy danh sách suất chiếu theo bộ lọc.
- **Query Params:** `movie_id`, `date` (YYYY-MM-DD), `room_number` (1 - 5).
- **Sắp xếp:** Thứ tự thời gian bắt đầu chiếu `startTime` tăng dần.

#### `POST /api/screenings`
- **Mô tả:** Tạo suất chiếu mới và tự động khởi tạo 50 ghế (A1 -> E10).
- **Phân quyền:** `ADMIN`.
- **Request Body (JSON):**
  ```json
  {
    "movie_id": 1,
    "room_number": 2,
    "screening_date": "2026-10-20",
    "screening_time": "19:30",
    "base_price": 100000
  }
  ```
- **Ràng buộc cốt lõi:**
  - `room_number` từ 1 đến 5 (tương ứng 5 phòng chiếu).
  - Tính `endTime = startTime + movie.duration`.
  - **Chống trùng phòng:** Truy vấn DB kiểm tra xem phòng đó có suất chiếu nào giao nhau trong khoảng `[startTime, endTime]` không. Nếu có -> báo lỗi `409 Conflict`.
  - Transaction nguyên tử: Tạo `Screening` đồng thời tạo 50 bản ghi `Seat` (Hàng A-E, Cột 1-10) trạng thái `EMPTY`.

#### `GET /api/screenings/[id]`
- **Mô tả:** Lấy thông tin chi tiết suất chiếu kèm toàn bộ 50 ghế ngồi và trạng thái thời gian thực.

#### `PUT /api/screenings/[id]`
- **Mô tả:** Chỉnh sửa thông tin suất chiếu (đổi giờ chiếu, giá vé cơ bản).

#### `DELETE /api/screenings/[id]`
- **Mô tả:** Hủy suất chiếu (`ADMIN` only). Nếu suất chiếu đã bán vé, phải kích hoạt quy trình xử lý sự cố.

#### `GET /api/seats?screening_id={id}`
- **Mô tả:** Truy xuất danh sách 50 ghế của suất chiếu (Mã ghế, hàng, số, loại, trạng thái `EMPTY`/`RESERVED`/`OCCUPIED`).

#### `POST /api/seats/reserve`
- **Mô tả:** Khóa giữ chỗ tạm thời trong 10 phút.
- **Phân quyền:** Khách hàng hoặc Nhân viên quầy.
- **Request Body (JSON):**
  ```json
  {
    "screening_id": 12,
    "seat_ids": [101, 102]
  }
  ```
- **Ràng buộc:** Tối đa 8 ghế/lần đặt.
- **Xử lý Backend:** Dùng `prisma.$transaction`: Dọn dẹp ghế hết hạn trước -> kiểm tra ghế có hoàn toàn trống không -> cập nhật `status: 'RESERVED'` và `reservedUntil: NOW() + 10 phút`.

#### `POST /api/seats/release`
- **Mô tả:** Chủ động mở khóa ghế khi người dùng đổi ý hoặc rời khỏi màn hình chọn ghế.

---

### 4.5 Phân hệ Bắp nước (Combos & Fulfillment)

#### `GET /api/combos`
- **Mô tả:** Lấy danh sách combo bắp nước kinh doanh (`status: ACTIVE`).
- **Phản hồi:** Thông tin combo kèm số lượng tồn kho khả dụng `stock`.

#### `POST /api/combos`
- **Mô tả:** Thêm combo bắp nước mới (`ADMIN` only).
- **Request Body:** `{ "name": "Combo Solo", "description": "1 Bắp ngọt + 1 Nước ngọt", "price": 85000, "stock": 100 }`.

#### `PUT /api/combos/[id]` & `DELETE /api/combos/[id]`
- **Mô tả:** Cập nhật giá, số lượng tồn kho hoặc ngừng kinh doanh combo.

#### `POST /api/combos/reserve`
- **Mô tả:** Khóa giữ chỗ số lượng combo trong kho tạm thời 10 phút đồng bộ cùng phiên chọn ghế.

#### `POST /api/combos/release`
- **Mô tả:** Hoàn lại kho số lượng combo khi phiên đặt vé bị hủy.

---

### 4.6 Phân hệ Khuyến mãi & Bảng giá (Coupons & Pricing)

#### `GET /api/coupons`
- **Mô tả:** Lấy danh sách mã giảm giá (`ADMIN` quản lý hoặc khách tra cứu voucher cá nhân).

#### `POST /api/coupons`
- **Mô tả:** Tạo mã voucher chiến dịch mới (`ADMIN` only).
- **Request Body (JSON):**
  ```json
  {
    "code": "LUMI2026",
    "discount_type": "Percentage",
    "discount_value": 20,
    "min_amount": 100000,
    "max_usage": 500,
    "expiry_date": "2026-12-31T23:59:59Z"
  }
  ```

#### `POST /api/coupons/validate`
- **Mô tả:** Kiểm tra và tính thử số tiền chiết khấu trước khi tiến hành thanh toán.
- **Request Body:** `{ "coupon_code": "LUMI2026", "total_amount": 200000, "movie_id": 1 }`.
- **Quy tắc:** Chỉ giảm giá trên tổng tiền vé xem phim, không áp dụng trên tiền bắp nước combo.

#### `GET /api/pricing`
- **Mô tả:** Truy xuất bảng tỷ lệ giá các loại vé (Thường: 100%, Trẻ em: 50%).

#### `PUT /api/pricing/[type]`
- **Mô tả:** Điều chỉnh tỷ lệ phần trăm hoặc giá cơ bản của từng loại vé (`ADMIN` only).

#### `GET /api/pricing/surcharges` & `POST /api/pricing/surcharges`
- **Mô tả:** Quản lý cấu hình các khoản phụ thu rạp: Phụ thu cuối tuần (Thứ 7, CN: +20,000đ), Suất chiếu muộn sau 20:00 (+15,000đ), Ngày Lễ/Tết (+30,000đ).

---

### 4.7 Phân hệ Thanh toán & Đặt vé (Payments & Tickets)

#### `POST /api/payments/initiate`
- **Mô tả:** Khởi tạo phiên thanh toán cho toàn bộ đơn hàng (Vé + Combo + Voucher).
- **Request Body (JSON):**
  ```json
  {
    "screening_id": 12,
    "seat_ids": [101, 102],
    "ticket_items": [
      { "type": "Adult", "quantity": 1 },
      { "type": "Child", "quantity": 1 }
    ],
    "combo_items": [
      { "combo_id": 1, "quantity": 2 }
    ],
    "coupon_code": "COMP50_105_7890",
    "payment_method": "VNPay"
  }
  ```
- **Xử lý Backend:**
  - Tính toán độc lập Server-side: `Tiền vé = calculateTicketPrice(basePrice, surcharges, type)`.
  - Áp dụng voucher hợp lệ.
  - Tạo bản ghi `Payment` với `status = Pending`.
  - Sinh URL thanh toán VNPay có ký băm SHA512 và trả về client.

#### `GET /api/payments/vnpay-return`
- **Mô tả:** Endpoint chuyển hướng khách hàng sau khi thanh toán trên cổng VNPay. Xác thực chữ ký và render giao diện kết quả.

#### `POST /api/payments/vnpay-ipn` & `GET /api/payments/vnpay-ipn`
- **Mô tả:** Webhook tiếp nhận tín hiệu tức thời từ cổng VNPay.
- **Xử lý nguyên tử (`prisma.$transaction`):**
  - Cập nhật `Payment` -> `Success`.
  - Sinh các bản ghi `Ticket` trạng thái `Valid`.
  - Khóa ghế ngồi sang `OCCUPIED`.
  - Trừ kho combo chính thức, tạo bản ghi `OrderCombo` trạng thái `Chưa nhận`.
  - Tự động sinh chữ ký số HMAC-SHA256 trên mã vé.
  - Gửi email xác nhận vé điện tử kèm mã QR cho khách hàng qua Nodemailer.

#### `GET /api/tickets`
- **Mô tả:** Lấy danh sách vé của khách hàng đang đăng nhập (hoặc toàn bộ vé nếu là `ADMIN`).

#### `GET /api/tickets/[id]`
- **Mô tả:** Lấy chi tiết vé điện tử: Thông tin phim, phòng, suất chiếu, ghế, người mua, mã QR (`qr_payload`) và lý do hủy (`cancellation_reason` nếu vé đã hủy).

#### `POST /api/tickets/[id]/cancel` (hoặc `DELETE /api/tickets/[id]`)
- **Mô tả:** Khách hàng tự hủy vé theo quy định BR-03.
- **Ràng buộc:** Vé thuộc chính chủ, `status === 'Valid'`, hủy trước giờ chiếu $\ge 2$ tiếng.
- **Xử lý Backend:**
  - Chuyển vé sang `Cancelled`.
  - Lưu `cancellationReason = "Khách hàng chủ động hủy vé trước giờ chiếu ít nhất 2 tiếng theo quy chế BR-03"`.
  - Trả ghế về `EMPTY`.
  - Cấp mã Voucher bồi hoàn giảm 50% (hạn 30 ngày) định dạng `COMP50_[ticketId]_[random]`.
  - Gửi email cấp voucher cho khách.

---

### 4.8 Phân hệ Nghiệp vụ Quầy & Sự cố (Staff POS & Incidents)

#### `GET /api/staff/tickets/search`
- **Mô tả:** Công cụ tra cứu vé đa năng cho nhân viên quầy và quản trị viên.
- **Phân quyền:** STAFF, ADMIN.
- **Query Params:** `q` (SĐT, Email, Mã vé dạng `#LMC-...`, Mã ghế `A1`, hoặc Tên khách), `status` (`Valid`, `Used`, `Cancelled`).

#### `PATCH /api/tickets/[id]/mark-used`
- **Mô tả:** Soát vé check-in vào phòng chiếu.
- **Ràng buộc:** Vé `Valid`, đúng suất chiếu, thời gian hiện tại nằm trong khoảng [30 phút trước giờ chiếu, hết suất chiếu].
- **Xử lý Backend:** Chuyển vé sang `status = Used`. Từ chối nếu quét lại.

#### `POST /api/staff/tickets/[id]/cancel-with-voucher`
- **Mô tả:** Hủy vé đặc quyền xử lý sự cố tại quầy (UC-15).
- **Phân quyền:** STAFF, ADMIN.
- **Request Body (JSON):**
  ```json
  {
    "reason": "Sự cố phòng chiếu / Hỏng máy chiếu",
    "issue_voucher": false,
    "notes": "Tiếp nhận hoàn tiền mặt 100% tại quầy"
  }
  ```
- **Xử lý Backend:**
  - Cho phép hủy vé bất kể mốc thời gian 2 tiếng.
  - Lưu `cancellationReason` và `notes` vào cột `cancellation_reason` trong bảng `tickets`.
  - Giải phóng ghế về `EMPTY`.
  - Ghi Audit Log kiểm toán ghi nhận ID nhân viên, lý do hủy và số tiền hoàn để kế toán đối soát.

---

### 4.9 Phân hệ Quản trị & Báo cáo Doanh thu (Admin Dashboard & Reports)

#### `GET /api/admin/dashboard`
- **Mô tả:** Tổng hợp các chỉ số hoạt động kinh doanh tổng quan cho ban quản lý.
- **Phân quyền:** `ADMIN` only.
- **Chỉ số tính toán:**
  - Hôm nay: Tổng doanh thu vé, doanh thu combo, tổng vé bán, tỷ lệ lấp đầy rạp (fill rate = số ghế bán / tổng sức chứa phòng * 100).
  - All-time: Top 5 bộ phim có doanh thu cao nhất, tổng doanh thu mọi thời đại, tổng suất chiếu.

#### `GET /api/admin/reports/revenue`
- **Mô tả:** Báo cáo chi tiết doanh thu và tỷ lệ lấp đầy theo từng suất chiếu (UC-19).
- **Phân quyền:** `ADMIN` only.
- **Query Params:** `from_date` (YYYY-MM-DD), `to_date` (YYYY-MM-DD), `movie_id`.
- **Dữ liệu trả về:** Doanh thu từng suất, số vé đã bán, số ghế trống, tỷ lệ lấp đầy %, thông tin phim và phòng chiếu.

#### `GET /api/health`
- **Mô tả:** Kiểm tra trạng thái hoạt động (Health check) của API Server và kết nối PostgreSQL database.

---

### 4.10 Phân hệ Tác vụ Nền Tự động (Cron Jobs)

#### `GET /api/cron/release-seats`
- **Mô tả:** Quét cơ sở dữ liệu và tự động trả các ghế `status = RESERVED` có `reservedUntil < NOW()` về trạng thái `EMPTY`.

#### `GET /api/cron/release-combos`
- **Mô tả:** Quét và giải phóng số lượng tồn kho combo của các phiên đặt hàng quá hạn 10 phút.

---

## 5. CƠ CHẾ KỸ THUẬT VÀ THUẬT TOÁN CỐT LÕI (CORE ALGORITHMS & MECHANISMS)

### 5.1 Thuật toán giữ ghế 10 phút & Chống bán trùng (Concurrency Control)
Để giải quyết bài toán hàng trăm khách hàng cùng lúc chọn một vị trí ghế trong giờ cao điểm:
1. Khi khách hàng bấm chọn ghế, client gửi request tới `/api/seats/reserve`.
2. Backend bọc thao tác trong Prisma Database Transaction với điều kiện nguyên tử:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const seat = await tx.seat.findFirst({
       where: { id: seatId },
     });
     
     const isLocked = seat.status === 'OCCUPIED' || 
       (seat.status === 'RESERVED' && seat.reservedUntil && new Date(seat.reservedUntil) > new Date());

     if (isLocked) {
       throw new AppError(409, `Ghế ${seat.code} đã có người giữ chỗ hoặc đã bán`);
     }

     return await tx.seat.update({
       where: { id: seatId },
       data: {
         status: 'RESERVED',
         reservedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
       },
     });
   });
   ```
3. Ở phía Client, component `CountdownTimer.tsx` khởi chạy bộ đếm lùi 600 giây. Sử dụng `useRef` để đảm bảo không bị re-render vòng lặp vô tận. Khi hết giờ, client xóa `sessionStorage` và tự động chuyển hướng người dùng về trang chủ.

### 5.2 Cơ chế sinh mã ký số HMAC-SHA256 chống giả mạo vé QR
Mã QR của vé không lưu ID dạng số thô sơ nhằm ngăn chặn hành vi chỉnh sửa URL hoặc tạo mã giả để vào rạp.
- **Payload ký:** `LMC-TICKET-{ticketId}-{userId}-{seatId}-{status}`
- **Thuật toán sinh chữ ký số:**
  ```typescript
  import crypto from 'crypto';

  export function generateTicketSignature(ticketId: number, userId: number, seatId: number | null, status: string): string {
    const secret = process.env.NEXTAUTH_SECRET || 'lumi_cinema_secret_salt';
    return crypto
      .createHmac('sha256', secret)
      .update(`LMC-TICKET-${ticketId}-${userId}-${seatId || 0}-${status}`)
      .digest('hex')
      .slice(0, 16);
  }
  ```
- **Dữ liệu nhúng trong QR Code:**
  ```json
  {
    "ticket_id": 105,
    "user_id": 12,
    "user_name": "Nguyen Van A",
    "movie_title": "Mai",
    "screening_id": 4,
    "room": "Phòng 1",
    "show_time": "2026-10-15T19:30:00.000Z",
    "seat_code": "C05",
    "ticket_type": "Adult",
    "price": 95000,
    "status": "Valid",
    "issued_at": "2026-10-12T10:00:00.000Z",
    "sig": "a4f8b2c1d9e3f7a1"
  }
  ```
Khi nhân viên quét QR tại cửa phòng chiếu, hệ thống băm lại dữ liệu và so sánh với trường `sig`. Nếu không khớp, vé bị báo động giả mạo ngay lập tức.

### 5.3 Engine tính giá vé và phân bổ chiết khấu (`pricing.ts`)
1. **Giá vé cơ bản:** Lấy theo cấu hình suất chiếu (`screening.price`).
2. **Hệ số độ tuổi:**
   - Vé Thường (`Adult`): Hệ số = 1.0 (100% giá cơ bản).
   - Vé Trẻ em (`Child`): Hệ số = 0.5 (50% giá cơ bản).
3. **Phân bổ Voucher:**
   - Nếu áp dụng Voucher bồi hoàn 50%: Trừ trực tiếp 50% trên giá trị của duy nhất 1 vé trong đơn hàng.
   - Nếu áp dụng Voucher chiến dịch toàn đơn: Tỷ lệ giảm giá được phân bổ đều theo tỷ trọng giá của từng vé để làm căn cứ hoàn tiền chính xác nếu đơn bị hủy từng phần.
   - Không áp dụng giảm giá trên tổng tiền combo bắp nước.

---

## 6. TÍCH HỢP HỆ THỐNG NGOẠI VI (EXTERNAL INTEGRATIONS)

### 6.1 Cổng thanh toán trực tuyến VNPay
- **Môi trường:** VNPay Sandbox API (Version 2.1.0).
- **Quy trình tích hợp:**
  1. *Khởi tạo giao dịch:* Server sinh tham số `vnp_TmnCode`, `vnp_Amount`, `vnp_CreateDate`, `vnp_CurrCode`, `vnp_IpAddr`, `vnp_Locale`, `vnp_OrderInfo`, `vnp_ReturnUrl`, `vnp_TxnRef`.
  2. Sắp xếp các tham số theo bảng chữ cái alphabet và tạo mã băm kiểm tra `vnp_SecureHash` bằng thuật toán HMAC-SHA512 với khóa bí mật `VNPAY_HASH_SECRET`.
  3. Client chuyển hướng sang cổng thanh toán VNPay.
  4. *Xử lý kết quả trả về (Return & IPN):* Khi thanh toán xong, VNPay gọi đồng thời Webhook IPN về server và redirect khách hàng về `vnp_ReturnUrl`. Server xác thực lại chữ ký số `vnp_SecureHash` trước khi ghi nhận thành công.

### 6.2 Dịch vụ Email thông báo (Nodemailer)
- **Cấu hình SMTP:** Tích hợp máy chủ thư điện tử (Gmail SMTP / SendGrid) qua cổng TLS 587.
- **Kịch bản gửi email:**
  1. Gửi vé điện tử xác nhận thanh toán (kèm mã vé, thông tin phòng chiếu và hướng dẫn check-in).
  2. Gửi mã Voucher bồi hoàn giảm 50% tự động khi khách hàng hoặc nhân viên hủy vé.
- Toàn bộ lời gọi gửi mail được thực thi bất đồng bộ dạng `fire-and-forget` (catch error ngầm), không chặn luồng response của giao dịch chính.

---

## 7. KIẾN TRÚC BẢO MẬT & KIỂM TOÁN (SECURITY & AUDIT)

### 7.1 Phân quyền Middleware RBAC (Role-Based Access Control)
Tập tin `src/middleware.ts` hoạt động ở tầng Edge chặn tất cả các request đến đường dẫn bảo vệ:
- `/admin/*`: Bắt buộc session có `user.role === 'ADMIN'`. Khách hàng hoặc nhân viên truy cập sẽ bị redirect về trang đăng nhập với mã lỗi `AccessDenied`.
- `/staff/*`: Cho phép cả `user.role === 'STAFF'` hoặc `user.role === 'ADMIN'`.
- `/tickets/*`, `/checkout/*`: Bắt buộc đã đăng nhập (`isAuthenticated === true`).

### 7.2 Quản trị và kiểm toán xử lý sự cố (Audit Trail)
Mọi tác vụ hủy vé, hoàn tiền mặt, phát hành voucher bồi hoàn của nhân viên tại quầy đều ghi log cấu trúc JSON ra console hệ thống và bảng ghi nhận, bao gồm:
- `staff_id`, `staff_role`: Danh tính người thực hiện thao tác.
- `ticket_id`, `customer_id`, `movie_title`, `seat_code`.
- `reason`: Lý do xử lý sự cố (Lỗi máy chiếu, mất điện, khách yêu cầu...).
- `timestamp`: Mốc thời gian chính xác theo chuẩn ISO 8601.

---

## 8. HƯỚNG DẪN MÔI TRƯỜNG & TRIỂN KHAI (ENVIRONMENT & DEPLOYMENT)

### 8.1 Biến môi trường bắt buộc (`.env` / `.env.local`)

```env
# Database Credentials (Supabase Cloud PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-strong-jwt-and-qr-secret-key-32-chars-min"

# VNPay Payment Gateway Sandbox
VNPAY_TMN_CODE="YOUR_TMN_CODE"
VNPAY_HASH_SECRET="YOUR_HASH_SECRET"
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="http://localhost:3000/api/payments/vnpay-return"

# Cloudinary Media Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# SMTP Email Notification Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-cinema-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Lumi Cinema <no-reply@lumi.vn>"
```

### 8.2 Các lệnh triển khai và kiểm thử hệ thống

```bash
# 1. Cài đặt toàn bộ thư viện phụ thuộc
npm install

# 2. Đồng bộ lược đồ cơ sở dữ liệu lên Supabase Cloud
npx prisma db push

# 3. Khởi tạo Prisma Client
npx prisma generate

# 4. Chạy kiểm tra tĩnh toàn bộ kiểu dữ liệu TypeScript
npx tsc --noEmit

# 5. Khởi chạy máy chủ phát triển (Development)
npm run dev

# 6. Đóng gói ứng dụng để đưa lên Production
npm run build
npm run start
```

---
*(Tài liệu Đặc tả Kỹ thuật hoàn tất - Phê duyệt cho Dự án Hệ thống Quản lý Rạp phim Lumi Cinema)*
