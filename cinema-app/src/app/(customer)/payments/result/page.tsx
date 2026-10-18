'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId');
  const [payment, setPayment] = useState<{ status: string; amount: number; paymentMethod: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const isSuccess = payment?.status === 'Success';
  const amount = payment?.amount || 0;
  const responseCode = payment?.status === 'Failed' ? 'Thất bại' : '';
  const errorMessage = loadError;

  useEffect(() => {
    if (!paymentId || !/^\d+$/.test(paymentId)) {
      setLoadError('Không tìm thấy mã đơn hợp lệ');
      setLoading(false);
      return;
    }
    fetch(`/api/payments/${paymentId}`, { cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Không thể kiểm tra đơn');
        setPayment(result.data);
      })
      .catch(error => setLoadError(error instanceof Error ? error.message : 'Không thể kiểm tra đơn'))
      .finally(() => setLoading(false));
  }, [paymentId]);

  // Xóa session tạm giữ chỗ khi đã hoàn tất
  useEffect(() => {
    if (payment?.status === 'Success' || payment?.status === 'Failed') {
      window.sessionStorage.removeItem('lumi_booking_reservation');
      window.sessionStorage.removeItem('lumi_combo_reservation');
    }
  }, [payment?.status]);

  if (loading || payment?.status === 'Pending') {
    return <div className="min-h-screen bg-[#111217] text-white flex items-center justify-center">Đang xác nhận thanh toán. Vui lòng kiểm tra lại sau.</div>;
  }

  return (
    <div className="min-h-screen bg-[#111217] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-[#1A1C24] border border-[#2B2D3A] rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        {isSuccess ? (
          <>
            {/* Biểu tượng Thành công */}
            <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl font-black text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-bounce">
              ✓
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Thanh Toán Thành Công!
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              Giao dịch của bạn đã được xác nhận qua cổng thanh toán VNPay. Vé điện tử đã sẵn sàng!
            </p>

            {/* Thông tin đơn hàng */}
            <div className="bg-[#12131A] border border-[#252733] rounded-xl p-5 mb-6 text-left space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-[#20222D]">
                <span className="text-gray-400">Mã đơn hàng:</span>
                <span className="font-bold text-white">#{paymentId || '---'}</span>
              </div>
              {amount > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-[#20222D]">
                  <span className="text-gray-400">Số tiền đã trả:</span>
                  <span className="font-bold text-green-400 text-base">
                    {amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-[#20222D]">
                <span className="text-gray-400">Phương thức:</span>
                <span className="font-semibold text-white">{payment?.paymentMethod || 'VNPay'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Trạng thái:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  ĐÃ XÁC NHẬN
                </span>
              </div>
            </div>

            {/* Các nút điều hướng */}
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full block py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg transition text-center"
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
                'Giao dịch không thành công hoặc đã hết hạn giữ chỗ.'}
            </p>

            <div className="bg-[#12131A] border border-[#252733] rounded-xl p-5 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mã đơn hàng:</span>
                <span className="font-semibold text-white">#{paymentId || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mã phản hồi:</span>
                <span className="font-mono text-red-400 font-semibold">{responseCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Trạng thái:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  THẤT BẠI
                </span>
              </div>
              <p className="text-xs text-yellow-400/90 pt-2 border-t border-[#20222D]">
                Vui lòng chọn lại ghế nếu muốn đặt vé mới.
              </p>
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
        <div className="min-h-screen bg-[#111217] text-white flex items-center justify-center">
          Đang tải kết quả giao dịch...
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
