'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface AdminSidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const navItems = [
  { label: 'Dashboard Tổng Quan', page: 'admin-dashboard', href: '/admin' },
  { label: 'Quản Lý Phim', page: 'admin-movies', href: '/admin/movies' },
  { label: 'Suất Chiếu & Lịch', page: 'admin-screenings', href: '/admin/screenings' },
  { label: 'Tra Cứu Vé', page: 'staff-lookup', href: '/staff/lookup' },
  { label: 'Bảng Giá Vé', page: 'admin-pricing', href: '/admin/pricing' },
  { label: 'Voucher & Khuyến Mãi', page: 'admin-vouchers', href: '/admin/vouchers' },
  { label: 'Combo Bắp Nước', page: 'admin-combos', href: '/admin/combos' },
  { label: 'Báo Cáo Kế Toán (BR-10)', page: 'admin-reports', href: '/admin/reports' },
  { label: 'Đánh Giá Khán Giả', page: 'admin-reviews', href: '/admin/reviews' },
];

export default function AdminSidebar({ currentPage, onNavigate: _onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const adminName = session?.user?.name || 'Quản Trị Viên';
  const adminEmail = session?.user?.email || 'admin@lumicinema.vn';
  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() || 'A';

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0a0812]/90 backdrop-blur-2xl border-r border-[#c084fc]/15 min-h-screen flex flex-col justify-between relative z-20">
      <div>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.08]">
          <Link
            href="/admin"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02]"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#e11d48] to-[#881337] flex items-center justify-center text-white font-black text-base shadow-[0_0_16px_rgba(225,29,72,0.6)]">
              ✦
            </div>
            <div>
              <div className="font-black text-white text-sm tracking-wider uppercase">LUMI CINEMA</div>
              <div className="text-[#c084fc] text-[10px] font-bold tracking-widest uppercase">COMMAND DECK</div>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Typography-driven, No Emojis, Laser Indicators) */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              currentPage === item.page ||
              (item.href === '/admin'
                ? pathname === '/admin' || pathname === '/admin/dashboard'
                : pathname.startsWith(item.href)) ||
              (item.page === 'admin-vouchers' && pathname.startsWith('/admin/coupons'));

            return (
              <Link
                key={item.page}
                href={item.href}
                className={`group relative flex items-center px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-[#e11d48]/25 to-[#581c87]/20 border border-[#e11d48]/40 shadow-[0_0_16px_rgba(225,29,72,0.25)]'
                    : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
                }`}
                style={{ textDecoration: 'none' }}
              >
                {/* Glowing Velvet Red Laser Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#e11d48] shadow-[0_0_10px_#e11d48]" />
                )}
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e11d48] shadow-[0_0_6px_#e11d48]" />
                )}
              </Link>
            );
          })}

          {/* Quick link to customer portal */}
          <div className="pt-4 mt-4 border-t border-white/[0.08]">
            <Link
              href="/"
              className="flex items-center justify-between px-3.5 py-2 rounded-lg text-[11px] font-semibold text-[#64748b] hover:text-[#f8fafc] hover:bg-white/[0.04] transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <span>Xem trang khách</span>
              <span className="text-[10px] text-[#c084fc]">↗</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Admin User Info & Logout */}
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#581c87] to-[#881337] border border-[#c084fc]/30 flex items-center justify-center text-white text-xs font-black shadow-[0_0_10px_rgba(88,28,135,0.4)]">
            {adminInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#f8fafc] text-xs font-bold truncate">{adminName}</p>
            <p className="text-[#a78bfa] text-[10px] truncate">{adminEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-1.5 px-3 text-[11px] font-semibold text-[#94a3b8] hover:text-[#fda4af] hover:bg-[#e11d48]/15 border border-transparent hover:border-[#e11d48]/30 rounded-lg transition-all cursor-pointer text-center"
        >
          Đăng xuất hệ thống
        </button>
      </div>
    </aside>
  );
}
