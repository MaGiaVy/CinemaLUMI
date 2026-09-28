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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helpers
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

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

  // Selected seats objects
  const selectedSeatsList = useMemo(() => {
    return seats.filter(s => selectedSeatIds.includes(s.id));
  }, [seats, selectedSeatIds]);

  // Price calculation
  const basePrice = screening?.price || 95000;

  const calculateSeatPrice = useCallback((_seat: SeatData): number => {
    return basePrice;
  }, [basePrice]);

  const totalPrice = useMemo(() => {
    return selectedSeatsList.length * basePrice;
  }, [selectedSeatsList, basePrice]);

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
        return prev.filter(id => id !== seat.id);
      }
      if (prev.length >= MAX_SEATS) {
        showToast(`Bạn chỉ có thể chọn tối đa ${MAX_SEATS} ghế trong một lần đặt.`, 'warning');
        return prev;
      }
      return [...prev, seat.id];
    });
  }, [showToast]);

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
        // Xử lý lỗi ghế bị người khác giành mất (E-03 / SEAT_ALREADY_RESERVED)
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

        // Tự động làm mới danh sách ghế để loại bỏ ghế xung đột
        await fetchSeats();
        return;
      }

      // Giữ chỗ thành công
      showToast('Giữ chỗ thành công! Bạn có 10 phút để chọn loại vé và thanh toán.', 'success');
      setIsHoldActive(true);

      // Lưu thông tin giữ chỗ vào sessionStorage để phục vụ các bước tiếp theo
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'lumi_booking_reservation',
          JSON.stringify({
            screeningId,
            seatIds: selectedSeatIds,
            seatCodes: selectedSeatsList.map(s => s.code),
            totalPrice,
            reservedUntil: result.data?.reserved_until,
          })
        );
      }

      // Chuyển hướng sang trang chọn loại vé / thanh toán
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
      // timeString may already be "18:30"
    }
    return timeString;
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] py-8">
      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  i === 0
                    ? 'bg-[#E63946] text-white shadow-lg shadow-[#E63946]/30'
                    : 'bg-[#2D2D2D] text-[#808080] border border-[#404040]'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#404040]">→</span>}
            </div>
          ))}
        </div>

        {/* Movie Header Card */}
        {screening && (
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-5 mb-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-[#1A1A1A] flex-shrink-0 border border-[#404040]">
                  {screening.movie.poster ? (
                    <img
                      src={screening.movie.poster}
                      alt={screening.movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs bg-[#E63946] text-white px-2 py-0.5 rounded font-bold">
                      {screening.movie.ageRating || 'P'}
                    </span>
                    <span className="text-xs text-[#B3B3B3]">{screening.movie.genre}</span>
                    <span className="text-xs text-[#808080]">• {screening.movie.duration} phút</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {screening.movie.title}
                  </h1>

                  <div className="flex items-center gap-3 sm:gap-6 mt-2 text-xs sm:text-sm text-[#B3B3B3] flex-wrap">
                    <span className="flex items-center gap-1">
                      📅 <strong className="text-white">{formatDateDisplay(screening.date)}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      🕐 Suất: <strong className="text-[#FFB703] font-bold">{formatTimeDisplay(screening.startTime)}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      🎭 Phòng: <strong className="text-white">{screening.room}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[#404040]">
                <CountdownTimer
                  initialSeconds={HOLD_TIME_SECONDS}
                  isActive={isHoldActive}
                  label={isHoldActive ? 'Thời gian giữ chỗ còn lại' : 'Thời gian giữ chỗ'}
                  onExpire={() => {
                    showToast('Đã hết 10 phút giữ chỗ. Các ghế đã được tự động giải phóng.', 'error');
                    setIsHoldActive(false);
                    setSelectedSeatIds([]);
                    fetchSeats();
                  }}
                />
                {!isHoldActive && (
                  <span className="text-[11px] text-[#808080] mt-1">
                    Đếm ngược 10 phút sau khi nhấn Tiếp tục
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#FFB703] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-semibold">Đang tải sơ đồ ghế phòng chiếu...</p>
            <p className="text-[#808080] text-xs mt-1">Áp dụng Lazy Evaluation dọn dẹp các ghế hết hạn</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Seat Map Left Column */}
            <div className="lg:col-span-2">
              <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 sm:p-8 shadow-xl">
                <SeatMap
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={handleToggleSeat}
                />
              </div>
            </div>

            {/* Right Sidebar: Selected seats & Checkout CTA */}
            <div className="lg:col-span-1">
              <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 shadow-xl sticky top-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#404040]">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span>Ghế đã chọn</span>
                    <Badge variant="gold">{selectedSeatIds.length}/{MAX_SEATS}</Badge>
                  </h3>
                  {selectedSeatIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSeatIds([])}
                      className="text-xs text-[#E63946] hover:underline"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Empty State or Selected Seats List */}
                {selectedSeatsList.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-4xl mb-3">🪑</p>
                    <p className="text-white font-medium text-sm">Chưa có ghế nào được chọn</p>
                    <p className="text-[#808080] text-xs mt-1 max-w-[220px] mx-auto">
                      Nhấn vào các ghế trống trên sơ đồ bên trái để tiến hành chọn chỗ ngồi
                    </p>
                  </div>
                ) : (
                  <div className="py-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedSeatsList.map(seat => {
                      const price = calculateSeatPrice(seat);
                      return (
                        <div
                          key={seat.id}
                          className="flex items-center justify-between bg-[#383838] border border-[#484848] rounded-xl px-3.5 py-2.5 transition-all hover:border-[#FFB703]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#FFB703] rounded-lg flex items-center justify-center text-[#1A1A1A] font-black text-xs shadow-md">
                              {seat.code}
                            </span>
                            <div>
                              <div className="text-white text-sm font-bold">Ghế {seat.code}</div>
                              <span className="text-[11px] text-[#A0A0A0]">
                                Ghế tiêu chuẩn
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[#FFB703] text-sm font-bold">
                              {price.toLocaleString('vi-VN')}đ
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleSeat(seat)}
                              aria-label={`Xóa ghế ${seat.code}`}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[#808080] hover:text-[#E63946] hover:bg-[#E63946]/10 transition-colors"
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
                <div className="border-t border-[#404040] pt-4 mt-2 space-y-2.5">
                  <div className="flex justify-between text-sm text-[#B3B3B3]">
                    <span>Số lượng ghế:</span>
                    <span className="text-white font-bold">{selectedSeatIds.length} ghế</span>
                  </div>

                  <div className="flex justify-between text-sm text-[#B3B3B3]">
                    <span>Giá vé cơ bản:</span>
                    <span className="text-white font-medium">{basePrice.toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-[#383838]">
                    <span className="text-white font-bold">Tạm tính:</span>
                    <span className="text-2xl font-black text-[#FFB703]">
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
                    className="h-12 text-base font-bold shadow-lg shadow-[#E63946]/30 flex items-center justify-center gap-2"
                  >
                    {isReserving ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                    className="text-xs text-[#808080] hover:text-white transition-colors"
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
