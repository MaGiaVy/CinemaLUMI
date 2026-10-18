import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { PaymentStatus, SeatStatus, Ticket } from '@prisma/client';
import { sendTicketConfirmation } from '@/lib/email';
import { verifyVnpaySignature, VNPAY_CONFIG } from '@/lib/vnpay';

export const dynamic = 'force-dynamic';

/**
 * Interface kết quả xử lý Webhook IPN
 */
export interface VnpayIpnResult {
  RspCode: string;
  Message: string;
  payment_id: number;
  paymentId: number;
  status: PaymentStatus;
  tickets_created_count: number;
  ticketsCreatedCount: number;
  already_processed: boolean;
  alreadyProcessed: boolean;
}

/**
 * Hàm kiểm tra mã kết quả từ VNPay hoặc tham số status
 * '00' hoặc 'success' là thành công
 */
/**
 * Hàm lõi thực thi transaction cho Webhook VNPay IPN
 * Có thể tái sử dụng cho cả GET và POST
 */
export async function processVnpayIpnTransaction(
  paymentId: number,
  isSuccess: boolean,
  txnCode?: string | null,
  paidAmount?: number,
  expectedMethod: 'VNPay' | 'Momo' = 'VNPay'
): Promise<VnpayIpnResult> {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT payment_id FROM payments WHERE payment_id = ${paymentId} FOR UPDATE`;
    // 1. Tìm bản ghi Payment và các thông tin liên quan
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        orderCombos: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError(404, `Không tìm thấy đơn thanh toán #${paymentId}`, 'PAYMENT_NOT_FOUND');
    }
    if (payment.paymentMethod !== expectedMethod) {
      throw new AppError(409, 'Sai phương thức thanh toán', 'PAYMENT_METHOD_MISMATCH');
    }

    // Xác thực số tiền thực trả so với số tiền đã lưu trên hóa đơn Payment
    {
      if (paidAmount === undefined || !Number.isFinite(paidAmount) || Math.abs(Number(payment.amount) - paidAmount) > 0.01) {
        throw new AppError(
          400,
          `Số tiền thanh toán (${paidAmount}) không khớp với hóa đơn (#${paymentId}: ${Number(payment.amount)})`,
          'INVALID_AMOUNT'
        );
      }
    }

    // 2. IDEMPOTENCY CHECK (Chống xử lý trùng lặp):
    // Nếu đơn hàng đã hoàn tất thành công từ trước, trả về ngay lập tức
    if (payment.status === PaymentStatus.Success) {
      const ticketsCount = await tx.ticket.count({ where: { paymentId: payment.id } });
      return {
        RspCode: '02',
        Message: 'Order already confirmed',
        payment_id: payment.id,
        paymentId: payment.id,
        status: payment.status,
        tickets_created_count: ticketsCount,
        ticketsCreatedCount: ticketsCount,
        already_processed: true,
        alreadyProcessed: true,
      };
    }

    // Nếu đơn hàng đã bị đánh dấu FAILED từ trước mà lần này lại báo FAILED tiếp
    if (payment.status === PaymentStatus.Failed && !isSuccess) {
      return {
        RspCode: '02',
        Message: 'Order already failed',
        payment_id: payment.id,
        paymentId: payment.id,
        status: payment.status,
        tickets_created_count: 0,
        ticketsCreatedCount: 0,
        already_processed: true,
        alreadyProcessed: true,
      };
    }
    if (payment.status !== PaymentStatus.Pending) {
      throw new AppError(409, 'Đơn không còn chờ thanh toán', 'PAYMENT_NOT_PENDING');
    }

    // 3. LUỒNG XỬ LÝ KHI THANH TOÁN THÀNH CÔNG (SUCCESS)
    if (isSuccess) {
      const seatIds = Array.isArray(payment.seatIds) ? payment.seatIds.map(Number) : [];
      const now = new Date();
      if (!seatIds.length || new Set(seatIds).size !== seatIds.length) {
        throw new AppError(409, 'Đơn không có ghế hợp lệ', 'INVALID_PAYMENT_SEATS');
      }
      const occupied = await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          screeningId: payment.screeningId,
          status: SeatStatus.RESERVED,
          holdPaymentId: payment.id,
          reservedUntil: { gt: now },
          screening: { status: { notIn: ['CANCELLED', 'ENDED'] }, endTime: { gt: now } },
        },
        data: { status: SeatStatus.OCCUPIED, reservedUntil: null, holdUserId: null, holdPaymentId: null },
      });
      if (occupied.count !== seatIds.length) {
        throw new AppError(409, 'Lượt giữ ghế đã hết hạn hoặc không thuộc đơn', 'SEAT_HOLD_EXPIRED');
      }
      // 3.1. Cập nhật Payment thành SUCCESS
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.Success,
          transactionCode: txnCode || payment.transactionCode,
        },
      });

      // 3.2. Lấy danh sách ID các ghế ngồi đã đặt CHÍNH XÁC từ bản ghi Payment (chống can thiệp từ client)
      const screeningId = payment.screeningId || null;
      const createdTickets: Ticket[] = [];

      if (seatIds.length > 0) {
        // Cập nhật trạng thái các ghế sang OCCUPIED (Đã chính thức có chủ)
        // Lấy giá gốc của suất chiếu
        let basePrice = 100000;
        if (screeningId) {
          const screening = await tx.screening.findUnique({
            where: { id: screeningId },
            select: { price: true },
          });
          if (screening) {
            basePrice = Number(screening.price);
          }
        }

        // Tạo bản ghi Ticket cho từng ghế
        const rawTicketItems = Array.isArray(payment.ticketItems)
          ? (payment.ticketItems as Array<{ type: string; unit_price?: number; seatId?: number; originalPrice?: number; discountAmount?: number; paidPrice?: number }>)
          : [];

        for (let i = 0; i < seatIds.length; i++) {
          const sId = seatIds[i];
          const item = rawTicketItems[i];
          const ticketType = item?.type || 'Thường';
          const originalPrice = item?.originalPrice ?? item?.unit_price ?? basePrice;
          const discount = item?.discountAmount ?? 0;
          const ticketPrice = item?.paidPrice ?? originalPrice;
          if (item?.seatId !== undefined && item.seatId !== sId) {
            throw new AppError(409, 'Thông tin giá vé và ghế không khớp', 'TICKET_SNAPSHOT_MISMATCH');
          }

          const newTicket = await tx.ticket.create({
            data: {
              userId: payment.userId,
              screeningId: screeningId,
              seatId: sId,
              paymentId: payment.id,
              ticketType,
              price: ticketPrice,
              originalPrice,
              discountAmount: discount,
              paidPrice: ticketPrice,
              status: 'Valid',
            },
          });
          createdTickets.push(newTicket);
        }
      }

      // Kho đã bị trừ khi giữ combo; hoàn tất đúng reservation của đơn này.
      if (payment.orderCombos && payment.orderCombos.length > 0) {
        for (const orderCombo of payment.orderCombos) {
          if (!orderCombo.reservationId) throw new AppError(409, 'Đơn combo cũ cần đối soát thủ công', 'LEGACY_COMBO_RECONCILIATION');
          const completed = await tx.comboReservation.updateMany({
            where: {
              id: orderCombo.reservationId,
              comboId: orderCombo.comboId,
              quantity: orderCombo.quantity,
              paymentId: payment.id,
              status: 'RESERVED',
            },
            data: {
              status: 'COMPLETED',
            },
          });
          if (completed.count !== 1) throw new AppError(409, 'Lượt giữ combo không còn hợp lệ', 'COMBO_HOLD_EXPIRED');
        }
      }

      // 3.4. Tăng số lần sử dụng của Coupon (nếu có áp dụng)
      const finalCouponCode = payment.couponCode;
      if (finalCouponCode && finalCouponCode.trim() && !payment.couponReserved) {
        await tx.coupon.updateMany({
          where: { code: finalCouponCode.trim().toUpperCase() },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      return {
        RspCode: '00',
        Message: 'Confirm Success',
        payment_id: updatedPayment.id,
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
        tickets_created_count: createdTickets.length,
        ticketsCreatedCount: createdTickets.length,
        already_processed: false,
        alreadyProcessed: false,
      };
    }

    // 4. LUỒNG XỬ LÝ KHI THANH TOÁN THẤT BẠI (FAILED / CANCELLED / TIMEOUT)
    // 4.1. Cập nhật Payment thành FAILED
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.Failed,
      },
    });

    // 4.2. Giải phóng (release) toàn bộ ghế đã giữ về trạng thái EMPTY từ bản ghi Payment gốc
    let seatIds: number[] = [];
    if (Array.isArray(payment.seatIds)) {
      seatIds = payment.seatIds as number[];
    }

    if (seatIds.length > 0) {
      await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          status: SeatStatus.RESERVED,
          holdPaymentId: payment.id,
        },
        data: {
          status: SeatStatus.EMPTY,
          reservedUntil: null,
          holdUserId: null,
          holdPaymentId: null,
        },
      });
    }

    // 4.3. Giải phóng toàn bộ bắp nước đã giữ về lại tồn kho
    if (payment.orderCombos && payment.orderCombos.length > 0) {
      for (const orderCombo of payment.orderCombos) {
        // Cập nhật trạng thái reservation thành RELEASED
        if (orderCombo.reservationId) {
          const released = await tx.comboReservation.updateMany({
            where: { id: orderCombo.reservationId, paymentId: payment.id, status: 'RESERVED' },
            data: { status: 'RELEASED' },
          });
          if (released.count === 1) {
            await tx.combo.update({ where: { id: orderCombo.comboId }, data: { stock: { increment: orderCombo.quantity } } });
          }
        }
      }
    }

    if (payment.couponCode && payment.couponReserved) {
      await tx.coupon.updateMany({
        where: { code: payment.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
      await tx.payment.update({ where: { id: payment.id }, data: { couponReserved: false } });
    }

    return {
      RspCode: '00',
      Message: 'Payment marked as Failed, resources released successfully',
      payment_id: updatedPayment.id,
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      tickets_created_count: 0,
      ticketsCreatedCount: 0,
      already_processed: false,
      alreadyProcessed: false,
    };
  });

  // Gửi email xác nhận đặt vé kèm QR Code cho khách hàng khi thanh toán thành công (Phase 14)
  if (isSuccess && !result.already_processed) {
    (async () => {
      try {
        const freshPayment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: {
            user: true,
            tickets: {
              include: {
                seat: true,
                screening: {
                  include: { movie: true },
                },
              },
            },
            orderCombos: {
              include: { combo: true },
            },
          },
        });

        if (freshPayment?.user?.email && freshPayment.tickets.length > 0) {
          const firstTicket = freshPayment.tickets[0];
          const screening = firstTicket.screening;
          const movie = screening?.movie;
          const seatCodes = freshPayment.tickets
            .map((t) => t.seat?.code)
            .filter(Boolean)
            .join(', ');

          const qrData = JSON.stringify({
            payment_id: freshPayment.id,
            tickets: freshPayment.tickets.map((t) => t.id),
            user_id: freshPayment.userId,
            screening_id: screening?.id,
            timestamp: Date.now(),
          });

          await sendTicketConfirmation(
            freshPayment.user.email,
            {
              customerName: freshPayment.user.name || undefined,
              ticketId: firstTicket.id,
              ticketCode: `LMC-PAY-${freshPayment.id}`,
              movieTitle: movie?.title || 'Phim rạp Lumi Cinema',
              room: screening ? `Phòng ${screening.roomNumber}` : 'Phòng tiêu chuẩn',
              screeningTime: screening?.startTime
                ? new Date(screening.startTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Giờ chiếu',
              date: screening?.startTime
                ? new Date(screening.startTime).toLocaleDateString('vi-VN')
                : 'Hôm nay',
              seats: seatCodes || 'Chưa xếp chỗ',
              combos: freshPayment.orderCombos.map((oc) => ({
                name: oc.combo?.name || 'Combo bắp nước',
                quantity: oc.quantity,
              })),
              totalAmount: Number(freshPayment.amount),
              paymentMethod: freshPayment.paymentMethod || 'VNPay',
            },
            qrData
          );
        }
      } catch (mailErr) {
        console.warn('[EmailService] Async ticket confirmation dispatch failed:', mailErr);
      }
    })();
  }

  return result;
}

