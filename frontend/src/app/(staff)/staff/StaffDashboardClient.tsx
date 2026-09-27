'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Transaction } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface StaffDashboardClientProps {
  initialTransactions: Transaction[];
}

export default function StaffDashboardClient({ initialTransactions }: StaffDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const today = '26/09/2026';
  const todayTransactions = initialTransactions.slice(0, 6);
  const filteredTx = searchQuery
    ? todayTransactions.filter(
        t =>
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
          <h2 className="text-white font-bold mb-3">Tra Cứu Nhanh Vé Khách Hàng</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Tìm theo email, số điện thoại hoặc mã vé..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm"
            />
            <Link
              href="/staff/lookup"
              className="px-4 py-2 bg-[#E63946] hover:bg-[#C62B36] text-white rounded-lg text-sm font-semibold transition-all"
            >
              Mở trang tra cứu
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] flex justify-between items-center">
            <h2 className="text-white font-bold text-sm">Giao Dịch Gần Nhất</h2>
            <Link href="/staff/lookup" className="text-xs text-[#0088FF] hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#404040] text-xs text-[#B3B3B3]">
                <th className="text-left px-4 py-3">Mã Vé</th>
                <th className="text-left px-4 py-3">Khách hàng</th>
                <th className="text-left px-4 py-3">Phim</th>
                <th className="text-left px-4 py-3">Ghế</th>
                <th className="text-left px-4 py-3">Tổng</th>
                <th className="text-right px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040] text-sm">
              {filteredTx.map(tx => (
                <tr key={tx.id} className="hover:bg-[#383838]">
                  <td className="px-4 py-3 font-mono text-white text-xs">{tx.ticketId}</td>
                  <td className="px-4 py-3 text-white">
                    <div>{tx.customerName}</div>
                    <div className="text-xs text-[#B3B3B3]">{tx.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-white text-xs">{tx.movieTitle}</td>
                  <td className="px-4 py-3 font-bold text-[#FFB703] text-xs">{tx.seats.join(', ')}</td>
                  <td className="px-4 py-3 text-white font-semibold text-xs">{tx.total.toLocaleString()}đ</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant={tx.status === 'completed' ? 'green' : 'gold'} size="sm">
                      {tx.status === 'completed' ? 'Đã thanh toán' : 'Chờ xử lý'}
                    </Badge>
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
