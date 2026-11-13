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
    const rows = Array.from(new Set(seats.map(s => s.row))).sort();

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Màn Chiếu Cong Vô Cực Laser 4K */}
        <div className="w-full max-w-xl mx-auto px-4">
          <div className="relative mb-3">
            <div className="h-2.5 w-full bg-gradient-to-r from-transparent via-[#E11D48] to-transparent rounded-t-full shadow-[0_0_30px_rgba(225,29,72,0.85)]" />
            <div className="absolute inset-0 h-4 bg-gradient-to-b from-[#581C87]/40 to-transparent blur-md -top-1 pointer-events-none" />
          </div>
          <div className="text-center text-[#94A3B8] text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase">
            ✦ MÀN CHIẾU CONG LASER 4K ✦
          </div>
        </div>

        {/* Lưới 50 Ghế Vũ Trụ */}
        <div className="flex flex-col gap-2.5 py-4 overflow-x-auto max-w-full px-2">
          {rows.map(rowName => {
            const rowSeats = seats
              .filter(s => s.row === rowName)
              .sort((a, b) => a.number - b.number);

            return (
              <div key={rowName} className="flex items-center justify-center gap-2 sm:gap-2.5">
                <span className="text-[#94A3B8] text-xs w-4 text-right font-mono font-bold">
                  {rowName}
                </span>

                <div className="flex gap-1.5 sm:gap-2">
                  {rowSeats.map(seat => {
                    const isSelected = selectedSeatIds.includes(seat.id) || selectedSeats.includes(seat.code);
                    const isOccupied = seat.status === 'OCCUPIED';
                    const isReserved = seat.status === 'RESERVED';
                    const isUnavailable = isOccupied || isReserved;

                    let btnClass = 'bg-[rgba(18,14,28,0.85)] border border-[rgba(192,132,252,0.22)] text-[#94A3B8] hover:border-[#E11D48] hover:text-[#F8FAFC] hover:shadow-[0_0_12px_rgba(225,29,72,0.35)] cursor-pointer';
                    let title = `Ghế ${seat.code} - Trống`;

                    if (isOccupied) {
                      btnClass = 'bg-[rgba(20,18,30,0.5)] border border-slate-800/50 text-slate-600 cursor-not-allowed';
                      title = `Ghế ${seat.code} - Đã bán`;
                    } else if (isReserved) {
                      btnClass = 'bg-[rgba(136,19,55,0.3)] border border-rose-900/60 text-rose-300/40 cursor-not-allowed';
                      title = `Ghế ${seat.code} - Đang giữ chỗ tạm thời`;
                    } else if (isSelected) {
                      btnClass = 'bg-gradient-to-b from-[#E11D48] to-[#9F1239] text-[#F8FAFC] border border-[#FDA4AF] shadow-[0_0_14px_rgba(225,29,72,0.85)] font-bold scale-105 cursor-pointer';
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
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 ${btnClass}`}
                      >
                        {isOccupied ? '✕' : seat.number}
                      </button>
                    );
                  })}
                </div>

                <span className="text-[#94A3B8] text-xs w-4 font-mono font-bold">
                  {rowName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chú thích màu sắc chuẩn Cosmic Galaxy */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-2 pt-4 border-t border-[rgba(192,132,252,0.15)] w-full text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-t-sm bg-[rgba(18,14,28,0.85)] border border-[rgba(192,132,252,0.3)]" />
            <span className="text-[#94A3B8]">Ghế trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-t-sm bg-[#E11D48] border border-[#FDA4AF] shadow-[0_0_8px_rgba(225,29,72,0.6)]" />
            <span className="text-[#F8FAFC] font-medium">Đang chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-t-sm bg-[rgba(136,19,55,0.3)] border border-rose-900/60" />
            <span className="text-[#94A3B8]">Đang giữ chỗ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-t-sm bg-[rgba(20,18,30,0.5)] border border-slate-800/50 flex items-center justify-center text-[10px] text-slate-600">✕</div>
            <span className="text-[#94A3B8]">Đã bán</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback nếu chưa có dữ liệu seats
  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full">
      <div className="w-full max-w-xl mx-auto px-4">
        <div className="h-2.5 w-full bg-gradient-to-r from-transparent via-[#E11D48] to-transparent rounded-t-full shadow-[0_0_25px_rgba(225,29,72,0.8)]" />
        <div className="text-center text-[#94A3B8] text-xs tracking-[0.2em] uppercase mt-2">
          ✦ MÀN CHIẾU CONG ✦
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {DEFAULT_ROWS.map(row => (
          <div key={row} className="flex items-center gap-2">
            <span className="text-[#94A3B8] text-xs w-4 text-right font-mono">{row}</span>
            <div className="flex gap-2">
              {Array.from({ length: DEFAULT_COLS }).map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] text-[10px] flex items-center justify-center text-[#94A3B8]"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span className="text-[#94A3B8] text-xs w-4 font-mono">{row}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
