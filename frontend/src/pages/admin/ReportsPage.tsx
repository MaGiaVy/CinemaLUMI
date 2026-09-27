import { useState } from 'react';
import { revenueData, movies } from '@/data/mockData';
import BarChart from '@/components/ui/BarChart';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';

interface ReportsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const MOVIE_PERF = movies.filter(m => m.status === 'showing').map((m, i) => ({
  ...m,
  ticketsSold: [267, 198, 152, 124, 76, 45][i] || 30,
  revenue: [32100000, 24300000, 18700000, 15200000, 9800000, 5800000][i] || 3000000,
  fillRate: [89, 76, 64, 52, 38, 24][i] || 20,
}));

export default function ReportsPage({ onShowToast }: ReportsPageProps) {
  const [dateFrom, setDateFrom] = useState('2026-09-19');
  const [dateTo, setDateTo] = useState('2026-09-25');
  const [filterMovie, setFilterMovie] = useState('all');

  const totalRevenue = revenueData.reduce((a, d) => a + d.revenue, 0);
  const totalTickets = revenueData.reduce((a, d) => a + d.tickets, 0);

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Báo Cáo & Phân Tích</h1>
            <p className="text-[#B3B3B3] text-sm mt-1">Tổng hợp dữ liệu kinh doanh</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onShowToast('Đang xuất PDF...', 'info')}>
              📄 Xuất PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onShowToast('Đang xuất Excel...', 'info')}>
              📊 Xuất Excel
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[#B3B3B3] text-xs font-medium mb-2">Từ ngày</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 'auto' }} />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-xs font-medium mb-2">Đến ngày</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 'auto' }} />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-xs font-medium mb-2">Phim</label>
              <select value={filterMovie} onChange={e => setFilterMovie(e.target.value)} style={{ width: 'auto' }}>
                <option value="all">Tất cả phim</option>
                {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <Button size="sm">Áp dụng bộ lọc</Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng doanh thu', value: `${(totalRevenue / 1000000).toFixed(1)}M đ`, color: 'text-[#FFB703]' },
            { label: 'Tổng vé bán', value: totalTickets.toLocaleString(), color: 'text-[#E63946]' },
            { label: 'Doanh thu TB/ngày', value: `${(totalRevenue / 7 / 1000000).toFixed(1)}M đ`, color: 'text-[#0088FF]' },
            { label: 'Vé TB/ngày', value: Math.round(totalTickets / 7).toString(), color: 'text-[#2ECC71]' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4">
              <p className="text-[#B3B3B3] text-xs">{stat.label}</p>
              <p className={`font-black text-xl mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">Biểu Đồ Doanh Thu</h2>
          <BarChart data={revenueData} height={200} />
        </div>

        {/* Movie performance table */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#404040]">
            <h2 className="text-white font-bold">Hiệu Suất Từng Phim</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040]">
                <th className="text-left px-5 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Phim</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase hidden md:table-cell">Đánh giá</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Vé bán</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase hidden lg:table-cell">Doanh thu</th>
                <th className="text-left px-4 py-3 text-[#B3B3B3] text-xs font-semibold uppercase">Tỷ lệ lấp đầy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040]">
              {MOVIE_PERF.map(m => (
                <tr key={m.id} className="hover:bg-[#383838] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={m.poster} alt={m.title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">{m.title}</p>
                        <div className="flex gap-1 mt-0.5">
                          {m.genre.slice(0, 1).map(g => <Badge key={g} variant="blue" size="sm">{g}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <StarRating value={Math.round(m.rating)} readonly size="sm" />
                      <span className="text-[#FFB703] text-xs font-bold">{m.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold text-sm">{m.ticketsSold}</td>
                  <td className="px-4 py-3 text-[#FFB703] font-semibold text-sm hidden lg:table-cell">
                    {(m.revenue / 1000000).toFixed(1)}M đ
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#383838] rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${m.fillRate}%`,
                            backgroundColor: m.fillRate > 70 ? '#2ECC71' : m.fillRate > 40 ? '#FFB703' : '#E63946',
                          }}
                        />
                      </div>
                      <span className="text-[#B3B3B3] text-sm">{m.fillRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
