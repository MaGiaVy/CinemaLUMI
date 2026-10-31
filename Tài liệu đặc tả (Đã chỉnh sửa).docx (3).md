# **Tài Liệu Đặc Tả Nghiệp Vụ Hệ Thống Quản Lý Rạp Phim**

# **Problem Statement**

Một nhóm sinh viên muốn startup 1 rạp phim nhỏ nên tạo nên hệ thống quản lý bán vé xem phim nhằm phục vụ cho các khách hàng được xem phim và đặt vé theo hai hình thức. Ngoài bán vé ra còn có bán bắp nước. Hệ thống được xây dựng cho một rạp phim duy nhất gồm 5 phòng chiếu, mỗi phòng có 50 ghế cùng loại (tổng 250 ghế). Một phòng 50 ghế được đánh số hàng dọc từ A đến E, hàng ngang từ 1 đến 10, hai kênh bán vé (online, tại quầy). Ba nhóm người dùng chính gồm: Khách hàng (mua vé online), Nhân viên quầy (hỗ trợ bán vé tại rạp và hỗ trợ voucher), và Admin (quản lý toàn bộ hệ thống). Chức năng: đặt vé và combo, hủy vé, hoàn tiền/voucher, soát vé, quản lý phim, suất chiếu, giá, combo, voucher, báo cáo doanh thu.

# **Luồng Đăng Ký / Đăng Nhập**

Người dùng mới cần đăng ký tài khoản bằng email (phải hợp lệ và chưa tồn tại trong hệ thống), mật khẩu tối thiểu 6 ký tự, họ tên và số điện thoại. Người dùng đã có tài khoản đăng nhập bằng email và mật khẩu — hệ thống xác thực và chuyển hướng đến giao diện phù hợp với vai trò (Khách hàng / Nhân viên / Admin). Hệ thống hỗ trợ phân quyền theo ba nhóm người dùng, mỗi nhóm chỉ truy cập được các chức năng tương ứng với vai trò của mình. Tài khoản Nhân viên và Admin được khởi tạo sẵn trong dữ liệu ban đầu. Chức năng đăng ký chỉ dành cho Khách hàng. Khi đăng xuất, hệ thống kết thúc phiên đăng nhập hiện tại. Các chức năng có phân quyền yêu cầu người dùng đã đăng nhập đúng vai trò.

# **Luồng Đánh Giá Phim (Customer)**

Khách chỉ được phép đánh giá (đưa ra rating từ 1-5 sao và bình luận) bộ phim sau khi tạo tài khoản và đăng nhập. Mỗi khách hàng chỉ được đánh giá một bộ phim 1 lần, nếu đã đánh giá thì khách có thể chỉnh sửa nội dung đánh giá và số sao trước đó. Hệ thống lưu đánh giá và hiển thị rating trung bình của phim cho tất cả người dùng khi xem danh sách phim. Khách không bắt buộc đã mua vé hoặc đã xem phim mới được đánh giá.

# **Luồng Mua Vé (Customer)**

*(Lưu ý nghiệp vụ: Hệ thống không hỗ trợ mua vé online cho khách vãng lai. Mọi giao dịch trực tuyến yêu cầu tài khoản định danh nhằm phục vụ công tác quản trị rủi ro* (chống spam ghế), đối soát kế toán và xây dựng dữ liệu chăm sóc khách hàng.)

Khách hàng bắt đầu bằng việc đăng nhập. Khách xem danh sách phim đang chiếu kèm lịch suất chiếu, có thể lọc theo ngày hoặc thể loại. Tiếp theo, hệ thống sẽ hiển thị sơ đồ phòng chiếu để khách chọn ghế trống — ghế được giữ chỗ tạm thời trong 10 phút, nếu không thanh toán kịp sẽ tự động hủy ghế. Khách phân loại vé theo độ tuổi (Thường 100%, Trẻ em 50% so với giá cơ bản). Vé Trẻ em chỉ được áp dụng cho khách dưới độ tuổi quy định của rạp và phải phù hợp với Nhãn độ tuổi của phim. Khách có thể nhập mã khuyến mãi nếu có. Cuối cùng, khách được chuyển hướng sang cổng thanh toán online (VNPay, Momo). Sau khi giao dịch thành công, hệ thống lưu thông tin đơn hàng, các vé thuộc đơn hàng và tự động gửi xác nhận qua Email hoặc SMS.

Một đơn hàng có thể gồm nhiều vé và nhiều combo. Mỗi vé tương ứng với một ghế cụ thể trong một suất chiếu. Khách có thể yêu cầu hủy từng vé trong đơn nếu vé đó đáp ứng điều kiện hủy, không bắt buộc phải hủy toàn bộ đơn hàng.

