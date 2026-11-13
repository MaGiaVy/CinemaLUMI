'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { TicketDetailResult } from '@/app/api/tickets/[id]/route';

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
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function TicketDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const ticketIdParam = params?.id as string;
  const userIdParam = searchParams.get('user_id');

  const [ticket, setTicket] = useState<TicketDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [_errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal hủy vé
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Toast thông báo
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Tải chi tiết vé từ GET /api/tickets/[id]
  const fetchTicketDetail = useCallback(async () => {
    if (!ticketIdParam) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const url = userIdParam
        ? `/api/tickets/${ticketIdParam}?user_id=${userIdParam}`
        : `/api/tickets/${ticketIdParam}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Không tìm thấy thông tin vé');
      }

      setTicket(data.data);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết vé:', err);
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [ticketIdParam, userIdParam, showToast]);

  useEffect(() => {
    fetchTicketDetail();
  }, [fetchTicketDetail]);

  // Kiểm tra điều kiện tự hủy vé theo BR-03
  const cancellationStatus = useMemo(() => {
    if (!ticket) return { canCancel: false, reason: 'Không có dữ liệu', hoursRemaining: 0 };

    if (ticket.status !== 'Valid') {
      return {
        canCancel: false,
        reason: ticket.status === 'Used' ? 'Vé đã qua sử dụng' : 'Vé đã bị hủy',
        hoursRemaining: 0,
      };
    }

    const startTimeStr = ticket.screening?.startTime || ticket.screening?.start_time;
    if (!startTimeStr) {
      return { canCancel: false, reason: 'Không có thời gian chiếu', hoursRemaining: 0 };
    }

    const startTime = new Date(startTimeStr).getTime();
    const now = currentTime || 0;
    const diffMs = startTime - now;
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    if (hoursRemaining < 2) {
      return {
        canCancel: false,
        reason: hoursRemaining <= 0
          ? 'Suất chiếu đã bắt đầu hoặc đã kết thúc'
          : 'Đã quá thời hạn hủy vé (cần hủy trước giờ chiếu ít nhất 2 giờ)',
        hoursRemaining,
      };
    }

    return {
      canCancel: true,
      hoursRemaining,
    };
  }, [ticket, currentTime]);

  // Xử lý hủy vé
  const handleCancelTicket = async () => {
    if (!ticket) return;

    try {
      setIsCancelling(true);
      const url = userIdParam
        ? `/api/tickets/${ticket.id}/cancel?user_id=${userIdParam}`
        : `/api/tickets/${ticket.id}/cancel`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Hủy vé thất bại');
      }

      const compCoupon = data.data?.compensation_coupon?.code;
      const releasedSeat = data.data?.released_seat || ticket.seat?.code;

      showToast(
        `Hủy vé thành công! Ghế ${releasedSeat || ''} đã được giải phóng.${
          compCoupon ? ` Voucher bồi hoàn 50%: ${compCoupon}` : ''
        }`,
        'success'
      );

      setIsCancelModalOpen(false);
      await fetchTicketDetail();
    } catch (err) {
      console.error('Lỗi khi hủy vé:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi kết nối khi hủy vé', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="hourglass-spin text-3xl">⏳</div>
          <p className="text-[#94A3B8] text-sm">Đang tải thẻ vé điện tử...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] py-16 px-4 font-sans">
        <div className="max-w-md mx-auto bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400 font-bold text-lg">
            ✕
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">Không tìm thấy vé</h2>
          <p className="text-[#94A3B8] text-sm mb-6">
            Mã vé không tồn tại trong hệ thống hoặc bạn không có quyền xem thông tin vé này.
          </p>
          <Link
            href="/tickets"
            className="inline-block py-2.5 px-6 bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-sm font-semibold rounded-xl shadow-lg transition"
          >
            ← Quay lại danh sách vé
          </Link>
        </div>
      </div>
    );
  }

  const startTime = ticket.screening?.startTime || ticket.screening?.start_time;
  const endTime = ticket.screening?.endTime || ticket.screening?.end_time;
  const qrValue = ticket.qr_payload || ticket.qrPayload || JSON.stringify({ ticket_id: ticket.id });
  const posterUrl =
    ticket.movie?.poster ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop&auto=format';

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] py-8 sm:py-12 font-sans selection:bg-[#E11D48] selection:text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition"
            >
              <span>←</span>
              <span>Danh sách vé của tôi</span>
            </Link>
          </div>

          {/* Header mã vé và trạng thái */}
          <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-6 mb-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
                <span className="text-rose-400 font-bold">✦</span>
                <span>COSMIC BOARDING PASS</span>
                <span>•</span>
                <span className="font-mono text-slate-300">LUMI CINEMA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] font-mono tracking-tight">
                #LMC-{String(ticket.id).padStart(6, '0')}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {ticket.status === 'Valid' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  CÒN HIỆU LỰC
                </span>
              )}
              {ticket.status === 'Used' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-700/30 text-slate-400 border border-slate-600/40">
                  ✓ ĐÃ SỬ DỤNG
                </span>
              )}
              {ticket.status === 'Cancelled' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ✕ ĐÃ HỦY VÉ
                </span>
              )}
            </div>
          </div>

          {/* Banner lý do hủy vé — chỉ hiện khi Cancelled */}
          {ticket.status === 'Cancelled' && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 mb-6 shadow-xl backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-xs flex-shrink-0">
                  ✕
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-rose-300 text-sm mb-1">Vé đã bị hủy</h3>
                  <p className="text-xs text-slate-400 mb-1">Lý do hủy:</p>
                  <p className="text-sm text-white font-medium leading-relaxed">
                    {ticket.cancellationReason || 'Không có thông tin lý do hủy'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bố cục 2 cột: Cột trái (Mã QR Check-in) & Cột phải (Chi tiết phim, suất, ghế) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Cột trái: Mã QR Code soát vé (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-6 shadow-xl text-center flex flex-col items-center backdrop-blur-xl">
                <div className="mb-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#FDA4AF]">
                    ✦ Mã QR Check-in Vào Rạp
                  </span>
                </div>

                {/* Khung chứa QR Code trắng */}
                <div className="bg-white p-4 rounded-2xl shadow-2xl flex items-center justify-center mb-3">
                  <QRCodeSVG
                    value={qrValue}
                    size={190}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1 mb-4">
                  <p className="font-mono text-sm font-bold text-[#F8FAFC] tracking-widest">
                    LMC-{ticket.id}-{ticket.seat?.code || 'X'}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] max-w-[220px]">
                    Xuất trình mã này cho nhân viên soát vé tại cửa phòng chiếu để quét laser
                  </p>
                </div>

                {/* Bảo mật chữ ký HMAC */}
                <div className="w-full bg-[rgba(10,8,18,0.85)] border border-[rgba(192,132,252,0.15)] rounded-xl p-3 text-left space-y-1 text-[11px] text-[#94A3B8]">
                  <div className="flex items-center gap-1.5 text-[#F8FAFC] font-semibold">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Ký số bảo mật HMAC-SHA256</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Mã QR được mã hóa chống giả mạo, chỉ có hiệu lực tại hệ thống rạp Lumi Cinema.
                  </p>
                </div>
              </div>

              {/* Các nút thao tác: In vé / Hủy vé */}
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-4 shadow-xl space-y-3 backdrop-blur-xl">
                <Button
                  variant="secondary"
                  fullWidth
                  size="md"
                  onClick={() => window.print()}
                  className="text-xs"
                >
                  In Vé / Lưu Bản Điện Tử
                </Button>

                {/* Nút hủy vé tuân theo ràng buộc BR-03 */}
                {ticket.status === 'Valid' && (
                  <div>
                    {cancellationStatus.canCancel ? (
                      <Button
                        variant="danger"
                        fullWidth
                        size="md"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="text-xs"
                      >
                        Hủy Vé & Nhận Voucher 50%
                      </Button>
                    ) : (
                      <div className="text-center p-2.5 bg-[rgba(10,8,18,0.7)] rounded-xl border border-[rgba(192,132,252,0.12)]">
                        <span className="text-[11px] text-slate-400 block mb-0.5">
                          ✦ Không thể hủy vé
                        </span>
                        <span className="text-[10px] text-rose-400 leading-tight block">
                          {cancellationStatus.reason}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cột phải: Toàn bộ thông tin chi tiết vé (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Card Phim */}
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-xl flex gap-4 backdrop-blur-xl">
                <div className="relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-[#0A0812] border border-[rgba(192,132,252,0.2)]">
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

                <div className="flex-1 min-w-0 space-y-1.5">
                  <h2 className="text-lg font-black text-[#F8FAFC] leading-snug">
                    {ticket.movie?.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-[#94A3B8]">
                    {ticket.movie?.genre && <span>{ticket.movie.genre}</span>}
                    {ticket.movie?.duration && <span>• {ticket.movie.duration} phút</span>}
                  </div>
                  <div className="pt-1">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-[rgba(10,8,18,0.8)] text-slate-300 border border-[rgba(192,132,252,0.15)]">
                      Định dạng Laser 4K Phụ Đề
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Suất Chiếu & Phòng Chiếu */}
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-xl space-y-3 backdrop-blur-xl">
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#FDA4AF]">
                  ✦ Thông Tin Suất Chiếu
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[rgba(10,8,18,0.85)] p-3 rounded-xl border border-[rgba(192,132,252,0.12)]">
                    <span className="text-xs text-slate-500 block mb-1">Ngày chiếu:</span>
                    <span className="font-semibold text-[#F8FAFC]">{formatDate(startTime)}</span>
                  </div>
                  <div className="bg-[rgba(10,8,18,0.85)] p-3 rounded-xl border border-[rgba(192,132,252,0.12)]">
                    <span className="text-xs text-slate-500 block mb-1">Thời gian:</span>
                    <span className="font-bold text-[#FDA4AF]">
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </span>
                  </div>
                  <div className="bg-[rgba(10,8,18,0.85)] p-3 rounded-xl border border-[rgba(192,132,252,0.12)]">
                    <span className="text-xs text-slate-500 block mb-1">Phòng chiếu:</span>
                    <span className="font-bold text-[#F8FAFC]">
                      Phòng {ticket.screening?.room || '1'}
                    </span>
                  </div>
                  <div className="bg-[rgba(10,8,18,0.85)] p-3 rounded-xl border border-[rgba(192,132,252,0.12)]">
                    <span className="text-xs text-slate-500 block mb-1">Cụm rạp:</span>
                    <span className="font-semibold text-[#F8FAFC]">Lumi Cinema Landmark</span>
                  </div>
                </div>
              </div>

              {/* Card Vị Trí Ghế & Loại Vé */}
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-xl space-y-3 backdrop-blur-xl">
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#FDA4AF]">
                  ✦ Vị Trí Ghế Ngồi
                </h3>
                <div className="flex items-center justify-between p-3.5 bg-[rgba(10,8,18,0.85)] rounded-xl border border-[rgba(192,132,252,0.12)]">
                  <div className="flex items-center gap-3">
                    <Badge variant="gold" size="md">
                      Ghế {ticket.seat?.code || '---'}
                    </Badge>
                    <div className="text-xs text-[#94A3B8]">
                      <span>Hàng {ticket.seat?.row || '---'}</span> •{' '}
                      <span>Số {ticket.seat?.number || '---'}</span>
                      {ticket.seat?.type && (
                        <span className="ml-1 text-slate-300">({ticket.seat.type})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Giá vé:</span>
                    <span className="font-bold text-[#F8FAFC] text-base">
                      {Number(ticket.price || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Khách Hàng & Thanh Toán */}
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-xl space-y-3 backdrop-blur-xl">
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#FDA4AF]">
                  ✦ Thông Tin Thanh Toán
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[rgba(192,132,252,0.12)]">
                    <span className="text-slate-400">Họ và tên khách:</span>
                    <span className="text-[#F8FAFC] font-medium">{ticket.user?.name || 'Khách hàng'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[rgba(192,132,252,0.12)]">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-[#F8FAFC] font-mono">{ticket.user?.email || '---'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[rgba(192,132,252,0.12)]">
                    <span className="text-slate-400">Mã giao dịch:</span>
                    <span className="text-[#F8FAFC] font-mono">
                      #{ticket.payment?.transactionCode || ticket.payment?.id || '---'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[rgba(192,132,252,0.12)]">
                    <span className="text-slate-400">Cổng thanh toán:</span>
                    <span className="text-[#F8FAFC] font-medium">
                      {ticket.payment?.paymentMethod || 'ZaloPay / VNPay'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Thời gian mua:</span>
                    <span className="text-slate-300">
                      {formatTime(ticket.purchaseDate)} - {formatDate(ticket.purchaseDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận Hủy Vé (BR-03) */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !isCancelling && setIsCancelModalOpen(false)}
        title="Xác Nhận Hủy Vé Xem Phim"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn hủy vé <strong className="text-white">#LMC-{ticket.id}</strong> cho suất chiếu{' '}
            <strong className="text-white">{ticket.movie?.title}</strong> không?
          </p>

          <div className="bg-[rgba(15,11,26,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl p-3.5 space-y-1.5 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
              <span>✦</span>
              <span>Quy định bồi hoàn tự động BR-03:</span>
            </div>
            <p>
              - Vì thời gian đến suất chiếu còn trên 2 giờ, bạn sẽ nhận được một voucher bồi thường 50% tiền vé có mã <strong className="text-[#FDA4AF]">COMP50_</strong>.
            </p>
            <p>- Ghế ngồi {ticket.seat?.code} sẽ được mở lại ngay trên sơ đồ đặt vé.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isCancelling}
              onClick={() => setIsCancelModalOpen(false)}
            >
              Giữ lại vé
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isCancelling}
              onClick={handleCancelTicket}
            >
              {isCancelling ? (
                <div className="flex items-center gap-2">
                  <span className="hourglass-spin text-xs">⏳</span>
                  <span>Đang hủy vé...</span>
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

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex items-center justify-center font-sans">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#94A3B8]">Đang tải chi tiết vé...</span>
          </div>
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
