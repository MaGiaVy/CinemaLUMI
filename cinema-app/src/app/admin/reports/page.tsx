'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { ScreeningRevenueReportItem } from '@/app/api/admin/reports/revenue/route';

interface MovieOption {
  id: number;
  title: string;
}

export default function AdminReportsPage() {
  // Bộ lọc
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [movieId, setMovieId] = useState('all');
  const [roomNumber, setRoomNumber] = useState('all');

  // Dữ liệu
  const [reports, setReports] = useState<ScreeningRevenueReportItem[]>([]);
  const [moviesList, setMoviesList] = useState<MovieOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tải danh sách phim cho Dropdown bộ lọc
  useEffect(() => {
    async function loadMovies() {
      try {
        const res = await fetch('/api/movies');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMoviesList(json.data.map((m: { id: number; title: string }) => ({ id: m.id, title: m.title })));
        }
      } catch (err) {
        console.error('Không thể tải danh sách phim:', err);
      }
    }
    loadMovies();
  }, []);

  // Gọi API Báo cáo doanh thu chi tiết (UC-19)
  const fetchRevenueReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      if (movieId !== 'all') params.set('movie_id', movieId);
      if (roomNumber !== 'all') params.set('room_number', roomNumber);

      const res = await fetch(`/api/admin/reports/revenue?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success && Array.isArray(json.data)) {
        setReports(json.data);
      } else {
        setReports([]);
        setError(json.message || 'Không có dữ liệu báo cáo');
      }
    } catch (err) {
      console.error('Lỗi tải báo cáo doanh thu:', err);
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, movieId, roomNumber]);

  useEffect(() => {
    fetchRevenueReports();
  }, [fetchRevenueReports]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRevenueReports();
  };

  // Các nút chọn nhanh khoảng thời gian
  const setQuickDate = (preset: 'today' | '7days' | 'month' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      setFromDate(past7.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(firstDay.toISOString().split('T')[0]);
      setToDate(lastDay.toISOString().split('T')[0]);
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  // Tính toán số liệu tổng hợp của báo cáo (Phân tách Thực thu, Doanh thu gộp, Tiền hoàn lại)
  const totalNetRevenue = reports.reduce((sum, r) => sum + (r.net_revenue ?? r.total_revenue), 0);
  const totalGrossRevenue = reports.reduce((sum, r) => sum + (r.gross_revenue ?? r.total_revenue), 0);
  const totalRefunded = reports.reduce((sum, r) => sum + (r.refunded_amount ?? 0), 0);
  const totalTickets = reports.reduce((sum, r) => sum + r.tickets_sold, 0);
  const totalCancelledTickets = reports.reduce((sum, r) => sum + (r.cancelled_tickets ?? 0), 0);
  const totalSeats = reports.reduce((sum, r) => sum + r.total_seats, 0);
  const overallFillRate = totalSeats > 0 ? Number(((totalTickets / totalSeats) * 100).toFixed(1)) : 0;

  // Xuất file CSV báo cáo tải về trực tiếp
  const handleExportCSV = () => {
    if (reports.length === 0) {
      addToast('warning', 'Không có dữ liệu để xuất file CSV');
      return;
    }

    const headers = [
      'Mã suất',
      'Ngày chiếu',
      'Giờ bắt đầu',
      'Giờ kết thúc',
      'Phim',
      'Phòng chiếu',
      'Giá vé',
      'Vé đã bán (Hợp lệ)',
      'Vé đã hủy / hoàn',
      'Tổng số ghế',
      'Tỷ lệ lấp đầy (%)',
      'Doanh thu gộp (VNĐ)',
      'Tiền hoàn lại (VNĐ)',
      'Doanh thu thực thu (VNĐ)',
    ];

    const rows = reports.map((r) => [
      `#${r.screening_id}`,
      r.date,
      new Date(r.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      new Date(r.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      `"${r.movie.title.replace(/"/g, '""')}"`,
      `"${r.room}"`,
      r.base_price,
      r.tickets_sold,
      r.cancelled_tickets ?? 0,
      r.total_seats,
      `${r.fill_rate}%`,
      r.gross_revenue ?? r.total_revenue,
      r.refunded_amount ?? 0,
      r.net_revenue ?? r.total_revenue,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Lumi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Đã tải xuống tệp báo cáo Excel/CSV thành công!');
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-[#94a3b8] hover:text-white transition-colors text-xs font-bold"
              style={{ textDecoration: 'none' }}
            >
              ← Dashboard
            </Link>
            <span className="text-white/20">/</span>
            <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
              Báo Cáo Doanh Thu Kế Toán (BR-10 · UC-19)
            </h1>
          </div>
          <p className="text-[#94a3b8] text-xs mt-1">
            Phân tích chi tiết doanh thu thực thu, tiền hoàn lại theo BR-04 và tỷ lệ lấp đầy phòng chiếu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider"
          >
            Xuất Excel / CSV
          </button>
          <button
            type="button"
            onClick={() => addToast('info', 'Tính năng xuất file PDF đang hoàn thiện bản in')}
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-[#c084fc]/25 text-[#f8fafc] text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Xuất PDF
          </button>
        </div>
      </header>

      {/* Filter Form Card */}
      <div
        className="rounded-2xl p-5 border border-[#c084fc]/20 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(136, 19, 55, 0.18) 0%, transparent 60%), rgba(15, 11, 26, 0.85)',
        }}
      >
        <form onSubmit={handleApplyFilter} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                Từ ngày
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                Đến ngày
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                Lọc theo phim
              </label>
              <select
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
              >
                <option value="all">Tất cả phim</option>
                {moviesList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                Phòng chiếu
              </label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
              >
                <option value="all">Tất cả phòng chiếu</option>
                <option value="Cinema 01">Cinema 01 (Laser 4K)</option>
                <option value="Cinema 02">Cinema 02 (Dolby Atmos)</option>
                <option value="Cinema 03">Cinema 03 (Standard 2D)</option>
                <option value="Cinema 04">Cinema 04 (Laser 4K)</option>
                <option value="Cinema 05">Cinema 05 (VIP Cosmos)</option>
              </select>
            </div>
          </div>

          {/* Quick Presets & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#94a3b8] text-[11px]">Chọn nhanh:</span>
              <button
                type="button"
                onClick={() => setQuickDate('today')}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-[#f8fafc] px-3 py-1 rounded-md text-[11px] font-bold border border-white/[0.08] transition-colors cursor-pointer"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('7days')}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-[#f8fafc] px-3 py-1 rounded-md text-[11px] font-bold border border-white/[0.08] transition-colors cursor-pointer"
              >
                7 Ngày qua
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('month')}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-[#f8fafc] px-3 py-1 rounded-md text-[11px] font-bold border border-white/[0.08] transition-colors cursor-pointer"
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('all')}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-[#f8fafc] px-3 py-1 rounded-md text-[11px] font-bold border border-white/[0.08] transition-colors cursor-pointer"
              >
                Toàn thời gian
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.7)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang trích xuất...' : 'ÁP DỤNG BỘ LỌC'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Summary Stats of Current Filter (5 Cards Bento) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl p-4 bg-[#0a0812]/80 border border-[#c084fc]/20 backdrop-blur-xl">
          <span className="text-[#a78bfa] text-[10px] font-black uppercase tracking-wider block">
            DOANH THU THỰC THU
          </span>
          <span className="text-[#86efac] font-black text-xl lg:text-2xl mt-1 block tracking-tight">
            {totalNetRevenue.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[10px] text-[#94a3b8] mt-1 block">Sau khi trừ các vé hoàn</span>
        </div>

        <div className="rounded-xl p-4 bg-[#0a0812]/80 border border-[#c084fc]/20 backdrop-blur-xl">
          <span className="text-[#a78bfa] text-[10px] font-black uppercase tracking-wider block">
            DOANH THU GỘP
          </span>
          <span className="text-[#fda4af] font-black text-xl lg:text-2xl mt-1 block tracking-tight">
            {totalGrossRevenue.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[10px] text-[#94a3b8] mt-1 block">Tổng bán vé ban đầu</span>
        </div>

        <div className="rounded-xl p-4 bg-[#0a0812]/80 border border-[#c084fc]/20 backdrop-blur-xl">
          <span className="text-[#a78bfa] text-[10px] font-black uppercase tracking-wider block">
            TIỀN ĐÃ HOÀN LẠI (BR-04)
          </span>
          <span className="text-[#f43f5e] font-black text-xl lg:text-2xl mt-1 block tracking-tight">
            {totalRefunded.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[10px] text-[#94a3b8] mt-1 block">{totalCancelledTickets} vé hủy / bồi hoàn</span>
        </div>

        <div className="rounded-xl p-4 bg-[#0a0812]/80 border border-[#c084fc]/20 backdrop-blur-xl">
          <span className="text-[#a78bfa] text-[10px] font-black uppercase tracking-wider block">
            VÉ HỢP LỆ / ĐÃ BÁN
          </span>
          <span className="text-[#c084fc] font-black text-xl lg:text-2xl mt-1 block tracking-tight">
            {totalTickets.toLocaleString('vi-VN')} vé
          </span>
          <span className="text-[10px] text-[#94a3b8] mt-1 block">{reports.length} suất chiếu</span>
        </div>

        <div className="rounded-xl p-4 bg-[#0a0812]/80 border border-[#c084fc]/20 backdrop-blur-xl">
          <span className="text-[#a78bfa] text-[10px] font-black uppercase tracking-wider block">
            TỶ LỆ LẤP ĐẦY
          </span>
          <span className="text-white font-black text-xl lg:text-2xl mt-1 block tracking-tight">
            {overallFillRate}%
          </span>
          <span className="text-[10px] text-[#94a3b8] mt-1 block">Bình quân toàn rạp</span>
        </div>
      </div>

      {/* Detailed Table Bento Card */}
      <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#e11d48] text-sm">✦</span>
              <h2 className="text-white font-black text-sm uppercase tracking-wider">
                BẢNG DỮ LIỆU SUẤT CHIẾU & DOANH THU CHI TIẾT
              </h2>
            </div>
            <p className="text-[#94a3b8] text-xs mt-0.5">
              Hiển thị từng suất chiếu với doanh thu và tỷ lệ lấp đầy chính xác
            </p>
          </div>
          <span className="text-xs text-[#94a3b8]">
            Số bản ghi: <strong className="text-white">{reports.length}</strong>
          </span>
        </div>

        {error && (
          <div className="p-4 bg-[#e11d48]/15 border-b border-[#e11d48]/30 text-[#fda4af] text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-[#94a3b8] text-xs">
            Đang trích xuất dữ liệu báo cáo...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center text-[#94a3b8]">
            <p className="text-white font-bold text-sm">Không có dữ liệu suất chiếu</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc ngày hoặc chọn phim khác</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-bold text-[#c084fc] uppercase tracking-wider bg-white/[0.02]">
                  <th className="px-5 py-3.5">Mã Suất</th>
                  <th className="px-5 py-3.5">Phim Chiếu</th>
                  <th className="px-5 py-3.5">Thời Gian</th>
                  <th className="px-5 py-3.5">Phòng Chiếu</th>
                  <th className="px-5 py-3.5">Vé Bán / Tổng Ghế</th>
                  <th className="px-5 py-3.5">Tỷ Lệ Lấp Đầy</th>
                  <th className="px-5 py-3.5 text-right">Tiền Đã Hoàn</th>
                  <th className="px-5 py-3.5 text-right">Doanh Thu Thực Thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {reports.map((r) => {
                  return (
                    <tr key={r.screening_id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-white text-xs">
                        #{r.screening_id}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {r.movie.poster && (
                            <div className="relative w-8 h-11 rounded overflow-hidden flex-shrink-0 bg-[#1f192b] border border-[#c084fc]/20">
                              <Image
                                src={r.movie.poster}
                                alt={r.movie.title}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white max-w-xs truncate">
                              {r.movie.title}
                            </div>
                            <div className="text-[10px] text-[#94a3b8] mt-0.5">
                              {r.movie.genre} • {r.movie.duration}p
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-white font-medium">
                          {new Date(r.start_time).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(r.end_time).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">{r.date}</div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-white bg-white/[0.06] border border-white/[0.1] px-2.5 py-1 rounded text-xs">
                          {r.room}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-white font-semibold">
                          {r.tickets_sold} / {r.total_seats} ghế
                        </div>
                        <div className="text-[10px] text-[#94a3b8] mt-0.5">
                          Còn trống: {r.empty_seats}
                          {(r.cancelled_tickets ?? 0) > 0 && (
                            <span className="text-[#fda4af] ml-1.5 font-bold">
                              • {r.cancelled_tickets} vé hủy
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                r.fill_rate >= 70
                                  ? 'bg-gradient-to-r from-[#881337] to-[#e11d48]'
                                  : r.fill_rate >= 30
                                  ? 'bg-gradient-to-r from-purple-800 to-[#c084fc]'
                                  : 'bg-white/20'
                              }`}
                              style={{ width: `${Math.min(100, r.fill_rate)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white">{r.fill_rate_percentage}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {(r.refunded_amount ?? 0) > 0 ? (
                          <span className="text-[#f43f5e] font-bold">
                            -{(r.refunded_amount ?? 0).toLocaleString('vi-VN')} đ
                          </span>
                        ) : (
                          <span className="text-[#64748b]">0 đ</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="font-black text-[#86efac] text-sm">
                          {(r.net_revenue ?? r.total_revenue).toLocaleString('vi-VN')} đ
                        </div>
                        {(r.gross_revenue ?? r.total_revenue) !== (r.net_revenue ?? r.total_revenue) && (
                          <div className="text-[10px] text-[#94a3b8]">
                            Gộp: {(r.gross_revenue ?? r.total_revenue).toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
