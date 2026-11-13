import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CockpitBookingBar, { CockpitMovie } from '@/components/ui/CockpitBookingBar';
import { prisma } from '@/lib/prisma';

interface DisplayMovie {
  id: string | number;
  title: string;
  poster: string;
  banner?: string | null;
  trailer?: string | null;
  genre: string;
  duration: number;
  rating: number;
  ageRating?: string;
  ticketPrice?: number;
  description?: string | null;
  screenings?: Array<{
    id: number;
    room: string;
    date: string;
    startTime: string;
    price: number;
  }>;
}

export const dynamic = 'force-dynamic';

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('.mp4') ||
    lower.includes('.webm')
  );
}

const DEFAULT_HERO_MOVIE: DisplayMovie = {
  id: '',
  title: 'Lumi Cinema - Trải Nghiệm Điện Ảnh Vũ Trụ',
  poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=1200&fit=crop&auto=format',
  banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&h=900&fit=crop&auto=format',
  trailer: null,
  genre: 'Hành động, Phiêu lưu, Khoa học viễn tưởng',
  duration: 120,
  rating: 4.9,
  ageRating: 'P',
  ticketPrice: 120000,
  description: 'Khám phá trải nghiệm điện ảnh đỉnh cao tại Lumi Cinema với hệ thống máy chiếu Laser 4K vô cực và âm thanh vòm Dolby Atmos sống động nhất.',
  screenings: [],
};

