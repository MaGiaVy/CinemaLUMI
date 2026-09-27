import { useState } from 'react';
import { Movie, Screening } from '@/data/mockData';
import SeatMap from '@/components/ui/SeatMap';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface SeatSelectionPageProps {
  movie: Movie;
  screening: Screening;
  onNavigate: (page: string, data?: unknown) => void;
}

const STEPS = ['Chọn ghế', 'Loại vé', 'Combo & Thanh toán', 'Xác nhận'];

export default function SeatSelectionPage({ movie, screening, onNavigate }: SeatSelectionPageProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const toggleSeat = (seat: string) => {
    setSelectedSeats(prev =>
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const totalPrice = selectedSeats.length * screening.price;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                i === 0 ? 'step-active' : 'step-inactive'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {i + 1}
                </span>
                {step}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#404040]">→</span>}
            </div>
          ))}
        </div>

        {/* Movie header */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">{movie.title}</h2>
              <div className="flex gap-4 mt-1 flex-wrap text-sm text-[#B3B3B3]">
                <span>📅 {screening.date}</span>
                <span>🕐 {screening.time}</span>
                <span>🎭 {screening.room}</span>
              </div>
            </div>
            <CountdownTimer />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Seat map */}
          <div className="flex-1">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6">
              <SeatMap selectedSeats={selectedSeats} onToggleSeat={toggleSeat} />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 sticky top-24">
              <h3 className="text-white font-bold text-base mb-4">Ghế đã chọn</h3>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-4xl mb-2">🪑</p>
                  <p className="text-[#B3B3B3] text-sm">Chưa chọn ghế nào</p>
                  <p className="text-[#525252] text-xs mt-1">Nhấn vào ghế màu xám để chọn</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {selectedSeats.map(seat => (
                    <div key={seat} className="flex items-center justify-between bg-[#383838] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#FFB703] rounded flex items-center justify-center text-[#1A1A1A] text-xs font-bold">
                          {seat[0]}
                        </span>
                        <span className="text-white text-sm font-medium">Ghế {seat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#B3B3B3] text-xs">{screening.price.toLocaleString('vi-VN')}đ</span>
                        <button
                          onClick={() => toggleSeat(seat)}
                          className="text-[#E63946] hover:text-red-300 text-sm"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-[#404040] pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[#B3B3B3] text-sm">Số ghế:</span>
                  <span className="text-white font-semibold">{selectedSeats.length}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-[#B3B3B3] text-sm">Tạm tính:</span>
                  <span className="text-[#FFB703] font-bold text-lg">{totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedSeats([])}>
                    Xóa
                  </Button>
                  <Button
                    fullWidth
                    disabled={selectedSeats.length === 0}
                    onClick={() => onNavigate('ticket-type', { movie, screening, selectedSeats, basePrice: totalPrice })}
                  >
                    Tiếp theo →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