# **Luồng Hủy Vé (Customer)**

Khách hàng truy cập danh sách vé đã mua online và có thể yêu cầu hủy từng vé nếu vé chưa qua sử dụng và thời điểm hủy cách giờ chiếu ít nhất 2 tiếng. Quy định hủy trước giờ chiếu ít nhất 2 tiếng chỉ áp dụng đối với trường hợp khách hàng chủ động yêu cầu hủy vé.

Vé hủy theo yêu cầu chủ động của khách không được hoàn tiền; thay vào đó, hệ thống tự động tạo một mã voucher giảm giá 50% cho mỗi vé hủy thành công, áp dụng tối đa cho một vé trong lần mua sau. Sau khi khách xác nhận và hệ thống kiểm tra đủ điều kiện, hệ thống chuyển trạng thái vé sang "đã hủy", giải phóng chỗ ngồi và lưu voucher vào tài khoản.

Nếu đơn hàng có nhiều vé thì các vé còn lại trong đơn vẫn giữ nguyên trạng thái và tiếp tục có hiệu lực. Việc hủy từng vé không tự động hủy các combo trong đơn; combo được theo dõi và giao nhận độc lập với trạng thái vé.

# **Luồng Bán Vé Tại Quầy (Nhân viên)**

Khách mua trực tiếp tại rạp thì nhân viên tạo đơn cho khách: chọn suất chiếu, chọn ghế trống theo yêu cầu, chọn loại vé từng ghế, thêm combo và nhập voucher nếu khách có. Khách có tài khoản thì nhân viên tìm bằng SĐT/email để gắn vào tài khoản; khách vãng lai không cần tài khoản. Nhân viên thu tiền (tiền mặt, chuyển khoản/QR) và xác nhận đã thu; hệ thống chuyển ghế sang đã bán, in vé kèm mã vé và ghi nhận nhân viên bán.

# **Luồng Soát Vé và Nhận Combo (Nhân viên)**

Khi khách đến xem phim, nhân viên nhập hoặc quét mã vé. Nếu vé còn hiệu lực, đúng suất chiếu và trong thời gian cho phép (từ 30 phút trước giờ chiếu đến hết suất), hệ thống chuyển trạng thái sang "đã sử dụng". Vé đã sử dụng không được soát lần hai và không thể hủy/hoàn. Khách đặt combo online xuất trình mã đơn tại quầy để nhận combo; combo mua trực tiếp tại quầy được giao ngay. Việc nhận combo là nghiệp vụ riêng, không phụ thuộc vào thao tác soát vé. Hệ thống chỉ cho phép xác nhận giao phần combo chưa nhận, tránh giao trùng.

# **Luồng Hủy Vé Và Hoàn Tiền (Nhân Viên / Admin)**

Nhân viên hoặc Admin tra cứu và hủy vé cho khách tại quầy. Đối với trường hợp khách hàng chủ động yêu cầu hủy hoặc hủy do lỗi của khách, bắt buộc thời điểm hủy phải cách giờ chiếu ít nhất 2 tiếng (áp dụng chung cho cả online và tại quầy để tránh rủi ro quản lý). Nhân viên hoặc Admin tra cứu theo mã vé hoặc mã đơn; thông tin SĐT/email chỉ dùng bổ sung khi có. Vé phải chưa sử dụng và chưa được xử lý hủy, hoàn tiền hoặc cấp voucher bồi hoàn trước đó.

Khi hủy, nhân viên bắt buộc chọn lý do:

● Lỗi của khách: khách nhận voucher giảm giá 50% cho lần sau, không hoàn tiền. Nếu khách có tài khoản thì voucher được lưu vào tài khoản. Nếu khách vãng lai mua tại quầy thì hệ thống tạo mã voucher riêng, nhân viên in mã voucher trên phiếu hoặc gửi mã cho khách qua số điện thoại đã cung cấp. Voucher chỉ được sử dụng 1 lần.