export default async function HomePage() {
  let allMovies: DisplayMovie[] = [];

  try {
    const rawDbMovies = await prisma.movie.findMany({
      where: {
        isDeleted: false,
        status: { in: ['SHOWING', 'UPCOMING'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        screenings: {
          where: { status: 'UPCOMING' },
          orderBy: { startTime: 'asc' },
          take: 6,
        },
      },
    });

    if (rawDbMovies.length > 0) {
      allMovies = rawDbMovies.map((m) => {
        const validBanner = m.trailer && !isVideoUrl(m.trailer) ? m.trailer : m.poster;
        return {
          id: m.id,
          title: m.title,
          poster: m.poster,
          banner: validBanner,
          trailer: m.trailer,
          genre: m.genre,
          duration: m.duration,
          rating: Number(m.rating) || 4.8,
          ageRating: m.ageRating || 'P',
          ticketPrice: Number(m.ticketPrice) || 120000,
          description: m.description,
          screenings: m.screenings.map(s => ({
            id: s.id,
            room: s.room,
            date: s.date.toISOString(),
            startTime: s.startTime.toISOString(),
            price: Number(s.price),
          })),
        };
      });
    }
  } catch (err) {
    console.error('[HomePage] Error loading movies from DB:', err);
  }

  const heroMovie =
    allMovies.find((m) => m.title.toLowerCase().includes('spider-man')) || allMovies[0] || DEFAULT_HERO_MOVIE;

  const heroBanner =
    heroMovie?.trailer && !isVideoUrl(heroMovie.trailer) && heroMovie.trailer.startsWith('http')
      ? heroMovie.trailer
      : (!isVideoUrl(heroMovie?.banner) && heroMovie?.banner) ||
        heroMovie?.poster ||
        DEFAULT_HERO_MOVIE.banner!;

  const cockpitMovies: CockpitMovie[] = allMovies.map(m => ({
    id: m.id,
    title: m.title,
    poster: m.poster,
    ageRating: m.ageRating,
    screenings: m.screenings,
  }));

  return (
    <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#E11D48] selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* 1. HERO BANNER SECTION (Hero Cinema Showcase)            */}
        {/* ========================================================= */}
        <section className="relative min-h-[580px] md:h-[640px] flex items-center overflow-hidden border-b border-[rgba(192,132,252,0.12)]">
          {/* Mây Tinh Vân Đa Tầng Nền (Multi-layered Nebula Atmosphere) */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
            style={{
              backgroundImage: `url(${heroBanner})`,
              filter: 'brightness(0.35) saturate(1.2)',
            }}
          />
          {/* Tinh vân tím & đỏ lan tỏa */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#581C87]/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#881337]/25 rounded-full blur-[90px] pointer-events-none" />

          {/* Gradients chuyển màu mềm mại vào nền OLED */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/85 to-transparent" />

          {/* Hero Content (Asymmetric 1.25 : 0.75 Grid) */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-0 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-14 z-10">
            {/* Cột trái: Nội Dung Phim Tiêu Điểm */}
            <div className="max-w-2xl flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#E11D48] to-[#881337] text-white text-[11px] font-black tracking-widest uppercase shadow-[0_0_12px_rgba(225,29,72,0.6)]">
                  ✦ CÔNG NGHỆ CHIẾU VŨ TRỤ 4K · DOLBY ATMOS
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[rgba(18,14,28,0.7)] border border-[rgba(192,132,252,0.3)] text-[#FDA4AF] text-xs font-bold">
                  ★ {Number(heroMovie.rating || 4.9).toFixed(1)} / 5.0
                </span>
                <span className="text-[#94A3B8] text-xs">• {heroMovie.duration} phút</span>
                {heroMovie.ageRating && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                    {heroMovie.ageRating}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#F8FAFC] leading-tight tracking-tight mb-3.5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                {heroMovie.title}
              </h1>

              <div className="text-xs sm:text-sm font-semibold text-[#C084FC] mb-4 flex items-center gap-2">
                <span>✦</span>
                <span>{heroMovie.genre}</span>
              </div>

              <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed mb-7 line-clamp-3 max-w-xl">
                {heroMovie.description ||
                  'Khám phá trải nghiệm điện ảnh đỉnh cao tại Lumi Cinema với hệ thống máy chiếu Laser 4K vô cực và âm thanh vòm Dolby Atmos sống động nhất.'}
              </p>

              {/* Cặp nút hành động phong cách Cosmic */}
              <div className="flex flex-wrap items-center gap-3.5">
                <Link
                  href={heroMovie.id ? `/movies/${heroMovie.id}` : '#showing'}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#881337] hover:from-[#F43F5E] hover:to-[#9F1239] text-[#F8FAFC] font-bold text-sm sm:text-base transition-all shadow-[0_0_25px_rgba(225,29,72,0.6)] border border-rose-500/40 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Đặt Vé Không Gian</span>
                  <span className="text-sm font-bold">→</span>
                </Link>
                <Link
                  href={heroMovie.id ? `/movies/${heroMovie.id}` : '#showing'}
                  className="px-5 py-3.5 rounded-xl bg-[rgba(18,14,28,0.7)] hover:bg-[rgba(30,24,48,0.85)] text-[#F8FAFC] font-semibold text-sm sm:text-base border border-[rgba(192,132,252,0.25)] hover:border-[rgba(192,132,252,0.45)] transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer backdrop-blur-md"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Chi Tiết Phim</span>
                </Link>
              </div>
            </div>

            {/* Cột phải: Poster Bay Lơ Lửng với Vòng Hào Quang Tinh Vân (Nebula Aurora Ring) */}
            <div className="flex-shrink-0 relative group">
              {/* Vòng hào quang chuyển màu */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#E11D48] via-[#581C87] to-[#C084FC] rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition duration-700 animate-pulse pointer-events-none" />

              <div className="w-56 sm:w-64 md:w-72 aspect-[2/3] rounded-2xl overflow-hidden border border-[rgba(192,132,252,0.35)] shadow-[0_15px_50px_rgba(88,28,135,0.4)] relative transform transition-all duration-500 group-hover:scale-[1.03]">
                <img
                  src={heroMovie.poster}
                  alt={heroMovie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/85 via-transparent to-transparent opacity-90" />
                
                {/* Huy hiệu nổi bật */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-[rgba(8,6,14,0.8)] backdrop-blur-md border border-[rgba(192,132,252,0.3)] text-[#FDA4AF] text-[10px] font-black tracking-widest uppercase">
                    ✦ ORBITAL LASER
                  </span>
                </div>

                <div className="absolute bottom-3.5 left-3 right-3 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-[#E11D48] to-[#581C87] text-[#F8FAFC] text-[11px] font-black tracking-wider uppercase shadow-md border border-rose-500/30">
                    Phòng Chiếu Không Gian 4K
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. COCKPIT QUICK BOOKING BAR (Buồng Lái Đặt Vé Nhanh)     */}
        {/* ========================================================= */}
        {cockpitMovies.length > 0 && (
          <CockpitBookingBar movies={cockpitMovies} />
        )}

        {/* ========================================================= */}
        {/* 3. NOW SHOWING NEBULA GRID (Lưới Phim Đang Chiếu)         */}
        {/* ========================================================= */}
        <section id="showing" className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-widest mb-2.5">
                ✦ PHIM ĐANG KHỞI CHIẾU
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#F8FAFC] tracking-tight">
                Thiên Hà Điện Ảnh Đang Chiếu
              </h2>
            </div>
            <p className="text-[#94A3B8] text-sm max-w-md">
              Cập nhật lịch chiếu thời gian thực từ hệ thống rạp Lumi Cinema. Đặt trước chỗ ngồi với công nghệ giữ vé tức thời.
            </p>
          </div>

          {/* Lưới thẻ phim Cosmic Film Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allMovies.length === 0 ? (
              <div className="col-span-full py-16 text-center text-[#94A3B8] bg-[rgba(18,14,28,0.5)] rounded-2xl border border-[rgba(192,132,252,0.15)]">
                <p className="text-lg font-medium text-[#F8FAFC] mb-2">Chưa có phim nào đang khởi chiếu</p>
                <p className="text-sm text-slate-400">Vui lòng quay lại sau để cập nhật lịch chiếu mới nhất từ cụm rạp.</p>
              </div>
            ) : (
              allMovies.map((movie) => {
                const genreText = Array.isArray(movie.genre)
                  ? movie.genre.join(', ')
                  : movie.genre || 'Hành động, Viễn tưởng';

                return (
                  <div
                    key={movie.id}
                    className="group bg-[rgba(18,14,28,0.65)] rounded-2xl overflow-hidden border border-[rgba(192,132,252,0.18)] hover:border-[rgba(192,132,252,0.45)] hover:shadow-[0_8px_30px_rgba(88,28,135,0.4)] transition-all duration-300 flex flex-col backdrop-blur-xl"
                  >
                    {/* Poster chuẩn tỷ lệ 2:3 */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0A0812]">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,14,28,0.95)] via-transparent to-transparent opacity-60" />

                      {/* Nhãn tuổi cố định góc trên trái */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {movie.ageRating && (
                          <span className="px-2 py-0.5 rounded-md bg-[#E11D48] text-white font-bold text-[10px] tracking-wider shadow-md">
                            {movie.ageRating}
                          </span>
                        )}
                      </div>

                      {/* Điểm đánh giá góc dưới phải */}
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-[rgba(10,8,18,0.85)] border border-[rgba(192,132,252,0.25)] text-[#FDA4AF] font-bold text-xs backdrop-blur-md">
                        ★ {Number(movie.rating || 4.8).toFixed(1)}
                      </div>

                      {/* Thời lượng */}
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-[rgba(10,8,18,0.7)] text-[#94A3B8] text-xs backdrop-blur-md">
                        {movie.duration} phút
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-[#94A3B8] mb-1.5 line-clamp-1">{genreText}</div>
                        <h3 className="font-extrabold text-base text-[#F8FAFC] group-hover:text-[#FDA4AF] transition-colors line-clamp-1 mb-2">
                          {movie.title}
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
                          {movie.description || 'Trải nghiệm điện ảnh đỉnh cao tại cụm rạp Lumi Cinema.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[rgba(192,132,252,0.12)] flex items-center justify-between gap-2">
                        <div className="text-sm font-black text-[#F8FAFC]">
                          {Number(movie.ticketPrice || 120000).toLocaleString('vi-VN')} đ
                        </div>
                        <Link
                          href={`/movies/${movie.id}`}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#881337] hover:from-[#F43F5E] hover:to-[#9F1239] text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(225,29,72,0.35)] active:scale-95 border border-rose-500/30"
                          style={{ textDecoration: 'none' }}
                        >
                          Đặt Vé Nhanh
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. COSMIC VALUE PILLARS (Băng 4 Trụ Cột Công Nghệ Lumi)   */}
        {/* ========================================================= */}
        <section className="bg-[rgba(10,8,18,0.7)] border-t border-[rgba(192,132,252,0.15)] py-14 md:py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold tracking-widest uppercase text-[#FDA4AF] block mb-2">
                ✦ TIÊU CHUẨN ĐIỆN ẢNH VŨ TRỤ
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mb-3">
                Trụ Cột Trải Nghiệm Lumi Cinema
              </h2>
              <p className="text-[#94A3B8] text-sm">
                Được đầu tư bài bản theo tiêu chuẩn quốc tế, mang lại không gian giải trí đỉnh cao và sự an tâm tuyệt đối cho khách hàng.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pillar 1 */}
              <div className="bg-[rgba(18,14,28,0.65)] p-6 rounded-2xl border border-[rgba(192,132,252,0.2)] text-left backdrop-blur-xl hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(225,29,72,0.2)] transition-all">
                <div className="w-10 h-10 mb-4 bg-gradient-to-tr from-[#E11D48] to-[#581C87] text-[#F8FAFC] rounded-xl flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(225,29,72,0.4)]">
                  ✦
                </div>
                <h3 className="font-bold text-[#F8FAFC] text-base mb-2">Laser 4K Siêu Sắc Nét</h3>
                <p className="text-[#94A3B8] text-xs leading-relaxed">
                  Độ tương phản vô cực chuẩn dải ngân hà với máy chiếu laser thế hệ mới nhất.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-[rgba(18,14,28,0.65)] p-6 rounded-2xl border border-[rgba(192,132,252,0.2)] text-left backdrop-blur-xl hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(88,28,135,0.2)] transition-all">
                <div className="w-10 h-10 mb-4 bg-gradient-to-tr from-[#581C87] to-[#881337] text-[#F8FAFC] rounded-xl flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(88,28,135,0.4)]">
                  ✦
                </div>
                <h3 className="font-bold text-[#F8FAFC] text-base mb-2">Dolby Atmos Đa Chiều</h3>
                <p className="text-[#94A3B8] text-xs leading-relaxed">
                  Âm thanh vòm bao bọc 360 độ không gian phòng chiếu, đưa người xem vào trung tâm thước phim.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-[rgba(18,14,28,0.65)] p-6 rounded-2xl border border-[rgba(192,132,252,0.2)] text-left backdrop-blur-xl hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all">
                <div className="w-10 h-10 mb-4 bg-gradient-to-tr from-[#881337] to-[#E11D48] text-[#F8FAFC] rounded-xl flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(225,29,72,0.4)]">
                  ✦
                </div>
                <h3 className="font-bold text-[#F8FAFC] text-base mb-2">Đặt Vé Trong 30 Giây</h3>
                <p className="text-[#94A3B8] text-xs leading-relaxed">
                  Giữ chỗ tức thời 10 phút, thanh toán ZaloPay Sandbox tiện lợi và an toàn tuyệt đối.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="bg-[rgba(18,14,28,0.65)] p-6 rounded-2xl border border-[rgba(192,132,252,0.2)] text-left backdrop-blur-xl hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all">
                <div className="w-10 h-10 mb-4 bg-gradient-to-tr from-[#581C87] to-[#C084FC] text-[#F8FAFC] rounded-xl flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(192,132,252,0.4)]">
                  ✦
                </div>
                <h3 className="font-bold text-[#F8FAFC] text-base mb-2">Bồi Hoàn Tự Động</h3>
                <p className="text-[#94A3B8] text-xs leading-relaxed">
                  Chính sách bảo vệ khách hàng tự động: Cấp voucher đền bù tức thì nếu xảy ra sự cố rạp chiếu.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
