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

  const fillDemoAccount = (accountEmail: string, accountPass: string, accountName: string) => {
    setEmail(accountEmail);
    setPassword(accountPass);
    showToast(`Đã điền tài khoản: ${accountName}`, 'success');
  };

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

      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex font-sans selection:bg-[#E11D48] selection:text-white relative overflow-hidden">
        {/* Tinh vân nền */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#581C87]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#881337]/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Cột trái: Hình ảnh thương hiệu cinema */}
        <div className="hidden lg:block flex-1 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&h=1200&fit=crop&auto=format"
            alt="Cinema"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/40 via-[#050508]/75 to-[#050508]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />

          <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#E11D48] to-[#581C87] border border-rose-500/40 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(225,29,72,0.5)]">
                ✦
              </div>
              <span className="font-black text-2xl text-white tracking-wide">
                LUMI <span className="bg-gradient-to-r from-[#E11D48] via-[#C084FC] to-[#FDA4AF] bg-clip-text text-transparent">CINEMA</span>
              </span>
            </div>
            <h2 className="text-3xl font-black text-[#F8FAFC] leading-tight mb-3">
              Trải nghiệm điện ảnh vũ trụ<br />đỉnh cao cùng chúng tôi
            </h2>
            <p className="text-[#94A3B8] text-sm max-w-sm leading-relaxed">
              Đặt vé nhanh chóng, chọn ghế linh hoạt, thanh toán an toàn. Hệ thống rạp phim hiện đại hàng đầu Việt Nam.
            </p>
          </div>
        </div>

        {/* Cột phải: Form đăng nhập kính mờ */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative z-10">
          <div className="w-full max-w-xl bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.22)] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
            {/* Logo trên mobile */}
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-tr from-[#E11D48] to-[#581C87] rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
                ✦
              </div>
              <span className="font-black text-xl text-white">
                LUMI <span className="bg-gradient-to-r from-[#E11D48] via-[#C084FC] to-[#FDA4AF] bg-clip-text text-transparent">CINEMA</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
                  Đăng nhập
                </h1>
                <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
                  Hệ thống tự động nhận diện vai trò Quản trị, Nhân viên hoặc Khách hàng
                </p>
              </div>
              <p className="text-[#94A3B8] text-xs mt-2 sm:mt-0">
                Chưa có tài khoản?{' '}
                <Link
                  href="/signup"
                  className="text-[#FDA4AF] hover:underline font-semibold"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            {/* BẢNG ĐIỀN NHANH TÀI KHOẢN PHÂN QUYỀN (1-CLICK FILL DEMO) */}
            <div className="mb-5 p-3.5 rounded-2xl bg-[rgba(26,20,40,0.65)] border border-[rgba(192,132,252,0.22)] shadow-inner">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-black">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span className="text-[11px] font-bold text-[#F8FAFC] tracking-wide uppercase">
                    ĐIỀN NHANH TÀI KHOẢN PHÂN QUYỀN (1–CLICK FILL DEMO)
                  </span>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                  Bấm là điền ngay
                </span>
              </div>

              {/* 3 Thẻ vai trò chính */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
                {/* 1. Admin */}
                <button
                  type="button"
                  onClick={() => fillDemoAccount('giavyma265@gmail.com', '123456', 'Admin (Mã Gia Vỹ)')}
                  className="p-2.5 rounded-xl bg-[rgba(10,8,18,0.7)] border border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/10 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-0.5 text-rose-400">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs font-black text-white group-hover:text-rose-300 transition-colors truncate">
                      Admin (Mã Gia Vỹ)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Quản lý rạp · <span className="text-rose-300/90 font-mono">123456</span>
                  </div>
                </button>

                {/* 2. Staff */}
                <button
                  type="button"
                  onClick={() => fillDemoAccount('magiavy265@gmail.com', '123456', 'Nhân Viên (Gia Vỹ)')}
                  className="p-2.5 rounded-xl bg-[rgba(10,8,18,0.7)] border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-0.5 text-amber-400">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                      Nhân Viên (Gia Vỹ)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Soát vé & POS · <span className="text-amber-300/90 font-mono">123456</span>
                  </div>
                </button>

                {/* 3. Customer */}
                <button
                  type="button"
                  onClick={() => fillDemoAccount('khachhang@lumi.vn', '123456', 'Khách Hàng Demo')}
                  className="p-2.5 rounded-xl bg-[rgba(10,8,18,0.7)] border border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-0.5 text-cyan-400">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                      Khách Hàng Demo
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    khachhang@lumi.vn
                  </div>
                </button>
              </div>

              {/* Hàng 2: Nhân viên ca làm & Thành viên */}
              <div className="pt-2 border-t border-[rgba(192,132,252,0.15)]">
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-[#94A3B8] font-semibold">
                  <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>NHÂN VIÊN CA LÀM & TÀI KHOẢN KHÁC (MẬT KHẨU: <span className="text-purple-300 font-mono">123456</span>):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('staff@lumi.vn', '123456', 'Quầy POS Lumi 01')}
                    className="p-1.5 rounded-lg bg-[rgba(10,8,18,0.5)] border border-[rgba(192,132,252,0.15)] hover:border-amber-400 hover:bg-amber-500/10 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-white truncate">Quầy POS 01</div>
                    <div className="text-[9px] text-slate-400 truncate">staff@lumi.vn</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('admin@lumi.vn', '123456', 'Admin Rạp Lumi')}
                    className="p-1.5 rounded-lg bg-[rgba(10,8,18,0.5)] border border-[rgba(192,132,252,0.15)] hover:border-rose-400 hover:bg-rose-500/10 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-white truncate">Admin Rạp</div>
                    <div className="text-[9px] text-slate-400 truncate">admin@lumi.vn</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('hung123@gmail.com', '123456', 'Nguyễn Khánh Hưng')}
                    className="p-1.5 rounded-lg bg-[rgba(10,8,18,0.5)] border border-[rgba(192,132,252,0.15)] hover:border-cyan-400 hover:bg-cyan-500/10 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-white truncate">Khánh Hưng</div>
                    <div className="text-[9px] text-slate-400 truncate">Khách VIP</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('huuthang123@gmail.com', '123456', 'Nguyễn Hữu Thắng')}
                    className="p-1.5 rounded-lg bg-[rgba(10,8,18,0.5)] border border-[rgba(192,132,252,0.15)] hover:border-cyan-400 hover:bg-cyan-500/10 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-white truncate">Hữu Thắng</div>
                    <div className="text-[9px] text-slate-400 truncate">Thành viên</div>
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] focus:shadow-[0_0_15px_rgba(225,29,72,0.35)] transition"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-2">
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
                    className="w-full bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-3 pr-12 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] focus:shadow-[0_0_15px_rgba(225,29,72,0.35)] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none text-xs font-semibold"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    className="text-[#FDA4AF] text-xs hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={loading}
                  className="font-bold shadow-[0_0_20px_rgba(225,29,72,0.45)]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="hourglass-spin text-sm">⏳</span>
                      <span>Đang xác thực...</span>
                    </div>
                  ) : (
                    'Đăng nhập'
                  )}
                </Button>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(192,132,252,0.15)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[rgba(18,14,28,0.9)] px-3 text-[#94A3B8] text-xs">
                  hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgba(10,8,18,0.8)] border border-[rgba(192,132,252,0.18)] rounded-xl text-xs sm:text-sm text-[#F8FAFC] hover:border-[rgba(192,132,252,0.4)] hover:bg-[rgba(192,132,252,0.1)] transition-all font-medium cursor-pointer"
              >
                <span className="text-rose-400 font-bold">G</span> Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgba(10,8,18,0.8)] border border-[rgba(192,132,252,0.18)] rounded-xl text-xs sm:text-sm text-[#F8FAFC] hover:border-[rgba(192,132,252,0.4)] hover:bg-[rgba(192,132,252,0.1)] transition-all font-medium cursor-pointer"
              >
                <span className="text-indigo-400 font-bold">f</span> Facebook
              </button>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-[#94A3B8] text-xs hover:text-[#F8FAFC] transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-[#F8FAFC] font-sans">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
