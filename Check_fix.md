\# NHIỆM VỤ: HOÀN THIỆN TOÀN BỘ HỆ THỐNG CINEMALUMI

Bạn đóng vai trò Senior Full-stack Engineer, Software Architect, QA Engineer và Application Security Engineer, chịu trách nhiệm tiếp tục phát triển và hoàn thiện đồ án \*\*CinemaLUMI – Hệ thống quản lý bán vé và vận hành rạp chiếu phim\*\*.

Mục tiêu là tạo ra một hệ thống full-stack hoàn chỉnh, hoạt động thực tế, đúng tài liệu nghiệp vụ, an toàn, giao diện chuyên nghiệp và có thể chạy thử, trình diễn, bàn giao.

\*\*Đây là nhiệm vụ triển khai thực tế. Không được chỉ viết kế hoạch, tạo tài liệu hoặc trả lời hướng dẫn mà không thực hiện code.\*\*

\#\# I. NGUỒN DỮ LIỆU

\#\#\# 1\. Repository

https\://github.com/MaGiaVy/CinemaLUMI.git

Nhánh chính: \`main\`

Cấu trúc hiện có:

\- \`cinema-app/\`: ứng dụng Next.js, backend API, Prisma, PostgreSQL và các trang Customer/Staff/Admin.  
\- \`frontend/\`: giao diện được thiết kế riêng, hiện có những phần sử dụng mockData.  
\- \`NEXTJS\_FULLSTACK\_PLAN\_15PHASES.md\`: kế hoạch triển khai.  
\- \`CODE\_STANDARDS\_BEST\_PRACTICES.md\`: quy chuẩn code.

Phải kiểm tra trạng thái repository thực tế trước khi triển khai, không mặc định mô tả hiện tại luôn chính xác.

\#\#\# 2\. Tài liệu nghiệp vụ

Google Drive:

https\://drive.google.com/drive/folders/1g3Eq38gFkGeVc6w37YJXoN3ldpFp4H5M

Thư mục: \`PTTK\_HĐT\`

Các tài liệu cần đối chiếu:

\- Tài liệu SRS.  
\- Thu thập yêu cầu và khảo sát nghiệp vụ.  
\- Use Case Diagram.  
\- Mô tả Use Case của các thành viên.  
\- Activity Diagram.  
\- Sequence Diagram.  
\- BFD.  
\- Những quy tắc nghiệp vụ liên quan.

Nếu Antigravity không có quyền truy cập Google Drive, phải thông báo rõ những tài liệu chưa đọc được, tìm bản tương ứng đã có trong repository hoặc workspace, và không được giả vờ đã đọc tài liệu.

Không tự suy diễn hoặc sáng tạo nghiệp vụ khi tài liệu không có thông tin.

\#\# II. NGUYÊN TẮC BẮT BUỘC

1\. \*\*Không xây lại dự án từ đầu.\*\* Kế thừa tối đa code đang hoạt động.  
2\. Không xóa hoặc thay đổi chức năng hiện tại nếu không có lý do được kiểm chứng.  
3\. Dùng SRS đã phê duyệt làm nguồn yêu cầu chính. Khi khảo sát, UML, kế hoạch và code mâu thuẫn, ghi nhận sai lệch trước khi sửa. Với những quy tắc chưa rõ, không tự quyết định thay đổi có ảnh hưởng nghiệp vụ.  
4\. Ưu tiên một ứng dụng full-stack thống nhất, tránh hai hệ thống frontend hoạt động độc lập.  
5\. Giữ nguyên Next.js, TypeScript, PostgreSQL, Prisma và công nghệ đang có nếu đáp ứng yêu cầu.  
6\. Không sử dụng mockData trong các luồng nghiệp vụ thực tế.

7\. Không hardcode mật khẩu, API key, token hoặc thông tin nhạy cảm.  
8\. Không thay đổi trực tiếp nhánh \`main\`, không force push, không xóa database hoặc migration có dữ liệu mà chưa được cho phép.  
9\. Mọi API phải được kiểm tra đầu vào, xác thực và phân quyền phía server.  
10\. Các thay đổi phải có kiểm thử và bằng chứng thực tế, không được tự đánh dấu PASS.  
11\. Không tự thêm chức năng nằm ngoài phạm vi SRS chỉ để làm hệ thống có vẻ phức tạp hơn.  
12\. Không được tuyên bố hệ thống hoàn tất nếu còn yêu cầu chưa được hiện thực hoặc kiểm thử.

\#\# III. GIAI ĐOẠN 1 – AUDIT TOÀN BỘ DỰ ÁN

Trước khi sửa code:

1\. Kiểm tra cấu trúc repository và trạng thái Git.  
2\. Đọc README, package.json, Prisma schema và migrations.  
3\. Đọc tất cả API, trang giao diện và các file thư viện liên quan.  
4\. Đọc tài liệu nghiệp vụ có thể truy cập.  
5\. Xác định toàn bộ chức năng đang tồn tại.  
6\. Phân tích phần trùng lặp giữa \`cinema-app\` và \`frontend\`.  
7\. Kiểm tra sự khác biệt giữa dữ liệu giả và dữ liệu PostgreSQL.  
8\. Kiểm tra quyền CUSTOMER, STAFF và ADMIN.  
9\. Kiểm tra luồng đăng ký, đăng nhập, giữ ghế, thanh toán, đặt vé, hủy vé, giao combo và soát vé.  
10\. Chạy kiểm thử, lint và production build hiện có để ghi nhận trạng thái ban đầu khi môi trường cho phép.

Tạo:

\`docs/audit/REQUIREMENTS\_TRACEABILITY.md\`

Trong đó có bảng:

| Requirement ID | Mô tả | Tài liệu nguồn | File code | Trạng thái | Vấn đề | Hành động |  
|---|---|---|---|---|---|---|

Trạng thái gồm:

\- DONE\_VERIFIED  
\- IMPLEMENTED\_UNTESTED  
\- PARTIAL  
\- MISSING  
\- INCORRECT  
\- BLOCKED

Tạo thêm:

\- \`docs/audit/CODE\_AUDIT.md\`  
\- \`docs/audit/SECURITY\_AUDIT.md\`  
\- \`docs/audit/BUSINESS\_RULE\_CONFLICTS.md\`

Sau audit, xác lập thứ tự sửa lỗi theo mức độ nghiêm trọng và bắt đầu triển khai.

\#\# IV. GIAI ĐOẠN 2 – SỬA LỖI BẢO MẬT NGHIÊM TRỌNG

Kiểm tra đặc biệt:

\- \`api/payments/initiate\`  
\- \`api/payments/vnpay-ipn\`  
\- \`api/payments/vnpay-return\`  
\- \`api/seats/reserve\`  
\- \`api/tickets/\[id\]/mark-used\`  
\- \`api/staff/tickets/\[id\]/cancel-with-voucher\`  
\- Toàn bộ API tạo, cập nhật và xóa danh mục.

Yêu cầu:

\- Không chấp nhận quyền ADMIN/STAFF lấy từ query parameter hoặc header do client tự cung cấp.  
\- Không cho khách chưa xác thực đặt vé online bằng tài khoản mặc định.  
\- Xác minh session, role và quyền sở hữu tài nguyên trên server.  
\- Kiểm tra chữ ký và tính hợp lệ của callback thanh toán trước khi cập nhật giao dịch.  
\- Phân biệt rõ mock payment và cổng thanh toán thật.

\- Chống replay và xử lý callback trùng lặp.  
\- Đảm bảo một thanh toán thành công không sinh nhiều vé.  
\- Đảm bảo vé đã sử dụng không thể check-in lần thứ hai.  
\- Bảo vệ các endpoint quản trị.  
\- Kiểm tra CSRF, validation, rate limiting phù hợp và xử lý lỗi không làm rò rỉ dữ liệu nhạy cảm.  
\- Kiểm tra file \`.env.local\` đang được Git theo dõi. Không hiển thị giá trị bí mật trong báo cáo; loại khỏi Git tracking an toàn và ghi rõ những secret thực tế cần chủ dự án thu hồi hoặc thay mới.

Viết test cho các trường hợp truy cập trái phép và luồng thanh toán giả mạo.

\*\*Không tích hợp thanh toán thật hoặc triển khai public cho đến khi các lỗi bảo mật nghiêm trọng được xử lý và xác minh.\*\*

\#\# V. GIAI ĐOẠN 3 – CHUẨN HÓA DATABASE VÀ NGHIỆP VỤ

Đối chiếu Prisma schema với SRS và Use Case.

Hệ thống dự kiến gồm một rạp, 5 phòng chiếu, 50 ghế/phòng, ba vai trò CUSTOMER, STAFF, ADMIN.

Kiểm tra tính đầy đủ và quan hệ dữ liệu của:

\- Users  
\- Movies  
\- Screenings  
\- Seats  
\- Pricing  
\- Coupons/Vouchers  
\- Combos  
\- Payments  
\- Tickets  
\- OrderCombos  
\- Reviews  
\- Các bảng bổ sung thực sự cần cho yêu cầu nghiệp vụ

Lưu ý các vấn đề cần xác nhận:

\- Khảo sát quy định giữ ghế 5 phút, SRS và code hiện mô tả 10 phút.  
\- SRS yêu cầu 50 ghế Standard/phòng, code có VIP và Couple.  
\- Hủy vé do khách: trước suất chiếu ít nhất 2 giờ, cấp voucher theo quy định.  
\- Hủy do sự cố rạp: đối soát hoàn tiền mặt 100% theo SRS.  
\- Tối đa một voucher cho một đơn hàng.  
\- Không cho phép đặt trùng ghế.  
\- Các suất chiếu cùng phòng không được trùng thời gian và phải có thời gian vệ sinh theo quy định.

Không tự chọn một trong các quy định mâu thuẫn nếu chưa có căn cứ. Ưu tiên bản SRS phê duyệt khi cần một mặc định triển khai tạm và ghi rõ quyết định trong báo cáo.

Đảm bảo:

\- Foreign keys đúng.  
\- Unique constraints hợp lý.  
\- Database transactions cho nghiệp vụ tiền và ghế.  
\- Khóa ghế hoặc cập nhật có điều kiện để chống tranh chấp đồng thời.  
\- Dữ liệu tồn kho không âm.  
\- Không sinh vé cho thanh toán thất bại.  
\- Bảo toàn lịch sử thanh toán và hủy vé.  
\- Có dữ liệu seed phục vụ demo, tách biệt dữ liệu production.

Không thực hiện migration phá hủy dữ liệu hiện có.

\#\# VI. GIAI ĐOẠN 4 – THỐNG NHẤT FRONTEND VÀ BACKEND

Đánh giá hai thư mục \`cinema-app/\` và \`frontend/\`.

Ưu tiên giữ \`cinema-app/\` làm ứng dụng full-stack chính nếu kết quả audit xác nhận phù hợp.

Tận dụng giao diện tốt từ \`frontend/\`, chuyển những component cần thiết sang ứng dụng chính.

Yêu cầu:

1\. Một nguồn dữ liệu thực từ PostgreSQL.  
2\. Frontend gọi API thực, không sử dụng dữ liệu giả ở chế độ bình thường.  
3\. Thống nhất kiểu dữ liệu TypeScript giữa các chức năng.  
4\. Trạng thái loading, empty, error và success đầy đủ.  
5\. Giao diện responsive trên desktop, tablet và mobile.  
6\. Không có nút chỉ để trang trí.  
7\. Không có route chết hoặc chuyển hướng sai.  
8\. Không để hai luồng thanh toán mâu thuẫn nhau.  
9\. Không tự ý xóa giao diện đã thiết kế.  
10\. Giữ phong cách điện ảnh chuyên nghiệp và nhận diện thương hiệu CinemaLUMI.

Kiểm tra các màn hình Customer, Staff và Admin theo một hệ thống thiết kế thống nhất.

\#\# VII. GIAI ĐOẠN 5 – HOÀN THIỆN CHỨC NĂNG

\#\#\# A. CUSTOMER

Hoàn thiện và kiểm thử:

\- Đăng ký, đăng nhập, đăng xuất.  
\- Danh sách phim, lọc phim, tìm kiếm.  
\- Chi tiết phim và lịch chiếu.  
\- Chọn suất chiếu và ghế.  
\- Giữ ghế có thời hạn.  
\- Chọn loại vé.  
\- Chọn combo và số lượng.  
\- Áp dụng voucher hợp lệ.  
\- Tính tổng tiền trên server.  
\- Thanh toán sandbox hoặc mock có kiểm soát.  
\- Tạo và hiển thị vé điện tử.  
\- Mã QR xác thực.  
\- Xem lịch sử vé.  
\- Hủy vé đủ điều kiện.  
\- Nhận voucher bồi hoàn.  
\- Đánh giá phim theo SRS.

\#\#\# B. STAFF

Hoàn thiện:

\- Dashboard nhân viên.  
\- POS bán vé tại quầy.  
\- Bán combo độc lập.  
\- Hỗ trợ khách vãng lai tại quầy.  
\- Thanh toán tiền mặt.  
\- Tra cứu theo mã vé, email hoặc số điện thoại.  
\- Soát vé và chống quét trùng.  
\- Xác nhận giao combo.  
\- Xử lý vé trong trường hợp sự cố.  
\- Ghi nhận đối soát hoàn tiền mặt.  
\- In hoặc hiển thị chứng từ cần thiết cho demo.

\#\#\# C. ADMIN

Hoàn thiện:

\- Dashboard quản trị.  
\- CRUD phim.  
\- Quản lý phòng và suất chiếu theo phạm vi SRS.  
\- Kiểm tra lịch chiếu trùng.  
\- Cấu hình bảng giá.  
\- Quản lý combo và tồn kho.  
\- Quản lý voucher.  
\- Quản lý quyền tài khoản phù hợp.  
\- Hủy suất chiếu khi xảy ra sự cố.  
\- Báo cáo doanh thu theo ngày, tháng, năm.  
\- Báo cáo theo phim và phòng chiếu.  
\- Phân biệt doanh thu, số tiền đã hoàn và khoản chờ hoàn.  
\- Xuất báo cáo.  
\- Audit log cho thao tác nghiệp vụ quan trọng.

Không tự đánh dấu hoàn thành các mục chỉ vì đã tồn tại tên file hoặc giao diện.

\#\# VIII. GIAI ĐOẠN 6 – KIỂM THỬ TOÀN HỆ THỐNG

Thực hiện:

\*\*Unit Testing\*\*  
\- Tính giá vé.  
\- Kiểm tra voucher.  
\- Thời hạn giữ ghế.  
\- Điều kiện hủy vé.  
\- Điều kiện đánh giá và phân quyền.

\*\*Integration Testing\*\*

\- API với database test.  
\- Đăng nhập và phân quyền.  
\- Đặt vé và giữ ghế.  
\- Thanh toán và phát hành vé.  
\- Hủy vé và bồi hoàn.  
\- Tồn kho combo.  
\- Check-in.

\*\*E2E Testing\*\*  
\- Khách đăng nhập → chọn phim → đặt ghế → thanh toán → nhận vé.  
\- Hai khách tranh cùng một ghế.  
\- Thanh toán thành công và callback lặp.  
\- Thanh toán thất bại.  
\- Khách hủy vé đủ điều kiện.  
\- Nhân viên bán vé và giao combo.  
\- Nhân viên quét vé.  
\- Admin cập nhật phim và suất chiếu.  
\- Admin xử lý sự cố và xem báo cáo.

Test phải chạy trên dữ liệu thử nghiệm, không phá dữ liệu thật.

Chạy các lệnh build, lint, typecheck và test tương ứng với cấu hình thực tế.

Không báo PASS nếu chưa có kết quả chạy thành công.

Tạo:

\- \`docs/testing/TEST\_PLAN.md\`  
\- \`docs/testing/TEST\_RESULTS.md\`

\#\# IX. GIAI ĐOẠN 7 – TRIỂN KHAI VÀ BÀN GIAO

Chuẩn bị:

\- README chính xác, cập nhật.  
\- \`.env.example\` không chứa secret thật.  
\- Hướng dẫn setup trên Linux.  
\- Hướng dẫn database migration và seed.  
\- Docker Compose cho môi trường local nếu phù hợp.  
\- Lệnh chạy dự án rõ ràng.  
\- Hướng dẫn tạo tài khoản demo an toàn.  
\- Hướng dẫn backup và restore database.  
\- Hướng dẫn cấu hình email.  
\- Hướng dẫn sandbox payment.  
\- Hướng dẫn triển khai khi có hạ tầng.  
\- Tài liệu kiến trúc và cấu trúc thư mục.

Ưu tiên quy trình khởi chạy đơn giản, dễ tái lập trên máy khác.

Không tự động triển khai production, sử dụng tài khoản thanh toán thật, hoặc sử dụng dịch vụ có phí.

\#\# X. CÁCH TỔ CHỨC THỰC HIỆN

Tạo một nhánh mới từ trạng thái \`main\` mới nhất, sau khi xác minh working tree và bảo toàn thay đổi cục bộ.

Tên gợi ý:

\`feat/cinemalumi-completion\`

Chia công việc thành các phần nhỏ có thể kiểm chứng.

Với mỗi phần:

1\. Đọc yêu cầu liên quan.  
2\. Kiểm tra code hiện có.  
3\. Xác định nguyên nhân hoặc chức năng còn thiếu.  
4\. Sửa hoặc bổ sung code.  
5\. Chạy test liên quan.  
6\. Kiểm tra regression.  
7\. Cập nhật bảng tiến độ.  
8\. Commit với thông điệp rõ ràng khi kiểm thử đạt.

Không tự động merge hoặc push lên \`main\`.

Duy trì:

\`docs/IMPLEMENTATION\_PROGRESS.md\`

Mỗi nhiệm vụ ghi:

\- Task ID.  
\- Requirement ID.  
\- File thay đổi.  
\- Công việc đã thực hiện.  
\- Kết quả test.  
\- Trạng thái.  
\- Vấn đề còn tồn tại.

Giảm thiểu đọc lại file không liên quan; sử dụng tài liệu theo module để kiểm soát context.

\#\# XI. TIÊU CHÍ CHẤP NHẬN

Chỉ được đánh dấu CinemaLUMI hoàn thành khi:

\- Các yêu cầu SRS đã được triển khai hoặc có ngoại lệ được xác nhận.

\- Customer, Staff, Admin hoạt động theo đúng quyền.  
\- Giao diện sử dụng dữ liệu thực.  
\- Không còn lỗi bảo mật nghiêm trọng đã biết.  
\- Không còn khả năng đặt trùng ghế trong các bài kiểm thử đồng thời.  
\- Thanh toán lặp không tạo vé lặp.  
\- Luồng hủy vé và bồi hoàn phù hợp SRS.  
\- Build production thành công.  
\- Các test bắt buộc đạt.  
\- Có thể khởi chạy theo tài liệu bàn giao.  
\- Không có secret thật bị commit mới.  
\- Không có dữ liệu thật bị xóa ngoài ý muốn.

Nếu chưa đạt, phải báo trạng thái PARTIAL hoặc BLOCKED, kèm bằng chứng và việc cần làm tiếp theo.

\#\# XII. BẮT ĐẦU NGAY

Bắt đầu bằng việc kiểm tra repository trong workspace, đối chiếu tài liệu và chạy baseline tests.

Sau đó tự tiếp tục từ lỗi nghiêm trọng nhất đến khi hoàn thành các chức năng trong phạm vi nhiệm vụ và khả năng của môi trường.

Không dừng sau việc lập roadmap.

Không yêu cầu tôi xác nhận những thao tác đọc file, phân tích, sửa code và chạy test an toàn thông thường.

Chỉ yêu cầu xác nhận khi thực sự cần lựa chọn nghiệp vụ chưa có căn cứ, cấp quyền bên ngoài, sử dụng secret, thay đổi dữ liệu có nguy cơ mất mát, tạo chi phí hoặc triển khai production.

Cuối cùng xuất báo cáo tiếng Việt gồm:

1\. Đã hoàn thành những gì.  
2\. File đã thay đổi.  
3\. Các lỗi đã sửa.  
4\. Test đã chạy và kết quả.  
5\. Những mục chưa hoàn thành và lý do.  
6\. Hướng dẫn chạy và kiểm tra hệ thống.

\*\*Ưu tiên tính chính xác, bảo mật, sự ổn định và việc đáp ứng yêu cầu nghiệp vụ hơn số lượng code hoặc vẻ ngoài của giao diện.\*\*  
