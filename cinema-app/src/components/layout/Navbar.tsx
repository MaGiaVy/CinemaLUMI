'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function Navbar({
  currentPage: _currentPage,
  onNavigate: _onNavigate,
  isLoggedIn: _propIsLoggedIn,
  onLogin: _onLogin,
  onLogout: _onLogout,
}: NavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Trạng thái đăng nhập dựa trên NextAuth session
  const loggedIn = status === 'authenticated' && !!session?.user;
  const user = session?.user as { name?: string | null; email?: string | null; role?: string } | undefined;
  const userRole = user?.role?.toLowerCase() || null;
  const userName = user?.name || user?.email || 'Người dùng';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Lịch chiếu', href: '/#showing' },
    { label: 'Vé của tôi', href: '/tickets' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#404040]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          style={{ textDecoration: 'none' }}
        >
          <div className="w-8 h-8 bg-[#E63946] rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md">
            L
          </div>
          <span className="font-black text-xl text-white group-hover:text-[#E63946] transition-colors tracking-tight">
            LUMI <span className="text-[#E63946]">CINEMA</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-[#2D2D2D]'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-[#2D2D2D]'
                }`}
                style={{ textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Quick links to Admin/Staff when user has those roles */}
          {userRole === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E63946]/20 text-[#E63946] hover:bg-[#E63946] hover:text-white transition-colors ml-2"
              style={{ textDecoration: 'none' }}
            >
              🔧 Quản trị
            </Link>
          )}
          {userRole === 'staff' && (
            <Link
              href="/staff"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2ECC71]/20 text-[#2ECC71] hover:bg-[#2ECC71] hover:text-white transition-colors ml-2"
              style={{ textDecoration: 'none' }}
            >
              💼 Nhân viên
            </Link>
          )}
        </div>

        {/* Desktop Auth status */}
        <div className="hidden md:flex items-center gap-3">
          {status === 'loading' ? (
            <div className="w-20 h-8 bg-[#2D2D2D] rounded-lg animate-pulse" />
          ) : loggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/tickets"
                className="text-[#B3B3B3] hover:text-white text-sm transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Vé của tôi
              </Link>
              <div className="flex items-center gap-2 bg-[#2D2D2D] border border-[#404040] rounded-full px-3 py-1.5 cursor-pointer hover:border-[#525252] transition-colors">
                <div className="w-6 h-6 bg-[#E63946] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-medium">{userName}</span>
                {userRole && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    userRole === 'admin'
                      ? 'bg-[#E63946]/20 text-[#E63946]'
                      : userRole === 'staff'
                        ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                        : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {userRole.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#B3B3B3] hover:text-[#E63946] text-sm transition-colors cursor-pointer bg-transparent border-none"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-[#B3B3B3] hover:text-white text-sm px-4 py-2 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="bg-[#E63946] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#C62B36] transition-colors font-semibold shadow-md active:scale-95"
                style={{ textDecoration: 'none' }}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#B3B3B3] hover:text-white hover:bg-[#2D2D2D] focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Responsive) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#333333] bg-[#141414] px-4 pt-3 pb-6 flex flex-col gap-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium ${
                pathname === link.href ? 'text-white bg-[#262626]' : 'text-[#B3B3B3] hover:text-white hover:bg-[#262626]'
              }`}
              style={{ textDecoration: 'none' }}
            >
              {link.label}
            </Link>
          ))}

          {userRole === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-[#E63946] bg-[#E63946]/10 hover:bg-[#E63946]/20"
              style={{ textDecoration: 'none' }}
            >
              🔧 Quản trị hệ thống (Admin)
            </Link>
          )}

          {userRole === 'staff' && (
            <Link
              href="/staff"
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-[#2ECC71] bg-[#2ECC71]/10 hover:bg-[#2ECC71]/20"
              style={{ textDecoration: 'none' }}
            >
              💼 Quầy vé nhân viên (Staff)
            </Link>
          )}

          <div className="pt-3 border-t border-[#2D2D2D] mt-2">
            {status === 'loading' ? (
              <div className="px-3 py-2 text-sm text-slate-400">Đang tải...</div>
            ) : loggedIn ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300">
                  <div className="w-6 h-6 bg-[#E63946] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span>{userName}</span>
                  {userRole && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      userRole === 'admin'
                        ? 'bg-[#E63946]/20 text-[#E63946]'
                        : userRole === 'staff'
                          ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {userRole.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="w-full text-center py-2.5 rounded-lg text-sm text-slate-200 border border-slate-700 hover:bg-slate-800"
                  style={{ textDecoration: 'none' }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-[#E63946] hover:bg-[#C62B36]"
                  style={{ textDecoration: 'none' }}
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
