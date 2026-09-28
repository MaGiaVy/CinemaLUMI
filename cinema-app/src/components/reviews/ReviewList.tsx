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
      <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-10 text-center shadow-lg">
        <span className="text-5xl block mb-3">💬</span>
        <h3 className="text-lg font-bold text-white mb-1">Chưa có đánh giá nào</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Chưa có khán giả nào đánh giá bộ phim này. Hãy là người đầu tiên thưởng thức và chia sẻ cảm nhận!
        </p>
      </div>
    );
  }

  // Tính điểm trung bình và thống kê
  const total = reviews.length;
  const avg = (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Khối tóm tắt điểm đánh giá */}
      <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center sm:border-r sm:border-[#252836] sm:pr-8 flex-shrink-0">
          <div className="text-4xl sm:text-5xl font-black text-[#FFB703] tracking-tight">{avg}</div>
          <div className="my-1.5 flex justify-center">
            <StarRating value={Math.round(Number(avg))} readonly size="sm" />
          </div>
          <p className="text-xs text-gray-400">Dựa trên {total} lượt đánh giá</p>
        </div>

        {/* Thanh phân bố sao */}
        <div className="flex-1 w-full space-y-1.5 text-xs text-gray-300">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-5 text-gray-400 font-medium">{star}★</span>
                <div className="flex-1 bg-[#12131A] rounded-full h-2 overflow-hidden border border-[#252836]">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-[#FFB703] h-full rounded-full transition-all duration-500"
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
      <div className="space-y-3.5">
        {reviews.map(review => {
          const reviewerName = review.full_name || review.user?.name || 'Khán giả';
          const initialChar = reviewerName.charAt(0).toUpperCase();

          return (
            <div
              key={review.id}
              className="bg-[#1A1C24] border border-[#252836] hover:border-[#383C4F] rounded-2xl p-5 transition-all shadow-md"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  {/* Avatar chữ cái */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md">
                    {initialChar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{reviewerName}</h4>
                    <span className="text-[11px] text-gray-500 block">
                      {formatDate(review.createdAt || review.created_at)}
                    </span>
                  </div>
                </div>

                {/* Rating stars & badge */}
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} readonly size="sm" />
                  <Badge
                    variant={
                      review.rating >= 4
                        ? 'green'
                        : review.rating === 3
                        ? 'gold'
                        : 'red'
                    }
                    size="sm"
                  >
                    {review.rating}/5
                  </Badge>
                </div>
              </div>

              {/* Nội dung bình luận */}
              {review.comment ? (
                <p className="text-gray-300 text-sm leading-relaxed pl-13 mt-1 whitespace-pre-line">
                  {review.comment}
                </p>
              ) : (
                <p className="text-gray-500 text-xs italic pl-13 mt-1">
                  (Khán giả không để lại bình luận văn bản)
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
