'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Toast, { ToastMessage } from '@/components/ui/Toast';

interface MovieData {
  id: number;
  title: string;
  slug?: string;
  poster: string;
  duration?: number;
  genre?: string;
  rating?: number;
  ageRating?: string;
}

interface ScreeningDetails {
  id: number;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  movie: MovieData;
}

interface ValidatedCouponData {
  coupon_id: number;
  code: string;
  discount_type: 'Percentage' | 'FixedAmount';
  discount_value: number;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  min_amount: number;
  applicable_movie_id: number | null;
  movie?: {
    id: number;
    title: string;
    poster: string;
  } | null;
}

const PAYMENT_METHODS = [
  {
    id: 'vnpay',
    label: 'VNPAY-QR',
    icon: '💳',
    description: 'Thanh toán quét mã QR qua ứng dụng ngân hàng hoặc VNPAY',
  },
  {
    id: 'momo',
    label: 'Ví điện tử MoMo',
    icon: '📱',
    description: 'Thanh toán trực tiếp qua ứng dụng ví MoMo',
  },
  {
    id: 'banking',
    label: 'Chuyển khoản Ngân hàng',
    icon: '🏦',
    description: 'Chuyển khoản 24/7 với mã QR tự động nhận diện',
  },
];

interface ReservedComboItem {
  reservation_id: number;
  combo_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const screeningId = useMemo(() => {
    const rawId = params?.id;
    return typeof rawId === 'string' ? parseInt(rawId, 10) : 0;
  }, [params]);

