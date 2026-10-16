import { NextRequest, NextResponse } from 'next/server';
import { processVnpayIpnTransaction } from '../vnpay-ipn/route';
import { handleError } from '@/lib/error';
import { verifyVnpaySignature } from '@/lib/vnpay';

export const dynamic = 'force-dynamic';

/**
 * Hàm kiểm tra tính thành công của giao dịch từ VNPay
 */
function checkIsSuccess(statusParam?: string | null, responseCode?: string | null): boolean {
  if (responseCode && responseCode.trim() === '00') {
    return true;
  }
  if (statusParam) {
    const s = statusParam.trim().toLowerCase();
    return s === 'success' || s === '00' || s === 'completed';
  }
  return false;
}

/**
 * GET /api/payments/vnpay-return
 * 
 * Endpoint tiếp nhận kết quả chuyển hướng từ cổng thanh toán VNPay khi khách hàng hoàn tất hoặc hủy giao dịch:
 * 1. Trích xuất thông tin giao dịch từ query parameters:
 *    - payment_id / vnp_TxnRef
 *    - vnp_ResponseCode (mã '00' đại diện cho thanh toán thành công)
 *    - status ('success' | 'failed')
 *    - vnp_TransactionNo (mã giao dịch do VNPay cấp)
 * 2. Đồng bộ trạng thái vào cơ sở dữ liệu ngay lập tức (thông qua processVnpayIpnTransaction có tính Idempotent)
 *    để đảm bảo giao diện người dùng nhận được trạng thái mới nhất ngay cả khi Webhook IPN chạy ngầm bị trễ.
 * 3. Chuyển hướng (Redirect) khách hàng về trang thông báo 'Thành công' hoặc 'Thất bại' trên giao diện.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // 0. XÁC THỰC CHỮ KÝ SỐ VNPAY RETURN
  const secureHash = searchParams.get('vnp_SecureHash');
  const isProduction = process.env.NODE_ENV === 'production';
  const isMock = !isProduction && searchParams.get('mock') === 'true';

  if (secureHash) {
    const vnpParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith('vnp_')) {
        vnpParams[key] = val;
      }
    });

    const isValid = verifyVnpaySignature(vnpParams, secureHash);
    if (!isValid && (isProduction || secureHash !== 'mock_sandbox_verified')) {
      console.warn('[VNPayReturn] Chữ ký số không khớp:', secureHash);
      const errorUrl = new URL('/payment-result', request.url);
      errorUrl.searchParams.set('status', 'failed');
      errorUrl.searchParams.set('error', 'Chữ ký số xác thực giao dịch không hợp lệ (Invalid Checksum)');
      return NextResponse.redirect(errorUrl);
    }
  } else if (isProduction || !isMock) {
    const errorUrl = new URL('/payment-result', request.url);
    errorUrl.searchParams.set('status', 'failed');
    errorUrl.searchParams.set('error', 'Yêu cầu chữ ký số bảo mật từ cổng thanh toán');
    return NextResponse.redirect(errorUrl);
  }

  const rawPaymentId =
    searchParams.get('payment_id') ||
    searchParams.get('paymentId') ||
    searchParams.get('vnp_TxnRef');

  const statusParam = searchParams.get('status');
  const responseCode = searchParams.get('vnp_ResponseCode') || searchParams.get('code') || '99';
  const txnCode = searchParams.get('vnp_TransactionNo') || searchParams.get('txn_code');
  const rawVnpAmount = searchParams.get('vnp_Amount') || searchParams.get('amount');
  const paidAmount = rawVnpAmount
    ? Number(rawVnpAmount) > 1000000 && String(rawVnpAmount).endsWith('00')
      ? Number(rawVnpAmount) / 100
      : Number(rawVnpAmount)
    : undefined;
  const orderInfo = searchParams.get('order_info') || searchParams.get('vnp_OrderInfo');

  const isSuccess = checkIsSuccess(statusParam, responseCode);

  // Nếu không có payment_id, chuyển hướng về trang báo lỗi chung
  if (!rawPaymentId) {
    const errorUrl = new URL('/payment-result', request.url);
    errorUrl.searchParams.set('status', 'failed');
    errorUrl.searchParams.set('error', 'Không tìm thấy thông tin mã đơn hàng thanh toán');
    return NextResponse.redirect(errorUrl);
  }

  const paymentId = parseInt(rawPaymentId, 10);
  if (isNaN(paymentId) || paymentId <= 0) {
    const errorUrl = new URL('/payment-result', request.url);
    errorUrl.searchParams.set('status', 'failed');
    errorUrl.searchParams.set('error', 'Mã đơn thanh toán không hợp lệ');
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Tự động đồng bộ Database thông qua transaction có tính chống trùng lặp (Idempotent)
    await processVnpayIpnTransaction(
      paymentId,
      isSuccess,
      txnCode,
      paidAmount
    );
  } catch (error) {
    const errorResponse = handleError(error);
    console.error('[VNPayReturn] Lỗi khi đồng bộ kết quả đơn hàng:', errorResponse.error);
  }

  // Tạo URL chuyển hướng về trang kết quả trên Frontend
  const resultUrl = new URL('/payment-result', request.url);
  resultUrl.searchParams.set('payment_id', String(paymentId));
  resultUrl.searchParams.set('status', isSuccess ? 'success' : 'failed');
  resultUrl.searchParams.set('code', isSuccess ? '00' : responseCode);

  if (paidAmount !== undefined) {
    resultUrl.searchParams.set('amount', String(paidAmount));
  }

  if (orderInfo) {
    resultUrl.searchParams.set('order_info', orderInfo);
  }

  if (txnCode) {
    resultUrl.searchParams.set('txn_code', txnCode);
  }

  return NextResponse.redirect(resultUrl);
}
