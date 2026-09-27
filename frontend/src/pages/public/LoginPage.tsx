import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';

interface LoginPageProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      {/* Left visual */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=1000&fit=crop&auto=format"
          alt="Cinema"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/20 to-[#1A1A1A]/80" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E63946] rounded-xl flex items-center justify-center text-white font-black text-xl">
              L
            </div>
            <span className="font-black text-2xl text-white">LUMI <span className="text-[#E63946]">CINEMA</span></span>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            Trải nghiệm điện ảnh<br />đỉnh cao cùng chúng tôi
          </h2>
          <p className="text-[#B3B3B3] text-sm max-w-sm">
            Đặt vé nhanh chóng, chọn ghế linh hoạt, thanh toán an toàn. Hệ thống rạp phim hiện đại nhất Việt Nam.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#E63946] rounded-lg flex items-center justify-center text-white font-black">
              L
            </div>
            <span className="font-black text-xl text-white">LUMI <span className="text-[#E63946]">CINEMA</span></span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Đăng nhập</h1>
          <p className="text-[#B3B3B3] text-sm mb-8">
            Chưa có tài khoản?{' '}
            <button onClick={() => onNavigate('signup')} className="text-[#E63946] hover:underline font-medium" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Đăng ký ngay
            </button>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[#B3B3B3] text-sm font-medium mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button type="button" className="text-[#0088FF] text-xs hover:underline" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#404040]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#1A1A1A] px-3 text-[#B3B3B3] text-xs">hoặc tiếp tục với</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D2D2D] border border-[#404040] rounded-lg text-sm text-white hover:bg-[#383838] transition-colors font-medium"
              style={{ cursor: 'pointer' }}
            >
              <span>🌐</span> Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D2D2D] border border-[#404040] rounded-lg text-sm text-white hover:bg-[#383838] transition-colors font-medium"
              style={{ cursor: 'pointer' }}
            >
              <span>📘</span> Facebook
            </button>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="mt-6 w-full text-center text-[#B3B3B3] text-sm hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
