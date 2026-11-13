# TÀI LIỆU THIẾT KẾ GIAO DIỆN & KẾ HOẠCH TRIỂN KHAI: LUMI CINEMA - GALAXY COSMIC THEME (DESIGN.MD)

> **Mục tiêu:** Nâng cấp toàn diện giao diện người dùng (UI/UX) của hệ thống Lumi Cinema theo phong cách **Rạp Chiếu Phim Vũ Trụ (Cosmic Galaxy Cinema)**: Sang trọng, huyền bí, thời thượng và đặc biệt **dịu mắt** đối với người dùng khi duyệt web trong bóng tối.  
> **Nguyên tắc cốt lõi:** **TUYỆT ĐỐI KHÔNG ĐỤNG TỚI BACKEND**. Toàn bộ cấu trúc cơ sở dữ liệu (PostgreSQL / Prisma), Docker Compose, các API Routes (`/api/...`), logic ZaloPay Sandbox v2, quy tắc giữ chỗ 10 phút và chống Double Booking đều được giữ nguyên 100%.

---

## 1. BẢNG MÃ MÀU & THIẾT KẾ NGUYÊN BẢN (DESIGN SYSTEM TOKENS)

Hệ thống màu sắc được xây dựng theo tỷ lệ thị giác vàng **60 - 30 - 10**:

| Thành Phần | Tên Màu / Mã Hex | Tỷ Lệ | Mô Tả Trải Nghiệm Thị Giác |
| :--- | :--- | :---: | :--- |
| **Không Gian Nền (Cosmic Space)** | `#050508` & `#0A0812` | **60%** | Nền đen tuyền không gian sâu thẳm (OLED Deep Space), rải bụi sao li ti (Stardust), triệt tiêu ánh sáng xanh gây mỏi mắt. |
| **Tinh Vân Trầm (Nebula Atmosphere)** | `#581C87` (Tím dâu rừng) & `#881337` (Đỏ rượu vang) | — | Các vệt mây tinh vân lan tỏa mờ ảo (`blur: 35px - 50px`), tạo chiều sâu không gian đa chiều mềm mại. |
| **Bề Mặt Kính Mờ (Glass Surface)** | `rgba(18, 14, 28, 0.65)` | — | Kính mờ bán trong suốt (`backdrop-blur: 16px - 24px`), viền mỏng ánh sao `rgba(192, 132, 252, 0.2)`. |
| **Thương Hiệu & Nút CTA (Cinema Primary)** | `#E11D48` -> `#9F1239` (Velvet Red) | **30%** | Sắc đỏ nhung điện ảnh rực rỡ nhưng trầm ấm, mang đậm bản sắc Lumi Cinema, tương phản sắc nét trên nền tối. |
| **Điểm Nhấn Ánh Sao (Starlight & VIP)** | `#C084FC` (Ánh sao tím) & `#FDA4AF` (Hồng ngà) | **10%** | Điểm xuyết ở huy hiệu định dạng Laser 4K, điểm sao đánh giá phim, viền sáng nút hover. |
| **Kiểu Chữ (Typography)** | `#F8FAFC` (Chính) & `#94A3B8` (Phụ) | — | Chữ trắng ngà mềm dịu (Off-white), không dùng trắng thuần chói và loại bỏ các màu sặc sỡ gây rối mắt. |

### 1.1. Nguyên Tắc Thẩm Mỹ Tối Giản & Iconography (Icon Rules)
- **Triệt tiêu toàn bộ Emoji / Icon rườm rà:** Loại bỏ 100% tất cả các emoji hình vẽ hoạt hình khỏi toàn bộ giao diện hệ thống (Customer, Staff, Admin).
- **Ngoại lệ duy nhất:** Biểu tượng **Đồng hồ cát xoay vũ trụ (`⏳`)** với animation xoay 360° mềm mại (`@keyframes spinHourglass`) được sử dụng độc quyền cho hộp đếm ngược giữ chỗ 10 phút và trạng thái chờ chuyển suất chiếu / tải dữ liệu phòng.
- Mọi điểm nhấn thị giác được tạo nên bởi: Nghệ thuật sắp đặt chữ (Typography), tỷ lệ khoảng trống thở (Whitespace), các bề mặt kính mờ tinh vân (Nebula Glass) và hiệu ứng viền ánh sao mỏng.

