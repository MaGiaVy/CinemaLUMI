'use client';

import { useState } from 'react';
import { Screening, Movie } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ScreeningManagementClientProps {
  initialScreenings: Screening[];
  movies: Movie[];
}

const ROOMS = ['Phòng 1', 'Phòng 2', 'Phòng 3', 'Phòng 4'];
const DATES = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'];

export default function ScreeningManagementClient({
  initialScreenings,
  movies,
}: ScreeningManagementClientProps) {
  const [screeningList, setScreeningList] = useState(initialScreenings);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [addModal, setAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [form, setForm] = useState({
    movieId: movies[0]?.id || '',
    date: DATES[0],
    time: '19:00',
    room: ROOMS[0],
    price: '120000',
  });

  const filtered = screeningList.filter(s => s.date === selectedDate);
  const getMovie = (id: string) => movies.find(m => m.id === id);

  const handleAdd = () => {
    const newS: Screening = {
      id: `s${Date.now()}`,
      movieId: form.movieId,
      date: form.date,
      time: form.time,
      room: form.room,
      totalSeats: 84,
      availableSeats: 84,
      price: Number(form.price),
    };
    setScreeningList(prev => [...prev, newS]);
    setAddModal(false);
    showToast('Đã thêm suất chiếu mới!');
  };

  const handleDelete = (id: string) => {
    setScreeningList(prev => prev.filter(s => s.id !== id));
    setDeleteId(null);
    showToast('Đã xóa suất chiếu.');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {toast && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-[#2ECC71] rounded-lg text-white font-medium shadow-xl">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Quản Lý Lịch Chiếu</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">{screeningList.length} suất chiếu trong hệ thống</p>
          </div>
          <Button onClick={() => setAddModal(true)}>+ Thêm suất chiếu</Button>
        </div>

        {/* Date filter */}
        <div className="flex gap-2 mb-6">
          {DATES.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                selectedDate === d
                  ? 'bg-[#E63946] text-white'
                  : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Screenings list */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040]">
                <th className="text-left px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Phim</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Phòng</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Giờ chiếu</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Ghế trống</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Giá vé</th>
                <th className="text-right px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040]">
              {filtered.map(s => {
                const movie = getMovie(s.movieId);
                return (
                  <tr key={s.id} className="hover:bg-[#383838] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {movie && (
                          <img src={movie.poster} alt={movie.title} className="w-10 h-14 object-cover rounded-lg" />
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{movie?.title || 'Phim'}</p>
                          <p className="text-[#B3B3B3] text-xs">{movie?.duration} phút</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-semibold">{s.room}</td>
                    <td className="px-4 py-3 text-[#FFB703] font-bold text-sm">{s.time}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.availableSeats > 20 ? 'green' : s.availableSeats > 0 ? 'gold' : 'red'}>
                        {s.availableSeats}/{s.totalSeats}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-white text-sm">{s.price.toLocaleString('vi-VN')}đ</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(s.id)}>
                        Xóa
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal add */}
        <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Thêm suất chiếu mới">
          <div className="space-y-4">
            <div>
              <label className="block text-[#B3B3B3] text-sm mb-1">Chọn phim</label>
              <select value={form.movieId} onChange={e => setForm(f => ({ ...f, movieId: e.target.value }))}>
                {movies.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Ngày chiếu</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Giờ chiếu</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Phòng chiếu</label>
                <select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}>
                  {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#B3B3B3] text-sm mb-1">Giá vé (VNĐ)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setAddModal(false)}>Hủy</Button>
              <Button onClick={handleAdd}>Thêm suất chiếu</Button>
            </div>
          </div>
        </Modal>

        {/* Modal delete */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xác nhận xóa suất chiếu">
          <p className="text-[#B3B3B3] text-sm mb-4">Bạn có chắc chắn muốn xóa suất chiếu này không?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Xác nhận xóa</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
