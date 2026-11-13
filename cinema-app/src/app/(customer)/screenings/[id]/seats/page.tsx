'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SeatMap, { SeatData } from '@/components/ui/SeatMap';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Toast, { ToastMessage } from '@/components/ui/Toast';

interface SeatSelectionPageProps {
  params: Promise<{ id: string }>;
}

interface ScreeningDetail {
  id: number;
  room: string;
  roomNumber?: number;
  date: string;
  startTime: string;
  endTime?: string;
  price: number;
  movie: {
    id: number;
    title: string;
    poster: string;
    duration: number;
    genre: string;
    ageRating?: string;
  };
}

interface SeatsApiRawResponse {
  success: boolean;
  data?: {
    screening: {
      id: number;
      room: string;
      movieTitle: string;
    };
    stats: {
      total: number;
      empty: number;
      reserved: number;
      occupied: number;
      released_expired: number;
    };
    seats: SeatData[];
  };
  message?: string;
  error?: string;
  code?: string;
}

interface ScreeningApiRawResponse {
  success: boolean;
  data?: {
    id: number;
    movieId: number;
    room: string;
    roomNumber: number;
    startTime: string;
    endTime: string;
    date: string;
    price: string | number;
    movie: {
      id: number;
      title: string;
      slug: string;
      poster: string;
      duration: number;
      genre: string;
      rating?: number;
      ageRating?: string;
    };
  };
  message?: string;
  error?: string;
}

interface ReserveApiResponse {
  success: boolean;
  data?: {
    screening_id: number;
    reserved_count: number;
    reserved_until: string;
    hold_duration_minutes: number;
    seats: Array<{
      id: number;
      code: string;
      row: string;
      number: number;
      type: string;
    }>;
  };
  message?: string;
  error?: string;
  code?: string;
}

const STEPS = ['Chọn ghế', 'Loại vé', 'Combo & Thanh toán', 'Xác nhận'];
const MAX_SEATS = 8;
const HOLD_TIME_SECONDS = 600; // 10 minutes

