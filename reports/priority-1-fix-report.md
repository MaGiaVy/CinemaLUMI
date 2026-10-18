# CinemaLUMI – Priority 1

Các nhận định “chưa áp dụng migration” trong bản báo cáo cũ đã hết hiệu lực. Database Supabase **dev/test** của nhóm đã được sao lưu, đối chiếu và áp dụng migration; mã nguồn đang ở nhánh `fix/database-system-verification` (chưa commit, push hoặc merge). Kết quả, bằng chứng kiểm thử và các giới hạn còn lại được ghi tại [báo cáo kiểm chứng database và hệ thống](database-system-verification.md).

**Chưa thể kết luận mọi chức năng đều hoạt động tốt:** cổng VNPay/MoMo sandbox, gửi Email/SMS và một số ràng buộc SRS chưa được kiểm chứng hoặc hoàn thiện. Chỉ các luồng ghi rõ PASS trong báo cáo mới được xác nhận.