---

## 2. ĐẶC TẢ CHI TIẾT TRANG CHÍNH (HOMEPAGE - TRANG CHỦ)

### 2.1. Thanh Điều Hướng Vũ Trụ (Cosmic Glass Navbar)
- **Vị trí:** Cố định trên cùng (`sticky top-0 z-50`).
- **Hiệu ứng:** Kính mờ vũ trụ `rgba(8, 6, 14, 0.75)`, `backdrop-blur: 20px`, viền dưới mỏng `rgba(192, 132, 252, 0.15)`.
- **Thành phần:**
  - **Logo:** `✦ LUMI` (Trắng bạc) + `CINEMA` (Gradient chữ Đỏ - Tím phát sáng).
  - **Menu Links:** Trang chủ, Lịch chiếu, Phim, Bắp nước, Vé của tôi (hiệu ứng hover ánh tím mềm).
  - **Auth Buttons:** Nút *Đăng nhập* (Kính tối mỏng) và *Đăng ký* (Gradient Đỏ nhung - Tím mận nổi bật).

### 2.2. Tâm Điểm Điện Ảnh Thiên Hà (Hero Cinema Showcase)
- **Cấu trúc:** Grid 2 cột bất đối xứng (1.25 : 0.75) đặt trên nền tinh vân vũ trụ.
- **Cột Trái (Nội Dung Phim Tiêu Điểm):**
  - Huy hiệu phát sáng: `✦ CÔNG NGHỆ CHIẾU VŨ TRỤ 4K · DOLBY ATMOS`.
  - Tiêu đề phim bom tấn cỡ lớn (`2.5rem`, font chữ điện ảnh đậm, đổ bóng sâu).
  - Đoạn giới thiệu gợi cảm xúc, hàng nhãn độ tuổi (`T18 / C13 / P`), thời lượng và điểm đánh giá sao vàng.
  - Cặp nút hành động: **[Đặt Vé Không Gian]** (Gradient Đỏ-Tím hào quang) và **[Xem Trailer]** (Kính mờ viền ánh sao).
- **Cột Phải (Poster Bay Lơ Lửng):**
  - Poster phim được bao bọc bởi **Vòng hào quang tinh vân (Nebula Aurora Ring)** chuyển màu mượt mà.
  - Khung poster kính bo tròn góc, huy hiệu định dạng nổi `✦ ORBITAL LASER` ở góc trên.

### 2.3. Buồng Lái Đặt Vé Nhanh (Cockpit Quick Booking Bar)
- **Thiết kế:** Thanh điều khiển buồng lái kính mờ nổi (`Cockpit Bar`) lơ lửng ngay dưới Hero.
- **Quy trình 3 bước trực quan:**
  - **Bước 1 (Chọn Phim):** Dropdown lọc nhanh danh sách 11 phim đang chiếu lấy trực tiếp từ database.
  - **Bước 2 (Chọn Ngày):** Dropdown chọn ngày chiếu (Hôm nay, Ngày mai, Cuối tuần).
  - **Bước 3 (Suất Chiếu & Phòng):** Chọn khung giờ và phòng chiếu (1 đến 5).
  - **Nút Mua Vé:** Nút kích hoạt nhanh đưa người dùng thẳng đến màn hình sơ đồ ghế trong 1 click.

### 2.4. Danh Mục Phim Đang Khởi Chiếu (Now Showing Nebula Grid)
- **Thanh lọc danh mục:** Tiêu đề kèm ngôi sao biểu tượng `✦ Phim Đang Khởi Chiếu`, bộ lọc con nhộng (Tất cả phim, Hành động, Kinh dị, Tâm lý, Hoạt hình).
- **Thẻ phim thiên hà (Cosmic Film Card):**
  - Tỷ lệ poster chuẩn 2:3 với nhãn tuổi gắn cố định góc trên trái.
  - Điểm đánh giá vàng góc dưới phải với nền kính mờ.
  - Tên phim in đậm, thông tin thể loại và thời lượng màu slate dịu mắt.
  - Nút **[Đặt Vé Nhanh]** với màu đỏ mận bán trong suốt, khi rê chuột (hover) sẽ bừng sáng viền tím dâu rừng.