  // States
  const [screening, setScreening] = useState<ScreeningDetails | null>(null);
  const [selectedSeatCodes, setSelectedSeatCodes] = useState<string[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [reservedCombos, setReservedCombos] = useState<ReservedComboItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('vnpay');

  // Coupon States
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCouponData | null>(null);

  // Payment status
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [orderCode, setOrderCode] = useState<string>('');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch Screening Details & Retrieve Selected Seats
  useEffect(() => {
    if (!screeningId || isNaN(screeningId)) return;

    let isMounted = true;

    async function loadCheckoutData() {
      try {
        setIsLoading(true);

        // 1. Lấy thông tin ghế từ Query params hoặc sessionStorage
        const seatsParam = searchParams.get('seats');
        const codesParam = searchParams.get('codes');

        let parsedIds: number[] = [];
        let parsedCodes: string[] = [];

        if (seatsParam && codesParam) {
          parsedIds = seatsParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
          parsedCodes = codesParam.split(',').filter(Boolean);
        } else if (typeof window !== 'undefined') {
          const stored = window.sessionStorage.getItem('lumi_booking_reservation');
          if (stored) {
            try {
              const resData = JSON.parse(stored);
              if (resData.screeningId === screeningId) {
                parsedIds = resData.seatIds || [];
                parsedCodes = resData.seatCodes || [];
              }
            } catch (err) {
              console.error('Lỗi khi đọc session reservation:', err);
            }
          }
        }

        // Nếu không có ghế nào, đặt mặc định 1 ghế mô phỏng hoặc cảnh báo
        if (parsedCodes.length === 0) {
          parsedCodes = ['A1'];
          parsedIds = [1];
        }

        if (isMounted) {
          setSelectedSeatIds(parsedIds);
          setSelectedSeatCodes(parsedCodes);
        }

        // 2. Lấy thông tin combo đã giữ chỗ từ sessionStorage nếu có
        if (typeof window !== 'undefined') {
          const comboStored = window.sessionStorage.getItem('lumi_combo_reservation');
          if (comboStored) {
            try {
              const resCombo = JSON.parse(comboStored);
              if (resCombo.screeningId === screeningId && Array.isArray(resCombo.items)) {
                if (isMounted) setReservedCombos(resCombo.items);
              }
            } catch (err) {
              console.error('Lỗi khi đọc session combo reservation:', err);
            }
          }
        }

        // 3. Fetch screening info
        const res = await fetch(`/api/screenings/${screeningId}`);
        const data = await res.json();

        if (res.ok && data.success && data.data) {
          if (isMounted) {
            setScreening({
              id: data.data.id,
              room: data.data.room,
              date: data.data.date,
              startTime: data.data.startTime || data.data.start_time,
              endTime: data.data.endTime || data.data.end_time,
              price: Number(data.data.price) || 95000,
              movie: data.data.movie,
            });
          }
        } else {
          throw new Error(data.message || 'Không tìm thấy thông tin suất chiếu');
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu thanh toán:', err);
        showToast(err instanceof Error ? err.message : 'Lỗi khi tải thông tin suất chiếu', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCheckoutData();

    return () => {
      isMounted = false;
    };
  }, [screeningId, searchParams, showToast]);

  // Base & Final Prices calculation
  const ticketBasePrice = screening?.price || 95000;
  const ticketSubtotal = useMemo(() => {
    return (selectedSeatCodes.length || 1) * ticketBasePrice;
  }, [selectedSeatCodes.length, ticketBasePrice]);

  const combosSubtotal = useMemo(() => {
    return reservedCombos.reduce(
      (sum, item) => sum + (item.total_price || item.unit_price * item.quantity),
      0
    );
  }, [reservedCombos]);

  const originalTotal = useMemo(() => {
    return ticketSubtotal + combosSubtotal;
  }, [ticketSubtotal, combosSubtotal]);

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const finalTotal = Math.max(0, originalTotal - discountAmount);

  // Áp dụng mã giảm giá qua POST /api/coupons/validate
  const handleApplyCoupon = async () => {
    const code = couponCodeInput.trim().toUpperCase();

    if (!code) {
      showToast('Vui lòng nhập mã giảm giá', 'warning');
      return;
    }

    try {
      setIsValidatingCoupon(true);

      const payload = {
        coupon_code: code,
        total_amount: originalTotal,
        movie_id: screening?.movie?.id || undefined,
      };

      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        // Lỗi mã sai / hết hạn / không đạt điều kiện
        const errMsg = result.error || result.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
        showToast(errMsg, 'error');
        setAppliedCoupon(null);
        return;
      }

      // Áp dụng thành công
      setAppliedCoupon(result.data);
      showToast(result.message || `Đã áp dụng mã giảm giá '${code}' thành công!`, 'success');
    } catch (err) {
      console.error('Lỗi khi gọi API validate coupon:', err);
      showToast('Không thể kết nối đến máy chủ để kiểm tra mã giảm giá', 'error');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Hủy bỏ mã giảm giá đã áp dụng
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    showToast('Đã gỡ bỏ mã giảm giá', 'info');
  };

  // Xử lý hết hạn 10 phút giữ ghế
  const handleHoldExpire = () => {
    showToast('Thời gian giữ chỗ đã hết hạn! Vui lòng chọn lại ghế.', 'warning');
    setTimeout(() => {
      router.push(`/screenings/${screeningId}/seats`);
    }, 2500);
  };

  // Xác nhận thanh toán
  const handleConfirmPayment = async () => {
    try {
      setIsProcessingPayment(true);

      const payload = {
        screening_id: screeningId,
        seat_ids: selectedSeatIds,
        combo_items: reservedCombos.map(item => ({
          combo_id: item.combo_id,
          quantity: item.quantity,
        })),
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        payment_method: paymentMethod,
      };

      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || result.message || 'Khởi tạo thanh toán thất bại');
      }

      const paymentData = result.data;
      setOrderCode(paymentData.transaction_code || `LMC-${paymentData.payment_id}`);

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('lumi_booking_reservation');
        window.sessionStorage.removeItem('lumi_combo_reservation');
      }

      showToast('Đang chuyển hướng đến cổng thanh toán VNPay...', 'info');

      if (paymentData.vnpay_url) {
        setTimeout(() => {
          router.push(paymentData.vnpay_url);
        }, 500);
      } else {
        setIsPaymentSuccess(true);
      }
    } catch (err) {
      console.error('Lỗi thanh toán:', err);
      showToast(err instanceof Error ? err.message : 'Thanh toán thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Màn hình Thanh Toán Thành Công
  if (isPaymentSuccess) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6 text-white">
        <Toast toasts={toasts} onRemove={removeToast} />
        <div className="max-w-md w-full bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-[#2ECC71]/20 border-2 border-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-[#2ECC71] text-4xl font-black">✓</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            Thanh Toán Thành Công!
          </h1>
          <p className="text-[#B3B3B3] text-sm mb-6">
            Vé điện tử của bạn đã được xuất thành công và sẵn sàng để vào rạp chiếu.
          </p>

          {/* QR Code Vé */}
          <div className="bg-[#1E1E1E] border border-[#404040] rounded-xl p-6 mb-6">
            <div className="w-36 h-36 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center p-2 shadow-inner">
              <div className="grid grid-cols-5 gap-1 w-full h-full">
                {Array.from({ length: 25 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-[2px]"
                    style={{ background: (i % 3 === 0 || i % 7 === 0 || i === 0 || i === 24) ? '#111' : '#f0f0f0' }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[#B3B3B3] text-xs uppercase tracking-wider mb-1">Mã Vé Điện Tử</p>
            <p className="text-[#FFB703] font-mono font-bold text-xl tracking-wider">{orderCode}</p>
          </div>

          {/* Chi tiết đơn */}
          <div className="bg-[#242424] border border-[#383838] rounded-xl p-4 text-left mb-6 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Phim:</span>
              <span className="text-white font-semibold truncate max-w-[200px]">
                {screening?.movie?.title || 'Phim rạp Lumi'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Phòng chiếu:</span>
              <span className="text-white font-medium">{screening?.room}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Ghế ngồi:</span>
              <span className="text-[#FFB703] font-bold">
                {selectedSeatCodes.join(', ')}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-xs text-[#2ECC71]">
                <span>Khuyến mãi ({appliedCoupon.code}):</span>
                <span>-{appliedCoupon.discount_amount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#404040] pt-2 font-bold text-base">
              <span className="text-white">Tổng tiền đã thanh toán:</span>
              <span className="text-[#2ECC71]">
                {finalTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push('/')}
            >
              Trang chủ
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push(`/screenings/${screeningId}/seats`)}
            >
              Đặt suất khác
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#333]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => router.push(`/screenings/${screeningId}/seats`)}
                className="text-[#B3B3B3] hover:text-white text-sm font-semibold transition-colors flex items-center gap-1"
              >
                ← Quay lại chọn ghế
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Thanh Toán Đơn Đặt Vé
            </h1>
          </div>

          {/* Countdown Timer (10 phút giữ ghế) */}
          <div className="flex items-center bg-[#242424] border border-[#404040] px-4 py-2 rounded-xl">
            <CountdownTimer
              initialSeconds={600}
              onExpire={handleHoldExpire}
              label="Thời gian giữ vé"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-[#B3B3B3]">
            <div className="w-10 h-10 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải thông tin đơn hàng và suất chiếu...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột trái: Phương thức thanh toán & Mã giảm giá */}
            <div className="lg:col-span-7 space-y-6">
              {/* Box Nhập Mã Giảm Giá */}
              <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <span className="text-xl">🎟️</span> Mã Giảm Giá / Khuyến Mãi
                  </h3>
                  {appliedCoupon && (
                    <Badge variant="green" size="sm">
                      Đã áp dụng
                    </Badge>
                  )}
                </div>

                {appliedCoupon ? (
                  /* Giao diện khi mã đã được áp dụng thành công */
                  <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#2ECC71] text-[#1A1A1A] flex items-center justify-center font-bold text-xs">
                          ✓
                        </span>
                        {/* Dòng chữ yêu cầu hiển thị màu xanh lá */}
                        <span className="text-[#2ECC71] font-bold text-sm sm:text-base">
                          Đã áp dụng mã giảm giá
                        </span>
                        <span className="font-mono font-black text-white bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#2ECC71]/40 text-xs">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-[#E63946] hover:text-white underline font-semibold transition-colors ml-2"
                      >
                        Hủy mã
                      </button>
                    </div>

                    <div className="text-xs text-[#B3B3B3] flex items-center justify-between pt-1 border-t border-[#2ECC71]/20">
                      <span>
                        Hình thức giảm:{' '}
                        {appliedCoupon.discount_type === 'Percentage'
                          ? `Giảm ${appliedCoupon.discount_value}%`
                          : 'Giảm tiền mặt'}
                      </span>
                      <span className="text-[#2ECC71] font-bold text-sm">
                        -{appliedCoupon.discount_amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Form nhập mã giảm giá */
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã khuyến mãi (VD: LUMI20)"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        disabled={isValidatingCoupon}
                        maxLength={50}
                        className="flex-1 bg-[#1E1E1E] border border-[#404040] rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-white uppercase placeholder-[#666] focus:outline-none focus:border-[#E63946] transition-colors"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCodeInput.trim()}
                        className="px-5 font-bold shadow-md"
                      >
                        {isValidatingCoupon ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang kiểm tra...</span>
                          </div>
                        ) : (
                          'Áp dụng'
                        )}
                      </Button>
                    </div>
                    <p className="text-[#888] text-xs mt-2">
                      * Nhập mã để nhận ưu đãi giảm giá theo phần trăm hoặc số tiền trực tiếp trên đơn vé.
                    </p>
                  </div>
                )}
              </div>

              {/* Box Phương Thức Thanh Toán */}
              <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 shadow-lg">
                <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                  <span className="text-xl">💳</span> Chọn Phương Thức Thanh Toán
                </h3>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map(m => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-start sm:items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#E63946] bg-[#E63946]/10 shadow-md'
                            : 'border-[#404040] bg-[#1E1E1E] hover:border-[#666]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={m.id}
                          checked={isSelected}
                          onChange={() => setPaymentMethod(m.id)}
                          className="hidden"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 transition-colors ${
                            isSelected ? 'border-[#E63946]' : 'border-[#666]'
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 bg-[#E63946] rounded-full" />}
                        </div>
                        <span className="text-2xl flex-shrink-0">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">{m.label}</p>
                          <p className="text-[#B3B3B3] text-xs mt-0.5">{m.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin tóm tắt Đơn hàng & Tổng tiền */}
            <div className="lg:col-span-5">
              <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 shadow-xl sticky top-6">
                <h3 className="text-white font-bold text-base mb-4 pb-3 border-b border-[#404040]">
                  Thông Tin Vé Đặt
                </h3>

                {/* Phim & Suất chiếu */}
                <div className="flex gap-4 mb-4 pb-4 border-b border-[#404040]">
                  {screening?.movie?.poster ? (
                    <div className="w-16 h-24 relative rounded-lg overflow-hidden flex-shrink-0 border border-[#404040]">
                      <Image
                        src={screening.movie.poster}
                        alt={screening.movie.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-24 bg-[#1E1E1E] rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      🎬
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm sm:text-base leading-snug line-clamp-2">
                      {screening?.movie?.title || 'Phim Lumi Cinema'}
                    </h4>
                    <p className="text-[#B3B3B3] text-xs mt-1.5">
                      📍 {screening?.room || 'Phòng 01'}
                    </p>
                    <p className="text-[#B3B3B3] text-xs mt-0.5">
                      📅 {screening?.date ? new Date(screening.date).toLocaleDateString('vi-VN') : ''}
                      {screening?.startTime ? ` • ${new Date(screening.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                  </div>
                </div>

                {/* Ghế đã chọn */}
                <div className="mb-4 pb-4 border-b border-[#404040]">
                  <div className="flex items-center justify-between text-xs text-[#B3B3B3] mb-2">
                    <span>Ghế đã chọn ({selectedSeatCodes.length} ghế):</span>
                    <span className="text-white font-medium">{ticketBasePrice.toLocaleString('vi-VN')} đ/vé</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeatCodes.map(code => (
                      <span
                        key={code}
                        className="bg-[#FFB703]/10 border border-[#FFB703]/30 text-[#FFB703] font-mono font-bold text-xs px-2.5 py-1 rounded"
                      >
                        Ghế {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tính toán tài chính */}
                <div className="space-y-2.5 text-sm mb-6">
                  <div className="flex justify-between text-[#B3B3B3]">
                    <span>Tạm tính tiền vé:</span>
                    <span className="text-white font-medium">
                      {ticketSubtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {/* Chi tiết combo bắp nước nếu có */}
                  {reservedCombos.length > 0 && (
                    <div className="border-t border-[#383838] pt-2 space-y-1.5">
                      <div className="flex justify-between text-xs text-[#888] font-semibold uppercase">
                        <span>Bắp nước:</span>
                        <span className="text-[#FFB703] font-bold">{combosSubtotal.toLocaleString('vi-VN')} đ</span>
                      </div>
                      {reservedCombos.map(item => (
                        <div key={item.reservation_id || item.combo_id} className="flex justify-between text-xs pl-2">
                          <span className="text-[#CCCCCC] truncate max-w-[180px]">
                            • {item.name} <strong className="text-white">× {item.quantity}</strong>
                          </span>
                          <span className="text-white font-medium">
                            {(item.total_price || item.unit_price * item.quantity).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chi tiết giảm giá nếu có Coupon */}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-[#2ECC71]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">Khuyến mãi ({appliedCoupon.code}):</span>
                      </div>
                      <span className="font-bold">
                        -{appliedCoupon.discount_amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="text-right">
                      {/* Dòng chữ xác nhận màu xanh lá trên màn hình */}
                      <p className="text-xs text-[#2ECC71] font-semibold">
                        ✓ Đã áp dụng mã giảm giá thành công
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-3 border-t border-[#404040]">
                    <span className="text-white font-bold text-base">Tổng thanh toán:</span>
                    <div className="text-right">
                      {appliedCoupon && (
                        <span className="line-through text-[#888888] text-sm block">
                          {originalTotal.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                      <span className="text-[#FFB703] font-black text-2xl tracking-tight">
                        {finalTotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút Xác Nhận Thanh Toán */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                  className="font-bold shadow-lg shadow-[#E63946]/20 py-3.5 text-base"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xử lý giao dịch...</span>
                    </div>
                  ) : (
                    `Xác nhận thanh toán • ${finalTotal.toLocaleString('vi-VN')} đ`
                  )}
                </Button>

                <p className="text-[#737373] text-[11px] text-center mt-3 leading-relaxed">
                  Nhấn &ldquo;Xác nhận thanh toán&rdquo; đồng nghĩa với việc bạn đồng ý với Điều khoản dịch vụ và Chính sách hoàn vé của Lumi Cinema.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
