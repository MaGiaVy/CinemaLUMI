'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { QRCodeSVG } from 'qrcode.react';
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
  const [checkingInId, setCheckingInId] = useState<number | null>(null);

  // Vé được chọn làm tâm điểm hiển thị trên khung quét
  const [focusedTicket, setFocusedTicket] = useState<StaffTicketSearchResult | null>(null);

  // Modal hủy vé
  const [selectedTicketForCancel, setSelectedTicketForCancel] = useState<StaffTicketSearchResult | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(INCIDENT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'VOUCHER'>('CASH');
  const [_issueVoucher, setIssueVoucher] = useState(false);
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
        if (json.data.length > 0) {
          setFocusedTicket(json.data[0]);
        } else {
          setFocusedTicket(null);
        }
      } else {
        setTickets([]);
        setFocusedTicket(null);
        addToast('error', json.message || 'Không tìm thấy vé phù hợp');
      }
    } catch (err) {
      console.error('Lỗi khi tìm kiếm vé:', err);
      addToast('error', 'Lỗi kết nối máy chủ khi tra cứu vé');
    } finally {
      setLoading(false);
    }
  }, [query, activeStatusFilter]);

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
    setRefundMethod('CASH');
    setIssueVoucher(false);
    setStaffNotes('');
    setCancelModalOpen(true);
  };

  // Thực hiện gọi API ép hủy vé (UC-15)
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
          refund_method: refundMethod,
          issue_voucher: refundMethod === 'VOUCHER',
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
    setCheckingInId(ticketId);
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
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 text-[#F8FAFC]">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-[1440px] mx-auto space-y-5">

        {/* 1. Header Bar Soát Vé */}
        <header className="bg-gradient-to-r from-[rgba(20,14,32,0.92)] to-[rgba(35,12,28,0.9)] backdrop-blur-2xl border border-[rgba(192,132,252,0.25)] rounded-2xl p-4 lg:px-6 lg:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(88,28,135,0.2)]">
          <div className="flex items-center gap-3.5">
            <span className="bg-gradient-to-br from-[#E11D48] to-[#881337] text-white font-black text-xs tracking-wider px-3 py-1.5 rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.6)] border border-[rgba(254,205,211,0.35)]">
              ✦ SCANNER
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Link href="/staff" className="text-xs text-[#94A3B8] hover:text-white transition-colors">
                  Dashboard
                </Link>
                <span className="text-[#64748B] text-xs">/</span>
                <h1 className="text-sm lg:text-base font-extrabold text-[#F8FAFC] tracking-wide">
                  TRẠM SOÁT VÉ ĐIỆN TỬ LASER · CỔNG VÀO PHÒNG CHIẾU
                </h1>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Kiểm tra chữ ký số HMAC-SHA256 (BR-09) · Tra cứu mã vé, số điện thoại và xử lý sự cố (UC-15)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSearchTickets(query, activeStatusFilter)}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#F8FAFC] text-xs font-bold border border-[rgba(192,132,252,0.25)] transition-all flex items-center gap-2"
            >
              <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
            <Link
              href="/staff/pos"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:scale-105 transition-all no-underline"
            >
              Mở Quầy POS
            </Link>
          </div>
        </header>

        {/* 2. KHUNG QUÉT LASER & KẾT QUẢ XÁC THỰC (COSMIC COCKPIT SCANNER) */}
        <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-5 lg:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.85)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
              <span className="text-[#E11D48] text-sm font-black">✦</span>
              BUỒNG QUÉT TIA LASER NHẬN DIỆN VÉ THỜI GIAN THỰC
            </span>
            <span className="text-[11px] text-[#FDA4AF]">
              Tia quét Laser Velvet Red chu kỳ 2.5 giây
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Cột Trái: Camera Viewfinder with Laser Sweep */}
            <div className="bg-[radial-gradient(circle_at_50%_20%,rgba(225,29,72,0.25)_0%,transparent_60%),rgba(15,11,25,0.85)] border border-[rgba(192,132,252,0.25)] rounded-2xl p-5 flex flex-col items-center shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
              <div className="font-extrabold text-xs tracking-wider text-[#F8FAFC] uppercase">
                ĐƯA MÃ QR VÉ VÀO KHUNG QUÉT
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-1">
                Camera tự động giải mã chữ ký điện tử trong 0.2 giây
              </div>

              {/* Viewfinder with laser line */}
              <div className="w-60 h-60 sm:w-64 sm:h-64 border-2 border-dashed border-[rgba(192,132,252,0.4)] rounded-2xl relative overflow-hidden bg-black/60 flex items-center justify-center my-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
                {/* Laser Sweep Beam */}
                <div className="laser-line" />
                <div className="text-3xl text-[#E11D48]/30 font-black">✦</div>
                <div className="absolute bottom-3 text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase">
                  RADAR LASER 4K
                </div>
              </div>

              {/* Manual Ticket Code Input */}
              <form onSubmit={handleSubmitSearch} className="w-full flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã vé thủ công (#LMC-...) nếu QR mờ..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-[rgba(8,6,14,0.85)] border border-[rgba(192,132,252,0.3)] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#E11D48] transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-[#581C87] to-[#7E22CE] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:scale-105 transition-all"
                >
                  {loading ? 'Quét...' : 'Tra Cứu'}
                </button>
              </form>
            </div>

            {/* Cột Phải: Thẻ kết quả xác thực hợp lệ */}
            {focusedTicket ? (
              <div
                className={`rounded-2xl p-5 lg:p-6 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)] ${
                  focusedTicket.status === 'Valid'
                    ? 'bg-[radial-gradient(circle_at_10%_10%,rgba(34,197,94,0.18)_0%,transparent_50%),radial-gradient(circle_at_90%_90%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.92)] border-2 border-[rgba(74,222,128,0.5)]'
                    : focusedTicket.status === 'Used'
                    ? 'bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.15)_0%,transparent_50%),rgba(15,11,25,0.92)] border border-[rgba(56,189,248,0.4)]'
                    : 'bg-[radial-gradient(circle_at_10%_10%,rgba(225,29,72,0.15)_0%,transparent_50%),rgba(15,11,25,0.92)] border border-[rgba(225,29,72,0.4)]'
                }`}
              >
                <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.1)] pb-3 mb-3.5">
                  <div>
                    <div className="text-[11px] font-extrabold tracking-wider text-[#86EFAC] uppercase">
                      KẾT QUẢ XÁC THỰC CHỮ KÝ SỐ
                    </div>
                    <div className="text-lg font-black text-white mt-0.5">
                      {focusedTicket.status === 'Valid'
                        ? 'VÉ HỢP LỆ (VALID)'
                        : focusedTicket.status === 'Used'
                        ? 'VÉ ĐÃ SỬ DỤNG (USED)'
                        : 'VÉ ĐÃ HỦY (CANCELLED)'}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full font-black text-xs tracking-wider border ${
                      focusedTicket.status === 'Valid'
                        ? 'bg-[rgba(34,197,94,0.25)] border-[#22C55E] text-[#86EFAC] shadow-[0_0_12px_rgba(34,197,94,0.5)]'
                        : focusedTicket.status === 'Used'
                        ? 'bg-[rgba(56,189,248,0.2)] border-[#38BDF8] text-[#7DD3FC]'
                        : 'bg-[rgba(225,29,72,0.2)] border-[#E11D48] text-[#FDA4AF]'
                    }`}
                  >
                    {focusedTicket.status === 'Valid'
                      ? '● CHO PHÉP VÀO RẠP'
                      : focusedTicket.status === 'Used'
                      ? '● ĐÃ VÀO PHÒNG'
                      : '● KHÔNG HỢP LỆ'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8]">Mã vé:</span>
                    <strong className="text-white font-mono">{focusedTicket.ticket_code || `#LMC-${focusedTicket.id}`}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8]">Phim:</span>
                    <strong className="text-[#F8FAFC]">{focusedTicket.movie?.title || 'Phim rạp'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8]">Phòng chiếu:</span>
                    <strong className="text-[#FDA4AF]">{focusedTicket.screening?.room || 'Phòng chiếu'} (Laser 4K)</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8]">Suất chiếu:</span>
                    <strong className="text-white">
                      {focusedTicket.screening?.start_time
                        ? new Date(focusedTicket.screening.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : ''}{' '}
                      · Hôm nay
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8]">Số ghế:</span>
                    <strong className="text-[#C084FC] text-sm font-black font-mono">
                      {focusedTicket.seat?.code || 'N/A'} ({focusedTicket.seat?.type || 'Standard'})
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#94A3B8]">Khách hàng:</span>
                    <span className="text-[#CBD5E1]">
                      {focusedTicket.customer?.name} ({focusedTicket.customer?.phone || 'Chưa có SĐT'})
                    </span>
                  </div>
                </div>

                {/* Nút hành động xác nhận vào rạp */}
                {focusedTicket.status === 'Valid' ? (
                  <button
                    type="button"
                    disabled={checkingInId === focusedTicket.id}
                    onClick={() => handleCheckIn(focusedTicket.id)}
                    className="w-full bg-gradient-to-r from-[#22C55E] to-[#15803D] border border-[#86EFAC] text-white py-3 rounded-xl font-black text-xs tracking-wider mt-4 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.45)] hover:shadow-[0_0_30px_rgba(34,197,94,0.7)] hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {checkingInId === focusedTicket.id
                      ? 'ĐANG XÁC NHẬN...'
                      : 'XÁC NHẬN CHO KHÁCH VÀO PHÒNG'}
                  </button>
                ) : (
                  <div className="mt-4 p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] text-center text-xs text-[#94A3B8]">
                    Vé không ở trạng thái hợp lệ để soát vé vào rạp.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[rgba(15,11,25,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="text-3xl text-[#C084FC] opacity-40 mb-3">✦</div>
                <h3 className="text-sm font-bold text-white">Chưa Chọn Vé Xác Thực</h3>
                <p className="text-xs text-[#94A3B8] max-w-xs mt-1">
                  Đưa mã QR vé vào khung quét camera hoặc nhập mã vé / số điện thoại vào ô tra cứu để kiểm tra.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 3. BẢNG TRA CỨU & XỬ LÝ SỰ CỐ VÉ (UC-15) */}
        <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-5 lg:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.85)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
                <span className="text-[#E11D48] text-sm font-black">✦</span>
                DANH SÁCH VÉ TÌM THẤY & QUẢN TRỊ SỰ CỐ TẠI QUẦY (UC-15)
              </span>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Tìm kiếm theo số điện thoại, email, mã vé, phòng chiếu. Hỗ trợ bồi hoàn 100% tại quầy.
              </p>
            </div>

            {/* Bộ lọc trạng thái */}
            <div className="flex bg-[rgba(8,6,14,0.7)] p-1 rounded-xl border border-[rgba(192,132,252,0.2)] overflow-x-auto">
              {(
                [
                  { key: 'ALL', label: 'Tất cả' },
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeStatusFilter === tab.key
                      ? 'bg-gradient-to-r from-[#E11D48] to-[#881337] text-white shadow-[0_0_12px_rgba(225,29,72,0.5)]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách vé dạng thẻ kính */}
          {loading ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <div className="hourglass-spin text-2xl mb-2">⏳</div>
              <p className="text-xs">Đang tìm kiếm thông tin vé...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <p className="text-sm font-bold text-white">Không tìm thấy vé nào phù hợp</p>
              <p className="text-xs mt-1">Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const isSelected = focusedTicket?.id === ticket.id;
                const isCancelled = ticket.status === 'Cancelled';

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setFocusedTicket(ticket)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.3)_0%,transparent_60%),rgba(24,15,38,0.95)] border-[#E11D48] shadow-[0_0_20px_rgba(225,29,72,0.35)]'
                        : 'bg-[rgba(18,14,28,0.7)] border-[rgba(192,132,252,0.18)] hover:border-[rgba(192,132,252,0.4)]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Cột 1: Mã vé & Trạng thái */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(192,132,252,0.2)] flex items-center justify-center font-mono font-black text-xs text-[#FDA4AF]">
                          {ticket.seat?.code || 'VE'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-white">
                              {ticket.ticket_code || `#LMC-${ticket.id}`}
                            </span>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                ticket.status === 'Valid'
                                  ? 'bg-[rgba(34,197,94,0.2)] border-[#22C55E] text-[#86EFAC]'
                                  : ticket.status === 'Used'
                                  ? 'bg-[rgba(56,189,248,0.2)] border-[#38BDF8] text-[#7DD3FC]'
                                  : 'bg-[rgba(225,29,72,0.2)] border-[#E11D48] text-[#FDA4AF]'
                              }`}
                            >
                              {ticket.status === 'Valid'
                                ? 'HỢP LỆ'
                                : ticket.status === 'Used'
                                ? 'ĐÃ DÙNG'
                                : 'ĐÃ HỦY'}
                            </span>
                          </div>
                          <div className="text-xs text-[#CBD5E1] mt-0.5">
                            {ticket.movie?.title} · {ticket.screening?.room} · Ghế <strong>{ticket.seat?.code}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Cột 2: Khách hàng */}
                      <div className="text-xs text-[#94A3B8]">
                        <div>Khách: <strong className="text-white">{ticket.customer?.name}</strong></div>
                        <div className="text-[#FDA4AF]">{ticket.customer?.phone || ticket.customer?.email}</div>
                      </div>

                      {/* Cột 3: Giá & Nút Thao Tác */}
                      <div className="flex items-center gap-2.5 self-end md:self-center">
                        <div className="text-right mr-2 hidden sm:block">
                          <div className="text-xs font-black text-[#F8FAFC]">
                            {ticket.price?.toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">
                            {ticket.payment?.payment_method || 'Tiền mặt'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrModalTicket(ticket);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#F8FAFC] text-xs font-bold border border-[rgba(192,132,252,0.25)] transition-all"
                        >
                          Mã QR
                        </button>

                        {ticket.status === 'Valid' && (
                          <button
                            type="button"
                            disabled={checkingInId === ticket.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(ticket.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#15803D] text-white text-xs font-black shadow-[0_0_12px_rgba(34,197,94,0.4)] hover:scale-105 transition-all"
                          >
                            Cho Vào Rạp
                          </button>
                        )}

                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCancelModal(ticket);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[rgba(225,29,72,0.2)] hover:bg-[rgba(225,29,72,0.35)] text-[#FDA4AF] text-xs font-bold border border-[rgba(225,29,72,0.4)] transition-all"
                          >
                            Hủy & Đền Bù
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Modal Hủy & Hoàn vé đặc quyền (UC-15) */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => !cancelling && setCancelModalOpen(false)}
        title="XỬ LÝ SỰ CỐ: HỦY VÉ & ĐỀN BÙ 100% (UC-15)"
        maxWidth="max-w-xl"
      >
        {selectedTicketForCancel && (
          <div className="space-y-4">
            {/* Banner chính sách đền bù */}
            <div className="bg-[rgba(225,29,72,0.15)] border border-[rgba(225,29,72,0.4)] rounded-xl p-3.5">
              <div className="text-[#FDA4AF] font-bold text-xs uppercase tracking-wide">
                QUY TRÌNH ÉP HỦY VÉ & ĐỀN BÙ 100% CỦA NHÂN VIÊN
              </div>
              <p className="text-[#CBD5E1] text-xs mt-1 leading-relaxed">
                Nhân viên có thẩm quyền ép hủy vé sự cố và hệ thống sẽ tự động hoàn trả 100% giá vé, giải phóng ghế về trạng thái TRỐNG và cấp chứng từ hoàn tiền hoặc Voucher bồi hoàn.
              </p>
            </div>

            {/* Tóm tắt thông tin vé */}
            <div className="bg-[rgba(18,14,28,0.8)] rounded-xl p-3.5 border border-[rgba(192,132,252,0.2)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Mã vé:</span>
                <span className="text-white font-mono font-bold">
                  {selectedTicketForCancel.ticket_code || `#LMC-${selectedTicketForCancel.id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Khách hàng:</span>
                <span className="text-white font-medium">
                  {selectedTicketForCancel.customer?.name} ({selectedTicketForCancel.customer?.phone || selectedTicketForCancel.customer?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Phim & Ghế:</span>
                <span className="text-white font-medium">
                  {selectedTicketForCancel.movie?.title} · Ghế {selectedTicketForCancel.seat?.code}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[rgba(255,255,255,0.08)]">
                <span className="text-[#94A3B8]">Mức tiền bồi hoàn:</span>
                <span className="text-[#FDA4AF] font-black text-sm">
                  100% ({selectedTicketForCancel.price?.toLocaleString('vi-VN')} đ)
                </span>
              </div>
            </div>

            {/* Lý do hủy vé */}
            <div>
              <label className="block text-[#CBD5E1] text-xs font-semibold uppercase mb-1.5">
                Lý do xử lý sự cố rạp <span className="text-[#E11D48]">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-[rgba(8,6,14,0.85)] border border-[rgba(192,132,252,0.3)] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E11D48]"
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
                  className="mt-2 w-full bg-[rgba(8,6,14,0.85)] border border-[rgba(192,132,252,0.3)] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#E11D48]"
                />
              )}
            </div>

            {/* Hình thức bồi hoàn */}
            <div className="space-y-2">
              <label className="block text-[#CBD5E1] text-xs font-semibold uppercase">
                Hình thức bồi hoàn (SRS Mục 3.4.1) <span className="text-[#E11D48]">*</span>
              </label>

              <div
                onClick={() => { setRefundMethod('CASH'); setIssueVoucher(false); }}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  refundMethod === 'CASH'
                    ? 'bg-[rgba(225,29,72,0.18)] border-[#E11D48] text-white'
                    : 'bg-[rgba(18,14,28,0.7)] border-[rgba(192,132,252,0.2)] text-[#94A3B8]'
                }`}
              >
                <input
                  type="radio"
                  name="refund_method"
                  checked={refundMethod === 'CASH'}
                  onChange={() => { setRefundMethod('CASH'); setIssueVoucher(false); }}
                  className="mt-0.5 accent-[#E11D48] cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Hoàn 100% Tiền Mặt Tại Quầy (Quy chuẩn SRS sự cố rạp)
                  </span>
                  Lập chứng từ hoàn tiền mặt và đối soát công nợ tại quầy. Không cấp voucher.
                </div>
              </div>

              <div
                onClick={() => { setRefundMethod('VOUCHER'); setIssueVoucher(true); }}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  refundMethod === 'VOUCHER'
                    ? 'bg-[rgba(225,29,72,0.18)] border-[#E11D48] text-white'
                    : 'bg-[rgba(18,14,28,0.7)] border-[rgba(192,132,252,0.2)] text-[#94A3B8]'
                }`}
              >
                <input
                  type="radio"
                  name="refund_method"
                  checked={refundMethod === 'VOUCHER'}
                  onChange={() => { setRefundMethod('VOUCHER'); setIssueVoucher(true); }}
                  className="mt-0.5 accent-[#E11D48] cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Cấp Mã Voucher Đền Bù 100%
                  </span>
                  Mã voucher có hạn sử dụng 30 ngày, áp dụng cho lần xem phim tiếp theo của khách hàng.
                </div>
              </div>
            </div>

            {/* Ghi chú nhân viên */}
            <div>
              <label className="block text-[#CBD5E1] text-xs font-semibold uppercase mb-1.5">
                Ghi chú nội bộ
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Đã giải thích lý do kỹ thuật và xin lỗi khách hàng trực tiếp..."
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full bg-[rgba(8,6,14,0.85)] border border-[rgba(192,132,252,0.3)] rounded-xl p-2.5 text-white text-xs outline-none focus:border-[#E11D48]"
              />
            </div>

            {/* Nút bấm xác nhận */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-[#94A3B8] text-xs font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-xs font-black shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all"
              >
                {cancelling ? 'Đang thực hiện...' : 'Xác Nhận Hủy & Hoàn 100%'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thông Báo Kết Quả Bồi Hoàn Thành Công */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="HỦY & HOÀN VÉ THÀNH CÔNG (UC-15)"
      >
        {cancelSuccessResult && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-[rgba(34,197,94,0.2)] text-[#86EFAC] border border-[#22C55E] rounded-full flex items-center justify-center text-xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              ✓
            </div>

            <div>
              <h3 className="text-sm font-black text-white">
                Giao Dịch Xử Lý Sự Cố Hoàn Tất!
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                Vé #{cancelSuccessResult.ticket_id} đã được chuyển sang trạng thái ĐÃ HỦY. Ghế {cancelSuccessResult.released_seat || ''} đã sẵn sàng đón khách mới.
              </p>
            </div>

            {cancelSuccessResult.cash_receipt && (
              <div className="bg-[rgba(225,29,72,0.15)] border border-[rgba(225,29,72,0.35)] rounded-xl p-3.5 space-y-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FDA4AF] block text-center">
                  BIÊN NHẬN CHI HOÀN TIỀN MẶT 100% (SRS UC-15)
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Số phiếu chi:</span>
                  <span className="font-mono font-bold text-white">{cancelSuccessResult.cash_receipt.receipt_no}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Khách hàng:</span>
                  <span className="font-medium text-white">{cancelSuccessResult.cash_receipt.customer_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Số tiền thực chi:</span>
                  <span className="font-black text-[#FDA4AF] text-sm">
                    {cancelSuccessResult.cash_receipt.refund_amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-[rgba(255,255,255,0.08)]">
                  <span className="text-[#94A3B8]">Đối soát quỹ:</span>
                  <span className="text-[#86EFAC] font-bold">✓ Đã xuất quỹ tiền mặt tại quầy</span>
                </div>
              </div>
            )}

            {cancelSuccessResult.compensation_voucher && (
              <div className="bg-[rgba(88,28,135,0.25)] border border-[rgba(192,132,252,0.4)] rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C084FC] block">
                  MÃ VOUCHER ĐỀN BÙ 100% ĐÃ KHỞI TẠO
                </span>
                <div className="font-mono font-black text-xl text-white tracking-widest bg-[rgba(8,6,14,0.8)] py-2 px-3 rounded-lg border border-[rgba(192,132,252,0.3)] select-all">
                  {cancelSuccessResult.compensation_voucher.code}
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  {cancelSuccessResult.compensation_voucher.message} · Hạn dùng:{' '}
                  {new Date(cancelSuccessResult.compensation_voucher.expiry_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setResultModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-xs font-black shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all"
            >
              Đóng và Tiếp Tục Làm Việc
            </button>
          </div>
        )}
      </Modal>

      {/* Modal Xem QR Code */}
      <Modal
        isOpen={Boolean(qrModalTicket)}
        onClose={() => setQrModalTicket(null)}
        title="MÃ QR VÉ ĐIỆN TỬ"
      >
        {qrModalTicket && (
          <div className="text-center space-y-4 p-2">
            <div className="p-3 bg-white rounded-2xl inline-block shadow-[0_0_30px_rgba(192,132,252,0.4)]">
              <QRCodeSVG
                value={qrModalTicket.ticket_code || `#LMC-${qrModalTicket.id}`}
                size={180}
              />
            </div>

            <div className="text-left bg-[rgba(18,14,28,0.8)] p-3 rounded-xl border border-[rgba(192,132,252,0.2)] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Mã vé:</span>
                <span className="font-mono font-bold text-white">{qrModalTicket.ticket_code || `#LMC-${qrModalTicket.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Khách hàng:</span>
                <span className="text-white font-medium">{qrModalTicket.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Phim:</span>
                <span className="text-white">{qrModalTicket.movie?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Ghế & Phòng:</span>
                <span className="text-[#FDA4AF] font-bold">{qrModalTicket.seat?.code} · {qrModalTicket.screening?.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Trạng thái:</span>
                <span className="text-[#C084FC] font-bold">{qrModalTicket.status}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setQrModalTicket(null)}
              className="w-full py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-white text-xs font-bold transition-all"
            >
              Đóng
            </button>
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
        <div className="p-8 text-center text-[#94A3B8]">
          <div className="hourglass-spin text-2xl mb-2">⏳</div>
          Đang tải trạm soát vé vũ trụ...
        </div>
      }
    >
      <TicketLookupContent />
    </Suspense>
  );
}
