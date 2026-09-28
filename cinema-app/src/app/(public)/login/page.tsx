'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Toast, { ToastMessage } from '@/components/ui/Toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Hiển thị thông báo khi bị redirect từ Middleware do chưa đăng nhập hoặc vi phạm quyền
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'AccessDenied') {
      showToast('Quyền truy cập bị từ chối: Tài khoản của bạn không có đặc quyền truy cập trang này.', 'error');
    } else if (err === 'Unauthenticated') {
      showToast('Phiên làm việc đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 'warning');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Vui lòng nhập đầy đủ email và mật khẩu', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Gọi signIn của NextAuth với Credentials Provider
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        const errorMsg =
          res.error === 'CredentialsSignin' || res.error.includes('CredentialsSignin')
            ? 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
            : res.error;
        showToast(errorMsg, 'error');
        setLoading(false);
        return;
      }

      if (res?.ok) {
        showToast('Đăng nhập thành công!', 'success');

        // Lấy session mới nhất để đọc role
        const session = await getSession();
        const role = (session?.user as { role?: string } | undefined)?.role;
        const callbackUrl = searchParams.get('callbackUrl');

        setTimeout(() => {
          if (role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else if (role === 'STAFF') {
            router.push('/staff');
          } else if (callbackUrl && !callbackUrl.includes('/login')) {
            router.push(callbackUrl);
          } else {
            router.push('/');
          }
          router.refresh();
        }, 500);
      }
    } catch (_err) {
      showToast('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen bg-[#1A1A1A] flex">
        {/* Cột trái: Hình ảnh thương hiệu cinema */}
        <div className="hidden lg:block flex-1 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=1000&fit=crop&auto=format"
            alt="Cinema"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/30 via-[#1A1A1A]/60 to-[#1A1A1A]" />
          <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E63946] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                L
              </div>
              <span className="font-black text-2xl text-white tracking-wide">
                LUMI <span className="text-[#E63946]">CINEMA</span>
              </span>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              Trải nghiệm điện ảnh<br />đỉnh cao cùng chúng tôi
            </h2>
            <p className="text-[#B3B3B3] text-sm max-w-sm leading-relaxed">
              Đặt vé nhanh chóng, chọn ghế linh hoạt, thanh toán an toàn. Hệ thống rạp phim hiện đại hàng đầu Việt Nam.
            </p>
          </div>
        </div>

        {/* Cột phải: Form đăng nhập */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo hiển thị trên mobile */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-[#E63946] rounded-lg flex items-center justify-center text-white font-black">
                L
              </div>
              <span className="font-black text-xl text-white">
                LUMI <span className="text-[#E63946]">CINEMA</span>
              </span>
            </div>

            <h1 className="text-3xl font-black text-white mb-2">Đăng nhập</h1>
            <p className="text-[#B3B3B3] text-sm mb-8">
              Chưa có tài khoản?{' '}
              <Link
                href="/signup"
                className="text-[#E63946] hover:underline font-semibold"
              >
                Đăng ký ngay
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white cursor-pointer bg-transparent border-none text-base"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    className="text-[#0088FF] text-xs hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#404040]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#1A1A1A] px-3 text-[#B3B3B3] text-xs">
                  hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D2D2D] border border-[#404040] rounded-lg text-sm text-white hover:bg-[#383838] transition-colors font-medium cursor-pointer"
              >
                <span>🌐</span> Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D2D2D] border border-[#404040] rounded-lg text-sm text-white hover:bg-[#383838] transition-colors font-medium cursor-pointer"
              >
                <span>📘</span> Facebook
              </button>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-[#B3B3B3] text-sm hover:text-white transition-colors"
              >
                ← Quay về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-white">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