● Lỗi của rạp (mất điện, lỗi máy chiếu, sự cố phòng chiếu...): Nhân viên hoặc Admin được hủy từng vé chưa sử dụng do lỗi rạp; quyền hủy toàn bộ suất chiếu thuộc Admin. Không áp dụng điều kiện phải trước giờ chiếu ít nhất 2 tiếng. Khách được hoàn 100% số tiền thực trả của vé sau giảm giá, không cấp voucher bồi hoàn. Khách mua tại quầy được hoàn ngay; khách đặt online đến rạp xuất trình mã vé trong vòng 30 ngày kể từ khi thông báo hủy vé. Khách đặt online không đến rạp trong thời hạn này thì không được hoàn. Đây là quy trình xử lý thủ công cho Phase 1: hệ thống ghi nhận vé "chờ hoàn tiền" khi hủy do lỗi rạp, và chỉ ghi nhận "đã hoàn tiền" sau khi Nhân viên hoặc Admin xác nhận đã trả tiền mặt. Hệ thống lưu log làm chứng từ đối soát cho kế toán xuất quỹ tiền mặt trả khách. Quy định vé đã sử dụng không được hủy/hoàn vẫn áp dụng, kể cả khi có sự cố của rạp.

Mỗi vé được xử lý hủy độc lập. Một đơn hàng có nhiều vé có thể chỉ hủy một hoặc một số vé mà không ảnh hưởng đến các vé còn lại nếu các vé đó vẫn hợp lệ.

Mọi thao tác xử lý hủy vé đều ghi lại log kèm người thực hiện (Khách hàng, Nhân viên hoặc Admin), lý do hủy và cách xử lý. Một vé chỉ được hủy và nhận một hình thức xử lý bồi hoàn: cấp voucher do lỗi khách hoặc hoàn tiền do lỗi rạp. Việc ghi nhận khoản chờ hoàn và xác nhận đã trả tiền là hai bước của cùng một lần xử lý; không được trả tiền hai lần.

# **Luồng Voucher**

Hệ thống có hai loại voucher: (1) voucher khuyến mãi do Admin tạo, dùng chung cho mọi khách; (2) voucher bồi hoàn giảm 50% do hệ thống tự cấp khi hủy vé vì lỗi của khách. Voucher bồi hoàn chỉ dùng 1 lần, có hạn 30 ngày. Mỗi vé hủy do lỗi khách được cấp một voucher; mỗi voucher giảm 50% giá sau hệ số loại vé của tối đa một vé trong lần mua sau. Khi đơn có nhiều vé, khách hoặc nhân viên chọn vé được áp dụng voucher. Các vé còn lại và combo không được giảm bởi voucher bồi hoàn đó.

Khách có tài khoản sẽ nhận voucher bồi hoàn thông qua thông báo trong tài khoản. Đối với khách vãng lai mua vé tại quầy, hệ thống tạo một mã voucher riêng và nhân viên có thể in mã voucher hoặc gửi mã qua số điện thoại khách cung cấp.

Khi mua vé (online hoặc tại quầy), khách hoặc nhân viên nhập mã. Hệ thống kiểm tra: còn trong khoảng ngày hiệu lực, còn lượt dùng, tiền vé đạt mức tối thiểu, đúng phim áp dụng (để trống \= mọi phim). Hợp lệ thì trừ giảm giá; không hợp lệ thì báo lý do và giữ nguyên đơn. Mỗi đơn chỉ dùng 1 voucher, giảm giá chỉ tính trên tiền vé, không tính combo. Thứ tự tính: giá cơ bản × hệ số loại vé → trừ voucher → cộng tiền combo. Voucher kiểu % có thể kèm mức giảm tối đa. Đối với voucher giảm trên nhiều vé, số tiền giảm được phân bổ theo tỷ lệ giá vé sau hệ số loại vé của từng vé; tổng phần giảm phân bổ phải đúng bằng mức giảm của đơn. Hệ thống lưu giá gốc, tiền giảm và tiền thực trả của từng vé tại thời điểm mua để làm căn cứ hoàn tiền khi hủy một phần đơn. Voucher bồi hoàn áp dụng cho một vé thì toàn bộ tiền giảm được ghi nhận cho vé đó.

Nếu thanh toán online thất bại hoặc hết hạn 10 phút giữ ghế, hệ thống tự động hoàn lại lượt dùng của voucher đó. Đơn dùng voucher thanh toán thành công mà sau đó bị hủy thì không hoàn lại lượt dùng.

# **Luồng Đặt Combo Online (Customer) & Tại quầy (Nhân viên)**

* Online: Sau khi chọn ghế/loại vé, hệ thống gợi ý combo (bắp \+ nước). Khách có thể thêm hoặc bỏ qua, hệ thống tính tổng (vé \+ combo) và thanh toán chung 1 lần. Không gợi ý combo nếu tồn kho bằng 0\.

* Tại quầy: Nhân viên có thể bán combo độc lập không cần kèm vé (phục vụ khách đã mua vé online từ trước nhưng muốn mua thêm nước/bắp tại rạp).

