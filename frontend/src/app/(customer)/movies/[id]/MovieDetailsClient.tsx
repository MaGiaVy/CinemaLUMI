'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Movie, Screening, Review } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import MovieCard from '@/components/ui/MovieCard';

interface MovieDetailsClientProps {
  movie: Movie;
  initialScreenings: Screening[];
  reviews: Review[];
  relatedMovies: Movie[];
}

const DATES = ['Hôm nay', 'T6 26/9', 'T7 27/9', 'CN 28/9'];
const DATE_VALUES = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'];

export default function MovieDetailsClient({
  movie,
  initialScreenings,
  reviews,
  relatedMovies,
}: MovieDetailsClientProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);

  const movieScreenings = initialScreenings.filter(s => s.date === DATE_VALUES[selectedDate]);
  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : movie.rating;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Banner */}
      <div className="relative h-80">
        <img src={movie.banner} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/80 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10">
        <div className="flex gap-8 items-start">
          {/* Poster */}
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-44 rounded-xl border-2 border-[#404040] shadow-2xl flex-shrink-0 hidden md:block"
            style={{ aspectRatio: '2/3', objectFit: 'cover' }}
          />

          {/* Info */}
          <div className="flex-1 pt-32 md:pt-0">
            <div className="flex gap-2 flex-wrap mb-3">
              {movie.genre.map(g => <Badge key={g} variant="red" size="md">{g}</Badge>)}
              <Badge variant={movie.status === 'showing' ? 'green' : 'gold'} size="md">
                {movie.status === 'showing' ? 'Đang chiếu' : 'Sắp ra mắt'}
              </Badge>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">{movie.title}</h1>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(avgRating)} readonly />
                <span className="text-[#FFB703] font-bold text-lg">{avgRating.toFixed(1)}</span>
                <span className="text-[#B3B3B3] text-sm">({reviews.length} đánh giá)</span>
              </div>
              <span className="text-[#404040]">|</span>
              <span className="text-[#B3B3B3] text-sm">⏱️ {movie.duration} phút</span>
              <span className="text-[#404040]">|</span>
              <span className="text-[#B3B3B3] text-sm">📅 Khởi chiếu: {movie.releaseDate}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#B3B3B3] mb-6 max-w-xl">
              <div><span className="text-white font-medium">Đạo diễn:</span> {movie.director}</div>
              <div><span className="text-white font-medium">Diễn viên:</span> {movie.cast.join(', ')}</div>
            </div>

            {/* Description */}
            <div className="mb-6 max-w-2xl">
              <p className={`text-[#B3B3B3] text-sm leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
                {movie.description}
              </p>
              {movie.description.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[#E63946] text-xs font-semibold mt-1 hover:underline cursor-pointer"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {expanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Link
                href={`/movies/${movie.id}/rating`}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded bg-[#383838] text-white hover:bg-[#404040] text-sm font-semibold transition-all"
              >
                ⭐ Viết đánh giá
              </Link>
            </div>
          </div>
        </div>

        {/* Screening Schedule Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-black text-white mb-4">Lịch Chiếu & Suất Chiếu</h2>

          {/* Date tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {DATES.map((d, i) => (
              <button
                key={d}
                onClick={() => setSelectedDate(i)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  selectedDate === i
                    ? 'bg-[#E63946] text-white'
                    : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]'
                }`}
                style={{ border: `1px solid ${selectedDate === i ? '#E63946' : '#404040'}` }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Screenings */}
          {movieScreenings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {movieScreenings.map(s => {
                const pct = s.availableSeats / s.totalSeats;
                const v = pct > 0.3 ? 'green' : pct > 0 ? 'gold' : 'red';
                const label = pct > 0.3 ? 'Đủ chỗ' : pct > 0 ? 'Gần hết' : 'Hết chỗ';

                return (
                  <Link
                    key={s.id}
                    href={`/seat-selection?screeningId=${s.id}&movieId=${movie.id}`}
                    className={`bg-[#2D2D2D] hover:bg-[#383838] border border-[#404040] hover:border-[#E63946] rounded-xl p-4 text-center transition-all group ${
                      s.availableSeats === 0 ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <div className="text-xl font-black text-white group-hover:text-[#E63946] transition-colors">{s.time}</div>
                    <div className="text-xs text-[#B3B3B3] mt-0.5">{s.room}</div>
                    <div className="mt-2">
                      <Badge variant={v} size="sm">{label}</Badge>
                    </div>
                    <div className="text-xs text-[#FFB703] font-semibold mt-2">
                      {s.price.toLocaleString('vi-VN')}đ
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#2D2D2D] border border-[#404040] rounded-xl">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-[#B3B3B3]">Không có suất chiếu trong ngày này.</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-black text-white mb-4">Đánh Giá Phim ({reviews.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#E63946] rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {r.userName[0]}
                      </div>
                      <span className="text-white font-medium text-sm">{r.userName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating value={r.rating} readonly size="sm" />
                      <span className="text-[#FFB703] text-xs font-bold">{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-[#B3B3B3] text-sm leading-relaxed">{r.comment}</p>
                  <p className="text-[#525252] text-xs mt-2">{r.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related movies */}
        <div className="mt-10 mb-12">
          <h2 className="text-xl font-black text-white mb-4">Phim Đang Chiếu Khác</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedMovies.filter(m => m.id !== movie.id).slice(0, 4).map(m => (
              <Link key={m.id} href={`/movies/${m.id}`} className="block">
                <MovieCard movie={m} compact />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
