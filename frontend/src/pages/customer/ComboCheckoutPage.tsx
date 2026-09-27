import { useState } from 'react';
import { Movie, Screening, combos } from '@/data/mockData';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ComboCheckoutPageProps {
  movie: Movie;
  screening: Screening;
  selectedSeats: string[];
  normalQty: number;
  childQty: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedVoucher: { code: string; discount: number } | null;
  onNavigate: (page: string, data?: unknown) => void;
}

const STEPS = ['Chọn ghế', 'Loại vé', 'Combo & Thanh toán', 'Xác nhận'];

export default function ComboCheckoutPage({
  movie, screening, selectedSeats,
  normalQty, childQty, subtotal, discountAmount, total, appliedVoucher,
  onNavigate,
}: ComboCheckoutPageProps) {
  const [comboQtys, setComboQtys] = useState<Record<string, number>>({});

  const setComboQty = (id: string, qty: number) =>
    setComboQtys(prev => ({ ...prev, [id]: Math.max(0, qty) }));

  const comboTotal = combos.reduce((sum, c) => sum + (comboQtys[c.id] || 0) * c.price, 0);
  const grandTotal = total + comboTotal;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                i === 2 ? 'step-active' : i < 2 ? 'step-done' : 'step-inactive'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {i < 2 ? '✓' : i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#404040]">→</span>}
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Combo list */}
          <div className="flex-1">
            <h2 className="text-xl font-black text-white mb-2">Chọn Combo Bắp Nước</h2>
            <p className="text-[#B3B3B3] text-sm mb-6">Bước này không bắt buộc. Bạn có thể bỏ qua.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {combos.map(combo => {
                const qty = comboQtys[combo.id] || 0;
                return (
                  <div key={combo.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden hover:border-[#525252] transition-colors">
                    <div className="relative">
                      <img src={combo.image} alt={combo.name} className="w-full h-36 object-cover" />
                      {combo.badge && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="red" size="md">{combo.badge}</Badge>
                        </div>
                      )}
                      {combo.stock < 10 && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="gold" size="sm">Còn {combo.stock}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-bold">{combo.name}</h3>
                      <p className="text-[#B3B3B3] text-xs mb-2">{combo.description}</p>
                      <ul className="text-[#B3B3B3] text-xs space-y-0.5 mb-3">
                        {combo.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-[#2ECC71]">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[#FFB703] font-bold">{combo.price.toLocaleString('vi-VN')}đ</span>
                          <span className="text-[#525252] text-xs line-through ml-2">
                            {combo.originalPrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setComboQty(combo.id, qty - 1)}
                            className="w-7 h-7 bg-[#383838] hover:bg-[#404040] rounded-lg text-white font-bold flex items-center justify-center"
                            style={{ border: '1px solid #404040', cursor: 'pointer' }}
                          >
                            −
                          </button>
                          <span className="text-white font-bold w-5 text-center">{qty}</span>
                          <button
                            onClick={() => setComboQty(combo.id, qty + 1)}
                            disabled={combo.stock === 0}
                            className="w-7 h-7 bg-[#E63946] hover:bg-[#C62B36] rounded-lg text-white font-bold flex items-center justify-center disabled:opacity-40"
                            style={{ border: 'none', cursor: combo.stock > 0 ? 'pointer' : 'not-allowed' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order summary */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 sticky top-24">
              <h3 className="text-white font-bold text-base mb-4 border-b border-[#404040] pb-3">Tóm Tắt Đơn Hàng</h3>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#B3B3B3]">Phim</span>
                  <span className="text-white font-medium text-right max-w-[160px] line-clamp-2">{movie.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B3B3B3]">Suất</span>
                  <span className="text-white">{screening.time} • {screening.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B3B3B3]">Phòng</span>
                  <span className="text-white">{screening.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B3B3B3]">Ghế</span>
                  <span className="text-white">{selectedSeats.join(', ')}</span>
                </div>
                {normalQty > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#B3B3B3]">Vé Thường × {normalQty}</span>
                    <span className="text-white">{subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {appliedVoucher && (
                  <div className="flex justify-between">
                    <span className="text-[#2ECC71]">Giảm ({appliedVoucher.code})</span>
                    <span className="text-[#2ECC71]">−{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              {/* Combos */}
              {combos.filter(c => (comboQtys[c.id] || 0) > 0).length > 0 && (
                <div className="border-t border-[#404040] pt-3 mb-3">
                  <p className="text-[#B3B3B3] text-xs font-semibold mb-2">Combo đã chọn:</p>
                  {combos.filter(c => (comboQtys[c.id] || 0) > 0).map(c => (
                    <div key={c.id} className="flex justify-between text-sm">
                      <span className="text-[#B3B3B3]">{c.name} × {comboQtys[c.id]}</span>
                      <span className="text-white">{((comboQtys[c.id] || 0) * c.price).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-[#404040] pt-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-white font-bold">Tổng thanh toán</span>
                  <span className="text-[#FFB703] font-black text-xl">{grandTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => onNavigate('payment', {
                    movie, screening, selectedSeats,
                    normalQty, childQty, comboQtys,
                    total: grandTotal
                  })}
                >
                  Tiến hành thanh toán
                </Button>
                <Button variant="ghost" fullWidth size="sm"
                  onClick={() => onNavigate('payment', {
                    movie, screening, selectedSeats,
                    normalQty, childQty, comboQtys: {},
                    total
                  })}
                >
                  Bỏ qua, thanh toán ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
