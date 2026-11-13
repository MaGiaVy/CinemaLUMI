'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getLocalDateString } from '@/lib/date-utils';

export interface CockpitMovie {
  id: string | number;
  title: string;
  poster: string;
  ageRating?: string;
  screenings?: Array<{
    id: number;
    room: string;
    date: string;
    startTime: string;
    price: number;
  }>;
}

interface CockpitBookingBarProps {
  movies: CockpitMovie[];
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '---';
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export default function CockpitBookingBar({ movies }: CockpitBookingBarProps) {
  const router = useRouter();

  const [selectedMovieId, setSelectedMovieId] = useState<string>(
    movies.length > 0 ? String(movies[0].id) : ''
  );
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedScreeningId, setSelectedScreeningId] = useState<string>('');

  // Phim đang được chọn
  const currentMovie = useMemo(() => {
    return movies.find(m => String(m.id) === String(selectedMovieId)) || movies[0];
  }, [movies, selectedMovieId]);

  // Danh sách các ngày chiếu có sẵn của phim
  const availableDates = useMemo(() => {
    if (!currentMovie?.screenings || currentMovie.screenings.length === 0) return [];
    const dateMap = new Map<string, string>();
    currentMovie.screenings.forEach(s => {
      const d = getLocalDateString(s.date || s.startTime);
      if (d && !dateMap.has(d)) {
        dateMap.set(d, formatDate(s.date || s.startTime));
      }
    });
    return Array.from(dateMap.entries()).map(([rawDate, label]) => ({ rawDate, label }));
  }, [currentMovie]);

  // Tự động chọn ngày đầu tiên nếu ngày hiện tại không hợp lệ
  const effectiveDate = useMemo(() => {
    if (availableDates.length === 0) return '';
    const exists = availableDates.some(d => d.rawDate === selectedDate);
    return exists ? selectedDate : availableDates[0].rawDate;
  }, [availableDates, selectedDate]);

  // Danh sách suất chiếu theo ngày đang chọn
  const availableScreenings = useMemo(() => {
    if (!currentMovie?.screenings || !effectiveDate) return [];
    return currentMovie.screenings.filter(s => {
      const d = getLocalDateString(s.date || s.startTime);
      return d === effectiveDate;
    });
  }, [currentMovie, effectiveDate]);

  // Tự động chọn suất chiếu đầu tiên
  const effectiveScreeningId = useMemo(() => {
    if (availableScreenings.length === 0) return '';
    const exists = availableScreenings.some(s => String(s.id) === String(selectedScreeningId));
    return exists ? selectedScreeningId : String(availableScreenings[0].id);
  }, [availableScreenings, selectedScreeningId]);

  const handleBooking = () => {
    if (effectiveScreeningId) {
      router.push(`/screenings/${effectiveScreeningId}/seats`);
    } else if (currentMovie?.id) {
      router.push(`/movies/${currentMovie.id}`);
    } else {
      router.push('/#showing');
    }
  };

  return (
    <div className="relative -mt-10 sm:-mt-12 z-30 max-w-6xl mx-auto px-4 w-full">
      <div className="bg-[rgba(18,14,28,0.85)] border border-[rgba(192,132,252,0.25)] backdrop-blur-2xl rounded-2xl p-4 sm:p-5 shadow-[0_15px_40px_rgba(5,5,8,0.8)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#E11D48] shadow-[0_0_8px_rgba(225,29,72,0.9)] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#FDA4AF]">
            ✦ BUỒNG LÁI ĐẶT VÉ NHANH
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
          {/* Bước 1: Chọn Phim */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              1. Chọn Phim
            </label>
            <select
              value={selectedMovieId}
              onChange={e => {
                setSelectedMovieId(e.target.value);
                setSelectedDate('');
                setSelectedScreeningId('');
              }}
              className="w-full bg-[rgba(10,8,18,0.95)] border border-[rgba(192,132,252,0.2)] rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-[#F8FAFC] focus:border-[#E11D48] transition cursor-pointer"
            >
              {movies.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} {m.ageRating ? `(${m.ageRating})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Bước 2: Chọn Ngày */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              2. Chọn Ngày Chiếu
            </label>
            <select
              value={effectiveDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setSelectedScreeningId('');
              }}
              disabled={availableDates.length === 0}
              className="w-full bg-[rgba(10,8,18,0.95)] border border-[rgba(192,132,252,0.2)] rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-[#F8FAFC] focus:border-[#E11D48] transition cursor-pointer disabled:opacity-40"
            >
              {availableDates.length > 0 ? (
                availableDates.map(d => (
                  <option key={d.rawDate} value={d.rawDate}>
                    {d.label}
                  </option>
                ))
              ) : (
                <option value="">Chưa có lịch chiếu</option>
              )}
            </select>
          </div>

          {/* Bước 3: Chọn Suất Chiếu & Phòng */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              3. Suất Chiếu & Phòng
            </label>
            <select
              value={effectiveScreeningId}
              onChange={e => setSelectedScreeningId(e.target.value)}
              disabled={availableScreenings.length === 0}
              className="w-full bg-[rgba(10,8,18,0.95)] border border-[rgba(192,132,252,0.2)] rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-[#F8FAFC] focus:border-[#E11D48] transition cursor-pointer disabled:opacity-40"
            >
              {availableScreenings.length > 0 ? (
                availableScreenings.map(s => (
                  <option key={s.id} value={s.id}>
                    {formatTime(s.startTime)} · Phòng {s.room} ({Number(s.price).toLocaleString('vi-VN')}đ)
                  </option>
                ))
              ) : (
                <option value="">Xem chi tiết phim</option>
              )}
            </select>
          </div>

          {/* Nút Đặt Vé Nhanh */}
          <div className="sm:pt-5 lg:pt-5">
            <button
              type="button"
              onClick={handleBooking}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#F43F5E] hover:to-[#BE123C] text-[#F8FAFC] font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(225,29,72,0.5)] border border-rose-500/40 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Mua Vé Nhanh</span>
              <span className="text-sm font-bold">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
