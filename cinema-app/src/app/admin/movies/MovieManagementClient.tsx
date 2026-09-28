'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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

      <div className="flex-1 bg-[#1A1A1A] p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-white">Quản Lý Phim</h1>
              <p className="text-[#B3B3B3] text-sm mt-1">
                Tổng cộng có <span className="text-[#E63946] font-semibold">{movieList.length}</span> bộ phim trong hệ thống
              </p>
            </div>
            <Link href="/admin/movies/add">
              <Button size="md">
                + Thêm phim mới
              </Button>
            </Link>
          </div>

          {/* Thanh công cụ: Search & Bộ lọc */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên phim, thể loại, đạo diễn..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="SHOWING">Đang chiếu (SHOWING)</option>
                <option value="UPCOMING">Sắp chiếu (UPCOMING)</option>
                <option value="ENDED">Đã kết thúc (ENDED)</option>
              </select>
            </div>
          </div>

          {/* Bảng danh sách phim */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#404040] bg-[#242424]">
                    <th className="px-5 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Phim
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                      Thể loại
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                      Thời lượng
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                      Đánh giá
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#404040]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[#B3B3B3] text-sm">
                        {search || statusFilter !== 'ALL'
                          ? 'Không tìm thấy bộ phim nào phù hợp với bộ lọc.'
                          : 'Hệ thống chưa có bộ phim nào. Hãy bấm nút "+ Thêm phim mới" để bắt đầu!'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(movie => (
                      <tr key={movie.id} className="hover:bg-[#383838] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={movie.poster || 'https://via.placeholder.com/80x120?text=No+Poster'}
                              alt={movie.title}
                              className="w-12 h-16 object-cover rounded-md flex-shrink-0 bg-[#1A1A1A] border border-[#404040]"
                            />
                            <div>
                              <p className="text-white font-bold text-sm line-clamp-1">
                                {movie.title}
                              </p>
                              <p className="text-[#B3B3B3] text-xs mt-0.5">
                                {movie.director ? `ĐD: ${movie.director}` : 'Chưa cập nhật đạo diễn'}
                              </p>
                              {movie.ageRating && (
                                <span className="inline-block mt-1 text-[11px] px-1.5 py-0.5 rounded bg-[#404040] text-white font-medium">
                                  {movie.ageRating}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="flex gap-1.5 flex-wrap max-w-xs">
                            {movie.genre.split(',').map((g, i) => (
                              <Badge key={i} variant="blue" size="sm">
                                {g.trim()}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[#B3B3B3] text-sm hidden lg:table-cell">
                          {movie.duration} phút
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <StarRating value={Math.round(movie.rating || 0)} readonly size="sm" />
                            <span className="text-[#FFB703] text-xs font-bold">
                              {Number(movie.rating).toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {movie.status === 'SHOWING' && (
                            <Badge variant="green">Đang chiếu</Badge>
                          )}
                          {movie.status === 'UPCOMING' && (
                            <Badge variant="gold">Sắp ra mắt</Badge>
                          )}
                          {movie.status === 'ENDED' && (
                            <Badge variant="gray">Đã kết thúc</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/movies/${movie.id}/edit`}
                              className="px-3 py-1.5 bg-[#383838] hover:bg-[#484848] text-white text-xs font-medium rounded transition-colors cursor-pointer border border-[#525252] inline-block"
                            >
                              Sửa
                            </Link>
                            <button
                              onClick={() => setDeleteMovie(movie)}
                              className="px-3 py-1.5 bg-[#E63946]/10 hover:bg-[#E63946] text-[#E63946] hover:text-white text-xs font-medium rounded transition-colors cursor-pointer border border-[#E63946]/30"
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
      </div>

      {/* Modal xác nhận xóa */}
      {deleteMovie && (
        <Modal
          isOpen={!!deleteMovie}
          onClose={() => setDeleteMovie(null)}
          title="Xác nhận xóa phim"
        >
          <div className="space-y-4">
            <p className="text-white text-sm">
              Bạn có chắc chắn muốn xóa bộ phim <strong className="text-[#E63946]">&ldquo;{deleteMovie.title}&rdquo;</strong> khỏi hệ thống?
            </p>
            <p className="text-[#B3B3B3] text-xs">
              Lưu ý: Nếu phim đang có suất chiếu ở trạng thái UPCOMING hoặc SHOWING, hệ thống sẽ ngăn chặn thao tác xóa để bảo toàn dữ liệu đặt vé.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#404040]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteMovie(null)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa phim'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
