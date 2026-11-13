'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import Toast, { ToastMessage } from '@/components/ui/Toast';

export interface ScreeningItem {
  id: number;
  movieId: number;
  room: string;
  roomNumber: number | null;
  startTime: string;
  endTime: string;
  date: string;
  price: number;
  status: 'UPCOMING' | 'SHOWING' | 'ENDED';
  movie: {
    id: number;
    title: string;
    poster: string;
    duration: number;
    ageRating: string | null;
    genre: string;
  };
  _count: {
    seats: number;
    tickets: number;
  };
}

interface ScreeningManagementClientProps {
  initialScreenings: ScreeningItem[];
}

export default function ScreeningManagementClient({
  initialScreenings,
}: ScreeningManagementClientProps) {
  const [screenings, setScreenings] = useState<ScreeningItem[]>(initialScreenings);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [deleteScreening, setDeleteScreening] = useState<ScreeningItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Trích xuất danh sách các ngày có lịch chiếu để làm bộ lọc
  const availableDates = Array.from(
    new Set(screenings.map(s => s.date.split('T')[0]))
  ).sort();

  // Bộ lọc suất chiếu
  const filtered = screenings.filter(s => {
    const matchSearch =
      s.movie.title.toLowerCase().includes(search.toLowerCase()) ||
      s.room.toLowerCase().includes(search.toLowerCase());

    const screeningDateOnly = s.date.split('T')[0];
    const matchDate = selectedDate === 'ALL' || screeningDateOnly === selectedDate;
    const matchRoom = selectedRoom === 'ALL' || s.room === selectedRoom;

    return matchSearch && matchDate && matchRoom;
  });

  // Xóa suất chiếu
  const handleDelete = async () => {
    if (!deleteScreening) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/screenings/${deleteScreening.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Không thể xóa suất chiếu này.', 'error');
        setIsDeleting(false);
        setDeleteScreening(null);
        return;
      }

      setScreenings(prev => prev.filter(s => s.id !== deleteScreening.id));
      showToast(
        data.message || `Đã xóa suất chiếu phim "${deleteScreening.movie.title}" thành công.`,
        data.data?.refund_flow_recorded ? 'warning' : 'success'
      );
      setDeleteScreening(null);
    } catch {
      showToast('Đã xảy ra lỗi khi xóa suất chiếu. Vui lòng thử lại sau.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
                QUẢN LÝ SUẤT CHIẾU & LỊCH CHIẾU
              </h1>
            </div>
            <p className="text-[#94a3b8] text-xs mt-1">
              Hệ thống hiện có <strong className="text-[#fda4af] font-bold">{screenings.length}</strong> suất chiếu được lập lịch và giám sát (BR-08)
            </p>
          </div>
          <Link
            href="/admin/screenings/add"
            className="px-4 py-2 bg-gradient-to-r from-[#e11d48] to-[#9f1239] border border-[#fecdd3]/40 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all cursor-pointer uppercase tracking-wider text-center"
            style={{ textDecoration: 'none' }}
          >
            + THÊM SUẤT CHIẾU MỚI
          </Link>
        </div>

        {/* Bộ lọc & Tìm kiếm */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phim hoặc phòng chiếu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
            />
          </div>
          <div>
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
            >
              <option value="ALL">Tất cả các ngày</option>
              {availableDates.map(d => (
                <option key={d} value={d}>
                  Ngày {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="w-full bg-[#0a0812]/80 border border-[#c084fc]/20 focus:border-[#e11d48] rounded-xl px-3.5 py-2.5 text-[#f8fafc] text-xs outline-none transition-colors"
            >
              <option value="ALL">Tất cả phòng</option>
              <option value="Cinema 01">Cinema 01 (Laser 4K)</option>
              <option value="Cinema 02">Cinema 02 (Dolby Atmos)</option>
              <option value="Cinema 03">Cinema 03 (Standard 2D)</option>
              <option value="Cinema 04">Cinema 04 (Laser 4K)</option>
              <option value="Cinema 05">Cinema 05 (VIP Cosmos)</option>
            </select>
          </div>
        </div>

        {/* Bảng danh sách suất chiếu */}
        <div className="rounded-2xl border border-[#c084fc]/25 bg-[#0a0812]/85 backdrop-blur-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-bold text-[#c084fc] uppercase tracking-wider bg-white/[0.02]">
                  <th className="px-5 py-3.5">Phim Chiếu</th>
                  <th className="px-4 py-3.5">Phòng Chiếu</th>
                  <th className="px-4 py-3.5">Giờ Chiếu & Ngày</th>
                  <th className="px-4 py-3.5">Giá Vé</th>
                  <th className="px-4 py-3.5">Số Ghế / Vé</th>
                  <th className="px-4 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-[#94a3b8] text-xs">
                      {search || selectedDate !== 'ALL' || selectedRoom !== 'ALL'
                        ? 'Không tìm thấy suất chiếu nào phù hợp với bộ lọc.'
                        : 'Hệ thống chưa có suất chiếu nào. Hãy bấm "+ THÊM SUẤT CHIẾU MỚI" để bắt đầu!'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(s => {
                    const startTimeStr = formatTime(s.startTime);
                    const endTimeStr = formatTime(s.endTime);
                    const dateStr = formatDate(s.date);

                    return (
                      <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                        {/* Phim */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-[#1f192b] border border-[#c084fc]/20">
                              {s.movie.poster ? (
                                <Image
                                  src={s.movie.poster}
                                  alt={s.movie.title}
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
                                {s.movie.title}
                              </p>
                              <p className="text-[#94a3b8] text-[11px] mt-0.5">
                                {s.movie.duration} phút • {s.movie.genre.split(',')[0]}
                              </p>
                              {s.movie.ageRating && (
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-white/[0.08] text-[#cbd5e1] font-semibold border border-white/10">
                                  {s.movie.ageRating}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phòng chiếu */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-white font-bold text-xs">
                            {s.room}
                          </span>
                        </td>

                        {/* Giờ chiếu & Ngày */}
                        <td className="px-4 py-3.5">
                          <div className="text-white font-bold text-xs">
                            {startTimeStr} <span className="text-[#64748b] font-normal">→</span> {endTimeStr}
                          </div>
                          <div className="text-[#94a3b8] text-[11px] mt-0.5">
                            {dateStr}
                          </div>
                        </td>

                        {/* Giá vé */}
                        <td className="px-4 py-3.5">
                          <span className="text-[#fda4af] font-black text-xs">
                            {Number(s.price).toLocaleString('vi-VN')} đ
                          </span>
                        </td>

                        {/* Số ghế / Vé đã bán */}
                        <td className="px-4 py-3.5">
                          <div className="text-white text-xs">
                            <span className="font-bold text-[#86efac]">
                              {s._count.seats - s._count.tickets}
                            </span>
                            /{s._count.seats} ghế trống
                          </div>
                          {s._count.tickets > 0 && (
                            <div className="text-[#fda4af] text-[10px] font-semibold mt-0.5">
                              Đã bán: {s._count.tickets} vé
                            </div>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-4 py-3.5">
                          {s.status === 'UPCOMING' && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#881337]/35 border border-[#c084fc]/40 text-[#f472b6] uppercase tracking-wider">
                              Sắp chiếu
                            </span>
                          )}
                          {s.status === 'SHOWING' && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#e11d48]/25 border border-[#e11d48] text-[#fda4af] uppercase tracking-wider">
                              Đang chiếu
                            </span>
                          )}
                          {s.status === 'ENDED' && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-white/[0.08] border border-white/20 text-[#94a3b8] uppercase tracking-wider">
                              Đã kết thúc
                            </span>
                          )}
                        </td>

                        {/* Hành động */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteScreening(s)}
                            className="px-3 py-1 bg-[#e11d48]/15 hover:bg-[#e11d48]/30 text-[#fda4af] text-[11px] font-bold rounded border border-[#e11d48]/40 transition-colors cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa suất chiếu */}
      {deleteScreening && (
        <Modal
          isOpen={!!deleteScreening}
          onClose={() => setDeleteScreening(null)}
          title="XÁC NHẬN XÓA SUẤT CHIẾU"
        >
          <div className="space-y-4">
            <p className="text-[#f8fafc] text-xs">
              Bạn có chắc chắn muốn xóa suất chiếu phim{' '}
              <strong className="text-[#fda4af]">&ldquo;{deleteScreening.movie.title}&rdquo;</strong> tại{' '}
              <strong className="text-white">{deleteScreening.room}</strong> (Lúc {formatTime(deleteScreening.startTime)} ngày {deleteScreening.date.split('T')[0]})?
            </p>

            {deleteScreening._count.tickets > 0 ? (
              <div className="p-3.5 bg-[#e11d48]/15 border border-[#e11d48]/40 rounded-xl text-xs space-y-1.5 text-white">
                <p className="font-bold text-[#fda4af]">
                  Cảnh báo nghiệp vụ (BR-04/BR-05): Suất chiếu này đã bán được {deleteScreening._count.tickets} vé!
                </p>
                <p className="text-[#cbd5e1] text-[11px]">
                  Khi thực thi xóa, hệ thống sẽ tự động chuyển toàn bộ các vé hợp lệ sang trạng thái <strong>Cancelled</strong>, kích hoạt luồng hoàn tiền 100% cho khách hàng và cấp mã voucher bồi hoàn.
                </p>
              </div>
            ) : (
              <p className="text-[#94a3b8] text-xs">
                Suất chiếu này chưa bán được vé nào, 50 ghế trống liên kết sẽ được tự động dọn dẹp an toàn.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setDeleteScreening(null)}
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