Combo đặt online có trạng thái để theo dõi việc giao combo cho khách. Sau khi thanh toán thành công, combo ở trạng thái "chưa nhận". Khi khách xuất trình mã đơn và nhân viên giao combo, hệ thống chuyển trạng thái sang "đã nhận". Combo đã được khách nhận thì không được cộng trở lại tồn kho khi vé hoặc suất chiếu bị hủy. Hủy một hoặc toàn bộ các vé không tự động chuyển combo sang trạng thái hủy; combo còn hiệu lực vẫn được nhận theo mã đơn. Trường hợp hủy toàn bộ đơn, phải xác định riêng phần combo bị hủy và cách xử lý tiền combo trước khi thực hiện; không suy ra tiền hoàn combo từ quy định hoàn 100% tiền vé.

# **Quản lý combo (Admin)**

Admin thêm, sửa, ngừng bán combo, thiết lập giá và cập nhật tồn kho. Tồn kho combo được giữ chỗ cùng lúc với giữ ghế (10 phút) khi khách chọn online, trừ hẳn khi thanh toán thành công, và hoàn lại phần giữ kho nếu khách không thanh toán. Nếu toàn bộ đơn được hủy và phần combo chưa giao cũng được xác nhận hủy, hệ thống hoàn lại kho đúng số lượng combo bị hủy. Chỉ hủy vé trong đơn không làm hoàn kho combo.

Nếu combo đã chuyển sang trạng thái "đã nhận" thì hệ thống không hoàn lại số lượng combo vào tồn kho.

# **Luồng Vận Hành (Admin)**

Quản lý phim: Admin có quyền thêm, sửa thông tin phim, bao gồm thiết lập Nhãn độ tuổi (ví dụ: T18, C13) để kiểm soát việc mua vé Trẻ em. Phim đã từng phát sinh suất chiếu hoặc vé không được xóa hoàn toàn khỏi hệ thống. Khi không còn sử dụng, Admin chuyển phim sang trạng thái "ngừng chiếu" để lưu lại dữ liệu lịch sử và phục vụ báo cáo.

Quản lý suất chiếu: Admin lên lịch các suất chiếu và phải đảm bảo các suất chiếu trong cùng một phòng không bị trùng thời gian. Thời gian của một suất chiếu được tính từ giờ bắt đầu đến giờ bắt đầu \+ thời lượng phim. Hai suất chiếu trong cùng một phòng không được có khoảng thời gian giao nhau. Khi tạo suất chiếu, hệ thống tự động khởi tạo 50 ghế trạng thái trống. Khi sửa suất chiếu, hệ thống cũng kiểm tra trùng thời gian. Không khởi tạo lại ghế hoặc làm mất liên kết vé đã bán khi sửa thông tin suất chiếu; việc đổi lịch ảnh hưởng đến vé đã bán cần được xử lý theo nghiệp vụ sự cố phù hợp.

Quản lý giá: Admin thiết lập giá vé cơ bản cho mỗi suất chiếu. Chức năng này thuộc nhóm Quản lý suất chiếu và giá vé. Giá đã ghi nhận trên vé đã thanh toán được giữ nguyên để phục vụ lịch sử và đối soát.

Quản lý voucher: Admin tạo, sửa, ngừng sử dụng và quản lý voucher.

Xử lý sự cố: Nếu có sự cố như mất điện, lỗi máy chiếu hoặc phòng chiếu không thể tiếp tục hoạt động, Admin có thể hủy toàn bộ suất chiếu mà không bị giới hạn bởi điều kiện hủy trước 2 tiếng. Hệ thống tự động: (1) chuyển suất chiếu sang trạng thái đã hủy và ngừng bán, (2) hủy các vé chưa sử dụng, (3) giải phóng trạng thái giữ/bán ghế của các vé được hủy nhưng không cho phép bán lại suất đã hủy, (4) ghi log và gửi thông báo sự cố, (5) ghi nhận khoản chờ hoàn 100% tiền vé thực trả để xử lý thủ công bằng tiền mặt. Khách online có 30 ngày kể từ thông báo để đến rạp nhận tiền hoàn. Vé đã sử dụng giữ nguyên lịch sử và không thuộc phạm vi hoàn tiền theo quy định của hệ thống. Combo được theo dõi riêng theo luồng giao nhận và quản lý combo.

