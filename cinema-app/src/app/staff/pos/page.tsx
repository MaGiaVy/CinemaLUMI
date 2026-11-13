'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
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

  // Chọn combo
  const [selectedCombos, setSelectedCombos] = useState<Record<number, number>>({});

  // Khách hàng
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Trạng thái xử lý
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);

  // Modal Quét ZaloPay QR tại quầy
  const [zaloQrModalOpen, setZaloQrModalOpen] = useState(false);

  // Bộ đếm ngược 10 phút giữ chỗ quầy (600s)
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(600);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoldSecondsLeft(prev => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const holdTimeFormatted = useMemo(() => {
    const m = Math.floor(holdSecondsLeft / 60);
    const s = holdSecondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [holdSecondsLeft]);

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
          if (movieJson.data.length > 0) {
            setSelectedMovie(movieJson.data[0]);
          }
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
          const now = new Date();
          const upcoming = json.data.filter((s: any) => new Date(s.start_time || s.startTime) > now);
          const list = upcoming.length > 0 ? upcoming : json.data;
          setScreenings(list);
          if (list.length > 0) {
            setSelectedScreening(list[0]);
          } else {
            setSelectedScreening(null);
          }
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
          setSelectedSeatIds([]);
          setSeatTicketTypes({});
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
      if (combo && next > combo.stock) return prev;
      if (next === 0) {
        const copy = { ...prev };
        delete copy[comboId];
        return copy;
      }
      return { ...prev, [comboId]: next };
    });
  };

  // Tính toán tổng tiền
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

  const totalAmount = activeTab === 'TICKETS' ? ticketSubtotal + comboSubtotal : comboSubtotal;

  // Thanh toán vé tại quầy (Tiền mặt)
  const handleCheckoutTicketPos = async (paymentMethod: 'Cash' | 'ZaloPay' = 'Cash') => {
    if (!selectedScreening || selectedSeatIds.length === 0) {
      setErrorMsg('Vui lòng chọn suất chiếu và ít nhất một ghế ngồi trên sơ đồ');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const ticketItems = selectedSeatIds.map(seatId => ({
        type: seatTicketTypes[seatId] || 'Thường',
        quantity: 1,
      }));

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
          customer_name: customerName.trim() || 'Khách vãng lai quầy',
          customer_phone: customerPhone.trim() || '0900000000',
          payment_method: paymentMethod,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCompletedReceipt(json.data);
        setReceiptModalOpen(true);
        setZaloQrModalOpen(false);
        // Reset form
        setSelectedSeatIds([]);
        setSelectedCombos({});
        setCustomerName('');
        setCustomerPhone('');
        // Tải lại sơ đồ ghế
        if (selectedScreening) {
          const seatRes = await fetch(`/api/screenings/${selectedScreening.id}`);
          const seatJson = await seatRes.json();
          if (seatJson.success && seatJson.data?.seats) {
            setSeats(seatJson.data.seats);
          }
        }
      } else {
        setErrorMsg(json.message || json.error || 'Bán vé không thành công');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối khi thanh toán vé');
    } finally {
      setSubmitting(false);
    }
  };

  // Thanh toán combo độc lập tại quầy
  const handleCheckoutComboOnly = async (paymentMethod: 'Cash' | 'ZaloPay' = 'Cash') => {
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
          customer_name: customerName.trim() || 'Khách vãng lai quầy',
          customer_phone: customerPhone.trim() || '0900000000',
          payment_method: paymentMethod,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCompletedReceipt(json.data);
        setReceiptModalOpen(true);
        setZaloQrModalOpen(false);
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

  // Mở quét ZaloPay QR
  const handleOpenZaloPayQR = () => {
    if (activeTab === 'TICKETS') {
      if (!selectedScreening || selectedSeatIds.length === 0) {
        setErrorMsg('Vui lòng chọn suất chiếu và ít nhất một ghế ngồi trước khi tạo mã QR ZaloPay');
        return;
      }
    } else {
      if (Object.keys(selectedCombos).length === 0) {
        setErrorMsg('Vui lòng chọn ít nhất một combo bắp nước');
        return;
      }
    }
    setErrorMsg(null);
    setZaloQrModalOpen(true);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 text-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto space-y-5">

        {/* 1. Header Bar Buồng Lái Thu Ngân */}
        <header className="bg-gradient-to-r from-[rgba(20,14,32,0.92)] to-[rgba(35,12,28,0.9)] backdrop-blur-2xl border border-[rgba(192,132,252,0.25)] rounded-2xl p-4 lg:px-6 lg:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(88,28,135,0.2)]">
          <div className="flex items-center gap-3.5">
            <span className="bg-gradient-to-br from-[#E11D48] to-[#881337] text-white font-black text-xs tracking-wider px-3 py-1.5 rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.6)] border border-[rgba(254,205,211,0.35)]">
              ✦ LUMI POS
            </span>
            <div>
              <h1 className="text-sm lg:text-base font-extrabold text-[#F8FAFC] tracking-wide">
                BUỒNG LÁI THU NGÂN VŨ TRỤ · QUẦY SỐ 01
              </h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Thu ngân: <strong className="text-[#F8FAFC]">Trần Thị Thu</strong> · Ca tối 18:00 - 23:30 · Chế độ ca đêm dịu mắt
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Chế độ bán vé vs combo độc lập */}
            <div className="flex bg-[rgba(8,6,14,0.7)] p-1 rounded-xl border border-[rgba(192,132,252,0.18)]">
              <button
                type="button"
                onClick={() => { setActiveTab('TICKETS'); setErrorMsg(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  activeTab === 'TICKETS'
                    ? 'bg-gradient-to-r from-[rgba(225,29,72,0.4)] to-[rgba(88,28,135,0.5)] text-white border border-[rgba(244,63,94,0.6)] shadow-[0_0_16px_rgba(225,29,72,0.4)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Bán Vé & Combo
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('COMBOS'); setErrorMsg(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  activeTab === 'COMBOS'
                    ? 'bg-gradient-to-r from-[rgba(225,29,72,0.4)] to-[rgba(88,28,135,0.5)] text-white border border-[rgba(244,63,94,0.6)] shadow-[0_0_16px_rgba(225,29,72,0.4)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Bắp Nước Quầy
              </button>
            </div>

            {/* Đèn trạng thái phần cứng (Không dùng icon) */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-[rgba(13,10,22,0.75)] border border-[rgba(192,132,252,0.2)] px-3 py-1.5 rounded-full text-xs text-[#CBD5E1]">
                <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
                <span className="text-[11px] font-medium">Máy In Sẵn Sàng</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[rgba(13,10,22,0.75)] border border-[rgba(192,132,252,0.2)] px-3 py-1.5 rounded-full text-xs text-[#CBD5E1]">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
                <span className="text-[11px] font-medium">ZaloPay POS Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[rgba(225,29,72,0.18)] border border-[rgba(225,29,72,0.45)] text-[#FDA4AF] text-xs flex justify-between items-center shadow-[0_0_20px_rgba(225,29,72,0.25)]">
            <span className="font-semibold">{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-[#FDA4AF] hover:text-white font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* CỘT TRÁI: 3 BƯỚC THAO TÁC (8 CỘT) */}
          <div className="lg:col-span-8 space-y-5">

            {activeTab === 'TICKETS' ? (
              <>
                {/* BƯỚC 1: CHỌN SUẤT CHIẾU HÔM NAY (SCREENING RADAR) */}
                <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-4 lg:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
                        <span className="text-[#E11D48] text-sm font-black">✦</span>
                        BƯỚC 1: CHỌN PHIM & SUẤT CHIẾU HÔM NAY
                      </span>
                    </div>
                    <span className="text-[11px] text-[#94A3B8]">
                      Lọc theo phim đang khởi chiếu tại các phòng
                    </span>
                  </div>

                  {/* Thanh chọn phim */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2.5 mb-3.5 scrollbar-thin">
                    {movies.map(movie => {
                      const isSelected = selectedMovie?.id === movie.id;
                      return (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => setSelectedMovie(movie)}
                          className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-[rgba(225,29,72,0.35)] to-[rgba(88,28,135,0.45)] border-[#E11D48] shadow-[0_0_18px_rgba(225,29,72,0.4)]'
                              : 'bg-[rgba(18,14,28,0.7)] border-[rgba(192,132,252,0.18)] hover:border-[rgba(192,132,252,0.4)]'
                          }`}
                        >
                          <div className="w-8 h-10 relative rounded overflow-hidden bg-[rgba(255,255,255,0.05)] flex-shrink-0">
                            {movie.poster && (
                              <Image src={movie.poster} alt={movie.title} fill className="object-cover" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#F8FAFC] line-clamp-1 max-w-[130px]">
                              {movie.title}
                            </div>
                            <div className="text-[10px] text-[#94A3B8]">
                              {movie.duration} phút {movie.ageRating ? `· ${movie.ageRating}` : ''}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Danh sách các suất chiếu của phim đã chọn */}
                  {selectedMovie && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {screenings.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-xs text-[#94A3B8]">
                          Chưa có suất chiếu khả dụng hôm nay cho phim này.
                        </div>
                      ) : (
                        screenings.map(sc => {
                          const isSelected = selectedScreening?.id === sc.id;
                          const startTimeFormatted = new Date(sc.startTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          });
                          return (
                            <div
                              key={sc.id}
                              onClick={() => setSelectedScreening(sc)}
                              className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.4)_0%,transparent_65%),radial-gradient(circle_at_bottom_left,rgba(88,28,135,0.5)_0%,transparent_70%),rgba(24,15,38,0.95)] border-[#E11D48] shadow-[0_0_24px_rgba(225,29,72,0.5),inset_0_0_14px_rgba(225,29,72,0.25)]'
                                  : 'bg-[radial-gradient(circle_at_0%_0%,rgba(88,28,135,0.2)_0%,transparent_60%),rgba(18,14,28,0.7)] border-[rgba(192,132,252,0.18)] hover:border-[rgba(192,132,252,0.45)] hover:-translate-y-0.5'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-[#F8FAFC] tracking-wider">
                                  {startTimeFormatted}
                                </span>
                                <span className="text-[10px] font-bold text-[#FDA4AF] bg-[rgba(225,29,72,0.2)] border border-[rgba(225,29,72,0.4)] px-1.5 py-0.5 rounded">
                                  {sc.room}
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-[#CBD5E1] mt-1.5">
                                {Number(sc.price).toLocaleString('vi-VN')} đ
                              </div>
                              <div className="text-[10px] text-[#C084FC] mt-1">
                                Chuẩn Laser 4K
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </section>

                {/* BƯỚC 2: SƠ ĐỒ 50 GHẾ KHÁN PHÒNG (LASER SCREEN MATRIX) */}
                <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-4 lg:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.85)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
                      <span className="text-[#E11D48] text-sm font-black">✦</span>
                      BƯỚC 2: SƠ ĐỒ 50 GHẾ KHÁN PHÒNG (LASER SCREEN MATRIX)
                    </span>
                    <div className="flex items-center gap-3.5 text-[11px]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(192,132,252,0.3)]" />
                        <span className="text-[#94A3B8]">Trống</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[#E11D48] shadow-[0_0_8px_#E11D48]" />
                        <span className="text-[#FDA4AF] font-bold">Đang Chọn</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[rgba(20,16,26,0.8)] border border-[#2E243B] flex items-center justify-center text-[9px] text-[#64748B]">✕</span>
                        <span className="text-[#64748B]">Đã Bán</span>
                      </span>
                    </div>
                  </div>

                  {/* Khung Khán Phòng Vô Cực */}
                  <div className="bg-[radial-gradient(circle_at_50%_0%,rgba(225,29,72,0.25)_0%,transparent_55%),radial-gradient(circle_at_50%_100%,rgba(88,28,135,0.28)_0%,transparent_60%),rgba(11,8,18,0.85)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-4 lg:p-6 relative overflow-hidden">
                    {/* Glowing Curved Laser Screen */}
                    <div className="flex flex-col items-center mb-6">
                      <div
                        className="w-[82%] h-3 rounded-t-[50%] mb-2"
                        style={{
                          background: 'linear-gradient(90deg, rgba(88, 28, 135, 0.15) 0%, rgba(225, 29, 72, 0.95) 50%, rgba(88, 28, 135, 0.15) 100%)',
                          boxShadow: '0 0 30px rgba(225, 29, 72, 0.85), 0 0 60px rgba(192, 132, 252, 0.6)',
                        }}
                      />
                      <span className="text-[10px] font-extrabold tracking-[2px] text-[#CBD5E1] uppercase">
                        MÀN CHIẾU CONG ORBITAL LASER 4K
                      </span>
                    </div>

                    {/* Ma trận ghế 5 hàng A-E, 10 cột */}
                    {seats.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#94A3B8]">
                        Vui lòng chọn suất chiếu để hiển thị sơ đồ ghế.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-w-xl mx-auto py-2">
                        {['A', 'B', 'C', 'D', 'E'].map(rowLetter => {
                          const rowSeats = seats.filter(s => s.row === rowLetter).sort((a, b) => a.number - b.number);
                          return (
                            <div key={rowLetter} className="flex items-center justify-center gap-2">
                              <span className="w-5 text-center text-xs font-black text-[#C084FC]">
                                {rowLetter}
                              </span>
                              <div className="flex gap-2">
                                {rowSeats.map(seat => {
                                  const isSelected = selectedSeatIds.includes(seat.id);
                                  const isOccupied = seat.status === 'OCCUPIED';

                                  return (
                                    <button
                                      key={seat.id}
                                      type="button"
                                      disabled={isOccupied}
                                      onClick={() => toggleSeat(seat.id)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                                        isOccupied
                                          ? 'bg-[rgba(20,16,26,0.6)] border border-[#2E243B] text-[#4B3E5C] cursor-not-allowed'
                                          : isSelected
                                          ? 'bg-gradient-to-br from-[#E11D48] to-[#9F1239] border border-[#FDA4AF] text-white shadow-[0_0_20px_rgba(225,29,72,0.95)] scale-110'
                                          : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(192,132,252,0.25)] text-[#CBD5E1] hover:bg-[rgba(192,132,252,0.25)] hover:border-[#C084FC] hover:scale-105'
                                      }`}
                                    >
                                      {isOccupied ? '✕' : seat.number}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tùy chỉnh loại vé cho các ghế đang chọn */}
                  {selectedSeatIds.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[rgba(192,132,252,0.15)] space-y-2.5">
                      <span className="text-xs font-extrabold text-[#F8FAFC] block">
                        Cấu hình phân loại vé cho {selectedSeatIds.length} ghế đang chọn:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedSeatIds.map(seatId => {
                          const sObj = seats.find(s => s.id === seatId);
                          const curType = seatTicketTypes[seatId] || 'Thường';
                          return (
                            <div key={seatId} className="flex items-center justify-between p-2.5 bg-[rgba(18,14,28,0.7)] rounded-xl border border-[rgba(192,132,252,0.2)]">
                              <span className="font-extrabold text-xs text-[#FDA4AF]">Ghế {sObj?.code}</span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => changeTicketType(seatId, 'Thường')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    curType === 'Thường'
                                      ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                                      : 'bg-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:text-white'
                                  }`}
                                >
                                  Thường (100%)
                                </button>
                                <button
                                  type="button"
                                  disabled={isAdultOnly}
                                  onClick={() => changeTicketType(seatId, 'Trẻ em')}
                                  title={isAdultOnly ? 'Phim T18 không áp dụng vé trẻ em (BR-02)' : ''}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    curType === 'Trẻ em'
                                      ? 'bg-gradient-to-r from-[#581C87] to-[#7E22CE] text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                                      : isAdultOnly
                                      ? 'bg-[rgba(20,16,26,0.5)] text-[#475569] cursor-not-allowed'
                                      : 'bg-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:text-white'
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
                </section>

                {/* BƯỚC 3: COMBO BẮP NƯỚC GIAO TẠI QUẦY (CONCESSION BAR) */}
                <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-4 lg:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.85)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                    <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
                      <span className="text-[#E11D48] text-sm font-black">✦</span>
                      BƯỚC 3: COMBO BẮP NƯỚC GIAO NGAY TẠI QUẦY (CONCESSION BAR)
                    </span>
                    <span className="text-[11px] text-[#FDA4AF]">
                      Tự động trừ kho thời gian thực
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {combos.map(combo => {
                      const qty = selectedCombos[combo.id] || 0;
                      const isActive = qty > 0;
                      return (
                        <div
                          key={combo.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                            isActive
                              ? 'bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.35)_0%,transparent_60%),radial-gradient(circle_at_bottom_left,rgba(88,28,135,0.4)_0%,transparent_70%),rgba(22,14,34,0.9)] border-[rgba(225,29,72,0.75)] shadow-[0_0_20px_rgba(225,29,72,0.35)]'
                              : 'bg-[radial-gradient(circle_at_0%_0%,rgba(88,28,135,0.3)_0%,transparent_70%),rgba(15,11,24,0.7)] border-[rgba(192,132,252,0.2)] hover:border-[rgba(192,132,252,0.4)]'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-extrabold text-xs text-[#F8FAFC]">{combo.name}</h4>
                              {isActive && (
                                <span className="bg-[rgba(225,29,72,0.25)] text-[#FDA4AF] border border-[rgba(225,29,72,0.5)] text-[9px] font-black px-1.5 py-0.5 rounded">
                                  ĐÃ CHỌN
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-black text-[#FDA4AF] mt-1">
                              {Number(combo.price).toLocaleString('vi-VN')} đ
                            </div>
                            <span className="text-[10px] text-[#94A3B8] block mt-0.5">
                              Tồn kho: {combo.stock} phần
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[rgba(192,132,252,0.1)]">
                            <span className="text-[11px] text-[#94A3B8]">Số lượng:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateComboQuantity(combo.id, -1)}
                                disabled={qty === 0}
                                className="w-6 h-6 rounded-md bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white flex items-center justify-center text-xs font-black hover:bg-[#E11D48] hover:border-[#FDA4AF] disabled:opacity-30 transition-all"
                              >
                                -
                              </button>
                              <span className="text-xs font-black w-4 text-center text-[#F8FAFC]">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateComboQuantity(combo.id, 1)}
                                disabled={qty >= combo.stock}
                                className="w-6 h-6 rounded-md bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white flex items-center justify-center text-xs font-black hover:bg-[#E11D48] hover:border-[#FDA4AF] disabled:opacity-30 transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              /* TAB 2: BÁN BẮP NƯỚC ĐỘC LẬP TẠI QUẦY */
              <section className="bg-[radial-gradient(circle_at_0%_0%,rgba(136,19,55,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.3)_0%,transparent_60%),rgba(15,11,25,0.85)] backdrop-blur-2xl border border-[rgba(192,132,252,0.22)] rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.85)] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black tracking-widest text-[#C084FC] uppercase flex items-center gap-1.5">
                    <span className="text-[#E11D48] text-sm font-black">✦</span>
                    DANH MỤC BẮP NƯỚC ĐỘC LẬP TẠI QUẦY (CONCESSION COUNTER)
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    Bàn giao và in biên lai trực tiếp không cần vé xem phim
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {combos.map(combo => {
                    const qty = selectedCombos[combo.id] || 0;
                    return (
                      <div
                        key={combo.id}
                        className="p-4 bg-[rgba(18,14,28,0.75)] rounded-xl border border-[rgba(192,132,252,0.2)] flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <h4 className="font-extrabold text-[#F8FAFC] text-sm">{combo.name}</h4>
                          <p className="text-xs text-[#FDA4AF] font-black mt-1">
                            {Number(combo.price).toLocaleString('vi-VN')} đ
                          </p>
                          <span className="text-[11px] text-[#94A3B8] mt-1 block">
                            Tồn kho: {combo.stock} phần
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
                          <span className="text-xs text-[#94A3B8]">Số lượng:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateComboQuantity(combo.id, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.08)] text-white flex items-center justify-center font-black hover:bg-[#E11D48] disabled:opacity-30 transition-all"
                            >
                              -
                            </button>
                            <span className="font-black text-sm w-5 text-center text-[#F8FAFC]">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateComboQuantity(combo.id, 1)}
                              disabled={qty >= combo.stock}
                              className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.08)] text-white flex items-center justify-center font-black hover:bg-[#E11D48] disabled:opacity-30 transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          </div>

          {/* CỘT PHẢI: PHIẾN KÍNH HÓA ĐƠN THU NGÂN (NEBULA SLIP) (4 CỘT) */}
          <aside className="lg:col-span-4 bg-[radial-gradient(circle_at_100%_0%,rgba(225,29,72,0.3)_0%,transparent_50%),radial-gradient(circle_at_0%_100%,rgba(88,28,135,0.4)_0%,transparent_60%),rgba(13,9,22,0.92)] backdrop-blur-2xl border border-[rgba(192,132,252,0.32)] rounded-2xl p-5 flex flex-col justify-between shadow-[0_12px_48px_rgba(0,0,0,0.9),0_0_40px_rgba(88,28,135,0.3)]">
            <div className="space-y-4">
              {/* Slip Header with Rotating Cosmic Hourglass */}
              <div className="border-b border-[rgba(255,255,255,0.08)] pb-3 flex justify-between items-start">
                <div>
                  <div className="text-sm font-black text-[#F8FAFC] tracking-wide">
                    HÓA ĐƠN QUẦY BÁN LẺ
                  </div>
                  <div className="text-[11px] font-bold text-[#C084FC] mt-0.5">
                    #POS-TERMINAL-01 · MÃ PHIÊN: #8842
                  </div>
                </div>

                {/* Hộp giữ chỗ 10 phút tích hợp biểu tượng đồng hồ cát xoay */}
                <div className="inline-flex items-center gap-1.5 bg-[rgba(225,29,72,0.18)] border border-[rgba(225,29,72,0.4)] px-2.5 py-1 rounded-full text-xs text-[#FDA4AF] font-bold">
                  <span className="hourglass-spin text-xs">⏳</span>
                  <span>GIỮ CHỖ: {holdTimeFormatted}</span>
                </div>
              </div>

              {/* Thông tin suất chiếu đang chọn */}
              {activeTab === 'TICKETS' && selectedScreening && selectedMovie && (
                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-xs space-y-1">
                  <div className="font-extrabold text-[#F8FAFC]">
                    {selectedMovie.title} {selectedMovie.ageRating ? `(${selectedMovie.ageRating})` : ''}
                  </div>
                  <div className="text-[#FDA4AF]">
                    {new Date(selectedScreening.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · Hôm nay · {selectedScreening.room} (Laser 4K)
                  </div>
                  <div className="text-[#C084FC]">
                    Ghế đã chọn: <strong>{selectedSeatIds.map(id => seats.find(s => s.id === id)?.code).filter(Boolean).join(', ') || 'Chưa chọn'}</strong> ({selectedSeatIds.length} ghế)
                  </div>
                </div>
              )}

              {/* Chi tiết từng mục hàng */}
              <div className="space-y-1.5 text-xs text-[#94A3B8]">
                {activeTab === 'TICKETS' && selectedSeatIds.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#CBD5E1]">
                      Vé xem phim ({selectedSeatIds.length} vé)
                    </span>
                    <span className="font-bold text-[#F8FAFC]">
                      {ticketSubtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                {Object.entries(selectedCombos).map(([cId, qty]) => {
                  const combo = combos.find(c => c.id === Number(cId));
                  if (!combo || qty === 0) return null;
                  return (
                    <div key={cId} className="flex justify-between items-center">
                      <span className="text-[#CBD5E1] truncate max-w-[190px]">
                        {combo.name} x {qty}
                      </span>
                      <span className="font-bold text-[#F8FAFC]">
                        {(Number(combo.price) * qty).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center text-[11px] text-[#64748B]">
                  <span>Khuyến mãi / Voucher</span>
                  <span>0 đ</span>
                </div>
              </div>

              {/* Form nhập thông tin khách hàng */}
              <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <input
                  type="text"
                  placeholder="Tên khách hàng (Tùy chọn)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-[rgba(8,6,14,0.7)] border border-[rgba(192,132,252,0.25)] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#E11D48] transition-colors"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại nhận vé (Tùy chọn)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-[rgba(8,6,14,0.7)] border border-[rgba(192,132,252,0.25)] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>

              {/* Total Calculation Card with Deep Aura */}
              <div className="bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.22)_0%,transparent_75%),rgba(8,6,14,0.85)] border border-[rgba(225,29,72,0.35)] rounded-xl p-3.5 shadow-[0_0_25px_rgba(225,29,72,0.25)]">
                <div className="flex justify-between items-baseline">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FDA4AF]">
                    TỔNG TIỀN THANH TOÁN
                  </div>
                  <div className="text-[10px] text-[#C084FC]">
                    Đã gồm 8% VAT
                  </div>
                </div>
                <div
                  className="text-2xl lg:text-3xl font-black text-white mt-1 tracking-tight"
                  style={{ textShadow: '0 0 25px rgba(255, 255, 255, 0.4)' }}
                >
                  {totalAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* 2 NÚT BẤM QUYỀN LỰC */}
            <div className="space-y-2.5 pt-4">
              {/* Nút 1: Xác nhận in vé (tiền mặt) */}
              <button
                type="button"
                disabled={submitting || (activeTab === 'TICKETS' ? selectedSeatIds.length === 0 : totalAmount === 0)}
                onClick={() => {
                  if (activeTab === 'TICKETS') handleCheckoutTicketPos('Cash');
                  else handleCheckoutComboOnly('Cash');
                }}
                className="w-full bg-gradient-to-r from-[#E11D48] via-[#9F1239] to-[#881337] border border-[rgba(254,205,211,0.4)] text-white font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm tracking-wide cursor-pointer shadow-[0_0_35px_rgba(225,29,72,0.65),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_0_45px_rgba(225,29,72,0.85)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'ĐANG XUẤT VÉ...' : 'XÁC NHẬN IN VÉ (TIỀN MẶT)'}
              </button>

              {/* Nút 2: Quét mã ZaloPay QR tại quầy */}
              <button
                type="button"
                disabled={submitting || (activeTab === 'TICKETS' ? selectedSeatIds.length === 0 : totalAmount === 0)}
                onClick={handleOpenZaloPayQR}
                className="w-full bg-gradient-to-r from-[rgba(88,28,135,0.4)] to-[rgba(30,20,50,0.7)] border border-[rgba(192,132,252,0.35)] text-[#E9D5FF] font-extrabold py-3 px-4 rounded-xl text-xs tracking-wide cursor-pointer shadow-[0_0_20px_rgba(88,28,135,0.3)] hover:border-[#C084FC] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                QUÉT MÃ ZALOPAY QR TẠI QUẦY
              </button>

              <div className="text-center text-[10px] text-[#94A3B8] pt-1">
                Tự động đẩy lệnh tới máy in nhiệt chuyên dụng 80mm
              </div>
            </div>
          </aside>

        </div>

        {/* Modal Quét Mã ZaloPay QR Tại Quầy */}
        <Modal
          isOpen={zaloQrModalOpen}
          onClose={() => setZaloQrModalOpen(false)}
          title="QUÉT MÃ ZALOPAY QR TẠI QUẦY THU NGÂN"
        >
          <div className="space-y-5 text-center p-2">
            <div>
              <p className="text-xs text-[#94A3B8]">
                Hướng màn hình phụ hoặc đưa mã QR sau cho khách quét thanh toán qua ứng dụng ZaloPay / Ngân hàng:
              </p>
              <div className="text-xl font-black text-[#F8FAFC] mt-2">
                {totalAmount.toLocaleString('vi-VN')} đ
              </div>
            </div>

            {/* Khung QR Code */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-[0_0_30px_rgba(192,132,252,0.4)]">
              <QRCodeSVG
                value={`https://zalopay.vn/pay?amount=${totalAmount}&order_ref=POS_${Date.now()}`}
                size={180}
              />
            </div>

            <div className="text-xs text-[#C084FC] font-bold">
              Trạng thái: Đang chờ khách quét mã thanh toán...
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setZaloQrModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white text-xs font-bold transition-all"
              >
                Hủy Giao Dịch
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  if (activeTab === 'TICKETS') handleCheckoutTicketPos('ZaloPay');
                  else handleCheckoutComboOnly('ZaloPay');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#581C87] to-[#7E22CE] text-white text-xs font-black shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:scale-105 transition-all"
              >
                {submitting ? 'Đang xác nhận...' : 'Đã Nhận Tiền ZaloPay'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Biên Lai POS Thành Công */}
        <Modal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          title="BIÊN LAI BÁN VÉ TẠI QUẦY (POS)"
        >
          {completedReceipt && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-[rgba(34,197,94,0.2)] text-[#86EFAC] border border-[#22C55E] rounded-full flex items-center justify-center text-xl mx-auto shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                ✓
              </div>
              <h3 className="text-sm font-black text-[#F8FAFC]">Giao Dịch Tại Quầy Thành Công!</h3>

              <div className="bg-[rgba(18,14,28,0.8)] rounded-xl p-3.5 border border-[rgba(192,132,252,0.2)] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Mã hóa đơn:</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">{completedReceipt.receipt_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Khách hàng:</span>
                  <span className="text-[#F8FAFC]">{completedReceipt.customer_name}</span>
                </div>
                {completedReceipt.movie_title && (
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Phim:</span>
                    <span className="text-[#F8FAFC] font-bold">{completedReceipt.movie_title} ({completedReceipt.room})</span>
                  </div>
                )}
                {completedReceipt.items && completedReceipt.items.length > 0 && (
                  <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] space-y-1">
                    <span className="text-[#94A3B8] block mb-1">Bắp nước giao tại quầy:</span>
                    {completedReceipt.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[#F8FAFC]">
                        <span>• {item.name} x {item.quantity}</span>
                        <span>{Number(item.total_price).toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[rgba(255,255,255,0.08)]">
                  <span className="text-[#94A3B8]">Tổng tiền thu:</span>
                  <span className="text-[#FDA4AF] font-black text-sm">
                    {(completedReceipt.final_amount ?? completedReceipt.total_amount)?.toLocaleString('vi-VN')} đ ({completedReceipt.payment_method === 'ZaloPay' ? 'ZaloPay' : 'Tiền mặt'})
                  </span>
                </div>
              </div>

              {/* Danh sách QR Vé đã xuất */}
              {completedReceipt.tickets && completedReceipt.tickets.length > 0 && (
                <div className="space-y-2.5 pt-1 text-left">
                  <span className="text-xs font-black text-[#F8FAFC] tracking-wider uppercase block">
                    Danh Sách Vé & Mã QR ({completedReceipt.tickets.length} vé):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {completedReceipt.tickets.map((t: any) => (
                      <div key={t.id} className="p-2.5 bg-[rgba(18,14,28,0.7)] rounded-xl border border-[rgba(192,132,252,0.2)] flex items-center gap-3">
                        <div className="bg-white p-1 rounded-lg flex-shrink-0">
                          <QRCodeSVG value={t.qr_payload} size={50} />
                        </div>
                        <div className="text-xs min-w-0">
                          <span className="font-extrabold text-[#FDA4AF] block">Ghế {t.seat_code}</span>
                          <span className="text-[10px] text-[#F8FAFC] block">{t.ticket_code}</span>
                          <span className="text-[10px] text-[#94A3B8] block">{t.ticket_type} · {Number(t.price).toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] text-white text-xs font-extrabold border border-[rgba(255,255,255,0.2)] transition-all"
                >
                  In Biên Lai Nhiệt
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-xs font-black shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all"
                >
                  Hoàn Tất
                </button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}
