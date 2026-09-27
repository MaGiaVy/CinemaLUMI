import { useState } from 'react';
import { movies, screenings } from '@/data/mockData';
import { Movie, Screening } from '@/data/mockData';
import MovieCard from '@/components/ui/MovieCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Footer from '@/components/layout/Footer';
import StarRating from '@/components/ui/StarRating';

interface LandingPageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const DATES = ['Hôm nay', 'T6 26/9', 'T7 27/9', 'CN 28/9', 'T2 29/9'];
const GENRES = ['Tất cả', 'Hành động', 'Hài', 'Hoạt hình', 'Tâm lý', 'Âm nhạc', 'Siêu anh hùng'];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');

  const heroMovies = movies.filter(m => m.status === 'showing').slice(0, 4);
  const hero = heroMovies[heroIdx];

  const showingMovies = movies.filter(m => m.status === 'showing');
  const filteredMovies = showingMovies.filter(m =>
    selectedGenre === 'Tất cả' || m.genre.some(g => g === selectedGenre)
  );

  const getScreeningsForMovie = (movieId: string): Screening[] =>
    screenings.filter(s => s.movieId === movieId).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Hero */}
      <section className="relative h-[520px] overflow-hidden">
        <img
          src={hero.banner}
          alt={hero.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />

        <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
          <div className="max-w-xl">
            <div className="flex gap-2 mb-4">
              {hero.genre.map(g => <Badge key={g} variant="red" size="md">{g}</Badge>)}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
              {hero.title}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <StarRating value={hero.rating} readonly size="sm" />
              <span className="text-[#FFB703] font-bold">{hero.rating}/5</span>
              <span className="text-[#B3B3B3]">•</span>
              <span className="text-[#B3B3B3] text-sm">{hero.duration} phút</span>
            </div>
            <p className="text-[#B3B3B3] text-sm leading-relaxed mb-6 line-clamp-3">
              {hero.description}
            </p>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => onNavigate('movie-details', hero)}>
                🎬 Đặt vé ngay
              </Button>
              <Button variant="secondary" size="lg" onClick={() => onNavigate('movie-details', hero)}>
                Xem chi tiết
              </Button>
            </div>
          </div>
        </div>

        {/* Hero navigation dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`rounded-full transition-all duration-200 ${i === heroIdx ? 'w-8 h-2 bg-[#E63946]' : 'w-2 h-2 bg-[#B3B3B3]/50 hover:bg-[#B3B3B3]'}`}
              style={{ border: 'none', cursor: 'pointer' }}
            />
          ))}
        </div>

        {/* Hero thumbnails */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
          {heroMovies.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setHeroIdx(i)}
              className={`w-16 h-22 rounded-lg overflow-hidden border-2 transition-all ${i === heroIdx ? 'border-[#E63946] scale-105' : 'border-[#404040] opacity-60 hover:opacity-100'}`}
              style={{ border: `2px solid ${i === heroIdx ? '#E63946' : '#404040'}`, cursor: 'pointer', background: 'none' }}
            >
              <img src={m.poster} alt={m.title} className="w-full h-full object-cover" style={{ height: '88px' }} />
            </button>
          ))}
        </div>
      </section>

      {/* Movie Schedule */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Lịch Chiếu Phim</h2>
            <p className="text-[#B3B3B3] text-sm mt-1">Chọn ngày và thể loại bạn muốn xem</p>
          </div>

          {/* Genre filter */}
          <div className="flex gap-2 flex-wrap">
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedGenre === g
                    ? 'bg-[#E63946] text-white'
                    : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040] hover:border-[#525252]'
                }`}
                style={{ border: `1px solid ${selectedGenre === g ? '#E63946' : '#404040'}`, cursor: 'pointer' }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Date tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
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

        {/* Movie Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredMovies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              screenings={getScreeningsForMovie(movie.id)}
              onSelect={(m, s) => {
                if (s) onNavigate('seat-selection', { movie: m, screening: s });
                else onNavigate('movie-details', m);
              }}
            />
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎬</p>
            <p className="text-[#B3B3B3]">Không có phim nào trong thể loại này.</p>
          </div>
        )}
      </section>

      {/* Coming Soon */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <h2 className="text-2xl font-black text-white mb-6">Phim Sắp Ra Mắt</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {movies.filter(m => m.status === 'coming_soon').map(movie => (
            <div key={movie.id} className="relative rounded-xl overflow-hidden card-hover cursor-pointer group" onClick={() => onNavigate('movie-details', movie)}>
              <img src={movie.poster} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/20 to-transparent" />
              <div className="absolute top-2 right-2">
                <Badge variant="gold" size="sm">Sắp ra mắt</Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-bold text-sm">{movie.title}</p>
                <p className="text-[#B3B3B3] text-xs mt-1">{movie.releaseDate}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
