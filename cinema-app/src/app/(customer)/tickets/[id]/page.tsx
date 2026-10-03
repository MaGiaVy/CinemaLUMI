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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Kiểm tra điều kiện tự hủy vé theo BR-03:
  // - status === 'Valid'
  // - startTime - NOW >= 2 hours
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
        ? `/api/tickets/${ticket.id}?user_id=${userIdParam}`
        : `/api/tickets/${ticket.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Hủy vé thất bại');
      }

      const couponCode = data.data?.compensation_coupon?.code;
      showToast(
        `Hủy vé thành công! Ghế đã được giải phóng.${
          couponCode ? ` Voucher bồi thường 50%: ${couponCode}` : ''
        }`,
        'success'
      );

      setIsCancelModalOpen(false);
      // Cập nhật lại dữ liệu vé trên trang
      await fetchTicketDetail();
    } catch (err) {
      console.error('Lỗi khi hủy vé:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi khi xử lý hủy vé', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111217] text-white flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Đang tải thông tin chi tiết vé và tạo mã QR...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !ticket) {
    return (
      <div className="min-h-screen bg-[#111217] text-white py-16 px-4">
        <div className="max-w-md mx-auto bg-[#1A1C24] border border-[#2B2E3D] rounded-2xl p-8 text-center shadow-2xl">
          <span className="text-5xl block mb-4">⚠️</span>
          <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy vé</h2>
          <p className="text-gray-400 text-sm mb-6">
            {errorMessage || 'Vé không tồn tại hoặc bạn không có quyền truy cập vé này.'}
          </p>
          <Link
            href="/tickets"
            className="inline-block py-2.5 px-6 bg-[#E63946] hover:bg-[#C62B36] text-white text-sm font-semibold rounded-xl transition"
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

      <div className="min-h-screen bg-[#111217] text-white py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb quay lại */}
          <div className="mb-6">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
              <span>←</span>
              <span>Danh sách vé của tôi</span>
            </Link>
          </div>

          {/* Header mã vé và trạng thái */}
          <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-6 mb-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span>VÉ ĐIỆN TỬ VÀO RẠP</span>
                <span>•</span>
                <span className="font-mono text-gray-300">LUMI CINEMA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                #LMC-{String(ticket.id).padStart(6, '0')}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {ticket.status === 'Valid' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  CÒN HIỆU LỰC
                </span>
              )}
              {ticket.status === 'Used' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gray-600/20 text-gray-400 border border-gray-600/40">
                  ✓ ĐÃ SỬ DỤNG
                </span>
              )}
              {ticket.status === 'Cancelled' && (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  ✕ ĐÃ HỦY VÉ
                </span>
              )}
            </div>
          </div>

          {/* Banner lý do hủy vé — chỉ hiện khi Cancelled */}
          {ticket.status === 'Cancelled' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6 shadow-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🚫</span>
                <div className="flex-1">
                  <h3 className="font-bold text-red-400 text-sm mb-1">Vé đã bị hủy</h3>
                  <p className="text-xs text-gray-400 mb-1">Lý do hủy:</p>
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
              <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-6 shadow-xl text-center flex flex-col items-center">
                <div className="mb-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                    Mã QR Check-in Vào Rạp
                  </span>
                </div>

                {/* Khung chứa QR Code trắng viền chuẩn */}
                <div className="bg-white p-4 rounded-2xl shadow-2xl flex items-center justify-center mb-3">
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1 mb-4">
                  <p className="font-mono text-sm font-bold text-white tracking-widest">
                    LMC-{ticket.id}-{ticket.seat?.code || 'X'}
                  </p>
                  <p className="text-[11px] text-gray-400 max-w-[220px]">
                    Xuất trình mã này cho nhân viên soát vé tại cửa phòng chiếu để quét mã
                  </p>
                </div>

                {/* Bảo mật chữ ký HMAC */}
                <div className="w-full bg-[#12131A] border border-[#252836] rounded-xl p-3 text-left space-y-1 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
                    <span>🔒</span>
                    <span>Xác thực số chống giả mạo</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Mã QR đã được ký điện tử HMAC-SHA256, chỉ có hiệu lực tại hệ thống rạp Lumi Cinema.
                  </p>
                </div>
              </div>

              {/* Các nút thao tác nhanh: In vé / Hủy vé */}
              <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-4 shadow-xl space-y-3">
                <Button
                  variant="secondary"
                  fullWidth
                  size="md"
                  onClick={() => window.print()}
                  className="text-xs"
                >
                  🖨️ In Vé / Lưu Ảnh
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
                        className="text-xs bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/40 hover:bg-[#E63946] hover:text-white transition"
                      >
                        Hủy Vé & Nhận Voucher 50%
                      </Button>
                    ) : (
                      <div className="text-center p-2.5 bg-[#12131A] rounded-xl border border-[#252836]">
                        <span className="text-[11px] text-gray-400 block mb-0.5">
                          ⚠️ Không thể hủy vé
                        </span>
                        <span className="text-[10px] text-red-400 leading-tight block">
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
              <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-5 shadow-xl flex gap-4">
                <div className="relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-[#2B2E3D]">
                  <img
                    src={posterUrl}
                    alt={ticket.movie?.title || 'Phim'}
                    className="w-full h-full object-cover"
                  />
                  {ticket.movie?.ageRating && (
                    <div className="absolute top-1 left-1 bg-red-600/90 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                      {ticket.movie.ageRating}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <h2 className="text-lg font-black text-white leading-snug">
                    {ticket.movie?.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    {ticket.movie?.genre && <span>🎭 {ticket.movie.genre}</span>}
                    {ticket.movie?.duration && <span>⏱️ {ticket.movie.duration} phút</span>}
                  </div>
                  <div className="pt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-[#252836] text-gray-300">
                      Định dạng 2D Phụ Đề
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Suất Chiếu & Phòng Chiếu */}
              <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400">
                  Thông Tin Suất Chiếu
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#12131A] p-3 rounded-xl border border-[#252836]">
                    <span className="text-xs text-gray-500 block mb-1">Ngày chiếu:</span>
                    <span className="font-semibold text-white">{formatDate(startTime)}</span>
                  </div>
                  <div className="bg-[#12131A] p-3 rounded-xl border border-[#252836]">
                    <span className="text-xs text-gray-500 block mb-1">Thời gian:</span>
                    <span className="font-bold text-[#FFB703]">
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </span>
                  </div>
                  <div className="bg-[#12131A] p-3 rounded-xl border border-[#252836]">
                    <span className="text-xs text-gray-500 block mb-1">Phòng chiếu:</span>
                    <span className="font-bold text-white">
                      Phòng {ticket.screening?.room || '1'}
                    </span>
                  </div>
                  <div className="bg-[#12131A] p-3 rounded-xl border border-[#252836]">
                    <span className="text-xs text-gray-500 block mb-1">Cụm rạp:</span>
                    <span className="font-semibold text-white">Lumi Cinema Landmark</span>
                  </div>
                </div>
              </div>

              {/* Card Vị Trí Ghế & Loại Vé */}
              <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400">
                  Vị Trí Ghế Ngồi
                </h3>
                <div className="flex items-center justify-between p-3.5 bg-[#12131A] rounded-xl border border-[#252836]">
                  <div className="flex items-center gap-3">
                    <Badge variant="gold" size="md">
                      Ghế {ticket.seat?.code || '---'}
                    </Badge>
                    <div className="text-xs text-gray-400">
                      <span>Hàng {ticket.seat?.row || '---'}</span> •{' '}
                      <span>Số {ticket.seat?.number || '---'}</span>
                      {ticket.seat?.type && (
                        <span className="ml-1 text-gray-300">({ticket.seat.type})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Giá vé:</span>
                    <span className="font-bold text-[#FFB703] text-base">
                      {Number(ticket.price || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Khách Hàng & Thanh Toán */}
              <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400">
                  Thông Tin Thanh Toán
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#252836]">
                    <span className="text-gray-400">Họ và tên khách:</span>
                    <span className="text-white font-medium">{ticket.user?.name || 'Khách hàng'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#252836]">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-mono">{ticket.user?.email || '---'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#252836]">
                    <span className="text-gray-400">Mã giao dịch:</span>
                    <span className="text-white font-mono">
                      #{ticket.payment?.transactionCode || ticket.payment?.id || '---'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#252836]">
                    <span className="text-gray-400">Cổng thanh toán:</span>
                    <span className="text-white font-medium">
                      {ticket.payment?.paymentMethod || 'VNPay Sandbox'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-400">Thời gian mua:</span>
                    <span className="text-gray-300">
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
        <div className="space-y-4">
          <div className="bg-[#1C1E27] border border-[#2B2E3D] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-[#2B2E3D]">
              <span className="text-gray-400">Mã vé:</span>
              <span className="font-mono font-bold text-white">#LMC-{String(ticket.id).padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Phim:</span>
              <span className="font-bold text-white truncate max-w-[220px]">{ticket.movie?.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Suất chiếu:</span>
              <span className="text-[#FFB703] font-semibold">
                {formatTime(startTime)} - {formatDate(startTime)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Ghế hủy:</span>
              <span className="text-white font-bold">Phòng {ticket.screening?.room} • Ghế {ticket.seat?.code}</span>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs space-y-2">
            <p className="font-bold text-red-400 flex items-center gap-1.5 text-sm">
              <span>⚠️</span> Quy định hủy vé & Bồi thường (BR-03)
            </p>
            <ul className="text-gray-300 space-y-1.5 list-disc pl-4">
              <li>
                Thao tác hủy vé <strong>chỉ hợp lệ</strong> trước giờ chiếu ít nhất <strong>2 tiếng</strong>.
              </li>
              <li>
                Ghế <strong>{ticket.seat?.code}</strong> sẽ được giải phóng ngay lập tức cho khách hàng khác.
              </li>
              <li>
                Bạn sẽ nhận được ngay <strong>Voucher giảm 50%</strong> (hạn dùng 30 ngày) áp dụng cho mọi phim.
              </li>
              <li>
                Vé sau khi hủy sẽ <strong>không thể hoàn tác</strong>.
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              disabled={isCancelling}
              onClick={() => setIsCancelModalOpen(false)}
            >
              Giữ vé lại
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={isCancelling}
              onClick={handleCancelTicket}
              className="bg-red-600 hover:bg-red-700"
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
      </Modal>
    </>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111217] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải thông tin vé...</span>
          </div>
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
