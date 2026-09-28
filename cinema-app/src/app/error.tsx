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
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        {isMaintenance ? (
          /* ======================================================== */
          /* GIAO DIỆN BẢO TRÌ HỆ THỐNG THEO QUY TẮC E-04             */
          /* ======================================================== */
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
              🛠️
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
                🔄 Thử kết nối lại
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
              ⚠️
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
                🔄 Tải lại trang
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
