'use client';

import React, { useEffect } from 'react';
import { isDatabaseOrConnectionError } from '@/lib/error';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * global-error.tsx - Bộ hứng lỗi toàn cục cấp Root Layout (Next.js Global Error Boundary)
 * Tuân thủ CODE_STANDARDS_BEST_PRACTICES.md & Quy tắc E-04:
 * - Thay thế toàn bộ cây DOM gốc nếu Root Layout gặp sự cố nghiêm trọng.
 * - Bắt buộc định nghĩa thẻ <html> và <body> riêng biệt.
 * - Hiển thị màn hình "Hệ thống bảo trì" thân thiện khi mất kết nối Database.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalCriticalRuntimeError]', error);
  }, [error]);

  const isMaintenance = isDatabaseOrConnectionError(error);

  return (
    <html lang="vi">
      <body className="m-0 p-0 bg-[#050508] text-white font-sans antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#581C87]/20 via-[#050508] to-[#050508] pointer-events-none" />
        <div className="w-full max-w-lg mx-auto p-4 sm:p-6 relative z-10">
          <div className="bg-[#0F0B18]/90 border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl text-center backdrop-blur-xl">
            {isMaintenance ? (
              /* ======================================================== */
              /* GIAO DIỆN BẢO TRÌ TOÀN CỤC THEO QUY TẮC E-04             */
              /* ======================================================== */
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner rotate-3 hover:rotate-0 transition-transform">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                <div className="inline-block px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                  Bảo Trì Hệ Thống (E-04)
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                  Hệ thống đang bảo trì
                </h1>

                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Hệ thống rạp chiếu phim <strong className="text-white">Lumi Cinema</strong> hiện đang được bảo trì nâng cấp máy chủ hoặc dữ liệu tạm thời gián đoạn. Chúng tôi đang khôi phục dịch vụ nhanh nhất có thể.
                </p>

                <div className="bg-[#050508]/80 rounded-2xl p-4 mb-6 border border-slate-800/80 text-xs text-slate-400">
                  <div className="text-slate-200 font-semibold mb-1">Cần hỗ trợ vé khẩn cấp?</div>
                  <div>
                    Tổng đài CSKH 24/7:{' '}
                    <a href="tel:19008888" className="text-amber-400 font-bold hover:underline">
                      1900 8888
                    </a>{' '}
                    • support@lumicinema.vn
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => reset()}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition-all shadow-lg active:scale-95 text-sm cursor-pointer"
                  >
                    Thử kết nối lại
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all text-sm cursor-pointer"
                  >
                    Về trang chủ
                  </button>
                </div>
              </>
            ) : (
              /* ======================================================== */
              /* GIAO DIỆN SỰ CỐ TOÀN CỤC THÔNG THƯỜNG                    */
              /* ======================================================== */
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-inner">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <div className="inline-block px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
                  Sự Cố Ứng Dụng
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                  Không thể kết nối máy chủ
                </h1>

                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Đã có lỗi hệ thống phát sinh trong quá trình khởi tạo ứng dụng. Vui lòng tải lại hoặc quay lại trang chủ.
                </p>

                {error.digest && (
                  <p className="text-[11px] font-mono text-slate-500 mb-6 bg-[#050508]/60 p-2.5 rounded-lg border border-slate-800">
                    Mã lỗi: {error.digest}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => reset()}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold transition-all shadow-lg active:scale-95 text-sm cursor-pointer"
                  >
                    Tải lại trang
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all text-sm cursor-pointer"
                  >
                    Về trang chủ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
