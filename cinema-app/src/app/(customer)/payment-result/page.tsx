'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface SavedReservation {
  screeningId?: number;
  seatIds?: number[];
  seatCodes?: string[];
  reservedUntil?: string;
}

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId');
  const appTransId = searchParams.get('apptransid') || searchParams.get('app_trans_id');
  const txnRef = searchParams.get('vnp_TxnRef') || searchParams.get('order_code');
  const qrValue = paymentId
    ? `LUMI-TICKET-PAYMENT-${paymentId}`
    : appTransId
      ? `LUMI-TICKET-ZP-${appTransId}`
      : txnRef
        ? `LUMI-TICKET-${txnRef}`
        : 'LUMI-CINEMA-TICKET';
  const paymentMethodName = searchParams.get('method') || (appTransId ? 'ZaloPay' : 'VNPay');
  const statusParam = searchParams.get('status') || '';
  const responseCode = searchParams.get('code') || searchParams.get('vnp_ResponseCode') || '00';
  const isSuccess = statusParam.toLowerCase() === 'success' || responseCode === '00';
  const rawAmount = searchParams.get('amount') || searchParams.get('vnp_Amount');
  const amount = rawAmount ? Number(rawAmount) : 0;
  const errorMessage = searchParams.get('error');

  const [reservation, setReservation] = useState<SavedReservation | null>(null);

  // Chỉ xóa session tạm giữ chỗ trên máy khách khi thanh toán thành công.
  // Khi thanh toán thất bại, giữ lại để người dùng có thể bấm 'Thử lại thanh toán' mà không bị mất ghế.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isSuccess) {
        window.sessionStorage.removeItem('lumi_booking_reservation');
        window.sessionStorage.removeItem('lumi_combo_reservation');
        window.sessionStorage.removeItem('lumi_ticket_items');
      } else {
        const stored = window.sessionStorage.getItem('lumi_booking_reservation');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setReservation(parsed);
          } catch {
            // ignore
          }
        }
      }
    }
  }, [isSuccess]);

  const queryScreeningId = searchParams.get('screening_id') || searchParams.get('screeningId');
  const effectiveScreeningId = reservation?.screeningId || (queryScreeningId ? parseInt(queryScreeningId, 10) : undefined);
  const isHoldValid = reservation?.reservedUntil
    ? new Date(reservation.reservedUntil).getTime() > Date.now()
    : false;

  return (
    <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-[#E11D48] selection:text-white">
      <div className="max-w-md w-full bg-[rgba(18,14,28,0.85)] border border-[rgba(192,132,252,0.25)] rounded-2xl p-6 sm:p-8 shadow-2xl text-center backdrop-blur-2xl">
        {isSuccess ? (
          <>
            {/* Biểu tượng Thành công */}
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-black text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              ✓
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mb-2 tracking-tight">
              Thanh Toán Thành Công!
            </h1>
            <p className="text-[#94A3B8] text-sm mb-6 leading-relaxed">
              Giao dịch của bạn đã được xác nhận thành công qua cổng thanh toán {paymentMethodName}. Vé điện tử đã sẵn sàng để vào rạp!
            </p>

            {/* Chi tiết đơn hàng */}
            <div className="bg-[rgba(15,11,26,0.85)] border border-[rgba(192,132,252,0.18)] rounded-xl p-5 mb-6 text-left space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-[rgba(192,132,252,0.12)]">
                <span className="text-slate-400">Mã đơn thanh toán:</span>
                <span className="font-bold text-[#F8FAFC] font-mono">#{paymentId || '---'}</span>
              </div>
              {amount > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-[rgba(192,132,252,0.12)]">
                  <span className="text-slate-400">Tổng tiền đã trả:</span>
                  <span className="font-bold text-emerald-400 text-base">
                    {amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-[rgba(192,132,252,0.12)]">
                <span className="text-slate-400">Phương thức:</span>
                <span className="font-semibold text-[#F8FAFC]">
                  {paymentMethodName} Gateway
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Trạng thái vé:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HỢP LỆ (VALID)
                </span>
              </div>
            </div>

            {/* Mã QR vé điện tử */}
            <div className="bg-[rgba(15,11,26,0.85)] border border-[rgba(192,132,252,0.18)] rounded-xl p-4 mb-6 flex flex-col items-center">
              <div className="w-36 h-36 bg-white rounded-xl p-3 flex items-center justify-center shadow-inner mb-2">
                <QRCodeSVG
                  value={qrValue}
                  size={120}
                  level="M"
                />
              </div>
              <p className="text-xs text-slate-400 text-center font-medium">
                Quét mã QR tại cổng kiểm soát vé vào phòng chiếu
              </p>
            </div>

            {/* Các nút điều hướng */}
            <div className="space-y-3">
              <Link
                href="/tickets"
                className="w-full block py-3.5 px-4 bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#F43F5E] hover:to-[#BE123C] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] transition text-center no-underline"
              >
                Xem vé của tôi
              </Link>
              <Link
                href="/"
                className="w-full block py-3 px-4 bg-[rgba(18,14,28,0.7)] hover:bg-[rgba(30,24,48,0.9)] text-[#94A3B8] hover:text-[#F8FAFC] font-semibold rounded-xl border border-[rgba(192,132,252,0.2)] transition text-center text-sm no-underline"
              >
                Về Trang Chủ
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Biểu tượng Thất bại / Hủy */}
            <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-black text-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.4)]">
              ✕
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mb-2 tracking-tight">
              Thanh Toán Không Thành Công
            </h1>
            <p className="text-[#94A3B8] text-sm mb-6 leading-relaxed">
              {errorMessage ||
                (responseCode === '24'
                  ? 'Giao dịch đã bị hủy theo yêu cầu của bạn.'
                  : 'Giao dịch qua cổng thanh toán không thành công hoặc đã hết hạn giữ chỗ.')}
            </p>

            <div className="bg-[rgba(15,11,26,0.85)] border border-[rgba(192,132,252,0.18)] rounded-xl p-5 mb-6 text-left space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mã đơn thanh toán:</span>
                <span className="font-semibold text-[#F8FAFC] font-mono">#{paymentId || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mã phản hồi cổng:</span>
                <span className="font-mono text-rose-400 font-semibold">{responseCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Trạng thái:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  THẤT BẠI
                </span>
              </div>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 mt-2">
                {isHoldValid
                  ? 'Ghế của bạn vẫn đang được giữ chỗ trong phiên làm việc. Bạn có thể nhấn "Thử Lại Thanh Toán" để tiến hành thanh toán lại ngay!'
                  : 'Thời gian giữ chỗ có thể đã hết hạn hoặc giao dịch đã bị hủy. Bạn có thể chọn lại suất chiếu hoặc kiểm tra lại lịch chiếu.'}
              </div>
            </div>

            {/* Các nút điều hướng */}
            <div className="space-y-3">
              {effectiveScreeningId ? (
                <>
                  <Link
                    href={`/screenings/${effectiveScreeningId}/checkout${
                      reservation?.seatIds?.length
                        ? `?seats=${reservation.seatIds.join(',')}&codes=${(reservation.seatCodes || []).join(',')}`
                        : ''
                    }`}
                    className="w-full block py-3.5 px-4 bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#F43F5E] hover:to-[#BE123C] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] transition text-center no-underline cursor-pointer"
                  >
                    Thử Lại Thanh Toán
                  </Link>

                  <Link
                    href={`/screenings/${effectiveScreeningId}/seats`}
                    className="w-full block py-3 px-4 bg-[rgba(18,14,28,0.7)] hover:bg-[rgba(30,24,48,0.9)] text-[#FDA4AF] hover:text-[#F8FAFC] font-semibold rounded-xl border border-[rgba(225,29,72,0.3)] hover:border-[rgba(225,29,72,0.6)] transition text-center text-sm no-underline"
                  >
                    Chọn Lại Suất Chiếu & Ghế
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#F43F5E] hover:to-[#BE123C] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] transition cursor-pointer"
                  >
                    Thử Lại Thanh Toán
                  </button>

                  <Link
                    href="/"
                    className="w-full block py-3 px-4 bg-[rgba(18,14,28,0.7)] hover:bg-[rgba(30,24,48,0.9)] text-[#FDA4AF] hover:text-[#F8FAFC] font-semibold rounded-xl border border-[rgba(225,29,72,0.3)] hover:border-[rgba(225,29,72,0.6)] transition text-center text-sm no-underline"
                  >
                    Chọn Lại Suất Chiếu
                  </Link>
                </>
              )}

              <Link
                href="/"
                className="w-full block py-3 px-4 bg-[rgba(18,14,28,0.7)] hover:bg-[rgba(30,24,48,0.9)] text-[#94A3B8] hover:text-[#F8FAFC] font-semibold rounded-xl border border-[rgba(192,132,252,0.2)] transition text-center text-sm no-underline"
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
        <div className="min-h-screen bg-[#050508] text-[#F8FAFC] flex items-center justify-center font-sans">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#94A3B8]">Đang tải thông tin kết quả thanh toán...</span>
          </div>
        </div>
      }
    >
      <PaymentResultInner />
    </Suspense>
  );
}
