'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Movie, Screening } from '@/lib/api';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Button from '@/components/ui/Button';

interface PaymentClientProps {
  movie: Movie;
  screening: Screening;
  selectedSeats: string[];
  total: number;
}

const METHODS = [
  { id: 'vnpay', label: 'VNPay', icon: '💳', description: 'Cổng thanh toán bảo mật VNPay' },
  { id: 'momo', label: 'Ví MoMo', icon: '📱', description: 'Thanh toán tức thì qua ví điện tử MoMo' },
  { id: 'banking', label: 'Chuyển Khoản Ngân Hàng', icon: '🏦', description: 'Quét mã VietQR chuyển khoản 24/7' },
];

export default function PaymentClient({
  movie,
  screening,
  selectedSeats,
  total,
}: PaymentClientProps) {
  const [method, setMethod] = useState('vnpay');
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const orderRef = `LMC-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const handlePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
    }, 1200);
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#2ECC71]/20 border-2 border-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-[#2ECC71] text-4xl">✓</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Thanh Toán Thành Công!</h1>
          <p className="text-[#B3B3B3] mb-6">Vé điện tử và mã QR đã được gửi về email của bạn.</p>

          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 mb-6">
            <div className="w-40 h-40 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }, (_, i) => (
                  <div key={i} className="w-5 h-5" style={{ background: (i % 2 === 0 || i % 3 === 0) ? '#000' : '#fff' }} />
                ))}
              </div>
            </div>
            <p className="text-[#B3B3B3] text-sm mb-1">Mã đặt chỗ</p>
            <p className="text-white font-mono font-bold text-lg">{orderRef}</p>
          </div>

          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#B3B3B3]">Phim:</span>
              <span className="text-white font-medium">{movie.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B3B3B3]">Suất chiếu:</span>
              <span className="text-white">{screening.date} {screening.time} ({screening.room})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B3B3B3]">Ghế:</span>
              <span className="text-white font-bold">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between border-t border-[#404040] pt-2">
              <span className="text-white font-bold">Đã thanh toán:</span>
              <span className="text-[#2ECC71] font-bold">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/my-tickets"
              className="flex-1 py-3 bg-[#383838] hover:bg-[#404040] text-white font-semibold rounded-lg text-sm text-center transition-all"
            >
              Xem vé của tôi
            </Link>
            <Link
              href={`/movies/${movie.id}/rating`}
              className="flex-1 py-3 bg-[#E63946] hover:bg-[#C62B36] text-white font-semibold rounded-lg text-sm text-center transition-all"
            >
              Đánh giá phim
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Thanh Toán Đơn Hàng</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">Chọn phương thức thanh toán an toàn tiện lợi</p>
          </div>
          <CountdownTimer />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Method options */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-white font-bold text-base">Phương thức thanh toán</h2>
            {METHODS.map(m => (
              <label
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  method === m.id
                    ? 'bg-[#2D2D2D] border-[#E63946]'
                    : 'bg-[#2D2D2D] border-[#404040] hover:border-[#525252]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="accent-[#E63946] w-4 h-4 cursor-pointer"
                />
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{m.label}</p>
                  <p className="text-[#B3B3B3] text-xs mt-0.5">{m.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Right summary */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 h-fit space-y-4">
            <h3 className="text-white font-bold text-base">Tóm Tắt Đặt Vé</h3>

            <div className="space-y-2 text-sm text-[#B3B3B3]">
              <div className="flex justify-between">
                <span>Phim:</span>
                <span className="text-white font-medium text-right line-clamp-1">{movie.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Phòng & Giờ:</span>
                <span className="text-white">{screening.room} • {screening.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Ghế:</span>
                <span className="text-[#FFB703] font-bold">{selectedSeats.join(', ')}</span>
              </div>
            </div>

            <div className="border-t border-[#404040] pt-3 flex justify-between items-center">
              <span className="text-white font-bold">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-[#FFB703]">
                {total.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={loading}
              onClick={handlePayment}
            >
              {loading ? 'Đang xử lý giao dịch...' : 'Xác nhận thanh toán'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
