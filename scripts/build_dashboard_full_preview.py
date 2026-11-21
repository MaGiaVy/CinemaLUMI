import os

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LumiCinema // Admin Dashboard - Full Command Deck Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #050508;
      color: #F8FAFC;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
      min-height: 100vh;
    }
    a { text-decoration: none; color: inherit; }
    button, input, select { font: inherit; }
    .num { font-variant-numeric: tabular-nums; }
    .tech { font-family: 'Chakra Petch', monospace; }

    /* DEEP GALAXY NEBULA BACKGROUND */
    .bg-nebula {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background: 
        radial-gradient(circle at 12% 18%, rgba(136, 19, 55, 0.25) 0%, transparent 45%),
        radial-gradient(circle at 88% 12%, rgba(88, 28, 135, 0.28) 0%, transparent 48%),
        radial-gradient(circle at 50% 85%, rgba(112, 26, 117, 0.18) 0%, transparent 55%),
        radial-gradient(circle at 75% 65%, rgba(225, 29, 72, 0.12) 0%, transparent 40%),
        #050508;
    }

    /* TOP NOTIFICATION BANNER */
    .preview-banner {
      position: sticky; top: 0; z-index: 9999;
      background: rgba(14, 10, 22, 0.95);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(225, 29, 72, 0.35);
      padding: 8px 20px; font-size: 11.5px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    .preview-tag {
      background: linear-gradient(135deg, #E11D48, #9F1239);
      color: #FFF; font-weight: 800; font-size: 10px;
      padding: 3px 8px; border-radius: 4px; letter-spacing: 0.8px;
    }

    /* APP LAYOUT: SIDEBAR + MAIN */
    .app-layout {
      display: flex; min-height: 100vh; position: relative; z-index: 10;
    }

    /* ADMIN SIDEBAR */
    .admin-sidebar {
      width: 250px; flex-shrink: 0;
      background: rgba(10, 8, 18, 0.92);
      backdrop-filter: blur(24px);
      border-right: 1px solid rgba(192, 132, 252, 0.15);
      display: flex; flex-direction: column; justify-content: space-between;
      min-height: 100vh;
    }
    @media (max-width: 1024px) {
      .admin-sidebar { display: none; }
    }

    .brand-box {
      padding: 20px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex; align-items: center; gap: 12px;
    }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: linear-gradient(135deg, #E11D48 0%, #881337 100%);
      display: flex; align-items: center; justify-content: center;
      color: #FFF; font-weight: 900; font-size: 16px;
      box-shadow: 0 0 16px rgba(225, 29, 72, 0.6);
    }
    .brand-text h2 {
      font-size: 13.5px; font-weight: 900; letter-spacing: 1px; color: #FFF;
      text-transform: uppercase;
    }
    .brand-text p {
      font-size: 9.5px; font-weight: 800; letter-spacing: 1.5px; color: #C084FC;
      text-transform: uppercase; margin-top: 1px;
    }

    .nav-list {
      padding: 14px 10px; display: flex; flex-direction: column; gap: 4px;
    }
    .nav-link {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 8px;
      font-size: 12px; font-weight: 600; color: #94A3B8;
      transition: all 0.2s;
    }
    .nav-link:hover {
      color: #FFF; background: rgba(255, 255, 255, 0.05);
    }
    .nav-link.active {
      color: #FFF; background: linear-gradient(135deg, rgba(225, 29, 72, 0.25) 0%, rgba(136, 19, 55, 0.15) 100%);
      border: 1px solid rgba(225, 29, 72, 0.4);
      font-weight: 700;
    }

    .sidebar-user {
      padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex; align-items: center; gap: 10px;
    }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg, #7C3AED, #581C87);
      color: #FFF; font-weight: 800; font-size: 12px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(192, 132, 252, 0.3);
    }
    .user-info h5 { font-size: 11.5px; font-weight: 700; color: #FFF; }
    .user-info p { font-size: 10px; color: #94A3B8; }

    /* MAIN CONTENT */
    .main-content {
      flex: 1; padding: 24px 28px 60px 28px; min-width: 0;
    }

    /* TOP COMMAND HEADER */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 16px; padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 22px;
    }
    .header-left h1 {
      font-size: 21px; font-weight: 900; letter-spacing: -0.5px;
      text-transform: uppercase; color: #F8FAFC;
      display: flex; align-items: center; gap: 10px;
    }
    .badge-command {
      font-size: 10px; font-weight: 800; font-family: 'Chakra Petch', monospace;
      padding: 3px 8px; border-radius: 999px;
      background: rgba(225, 29, 72, 0.18); border: 1px solid rgba(225, 29, 72, 0.4);
      color: #FDA4AF; letter-spacing: 0.8px;
    }
    .header-left p {
      font-size: 11.5px; color: #94A3B8; margin-top: 4px;
    }
    .header-actions {
      display: flex; align-items: center; gap: 10px;
    }
    .btn-refresh {
      padding: 7px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 700;
      background: rgba(255, 255, 255, 0.05); color: #FFF;
      border: 1px solid rgba(192, 132, 252, 0.25); cursor: pointer;
    }
    .btn-export {
      padding: 7px 16px; border-radius: 8px; font-size: 11.5px; font-weight: 800;
      background: linear-gradient(135deg, #E11D48 0%, #9F1239 100%);
      color: #FFF; border: 1px solid rgba(253, 164, 175, 0.4);
      box-shadow: 0 0 16px rgba(225, 29, 72, 0.5); cursor: pointer;
    }

    /* BENTO GRID ROW 1: 4 KPI CARDS */
    .bento-kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
      margin-bottom: 22px;
    }
    @media (max-width: 1200px) { .bento-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .bento-kpi-grid { grid-template-columns: 1fr; } }

    .bento-kpi-card {
      border-radius: 16px; padding: 18px 20px;
      backdrop-filter: blur(20px); border: 1px solid rgba(192, 132, 252, 0.2);
      position: relative; overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }
    .bento-kpi-card.c1 { background: radial-gradient(circle at 0% 0%, rgba(225, 29, 72, 0.28) 0%, transparent 60%), rgba(16, 12, 26, 0.85); }
    .bento-kpi-card.c2 { background: radial-gradient(circle at 0% 0%, rgba(88, 28, 135, 0.32) 0%, transparent 60%), rgba(16, 12, 26, 0.85); }
    .bento-kpi-card.c3 { background: radial-gradient(circle at 0% 0%, rgba(136, 19, 55, 0.28) 0%, transparent 60%), rgba(16, 12, 26, 0.85); }
    .bento-kpi-card.c4 { background: radial-gradient(circle at 0% 0%, rgba(192, 132, 252, 0.22) 0%, transparent 60%), rgba(16, 12, 26, 0.85); }

    .kpi-lbl {
      font-size: 10.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.8px; margin-bottom: 6px;
    }
    .kpi-lbl.c1 { color: #FDA4AF; }
    .kpi-lbl.c2 { color: #C084FC; }
    .kpi-lbl.c3 { color: #F472B6; }
    .kpi-lbl.c4 { color: #A78BFA; }

    .kpi-val {
      font-size: 26px; font-weight: 900; color: #FFF; letter-spacing: -0.5px; margin-bottom: 10px;
    }
    .kpi-ft {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 11px; color: #94A3B8; padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    /* BENTO ROW 2: ROOMS (8) + TOP MOVIES (4) */
    .bento-row-2 {
      display: grid; grid-template-columns: 2fr 1fr; gap: 20px;
      margin-bottom: 22px;
    }
    @media (max-width: 1024px) {
      .bento-row-2 { grid-template-columns: 1fr; }
    }

    .bento-card {
      background: radial-gradient(circle at 0% 0%, rgba(136, 19, 55, 0.18) 0%, transparent 55%), rgba(15, 11, 26, 0.85);
      border: 1px solid rgba(192, 132, 252, 0.22);
      border-radius: 18px; padding: 22px;
      backdrop-filter: blur(20px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    }
    .card-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .card-title {
      font-size: 12.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.8px; color: #C084FC; display: flex; align-items: center; gap: 6px;
    }
    .card-title span.star { color: #E11D48; }

    /* 5 ROOM PODS */
    .rooms-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
      margin-bottom: 14px;
    }
    @media (max-width: 640px) { .rooms-grid { grid-template-columns: 1fr; } }

    .room-pod {
      background: rgba(10, 8, 18, 0.85);
      border-radius: 12px; padding: 12px 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .room-pod.active {
      border: 1.5px solid rgba(225, 29, 72, 0.6);
      box-shadow: 0 0 16px rgba(225, 29, 72, 0.25);
    }
    .room-pod.cleaning {
      border: 1.5px solid rgba(168, 85, 247, 0.6);
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.25);
    }
    .pod-top {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
    }
    .pod-name { font-size: 11.5px; font-weight: 800; color: #FFF; }
    .pod-badge {
      font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;
      text-transform: uppercase; font-family: 'Chakra Petch', monospace;
    }
    .pod-badge.showing { background: rgba(225, 29, 72, 0.2); color: #FDA4AF; border: 1px solid #E11D48; }
    .pod-badge.cleaning { background: rgba(168, 85, 247, 0.2); color: #E9D5FF; border: 1px solid #C084FC; }
    .pod-badge.ready { background: rgba(255, 255, 255, 0.08); color: #CBD5E1; border: 1px solid rgba(255, 255, 255, 0.2); }

    .pod-movie { font-size: 12px; font-weight: 700; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
    .pod-time { font-size: 10.5px; color: #94A3B8; margin-bottom: 8px; }

    .pod-track {
      width: 100%; height: 5px; background: rgba(255, 255, 255, 0.08);
      border-radius: 999px; overflow: hidden; margin-bottom: 6px;
    }
    .pod-bar { height: 100%; }
    .pod-bar.red { background: linear-gradient(90deg, #E11D48, #FDA4AF); }
    .pod-bar.purple { background: linear-gradient(90deg, #881337, #C084FC); }

    .emergency-bar {
      margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex; justify-content: space-between; align-items: center;
    }
    .btn-emergency {
      padding: 6px 12px; border-radius: 6px; font-size: 10.5px; font-weight: 800;
      background: transparent; color: #FDA4AF;
      border: 1px solid rgba(225, 29, 72, 0.5); cursor: pointer;
    }
    .btn-emergency:hover { background: rgba(225, 29, 72, 0.2); color: #FFF; }

    /* TOP MOVIES POD */
    .top-movie-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      margin-bottom: 7px;
    }
    .rank-sq {
      width: 22px; height: 22px; border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      font-size: 10.5px; font-weight: 900;
    }
    .rank-sq.r1 { background: linear-gradient(135deg, #E11D48, #881337); color: #FFF; box-shadow: 0 0 10px rgba(225, 29, 72, 0.5); }
    .rank-sq.r2 { background: rgba(255, 255, 255, 0.08); color: #FFF; }
    .rank-sq.r3 { background: rgba(255, 255, 255, 0.05); color: #94A3B8; }

    .top-m-info { flex: 1; min-width: 0; }
    .top-m-info h4 { font-size: 11.5px; font-weight: 700; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-m-info p { font-size: 9.5px; color: #94A3B8; }
    .top-m-rev { text-align: right; }
    .top-m-rev b { font-size: 11.5px; font-weight: 800; color: #FDA4AF; font-family: 'Chakra Petch', monospace; }
    .top-m-rev small { display: block; font-size: 9.5px; color: #A78BFA; }

    /* ==============================================================
       BENTO ROW 3: ĐÂY LÀ VỊ TRÍ BIỂU ĐỒ STREAMGRAPH THAY THẾ (SPAN 8)
       VÀ LŨY KẾ TOÀN THỜI GIAN (SPAN 4)
       ============================================================== */
    .bento-row-3 {
      display: grid; grid-template-columns: 2fr 1fr; gap: 20px;
    }
    @media (max-width: 1024px) {
      .bento-row-3 { grid-template-columns: 1fr; }
    }

    /* KHUNG CHÍNH STREAMGRAPH BENTO */
    .streamgraph-bento-box {
      background: radial-gradient(circle at 0% 100%, rgba(136, 19, 55, 0.22) 0%, transparent 60%), rgba(15, 11, 26, 0.88);
      border: 1.5px solid rgba(225, 29, 72, 0.4);
      border-radius: 18px; padding: 22px;
      backdrop-filter: blur(24px);
      box-shadow: 0 12px 45px rgba(0,0,0,0.7), 0 0 25px rgba(225, 29, 72, 0.15);
      position: relative; overflow: hidden;
    }
    .highlight-corner {
      position: absolute; top: 0; right: 0;
      background: linear-gradient(135deg, #E11D48, #9F1239);
      color: #FFF; font-size: 9px; font-weight: 800; font-family: 'Chakra Petch', monospace;
      padding: 3px 12px; border-bottom-left-radius: 10px; letter-spacing: 1px;
    }

    .stream-split {
      display: grid; grid-template-columns: 240px 1fr; gap: 20px; align-items: center;
    }
    @media (max-width: 800px) {
      .stream-split { grid-template-columns: 1fr; }
    }

    /* CỘT TỶ LỆ DOANH THU */
    .stream-cat-card {
      padding: 10px 12px; border-radius: 10px; margin-bottom: 10px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .stream-cat-card.ticket {
      background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.3);
    }
    .stream-cat-card.combo {
      background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.3);
    }
    .cat-dot {
      width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
    }
    .cat-dot.red { background: #E11D48; box-shadow: 0 0 8px #E11D48; }
    .cat-dot.purple { background: #C084FC; box-shadow: 0 0 8px #C084FC; }

    /* SVG CANVAS (CHỈ ĐƯỜNG NÉT STROKE - FILL="NONE") */
    .stream-svg-box {
      width: 100%; height: auto;
    }
    svg.canvas-stream {
      width: 100%; height: auto; overflow: visible;
    }

    /* ALL-TIME LIFETIME POD */
    .lifetime-box {
      padding: 14px 16px; border-radius: 12px;
      background: rgba(10, 8, 18, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.07);
      margin-bottom: 12px;
    }
    .lifetime-lbl {
      font-size: 10px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.8px; color: #A78BFA; display: block; margin-bottom: 4px;
    }
    .lifetime-val {
      font-size: 22px; font-weight: 900; color: #FFF;
    }
  </style>
</head>
<body>
  <div class="bg-nebula"></div>

  <!-- TOP PREVIEW NOTICE -->
  <div class="preview-banner">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span class="preview-tag">BẢN XEM TRƯỚC VỊ TRÍ THỰC TẾ</span>
      <span style="color: #FDA4AF; font-weight: 700;">Biểu đồ Streamgraph được tích hợp trực tiếp vào Trang Tổng Quan (/admin/dashboard)</span>
    </div>
    <div style="color: #94A3B8; font-size: 11px;">
      ✦ Thay thế khối biểu đồ cột cũ · Dữ liệu đối soát từ PostgreSQL
    </div>
  </div>

  <div class="app-layout">
    <!-- 1. ADMIN SIDEBAR (CỘT ĐIỀU HƯỚNG TRÁI) -->
    <aside class="admin-sidebar">
      <div>
        <div class="brand-box">
          <div class="brand-icon">✦</div>
          <div class="brand-text">
            <h2>LUMI CINEMA</h2>
            <p>COMMAND DECK</p>
          </div>
        </div>

        <nav class="nav-list">
          <a href="#" class="nav-link active">✦ Dashboard Tổng Quan</a>
          <a href="#" class="nav-link">Quản Lý Phim</a>
          <a href="#" class="nav-link">Suất Chiếu &amp; Lịch</a>
          <a href="#" class="nav-link">Tra Cứu Vé</a>
          <a href="#" class="nav-link">Bảng Giá Vé</a>
          <a href="#" class="nav-link">Voucher &amp; Khuyến Mãi</a>
          <a href="#" class="nav-link">Combo Bắp Nước</a>
          <a href="#" class="nav-link">Báo Cáo Kế Toán (BR-10)</a>
          <a href="#" class="nav-link">Đánh Giá Khán Giả</a>
        </nav>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar">GV</div>
        <div class="user-info">
          <h5>Mã Gia Vỹ (Admin)</h5>
          <p>admin@lumicinema.vn</p>
        </div>
      </div>
    </aside>

    <!-- 2. MAIN DASHBOARD CONTENT -->
    <main class="main-content">
      <!-- HEADER -->
      <header class="page-header">
        <div class="header-left">
          <h1>
            BẢNG ĐIỀU HÀNH BENTO GRID · TRẠM CHỈ HUY TRUNG TÂM
            <span class="badge-command">BR-10 COMMAND</span>
          </h1>
          <p>Giám sát thời gian thực 5 buồng chiếu, kiểm soát 15 phút dọn dẹp (BR-08) &amp; tài chính kế toán (BR-10)</p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh">Làm Mới Dữ Liệu</button>
          <button class="btn-export">XUẤT BÁO CÁO DOANH THU (UC-19)</button>
        </div>
      </header>

      <!-- ROW 1: 4 BENTO KPI CARDS -->
      <section class="bento-kpi-grid">
        <!-- KPI 1 -->
        <div class="bento-kpi-card c1">
          <div class="kpi-lbl c1">TỔNG DOANH THU HÔM NAY (BR-10)</div>
          <div class="kpi-val num">4.676.000 đ</div>
          <div class="kpi-ft">
            <span>Hóa đơn ZaloPay &amp; Tiền mặt</span>
            <span style="color: #86EFAC; font-weight: 700;">+100% DB</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="bento-kpi-card c2">
          <div class="kpi-lbl c2">TỔNG VÉ ĐÃ XUẤT</div>
          <div class="kpi-val num">22 vé</div>
          <div class="kpi-ft">
            <span>100% Vé thường qua cửa</span>
            <span style="color: #86EFAC; font-weight: 700;">3.025.000đ</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="bento-kpi-card c3">
          <div class="kpi-lbl c3">DOANH THU BẮP NƯỚC</div>
          <div class="kpi-val num">1.651.000 đ</div>
          <div class="kpi-ft">
            <span>11 Combo tại quầy &amp; app</span>
            <span style="color: #86EFAC; font-weight: 700;">35.3%</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="bento-kpi-card c4">
          <div class="kpi-lbl c4">TỶ LỆ LẤP ĐẦY RẠP (OCCUPANCY)</div>
          <div class="kpi-val num">78.5%</div>
          <div class="kpi-ft">
            <span>196 / 250 ghế đang kín</span>
            <span style="color: #86EFAC; font-weight: 700;">+6.1%</span>
          </div>
        </div>
      </section>

      <!-- ROW 2: 5 BUỒNG CHIẾU (8) + TOP BOX OFFICE (4) -->
      <section class="bento-row-2">
        <!-- BUỒNG CHIẾU -->
        <div class="bento-card">
          <div class="card-head">
            <div class="card-title">
              <span class="star">✦</span> HERO BENTO: TRẠM GIÁM SÁT 5 BUỒNG CHIẾU THỜI GIAN THỰC
            </div>
            <span style="font-size: 11px; color: #A78BFA; font-weight: 600;">Đồng bộ kiểm soát suất chiếu &amp; 15p dọn phòng (BR-08)</span>
          </div>

          <div class="rooms-grid">
            <!-- P1 -->
            <div class="room-pod active">
              <div class="pod-top">
                <span class="pod-name">Phòng 01 · Laser 4K Cosmos</span>
                <span class="pod-badge showing">ĐANG CHIẾU</span>
              </div>
              <div class="pod-movie">Spider-Man: Beyond the Spider-Verse</div>
              <div class="pod-time">19:30 - 21:50 · Lấp đầy: 48 / 50 ghế (96%)</div>
              <div class="pod-track"><div class="pod-bar red" style="width: 85%;"></div></div>
            </div>

            <!-- P2 -->
            <div class="room-pod active">
              <div class="pod-top">
                <span class="pod-name">Phòng 02 · Dolby Atmos 360</span>
                <span class="pod-badge showing">ĐANG CHIẾU</span>
              </div>
              <div class="pod-movie">Dune: Hành Tinh Cát - Phần Hai</div>
              <div class="pod-time">20:15 - 23:01 · Lấp đầy: 46 / 50 ghế (92%)</div>
              <div class="pod-track"><div class="pod-bar red" style="width: 45%;"></div></div>
            </div>

            <!-- P3 -->
            <div class="room-pod cleaning">
              <div class="pod-top">
                <span class="pod-name">Phòng 03 · Standard 2D</span>
                <span class="pod-badge cleaning">⏳ DỌN PHÒNG 15P</span>
              </div>
              <div class="pod-movie">Vừa kết thúc: Quật Mộ Trùng Ma</div>
              <div class="pod-time">Dọn dẹp: 19:45 - 20:00 · Còn 07:12</div>
              <div class="pod-track"><div class="pod-bar purple" style="width: 52%;"></div></div>
            </div>

            <!-- P4 -->
            <div class="room-pod">
              <div class="pod-top">
                <span class="pod-name">Phòng 04 · Laser 4K Cosmos</span>
                <span class="pod-badge ready">SẴN SÀNG</span>
              </div>
              <div class="pod-movie">Suất kế tiếp: Kung Fu Panda 4</div>
              <div class="pod-time">Bắt đầu: 20:30 (Mở cửa soát vé 20:15)</div>
              <div class="pod-track"><div class="pod-bar" style="width: 0%;"></div></div>
            </div>
          </div>

          <div class="emergency-bar">
            <span style="font-size: 11px; color: #94A3B8;">Thủ tục hoàn vé khẩn cấp tự động kích hoạt ZaloPay Refund (BR-04/BR-05)</span>
            <button class="btn-emergency">HỦY SUẤT CHIẾU SỰ CỐ</button>
          </div>
        </div>

        <!-- TOP PHIM BOX OFFICE -->
        <div class="bento-card">
          <div class="card-head">
            <div class="card-title">
              <span class="star">✦</span> BẢNG XẾP HẠNG DOANH THU PHIM
            </div>
            <span style="font-size: 10px; color: #FDA4AF; font-weight: 700;">TOP BOX OFFICE</span>
          </div>

          <div class="top-movie-row">
            <span class="rank-sq r1">1</span>
            <div class="top-m-info">
              <h4>Spider-Man: Beyond</h4>
              <p>140 phút • Hoạt hình, Hành động</p>
            </div>
            <div class="top-m-rev">
              <b>2.650.000đ</b>
              <small>20 vé đã bán</small>
            </div>
          </div>

          <div class="top-movie-row">
            <span class="rank-sq r2">2</span>
            <div class="top-m-info">
              <h4>Dune: Messiah (Phần 3)</h4>
              <p>165 phút • Khoa học viễn tưởng</p>
            </div>
            <div class="top-m-rev">
              <b>140.000đ</b>
              <small>1 vé đã bán</small>
            </div>
          </div>

          <div class="top-movie-row">
            <span class="rank-sq r3">3</span>
            <div class="top-m-info">
              <h4>Mission: Impossible 9</h4>
              <p>150 phút • Hành động kịch tính</p>
            </div>
            <div class="top-m-rev">
              <b>120.000đ</b>
              <small>1 vé đã bán</small>
            </div>
          </div>

          <div style="padding-top: 10px; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: #94A3B8;">Tổng 11 phim trong kho</span>
            <a href="#" style="color: #C084FC; font-weight: 700;">Xem tất cả phim →</a>
          </div>
        </div>
      </section>

      <!-- ROW 3: VỊ TRÍ STREAMGRAPH MỚI (SPAN 8) + LŨY KẾ TOÀN THỜI GIAN (SPAN 4) -->
      <section class="bento-row-3">
        <!-- KHỐI STREAMGRAPH DOANH THU MỚI (THAY THẾ BIỂU ĐỒ CỘT CŨ) -->
        <div class="streamgraph-bento-box">
          <div class="highlight-corner">VỊ TRÍ THAY THẾ BIỂU ĐỒ CỘT CŨ</div>

          <div class="card-head">
            <div>
              <div class="card-title">
                <span class="star">✦</span> BIỂU ĐỒ DÒNG CHẢY DOANH THU ĐỐI XỨNG (REALTIME STREAMGRAPH)
              </div>
              <p style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
                Phân bổ thời gian thực giữa Vé Thường và Combo Bắp Nước (Đường nét thuần túy · Chuẩn dữ liệu PostgreSQL)
              </p>
            </div>

            <div style="display: flex; gap: 4px;">
              <button style="padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 700; background: rgba(255,255,255,0.05); color: #94A3B8; border: 1px solid rgba(255,255,255,0.08); cursor: pointer;">7 Ngày Qua</button>
              <button style="padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 700; background: rgba(255,255,255,0.05); color: #94A3B8; border: 1px solid rgba(255,255,255,0.08); cursor: pointer;">30 Ngày Qua</button>
              <button style="padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 700; background: linear-gradient(135deg, #E11D48, #9F1239); color: #FFF; border: none; box-shadow: 0 0 10px rgba(225,29,72,0.4); cursor: pointer;">Toàn thời gian</button>
            </div>
          </div>

          <!-- PHẦN THÂN STREAMGRAPH: CỘT TỶ LỆ TRÁI + SVG PHẢI -->
          <div class="stream-split">
            <!-- Cột trái: Tỷ trọng 2 nguồn thu thực tế -->
            <div>
              <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                TỔNG DOANH THU THỰC TẾ
              </div>
              <div class="num" style="font-size: 26px; font-weight: 900; color: #FFF; margin-bottom: 2px;">
                4.676.000đ
              </div>
              <div style="font-size: 10.5px; color: #34D399; font-weight: 700; margin-bottom: 14px;">
                &uarr; Dữ liệu đối soát trực tiếp DB
              </div>

              <!-- Thẻ Vé Thường -->
              <div class="stream-cat-card ticket">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="cat-dot red"></span>
                  <div>
                    <div style="font-size: 11.5px; font-weight: 700; color: #FFF;">Vé Xem Phim (Vé Thường)</div>
                    <small style="font-size: 10px; color: #94A3B8;">22 vé đã thanh toán</small>
                  </div>
                </div>
                <div style="text-align: right; font-family: 'Chakra Petch', monospace;">
                  <div style="font-size: 10px; color: #FDA4AF; font-weight: 700;">64.7%</div>
                  <b style="font-size: 12px; color: #FFF;">3.025.000đ</b>
                </div>
              </div>

              <!-- Thẻ Combo Bắp Nước -->
              <div class="stream-cat-card combo">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="cat-dot purple"></span>
                  <div>
                    <div style="font-size: 11.5px; font-weight: 700; color: #FFF;">Combo Bắp Nước (F&amp;B)</div>
                    <small style="font-size: 10px; color: #94A3B8;">11 phần bắp nước</small>
                  </div>
                </div>
                <div style="text-align: right; font-family: 'Chakra Petch', monospace;">
                  <div style="font-size: 10px; color: #C084FC; font-weight: 700;">35.3%</div>
                  <b style="font-size: 12px; color: #FFF;">1.651.000đ</b>
                </div>
              </div>
            </div>

            <!-- Cột phải: SVG Streamgraph (CHỈ ĐƯỜNG NÉT THUẦN TÚY - FILL="NONE") -->
            <div class="stream-svg-box">
              <svg class="canvas-stream" viewBox="0 0 680 260">
                <defs>
                  <filter id="glowTkt" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#E11D48" flood-opacity="0.95"/>
                  </filter>
                  <filter id="glowCmb" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#C084FC" flood-opacity="0.95"/>
                  </filter>
                </defs>

                <!-- Gridlines Y-axis -->
                <text x="35" y="32" fill="#64748B" font-size="9" font-family="'Chakra Petch', monospace" text-anchor="end">5.0M</text>
                <line x1="42" y1="28" x2="650" y2="28" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 2"/>

                <text x="35" y="66" fill="#64748B" font-size="9" font-family="'Chakra Petch', monospace" text-anchor="end">3.0M</text>
                <line x1="42" y1="62" x2="650" y2="62" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 2"/>

                <text x="35" y="100" fill="#64748B" font-size="9" font-family="'Chakra Petch', monospace" text-anchor="end">1.5M</text>
                <line x1="42" y1="96" x2="650" y2="96" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 2"/>

                <!-- Baseline 0 -->
                <text x="35" y="134" fill="#94A3B8" font-size="9.5" font-weight="700" font-family="'Chakra Petch', monospace" text-anchor="end">0</text>
                <line x1="42" y1="130" x2="650" y2="130" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"/>

                <text x="35" y="168" fill="#64748B" font-size="9" font-family="'Chakra Petch', monospace" text-anchor="end">-1.5M</text>
                <line x1="42" y1="164" x2="650" y2="164" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 2"/>

                <text x="35" y="202" fill="#64748B" font-size="9" font-family="'Chakra Petch', monospace" text-anchor="end">-3.0M</text>
                <line x1="42" y1="198" x2="650" y2="198" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 2"/>

                <text x="35" y="236" fill="#64748B" font-size="9" font-family="'Chakra Petch', monospace" text-anchor="end">-5.0M</text>
                <line x1="42" y1="232" x2="650" y2="232" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 2"/>

                <!-- ĐƯỜNG CONG STROKE ONLY (KHÔNG CÓ VỆT FILL) -->
                <!-- Vé thường trên -->
                <path d="M 60 130 C 170 128, 260 38, 400 38 C 510 38, 560 128, 630 130" 
                      fill="none" stroke="#E11D48" stroke-width="2.6" filter="url(#glowTkt)"/>
                <!-- Combo trên -->
                <path d="M 60 130 C 170 129, 260 88, 400 88 C 510 88, 560 129, 630 130" 
                      fill="none" stroke="#C084FC" stroke-width="2.2" filter="url(#glowCmb)"/>
                <!-- Combo dưới đối xứng -->
                <path d="M 60 130 C 170 131, 260 172, 400 172 C 510 172, 560 131, 630 130" 
                      fill="none" stroke="#C084FC" stroke-width="2.2" opacity="0.85"/>
                <!-- Vé thường dưới đối xứng -->
                <path d="M 60 130 C 170 132, 260 222, 400 222 C 510 222, 560 132, 630 130" 
                      fill="none" stroke="#E11D48" stroke-width="2.6" opacity="0.85"/>

                <!-- Đường chỉ tiêu dọc X=400 -->
                <line x1="400" y1="18" x2="400" y2="242" stroke="#FDA4AF" stroke-width="1.2" stroke-dasharray="3 3"/>

                <!-- Chấm neo giao điểm -->
                <circle cx="400" cy="38" r="5" fill="#E11D48" stroke="#FFF" stroke-width="1.8" filter="url(#glowTkt)"/>
                <circle cx="400" cy="88" r="4.2" fill="#C084FC" stroke="#050508" stroke-width="1.8" filter="url(#glowCmb)"/>
                <circle cx="400" cy="130" r="3" fill="#FFF" stroke="#050508" stroke-width="1.2"/>
                <circle cx="400" cy="172" r="4.2" fill="#C084FC" stroke="#050508" stroke-width="1.8"/>
                <circle cx="400" cy="222" r="5" fill="#E11D48" stroke="#FFF" stroke-width="1.8"/>

                <!-- Tooltip badge đỉnh -->
                <g transform="translate(345, 4)">
                  <rect x="0" y="0" width="110" height="24" rx="5" fill="rgba(18, 14, 28, 0.95)" stroke="#FDA4AF" stroke-width="1"/>
                  <text x="55" y="16" fill="#FFF" font-size="10.5" font-weight="700" text-anchor="middle" font-family="'Chakra Petch', monospace">4.676.000đ</text>
                </g>

                <!-- Trục X -->
                <text x="60" y="254" fill="#64748B" font-size="9.5" text-anchor="middle">Thg 8</text>
                <text x="200" y="254" fill="#64748B" font-size="9.5" text-anchor="middle">Thg 9</text>
                <text x="400" y="254" fill="#FDA4AF" font-size="10" font-weight="800" text-anchor="middle">Thg 9 - 10 (Hiện tại)</text>
                <text x="530" y="254" fill="#64748B" font-size="9.5" text-anchor="middle">Thg 11</text>
                <text x="630" y="254" fill="#64748B" font-size="9.5" text-anchor="middle">Thg 12</text>
              </svg>
            </div>
          </div>
        </div>

        <!-- LŨY KẾ TOÀN THỜI GIAN (SPAN 4) -->
        <div class="bento-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="card-head">
              <div class="card-title">
                <span class="star">✦</span> LŨY KẾ TOÀN THỜI GIAN
              </div>
              <span style="font-size: 10px; color: #A78BFA; font-weight: 700;">ALL-TIME LIFETIME</span>
            </div>

            <div class="lifetime-box">
              <span class="lifetime-lbl">TỔNG DOANH THU TOÀN HỆ THỐNG</span>
              <span class="lifetime-val num">4.676.000 đ</span>
              <span style="font-size: 10px; color: #94A3B8; display: block; margin-top: 2px;">Doanh thu vé &amp; bắp nước thực nhận</span>
            </div>

            <div class="lifetime-box">
              <span class="lifetime-lbl">TỔNG SỐ VÉ ĐÃ XUẤT RA</span>
              <span class="lifetime-val num" style="color: #86EFAC;">22 vé</span>
              <span style="font-size: 10px; color: #94A3B8; display: block; margin-top: 2px;">Tất cả các rạp và phòng chiếu</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: center;">
              <div style="padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 9.5px; color: #94A3B8; display: block;">Phim trong kho</span>
                <b style="font-size: 13px; color: #FFF;">11 Phim</b>
              </div>
              <div style="padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 9.5px; color: #94A3B8; display: block;">Suất vận hành</span>
                <b style="font-size: 13px; color: #C084FC;">48 Suất</b>
              </div>
            </div>
          </div>

          <div style="padding-top: 10px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 10px; color: #64748B;">
            Đồng bộ với cơ sở dữ liệu PostgreSQL &amp; Prisma Client
          </div>
        </div>
      </section>
    </main>
  </div>
</body>
</html>
"""

dest = r"D:\cinema_project\cinema-app\public\admin-preview\dashboard-full-preview.html"
with open(dest, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated full dashboard prototype at {dest} ({len(html_content)} bytes)")
