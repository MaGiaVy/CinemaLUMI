import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireAuth(['STAFF', 'ADMIN']);
    const { id } = await params;
    const ticketId = Number(id);
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
      return apiResponse(false, undefined, 'Mã vé không hợp lệ', 400);
    }
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT refund_id FROM ticket_refunds WHERE ticket_id = ${ticketId} FOR UPDATE`;
      const refund = await tx.ticketRefund.findUnique({ where: { ticketId }, include: { ticket: true } });
      if (!refund) throw new AppError(404, 'Vé không có khoản chờ hoàn', 'REFUND_NOT_FOUND');
      if (refund.status !== 'PENDING_REFUND' || refund.ticket.status !== 'Cancelled') {
        throw new AppError(409, 'Khoản hoàn đã xử lý', 'REFUND_ALREADY_PROCESSED');
      }
      const now = new Date();
      if (refund.claimDeadline && refund.claimDeadline < now) {
        throw new AppError(409, 'Đã quá 30 ngày nhận tiền hoàn', 'REFUND_CLAIM_EXPIRED');
      }
      const paid = await tx.ticketRefund.update({
        where: { id: refund.id },
        data: { status: 'REFUNDED', confirmedById: staff.id, confirmedAt: now },
      });
      await tx.cancellationAction.create({
        data: {
          ticketId,
          actorUserId: staff.id,
          action: 'CONFIRM_CASH_REFUND',
          reason: refund.reason,
          resolution: 'REFUNDED',
        },
      });
      return { ticket_id: ticketId, status: paid.status, amount: Number(paid.amount), confirmed_at: now.toISOString() };
    });
    return apiResponse(true, result, 'Đã xác nhận trả tiền mặt');
  } catch (error) {
    const result = handleError(error);
    return apiResponse(false, undefined, result.error, result.statusCode, result.code);
  }
}
