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
  poster: string;
  genre?: string;
  duration?: number;
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

interface ComboItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const STEPS = ['Chọn ghế', 'Combo bắp nước', 'Thanh toán & Vé'];

export default function ComboSelectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const screeningId = useMemo(() => {
    const rawId = params?.id;
    return typeof rawId === 'string' ? parseInt(rawId, 10) : 0;
  }, [params]);

  // States
  const [screening, setScreening] = useState<ScreeningDetails | null>(null);
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [selectedSeatCodes, setSelectedSeatCodes] = useState<string[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [comboQtys, setComboQtys] = useState<Record<number, number>>({});
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReserving, setIsReserving] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Xử lý hết thời gian 10 phút giữ vé
  const handleHoldExpire = useCallback(() => {
    showToast('Thời gian giữ vé (10 phút) đã hết hạn! Đang chuyển về trang chủ...', 'warning');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('lumi_booking_reservation');
    }
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router, showToast]);

  // Fetch Screening & Active Combos
  useEffect(() => {
    if (!screeningId || isNaN(screeningId)) return;

    let isMounted = true;

    async function loadData() {
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

        const [screeningRes, combosRes] = await Promise.all([
          fetch(`/api/screenings/${screeningId}`),
          fetch('/api/combos?client=true'),
        ]);

        const [screeningData, combosData] = await Promise.all([
          screeningRes.json(),
          combosRes.json(),
        ]);

        if (isMounted) {
          if (screeningRes.ok && screeningData.success && screeningData.data) {
            setScreening({
              id: screeningData.data.id,
              room: screeningData.data.room,
              date: screeningData.data.date,
              startTime: screeningData.data.startTime || screeningData.data.start_time,
              endTime: screeningData.data.endTime || screeningData.data.end_time,
              price: Number(screeningData.data.price) || 95000,
              movie: screeningData.data.movie,
            });
          }

          if (combosRes.ok && combosData.success && Array.isArray(combosData.data)) {
            setCombos(combosData.data);
          }
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu combo:', err);
        showToast('Lỗi tải thực đơn bắp nước', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [screeningId, searchParams, showToast]);

  // Cập nhật số lượng combo
  const handleUpdateQty = (combo: ComboItem, delta: number) => {
    const current = comboQtys[combo.id] || 0;
    const next = current + delta;

    if (next < 0) return;
    if (next > combo.stock) {
      showToast(`Rất tiếc, combo "${combo.name}" chỉ còn ${combo.stock} phần trong kho`, 'warning');
      return;
    }

    setComboQtys(prev => ({
      ...prev,
      [combo.id]: next,
    }));
  };

  // Tính tiền vé tạm tính
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
    return selectedSeatCodes.length * ticketBasePrice;
  }, [selectedSeatCodes.length, ticketBasePrice, screeningId]);

  // Danh sách combo đã chọn và tổng tiền
  const selectedComboList = useMemo(() => {
    return combos
      .filter(c => (comboQtys[c.id] || 0) > 0)
      .map(c => ({
        ...c,
        qty: comboQtys[c.id],
        totalPrice: c.price * comboQtys[c.id],
      }));
  }, [combos, comboQtys]);

  const comboTotal = useMemo(() => {
    return selectedComboList.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [selectedComboList]);

  const grandTotal = ticketSubtotal + comboTotal;

  // Bấm 'Tiếp tục': Gọi POST /api/combos/reserve giữ kho 10 phút rồi sang checkout
  const handleProceed = async () => {
    const checkoutUrl = `/screenings/${screeningId}/checkout?seats=${selectedSeatIds.join(',')}&codes=${selectedSeatCodes.join(',')}`;

    if (selectedComboList.length === 0) {
      router.push(checkoutUrl);
      return;
    }

    try {
      setIsReserving(true);

      const payload = {
        combo_items: selectedComboList.map(item => ({
          combo_id: item.id,
          quantity: item.qty,
        })),
      };

      const res = await fetch('/api/combos/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        showToast(result.error || result.message || 'Không thể giữ chỗ bắp nước. Vui lòng kiểm tra lại tồn kho.', 'error');
        const freshCombos = await fetch('/api/combos?client=true').then(r => r.json());
        if (freshCombos.success && Array.isArray(freshCombos.data)) {
          setCombos(freshCombos.data);
        }
        return;
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'lumi_combo_reservation',
          JSON.stringify({
            screeningId,
            items: result.data?.items || [],
            reservedUntil: result.data?.reserved_until,
            comboTotal,
          })
        );
      }

      showToast('Đã giữ tồn kho bắp nước trong 10 phút! Đang chuyển sang thanh toán...', 'success');

      setTimeout(() => {
        router.push(checkoutUrl);
      }, 800);
    } catch (err) {
      console.error('Lỗi khi gọi API reserve combo:', err);
      showToast('Lỗi kết nối khi giữ chỗ bắp nước', 'error');
    } finally {
      setIsReserving(false);
    }
  };

  const handleSkip = () => {
    router.push(
      `/screenings/${screeningId}/checkout?seats=${selectedSeatIds.join(',')}&codes=${selectedSeatCodes.join(',')}`
    );
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#F8FAFC] font-sans selection:bg-[#E11D48] selection:text-white">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Steps Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[rgba(192,132,252,0.15)]">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    i === 1
                      ? 'bg-gradient-to-r from-[#E11D48] to-[#881337] text-white shadow-[0_0_15px_rgba(225,29,72,0.5)] border border-rose-500/40'
                      : i < 1
                      ? 'bg-[rgba(18,14,28,0.7)] text-emerald-400 border border-emerald-500/30'
                      : 'bg-[rgba(18,14,28,0.7)] text-[#94A3B8] border border-[rgba(192,132,252,0.15)]'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/20"
                  >
                    {i < 1 ? '✓' : i + 1}
                  </span>
                  {step}
                </div>
                {i < STEPS.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>

          <div>
            <CountdownTimer
              targetTime={reservedUntil}
              initialSeconds={600}
              label="Thời gian giữ vé"
              onExpire={handleHoldExpire}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cột trái: Danh sách combo bắp nước */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">
                  Chọn Combo Bắp Nước
                </h1>
                <p className="text-[#94A3B8] text-sm mt-0.5">
                  Thưởng thức bắp rang bơ giòn rụm và nước giải khát mát lạnh khi xem phim. (Không bắt buộc)
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-[#FDA4AF] hover:underline font-semibold transition-colors cursor-pointer"
              >
                Bỏ qua bước này →
              </button>
            </div>

            {isLoading ? (
              <div className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-16 text-center text-[#94A3B8] backdrop-blur-xl">
                <div className="hourglass-spin text-3xl mb-3">⏳</div>
                Đang tải thực đơn bắp nước thiên hà...
              </div>
            ) : combos.length === 0 ? (
              <div className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-12 text-center text-[#94A3B8] backdrop-blur-xl">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-300 font-bold">
                  ✦
                </div>
                <p className="text-base font-bold text-[#F8FAFC]">Hiện tại chưa có combo bắp nước nào</p>
                <p className="text-xs mt-1">Bạn có thể tiếp tục chuyển sang màn hình thanh toán vé.</p>
                <Button onClick={handleSkip} className="mt-4" variant="primary">
                  Sang thanh toán vé
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {combos.map(combo => {
                  const qty = comboQtys[combo.id] || 0;
                  const isLow = combo.stock < 10;

                  return (
                    <div
                      key={combo.id}
                      className={`bg-[rgba(18,14,28,0.7)] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all backdrop-blur-xl ${
                        qty > 0
                          ? 'border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.35)]'
                          : 'border-[rgba(192,132,252,0.18)] hover:border-[rgba(192,132,252,0.35)]'
                      }`}
                    >
                      <div>
                        {/* Image */}
                        <div className="relative h-44 w-full bg-[#0A0812]">
                          {combo.image ? (
                            <Image
                              src={combo.image}
                              alt={combo.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-purple-300 font-bold">
                              <span className="text-2xl mb-1">✦</span>
                              <span className="text-xs text-slate-500">LUMI COMBO</span>
                            </div>
                          )}

                          {isLow && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="gold" size="sm">
                                Còn {combo.stock} phần
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-1.5">
                          <h3 className="text-[#F8FAFC] font-bold text-base line-clamp-1" title={combo.name}>
                            {combo.name}
                          </h3>
                          <p className="text-[#94A3B8] text-xs line-clamp-2 min-h-[32px]">
                            {combo.description || 'Thơm ngon, chuẩn vị rạp chiếu phim.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Counter Controls */}
                      <div className="px-4 pb-4 pt-2 border-t border-[rgba(192,132,252,0.12)] flex items-center justify-between">
                        <div>
                          <span className="text-[#F8FAFC] font-black text-base">
                            {combo.price.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        {/* (+) / (-) Buttons */}
                        <div className="flex items-center gap-2 bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(combo, -1)}
                            disabled={qty === 0}
                            className="w-7 h-7 bg-[rgba(18,14,28,0.8)] hover:bg-[rgba(30,24,48,0.9)] rounded-lg text-white font-bold flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="text-[#F8FAFC] font-mono font-bold w-6 text-center text-sm">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(combo, 1)}
                            disabled={qty >= combo.stock}
                            className="w-7 h-7 bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#F43F5E] hover:to-[#BE123C] rounded-lg text-white font-bold flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột phải: Tóm tắt đơn hàng & Tổng thanh toán */}
          <div className="w-full lg:w-84 flex-shrink-0">
            <div className="bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 shadow-xl sticky top-6 backdrop-blur-xl">
              <h3 className="text-[#F8FAFC] font-bold text-base mb-4 pb-3 border-b border-[rgba(192,132,252,0.15)]">
                Tóm Tắt Đơn Đặt
              </h3>

              {/* Thông tin phim */}
              <div className="flex gap-3 mb-4 pb-4 border-b border-[rgba(192,132,252,0.15)]">
                {screening?.movie?.poster ? (
                  <div className="w-14 h-20 relative rounded-xl overflow-hidden flex-shrink-0 border border-[rgba(192,132,252,0.2)]">
                    <Image
                      src={screening.movie.poster}
                      alt={screening.movie.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-20 bg-[#0A0812] rounded-xl flex items-center justify-center text-rose-400 font-bold flex-shrink-0">
                    ✦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#F8FAFC] font-bold text-sm leading-snug line-clamp-2">
                    {screening?.movie?.title || 'Phim Lumi'}
                  </h4>
                  <p className="text-[#94A3B8] text-xs mt-1">Phòng: {screening?.room}</p>
                  <p className="text-slate-400 text-xs">
                    Ngày: {screening?.date ? new Date(screening.date).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
              </div>

              {/* Chi tiết tiền vé */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-xs text-[#94A3B8]">
                  <span>Ghế chọn ({selectedSeatCodes.join(', ')}):</span>
                  <span className="text-[#F8FAFC] font-medium">{ticketSubtotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Chi tiết combo đã chọn */}
              {selectedComboList.length > 0 && (
                <div className="border-t border-[rgba(192,132,252,0.15)] pt-3 mb-4 space-y-2">
                  <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">
                    Bắp nước đã chọn:
                  </p>
                  {selectedComboList.map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[170px]">
                        • {item.name} <strong className="text-white">×{item.qty}</strong>
                      </span>
                      <span className="text-[#F8FAFC] font-medium">
                        {item.totalPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs pt-1 border-t border-[rgba(192,132,252,0.1)] text-[#FDA4AF] font-bold">
                    <span>Tổng bắp nước:</span>
                    <span>{comboTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              )}

              {/* Tổng cộng */}
              <div className="border-t border-[rgba(192,132,252,0.15)] pt-3 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#F8FAFC]">Tổng đơn thanh toán:</span>
                  <span className="text-xl font-black text-[#F8FAFC]">
                    {grandTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleProceed}
                  disabled={isReserving}
                  className="font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                >
                  {isReserving ? (
                    <div className="flex items-center gap-2">
                      <span className="hourglass-spin text-sm">⏳</span>
                      <span>Đang giữ chỗ bắp nước...</span>
                    </div>
                  ) : (
                    'Tiếp tục sang thanh toán →'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors text-center cursor-pointer block"
                >
                  Bỏ qua bắp nước & Thanh toán vé
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
