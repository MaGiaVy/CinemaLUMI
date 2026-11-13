'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="pb-5 border-b border-white/[0.08]">
          <Link
            href="/admin/screenings"
            className="text-[#94a3b8] hover:text-white text-xs font-bold uppercase tracking-wider mb-2 inline-block transition-colors"
            style={{ textDecoration: 'none' }}
          >
            ← Quay lại danh sách suất chiếu
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[#e11d48] text-sm">✦</span>
            <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
              THÊM SUẤT CHIẾU MỚI
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl p-6 lg:p-8 space-y-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            {/* Chọn phim */}
            <div>
              <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                Chọn phim chiếu <span className="text-[#e11d48]">*</span>
              </label>
              {loadingMovies ? (
                <div className="p-3 bg-white/[0.04] rounded-xl text-[#94a3b8] text-xs">
                  Đang tải danh sách phim...
                </div>
              ) : movies.length === 0 ? (
                <div className="p-4 bg-[#e11d48]/15 border border-[#e11d48]/40 rounded-xl text-xs text-[#fda4af]">
                  Hệ thống chưa có bộ phim nào. Vui lòng{' '}
                  <Link href="/admin/movies/add" className="underline font-bold text-white">
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
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
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
              <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <div className="relative w-14 h-20 rounded-lg overflow-hidden border border-[#c084fc]/25 flex-shrink-0 bg-[#1f192b]">
                  {selectedMovie.poster ? (
                    <Image
                      src={selectedMovie.poster}
                      alt={selectedMovie.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#94a3b8]">
                      NO POSTER
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">{selectedMovie.title}</h4>
                  <p className="text-[#94a3b8] text-xs">
                    Thể loại: <span className="text-white font-semibold">{selectedMovie.genre}</span>
                  </p>
                  <p className="text-[#94a3b8] text-xs">
                    Thời lượng: <span className="text-[#c084fc] font-bold">{selectedMovie.duration} phút</span>
                    {selectedMovie.ageRating && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-white/[0.08] text-white text-[10px] border border-white/10 font-bold">
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
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Phòng chiếu <span className="text-[#e11d48]">*</span>
                </label>
                <select
                  name="room_number"
                  value={form.room_number}
                  onChange={handleFieldChange}
                  required
                  disabled={submitting}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
                >
                  <option value="1">Cinema 01 (Laser 4K Cosmos)</option>
                  <option value="2">Cinema 02 (Dolby Atmos 360)</option>
                  <option value="3">Cinema 03 (Standard 2D)</option>
                  <option value="4">Cinema 04 (Laser 4K Cosmos)</option>
                  <option value="5">Cinema 05 (VIP Cosmos Suite)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Giá vé cơ bản (VNĐ) <span className="text-[#e11d48]">*</span>
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
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Ngày chiếu & Giờ chiếu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Ngày chiếu <span className="text-[#e11d48]">*</span>
                </label>
                <input
                  type="date"
                  name="screening_date"
                  value={form.screening_date}
                  onChange={handleFieldChange}
                  required
                  disabled={submitting}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Giờ bắt đầu chiếu <span className="text-[#e11d48]">*</span>
                </label>
                <input
                  type="time"
                  name="screening_time"
                  value={form.screening_time}
                  onChange={handleFieldChange}
                  required
                  disabled={submitting}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Hộp tóm tắt thời gian & sơ đồ ghế tự động tạo (BR-08) */}
            <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl space-y-2 text-xs text-[#94a3b8]">
              <div className="flex items-center justify-between text-white font-medium">
                <span>Khung giờ dự kiến (Bao gồm 15p dọn phòng BR-08):</span>
                <span className="text-[#fda4af] font-black">
                  {form.screening_time} → {estimatedEndTime || '...'}
                </span>
              </div>
              <p className="text-[11px]">
                Thời gian kết thúc = Giờ bắt đầu + Thời lượng phim ({selectedMovie?.duration || 0} phút) + 15 phút dọn dẹp vệ sinh phòng (BR-08).
              </p>
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-white">
                <span>Tự động khởi tạo cấu hình phòng:</span>
                <span className="text-[#86efac] font-bold">50 ghế (A1 - E10, trạng thái EMPTY)</span>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/screenings"
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-bold rounded-lg transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={submitting || movies.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? 'Đang kiểm tra lịch & tạo ghế...' : 'LƯU SUẤT CHIẾU MỚI'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
