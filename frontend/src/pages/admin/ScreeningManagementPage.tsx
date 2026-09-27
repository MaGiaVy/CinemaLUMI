import { useState } from 'react';
import { screenings, movies } from '@/data/mockData';
import { Screening } from '@/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ScreeningManagementPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ROOMS = ['Phòng 1', 'Phòng 2', 'Phòng 3', 'Phòng 4'];
const DATES = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'];

export default function ScreeningManagementPage({ onShowToast }: ScreeningManagementPageProps) {
  const [screeningList, setScreeningList] = useState(screenings);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [addModal, setAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ movieId: '', date: '', time: '', room: ROOMS[0], price: '120000' });

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
    onShowToast('Đã thêm suất chiếu mới!', 'success');
  };

  const handleDelete = (id: string) => {
    setScreeningList(prev => prev.filter(s => s.id !== id));
    setDeleteId(null);
    onShowToast('Đã xóa suất chiếu.', 'info');
  };

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
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
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedDate === d ? 'bg-[#E63946] text-white' : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]'
              }`}
              style={{ border: `1px solid ${selectedDate === d ? '#E63946' : '#404040'}`, cursor: 'pointer' }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Calendar grid by room */}
        <div className="space-y-4">
          {ROOMS.map(room => {
            const roomScreenings = filtered.filter(s => s.room === room);
            return (
              <div key={room} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">{room}</h3>
                  <span className="text-[#B3B3B3] text-sm">{roomScreenings.length} suất</span>
                </div>

                {roomScreenings.length === 0 ? (
                  <p className="text-[#525252] text-sm">Không có suất chiếu — Nhấn "+ Thêm suất chiếu" để thêm</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {roomScreenings.map(s => {
                      const movie = getMovie(s.movieId);
                      const fillRate = Math.round(((s.totalSeats - s.availableSeats) / s.totalSeats) * 100);
                      const v = s.availableSeats / s.totalSeats > 0.3 ? 'green' : s.availableSeats > 0 ? 'gold' : 'red';
                      return (
                        <div key={s.id} className="bg-[#383838] border border-[#404040] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold text-lg">{s.time}</span>
                            <Badge variant={v} size="sm">{fillRate}%</Badge>
                          </div>
                          <p className="text-[#B3B3B3] text-xs truncate mb-1">{movie?.title || '—'}</p>
                          <p className="text-[#FFB703] text-xs font-semibold">{s.price.toLocaleString('vi-VN')}đ</p>
                          <div className="w-full bg-[#404040] rounded-full h-1 mt-2 mb-3">
                            <div className="h-1 rounded-full bg-[#E63946]" style={{ width: `${fillRate}%` }} />
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="flex-1 text-xs">Sửa</Button>
                            <Button variant="danger" size="sm" onClick={() => setDeleteId(s.id)}>✕</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Thêm Suất Chiếu Mới">
        <div className="space-y-4">
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Phim</label>
            <select value={form.movieId} onChange={e => setForm(f => ({ ...f, movieId: e.target.value }))}>
              <option value="">Chọn phim</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Ngày</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Giờ</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Phòng</label>
              <select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}>
                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Giá vé (đ)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div className="bg-[#383838] rounded-xl p-3 text-xs text-[#B3B3B3]">
            ℹ️ Hệ thống sẽ tự động tạo 84 ghế (7 hàng × 12 cột) cho suất chiếu mới.
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAddModal(false)}>Hủy</Button>
            <Button fullWidth disabled={!form.movieId || !form.date || !form.time} onClick={handleAdd}>Thêm suất chiếu</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa Suất Chiếu">
        <div className="space-y-4">
          <p className="text-[#B3B3B3]">Bạn có chắc chắn muốn xóa suất chiếu này?</p>
          <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-3">
            <p className="text-[#E63946] text-xs">⚠️ Nếu đã có vé được bán, hệ thống sẽ tự động hoàn tiền và cấp voucher 50% cho khách hàng.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>Hủy bỏ</Button>
            <Button variant="danger" fullWidth onClick={() => deleteId && handleDelete(deleteId)}>Xóa suất chiếu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
