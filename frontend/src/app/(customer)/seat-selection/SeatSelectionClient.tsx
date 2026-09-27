'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Movie, Screening } from '@/lib/api';
import SeatMap from '@/components/ui/SeatMap';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface SeatSelectionClientProps {
  movie: Movie;
  screening: Screening;
}

export default function SeatSelectionClient({ movie, screening }: SeatSelectionClientProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['E5', 'E6']);

  const handleToggle = (seat: string) => {
    setSelectedSeats(prev =>
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const totalPrice = selectedSeats.length * screening.price;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/movies/${movie.id}`} className="text-[#B3B3B3] hover:text-white text-xs">
                ← {movie.title}
              </Link>
            </div>
            <h1 className="text-2xl font-black text-white">{movie.title}</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">
              {screening.room} • {screening.date} • <span className="text-[#FFB703] font-bold">{screening.time}</span>
            </p>
          </div>
          <CountdownTimer />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2 bg-[#2D2D2D] border border-[#404040] rounded-xl p-6">
            <SeatMap selectedSeats={selectedSeats} onToggleSeat={handleToggle} />
          </div>

          {/* Booking summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 sticky top-24">
              <h2 className="text-white font-bold text-lg mb-4">Thông Tin Đặt Chỗ</h2>

              <div className="space-y-3 text-sm text-[#B3B3B3] mb-6">
                <div className="flex justify-between">
                  <span>Phòng chiếu:</span>
                  <span className="text-white font-semibold">{screening.room}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giờ chiếu:</span>
                  <span className="text-[#FFB703] font-bold">{screening.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá vé cơ bản:</span>
                  <span className="text-white font-semibold">{screening.price.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Selected seats list */}
              <div className="border-t border-[#404040] pt-4 mb-6">
                <p className="text-white text-sm font-semibold mb-2">Ghế đang chọn ({selectedSeats.length}):</p>
                {selectedSeats.length === 0 ? (
                  <p className="text-[#B3B3B3] text-xs italic">Vui lòng chọn ghế trên sơ đồ</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeats.map(seat => (
                      <span key={seat} className="bg-[#FFB703] text-[#1A1A1A] font-bold text-xs px-2.5 py-1 rounded">
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Total & proceed */}
              <div className="border-t border-[#404040] pt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-white font-medium">Tạm tính:</span>
                  <span className="text-2xl font-black text-[#FFB703]">
                    {totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <Link
                  href={`/ticket-type?screeningId=${screening.id}&movieId=${movie.id}&seats=${selectedSeats.join(',')}&basePrice=${totalPrice}`}
                  className={`w-full block text-center py-3 bg-[#E63946] hover:bg-[#C62B36] text-white font-bold rounded-lg transition-all ${
                    selectedSeats.length === 0 ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  Tiếp tục chọn loại vé →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
