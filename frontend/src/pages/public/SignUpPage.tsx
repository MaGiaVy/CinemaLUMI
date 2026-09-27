import { useState, ChangeEvent, FormEvent } from 'react';
import Button from '@/components/ui/Button';

interface SignUpPageProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

export default function SignUpPage({ onLogin, onNavigate }: SignUpPageProps) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 800);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#E63946] rounded-lg flex items-center justify-center text-white font-black">
            L
          </div>
          <span className="font-black text-xl text-white">LUMI <span className="text-[#E63946]">CINEMA</span></span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Tạo tài khoản</h1>
        <p className="text-[#B3B3B3] text-sm mb-8">
          Đã có tài khoản?{' '}
          <button onClick={() => onNavigate('login')} className="text-[#E63946] hover:underline font-medium" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Đăng nhập
          </button>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Họ và tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn An"
              value={form.fullName}
              onChange={set('fullName')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0901234567"
                value={form.phone}
                onChange={set('phone')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">
              Mật khẩu <span className="text-[#525252] font-normal">(tối thiểu 6 ký tự)</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Xác nhận mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={set('confirm')}
              required
            />
            {form.confirm && form.password !== form.confirm && (
              <p className="text-[#E63946] text-xs mt-1">Mật khẩu không khớp</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 flex-shrink-0"
              style={{ width: 'auto' }}
            />
            <span className="text-[#B3B3B3] text-sm">
              Tôi đồng ý với{' '}
              <span className="text-[#0088FF] hover:underline cursor-pointer">Điều khoản sử dụng</span>
              {' '}và{' '}
              <span className="text-[#0088FF] hover:underline cursor-pointer">Chính sách bảo mật</span>
              {' '}của Lumi Cinema
            </span>
          </label>

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={loading || !agreed || form.password !== form.confirm}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </Button>
        </form>

        <button
          onClick={() => onNavigate('home')}
          className="mt-6 w-full text-center text-[#B3B3B3] text-sm hover:text-white transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Quay về trang chủ
        </button>
      </div>
    </div>
  );
}
