'use client';

export interface SeatData {
  id: number;
  code: string;
  row: string;
  number: number;
  type: 'STANDARD' | 'VIP' | 'COUPLE';
  status: 'EMPTY' | 'RESERVED' | 'OCCUPIED';
  reservedUntil?: Date | string | null;
}

interface SeatMapProps {
  seats?: SeatData[];
  selectedSeatIds?: number[];
  onToggleSeat?: (seat: SeatData) => void;
  // Hỗ trợ component cũ nếu chỉ truyền string
  selectedSeats?: string[];
  onToggleSeatLegacy?: (seatCode: string) => void;
}

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E'];
const DEFAULT_COLS = 10;

export default function SeatMap({
  seats,
  selectedSeatIds = [],
  onToggleSeat,
  selectedSeats = [],
  onToggleSeatLegacy,
}: SeatMapProps) {
  // Nếu có danh sách ghế thật từ API
  if (seats && seats.length > 0) {
    // Nhóm ghế theo hàng
    const rows = Array.from(new Set(seats.map(s => s.row))).sort();

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Màn hình chiếu */}
        <div className="w-full max-w-lg">
          <div className="h-2.5 bg-gradient-to-b from-[#E63946] via-[#E63946]/50 to-transparent rounded-t-full mx-6 mb-2 shadow-[0_-4px_12px_rgba(230,57,70,0.5)]" />
          <div className="text-center text-[#B3B3B3] text-xs font-semibold tracking-widest uppercase">
            MÀN HÌNH CHIẾU
          </div>
        </div>

        {/* Lưới ghế từ API */}
        <div className="flex flex-col gap-2.5 py-4 overflow-x-auto max-w-full px-2">
          {rows.map(rowName => {
            const rowSeats = seats
              .filter(s => s.row === rowName)
              .sort((a, b) => a.number - b.number);

            return (
              <div key={rowName} className="flex items-center justify-center gap-2">
                <span className="text-[#B3B3B3] text-xs w-4 text-right font-mono font-bold">
                  {rowName}
                </span>

                <div className="flex gap-2">
                  {rowSeats.map(seat => {
                    const isSelected = selectedSeatIds.includes(seat.id) || selectedSeats.includes(seat.code);
                    const isOccupied = seat.status === 'OCCUPIED';
                    const isReserved = seat.status === 'RESERVED';
                    const isUnavailable = isOccupied || isReserved;

                    let bgColor = '#404040';
                    let cursor = 'cursor-pointer';
                    let title = `Ghế ${seat.code}`;

                    if (isOccupied) {
                      bgColor = '#E63946';
                      cursor = 'cursor-not-allowed';
                      title = `Ghế ${seat.code} - Đã bán`;
                    } else if (isReserved) {
                      bgColor = '#802229';
                      cursor = 'cursor-not-allowed';
                      title = `Ghế ${seat.code} - Đang có người giữ chỗ`;
                    } else if (isSelected) {
                      bgColor = '#FFB703';
                      cursor = 'cursor-pointer';
                      title = `Ghế ${seat.code} - Đang chọn`;
                    }

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        title={title}
                        disabled={isUnavailable}
                        onClick={() => {
                          if (!isUnavailable) {
                            if (onToggleSeat) onToggleSeat(seat);
                            if (onToggleSeatLegacy) onToggleSeatLegacy(seat.code);
                          }
                        }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-md text-[10px] sm:text-xs font-semibold transition-all duration-150 border-0 ${cursor} ${
                          isSelected && !isUnavailable ? 'scale-110 shadow-lg ring-2 ring-[#FFB703]' : ''
                        }`}
                        style={{
                          backgroundColor: bgColor,
                          color: isSelected ? '#1A1A1A' : isUnavailable ? '#ffffff' : '#D4D4D4',
                        }}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
                </div>

                <span className="text-[#B3B3B3] text-xs w-4 font-mono font-bold">
                  {rowName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chú thích màu sắc */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-2 pt-4 border-t border-[#383838] w-full text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-t-sm" style={{ backgroundColor: '#404040' }} />
            <span className="text-[#B3B3B3]">Ghế trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-t-sm" style={{ backgroundColor: '#FFB703' }} />
            <span className="text-[#B3B3B3]">Đang chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-t-sm" style={{ backgroundColor: '#E63946' }} />
            <span className="text-[#B3B3B3]">Đã bán / Giữ chỗ</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback nếu chưa có dữ liệu seats
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="w-full max-w-lg">
        <div className="h-2 bg-gradient-to-b from-[#E63946]/60 to-transparent rounded-t-full mx-8 mb-1" />
        <div className="text-center text-[#B3B3B3] text-xs tracking-widest uppercase">Màn hình</div>
      </div>

      <div className="flex flex-col gap-2">
        {DEFAULT_ROWS.map(row => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="text-[#B3B3B3] text-xs w-4 text-right font-mono">{row}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: DEFAULT_COLS }, (_, i) => {
                const code = `${row}${i + 1}`;
                const isSelected = selectedSeats.includes(code);

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onToggleSeatLegacy && onToggleSeatLegacy(code)}
                    className={`w-7 h-7 rounded-t-md text-[10px] font-medium transition-all duration-150 border-0 cursor-pointer ${
                      isSelected ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#FFB703' : '#404040',
                      color: isSelected ? '#1A1A1A' : '#B3B3B3',
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
    </div>
  );
}