### 2.5. Trụ Cột Trải Nghiệm Lumi Cinema (Cosmic Value Pillars)
- Băng thông tin 4 cột đặt ở chân trang chủ (thiết kế thẻ kính tinh vân, không dùng emoji hoạt hình):
  1. **Laser 4K Siêu Sắc Nét** - Độ tương phản vô cực chuẩn dải ngân hà.
  2. **Dolby Atmos Đa Chiều** - Âm thanh vòm bao bọc 360 độ không gian phòng chiếu.
  3. **Đặt Vé Trong 30 Giây** - Giữ chỗ tức thời 10 phút, thanh toán ZaloPay an toàn.
  4. **Bồi Hoàn Tự Động** - Cấp voucher đền bù tức thì nếu xảy ra sự cố rạp.

---

## 3. ĐẶC TẢ CHI TIẾT TẤT CẢ CÁC MÀN HÌNH CÒN LẠI TRONG HỆ THỐNG

### 3.1. Phân Hệ Khách Hàng (Customer Booking Flow)
1. **Trang Chi Tiết Phim (`/(customer)/movies/[id]`):**
   - **Ảnh nền Backdrop hòa quyện:** Dải banner ảnh rộng panorama chuyển gradient mềm chìm vào màn đêm vũ trụ.
   - **Poster Kính Nổi:** Hiệu ứng hào quang phát xung (`Nebula Pulse`).
   - **Hộp Đánh Giá Sao Pha Màu:** Điểm số ★ 4.9/5, danh sách bình luận thực tế, form gửi đánh giá 1–5 sao (BR-06).
   - **Lịch Chiếu Hôm Nay:** Phân chia theo ngày chiếu, nút giờ chiếu hiển thị số ghế trống dạng viên con nhộng.
2. **Sơ Đồ Chọn Ghế Vũ Trụ (`/(customer)/screenings/[id]/seats`):**
   - **Đồng hồ cát xoay vũ trụ (`⏳`):** Chạy hiệu ứng xoay 360° mềm mại (`@keyframes spinHourglass`) trên hộp đếm ngược 10 phút và khi loading dữ liệu.
   - **Màn Chiếu Cong Vô Cực (Laser Screen):** Vành đai ánh sáng laser đa sắc đỏ - tím.
   - **50 Ghế Chuẩn STANDARD (A1..E10):**
     - Ghế Trống (`EMPTY`): Viền tím dâu rừng, nền kính tối.
     - Ghế Đang Chọn (`RESERVED`): Bừng sáng hào quang Đỏ Nhung rực rỡ kèm đổ bóng neon.
     - Ghế Đã Bán (`OCCUPIED`): Màu xám mờ không gian kèm ký hiệu ✕.
   - **Thanh tổng tiền cố định chân trang:** Hiển thị ghế đã chọn (tối đa 8 ghế theo BR-01), phân loại Vé Thường / Trẻ em (BR-02), nút chuyển tiếp sang bước chọn combo.
3. **Trang Chọn Combo Bắp Nước (`/(customer)/screenings/[id]/checkout/combo`):**
   - Thẻ combo bắp nước dạng kính nổi với ảnh minh họa chất lượng cao (Solo, Couple, Gia đình).
   - Nút tăng giảm số lượng mượt mà, thông tin tồn kho thời gian thực, tự động cập nhật tổng đơn.
4. **Trang Thanh Toán Đơn Hàng (`/(customer)/screenings/[id]/checkout`):**
   - Tóm tắt hóa đơn trong suốt: Chi tiết vé + Chi tiết combo đã giữ tạm 10 phút.
   - Ô nhập mã Voucher: Kiểm tra tức thì mã chiến dịch hoặc voucher bồi hoàn `COMP50_` (BR-03).
   - Nút **[Thanh toán ZaloPay]**: Kích hoạt Modal quét mã QR ZaloPay Sandbox v2 với đồng hồ đếm ngược giao dịch.
5. **Trang Kết Quả Thanh Toán (`/(customer)/payment-result`):**
   - Thẻ thông báo giao dịch thành công / thất bại phong cách vũ trụ: Icon tick xanh ánh sao, mã đơn hàng, nút xem vé ngay.
