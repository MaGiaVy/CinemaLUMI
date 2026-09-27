'use client';

import { useState } from 'react';
import { RevenueDay, Movie } from '@/lib/api';
import BarChart from '@/components/ui/BarChart';
import Button from '@/components/ui/Button';

interface ReportsClientProps {
  initialRevenueData: RevenueDay[];
  movies: Movie[];
}

export default function ReportsClient({ initialRevenueData, movies }: ReportsClientProps) {
  const [dateFrom, setDateFrom] = useState('2026-09-19');
  const [dateTo, setDateTo] = useState('2026-09-25');
  const [filterMovie, setFilterMovie] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const totalRevenue = initialRevenueData.reduce((a, d) => a + d.revenue, 0);
  const totalTickets = initialRevenueData.reduce((a, d) => a + d.tickets, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
            <h1 className="text-2xl font-black text-white">Báo Cáo & Phân Tích</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">Tổng hợp dữ liệu kinh doanh và doanh số phòng vé</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => showToast('Đang xuất PDF...')}>
              📄 Xuất PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => showToast('Đang xuất Excel...')}>
              📊 Xuất Excel
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[#B3B3B3] text-xs font-medium mb-1">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-[#1A1A1A] border border-[#404040] rounded px-3 py-1.5 text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-xs font-medium mb-1">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-[#1A1A1A] border border-[#404040] rounded px-3 py-1.5 text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[#B3B3B3] text-xs font-medium mb-1">Phim</label>
            <select
              value={filterMovie}
              onChange={e => setFilterMovie(e.target.value)}
              className="bg-[#1A1A1A] border border-[#404040] rounded px-3 py-1.5 text-white text-xs"
            >
              <option value="all">Tất cả phim</option>
              {movies.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
            <p className="text-[#B3B3B3] text-xs font-semibold">TỔNG DOANH THU KỲ BÁO CÁO</p>
            <p className="text-3xl font-black text-[#FFB703] mt-2">
              {totalRevenue.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
            <p className="text-[#B3B3B3] text-xs font-semibold">TỔNG VÉ ĐÃ XUẤT</p>
            <p className="text-3xl font-black text-[#2ECC71] mt-2">
              {totalTickets.toLocaleString()} vé
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Biểu Đồ Doanh Thu</h3>
          <BarChart data={initialRevenueData} height={260} />
        </div>
      </div>
    </div>
  );
}
