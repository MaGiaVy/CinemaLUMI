import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, SeatStatus } from '@prisma/client';
import { verifyZaloPayCallback } from '@/lib/zalopay';
import { sendTicketConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Interface kết quả xử lý Webhook ZaloPay IPN
 */
export interface ZaloPayIpnResult {
  return_code: number;
  return_message: string;
  payment_id?: number;
  tickets_created_count?: number;
  already_processed?: boolean;
}

/**
 * Hàm lõi thực thi transaction cho Webhook ZaloPay IPN
 * Có tính Idempotency: nếu đơn đã Success thì không xử lý lại
 */
export async function processZaloPayPaymentSuccess(
  appTransId: string,
  paidAmount?: number
): Promise<ZaloPayIpnResult> {
  // 1. Tìm đơn hàng theo mã giao dịch ZaloPay (app_trans_id)
  const payment = await prisma.payment.findFirst({
    where: { transactionCode: appTransId },
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
    return {
      return_code: 0,
      return_message: `Không tìm thấy đơn hàng với app_trans_id: ${appTransId}`,
    };
  }

  // 2. IDEMPOTENCY CHECK:
  // Nếu đơn hàng đã hoàn tất thành công từ trước, trả về ngay lập tức
  if (payment.status === PaymentStatus.Success) {
    const ticketsCount = await prisma.ticket.count({ where: { paymentId: payment.id } });
    return {
      return_code: 1,
      return_message: 'success',
      payment_id: payment.id,
      tickets_created_count: ticketsCount,
      already_processed: true,
    };
  }

  // Xác thực số tiền thanh toán nếu có
  if (paidAmount !== undefined && !isNaN(paidAmount)) {
    if (Math.abs(Number(payment.amount) - Number(paidAmount)) > 1) {
      console.warn(
        `[ZaloPay IPN] Cảnh báo chênh lệch số tiền: Đơn hàng #${payment.id} có giá ${Number(payment.amount)}, nhận được ${paidAmount}`
      );
    }
  }

  // 3. THỰC THI TRANSACTION ATOMIC
  const createdTickets = await prisma.$transaction(async (tx) => {
    // 3.1. Cập nhật Payment -> Success
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.Success,
      },
    });

    // 3.2. Cập nhật các ghế sang trạng thái OCCUPIED
    let seatIds: number[] = [];
    if (Array.isArray(payment.seatIds)) {
      seatIds = payment.seatIds as number[];
    }

    const screeningId = payment.screeningId;
    const ticketsCreated = [];

    if (seatIds.length > 0) {
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: SeatStatus.OCCUPIED,
          reservedUntil: null,
        },
      });

      // Lấy giá gốc suất chiếu
      let basePrice = 100000;
      if (screeningId) {
        const sc = await tx.screening.findUnique({
          where: { id: screeningId },
          select: { price: true },
        });
        if (sc) basePrice = Number(sc.price);
      }

      // 3.3. Tạo các bản ghi Ticket hợp lệ
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
        ticketsCreated.push(newTicket);
      }
    }

    // 3.4. Đánh dấu combo_reservations sang COMPLETED (không trừ tồn kho lần 2)
    if (payment.orderCombos && payment.orderCombos.length > 0) {
      for (const orderCombo of payment.orderCombos) {
        await tx.comboReservation.updateMany({
          where: {
            comboId: orderCombo.comboId,
            userId: payment.userId,
            status: 'RESERVED',
          },
          data: {
            status: 'COMPLETED',
          },
        });
      }
    }

    // 3.5. Tăng lượt sử dụng mã giảm giá nếu có
    if (payment.couponCode && payment.couponCode.trim()) {
      await tx.coupon.updateMany({
        where: { code: payment.couponCode.trim().toUpperCase() },
        data: {
          usedCount: { increment: 1 },
        },
      });
    }

    return ticketsCreated;
  });

  // 4. Gửi email xác nhận đặt vé chạy nền
  (async () => {
    try {
      const freshPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
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
        const sc = firstTicket.screening;
        const mv = sc?.movie;
        const seatCodes = freshPayment.tickets
          .map((t) => t.seat?.code)
          .filter(Boolean)
          .join(', ');

        const qrData = JSON.stringify({
          payment_id: freshPayment.id,
          tickets: freshPayment.tickets.map((t) => t.id),
          user_id: freshPayment.userId,
          screening_id: sc?.id,
          app_trans_id: appTransId,
          timestamp: Date.now(),
        });

        await sendTicketConfirmation(
          freshPayment.user.email,
          {
            customerName: freshPayment.user.name || undefined,
            ticketId: firstTicket.id,
            ticketCode: `LMC-ZLP-${freshPayment.id}`,
            movieTitle: mv?.title || 'Phim rạp Lumi Cinema',
            room: sc ? `Phòng ${sc.roomNumber || sc.room}` : 'Phòng tiêu chuẩn',
            screeningTime: sc?.startTime
              ? new Date(sc.startTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Giờ chiếu',
            date: sc?.startTime
              ? new Date(sc.startTime).toLocaleDateString('vi-VN')
              : 'Hôm nay',
            seats: seatCodes || 'Chưa xếp chỗ',
            combos: freshPayment.orderCombos.map((oc) => ({
              name: oc.combo?.name || 'Combo bắp nước',
              quantity: oc.quantity,
            })),
            totalAmount: Number(freshPayment.amount),
            paymentMethod: 'ZaloPay',
          },
          qrData
        );
      }
    } catch (err) {
      console.error('[ZaloPay IPN] Gửi email xác nhận thất bại:', err);
    }
  })();

  return {
    return_code: 1,
    return_message: 'success',
    payment_id: payment.id,
    tickets_created_count: createdTickets.length,
    already_processed: false,
  };
}

