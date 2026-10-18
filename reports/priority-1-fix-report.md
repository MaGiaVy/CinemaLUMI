# CinemaLUMI – Priority 1: báo cáo tiến độ và nghiệm thu

**Trạng thái: CHƯA ĐẠT.** Nhánh `fix/priority-1-business-rules` được tạo từ `origin/main` tại commit `a040e19`. Không có commit, push hay thay đổi `main`. Các mục dưới đây phân biệt rõ phần đã sửa bằng mã nguồn với phần chưa kiểm chứng bằng giao dịch thật.

## 1. Lỗi ban đầu và nguyên nhân

| Nhóm | Lỗi xác nhận từ mã nguồn |
| --- | --- |
| Đăng ký/đánh giá | Đăng ký cho phép thiếu số điện thoại; API đánh giá nhận `user_id` từ body hoặc query khi không có session. |
| Ghế | Giữ ghế không lưu chủ sở hữu/đơn; API tạo đơn ghi đè mọi ghế chưa `OCCUPIED`; API nhả ghế của người khác. |
| Thanh toán | URL thanh toán là trang mock; callback cho phép nhánh mock, diễn giải số tiền bằng heuristic và không kiểm tra chặt đơn/ghế còn hạn. Trang kết quả tin `status`, `amount` từ query và hiển thị QR giả. |
| Voucher | Voucher bồi hoàn đang giảm trên toàn bộ tiền vé; không có snapshot giảm giá từng vé; lượt dùng tăng ở callback nhưng không có kiểm soát đồng thời bằng điều kiện. |
| Hủy vé | Hai endpoint khách hàng lặp logic, không khóa cập nhật theo trạng thái; có thể cấp voucher hai lần khi đồng thời. Không có log hủy lưu database. |
| Hoàn tiền | Endpoint nhân viên cho phép voucher 100% thay tiền mặt, không chặn vé `Used`, tự đặt Payment toàn đơn thành `Refunded`, audit chỉ `console.log`. Hủy suất chiếu đặt `ENDED`, chưa có khoản chờ hoàn/hạn 30 ngày/xác nhận tiền mặt. |

## 2. File đã chỉnh sửa

`cinema-app/prisma/schema.prisma`; migration nêu dưới; `src/app/(public)/signup/page.tsx`; `src/app/(customer)/payment-result/page.tsx`; `src/app/(customer)/payments/result/page.tsx`; `src/app/api/auth/signup/route.ts`; `src/app/api/reviews/route.ts`; `src/app/api/seats/{route,reserve/route,release/route}.ts`; `src/app/api/cron/release-seats/route.ts`; `src/app/api/payments/{initiate/route,vnpay-ipn/route,vnpay-return/route,momo-ipn/route,momo-return/route,[id]/route}.ts`; `src/lib/{vnpay,momo}.ts`; `__tests__/security/priority1-signatures.mjs`; `package.json`; `cinema-app/README.md`.

## 3. Migration

`cinema-app/prisma/migrations/20261017000000_priority1_seat_holds/migration.sql` thêm `hold_user_id`, `hold_payment_id` vào ghế và khóa ngoại/chỉ mục. Migration chỉ bổ sung cột, không xóa dữ liệu. **Chưa áp dụng lên database**. `npx prisma migrate status` báo cả migration khởi tạo `20260926171340_init_cinema_db` lẫn migration mới chưa được ghi nhận. Database đang trỏ tới PostgreSQL từ cấu hình `.env`; cần baseline/đối chiếu dữ liệu hiện có trước khi chạy `migrate deploy`. Không chạy `db push` hoặc ghi vào database cấu hình hiện tại.

## 4. Quy tắc đã sửa ở mã nguồn

- Đăng ký bắt buộc họ tên, email, mật khẩu tối thiểu 6 ký tự, số điện thoại; email trùng được trả 409 kể cả khi hai request đua nhau. Role tạo mới cố định `CUSTOMER`.
- Tạo đánh giá lấy danh tính từ NextAuth session, bỏ fallback `user_id` giả.
- Giữ ghế 10 phút gắn người giữ; tạo đơn chỉ gắn các ghế còn hạn của người đang đăng nhập, không gia hạn lượt giữ. Nhả ghế chỉ tác động lượt giữ của chính người gọi chưa gắn đơn.
- Callback có chữ ký hợp lệ mới xử lý; VNPay kiểm tra TMN code, mã đơn, số tiền `vnp_Amount / 100`, mã phản hồi/trạng thái; MoMo kiểm tra HMAC. Giao dịch thành công chỉ chiếm ghế còn hạn của đúng đơn trong transaction; khóa row Payment để chống callback đồng thời. Thất bại chỉ nhả ghế của đúng đơn.
- VNPay và MoMo đọc credentials từ environment; không có khóa thì trả lỗi thay vì URL mock. Trang kết quả truy vấn Payment của chính người đăng nhập; bỏ QR minh họa.

