'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
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

interface ReservedComboItem {
  reservation_id?: number;
  combo_id: number;
  id?: number;
  name: string;
  quantity: number;
  qty?: number;
  unit_price: number;
  total_price: number;
}

interface AppliedCouponData {
  coupon_id: number;
  code: string;
  discount_type: 'Percentage' | 'FixedAmount';
  discount_value: number;
  discount_amount: number;
}

const STEPS = ['1. Chọn ghế', '2. Bắp nước', '3. Thanh toán'];

const PAYMENT_METHODS = [
  {
    id: 'vnpay',
    label: 'Cổng VNPAY-QR',
    icon: '💳',
    description: 'Thanh toán trực tuyến quét mã VNPAY-QR hoặc ứng dụng ngân hàng',
    badge: 'Khuyên dùng',
  },
  {
    id: 'momo',
    label: 'Ví điện tử MoMo',
    icon: '📱',
    description: 'Thanh toán bảo mật qua ứng dụng ví điện tử MoMo',
  },
  {
    id: 'banking',
    label: 'Chuyển khoản Ngân hàng',
    icon: '🏦',
    description: 'Chuyển khoản liên ngân hàng 24/7 với mã QR tự động nhận diện',
  },
];

function PaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const screeningId = useMemo(() => {
    const rawId = params?.id;
    return typeof rawId === 'string' ? parseInt(rawId, 10) : 0;
  }, [params]);

  // States dữ liệu
  const [screening, setScreening] = useState<ScreeningDetails | null>(null);
  const [selectedSeatCodes, setSelectedSeatCodes] = useState<string[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [reservedCombos, setReservedCombos] = useState<ReservedComboItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponData | null>(null);

  // UI States
  const [paymentMethod, setPaymentMethod] = useState<string>('vnpay');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helpers
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Tải thông tin suất chiếu, ghế đã chọn, combo và coupon từ URL / sessionStorage
  useEffect(() => {
    if (!screeningId || isNaN(screeningId)) return;

    let isMounted = true;

    async function loadPaymentData() {
      try {
        setIsLoading(true);

        // 1. Đọc ghế từ Query params hoặc sessionStorage
        const seatsParam = searchParams.get('seats');
        const codesParam = searchParams.get('codes');

        let parsedIds: number[] = [];
        let parsedCodes: string[] = [];

        if (seatsParam && codesParam) {
          parsedIds = seatsParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
          parsedCodes = codesParam.split(',').filter(Boolean);
        } else if (typeof window !== 'undefined') {
          const storedSeats = window.sessionStorage.getItem('lumi_booking_reservation');
          if (storedSeats) {
            try {
              const resData = JSON.parse(storedSeats);
              if (resData.screeningId === screeningId) {
                parsedIds = resData.seatIds || [];
                parsedCodes = resData.seatCodes || [];
              }
            } catch (err) {
              console.error('Lỗi khi đọc session reservation:', err);
            }
          }
        }

        // Nếu rỗng, fallback về A1 để test
        if (parsedCodes.length === 0) {
          parsedCodes = ['A1'];
          parsedIds = [1];
        }

        if (isMounted) {
          setSelectedSeatIds(parsedIds);
          setSelectedSeatCodes(parsedCodes);
        }

        // 2. Đọc Combo từ sessionStorage
        if (typeof window !== 'undefined') {
          const storedCombos = window.sessionStorage.getItem('lumi_combo_reservation');
          if (storedCombos) {
            try {
              const resCombo = JSON.parse(storedCombos);
              if (resCombo.screeningId === screeningId && Array.isArray(resCombo.items)) {
                if (isMounted) setReservedCombos(resCombo.items);
              }
            } catch (err) {
              console.error('Lỗi khi đọc session combos:', err);
            }
          }
        }

        // 3. Đọc Coupon nếu có lưu từ trang checkout trước đó
        if (typeof window !== 'undefined') {
          const storedCoupon = window.sessionStorage.getItem('lumi_coupon_applied');
          if (storedCoupon) {
            try {
              const parsedCoupon = JSON.parse(storedCoupon);
              if (isMounted) setAppliedCoupon(parsedCoupon);
            } catch (err) {
              console.error('Lỗi khi đọc session coupon:', err);
            }
          }
        }

        // 4. Lấy chi tiết suất chiếu từ API
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
              price: Number(data.data.price) || 120000,
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

    loadPaymentData();

    return () => {
      isMounted = false;
    };
  }, [screeningId, searchParams, showToast]);

  // Tính toán tổng tiền
  const ticketBasePrice = screening?.price || 120000;
  const ticketSubtotal = useMemo(() => {
    return (selectedSeatCodes.length || 1) * ticketBasePrice;
  }, [selectedSeatCodes.length, ticketBasePrice]);

  const combosSubtotal = useMemo(() => {
    return reservedCombos.reduce(
      (sum, item) => sum + (item.total_price || item.unit_price * (item.quantity || item.qty || 1)),
      0
    );
  }, [reservedCombos]);

  const originalTotal = useMemo(() => {
    return ticketSubtotal + combosSubtotal;
  }, [ticketSubtotal, combosSubtotal]);

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const finalTotal = Math.max(0, originalTotal - discountAmount);

  // Xử lý hết thời gian 10 phút giữ chỗ
  const handleHoldExpire = () => {
    showToast('Thời gian giữ chỗ thanh toán đã hết hạn! Vui lòng chọn lại vé.', 'warning');
    setTimeout(() => {
      router.push(`/screenings/${screeningId}/seats`);
    }, 2000);
  };

  // Xử lý áp dụng mã giảm giá / voucher
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
        return;
      }

      // Áp dụng thành công
      setAppliedCoupon(result.data);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('lumi_coupon_applied', JSON.stringify(result.data));
      }
      showToast(result.message || `Đã áp dụng mã giảm giá '${code}' thành công!`, 'success');
      setCouponCodeInput('');
    } catch (err) {
      console.error('Lỗi khi kiểm tra mã giảm giá:', err);
      showToast('Không thể kết nối đến máy chủ để kiểm tra mã giảm giá', 'error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Hủy bỏ mã giảm giá đã áp dụng
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('lumi_coupon_applied');
    }
    showToast('Đã gỡ bỏ mã giảm giá', 'info');
  };

  // Khách bấm 'Thanh toán VNPay': Gọi POST /api/payments/initiate và dùng window.location.href để redirect
  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      const payload = {
        screening_id: screeningId,
        seat_ids: selectedSeatIds,
        ticket_items: [
          {
            type: 'Thường',
            quantity: selectedSeatIds.length,
          },
        ],
        combo_items: reservedCombos.map(item => ({
          combo_id: item.combo_id || item.id,
          quantity: item.quantity || item.qty || 1,
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
        const errorMsg = result.error || result.message || 'Khởi tạo thanh toán thất bại';
        showToast(errorMsg, 'error');
        return;
      }

      const paymentData = result.data;
      showToast('Đang chuyển hướng sang cổng thanh toán VNPay...', 'info');

      // Chuyển hướng người dùng sang Cổng VNPay bằng window.location.href
      if (paymentData.vnpay_url) {
        setTimeout(() => {
          window.location.href = paymentData.vnpay_url;
        }, 300);
      } else {
        router.push(`/payment-result?payment_id=${paymentData.payment_id}&status=success`);
      }
    } catch (err) {
      console.error('Lỗi khi khởi tạo thanh toán:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi kết nối đến máy chủ thanh toán', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6 text-white font-sans">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[#B3B3B3] text-sm">Đang tải thông tin đơn hàng thanh toán...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white py-8 px-4 sm:px-6 font-sans">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-[#333] pb-4">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                  i === 2
                    ? 'bg-[#E63946] text-white shadow-lg'
                    : i < 2
                    ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                    : 'bg-[#2D2D2D] text-[#888]'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/20">
                  {i < 2 ? '✓' : i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#555]">→</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột trái: Phương Thức Thanh Toán (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between bg-[#242424] p-4 rounded-xl border border-[#383838]">
              <div>
                <h2 className="text-xl font-black text-white">Thanh Toán Đơn Hàng</h2>
                <p className="text-xs text-[#999] mt-0.5">Chọn phương thức thanh toán an toàn bên dưới</p>
              </div>
              <CountdownTimer initialSeconds={600} label="Thời gian giữ" onExpire={handleHoldExpire} />
            </div>

            {/* QR Mock Box */}
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 text-center shadow-xl">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-red-500 font-black text-lg tracking-wider">VNPAY</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                  Cổng thanh toán chính thức
                </span>
              </div>
              <p className="text-[#B3B3B3] text-xs mb-4">
                Quét mã QR qua ứng dụng VNPAY hoặc 30+ ứng dụng Mobile Banking
              </p>
              <div className="w-36 h-36 bg-white rounded-xl mx-auto flex items-center justify-center p-2.5 shadow-inner">
                <div className="grid grid-cols-5 gap-1 w-full h-full">
                  {Array.from({ length: 25 }, (_, i) => (
                    <div
                      key={i}
                      className="rounded-[1px]"
                      style={{
                        background: (i % 2 === 0 || i % 6 === 0 || i === 0 || i === 24) ? '#111' : '#eee',
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[#888] text-xs mt-3">
                Thanh toán an toàn với tiêu chuẩn bảo mật PCI DSS quốc tế
              </p>
            </div>

            {/* Danh sách phương thức thanh toán */}
            <div>
              <h3 className="text-sm uppercase tracking-wider font-bold text-[#BBB] mb-3">
                Chọn Cổng Thanh Toán
              </h3>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(m => {
                  const isSelected = paymentMethod === m.id;
                  return (
                    <label
                      key={m.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#E63946] bg-[#E63946]/10 shadow-md ring-1 ring-[#E63946]'
                          : 'border-[#404040] bg-[#2D2D2D] hover:border-[#606060]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={m.id}
                        checked={isSelected}
                        onChange={() => setPaymentMethod(m.id)}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'border-[#E63946]' : 'border-[#666]'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 bg-[#E63946] rounded-full" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{m.icon}</span>
                          <span className="text-white font-bold text-sm sm:text-base">{m.label}</span>
                          {m.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/40 rounded-full">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[#999] text-xs mt-1 leading-relaxed">{m.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cột phải: Tổng kết đơn hàng (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-2xl p-6 shadow-2xl sticky top-8">
              <h3 className="text-lg font-black text-white mb-4 pb-3 border-b border-[#404040] flex items-center justify-between">
                <span>Chi Tiết Đơn Hàng</span>
                <span className="text-xs text-[#888] font-normal">#{screeningId}</span>
              </h3>

              {/* Thông tin phim & Suất chiếu */}
              {screening && (
                <div className="flex gap-4 mb-5 pb-5 border-b border-[#3D3D3D]">
                  <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-[#505050] shadow-md">
                    <Image
                      src={screening.movie.poster}
                      alt={screening.movie.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-base leading-snug line-clamp-2">
                      {screening.movie.title}
                    </h4>
                    <p className="text-[#BBB] text-xs mt-1.5 flex items-center gap-1.5">
                      <span>📅</span>
                      <span>
                        {new Date(screening.date).toLocaleDateString('vi-VN')} •{' '}
                        {new Date(screening.startTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                    <p className="text-[#999] text-xs mt-1 flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>{screening.room}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Ghế đã chọn */}
              <div className="mb-4 pb-4 border-b border-[#3D3D3D]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#BBB] uppercase font-bold tracking-wider">
                    Ghế ngồi ({selectedSeatCodes.length} vé)
                  </span>
                  <span className="text-white font-semibold text-sm">
                    {ticketSubtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeatCodes.map(code => (
                    <Badge key={code} variant="gold" size="sm">
                      Ghế {code}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bắp nước (Combos) nếu có */}
              {reservedCombos.length > 0 && (
                <div className="mb-4 pb-4 border-b border-[#3D3D3D] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#BBB] uppercase font-bold tracking-wider">
                      Combo Bắp Nước ({reservedCombos.reduce((s, c) => s + (c.quantity || c.qty || 1), 0)} món)
                    </span>
                    <span className="text-white font-semibold text-sm">
                      {combosSubtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  {reservedCombos.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-[#999]">
                      <span className="line-clamp-1">
                        {item.quantity || item.qty || 1}x {item.name}
                      </span>
                      <span className="font-mono text-white">
                        {(item.total_price || item.unit_price * (item.quantity || item.qty || 1)).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Nhập mã giảm giá / Voucher */}
              <div className="mb-4 pb-4 border-b border-[#3D3D3D]">
                <label className="block text-xs text-[#BBB] uppercase font-bold tracking-wider mb-2">
                  Mã Giảm Giá / Voucher
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏷️</span>
                      <div>
                        <div className="text-green-400 font-bold text-sm tracking-wide">
                          {appliedCoupon.code}
                        </div>
                        <div className="text-xs text-green-300">
                          Đã giảm {appliedCoupon.discount_amount.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã voucher (vd: LUMI10, WELCOME)"
                      value={couponCodeInput}
                      onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      disabled={isValidatingCoupon}
                      className="flex-1 bg-[#1E1E1E] border border-[#404040] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#E63946] uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCodeInput.trim()}
                      className="px-4 py-2 bg-[#E63946] hover:bg-[#D90429] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer whitespace-nowrap"
                    >
                      {isValidatingCoupon ? 'Đang duyệt...' : 'Áp dụng'}
                    </button>
                  </div>
                )}
              </div>

              {/* Tổng thanh toán */}
              <div className="pt-2 mb-6">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-white font-bold text-base">Tổng Thanh Toán</span>
                  <span className="text-[#FFB703] font-black text-2xl sm:text-3xl tracking-tight">
                    {finalTotal.toLocaleString('vi-VN')} <span className="text-lg">đ</span>
                  </span>
                </div>
                {discountAmount > 0 && (
                  <p className="text-right text-[11px] text-[#2ECC71]">
                    (Tiết kiệm {discountAmount.toLocaleString('vi-VN')} đ)
                  </p>
                )}
              </div>

              {/* Nút Thanh toán VNPay */}
              <Button
                fullWidth
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
                className="py-4 text-base font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 active:scale-[0.99] shadow-xl cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kết nối cổng VNPay...</span>
                  </div>
                ) : (
                  '💳 Thanh toán VNPay'
                )}
              </Button>

              <p className="text-[#666] text-[11px] text-center mt-3 leading-relaxed">
                Bằng việc bấm Thanh toán, bạn đồng ý với Điều khoản giao dịch và Chính sách vé của Lumi Cinema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-white">
          Đang tải trang thanh toán...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
