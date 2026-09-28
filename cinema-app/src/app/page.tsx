import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { prisma } from '@/lib/prisma';
import { movies as mockMovies } from '@/data/mockData';

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
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let allMovies: DisplayMovie[] = [];

  try {
    const rawDbMovies = await prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        screenings: {
          where: { status: 'UPCOMING' },
          orderBy: { startTime: 'asc' },
          take: 3,
        },
      },
    });

    if (rawDbMovies.length > 0) {
      allMovies = rawDbMovies.map(m => ({
        id: m.id,
        title: m.title,
        poster: m.poster,
        banner: m.trailer || m.poster,
        trailer: m.trailer,
        genre: m.genre,
        duration: m.duration,
        rating: Number(m.rating) || 4.5,
        ageRating: m.ageRating || 'P',
        ticketPrice: Number(m.ticketPrice) || 120000,
        description: m.description,
      }));
    }
  } catch (err) {
    console.warn('[HomePage] Could not load movies from DB, using fallback:', err);
  }

  // Bổ sung thêm các phim từ mockData nếu DB ít hơn 8 phim để giao diện rạp phim luôn phong phú
  if (allMovies.length < 8) {
    const existingTitles = new Set(allMovies.map(m => m.title.toLowerCase()));
    for (const m of mockMovies) {
      if (!existingTitles.has(m.title.toLowerCase())) {
        allMovies.push({
          id: m.id,
          title: m.title,
          poster: m.poster,
          banner: m.banner || m.poster,
          trailer: null,
          genre: Array.isArray(m.genre) ? m.genre.join(', ') : m.genre,
          duration: m.duration,
          rating: m.rating,
          ageRating: 'P',
          ticketPrice: m.ticketPrice,
          description: m.description,
        });
      }
    }
  }

  const heroMovie = allMovies.find(m => m.title.toLowerCase().includes('spider-man')) || allMovies[0];

  const heroBanner =
    heroMovie.trailer?.startsWith('http')
      ? heroMovie.trailer
      : heroMovie.banner ||
        heroMovie.poster ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&h=900&fit=crop';

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* 1. HERO BANNER SECTION (Responsive Header Showcase)      */}
        {/* ========================================================= */}
        <section className="relative min-h-[520px] md:h-[580px] flex items-center overflow-hidden border-b border-[#2D2D2D]">
          {/* Background Image with Cinematic Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
            style={{
              backgroundImage: `url(${heroBanner})`,
              filter: 'brightness(0.55)',
            }}
          />
          {/* Gradients to keep text readable while showing background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/75 to-transparent" />

          {/* Hero Content (2 columns: Left text, Right prominent 3D poster) */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-0 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {/* Cột trái: Thông tin phim & Action buttons */}
            <div className="max-w-2xl flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-[#E63946] text-white text-xs font-black tracking-wider uppercase shadow-md">
                  HOT NHẤT TUẦN
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-bold">
                  ★ {Number(heroMovie.rating || 4.8).toFixed(1)} / 5.0
                </span>
                <span className="text-slate-300 text-xs">• {heroMovie.duration} phút</span>
                {heroMovie.ageRating && (
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[11px] font-bold">
                    {heroMovie.ageRating}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-3 drop-shadow-lg">
                {heroMovie.title}
              </h1>

              <div className="text-sm font-semibold text-[#FFB703] mb-3 flex items-center gap-2">
                <span>🎭</span> <span>{heroMovie.genre}</span>
              </div>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3 max-w-xl">
                {heroMovie.description ||
                  'Khám phá trải nghiệm điện ảnh đỉnh cao tại Lumi Cinema với hệ thống máy chiếu Laser 4K và âm thanh vòm Dolby Atmos sống động nhất.'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={heroMovie.id ? `/movies/${heroMovie.id}` : '#showing'}
                  className="px-6 py-3.5 rounded-xl bg-[#E63946] hover:bg-[#C62B36] text-white font-bold text-sm sm:text-base transition-all shadow-xl hover:shadow-red-500/30 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <span>🎟️</span> Đặt Vé Ngay
                </Link>
                <Link
                  href={`/movies/${heroMovie.id}`}
                  className="px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm sm:text-base border border-slate-600 transition-all inline-flex items-center gap-2 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <span>🎬</span> Chi Tiết Phim
                </Link>
              </div>
            </div>

            {/* Cột phải: Poster 3D sáng đẹp, nổi bật rõ ràng */}
            <div className="flex-shrink-0 relative group">
              <div className="w-56 sm:w-64 md:w-72 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-[0_10px_40px_rgba(230,57,70,0.35)] relative transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_15px_50px_rgba(230,57,70,0.5)]">
                <img
                  src={heroMovie.poster}
                  alt={heroMovie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#E63946] text-white text-[11px] font-black tracking-wider uppercase shadow-md">
                    Chiếu Rạp IMAX Laser 4K
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. FILTER & MOVIE GRID SECTION (Responsive Web & Mobile)  */}
        {/* ========================================================= */}
        <section id="showing" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-[#E63946]/10 text-[#E63946] text-xs font-bold uppercase tracking-wider mb-2">
                Đang Chiếu Tại Rạp
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Phim Đang Khởi Chiếu
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              Cập nhật lịch chiếu mới nhất theo thời gian thực. Đặt trước chỗ ngồi ưng ý với giá vé ưu đãi.
            </p>
          </div>

          {/* Responsive Movie Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allMovies.map((movie) => {
              const genreText = Array.isArray(movie.genre)
                ? movie.genre.join(', ')
                : movie.genre || 'Hành động, Phiêu lưu';

              return (
                <div
                  key={movie.id}
                  className="group bg-[#1E1E1E] rounded-2xl overflow-hidden border border-[#2D2D2D] hover:border-[#E63946]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 flex flex-col"
                >
                  {/* Poster Image Container */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[#FFB703] font-bold text-xs">
                        ★ {Number(movie.rating || 4.5).toFixed(1)}
                      </span>
                      {movie.ageRating && (
                        <span className="px-2 py-0.5 rounded bg-[#E63946] text-white font-bold text-[10px]">
                          {movie.ageRating}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-slate-300 text-xs">
                      {movie.duration} phút
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-1.5 line-clamp-1">{genreText}</div>
                      <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-[#E63946] transition-colors line-clamp-1 mb-2">
                        {movie.title}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
                        {movie.description || 'Trải nghiệm điện ảnh công nghệ cao tại cụm rạp Lumi Cinema.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#2B2B2B] flex items-center justify-between gap-2">
                      <div className="text-sm font-black text-[#FFB703]">
                        {Number(movie.ticketPrice || 120000).toLocaleString('vi-VN')} đ
                      </div>
                      <Link
                        href={`/movies/${movie.id}`}
                        className="px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#C62B36] text-white text-xs font-bold transition-all shadow-md active:scale-95"
                        style={{ textDecoration: 'none' }}
                      >
                        Đặt Vé
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. WHY CHOOSE LUMI CINEMA (Feature Highlights)            */}
        {/* ========================================================= */}
        <section className="bg-[#181818] border-y border-[#262626] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Trải Nghiệm Điện Ảnh Đẳng Cấp
              </h2>
              <p className="text-slate-400 text-sm">
                Lumi Cinema mang đến hệ thống phòng chiếu hiện đại và dịch vụ tận tâm nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-[#2D2D2D] text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-2xl">
                  🎬
                </div>
                <h3 className="font-bold text-white text-base mb-2">Laser 4K & IMAX</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Hình ảnh siêu sắc nét, độ tương phản ấn tượng với màn chiếu công nghệ laser hiện đại.
                </p>
              </div>

              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-[#2D2D2D] text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center text-2xl">
                  🔊
                </div>
                <h3 className="font-bold text-white text-base mb-2">Dolby Atmos Đa Chiều</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Âm thanh vòm vòm chuyển động chân thực, bao trùm toàn bộ không gian phòng chiếu.
                </p>
              </div>

              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-[#2D2D2D] text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <h3 className="font-bold text-white text-base mb-2">Đặt Vé Trong 30 Giây</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Giữ ghế thời gian thực, thanh toán VNPay tiện lợi và nhận mã QR qua email tức thì.
                </p>
              </div>

              <div className="bg-[#1F1F1F] p-6 rounded-2xl border border-[#2D2D2D] text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-2xl">
                  🎁
                </div>
                <h3 className="font-bold text-white text-base mb-2">Bồi Hoàn 100% Tự Động</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Chính sách bảo vệ khách hàng (UC-15): Cấp voucher đền bù tức thì khi xảy ra sự cố rạp.
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
