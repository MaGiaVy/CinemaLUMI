'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Toast, { ToastMessage } from '@/components/ui/Toast';

export default function AddMoviePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    genre: '',
    duration: '',
    ticket_price: '120000',
    release_date: '',
    end_date: '',
    age_rating: 'P',
    status: 'SHOWING',
    director: '',
    cast: '',
    trailer: '',
    rating: '8.0',
    description: '',
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [manualPosterUrl, setManualPosterUrl] = useState('');
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

    if (!posterFile && !manualPosterUrl.trim()) {
      showToast('Vui lòng tải lên ảnh poster hoặc nhập URL hình ảnh', 'warning');
      return;
    }

    setLoading(true);

    try {
      let finalPosterUrl = manualPosterUrl.trim();

      // 2. Nếu Admin chọn file từ máy tính -> Gọi API /api/movies/upload để upload lên Cloudinary trước
      if (posterFile) {
        showToast('Đang tải ảnh poster lên Cloudinary...', 'info');

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
        showToast('Tải ảnh poster thành công! Đang lưu thông tin phim...', 'success');
      }

      // 3. Gộp URL ảnh vào payload và gửi POST /api/movies
      const moviePayload = {
        title: form.title.trim(),
        genre: form.genre.trim(),
        duration: Number(form.duration),
        ticket_price: Number(form.ticket_price) || 120000,
        release_date: form.release_date,
        end_date: form.end_date || undefined,
        age_rating: form.age_rating,
        status: form.status,
        director: form.director.trim() || undefined,
        cast: form.cast.trim() || undefined,
        trailer: form.trailer.trim() || undefined,
        rating: Number(form.rating) || 0.0,
        description: form.description.trim() || undefined,
        poster: finalPosterUrl,
      };

      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moviePayload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Thêm phim thất bại', 'error');
        setLoading(false);
        return;
      }

      // 4. Thành công -> Báo Toast và chuyển về trang quản lý phim
      showToast('Thêm phim mới thành công!', 'success');

      setTimeout(() => {
        router.push('/admin/movies');
        router.refresh();
      }, 1000);
    } catch {
      showToast('Đã xảy ra lỗi khi tạo phim mới. Vui lòng thử lại.', 'error');
      setLoading(false);
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
                href="/admin/movies"
                className="text-[#B3B3B3] hover:text-white text-xs font-semibold uppercase tracking-wider mb-1 inline-block transition-colors"
              >
                ← Quay lại danh sách phim
              </Link>
              <h1 className="text-2xl lg:text-3xl font-black text-white">Thêm Phim Mới</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 lg:p-8 space-y-6 shadow-xl">
              {/* Tên phim & Thể loại */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Tên phim <span className="text-[#E63946]">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="VD: Dune: Hành Tinh Cát - Phần 2"
                    value={form.title}
                    onChange={handleFieldChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Thể loại <span className="text-[#E63946]">*</span>
                  </label>
                  <input
                    type="text"
                    name="genre"
                    placeholder="VD: Hành động, Khoa học viễn tưởng"
                    value={form.genre}
                    onChange={handleFieldChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Upload Poster lên Cloudinary */}
              <div className="border border-dashed border-[#525252] rounded-xl p-6 bg-[#242424]">
                <label className="block text-white text-sm font-semibold mb-2">
                  Ảnh Poster Phim <span className="text-[#E63946]">*</span>
                </label>
                <p className="text-[#B3B3B3] text-xs mb-4">
                  Chọn ảnh từ máy tính để tự động tải lên dịch vụ Cloudinary bảo mật.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Xem trước ảnh */}
                  <div className="w-28 h-40 bg-[#1A1A1A] border border-[#404040] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
                    {posterPreview ? (
                      <img
                        src={posterPreview}
                        alt="Poster preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[#737373] text-xs text-center px-2">
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
                      className="text-sm text-[#B3B3B3] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E63946] file:text-white hover:file:bg-[#C62B36] cursor-pointer"
                    />

                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-[#404040] w-full" />
                      <span className="bg-[#242424] px-3 text-[#737373] text-xs absolute">
                        hoặc nhập URL trực tiếp
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
                    />
                  </div>
                </div>
              </div>

              {/* Thời lượng, Giá vé & Đánh giá */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Thời lượng (phút) <span className="text-[#E63946]">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    placeholder="120"
                    min="1"
                    value={form.duration}
                    onChange={handleFieldChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Giá vé cơ bản (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="ticket_price"
                    placeholder="120000"
                    step="5000"
                    value={form.ticket_price}
                    onChange={handleFieldChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Đánh giá khởi điểm
                  </label>
                  <input
                    type="number"
                    name="rating"
                    placeholder="8.5"
                    step="0.1"
                    min="0"
                    max="10"
                    value={form.rating}
                    onChange={handleFieldChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Ngày khởi chiếu, Kết thúc & Độ tuổi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Ngày khởi chiếu <span className="text-[#E63946]">*</span>
                  </label>
                  <input
                    type="date"
                    name="release_date"
                    value={form.release_date}
                    onChange={handleFieldChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Ngày kết thúc dự kiến
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleFieldChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Phân loại độ tuổi
                  </label>
                  <select
                    name="age_rating"
                    value={form.age_rating}
                    onChange={handleFieldChange}
                    disabled={loading}
                  >
                    <option value="P">P - Phổ biến mọi lứa tuổi</option>
                    <option value="K">K - Dưới 13 tuổi có người bảo hộ</option>
                    <option value="C13">C13 - Dành cho khán giả từ 13 tuổi</option>
                    <option value="C16">C16 - Dành cho khán giả từ 16 tuổi</option>
                    <option value="C18">C18 - Dành cho khán giả từ 18 tuổi</option>
                  </select>
                </div>
              </div>

              {/* Trạng thái, Đạo diễn, Diễn viên */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Trạng thái chiếu
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFieldChange}
                    disabled={loading}
                  >
                    <option value="SHOWING">Đang chiếu (SHOWING)</option>
                    <option value="UPCOMING">Sắp ra mắt (UPCOMING)</option>
                    <option value="ENDED">Đã kết thúc (ENDED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Đạo diễn
                  </label>
                  <input
                    type="text"
                    name="director"
                    placeholder="VD: Christopher Nolan"
                    value={form.director}
                    onChange={handleFieldChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                    Trailer (YouTube URL)
                  </label>
                  <input
                    type="url"
                    name="trailer"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.trailer}
                    onChange={handleFieldChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Diễn viên */}
              <div>
                <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                  Diễn viên chính
                </label>
                <input
                  type="text"
                  name="cast"
                  placeholder="VD: Cillian Murphy, Emily Blunt, Matt Damon..."
                  value={form.cast}
                  onChange={handleFieldChange}
                  disabled={loading}
                />
              </div>

              {/* Mô tả tóm tắt */}
              <div>
                <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                  Mô tả nội dung phim
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Nhập nội dung tóm tắt của bộ phim..."
                  value={form.description}
                  onChange={handleFieldChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <Link href="/admin/movies">
                <Button variant="secondary" size="md" type="button" disabled={loading}>
                  Hủy bỏ
                </Button>
              </Link>
              <Button size="md" type="submit" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Lưu phim mới'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
