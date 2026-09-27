'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function Navbar({
  currentPage,
  onNavigate,
  isLoggedIn: propIsLoggedIn,
  onLogin,
  onLogout,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(propIsLoggedIn ?? false);
  const [userName, setUserName] = useState('Nguyễn An');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof propIsLoggedIn === 'boolean') {
      setLoggedIn(propIsLoggedIn);
      return;
    }

    // Tự động kiểm tra auth cookie ở Client
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const hasRole = cookies.includes('user_role=');
    const isLoggedCookie = cookies.includes('is_logged_in=true');
    const roleMatch = cookies.match(/user_role=([^;]+)/);
    const role = roleMatch ? roleMatch[1] : null;

    setUserRole(role);
    setLoggedIn(hasRole || isLoggedCookie);

    if (role === 'admin') setUserName('Admin Lumi');
    else if (role === 'staff') setUserName('Nhân viên Lumi');
    else setUserName('Nguyễn An');
  }, [propIsLoggedIn, pathname]);

  const handleLogout = () => {
    // Xóa cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'user_role=; path=/; max-age=0';
      document.cookie = 'is_logged_in=; path=/; max-age=0';
      document.cookie = 'auth_token=; path=/; max-age=0';
    }
    setLoggedIn(false);
    setUserRole(null);

    if (onLogout) {
      onLogout();
    } else {
      router.push('/login');
      router.refresh();
    }
  };

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Lịch chiếu', href: '/#showing' },
    { label: 'Vé của tôi', href: '/my-tickets' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#404040]">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          style={{ textDecoration: 'none' }}
        >
          <div className="w-8 h-8 bg-[#E63946] rounded-lg flex items-center justify-center text-white font-black text-lg">
            L
          </div>
          <span className="font-black text-xl text-white group-hover:text-[#E63946] transition-colors">
            LUMI <span className="text-[#E63946]">CINEMA</span>
          </span>
        </Link>

        {/* Nav links */}
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E63946]/20 text-[#E63946] hover:bg-[#E63946] hover:text-white transition-colors"
              style={{ textDecoration: 'none' }}
            >
              🔧 Quản trị
            </Link>
          )}
          {userRole === 'staff' && (
            <Link
              href="/staff"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2ECC71]/20 text-[#2ECC71] hover:bg-[#2ECC71] hover:text-white transition-colors"
              style={{ textDecoration: 'none' }}
            >
              💼 Nhân viên
            </Link>
          )}
        </div>

        {/* Auth status */}
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/my-tickets"
                className="text-[#B3B3B3] hover:text-white text-sm transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Vé của tôi
              </Link>
              <div className="flex items-center gap-2 bg-[#2D2D2D] border border-[#404040] rounded-full px-3 py-1.5 cursor-pointer hover:border-[#525252] transition-colors">
                <div className="w-6 h-6 bg-[#E63946] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {userName.charAt(0)}
                </div>
                <span className="text-white text-sm font-medium">{userName}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#B3B3B3] hover:text-white text-sm transition-colors cursor-pointer bg-transparent border-none"
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
                className="bg-[#E63946] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#C62B36] transition-colors font-semibold"
                style={{ textDecoration: 'none' }}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
