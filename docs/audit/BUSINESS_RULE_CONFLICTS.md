# BÁO CÁO XỬ LÝ MÂU THUẪN QUY TẮC NGHIỆP VỤ (BUSINESS RULE CONFLICTS) - CINEMALUMI

> Thời điểm lập: 2026-10-16
> Nguyên tắc chỉ đạo: "Dùng SRS đã phê duyệt làm nguồn yêu cầu chính. Khi khảo sát, UML, kế hoạch và code mâu thuẫn, ghi nhận sai lệch trước khi sửa. Với những quy tắc chưa rõ, không tự quyết định thay đổi có ảnh hưởng nghiệp vụ."

---

## 1. BẢNG TỔNG HỢP CÁC ĐIỂM SAI LỆCH VÀ QUYẾT ĐỊNH XỬ LÝ

| STT | Quy tắc nghiệp vụ | Tài liệu khảo sát / Kế hoạch | Tài liệu SRS đã phê duyệt | Hiện trạng Code | Quyết định xử lý theo SRS & Thống nhất |
|---|---|---|---|---|---|
| **BR-01** | **Thời hạn giữ ghế tạm thời** | Khảo sát ghi: **5 phút** | SRS mô tả: **10 phút** | Code đang dùng: **10 phút** (`HOLD_MINUTES = 10`) | **Ưu tiên SRS: 10 phút**. Giữ cấu hình mặc định là 10 phút, đồng bộ hiển thị CountdownTimer trên UI là 10 phút (600 giây). |
| **BR-02** | **Cơ cấu loại ghế trong phòng** | 5 phòng chiếu, 50 ghế/phòng | 50 ghế Standard/phòng | Schema có Standard, VIP, Couple; Pricing có hệ số giá | **Giữ tương thích**: Mỗi phòng gồm 50 ghế (A1 - E10). Mặc định là ghế STANDARD. Hệ thống Pricing vẫn hỗ trợ tính giá theo loại vé (Thường 100%, Trẻ em 50%, VIP 120%, Ghế đôi 180%) theo đúng tài liệu Pricing. |
| **BR-03** | **Khách hàng tự hủy vé** | Hủy trước giờ chiếu | Trước suất chiếu ít nhất **2 giờ**, cấp **Voucher hoàn 50%**, không hoàn tiền mặt | Đã hiện thực trong `api/tickets/[id]/cancel/route.ts` | **Tuân thủ nghiêm ngặt SRS**: Kiểm tra `startTime - now >= 2 hours`, giải phóng ghế, tạo mã voucher 50% hạn dùng 30 ngày cho đúng tài khoản người mua. |
| **BR-04** | **Hủy vé do sự cố rạp chiếu** | Nhân viên hủy tại quầy | Đối soát hoàn **100% tiền mặt** hoặc cấp Voucher 100% | `api/staff/tickets/[id]/cancel-with-voucher` tạo voucher 100% | **Bổ sung tùy chọn**: Hỗ trợ ghi nhận cả 2 hình thức: Cấp Voucher đền bù 100% hoặc ghi nhận Đối soát hoàn tiền mặt 100% tại quầy cho khách hàng theo biên bản sự cố. |
| **BR-05** | **Số lượng Voucher trên đơn hàng** | 1 voucher | Tối đa **1 voucher** cho 1 đơn hàng thanh toán | `api/payments/initiate` chỉ nhận 1 trường `coupon_code` | **Giữ nguyên**: Chặn không cho gộp nhiều mã voucher trong một đơn hàng. |
| **BR-06** | **Khoảng cách giữa các suất chiếu cùng phòng** | Không nêu chi tiết | Phải có thời gian dọn dẹp vệ sinh phòng chiếu (Cleaning Time) | Code chỉ kiểm tra `startTime` và `endTime` không bị đè nhau (`overlap`) | **Bổ sung quy tắc**: Khi Admin thêm suất chiếu mới, thời điểm bắt đầu phải cách thời điểm kết thúc của suất trước trong cùng phòng tối thiểu **15 phút**. |
| **BR-07** | **Điều kiện đánh giá & bình luận phim** | Ai cũng có thể đánh giá | Khách hàng phải có tài khoản và đã có vé trạng thái **USED** của bộ phim đó | `api/reviews/route.ts` đã kiểm tra vé USED | **Giữ nguyên**: Chặn khách chưa xem phim viết đánh giá giả mạo. |

---

## 2. CHI TIẾT CÁC QUY TẮC CẦN LƯU Ý KHI TRIỂN KHAI

### 2.1 Quy tắc giữ ghế & đếm ngược (BR-01)
- Khi khách hàng chọn ghế và nhấn "Tiếp tục" tại trang sơ đồ ghế:
  - Hệ thống ghi nhận `status = RESERVED` và `reservedUntil = NOW + 10 phút`.
  - Frontend hiển thị `CountdownTimer` 10:00.
  - Khi hết 10 phút, nếu chưa thanh toán thành công, ghế tự động chuyển về trạng thái `EMPTY` thông qua cơ chế Lazy Evaluation hoặc Cron Job.

### 2.2 Quy tắc dọn dẹp phòng chiếu (BR-06)
- Một phòng chiếu từ 1 đến 5 không thể có 2 suất chiếu sát nhau mà không có thời gian dọn rác và vệ sinh màn chiếu.
- Công thức kiểm tra hợp lệ:
  `NewScreening.StartTime >= ExistingScreening.EndTime + 15 phút` HOẶC
  `NewScreening.EndTime + 15 phút <= ExistingScreening.StartTime`.

### 2.3 Quy tắc hoàn vé sự cố phòng chiếu (BR-04)
- Khi rạp gặp sự cố mất điện, lỗi máy chiếu, cháy nổ hoặc thiên tai:
  - Nhân viên hoặc Quản trị viên thực hiện hủy toàn bộ suất chiếu hoặc hủy từng vé tại quầy.
  - Khách hàng được hoàn trả 100% giá trị vé:
    - Nếu khách muốn nhận tiền mặt tại quầy: Hệ thống ghi nhận trạng thái thanh toán là `REFUNDED` (hoàn tiền mặt).
    - Nếu khách muốn nhận voucher xem phim lần sau: Hệ thống sinh mã Voucher 100% có thời hạn 90 ngày.
