'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { TicketListItem } from '@/app/api/tickets/route';

type FilterTab = 'all' | 'valid' | 'used' | 'cancelled';

/**
 * Định dạng thời gian (giờ:phút)
 */
function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Định dạng ngày (Thứ, dd/mm/yyyy)
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '---';
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Trả về Badge hiển thị trạng thái vé
 */
function renderStatusBadge(status: string) {
  switch (status) {
    case 'Valid':
      return <Badge variant="green" size="md">Còn hiệu lực</Badge>;
    case 'Used':
      return <Badge variant="gray" size="md">Đã sử dụng</Badge>;
    case 'Cancelled':
      return <Badge variant="red" size="md">Đã hủy</Badge>;
    default:
      return <Badge variant="gray" size="md">{status}</Badge>;
  }
}

/**
 * Kiểm tra điều kiện tự hủy vé theo nghiệp vụ BR-03:
 * - Vé phải chưa qua sử dụng (status === 'Valid')
 * - Thời gian hủy phải diễn ra trước giờ suất chiếu ít nhất 2 giờ
 */
function getCancellationEligibility(ticket: TicketListItem): {
  canCancel: boolean;
  reason?: string;
  hoursRemaining: number;
} {
  if (ticket.status !== 'Valid') {
    return {
      canCancel: false,
      reason: ticket.status === 'Used' ? 'Vé đã qua sử dụng' : 'Vé đã bị hủy trước đó',
      hoursRemaining: 0,
    };
  }

  const startTimeStr = ticket.screening?.startTime || ticket.screening?.start_time;
  if (!startTimeStr) {
    return { canCancel: false, reason: 'Không có dữ liệu suất chiếu', hoursRemaining: 0 };
  }

  const startTime = new Date(startTimeStr).getTime();
  const now = Date.now();
  const diffMs = startTime - now;
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining < 2) {
    return {
      canCancel: false,
      reason: hoursRemaining <= 0
        ? 'Suất chiếu đã bắt đầu hoặc đã kết thúc'
        : 'Quá hạn hủy vé (còn dưới 2 giờ trước suất chiếu)',
      hoursRemaining,
    };
  }

  return {
    canCancel: true,
    hoursRemaining,
  };
}

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('user_id');

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal hủy vé
  const [cancelModalTicket, setCancelModalTicket] = useState<TicketListItem | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Toast thông báo
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch danh sách vé từ API GET /api/tickets
  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = userIdParam ? `/api/tickets?user_id=${userIdParam}` : '/api/tickets';
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Không thể tải danh sách vé');
      }

      setTickets(data.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách vé:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [userIdParam, showToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      valid: tickets.filter(t => t.status === 'Valid').length,
      used: tickets.filter(t => t.status === 'Used').length,
      cancelled: tickets.filter(t => t.status === 'Cancelled').length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filter === 'valid' && t.status !== 'Valid') return false;
      if (filter === 'used' && t.status !== 'Used') return false;
      if (filter === 'cancelled' && t.status !== 'Cancelled') return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const movieTitle = t.movie?.title?.toLowerCase() || '';
        const seatCode = t.seat?.code?.toLowerCase() || '';
        const ticketId = String(t.id);
        const roomName = t.screening?.room?.toLowerCase() || '';

        return (
          movieTitle.includes(query) ||
          seatCode.includes(query) ||
          ticketId.includes(query) ||
          roomName.includes(query)
        );
      }

      return true;
    });
  }, [tickets, filter, searchTerm]);

  // Thực thi hủy vé: Gọi DELETE /api/tickets/[id]/cancel
  const handleConfirmCancel = async () => {
    if (!cancelModalTicket) return;

    try {
      setIsCancelling(true);
      const cancelUrl = userIdParam
        ? `/api/tickets/${cancelModalTicket.id}/cancel?user_id=${userIdParam}`
        : `/api/tickets/${cancelModalTicket.id}/cancel`;

      const res = await fetch(cancelUrl, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Hủy vé thất bại');
      }

      const couponCode = data.data?.compensation_coupon?.code;
      const releasedSeat = data.data?.released_seat || cancelModalTicket.seat?.code;

      showToast(
        `Hủy vé thành công! Ghế ${releasedSeat || ''} đã được giải phóng.${
          couponCode ? ` Voucher bồi hoàn 50%: ${couponCode}` : ''
        }`,
        'success'
      );

      setCancelModalTicket(null);
      await fetchTickets();
    } catch (err) {
      console.error('Lỗi khi hủy vé:', err);
      showToast(err instanceof Error ? err.message : 'Không thể thực hiện hủy vé', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] py-8 sm:py-12 font-sans selection:bg-[#E11D48] selection:text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header tiêu đề */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[rgba(192,132,252,0.15)]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-rose-400 font-bold text-xl">✦</span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
                  Vé Của Tôi
                </h1>
              </div>
              <p className="text-[#94A3B8] text-sm">
                Quản lý vé điện tử Cosmic Boarding Pass, quét mã QR vào phòng chiếu hoặc hủy vé nhận voucher 50%
              </p>
            </div>

            {/* Thống kê nhanh */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.15)] text-[#94A3B8]">
                Tổng: <strong className="text-white ml-1 font-bold">{stats.total}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Còn hạn: <strong className="ml-1 font-bold">{stats.valid}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400">
                Đã dùng: <strong className="text-slate-300 ml-1 font-bold">{stats.used}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                Đã hủy: <strong className="ml-1 font-bold">{stats.cancelled}</strong>
              </span>
            </div>
          </div>

          {/* Thanh lọc & tìm kiếm */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            {/* Tabs lọc */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {(
                [
                  { key: 'all', label: 'Tất cả', count: stats.total },
                  { key: 'valid', label: 'Còn hiệu lực', count: stats.valid },
                  { key: 'used', label: 'Đã sử dụng', count: stats.used },
                  { key: 'cancelled', label: 'Đã hủy', count: stats.cancelled },
                ] as const
              ).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    filter === tab.key
                      ? 'bg-gradient-to-r from-[#E11D48] to-[#881337] text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-500/40'
                      : 'bg-[rgba(18,14,28,0.7)] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(192,132,252,0.1)] border border-[rgba(192,132,252,0.15)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === tab.key ? 'bg-black/30 text-white' : 'bg-[rgba(15,11,26,0.8)] text-[#94A3B8]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Tìm phim, ghế, mã vé..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-8 py-2 bg-[rgba(15,11,26,0.85)] border border-[rgba(192,132,252,0.2)] rounded-xl text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Trạng thái tải dữ liệu */}
          {isLoading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.15)] rounded-2xl p-6 animate-pulse flex flex-col md:flex-row gap-6 backdrop-blur-xl"
                >
                  <div className="w-24 h-36 bg-[rgba(192,132,252,0.1)] rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="w-2/3 h-6 bg-[rgba(192,132,252,0.1)] rounded" />
                    <div className="w-1/3 h-4 bg-[rgba(192,132,252,0.1)] rounded" />
                    <div className="w-1/2 h-4 bg-[rgba(192,132,252,0.1)] rounded" />
                  </div>
                  <div className="w-32 h-20 bg-[rgba(192,132,252,0.1)] rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            /* Trạng thái rỗng */
            <div className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.18)] rounded-2xl p-12 text-center my-8 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-300 font-bold">
                ✦
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">
                {searchTerm ? 'Không tìm thấy vé phù hợp' : 'Chưa có vé nào trong danh mục này'}
              </h3>
              <p className="text-[#94A3B8] text-sm max-w-md mx-auto mb-6">
                {searchTerm
                  ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc thử với từ khóa khác'
                  : 'Hãy khám phá lịch chiếu các bộ phim bom tấn đang chiếu và đặt vé ngay hôm nay!'}
              </p>
              <Link
                href="/#showing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white font-semibold rounded-xl transition shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              >
                Khám phá phim đang chiếu
              </Link>
            </div>
          ) : (
            /* Danh sách thẻ vé Cosmic Boarding Pass */
            <div className="space-y-4">
              {filteredTickets.map(ticket => {
                const eligibility = getCancellationEligibility(ticket);
                const isStatusValid = ticket.status === 'Valid';
                const startTime = ticket.screening?.startTime || ticket.screening?.start_time;
                const endTime = ticket.screening?.endTime || ticket.screening?.end_time;
                const posterUrl =
                  ticket.movie?.poster ||
                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop&auto=format';

                return (
                  <div
                    key={ticket.id}
                    className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] hover:border-[rgba(192,132,252,0.4)] rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-xl flex flex-col lg:flex-row gap-6 items-stretch justify-between backdrop-blur-xl"
                  >
                    {/* Khối Thông tin Phim & Suất chiếu */}
                    <div className="flex gap-4 sm:gap-5 flex-1 min-w-0">
                      {/* Poster phim */}
                      <div className="relative w-20 sm:w-24 h-28 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-[#0A0812] border border-[rgba(192,132,252,0.25)]">
                        <img
                          src={posterUrl}
                          alt={ticket.movie?.title || 'Phim'}
                          className="w-full h-full object-cover"
                        />
                        {ticket.movie?.ageRating && (
                          <div className="absolute top-1 left-1 bg-[#E11D48] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                            {ticket.movie.ageRating}
                          </div>
                        )}
                      </div>

                      {/* Chi tiết nội dung vé */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Tiêu đề & Status Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="text-[#F8FAFC] hover:text-[#FDA4AF] font-bold text-base sm:text-lg line-clamp-1 transition"
                            >
                              {ticket.movie?.title || 'Phim chiếu rạp'}
                            </Link>
                            <p className="text-xs text-[#94A3B8] mt-0.5">
                              Mã vé: <span className="font-mono text-white font-bold">#LMC-{String(ticket.id).padStart(6, '0')}</span>
                            </p>
                          </div>
                          <div>{renderStatusBadge(ticket.status)}</div>
                        </div>

                        {/* Thông tin suất chiếu: Ngày, Giờ, Phòng */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#94A3B8] pt-1">
                          <div className="flex items-center gap-1.5 bg-[rgba(10,8,18,0.85)] px-2.5 py-1.5 rounded-xl border border-[rgba(192,132,252,0.12)]">
                            <span className="font-medium truncate">{formatDate(startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[rgba(10,8,18,0.85)] px-2.5 py-1.5 rounded-xl border border-[rgba(192,132,252,0.12)]">
                            <span className="font-bold text-[#FDA4AF]">
                              {formatTime(startTime)} - {formatTime(endTime)}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 bg-[rgba(10,8,18,0.85)] px-2.5 py-1.5 rounded-xl border border-[rgba(192,132,252,0.12)]">
                            <span className="truncate">Phòng {ticket.screening?.room || '1'}</span>
                          </div>
                        </div>

                        {/* Ghế & Giá vé & Loại vé */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(192,132,252,0.12)]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#94A3B8]">Vị trí ghế:</span>
                            <Badge variant="gold" size="md">
                              Ghế {ticket.seat?.code || '---'}
                            </Badge>
                            {ticket.seat?.type && (
                              <span className="text-[11px] text-slate-400">
                                ({ticket.seat.type})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 mr-1.5">Loại: {ticket.ticketType || ticket.ticket_type}</span>
                            <span className="text-base font-bold text-[#F8FAFC]">
                              {Number(ticket.price || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cột phải: QR Code preview & Nút hành động */}
                    <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[rgba(192,132,252,0.15)] lg:pl-6 min-w-[200px]">
                      {/* Mini QR Box */}
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="bg-white p-2 rounded-xl flex flex-col items-center shadow-md hover:scale-105 transition-transform group cursor-pointer"
                        title="Bấm để xem mã QR phóng to"
                      >
                        <QRCodeSVG
                          value={JSON.stringify({
                            ticket_id: ticket.id,
                            seat: ticket.seat?.code,
                            status: ticket.status,
                          })}
                          size={76}
                          level="M"
                        />
                        <span className="text-[9px] text-gray-700 font-mono font-bold mt-1 group-hover:text-rose-600 transition">
                          Xem QR
                        </span>
                      </Link>

                      {/* Các nút hành động */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto lg:w-full">
                        <Link href={`/tickets/${ticket.id}`} className="w-full">
                          <Button variant="secondary" size="sm" fullWidth className="text-xs">
                            Chi tiết & QR
                          </Button>
                        </Link>

                        {/* Nút Hủy vé theo ràng buộc BR-03 */}
                        {isStatusValid && (
                          <div className="w-full">
                            {eligibility.canCancel ? (
                              <Button
                                variant="danger"
                                size="sm"
                                fullWidth
                                onClick={() => setCancelModalTicket(ticket)}
                                className="text-xs"
                              >
                                Hủy vé (-50%)
                              </Button>
                            ) : (
                              <button
                                disabled
                                title={eligibility.reason}
                                className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-[rgba(18,14,28,0.5)] text-slate-500 border border-[rgba(192,132,252,0.1)] cursor-not-allowed opacity-60"
                              >
                                Hết hạn hủy
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal xác nhận Hủy Vé (BR-03) */}
      <Modal
        isOpen={!!cancelModalTicket}
        onClose={() => !isCancelling && setCancelModalTicket(null)}
        title="Xác Nhận Hủy Vé Xem Phim"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn hủy vé xem phim{' '}
            <strong className="text-white">
              {cancelModalTicket?.movie?.title} (Ghế {cancelModalTicket?.seat?.code})
            </strong>{' '}
            không?
          </p>

          <div className="bg-[rgba(15,11,26,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl p-3.5 space-y-1.5 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
              <span>✦</span>
              <span>Chính sách bồi hoàn tự động BR-03:</span>
            </div>
            <p>
              - Vé được hủy trước giờ chiếu từ 2 tiếng trở lên sẽ được bồi thường bằng voucher giảm giá 50% có mã bắt đầu bằng <strong className="text-[#FDA4AF]">COMP50_</strong>.
            </p>
            <p>- Chỗ ngồi sẽ được tự động giải phóng ngay lập tức trên hệ thống.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isCancelling}
              onClick={() => setCancelModalTicket(null)}
            >
              Giữ lại vé
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isCancelling}
              onClick={handleConfirmCancel}
            >
              {isCancelling ? (
                <div className="flex items-center gap-2">
                  <span className="hourglass-spin text-xs">⏳</span>
                  <span>Đang hủy...</span>
                </div>
              ) : (
                'Xác nhận hủy vé'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex items-center justify-center font-sans">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#94A3B8]">Đang tải danh sách vé...</span>
          </div>
        </div>
      }
    >
      <MyTicketsContent />
    </Suspense>
  );
}
