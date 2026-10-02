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

        // 1. Lấy thông tin ghế từ query params hoặc sessionStorage
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

        if (parsedCodes.length === 0) {
          parsedCodes = ['A1'];
          parsedIds = [1];
        }

        if (isMounted) {
          setSelectedSeatIds(parsedIds);
          setSelectedSeatCodes(parsedCodes);
        }

        // 2. Fetch thông tin suất chiếu & danh sách combo ACTIVE
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
        console.error('Lỗi khi tải dữ liệu bắp nước:', err);
        showToast(err instanceof Error ? err.message : 'Lỗi tải dữ liệu', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [screeningId, searchParams, showToast]);

  // Điều chỉnh số lượng bắp nước (+) / (-)
  const handleUpdateQty = (combo: ComboItem, delta: number) => {
    const currentQty = comboQtys[combo.id] || 0;
    const newQty = currentQty + delta;

    if (newQty < 0) return;

    if (newQty > combo.stock) {
      showToast(`Combo "${combo.name}" chỉ còn lại ${combo.stock} phần trong kho!`, 'warning');
      return;
    }

    setComboQtys(prev => {
      const updated = { ...prev };
      if (newQty === 0) {
        delete updated[combo.id];
      } else {
        updated[combo.id] = newQty;
      }
      return updated;
    });
  };

  // Tính toán tài chính
  const ticketBasePrice = screening?.price || 95000;
  const ticketSubtotal = (selectedSeatCodes.length || 1) * ticketBasePrice;

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

    // Nếu không chọn combo nào, đi thẳng sang trang thanh toán vé
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
        // Làm mới lại danh sách combo để lấy số lượng kho mới nhất
        const freshCombos = await fetch('/api/combos?client=true').then(r => r.json());
        if (freshCombos.success && Array.isArray(freshCombos.data)) {
          setCombos(freshCombos.data);
        }
        return;
      }

      // Lưu kết quả giữ chỗ combo vào sessionStorage
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

  // Bỏ qua bước chọn bắp nước
  const handleSkip = () => {
    router.push(
      `/screenings/${screeningId}/checkout?seats=${selectedSeatIds.join(',')}&codes=${selectedSeatCodes.join(',')}`
    );
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Steps Progress Header */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-[#333]">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  i === 1
                    ? 'bg-[#E63946] text-white'
                    : i < 1
                    ? 'bg-[#2D2D2D] text-[#2ECC71] border border-[#2ECC71]/30'
                    : 'bg-[#2D2D2D] text-[#888]'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  {i < 1 ? '✓' : i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#404040]">→</span>}
            </div>
          ))}

          <div className="ml-auto flex items-center bg-[#242424] border border-[#404040] px-3.5 py-1.5 rounded-xl">
            <CountdownTimer initialSeconds={600} label="Thời gian giữ vé" onExpire={handleHoldExpire} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cột trái: Danh sách combo bắp nước */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Chọn Combo Bắp Nước
                </h1>
                <p className="text-[#B3B3B3] text-sm mt-0.5">
                  Thưởng thức bắp rang bơ giòn rụm và nước ngọt mát lạnh khi xem phim. (Không bắt buộc)
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-[#B3B3B3] hover:text-white underline font-semibold transition-colors"
              >
                Bỏ qua bước này →
              </button>
            </div>

            {isLoading ? (
              <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-16 text-center text-[#B3B3B3]">
                <div className="w-8 h-8 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Đang tải thực đơn bắp nước...
              </div>
            ) : combos.length === 0 ? (
              <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-12 text-center text-[#B3B3B3]">
                <span className="text-4xl block mb-2">🍿</span>
                <p className="text-base font-bold text-white">Hiện tại chưa có combo bắp nước nào</p>
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
                      className={`bg-[#2D2D2D] border rounded-xl overflow-hidden flex flex-col justify-between transition-all ${
                        qty > 0
                          ? 'border-[#E63946] shadow-lg shadow-[#E63946]/10'
                          : 'border-[#404040] hover:border-[#666]'
                      }`}
                    >
                      <div>
                        {/* Image */}
                        <div className="relative h-40 w-full bg-[#1E1E1E]">
                          {combo.image ? (
                            <Image
                              src={combo.image}
                              alt={combo.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🍿
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
                          <h3 className="text-white font-bold text-base line-clamp-1" title={combo.name}>
                            {combo.name}
                          </h3>
                          <p className="text-[#B3B3B3] text-xs line-clamp-2 min-h-[32px]">
                            {combo.description || 'Thơm ngon, đậm vị.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Counter Controls */}
                      <div className="px-4 pb-4 pt-2 border-t border-[#383838] flex items-center justify-between">
                        <div>
                          <span className="text-[#FFB703] font-black text-base">
                            {combo.price.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        {/* (+) / (-) Buttons */}
                        <div className="flex items-center gap-2 bg-[#1E1E1E] border border-[#404040] rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(combo, -1)}
                            disabled={qty === 0}
                            className="w-7 h-7 bg-[#333] hover:bg-[#444] rounded text-white font-bold flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="text-white font-mono font-bold w-6 text-center text-sm">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(combo, 1)}
                            disabled={qty >= combo.stock}
                            className="w-7 h-7 bg-[#E63946] hover:bg-[#C62B36] rounded text-white font-bold flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 shadow-xl sticky top-6">
              <h3 className="text-white font-bold text-base mb-4 pb-3 border-b border-[#404040]">
                Tóm Tắt Đơn Đặt
              </h3>

              {/* Thông tin phim */}
              <div className="flex gap-3 mb-4 pb-4 border-b border-[#404040]">
                {screening?.movie?.poster ? (
                  <div className="w-14 h-20 relative rounded-lg overflow-hidden flex-shrink-0 border border-[#404040]">
                    <Image
                      src={screening.movie.poster}
                      alt={screening.movie.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-20 bg-[#1E1E1E] rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    🎬
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm leading-snug line-clamp-2">
                    {screening?.movie?.title || 'Phim Lumi'}
                  </h4>
                  <p className="text-[#888] text-xs mt-1">📍 {screening?.room}</p>
                  <p className="text-[#888] text-xs">
                    📅 {screening?.date ? new Date(screening.date).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
              </div>

              {/* Chi tiết tiền vé */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-xs text-[#B3B3B3]">
                  <span>Ghế chọn ({selectedSeatCodes.join(', ')}):</span>
                  <span className="text-white font-medium">{ticketSubtotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Chi tiết combo đã chọn */}
              {selectedComboList.length > 0 && (
                <div className="border-t border-[#404040] pt-3 mb-4 space-y-2">
                  <p className="text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                    Bắp nước đã chọn:
                  </p>
                  {selectedComboList.map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-white">
                        {item.name} <strong className="text-[#FFB703]">× {item.qty}</strong>
                      </span>
                      <span className="text-white font-medium">
                        {item.totalPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-[#FFB703] pt-1 border-t border-[#383838]">
                    <span>Tổng tiền bắp nước:</span>
                    <span className="font-bold">{comboTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              )}

              {/* Tổng cộng */}
              <div className="border-t border-[#404040] pt-3 mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="text-white font-bold text-base">Tổng thanh toán:</span>
                  <span className="text-[#FFB703] font-black text-2xl">
                    {grandTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleProceed}
                  disabled={isReserving}
                  className="font-bold shadow-lg shadow-[#E63946]/20 py-3.5 text-base"
                >
                  {isReserving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang giữ chỗ tồn kho...</span>
                    </div>
                  ) : (
                    'Tiếp tục sang thanh toán →'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={handleSkip}
                  disabled={isReserving}
                  className="text-xs text-[#888] hover:text-white"
                >
                  Bỏ qua bắp nước, thanh toán ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
