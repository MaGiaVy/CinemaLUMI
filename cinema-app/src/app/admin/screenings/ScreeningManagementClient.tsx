'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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

      <div className="flex-1 bg-[#1A1A1A] p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-white">Quản Lý Lịch Chiếu</h1>
              <p className="text-[#B3B3B3] text-sm mt-1">
                Hiện có <span className="text-[#E63946] font-semibold">{screenings.length}</span> suất chiếu được lên lịch
              </p>
            </div>
            <Link href="/admin/screenings/add">
              <Button size="md">
                + Thêm suất chiếu mới
              </Button>
            </Link>
          </div>

          {/* Bộ lọc & Tìm kiếm */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên phim hoặc phòng chiếu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
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
              >
                <option value="ALL">Tất cả phòng</option>
                <option value="Cinema 01">Cinema 01</option>
                <option value="Cinema 02">Cinema 02</option>
                <option value="Cinema 03">Cinema 03</option>
                <option value="Cinema 04">Cinema 04</option>
                <option value="Cinema 05">Cinema 05</option>
              </select>
            </div>
          </div>

          {/* Bảng danh sách suất chiếu */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#404040] bg-[#242424]">
                    <th className="px-5 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Phim Chiếu
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Phòng Chiếu
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Giờ Chiếu & Ngày
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Giá Vé
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Số Ghế / Vé
                    </th>
                    <th className="px-4 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider">
                      Trạng Thái
                    </th>
                    <th className="px-5 py-3.5 text-[#B3B3B3] text-xs font-semibold uppercase tracking-wider text-right">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#404040]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#B3B3B3] text-sm">
                        {search || selectedDate !== 'ALL' || selectedRoom !== 'ALL'
                          ? 'Không tìm thấy suất chiếu nào phù hợp với bộ lọc.'
                          : 'Hệ thống chưa có suất chiếu nào. Hãy bấm "+ Thêm suất chiếu mới" để bắt đầu!'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(s => {
                      const startTimeStr = formatTime(s.startTime);
                      const endTimeStr = formatTime(s.endTime);
                      const dateStr = formatDate(s.date);

                      return (
                        <tr key={s.id} className="hover:bg-[#383838] transition-colors">
                          {/* Phim */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={s.movie.poster || 'https://via.placeholder.com/80x120?text=No+Poster'}
                                alt={s.movie.title}
                                className="w-10 h-14 object-cover rounded-md flex-shrink-0 bg-[#1A1A1A] border border-[#404040]"
                              />
                              <div>
                                <p className="text-white font-bold text-sm line-clamp-1">
                                  {s.movie.title}
                                </p>
                                <p className="text-[#B3B3B3] text-xs mt-0.5">
                                  {s.movie.duration} phút • {s.movie.genre.split(',')[0]}
                                </p>
                                {s.movie.ageRating && (
                                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-[#404040] text-white font-medium">
                                    {s.movie.ageRating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phòng chiếu */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1A1A] border border-[#404040] text-white font-semibold text-xs">
                              📍 {s.room}
                            </span>
                          </td>

                          {/* Giờ chiếu & Ngày */}
                          <td className="px-4 py-3.5">
                            <div className="text-white font-bold text-sm">
                              {startTimeStr} <span className="text-[#737373] font-normal">→</span> {endTimeStr}
                            </div>
                            <div className="text-[#B3B3B3] text-xs mt-0.5">
                              {dateStr}
                            </div>
                          </td>

                          {/* Giá vé */}
                          <td className="px-4 py-3.5">
                            <span className="text-[#FFB703] font-bold text-sm">
                              {Number(s.price).toLocaleString('vi-VN')} đ
                            </span>
                          </td>

                          {/* Số ghế / Vé đã bán */}
                          <td className="px-4 py-3.5">
                            <div className="text-white text-xs">
                              <span className="font-semibold text-green-400">
                                {s._count.seats - s._count.tickets}
                              </span>
                              /{s._count.seats} ghế trống
                            </div>
                            {s._count.tickets > 0 && (
                              <div className="text-[#E63946] text-[11px] font-medium mt-0.5">
                                Đã bán: {s._count.tickets} vé
                              </div>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="px-4 py-3.5">
                            {s.status === 'UPCOMING' && (
                              <Badge variant="gold" size="sm">Sắp chiếu</Badge>
                            )}
                            {s.status === 'SHOWING' && (
                              <Badge variant="green" size="sm">Đang chiếu</Badge>
                            )}
                            {s.status === 'ENDED' && (
                              <Badge variant="gray" size="sm">Đã kết thúc</Badge>
                            )}
                          </td>

                          {/* Hành động */}
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setDeleteScreening(s)}
                              className="px-3 py-1.5 bg-[#E63946]/10 hover:bg-[#E63946] text-[#E63946] hover:text-white text-xs font-medium rounded transition-colors cursor-pointer border border-[#E63946]/30"
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
      </div>

      {/* Modal xác nhận xóa suất chiếu */}
      {deleteScreening && (
        <Modal
          isOpen={!!deleteScreening}
          onClose={() => setDeleteScreening(null)}
          title="Xác nhận xóa suất chiếu"
        >
          <div className="space-y-4">
            <p className="text-white text-sm">
              Bạn có chắc chắn muốn xóa suất chiếu phim{' '}
              <strong className="text-[#E63946]">&ldquo;{deleteScreening.movie.title}&rdquo;</strong> tại{' '}
              <strong>{deleteScreening.room}</strong> (Lúc {formatTime(deleteScreening.startTime)} ngày {deleteScreening.date.split('T')[0]})?
            </p>

            {deleteScreening._count.tickets > 0 ? (
              <div className="p-3 bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg text-xs space-y-1.5 text-white">
                <p className="font-bold text-[#E63946]">
                  ⚠️ Cảnh báo nghiệp vụ: Suất chiếu này đã bán được {deleteScreening._count.tickets} vé!
                </p>
                <p className="text-[#D4D4D4]">
                  Khi bạn xóa, hệ thống sẽ tự động chuyển toàn bộ các vé này sang trạng thái <strong>CANCELLED</strong> và ghi nhận luồng hoàn tiền 100% cho khách hàng.
                </p>
              </div>
            ) : (
              <p className="text-[#B3B3B3] text-xs">
                Suất chiếu này chưa bán được vé nào, 50 ghế trống liên kết sẽ được tự động dọn dẹp an toàn.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#404040]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteScreening(null)}
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
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
