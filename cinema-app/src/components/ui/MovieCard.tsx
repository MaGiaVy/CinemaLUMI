'use client';

import { Movie, Screening } from '@/data/mockData';
import Badge from './Badge';
import StarRating from './StarRating';

interface MovieCardProps {
  movie: Movie;
  screenings?: Screening[];
  onSelect?: (movie: Movie, screening?: Screening) => void;
  compact?: boolean;
}

export default function MovieCard({ movie, screenings = [], onSelect, compact = false }: MovieCardProps) {
  const availabilityStatus = (s: Screening) => {
    const pct = s.availableSeats / s.totalSeats;
    if (pct > 0.3) return { label: 'Đủ chỗ', variant: 'green' as const };
    if (pct > 0) return { label: 'Gần hết', variant: 'gold' as const };
    return { label: 'Hết chỗ', variant: 'red' as const };
  };

  if (compact) {
    return (
      <div
        className="flex gap-3 bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden card-hover cursor-pointer"
        onClick={() => onSelect?.(movie)}
      >
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-16 h-24 object-cover flex-shrink-0"
        />
        <div className="py-3 pr-3 flex flex-col justify-between flex-1">
          <div>
            <p className="font-semibold text-white text-sm line-clamp-2">{movie.title}</p>
            <p className="text-[#B3B3B3] text-xs mt-1">{movie.duration} phút</p>
          </div>
          <div className="flex items-center gap-1">
            <StarRating value={movie.rating} readonly size="sm" />
            <span className="text-[#FFB703] text-xs font-bold">{movie.rating}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden card-hover">
      <div className="relative cursor-pointer" onClick={() => onSelect?.(movie)}>
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full aspect-[2/3] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {movie.genre.map(g => (
            <Badge key={g} variant="blue" size="sm">{g}</Badge>
          ))}
        </div>
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 bg-[#1A1A1A]/80 rounded px-2 py-1">
            <span className="text-[#FFB703]">★</span>
            <span className="text-white text-sm font-bold">{movie.rating}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-white text-base leading-tight mb-1 line-clamp-2 cursor-pointer hover:text-[#E63946] transition-colors" onClick={() => onSelect?.(movie)}>
          {movie.title}
        </h3>
        <p className="text-[#B3B3B3] text-xs mb-3">{movie.duration} phút • {movie.director}</p>

        {screenings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {screenings.slice(0, 4).map(s => {
              const av = availabilityStatus(s);
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect?.(movie, s)}
                  className="flex flex-col items-center px-3 py-2 bg-[#383838] hover:bg-[#404040] border border-[#404040] hover:border-[#525252] rounded-lg transition-all duration-150"
                >
                  <span className="text-white font-semibold text-sm">{s.time}</span>
                  <span className="text-[#B3B3B3] text-[10px]">{s.room}</span>
                  <Badge variant={av.variant} size="sm">{av.label}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
