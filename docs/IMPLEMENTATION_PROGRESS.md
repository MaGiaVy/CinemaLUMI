# TIẾN ĐỘ TRIỂN KHAI DỰ ÁN (IMPLEMENTATION PROGRESS) - CINEMALUMI

> Trạng thái tổng thể: **IN_PROGRESS**
> Nhánh làm việc: `feat/cinemalumi-completion`

| Task ID | Requirement ID | File thay đổi | Công việc đã thực hiện | Kết quả test | Trạng thái | Vấn đề còn tồn tại |
|---|---|---|---|---|---|---|
| **TASK-01** | REQ-SEC-01 | `.gitignore`, `.env.example`, `.env.local` | Untrack `.env.local` khỏi git, thêm `.gitignore` và `.env.example` an toàn | Git clean, không còn track bí mật | **DONE** | Cần rotate secret trên production thật khi triển khai |
| **TASK-02** | REQ-MOV-02 | `src/lib/movie-id.ts`, `__tests__/lib/runner.mjs` | Xây dựng utility parse Movie ID đa định dạng (`m1`, `slug-id`, số nguyên) | Unit test 7/7 PASS 100% | **DONE** | Không |
| **TASK-03** | REQ-AUDIT-01 | `docs/audit/*` | Lập toàn bộ tài liệu kiểm toán: Requirements Matrix, Code Audit, Security Audit, Business Conflicts | Tài liệu hoàn chỉnh | **DONE** | Không |
| **TASK-04** | REQ-SEC-02 | `api/admin/*`, `api/staff/*`, `api/tickets/*` | Loại bỏ lỗ hổng leo thang đặc quyền qua query param `?role=` và header `x-user-role`, siết chặt server session | Chuẩn bị test sau khi sửa | **IN_PROGRESS** | Đang tiến hành cập nhật |
| **TASK-05** | REQ-PAY-01, REQ-PAY-02 | `api/payments/*`, `lib/vnpay.ts` | Bắt buộc login khi initiate payment; tích hợp xác thực chữ ký HMAC-SHA512 VNPay; loại bỏ parameter tampering | Chuẩn bị test luồng thanh toán | **TODO** | |
| **TASK-06** | REQ-TCK-01 | `api/tickets/route.ts` | Khắc phục lỗ hổng IDOR trên API lấy danh sách vé, chỉ trả về vé của người dùng đăng nhập | Chuẩn bị test phân quyền vé | **TODO** | |
| **TASK-07** | REQ-SEAT-02 | `api/seats/reserve/route.ts` | Bổ sung kiểm tra session và conditional update nguyên tử chống race condition giữ trùng ghế | Chuẩn bị test đồng thời | **TODO** | |
| **TASK-08** | REQ-MOV-03, REQ-SCR-01, REQ-CMB-01 | `api/movies/*`, `api/screenings/*`, `api/combos/*` | Thêm server-side auth (ADMIN only) cho các thao tác CRUD danh mục; bổ sung cleaning time giữa các suất chiếu | Chuẩn bị test CRUD | **TODO** | |
| **TASK-09** | REQ-ADM-01 | `next.config.ts`, `src/middleware.ts` | Bổ sung rewrite cho `/dashboard` và `/reports`, fix lỗi 404 trong middleware test | Chuẩn bị test rewrite | **TODO** | |
| **TASK-10** | REQ-FE-01 | `cinema-app/src/app/(customer)/*` | Loại bỏ toàn bộ mockData trên luồng thực tế của Customer, đồng bộ UI từ `frontend/` | Chuẩn bị kiểm tra UI | **TODO** | |
| **TASK-11** | REQ-STF-01..03 | `cinema-app/src/app/staff/*` | Hoàn thiện giao diện POS, tra cứu, soát vé chống quét trùng, hoàn vé sự cố rạp | Chuẩn bị test Staff | **TODO** | |
| **TASK-12** | REQ-ADM-01..02 | `cinema-app/src/app/admin/*` | Hoàn thiện giao diện Admin Dashboard, quản lý suất chiếu, phòng chiếu, báo cáo doanh thu | Chuẩn bị test Admin | **TODO** | |
| **TASK-13** | REQ-TST-01 | `__tests__/*`, `docs/testing/*` | Sửa các test case cũ bị lỗi do dữ liệu test, viết thêm test security & race condition, lập Test Plan & Results | Chuẩn bị test tự động | **TODO** | |
| **TASK-14** | REQ-DEP-01 | `README.md`, Docker Compose, Hướng dẫn chạy | Chuẩn bị tài liệu bàn giao, cấu hình Docker, hướng dẫn seed dữ liệu demo | Bàn giao | **TODO** | |
