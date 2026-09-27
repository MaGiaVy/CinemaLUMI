import { useState } from 'react';
import { Movie, Screening } from '@/data/mockData';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface TicketTypePageProps {
  movie: Movie;
  screening: Screening;
  selectedSeats: string[];
  basePrice: number;
  onNavigate: (page: string, data?: unknown) => void;
}

const STEPS = ['Chọn ghế', 'Loại vé', 'Combo & Thanh toán', 'Xác nhận'];

export default function TicketTypePage({ movie, screening, selectedSeats, basePrice, onNavigate }: TicketTypePageProps) {
  const [normalQty, setNormalQty] = useState(selectedSeats.length);
  const [childQty, setChildQty] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');

  const normalPrice = screening.price;
  const childPrice = Math.round(screening.price * 0.5);

  const subtotal = normalQty * normalPrice + childQty * childPrice;
  const discountAmount = appliedVoucher ? Math.round(subtotal * (appliedVoucher.discount / 100)) : 0;
  const total = subtotal - discountAmount;

  const totalTickets = normalQty + childQty;

  const applyVoucher = () => {
    setVoucherError('');
    if (voucherCode.toUpperCase() === 'LUMI20') {
      setAppliedVoucher({ code: 'LUMI20', discount: 20 });
    } else if (voucherCode.toUpperCase() === 'NEWUSER') {
      setAppliedVoucher({ code: 'NEWUSER', discount: 15 });
    } else {
      setVoucherError('Mã voucher không hợp lệ hoặc đã hết hạn.');
    }
  };

  const canContinue = totalTickets === selectedSeats.length;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                i === 1 ? 'step-active' : i < 1 ? 'step-done' : 'step-inactive'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {i < 1 ? '✓' : i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#404040]">→</span>}
            </div>
          ))}
        </div>

        {/* Movie info */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
            <div>
              <h2 className="text-white font-bold">{movie.title}</h2>
              <p className="text-[#B3B3B3] text-sm">{screening.date} • {screening.time} • {screening.room}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {selectedSeats.map(s => (
                  <Badge key={s} variant="gold" size="sm">Ghế {s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ticket type selector */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-base">Chọn Loại Vé</h3>

            {!canContinue && (
              <div className="bg-[#FFB703]/10 border border-[#FFB703]/30 rounded-xl p-3 text-[#FFB703] text-sm">
                ⚠️ Vui lòng chọn tổng cộng {selectedSeats.length} vé (hiện tại: {totalTickets})
              </div>
            )}

            {/* Normal ticket */}
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">Vé Thường</h4>
                  <p className="text-[#B3B3B3] text-xs">Dành cho khán giả từ 13 tuổi trở lên</p>
                </div>
                <span className="text-[#FFB703] font-bold">{normalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNormalQty(q => Math.max(0, q - 1))}
                  className="w-8 h-8 bg-[#383838] hover:bg-[#404040] rounded-lg text-white font-bold flex items-center justify-center transition-colors"
                  style={{ border: '1px solid #404040', cursor: 'pointer' }}
                >
                  −
                </button>
                <span className="text-white font-bold text-lg w-8 text-center">{normalQty}</span>
                <button
                  onClick={() => setNormalQty(q => Math.min(selectedSeats.length, q + 1))}
                  className="w-8 h-8 bg-[#383838] hover:bg-[#404040] rounded-lg text-white font-bold flex items-center justify-center transition-colors"
                  style={{ border: '1px solid #404040', cursor: 'pointer' }}
                >
                  +
                </button>
                <span className="text-[#B3B3B3] text-sm ml-2">= {(normalQty * normalPrice).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Child ticket */}
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">Vé Trẻ em</h4>
                  <p className="text-[#B3B3B3] text-xs">Dành cho trẻ em dưới 13 tuổi — Giảm 50%</p>
                  <Badge variant="green" size="sm">-50%</Badge>
                </div>
                <span className="text-[#FFB703] font-bold">{childPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChildQty(q => Math.max(0, q - 1))}
                  className="w-8 h-8 bg-[#383838] hover:bg-[#404040] rounded-lg text-white font-bold flex items-center justify-center transition-colors"
                  style={{ border: '1px solid #404040', cursor: 'pointer' }}
                >
                  −
                </button>
                <span className="text-white font-bold text-lg w-8 text-center">{childQty}</span>
                <button
                  onClick={() => setChildQty(q => Math.min(selectedSeats.length, q + 1))}
                  className="w-8 h-8 bg-[#383838] hover:bg-[#404040] rounded-lg text-white font-bold flex items-center justify-center transition-colors"
                  style={{ border: '1px solid #404040', cursor: 'pointer' }}
                >
                  +
                </button>
                <span className="text-[#B3B3B3] text-sm ml-2">= {(childQty * childPrice).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Voucher */}
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3">Mã Voucher</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã voucher (VD: LUMI20)"
                  value={voucherCode}
                  onChange={e => { setVoucherCode(e.target.value); setVoucherError(''); }}
                  className="flex-1"
                />
                <Button size="sm" variant="secondary" onClick={applyVoucher} disabled={!voucherCode}>
                  Áp dụng
                </Button>
              </div>
              {voucherError && <p className="text-[#E63946] text-xs mt-2">{voucherError}</p>}
              {appliedVoucher && (
                <div className="flex items-center justify-between mt-2 bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-lg p-2">
                  <span className="text-[#2ECC71] text-sm">✓ Áp dụng {appliedVoucher.code} — Giảm {appliedVoucher.discount}%</span>
                  <button
                    onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}
                    className="text-[#B3B3B3] hover:text-white text-xs"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Price breakdown */}
          <div>
            <h3 className="text-white font-bold text-base mb-4">Tổng Kết</h3>
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 space-y-3">
              {normalQty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#B3B3B3]">Vé Thường × {normalQty}</span>
                  <span className="text-white">{(normalQty * normalPrice).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {childQty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#B3B3B3]">Vé Trẻ em × {childQty}</span>
                  <span className="text-white">{(childQty * childPrice).toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-[#B3B3B3]">Tạm tính</span>
                <span className="text-white">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>

              {appliedVoucher && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#2ECC71]">Giảm giá ({appliedVoucher.discount}%)</span>
                  <span className="text-[#2ECC71]">−{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              <div className="border-t border-[#404040] pt-3">
                <div className="flex justify-between">
                  <span className="text-white font-bold">Tổng cộng</span>
                  <span className="text-[#FFB703] font-black text-xl">{total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                disabled={!canContinue}
                onClick={() => onNavigate('combo-checkout', {
                  movie, screening, selectedSeats,
                  normalQty, childQty,
                  subtotal, discountAmount, total, appliedVoucher
                })}
              >
                Tiếp tục chọn Combo →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
