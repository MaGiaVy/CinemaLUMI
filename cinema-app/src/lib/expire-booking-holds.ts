import { Prisma } from '@prisma/client';

/** Expire only payments whose ten-minute seat hold has actually elapsed. */
export async function expireBookingHolds(tx: Prisma.TransactionClient, now: Date, screeningId?: number) {
  const candidates = await tx.payment.findMany({
    where: {
      status: 'Pending',
      ...(screeningId === undefined ? {} : { screeningId }),
      OR: [
        { createdAt: { lt: new Date(now.getTime() - 10 * 60 * 1000) } },
        { heldSeats: { some: { status: 'RESERVED', reservedUntil: { lt: now } } } },
      ],
    },
    select: { id: true },
  });
  let expiredPayments = 0;
  let restoredVouchers = 0;
  for (const candidate of candidates) {
    await tx.$queryRaw`SELECT payment_id FROM payments WHERE payment_id = ${candidate.id} FOR UPDATE`;
    const payment = await tx.payment.findUnique({
      where: { id: candidate.id },
      include: { orderCombos: true, heldSeats: { select: { reservedUntil: true, status: true } } },
    });
    if (!payment || payment.status !== 'Pending') continue;
    const expired = payment.createdAt.getTime() < now.getTime() - 10 * 60 * 1000 ||
      payment.heldSeats.some(seat => seat.status === 'RESERVED' && seat.reservedUntil && seat.reservedUntil < now);
    if (!expired) continue;

    if (payment.couponCode && payment.couponReserved) {
      const restored = await tx.coupon.updateMany({
        where: { code: payment.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
      restoredVouchers += restored.count;
    }
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'Failed', couponReserved: false } });
    for (const orderCombo of payment.orderCombos) {
      if (!orderCombo.reservationId) continue;
      const released = await tx.comboReservation.updateMany({
        where: { id: orderCombo.reservationId, paymentId: payment.id, status: 'RESERVED' },
        data: { status: 'RELEASED' },
      });
      if (released.count === 1) {
        await tx.combo.update({ where: { id: orderCombo.comboId }, data: { stock: { increment: orderCombo.quantity } } });
      }
    }
    await tx.seat.updateMany({
      where: { holdPaymentId: payment.id, status: 'RESERVED' },
      data: { status: 'EMPTY', reservedUntil: null, holdUserId: null, holdPaymentId: null },
    });
    expiredPayments++;
  }
  return { expiredPayments, restoredVouchers };
}
