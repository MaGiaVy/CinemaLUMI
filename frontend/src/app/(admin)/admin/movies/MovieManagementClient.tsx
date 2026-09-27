'use client';

import { useState } from 'react';
import { Movie } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StarRating from '@/components/ui/StarRating';

interface MovieManagementClientProps {
  initialMovies: Movie[];
}

const GENRES = [
  'Hành động',
  'Hài',
  'Hoạt hình',
  'Tâm lý',
  'Âm nhạc',
  'Siêu anh hùng',
  'Gia đình',
  'Khoa học viễn tưởng',
  'Gián điệp',
  'Kỳ ảo',
  'Tội phạm',
];

export default function MovieManagementClient({ initialMovies }: MovieManagementClientProps) {
  const [movieList, setMovieList] = useState<Movie[]>(initialMovies);
  const [addModal, setAddModal] = useState(false);
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [form, setForm] = useState<{
    title: string;
    genre: string;
    duration: string;
    description: string;
    director: string;
    releaseDate: string;
    status: Movie['status'];
  }>({
    title: '',
    genre: '',
    duration: '',
    description: '',
    director: '',
    releaseDate: '',
    status: 'showing',
  });

  const filtered = movieList.filter(
    m =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.genre.join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (m: Movie) => {
    setEditMovie(m);
    setForm({
      title: m.title,
      genre: m.genre[0] || '',
      duration: String(m.duration),
      description: m.description,
      director: m.director,
      releaseDate: m.releaseDate,
      status: m.status,
    });
    setAddModal(true);
  };

  const handleSave = () => {
    if (editMovie) {
      setMovieList(prev =>
        prev.map(m =>
          m.id === editMovie.id
            ? {
                ...m,
                ...form,
                duration: Number(form.duration),
                genre: [form.genre],
                status: form.status,
              }
            : m
        )
      );
      showToast('Đã cập nhật thông tin phim!', 'success');
    } else {
      const newMovie: Movie = {
        id: `m${Date.now()}`,
        title: form.title,
        genre: [form.genre],
        duration: Number(form.duration),
        rating: 0,
        description: form.description,
        director: form.director,
        cast: [],
        releaseDate: form.releaseDate,
        poster:
          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop&auto=format',
        banner:
          'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=500&fit=crop&auto=format',
        status: form.status,
        ticketPrice: 120000,
      };
      setMovieList(prev => [newMovie, ...prev]);
      showToast('Đã thêm phim mới!', 'success');
    }
    setAddModal(false);
    setEditMovie(null);
    setForm({
      title: '',
      genre: '',
      duration: '',
      description: '',
      director: '',
      releaseDate: '',
      status: 'showing',
    });
  };

  const handleDelete = (id: string) => {
    setMovieList(prev => prev.filter(m => m.id !== id));
    setDeleteId(null);
    showToast('Đã xóa phim.', 'info');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-white font-medium shadow-xl ${
              toast.type === 'success'
                ? 'bg-[#2ECC71]'
                : toast.type === 'error'
                ? 'bg-[#E63946]'
                : 'bg-[#0088FF]'
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Quản Lý Phim</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">{movieList.length} phim trong hệ thống</p>
          </div>
          <Button
            onClick={() => {
              setEditMovie(null);
              setForm({
                title: '',
                genre: '',
                duration: '',
                description: '',
                director: '',
                releaseDate: '',
                status: 'showing',
              });
              setAddModal(true);
            }}
          >
            + Thêm phim
          </Button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040]">
                <th className="text-left px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide">
                  Phim
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide hidden md:table-cell">
                  Thể loại
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">
                  Thời lượng
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">
                  Đánh giá
                </th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="text-right px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wide">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040]">
              {filtered.map(movie => (
                <tr key={movie.id} className="hover:bg-[#383838] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{movie.title}</p>
                        <p className="text-[#B3B3B3] text-xs">{movie.director}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {movie.genre.map(g => (
                        <Badge key={g} variant="blue" size="sm">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white text-sm hidden lg:table-cell">
                    {movie.duration} phút
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <StarRating value={movie.rating} readonly size="sm" />
                      <span className="text-[#FFB703] text-xs font-bold">{movie.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        movie.status === 'showing'
                          ? 'green'
                          : movie.status === 'coming_soon'
                          ? 'gold'
                          : 'gray'
                      }
                    >
                      {movie.status === 'showing'
                        ? 'Đang chiếu'
                        : movie.status === 'coming_soon'
                        ? 'Sắp chiếu'
                        : 'Đã hết'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(movie)}>
                        Sửa
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(movie.id)}>
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal add / edit */}
        <Modal
          isOpen={addModal}
          onClose={() => {
            setAddModal(false);
            setEditMovie(null);
          }}
          title={editMovie ? 'Chỉnh sửa thông tin phim' : 'Thêm phim mới'}
          maxWidth="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Tên phim *</label>
              <input
                type="text"
                placeholder="Tên phim"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Thể loại *</label>
              <select
                value={form.genre}
                onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
              >
                <option value="">Chọn thể loại</option>
                {GENRES.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Thời lượng (phút)</label>
              <input
                type="number"
                placeholder="120"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Đạo diễn</label>
              <input
                type="text"
                placeholder="Tên đạo diễn"
                value={form.director}
                onChange={e => setForm(f => ({ ...f, director: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Ngày phát hành</label>
              <input
                type="date"
                value={form.releaseDate}
                onChange={e => setForm(f => ({ ...f, releaseDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Movie['status'] }))}
              >
                <option value="showing">Đang chiếu</option>
                <option value="coming_soon">Sắp ra mắt</option>
                <option value="ended">Đã kết thúc</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Mô tả</label>
              <textarea
                rows={3}
                placeholder="Mô tả phim..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setAddModal(false);
                  setEditMovie(null);
                }}
              >
                Hủy
              </Button>
              <Button onClick={handleSave}>{editMovie ? 'Lưu thay đổi' : 'Thêm phim'}</Button>
            </div>
          </div>
        </Modal>

        {/* Modal delete */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xác nhận xóa phim">
          <p className="text-[#B3B3B3] text-sm mb-4">
            Bạn có chắc chắn muốn xóa bộ phim này khỏi hệ thống không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>
              Xác nhận xóa
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
