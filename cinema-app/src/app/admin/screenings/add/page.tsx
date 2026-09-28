'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Toast, { ToastMessage } from '@/components/ui/Toast';

interface MovieOption {
  id: number;
  title: string;
  duration: number;
  poster: string;
  genre: string;
  ageRating: string | null;
  ticketPrice: number;
}

export default function AddScreeningPage() {
  const router = useRouter();

  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Mặc định ngày chiếu là ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [form, setForm] = useState({
    movie_id: '',
    room_number: '1',
    screening_date: defaultDate,
    screening_time: '19:00',
    base_price: '120000',
  });

  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Khi form load, gọi API lấy danh sách Phim để đổ vào thẻ <select>
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch('/api/movies');
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data)) {
          setMovies(data.data);
          if (data.data.length > 0) {
            setForm(prev => ({
              ...prev,
              movie_id: String(data.data[0].id),
              base_price: String(data.data[0].ticketPrice || 120000),
            }));
          }
        } else {
          showToast('Không thể tải danh sách phim từ hệ thống', 'error');
        }
      } catch {
        showToast('Lỗi kết nối khi tải danh sách phim', 'error');
      } finally {
        setLoadingMovies(false);
      }
    };

    fetchMovies();
  }, []);

  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Khi đổi phim, cập nhật luôn giá vé mặc định của phim đó
    if (name === 'movie_id') {
      const selected = movies.find(m => String(m.id) === value);
      setForm(prev => ({
        ...prev,
        movie_id: value,
        base_price: selected ? String(selected.ticketPrice || 120000) : prev.base_price,
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Phim đang được chọn
  const selectedMovie = movies.find(m => String(m.id) === form.movie_id);

  // Tính toán thời gian dự kiến kết thúc
  let estimatedEndTime = '';
  if (selectedMovie && form.screening_time && form.screening_date) {
    try {
      const start = new Date(`${form.screening_date}T${form.screening_time}:00`);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + (selectedMovie.duration + 15) * 60 * 1000);
        estimatedEndTime = end.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      estimatedEndTime = '';
    }
  }

  // 2. Xử lý submit form và gọi API
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.movie_id) {
      showToast('Vui lòng chọn một bộ phim', 'warning');
      return;
    }

    if (!form.room_number || !form.screening_date || !form.screening_time) {
      showToast('Vui lòng điền đầy đủ thông tin phòng, ngày và giờ chiếu', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        movie_id: Number(form.movie_id),
        room_number: Number(form.room_number),
        screening_date: form.screening_date,
        screening_time: form.screening_time,
        base_price: Number(form.base_price) || 120000,
      };

      const res = await fetch('/api/screenings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // 3. Bắt lỗi từ API trả về (lỗi trùng phòng, trùng giờ, hoặc validate thất bại)
      if (!res.ok || !data.success) {
        showToast(
          data.message || 'Không thể tạo suất chiếu. Vui lòng kiểm tra lại khung giờ và phòng chiếu.',
          'error'
        );
        setSubmitting(false);
        return;
      }

      // 4. Thành công -> Báo Toast và redirect về trang danh sách
      showToast(
        data.message || 'Tạo suất chiếu và 50 ghế thành công! Đang chuyển hướng...',
        'success'
      );

      setTimeout(() => {
        router.push('/admin/screenings');
        router.refresh();
      }, 1200);
    } catch {
      showToast('Lỗi kết nối máy chủ khi tạo suất chiếu. Vui lòng thử lại.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex-1 bg-[#1A1A1A] p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/admin/screenings"
                className="text-[#B3B3B3] hover:text-white text-xs font-semibold uppercase tracking-wider mb-1 inline-block transition-colors"
              >
                ← Quay lại danh sách suất chiếu
              </Link>
              <h1 className="text-2xl lg:text-3xl font-black text-white">Thêm Suất Chiếu Mới</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 lg:p-8 space-y-6 shadow-xl">
              {/* Chọn phim */}
              <div>
                <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                  Chọn phim chiếu <span className="text-[#E63946]">*</span>
                </label>
                {loadingMovies ? (
                  <div className="p-3 bg-[#383838] rounded-md text-[#B3B3B3] text-sm">
                    Đang tải danh sách phim...
                  </div>
                ) : movies.length === 0 ? (
                  <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/30 rounded-md text-sm text-[#E63946]">
                    Hệ thống chưa có bộ phim nào. Vui lòng{' '}
                    <Link href="/admin/movies/add" className="underline font-bold">
                      thêm phim mới
                    </Link>{' '}
                    trước khi lên lịch chiếu.
                  </div>
                ) : (
                  <select
                    name="movie_id"
                    value={form.movie_id}
                    onChange={handleFieldChange}
                    required
                    disabled={submitting}
                  >
                    {movies.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.duration} phút) {m.ageRating ? `[${m.ageRating}]` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Thông tin xem trước của phim đã chọn */}
              {selectedMovie && (
                <div className="flex items-center gap-4 p-4 bg-[#242424] border border-[#404040] rounded-xl">
                  <img
                    src={selectedMovie.poster || 'https://via.placeholder.com/80x120?text=No+Poster'}
                    alt={selectedMovie.title}
                    className="w-16 h-24 object-cover rounded-lg border border-[#525252] flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-base">{selectedMovie.title}</h4>
                    <p className="text-[#B3B3B3] text-xs">
                      Thể loại: <span className="text-white">{selectedMovie.genre}</span>
                    </p>
                    <p className="text-[#B3B3B3] text-xs">
                      Thời lượng: <span className="text-white font-semibold">{selectedMovie.duration} phút</span>
                      {selectedMovie.ageRating && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-[#404040] text-white text-[10px]">
                          {selectedMovie.ageRating}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Phòng chiếu & Giá vé */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Phòng chiếu <span className="text-[#E63946]">*</span>
                  </label>
                  <select
                    name="room_number"
                    value={form.room_number}
                    onChange={handleFieldChange}
                    required
                    disabled={submitting}
                  >
                    <option value="1">Cinema 01 (Phòng 1)</option>
                    <option value="2">Cinema 02 (Phòng 2)</option>
                    <option value="3">Cinema 03 (Phòng 3)</option>
                    <option value="4">Cinema 04 (Phòng 4)</option>
                    <option value="5">Cinema 05 (Phòng 5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Giá vé cơ bản (VNĐ) <span className="text-[#E63946]">*</span>
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    value={form.base_price}
                    onChange={handleFieldChange}
                    step="5000"
                    min="50000"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Ngày chiếu & Giờ chiếu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Ngày chiếu <span className="text-[#E63946]">*</span>
                  </label>
                  <input
                    type="date"
                    name="screening_date"
                    value={form.screening_date}
                    onChange={handleFieldChange}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Giờ bắt đầu chiếu <span className="text-[#E63946]">*</span>
                  </label>
                  <input
                    type="time"
                    name="screening_time"
                    value={form.screening_time}
                    onChange={handleFieldChange}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Hộp tóm tắt thời gian & sơ đồ ghế tự động tạo */}
              <div className="p-4 bg-[#1F1F1F] border border-[#383838] rounded-xl space-y-2 text-xs text-[#B3B3B3]">
                <div className="flex items-center justify-between text-white font-medium">
                  <span>Khung giờ dự kiến:</span>
                  <span className="text-[#FFB703] font-bold">
                    {form.screening_time} → {estimatedEndTime || '...'}
                  </span>
                </div>
                <p>
                  * Thời gian kết thúc = Giờ chiếu + Thời lượng phim ({selectedMovie?.duration || 0} phút) + 15 phút dọn dẹp vệ sinh phòng.
                </p>
                <div className="pt-2 border-t border-[#333333] flex items-center justify-between text-white">
                  <span>Tự động khởi tạo ghế:</span>
                  <span className="text-green-400 font-bold">50 ghế (A1 - E10, trạng thái EMPTY)</span>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <Link href="/admin/screenings">
                <Button variant="secondary" size="md" type="button" disabled={submitting}>
                  Hủy bỏ
                </Button>
              </Link>
              <Button size="md" type="submit" disabled={submitting || movies.length === 0}>
                {submitting ? 'Đang kiểm tra lịch & tạo ghế...' : 'Lưu suất chiếu mới'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
