import { useState } from 'react';
import { movies, screenings, reviews } from '@/data/mockData';
import { Movie, Screening } from '@/data/mockData';
import MovieCard from '@/components/ui/MovieCard';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';

interface MovieSchedulePageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const DATES = [
  { label: 'Hôm nay', value: '2026-09-25' },
  { label: 'T6 26/9', value: '2026-09-26' },
  { label: 'T7 27/9', value: '2026-09-27' },
  { label: 'CN 28/9', value: '2026-09-28' },
  { label: 'T2 29/9', value: '2026-09-29' },
];

const GENRES = ['Tất cả', 'Hành động', 'Hài', 'Hoạt hình', 'Tâm lý', 'Siêu anh hùng'];

export default function MovieSchedulePage({ onNavigate }: MovieSchedulePageProps) {
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [sidebarMovie, setSidebarMovie] = useState<Movie>(movies[0]);

  const showingMovies = movies.filter(m =>
    m.status === 'showing' &&
    (selectedGenre === 'Tất cả' || m.genre.some(g => g === selectedGenre))
  );

  const getScreeningsForMovie = (movieId: string): Screening[] =>
    screenings.filter(s => s.movieId === movieId && s.date === DATES[selectedDate].value);

  const movieReviews = reviews.filter(r => r.movieId === sidebarMovie.id).slice(0, 3);

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

            {/* Movie list with showtimes */}
            <div className="space-y-4">
              {showingMovies.map(movie => {
                const movieScreenings = getScreeningsForMovie(movie.id);
                return (
                  <div
                    key={movie.id}
                    className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 hover:border-[#525252] transition-colors"
                  >
                    <div className="flex gap-4">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-20 h-28 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                        onClick={() => setSidebarMovie(movie)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className="font-bold text-white text-base hover:text-[#E63946] cursor-pointer transition-colors"
                              onClick={() => setSidebarMovie(movie)}
                            >
                              {movie.title}
                            </h3>
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
                                <button
                                  key={s.id}
                                  disabled={s.availableSeats === 0}
                                  onClick={() => onNavigate('seat-selection', { movie, screening: s })}
                                  className="flex flex-col items-center px-4 py-2 bg-[#383838] hover:bg-[#404040] disabled:opacity-40 disabled:cursor-not-allowed border border-[#404040] rounded-lg transition-all"
                                  style={{ border: '1px solid #404040', cursor: s.availableSeats > 0 ? 'pointer' : 'not-allowed' }}
                                >
                                  <span className="text-white font-semibold text-sm">{s.time}</span>
                                  <span className="text-[#B3B3B3] text-[10px]">{s.room}</span>
                                  <Badge variant={v} size="sm">{label}</Badge>
                                </button>
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

          {/* Sidebar - movie info */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden sticky top-24">
              <img
                src={sidebarMovie.poster}
                alt={sidebarMovie.title}
                className="w-full aspect-[3/2] object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-white text-base mb-1">{sidebarMovie.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <StarRating value={sidebarMovie.rating} readonly size="sm" />
                  <span className="text-[#FFB703] font-bold text-sm">{sidebarMovie.rating}/5</span>
                </div>
                <div className="flex gap-1 flex-wrap mb-3">
                  {sidebarMovie.genre.map(g => <Badge key={g} variant="blue" size="sm">{g}</Badge>)}
                </div>
                <p className="text-[#B3B3B3] text-xs leading-relaxed mb-3 line-clamp-4">
                  {sidebarMovie.description}
                </p>
                <div className="text-xs text-[#B3B3B3] space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>Thời lượng:</span>
                    <span className="text-white">{sidebarMovie.duration} phút</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đạo diễn:</span>
                    <span className="text-white">{sidebarMovie.director}</span>
                  </div>
                </div>

                {/* Reviews */}
                {movieReviews.length > 0 && (
                  <div className="border-t border-[#404040] pt-3">
                    <p className="text-[#B3B3B3] text-xs font-semibold mb-2">Đánh giá gần đây</p>
                    <div className="space-y-2">
                      {movieReviews.map(r => (
                        <div key={r.id} className="bg-[#383838] rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-medium">{r.userName}</span>
                            <StarRating value={r.rating} readonly size="sm" />
                          </div>
                          <p className="text-[#B3B3B3] text-xs mt-1 line-clamp-2">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
