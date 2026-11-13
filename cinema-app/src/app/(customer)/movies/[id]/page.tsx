'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import { ReviewResponseItem } from '@/app/api/reviews/route';
import { getLocalDateString } from '@/lib/date-utils';

interface MovieDetails {
  id: number;
  title: string;
  slug?: string | null;
  description?: string | null;
  duration: number;
  releaseDate: string;
  ageRating?: string | null;
  poster: string;
  trailer?: string | null;
  rating: number;
  genre: string;
  director?: string | null;
  cast?: string | null;
  status: string;
  ticketPrice: number;
  screenings?: Array<{
    id: number;
    room: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    status: string;
  }>;
}

/**
 * Định dạng giờ (hh:mm)
 */
function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Định dạng ngày (Thứ, dd/mm)
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '---';
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function MovieDetailContent() {
  const params = useParams();
  const movieIdParam = params?.id as string;
  const movieId = parseInt(movieIdParam, 10);

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [reviews, setReviews] = useState<ReviewResponseItem[]>([]);
  const [isLoadingMovie, setIsLoadingMovie] = useState<boolean>(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);

  // Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 1. Tải thông tin chi tiết phim
  const fetchMovieData = useCallback(async () => {
    if (isNaN(movieId) || movieId <= 0) return;

    try {
      setIsLoadingMovie(true);
      const res = await fetch(`/api/movies/${movieId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Không tìm thấy phim');
      }

      setMovie(data.data);
    } catch (err) {
      console.error('Lỗi khi tải thông tin phim:', err);
      showToast(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsLoadingMovie(false);
    }
  }, [movieId, showToast]);

  // 2. Tải danh sách đánh giá từ GET /api/reviews?movie_id=...
  const fetchReviewsData = useCallback(async () => {
    if (isNaN(movieId) || movieId <= 0) return;

    try {
      setIsLoadingReviews(true);
      const res = await fetch(`/api/reviews?movie_id=${movieId}`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchMovieData();
    fetchReviewsData();
  }, [fetchMovieData, fetchReviewsData]);

  // Callback khi submit đánh giá thành công
  const handleReviewSubmitted = (newReview: ReviewResponseItem) => {
    setReviews(prev => {
      const filtered = prev.filter(r => r.userId !== newReview.userId && r.id !== newReview.id);
      return [newReview, ...filtered];
    });
    fetchMovieData();
  };

  // Gom nhóm danh sách suất chiếu theo ngày
  const uniqueDates = useMemo(() => {
    if (!movie?.screenings || movie.screenings.length === 0) return [];
    const dateMap = new Map<string, string>();
    movie.screenings.forEach(s => {
      const d = getLocalDateString(s.date || s.startTime);
      if (d && !dateMap.has(d)) {
        dateMap.set(d, formatDate(s.date || s.startTime));
      }
    });
    return Array.from(dateMap.entries()).map(([rawDate, label]) => ({ rawDate, label }));
  }, [movie?.screenings]);

  // Lọc suất chiếu theo ngày đang chọn
  const filteredScreenings = useMemo(() => {
    if (!movie?.screenings || uniqueDates.length === 0) return [];
    const currentDate = uniqueDates[selectedDateIndex]?.rawDate;
    if (!currentDate) return movie.screenings;

    return movie.screenings.filter(s => {
      const d = getLocalDateString(s.date || s.startTime);
      return d === currentDate;
    });
  }, [movie?.screenings, uniqueDates, selectedDateIndex]);

  if (isLoadingMovie) {
    return (
      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex items-center justify-center py-20 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#94A3B8] text-sm">Đang tải thông tin phim...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] py-20 px-4 font-sans">
        <div className="max-w-md mx-auto bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] rounded-2xl p-8 text-center backdrop-blur-md shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400 font-bold text-lg">
            ✕
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">Phim không tồn tại</h2>
          <p className="text-[#94A3B8] text-sm mb-6">
            Không tìm thấy thông tin bộ phim yêu cầu hoặc phim đã ngừng chiếu.
          </p>
          <Link
            href="/"
            className="inline-block py-2.5 px-6 bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-sm font-semibold rounded-xl shadow-lg transition"
          >
            ← Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const posterUrl =
    movie.poster ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop&auto=format';

  const genres = movie.genre ? movie.genre.split(',').map(g => g.trim()) : ['Chiếu rạp'];
  const avgRatingNumber = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : Number(movie.rating || 0);

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] font-sans selection:bg-[#E11D48] selection:text-white">
        {/* Banner Backdrop Hòa Quyện Không Gian */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-[#0A0812]">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover blur-lg scale-110 opacity-35"
          />
          {/* Tinh vân màu nền */}
          <div className="absolute -top-20 left-1/3 w-96 h-96 bg-[#581C87]/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#881337]/25 rounded-full blur-[90px] pointer-events-none" />

          {/* Gradients chuyển màu êm dịu */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/60 to-transparent" />
        </div>

        {/* Khối Nội Dung Chính (Poster + Info) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-44 sm:-mt-56 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            {/* Poster nổi bật với hiệu ứng hào quang phát xung (Nebula Pulse) */}
            <div className="relative w-48 sm:w-60 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(88,28,135,0.45)] border border-[rgba(192,132,252,0.3)] flex-shrink-0 bg-[#0A0812] mx-auto md:mx-0 group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#E11D48] via-[#581C87] to-[#C084FC] rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse pointer-events-none" />
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-auto object-cover aspect-[2/3] relative z-10"
              />
              {movie.ageRating && (
                <div className="absolute top-2 left-2 z-20 bg-[#E11D48] text-white font-black text-xs px-2 py-0.5 rounded-md shadow-md">
                  {movie.ageRating}
                </div>
              )}
            </div>

            {/* Thông tin chi tiết */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              {/* Thể loại & Trạng thái */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {genres.map(g => (
                  <Badge key={g} variant="purple" size="md">
                    {g}
                  </Badge>
                ))}
                <Badge variant={movie.status === 'SHOWING' ? 'green' : 'gold'} size="md">
                  {movie.status === 'SHOWING' ? 'Đang chiếu' : 'Sắp ra mắt'}
                </Badge>
              </div>

              {/* Tên phim */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F8FAFC] tracking-tight drop-shadow-md">
                {movie.title}
              </h1>

              {/* Rating sao & Thời lượng */}
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-sm text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(avgRatingNumber)} readonly size="sm" />
                  <span className="text-[#FDA4AF] font-bold text-lg">{avgRatingNumber.toFixed(1)}</span>
                  <span className="text-slate-400 text-xs">({reviews.length} đánh giá)</span>
                </div>
                <span>•</span>
                <span>Thời lượng: {movie.duration} phút</span>
                <span>•</span>
                <span>Khởi chiếu: {formatDate(movie.releaseDate)}</span>
              </div>

              {/* Đạo diễn & Diễn viên */}
              <div className="text-xs text-[#94A3B8] space-y-1">
                {movie.director && (
                  <p>
                    <span className="text-slate-400">Đạo diễn:</span>{' '}
                    <span className="text-[#F8FAFC] font-medium">{movie.director}</span>
                  </p>
                )}
                {movie.cast && (
                  <p>
                    <span className="text-slate-400">Diễn viên:</span>{' '}
                    <span className="text-[#F8FAFC] font-medium">{movie.cast}</span>
                  </p>
                )}
              </div>

              {/* Mô tả tóm tắt nội dung */}
              {movie.description && (
                <div>
                  <p
                    className={`text-slate-300 text-sm leading-relaxed ${
                      !isDescriptionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {movie.description}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(prev => !prev)}
                    className="text-[#FDA4AF] text-xs font-semibold mt-1.5 hover:underline cursor-pointer"
                  >
                    {isDescriptionExpanded ? 'Thu gọn ▲' : 'Đọc thêm ▼'}
                  </button>
                </div>
              )}

              {/* Giá vé tham khảo */}
              <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94A3B8]">Giá vé tiêu chuẩn:</span>
                  <span className="text-xl font-bold text-[#F8FAFC]">
                    {Number(movie.ticketPrice || 120000).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <Link
                  href={`/admin/movies/${movie.id}/edit`}
                  className="px-3 py-1 bg-[rgba(18,14,28,0.7)] hover:bg-[rgba(30,24,48,0.9)] text-[#F8FAFC] text-xs font-semibold rounded-xl border border-[rgba(192,132,252,0.2)] transition-colors inline-flex items-center gap-1.5"
                >
                  ✦ Chỉnh sửa phim (Admin)
                </Link>
              </div>
            </div>
          </div>

          {/* Phần 1: Lịch Chiếu & Suất Chiếu Dạng Viên Nhộng */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[rgba(192,132,252,0.15)]">
              <div className="flex items-center gap-2.5">
                <span className="text-rose-400 font-bold text-lg">✦</span>
                <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">Lịch Chiếu & Đặt Vé</h2>
              </div>
            </div>

            {/* Bộ chọn ngày chiếu */}
            {uniqueDates.length > 0 ? (
              <div className="space-y-6">
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {uniqueDates.map((item, idx) => (
                    <button
                      key={item.rawDate}
                      onClick={() => setSelectedDateIndex(idx)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        selectedDateIndex === idx
                          ? 'bg-gradient-to-r from-[#E11D48] to-[#881337] text-[#F8FAFC] shadow-[0_0_15px_rgba(225,29,72,0.5)] border border-rose-500/40'
                          : 'bg-[rgba(18,14,28,0.7)] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(192,132,252,0.1)] border border-[rgba(192,132,252,0.15)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Danh sách thẻ suất chiếu dạng viên nhộng kính mờ */}
                {filteredScreenings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredScreenings.map(s => (
                      <div
                        key={s.id}
                        className="bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.18)] hover:border-[rgba(192,132,252,0.4)] rounded-2xl p-4.5 transition-all shadow-lg flex flex-col justify-between backdrop-blur-md"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-black text-[#F8FAFC] font-mono">
                              {formatTime(s.startTime)}
                            </span>
                            <Badge variant="gold" size="sm">
                              Phòng {s.room}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#94A3B8] mb-3">
                            Kết thúc: ~{formatTime(s.endTime)}
                          </p>
                          <div className="text-sm font-bold text-[#F8FAFC] mb-4">
                            {Number(s.price || movie.ticketPrice).toLocaleString('vi-VN')} đ
                          </div>
                        </div>

                        <Link
                          href={`/screenings/${s.id}/seats`}
                          className="w-full block py-2.5 bg-gradient-to-r from-[#E11D48] to-[#881337] hover:from-[#F43F5E] hover:to-[#9F1239] text-[#F8FAFC] text-xs font-bold text-center rounded-xl transition shadow-[0_0_12px_rgba(225,29,72,0.35)] border border-rose-500/30"
                        >
                          Chọn ghế ngồi →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[rgba(18,14,28,0.6)] border border-[rgba(192,132,252,0.15)] rounded-2xl p-8 text-center text-[#94A3B8] text-sm">
                    Không có suất chiếu cho ngày này.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[rgba(18,14,28,0.6)] border border-[rgba(192,132,252,0.15)] rounded-2xl p-10 text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-2 text-purple-300 font-bold">
                  ✦
                </div>
                <p className="text-[#94A3B8] text-sm">Hiện chưa có lịch chiếu cho bộ phim này.</p>
              </div>
            )}
          </div>

          {/* Phần 2: Đánh Giá & Bình Luận (ReviewForm + ReviewList) */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[rgba(192,132,252,0.15)]">
              <div className="flex items-center gap-2.5">
                <span className="text-rose-400 font-bold text-lg">✦</span>
                <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
                  Đánh Giá & Nhận Xét ({reviews.length})
                </h2>
              </div>
            </div>

            <div className="space-y-8">
              <ReviewForm
                movieId={movieId}
                movieTitle={movie.title}
                onReviewSubmitted={handleReviewSubmitted}
                onShowToast={showToast}
              />

              <div>
                <h3 className="text-base font-bold text-[#F8FAFC] mb-4">
                  Tất cả đánh giá từ khán giả ({reviews.length})
                </h3>
                <ReviewList reviews={reviews} isLoading={isLoadingReviews} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MovieDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex items-center justify-center font-sans">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#94A3B8]">Đang tải thông tin phim...</span>
          </div>
        </div>
      }
    >
      <MovieDetailContent />
    </Suspense>
  );
}
