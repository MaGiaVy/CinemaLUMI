'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import { ReviewResponseItem } from '@/app/api/reviews/route';

interface ReviewFormProps {
  movieId: number;
  movieTitle?: string;
  onReviewSubmitted?: (review: ReviewResponseItem) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const RATING_LABELS = [
  '',
  '1 sao - Rất tệ',
  '2 sao - Tệ',
  '3 sao - Bình thường',
  '4 sao - Hay',
  '5 sao - Tuyệt vời',
];

export default function ReviewForm({
  movieId,
  movieTitle,
  onReviewSubmitted,
  onShowToast,
}: ReviewFormProps) {
  const { status } = useSession();

  // Kiểm tra đăng nhập (NextAuth session hoặc cookies ở Client)
  const isCookieLoggedIn =
    typeof document !== 'undefined' &&
    (document.cookie.includes('is_logged_in=true') ||
      document.cookie.includes('user_role=') ||
      document.cookie.includes('next-auth.session-token'));

  const isLoggedIn = status === 'authenticated' || isCookieLoggedIn;

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Nếu người dùng CHƯA đăng nhập: Hiển thị lời nhắc đăng nhập thay vì form
  if (!isLoggedIn) {
    return (
      <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 text-center">
        <h3 className="text-base font-semibold text-white mb-1">
          Đánh giá phim
        </h3>
        <p className="text-gray-400 text-xs mb-4 max-w-md mx-auto">
          Đăng nhập tài khoản để gửi đánh giá và nhận xét về bộ phim.
        </p>
        <Link
          href={`/login?callbackUrl=/movies/${movieId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#E63946] hover:bg-[#C62B36] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Đăng nhập để đánh giá
        </Link>
      </div>
    );
  }

  // Xử lý gửi đánh giá phim qua API POST /api/reviews
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      onShowToast('Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao)', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movie_id: movieId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 403) {
        onShowToast(
          data.error || 'Vui lòng đăng nhập để đánh giá phim',
          'error'
        );
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Không thể gửi đánh giá');
      }

      onShowToast(
        'Đánh giá của bạn đã được ghi nhận.',
        'success'
      );

      // Reset form
      setComment('');
      setRating(5);

      if (onReviewSubmitted && data.data) {
        onReviewSubmitted(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi gửi review:', err);
      onShowToast(
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi gửi đánh giá',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#383838]">
        <div>
          <h3 className="text-base font-semibold text-white">Đánh giá của bạn</h3>
          {movieTitle && (
            <p className="text-xs text-gray-400 mt-0.5">
              Phim: {movieTitle}
            </p>
          )}
        </div>
        <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-medium">
          Đã đăng nhập
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chọn số sao */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Đánh giá sao
          </label>
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <span className="text-sm font-semibold text-[#FFB703] ml-2">
                {RATING_LABELS[rating]}
              </span>
            )}
          </div>
        </div>

        {/* Nhập nội dung bình luận */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-gray-400">
              Nhận xét (không bắt buộc)
            </label>
            <span className="text-[11px] text-gray-500 font-mono">
              {comment.length}/1000
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Cảm nhận của bạn về bộ phim..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-3 bg-[#1E1E1E] border border-[#404040] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E63946] transition resize-y"
          />
        </div>

        {/* Nút gửi */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="md"
            disabled={isSubmitting}
            className="px-5 bg-[#E63946] hover:bg-[#C62B36] text-white font-medium rounded-lg transition"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang gửi...</span>
              </div>
            ) : (
              'Gửi đánh giá'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
