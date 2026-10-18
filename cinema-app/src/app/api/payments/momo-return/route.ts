import { NextRequest, NextResponse } from 'next/server';
import { verifyMomoCallback } from '@/lib/momo';
import { processVnpayIpnTransaction } from '../vnpay-ipn/route';

export async function GET(request: NextRequest) {
  const data: Record<string, unknown> = Object.fromEntries(request.nextUrl.searchParams);
  const destination = new URL('/payment-result', request.url);
  const paymentId = Number(data.orderId);
  if (!verifyMomoCallback(data) || !Number.isSafeInteger(paymentId) || paymentId <= 0) {
    destination.searchParams.set('error', 'Không xác thực được kết quả MoMo');
    return NextResponse.redirect(destination);
  }
  destination.searchParams.set('payment_id', String(paymentId));
  try {
    await processVnpayIpnTransaction(paymentId, Number(data.resultCode) === 0, String(data.transId), Number(data.amount), 'Momo');
  } catch {
    // Trang kết quả truy vấn trạng thái thật từ DB; IPN có thể đến sau return.
  }
  return NextResponse.redirect(destination);
}
