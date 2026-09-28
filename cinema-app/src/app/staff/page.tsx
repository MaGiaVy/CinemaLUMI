'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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
    <div className="flex-1 bg-[#141414] p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Dashboard Nhân Viên Quầy
              </h1>
              <span className="bg-[#E63946]/20 border border-[#E63946]/40 text-[#E63946] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                STAFF COUNTER
              </span>
            </div>
            <p className="text-[#A3A3A3] text-sm mt-1">
              📅 {todayStr} • Ca làm việc: 08:00 - 17:00
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchRecentTickets}
              disabled={loading}
            >
              🔄 {loading ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}
            </Button>
            <Link href="/staff/lookup">
              <Button variant="primary" size="sm">
                🔍 Tra cứu & Hủy vé
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4 transition-all hover:border-[#404040]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#E63946]/10 border border-[#E63946]/30 flex items-center justify-center text-xl text-[#E63946]">
                🎟️
              </div>
              <div>
                <p className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider">Tổng số vé đặt</p>
                <p className="text-white font-black text-xl lg:text-2xl mt-0.5">
                  {loading ? '...' : totalTickets}
                </p>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-[#737373]">
              Bao gồm cả vé đặt tại quầy và online
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4 transition-all hover:border-[#404040]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFB703]/10 border border-[#FFB703]/30 flex items-center justify-center text-xl text-[#FFB703]">
                💰
              </div>
              <div>
                <p className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider">Doanh thu vé</p>
                <p className="text-[#FFB703] font-black text-xl lg:text-2xl mt-0.5">
                  {loading ? '...' : `${(totalRevenue / 1000).toLocaleString('vi-VN')}k`}
                </p>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-[#737373]">
              Chỉ tính các vé chưa bị hoàn tiền
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4 transition-all hover:border-[#404040]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/30 flex items-center justify-center text-xl text-[#2ECC71]">
                ✅
              </div>
              <div>
                <p className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider">Vé hợp lệ / Đã dùng</p>
                <p className="text-white font-black text-xl lg:text-2xl mt-0.5">
                  {loading ? '...' : `${validTickets} / ${usedTickets}`}
                </p>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-[#737373]">
              {validTickets} vé chờ xem • {usedTickets} đã quét vào rạp
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-4 transition-all hover:border-[#404040]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0088FF]/10 border border-[#0088FF]/30 flex items-center justify-center text-xl text-[#0088FF]">
                ⚠️
              </div>
              <div>
                <p className="text-[#A3A3A3] text-xs font-medium uppercase tracking-wider">Vé đã hủy / Hoàn tiền</p>
                <p className="text-[#E63946] font-black text-xl lg:text-2xl mt-0.5">
                  {loading ? '...' : cancelledTickets}
                </p>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-[#737373]">
              Đã bồi hoàn theo quy trình UC-15 / BR-03
            </div>
          </div>
        </div>

        {/* Quick Search Card */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 lg:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span>⚡</span> Tra Cứu Nhanh Vé Khách Hàng Tại Quầy
              </h2>
              <p className="text-[#A3A3A3] text-xs mt-0.5">
                Nhập số điện thoại, email, hoặc mã vé để kiểm tra thông tin và xử lý sự cố tức thì
              </p>
            </div>
          </div>

          <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] text-base">
                🔍
              </span>
              <input
                type="text"
                placeholder="Nhập số điện thoại khách hàng, email hoặc mã vé (#LMC-...)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#404040] focus:border-[#E63946] rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none transition-colors"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Tìm kiếm ngay
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#2D2D2D] text-xs">
            <span className="text-[#737373]">Từ khóa gợi ý:</span>
            {['0901234567', 'khachhang@lumi.vn', '#LMC-000003', 'Cinema 01', 'A1'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setSearchQuery(sample);
                  router.push(`/staff/lookup?q=${encodeURIComponent(sample)}`);
                }}
                className="text-[#0088FF] hover:underline bg-[#0088FF]/10 px-2.5 py-1 rounded-md transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Tickets Table */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl overflow-hidden shadow-lg">
          <div className="p-5 border-b border-[#2D2D2D] flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <span>📋</span> Vé Đặt Mới Nhất Trong Hệ Thống
              </h2>
              <p className="text-[#A3A3A3] text-xs mt-0.5">
                Hiển thị dữ liệu trực tiếp từ cơ sở dữ liệu rạp chiếu
              </p>
            </div>
            <Link
              href="/staff/lookup"
              className="text-xs text-[#0088FF] hover:underline flex items-center gap-1 font-medium"
            >
              Mở trang tra cứu chi tiết →
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-[#E63946]/10 border-b border-[#E63946]/20 text-[#E63946] text-sm">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-[#737373]">
              <div className="inline-block animate-spin text-2xl mb-3">⏳</div>
              <p className="text-sm">Đang tải danh sách vé mới nhất...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center text-[#737373]">
              <p className="text-3xl mb-2">🎟️</p>
              <p className="text-white font-medium text-sm">Chưa có vé nào trong hệ thống</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2D2D2D] text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider bg-[#191919]">
                    <th className="px-5 py-3.5">Mã Vé</th>
                    <th className="px-5 py-3.5">Khách Hàng</th>
                    <th className="px-5 py-3.5">Phim & Suất Chiếu</th>
                    <th className="px-5 py-3.5">Ghế Ngồi</th>
                    <th className="px-5 py-3.5">Giá Vé</th>
                    <th className="px-5 py-3.5">Trạng Thái</th>
                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2D2D]">
                  {tickets.slice(0, 8).map((t) => {
                    const statusVariant =
                      t.status === 'Valid'
                        ? 'green'
                        : t.status === 'Used'
                        ? 'blue'
                        : 'red';

                    const statusText =
                      t.status === 'Valid'
                        ? 'Hợp lệ'
                        : t.status === 'Used'
                        ? 'Đã sử dụng'
                        : 'Đã hủy';

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-[#252525] transition-colors"
                      >
                        <td className="px-5 py-4 font-mono font-bold text-white text-xs whitespace-nowrap">
                          {t.ticket_code || `#LMC-${String(t.id).padStart(6, '0')}`}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {t.customer?.name || 'Khách vãng lai'}
                          </div>
                          <div className="text-xs text-[#A3A3A3]">
                            {t.customer?.phone || t.customer?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <div className="font-medium text-white truncate">
                            {t.movie?.title || 'Phim rạp'}
                          </div>
                          <div className="text-xs text-[#737373]">
                            {t.screening?.room} •{' '}
                            {t.screening?.start_time
                              ? new Date(t.screening.start_time).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-white bg-[#333333] px-2 py-1 rounded">
                            {t.seat?.code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#FFB703] whitespace-nowrap">
                          {t.price?.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge variant={statusVariant}>{statusText}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/staff/lookup?q=${encodeURIComponent(
                              t.ticket_code || String(t.id)
                            )}`}
                          >
                            <Button variant="ghost" size="sm">
                              Chi tiết & Xử lý →
                            </Button>
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
            <div className="p-4 bg-[#191919] border-t border-[#2D2D2D] text-center">
              <Link href="/staff/lookup">
                <Button variant="ghost" size="sm">
                  Xem toàn bộ {tickets.length} vé trong hệ thống →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
