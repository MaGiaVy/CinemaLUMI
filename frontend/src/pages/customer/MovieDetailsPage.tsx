import { useState } from 'react';
import { Movie, Screening, movies, screenings, reviews } from '@/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import MovieCard from '@/components/ui/MovieCard';

interface MovieDetailsPageProps {
  movie: Movie;
  onNavigate: (page: string, data?: unknown) => void;
}

const DATES = ['Hôm nay', 'T6 26/9', 'T7 27/9', 'CN 28/9'];
const DATE_VALUES = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'];

export default function MovieDetailsPage({ movie, onNavigate }: MovieDetailsPageProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);

  const movieScreenings = screenings.filter(s => s.movieId === movie.id && s.date === DATE_VALUES[selectedDate]);
  const movieReviews = reviews.filter(r => r.movieId === movie.id);
  const avgRating = movieReviews.length
    ? movieReviews.reduce((a, r) => a + r.rating, 0) / movieReviews.length
    : movie.rating;

  const relatedMovies = movies.filter(m => m.id !== movie.id && m.status === 'showing').slice(0, 4);

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
                <span className="text-[#B3B3B3] text-sm">({movieReviews.length} đánh giá)</span>
              </div>
              <span className="text-[#B3B3B3]">•</span>
              <span className="text-[#B3B3B3] text-sm">{movie.duration} phút</span>
              <span className="text-[#B3B3B3]">•</span>
              <span className="text-[#B3B3B3] text-sm">{movie.releaseDate}</span>
            </div>

            <div className="text-xs text-[#B3B3B3] space-y-1 mb-4">
              <p><span className="text-[#525252]">Đạo diễn:</span> <span className="text-white">{movie.director}</span></p>
              <p><span className="text-[#525252]">Diễn viên:</span> <span className="text-white">{movie.cast.join(', ')}</span></p>
            </div>

            <div className="mb-4">
              <p className={`text-[#B3B3B3] text-sm leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
                {movie.description}
              </p>
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-[#0088FF] text-sm mt-1 hover:underline"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {expanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-[#FFB703]">
                {movie.ticketPrice.toLocaleString('vi-VN')}đ
              </div>
              <span className="text-[#B3B3B3] text-sm">/ vé Thường</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="mt-10">
          <h2 className="text-xl font-black text-white mb-4">Xem Suất Chiếu</h2>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {DATES.map((d, i) => (
              <button
                key={d}
                onClick={() => setSelectedDate(i)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedDate === i
                    ? 'bg-[#E63946] text-white'
                    : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]'
                }`}
                style={{ border: `1px solid ${selectedDate === i ? '#E63946' : '#404040'}`, cursor: 'pointer' }}
              >
                {d}
              </button>
            ))}
          </div>

          {movieScreenings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {movieScreenings.map(s => {
                const pct = s.availableSeats / s.totalSeats;
                const v = pct > 0.3 ? 'green' : pct > 0 ? 'gold' : 'red';
                return (
                  <div key={s.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 hover:border-[#525252] transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-2xl font-black">{s.time}</span>
                      <Badge variant={v}>
                        {s.availableSeats}/{s.totalSeats} chỗ
                      </Badge>
                    </div>
                    <p className="text-[#B3B3B3] text-sm mb-1">{s.room}</p>
                    <p className="text-[#FFB703] font-semibold text-sm mb-4">{s.price.toLocaleString('vi-VN')}đ</p>
                    <div className="w-full bg-[#383838] rounded-full h-1.5 mb-4">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${((s.totalSeats - s.availableSeats) / s.totalSeats) * 100}%`,
                          backgroundColor: pct > 0.3 ? '#2ECC71' : pct > 0 ? '#FFB703' : '#E63946',
                        }}
                      />
                    </div>
                    <Button
                      fullWidth
                      disabled={s.availableSeats === 0}
                      onClick={() => onNavigate('seat-selection', { movie, screening: s })}
                    >
                      Chọn ghế
                    </Button>
                  </div>
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
        {movieReviews.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-black text-white mb-4">Đánh Giá Phim</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {movieReviews.map(r => (
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
          <h2 className="text-xl font-black text-white mb-4">Phim Đang Chiếu</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedMovies.map(m => (
              <MovieCard
                key={m.id}
                movie={m}
                compact
                onSelect={(mv) => onNavigate('movie-details', mv)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
