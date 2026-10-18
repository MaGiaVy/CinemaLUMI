import { NextRequest } from 'next/server';
import { verifyMomoCallback } from '@/lib/momo';
import { processVnpayIpnTransaction } from '../vnpay-ipn/route';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as Record<string, unknown>;
    if (!verifyMomoCallback(data)) return apiResponse(false, undefined, 'Chữ ký MoMo không hợp lệ', 400);
    const paymentId = Number(data.orderId);
    const amount = Number(data.amount);
    if (!Number.isSafeInteger(paymentId) || paymentId <= 0 || !Number.isSafeInteger(amount) || amount < 0) {
      return apiResponse(false, undefined, 'Thông tin giao dịch không hợp lệ', 400);
    }
    const result = await processVnpayIpnTransaction(paymentId, Number(data.resultCode) === 0, String(data.transId), amount, 'Momo');
    return apiResponse(true, result);
  } catch (error) {
    const result = handleError(error);
    return apiResponse(false, undefined, result.error, result.statusCode, result.code);
  }
}
