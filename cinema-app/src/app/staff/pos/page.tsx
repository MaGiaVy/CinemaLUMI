'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';

interface Movie {
  id: number;
  title: string;
  poster: string;
  duration: number;
  ageRating?: string;
  ticketPrice?: number;
}

interface Screening {
  id: number;
  movieId: number;
  room: string;
  roomNumber?: number;
  startTime: string;
  price: number;
}

interface SeatItem {
  id: number;
  code: string;
  row: string;
  number: number;
  status: 'EMPTY' | 'RESERVED' | 'OCCUPIED';
}

interface ComboItem {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

export default function StaffPosPage() {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'COMBOS'>('TICKETS');

  // Dữ liệu danh mục
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Chọn phim & Suất
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [seatTicketTypes, setSeatTicketTypes] = useState<Record<number, 'Thường' | 'Trẻ em'>>({});

  // Chọn combo đính kèm (trong tab vé) hoặc giỏ combo (trong tab combo độc lập)
  const [selectedCombos, setSelectedCombos] = useState<Record<number, number>>({});

  // Khách hàng
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Voucher / Khuyến mãi
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [voucherSeatId, setVoucherSeatId] = useState<number | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Trạng thái xử lý
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);

  // 1. Tải danh sách phim và combo khi vào trang
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [movieRes, comboRes] = await Promise.all([
          fetch('/api/movies?status=SHOWING'),
          fetch('/api/combos'),
        ]);
        const movieJson = await movieRes.json();
        const comboJson = await comboRes.json();