**Giới hạn:** Mã nguồn đã thay đổi theo schema mới nhưng database chưa migrate, nên các luồng dùng cột giữ ghế chưa chạy được trên database cấu hình hiện tại. Không được triển khai nhánh này vào production trước khi hoàn tất migration và các nhóm còn thiếu.

## 5. Kết quả kiểm thử

| Kiểm tra | Kết quả |
| --- | --- |
| `npx prisma validate` | PASS – schema hợp lệ. |
| `npx prisma generate` | PASS – Prisma Client sinh được. |
| `npx prisma migrate status` | FAIL – hai migration chưa ghi nhận trên database cấu hình. Chưa áp dụng migration. |
| `npx tsc --noEmit` | PASS. |
| `npm run lint` | PASS với 0 lỗi, 47 cảnh báo hiện có/chưa xử lý. |
| `npm test` | PASS – 6 test giá cũ và 6 assertion chữ ký VNPay/MoMo mới. |
| `npm run build` | PASS; còn cảnh báo Next.js `middleware` đã deprecated. |
| Concurrent hold/buy, callback lặp/đến muộn, voucher, hủy/hoàn, giao diện thực tế | NOT RUN – cần database test riêng đã migrate và dữ liệu/credentials sandbox phù hợp. Không suy diễn PASS từ build. |

## 6. Vấn đề còn tồn tại

1. Voucher 50% chưa giới hạn một vé được chọn; chưa có snapshot giá gốc/giảm/thực trả từng vé, phân bổ tỷ lệ, kiểm soát lượt dùng đồng thời và hoàn lượt cho đơn thất bại.
2. Hủy vé khách/nhân viên vẫn còn logic cũ chưa hợp nhất, chưa chống hủy đồng thời và chưa có audit bền vững.
3. Hoàn tiền lỗi rạp vẫn sai đặc tả: chưa ghi nhận khoản **chờ hoàn/đã hoàn**, xác nhận tiền mặt, người thực hiện, hạn nhận 30 ngày và log đối soát trong database. SRS không yêu cầu trạng thái `EXPIRED` hay mã chứng từ riêng. Hủy toàn suất cần chuyển sang `CANCELLED` và tạo khoản chờ hoàn cho từng vé hợp lệ.
4. Bộ test API cũ trong `__tests__` giả lập callback không ký và không có session, không còn phù hợp với yêu cầu bảo mật; cần viết lại trên database test tách biệt. Chưa chạy các script đó.
5. Chưa kiểm chứng luồng email, combo reservation và POS cùng schema mới; trang mock cũ vẫn tồn tại nhưng URL khởi tạo thanh toán mới không sử dụng trang đó.
6. Khi gọi MoMo bị timeout, đơn được giữ `Pending` để chờ IPN và cần quy trình đối soát/hết hạn; chưa có job đối soát tự động cho trạng thái bất định này.

## 7. Biến môi trường

`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`; VNPay: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNP_URL`; MoMo: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_CREATE_URL`. Không ghi giá trị khóa vào Git. IPN của nhà cung cấp phải truy cập được bằng URL công khai HTTPS.

## 8. Kiểm thử sandbox và trước production

1. Tạo database test riêng, đối chiếu migration khởi tạo với schema đang chạy, apply migration an toàn rồi xác nhận dữ liệu cũ còn nguyên.
2. Cấu hình merchant sandbox VNPay và MoMo; đăng ký IPN URL tương ứng. [Tài liệu VNPay](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [tài liệu MoMo](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/).
3. Chạy thanh toán sandbox thành công, thất bại, sai chữ ký/số tiền, callback lặp và đến sau 10 phút; đối soát đơn, từng vé, tồn kho, email.
4. Hoàn thành các mục 4–6 và test đồng thời trong mục 6 trước khi đưa production. Chưa có credentials nên **không báo tích hợp thực tế thành công**.
