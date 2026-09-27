'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Movie, Screening, Voucher } from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface TicketTypeClientProps {
  movie: Movie;
  screening: Screening;
  selectedSeats: string[];
  basePrice: number;
  vouchers: Voucher[];
}

export default function TicketTypeClient({
  movie,
  screening,
  selectedSeats,
  basePrice,
  vouchers,
}: TicketTypeClientProps) {
  const totalSeats = selectedSeats.length;
  const [normalQty, setNormalQty] = useState(totalSeats);
  const [childQty, setChildQty] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');

  const singleSeatPrice = Math.round(basePrice / (totalSeats || 1));
  const childPrice = Math.round(singleSeatPrice * 0.5);

  const subtotal = normalQty * singleSeatPrice + childQty * childPrice;
  const discountAmount = appliedVoucher
    ? appliedVoucher.discountType === 'percent'
      ? Math.round((subtotal * appliedVoucher.discountValue) / 100)
      : appliedVoucher.discountValue
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const canContinue = normalQty + childQty === totalSeats;

  const handleApplyVoucher = () => {
    setVoucherError('');
    const found = vouchers.find(
      v => v.code.toUpperCase() === voucherCode.trim().toUpperCase() && v.status === 'active'
    );
    if (!found) {
      setVoucherError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      return;
    }
    setAppliedVoucher(found);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black text-white mb-2">Chọn Loại Vé & Khuyến Mãi</h1>
        <p className="text-[#B3B3B3] text-sm mb-6">
          {movie.title} • {screening.room} • {screening.date} {screening.time}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main selection */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-white font-bold">Vé Thường (Người lớn)</h3>
                  <p className="text-[#B3B3B3] text-xs">Áp dụng từ 13 tuổi trở lên</p>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{singleSeatPrice.toLocaleString('vi-VN')}đ</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      disabled={normalQty <= 0}
                      onClick={() => setNormalQty(q => Math.max(0, q - 1))}
                      className="w-8 h-8 rounded bg-[#383838] text-white disabled:opacity-40"
                    >-</button>
                    <span className="w-8 text-center text-white font-bold">{normalQty}</span>
                    <button
                      disabled={normalQty + childQty >= totalSeats}
                      onClick={() => setNormalQty(q => q + 1)}
                      className="w-8 h-8 rounded bg-[#383838] text-white disabled:opacity-40"
                    >+</button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[#404040]">
                <div>
                  <h3 className="text-white font-bold">Vé Trẻ Em (Giảm 50%)</h3>
                  <p className="text-[#B3B3B3] text-xs">Dưới 13 tuổi (yêu cầu giấy tờ khi soát vé)</p>
                </div>
                <div className="text-right">
                  <div className="text-[#2ECC71] font-bold">{childPrice.toLocaleString('vi-VN')}đ</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      disabled={childQty <= 0}
                      onClick={() => setChildQty(q => Math.max(0, q - 1))}
                      className="w-8 h-8 rounded bg-[#383838] text-white disabled:opacity-40"
                    >-</button>
                    <span className="w-8 text-center text-white font-bold">{childQty}</span>
                    <button
                      disabled={normalQty + childQty >= totalSeats}
                      onClick={() => setChildQty(q => q + 1)}
                      className="w-8 h-8 rounded bg-[#383838] text-white disabled:opacity-40"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Voucher box */}
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
              <h3 className="text-white font-bold mb-3">Mã Giảm Giá / Voucher</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã voucher (VD: LUMI20, CHAOMUNG)"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white uppercase text-sm"
                />
                <Button onClick={handleApplyVoucher}>Áp dụng</Button>
              </div>
              {voucherError && <p className="text-[#E63946] text-xs mt-2">{voucherError}</p>}
              {appliedVoucher && (
                <div className="mt-3 p-2 bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded text-[#2ECC71] text-xs font-semibold flex justify-between items-center">
                  <span>✓ Đã áp dụng mã {appliedVoucher.code} (-{appliedVoucher.discountValue}%)</span>
                  <button onClick={() => setAppliedVoucher(null)} className="text-[#B3B3B3] hover:text-white">✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Right total sidebar */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 h-fit space-y-4">
            <h3 className="text-white font-bold text-base">Tổng Đơn Hàng</h3>

            <div className="space-y-2 text-sm text-[#B3B3B3]">
              <div className="flex justify-between">
                <span>Số ghế đã chọn:</span>
                <span className="text-white font-bold">{totalSeats} ({selectedSeats.join(', ')})</span>
              </div>
              <div className="flex justify-between">
                <span>Vé thường ({normalQty}):</span>
                <span>{(normalQty * singleSeatPrice).toLocaleString('vi-VN')}đ</span>
              </div>
              {childQty > 0 && (
                <div className="flex justify-between">
                  <span>Vé trẻ em ({childQty}):</span>
                  <span>{(childQty * childPrice).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#2ECC71]">
                  <span>Giảm giá:</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>

            <div className="border-t border-[#404040] pt-3 flex justify-between items-center">
              <span className="text-white font-bold">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-[#FFB703]">{total.toLocaleString('vi-VN')}đ</span>
            </div>

            {!canContinue && (
              <p className="text-[#E63946] text-xs">
                Vui lòng phân bổ đủ số lượng vé cho {totalSeats} ghế (hiện tại: {normalQty + childQty}/{totalSeats})
              </p>
            )}

            <Link
              href={`/combo-checkout?screeningId=${screening.id}&movieId=${movie.id}&seats=${selectedSeats.join(',')}&total=${total}`}
              className={`w-full block text-center py-3 bg-[#E63946] hover:bg-[#C62B36] text-white font-bold rounded-lg transition-all ${
                !canContinue ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              Tiếp tục chọn Combo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
