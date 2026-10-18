# CinemaLUMI – kiểm chứng database và nghiệp vụ (18/10/2026)

**Phạm vi:** mã nguồn `cinema-app`, Supabase dev/test của nhóm (người dùng xác nhận không phục vụ khách thật), bản sao PostgreSQL cô lập ở máy local. Nhánh `fix/database-system-verification`; không commit, push, merge, reset Git hoặc xóa dữ liệu. Những bài test sinh đơn/vé dùng **chỉ** bản sao local; database Supabase chỉ nhận migration đã kiểm tra. Không có khóa bí mật hoặc chuỗi kết nối trong báo cáo.

## Database và migration

Trước khi sửa, database có 12 bảng dữ liệu nhưng thiếu `_prisma_migrations`; ba migration trong repo chưa được ghi nhận là `20260926171340_init_cinema_db`, `20261017000000_priority1_seat_holds`, `20261017010000_priority1_vouchers_refunds`. Schema hiện hữu đã khác migration khởi tạo. Đã tạo backup `pg_dump` riêng tư ngoài repo, **khôi phục thành công** bằng `pg_restore` vào PostgreSQL local và so sánh số bản ghi. Migration `20261016000000_restore_schema_history` nối từ schema khởi tạo đến schema thực tế; Prisma schema diff cho kết quả không còn khác biệt. Chỉ sau bước này mới baseline hai migration mô tả cấu trúc **đã tồn tại** (`init` và `restore_schema_history`); không đánh dấu giả các migration nghiệp vụ. Ba migration nghiệp vụ còn lại được chạy thực bằng `prisma migrate deploy` trên bản sao trước, rồi trên Supabase dev/test:

1. `20261017000000_priority1_seat_holds`: chủ giữ ghế và liên kết Payment.
2. `20261017010000_priority1_vouchers_refunds`: snapshot vé, voucher, log hủy và hoàn tiền.
3. `20261018000000_guard_combo_ownership_and_reviews`: chủ giữ combo, liên kết đơn, người bán POS và unique đánh giá.

`npx --no-install prisma migrate status`: **5/5 migration, database schema is up to date** trên cả Supabase dev/test và bản sao local. Truy vấn trực tiếp xác nhận `ticket_refunds`, `cancellation_actions`, các cột giữ ghế/combo, bốn khóa ngoại mới và hai unique index; Prisma đọc được các bảng. Số bản ghi cũ trên Supabase trước/sau: users 15, movies 6, screenings 23, seats 569, payments 65, tickets 89, combos 5, combo_reservations 17, order_combos 39, coupons 63, reviews 3, pricing 2. Không phát hiện mất bản ghi cũ. Backup và bản sao chỉ lưu tại thư mục private `/tmp/cinemalumi-verify-X59yLm`, không đưa vào Git.

## Sửa lỗi và bằng chứng nghiệp vụ

Giữ ghế/combo nay gắn đúng người và đơn, trừ/trả tồn kho combo một lần; quá hạn 10 phút giải phóng ghế, trả lượt voucher, kết thúc đơn Pending và từ chối callback muộn. Payment chỉ nhận combo reservation thuộc khách, đúng số lượng và còn hạn. Callback VNPay ký hợp lệ được kiểm tra số tiền, xử lý lặp mà không tạo vé/trừ kho trùng. POS không thể bán ghế người khác đang giữ, ghi nhân viên bán; combo mua quầy giao ngay. Giao combo và soát vé chặn thao tác hai lần. Hủy từng vé giữ nguyên các vé/combo còn lại; hủy do lỗi khách tạo voucher 50% một vé, hủy do lỗi rạp ghi chờ hoàn đúng giá vé thực trả rồi xác nhận trả tiền mặt một lần. Đánh giá phim có unique theo khách/phim. Suất chiếu kiểm tra trùng theo đúng thời lượng phim và không cho đổi lịch/phòng/phim khi vé hợp lệ đã bán. Báo cáo phân biệt doanh thu vé, combo, chờ hoàn, đã hoàn và kênh POS/online. Giao diện bỏ thông báo sai về hoàn tiền tự động, chỉ Admin thấy liên kết sửa phim, đồng hồ giữ ghế chỉ hiện sau khi giữ ghế thật.

Bài `__tests__/integration/local-booking-flow.mjs` chạy trên app thật + database bản sao local, dùng đăng nhập/session thật và HTTP API thật. **PASS**: đăng ký/đăng nhập, phân quyền khách/nhân viên/admin, xem phim/suất/ghế, giữ ghế và tranh chấp đồng thời, combo reservation và quyền sở hữu, tạo đơn với promo, callback ký bằng khóa **local test** thành công/sai tiền/lặp/thất bại/đến muộn, vé không trùng, hủy từng vé, voucher 50% và hoàn lượt khi thanh toán lỗi, giao combo độc lập và chống giao lặp, hoàn tiền mặt 2 bước/chống hoàn lặp, soát vé trong/ngoài khung giờ, POS vé/combo, báo cáo và quyền Admin. Bài này **không** chứng minh cổng thanh toán VNPay/MoMo sandbox đã hoạt động. Kiểm tra giao diện bằng Chromium/Playwright đã đi qua đăng nhập → phim → suất → chọn/giữ ghế → chọn combo → trang thanh toán, nơi tổng tiền vé 100.000đ + combo 20.000đ = 120.000đ và đồng hồ giữ ghế hiện sau khi đặt chỗ. Chưa nhấn trả tiền qua gateway thật vì thiếu merchant sandbox.

