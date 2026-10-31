# Kế Hoạch Thiết Kế & Xuất Bản Sơ Đồ Lớp (Class Diagram) Hệ Thống LumiCinema

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thiết kế, sinh mã và xuất bản Sơ đồ Lớp Thực thể Nghiệp vụ (Domain Model Class Diagram) toàn diện cho hệ thống LumiCinema bằng PlantUML (`.puml`), kết xuất file ảnh vector SVG và PNG độ nét cao theo phong cách Academic Modern Clean (chuẩn học thuật IEEE, sạch đẹp, không màu mè), kèm tài liệu thuyết minh chi tiết và bộ câu hỏi vấn đáp.

**Architecture:** Rich Domain Model (Domain-Driven Design / OOP Analysis), bao gồm 12 Lớp thực thể cốt lõi, 1 Lớp cơ sở trừu tượng (`User`), 3 Lớp con chuyên biệt hóa (`Customer`, `Staff`, `Admin`), 10 Enums trạng thái được đóng gói thành Package riêng biệt, cùng các mối quan hệ Kế thừa (Generalization), Hợp thành (Composition), Kết tập (Aggregation) và Bội số (Multiplicity) chuẩn mực.

**Tech Stack:** PlantUML, Java SE 24, Graphviz Dot (bundled/embedded), Markdown, SVG, PNG.

**Spec:** `d:\cinema_project\Bao_Cao_Dong_Gop_Ca_Nhan_LumiCinema.md` (Mục 2.6 & Mục 3), `d:\cinema_project\SRS_He_Thong_Quan_Ly_Rap_Phim.md`, `d:\cinema_project\tech_spec.md`, `cinema-app\prisma\schema.prisma`.

## Global Constraints

- **Phong cách trực quan (Theme / Skinparam):** Academic Modern Clean — Nền trắng tinh khiết (`#FFFFFF`), viền đen/xám than thanh mảnh (`#1E293B`), header xám nhạt tinh tế (`#F1F5F9`), tắt shadow bóng đổ (`skinparam shadowing false`), font chữ `Segoe UI` / `Arial` sắc nét, tuyệt đối không dùng gradient hay màu mè sặc sỡ.
- **Chuẩn hiển thị OOP:** Thuộc tính private (`-`), phương thức public (`+`) kèm kiểu dữ liệu trả về và tham số rõ ràng; tuyệt đối không để lộ khóa ngoại quan hệ dạng số nguyên (`movieId`, `paymentId`) trên các thuộc tính mà phải mô hình hóa bằng đường kết nối OOP (`*--`, `o--`, `-->`).
- **Số lượng và Danh mục:** Duy nhất 1 Sơ đồ Tổng thể Toàn rạp (Single Master Diagram) gói gọn trọn vẹn 12 Lớp thực thể nghiệp vụ và 10 Enums (trong `package "Enums & Types"`).
- **Tổ chức thư mục:** Lưu trữ tại `PlantUML_Class_Diagram/` với các file `class_diagram_lumicinema.puml`, `class_diagram_lumicinema.png`, `class_diagram_lumicinema.svg` và `README.md`.
- **Khả năng kết xuất:** Lệnh kết xuất PlantUML phải chạy thành công không có lỗi cú pháp, sinh ra ảnh PNG độ nét cao (hỗ trợ in ấn/chèn báo cáo khổ lớn) và SVG vector không vỡ nét khi zoom.

## Review Focus

- Tính chính xác của quan hệ Kế thừa (`User ^-- Customer`, `User ^-- Staff`, `User ^-- Admin`) và tính đóng gói thuộc tính.
- Sự phân định ranh giới giữa Hợp thành (Composition `*--`: `Screening *-- Seat`, `Payment *-- OrderCombo`) và Kết tập (Aggregation `o--`: `Screening o-- Movie`, `Payment o-- Coupon`).
- Bội số liên kết ($1..1, 1..*, 0..1, 0..*$) phản ánh đúng các quy tắc nghiệp vụ (BR-01 đến BR-10).
- Độ đầy đủ của 10 Enums và tính tương thích với Prisma schema (`cinema-app/prisma/schema.prisma`).
- Chất lượng hiển thị trực quan (layout không bị đè chữ, các đường quan hệ không cắt chéo rối rắm, kích thước ảnh cân đối).

---

### Task 1: Thiết Kế File Mã Nguồn PlantUML Sơ Đồ Lớp Toàn Hệ Thống

**Files:**
- Create: `PlantUML_Class_Diagram/class_diagram_lumicinema.puml`

**Interfaces:**
- Consumes: Đặc tả 12 lớp từ `Bao_Cao_Dong_Gop_Ca_Nhan_LumiCinema.md` (Mục 3), Prisma Schema (`cinema-app/prisma/schema.prisma`), và các quy tắc nghiệp vụ BR-01..BR-10 từ SRS.
- Produces: Mã nguồn PlantUML hoàn chỉnh sẵn sàng cho trình biên dịch Java PlantUML kết xuất ra PNG và SVG.

