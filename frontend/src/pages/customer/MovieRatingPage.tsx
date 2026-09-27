import { useState, FormEvent } from 'react';
import { movies, reviews } from '@/data/mockData';
import { Movie } from '@/data/mockData';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';

interface MovieRatingPageProps {
  movie?: Movie;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (page: string, data?: unknown) => void;
}

export default function MovieRatingPage({ movie, onShowToast, onNavigate }: MovieRatingPageProps) {
  const targetMovie = movie || movies[0];
  const [selectedMovie, setSelectedMovie] = useState<Movie>(targetMovie);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const movieReviews = reviews.filter(r => r.movieId === selectedMovie.id);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) { onShowToast('Vui lòng chọn số sao.', 'error'); return; }
    setSubmitted(true);
    onShowToast('Đánh giá của bạn đã được gửi!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black text-white mb-6">Đánh Giá Phim</h1>

        {/* Movie selector */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 mb-6">
          <div className="flex gap-4 items-center">
            <img src={selectedMovie.poster} alt={selectedMovie.title} className="w-16 h-22 object-cover rounded-lg flex-shrink-0" style={{ height: '88px' }} />
            <div className="flex-1">
              <h2 className="text-white font-bold text-base">{selectedMovie.title}</h2>
              <p className="text-[#B3B3B3] text-xs">{selectedMovie.director} • {selectedMovie.duration} phút</p>
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={selectedMovie.rating} readonly size="sm" />
                <span className="text-[#FFB703] text-xs font-bold">{selectedMovie.rating}/5</span>
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
              <Button variant="secondary" className="mt-4" onClick={() => { setSubmitted(false); setRating(0); setComment(''); }}>
                Viết đánh giá khác
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className="text-white font-bold mb-4">Đánh giá của bạn</h3>

              <div className="mb-6">
                <p className="text-[#B3B3B3] text-sm mb-3">Chọn số sao:</p>
                <div className="flex items-center gap-4">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                  {rating > 0 && (
                    <span className="text-[#FFB703] font-bold text-lg">{rating}/5</span>
                  )}
                </div>
                {rating > 0 && (
                  <p className="text-[#B3B3B3] text-sm mt-2">
                    {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Hay', 'Tuyệt vời'][rating]}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Bình luận (không bắt buộc)</label>
                <textarea
                  rows={4}
                  placeholder="Bình luận về phim này..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <p className="text-[#525252] text-xs mt-1 text-right">{comment.length}/500</p>
              </div>

              <Button type="submit" size="lg">
                Gửi đánh giá
              </Button>
            </form>
          )}
        </div>

        {/* Existing reviews */}
        <div>
          <h3 className="text-white font-bold text-base mb-4">
            Đánh giá từ cộng đồng ({movieReviews.length})
          </h3>

          {movieReviews.length === 0 ? (
            <div className="text-center py-8 bg-[#2D2D2D] border border-[#404040] rounded-xl">
              <p className="text-[#B3B3B3]">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {movieReviews.map(r => (
                <div key={r.id} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#E63946] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {r.userName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold text-sm">{r.userName}</span>
                        <div className="flex items-center gap-1">
                          <StarRating value={r.rating} readonly size="sm" />
                          <span className="text-[#FFB703] text-xs font-bold">{r.rating}</span>
                        </div>
                      </div>
                      <p className="text-[#B3B3B3] text-sm mt-1 leading-relaxed">{r.comment}</p>
                      <p className="text-[#525252] text-xs mt-2">{r.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
