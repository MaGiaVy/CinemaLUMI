'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ToastMessage } from '@/components/ui/Toast';
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

  // Tính toán số liệu tổng hợp của báo cáo
  const totalRevenue = reports.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalTickets = reports.reduce((sum, r) => sum + r.tickets_sold, 0);
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
      'Vé đã bán',
      'Tổng số ghế',
      'Tỷ lệ lấp đầy (%)',
      'Doanh thu (VNĐ)',
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
      r.total_seats,
      `${r.fill_rate}%`,
      r.total_revenue,
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
    <div className="flex-1 bg-[#141414] p-6 lg:p-8 min-h-screen text-white overflow-y-auto">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border border-[#404040] shadow-2xl min-w-[280px] max-w-[400px] transition-all duration-200 ${
              toast.type === 'success'
                ? 'bg-[#183323] border-[#2ECC71]/40 text-white'
                : toast.type === 'error'
                ? 'bg-[#3b1c1f] border-[#E63946]/40 text-white'
                : 'bg-[#1c2a38] border-[#0088FF]/40 text-white'
            }`}
          >
            <span className="text-base font-bold">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#A3A3A3] hover:text-white text-sm ml-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-[#A3A3A3] hover:text-white transition-colors text-sm font-medium"
              >
                ← Dashboard
              </Link>
              <span className="text-[#404040]">/</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Báo Cáo Doanh Thu Theo Suất Chiếu (UC-19)
              </h1>
            </div>
            <p className="text-[#A3A3A3] text-sm mt-1">
              Phân tích chi tiết doanh thu, số lượng vé bán và tỷ lệ lấp đầy phòng chiếu
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              📊 Xuất Excel / CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addToast('info', 'Tính năng xuất file PDF đang hoàn thiện bản in')}
            >
              📄 Xuất PDF
            </Button>
          </div>
        </div>

        {/* Filter Form Card */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 lg:p-6 shadow-xl">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#404040] focus:border-[#E63946] rounded-xl px-3 py-2 text-white text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#404040] focus:border-[#E63946] rounded-xl px-3 py-2 text-white text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                  Lọc theo phim
                </label>
                <select
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="w-full bg-[#141414] border border-[#404040] focus:border-[#E63946] rounded-xl px-3 py-2 text-white text-sm outline-none transition-colors"
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
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                  Phòng chiếu
                </label>
                <select
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-[#141414] border border-[#404040] focus:border-[#E63946] rounded-xl px-3 py-2 text-white text-sm outline-none transition-colors"
                >
                  <option value="all">Tất cả phòng chiếu</option>
                  <option value="Cinema 01">Cinema 01</option>
                  <option value="Cinema 02">Cinema 02</option>
                  <option value="Cinema 03">Cinema 03</option>
                  <option value="Cinema 04">Cinema 04</option>
                  <option value="Cinema 05">Cinema 05</option>
                </select>
              </div>
            </div>

            {/* Quick Presets & Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2D2D2D]">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#737373]">Chọn nhanh:</span>
                <button
                  type="button"
                  onClick={() => setQuickDate('today')}
                  className="bg-[#2A2A2A] hover:bg-[#383838] text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('7days')}
                  className="bg-[#2A2A2A] hover:bg-[#383838] text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  7 Ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('month')}
                  className="bg-[#2A2A2A] hover:bg-[#383838] text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('all')}
                  className="bg-[#2A2A2A] hover:bg-[#383838] text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  Toàn thời gian
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" size="sm" disabled={loading}>
                  {loading ? 'Đang trích xuất...' : '🔍 Áp dụng bộ lọc'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Summary Stats of Current Filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4">
            <span className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider block">
              TỔNG DOANH THU KỲ LỌC
            </span>
            <span className="text-[#FFB703] font-black text-xl lg:text-2xl mt-1 block">
              {totalRevenue.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4">
            <span className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider block">
              TỔNG VÉ ĐÃ BÁN
            </span>
            <span className="text-[#2ECC71] font-black text-xl lg:text-2xl mt-1 block">
              {totalTickets.toLocaleString('vi-VN')} vé
            </span>
          </div>

          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4">
            <span className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider block">
              SỐ SUẤT CHIẾU
            </span>
            <span className="text-[#0088FF] font-black text-xl lg:text-2xl mt-1 block">
              {reports.length} suất
            </span>
          </div>

          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4">
            <span className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider block">
              TỶ LỆ LẤP ĐẦY BÌNH QUÂN
            </span>
            <span className="text-white font-black text-xl lg:text-2xl mt-1 block">
              {overallFillRate}%
            </span>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#2D2D2D] flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <span>📋</span> Bảng Dữ Liệu Suất Chiếu & Doanh Thu Chi Tiết
              </h2>
              <p className="text-[#A3A3A3] text-xs mt-0.5">
                Hiển thị từng suất chiếu với doanh thu và tỷ lệ lấp đầy chính xác
              </p>
            </div>
            <span className="text-xs text-[#A3A3A3]">
              Số bản ghi: <strong className="text-white">{reports.length}</strong>
            </span>
          </div>

          {error && (
            <div className="p-4 bg-[#E63946]/10 border-b border-[#E63946]/20 text-[#E63946] text-sm">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-[#737373]">
              <div className="inline-block animate-spin text-3xl mb-3">⏳</div>
              <p className="text-sm font-medium">Đang trích xuất dữ liệu báo cáo...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center text-[#737373]">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-white font-bold text-base">Không có dữ liệu suất chiếu</p>
              <p className="text-xs mt-1">Thử thay đổi bộ lọc ngày hoặc chọn phim khác</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D2D] text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider bg-[#191919]">
                    <th className="px-5 py-3.5">Mã Suất</th>
                    <th className="px-5 py-3.5">Phim Chiếu</th>
                    <th className="px-5 py-3.5">Thời Gian</th>
                    <th className="px-5 py-3.5">Phòng Chiếu</th>
                    <th className="px-5 py-3.5">Vé Bán / Tổng Ghế</th>
                    <th className="px-5 py-3.5">Tỷ Lệ Lấp Đầy</th>
                    <th className="px-5 py-3.5 text-right">Doanh Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2D2D]">
                  {reports.map((r) => {
                    const fillRateBadge =
                      r.fill_rate >= 70
                        ? 'green'
                        : r.fill_rate >= 30
                        ? 'gold'
                        : 'gray';

                    return (
                      <tr key={r.screening_id} className="hover:bg-[#252525] transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-white text-xs">
                          #{r.screening_id}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {r.movie.poster && (
                              <div className="relative w-9 h-13 rounded overflow-hidden flex-shrink-0 bg-[#252525]">
                                <Image
                                  src={r.movie.poster}
                                  alt={r.movie.title}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white max-w-xs truncate">
                                {r.movie.title}
                              </div>
                              <div className="text-xs text-[#737373]">
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
                          <div className="text-xs text-[#A3A3A3]">{r.date}</div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono text-white bg-[#2A2A2A] px-2 py-0.5 rounded text-xs">
                            {r.room}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-white font-semibold">
                            {r.tickets_sold} / {r.total_seats} ghế
                          </div>
                          <div className="text-xs text-[#737373]">
                            Còn trống: {r.empty_seats}
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-[#2D2D2D] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  r.fill_rate >= 70
                                    ? 'bg-[#2ECC71]'
                                    : r.fill_rate >= 30
                                    ? 'bg-[#FFB703]'
                                    : 'bg-[#525252]'
                                }`}
                                style={{ width: `${Math.min(100, r.fill_rate)}%` }}
                              />
                            </div>
                            <Badge variant={fillRateBadge}>{r.fill_rate_percentage}</Badge>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right font-black text-[#FFB703] whitespace-nowrap text-base">
                          {r.total_revenue.toLocaleString('vi-VN')} đ
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
    </div>
  );
}
