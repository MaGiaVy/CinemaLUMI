
## PHẦN 1: PHÂN HỆ XÁC THỰC, ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT & PHÂN QUYỀN RBAC (18 CÂU)
*(Tập trung chuyên sâu vào NextAuth.js, JWT, Bcrypt, Middleware Edge Guard, Thu hồi Session & Phân quyền đa vai trò)*

---

### Câu 1: Tại sao hệ thống lại lựa chọn NextAuth.js với chiến lược JWT Strategy (`session: { strategy: 'jwt' }`) thay vì Database Session hay Redis Session? Phân tích ưu và nhược điểm trong bài toán rạp phim.
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng hiểu kiến trúc quản lý phiên làm việc (Session Management), khả năng mở rộng (Scalability) và chi phí tài nguyên máy chủ khi rạp chiếu có lượng truy cập tăng vọt trong giờ cao điểm mở bán vé bom tấn.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do lựa chọn (Ưu điểm):**
    1. *Stateless Architecture (Không lưu trạng thái):* JWT chứa sẵn thông tin định danh (`id`, `email`, `role`). Server Next.js khi nhận request chỉ cần dùng khóa bí mật `NEXTAUTH_SECRET` để giải mã và kiểm tra chữ ký số mà không cần thực hiện thêm một truy vấn `SELECT` vào database để đọc bảng session. Điều này giảm tải từ 30% - 50% số lượng truy vấn I/O lên cơ sở dữ liệu Supabase PostgreSQL trong giờ cao điểm.
    2. *Tương thích hoàn hảo với Serverless / Edge Runtime:* Next.js App Router triển khai middleware trên Vercel/Node Edge Runtime; việc giải mã JWT bằng thư viện nhẹ diễn ra cực nhanh (< 2ms) ngay tại tầng biên mạng (Edge), không bị phụ thuộc vào kết nối TCP tới máy chủ DB.
    3. *Tiết kiệm chi phí hạ tầng:* Không phải tốn chi phí thuê và duy trì cụm Redis Cache độc lập cho bài toán rạp chiếu phim quy mô đơn lẻ (5 phòng chiếu).
  - **Nhược điểm & Biện pháp khắc phục của hệ thống:**
    - *Khó thu hồi token tức thì (Revocation):* Nếu tài khoản bị khóa hoặc đổi quyền, token cũ vẫn có hiệu lực cho đến khi hết hạn `maxAge` (24 giờ). Lumi Cinema khắc phục bằng cách: Tại các API nhạy cảm (thanh toán, duyệt hoàn tiền, hủy suất chiếu), hệ thống vẫn truy vấn trực tiếp DB để kiểm tra trạng thái tài khoản thời gian thực.

---

### Câu 2: Khi người dùng nhấn nút "Đăng xuất" (Logout), token JWT vẫn còn hạn sử dụng (ví dụ maxAge 24 giờ). Kẻ tấn công nếu có được token này trước đó thì vẫn gọi được API. Hệ thống Lumi Cinema xử lý bài toán vô hiệu hóa phiên làm việc này như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu bản chất của JWT vô trạng thái (Stateless). Giảng viên muốn "bắt bài" sinh viên xem có nghĩ rằng gọi `signOut()` phía client là token trên server đã tự hủy hay không.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thực tế hoạt động của NextAuth `signOut()`:** Hàm `signOut()` của NextAuth thực hiện gửi request xóa sạch cookie phiên làm việc (`next-auth.session-token`) trên trình duyệt người dùng và xóa bộ nhớ đệm client.
  - **Lỗ hổng tiềm ẩn:** Về mặt lý thuyết mật mã học của JWT thuần túy, token đã phát hành vẫn hợp lệ về mặt toán học cho đến hết timestamp `exp` (24 giờ).
  - **Giải pháp bảo vệ thực tế của hệ thống Lumi Cinema:**
    1. *Lưu trữ trong Cookie `HttpOnly; Secure; SameSite=Lax`:* Token không bị phơi bày ra Javascript (chống mã độc XSS đánh cắp trực tiếp từ `localStorage`). Do đó khi đăng xuất, cookie bị xóa là người dùng thông thường hoàn toàn kết thúc phiên.
    2. *Thời hạn sống hợp lý:* Đặt `maxAge: 24 * 60 * 60` (24 giờ), không duy trì token vô thời hạn.
    3. *Định hướng nâng cấp chuẩn Enterprise (Khi giảng viên hỏi sâu):* Triển khai kỹ thuật **Token Blacklist / Revocation List trên Redis** hoặc lưu một trường `tokenVersion` / `passwordChangedAt` trong bảng `users`. Mỗi khi có request đến API nhạy cảm, so khớp `token.version` với `user.tokenVersion` trong DB; khi user logout hoặc đổi mật khẩu thì tăng biến đếm này lên 1 để vô hiệu hóa toàn bộ token cũ.

---

### Câu 3: Trong file `src/middleware.ts`, tại sao bạn lại cấu hình bỏ qua toàn bộ API Routes (`if (pathname.startsWith('/api')) return NextResponse.next()`)? Nếu vậy thì ai sẽ bảo vệ các endpoint nhạy cảm như `/api/admin/*` hay `/api/staff/*`?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ cơ chế phân tách trách nhiệm giữa Tầng điều hướng Giao diện (Page Routing Middleware) và Tầng xử lý Dịch vụ API (API Route Handlers), tránh nhầm lẫn giữa việc chuyển hướng trang (Redirect) và trả về lỗi chuẩn RESTful API (JSON Response).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do thiết kế kiến trúc:**
    1. *Middleware đóng vai trò Page Guard:* Nếu người dùng dùng trình duyệt truy cập một trang giao diện như `/admin/dashboard` mà chưa đăng nhập, Middleware sẽ bắt và điều hướng (HTTP 307/302 Redirect) về trang `/login?callbackUrl=...`.
    2. *API Routes cần phản hồi chuẩn JSON (RESTful):* Nếu Middleware tự động Redirect một request API gọi bằng AJAX/Fetch (ví dụ: `POST /api/movies`), trình duyệt phía client sẽ nhận về mã HTTP 307 kèm nội dung là trang HTML của màn hình đăng nhập, dẫn đến lỗi Javascript parsing JSON (`Unexpected token < in JSON at position 0`).
  - **Cơ chế bảo vệ thực tế của API Endpoints:**
    - Toàn bộ các API Route Handlers trong `src/app/api/...` tự chịu trách nhiệm bảo vệ bằng cách gọi:
      ```typescript
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'ADMIN') {
        throw new AppError(403, 'Chỉ Quản trị viên mới có quyền thực hiện', 'FORBIDDEN');
      }
      ```
    - Cơ chế này đảm bảo API trả về đúng mã trạng thái HTTP chuẩn: `401 Unauthorized` (chưa đăng nhập) hoặc `403 Forbidden` (sai quyền) kèm payload JSON cấu trúc thống nhất.

---

### Câu 4: Mật khẩu người dùng được lưu trữ như thế nào trong cơ sở dữ liệu? Tại sao trong `bcrypt.hash(password, 12)` bạn lại chọn salt rounds = 12 mà không phải 8 hay 16? Chi phí tính toán ảnh hưởng thế nào đến hiệu năng máy chủ?
- **Trọng tâm kiểm tra của Giảng viên:** Kiến thức an toàn thông tin, hàm băm một chiều (One-way Hashing), muối (Salt) và sự cân bằng giữa tính bảo mật và hiệu năng xử lý của CPU máy chủ (Computational Cost Trade-off).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cách thức lưu trữ:** Tuyệt đối không lưu Plain text. Mật khẩu được băm qua thuật toán **Bcrypt** thông qua thư viện `bcryptjs`. Chuỗi băm trong DB có dạng `$2a$12$...` chứa: định danh thuật toán (`$2a$`), số vòng muối (`12`), chuỗi salt ngẫu nhiên 22 ký tự và giá trị băm 31 ký tự.
  - **Lý do chọn Salt Rounds = 12:**
    1. *Khả năng chống tấn công Brute-force & Rainbow Table:* Thuật toán Bcrypt là thuật toán dạng Key-stretching, độ phức tạp tính toán tăng theo cấp số nhân $2^{	ext{cost}}$. Với cost = 12, số lần lặp băm là $2^{12} = 4096$ lần. Một máy tính chuyên dụng bẻ khóa mật khẩu bằng GPU sẽ mất vài trăm mili-giây cho một lần thử, biến các cuộc tấn công vét cạn hàng triệu mật khẩu thành bất khả thi về mặt kinh tế và thời gian.
    2. *Thời gian phản hồi máy chủ hợp lý:* Chi phí tính toán mất khoảng 250ms - 350ms trên CPU tiêu chuẩn (đáp ứng tiêu chuẩn khuyến nghị của OWASP cho ứng dụng Web hiện đại). Nếu chọn cost = 8 (quá nhanh, dễ bị bẻ khóa), còn nếu chọn cost = 16 (mất tới 4 - 8 giây cho 1 lần băm, làm nghẽn Event Loop của Node.js khi hàng trăm user đăng nhập cùng lúc).

---

