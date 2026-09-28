'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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
      // Cập nhật lại UI ngay lập tức
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

      <div className="flex-1 bg-[#1A1A1A] p-6 sm:p-8 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#333]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⭐</span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Quản Lý Đánh Giá & Bình Luận
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                Kiểm duyệt toàn bộ phản hồi, chấm điểm của khách hàng trên toàn hệ thống rạp Lumi Cinema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-xl bg-[#2D2D2D] border border-[#404040] text-xs font-semibold text-gray-300">
                Tổng cộng: <strong className="text-white ml-1 font-bold">{stats.total}</strong> đánh giá
              </span>
            </div>
          </div>

          {/* Khối Thống kê Rating Tổng quan */}
          <div className="bg-[#242424] border border-[#383838] rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Điểm trung bình */}
            <div className="md:col-span-4 text-center md:border-r md:border-[#383838] md:pr-6">
              <div className="text-5xl font-black text-[#FFB703] tracking-tight">{stats.avg}</div>
              <div className="my-2 flex justify-center">
                <StarRating value={Math.round(Number(stats.avg))} readonly size="md" />
              </div>
              <p className="text-xs text-gray-400">Điểm trung bình toàn hệ thống</p>
            </div>

            {/* Phân bố các sao */}
            <div className="md:col-span-8 space-y-2">
              {stats.starCounts.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-gray-400 font-semibold">{star} ★</span>
                  <div className="flex-1 bg-[#1A1A1A] rounded-full h-2.5 overflow-hidden border border-[#333]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#FFB703] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-400 font-mono">{count} ({percentage.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Thanh công cụ: Lọc theo sao & Tìm kiếm & Sắp xếp */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Bộ lọc số sao */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setFilterRating(null)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  filterRating === null
                    ? 'bg-[#E63946] text-white shadow'
                    : 'bg-[#2D2D2D] text-gray-400 hover:text-white border border-[#404040]'
                }`}
              >
                Tất cả
              </button>
              {[5, 4, 3, 2, 1].map(n => (
                <button
                  key={n}
                  onClick={() => setFilterRating(filterRating === n ? null : n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    filterRating === n
                      ? 'bg-[#FFB703] text-black font-bold shadow'
                      : 'bg-[#2D2D2D] text-gray-400 hover:text-white border border-[#404040]'
                  }`}
                >
                  {n} ★
                </button>
              ))}
            </div>

            {/* Tìm kiếm & Sắp xếp */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm người dùng, phim, nội dung..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#242424] border border-[#383838] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E63946] transition"
                />
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-1">
                {(
                  [
                    ['latest', 'Mới nhất'],
                    ['highest', 'Sao cao'],
                    ['lowest', 'Sao thấp'],
                  ] as [SortMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      sortMode === mode
                        ? 'bg-[#383838] text-white border border-[#525252]'
                        : 'text-gray-400 hover:text-white border border-transparent'
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
            <div className="space-y-3 py-8">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="bg-[#242424] border border-[#383838] rounded-xl p-5 animate-pulse flex items-center justify-between"
                >
                  <div className="space-y-2 flex-1">
                    <div className="w-1/4 h-4 bg-[#333] rounded" />
                    <div className="w-1/2 h-3 bg-[#333] rounded" />
                  </div>
                  <div className="w-16 h-8 bg-[#333] rounded" />
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-[#242424] border border-[#383838] rounded-2xl p-12 text-center text-gray-400">
              <span className="text-4xl block mb-2">⭐</span>
              <p className="text-base font-semibold text-white">Không có đánh giá nào phù hợp</p>
              <p className="text-xs text-gray-500 mt-1">Hãy thử xóa bộ lọc hoặc tìm kiếm bằng từ khóa khác</p>
            </div>
          ) : (
            <div className="bg-[#242424] border border-[#383838] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#1D1D1D] text-gray-400 text-xs uppercase tracking-wider border-b border-[#383838]">
                    <tr>
                      <th className="py-3.5 px-4">Khách hàng</th>
                      <th className="py-3.5 px-4">Bộ phim</th>
                      <th className="py-3.5 px-4">Đánh giá</th>
                      <th className="py-3.5 px-4">Nhận xét</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Thời gian</th>
                      <th className="py-3.5 px-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {filteredReviews.map(review => {
                      const reviewerName = review.full_name || review.user?.name || 'Khách hàng';
                      const initial = reviewerName.charAt(0).toUpperCase();
                      const movieTitle = review.movie_title || review.movieTitle || review.movie?.title || 'Phim rạp';

                      return (
                        <tr
                          key={review.id}
                          className="hover:bg-[#2B2B2B] transition-colors duration-150"
                        >
                          {/* Khách hàng */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-red-600/80 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-white truncate text-xs">{reviewerName}</p>
                                <p className="text-[11px] text-gray-500 truncate">{review.user?.email || '---'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Bộ phim */}
                          <td className="py-4 px-4 align-top">
                            <span className="text-white font-medium text-xs line-clamp-1">
                              {movieTitle}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              #M-{review.movieId || review.movie_id}
                            </span>
                          </td>

                          {/* Đánh giá */}
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
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
                          </td>

                          {/* Nhận xét */}
                          <td className="py-4 px-4 align-top max-w-xs">
                            {review.comment ? (
                              <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                                {review.comment}
                              </p>
                            ) : (
                              <span className="text-gray-600 text-xs italic">
                                (Không có nội dung nhận xét)
                              </span>
                            )}
                          </td>

                          {/* Ngày gửi */}
                          <td className="py-4 px-4 align-top whitespace-nowrap text-xs text-gray-400 font-mono">
                            {formatDateTime(review.createdAt || review.created_at)}
                          </td>

                          {/* Nút Xóa màu đỏ */}
                          <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteId(review.id)}
                              className="text-xs bg-red-600 hover:bg-red-700 font-semibold px-3 py-1 cursor-pointer"
                            >
                              🗑️ Xóa
                            </Button>
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
      </div>

      {/* Modal xác nhận xóa */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => !isDeleting && setDeleteId(null)}
        title="Xác Nhận Gỡ Bỏ Đánh Giá"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            Bạn có chắc chắn muốn xóa đánh giá của{' '}
            <strong className="text-white">
              {selectedReviewToDelete?.full_name || selectedReviewToDelete?.user?.name || 'khách hàng này'}
            </strong>{' '}
            cho bộ phim{' '}
            <strong className="text-[#FFB703]">
              {selectedReviewToDelete?.movie_title || selectedReviewToDelete?.movieTitle || 'này'}
            </strong>{' '}
            không?
          </p>

          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            ⚠️ Hành động này sẽ xóa vĩnh viễn đánh giá và tự động tính toán lại điểm trung bình của bộ phim.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setDeleteId(null)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xóa...</span>
                </div>
              ) : (
                'Xác nhận xóa'
              )}
            </Button>
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
        <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải trang kiểm duyệt đánh giá...</span>
          </div>
        </div>
      }
    >
      <ReviewModerationContent />
    </Suspense>
  );
}
