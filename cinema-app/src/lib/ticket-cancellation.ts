import crypto from 'node:crypto';
import { DiscountType, Prisma, TicketStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/error';

export type CancellationFault = 'CUSTOMER' | 'CINEMA';

export async function cancelTicket(input: {
  ticketId: number;
  actorId: number;
  actorRole: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  fault: CancellationFault;
  reason: string;
}) {
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT ticket_id FROM tickets WHERE ticket_id = ${input.ticketId} FOR UPDATE`;
    const ticket = await tx.ticket.findUnique({
      where: { id: input.ticketId },
      include: { user: true, screening: true, seat: true, payment: true },
    });
    if (!ticket) throw new AppError(404, 'Không tìm thấy vé', 'TICKET_NOT_FOUND');
    if (input.actorRole === 'CUSTOMER' && (ticket.userId !== input.actorId || input.fault !== 'CUSTOMER')) {
      throw new AppError(403, 'Bạn không có quyền hủy vé này', 'FORBIDDEN');
    }
    if (ticket.status !== TicketStatus.Valid) {
      throw new AppError(409, 'Vé đã dùng hoặc đã hủy', 'TICKET_NOT_VALID');
    }
    if (input.fault === 'CUSTOMER') {
      if (!ticket.screening || ticket.screening.startTime.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
        throw new AppError(400, 'Chỉ được hủy trước giờ chiếu ít nhất 2 tiếng', 'CANCELLATION_DEADLINE');
      }
    }
    const reason = input.reason.trim();
    if (!reason) throw new AppError(400, 'Vui lòng nhập lý do hủy', 'CANCELLATION_REASON_REQUIRED');

    await tx.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.Cancelled, cancellationReason: reason },
    });
    if (ticket.seatId) {
      await tx.seat.updateMany({
        where: { id: ticket.seatId, status: 'OCCUPIED' },
        data: { status: 'EMPTY', reservedUntil: null, holdUserId: null, holdPaymentId: null },
      });
    }

    let voucher: { code: string; expiryDate: Date } | null = null;
    let refund: { id: number; amount: Prisma.Decimal; claimDeadline: Date | null; status: string } | null = null;
    if (input.fault === 'CUSTOMER') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      const guest = ticket.user.email.includes('@guest.lumicinema.vn') || ticket.user.email.startsWith('guest_pos_');
      voucher = await tx.coupon.create({
        data: {
          code: `COMP50_${ticket.id}_${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
          sourceTicketId: ticket.id,
          discountType: DiscountType.Percentage,
          discountValue: 50,
          minAmount: 0,
          maxUsage: 1,
          usedCount: 0,
          expiryDate,
          userId: guest ? null : ticket.userId,
        },
        select: { code: true, expiryDate: true },
      });
    } else {
      if (ticket.payment.couponCode && ticket.paidPrice === null) {
        throw new AppError(409, 'Vé cũ thiếu giá thực trả; cần đối soát trước khi hoàn', 'MISSING_PAID_PRICE');
      }
      const paidAmount = ticket.paidPrice ?? ticket.price;
      const online = ticket.payment.paymentMethod === 'VNPay' || ticket.payment.paymentMethod === 'Momo';
      const claimDeadline = online ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
      refund = await tx.ticketRefund.create({
        data: { ticketId: ticket.id, amount: paidAmount, status: 'PENDING_REFUND', reason, claimDeadline },
        select: { id: true, amount: true, claimDeadline: true, status: true },
      });
    }
    await tx.cancellationAction.create({
      data: {
        ticketId: ticket.id,
        actorUserId: input.actorId,
        action: 'CANCEL_TICKET',
        reason,
        resolution: input.fault === 'CUSTOMER' ? 'VOUCHER_50' : 'PENDING_REFUND',
      },
    });
    return {
      ticketId: ticket.id,
      seatCode: ticket.seat?.code ?? null,
      customerEmail: guestEmail(ticket.user.email),
      customerName: ticket.user.name,
      voucher,
      refund: refund && { ...refund, amount: Number(refund.amount) },
      status: TicketStatus.Cancelled,
      reason,
    };
  });
  return result;
}

function guestEmail(email: string): string | null {
  return email.includes('@guest.lumicinema.vn') || email.startsWith('guest_pos_') ? null : email;
}
