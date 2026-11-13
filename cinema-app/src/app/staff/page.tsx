'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaffTicketSearchResult } from '@/app/api/staff/tickets/search/route';

export default function StaffDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<StaffTicketSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách các vé gần đây từ API
  const fetchRecentTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staff/tickets/search');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTickets(json.data);
      } else {
        setError(json.message || 'Không thể tải danh sách vé');
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentTickets();
  }, [fetchRecentTickets]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/staff/lookup?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/staff/lookup');
    }
  };

  // Tính toán số liệu thống kê thực tế từ dữ liệu
  const totalTickets = tickets.length;
  const validTickets = tickets.filter((t) => t.status === 'Valid').length;
  const usedTickets = tickets.filter((t) => t.status === 'Used').length;
  const cancelledTickets = tickets.filter((t) => t.status === 'Cancelled').length;
  const totalRevenue = tickets
    .filter((t) => t.status !== 'Cancelled')
    .reduce((sum, t) => sum + (t.price || 0), 0);

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex-1 p-4 lg:p-6 text-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto space-y-5">

        {/* 1. Header Bar Buồng Lái Điều Hành */}
        <header className="bg-gradient-to-r from-[rgba(20,14,32,0.92)] to-[rgba(35,12,28,0.9)] backdrop-blur-2xl border border-[rgba(192,132,252,0.25)] rounded-2xl p-4 lg:px-6 lg:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(88,28,135,0.2)]">
          <div className="flex items-center gap-3.5">
            <span className="bg-gradient-to-br from-[#E11D48] to-[#881337] text-white font-black text-xs tracking-wider px-3 py-1.5 rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.6)] border border-[rgba(254,205,211,0.35)]">
              ✦ DASHBOARD
            </span>
            <div>
              <h1 className="text-sm lg:text-base font-extrabold text-[#F8FAFC] tracking-wide">
                BÀN ĐIỀU HÀNH QUẦY RẠP VŨ TRỤ · CA TỐI
              </h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {todayStr} · Thu ngân: <strong className="text-white">Trần Thị Thu</strong> · Ca làm việc 18:00 - 23:30
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchRecentTickets}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#F8FAFC] text-xs font-bold border border-[rgba(192,132,252,0.25)] transition-all flex items-center gap-2"
            >
              <span>{loading ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
            <Link
              href="/staff/pos"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:scale-105 transition-all no-underline"
            >
              Bán Vé & Combo (POS)
            </Link>
            <Link
              href="/staff/lookup"
              className="px-3.5 py-1.5 rounded-xl bg-[rgba(88,28,135,0.4)] border border-[rgba(192,132,252,0.35)] text-[#E9D5FF] text-xs font-extrabold hover:text-white hover:border-[#C084FC] transition-all no-underline"
            >
              Soát Vé Laser
            </Link>
            <Link
              href="/staff/combos"
              className="px-3.5 py-1.5 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(192,132,252,0.25)] text-[#CBD5E1] text-xs font-bold hover:text-white transition-all no-underline"
            >
              Kệ Giao Bắp Nước
            </Link>
          </div>
        </header>

        {/* 2. Hàng 4 Khối Bento KPI Hôm Nay */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Tổng số vé */}
          <div className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] border border-[rgba(225,29,72,0.3)] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-[#FDA4AF] uppercase">
                TỔNG SỐ VÉ ĐẶT
              </span>
              <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_#E11D48]" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white mt-2">
              {loading ? '...' : totalTickets}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-1">
              Bao gồm đặt tại quầy POS và Online
            </div>
          </div>

          {/* Card 2: Doanh thu vé */}
          <div className="bg-[radial-gradient(circle_at_100%_0%,rgba(88,28,135,0.35)_0%,transparent_60%),rgba(15,11,25,0.85)] border border-[rgba(192,132,252,0.25)] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-[#C084FC] uppercase">
                DOANH THU VÉ
              </span>
              <span className="w-2 h-2 rounded-full bg-[#C084FC] shadow-[0_0_8px_#C084FC]" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white mt-2">
              {loading ? '...' : `${(totalRevenue / 1000).toLocaleString('vi-VN')}k`}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-1">
              Chỉ tính các vé chưa hoàn tiền
            </div>
          </div>

          {/* Card 3: Vé hợp lệ / Đã dùng */}
          <div className="bg-[radial-gradient(circle_at_0%_100%,rgba(34,197,94,0.2)_0%,transparent_60%),rgba(15,11,25,0.85)] border border-[rgba(74,222,128,0.3)] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-[#86EFAC] uppercase">
                HỢP LỆ / ĐÃ SOÁT
              </span>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white mt-2">
              {loading ? '...' : `${validTickets} / ${usedTickets}`}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-1">
              {validTickets} vé chờ xem · {usedTickets} đã quét vào rạp
            </div>
          </div>

          {/* Card 4: Vé đã hủy / Bồi hoàn */}
          <div className="bg-[radial-gradient(circle_at_100%_100%,rgba(136,19,55,0.35)_0%,transparent_60%),rgba(15,11,25,0.85)] border border-[rgba(225,29,72,0.35)] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-[#FDA4AF] uppercase">
                VÉ ĐÃ HỦY / BỒI HOÀN
              </span>
              <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_#E11D48]" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-[#FDA4AF] mt-2">
              {loading ? '...' : cancelledTickets}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-1">
              Bồi hoàn chuẩn UC-15 / BR-03
            </div>
          </div>
        </div>

        {/* 3. Tra Cứu Nhanh Tại Quầy */}
        <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.85)] space-y-3.5">
          <div>
            <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
              <span className="text-[#E11D48] text-sm font-black">✦</span>
              TRA CỨU NHANH VÉ KHÁCH HÀNG TẠI QUẦY
            </span>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Nhập số điện thoại, email hoặc mã vé để kiểm tra thông tin và xử lý sự cố tức thì
            </p>
          </div>

          <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Nhập số điện thoại khách hàng, email hoặc mã vé (#LMC-...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[rgba(8,6,14,0.85)] border border-[rgba(192,132,252,0.25)] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#E11D48] transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:scale-105 transition-all"
            >
              Tìm Kiếm Ngay
            </button>
          </form>

          {/* Gợi ý từ khóa mẫu */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[rgba(192,132,252,0.12)] text-xs">
            <span className="text-[11px] text-[#94A3B8]">Từ khóa gợi ý:</span>
            {['0901234567', 'khachhang@lumi.vn', '#LMC-000003', 'Phòng 01', 'A1'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setSearchQuery(sample);
                  router.push(`/staff/lookup?q=${encodeURIComponent(sample)}`);
                }}
                className="text-[11px] font-mono text-[#CBD5E1] hover:text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(192,132,252,0.2)] px-2.5 py-0.5 rounded-md border border-[rgba(192,132,252,0.2)] transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </section>

        {/* 4. Bảng Vé Đặt Mới Nhất Trong Hệ Thống */}
        <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.85)]">
          <div className="p-4 lg:p-5 border-b border-[rgba(192,132,252,0.15)] flex items-center justify-between">
            <div>
              <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
                <span className="text-[#E11D48] text-sm font-black">✦</span>
                VÉ ĐẶT MỚI NHẤT TRONG HỆ THỐNG
              </span>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Đồng bộ trực tiếp từ cơ sở dữ liệu rạp chiếu
              </p>
            </div>
            <Link
              href="/staff/lookup"
              className="text-xs font-bold text-[#FDA4AF] hover:text-white flex items-center gap-1 transition-colors no-underline"
            >
              Mở Trang Tra Cứu Toàn Diện →
            </Link>
          </div>

          {error && (
            <div className="p-3.5 bg-[rgba(225,29,72,0.18)] border-b border-[rgba(225,29,72,0.3)] text-[#FDA4AF] text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <div className="hourglass-spin text-2xl mb-2">⏳</div>
              <p className="text-xs">Đang tải danh sách vé mới nhất...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <p className="text-sm font-bold text-white">Chưa có vé nào trong hệ thống</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[rgba(192,132,252,0.15)] text-[10px] font-black text-[#94A3B8] uppercase tracking-wider bg-[rgba(8,6,14,0.6)]">
                    <th className="px-5 py-3">Mã Vé</th>
                    <th className="px-5 py-3">Khách Hàng</th>
                    <th className="px-5 py-3">Phim & Suất Chiếu</th>
                    <th className="px-5 py-3">Ghế Ngồi</th>
                    <th className="px-5 py-3">Giá Vé</th>
                    <th className="px-5 py-3">Trạng Thái</th>
                    <th className="px-5 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(192,132,252,0.08)]">
                  {tickets.slice(0, 8).map((t) => {
                    const statusText =
                      t.status === 'Valid'
                        ? 'Hợp Lệ'
                        : t.status === 'Used'
                        ? 'Đã Sử Dụng'
                        : 'Đã Hủy';

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                          {t.ticket_code || `#LMC-${String(t.id).padStart(6, '0')}`}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-white">
                            {t.customer?.name || 'Khách vãng lai'}
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">
                            {t.customer?.phone || t.customer?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="font-medium text-white truncate">
                            {t.movie?.title || 'Phim rạp'}
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">
                            {t.screening?.room} ·{' '}
                            {t.screening?.start_time
                              ? new Date(t.screening.start_time).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-mono font-black text-[#FDA4AF] bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded border border-[rgba(192,132,252,0.2)]">
                            {t.seat?.code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-black text-[#F8FAFC] whitespace-nowrap">
                          {t.price?.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              t.status === 'Valid'
                                ? 'bg-[rgba(34,197,94,0.2)] border-[#22C55E] text-[#86EFAC]'
                                : t.status === 'Used'
                                ? 'bg-[rgba(56,189,248,0.2)] border-[#38BDF8] text-[#7DD3FC]'
                                : 'bg-[rgba(225,29,72,0.2)] border-[#E11D48] text-[#FDA4AF]'
                            }`}
                          >
                            {statusText}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <Link
                            href={`/staff/lookup?q=${encodeURIComponent(
                              t.ticket_code || String(t.id)
                            )}`}
                            className="text-xs font-bold text-[#C084FC] hover:text-white transition-colors no-underline"
                          >
                            Chi Tiết & Xử Lý →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tickets.length > 8 && (
            <div className="p-3.5 bg-[rgba(8,6,14,0.6)] border-t border-[rgba(192,132,252,0.15)] text-center">
              <Link
                href="/staff/lookup"
                className="text-xs font-bold text-[#FDA4AF] hover:text-white transition-colors no-underline"
              >
                Xem Toàn Bộ {tickets.length} Vé Trong Hệ Thống →
              </Link>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
