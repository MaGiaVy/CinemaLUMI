import os

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LumiCinema // Executive Command Deck - Realtime Streamgraph</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #050508;
      color: #F8FAFC;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 60px;
      overflow-x: hidden;
    }
    a { text-decoration: none; color: inherit; }
    button, input, select { font: inherit; }
    .num { font-variant-numeric: tabular-nums; }
    .tech { font-family: 'Chakra Petch', monospace; }

    /* COSMIC SPACE NEBULA BACKGROUND */
    .bg-nebula {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background: 
        radial-gradient(circle at 15% 20%, rgba(225, 29, 72, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 15%, rgba(136, 19, 55, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 50% 55%, rgba(88, 28, 135, 0.15) 0%, transparent 60%),
        radial-gradient(circle at 80% 85%, rgba(192, 132, 252, 0.08) 0%, transparent 40%),
        #050508;
    }

    /* TOP BAR SWITCHER (STYLE FUSION) */
    .duo-sw-bar {
      position: sticky; top: 0; z-index: 9999;
      background: rgba(8, 6, 15, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(192, 132, 252, 0.18);
      padding: 9px 24px; font-size: 11.5px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.6);
    }
    .duo-sw-inner {
      max-width: 1560px; margin: 0 auto; display: flex;
      align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;
    }
    .duo-sw-title { color: #94A3B8; display: flex; align-items: center; gap: 8px; font-size: 11px; }
    .duo-sw-title b { color: #FDA4AF; font-family: 'Chakra Petch', monospace; font-size: 11.5px; font-weight: 700; }
    .duo-sw-links { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .duo-sw-btn {
      padding: 5px 12px; border-radius: 6px; font-weight: 700;
      font-size: 11px; transition: all 0.2s; text-decoration: none;
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255, 255, 255, 0.04);
      color: #94A3B8;
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
    }
    .duo-sw-btn:hover { color: #FFF; background: rgba(255, 255, 255, 0.08); border-color: rgba(192, 132, 252, 0.3); }
    .duo-sw-btn.active {
      background: linear-gradient(135deg, #E11D48 0%, #9F1239 100%);
      color: #FFFFFF; border-color: #FDA4AF;
      box-shadow: 0 0 16px rgba(225, 29, 72, 0.55);
    }
    .duo-sw-btn.store {
      background: linear-gradient(135deg, #7C3AED 0%, #581C87 100%);
      color: #FFF; border-color: #C084FC;
    }

    /* MAIN WRAP */
    .page-wrap {
      position: relative; z-index: 10;
      max-width: 1560px; margin: 0 auto;
      padding: 24px 24px 0 24px;
    }

    /* HEADER COMMAND DECK */
    .command-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 16px; margin-bottom: 22px;
    }
    .command-title-grp { display: flex; align-items: center; gap: 14px; }
    .command-badge-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #E11D48 0%, #581C87 100%);
      border: 1px solid rgba(253, 164, 175, 0.4);
      box-shadow: 0 0 20px rgba(225, 29, 72, 0.45);
      display: flex; align-items: center; justify-content: center;
      color: #FFF; font-size: 20px; font-weight: 900;
    }
    .command-text b {
      font-family: 'Chakra Petch', monospace; font-size: 11px;
      letter-spacing: 1.5px; text-transform: uppercase;
      color: #C084FC; display: block; margin-bottom: 2px;
    }
    .command-text h1 {
      font-size: 23px; font-weight: 800; letter-spacing: -0.5px;
      color: #F8FAFC; text-transform: uppercase;
      display: flex; align-items: center; gap: 8px;
    }
    .command-text h1 span {
      background: linear-gradient(90deg, #E11D48, #C084FC, #FDA4AF);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .header-ctrls {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .status-pill {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 6px 12px; border-radius: 999px;
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34D399; font-size: 11px; font-weight: 700;
      font-family: 'Chakra Petch', monospace; letter-spacing: 0.5px;
    }
    .pulse-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #10B981;
      box-shadow: 0 0 10px #10B981;
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .seg-tabs {
      display: inline-flex; align-items: center;
      background: rgba(18, 14, 28, 0.85);
      border: 1px solid rgba(192, 132, 252, 0.2);
      border-radius: 8px; padding: 3px; gap: 3px;
    }
    .seg-btn {
      background: transparent; border: none; color: #94A3B8;
      padding: 6px 14px; font-size: 11.5px; font-weight: 700;
      border-radius: 6px; cursor: pointer; transition: all 0.2s;
    }
    .seg-btn:hover { color: #FFF; }
    .seg-btn.active {
      background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%);
      color: #FFF; box-shadow: 0 0 12px rgba(225, 29, 72, 0.4);
    }

    /* 4 KPI CARDS ROW (DỮ LIỆU THỰC TẾ DATABASE) */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
      margin-bottom: 22px;
    }
    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card {
      position: relative; overflow: hidden;
      background: rgba(18, 14, 28, 0.75);
      border: 1px solid rgba(192, 132, 252, 0.22);
      border-radius: 16px; padding: 18px 20px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(225, 29, 72, 0.45);
      box-shadow: 0 12px 35px rgba(225, 29, 72, 0.2);
    }
    .kpi-card.red::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, #E11D48, #FDA4AF);
    }
    .kpi-card.purple::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, #A855F7, #C084FC);
    }
    .kpi-card.pink::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, #F43F5E, #FDA4AF);
    }
    .kpi-card.gold::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, #F59E0B, #FDE68A);
    }

    .kpi-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    }
    .kpi-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #94A3B8;
    }
    .kpi-tag {
      font-size: 9.5px; font-weight: 800; font-family: 'Chakra Petch', monospace;
      padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;
    }
    .kpi-tag.vnd { background: rgba(225, 29, 72, 0.15); color: #FDA4AF; border: 1px solid rgba(225, 29, 72, 0.3); }
    .kpi-tag.purple { background: rgba(168, 85, 247, 0.15); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.3); }
    .kpi-tag.pink { background: rgba(244, 63, 94, 0.15); color: #FDA4AF; border: 1px solid rgba(244, 63, 94, 0.3); }
    .kpi-tag.gold { background: rgba(245, 158, 11, 0.15); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.3); }

    .kpi-value {
      font-size: 27px; font-weight: 800; color: #F8FAFC;
      letter-spacing: -0.5px; margin-bottom: 12px;
    }
    .kpi-footer {
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .kpi-meta { font-size: 11px; color: #94A3B8; }
    .kpi-growth { color: #34D399; font-weight: 700; display: inline-flex; align-items: center; gap: 2px; }
    .kpi-sub { color: #64748B; font-size: 10.5px; margin-top: 2px; }

    .sparkline-svg { width: 90px; height: 26px; }

    /* ========================================================
       CORE REALTIME STREAMGRAPH CONTAINER
       ======================================================== */
    .streamgraph-card {
      background: rgba(18, 14, 28, 0.82);
      border: 1px solid rgba(192, 132, 252, 0.25);
      border-radius: 20px; padding: 24px;
      backdrop-filter: blur(24px);
      box-shadow: 0 15px 50px rgba(0,0,0,0.7);
      margin-bottom: 24px;
      position: relative; overflow: hidden;
    }
    .streamgraph-card::after {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(circle at 75% 45%, rgba(225, 29, 72, 0.08) 0%, transparent 60%);
    }

    .stream-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 14px; padding-bottom: 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      margin-bottom: 20px;
    }
    .stream-status-tag {
      display: inline-flex; align-items: center; gap: 7px;
      color: #34D399; font-size: 11px; font-weight: 700;
      font-family: 'Chakra Petch', monospace; letter-spacing: 1px;
    }
    .month-nav {
      display: flex; align-items: center; gap: 4px;
    }
    .month-pill {
      padding: 5px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 700;
      color: #94A3B8; background: transparent; border: none; cursor: pointer;
      transition: all 0.2s; font-family: 'Chakra Petch', monospace;
    }
    .month-pill:hover { color: #FFF; background: rgba(255, 255, 255, 0.06); }
    .month-pill.active {
      background: linear-gradient(135deg, #E11D48, #9F1239);
      color: #FFF; box-shadow: 0 0 14px rgba(225, 29, 72, 0.5);
    }

    /* 2 COLUMNS INSIDE STREAMGRAPH CARD */
    .stream-body-grid {
      display: grid; grid-template-columns: 320px 1fr; gap: 26px;
      align-items: center;
    }
    @media (max-width: 1024px) {
      .stream-body-grid { grid-template-columns: 1fr; }
    }

    /* LEFT STATS COLUMN (ĐÚNG DỮ LIỆU THỰC TẾ POSTGRESQL) */
    .stream-stats-col {
      padding-right: 20px;
      border-right: 1px solid rgba(255, 255, 255, 0.07);
    }
    @media (max-width: 1024px) {
      .stream-stats-col { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 18px; }
    }
    .stream-total-label {
      font-size: 11px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1.2px; color: #94A3B8; margin-bottom: 4px;
    }
    .stream-total-amount {
      font-size: 32px; font-weight: 800; color: #F8FAFC;
      letter-spacing: -0.8px; margin-bottom: 4px;
    }
    .stream-total-growth {
      font-size: 11.5px; color: #34D399; font-weight: 700;
      display: flex; align-items: center; gap: 4px; margin-bottom: 20px;
    }

    .stream-breakdown-title {
      font-size: 11px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1px; color: #C084FC; margin-bottom: 12px;
      display: flex; align-items: center; gap: 6px;
    }
    .breakdown-list {
      display: flex; flex-direction: column; gap: 12px;
    }
    .breakdown-item-box {
      padding: 12px 14px; border-radius: 10px;
      display: flex; justify-content: space-between; align-items: center;
      transition: all 0.2s;
    }
    .breakdown-item-box:hover {
      transform: translateX(3px);
    }
    .breakdown-item-box.ticket {
      background: rgba(225, 29, 72, 0.08);
      border: 1px solid rgba(225, 29, 72, 0.28);
    }
    .breakdown-item-box.combo {
      background: rgba(168, 85, 247, 0.08);
      border: 1px solid rgba(168, 85, 247, 0.28);
    }
    .breakdown-left {
      display: flex; align-items: center; gap: 10px;
    }
    .breakdown-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .breakdown-label {
      font-weight: 700; font-size: 12.5px; color: #F8FAFC;
    }
    .breakdown-desc {
      font-size: 10.5px; color: #94A3B8; margin-top: 2px;
    }
    .breakdown-right {
      text-align: right; font-family: 'Chakra Petch', monospace;
    }
    .breakdown-pct {
      font-size: 11px; font-weight: 700;
    }
    .breakdown-val {
      font-size: 13.5px; font-weight: 800; color: #FFF; margin-top: 2px;
    }

    /* RIGHT STREAM VISUALIZATION */
    .stream-chart-col {
      position: relative; width: 100%;
    }
    .stream-svg-wrap {
      width: 100%; height: auto;
      min-height: 290px;
    }
    svg.stream-canvas {
      width: 100%; height: 100%; overflow: visible;
    }

    /* BOTTOM 2 COLUMNS */
    .bottom-grid {
      display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px;
    }
    @media (max-width: 1024px) {
      .bottom-grid { grid-template-columns: 1fr; }
    }

    .sub-card {
      background: rgba(18, 14, 28, 0.75);
      border: 1px solid rgba(192, 132, 252, 0.2);
      border-radius: 16px; padding: 20px;
      backdrop-filter: blur(20px);
    }
    .sub-card-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .sub-card-title {
      font-size: 13px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.8px; color: #F8FAFC;
    }
    .sub-card-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .sub-card-link {
      font-size: 11.5px; font-weight: 700; color: #C084FC;
      transition: color 0.2s;
    }
    .sub-card-link:hover { color: #FDA4AF; }

    /* TABLE */
    .mini-table {
      width: 100%; border-collapse: collapse; font-size: 11.5px;
    }
    .mini-table th {
      text-align: left; padding: 8px 10px; color: #94A3B8;
      font-weight: 700; font-size: 10.5px; text-transform: uppercase;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .mini-table td {
      padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #E2E8F0;
    }
    .mini-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .chip-status {
      padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;
      display: inline-block;
    }
    .chip-status.paid { background: rgba(16, 185, 129, 0.15); color: #34D399; }
    .chip-status.wait { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }
    .chip-btn {
      padding: 4px 10px; border-radius: 6px; background: rgba(225, 29, 72, 0.15);
      border: 1px solid rgba(225, 29, 72, 0.4); color: #FDA4AF;
      font-size: 10.5px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .chip-btn:hover { background: #E11D48; color: #FFF; }

    /* TOP 3 MOVIES LIST */
    .top-movie-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px; border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 8px; transition: all 0.2s;
    }
    .top-movie-item:hover {
      border-color: rgba(192, 132, 252, 0.3);
      background: rgba(255, 255, 255, 0.04);
    }
    .top-rank-badge {
      width: 24px; height: 24px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 900;
    }
    .top-rank-badge.rank1 {
      background: linear-gradient(135deg, #E11D48, #9F1239);
      color: #FFF; box-shadow: 0 0 10px rgba(225, 29, 72, 0.5);
    }
    .top-rank-badge.rank2 {
      background: rgba(255, 255, 255, 0.1); color: #FFF;
    }
    .top-rank-badge.rank3 {
      background: rgba(255, 255, 255, 0.06); color: #94A3B8;
    }
    .top-movie-img {
      width: 36px; height: 48px; border-radius: 6px;
      object-fit: cover; border: 1px solid rgba(192, 132, 252, 0.2);
    }
    .top-movie-info { flex: 1; min-width: 0; }
    .top-movie-info h4 {
      font-size: 12px; font-weight: 700; color: #F8FAFC;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .top-movie-info p { font-size: 10.5px; color: #94A3B8; margin-top: 2px; }
    .top-movie-revenue { text-align: right; }
    .top-movie-revenue b {
      font-size: 12px; font-weight: 800; color: #FDA4AF;
      font-family: 'Chakra Petch', monospace;
    }
    .top-movie-revenue small {
      display: block; font-size: 10px; color: #A78BFA;
    }
  </style>
</head>
<body>
  <div class="bg-nebula"></div>

  <!-- DUO SWITCHER TOP BAR -->
  <div class="duo-sw-bar">
    <div class="duo-sw-inner">
      <div class="duo-sw-title">
        <span>5 KIỂU DASHBOARD ADMIN:</span>
      </div>
      <div class="duo-sw-links">
        <button class="duo-sw-btn">Kiểu 1: Cổ Điển Cơ Khí</button>
        <button class="duo-sw-btn">Kiểu 2: Thụy Sĩ Tối Giản</button>
        <button class="duo-sw-btn">Kiểu 3: Hiện Đại SaaS</button>
        <button class="duo-sw-btn active">Kiểu 4: Khoang Vũ Trụ Streamgraph</button>
        <button class="duo-sw-btn">Kiểu 5: Dày Dữ Liệu</button>
        <a href="/" class="duo-sw-btn store">✦ Về Trang Khách Hàng →</a>
      </div>
    </div>
  </div>

  <main class="page-wrap">
    <!-- COMMAND DECK HEADER -->
    <header class="command-header">
      <div class="command-title-grp">
        <div class="command-badge-icon">✦</div>
        <div class="command-text">
          <b>COMMAND DECK // DUAL CONTRAST ARCHITECTURE</b>
          <h1>TỔNG QUAN TĂNG TRƯỞNG &amp; <span>VẬN HÀNH RẠP CHIẾU PHIM</span></h1>
        </div>
      </div>
      <div class="header-ctrls">
        <div class="status-pill">
          <span class="pulse-dot"></span>
          <span>STREAMGRAPH // HOẠT ĐỘNG 100%</span>
        </div>
        <div class="seg-tabs">
          <button class="seg-btn">Hôm nay</button>
          <button class="seg-btn">7 ngày qua</button>
          <button class="seg-btn active">Toàn thời gian</button>
          <button class="seg-btn">Năm 2026</button>
        </div>
      </div>
    </header>

    <!-- 4 KPI CARDS (DỮ LIỆU THỰC TẾ DATABASE POSTGRESQL) -->
    <section class="kpi-grid">
      <!-- KPI 1: TỔNG DOANH THU THỰC TẾ -->
      <div class="kpi-card red">
        <div class="kpi-header">
          <span class="kpi-title">DOANH THU THỰC TẾ</span>
          <span class="kpi-tag vnd">VND · ZALOPAY</span>
        </div>
        <div class="kpi-value num">4.676.000đ</div>
        <div class="kpi-footer">
          <div>
            <span class="kpi-growth">&uarr; 100% DB</span>
            <div class="kpi-sub">23 đơn thanh toán Success</div>
          </div>
          <!-- Sparkline Red -->
          <svg class="sparkline-svg" viewBox="0 0 90 26">
            <path d="M 0 20 Q 20 22, 40 14 T 70 8 T 90 2" fill="none" stroke="#E11D48" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="90" cy="2" r="3" fill="#FDA4AF"/>
          </svg>
        </div>
      </div>

      <!-- KPI 2: VÉ XEM PHIM (VÉ THƯỜNG) -->
      <div class="kpi-card purple">
        <div class="kpi-header">
          <span class="kpi-title">VÉ XEM PHIM (VÉ THƯỜNG)</span>
          <span class="kpi-tag purple">SOÁT VÉ</span>
        </div>
        <div class="kpi-value num">22 Vé</div>
        <div class="kpi-footer">
          <div>
            <span class="kpi-growth">&uarr; 3.025.000đ</span>
            <div class="kpi-sub">100% vé hợp lệ qua cửa</div>
          </div>
          <!-- Sparkline Purple -->
          <svg class="sparkline-svg" viewBox="0 0 90 26">
            <path d="M 0 18 Q 20 10, 40 18 T 70 8 T 90 5" fill="none" stroke="#A855F7" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="90" cy="5" r="3" fill="#C084FC"/>
          </svg>
        </div>
      </div>

      <!-- KPI 3: COMBO BẮP NƯỚC -->
      <div class="kpi-card pink">
        <div class="kpi-header">
          <span class="kpi-title">COMBO BẮP NƯỚC</span>
          <span class="kpi-tag pink">BẮP NƯỚC</span>
        </div>
        <div class="kpi-value num">11 Phần</div>
        <div class="kpi-footer">
          <div>
            <span class="kpi-growth">&uarr; 1.651.000đ</span>
            <div class="kpi-sub">Bắp rang &amp; Nước ngọt (F&amp;B)</div>
          </div>
          <!-- Sparkline Pink -->
          <svg class="sparkline-svg" viewBox="0 0 90 26">
            <path d="M 0 22 Q 25 18, 45 12 T 75 14 T 90 6" fill="none" stroke="#F43F5E" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="90" cy="6" r="3" fill="#FDA4AF"/>
          </svg>
        </div>
      </div>

      <!-- KPI 4: KHÁCH HÀNG THÀNH VIÊN -->
      <div class="kpi-card gold">
        <div class="kpi-header">
          <span class="kpi-title">KHÁCH HÀNG THÀNH VIÊN</span>
          <span class="kpi-tag gold">ACTIVE</span>
        </div>
        <div class="kpi-value num">15 Hội Viên</div>
        <div class="kpi-footer">
          <div>
            <span class="kpi-growth">&uarr; 15 Tài khoản</span>
            <div class="kpi-sub">Đã xác thực trên hệ thống</div>
          </div>
          <!-- Sparkline Gold -->
          <svg class="sparkline-svg" viewBox="0 0 90 26">
            <path d="M 0 24 Q 25 20, 50 14 T 75 8 T 90 3" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="90" cy="3" r="3" fill="#FDE68A"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- CORE REALTIME STREAMGRAPH COMPONENT (CHỈ ĐƯỜNG NÉT - KHÔNG VỆT MÀU FILL) -->
    <section class="streamgraph-card">
      <div class="stream-header">
        <div class="stream-status-tag">
          <span class="pulse-dot"></span>
          <span>● REALTIME STREAMGRAPH // OCT 2026</span>
        </div>
        <div class="month-nav">
          <button class="month-pill">Thg 8</button>
          <button class="month-pill active">Thg 9</button>
          <button class="month-pill">Thg 10</button>
          <button class="month-pill">Thg 11</button>
          <button class="month-pill">Thg 12</button>
          <button class="month-pill">Thg 1</button>
        </div>
      </div>

      <div class="stream-body-grid">
        <!-- LEFT BREAKDOWN COLUMN: ĐÚNG DOANH THU THỰC TẾ -->
        <div class="stream-stats-col">
          <div class="stream-total-label">TỔNG DOANH THU HỆ THỐNG</div>
          <div class="stream-total-amount num">4.676.000đ</div>
          <div class="stream-total-growth">
            <span>&uarr; Dữ liệu đối soát trực tiếp từ PostgreSQL</span>
          </div>

          <div class="stream-breakdown-title">
            <span>✦ CƠ CẤU DOANH THU THỰC TẾ</span>
          </div>

          <div class="breakdown-list">
            <!-- 1. VÉ XEM PHIM (VÉ THƯỜNG) -->
            <div class="breakdown-item-box ticket">
              <div class="breakdown-left">
                <span class="breakdown-dot" style="background: #E11D48; box-shadow: 0 0 10px #E11D48;"></span>
                <div>
                  <div class="breakdown-label">Vé Xem Phim (Vé Thường)</div>
                  <div class="breakdown-desc">22 vé hợp lệ đã thanh toán</div>
                </div>
              </div>
              <div class="breakdown-right">
                <div class="breakdown-pct" style="color: #FDA4AF;">64.7%</div>
                <div class="breakdown-val">3.025.000đ</div>
              </div>
            </div>

            <!-- 2. COMBO BẮP NƯỚC -->
            <div class="breakdown-item-box combo">
              <div class="breakdown-left">
                <span class="breakdown-dot" style="background: #C084FC; box-shadow: 0 0 10px #C084FC;"></span>
                <div>
                  <div class="breakdown-label">Combo Bắp Nước (F&amp;B)</div>
                  <div class="breakdown-desc">11 phần bắp nước kèm vé</div>
                </div>
              </div>
              <div class="breakdown-right">
                <div class="breakdown-pct" style="color: #C084FC;">35.3%</div>
                <div class="breakdown-val">1.651.000đ</div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT FLOWING STREAMGRAPH VISUALIZATION (CHỈ DÙNG STROKE - FILL="NONE") -->
        <div class="stream-chart-col">
          <div class="stream-svg-wrap">
            <svg class="stream-canvas" viewBox="0 0 820 300">
              <defs>
                <!-- NEON GLOW FILTERS CHO ĐƯỜNG NÉT (STROKES ONLY) -->
                <filter id="glowTicket" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#E11D48" flood-opacity="0.95"/>
                </filter>
                <filter id="glowCombo" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#C084FC" flood-opacity="0.95"/>
                </filter>
              </defs>

              <!-- Y-AXIS GRID LINES & LABELS (THANG ĐO THỰC TẾ THEO TRIỆU ĐỒNG) -->
              <text x="50" y="34" fill="#64748B" font-size="10" font-family="'Chakra Petch', monospace" text-anchor="end">5.0M</text>
              <line x1="60" y1="30" x2="780" y2="30" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3 3"/>

              <text x="50" y="74" fill="#64748B" font-size="10" font-family="'Chakra Petch', monospace" text-anchor="end">3.0M</text>
              <line x1="60" y1="70" x2="780" y2="70" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3 3"/>

              <text x="50" y="114" fill="#64748B" font-size="10" font-family="'Chakra Petch', monospace" text-anchor="end">1.5M</text>
              <line x1="60" y1="110" x2="780" y2="110" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3 3"/>

              <!-- CENTER BASELINE 0 -->
              <text x="50" y="154" fill="#94A3B8" font-size="10.5" font-weight="700" font-family="'Chakra Petch', monospace" text-anchor="end">0</text>
              <line x1="60" y1="150" x2="780" y2="150" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"/>

              <text x="50" y="194" fill="#64748B" font-size="10" font-family="'Chakra Petch', monospace" text-anchor="end">-1.5M</text>
              <line x1="60" y1="190" x2="780" y2="190" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3 3"/>

              <text x="50" y="234" fill="#64748B" font-size="10" font-family="'Chakra Petch', monospace" text-anchor="end">-3.0M</text>
              <line x1="60" y1="230" x2="780" y2="230" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3 3"/>

              <text x="50" y="274" fill="#64748B" font-size="10" font-family="'Chakra Petch', monospace" text-anchor="end">-5.0M</text>
              <line x1="60" y1="270" x2="780" y2="270" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3 3"/>

              <!-- ==============================================================
                   CHỈ CÓ ĐƯỜNG CONG NÉT (STROKES ONLY - FILL="NONE" - KHÔNG CÓ VỆT MÀU)
                   ============================================================== -->

              <!-- ĐƯỜNG 1 TRÊN: VÉ XEM PHIM (VÉ THƯỜNG - ĐỎ NHUNG LUMICINEMA) -->
              <!-- Đỉnh cong tại X=480, Y=45 (Tương đương mốc 4.676M) -->
              <path d="M 80 150 
                       C 200 148, 300 45, 480 45 
                       C 620 45, 680 148, 760 150" 
                    fill="none" stroke="#E11D48" stroke-width="2.6" filter="url(#glowTicket)"/>

              <!-- ĐƯỜNG 2 TRÊN: COMBO BẮP NƯỚC (TÍM TINH VÂN) -->
              <!-- Đỉnh cong tại X=480, Y=102 (Tương đương mốc 1.651M) -->
              <path d="M 80 150 
                       C 200 149, 300 102, 480 102 
                       C 620 102, 680 149, 760 150" 
                    fill="none" stroke="#C084FC" stroke-width="2.2" filter="url(#glowCombo)"/>

              <!-- ĐƯỜNG 2 DƯỚI: COMBO BẮP NƯỚC (ĐỐI XỨNG DƯỚI TRỤC 0) -->
              <!-- Đáy cong tại X=480, Y=198 -->
              <path d="M 80 150 
                       C 200 151, 300 198, 480 198 
                       C 620 198, 680 151, 760 150" 
                    fill="none" stroke="#C084FC" stroke-width="2.2" opacity="0.85"/>

              <!-- ĐƯỜNG 1 DƯỚI: VÉ XEM PHIM (ĐỐI XỨNG DƯỚI TRỤC 0) -->
              <!-- Đáy cong tại X=480, Y=255 -->
              <path d="M 80 150 
                       C 200 152, 300 255, 480 255 
                       C 620 255, 680 152, 760 150" 
                    fill="none" stroke="#E11D48" stroke-width="2.6" opacity="0.85"/>

              <!-- VERTICAL REALTIME DASHED CURSOR LINE AT X=480 (ĐỈNH DOANH THU THỰC TẾ) -->
              <line x1="480" y1="20" x2="480" y2="280" stroke="#FDA4AF" stroke-width="1.5" stroke-dasharray="3 3"/>

              <!-- CÁC ĐIỂM NEO GLOWING TẠI GIAO ĐIỂM -->
              <!-- Điểm 1: Vé Thường Đỉnh Trên -->
              <circle cx="480" cy="45" r="5.5" fill="#E11D48" stroke="#FFFFFF" stroke-width="2" filter="url(#glowTicket)"/>
              <!-- Điểm 2: Combo Bắp Nước Đỉnh Trên -->
              <circle cx="480" cy="102" r="4.5" fill="#C084FC" stroke="#050508" stroke-width="2" filter="url(#glowCombo)"/>
              <!-- Điểm 3: Gốc Baseline 0 -->
              <circle cx="480" cy="150" r="3.5" fill="#FFFFFF" stroke="#050508" stroke-width="1.5"/>
              <!-- Điểm 4: Combo Bắp Nước Đáy Dưới -->
              <circle cx="480" cy="198" r="4.5" fill="#C084FC" stroke="#050508" stroke-width="2"/>
              <!-- Điểm 5: Vé Thường Đáy Dưới -->
              <circle cx="480" cy="255" r="5.5" fill="#E11D48" stroke="#FFFFFF" stroke-width="2"/>

              <!-- TOOLTIP BADGE HIỂN THỊ ĐÚNG TỔNG DOANH THU THỰC TẾ -->
              <g transform="translate(415, 6)">
                <rect x="0" y="0" width="130" height="28" rx="6" fill="rgba(18, 14, 28, 0.95)" stroke="#FDA4AF" stroke-width="1.2"/>
                <text x="65" y="18" fill="#FFF" font-size="11.5" font-weight="700" text-anchor="middle" font-family="'Chakra Petch', monospace">4.676.000đ</text>
              </g>

              <!-- X-AXIS LABELS (DỮ LIỆU ĐỐI SOÁT THỜI GIAN THỰC TẾ) -->
              <text x="80" y="295" fill="#64748B" font-size="10.5" font-weight="600" text-anchor="middle">Thg 8</text>
              <text x="240" y="295" fill="#64748B" font-size="10.5" font-weight="600" text-anchor="middle">Thg 9</text>
              <text x="480" y="295" fill="#FDA4AF" font-size="11" font-weight="800" text-anchor="middle">Thg 9 - 10 (Hiện tại)</text>
              <text x="620" y="295" fill="#64748B" font-size="10.5" font-weight="600" text-anchor="middle">Thg 11</text>
              <text x="760" y="295" fill="#64748B" font-size="10.5" font-weight="600" text-anchor="middle">Thg 12</text>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- BOTTOM 2 COLUMNS (TABLE + TOP 3 TỪ DATABASE THẬT) -->
    <div class="bottom-grid">
      <!-- LEFT TABLE: ĐƠN ĐẶT VÉ THẬT TRONG DATABASE -->
      <section class="sub-card">
        <div class="sub-card-header">
          <div>
            <h3 class="sub-card-title">DANH SÁCH ĐƠN ĐẶT VÉ THỰC TẾ (DATABASE)</h3>
            <p class="sub-card-sub">Trích xuất trực tiếp từ bảng payments &amp; tickets của LumiCinema</p>
          </div>
          <a href="/admin/reports" class="sub-card-link">Xem tất cả đơn →</a>
        </div>

        <table class="mini-table">
          <thead>
            <tr>
              <th>MÃ VÉ</th>
              <th>KHÁCH HÀNG</th>
              <th>DỊCH VỤ ĐÃ MUA</th>
              <th>CỔNG TT</th>
              <th>TỔNG TIỀN</th>
              <th>TRẠNG THÁI</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b class="tech" style="color: #FDA4AF;">#TK48</b></td>
              <td><b>Nguyễn Hữu Thắng</b><br><small style="color: #64748B;">Khách Hàng</small></td>
              <td>Spider-Man: Beyond<br><small style="color: #C084FC;">Phòng 01 · 1 Vé Thường</small></td>
              <td><span class="chip-status paid">ZaloPay</span></td>
              <td><b class="num" style="color: #FFF;">110.000đ</b></td>
              <td><span class="chip-status paid">Đã xuất vé</span></td>
              <td><button class="chip-btn" onclick="alert('In vé #TK48 thành công!')">In Vé</button></td>
            </tr>
            <tr>
              <td><b class="tech" style="color: #FDA4AF;">#TK45</b></td>
              <td><b>Nguyễn Khánh Hưng</b><br><small style="color: #64748B;">Khách Hàng</small></td>
              <td>Dune: Messiah (Phần 3)<br><small style="color: #C084FC;">Phòng 01 · 1 Vé Thường</small></td>
              <td><span class="chip-status paid">ZaloPay</span></td>
              <td><b class="num" style="color: #FFF;">140.000đ</b></td>
              <td><span class="chip-status paid">Đã xuất vé</span></td>
              <td><button class="chip-btn" onclick="alert('In vé #TK45 thành công!')">In Vé</button></td>
            </tr>
            <tr>
              <td><b class="tech" style="color: #FDA4AF;">#TK41</b></td>
              <td><b>Nguyễn Hữu Thắng</b><br><small style="color: #64748B;">Khách Hàng</small></td>
              <td>Mission: Impossible 9<br><small style="color: #C084FC;">Phòng 02 · 1 Vé Thường + Combo Bắp Nước</small></td>
              <td><span class="chip-status wait">Tiền mặt</span></td>
              <td><b class="num" style="color: #FFF;">465.000đ</b></td>
              <td><span class="chip-status paid">Đã xuất vé</span></td>
              <td><button class="chip-btn" onclick="alert('Đã kiểm tra đơn #TK41')">Chi Tiết</button></td>
            </tr>
            <tr>
              <td><b class="tech" style="color: #FDA4AF;">#TK38</b></td>
              <td><b>Nguyễn Khánh Hưng</b><br><small style="color: #64748B;">Khách Hàng</small></td>
              <td>Spider-Man: Beyond<br><small style="color: #C084FC;">Phòng 02 · 1 Vé Thường + 2 Combo Bắp Nước</small></td>
              <td><span class="chip-status paid">ZaloPay</span></td>
              <td><b class="num" style="color: #FFF;">734.000đ</b></td>
              <td><span class="chip-status paid">Đã xuất vé</span></td>
              <td><button class="chip-btn" onclick="alert('In hóa đơn #TK38')">In HĐ</button></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- RIGHT WIDGET: TOP 3 PHIM ĂN KHÁCH THẬT TỪ DATABASE -->
      <aside class="sub-card">
        <div class="sub-card-header">
          <div>
            <h3 class="sub-card-title">TOP PHIM BÁN CHẠY THỰC TẾ</h3>
            <p class="sub-card-sub">Tổng hợp từ bảng tickets (Status: Valid/Used)</p>
          </div>
          <span class="kpi-tag gold">TOP 3 DB</span>
        </div>

        <div class="top-movie-item">
          <span class="top-rank-badge rank1">1</span>
          <img src="/movies/spiderman-poster.jpg" alt="Spider-Man" class="top-movie-img" onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?w=80'">
          <div class="top-movie-info">
            <h4>Spider-Man: Beyond the Spider-Verse</h4>
            <p>140 phút • Hoạt hình, Hành động</p>
          </div>
          <div class="top-movie-revenue">
            <b>2.650.000đ</b>
            <small>20 vé đã bán</small>
          </div>
        </div>

        <div class="top-movie-item">
          <span class="top-rank-badge rank2">2</span>
          <img src="/movies/dune-2-poster.jpg" alt="Dune" class="top-movie-img" onerror="this.src='https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=80'">
          <div class="top-movie-info">
            <h4>Dune: Messiah (Phần 3)</h4>
            <p>165 phút • Khoa học viễn tưởng</p>
          </div>
          <div class="top-movie-revenue">
            <b>140.000đ</b>
            <small>1 vé đã bán</small>
          </div>
        </div>

        <div class="top-movie-item">
          <span class="top-rank-badge rank3">3</span>
          <img src="/movies/godzilla-kong-poster.jpg" alt="Mission Impossible" class="top-movie-img" onerror="this.src='https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=80'">
          <div class="top-movie-info">
            <h4>Mission: Impossible 9</h4>
            <p>150 phút • Hành động kịch tính</p>
          </div>
          <div class="top-movie-revenue">
            <b>120.000đ</b>
            <small>1 vé đã bán</small>
          </div>
        </div>
      </aside>
    </div>
  </main>
</body>
</html>
"""

dest = r"D:\cinema_project\cinema-app\public\admin-preview\streamgraph-fusion.html"
with open(dest, "w", encoding="utf-8") as f:
    f.write(html_content)

dest2 = r"D:\cinema_project\cinema-app\public\admin-preview\preview-streamgraph-live.html"
with open(dest2, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated prototype at {dest} and {dest2}")
