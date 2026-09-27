import { adminStats, movies, revenueData } from '@/data/mockData';
import StatCard from '@/components/ui/StatCard';
import BarChart from '@/components/ui/BarChart';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';

export default function AdminDashboardPage() {
  const topMovies = [...movies]
    .filter(m => m.status === 'showing')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Tổng quan hoạt động rạp chiếu phim</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tổng doanh thu"
            value={`${(adminStats.totalRevenue / 1000000).toFixed(1)}M đ`}
            subtitle="Tháng 9/2026"
            icon="💰"
            color="gold"
            trend={12}
          />
          <StatCard
            title="Vé đã bán"
            value={adminStats.totalTickets.toLocaleString()}
            subtitle="Tổng số vé"
            icon="🎟️"
            color="red"
            trend={8}
          />
          <StatCard
            title="Doanh thu combo"
            value={`${(adminStats.comboRevenue / 1000000).toFixed(1)}M đ`}
            subtitle="Bắp + nước"
            icon="🍿"
            color="blue"
            trend={5}
          />
          <StatCard
            title="Đánh giá TB"
            value={`${adminStats.averageRating}/5`}
            subtitle="Từ khách hàng"
            icon="⭐"
            color="green"
            trend={2}
          />
        </div>

        {/* Revenue chart */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-base">Doanh Thu 7 Ngày Qua</h2>
              <p className="text-[#B3B3B3] text-xs mt-1">Di chuột vào cột để xem chi tiết</p>
            </div>
            <div className="flex gap-2">
              {['7 ngày', '30 ngày', '3 tháng'].map((p, i) => (
                <button
                  key={p}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    i === 0
                      ? 'bg-[#E63946] text-white'
                      : 'bg-[#383838] text-[#B3B3B3] hover:text-white'
                  }`}
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={revenueData} height={220} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top movies */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
            <h2 className="text-white font-bold mb-4">Top Phim Theo Đánh Giá</h2>
            <div className="space-y-3">
              {topMovies.map((movie, i) => (
                <div key={movie.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-[#FFB703] text-[#1A1A1A]' :
                    i === 1 ? 'bg-[#B3B3B3] text-[#1A1A1A]' :
                    i === 2 ? 'bg-[#CD7F32] text-white' :
                    'bg-[#383838] text-[#B3B3B3]'
                  }`}>
                    {i + 1}
                  </span>
                  <img src={movie.poster} alt={movie.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                    <div className="flex items-center gap-1">
                      <StarRating value={Math.round(movie.rating)} readonly size="sm" />
                      <span className="text-[#FFB703] text-xs font-bold">{movie.rating}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {movie.genre.map(g => <Badge key={g} variant="blue" size="sm">{g}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5">
            <h2 className="text-white font-bold mb-4">Cảnh Báo & Thông Báo</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-[#FFB703]/10 border border-[#FFB703]/30 rounded-xl p-3">
                <span className="text-[#FFB703] text-lg">⚠️</span>
                <div>
                  <p className="text-[#FFB703] text-sm font-semibold">Combo VIP sắp hết hàng</p>
                  <p className="text-[#B3B3B3] text-xs">Còn 15 suất — Hãy nhập thêm hàng sớm</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#0088FF]/10 border border-[#0088FF]/30 rounded-xl p-3">
                <span className="text-[#0088FF] text-lg">ℹ️</span>
                <div>
                  <p className="text-[#0088FF] text-sm font-semibold">Voucher SUMMER30 đã hết hạn</p>
                  <p className="text-[#B3B3B3] text-xs">1000/1000 lượt sử dụng — Hạn 31/8/2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-xl p-3">
                <span className="text-[#2ECC71] text-lg">✓</span>
                <div>
                  <p className="text-[#2ECC71] text-sm font-semibold">Doanh thu T7 đạt kỷ lục</p>
                  <p className="text-[#B3B3B3] text-xs">32.1M đ — Tăng 15% so với T7 tuần trước</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-3">
                <span className="text-[#E63946] text-lg">❌</span>
                <div>
                  <p className="text-[#E63946] text-sm font-semibold">2 đánh giá spam cần xét duyệt</p>
                  <p className="text-[#B3B3B3] text-xs">Kiểm tra trang Đánh giá để xử lý</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
