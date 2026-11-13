'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Toast, { ToastMessage } from '@/components/ui/Toast';

export default function SignUpPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const setField = (key: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc', 'warning');
      return;
    }

    if (form.password.length < 6) {
      showToast('Mật khẩu phải có tối thiểu 6 ký tự', 'error');
      return;
    }

    if (form.password !== form.confirm) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    if (!agreed) {
      showToast('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật', 'warning');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
        setLoading(false);
        return;
      }

      showToast(
        data.message || 'Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...',
        'success'
      );

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (_err) {
      showToast('Lỗi kết nối máy chủ. Vui lòng thử lại sau.', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex items-center justify-center p-6 md:p-8 font-sans selection:bg-[#E11D48] selection:text-white relative overflow-hidden">
        {/* Tinh vân nền */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#581C87]/25 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#881337]/25 rounded-full blur-[130px] pointer-events-none" />

        <div className="w-full max-w-md bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.22)] rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#E11D48] to-[#581C87] rounded-xl flex items-center justify-center text-white font-black text-base shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-500/30">
              ✦
            </div>
            <span className="font-black text-2xl text-white tracking-wide">
              LUMI <span className="bg-gradient-to-r from-[#E11D48] via-[#C084FC] to-[#FDA4AF] bg-clip-text text-transparent">CINEMA</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mb-2 tracking-tight">
            Tạo tài khoản
          </h1>
          <p className="text-[#94A3B8] text-sm mb-6">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-[#FDA4AF] hover:underline font-semibold"
            >
              Đăng nhập ngay
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                Họ và tên <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn An"
                value={form.fullName}
                onChange={setField('fullName')}
                required
                disabled={loading}
                className="w-full bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] focus:shadow-[0_0_15px_rgba(225,29,72,0.35)] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Email <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={setField('email')}
                  required
                  disabled={loading}
                  className="w-full bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] focus:shadow-[0_0_15px_rgba(225,29,72,0.35)] transition"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={setField('phone')}
                  disabled={loading}
                  className="w-full bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] focus:shadow-[0_0_15px_rgba(225,29,72,0.35)] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                Mật khẩu <span className="text-[#E11D48]">*</span>{' '}
                <span className="text-slate-500 text-xs font-normal lowercase">
                  (tối thiểu 6 ký tự)
                </span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={setField('password')}
                minLength={6}
                required
                disabled={loading}
                className="w-full bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] focus:shadow-[0_0_15px_rgba(225,29,72,0.35)] transition"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                Xác nhận mật khẩu <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={setField('confirm')}
                required
                disabled={loading}
                className="w-full bg-[rgba(10,8,18,0.9)] border border-[rgba(192,132,252,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#E11D48] focus:shadow-[0_0_15px_rgba(225,29,72,0.35)] transition"
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-rose-400 text-xs mt-1 font-medium">
                  Mật khẩu xác nhận không khớp
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded accent-[#E11D48] cursor-pointer"
                style={{ width: 'auto' }}
              />
              <span className="text-[#94A3B8] text-xs leading-relaxed">
                Tôi đồng ý với{' '}
                <span className="text-[#FDA4AF] hover:underline cursor-pointer">
                  Điều khoản sử dụng
                </span>{' '}
                và{' '}
                <span className="text-[#FDA4AF] hover:underline cursor-pointer">
                  Chính sách bảo mật
                </span>{' '}
                của Lumi Cinema.
              </span>
            </label>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading || !agreed || (form.confirm.length > 0 && form.password !== form.confirm)}
              className="font-bold shadow-[0_0_20px_rgba(225,29,72,0.45)] mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="hourglass-spin text-sm">⏳</span>
                  <span>Đang tạo tài khoản...</span>
                </div>
              ) : (
                'Tạo tài khoản'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[#94A3B8] text-xs hover:text-[#F8FAFC] transition-colors"
            >
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
