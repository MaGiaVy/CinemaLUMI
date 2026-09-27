'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/login';
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#2D2D2D] border border-[#404040] rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 bg-[#E63946] rounded-xl flex items-center justify-center text-white font-black text-xl">
            L
          </div>
          <span className="font-black text-2xl text-white">LUMI <span className="text-[#E63946]">CINEMA</span></span>
        </div>

        <h1 className="text-2xl font-black text-white text-center mb-1">Đăng Ký Tài Khoản</h1>
        <p className="text-[#B3B3B3] text-xs text-center mb-6">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-[#E63946] hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-xs font-semibold mb-1">Họ và tên</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-white text-xs font-semibold mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@lumi.vn"
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-white text-xs font-semibold mb-1">Số điện thoại</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-white text-xs font-semibold mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full bg-[#1A1A1A] border border-[#404040] rounded-lg px-4 py-2.5 text-white text-sm"
            />
          </div>

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#B3B3B3] hover:text-white">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
