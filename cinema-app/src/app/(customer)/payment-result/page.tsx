'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId');
  const statusParam = searchParams.get('status') || '';
  const responseCode = searchParams.get('code') || searchParams.get('vnp_ResponseCode') || '00';
  const isSuccess = statusParam.toLowerCase() === 'success' || responseCode === '00';
  const rawAmount = searchParams.get('amount') || searchParams.get('vnp_Amount');
  const amount = rawAmount ? Number(rawAmount) : 0;
  const _orderInfo = searchParams.get('order_info') || searchParams.get('vnp_OrderInfo') || 'Thanh toán vé xem phim Lumi Cinema';
  const errorMessage = searchParams.get('error');

  // Xóa session tạm giữ chỗ trên máy khách khi đã hoàn tất phiên đặt vé
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('lumi_booking_reservation');
      window.sessionStorage.removeItem('lumi_combo_reservation');
    }
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-[#111217] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-[#1A1C24] border border-[#2B2D3A] rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        {isSuccess ? (
          <>
            {/* Biểu tượng Thành công */}
            <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl font-black text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.35)] animate-bounce">
              ✓
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Thanh Toán Thành Công!
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              Giao dịch của bạn đã được xác nhận qua cổng thanh toán VNPay. Vé điện tử đã sẵn sàng để vào rạp!
            </p>

            {/* Chi tiết đơn hàng */}
            <div className="bg-[#12131A] border border-[#252733] rounded-xl p-5 mb-6 text-left space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-[#20222D]">
                <span className="text-gray-400">Mã đơn thanh toán:</span>
                <span className="font-bold text-white font-mono">#{paymentId || '---'}</span>
              </div>
              {amount > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-[#20222D]">
                  <span className="text-gray-400">Tổng tiền đã trả:</span>
                  <span className="font-bold text-green-400 text-base">
                    {amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-[#20222D]">
                <span className="text-gray-400">Phương thức:</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span>💳</span> VNPay Gateway
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Trạng thái vé:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  HỢP LỆ (VALID)
                </span>
              </div>
            </div>

            {/* Simulated QR Code vé vào rạp */}
            <div className="bg-[#12131A] border border-[#252733] rounded-xl p-4 mb-6 flex flex-col items-center">
              <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center shadow-inner mb-2">
                <div className="grid grid-cols-5 gap-1 w-full h-full">
                  {Array.from({ length: 25 }, (_, i) => (
                    <div
                      key={i}
                      className="rounded-[1px]"
                      style={{
                        background: (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 24) ? '#111' : '#f0f0f0',
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center font-medium">
                Quét mã QR tại cổng kiểm soát vé vào phòng chiếu
              </p>
            </div>

            {/* Các nút điều hướng */}
            <div className="space-y-3">
              <Link
                href="/tickets"
                className="w-full block py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg transition text-center"
              >
                🎟️ Xem vé của tôi
              </Link>
              <Link
                href="/"
                className="w-full block py-3 px-4 bg-[#20222E] hover:bg-[#282B3A] text-gray-300 font-semibold rounded-xl border border-[#303346] transition text-center text-sm"
              >
                Về Trang Chủ
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Biểu tượng Thất bại / Hủy */}
            <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl font-black text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              ✕
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Thanh Toán Không Thành Công
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              {errorMessage ||
                (responseCode === '24'
                  ? 'Giao dịch đã bị hủy theo yêu cầu của bạn.'
                  : 'Giao dịch qua cổng thanh toán không thành công hoặc đã hết hạn giữ chỗ.')}
            </p>

            <div className="bg-[#12131A] border border-[#252733] rounded-xl p-5 mb-6 text-left space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mã đơn thanh toán:</span>
                <span className="font-semibold text-white font-mono">#{paymentId || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mã phản hồi cổng:</span>
                <span className="font-mono text-red-400 font-semibold">{responseCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Trạng thái:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  THẤT BẠI
                </span>
              </div>
              <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-300 mt-2">
                Ghế ngồi và bắp nước của bạn đã được giải phóng để người khác có thể chọn lại.
              </div>
            </div>

            {/* Các nút điều hướng */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                Thử Lại Thanh Toán
              </button>
              <Link
                href="/"
                className="w-full block py-3 px-4 bg-[#20222E] hover:bg-[#282B3A] text-gray-300 font-semibold rounded-xl border border-[#303346] transition text-center text-sm"
              >
                Về Trang Chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111217] text-white flex items-center justify-center font-sans">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải thông tin kết quả thanh toán...</span>
          </div>
        </div>
      }
    >
      <PaymentResultInner />
    </Suspense>
  );
}
