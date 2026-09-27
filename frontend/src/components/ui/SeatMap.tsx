'use client';

import { SEAT_ROWS, SEAT_COLS, OCCUPIED_SEATS } from '@/data/mockData';

interface SeatMapProps {
  selectedSeats: string[];
  onToggleSeat: (seat: string) => void;
}

export default function SeatMap({ selectedSeats, onToggleSeat }: SeatMapProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Screen */}
      <div className="w-full max-w-lg">
        <div className="h-2 bg-gradient-to-b from-[#E63946]/60 to-transparent rounded-t-full mx-8 mb-1" />
        <div className="text-center text-[#B3B3B3] text-xs tracking-widest uppercase">Màn hình</div>
      </div>

      {/* Seat grid */}
      <div className="flex flex-col gap-2">
        {SEAT_ROWS.map(row => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="text-[#B3B3B3] text-xs w-4 text-right font-mono">{row}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: SEAT_COLS }, (_, i) => {
                const seatId = `${row}${i + 1}`;
                const isOccupied = OCCUPIED_SEATS.includes(seatId);
                const isSelected = selectedSeats.includes(seatId);

                let bgColor = '#404040';
                let cursor = 'cursor-pointer';
                let title = seatId;

                if (isOccupied) {
                  bgColor = '#E63946';
                  cursor = 'cursor-not-allowed';
                  title = `${seatId} - Đã đặt`;
                } else if (isSelected) {
                  bgColor = '#FFB703';
                  title = `${seatId} - Đã chọn`;
                }

                return (
                  <button
                    key={seatId}
                    title={title}
                    disabled={isOccupied}
                    onClick={() => !isOccupied && onToggleSeat(seatId)}
                    className={`w-7 h-7 rounded-t-md text-[10px] font-medium transition-all duration-150 border-0 ${cursor} ${
                      isSelected && !isOccupied ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: bgColor,
                      color: isSelected ? '#1A1A1A' : isOccupied ? '#fff' : '#B3B3B3',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <span className="text-[#B3B3B3] text-xs w-4 font-mono">{row}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-2">
        {[
          { color: '#404040', label: 'Trống' },
          { color: '#E63946', label: 'Đã đặt' },
          { color: '#FFB703', label: 'Đang chọn' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-t-md" style={{ backgroundColor: color }} />
            <span className="text-[#B3B3B3] text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