        if (movieJson.success && Array.isArray(movieJson.data)) {
          setMovies(movieJson.data);
        }
        if (comboJson.success && Array.isArray(comboJson.data)) {
          setCombos(comboJson.data);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu POS:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Tải suất chiếu khi chọn phim
  useEffect(() => {
    if (!selectedMovie) {
      setScreenings([]);
      setSelectedScreening(null);
      return;
    }

    async function loadScreenings() {
      try {
        const res = await fetch(`/api/screenings?movie_id=${selectedMovie!.id}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Lọc suất chiếu chưa kết thúc
          const now = new Date();
          const upcoming = json.data.filter((s: any) => new Date(s.start_time || s.startTime) > now);
          setScreenings(upcoming.length > 0 ? upcoming : json.data);
        }
      } catch (err) {
        console.error('Lỗi tải suất chiếu:', err);
      }
    }
    loadScreenings();
  }, [selectedMovie]);

  // 3. Tải sơ đồ ghế khi chọn suất chiếu
  useEffect(() => {
    if (!selectedScreening) {
      setSeats([]);
      setSelectedSeatIds([]);
      setSeatTicketTypes({});
      return;
    }

    async function loadSeats() {
      try {
        const res = await fetch(`/api/screenings/${selectedScreening!.id}`);
        const json = await res.json();
        if (json.success && json.data?.seats) {
          setSeats(json.data.seats);
        }
      } catch (err) {
        console.error('Lỗi tải ghế:', err);
      }
    }
    loadSeats();
  }, [selectedScreening]);

  // Xử lý chọn / bỏ chọn ghế
  const toggleSeat = (seatId: number) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'OCCUPIED') return;

    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seatId));
      const nextTypes = { ...seatTicketTypes };
      delete nextTypes[seatId];
      setSeatTicketTypes(nextTypes);
    } else {
      setSelectedSeatIds(prev => [...prev, seatId]);
      setSeatTicketTypes(prev => ({ ...prev, [seatId]: 'Thường' }));
    }
  };

  // Đổi loại vé cho ghế
  const changeTicketType = (seatId: number, type: 'Thường' | 'Trẻ em') => {
    setSeatTicketTypes(prev => ({ ...prev, [seatId]: type }));
  };

  // Cập nhật số lượng combo
  const updateComboQuantity = (comboId: number, delta: number) => {
    setSelectedCombos(prev => {
      const current = prev[comboId] || 0;
      const next = Math.max(0, current + delta);
      const combo = combos.find(c => c.id === comboId);
      if (combo && next > combo.stock) return prev; // không vượt quá tồn kho
      if (next === 0) {
        const copy = { ...prev };
        delete copy[comboId];
        return copy;
      }
      return { ...prev, [comboId]: next };
    });
  };

  // Tính toán tổng tiền vé tab 1
  const isAdultOnly = selectedMovie?.ageRating?.toUpperCase().includes('18');
  const basePrice = selectedScreening ? Number(selectedScreening.price) : 0;
  const ticketSubtotal = selectedSeatIds.reduce((sum, seatId) => {
    const type = seatTicketTypes[seatId] || 'Thường';
    return sum + (type === 'Trẻ em' ? basePrice * 0.5 : basePrice);
  }, 0);

  const comboSubtotal = Object.entries(selectedCombos).reduce((sum, [cId, qty]) => {
    const combo = combos.find(c => c.id === Number(cId));
    return sum + (combo ? Number(combo.price) * qty : 0);
  }, 0);

  const flatTicketPrices = selectedSeatIds.map(seatId => {
    const type = seatTicketTypes[seatId] || 'Thường';
    return type === 'Trẻ em' ? basePrice * 0.5 : basePrice;
  });
  const selectedVoucherIndex = selectedSeatIds.indexOf(voucherSeatId ?? selectedSeatIds[0]);
  const selectedVoucherPrice = flatTicketPrices[selectedVoucherIndex >= 0 ? selectedVoucherIndex : 0] ?? basePrice;

  const discountAmount = appliedCoupon
    ? appliedCoupon.is_compensation
      ? Math.min(Math.round(selectedVoucherPrice * 0.5), appliedCoupon.max_discount ?? Infinity)
      : appliedCoupon.discount_amount
    : 0;

  const totalTicketPosAmount = Math.max(0, ticketSubtotal - discountAmount + comboSubtotal);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCodeInput.trim().toUpperCase(),
          total_amount: ticketSubtotal + comboSubtotal,
          ticket_amount: ticketSubtotal,
          selected_ticket_price: selectedVoucherPrice,
          movie_id: selectedMovie?.id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAppliedCoupon(json.data);
        setVoucherSeatId(selectedSeatIds[0] ?? null);
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(json.message || 'Mã giảm giá không hợp lệ');
      }
    } catch {
      setCouponError('Lỗi kết nối khi kiểm tra mã giảm giá');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Thanh toán vé tại quầy
  const handleCheckoutTicketPos = async () => {
    if (!selectedScreening || selectedSeatIds.length === 0) {
      setErrorMsg('Vui lòng chọn suất chiếu và ít nhất một ghế ngồi');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const ticketItems = selectedSeatIds.map(seatId => ({
        type: seatTicketTypes[seatId] || 'Thường',
        quantity: 1,
      }));

      // Gom nhóm ticket items
      const ticketItemCounts: Record<string, number> = {};
      for (const item of ticketItems) {
        ticketItemCounts[item.type] = (ticketItemCounts[item.type] || 0) + 1;
      }
      const aggregatedTicketItems = Object.entries(ticketItemCounts).map(([type, quantity]) => ({
        type,
        quantity,
      }));

      const comboItems = Object.entries(selectedCombos).map(([cId, quantity]) => ({
        combo_id: Number(cId),
        quantity,
      }));

      const res = await fetch('/api/staff/pos/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screening_id: selectedScreening.id,
          seat_ids: selectedSeatIds,
          ticket_items: aggregatedTicketItems,
          combo_items: comboItems,
          customer_name: customerName,
          customer_phone: customerPhone,
          payment_method: 'Cash',
          coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
          voucher_seat_id: appliedCoupon?.is_compensation ? (voucherSeatId ?? selectedSeatIds[0]) : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCompletedReceipt(json.data);
        setReceiptModalOpen(true);
        // Reset form
        setSelectedSeatIds([]);
        setSelectedCombos({});
        setCustomerName('');
        setCustomerPhone('');
        setAppliedCoupon(null);
        setCouponCodeInput('');
        setVoucherSeatId(null);
        setCouponError(null);
        // Tải lại sơ đồ ghế
        if (selectedScreening) {
          const seatRes = await fetch(`/api/screenings/${selectedScreening.id}`);
          const seatJson = await seatRes.json();
          if (seatJson.success && seatJson.data?.seats) {
            setSeats(seatJson.data.seats);
          }
        }
      } else {
        setErrorMsg(json.message || json.error || 'Bán vé thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối khi thanh toán vé');
    } finally {
      setSubmitting(false);
    }
  };

  // Thanh toán combo độc lập tại quầy
  const handleCheckoutComboOnly = async () => {
    const items = Object.entries(selectedCombos).map(([cId, quantity]) => ({
      combo_id: Number(cId),
      quantity,
    }));

    if (items.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một combo bắp nước');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/staff/pos/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer_name: customerName,
          customer_phone: customerPhone,
          payment_method: 'Cash',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCompletedReceipt(json.data);
        setReceiptModalOpen(true);
        setSelectedCombos({});
        setCustomerName('');
        setCustomerPhone('');
        // Tải lại tồn kho
        const comboRes = await fetch('/api/combos');
        const comboJson = await comboRes.json();
        if (comboJson.success && Array.isArray(comboJson.data)) {
          setCombos(comboJson.data);
        }
      } else {
        setErrorMsg(json.message || json.error || 'Bán bắp nước thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối khi thanh toán combo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#141414] p-6 lg:p-8 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header POS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                POS Bán Vé & Bắp Nước Tại Quầy
              </h1>
              <span className="bg-[#E63946] text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                Quầy Vé Trực Tiếp
              </span>
            </div>
            <p className="text-[#A3A3A3] text-sm mt-1">
              Hệ thống bán vé cho khách vãng lai, thu tiền mặt tức thì và xuất vé điện tử tại chỗ
            </p>
          </div>

          {/* Tab chuyển đổi chế độ bán */}
          <div className="flex bg-[#1E1E1E] p-1 rounded-xl border border-[#333333]">
            <button
              onClick={() => { setActiveTab('TICKETS'); setErrorMsg(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'TICKETS'
                  ? 'bg-[#E63946] text-white shadow-lg'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              🎟️ Bán Vé Xem Phim
            </button>
            <button
              onClick={() => { setActiveTab('COMBOS'); setErrorMsg(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'COMBOS'
                  ? 'bg-[#E63946] text-white shadow-lg'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              🍿 Bán Bắp Nước Quầy
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex justify-between items-center">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-white hover:opacity-75">✕</button>
          </div>
        )}

        {/* TAB 1: BÁN VÉ XEM PHIM */}
        {activeTab === 'TICKETS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cột trái: Chọn phim, suất chiếu & Sơ đồ ghế (8 cột) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Bước 1: Chọn Phim */}
              <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-[#333333] space-y-3">
                <span className="text-xs font-bold uppercase text-[#E63946] tracking-wider block">
                  Bước 1: Chọn Phim Đang Chiếu
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
                  {movies.map(movie => {
                    const isSelected = selectedMovie?.id === movie.id;
                    return (
                      <div
                        key={movie.id}
                        onClick={() => setSelectedMovie(movie)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${
                          isSelected
                            ? 'bg-[#E63946]/20 border-[#E63946] ring-1 ring-[#E63946]'
                            : 'bg-[#141414] border-[#333333] hover:border-[#555]'
                        }`}
                      >
                        <div className="w-16 h-20 relative rounded-lg overflow-hidden mb-2 bg-[#252525]">
                          {movie.poster && (
                            <Image src={movie.poster} alt={movie.title} fill className="object-cover" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{movie.title}</h4>
                        <span className="text-[10px] text-[#A3A3A3] mt-0.5">{movie.duration} phút {movie.ageRating ? `• ${movie.ageRating}` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bước 2: Chọn Suất Chiếu */}
              {selectedMovie && (
                <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-[#333333] space-y-3">
                  <span className="text-xs font-bold uppercase text-[#E63946] tracking-wider block">
                    Bước 2: Chọn Suất Chiếu Hôm Nay
                  </span>
                  {screenings.length === 0 ? (
                    <p className="text-xs text-[#737373]">Phim này hiện chưa có lịch chiếu khả dụng.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {screenings.map(sc => {
                        const isSelected = selectedScreening?.id === sc.id;
                        const startTimeFormatted = new Date(sc.startTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        });
                        return (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => setSelectedScreening(sc)}
                            className={`px-4 py-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-[#E63946] border-[#E63946] text-white shadow-lg'
                                : 'bg-[#141414] border-[#333333] text-[#A3A3A3] hover:text-white hover:border-[#555]'
                            }`}
                          >
                            <div className="text-sm font-black">{startTimeFormatted}</div>
                            <div className="text-[11px] opacity-80">{sc.room} • {Number(sc.price).toLocaleString('vi-VN')} đ</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Bước 3: Sơ đồ 50 ghế ngồi */}
              {selectedScreening && (
                <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-[#333333] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-[#E63946] tracking-wider">
                      Bước 3: Chọn Ghế Ngồi (50 Ghế)
                    </span>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#2A2A2A] border border-[#444]" /> Trống</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#E63946]" /> Đang chọn</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-950 border border-red-800" /> Đã bán</span>
                    </div>
                  </div>

                  {/* Màn hình rạp */}
                  <div className="w-full text-center py-2 bg-gradient-to-b from-[#2A2A2A] to-transparent rounded-lg border-t-2 border-[#E63946]/60 text-[11px] font-bold tracking-widest text-[#A3A3A3]">
                    MÀN HÌNH CHIẾU
                  </div>

                  {/* Lưới ghế 5 hàng A-E, 10 cột */}
                  <div className="grid grid-cols-10 gap-2 max-w-lg mx-auto py-3">
                    {seats.map(seat => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isOccupied = seat.status === 'OCCUPIED';

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => toggleSeat(seat.id)}
                          className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                            isOccupied
                              ? 'bg-red-950/60 text-red-500 border border-red-900/60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[#E63946] text-white shadow-lg scale-105 ring-2 ring-white/50'
                              : 'bg-[#2A2A2A] text-white border border-[#444] hover:border-[#E63946]'
                          }`}
                        >
                          {seat.code}
                        </button>
                      );
                    })}
                  </div>

                  {/* Chọn phân loại vé cho các ghế đang chọn */}
                  {selectedSeatIds.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#2D2D2D] space-y-3">
                      <span className="text-xs font-bold text-white block">
                        Cấu hình loại vé cho {selectedSeatIds.length} ghế đã chọn:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedSeatIds.map(seatId => {
                          const sObj = seats.find(s => s.id === seatId);
                          const curType = seatTicketTypes[seatId] || 'Thường';
                          return (
                            <div key={seatId} className="flex items-center justify-between p-2.5 bg-[#141414] rounded-xl border border-[#333]">
                              <span className="font-bold text-sm text-[#FFB703]">Ghế {sObj?.code}</span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => changeTicketType(seatId, 'Thường')}
                                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                                    curType === 'Thường' ? 'bg-[#E63946] text-white' : 'bg-[#252525] text-[#A3A3A3]'
                                  }`}
                                >
                                  Thường (100%)
                                </button>
                                <button
                                  type="button"
                                  disabled={isAdultOnly}
                                  onClick={() => changeTicketType(seatId, 'Trẻ em')}
                                  title={isAdultOnly ? 'Phim T18 không áp dụng vé trẻ em (BR-02)' : ''}
                                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                                    curType === 'Trẻ em'
                                      ? 'bg-blue-600 text-white'
                                      : isAdultOnly
                                      ? 'bg-[#1A1A1A] text-[#555] cursor-not-allowed'
                                      : 'bg-[#252525] text-[#A3A3A3]'
                                  }`}
                                >
                                  Trẻ em (50%)
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cột phải: Chọn combo kèm theo & Thu tiền quầy (4 cột) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Thêm Combo bắp nước */}
              <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-[#333333] space-y-3">
                <span className="text-xs font-bold uppercase text-[#E63946] tracking-wider block">
                  Thêm Bắp Nước Kèm Theo
                </span>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {combos.map(combo => {
                    const qty = selectedCombos[combo.id] || 0;
                    return (
                      <div key={combo.id} className="flex items-center justify-between p-2.5 bg-[#141414] rounded-xl border border-[#333]">
                        <div className="min-w-0 pr-2">
                          <h5 className="text-xs font-bold text-white truncate">{combo.name}</h5>
                          <span className="text-[11px] text-[#FFB703] font-bold">
                            {Number(combo.price).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-[10px] text-[#737373] ml-2">Kho: {combo.stock}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateComboQuantity(combo.id, -1)}
                            disabled={qty === 0}
                            className="w-6 h-6 rounded bg-[#252525] text-white flex items-center justify-center text-xs hover:bg-[#333] disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateComboQuantity(combo.id, 1)}
                            disabled={qty >= combo.stock}
                            className="w-6 h-6 rounded bg-[#252525] text-white flex items-center justify-center text-xs hover:bg-[#333] disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Thông tin khách hàng & Tổng kết thanh toán */}
              <div className="bg-[#1E1E1E] rounded-2xl p-5 border border-[#333333] space-y-4">
                <span className="text-xs font-bold uppercase text-white tracking-wider block">
                  Thông Tin Khách & Thanh Toán
                </span>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Tên khách hàng (Tùy chọn)"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E63946]"
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại nhận vé (Tùy chọn)"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E63946]"
                  />
                </div>

                {/* Áp dụng Voucher / Mã giảm giá */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã voucher (Tùy chọn)"
                      value={couponCodeInput}
                      onChange={e => setCouponCodeInput(e.target.value)}
                      disabled={Boolean(appliedCoupon) || validatingCoupon}
                      className="flex-1 bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-[#E63946]"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCodeInput('');
                          setVoucherSeatId(null);
                        }}
                        className="px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-xs font-semibold"
                      >
                        Gỡ bỏ
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCodeInput.trim() || selectedSeatIds.length === 0}
                        className="px-3 py-2 bg-[#FFB703] text-black hover:bg-[#e0a202] rounded-xl text-xs font-bold disabled:opacity-40"
                      >
                        {validatingCoupon ? 'Kiểm tra...' : 'Áp dụng'}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-400">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <div className="p-2 bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between text-[#2ECC71] font-semibold">
                        <span>Mã: {appliedCoupon.code}</span>
                        <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                      {appliedCoupon.is_compensation && selectedSeatIds.length > 1 && (
                        <div className="pt-1">
                          <label className="text-[11px] text-[#A3A3A3] block mb-1">Ghế áp dụng giảm 50%:</label>
                          <select
                            value={voucherSeatId ?? selectedSeatIds[0]}
                            onChange={e => setVoucherSeatId(Number(e.target.value))}
                            className="w-full bg-[#1A1A1A] text-white text-xs border border-[#444] rounded p-1"
                          >
                            {selectedSeatIds.map(sId => {
                              const s = seats.find(item => item.id === sId);
                              return (
                                <option key={sId} value={sId}>
                                  Ghế {s?.code || sId}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-[#141414] rounded-xl p-3.5 border border-[#2D2D2D] space-y-2 text-xs">
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Số lượng ghế:</span>
                    <span className="text-white font-bold">{selectedSeatIds.length} ghế</span>
                  </div>
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Tiền vé:</span>
                    <span className="text-white font-bold">{ticketSubtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-[#2ECC71]">
                      <span>Giảm giá voucher:</span>
                      <span className="font-bold">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Tiền bắp nước:</span>
                    <span className="text-white font-bold">{comboSubtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-[#2D2D2D]">
                    <span className="font-bold text-white">Tổng thu tiền mặt:</span>
                    <span className="font-black text-[#FFB703] text-base">{totalTicketPosAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={submitting || selectedSeatIds.length === 0}
                  onClick={handleCheckoutTicketPos}
                >
                  {submitting ? 'Đang xuất vé...' : `💵 Thu Tiền Mặt (${totalTicketPosAmount.toLocaleString('vi-VN')} đ)`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BÁN BẮP NƯỚC ĐỘC LẬP TẠI QUẦY */}
        {activeTab === 'COMBOS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-[#1E1E1E] rounded-2xl p-5 border border-[#333333] space-y-4">
              <span className="text-xs font-bold uppercase text-[#E63946] tracking-wider block">
                Danh Mục Bắp Nước Sẵn Có Tại Quầy
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {combos.map(combo => {
                  const qty = selectedCombos[combo.id] || 0;
                  return (
                    <div key={combo.id} className="p-4 bg-[#141414] rounded-xl border border-[#333] flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-white text-sm">{combo.name}</h4>
                        <p className="text-xs text-[#FFB703] font-black mt-1">
                          {Number(combo.price).toLocaleString('vi-VN')} đ
                        </p>
                        <span className="text-[11px] text-[#737373] mt-1 block">Tồn kho: {combo.stock} phần</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#252525]">
                        <span className="text-xs text-[#A3A3A3]">Số lượng:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateComboQuantity(combo.id, -1)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded bg-[#252525] text-white flex items-center justify-center hover:bg-[#333] disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm w-5 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateComboQuantity(combo.id, 1)}
                            disabled={qty >= combo.stock}
                            className="w-7 h-7 rounded bg-[#252525] text-white flex items-center justify-center hover:bg-[#333] disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột phải: Thu tiền bắp nước */}
            <div className="lg:col-span-4 bg-[#1E1E1E] rounded-2xl p-5 border border-[#333333] space-y-4">
              <span className="text-xs font-bold uppercase text-white tracking-wider block">
                Thanh Toán Bắp Nước Tại Quầy
              </span>

              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Tên khách hàng (Tùy chọn)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E63946]"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại khách (Tùy chọn)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#E63946]"
                />
              </div>

              <div className="bg-[#141414] rounded-xl p-3.5 border border-[#2D2D2D] space-y-2 text-xs">
                {Object.entries(selectedCombos).map(([cId, qty]) => {
                  const combo = combos.find(c => c.id === Number(cId));
                  if (!combo || qty === 0) return null;
                  return (
                    <div key={cId} className="flex justify-between text-[#A3A3A3]">
                      <span>{combo.name} x {qty}</span>
                      <span className="text-white font-medium">{(Number(combo.price) * qty).toLocaleString('vi-VN')} đ</span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm pt-2 border-t border-[#2D2D2D]">
                  <span className="font-bold text-white">Tổng tiền thu mặt:</span>
                  <span className="font-black text-[#FFB703] text-base">{comboSubtotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                disabled={submitting || comboSubtotal === 0}
                onClick={handleCheckoutComboOnly}
              >
                {submitting ? 'Đang thanh toán...' : `💵 Thu Tiền Mặt (${comboSubtotal.toLocaleString('vi-VN')} đ)`}
              </Button>
            </div>
          </div>
        )}

        {/* Modal Biên Lai POS Thành Công */}
        <Modal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          title="BIÊN LAI BÁN TẠI QUẦY (POS)"
        >
          {completedReceipt && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 bg-green-500/20 text-green-400 border border-green-500/40 rounded-full flex items-center justify-center text-2xl mx-auto">
                ✓
              </div>
              <h3 className="text-base font-bold text-white">Giao Dịch Tại Quầy Thành Công!</h3>

              <div className="bg-[#141414] rounded-xl p-4 border border-[#333] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Mã hóa đơn:</span>
                  <span className="font-mono font-bold text-white">{completedReceipt.receipt_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Khách hàng:</span>
                  <span className="text-white">{completedReceipt.customer_name}</span>
                </div>
                {completedReceipt.movie_title && (
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Phim:</span>
                    <span className="text-white font-bold">{completedReceipt.movie_title} ({completedReceipt.room})</span>
                  </div>
                )}
                {completedReceipt.discount_amount > 0 && (
                  <div className="flex justify-between text-[#2ECC71]">
                    <span>Khuyến mãi ({completedReceipt.coupon_code}):</span>
                    <span className="font-bold">-{Number(completedReceipt.discount_amount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[#2D2D2D]">
                  <span className="text-[#737373]">Tổng tiền thu:</span>
                  <span className="text-[#FFB703] font-black text-sm">
                    {(completedReceipt.final_amount ?? completedReceipt.total_amount)?.toLocaleString('vi-VN')} đ (Tiền mặt)
                  </span>
                </div>
              </div>

              {/* Danh sách QR Vé đã xuất */}
              {completedReceipt.tickets && completedReceipt.tickets.length > 0 && (
                <div className="space-y-3 pt-2 text-left">
                  <span className="text-xs font-bold text-white uppercase block">
                    Danh Sách Vé & Mã QR ({completedReceipt.tickets.length} vé):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {completedReceipt.tickets.map((t: any) => (
                      <div key={t.id} className="p-3 bg-[#171717] rounded-xl border border-[#333] flex items-center gap-3">
                        <div className="bg-white p-1 rounded-lg">
                          <QRCodeSVG value={t.qr_payload} size={56} />
                        </div>
                        <div className="text-xs min-w-0">
                          <span className="font-bold text-[#FFB703] block">Ghế {t.seat_code}</span>
                          <span className="text-[10px] text-white block">{t.ticket_code}</span>
                          <span className="text-[10px] text-[#A3A3A3] block">{t.ticket_type} • {Number(t.price).toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <Button variant="secondary" fullWidth onClick={() => window.print()}>
                  🖨️ In Biên Lai
                </Button>
                <Button variant="primary" fullWidth onClick={() => setReceiptModalOpen(false)}>
                  Hoàn Tất
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