export default function SeatSelectionPage({ params }: SeatSelectionPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const screeningId = parseInt(resolvedParams.id, 10);

  // States
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [screening, setScreening] = useState<ScreeningDetail | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [seatTicketTypes, setSeatTicketTypes] = useState<Record<number, 'Thường' | 'Trẻ em'>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [_isHoldActive, setIsHoldActive] = useState<boolean>(false);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helpers
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Xử lý hết thời gian 10 phút chọn / giữ chỗ ghế
  const handleHoldExpire = useCallback(() => {
    showToast('Thời gian chọn ghế (10 phút) đã hết hạn! Đang chuyển về trang chủ...', 'warning');
    setIsHoldActive(false);
    setReservedUntil(null);
    setSelectedSeatIds([]);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('lumi_booking_reservation');
    }
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router, showToast]);

  // Fetch seats data from API with Lazy Evaluation
  const fetchSeats = useCallback(async () => {
    if (isNaN(screeningId) || screeningId <= 0) return;

    try {
      const res = await fetch(`/api/seats?screening_id=${screeningId}`);
      const json: SeatsApiRawResponse = await res.json();

      if (json.success && json.data) {
        setSeats(json.data.seats);
        if (json.data.stats && json.data.stats.released_expired > 0) {
          showToast(
            `Hệ thống vừa tự động giải phóng ${json.data.stats.released_expired} ghế đã hết hạn giữ chỗ.`,
            'info'
          );
        }
      } else {
        showToast(json.error || json.message || 'Không thể tải danh sách ghế', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi fetch ghế:', err);
      showToast('Lỗi mạng khi tải danh sách ghế', 'error');
    }
  }, [screeningId, showToast]);

  // Fetch screening & movie details
  const fetchScreeningDetails = useCallback(async () => {
    if (isNaN(screeningId) || screeningId <= 0) return;

    try {
      const res = await fetch(`/api/screenings/${screeningId}`);
      const json: ScreeningApiRawResponse = await res.json();

      if (json.success && json.data) {
        const item = json.data;
        const numericPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);

        setScreening({
          id: item.id,
          room: item.room,
          roomNumber: item.roomNumber,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          price: isNaN(numericPrice) ? 95000 : numericPrice,
          movie: {
            id: item.movie.id,
            title: item.movie.title,
            poster: item.movie.poster,
            duration: item.movie.duration,
            genre: item.movie.genre,
            ageRating: item.movie.ageRating,
          },
        });
      }
    } catch (err) {
      console.error('Lỗi khi fetch thông tin suất chiếu:', err);
    }
  }, [screeningId]);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      await Promise.all([fetchSeats(), fetchScreeningDetails()]);
      if (isMounted) setIsLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchSeats, fetchScreeningDetails]);

  // Đồng bộ trạng thái giữ chỗ từ sessionStorage nếu còn hiệu lực
  useEffect(() => {
    if (typeof window !== 'undefined' && screeningId && !isNaN(screeningId)) {
      const stored = window.sessionStorage.getItem('lumi_booking_reservation');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.screeningId === screeningId && data.reservedUntil) {
            const expTime = new Date(data.reservedUntil).getTime();
            if (expTime > Date.now()) {
              setReservedUntil(data.reservedUntil);
              setIsHoldActive(true);
              if (Array.isArray(data.seatIds) && data.seatIds.length > 0) {
                setSelectedSeatIds(data.seatIds);
              }
              if (data.seatTicketTypes) {
                setSeatTicketTypes(data.seatTicketTypes);
              }
            } else {
              window.sessionStorage.removeItem('lumi_booking_reservation');
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }, [screeningId]);

  // Selected seats objects
  const selectedSeatsList = useMemo(() => {
    return seats.filter(s => selectedSeatIds.includes(s.id));
  }, [seats, selectedSeatIds]);

  // Kiểm tra nhãn độ tuổi phim: Phim T18 khóa vé Trẻ em theo BR-02
  const isAdultOnly = useMemo(() => {
    return screening?.movie.ageRating ? /18/i.test(screening.movie.ageRating) : false;
  }, [screening?.movie.ageRating]);

  // Price calculation
  const basePrice = screening?.price || 95000;

  const calculateSeatPrice = useCallback(
    (seat: SeatData): number => {
      const type = seatTicketTypes[seat.id] || 'Thường';
      if (type === 'Trẻ em' && !isAdultOnly) {
        return Math.round(basePrice * 0.5);
      }
      return basePrice;
    },
    [basePrice, seatTicketTypes, isAdultOnly]
  );

  const totalPrice = useMemo(() => {
    return selectedSeatsList.reduce((acc, seat) => acc + calculateSeatPrice(seat), 0);
  }, [selectedSeatsList, calculateSeatPrice]);

  // Toggle seat selection
  const handleToggleSeat = useCallback((seat: SeatData) => {
    if (seat.status === 'OCCUPIED') {
      showToast(`Ghế ${seat.code} đã được thanh toán, vui lòng chọn ghế khác.`, 'warning');
      return;
    }
    if (seat.status === 'RESERVED') {
      showToast(`Ghế ${seat.code} đang có người giữ chỗ tạm thời.`, 'warning');
      return;
    }

    setSelectedSeatIds(prev => {
      if (prev.includes(seat.id)) {
        setSeatTicketTypes(types => {
          const next = { ...types };
          delete next[seat.id];
          return next;
        });
        return prev.filter(id => id !== seat.id);
      }
      if (prev.length >= MAX_SEATS) {
        showToast(`Bạn chỉ có thể chọn tối đa ${MAX_SEATS} ghế trong một lần đặt.`, 'warning');
        return prev;
      }
      return [...prev, seat.id];
    });
  }, [showToast]);

  // Toggle loại vé cho ghế cụ thể
  const handleSetSeatTicketType = useCallback((seatId: number, type: 'Thường' | 'Trẻ em') => {
    setSeatTicketTypes(prev => ({
      ...prev,
      [seatId]: type,
    }));
  }, []);

  // Reserve seats handler
  const handleReserveSeats = async () => {
    if (selectedSeatIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một ghế để tiếp tục.', 'warning');
      return;
    }

    setIsReserving(true);

    try {
      const response = await fetch('/api/seats/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screening_id: screeningId,
          seat_ids: selectedSeatIds,
        }),
      });

      const result: ReserveApiResponse = await response.json();

      if (!response.ok || !result.success) {
        const isConflict =
          result.code === 'SEAT_ALREADY_RESERVED' ||
          result.code === 'E-03' ||
          (result.message && result.message.includes('E-03')) ||
          (result.message && result.message.includes('đã có người giữ chỗ'));

        if (isConflict) {
          showToast(
            result.message || 'Lỗi [E-03]: Ghế bạn vừa chọn đã có người giữ trước. Vui lòng chọn ghế khác!',
            'error'
          );
        } else {
          showToast(result.error || result.message || 'Không thể giữ chỗ ghế. Vui lòng thử lại.', 'error');
        }

        await fetchSeats();
        return;
      }

      // Tổng hợp danh sách loại vé đã chọn
      const adultSeats = selectedSeatsList.filter(
        s => (seatTicketTypes[s.id] || 'Thường') === 'Thường' || isAdultOnly
      );
      const childSeats = isAdultOnly
        ? []
        : selectedSeatsList.filter(s => seatTicketTypes[s.id] === 'Trẻ em');

      const ticketItemsPayload = [
        ...(adultSeats.length > 0
          ? [
              {
                type: 'Thường',
                quantity: adultSeats.length,
                unit_price: basePrice,
                total_price: adultSeats.length * basePrice,
              },
            ]
          : []),
        ...(childSeats.length > 0
          ? [
              {
                type: 'Trẻ em',
                quantity: childSeats.length,
                unit_price: Math.round(basePrice * 0.5),
                total_price: childSeats.length * Math.round(basePrice * 0.5),
              },
            ]
          : []),
      ];

      showToast('Giữ chỗ thành công! Bạn có 10 phút để chọn combo và thanh toán.', 'success');
      setIsHoldActive(true);
      if (result.data?.reserved_until) {
        setReservedUntil(result.data.reserved_until);
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'lumi_booking_reservation',
          JSON.stringify({
            screeningId,
            seatIds: selectedSeatIds,
            seatCodes: selectedSeatsList.map(s => s.code),
            ticketItems: ticketItemsPayload,
            seatTicketTypes,
            totalPrice,
            reservedUntil: result.data?.reserved_until,
          })
        );
        window.sessionStorage.setItem(
          'lumi_ticket_items',
          JSON.stringify(ticketItemsPayload)
        );
      }

      setTimeout(() => {
        router.push(
          `/screenings/${screeningId}/checkout/combo?seats=${selectedSeatIds.join(',')}&codes=${selectedSeatsList.map(s => s.code).join(',')}`
        );
      }, 1000);
    } catch (err) {
      console.error('Lỗi khi gọi API reserve seats:', err);
      showToast('Lỗi kết nối máy chủ khi giữ chỗ. Vui lòng thử lại.', 'error');
    } finally {
      setIsReserving(false);
    }
  };

  // Format date helper
  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return 'Hôm nay';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Format time helper
  const formatTimeDisplay = (timeString?: string) => {
    if (!timeString) return '';
    try {
      const d = new Date(timeString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } catch {
      // timeString may already be formatted
    }
    return timeString;
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#F8FAFC] py-8 font-sans selection:bg-[#E11D48] selection:text-white">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  i === 0
                    ? 'bg-gradient-to-r from-[#E11D48] to-[#881337] text-white shadow-[0_0_15px_rgba(225,29,72,0.5)] border border-rose-500/40'
                    : 'bg-[rgba(18,14,28,0.7)] text-[#94A3B8] border border-[rgba(192,132,252,0.15)]'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/20"
                >
                  {i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-slate-600">→</span>}
            </div>
          ))}
        </div>

        {/* Movie Header Card */}
        {screening && (
          <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 mb-8 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-[#0A0812] flex-shrink-0 border border-[rgba(192,132,252,0.25)]">
                  {screening.movie.poster ? (
                    <img
                      src={screening.movie.poster}
                      alt={screening.movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-400 font-bold">
                      ✦
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs bg-[#E11D48] text-white px-2 py-0.5 rounded-md font-bold shadow-sm">
                      {screening.movie.ageRating || 'P'}
                    </span>
                    <span className="text-xs text-[#94A3B8]">{screening.movie.genre}</span>
                    <span className="text-xs text-slate-500">• {screening.movie.duration} phút</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] leading-tight">
                    {screening.movie.title}
                  </h1>

                  <div className="flex items-center gap-3 sm:gap-6 mt-2 text-xs sm:text-sm text-[#94A3B8] flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span>Ngày:</span>
                      <strong className="text-[#F8FAFC]">{formatDateDisplay(screening.date)}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>Suất:</span>
                      <strong className="text-[#FDA4AF] font-bold">{formatTimeDisplay(screening.startTime)}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>Phòng:</span>
                      <strong className="text-[#F8FAFC]">{screening.room}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown Timer (Đồng hồ cát xoay vũ trụ) */}
              <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[rgba(192,132,252,0.15)]">
                <CountdownTimer
                  targetTime={reservedUntil}
                  initialSeconds={HOLD_TIME_SECONDS}
                  isActive={true}
                  label="Thời gian giữ chỗ"
                  onExpire={handleHoldExpire}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-16 text-center backdrop-blur-xl">
            {/* Loading với đồng hồ cát xoay */}
            <div className="hourglass-spin text-3xl mb-3">⏳</div>
            <p className="text-[#F8FAFC] font-semibold">Đang tải sơ đồ ghế phòng chiếu...</p>
            <p className="text-[#94A3B8] text-xs mt-1">Đang kiểm tra và giải phóng ghế hết hạn theo thời gian thực</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Seat Map Left Column */}
            <div className="lg:col-span-2">
              <div className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">
                <SeatMap
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={handleToggleSeat}
                />
              </div>
            </div>

            {/* Right Sidebar: Selected seats & Checkout CTA */}
            <div className="lg:col-span-1">
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-6 shadow-xl sticky top-6 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-[rgba(192,132,252,0.15)]">
                  <h3 className="text-[#F8FAFC] font-bold text-lg flex items-center gap-2">
                    <span>Ghế đã chọn</span>
                    <Badge variant="gold">{selectedSeatIds.length}/{MAX_SEATS}</Badge>
                  </h3>
                  {selectedSeatIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSeatIds([])}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Empty State or Selected Seats List */}
                {selectedSeatsList.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-300 font-bold">
                      ✦
                    </div>
                    <p className="text-[#F8FAFC] font-medium text-sm">Chưa có ghế nào được chọn</p>
                    <p className="text-[#94A3B8] text-xs mt-1 max-w-[220px] mx-auto">
                      Nhấn vào các ghế trống trên sơ đồ bên trái để tiến hành chọn chỗ ngồi
                    </p>
                  </div>
                ) : (
                  <div className="py-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedSeatsList.map(seat => {
                      const price = calculateSeatPrice(seat);
                      const currentType = isAdultOnly ? 'Thường' : (seatTicketTypes[seat.id] || 'Thường');
                      return (
                        <div
                          key={seat.id}
                          className="flex items-center justify-between bg-[rgba(15,11,26,0.8)] border border-[rgba(192,132,252,0.2)] rounded-xl px-3.5 py-2.5 transition-all hover:border-[rgba(192,132,252,0.4)]"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                            <span className="w-8 h-8 bg-gradient-to-tr from-[#E11D48] to-[#881337] rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md shrink-0 border border-rose-500/40">
                              {seat.code}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#F8FAFC] text-sm font-bold">Ghế {seat.code}</span>
                                {isAdultOnly ? (
                                  <span className="text-[10px] bg-rose-950/60 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/40">
                                    Khóa T18
                                  </span>
                                ) : currentType === 'Trẻ em' ? (
                                  <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-700/40">
                                    Trẻ em
                                  </span>
                                ) : null}
                              </div>
                              
                              {/* Nút chọn loại vé cho từng ghế */}
                              <div className="mt-1 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetSeatTicketType(seat.id, 'Thường')}
                                  className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                                    currentType === 'Thường'
                                      ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white shadow'
                                      : 'bg-[rgba(18,14,28,0.7)] text-[#94A3B8] hover:text-white border border-[rgba(192,132,252,0.15)]'
                                  }`}
                                >
                                  Người lớn
                                </button>
                                <button
                                  type="button"
                                  disabled={isAdultOnly}
                                  title={isAdultOnly ? 'Phim T18 không áp dụng vé Trẻ em theo BR-02' : 'Giảm 50% cho trẻ em'}
                                  onClick={() => handleSetSeatTicketType(seat.id, 'Trẻ em')}
                                  className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                                    isAdultOnly
                                      ? 'opacity-30 cursor-not-allowed bg-[rgba(18,14,28,0.4)] text-slate-600'
                                      : currentType === 'Trẻ em'
                                      ? 'bg-indigo-600 text-white shadow'
                                      : 'bg-[rgba(18,14,28,0.7)] text-[#94A3B8] hover:text-white border border-[rgba(192,132,252,0.15)]'
                                  }`}
                                >
                                  Trẻ em (-50%)
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[#FDA4AF] text-sm font-bold">
                              {price.toLocaleString('vi-VN')}đ
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleSeat(seat)}
                              aria-label={`Xóa ghế ${seat.code}`}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Calculation Summary */}
                <div className="border-t border-[rgba(192,132,252,0.15)] pt-4 mt-2 space-y-2">
                  <div className="flex justify-between text-sm text-[#94A3B8]">
                    <span>Số lượng ghế:</span>
                    <span className="text-[#F8FAFC] font-bold">{selectedSeatIds.length} ghế</span>
                  </div>

                  {/* Phân loại vé Người lớn & Trẻ em */}
                  {selectedSeatIds.length > 0 && (
                    <div className="bg-[rgba(15,11,26,0.8)] rounded-xl p-2.5 space-y-1 text-xs border border-[rgba(192,132,252,0.15)]">
                      <div className="flex justify-between text-[#94A3B8]">
                        <span>Vé Người lớn (100%):</span>
                        <span className="text-[#F8FAFC] font-medium">
                          {selectedSeatsList.filter(s => (isAdultOnly || (seatTicketTypes[s.id] || 'Thường') === 'Thường')).length} vé
                        </span>
                      </div>
                      {!isAdultOnly && selectedSeatsList.some(s => seatTicketTypes[s.id] === 'Trẻ em') && (
                        <div className="flex justify-between text-indigo-300">
                          <span>Vé Trẻ em (50%):</span>
                          <span className="font-semibold">
                            {selectedSeatsList.filter(s => seatTicketTypes[s.id] === 'Trẻ em').length} vé
                          </span>
                        </div>
                      )}
                      {isAdultOnly && (
                        <p className="text-[11px] text-amber-300/80 pt-0.5">
                          ✦ Phim nhãn T18: Áp dụng 100% vé Người lớn
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-[rgba(192,132,252,0.12)]">
                    <span className="text-[#F8FAFC] font-bold">Tạm tính:</span>
                    <span className="text-2xl font-black text-[#F8FAFC]">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Proceed Button */}
                <div className="mt-6">
                  <Button
                    fullWidth
                    disabled={selectedSeatIds.length === 0 || isReserving}
                    onClick={handleReserveSeats}
                    className="h-12 text-base font-bold shadow-[0_0_20px_rgba(225,29,72,0.45)] flex items-center justify-center gap-2"
                  >
                    {isReserving ? (
                      <>
                        <span className="hourglass-spin text-base">⏳</span>
                        <span>Đang giữ chỗ 10 phút...</span>
                      </>
                    ) : (
                      <span>Tiếp tục chọn loại vé →</span>
                    )}
                  </Button>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href={`/movies/${screening?.movie.id || ''}`}
                    className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                  >
                    ← Quay lại chi tiết phim
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
