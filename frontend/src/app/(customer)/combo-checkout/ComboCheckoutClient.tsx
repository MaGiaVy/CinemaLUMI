'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Movie, Screening, Combo } from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ComboCheckoutClientProps {
  movie: Movie;
  screening: Screening;
  selectedSeats: string[];
  ticketTotal: number;
  combos: Combo[];
}

export default function ComboCheckoutClient({
  movie,
  screening,
  selectedSeats,
  ticketTotal,
  combos,
}: ComboCheckoutClientProps) {
  const [comboQtys, setComboQtys] = useState<Record<string, number>>({});

  const updateQty = (id: string, delta: number) => {
    setComboQtys(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const comboTotal = Object.entries(comboQtys).reduce((acc, [id, qty]) => {
    const item = combos.find(c => c.id === id);
    return acc + (item ? item.price * qty : 0);
  }, 0);

  const grandTotal = ticketTotal + comboTotal;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black text-white mb-2">Chọn Bắp Nước & Combo Ăn Vặt</h1>
        <p className="text-[#B3B3B3] text-sm mb-6">
          Thưởng thức trọn vẹn buổi xem phim cùng những combo bắp rang bơ giòn rụm và nước ngọt mát lạnh
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {combos.map(combo => {
              const qty = comboQtys[combo.id] || 0;

              return (
                <div
                  key={combo.id}
                  className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 flex gap-4 items-center"
                >
                  <img
                    src={combo.image}
                    alt={combo.name}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base truncate">{combo.name}</h3>
                      {combo.badge && <Badge variant="gold">{combo.badge}</Badge>}
                    </div>
                    <p className="text-[#B3B3B3] text-xs mt-1 line-clamp-2">{combo.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[#FFB703] font-bold text-base">{combo.price.toLocaleString('vi-VN')}đ</span>
                      {combo.originalPrice > combo.price && (
                        <span className="text-[#525252] text-xs line-through">
                          {combo.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={qty <= 0}
                      onClick={() => updateQty(combo.id, -1)}
                      className="w-8 h-8 rounded bg-[#383838] text-white disabled:opacity-40"
                    >-</button>
                    <span className="w-8 text-center text-white font-bold">{qty}</span>
                    <button
                      onClick={() => updateQty(combo.id, 1)}
                      className="w-8 h-8 rounded bg-[#383838] text-white"
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right sidebar */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 h-fit space-y-4">
            <h3 className="text-white font-bold text-base">Tổng Đơn Hàng</h3>

            <div className="space-y-2 text-sm text-[#B3B3B3]">
              <div className="flex justify-between">
                <span>Tiền vé ({selectedSeats.length} ghế):</span>
                <span className="text-white">{ticketTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền combo bắp nước:</span>
                <span className="text-white">{comboTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <div className="border-t border-[#404040] pt-3 flex justify-between items-center">
              <span className="text-white font-bold">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-[#FFB703]">
                {grandTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <Link
              href={`/payment?screeningId=${screening.id}&movieId=${movie.id}&seats=${selectedSeats.join(',')}&total=${grandTotal}`}
              className="w-full block text-center py-3 bg-[#E63946] hover:bg-[#C62B36] text-white font-bold rounded-lg transition-all"
            >
              Tiến hành thanh toán →
            </Link>

            <Link
              href={`/payment?screeningId=${screening.id}&movieId=${movie.id}&seats=${selectedSeats.join(',')}&total=${ticketTotal}`}
              className="w-full block text-center py-2 text-[#B3B3B3] hover:text-white text-xs transition-colors"
            >
              Bỏ qua combo, thanh toán vé ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
