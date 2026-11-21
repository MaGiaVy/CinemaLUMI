'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import type { GatewayProvider, ThirdPartyAccount } from '@/lib/third-party-accounts';

interface GatewayPaymentInfo {
  id: number;
  amount: number;
  status: string;
  transactionCode: string | null;
  createdAt: string;
  reservedUntil: string;
  screeningId: number | null;
  movieTitle: string;
  room: string;
  seatCodes: string[];
}

function vnd(n: number): string {
  return `${Math.round(n || 0).toLocaleString('vi-VN')} đ`;
}

function formatTimer(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PaymentGatewayShell({ provider }: { provider: GatewayProvider }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentIdParam = searchParams.get('payment_id') || searchParams.get('paymentId') || '';
  const paymentId = Number(paymentIdParam) || 0;
  const fallbackTxn = searchParams.get('txn_code') || searchParams.get('transactionCode') || `TXN_${paymentId}`;
  const fallbackAmount = Number(searchParams.get('amount')) || 0;
  const fallbackOrderInfo = searchParams.get('order_info') || 'Thanh toán vé xem phim Lumi Cinema';

  const isZalo = provider === 'zalopay';

  const [paymentInfo, setPaymentInfo] = useState<GatewayPaymentInfo | null>(null);
  const [accounts, setAccounts] = useState<ThirdPartyAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(600);

  const [status, setStatus] = useState<'READY' | 'PROCESSING' | 'SUCCESS'>('READY');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [noticeMsg, setNoticeMsg] = useState<string>('');
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState<string>('');

  // Topup modal state
  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);
  const [customTopup, setCustomTopup] = useState<string>('200000');
  const [isMutatingWallet, setIsMutatingWallet] = useState<boolean>(false);

  const loadGatewayData = useCallback(async () => {
    if (!paymentId) {
      setLoading(false);
      setErrorMsg('Không tìm thấy mã đơn thanh toán hợp lệ.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/payments/gateway-wallet?provider=${provider}&payment_id=${paymentId}`,
        { cache: 'no-store' }
      );
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setErrorMsg(json.message || json.error || 'Không thể kết nối đến máy chủ cổng thanh toán.');
        return;
      }

      const loadedPayment: GatewayPaymentInfo = json.data.payment;
      const loadedAccounts: ThirdPartyAccount[] = json.data.accounts || [];

      setPaymentInfo(loadedPayment);
      setAccounts(loadedAccounts);
      setSelectedAccountId((prev) => prev || loadedAccounts[0]?.id || '');

      if (loadedPayment.reservedUntil) {
        const remainSec = Math.max(
          0,
          Math.floor((new Date(loadedPayment.reservedUntil).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(remainSec);
      }

      if (loadedPayment.status === 'Success') {
        setStatus('SUCCESS');
        setSuccessRedirectUrl(
          `/payment-result?status=success&code=00&payment_id=${loadedPayment.id}&amount=${loadedPayment.amount}&method=${isZalo ? 'ZaloPay' : 'VNPay'}`
        );
      } else if (loadedPayment.status === 'Failed') {
        setErrorMsg('Đơn hàng này đã bị hủy hoặc thất bại trước đó. Vui lòng tạo đơn mới.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối khi lấy thông tin tài khoản bên thứ 3.');
    } finally {
      setLoading(false);
    }
  }, [paymentId, provider, isZalo]);

  useEffect(() => {
    void loadGatewayData();
  }, [loadGatewayData]);

  // Countdown seat hold timer
  useEffect(() => {
    if (status === 'SUCCESS' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      if (paymentInfo?.reservedUntil) {
        const remain = Math.max(
          0,
          Math.floor((new Date(paymentInfo.reservedUntil).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(remain);
      } else {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft, paymentInfo?.reservedUntil]);

  // Auto-redirect after success
  useEffect(() => {
    if (status !== 'SUCCESS' || !successRedirectUrl) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(successRedirectUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, successRedirectUrl, router]);

  const amount = paymentInfo?.amount ?? fallbackAmount;
  const txnCode = paymentInfo?.transactionCode || fallbackTxn;
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  const isInsufficient = selectedAccount ? amount > selectedAccount.balance : false;
  const missingAmount = selectedAccount ? Math.max(0, amount - selectedAccount.balance) : 0;

  const handleWalletAction = async (action: 'topup' | 'reset', topupVal?: number) => {
    if (!selectedAccount || !paymentId) return;
    setIsMutatingWallet(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/payments/gateway-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          provider,
          paymentId,
          accountId: selectedAccount.id,
          ...(action === 'topup' ? { amount: topupVal } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || json.error || 'Thao tác ví thất bại');
        return;
      }
      if (Array.isArray(json.data?.accounts)) {
        setAccounts(json.data.accounts);
      }
      setNoticeMsg(json.message || 'Cập nhật số dư thành công!');
      setIsTopupOpen(false);
      setTimeout(() => setNoticeMsg(''), 3500);
    } catch {
      setErrorMsg('Không thể kết nối đến hệ thống bên thứ 3.');
    } finally {
      setIsMutatingWallet(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedAccount || !paymentId || status !== 'READY') return;

    if (timeLeft <= 0) {
      setErrorMsg('Đã hết thời gian giữ ghế (10 phút). Vui lòng đặt vé lại.');
      return;
    }

    setStatus('PROCESSING');
    setErrorMsg('');

    try {
      await new Promise((r) => setTimeout(r, 600));

      const res = await fetch('/api/payments/gateway-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          provider,
          paymentId,
          accountId: selectedAccount.id,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatus('READY');
        setErrorMsg(json.message || json.error || 'Giao dịch bị từ chối bởi cổng thanh toán.');
        return;
      }

      if (Array.isArray(json.data?.accounts)) {
        setAccounts(json.data.accounts);
      }

      setSuccessRedirectUrl(
        json.data?.redirectUrl ||
          `/payment-result?status=success&code=00&payment_id=${paymentId}&amount=${amount}&method=${isZalo ? 'ZaloPay' : 'VNPay'}`
      );
      setStatus('SUCCESS');
    } catch {
      setStatus('READY');
      setErrorMsg('Lỗi kết nối khi xác nhận thanh toán với cổng bên thứ 3.');
    }
  };

  const handleCancelPayment = () => {
    const returnEndpoint = isZalo ? '/api/payments/zalopay-return' : '/api/payments/vnpay-return';
    const url = new URL(returnEndpoint, window.location.origin);
    url.searchParams.set('payment_id', String(paymentId));
    url.searchParams.set('txn_code', txnCode);
    if (isZalo) {
      url.searchParams.set('apptransid', txnCode);
    } else {
      url.searchParams.set('vnp_TxnRef', String(paymentId));
      url.searchParams.set('vnp_ResponseCode', '24');
      url.searchParams.set('mock', 'true');
      url.searchParams.set('vnp_SecureHash', 'mock_sandbox_verified');
    }
    url.searchParams.set('status', 'failed');
    url.searchParams.set('amount', String(amount));
    if (paymentInfo?.screeningId) {
      url.searchParams.set('screening_id', String(paymentInfo.screeningId));
    }
    window.location.href = url.toString();
  };

  const brandGradient = isZalo
    ? 'from-[#0068FF] via-[#005AE0] to-[#0047BA]'
    : 'from-[#005BAA] via-[#00478F] to-[#ED1C24]';
  const accentColor = isZalo ? '#0068FF' : '#005BAA';

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 flex flex-col font-sans">
      {/* HEADER CỔNG THANH TOÁN BÊN THỨ 3 */}
      <header className={`bg-gradient-to-r ${brandGradient} text-white px-5 py-3.5 shadow-md`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm p-1.5">
              {isZalo ? (
                <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                  <rect width="100" height="100" rx="20" fill="#0068FF" />
                  <path d="M25 32H75L35 72H75" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="font-black text-xs tracking-tighter text-[#005BAA]">
                  VN<span className="text-[#ED1C24]">PAY</span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">
                  {isZalo ? 'ZaloPay' : 'VNPAY-QR'}
                </span>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                  Gateway Sandbox
                </span>
              </div>
              <p className="text-xs text-white/85">
                {isZalo
                  ? 'Cổng thanh toán Ví điện tử ZaloPay (Bên thứ 3)'
                  : 'Cổng thanh toán Ngân hàng & VNPAY-QR (Bên thứ 3)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Hoạt động ổn định
            </span>
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-white no-underline"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-200 max-w-md mx-auto">
            <div
              className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-3"
              style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }}
            />
            <p className="text-sm font-semibold text-slate-600">
              Đang đồng bộ tài khoản từ bên thứ 3 &amp; đơn hàng...
            </p>
          </div>
        ) : status === 'SUCCESS' ? (
          /* MÀN HÌNH THANH TOÁN THÀNH CÔNG */
          <div className="max-w-lg w-full mx-auto bg-white rounded-3xl p-8 shadow-xl border border-emerald-200 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-3xl font-black">
              ✓
            </div>
            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase px-3 py-1 rounded-full mb-3">
              Giao dịch thành công
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Thanh Toán Hoàn Tất!</h1>
            <p className="text-sm text-slate-600 mb-6">
              Hệ thống {isZalo ? 'ZaloPay' : 'VNPAY'} đã trừ tiền thành công và gửi xác nhận xuất vé về Lumi Cinema.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn thanh toán:</span>
                <span className="font-bold">#{paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã giao dịch:</span>
                <span className="font-mono font-bold text-xs">{txnCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền đã thanh toán:</span>
                <span className="font-extrabold" style={{ color: accentColor }}>
                  {vnd(amount)}
                </span>
              </div>
              {selectedAccount && (
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Số dư {selectedAccount.bankOrWalletName} còn lại:</span>
                  <span className="font-bold text-emerald-600">{vnd(selectedAccount.balance)}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs font-semibold text-blue-700">
              Tự động chuyển về trang nhận vé điện tử sau {redirectCountdown}s...
            </div>

            <button
              type="button"
              onClick={() => router.push(successRedirectUrl)}
              className="w-full py-3.5 rounded-xl font-bold text-white shadow-md transition cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              Xem vé điện tử ngay →
            </button>
          </div>
        ) : (
          /* GIAO DIỆN CỔNG THANH TOÁN ĐẦY ĐỦ 2 CỘT */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Thanh đếm ngược giữ ghế */}
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs sm:text-sm text-amber-900">
              <span className="font-semibold">⏳ Thời gian giữ ghế đơn hàng còn lại:</span>
              <span className="font-mono font-extrabold text-base bg-white px-3 py-0.5 rounded-lg border border-amber-300 text-amber-700">
                {formatTimer(timeLeft)}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* CỘT TRÁI: THÔNG TIN ĐƠN HÀNG + MÃ QR */}
              <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Đơn vị thụ hưởng
                  </p>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">LUMI CINEMA VIETNAM</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {paymentInfo?.movieTitle || fallbackOrderInfo}
                    {paymentInfo?.room ? ` • ${paymentInfo.room}` : ''}
                    {paymentInfo?.seatCodes?.length ? ` • Ghế ${paymentInfo.seatCodes.join(', ')}` : ''}
                  </p>

                  <div className="mt-4 bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã đơn thanh toán:</span>
                      <span className="font-bold">#{paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã giao dịch:</span>
                      <span className="font-mono font-semibold text-xs">{txnCode}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2.5 border-t border-dashed border-slate-200">
                      <span className="font-bold text-slate-700">Tổng thanh toán:</span>
                      <span className="text-xl font-black" style={{ color: accentColor }}>
                        {vnd(amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mã QR động */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col items-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <QRCodeSVG
                      value={`${provider.toUpperCase()}|${txnCode}|${amount}`}
                      size={130}
                      level="M"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-2">
                    Mã QR {isZalo ? 'ZaloPay' : 'VNPAY-QR'} • Tự động điền {vnd(amount)}
                  </span>
                </div>
              </div>

              {/* CỘT PHẢI: TÀI KHOẢN BÊN THỨ 3 + KIỂM TRA SỐ DƯ + NẠP TIỀN */}
              <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Tài khoản {isZalo ? 'ZaloPay' : 'Ngân hàng VNPAY'} (Bên thứ 3)
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleWalletAction('reset')}
                      disabled={isMutatingWallet || !selectedAccount}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      ↺ Đặt lại số dư
                    </button>
                  </div>

                  {/* Chọn tài khoản bên thứ 3 */}
                  <div className="space-y-2.5">
                    {accounts.map((acc) => {
                      const isSelected = acc.id === selectedAccount?.id;
                      const accInsufficient = amount > acc.balance;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setSelectedAccountId(acc.id);
                            setErrorMsg('');
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                            isSelected
                              ? accInsufficient
                                ? 'border-red-500 bg-red-50/60'
                                : isZalo
                                ? 'border-[#0068FF] bg-blue-50/60'
                                : 'border-[#005BAA] bg-sky-50/60'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  {acc.bankOrWalletName}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {acc.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {acc.accountHolder} • <span className="font-mono">{acc.accountNumber}</span>
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">
                                Số dư
                              </div>
                              <div
                                className={`text-base font-extrabold ${
                                  accInsufficient ? 'text-red-600' : 'text-emerald-600'
                                }`}
                              >
                                {vnd(acc.balance)}
                              </div>
                            </div>
                          </div>

                          {isSelected && accInsufficient && (
                            <div className="mt-2 pt-2 border-t border-red-200 flex items-center justify-between text-xs text-red-700 font-semibold">
                              <span>⚠️ Không đủ tiền (Còn thiếu {vnd(amount - acc.balance)})</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomTopup(String(amount - acc.balance));
                                  setIsTopupOpen(true);
                                }}
                                className="underline text-blue-700 hover:text-blue-900 cursor-pointer"
                              >
                                + Nạp ngay
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Nút mở Modal nạp tiền */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (missingAmount > 0) setCustomTopup(String(missingAmount));
                        setIsTopupOpen(true);
                      }}
                      disabled={!selectedAccount}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ color: accentColor }}
                    >
                      <span>+</span>
                      <span>
                        Nạp thêm tiền vào {selectedAccount?.bankOrWalletName || 'tài khoản'}
                      </span>
                    </button>
                  </div>

                  {/* Thông báo nạp tiền thành công */}
                  {noticeMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      ✓ {noticeMsg}
                    </div>
                  )}

                  {/* Thông báo lỗi (VD: Không đủ số dư) */}
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start justify-between gap-3">
                      <span>✕ {errorMsg}</span>
                      {isInsufficient && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTopup(String(missingAmount));
                            setIsTopupOpen(true);
                          }}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
                        >
                          Nạp đủ tiền
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Các nút hành động thanh toán */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={status === 'PROCESSING' || timeLeft <= 0 || !selectedAccount}
                    className="w-full py-3.5 px-5 rounded-xl font-extrabold text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
                    style={{ backgroundColor: timeLeft <= 0 ? '#94A3B8' : accentColor }}
                  >
                    {status === 'PROCESSING'
                      ? 'Đang kiểm tra số dư & xử lý giao dịch...'
                      : `✓ Xác Nhận Thanh Toán (${vnd(amount)})`}
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCancelPayment}
                      disabled={status === 'PROCESSING'}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-red-50 border border-red-300 text-red-600 font-bold text-xs transition cursor-pointer"
                    >
                      ✕ Hủy &amp; Giải phóng ghế
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      disabled={status === 'PROCESSING'}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      ← Quay lại Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL NẠP TIỀN VÀO TÀI KHOẢN BÊN THỨ 3 */}
        {isTopupOpen && selectedAccount && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Nạp Tiền Vào {selectedAccount.bankOrWalletName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Số dư hiện tại: <strong className="text-slate-900">{vnd(selectedAccount.balance)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTopupOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {missingAmount > 0 && (
                <button
                  type="button"
                  disabled={isMutatingWallet}
                  onClick={() => handleWalletAction('topup', missingAmount)}
                  className="w-full mb-3 py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-sm transition cursor-pointer text-left flex justify-between items-center"
                >
                  <span>⚡ Nạp đúng số tiền đang thiếu</span>
                  <span>+{vnd(missingAmount)}</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[100000, 200000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isMutatingWallet}
                    onClick={() => handleWalletAction('topup', val)}
                    className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 font-bold text-sm transition cursor-pointer"
                    style={{ color: accentColor }}
                  >
                    +{vnd(val)}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Hoặc nhập số tiền tùy chỉnh (VNĐ):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={customTopup}
                    onChange={(e) => setCustomTopup(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    disabled={isMutatingWallet || !(Number(customTopup) > 0)}
                    onClick={() => handleWalletAction('topup', Number(customTopup))}
                    className="px-4 py-2 rounded-xl text-white font-bold text-sm cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                  >
                    Nạp tiền
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
