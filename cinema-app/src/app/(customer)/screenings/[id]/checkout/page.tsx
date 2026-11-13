'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { QRCodeSVG } from 'qrcode.react';

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
    id: 'zalopay',
    label: 'Cổng thanh toán ZaloPay (Sandbox)',
    badge: 'Khuyên dùng',
    description: 'Thanh toán quét mã QR động hoặc chuyển hướng ứng dụng ZaloPay Sandbox',
  },
  {
    id: 'vnpay',
    label: 'VNPAY-QR',
    description: 'Thanh toán quét mã QR qua ứng dụng ngân hàng hoặc VNPAY',
  },
  {
    id: 'momo',
    label: 'Ví điện tử MoMo',
    description: 'Thanh toán trực tiếp qua ứng dụng ví MoMo',
  },
  {
    id: 'banking',
    label: 'Chuyển khoản Ngân hàng',
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
  const { data: session, status: authStatus } = useSession();

  const screeningId = useMemo(() => {
    const rawId = params?.id;
    return typeof rawId === 'string' ? parseInt(rawId, 10) : 0;
  }, [params]);

  // States
  const [screening, setScreening] = useState<ScreeningDetails | null>(null);
  const [selectedSeatCodes, setSelectedSeatCodes] = useState<string[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [reservedCombos, setReservedCombos] = useState<ReservedComboItem[]>([]);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('zalopay');

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

        const seatsParam = searchParams.get('seats');
        const codesParam = searchParams.get('codes');

        let parsedIds: number[] = [];
        let parsedCodes: string[] = [];

        if (seatsParam && codesParam) {
          parsedIds = seatsParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
          parsedCodes = codesParam.split(',').filter(Boolean);
        }

        if (typeof window !== 'undefined') {
          const stored = window.sessionStorage.getItem('lumi_booking_reservation');
          if (stored) {
            try {
              const resData = JSON.parse(stored);
              if (resData.screeningId === screeningId) {
                if (resData.reservedUntil) {
                  setReservedUntil(resData.reservedUntil);
                }
                if (parsedIds.length === 0 && resData.seatIds) {
                  parsedIds = resData.seatIds;
                }
                if (parsedCodes.length === 0 && resData.seatCodes) {
                  parsedCodes = resData.seatCodes;
                }
              }
            } catch (err) {
              console.error('Lỗi khi đọc session reservation:', err);
            }
          }
        }

        if (parsedCodes.length === 0) {
          parsedCodes = ['A1'];
          parsedIds = [1];
        }

        if (isMounted) {
          setSelectedSeatIds(parsedIds);
          setSelectedSeatCodes(parsedCodes);
        }

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
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem('lumi_booking_reservation');
      if (stored) {
        try {
          const resData = JSON.parse(stored);
          if (resData.screeningId === screeningId && resData.totalPrice) {
            return resData.totalPrice;
          }
        } catch {
          // ignore
        }
      }
    }
    return (selectedSeatCodes.length || 1) * ticketBasePrice;
  }, [selectedSeatCodes.length, ticketBasePrice, screeningId]);

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
        ticket_amount: ticketSubtotal,
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
        const errMsg = result.error || result.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
        showToast(errMsg, 'error');
        setAppliedCoupon(null);
        return;
      }

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

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    showToast('Đã gỡ bỏ mã giảm giá', 'info');
  };

  const handleHoldExpire = useCallback(() => {
    showToast('Thời gian giữ vé (10 phút) đã hết hạn! Đang chuyển về trang chủ...', 'warning');
    setReservedUntil(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('lumi_booking_reservation');
      window.sessionStorage.removeItem('lumi_combo_reservation');
      window.sessionStorage.removeItem('lumi_ticket_items');
    }
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router, showToast]);

  // Xác nhận thanh toán
  const handleConfirmPayment = async () => {
    if (authStatus === 'unauthenticated' || !session) {
      showToast('Vui lòng đăng nhập để tiến hành đặt vé trực tuyến. Đang chuyển hướng...', 'warning');
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      setTimeout(() => {
        router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      }, 1000);
      return;
    }

    try {
      setIsProcessingPayment(true);

      let ticketItemsPayload: Array<{ type: string; quantity: number }> | undefined = undefined;
      if (typeof window !== 'undefined') {
        const storedTickets = window.sessionStorage.getItem('lumi_ticket_items');
        if (storedTickets) {
          try {
            ticketItemsPayload = JSON.parse(storedTickets);
          } catch {
            // ignore
          }
        }
      }

      const payload = {
        screening_id: screeningId,
        seat_ids: selectedSeatIds,
        ticket_items: ticketItemsPayload,
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
        if (res.status === 401 || result.code === 'UNAUTHENTICATED') {
          showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.', 'warning');
          const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
          setTimeout(() => {
            router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
          }, 1000);
          return;
        }

        const errMsg = result.error || result.message || 'Khởi tạo thanh toán thất bại';
        showToast(errMsg, 'error');
        return;
      }

      const paymentData = result.data;
      setOrderCode(paymentData.transaction_code || `LMC-${paymentData.payment_id}`);

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('lumi_booking_reservation');
        window.sessionStorage.removeItem('lumi_combo_reservation');
      }

      const redirectTarget =
        paymentData.order_url ||
        paymentData.payment_url ||
        paymentData.vnpay_url;

      if (redirectTarget) {
        const isZaloPay = paymentMethod === 'zalopay';
        showToast(
          isZaloPay
            ? 'Đang chuyển hướng đến cổng thanh toán ZaloPay Sandbox...'
            : 'Đang chuyển hướng đến cổng thanh toán...',
          'info'
        );

        setTimeout(() => {
          if (redirectTarget.startsWith('http://') || redirectTarget.startsWith('https://')) {
            window.location.href = redirectTarget;
          } else {
            router.push(redirectTarget);
          }
        }, 500);
      } else {
        setIsPaymentSuccess(true);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Thanh toán thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Màn hình Thanh Toán Thành Công
  if (isPaymentSuccess) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-[#F8FAFC] font-sans selection:bg-[#E11D48] selection:text-white">
        <Toast toasts={toasts} onRemove={removeToast} />
        <div className="max-w-md w-full bg-[rgba(18,14,28,0.85)] border border-[rgba(192,132,252,0.25)] rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-400 text-3xl font-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            ✓
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mb-2 tracking-tight">
            Thanh Toán Thành Công!
          </h1>
          <p className="text-[#94A3B8] text-sm mb-6">
            Vé điện tử của bạn đã được xuất thành công và sẵn sàng để quét mã vào rạp.
          </p>

          {/* QR Code Vé */}
          <div className="bg-[#0A0812] border border-[rgba(192,132,252,0.2)] rounded-xl p-6 mb-6">
            <div className="w-40 h-40 bg-white rounded-xl mx-auto mb-3 flex items-center justify-center p-3 shadow-inner">
              <QRCodeSVG
                value={orderCode ? `LUMI-TICKET-${orderCode}` : 'LUMI-CINEMA'}
                size={136}
                level="M"
              />
            </div>
            <p className="text-[#94A3B8] text-xs uppercase tracking-wider mb-1">Mã Vé Điện Tử</p>
            <p className="text-[#FDA4AF] font-mono font-bold text-xl tracking-wider">{orderCode}</p>
          </div>

          {/* Chi tiết đơn */}
          <div className="bg-[rgba(15,11,26,0.8)] border border-[rgba(192,132,252,0.15)] rounded-xl p-4 text-left mb-6 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Phim:</span>
              <span className="text-[#F8FAFC] font-semibold truncate max-w-[200px]">
                {screening?.movie?.title || 'Phim rạp Lumi'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phòng chiếu:</span>
              <span className="text-[#F8FAFC] font-medium">{screening?.room}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ghế ngồi:</span>
              <span className="text-[#FDA4AF] font-bold">
                {selectedSeatCodes.join(', ')}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Khuyến mãi ({appliedCoupon.code}):</span>
                <span>-{appliedCoupon.discount_amount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[rgba(192,132,252,0.15)] pt-2 font-bold text-base">
              <span className="text-[#F8FAFC]">Tổng tiền đã thanh toán:</span>
              <span className="text-emerald-400">
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
    <div className="min-h-screen bg-[#050508] text-[#F8FAFC] font-sans selection:bg-[#E11D48] selection:text-white">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[rgba(192,132,252,0.15)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => router.push(`/screenings/${screeningId}/seats`)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                ← Quay lại chọn ghế
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              Thanh Toán Đơn Đặt Vé
            </h1>
          </div>

          {/* Countdown Timer (Đồng hồ cát xoay 10 phút) */}
          <div>
            <CountdownTimer
              targetTime={reservedUntil}
              initialSeconds={600}
              onExpire={handleHoldExpire}
              label="Thời gian giữ vé"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-[#94A3B8]">
            <div className="hourglass-spin text-3xl mb-3">⏳</div>
            Đang tải thông tin đơn hàng và suất chiếu...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột trái: Phương thức thanh toán & Mã giảm giá */}
            <div className="lg:col-span-7 space-y-6">
              {/* Box Nhập Mã Giảm Giá */}
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-lg backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#F8FAFC] font-bold text-base flex items-center gap-2">
                    <span className="text-[#E11D48] font-bold">✦</span> Mã Giảm Giá / Khuyến Mãi
                  </h3>
                  {appliedCoupon && (
                    <Badge variant="green" size="sm">
                      Đã áp dụng
                    </Badge>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs">
                          ✓
                        </span>
                        <span className="text-emerald-400 font-bold text-sm sm:text-base">
                          Đã áp dụng mã giảm giá
                        </span>
                        <span className="font-mono font-black text-[#F8FAFC] bg-[#0A0812] px-2 py-0.5 rounded border border-emerald-500/40 text-xs">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-400 hover:text-white underline font-semibold transition-colors ml-2 cursor-pointer"
                      >
                        Hủy mã
                      </button>
                    </div>

                    <div className="text-xs text-[#94A3B8] flex items-center justify-between pt-1 border-t border-emerald-500/20">
                      <span>
                        Hình thức giảm:{' '}
                        {appliedCoupon.discount_type === 'Percentage'
                          ? `Giảm ${appliedCoupon.discount_value}%`
                          : 'Giảm tiền mặt'}
                      </span>
                      <span className="text-emerald-400 font-bold text-sm">
                        -{appliedCoupon.discount_amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã khuyến mãi (VD: LUMI20, COMP50_...)"
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
                        className="flex-1 bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-[#F8FAFC] uppercase placeholder-slate-500 focus:outline-none focus:border-[#E11D48] transition-colors"
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
                            <span className="hourglass-spin text-xs">⏳</span>
                            <span>Đang kiểm tra...</span>
                          </div>
                        ) : (
                          'Áp dụng'
                        )}
                      </Button>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      * Nhập mã để nhận ưu đãi giảm giá phần trăm hoặc bồi hoàn trên hóa đơn đặt vé.
                    </p>
                  </div>
                )}
              </div>

              {/* Box Phương Thức Thanh Toán */}
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-lg backdrop-blur-xl">
                <h3 className="text-[#F8FAFC] font-bold text-base mb-4 flex items-center gap-2">
                  <span className="text-rose-400 font-bold">✦</span> Chọn Phương Thức Thanh Toán
                </h3>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map(m => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-start sm:items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(225,29,72,0.25)]'
                            : 'border-[rgba(192,132,252,0.15)] bg-[rgba(10,8,18,0.7)] hover:border-[rgba(192,132,252,0.3)]'
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
                            isSelected ? 'border-[#E11D48]' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 bg-[#E11D48] rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[#F8FAFC] font-bold text-sm">{m.label}</p>
                            {m.badge && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[#94A3B8] text-xs mt-0.5">{m.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin tóm tắt Đơn hàng & Tổng tiền */}
            <div className="lg:col-span-5">
              <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-xl sticky top-6 backdrop-blur-xl">
                <h3 className="text-[#F8FAFC] font-bold text-base mb-4 pb-3 border-b border-[rgba(192,132,252,0.15)]">
                  Thông Tin Vé Đặt
                </h3>

                {/* Phim & Suất chiếu */}
                <div className="flex gap-4 mb-4 pb-4 border-b border-[rgba(192,132,252,0.15)]">
                  {screening?.movie?.poster ? (
                    <div className="w-16 h-24 relative rounded-xl overflow-hidden flex-shrink-0 border border-[rgba(192,132,252,0.2)]">
                      <Image
                        src={screening.movie.poster}
                        alt={screening.movie.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-24 bg-[#0A0812] rounded-xl flex items-center justify-center text-rose-400 font-bold flex-shrink-0">
                      ✦
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-[#F8FAFC] font-bold text-sm sm:text-base leading-snug line-clamp-2">
                      {screening?.movie?.title || 'Phim Lumi Cinema'}
                    </h4>
                    <p className="text-[#94A3B8] text-xs mt-1.5">
                      Phòng: {screening?.room || 'Phòng 01'}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Ngày: {screening?.date ? new Date(screening.date).toLocaleDateString('vi-VN') : ''}
                      {screening?.startTime ? ` · ${new Date(screening.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                  </div>
                </div>

                {/* Ghế đã chọn */}
                <div className="mb-4 pb-4 border-b border-[rgba(192,132,252,0.15)]">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2">
                    <span>Ghế đã chọn ({selectedSeatCodes.length} ghế):</span>
                    <span className="text-[#F8FAFC] font-medium">{ticketBasePrice.toLocaleString('vi-VN')} đ/vé</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeatCodes.map(code => (
                      <span
                        key={code}
                        className="bg-gradient-to-tr from-[#E11D48]/20 to-[#581C87]/20 border border-rose-500/40 text-[#FDA4AF] font-mono font-bold text-xs px-2.5 py-1 rounded-lg"
                      >
                        Ghế {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tính toán tài chính */}
                <div className="space-y-2.5 text-sm mb-6">
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Tạm tính tiền vé:</span>
                    <span className="text-[#F8FAFC] font-medium">
                      {ticketSubtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {/* Chi tiết combo bắp nước nếu có */}
                  {reservedCombos.length > 0 && (
                    <div className="border-t border-[rgba(192,132,252,0.12)] pt-2 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase">
                        <span>Bắp nước:</span>
                        <span className="text-[#FDA4AF] font-bold">{combosSubtotal.toLocaleString('vi-VN')} đ</span>
                      </div>
                      {reservedCombos.map(item => (
                        <div key={item.reservation_id || item.combo_id} className="flex justify-between text-xs pl-2">
                          <span className="text-slate-300 truncate max-w-[180px]">
                            • {item.name} <strong className="text-white">× {item.quantity}</strong>
                          </span>
                          <span className="text-[#F8FAFC] font-medium">
                            {(item.total_price || item.unit_price * item.quantity).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chi tiết giảm giá nếu có Coupon */}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">Khuyến mãi ({appliedCoupon.code}):</span>
                      </div>
                      <span className="font-bold">
                        -{appliedCoupon.discount_amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-3 border-t border-[rgba(192,132,252,0.15)]">
                    <span className="text-[#F8FAFC] font-bold text-base">Tổng thanh toán:</span>
                    <div className="text-right">
                      {appliedCoupon && (
                        <span className="line-through text-slate-500 text-sm block">
                          {originalTotal.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                      <span className="text-[#F8FAFC] font-black text-2xl tracking-tight">
                        {finalTotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                {!session && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">✦</span>
                      <span>Bạn cần đăng nhập để thanh toán vé.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
                        router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
                      }}
                      className="bg-amber-400 text-black font-bold px-2.5 py-1 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                )}

                {/* Nút Xác Nhận Thanh Toán */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                  className="font-bold shadow-[0_0_20px_rgba(225,29,72,0.45)] py-3.5 text-base"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <span className="hourglass-spin text-sm">⏳</span>
                      <span>Đang xử lý giao dịch...</span>
                    </div>
                  ) : (
                    `Xác nhận thanh toán • ${finalTotal.toLocaleString('vi-VN')} đ`
                  )}
                </Button>

                <p className="text-slate-500 text-[11px] text-center mt-3 leading-relaxed">
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