6. **Trang Quản Lý Vé Của Tôi (`/(customer)/tickets` & `[id]`):**
   - Danh sách vé điện tử dạng **Thẻ Hologram Không Gian (Cosmic Boarding Pass)**.
   - Mã QR soát vé động được ký số bảo mật `HMAC-SHA256` (BR-09).
   - Nút hủy vé trước `>= 2 giờ` để nhận ngay voucher bồi hoàn 50% `COMP50_` (BR-03).

### 3.2. Phân Hệ Xác Thực Công Khai (Public Auth Flow)
1. **Trang Đăng Nhập (`/(public)/login`):**
   - Khung đăng nhập kính mờ (`backdrop-blur-2xl`) đặt giữa dải ngân hà với hiệu ứng bụi sao.
   - Ô nhập Email / Mật khẩu với viền neon phát sáng khi focus, nút đăng nhập gradient đỏ - tím.
2. **Trang Đăng Ký (`/(public)/signup`):**
   - Form tạo tài khoản thành viên với chuẩn hóa `email.toLowerCase().trim()`, kiểm tra mật khẩu an toàn, điều hướng mượt mà.

### 3.3. Phân Hệ Nhân Viên Rạp (Staff Operations Portal)
- **Triết lý Thiết Kế Cho Nhân Viên Làm Ca & Trong Bóng Tối:**
  - Môi trường quầy rạp thường tối hoặc ánh sáng yếu; giao diện sử dụng nền đen OLED `#050508` phối tinh vân tím dâu trầm dịu mắt, triệt tiêu ánh sáng xanh, chống mỏi mắt tuyệt đối khi làm việc liên tục.
  - **Kỹ thuật Loang Màu Tinh Vân Đa Tầng (Multi-layered Nebula Mesh Gradients & Cosmic Auras):**
    - Các thẻ panel sử dụng kính mờ cao cấp (`backdrop-blur: 24px`, nền `rgba(15, 11, 25, 0.8)` kết hợp `radial-gradient` loang màu góc `rgba(136, 19, 55, 0.25)` và `rgba(88, 28, 135, 0.3)`).
    - Thẻ suất chiếu đang chọn: Loang chuyển sắc từ Đỏ nhung `#E11D48` (35%) sang Tím dâu rừng `#581C87` (45%), viền bừng sáng đổ bóng neon 28px.
    - Sơ đồ 50 ghế: Màn chiếu cong phát sáng dải laser đa sắc tím - đỏ (`box-shadow: 0 0 30px rgba(225, 29, 72, 0.85)`). Ghế đang chọn bừng sáng Hologram Đỏ Nhung với viền hồng ngà `#FDA4AF`.
    - Thẻ combo bắp nước: Nền loang màu tinh vân tím mận, nút tăng giảm `+` `-` kính tối bán trong suốt.
    - Phiến kính Hóa đơn thu ngân: Tỏa quầng hào quang tinh vân phía sau, tổng tiền to bản màu trắng ngà tỏa sáng dịu, 2 nút bấm quyền lực:
      - Nút **[Xác Nhận In Vé & Thu Tiền Mặt]**: Gradient loang màu Đỏ nhung $\rightarrow$ Đỏ rượu vang (`#E11D48` $\rightarrow$ `#881337`) với viền ánh sáng và đổ bóng neon 45px.
      - Nút **[Quét ZaloPay QR Tại Quầy]**: Kính mờ viền tím ánh sao.
  - **Kỷ luật màu chữ nghiêm ngặt (Strict Color Discipline):** Loại bỏ hoàn toàn các màu chữ sặc sỡ (xanh lá chói, vàng chói lọi, cam). Chỉ sử dụng:
    - Tiêu đề, tên phim, số tiền: Trắng ngà dịu `#F8FAFC`.
    - Nhãn phụ, mô tả, giờ chiếu: Xám Slate `#94A3B8`.
    - Điểm nhấn hành động: Đỏ nhung `#E11D48` và Tím dâu rừng `#581C87` / Ánh sao `#C084FC`.
  - **Tuyệt đối không dùng emoji hình vẽ hoạt hình:** Tất cả nút bấm và thông số thể hiện bằng Typography sắc nét, tỉ lệ khối cân đối và viền kính mờ bán trong suốt. Biểu tượng đồng hồ cát `⏳` xoay 360° là ngoại lệ duy nhất ở hộp giữ chỗ 10 phút.
