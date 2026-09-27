import { fetchAdminStats, fetchRevenueData, fetchMovies } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import BarChart from '@/components/ui/BarChart';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  // Asynchronous API calls (Server Component)
  const [stats, revenueData, movies] = await Promise.all([
    fetchAdminStats(),
    fetchRevenueData(),
    fetchMovies(),
  ]);

  const topMovies = [...movies]
    .filter(m => m.status === 'showing')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Dashboard Quản Trị</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Tổng quan hoạt động và doanh thu rạp chiếu phim Lumi Cinema</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tổng doanh thu"
            value={`${(stats.totalRevenue / 1000000).toFixed(1)}M đ`}
            subtitle="Tháng 9/2026"
            icon="💰"
            color="gold"
            trend={12}
          />
          <StatCard
            title="Vé đã bán"
            value={stats.totalTickets.toLocaleString()}
            subtitle="Tổng số vé"
            icon="🎟️"
            color="red"
            trend={8}
          />
          <StatCard
            title="Doanh thu combo"
            value={`${(stats.comboRevenue / 1000000).toFixed(1)}M đ`}
            subtitle="Bắp + nước"
            icon="🍿"
            color="blue"
            trend={5}
          />
          <StatCard
            title="Đánh giá TB"
            value={`${stats.averageRating}/5`}
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
              <h2 className="text-white font-bold text-lg">Doanh Thu 7 Ngày Gần Nhất</h2>
              <p className="text-[#B3B3B3] text-xs mt-0.5">Biểu đồ thống kê doanh số bán vé</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-[#E63946] text-xs font-semibold hover:underline"
            >
              Xem chi tiết báo cáo →
            </Link>
          </div>
          <BarChart data={revenueData} height={220} />
        </div>

        {/* Top movies */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Top Phim Ăn Khách</h2>
            <Link href="/admin/movies" className="text-xs text-[#E63946] font-semibold hover:underline">
              Quản lý phim →
            </Link>
          </div>

          <div className="space-y-3">
            {topMovies.map((movie, idx) => (
              <div
                key={movie.id}
                className="flex items-center justify-between p-3 bg-[#383838]/50 hover:bg-[#383838] rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-black text-[#FFB703] text-sm">#{idx + 1}</span>
                  <img src={movie.poster} alt={movie.title} className="w-10 h-14 object-cover rounded-lg" />
                  <div>
                    <h3 className="text-white font-bold text-sm">{movie.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating value={movie.rating} readonly size="sm" />
                      <span className="text-[#FFB703] text-xs font-bold">{movie.rating}</span>
                      <span className="text-[#525252]">•</span>
                      <span className="text-[#B3B3B3] text-xs">{movie.duration} phút</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-white font-bold text-sm">{movie.ticketPrice.toLocaleString('vi-VN')}đ</p>
                    <p className="text-[#B3B3B3] text-xs">Giá vé</p>
                  </div>
                  <Badge variant="green">Đang chiếu</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
