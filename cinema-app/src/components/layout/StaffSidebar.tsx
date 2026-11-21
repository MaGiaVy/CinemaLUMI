'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface StaffSidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const navItems = [
  { label: 'Bàn Điều Hành (Dashboard)', tag: 'DASHBOARD', href: '/staff' },
  { label: 'Bán Vé & Combo (POS)', tag: 'POS 01', href: '/staff/pos' },
  { label: 'Soát Vé & Tra Cứu (Laser)', tag: 'SCANNER', href: '/staff/lookup' },
  { label: 'Kệ Giao Bắp Nước', tag: 'PICKUP', href: '/staff/combos' },
];

export default function StaffSidebar({ currentPage, onNavigate: _onNavigate }: StaffSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const staffName = session?.user?.name || 'Nhân viên';
  const staffEmail = session?.user?.email || 'Ca Tối · Quầy POS 01';
  const isAdmin = session?.user?.role === 'ADMIN';
  const staffInitials = staffName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() || (isAdmin ? 'AD' : 'NV');

  return (
    <aside className="w-64 flex-shrink-0 bg-[rgba(15,11,26,0.85)] backdrop-blur-2xl border-r border-[rgba(192,132,252,0.2)] min-h-screen flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.8)]">
      {/* Cosmic Terminal Brand Header */}
      <div className="px-5 py-5 border-b border-[rgba(192,132,252,0.15)] bg-gradient-to-r from-[rgba(20,14,32,0.9)] to-[rgba(35,12,28,0.7)]">
        <Link
          href="/staff"
          className="flex items-center gap-3 no-underline group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#881337] flex items-center justify-center text-white font-black text-sm shadow-[0_0_18px_rgba(225,29,72,0.6)] border border-[rgba(254,205,211,0.4)] group-hover:scale-105 transition-transform">
            ✦
          </div>
          <div>
            <div className="font-extrabold text-[#F8FAFC] text-sm tracking-wider flex items-center gap-1.5">
              <span>LUMI CINEMA</span>
            </div>
            <div className="text-[11px] font-semibold text-[#C084FC] tracking-wider uppercase">
              Buồng Lái Vận Hành
            </div>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {isAdmin && (
          <div className="mb-3 pb-2 border-b border-[rgba(192,132,252,0.15)]">
            <Link
              href="/admin"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/40 transition-all no-underline shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-extrabold">←</span>
                <span>Về Admin Dashboard</span>
              </div>
              <span className="text-[9px] bg-amber-400/25 text-amber-300 border border-amber-400/50 px-1.5 py-0.5 rounded font-black tracking-wider">
                ADMIN
              </span>
            </Link>
          </div>
        )}

        <div className="px-3 pb-2 text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
          Phân Hệ Quầy Rạp
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              currentPage === item.tag ||
              (item.href === '/staff'
                ? pathname === '/staff'
                : pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 no-underline ${
                  isActive
                    ? 'bg-gradient-to-r from-[rgba(225,29,72,0.35)] to-[rgba(88,28,135,0.45)] text-[#F8FAFC] border border-[rgba(244,63,94,0.55)] shadow-[0_0_18px_rgba(225,29,72,0.4)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-[#FDA4AF] shadow-[0_0_8px_#FDA4AF]' : 'bg-[#64748B]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-[rgba(225,29,72,0.3)] text-[#FDA4AF] border border-[rgba(225,29,72,0.5)]'
                      : 'bg-[rgba(255,255,255,0.04)] text-[#64748B]'
                  }`}
                >
                  {item.tag}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Link quay về trang khách hàng */}
        <div className="mt-6 pt-4 border-t border-[rgba(192,132,252,0.15)]">
          <Link
            href="/"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(192,132,252,0.1)] border border-dashed border-[rgba(192,132,252,0.25)] transition-all no-underline"
          >
            <span>Trang Khách Hàng</span>
            <span className="text-[#C084FC]">↗</span>
          </Link>
        </div>
      </nav>

      {/* Staff user info & status cluster */}
      <div className="p-3.5 border-t border-[rgba(192,132,252,0.15)] bg-[rgba(8,6,14,0.7)]">
        <div className="flex items-center gap-3 p-2.5 bg-[rgba(18,14,28,0.7)] rounded-xl border border-[rgba(192,132,252,0.2)] mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#881337] to-[#581C87] border border-[rgba(192,132,252,0.3)] flex items-center justify-center text-xs font-black text-[#F8FAFC]">
            {staffInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
              <p className="text-[#F8FAFC] text-xs font-bold truncate">{staffName}</p>
            </div>
            <p className="text-[11px] text-[#94A3B8] truncate">{staffEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#FDA4AF] hover:bg-[rgba(225,29,72,0.12)] rounded-lg transition-colors cursor-pointer bg-transparent border border-transparent hover:border-[rgba(225,29,72,0.3)] text-center"
        >
          Đăng xuất ca làm việc
        </button>
      </div>
    </aside>
  );
}
