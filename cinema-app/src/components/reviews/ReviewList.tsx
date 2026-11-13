'use client';

import StarRating from '@/components/ui/StarRating';
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
            className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.15)] rounded-2xl p-5 animate-pulse flex items-start gap-4 backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-full bg-[rgba(192,132,252,0.1)] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 bg-[rgba(192,132,252,0.1)] rounded" />
              <div className="w-24 h-3 bg-[rgba(192,132,252,0.1)] rounded" />
              <div className="w-full h-12 bg-[rgba(192,132,252,0.1)] rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-10 text-center backdrop-blur-md shadow-lg">
        <div className="w-12 h-12 rounded-full bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-300 font-bold">
          ✦
        </div>
        <h3 className="text-lg font-bold text-[#F8FAFC] mb-1">Chưa có đánh giá nào</h3>
        <p className="text-[#94A3B8] text-sm max-w-sm mx-auto">
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
      <div className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center sm:border-r sm:border-[rgba(192,132,252,0.15)] sm:pr-8 flex-shrink-0">
          <div className="text-4xl sm:text-5xl font-black text-[#FDA4AF] tracking-tight">{avg}</div>
          <div className="my-1.5 flex justify-center">
            <StarRating value={Math.round(Number(avg))} readonly size="sm" />
          </div>
          <p className="text-xs text-[#94A3B8]">Dựa trên {total} lượt đánh giá</p>
        </div>

        {/* Thanh phân bố sao */}
        <div className="flex-1 w-full space-y-1.5 text-xs text-[#94A3B8]">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-6 text-[#94A3B8] font-medium">{star} ★</span>
                <div className="flex-1 bg-[rgba(15,11,26,0.8)] rounded-full h-2 overflow-hidden border border-[rgba(192,132,252,0.15)]">
                  <div
                    className="bg-gradient-to-r from-[#E11D48] to-[#C084FC] h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-400 text-[11px]">{count}</span>
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
              className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.15)] rounded-2xl p-4.5 backdrop-blur-md shadow-md transition-all hover:border-[rgba(192,132,252,0.3)]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E11D48] to-[#581C87] text-[#F8FAFC] font-bold text-sm flex items-center justify-center shadow-sm">
                    {initialChar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#F8FAFC] leading-none mb-1">
                      {reviewerName}
                    </h4>
                    <p className="text-[11px] text-slate-400">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-slate-200 leading-relaxed pl-12">
                  {review.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