/**
 * POST /api/payments/zalopay-ipn
 * 
 * Webhook IPN nhận kết quả thanh toán từ ZaloPay Server:
 * Payload: { data: string, mac: string, type: number }
 */
export async function POST(request: NextRequest) {
  try {
    let body: { data?: string; mac?: string; type?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { return_code: -1, return_message: 'Dữ liệu không đúng định dạng JSON' },
        { status: 400 }
      );
    }

    const { data: dataStr, mac } = body;

    if (!dataStr || !mac) {
      return NextResponse.json(
        { return_code: -1, return_message: 'Thiếu trường data hoặc mac' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra tính hợp lệ của chữ ký callback bằng verifyZaloPayCallback
    const isSignatureValid = verifyZaloPayCallback(dataStr, mac);
    if (!isSignatureValid) {
      console.warn('[ZaloPay IPN] Chữ ký không hợp lệ (mac not equal)');
      return NextResponse.json({
        return_code: -1,
        return_message: 'mac not equal',
      });
    }

    // 2. Parse data thành JSON object lấy app_trans_id và amount
    let parsedData: { app_trans_id?: string; amount?: number };
    try {
      parsedData = JSON.parse(dataStr);
    } catch {
      return NextResponse.json({
        return_code: 0,
        return_message: 'Dữ liệu data trong callback không thể parse JSON',
      });
    }

    const appTransId = parsedData.app_trans_id;
    if (!appTransId) {
      return NextResponse.json({
        return_code: 0,
        return_message: 'Thiếu thông tin app_trans_id trong data',
      });
    }

    // 3. Xử lý cập nhật đơn hàng qua Database Transaction
    const result = await processZaloPayPaymentSuccess(appTransId, parsedData.amount);

    return NextResponse.json({
      return_code: result.return_code,
      return_message: result.return_message,
    });
  } catch (error) {
    console.error('[ZaloPay IPN] Lỗi hệ thống khi xử lý callback:', error);
    return NextResponse.json({
      return_code: 0,
      return_message: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

/**
 * GET /api/payments/zalopay-ipn
 * Endpoint hỗ trợ kiểm thử thủ công và monitoring
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appTransId = searchParams.get('app_trans_id') || searchParams.get('txn_code');
  const mac = searchParams.get('mac');
  const isMock = searchParams.get('mock') === 'true';

  if (!appTransId) {
    return NextResponse.json(
      { return_code: 0, return_message: 'Thiếu tham số app_trans_id' },
      { status: 400 }
    );
  }

  if (mac) {
    const testData = JSON.stringify({ app_trans_id: appTransId });
    const isValid = verifyZaloPayCallback(testData, mac);
    if (!isValid && !isMock) {
      return NextResponse.json({ return_code: -1, return_message: 'mac not equal' });
    }
  }

  const result = await processZaloPayPaymentSuccess(appTransId);
  return NextResponse.json(result);
}
