import Link from 'next/link';

export default function Footer() {
  const exploreLinks = [
    { label: 'Phim đang chiếu', href: '/#showing' },
    { label: 'Phim sắp chiếu', href: '/#upcoming' },
    { label: 'Lịch chiếu hôm nay', href: '/schedule' },
    { label: 'Ưu đãi đặc biệt', href: '/#promotions' },
  ];

  return (
    <footer className="bg-[#1E1E1E] border-t border-[#404040] mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#E63946] rounded-lg flex items-center justify-center text-white font-black text-lg">
                L
              </div>
              <span className="font-black text-xl text-white">LUMI <span className="text-[#E63946]">CINEMA</span></span>
            </div>
            <p className="text-[#B3B3B3] text-sm leading-relaxed max-w-xs">
              Trải nghiệm điện ảnh đỉnh cao tại Lumi Cinema. Công nghệ âm thanh & hình ảnh tiên tiến nhất Việt Nam.
            </p>
            <div className="flex gap-3 mt-4">
              {['f', 'in', 'tw', 'yt'].map(s => (
                <div key={s} className="w-9 h-9 bg-[#2D2D2D] border border-[#404040] rounded-lg flex items-center justify-center text-[#B3B3B3] hover:text-white hover:border-[#525252] cursor-pointer transition-colors text-xs font-bold uppercase">
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Khám phá</h4>
            <ul className="space-y-2">
              {exploreLinks.map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[#B3B3B3] hover:text-white text-sm cursor-pointer transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-[#B3B3B3]">
              <li>📍 123 Nguyễn Huệ, Q.1, TP.HCM</li>
              <li>📞 1900 6789</li>
              <li>✉️ support@lumicinema.vn</li>
              <li>🕐 08:00 – 24:00 hàng ngày</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#404040] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#B3B3B3] text-xs">© 2026 Lumi Cinema. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4 text-xs text-[#B3B3B3]">
            <Link href="/privacy" className="hover:text-white cursor-pointer transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-white cursor-pointer transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/contact" className="hover:text-white cursor-pointer transition-colors">
              Liên hệ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
