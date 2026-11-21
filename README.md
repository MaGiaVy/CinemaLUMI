# 🎬 Lumi Cinema — Hệ Thống Đặt Vé & Quản Lý Rạp Chiếu Phim (OOAD)

Dự án Phân tích & Thiết kế Hướng đối tượng (**OOAD**) xây dựng hệ thống Đặt vé trực tuyến, Bán vé tại quầy (POS) và Quản trị rạp chiếu phim **Lumi Cinema**.

---

## 📂 Cấu Trúc Thư Mục Dự Án

Kho lưu trữ được tổ chức thành **3 phân khu rõ ràng** để dễ dàng tra cứu mã nguồn, báo cáo và hệ thống sơ đồ UML:

```text
CinemaLUMI/
├── cinema-app/                        # 💻 1. MÃ NGUỒN ỨNG DỤNG FULL-STACK (Next.js 16 + Prisma + PostgreSQL)
├── Bao_Cao_Va_Tai_Lieu/               # 📄 2. BÁO CÁO ĐỒ ÁN, ĐẶC TẢ SRS & CÂU HỎI BẢO VỆ
│   ├── 01_Bao_Cao_Phan_Tich_Thiet_Ke_LumiCinema_Nhom10.docx
│   ├── 02_Dac_Ta_Yeu_Cau_Phan_Mem_SRS.md
│   ├── 03_Tong_Hop_So_Do_UML_LumiCinema.docx
│   ├── 04_Bao_Cao_Ra_Soat_63_So_Do_UML.md
│   ├── 05_Bao_Cao_Tien_Do_LumiCinema.docx
│   ├── 06_Bao_Cao_Kiem_Toan_Tuan_Thu_SRS.md
│   ├── 07_100_Cau_Hoi_Bao_Ve_SRS_Va_So_Do.md
│   ├── 08_100_Cau_Hoi_Nghiep_Vu_Giang_Vien.md
│   ├── 09_Bao_Cao_Dong_Gop_Ca_Nhan.md
│   ├── 10_Thiet_Ke_Giao_Dien_Design_System.md
│   ├── 11_Kien_Truc_Ky_Thuat_Tech_Spec.md
│   ├── 12_Quy_Chuan_Lap_Trinh_Best_Practices.md
│   └── Bao_Cao_LaTeX_Overleaf/        # Bản mã nguồn LaTeX biên dịch trực tiếp trên Overleaf
└── So_Do_UML_Va_CSDL/                 # 📊 3. HỆ THỐNG SƠ ĐỒ UML, CSDL (ERD/RDM) & ẢNH GIAO DIỆN
    ├── 01_UseCase_Diagrams/           # 10 Sơ đồ Use Case (.puml, .png, .svg, .drawio)
    ├── 02_Activity_Diagrams/          # 17 Sơ đồ Hoạt động - Activity (2 Swimlane chuẩn)
    ├── 03_Sequence_Diagrams/          # 38 Sơ đồ Tuần tự - Sequence (.puml, .png, .svg)
    ├── 04_State_Diagrams/             # 06 Sơ đồ Trạng thái - State Machine (.puml, .png, .svg)
    ├── 05_Class_Diagram/              # 01 Sơ đồ Lớp tổng thể - Class Diagram (.puml, .png, .svg)
    ├── 06_Database_ERD_RDM/           # 02 Sơ đồ Cơ sở dữ liệu ERD & RDM (.puml, .png, .svg, .docx)
    └── 07_Giao_Dien_He_Thong_UI/      # 13 Ảnh chụp màn hình giao diện thực tế (1440x900)
```

👉 **Truy cập nhanh:**
- 📖 [Danh mục Báo cáo & Tài liệu chi tiết](./Bao_Cao_Va_Tai_Lieu/README.md)
- 📐 [Danh mục Toàn bộ Sơ đồ UML & CSDL](./So_Do_UML_Va_CSDL/README.md)
- 💻 [Hướng dẫn cài đặt & phát triển `cinema-app`](./cinema-app/README.md)

---

## 🚀 Cách Chạy Nhanh Ứng Dụng (Docker Compose)

```bash
# Khởi động trọn bộ PostgreSQL + Adminer + Web App Next.js
docker compose up -d
```

Sau khi khởi động:
- 🌐 **Web Ứng Dụng Lumi Cinema:** [http://localhost:3000](http://localhost:3000)
- 🗄️ **Quản trị CSDL (Adminer):** [http://localhost:8080](http://localhost:8080)
  - Hệ quản trị: `PostgreSQL` | Máy chủ: `postgres` (hoặc `localhost:5434`)
  - Tài khoản: `postgres` | Mật khẩu: `postgrespassword` | CSDL: `lumicinema`

---

## 🔑 Tài Khoản Mẫu Trải Nghiệm (Demo Accounts)

| Phân quyền | Email đăng nhập | Mật khẩu | Trang chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@lumi.vn` | `123456` | `/admin/dashboard`, `/admin/movies`, `/admin/screenings`, `/admin/pricing` |
| **Nhân viên (STAFF)** | `staff@lumi.vn` | `123456` | `/staff`, `/staff/pos` (Bán vé tại quầy), `/staff/lookup` (Soát vé QR) |
| **Khách hàng (CUSTOMER)** | `khachhang@lumi.vn` | `123456` | `/`, `/movies/[id]`, `/tickets` |
