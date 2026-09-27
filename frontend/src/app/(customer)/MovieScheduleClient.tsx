'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Movie, Screening, Review } from '@/lib/api';
import MovieCard from '@/components/ui/MovieCard';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';

interface MovieScheduleClientProps {
  initialMovies: Movie[];
  initialScreenings: Screening[];
  initialReviews: Review[];
}

const DATES = [
  { label: 'Hôm nay', value: '2026-09-25' },
  { label: 'T6 26/9', value: '2026-09-26' },
  { label: 'T7 27/9', value: '2026-09-27' },
  { label: 'CN 28/9', value: '2026-09-28' },
  { label: 'T2 29/9', value: '2026-09-29' },
];

const GENRES = ['Tất cả', 'Hành động', 'Hài', 'Hoạt hình', 'Tâm lý', 'Siêu anh hùng'];

export default function MovieScheduleClient({
  initialMovies,
  initialScreenings,
  initialReviews,
}: MovieScheduleClientProps) {
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [sidebarMovie, setSidebarMovie] = useState<Movie>(initialMovies[0] || {} as Movie);

  const showingMovies = initialMovies.filter(m =>
    m.status === 'showing' &&
    (selectedGenre === 'Tất cả' || m.genre.some(g => g === selectedGenre))
  );

  const getScreeningsForMovie = (movieId: string): Screening[] =>
    initialScreenings.filter(s => s.movieId === movieId && s.date === DATES[selectedDate].value);

  const movieReviews = initialReviews.filter(r => r.movieId === sidebarMovie.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Lịch Chiếu Phim</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Chọn ngày và suất chiếu phù hợp</p>
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {DATES.map((d, i) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                      selectedDate === i
                        ? 'bg-[#E63946] text-white'
                        : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]'
                    }`}
                    style={{ border: `1px solid ${selectedDate === i ? '#E63946' : '#404040'}`, cursor: 'pointer' }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                      selectedGenre === g
                        ? 'bg-[#E63946] text-white'
                        : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]'
                    }`}
                    style={{ border: `1px solid ${selectedGenre === g ? '#E63946' : '#404040'}`, cursor: 'pointer' }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Movie list */}
            <div className="space-y-4">
              {showingMovies.map(movie => {
                const movieScreenings = getScreeningsForMovie(movie.id);

                return (
                  <div
                    key={movie.id}
                    className="bg-[#2D2D2D] border border-[#404040] hover:border-[#525252] rounded-xl p-4 transition-all"
                  >
                    <div className="flex gap-4">
                      <Link href={`/movies/${movie.id}`}>
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-20 h-28 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/movies/${movie.id}`} className="block">
                              <h3
                                className="font-bold text-white text-base hover:text-[#E63946] cursor-pointer transition-colors"
                                onClick={() => setSidebarMovie(movie)}
                              >
                                {movie.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {movie.genre.map(g => <Badge key={g} variant="blue">{g}</Badge>)}
                              <span className="text-[#B3B3B3] text-xs">{movie.duration} phút</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <StarRating value={movie.rating} readonly size="sm" />
                              <span className="text-[#FFB703] text-xs font-bold">{movie.rating}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {movieScreenings.length === 0 ? (
                              <Badge variant="gray">Không có suất</Badge>
                            ) : (
                              <Badge variant="green">
                                {movieScreenings.reduce((a, s) => a + s.availableSeats, 0)} chỗ trống
                              </Badge>
                            )}
                          </div>
                        </div>

                        {movieScreenings.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {movieScreenings.map(s => {
                              const pct = s.availableSeats / s.totalSeats;
                              const v = pct > 0.3 ? 'green' : pct > 0 ? 'gold' : 'red';
                              const label = pct > 0.3 ? 'Đủ chỗ' : pct > 0 ? 'Gần hết' : 'Hết chỗ';
                              return (
                                <Link
                                  key={s.id}
                                  href={`/seat-selection?screeningId=${s.id}&movieId=${movie.id}`}
                                  className={`flex flex-col items-center px-4 py-2 bg-[#383838] hover:bg-[#404040] border border-[#404040] rounded-lg transition-all ${
                                    s.availableSeats === 0 ? 'opacity-40 pointer-events-none' : ''
                                  }`}
                                  style={{ border: '1px solid #404040' }}
                                >
                                  <span className="text-white font-semibold text-sm">{s.time}</span>
                                  <span className="text-[#B3B3B3] text-[10px]">{s.room}</span>
                                  <Badge variant={v} size="sm">{label}</Badge>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[#B3B3B3] text-sm mt-3">Không có suất chiếu trong ngày này.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 sticky top-24">
              <h2 className="text-white font-bold text-base mb-4">Thông Tin Phim</h2>

              {sidebarMovie.id && (
                <>
                  <div className="relative rounded-lg overflow-hidden mb-4">
                    <img
                      src={sidebarMovie.banner}
                      alt={sidebarMovie.title}
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
                  </div>

                  <h3 className="text-white font-black text-lg mb-1">{sidebarMovie.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating value={sidebarMovie.rating} readonly size="sm" />
                    <span className="text-[#FFB703] font-bold text-sm">{sidebarMovie.rating}/5</span>
                  </div>

                  <div className="space-y-2 text-xs text-[#B3B3B3] mb-4">
                    <p><span className="text-white font-medium">Đạo diễn:</span> {sidebarMovie.director}</p>
                    <p><span className="text-white font-medium">Thời lượng:</span> {sidebarMovie.duration} phút</p>
                    <p><span className="text-white font-medium">Khởi chiếu:</span> {sidebarMovie.releaseDate}</p>
                    <p className="line-clamp-3">{sidebarMovie.description}</p>
                  </div>

                  <Link
                    href={`/movies/${sidebarMovie.id}`}
                    className="w-full flex items-center justify-center py-2.5 bg-[#E63946] hover:bg-[#C62B36] text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    Xem chi tiết phim
                  </Link>

                  {/* Reviews */}
                  {movieReviews.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#404040]">
                      <h4 className="text-white font-semibold text-xs mb-3">Đánh giá nổi bật</h4>
                      <div className="space-y-2">
                        {movieReviews.map(r => (
                          <div key={r.id} className="bg-[#383838] rounded-lg p-2.5">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-white text-xs font-medium">{r.userName}</span>
                              <span className="text-[#FFB703] text-xs">★ {r.rating}</span>
                            </div>
                            <p className="text-[#B3B3B3] text-[11px] line-clamp-2">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
