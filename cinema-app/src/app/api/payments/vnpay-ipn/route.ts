import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { PaymentStatus, SeatStatus, Ticket } from '@prisma/client';
import { sendTicketConfirmation } from '@/lib/email';

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
function isPaymentSuccessful(statusParam?: string | null, responseCodeParam?: string | null): boolean {
  if (responseCodeParam && responseCodeParam.trim() === '00') {
    return true;
  }
  if (statusParam) {
    const normalized = statusParam.trim().toLowerCase();
    return normalized === 'success' || normalized === '00' || normalized === 'completed';
  }
  return false;
}

/**
 * Hàm lõi thực thi transaction cho Webhook VNPay IPN
 * Có thể tái sử dụng cho cả GET và POST
 */
export async function processVnpayIpnTransaction(
  paymentId: number,
  isSuccess: boolean,
  txnCode?: string | null,
  overrideSeatIds?: number[],
  overrideScreeningId?: number,
  overrideCouponCode?: string
): Promise<VnpayIpnResult> {
  const result = await prisma.$transaction(async (tx) => {
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

    // 3. LUỒNG XỬ LÝ KHI THANH TOÁN THÀNH CÔNG (SUCCESS)
    if (isSuccess) {
      // 3.1. Cập nhật Payment thành SUCCESS
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.Success,
          transactionCode: txnCode || payment.transactionCode,
        },
      });

      // 3.2. Lấy danh sách ID các ghế ngồi đã đặt
      let seatIds: number[] = [];
      if (overrideSeatIds && overrideSeatIds.length > 0) {
        seatIds = overrideSeatIds;
      } else if (Array.isArray(payment.seatIds)) {
        seatIds = payment.seatIds as number[];
      }

      const screeningId = overrideScreeningId || payment.screeningId || null;
      const createdTickets: Ticket[] = [];

      if (seatIds.length > 0) {
        // Cập nhật trạng thái các ghế sang OCCUPIED (Đã chính thức có chủ)
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: SeatStatus.OCCUPIED,
            reservedUntil: null,
          },
        });

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
          ? (payment.ticketItems as Array<{ type: string; unit_price?: number }>)
          : [];

        for (let i = 0; i < seatIds.length; i++) {
          const sId = seatIds[i];
          const item = rawTicketItems[i];
          const ticketType = item?.type || 'Thường';
          const ticketPrice = item?.unit_price || basePrice;

          const newTicket = await tx.ticket.create({
            data: {
              userId: payment.userId,
              screeningId: screeningId,
              seatId: sId,
              paymentId: payment.id,
              ticketType,
              price: ticketPrice,
              status: 'Valid',
            },
          });
          createdTickets.push(newTicket);
        }
      }

      // 3.3. Trừ dứt điểm tồn kho Combo và hoàn tất giữ chỗ combo
      if (payment.orderCombos && payment.orderCombos.length > 0) {
        for (const orderCombo of payment.orderCombos) {
          // Trừ trực tiếp số lượng tồn kho của combo nếu chưa trừ
          await tx.combo.updateMany({
            where: {
              id: orderCombo.comboId,
              stock: { gte: orderCombo.quantity },
            },
            data: {
              stock: { decrement: orderCombo.quantity },
            },
          });

          // Cập nhật trạng thái các bản ghi combo_reservations thành COMPLETED
          await tx.comboReservation.updateMany({
            where: {
              comboId: orderCombo.comboId,
              status: 'RESERVED',
            },
            data: {
              status: 'COMPLETED',
            },
          });
        }
      }

      // 3.4. Tăng số lần sử dụng của Coupon (nếu có áp dụng)
      const finalCouponCode = overrideCouponCode || payment.couponCode;
      if (finalCouponCode && finalCouponCode.trim()) {
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

    // 4.2. Giải phóng (release) toàn bộ ghế đã giữ về trạng thái EMPTY
    let seatIds: number[] = [];
    if (overrideSeatIds && overrideSeatIds.length > 0) {
      seatIds = overrideSeatIds;
    } else if (Array.isArray(payment.seatIds)) {
      seatIds = payment.seatIds as number[];
    }

    if (seatIds.length > 0) {
      await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          status: SeatStatus.RESERVED,
        },
        data: {
          status: SeatStatus.EMPTY,
          reservedUntil: null,
        },
      });
    }

    // 4.3. Giải phóng toàn bộ bắp nước đã giữ về lại tồn kho
    if (payment.orderCombos && payment.orderCombos.length > 0) {
      for (const orderCombo of payment.orderCombos) {
        // Cập nhật trạng thái reservation thành RELEASED
        await tx.comboReservation.updateMany({
          where: {
            comboId: orderCombo.comboId,
            status: 'RESERVED',
          },
          data: {
            status: 'RELEASED',
          },
        });
      }
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

    // Trích xuất mã đơn hàng
    const rawPaymentId =
      searchParams.get('payment_id') ||
      searchParams.get('paymentId') ||
      searchParams.get('vnp_TxnRef');

    if (!rawPaymentId) {
      throw new AppError(400, 'Thiếu thông tin mã đơn thanh toán (payment_id hoặc vnp_TxnRef)', 'MISSING_PAYMENT_ID');
    }

    const paymentId = parseInt(rawPaymentId, 10);
    if (isNaN(paymentId) || paymentId <= 0) {
      throw new AppError(400, 'Mã đơn thanh toán (payment_id) không hợp lệ', 'INVALID_PAYMENT_ID');
    }

    const statusParam = searchParams.get('status');
    const responseCodeParam = searchParams.get('vnp_ResponseCode') || searchParams.get('code');
    const txnCode = searchParams.get('vnp_TransactionNo') || searchParams.get('txn_code');

    // Các tham số bổ sung nếu có
    const rawSeats = searchParams.get('seat_ids') || searchParams.get('seats');
    const overrideSeatIds = rawSeats
      ? rawSeats.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
      : undefined;

    const rawScreening = searchParams.get('screening_id');
    const overrideScreeningId = rawScreening ? parseInt(rawScreening, 10) : undefined;
    const overrideCouponCode = searchParams.get('coupon_code') || undefined;

    const isSuccess = isPaymentSuccessful(statusParam, responseCodeParam);

    const ipnResult = await processVnpayIpnTransaction(
      paymentId,
      isSuccess,
      txnCode,
      overrideSeatIds,
      overrideScreeningId,
      overrideCouponCode
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

/**
 * POST /api/payments/vnpay-ipn
 * Hỗ trợ nhận webhook dạng POST từ các môi trường kiểm thử
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      // Body rỗng hoặc không phải JSON
    }

    const rawPaymentId =
      body.payment_id ?? body.paymentId ?? body.vnp_TxnRef ?? request.nextUrl.searchParams.get('payment_id');

    if (!rawPaymentId) {
      throw new AppError(400, 'Thiếu thông tin mã đơn thanh toán (payment_id)', 'MISSING_PAYMENT_ID');
    }

    const paymentId = Number(rawPaymentId);
    if (isNaN(paymentId) || paymentId <= 0) {
      throw new AppError(400, 'Mã đơn thanh toán không hợp lệ', 'INVALID_PAYMENT_ID');
    }

    const statusParam = (body.status as string) || request.nextUrl.searchParams.get('status');
    const responseCode = (body.vnp_ResponseCode as string) || request.nextUrl.searchParams.get('vnp_ResponseCode');
    const txnCode = (body.vnp_TransactionNo as string) || (body.txn_code as string);

    const isSuccess = isPaymentSuccessful(statusParam, responseCode);

    const ipnResult = await processVnpayIpnTransaction(
      paymentId,
      isSuccess,
      txnCode
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
