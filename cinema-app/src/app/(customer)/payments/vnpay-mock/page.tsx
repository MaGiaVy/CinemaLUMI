'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VNPayMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || '---';
  const txnCode = searchParams.get('txn_code') || searchParams.get('transactionCode') || '---';
  const rawAmount = searchParams.get('amount') || '0';
  const amount = Number(rawAmount) || 0;
  const orderInfo = searchParams.get('order_info') || 'Thanh toan ve xem phim Lumi Cinema';
  const discountAmount = Number(searchParams.get('discount_amount')) || 0;
  const originalAmount = Number(searchParams.get('original_amount')) || amount;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultStatus, setResultStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');

  const handleSimulatePayment = async (success: boolean) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const returnUrl = new URL('/api/payments/vnpay-return', window.location.origin);
    returnUrl.searchParams.set('payment_id', String(paymentId));
    returnUrl.searchParams.set('vnp_TxnRef', String(paymentId));
    returnUrl.searchParams.set('status', success ? 'success' : 'failed');
    returnUrl.searchParams.set('vnp_ResponseCode', success ? '00' : '24');
    returnUrl.searchParams.set('amount', String(amount));
    returnUrl.searchParams.set('txn_code', txnCode);
    returnUrl.searchParams.set('order_info', orderInfo);

    const seatIds = searchParams.get('seat_ids');
    if (seatIds) returnUrl.searchParams.set('seat_ids', seatIds);
    const screeningId = searchParams.get('screening_id');
    if (screeningId) returnUrl.searchParams.set('screening_id', screeningId);
    const couponCode = searchParams.get('coupon_code');
    if (couponCode) returnUrl.searchParams.set('coupon_code', couponCode);

    window.location.href = returnUrl.toString();
  };

  return (
    <div className="min-h-screen bg-[#0F1015] text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header Giả lập Cổng VNPay */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#2A2B36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-red-500 flex items-center justify-center font-black text-lg text-white shadow-lg">
            VNP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">VNPAY GATEWAY</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                Mock Sandbox
              </span>
            </div>
            <p className="text-xs text-gray-400">Cổng thanh toán giả lập dành cho môi trường thử nghiệm</p>
          </div>
        </div>
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-[#1F202B] border border-[#2F3040]"
        >
          Trang chủ
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-xl w-full mx-auto my-8">
        <div className="bg-[#171822] border border-[#2A2B36] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {resultStatus === 'IDLE' ? (
            <>
              {/* Order Info Summary */}
              <div className="text-center pb-6 border-b border-[#242533]">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Đơn Hàng Thanh Toán
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {amount.toLocaleString('vi-VN')} <span className="text-red-500 text-2xl font-bold">đ</span>
                </h1>
                {discountAmount > 0 && (
                  <p className="text-xs text-green-400 mt-1 font-medium">
                    (Đã giảm {discountAmount.toLocaleString('vi-VN')} đ từ giá gốc {originalAmount.toLocaleString('vi-VN')} đ)
                  </p>
                )}
                <div className="mt-3 inline-block px-3 py-1 bg-[#202230] rounded-full text-xs text-gray-300 border border-[#303244]">
                  Mã giao dịch: <span className="font-mono text-white font-semibold">{txnCode}</span>
                </div>
              </div>

              {/* Order Details Table */}
              <div className="py-5 space-y-3 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400">Mã đơn thanh toán:</span>
                  <span className="font-semibold text-white">#{paymentId}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-400">Nội dung:</span>
                  <span className="font-medium text-white text-right max-w-[260px] line-clamp-2">
                    {orderInfo}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Đơn vị thụ hưởng:</span>
                  <span className="font-semibold text-white">LUMI CINEMA VIETNAM</span>
                </div>
              </div>

              {/* Mock QR Code */}
              <div className="my-4 p-5 bg-[#0F1017] rounded-xl border border-[#252738] flex flex-col items-center justify-center">
                <div className="w-36 h-36 bg-white rounded-lg p-2 flex items-center justify-center shadow-md">
                  <div className="grid grid-cols-6 gap-1 w-full h-full">
                    {Array.from({ length: 36 }, (_, i) => (
                      <div
                        key={i}
                        className="rounded-[1px]"
                        style={{
                          background: (i % 2 === 0 || i % 5 === 0 || i === 0 || i === 35) ? '#0F1015' : '#EDEDED',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Mã QR mô phỏng chuẩn VNPAY-QR
                </p>
              </div>

              {/* Action Buttons for Testing */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(true)}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span>Đang xử lý giao dịch...</span>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Xác Nhận Thanh Toán Thành Công (Mock Success)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment(false)}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-[#232432] hover:bg-[#2C2E3E] text-gray-300 font-semibold rounded-xl border border-[#343648] transition disabled:opacity-50 cursor-pointer text-sm"
                >
                  Hủy Giao Dịch / Báo Lỗi (Mock Failed)
                </button>
              </div>
            </>
          ) : resultStatus === 'SUCCESS' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Thanh Toán Giả Lập Thành Công!</h2>
              <p className="text-sm text-gray-300 mb-6">
                Đơn hàng #{paymentId} đã hoàn tất thanh toán {amount.toLocaleString('vi-VN')} đ qua cổng VNPay Mock.
              </p>
              <div className="p-4 bg-[#0F1017] rounded-xl border border-[#252738] text-xs font-mono text-left space-y-1 mb-6">
                <div>status: SUCCESS</div>
                <div>payment_id: {paymentId}</div>
                <div>txn_code: {txnCode}</div>
                <div>response_code: 00</div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Quay về Trang Chủ
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
                ✕
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Giao Dịch Đã Bị Hủy</h2>
              <p className="text-sm text-gray-300 mb-6">
                Thao tác thanh toán cho đơn hàng #{paymentId} đã bị hủy bỏ bởi khách hàng hoặc bị từ chối.
              </p>
              <button
                type="button"
                onClick={() => setResultStatus('IDLE')}
                className="w-full py-3 bg-[#242533] hover:bg-[#2E3042] text-white font-bold rounded-xl transition cursor-pointer"
              >
                Thử Lại Giao Dịch
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 py-4 border-t border-[#1C1D27] max-w-xl w-full mx-auto">
        Lumi Cinema Sandbox Mock VNPay Gateway &copy; {new Date().getFullYear()} - Tuân thủ CODE_STANDARDS_BEST_PRACTICES.md
      </footer>
    </div>
  );
}

export default function VNPayMockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F1015] text-white flex items-center justify-center">Đang tải cổng thanh toán...</div>}>
      <VNPayMockContent />
    </Suspense>
  );
}