Báo cáo: Admin có thể xem báo cáo doanh thu theo khoảng thời gian (ngày, tháng, năm), theo phim, suất chiếu và kênh bán vé (online hoặc tại quầy). Báo cáo bao gồm tổng doanh thu vé, doanh thu combo, số lượng vé đã bán, số vé đã hủy và số tiền đã hoàn cho khách. Có thể xuất báo cáo PDF/ Excel. Báo cáo phân biệt số tiền đã thu, khoản chờ hoàn và số tiền thực tế đã hoàn để tránh ghi giảm doanh thu nhiều lần cho cùng một vé.

# **Ràng Buộc Nghiệp Vụ Chính**

Một ghế trong một suất chiếu chỉ được bán cho một khách duy nhất. Ghế được giữ tạm 10 phút khi chọn online, trong thời gian giữ ghế người khác không được chọn hoặc mua ghế đó.

Bắt buộc hủy vé trước giờ chiếu ít nhất 2 tiếng đối với trường hợp khách chủ động yêu cầu hủy hoặc lỗi thuộc về khách. Quy định này không áp dụng đối với trường hợp suất chiếu bị hủy do lỗi hoặc sự cố của rạp.

Phim đã từng phát sinh dữ liệu giao dịch không được xóa hoàn toàn mà chỉ được chuyển sang trạng thái ngừng chiếu.

Khách chỉ có thể đánh giá phim khi đã đăng nhập vào web. Mỗi khách hàng chỉ được đánh giá một phim 1 lần nhưng có thể chỉnh sửa đánh giá.

Giao dịch trực tuyến bắt buộc phải thông qua tài khoản đăng ký.

Một vé chỉ được hoàn tiền hoặc xử lý đền bù một lần. Vé đã sử dụng không được hủy/hoàn. Hủy do lỗi khách cấp voucher 50%; hủy do lỗi rạp hoàn 100% tiền vé thực trả và không cấp voucher.

Một đơn hàng có thể chứa nhiều vé và nhiều combo. Mỗi vé có trạng thái riêng và có thể được hủy độc lập nếu đủ điều kiện. Hủy vé không tự động hủy combo; trạng thái vé, giao nhận combo và hoàn tiền được theo dõi riêng.

Hai suất chiếu sử dụng cùng một phòng không được có thời gian chiếu giao nhau.

Combo đã được giao cho khách không được hoàn lại vào tồn kho.

# **Yêu Cầu Phi Chức Năng**

Hiệu suất: Thời gian tải các trang thông thường không quá 3 giây trong điều kiện hệ thống hoạt động bình thường. Các thao tác kiểm tra ghế trống, giữ ghế và xác nhận đặt vé phải được xử lý nhanh để tránh ảnh hưởng đến quá trình mua vé.

Xử lý đồng thời: Hệ thống phải đảm bảo một ghế trong một suất chiếu không thể được giữ hoặc bán cho hai khách khác nhau cùng một thời điểm. Khi một khách đã giữ ghế thành công thì ghế đó phải tạm thời không khả dụng đối với các khách khác trong thời gian 10 phút.

Bảo mật: Mật khẩu người dùng không được lưu trực tiếp dưới dạng văn bản thông thường. Hệ thống phải thực hiện xác thực và phân quyền theo ba nhóm Khách hàng, Nhân viên và Admin. Người dùng không được phép truy cập các chức năng ngoài quyền hạn của mình.

Tính toàn vẹn dữ liệu: Hệ thống phải đảm bảo một giao dịch thanh toán thành công chỉ tạo vé một lần, tránh trường hợp cổng thanh toán gửi lại kết quả nhiều lần làm phát sinh vé trùng.

Ghi nhận lịch sử: Các thao tác quan trọng như hủy vé, hoàn tiền, hủy suất chiếu, tạo voucher bồi hoàn và thay đổi dữ liệu quan trọng phải được lưu log để phục vụ kiểm tra và đối soát.

Sao lưu dữ liệu: Dữ liệu tài khoản, đơn hàng, vé, thanh toán và các thông tin giao dịch quan trọng phải có khả năng sao lưu và phục hồi khi xảy ra lỗi hệ thống.

# **Phụ Thuộc Hệ Thống**

Hệ thống phụ thuộc vào cổng thanh toán bên thứ ba (VNPay, Momo) để xử lý thanh toán online. Hệ thống cũng phụ thuộc vào dịch vụ Email hoặc SMS để gửi thông tin xác nhận giao dịch và thông báo cho khách hàng. Trong trường hợp dịch vụ gửi thông báo gặp lỗi, giao dịch đã thanh toán thành công vẫn được ghi nhận bình thường và khách có thể xem thông tin vé trực tiếp trong tài khoản.