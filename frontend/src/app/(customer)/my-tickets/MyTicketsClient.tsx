'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ticket, Movie } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface MyTicketsClientProps {
  initialTickets: Ticket[];
  movies: Movie[];
}

export default function MyTicketsClient({ initialTickets, movies }: MyTicketsClientProps) {
  const [ticketList, setTicketList] = useState(initialTickets);
  const [filter, setFilter] = useState<'all' | 'valid' | 'used' | 'cancelled'>('all');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filteredTickets = ticketList.filter(t => filter === 'all' || t.status === filter);

  const handleCancelTicket = () => {
    if (!cancelId) return;
    setTicketList(prev => prev.map(t => t.id === cancelId ? { ...t, status: 'cancelled' as const } : t));
    setCancelId(null);
    setToast('Đã hủy vé thành công.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black text-white mb-2">Vé Của Tôi</h1>
        <p className="text-[#B3B3B3] text-sm mb-6">Quản lý các vé xem phim đã đặt và mã QR vào rạp</p>

        {toast && (
          <div className="mb-4 p-3 bg-[#2ECC71]/20 border border-[#2ECC71] text-[#2ECC71] rounded-lg text-sm">
            {toast}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'valid', label: 'Còn hiệu lực' },
            { id: 'used', label: 'Đã sử dụng' },
            { id: 'cancelled', label: 'Đã hủy' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#E63946] text-white'
                  : 'bg-[#2D2D2D] text-[#B3B3B3] hover:text-white border border-[#404040]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ticket cards */}
        <div className="space-y-4">
          {filteredTickets.map(ticket => {
            const foundMovie = movies.find(m => m.title === ticket.movieTitle);

            return (
              <div
                key={ticket.id}
                className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center justify-between"
              >
                <div className="flex gap-4 items-center flex-1">
                  <img
                    src={ticket.moviePoster}
                    alt={ticket.movieTitle}
                    className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg">{ticket.movieTitle}</h3>
                      <Badge
                        variant={
                          ticket.status === 'valid'
                            ? 'green'
                            : ticket.status === 'used'
                            ? 'gray'
                            : 'red'
                        }
                      >
                        {ticket.status === 'valid' ? 'Còn hạn' : ticket.status === 'used' ? 'Đã dùng' : 'Đã hủy'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#B3B3B3]">
                      Phòng: <span className="text-white font-medium">{ticket.room}</span> • Suất: <span className="text-[#FFB703] font-bold">{ticket.time} ({ticket.date})</span>
                    </p>
                    <p className="text-xs text-[#B3B3B3]">
                      Ghế: <span className="text-white font-bold">{ticket.seats.join(', ')}</span>
                    </p>
                    <p className="text-xs text-[#B3B3B3]">
                      Loại vé: {ticket.ticketType} • Giá: <span className="text-[#FFB703] font-bold">{ticket.totalPrice.toLocaleString('vi-VN')}đ</span>
                    </p>

                    <div className="flex gap-3 pt-2">
                      {foundMovie && (
                        <Link
                          href={`/movies/${foundMovie.id}/rating`}
                          className="text-xs px-3 py-1.5 rounded bg-[#383838] hover:bg-[#404040] text-white transition-all"
                        >
                          ⭐ Đánh giá phim
                        </Link>
                      )}
                      {ticket.status === 'valid' && (
                        <button
                          onClick={() => setCancelId(ticket.id)}
                          className="text-xs px-3 py-1.5 rounded bg-[#E63946]/20 text-[#E63946] hover:bg-[#E63946]/30 transition-all cursor-pointer"
                        >
                          Hủy vé
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR preview */}
                <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-[#404040] pt-4 md:pt-0 md:pl-6">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-2 mb-2">
                    <div className="grid grid-cols-4 gap-0.5">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div key={i} className="w-4 h-4" style={{ background: (i % 2 === 0) ? '#000' : '#fff' }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#B3B3B3] font-mono">Mã vé: {ticket.id}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal cancel */}
        <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Xác nhận hủy vé">
          <p className="text-[#B3B3B3] text-sm mb-4">
            Bạn có chắc chắn muốn hủy vé này không? Sau khi hủy, vé sẽ không còn giá trị để vào phòng chiếu.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelId(null)}>Đóng</Button>
            <Button variant="danger" onClick={handleCancelTicket}>Xác nhận hủy vé</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
