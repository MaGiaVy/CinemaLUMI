'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface StaffSidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const navItems = [
  { icon: '🏠', label: 'Dashboard', page: 'staff-dashboard', href: '/staff' },
  { icon: '🔍', label: 'Tra cứu vé', page: 'staff-lookup', href: '/staff/lookup' },
];

export default function StaffSidebar({ currentPage, onNavigate: _onNavigate }: StaffSidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-[#1E1E1E] border-r border-[#404040] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#404040]">
        <Link
          href="/staff"
          className="flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <div className="w-8 h-8 bg-[#E63946] rounded-lg flex items-center justify-center text-white font-black text-lg">
            L
          </div>
          <div>
            <div className="font-black text-white text-base leading-tight">LUMI CINEMA</div>
            <div className="text-[#B3B3B3] text-xs">Nhân viên quầy</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              currentPage === item.page ||
              (item.href === '/staff'
                ? pathname === '/staff'
                : pathname.startsWith(item.href));

            return (
              <Link
                key={item.page}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#E63946] text-white'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-[#2D2D2D]'
                }`}
                style={{ textDecoration: 'none' }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Link quay về trang khách hàng */}
        <div className="mt-6 pt-4 border-t border-[#404040]">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#888888] hover:text-white hover:bg-[#2D2D2D] transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <span>🌐</span>
            <span>Xem trang khách</span>
          </Link>
        </div>
      </nav>

      {/* Staff user info & logout */}
      <div className="p-4 border-t border-[#404040]">
        <div className="flex items-center gap-3 p-3 bg-[#2D2D2D] rounded-xl mb-2">
          <div className="w-8 h-8 bg-[#2ECC71] rounded-full flex items-center justify-center text-white text-sm font-bold">
            N
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Nhân Viên Quầy</p>
            <p className="text-[#B3B3B3] text-xs truncate">staff@lumi.vn</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-1.5 text-xs text-[#B3B3B3] hover:text-[#E63946] hover:bg-[#383838] rounded-lg transition-colors cursor-pointer bg-transparent border-none text-center"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