/**
 * GET /api/payments/vnpay-ipn
 * 
 * Webhook chạy ngầm nhận thông báo từ cổng VNPay Server-to-Server:
 * - Query params:
 *   - vnp_TxnRef hoặc payment_id
 *   - vnp_ResponseCode ('00' là thành công) hoặc status ('success' | 'failed')
 *   - vnp_TransactionNo (mã giao dịch VNPay)
 * - Xử lý nguyên tử qua prisma.$transaction.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 0. XÁC THỰC CHỮ KÝ SỐ VNPAY (Secure Hash Checksum)
    const secureHash = searchParams.get('vnp_SecureHash');
    if (secureHash && VNPAY_CONFIG.tmnCode && VNPAY_CONFIG.hashSecret) {
      const vnpParams: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        if (key.startsWith('vnp_')) {
          vnpParams[key] = val;
        }
      });
      const isValid = verifyVnpaySignature(vnpParams, secureHash);
      if (!isValid || searchParams.get('vnp_TmnCode') !== VNPAY_CONFIG.tmnCode) {
        return apiResponse(
          false,
          { RspCode: '97', Message: 'Invalid Checksum' },
          'Chữ ký số xác thực giao dịch VNPay không hợp lệ (RspCode 97)',
          400
        );
      }
    } else {
      return apiResponse(false, { RspCode: '97', Message: 'Missing Checksum' }, 'Thiếu cấu hình hoặc chữ ký VNPay', 400);
    }

    // Trích xuất mã đơn hàng
    const rawPaymentId = searchParams.get('vnp_TxnRef');

    if (!rawPaymentId) {
      throw new AppError(400, 'Thiếu thông tin mã đơn thanh toán (payment_id hoặc vnp_TxnRef)', 'MISSING_PAYMENT_ID');
    }

    const paymentId = Number(rawPaymentId);
    if (!/^\d+$/.test(rawPaymentId) || !Number.isSafeInteger(paymentId) || paymentId <= 0) {
      throw new AppError(400, 'Mã đơn thanh toán (payment_id) không hợp lệ', 'INVALID_PAYMENT_ID');
    }

    const responseCodeParam = searchParams.get('vnp_ResponseCode');
    const txnCode = searchParams.get('vnp_TransactionNo');

    // Xác thực số tiền thực trả từ VNPay
    const rawVnpAmount = searchParams.get('vnp_Amount');
    if (!rawVnpAmount || !/^\d+$/.test(rawVnpAmount) || !responseCodeParam || !searchParams.get('vnp_TransactionStatus') || (responseCodeParam === '00' && !txnCode)) {
      throw new AppError(400, 'Thiếu thông tin giao dịch VNPay', 'INVALID_VNPAY_CALLBACK');
    }
    const paidAmount = Number(rawVnpAmount) / 100;
    const isSuccess = responseCodeParam === '00' && searchParams.get('vnp_TransactionStatus') === '00';

    const ipnResult = await processVnpayIpnTransaction(
      paymentId,
      isSuccess,
      txnCode,
      paidAmount
    );

    return apiResponse(
      true,
      ipnResult,
      isSuccess ? 'Xử lý thanh toán thành công (IPN Success)' : 'Giao dịch bị hủy / thất bại (IPN Failed)',
      200
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return apiResponse(
      false,
      { RspCode: '99', Message: errorResponse.error },
      errorResponse.error,
      errorResponse.statusCode,
      errorResponse.code,
      errorResponse.error
    );
  }
}

/** VNPay gửi IPN bằng GET; không nhận payload JSON tự khai báo. */
export async function POST() {
  return apiResponse(false, undefined, 'Phương thức không được hỗ trợ', 405);
}