### Câu 5: Hãy chỉ rõ sự khác biệt giữa Xác thực (Authentication) và Phân quyền (Authorization) trong kiến trúc mã nguồn của Lumi Cinema. Chúng được hiện thực ở những tầng nào?
- **Trọng tâm kiểm tra của Giảng viên:** Khái niệm nền tảng trong an ninh phần mềm và cách tổ chức code thực tế trong đồ án.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Xác thực (Authentication - "Bạn là ai?"):**
    - *Mục đích:* Nhận diện danh tính của người dùng thông qua thông tin đăng nhập hợp lệ.
    - *Vị trí hiện thực:* File [`src/lib/auth.ts`](file:///d:/cinema_project/cinema-app/src/lib/auth.ts) trong hàm `authorize()` của `CredentialsProvider`. Hệ thống tìm user qua email, kiểm tra `bcrypt.compare(password, user.password)`. Nếu đúng, cấp phát JWT chứa `id`, `email`, `role`.
  - **Phân quyền (Authorization - "Bạn được phép làm gì?"):**
    - *Mục đích:* Kiểm soát quyền hạn truy cập tài nguyên dựa trên vai trò (`CUSTOMER`, `STAFF`, `ADMIN`) theo mô hình RBAC.
    - *Vị trí hiện thực:*
      1. *Tầng Giao diện / Routing:* File [`src/middleware.ts`](file:///d:/cinema_project/cinema-app/src/middleware.ts) chặn truy cập theo URL (`/admin/*` -> chỉ ADMIN; `/staff/*` -> STAFF và ADMIN; `/tickets/*` -> mọi user đã đăng nhập).
      2. *Tầng Dịch vụ / Controller API:* Từng file `route.ts` kiểm tra `session.user.role` trước khi thực thi nghiệp vụ (ví dụ: `POST /api/movies` kiểm tra role ADMIN; `PATCH /api/tickets/[id]/mark-used` kiểm tra role STAFF/ADMIN).
      3. *Tầng Component UI:* Điều kiện ẩn/hiện nút bấm, menu quản trị trên thanh Header dựa vào hook `useSession()`.

---

### Câu 6: Tại sao hệ thống chỉ mở form đăng ký công khai cho vai trò `CUSTOMER`, còn vai trò `STAFF` và `ADMIN` lại phải seed trực tiếp vào database mà không có trang đăng ký?
- **Trọng tâm kiểm tra của Giảng viên:** Quy trình bảo mật vận hành thực tế (Operational Security) và việc phòng chống leo thang đặc quyền (Privilege Escalation).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Nguyên tắc an toàn thông tin:** Tài khoản Staff và Admin nắm giữ các đặc quyền nhạy cảm: duyệt hoàn tiền mặt quỹ rạp, hủy suất chiếu, chỉnh sửa giá vé, xem báo cáo doanh thu tài chính.
  - **Rủi ro nếu mở form đăng ký có chọn quyền:** Kẻ xấu có thể can thiệp payload request HTTP (`{"role": "ADMIN"}`) để tự tạo tài khoản quản trị tối cao (Lỗ hổng Mass Assignment / Insecure Role Assignment).
  - **Thiết kế của Lumi Cinema:**
    1. Endpoint `POST /api/auth/signup` bị gán cứng (Hardcoded) `role: 'CUSTOMER'` khi tạo bản ghi trong Prisma:
       ```typescript
       await prisma.user.create({
         data: { ...data, role: 'CUSTOMER' }
       });
       ```
    2. Nhân viên và Quản trị viên chỉ được cấp tài khoản thông qua quy trình quản trị nội bộ: Chạy mã Seed dữ liệu ban đầu (`prisma/seed.ts`) hoặc do Admin tạo trực tiếp trong CSDL nội bộ có hợp đồng lao động và trách nhiệm pháp lý rõ ràng.

---

### Câu 7: Nếu một nhân viên (STAFF) bị Ban giám đốc thu hồi quyền hoặc giáng chức xuống khách hàng trong khi họ đang đăng nhập làm việc, token JWT của họ có tự động mất hiệu lực ngay lập tức không? Xử lý thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý tình huống không đồng bộ dữ liệu giữa JWT Payload và Database State (Stale Claims in JWT).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Bản chất kỹ thuật:** Do JWT được lưu ở client và có tính chất vô trạng thái, chuỗi token đó vẫn mang thuộc tính `role: 'STAFF'` cho đến khi hết hạn 24 giờ. Về mặt giao diện, nhân viên này vẫn có thể bấm xem màn hình POS.
  - **Giải pháp bảo vệ nhiều lớp của Lumi Cinema:**
    1. *Ở các tác vụ thông thường:* Token giúp giảm tải việc truy vấn DB liên tục.
    2. *Ở các tác vụ nhạy cảm (Tạo giao dịch tiền mặt, hủy vé, soát vé):* Trong Backend API Route Handlers, hệ thống không chỉ tin tưởng mù quáng vào JWT mà thực hiện truy vấn trực tiếp DB:
       ```typescript
       const currentUser = await prisma.user.findUnique({ where: { id: token.id } });
       if (!currentUser || currentUser.role !== 'STAFF') {
         throw new AppError(403, 'Tài khoản của bạn đã bị thu hồi quyền nhân viên!');
       }
       ```
    3. Nhờ cơ chế này, ngay khi database được cập nhật vai trò mới, lệnh thao tác nhạy cảm tiếp theo của nhân viên sẽ bị từ chối ngay lập tức với mã lỗi `403 Forbidden`.

---

### Câu 8: Tại sao trong hàm đăng ký (`/api/auth/signup`) và đăng nhập (`src/lib/auth.ts`), email luôn được xử lý `toLowerCase().trim()` trước khi truy vấn? Hậu quả gì xảy ra nếu không chuẩn hóa?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý chuẩn hóa dữ liệu đầu vào (Input Sanitization), kiểm soát tính duy nhất (Uniqueness) và trải nghiệm người dùng trên thiết bị di động.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do thực tế:**
    1. *Bàn phím ảo trên Smartphone (iOS/Android):* Khi người dùng gõ email trên điện thoại, hệ điều hành thường tự động viết hoa chữ cái đầu tiên (Ví dụ: `Nguyenan@gmail.com` thay vì `nguyenan@gmail.com`) hoặc tự động chèn khoảng trắng ở cuối chuỗi.
    2. *Tính phân biệt hoa thường trong PostgreSQL:* Kiểu dữ liệu `VARCHAR` trong PostgreSQL theo mặc định phân biệt chữ hoa và chữ thường (Case-sensitive) khi so sánh dấu bằng (`=`).
  - **Hậu quả nếu không chuẩn hóa:**
    - Người dùng đăng ký bằng `User@gmail.com` nhưng khi đăng nhập gõ `user@gmail.com` thì hệ thống sẽ báo "Email không tồn tại".
    - Một kẻ xấu có thể đăng ký 2 tài khoản trùng nhau về mặt ngữ nghĩa: `admin@lumi.vn` và `Admin@lumi.vn`, gây xung đột tài khoản và sai lệch lịch sử giao dịch.
  - **Cách Lumi Cinema xử lý:** Gọi `email.toLowerCase().trim()` tại tất cả các điểm tiếp nhận dữ liệu trước khi đưa vào Prisma ORM.

---

### Câu 9: Trong NextAuth callback `jwt` và `session`, bạn đã đính kèm những trường thông tin nào vào token? Tại sao tuyệt đối không được đưa mật khẩu (kể cả mật khẩu đã băm) hay số CCCD vào JWT payload?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu bản chất mã hóa của JWT (Base64Url Encoding không phải là Encryption) và nguyên tắc bảo vệ quyền riêng tư dữ liệu (Data Privacy / Principle of Least Privilege).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thông tin được đưa vào Session của Lumi Cinema:**
    - Chỉ lưu 4 trường tối thiểu: `id`, `email`, `name`, `role` (Xem chi tiết tại [`src/lib/auth.ts#L51-L56`](file:///d:/cinema_project/cinema-app/src/lib/auth.ts#L51-L56)).
  - **Lý do tuyệt đối không đưa thông tin nhạy cảm vào JWT:**
    1. *JWT chỉ được KÝ SỐ (Signed), KHÔNG ĐƯỢC MÃ HÓA (Encrypted):* Phần Payload của JWT chỉ được mã hóa dạng Base64Url. Bất kỳ ai có chuỗi token đều có thể copy vào trang web `jwt.io` và đọc được toàn bộ nội dung bản rõ chỉ trong 1 giây mà không cần biết khóa bí mật `NEXTAUTH_SECRET`.
    2. *Nguy cơ lộ chuỗi băm mật khẩu (Hash Exposure):* Nếu đưa chuỗi băm Bcrypt vào JWT, kẻ gian có thể lấy được chuỗi băm này và dùng kỹ thuật tấn công ngoại tuyến (Offline Cracking) với từ điển mật khẩu khổng lồ mà máy chủ không hề hay biết.
    3. *Kích thước Header HTTP phình to:* Mỗi request gửi lên máy chủ đều mang theo cookie chứa token. Càng nhồi nhét nhiều thông tin, dung lượng network request càng nặng, làm chậm tốc độ tải trang.

---

### Câu 10: Hệ thống có cơ chế gì để phòng chống tấn công Brute-force (dò mật khẩu) hoặc Credential Stuffing tại các endpoint xác thực không? Hướng xử lý ở cấp độ hạ tầng / ứng dụng?
- **Trọng tâm kiểm tra của Giảng viên:** Tư duy phòng thủ chiều sâu (Defense-in-depth) và bảo vệ hệ thống trước các công cụ dò quét tự động.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cấp độ Ứng dụng (Application Level):**
    - Trả về thông báo lỗi chung chung: Tại màn hình đăng nhập, khi sai email hoặc sai mật khẩu, hệ thống trả về thông báo trung tính: *"Email hoặc mật khẩu không chính xác"*, không chỉ rõ cụ thể là "Email không tồn tại" nhằm ngăn chặn kẻ tấn công dò quét danh sách email người dùng (User Enumeration).
  - **Cấp độ Hạ tầng & Mở rộng (Rate Limiting):**
    - Áp dụng cơ chế **Rate Limiting** dựa trên địa chỉ IP client (ví dụ: thư viện `upstash/ratelimit` hoặc Nginx Reverse Proxy / Cloudflare WAF). Quy định: Không quá 5 lần thử đăng nhập thất bại trong vòng 15 phút cho một IP.
    - Sau 5 lần thất bại liên tiếp: Tạm khóa đăng nhập từ IP đó trong 30 phút hoặc kích hoạt Captcha (Google reCAPTCHA v3 / Cloudflare Turnstile).

---

### Câu 11: Khi một khách hàng chưa đăng nhập cố tình truy cập vào URL `/admin/dashboard`, luồng xử lý của Middleware diễn ra như thế nào? Tham số `callbackUrl` được sử dụng để làm gì?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ vòng đời của request qua Middleware trong Next.js và trải nghiệm người dùng khi bị chuyển hướng (Redirect UX).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Luồng xử lý từng bước (Theo code [`src/middleware.ts#L75-L89`](file:///d:/cinema_project/cinema-app/src/middleware.ts#L75-L89)):**
    1. Khách hàng gửi request HTTP GET tới `/admin/dashboard`.
    2. `middleware.ts` bắt request tại tầng Edge trước khi bất kỳ Page Component nào được render.
    3. Gọi `getToken({ req, secret })` để trích xuất cookie phiên.
    4. *Trường hợp chưa đăng nhập (`!isAuthenticated`):* Middleware khởi tạo URL chuyển hướng tới `/login`, gắn tham số `callbackUrl=%2Fadmin%2Fdashboard` và `error=Unauthenticated`. Trả về mã phản hồi `HTTP 307 Temporary Redirect`.
    5. *Trường hợp đã đăng nhập nhưng vai trò là `CUSTOMER`:* Middleware kiểm tra `userRole !== 'ADMIN'`. Lập tức chuyển hướng về `/login?error=AccessDenied`.
  - **Ý nghĩa của tham số `callbackUrl`:**
    - Lưu lại trang đích ban đầu mà người dùng muốn vào. Khi người dùng nhập đúng tài khoản có quyền hợp lệ tại trang Login, hệ thống sẽ tự động điều hướng người dùng quay trở lại đúng trang `/admin/dashboard` thay vì đẩy về trang chủ, giúp tiết kiệm thao tác của người dùng.

---

### Câu 12: Một tài khoản khách hàng hoặc nhân viên có thể đăng nhập đồng thời trên nhiều trình duyệt/thiết bị khác nhau không? Nghiệp vụ rạp chiếu phim có cần bắt buộc Single Session (đăng nhập máy mới thì kích máy cũ ra) không?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng liên hệ giữa đặc thù nghiệp vụ kinh doanh rạp phim và các giải pháp kỹ thuật quản trị phiên làm việc.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Đối với Khách hàng (`CUSTOMER`):**
    - *Nghiệp vụ cho phép đăng nhập đa thiết bị:* Một khách hàng có thể đăng nhập trên máy tính văn phòng để đặt vé, đồng thời mở ứng dụng/trình duyệt trên điện thoại di động khi đến rạp để xuất trình mã QR soát vé. Do đó, việc ép buộc Single Session sẽ gây bất tiện nghiêm trọng cho trải nghiệm xem phim của khách hàng.
  - **Đối với Nhân viên quầy (`STAFF`):**
    - *Nghiệp vụ khuyến nghị kiểm soát phiên làm việc theo ca:* Nhân viên thu ngân quầy làm việc theo từng máy POS vật lý cố định. Để tránh gian lận (nhân viên A dùng tài khoản nhân viên B thao tác từ xa), hệ thống có thể ràng buộc địa chỉ IP mạng nội bộ của rạp hoặc ghi nhận `device_id` vào ca làm việc để đối soát chênh lệch két tiền mặt.

---

### Câu 13: Các ràng buộc kiểm tra tính hợp lệ của dữ liệu đăng ký (Validation) như định dạng email RFC 5322, độ dài mật khẩu >= 6 ký tự, số điện thoại được thực thi ở Client-side hay Server-side? Tại sao không được tin tưởng dữ liệu Client?
- **Trọng tâm kiểm tra của Giảng viên:** Nguyên tắc vàng trong an toàn ứng dụng web: *"Never Trust User Input"* và hiểu biết về kiểm tra dữ liệu 2 lớp (Client & Server Validation).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cơ chế thực thi của Lumi Cinema:** Thực hiện kiểm tra ở cả 2 đầu:
    1. *Client-side (Form UX):* Dùng React Hook Form / HTML5 Validation để phản hồi trực quan ngay lập tức khi người dùng nhập sai, giúp người dùng sửa lỗi mà không phải chờ mạng gửi request lên server.
    2. *Server-side (Bảo mật bắt buộc):* File [`src/app/api/auth/signup/route.ts#L27-L58`](file:///d:/cinema_project/cinema-app/src/app/api/auth/signup/route.ts#L27-L58) dùng Regular Expression chuẩn RFC 5322 kiểm tra email, ép độ dài mật khẩu tối thiểu 6 ký tự.
  - **Tại sao bắt buộc phải validate ở Server-side?**
    - Client-side validation chỉ là giao diện và hoàn toàn có thể bị vô hiệu hóa hoặc vượt qua rất dễ dàng bằng các công cụ như Postman, cURL, Burp Suite hoặc chỉnh sửa mã nguồn JavaScript trực tiếp qua DevTools Console. Nếu không có Server validation, kẻ tấn công có thể chèn chuỗi rác, mã độc SQL Injection, XSS hoặc lưu mật khẩu rỗng vào database.

---

### Câu 14: Token JWT được lưu trữ ở đâu trên trình duyệt người dùng (HttpOnly Cookie hay LocalStorage)? Sự khác nhau về mặt an toàn thông tin trước các cuộc tấn công XSS (Cross-Site Scripting) và CSRF (Cross-Site Request Forgery)?
- **Trọng tâm kiểm tra của Giảng viên:** So sánh cơ chế lưu trữ bảo mật Client-side Storage và các vector tấn công phổ biến trên môi trường Web.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Nơi lưu trữ trong Lumi Cinema:** NextAuth mặc định lưu token trong **Cookie** với cờ bảo vệ `HttpOnly: true`, `SameSite: 'lax'`, `Secure: true` (trên môi trường HTTPS Production).
  - **So sánh mức độ an toàn:**
    1. *Chống tấn công XSS:*
       - Nếu lưu ở `localStorage`: Mã độc JavaScript được tiêm vào trang web có thể dễ dàng đọc được token qua lệnh `localStorage.getItem('token')` và gửi về máy chủ của tin tặc.
       - Khi lưu trong `HttpOnly Cookie`: Trình duyệt ngăn chặn hoàn toàn việc JavaScript (cả mã của trang lẫn mã độc XSS) truy cập vào cookie này (`document.cookie` không thể đọc được), triệt tiêu nguy cơ bị đánh cắp token qua XSS.
    2. *Chống tấn công CSRF:*
       - Cookie tự động đính kèm theo request nên có thể bị tấn công CSRF nếu trang web lạ gửi request giả mạo.
       - Lumi Cinema phòng vệ bằng cơ chế của NextAuth: Sử dụng cờ `SameSite: 'lax'` (trình duyệt chỉ gửi cookie khi điều hướng cùng nguồn hoặc link an toàn cấp cao) kết hợp cơ chế **CSRF Token** tự động sinh ra cho các request HTTP POST.

---

### Câu 15: Sau khi người dùng đăng ký tài khoản thành công tại `/api/auth/signup`, hệ thống tự động đăng nhập luôn hay yêu cầu chuyển hướng về trang `/login`? Giải thích lý do thiết kế trải nghiệm người dùng (UX) và bảo mật.
- **Trọng tâm kiểm tra của Giảng viên:** Quyết định thiết kế luồng người dùng (User Flow) và tính an toàn trong quy trình xác thực.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy trình hiện tại:** Hệ thống trả về thông báo thành công và chuyển hướng người dùng về trang `/login` để đăng nhập chính thức.
  - **Lý do kỹ thuật và nghiệp vụ:**
    1. *Đảm bảo quy trình cấp phát JWT an toàn:* Endpoint `/api/auth/signup` chỉ làm nhiệm vụ thêm bản ghi người dùng vào bảng `users`. Phiên làm việc JWT được tạo ra chuẩn xác và đầy đủ nhất thông qua luồng handshake của NextAuth `CredentialsProvider` tại `/api/auth/signin`.
    2. *Xác thực lại trí nhớ của người dùng:* Việc yêu cầu đăng nhập lại lần đầu tiên giúp người dùng nhớ chắc chắn mật khẩu mình vừa tạo, tránh trường hợp người dùng gõ nhầm mật khẩu lúc đăng ký rồi sau này không đăng nhập lại được.
    3. *Sẵn sàng cho việc xác thực Email (Email Verification):* Trong tương lai mở rộng, giữa bước đăng ký và đăng nhập sẽ có bước kích hoạt tài khoản qua đường link gửi về hòm thư điện tử.

---

### Câu 16: Nếu một nhân viên quầy (STAFF) sử dụng Postman gửi request `POST /api/movies` (vốn chỉ dành cho ADMIN), hệ thống sẽ chặn ở đâu, trả về mã HTTP Status Code nào (401 hay 403) và cấu trúc JSON lỗi ra sao?
- **Trọng tâm kiểm tra của Giảng viên:** Phân biệt chính xác giữa 401 (Chưa định danh) và 403 (Không đủ thẩm quyền) theo chuẩn RFC 7235 và cấu trúc phản hồi API chuẩn của dự án.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Vị trí chặn:** Request vượt qua tầng Middleware mạng (vì Middleware bỏ qua `/api`) và đi vào Server Route Handler tại file [`src/app/api/movies/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/movies/route.ts).
  - **Mã HTTP trả về:** **403 Forbidden** (Tuyệt đối không phải 401 vì nhân viên này đã đăng nhập và danh tính hợp lệ, nhưng vai trò `STAFF` không có quyền thực hiện tác vụ của `ADMIN`).
  - **Cấu trúc JSON phản hồi:**
    ```json
    {
      "success": false,
      "data": null,
      "message": "Chỉ Quản trị viên (ADMIN) mới có quyền tạo phim mới",
      "error": "FORBIDDEN",
      "code": 403
    }
    ```

---

### Câu 17: Khách hàng vãng lai mua vé tại quầy POS không có tài khoản thì hệ thống lưu trữ vé thế nào khi bảng `tickets` có trường `user_id` bắt buộc (Foreign Key -> `users`)?
- **Trọng tâm kiểm tra của Giảng viên:** Thiết kế cơ sở dữ liệu và xử lý nghiệp vụ bán vé cho đối tượng khách không định danh (Anonymous / Guest Customer) tại quầy vé truyền thống.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Ràng buộc Database:** Trong bảng `tickets` và `payments`, cột `user_id` là khóa ngoại trỏ tới bảng `users` với ràng buộc `NOT NULL` để đảm bảo tính toàn vẹn dữ liệu quan hệ (Referential Integrity).
  - **Giải pháp nghiệp vụ kiến trúc của Lumi Cinema:**
    1. *Tài khoản Khách vãng lai dùng chung (System Guest User):* Hệ thống khởi tạo một tài khoản người dùng hệ thống đặc biệt trong DB (Ví dụ: `id: 999999`, `email: guest@pos.lumicinema.vn`, `name: "Khách Vãng Lai POS"`, `role: "CUSTOMER"`).
    2. *Khi nhân viên bán vé tại quầy:*
       - Nếu khách có số điện thoại/email: Nhân viên gõ tra cứu để gắn vé vào tài khoản khách giúp tích điểm.
       - Nếu khách vãng lai không muốn cung cấp thông tin: Hệ thống POS tự động gán `user_id` của tài khoản Guest này vào giao dịch. Vé giấy vẫn được in ra với đầy đủ thông tin phòng chiếu và mã QR để soát vé vào rạp bình thường.

---

### Câu 18: Khi quản trị viên hoặc người dùng đổi mật khẩu tài khoản (`password`), hệ thống có cơ chế nào để ép buộc tất cả các phiên đăng nhập JWT cũ trên các thiết bị khác phải đăng nhập lại không?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ giới hạn của JWT vô trạng thái và giải pháp kiến trúc nâng cao để thu hồi phiên tức thời (Session Invalidation on Password Change).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thách thức:** Do JWT là token tự chứa thông tin và có chữ ký riêng, máy chủ không lưu session trong database nên không thể tự xóa cookie trên các trình duyệt khác từ xa.
  - **Kiến trúc giải pháp được khuyến nghị áp dụng trong Lumi Cinema:**
    1. Trong bảng `users`, thêm trường `password_updated_at` (DateTime) hoặc `token_version` (Int, mặc định = 1).
    2. Trong JWT callback, lưu thêm mốc thời gian phát hành token `iat` (Issued At) hoặc `token_version`.
    3. Tại các API endpoint quan trọng, so sánh:
       ```typescript
       if (token.iat < user.passwordUpdatedAt.getTime() / 1000) {
         throw new AppError(401, 'Mật khẩu đã bị thay đổi. Vui lòng đăng nhập lại trên thiết bị này!');
       }
       ```
    4. Ngay khi người dùng đổi mật khẩu ở máy A, trường `password_updated_at` trong DB được cập nhật thành giờ mới; máy B gửi request lên sẽ có `token.iat` nhỏ hơn mốc này và bị từ chối ngay lập tức, buộc người dùng phải đăng nhập lại.

---

## PHẦN 2: PHÂN HỆ BÁO CÁO DOANH THU, ĐỐI SOÁT TÀI CHÍNH & DASHBOARD ADMIN (20 CÂU)
*(Tập trung chuyên sâu vào Logic tính toán Doanh thu, Phân tách Gross/Net Revenue, Tiền chờ hoàn, Tỷ lệ lấp đầy, Đối soát két tiền mặt POS & Tối ưu hóa hiệu năng báo cáo)*

---

### Câu 19: Phân biệt bản chất kế toán giữa "Doanh thu gộp (Gross Revenue)", "Doanh thu thực thu / Doanh thu thuần (Net Revenue)", "Số tiền hoàn (Refunded Amount)" và "Công nợ chờ hoàn (Pending Refund)" trong hệ thống Lumi Cinema.
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng nắm vững nguyên lý kế toán rạp chiếu phim (Auditing & Accounting Consistency) và tính minh bạch của số liệu trong báo cáo tài chính.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - Theo tài liệu đặc tả SRS (Mục 4.9, BR-10) và code hiện thực tại [`src/app/api/admin/reports/revenue/route.ts#L212-L218`](file:///d:/cinema_project/cinema-app/src/app/api/admin/reports/revenue/route.ts#L212-L218):
    1. **Doanh thu thực thu (Net Revenue):** Là tổng số tiền thực tế rạp được quyền ghi nhận vào kết quả kinh doanh từ các vé hợp lệ đang chờ xem hoặc đã vào phòng chiếu xem phim (`status = Valid` hoặc `status = Used`).
       $$	ext{Net Revenue} = \sum 	ext{price của các vé có status } \in \{	ext{Valid}, 	ext{Used}\}$$
    2. **Số tiền hoàn (Refunded Amount):** Là tổng số tiền của các vé đã bị hủy (`status = Cancelled`) do sự cố rạp hoặc bồi hoàn mà rạp phải hoàn trả lại cho khách hàng.
       $$	ext{Refunded Amount} = \sum 	ext{price của các vé có status } = 	ext{Cancelled}$$
    3. **Doanh thu gộp (Gross Revenue):** Là tổng số tiền bán vé ban đầu phát sinh trước khi có bất kỳ yêu cầu hủy hay hoàn tiền nào.
       $$	ext{Gross Revenue} = 	ext{Net Revenue} + 	ext{Refunded Amount}$$
    4. **Công nợ chờ hoàn (Pending Refund):** Là số tiền rạp có nghĩa vụ phải trả tiền mặt cho khách hàng do sự cố suất chiếu nhưng khách chưa đến quầy nhận tiền mặt (`refundStatus = PENDING_CASH_REFUND`). Khoản này được ghi nhận là một khoản nợ phải trả ngắn hạn (Short-term Liability) của rạp.

---

### Câu 20: Trong API `/api/admin/reports/revenue`, tại sao bạn lại lọc vé có `status in [Valid, Used]` để tính doanh thu thực thu, mà không tính vé `Cancelled`? Nếu một vé bị hủy, dòng tiền thực tế chạy như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ vòng đời của tấm vé (Ticket Lifecycle) và nguyên tắc không ghi nhận doanh thu ảo (Revenue Overstatement).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do loại bỏ vé `Cancelled` khỏi Net Revenue:** Khi vé bị hủy (dù do khách tự hủy hay do rạp gặp sự cố), suất chiếu đó không còn phục vụ khách hàng đó nữa. Nếu tiếp tục cộng tiền của vé đã hủy vào doanh thu thực thu, rạp sẽ bị phóng đại doanh thu (Overstating Revenue) và phải đóng thuế thu nhập doanh nghiệp sai lệch trên số tiền không thực tế thu được.
  - **Dòng tiền thực tế trong 2 kịch bản hủy:**
    1. *Khách tự hủy trước 2 tiếng:* Rạp không trả tiền mặt mà cấp Voucher 50%. Số tiền khách đã trả mua vé cũ vẫn nằm trong tài khoản ngân hàng của rạp, nhưng về mặt kế toán bán vé, chỗ ngồi đó được giải phóng để bán cho người khác; giá trị vé cũ được hạch toán chuyển đổi sang khoản bồi hoàn dịch vụ.
    2. *Rạp gặp sự cố hỏng máy chiếu:* Rạp ghi nhận công nợ và hoàn trả 100% tiền mặt từ két quỹ tại quầy cho khách. Dòng tiền thực tế rời khỏi quỹ của rạp, do đó dứt khoát phải trừ ra khỏi doanh thu thuần.

---

### Câu 21: Khi vé bị hủy do sự cố rạp (lỗi máy chiếu, mất điện) và rơi vào trạng thái `PENDING_CASH_REFUND`, số tiền này được trừ ngay khỏi doanh thu của suất chiếu hay chỉ được trừ khi nhân viên quầy ấn nút "Xác nhận đã trả tiền mặt"? Tại sao?
- **Trọng tâm kiểm tra của Giảng viên:** Phân biệt giữa Kế toán dồn tích (Accrual Accounting) và Kế toán tiền mặt (Cash Accounting) trong thiết kế hệ thống thông tin quản lý.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Nguyên tắc xử lý của Lumi Cinema:** Số tiền này được **trừ ngay lập tức** khỏi doanh thu thực thu (`Net Revenue`) của suất chiếu ngay thời điểm Admin kích hoạt hủy suất chiếu sự cố.
  - **Lý giải nguyên lý:**
    - Hệ thống áp dụng chuẩn mực **Kế toán dồn tích (Accrual Principle)**: Ngay khi suất chiếu bị sự cố ngừng chiếu, rạp đã mất đi quyền sở hữu đối với khoản doanh thu đó vì không thể cung cấp dịch vụ chiếu phim cho khách. Về mặt pháp lý và nghĩa vụ kinh tế, số tiền đó đã biến thành khoản nợ phải trả (`PENDING_CASH_REFUND`).
    - Nếu chờ đến khi khách đến nhận tiền mặt mới trừ doanh thu, thì trong thời gian 30 ngày khách chưa đến, báo cáo doanh thu của rạp vẫn hiển thị là đã thu được tiền từ suất chiếu hỏng đó -> Gây sai lệch báo cáo tài chính gửi Ban giám đốc.
    - Việc nhân viên quầy bấm "Xác nhận đã trả tiền mặt" (`REFUNDED_CASH`) chỉ là thao tác nghiệp vụ ghi giảm quỹ tiền mặt và tất toán công nợ, không làm thay đổi doanh thu thuần của suất chiếu.

---

### Câu 22: Tiền bán bắp nước (Combo) được hạch toán vào doanh thu hôm nay (`today.combo_revenue`) trên Dashboard như thế nào? Tại sao lại lấy từ bảng `OrderCombo` có liên kết với `Payment` trạng thái `Success`?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu cách thiết kế truy vấn quan hệ nhiều bảng (Relational Join Query) và điều kiện lọc thanh toán thành công để tránh tính nhầm các đơn hàng rác/bỏ dở.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cách hạch toán trong code ([`src/app/api/admin/dashboard/route.ts#L151-L170`](file:///d:/cinema_project/cinema-app/src/app/api/admin/dashboard/route.ts#L151-L170)):**
    ```typescript
    const todayOrderCombos = await prisma.orderCombo.findMany({
      where: {
        payment: { status: PaymentStatus.Success },
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      select: { price: true, quantity: true },
    });
    const todayComboRevenue = todayOrderCombos.reduce(
      (sum, c) => sum + Number(c.price) * c.quantity, 0
    );
    ```
  - **Tại sao bắt buộc phải lọc qua `Payment.status = Success`:**
    - Khi khách hàng đặt combo trực tuyến, bản ghi `OrderCombo` được tạo ra trong database ngay lúc tạo phiên thanh toán với VNPay.
    - Nếu khách hàng hủy giao dịch trên cổng ngân hàng hoặc hết hạn 10 phút không thanh toán, `Payment` vẫn ở trạng thái `Pending` hoặc chuyển sang `Failed`.
    - Nếu chỉ tính tổng trong bảng `OrderCombo` mà không kiểm tra liên kết `payment.status === Success`, hệ thống sẽ cộng cả những gói bắp nước của các giao dịch thất bại -> Doanh thu bắp nước bị sai lệch nghiêm trọng.

---

### Câu 23: Tại sao trong báo cáo doanh thu theo suất chiếu lại có chỉ số `fill_rate` (Tỷ lệ lấp đầy phòng chiếu)? Công thức tính tỷ lệ này là gì và ý nghĩa của nó đối với Ban quản lý rạp phim?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng hiểu các chỉ số hiệu quả kinh doanh cốt lõi (KPIs) trong ngành rạp chiếu phim (Seat Occupancy Rate / Fill Rate).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Công thức tính toán ([`src/app/api/admin/reports/revenue/route.ts#L225-L227`](file:///d:/cinema_project/cinema-app/src/app/api/admin/reports/revenue/route.ts#L225-L227)):**
    $$	ext{Fill Rate (\%)} = \left(rac{	ext{Số vé hợp lệ đã bán (tickets\_sold)}}{	ext{Tổng sức chứa ghế của phòng (total\_seats)}}ight) 	imes 100$$
    *(Với phòng chiếu tiêu chuẩn của Lumi Cinema, tổng số ghế là 50).*
  - **Ý nghĩa quản trị kinh doanh thực tế:**
    1. *Tối ưu hóa xếp lịch chiếu:* Nếu một bộ phim liên tục có suất chiếu đạt tỷ lệ lấp đầy > 85%, Quản trị viên sẽ quyết định xếp thêm suất chiếu vào các khung giờ vàng hoặc chuyển sang phòng chiếu lớn hơn.
    2. *Cắt giảm suất chiếu ế ẩm:* Nếu phim có tỷ lệ lấp đầy < 15% trong nhiều ngày liên tiếp, Admin sẽ chủ động giảm số suất chiếu để nhường phòng cho các phim ăn khách khác nhằm tối đa hóa doanh thu trên mỗi mét vuông phòng chiếu.
    3. *Đánh giá hiệu quả khung giờ:* Giúp nhận biết khung giờ nào trong tuần (ví dụ: tối thứ 7 so với sáng thứ 2) thu hút khách nhất để áp dụng chính sách phụ thu giá vé cuối tuần.

---

### Câu 24: Khi khách hàng áp dụng mã Voucher giảm giá (ví dụ voucher bồi hoàn 50%), doanh thu ghi nhận cho vé đó là giá gốc hay giá thực trả sau khi trừ voucher? Cơ sở hạch toán kế toán là gì?
- **Trọng tâm kiểm tra của Giảng viên:** Nguyên tắc ghi nhận doanh thu theo giá trị thuần có thể thu hồi (Net Realizable Value) trong kế toán doanh nghiệp.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cách ghi nhận của Lumi Cinema:** Doanh thu ghi nhận trên vé (`ticket.price`) là **giá thực trả sau khi đã trừ số tiền giảm giá của voucher**.
  - **Cơ sở hạch toán kế toán chuẩn mực:**
    - Theo chuẩn mực kế toán Việt Nam (VAS 14 - Doanh thu và thu nhập khác): Doanh thu bán hàng và cung cấp dịch vụ được xác định theo giá trị hợp lý của các khoản đã thu hoặc sẽ thu được sau khi trừ đi các khoản chiết khấu thương mại, giảm giá hàng bán.
    - Ví dụ: Vé gốc giá 100.000đ, khách dùng Voucher giảm 50% -> Khách chỉ quẹt thẻ thanh toán 50.000đ. Doanh thu của vé đó phải ghi nhận đúng 50.000đ.
    - Nếu ghi nhận 100.000đ, sổ sách kế toán sẽ bị vênh 50.000đ so với số tiền thực tế đổ vào tài khoản ngân hàng của rạp, gây sai lệch khi quyết toán thuế.

---

### Câu 25: Một khách hàng đặt đơn gồm 3 vé và 1 combo bắp nước qua VNPay với tổng tiền 400.000đ. Sau đó khách tự hủy 1 vé hợp lệ trước 2 tiếng. Báo cáo doanh thu ghi nhận biến động của đơn hàng này và các bảng dữ liệu liên quan như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng xử lý biến động dữ liệu khi phát sinh hủy một phần đơn hàng (Partial Order Cancellation) và tính toàn vẹn giữa bảng Đơn hàng (`payments`) và Chi tiết vé (`tickets`).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Biến động trong các bảng dữ liệu:**
    1. *Bảng `payments`:* Bản ghi thanh toán ban đầu giữ nguyên `amount = 400.000đ`, `status = Success` (để lưu vết lịch sử giao dịch tiền đã thanh toán qua ngân hàng đối tác).
    2. *Bảng `tickets`:* Trong 3 vé thuộc `payment_id` đó:
       - 2 vé còn lại giữ nguyên `status = Valid`.
       - 1 vé bị hủy chuyển `status = Cancelled`, cập nhật `cancellationReason = "Khách hàng tự hủy..."`.
    3. *Bảng `seats`:* Ghế của vé bị hủy chuyển từ `OCCUPIED` về `EMPTY` ngay lập tức để người khác có thể mua tiếp.
    4. *Bảng `coupons`:* Sinh một mã voucher mới `COMP50_[ticketId]_[random]` có giá trị giảm 50% cho khách trong 30 ngày.
    5. *Bảng `order_combos`:* Giữ nguyên trạng thái `Chưa nhận`. Khách vẫn có quyền đến quầy lấy bắp nước bình thường.
  - **Biến động trên Báo cáo Doanh thu Suất chiếu:**
    - `tickets_sold` giảm từ 3 xuống 2.
    - `net_revenue` của suất chiếu giảm đi giá trị của chiếc vé bị hủy.
    - `refunded_amount` của suất chiếu tăng lên bằng giá trị chiếc vé bị hủy.
    - `fill_rate` được tính toán lại dựa trên 2 vé hợp lệ.

---

### Câu 26: Bảng `payments` lưu trường `amount` của toàn bộ đơn hàng, trong khi bảng `tickets` lưu `price` của từng vé. Nếu cộng tổng `price` của các vé trong bảng `tickets` có luôn bằng `payments.amount` không? Tại sao có sự chênh lệch và hệ thống phân bổ ra sao?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ cấu trúc dữ liệu quan hệ 1-N (One-to-Many), bắp nước kèm theo và thuật toán phân bổ chiết khấu (Discount Allocation Algorithm).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Câu trả lời:** Tổng `price` của các vé **KHÔNG LUÔN BẰNG** `payments.amount`.
  - **Các nguyên nhân gây chênh lệch:**
    1. *Có mua kèm Combo bắp nước:* Đơn hàng thanh toán bao gồm cả tiền vé và tiền combo:
       $$	ext{payments.amount} = \sum 	ext{ticket.price} + \sum (	ext{order\_combo.price} 	imes 	ext{quantity})$$
    2. *Phân bổ chiết khấu Voucher:* Khi áp dụng Voucher toàn đơn (ví dụ voucher giảm 20.000đ):
       - Hệ thống Lumi Cinema thực hiện phân bổ trừ trực tiếp số tiền giảm giá vào từng chiếc vé theo tỷ trọng giá của từng vé trước khi lưu vào cột `ticket.price`.
       - Phần tiền combo bắp nước tuyệt đối không được phân bổ giảm giá (theo Business Rule BR-07: Giảm giá chỉ áp dụng trên tiền vé).
  - Do đó, để kiểm tra tính toàn vẹn: Tổng `payments.amount` sẽ luôn bằng tổng `ticket.price` cộng với tổng tiền các gói `order_combo`.

---

### Câu 27: Trong API Dashboard (`/api/admin/dashboard`), bảng xếp hạng Top 5 phim có doanh thu cao nhất mọi thời đại được tính toán bằng thuật toán gì? Nếu 2 bộ phim có tổng doanh thu bằng nhau thì hệ thống ưu tiên phim nào lên trước?
- **Trọng tâm kiểm tra của Giảng viên:** Đọc hiểu mã nguồn backend, thuật toán sắp xếp đa tiêu chí (Multi-criteria Sorting) và xử lý hòa điểm (Tie-breaking Logic).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thuật toán tính toán trong code ([`src/app/api/admin/dashboard/route.ts#L224-L259`](file:///d:/cinema_project/cinema-app/src/app/api/admin/dashboard/route.ts#L224-L259)):**
    1. Hệ thống truy vấn toàn bộ danh mục phim qua Prisma, kèm theo tất cả các suất chiếu và các vé có `status in [Valid, Used]`.
    2. Sử dụng vòng lặp duyệt tính tổng doanh thu (`revenue`) và tổng số vé bán được (`ticketCount`) cho từng bộ phim.
    3. Thực hiện sắp xếp mảng kết quả bằng hàm `Array.prototype.sort()`:
       ```typescript
       movieStats.sort((a, b) => {
         if (b.total_revenue !== a.total_revenue) {
           return b.total_revenue - a.total_revenue; // Tiêu chí 1: Doanh thu cao hơn xếp trước
         }
         return b.tickets_sold - a.tickets_sold;     // Tiêu chí 2 (Tie-break): Số vé bán nhiều hơn xếp trước
       });
       ```
    4. Cắt lấy 5 phần tử đầu tiên bằng `.slice(0, 5)` để trả về Top 5.
  - **Quy tắc xử lý khi hòa doanh thu:** Nếu 2 phim có doanh thu bằng nhau, phim nào có số lượng vé bán ra nhiều hơn (`tickets_sold`) sẽ được xếp trên (vì số vé nhiều hơn phản ánh lượng khán giả quan tâm đông đảo hơn).

---

### Câu 28: Có sự mâu thuẫn nào giữa cách tính `all_time.total_revenue` (tính từ `payments.amount` với `status = Success`) và tổng doanh thu tính từ bảng `tickets` không? Khi nào hai con số này bị lệch nhau?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng phát hiện độ lệch dữ liệu giữa các bảng và tư duy đối soát kế toán hệ thống.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Hai cách tính trong hệ thống:**
    - Cách 1: `all_time.total_revenue` trong Dashboard lấy tổng `p.amount` từ bảng `Payment` thành công. Con số này đại diện cho **Tổng dòng tiền đã thu từ khách hàng (Bao gồm Vé + Combo)**.
    - Cách 2: Tổng doanh thu vé trong báo cáo chi tiết lấy từ tổng `ticket.price`. Con số này chỉ đại diện cho **Doanh thu thuần từ việc bán vé xem phim**.
  - **Hai con số này sẽ lệch nhau trong 2 trường hợp:**
    1. *Khách có mua Combo bắp nước:* Bảng `Payment` có chứa tiền combo, còn tổng bảng `Ticket` không chứa tiền combo.
    2. *Có vé bị hủy sau khi thanh toán:* Bảng `Payment` vẫn ghi nhận số tiền giao dịch ban đầu đã thành công, trong khi bảng `Ticket` đã loại bỏ các vé `Cancelled` ra khỏi doanh thu thực thu.
  - **Khẳng định:** Đây không phải là mâu thuẫn hay lỗi phần mềm, mà là sự khác biệt giữa **Báo cáo Dòng tiền thu vào (Cash Inflow Report)** và **Báo cáo Doanh thu Dịch vụ Phòng vé (Box Office Revenue Report)**.

---

### Câu 29: Khi Admin kích hoạt tính năng "Hủy suất chiếu khẩn cấp do sự cố" (UC-15 / UC-23), toàn bộ 50 vé của suất chiếu đó bị chuyển sang `Cancelled`. Báo cáo doanh thu của suất chiếu này sau sự cố sẽ hiển thị con số `net_revenue` và `refunded_amount` như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý tình huống biên (Corner Case / Disaster Handling) trên giao diện báo cáo tài chính.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - Giả sử trước khi xảy ra sự cố, suất chiếu đã bán được 40 vé với tổng tiền là 4.000.000đ (giá 100.000đ/vé).
  - Khi Admin bấm nút "Hủy suất chiếu do sự cố" (hỏng máy chiếu):
    1. Toàn bộ 40 vé này lập tức chuyển sang `status = Cancelled`, `refundStatus = PENDING_CASH_REFUND`.
    2. Suất chiếu chuyển sang `status = CANCELLED`.
  - **Số liệu hiển thị trên Báo cáo Doanh thu (`/api/admin/reports/revenue`):**
    - `tickets_sold`: **0 vé** (vì không còn vé nào `Valid` hay `Used`).
    - `cancelled_tickets`: **40 vé**.
    - `net_revenue` (Doanh thu thực thu): **0 VNĐ**.
    - `refunded_amount` (Số tiền hoàn trả): **4.000.000 VNĐ**.
    - `gross_revenue` (Doanh thu gộp ban đầu): **4.000.000 VNĐ**.
    - `fill_rate` (Tỷ lệ lấp đầy): **0.0%**.
  - Nhờ cơ chế này, kế toán nhìn vào báo cáo sẽ thấy ngay: Suất chiếu này ban đầu thu được 4 triệu, nhưng do sự cố nên toàn bộ 4 triệu đã được chuyển sang quỹ chờ hoàn trả, doanh thu thực tế ghi nhận bằng 0.

---

### Câu 30: Theo quy chế BR-04, khách hàng có thời hạn tối đa 30 ngày để đến rạp nhận tiền hoàn mặt do sự cố. Nếu quá 30 ngày mà khách không đến nhận, số tiền công nợ chờ hoàn này sẽ được xử lý ra sao trên báo cáo tài chính của rạp?
- **Trọng tâm kiểm tra của Giảng viên:** Nghiệp vụ kế toán xử lý công nợ quá hạn và hoàn nhập thu nhập khác (Unclaimed Funds / Other Income).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy chế nghiệp vụ BR-04:** Khách hàng có thời hạn 30 ngày kể từ ngày hủy suất chiếu để cầm mã vé đến quầy xuất trình CCCD nhận lại tiền mặt.
  - **Xử lý sau 30 ngày:**
    1. *Khóa quyền nhận hoàn tiền:* Hệ thống tự động vô hiệu hóa nút "Xác nhận trả tiền mặt" tại quầy POS cho các mã vé đã quá hạn 30 ngày kể từ `updatedAt`.
    2. *Hạch toán kế toán tài chính:* Khoản công nợ `PENDING_CASH_REFUND` quá hạn này không được tính ngược lại vào Doanh thu bán vé (vì suất chiếu đã không diễn ra), mà theo luật kế toán doanh nghiệp, số tiền này được hạch toán chuyển vào tài khoản **"Thu nhập khác (Other Income)"** của rạp chiếu phim sau khi hết thời hiệu khiếu nại.

---

### Câu 31: Báo cáo doanh thu hỗ trợ các tiêu chí lọc đa chiều nào (`from_date`, `to_date`, `movie_id`, `room_number`)? Trong Prisma ORM, bạn đã xây dựng đối tượng `where: Prisma.ScreeningWhereInput` linh hoạt như thế nào khi các tham số lọc là tùy chọn (optional)?
- **Trọng tâm kiểm tra của Giảng viên:** Kỹ thuật xây dựng câu truy vấn động (Dynamic Query Building) với Type-safe ORM trong TypeScript.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Các tiêu chí lọc được hỗ trợ:**
    1. `from_date` & `to_date`: Khoảng thời gian diễn ra suất chiếu.
    2. `movie_id`: Lọc riêng cho một bộ phim cụ thể.
    3. `room_number` / `room`: Lọc theo số phòng chiếu (Phòng 1 đến 5).
  - **Kỹ thuật xây dựng Dynamic Where Object ([`src/app/api/admin/reports/revenue/route.ts#L116-L162`](file:///d:/cinema_project/cinema-app/src/app/api/admin/reports/revenue/route.ts#L116-L162)):**
    ```typescript
    const where: Prisma.ScreeningWhereInput = {};
    // Lọc thời gian linh hoạt
    if (fromDateParam || toDateParam) {
      where.startTime = {
        ...(fromDateParam && { gte: new Date(fromDateParam) }),
        ...(toDateParam && { lte: new Date(toDateParam) }),
      };
    }
    // Lọc phim nếu có truyền param
    if (movieIdParam) {
      where.movieId = parseInt(movieIdParam, 10);
    }
    // Lọc phòng chiếu hỗ trợ cả số phòng và chuỗi "Phòng 1"
    if (roomNumberParam) {
      where.OR = [
        { roomNumber: parseInt(roomNumberParam, 10) },
        { room: { contains: roomNumberParam.trim(), mode: 'insensitive' } },
      ];
    }
    ```
  - Cách viết này đảm bảo chỉ những tham số người dùng thực sự chọn mới được thêm vào mệnh đề `WHERE` của SQL, tránh tạo ra các câu lệnh SQL rỗng hoặc lỗi cú pháp.

---

### Câu 32: Khi nhân viên quầy POS thực hiện chức năng bán combo độc lập (`/api/staff/pos/combos`) không gắn với bất kỳ suất chiếu hay vé phim nào, doanh thu này được ghi nhận vào đâu? Nó có xuất hiện trong báo cáo doanh thu theo suất chiếu (`/api/admin/reports/revenue`) không?
- **Trọng tâm kiểm tra của Giảng viên:** Tính phân tách giữa Báo cáo Doanh thu Suất chiếu (Box Office Screening Report) và Báo cáo Doanh thu Dịch vụ Ăn uống (Concession Sales Report).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Nơi ghi nhận:** Doanh thu combo độc lập được ghi nhận vào bảng `payments` (với `status = Success`, phương thức `Cash` hoặc `POS_QR`), đồng thời tạo các bản ghi trong bảng `order_combos`.
  - **Có xuất hiện trong báo cáo doanh thu suất chiếu không?**
    - **HOÀN TOÀN KHÔNG**. Báo cáo `/api/admin/reports/revenue` là báo cáo theo thực thể `Screening` (Suất chiếu). Một đơn combo độc lập bán cho khách vãng lai không gắn với bất kỳ `screening_id` nào nên không thể và không được phép gán bừa vào bất kỳ suất chiếu phim nào.
    - Doanh thu combo độc lập này được tổng hợp và hiển thị tại **Báo cáo Doanh thu Bắp nước trên Admin Dashboard** (`today.combo_revenue`) và báo cáo tổng kết tài chính cuối ngày của rạp.

---

### Câu 33: Làm thế nào để đối soát giữa số tiền mặt thực tế trong két của nhân viên thu ngân quầy POS vào cuối ca làm việc và số liệu báo cáo hiển thị trên hệ thống phần mềm?
- **Trọng tâm kiểm tra của Giảng viên:** Nghiệp vụ kiểm soát dòng tiền vật lý (Cash Reconciliation & Cash Drawer Management) trong vận hành bán lẻ.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Công thức đối soát chốt ca nhân viên (End-of-Shift Balancing):**
    $$	ext{Tiền mặt thực tế trong két} = 	ext{Tiền mặt đầu ca (Float)} + 	ext{Tổng tiền thu vé mặt} + 	ext{Tổng tiền thu combo mặt} - 	ext{Tổng tiền mặt đã chi hoàn sự cố}$$
  - **Cách trích xuất số liệu trên phần mềm Lumi Cinema:**
    1. Quản trị viên lọc bảng `payments` theo `paymentMethod = 'Cash'`, `createdAt` nằm trong khung giờ ca trực của nhân viên và `user_id` của nhân viên đó.
    2. Lọc bảng `tickets` có `refundStatus = 'REFUNDED_CASH'` được thực hiện bởi nhân viên đó trong ca để tính tổng tiền quỹ đã xuất chi trả cho khách gặp sự cố.
    3. Nếu có chênh lệch giữa số tiền đếm được trong két và số liệu phần mềm tính ra, nhân viên phải giải trình nguyên nhân (thối nhầm tiền, thất thoát).

---

### Câu 34: Nếu một suất chiếu diễn ra vào tuần tới nhưng hiện tại đã bán được 45 vé qua cổng VNPay, số tiền này đã được cộng vào doanh thu trong báo cáo chưa? Trong nguyên lý kế toán, đây là "Doanh thu thực tế" hay "Doanh thu chưa thực hiện (Unearned Revenue)"?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu biết về thời điểm ghi nhận doanh thu theo chuẩn mực kế toán (Revenue Recognition Timing).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Về mặt kỹ thuật phần mềm:** Số tiền này đã được thống kê vào `net_revenue` của suất chiếu đó trên báo cáo quản trị vì tiền đã đổ về tài khoản ngân hàng của rạp và vé có trạng thái `Valid`.
  - **Về mặt nguyên lý kế toán chuẩn mực (IAS 18 / IFRS 15 / VAS 14):**
    - Khoản tiền thu trước này bản chất là **"Doanh thu chưa thực hiện (Unearned Revenue / Deferred Revenue)"** vì rạp chưa cung cấp dịch vụ chiếu phim cho khách hàng. Rạp vẫn có khả năng phải hoàn lại tiền nếu suất chiếu bị hủy trong tương lai.
    - Chỉ khi nào suất chiếu chính thức bắt đầu và vé được chuyển sang trạng thái `Used` (hoặc suất chiếu kết thúc mà khách không đến xem), doanh thu đó mới chính thức chuyển thành **"Doanh thu đã thực hiện (Earned Revenue)"**.

---

### Câu 35: Tại sao trong cơ sở dữ liệu không bao giờ được dùng lệnh `DELETE` vật lý để xóa các vé đã hủy hoặc các suất chiếu đã bị hủy? Điều này quyết định tính trung thực và toàn vẹn của báo cáo kiểm toán tài chính như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Nguyên tắc toàn vẹn dữ liệu kế toán (Audit Trail & Financial Non-repudiation) và kỹ thuật Soft Delete trong thiết kế CSDL.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Hậu quả nếu dùng `DELETE` vật lý (Hard Delete):**
    - Mất toàn bộ lịch sử giao dịch: Nếu xóa dòng vé bị hủy khỏi bảng `tickets`, kế toán sẽ không thể giải trình được tại sao trong sao kê ngân hàng có khoản thu 100.000đ nhưng trong phần mềm lại không thấy mã vé đó đâu.
    - Phá vỡ toàn vẹn khóa ngoại (Foreign Key Violation) liên kết giữa `payments`, `seats`, và `users`.
  - **Quy tắc thiết kế của Lumi Cinema:**
    - Sử dụng **Soft Delete (Xóa logic)**: Chỉ cập nhật trạng thái `status = 'Cancelled'` và lưu lý do vào `cancellation_reason`.
    - Dữ liệu lịch sử được bảo toàn vĩnh viễn, cho phép các cơ quan kiểm toán thuế hoặc Ban giám đốc rạp có thể kiểm tra chéo (Cross-check) bất kỳ giao dịch nào đã từng phát sinh trong quá khứ.

---

### Câu 36: Khi khách hàng thanh toán qua cổng VNPay, ngân hàng đối tác thường trừ phí xử lý giao dịch (Payment Gateway Fee, ví dụ 1.5% - 2%). Hệ thống Lumi Cinema ghi nhận doanh thu theo số tiền khách trả hay số tiền thực nhận sau phí? Tại sao?
- **Trọng tâm kiểm tra của Giảng viên:** Phân biệt giữa Doanh thu thuần (Revenue) và Chi phí bán hàng / Phí dịch vụ tài chính (Operating Expenses).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cách ghi nhận:** Hệ thống ghi nhận doanh thu theo **đúng số tiền khách hàng thực trả ghi trên hóa đơn vé** (Gross Invoice Amount).
  - **Cơ sở kế toán:**
    - Phí xử lý cổng thanh toán 1.5% - 2% được hạch toán riêng vào tài khoản **Chi phí dịch vụ mua ngoài / Chi phí tài chính (Selling / Financial Expense)** của rạp, chứ không trừ trực tiếp vào giá bán của chiếc vé.
    - Ví dụ: Vé 100.000đ, VNPay thu phí 2.000đ, rạp nhận về 98.000đ. Doanh thu bán vé vẫn là 100.000đ, và rạp hạch toán 1 khoản chi phí vận hành 2.000đ. Cách hạch toán này giúp việc đối soát hóa đơn VAT xuất cho khách hàng khớp 100% với giá niêm yết của rạp.

---

### Câu 37: Tại sao trong file [`src/app/api/admin/reports/revenue/route.ts#L9`](file:///d:/cinema_project/cinema-app/src/app/api/admin/reports/revenue/route.ts#L9) bắt buộc phải khai báo `export const dynamic = 'force-dynamic'`? Nếu không có dòng này, rủi ro gì sẽ xảy ra với dữ liệu báo cáo trong môi trường Next.js App Router Production?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu sâu về cơ chế Static Site Generation (SSG) vs Server-Side Rendering (SSR) và cơ chế bộ nhớ đệm (Caching Behavior) trong Next.js App Router.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cơ chế của Next.js App Router:** Trong môi trường Production build, Next.js sẽ tự động phân tích các Route Handlers. Nếu route không sử dụng `Request` object chứa dynamic headers hoặc search params theo cách tĩnh, Next.js có thể xem route đó là Static và **đóng băng (Cache) kết quả trả về ngay tại thời điểm build hệ thống**.
  - **Rủi ro nếu thiếu `force-dynamic`:**
    - Khi Admin mở xem báo cáo doanh thu lúc 10:00 sáng, hệ thống có thể trả về dữ liệu cache từ tuần trước lúc build project!
    - Khi có khách hàng mới mua vé hoặc có vé vừa bị hủy, số liệu trên báo cáo không được làm mới, dẫn đến việc Admin nhìn thấy số liệu doanh thu cũ rích và sai lệch với thực tế.
  - **Tác dụng của `export const dynamic = 'force-dynamic'`:** Ép buộc Next.js phải thực thi lại toàn bộ câu lệnh truy vấn Prisma và tính toán mới hoàn toàn từ database Supabase mỗi khi có request gửi tới.

---

### Câu 38: Giả sử sau 3 năm hoạt động, hệ thống tích lũy hơn 2 triệu lượt vé và hàng trăm nghìn suất chiếu. Việc tính toán lặp và tổng hợp trực tiếp bằng vòng lặp JS trong code (`map`, `reduce`) sẽ gây quá tải CPU và timeout API. Bạn đề xuất những giải pháp tối ưu hóa hiệu năng cơ sở dữ liệu nào (Indexing, Prisma Aggregate, Database View, Materialized View)?
- **Trọng tâm kiểm tra của Giảng viên:** Kỹ năng thiết kế hệ thống lớn (High-performance Database Optimization / Big Data Handling) và lộ trình nâng cấp kiến trúc khi dữ liệu tăng trưởng.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Các giải pháp tối ưu hóa theo cấp độ:**
    1. *Cấp độ 1: Đánh Index chuyên biệt trên PostgreSQL:*
       - Tạo Composite Index: `CREATE INDEX idx_tickets_screening_status ON tickets(screening_id, status);`
       - Tạo Index trên cột thời gian: `CREATE INDEX idx_screenings_start_time ON screenings(start_time);`
       - Giúp giảm độ phức tạp truy vấn từ $O(N)$ (Table Scan) xuống $O(\log N)$ (Index Scan).
    2. *Cấp độ 2: Đẩy toàn bộ việc tính toán xuống tầng Database Engine:*
       - Thay vì dùng JavaScript `.reduce()`, sử dụng trực tiếp các hàm tổng hợp SQL mạnh mẽ của PostgreSQL:
         ```sql
         SELECT screening_id, 
                COUNT(*) FILTER (WHERE status IN ('Valid', 'Used')) as tickets_sold,
                SUM(price) FILTER (WHERE status IN ('Valid', 'Used')) as net_revenue
         FROM tickets GROUP BY screening_id;
         ```
       - Trong Prisma, sử dụng `prisma.ticket.groupBy()` kết hợp `_sum` và `_count`.
    3. *Cấp độ 3: Sử dụng Materialized View hoặc Summary Table (Bảng tổng hợp định kỳ):*
       - Với các suất chiếu đã kết thúc trong quá khứ (`ScreeningStatus.ENDED`), số liệu doanh thu không bao giờ thay đổi nữa.
       - Viết Cron Job chạy lúc 0h đêm để tính toán và chốt sổ dữ liệu vào bảng `daily_revenue_summaries`. Khi xem báo cáo các năm trước, hệ thống chỉ cần đọc bảng tổng hợp với vài nghìn dòng thay vì quét qua 2 triệu dòng vé chi tiết.

---

## PHẦN 3: PHÂN HỆ ĐẶT VÉ & GIỮ GHẾ 10 PHÚT TRỰC TUYẾN (CONCURRENCY & BOOKING) (12 CÂU)
*(Tập trung chuyên sâu vào Xử lý tranh chấp ghế đồng thời - Race Condition, Prisma Database Transaction, Quy chế khóa giữ chỗ 10 phút, Countdown Timer & Kiểm soát độ tuổi)*

---

### Câu 39: Giải thích chi tiết cơ chế chống bán trùng ghế (Seat Concurrency Control) khi 2 khách hàng cùng bấm chọn ghế A5 tại cùng một phần nghìn giây? Mã nguồn hiện thực ở đâu?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng giải quyết bài toán kinh điển về Concurrency Control (Kiểm soát xử lý đồng thời) trong hệ thống đặt chỗ rạp phim, phòng tránh thảm họa "Double Booking".
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Vị trí hiện thực trong mã nguồn:** File [`src/app/api/seats/reserve/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/seats/reserve/route.ts) và được mô tả tại Mục 5.1 Tech Spec.
  - **Cơ chế chống bán trùng nhiều lớp:**
    1. *Bọc trong Giao dịch CSDL nguyên tử (`prisma.$transaction`):* Khi nhận request, server bắt đầu một Database Transaction.
    2. *Thuật toán kiểm tra điều kiện khóa nguyên tử:*
       ```typescript
       await prisma.$transaction(async (tx) => {
         const seat = await tx.seat.findFirst({ where: { id: seatId } });
         // Ghế bị khóa nếu đã bán (OCCUPIED) hoặc đang có người khác giữ chỗ hợp lệ
         const isLocked = seat.status === 'OCCUPIED' || 
           (seat.status === 'RESERVED' && seat.reservedUntil && new Date(seat.reservedUntil) > new Date());
         
         if (isLocked) {
           throw new AppError(409, `Ghế ${seat.code} đã có người chọn hoặc đã bán`);
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
    3. *Mức độ cô lập giao dịch (Transaction Isolation):* PostgreSQL sử dụng khóa hàng (Row-level Locking) khi thực hiện lệnh cập nhật trong transaction. Client nào gửi request đến trước (dù chỉ chênh lệch vài mili-giây) sẽ được cấp quyền cập nhật trạng thái `RESERVED`. Client đến sau ngay lập tức vấp phải điều kiện `isLocked === true` và nhận về phản hồi `HTTP 409 Conflict` kèm thông báo: *"Ghế A5 đã có người khác giữ chỗ, vui lòng chọn ghế khác"*.

---

### Câu 40: Tại sao thời gian giữ chỗ ghế lại được quy định là đúng 10 phút (`NOW() + 10 phút`)? Cơ sở nghiên cứu hành vi khách hàng và rủi ro giam ghế ảo (Seat Squatting) là gì?
- **Trọng tâm kiểm tra của Giảng viên:** Sự cân bằng giữa Trải nghiệm người dùng (UX) và Hiệu quả vận hành thương mại của rạp (Business Loss Prevention).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cơ sở nghiên cứu hành vi (User Experience):** Thời gian trung bình để một khách hàng hoàn tất quy trình: Chọn vị trí ghế -> Chọn loại vé (Adult/Child) -> Chọn bắp nước kèm theo -> Nhập mã Voucher -> Chuyển sang ứng dụng ngân hàng quét mã QR VNPay và nhập mã OTP thường dao động từ **4 đến 7 phút**. Quy định 10 phút là khoảng thời gian dư dả, thoải mái cho khách hàng thao tác mà không bị áp lực vội vã.
  - **Phòng chống giam ghế ảo (Seat Squatting / DoS Attack):**
    - Nếu để thời gian giữ ghế quá dài (ví dụ: 30 - 60 phút): Một đối thủ cạnh tranh hoặc kẻ phá hoại có thể tạo nhiều tài khoản, chọn giữ hết các hàng ghế đẹp của một suất chiếu bom tấn sát giờ chiếu rồi bỏ không thanh toán. Rạp sẽ bị "cháy vé ảo", khách thật không mua được, đến khi ghế tự nhả ra thì suất chiếu đã bắt đầu -> Rạp chịu thiệt hại doanh thu nặng nề.
    - Thời hạn 10 phút là tiêu chuẩn công nghiệp (Industry Standard) áp dụng tại các chuỗi rạp lớn như CGV, Lotte, Beta Cinemas.

---

### Câu 41: Cơ chế nào chịu trách nhiệm giải phóng ghế khi hết hạn 10 phút mà khách hàng không hoàn tất thanh toán? Phân tích sự khác biệt giữa Cron Job định kỳ (`/api/cron/release-seats`) và cơ chế Lazy Expiration khi có truy vấn?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu biết về các mô hình dọn dẹp dữ liệu hết hạn (Active Cleanup via Cron vs Passive/Lazy Evaluation) trong kiến trúc phân tán.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - Hệ thống Lumi Cinema kết hợp **cả 2 cơ chế (Hybrid Approach)** để đảm bảo độ tin cậy tuyệt đối:
    1. **Cơ chế thụ động (Lazy Expiration / Just-in-time Check):**
       - Diễn ra ngay trong câu lệnh kiểm tra ghế khi có bất kỳ ai truy cập suất chiếu hoặc bấm chọn ghế:
         ```typescript
         const isExpired = seat.status === 'RESERVED' && seat.reservedUntil && new Date(seat.reservedUntil) <= new Date();
         if (isExpired) {
           // Xem như ghế đã trống và cho phép người mới chọn đè lên
         }
         ```
       - *Ưu điểm:* Ghế được giải phóng ngay lập tức tại thời điểm có nhu cầu mua thực tế, không có độ trễ.
    2. **Cơ chế chủ động (Active Cron Job - `/api/cron/release-seats`):**
       - Một tác vụ nền (Vercel Cron hoặc Node-cron) được cấu hình chạy định kỳ mỗi 1 hoặc 2 phút một lần.
       - Thực thi câu lệnh SQL quét toàn hệ thống:
         ```sql
         UPDATE seats SET status = 'EMPTY', reserved_until = NULL 
         WHERE status = 'RESERVED' AND reserved_until < NOW();
         ```
       - *Ưu điểm:* Dọn sạch các ghế rác mà người dùng đã bỏ đi để giao diện sơ đồ ghế của tất cả những người đang xem trang cập nhật lại trạng thái ghế trống màu trắng.

---

### Câu 42: Nếu người dùng bất ngờ tắt trình duyệt, mất kết nối mạng 4G hoặc hết pin điện thoại ngay khi vừa chọn ghế xong, ghế đó sẽ ở trạng thái nào và bao giờ người khác mới có thể chọn lại?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý sự cố ngắt kết nối đột ngột (Abrupt Disconnection) từ phía Client và khả năng tự phục hồi (Self-healing) của hệ thống.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Trạng thái của ghế:** Do trình duyệt bị tắt đột ngột, client không thể gửi request `POST /api/seats/release` lên máy chủ. Ghế đó vẫn sẽ lưu trạng thái `RESERVED` trong cơ sở dữ liệu cùng với timestamp `reservedUntil` đã ghi nhận trước đó.
  - **Thời điểm mở lại cho người khác:**
    - Người khác sẽ tạm thời chưa chọn được ghế đó cho đến khi đồng hồ đếm lùi trên server chạm mốc `reservedUntil = NOW()`.
    - Tối đa sau 10 phút kể từ lúc người dùng bị ngắt kết nối, Cron Job quét qua hoặc người thứ hai bấm vào ghế đó, hệ thống nhận diện `reservedUntil < NOW()`, lập tức mở khóa ghế về `EMPTY` và cho phép người thứ hai đặt bình thường.

---

### Câu 43: Một khách hàng có thể giữ tối đa bao nhiêu ghế trong một lượt đặt vé? Tại sao trong code [`src/app/api/seats/reserve/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/seats/reserve/route.ts) bạn lại giới hạn tối đa 8 ghế?
- **Trọng tâm kiểm tra của Giảng viên:** Nghiệp vụ rạp chiếu phim về việc chống đầu cơ phe vé (Scalping Prevention) và kiểm soát số lượng đặt chỗ trên một đơn hàng.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Giới hạn số lượng:** Hệ thống Lumi Cinema giới hạn tối đa **8 ghế / 1 lần giao dịch**.
  - **Lý do nghiệp vụ:**
    1. *Quy mô phòng chiếu nhỏ (50 ghế):* Mỗi phòng của Lumi Cinema chỉ có 50 ghế (tương đương 5 hàng ghế). Nếu cho phép một người đặt 20 - 30 ghế một lúc, một cá nhân có thể gom gần như toàn bộ phòng chiếu.
    2. *Chống phe vé (Ticket Scalpers):* Ngăn chặn tình trạng các đối tượng gom vé số lượng lớn trong các suất chiếu đặc biệt/suất chiếu sớm của phim bom tấn để bán lại ngoài chợ đen với giá cắt cổ.
    3. *Phù hợp với nhóm khách hàng gia đình / bạn bè:* Khảo sát thực tế cho thấy nhóm đi xem phim cùng nhau phổ biến nhất là từ 2 đến 6 người. Con số 8 ghế đáp ứng thoải mái nhu cầu của 99% khách hàng thông thường mà vẫn đảm bảo tính an toàn cho hệ thống.

---

### Câu 44: Trong bảng `seats`, tại sao lại có chỉ mục duy nhất `@@unique([screeningId, code])`? Nếu không có ràng buộc Unique Index này ở tầng Database thì thảm họa gì có thể xảy ra?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ tầm quan trọng của Ràng buộc Toàn vẹn CSDL (Database Integrity Constraints) so với kiểm tra bằng mã nguồn ứng dụng (Application-level Validation).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Ý nghĩa của `@@unique([screeningId, code])`:** Đảm bảo rằng trong cùng một suất chiếu (`screeningId`), tuyệt đối không bao giờ tồn tại 2 bản ghi ghế có cùng mã ghế (`code`, ví dụ: không thể có 2 ghế "A1" trong cùng suất chiếu số 12).
  - **Hậu quả nếu thiếu ràng buộc Unique Index ở tầng Database:**
    - Nếu chỉ kiểm tra bằng mã JavaScript (`if (!exist) create()`), trong điều kiện mạng cao điểm hoặc race condition khi Admin tạo suất chiếu, 2 request có thể chạy song song và cùng lúc tạo ra hai bản ghi ghế "A1" cho cùng một suất chiếu.
    - Khi đó, sơ đồ ghế phòng chiếu sẽ bị nhân đôi lên 100 ghế thay vì 50 ghế.
    - Hai khách hàng khác nhau có thể mua thành công 2 chiếc vé cùng mang số ghế "A1" (mỗi người ứng với một ID ghế khác nhau trong DB), dẫn đến xung đột thực tế tại rạp khi 2 người cùng tranh nhau một chỗ ngồi vật lý.

---

### Câu 45: Phân tích chi tiết vòng đời chuyển đổi trạng thái của thực thể Ghế ngồi (`SeatStatus`): `EMPTY` -> `RESERVED` -> `OCCUPIED`. Khi nào một ghế `OCCUPIED` có thể quay ngược lại thành `EMPTY`?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng đọc hiểu Sơ đồ Chuyển trạng thái (State Machine Diagram) của thực thể cốt lõi trong đồ án.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Vòng đời chuẩn (Normal Lifecycle):**
    1. `EMPTY` (Ghế trống): Khởi tạo khi tạo suất chiếu. Khách có thể bấm chọn.
    2. `RESERVED` (Đang giữ chỗ 10 phút): Chuyển sang khi khách bấm chọn ghế và gọi API `/api/seats/reserve`.
    3. `OCCUPIED` (Đã bán chính thức): Chuyển sang khi cổng thanh toán VNPay trả về kết quả IPN thành công hoặc nhân viên quầy thu tiền mặt thành công.
  - **Khi nào một ghế `OCCUPIED` được quay ngược về `EMPTY`?**
    - Ghế đã `OCCUPIED` chỉ quay về `EMPTY` trong duy nhất **2 trường hợp hủy vé hợp lệ**:
      1. *Khách hàng chủ động hủy vé:* Thực hiện trước giờ chiếu $\ge 2$ tiếng theo quy chế BR-03. Vé chuyển sang `Cancelled`, ghế lập tức được cập nhật về `EMPTY` để hệ thống bán lại cho khách khác.
      2. *Rạp gặp sự cố bất khả kháng (Hỏng điều hòa, mất điện):* Nhân viên hoặc Admin kích hoạt hủy vé sự cố. Vé chuyển sang `Cancelled` kèm công nợ chờ hoàn tiền, ghế được giải phóng về `EMPTY`.

---

### Câu 46: Khi khách hàng chọn loại vé (Adult: 100%, Child: 50%), hệ thống kiểm tra logic gì đối với các bộ phim có nhãn phân loại độ tuổi C13 hoặc T18 theo quy chế BR-02?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng tích hợp quy định pháp luật về điện ảnh (Luật Điện ảnh Việt Nam về độ tuổi khán giả) vào quy tắc nghiệp vụ phần mềm (Business Rules Validation).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy chế BR-02 và Phân loại nhãn phim:**
    - `P` (Phim phổ biến): Mọi lứa tuổi -> Cho phép chọn cả Vé Thường (Adult) và Vé Trẻ em (Child).
    - `C13` (Cấm khán giả dưới 13 tuổi): Chỉ dành cho người từ 13 tuổi trở lên -> Khóa lựa chọn Vé Trẻ em (vì trẻ em theo quy định rạp là dưới 12 tuổi/cao dưới 1m3).
    - `T18` (Cấm khán giả dưới 18 tuổi): Phim người lớn -> **Tuyệt đối khóa lựa chọn Vé Trẻ em**.
  - **Logic kiểm tra trong mã nguồn:**
    - *Ở Frontend:* Giao diện kiểm tra `movie.ageRating`. Nếu là `T18` hoặc `C13`, ô dropdown/nút chọn "Vé Trẻ Em" bị làm mờ (disabled) hoặc ẩn hoàn toàn, ép buộc 100% số ghế phải mua vé Adult.
    - *Ở Backend API (`/api/payments/initiate`):* Kiểm tra lại một lần nữa:
      ```typescript
      if (movie.ageRating === 'T18' && ticketItems.some(item => item.type === 'Child')) {
        throw new AppError(400, 'Phim nhãn T18 không áp dụng vé Trẻ em theo quy chế pháp luật');
      }
      ```

---

### Câu 47: Tại sao thiết kế sơ đồ ghế ngồi của Lumi Cinema lại cố định 50 ghế (5 hàng A-E, 10 cột 1-10) thay vì cho phép Admin cấu hình động số hàng, số cột tùy ý? Ưu và nhược điểm của quyết định thiết kế này trong phạm vi đồ án?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ phạm vi giới hạn của đề tài (Scope Definition), tính thực tiễn và sự đánh đổi kỹ thuật (Technical Trade-off).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do thiết kế cố định 50 ghế:**
    - *Mô hình rạp đơn tiêu chuẩn:* Lumi Cinema đặc tả cho mô hình rạp chiếu phim mini gồm 5 phòng chiếu đồng bộ, mỗi phòng có diện tích và kết cấu âm thanh chuẩn cho 50 ghế đơn tiêu chuẩn.
    - *Tối ưu hóa hiệu năng render UI:* Ma trận 5x10 giúp giao diện ma trận ghế (Seat Matrix) hiển thị sắc nét, vừa vặn trên màn hình điện thoại di động mà không cần người dùng phải cuộn ngang cuộn dọc (Horizontal Scroll) gây ức chế.
  - **Ưu điểm:** Giảm độ phức tạp của thuật toán quản lý sơ đồ ghế, giảm rủi ro lỗi giao diện, tập trung toàn bộ nguồn lực phát triển vào các nghiệp vụ phức tạp cốt lõi như xử lý Concurrency, Đền bù bồi hoàn và Báo cáo tài chính.
  - **Định hướng mở rộng tương lai (Khi bảo vệ đồ án):** Lược đồ CSDL bảng `seats` đã được thiết kế sẵn các cột `row`, `number`, `type` (`STANDARD`, `VIP`, `COUPLE`) và liên kết `screening_id`. Khi cần mở rộng thành sơ đồ động nhiều kích thước phòng khác nhau, hệ thống chỉ cần thêm một bảng `rooms` chứa `total_rows` và `total_columns` mà không phải đập bỏ cấu trúc bảng `seats`.

---

### Câu 48: Tại sao toàn bộ thao tác kiểm tra trạng thái ghế và cập nhật `RESERVED` phải được bọc trong giao dịch nguyên tử `prisma.$transaction`? Nếu không dùng transaction, hiện tượng Race Condition (Dirty Read / Non-repeatable Read) sẽ diễn ra như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Bản chất của tính chất ACID (Atomicity, Consistency, Isolation, Durability) trong hệ quản trị cơ sở dữ liệu quan hệ.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Kịch bản Race Condition nếu KHÔNG dùng Transaction:**
    1. *Bước 1 (Client A đọc DB):* Gọi `findUnique(A5)`, thấy `status = EMPTY`.
    2. *Bước 2 (Client B đọc DB):* Ngay sau đó 1ms, Client B cũng gọi `findUnique(A5)`, cũng thấy `status = EMPTY` vì Client A chưa kịp cập nhật.
    3. *Bước 3 (Client A ghi DB):* Chạy `update(A5, status = RESERVED)`.
    4. *Bước 4 (Client B ghi DB):* Chạy tiếp `update(A5, status = RESERVED)`. Lệnh của B ghi đè lên lệnh của A.
    - *Hậu quả:* Cả Client A và Client B đều tin rằng mình đã giữ ghế A5 thành công. Màn hình của cả 2 đều đếm ngược 10 phút. Đến bước thanh toán cuối cùng sẽ xảy ra xung đột không thể giải quyết.
  - **Giải pháp với `prisma.$transaction`:** Thao tác Đọc và Ghi được khóa lại thành một đơn vị công việc duy nhất (Atomic Unit). Client B buộc phải đợi Client A hoàn tất toàn bộ transaction; khi đến lượt B đọc, trạng thái của ghế đã là `RESERVED` và giao dịch của B bị từ chối ngay lập tức.

---

### Câu 49: Bộ đếm ngược 10 phút ở Frontend (`CountdownTimer.tsx`) hoạt động như thế nào? Nếu một người dùng am hiểu kỹ thuật cố tình chỉnh lùi giờ hệ thống trên máy tính của họ (Client Clock Tampering) thì có kéo dài được thời gian giữ ghế không? Tại sao?
- **Trọng tâm kiểm tra của Giảng viên:** Phân định ranh giới bảo mật giữa Client và Server (Client Clock Untrustworthiness).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cách thức hoạt động của Component Frontend:**
    - Khi nhận response giữ chỗ thành công từ server, server trả về mốc thời gian tuyệt đối `reservedUntil` (dạng ISO UTC string, ví dụ: `2026-10-25T14:30:00Z`).
    - Component `CountdownTimer.tsx` dùng `setInterval(1000)` để tính khoảng cách còn lại: `remaining = Math.max(0, targetTime - Date.now())` và hiển thị `mm:ss`. Dùng `useRef` lưu cờ đếm để tránh kích hoạt re-render lặp vô tận.
  - **Nếu người dùng chỉnh giờ máy tính thì sao?**
    - **HOÀN TOÀN KHÔNG KÉO DÀI ĐƯỢC THỜI GIAN GIỮ GHẾ**.
    - Việc chỉnh đồng hồ máy tính chỉ làm sai lệch giao diện hiển thị trên trình duyệt của người đó.
    - Khi người đó bấm nút "Xác nhận thanh toán" gửi request lên API `/api/payments/initiate`, server Next.js sẽ tự so sánh thời gian hiện tại của Server (Server System Time) với `seat.reservedUntil` trong database PostgreSQL. Nếu `serverTime > reservedUntil`, server lập tức trả về lỗi `400 Bad Request: Phiên giữ ghế của bạn đã hết hạn` và từ chối tạo giao dịch thanh toán.

---

### Câu 50: Khi phiên giữ ghế hết hạn 10 phút, các gói combo bắp nước đi kèm trong phiên đó có được tự động nhả số lượng tồn kho khả dụng (`stock`) về lại cho người khác mua không?
- **Trọng tâm kiểm tra của Giảng viên:** Tính đồng bộ hóa (Synchronization) giữa hai tài nguyên bị khóa trong một phiên đặt hàng: Ghế ngồi (`Seat`) và Tồn kho bắp nước (`Combo Stock`).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cơ chế xử lý đồng bộ của Lumi Cinema:**
    1. Khi khách chọn combo cùng với ghế, hệ thống gọi API `/api/combos/reserve` để tạo bản ghi trong bảng `combo_reservations` với cùng thời hạn `reservedUntil = NOW() + 10 phút` và trừ tạm thời vào số lượng tồn kho hiển thị.
    2. Nếu phiên thanh toán hết hạn hoặc bị hủy:
       - Endpoint giải phóng định kỳ `/api/cron/release-combos` quét các bản ghi giữ chỗ combo có `reservedUntil < NOW()`.
       - Hệ thống tự động chuyển trạng thái bản ghi thành `RELEASED`, đồng thời hoàn trả lại số lượng bắp nước tương ứng vào cột `combos.stock`.
    3. Cơ chế này đảm bảo rạp không bị thất thoát bắp nước ảo, giúp lượng tồn kho hiển thị trên web luôn phản ánh chính xác số lượng thực tế có trong kho của rạp.

---

## PHẦN 4: PHÂN HỆ CỔNG THANH TOÁN TRỰC TUYẾN & XỬ LÝ GIAO DỊCH VNPAY (08 CÂU)
*(Tập trung chuyên sâu vào Tích hợp Cổng thanh toán, Chữ ký số HMAC-SHA512, Phân biệt IPN vs Return URL, Tính lũy đẳng Idempotency & Xử lý rớt mạng)*

---

### Câu 51: Trình bày toàn bộ luồng tích hợp thanh toán VNPay từ lúc người dùng ấn nút "Xác nhận thanh toán" đến khi mã QR vé hiển thị trên màn hình? Đối chiếu với Sequence Diagram 11 (`11_thanh_toan_vnpay_momo.puml`).
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng nắm vững luồng tương tác ngoại vi (External Service Integration Flow) giữa Client, Server của rạp và Cổng thanh toán bên thứ ba.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy trình 6 bước chuẩn mực:**
    1. *Khởi tạo giao dịch (Initiate):* Khách hàng ấn nút thanh toán trên trang Checkout -> Gửi request `POST /api/payments/initiate`. Server kiểm tra ghế, tính toán tổng tiền độc lập phía máy chủ, tạo bản ghi `Payment` với `status = Pending`.
    2. *Sinh URL thanh toán có ký số:* Server sắp xếp các tham số VNPay theo thứ tự alphabet, tính chuỗi băm bảo mật `vnp_SecureHash` bằng thuật toán HMAC-SHA512 với khóa bí mật `VNPAY_HASH_SECRET`, trả về Payment URL cho client.
    3. *Chuyển hướng cổng thanh toán:* Trình duyệt chuyển hướng người dùng sang trang thanh toán của VNPay Sandbox. Khách quét mã VietQR hoặc nhập thông tin thẻ và mã OTP.
    4. *Giao tiếp bất đồng bộ qua Webhook IPN (Server-to-Server):* VNPay gửi Webhook `POST /api/payments/vnpay-ipn` về server Lumi Cinema kèm chữ ký số. Server xác thực chữ ký, bọc trong `prisma.$transaction` để: Chuyển `Payment.status = Success`, sinh các vé `Valid` trong bảng `tickets`, khóa ghế `OCCUPIED`, trừ tồn kho combo và sinh mã ký QR HMAC-SHA256. Phản hồi lại cho VNPay: `{"RspCode": "00", "Message": "Confirm Success"}`.
    5. *Chuyển hướng người dùng (Return URL):* VNPay điều hướng trình duyệt của khách về `GET /api/payments/vnpay-return` kèm các query params để hiển thị trang thông báo kết quả.
    6. *Hiển thị vé điện tử:* Trang web đọc thông tin vé vừa phát hành từ database và hiển thị chi tiết vé kèm mã QR để khách lưu lại hoặc chuẩn bị soát vé tại rạp.

---

### Câu 52: Thuật toán băm HMAC-SHA512 đóng vai trò gì trong việc tạo URL thanh toán và xác thực Webhook phản hồi từ VNPay? Khóa bí mật `VNPAY_HASH_SECRET` được lưu trữ và bảo vệ như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu bản chất của cơ chế Chữ ký số và Bảo vệ toàn vẹn dữ liệu chống gian lận thay đổi số tiền (Data Tampering / Man-in-the-Middle Attack).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Vai trò của HMAC-SHA512:**
    1. *Chống sửa đổi số tiền giao dịch:* Kẻ gian có thể can thiệp request trên trình duyệt để sửa tham số `vnp_Amount` từ 100.000đ thành 1.000đ. Khi VNPay nhận được request, VNPay dùng `VNPAY_HASH_SECRET` băm lại toàn bộ dữ liệu và so sánh với `vnp_SecureHash`. Nếu không khớp, giao dịch bị từ chối ngay.
    2. *Xác thực tính chính danh của nguồn tin:* Khi server Lumi Cinema nhận Webhook IPN, việc kiểm tra chữ ký đảm bảo rằng request này thực sự xuất phát từ máy chủ VNPay chứ không phải từ một hacker gửi request giả mạo nhằm chiếm đoạt vé xem phim.
  - **Bảo vệ khóa bí mật `VNPAY_HASH_SECRET`:**
    - Khóa bí mật được lưu trong biến môi trường `.env.local` ở máy chủ backend.
    - Tuyệt đối không bao giờ được đặt tiền tố `NEXT_PUBLIC_` (vì tiền tố này sẽ khiến Next.js bundle khóa vào file JavaScript tải xuống trình duyệt người dùng).
    - Được đưa vào `.gitignore` để tránh bị lộ lên GitHub công khai.

---

### Câu 53: Khái niệm Idempotency (Tính lũy đẳng) trong xử lý Webhook IPN (`/api/payments/vnpay-ipn`) là gì? Nếu hệ thống VNPay gặp sự cố mạng và vô tình bắn Webhook IPN 3 lần liên tiếp cho cùng 1 đơn hàng, hệ thống của bạn xử lý thế nào để không phát sinh 3 bộ vé trùng nhau?
- **Trọng tâm kiểm tra của Giảng viên:** Khái niệm cốt lõi trong lập trình hệ thống phân tán và thanh toán tài chính (Idempotent API Design).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Khái niệm Idempotency (Tính lũy đẳng):** Là tính chất của một thao tác mà dù có thực thi 1 lần hay lặp lại $N$ lần với cùng một dữ liệu đầu vào thì kết quả cuối cùng trên hệ thống và trạng thái cơ sở dữ liệu vẫn không thay đổi so với lần gọi đầu tiên.
  - **Cơ chế xử lý lũy đẳng của Lumi Cinema ([`src/app/api/payments/vnpay-ipn/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/payments/vnpay-ipn/route.ts)):**
    1. Khi IPN đầu tiên tới: Hệ thống tìm bản ghi `Payment` theo mã `transactionCode`. Nhận thấy `payment.status === 'Pending'`.
    2. Bắt đầu transaction: Cập nhật `payment.status = 'Success'`, tạo các bản ghi `Ticket` tương ứng. Trả về kết quả `"00"` (Success) cho VNPay.
    3. Khi IPN thứ 2 hoặc thứ 3 tới (do mạng lag hoặc VNPay retry):
       - Hệ thống truy vấn: `const payment = await prisma.payment.findUnique(...)`.
       - Nhận thấy `payment.status === 'Success'` (đơn này đã được xử lý xong trước đó).
       - **Lập tức dừng lại**, không chạy lại logic tạo vé hay trừ kho nữa, mà trả về ngay phản hồi: `{"RspCode": "02", "Message": "Order already confirmed"}` cho VNPay.
    - Nhờ cơ chế kiểm tra trạng thái trước khi thực thi, dù VNPay có gửi lại 100 lần thì khách hàng vẫn chỉ có duy nhất 1 bộ vé hợp lệ, kho combo không bị trừ thừa và ghế không bị lỗi.

---

### Câu 54: Phân biệt bản chất và trách nhiệm giữa hai URL tiếp nhận kết quả thanh toán: `vnpay-return` (Return URL) và `vnpay-ipn` (Instant Payment Notification). Tại sao tuyệt đối không được cập nhật trạng thái đơn hàng và xuất vé ở trang `vnpay-return`?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ lỗ hổng bảo mật phổ biến nhất khi tích hợp cổng thanh toán (Security Flaw in Payment Return Handling).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Phân biệt bản chất:**
    - `vnpay-return` (Client-side Redirect): Là trang giao diện trên trình duyệt người dùng được cổng thanh toán điều hướng về sau khi kết thúc quá trình thanh toán.
    - `vnpay-ipn` (Server-to-Server Webhook): Là lời gọi HTTP POST ngầm trực tiếp giữa máy chủ VNPay và máy chủ Lumi Cinema, hoàn toàn độc lập với thiết bị hay mạng của khách hàng.
  - **Tại sao TUYỆT ĐỐI KHÔNG cập nhật trạng thái đơn hàng ở `vnpay-return`?**
    1. *Người dùng có thể can thiệp tham số:* Người dùng có thể sửa đổi các tham số trên thanh địa chỉ URL (`?vnp_ResponseCode=00`) để giả mạo việc thanh toán thành công mà không hề trả tiền thật.
    2. *Rủi ro rớt mạng / Đóng tab:* Nếu khách hàng vừa nhập mã OTP xong mà bị mất mạng 4G hoặc vô tình đóng tab trình duyệt trước khi trang `vnpay-return` kịp tải xong, đơn hàng sẽ bị "treo" vĩnh viễn ở trạng thái `Pending` dù khách đã bị ngân hàng trừ tiền.
    3. *Quy chuẩn bảo mật:* `vnpay-ipn` mới là kênh liên lạc chính thức, đáng tin cậy duy nhất để xác thực và cập nhật dữ liệu tài chính vào cơ sở dữ liệu. Trang `vnpay-return` chỉ có duy nhất một nhiệm vụ là hiển thị giao diện thông báo kết quả cho người dùng.

---

### Câu 55: Nếu khách hàng đã bị ngân hàng trừ tiền nhưng do mất mạng 4G nên trình duyệt không thể điều hướng về trang web rạp, đơn hàng trên hệ thống sẽ ở trạng thái nào? Webhook IPN của VNPay cứu vãn giao dịch này ra sao?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng tự phục hồi và bảo toàn tính toàn vẹn của giao dịch khi xảy ra sự cố ngắt kết nối phía Client (Network Drop Tolerance).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Tình trạng của đơn hàng:** Đơn hàng **VẪN THÀNH CÔNG VÀ VÉ VẪN ĐƯỢC XUẤT ĐẦY ĐỦ**.
  - **Cơ chế cứu vãn của Webhook IPN:**
    - Cổng thanh toán VNPay giao tiếp với máy chủ Lumi Cinema qua đường truyền Server-to-Server độc lập.
    - Ngay khi tiền bị trừ tại tài khoản ngân hàng, máy chủ VNPay tự động kích hoạt gửi tín hiệu IPN trực tiếp tới endpoint `/api/payments/vnpay-ipn` của Lumi Cinema.
    - Máy chủ Lumi Cinema nhận được IPN, tự động cập nhật `Payment.status = Success`, chuyển vé sang `Valid`, tạo mã QR và gửi email hóa đơn vé điện tử vào hòm thư Gmail của khách thông qua Nodemailer.
    - Khi khách hàng có mạng trở lại, họ chỉ cần mở email hoặc đăng nhập vào mục "Vé của tôi" (`/tickets`) trên trang web là sẽ thấy vé đã sẵn sàng, không bị mất tiền oan.

---

### Câu 56: Tại sao hệ thống hiện tại lại sử dụng môi trường thử nghiệm Sandbox của VNPay mà chưa đấu nối thật với tài khoản doanh nghiệp của rạp? Cần thay đổi những thông số nào trong file `.env` khi đưa vào vận hành thực tế?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu biết về quy trình thương mại hóa và triển khai môi trường thực tế (Production Deployment Readiness).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do sử dụng Sandbox trong đồ án:**
    - Môi trường Sandbox của VNPay cung cấp đầy đủ các endpoint API, thuật toán mã hóa chữ ký số và cơ chế Webhook giống 100% môi trường Production thực tế.
    - Để có tài khoản VNPay Production thật, doanh nghiệp bắt buộc phải có Giấy phép đăng ký kinh doanh rạp chiếu phim, Hợp đồng kinh tế và Tài khoản thanh toán doanh nghiệp có mã số thuế do nhà nước cấp (phù hợp cho giai đoạn bảo vệ đồ án tốt nghiệp bằng môi trường Sandbox).
  - **Các thông số cần thay đổi khi đưa lên Production:**
    1. `VNPAY_URL`: Đổi từ `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` sang endpoint chính thức của VNPay (`https://vnpayment.vn/paymentv2/vpcpay.html`).
    2. `VNPAY_TMN_CODE`: Đổi sang Mã định danh doanh nghiệp chính thức được VNPay cấp sau khi ký hợp đồng.
    3. `VNPAY_HASH_SECRET`: Đổi sang Chuỗi khóa bí mật Production do VNPay cấp riêng.
    4. `VNPAY_RETURN_URL`: Đổi từ `http://localhost:3000/...` sang tên miền thương mại có chứng chỉ bảo mật HTTPS (Ví dụ: `https://lumicinema.vn/api/payments/vnpay-return`).

---

### Câu 57: Trong bảng `payments`, trường `status` gồm các giá trị `Pending`, `Success`, `Failed`, `Refunded`. Khi nào một giao dịch chuyển sang `Failed` và khi nào chuyển sang `Refunded`?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng nắm vững Máy trạng thái thanh toán (Payment State Machine) trong lược đồ dữ liệu.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Chuyển sang `Failed` (Thanh toán thất bại):**
    - Khi khách hàng chủ động bấm "Hủy giao dịch" trên màn hình cổng VNPay.
    - Khi tài khoản ngân hàng của khách không đủ số dư hoặc vượt hạn mức chi tiêu trong ngày.
    - Khi quá thời hạn thanh toán (hết 10 phút giữ ghế) mà cổng thanh toán phản hồi mã lỗi `vnp_ResponseCode !== '00'`.
  - **Chuyển sang `Refunded` (Đã hoàn tiền):**
    - Khi giao dịch ban đầu đã từng thành công (`Success`), tiền đã thu vào tài khoản của rạp.
    - Nhưng sau đó suất chiếu bị sự cố nghiêm trọng (cháy phòng chiếu, mất điện toàn khu vực) và Admin kích hoạt quy trình hủy hoàn tiền cho toàn bộ đơn hàng. Bản ghi `Payment` được cập nhật trạng thái `Refunded` để phục vụ công tác đối soát thuế cuối quý.

---

### Câu 58: Khi khách hàng chủ động bấm nút "Hủy giao dịch" trên giao diện cổng thanh toán VNPay hoặc tài khoản ngân hàng không đủ số dư, hệ thống xử lý hoàn trả ghế và voucher như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý kịch bản lỗi thanh toán và cơ chế phục hồi tài nguyên (Resource Rollback on Payment Failure).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Luồng xử lý Rollback tự động:**
    1. *Khi cổng VNPay trả về mã lỗi (`vnp_ResponseCode !== '00'`):*
       - Bản ghi `Payment` chuyển sang trạng thái `Failed`.
    2. *Giải phóng ghế ngay lập tức:*
       - Danh sách ghế trong phiên đó được cập nhật trạng thái từ `RESERVED` về `EMPTY`, đồng thời xóa trắng timestamp `reservedUntil = NULL`. Ghế xuất hiện màu trắng trở lại trên sơ đồ để những khách hàng khác có thể chọn mua.
    3. *Hoàn lại lượt sử dụng của Voucher:*
       - Nếu khách hàng có nhập mã Voucher khuyến mãi trong đơn hàng này, hệ thống thực hiện câu lệnh SQL giảm biến đếm `usedCount` xuống 1 (`prisma.coupon.update({ data: { usedCount: { decrement: 1 } } })`). Khách hàng có thể tiếp tục sử dụng lại mã giảm giá đó cho đơn hàng tiếp theo mà không bị mất quyền lợi.
    4. *Nhả tồn kho combo:* Các gói combo trong bảng `combo_reservations` được chuyển sang trạng thái `RELEASED` và cộng trả lại vào kho hàng khả dụng.

---

## PHẦN 5: PHÂN HỆ BÁN VÉ & BÁN COMBO TẠI QUẦY POS (STAFF OPERATIONS) (08 CÂU)
*(Tập trung chuyên sâu vào Giao diện POS tốc độ cao, Xử lý khách vãng lai, Bán combo độc lập, Phương thức thanh toán quầy, Kiểm soát gian lận thu ngân & In lại vé)*

---

### Câu 59: Giao diện bán vé tại quầy POS (`/staff/pos`) được thiết kế khác biệt như thế nào so với giao diện đặt vé trực tuyến của khách hàng? Những tối ưu hóa nào phục vụ thao tác tốc độ cao của nhân viên thu ngân?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu biết về Thiết kế trải nghiệm người dùng theo ngữ cảnh nghiệp vụ (Context-aware UI/UX Design for Point of Sale).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Sự khác biệt cốt lõi:**
    - *Giao diện Khách hàng Online:* Tập trung vào tính trực quan, đồ họa đẹp mắt, xem trailer, đọc tóm tắt nội dung phim, khám phá poster và quy trình đặt vé chia làm nhiều bước (Multi-step Wizard) để tăng trải nghiệm.
    - *Giao diện Nhân viên POS Quầy:* Tập trung vào **Tốc độ (Speed) và Giảm thiểu số lượt nhấp chuột (Minimal Clicks)**. Thiết kế theo dạng Dashboard một màn hình duy nhất (Single-screen POS Layout), hỗ trợ phím tắt và thao tác cảm ứng chạm nhanh để phục vụ hàng dài khách đang xếp hàng giờ cao điểm.
  - **Những tối ưu hóa tốc độ cao tại quầy:**
    1. Bộ lọc suất chiếu nhanh theo phòng và giờ chiếu ngay trên thanh công cụ đầu trang.
    2. Sơ đồ ghế 50 vị trí phản hồi tức thì với thao tác chọn/bỏ chọn nhiều ghế bằng một chạm.
    3. Nút chuyển đổi nhanh loại vé (Adult / Child) trực tiếp trên từng ghế vừa chọn.
    4. Nút thanh toán tiền mặt nhanh với các mệnh giá tiền định sẵn (50k, 100k, 200k, 500k) và tự động tính tiền thối cho khách trong 0.1 giây.

---

### Câu 60: Nhân viên quầy có quyền chọn loại vé Trẻ em (Child - giảm 50%) cho khách hàng không? Quy trình kiểm tra thực tế tại quầy diễn ra như thế nào để tránh tình trạng người lớn gian lận mua vé trẻ em?
- **Trọng tâm kiểm tra của Giảng viên:** Quy trình nghiệp vụ kiểm soát tại chỗ (On-site Operational Policy) và sự phân quyền giữa vai trò Nhân viên và Khách hàng.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quyền hạn của nhân viên:** Nhân viên quầy được phép chọn loại vé Trẻ em cho khách hàng, **NHƯNG** phải tuân thủ nghiêm ngặt 2 lớp kiểm soát:
    1. *Lớp kiểm soát kỹ thuật phần mềm:* Nếu phim thuộc nhãn `C13` hoặc `T18`, phần mềm POS tự động khóa không cho chọn vé Trẻ em (áp dụng quy chế BR-02 đồng bộ như kênh online).
    2. *Lớp kiểm soát nghiệp vụ trực tiếp (Physical Verification):* Theo quy chế rạp, vé Trẻ em chỉ áp dụng cho trẻ em có chiều cao dưới 1m3 hoặc dưới 12 tuổi có xuất trình giấy khai sinh / thẻ học sinh.
  - Tại quầy vé của Lumi Cinema luôn bố trí thước đo chiều cao tiêu chuẩn. Nhân viên thu ngân có trách nhiệm mời khách hàng nhí đứng vào thước đo trước khi bấm chọn loại vé "Child (50%)".

---

### Câu 61: Chức năng bán combo bắp nước độc lập tại quầy (`/api/staff/pos/combos`) giải quyết bài toán nghiệp vụ gì trong thực tế? Tại sao không bắt buộc phải có vé xem phim mới được mua bắp nước?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ mô hình kinh doanh đa dạng hóa nguồn thu (Non-ticket Revenue Stream) của các rạp chiếu phim hiện đại.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Ý nghĩa nghiệp vụ thực tế:**
    1. *Khách đã mua vé online từ trước:* Khách hàng đã đặt vé qua app/web nhưng lúc đó chưa mua bắp nước; khi đến rạp, khách muốn mua thêm combo trực tiếp tại quầy mà không muốn phải thao tác lại trên điện thoại.
    2. *Khách vãng lai bên ngoài rạp:* Rạp chiếu phim thường nằm tại các trung tâm thương mại hoặc khu vui chơi đông đúc. Rất nhiều khách đi dạo phố, thanh thiếu niên chỉ muốn ghé quầy mua bắp rang bơ mang đi (Take-away) mà không có nhu cầu xem phim.
  - Doanh thu từ bắp nước và đồ uống chiếm từ 30% đến 45% tổng lợi nhuận của một rạp chiếu phim. Nếu phần mềm bắt buộc phải có vé xem phim mới cho tạo đơn bắp nước thì rạp sẽ tự đánh mất một nguồn doanh thu khổng lồ.
  - Vì vậy, API `/api/staff/pos/combos` cho phép tạo đơn hàng chỉ chứa `OrderCombo` mà không cần trường `screeningId` hay `ticketItems`.

---

### Câu 62: Hình thức thanh toán tại quầy POS hỗ trợ những phương thức nào (Tiền mặt - Cash, Chuyển khoản QR - POS_QR)? Dữ liệu được lưu trữ vào bảng `payments` như thế nào để phục vụ đối soát ca trực?
- **Trọng tâm kiểm tra của Giảng viên:** Thiết kế cơ sở dữ liệu và xử lý phương thức thanh toán trực tiếp tại điểm bán.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Các phương thức thanh toán hỗ trợ tại quầy:**
    1. `Cash` (Tiền mặt): Khách trả tiền mặt trực tiếp cho thu ngân.
    2. `BankCard` / `POS_QR` (Thanh toán điện tử tại quầy): Khách quẹt thẻ qua máy POS ngân hàng hoặc quét mã VietQR tĩnh của rạp.
  - **Cách lưu trữ trong bảng `payments` ([`src/app/api/staff/pos/tickets/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/staff/pos/tickets/route.ts)):**
    - Cột `payment_method` được gán chính xác giá trị `Cash` hoặc `BankCard`.
    - Cột `status` được đặt là `Success` ngay lập tức (vì nhân viên đã cầm tiền trong tay hoặc thấy thông báo chuyển khoản thành công trước khi ấn xác nhận).
    - Cột `user_id` lưu ID của nhân viên thu ngân thực hiện ca trực đó.
    - Cột `created_at` lưu mốc thời gian chính xác để khi kết thúc ca, hệ thống có thể chạy truy vấn nhóm theo `payment_method` để đối soát xem nhân viên phải nộp lại bao nhiêu tiền mặt vào két an toàn của rạp.

---

### Câu 63: Khi khách hàng có tài khoản thành viên đến mua vé tại quầy, nhân viên tra cứu và gắn định danh tài khoản bằng những thông tin gì? Lợi ích của việc định danh đối với khách hàng?
- **Trọng tâm kiểm tra của Giảng viên:** Nghiệp vụ quản lý khách hàng thân thiết (Customer Relationship Management - CRM) tại quầy giao dịch.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cách tra cứu tại quầy:**
    - Màn hình POS có ô tìm kiếm nhanh hỗ trợ tra cứu theo: **Số điện thoại** hoặc **Địa chỉ Email** của khách hàng.
    - API `/api/staff/tickets/search` trả về thông tin tên khách, hạng thành viên và các voucher hiện có trong tài khoản của khách.
  - **Lợi ích đối với khách hàng:**
    1. *Tích điểm thành viên:* Giao dịch được gắn với `user_id` của khách, điểm thưởng được cộng vào tài khoản để đổi quà/vé miễn phí trong tương lai.
    2. *Sử dụng Voucher cá nhân:* Nhân viên có thể chọn áp dụng các mã Voucher bồi hoàn hoặc mã giảm giá sinh nhật có sẵn trong ví voucher của khách.
    3. *Xem lại lịch sử vé trên App/Web:* Khách mua vé tại quầy nhưng sau đó vẫn có thể mở điện thoại ra xem lại lịch sử vé và xuất trình mã QR điện tử nếu làm mất vé giấy.

---

### Câu 64: Sau khi nhân viên bấm "Xác nhận đã thu tiền", quy trình in vé giấy và phiếu bắp nước diễn ra như thế nào? Vé giấy in tại quầy có mã QR để quét qua cửa kiểm soát không?
- **Trọng tâm kiểm tra của Giảng viên:** Tích hợp phần cứng thiết bị ngoại vi (Hardware Integration - Thermal Receipt Printer) và quy trình vận hành kiểm soát vé giấy.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy trình in vé:**
    1. Sau khi API ghi nhận giao dịch thành công, server trả về chi tiết vé và chuỗi ký số `sig` HMAC-SHA256.
    2. Trình duyệt client tự động gọi lệnh in chuẩn web `window.print()` hoặc gửi lệnh in ngầm tới Driver máy in nhiệt khổ K80 (80mm) kết nối qua cổng USB/LAN.
    3. Máy in xuất ra 2 liên:
       - Liên 1: **Vé xem phim giấy (Movie Ticket):** Chứa Tên phim, Phòng chiếu, Suất chiếu, Vị trí ghế, Loại vé, Giá tiền, và **BẮT BUỘC IN MÃ QR CODE KÝ SỐ**.
       - Liên 2 (nếu có mua bắp nước): **Phiếu nhận Combo (Concession Receipt):** Ghi rõ tên gói bắp nước, số lượng và Mã đơn hàng để khách cầm sang quầy bắp nước nhận đồ.
  - **Vé giấy có mã QR không?**
    - **CHẮC CHẮN CÓ**. Mã QR in trên vé giấy chứa cùng một cấu trúc JSON và chữ ký số HMAC-SHA256 giống hệt vé điện tử trên điện thoại. Nhân viên soát vé tại cửa chỉ cần dùng đầu đọc mã vạch quét mã QR trên vé giấy là hệ thống kiểm tra và đổi trạng thái sang `Used` bình thường.

---

### Câu 65: Nếu một nhân viên quầy POS cố tình bán vé Trẻ em cho người lớn (thu của khách 100.000đ nhưng chỉ nhập vào phần mềm 50.000đ vé Child để ăn chặn 50.000đ tiền mặt), hệ thống có cơ chế kiểm soát hoặc truy vết nào không?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng phòng chống gian lận nội bộ (Internal Fraud Prevention) và đối soát chéo giữa bộ phận Thu ngân và Soát vé.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Hệ thống Lumi Cinema kiểm soát gian lận qua cơ chế Kiểm Soát Chéo 2 Lớp (Two-tier Cross Check):**
    1. *Thông tin vé được in to rõ ràng trên cuống vé giấy:* Trên vé in dòng chữ lớn: `"LOẠI VÉ: TRẺ EM (CHILD) - 50.000Đ"`. Khách hàng là người lớn khi cầm vé sẽ phát hiện ngay sự sai lệch so với số tiền 100.000đ họ vừa đưa cho thu ngân.
    2. *Kiểm soát chéo tại cửa soát vé vào rạp:*
       - Khi nhân viên soát vé quét mã QR tại cửa phòng chiếu, màn hình thiết bị soát vé hiển thị pop-up màu vàng nổi bật: `"VÉ TRẺ EM - YÊU CẦU KIỂM TRA ĐỘ TUỔI"`.
       - Nhân viên soát vé tại cửa là người độc lập hoàn toàn với nhân viên thu ngân quầy. Nếu thấy người bước vào là người lớn đi một mình, nhân viên soát vé sẽ yêu cầu dừng lại và giữ cuống vé để báo cáo quản lý.
    3. *Audit Log truy vết định danh:* Trên hệ thống, mọi chiếc vé bán ra đều lưu vết `staffId` của người bán. Quản lý rạp chỉ cần mở báo cáo kiểm toán là biết chính xác nhân viên nào tại quầy số mấy đã xuất chiếc vé đó.

---

### Câu 66: Trong trường hợp máy in nhiệt tại quầy bị kẹt giấy hoặc hết giấy đúng lúc bấm in vé, nhân viên xử lý in lại vé (Re-print Ticket) như thế nào trên hệ thống phần mềm mà không làm phát sinh thêm doanh thu ảo?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý sự cố phần cứng tại chỗ (Hardware Failure Handling) mà không làm sai lệch số liệu kế toán.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Rủi ro nếu nhân viên thao tác sai:** Nếu nhân viên chọn lại suất chiếu và bấm bán lại lần nữa, hệ thống sẽ tạo ra đơn hàng mới, làm tăng doanh thu ảo và bị trùng ghế.
  - **Quy trình xử lý in lại trên phần mềm Lumi Cinema:**
    1. Nhân viên mở tab **"Tra cứu & Quản lý vé"** (`/staff/lookup`).
    2. Nhập mã ghế (Ví dụ: `C05`) hoặc Số điện thoại của khách hàng vừa giao dịch.
    3. Hệ thống hiển thị chi tiết chiếc vé vừa tạo có trạng thái `Valid`.
    4. Nhân viên bấm nút **"In lại vé (Re-print)"**:
       - Phần mềm chỉ kích hoạt lệnh in lại dữ liệu vé đã có từ trước, **TUYỆT ĐỐI KHÔNG GỌI API TẠO GIAO DỊCH MỚI**.
       - Trên cuống vé in lại tự động chèn thêm dòng chữ nhỏ: `"(Bản in lại lần 2)"` và ghi log vào hệ thống để Ban quản lý kiểm tra, tránh việc nhân viên in trùng vé để tuồn cho người quen vào xem lậu.

---

## PHẦN 6: PHÂN HỆ SOÁT VÉ (QR HMAC-SHA256) & GIAO NHẬN COMBO ĐỘC LẬP (08 CÂU)
*(Tập trung chuyên sâu vào Chống làm giả vé bằng Chữ ký số HMAC-SHA256, Ngăn chặn tái sử dụng vé, Khung giờ Check-in [-30m, kết thúc], Giao nhận combo độc lập & Chặn nhận trùng)*

---

### Câu 67: Trình bày cấu trúc dữ liệu nhúng bên trong mã QR của vé điện tử? Tại sao không mã hóa trực tiếp đường link URL chứa `ticketId` (ví dụ `https://lumi.vn/tickets/105`) mà phải đóng gói chuỗi ký số `HMAC-SHA256`?
- **Trọng tâm kiểm tra của Giảng viên:** Kiến thức về Chữ ký số mật mã học (Cryptographic Signature), tính toàn vẹn thông tin và phòng chống giả mạo vé xem phim (Anti-counterfeiting Mechanism).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cấu trúc JSON nhúng trong QR Code (Theo Mục 5.2 Tech Spec):**
    ```json
    {
      "ticket_id": 105,
      "user_id": 12,
      "user_name": "Nguyen Van A",
      "movie_title": "Dune: Hành Tinh Cát 2",
      "screening_id": 4,
      "room": "Phòng 1",
      "show_time": "2026-10-25T19:30:00.000Z",
      "seat_code": "C05",
      "ticket_type": "Adult",
      "price": 95000,
      "status": "Valid",
      "issued_at": "2026-10-25T10:00:00.000Z",
      "sig": "a4f8b2c1d9e3f7a1"
    }
    ```
  - **Tại sao không dùng URL đơn giản `https://lumi.vn/tickets/105`?**
    1. *Lỗ hổng IDOR (Insecure Direct Object References):* Nếu chỉ nhúng URL có chứa ID, kẻ gian chỉ cần dùng một trang web tạo mã QR bất kỳ để đổi ID từ `105` thành `106`, `107`... để vào xem phim chùa mà không cần trả tiền.
    2. *Vai trò của chữ ký số `sig`:* Chuỗi `sig` được sinh ra bằng cách lấy chuỗi thông tin vé băm với khóa bí mật `NEXTAUTH_SECRET` của server:
       $$	ext{sig} = 	ext{HMAC-SHA256}(	ext{"LMC-TICKET-105-12-C05-Valid"}, 	ext{SECRET})$$
    3. Khi nhân viên quét mã, máy chủ tự băm lại dữ liệu và so sánh với trường `sig`. Nếu kẻ gian chỉnh sửa dù chỉ 1 chữ số ghế từ `C05` thành `C06`, chữ ký tính lại sẽ sai khác hoàn toàn -> Hệ thống phát chuông cảnh báo vé giả mạo ngay lập tức.

---

### Câu 68: Nếu một khách hàng chụp ảnh màn hình mã QR vé gửi qua Zalo cho 3 người bạn cùng vào rạp xem phim, hệ thống soát vé ngăn chặn người thứ hai và người thứ ba vào rạp bằng cơ chế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng phòng chống tấn công phát lại (Replay Attack Prevention) và cơ chế chuyển đổi trạng thái một chiều (One-way State Transition).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cơ chế ngăn chặn:**
    1. Khi người bạn thứ nhất đưa mã QR cho nhân viên quét:
       - Hệ thống kiểm tra trong database: Chiếc vé `#LMC-105` đang có `status = 'Valid'`.
       - Đầu đọc mã vạch gửi request `PATCH /api/tickets/105/mark-used`.
       - Hệ thống lập tức cập nhật trạng thái vé thành `Used`, ghi nhận thời gian `used_at = NOW()` và `staff_id` người quét. Màn hình báo đèn xanh: *"Hợp lệ - Mời quý khách vào phòng chiếu"*.
    2. Khi người bạn thứ hai và thứ ba tiếp tục đưa ảnh chụp chiếc vé đó ra quét:
       - Máy chủ truy vấn database và phát hiện chiếc vé `#LMC-105` đã có `status === 'Used'`.
       - Hệ thống từ chối ngay lập tức, phát âm thanh cảnh báo lỗi (màu đỏ) và hiển thị thông báo chi tiết:
         *"CẢNH BÁO: Vé này đã được sử dụng để vào rạp lúc 19:15:32 bởi nhân viên Nguyễn Văn B! Vui lòng không cho vào!"*
    3. Nhờ cơ chế chuyển trạng thái nguyên tử, một tấm vé chỉ có thể qua cửa duy nhất 1 lần.

---

### Câu 69: Khung thời gian hợp lệ cho phép quét vé vào phòng chiếu được quy định như thế nào trong SRS (FR-CHK-01)? Tại sao lại cho phép quét từ 30 phút trước giờ chiếu đến hết thời lượng suất chiếu?
- **Trọng tâm kiểm tra của Giảng viên:** Quy định khung giờ hợp lệ (Time Window Validation) dựa trên thực tế vận hành rạp chiếu phim.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Khung thời gian hợp lệ (Time Window):**
    $$[	ext{startTime} - 30	ext{ phút}, 	ext{endTime}]$$
    *(Trong đó `endTime = startTime + movie.duration`).*
  - **Lý do thực tiễn:**
    1. *Trước 30 phút:* Rạp bắt đầu mở cửa phòng chiếu cho khán giả ổn định chỗ ngồi, cất đồ đạc và xem các đoạn phim quảng cáo/trailer. Nếu khách đến sớm hơn 1 - 2 tiếng thì phòng chiếu vẫn đang chiếu suất của người khác hoặc nhân viên đang dọn vệ sinh, nên hệ thống sẽ chặn quét để tránh khách vào nhầm suất.
    2. *Đến hết `endTime`:* Nhiều khách hàng do kẹt xe hoặc bận việc đột xuất có thể đến trễ 10 - 20 phút khi phim đã bắt đầu. Họ vẫn có quyền vào rạp xem nốt phần còn lại của bộ phim mà họ đã trả tiền.
    3. *Sau khi `endTime` kết thúc:* Suất chiếu đã xong, vé chính thức hết hiệu lực và không thể quét được nữa.

---

### Câu 70: Sau khi nhân viên quét mã QR hợp lệ, trạng thái của vé chuyển sang `Used`. Liệu nhân viên có thể bấm nhầm hoặc cố tình chuyển ngược vé từ `Used` quay lại `Valid` được không? Tại sao?
- **Trọng tâm kiểm tra của Giảng viên:** Tính bất biến (Immutability) của trạng thái kiểm toán và phòng chống thông đồng gian lận giữa nhân viên và khách hàng.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Câu trả lời:** **TUYỆT ĐỐI KHÔNG THỂ CHUYỂN NGƯỢC LẠI**.
  - **Lý do thiết kế:**
    - Trạng thái `Used` là một trạng thái đích (Terminal State / Sink State) trong Máy trạng thái của vé xem phim.
    - Trong toàn bộ mã nguồn Backend của Lumi Cinema, **không có bất kỳ một API Endpoint nào** cung cấp tính năng chuyển đổi từ `Used` về `Valid`.
    - *Ngăn chặn gian lận nội bộ:* Nếu cho phép nhân viên soát vé đổi ngược lại thành `Valid`, nhân viên có thể thông đồng quét cho bạn bè vào rạp xem phim, sau đó đổi lại thành `Valid` rồi đưa cho một người khác vào xem tiếp, hoặc yêu cầu hủy vé để chiếm đoạt tiền hoàn của rạp.

---

### Câu 71: Tại sao quy trình giao nhận combo bắp nước tại quầy (`/api/staff/combos/deliver`) lại được thiết kế tách rời và độc lập hoàn toàn với quy trình soát vé vào phòng chiếu? Khách hàng có thể lấy bắp nước trước khi vào phòng chiếu được không?
- **Trọng tâm kiểm tra của Giảng viên:** Tính phân tách trách nhiệm (Separation of Concerns) và hiểu rõ thực tế luồng di chuyển vật lý của khách hàng tại rạp phim.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thực tế luồng di chuyển của khách hàng (Physical Customer Flow):**
    - Vị trí quầy Bắp nước (Concession Counter) và Vị trí Cửa soát vé (Ticket Gate) thường nằm ở hai khu vực vật lý tách biệt nhau trong sảnh rạp.
    - Đa số khách hàng khi đến rạp thường ghé quầy bắp nước để lấy bắp rang bơ và nước ngọt trước 15 - 20 phút, sau đó ngồi đợi ở sảnh nói chuyện, rồi mới tiến lại cửa soát vé khi rạp mở cửa phòng chiếu.
    - Một số khách khác lại vào xem phim trước, giữa chừng khát nước mới chạy ra quầy xuất trình mã để lấy combo bắp nước.
  - **Thiết kế phần mềm của Lumi Cinema:**
    - Cho phép hai quy trình này chạy hoàn toàn độc lập với nhau (Quy chế BR-05).
    - Khách hàng có thể nhận bắp nước trước khi soát vé, hoặc soát vé vào phòng chiếu trước rồi mới ra lấy bắp nước mà hệ thống không hề phát sinh lỗi ràng buộc chéo.

---

### Câu 72: Trạng thái của các gói combo trong đơn hàng được quản lý bởi các trường nào (`isDelivered`, `deliveredAt`)? Làm sao hệ thống ngăn chặn việc khách hàng cố tình xuất trình mã đơn hàng để lấy bắp nước 2 lần?
- **Trọng tâm kiểm tra của Giảng viên:** Quản lý vòng đời dịch vụ giao nhận (Fulfillment State Tracking) và phòng chống nhận trùng lặp sản phẩm (Double Fulfillment Prevention).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Các trường quản lý trong bảng `order_combos`:**
    - `isDelivered` (Boolean, mặc định = `false`): Trạng thái đã giao bắp nước hay chưa.
    - `deliveredAt` (DateTime, Nullable): Mốc thời gian chính xác khi nhân viên bấm xác nhận giao hàng.
  - **Cơ chế ngăn chặn nhận trùng 2 lần ([`src/app/api/staff/combos/deliver/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/staff/combos/deliver/route.ts)):**
    1. Khi khách đưa mã đơn hàng, nhân viên nhập tìm kiếm. Hệ thống hiển thị danh sách các món combo kèm trạng thái `isDelivered`.
    2. Khi nhân viên chuẩn bị xong và bấm nút "Xác nhận đã giao":
       - Hệ thống chạy lệnh cập nhật:
         ```typescript
         await prisma.orderCombo.updateMany({
           where: { paymentId: orderId, isDelivered: false },
           data: { isDelivered: true, deliveredAt: new Date() }
         });
         ```
    3. Nếu khách hàng quay lại quầy khác xuất trình lại mã đơn đó:
       - Màn hình nhân viên lập tức hiện cảnh báo màu đỏ: *"ĐƠN HÀNG NÀY ĐÃ ĐƯỢC GIAO HẾT LÚC 19:10! TỪ CHỐI GIAO THÊM!"*.
       - Nút bấm xác nhận giao bị khóa hoàn toàn, ngăn chặn việc lấy bắp nước lần hai.

---

### Câu 73: Nếu khách hàng đến rạp trễ 15 hoặc 20 phút sau khi bộ phim đã bắt đầu chiếu, hệ thống phần mềm có cho phép nhân viên quét vé cho khách vào rạp xem tiếp không?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý tình huống nghiệp vụ thực tế đối với khách hàng đến muộn (Late Arrival Policy).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Câu trả lời:** **HỆ THỐNG VẪN CHO PHÉP QUÉT VÉ VÀO BÌNH THƯỜNG**.
  - **Cơ sở kỹ thuật:**
    - Cửa sổ thời gian soát vé hợp lệ được cấu hình là kéo dài từ 30 phút trước giờ chiếu cho đến tận thời điểm kết thúc suất chiếu (`endTime`).
    - Thời điểm khách đến (trễ 15 - 20 phút) vẫn nằm trong khoảng `[startTime, endTime]`.
    - Vé của khách vẫn ở trạng thái `Valid`. Khi quét, hệ thống chuyển vé sang `Used` và cho phép khách vào phòng chiếu bình thường.
  - **Nghiệp vụ thực tế:** Khách hàng đã bỏ tiền mua toàn bộ suất chiếu, việc họ đến trễ là thiệt thòi của cá nhân họ (bỏ lỡ phần mở đầu phim), rạp không có quyền từ chối chỗ ngồi của khách khi suất chiếu vẫn đang diễn ra.

---

### Câu 74: Trong trường hợp rạp bị sự cố mất kết nối mạng Internet tạm thời tại cửa phòng chiếu, nhân viên soát vé có giải pháp dự phòng (Offline Fallback) nào để kiểm tra tính hợp lệ của chiếc vé không?
- **Trọng tâm kiểm tra của Giảng viên:** Tính sẵn sàng cao (High Availability) và phương án xử lý rủi ro gián đoạn vận hành (Disaster Recovery / Offline Mode).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Giải pháp dự phòng Offline của Lumi Cinema:**
    1. *Xác thực bằng mắt thường (Visual Check):* Nhìn vào thông tin in trên cuống vé giấy hoặc màn hình vé điện tử: Kiểm tra ngày chiếu, giờ chiếu, tên phòng chiếu và vị trí ghế có khớp với suất chiếu chuẩn bị vào hay không.
    2. *Xác thực ngoại tuyến bằng Khóa bí mật (Offline Signature Verification):*
       - Do mã QR của Lumi Cinema chứa toàn bộ thông tin vé ở dạng JSON kèm chữ ký số `sig` HMAC-SHA256.
       - Ứng dụng quét vé cầm tay của nhân viên (nếu được cài đặt ứng dụng chuyên dụng có nạp sẵn Secret Key) có thể tự động băm dữ liệu QR ngoại tuyến (không cần internet) để xác thực chữ ký xem vé có bị làm giả hay không.
    3. *Đồng bộ dữ liệu sau khi có mạng:* Ghi nhận tạm thời mã vé vào bộ nhớ đệm cục bộ của máy quét (Local Storage / IndexedDB). Ngay khi có mạng trở lại, ứng dụng tự động gửi đồng loạt request lên server để cập nhật trạng thái `Used` hàng loạt.

---

## PHẦN 7: PHÂN HỆ HỦY VÉ & ĐỀN BÙ / HOÀN TIỀN MẶT (CANCELLATION & REFUND) (10 CÂU)
*(Tập trung chuyên sâu vào Hai kịch bản Hủy vé, Quy chế 2 tiếng, Voucher bồi hoàn 50%, Hoàn tiền mặt 100% sự cố rạp, Hủy từng vé độc lập & Đối soát công nợ 30 ngày)*

---

### Câu 75: So sánh chi tiết sự khác nhau giữa 2 trường hợp hủy vé: Khách hàng chủ động tự hủy vé vs Rạp hủy vé do sự cố (Điều kiện tiên quyết, thẩm quyền thực hiện, hình thức bồi hoàn, tác động tới ghế ngồi và combo bắp nước)? Đối chiếu với Bảng mục 4.6 SRS.
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng nắm vững ma trận nghiệp vụ hủy vé và đền bù (Business Compensation Matrix) trong tài liệu đặc tả SRS.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Bảng so sánh đối chiếu chuẩn mực:**

| Tiêu chí so sánh | Trường hợp 1: Khách hàng tự hủy vé | Trường hợp 2: Hủy do sự cố rạp (Lỗi máy chiếu/Mất điện) |
| :--- | :--- | :--- |
| **Thẩm quyền thực hiện** | Khách hàng tự thao tác trên Web/Mobile | Chỉ có **STAFF** hoặc **ADMIN** thực hiện |
| **Điều kiện thời gian** | Bắt buộc trước giờ chiếu **$\ge 2$ tiếng** | **Không áp dụng mốc 2 tiếng** (hủy bất kỳ lúc nào) |
| **Điều kiện trạng thái vé** | Vé đang ở trạng thái `Valid` | Vé chưa qua sử dụng (`Valid`) |
| **Hình thức bồi hoàn** | **Cấp Voucher giảm giá 50%** (hạn 30 ngày) | **Hoàn 100% tiền mặt** giá trị thực trả của vé |
| **Hoàn tiền mặt/chuyển khoản?** | **TUYỆT ĐỐI KHÔNG** hoàn tiền | **CÓ**, ghi nhận công nợ `PENDING_CASH_REFUND` |
| **Tác động đến Ghế ngồi** | Ghế chuyển ngay về `EMPTY` để bán lại | Ghế chuyển về `EMPTY` (khóa suất nếu hủy cả suất) |
| **Tác động đến Combo bắp nước**| **Giữ nguyên hiệu lực**, khách vẫn đến nhận | Nếu hủy cả suất: Combo chưa nhận được hoàn tiền 100% |

---

### Câu 76: Tại sao trường hợp khách hàng tự hủy vé lại bắt buộc phải thực hiện trước giờ bắt đầu chiếu ít nhất 2 tiếng (`>= 2h`)? Cơ sở kinh doanh đằng sau mốc thời gian 2 tiếng là gì?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ bản chất kinh doanh ngành dịch vụ giải trí: Chỗ ngồi xem phim là một "Hàng hóa dễ hỏng (Perishable Asset)".
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Bản chất của chỗ ngồi xem phim:** Một ghế xem phim không bán được khi suất chiếu bắt đầu thì giá trị của nó sẽ bằng 0 vĩnh viễn (không thể đem bán lại vào ngày hôm sau như hàng hóa thông thường).
  - **Cơ sở kinh doanh của mốc 2 tiếng:**
    1. *Thời gian cần thiết để hệ thống bán lại chiếc ghế đó cho khán giả khác:* Khi một khách hủy vé trước 2 tiếng, hệ thống mở lại ghế trống (`EMPTY`) trên website. Khoảng thời gian 2 tiếng là đủ để một khán giả khác đang có nhu cầu xem phim mở ứng dụng lên, thấy ghế trống và quyết định đặt vé, sau đó di chuyển từ nhà tới rạp chiếu phim.
    2. *Nếu cho phép hủy sát giờ (ví dụ trước 15 - 30 phút):* Khách hàng thấy trời mưa hoặc bận việc liền bấm hủy vé. Rạp không thể nào tìm được người mua thay thế vị trí đó chỉ trong 15 phút, gây thiệt hại doanh thu trực tiếp cho rạp và các nhà phát hành phim.

---

### Câu 77: Tại sao khi khách chủ động tự hủy vé, hệ thống chỉ cấp phát Voucher giảm giá 50% cho lần mua vé sau mà tuyệt đối không hoàn tiền mặt hoặc chuyển khoản lại cho khách?
- **Trọng tâm kiểm tra của Giảng viên:** Chính sách giữ chân khách hàng (Customer Retention) và phòng ngừa hành vi đầu cơ vé (Scalping Mitigation).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do kinh tế và vận hành:**
    1. *Khách hàng là bên đơn phương thay đổi kế hoạch:* Rạp đã chuẩn bị sẵn cơ sở vật chất, suất chiếu và khóa chỗ ngồi cho khách. Việc hủy vé là do nhu cầu chủ quan của khách, do đó khách phải chia sẻ rủi ro chi phí cơ hội với rạp (mất 50% giá trị vé).
    2. *Chính sách giữ chân dòng tiền và khách hàng (Customer Retention):* Cấp Voucher giảm giá 50% có hạn 30 ngày vừa thể hiện sự thấu hiểu, hỗ trợ khách hàng, vừa kích thích khách hàng bắt buộc phải quay lại rạp xem một bộ phim khác trong vòng một tháng tới để không bị lãng phí voucher.
    3. *Chống đầu cơ vé:* Nếu cho phép hoàn 100% tiền mặt hoặc chuyển khoản, kẻ đầu cơ có thể ôm 8 vé ghế VIP đẹp nhất vào giờ vàng, nếu không bán lại được cho ai thì sát giờ bấm hủy để lấy lại toàn bộ tiền mà không chịu bất kỳ rủi ro nào.

---

### Câu 78: Khi khách hàng tự hủy vé xem phim, các gói combo bắp nước đã đặt trong cùng đơn hàng có bị hủy theo không? Tại sao quy chế lại giữ nguyên hiệu lực của combo?
- **Trọng tâm kiểm tra của Giảng viên:** Tính phân tách độc lập giữa Hàng hóa dịch vụ (Vé xem phim) và Hàng hóa vật lý tiêu dùng (Bắp nước).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy chế xử lý của Lumi Cinema:** Combo bắp nước **VẪN GIỮ NGUYÊN HIỆU LỰC**, không bị hủy theo vé.
  - **Lý do nghiệp vụ:**
    - Khách hàng có thể hủy lịch xem phim do không muốn xem bộ phim đó nữa hoặc bận việc cá nhân, nhưng bắp nước là sản phẩm đóng gói độc lập.
    - Khách hàng (hoặc người thân của khách) vẫn có thể cầm mã đơn hàng ghé rạp để nhận phần bắp nước mang về nhà thưởng thức trong ngày hôm đó.
    - Về mặt kế toán, rạp không phải xử lý bài toán hoàn hủy phức tạp cho hàng hóa ẩm thực đã được dự trữ sẵn theo đơn.

---

### Câu 79: Khi rạp chiếu phim gặp sự cố bất khả kháng (chập điện, hỏng máy chiếu, sự cố phòng cháy), tại sao trong Phase 1 nhóm phát triển không gọi API hoàn tiền tự động của VNPay mà lại chọn quy trình đối soát hoàn 100% tiền mặt thủ công tại quầy?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ các ràng buộc kỹ thuật của Cổng thanh toán (Payment Gateway Refund API Limitations) và lộ trình phát triển phần mềm theo từng giai đoạn (Phased Rollout Strategy).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Ràng buộc kỹ thuật của API Cổng thanh toán:**
    1. *Thủ tục đối soát ngân hàng phức tạp:* API Refund tự động của VNPay yêu cầu doanh nghiệp phải ký quỹ một khoản tiền lớn trong tài khoản thanh toán và quy trình duyệt hoàn qua ngân hàng thường mất từ **3 đến 7 ngày làm việc** tiền mới về tài khoản thẻ của khách.
    2. *Trải nghiệm khách hàng tại rạp khi xảy ra sự cố:* Khách hàng đang ngồi trong phòng chiếu mà bị tắt điện hỏng máy chiếu sẽ rất bức xúc. Nếu bảo khách "về nhà đợi 7 ngày nữa ngân hàng trả tiền" thì khách sẽ phản ứng tiêu cực. Việc nhân viên xin lỗi và hoàn ngay 100% tiền mặt tại quầy giải quyết ngay lập tức sự bức xúc của khách hàng.
  - **Lộ trình Phase 1:** Triển khai quy trình ghi nhận công nợ `PENDING_CASH_REFUND` và xuất quỹ tiền mặt đối soát tại quầy; Phase 2 khi hoàn tất thủ tục pháp lý doanh nghiệp sẽ tích hợp API Refund tự động.

---

### Câu 80: Nếu một vé xem phim đã có trạng thái `Used` (khách đã vào phòng chiếu xem phim được 30 phút) thì khi phòng chiếu bị sự cố mất điện giữa chừng, hệ thống phần mềm có cho phép nhân viên bấm "Hủy vé" trên màn hình không? Quy trình xử lý thực tế tại rạp trong tình huống này là gì?
- **Trọng tâm kiểm tra của Giảng viên:** Xử lý tình huống đặc biệt ngoài phạm vi kiểm soát của phần mềm (Edge Case & Physical Discretionary Workflow).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Trên phần mềm:**
    - Hệ thống **CHẶN TUYỆT ĐỐI** việc bấm nút hủy đối với vé đã có trạng thái `Used` (Quy tắc an toàn FR-CAN-03: Vé đã check-in không bao giờ được hủy trên API để bảo vệ tính toàn vẹn kiểm toán).
  - **Quy trình xử lý thực tế tại rạp (Operational Procedure):**
    - Ban quản lý rạp (Admin) sẽ vào chức năng **"Hủy suất chiếu khẩn cấp do sự cố"** (`UC-15 / UC-23`). Khi suất chiếu bị hủy ở cấp độ toàn phòng, hệ thống tự động sinh ra một biên bản sự cố nội bộ.
    - Đối với khách hàng đã soát vé vào trong: Nhân viên quầy sẽ phát trực tiếp **Vé mời xem phim bù (Voucher đền bù giấy / Thẻ quà tặng)** hoặc xuất quỹ tiền mặt theo danh sách ký nhận bằng tay tại quầy kèm biên bản sự cố có chữ ký của Quản lý ca trực.

---

### Câu 81: Trong một đơn hàng khách đặt mua 4 vé xem phim cho cả gia đình, nếu 1 người bận việc đột xuất thì khách có thể hủy riêng 1 chiếc vé đó mà giữ lại 3 chiếc vé còn lại không? Logic mã nguồn xử lý tính độc lập này như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Thiết kế cơ sở dữ liệu và thuật toán xử lý hủy vé đơn lẻ (Granular Item-level Cancellation).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Khả năng đáp ứng:** **HOÀN TOÀN CÓ THỂ**. Lumi Cinema hỗ trợ hủy từng vé lẻ độc lập trong đơn hàng (Yêu cầu FR-CAN-01).
  - **Logic mã nguồn xử lý ([`src/app/api/tickets/[id]/cancel/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/tickets/[id]/cancel/route.ts)):**
    1. Endpoint nhận tham số `ticket_id` cụ thể của chiếc vé cần hủy (chứ không nhận mã đơn hàng `payment_id`).
    2. Kiểm tra chiếc vé đó có `status === 'Valid'` và thời gian chiếu $\ge 2$ tiếng hay không.
    3. Cập nhật duy nhất bản ghi vé đó sang `status = 'Cancelled'`. Ba bản ghi vé còn lại trong bảng `tickets` hoàn toàn không bị ảnh hưởng, vẫn giữ nguyên mã QR và trạng thái `Valid`.
    4. Chỉ duy nhất chiếc ghế ứng với chiếc vé đó được chuyển về `EMPTY`.
    5. Cấp mã voucher bồi hoàn 50% tính trên đúng đơn giá thực tế của chiếc vé vừa hủy.

---

### Câu 82: Mã Voucher bồi hoàn 50% tự sinh có cấu trúc định dạng như thế nào (`COMP50_[ticketId]_[random]`)? Hệ thống làm cách nào để đảm bảo chiếc voucher này chỉ thuộc quyền sở hữu của chính khách hàng đó và người khác không thể dùng trộm?
- **Trọng tâm kiểm tra của Giảng viên:** Thiết kế khóa ngoại ràng buộc dữ liệu (Scoped Authorization Voucher) và cơ chế phòng chống lộ mã voucher.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cấu trúc định dạng mã:**
    `COMP50_[TicketID]_[RandomString]` (Ví dụ: `COMP50_105_7X9A2B`).
    - `COMP50`: Tiền tố nhận diện đây là Voucher bồi hoàn 50% (Compensation).
    - `[TicketID]`: Gắn với mã vé bị hủy để kế toán truy xuất nguồn gốc.
    - `[RandomString]`: Chuỗi ký tự ngẫu nhiên tạo độ entropy cao chống dò đoán mã.
  - **Cơ chế khóa quyền sở hữu chính chủ:**
    - Trong bảng `coupons`, cột `user_id` được gán chính xác bằng `userId` của chủ sở hữu vé bị hủy (Xem [`prisma/schema.prisma#L199`](file:///d:/cinema_project/cinema-app/prisma/schema.prisma#L199)).
    - Khi một khách hàng khác nhập mã này vào trang thanh toán, API xác thực voucher (`/api/coupons/validate`) kiểm tra:
      ```typescript
      if (coupon.userId && coupon.userId !== session.user.id) {
        throw new AppError(403, 'Mã voucher này không thuộc quyền sở hữu của bạn!');
      }
      ```
    - Dù kẻ xấu có biết được chuỗi mã voucher này cũng không thể áp dụng cho tài khoản khác được.

---

### Câu 83: Khi khách hàng đến quầy xuất trình mã vé để nhận lại tiền mặt do sự cố rạp, nhân viên bấm nút "Xác nhận đã hoàn tiền mặt". Hệ thống lưu vết những thông tin gì vào bảng Audit Log để phục vụ đối soát kế toán?
- **Trọng tâm kiểm tra của Giảng viên:** Tính kiểm toán hệ thống (Audit Trail) và trách nhiệm giải trình tài chính (Financial Accountability).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thông tin được ghi nhận vào hệ thống ([`src/app/api/staff/tickets/[id]/cancel-with-voucher/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/staff/tickets/[id]/cancel-with-voucher/route.ts)):**
    1. `ticket_id`: Mã vé được chi tiền hoàn.
    2. `staff_id` & `staff_name`: Nhân viên quầy trực tiếp xuất quỹ tiền mặt trao cho khách.
    3. `refunded_at`: Mốc thời gian chính xác từng giây thực hiện chi tiền mặt.
    4. `refund_amount`: Số tiền mặt chính xác đã xuất quỹ.
    5. `cancellation_reason`: Lý do rạp gặp sự cố (Ví dụ: "Hỏng bóng đèn máy chiếu phòng 2").
    6. `refund_status`: Chuyển từ `PENDING_CASH_REFUND` sang `REFUNDED_CASH`.
  - Dữ liệu này là bằng chứng pháp lý bảo vệ nhân viên khi chốt sổ két tiền mặt với kế toán trưởng vào cuối ngày.

---

### Câu 84: Khách hàng có thời hạn bao lâu để đến rạp nhận tiền hoàn mặt sau khi nhận thông báo hủy suất chiếu do sự cố? Sau thời hạn đó, trạng thái của vé và khoản tiền chờ hoàn này được xử lý ra sao?
- **Trọng tâm kiểm tra của Giảng viên:** Giới hạn thời hiệu khiếu nại (Statute of Limitations) và xử lý tài chính quá hạn.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thời hạn nhận tiền hoàn:** **30 ngày** kể từ ngày suất chiếu bị hủy theo thông báo chính thức của rạp (Quy chế BR-04).
  - **Lý do đưa ra mốc 30 ngày:** Rạp không thể duy trì một khoản công nợ treo vô thời hạn trên sổ sách kế toán qua các kỳ báo cáo tài chính tháng/quý.
  - **Xử lý sau 30 ngày:**
    - Vé vẫn giữ trạng thái `Cancelled` để lưu vết lịch sử.
    - Cột `refund_status` được hệ thống chuyển từ `PENDING_CASH_REFUND` sang `EXPIRED_REFUND` (Quá hạn nhận hoàn tiền).
    - Khoản tiền này được kế toán rạp kết chuyển vào tài khoản "Thu nhập bất thường / Thu nhập khác" của doanh nghiệp.

---

## PHẦN 8: PHÂN HỆ QUẢN LÝ VOUCHER & CÔNG CỤ KHUYẾN MÃI (VOUCHER ENGINE) (06 CÂU)
*(Tập trung vào Phân loại Voucher, Quy tắc áp dụng, Công thức chiết khấu, Trừ tiền vé không trừ combo & Hoàn lượt dùng khi lỗi)*

---

### Câu 85: Hệ thống Lumi Cinema hỗ trợ những loại voucher nào trong bảng `coupons`? Phân biệt giữa Voucher chiến dịch của Admin (`applicableMovieId`, `maxUsage`) và Voucher bồi hoàn (`userId`)?
- **Trọng tâm kiểm tra của Giảng viên:** Thiết kế mô hình dữ liệu linh hoạt (Flexible Discount Model) phục vụ cả mục đích Marketing và mục đích Chăm sóc khách hàng / Đền bù.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Hệ thống hỗ trợ 2 nhóm Voucher chính:**
    1. **Voucher Chiến dịch Marketing (Admin Campaign Voucher):**
       - Được tạo thủ công bởi Quản trị viên trong trang Admin (`/admin/vouchers`).
       - *Đặc điểm:* Có thể áp dụng chung cho mọi khách hàng (`userId = NULL`), giới hạn số lượt dùng tối đa toàn hệ thống (`maxUsage`, ví dụ: 500 lượt), có thể giới hạn riêng cho một bộ phim nhất định (`applicableMovieId`) hoặc áp dụng cho mọi phim (`applicableMovieId = NULL`).
       - *Ví dụ:* Mã `LUMI2026` giảm 20.000đ cho đơn hàng từ 100.000đ.
    2. **Voucher Bồi hoàn Sự cố / Hủy vé (System Compensation Voucher):**
       - Do hệ thống tự động sinh ra khi khách hàng chủ động hủy vé hợp lệ trước 2 tiếng theo quy chế BR-03.
       - *Đặc điểm:* Khóa cứng quyền sở hữu cho riêng tài khoản khách hàng đó (`userId = customerId`), số lượt dùng duy nhất 1 lần (`maxUsage = 1`), thời hạn dùng 30 ngày kể từ ngày hủy vé.
       - *Ví dụ:* Mã `COMP50_105_9F2B1A` giảm 50% giá trị cho 1 vé xem phim lần sau.

---

### Câu 86: Nêu chi tiết các quy tắc áp dụng Voucher (Voucher Rules) trong quá trình thanh toán: Một đơn hàng được dùng tối đa bao nhiêu voucher? Voucher có được áp dụng giảm giá trên tiền bắp nước combo không?
- **Trọng tâm kiểm tra của Giảng viên:** Khả năng kiểm soát điều kiện ràng buộc kinh doanh (Business Rules Enforcement) trong công cụ tính giá.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy tắc 1 (Số lượng mã tối đa):** Mỗi đơn hàng chỉ được phép sử dụng **tối đa duy nhất 1 mã Voucher** (Không hỗ trợ cộng dồn nhiều mã giảm giá cùng lúc để tránh lạm dụng khuyến mãi).
  - **Quy tắc 2 (Phạm vi giảm giá):** Giảm giá của Voucher **CHỈ ÁP DỤNG TRÊN TỔNG TIỀN VÉ XEM PHIM, TUYỆT ĐỐI KHÔNG ÁP DỤNG TRÊN TIỀN BẮP NƯỚC COMBO** (Quy chế BR-07).
  - **Lý do kinh tế:** Tỷ suất lợi nhuận và giá vốn của dịch vụ chiếu phim và đồ ăn uống (F&B) được quản lý ở 2 tài khoản chi phí khác nhau. Giá combo bắp nước đã được định giá sát với chi phí vận hành quầy bar, việc cho giảm giá voucher trên combo sẽ gây lỗ vốn chi phí nguyên vật liệu của rạp.

---

### Câu 87: Trình bày công thức tính tổng tiền đơn hàng khi có voucher giảm giá, phụ thu suất chiếu cuối tuần và các loại vé khác nhau?
- **Trọng tâm kiểm tra của Giảng viên:** Tư duy toán học và tính nhất quán trong thuật toán tính tiền (`pricing.ts`).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Công thức tính toán tổng thể:**
    $$	ext{Tổng thanh toán} = \max\left(0, \sum 	ext{Tiền vé từng ghế} - 	ext{Tiền giảm Voucher}ight) + \sum 	ext{Tiền Combo}$$
  - **Trong đó, tiền của từng chiếc vé được tính:**
    $$	ext{Tiền vé} = (	ext{basePrice} + 	ext{Phụ thu cuối tuần/Lễ}) 	imes 	ext{Hệ số loại vé}$$
    - Vé Thường (`Adult`): Hệ số = $1.0$ (100%).
    - Vé Trẻ em (`Child`): Hệ số = $0.5$ (50%).
  - **Tiền giảm Voucher:**
    - Nếu là Voucher phần trăm (%): $	ext{Tiền vé} 	imes 	ext{discountValue}\%$.
    - Nếu là Voucher tiền cố định: Trừ thẳng số tiền, nhưng tối đa không vượt quá tổng tiền vé (không bao giờ để tiền vé bị âm).

---

### Câu 88: Nếu khách hàng nhập mã voucher nhưng thanh toán thất bại trên cổng VNPay hoặc hết hạn 10 phút giữ ghế, lượt dùng của voucher đó có bị mất không? Hệ thống hoàn lại lượt dùng như thế nào?
- **Trọng tâm kiểm tra của Giảng viên:** Tính công bằng với khách hàng và xử lý khôi phục trạng thái (State Rollback) khi giao dịch bị hủy giữa chừng.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Chính sách:** Khách hàng **HOÀN TOÀN KHÔNG BỊ MẤT VOUCHER**.
  - **Cơ chế hoàn lại lượt dùng:**
    1. Khi khách hàng bấm áp dụng voucher và chuyển sang cổng VNPay, hệ thống tăng tạm thời biến đếm `usedCount` lên 1 để ngăn chặn việc người đó mở tab khác dùng chung mã đó song song.
    2. Nếu cổng VNPay trả về thất bại hoặc tác vụ Cron quét thấy phiên giữ ghế quá 10 phút chưa thanh toán:
       - Hệ thống chạy câu lệnh cập nhật hoàn trả:
         ```typescript
         await prisma.coupon.update({
           where: { code: couponCode },
           data: { usedCount: { decrement: 1 } },
         });
         ```
    3. Mã voucher quay trở lại trạng thái khả dụng để khách hàng tiếp tục sử dụng cho lần mua tiếp theo.

---

### Câu 89: Đối với Voucher bồi hoàn giảm giá 50% (`COMP50`), nó được áp dụng giảm 50% trên tổng giá trị toàn bộ đơn hàng mới hay chỉ giảm 50% trên giá trị của duy nhất 1 chiếc vé trong đơn mới? Tại sao?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ cơ chế bồi hoàn công bằng (Fair Compensation Logic) trong giải quyết khiếu nại khách hàng.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy tắc áp dụng:** Voucher bồi hoàn 50% **chỉ giảm tối đa 50% trên giá trị của DUY NHẤT 1 CHIẾC VÉ** trong đơn hàng mới (Quy chế FR-VOU-02).
  - **Lý do kinh tế:**
    - Khách hàng trước đó chỉ tự hủy **1 chiếc vé** (trị giá ví dụ 100.000đ).
    - Nếu cho phép voucher 50% này áp dụng trên toàn bộ đơn hàng mới (ví dụ đơn mới khách mua 8 vé trị giá 800.000đ và được giảm tới 400.000đ), rạp sẽ bị thất thoát tài chính nghiêm trọng và khách hàng sẽ lợi dụng kịch bản này để trục lợi.
    - Việc chỉ giảm 50% trên đúng 1 chiếc vé tương đương với việc bù đắp lại đúng giá trị thiệt hại của 1 chiếc vé bị hủy trước đó.

---

### Câu 90: Làm thế nào để ngăn chặn một khách hàng tạo nhiều tài khoản ảo để trục lợi các mã voucher khuyến mãi của rạp?
- **Trọng tâm kiểm tra của Giảng viên:** Kỹ thuật phòng chống gian lận khuyến mãi (Anti-abuse / Promotion Fraud Detection).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Các biện pháp Lumi Cinema triển khai:**
    1. *Ràng buộc duy nhất trên CSDL:* Trường `email` là duy nhất (`UNIQUE`).
    2. *Ràng buộc Số điện thoại:* Mỗi số điện thoại chỉ được liên kết với một tài khoản duy nhất. Khi áp dụng voucher tân thủ, hệ thống kiểm tra số điện thoại đó đã từng có lịch sử đơn hàng thành công nào trong quá khứ chưa.
    3. *Ràng buộc thiết bị & Địa chỉ IP (Device Fingerprinting):* Ghi nhận mã vân tay trình duyệt (Canvas Fingerprint / IP Address). Nếu một thiết bị tạo quá 3 tài khoản trong cùng 1 ngày, hệ thống tự động khóa quyền áp dụng voucher tân thủ cho các tài khoản đó.

---

## PHẦN 9: PHÂN HỆ QUẢN TRỊ PHIM & ĐIỀU PHỐI SUẤT CHIẾU (MOVIE & SCREENING) (06 CÂU)
*(Tập trung vào Vòng đời phim, Soft Delete, Thuật toán chống trùng phòng chiếu, Buffer dọn dẹp phòng & Hủy suất khẩn cấp)*

---

### Câu 91: Tại sao một bộ phim đã từng phát sinh suất chiếu hoặc đã bán vé tuyệt đối không được dùng lệnh `DELETE` xóa khỏi cơ sở dữ liệu? Cơ chế Soft Delete (`status = ENDED`) hoạt động ra sao?
- **Trọng tâm kiểm tra của Giảng viên:** Tính toàn vẹn dữ liệu quan hệ (Referential Integrity) và bảo tồn dữ liệu lịch sử kế toán.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Hậu quả nếu xóa cứng (Hard Delete):**
    - Nếu xóa dòng phim khỏi bảng `movies`, toàn bộ các suất chiếu trong quá khứ, các tấm vé khách hàng đã mua và các khoản thanh toán liên quan sẽ bị mồ côi (Orphan Records) hoặc kích hoạt xóa dây chuyền (`ON DELETE CASCADE`), làm biến mất toàn bộ lịch sử doanh thu của bộ phim đó trong các báo cáo tài chính năm cũ.
  - **Cơ chế Soft Delete của Lumi Cinema ([`src/app/api/movies/[id]/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/movies/[id]/route.ts)):**
    - Khi Admin bấm "Xóa phim": Backend kiểm tra xem phim đã có suất chiếu hoặc vé chưa:
      ```typescript
      const hasScreenings = await prisma.screening.count({ where: { movieId: id } });
      if (hasScreenings > 0) {
        // Chuyển sang Soft Delete
        await prisma.movie.update({ where: { id }, data: { status: 'ENDED', isDeleted: true } });
        return apiResponse(true, null, 'Phim đã phát sinh dữ liệu nên được chuyển sang trạng thái Ngừng chiếu');
      }
      // Chưa từng có dữ liệu mới cho phép xóa cứng
      await prisma.movie.delete({ where: { id } });
      ```
    - Phim `ENDED` sẽ bị ẩn khỏi trang chủ đặt vé của khách hàng nhưng vẫn tồn tại nguyên vẹn trong CSDL để phục vụ việc xem báo cáo lịch sử của Admin.

---

### Câu 92: Khi Quản trị viên lên lịch tạo suất chiếu mới (`POST /api/screenings`), hệ thống tự động kiểm tra chống trùng phòng chiếu như thế nào? Thuật toán so sánh khoảng thời gian `[startTime, endTime]`?
- **Trọng tâm kiểm tra của Giảng viên:** Thuật toán phát hiện xung đột lịch trình (Interval Scheduling Conflict Detection Algorithm) trong cùng một tài nguyên phòng chiếu.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thuật toán kiểm tra xung đột:**
    - Giả sử suất chiếu mới có khoảng thời gian $[S_{	ext{new}}, E_{	ext{new}}]$ với $E_{	ext{new}} = S_{	ext{new}} + 	ext{Thời lượng phim}$.
    - Suất chiếu mới bị xem là **xung đột** với một suất chiếu đã có $[S_{	ext{old}}, E_{	ext{old}}]$ trong cùng một phòng chiếu khi và chỉ khi hai khoảng thời gian này giao nhau:
      $$S_{	ext{new}} < E_{	ext{old}} \quad 	ext{VÀ} \quad E_{	ext{new}} > S_{	ext{old}}$$
  - **Câu lệnh truy vấn Prisma kiểm tra ([`src/app/api/screenings/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/screenings/route.ts)):**
    ```typescript
    const overlapping = await prisma.screening.findFirst({
      where: {
        roomNumber: newRoomNumber,
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: newEndTime } },
          { endTime: { gt: newStartTime } },
        ],
      },
    });
    if (overlapping) {
      throw new AppError(409, 'Phòng chiếu này đã có suất chiếu khác trong khung giờ trên!');
    }
    ```
    - Nếu phát hiện trùng, hệ thống lập tức từ chối và cảnh báo Admin chọn phòng khác hoặc giờ khác.

---

### Câu 93: Thời gian dọn dẹp vệ sinh phòng chiếu (Cleaning Buffer Time) giữa hai suất chiếu liên tiếp được quy định ra sao trong nghiệp vụ rạp phim?
- **Trọng tâm kiểm tra của Giảng viên:** Sự am hiểu về quy trình vận hành rạp chiếu phim trong thế giới thực (Real-world Operations).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thực tế vận hành:** Sau khi một bộ phim kết thúc, khán giả mất khoảng 5 - 10 phút để rời khỏi phòng chiếu, và nhân viên tạp vụ cần từ 10 - 15 phút để dọn dẹp bỏng ngô rơi vãi, lau dọn đồ uống đổ và kiểm tra an ninh trong phòng.
  - **Quy định trong Lumi Cinema:**
    - Hệ thống khuyến nghị một khoảng đệm an toàn **Cleaning Buffer Time là 15 đến 20 phút** giữa giờ kết thúc của suất chiếu trước và giờ bắt đầu của suất chiếu sau trong cùng một phòng.
    - Thuật toán kiểm tra lịch chiếu sẽ cộng thêm 15 phút đệm này vào `endTime` khi so sánh xung đột:
      $$E_{	ext{effective}} = S_{	ext{new}} + 	ext{movie.duration} + 15	ext{ phút dọn dẹp}$$

---

### Câu 94: Khi Admin kích hoạt tính năng "Hủy suất chiếu khẩn cấp do sự cố", hệ thống tự động thực hiện chuỗi hành động nguyên tử nào trên cơ sở dữ liệu?
- **Trọng tâm kiểm tra của Giảng viên:** Thiết kế kịch bản xử lý sự cố thảm họa (Disaster Incident Workflow) với toàn vẹn dữ liệu đa bảng.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Chuỗi thao tác nguyên tử bọc trong `prisma.$transaction`:**
    1. Cập nhật `Screening.status = 'CANCELLED'`: Lập tức đóng cổng bán vé trên web và tại quầy POS cho suất chiếu này.
    2. Cập nhật toàn bộ các vé của suất chiếu đó có `status = 'Valid'` chuyển sang `status = 'Cancelled'`.
    3. Ghi nhận công nợ bồi hoàn cho từng chiếc vé: `refundStatus = 'PENDING_CASH_REFUND'`, lưu lý do vào `cancellationReason`.
    4. Cập nhật các gói combo đi kèm chưa nhận thành `Đã hủy` để hoàn tiền mặt lại cho khách.
    5. Ghi nhật ký kiểm toán hệ thống (Audit Trail) lưu danh tính Admin thực hiện, thời gian và lý do hủy suất chiếu.
    6. Kích hoạt dịch vụ Nodemailer gửi email xin lỗi hàng loạt tới tất cả khách hàng đã mua vé kèm hướng dẫn đến rạp nhận tiền mặt trong vòng 30 ngày.

---

### Câu 95: Phân loại nhãn độ tuổi của phim (`P`, `C13`, `T18`) ảnh hưởng như thế nào đến việc hiển thị giao diện và logic thanh toán vé Trẻ em?
- **Trọng tâm kiểm tra của Giảng viên:** Tính nhất quán giữa Giao diện người dùng và Ràng buộc logic nghiệp vụ Backend.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Ảnh hưởng trên Giao diện:**
    - Trên danh sách phim và chi tiết phim: Hiển thị huy hiệu nhãn tuổi với màu sắc nhận diện chuẩn của Cục Điện ảnh:
      - `P`: Huy hiệu màu xanh lá cây (Phù hợp mọi lứa tuổi).
      - `C13`: Huy hiệu màu vàng cam (Cấm dưới 13 tuổi).
      - `T18`: Huy hiệu màu đỏ cảnh báo (Cấm dưới 18 tuổi).
    - Tại bước chọn loại vé: Nếu phim là `C13` hoặc `T18`, lựa chọn "Vé Trẻ Em (Child)" bị khóa chọn kèm tooltip giải thích lý do pháp lý.
  - **Ảnh hưởng ở Backend:**
    - API thanh toán `/api/payments/initiate` tự động từ chối đơn hàng nếu phát hiện có item vé `Child` đi kèm với phim nhãn `T18`, ngăn chặn gian lận lách luật từ phía client.

---

### Câu 96: Hình ảnh poster và banner phim được tải lên và lưu trữ ở đâu (Cloudinary CDN)? Kích thước, định dạng và dung lượng file ảnh được kiểm soát ra sao?
- **Trọng tâm kiểm tra của Giảng viên:** Tối ưu hóa lưu trữ tài nguyên đa phương tiện (Media Asset Management & CDN Optimization).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Nơi lưu trữ:** Sử dụng dịch vụ đám mây chuyên dụng **Cloudinary CDN** thông qua API server [`src/app/api/movies/upload/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/movies/upload/route.ts).
  - **Lý do không lưu ảnh trực tiếp trên máy chủ web:**
    - Tránh làm phình to dung lượng ổ cứng của server Next.js.
    - Cloudinary tự động nén ảnh sang định dạng WebP hiện đại và phân phối qua mạng lưới CDN toàn cầu, giúp ảnh tải nhanh gấp 3 lần và tiết kiệm 60% băng thông mạng.
  - **Các ràng buộc kiểm soát:**
    - Dung lượng tối đa: Giới hạn $\le 5	ext{MB}$ cho mỗi file upload.
    - Định dạng MIME type cho phép: Chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp`.
    - Server tự động resize và tối ưu tỷ lệ chuẩn poster rạp chiếu phim (tỷ lệ 2:3) trước khi lưu đường dẫn URL vào bảng `movies.poster`.

---

## PHẦN 10: PHÂN HỆ ĐÁNH GIÁ PHIM & QUẢN LÝ KHO COMBO (REVIEWS & STOCK CONTROL) (04 CÂU)
*(Tập trung vào Đánh giá không cần vé, Cơ chế Upsert Review, Tính điểm Rating TB & Khóa giữ kho bắp nước tạm thời)*

---

### Câu 97: Tại sao hệ thống lại cho phép bất kỳ khách hàng nào đăng nhập là có thể đánh giá và bình luận phim mà không bắt buộc họ phải mua vé xem phim đó trước (Quy chế BR-06)? Rủi ro đánh giá ảo (Review Bombing) được xử lý ra sao?
- **Trọng tâm kiểm tra của Giảng viên:** Hiểu rõ mục tiêu xây dựng cộng đồng người yêu phim (Community Engagement) và các giải pháp chống spam bình luận.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Lý do thiết kế theo quy chế BR-06:**
    - Lumi Cinema muốn phát triển cổng thông tin điện ảnh mở tương tự như các nền tảng IMDb, Rotten Tomatoes hay Letterboxd. Nhiều khán giả đã xem phim tại các liên hoan phim, xem ở nước ngoài hoặc xem qua các nền tảng khác vẫn có mong muốn được chia sẻ cảm nhận và thảo luận trên cộng đồng của rạp.
    - Việc nới lỏng điều kiện (chỉ cần có tài khoản định danh) giúp tăng tính tương tác, giữ chân người dùng truy cập website hàng ngày ngay cả khi họ chưa có nhu cầu mua vé.
  - **Kiểm soát rủi ro đánh giá ảo (Review Bombing):**
    1. Bắt buộc phải đăng ký và xác thực tài khoản (ngăn chặn bot spam vô danh).
    2. Mỗi tài khoản chỉ có duy nhất 1 bản ghi review cho 1 bộ phim (chống spam nhiều bình luận tiêu cực liên tiếp).
    3. Admin có công cụ kiểm duyệt và ẩn/xóa các bài đánh giá có ngôn từ độc hại hoặc vi phạm tiêu chuẩn cộng đồng (`/admin/reviews`).

---

### Câu 98: Mỗi khách hàng được gửi tối đa bao nhiêu bài đánh giá cho cùng một bộ phim? Cơ chế `Upsert` (Tạo mới hoặc Cập nhật) hoạt động như thế nào trong Prisma ORM?
- **Trọng tâm kiểm tra của Giảng viên:** Kỹ thuật thao tác dữ liệu Idempotent với phương thức `Upsert` trong Database ORM.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Quy định:** Mỗi khách hàng chỉ có **DUY NHẤT 1 BÀI ĐÁNH GIÁ** cho một bộ phim.
  - **Cơ chế Upsert trong code ([`src/app/api/reviews/route.ts`](file:///d:/cinema_project/cinema-app/src/app/api/reviews/route.ts)):**
    - Khi khách gửi đánh giá, hệ thống kiểm tra sự tồn tại của cặp `(userId, movieId)`:
      - Nếu người dùng này **chưa từng đánh giá** phim này: Prisma thực hiện lệnh `INSERT` tạo bản ghi mới trong bảng `reviews`.
      - Nếu người dùng này **đã từng đánh giá** trước đó: Prisma thực hiện lệnh `UPDATE` cập nhật lại số sao `rating` mới và nội dung `comment` mới, đồng thời cập nhật timestamp `updatedAt = NOW()`.
    - Cơ chế này giúp khách hàng có thể dễ dàng thay đổi suy nghĩ hoặc chấm lại điểm số sau khi xem lại phim mà không làm rác database.

---

### Câu 99: Điểm đánh giá trung bình của bộ phim (`movie.rating`) được tính toán và làm tròn như thế nào mỗi khi có lượt đánh giá mới hoặc chỉnh sửa?
- **Trọng tâm kiểm tra của Giảng viên:** Tính nhất quán dữ liệu (Denormalized Field Synchronization) và thuật toán làm tròn số học.
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Thời điểm tính toán:** Ngay lập tức (Real-time) sau khi lệnh `Upsert` hoặc `Delete` bài đánh giá hoàn tất thành công.
  - **Thuật toán tính toán:**
    1. Lấy danh sách toàn bộ các đánh giá của bộ phim đó:
       $$	ext{Điểm TB} = rac{\sum_{i=1}^{N} 	ext{rating}_i}{N}$$
    2. Làm tròn đến **1 chữ số thập phân** bằng công thức toán học:
       ```typescript
       const avgRating = Number((sum / reviews.length).toFixed(1));
       ```
    3. Cập nhật kết quả vào cột `rating` của bảng `movies` (kiểu dữ liệu `Decimal(3, 1)`).
    4. Điểm số này được hiển thị ngay lập tức lên thẻ phim ngoài trang chủ để tất cả khán giả cùng tham khảo.

---

### Câu 100: Khi khách hàng đặt combo bắp nước online, số lượng tồn kho khả dụng (`combos.stock`) bị khóa tạm thời 10 phút như thế nào để tránh tình trạng "cháy hàng ảo" hoặc bán vượt quá số lượng thực tế trong kho?
- **Trọng tâm kiểm tra của Giảng viên:** Quản lý hàng tồn kho trong thương mại điện tử (Inventory Reservation Pattern).
- **Câu trả lời chuẩn nghiệp vụ & kỹ thuật:**
  - **Cơ chế Khóa giữ kho tạm thời (Temporary Inventory Lock):**
    1. Tương tự như giữ ghế, khi khách hàng chọn 2 bắp và 2 nước, hệ thống tạo bản ghi trong bảng `combo_reservations` với `status = 'RESERVED'` và `reservedUntil = NOW() + 10 phút`.
    2. Số lượng tồn kho hiển thị cho những người mua khác được tính bằng:
       $$	ext{Stock khả dụng} = 	ext{combos.stock} - \sum 	ext{quantity đang trong phiên RESERVED hợp lệ}$$
    3. *Khi thanh toán thành công:* Bản ghi chuyển sang `COMPLETED`, trừ vĩnh viễn vào `combos.stock`.
    4. *Khi hủy hoặc hết 10 phút:* Cron Job `/api/cron/release-combos` đổi trạng thái thành `RELEASED`, số lượng bắp nước tự động quay trở lại lượng khả dụng cho khách hàng tiếp theo.
  - Cơ chế này giải quyết triệt để bài toán rạp chỉ còn đúng 5 suất bắp phô mai nhưng có 10 người cùng bấm mua online một lúc.

---

## TỔNG KẾT: 5 NGUYÊN TẮC "VÀNG" KHI BẢO VỆ ĐỒ ÁN TRƯỚC HỘI ĐỒNG GIẢNG VIÊN

1. **Hiểu bản chất trước khi nói về công nghệ:** Đừng chỉ nói "em dùng Next.js, NextAuth, Prisma". Hãy giải thích *tại sao* dùng chúng để giải quyết bài toán nghiệp vụ rạp chiếu phim (chống bán trùng ghế, đối soát tiền hoàn sự cố, bảo vệ chữ ký QR).
2. **Luôn thừa nhận giới hạn và đưa ra hướng phát triển:** Khi giảng viên hỏi về các điểm hệ thống chưa có (như API hoàn tiền tự động VNPay hay Redis Blacklist token), hãy tự tin trả lời: *"Dạ thưa Thầy/Cô, trong phạm vi Phase 1 của đồ án tốt nghiệp, nhóm tập trung tối ưu quy trình đối soát tiền mặt thủ công để đảm bảo an toàn tuyệt đối cho rạp. Về mặt kiến trúc, hệ thống đã thiết kế sẵn các trường dữ liệu và mô hình module hóa để dễ dàng tích hợp API Refund tự động và Redis trong Phase 2"*.
3. **Dẫn chứng bằng mã nguồn và cơ sở dữ liệu:** Khi trả lời, hãy chỉ rõ tên file, tên hàm và tên bảng (Ví dụ: `src/lib/auth.ts`, `prisma.screening.findMany`, bảng `tickets`, cột `refund_status`). Điều này chứng minh bạn là người trực tiếp viết code và hiểu sâu từng dòng lệnh.
4. **Bám sát các quy chế nghiệp vụ đã định nghĩa (BR-01 đến BR-10):** Khi giảng viên đặt các câu hỏi bẫy về quy trình (tại sao không hoàn tiền khi khách tự hủy, tại sao hủy trước 2 tiếng), hãy dẫn chứng ngay các Business Rules trong tài liệu SRS để khẳng định tính thực tế và chuyên nghiệp của đồ án.
5. **Giữ bình tĩnh và lắng nghe trọn vẹn câu hỏi:** Ghi chép lại các ý chính giảng viên hỏi, mỉm cười tự tin và trả lời mạch lạc, gãy gọn theo cấu trúc: **Kết luận trực tiếp (Có/Không) -> Giải thích nguyên lý -> Dẫn chứng kỹ thuật trong code Lumi Cinema**.

---
*(Hết bộ tài liệu 100 câu hỏi nghiệp vụ - Chúc bạn bảo vệ đồ án thành công đạt điểm xuất sắc!)*
