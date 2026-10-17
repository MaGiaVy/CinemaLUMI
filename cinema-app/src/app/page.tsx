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
      select: {
        id: true,
        title: true,
        poster: true,
        trailer: true,
        genre: true,
        duration: true,
        rating: true,
        ageRating: true,
        ticketPrice: true,
        description: true,
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
                <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold">
                  ★ {Number(heroMovie.rating || 4.8).toFixed(1)} / 5.0
                </span>
                <span className="text-slate-300 text-xs">{heroMovie.duration} phút</span>
                {heroMovie.ageRating && (
                  <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold">
                    {heroMovie.ageRating}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-2">
                {heroMovie.title}
              </h1>

              <div className="text-sm text-slate-300 mb-3">
                {heroMovie.genre}
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-3 max-w-xl">
                {heroMovie.description ||
                  'Khám phá trải nghiệm điện ảnh tại CinemaLUMI với hệ thống phòng chiếu hiện đại và âm thanh sống động.'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={heroMovie.id ? `/movies/${heroMovie.id}` : '#showing'}
                  className="px-6 py-3 rounded-lg bg-[#E63946] hover:bg-[#C62B36] text-white font-semibold text-sm transition-colors cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Đặt vé ngay
                </Link>
                <Link
                  href={`/movies/${heroMovie.id}`}
                  className="px-5 py-3 rounded-lg bg-[#2D2D2D] hover:bg-[#383838] text-white font-medium text-sm border border-[#404040] transition-colors cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Chi tiết phim
                </Link>
              </div>
            </div>

            {/* Cột phải: Poster */}
            <div className="flex-shrink-0 relative">
              <div className="w-56 sm:w-64 md:w-72 aspect-[2/3] rounded-xl overflow-hidden border border-[#404040] shadow-xl relative">
                <img
                  src={heroMovie.poster}
                  alt={heroMovie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. FILTER & MOVIE GRID SECTION (Responsive Web & Mobile)  */}
        {/* ========================================================= */}
        <section id="showing" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Phim đang chiếu
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Lịch chiếu và thông tin các bộ phim tại CinemaLUMI
              </p>
            </div>
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
                  className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] hover:border-[#404040] transition-colors flex flex-col"
                >
                  {/* Poster Image Container */}
                  <Link href={`/movies/${movie.id}`} className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 block">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded bg-black/80 text-amber-400 font-semibold text-xs">
                        ★ {Number(movie.rating || 4.5).toFixed(1)}
                      </span>
                      {movie.ageRating && (
                        <span className="px-1.5 py-0.5 rounded bg-[#E63946] text-white font-bold text-[10px]">
                          {movie.ageRating}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 text-slate-300 text-xs">
                      {movie.duration} phút
                    </div>
                  </Link>

                  {/* Movie Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-1 line-clamp-1">{genreText}</div>
                      <Link href={`/movies/${movie.id}`}>
                        <h3 className="font-bold text-base text-white hover:text-[#E63946] transition-colors line-clamp-1 mb-2">
                          {movie.title}
                        </h3>
                      </Link>
                      {movie.description && (
                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">
                          {movie.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#2B2B2B] flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-amber-400">
                        {Number(movie.ticketPrice || 120000).toLocaleString('vi-VN')} đ
                      </div>
                      <Link
                        href={`/movies/${movie.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-[#E63946] hover:bg-[#C62B36] text-white text-xs font-semibold transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        Đặt vé
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. CINEMA GUIDELINES SECTION                               */}
        {/* ========================================================= */}
        <section className="bg-[#181818] border-t border-[#262626] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Quy định đặt vé & dịch vụ rạp
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1F1F1F] p-5 rounded-xl border border-[#2D2D2D]">
                <h3 className="font-semibold text-white text-sm mb-1.5">1. Đặt vé trực tuyến</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ghế được giữ chỗ trong 10 phút. Hỗ trợ thanh toán nhanh qua VNPAY và MoMo với mã QR xác nhận gửi về tài khoản.
                </p>
              </div>

              <div className="bg-[#1F1F1F] p-5 rounded-xl border border-[#2D2D2D]">
                <h3 className="font-semibold text-white text-sm mb-1.5">2. Chính sách hủy vé</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Khách hàng chủ động hủy vé trước giờ chiếu ít nhất 2 tiếng sẽ nhận voucher giảm 50% áp dụng cho lần mua tiếp theo.
                </p>
              </div>

              <div className="bg-[#1F1F1F] p-5 rounded-xl border border-[#2D2D2D]">
                <h3 className="font-semibold text-white text-sm mb-1.5">3. Soát vé & Combo bắp nước</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Soát vé bắt đầu 30 phút trước giờ chiếu. Quý khách đặt combo online xuất trình mã đơn tại quầy để nhận phần bắp nước.
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
