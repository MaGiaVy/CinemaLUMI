import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processZaloPayPaymentSuccess } from '../zalopay-ipn/route';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/zalopay-return
 * 
 * Endpoint tiếp nhận kết quả chuyển hướng từ ZaloPay sau khi khách hàng hoàn tất hoặc hủy thanh toán:
 * 1. Đọc các tham số: apptransid, status, amount, payment_id.
 * 2. Xác định trạng thái thành công (status === '1' | 'success').
 * 3. Đồng bộ hóa đơn vào DB qua processZaloPayPaymentSuccess (Idempotent).
 * 4. Chuyển hướng người dùng về trang /payment-result với các tham số tương ứng.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const appTransId =
    searchParams.get('apptransid') ||
    searchParams.get('app_trans_id') ||
    searchParams.get('txn_code') ||
    '';

  const rawStatus = searchParams.get('status') || '';
  const isSuccess = rawStatus === '1' || rawStatus.toLowerCase() === 'success';

  const rawAmount = searchParams.get('amount');
  const paidAmount = rawAmount ? Number(rawAmount) : undefined;

  let paymentId: number | null = null;
  const rawPaymentId = searchParams.get('payment_id') || searchParams.get('order_id');
  if (rawPaymentId) {
    paymentId = parseInt(rawPaymentId, 10);
  }

  // Nếu chưa có paymentId nhưng có appTransId, truy vấn DB để lấy ID đơn hàng
  if (!paymentId && appTransId) {
    const p = await prisma.payment.findFirst({
      where: { transactionCode: appTransId },
      select: { id: true },
    });
    if (p) {
      paymentId = p.id;
    }
  }

  // Đồng bộ trạng thái đơn hàng ngay lập tức nếu thanh toán thành công
  if (isSuccess && appTransId) {
    try {
      await processZaloPayPaymentSuccess(appTransId, paidAmount);
    } catch (err) {
      console.error('[ZaloPay Return] Lỗi đồng bộ trạng thái đơn hàng:', err);
    }
  }

  // Tạo URL chuyển hướng về trang /payment-result
  const resultUrl = new URL('/payment-result', request.url);
  resultUrl.searchParams.set('status', isSuccess ? 'success' : 'failed');

  if (paymentId) {
    resultUrl.searchParams.set('order_id', String(paymentId));
    resultUrl.searchParams.set('payment_id', String(paymentId));
  }

  if (appTransId) {
    resultUrl.searchParams.set('app_trans_id', appTransId);
    resultUrl.searchParams.set('txn_code', appTransId);
  }

  if (paidAmount !== undefined && !isNaN(paidAmount)) {
    resultUrl.searchParams.set('amount', String(paidAmount));
  }

  return NextResponse.redirect(resultUrl);
}