Các lệnh kiểm tra chính (trong `cinema-app`): `npx --no-install prisma migrate status`, `npx --no-install prisma validate`, `npx tsc --noEmit`, `npm run lint -- --format json`, `npm test`, `npm run build`, `git diff --check`. Bài tích hợp chạy bằng `E2E_LOCAL_COPY=1 node __tests__/integration/local-booking-flow.mjs` trong bản sao app cô lập với `DATABASE_URL`/`DIRECT_URL` chỉ đến PostgreSQL local; script tự từ chối host khác. Kiểm thử giao diện dùng Chromium/Playwright trên app cô lập cùng database đó.

Các file đã chỉnh sửa thuộc: `prisma/schema.prisma`, hai migration mới nói trên; API `seats`, `combos`, `payments`, `cron`, `staff/pos`, `staff/combos/deliver`, `tickets/[id]/mark-used`, `screenings`, `reviews`, `admin/reports/revenue`; thư viện `src/lib/expire-booking-holds.ts`; các trang khách chọn ghế/thanh toán/chi tiết phim và trang chủ; bài test `__tests__/integration/local-booking-flow.mjs`; hai file báo cáo. Không sửa migration cũ đã tồn tại.

| Hạng mục | Kết quả | Bằng chứng / giới hạn |
| --- | --- | --- |
| Prisma schema | PASS | `npx --no-install prisma validate`; diff so với migration đã triển khai không khác biệt. |
| 3 migration ban đầu chờ xử lý | PASS | 2 migration baseline sau đối chiếu schema; 1 migration Priority 1 triển khai thật, cộng 2 migration nghiệp vụ mới; status 5/5. |
| Database đồng bộ | PASS | Supabase dev/test và bản sao local: 5/5, kiểm tra bảng/cột/FK/index, số bản ghi cũ giữ nguyên. |
| TypeScript | PASS | `npx tsc --noEmit`. |
| Lint | PASS (0 lỗi) | `npm run lint -- --format json`: còn 49 cảnh báo. |
| Unit test | PASS | `npm test`: giá vé, phân bổ giảm giá, chữ ký thanh toán. |
| Build | PASS | `npm run build`; Next.js còn cảnh báo middleware deprecated. |
| Integration test | PASS (phạm vi local) | API thật + PostgreSQL bản sao; hơn 40 tình huống nêu trên. |
| E2E giao diện | PASS một phần | Chromium đi đến trang thanh toán; giao dịch qua vendor chưa chạy. |
| Đặt vé và giữ ghế | PASS (local) | Giữ, tranh chấp, hết hạn, POS không chiếm ghế đang giữ. |
| Thanh toán | PASS nội bộ / BLOCKED vendor | Callback ký local, số tiền và idempotency đạt; chưa có VNPay/MoMo merchant sandbox/IPN công khai. |
| Voucher | PASS (luồng đã thử) | Giảm đúng một vé, hạn/lượt, trả lượt khi thất bại/hết hạn. |
| Hủy và hoàn tiền | PASS (luồng đã thử) | Hủy từng vé, voucher 50%, chờ hoàn/đã hoàn tiền mặt và chặn lặp. |
| Các chức năng SRS còn lại | NOT VERIFIED toàn bộ | Các luồng đã thử nêu trên; các giới hạn bên dưới chưa đủ bằng chứng. |

## Giới hạn còn lại

- **BLOCKED:** chưa có merchant sandbox VNPay/MoMo và IPN HTTPS công khai, nên chưa thể kiểm chứng chuyển hướng cổng thanh toán, callback từ nhà cung cấp thật hoặc MoMo thực tế. Bài tích hợp chỉ mô phỏng callback bằng chữ ký local và không được dùng để kết luận vendor tích hợp thành công.
- **NOT VERIFIED:** gửi xác nhận Email/SMS và quy trình nhận tiền hoàn online trong 30 ngày với khách đến quầy chưa được thử với dịch vụ/thiết bị thật; sao lưu phục hồi chỉ được xác nhận bằng một lần `pg_restore` local, chưa kiểm tra vận hành định kỳ.
- **Chưa đáp ứng trọn SRS:** chưa có ngày sinh/tuổi khách để xác minh thực tế điều kiện vé Trẻ em; ghế dữ liệu cũ còn loại VIP/COUPLE dù SRS quy định một loại ghế (suất chiếu mới tạo ghế STANDARD). Không sửa hồi tố dữ liệu cũ để tránh thay đổi giao dịch lịch sử.
- Báo cáo doanh thu theo **suất chiếu** chưa phân bổ combo bán độc lập tại quầy vì giao dịch này không gắn suất; cần cách tổng hợp cấp rạp/kênh để phản ánh đầy đủ doanh thu combo độc lập. Chưa xác nhận xuất báo cáo PDF/Excel và mọi nhánh CRUD Admin bằng E2E.
- Lint còn 49 cảnh báo: 17 biến chưa dùng, 15 `any`, 15 thẻ `img`, 2 điều hướng qua `window.location.href`. Không tắt quy tắc lint hàng loạt; những vị trí không liên quan hoặc cần thay đổi UI rộng chưa được xử lý. Đây là cảnh báo, không phải lỗi build.

**Kết luận:** database dev/test đã đồng bộ, không thấy mất dữ liệu và các luồng quan trọng đã kiểm chứng trên bản sao local. **Chưa thể khẳng định tất cả chức năng đều hoạt động tốt theo toàn bộ SRS** khi các mục BLOCKED/NOT VERIFIED và khoảng trống nêu trên còn tồn tại.
