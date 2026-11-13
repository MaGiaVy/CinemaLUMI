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
  const userName = user?.name || user?.email || 'Khách hàng';

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
    <nav className="sticky top-0 z-50 bg-[rgba(8,6,14,0.75)] backdrop-blur-xl border-b border-[rgba(192,132,252,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo Thiên Hà */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          style={{ textDecoration: 'none' }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E11D48] to-[#581C87] border border-rose-500/40 flex items-center justify-center text-[#F8FAFC] font-black text-sm shadow-[0_0_12px_rgba(225,29,72,0.4)] group-hover:shadow-[0_0_18px_rgba(225,29,72,0.6)] transition-all">
            ✦
          </div>
          <span className="font-black text-lg sm:text-xl tracking-tight text-[#F8FAFC]">
            LUMI <span className="bg-gradient-to-r from-[#E11D48] via-[#C084FC] to-[#FDA4AF] bg-clip-text text-transparent">CINEMA</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-[#F8FAFC] bg-[rgba(192,132,252,0.18)] border border-[rgba(192,132,252,0.25)] shadow-[0_0_12px_rgba(88,28,135,0.3)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(192,132,252,0.08)]'
                }`}
                style={{ textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Quick links to Admin/Staff with clean typography (No Emojis) */}
          {userRole === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all ml-2"
              style={{ textDecoration: 'none' }}
            >
              ✦ Quản trị
            </Link>
          )}
          {userRole === 'staff' && (
            <Link
              href="/staff"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all ml-2"
              style={{ textDecoration: 'none' }}
            >
              ✦ Nhân viên
            </Link>
          )}
        </div>

        {/* Desktop Auth status */}
        <div className="hidden md:flex items-center gap-3">
          {status === 'loading' ? (
            <div className="w-20 h-8 bg-[rgba(18,14,28,0.7)] rounded-xl animate-pulse" />
          ) : loggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/tickets"
                className="text-[#94A3B8] hover:text-[#F8FAFC] text-sm transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Vé của tôi
              </Link>
              <div className="flex items-center gap-2.5 bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.2)] rounded-full px-3 py-1 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#E11D48] to-[#581C87] flex items-center justify-center text-[#F8FAFC] text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-[#F8FAFC] text-xs font-medium max-w-[120px] truncate">{userName}</span>
                {userRole && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    userRole === 'admin'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : userRole === 'staff'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {userRole.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#94A3B8] hover:text-rose-400 text-xs transition-colors cursor-pointer bg-transparent border-none"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-[#F8FAFC] hover:text-white text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-[rgba(18,14,28,0.6)] border border-[rgba(192,132,252,0.2)] hover:bg-[rgba(192,132,252,0.12)] transition-all"
                style={{ textDecoration: 'none' }}
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-[#E11D48] to-[#581C87] text-[#F8FAFC] text-xs sm:text-sm px-4 py-2 rounded-xl hover:from-[#F43F5E] hover:to-[#6B21A8] transition-all font-semibold shadow-md border border-rose-500/30 shadow-rose-950/40 active:scale-95"
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
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(192,132,252,0.1)] focus:outline-none cursor-pointer"
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
        <div className="md:hidden border-t border-[rgba(192,132,252,0.15)] bg-[rgba(10,8,18,0.96)] backdrop-blur-2xl px-4 pt-3 pb-6 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium ${
                pathname === link.href
                  ? 'text-[#F8FAFC] bg-[rgba(192,132,252,0.15)] border border-[rgba(192,132,252,0.2)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(192,132,252,0.08)]'
              }`}
              style={{ textDecoration: 'none' }}
            >
              {link.label}
            </Link>
          ))}

          {userRole === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
              style={{ textDecoration: 'none' }}
            >
              ✦ Quản trị hệ thống (Admin)
            </Link>
          )}

          {userRole === 'staff' && (
            <Link
              href="/staff"
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
              style={{ textDecoration: 'none' }}
            >
              ✦ Quầy vé nhân viên (Staff)
            </Link>
          )}

          <div className="pt-3 border-t border-[rgba(192,132,252,0.15)] mt-2">
            {status === 'loading' ? (
              <div className="px-3 py-2 text-sm text-slate-400">Đang tải...</div>
            ) : loggedIn ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#E11D48] to-[#581C87] flex items-center justify-center text-white text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[#F8FAFC] text-xs font-medium">{userName}</span>
                  {userRole && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {userRole.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="w-full text-center py-2.5 rounded-xl text-sm text-[#F8FAFC] bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.2)] hover:bg-[rgba(192,132,252,0.12)]"
                  style={{ textDecoration: 'none' }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#E11D48] to-[#581C87] hover:from-[#F43F5E] hover:to-[#6B21A8]"
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
