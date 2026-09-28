'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ToastMessage } from '@/components/ui/Toast';
import { StaffTicketSearchResult } from '@/app/api/staff/tickets/search/route';
import { StaffCancelTicketResult } from '@/app/api/staff/tickets/[id]/cancel-with-voucher/route';

const INCIDENT_REASONS = [
  'Sự cố phòng chiếu / Lỗi máy chiếu hình ảnh',
  'Mất điện đột xuất tại cụm rạp',
  'Lỗi hệ thống âm thanh / Ánh sáng phòng chiếu',
  'Hủy suất chiếu khẩn cấp từ ban quản lý',
  'Khách hàng gặp sự cố / Đền bù đặc quyền tại quầy',
  'Khác (nhập chi tiết)',
];

function TicketLookupContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'Valid' | 'Used' | 'Cancelled'>('ALL');
  const [tickets, setTickets] = useState<StaffTicketSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [_hasSearched, setHasSearched] = useState(false);

  // Modal hủy vé
  const [selectedTicketForCancel, setSelectedTicketForCancel] = useState<StaffTicketSearchResult | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(INCIDENT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [issueVoucher, setIssueVoucher] = useState(true);
  const [staffNotes, setStaffNotes] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Modal kết quả bồi hoàn
  const [cancelSuccessResult, setCancelSuccessResult] = useState<StaffCancelTicketResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  // Modal QR Code
  const [qrModalTicket, setQrModalTicket] = useState<StaffTicketSearchResult | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Hàm gọi API tìm kiếm vé
  const handleSearchTickets = useCallback(async (searchQuery = query, status = activeStatusFilter) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      if (status !== 'ALL') {
        params.set('status', status);
      }

      const res = await fetch(`/api/staff/tickets/search?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setTickets(json.data);
      } else {
        setTickets([]);
        addToast('error', json.message || 'Không tìm thấy vé');
      }
    } catch (err) {
      console.error('Lỗi khi tìm kiếm vé:', err);
      addToast('error', 'Lỗi kết nối máy chủ khi tra cứu vé');
    } finally {
      setLoading(false);
    }
  }, [query, activeStatusFilter]);

  // Tự động tìm kiếm nếu có query ban đầu từ URL hoặc tải danh sách vé mới nhất
  useEffect(() => {
    handleSearchTickets(initialQuery, activeStatusFilter);
  }, [initialQuery, handleSearchTickets, activeStatusFilter]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchTickets(query, activeStatusFilter);
  };

  // Mở modal xác nhận hủy vé
  const openCancelModal = (ticket: StaffTicketSearchResult) => {
    setSelectedTicketForCancel(ticket);
    setSelectedReason(INCIDENT_REASONS[0]);
    setCustomReason('');
    setIssueVoucher(true);
    setStaffNotes('');
    setCancelModalOpen(true);
  };

  // Thực hiện gọi API ép hủy vé
  const handleConfirmCancel = async () => {
    if (!selectedTicketForCancel) return;

    setCancelling(true);
    const finalReason = selectedReason.startsWith('Khác') && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    try {
      const res = await fetch(`/api/staff/tickets/${selectedTicketForCancel.id}/cancel-with-voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: finalReason,
          issue_voucher: issueVoucher,
          notes: staffNotes,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        addToast(
          'success',
          `Hủy vé #${selectedTicketForCancel.id} thành công! Ghế ${json.data.released_seat || ''} đã được giải phóng.`
        );
        setCancelModalOpen(false);
        setCancelSuccessResult(json.data);
        setResultModalOpen(true);

        // Cập nhật lại danh sách vé ngay lập tức
        await handleSearchTickets(query, activeStatusFilter);
      } else {
        addToast('error', json.message || json.error || 'Hủy vé không thành công');
      }
    } catch (err) {
      console.error('Lỗi khi hủy vé:', err);
      addToast('error', 'Không thể kết nối đến máy chủ để thực hiện hủy vé');
    } finally {
      setCancelling(false);
    }
  };

  // Thực hiện check-in soát vé
  const handleCheckIn = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/mark-used`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('success', `Đã soát vé #${ticketId} thành công! Khách hàng có thể vào phòng chiếu.`);
        await handleSearchTickets(query, activeStatusFilter);
      } else {
        addToast('error', json.message || 'Soát vé không thành công');
      }
    } catch (err) {
      console.error('Lỗi soát vé:', err);
      addToast('error', 'Lỗi máy chủ khi soát vé');
    }
  };

  return (
    <div className="flex-1 bg-[#141414] p-6 lg:p-8 min-h-screen">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border border-[#404040] shadow-2xl min-w-[300px] max-w-[420px] transition-all duration-200 ${
              toast.type === 'success'
                ? 'bg-[#183323] border-[#2ECC71]/40 text-white'
                : toast.type === 'error'
                ? 'bg-[#3b1c1f] border-[#E63946]/40 text-white'
                : 'bg-[#1c2a38] border-[#0088FF]/40 text-white'
            }`}
          >
            <span className="text-lg">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
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
                href="/staff"
                className="text-[#A3A3A3] hover:text-white transition-colors text-sm font-medium"
              >
                ← Dashboard
              </Link>
              <span className="text-[#404040]">/</span>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Tra Cứu & Xử Lý Sự Cố Vé (UC-15)
              </h1>
            </div>
            <p className="text-[#A3A3A3] text-sm mt-1">
              Tìm kiếm vé qua SĐT, Email, Mã vé. Hỗ trợ soát vé và hủy/hoàn vé đền bù 100% cho khách hàng tại quầy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSearchTickets(query, activeStatusFilter)}
              disabled={loading}
            >
              🔄 {loading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </div>

        {/* Search Box Card */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 lg:p-6 shadow-xl">
          <form onSubmit={handleSubmitSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] text-base">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại, email, mã vé (#LMC-...), mã ghế (A1) hoặc tên khách..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#141414] border border-[#404040] focus:border-[#E63946] rounded-xl pl-10 pr-10 py-3 text-white text-sm outline-none transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      handleSearchTickets('', activeStatusFilter);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" size="md" disabled={loading}>
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </Button>
            </div>

            {/* Filter Status Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2D2D2D]">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-[#737373] mr-2">Lọc trạng thái:</span>
                {(
                  [
                    { key: 'ALL', label: 'Tất cả vé' },
                    { key: 'Valid', label: 'Hợp lệ' },
                    { key: 'Used', label: 'Đã sử dụng' },
                    { key: 'Cancelled', label: 'Đã hủy' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveStatusFilter(tab.key);
                      handleSearchTickets(query, tab.key);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeStatusFilter === tab.key
                        ? 'bg-[#E63946] text-white shadow-md'
                        : 'bg-[#2A2A2A] text-[#A3A3A3] hover:text-white hover:bg-[#333333]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sample Search Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[#737373]">Mẫu thử:</span>
                {['0901234567', 'khachhang@lumi.vn', '#LMC-000003', 'A1'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setQuery(sample);
                      handleSearchTickets(sample, activeStatusFilter);
                    }}
                    className="bg-[#0088FF]/10 text-[#0088FF] hover:bg-[#0088FF]/20 px-2 py-0.5 rounded text-[11px] font-mono transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Results List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span> Danh Sách Vé Tìm Thấy ({tickets.length})
            </h2>
            {query && (
              <span className="text-xs text-[#A3A3A3]">
                Kết quả tìm kiếm cho: <span className="text-[#0088FF] font-medium">{query}</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl py-20 text-center text-[#737373]">
              <div className="inline-block animate-spin text-3xl mb-3">⏳</div>
              <p className="text-sm font-medium">Đang tìm kiếm thông tin vé và ghế...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl py-20 text-center text-[#737373]">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-white font-bold text-base">Không tìm thấy vé nào phù hợp</p>
              <p className="text-xs mt-1">
                Thử kiểm tra lại số điện thoại, địa chỉ email hoặc mã vé được cung cấp.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('');
                  setActiveStatusFilter('ALL');
                  handleSearchTickets('', 'ALL');
                }}
              >
                Xóa bộ lọc & Tải lại danh sách
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const statusVariant =
                  ticket.status === 'Valid'
                    ? 'green'
                    : ticket.status === 'Used'
                    ? 'blue'
                    : 'red';

                const statusLabel =
                  ticket.status === 'Valid'
                    ? 'Hợp lệ'
                    : ticket.status === 'Used'
                    ? 'Đã sử dụng'
                    : 'Đã hủy';

                const seatStatusVariant =
                  ticket.seat?.seat_status === 'OCCUPIED'
                    ? 'red'
                    : ticket.seat?.seat_status === 'RESERVED'
                    ? 'gold'
                    : 'green';

                const seatStatusLabel =
                  ticket.seat?.seat_status === 'OCCUPIED'
                    ? 'Đang có người ngồi'
                    : ticket.seat?.seat_status === 'RESERVED'
                    ? 'Đang giữ chỗ'
                    : 'Ghế trống';

                const isCancelled = ticket.status === 'Cancelled';

                return (
                  <div
                    key={ticket.id}
                    className={`bg-[#1E1E1E] border rounded-2xl p-5 lg:p-6 transition-all duration-200 shadow-md ${
                      isCancelled
                        ? 'border-[#333333] opacity-75'
                        : 'border-[#383838] hover:border-[#4D4D4D]'
                    }`}
                  >
                    {/* Top Row: Ticket Code, Date & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D2D2D] pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-lg text-white tracking-wider">
                          {ticket.ticket_code || `#LMC-${String(ticket.id).padStart(6, '0')}`}
                        </span>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                        <span className="text-xs text-[#737373] hidden sm:inline">•</span>
                        <span className="text-xs text-[#A3A3A3] hidden sm:inline">
                          Đặt lúc:{' '}
                          {new Date(ticket.purchase_date).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#A3A3A3]">Giá vé:</span>
                        <span className="text-base font-black text-[#FFB703]">
                          {ticket.price?.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {/* Main Content Grid: Movie, Customer, Seat & Room Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Cột 1: Thông tin phim & Suất chiếu */}
                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                          🎬 Phim & Suất chiếu
                        </div>
                        <div className="flex gap-3">
                          {ticket.movie?.poster && (
                            <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#2A2A2A] border border-[#404040]">
                              <Image
                                src={ticket.movie.poster}
                                alt={ticket.movie.title || 'Movie'}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-sm line-clamp-2">
                              {ticket.movie?.title || 'Phim rạp'}
                            </h3>
                            <p className="text-xs text-[#A3A3A3] mt-1">
                              ⏱️ {ticket.movie?.duration} phút • {ticket.movie?.genre}
                            </p>
                            <p className="text-xs text-[#0088FF] font-medium mt-1">
                              🏛️ {ticket.screening?.room}
                            </p>
                            <p className="text-xs text-[#A3A3A3]">
                              ⏰{' '}
                              {ticket.screening?.start_time
                                ? new Date(ticket.screening.start_time).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}{' '}
                              -{' '}
                              {ticket.screening?.end_time
                                ? new Date(ticket.screening.end_time).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}{' '}
                              ({ticket.screening?.date ? new Date(ticket.screening.date).toLocaleDateString('vi-VN') : ''})
                            </p>
                          </div>
                        </div>

                        {/* Tổng quan phòng chiếu */}
                        {ticket.screening && (
                          <div className="bg-[#171717] rounded-xl p-2.5 text-xs text-[#A3A3A3] border border-[#2D2D2D]">
                            <div className="flex justify-between items-center">
                              <span>Phòng chiếu:</span>
                              <span className="text-white font-medium">
                                {ticket.screening.total_seats} ghế
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span>Tình trạng phòng:</span>
                              <span className="text-[#2ECC71] font-medium">
                                {ticket.screening.empty_seats} ghế trống
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cột 2: Thông tin Khách hàng & Ghế ngồi */}
                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                          👤 Khách hàng & Ghế ngồi
                        </div>
                        <div className="bg-[#171717] rounded-xl p-3 border border-[#2D2D2D] space-y-2 text-xs">
                          <div>
                            <span className="text-[#737373]">Họ tên: </span>
                            <span className="text-white font-semibold text-sm">
                              {ticket.customer?.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#737373]">Điện thoại: </span>
                            <span className="text-[#0088FF] font-medium">
                              {ticket.customer?.phone || 'Chưa cung cấp'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#737373]">Email: </span>
                            <span className="text-[#A3A3A3] break-all">
                              {ticket.customer?.email}
                            </span>
                          </div>
                        </div>

                        {/* Chi tiết Ghế & Trạng thái ghế trực tiếp của hệ thống */}
                        <div className="bg-[#171717] rounded-xl p-3 border border-[#2D2D2D] space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[#737373]">Vị trí ghế:</span>
                            <span className="font-mono font-black text-white text-base bg-[#333333] px-2.5 py-0.5 rounded border border-[#404040]">
                              {ticket.seat?.code} ({ticket.seat?.type})
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
                            <span className="text-[#737373]">Tình trạng ghế hiện tại:</span>
                            <Badge variant={seatStatusVariant}>{seatStatusLabel}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Cột 3: Thanh toán, Bắp nước & Hành động */}
                      <div className="space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-3">
                            💳 Thanh toán & Bắp nước
                          </div>
                          <div className="bg-[#171717] rounded-xl p-3 border border-[#2D2D2D] space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#737373]">Phương thức:</span>
                              <span className="text-white font-medium">
                                {ticket.payment?.payment_method || 'VNPay'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#737373]">Mã giao dịch:</span>
                              <span className="text-[#A3A3A3] font-mono truncate max-w-[140px]">
                                {ticket.payment?.transaction_code || 'N/A'}
                              </span>
                            </div>
                            {ticket.payment?.combos && ticket.payment.combos.length > 0 && (
                              <div className="pt-2 border-t border-[#262626]">
                                <span className="text-[#737373] block mb-1">Bắp nước kèm theo:</span>
                                {ticket.payment.combos.map((c) => (
                                  <div key={c.id} className="text-white text-xs flex justify-between">
                                    <span>🍿 {c.name} x{c.quantity}</span>
                                    <span className="text-[#FFB703]">{(c.price * c.quantity).toLocaleString('vi-VN')} đ</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setQrModalTicket(ticket)}
                          >
                            🔍 Xem QR
                          </Button>

                          {ticket.status === 'Valid' && (
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => handleCheckIn(ticket.id)}
                            >
                              🎟️ Soát vé (Check-in)
                            </Button>
                          )}

                          {!isCancelled ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openCancelModal(ticket)}
                            >
                              ⚠️ Hủy & Hoàn tiền (UC-15)
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              ❌ Đã hủy vé
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Hủy & Hoàn vé đặc quyền (UC-15) */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => !cancelling && setCancelModalOpen(false)}
        title="Xử Lý Sự Cố: Hủy & Hoàn Tiền Vé (UC-15)"
        maxWidth="max-w-xl"
      >
        {selectedTicketForCancel && (
          <div className="space-y-4">
            {/* Banner chính sách đền bù */}
            <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-[#E63946] font-bold text-sm">
                <span>⚠️</span> QUY TRÌNH ÉP HỦY VÉ & ĐỀN BÙ 100% CỦA NHÂN VIÊN
              </div>
              <p className="text-[#D4D4D4] text-xs mt-1 leading-relaxed">
                Khác với khách tự hủy (chỉ trước 2 giờ và chỉ hoàn 50%), nhân viên có thẩm quyền ép hủy vé và hệ thống sẽ tự động hoàn trả 100% giá vé, giải phóng ghế về trạng thái TRỐNG và cấp Voucher bồi hoàn.
              </p>
            </div>

            {/* Tóm tắt thông tin vé */}
            <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#333333] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A3A3A3]">Mã vé:</span>
                <span className="text-white font-mono font-bold">
                  {selectedTicketForCancel.ticket_code || `#LMC-${selectedTicketForCancel.id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A3A3]">Khách hàng:</span>
                <span className="text-white font-medium">
                  {selectedTicketForCancel.customer?.name} ({selectedTicketForCancel.customer?.phone || selectedTicketForCancel.customer?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A3A3]">Phim & Ghế:</span>
                <span className="text-white font-medium">
                  {selectedTicketForCancel.movie?.title} • Ghế {selectedTicketForCancel.seat?.code}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2A2A2A]">
                <span className="text-[#A3A3A3]">Mức tiền bồi hoàn:</span>
                <span className="text-[#FFB703] font-black text-sm">
                  100% ({selectedTicketForCancel.price?.toLocaleString('vi-VN')} đ)
                </span>
              </div>
            </div>

            {/* Lý do hủy vé */}
            <div>
              <label className="block text-[#D4D4D4] text-xs font-semibold uppercase mb-1.5">
                Lý do xử lý sự cố <span className="text-[#E63946]">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-[#141414] border border-[#404040] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#E63946]"
              >
                {INCIDENT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {selectedReason.startsWith('Khác') && (
                <input
                  type="text"
                  placeholder="Nhập chi tiết sự cố phát sinh tại rạp..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-2 w-full bg-[#141414] border border-[#404040] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#E63946]"
                />
              )}
            </div>

            {/* Tùy chọn cấp Voucher */}
            <div className="flex items-start gap-3 p-3 bg-[#1A1A1A] rounded-xl border border-[#333333]">
              <input
                type="checkbox"
                id="issueVoucherCheck"
                checked={issueVoucher}
                onChange={(e) => setIssueVoucher(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#E63946] cursor-pointer"
              />
              <label htmlFor="issueVoucherCheck" className="text-xs text-[#D4D4D4] cursor-pointer">
                <span className="font-bold text-white block">
                  Cấp mã Voucher đền bù 100% cho khách hàng
                </span>
                Mã voucher có hạn sử dụng 30 ngày, áp dụng cho lần xem phim tiếp theo của khách hàng này.
              </label>
            </div>

            {/* Ghi chú nhân viên */}
            <div>
              <label className="block text-[#D4D4D4] text-xs font-semibold uppercase mb-1.5">
                Ghi chú nội bộ (Tùy chọn)
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Đã hỗ trợ đổi suất chiếu hoặc đã xin lỗi khách hàng trực tiếp..."
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full bg-[#141414] border border-[#404040] rounded-xl p-3 text-white text-sm outline-none focus:border-[#E63946]"
              />
            </div>

            {/* Nút bấm */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Đang thực hiện giao dịch...' : 'Xác nhận Hủy & Hoàn Tiền 100%'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thông Báo Kết Quả Bồi Hoàn Thành Công */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Hủy & Hoàn Vé Thành Công"
      >
        {cancelSuccessResult && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-[#2ECC71]/20 border border-[#2ECC71]/40 rounded-full flex items-center justify-center text-3xl mx-auto">
              🎉
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Giao dịch xử lý sự cố hoàn tất!
              </h3>
              <p className="text-xs text-[#A3A3A3] mt-1">
                Vé #{cancelSuccessResult.ticket_id} đã được chuyển sang trạng thái ĐÃ HỦY. Ghế {cancelSuccessResult.released_seat || ''} đã sẵn sàng để phục vụ khách khác.
              </p>
            </div>

            {cancelSuccessResult.compensation_voucher && (
              <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2ECC71] block">
                  MÃ VOUCHER ĐỀN BÙ 100% ĐÃ KHỞI TẠO
                </span>
                <div className="font-mono font-black text-2xl text-white tracking-widest bg-[#171717] py-2 px-4 rounded-xl border border-[#2ECC71]/40 select-all">
                  {cancelSuccessResult.compensation_voucher.code}
                </div>
                <p className="text-xs text-[#A3A3A3]">
                  {cancelSuccessResult.compensation_voucher.message} • Hạn dùng:{' '}
                  {new Date(cancelSuccessResult.compensation_voucher.expiry_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}

            <div className="bg-[#1A1A1A] rounded-xl p-3 border border-[#333333] text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Tỷ lệ hoàn:</span>
                <span className="text-white font-bold">{cancelSuccessResult.refund_percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Số tiền hoàn:</span>
                <span className="text-[#FFB703] font-bold">
                  {cancelSuccessResult.refund_amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Lý do:</span>
                <span className="text-white">{cancelSuccessResult.reason}</span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => setResultModalOpen(false)}
            >
              Đóng và tiếp tục làm việc
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal Xem QR Code */}
      <Modal
        isOpen={Boolean(qrModalTicket)}
        onClose={() => setQrModalTicket(null)}
        title="Mã Tra Cứu Vé Rạp Phim"
      >
        {qrModalTicket && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-white rounded-xl inline-block shadow-lg">
              {/* Fallback giả lập QR bằng icon và thông tin */}
              <div className="w-48 h-48 bg-slate-900 rounded-lg flex flex-col items-center justify-center p-3 text-white text-center">
                <span className="text-4xl mb-2">📱</span>
                <span className="font-mono font-black text-sm text-[#FFB703]">
                  {qrModalTicket.ticket_code || `#LMC-${qrModalTicket.id}`}
                </span>
                <span className="text-[10px] text-slate-300 mt-1">
                  Ghế {qrModalTicket.seat?.code} • {qrModalTicket.screening?.room}
                </span>
              </div>
            </div>

            <div className="text-left bg-[#1A1A1A] p-3 rounded-xl border border-[#333333] text-xs space-y-1">
              <div><span className="text-[#737373]">Khách hàng:</span> <span className="text-white font-medium">{qrModalTicket.customer?.name}</span></div>
              <div><span className="text-[#737373]">Phim:</span> <span className="text-white">{qrModalTicket.movie?.title}</span></div>
              <div><span className="text-[#737373]">Trạng thái:</span> <span className="text-[#FFB703]">{qrModalTicket.status}</span></div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => setQrModalTicket(null)}
            >
              Đóng
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function TicketLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#737373]">
          <div className="animate-spin text-2xl mb-2">⏳</div>
          Đang tải trang tra cứu vé...
        </div>
      }
    >
      <TicketLookupContent />
    </Suspense>
  );
}
