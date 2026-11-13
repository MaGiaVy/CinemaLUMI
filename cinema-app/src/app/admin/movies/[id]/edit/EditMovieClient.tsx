'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import { MovieItem } from '../../MovieManagementClient';

interface EditMovieClientProps {
  initialMovie: MovieItem;
}

export default function EditMovieClient({ initialMovie }: EditMovieClientProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: initialMovie.title,
    genre: initialMovie.genre,
    duration: String(initialMovie.duration),
    ticket_price: String(initialMovie.ticketPrice),
    release_date: initialMovie.releaseDate,
    end_date: initialMovie.endDate || '',
    age_rating: initialMovie.ageRating || 'P',
    status: initialMovie.status,
    director: initialMovie.director || '',
    cast: initialMovie.cast || '',
    trailer: '',
    rating: String(initialMovie.rating),
    description: initialMovie.description || '',
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(initialMovie.poster);
  const [manualPosterUrl, setManualPosterUrl] = useState(initialMovie.poster);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn một file hình ảnh (JPG, PNG, WEBP...)', 'error');
        return;
      }
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
      setManualPosterUrl('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Validation đầu vào
    if (!form.title.trim() || !form.genre.trim() || !form.duration || !form.release_date) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'warning');
      return;
    }

    setLoading(true);

    try {
      let finalPosterUrl = manualPosterUrl.trim() || initialMovie.poster;

      // 2. Nếu Admin chọn một file ảnh mới -> Upload lên Cloudinary trước
      if (posterFile) {
        showToast('Đang tải ảnh poster mới lên Cloudinary...', 'info');

        const uploadFormData = new FormData();
        uploadFormData.append('file', posterFile);

        const uploadRes = await fetch('/api/movies/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.success) {
          showToast(uploadData.message || 'Tải ảnh poster lên Cloudinary thất bại', 'error');
          setLoading(false);
          return;
        }

        finalPosterUrl = uploadData.data.url;
        showToast('Tải ảnh poster mới thành công! Đang lưu thay đổi...', 'success');
      }

      // 3. Gộp payload và gửi PUT /api/movies/[id]
      const moviePayload = {
        title: form.title.trim(),
        genre: form.genre.trim(),
        duration: Number(form.duration),
        ticket_price: Number(form.ticket_price) || 120000,
        release_date: form.release_date,
        end_date: form.end_date || null,
        age_rating: form.age_rating,
        status: form.status,
        director: form.director.trim() || null,
        cast: form.cast.trim() || null,
        trailer: form.trailer.trim() || null,
        rating: Number(form.rating) || 0.0,
        description: form.description.trim() || null,
        poster: finalPosterUrl,
      };

      const res = await fetch(`/api/movies/${initialMovie.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moviePayload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Cập nhật phim thất bại', 'error');
        setLoading(false);
        return;
      }

      // 4. Thành công -> Báo Toast và chuyển về danh sách phim
      showToast('Cập nhật thông tin phim thành công!', 'success');

      setTimeout(() => {
        router.push('/admin/movies');
        router.refresh();
      }, 1000);
    } catch {
      showToast('Đã xảy ra lỗi khi cập nhật phim. Vui lòng thử lại.', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="pb-5 border-b border-white/[0.08]">
          <Link
            href="/admin/movies"
            className="text-[#94a3b8] hover:text-white text-xs font-bold uppercase tracking-wider mb-2 inline-block transition-colors"
            style={{ textDecoration: 'none' }}
          >
            ← Quay lại danh sách phim
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[#e11d48] text-sm">✦</span>
            <h1 className="text-xl lg:text-2xl font-black text-[#f8fafc] tracking-tight uppercase">
              CHỈNH SỬA PHIM: <span className="text-[#fda4af]">{initialMovie.title}</span>
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl p-6 lg:p-8 space-y-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            {/* Tên phim & Thể loại */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Tên phim <span className="text-[#e11d48]">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFieldChange}
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Thể loại <span className="text-[#e11d48]">*</span>
                </label>
                <input
                  type="text"
                  name="genre"
                  value={form.genre}
                  onChange={handleFieldChange}
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Upload Poster lên Cloudinary */}
            <div className="border border-dashed border-[#c084fc]/30 rounded-xl p-5 bg-white/[0.02]">
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                Ảnh Poster Phim <span className="text-[#e11d48]">*</span>
              </label>
              <p className="text-[#94a3b8] text-[11px] mb-4">
                Chọn ảnh mới nếu muốn thay thế ảnh poster hiện tại hoặc cập nhật link URL.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Xem trước ảnh */}
                <div className="w-24 h-36 bg-[#1f192b] border border-[#c084fc]/30 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
                  {posterPreview ? (
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#64748b] text-[10px] text-center px-2">
                      Chưa chọn ảnh
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="text-xs text-[#94a3b8] file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#e11d48] file:text-white hover:file:bg-[#be123c] cursor-pointer"
                  />

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-white/[0.08] w-full" />
                    <span className="bg-[#0a0812] px-3 text-[#64748b] text-[10px] absolute">
                      hoặc chỉnh sửa URL trực tiếp
                    </span>
                  </div>

                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/.../poster.jpg"
                    value={manualPosterUrl}
                    onChange={e => {
                      setManualPosterUrl(e.target.value);
                      setPosterPreview(e.target.value || null);
                      setPosterFile(null);
                    }}
                    disabled={loading}
                    className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Thời lượng, Giá vé & Đánh giá */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Thời lượng (phút) <span className="text-[#e11d48]">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  value={form.duration}
                  onChange={handleFieldChange}
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Giá vé cơ bản (VNĐ)
                </label>
                <input
                  type="number"
                  name="ticket_price"
                  step="5000"
                  value={form.ticket_price}
                  onChange={handleFieldChange}
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Đánh giá
                </label>
                <input
                  type="number"
                  name="rating"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.rating}
                  onChange={handleFieldChange}
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Ngày khởi chiếu, Kết thúc & Độ tuổi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Ngày khởi chiếu <span className="text-[#e11d48]">*</span>
                </label>
                <input
                  type="date"
                  name="release_date"
                  value={form.release_date}
                  onChange={handleFieldChange}
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Ngày kết thúc dự kiến
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleFieldChange}
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Phân loại độ tuổi
                </label>
                <select
                  name="age_rating"
                  value={form.age_rating}
                  onChange={handleFieldChange}
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                >
                  <option value="P">P - Phổ biến mọi lứa tuổi</option>
                  <option value="K">K - Dưới 13 tuổi có người bảo hộ</option>
                  <option value="C13">C13 - Dành cho khán giả từ 13 tuổi</option>
                  <option value="C16">C16 - Dành cho khán giả từ 16 tuổi</option>
                  <option value="C18">C18 - Dành cho khán giả từ 18 tuổi</option>
                </select>
              </div>
            </div>

            {/* Trạng thái, Đạo diễn, Trailer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Trạng thái chiếu
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFieldChange}
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                >
                  <option value="SHOWING">Đang chiếu (SHOWING)</option>
                  <option value="UPCOMING">Sắp ra mắt (UPCOMING)</option>
                  <option value="ENDED">Đã kết thúc (ENDED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Đạo diễn
                </label>
                <input
                  type="text"
                  name="director"
                  value={form.director}
                  onChange={handleFieldChange}
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                  Trailer (YouTube URL)
                </label>
                <input
                  type="url"
                  name="trailer"
                  value={form.trailer}
                  onChange={handleFieldChange}
                  disabled={loading}
                  className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Diễn viên */}
            <div>
              <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                Diễn viên chính
              </label>
              <input
                type="text"
                name="cast"
                value={form.cast}
                onChange={handleFieldChange}
                disabled={loading}
                className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
              />
            </div>

            {/* Mô tả tóm tắt */}
            <div>
              <label className="block text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-1.5">
                Mô tả nội dung phim
              </label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleFieldChange}
                disabled={loading}
                className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2 text-[#f8fafc] text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/movies"
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-white text-xs font-bold rounded-lg transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'LƯU THAY ĐỔI'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
