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

    // 1. Kiểm tra đầu vào phía Client
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
      // 2. Gửi request POST tới /api/auth/signup
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

      // 3. Xử lý lỗi (email trùng hoặc validate thất bại từ server)
      if (!res.ok || !data.success) {
        showToast(data.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
        setLoading(false);
        return;
      }

      // 4. Đăng ký thành công -> Thông báo Toast và chuyển hướng sang /login
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

      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md bg-[#2D2D2D]/60 border border-[#404040] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-[#E63946] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
              L
            </div>
            <span className="font-black text-2xl text-white tracking-wide">
              LUMI <span className="text-[#E63946]">CINEMA</span>
            </span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Tạo tài khoản</h1>
          <p className="text-[#B3B3B3] text-sm mb-6">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-[#E63946] hover:underline font-semibold"
            >
              Đăng nhập ngay
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                Họ và tên <span className="text-[#E63946]">*</span>
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn An"
                value={form.fullName}
                onChange={setField('fullName')}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                  Email <span className="text-[#E63946]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={setField('email')}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={setField('phone')}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                Mật khẩu <span className="text-[#E63946]">*</span>{' '}
                <span className="text-[#737373] text-xs font-normal">
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
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-1.5">
                Xác nhận mật khẩu <span className="text-[#E63946]">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={setField('confirm')}
                required
                disabled={loading}
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-[#E63946] text-xs mt-1 font-medium">
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
                className="mt-1 h-4 w-4 rounded accent-[#E63946] cursor-pointer"
                style={{ width: 'auto' }}
              />
              <span className="text-[#B3B3B3] text-xs leading-relaxed">
                Tôi đồng ý với{' '}
                <span className="text-[#0088FF] hover:underline cursor-pointer">
                  Điều khoản sử dụng
                </span>{' '}
                và{' '}
                <span className="text-[#0088FF] hover:underline cursor-pointer">
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
            >
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[#B3B3B3] text-sm hover:text-white transition-colors"
            >
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