- [ ] **Step 1: Khởi tạo thư mục `PlantUML_Class_Diagram/`**
Tạo thư mục `d:\cinema_project\PlantUML_Class_Diagram\` nếu chưa tồn tại.

- [ ] **Step 2: Viết mã nguồn PlantUML với cấu hình Academic Modern Clean**
File `PlantUML_Class_Diagram/class_diagram_lumicinema.puml`:
1. Thiết lập skinparam chuẩn học thuật:
   ```plantuml
   @startuml class_diagram_lumicinema
   skinparam shadowing false
   skinparam classAttributeIconSize 0
   skinparam backgroundColor #FFFFFF
   skinparam roundcorner 4
   skinparam linetype ortho
   skinparam defaultFontName "Segoe UI", Arial, sans-serif
   skinparam defaultFontSize 12
   skinparam class {
       BackgroundColor #FFFFFF
       ArrowColor #1E293B
       BorderColor #1E293B
       HeaderBackgroundColor #F1F5F9
   }
   skinparam package {
       BackgroundColor #FAFAFA
       BorderColor #94A3B8
       FontColor #334155
   }
   ```
2. Khai báo 1 Lớp cơ sở trừu tượng (`abstract class User`) và 3 Lớp con chuyên biệt hóa (`Customer`, `Staff`, `Admin`) kèm phương thức đặc thù bóc tách từ 38 Sequence Diagrams.
3. Khai báo các Lớp thực thể:
   - `Movie`: Danh mục phim, điểm đánh giá trung bình.
   - `Screening`: Lịch chiếu, phòng chiếu, kiểm tra xung đột thời gian (`BR-09`).
   - `Seat`: Ghế ngồi, trạng thái động, giữ ghế tạm thời 10 phút (`BR-01`).
   - `Pricing`: Bảng giá vé Người lớn/Trẻ em/VIP/Đôi (`BR-02`).
   - `Ticket`: Vé điện tử, mã QR và chữ ký xác thực, check-in, hủy vé bồi hoàn (`BR-03`, `BR-04`).
   - `Combo`: Bắp nước, tồn kho, trừ kho ACID.
   - `OrderCombo`: Chi tiết bắp nước trong đơn, trạng thái bàn giao và chặn nhận trùng (`BR-05`).
   - `Payment`: Hóa đơn hợp nhất, phương thức VNPay HMAC-SHA512 (`BR-08`), bóc tách doanh thu và hoàn tiền (`BR-10`).
   - `Coupon`: Mã giảm giá / Voucher bồi hoàn COMP50 (`BR-03`, `BR-07`).
   - `Review`: Đánh giá & bình luận phim (`BR-06`).
   - `ComboReservation`: Giữ chỗ bắp nước tạm thời theo phiên.
4. Đóng gói 10 Enums vào `package "Enums & Types"`: `Role`, `MovieStatus`, `ScreeningStatus`, `SeatType`, `SeatStatus`, `TicketStatus`, `ComboStatus`, `PaymentMethod`, `PaymentStatus`, `DiscountType`.
5. Thiết lập đầy đủ các mối quan hệ hướng đối tượng:
   - Kế thừa: `User <|-- Customer`, `User <|-- Staff`, `User <|-- Admin`
   - Hợp thành (Composition): `Screening "1" *-- "50" Seat`, `Payment "1" *-- "0..*" OrderCombo`
   - Kết tập (Aggregation / Association):
     - `Screening "0..*" o-- "1" Movie`
     - `Ticket "0..*" o-- "1" Screening`
     - `Ticket "1" o-- "1" Seat`
     - `Ticket "0..*" o-- "1" User`
     - `Ticket "0..*" o-- "1" Payment`
     - `OrderCombo "0..*" o-- "1" Combo`
     - `Payment "0..*" o-- "0..1" Coupon`
     - `Review "0..*" o-- "1" Movie`
     - `Review "0..*" o-- "1" User`
     - `Screening "0..*" ..> "1" Pricing : tham chiếu tỷ lệ giá`

- [ ] **Step 3: Kiểm tra tính đúng đắn của cú pháp PlantUML**
Run: `java -jar d:\cinema_project\plantuml.jar -syntax PlantUML_Class_Diagram/class_diagram_lumicinema.puml`
Expected: Syntax OK, không có lỗi phân tích cú pháp.

---

### Task 2: Kết Xuất Sơ Đồ Sang Định Dạng Vector SVG Và Ảnh Độ Phân Giải Cao PNG

**Files:**
- Create: `PlantUML_Class_Diagram/class_diagram_lumicinema.png`
- Create: `PlantUML_Class_Diagram/class_diagram_lumicinema.svg`

**Interfaces:**
- Consumes: File `PlantUML_Class_Diagram/class_diagram_lumicinema.puml`
- Produces: 2 file đồ họa sẵn sàng chèn vào báo cáo Word hoặc trình chiếu Slide.

- [ ] **Step 1: Kết xuất ảnh vector SVG**
Lệnh:
```bash
java -jar d:\cinema_project\plantuml.jar -tsvg PlantUML_Class_Diagram/class_diagram_lumicinema.puml
```
Expected: Sinh file `PlantUML_Class_Diagram/class_diagram_lumicinema.svg` sắc nét không vỡ hạt khi phóng to thu nhỏ.

- [ ] **Step 2: Kết xuất ảnh bitmap PNG độ phân giải cao**
Cấu hình `-DPLANTUML_LIMIT_SIZE=16384` để đảm bảo PlantUML không bị giới hạn kích thước pixel khi kết xuất sơ đồ lớn:
```bash
java -DPLANTUML_LIMIT_SIZE=16384 -jar d:\cinema_project\plantuml.jar -tpng PlantUML_Class_Diagram/class_diagram_lumicinema.puml
```
Expected: Sinh file `PlantUML_Class_Diagram/class_diagram_lumicinema.png` rõ ràng, từng chữ và đường mũi tên hiển thị sắc nét.

- [ ] **Step 3: Kiểm tra kích thước và tính toàn vẹn của các file kết xuất**
Xác nhận cả 2 file `.png` và `.svg` đều tồn tại và có dung lượng hợp lệ (> 10 KB).

---

### Task 3: Biên Soạn Tài Liệu Thuyết Minh Chi Tiết Và Bộ Câu Hỏi Vấn Đáp

**Files:**
- Create: `PlantUML_Class_Diagram/README.md`

**Interfaces:**
- Consumes: Toàn bộ kiến trúc sơ đồ lớp, mối quan hệ thực thể, đối sánh CSDL và các quy tắc nghiệp vụ.
- Produces: Tài liệu thuyết minh hoàn chỉnh phục vụ báo cáo đồ án và luyện thi vấn đáp.

- [ ] **Step 1: Soạn thảo phần Tổng quan Kiến trúc Sơ đồ Lớp**
Trình bày mục đích, triết lý thiết kế Rich Domain Model, giải thích tại sao sử dụng mô hình này thay vì Anemic Domain Model.

- [ ] **Step 2: Đặc tả chi tiết 12 Lớp Thực thể và 10 Enums**
Liệt kê chi tiết từng thuộc tính, kiểu dữ liệu, phạm vi truy cập (`private`), và ý nghĩa của từng phương thức nghiệp vụ (`public`) được trích xuất từ 38 Sequence Diagrams.

- [ ] **Step 3: Phân tích sâu các mối quan hệ Hướng đối tượng**
Giải thích cặn kẽ vì sao dùng Composition giữa `Screening` - `Seat` và `Payment` - `OrderCombo` (vòng đời phụ thuộc tuyệt đối); vì sao dùng Aggregation giữa `Screening` - `Movie` và `Payment` - `Coupon` (thực thể độc lập).

- [ ] **Step 4: Bộ 10 Câu Hỏi Vấn Đáp Trọng Tâm Về Sơ Đồ Lớp (Q&A Defense)**
Tổng hợp 10 câu hỏi giảng viên hay chất vấn nhất khi bảo vệ Class Diagram (về Impedance Mismatch, Race condition giữ ghế, Single Table Inheritance của User, tính toán giá vé động, xử lý giao dịch ACID).

---

### Task 4: Đồng Bộ Hóa Tài Liệu Dự Án & Commit Toàn Bộ Kết Quả Vào Git

**Files:**
- Modify: `d:\cinema_project\Bao_Cao_Dong_Gop_Ca_Nhan_LumiCinema.md`
- Commit: Thư mục `PlantUML_Class_Diagram/` và file tài liệu cập nhật

**Interfaces:**
- Consumes: Toàn bộ kết quả từ Task 1, 2, 3
- Produces: Git commit sạch sẽ trên nhánh `main`, sẵn sàng nộp bài.

- [ ] **Step 1: Cập nhật liên kết file và hình ảnh trong `Bao_Cao_Dong_Gop_Ca_Nhan_LumiCinema.md`**
Đảm bảo mục 2.6 và mục 3 trong báo cáo đóng góp cá nhân trỏ tới đường dẫn file `.puml`, `.png`, `.svg` vừa tạo.

- [ ] **Step 2: Kiểm tra trạng thái Git**
Chạy `git status` xác nhận các file mới trong `PlantUML_Class_Diagram/` và file markdown cập nhật.

- [ ] **Step 3: Commit toàn bộ sản phẩm Class Diagram**
```bash
git add PlantUML_Class_Diagram/ Bao_Cao_Dong_Gop_Ca_Nhan_LumiCinema.md docs/superpowers/plans/
git commit -m "feat(uml): deliver comprehensive academic class diagram with puml, svg, png and defense guide"
```
Expected: Commit thành công, cây làm việc sạch sẽ.
