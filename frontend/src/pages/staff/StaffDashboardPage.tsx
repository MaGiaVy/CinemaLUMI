import { useState } from 'react';
import { transactions } from '@/data/mockData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface StaffDashboardPageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function StaffDashboardPage({ onNavigate }: StaffDashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toLocaleDateString('vi-VN');
  const todayTransactions = transactions.slice(0, 6);
  const filteredTx = searchQuery
    ? todayTransactions.filter(t =>
        t.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.includes(searchQuery) ||
        t.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : todayTransactions;

  return (
    <div className="flex-1 bg-[#1A1A1A] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Dashboard Nhân Viên</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">Hôm nay: {today} • Ca làm việc: 08:00 - 17:00</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Vé đã bán hôm nay', value: '47', icon: '🎟️', color: 'bg-[#E63946]/10 border-[#E63946]/20 text-[#E63946]' },
            { label: 'Doanh thu hôm nay', value: '5.6M đ', icon: '💰', color: 'bg-[#FFB703]/10 border-[#FFB703]/20 text-[#FFB703]' },
            { label: 'Vé chờ xử lý', value: '3', icon: '⏳', color: 'bg-[#0088FF]/10 border-[#0088FF]/20 text-[#0088FF]' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color} text-xl`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[#B3B3B3] text-xs">{stat.label}</p>
                  <p className="text-white font-black text-lg">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick search */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 mb-6">
          <h2 className="text-white font-bold mb-3">Tra Cứu Nhanh</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Tìm theo email, số điện thoại hoặc mã vé..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Button onClick={() => onNavigate('staff-lookup')}>
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#404040]">
            <h2 className="text-white font-bold">Giao Dịch Gần Đây</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('staff-lookup')}>
              Xem tất cả →
            </Button>
          </div>

          <div className="divide-y divide-[#404040]">
            {filteredTx.map(tx => (
              <div key={tx.id} className="px-5 py-4 hover:bg-[#383838] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">{tx.customerName}</p>
                      <span className="text-[#525252]">•</span>
                      <p className="text-[#B3B3B3] text-xs">{tx.phone}</p>
                    </div>
                    <p className="text-[#B3B3B3] text-xs mt-0.5">{tx.movieTitle} • Ghế {tx.seats.join(', ')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#FFB703] font-semibold text-sm">{tx.total.toLocaleString('vi-VN')}đ</p>
                    <p className="text-[#B3B3B3] text-xs">{tx.time}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {tx.status === 'completed' && <Badge variant="green">Hoàn thành</Badge>}
                    {tx.status === 'pending' && <Badge variant="gold">Chờ xử lý</Badge>}
                    {tx.status === 'cancelled' && <Badge variant="red">Đã hủy</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('staff-lookup')}>
                    Chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
