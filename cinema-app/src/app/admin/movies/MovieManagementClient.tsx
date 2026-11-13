'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import StarRating from '@/components/ui/StarRating';
import Toast, { ToastMessage } from '@/components/ui/Toast';

export interface MovieItem {
  id: number;
  title: string;
  genre: string;
  duration: number;
  poster: string;
  description: string | null;
  rating: number;
  releaseDate: string;
  endDate: string | null;
  ageRating: string | null;
  director: string | null;
  cast: string | null;
  status: 'SHOWING' | 'UPCOMING' | 'ENDED';
  ticketPrice: number;
  createdAt: string;
}

interface MovieManagementClientProps {
  initialMovies: MovieItem[];
}

export default function MovieManagementClient({ initialMovies }: MovieManagementClientProps) {
  const [movieList, setMovieList] = useState<MovieItem[]>(initialMovies);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteMovie, setDeleteMovie] = useState<MovieItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Lọc phim theo từ khóa tìm kiếm và trạng thái
  const filtered = movieList.filter(m => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.genre && m.genre.toLowerCase().includes(search.toLowerCase())) ||
      (m.director && m.director.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Xử lý xóa phim với ràng buộc nghiệp vụ
  const handleDelete = async () => {
    if (!deleteMovie) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/movies/${deleteMovie.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Không thể xóa phim này.', 'error');
        setIsDeleting(false);
        setDeleteMovie(null);
        return;
      }

      setMovieList(prev => prev.filter(m => m.id !== deleteMovie.id));
      showToast(data.message || `Đã xóa phim "${deleteMovie.title}" thành công!`, 'info');
      setDeleteMovie(null);
    } catch {
      showToast('Đã xảy ra lỗi khi xóa phim. Vui lòng thử lại sau.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#e11d48] text-sm">✦</span>
              <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
                QUẢN LÝ DANH MỤC PHIM
              </h1>
            </div>
            <p className="text-[#94a3b8] text-xs mt-1">
              Hệ thống hiện có <strong className="text-[#fda4af] font-bold">{movieList.length}</strong> bộ phim trong cơ sở dữ liệu
            </p>
          </div>
          <Link
            href="/admin/movies/add"
            className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider text-center"
            style={{ textDecoration: 'none' }}
          >
            + THÊM PHIM MỚI
          </Link>
        </div>

        {/* Thanh công cụ: Search & Bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phim, thể loại, đạo diễn..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SHOWING">Đang chiếu (SHOWING)</option>
              <option value="UPCOMING">Sắp chiếu (UPCOMING)</option>
              <option value="ENDED">Đã kết thúc (ENDED)</option>
            </select>
          </div>
        </div>

        {/* Bảng danh sách phim */}
        <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-bold text-[#c084fc] uppercase tracking-wider bg-white/[0.02]">
                  <th className="px-5 py-3.5">Phim</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Thể loại</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Thời lượng</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Đánh giá</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-[#94a3b8] text-xs">
                      {search || statusFilter !== 'ALL'
                        ? 'Không tìm thấy bộ phim nào phù hợp với bộ lọc.'
                        : 'Hệ thống chưa có bộ phim nào. Hãy bấm nút "+ THÊM PHIM MỚI" để bắt đầu!'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(movie => (
                    <tr key={movie.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-[#1f192b] border border-[#c084fc]/20">
                            {movie.poster ? (
                              <Image
                                src={movie.poster}
                                alt={movie.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-[#94a3b8]">
                                NO POSTER
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs line-clamp-1">
                              {movie.title}
                            </p>
                            <p className="text-[#94a3b8] text-[11px] mt-0.5">
                              {movie.director ? `ĐD: ${movie.director}` : 'Chưa cập nhật đạo diễn'}
                            </p>
                            {movie.ageRating && (
                              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-white/[0.08] text-[#cbd5e1] font-semibold border border-white/10">
                                {movie.ageRating}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex gap-1.5 flex-wrap max-w-xs">
                          {movie.genre.split(',').map((g, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#581c87]/30 border border-[#c084fc]/30 text-[#e9d5ff] font-semibold"
                            >
                              {g.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#94a3b8] hidden lg:table-cell">
                        {movie.duration} phút
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <StarRating value={Math.round(movie.rating || 0)} readonly size="sm" />
                          <span className="text-[#fda4af] text-xs font-bold">
                            {Number(movie.rating).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {movie.status === 'SHOWING' && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#e11d48]/25 border border-[#e11d48] text-[#fda4af] uppercase tracking-wider">
                            Đang chiếu
                          </span>
                        )}
                        {movie.status === 'UPCOMING' && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#881337]/35 border border-[#c084fc]/40 text-[#f472b6] uppercase tracking-wider">
                            Sắp ra mắt
                          </span>
                        )}
                        {movie.status === 'ENDED' && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-white/[0.08] border border-white/20 text-[#94a3b8] uppercase tracking-wider">
                            Đã kết thúc
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/movies/${movie.id}/edit`}
                            className="px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1] text-white text-[11px] font-bold rounded border border-white/[0.1] transition-colors"
                            style={{ textDecoration: 'none' }}
                          >
                            Sửa
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteMovie(movie)}
                            className="px-3 py-1 bg-[#e11d48]/15 hover:bg-[#e11d48]/30 text-[#fda4af] text-[11px] font-bold rounded border border-[#e11d48]/40 transition-colors cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      {deleteMovie && (
        <Modal
          isOpen={!!deleteMovie}
          onClose={() => setDeleteMovie(null)}
          title="XÁC NHẬN XÓA PHIM"
        >
          <div className="space-y-4">
            <p className="text-[#f8fafc] text-xs">
              Bạn có chắc chắn muốn xóa bộ phim <strong className="text-[#fda4af]">&ldquo;{deleteMovie.title}&rdquo;</strong> khỏi hệ thống?
            </p>
            <p className="text-[#94a3b8] text-[11px]">
              Lưu ý: Nếu phim đang có suất chiếu ở trạng thái UPCOMING hoặc SHOWING, hệ thống sẽ ngăn chặn thao tác xóa để bảo toàn dữ liệu đặt vé.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setDeleteMovie(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#881337] text-white text-xs font-black rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.6)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
