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
import { movies as mockMovies } from '@/data/mockData';

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
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Định dạng ngày (Thứ, dd/mm)
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '---';
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function MovieDetailContent() {
  const params = useParams();
  const movieIdParam = (params?.id as string | undefined) ?? '';
  const movieIdNumber = Number.parseInt(movieIdParam.replace(/\D/g, ''), 10);
  const movieId = Number.isFinite(movieIdNumber) && movieIdNumber > 0 ? movieIdNumber : null;

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
    const mockMovie = mockMovies.find(m => m.id.toLowerCase() === movieIdParam.toLowerCase());

    if (mockMovie) {
      setMovie({
        id: Number.parseInt(String(mockMovie.id).replace(/\D/g, ''), 10) || 0,
        title: mockMovie.title,
        slug: mockMovie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: mockMovie.description,
        duration: mockMovie.duration,
        releaseDate: mockMovie.releaseDate,
        ageRating: 'P',
        poster: mockMovie.poster,
        trailer: mockMovie.banner,
        rating: mockMovie.rating,
        genre: mockMovie.genre.join(', '),
        director: mockMovie.director,
        cast: mockMovie.cast.join(', '),
        status: mockMovie.status === 'showing' ? 'SHOWING' : 'UPCOMING',
        ticketPrice: mockMovie.ticketPrice,
        screenings: [],
      });
      setIsLoadingMovie(false);
      return;
    }

    if (!movieId) {
      setIsLoadingMovie(false);
      return;
    }

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
  }, [movieId, movieIdParam, showToast]);

  // 2. Tải danh sách đánh giá từ GET /api/reviews?movie_id=...
  const fetchReviewsData = useCallback(async () => {
    const mockMovie = mockMovies.find(m => m.id.toLowerCase() === movieIdParam.toLowerCase());

    if (mockMovie) {
      setReviews([]);
      setIsLoadingReviews(false);
      return;
    }

    if (!movieId) {
      setIsLoadingReviews(false);
      return;
    }

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
  }, [movieId, movieIdParam]);

  useEffect(() => {
    fetchMovieData();
    fetchReviewsData();
  }, [fetchMovieData, fetchReviewsData]);

  // Callback khi submit đánh giá thành công
  const handleReviewSubmitted = (newReview: ReviewResponseItem) => {
    // Thêm hoặc cập nhật đánh giá trong state
    setReviews(prev => {
      const filtered = prev.filter(r => r.userId !== newReview.userId && r.id !== newReview.id);
      return [newReview, ...filtered];
    });

    // Cập nhật lại thông tin điểm của phim
    fetchMovieData();
  };

  // Gom nhóm danh sách suất chiếu theo ngày
  const uniqueDates = useMemo(() => {
    if (!movie?.screenings || movie.screenings.length === 0) return [];
    const dateMap = new Map<string, string>();
    movie.screenings.forEach(s => {
      const d = new Date(s.date || s.startTime).toISOString().split('T')[0];
      if (!dateMap.has(d)) {
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
      const d = new Date(s.date || s.startTime).toISOString().split('T')[0];
      return d === currentDate;
    });
  }, [movie?.screenings, uniqueDates, selectedDateIndex]);

  if (isLoadingMovie) {
    return (
      <div className="min-h-screen bg-[#111217] text-white flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Đang tải thông tin phim...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#111217] text-white py-16 px-4">
        <div className="max-w-md mx-auto bg-[#1A1C24] border border-[#2B2E3D] rounded-2xl p-8 text-center shadow-2xl">
          <span className="text-5xl block mb-4">🎬</span>
          <h2 className="text-xl font-bold text-white mb-2">Phim không tồn tại</h2>
          <p className="text-gray-400 text-sm mb-6">
            Không tìm thấy thông tin bộ phim yêu cầu hoặc phim đã ngừng chiếu.
          </p>
          <Link
            href="/"
            className="inline-block py-2.5 px-6 bg-[#E63946] hover:bg-[#C62B36] text-white text-sm font-semibold rounded-xl transition"
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

      <div className="min-h-screen bg-[#111217] text-white">
        {/* Banner Hero */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-black/60">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover blur-md scale-105 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111217] via-[#111217]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111217] via-[#111217]/40 to-transparent" />
        </div>

        {/* Khối Nội Dung Chính (Poster + Info) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-44 sm:-mt-56 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            {/* Poster nổi bật */}
            <div className="relative w-48 sm:w-60 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#2F3243] flex-shrink-0 bg-black/50 mx-auto md:mx-0">
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-auto object-cover aspect-[2/3]"
              />
              {movie.ageRating && (
                <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded shadow">
                  {movie.ageRating}
                </div>
              )}
            </div>

            {/* Thông tin chi tiết */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              {/* Thể loại & Trạng thái */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {genres.map(g => (
                  <Badge key={g} variant="red" size="md">
                    {g}
                  </Badge>
                ))}
                <Badge variant={movie.status === 'SHOWING' ? 'green' : 'gold'} size="md">
                  {movie.status === 'SHOWING' ? 'Đang chiếu' : 'Sắp ra mắt'}
                </Badge>
              </div>

              {/* Tên phim */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Rating sao & Thời lượng */}
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(avgRatingNumber)} readonly size="sm" />
                  <span className="text-[#FFB703] font-bold text-lg">{avgRatingNumber.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">({reviews.length} đánh giá)</span>
                </div>
                <span>•</span>
                <span>⏱️ {movie.duration} phút</span>
                <span>•</span>
                <span>📅 Khởi chiếu: {formatDate(movie.releaseDate)}</span>
              </div>

              {/* Đạo diễn & Diễn viên */}
              <div className="text-xs text-gray-400 space-y-1">
                {movie.director && (
                  <p>
                    <span className="text-gray-500">Đạo diễn:</span>{' '}
                    <span className="text-gray-200 font-medium">{movie.director}</span>
                  </p>
                )}
                {movie.cast && (
                  <p>
                    <span className="text-gray-500">Diễn viên:</span>{' '}
                    <span className="text-gray-200 font-medium">{movie.cast}</span>
                  </p>
                )}
              </div>

              {/* Mô tả tóm tắt nội dung */}
              {movie.description && (
                <div>
                  <p
                    className={`text-gray-300 text-sm leading-relaxed ${
                      !isDescriptionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {movie.description}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(prev => !prev)}
                    className="text-[#E63946] text-xs font-semibold mt-1 hover:underline cursor-pointer"
                  >
                    {isDescriptionExpanded ? 'Thu gọn ▲' : 'Đọc thêm ▼'}
                  </button>
                </div>
              )}

              {/* Giá vé tham khảo & Link chỉnh sửa phim */}
              <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Giá vé tiêu chuẩn:</span>
                  <span className="text-xl font-bold text-[#FFB703]">
                    {Number(movie.ticketPrice || 120000).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <Link
                  href={`/admin/movies/${movie.id}/edit`}
                  className="px-3 py-1 bg-[#252836] hover:bg-[#34384c] text-white text-xs font-semibold rounded-lg border border-[#40455c] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>✏️</span> Chỉnh sửa phim (Admin)
                </Link>
              </div>
            </div>
          </div>

          {/* Phần 1: Lịch Chiếu & Suất Chiếu */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#252836]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎟️</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">Lịch Chiếu & Đặt Vé</h2>
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
                          ? 'bg-[#E63946] text-white shadow-lg shadow-red-600/30'
                          : 'bg-[#1A1C24] text-gray-400 hover:text-white hover:bg-[#252836] border border-[#2B2E3D]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Danh sách thẻ suất chiếu */}
                {filteredScreenings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredScreenings.map(s => (
                      <div
                        key={s.id}
                        className="bg-[#1A1C24] border border-[#252836] hover:border-[#3E4259] rounded-2xl p-4.5 transition shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-black text-white font-mono">
                              {formatTime(s.startTime)}
                            </span>
                            <Badge variant="gold" size="sm">
                              Phòng {s.room}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">
                            Kết thúc: ~{formatTime(s.endTime)}
                          </p>
                          <div className="text-sm font-bold text-[#FFB703] mb-4">
                            {Number(s.price || movie.ticketPrice).toLocaleString('vi-VN')} đ
                          </div>
                        </div>

                        <Link
                          href={`/screenings/${s.id}/seats`}
                          className="w-full block py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-bold text-center rounded-xl transition shadow"
                        >
                          Chọn ghế ngồi →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-8 text-center text-gray-400 text-sm">
                    Không có suất chiếu cho ngày này.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1A1C24] border border-[#252836] rounded-2xl p-10 text-center">
                <span className="text-4xl block mb-2">📅</span>
                <p className="text-gray-400 text-sm">Hiện chưa có lịch chiếu cho bộ phim này.</p>
              </div>
            )}
          </div>

          {/* Phần 2: Đánh Giá & Bình Luận (ReviewForm + ReviewList) */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#252836]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Đánh Giá & Nhận Xét ({reviews.length})
                </h2>
              </div>
            </div>

            {/* Bố cục 2 khối: Form đánh giá bên trên, Danh sách bình luận bên dưới */}
            <div className="space-y-8">
              {/* Component ReviewForm: Form nhập số sao & bình luận (chỉ hiển thị khi đã đăng nhập, bắt lỗi 403) */}
              <ReviewForm
                movieId={movieId ?? 0}
                movieTitle={movie.title}
                onReviewSubmitted={handleReviewSubmitted}
                onShowToast={showToast}
              />

              {/* Component ReviewList: Hiển thị danh sách đánh giá của phim */}
              <div>
                <h3 className="text-base font-bold text-white mb-4">
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
        <div className="min-h-screen bg-[#111217] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải thông tin phim...</span>
          </div>
        </div>
      }
    >
      <MovieDetailContent />
    </Suspense>
  );
}
