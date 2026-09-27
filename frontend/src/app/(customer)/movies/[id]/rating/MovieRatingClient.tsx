'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Movie, Review } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';

interface MovieRatingClientProps {
  movie: Movie;
  initialReviews: Review[];
}

export default function MovieRatingClient({ movie, initialReviews }: MovieRatingClientProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setToast('Vui lòng chọn số sao.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">Đánh Giá Phim</h1>
          <Link href={`/movies/${movie.id}`} className="text-sm text-[#B3B3B3] hover:text-white">
            ← Quay lại phim
          </Link>
        </div>

        {toast && (
          <div className="mb-4 p-3 bg-[#E63946]/20 border border-[#E63946] text-[#E63946] rounded-lg text-sm">
            {toast}
          </div>
        )}

        {/* Movie banner info */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 mb-6">
          <div className="flex gap-4 items-center">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-16 h-22 object-cover rounded-lg flex-shrink-0"
              style={{ height: '88px' }}
            />
            <div className="flex-1">
              <h2 className="text-white font-bold text-base">{movie.title}</h2>
              <p className="text-[#B3B3B3] text-xs">{movie.director} • {movie.duration} phút</p>
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={movie.rating} readonly size="sm" />
                <span className="text-[#FFB703] text-xs font-bold">{movie.rating}/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating form */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 mb-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[#2ECC71]/20 border-2 border-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#2ECC71] text-3xl">✓</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Cảm ơn bạn đã đánh giá!</h3>
              <p className="text-[#B3B3B3] text-sm">Đánh giá của bạn giúp ích rất nhiều cho cộng đồng Lumi Cinema.</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <StarRating value={rating} readonly />
                <span className="text-[#FFB703] font-bold">{rating}/5</span>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href={`/movies/${movie.id}`}
                  className="px-6 py-2.5 bg-[#E63946] hover:bg-[#C62B36] text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Xem trang phim
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-white font-semibold text-sm mb-3">
                  1. Bạn đánh giá bộ phim này mấy sao? *
                </label>
                <div className="flex items-center gap-4">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                  {rating > 0 && (
                    <span className="text-[#FFB703] font-bold text-base">
                      {['Rất tệ', 'Tệ', 'Bình thường', 'Hay', 'Tuyệt vời!'][rating - 1]}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white font-semibold text-sm mb-2">
                  2. Chia sẻ cảm nhận của bạn (tùy chọn)
                </label>
                <textarea
                  rows={4}
                  placeholder="Diễn xuất, kịch bản, kỹ xảo, cảm xúc của bạn sau khi xem..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg p-3 text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Link
                  href={`/movies/${movie.id}`}
                  className="px-4 py-2 bg-[#383838] hover:bg-[#404040] text-white rounded-lg text-sm font-medium transition-all"
                >
                  Hủy
                </Link>
                <Button type="submit">
                  Gửi đánh giá
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
