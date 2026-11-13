import Link from 'next/link';

export default function Footer() {
  const exploreLinks = [
    { label: 'Phim đang chiếu', href: '/#showing' },
    { label: 'Lịch chiếu hôm nay', href: '/#showing' },
    { label: 'Vé của tôi', href: '/tickets' },
    { label: 'Đặc quyền thành viên', href: '/#showing' },
  ];

  return (
    <footer className="bg-[#050508] border-t border-[rgba(192,132,252,0.15)] mt-20 relative overflow-hidden">
      {/* Màn mây tinh vân nền đáy */}
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-[#581C87]/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E11D48] to-[#581C87] border border-rose-500/40 flex items-center justify-center text-[#F8FAFC] font-black text-sm shadow-[0_0_12px_rgba(225,29,72,0.4)]">
                ✦
              </div>
              <span className="font-black text-xl text-[#F8FAFC]">
                LUMI <span className="bg-gradient-to-r from-[#E11D48] via-[#C084FC] to-[#FDA4AF] bg-clip-text text-transparent">CINEMA</span>
              </span>
            </div>
            <p className="text-[#94A3B8] text-sm leading-relaxed max-w-sm">
              Trải nghiệm điện ảnh thiên hà đỉnh cao tại Lumi Cinema. Công nghệ máy chiếu Laser 4K và âm thanh vòm Dolby Atmos đa chiều mang đến cảm xúc chân thực nhất.
            </p>
            <div className="flex gap-2.5 mt-5">
              {['Facebook', 'YouTube', 'Instagram', 'TikTok'].map(s => (
                <div
                  key={s}
                  className="px-3 py-1.5 bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.18)] rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[rgba(192,132,252,0.4)] hover:shadow-[0_0_10px_rgba(88,28,135,0.3)] cursor-pointer transition-all text-xs font-semibold"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[#F8FAFC] font-bold text-sm mb-4 tracking-wide">
              ✦ Khám Phá
            </h4>
            <ul className="space-y-2.5">
              {exploreLinks.map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[#94A3B8] hover:text-[#F8FAFC] text-sm cursor-pointer transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#F8FAFC] font-bold text-sm mb-4 tracking-wide">
              ✦ Thông Tin Liên Hệ
            </h4>
            <ul className="space-y-2.5 text-sm text-[#94A3B8]">
              <li className="leading-relaxed">
                <span className="text-[#F8FAFC] font-medium block">Địa chỉ:</span>
                123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
              </li>
              <li>
                <span className="text-[#F8FAFC] font-medium mr-1.5">Hotline:</span>
                <span className="text-[#FDA4AF] font-bold">1900 6789</span>
              </li>
              <li>
                <span className="text-[#F8FAFC] font-medium mr-1.5">Email:</span>
                support@lumicinema.vn
              </li>
              <li>
                <span className="text-[#F8FAFC] font-medium mr-1.5">Giờ mở cửa:</span>
                08:00 – 24:00 hàng ngày
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[rgba(192,132,252,0.12)] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © 2026 Lumi Cinema Galactic Theme. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/" className="hover:text-[#F8FAFC] cursor-pointer transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/" className="hover:text-[#F8FAFC] cursor-pointer transition-colors">
              Điều khoản dịch vụ
            </Link>
            <Link href="/" className="hover:text-[#F8FAFC] cursor-pointer transition-colors">
              Liên hệ hợp tác
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
