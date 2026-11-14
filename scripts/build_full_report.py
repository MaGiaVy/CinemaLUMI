import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tblBorders.append(border)
    tblPr.append(tblBorders)

def add_heading(doc, text, level):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    p.paragraph_format.keep_with_next = True
    
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(16, 44, 87) # Deep Navy
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(8)
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(30, 60, 114) # Medium Navy
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
    elif level == 3:
        run.font.size = Pt(11.5)
        run.font.color.rgb = RGBColor(53, 92, 125) # Slate Navy
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
    return p

def add_image_with_caption(doc, image_path, caption_text, width_inches=6.0):
    if os.path.exists(image_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(image_path, width=Inches(width_inches))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        run_cap = p_cap.add_run(caption_text)
        run_cap.italic = True
        run_cap.font.size = Pt(9.5)
        run_cap.font.color.rgb = RGBColor(100, 100, 100)
    else:
        p_err = doc.add_paragraph(f"[Hình ảnh chưa tìm thấy: {image_path}]")
        p_err.runs[0].font.color.rgb = RGBColor(200, 0, 0)

def add_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)
    
    # Header
    hdr_cells = table.rows[0].cells
    for i, header_text in enumerate(headers):
        hdr_cells[i].text = header_text
        set_cell_background(hdr_cells[i], "1F3A60") # Dark Navy
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(255, 255, 255)
            
    # Rows
    for row_idx, row_data in enumerate(rows):
        row_cells = table.rows[row_idx + 1].cells
        bg_color = "F8F9FA" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = str(cell_value)
            set_cell_background(row_cells[col_idx], bg_color)
            p = row_cells[col_idx].paragraphs[0]
            if col_idx == 0 and len(str(cell_value)) <= 4:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.size = Pt(9.0)
                r.font.color.rgb = RGBColor(33, 37, 41)
                
    if col_widths and len(col_widths) == len(headers):
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)
                
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_after = Pt(6)
    return table