- **Tích hợp 3 Màn Hình Nghiệp Vụ Nhân Viên (Tabbed Cosmic Terminal):**
  - **Tab 1: Quầy Bán Vé & Combo (POS Terminal - `/staff/pos`):** Buồng lái thu ngân 3 bước (Suất chiếu $\rightarrow$ Sơ đồ ghế $\rightarrow$ Combo $\rightarrow$ Hóa đơn tự động & In vé / ZaloPay).
  - **Tab 2: Soát Vé QR Laser (`/staff/lookup`):** Khung camera tối giản với tia quét laser đỏ nhung di chuyển mượt mà (`@keyframes laserSweep`), ô nhập mã vé dự phòng, thẻ kết quả `VÉ HỢP LỆ (VALID)` viền xanh ngọc tinh vân và nút xác nhận cho khách vào rạp.
  - **Tab 3: Kệ Giao Bắp Nước (`/staff/combos`):** Danh sách đơn hàng bắp nước thời gian thực phân biệt trạng thái qua hiệu ứng loang màu và độ mờ kính (Đang Chuẩn Bị vs Đã Giao).

### 3.4. Phân Hệ Quản Trị Hệ Thống (Admin Galactic Bento Command Deck)
- **Triết lý Thiết Kế Bento Grid Vũ Trụ (Cosmic Bento Architecture):**
  - Áp dụng triết lý thiết kế Bento Grid hiện đại theo chuẩn `ui-styling`: Phân chia màn hình thành các khối thẻ kính mờ có kích thước và tỷ lệ bất đối xứng cân bằng (Asymmetric Balanced Bento), giúp người quản trị nắm bắt toàn bộ tình trạng vận hành rạp chiếu trong một ánh nhìn.
  - Sử dụng đồng bộ dải màu Cosmic chuẩn: Nền đen OLED `#050508` phủ bụi sao Stardust li ti, các khối Bento kính mờ (`backdrop-blur: 24px`) với kỹ thuật loang màu đa tầng (Multi-layered Mesh Gradients) góc tím dâu `#581C87` và đỏ rượu vang `#881337`.
- **Sidebar Trạm Chỉ Huy Tối Giản (Cosmic Minimalist Nav - Không Dùng Emoji):**
  - Loại bỏ hoàn toàn 9 emoji vẽ hoạt hình cũ (`📊, 🎬, 🎭, 🎫, 💰, 🎟️, 🍿, 📈, ⭐`).
  - Sử dụng nghệ thuật chữ thanh lịch (Off-white `#F8FAFC` cho active, Xám Slate `#94A3B8` cho inactive) kết hợp vạch sáng Laser Đỏ nhung (`#E11D48`) thẳng đứng phát sáng viền khi mục menu được kích hoạt.
  - Logo `✦ LUMI ADMIN` góc trên với huy hiệu neon đỏ rượu vang sang trọng.
