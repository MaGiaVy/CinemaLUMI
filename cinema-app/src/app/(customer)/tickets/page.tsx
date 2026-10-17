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

  // Thống kê số lượng vé theo trạng thái
  const stats = useMemo(() => {
    const total = tickets.length;
    const valid = tickets.filter(t => t.status === 'Valid').length;
    const used = tickets.filter(t => t.status === 'Used').length;
    const cancelled = tickets.filter(t => t.status === 'Cancelled').length;
    return { total, valid, used, cancelled };
  }, [tickets]);

  // Lọc và tìm kiếm vé
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Lọc theo tab
      if (filter === 'valid' && ticket.status !== 'Valid') return false;
      if (filter === 'used' && ticket.status !== 'Used') return false;
      if (filter === 'cancelled' && ticket.status !== 'Cancelled') return false;

      // Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const movieTitle = ticket.movie?.title?.toLowerCase() || '';
        const seatCode = ticket.seat?.code?.toLowerCase() || '';
        const room = ticket.screening?.room?.toLowerCase() || '';
        const ticketId = String(ticket.id);
        const transCode = ticket.payment?.transactionCode?.toLowerCase() || ticket.payment?.transaction_code?.toLowerCase() || '';

        return (
          movieTitle.includes(query) ||
          seatCode.includes(query) ||
          room.includes(query) ||
          ticketId.includes(query) ||
          transCode.includes(query)
        );
      }

      return true;
    });
  }, [tickets, filter, searchTerm]);

  // Xử lý hủy vé qua API DELETE /api/tickets/[id]
  const handleConfirmCancel = async () => {
    if (!cancelModalTicket) return;

    try {
      setIsCancelling(true);
      const url = userIdParam
        ? `/api/tickets/${cancelModalTicket.id}?user_id=${userIdParam}`
        : `/api/tickets/${cancelModalTicket.id}`;

      const res = await fetch(url, {
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

      // Đóng modal và tải lại danh sách
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

      <div className="min-h-screen bg-[#1A1A1A] text-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header tiêu đề */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#333]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                Vé Của Tôi
              </h1>
              <p className="text-[#A3A3A3] text-sm">
                Quản lý vé đã đặt và xuất trình mã QR khi vào phòng chiếu
              </p>
            </div>

            {/* Thống kê nhanh */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-[#2D2D2D] border border-[#404040] text-gray-300">
                Tổng: <strong className="text-white ml-1 font-bold">{stats.total}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#2ECC71]/15 border border-[#2ECC71]/30 text-[#2ECC71]">
                Còn hạn: <strong className="ml-1 font-bold">{stats.valid}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#2D2D2D] text-gray-400">
                Đã dùng: <strong className="text-gray-200 ml-1 font-bold">{stats.used}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#E63946]/15 border border-[#E63946]/30 text-[#E63946]">
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
                      ? 'bg-[#E63946] text-white shadow-md'
                      : 'bg-[#2D2D2D] text-gray-400 hover:text-white hover:bg-[#383838] border border-[#404040]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === tab.key ? 'bg-black/30 text-white' : 'bg-[#1E1E1E] text-gray-400'
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
                className="w-full px-4 py-2 bg-[#2D2D2D] border border-[#404040] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E63946] transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
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
                  className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 animate-pulse flex flex-col md:flex-row gap-6"
                >
                  <div className="w-24 h-36 bg-[#383838] rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="w-2/3 h-6 bg-[#383838] rounded" />
                    <div className="w-1/3 h-4 bg-[#383838] rounded" />
                    <div className="w-1/2 h-4 bg-[#383838] rounded" />
                  </div>
                  <div className="w-32 h-20 bg-[#383838] rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            /* Trạng thái rỗng */
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-12 text-center my-8">
              <h3 className="text-xl font-bold text-white mb-2">
                {searchTerm ? 'Không tìm thấy vé phù hợp' : 'Chưa có vé nào trong danh mục này'}
              </h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                {searchTerm
                  ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc thử với từ khóa khác'
                  : 'Hãy khám phá các phim đang chiếu và đặt vé ngay hôm nay.'}
              </p>
              <Link
                href="/#showing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E63946] hover:bg-[#D90429] text-white font-semibold rounded-xl transition shadow-md"
              >
                Khám phá phim đang chiếu
              </Link>
            </div>
          ) : (
            /* Danh sách thẻ vé TicketCard */
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
                    className="bg-[#2D2D2D] border border-[#404040] hover:border-[#555] rounded-xl p-5 sm:p-6 transition-all duration-200 shadow-md flex flex-col lg:flex-row gap-6 items-stretch justify-between"
                  >
                    {/* Khối Thông tin Phim & Suất chiếu */}
                    <div className="flex gap-4 sm:gap-5 flex-1 min-w-0">
                      {/* Poster phim */}
                      <div className="relative w-20 sm:w-24 h-28 sm:h-36 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-[#404040]">
                        <img
                          src={posterUrl}
                          alt={ticket.movie?.title || 'Phim'}
                          className="w-full h-full object-cover"
                        />
                        {ticket.movie?.ageRating && (
                          <div className="absolute top-1 left-1 bg-[#E63946] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
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
                              className="text-white hover:text-[#E63946] font-bold text-base sm:text-lg line-clamp-1 transition"
                            >
                              {ticket.movie?.title || 'Phim chiếu rạp'}
                            </Link>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Mã vé: <span className="font-mono text-gray-200 font-bold">#LMC-{String(ticket.id).padStart(6, '0')}</span>
                            </p>
                          </div>
                          <div>{renderStatusBadge(ticket.status)}</div>
                        </div>

                        {/* Thông tin suất chiếu: Ngày, Giờ, Phòng */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-300 pt-1">
                          <div className="bg-[#1E1E1E] px-2.5 py-1.5 rounded-lg border border-[#383838]">
                            <span className="font-medium truncate">{formatDate(startTime)}</span>
                          </div>
                          <div className="bg-[#1E1E1E] px-2.5 py-1.5 rounded-lg border border-[#383838]">
                            <span className="font-bold text-[#FFB703]">
                              {formatTime(startTime)} - {formatTime(endTime)}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1 bg-[#1E1E1E] px-2.5 py-1.5 rounded-lg border border-[#383838]">
                            <span className="truncate">Phòng {ticket.screening?.room || '1'}</span>
                          </div>
                        </div>

                        {/* Ghế & Giá vé & Loại vé */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#383838]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Vị trí ghế:</span>
                            <Badge variant="gold" size="md">
                              Ghế {ticket.seat?.code || '---'}
                            </Badge>
                            {ticket.seat?.type && (
                              <span className="text-[11px] text-gray-400">
                                ({ticket.seat.type})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 mr-1.5">Loại vé: {ticket.ticketType || ticket.ticket_type}</span>
                            <span className="text-base font-bold text-[#FFB703]">
                              {Number(ticket.price || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cột phải: QR Code preview & Nút hành động */}
                    <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#383838] lg:pl-6 min-w-[180px]">
                      {/* Mini QR Box */}
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="bg-white p-2 rounded-lg flex flex-col items-center shadow-md hover:scale-105 transition-transform group cursor-pointer"
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
                        <span className="text-[9px] text-gray-700 font-mono font-bold mt-1 group-hover:text-red-600 transition">
                          Xem mã QR
                        </span>
                      </Link>

                      {/* Các nút hành động */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto lg:w-full">
                        <Link href={`/tickets/${ticket.id}`} className="w-full">
                          <Button variant="secondary" size="sm" fullWidth className="text-xs">
                            Chi tiết vé
                          </Button>
                        </Link>

                        {/* Nút Hủy vé theo ràng buộc nghiệp vụ */}
                        {isStatusValid && (
                          <div className="w-full">
                            {eligibility.canCancel ? (
                              <Button
                                variant="danger"
                                size="sm"
                                fullWidth
                                onClick={() => setCancelModalTicket(ticket)}
                                className="text-xs bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/40 hover:bg-[#E63946] hover:text-white transition"
                              >
                                Hủy vé
                              </Button>
                            ) : (
                              <button
                                disabled
                                title={eligibility.reason}
                                className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-[#2D2D2D] text-gray-500 border border-[#3D3D3D] cursor-not-allowed opacity-60"
                              >
                                Hết hạn hủy
                              </button>
                            )}
                          </div>
                        )}

                        {ticket.status === 'Cancelled' && (
                          <span className="text-[11px] text-red-400 text-center font-medium block">
                            Vé đã hủy
                          </span>
                        )}
                        {ticket.status === 'Used' && (
                          <span className="text-[11px] text-gray-400 text-center font-medium block">
                            Đã soát vé
                          </span>
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

      {/* Modal xác nhận Hủy Vé */}
      <Modal
        isOpen={!!cancelModalTicket}
        onClose={() => !isCancelling && setCancelModalTicket(null)}
        title="Xác Nhận Hủy Vé Xem Phim"
      >
        {cancelModalTicket && (
          <div className="space-y-4">
            {/* Thông tin vé dự kiến hủy */}
            <div className="bg-[#1E1E1E] border border-[#383838] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-[#383838]">
                <span className="text-gray-400">Mã vé:</span>
                <span className="font-mono font-bold text-white">#LMC-{String(cancelModalTicket.id).padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tên phim:</span>
                <span className="font-bold text-white text-right max-w-[240px] truncate">
                  {cancelModalTicket.movie?.title}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Suất chiếu:</span>
                <span className="text-[#FFB703] font-semibold">
                  {formatTime(cancelModalTicket.screening?.startTime)} - {formatDate(cancelModalTicket.screening?.startTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Phòng & Ghế:</span>
                <span className="text-white font-bold">
                  Phòng {cancelModalTicket.screening?.room} • Ghế {cancelModalTicket.seat?.code}
                </span>
              </div>
            </div>

            {/* Hộp chính sách hủy vé */}
            <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-4 text-xs space-y-2">
              <p className="font-bold text-red-400 text-sm">
                Quy định hủy vé và voucher hoàn trả
              </p>
              <ul className="text-gray-300 space-y-1.5 list-disc pl-4">
                <li>
                  Thao tác hủy vé <strong>chỉ hợp lệ</strong> trước giờ chiếu ít nhất <strong>2 tiếng</strong>.
                </li>
                <li>
                  Ghế <strong>{cancelModalTicket.seat?.code}</strong> sẽ được giải phóng ngay lập tức để người khác có thể đặt.
                </li>
                <li>
                  Hệ thống sẽ cấp ngay <strong>Voucher giảm 50%</strong> (hạn dùng 30 ngày) vào tài khoản của bạn.
                </li>
                <li>
                  Vé sau khi hủy <strong>không thể hoàn tác</strong> hoặc khôi phục lại.
                </li>
              </ul>
            </div>

            {/* Các nút bấm hành động */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                fullWidth
                disabled={isCancelling}
                onClick={() => setCancelModalTicket(null)}
              >
                Giữ vé lại
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="bg-[#E63946] hover:bg-[#D90429]"
              >
                {isCancelling ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  'Xác nhận hủy vé'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
            <span>Đang tải danh sách vé...</span>
          </div>
        </div>
      }
    >
      <MyTicketsContent />
    </Suspense>
  );
}

