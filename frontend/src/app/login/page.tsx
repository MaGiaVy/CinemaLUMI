'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = searchParams.get('callbackUrl') || '';
  const reason = searchParams.get('reason') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectDemoRole = (role: 'customer' | 'staff' | 'admin', mail: string) => {
    setSelectedRole(role);
    setEmail(mail);
    setPassword('123456');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Xác định Role từ email hoặc selectedRole
      let role = selectedRole;
      if (email.toLowerCase().includes('admin')) role = 'admin';
      else if (email.toLowerCase().includes('staff')) role = 'staff';

      // Lưu cookie xác thực và role cho middleware
      document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `is_logged_in=true; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `auth_token=token_${Date.now()}; path=/; max-age=86400; SameSite=Lax`;

      setLoading(false);

      // Điều hướng tới callbackUrl nếu phù hợp quyền, ngược lại về đúng trang chủ của Role
      if (callbackUrl) {
        if (callbackUrl.startsWith('/admin') && role !== 'admin') {
          router.push('/admin');
          return;
        }
        if (callbackUrl.startsWith('/staff') && role !== 'staff' && role !== 'admin') {
          router.push('/staff');
          return;
        }
        window.location.href = callbackUrl;
        return;
      }

      if (role === 'admin') {
        window.location.href = '/admin';
      } else if (role === 'staff') {
        window.location.href = '/staff';
      } else {
        window.location.href = '/';
      }
    }, 600);
  };

  return (
    <div className="w-full max-w-md bg-[#2D2D2D] border border-[#404040] rounded-2xl p-8 shadow-2xl">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6 justify-center">
        <div className="w-9 h-9 bg-[#E63946] rounded-xl flex items-center justify-center text-white font-black text-xl">
          L
        </div>
        <span className="font-black text-2xl text-white">
          LUMI <span className="text-[#E63946]">CINEMA</span>
        </span>
      </div>

      <h1 className="text-2xl font-black text-white text-center mb-1">Đăng Nhập</h1>
      <p className="text-[#B3B3B3] text-xs text-center mb-5">
        Chưa có tài khoản?{' '}
        <Link href="/signup" className="text-[#E63946] hover:underline font-semibold">
          Đăng ký ngay
        </Link>
      </p>

      {/* Cảnh báo từ Middleware */}
      {reason === 'unauthenticated' && (
        <div className="mb-5 p-3.5 bg-[#FFB703]/10 border border-[#FFB703]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#FFB703]">
          <span className="text-base">⚠️</span>
          <div>
            <p className="font-bold">Yêu cầu đăng nhập</p>
            <p className="opacity-90">Vui lòng đăng nhập để truy cập trang này.</p>
          </div>
        </div>
      )}

      {reason === 'unauthorized_role' && (
        <div className="mb-5 p-3.5 bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#E63946]">
          <span className="text-base">⛔</span>
          <div>
            <p className="font-bold">Từ chối truy cập (Sai Role)</p>
            <p className="opacity-90">Tài khoản của bạn không đủ quyền hạn. Vui lòng đăng nhập với tài khoản có Role phù hợp (Admin hoặc Nhân viên).</p>
          </div>
        </div>
      )}

      {/* Chọn nhanh tài khoản mẫu */}
      <div className="mb-5 p-3 bg-[#1F1F1F] border border-[#3A3A3A] rounded-xl">
        <p className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider mb-2">
          Chọn nhanh tài khoản mẫu (Demo Role):
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => selectDemoRole('customer', 'khachhang@lumi.vn')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              selectedRole === 'customer'
                ? 'bg-[#E63946] text-white border-[#E63946]'
                : 'bg-[#2A2A2A] text-[#B3B3B3] border-[#404040] hover:text-white'
            }`}
          >
            Khách hàng
          </button>
          <button
            type="button"
            onClick={() => selectDemoRole('staff', 'staff@lumi.vn')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              selectedRole === 'staff'
                ? 'bg-[#2ECC71] text-white border-[#2ECC71]'
                : 'bg-[#2A2A2A] text-[#B3B3B3] border-[#404040] hover:text-white'
            }`}
          >
            Nhân viên
          </button>
          <button
            type="button"
            onClick={() => selectDemoRole('admin', 'admin@lumi.vn')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-[#0088FF] text-white border-[#0088FF]'
                : 'bg-[#2A2A2A] text-[#B3B3B3] border-[#404040] hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white text-xs font-semibold mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@lumi.vn"
            className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#E63946] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-white text-xs font-semibold mb-1">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white text-sm pr-10 focus:border-[#E63946] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#B3B3B3] bg-transparent border-none cursor-pointer"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? 'Đang xác thực...' : 'Đăng nhập'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-xs text-[#B3B3B3] hover:text-white transition-colors">
          ← Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-white text-sm">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
