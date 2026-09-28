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
      <body className="m-0 p-0 bg-[#0B0F19] text-white font-sans antialiased min-h-screen flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto p-4 sm:p-6">
          <div className="bg-[#151D2F] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center backdrop-blur-md">
            {isMaintenance ? (
              /* ======================================================== */
              /* GIAO DIỆN BẢO TRÌ TOÀN CỤC THEO QUY TẮC E-04             */
              /* ======================================================== */
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-4xl shadow-inner rotate-3 hover:rotate-0 transition-transform">
                  🛠️
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

                <div className="bg-[#0B0F19]/80 rounded-2xl p-4 mb-6 border border-slate-800/80 text-xs text-slate-400">
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
                    🔄 Thử kết nối lại
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
                <div className="w-20 h-20 mx-auto mb-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                  ⚡
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
                  <p className="text-[11px] font-mono text-slate-500 mb-6 bg-[#0B0F19]/60 p-2.5 rounded-lg border border-slate-800">
                    Mã lỗi: {error.digest}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => reset()}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold transition-all shadow-lg active:scale-95 text-sm cursor-pointer"
                  >
                    🔄 Tải lại trang
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
