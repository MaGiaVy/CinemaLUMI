import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const releaseSchema = z.object({
  reservation_ids: z.array(z.number().int().positive()).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['CUSTOMER']);
    const parsed = releaseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || new Set(parsed.data.reservation_ids).size !== parsed.data.reservation_ids.length) {
      throw new AppError(400, 'Danh sách mã giữ combo không hợp lệ', 'INVALID_RESERVATION_IDS');
    }
    const result = await prisma.$transaction(async tx => {
      const reservations = await tx.comboReservation.findMany({
        where: { id: { in: parsed.data.reservation_ids }, userId: user.id, paymentId: null, status: 'RESERVED' },
      });
      if (reservations.length !== parsed.data.reservation_ids.length) {
        throw new AppError(409, 'Có combo không thuộc lượt giữ của bạn hoặc đã xử lý', 'COMBO_HOLD_CONFLICT');
      }
      let restored = 0;
      for (const reservation of reservations) {
        const updated = await tx.comboReservation.updateMany({
          where: { id: reservation.id, userId: user.id, paymentId: null, status: 'RESERVED' },
          data: { status: 'RELEASED' },
        });
        if (updated.count !== 1) throw new AppError(409, 'Lượt giữ combo vừa thay đổi', 'COMBO_HOLD_CONFLICT');
        await tx.combo.update({ where: { id: reservation.comboId }, data: { stock: { increment: reservation.quantity } } });
        restored += reservation.quantity;
      }
      return { released_reservations_count: reservations.length, restored_stock_total: restored, released_at: new Date().toISOString() };
    });
    return apiResponse(true, result, 'Đã giải phóng combo của bạn');
  } catch (error) {
    const result = handleError(error);
    return apiResponse(false, undefined, result.error, result.statusCode, result.code);
  }
}