- **Bố Cục Bento Grid Chi Tiết (`/admin/dashboard`):**
  1. **Khối Hero Bento 2x2: Trạm Giám Sát 5 Phòng Chiếu Thời Gian Thực (Live Room Pods):**
     - Đóng vai trò là khối điểm nhấn lớn nhất (Hero Bento) chiếm vị trí trung tâm.
     - Bên trong chia thành **5 Buồng Chiếu Kính Mờ (Cosmic Room Pods)** với hào quang loang màu theo trạng thái vận hành:
       - *Đang Chiếu (`SHOWING`):* Viền hào quang Đỏ nhung `#E11D48` phát xung nhẹ, thanh tiến độ thời lượng phim chạy realtime, số ghế lấp đầy.
       - *Chờ Dọn Dẹp 15 Phút (`CLEANING` - BR-08):* Viền Tím dâu rừng `#A78BFA` kèm biểu tượng đồng hồ cát xoay `⏳` và bộ đếm ngược 15 phút.
       - *Sẵn Sàng (`READY`):* Viền ánh sao bạc dịu mắt, đèn tín hiệu xanh ngọc sẵn sàng mở đón khách.
       - Nút bấm an toàn: *[Hủy Suất Chiếu Khẩn Cấp]* yêu cầu xác nhận 2 bước để kích hoạt quy trình tự động bồi hoàn 100% tiền và cấp voucher đền bù theo BR-04/BR-05.
  2. **Hàng 4 Khối Bento KPI Tài Chính Hôm Nay (BR-10 Metrics):**
     - *Tổng Doanh Thu Hệ Thống:* Thẻ kính mờ loang màu đỏ nhung, số tiền to bản màu trắng ngà.
     - *Doanh Thu Vé Xem Phim:* Thẻ kính mờ loang màu tím dâu rừng.
     - *Doanh Thu Bắp Nước & Combo:* Thẻ kính mờ ánh sao, hiển thị số combo đã bán.
     - *Tỷ Lệ Lấp Đầy Rạp:* Thẻ kính mờ phần trăm lấp đầy và tổng số ghế đang sử dụng.
  3. **Khối Bento Biểu Đồ Doanh Thu & Lượng Vé (Cosmic Revenue Bar Chart):**
     - Cột đồ thị mang dải gradient loang màu Đỏ nhung $\rightarrow$ Tím dâu rừng phát sáng dịu (`box-shadow: 0 0 12px rgba(225,29,72,0.4)`), có bộ lọc chuyển đổi 7 ngày / 30 ngày dạng viên nhộng kính mờ.
  4. **Khối Bento Top 5 Phim Doanh Thu Cao Nhất (Top Box Office Pod):**
     - Thẻ kính thẳng đứng với ảnh poster phim sắc nét, số thứ tự kim loại tối giản (1, 2, 3, 4, 5), thời lượng phim, số vé đã bán và doanh thu to bản màu trắng ngà.
  5. **Khối Bento Thống Kê Toàn Thời Gian (All-Time Lifetime Overview):**
     - Lũy kế tổng doanh thu toàn hệ thống và tổng số vé đã xuất từ khi thành lập.
- **Quản Trị Danh Mục & Dữ Liệu (`/admin/movies`, `/admin/screenings`, `/admin/combos`, `/admin/pricing`, `/admin/coupons`, `/admin/reviews`):**
  - Các bảng dữ liệu (Data Tables) dạng thẻ kính vũ trụ loang màu, các nút thao tác nhanh (Thêm, Sửa, Xóa, Đổi giá) với viền neon mỏng, không dùng emoji thừa.

---

## 4. KẾ HOẠCH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION PLAN - WRITING PLAN)

Kế hoạch được chia thành 4 giai đoạn độc lập, có thể chạy song song hoặc tuần tự:

### Giai đoạn 1: Thiết Lập Nền Tảng Design Tokens & Trang Chủ (Milestone 1 - Homepage)
- [ ] **Bước 1.1:** Cập nhật biến màu Galaxy trong `cinema-app/src/app/globals.css` (Nền OLED `#050508`, gradient Đỏ nhung `#E11D48`, Tím dâu rừng `#581C87`, bụi sao Stardust, keyframes `spinHourglass` và `pulseAura`).
- [ ] **Bước 1.2:** Thiết kế lại Component `Navbar.tsx` và `Footer.tsx` sang phong cách Kính Mờ Thiên Hà (`Cosmic Glass`).
- [ ] **Bước 1.3:** Nâng cấp toàn diện `cinema-app/src/app/page.tsx`:
  - Khu vực Hero Showcase phim bom tấn kèm quầng sáng tinh vân.
  - Thanh chọn vé buồng lái nhanh (Cockpit Quick Booking Bar).
  - Lưới phim đang chiếu kết nối trực tiếp dữ liệu thật từ Prisma `findMany`.
  - Băng 4 trụ cột công nghệ Lumi Cinema.

### Giai đoạn 2: Nâng Cấp Luồng Đặt Vé Khách Hàng (Milestone 2 - Customer Flow)
- [ ] **Bước 2.1:** Nâng cấp trang Chi Tiết Phim (`cinema-app/src/app/(customer)/movies/[id]/page.tsx`):
  - Banner ảnh rộng hòa quyện không gian, poster hào quang xung nhịp, bảng đánh giá sao và danh sách suất chiếu hôm nay.
- [ ] **Bước 2.2:** Nâng cấp trang Chọn Ghế (`cinema-app/src/app/(customer)/screenings/[id]/seats/page.tsx`):
  - Màn chiếu cong phát sáng, đồng hồ cát xoay `⏳` 10 phút, sơ đồ 50 ghế `A1..E10` chuẩn Galaxy.