def add_p(doc, text="", bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.size = Pt(10.5)
    if text:
        r_txt = p.add_run(text)
        r_txt.font.size = Pt(10.5)
    return p

def main():
    doc = docx.Document()
    
    # Setup page margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # ----------------------------------------------------
    # TRANG BÌA
    # ----------------------------------------------------
    p_uni = doc.add_paragraph()
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_uni = p_uni.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG ĐẠI HỌC SÀI GÒN\nKHOA CÔNG NGHỆ THÔNG TIN")
    r_uni.bold = True
    r_uni.font.size = Pt(12)
    p_uni.paragraph_format.space_after = Pt(50)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_title.add_run("BÁO CÁO TIẾN ĐỘ ĐỒ ÁN MÔN HỌC\nPHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG THÔNG TIN\n\n")
    r_sub.font.size = Pt(14)
    r_sub.bold = True
    r_sub.font.color.rgb = RGBColor(53, 92, 125)

    r_main = p_title.add_run("HỆ THỐNG QUẢN LÝ VÀ ĐẶT VÉ RẠP CHIẾU PHIM\nLUMICINEMA")
    r_main.font.size = Pt(22)
    r_main.bold = True
    r_main.font.color.rgb = RGBColor(16, 44, 87)
    p_title.paragraph_format.space_after = Pt(60)

    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_desc = p_desc.add_run("TỔNG HỢP THIẾT KẾ CHI TIẾT:\nMÔ HÌNH DỮ LIỆU QUAN HỆ (RDM) — SƠ ĐỒ LỚP (CLASS DIAGRAM)\nSƠ ĐỒ TRẠNG THÁI (STATE DIAGRAMS) — THIẾT KẾ GIAO DIỆN (UI DESIGN)")
    r_desc.font.size = Pt(11)
    r_desc.italic = True
    p_desc.paragraph_format.space_after = Pt(120)

    p_info = doc.add_paragraph()
    p_info.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_info.paragraph_format.left_indent = Inches(1.5)
    p_info.paragraph_format.line_spacing = 1.3
    r_info = p_info.add_run(
        "Sinh viên thực hiện:\tMã Gia Vỹ\n"
        "Chuyên ngành:\t\tCông nghệ Thông tin / Kỹ thuật Phần mềm\n"
        "Đơn vị:\t\t\tTrường Đại học Sài Gòn (SGU)\n"
        "Năm học:\t\t2026 - 2027"
    )
    r_info.font.size = Pt(11)
    r_info.bold = True
    p_info.paragraph_format.space_after = Pt(80)

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_loc = p_loc.add_run("TP. HỒ CHÍ MINH — NĂM 2026")
    r_loc.font.size = Pt(11)
    r_loc.bold = True

    doc.add_page_break()

    # ----------------------------------------------------
    # PHẦN I: MÔ HÌNH DỮ LIỆU QUAN HỆ (RDM)
    # ----------------------------------------------------
    add_heading(doc, "PHẦN I: MÔ HÌNH DỮ LIỆU QUAN HỆ (RELATIONAL DATA MODEL – RDM)", level=1)
    
    add_p(doc, "Mô hình dữ liệu quan hệ (RDM – Relational Data Model) của Hệ thống Quản lý Rạp chiếu phim LumiCinema được chuẩn hóa đạt chuẩn Dạng chuẩn 3 (3NF). Toàn bộ hệ thống gồm 12 bảng thực thể và 16 mối quan hệ khóa ngoại (1 - N), đảm bảo tính toàn vẹn dữ liệu, triệt tiêu dư thừa và tối ưu hóa hiệu năng truy vấn cho các giao dịch đồng thời cao (concurrency) trong giờ cao điểm đặt vé.")

    add_heading(doc, "1. Quy ước Ký hiệu & Chuẩn hóa RDM", level=2)
    add_p(doc, "thuộc_tính (PK): Khóa chính (Primary Key) xác định duy nhất bản ghi trong bảng.", bold_prefix="• ")
    add_p(doc, "thuộc_tính in nghiêng (FK): Khóa ngoại (Foreign Key) liên kết tham chiếu đến khóa chính bảng khác.", bold_prefix="• ")
    add_p(doc, "NN (Not Null): Ràng buộc giá trị không được phép rỗng.", bold_prefix="• ")
    add_p(doc, "UQ (Unique): Ràng buộc giá trị đơn nhất trên toàn bảng.", bold_prefix="• ")

    add_heading(doc, "2. Lược đồ Quan hệ Trực quan (RDM Diagram)", level=2)
    add_p(doc, "Lược đồ thể hiện cấu trúc 12 bảng qua các khối ô thuộc tính liền kề và hệ thống mũi tên định hướng từ Khóa chính (PK) đến Khóa ngoại (FK) tương ứng.")
    
    add_image_with_caption(
        doc,
        r"D:\cinema_project\RDM_Diagrams\image1.png",
        "Hình 1.1: Lược đồ Mô hình Dữ liệu Quan hệ (RDM) Hệ thống Đặt vé Xem phim LumiCinema",
        width_inches=6.2
    )

    add_heading(doc, "3. Lược đồ Quan hệ Tổng quát (Relational Schema)", level=2)
    schemas = [
        "1. users (user_id, email, password, name, phone, role, created_at)",
        "2. movies (movie_id, title, duration, release_date, age_rating, poster, rating, genre, ticket_price, status)",
        "3. pricing (pricing_id, ticket_type, label, percentage, base_price)",
        "4. combos (combo_id, name, price, image, stock, status)",
        "5. screenings (screening_id, movie_id, room, room_number, start_time, end_time, date, price, status)",
        "6. seats (seat_id, screening_id, row, number, code, type, status, reserved_until)",
        "7. coupons (coupon_id, code, discount_type, discount_value, min_amount, max_usage, used_count, expiry_date, applicable_movie_id, user_id)",
        "8. reviews (review_id, user_id, movie_id, rating, comment, created_at)",
        "9. combo_reservations (reservation_id, combo_id, user_id, quantity, status, reserved_until)",
        "10. payments (payment_id, user_id, screening_id, amount, payment_method, transaction_code, status, created_at)",
        "11. tickets (ticket_id, user_id, screening_id, seat_id, payment_id, ticket_type, price, status, purchase_date)",
        "12. order_combos (order_combo_id, payment_id, combo_id, quantity, price, is_delivered)"
    ]
    for s in schemas:
        add_p(doc, s, space_after=3)

    add_heading(doc, "4. Từ điển Dữ liệu Chi tiết (Data Dictionary)", level=2)

    # Nhóm 1: Danh mục nền tảng
    add_heading(doc, "Nhóm 1: Danh mục Nền tảng (users, movies, pricing, combos)", level=3)
    
    add_p(doc, "Bảng users: Quản lý thông tin tài khoản người dùng và phân quyền RBAC (ADMIN, STAFF, CUSTOMER).", bold_prefix="1. Bảng users (Người dùng): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["user_id", "INT", "PK, Auto", "Mã định danh duy nhất của người dùng"],
            ["email", "VARCHAR(255)", "NN, UQ", "Địa chỉ email đăng nhập hệ thống"],
            ["password", "VARCHAR(255)", "NN", "Mật khẩu mã hóa Bcrypt an toàn"],
            ["name", "VARCHAR(100)", "NN", "Họ và tên đầy đủ của người dùng"],
            ["phone", "VARCHAR(20)", "—", "Số điện thoại liên hệ"],
            ["role", "VARCHAR(20)", "NN", "Vai trò: 'ADMIN', 'STAFF', 'CUSTOMER'"],
            ["created_at", "TIMESTAMP", "Default Now", "Thời điểm đăng ký tài khoản"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng movies: Quản lý danh mục phim, poster, thời lượng và trạng thái công chiếu.", bold_prefix="2. Bảng movies (Phim): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["movie_id", "INT", "PK, Auto", "Mã định danh duy nhất của phim"],
            ["title", "VARCHAR(255)", "NN", "Tên bộ phim công chiếu"],
            ["duration", "INT", "NN", "Thời lượng phim tính bằng phút (> 0)"],
            ["release_date", "DATE", "NN", "Ngày khởi chiếu chính thức"],
            ["age_rating", "VARCHAR(20)", "NN", "Phân loại độ tuổi: P, C13, C16, C18"],
            ["poster", "VARCHAR(500)", "NN", "Đường dẫn URL ảnh poster phim"],
            ["rating", "DECIMAL(3,1)", "Default 0.0", "Điểm đánh giá trung bình (1.0 -> 5.0)"],
            ["genre", "VARCHAR(100)", "NN", "Thể loại phim (Hành động, Viễn tưởng...)"],
            ["ticket_price", "DECIMAL(10,2)", "NN", "Giá vé cơ sở niêm yết của phim"],
            ["status", "VARCHAR(20)", "NN", "Trạng thái: SHOWING, UPCOMING, ENDED"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng pricing: Định nghĩa bảng giá vé theo loại đối tượng khán giả và phụ thu.", bold_prefix="3. Bảng pricing (Cấu hình Giá vé): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["pricing_id", "INT", "PK, Auto", "Mã định danh cấu hình giá vé"],
            ["ticket_type", "VARCHAR(50)", "UQ, NN", "Mã loại vé: NORMAL, STUDENT, VIP, COUPLE"],
            ["label", "VARCHAR(100)", "NN", "Tên hiển thị: Vé Thường, Vé HSSV, Vé VIP..."],
            ["percentage", "INT", "Default 100", "Tỷ lệ % áp dụng so với giá gốc"],
            ["base_price", "DECIMAL(10,2)", "NN", "Đơn giá cố định hoặc phụ thu"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng combos: Quản lý danh mục bắp nước, số lượng tồn kho thực tế và đơn giá.", bold_prefix="4. Bảng combos (Combo Bắp Nước): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["combo_id", "INT", "PK, Auto", "Mã định danh combo bắp nước"],
            ["name", "VARCHAR(100)", "NN", "Tên combo (Combo Solo, Combo Đôi...)"],
            ["price", "DECIMAL(10,2)", "NN", "Đơn giá niêm yết combo"],
            ["image", "VARCHAR(500)", "NN", "Đường dẫn URL hình ảnh sản phẩm"],
            ["stock", "INT", "NN, >= 0", "Số lượng tồn kho khả dụng hiện tại"],
            ["status", "VARCHAR(20)", "NN", "Trạng thái: ACTIVE, INACTIVE"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    # Nhóm 2: Suất chiếu & Ghế
    add_heading(doc, "Nhóm 2: Lịch chiếu & Ghế ngồi (screenings, seats)", level=3)
    
    add_p(doc, "Bảng screenings: Quản lý lịch chiếu theo phòng, thời gian bắt đầu/kết thúc.", bold_prefix="5. Bảng screenings (Suất Chiếu): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["screening_id", "INT", "PK, Auto", "Mã định danh duy nhất của suất chiếu"],
            ["movie_id", "INT", "FK, NN", "Tham chiếu movies(movie_id)"],
            ["room", "VARCHAR(50)", "NN", "Tên phòng chiếu (Cinema 01 -> Cinema 04)"],
            ["room_number", "INT", "NN", "Số phòng chiếu (1 -> 4)"],
            ["start_time", "TIMESTAMP", "NN", "Thời gian bắt đầu chiếu"],
            ["end_time", "TIMESTAMP", "NN", "Thời gian kết thúc (start_time + duration)"],
            ["date", "DATE", "NN", "Ngày diễn ra suất chiếu"],
            ["price", "DECIMAL(10,2)", "NN", "Giá vé cơ sở áp dụng cho suất chiếu"],
            ["status", "VARCHAR(20)", "NN", "Trạng thái: UPCOMING, SHOWING, ENDED, CANCELLED"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng seats: Quản lý 50 ghế ngồi mỗi phòng và cơ chế khóa giữ chỗ 10 phút.", bold_prefix="6. Bảng seats (Ghế Ngồi): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["seat_id", "INT", "PK, Auto", "Mã định danh duy nhất của ghế ngồi"],
            ["screening_id", "INT", "FK, NN", "Tham chiếu screenings(screening_id)"],
            ["row", "VARCHAR(5)", "NN", "Hàng ghế (A, B, C, D, E)"],
            ["number", "INT", "NN", "Số thứ tự ghế trong hàng (1 -> 10)"],
            ["code", "VARCHAR(10)", "NN", "Mã hiển thị trực quan (A1, B5, E10...)"],
            ["type", "VARCHAR(20)", "NN", "Loại ghế: STANDARD, VIP, COUPLE"],
            ["status", "VARCHAR(20)", "NN", "Trạng thái: EMPTY, RESERVED, OCCUPIED"],
            ["reserved_until", "TIMESTAMP", "—", "Thời hạn hết hạn giữ chỗ (10 phút)"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    # Nhóm 3: Khách hàng & Tương tác
    add_heading(doc, "Nhóm 3: Khách hàng & Tương tác (coupons, reviews)", level=3)
    
    add_p(doc, "Bảng coupons: Quản lý mã giảm giá khuyến mãi và voucher bồi hoàn khi hủy vé.", bold_prefix="7. Bảng coupons (Voucher Khuyến Mãi): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["coupon_id", "INT", "PK, Auto", "Mã định danh voucher"],
            ["code", "VARCHAR(50)", "NN, UQ", "Mã code nhập (VD: LUMI20, COMP50_...)"],
            ["discount_type", "VARCHAR(20)", "NN", "Loại giảm giá: Percentage hoặc FixedAmount"],
            ["discount_value", "DECIMAL(10,2)", "NN", "Giá trị giảm (VD: 20% hoặc 50.000 VNĐ)"],
            ["min_amount", "DECIMAL(10,2)", "Default 0", "Giá trị đơn hàng tối thiểu áp dụng"],
            ["max_usage", "INT", "Default 1", "Số lượt sử dụng tối đa của voucher"],
            ["used_count", "INT", "Default 0", "Số lượt đã được sử dụng thực tế"],
            ["expiry_date", "DATE", "NN", "Hạn chót có hiệu lực của voucher"],
            ["applicable_movie_id", "INT", "FK", "Tham chiếu movies(movie_id) (nếu có)"],
            ["user_id", "INT", "FK", "Tham chiếu users(user_id) (voucher cá nhân)"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng reviews: Quản lý đánh giá và bình luận chân thực của khán giả về phim.", bold_prefix="8. Bảng reviews (Đánh Giá Phim): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["review_id", "INT", "PK, Auto", "Mã định danh duy nhất của đánh giá"],
            ["user_id", "INT", "FK, NN", "Tham chiếu users(user_id)"],
            ["movie_id", "INT", "FK, NN", "Tham chiếu movies(movie_id)"],
            ["rating", "INT", "NN, 1->5", "Số sao đánh giá (1 đến 5 sao)"],
            ["comment", "TEXT", "—", "Nội dung nhận xét đánh giá phim"],
            ["created_at", "TIMESTAMP", "Default Now", "Thời điểm đăng bài đánh giá"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    # Nhóm 4: Giao dịch & Đơn vé
    add_heading(doc, "Nhóm 4: Giao dịch & Đơn vé (combo_reservations, payments, tickets, order_combos)", level=3)
    
    add_p(doc, "Bảng combo_reservations: Khóa giữ tồn kho bắp nước tạm thời trong 10 phút thanh toán.", bold_prefix="9. Bảng combo_reservations (Giữ Kho Combo): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["reservation_id", "INT", "PK, Auto", "Mã giữ chỗ bắp nước tạm thời"],
            ["combo_id", "INT", "FK, NN", "Tham chiếu combos(combo_id)"],
            ["user_id", "INT", "FK, NN", "Tham chiếu users(user_id)"],
            ["quantity", "INT", "NN, > 0", "Số lượng combo giữ chỗ"],
            ["status", "VARCHAR(20)", "NN", "Trạng thái: RESERVED, RELEASED, CONFIRMED"],
            ["reserved_until", "TIMESTAMP", "NN", "Thời hạn hết hạn giữ kho (10 phút)"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng payments: Quản lý giao dịch thanh toán trực tuyến qua ZaloPay hoặc tiền mặt tại quầy.", bold_prefix="10. Bảng payments (Giao Dịch Thanh Toán): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["payment_id", "INT", "PK, Auto", "Mã định danh hóa đơn thanh toán"],
            ["user_id", "INT", "FK, NN", "Tham chiếu users(user_id)"],
            ["screening_id", "INT", "FK, NN", "Tham chiếu screenings(screening_id)"],
            ["amount", "DECIMAL(10,2)", "NN", "Tổng số tiền thanh toán thực tế"],
            ["payment_method", "VARCHAR(50)", "NN", "Phương thức: ZaloPay, Cash, BankCard"],
            ["transaction_code", "VARCHAR(100)", "UQ", "Mã giao dịch ngân hàng / Cổng ZaloPay"],
            ["status", "VARCHAR(20)", "NN", "Trạng thái: Pending, Success, Failed, Refunded"],
            ["created_at", "TIMESTAMP", "Default Now", "Thời điểm khởi tạo đơn hàng"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng tickets: Quản lý từng vé xem phim gắn liền với ghế ngồi, mã QR và trạng thái soát vé.", bold_prefix="11. Bảng tickets (Vé Xem Phim): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["ticket_id", "INT", "PK, Auto", "Mã định danh vé xem phim"],
            ["user_id", "INT", "FK, NN", "Tham chiếu users(user_id)"],
            ["screening_id", "INT", "FK, NN", "Tham chiếu screenings(screening_id)"],
            ["seat_id", "INT", "FK, NN, UQ", "Tham chiếu seats(seat_id) (1 ghế chỉ có 1 vé)"],
            ["payment_id", "INT", "FK, NN", "Tham chiếu payments(payment_id)"],
            ["ticket_type", "VARCHAR(50)", "NN", "Loại vé áp dụng (NORMAL, STUDENT, VIP...)"],
            ["price", "DECIMAL(10,2)", "NN", "Giá vé tính theo loại vé và phụ thu"],
            ["status", "VARCHAR(20)", "NN", "Trạng thái: Valid, Used, Cancelled"],
            ["purchase_date", "TIMESTAMP", "Default Now", "Thời điểm xuất vé thành công"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    add_p(doc, "Bảng order_combos: Quản lý các combo bắp nước đi kèm đơn vé và trạng thái nhận hàng.", bold_prefix="12. Bảng order_combos (Chi Tiết Combo Đã Mua): ")
    add_table(
        doc,
        ["Thuộc tính", "Kiểu dữ liệu", "Ràng buộc", "Mô tả / Tham chiếu"],
        [
            ["order_combo_id", "INT", "PK, Auto", "Mã định danh combo trong đơn hàng"],
            ["payment_id", "INT", "FK, NN", "Tham chiếu payments(payment_id)"],
            ["combo_id", "INT", "FK, NN", "Tham chiếu combos(combo_id)"],
            ["quantity", "INT", "NN, > 0", "Số lượng combo đã mua"],
            ["price", "DECIMAL(10,2)", "NN", "Đơn giá combo tại thời điểm thanh toán"],
            ["is_delivered", "BOOLEAN", "Default False", "Đã nhận tại quầy chưa (False: Chưa, True: Rồi)"]
        ],
        col_widths=[1.5, 1.2, 1.2, 2.3]
    )

    doc.add_page_break()

    # ----------------------------------------------------
    # PHẦN II: SƠ ĐỒ LỚP CHI TIẾT (CLASS DIAGRAM)
    # ----------------------------------------------------
    add_heading(doc, "PHẦN II: SƠ ĐỒ LỚP CHI TIẾT (CLASS DIAGRAM)", level=1)
    
    add_p(doc, "Sơ đồ Lớp (Class Diagram) của hệ thống LumiCinema được thiết kế theo Kiến trúc Hướng đối tượng Phân tầng (Layered Architecture). Kiến trúc tách biệt rõ ràng giữa Tầng Thực thể Dữ liệu (Domain Entities), Tầng Điều khiển & Dịch vụ Nghiệp vụ (Controllers & Services), và Tầng Tích hợp Cổng ngoài (External Adapters).")

    add_image_with_caption(
        doc,
        r"D:\cinema_project\PlantUML_Class_Diagram\class_diagram_lumicinema.png",
        "Hình 2.1: Sơ đồ Lớp Toàn diện (UML Class Diagram) Hệ thống Rạp chiếu phim LumiCinema",
        width_inches=6.2
    )

    add_heading(doc, "1. Phân Tích Các Phân Tầng Kiến Trúc", level=2)
    
    add_p(doc, "Bao gồm các lớp biểu diễn cấu trúc dữ liệu cốt lõi trong hệ thống như: User, Movie, Screening, Seat, Ticket, Payment, Combo, Coupon, Review. Các lớp này chứa đầy đủ thuộc tính, kiểu dữ liệu và các phương thức nghiệp vụ nội tại (getters, setters, validation, tính giá vé).", bold_prefix="• Tầng Thực thể (Domain Entities): ")
    
    add_p(doc, "Đảm nhiệm toàn bộ logic xử lý nghiệp vụ phức tạp của rạp chiếu phim:", bold_prefix="• Tầng Dịch vụ Nghiệp vụ (Service Layer): ")
    add_p(doc, "Quản lý phiên làm việc NextAuth JWT, băm mật khẩu Bcrypt, phân quyền RBAC chặt chẽ (Admin / Staff / Customer).", bold_prefix="  - AuthService: ")
    add_p(doc, "Điều phối quy trình đặt vé, chọn ghế, áp dụng mã giảm giá và tổng hợp đơn thanh toán.", bold_prefix="  - BookingService: ")
    add_p(doc, "Kiểm soát xung đột đồng thời (Concurrency Control), áp dụng khóa lạc quan (Optimistic Locking) và khóa giữ chỗ tạm thời 10 phút, ngăn chặn tuyệt đối tình trạng Double Booking.", bold_prefix="  - SeatConcurrencyService: ")
    add_p(doc, "Khởi tạo đơn hàng ZaloPay Sandbox v2 (HMAC-SHA256), xử lý Webhook IPN Callback an toàn, đối soát mã giao dịch.", bold_prefix="  - PaymentService: ")
    add_p(doc, "Xử lý xuất vé, quét mã QR soát vé tại cửa phòng, thực thi chính sách hủy vé (bồi hoàn voucher 50% trước 60 phút, hoặc hoàn tiền mặt 100% khi rạp gặp sự cố).", bold_prefix="  - TicketService: ")
    add_p(doc, "Gửi vé điện tử kèm mã QR Code trực tiếp qua hòm thư điện tử của khán giả qua giao thức SMTP bảo mật.", bold_prefix="  - EmailNotificationService: ")

    add_p(doc, "Đóng gói các kết nối ra dịch vụ bên thứ ba:", bold_prefix="• Tầng Tích hợp Cổng ngoài (External Adapters): ")
    add_p(doc, "Tích hợp cổng ZaloPay Sandbox API v2.", bold_prefix="  - ZaloPayGateway: ")
    add_p(doc, "Lưu trữ hình ảnh poster phim và bắp nước lên máy chủ đám mây Cloudinary.", bold_prefix="  - CloudinaryStorage: ")
    add_p(doc, "Dịch vụ gửi email thông báo vé qua Google Mail SMTP Relay.", bold_prefix="  - NodemailerSmtp: ")

    add_heading(doc, "2. Bảng Phân Tích Quan Hệ Giữa Các Lớp Chính", level=2)
    add_table(
        doc,
        ["Lớp nguồn", "Lớp đích", "Loại quan hệ", "Bội số (Multiplicity)", "Ý nghĩa nghiệp vụ"],
        [
            ["Movie", "Screening", "Composition (Hợp thành)", "1 —— 0..*", "Một bộ phim có thể có nhiều suất chiếu; khi xóa phim thì các suất chiếu phụ thuộc."],
            ["Screening", "Seat", "Composition (Hợp thành)", "1 —— 50", "Mỗi suất chiếu sở hữu chính xác 50 ghế ngồi phân bổ STANDARD, VIP, COUPLE."],
            ["Screening", "Ticket", "Association (Liên kết)", "1 —— 0..*", "Một suất chiếu có thể bán ra từ 0 đến tối đa 50 vé xem phim."],
            ["Seat", "Ticket", "Association (1 - 1)", "1 —— 0..1", "Một ghế trong suất chiếu tại một thời điểm chỉ gắn với tối đa 1 vé hợp lệ."],
            ["User", "Ticket", "Association (Sở hữu)", "1 —— 0..*", "Một người dùng có thể sở hữu nhiều vé xem phim trong lịch sử đặt vé."],
            ["Payment", "Ticket", "Aggregation (Tụ họp)", "1 —— 1..8", "Một hóa đơn thanh toán chứa tối thiểu 1 vé và tối đa 8 vé."],
            ["Payment", "OrderCombo", "Aggregation (Tụ họp)", "1 —— 0..*", "Một hóa đơn thanh toán có thể bao gồm 0 hoặc nhiều combo bắp nước đi kèm."],
            ["Combo", "OrderCombo", "Association", "1 —— 0..*", "Một combo mẫu có thể xuất hiện trong nhiều đơn hàng thực tế."]
        ],
        col_widths=[1.1, 1.1, 1.4, 1.0, 1.8]
    )

    doc.add_page_break()

    # ----------------------------------------------------
    # PHẦN III: SƠ ĐỒ MÁY TRẠNG THÁI (STATE MACHINE DIAGRAMS)
    # ----------------------------------------------------
    add_heading(doc, "PHẦN III: SƠ ĐỒ MÁY TRẠNG THÁI (STATE MACHINE DIAGRAMS)", level=1)
    
    add_p(doc, "Hệ thống LumiCinema sở hữu 6 thực thể có vòng đời phức tạp chịu sự tác động của thời gian, giao dịch tiền tệ và thao tác của người dùng. Dưới đây là 6 sơ đồ máy trạng thái (UML State Machine Diagrams) được chuẩn hóa theo phong cách Đơn sắc (Monochrome Academic StrictUML), kèm bảng phân tích trạng thái và danh sách biến cố chi tiết.")

    # 1. State Seat
    add_heading(doc, "1. Sơ đồ Máy Trạng thái Ghế ngồi (Seat State Machine)", level=2)
    add_p(doc, "Ghế ngồi trong một suất chiếu có 3 trạng thái chính: Trống (EMPTY), Đang giữ chỗ (RESERVED) và Đã bán (OCCUPIED). Ghế được áp dụng cơ chế khóa tạm thời trong đúng 10 phút. Nếu quá thời hạn mà chưa thanh toán, hệ thống tự động giải phóng ghế về trạng thái EMPTY.")
    
    add_image_with_caption(
        doc,
        r"D:\cinema_project\PlantUML_State_Diagrams\state_seat.png",
        "Hình 3.1: Sơ đồ Trạng thái Vòng đời Ghế ngồi (Seat Lifecycle)",
        width_inches=5.8
    )

    add_table(
        doc,
        ["STT", "Trạng thái nguồn", "Sự kiện kích hoạt", "Điều kiện bảo vệ (Guard)", "Hành động thực thi (Action)", "Trạng thái đích"],
        [
            ["1", "[*] (Khởi tạo)", "Tạo suất chiếu", "Phòng chiếu hợp lệ", "Tạo 50 ghế (A -> E)", "EMPTY (Ghế trống)"],
            ["2", "EMPTY", "Chọn ghế trên Web/POS", "[Ghế đang trống]", "Cấp khóa giữ chỗ 10 phút", "RESERVED (Đang giữ chỗ)"],
            ["3", "RESERVED", "Hết hạn 10 phút (TTL)", "[Chưa hoàn tất thanh toán]", "Giải phóng khóa giữ chỗ", "EMPTY (Ghế trống)"],
            ["4", "RESERVED", "Bỏ chọn / Đổi ghế", "[Thao tác bởi chính User]", "Hủy khóa giữ chỗ", "EMPTY (Ghế trống)"],
            ["5", "RESERVED", "ZaloPay IPN thành công", "[Thanh toán hợp lệ]", "Ghi nhận vé, chốt ghế", "OCCUPIED (Đã bán)"],
            ["6", "OCCUPIED", "Hủy vé sự cố rạp", "[Suất chiếu bị hủy khẩn cấp]", "Hoàn tiền, mở lại ghế", "EMPTY (Ghế trống)"]
        ],
        col_widths=[0.5, 1.2, 1.4, 1.4, 1.5, 1.2]
    )

    # 2. State Ticket
    add_heading(doc, "2. Sơ đồ Máy Trạng thái Vé xem phim (Ticket State Machine)", level=2)
    add_p(doc, "Vé xem phim được sinh ra sau khi thanh toán thành công và trải qua các trạng thái: Hợp lệ (Valid), Đã sử dụng (Used - khi soát vé) hoặc Đã hủy (Cancelled - do khách hủy trước 60 phút hoặc rạp hủy sự cố).")
    
    add_image_with_caption(
        doc,
        r"D:\cinema_project\PlantUML_State_Diagrams\state_ticket.png",
        "Hình 3.2: Sơ đồ Trạng thái Vòng đời Vé xem phim (Ticket Lifecycle)",
        width_inches=5.8
    )

    add_table(
        doc,
        ["STT", "Trạng thái nguồn", "Sự kiện kích hoạt", "Điều kiện bảo vệ (Guard)", "Hành động thực thi (Action)", "Trạng thái đích"],
        [
            ["1", "[*] (Khởi tạo)", "Thanh toán thành công", "[Ghế & tiền hợp lệ]", "Sinh mã vé & mã QR Code", "Valid (Vé hợp lệ)"],
            ["2", "Valid", "Nhân viên quét mã QR", "[Đúng suất & đúng phòng]", "Đóng dấu vé, cho vào rạp", "Used (Đã sử dụng)"],
            ["3", "Valid", "Khách tự hủy vé online", "[Trước giờ chiếu >= 60 phút]", "Cấp voucher bồi hoàn 50%", "Cancelled (Đã hủy)"],
            ["4", "Valid", "Rạp hủy vé do sự cố", "[Suất chiếu gặp sự cố kỹ thuật]", "Hoàn tiền mặt 100% tại quầy", "Cancelled (Đã hủy)"]
        ],
        col_widths=[0.5, 1.2, 1.4, 1.4, 1.5, 1.2]
    )

    # 3. State Payment
    add_heading(doc, "3. Sơ đồ Máy Trạng thái Thanh toán (Payment State Machine)", level=2)
    add_p(doc, "Hóa đơn thanh toán được kiểm soát qua máy trạng thái: Chờ thanh toán (Pending), Thành công (Success), Thất bại (Failed) và Đã hoàn tiền (Refunded), tuân thủ chữ ký số HMAC-SHA256 của ZaloPay.")
    
    add_image_with_caption(
        doc,
        r"D:\cinema_project\PlantUML_State_Diagrams\state_payment.png",
        "Hình 3.3: Sơ đồ Trạng thái Giao dịch Thanh toán (Payment Lifecycle)",
        width_inches=5.8
    )

    add_table(
        doc,
        ["STT", "Trạng thái nguồn", "Sự kiện kích hoạt", "Điều kiện bảo vệ (Guard)", "Hành động thực thi (Action)", "Trạng thái đích"],
        [
            ["1", "[*] (Khởi tạo)", "Nhấn 'Thanh Toán'", "[Tổng tiền > 0]", "Tạo đơn hàng, sinh order_url", "Pending (Chờ thanh toán)"],
            ["2", "Pending", "ZaloPay gửi Webhook IPN", "[Xác thực HMAC-SHA256 hợp lệ]", "Xác nhận tiền về, chốt vé", "Success (Thành công)"],
            ["3", "Pending", "Khách bấm Hủy / Quá 15p", "[Hết hạn hoặc người dùng hủy]", "Hủy giao dịch, nhả ghế", "Failed (Thất bại)"],
            ["4", "Success", "Yêu cầu bồi hoàn sự cố", "[Admin duyệt sự cố phòng]", "Thực hiện lệnh Refund", "Refunded (Đã hoàn tiền)"]
        ],
        col_widths=[0.5, 1.2, 1.4, 1.4, 1.5, 1.2]
    )

    # 4. State Combo
    add_heading(doc, "4. Sơ đồ Máy Trạng thái Combo Bắp Nước (Combo Lifecycle)", level=2)
    add_p(doc, "Quy trình xử lý combo gồm 2 phân đoạn độc lập: Giai đoạn giữ kho tạm thời 10 phút (ComboReservation) và Giai đoạn nhận hàng thực tế tại quầy của khán giả (OrderCombo.isDelivered).")
    
    add_image_with_caption(
        doc,
        r"D:\cinema_project\PlantUML_State_Diagrams\state_combo.png",
        "Hình 3.4: Sơ đồ Trạng thái Vòng đời Combo Bắp Nước (2 Giai đoạn)",
        width_inches=5.8
    )

    add_table(
        doc,
        ["STT", "Phân đoạn", "Trạng thái nguồn", "Sự kiện kích hoạt", "Điều kiện (Guard)", "Trạng thái đích"],
        [
            ["1", "Giữ kho tạm", "Chưa giữ kho", "Chọn combo vào đơn", "[Tồn kho >= Số lượng]", "RESERVED (Giữ kho 10p)"],
            ["2", "Giữ kho tạm", "RESERVED", "Thanh toán vé thành công", "[Giao dịch Success]", "CONFIRMED (Trừ kho chính thức)"],
            ["3", "Giữ kho tạm", "RESERVED", "Hết hạn thanh toán / Hủy", "[Quá thời hạn 10 phút]", "RELEASED (Hoàn trả tồn kho)"],
            ["4", "Nhận hàng", "Chờ nhận hàng", "Thanh toán đơn vé hoàn tất", "[isDelivered = false]", "Chờ nhận bắp nước tại quầy"],
            ["5", "Nhận hàng", "Chờ nhận hàng", "Nhân viên quầy bàn giao", "[Khách xuất trình mã đơn]", "ĐÃ NHẬN (isDelivered = true)"]
        ],
        col_widths=[0.5, 1.0, 1.2, 1.4, 1.4, 1.5]
    )

    # 5. State Screening
    add_heading(doc, "5. Sơ đồ Máy Trạng thái Suất Chiếu (Screening Lifecycle)", level=2)
    add_p(doc, "Suất chiếu trải qua các giai đoạn: Sắp chiếu (UPCOMING), Đang chiếu (SHOWING), Đã kết thúc (ENDED) hoặc Đã hủy (CANCELLED khi xảy ra sự cố hỏng máy chiếu, mất điện).")
    
    add_image_with_caption(
        doc,
        r"D:\cinema_project\PlantUML_State_Diagrams\state_screening.png",
        "Hình 3.5: Sơ đồ Trạng thái Suất chiếu (Screening Lifecycle)",
        width_inches=5.8
    )

    add_table(
        doc,
        ["STT", "Trạng thái nguồn", "Sự kiện kích hoạt", "Điều kiện bảo vệ (Guard)", "Hành động thực thi (Action)", "Trạng thái đích"],
        [
            ["1", "[*] (Khởi tạo)", "Admin xếp lịch chiếu", "[Phòng & giờ không xung đột]", "Khởi tạo 50 ghế trống", "UPCOMING (Sắp chiếu)"],
            ["2", "UPCOMING", "Đến giờ chiếu (T_start)", "[Hiện tại >= start_time]", "Đóng cổng đặt vé online", "SHOWING (Đang chiếu)"],
            ["3", "SHOWING", "Hết phim (T_end)", "[Hiện tại >= end_time]", "Chuyển trạng thái dọn phòng", "ENDED (Đã kết thúc)"],
            ["4", "UPCOMING / SHOWING", "Admin bấm Hủy Khẩn Cấp", "[Sự cố kỹ thuật rạp]", "Vô hiệu hóa vé, hoàn tiền", "CANCELLED (Đã hủy)"]
        ],
        col_widths=[0.5, 1.2, 1.4, 1.4, 1.5, 1.2]
    )

    # 6. State Movie
    add_heading(doc, "6. Sơ đồ Máy Trạng thái Phim (Movie Lifecycle)", level=2)
    add_p(doc, "Vòng đời phim gồm: Sắp chiếu (UPCOMING - mở bán vé sớm), Đang chiếu (SHOWING - công chiếu chính thức tại các phòng) và Ngừng chiếu (ENDED - lưu trữ lịch sử, không mở thêm suất mới).")
    
    add_image_with_caption(
        doc,
        r"D:\cinema_project\PlantUML_State_Diagrams\state_movie.png",
        "Hình 3.6: Sơ đồ Trạng thái Phim (Movie Lifecycle)",
        width_inches=5.8
    )

    add_table(
        doc,
        ["STT", "Trạng thái nguồn", "Sự kiện kích hoạt", "Điều kiện bảo vệ (Guard)", "Hành động thực thi (Action)", "Trạng thái đích"],
        [
            ["1", "[*] (Khởi tạo)", "Admin thêm phim mới", "[Hồ sơ bản quyền đầy đủ]", "Nhập poster, trailer, mô tả", "UPCOMING (Sắp chiếu)"],
            ["2", "UPCOMING", "Đến ngày khởi chiếu", "[Hiện tại >= release_date]", "Mở xếp suất chiếu chính thức", "SHOWING (Đang chiếu)"],
            ["3", "SHOWING", "Hết hạn công chiếu", "[Hiện tại >= end_date]", "Dừng xếp lịch, đóng đặt vé", "ENDED (Ngừng chiếu)"]
        ],
        col_widths=[0.5, 1.2, 1.4, 1.4, 1.5, 1.2]
    )

    doc.add_page_break()

    # ----------------------------------------------------
    # PHẦN IV: THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG (UI DESIGN)
    # ----------------------------------------------------
    add_heading(doc, "PHẦN IV: THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG (USER INTERFACE DESIGN)", level=1)
    
    add_p(doc, "Thiết kế giao diện: Mô tả chi tiết cách thức giao tiếp giữa người sử dụng và phần mềm. Giao diện được thiết kế chuyên nghiệp, khoa học, bám sát hành vi người dùng, tối ưu hóa trên mọi thiết bị và mang lại trải nghiệm tiện lợi, trực quan nhất.", bold_prefix="Khái niệm & Mục tiêu thiết kế: ")

    add_p(doc, "Hệ thống LumiCinema được thiết kế theo phong cách Vũ trụ Điện ảnh (Cosmic Galaxy Theme) với tỷ lệ thị giác vàng 60 - 30 - 10: Không gian nền OLED đen tuyền sâu thẳm (#050508) chiếm 60% triệt tiêu mỏi mắt; Bề mặt kính mờ tinh vân Nebula Glass (backdrop-blur: 20px) chiếm 30%; Điểm nhấn thương hiệu đỏ nhung điện ảnh Velvet Red (#E11D48) và ánh sao tím (#C084FC) chiếm 10%. Triệt tiêu toàn bộ emoji hoạt hình rườm rà, thay thế bằng đồ họa kính mờ sang trọng và typography tinh tế.", bold_prefix="Nguyên tắc Thiết kế Cosmic Galaxy: ")

    # Màn hình 1: Trang chủ
    add_heading(doc, "1. Màn hình Giao diện 1: Trang chủ & Cockpit Đặt vé nhanh (Homepage)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\01_trang_chu.png",
        "Hình 4.1: Màn hình Trang chủ LumiCinema & Buồng lái Đặt vé nhanh",
        width_inches=6.0
    )
    add_p(doc, "Thanh điều hướng vũ trụ (Cosmic Glass Navbar) chứa Logo thương hiệu Lumi Cinema, các liên kết điều hướng (Lịch chiếu, Phim, Bắp nước, Vé của tôi) và nút Đăng nhập / Đăng ký. Banner tiêu điểm chiếu phim bom tấn kèm huy hiệu công nghệ '✦ CÔNG NGHỆ CHIẾU VŨ TRỤ 4K · DOLBY ATMOS'. Buồng lái đặt vé nhanh (Cockpit Quick Booking Bar) cho phép chọn Phim, Ngày chiếu, Suất chiếu và chuyển thẳng đến sơ đồ chọn ghế trong 1 click. Danh mục phim đang khởi chiếu dạng lưới Cosmic Film Card hiển thị poster, điểm đánh giá sao và nút Đặt Vé.", bold_prefix="• Nội dung: ")
    add_p(doc, "Bố cục Hero Asymmetric Grid (tỷ lệ 1.25 : 0.75), nền đen không gian OLED (#050508) kết hợp vệt tinh vân tím mận mềm mại. Thẻ buồng lái Cockpit kính mờ lơ lửng ngay dưới banner chính. Nút CTA Đặt vé sử dụng hiệu ứng phát sáng chuyển sắc đỏ nhung rực rỡ.", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Trang chủ:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Người dùng truy cập trang chủ (/)", "Tải danh sách phim đang chiếu từ DB; render Banner tiêu điểm và thanh buồng lái Cockpit.", "Hiển thị mặc định phim bom tấn có điểm cao nhất."],
            ["2", "Khách chọn Phim trong thanh Cockpit", "Tự động lọc và cập nhật danh sách ngày chiếu và suất chiếu khả dụng tương ứng với phim đã chọn.", "Bất đồng bộ không cần tải lại trang."],
            ["3", "Khách bấm nút 'Đặt Vé' trên buồng lái", "Kiểm tra tính hợp lệ của suất chiếu; điều hướng người dùng tới màn hình sơ đồ ghế (/screenings/[id]/seats).", "Nếu chưa chọn suất chiếu, hiển thị thông báo nhắc nhở."],
            ["4", "Khách bấm vào thẻ phim bất kỳ", "Điều hướng đến trang Chi tiết phim (/movies/[id]) để xem trailer, tóm tắt nội dung và đánh giá.", "Hiển thị mượt mà kèm hiệu ứng chuyển trang."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # Màn hình 2: Đăng nhập
    add_heading(doc, "2. Màn hình Giao diện 2: Đăng nhập Phân quyền (Login & 1-Click Demo RBAC)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\02_dang_nhap.png",
        "Hình 4.2: Màn hình Đăng nhập phân quyền với Bảng điền nhanh tài khoản 1-Click Demo",
        width_inches=6.0
    )
    add_p(doc, "Khung đăng nhập kính mờ trung tâm với 2 ô nhập liệu Email và Mật khẩu, nút hiển thị/ẩn mật khẩu, liên kết Đăng ký tài khoản mới. Đặc biệt tích hợp BẢNG ĐIỀN NHANH TÀI KHOẢN PHÂN QUYỀN (1-CLICK FILL DEMO) gồm 3 vai trò chính: Quản trị viên Admin (Mã Gia Vỹ - giavyma265@gmail.com), Nhân viên Staff (magiavy265@gmail.com) và Khách hàng Demo (khachhang@lumi.vn) cùng danh sách tài khoản ca trực của nhân viên.", bold_prefix="• Nội dung: ")
    add_p(doc, "Bố cục chia 2 cột đối xứng: Cột trái hiển thị hình ảnh thương hiệu rạp chiếu phim nghệ thuật; cột phải là khối kính mờ Glassmorphism (backdrop-blur: 24px) viền mỏng ánh sao tím. Các nút 1-click fill demo được thiết kế dạng thẻ con nhộng bo tròn góc kèm biểu tượng phân quyền rõ nét.", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Đăng nhập:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Khách bấm vào thẻ tài khoản Demo bất kỳ", "Tự động điền chính xác Email và Mật khẩu tương ứng vào form; hiển thị Toast thông báo màu xanh.", "Tiết kiệm 100% thời gian gõ tài khoản khi chấm điểm."],
            ["2", "Khách bấm nút 'Đăng nhập'", "Xác thực dữ liệu form; gọi NextAuth Credentials Provider mã hóa so khớp mật khẩu Bcrypt.", "Chặn gửi dữ liệu nếu để trống Email hoặc Mật khẩu."],
            ["3", "Xác thực thành công", "Cấp phiên JWT chứa role; tự động điều hướng: Admin -> /admin/dashboard, Staff -> /staff, Khách -> / hoặc callbackUrl.", "Thời gian chuyển hướng 500ms kèm Toast thành công."],
            ["4", "Sai tài khoản hoặc mật khẩu", "Hiển thị thông báo Toast cảnh báo lỗi màu đỏ 'Email hoặc mật khẩu không chính xác'; xóa trường mật khẩu.", "Không làm mất thông tin Email người dùng đã nhập."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # Màn hình 3: Đăng ký
    add_heading(doc, "3. Màn hình Giao diện 3: Đăng ký Tài khoản Thành viên (Customer Sign Up)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\03_dang_ky.png",
        "Hình 4.3: Màn hình Đăng ký Thành viên Khách hàng Mới",
        width_inches=6.0
    )
    add_p(doc, "Form đăng ký thành viên khách hàng mới bao gồm: Họ và tên, Địa chỉ Email, Số điện thoại liên lạc, Mật khẩu và Xác nhận mật khẩu. Điều khoản sử dụng và chính sách bảo mật Lumi Cinema, cùng liên kết chuyển hướng sang trang Đăng nhập dành cho tài khoản đã tồn tại.", bold_prefix="• Nội dung: ")
    add_p(doc, "Khối thẻ kính mờ đặt giữa màn hình với phông nền sao băng vũ trụ, hiệu ứng phản chiếu ánh sáng khi người dùng di chuột (Hover Glow). Ô nhập liệu có viền sáng chuyển màu khi focus và các chỉ báo lỗi trực quan ngay dưới từng trường.", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Đăng ký:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Người dùng nhập liệu các trường", "Kiểm tra định dạng email hợp lệ, độ dài mật khẩu >= 6 ký tự, số điện thoại đúng quy chuẩn.", "Validation thời gian thực ngay khi người dùng gõ."],
            ["2", "Khách nhấn 'Đăng ký Tài khoản'", "Kiểm tra trùng khớp mật khẩu; gọi API POST /api/auth/register kiểm tra tính duy nhất của Email.", "Ngăn chặn tạo tài khoản trùng email."],
            ["3", "Đăng ký thành công", "Hệ thống tạo bản ghi User mới với role = 'CUSTOMER'; hiển thị thông báo thành công và chuyển hướng đến trang Đăng nhập.", "Khách hàng có thể đăng nhập ngay lập tức."],
            ["4", "Email đã tồn tại trong hệ thống", "Hiển thị thông báo lỗi 'Email này đã được đăng ký, vui lòng sử dụng email khác hoặc đăng nhập'.", "Hiển thị Toast cảnh báo màu đỏ."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # Màn hình 4: Chi tiết phim
    add_heading(doc, "4. Màn hình Giao diện 4: Chi tiết Phim & Lịch chiếu (Movie Details & Showtimes)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\04_chi_tiet_phim.png",
        "Hình 4.4: Màn hình Chi tiết Phim, Trailer & Lịch chiếu Suất chiếu",
        width_inches=6.0
    )
    add_p(doc, "Thông tin toàn diện về bộ phim: Ảnh Backdrop khổ lớn, Poster tỷ lệ 2:3, Tiêu đề phim, Huy hiệu độ tuổi (C13, C16, C18, P), Thể loại, Thời lượng, Ngày phát hành, Đạo diễn, Dàn diễn viên ngôi sao và Đoạn tóm tắt nội dung kịch tính. Khung phát Trailer phim chất lượng cao. Bảng điều khiển chọn ngày xem phim và danh sách các suất chiếu phân theo phòng chiếu (Cinema 01 - Cinema 04). Khu vực Đánh giá & Bình luận của khán giả kèm hệ thống chấm điểm sao (Star Rating).", bold_prefix="• Nội dung: ")
    add_p(doc, "Bố cục điện ảnh Panorama với hình nền Backdrop mờ ảo phía sau, lớp phủ gradient tối đảm bảo độ tương phản hoàn hảo cho văn bản. Các khung giờ chiếu được thể hiện dưới dạng thẻ con nhộng phát sáng viền tím khi hover, hiển thị rõ giờ bắt đầu, giờ kết thúc và định dạng phòng chiếu (IMAX, 2D Laser).", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Chi tiết Phim:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Truy cập đường dẫn /movies/[id]", "Gọi API tải chi tiết phim, danh sách suất chiếu còn hiệu lực và các đánh giá gần nhất.", "Xử lý hiển thị trạng thái chờ tải nhẹ nhàng."],
            ["2", "Khách chọn chuyển đổi ngày chiếu", "Cập nhật danh sách khung giờ chiếu tương ứng với ngày được chọn mà không cần tải lại toàn trang.", "Lọc các suất chiếu chưa quá giờ chiếu."],
            ["3", "Khách bấm vào một khung giờ chiếu", "Điều hướng thẳng đến Màn hình Sơ đồ Ghế ngồi của suất chiếu đó (/screenings/[id]/seats).", "Kiểm tra suất chiếu còn ghế trống hay không."],
            ["4", "Khách gửi đánh giá & bình luận mới", "Kiểm tra đăng nhập; gửi dữ liệu lên POST /api/reviews; cập nhật điểm trung bình của phim.", "Chỉ người dùng đã đăng nhập mới được đánh giá."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # Màn hình 5: Chọn ghế
    add_heading(doc, "5. Màn hình Giao diện 5: Sơ đồ Chọn ghế Trực quan (Seat Map Selection)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\05_chon_ghe.png",
        "Hình 4.5: Màn hình Sơ đồ Chọn ghế 50 Ghế & Đồng hồ Đếm ngược 10 Phút",
        width_inches=6.0
    )
    add_p(doc, "Thanh tiến trình 4 bước: [1. Chọn ghế -> 2. Loại vé -> 3. Combo & Thanh toán -> 4. Xác nhận]. Hộp đếm ngược thời gian giữ chỗ 10:00 phút với biểu tượng xoay vũ trụ. Màn hình chiếu phim uốn cong phát sáng (Curved Cinema Screen). Ma trận 50 ghế ngồi (5 hàng A - E, mỗi hàng 10 ghế) phân theo màu sắc và loại ghế (Ghế thường, Ghế VIP, Ghế Đôi Sweetbox). Bảng chú thích trạng thái ghế (Trống, Đang chọn, Đã bán). Khung tóm tắt danh sách ghế đã chọn, loại vé áp dụng và tổng tiền tạm tính.", bold_prefix="• Nội dung: ")
    add_p(doc, "Mô phỏng chân thực không gian phòng rạp điện ảnh với góc nhìn từ trên cao hướng về màn hình cong rực rỡ. Ghế ngồi được vẽ bằng vector bo góc mềm mại, hiển thị rõ mã ghế (A1, C5, E10). Hiệu ứng ánh sáng hào quang (Neon Glow) khi ghế được người dùng chọn.", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Chọn Ghế:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Khách nhấp vào một ghế đang trống", "Kiểm tra giới hạn <= 8 ghế; đổi màu ghế sang trạng thái Đang chọn; tính toán lại tổng tiền tạm tính.", "Chặn không cho chọn quá 8 ghế trong 1 đơn."],
            ["2", "Khách nhấp vào ghế đang được chọn", "Bỏ chọn ghế; trừ ghế khỏi danh sách đã chọn; cập nhật lại tổng tiền tương ứng.", "Cập nhật tức thời trên giao diện."],
            ["3", "Khách bấm vào ghế đã bán (OCCUPIED)", "Hiển thị thông báo 'Ghế này đã có người đặt, vui lòng chọn ghế khác'; không cho phép chọn.", "Ngăn chặn xung đột đặt vé."],
            ["4", "Khách bấm nút 'Tiếp Tục Đặt Vé'", "Gọi API POST /api/screenings/[id]/reserve để tạo khóa giữ chỗ 10 phút trong DB; chuyển sang bước chọn Combo.", "Kích hoạt đồng hồ đếm ngược 10 phút."],
            ["5", "Đồng hồ đếm ngược chạm mốc 00:00", "Khóa giữ chỗ hết hạn; hệ thống tự động giải phóng ghế về EMPTY và hiển thị Modal hết hạn.", "Bảo đảm quyền lợi cho các khách hàng khác."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # Màn hình 6: Chọn combo
    add_heading(doc, "6. Màn hình Giao diện 6: Chọn Combo Bắp Nước & Thanh toán (Combo & Checkout)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\06_chon_combo.png",
        "Hình 4.6: Màn hình Chọn Combo Bắp Nước Khuyến Mãi & Tóm tắt Thanh toán",
        width_inches=6.0
    )
    add_p(doc, "Danh mục các gói combo bắp nước cao cấp: Combo Solo (1 bắp ngọt + 1 nước vừa), Combo Đôi (1 bắp lớn + 2 nước vừa), Combo Gia đình VIP, Bắp vị Caramel thơm lừng. Bộ nút tăng giảm số lượng (+ / -) cho từng combo. Ô nhập mã giảm giá Voucher khuyến mãi kèm nút Áp Dụng. Bảng hóa đơn tổng kết hiển thị chi tiết: Tiền vé, Tiền combo, Số tiền giảm giá voucher và Tổng tiền thanh toán cuối cùng. Nút bấm kích hoạt cổng ZaloPay.", bold_prefix="• Nội dung: ")
    add_p(doc, "Bố cục chia 2 phần: Bên trái là lưới hiển thị hình ảnh món ăn sắc nét với nhãn giá nổi bật; bên phải là Hóa đơn Kính mờ (Glass Receipt) cố định theo màn hình khi cuộn, mang lại trải nghiệm thanh toán chuẩn thương mại điện tử hiện đại.", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Combo & Thanh toán:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Khách nhấn nút '+' hoặc '-' tăng giảm combo", "Kiểm tra tồn kho khả dụng; cập nhật số lượng và tự động cộng dồn chi phí vào hóa đơn tổng.", "Không cho phép chọn vượt quá tồn kho."],
            ["2", "Khách nhập mã Voucher và nhấn 'Áp Dụng'", "Gọi API kiểm tra điều kiện áp dụng, hạn dùng và số tiền tối thiểu; tính toán chiết khấu giảm giá vào tổng tiền.", "Hiển thị số tiền tiết kiệm được màu xanh lá."],
            ["3", "Nhập mã Voucher không hợp lệ / hết hạn", "Hiển thị thông báo Toast cảnh báo lỗi 'Mã voucher không hợp lệ hoặc đã hết lượt dùng'.", "Không áp dụng giảm giá."],
            ["4", "Khách nhấn nút 'Thanh Toán Qua ZaloPay'", "Gọi API POST /api/payments/create-zalopay; tạo đơn hàng bảo mật và điều hướng sang cổng ZaloPay Sandbox.", "Khóa giữ chỗ combo 10 phút tương ứng."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # Màn hình 7: Admin Dashboard
    add_heading(doc, "7. Màn hình Giao diện 7: Bảng Điều Khiển Quản Trị Hệ Thống (Admin Bento Dashboard)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\07_admin_dashboard.png",
        "Hình 4.7: Màn hình Bảng điều khiển Quản trị Bento Grid Admin Dashboard",
        width_inches=6.0
    )
    add_p(doc, "Bảng chỉ số KPI thời gian thực: Tổng doanh thu hôm nay, Số lượng vé bán ra, Doanh thu bắp nước, Tỷ lệ lấp đầy rạp chiếu (Fill Rate %). Biểu đồ cột trực quan thống kê doanh thu 7 ngày và 30 ngày gần nhất. Giám sát trạng thái 4 phòng chiếu trực tiếp (Live Room Monitor): Đang chiếu phim gì, tiến độ thời lượng phim (%), số ghế đã bán / tổng 50 ghế. Bảng xếp hạng Top phim ăn khách có doanh thu cao nhất. Nút bấm chức năng 'Hủy Suất Chiếu Khẩn Cấp' (Emergency Incident Cancellation) dành cho phòng gặp sự cố kỹ thuật.", bold_prefix="• Nội dung: ")
    add_p(doc, "Thiết kế theo xu hướng Bento Grid hiện đại của Apple, chia các khối thông tin thành các ô kính mờ bo tròn góc mềm mại với đường viền mỏng ánh sao tím. Dữ liệu số liệu quan trọng được in đậm cỡ lớn, các thanh tiến trình phòng chiếu sử dụng dải màu gradient sinh động.", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Quản trị:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Admin truy cập /admin/dashboard", "Kiểm tra quyền role === 'ADMIN'; gọi API tải tổng hợp doanh thu, tỷ lệ lấp đầy và tình trạng các phòng chiếu.", "Chặn truy cập trái phép nếu không có quyền."],
            ["2", "Admin bấm chuyển đổi mốc thời gian biểu đồ (7d / 30d)", "Cập nhật dữ liệu biểu đồ doanh thu theo mốc thời gian tương ứng kèm animation mượt mà.", "Truy vấn bất đồng bộ tối ưu RAM."],
            ["3", "Admin nhấn nút 'Hủy Khẩn Cấp Suất Chiếu'", "Mở hộp thoại Modal xác nhận nguyên nhân sự cố (mất điện, hỏng máy chiếu, lỗi âm thanh).", "Yêu cầu xác nhận cẩn trọng."],
            ["4", "Admin xác nhận Hủy Khẩn Cấp", "Gọi API chuyển suất chiếu sang CANCELLED; vô hiệu hóa vé; ghi nhận danh sách hoàn tiền mặt 100% cho khách tại quầy.", "Hệ thống ghi nhật ký kiểm toán hệ thống."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # Màn hình 8: Phân hệ Nhân viên
    add_heading(doc, "8. Màn hình Giao diện 8: Phân Hệ Quầy Dịch Vụ & Soát Vé Nhân Viên (Staff Portal)", level=2)
    add_image_with_caption(
        doc,
        r"D:\cinema_project\UI_Screenshots\08_nhan_vien_staff.png",
        "Hình 4.8: Màn hình Phân hệ Quầy Dịch vụ & Soát vé Dành cho Nhân viên",
        width_inches=6.0
    )
    add_p(doc, "Cổng điều phối công việc dành riêng cho nhân viên rạp chiếu phim với 4 nghiệp vụ chính: (1) Quầy Bán Vé Nhanh POS tại chỗ bằng tiền mặt / thẻ; (2) Soát vé vào phòng chiếu bằng đầu đọc mã QR hoặc nhập mã vé; (3) Quầy Giao nhận Combo bắp nước đã đặt trước của khách; (4) Xử lý hoàn tiền vé trực tiếp khi khách có yêu cầu hợp lệ.", bold_prefix="• Nội dung: ")
    add_p(doc, "Giao diện tối ưu hóa cho thao tác chạm trên màn hình cảm ứng POS tại quầy rạp. Các khối chức năng dạng thẻ nổi bật, nút bấm cỡ lớn giúp nhân viên thao tác cực nhanh trong giờ cao điểm đông khách mà không bị nhầm lẫn.", bold_prefix="• Hình thức trình bày: ")
    add_p(doc, "Danh sách các biến cố xử lý trên màn hình Nhân viên:", bold_prefix="• Biến cố phải xử lý: ")
    add_table(
        doc,
        ["STT", "Điều kiện kích hoạt", "Xử lý", "Ghi chú"],
        [
            ["1", "Nhân viên truy cập /staff", "Kiểm tra quyền role === 'STAFF' hoặc 'ADMIN'; hiển thị bảng điều khiển tác vụ quầy.", "Bảo vệ tuyến đường bằng NextAuth Middleware."],
            ["2", "Nhân viên chọn chức năng 'Soát Vé'", "Mở camera quét mã QR hoặc form nhập mã vé; kiểm tra vé hợp lệ, đúng phòng chiếu và chưa qua sử dụng.", "Đổi trạng thái vé sang 'Used' khi hợp lệ."],
            ["3", "Nhân viên chọn 'Giao Nhận Combo'", "Nhập mã hóa đơn đơn hàng của khách; hiển thị danh sách combo cần bàn giao; nhấn 'Xác Nhận Đã Giao'.", "Đổi trạng thái isDelivered = true."],
            ["4", "Nhân viên bấm vào 'Bán Vé Tại Quầy POS'", "Chuyển sang giao diện POS chọn suất chiếu và in vé thanh toán tiền mặt tức thì.", "Quy trình bán vé tại chỗ trong 30 giây."]
        ],
        col_widths=[0.5, 2.0, 3.2, 1.5]
    )

    # ----------------------------------------------------
    # PHẦN KẾT LUẬN & ĐÁNH GIÁ TIẾN ĐỘ
    # ----------------------------------------------------
    doc.add_page_break()
    add_heading(doc, "KẾT LUẬN & ĐÁNH GIÁ TIẾN ĐỘ DỰ ÁN", level=1)
    
    add_p(doc, "Dự án Hệ thống Quản lý và Đặt vé Rạp chiếu phim LumiCinema đã hoàn thành xuất sắc các mục tiêu nghiên cứu và thiết kế đã đề ra, tuân thủ 100% chuẩn mực học thuật của Đồ án Môn học Phân tích & Thiết kế Hệ thống Thông tin (Trường Đại học Sài Gòn - SGU):")
    
    add_p(doc, "Chuẩn hóa hoàn chỉnh 12 bảng thực thể và 16 mối quan hệ khóa ngoại đạt Dạng chuẩn 3 (3NF), đảm bảo tính toàn vẹn và triệt tiêu dư thừa dữ liệu.", bold_prefix="1. Mô hình Dữ liệu Quan hệ (RDM): ")
    add_p(doc, "Thiết kế phân tầng 3 lớp (Entities, Services, Adapters) minh bạch, kiểm soát chặt chẽ nghiệp vụ rạp chiếu phim, giải quyết triệt để bài toán Concurrency và Double Booking.", bold_prefix="2. Sơ đồ Lớp (Class Diagram): ")
    add_p(doc, "Chuẩn hóa 6 sơ đồ trạng thái thuần Việt đạt chuẩn StrictUML, phản ánh chính xác từng chuyển biến của Ghế, Vé, Thanh toán, Combo, Suất chiếu và Phim.", bold_prefix="3. Sơ đồ Máy Trạng thái (State Diagrams): ")
    add_p(doc, "Đột phá với phong cách Vũ trụ Điện ảnh Cosmic Galaxy Cinema (tỷ lệ 60-30-10, OLED Deep Space, Kính mờ Nebula Glass, Velvet Red CTA), mang lại trải nghiệm xem phim và đặt vé đỉnh cao cho khán giả.", bold_prefix="4. Thiết kế Giao diện (UI Design): ")

    output_path = r"D:\cinema_project\Bao_Cao_Tien_Do_LumiCinema.docx"
    doc.save(output_path)
    print(f"SUCCESS: Report saved to {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    main()
