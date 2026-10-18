import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const paymentId = Number(id);
    if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
      return apiResponse(false, undefined, 'Mã đơn không hợp lệ', 400);
    }
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: user.id },
      select: { id: true, amount: true, status: true, paymentMethod: true },
    });
    if (!payment) return apiResponse(false, undefined, 'Không tìm thấy đơn', 404);
    return apiResponse(true, {
      id: payment.id,
      amount: Number(payment.amount),
      status: payment.status,
      paymentMethod: payment.paymentMethod,
    });
  } catch (error) {
    const result = handleError(error);
    return apiResponse(false, undefined, result.error, result.statusCode, result.code);
  }
}
