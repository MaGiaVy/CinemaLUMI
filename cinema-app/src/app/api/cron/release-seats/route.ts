import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expireBookingHolds } from '@/lib/expire-booking-holds';
import { handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
      return apiResponse(false, undefined, 'Không có quyền chạy cron', 401, 'UNAUTHORIZED');
    }
    const now = new Date();
    const result = await prisma.$transaction(async tx => {
      const expired = await expireBookingHolds(tx, now);
      const seats = await tx.seat.updateMany({
        where: { status: 'RESERVED', holdPaymentId: null, reservedUntil: { lt: now } },
        data: { status: 'EMPTY', reservedUntil: null, holdUserId: null, holdPaymentId: null },
      });
      return { ...expired, releasedSeats: seats.count };
    });
    return apiResponse(true, {
      released_count: result.releasedSeats,
      expired_payments_count: result.expiredPayments,
      restored_vouchers_count: result.restoredVouchers,
      scanned_at: now.toISOString(),
    }, 'Đã giải phóng các lượt giữ hết hạn');
  } catch (error) {
    const result = handleError(error);
    return apiResponse(false, undefined, result.error, result.statusCode, result.code);
  }
}
