'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { isDatabaseOrConnectionError } from '@/lib/error';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * error.tsx - Bộ hứng lỗi giao diện cấp ứng dụng (Application-level Error Boundary)
 * Tuân thủ CODE_STANDARDS_BEST_PRACTICES.md & Quy tắc E-04:
 * - Khi sập cơ sở dữ liệu hoặc mất kết nối: Hiển thị giao diện "Hệ thống bảo trì".
 * - Tuyệt đối không phơi bày raw stack trace / technical error ra màn hình người dùng.
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Ghi nhận lỗi runtime vào console / monitoring service
    console.error('[AppRuntimeError]', error);
  }, [error]);

  const isMaintenance = isDatabaseOrConnectionError(error);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#581C87]/20 via-[#050508] to-[#050508] pointer-events-none" />
      <div className="max-w-md w-full bg-[#0F0B18]/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-center backdrop-blur-xl relative z-10">
        {isMaintenance ? (
          /* ======================================================== */
          /* GIAO DIỆN BẢO TRÌ HỆ THỐNG THEO QUY TẮC E-04             */
          /* ======================================================== */
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              Thông Báo Hệ Thống (E-04)
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Hệ thống đang bảo trì
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Hệ thống rạp <strong className="text-white">Lumi Cinema</strong> hiện đang thực hiện bảo trì định kỳ hoặc kết nối máy chủ cơ sở dữ liệu tạm thời gián đoạn để đảm bảo an toàn giao dịch. Quý khách vui lòng thử lại sau ít phút.
            </p>

            <div className="bg-slate-900/60 rounded-xl p-3.5 mb-6 border border-slate-800 text-xs text-slate-400">
              <span className="text-slate-300 font-semibold">Cần đặt vé gấp?</span> Liên hệ tổng đài vé:{' '}
              <a href="tel:19008888" className="text-amber-400 font-bold hover:underline">
                1900 8888
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => reset()}
                className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg active:scale-95 text-sm cursor-pointer"
              >
                Thử kết nối lại
              </button>
              <Link
                href="/"
                className="flex-1 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all text-sm inline-flex items-center justify-center"
              >
                Trang chủ
              </Link>
            </div>
          </>
        ) : (
          /* ======================================================== */
          /* GIAO DIỆN LỖI RUNTIME THÔNG THƯỜNG                       */
          /* ======================================================== */
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-rose-400 shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
              Đã có lỗi xảy ra
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Không thể tải nội dung
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Rất tiếc, trang bạn đang truy cập gặp sự cố bất ngờ. Hệ thống đã ghi nhận mã lỗi và đội ngũ kỹ thuật đang tiến hành xử lý.
            </p>

            {error.digest && (
              <p className="text-[11px] font-mono text-slate-500 mb-6 bg-slate-900/40 p-2 rounded border border-slate-800">
                Mã theo dõi: {error.digest}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => reset()}
                className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold hover:from-rose-500 hover:to-rose-600 transition-all shadow-lg active:scale-95 text-sm cursor-pointer"
              >
                Tải lại trang
              </button>
              <Link
                href="/"
                className="flex-1 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all text-sm inline-flex items-center justify-center"
              >
                Trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
