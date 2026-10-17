'use client';

import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import { ReviewResponseItem } from '@/app/api/reviews/route';

interface ReviewListProps {
  reviews: ReviewResponseItem[];
  isLoading?: boolean;
}

/**
 * Định dạng ngày giờ hiển thị cho bình luận
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Gần đây';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Gần đây';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ReviewList({ reviews, isLoading = false }: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-5 animate-pulse flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#252836] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 bg-[#252836] rounded" />
              <div className="w-24 h-3 bg-[#252836] rounded" />
              <div className="w-full h-12 bg-[#252836] rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-8 text-center">
        <h3 className="text-base font-semibold text-white mb-1">Chưa có đánh giá</h3>
        <p className="text-gray-400 text-xs max-w-sm mx-auto">
          Các nhận xét từ khán giả sẽ được hiển thị tại đây.
        </p>
      </div>
    );
  }

  // Tính điểm trung bình và thống kê
  const total = reviews.length;
  const avg = (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Khối tóm tắt điểm đánh giá */}
      <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center sm:border-r sm:border-[#404040] sm:pr-8 flex-shrink-0">
          <div className="text-4xl font-black text-[#FFB703] tracking-tight">{avg}</div>
          <div className="my-1.5 flex justify-center">
            <StarRating value={Math.round(Number(avg))} readonly size="sm" />
          </div>
          <p className="text-xs text-gray-400">{total} lượt đánh giá</p>
        </div>

        {/* Thanh phân bố sao */}
        <div className="flex-1 w-full space-y-1.5 text-xs text-gray-300">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-5 text-gray-400 font-medium">{star}★</span>
                <div className="flex-1 bg-[#1E1E1E] rounded-full h-2 overflow-hidden border border-[#404040]">
                  <div
                    className="bg-[#FFB703] h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-400 text-[11px]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danh sách các bình luận */}
      <div className="space-y-3">
        {reviews.map(review => {
          const reviewerName = review.full_name || review.user?.name || 'Khán giả';
          const initialChar = reviewerName.charAt(0).toUpperCase();

          return (
            <div
              key={review.id}
              className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  {/* Avatar chữ cái */}
                  <div className="w-8 h-8 rounded-full bg-[#E63946] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {initialChar}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{reviewerName}</h4>
                    <span className="text-[11px] text-gray-400 block">
                      {formatDate(review.createdAt || review.created_at)}
                    </span>
                  </div>
                </div>

                {/* Rating stars & badge */}
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
              </div>

              {/* Nội dung bình luận */}
              {review.comment ? (
                <p className="text-gray-300 text-sm leading-relaxed mt-1 whitespace-pre-line">
                  {review.comment}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