- [ ] **Bước 2.3:** Nâng cấp trang Chọn Combo & Thanh Toán (`/checkout/combo`, `/checkout/page.tsx`, `/payment-result/page.tsx`):
  - Giao diện thẻ combo bắp nước, ô nhập voucher, modal quét QR ZaloPay Sandbox.
- [ ] **Bước 2.4:** Nâng cấp trang Quản Lý Vé Của Tôi (`cinema-app/src/app/(customer)/tickets/page.tsx` & `[id]/page.tsx`):
  - Thẻ vé Hologram không gian và mã QR HMAC-SHA256.

### Giai đoạn 3: Nâng Cấp Giao Diện Xác Thực & Nghiệp Vụ Nhân Viên (Milestone 3 - Auth & Staff)
- [ ] **Bước 3.1:** Trang Đăng Nhập (`/login/page.tsx`) & Đăng Ký (`/signup/page.tsx`): Form kính mờ giữa dải ngân hà với hiệu ứng bụi sao.
- [ ] **Bước 3.2:** Trang Quầy POS Nhân Viên (`cinema-app/src/app/staff/pos/page.tsx`):
  - Buồng lái thu ngân 3 bước loang màu tinh vân (Chọn suất chiếu $\rightarrow$ Sơ đồ 50 ghế $\rightarrow$ Combo bắp nước $\rightarrow$ Phiến kính hóa đơn tự động & In vé / ZaloPay).
  - Tích hợp đồng hồ cát xoay `⏳` cho thời gian giữ chỗ 10 phút.
- [ ] **Bước 3.3:** Trang Soát Vé & Giao Combo (`/staff/lookup/page.tsx`, `/staff/combos/page.tsx`):
  - Khung camera soát vé với hiệu ứng tia laser quét dọc (`@keyframes laserSweep`), thẻ kết quả hợp lệ viền xanh ngọc tinh vân.
  - Kệ giao bắp nước thời gian thực phân biệt trạng thái đơn hàng qua độ mờ kính.

### Giai đoạn 4: Nâng Cấp Giao Diện Bảng Điều Khiển Quản Trị (Milestone 4 - Admin Portal)
- [ ] **Bước 4.1:** Layout quản trị chung `cinema-app/src/app/admin/layout.tsx` & `AdminSidebar.tsx`:
  - Sidebar Kính Tinh Vân Tối Giản (Cosmic Minimalist Nav) - xóa sạch 100% cả 9 emoji hình vẽ cũ, dùng chữ thanh lịch (Off-white / Slate) với vạch sáng Laser Đỏ nhung khi active.
- [ ] **Bước 4.2:** Dashboard Tổng Quan Bento Grid (`/admin/dashboard/page.tsx`):
  - Khối Hero Bento 2x2: Trạm Giám Sát 5 Buồng Chiếu (Cosmic Room Pods) với hào quang loang màu theo trạng thái (Đang chiếu, Chờ dọn dẹp 15 phút kèm đồng hồ cát `⏳`, Sẵn sàng, Hủy suất chiếu sự cố BR-04).
  - Hàng 4 thẻ KPI tài chính chuẩn BR-10 loang màu đa sắc (Đỏ nhung $\rightarrow$ Tím dâu rừng).
  - Khối Biểu đồ Doanh thu với cột đồ thị loang màu phát sáng và bộ lọc 7 ngày / 30 ngày.
  - Khối Top 5 Phim doanh thu cao nhất xếp dọc và Khối Lũy kế toàn thời gian.
- [ ] **Bước 4.3:** Quản trị Danh mục & Nghiệp vụ (`/admin/movies`, `/admin/screenings`, `/admin/combos`, `/admin/pricing`, `/admin/coupons`, `/admin/reviews`, `/admin/reports`):
  - Bảng dữ liệu kính vũ trụ với các thao tác nhanh, modal kính mờ tinh vân.
- [ ] **Bước 4.4:** Kiểm tra xác minh toàn diện (Build production `npm run build`, test suite, kiểm tra độ mượt mà, phản hồi dịu mắt và đảm bảo 100% không đụng backend).
