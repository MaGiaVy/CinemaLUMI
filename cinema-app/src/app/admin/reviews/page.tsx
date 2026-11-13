'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import StarRating from '@/components/ui/StarRating';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { ReviewResponseItem } from '@/app/api/reviews/route';

type SortMode = 'latest' | 'highest' | 'lowest';

/**
 * Định dạng ngày giờ hiển thị
 */
function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '---';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReviewModerationContent() {
  const [reviews, setReviews] = useState<ReviewResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal xóa
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch toàn bộ đánh giá của hệ thống
  const fetchAllReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reviews?all=true', {
        headers: {
          'x-user-role': 'ADMIN',
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Không thể tải danh sách đánh giá');
      }

      setReviews(data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải đánh giá hệ thống:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllReviews();
  }, [fetchAllReviews]);

  // Thống kê số liệu
  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)
        : '0.0';

    const starCounts = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
      percentage: total > 0 ? (reviews.filter(r => r.rating === star).length / total) * 100 : 0,
    }));

    return { total, avg, starCounts };
  }, [reviews]);

  // Lọc và sắp xếp
  const filteredReviews = useMemo(() => {
    return reviews
      .filter(r => {
        // Lọc theo rating sao
        if (filterRating !== null && r.rating !== filterRating) return false;

        // Lọc theo từ khóa tìm kiếm
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const reviewer = (r.full_name || r.user?.name || '').toLowerCase();
          const email = (r.user?.email || '').toLowerCase();
          const movie = (r.movie_title || r.movieTitle || r.movie?.title || '').toLowerCase();
          const comment = (r.comment || '').toLowerCase();

          return (
            reviewer.includes(query) ||
            email.includes(query) ||
            movie.includes(query) ||
            comment.includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'highest') return b.rating - a.rating;
        if (sortMode === 'lowest') return a.rating - b.rating;
        const dateA = new Date(a.createdAt || a.created_at).getTime();
        const dateB = new Date(b.createdAt || b.created_at).getTime();
        return dateB - dateA;
      });
  }, [reviews, filterRating, searchTerm, sortMode]);

  // Xóa bình luận
  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/reviews/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'ADMIN',
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Gỡ bỏ bình luận thất bại');
      }

      showToast('Đã xóa bình luận thành công khỏi hệ thống.', 'success');
      setReviews(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Lỗi khi xóa bình luận:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi khi xóa bình luận', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedReviewToDelete = reviews.find(r => r.id === deleteId);

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#e11d48] text-sm">✦</span>
              <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
                QUẢN LÝ ĐÁNH GIÁ & BÌNH LUẬN
              </h1>
            </div>
            <p className="text-[#94a3b8] text-xs">
              Kiểm duyệt toàn bộ phản hồi, chấm điểm của khách hàng trên toàn hệ thống rạp Lumi Cinema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-[#cbd5e1]">
              Tổng cộng: <strong className="text-white ml-1 font-bold">{stats.total}</strong> đánh giá
            </span>
          </div>
        </div>

        {/* Khối Thống kê Rating Tổng quan */}
        <div
          className="rounded-2xl p-6 border border-[#c084fc]/25 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(136, 19, 55, 0.22) 0%, transparent 55%), radial-gradient(circle at 100% 100%, rgba(88, 28, 135, 0.25) 0%, transparent 65%), rgba(15, 11, 26, 0.85)',
          }}
        >
          {/* Điểm trung bình */}
          <div className="md:col-span-4 text-center md:border-r md:border-white/[0.08] md:pr-6">
            <div className="text-5xl font-black text-[#fda4af] tracking-tight">{stats.avg}</div>
            <div className="my-2 flex justify-center">
              <StarRating value={Math.round(Number(stats.avg))} readonly size="md" />
            </div>
            <p className="text-xs text-[#94a3b8]">Điểm đánh giá trung bình toàn hệ thống</p>
          </div>

          {/* Phân bố các sao */}
          <div className="md:col-span-8 space-y-2">
            {stats.starCounts.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-[#c084fc] font-bold">{star} sao</span>
                <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden border border-white/[0.08]">
                  <div
                    className="h-full bg-gradient-to-r from-[#881337] via-[#e11d48] to-[#fda4af] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-16 text-right text-[#94a3b8] font-mono text-[11px]">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Thanh công cụ: Lọc theo sao & Tìm kiếm & Sắp xếp */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Bộ lọc số sao */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterRating(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterRating === null
                  ? 'bg-gradient-to-r from-[#e11d48] to-[#9f1239] text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                  : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
              }`}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map(n => (
              <button
                type="button"
                key={n}
                onClick={() => setFilterRating(filterRating === n ? null : n)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterRating === n
                    ? 'bg-[#c084fc]/25 border border-[#c084fc] text-white shadow-[0_0_10px_rgba(192,132,252,0.3)]'
                    : 'bg-white/[0.04] text-[#94a3b8] hover:text-white border border-white/[0.08]'
                }`}
              >
                {n} sao
              </button>
            ))}
          </div>

          {/* Tìm kiếm & Sắp xếp */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Tìm người dùng, phim, nội dung..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0812]/90 border border-[#c084fc]/20 rounded-xl text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#e11d48] transition"
              />
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center gap-1 text-xs">
              {(
                [
                  ['latest', 'Mới nhất'],
                  ['highest', 'Sao cao'],
                  ['lowest', 'Sao thấp'],
                ] as [SortMode, string][]
              ).map(([mode, label]) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    sortMode === mode
                      ? 'bg-white/[0.08] text-white border border-white/20'
                      : 'text-[#94a3b8] hover:text-white border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bảng danh sách đánh giá */}
        {isLoading ? (
          <div className="py-16 text-center text-[#94a3b8] text-xs">
            Đang tải dữ liệu đánh giá...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-[#c084fc]/20 bg-[#0a0812]/80 backdrop-blur-2xl p-12 text-center text-[#94a3b8]">
            <p className="text-sm font-bold text-white">Không có đánh giá nào phù hợp</p>
            <p className="text-xs text-[#64748b] mt-1">Hãy thử xóa bộ lọc hoặc tìm kiếm bằng từ khóa khác</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#cbd5e1]">
                <thead className="bg-white/[0.02] text-[#c084fc] text-[11px] font-bold uppercase tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3.5 px-4">Khách hàng</th>
                    <th className="py-3.5 px-4">Bộ phim</th>
                    <th className="py-3.5 px-4">Đánh giá</th>
                    <th className="py-3.5 px-4">Nhận xét</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Thời gian</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredReviews.map(review => {
                    const reviewerName = review.full_name || review.user?.name || 'Khách hàng';
                    const initial = reviewerName.charAt(0).toUpperCase();
                    const movieTitle = review.movie_title || review.movieTitle || review.movie?.title || 'Phim rạp';

                    return (
                      <tr
                        key={review.id}
                        className="hover:bg-white/[0.03] transition-colors duration-150"
                      >
                        {/* Khách hàng */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#881337] to-[#e11d48] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(225,29,72,0.4)]">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate text-xs">{reviewerName}</p>
                              <p className="text-[10px] text-[#94a3b8] truncate">{review.user?.email || '---'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Bộ phim */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-white font-semibold text-xs line-clamp-1">
                            {movieTitle}
                          </span>
                          <span className="text-[10px] text-[#94a3b8] font-mono">
                            #M-{review.movieId || review.movie_id}
                          </span>
                        </td>

                        {/* Đánh giá */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <StarRating value={review.rating} readonly size="sm" />
                            <span className="text-xs font-bold text-[#fda4af]">
                              {review.rating}/5
                            </span>
                          </div>
                        </td>

                        {/* Nhận xét */}
                        <td className="py-4 px-4 align-top max-w-xs">
                          {review.comment ? (
                            <p className="text-[#cbd5e1] text-xs leading-relaxed line-clamp-2">
                              {review.comment}
                            </p>
                          ) : (
                            <span className="text-[#64748b] text-[11px] italic">
                              (Không có nội dung nhận xét)
                            </span>
                          )}
                        </td>

                        {/* Ngày gửi */}
                        <td className="py-4 px-4 align-top whitespace-nowrap text-xs text-[#94a3b8] font-mono">
                          {formatDateTime(review.createdAt || review.created_at)}
                        </td>

                        {/* Nút Xóa */}
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDeleteId(review.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#fda4af] hover:text-white bg-[#e11d48]/15 hover:bg-[#e11d48]/30 border border-[#e11d48]/30 rounded transition-colors cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => !isDeleting && setDeleteId(null)}
        title="XÁC NHẬN GỠ BỎ ĐÁNH GIÁ"
      >
        <div className="space-y-4">
          <p className="text-[#cbd5e1] text-xs leading-relaxed">
            Bạn có chắc chắn muốn xóa đánh giá của{' '}
            <strong className="text-white">
              {selectedReviewToDelete?.full_name || selectedReviewToDelete?.user?.name || 'khách hàng này'}
            </strong>{' '}
            cho bộ phim{' '}
            <strong className="text-[#fda4af]">
              {selectedReviewToDelete?.movie_title || selectedReviewToDelete?.movieTitle || 'này'}
            </strong>{' '}
            không?
          </p>

          <div className="p-3 bg-[#e11d48]/15 border border-[#e11d48]/40 rounded-xl text-xs text-[#fda4af]">
            Hành động này sẽ xóa vĩnh viễn đánh giá và tự động tính toán lại điểm trung bình của bộ phim.
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#881337] text-white text-xs font-black rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.6)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#e11d48] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#94a3b8]">Đang tải trang kiểm duyệt đánh giá...</span>
          </div>
        </div>
      }
    >
      <ReviewModerationContent />
    </Suspense>
  );
}
